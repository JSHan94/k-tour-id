import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seedB(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript(({ key, language }) => {
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
  }, { key: DEVICE_KEY, language: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function openWallet(page: Page, locale: "en" | "ko" = "en") {
  await seedB(page, locale)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-id").click()
  return page.getByTestId("ondo-b-id-wallet-commerce")
}

async function linkWallet(page: Page) {
  const commerce = page.getByTestId("ondo-b-id-wallet-commerce")
  await commerce.getByTestId("wallet-link-open").click()
  const boundary = page.getByTestId("commerce-local-boundary")
  if (await boundary.count()) await boundary.getByTestId("commerce-boundary-continue").click()
  await page.getByTestId("wallet-link-ready").click()
  await expect(commerce).toHaveAttribute("data-wallet", "ready")
  return commerce
}

test("ID · Wallet keeps wallet linking user-driven, recoverable, and memory-only", async ({ page }) => {
  const commerce = await openWallet(page)
  await commerce.getByTestId("wallet-link-open").click()
  await expect(page.getByTestId("commerce-local-boundary")).toContainText("No provider, chain, merchant, or asset transfer is connected")
  await page.getByTestId("commerce-boundary-continue").click()
  await page.getByTestId("wallet-link-failure").click()
  await expect(commerce).toHaveAttribute("data-wallet", "failed")
  await commerce.getByTestId("wallet-link-retry").click()
  await page.getByTestId("wallet-link-ready").click()
  await expect(commerce).toHaveAttribute("data-wallet", "ready")
  await expect(commerce).toContainText("KRW display price")
  await expect(commerce).toContainText("OOKRW read-only local demo balance")

  const stored = await page.evaluate((key) => localStorage.getItem(key) ?? "", DEVICE_KEY)
  expect(stored).not.toMatch(/wallet|balance|payment|voucher|receipt|settlement|claim|consent|origin/i)
})

test("stable checkout covers consent, optional benefit, idempotent success, settlement mirrors, and refund", async ({ page }) => {
  const commerce = await openWallet(page)
  await linkWallet(page)
  await commerce.getByTestId("merchant-offer-open").click()
  const checkout = page.getByTestId("ondo-b-stable-checkout")
  await expect(checkout).toContainText("ONDO demo merchant offer")
  await expect(checkout).toContainText("₩22,000")
  await expect(checkout).toContainText("22 OOKRW")
  await checkout.getByTestId("voucher-toggle").click()
  await expect(checkout).toContainText("19 OOKRW")
  await checkout.getByTestId("payment-minimum-consent").check()
  await checkout.getByTestId("payment-confirm").dblclick()
  await page.getByTestId("payment-outcome-success").click()

  const receipt = page.getByTestId("payment-receipt")
  await expect(receipt).toHaveCount(1)
  await expect(receipt).toContainText("ONDO-LOCAL-20260825-001")
  await expect(receipt.getByTestId("holder-settlement-mirror")).toBeVisible()
  await expect(receipt.getByTestId("merchant-settlement-mirror")).toBeVisible()
  await receipt.getByTestId("payment-refund").click()
  await expect(receipt).toHaveAttribute("data-status", "refunded")
})

test("stable checkout preserves cancel, failure/retry, insufficient balance, focus, Korean, and accessibility", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const commerce = await openWallet(page, "ko")
  await linkWallet(page)
  await commerce.getByTestId("merchant-offer-open").click()
  let checkout = page.getByTestId("ondo-b-stable-checkout")
  await checkout.getByTestId("payment-cancel").click()
  await expect(commerce.getByTestId("merchant-offer-open")).toBeFocused()

  await commerce.getByTestId("merchant-offer-open").click()
  checkout = page.getByTestId("ondo-b-stable-checkout")
  await checkout.getByTestId("payment-minimum-consent").check()
  await checkout.getByTestId("payment-confirm").click()
  await page.getByTestId("payment-outcome-failure").click()
  await expect(checkout.getByTestId("payment-retry")).toBeFocused()
  await checkout.getByTestId("payment-retry").click()
  await checkout.getByTestId("payment-confirm").click()
  await page.getByTestId("payment-outcome-insufficient").click()
  await expect(checkout).toContainText("잔액이 부족합니다")
  await checkout.getByTestId("payment-retry").click()

  expect(await checkout.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-stable-checkout']").analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})

test("canonical place opens a separated offer and both cancel and success return to the exact place", async ({ page }) => {
  await seedB(page)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.locator("[data-city='seoul']").click()
  await page.getByRole("button", { name: "List", exact: true }).click()
  await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  const venueId = await place.getAttribute("data-venue-id")
  expect(venueId).toBeTruthy()

  await place.getByTestId("canonical-demo-meal-offer-open").click()
  await expect(page.getByTestId("ondo-b-id-wallet-commerce")).toHaveAttribute("data-origin-venue-id", venueId!)
  await linkWallet(page)
  await page.getByTestId("merchant-offer-open").click()
  await page.getByTestId("payment-cancel").click()
  await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", venueId!)

  await page.getByTestId("canonical-demo-meal-offer-open").click()
  await linkWallet(page)
  await page.getByTestId("merchant-offer-open").click()
  const checkout = page.getByTestId("ondo-b-stable-checkout")
  await checkout.getByTestId("payment-minimum-consent").check()
  await checkout.getByTestId("payment-confirm").click()
  await page.getByTestId("payment-outcome-success").click()
  await page.getByTestId("payment-receipt-return").click()
  await expect(page.getByTestId("canonical-place-overlay")).toHaveAttribute("data-venue-id", venueId!)
})
