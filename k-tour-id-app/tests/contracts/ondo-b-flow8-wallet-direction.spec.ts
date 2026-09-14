import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import {
  createStableCommerceBState,
  createStableCommerceBLockedQuote,
  stableCommerceBReducer,
} from "../../features/ondo/commerce-b/stable-commerce-model-b"
import {
  commerceSessionFromReceipts,
  sanitizeCommerceReceipts,
  type OndoBCommerceReceipt,
} from "../../features/ondo/shared/state/ondo-b-provider"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

const COMMERCE = "features/ondo/commerce-b/id-wallet-commerce-b.tsx"
const COMMERCE_CSS = "features/ondo/commerce-b/id-wallet-commerce-b.module.css"
const PASS = "features/ondo/identity-b/traveler-id-entry-b.tsx"
const PASS_CSS = "features/ondo/identity-b/traveler-id-entry-b.module.css"

test("FLOW8-DIR-001 Travel Pass, Wallet, offer, and completion states share one Apple Wallet x ONDO direction", () => {
  const commerce = source(COMMERCE)
  const pass = source(PASS)

  expect(pass).toContain('data-visual-direction="apple-wallet-flow8"')
  expect(commerce).toContain('data-visual-direction="apple-wallet-flow8"')
  expect(commerce).toContain('data-flow8-object="wallet"')
  expect(commerce).toContain('data-flow8-object="offer"')
  expect(commerce).toContain('data-flow8-object="receipt"')
})

test("FLOW8-OBJECT-002 Pass and wallet keep first-frame copy consumer-shaped while setup owns provider truth", () => {
  const commerce = source(COMMERCE)
  const commerceCss = source(COMMERCE_CSS)
  const pass = source(PASS)
  const passCss = source(PASS_CSS)

  for (const truth of [
    "no money or digital asset moves",
    "No bank, card, wallet or payment provider is connected yet",
  ]) expect(commerce).toContain(truth)

  expect(passCss).toContain("--flow8-object-radius")
  expect(passCss).toContain("--flow8-object-shadow")
  expect(commerceCss).toContain("--flow8-object-radius")
  expect(commerceCss).toContain("--flow8-object-shadow")
  expect(commerceCss).toMatch(/\.balanceCard[\s\S]*isolation:\s*isolate/)
  expect(passCss).toMatch(/\.pass[\s\S]*isolation:\s*isolate/)
  expect(pass).toContain('data-testid="travel-pass-local-boundary"')
  expect(pass).not.toContain("Fingerprint")
  expect(pass).not.toContain("BadgeCheck")
  expect(commerce).not.toContain('data-testid="wallet-non-live-boundary"')
  expect(commerce).toContain('connect: "Set up travel wallet"')
  expect(commerce).toContain('connect: "여행 지갑 설정"')
  expect(commerce).toContain('linkTitle: "Start with an empty travel wallet"')
  expect(commerce).toContain('linkBody: "Choose how you’ll add KRW or USD when a provider is connected."')
  expect(commerce).toContain('localActual("travel_wallet_shell"')
  expect(commerce).toContain('data-testid="wallet-eyebrow"')
  expect(commerceCss).toMatch(/\.heading > p\s*\{[^}]*color:\s*var\(--flow8-plum\)/)
})

