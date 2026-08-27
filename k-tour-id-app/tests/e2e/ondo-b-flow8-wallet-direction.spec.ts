import { mkdirSync } from "node:fs"
import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const ARTIFACT_DIR = "artifacts/qa/flow8-wallet"

type Locale = "en" | "ko" | "ja"
type Viewport = { label: string; width: number; height: number }
type BenefitQa = "ineligible" | "below_minimum" | "expired"
type Flow8Qa = { wallet?: "failure"; payment?: "failure" | "insufficient"; benefit?: BenefitQa }

const VIEWPORTS: readonly Viewport[] = [
  { label: "320x720", width: 320, height: 720 },
  { label: "390x844", width: 390, height: 844 },
  { label: "844x390", width: 844, height: 390 },
  { label: "1440x1000", width: 1440, height: 1000 },
]

const COPY = {
  en: { connect: "Prepare test wallet", retry: "Try preparation again", refund: "Request test refund" },
  ko: { connect: "테스트 지갑 준비", retry: "다시 준비", refund: "테스트 환불 요청" },
  ja: { connect: "テストウォレットを準備", retry: "もう一度準備", refund: "テスト返金をリクエスト" },
} as const

test.describe.configure({ timeout: 180_000, mode: "serial" })

async function seed(page: Page, locale: Locale = "en", receipts: "none" | "paid" | "refunded" = "none") {
  await page.addInitScript(({ key, language, venueId, receiptState }) => {
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
  }, { key: DEVICE_KEY, language: locale, venueId: VENUE_ID, receiptState: receipts })
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

async function openTravelPass(page: Page, locale: Locale = "en", receipts: "none" | "paid" | "refunded" = "none") {
  await seed(page, locale, receipts)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await page.getByTestId("nav-id").click()
  const pass = page.getByTestId("ondo-b-traveler-id")
  await expect(pass).toBeVisible()
  return pass
}

async function openOffer(page: Page, locale: Locale = "en", qa?: { wallet?: "failure"; payment?: "failure" | "insufficient"; benefit?: BenefitQa }) {
  await seed(page, locale)
  if (qa) await page.addInitScript((injected) => { (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__ = injected }, qa)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await page.locator("[data-city='seoul']").click()
  const toggle = page.getByTestId("ondo-b-view-toggle")
  if (await toggle.count()) await toggle.click()
  const venueButton = page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${VENUE_ID}'] button`)
  await venueButton.scrollIntoViewIfNeeded()
  await venueButton.click()
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  const benefitButton = place.getByTestId("canonical-meal-benefit-open")
  await benefitButton.scrollIntoViewIfNeeded()
  await benefitButton.click()
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
  await expect(offer).toHaveAttribute("data-origin-venue-id", VENUE_ID)
  return { offer, place }
}

async function connectWallet(page: Page, locale: Locale) {
  const sheet = page.getByTestId("wallet-connect-sheet")
  await expect(sheet).toBeVisible()
  await sheet.getByRole("button", { name: COPY[locale].connect, exact: true }).click()
  await expect(sheet).toBeHidden()
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
  await expect(page.getByTestId("payment-processing")).toBeVisible()
}

async function navigateToOfferFromExplore(page: Page) {
  await page.getByTestId("nav-ondo").click()
  await page.locator("[data-city='seoul']").click()
  const toggle = page.getByTestId("ondo-b-view-toggle")
  if (await toggle.count()) await toggle.click()
  const venueButton = page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${VENUE_ID}'] button`)
  await venueButton.scrollIntoViewIfNeeded()
  await venueButton.click()
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  const benefitButton = place.getByTestId("canonical-meal-benefit-open")
  await benefitButton.scrollIntoViewIfNeeded()
  await benefitButton.click()
  const offer = page.getByTestId("ondo-b-id-wallet-commerce")
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

async function resetCaptureDevice(page: Page, locale: Locale) {
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
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
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
    commerceReceipts?: Array<{ status?: string; paidOOKRW?: number; benefitOOKRW?: number; balanceOOKRW?: number }>
  }, DEVICE_KEY)
}

test("FLOW8-VIS-001 Pass and Wallet read as two tactile objects in the first useful frame", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const pass = await openTravelPass(page)
  await expect(pass).toHaveAttribute("data-visual-direction", "apple-wallet-flow8")
  const travelObject = pass.locator("section").first()
  const walletObject = page.getByTestId("wallet-balance")
  await expect(travelObject).toBeVisible()
  await expect(walletObject).toBeVisible()
  await expect(walletObject).toHaveAttribute("data-flow8-object", "wallet")
  await expect(pass.getByTestId("travel-pass-local-boundary")).toBeVisible()
  await expect(page.getByTestId("wallet-non-live-boundary")).toBeVisible()
  await expectNoHorizontalOverflow(pass)
  await expectControls(pass)
})

