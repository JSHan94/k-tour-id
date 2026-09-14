import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"
import { expectNoSetupPlacePreview, openOptionalMapSetup } from "../helpers/ondo-optional-setup"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

const DEVICE_KEY = "ondo-b.device.v1"
const SEOUL_RESEARCH_COUNT = (JSON.parse(readFileSync(resolve("data/ondo/research/seoul-food-pulse.json"), "utf8")) as unknown[]).length
const SEOUL_CANONICAL_COUNT = 200

async function openFresh(page: Page, viewport = { width: 390, height: 844 }, basemap: "blocked" | "live" = "blocked") {
  await page.setViewportSize(viewport)
  await page.addInitScript((key) => localStorage.removeItem(key), DEVICE_KEY)
  if (basemap === "blocked") await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
  await expect(page.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
  await expectNoSetupPlacePreview(page)
}

test("Wave 1 preferences return a visible, editable map lens without filtering places", async ({ page }) => {
  await openFresh(page)
  await openOptionalMapSetup(page)
  const onboarding = page.getByTestId("ondo-onboarding-backdrop")
  const intent = page.getByTestId("persona-short_trip")
  await intent.click()
  await expect(intent).toHaveAttribute("aria-checked", "true")
  await page.getByTestId("onboarding-continue").click()
  await expect(onboarding).toHaveAttribute("data-onboarding-step", "area")
  // A short trip may intentionally leave the starting city open. This keeps
  // the resulting Korea map one tap away while still exercising every stage.
  await page.getByTestId("onboarding-continue").click()
  await expect(onboarding).toHaveAttribute("data-onboarding-step", "preferences")
  await page.getByTestId("onboarding-preference-classic").click()
  await page.getByTestId("onboarding-preference-cafe").click()
  await page.getByTestId("onboarding-dietary-disclosure").locator(":scope > summary").click()
  await page.getByTestId("onboarding-preference-vegan").click()
  await page.getByTestId("onboarding-finish").click()

  const map = page.getByTestId("ondo-b-map-entry")
  await expect(map).toHaveAttribute("data-persona", "short_trip")
  await expect(map).toHaveAttribute("data-discovery-preferences", "classic,cafe,vegan")
  await expect(page.getByTestId("ondo-b-personalization-summary")).toContainText("Local classics")
  await expect(page.getByTestId("ondo-b-personalization-summary")).toContainText("Cafés and dessert")

  await page.getByTestId("ondo-b-nation").locator("[data-city='seoul']").click()
  // Curated research picks supplement the 200 directory records; tastes
  // highlight context without hiding either source from the result set.
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city-record-count", "200")
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-research-result-count", String(SEOUL_RESEARCH_COUNT))
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-result-count", String(SEOUL_CANONICAL_COUNT + SEOUL_RESEARCH_COUNT))
  // Compact city chrome keeps discovery choices in Options instead of adding
  // another floating toolbar. Preserve the choices, then follow the visible UI.
  await expect(map).toHaveAttribute("data-discovery-preferences", "classic,cafe,vegan")
  await page.getByTestId("ondo-b-map-options-open").click()
  await page.getByTestId("ondo-b-map-options-preferences").click()
  await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
  await page.getByTestId("ondo-b-discovery-settings").click()
  await expect(page.getByTestId("settings-preference-classic")).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByTestId("settings-preference-cafe")).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByTestId("settings-preference-vegan")).toHaveAttribute("aria-pressed", "true")
})

test("Wave 1 opens the map directly and offers optional personalization on revisit", async ({ page }) => {
  await openFresh(page, { width: 320, height: 568 })

  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-discovery-preferences", "none")
  await expect(page.getByTestId("ondo-b-personalization-summary")).toContainText("Set your tastes")
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
  await expectNoSetupPlacePreview(page)
})