test("FLOW8-OFFER-003 quote owns the foreground, benefit shows a visible delta, and review has one sticky decision zone", () => {
  const commerce = source(COMMERCE)
  const css = source(COMMERCE_CSS)

  expect(commerce).toContain('data-flow8-object="quote"')
  expect(commerce).toContain('className={styles.offerDecision}')
  expect(commerce).toContain('data-testid="payment-minimum-consent"')
  expect(commerce).toContain('data-testid="payment-confirm"')
  expect(commerce).toContain('data-testid="payment-cancel"')
  expect(css).toMatch(/\.offerDecision\s*\{[\s\S]*position:\s*sticky/)
  expect(css).toMatch(/\.offerDecision[\s\S]*\.payButton[\s\S]*min-height:\s*44px/)
  expect(css).toMatch(/\.discount[\s\S]*color:/)
  expect(commerce).toContain('data-testid="commerce-fixed-quote-boundary"')
  expect(commerce).toContain('data-testid="commerce-payment-details"')
  expect(commerce).toContain("provider rate and fees unavailable")
  expect(commerce).toContain("formatKrwFromSettlementUnits")
  expect(commerce).toContain("formatUsdFromSettlementUnits")
  expect(commerce).toContain("Only wallet readiness and this benefit choice are used.")
  expect(commerce).not.toContain("This local walkthrough uses only wallet-ready and benefit-selected.")
})

test("FLOW8-COMPLETE-004 receipt and refund are distinct completion objects with durable references and exact return", () => {
  const commerce = source(COMMERCE)
  const css = source(COMMERCE_CSS)

  expect(commerce).toContain('data-completion-kind={renderedView}')
  expect(commerce).toContain("STABLE_B_RECEIPT_ID")
  expect(commerce).toContain("STABLE_B_REFUND_RECEIPT_ID")
  expect(commerce).toContain('data-testid="payment-receipt-return"')
  expect(commerce).not.toContain('data-testid="commerce-receipt-boundary"')
  expect(commerce).toContain('data-testid="commerce-settlement-details"')
  expect(commerce).toContain("actions.returnFromCommerceOrigin()")
  expect(commerce).not.toContain("function returnToCommercePlace()")
  expect(css).toContain('.receiptWrap[data-refunded="false"]')
  expect(css).toContain('.receiptWrap[data-refunded="true"]')
  expect(css).toMatch(/\.receiptCard[\s\S]*font-variant-numeric:\s*tabular-nums/)
})

test("FLOW8-RECOVERY-005 wallet, payment, balance, eligibility, minimum, and expiry recovery remain full decisions", () => {
  const commerce = source(COMMERCE)
  const css = source(COMMERCE_CSS)

  for (const state of [
    '"info" | "linking" | "failed"',
    '"ineligible" | "below_minimum" | "expired"',
  ]) expect(commerce).toContain(state)
  const paymentView = commerce.match(/type PaymentView = ([^\n]+)/)?.[1]
  expect(paymentView).toBeDefined()
  // Approval/capture adds an intermediate operation screen; every original
  // recovery and final state must still exist independently of union order.
  expect([...paymentView!.matchAll(/"([^"]+)"/g)].map(match => match[1]).sort()).toEqual([
    "review", "processing", "operation", "receipt", "failure", "insufficient", "refunded",
  ].sort())

  for (const testId of [
    "wallet-connect-sheet",
    "wallet-link-retry",
    "commerce-benefit-recovery",
    "payment-recovery",
    "payment-retry",
    "payment-operation",
    "payment-operation-continue",
    "payment-query-failure",
  ]) expect(commerce).toContain(`data-testid="${testId}"`)

  expect(css).toMatch(/\.paymentStatus[\s\S]*min-height:\s*min\(/)
  expect(css).toMatch(/\.benefitRecovery[\s\S]*min-height:/)
  expect(commerce).not.toContain("Add test balance")
  expect(commerce).toContain("delete qa.payment")
})

test("FLOW8-DESKTOP-006 desktop is a composed workspace, not a centered mobile sheet with dead lower space", () => {
  const commerceCss = source(COMMERCE_CSS)
  const passCss = source(PASS_CSS)

  expect(commerceCss).toContain("--flow8-desktop-rail")
  expect(commerceCss).toMatch(/@media \(min-width:\s*1100px\)[\s\S]*\.root[\s\S]*grid-template-columns:/)
  expect(commerceCss).toMatch(/@media \(min-width:\s*1100px\)[\s\S]*\.offerBody[\s\S]*min-height:/)
  expect(passCss).toMatch(/@media \(min-width:\s*1100px\)[\s\S]*\.screen[\s\S]*grid-template-columns:/)
})

test("FLOW8-MOTION-007 staged object motion is 180/240/320ms and reduced motion closes every animation", () => {
  const css = `${source(COMMERCE_CSS)}\n${source(PASS_CSS)}`
  const commerce = source(COMMERCE)

  expect(css).toContain("--flow8-motion-fast: 180ms")
  expect(css).toContain("--flow8-motion-base: 240ms")
  expect(css).toContain("--flow8-motion-emphasis: 320ms")
  expect(css).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none/)
  expect(commerce).toContain("timeout = window.setTimeout(finish, Math.max(0, count * 17 + 34))")
  expect(commerce).toContain("window.clearTimeout(timeout)")
  expect(commerce).toContain("if (completed) return")
})

