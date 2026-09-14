import { expect, test } from "@playwright/test"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import { createFundingRailB, fundingRailTransitionB, FUNDING_QUOTE_TTL_MS_B, isFundingRailReceiptB, readFundingRailB, type FundingRailB, type FundingCardMethodB, type FundingSampleOutcomeB } from "../../features/ondo/commerce-b/funding-rail-model-b"
import { createStableCommerceBState, creditStableCommerceFundingB, stableCommerceBalanceB, stableCommerceBReducer } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = Date.parse("2026-09-08T08:00:00Z")
let serial = 0
function quote(rail: FundingRailB = "krw_bank", cardMethod?: FundingCardMethodB) {
  return createFundingRailB({ operationId: `demo-fund:operation-${++serial}`, rail, cardMethod, creditKrw: 30_000, now: NOW })
}
function pending(rail: FundingRailB = "krw_bank", outcome: FundingSampleOutcomeB = "settled", cardMethod?: FundingCardMethodB) {
  let initial = quote(rail, cardMethod)
  if (rail === "digital_dollar") initial = fundingRailTransitionB(initial, { type: "CONNECT_SIGNER", method: "zklogin", result: "ready", now: NOW })
  const reviewed = fundingRailTransitionB(initial, { type: "REVIEW", now: NOW + 1 })
  return fundingRailTransitionB(reviewed, { type: "AUTHORIZE", quoteId: reviewed.quote.quoteId, consent: true, outcome, now: NOW + 2 })
}
function settled(rail: FundingRailB = "krw_bank", cardMethod?: FundingCardMethodB) {
  let operation = pending(rail, "settled", cardMethod)
  if (rail === "digital_dollar") {
    operation = fundingRailTransitionB(operation, { type: "SOURCE_STATUS", operationId: operation.operationId, quoteId: operation.quote.quoteId, result: "settled", now: NOW + 3 })
    return fundingRailTransitionB(operation, { type: "DESTINATION_STATUS", operationId: operation.operationId, quoteId: operation.quote.quoteId, result: "settled", now: NOW + 3 })
  }
  return fundingRailTransitionB(operation, { type: "STATUS", operationId: operation.operationId, quoteId: operation.quote.quoteId, result: "settled", now: NOW + 3 })
}

test("each adopted rail produces a complete sample receipt with exact currency and fee units", () => {
  for (const [rail, method] of [["krw_bank", undefined], ["card_wallet", "card"], ["card_wallet", "apple_pay"], ["digital_dollar", undefined]] as const) {
    const result = settled(rail, method)
    expect(result.phase).toBe("settled")
    expect(isFundingRailReceiptB(result.receipt)).toBe(true)
    expect(result.receipt!.creditKrw).toBe(30_000)
    expect(result.receipt!.sourceCurrency).toBe(rail === "digital_dollar" ? "USD" : "KRW")
    expect(result.receipt!.feeMinor).toBe(rail === "krw_bank" ? 0 : rail === "card_wallet" ? 300 : 25)
    expect(result.receipt!.sourceAmountMinor).toBe(rail === "krw_bank" ? 30_000 : rail === "card_wallet" ? 30_300 : 2_025)
    expect(result.receipt!.externalEffect).toBe("none")
  }
})

test("no amount moves before consent or against a replaced quote", () => {
  const initial = quote()
  expect(fundingRailTransitionB(initial, { type: "AUTHORIZE", quoteId: initial.quote.quoteId, consent: true, outcome: "settled", now: NOW + 1 })).toBe(initial)
  const reviewed = fundingRailTransitionB(initial, { type: "REVIEW", now: NOW + 1 })
  expect(fundingRailTransitionB(reviewed, { type: "AUTHORIZE", quoteId: reviewed.quote.quoteId, consent: false, outcome: "settled", now: NOW + 2 })).toBe(reviewed)
  expect(fundingRailTransitionB(reviewed, { type: "AUTHORIZE", quoteId: "old-quote", consent: true, outcome: "settled", now: NOW + 2 })).toBe(reviewed)
  expect(initial.receipt).toBeNull()
})

test("cancel before submission adds no receipt; cancel after submission stays unresolved", () => {
  const cancelled = fundingRailTransitionB(quote(), { type: "CANCEL", now: NOW + 1 })
  expect(cancelled.phase).toBe("cancelled")
  expect(cancelled.receipt).toBeNull()
  const sent = pending()
  const unresolved = fundingRailTransitionB(sent, { type: "CANCEL", now: NOW + 3 })
  expect(unresolved.phase).toBe("unknown")
  expect(unresolved.operationId).toBe(sent.operationId)
  expect(fundingRailTransitionB(unresolved, { type: "RETRY", now: NOW + 4 })).toBe(unresolved)
  expect(fundingRailTransitionB(unresolved, { type: "AUTHORIZE", quoteId: sent.quote.quoteId, consent: true, outcome: "settled", now: NOW + 4 })).toBe(unresolved)
})