test("FLOW8-WALLET-002 disconnected, linking, failure, retry, and ready preserve one modal decision", async ({ page }) => {
  await openTravelPass(page)
  await page.evaluate(() => { (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__ = { wallet: "failure" } })
  await page.getByTestId("wallet-link-open").click()
  let sheet = page.getByTestId("wallet-connect-sheet")
  await expect(sheet).toHaveAttribute("data-phase", "info")
  await sheet.getByRole("button", { name: COPY.en.connect, exact: true }).click()
  await expect(sheet).toHaveAttribute("data-phase", "failed")
  await expect(sheet.getByTestId("wallet-link-retry")).toHaveText(COPY.en.retry)
  await page.evaluate(() => { delete (window as Window & { __ONDO_B_QA__?: Flow8Qa }).__ONDO_B_QA__ })
  await sheet.getByTestId("wallet-link-retry").click()
  await expect(sheet).toBeHidden()
  await expect(page.getByTestId("ondo-b-id-wallet-commerce")).toHaveAttribute("data-wallet", "ready")
  sheet = page.getByTestId("wallet-connect-sheet")
  await expect(sheet).toHaveCount(0)
})

test("FLOW8-OFFER-003 quote, benefit delta, consent, and one sticky payment decision stay coherent", async ({ page }) => {
  const { offer } = await openOffer(page)
  await expect(offer).toHaveAttribute("data-visual-direction", "apple-wallet-flow8")
  await expect(offer.locator('[data-flow8-object="quote"]')).toBeVisible()
  const decision = offer.locator('[data-flow8-decision="payment"]')
  await expect(decision).toBeVisible()
  await offer.getByTestId("benefit-accept").click()
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "selected")
  await expect(offer.locator('[data-flow8-benefit-delta="applied"]')).toBeVisible()
  await offer.getByTestId("benefit-decline").click()
  await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "available")
  await expectNoHorizontalOverflow(offer)
  await expectControls(offer)
  const consentLabel = await offer.getByTestId("payment-minimum-consent").locator("label").boundingBox()
  expect(consentLabel).not.toBeNull()
  expect(consentLabel!.height).toBeGreaterThanOrEqual(44)
})