test("FLOW8-FREEZE-008 the complete PRD action and testid graph stays present", () => {
  const commerce = source(COMMERCE)
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const my = source("features/ondo/my/saved-entry-b.tsx")

  for (const testId of [
    "wallet-balance",
    "wallet-link-open",
    "wallet-benefit",
    "wallet-activity",
    "wallet-activity-receipt",
    "wallet-activity-refund",
    "wallet-privacy",
    "benefit-accept",
    "benefit-decline",
    "payment-minimum-consent",
    "payment-confirm",
    "payment-cancel",
    "payment-processing",
    "payment-recovery",
    "payment-retry",
    "payment-receipt",
    "payment-refund",
    "payment-receipt-return",
  ]) expect(`${commerce}\n${my}`).toContain(`data-testid="${testId}"`)

  for (const action of [
    "acknowledgeCommerceLocalBoundary",
    "setCommerceWalletStatus",
    "dispatchCommerce",
    "openMealBenefitFromPlace",
    "returnFromCommerceOrigin",
  ]) expect(provider).toContain(action)

  expect(my).toContain('data-testid="my-korea-receipts"')
})

test("FLOW8-TRUTH-009 Wallet and My activity expose non-live truth plus an exact Place action without claiming a filter", () => {
  const commerce = source(COMMERCE)
  const my = source("features/ondo/my/saved-entry-b.tsx")

  expect(commerce).toContain('data-testid="wallet-activity-place"')
  expect(my).toContain('data-testid="my-korea-receipt-place"')
  expect(commerce).toContain("Balance-use record")
  expect(commerce).toContain("Balance restored")
  expect(commerce).not.toContain('explore: "Find eligible places"')
  expect(commerce).not.toContain('explore: "대상 장소 찾기"')
  expect(commerce).not.toContain('explore: "対象のお店を探す"')
})

test("FLOW8-DURABLE-010 mutations are write-checked while review receipts remain session-only and reload fails closed", () => {
  const commerce = source(COMMERCE)
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const model = source("features/ondo/commerce-b/stable-commerce-model-b.ts")

  expect(provider).toContain("dispatchCommerce(action: StableCommerceBAction): boolean")
  expect(provider).toContain("if (!persistBDeviceState(next)) return false")
  expect(provider).toContain("commerceSessionFromReceipt")
  expect(provider).toContain("STABLE_B_PAYMENT_OPERATION_ID")
  expect(provider).toContain("STABLE_B_REFUND_OPERATION_ID")
  expect(provider).toContain("ledger: paymentLedger")
  expect(provider).toContain("confirmationCount: 1")
  expect(provider).toContain("receiptCount: 1")
  expect(provider).toContain("refundCount: receipt.status === \"refunded\" ? 1 : 0")
  expect(provider).toContain('executionTruth: "FIXTURE_REVIEW"')
  expect(provider).toContain("provenanceTruth: REVIEW_PROVENANCE_TRUTH")
  expect(provider).toContain("Review-fixture results are current-session evidence only")
  expect(provider).toMatch(/function deviceState[\s\S]*commerceReceipts:\s*\[\]/)
  expect(provider).toMatch(/const next: OndoBState = \{[\s\S]*commerceReceipts:\s*\[\],[\s\S]*commerceWalletStatus:\s*"disconnected",[\s\S]*commerceSession:\s*createStableCommerceBState\(\)/)
  expect(commerce).toContain('data-testid="commerce-storage-error"')
  expect(model).toContain('type: "CANCEL_CONFIRMATION"')
  expect(model).toContain('case "CANCEL_CONFIRMATION"')
  expect(commerce).toContain("const preserveReturnToRef = useRef(false)")
  expect(commerce).toContain('if (outcome === "success")')
  expect(commerce).toContain("restoreConsumedBActionAfterMutationFailure(window.sessionStorage, consumed, new Date(), actionGateSessionOptions())")
  expect(commerce).toContain("if (!preserveReturnToRef.current && pending?.cta === \"START_CHECKOUT\"")
})

test("FLOW8-PRD-011 readiness snapshots stay independent and no external transport or sensitive storage enters Flow 8", () => {
  const pass = source(PASS)
  const commerce = source(COMMERCE)
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const stored = provider.slice(provider.indexOf("type OndoBDeviceState"), provider.indexOf("const B_DEVICE_KEY"))

  for (const state of ["personOutcome", "ageOutcome", "commerceWalletStatus"]) expect(`${pass}\n${provider}`).toContain(state)
  expect(provider).toContain('commerceWalletStatus: "disconnected"')
  expect(provider).toContain("commerceSession: createStableCommerceBState()")
  expect(provider).toMatch(/function deviceState[\s\S]*commerceReceipts:\s*\[\]/)
  for (const truth of ["Person does not prove 19+", "19+ does not prove identity"]) expect(pass).toContain(truth)
  for (const transport of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "FormData"]) {
    expect(`${commerce}\n${provider}`).not.toContain(transport)
  }
  for (const forbidden of ["name:", "age:", "identity:", "address:", "credential:", "walletAddress:"]) {
    expect(stored).not.toContain(forbidden)
  }
  for (const selector of ["payment-outcomes", "payment-ledgers", "commerce-outcomes", "commerce-ledgers"]) {
    expect(commerce).not.toContain(`data-testid="${selector}"`)
  }
})

