import { expect, test, type BrowserContext, type Page, type Request as PlaywrightRequest } from "@playwright/test"
import {
  expectBRuntimeClean,
  getBRuntimeEvidence,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const FILTER_QUERY = "느린마을 양조장"
const FILTERED_VENUE_ID = "mois-18939eecb43c15ab4305"
const FROZEN_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
] as const

const DETERMINISTIC_TILEJSON = {
  tilejson: "3.0.0",
  name: "ONDO offline-history empty basemap",
  tiles: ["https://tiles.openfreemap.org/ondo-offline-history-empty/{z}/{x}/{y}.pbf"],
  minzoom: 0,
  maxzoom: 18,
  bounds: [124, 33, 132, 39],
}

async function stubBasemap(page: Page) {
  await page.route("https://tiles.openfreemap.org/planet", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(DETERMINISTIC_TILEJSON),
  }))
  await page.route("https://tiles.openfreemap.org/ondo-offline-history-empty/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/x-protobuf",
    body: Buffer.alloc(0),
  }))
  await page.route("https://tiles.openfreemap.org/fonts/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/x-protobuf",
    body: Buffer.alloc(0),
  }))
}

async function setOffline(context: BrowserContext, page: Page, offline: boolean) {
  await context.setOffline(offline)
  await page.evaluate((nextOffline) => window.dispatchEvent(new Event(nextOffline ? "offline" : "online")), offline)
}

function auditLocalRequestsAfterOffline(page: Page) {
  const requests: string[] = []
  let active = false
  const onRequest = (request: PlaywrightRequest) => {
    if (!active) return
    const url = new URL(request.url())
    if (url.origin === new URL(page.url()).origin) requests.push(`${request.method()} ${request.resourceType()} ${url.pathname}${url.search}`)
  }
  page.on("request", onRequest)
  return {
    start() { active = true },
    expectNone() { expect(requests, "offline discovery history must stay entirely client-local").toEqual([]) },
    stop() { page.off("request", onRequest) },
  }
}

async function openFilteredList(page: Page) {
  await page.getByTestId("ondo-b-view-toggle").click()
  const search = page.getByRole("search").getByRole("textbox")
  await search.fill(FILTER_QUERY)
  const opener = page.locator(`[data-venue-opener='${FILTERED_VENUE_ID}']`)
  await expect(opener).toBeVisible()
  return { search, opener }
}

async function traverse(page: Page, direction: "back" | "forward") {
  await page.evaluate((nextDirection) => history[nextDirection](), direction)
}

