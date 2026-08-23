import { expect, test, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  gotoB,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const FROZEN_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
] as const

async function discoveryEntry(page: Page) {
  return page.evaluate(() => history.state?.__ondoBDiscovery as Record<string, unknown> | undefined)
}

async function openSavedFromMy(page: Page) {
  await page.getByTestId("nav-my").click()
  await expect(page.getByTestId("ondo-my-entry")).toBeVisible()
  await page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`).click()
  const peek = page.getByTestId("canonical-place-peek")
  await expect(peek).toBeVisible()
  await expect(peek).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
  await expect(page.getByTestId("canonical-place-details")).toBeFocused()
  await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)
  await expect(page.getByTestId("ondo-gate-overlay")).toHaveCount(0)
  await expect(page.locator("[role='dialog']:visible")).toHaveCount(1)
}

function expectPrivateDiscoveryFieldsAbsent(page: Page) {
  return expect.poll(() => page.evaluate(() => ({
    url: `${location.pathname}${location.search}${location.hash}`,
    state: JSON.stringify(history.state?.__ondoBDiscovery),
  }))).toMatchObject({
    url: expect.not.stringMatching(/[?&](q|heat|account|person|ageExpiresAt|payment|gate)=/i),
    state: expect.not.stringMatching(/account|person|ageExpiresAt|payment|gate|private-search/i),
  })
}

test.describe("SLEEK saved places enter canonical B discovery history", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} saved place opens exact city peek across all six frozen widths`, async ({ page }) => {
      await seedB(page, { locale, local: { savedVenueIds: [CANONICAL_VENUE_ID] } })

      for (const viewport of FROZEN_VIEWPORTS) {
        await test.step(`${viewport.width}x${viewport.height}`, async () => {
          await page.setViewportSize(viewport)
          await gotoB(page, `?campaign=saved-return-${locale}-${viewport.width}&city=seoul&view=list`)
          await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "seoul", view: "list" })
          const before = await page.evaluate(() => ({
            local: localStorage.getItem("ondo.preferences.v3"),
            session: sessionStorage.getItem("ondo.session.v3"),
            historyLength: history.length,
          }))

          await openSavedFromMy(page)
          await expect(page).toHaveURL(new RegExp(`campaign=saved-return-${locale}-${viewport.width}.*city=seoul.*view=list.*venueId=${CANONICAL_VENUE_ID}`))
          await expect.poll(() => discoveryEntry(page)).toMatchObject({
            level: "peek",
            city: "seoul",
            view: "list",
            query: "",
            heat: "all",
            venueId: CANONICAL_VENUE_ID,
          })
          await expectPrivateDiscoveryFieldsAbsent(page)
          expect(await page.evaluate(() => ({
            local: localStorage.getItem("ondo.preferences.v3"),
            session: sessionStorage.getItem("ondo.session.v3"),
            historyLength: history.length,
          }))).toEqual({ ...before, historyLength: before.historyLength + 1 })

          await page.evaluate(() => history.back())
          await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
          await expect(page.locator(`[data-venue-opener='${CANONICAL_VENUE_ID}']`)).toBeFocused()
          await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "seoul", view: "list" })

          await page.evaluate(() => history.forward())
          await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
          await expect(page.getByTestId("canonical-place-details")).toBeFocused()
          await page.reload({ waitUntil: "domcontentloaded" })
          await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
          await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "peek", city: "seoul", venueId: CANONICAL_VENUE_ID })
          await expectPrivateDiscoveryFieldsAbsent(page)
        })
      }
    })
  }

  test("nation, another city, and direct detail contexts produce one unwindable saved-place peek", async ({ page }) => {
    await seedB(page, { local: { savedVenueIds: [CANONICAL_VENUE_ID] } })

    await gotoB(page, "?campaign=saved-from-nation")
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "nation" })
    await openSavedFromMy(page)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "peek", city: "seoul", venueId: CANONICAL_VENUE_ID })
    await page.evaluate(() => history.back())
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "seoul" })
    await expect(page.getByTestId("ondo-b-view-toggle")).toBeFocused()
    await page.evaluate(() => history.back())
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect(page.locator("[data-city='seoul']")).toBeFocused()
    await page.evaluate(() => history.forward())
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "seoul" })
    await page.evaluate(() => history.forward())
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(page.getByTestId("canonical-place-details")).toBeFocused()

    await gotoB(page, "?campaign=saved-from-busan&city=busan&view=list")
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "busan", view: "list" })
    await openSavedFromMy(page)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "peek", city: "seoul", venueId: CANONICAL_VENUE_ID })
    await page.evaluate(() => history.back())
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "seoul" })
    await page.evaluate(() => history.forward())
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()

    await gotoB(page, `?campaign=saved-from-direct-detail&city=seoul&view=list&venueId=${CANONICAL_VENUE_ID}&detail=1`)
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail).toBeVisible()
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await detail.getByRole("button", { name: "Back to place summary" }).last().click()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "peek" })
    await page.getByTestId("canonical-place-peek").getByRole("button", { name: "Close place" }).click()
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "city", city: "seoul", view: "list" })
    await openSavedFromMy(page)
    await expect.poll(() => discoveryEntry(page)).toMatchObject({ level: "peek", city: "seoul", venueId: CANONICAL_VENUE_ID })
    await expectPrivateDiscoveryFieldsAbsent(page)
  })

  test("untrusted saved ids never enter B discovery URL or history", async ({ page }) => {
    const untrustedVenueId = "private-account-id"
    await seedB(page, { local: { savedVenueIds: [untrustedVenueId] } })
    await gotoB(page, "?campaign=saved-untrusted&city=seoul&view=list")
    await page.getByTestId("nav-my").click()
    await page.getByTestId(`saved-venue-${untrustedVenueId}`).click()
    await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
    await expect(page).not.toHaveURL(/private-account-id/)
    await expect.poll(() => page.evaluate(() => JSON.stringify(history.state?.__ondoBDiscovery))).not.toContain(untrustedVenueId)
  })

  test("A keeps its existing saved-place return behavior", async ({ page }) => {
    const legacyVenueId = "seoul-seongsu-gukbap"
    await seedB(page, { local: { savedVenueIds: [legacyVenueId] } })
    await page.goto("/ondo", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    await page.getByTestId(`saved-venue-${legacyVenueId}`).click()
    await expect(page.getByTestId("place-peek")).toBeVisible()
    await expect(page.getByTestId("place-details")).toBeFocused()
    await expect(page).not.toHaveURL(/__ondoBDiscovery|private-account-id/)
  })
})
