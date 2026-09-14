import { expect, test, type Page, type Request } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"
import { expectNoSetupPlacePreview, openOptionalMapSetup } from "../helpers/ondo-optional-setup"

const DEVICE_KEY = "ondo-b.device.v1"
test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, info) => { await expectBRuntimeClean(page, info) })
// Covers two fully painted map captures plus public preference navigation and
// reload; individual map-readiness assertions retain their bounded deadlines.
test.setTimeout(120_000)

async function ready(page: Page) {
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-state", "ready", { timeout: 30_000 })
}

function observeBasemapPaint(page: Page) {
  const pending = new Set<Request>()
  let lastActivity = Date.now()
  let completed = 0
  const isBasemap = (request: Request) => new URL(request.url()).hostname === "tiles.openfreemap.org"
  page.on("request", request => {
    if (isBasemap(request)) { pending.add(request); lastActivity = Date.now() }
  })
  const finished = (request: Request) => {
    if (pending.delete(request)) { completed += 1; lastActivity = Date.now() }
  }
  page.on("requestfinished", finished)
  page.on("requestfailed", finished)
  return async () => {
    // A city transition can finish before new geographic tiles arrive. Require
    // actual basemap readiness, quiet tile activity, then browser render frames.
    const map = page.getByTestId("maplibre-map")
    await expect(map).toHaveAttribute("data-basemap-metadata", "ready")
    await expect(map).toHaveAttribute("data-basemap-tile", "ready")
    await expect.poll(() => pending.size === 0 && completed > 0 && Date.now() - lastActivity >= 800, { timeout: 25_000 }).toBe(true)
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  }
}

async function noAutomaticDetail(page: Page) {
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
  await expectNoSetupPlacePreview(page)
  await expect(page.getByTestId("researched-food-detail")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-editorial-place-peek")).toHaveCount(0)
  await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveCount(0)
}

async function readChoices(page: Page) {
  return page.evaluate(key => {
    const stored = JSON.parse(localStorage.getItem(key) ?? "{}")
    return { onboarding: stored.onboarding ?? "ONB-NEW", persona: stored.persona ?? null, discoveryArea: stored.discoveryArea ?? null, preferences: stored.discoveryPreferences ?? [] }
  }, DEVICE_KEY)
}

async function openPreferences(page: Page) {
  await page.getByTestId("nav-settings").click()
  await page.getByTestId("ondo-b-discovery-settings").click()
}

for (const scenario of [
  { width: 390, height: 844, locale: "en", appearance: "light" },
  { width: 320, height: 844, locale: "ko", appearance: "dark" },
  { width: 1440, height: 1000, locale: "en", appearance: "light" },
] as const) {
  test(`MAP-FIRST-PUBLIC ${scenario.width} ${scenario.locale}: fresh nation → chosen city heatmap without questions or a venue`, async ({ page }, info) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height })
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scenario.appearance })
    const settledBasemap = observeBasemapPaint(page)
    // EN starts with fully empty storage. KO seeds display preference only;
    // neither seeds onboarding completion, tastes, city, account or proof.
    if (scenario.locale === "ko") await page.addInitScript(({ key, locale, appearance }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ locale, appearancePreference: appearance }))
    }, { key: DEVICE_KEY, locale: scenario.locale, appearance: scenario.appearance })
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await ready(page)
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-projection-settled", "true")
    await noAutomaticDetail(page)
    await settledBasemap()
    await page.screenshot({ path: info.outputPath("fresh-nation.png") })
    await page.getByTestId("ondo-b-nation").locator("[data-city='seoul']").click()
    const map = page.getByTestId("ondo-b-map-entry")
    await expect(map).toHaveAttribute("data-city", "seoul")
    await expect(map).toHaveAttribute("data-effective-view", "map")
    await expect(map).toHaveAttribute("data-entry-transition", "settled")
    await expect(map).toHaveAttribute("data-pulse-map-grammar", "temperature-field-over-map-context")
    await expect(map).toHaveAttribute("data-discovery-preferences", "none")
    await noAutomaticDetail(page)
    expect(await readChoices(page)).toEqual({ onboarding: "ONB-NEW", persona: null, discoveryArea: null, preferences: [] })
    await settledBasemap()
    await page.screenshot({ path: info.outputPath("chosen-city-direct-heatmap.png") })
    await info.attach("settled-map-context", { contentType: "application/json", body: JSON.stringify(await page.evaluate(() => {
      const basemap = document.querySelector<HTMLElement>("[data-testid='maplibre-map']")
      return { width: innerWidth, height: innerHeight, devicePixelRatio, maxTouchPoints: navigator.maxTouchPoints, coarsePointer: matchMedia("(pointer: coarse)").matches, basemap: basemap?.dataset }
    }), null, 2) })
    // The original choice editor remains available through actual map controls.
    if (scenario.width < 600) {
      await page.getByTestId("ondo-b-map-options-open").click()
      await page.getByTestId("ondo-b-map-options-preferences").click()
    } else await page.getByTestId("ondo-b-personalization-edit").click()
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
    await page.getByTestId("ondo-b-discovery-settings").click()
    await expect(page.getByTestId("settings-preference-classic")).toBeVisible()
    await expectNoSetupPlacePreview(page)
    await page.getByTestId("ondo-sheet").filter({ has: page.getByTestId("settings-preference-classic") }).locator(":scope > header button").click()
    await page.getByTestId("nav-ondo").click()
    await expect(map).toHaveAttribute("data-city", "seoul")
    await page.reload({ waitUntil: "domcontentloaded" })
    await ready(page)
    await expect(map).toHaveAttribute("data-city", "seoul")
    await noAutomaticDetail(page)
  })
}

