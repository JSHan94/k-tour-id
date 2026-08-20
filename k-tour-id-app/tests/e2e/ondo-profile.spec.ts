import { expect, test } from "@playwright/test"

test("Guest public profile is private and does not claim KYC nationality", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST", person: "PER-UNVERIFIED" }))
  })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "ID", exact: true }).click()
  const profile = page.getByTestId("ondo-profile-panel")
  await expect(profile).toContainText("Private by default")
  await expect(profile).toContainText("never copied")
  await expect(profile.getByRole("button", { name: "Edit public fields" })).toHaveCount(0)
})

test("Account chooses consent per self-declared field", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-ACTIVE", person: "PER-UNVERIFIED", profile: { displayName: "Mina", languages: [], shareFrom: false, shareLivesIn: false, shareLanguages: false } }))
  })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "ID", exact: true }).click()
  const profile = page.getByTestId("ondo-profile-panel")
  await profile.getByRole("button", { name: "Edit public fields" }).click()
  await profile.getByRole("textbox", { name: "From", exact: true }).fill("Canada")
  await profile.getByRole("button", { name: "From: private. Show From publicly", exact: true }).click()
  await profile.getByRole("button", { name: "Save selected fields" }).click()
  await expect(profile).toContainText("Canada")
})
