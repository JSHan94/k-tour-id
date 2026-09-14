import { mkdirSync } from "node:fs"
import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const ACTION_GATE_KEY = "ondo-b.action-gates.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const SECOND_VENUE_ID = "mois-18939eecb43c15ab4305"
const ARTIFACT_DIR = "artifacts/qa/flow8-wallet"

type Locale = "en" | "ko" | "ja"
type ExecutionLane = "normal" | "review"
type Viewport = { label: string; width: number; height: number }
type BenefitQa = "ineligible" | "below_minimum" | "expired"
type Flow8Qa = { wallet?: "failure"; payment?: "failure" | "insufficient"; benefit?: BenefitQa; holdProcessing?: boolean }

const VIEWPORTS: readonly Viewport[] = [
  { label: "320x720", width: 320, height: 720 },
  { label: "390x844", width: 390, height: 844 },
  { label: "844x390", width: 844, height: 390 },
  { label: "1440x1000", width: 1440, height: 1000 },
]

const COPY = {
  en: { connect: "Set up travel wallet", retry: "Try setup again", refund: "Undo payment", cancel: "Not now", close: "Close" },
  ko: { connect: "여행 지갑 설정", retry: "설정 다시 시도", refund: "결제 되돌리기", cancel: "나중에", close: "닫기" },
  ja: { connect: "旅のウォレットを設定", retry: "設定をもう一度試す", refund: "支払いを取り消す", cancel: "今回はしない", close: "閉じる" },
} as const

test.describe.configure({ timeout: 180_000, mode: "serial" })

function pathForExecutionLane(path: string, lane: ExecutionLane) {
  const url = new URL(path, "https://ondo.invalid")
  if (lane === "review") url.searchParams.set("qa", "1")
  else url.searchParams.delete("qa")
  return `${url.pathname}${url.search}${url.hash}`
}

async function seed(page: Page, locale: Locale = "en", receipts: "none" | "paid" | "refunded" = "none", paymentAxesReady = false) {
  await page.addInitScript(({ key, language, venueId, receiptState, axesReady }) => {
    if (localStorage.getItem(key) !== null) return
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
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
      commerceLocalBoundarySeen: true,
      commerceReceipts: receiptState === "none" ? [] : [{
        executionTruth: "FIXTURE_REVIEW",
        provenanceTruth: "SIMULATED",
        receiptId: "ONDO-LOCAL-20260825-001",
        refundReceiptId: receiptState === "refunded" ? "ONDO-LOCAL-REFUND-20260825-001" : null,
        offerId: "meal-offer-gukbap",
        venueId,
        status: receiptState,
        paidOOKRW: 19,
        benefitOOKRW: 3,
        balanceOOKRW: receiptState === "paid" ? 41 : 60,
      }],
    }))
    if (axesReady) {
      const issuedAt = new Date(Date.now() - 1_000).toISOString()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      sessionStorage.setItem("ondo-b.account.v1", JSON.stringify({ account: "ACC-ACTIVE", returnTo: null }))
      sessionStorage.setItem("ondo-b.action-gates.v1", JSON.stringify({
        version: 1,
        person: { status: "unverified", expiresAt: null },
        payment: {
          status: "eligible",
          expiresAt,
          reviewReceipt: {
            issuer: "ONDO_REVIEW_FIXTURE",
            executionTruth: "FIXTURE_REVIEW",
            provenanceTruth: "SIMULATED",
            fixtureId: "FX-PKY-FLOW8-SEED",
            issuedAt,
            expiresAt,
          },
        },
        pending: null,
        lastConsumed: null,
        outcome: null,
      }))
    }
  }, { key: DEVICE_KEY, language: locale, venueId: VENUE_ID, receiptState: receipts, axesReady: paymentAxesReady })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function waitForShell(page: Page) {
  const region = page.getByTestId("ondo-scroll-region")
  await expect(region).toBeVisible()
  await expect.poll(
    () => region.evaluate((element) => element.style.getPropertyValue("--ondo-scroll-viewport")),
    { timeout: 30_000 },
  ).not.toBe("")
}

function commerceOffer(page: Page) {
  return page.locator('[data-testid="ondo-b-id-wallet-commerce"][data-flow8-object="offer"]')
}

async function openTravelPass(page: Page, lane: ExecutionLane, locale: Locale = "en", receipts: "none" | "paid" | "refunded" = "none", paymentAxesReady = false) {
  await seed(page, locale, receipts, paymentAxesReady)
  await page.goto(pathForExecutionLane("/", lane), { waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await page.getByTestId("nav-id").click()
  const pass = page.getByTestId("ondo-b-traveler-id")
  await expect(pass).toBeVisible()
  return pass
}

async function openOffer(page: Page, lane: ExecutionLane, locale: Locale = "en", qa?: { wallet?: "failure"; payment?: "failure" | "insufficient"; benefit?: BenefitQa }, paymentAxesReady = true) {
  await seed(page, locale, "none", paymentAxesReady)
  if (qa) await page.addInitScript((injected) => { (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__ = injected }, qa)
  await page.goto(pathForExecutionLane("/", lane), { waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await page.locator("[data-city='seoul']").click()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "seoul")
  const venueList = page.getByTestId("ondo-b-venue-list")
  if (!await venueList.isVisible()) {
    const toggle = page.getByTestId("ondo-b-view-toggle")
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(venueList).toBeVisible()
  }
  const venueButton = venueList.locator(`[data-venue-id='${VENUE_ID}'] button`)
  await venueButton.scrollIntoViewIfNeeded()
  await venueButton.click()
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  const benefitButton = place.getByTestId("canonical-meal-benefit-open")
  await benefitButton.scrollIntoViewIfNeeded()
  await benefitButton.click()
  const offer = commerceOffer(page)
  await expect(offer).toHaveAttribute("data-origin-venue-id", VENUE_ID)
  return { offer, place }
}

async function connectWallet(page: Page, locale: Locale) {
  const sheet = page.getByTestId("wallet-connect-sheet")
  await expect(sheet).toBeVisible()
  await sheet.getByRole("button", { name: COPY[locale].connect, exact: true }).click()
  await expect(sheet).toBeHidden()
}

async function addConnectedFundingSample(page: Page, offer: Locator) {
  await offer.getByTestId("payment-confirm").click()
  const funding = page.getByTestId("funding-source-sheet")
  await expect(funding).toBeVisible()
  await funding.locator("input[type='radio'][value='krw_bank']").check()
  await funding.getByTestId("funding-sample-open").click()
  await funding.getByTestId("funding-sample-use").click()
  await expect(funding).toBeHidden()
}

async function completeCheckoutCredentialPresentation(page: Page) {
  const setup = page.getByTestId("k-tour-id-setup")
  const gate = page.getByTestId("ondo-b-action-gate")
  // Some callers enter before Payment has been acknowledged, while others
  // arrive after that gate. Advance only the exact pending Payment decision;
  // K-Tour presentation remains an adjacent, independently asserted step.
  await expect(gate).toBeVisible()
  await expect.poll(async () => {
    if (await gate.getAttribute("data-active-gate") === "credential") return "credential"
    if (await gate.getByTestId("action-gate-confirm").isVisible()) return "payment"
    return "waiting"
  }).toMatch(/^(payment|credential)$/)
  const firstDecision = await gate.getAttribute("data-active-gate") === "credential" ? "credential" : "payment"
  if (firstDecision === "payment") {
    await expect(gate.getByTestId("payment-privacy-disclosure")).toBeVisible()
    await gate.getByTestId("action-gate-confirm").click()
  }
  await expect(gate).toHaveAttribute("data-active-gate", "credential")
  await expect.poll(async () => await setup.isVisible()
    || await gate.getByTestId("action-gate-presentation").isVisible()).toBe(true)
  if (await setup.isVisible()) {
    await expect(setup).toHaveAttribute("data-origin", "action_gate")
    await setup.getByTestId("k-tour-id-method-mobile-id").click()
    await expect(setup.getByTestId("k-tour-id-consent")).toBeVisible()
    await setup.getByTestId("k-tour-id-consent-approve").click()
    await expect(setup).toHaveAttribute("data-phase", "cx_handoff_preview")
    await setup.getByTestId("k-tour-id-continue").click()
    const holder = setup.getByTestId("k-tour-id-holder-delivery")
    await expect(holder).toBeVisible()
    await holder.getByTestId("k-tour-id-continue").click()
    await expect(setup).toBeHidden()
    await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "review-draft")
    await page.waitForTimeout(500)
    await expect(setup).toBeHidden()
  }
  await expect(gate).toHaveAttribute("data-active-gate", "credential")
  await expect(gate.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-venue", VENUE_ID)
  await expect(gate.getByTestId("action-gate-presentation")).toHaveAttribute("data-request-active", "true")
  await gate.getByTestId("action-gate-confirm").click()
}

async function expectNoHorizontalOverflow(locator: Locator) {
  const dimensions = await locator.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1)
}

async function expectControls(root: Locator) {
  for (const control of await root.locator("button:visible, summary:visible").all()) {
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    // WebKit/Chromium can report a computed 44px target as 43.9999 after
    // device-scale transforms; keep a sub-hundredth-pixel rounding tolerance.
    expect(box!.height).toBeGreaterThanOrEqual(43.99)
  }
}

async function expectContainedInViewport(locator: Locator, viewport: Viewport) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(-1)
  expect(box!.y).toBeGreaterThanOrEqual(-1)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1)
}

async function quietCapture(page: Page, name: string) {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await document.fonts.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
  const root = page.getByTestId("ondo-b-root")
  await expectNoHorizontalOverflow(root)
  await expectControls(root)
  await root.screenshot({
    path: `${ARTIFACT_DIR}/${name}.png`,
    animations: "disabled",
    caret: "hide",
    scale: (page.viewportSize()?.width ?? 0) >= 1200 ? "css" : "device",
  })
}

async function processingCapture(page: Page, name: string) {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await document.fonts.ready
  })
  const root = page.getByTestId("ondo-b-root")
  await expectNoHorizontalOverflow(root)
  await root.screenshot({
    path: `${ARTIFACT_DIR}/${name}.png`,
    animations: "allow",
    caret: "hide",
    scale: (page.viewportSize()?.width ?? 0) >= 1200 ? "css" : "device",
  })
}