test("FLOW8-IDEMPOTENT-012 accepted, declined, and refunded operations are exact under triple dispatch", () => {
  const settle = (accepted: boolean) => {
    let state = createStableCommerceBState()
    state = stableCommerceBReducer(state, { type: accepted ? "ACCEPT_BENEFIT" : "DECLINE_BENEFIT" })
    const quote = createStableCommerceBLockedQuote(state, new Date("2026-08-28T03:15:00.000Z"))
    for (let index = 0; index < 3; index += 1) state = stableCommerceBReducer(state, { type: "CONFIRM", quote })
    for (let index = 0; index < 3; index += 1) state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome: "success" })
    return state
  }

  const accepted = settle(true)
  expect(accepted.confirmationCount).toBe(1)
  expect(accepted.receiptCount).toBe(1)
  expect(accepted.ledger.map(({ amount }) => amount)).toEqual([-19, 19])
  expect(new Set(accepted.ledger.map(({ receiptId }) => receiptId))).toEqual(new Set(["ONDO-LOCAL-20260825-001"]))

  const declined = settle(false)
  expect(declined.confirmationCount).toBe(1)
  expect(declined.receiptCount).toBe(1)
  expect(declined.ledger.map(({ amount }) => amount)).toEqual([-22, 22])

  let refunded = accepted
  for (let index = 0; index < 3; index += 1) refunded = stableCommerceBReducer(refunded, { type: "REFUND" })
  expect(refunded.refundCount).toBe(1)
  expect(refunded.ledger.map(({ amount }) => amount)).toEqual([-19, 19, 19, -19])
  expect(refunded.ledger.slice(2).map(({ receiptId }) => receiptId)).toEqual([
    "ONDO-LOCAL-REFUND-20260825-001",
    "ONDO-LOCAL-REFUND-20260825-001",
  ])
})

