import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-19T12:00:00+09:00"))
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST" }))
  })
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
})

test("VIS-MAP-03 venue peek", async ({ page }) => {
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await expect(page.getByTestId("place-peek")).toBeVisible()
  await expect(page.getByTestId("ondo-map-entry")).toHaveScreenshot("PX-003__VIS-MAP-03__en__390x844.png", {
    animations: "disabled",
    mask: [page.locator(".leaflet-tile-pane")],
  })
})

test("VIS-MAP-04 venue detail and Before you go", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await page.getByTestId("place-details").click()
  await expect(page.getByTestId("place-overlay")).toHaveScreenshot("PX-004__VIS-MAP-04__en__430x932.png", { animations: "disabled" })
})
