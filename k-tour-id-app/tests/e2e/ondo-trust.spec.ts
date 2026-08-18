import { expect, test } from "@playwright/test"

test("four activity axes remain separate with no composite safety score", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-ACTIVE", person: "PER-VERIFIED", reputation: { identity: "verified", visit: "repeat", contribution: "helpful", meetup: "reliable" } }))
  })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "ID", exact: true }).click()
  const trust = page.getByTestId("ondo-trust-panel")
  await expect(trust).toContainText("Person check")
  await expect(trust).toContainText("Confirmed visits")
  await expect(trust).toContainText("Helpful contributions")
  await expect(trust).toContainText("Completed Tables")
  await expect(trust.locator("[data-testid='trust-score'], [data-testid='safety-score']")).toHaveCount(0)
  await expect(trust).not.toContainText(/\b(?:[1-9]\d?|100)\s*\/\s*100\b/)
})