test("FLOW8-JIT-018 action-gate credential issuance and setup closure publish atomically", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const setup = source("features/ondo/identity-b/ktour-id-setup-b.tsx")
  const completionStart = provider.indexOf("completeIdentitySetup:")
  const completionEnd = provider.indexOf("completeAgeProof:", completionStart)
  const holderStart = setup.indexOf("function finishHolder()")
  const holderEnd = setup.indexOf("function openPresentation()", holderStart)
  expect(completionStart).toBeGreaterThanOrEqual(0)
  expect(completionEnd).toBeGreaterThan(completionStart)
  expect(holderStart).toBeGreaterThanOrEqual(0)
  expect(holderEnd).toBeGreaterThan(holderStart)
  const completion = provider.slice(completionStart, completionEnd)
  const holderCompletion = setup.slice(holderStart, holderEnd)

  expect(completion).toContain("completeIdentitySetup: (method, options) => {")
  expect(completion.match(/\bcommitEphemeral\(/g)).toHaveLength(1)
  expect(completion).toContain("commitEphemeral((current) => ({")
  expect(completion).toContain("identityCredential: recovered ?? createSimulatedCredentialB(method, Date.now(), current.identityDemoScenario)")
  const reviewGuard = completion.indexOf("if (options?.sampleRecovery && !qaReviewFixtureOptions().allowReviewFixture) return")
  const recoveryGuard = completion.indexOf("if (options?.sampleRecovery && (!recovered || recovered.method !== method)) return")
  const atomicPublish = completion.indexOf("commitEphemeral((current) => ({")
  expect(reviewGuard).toBeGreaterThanOrEqual(0)
  expect(recoveryGuard).toBeGreaterThan(reviewGuard)
  expect(atomicPublish).toBeGreaterThan(recoveryGuard)
  expect(completion).toContain("recoverSimulatedCredentialB(stateRef.current.identityCredential)")
  expect(completion).not.toContain("identityDemoScenario:")
  expect(completion).toContain('current.identitySetupOrigin === "action_gate"')
  expect(completion).toContain("? null")
  expect(completion).toContain(": current.identitySetupOrigin")
  expect(completion).not.toContain("closeIdentitySetup()")
  expect(holderCompletion).toContain('if (origin === "action_gate") return')
  expect(holderCompletion).toContain("actions.completeIdentitySetup(method, sampleRecovery ? { sampleRecovery: true } : undefined)")
  expect(holderCompletion).not.toContain("actions.closeIdentitySetup()")
})

test("FLOW8-RESTORE-013 accepted, declined, refunded, and malformed receipts restore behaviorally exact state", () => {
  const receipt = (status: "paid" | "refunded", benefitOOKRW: 0 | 3): OndoBCommerceReceipt => ({
    executionTruth: "FIXTURE_REVIEW",
    provenanceTruth: "SIMULATED",
    receiptId: "ONDO-LOCAL-20260825-001",
    refundReceiptId: status === "refunded" ? "ONDO-LOCAL-REFUND-20260825-001" : null,
    offerId: "meal-offer-gukbap",
    venueId: "mois-0021cd596bc5b2a922ad",
    status,
    paidOOKRW: benefitOOKRW === 3 ? 19 : 22,
    benefitOOKRW,
    balanceOOKRW: status === "paid" ? (benefitOOKRW === 3 ? 41 : 38) : 60,
  })

  const accepted = commerceSessionFromReceipts([receipt("paid", 3)])
  expect(accepted).toMatchObject({ status: "paid", providerOrder: "NOT_CONNECTED", voucher: "consumed", benefitRecommendation: "accepted", confirmationCount: 1, receiptCount: 1, refundCount: 0, chargedDebit: 19, redemptionCount: 1 })
  expect(accepted.ledger.map(({ amount, kind }) => [amount, kind])).toEqual([[-19, "PAYMENT"], [19, "PAYMENT"]])

  const declined = commerceSessionFromReceipts([receipt("paid", 0)])
  expect(declined).toMatchObject({ status: "paid", voucher: "available", benefitRecommendation: "declined", confirmationCount: 1, receiptCount: 1, chargedDebit: 22, redemptionCount: 0 })
  expect(declined.ledger.map(({ amount }) => amount)).toEqual([-22, 22])

  const refunded = commerceSessionFromReceipts([receipt("refunded", 3)])
  expect(refunded).toMatchObject({ status: "refunded", providerOrder: "NOT_CONNECTED", voucher: "available", confirmationCount: 1, receiptCount: 1, refundCount: 1, chargedDebit: 19, redemptionCount: 0 })
  expect(refunded.ledger.map(({ amount, kind }) => [amount, kind])).toEqual([[-19, "PAYMENT"], [19, "PAYMENT"], [19, "REFUND"], [-19, "REFUND"]])
  expect(refunded.ledger.map(({ operationId, receiptId }) => [operationId, receiptId])).toEqual([
    ["ONDO-LOCAL-OP-20260825-001", "ONDO-LOCAL-20260825-001"],
    ["ONDO-LOCAL-OP-20260825-001", "ONDO-LOCAL-20260825-001"],
    ["ONDO-LOCAL-REFUND-20260825-001", "ONDO-LOCAL-REFUND-20260825-001"],
    ["ONDO-LOCAL-REFUND-20260825-001", "ONDO-LOCAL-REFUND-20260825-001"],
  ])
  expect(refunded.ledger.reduce((sum, entry) => sum + entry.amount, 0)).toBe(0)

  const declinedRefunded = commerceSessionFromReceipts([receipt("refunded", 0)])
  expect(declinedRefunded).toMatchObject({ status: "refunded", voucher: "available", benefitRecommendation: "declined", chargedDebit: 22, refundCount: 1 })
  expect(declinedRefunded.ledger.map(({ amount }) => amount)).toEqual([-22, 22, 22, -22])
  expect(declinedRefunded.ledger.reduce((sum, entry) => sum + entry.amount, 0)).toBe(0)

  expect(sanitizeCommerceReceipts([{ ...receipt("paid", 3), receiptId: "made-up" }])).toEqual([])
  expect(sanitizeCommerceReceipts([{ ...receipt("paid", 3), refundReceiptId: "made-up" }])).toEqual([])
  expect(sanitizeCommerceReceipts([{ ...receipt("refunded", 3), refundReceiptId: null }])).toEqual([])
  expect(sanitizeCommerceReceipts([{ ...receipt("refunded", 3), refundReceiptId: "made-up" }])).toEqual([])
  expect(sanitizeCommerceReceipts([{ ...receipt("paid", 3), executionTruth: undefined }])).toEqual([])
  expect(sanitizeCommerceReceipts([{ ...receipt("paid", 3), provenanceTruth: undefined }])).toEqual([])
  expect(commerceSessionFromReceipts([])).toEqual(createStableCommerceBState())
})

