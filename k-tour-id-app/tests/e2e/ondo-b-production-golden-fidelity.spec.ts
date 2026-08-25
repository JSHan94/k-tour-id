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
  const entry = page.getByTestId("canonical-meal-benefit-open")
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
  await expect(listPulse).toContainText("Pulse 91 · PEAK")
  await curatedRow.locator("button").click()
  await page.getByTestId("canonical-place-details").click()

  const pulse = page.getByTestId("canonical-place-pulse")
  await expect(pulse).toHaveAttribute("data-pulse-level", "peak")
  await expect(pulse).toHaveAttribute("data-pulse-numeric", "shown")
  await expect(pulse.getByTestId("pulse-score")).toContainText("91")
  await expect(pulse.getByTestId("pulse-confidence")).toContainText(/Confidence.*High/i)
  await expect(pulse.getByTestId("pulse-evidence").locator("[data-origin='curated-walkthrough']")).toHaveCount(1)
  await expect(pulse).toContainText("Curated snapshot")
  await expect(page.getByTestId("pulse-too-hot")).toContainText("Too hot?")

  const koContext = await browser.newContext()
  const koPage = await koContext.newPage()
  try {
    await seedGoldenCandidate(koPage, "ko")
    await koPage.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await koPage.locator("[data-city='seoul']").click()
    await koPage.getByTestId("ondo-b-view-toggle").click()
    const koCuratedRow = koPage.locator(`[data-venue-id='${VENUE_ID}']`)
    await expect(koCuratedRow.getByTestId("ondo-b-list-pulse")).toContainText("Pulse 91 · 피크")
  } finally {
    await koContext.close()
  }
})

test("FID-LIVE-002 contextual benefit makes one debit, one consumer receipt, and a reversible refund", async ({ page }) => {
  await seedGoldenCandidate(page, "en")
  const { offer } = await openMealOffer(page)
  await expect(offer.getByRole("heading", { name: "A better meal, one tap away" })).toBeVisible()
  await expect(offer).toContainText("OOKRW Test")
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-benefit-recommendation", "recommended")
  await offer.getByTestId("benefit-accept").click()
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "selected")
  await offer.getByTestId("payment-confirm").click()
  await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: "Connect wallet" }).click()
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").dblclick()

  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toContainText("ONDO-LOCAL-20260825-001")
  await expect(receipt).toContainText("19 OOKRW Test")
  await expect(offer.locator("[data-operation-kind]")).toHaveCount(0)
  await receipt.getByText("Refund & support").click()
  await receipt.getByTestId("payment-refund").click()
  await expect(receipt).toHaveAttribute("data-refunded", "true")
  await expect(receipt).toContainText("Original payment")
  await expect(receipt).toContainText(/Refunded\s*19 OOKRW Test/)
  await expect(receipt).toContainText("ONDO benefit3 OOKRW Test")
  await expect(receipt).toContainText("60 OOKRW Test")
})

test("FID-LIVE-003 cancel and session-fixture recovery preserve the exact meal-offer return", async ({ browser }) => {
  const expectedReturn = JSON.stringify({ cta: "START_MEAL_PAYMENT", venueId: VENUE_ID, offerId: "meal-offer-gukbap" })

  const cancelContext = await browser.newContext()
  const cancelPage = await cancelContext.newPage()
  await seedGoldenCandidate(cancelPage, "en")
  const { entry, offer } = await openMealOffer(cancelPage)
  await expect(offer).toHaveAttribute("data-return-to", expectedReturn)
  await cancelPage.keyboard.press("Escape")
  await expect(cancelPage.getByTestId("canonical-place-overlay")).toBeVisible()
  await expect(entry).toBeFocused()
  await cancelContext.close()

  for (const outcome of ["failure", "insufficient"] as const) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await seedGoldenCandidate(page, "en")
    await page.addInitScript((payment) => {
      (window as Window & { __ONDO_B_QA__?: { payment: typeof payment } }).__ONDO_B_QA__ = { payment }
    }, outcome)
    const opened = await openMealOffer(page)
    await expect(opened.offer).toHaveAttribute("data-return-to", expectedReturn)
    await opened.offer.getByTestId("benefit-accept").click()
    await opened.offer.getByTestId("payment-confirm").click()
    await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: "Connect wallet" }).click()
    await opened.offer.getByTestId("payment-minimum-consent").locator("input").check()
    await opened.offer.getByTestId("payment-confirm").click()
    await expect(opened.offer.getByTestId("payment-recovery")).toHaveAttribute("data-recovery", outcome)
    await expect(opened.offer.locator("[data-operation-kind]")).toHaveCount(0)
    await page.evaluate(() => { delete (window as Window & { __ONDO_B_QA__?: unknown }).__ONDO_B_QA__ })
    await opened.offer.getByTestId("payment-retry").click()
    await opened.offer.getByTestId("payment-confirm").click()
    await expect(opened.offer.getByTestId("payment-receipt")).toBeVisible()
    await context.close()
  }
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
