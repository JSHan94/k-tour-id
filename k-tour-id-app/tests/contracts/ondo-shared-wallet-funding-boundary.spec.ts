import { expect, test } from "@playwright/test"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import { resolveCommercePlaceB } from "../../features/ondo/commerce-b/place-service-registry-b"
import { createFundingRailB, fundingRailTransitionB, type FundingRailReceiptB } from "../../features/ondo/commerce-b/funding-rail-model-b"
import { createStableCommerceBState, createStableCommerceBLockedQuote, creditStableCommerceFundingB, openStableCommerceOrderB, selectStableCommerceOrderB, stableCommerceBalanceB, stableCommerceBReducer as reduce, stableCommerceOrderB, type StableCommerceBState, type CommerceSampleResponseB } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = Date.parse("2026-09-12T03:00:00Z")
function open(state: StableCommerceBState, placeId: string, serial: string) {
  const place = resolveCommercePlaceB(placeId)!
  return openStableCommerceOrderB(state, { orderId: `sample-order:${serial}`, venueId: placeId, ...place.commerce!, operationId: `sample-order:${serial}`, receiptId: `sample-order:${serial}:receipt` })!
}
function quote(state: StableCommerceBState) { return createStableCommerceBLockedQuote(state, new Date(NOW + 60_000)) }
function pay(state: StableCommerceBState) { return reduce(reduce(state, { type: "CONFIRM", quote: quote(state) }), { type: "PAYMENT_RETURN", outcome: "success" }) }
function execute<T>(value: T) {
  return reviewFixture(createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-MULTI-WALLET" })!, { outcome: "success", value, now: new Date(NOW + 1) })
}
function fund() {
  let operation = createFundingRailB({ operationId: "demo-fund:multi-wallet", rail: "digital_dollar", creditKrw: 30_000, now: NOW })
  operation = fundingRailTransitionB(operation, { type: "CONNECT_SIGNER", method: "existing_wallet", result: "ready", now: NOW })
  operation = fundingRailTransitionB(operation, { type: "REVIEW", now: NOW })
  operation = fundingRailTransitionB(operation, { type: "AUTHORIZE", quoteId: operation.quote.quoteId, consent: true, outcome: "settled", now: NOW })
  return fundingRailTransitionB(operation, { type: "SOURCE_STATUS", operationId: operation.operationId, quoteId: operation.quote.quoteId, result: "settled", now: NOW + 1 })
}

test("MW-FUND-01 shortage top-up preserves the exact venue quote and never performs payment", () => {
  let state = pay(open(createStableCommerceBState(), "research-seoul-zest", "first"))
  state = pay(open(state, "research-seoul-bar-cham", "second"))
  state = open(state, "research-jeju-moasi", "third")
  expect(stableCommerceBalanceB(state)).toBe(4)
  const locked = quote(state)
  state = reduce(state, { type: "PREPARE_QUOTE", quote: locked })
  expect(state.confirmationPending).toBe(false)
  const pending = fund()
  expect(pending.stablecoin?.sourceStatus).toBe("confirmed")
  expect(pending.receipt).toBeNull()
  expect(creditStableCommerceFundingB(state, execute(pending.receipt as unknown as FundingRailReceiptB), { allowReviewFixture: true }, NOW + 1)).toBeNull()
  const settled = fundingRailTransitionB(pending, { type: "DESTINATION_STATUS", operationId: pending.operationId, quoteId: pending.quote.quoteId, result: "settled", now: NOW + 1 })
  const execution = execute(settled.receipt!)
  state = creditStableCommerceFundingB(state, execution, { allowReviewFixture: true }, NOW + 1)!
  expect(state.lockedQuote).toEqual(locked)
  expect(state.confirmationPending).toBe(false)
  expect(state.status).toBe("idle")
  expect(state.ledger).toEqual([])
  expect(stableCommerceBalanceB(state)).toBe(34)
  expect(creditStableCommerceFundingB(state, execution, { allowReviewFixture: true }, NOW + 1)).toBe(state)
  state = reduce(reduce(state, { type: "CONFIRM", quote: locked }), { type: "PAYMENT_RETURN", outcome: "success" })
  expect(stableCommerceBalanceB(state)).toBe(22)
  const first = selectStableCommerceOrderB(state, "sample-order:first")!
  expect(stableCommerceBalanceB(first)).toBe(22)
  expect(first.status).toBe("paid")
})

test("MW-FUND-02 a partial refund of an older order changes the shared balance only by the confirmed amount", () => {
  let state = pay(open(createStableCommerceBState(), "research-seoul-okdongsik", "old"))
  state = pay(open(state, "research-jeju-moasi", "latest"))
  expect(stableCommerceBalanceB(state)).toBe(26)
  state = selectStableCommerceOrderB(state, "sample-order:old")!
  state = reduce(state, { type: "REFUND_REQUEST", operationId: "sample-refund:old-partial", amountKrw: 5000, now: NOW })
  const response: CommerceSampleResponseB = { operationId: "sample-refund:old-partial", stage: "refund", outcome: "unknown", amountKrw: 5000 }
  state = reduce(state, { type: "REFUND_RESULT", operationId: response.operationId, outcome: "unknown", now: NOW + 1, execution: execute(response) })
  expect(stableCommerceBalanceB(state)).toBe(26)
  state = reduce(state, { type: "REFUND_RESULT", operationId: response.operationId, outcome: "success", now: NOW + 1, execution: execute({ ...response, outcome: "success" }) })
  expect(stableCommerceBalanceB(state)).toBe(31)
  state = selectStableCommerceOrderB(state, "sample-order:latest")!
  expect(state.status).toBe("paid")
  expect(state.chargedDebit).toBe(12)
  expect(stableCommerceBalanceB(state)).toBe(31)
})

test("MW-FUND-03 an unresolved authorization cannot disappear by selecting a previous receipt", () => {
  let state = pay(open(createStableCommerceBState(), "research-jeju-moasi", "previous"))
  state = open(state, "research-seoul-okdongsik", "pending")
  state = reduce(state, { type: "CONFIRM", quote: quote(state) })
  const context = stableCommerceOrderB(state)
  const response: CommerceSampleResponseB = { operationId: context.operationId, stage: "authorization", outcome: "unknown", amountKrw: 22000 }
  state = reduce(state, { type: "AUTHORIZE_PAYMENT", outcome: "unknown", now: NOW, execution: execute(response) })
  expect(state.paymentOperation?.phase).toBe("unknown")
  expect(selectStableCommerceOrderB(state, "sample-order:previous")).toBeNull()
  expect(stableCommerceBalanceB(state)).toBe(48)
})