test("FLOW8-COPY-014 every locale names the on-device venue boundary without connect, share, or live-payment shorthand", () => {
  const commerce = source(COMMERCE)
  const myKorea = source("features/ondo/my/saved-entry-b.tsx")

  for (const truth of [
    "not offered or accepted by the venue",
    "매장에서 제공하거나 접수하지 않음",
    "お店での提供・受付なし",
    "Creating your wallet…",
    "지갑을 만드는 중…",
    "ウォレットを作成しています…",
  ]) expect(commerce).toContain(truth)
  for (const stale of [
    "Connect travel wallet", "Connecting…", "Connect test wallet to pay", "Disconnect",
    "여행 지갑 연결", "연결 중…", "테스트 지갑 연결 후 결제", "연결 해제",
    "トラベルウォレットを接続", "接続しています…", "テストウォレットを接続して続ける", "接続を解除",
  ]) {
    expect(commerce).not.toContain(stale)
  }
  for (const visibleTestTruth of ["Payment saved", "결제 저장", "支払いを保存"]) {
    expect(myKorea).toContain(visibleTestTruth)
  }
})

test("FLOW8-AXIS-015 Payment gate commits notify every Pass subscriber", () => {
  const coordinator = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")

  expect(coordinator).toContain("window.dispatchEvent(new CustomEvent(B_ACTION_AXIS_SESSION_EVENT, { detail: next }))")
})

