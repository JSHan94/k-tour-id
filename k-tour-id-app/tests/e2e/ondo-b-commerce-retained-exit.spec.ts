import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const SECOND_CANONICAL_VENUE_ID = "mois-18939eecb43c15ab4305"

type OfferSnapshot = Readonly<{
  benefitPolicy: string | null
  originVenueId: string | null
  paymentState: string | null
  returnTo: string | null
  text: string
  transactionVenueId: string | null
  walletStatus: string | null
}>

test.describe.configure({ mode: "serial", timeout: 120_000 })

function commerceOffer(page: Page) {
  return page.locator('[data-testid="ondo-b-id-wallet-commerce"][data-flow8-object="offer"]')
}

async function snapshotOffer(offer: Locator): Promise<OfferSnapshot> {
  return offer.evaluate((element) => ({
    benefitPolicy: element.getAttribute("data-benefit-policy"),
    originVenueId: element.getAttribute("data-origin-venue-id"),
    paymentState: element.getAttribute("data-payment-state"),
    returnTo: element.getAttribute("data-return-to"),
    text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
    transactionVenueId: element.getAttribute("data-transaction-venue-id"),
    walletStatus: element.getAttribute("data-wallet-status"),
  }))
}

async function openOffer(page: Page) {
  await openCanonicalVenue(page, { query: "city=seoul&view=list" })
  const place = page.getByTestId("canonical-place-overlay")
  const opener = place.getByTestId("canonical-meal-benefit-open")
  await opener.scrollIntoViewIfNeeded()
  await opener.click()
  const offer = commerceOffer(page)
  await expect(offer).toHaveAttribute("data-commerce-presence", "open")
  await expect(offer).toHaveAttribute("data-origin-venue-id", CANONICAL_VENUE_ID)
  await expect(offer.getByTestId("commerce-origin-return")).toBeFocused()
  return { offer, opener, place }
}

async function clickProgrammatically(locator: Locator) {
  await locator.evaluate((element) => (element as HTMLButtonElement).click())
}

