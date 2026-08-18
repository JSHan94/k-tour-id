import { expect, test, type Page } from "@playwright/test"

async function ready(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript(({ locale }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale, guideSeen: true, autoNight: true, savedVenueIds: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST" }))
  }, { locale })
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
}

test("VIS-MAP-01 nationwide ONDO", async ({ page }) => {
  await ready(page)
  await page.goto("/ondo")
  await expect(page.getByTestId("ondo-map-entry")).toHaveAttribute("data-map-level", "nation")
  await expect(page.getByTestId("ondo-map-entry")).toHaveScreenshot("PX-001__VIS-MAP-01__en__390x844.png", {
    animations: "disabled",
    mask: [page.locator(".leaflet-tile-pane")],
  })
})

test("VIS-MAP-02 Seoul neighborhood", async ({ page }) => {
  await ready(page, "ko")
  await page.goto("/ondo?city=seoul")
  await expect(page.getByTestId("ondo-map-entry")).toHaveAttribute("data-map-level", /city|neighborhood/)
  await expect(page.getByTestId("ondo-map-entry")).toHaveScreenshot("PX-002__VIS-MAP-02__ko__390x844.png", {
    animations: "disabled",
    mask: [page.locator(".leaflet-tile-pane")],
  })
})

test("VIS-MAP-05 tile fallback list", async ({ page }) => {
  await ready(page, "ko")
  await page.goto("/ondo?scenario=tile-error&view=list")
  await expect(page.getByTestId("tile-error-notice")).toBeVisible()
  await expect(page.getByTestId("ondo-map-entry")).toHaveScreenshot("PX-005__VIS-MAP-05__ko__390x844.png", { animations: "disabled" })
})
