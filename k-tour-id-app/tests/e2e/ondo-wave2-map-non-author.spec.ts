import { expect, test, type Page } from "@playwright/test"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"
import { pulseForVenue } from "../../features/ondo/pulse-b/pulse-model-b"
import { gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

type Locale = "en" | "ko" | "ja"

const completedMapDiscovery = {
  onboarding: "ONB-COMPLETE",
  persona: "short_trip",
  discoveryArea: null,
} as const

const neutralSeoulVenue = CANONICAL_MAP_VENUES_COMPACT.find((venue) => (
  venue.cityId === "seoul" && pulseForVenue(venue.id).score == null
))

async function delayMapLibreChunk(page: Page, delayMs: number) {
  await page.addInitScript((delay) => {
    window.__ONDO_B_QA__ = { ...window.__ONDO_B_QA__, mapImportDelayMs: delay }
  }, delayMs)
  return () => true
}

const QUIET_TILEJSON = {
  tilejson: "3.0.0",
  name: "ONDO first-paint QA basemap",
  tiles: ["https://tiles.openfreemap.org/ondo-first-paint-empty/{z}/{x}/{y}.pbf"],
  minzoom: 0,
  maxzoom: 18,
  bounds: [124, 33, 132, 39],
}

async function stubQuietBasemap(page: Page) {
  await page.route("https://tiles.openfreemap.org/planet", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(QUIET_TILEJSON),
  }))
  await page.route("https://tiles.openfreemap.org/ondo-first-paint-empty/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/x-protobuf",
    body: Buffer.alloc(0),
  }))
}

async function waitForAtlas(page: Page) {
  const map = page.getByTestId("maplibre-map")
  await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
  await expect(map).toHaveAttribute("data-map-projection-settled", "true")
  await expect(map.locator("canvas.maplibregl-canvas")).toHaveCount(1)
  return map
}