test("Wave 1 map lens never steals a city target and transfers focus into Settings", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 320, height: 720 })
  // The nation lens is intentionally inert while the basemap is not ready.
  // Exercise its real keyboard path without the fallback-only tile denial.
  await openFresh(page, { width: 320, height: 720 }, "live")
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-state", "ready")

  for (const viewport of [{ width: 320, height: 568 }, { width: 320, height: 720 }, { width: 360, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    for (const city of ["seoul", "busan", "jeju"] as const) {
      const target = page.getByTestId("ondo-b-nation").locator(`[data-city='${city}']`)
      await expect(target).toBeVisible()
      await expect.poll(() => target.evaluate((element) => {
        const map = document.querySelector<HTMLElement>("[data-testid='maplibre-map']")
        if (map?.dataset.mapProjectionSettled !== "true") return false
        const rect = element.getBoundingClientRect()
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
        return hit === element || Boolean(hit && element.contains(hit))
      }), { message: `${viewport.width}px ${city} center remains reachable after the projected map settles` }).toBe(true)
    }
  }

  const edit = page.getByTestId("ondo-b-personalization-edit")
  await expect(edit).toBeVisible()
  await edit.focus()
  await expect(edit).toBeFocused()
  await edit.press("Enter")
  await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
  await expect(page.getByTestId("ondo-b-settings-entry").getByRole("heading", { level: 1 })).toBeFocused()
  await page.screenshot({ path: testInfo.outputPath("map-lens-settings-focus-390.png") })
})

test("Wave 1 compact onboarding keeps the primary action in the first fold", async ({ page }) => {
  await openFresh(page, { width: 320, height: 568 })
  await openOptionalMapSetup(page)
  await page.getByTestId("persona-short_trip").click()
  const continueAction = page.getByTestId("onboarding-continue")
  await expect(continueAction).toBeVisible()
  expect((await continueAction.boundingBox())!.y + (await continueAction.boundingBox())!.height).toBeLessThanOrEqual(568)

  await continueAction.click()
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveAttribute("data-onboarding-step", "area")
  await expect(continueAction).toBeVisible()
  expect((await continueAction.boundingBox())!.y + (await continueAction.boundingBox())!.height).toBeLessThanOrEqual(568)
  await continueAction.click()
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveAttribute("data-onboarding-step", "preferences")
  const finish = page.getByTestId("onboarding-finish")
  await expect(finish).toBeVisible()
  const finishBox = await finish.boundingBox()
  expect(finishBox).not.toBeNull()
  expect(finishBox!.y + finishBox!.height).toBeLessThanOrEqual(568)
  expect(await page.getByTestId("ondo-onboarding").evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
})

test("Quiet atlas keeps pointer entry map-first while keyboard entry reaches search", async ({ page }) => {
  await openFresh(page, { width: 390, height: 844 })

  const seoul = page.getByTestId("ondo-b-nation").locator("[data-city='seoul']")
  await seoul.click()
  await expect(page.getByTestId("ondo-b-city-back")).toBeFocused()
  await expect(page.getByTestId("ondo-b-search")).not.toBeFocused()

  await page.getByTestId("ondo-b-city-back").click()
  await expect(seoul).toBeFocused()
  const settings = page.getByTestId("nav-settings")
  await settings.focus()
  await page.waitForTimeout(2_100)
  await expect(settings).toBeFocused()
  await seoul.click()
  await expect(page.getByTestId("ondo-b-city-back")).toBeFocused()
  await page.getByTestId("ondo-b-city-back").click()
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "false")
  await settings.focus()
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")
  await page.waitForTimeout(2_100)
  await expect(settings).toBeFocused()
  await seoul.focus()
  await seoul.press("Enter")
  await expect(page.getByTestId("ondo-b-search")).toBeFocused()
  const canvas = page.getByTestId("maplibre-map").locator("canvas.maplibregl-canvas")
  await canvas.focus()
  await expect(canvas).toBeFocused()
  await page.goBack()
  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")
  await expect(seoul).toBeFocused()
})

test("Quiet atlas binds all city hit targets to projected points and keeps the taste lens compact", async ({ page }, testInfo) => {
  await openFresh(page, { width: 320, height: 720 }, "live")
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-state", "ready")

  const atlas = page.getByTestId("ondo-b-korea-atlas")
  const plot = page.getByTestId("ondo-b-atlas-plot")
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")
  const plotBox = await plot.boundingBox()
  expect(plotBox).not.toBeNull()
  for (const city of ["seoul", "busan", "jeju"] as const) {
    const node = atlas.locator(`[data-city='${city}']`)
    await expect(node).toHaveAttribute("data-map-projected", "true")
    const nodeBox = await node.boundingBox()
    expect(nodeBox).not.toBeNull()
    const projected = await node.evaluate((element) => ({
      x: Number(element.getAttribute("data-map-x")),
      y: Number(element.getAttribute("data-map-y")),
    }))
    expect(Math.abs(nodeBox!.x + nodeBox!.width / 2 - (plotBox!.x + projected.x))).toBeLessThan(2)
    expect(Math.abs(nodeBox!.y + nodeBox!.height / 2 - (plotBox!.y + projected.y))).toBeLessThan(2)
    expect(nodeBox!.width).toBeGreaterThanOrEqual(44)
    expect(nodeBox!.height).toBeGreaterThanOrEqual(44)
  }

  const lens = page.getByTestId("ondo-b-personalization-edit")
  await expect(lens).toBeVisible()
  const lensBox = await lens.boundingBox()
  expect(lensBox).not.toBeNull()
  expect(lensBox!.width).toBeLessThanOrEqual(48)
  await expect(lens).toHaveAccessibleName(/Set your tastes.*Edit discovery choices.*All places remain visible/)
  await page.screenshot({ path: testInfo.outputPath("atlas-projected-city-targets-lens-320.png") })
})

