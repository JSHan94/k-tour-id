import { expect, test, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import {
  B_AFTER19_SESSION_KEY,
  allowBNextNavigationAbort,
  expectBRuntimeClean,
  expectMinimumControlTargets,
  expectNoHorizontalOverflow,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const FILTER_QUERY = "느린마을 양조장"
const FILTERED_VENUE_ID = "mois-18939eecb43c15ab4305"
const B_DISCOVERY_TRAVERSAL_EVENT = "ondo:b-discovery-traversal"
const DISCOVERY_CITY_HISTORY_KEYS = ["category", "city", "documentId", "focus", "level", "query", "v", "view"]
const DISCOVERY_PLACE_HISTORY_KEYS = ["category", "city", "documentId", "level", "query", "v", "venueId", "view"]
const LONG_SHAREABLE_QUERY = "shareable search ".repeat(30).slice(0, 120)
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
  name: "ONDO R5R empty basemap",
  tiles: ["https://tiles.openfreemap.org/ondo-r5r-empty/{z}/{x}/{y}.pbf"],
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
  await page.route("https://tiles.openfreemap.org/ondo-r5r-empty/**", (route) => route.fulfill({
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

async function openFilteredDetail(page: Page, locale: "en" | "ko") {
  await page.locator("[data-city='seoul']").click()
  await page.getByTestId("ondo-b-view-toggle").click()
  const search = page.getByRole("search").getByRole("textbox")
  await search.fill(FILTER_QUERY)
  await page.getByRole("button", { name: locale === "ko" ? "한식" : "Korean", exact: true }).click()
  const opener = page.locator(`[data-venue-opener='${FILTERED_VENUE_ID}']`)
  await expect(opener).toBeVisible()
  await opener.click()
  await expect(page.getByTestId("canonical-place-peek")).toBeFocused()
  await page.getByTestId("canonical-place-details").click()
  await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
  return { search, opener }
}

async function seedExpiredAfter19Proof(page: Page) {
  await page.evaluate((key) => sessionStorage.setItem(key, JSON.stringify({
    version: 1,
    age: "eligible",
    ageExpiresAt: "2020-08-19T11:30:00.000Z",
    mode: "on",
    activation: "manual",
    expiryNotice: false,
  })), B_AFTER19_SESSION_KEY)
}

async function rapidlyTraverseHistory(page: Page, delta: -1 | 1, count: number) {
  await page.evaluate(async ({ delta, count, eventName }) => {
    await new Promise<void>((resolve, reject) => {
      let remaining = count
      const timeoutId = window.setTimeout(() => {
        window.removeEventListener(eventName, onTraversal)
        reject(new Error(`Timed out after ${count - remaining}/${count} rapid history traversals`))
      }, 10_000)
      const onTraversal = () => {
        remaining -= 1
        if (remaining === 0) {
          window.clearTimeout(timeoutId)
          window.removeEventListener(eventName, onTraversal)
          resolve()
          return
        }
        history.go(delta)
      }
      window.addEventListener(eventName, onTraversal)
      history.go(delta)
    })
  }, { delta, count, eventName: B_DISCOVERY_TRAVERSAL_EVENT })
}

test.describe("SLEEK R5 retry history, resilience truth, and recovery focus", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko"] as const) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }] as const) {
      test(`R5R-D2-001 ${locale.toUpperCase()} ${viewport.width}x${viewport.height} Back and Forward restore the exact filtered discovery stack and focus`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seedB(page, { locale })
        await gotoB(page, "?qa=1&scenario=save-failed&campaign=history-audit")
        const { search, opener } = await openFilteredDetail(page, locale)

        await expect(page).toHaveURL(/city=seoul/)
        await expect(page).toHaveURL(/venueId=mois-18939eecb43c15ab4305/)
        await expect(page).toHaveURL(/detail=1/)
        await expect(page).toHaveURL(/category=korean/)
        await expect(page).not.toHaveURL(/[?&]heat=/)
        await expect(page).not.toHaveURL(/[?&](qa|scenario|campaign)=/)
        expect(await page.evaluate(() => new URL(location.href).searchParams.get("q"))).toBe(FILTER_QUERY)

        const peekTarget = new URL(page.url())
        peekTarget.searchParams.delete("detail")
        const consumePeekNavigationAbort = allowBNextNavigationAbort(page, {
          targetUrl: peekTarget.href,
          count: 1,
          minimumCount: 0,
        })
        await page.goBack()
        await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
        await expect(page.getByTestId("canonical-place-details")).toBeFocused()

        await page.goBack()
        await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
        await expect(search).toHaveValue(FILTER_QUERY)
        await expect(page.getByRole("button", { name: locale === "ko" ? "한식" : "Korean", exact: true })).toHaveAttribute("aria-pressed", "true")
        await expect(opener).toBeFocused()
        consumePeekNavigationAbort()

        await page.goBack()
        await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
        await expect(page.locator("[data-city='seoul']")).toBeFocused()

        await page.goForward()
        await expect(search).toHaveValue(FILTER_QUERY)
        await expect(page.getByRole("button", { name: locale === "ko" ? "한식" : "Korean", exact: true })).toHaveAttribute("aria-pressed", "true")
        await expect(opener).toBeFocused()
        await page.goForward()
        await expect(page.getByTestId("canonical-place-details")).toBeFocused()
        await page.goForward()
        const detail = page.getByTestId("canonical-place-overlay")
        await expect(detail).toBeVisible()
        await expect(detail).toBeFocused()

        expect(await page.evaluate(() => {
          const state = history.state as Record<string, unknown>
          return {
            keys: Object.keys(state),
            serialized: JSON.stringify(state.__ondoBDiscovery),
          }
        })).toMatchObject({ serialized: expect.not.stringMatching(/account|person|ageExpiresAt|gate|payment/i) })
      })
    }
  }

  test("R5R-D2-001 direct detail entry is safely unwindable, strips retired heat, and hard reload keeps shareable discovery context", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page)
    await gotoB(page, `?qa=1&scenario=save-failed&campaign=direct&city=seoul&view=list&venueId=${FILTERED_VENUE_ID}&detail=1&q=shareable-search&heat=pending`)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await expect(page).not.toHaveURL(/[?&](qa|scenario|campaign|heat)=/)
    expect(await page.evaluate(() => Object.fromEntries(new URL(location.href).searchParams))).toMatchObject({
      city: "seoul",
      view: "list",
      q: "shareable-search",
      venueId: FILTERED_VENUE_ID,
      detail: "1",
    })

    await page.goBack()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await page.goBack()
    await expect(page.getByRole("search").getByRole("textbox")).toHaveValue("shareable-search")
    await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true")
    await page.goBack()
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()

    await page.goForward()
    const search = page.getByRole("search").getByRole("textbox")
    await expect(search).toHaveValue("shareable-search")
    await search.fill(FILTER_QUERY)
    await page.getByRole("button", { name: "Korean", exact: true }).click()
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByRole("search").getByRole("textbox")).toHaveValue(FILTER_QUERY)
    await expect(page.getByRole("button", { name: "Korean", exact: true })).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(/city=seoul/)
    await expect(page).toHaveURL(/view=list/)
    await expect(page).toHaveURL(/category=korean/)
    await expect(page).not.toHaveURL(/[?&]heat=/)
    expect(await page.evaluate(() => new URL(location.href).searchParams.get("q"))).toBe(FILTER_QUERY)
  })

  test("R5R-D2-001 hard reload canonicalizes older Back entries while preserving shareable query, category, and unrelated history state", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page)
    await gotoB(page, "?qa=1&scenario=save-failed&campaign=nested-reload")
    await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.level)).toBe("nation")
    const initialHistory = await page.evaluate(() => {
      const state = history.state as Record<string, unknown>
      History.prototype.replaceState.call(history, { ...state, auditSentinel: { source: "next-state", count: 1 } }, "", location.href)
      return {
        length: history.length,
        nextKeys: Object.keys(state).filter((key) => key !== "__ondoBDiscovery").sort(),
      }
    })
    await openFilteredDetail(page, "en")
    await expect(page.locator("[data-detail-state='ready']")).toBeVisible()
    await page.goBack()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await page.evaluate((shareableQuery) => {
      const state = history.state as Record<string, unknown> & { __ondoBDiscovery: Record<string, unknown> }
      History.prototype.replaceState.call(history, {
        ...state,
        __ondoBDiscovery: {
          ...state.__ondoBDiscovery,
          query: shareableQuery,
          heat: "identity",
          focus: { kind: "venue", venueId: "private-account-id" },
          sensitiveExtra: { account: "ACC-ACTIVE", ageExpiresAt: "private" },
        },
      }, "", location.href)
    }, "shareable search ".repeat(30))
    await page.goForward()
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page.locator("[data-detail-state='ready']")).toBeVisible()
    const beforeReload = await page.evaluate(() => ({
      length: history.length,
      entry: history.state.__ondoBDiscovery as Record<string, unknown>,
      sentinel: history.state.auditSentinel,
      nextKeys: Object.keys(history.state).filter((key) => key !== "__ondoBDiscovery" && key !== "auditSentinel").sort(),
    }))
    expect(beforeReload.length).toBe(initialHistory.length + 3)
    expect(beforeReload.entry).toMatchObject({ v: 3, query: FILTER_QUERY, category: "korean", level: "detail" })
    expect(beforeReload.entry).not.toHaveProperty("heat")
    expect(beforeReload.sentinel).toEqual({ source: "next-state", count: 1 })
    expect(beforeReload.nextKeys).toEqual(initialHistory.nextKeys)
    const originalDocumentId = beforeReload.entry.documentId

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page.locator("[data-detail-state='ready']")).toBeVisible()
    const reloadedEntry = await page.evaluate(() => history.state.__ondoBDiscovery as Record<string, unknown>)
    expect(reloadedEntry).toMatchObject({ v: 3, query: FILTER_QUERY, category: "korean", level: "detail" })
    expect(Object.keys(reloadedEntry).sort()).toEqual(DISCOVERY_PLACE_HISTORY_KEYS)
    expect(reloadedEntry.documentId).not.toBe(originalDocumentId)

    const reloadedPeekUrl = new URL(page.url())
    reloadedPeekUrl.searchParams.delete("detail")
    const canonicalizedPeekUrl = new URL(reloadedPeekUrl)
    canonicalizedPeekUrl.searchParams.set("q", LONG_SHAREABLE_QUERY)
    const consumeReloadNavigationAbort = allowBNextNavigationAbort(page, {
      targetUrl: reloadedPeekUrl.href,
      count: 2,
      minimumCount: 0,
    })
    const consumeCanonicalizedNavigationAbort = allowBNextNavigationAbort(page, {
      targetUrl: canonicalizedPeekUrl.href,
      count: 2,
      minimumCount: 0,
    })
    await page.goBack()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    const stablePeekState = () => page.evaluate(() => ({
      level: history.state?.__ondoBDiscovery?.level,
      query: history.state?.__ondoBDiscovery?.query,
      urlQuery: new URL(location.href).searchParams.get("q"),
    }))
    const expectedPeekState = { level: "peek", query: LONG_SHAREABLE_QUERY, urlQuery: LONG_SHAREABLE_QUERY }
    await expect.poll(stablePeekState).toEqual(expectedPeekState)
    await page.waitForTimeout(100)
    await expect.poll(stablePeekState).toEqual(expectedPeekState)
    const peekEntry = await page.evaluate(() => ({
      length: history.length,
      entry: history.state.__ondoBDiscovery as Record<string, unknown>,
      sentinel: history.state.auditSentinel,
      nextKeys: Object.keys(history.state).filter((key) => key !== "__ondoBDiscovery" && key !== "auditSentinel").sort(),
    }))
    expect(peekEntry.length).toBe(initialHistory.length + 3)
    expect(peekEntry.entry).toMatchObject({ v: 3, query: LONG_SHAREABLE_QUERY, category: "korean", level: "peek" })
    expect(Object.keys(peekEntry.entry).sort()).toEqual(DISCOVERY_PLACE_HISTORY_KEYS)
    expect(peekEntry.entry.documentId).toBe(reloadedEntry.documentId)
    expect(peekEntry.sentinel).toEqual({ source: "next-state", count: 1 })
    expect(peekEntry.nextKeys).toEqual(initialHistory.nextKeys)
    expect(JSON.stringify(peekEntry.entry)).not.toMatch(/account|ageExpiresAt|private-account-id|sensitiveExtra|heat/i)
    expect(await page.evaluate(() => new URL(location.href).searchParams.get("q"))).toBe(LONG_SHAREABLE_QUERY)
    await expect(page).toHaveURL(/category=korean/)
    await expect(page).not.toHaveURL(/[?&]heat=/)

    await page.goBack()
    const search = page.getByRole("search").getByRole("textbox")
    await expect(search).toHaveValue(FILTER_QUERY)
    await expect(page.getByRole("button", { name: "Korean", exact: true })).toHaveAttribute("aria-pressed", "true")
    await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.level)).toBe("city")
    await page.waitForTimeout(500)
    const consumedNavigationAborts = [
      ...consumeReloadNavigationAbort(),
      ...consumeCanonicalizedNavigationAbort(),
    ]
    expect(consumedNavigationAborts.length).toBeLessThanOrEqual(2)
    const cityEntry = await page.evaluate(() => ({
      length: history.length,
      entry: history.state.__ondoBDiscovery as Record<string, unknown>,
      sentinel: history.state.auditSentinel,
      nextKeys: Object.keys(history.state).filter((key) => key !== "__ondoBDiscovery" && key !== "auditSentinel").sort(),
    }))
    expect(cityEntry.length).toBe(initialHistory.length + 3)
    expect(cityEntry.entry).toMatchObject({ v: 3, query: FILTER_QUERY, category: "korean", level: "city" })
    expect(Object.keys(cityEntry.entry).sort()).toEqual(DISCOVERY_CITY_HISTORY_KEYS)
    expect(cityEntry.entry.documentId).toBe(reloadedEntry.documentId)
    expect(cityEntry.sentinel).toEqual({ source: "next-state", count: 1 })
    expect(cityEntry.nextKeys).toEqual(initialHistory.nextKeys)
    expect(await page.evaluate(() => new URL(location.href).searchParams.get("q"))).toBe(FILTER_QUERY)
    await expect(page).toHaveURL(/category=korean/)
    await expect(page).not.toHaveURL(/[?&]heat=/)
  })

  test("R5R-D2-001 rapid popstate traversal converges on one stable surface and meaningful focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page)
    await gotoB(page, "?qa=1&scenario=save-failed&campaign=rapid-popstate")
    await openFilteredDetail(page, "en")

    await rapidlyTraverseHistory(page, -1, 3)
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)
    await expect(page.locator("[data-city='seoul']")).toBeFocused()

    await rapidlyTraverseHistory(page, 1, 3)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(1)
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeFocused()
    expect(await page.evaluate(() => history.state.__ondoBDiscovery)).toMatchObject({
      level: "detail",
      city: "seoul",
      view: "list",
      query: FILTER_QUERY,
      category: "korean",
      venueId: FILTERED_VENUE_ID,
    })
    expect(await page.evaluate(() => new URL(location.href).searchParams.get("q"))).toBe(FILTER_QUERY)
    await expect(page).toHaveURL(/category=korean/)
    await expect(page).not.toHaveURL(/[?&](qa|scenario|campaign|heat)=/)
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY")
  })

  test("R5R-D4-002 singular official-record grammar is exact in visible and accessible map truth at all frozen widths", async ({ page }) => {
    await seedB(page)
    await stubBasemap(page)
    for (const viewport of FROZEN_VIEWPORTS) {
      await page.setViewportSize(viewport)
      await gotoB(page, "?city=seoul&view=list")
      await page.getByRole("search").getByRole("textbox").fill(FILTER_QUERY)
      const root = page.getByTestId("ondo-b-map-entry")
      const resultBar = page.getByTestId("ondo-b-result-bar")
      await expect(root).toHaveAttribute("data-result-count", "1")
      await expect(resultBar.locator("b")).toHaveText("1 official record")
      await page.getByTestId("ondo-b-view-toggle").click()
      await expect(resultBar).toHaveAttribute("data-effective-view", "map")
      await expect(resultBar.locator("b")).toHaveText("1 official record")
      await expect(page.getByTestId("ondo-b-map-key")).toHaveAttribute("aria-label", /ONDO temperature · official groups/)
      await expectNoHorizontalOverflow(page, root)
      await expectMinimumControlTargets(root)
    }
  })

  test("R5R-D5-002 offline and map fallback preserve official-directory and source-snapshot truth", async ({ page, context }) => {
    await seedB(page)
    await stubBasemap(page)
    await gotoB(page, "?city=seoul")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event("offline")))
    const offline = page.getByTestId("ondo-b-location-message")
    await expect(offline).toHaveAttribute("data-message-kind", "offline")
    await expect(offline.locator("summary")).toContainText("Offline")
    await offline.locator("summary").click()
    await expect(offline.getByTestId("ondo-b-location-details")).toContainText("The place list is still available; map tiles may be unavailable.")
    const resultBar = page.getByTestId("ondo-b-result-bar")
    await expect(resultBar).toContainText("LOCALDATA source snapshot")
    await expect(resultBar).toContainText("Aug 19, 2026")
    await context.setOffline(false)

    await page.unrouteAll({ behavior: "wait" })
    await page.route(/tiles\.openfreemap\.org/, (route) => route.abort("failed"))
    await page.reload({ waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 12_000 })
    await expect(root).toHaveAttribute("data-map-partial-failure", "recoverable")
    await expect(page.getByTestId("ondo-b-map-transport-status")).toContainText("Map details unavailable")
    await page.getByTestId("ondo-b-view-toggle").click()
    await expect(page.getByTestId("ondo-b-result-bar")).toContainText("LOCALDATA source snapshot · Aug 19, 2026")
  })

  test("R5R-D5-003 an expired proof explains why After 19 returned to the same map", async ({ page }) => {
    await seedB(page, {
      session: {
        age: "AGE-VERIFIED",
        ageExpiresAt: "2020-08-19T20:30:00+09:00",
        after19: "A19-ON",
      },
    })
    await gotoB(page, "?city=seoul&view=list")
    const notice = page.getByTestId("global-after19-expiry-notice")
    await expect(notice).toBeVisible()
    await expect(notice).toContainText("The 19+ result expired. The same map remains open.")
    await expect(page.getByTestId("global-after19-toggle")).toHaveText("After 19")
  })

  for (const locale of ["en", "ko"] as const) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }] as const) {
      test(`R5R-D5-003 ${locale.toUpperCase()} ${viewport.width}x${viewport.height} expiry recheck returns exact focus after Escape and Stay`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seedB(page, {
          locale,
          session: {
            age: "AGE-VERIFIED",
            ageExpiresAt: "2020-08-19T20:30:00+09:00",
            after19: "A19-ON",
          },
        })
        await gotoB(page, "?city=seoul&view=list")

        for (const closeMode of ["escape", "stay"] as const) {
          if (closeMode === "stay") {
            await seedExpiredAfter19Proof(page)
            await page.reload({ waitUntil: "domcontentloaded" })
          }
          const notice = page.getByTestId("global-after19-expiry-notice")
          await expect(notice).toBeVisible()
          await notice.getByRole("button", { name: locale === "ko" ? "다시 확인" : "Check again", exact: true }).click()
          const prompt = page.getByTestId("global-after19-prompt-layer")
          await expect(prompt).toBeVisible()
          await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("inert", "")
          await expect(page.locator("[role='dialog'][aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
          if (locale === "en" && viewport.width === 390 && closeMode === "escape") {
            const axe = await new AxeBuilder({ page }).include("[data-testid='global-after19-prompt-layer']").analyze()
            expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])
          }

          if (closeMode === "escape") await page.keyboard.press("Escape")
          else await prompt.getByRole("button", { name: locale === "ko" ? "이 지도에 머물기" : "Stay on this map", exact: true }).click()
          await expect(prompt).toHaveCount(0)
          await expect(page.getByTestId("global-after19-expiry-notice")).toHaveCount(0)
          const toggle = page.getByTestId("global-after19-toggle")
          await expect(toggle).toBeFocused()
          expect(await toggle.evaluate((element) => element.isConnected && document.activeElement === element && document.activeElement !== document.body)).toBe(true)
          for (let attempt = 0; attempt < 3; attempt += 1) {
            await page.keyboard.press("Tab")
            const activeTag = await page.evaluate(() => document.activeElement?.tagName)
            if (activeTag !== "NEXTJS-PORTAL" && activeTag !== "BODY") break
          }
          expect(await page.evaluate(() => {
            const active = document.activeElement
            return active instanceof HTMLElement
              && active !== document.body
              && active.isConnected
              && !active.closest("[inert], [aria-hidden='true']")
          })).toBe(true)
          await expect(page.getByTestId("ondo-main-nav")).not.toHaveAttribute("inert", "")
          await expect(page.locator("[data-testid='ondo-canvas'] [inert]")).toHaveCount(0)
        }
      })
    }
  }

  test("R5R-D5-005 the List alternate after a recoverable partial keeps keyboard focus on discovery controls", async ({ page }) => {
    await seedB(page)
    await page.route(/tiles\.openfreemap\.org/, async (route) => {
      return route.abort("failed")
    })
    await gotoB(page, "?city=seoul")
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 12_000 })
    await expect(root).toHaveAttribute("data-map-partial-failure", "recoverable")
    await page.getByTestId("ondo-b-view-toggle").click()
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await expect(root).toHaveAttribute("data-effective-view", "list")
    await expect(page.getByTestId("ondo-b-view-toggle")).toBeFocused()
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY")
    const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-root']").analyze()
    expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])
  })
})
