import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const PERSONAS = ["travelling", "preparing", "local_contributor"] as const

async function openFresh(page: Page) {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("ondo-b.onboarding-restoration-seeded") === "1") return
    localStorage.removeItem(key)
    sessionStorage.setItem("ondo-b.onboarding-restoration-seeded", "1")
  }, DEVICE_KEY)
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
}

async function storedDevice(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>, DEVICE_KEY)
}

for (const persona of PERSONAS) {
  test(`B onboarding completes the ${persona} intent into the same guest Explore`, async ({ page }) => {
    await openFresh(page)
    await page.getByRole("button", { name: "Set guest preferences", exact: true }).click()
    await page.getByTestId(`persona-${persona}`).click()
    await page.getByRole("button", { name: "Choose food preferences", exact: true }).click()
    await page.getByRole("button", { name: "Local classics", exact: true }).click()
    await page.getByRole("button", { name: "Vegetarian", exact: true }).click()
    await page.getByRole("button", { name: "Allergy-aware", exact: true }).click()
    await page.getByTestId("onboarding-finish").click()

    await expect(page.getByTestId("ondo-onboarding")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect(page.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
    for (const testId of ["ondo-gate-overlay", "ondo-identity-entry", "checkout-overlay"]) {
      await expect(page.getByTestId(testId)).toHaveCount(0)
    }
    expect(await storedDevice(page)).toMatchObject({
      locale: "en",
      onboarding: "ONB-COMPLETE",
      persona,
      discoveryPreferences: ["classic", "vegetarian", "allergy_aware"],
    })

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("ondo-onboarding")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  })
}

test("B onboarding skip is persisted and remains an ungated guest Explore path", async ({ page }) => {
  await openFresh(page)
  await page.getByRole("button", { name: "Explore without setup", exact: true }).click()

  await expect(page.getByTestId("ondo-onboarding")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  expect(await storedDevice(page)).toMatchObject({
    onboarding: "ONB-COMPLETE",
    persona: null,
    discoveryPreferences: [],
  })
})

test("B onboarding is fully Korean and resettable from local-device Settings", async ({ page }) => {
  await openFresh(page)
  await page.getByRole("button", { name: "한국어로 보기", exact: true }).click()
  await page.getByRole("button", { name: "게스트 취향 설정", exact: true }).click()
  await page.getByTestId("persona-preparing").click()
  await page.getByRole("button", { name: "음식 취향 고르기", exact: true }).click()
  await expect(page.getByRole("heading", { name: "어떤 음식과 식이 조건을 찾고 있나요?" })).toBeVisible()
  await page.getByRole("button", { name: "비건", exact: true }).click()
  await page.getByTestId("onboarding-finish").click()

  await page.getByTestId("nav-settings").click()
  await page.getByTestId("ondo-b-discovery-settings").locator(":scope > summary").click()
  await page.getByTestId("ondo-b-onboarding-reset").click()
  await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
  await expect(page.getByRole("button", { name: "게스트 취향 설정", exact: true })).toBeFocused()
  expect(await storedDevice(page)).toMatchObject({
    locale: "ko",
    onboarding: "ONB-NEW",
    persona: null,
    discoveryPreferences: [],
  })
})

test("B onboarding traps keyboard focus and remains usable in short landscape", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await openFresh(page)
  const dialog = page.getByTestId("ondo-onboarding")
  const start = page.getByRole("button", { name: "Set guest preferences", exact: true })
  const skip = page.getByRole("button", { name: "Explore without setup", exact: true })
  const firstLanguage = page.getByRole("button", { name: "View in English", exact: true })
  const lastLanguage = page.getByRole("button", { name: "日本語で表示", exact: true })
  const identitySetup = page.getByTestId("k-tour-id-setup-open")
  const sourceBoundary = page.getByTestId("onboarding-source-boundary")
  const sourceSummary = sourceBoundary.locator(":scope > summary")
  const sourceBody = sourceBoundary.locator(":scope > div")

  await expect(dialog).toBeFocused()
  await expect(dialog.getByRole("heading", { level: 1 })).toBeVisible()
  await dialog.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: "instant" }))
  await expect(start).toBeVisible()
  await start.focus()
  await page.keyboard.press("Shift+Tab")
  await expect(lastLanguage).toBeFocused()
  await lastLanguage.focus()
  await page.keyboard.press("Tab")
  await expect(start).toBeFocused()
  await skip.focus()
  await page.keyboard.press("Tab")
  await expect(identitySetup).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(sourceSummary).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(sourceBoundary).toHaveAttribute("open", "")
  const dialogBounds = await dialog.boundingBox()
  const sourceBounds = await sourceBody.boundingBox()
  expect(dialogBounds).not.toBeNull()
  expect(sourceBounds).not.toBeNull()
  expect(sourceBounds!.y).toBeGreaterThanOrEqual(dialogBounds!.y)
  expect(sourceBounds!.y + sourceBounds!.height).toBeLessThanOrEqual(dialogBounds!.y + dialogBounds!.height)
  await page.keyboard.press("Tab")
  await expect(firstLanguage).toBeFocused()
  await expect(sourceBoundary).not.toHaveAttribute("open", "")

  const headingBounds = await dialog.getByRole("heading", { level: 1 }).boundingBox()
  const leadBounds = await page.getByTestId("onboarding-step-value").locator("h1 + p").boundingBox()
  expect(headingBounds).not.toBeNull()
  expect(leadBounds).not.toBeNull()
  expect(headingBounds!.y + headingBounds!.height).toBeLessThanOrEqual(leadBounds!.y)

  const axe = await new AxeBuilder({ page })
    .include("[data-testid='ondo-onboarding']")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})