test("Quiet atlas publishes only the latest stable mobile resize projection", async ({ page }) => {
  await openFresh(page, { width: 390, height: 844 })
  const map = page.getByTestId("maplibre-map")
  const seoul = page.getByTestId("ondo-b-nation").locator("[data-city='seoul']")
  await seoul.click()
  await page.getByTestId("ondo-b-city-back").click()
  await page.setViewportSize({ width: 320, height: 568 })
  await page.setViewportSize({ width: 430, height: 720 })
  await expect(map).toHaveAttribute("data-map-projection-settled", "true")
  const stable = await page.evaluate(async () => {
    const mapNode = document.querySelector<HTMLElement>("[data-testid='maplibre-map']")!
    const cityNodes = [...document.querySelectorAll<HTMLElement>("[data-testid='ondo-b-nation'] [data-city]")]
    const sample = () => ({
      generation: mapNode.dataset.mapProjectionGeneration,
      settledGeneration: mapNode.dataset.mapProjectionSettledGeneration,
      center: mapNode.dataset.mapCenter,
      zoom: mapNode.dataset.mapZoom,
      cities: cityNodes.map((node) => `${node.dataset.city}:${node.dataset.mapX},${node.dataset.mapY}`).join("|"),
    })
    const samples = [sample()]
    for (let index = 0; index < 3; index += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      samples.push(sample())
    }
    return samples
  })
  expect(stable.every((sample) => sample.generation === sample.settledGeneration)).toBe(true)
  expect(new Set(stable.map((sample) => `${sample.center}/${sample.zoom}/${sample.cities}`)).size).toBe(1)
  for (const city of ["seoul", "busan", "jeju"] as const) {
    const target = page.getByTestId("ondo-b-nation").locator(`[data-city='${city}']`)
    await expect.poll(() => target.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return hit === element || Boolean(hit && element.contains(hit))
    })).toBe(true)
  }
})

test("superseded venue detail work and partial map tiles stay benign", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript((key) => localStorage.setItem(key, JSON.stringify({
    locale: "en", onboarding: "ONB-COMPLETE", persona: null, discoveryPreferences: [],
    savedVenueIds: [], savedEditorialPlaceIds: [], privateNotesByVenue: {}, recentVenueIds: [],
    recentEditorialPlaceIds: [], plannedTableRefs: [], localSignalPostedVenueIds: [],
    localPulseEvidenceByVenue: {}, localInteractionBoundarySeen: false, commerceReceipts: [],
  })), DEVICE_KEY)
  await page.route("https://tiles.openfreemap.org/planet", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ tilejson: "3.0.0", tiles: ["https://tiles.openfreemap.org/partial/{z}/{x}/{y}.pbf"], minzoom: 0, maxzoom: 18 }),
  }))
  let tileFailures = 0
  await page.route("https://tiles.openfreemap.org/partial/**", (route) => {
    tileFailures += 1
    if (tileFailures === 1) return route.abort("failed")
    return route.fulfill({ status: 200, contentType: "application/x-protobuf", body: Buffer.alloc(0) })
  })
  const failedApiRequests: string[] = []
  page.on("requestfailed", (request) => {
    if (request.url().includes("/api/ondo/venues/")) failedApiRequests.push(request.failure()?.errorText ?? "failed")
  })

  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-hydrated", "true")
  await page.locator("[data-city='seoul']").click()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 10_000 })
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-partial-failure", "recoverable")
  await page.getByTestId("ondo-b-view-toggle").click()
  await page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] > button").first().click()
  const detailRequest = page.waitForRequest((request) => request.url().includes("/api/ondo/venues/"))
  await page.getByTestId("canonical-place-details").click()
  await detailRequest
  await page.getByTestId("canonical-place-overlay").getByRole("button", { name: "Close place" }).click()
  await page.waitForTimeout(500)
  expect(failedApiRequests).toEqual([])
})