async function navigateToOfferFromExplore(page: Page) {
  await page.getByTestId("nav-ondo").click()
  await page.locator("[data-city='seoul']").click()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "seoul")
  const venueList = page.getByTestId("ondo-b-venue-list")
  if (!await venueList.isVisible()) {
    const toggle = page.getByTestId("ondo-b-view-toggle")
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(venueList).toBeVisible()
  }
  const venueButton = venueList.locator(`[data-venue-id='${VENUE_ID}'] button`)
  await venueButton.scrollIntoViewIfNeeded()
  await venueButton.click()
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  const benefitButton = place.getByTestId("canonical-meal-benefit-open")
  await benefitButton.scrollIntoViewIfNeeded()
  await benefitButton.click()
  const offer = commerceOffer(page)
  await expect(offer).toHaveAttribute("data-origin-venue-id", VENUE_ID)
  return { offer, place }
}

async function setCaptureQa(page: Page, qa?: Flow8Qa) {
  await page.evaluate((next) => {
    const target = window as Window & { __ONDO_B_QA__?: Flow8Qa }
    if (next) target.__ONDO_B_QA__ = next
    else delete target.__ONDO_B_QA__
  }, qa)
}

async function resetCaptureDevice(page: Page, locale: Locale, lane: ExecutionLane) {
  await page.evaluate(({ key, language }) => {
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
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
      commerceLocalBoundarySeen: true,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, language: locale })
  await setCaptureQa(page)
  await page.goto(pathForExecutionLane("/", lane), { waitUntil: "domcontentloaded" })
  await waitForShell(page)
}

async function installOneShotDeviceWriteFailure(page: Page) {
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem
    let pending = true
    Storage.prototype.setItem = function (name: string, value: string) {
      if (this === localStorage && name === key && pending) {
        pending = false
        throw new DOMException("Quota exceeded", "QuotaExceededError")
      }
      return original.call(this, name, value)
    }
  }, DEVICE_KEY)
}

async function storedDevice(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}") as {
    commerceFundingSource?: "travel_balance" | "krw_bank" | "card_wallet" | "digital_dollar"
    commerceReceipts?: Array<{ venueId?: string; status?: string; paidOOKRW?: number; benefitOOKRW?: number; balanceOOKRW?: number }>
  }, DEVICE_KEY)
}

test("FLOW8-VIS-001 Pass and Wallet read as two tactile objects in the first useful frame", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const pass = await openTravelPass(page, "normal")
  await expect(pass).toHaveAttribute("data-visual-direction", "apple-wallet-flow8")
  const travelObject = pass.locator("section").first()
  const walletObject = page.getByTestId("wallet-balance")
  await expect(travelObject).toBeVisible()
  await expect(walletObject).toBeVisible()
  await expect(walletObject).toHaveAttribute("data-flow8-object", "wallet")
  await expect(walletObject).toHaveAttribute("data-wallet-state", "disconnected")
  await expect(walletObject.getByTestId("wallet-display-equivalent")).toHaveText("—")
  await expect(walletObject.getByTestId("wallet-test-balance")).toHaveText("Set up when you want to use an offer")
  await expect(pass.getByTestId("travel-pass-local-boundary")).toBeVisible()
  await expect(page.getByTestId("wallet-non-live-boundary")).toHaveCount(0)
  await expect(walletObject).toContainText("Set up when you want to use an offer")
  await expect(walletObject.getByTestId("wallet-link-open")).toHaveAccessibleName("Set up travel wallet")
  await expect(page.getByTestId("wallet-eyebrow")).toHaveCSS("color", "rgb(105, 64, 85)")
  await expectNoHorizontalOverflow(pass)
  await expectControls(walletObject)
})

test("FLOW8-VIS-001B 320 and 390 keep the public zero-balance journey and review balance inside their cards", async ({ browser }) => {
  for (const viewport of [{ width: 320, height: 720 }, { width: 390, height: 844 }]) {
    const normalContext = await browser.newContext({ viewport })
    const normalPage = await normalContext.newPage()
    await openTravelPass(normalPage, "normal")
    const normalWallet = normalPage.getByTestId("wallet-balance")
    const normalSetup = normalWallet.getByTestId("wallet-link-open")
    await normalSetup.click()
    await connectWallet(normalPage, "en")
    await expect(normalWallet).toHaveAttribute("data-wallet-state", "empty")
    await expect(normalWallet.locator('[data-status="empty"]')).toHaveText("Empty")
    await expect(normalWallet.locator('[data-status="ready"]')).toHaveCount(0)
    await expect(normalWallet.getByTestId("wallet-display-equivalent")).toHaveText("₩0")
    await expect(normalWallet.getByTestId("wallet-test-balance")).toHaveText("Choose a funding method")
    await expect(normalWallet.getByTestId("wallet-review-provenance")).toHaveCount(0)
    const fundingPrimary = normalWallet.getByTestId("wallet-funding-primary")
    await expect(fundingPrimary).toHaveAccessibleName("Choose funding method")
    await fundingPrimary.click()
    const fundingSheet = normalPage.getByTestId("funding-source-sheet")
    await expect(fundingSheet).toBeVisible()
    await fundingSheet.locator("input[type='radio'][value='card_wallet']").check()
    await expect(fundingSheet.getByTestId("funding-provider-required")).toContainText("Not connected")
    await expect(fundingSheet.getByTestId("funding-method-save")).toBeDisabled()
    await fundingSheet.locator("input[type='radio'][value='travel_balance']").check()
    await fundingSheet.getByTestId("funding-method-save").click()
    await expect(fundingSheet).toBeHidden()
    await expect(normalPage.getByTestId("wallet-payment-method")).toHaveAttribute("data-funding-source", "travel_balance")
    await expect(fundingPrimary).toBeFocused()
    expect((await storedDevice(normalPage)).commerceFundingSource).toBe("travel_balance")
    expect((await storedDevice(normalPage)).commerceReceipts ?? []).toEqual([])
    await expectNoHorizontalOverflow(normalWallet)
    await normalContext.close()

    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await openTravelPass(page, "review")
    const wallet = page.getByTestId("wallet-balance")
    const amount = wallet.getByTestId("wallet-display-equivalent")
    const setup = wallet.getByTestId("wallet-link-open")
    await expect(wallet).toHaveAttribute("data-wallet-state", "disconnected")
    await expect(amount).toHaveText("—")
    await expect(wallet.getByTestId("wallet-test-balance")).toHaveText("Set up when you want to use an offer")
    const [cardBox, amountBox, setupBox] = await Promise.all([wallet.boundingBox(), amount.boundingBox(), setup.boundingBox()])
    expect(cardBox).not.toBeNull()
    expect(amountBox).not.toBeNull()
    expect(setupBox).not.toBeNull()
    expect(setupBox!.y).toBeGreaterThanOrEqual(amountBox!.y + amountBox!.height)
    expect(setupBox!.y + setupBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 1)
    await expectNoHorizontalOverflow(wallet)

    await setup.click()
    await connectWallet(page, "en")
    await expect(wallet).toHaveAttribute("data-wallet-state", "ready")
    await expect(amount).toHaveText("₩60,000")
    await expect(wallet.getByTestId("wallet-test-balance")).toHaveText("≈ US$44.44")
    const readyStyle = await wallet.evaluate((element) => getComputedStyle(element).backgroundImage)
    expect(readyStyle).toContain("rgb(16, 16, 18)")
    const readyAction = wallet.getByRole("button", { name: "Reset travel wallet", exact: true })
    const [readyAmountBox, readyActionBox] = await Promise.all([amount.boundingBox(), readyAction.boundingBox()])
    expect(readyAmountBox).not.toBeNull()
    expect(readyActionBox).not.toBeNull()
    expect(readyActionBox!.y).toBeGreaterThanOrEqual(readyAmountBox!.y + readyAmountBox!.height)
    await expectNoHorizontalOverflow(wallet)
    await context.close()
  }
})

