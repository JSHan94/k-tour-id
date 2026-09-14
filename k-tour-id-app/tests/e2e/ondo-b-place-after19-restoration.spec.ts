import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { CANONICAL_VENUE_ID, openCanonicalVenue, prepareBPage } from "../helpers/ondo-b-qa"

const PREFERENCE_KEY = "ondo-b.after19.preferences.v1"
const SESSION_KEY = "ondo-b.after19.session.v1"
const RETURN_KEY = "ondo-b.current-action.after19.v2"
const REMOVED_VENUE_ID = "mois-aaaaaaaaaaaaaaaaaaaa"

async function placeReturnSession(page: Page) {
  return page.evaluate((key) => {
    const journal = JSON.parse(sessionStorage.getItem(key) ?? "{}") as {
      publicEnvelope?: Record<string, unknown> | null
      lastConsumed?: Record<string, unknown> | null
    }
    return { pending: journal.publicEnvelope ?? null, lastConsumed: journal.lastConsumed ?? null }
  }, RETURN_KEY)
}

async function placeUiReturnSession(page: Page) {
  return page.evaluate((key) => {
    const journal = JSON.parse(sessionStorage.getItem(key) ?? "null") as {
      privateUiSnapshot?: {
        tokenId: string
        venueId: string
        camera: { longitude: number; latitude: number; zoom: number; bearing: number; pitch: number }
        detail: { sheetSnap: string; section: string; scrollTop: number; focus: string; openSections: string[] }
      } | null
    } | null
    const snapshot = journal?.privateUiSnapshot
    return snapshot ? { entries: { [snapshot.tokenId]: snapshot } } : null
  }, RETURN_KEY) as Promise<{
    entries: Record<string, {
      venueId: string
      camera: { longitude: number; latitude: number; zoom: number; bearing: number; pitch: number }
      detail: { sheetSnap: string; section: string; scrollTop: number; focus: string; openSections: string[] }
    }>
  } | null>
}

async function seedPlace(page: Page, locale: "en" | "ko" | "ja") {
  await page.addInitScript(({ preferenceKey, sessionKey, deviceLocale }) => {
    if (!localStorage.getItem("ondo-b.device.v1")) localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: deviceLocale,
      onboarding: "ONB-COMPLETE",
      persona: "travelling",
      discoveryPreferences: [],
      savedVenueIds: [],
      savedEditorialPlaceIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      recentEditorialPlaceIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
      commerceLocalBoundarySeen: true,
      commerceReceipts: [],
    }))
    if (!localStorage.getItem(preferenceKey)) localStorage.setItem(preferenceKey, JSON.stringify({ version: 1, autoOpen: false }))
    if (!sessionStorage.getItem(sessionKey)) sessionStorage.setItem(sessionKey, JSON.stringify({
      version: 1,
      age: "unverified",
      ageExpiresAt: null,
      mode: "off",
      activation: null,
      expiryNotice: false,
    }))
  }, { preferenceKey: PREFERENCE_KEY, sessionKey: SESSION_KEY, deviceLocale: locale })
}

