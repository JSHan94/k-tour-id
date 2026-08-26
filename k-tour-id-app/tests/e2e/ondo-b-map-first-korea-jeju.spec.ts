import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seed(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
}

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value!
}

test.describe("map-first Korea and Jeju integration", () => {
  test.describe.configure({ timeout: 120_000 })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} keeps one map skeleton across the responsive matrix`, async ({ page }) => {
      for (const viewport of [
        { width: 320, height: 720 },
        { width: 390, height: 844 },
        { width: 844, height: 390 },
        { width: 1440, height: 1000 },
      ]) {
        await page.setViewportSize(viewport)
        await seed(page, locale)
        await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

        const atlas = page.getByTestId("ondo-b-korea-atlas")
        await expect(atlas).toBeVisible()
        await expect(page.getByTestId("ondo-b-japan-first-discovery")).toHaveCount(0)
        for (const city of ["seoul", "busan", "jeju"] as const) {
          const node = atlas.locator(`[data-city='${city}']`)
          await expect(node).toBeVisible()
          expect((await box(node)).height).toBeGreaterThanOrEqual(44)
        }
        await expect(atlas.locator("[data-city='jeju']")).toHaveAttribute("data-truth-kind", "editorial-region")
        await expect(atlas.locator("[data-city='jeju']")).not.toHaveAttribute("data-official-count", /.+/)
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

        await atlas.locator("[data-city='jeju']").click()
        await expect(page).toHaveURL(/city=jeju/)
        const cityRoot = page.getByTestId("ondo-b-map-entry")
        await expect(cityRoot).toHaveAttribute("data-requested-view", "map")
        await expect(cityRoot).toHaveAttribute("data-effective-view", "map")
        await expect(cityRoot).toHaveAttribute("data-editorial-point-count", "0")
        await expect(cityRoot).not.toHaveAttribute("data-city-record-count", /.+/)
        await expect(page.getByTestId("maplibre-map")).toBeVisible()

        const layer = page.getByTestId("ondo-b-japan-first-discovery")
        await expect(layer).toBeVisible()
        await expect(layer).toHaveAttribute("data-city-context", "jeju")
        await layer.locator(":scope > summary").click()
        await expect(page.getByTestId("ondo-b-jeju-editorial-seeds")).toBeVisible()
        await expect(layer).not.toContainText(/200 official|공식 기록 200|Directions|길찾기/)

        await page.getByTestId("ondo-b-city-back").click()
        await expect(atlas.locator("[data-city='jeju']")).toBeFocused()

        await atlas.locator("[data-city='seoul']").click()
        await expect(page).toHaveURL(/city=seoul/)
        await expect(cityRoot).toHaveAttribute("data-requested-view", "map")
        await expect(cityRoot).toHaveAttribute("data-effective-view", "map")
        await expect(page.getByTestId("ondo-b-list-panel")).toHaveCount(0)
        await expect(page.getByTestId("ondo-b-japan-first-discovery")).toHaveAttribute("data-city-context", "seoul")
      }
    })
  }
})