test("FLOW8-FUNDING-SAMPLE-019 external rails truthfully hand off to one session-only travel balance", async ({ browser }) => {
  const matrix = [
    { viewport: { width: 320, height: 720 }, source: "krw_bank", amount: "₩60,000" },
    { viewport: { width: 390, height: 844 }, source: "card_wallet", amount: "₩60,000" },
    { viewport: { width: 430, height: 932 }, source: "digital_dollar", amount: "US$44.44 → ₩60,000" },
  ] as const

  for (const { viewport, source, amount } of matrix) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await openTravelPass(page, "normal")
    const wallet = page.getByTestId("wallet-balance")
    await wallet.getByTestId("wallet-link-open").click()
    await connectWallet(page, "en")
    await expect(wallet).toHaveAttribute("data-wallet-state", "empty")

    await wallet.getByTestId("wallet-funding-primary").click()
    const funding = page.getByTestId("funding-source-sheet")
    await funding.locator(`input[type='radio'][value='${source}']`).check()
    await expect(funding.getByTestId("funding-provider-required")).toContainText("Not connected")
    await expect(funding.getByTestId("funding-method-save")).toBeDisabled()
    await funding.getByTestId("funding-sample-open").click()

    const sample = funding.getByTestId("funding-connected-sample")
    await expect(sample).toHaveAttribute("data-provider-route", source)
    await expect(sample).toContainText(amount)
    await expect(sample).toContainText("Sample only · no money moves")
    await expect(page).toHaveURL(/(?:\?|&)review=1(?:&|$)/)
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.review.flow.v1"))).toBe("1")
    await expectNoHorizontalOverflow(funding)
    await expectControls(funding)

    await sample.getByTestId("funding-sample-use").click()
    await expect(funding).toBeHidden()
    await expect(wallet).toHaveAttribute("data-wallet-state", "ready")
    await expect(wallet.getByTestId("wallet-display-equivalent")).toHaveText("₩60,000")
    await expect(wallet.getByTestId("wallet-test-balance")).toHaveText("≈ US$44.44")
    await expect(page.getByTestId("wallet-payment-method")).toHaveAttribute("data-funding-source", "travel_balance")
    expect((await storedDevice(page)).commerceFundingSource).toBe("travel_balance")

    const indicator = page.getByTestId("review-sample-indicator")
    const nav = page.getByTestId("ondo-main-nav")
    await expect(indicator).toBeVisible()
    const [indicatorBox, navBox] = await Promise.all([indicator.boundingBox(), nav.boundingBox()])
    expect(indicatorBox).not.toBeNull()
    expect(navBox).not.toBeNull()
    expect(indicatorBox!.y + indicatorBox!.height).toBeLessThanOrEqual(navBox!.y - 8)
    await context.close()
  }
})

test("FLOW8-CURRENCY-002 KRW and USD stay primary while funding rails and technical assets remain honest", async ({ page }) => {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  await page.goto(pathForExecutionLane("/", "review"), { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("nav-id")).toBeVisible()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
  const wallet = page.getByTestId("wallet-balance")
  await wallet.getByTestId("wallet-link-open").click()
  await connectWallet(page, "en")
  await expect(wallet.getByTestId("wallet-display-equivalent")).toHaveText("₩60,000")
  await expect(wallet.getByTestId("wallet-test-balance")).toHaveText("≈ US$44.44")
  await expect(wallet.locator('[data-status="ready"]')).toBeVisible()
  await expect(wallet.locator('[data-status="ready"]')).toHaveText("Ready")
  expect(await page.getByTestId("ondo-b-id-wallet-commerce").innerText()).not.toMatch(/OOKRW|USDC|USDT/)

  const methodCard = page.getByTestId("wallet-payment-method")
  await methodCard.getByRole("button", { name: "Change", exact: true }).click()
  const fundingSheet = page.getByTestId("funding-source-sheet")
  await expect(fundingSheet).toBeVisible()
  await page.setViewportSize({ width: 320, height: 720 })
  await expectNoHorizontalOverflow(fundingSheet)
  await expectControls(fundingSheet)
  await fundingSheet.screenshot({ path: `${ARTIFACT_DIR}/funding-sheet-320.png`, animations: "disabled", caret: "hide" })
  expect(await fundingSheet.innerText()).not.toMatch(/OOKRW|USDC|USDT/)
  await expect(fundingSheet).toContainText("Bank account")
  await expect(fundingSheet).toContainText("Card · Apple Pay")
  await expect(fundingSheet).toContainText("USD wallet")
  const bank = fundingSheet.locator("input[type='radio'][value='krw_bank']")
  const card = fundingSheet.locator("input[type='radio'][value='card_wallet']")
  const digitalDollar = fundingSheet.locator("input[type='radio'][value='digital_dollar']")
  await expect(bank).toBeEnabled()
  await expect(card).toBeEnabled()
  await expect(digitalDollar).toBeEnabled()
  await card.check()
  await expect(page.getByTestId("funding-provider-required")).toHaveAttribute("data-provider-route", "card_wallet")
  await expect(page.getByTestId("funding-provider-required")).toContainText("Not connected")
  await expect(fundingSheet.getByRole("button", { name: "Connection needed", exact: true })).toBeDisabled()
  await expectNoHorizontalOverflow(fundingSheet)
  await expectControls(fundingSheet)
  await fundingSheet.screenshot({ path: `${ARTIFACT_DIR}/funding-provider-required-320.png`, animations: "disabled", caret: "hide" })
  expect(await fundingSheet.innerText()).not.toMatch(/OOKRW|USDC|USDT/)
  await fundingSheet.getByText("Balance details", { exact: true }).click()
  await expect(fundingSheet).toContainText("OOKRW")
  await expect(fundingSheet).toContainText("USDC or USDT")
  await fundingSheet.locator("input[type='radio'][value='travel_balance']").check()
  await fundingSheet.getByRole("button", { name: "Use this method", exact: true }).click()
  await expect(methodCard).toHaveAttribute("data-funding-source", "travel_balance")
  await expect(methodCard.getByRole("button", { name: "Change", exact: true })).toBeFocused()
  await methodCard.screenshot({ path: `${ARTIFACT_DIR}/funding-method-320.png`, animations: "disabled" })

  const { offer } = await navigateToOfferFromExplore(page)
  await expect(offer.locator('[data-flow8-object="quote"]')).toContainText("₩22,000")
  await expect(offer.locator('[data-flow8-object="quote"]')).toContainText("US$16.30")
  await offer.getByTestId("benefit-accept").click()
  await expect(offer.locator('[data-flow8-object="quote"]')).toContainText("−₩3,000")
  await expect(offer.locator('[data-flow8-object="quote"]')).toContainText("₩19,000")
  await expect(offer.getByTestId("payment-confirm")).toContainText("₩19,000")
  expect(await offer.innerText()).not.toMatch(/OOKRW|USDC|USDT/)
  await offer.screenshot({ path: `${ARTIFACT_DIR}/checkout-krw-usd-320.png`, animations: "disabled", caret: "hide" })
  const details = offer.getByTestId("commerce-payment-details")
  await details.locator("summary").click()
  await expect(details).toContainText("OOKRW")
  await expect(details).toContainText("USDC or USDT")
  await expectNoHorizontalOverflow(offer)
  await offer.screenshot({ path: `${ARTIFACT_DIR}/checkout-technical-320.png`, animations: "disabled", caret: "hide" })
})

test("FLOW8-FUNDING-EXIT-019 tab ownership loss retains the exact funding sheet until its exit completes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openTravelPass(page, "review")
  const change = page.getByTestId("wallet-funding-change")
  await change.click()
  const sheet = page.getByTestId("funding-source-sheet")
  const layer = sheet.locator("..")
  await expect(layer).toHaveAttribute("data-funding-presence", "open")
  const subject = await sheet.getAttribute("data-funding-subject")
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden")

  const exitStartedAt = Date.now()
  await page.getByTestId("nav-ondo").evaluate((button: HTMLButtonElement) => button.click())
  await expect(layer).toHaveAttribute("data-funding-presence", "closing")
  await expect(sheet).toHaveAttribute("data-funding-subject", subject ?? "")
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden")
  const digitalDollar = sheet.locator("input[type='radio'][value='digital_dollar']")
  await digitalDollar.evaluate((input: HTMLInputElement) => input.click())
  await expect(digitalDollar).not.toBeChecked()
  await expect(sheet).toBeHidden()
  expect(Date.now() - exitStartedAt).toBeGreaterThanOrEqual(240)
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden")
  // The tab transition already claims focus for its new scroll destination;
  // the closing sheet must not steal that newer, valid destination.
  await expect.poll(() => page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null
    return active?.dataset.testid ?? `${active?.tagName ?? "none"}:${active?.getAttribute("aria-label") ?? "none"}`
  })).toBe("ondo-scroll-region")
})