test("FLOW8-RECOVERY-004 payment failure and insufficient balance retain retry and exact return", async ({ browser }) => {
  for (const outcome of ["failure", "insufficient"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const { offer, place } = await openOffer(page, "en", { payment: outcome })
    await offer.getByTestId("benefit-accept").click()
    await offer.getByTestId("payment-confirm").click()
    await connectWallet(page, "en")
    await offer.getByTestId("payment-minimum-consent").locator("input").check()
    await offer.getByTestId("payment-confirm").click()
    const recovery = offer.getByTestId("payment-recovery")
    await expect(recovery).toHaveAttribute("data-recovery", outcome)
    await expect(recovery.getByTestId("payment-retry")).toBeVisible()
    expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
    await recovery.getByTestId("payment-retry").click()
    await expect(offer.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "selected")
    await offer.getByTestId("payment-cancel").click()
    await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
    await expect(place.getByTestId("canonical-meal-benefit-open")).toBeFocused()
    await place.getByTestId("canonical-meal-benefit-open").click()
    const retryOffer = page.getByTestId("ondo-b-id-wallet-commerce")
    await retryOffer.getByTestId("payment-minimum-consent").locator("input").check()
    await retryOffer.getByTestId("payment-confirm").click()
    await expect(retryOffer.getByTestId("payment-receipt")).toBeVisible()
    await context.close()
  }
})

test("FLOW8-POLICY-005 eligibility, minimum, and expiry are full non-payment recovery states", async ({ browser }) => {
  for (const policy of ["ineligible", "below_minimum", "expired"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const { offer } = await openOffer(page, "en", { benefit: policy })
    await expect(offer).toHaveAttribute("data-benefit-policy", policy)
    const recovery = offer.getByTestId("commerce-benefit-recovery")
    await expect(recovery).toBeVisible()
    await expect(recovery.getByRole("button")).toHaveCount(1)
    await expect(offer.getByTestId("payment-confirm")).toHaveCount(0)
    await context.close()
  }
})

test("FLOW8-COMPLETE-006 payment, reload, refund, restored benefit, activity, My Korea, and exact Place form one journey", async ({ page }) => {
  const { offer, place } = await openOffer(page)
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  await connectWallet(page, "en")
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toHaveAttribute("data-completion-kind", "receipt")
  await expect(receipt).toContainText("ONDO-LOCAL-20260825-001")
  await receipt.locator("details summary").click()
  await receipt.getByTestId("payment-refund").evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
  await expect(receipt).toContainText("ONDO-LOCAL-REFUND-20260825-001")
  await receipt.getByTestId("payment-receipt-return").click()
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await place.locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-activity-receipt")).toContainText("ONDO-LOCAL-REFUND-20260825-001")
  await expect(page.locator('[data-testid*="outcome"], [data-testid*="ledger"]')).toHaveCount(0)
  await expect(page.getByTestId("wallet-benefit")).toContainText("1 available")
  await page.getByTestId("nav-my").click({ force: true })
  await expect(page.getByTestId("my-korea-receipts")).toContainText("ONDO-LOCAL-REFUND-20260825-001")
})

test("FLOW8-DURABLE-007 payment and refund do not visually complete before device persistence succeeds", async ({ page }) => {
  const { offer } = await openOffer(page)
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await installOneShotDeviceWriteFailure(page)
  await offer.getByTestId("payment-confirm").click()
  await expect(offer.getByTestId("payment-receipt")).toHaveCount(0)
  await expect(offer.getByTestId("commerce-storage-error")).toBeVisible()
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
  await offer.getByTestId("payment-retry").click()
  await offer.getByTestId("payment-confirm").click()
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toBeVisible()
  expect((await storedDevice(page)).commerceReceipts).toEqual([expect.objectContaining({ status: "paid", paidOOKRW: 19, benefitOOKRW: 3, balanceOOKRW: 41 })])

  await receipt.locator("details summary").click()
  await installOneShotDeviceWriteFailure(page)
  await receipt.getByTestId("payment-refund").click()
  await expect(receipt).toHaveAttribute("data-completion-kind", "receipt")
  await expect(receipt.getByTestId("commerce-storage-error")).toBeVisible()
  expect((await storedDevice(page)).commerceReceipts).toEqual([expect.objectContaining({ status: "paid", paidOOKRW: 19, benefitOOKRW: 3, balanceOOKRW: 41 })])
  await receipt.getByTestId("payment-refund").click()
  await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
  expect((await storedDevice(page)).commerceReceipts).toEqual([expect.objectContaining({ status: "refunded", paidOOKRW: 19, benefitOOKRW: 3, balanceOOKRW: 60 })])
  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  const restoredPlace = page.getByTestId("canonical-place-overlay")
  await expect(restoredPlace).toHaveAttribute("data-venue-id", VENUE_ID)
  await restoredPlace.locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-activity-receipt")).toContainText("ONDO-LOCAL-REFUND-20260825-001")
})

test("FLOW8-CANCEL-008 Escape during processing cancels pending confirmation and preserves the exact Place retry", async ({ page }) => {
  const { offer, place } = await openOffer(page)
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  await expect(offer.getByTestId("payment-processing")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect(place.getByTestId("canonical-meal-benefit-open")).toBeFocused()
  expect((await storedDevice(page)).commerceReceipts ?? []).toEqual([])
  await place.getByTestId("canonical-meal-benefit-open").click()
  const reopened = page.getByTestId("ondo-b-id-wallet-commerce")
  await expect(reopened).toHaveAttribute("data-payment-state", "review")
  await reopened.getByTestId("benefit-decline").click()
  await expect(reopened.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "available")
  await reopened.getByTestId("benefit-accept").click()
  await reopened.getByTestId("payment-minimum-consent").locator("input").check()
  await reopened.getByTestId("payment-confirm").click()
  await expect(reopened.getByTestId("payment-receipt")).toBeVisible()
  expect((await storedDevice(page)).commerceReceipts).toHaveLength(1)
})

test("FLOW8-INDEPENDENCE-009 Account, Person, 19+, Wallet, payment, refund, and reload remain separate snapshots", async ({ page }) => {
  await openTravelPass(page)
  const account = page.getByTestId("traveler-id-account")
  const person = page.getByTestId("traveler-id-person")
  const age = page.getByTestId("traveler-id-age")
  const payment = page.getByTestId("traveler-id-payment")
  await expect(account).toHaveAttribute("data-status", "guest")
  await expect(person).toHaveAttribute("data-status", "none")
  await expect(age).toHaveAttribute("data-status", "none")
  await expect(payment).toHaveAttribute("data-status", "disconnected")

  await person.getByRole("button").click()
  let gate = page.getByTestId("ondo-b-local-check-walkthrough")
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(person).toHaveAttribute("data-status", "success")
  await expect(age).toHaveAttribute("data-status", "none")
  await expect(payment).toHaveAttribute("data-status", "disconnected")

  await age.getByRole("button").click()
  gate = page.getByTestId("ondo-b-local-check-walkthrough")
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(person).toHaveAttribute("data-status", "success")
  await expect(age).toHaveAttribute("data-status", "success")
  await expect(payment).toHaveAttribute("data-status", "disconnected")

  await page.getByTestId("wallet-link-open").click()
  await connectWallet(page, "en")
  await expect(person).toHaveAttribute("data-status", "success")
  await expect(age).toHaveAttribute("data-status", "success")
  await expect(payment).toHaveAttribute("data-status", "ready")

  const { offer, place } = await navigateToOfferFromExplore(page)
  await offer.getByTestId("benefit-accept").click()
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").click()
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toBeVisible()
  await receipt.locator("details summary").click()
  await receipt.getByTestId("payment-refund").click()
  await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
  await receipt.getByTestId("payment-receipt-return").click()
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await place.locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("traveler-id-account")).toHaveAttribute("data-status", "guest")
  await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "ready")
  await expect(page.getByTestId("wallet-activity-receipt")).toContainText("ONDO-LOCAL-REFUND-20260825-001")

  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("traveler-id-account")).toHaveAttribute("data-status", "guest")
  await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "disconnected")
})

