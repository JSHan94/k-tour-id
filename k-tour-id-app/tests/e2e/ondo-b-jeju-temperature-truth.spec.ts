import { expect, test, type Page } from "@playwright/test"
import { prepareBVisualPage } from "../helpers/ondo-b-visual-evidence"

const DEVICE_KEY = "ondo-b.device.v1"

test.beforeEach(async ({ page }) => {
  await prepareBVisualPage(page)
})

async function seed(page: Page, locale: "en" | "ko" | "ja" = "en") {
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

test("Jeju stays editorial-unscored across map, list, detail and accessible names", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  await page.goto("/?city=jeju", { waitUntil: "domcontentloaded" })

  const city = page.getByTestId("ondo-b-map-entry")
  await expect(city).toHaveAttribute("data-temperature-model", "editorial-unscored")
  await expect(city).toHaveAttribute("data-editorial-temperature-mode", "editorial-coverage")
  await expect(city).toHaveAttribute("data-editorial-temperature-score", "none")
  await expect(page.getByTestId("ondo-b-pulse-city-status")).toHaveAttribute("data-pulse-city-status", "editorial-limited")

  const accessibleMarkers = page.getByTestId("ondo-b-pulse-marker-accessible-detail").locator("li")
  await expect(accessibleMarkers).toHaveCount(8)
  const markerLabels = await accessibleMarkers.allTextContents()
  expect(markerLabels.every((label) => (
    label.includes("ONDO temperature · Editorial place coverage:")
      && label.includes("No popularity score")
      && /(?:Sparse|Grouped|Dense)/.test(label)
      && !/\b(?:peak|hot|rising)\b/i.test(label)
  ))).toBe(true)

  const key = page.getByTestId("ondo-b-map-key")
  await expect(key).toHaveAttribute("data-editorial-temperature-key", "unscored")
  await expect(key).toHaveAttribute("data-pulse-key-presentation", "compact-coverage")
  await expect(page.getByTestId("ondo-b-pulse-scale")).toHaveAttribute("data-editorial-coverage-scale", "true")
  await expect(key.getByTestId("ondo-b-pulse-legend").locator("[data-level]")).toHaveCount(0)
  const keyCoverage = key.getByTestId("ondo-b-pulse-legend").locator("[data-coverage-intensity]")
  await expect(keyCoverage).toHaveCount(3)
  expect(await keyCoverage.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-coverage-intensity")))).toEqual(["sparse", "clustered", "dense"])
  expect(await keyCoverage.evaluateAll((nodes) => nodes.map((node) => node.querySelectorAll("i > b").length))).toEqual([3, 3, 3])

  await page.getByTestId("ondo-b-view-toggle").click()
  await expect(city).toHaveAttribute("data-effective-view", "list")
  const rows = page.getByTestId("ondo-b-editorial-place-list").locator("[data-editorial-place-id]")
  await expect(rows).toHaveCount(8)
  expect(await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-pulse-priority")))).toEqual(Array(8).fill("limited"))
  const rowPulseNodes = rows.locator("[data-testid='ondo-b-list-pulse']")
  expect(await rowPulseNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-pulse-level")))).toEqual(Array(8).fill("limited"))
  expect(await rowPulseNodes.evaluateAll((nodes) => nodes.every((node) => node.getAttribute("aria-hidden") === "true" && !node.hasAttribute("role")))).toBe(true)
  expect(new Set(await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-coverage-intensity"))))).toEqual(new Set(["sparse", "clustered", "dense"]))
  expect((await rows.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label") ?? ""))).every((label) => (
    label.includes("ONDO temperature · Editorial place coverage:")
      && label.includes("No popularity score")
      && !/\b(?:peak|hot|rising)\b/i.test(label)
  ))).toBe(true)

  await rows.first().getByRole("button").click()
  const peekTemperature = page.getByTestId("ondo-b-editorial-place-peek").locator("[data-pulse-level]")
  await expect(peekTemperature).toHaveAttribute("data-pulse-level", "limited")
  await expect(peekTemperature).toHaveAttribute("data-coverage-intensity", "clustered")
  await expect(peekTemperature).toHaveAttribute("data-temperature-model", "editorial-unscored")
  await expect(peekTemperature).toHaveAccessibleName("Place temperature · Editorial place coverage: Grouped · No popularity score")

  await page.getByTestId("ondo-b-editorial-place-details").click()
  const detailTemperature = page.getByTestId("ondo-b-editorial-place-overlay").locator("[data-pulse-level]")
  await expect(detailTemperature).toHaveAttribute("data-pulse-level", "limited")
  await expect(detailTemperature).toHaveAttribute("data-coverage-intensity", "clustered")
  await expect(detailTemperature).toHaveAttribute("data-editorial-temperature-mode", "editorial-coverage")
  await expect(detailTemperature).toHaveAccessibleName("Place temperature · Editorial place coverage: Grouped · No popularity score")
})

test("Jeju coverage key and rows stay contained from 320 to 430px in EN, KO and JA", async ({ page }) => {
  test.setTimeout(120_000)
  for (const locale of ["en", "ko", "ja"] as const) {
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await seed(page, locale)
      await page.goto("/?city=jeju", { waitUntil: "domcontentloaded" })

      const city = page.getByTestId("ondo-b-map-entry")
      await expect(city).toHaveAttribute("data-hydrated", "true")
      const key = page.getByTestId("ondo-b-map-key")
      await expect(key).toBeVisible()
      const keyBox = await key.boundingBox()
      expect(keyBox).not.toBeNull()
      expect(keyBox!.x).toBeGreaterThanOrEqual(-.5)
      expect(keyBox!.x + keyBox!.width).toBeLessThanOrEqual(width + .5)

      const keyDetails = key.getByTestId("ondo-b-map-key-details")
      await keyDetails.locator(":scope > summary").click()
      const keyBody = keyDetails.locator(":scope > div")
      await expect(keyBody).toBeVisible()
      const keyBodyBox = await keyBody.boundingBox()
      expect(keyBodyBox).not.toBeNull()
      expect(keyBodyBox!.x).toBeGreaterThanOrEqual(-.5)
      expect(keyBodyBox!.x + keyBodyBox!.width).toBeLessThanOrEqual(width + .5)
      await keyDetails.locator(":scope > summary").click()

      await page.getByTestId("ondo-b-view-toggle").click()
      await expect(city).toHaveAttribute("data-effective-view", "list")
      const rows = page.getByTestId("ondo-b-editorial-place-list").locator("[data-editorial-place-id]")
      await expect(rows).toHaveCount(8)
      expect(await rows.evaluateAll((nodes) => nodes.every((node) => node.scrollWidth <= node.clientWidth + 1))).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    }
  }
})