test("FLOW8-FUNDING-EXIT-020 rapid reopen cancels the stale removal and reduced motion restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openTravelPass(page, "review")
  await page.getByTestId("wallet-funding-change").click()
  const sheet = page.getByTestId("funding-source-sheet")
  const layer = sheet.locator("..")
  const firstSubject = await sheet.getAttribute("data-funding-subject")

  await page.getByTestId("nav-ondo").evaluate((button: HTMLButtonElement) => button.click())
  await expect(layer).toHaveAttribute("data-funding-presence", "closing")
  await page.getByTestId("nav-id").evaluate((button: HTMLButtonElement) => button.click())
  const reopenedBy = page.getByTestId("wallet-funding-change")
  await reopenedBy.evaluate((button: HTMLButtonElement) => button.click())
  await expect(layer).toHaveAttribute("data-funding-presence", "open")
  await expect.poll(() => sheet.getAttribute("data-funding-subject")).not.toBe(firstSubject)
  await page.waitForTimeout(320)
  await expect(layer).toHaveAttribute("data-funding-presence", "open")

  await page.emulateMedia({ reducedMotion: "reduce" })
  await sheet.locator("header button").click()
  await expect(sheet).toBeHidden()
  await expect(reopenedBy).toBeFocused()
})

test("FLOW8-WALLET-002 disconnected, linking, failure, retry, and ready preserve one modal decision", async ({ page }) => {
  await openTravelPass(page, "review")
  await page.evaluate(() => { (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__ = { wallet: "failure" } })
  await page.getByTestId("wallet-link-open").click()
  let sheet = page.getByTestId("wallet-connect-sheet")
  await expect(sheet).toHaveAttribute("data-phase", "info")
  await sheet.getByRole("button", { name: COPY.en.connect, exact: true }).click()
  await expect(sheet).toHaveAttribute("data-phase", "linking")
  await expect(sheet).toHaveAttribute("aria-busy", "true")
  await expect(sheet).toHaveAttribute("data-phase", "failed")
  await expect(sheet.getByRole("alert")).toContainText("Local setup didn’t complete")
  await expect(sheet.getByRole("alert")).toContainText("Nothing changed. Try again without losing your place.")
  await expect(sheet.getByTestId("wallet-link-retry")).toHaveText(COPY.en.retry)
  await page.evaluate(() => { delete (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__ })
  await sheet.getByTestId("wallet-link-retry").click()
  await expect(sheet).toBeHidden()
  await expect(page.getByTestId("ondo-b-id-wallet-commerce")).toHaveAttribute("data-wallet", "ready")
  sheet = page.getByTestId("wallet-connect-sheet")
  await expect(sheet).toHaveCount(0)
})

test("FLOW8-OFFER-003 quote, benefit delta, consent, and one sticky payment decision stay coherent", async ({ page }) => {
  const { offer } = await openOffer(page, "normal", "en", undefined, false)
  await expect(offer).toHaveAttribute("data-visual-direction", "apple-wallet-flow8")
  await expect(offer.locator('[data-flow8-object="quote"]')).toBeVisible()
  const decision = offer.locator('[data-flow8-decision="payment"]')
  await expect(decision).toBeVisible()
  await offer.getByTestId("benefit-accept").click()
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "selected")
  await expect(offer.locator('[data-flow8-benefit-delta="applied"]')).toBeVisible()
  await offer.getByTestId("benefit-decline").click()
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "available")
  await expect(offer.getByTestId("payment-minimum-consent")).toHaveCount(0)
  await expect(decision).toContainText("A provider is required before funds can be added or used")
  await expectNoHorizontalOverflow(offer)
  await expectControls(offer)
})

test("FLOW8-MOBILE-015 320px keeps funding, consent recovery, and the payment decision in one legible journey", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  const { offer } = await openOffer(page, "review")

  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")

  const funding = offer.getByTestId("commerce-funding-source")
  await funding.getByRole("button", { name: "Change", exact: true }).click()
  const fundingSheet = page.getByTestId("funding-source-sheet")
  const fundingDone = fundingSheet.getByRole("button", { name: "Use this method", exact: true })
  await expect(fundingDone).toBeVisible()
  await fundingSheet.evaluate((element) => Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined))))
  const [sheetBox, doneBox] = await Promise.all([fundingSheet.boundingBox(), fundingDone.boundingBox()])
  expect(sheetBox).not.toBeNull()
  expect(doneBox).not.toBeNull()
  expect(doneBox!.y + doneBox!.height).toBeLessThanOrEqual(720)
  await fundingDone.click()

  const confirm = offer.getByTestId("payment-confirm")
  await confirm.click()
  const consent = offer.getByTestId("payment-minimum-consent")
  await expect(consent).toHaveAttribute("data-prompted", "true")
  await expect(consent.getByRole("alert")).toContainText("Review this one choice")
  await expect(consent.locator("input")).toBeFocused()
  const [consentBox, confirmBox] = await Promise.all([consent.boundingBox(), confirm.boundingBox()])
  expect(consentBox).not.toBeNull()
  expect(confirmBox).not.toBeNull()
  expect(consentBox!.y).toBeGreaterThanOrEqual(0)
  expect(consentBox!.y + consentBox!.height).toBeLessThanOrEqual(confirmBox!.y)
  await consent.locator("input").check()
  await expect(consent).toHaveAttribute("data-prompted", "false")
  await expectNoHorizontalOverflow(offer)
})

test("FLOW8-MOBILE-MATRIX-016 360, 390, and 430 keep EN and KO checkout decisions above the dock", async ({ browser }) => {
  const matrix = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ] as const
  mkdirSync("artifacts/qa/wave3-mobile-commerce", { recursive: true })

  for (const locale of ["en", "ko"] as const) {
    for (const viewport of matrix) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      const { offer } = await openOffer(page, "review", locale)
      await offer.getByTestId("benefit-accept").click()
      await offer.getByTestId("payment-confirm").click()
      await connectWallet(page, locale)

      const consent = offer.getByTestId("payment-minimum-consent")
      const confirm = offer.getByTestId("payment-confirm")
      const [consentBox, confirmBox] = await Promise.all([consent.boundingBox(), confirm.boundingBox()])
      expect(consentBox).not.toBeNull()
      expect(confirmBox).not.toBeNull()
      expect(consentBox!.y).toBeGreaterThanOrEqual(0)
      expect(consentBox!.y + consentBox!.height).toBeLessThanOrEqual(confirmBox!.y)
      expect(confirmBox!.y + confirmBox!.height).toBeLessThanOrEqual(viewport.height)
      await expectNoHorizontalOverflow(offer)
      await expectControls(offer)
      await offer.screenshot({
        path: `artifacts/qa/wave3-mobile-commerce/${locale}-${viewport.width}x${viewport.height}-checkout.png`,
        animations: "disabled",
        caret: "hide",
      })
      await context.close()
    }
  }
})

test("FLOW8-MOBILE-SHEET-017 wallet setup owns the visual viewport at narrow and low heights", async ({ browser }) => {
  const matrix: ReadonlyArray<{ locale: Locale; viewport: Viewport }> = [
    { locale: "en", viewport: { label: "320x568", width: 320, height: 568 } },
    { locale: "ko", viewport: { label: "360x640", width: 360, height: 640 } },
    { locale: "ja", viewport: { label: "390x667", width: 390, height: 667 } },
    { locale: "en", viewport: { label: "430x740", width: 430, height: 740 } },
    { locale: "ko", viewport: { label: "667x320", width: 667, height: 320 } },
    { locale: "ja", viewport: { label: "844x390", width: 844, height: 390 } },
    { locale: "en", viewport: { label: "1440x658", width: 1440, height: 658 } },
    { locale: "en", viewport: { label: "1440x1000", width: 1440, height: 1000 } },
  ]
  mkdirSync("artifacts/qa/wave4-mobile-close", { recursive: true })

  for (const { locale, viewport } of matrix) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await openTravelPass(page, "normal", locale)
    await page.getByTestId("wallet-link-open").click()
    const sheet = page.getByTestId("wallet-connect-sheet")
    const scroll = sheet.getByTestId("wallet-setup-scroll")
    const setup = sheet.getByRole("button", { name: COPY[locale].connect, exact: true })
    const cancel = sheet.getByRole("button", { name: COPY[locale].cancel, exact: true })
    await expect(sheet).toHaveAttribute("data-phase", "info")
    await sheet.evaluate((element) => Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined))))
    await expectContainedInViewport(sheet, viewport)
    await expectNoHorizontalOverflow(sheet)
    const overflow = await scroll.evaluate((element) => getComputedStyle(element).overflowY)
    expect(["auto", "scroll"]).toContain(overflow)
    await setup.scrollIntoViewIfNeeded()
    await cancel.scrollIntoViewIfNeeded()
    await expect(setup).toBeVisible()
    await expect(cancel).toBeVisible()
    await expectControls(sheet)
    if (viewport.width >= 700) {
      const floatingGeometry = await sheet.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return {
          bottom: rect.bottom,
          bottomLeftRadius: Number.parseFloat(style.borderBottomLeftRadius),
          bottomRightRadius: Number.parseFloat(style.borderBottomRightRadius),
        }
      })
      expect(floatingGeometry.bottom).toBeLessThan(viewport.height)
      expect(floatingGeometry.bottomLeftRadius).toBeGreaterThan(0)
      expect(floatingGeometry.bottomRightRadius).toBeGreaterThan(0)
    }
    await sheet.screenshot({
      path: `artifacts/qa/wave4-mobile-close/wallet-${locale}-${viewport.label}.png`,
      animations: "disabled",
      caret: "hide",
    })
    await context.close()
  }
})