test("FLOW8-FUNDING-016 external funding has consented sample rails without faking a provider return", () => {
  const commerce = source(COMMERCE)
  const funding = commerce.slice(commerce.indexOf("const FUNDING_COPY"), commerce.indexOf("function CanonicalCommerceOfferB"))

  for (const route of ["krw_bank", "card_wallet", "digital_dollar"]) {
    expect(funding).toContain(`id: "${route}" as const`)
  }
  expect(funding).toContain('data-testid="funding-provider-required"')
  expect(funding).toContain('unavailable: "Not connected"')
  expect(funding).toContain('provider: "Connection needed"')
  expect(funding).toContain('const [draftSource, setDraftSource]')
  expect(funding).toContain('onChange={() => { if (!closing) { setDraftSource(id); setSaveError(false) } }}')
  expect(funding).not.toContain('onChange={() => onSelect(id)}')
  expect(funding).toContain('data-testid="funding-method-save"')
  expect(funding).toContain('if (draftSource !== "travel_balance") return')
  expect(funding).toContain('disabled={closing || (draftSource !== "travel_balance" && !reviewMode)}')
  expect(funding).toContain('if (onSelect(draftSource)) onClose()')
  expect(funding).toContain('data-testid="funding-sample-open"')
  expect(funding).toContain('if (!reviewMode && !enterReviewSample())')
  expect(funding).toContain('if (onSelect("travel_balance")) onClose()')
  expect(funding).toContain('next.phase !== "settled" || !next.receipt || !qaReviewFixtureOptions().allowReviewFixture')
  expect(funding).toContain('const committed = actions.creditSampleFunding(execution)')
  expect(funding).toContain('operationRef.current?.phase !== "settled" || !creditComplete')
  expect(funding).toContain('data-testid="funding-consent"')
  expect(funding).toContain('data-testid="funding-check-status"')
  expect(funding).not.toContain("eligible Korean")
  expect(funding).not.toContain("long-term")
  expect(commerce).toContain('const fundingAvailable = reviewMode && fundingSource === "travel_balance" && walletStatus === "ready"')
  expect(commerce).toContain('if (!reviewMode) return')
  expect(commerce).toContain('? walletStatus === "ready" ? (event) => openFundingForQuote(event.currentTarget)')
  const quoteHandoff = commerce.slice(commerce.indexOf("function openFundingForQuote("), commerce.indexOf("function pay("))
  expect(quoteHandoff).toContain('actions.dispatchCommerce({ type: "PREPARE_QUOTE", quote })')
  expect(quoteHandoff).toContain("setConsent(false)")
  expect(quoteHandoff).toContain("onOpenFunding(trigger)")
  expect(commerce).toContain('const walletPresentationState = walletStatus === "ready" && !reviewMode ? "empty" : walletStatus')
  expect(commerce).toContain('data-wallet-state={walletPresentationState}')
  expect(commerce).toContain('reviewMode ? copy.balanceReady : copy.balanceEmptyStatus')
})

test("FLOW8-FUNDING-017 the child funding portal exits without releasing its parent, scroll, or opener early", () => {
  const commerce = source(COMMERCE)
  const css = source(COMMERCE_CSS)
  const fundingMount = commerce.slice(commerce.indexOf("export function WalletFundingMountB"), commerce.indexOf("export function IdWalletCommerceB"))

  expect(fundingMount).toContain("const presence = useSheetPresence(desiredSubject)")
  expect(fundingMount).toContain("presence.value ? <FundingSourceSheet")
  expect(fundingMount).toContain("presenceState={presentedPhase}")
  expect(commerce).toContain("useModalIsolation(true, rootRef)")
  expect(commerce).toContain("useDocumentScrollLock(true)")
  expect(commerce).toContain("data-modal-layer-priority={ONDO_MODAL_PRIORITY.finalCritical}")
  expect(commerce).toContain('data-funding-presence={presenceState}')
  expect(commerce).toContain("onClickCapture=")
  expect(commerce).toContain("onPointerDownCapture=")
  expect(commerce).toContain("onKeyDownCapture=")
  expect(fundingMount).toContain("if (closeRequestedRef.current) return")
  expect(fundingMount).toContain("if (presence.value !== null)")
  expect(fundingMount).toContain("wasPresentRef.current = true")
  expect(fundingMount).toContain("if (!wasPresentRef.current) return")
  expect(fundingMount).toContain("focusReturn?.exact.isConnected && isRenderedFocusable(focusReturn.exact)")
  expect(fundingMount).toContain("focusFirstAvailableDestination(focusReturn.fallbackSelectors)")
  expect(fundingMount).not.toMatch(/function close\(\)[\s\S]{0,260}requestAnimationFrame/)
  expect(commerce).toContain("setDraftSource(source)")
  expect(commerce).toContain("[source, subject, reviewMode]")
  expect(commerce).toContain("readFundingRailB(window.sessionStorage.getItem(FUNDING_RAIL_SESSION_KEY_B))")
  expect(commerce).toContain('if (onSelect(draftSource)) onClose()')
  expect(css).toContain('.fundingBackdrop[data-funding-presence="closing"]')
  expect(css).toContain("animation: fundingBackdropExit 260ms")
  expect(css).toContain("animation: fundingSheetExit 260ms")
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*fundingBackdrop\[data-funding-presence="closing"\][\s\S]*animation: none/)
})
