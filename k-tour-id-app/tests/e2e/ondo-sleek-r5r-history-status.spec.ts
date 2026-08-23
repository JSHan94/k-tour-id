import { expect, test, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import {
  expectBRuntimeClean,
  expectMinimumControlTargets,
  expectNoHorizontalOverflow,
  getBRuntimeEvidence,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const FILTER_QUERY = "느린마을 양조장"
const FILTERED_VENUE_ID = "mois-18939eecb43c15ab4305"
const B_DISCOVERY_TRAVERSAL_EVENT = "ondo:b-discovery-traversal"
const DISCOVERY_HISTORY_KEYS = ["city", "documentId", "focus", "heat", "level", "query", "v", "venueId", "view"]
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
  await page.getByRole("button", { name: locale === "ko" ? "ONDO 신호" : "ONDO signal", exact: true }).click()
  const opener = page.locator(`[data-venue-opener='${FILTERED_VENUE_ID}']`)
  await expect(opener).toBeVisible()
  await opener.click()
  await expect(page.getByTestId("canonical-place-details")).toBeFocused()
  await page.getByTestId("canonical-place-details").click()
  await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
  return { search, opener }
}

async function seedExpiredAfter19Proof(page: Page) {
  await page.evaluate(() => {
    const session = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}") as Record<string, unknown>
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      ...session,
      age: "AGE-VERIFIED",
      ageExpiresAt: "2020-08-19T20:30:00+09:00",
      after19: "A19-ON",
    }))
  })
}