test("MAP-FIRST-PREFS public save and optional setup cancellation preserve returning-user choices", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await ready(page)
  await openPreferences(page)
  await page.getByTestId("settings-preference-classic").click()
  await page.getByTestId("settings-preference-vegan").click()
  await page.getByTestId("settings-preferences-save").click()
  const saved = await readChoices(page)
  expect(saved.preferences).toEqual(["classic", "vegan"])
  await page.getByTestId("nav-ondo").click()
  await page.reload({ waitUntil: "domcontentloaded" })
  await ready(page)
  await noAutomaticDetail(page)
  expect(await readChoices(page)).toEqual(saved)
  await openPreferences(page)
  await expect(page.getByTestId("settings-preference-classic")).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByTestId("settings-preference-vegan")).toHaveAttribute("aria-pressed", "true")
  await page.getByTestId("settings-preference-cafe").click()
  await page.getByTestId("ondo-sheet").filter({ has: page.getByTestId("settings-preference-classic") }).locator(":scope > header button").click()
  expect(await readChoices(page)).toEqual(saved)
  await page.getByTestId("nav-ondo").click()
  await openOptionalMapSetup(page)
  expect(await readChoices(page)).toEqual(saved)
  await page.getByTestId("persona-short_trip").click()
  await page.getByTestId("onboarding-continue").click()
  await page.getByTestId("onboarding-area-busan").click()
  await page.getByTestId("onboarding-continue").click()
  await expect(page.getByTestId("onboarding-preference-classic")).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByTestId("onboarding-preference-vegan")).toHaveAttribute("aria-pressed", "true")
  await expectNoSetupPlacePreview(page)
  await page.getByTestId("onboarding-preference-cafe").click()
  await page.screenshot({ path: info.outputPath("optional-tastes-no-venue-preview.png") })
  await page.getByTestId("onboarding-guest-skip").click()
  await noAutomaticDetail(page)
  expect(await readChoices(page)).toEqual(saved)
  await page.reload({ waitUntil: "domcontentloaded" })
  await ready(page)
  await noAutomaticDetail(page)
  expect(await readChoices(page)).toEqual(saved)

  // A previously completed setup also survives a later edit cancellation;
  // opening the editor is not a destructive reset of the saved persona/area.
  await openOptionalMapSetup(page)
  await page.getByTestId("persona-living").click()
  await page.getByTestId("onboarding-continue").click()
  await page.getByTestId("onboarding-area-busan").click()
  await page.getByTestId("onboarding-continue").click()
  await page.getByTestId("onboarding-finish").click()
  await noAutomaticDetail(page)
  const completed = await readChoices(page)
  expect(completed).toEqual({ onboarding: "ONB-COMPLETE", persona: "living", discoveryArea: "busan", preferences: ["classic", "vegan"] })
  await openOptionalMapSetup(page)
  expect(await readChoices(page)).toEqual(completed)
  await expect(page.getByTestId("persona-living")).toHaveAttribute("aria-checked", "true")
  await page.getByTestId("onboarding-continue").click()
  await expect(page.getByTestId("onboarding-area-busan")).toHaveAttribute("aria-checked", "true")
  await page.getByTestId("onboarding-area-seoul").click()
  await page.getByTestId("onboarding-continue").click()
  await page.getByTestId("onboarding-preference-classic").click()
  await page.getByTestId("onboarding-guest-skip").click()
  await noAutomaticDetail(page)
  expect(await readChoices(page)).toEqual(completed)
  await page.reload({ waitUntil: "domcontentloaded" })
  await ready(page)
  await noAutomaticDetail(page)
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "busan")
  expect(await readChoices(page)).toEqual(completed)
})

test("MAP-FIRST-LEGACY interrupted persisted setup opens the linked city, never resumes a forced survey", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  // Migration fixture contains discovery preferences only, never readiness or
  // credentials. This models an existing user stranded in the old wizard.
  await page.addInitScript(key => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ locale: "en", onboarding: "ONB-IN-PROGRESS", persona: "short_trip", discoveryArea: "busan", discoveryPreferences: ["cafe", "halal"] }))
  }, DEVICE_KEY)
  await page.goto("/?city=busan", { waitUntil: "domcontentloaded" })
  await ready(page)
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "busan")
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-discovery-preferences", "cafe,halal")
  await noAutomaticDetail(page)
  await page.reload({ waitUntil: "domcontentloaded" })
  await ready(page)
  await noAutomaticDetail(page)
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "busan")
  await openPreferences(page)
  await expect(page.getByTestId("settings-preference-cafe")).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByTestId("settings-preference-halal")).toHaveAttribute("aria-pressed", "true")
})