test.describe("FL-002 Place-local After 19 restoration", () => {
  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  test("cancel, failure, retry and completion keep the exact canonical venue", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    const place = page.getByTestId("canonical-place-overlay")
    const access = place.getByTestId("canonical-after19-access")
    const unlock = access.getByTestId("canonical-after19-unlock")

    await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
    await expect(access).toHaveAttribute("data-after19-venue-id", CANONICAL_VENUE_ID)
    await expect(access).not.toContainText("ONDO policy")

    await unlock.click()
    let prompt = page.getByTestId("global-after19-prompt-layer")
    let returnContext = prompt.getByTestId("global-after19-return-context")
    await expect(returnContext).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
    await expect(returnContext).toHaveAttribute("data-return-cta", "OPEN_AFTER19")
    await expect(returnContext).toHaveAttribute("data-return-level", "detail")
    await expect(returnContext).toHaveAttribute("data-return-focus", "canonical-after19-access")
    await expect(returnContext).toHaveAttribute("aria-label", /Selected place/)
    await expect(page.locator("[role='dialog'][aria-modal='true']")).toHaveCount(1)
    const firstPending = (await placeReturnSession(page)).pending
    expect(firstPending).toMatchObject({
      cta: "OPEN_AFTER19",
      venueId: CANONICAL_VENUE_ID,
      gateQueue: ["age"],
      activeGate: "age",
    })
    expect(firstPending).not.toHaveProperty("cityId")
    expect(firstPending).not.toHaveProperty("view")
    expect(firstPending).not.toHaveProperty("query")
    expect(firstPending).not.toHaveProperty("category")
    expect(firstPending).not.toHaveProperty("focusTarget")
    const firstUi = await placeUiReturnSession(page)
    const firstUiSnapshot = firstUi?.entries?.[String(firstPending?.tokenId)]
    expect(firstUiSnapshot).toMatchObject({
      venueId: CANONICAL_VENUE_ID,
      camera: {
        longitude: expect.any(Number), latitude: expect.any(Number), zoom: expect.any(Number),
        bearing: expect.any(Number), pitch: expect.any(Number),
      },
      detail: { sheetSnap: "detail", section: "after19", focus: "after19_unlock", scrollTop: expect.any(Number) },
    })
    await prompt.getByTestId("global-after19-cancel").click()
    await expect(prompt).toHaveCount(0)
    await expect(place).toBeVisible()
    await expect(unlock).toBeFocused()
    await expect.poll(() => place.locator("[data-place-return-scroll='detail']").evaluate((node) => node.scrollTop)).toBe(firstUiSnapshot?.detail.scrollTop)
    await expect.poll(() => page.getByTestId("maplibre-map").getAttribute("data-map-center")).toBe(
      `${firstUiSnapshot?.camera.longitude.toFixed(5)},${firstUiSnapshot?.camera.latitude.toFixed(5)}`,
    )
    await expect.poll(() => page.getByTestId("maplibre-map").getAttribute("data-map-zoom")).toBe(firstUiSnapshot?.camera.zoom.toFixed(3))
    await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
    expect(await placeReturnSession(page)).toMatchObject({ pending: null, lastConsumed: { tokenId: firstPending?.tokenId, outcome: "cancel" } })
    expect(await placeUiReturnSession(page)).toBeNull()

    await page.clock.setFixedTime(new Date("2026-08-19T20:30:00.001+09:00"))
    await page.evaluate(() => {
      ;(window as Window & { __ONDO_B_QA__?: { after19Global?: "failure" } }).__ONDO_B_QA__ = { after19Global: "failure" }
    })
    await unlock.click()
    prompt = page.getByTestId("global-after19-prompt-layer")
    await expect(prompt).toBeVisible()
    returnContext = prompt.getByTestId("global-after19-return-context")
    const retryPending = (await placeReturnSession(page)).pending
    expect(retryPending?.tokenId).not.toBe(firstPending?.tokenId)
    await prompt.getByTestId("global-after19-confirm").click()
    await expect(prompt.locator("[data-gate-view='failure']")).toBeVisible()
    await expect(returnContext).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
    expect((await placeReturnSession(page)).pending).toEqual(retryPending)
    expect((await placeUiReturnSession(page))?.entries?.[String(retryPending?.tokenId)]).toBeTruthy()

    await page.evaluate(() => {
      ;(window as Window & { __ONDO_B_QA__?: { after19Global?: "success" } }).__ONDO_B_QA__ = { after19Global: "success" }
    })
    await prompt.getByTestId("global-after19-retry").click()
    await expect(prompt).toHaveCount(0)
    await expect(place).toBeVisible()
    await expect(access).toHaveAttribute("data-after19-venue-status", "unlocked")
    await expect(access).not.toContainText("ONDO preview on")
    await expect(access.getByRole("status")).toHaveText("On")
    await expect(access).toBeFocused()
    await expect(page.getByTestId("global-after19-banner")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
    await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}"), SESSION_KEY)).toMatchObject({
      age: "unverified",
      mode: "off",
      activation: null,
    })
    expect(await placeReturnSession(page)).toMatchObject({ pending: null, lastConsumed: { tokenId: retryPending?.tokenId, outcome: "success" } })
    expect(await placeUiReturnSession(page)).toBeNull()

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "locked")
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}.*detail=1`))
  })

  test("pending exact return survives reload/remount and cancel consumes it once", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-after19-unlock").click()
    const beforeReload = (await placeReturnSession(page)).pending
    const uiBeforeReload = await placeUiReturnSession(page)
    expect(beforeReload?.tokenId).toEqual(expect.stringMatching(/^RT-OPEN_AFTER19-/))

    await page.reload({ waitUntil: "domcontentloaded" })
    const prompt = page.getByTestId("global-after19-prompt-layer")
    await expect(prompt).toBeVisible()
    await expect(prompt.locator("[data-gate-view]")).toHaveAttribute("data-gate-view", "intro")
    await expect(prompt.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
    expect((await placeReturnSession(page)).pending).toEqual(beforeReload)
    expect(await placeUiReturnSession(page)).toEqual(uiBeforeReload)

    await prompt.getByTestId("global-after19-cancel").click()
    const access = page.getByTestId("canonical-after19-access")
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
    await expect(access.getByTestId("canonical-after19-unlock")).toBeFocused()
    expect(await placeReturnSession(page)).toMatchObject({ pending: null, lastConsumed: { tokenId: beforeReload?.tokenId, outcome: "cancel" } })
    expect(await placeUiReturnSession(page)).toBeNull()

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  })

  test("Guest 19+ result survives dock remount but a document reload locks it", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    await page.evaluate(() => {
      ;(window as Window & { __ONDO_B_QA__?: { after19Global?: "success" } }).__ONDO_B_QA__ = { after19Global: "success" }
    })
    await page.getByTestId("canonical-after19-unlock").click()
    await page.getByTestId("global-after19-confirm").click()
    await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")
    await page.getByRole("button", { name: "Close place" }).click()
    await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)
    await page.getByTestId("nav-my").click()
    await page.getByTestId("nav-ondo").click()
    await expect(page.getByTestId("global-after19-banner")).toBeVisible()

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY)).toBeNull()
  })

  test("an expired normal return escapes to the exact place without offering a fake retry", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    const access = page.getByTestId("canonical-after19-access")
    await access.getByTestId("canonical-after19-unlock").click()
    const original = (await placeReturnSession(page)).pending
    expect(original).toMatchObject({
      venueId: CANONICAL_VENUE_ID,
      cta: "OPEN_AFTER19",
      gateQueue: ["age"],
      activeGate: "age",
    })

    expect(original?.expiresAt).toEqual(expect.any(String))
    await page.clock.setFixedTime(new Date(Date.parse(String(original?.expiresAt)) + 1_000))
    await page.reload({ waitUntil: "domcontentloaded" })
    const prompt = page.getByTestId("global-after19-prompt-layer")
    await expect(prompt.locator("[data-gate-view]")).toHaveAttribute("data-gate-view", "expired")
    await expect(prompt.getByTestId("global-after19-retry")).toHaveCount(0)
    await prompt.getByTestId("global-after19-general").click()
    await expect(prompt).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(access.getByTestId("canonical-after19-unlock")).toBeFocused()
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}.*detail=1`))
    expect(await placeReturnSession(page)).toMatchObject({
      pending: null,
      lastConsumed: { tokenId: original?.tokenId, outcome: "cancel" },
    })
  })

  test("same-token UI-context injection is discarded and cannot steer the return", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-after19-unlock").click()
    await page.evaluate((key) => {
      const session = JSON.parse(sessionStorage.getItem(key) ?? "{}")
      session.publicEnvelope = {
        ...session.publicEnvelope,
        cityId: "busan",
        view: "list",
        query: "safe noodles",
        category: "korean",
      }
      sessionStorage.setItem(key, JSON.stringify(session))
    }, RETURN_KEY)

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
    expect(await placeReturnSession(page)).toMatchObject({ pending: null })
  })

  test("a changed venue without the matching snapshot is discarded", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-after19-unlock").click()
    await expect(page.getByTestId("global-after19-prompt-layer")).toBeVisible()
    await page.evaluate(({ key, missingVenueId }) => {
      const session = JSON.parse(sessionStorage.getItem(key) ?? "{}")
      session.publicEnvelope = {
        ...session.publicEnvelope,
        venueId: missingVenueId,
      }
      sessionStorage.setItem(key, JSON.stringify(session))
    }, { key: RETURN_KEY, missingVenueId: REMOVED_VENUE_ID })

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
    expect(await placeReturnSession(page)).toMatchObject({ pending: null })
  })

  for (const [locale, opener] of [
    ["en", "Turn on After 19"],
    ["ko", "After 19 켜기"],
    ["ja", "After 19をオンにする"],
  ] as const) {
    test(`${locale.toUpperCase()} compact opener remains readable at 320 and 360 px`, async ({ page }) => {
      await seedPlace(page, locale)
      for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 800 })
        await openCanonicalVenue(page)
        const access = page.getByTestId("canonical-after19-access")
        await expect(access).not.toContainText(/ONDO policy|ONDO 정책|ONDOの方針/)
        const button = access.getByRole("button", { name: opener })
        await expect(button).toBeVisible()
        const [buttonBox, fontSizes, overflow] = await Promise.all([
          button.boundingBox(),
          access.locator("strong, small, button, em").evaluateAll((nodes) => nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize))),
          page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
        ])
        expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(44)
        expect(fontSizes.every((size) => size >= 12)).toBe(true)
        expect(overflow).toBeLessThanOrEqual(1)
        const axe = await new AxeBuilder({ page }).include("[data-testid='canonical-after19-access']").analyze()
        expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
      }
    })
  }
})