test.describe("Commerce offer · retained mobile exit", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await seedB(page, { locale: "en", local: { onboarding: "ONB-COMPLETE" } })
    await gotoB(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("COMMERCE-EXIT-BROWSER-001 normal close freezes the snapshot and retains input, modal, scroll, and exact return focus", async ({ page }) => {
    const { offer, opener, place } = await openOffer(page)
    const canvas = page.getByTestId("ondo-canvas")
    const before = await snapshotOffer(offer)
    const voucher = offer.getByTestId("commerce-voucher")
    const voucherBefore = await voucher.getAttribute("data-voucher-state")

    await offer.getByTestId("commerce-origin-return").click()
    const retained = await offer.evaluate(async (element) => {
      // Dispatch adversarial late input inside the retained DOM, then sample
      // the painted exit from the page clock so Playwright round-trips cannot
      // consume the finite interval before the assertion observes it.
      ;(element.querySelector('[data-testid="benefit-accept"]') as HTMLButtonElement | null)?.click()
      element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }))
      await new Promise((resolve) => window.setTimeout(resolve, 120))
      const voucher = element.querySelector('[data-testid="commerce-voucher"]')
      const canvas = document.querySelector('[data-testid="ondo-canvas"]')
      return {
        connected: element.isConnected,
        phase: element.getAttribute("data-commerce-presence"),
        busy: element.getAttribute("aria-busy"),
        bodyOverflow: document.body.style.overflow,
        canvasModal: canvas?.getAttribute("data-ondo-modal-open") ?? null,
        voucherState: voucher?.getAttribute("data-voucher-state") ?? null,
        snapshot: {
          benefitPolicy: element.getAttribute("data-benefit-policy"),
          originVenueId: element.getAttribute("data-origin-venue-id"),
          paymentState: element.getAttribute("data-payment-state"),
          returnTo: element.getAttribute("data-return-to"),
          text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
          transactionVenueId: element.getAttribute("data-transaction-venue-id"),
          walletStatus: element.getAttribute("data-wallet-status"),
        },
      }
    })
    expect(retained).toMatchObject({
      connected: true,
      phase: "closing",
      busy: "true",
      bodyOverflow: "hidden",
      canvasModal: "true",
      voucherState: voucherBefore ?? "available",
      snapshot: before,
    })

    await expect(offer).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect(place).toBeVisible()
    await expect(canvas).toHaveAttribute("data-ondo-modal-open", "true")
    await expect(canvas).toHaveAttribute("data-ondo-modal-priority", "120")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden")
  })

  test("COMMERCE-EXIT-BROWSER-002 rapid same-offer reopen cancels stale removal while a different real venue never inherits the old snapshot", async ({ page }) => {
    let { offer, opener } = await openOffer(page)
    const originalSnapshot = await snapshotOffer(offer)

    await offer.getByTestId("commerce-origin-return").click()
    await expect(offer).toHaveAttribute("data-commerce-presence", "closing")
    await clickProgrammatically(opener)

    offer = commerceOffer(page)
    await expect(offer).toHaveCount(1)
    await expect(offer).toHaveAttribute("data-commerce-presence", "open")
    expect(await snapshotOffer(offer)).toEqual(originalSnapshot)
    await page.waitForTimeout(420)
    await expect(offer).toHaveCount(1)
    await expect(offer).toHaveAttribute("data-commerce-presence", "open")

    // Only the canonical offer venue supports this checkout. During its next
    // retained close, move through the real list to another canonical venue;
    // do not create a review fixture that pretends the second venue has an
    // offer. The exiting commerce snapshot must stay original and its stale
    // timer must not remove or rewrite the newly selected place.
    await offer.getByTestId("commerce-origin-return").click()
    await expect(offer).toHaveAttribute("data-commerce-presence", "closing")
    await offer.evaluate((element) => {
      const samples: OfferSnapshot[] = []
      ;(window as Window & { __ONDO_COMMERCE_EXIT_SAMPLES__?: OfferSnapshot[] }).__ONDO_COMMERCE_EXIT_SAMPLES__ = samples
      const sample = () => samples.push({
        benefitPolicy: element.getAttribute("data-benefit-policy"),
        originVenueId: element.getAttribute("data-origin-venue-id"),
        paymentState: element.getAttribute("data-payment-state"),
        returnTo: element.getAttribute("data-return-to"),
        text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
        transactionVenueId: element.getAttribute("data-transaction-venue-id"),
        walletStatus: element.getAttribute("data-wallet-status"),
      })
      const tick = () => {
        if (!element.isConnected) return
        sample()
        window.requestAnimationFrame(tick)
      }
      tick()
    })
    const originalPlace = page.getByTestId("canonical-place-overlay")
    await clickProgrammatically(originalPlace.locator('[data-place-return-focus="detail_close"]'))
    const secondRow = page.getByTestId("ondo-b-venue-list").locator(`li[data-venue-id="${SECOND_CANONICAL_VENUE_ID}"]`)
    await clickProgrammatically(secondRow.locator("button"))
    const secondPeek = page.getByTestId("canonical-place-peek")
    await expect(secondPeek).toHaveAttribute("data-venue-id", SECOND_CANONICAL_VENUE_ID)
    await clickProgrammatically(secondPeek.getByTestId("canonical-place-details"))

    const secondPlace = page.getByTestId("canonical-place-overlay")
    await expect(secondPlace).toHaveAttribute("data-venue-id", SECOND_CANONICAL_VENUE_ID)
    await expect(secondPlace.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await expect(offer).toHaveCount(0)
    const exitSamples = await page.evaluate(() =>
      (window as Window & { __ONDO_COMMERCE_EXIT_SAMPLES__?: OfferSnapshot[] }).__ONDO_COMMERCE_EXIT_SAMPLES__ ?? [],
    )
    expect(exitSamples.length).toBeGreaterThan(0)
    expect(exitSamples.every((sample) => JSON.stringify(sample) === JSON.stringify(originalSnapshot))).toBe(true)
    await page.waitForTimeout(160)
    await expect(secondPlace).toHaveAttribute("data-venue-id", SECOND_CANONICAL_VENUE_ID)
    await expect(secondPlace.getByTestId("canonical-meal-benefit-open")).toHaveCount(0)
  })

  test("COMMERCE-EXIT-BROWSER-003 reduced motion removes immediately without leaking ownership and restores the offer opener", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const { offer, opener, place } = await openOffer(page)
    const canvas = page.getByTestId("ondo-canvas")

    await offer.getByTestId("commerce-origin-return").click()

    await expect(offer).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect(place).toBeVisible()
    await expect(canvas).toHaveAttribute("data-ondo-modal-open", "true")
    await expect(canvas).toHaveAttribute("data-ondo-modal-priority", "120")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden")
  })
})
