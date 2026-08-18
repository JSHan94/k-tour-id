import { expect, test, type Page } from "@playwright/test"

async function seed(page: Page, account = false) {
  await page.addInitScript(({ account }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: account ? "ACC-ACTIVE" : "ACC-GUEST" }))
  }, { account })
}

test.describe("ONDO venue detail", () => {
  test("E2E-PLACE-01 shows scoped visit facts and a real external directions handoff", async ({ page }) => {
    await seed(page)
    await page.goto("/ondo?venueId=seoul-seongsu-gukbap")

    await expect(page.getByTestId("place-peek")).toContainText("Seongsu Dwaeji Gukbap")
    const directions = page.getByTestId("venue-directions")
    await expect(directions).toHaveAttribute("href", /google\.com\/maps\/dir\/.*37\.54463%2C127\.05591/)
    await expect(directions).toHaveAttribute("target", "_blank")

    await page.getByTestId("place-details").click()
    const detail = page.getByTestId("place-overlay")
    await expect(detail).toContainText("Foreign-issued cards accepted")
    await expect(detail).toContainText("Korean phone number not required")
    await expect(detail).toContainText("English menu available")
    await expect(detail).toContainText("No age restriction")
    await expect(detail).toContainText("Please also check the venue’s latest information")
  })

  test("Guest save starts account JIT without claiming person verification", async ({ page }) => {
    await seed(page)
    await page.goto("/ondo?venueId=seoul-euljiro-nogari")
    await page.getByTestId("place-details").click()
    await page.getByTestId("venue-save").click()

    await expect(page.getByTestId("save-account-gate-hint")).toContainText("Create an account to save")
    await expect(page.getByTestId("save-account-gate-hint")).toContainText("person verification is not required")
    await expect(page).toHaveURL(/venueId=seoul-euljiro-nogari/)
  })

  test("an active account can save once and the venue remains selected", async ({ page }) => {
    await seed(page, true)
    await page.goto("/ondo?venueId=seoul-mangwon-kalguksu")
    await page.getByTestId("place-details").click()
    const save = page.getByTestId("venue-save")
    await save.click()
    await expect(save).toBeDisabled()
    await expect(save).toHaveAttribute("aria-label", "Saved")
    await expect(page).toHaveURL(/venueId=seoul-mangwon-kalguksu/)
  })

  test("Table CTA changes product context instead of becoming a dead action", async ({ page }) => {
    await seed(page)
    await page.goto("/ondo?venueId=busan-jagalchi-grill")
    await page.getByTestId("place-details").click()
    await page.getByTestId("venue-tables").click()
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Tables" })).toHaveAttribute("aria-current", "page")
  })
})
