import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { CANONICAL_VENUE_ID, openCanonicalVenue, prepareBPage } from "../helpers/ondo-b-qa"

const PREFERENCE_KEY = "ondo-b.after19.preferences.v1"
const SESSION_KEY = "ondo-b.after19.session.v1"
const RETURN_KEY = "ondo-b.after19.place-return.v1"
const REMOVED_VENUE_ID = "mois-aaaaaaaaaaaaaaaaaaaa"

async function placeReturnSession(page: Page) {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}") as {
    pending?: Record<string, unknown> | null
    lastConsumed?: Record<string, unknown> | null
  }, RETURN_KEY)
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
    await expect(access).toContainText("ONDO policy · not an official restriction for this place.")

    await unlock.click()
    let prompt = page.getByTestId("global-after19-prompt-layer")
    let returnContext = prompt.getByTestId("global-after19-return-context")
    await expect(returnContext).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
    await expect(returnContext).toHaveAttribute("data-return-cta", "OPEN_AFTER19")
    await expect(returnContext).toHaveAttribute("data-return-level", "detail")
    await expect(returnContext).toHaveAttribute("data-return-focus", "canonical-after19-access")
    await expect(returnContext).toContainText("Selected place")
    await expect(page.locator("[role='dialog'][aria-modal='true']")).toHaveCount(1)
    const firstPending = (await placeReturnSession(page)).pending
    expect(firstPending).toMatchObject({
      cta: "OPEN_AFTER19",
      venueId: CANONICAL_VENUE_ID,
      cityId: "seoul",
      level: "detail",
      focusTarget: "canonical-after19-access",
      consumedAt: null,
    })
    await prompt.getByTestId("global-after19-cancel").click()
    await expect(prompt).toHaveCount(0)
    await expect(place).toBeVisible()
    await expect(access).toBeFocused()
    await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
    expect(await placeReturnSession(page)).toMatchObject({ pending: null, lastConsumed: { tokenId: firstPending?.tokenId, outcome: "cancel" } })

    await page.evaluate(() => {
      ;(window as Window & { __ONDO_B_QA__?: { after19Global?: "failure" } }).__ONDO_B_QA__ = { after19Global: "failure" }
    })
    await unlock.click()
    prompt = page.getByTestId("global-after19-prompt-layer")
    returnContext = prompt.getByTestId("global-after19-return-context")
    const retryPending = (await placeReturnSession(page)).pending
    await prompt.getByTestId("global-after19-confirm").click()
    await expect(prompt.locator("[data-gate-view='failure']")).toBeVisible()
    await expect(returnContext).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
    expect((await placeReturnSession(page)).pending).toEqual(retryPending)

    await page.evaluate(() => {
      delete (window as Window & { __ONDO_B_QA__?: { after19Global?: "failure" } }).__ONDO_B_QA__?.after19Global
    })
    await prompt.getByTestId("global-after19-retry").click()
    await expect(prompt).toHaveCount(0)
    await expect(place).toBeVisible()
    await expect(access).toHaveAttribute("data-after19-venue-status", "unlocked")
    await expect(access).toContainText("ONDO preview on · not an official restriction for this place.")
    await expect(access).toBeFocused()
    await expect(page.getByTestId("global-after19-banner")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
    await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}"), SESSION_KEY)).toMatchObject({
      age: "eligible",
      mode: "on",
      activation: "manual",
    })
    expect(await placeReturnSession(page)).toMatchObject({ pending: null, lastConsumed: { tokenId: retryPending?.tokenId, outcome: "success" } })

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}.*detail=1`))
  })

  test("pending exact return survives reload/remount and cancel consumes it once", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-after19-unlock").click()
    const beforeReload = (await placeReturnSession(page)).pending
    expect(beforeReload?.tokenId).toEqual(expect.stringMatching(/^RT-OPEN_AFTER19-/))

    await page.reload({ waitUntil: "domcontentloaded" })
    const prompt = page.getByTestId("global-after19-prompt-layer")
    await expect(prompt).toBeVisible()
    await expect(prompt.locator("[data-gate-view]")).toHaveAttribute("data-gate-view", "intro")
    await expect(prompt.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
    expect((await placeReturnSession(page)).pending).toEqual(beforeReload)

    await prompt.getByTestId("global-after19-cancel").click()
    const access = page.getByTestId("canonical-after19-access")
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
    await expect(access).toBeFocused()
    expect(await placeReturnSession(page)).toMatchObject({ pending: null, lastConsumed: { tokenId: beforeReload?.tokenId, outcome: "cancel" } })

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  })

  test("an expired return renews once and Escape consumes the latest token", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    const access = page.getByTestId("canonical-after19-access")
    await access.getByTestId("canonical-after19-unlock").click()
    const original = (await placeReturnSession(page)).pending
    expect(original).toMatchObject({
      venueId: CANONICAL_VENUE_ID,
      cityId: "seoul",
      level: "detail",
      view: "map",
      query: "",
      category: "all",
      consumedAt: null,
    })

    expect(original?.expiresAt).toEqual(expect.any(String))
    await page.clock.setFixedTime(new Date(Date.parse(String(original?.expiresAt)) + 1_000))
    await page.reload({ waitUntil: "domcontentloaded" })
    const prompt = page.getByTestId("global-after19-prompt-layer")
    await expect(prompt.locator("[data-gate-view]")).toHaveAttribute("data-gate-view", "expired")
    await prompt.getByTestId("global-after19-retry").click()
    await expect(prompt.locator("[data-gate-view]")).toHaveAttribute("data-gate-view", "intro")

    const renewed = (await placeReturnSession(page)).pending
    expect(renewed).toMatchObject({
      venueId: CANONICAL_VENUE_ID,
      cityId: "seoul",
      level: "detail",
      view: "map",
      query: "",
      category: "all",
      consumedAt: null,
    })
    expect(renewed?.tokenId).not.toBe(original?.tokenId)

    await page.keyboard.press("Escape")
    await expect(prompt).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
    await expect(access).toBeFocused()
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}.*detail=1`))
    expect(await placeReturnSession(page)).toMatchObject({
      pending: null,
      lastConsumed: { tokenId: renewed?.tokenId, outcome: "cancel" },
    })
  })

  test("an expired return whose venue moved cities safely falls back to its stored city", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-after19-unlock").click()
    await page.evaluate((key) => {
      const session = JSON.parse(sessionStorage.getItem(key) ?? "{}")
      session.pending = {
        ...session.pending,
        cityId: "busan",
        view: "list",
        query: "safe noodles",
        category: "korean",
      }
      sessionStorage.setItem(key, JSON.stringify(session))
    }, RETURN_KEY)

    const mismatched = (await placeReturnSession(page)).pending
    expect(mismatched?.expiresAt).toEqual(expect.any(String))
    await page.clock.setFixedTime(new Date(Date.parse(String(mismatched?.expiresAt)) + 1_000))
    await page.reload({ waitUntil: "domcontentloaded" })
    const prompt = page.getByTestId("global-after19-prompt-layer")
    await expect(prompt.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-city", "busan")
    await expect(prompt.locator("[data-gate-view]")).toHaveAttribute("data-gate-view", "expired")
    await prompt.getByTestId("global-after19-retry").click()

    await expect(prompt).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-requested-view", "list")
    await expect(page.getByTestId("ondo-b-search")).toHaveValue("safe noodles")
    await expect(page.getByTestId("ondo-b-search")).toBeFocused()
    await expect(page).toHaveURL(/\/ondo-b\?city=busan&view=list&q=safe(?:\+|%20)noodles&category=korean$/)
    expect(await placeReturnSession(page)).toMatchObject({
      pending: null,
      lastConsumed: { tokenId: mismatched?.tokenId, outcome: "cancel" },
    })
  })

  test("a removed venue restores the same sanitized city/list context instead of a dead detail", async ({ page }) => {
    await seedPlace(page, "en")
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-after19-unlock").click()
    await expect(page.getByTestId("global-after19-prompt-layer")).toBeVisible()
    await page.evaluate(({ key, missingVenueId }) => {
      const session = JSON.parse(sessionStorage.getItem(key) ?? "{}")
      session.pending = {
        ...session.pending,
        venueId: missingVenueId,
        cityId: "seoul",
        level: "detail",
        view: "list",
        query: "safe soup",
        category: "korean",
        focusTarget: "canonical-after19-access",
      }
      sessionStorage.setItem(key, JSON.stringify(session))
    }, { key: RETURN_KEY, missingVenueId: REMOVED_VENUE_ID })

    await page.reload({ waitUntil: "domcontentloaded" })
    const prompt = page.getByTestId("global-after19-prompt-layer")
    const context = prompt.getByTestId("global-after19-return-context")
    await expect(prompt).toBeVisible()
    await expect(context).toHaveAttribute("data-return-venue", REMOVED_VENUE_ID)
    await expect(context).toContainText("That place is no longer available")
    await prompt.getByTestId("global-after19-cancel").click()

    await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-requested-view", "list")
    await expect(page.getByTestId("ondo-b-search")).toHaveValue("safe soup")
    await expect(page.getByTestId("ondo-b-search")).toBeFocused()
    await expect(page).toHaveURL(/\/ondo-b\?city=seoul&view=list&q=safe(?:\+|%20)soup&category=korean$/)
    expect(await placeReturnSession(page)).toMatchObject({ pending: null, lastConsumed: { outcome: "cancel" } })
  })

  for (const [locale, policy, opener] of [
    ["en", "ONDO policy · not an official restriction for this place.", "Open 19+ preview"],
    ["ko", "ONDO 정책 · 이 장소의 공식 이용 제한이 아니에요.", "19+ 프리뷰 열기"],
    ["ja", "ONDOの方針・この場所の公式な利用制限ではありません。", "19+プレビューを開く"],
  ] as const) {
    test(`${locale.toUpperCase()} compact opener remains readable at 320 and 360 px`, async ({ page }) => {
      await seedPlace(page, locale)
      for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 800 })
        await openCanonicalVenue(page)
        const access = page.getByTestId("canonical-after19-access")
        await expect(access).toContainText(policy)
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