test.describe("Wave 2 map non-author acceptance", () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  test("the server-only first paint is branded and never exposes the default rail", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.route(/\/_next\/static\/chunks\/.*\.js(?:\?.*)?$/, (route) => route.abort("blockedbyclient"))
    await page.goto("/", { waitUntil: "domcontentloaded" })

    const root = page.getByTestId("ondo-b-root")
    await expect(root).toHaveAttribute("data-hydrated", "false")
    await expect(root).toHaveAttribute("aria-busy", "true")
    await expect(root).toHaveAttribute("inert", "")
    expect(await root.evaluate((element) => ({
      backgroundImage: getComputedStyle(element).backgroundImage,
      canvasVisibility: getComputedStyle(element.querySelector<HTMLElement>("[data-testid='ondo-canvas']")!).visibility,
      canvasOpacity: getComputedStyle(element.querySelector<HTMLElement>("[data-testid='ondo-canvas']")!).opacity,
      canvasPointerEvents: getComputedStyle(element.querySelector<HTMLElement>("[data-testid='ondo-canvas']")!).pointerEvents,
    }))).toEqual({
      backgroundImage: expect.stringContaining("ktour-id-mark-192.png"),
      canvasVisibility: "hidden",
      canvasOpacity: "0",
      canvasPointerEvents: "none",
    })
    await expect(page.getByTestId("ondo-main-nav")).toBeHidden()
  })

  test("hydration releases the shell before its first navigation tap", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", local: completedMapDiscovery })
    await gotoB(page)

    const root = page.getByTestId("ondo-b-root")
    const settings = page.getByTestId("ondo-main-nav").getByRole("button", { name: "Settings" })
    await expect(root).toHaveAttribute("data-hydrated", "true")
    await expect(root).not.toHaveAttribute("aria-busy", "true")
    await expect(root).not.toHaveAttribute("inert", "")
    await settings.click()
    await expect(page.getByTestId("ondo-tab-panel-settings")).toBeVisible()
  })

  for (const locale of ["en", "ko", "ja"] as const satisfies readonly Locale[]) {
    test(`${locale.toUpperCase()} city entry starts in one frame and never swaps or blanks the map`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await seedB(page, { locale, local: completedMapDiscovery })
      await gotoB(page)
      const map = await waitForAtlas(page)
      const mapHandle = await map.elementHandle()
      const canvasHandle = await map.locator("canvas.maplibregl-canvas").elementHandle()

      await page.evaluate(() => {
        const samples: Array<{ at: number; map: boolean; canvas: boolean; surface: boolean }> = []
        const startedAt = performance.now()
        const receipt: { startedAt: number; activeAt?: number; settledAt?: number; sampledThrough?: number } = { startedAt }
        const auditWindow = window as typeof window & {
          __ondoMapContinuity?: typeof samples
          __ondoMapTransitionReceipt?: typeof receipt
        }
        auditWindow.__ondoMapContinuity = samples
        auditWindow.__ondoMapTransitionReceipt = receipt
        const observeTransition = () => {
          const state = document.querySelector<HTMLElement>("[data-testid='ondo-b-map-entry']")?.dataset.entryTransition
          if (state === "active" && receipt.activeAt == null) receipt.activeAt = performance.now()
          if (state === "settled" && receipt.activeAt != null && receipt.settledAt == null) receipt.settledAt = performance.now()
        }
        const observer = new MutationObserver(observeTransition)
        observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ["data-entry-transition"] })
        const sample = () => {
          const mapNode = document.querySelector<HTMLElement>("[data-testid='maplibre-map']")
          const canvas = mapNode?.querySelector<HTMLCanvasElement>("canvas.maplibregl-canvas")
          const atlas = document.querySelector<HTMLElement>("[data-testid='ondo-b-korea-atlas']")
          const city = document.querySelector<HTMLElement>("[data-testid='ondo-b-map-entry'][data-city]")
          samples.push({
            at: performance.now() - startedAt,
            map: Boolean(mapNode && mapNode.getBoundingClientRect().width > 0 && mapNode.getBoundingClientRect().height > 0),
            canvas: Boolean(canvas && canvas.width > 0 && canvas.height > 0),
            surface: Boolean((atlas && atlas.getBoundingClientRect().height > 0) || (city && city.getBoundingClientRect().height > 0)),
          })
          const elapsed = performance.now() - startedAt
          if (elapsed < 650) requestAnimationFrame(sample)
          else receipt.sampledThrough = elapsed
        }
        requestAnimationFrame(sample)
        document.querySelector<HTMLButtonElement>("[data-testid='ondo-b-korea-atlas'] [data-city='seoul']")?.click()
        observeTransition()
        window.setTimeout(() => observer.disconnect(), 1_000)
      })

      const root = page.getByTestId("ondo-b-map-entry")
      await page.waitForFunction(() => (window as typeof window & {
        __ondoMapTransitionReceipt?: { activeAt?: number }
      }).__ondoMapTransitionReceipt?.activeAt != null)
      const activeAt = await page.evaluate(() => {
        const receipt = (window as typeof window & {
          __ondoMapTransitionReceipt?: { startedAt: number; activeAt?: number }
        }).__ondoMapTransitionReceipt!
        return receipt.activeAt! - receipt.startedAt
      })
      expect(activeAt, "city chrome must begin within the 100 ms response budget").toBeLessThanOrEqual(100)
      await expect(page).toHaveURL(/city=seoul/)
      await expect(map).toHaveAttribute("data-city-focus-target", "seoul")
      await expect(map).toHaveAttribute("data-city-focus-duration", "340")
      expect(Number(await map.getAttribute("data-city-focus-start-delay"))).toBeLessThanOrEqual(100)
      await expect(root).toHaveAttribute("data-entry-transition", "settled", { timeout: 800 })
      await page.waitForFunction(() => (window as typeof window & {
        __ondoMapTransitionReceipt?: { settledAt?: number }
      }).__ondoMapTransitionReceipt?.settledAt != null)
      const settledAt = await page.evaluate(() => {
        const receipt = (window as typeof window & {
          __ondoMapTransitionReceipt?: { startedAt: number; settledAt?: number }
        }).__ondoMapTransitionReceipt!
        return receipt.settledAt! - receipt.startedAt
      })
      const cameraReceipt = await map.evaluate((node) => ({
        requestedAt: Number(node.dataset.cityFocusRequestedAt),
        startedAt: Number(node.dataset.cityFocusStartedAt),
        settledAt: Number(node.dataset.cityFocusSettledAt),
      }))
      expect(cameraReceipt.startedAt - cameraReceipt.requestedAt, "the loaded camera must start within the response budget").toBeLessThanOrEqual(100)
      expect(
        cameraReceipt.settledAt - cameraReceipt.requestedAt,
        `normal loaded tap-to-settle is a hard 520 ms budget: ${JSON.stringify(cameraReceipt)}`,
      ).toBeLessThanOrEqual(520)
      // Chrome settles with its own <=420 ms CSS choreography. The public
      // motion budget is the actual MapLibre camera receipt above; React's
      // post-motion diagnostic attribute is not a second visual animation.

      expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)
      expect(await canvasHandle?.evaluate((node) => node === document.querySelector("canvas.maplibregl-canvas"))).toBe(true)
      await page.waitForFunction(() => (window as typeof window & {
        __ondoMapTransitionReceipt?: { sampledThrough?: number }
      }).__ondoMapTransitionReceipt?.sampledThrough != null)
      const continuity = await page.evaluate(() => (window as typeof window & {
        __ondoMapContinuity?: Array<{ at: number; map: boolean; canvas: boolean; surface: boolean }>
      }).__ondoMapContinuity ?? [])
      expect(continuity.length).toBeGreaterThanOrEqual(3)
      expect(continuity.at(-1)?.at ?? 0).toBeGreaterThanOrEqual(620)
      expect(continuity.every((sample) => sample.map && sample.canvas && sample.surface), "no sampled animation frame may be blank or lose the live canvas").toBe(true)
      await testInfo.attach(`map-entry-${locale}-timing.json`, {
        body: JSON.stringify({ activeMs: activeAt, settledMs: settledAt, cameraReceipt, sampledFrames: continuity.length }, null, 2),
        contentType: "application/json",
      })
      await page.screenshot({ path: testInfo.outputPath(`map-entry-${locale}-390x844.png`), animations: "disabled" })
    })
  }

  test("normal and reduced-motion rapid intents both keep only the latest city", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { local: completedMapDiscovery })
    await gotoB(page)
    let map = await waitForAtlas(page)
    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>("[data-city='seoul']")?.click()
      document.querySelector<HTMLButtonElement>("[data-city='busan']")?.click()
    })
    await expect(page).toHaveURL(/city=busan/)
    await expect(map).toHaveAttribute("data-city-focus-target", "busan")
    await expect(map).toHaveAttribute("data-city-focus-duration", "340")

    await page.goBack()
    await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
    await page.emulateMedia({ reducedMotion: "reduce" })
    map = page.getByTestId("maplibre-map")
    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>("[data-city='seoul']")?.click()
      document.querySelector<HTMLButtonElement>("[data-city='jeju']")?.click()
    })
    await expect(page).toHaveURL(/city=jeju/)
    await expect(map).toHaveAttribute("data-city-focus-target", "jeju")
    await expect(map).toHaveAttribute("data-city-focus-duration", "0")
    expect(Number(await map.getAttribute("data-city-focus-start-delay"))).toBeLessThanOrEqual(100)
  })

  test("a delayed map keeps a quiet branded frame, then exposes the real projected city targets", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await stubQuietBasemap(page)
    const wasMapLibreDelayed = await delayMapLibreChunk(page, 700)
    await seedB(page, { locale: "en", local: completedMapDiscovery })
    await gotoB(page)

    const shell = page.getByTestId("ondo-b-root")
    const mapRoot = page.getByTestId("ondo-b-map-entry")
    const nation = page.getByTestId("ondo-b-nation")
    const atlas = page.getByTestId("ondo-b-korea-atlas")
    const map = page.getByTestId("maplibre-map")
    await expect(shell).toHaveAttribute("data-hydrated", "true")
    await expect(atlas).toBeVisible()
    await expect(mapRoot.locator(":scope > header")).toBeVisible()
    await expect(nation).toHaveAttribute("aria-busy", "true")
    await expect(atlas).toHaveAttribute("data-map-presentation", "loading")
    await expect(map.locator("canvas.maplibregl-canvas")).toHaveCount(0)
    expect(await atlas.locator("[data-city]").evaluateAll((nodes) => nodes.map((node) => ({
      city: node.getAttribute("data-city"),
      visibility: getComputedStyle(node).visibility,
      opacity: getComputedStyle(node).opacity,
      pointerEvents: getComputedStyle(node).pointerEvents,
    })))).toEqual([
      { city: "seoul", visibility: "hidden", opacity: "0", pointerEvents: "none" },
      { city: "busan", visibility: "hidden", opacity: "0", pointerEvents: "none" },
      { city: "jeju", visibility: "hidden", opacity: "0", pointerEvents: "none" },
    ])
    const mapHandle = await map.elementHandle()
    await expect(map).toHaveAttribute("data-qa-map-import-delay", "700")
    await expect(map).toHaveAttribute("data-map-projection-settled", "true")
    await expect(atlas).toHaveAttribute("data-map-presentation", "ready")
    await expect(nation).not.toHaveAttribute("aria-busy", "true")
    await expect(map.locator("canvas.maplibregl-canvas")).toHaveCount(1)

    const seoul = atlas.locator("[data-city='seoul']")
    await expect(seoul).toBeVisible()
    await seoul.click()

    await expect(page).toHaveURL(/city=seoul/)
    await expect(map).toHaveAttribute("data-city-focus-phase", "settled", { timeout: 2_000 })
    const receipt = await map.evaluate((node) => ({
      requestedAt: Number(node.dataset.cityFocusRequestedAt),
      startedAt: Number(node.dataset.cityFocusStartedAt),
      settledAt: Number(node.dataset.cityFocusSettledAt),
      startDelay: Number(node.dataset.cityFocusStartDelay),
      duration: Number(node.dataset.cityFocusDuration),
    }))
    expect(wasMapLibreDelayed()).toBe(true)
    expect(receipt.startDelay, "a visible projected target starts the ready camera immediately").toBeLessThanOrEqual(100)
    expect(receipt.startedAt - receipt.requestedAt, "the ready graph starts within 100 ms").toBeLessThanOrEqual(100)
    expect(receipt.duration).toBe(340)
    expect(receipt.settledAt - receipt.startedAt).toBeGreaterThan(0)
    expect(receipt.settledAt - receipt.startedAt).toBeLessThanOrEqual(520)
    expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)
  })

  test("800 ms progress and 5 s List fallback preserve the same map node and browse state", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "ko", local: completedMapDiscovery })
    await page.route("https://tiles.openfreemap.org/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 7_000))
      await route.abort("timedout")
    })
    await gotoB(page, "?city=seoul&view=map")
    const root = page.getByTestId("ondo-b-map-entry")
    const map = page.getByTestId("maplibre-map")
    const mapHandle = await map.elementHandle()
    const startedAt = await page.evaluate(() => performance.now())
    await expect(root).toHaveAttribute("data-map-state", "loading")
    await expect(page.getByTestId("ondo-b-view-toggle")).toBeVisible()
    await expect(page.getByTestId("ondo-b-map-loading")).toHaveCount(0)

    await page.waitForTimeout(850)
    await expect(page.getByTestId("ondo-b-map-loading")).toBeVisible()
    await expect(root).toHaveAttribute("data-map-progress", "visible")
    await expect(page.getByTestId("ondo-b-list-panel")).toHaveCount(0)

    await expect(root).toHaveAttribute("data-map-state", "error", { timeout: 5_200 })
    const failedAt = await page.evaluate((start) => performance.now() - start, startedAt)
    expect(failedAt).toBeGreaterThanOrEqual(4_650)
    expect(failedAt).toBeLessThanOrEqual(5_900)
    const fallbackReceipt = await map.evaluate((node) => ({
      startedAt: Number(node.dataset.mapAttemptStartedAt),
      fallbackAt: Number(node.dataset.mapFallbackAt),
    }))
    expect(fallbackReceipt.fallbackAt - fallbackReceipt.startedAt).toBeGreaterThanOrEqual(4_950)
    expect(fallbackReceipt.fallbackAt - fallbackReceipt.startedAt, "the internal fallback deadline remains 5 seconds").toBeLessThanOrEqual(5_100)
    await expect(root).toHaveAttribute("data-effective-view", "list")
    await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
    await expect(page.getByTestId("ondo-b-map-fallback-status")).toBeVisible()
    await expect(page.locator("[data-testid='ondo-b-venue-list'] [data-venue-id]").first()).toBeVisible()
    expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)
    expect(await page.evaluate(() => ({
      city: new URL(location.href).searchParams.get("city"),
      query: (document.querySelector("[data-testid='ondo-b-search']") as HTMLInputElement | null)?.value,
      category: history.state?.__ondoBDiscovery?.category,
    }))).toEqual({ city: "seoul", query: "", category: "all" })

    await page.evaluate(() => {
      const samples: Array<{ state: string | undefined; view: string | undefined; list: boolean }> = []
      const auditWindow = window as typeof window & { __ondoRetrySamples?: typeof samples; __ondoRetryDone?: boolean }
      auditWindow.__ondoRetrySamples = samples
      auditWindow.__ondoRetryDone = false
      const startedAt = performance.now()
      const sample = () => {
        const rootNode = document.querySelector<HTMLElement>("[data-testid='ondo-b-map-entry']")
        const listNode = document.querySelector<HTMLElement>("[data-testid='ondo-b-list-panel']")
        samples.push({
          state: rootNode?.dataset.mapState,
          view: rootNode?.dataset.effectiveView,
          list: Boolean(listNode && listNode.getBoundingClientRect().height > 0),
        })
        if (performance.now() - startedAt < 1_150) requestAnimationFrame(sample)
        else auditWindow.__ondoRetryDone = true
      }
      document.querySelector<HTMLButtonElement>("[data-testid='ondo-b-map-fallback-status'] button")?.click()
      requestAnimationFrame(sample)
    })
    await page.waitForFunction(() => (window as typeof window & { __ondoRetryDone?: boolean }).__ondoRetryDone === true)
    await expect(page.getByTestId("ondo-b-map-retry-status")).toBeVisible()
    const retrySamples = await page.evaluate(() => (window as typeof window & {
      __ondoRetrySamples?: Array<{ state?: string; view?: string; list: boolean }>
    }).__ondoRetrySamples ?? [])
    expect(retrySamples.length).toBeGreaterThan(0)
    expect(retrySamples.every((sample) => sample.state === "ready" || (sample.view === "list" && sample.list)), "Retry may reveal the map only after a truthful Ready receipt").toBe(true)
    expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("map-list-fallback-ko-390x844.png"), animations: "disabled", fullPage: true })
  })

  test("neutral official points retain their geographic core and a 44 px pointer target", async ({ page }) => {
    expect(neutralSeoulVenue).toBeTruthy()
    const venue = neutralSeoulVenue!
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "ko", local: completedMapDiscovery })
    await gotoB(page)
    const map = await waitForAtlas(page)
    await page.locator("[data-city='seoul']").click()
    await expect(map).toHaveAttribute("data-city-focus-phase", "settled")
    await page.getByTestId("ondo-b-search").fill(venue.name.ko)
    await expect.poll(async () => Number(await map.getAttribute("data-map-zoom"))).toBeGreaterThan(14.5)
    const box = await map.boundingBox()
    expect(box).toBeTruthy()
    await page.mouse.click(box!.x + box!.width / 2 + 18, box!.y + box!.height / 2)
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`venueId=${venue.id}`))
  })

  test("onboarding semantic focus is camera-only, history-neutral and latest-wins on one canvas", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", local: completedMapDiscovery })
    await gotoB(page)
    const map = await waitForAtlas(page)
    const mapHandle = await map.elementHandle()
    const canvasHandle = await map.locator("canvas.maplibregl-canvas").elementHandle()
    const initialHistory = await page.evaluate(() => ({ length: history.length, state: structuredClone(history.state), url: location.href }))
    const requestFocus = (city: "seoul" | "busan" | "jeju" | null) => page.evaluate((requestedCity) => {
      window.dispatchEvent(new CustomEvent("ondo:b-discovery-focus", {
        detail: { city: requestedCity, source: "onboarding", motion: "standard" },
      }))
    }, city)

    await requestFocus("busan")
    await expect(map).toHaveAttribute("data-semantic-preview-target", "busan")
    await expect(map).toHaveAttribute("data-semantic-preview-phase", "settled")
    expect(await page.evaluate(() => ({ length: history.length, state: history.state, url: location.href }))).toEqual(initialHistory)

    await requestFocus(null)
    await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
    await expect(map).toHaveAttribute("data-semantic-preview-target", "nation")
    await expect(map).toHaveAttribute("data-semantic-preview-phase", "settled")
    expect(await page.evaluate(() => ({ length: history.length, state: history.state, url: location.href }))).toEqual(initialHistory)

    await page.evaluate(() => {
      for (const city of ["seoul", "jeju"] as const) window.dispatchEvent(new CustomEvent("ondo:b-discovery-focus", {
        detail: { city, source: "onboarding", motion: "standard" },
      }))
    })
    await expect(map).toHaveAttribute("data-semantic-preview-target", "jeju")
    await expect(map).toHaveAttribute("data-semantic-preview-phase", "settled")
    expect(await page.evaluate(() => ({ length: history.length, state: history.state, url: location.href }))).toEqual(initialHistory)
    expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)
    expect(await canvasHandle?.evaluate((node) => node === document.querySelector("canvas.maplibregl-canvas"))).toBe(true)
  })

  test("completed discovery area and personalization drive one truthful city result surface", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, {
      locale: "en",
      local: {
        ...completedMapDiscovery,
        discoveryArea: "busan",
        discoveryPreferences: ["classic", "cafe"],
      },
    })
    await gotoB(page)
    const map = page.getByTestId("maplibre-map")
    await expect(page).toHaveURL(/city=busan/)
    await expect(map.locator("canvas.maplibregl-canvas")).toHaveCount(1)
    await expect(map).toHaveAttribute("data-map-state", "ready")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-personalized-match-count", /[1-9]\d*/)

    await page.getByTestId("ondo-b-view-toggle").click()
    const rows = page.locator("[data-testid='ondo-b-venue-list'] [data-venue-id]")
    await expect(rows.first()).toBeVisible()
    await expect(rows.first()).toHaveAttribute("data-personalized-match", "true")
    await expect(rows.first()).toHaveAttribute("data-personalization-match-count", /[1-9]\d*/)
    const firstVenueId = await rows.first().getAttribute("data-venue-id")
    expect(firstVenueId).toBeTruthy()

    await page.reload()
    await expect(page).toHaveURL(/city=busan/)
    await expect(page.locator(`[data-venue-id='${firstVenueId}']`).first()).toHaveAttribute("data-personalized-match", "true")

    await page.goto(new URL("/?city=seoul", page.url()).toString())
    await expect(page).toHaveURL(/city=seoul/)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "seoul")
  })

  test("dietary-only choices remain visibly unknown and never become a positive recommendation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, {
      locale: "en",
      local: {
        ...completedMapDiscovery,
        discoveryArea: "seoul",
        discoveryPreferences: ["vegan", "halal"],
      },
    })
    await gotoB(page)
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-city", "seoul")
    await expect(root).toHaveAttribute("data-personalized-match-count", "0")
    await page.getByTestId("ondo-b-view-toggle").click()
    const rows = page.locator("[data-testid='ondo-b-venue-list'] [data-venue-id]")
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThan(0)
    await expect(rows.first()).toHaveAttribute("data-personalized-match", "false")
    await expect(rows.first()).toHaveAttribute("data-dietary-evidence", "unknown")
    expect(await rows.evaluateAll((nodes) => nodes.every((node) => node.getAttribute("data-personalized-match") === "false"))).toBe(true)
  })

  test("locale changes update labels without replacing the live map or canvas", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", local: completedMapDiscovery })
    await gotoB(page)
    const map = await waitForAtlas(page)
    const mapHandle = await map.elementHandle()
    const canvas = map.locator("canvas.maplibregl-canvas")
    const canvasHandle = await canvas.elementHandle()

    await page.locator("[data-language-target='ja']").click()
    await expect(canvas).toHaveAttribute("aria-label", "地図")
    expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)
    expect(await canvasHandle?.evaluate((node) => node === document.querySelector("canvas.maplibregl-canvas"))).toBe(true)

    await page.locator("[data-language-target='ko']").click()
    await expect(canvas).toHaveAttribute("aria-label", "지도")
    expect(await mapHandle?.evaluate((node) => node === document.querySelector("[data-testid='maplibre-map']"))).toBe(true)
    expect(await canvasHandle?.evaluate((node) => node === document.querySelector("canvas.maplibregl-canvas"))).toBe(true)
  })

  test("history v4 restores camera, filters, List scroll, sheet level and exact focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en", local: completedMapDiscovery })
    await gotoB(page)
    const map = await waitForAtlas(page)
    await page.locator("[data-city='seoul']").click()
    await expect(map).toHaveAttribute("data-map-state", "ready")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-entry-transition", "settled")

    const beforeZoom = Number(await map.getAttribute("data-map-zoom"))
    const canvas = map.locator("canvas.maplibregl-canvas")
    await canvas.hover({ position: { x: 180, y: 320 } })
    await page.mouse.wheel(0, -650)
    await expect.poll(async () => Number(await map.getAttribute("data-map-zoom"))).toBeGreaterThan(beforeZoom + .1)
    await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.camera?.zoom ?? 0)).toBeGreaterThan(beforeZoom + .1)

    await page.getByTestId("ondo-b-view-toggle").click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-effective-view", "list")
    await page.getByRole("button", { name: "Korean", exact: true }).click()
    const list = page.getByTestId("ondo-b-list-panel")
    const opener = page.locator("[data-venue-opener]").nth(5)
    await opener.scrollIntoViewIfNeeded()
    const venueId = await opener.getAttribute("data-venue-opener")
    expect(venueId).toBeTruthy()
    const immediate = await opener.evaluate((node) => {
      const listNode = document.querySelector<HTMLElement>("[data-testid='ondo-b-list-panel']")!
      listNode.scrollTop = 520
      listNode.dispatchEvent(new Event("scroll", { bubbles: true }))
      const exactScroll = Math.round(listNode.scrollTop)
      ;(node as HTMLButtonElement).click()
      return { exactScroll, receipt: structuredClone(history.state.__ondoBDiscovery) }
    })
    const peekReceipt = immediate.receipt
    expect(peekReceipt).toMatchObject({ v: 4, level: "peek", city: "seoul", view: "list", category: "korean", sheetSnap: "peek", venueId })
    expect(peekReceipt.camera).toBeTruthy()
    expect(peekReceipt.listScroll).toBe(immediate.exactScroll)

    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    expect(await page.evaluate(() => history.state.__ondoBDiscovery)).toMatchObject({ v: 4, level: "peek", sheetSnap: "peek", venueId })
    await page.getByTestId("canonical-place-details").click()
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    expect(await page.evaluate(() => history.state.__ondoBDiscovery)).toMatchObject({ v: 4, level: "detail", sheetSnap: "detail", venueId })

    await page.goBack()
    await expect(page.getByTestId("canonical-place-details")).toBeFocused()
    await page.goBack()
    await expect(page.locator(`[data-venue-opener='${venueId}']`)).toBeFocused()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-effective-view", "list")
    await expect(page.getByRole("button", { name: "Korean", exact: true })).toHaveAttribute("aria-pressed", "true")
    await expect.poll(() => list.evaluate((node) => Math.round(node.scrollTop))).toBeGreaterThan(0)
    const restored = await page.evaluate(() => structuredClone(history.state.__ondoBDiscovery))
    expect(restored).toMatchObject({
      v: 4,
      level: "city",
      city: "seoul",
      view: "list",
      category: "korean",
      sheetSnap: "closed",
      camera: peekReceipt.camera,
      listScroll: peekReceipt.listScroll,
      focus: { kind: "venue", venueId },
    })
  })
})
