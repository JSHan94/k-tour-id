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

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x)
    && Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y)
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
        const atlasBox = await box(atlas)
        expect(atlasBox.height / viewport.height).toBeGreaterThanOrEqual(.52)
        const cityBoxes: Array<Awaited<ReturnType<typeof box>>> = []
        for (const city of ["seoul", "busan", "jeju"] as const) {
          const node = atlas.locator(`[data-city='${city}']`)
          await expect(node).toBeVisible()
          const nodeBox = await box(node)
          expect(nodeBox.height).toBeGreaterThanOrEqual(44)
          expect(await node.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            return document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)?.closest("[data-city]") === element
          })).toBe(true)
          cityBoxes.push(nodeBox)
        }
        expect(intersects(cityBoxes[0], cityBoxes[1])).toBe(false)
        expect(intersects(cityBoxes[0], cityBoxes[2])).toBe(false)
        expect(intersects(cityBoxes[1], cityBoxes[2])).toBe(false)
        const truthSummary = atlas.getByTestId("ondo-b-city-truth-legend").locator(":scope > summary")
        const truthBox = await box(truthSummary)
        expect(intersects(cityBoxes[0], truthBox)).toBe(false)
        expect(intersects(cityBoxes[1], truthBox)).toBe(false)
        expect(intersects(cityBoxes[2], truthBox)).toBe(false)
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
        await expect(layer).toHaveAttribute("data-geometry-basis", "region")
        await expect(layer).toHaveAttribute("data-place-point-count", "0")
        await expect(page.getByTestId("ondo-b-editorial-collection-marker")).toBeVisible()
        await page.goBack()
        await expect(atlas.locator("[data-city='jeju']")).toBeFocused()
        await page.goForward()
        await expect(layer.locator(":scope > summary")).toBeFocused()
        const map = page.getByTestId("maplibre-map")
        await expect(map).toHaveAttribute("data-editorial-inert", "false")
        await layer.locator(":scope > summary").click()
        await expect(map).toHaveAttribute("inert", "")
        await expect(map).toHaveAttribute("aria-hidden", "true")
        await expect(map).toHaveAttribute("data-editorial-inert", "true")
        await expect(page.getByTestId("ondo-b-pulse-marker-accessible-detail")).toHaveAttribute("aria-hidden", "true")
        await expect(page.getByTestId("ondo-b-map-loading")).toHaveCount(0)
        for (let index = 0; index < 8; index += 1) {
          await page.keyboard.press("Tab")
          expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[data-testid='maplibre-map']")))).toBe(false)
        }
        await expect(page.getByTestId("ondo-b-jeju-editorial-seeds")).toBeVisible()
        await expect(layer).not.toContainText(/200 official|공식 기록 200|Directions|길찾기/)
        await layer.locator(":scope > summary").click()
        await expect(map).not.toHaveAttribute("inert", "")
        await expect(map).not.toHaveAttribute("aria-hidden", "true")
        await expect(map).toHaveAttribute("data-editorial-inert", "false")
        await expect(page.getByTestId("ondo-b-pulse-marker-accessible-detail")).not.toHaveAttribute("aria-hidden", "true")

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