test("FLOW8-JIT-GATE-018 checkout asks only for the next step and preserves exact return", async ({ browser }) => {
  const matrix: ReadonlyArray<{ locale: Locale; viewport: Viewport }> = [
    { locale: "en", viewport: { label: "320x568", width: 320, height: 568 } },
    { locale: "ko", viewport: { label: "390x844", width: 390, height: 844 } },
    { locale: "ja", viewport: { label: "430x932", width: 430, height: 932 } },
    { locale: "en", viewport: { label: "844x390", width: 844, height: 390 } },
  ]
  mkdirSync("artifacts/qa/wave4-mobile-close", { recursive: true })

  for (const { locale, viewport } of matrix) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const { offer, place } = await openOffer(page, "review", locale, undefined, false)
    await offer.getByTestId("benefit-accept").click()
    await offer.getByTestId("payment-confirm").click()
    await connectWallet(page, locale)
    await offer.getByTestId("payment-minimum-consent").locator("input").check()
    await offer.getByTestId("payment-confirm").click()

    const gate = page.getByTestId("ondo-b-action-gate")
    const dialog = gate.getByRole("dialog")
    await expect(gate).toHaveAttribute("data-active-gate", "account")
    await expect(dialog).toHaveAttribute("data-check-origin", "checkout")
    await expect(dialog).not.toContainText("Minimum check · this tab only")
    await expect(dialog).not.toContainText("Account comes first")
    await expect(dialog).not.toContainText("ON-DEVICE CHECK")
    await expect(dialog.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-venue", VENUE_ID)
    await expect(dialog.getByTestId("account-privacy-disclosure")).toBeVisible()
    await expectContainedInViewport(dialog, viewport)
    await expectNoHorizontalOverflow(dialog)
    await expectControls(dialog)
    await dialog.screenshot({
      path: `artifacts/qa/wave4-mobile-close/gate-${locale}-${viewport.label}.png`,
      animations: "disabled",
      caret: "hide",
    })

    await dialog.getByTestId("action-gate-confirm").click()
    await expect(gate).toHaveAttribute("data-active-gate", "payment_kyc")
    await expect(dialog.getByTestId("payment-privacy-disclosure")).toBeVisible()
    await expectContainedInViewport(dialog, viewport)
    await dialog.getByTestId("action-gate-confirm").click()
    await completeCheckoutCredentialPresentation(page)
    await expect(offer.getByTestId("payment-receipt")).toBeVisible()
    await offer.getByTestId("payment-receipt-return").click()
    await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
    await expect(place.getByTestId("canonical-meal-benefit-open")).toBeFocused()
    await context.close()
  }
})

test("FLOW8-RECOVERY-004 payment failure and insufficient balance retain retry and exact return", async ({ browser }) => {
  for (const outcome of ["failure", "insufficient"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const { offer, place } = await openOffer(page, "review", "en", { payment: outcome })
    await offer.getByTestId("benefit-accept").click()
    await offer.getByTestId("payment-confirm").click()
    await connectWallet(page, "en")
    await offer.getByTestId("payment-minimum-consent").locator("input").check()
    await offer.getByTestId("payment-confirm").click()
    await completeCheckoutCredentialPresentation(page)
    const recovery = offer.getByTestId("payment-recovery")
    await expect(recovery).toHaveAttribute("data-recovery", outcome)
    await expect(recovery.getByTestId("payment-retry")).toBeVisible()
    expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
    const recoveredGate = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null") as { pending?: { tokenId?: string } | null; lastConsumed?: { tokenId?: string } | null } | null, ACTION_GATE_KEY)
    const recoveredToken = recoveredGate?.pending?.tokenId
    expect(recoveredToken).toEqual(expect.any(String))
    expect(recoveredGate?.lastConsumed ?? null).toBeNull()
    await recovery.getByTestId("payment-retry").click()
    await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "selected")
    await offer.getByTestId("payment-cancel").click()
    await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
    await expect(place.getByTestId("canonical-meal-benefit-open")).toBeFocused()
    await place.getByTestId("canonical-meal-benefit-open").click()
    const retryOffer = commerceOffer(page)
    const reopenedGate = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null") as { pending?: { tokenId?: string } | null } | null, ACTION_GATE_KEY)
    expect(reopenedGate?.pending?.tokenId).toBe(recoveredToken)
    await retryOffer.getByTestId("payment-minimum-consent").locator("input").check()
    await retryOffer.getByTestId("payment-confirm").click()
    await expect(retryOffer.getByTestId("payment-receipt")).toBeVisible()
    const completedGate = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null") as { pending?: unknown; lastConsumed?: unknown } | null, ACTION_GATE_KEY)
    expect(completedGate?.pending ?? null).toBeNull()
    expect(completedGate?.lastConsumed ?? null).toBeNull()
    await context.close()
  }
})

test("FLOW8-POLICY-005 eligibility, minimum, and expiry are full non-payment recovery states", async ({ browser }) => {
  for (const policy of ["ineligible", "below_minimum", "expired"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const { offer } = await openOffer(page, "review", "en", { benefit: policy })
    await expect(offer).toHaveAttribute("data-benefit-policy", policy)
    const recovery = offer.getByTestId("commerce-benefit-recovery")
    await expect(recovery).toBeVisible()
    await expect(recovery.getByRole("button")).toHaveCount(1)
    await expect(offer.getByTestId("payment-confirm")).toHaveCount(0)
    await context.close()
  }
})

test("FLOW8-COMPLETE-006 payment, refund, current-session activity, exact Place return, and reload quarantine form one honest journey", async ({ page }) => {
  const { offer, place } = await openOffer(page, "normal")
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  await connectWallet(page, "en")
  await addConnectedFundingSample(page, offer)
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  const paymentGate = page.getByTestId("ondo-b-action-gate")
  await expect(paymentGate).toHaveAttribute("data-active-gate", "payment_kyc")
  await paymentGate.getByTestId("action-gate-confirm").click()
  await expect(paymentGate).toHaveAttribute("data-gate-view", /^(processing|success)$/)
  await completeCheckoutCredentialPresentation(page)
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toHaveAttribute("data-completion-kind", "receipt")
  await expect(receipt).toContainText("ONDO-LOCAL-20260825-001")
  const settlement = receipt.getByTestId("commerce-settlement-details")
  await settlement.locator("summary").click()
  await expect(settlement.getByTestId("commerce-operation-id")).toContainText("ONDO-LOCAL-OP-20260825-001")
  await expect(settlement.getByTestId("commerce-holder-delta")).toContainText("−19 OOKRW")
  await expect(settlement.getByTestId("commerce-merchant-delta")).toContainText("+19 OOKRW")
  await expect(settlement.getByTestId("commerce-settlement-total")).toContainText("0 OOKRW")
  await receipt.getByTestId("commerce-refund-details").locator("summary").click()
  await receipt.getByTestId("payment-refund").evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
  await expect(receipt).toContainText("ONDO-LOCAL-REFUND-20260825-001")
  const refundSettlement = receipt.getByTestId("commerce-settlement-details")
  await refundSettlement.locator("summary").click()
  await expect(refundSettlement.getByTestId("commerce-operation-id")).toContainText("ONDO-LOCAL-REFUND-20260825-001")
  await expect(refundSettlement.getByTestId("commerce-holder-delta")).toContainText("+19 OOKRW")
  await expect(refundSettlement.getByTestId("commerce-merchant-delta")).toContainText("−19 OOKRW")
  await expect(refundSettlement.getByTestId("commerce-settlement-total")).toContainText("0 OOKRW")
  await receipt.getByTestId("payment-receipt-return").click()
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.history.state))).toContain(VENUE_ID)
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await place.locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-activity-receipt")).toContainText("ONDO-LOCAL-REFUND-20260825-001")
  await page.getByTestId("nav-my").click({ force: true })
  await expect(page.getByTestId("my-korea-receipts")).toContainText("ONDO-LOCAL-REFUND-20260825-001")
  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-balance")).toHaveAttribute("data-wallet-state", "disconnected")
  await expect(page.getByTestId("wallet-activity-receipt")).toHaveCount(0)
  await expect(page.locator('[data-testid*="outcome"], [data-testid*="ledger"]')).toHaveCount(0)
  await expect(page.getByTestId("wallet-benefit")).toContainText("Available")
  await expect(page.getByTestId("wallet-benefit")).toContainText("₩3,000 off")
  await page.getByTestId("nav-my").click({ force: true })
  await expect(page.getByTestId("my-korea-receipts")).toHaveCount(0)
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
})

