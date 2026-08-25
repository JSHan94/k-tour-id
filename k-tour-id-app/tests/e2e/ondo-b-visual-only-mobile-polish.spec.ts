import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const PEAK_VENUE_ID = "mois-0021cd596bc5b2a922ad"
const LONG_NAME_VENUE_ID = "mois-39b203dd906f14790f7d"

async function seed(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
}

async function box(locator: Locator) {
  const result = await locator.boundingBox()
  expect(result).not.toBeNull()
  return result!
}

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x)
    && Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y)
}

test.describe("visual-only mobile product polish", () => {
  test.describe.configure({ timeout: 120_000 })

  for (const locale of ["en", "ko"] as const) {
    for (const viewport of [
      { width: 320, height: 720 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 1440, height: 1000 },
    ]) {
      test(`${locale} ${viewport.width}x${viewport.height} city choices never collide or hide behind navigation`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seed(page, locale)
        await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

        const nation = page.getByTestId("ondo-b-nation")
        const seoul = nation.locator("[data-city='seoul']")
        const busan = nation.locator("[data-city='busan']")
        const nav = page.getByTestId("ondo-main-nav")
        await expect(nation).toBeVisible()
        await expect(seoul).toBeVisible()
        await expect(busan).toBeVisible()

        const [seoulBox, busanBox, navBox] = await Promise.all([box(seoul), box(busan), box(nav)])
        expect(intersects(seoulBox, busanBox)).toBe(false)
        expect(intersects(seoulBox, navBox)).toBe(false)
        expect(intersects(busanBox, navBox)).toBe(false)
        expect(Math.min(seoulBox.height, busanBox.height)).toBeGreaterThanOrEqual(72)
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
        const atlas = nation.locator("svg").locator("..")
        expect(await atlas.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)

        for (const city of [seoul, busan]) {
          const hit = await city.evaluate((element) => {
            const rect = element.getBoundingClientRect()
            return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest("button") === element
          })
          expect(hit).toBe(true)
        }
      })
    }
  }

  for (const locale of ["en", "ko"] as const) {
    for (const viewport of [
      { width: 320, height: 720 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      test(`${locale} ${viewport.width}x${viewport.height} place peek stays compact and action complete`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seed(page, locale)
        await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
        const row = page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${PEAK_VENUE_ID}']`)
        await row.locator("button").click()

        const root = page.getByTestId("ondo-b-map-entry")
        const peek = page.getByTestId("canonical-place-peek")
        await expect(peek).toBeVisible()
        await expect(peek.getByTestId("canonical-place-details")).toBeVisible()
        await expect(peek.getByTestId("canonical-venue-directions")).toBeVisible()
        await expect(peek.getByTestId("canonical-place-pulse")).toBeVisible()

        const [rootBox, peekBox] = await Promise.all([box(root), box(peek)])
        expect(peekBox.height / rootBox.height).toBeLessThanOrEqual(.46)
        expect(peekBox.y).toBeGreaterThanOrEqual(rootBox.y + rootBox.height * .5)
        expect(await peek.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)

        for (const action of [peek.getByTestId("canonical-place-details"), peek.getByTestId("canonical-venue-directions")]) {
          const actionBox = await box(action)
          expect(actionBox.height).toBeGreaterThanOrEqual(44)
        }
      })
    }
  }

  test("short landscape uses a readable side sheet and keeps both decisions in view", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await seed(page, "en")
    await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
    await page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${PEAK_VENUE_ID}'] button`).click()
    const peek = page.getByTestId("canonical-place-peek")
    const root = page.getByTestId("ondo-b-map-entry")
    const peekBox = await box(peek)
    const rootBox = await box(root)
    expect(peekBox.width).toBeLessThanOrEqual(460)
    expect(peekBox.x - rootBox.x).toBeGreaterThanOrEqual(rootBox.width * .5)
    expect(peekBox.height).toBeLessThanOrEqual(374)
    await expect(peek.getByTestId("canonical-place-details")).toBeInViewport()
    await expect(peek.getByTestId("canonical-venue-directions")).toBeInViewport()
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale} longest official name stays contained in the 320px place peek`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 })
      await seed(page, locale)
      await page.goto(`/ondo-b?city=seoul&view=list&venueId=${LONG_NAME_VENUE_ID}`, { waitUntil: "domcontentloaded" })

      const peek = page.getByTestId("canonical-place-peek")
      const provenance = peek.getByTestId("canonical-name-provenance")
      await expect(peek).toBeVisible()
      expect(await peek.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)

      const peekBox = await box(peek)
      for (const line of [provenance.locator("strong"), provenance.locator("small")]) {
        const lineBox = await box(line)
        expect(lineBox.x).toBeGreaterThanOrEqual(peekBox.x)
        expect(lineBox.x + lineBox.width).toBeLessThanOrEqual(peekBox.x + peekBox.width + 1)
      }
      await expect(peek.getByTestId("canonical-place-details")).toBeInViewport()
      await expect(peek.getByTestId("canonical-venue-directions")).toBeInViewport()
    })
  }

  test("map ready means the Pulse decision layer completed its first readable paint", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await seed(page, "en")
    await page.goto("/ondo-b?city=seoul&view=map", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 12_000 })
    await expect(root).toHaveAttribute("data-pulse-markers-readable", "true")
    await expect(page.getByTestId("ondo-b-map-loading")).toHaveCount(0)
  })

  test("320px ID · Wallet shows the wallet task before optional readiness details", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await seed(page, "en")
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("wallet-balance")).toBeInViewport()
    await expect(page.getByTestId("wallet-link-open")).toBeInViewport()
    const walletBox = await box(page.getByTestId("ondo-b-id-wallet-commerce"))
    const readinessBox = await box(page.getByTestId("travel-pass-status"))
    expect(walletBox.y).toBeLessThan(readinessBox.y)
  })

  test("KO My Korea empty copy stays readable and an active plan rises above empty history", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await seed(page, "ko")
    await page.addInitScript(({ key, venueId }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? "{}")
      state.plannedTableRefs = [{ tableId: "table-seoul-night-bites", venueId }]
      localStorage.setItem(key, JSON.stringify(state))
    }, { key: DEVICE_KEY, venueId: PEAK_VENUE_ID })
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    const planned = page.getByTestId("my-korea-planned")
    const saved = page.getByTestId("ondo-b-saved-entry")
    expect((await box(planned)).y).toBeLessThan((await box(saved)).y)
    const emptyCopy = page.getByTestId("my-korea-recent-empty").locator("p")
    const emptyBox = await box(emptyCopy)
    expect(emptyBox.width).toBeGreaterThan(120)
    expect(emptyBox.height).toBeLessThan(44)
  })

  test("Place decision order keeps Table and meal benefit ahead of optional contribution", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, "en")
    await page.goto(`/ondo-b?city=seoul&view=list&venueId=${PEAK_VENUE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
    const detail = page.getByTestId("canonical-place-overlay")
    const table = detail.getByTestId("canonical-place-table")
    const benefit = detail.getByTestId("canonical-meal-benefit-open")
    const signal = detail.getByTestId("canonical-local-signal-open")
    await expect(table).toBeVisible()
    await expect(benefit).toBeVisible()
    expect((await box(table)).y).toBeLessThan((await box(benefit)).y)
    expect((await box(benefit)).y).toBeLessThan((await box(signal)).y)
  })

  test("compact source summary moves into Details without removing its truth", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, "en")
    await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
    await page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${PEAK_VENUE_ID}'] button`).click()
    const peek = page.getByTestId("canonical-place-peek")
    await expect(peek.getByTestId("canonical-place-source-summary")).toBeHidden()
    await peek.getByTestId("canonical-place-details").click()
    await expect(page.getByTestId("canonical-source-evidence")).toBeVisible()
  })
})
