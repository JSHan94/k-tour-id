import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seed(page: Page, locale: "en" | "ko" | "ja") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      savedEditorialPlaceIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      recentEditorialPlaceIds: [],
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

  for (const locale of ["en", "ko", "ja"] as const) {
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
          }), `${locale} ${viewport.width}x${viewport.height} ${city} owns its centre`).toBe(true)
          cityBoxes.push(nodeBox)
        }
        expect(intersects(cityBoxes[0], cityBoxes[1])).toBe(false)
        expect(intersects(cityBoxes[0], cityBoxes[2])).toBe(false)
        expect(intersects(cityBoxes[1], cityBoxes[2])).toBe(false)
        const cityLayoutSizes = await atlas.locator("[data-city]").evaluateAll((nodes) => nodes.map((node) => ({
          width: (node as HTMLElement).offsetWidth,
          height: (node as HTMLElement).offsetHeight,
        })))
        expect(Math.max(...cityLayoutSizes.map(({ width }) => width)) - Math.min(...cityLayoutSizes.map(({ width }) => width))).toBeLessThanOrEqual(1)
        expect(Math.max(...cityLayoutSizes.map(({ height }) => height)) - Math.min(...cityLayoutSizes.map(({ height }) => height))).toBeLessThanOrEqual(1)
        await expect(atlas.getByTestId("ondo-b-city-truth-legend")).toHaveCount(0)
        await expect(atlas.locator("details")).toHaveCount(0)
        expect(await atlas.evaluate((element) => getComputedStyle(element, "::after").content)).toMatch(/none|normal|^""$/)
        await expect(atlas.locator("[data-city='jeju']")).toHaveAttribute("data-truth-kind", "editorial-region")
        await expect(atlas.locator("[data-city='jeju']")).not.toHaveAttribute("data-official-count", /.+/)
        await expect(atlas.locator("[data-city='seoul'] svg.lucide-map-pin, [data-city='busan'] svg.lucide-map-pin")).toHaveCount(2)
        await expect(atlas.locator("[data-city='jeju'] svg.lucide-sparkles")).toHaveCount(1)
        for (const city of ["seoul", "busan", "jeju"] as const) {
          const node = atlas.locator(`[data-city='${city}']`)
          await expect(node).not.toContainText(/\d|official|공식|record|기록|active|growing|운영|확장/i)
          await expect(node.locator("[data-region-kind-label]")).toHaveText(city === "jeju"
            ? { en: "Travel ideas", ko: "여행 아이디어", ja: "旅のアイデア" }[locale]
            : { en: "Food map", ko: "먹거리 지도", ja: "フードマップ" }[locale])
          const [wellBox, iconBox] = await Promise.all([box(node.locator("i")), box(node.locator("i svg"))])
          expect(iconBox.x).toBeGreaterThanOrEqual(wellBox.x)
          expect(iconBox.y).toBeGreaterThanOrEqual(wellBox.y)
          expect(iconBox.x + iconBox.width).toBeLessThanOrEqual(wellBox.x + wellBox.width)
          expect(iconBox.y + iconBox.height).toBeLessThanOrEqual(wellBox.y + wellBox.height)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

        await atlas.locator("[data-city='jeju']").click()
        await expect(page).toHaveURL(/city=jeju/)
        const cityRoot = page.getByTestId("ondo-b-map-entry")
        await expect(cityRoot).toHaveAttribute("data-requested-view", "map")
        await expect(cityRoot).toHaveAttribute("data-effective-view", "map")
        await expect(cityRoot).toHaveAttribute("data-editorial-point-count", "8")
        await expect(cityRoot).not.toHaveAttribute("data-city-record-count", /.+/)
        await expect(page.getByTestId("maplibre-map")).toBeVisible()

        const layer = page.getByTestId("ondo-b-japan-first-discovery")
        await expect(layer).toBeVisible()
        await expect(layer).toHaveAttribute("data-city-context", "jeju")
        await expect(layer).toHaveAttribute("data-geometry-basis", "verified-points")
        await expect(layer).toHaveAttribute("data-place-point-count", "8")
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
        await expect(cityRoot).toHaveAttribute("data-map-state", /loading|ready|error/)
        expect(await cityRoot.evaluate((root) => {
          const mapState = root.getAttribute("data-map-state")
          const hasMap = root.querySelector("[data-testid='maplibre-map']") !== null
          const hasList = root.querySelector("[data-testid='ondo-b-list-panel']") !== null
          const hasFallback = root.querySelector("[data-testid='ondo-b-map-fallback-status']") !== null
          return mapState === "error"
            ? hasList && hasFallback
            : hasMap && !hasList
        })).toBe(true)
        await expect(page.getByTestId("ondo-b-japan-first-discovery")).toHaveAttribute("data-city-context", "seoul")
      }
    })
  }
})
