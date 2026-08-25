import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

async function seed(page: Page, locale: "en" | "ko" = "en", qa?: { wallet?: "failure"; payment?: "failure" | "insufficient" }) {
  await page.addInitScript(({ key, language, injected }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localInteractionBoundarySeen: false,
    }))
    if (injected) (window as Window & { __ONDO_B_QA__?: typeof injected }).__ONDO_B_QA__ = injected
  }, { key: DEVICE_KEY, language: locale, injected: qa })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function openTravelPass(page: Page) {
  await page.goto("/ondo-b", { waitUntil: "networkidle" })
  await page.getByTestId("ondo-main-nav").getByTestId("nav-id").click()
  await expect(page.getByTestId("travel-pass-status")).toBeVisible()
}

async function openContextualOffer(page: Page) {
  await page.goto("/ondo-b", { waitUntil: "networkidle" })
  await page.locator('[data-city="seoul"]').dispatchEvent("click")
  await page.getByTestId("ondo-b-view-toggle").click()
  await page.locator(`[data-venue-id="${VENUE_ID}"]`).getByRole("button").first().click()
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  const entry = place.getByTestId("canonical-meal-benefit-open")
  await entry.click()
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  await expect(offer).toHaveAttribute("data-origin-venue-id", VENUE_ID)
  return { offer, place, entry }
}

test("premium Travel Pass keeps readiness independent and wallet linking consumer-shaped", async ({ page }) => {
  await seed(page)
  await openTravelPass(page)

  for (const surface of ["traveler-id-account", "traveler-id-person", "traveler-id-age", "traveler-id-payment", "wallet-balance", "wallet-benefit", "wallet-activity"]) {
    await expect(page.getByTestId(surface)).toBeVisible()
  }

  await page.getByTestId("traveler-id-person").getByRole("button").click()
  const check = page.getByTestId("ondo-b-local-check-walkthrough")
  await expect(check).toContainText("Share one simple answer")
  await check.getByTestId("local-check-boundary-continue").click()
  await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "success")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-status", "none")

  const commerce = page.getByTestId("ondo-b-id-wallet-commerce")
  await commerce.getByTestId("wallet-link-open").click()
  const sheet = page.getByTestId("wallet-connect-sheet")
  await sheet.getByRole("button", { name: "Connect wallet" }).click()
  await expect(commerce).toHaveAttribute("data-wallet", "ready")
  await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "ready")
  await expect(page.locator("body")).not.toContainText(/choose.*outcome|return wallet ready|settlement mirror/i)

  const violations = await new AxeBuilder({ page }).include("[data-testid='ondo-b-traveler-id']").analyze()
  expect(violations.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})

test("contextual benefit pays once, creates a consumer receipt, refunds, and returns to the exact place", async ({ page }) => {
  await seed(page)
  const { offer, place } = await openContextualOffer(page)
  await expect(offer).toContainText("OOKRW Test")
  await expect(offer).toContainText("Test quote")
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-benefit-recommendation", "recommended")
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "available")
  await expect(offer.getByTestId("commerce-benefit-eligibility")).toContainText("₩22,000 minimum met")
  await offer.getByTestId("benefit-accept").click()
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "selected")
  await expect(offer.getByTestId("payment-confirm")).toContainText("Connect test wallet to pay")
  await offer.getByTestId("payment-confirm").click()
  await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: "Connect wallet" }).click()
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").dblclick()

  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toContainText("ONDO-LOCAL-20260825-001")
  await expect(receipt).toContainText("19 OOKRW Test")
  await expect(offer.locator("[data-operation-kind]")).toHaveCount(0)
  await receipt.getByTestId("payment-receipt-return").click()
  await expect(place).toBeVisible()
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await place.getByRole("button", { name: "Close place" }).last().click()

  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-balance")).toContainText("41")
  const activity = page.getByTestId("wallet-activity-receipt")
  await expect(activity).toContainText("Paid 19 OOKRW Test")
  await expect(activity).toContainText("ONDO-LOCAL-20260825-001")

  await page.reload({ waitUntil: "networkidle" })
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-balance")).toContainText("41")
  const restoredActivity = page.getByTestId("wallet-activity-receipt")
  await expect(restoredActivity).toContainText("Paid 19 OOKRW Test")
  await expect(restoredActivity).toContainText("ONDO-LOCAL-20260825-001")
  await restoredActivity.getByTestId("wallet-activity-refund").click()
  await expect(page.getByTestId("wallet-balance")).toContainText("60")
  await expect(restoredActivity).toContainText("Refunded")

  await page.getByTestId("nav-my").click()
  await expect(page.getByTestId("my-korea-receipts")).toContainText("Refunded")
})

test("QA injection creates recovery without exposing outcome controls", async ({ page }) => {
  await seed(page, "en", { payment: "failure" })
  const { offer } = await openContextualOffer(page)
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").click()
  await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: "Connect wallet" }).click()
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  await expect(offer.getByTestId("payment-recovery")).toContainText("Payment didn’t complete")
  await expect(offer.locator('[data-testid*="outcome"]')).toHaveCount(0)
  await expect(offer.locator("[data-operation-kind]")).toHaveCount(0)

  await page.evaluate(() => { delete (window as Window & { __ONDO_B_QA__?: unknown }).__ONDO_B_QA__ })
  await offer.getByTestId("payment-retry").click()
  await offer.getByTestId("payment-confirm").click()
  await expect(offer.getByTestId("payment-receipt")).toBeVisible()
})