for (const receiptStatus of ["paid", "refunded"] as const) {
  test(`FLOW8-VENUE-014 a stored ${receiptStatus} review fixture is quarantined and cannot appear at another Place`, async ({ page }) => {
    await seed(page, "en", receiptStatus)
    await page.goto(pathForExecutionLane(`/?city=seoul&view=list&venueId=${SECOND_VENUE_ID}&detail=1`, "normal"), { waitUntil: "domcontentloaded" })
    await waitForShell(page)
    const secondPlace = page.getByTestId("canonical-place-overlay")
    await expect(secondPlace).toHaveAttribute("data-venue-id", SECOND_VENUE_ID)
    await expect(secondPlace.getByTestId("canonical-meal-benefit-open")).toHaveCount(0)
    expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])

    await secondPlace.locator("header button").last().click()
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("wallet-balance")).toHaveAttribute("data-wallet-state", "disconnected")
    await expect(page.getByTestId("wallet-activity-receipt")).toHaveCount(0)
  })
}

test("FLOW8-DURABLE-007 payment and refund do not visually complete before device persistence succeeds", async ({ page }) => {
  const { offer } = await openOffer(page, "review")
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await page.evaluate(() => {
    const target = window as Window & { __ONDO_B_QA__?: Flow8Qa }
    target.__ONDO_B_QA__ = { ...(target.__ONDO_B_QA__ ?? {}), holdProcessing: true }
  })
  await offer.getByTestId("payment-confirm").click()
  await completeCheckoutCredentialPresentation(page)
  await expect(offer.getByTestId("payment-processing")).toBeVisible()
  const heldGate = await page.evaluate((key) => {
    const session = JSON.parse(sessionStorage.getItem(key) ?? "null") as { pending?: { tokenId?: string } | null; lastConsumed?: { tokenId?: string } | null } | null
    return { pending: session?.pending ?? null, tokenId: session?.lastConsumed?.tokenId ?? null }
  }, ACTION_GATE_KEY)
  // A held provider frame is still pre-mutation: the exact gate remains
  // pending and no consumed authority is published ahead of durable success.
  const pendingToken = heldGate.pending?.tokenId
  expect(pendingToken).toEqual(expect.any(String))
  expect(heldGate.tokenId).toBeNull()
  await installOneShotDeviceWriteFailure(page)
  await page.evaluate(() => {
    const target = window as Window & { __ONDO_B_QA__?: Flow8Qa }
    if (target.__ONDO_B_QA__) target.__ONDO_B_QA__.holdProcessing = false
    window.dispatchEvent(new Event("ondo-b-flow8-release-payment"))
  })
  await expect(offer.getByTestId("payment-receipt")).toHaveCount(0)
  await expect(offer.getByTestId("commerce-storage-error")).toBeVisible()
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
  const restoredGate = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null") as { pending?: { tokenId?: string } | null; lastConsumed?: { tokenId?: string } | null } | null, ACTION_GATE_KEY)
  expect(restoredGate?.pending?.tokenId).toBe(pendingToken)
  expect(restoredGate?.lastConsumed ?? null).toBeNull()
  await offer.getByTestId("payment-retry").click()
  await offer.getByTestId("payment-confirm").click()
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toBeVisible()
  const finalizedGate = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null") as { pending?: unknown; lastConsumed?: unknown } | null, ACTION_GATE_KEY)
  expect(finalizedGate?.pending ?? null).toBeNull()
  expect(finalizedGate?.lastConsumed ?? null).toBeNull()
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])

  await receipt.getByTestId("commerce-refund-details").locator("summary").click()
  await installOneShotDeviceWriteFailure(page)
  await receipt.getByTestId("payment-refund").click()
  await expect(receipt).toHaveAttribute("data-completion-kind", "receipt")
  await expect(receipt.getByTestId("commerce-storage-error")).toBeVisible()
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
  await receipt.getByTestId("payment-refund").click()
  await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  const restoredPlace = page.getByTestId("canonical-place-overlay")
  await expect(restoredPlace).toHaveAttribute("data-venue-id", VENUE_ID)
  await restoredPlace.locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-balance")).toHaveAttribute("data-wallet-state", "disconnected")
  await expect(page.getByTestId("wallet-activity-receipt")).toHaveCount(0)
})

test("FLOW8-CANCEL-008 Escape during processing cancels pending confirmation and preserves the exact Place retry", async ({ page }) => {
  const { offer, place } = await openOffer(page, "review")
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  await completeCheckoutCredentialPresentation(page)
  await expect(offer.getByTestId("payment-processing")).toBeVisible()
  const processingGate = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null") as { pending?: { tokenId?: string } | null; lastConsumed?: { tokenId?: string } | null } | null, ACTION_GATE_KEY)
  const processingToken = processingGate?.pending?.tokenId
  expect(processingToken).toEqual(expect.any(String))
  expect(processingGate?.lastConsumed ?? null).toBeNull()
  await page.keyboard.press("Escape")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect(place.getByTestId("canonical-meal-benefit-open")).toBeFocused()
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
  const cancelledGate = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "null") as { pending?: { tokenId?: string } | null; lastConsumed?: unknown } | null, ACTION_GATE_KEY)
  expect(cancelledGate?.pending?.tokenId).toBe(processingToken)
  expect(cancelledGate?.lastConsumed ?? null).toBeNull()
  await place.getByTestId("canonical-meal-benefit-open").click()
  const reopened = commerceOffer(page)
  await expect(reopened).toHaveAttribute("data-payment-state", "review")
  await reopened.getByTestId("benefit-decline").click()
  await expect(reopened.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "available")
  await reopened.getByTestId("benefit-accept").click()
  await reopened.getByTestId("payment-minimum-consent").locator("input").check()
  await reopened.getByTestId("payment-confirm").click()
  await expect(reopened.getByTestId("payment-receipt")).toBeVisible()
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
})

test("FLOW8-PROCESSING-014 visual evidence can hold the session-only processing frame without changing normal payment", async ({ page }) => {
  const { offer } = await openOffer(page, "review")
  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await setCaptureQa(page, { holdProcessing: true })
  await offer.getByTestId("payment-confirm").click()
  const paymentGate = page.getByTestId("ondo-b-action-gate")
  await expect(paymentGate).toHaveAttribute("data-active-gate", "payment_kyc")
  await paymentGate.getByTestId("action-gate-confirm").click()
  await expect(offer.getByTestId("payment-processing")).toBeVisible()
  await page.waitForTimeout(650)
  await expect(offer.getByTestId("payment-processing")).toBeVisible()
  await expect(offer.getByTestId("payment-receipt")).toHaveCount(0)
  await page.evaluate(() => {
    delete (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__
    window.dispatchEvent(new Event("ondo-b-flow8-release-payment"))
  })
  await expect(offer.getByTestId("payment-receipt")).toBeVisible()
})

test("FLOW8-INDEPENDENCE-009 Account and its 19+ session remain distinct from document-only identity, Wallet, and payment review snapshots", async ({ page }) => {
  await openTravelPass(page, "review")
  const account = page.getByTestId("traveler-id-account")
  const person = page.getByTestId("traveler-id-person")
  const age = page.getByTestId("traveler-id-age")
  const payment = page.getByTestId("traveler-id-payment")
  await expect(account).toHaveAttribute("data-status", "guest")
  await expect(person).toHaveAttribute("data-status", "none")
  await expect(age).toHaveAttribute("data-status", "none")
  await expect(payment).toHaveAttribute("data-status", "none")

  await person.getByRole("button").click()
  let gate = page.getByTestId("ondo-b-local-check-walkthrough")
  await gate.getByTestId("direct-person-account-continue").click()
  await gate.getByTestId("direct-person-route-mobile-id").click()
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(person).toHaveAttribute("data-status", "success")
  await expect(age).toHaveAttribute("data-status", "none")
  await expect(payment).toHaveAttribute("data-status", "none")

  await age.getByRole("button").click()
  gate = page.getByTestId("ondo-b-local-check-walkthrough")
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(person).toHaveAttribute("data-status", "success")
  await expect(age).toHaveAttribute("data-status", "success")
  await expect(payment).toHaveAttribute("data-status", "none")

  await page.getByTestId("wallet-link-open").click()
  await connectWallet(page, "en")
  await expect(person).toHaveAttribute("data-status", "success")
  await expect(age).toHaveAttribute("data-status", "success")
  await expect(payment).toHaveAttribute("data-status", "none")

  const { offer, place } = await navigateToOfferFromExplore(page)
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  const paymentGate = page.getByTestId("ondo-b-action-gate")
  await paymentGate.getByTestId("action-gate-confirm").click()
  await completeCheckoutCredentialPresentation(page)
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toBeVisible()
  await receipt.getByTestId("commerce-refund-details").locator("summary").click()
  await receipt.getByTestId("payment-refund").click()
  await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
  await receipt.getByTestId("payment-receipt-return").click()
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await place.locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("traveler-id-account")).toHaveAttribute("data-status", "active")
  await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "success")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-status", "success")
  await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "success")
  await expect(page.getByTestId("wallet-balance")).toHaveAttribute("data-wallet-state", "ready")
  await expect(page.getByTestId("wallet-activity-receipt")).toContainText("ONDO-LOCAL-REFUND-20260825-001")

  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("traveler-id-account")).toHaveAttribute("data-status", "active")
  // Person and Payment review fixtures prove this document only; reload drops
  // their in-memory authority. An Account-bound 19+ predicate intentionally
  // remains in this browser-tab session and stays visibly marked as review.
  await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-status", "success")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-review-result", "true")
  await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("wallet-balance")).toHaveAttribute("data-wallet-state", "disconnected")
  await expect(page.getByTestId("wallet-activity-receipt")).toHaveCount(0)
})