function discardExpectedDetailNavigationAbort(page: Page) {
  const evidence = getBRuntimeEvidence(page)
  const expectedAbort = new RegExp(`^requestfailed: .*/api/ondo/venues/${FILTERED_VENUE_ID} · net::ERR_ABORTED$`)
  for (let index = evidence.product.length - 1; index >= 0; index -= 1) {
    if (expectedAbort.test(evidence.product[index])) evidence.product.splice(index, 1)
  }
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
        await gotoB(page, "?scenario=save-failed&campaign=history-audit")
        const { search, opener } = await openFilteredDetail(page, locale)

        await expect(page).toHaveURL(/scenario=save-failed/)
        await expect(page).toHaveURL(/campaign=history-audit/)
        await expect(page).toHaveURL(/city=seoul/)
        await expect(page).toHaveURL(/venueId=mois-18939eecb43c15ab4305/)
        await expect(page).toHaveURL(/detail=1/)
        await expect(page).not.toHaveURL(/[?&](q|heat)=/)

        await page.goBack()
        await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
        await expect(page.getByTestId("canonical-place-details")).toBeFocused()

        await page.goBack()
        await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
        await expect(search).toHaveValue(FILTER_QUERY)
        await expect(page.getByRole("button", { name: locale === "ko" ? "ONDO 신호" : "ONDO signal", exact: true })).toHaveAttribute("aria-pressed", "true")
        await expect(opener).toBeFocused()

        await page.goBack()
        await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
        await expect(page.locator("[data-city='seoul']")).toBeFocused()

        await page.goForward()
        await expect(search).toHaveValue(FILTER_QUERY)
        await expect(opener).toBeFocused()
        await page.goForward()
        await expect(page.getByTestId("canonical-place-details")).toBeFocused()
        await page.goForward()
        await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
        await expect(page.getByTestId("canonical-place-overlay").getByRole("article").getByRole("button", { name: locale === "ko" ? "장소 요약으로" : "Back to place summary" })).toBeFocused()

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

  test("R5R-D2-001 direct detail entry is safely unwindable, sanitizes discovery URL fields, and hard reload clears state-only filters", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page)
    await gotoB(page, `?scenario=save-failed&campaign=direct&city=seoul&view=list&venueId=${FILTERED_VENUE_ID}&detail=1&q=private-search&heat=pending`)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await expect(page).toHaveURL(/scenario=save-failed/)
    await expect(page).toHaveURL(/campaign=direct/)
    await expect(page).not.toHaveURL(/[?&](q|heat)=/)

    await page.goBack()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await page.goBack()
    await expect(page.getByRole("search").getByRole("textbox")).toHaveValue("")
    await expect(page.getByRole("button", { name: "All places", exact: true })).toHaveAttribute("aria-pressed", "true")
    await page.goBack()
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()

    await page.goForward()
    const search = page.getByRole("search").getByRole("textbox")
    await search.fill(FILTER_QUERY)
    await page.getByRole("button", { name: "ONDO signal", exact: true }).click()
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByRole("search").getByRole("textbox")).toHaveValue("")
    await expect(page.getByRole("button", { name: "All places", exact: true })).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(/city=seoul/)
    await expect(page).toHaveURL(/view=list/)
    discardExpectedDetailNavigationAbort(page)
  })

  test("R5R-D2-001 hard reload also clears state-only filters from older Back entries without replacing unrelated history state", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page)
    await gotoB(page, "?scenario=save-failed&campaign=nested-reload")
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
    await page.evaluate(() => {
      const state = history.state as Record<string, unknown> & { __ondoBDiscovery: Record<string, unknown> }
      History.prototype.replaceState.call(history, {
        ...state,
        __ondoBDiscovery: {
          ...state.__ondoBDiscovery,
          query: "private search ".repeat(30),
          heat: "identity",
          focus: { kind: "venue", venueId: "private-account-id" },
          sensitiveExtra: { account: "ACC-ACTIVE", ageExpiresAt: "private" },
        },
      }, "", location.href)
    })
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
    expect(beforeReload.entry).toMatchObject({ query: FILTER_QUERY, heat: "signal", level: "detail" })
    expect(beforeReload.sentinel).toEqual({ source: "next-state", count: 1 })
    expect(beforeReload.nextKeys).toEqual(initialHistory.nextKeys)
    const originalDocumentId = beforeReload.entry.documentId

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page.locator("[data-detail-state='ready']")).toBeVisible()
    const reloadedEntry = await page.evaluate(() => history.state.__ondoBDiscovery as Record<string, unknown>)
    expect(reloadedEntry).toMatchObject({ query: "", heat: "all", level: "detail" })
    expect(reloadedEntry.documentId).not.toBe(originalDocumentId)

    await page.goBack()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.level)).toBe("peek")
    const peekEntry = await page.evaluate(() => ({
      length: history.length,
      entry: history.state.__ondoBDiscovery as Record<string, unknown>,
      sentinel: history.state.auditSentinel,
      nextKeys: Object.keys(history.state).filter((key) => key !== "__ondoBDiscovery" && key !== "auditSentinel").sort(),
    }))
    expect(peekEntry.length).toBe(initialHistory.length + 3)
    expect(peekEntry.entry).toMatchObject({ query: "", heat: "all", level: "peek" })
    expect(Object.keys(peekEntry.entry).sort()).toEqual(DISCOVERY_HISTORY_KEYS)
    expect(peekEntry.entry.documentId).toBe(reloadedEntry.documentId)
    expect(peekEntry.sentinel).toEqual({ source: "next-state", count: 1 })
    expect(peekEntry.nextKeys).toEqual(initialHistory.nextKeys)
    await expect(page).not.toHaveURL(/[?&](q|heat)=/)

    await page.goBack()
    const search = page.getByRole("search").getByRole("textbox")
    await expect(search).toHaveValue("")
    await expect(page.getByRole("button", { name: "All places", exact: true })).toHaveAttribute("aria-pressed", "true")
    await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.level)).toBe("city")
    const cityEntry = await page.evaluate(() => ({
      length: history.length,
      entry: history.state.__ondoBDiscovery as Record<string, unknown>,
      sentinel: history.state.auditSentinel,
      nextKeys: Object.keys(history.state).filter((key) => key !== "__ondoBDiscovery" && key !== "auditSentinel").sort(),
    }))
    expect(cityEntry.length).toBe(initialHistory.length + 3)
    expect(cityEntry.entry).toMatchObject({ query: "", heat: "all", level: "city" })
    expect(Object.keys(cityEntry.entry).sort()).toEqual(DISCOVERY_HISTORY_KEYS)
    expect(cityEntry.entry.documentId).toBe(reloadedEntry.documentId)
    expect(cityEntry.sentinel).toEqual({ source: "next-state", count: 1 })
    expect(cityEntry.nextKeys).toEqual(initialHistory.nextKeys)
    await expect(page).not.toHaveURL(/[?&](q|heat)=/)

    // Reloading the open detail intentionally cancels that document's detail
    // request. Keep the global guard strict for every other runtime failure.
    discardExpectedDetailNavigationAbort(page)
  })

  test("R5R-D2-001 rapid popstate traversal converges on one stable surface and meaningful focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page)
    await gotoB(page, "?scenario=save-failed&campaign=rapid-popstate")
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
    await expect(page.getByTestId("canonical-place-overlay").getByRole("article").getByRole("button", { name: "Back to place summary" })).toBeFocused()
    expect(await page.evaluate(() => history.state.__ondoBDiscovery)).toMatchObject({
      level: "detail",
      city: "seoul",
      view: "list",
      query: FILTER_QUERY,
      heat: "signal",
      venueId: FILTERED_VENUE_ID,
    })
    await expect(page).toHaveURL(/scenario=save-failed/)
    await expect(page).toHaveURL(/campaign=rapid-popstate/)
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY")
  })

  test("R5R-D4-002 singular sourced-place grammar is exact in visible and accessible map truth at all frozen widths", async ({ page }) => {
    await seedB(page)
    await stubBasemap(page)
    for (const viewport of FROZEN_VIEWPORTS) {
      await page.setViewportSize(viewport)
      await gotoB(page, "?city=seoul&view=list")
      await page.getByRole("search").getByRole("textbox").fill(FILTER_QUERY)
      await expect(page.getByText("1 sourced food place", { exact: true })).toBeVisible()
      await page.getByTestId("ondo-b-view-toggle").click()
      await expect(page.getByTestId("ondo-b-map-key")).toHaveAttribute("aria-label", /1 sourced food place\./)
      await expect(page.getByTestId("ondo-b-map-key")).not.toHaveAttribute("aria-label", /1 sourced food places/)
      await expectNoHorizontalOverflow(page, page.getByTestId("ondo-b-root"))
      await expectMinimumControlTargets(page.getByTestId("ondo-b-root"))
    }
  })

  test("R5R-D5-002 offline and map fallback identify the saved fixture snapshot and timestamp", async ({ page, context }) => {
    await seedB(page)
    await stubBasemap(page)
    await gotoB(page, "?city=seoul")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await context.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event("offline")))
    const offline = page.getByTestId("ondo-b-offline-status")
    await expect(offline).toHaveAttribute("role", "status")
    await expect(offline).toContainText("Offline · Saved information")
    await expect(offline).toContainText("MOIS LOCALDATA fixture snapshot")
    await expect(offline).toContainText("Aug 19, 2026")
    await context.setOffline(false)

    await page.unrouteAll({ behavior: "wait" })
    await page.route(/tiles\.openfreemap\.org/, (route) => route.abort("failed"))
    await page.reload({ waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "error", { timeout: 12_000 })
    const fallback = page.getByTestId("ondo-b-map-fallback-status")
    await expect(fallback).toContainText("The map could not load")
    await expect(fallback).toContainText("MOIS LOCALDATA fixture snapshot")
    await expect(fallback).toContainText("Aug 19, 2026")
  })

  test("R5R-D5-003 an expired proof explains why After 19 returned to the day map", async ({ page }) => {
    await seedB(page, {
      session: {
        age: "AGE-VERIFIED",
        ageExpiresAt: "2020-08-19T20:30:00+09:00",
        after19: "A19-ON",
      },
    })
    await gotoB(page, "?city=seoul&view=list")
    const notice = page.getByTestId("after19-expiry-notice")
    await expect(notice).toBeVisible()
    await expect(notice.getByRole("status")).toContainText("Your 19+ check expired, so the main map is shown.")
    await expect(page.getByTestId("after19-toggle")).toHaveText("After 19")
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
          const notice = page.getByTestId("after19-expiry-notice")
          await expect(notice).toBeVisible()
          await notice.getByRole("button", { name: locale === "ko" ? "19+ 다시 확인" : "Check 19+ again" }).click()
          const prompt = page.getByTestId("after19-prompt-layer")
          await expect(prompt).toBeVisible()
          await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("inert", "")
          await expect(page.locator("[role='dialog'][aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
          if (locale === "en" && viewport.width === 390 && closeMode === "escape") {
            const axe = await new AxeBuilder({ page }).include("[data-testid='after19-prompt-layer']").analyze()
            expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])
          }

          if (closeMode === "escape") await page.keyboard.press("Escape")
          else await prompt.getByRole("button", { name: locale === "ko" ? "기본 지도에 머물기" : "Stay on the main map" }).click()
          await expect(prompt).toHaveCount(0)
          await expect(page.getByTestId("after19-expiry-notice")).toHaveCount(0)
          const toggle = page.getByTestId("after19-toggle")
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

  test("R5R-D5-005 successful map retry restores keyboard focus to the recovered discovery controls", async ({ page }) => {
    await seedB(page)
    let fail = true
    await page.route(/tiles\.openfreemap\.org/, async (route) => {
      if (fail) return route.abort("failed")
      if (route.request().url().endsWith("/planet")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(DETERMINISTIC_TILEJSON) })
      return route.fulfill({ status: 200, contentType: "application/x-protobuf", body: Buffer.alloc(0) })
    })
    await gotoB(page, "?city=seoul")
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "error", { timeout: 12_000 })
    fail = false
    await page.getByRole("button", { name: "Retry map" }).click()
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await expect(page.getByTestId("ondo-b-view-toggle")).toBeFocused()
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY")
    const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-root']").analyze()
    expect(axe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])
  })
})
