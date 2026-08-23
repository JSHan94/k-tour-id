import { expect, test, type Locator, type Page } from "@playwright/test"
import { expectMinimumControlTargets, gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
  { width: 740, height: 360 },
  { width: 844, height: 390 },
  { width: 926, height: 428 },
] as const

const DETERMINISTIC_TILEJSON = {
  tilejson: "3.0.0",
  name: "ONDO offline hitbox blank basemap",
  tiles: ["https://tiles.openfreemap.org/ondo-offline-hitbox-empty/{z}/{x}/{y}.pbf"],
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
  await page.route("https://tiles.openfreemap.org/ondo-offline-hitbox-empty/**", (route) => route.fulfill({
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

type Rect = { x: number; y: number; width: number; height: number }

function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

async function visibleControls(page: Page) {
  const controls: Array<{ name: string; locator: Locator }> = [
    { name: "city-back", locator: page.getByTestId("ondo-b-city-back") },
    { name: "language", locator: page.getByTestId("ondo-b-map-entry").locator("header").getByRole("button").last() },
    { name: "search", locator: page.getByTestId("ondo-b-search") },
    { name: "filter-all", locator: page.getByRole("button", { name: /^(All|전체)$/ }) },
    { name: "preferences", locator: page.getByTestId("ondo-b-preference-summary") },
    { name: "view-toggle", locator: page.getByTestId("ondo-b-view-toggle") },
    { name: "locate", locator: page.getByTestId("ondo-b-locate") },
    { name: "attribution", locator: page.getByRole("link", { name: /OpenFreeMap/ }) },
  ]
  for (const title of ["Zoom in", "Zoom out"]) controls.push({ name: title, locator: page.getByTitle(title) })
  return controls
}

test.describe("R5R offline provenance banner hitboxes", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
    await stubBasemap(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} real offline state keeps every unrelated map control readable and pointer-reachable`, async ({ page, context }) => {
      await seedB(page, { locale })
      const failures: unknown[] = []

      for (const viewport of VIEWPORTS) {
        await context.setOffline(false)
        await page.setViewportSize(viewport)
        await gotoB(page, "?city=seoul")
        const map = page.getByTestId("ondo-b-map-entry")
        await expect(map).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })

        await context.setOffline(true)
        await page.evaluate(() => window.dispatchEvent(new Event("offline")))
        const banner = page.getByTestId("ondo-b-offline-status")
        await expect(banner).toBeVisible()
        await expect(banner).toContainText(locale === "ko" ? "오프라인 · 저장된 정보" : "Offline · Saved information")
        await expect(banner).toContainText(locale === "ko" ? "2026. 8. 19." : "Aug 19, 2026")
        const bannerRect = await banner.boundingBox()

        for (const control of await visibleControls(page)) {
          if (!await control.locator.isVisible().catch(() => false)) continue
          const rect = await control.locator.boundingBox()
          if (!rect || !bannerRect) continue
          const centerHit = await control.locator.evaluate((element) => {
            const rect = element.getBoundingClientRect()
            const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
            return {
              reachable: hit === element || Boolean(hit && element.contains(hit)),
              hit: hit instanceof HTMLElement ? `${hit.tagName}.${hit.className}` : String(hit),
            }
          })
          if (!centerHit.reachable) {
            failures.push({ locale, viewport, control: control.name, bannerRect, controlRect: rect, intersects: intersects(bannerRect, rect), centerHit })
          }
        }

        await expect(banner).toHaveCSS("pointer-events", "none")
        await expectMinimumControlTargets(map)

        const search = page.getByTestId("ondo-b-search")
        await search.fill(locale === "ko" ? "커피" : "coffee")
        await expect(search).toHaveValue(locale === "ko" ? "커피" : "coffee")
        await page.getByRole("button", { name: locale === "ko" ? "ONDO 신호" : "ONDO signal", exact: true }).click()
        await expect(page.getByRole("button", { name: locale === "ko" ? "ONDO 신호" : "ONDO signal", exact: true })).toHaveAttribute("aria-pressed", "true")
        await page.getByTestId("ondo-b-view-toggle").click()
        const list = page.getByTestId("ondo-b-venue-list")
        await expect(list).toBeVisible()
        const firstVenue = list.locator("[data-venue-opener]").first()
        const venueHit = await firstVenue.evaluate((element) => {
          const rect = element.getBoundingClientRect()
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
          return {
            height: rect.height,
            reachable: hit === element || Boolean(hit && element.contains(hit)),
          }
        })
        expect(Math.round(venueHit.height)).toBeGreaterThanOrEqual(44)
        expect(venueHit.reachable).toBe(true)
        await page.getByTestId("ondo-b-view-toggle").click()
        await expect(page.getByTestId("maplibre-map")).toBeVisible()
      }

      await context.setOffline(false)
      expect(failures, JSON.stringify(failures, null, 2)).toEqual([])
    })
  }
})