test("FLOW8-TRUTH-010 every locale moves non-live truth into setup and commerce actions contact no external service", async ({ browser }) => {
  const setupTruth = {
    en: /no money or digital asset moves/i,
    ko: /실제 금액이나 디지털 자산은 이동하지 않습니다/,
    ja: /実際のお金やデジタル資産は移動しません/,
  } as const
  const providerTruth = {
    en: { label: "Venue orderNot placed", body: "This records only the change to your travel balance." },
    ko: { label: "매장 주문접수되지 않음", body: "여행 잔액의 변화만 기록합니다." },
    ja: { label: "店舗への注文未送信", body: "旅の残高の変化だけを記録します。" },
  } as const
  for (const locale of ["en", "ko", "ja"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const pass = await openTravelPass(page, "review", locale)
    await expect(pass.getByTestId("travel-pass-local-boundary")).toBeVisible()
    await expect(page.getByTestId("wallet-non-live-boundary")).toHaveCount(0)
    const external: string[] = []
    page.on("request", (request) => {
      const url = request.url()
      if (["fetch", "xhr", "websocket"].includes(request.resourceType())
        && !url.startsWith("http://127.0.0.1")
        && !url.startsWith("https://tiles.openfreemap.org/")) external.push(url)
    })
    await page.getByTestId("wallet-link-open").click()
    await expect(page.getByTestId("wallet-connect-sheet")).toContainText(setupTruth[locale])
    await connectWallet(page, locale)
    const { offer } = await navigateToOfferFromExplore(page)
    await offer.getByTestId("commerce-payment-details").locator("summary").click()
    await expect(offer.getByTestId("commerce-provider-boundary")).toContainText(providerTruth[locale].body)
    await offer.getByTestId("benefit-accept").click()
    await offer.getByTestId("payment-minimum-consent").locator("input").check()
    await offer.getByTestId("payment-confirm").click()
    const paymentGate = page.getByTestId("ondo-b-action-gate")
    await expect(paymentGate).toHaveAttribute("data-active-gate", "account")
    await paymentGate.getByTestId("action-gate-confirm").click()
    await expect(paymentGate).toHaveAttribute("data-active-gate", "payment_kyc")
    await paymentGate.getByTestId("action-gate-confirm").click()
    await completeCheckoutCredentialPresentation(page)
    const receipt = offer.getByTestId("payment-receipt")
    await expect(receipt).toBeVisible()
    await expect(receipt.getByTestId("commerce-provider-status")).toHaveAttribute("data-provider-order", "NOT_CONNECTED")
    await expect(receipt.getByTestId("commerce-provider-status")).toHaveText(providerTruth[locale].label)
    await receipt.getByTestId("commerce-refund-details").locator("summary").click()
    await receipt.getByTestId("payment-refund").click()
    await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
    expect(external).toEqual([])
    const stored = JSON.stringify(await storedDevice(page))
    for (const forbidden of ["walletAddress", "credential", "identity", "address", "rawClaim"]) expect(stored).not.toContain(forbidden)
    await context.close()
  }
})

test("FLOW8-RETURN-011 current-session Wallet and My Korea receipt actions return to the exact Place", async ({ page }) => {
  const { offer } = await openOffer(page, "normal")
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")
  await addConnectedFundingSample(page, offer)
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  await completeCheckoutCredentialPresentation(page)
  const receipt = offer.getByTestId("payment-receipt")
  await receipt.getByTestId("commerce-refund-details").locator("summary").click()
  await receipt.getByTestId("payment-refund").click()
  await receipt.getByTestId("payment-receipt-return").click()
  await page.getByTestId("canonical-place-overlay").locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  const activity = page.getByTestId("wallet-activity-receipt")
  await activity.locator("summary").click()
  await activity.getByTestId("wallet-activity-place").click()
  let place = page.getByTestId("canonical-place-peek")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect.poll(() => place.evaluate((root) => root.contains(document.activeElement))).toBe(true)
  await page.keyboard.press("Escape")
  await page.getByTestId("nav-my").click()
  await page.getByTestId("my-korea-receipt-place").click()
  place = page.getByTestId("canonical-place-peek")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect.poll(() => place.evaluate((root) => root.contains(document.activeElement))).toBe(true)
})

test("FLOW8-DECLINED-012 declined benefit keeps 22 → 38, refunds to 60, and reload quarantines the review result", async ({ page }) => {
  const { offer } = await openOffer(page, "review")
  await offer.getByTestId("benefit-decline").click()
  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  const paymentGate = page.getByTestId("ondo-b-action-gate")
  await expect(paymentGate).toHaveAttribute("data-active-gate", "payment_kyc")
  await paymentGate.getByTestId("action-gate-confirm").click()
  await expect(paymentGate).toHaveAttribute("data-gate-view", /^(processing|success)$/)
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toContainText(/Amount\s*₩22,000/)
  await expect(receipt).toContainText(/ONDO benefit\s*₩0/)
  await expect(receipt).toContainText(/Balance left\s*₩38,000/)
  await expect(receipt.getByTestId("commerce-settlement-details")).toContainText("22 OOKRW")
  await expect(receipt.getByTestId("commerce-settlement-details")).toContainText("0 OOKRW")
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
  await receipt.getByTestId("commerce-refund-details").locator("summary").click()
  await receipt.getByTestId("payment-refund").evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  const restoredPlace = page.getByTestId("canonical-place-overlay")
  await expect(restoredPlace).toHaveAttribute("data-venue-id", VENUE_ID)
  await restoredPlace.locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-balance")).toHaveAttribute("data-wallet-state", "disconnected")
  await expect(page.getByTestId("wallet-activity-receipt")).toHaveCount(0)
  await expect(page.getByTestId("wallet-benefit")).toContainText("Available")
})

test("FLOW8-FIRSTVIEW-013 compact Wallet, offer choice, venue truth, and recovery remain complete decisions", async ({ browser }) => {
  const mobile = await browser.newContext({ viewport: { width: 320, height: 720 } })
  const page = await mobile.newPage()
  await openTravelPass(page, "review")
  const wallet = page.getByTestId("wallet-balance")
  await wallet.scrollIntoViewIfNeeded()
  const prepare = page.getByTestId("wallet-link-open")
  const dock = page.getByTestId("ondo-main-nav")
  const [walletBox, prepareBox, dockBox] = await Promise.all([wallet.boundingBox(), prepare.boundingBox(), dock.boundingBox()])
  expect(walletBox).not.toBeNull()
  expect(prepareBox).not.toBeNull()
  expect(dockBox).not.toBeNull()
  expect(prepareBox!.y).toBeGreaterThanOrEqual(walletBox!.y)
  expect(prepareBox!.y + prepareBox!.height).toBeLessThanOrEqual(walletBox!.y + walletBox!.height + 1)
  expect(prepareBox!.y + prepareBox!.height).toBeLessThanOrEqual(dockBox!.y - 8)
  expect(await prepare.evaluate((button) => {
    const rect = button.getBoundingClientRect()
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("button") === button
  })).toBe(true)
  await prepare.click()
  await connectWallet(page, "en")
  const { offer } = await navigateToOfferFromExplore(page)
  const venueBoundary = offer.getByTestId("commerce-venue-test-boundary")
  await expect(venueBoundary).toBeHidden()
  await offer.getByTestId("commerce-payment-details").locator("summary").click()
  await expect(venueBoundary).toBeVisible()
  const venueBoundaryBox = await venueBoundary.boundingBox()
  expect(venueBoundaryBox).not.toBeNull()
  expect(venueBoundaryBox!.height).toBeLessThanOrEqual(96)
  expect(await venueBoundary.evaluate((node) => ({
    align: getComputedStyle(node).textAlign,
    size: Number.parseFloat(getComputedStyle(node).fontSize),
  }))).toEqual({ align: "start", size: 12 })
  const benefitChoice = await offer.getByTestId("benefit-accept").boundingBox()
  expect(benefitChoice).not.toBeNull()
  expect(benefitChoice!.y + benefitChoice!.height).toBeLessThanOrEqual(720 - 96)
  await mobile.close()

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const desktopPage = await desktop.newPage()
  const { offer: recoveryOffer } = await openOffer(desktopPage, "review", "en", { benefit: "ineligible" })
  const recovery = recoveryOffer.getByTestId("commerce-benefit-recovery")
  const recoveryBox = await recovery.boundingBox()
  expect(recoveryBox).not.toBeNull()
  expect(recoveryBox!.height).toBeLessThanOrEqual(420)
  await desktop.close()
})

for (const locale of ["en", "ko", "ja"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`FLOW8-CAPTURE-POLISH ${locale} ${viewport.label} venue truth and deterministic processing`, async ({ page }) => {
      test.skip(process.env.ONDO_FLOW8_CAPTURE !== "1", "Run after PRODUCT seal with ONDO_FLOW8_CAPTURE=1")
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await seed(page, locale, "none", true)
      await page.goto(pathForExecutionLane("/", "review"), { waitUntil: "domcontentloaded" })
      await waitForShell(page)
      const { offer } = await navigateToOfferFromExplore(page)
      await quietCapture(page, `${locale}-${viewport.label}-offer-recommended`)
      await offer.getByTestId("payment-confirm").click()
      await connectWallet(page, locale)
      await offer.getByTestId("payment-minimum-consent").locator("input").check()
      await setCaptureQa(page, { holdProcessing: true })
      await offer.getByTestId("payment-confirm").click()
      await expect(offer.getByTestId("payment-processing")).toBeVisible()
      await processingCapture(page, `${locale}-${viewport.label}-payment-processing`)
      await expect(offer.getByTestId("payment-processing")).toBeVisible()
    })

    test(`FLOW8-CAPTURE-SUCCESSOR ${locale} ${viewport.label} paid and declined evidence`, async ({ page }) => {
      test.skip(process.env.ONDO_FLOW8_CAPTURE !== "1", "Run after PRODUCT seal with ONDO_FLOW8_CAPTURE=1")
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await openTravelPass(page, "review", locale, "paid")
      await page.getByTestId("wallet-activity-receipt").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-wallet-activity-paid`)
      await page.getByTestId("nav-my").click()
      await page.getByTestId("my-korea-receipts").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-my-korea-paid`)

      await resetCaptureDevice(page, locale, "review")
      const { offer } = await navigateToOfferFromExplore(page)
      await offer.getByTestId("benefit-decline").click()
      await quietCapture(page, `${locale}-${viewport.label}-offer-benefit-declined`)
    })
  }
}

