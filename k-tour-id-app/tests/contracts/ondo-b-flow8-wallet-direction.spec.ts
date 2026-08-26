import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

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

test("FLOW8-OBJECT-002 Pass and wallet remain memorable non-live objects without credential, provider, or chain implication", () => {
  const commerce = source(COMMERCE)
  const commerceCss = source(COMMERCE_CSS)
  const pass = source(PASS)
  const passCss = source(PASS_CSS)

  for (const truth of [
    "does not move money",
    "not a stablecoin or on-chain asset",
    "No provider, credential or live money service is connected",
  ]) expect(`${commerce}\n${pass}`).toContain(truth)

  expect(passCss).toContain("--flow8-object-radius")
  expect(passCss).toContain("--flow8-object-shadow")
  expect(commerceCss).toContain("--flow8-object-radius")
  expect(commerceCss).toContain("--flow8-object-shadow")
  expect(commerceCss).toMatch(/\.balanceCard[\s\S]*isolation:\s*isolate/)
  expect(passCss).toMatch(/\.pass[\s\S]*isolation:\s*isolate/)
  expect(pass).toContain('data-testid="travel-pass-local-boundary"')
  expect(pass).not.toContain("Fingerprint")
  expect(pass).not.toContain("BadgeCheck")
  expect(commerce).toContain('data-testid="wallet-non-live-boundary"')
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
  expect(commerce).toContain("not an exchange rate or 1:1 value guarantee")
})

test("FLOW8-COMPLETE-004 receipt and refund are distinct completion objects with durable references and exact return", () => {
  const commerce = source(COMMERCE)
  const css = source(COMMERCE_CSS)

  expect(commerce).toContain('data-completion-kind={view}')
  expect(commerce).toContain("STABLE_B_RECEIPT_ID")
  expect(commerce).toContain("STABLE_B_REFUND_RECEIPT_ID")
  expect(commerce).toContain('data-testid="payment-receipt-return"')
  expect(css).toContain('.receiptWrap[data-refunded="false"]')
  expect(css).toContain('.receiptWrap[data-refunded="true"]')
  expect(css).toMatch(/\.receiptCard[\s\S]*font-variant-numeric:\s*tabular-nums/)
})

test("FLOW8-RECOVERY-005 wallet, payment, balance, eligibility, minimum, and expiry recovery remain full decisions", () => {
  const commerce = source(COMMERCE)
  const css = source(COMMERCE_CSS)

  for (const state of [
    '"info" | "linking" | "failed"',
    '"review" | "processing" | "receipt" | "failure" | "insufficient" | "refunded"',
    '"ineligible" | "below_minimum" | "expired"',
  ]) expect(commerce).toContain(state)

  for (const testId of [
    "wallet-connect-sheet",
    "wallet-link-retry",
    "commerce-benefit-recovery",
    "payment-recovery",
    "payment-retry",
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

  expect(css).toContain("--flow8-motion-fast: 180ms")
  expect(css).toContain("--flow8-motion-base: 240ms")
  expect(css).toContain("--flow8-motion-emphasis: 320ms")
  expect(css).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none/)
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
  expect(commerce).toContain("Test payment")
  expect(commerce).toContain("Test refund")
  expect(commerce).not.toContain('explore: "Find eligible places"')
  expect(commerce).not.toContain('explore: "대상 장소 찾기"')
  expect(commerce).not.toContain('explore: "対象のお店を探す"')
})

test("FLOW8-DURABLE-010 pay and refund are durable-first and reload reconstructs the exact paired ledgers", () => {
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
  expect(commerce).toContain('data-testid="commerce-storage-error"')
  expect(model).toContain('type: "CANCEL_CONFIRMATION"')
  expect(model).toContain('case "CANCEL_CONFIRMATION"')
})
