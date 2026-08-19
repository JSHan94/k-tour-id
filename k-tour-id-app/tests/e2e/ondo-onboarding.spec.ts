import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("ondo.preferences.v3")
    sessionStorage.removeItem("ondo.session.v3")
  })
})

test("E2E-ONB-01 short-term onboarding finishes on the map without verification", async ({ page }) => {
  await page.goto("/ondo")
  const onboarding = page.getByTestId("ondo-onboarding")
  await expect(onboarding).toBeVisible()
  await page.getByRole("button", { name: "Get started" }).click()
  await page.getByTestId("persona-short_term").click()
  await page.getByRole("button", { name: "Choose meal preferences" }).click()
  await page.getByRole("button", { name: "Local classics" }).click()
  await page.getByTestId("onboarding-finish").click()
  await expect(onboarding).toBeHidden()
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").person)).toBe("PER-UNVERIFIED")
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").age)).toBe("AGE-UNVERIFIED")
})

test("E2E-ONB-02 Korean local onboarding never auto-starts CX", async ({ page }) => {
  await page.goto("/ondo")
  await page.getByRole("button", { name: "Get started" }).click()
  await page.getByTestId("persona-korean_local").click()
  await page.getByRole("button", { name: "Choose meal preferences" }).click()
  await page.getByTestId("onboarding-finish").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").person)).toBe("PER-UNVERIFIED")
})

test("E2E-ONB-03 resident preference failure falls back to the map", async ({ page }) => {
  await page.goto("/ondo?onboarding=failure")
  await page.getByRole("button", { name: "Get started" }).click()
  await page.getByTestId("persona-long_term_resident").click()
  await page.getByRole("button", { name: "Choose meal preferences" }).click()
  await page.getByTestId("onboarding-finish").click()
  await expect(page.getByText("We could not save those preferences.")).toContainText("still explore")
  await page.getByTestId("onboarding-finish").click()
  await expect(page.getByTestId("ondo-onboarding")).toBeHidden()
  await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
})

test("Guest skip reaches the map with no account or KYC", async ({ page }) => {
  await page.goto("/ondo")
  await page.getByRole("button", { name: "Explore as a guest" }).click()
  await expect(page.getByTestId("ondo-onboarding")).toBeHidden()
  await expect.poll(() => page.evaluate(() => {
    const state = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
    return [state.account, state.person, state.age, state.paymentKyc]
  })).toEqual(["ACC-GUEST", "PER-UNVERIFIED", "AGE-UNVERIFIED", "PKY-NOT-STARTED"])
})