test("FLOW8-TRUTH-010 every locale keeps non-live truth visible and commerce actions contact no external service", async ({ browser }) => {
  const boundaries = {
    en: /Local test wallet.*no money.*provider|Local travel aid only/i,
    ko: /테스트 지갑.*돈.*공급자|이 기기의 여행 도구/,
    ja: /テストウォレット.*お金.*事業者|この端末だけの旅の補助/,
  } as const
  for (const locale of ["en", "ko", "ja"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const pass = await openTravelPass(page, locale)
    await expect(pass.getByTestId("travel-pass-local-boundary")).toContainText(boundaries[locale])
    await expect(page.getByTestId("wallet-non-live-boundary")).toContainText(boundaries[locale])
    const external: string[] = []
    page.on("request", (request) => {
      const url = request.url()
      if (["fetch", "xhr", "websocket"].includes(request.resourceType()) && !url.startsWith("http://127.0.0.1")) external.push(url)
    })
    await page.getByTestId("wallet-link-open").click()
    await connectWallet(page, locale)
    const { offer } = await navigateToOfferFromExplore(page)
    await offer.getByTestId("benefit-accept").click()
    await offer.getByTestId("payment-minimum-consent").locator("input").check()
    await offer.getByTestId("payment-confirm").click()
    const receipt = offer.getByTestId("payment-receipt")
    await expect(receipt).toBeVisible()
    await receipt.locator("details summary").click()
    await receipt.getByTestId("payment-refund").click()
    await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
    expect(external).toEqual([])
    const stored = JSON.stringify(await storedDevice(page))
    for (const forbidden of ["walletAddress", "credential", "identity", "address", "rawClaim"]) expect(stored).not.toContain(forbidden)
    await context.close()
  }
})

test("FLOW8-RETURN-011 Wallet and My Korea receipt actions return to the exact Place", async ({ page }) => {
  await openTravelPass(page, "en", "refunded")
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

test("FLOW8-DECLINED-012 declined benefit keeps 22 → 38, refunds to 60, and remains one-use safe across reload", async ({ page }) => {
  const { offer } = await openOffer(page)
  await offer.getByTestId("benefit-decline").click()
  await offer.getByTestId("payment-confirm").click()
  await connectWallet(page, "en")
  await offer.getByTestId("payment-minimum-consent").locator("input").check()
  await offer.getByTestId("payment-confirm").evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  const receipt = offer.getByTestId("payment-receipt")
  await expect(receipt).toContainText("22 OOKRW Test")
  await expect(receipt).toContainText("0 OOKRW Test")
  await expect(receipt).toContainText("38 OOKRW Test")
  expect((await storedDevice(page)).commerceReceipts).toEqual([expect.objectContaining({ status: "paid", paidOOKRW: 22, benefitOOKRW: 0, balanceOOKRW: 38 })])
  await receipt.locator("details summary").click()
  await receipt.getByTestId("payment-refund").evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  await expect(receipt).toHaveAttribute("data-completion-kind", "refunded")
  expect((await storedDevice(page)).commerceReceipts).toEqual([expect.objectContaining({ status: "refunded", paidOOKRW: 22, benefitOOKRW: 0, balanceOOKRW: 60 })])
  await page.reload({ waitUntil: "domcontentloaded" })
  await waitForShell(page)
  const restoredPlace = page.getByTestId("canonical-place-overlay")
  await expect(restoredPlace).toHaveAttribute("data-venue-id", VENUE_ID)
  await restoredPlace.locator("header button").last().click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("wallet-balance")).toContainText("60")
  await expect(page.getByTestId("wallet-benefit")).toContainText("1 available")
})

test("FLOW8-FIRSTVIEW-013 compact Wallet, offer choice, venue truth, and recovery remain complete decisions", async ({ browser }) => {
  const mobile = await browser.newContext({ viewport: { width: 320, height: 720 } })
  const page = await mobile.newPage()
  await openTravelPass(page)
  const prepare = page.getByTestId("wallet-link-open")
  const dock = page.getByTestId("ondo-main-nav")
  const [prepareBox, dockBox] = await Promise.all([prepare.boundingBox(), dock.boundingBox()])
  expect(prepareBox).not.toBeNull()
  expect(dockBox).not.toBeNull()
  expect(prepareBox!.y + prepareBox!.height).toBeLessThanOrEqual(dockBox!.y - 8)
  await prepare.click()
  await connectWallet(page, "en")
  const { offer } = await navigateToOfferFromExplore(page)
  const venueBoundary = offer.getByTestId("commerce-venue-test-boundary")
  await expect(venueBoundary).toBeVisible()
  const benefitChoice = await offer.getByTestId("benefit-accept").boundingBox()
  expect(benefitChoice).not.toBeNull()
  expect(benefitChoice!.y + benefitChoice!.height).toBeLessThanOrEqual(720 - 96)
  await mobile.close()

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const desktopPage = await desktop.newPage()
  const { offer: recoveryOffer } = await openOffer(desktopPage, "en", { benefit: "ineligible" })
  const recovery = recoveryOffer.getByTestId("commerce-benefit-recovery")
  const recoveryBox = await recovery.boundingBox()
  expect(recoveryBox).not.toBeNull()
  expect(recoveryBox!.height).toBeLessThanOrEqual(420)
  await desktop.close()
})

for (const locale of ["en", "ko", "ja"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`FLOW8-CAPTURE-SUCCESSOR ${locale} ${viewport.label} paid and declined evidence`, async ({ page }) => {
      test.skip(process.env.ONDO_FLOW8_CAPTURE !== "1", "Run after PRODUCT seal with ONDO_FLOW8_CAPTURE=1")
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await openTravelPass(page, locale, "paid")
      await page.getByTestId("wallet-activity-receipt").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-wallet-activity-paid`)
      await page.getByTestId("nav-my").click()
      await page.getByTestId("my-korea-receipts").scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-my-korea-paid`)

      await resetCaptureDevice(page, locale)
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
      await openTravelPass(page, locale)
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
        offer = page.getByTestId("ondo-b-id-wallet-commerce")
        await expect(offer).toHaveAttribute("data-benefit-policy", policy)
        await quietCapture(page, `${locale}-${viewport.label}-policy-${policy}`)
      }

      await offer.getByTestId("commerce-origin-return").click()
      await setCaptureQa(page)
      await place.getByTestId("canonical-meal-benefit-open").click()
      offer = page.getByTestId("ondo-b-id-wallet-commerce")
      await offer.getByTestId("payment-minimum-consent").locator("input").check()
      await offer.getByTestId("payment-confirm").click()
      await expect(offer.getByTestId("payment-processing")).toBeVisible()
      await processingCapture(page, `${locale}-${viewport.label}-payment-processing`)
      await expect(offer.getByTestId("payment-receipt")).toBeVisible()
      await quietCapture(page, `${locale}-${viewport.label}-receipt`)

      const receipt = offer.getByTestId("payment-receipt")
      await receipt.locator("details summary").click()
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

      await resetCaptureDevice(page, locale)
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
