import { expect, test } from "@playwright/test"

test("VIS-HEAT-01 six-level legend uses color, number, and labels", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST" }))
  })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "About ONDO heat" }).click()
  const legend = page.getByTestId("heat-legend")
  await expect(legend).toContainText("Calm")
  await expect(legend).toContainText("More signals needed")
  await expect(legend).toHaveScreenshot("PX-006__VIS-HEAT-01__en__390x844.png", { animations: "disabled" })
})

test("VIS-HEAT-02 selected marker keeps confidence and exact coordinates", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "ko", guideSeen: true, autoNight: true, savedVenueIds: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST" }))
  })
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await expect(page.getByTestId("venue-marker-seoul-seongsu-gukbap")).toHaveAttribute("data-latitude", "37.54463")
  await expect(page.getByTestId("ondo-map-entry")).toHaveScreenshot("PX-007__VIS-HEAT-02__ko__390x844.png", {
    animations: "disabled",
    mask: [page.locator(".leaflet-tile-pane")],
  })
})
