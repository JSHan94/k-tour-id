import { expect, test } from "@playwright/test"

test("ONDO shell keeps the map, place peek, After 19, and navigation inside the viewport", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: "ACC-GUEST",
      person: "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
      after19: "A19-OFF",
    }))
  })
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await expect(page.getByTestId("place-peek")).toBeVisible()
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible()
  await expect(page).toHaveScreenshot("ondo-shell-place-peek.png", { animations: "disabled" })
})