for (const locale of ["en", "ko", "ja"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`FLOW8-CAPTURE ${locale} ${viewport.label} complete state matrix`, async ({ page }) => {
      test.skip(process.env.ONDO_FLOW8_CAPTURE !== "1", "Run after PRODUCT seal with ONDO_FLOW8_CAPTURE=1")
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await openTravelPass(page, "review", locale, "none", true)
      await quietCapture(page, `${locale}-${viewport.label}-travel-pass-disconnected`)
      await page.getByTestId("wallet-link-open").click()
      let sheet = page.getByTestId("wallet-connect-sheet")
      await quietCapture(page, `${locale}-${viewport.label}-wallet-link-info`)
      await page.evaluate(() => { (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__ = { wallet: "failure" } })
      await sheet.getByRole("button", { name: COPY[locale].connect, exact: true }).click()
      await expect(sheet).toHaveAttribute("data-phase", "failed")
      await quietCapture(page, `${locale}-${viewport.label}-wallet-link-failure`)
      await page.evaluate(() => { delete (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__ })
      await sheet.getByTestId("wallet-link-retry").click()
      await expect(sheet).toBeHidden()
      await quietCapture(page, `${locale}-${viewport.label}-wallet-ready`)

      let { offer, place } = await navigateToOfferFromExplore(page)
      await quietCapture(page, `${locale}-${viewport.label}-offer-recommended`)
      await offer.getByTestId("benefit-accept").click()
      await quietCapture(page, `${locale}-${viewport.label}-offer-benefit-accepted`)
      const consentInput = offer.getByTestId("payment-minimum-consent").locator("input")
      await consentInput.check()
      await quietCapture(page, `${locale}-${viewport.label}-offer-consented`)

      await setCaptureQa(page, { payment: "failure" })
      await offer.getByTestId("payment-confirm").click()
      await completeCheckoutCredentialPresentation(page)
      await expect(offer).toHaveAttribute("data-payment-state", "failure")
      await quietCapture(page, `${locale}-${viewport.label}-payment-failure`)
      await offer.getByTestId("payment-retry").click()

      await setCaptureQa(page, { payment: "insufficient" })
      await offer.getByTestId("payment-confirm").click()
      await expect(offer).toHaveAttribute("data-payment-state", "insufficient")
      await quietCapture(page, `${locale}-${viewport.label}-payment-insufficient`)
      await offer.getByTestId("payment-retry").click()

      await setCaptureQa(page)
      await installOneShotDeviceWriteFailure(page)
      await offer.getByTestId("payment-confirm").click()
      await expect(offer.getByTestId("commerce-storage-error")).toBeVisible()
      await quietCapture(page, `${locale}-${viewport.label}-payment-storage-error`)
      await offer.getByTestId("payment-retry").click()

      for (const policy of ["ineligible", "below_minimum", "expired"] as const) {
        await offer.getByTestId("commerce-origin-return").click()
        await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
        await setCaptureQa(page, { benefit: policy })
        await place.getByTestId("canonical-meal-benefit-open").click()
        offer = commerceOffer(page)
        await expect(offer).toHaveAttribute("data-benefit-policy", policy)
        await quietCapture(page, `${locale}-${viewport.label}-policy-${policy}`)
      }

      await offer.getByTestId("commerce-origin-return").click()
      await setCaptureQa(page)
      await place.getByTestId("canonical-meal-benefit-open").click()
      offer = commerceOffer(page)
      await offer.getByTestId("payment-minimum-consent").locator("input").check()
      await setCaptureQa(page, { holdProcessing: true })
      await offer.getByTestId("payment-confirm").click()
      await expect(offer.getByTestId("payment-processing")).toBeVisible()
      await processingCapture(page, `${locale}-${viewport.label}-payment-processing`)
      await expect(offer.getByTestId("payment-processing")).toBeVisible()
      await page.evaluate(() => {
        delete (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__
        window.dispatchEvent(new Event("ondo-b-flow8-release-payment"))
      })
      await expect(offer.getByTestId("payment-receipt")).toBeVisible()
      await quietCapture(page, `${locale}-${viewport.label}-receipt`)

      const receipt = offer.getByTestId("payment-receipt")
      await receipt.getByTestId("commerce-refund-details").locator("summary").click()
      await installOneShotDeviceWriteFailure(page)
      await receipt.getByTestId("payment-refund").click()
      await expect(receipt.getByTestId("commerce-storage-error")).toBeVisible()
      await receipt.getByTestId("payment-refund").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-refund-storage-error`)
      await offer.getByTestId("payment-refund").click()
      await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
      await quietCapture(page, `${locale}-${viewport.label}-refund`)
      await offer.getByTestId("payment-receipt-return").click()
      await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
      await quietCapture(page, `${locale}-${viewport.label}-exact-place-return`)
      await page.reload({ waitUntil: "domcontentloaded" })
      await waitForShell(page)
      place = page.getByTestId("canonical-place-overlay")
      await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
      await place.locator("header button").last().click()
      await page.getByTestId("nav-id").click()
      await page.getByTestId("wallet-activity").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-wallet-activity-reload`)
      await page.getByTestId("nav-my").click()
      await page.getByTestId("my-korea-receipts").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-my-korea-refund`)

      await resetCaptureDevice(page, locale, "review")
      ;({ offer } = await navigateToOfferFromExplore(page))
      await offer.getByTestId("benefit-decline").click()
      await offer.getByTestId("payment-confirm").click()
      await connectWallet(page, locale)
      await offer.getByTestId("payment-minimum-consent").locator("input").check()
      await offer.getByTestId("payment-confirm").click()
      await expect(offer.getByTestId("payment-receipt")).toBeVisible()
      await quietCapture(page, `${locale}-${viewport.label}-receipt-benefit-declined`)
    })
  }
}
