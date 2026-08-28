import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { CANONICAL_VENUE_ID, openCanonicalVenue, prepareBPage } from "../helpers/ondo-b-qa"

const PREFERENCE_KEY = "ondo-b.after19.preferences.v1"
const SESSION_KEY = "ondo-b.after19.session.v1"

async function seedPlace(page: Page, locale: "en" | "ko" | "ja") {
  await page.addInitScript(({ preferenceKey, sessionKey, deviceLocale }) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({
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
    localStorage.setItem(preferenceKey, JSON.stringify({ version: 1, autoOpen: false }))
    sessionStorage.setItem(sessionKey, JSON.stringify({
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
    await expect(returnContext).toContainText("Selected place")
    await expect(page.locator("[role='dialog'][aria-modal='true']")).toHaveCount(1)
    await prompt.getByTestId("global-after19-cancel").click()
    await expect(prompt).toHaveCount(0)
    await expect(place).toBeVisible()
    await expect(unlock).toBeFocused()
    await expect(access).toHaveAttribute("data-after19-venue-status", "locked")

    await page.evaluate(() => {
      ;(window as Window & { __ONDO_B_QA__?: { after19Global?: "failure" } }).__ONDO_B_QA__ = { after19Global: "failure" }
    })
    await unlock.click()
    prompt = page.getByTestId("global-after19-prompt-layer")
    returnContext = prompt.getByTestId("global-after19-return-context")
    await prompt.getByTestId("global-after19-confirm").click()
    await expect(prompt.locator("[data-gate-view='failure']")).toBeVisible()
    await expect(returnContext).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))

    await page.evaluate(() => {
      delete (window as Window & { __ONDO_B_QA__?: { after19Global?: "failure" } }).__ONDO_B_QA__?.after19Global
    })
    await prompt.getByTestId("global-after19-retry").click()
    await expect(prompt).toHaveCount(0)
    await expect(place).toBeVisible()
    await expect(access).toHaveAttribute("data-after19-venue-status", "unlocked")
    await expect(access).toContainText("ONDO preview on · not an official restriction for this place.")
    await expect(page.getByTestId("global-after19-banner")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
    await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}"), SESSION_KEY)).toMatchObject({
      age: "eligible",
      mode: "on",
      activation: "manual",
    })
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
