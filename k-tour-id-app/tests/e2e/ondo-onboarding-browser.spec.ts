import { expect, test, type Page } from "@playwright/test"

const PERSONAS = ["short_term", "long_term_resident", "korean_local"] as const

async function resetOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem("ondo.preferences.v3")
    sessionStorage.removeItem("ondo.session.v3")
  })
}

async function persistedSession(page: Page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}") as Record<string, unknown>)
}

for (const persona of PERSONAS) {
  test(`browser onboarding completes ${persona} intent without starting identity`, async ({ page }) => {
    await resetOnboarding(page)
    await page.goto("/ondo")

    await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
    await page.getByRole("button", { name: "Get started" }).click()
    await page.getByTestId(`persona-${persona}`).click()
    const continueToPreferences = page.getByRole("button", { name: "Choose meal preferences", exact: true })
    await expect(continueToPreferences).toBeVisible()
    await expect(page.getByRole("button", { name: "Open the ONDO map", exact: true })).toHaveCount(0)
    await continueToPreferences.click()
    await expect(page.getByTestId("onboarding-step-preferences")).toBeVisible()
    await expect(page.getByRole("button", { name: "Open the ONDO map", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Local classics" }).click()
    await page.getByTestId("onboarding-finish").click()

    await expect(page.getByTestId("ondo-onboarding")).toBeHidden()
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible()
    await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
    await expect.poll(async () => {
      const state = await persistedSession(page)
      return [state.onboarding, state.persona, state.account, state.person, state.age, state.paymentKyc]
    }).toEqual(["ONB-COMPLETE", persona, "ACC-GUEST", "PER-UNVERIFIED", "AGE-UNVERIFIED", "PKY-NOT-STARTED"])
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}").discoveryPreferences)).toEqual(["classic"])
  })
}

test("browser guest skip lands on ONDO with every verification boundary untouched", async ({ page }) => {
  await resetOnboarding(page)
  await page.goto("/ondo")
  await page.getByRole("button", { name: "Explore as a guest" }).click()

  await expect(page.getByTestId("ondo-onboarding")).toBeHidden()
  await expect(page.getByRole("button", { name: "ONDO", exact: true })).toHaveAttribute("aria-current", "page")
  await expect.poll(async () => {
    const state = await persistedSession(page)
    return [state.account, state.person, state.age, state.paymentKyc]
  }).toEqual(["ACC-GUEST", "PER-UNVERIFIED", "AGE-UNVERIFIED", "PKY-NOT-STARTED"])
})

test("browser Korean persona CTA names the preferences step before the map", async ({ page }) => {
  await resetOnboarding(page)
  await page.goto("/ondo")
  await page.getByRole("button", { name: "KO", exact: true }).click()
  await page.getByRole("button", { name: "시작하기", exact: true }).click()
  await page.getByTestId("persona-long_term_resident").click()

  const continueToPreferences = page.getByRole("button", { name: "한 끼 취향 고르기", exact: true })
  await expect(continueToPreferences).toBeVisible()
  await expect(page.getByRole("button", { name: "ONDO 지도 열기", exact: true })).toHaveCount(0)
  await continueToPreferences.click()
  await expect(page.getByTestId("onboarding-step-preferences")).toBeVisible()
  await expect(page.getByRole("button", { name: "ONDO 지도 열기", exact: true })).toBeVisible()
})

test("onboarding traps focus inside the modal surface", async ({ page }) => {
  await resetOnboarding(page)
  await page.goto("/ondo")
  await expect(page.getByRole("button", { name: "Get started" })).toBeFocused()

  await page.getByRole("button", { name: "Explore as a guest" }).focus()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "KO", exact: true })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(page.getByRole("button", { name: "Explore as a guest" })).toBeFocused()
})