test("status checks and old callbacks bind both operation and quote identity", () => {
  const sent = pending()
  expect(fundingRailTransitionB(sent, { type: "STATUS", operationId: "different-operation", quoteId: sent.quote.quoteId, result: "settled", now: NOW + 3 })).toBe(sent)
  expect(fundingRailTransitionB(sent, { type: "STATUS", operationId: sent.operationId, quoteId: "old-quote", result: "settled", now: NOW + 3 })).toBe(sent)
  const failure = fundingRailTransitionB(sent, { type: "STATUS", operationId: sent.operationId, quoteId: sent.quote.quoteId, result: "failed", now: NOW + 3 })
  const retry = fundingRailTransitionB(failure, { type: "RETRY", now: NOW + 4 })
  expect(retry.operationId).toBe(sent.operationId)
  expect(retry.quote.quoteId).not.toBe(sent.quote.quoteId)
  expect(fundingRailTransitionB(retry, { type: "STATUS", operationId: sent.operationId, quoteId: sent.quote.quoteId, result: "settled", now: NOW + 5 })).toBe(retry)
})

test("an expired unsubmitted quote is renewed, while a submitted operation can settle after quote expiry", () => {
  const initial = quote()
  const expired = fundingRailTransitionB(initial, { type: "REVIEW", now: NOW + FUNDING_QUOTE_TTL_MS_B })
  expect(expired.phase).toBe("expired")
  expect(fundingRailTransitionB(expired, { type: "RETRY", now: NOW + FUNDING_QUOTE_TTL_MS_B + 1 }).phase).toBe("quoted")
  const sent = pending()
  expect(fundingRailTransitionB(sent, { type: "STATUS", operationId: sent.operationId, quoteId: sent.quote.quoteId, result: "settled", now: NOW + FUNDING_QUOTE_TTL_MS_B + 1 }).phase).toBe("settled")
})

test("serialized unresolved operations resume by status, malformed amount/receipt cannot restore", () => {
  const sent = pending("digital_dollar", "unknown")
  const unknown = fundingRailTransitionB(sent, { type: "SOURCE_STATUS", operationId: sent.operationId, quoteId: sent.quote.quoteId, result: "unknown", now: NOW + 3 })
  expect(readFundingRailB(JSON.stringify(unknown), NOW + 4)).toEqual(unknown)
  expect(readFundingRailB(JSON.stringify({ ...unknown, quote: { ...unknown.quote, creditKrw: 999_999 } }), NOW + 4)).toBeNull()
  const paid = settled()
  expect(readFundingRailB(JSON.stringify(paid), NOW + 4)).toEqual(paid)
  expect(readFundingRailB(JSON.stringify({ ...paid, receipt: { ...paid.receipt, feeMinor: 90 } }), NOW + 4)).toBeNull()
})

test("only a live settled receipt credits balance; duplicate callbacks and refunds do not duplicate top-ups", () => {
  const result = settled()
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-FUNDING-CONTRACT" })!
  const execution = reviewFixture(authority, { outcome: "success", value: result.receipt!, now: new Date(NOW + 3) })
  const initial = createStableCommerceBState()
  expect(creditStableCommerceFundingB(initial, execution, {}, NOW + 4)).toBeNull()
  expect(creditStableCommerceFundingB(initial, JSON.parse(JSON.stringify(execution)), { allowReviewFixture: true }, NOW + 4)).toBeNull()
  const credited = creditStableCommerceFundingB(initial, execution, { allowReviewFixture: true }, NOW + 4)!
  expect(stableCommerceBalanceB(credited)).toBe(90)
  expect(creditStableCommerceFundingB(credited, execution, { allowReviewFixture: true }, NOW + 4)).toBe(credited)
  const mismatch = reviewFixture(authority, { outcome: "success", value: { ...result.receipt!, settledAt: NOW + 4 } })
  expect(creditStableCommerceFundingB(credited, mismatch, { allowReviewFixture: true }, NOW + 4)).toBeNull()
  expect(stableCommerceBalanceB(stableCommerceBReducer(credited, { type: "REFUND" }))).toBe(90)
  expect(stableCommerceBalanceB(stableCommerceBReducer(credited, { type: "RESET" }))).toBe(60)
})
