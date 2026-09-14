import { expect, test } from "@playwright/test"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import { createFundingRailB, fundingRailTransitionB, type FundingRailB, type FundingRailReceiptB } from "../../features/ondo/commerce-b/funding-rail-model-b"
import { createStableCommerceBLockedQuoteFromMode, createStableCommerceBState, creditStableCommerceFundingB, stableCommerceBalanceB, stableCommerceBReducer } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = Date.parse("2026-09-08T04:00:00Z")
const OPT = { allowReviewFixture: true }
function settled(rail: FundingRailB = "krw_bank", creditKrw = 30_000, serial = "boundary-01") {
  let op = createFundingRailB({ operationId: `demo-fund:${serial}`, rail, creditKrw, now: NOW })
  if (rail === "digital_dollar") op = fundingRailTransitionB(op, { type: "CONNECT_SIGNER", method: "existing_wallet", result: "ready", now: NOW })
  op = fundingRailTransitionB(op, { type: "REVIEW", now: NOW })
  op = fundingRailTransitionB(op, { type: "AUTHORIZE", quoteId: op.quote.quoteId, consent: true, outcome: "settled", now: NOW })
  if (rail === "digital_dollar") {
    op = fundingRailTransitionB(op, { type: "SOURCE_STATUS", quoteId: op.quote.quoteId, operationId: op.operationId, result: "settled", now: NOW + 1 })
    return fundingRailTransitionB(op, { type: "DESTINATION_STATUS", quoteId: op.quote.quoteId, operationId: op.operationId, result: "settled", now: NOW + 1 }).receipt!
  }
  return fundingRailTransitionB(op, { type: "STATUS", quoteId: op.quote.quoteId, operationId: op.operationId, result: "settled", now: NOW + 1 }).receipt!
}
function execute(value: FundingRailReceiptB) {
  return reviewFixture(createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-FUNDING-CREDIT" })!, { outcome: "success", value, now: new Date(NOW + 1) })
}

test("only a live settled sample receipt can credit the sample balance", () => {
  const initial = createStableCommerceBState()
  const execution = execute(settled())
  expect(creditStableCommerceFundingB(initial, execution, {}, NOW + 1)).toBeNull()
  expect(creditStableCommerceFundingB(initial, JSON.parse(JSON.stringify(execution)), OPT, NOW + 1)).toBeNull()
  expect(creditStableCommerceFundingB(initial, execution, OPT, NOW)).toBeNull()
  const next = creditStableCommerceFundingB(initial, execution, OPT, NOW + 1)!
  expect(stableCommerceBalanceB(next)).toBe(90)
  expect(next.ledger).toEqual([])
  expect(next.voucher).toBe("available")
  expect(next.fundingCredits).toHaveLength(1)
  expect(creditStableCommerceFundingB(next, execution, OPT, NOW + 2)).toBe(next)
})

test("bank, card and dollar rails share one ledger without mixing source and credited currency", () => {
  let state = createStableCommerceBState()
  for (const rail of ["krw_bank", "card_wallet", "digital_dollar"] as const) {
    state = creditStableCommerceFundingB(state, execute(settled(rail, 15_000, `boundary-${rail.replaceAll("_", "-")}`)), OPT, NOW + 1)!
  }
  expect(stableCommerceBalanceB(state)).toBe(105)
  expect(state.fundingCredits.map(item => item.sourceAmountMinor)).toEqual([15_000, 15_150, 1_025])
})

test("a conflicting callback and mutated receipt cannot inflate a credited operation", () => {
  const receipt = settled()
  const initial = creditStableCommerceFundingB(createStableCommerceBState(), execute(receipt), OPT, NOW + 1)!
  expect(creditStableCommerceFundingB(initial, execute(settled("krw_bank", 60_000)), OPT, NOW + 1)).toBeNull()
  const malformed = { ...receipt, creditKrw: 31_000 }
  expect(creditStableCommerceFundingB(initial, execute(malformed), OPT, NOW + 1)).toBeNull()
  const execution = execute(receipt)
  const next = creditStableCommerceFundingB(createStableCommerceBState(), execution, OPT, NOW + 1)!
  // A caller retaining the input receipt has no write-through path to credit.
  const mutable = receipt as { creditKrw: number }
  mutable.creditKrw = 60_000
  expect(stableCommerceBalanceB(next)).toBe(90)
})

test("full refund restores only the payment and retains funding exactly once", () => {
  let state = creditStableCommerceFundingB(createStableCommerceBState(), execute(settled()), OPT, NOW + 1)!
  state = stableCommerceBReducer(state, { type: "CONFIRM", quote: createStableCommerceBLockedQuoteFromMode("standard", new Date(NOW + 60_000)) })
  state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome: "success" })
  expect(stableCommerceBalanceB(state)).toBe(68)
  state = stableCommerceBReducer(state, { type: "REFUND" })
  expect(stableCommerceBalanceB(state)).toBe(90)
  expect(stableCommerceBReducer(state, { type: "REFUND" })).toBe(state)
  expect(state.fundingCredits).toHaveLength(1)
  expect(stableCommerceBalanceB(stableCommerceBReducer(state, { type: "RESET" }))).toBe(60)
})