test.describe("SLEEK offline discovery history stays inside the hydrated B document", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} offline list peek, Back, and Forward remain local across all six frozen widths`, async ({ page, context }) => {
      await seedB(page, { locale })
      for (const viewport of FROZEN_VIEWPORTS) {
        await test.step(`${viewport.width}x${viewport.height}`, async () => {
          await setOffline(context, page, false)
          await page.setViewportSize(viewport)
          await gotoB(page, "?campaign=offline-history&city=seoul")
          const { search, opener } = await openFilteredList(page)
          const before = await page.evaluate(() => ({
            device: JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}"),
            account: sessionStorage.getItem("ondo-b.account.v1"),
            actionGates: sessionStorage.getItem("ondo-b.action-gates.v1"),
            after19: sessionStorage.getItem("ondo-b.after19.session.v1"),
            historyLength: history.length,
          }))
          const requestAudit = auditLocalRequestsAfterOffline(page)
          await setOffline(context, page, true)
          requestAudit.start()

          await opener.click()
          await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
          await expect(page).toHaveURL(new RegExp(`city=seoul.*view=list.*venueId=${FILTERED_VENUE_ID}`))
          expect(new URL(page.url()).searchParams.get("q")).toBe(FILTER_QUERY)
          await expect(page).not.toHaveURL(/[?&]heat=/)

          await traverse(page, "back")
          await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
          await expect(search).toHaveValue(FILTER_QUERY)
          await expect(opener).toBeFocused()

          await traverse(page, "forward")
          await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
          await expect(page.getByTestId("canonical-place-details")).toBeFocused()
          await expect(page.getByTestId("ondo-b-root")).toBeVisible()
          await expect(page.locator("#__next_error__")).toHaveCount(0)

          const after = await page.evaluate(() => ({
            device: JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}"),
            account: sessionStorage.getItem("ondo-b.account.v1"),
            actionGates: sessionStorage.getItem("ondo-b.action-gates.v1"),
            after19: sessionStorage.getItem("ondo-b.after19.session.v1"),
            historyLength: history.length,
            historyState: history.state?.__ondoBDiscovery,
          }))
          expect(after.device).toEqual({
            ...before.device,
            recentVenueIds: [FILTERED_VENUE_ID, ...(before.device.recentVenueIds ?? []).filter((venueId: string) => venueId !== FILTERED_VENUE_ID)].slice(0, 12),
          })
          expect(after.account).toBe(before.account)
          expect(after.actionGates).toBe(before.actionGates)
          expect(after.after19).toBe(before.after19)
          expect(after.historyLength).toBe(before.historyLength + 1)
          expect(after.historyState).toEqual({
            v: 3,
            documentId: expect.any(String),
            level: "peek",
            city: "seoul",
            view: "list",
            query: FILTER_QUERY,
            category: "all",
            venueId: FILTERED_VENUE_ID,
          })
          expect(JSON.stringify(after.historyState)).not.toMatch(/account|person|ageExpiresAt|payment|private-search/i)
          requestAudit.expectNone()
          requestAudit.stop()

          await setOffline(context, page, false)
          await traverse(page, "back")
          await expect(search).toHaveValue(FILTER_QUERY)
          await opener.click()
          await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
        })
      }
      await setOffline(context, page, false)
    })
  }

  test("offline map marker opens the canonical peek locally and restores exact map search focus", async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page)
    await stubBasemap(page)
    await gotoB(page, "?campaign=offline-marker&city=seoul")
    const search = page.getByRole("search").getByRole("textbox")
    await search.fill(FILTER_QUERY)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-result-count", "1")

    const requestAudit = auditLocalRequestsAfterOffline(page)
    await setOffline(context, page, true)
    requestAudit.start()
    const canvas = page.locator("canvas.maplibregl-canvas")
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(page).toHaveURL(/city=seoul.*venueId=mois-[a-z0-9]{20}/)
    expect(new URL(page.url()).searchParams.get("q")).toBe(FILTER_QUERY)
    const selectedVenueId = new URL(page.url()).searchParams.get("venueId")
    expect(selectedVenueId).toMatch(/^mois-[a-z0-9]{20}$/)

    await traverse(page, "back")
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
    await expect(search).toHaveValue(FILTER_QUERY)
    await expect(page.getByTestId("ondo-b-view-toggle")).toBeFocused()
    await traverse(page, "forward")
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`venueId=${selectedVenueId}`))
    requestAudit.expectNone()
    requestAudit.stop()
    await setOffline(context, page, false)
  })

  test("direct-entry peek unwinds and restores offline without an RSC or document recovery", async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await seedB(page, { locale: "ko" })
    await gotoB(page, `?campaign=offline-direct&city=seoul&view=list&venueId=${FILTERED_VENUE_ID}`)
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`city=seoul.*view=list.*venueId=${FILTERED_VENUE_ID}`))
    await expect(page).not.toHaveURL(/[?&]campaign=/)
    const requestAudit = auditLocalRequestsAfterOffline(page)
    await setOffline(context, page, true)
    requestAudit.start()

    await traverse(page, "back")
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-view-toggle")).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByTestId("ondo-b-view-toggle")).toHaveAccessibleName("지도")
    await traverse(page, "forward")
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(page).not.toHaveURL(/[?&]campaign=/)
    await expect(page).not.toHaveURL(/[?&]heat=/)
    requestAudit.expectNone()
    requestAudit.stop()
    expect(getBRuntimeEvidence(page).product).toEqual([])
    await setOffline(context, page, false)
  })

  test("B traversal guard reattaches exactly once after cleanup while invalid and non-B events pass downstream", async ({ page }) => {
    await seedB(page)
    await gotoB(page, "?campaign=guard-lifecycle")
    await page.locator("[data-city='seoul']").click()
    await page.getByTestId("ondo-b-view-toggle").click()
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("nav-my")).toHaveAttribute("aria-current", "page")
    await page.getByTestId("nav-ondo").click()
    await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()

    const receipt = await page.evaluate((eventName) => {
      const originalUrl = `${location.pathname}${location.search}${location.hash}`
      const state = history.state as Record<string, unknown>
      const entry = state.__ondoBDiscovery
      let ownedTraversals = 0
      let downstreamPopstates = 0
      const onOwnedTraversal = () => { ownedTraversals += 1 }
      const onDownstreamPopstate = (event: PopStateEvent) => {
        downstreamPopstates += 1
        event.stopImmediatePropagation()
      }
      window.addEventListener(eventName, onOwnedTraversal)
      window.addEventListener("popstate", onDownstreamPopstate, { capture: true })

      History.prototype.replaceState.call(history, state, "", `/ondo-b-shadow${location.search}`)
      window.dispatchEvent(new PopStateEvent("popstate", { state }))
      History.prototype.replaceState.call(history, state, "", originalUrl)
      window.dispatchEvent(new PopStateEvent("popstate", { state: { ...state, __ondoBDiscovery: { v: 0, level: "city" } } }))
      window.dispatchEvent(new PopStateEvent("popstate", { state: { ...state, __ondoBDiscovery: entry } }))

      window.removeEventListener(eventName, onOwnedTraversal)
      window.removeEventListener("popstate", onDownstreamPopstate, { capture: true })
      return { ownedTraversals, downstreamPopstates, pathname: location.pathname }
    }, "ondo:b-discovery-traversal")

    expect(receipt).toEqual({ ownedTraversals: 1, downstreamPopstates: 2, pathname: "/ondo-b" })
    await traverse(page, "back")
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect.poll(() => page.evaluate(() => ({
      activeCity: document.activeElement?.getAttribute("data-city"),
      entry: history.state?.__ondoBDiscovery,
    }))).toMatchObject({
      activeCity: "seoul",
      entry: { level: "nation", focus: { kind: "city", city: "seoul" } },
    })

    await page.evaluate(() => window.dispatchEvent(new PopStateEvent("popstate", { state: history.state })))
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("nav-my")).toHaveAttribute("aria-current", "page")
    await page.getByTestId("nav-ondo").click()
    await expect(page.getByTestId("nav-ondo")).toHaveAttribute("aria-current", "page")
    await page.getByTestId("nav-ondo").focus()
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))))
    await expect(page.getByTestId("nav-ondo")).toBeFocused()
  })
})
