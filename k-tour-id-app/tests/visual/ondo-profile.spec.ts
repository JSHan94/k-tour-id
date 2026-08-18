import { expect, test } from "@playwright/test"

test("public profile and four-axis history remain visually separate", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-ACTIVE", person: "PER-VERIFIED", profile: { displayName: "Mina", from: "Canada", livesIn: "Seoul", languages: ["English", "한국어"], shareFrom: true, shareLivesIn: true, shareLanguages: true }, reputation: { identity: "verified", visit: "repeat", contribution: "helpful", meetup: "reliable" } }))
  })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "ID", exact: true }).click()
  await expect(page.getByTestId("ondo-profile-panel")).toBeVisible()
  await expect(page.getByTestId("ondo-trust-panel")).toBeVisible()
  await expect(page).toHaveScreenshot("profile-and-four-axes-en.png", { animations: "disabled", fullPage: true })
})
