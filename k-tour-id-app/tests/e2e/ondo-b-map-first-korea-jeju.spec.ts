import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seed(page: Page, locale: "en" | "ko" | "ja") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_trip",
      discoveryArea: null,
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
        await page.goto("/", { waitUntil: "domcontentloaded" })

        const atlas = page.getByTestId("ondo-b-korea-atlas")
        await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-hydrated", "true")
        await expect(atlas).toBeVisible()
        const atlasScrim = await atlas.evaluate((element) => {
          const style = getComputedStyle(element, "::before")
          return {
            transform: style.transform,
            left: style.left,
            right: style.right,
            width: style.width,
            borderWidth: style.borderTopWidth,
            boxShadow: style.boxShadow,
          }
        })
        expect(atlasScrim.transform, "the map readability scrim must not inherit the retired tilted-paper transform").toBe("none")
        expect(atlasScrim.left).toBe("0px")
        expect(atlasScrim.right).toBe("0px")
        expect(Number.parseFloat(atlasScrim.width)).toBeGreaterThan(0)
        expect(atlasScrim.borderWidth).toBe("0px")
        expect(atlasScrim.boxShadow).toBe("none")
        await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")
        await page.waitForFunction(() => {
          const plot = document.querySelector<HTMLElement>("[data-testid='ondo-b-atlas-plot']")
          const pin = document.querySelector<HTMLElement>("[data-testid='ondo-b-atlas-plot'] [data-city='seoul']")
          if (!plot || !pin) return false
          const plotStyle = getComputedStyle(plot)
          const pinStyle = getComputedStyle(pin)
          return plotStyle.position === "absolute"
            && pinStyle.position === "absolute"
            && pinStyle.display === "block"
            && Number.parseFloat(pinStyle.width) >= 44
            && Number.parseFloat(pinStyle.minHeight) >= 44
        })
        await page.evaluate(() => document.fonts.ready)
        await expect.poll(() => atlas.locator("[data-city]").evaluateAll((nodes) => nodes.every((node) => (
          (node as HTMLElement).offsetHeight >= 44
            && node.getAnimations().every((animation) => animation.playState !== "running")
        )))).toBe(true)
        await page.waitForTimeout(100)
        await expect.poll(() => atlas.locator("[data-city]").evaluateAll((nodes) => nodes.every((node) => (
          (node as HTMLElement).offsetHeight >= 44
        )))).toBe(true)
        await expect(page.getByTestId("ondo-b-japan-first-discovery")).toHaveCount(0)
        const atlasBox = await box(atlas)
        const plotBox = await box(atlas.getByTestId("ondo-b-atlas-plot"))
        expect(atlasBox.height / viewport.height).toBeGreaterThanOrEqual(.52)
        const cityBoxes: Array<Awaited<ReturnType<typeof box>>> = []
        const pinBoxes: Array<Awaited<ReturnType<typeof box>>> = []
        const cityCoordinates = {
          seoul: { latitude: "37.5665", longitude: "126.978" },
          busan: { latitude: "35.1796", longitude: "129.0756" },
          jeju: { latitude: "33.4996", longitude: "126.5312" },
        } as const
        const cityLabels = {
          en: { seoul: "Seoul", busan: "Busan", jeju: "Jeju" },
          ko: { seoul: "서울", busan: "부산", jeju: "제주" },
          ja: { seoul: "ソウル", busan: "釜山", jeju: "済州" },
        } as const
        for (const city of ["seoul", "busan", "jeju"] as const) {
          const node = atlas.locator(`[data-city='${city}']`)
          await expect(node).toBeVisible()
          await expect(node).toHaveAttribute("data-atlas-pin", "true")
          await expect(node).toHaveAttribute("data-atlas-latitude", cityCoordinates[city].latitude)
          await expect(node).toHaveAttribute("data-atlas-longitude", cityCoordinates[city].longitude)
          await expect(node).not.toHaveAttribute("data-atlas-x", /.+/)
          await expect(node).not.toHaveAttribute("data-atlas-y", /.+/)
          await expect(node).toHaveAttribute("data-map-projected", "true")
          await expect(node).toHaveText(cityLabels[locale][city])
          await expect(node.locator("[data-region-kind-label]")).toHaveCount(0)
          await node.focus()
          await expect(node).toBeFocused()
          const nodeBox = await box(node)
          const pinBox = await box(node.locator("i"))
          const labelBox = await box(node.locator("span"))
          const touchTargetHeight = await node.evaluate((element) => (element as HTMLElement).offsetHeight)
          expect(touchTargetHeight, `${locale} ${viewport.width}x${viewport.height} ${city} touch target`).toBeGreaterThanOrEqual(44)
          expect(nodeBox.x).toBeGreaterThanOrEqual(atlasBox.x - .5)
          expect(nodeBox.x + nodeBox.width).toBeLessThanOrEqual(atlasBox.x + atlasBox.width + .5)
          expect(nodeBox.y).toBeGreaterThanOrEqual(atlasBox.y - .5)
          expect(nodeBox.y + nodeBox.height).toBeLessThanOrEqual(atlasBox.y + atlasBox.height + .5)
          const projected = await node.evaluate((element) => ({
            x: Number(element.getAttribute("data-map-x")),
            y: Number(element.getAttribute("data-map-y")),
          }))
          expect(Math.abs(pinBox.x + pinBox.width / 2 - (plotBox.x + projected.x))).toBeLessThanOrEqual(2)
          expect(Math.abs(pinBox.y + pinBox.height / 2 - (plotBox.y + projected.y))).toBeLessThanOrEqual(2)
          expect(intersects(pinBox, labelBox), `${locale} ${viewport.width}x${viewport.height} ${city} label clears its beacon`).toBe(false)
          expect(await node.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            return document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)?.closest("[data-city]") === element
          }), `${locale} ${viewport.width}x${viewport.height} ${city} owns its centre`).toBe(true)
          cityBoxes.push(nodeBox)
          pinBoxes.push(pinBox)
        }
        const pinCenter = (pin: Awaited<ReturnType<typeof box>>) => ({ x: pin.x + pin.width / 2, y: pin.y + pin.height / 2 })
        const [seoulPin, busanPin, jejuPin] = pinBoxes.map(pinCenter)
        expect(seoulPin.x).toBeLessThan(busanPin.x)
        expect(seoulPin.y).toBeLessThan(busanPin.y)
        expect(jejuPin.x).toBeLessThan(busanPin.x)
        expect(jejuPin.y).toBeGreaterThan(busanPin.y)
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
        await expect(atlas.locator("[data-city='jeju']")).toHaveAttribute("data-signal-state", "limited")
        await expect(atlas.locator("[data-city='jeju']")).toHaveAttribute("data-temperature-score", "none")
        await expect(atlas.locator("[data-city='jeju']")).not.toHaveAttribute("data-official-count", /.+/)
        await expect(atlas.locator("[data-city] svg.lucide-map-pin")).toHaveCount(0)
        await expect(atlas.locator("[data-city] svg.lucide-sparkles")).toHaveCount(0)
        await expect(atlas).not.toContainText(/\bExplore\b|탐색|探す/)
        for (const city of ["seoul", "busan", "jeju"] as const) {
          const node = atlas.locator(`[data-city='${city}']`)
          await expect(node).not.toContainText(/\d|official|공식|record|기록|active|growing|운영|확장/i)
          await expect(node.locator("i")).toHaveCount(1)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

        // Geometry is asserted at every breakpoint; run the full history and
        // editorial interaction once at the canonical mobile viewport so the
        // matrix does not repeatedly reinitialize Next's client router while
        // the same page is being resized in place.
        if (viewport.width !== 390) continue

        await atlas.locator("[data-city='jeju']").click()
        await expect(page).toHaveURL(/city=jeju/)
        const transitionedMap = page.getByTestId("maplibre-map")
        await expect(transitionedMap).toHaveAttribute("data-city-focus-target", "jeju")
        await expect(transitionedMap).toHaveAttribute("data-city-focus-duration", "340")
        expect(Number(await transitionedMap.getAttribute("data-city-focus-start-delay"))).toBeLessThanOrEqual(100)
        const cityRoot = page.getByTestId("ondo-b-map-entry")
        await expect(cityRoot).toHaveAttribute("data-requested-view", "map")
        await expect(cityRoot).toHaveAttribute("data-effective-view", "map")
        await expect(cityRoot).toHaveAttribute("data-editorial-point-count", "8")
        await expect(cityRoot).toHaveAttribute("data-editorial-temperature-mode", "editorial-coverage")
        await expect(cityRoot).toHaveAttribute("data-editorial-temperature-score", "none")
        await expect(page.getByTestId("ondo-b-pulse-city-status")).toHaveAttribute("data-pulse-city-status", "editorial-limited")
        await expect(cityRoot).toHaveAttribute("data-temperature-visual-grammar", "shared-field-aura-core-scale-selection-capsule")
        await expect(cityRoot).toHaveAttribute("data-temperature-model", "editorial-unscored")
        await expect(cityRoot).toHaveAttribute("data-temperature-shell", "city-map")
        const accessibleEditorialMarkers = page.getByTestId("ondo-b-pulse-marker-accessible-detail").locator("li")
        await expect(accessibleEditorialMarkers).toHaveCount(8)
        const accessibleEditorialText = await accessibleEditorialMarkers.allTextContents()
        expect(accessibleEditorialText.every((label) => !/\b(?:peak|hot|rising)\b|피크|핫|상승|ピーク|ホット|上昇/i.test(label))).toBe(true)
        await expect(cityRoot).not.toHaveAttribute("data-city-record-count", /.+/)
        await expect(page.getByTestId("ondo-b-search-shell")).toBeVisible()
        await expect(page.getByTestId("ondo-b-category-rail")).toBeVisible()
        await expect(page.getByTestId("ondo-b-location-message")).toBeVisible()
        await expect(page.getByTestId("ondo-b-locate")).toBeVisible()
        await expect(page.getByTestId("ondo-b-view-toggle")).toBeVisible()
        await page.getByTestId("ondo-b-category-rail").locator("[data-editorial-category='food']").click()
        await expect(cityRoot).toHaveAttribute("data-result-count", "3")
        await page.getByTestId("ondo-b-category-rail").locator("[data-editorial-category='all']").click()
        await expect(cityRoot).toHaveAttribute("data-result-count", "8")
        await expect(page.getByTestId("maplibre-map")).toBeVisible()
        await page.getByTestId("ondo-b-view-toggle").click()
        await expect(cityRoot).toHaveAttribute("data-effective-view", "list")
        const editorialList = page.getByTestId("ondo-b-editorial-place-list")
        await expect(editorialList).toHaveAttribute("data-list-grammar", "shared-place-cards")
        const editorialRows = editorialList.locator("[data-editorial-place-id]")
        await expect(editorialRows).toHaveCount(8)
        expect(await editorialRows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-pulse-priority")))).toEqual(Array(8).fill("limited"))
        const editorialPulseNodes = editorialRows.locator("[data-testid='ondo-b-list-pulse']")
        expect(await editorialPulseNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-pulse-level")))).toEqual(Array(8).fill("limited"))
        expect(await editorialPulseNodes.evaluateAll((nodes) => nodes.every((node) => node.getAttribute("aria-hidden") === "true" && !node.hasAttribute("role")))).toBe(true)
        const editorialLabels = await editorialRows.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label") ?? ""))
        expect(editorialLabels.every((label) => !/\b(?:peak|hot|rising)\b|피크|핫|상승|ピーク|ホット|上昇/i.test(label))).toBe(true)
        await expect(editorialList.locator("[data-photo-kind='editorial-collection']")).toHaveCount(8)
        await page.getByTestId("ondo-b-view-toggle").click()
        await expect(cityRoot).toHaveAttribute("data-effective-view", "map")
        const editorialTemperatureKey = page.getByTestId("ondo-b-map-key")
        await expect(editorialTemperatureKey).toHaveAttribute("data-editorial-temperature-key", "unscored")
        await expect(editorialTemperatureKey.getByTestId("ondo-b-pulse-legend").locator("[data-level]")).toHaveCount(0)
        const editorialLegendCoverage = editorialTemperatureKey.getByTestId("ondo-b-pulse-legend").locator("[data-coverage-intensity]")
        await expect(editorialLegendCoverage).toHaveCount(3)
        expect(await editorialLegendCoverage.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-coverage-intensity")))).toEqual(["sparse", "clustered", "dense"])
        await expect(editorialTemperatureKey).toHaveAttribute("data-pulse-key-presentation", "compact-coverage")
        await expect(page.getByTestId("ondo-b-pulse-scale")).toHaveAttribute("data-editorial-coverage-scale", "true")
        const editorialTemperatureKeyBox = await box(editorialTemperatureKey)
        expect(editorialTemperatureKeyBox.x).toBeGreaterThanOrEqual(-.5)
        expect(editorialTemperatureKeyBox.x + editorialTemperatureKeyBox.width).toBeLessThanOrEqual(viewport.width + .5)

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
          const hasMap = document.querySelector("[data-testid='maplibre-map']") !== null
          const hasList = root.querySelector("[data-testid='ondo-b-list-panel']") !== null
          const hasFallback = root.querySelector("[data-testid='ondo-b-map-fallback-status']") !== null
          const hasTransport = root.querySelector("[data-testid='ondo-b-map-transport-status']") !== null
          const partial = root.getAttribute("data-map-partial-failure")
          return mapState === "error"
            ? hasList && hasFallback
            : partial === "recoverable"
              ? hasMap && hasTransport && !hasList && !hasFallback
              : hasMap && !hasTransport && !hasList && !hasFallback
        })).toBe(true)
        await expect(page.getByTestId("ondo-b-japan-first-discovery")).toHaveAttribute("data-city-context", "seoul")
      }
    })
  }

  test("the latest same-frame city intent wins and reduced motion jumps", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seed(page, "en")
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")
    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>("[data-testid='ondo-b-korea-atlas'] [data-city='seoul']")?.click()
      document.querySelector<HTMLButtonElement>("[data-testid='ondo-b-korea-atlas'] [data-city='busan']")?.click()
    })
    await expect(page).toHaveURL(/city=busan/)
    const map = page.getByTestId("maplibre-map")
    await expect(map).toHaveAttribute("data-city-focus-target", "busan")
    await expect(map).toHaveAttribute("data-city-focus-duration", "0")
    expect(Number(await map.getAttribute("data-city-focus-start-delay"))).toBeLessThanOrEqual(100)
  })

  test("desktop hover preserves the geographic beacon coordinate", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, "en")
    await page.goto("/", { waitUntil: "domcontentloaded" })
    const beacon = page.getByTestId("ondo-b-korea-atlas").locator("[data-city='seoul']")
    await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")
    await expect(beacon).toBeVisible()
    const before = await box(beacon)
    await beacon.hover()
    await page.waitForTimeout(220)
    const after = await box(beacon)
    expect(Math.abs(before.x - after.x)).toBeLessThanOrEqual(.25)
    expect(Math.abs(before.y - after.y)).toBeLessThanOrEqual(.25)
    expect(Math.abs(before.width - after.width)).toBeLessThanOrEqual(.25)
    expect(Math.abs(before.height - after.height)).toBeLessThanOrEqual(.25)
    await beacon.locator("span").hover()
    await page.waitForTimeout(180)
    const afterLabelHover = await box(beacon)
    expect(await beacon.evaluate((element) => element.matches(":hover"))).toBe(true)
    expect(Math.abs(before.x - afterLabelHover.x)).toBeLessThanOrEqual(.25)
    expect(Math.abs(before.y - afterLabelHover.y)).toBeLessThanOrEqual(.25)
  })
})
