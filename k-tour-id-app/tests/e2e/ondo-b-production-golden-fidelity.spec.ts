import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const VENUE_ID = "mois-0021cd596bc5b2a922ad"

async function seedGoldenCandidate(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ nextLocale }) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localInteractionBoundarySeen: true,
    }))
  }, { nextLocale: locale })
}

async function openMealOffer(page: Page) {
  await page.goto(`/ondo-b?venueId=${VENUE_ID}`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("canonical-place-details").click()
  await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  const entry = page.getByTestId("canonical-demo-meal-offer-open")
  await entry.focus()
  await entry.press("Enter")
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  await expect(offer).toBeVisible()
  return { entry, offer }
}

test("FID-LIVE-001 Pulse exposes curated evidence, freshness, confidence, and peak-only Too Hot in EN and KO", async ({ page, browser }) => {
  await seedGoldenCandidate(page, "en")
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.locator("[data-city='seoul']").click()
  await page.getByTestId("ondo-b-view-toggle").click()

  const curatedRow = page.locator(`[data-venue-id='${VENUE_ID}']`)
  const listPulse = curatedRow.getByTestId("ondo-b-list-pulse")
  await expect(listPulse).toHaveAttribute("data-pulse-level", "peak")
  await expect(listPulse).toContainText("Pulse 91° · PEAK")
  await curatedRow.locator("button").click()
  await page.getByTestId("canonical-place-details").click()

  const pulse = page.getByTestId("canonical-place-pulse")
  await expect(pulse).toHaveAttribute("data-pulse-level", "peak")
  await expect(pulse).toHaveAttribute("data-pulse-numeric", "shown")
  await expect(pulse.getByTestId("pulse-score")).toContainText("91°")
  await expect(pulse.getByTestId("pulse-confidence")).toContainText(/Confidence.*High/i)
  await expect(pulse.getByTestId("pulse-evidence").locator("[data-origin='curated-walkthrough']")).toHaveCount(1)
  await expect(pulse).toContainText("Fixed walkthrough snapshot")
  await expect(page.getByTestId("pulse-too-hot")).toContainText("Too hot?")

  const koContext = await browser.newContext()
  const koPage = await koContext.newPage()
  try {
    await seedGoldenCandidate(koPage, "ko")
    await koPage.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await koPage.locator("[data-city='seoul']").click()
    await koPage.getByTestId("ondo-b-view-toggle").click()
    const koCuratedRow = koPage.locator(`[data-venue-id='${VENUE_ID}']`)
    await expect(koCuratedRow.getByTestId("ondo-b-list-pulse")).toContainText("Pulse 91° · 피크")
  } finally {
    await koContext.close()
  }
})

test("FID-LIVE-002 ID · Wallet meal offer executes truthful deterministic outcomes and one debit on double click", async ({ page }) => {
  await seedGoldenCandidate(page, "en")
  const { offer } = await openMealOffer(page)
  await expect(offer.getByRole("heading", { name: "ONDO demo meal offer" })).toBeVisible()
  await expect(offer.getByTestId("commerce-truth-boundary")).toContainText(/device-local|no AI call|no payment provider|no chain|no backend|not official LOCALDATA merchant payment support/i)
  await expect(offer.getByTestId("commerce-provider-state")).toHaveAttribute("data-provider-state", "NOT_CONNECTED")
  await expect(offer.getByTestId("commerce-ookrw-balance")).toHaveAttribute("data-balance", "60")

  await offer.getByTestId("commerce-ai-preview").click()
  await expect(offer.getByTestId("commerce-ai-recommendation")).toHaveAttribute("data-ai-state", "RECOMMENDED")
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "AVAILABLE")
  await expect(offer.getByTestId("commerce-ookrw-balance")).toHaveAttribute("data-balance", "60")
  await offer.getByTestId("commerce-ai-accept").click()

  await offer.getByTestId("commerce-outcome-success").click()
  await offer.getByTestId("commerce-pay").dblclick()
  await expect(offer).toHaveAttribute("data-payment-state", "SUCCESS")
  await expect(offer.getByTestId("commerce-ookrw-balance")).toHaveAttribute("data-balance", "41")
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "REDEEMED")
  await expect(offer.getByTestId("commerce-holder-ledger").locator("[data-operation-kind='PAYMENT']")).toHaveCount(1)
  await expect(offer.getByTestId("commerce-merchant-ledger").locator("[data-operation-kind='PAYMENT']")).toHaveCount(1)
  await expect(offer.getByTestId("commerce-receipt")).toHaveCount(1)
  await expect(offer.getByTestId("commerce-receipt")).toContainText("ONDO-LOCAL-20260825-001")

  await offer.getByTestId("commerce-refund").click()
  await expect(offer).toHaveAttribute("data-payment-state", "REFUNDED")
  await expect(offer.getByTestId("commerce-ookrw-balance")).toHaveAttribute("data-balance", "60")
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "AVAILABLE")
  await expect(offer.getByTestId("commerce-settlement-mirror")).toHaveAttribute("data-reconciled", "true")
})

test("FID-LIVE-003 cancel, fail/retry, and insufficient balance preserve the exact meal-offer return", async ({ page }) => {
  await seedGoldenCandidate(page, "en")
  const { entry, offer } = await openMealOffer(page)
  const expectedReturn = JSON.stringify({ cta: "START_MEAL_PAYMENT", venueId: VENUE_ID, offerId: "meal-offer-gukbap" })
  await expect(offer).toHaveAttribute("data-return-to", expectedReturn)

  for (const scenario of ["cancelled", "failed", "insufficient"] as const) {
    await offer.getByTestId(`commerce-outcome-${scenario}`).click()
    await offer.getByTestId("commerce-pay").click()
    await expect(offer).toHaveAttribute("data-payment-state", scenario.toUpperCase())
    await expect(offer).toHaveAttribute("data-return-to", expectedReturn)
    await expect(offer.getByTestId("commerce-holder-ledger").locator("[data-operation-kind='PAYMENT']")).toHaveCount(0)
    if (scenario === "failed") {
      await offer.getByTestId("commerce-retry").click()
      await expect(offer).toHaveAttribute("data-payment-state", "SUCCESS")
      await offer.getByTestId("commerce-reset").click()
    } else {
      await offer.getByTestId("commerce-reset").click()
    }
  }

  await offer.getByTestId("commerce-close").click()
  await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
  await expect(entry).toBeFocused()
  await expect(page).toHaveURL(new RegExp(`venueId=${VENUE_ID}`))
})

for (const locale of ["en", "ko"] as const) {
  test(`FID-LIVE-004 ${locale.toUpperCase()} meal flow is responsive, keyboard-operable, and serious a11y-clean`, async ({ page }) => {
    await seedGoldenCandidate(page, locale)
    const { entry, offer } = await openMealOffer(page)
    await expect(page.locator("html")).toHaveAttribute("lang", locale)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await expect(offer).toHaveAttribute("role", "dialog")

    const violations = await new AxeBuilder({ page }).include("[data-testid='ondo-b-id-wallet-commerce']").analyze()
    expect(violations.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([])

    await page.keyboard.press("Escape")
    await expect(offer).toBeHidden()
    await expect(entry).toBeFocused()
  })
}
