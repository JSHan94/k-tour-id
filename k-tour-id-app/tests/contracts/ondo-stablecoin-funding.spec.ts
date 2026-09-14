import { expect, test } from "@playwright/test"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import {
  createFundingRailB, fundingRailTransitionB, readFundingRailB, isFundingRailReceiptB,
  stablecoinCanAuthorizeB, stablecoinHasSubmittedB, FUNDING_QUOTE_TTL_MS_B,
  type FundingRailOperationB, type FundingRailReceiptB, type FundingSampleOutcomeB, type StablecoinAssetB,
} from "../../features/ondo/commerce-b/funding-rail-model-b"
import { createStableCommerceBState, creditStableCommerceFundingB, stableCommerceBalanceB } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = Date.parse("2026-09-09T08:00:00Z")
let serial = 0
const quote = (asset: StablecoinAssetB = "USDC", creditKrw = 30_000) => createFundingRailB({ operationId: `demo-fund:stablecoin-${++serial}`, rail: "digital_dollar", creditKrw, asset, now: NOW })
const connect = (op: FundingRailOperationB) => fundingRailTransitionB(op, { type: "CONNECT_SIGNER", method: "zklogin", result: "ready", now: NOW + 1 })
function authorize(op = quote()) {
  op = connect(op)
  op = fundingRailTransitionB(op, { type: "REVIEW", now: NOW + 2 })
  return fundingRailTransitionB(op, { type: "AUTHORIZE", quoteId: op.quote.quoteId, consent: true, outcome: "settled", now: NOW + 3 })
}
const status = (op: FundingRailOperationB, type: "SOURCE_STATUS" | "DESTINATION_STATUS" | "STATUS", result: FundingSampleOutcomeB, now = NOW + 4) => fundingRailTransitionB(op, { type, operationId: op.operationId, quoteId: op.quote.quoteId, result, now })
const settle = (op = authorize()) => status(status(op, "SOURCE_STATUS", "settled"), "DESTINATION_STATUS", "settled", NOW + 5)
const execute = (receipt: FundingRailReceiptB) => reviewFixture(createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-STABLECOIN-FUNDING" })!, { outcome: "success", value: receipt, now: new Date(NOW + 6) })
const credit = (receipt: FundingRailReceiptB) => creditStableCommerceFundingB(createStableCommerceBState(), execute(receipt), { allowReviewFixture: true }, NOW + 6)

test("USDC and USDT quotes disclose integer token units and never claim a deployed coin type", () => {
  for (const asset of ["USDC", "USDT"] as const) for (const creditKrw of [15_000, 30_000, 60_000]) {
    const op = quote(asset, creditKrw)
    expect(op.quote.stablecoinAsset).toBe(asset)
    expect(op.stablecoin).toMatchObject({ asset, network: "sui:testnet", decimals: 6, sourceBalanceAtomic: 100_000_000, feeAtomic: 250_000, coinRepresentation: "sample-token-not-native-or-wrapped", coinType: `sample:sui:testnet:${asset}` })
    expect(op.stablecoin!.sourceAmountAtomic).toBe(creditKrw / 1_500 * 1_000_000 + 250_000)
    expect(Number.isSafeInteger(op.stablecoin!.sourceAmountAtomic)).toBe(true)
    expect(op.stablecoin!.coinType).not.toMatch(/^0x/)
    expect(op.receipt).toBeNull()
  }
})

test("a separate sample signer capability is required before review or authorization", () => {
  const initial = quote()
  expect(stablecoinCanAuthorizeB(initial)).toBe(false)
  expect(fundingRailTransitionB(initial, { type: "REVIEW", now: NOW + 1 })).toBe(initial)
  const pretendReview = { ...initial, phase: "authorize" as const }
  expect(fundingRailTransitionB(pretendReview, { type: "AUTHORIZE", quoteId: initial.quote.quoteId, consent: true, outcome: "settled", now: NOW + 1 })).toBe(pretendReview)
  const ready = connect(initial)
  expect(stablecoinCanAuthorizeB(ready)).toBe(true)
  expect(ready.stablecoin!.signerStatus).toBe("ready")
  // Connecting alone does not sign, prove DID eligibility, or move money.
  expect(ready.phase).toBe("quoted")
  expect(stablecoinHasSubmittedB(ready)).toBe(false)
  expect(ready.receipt).toBeNull()
  expect(ready.stablecoin!.authorizationQuoteId).toBeNull()
})

test("connection failure and wrong-network routes recover without authorization", () => {
  for (const result of ["failed", "wrong_network"] as const) {
    const failed = fundingRailTransitionB(quote(), { type: "CONNECT_SIGNER", method: "existing_wallet", result, now: NOW + 1 })
    expect(failed.stablecoin!.signerStatus).toBe(result)
    expect(fundingRailTransitionB(failed, { type: "REVIEW", now: NOW + 2 })).toBe(failed)
    expect(failed.receipt).toBeNull()
    const recovered = fundingRailTransitionB(failed, { type: "CONNECT_SIGNER", method: "existing_wallet", result: "ready", now: NOW + 3 })
    expect(recovered.quote.quoteId).toBe(failed.quote.quoteId)
    expect(stablecoinCanAuthorizeB(recovered)).toBe(true)
  }
})

test("insufficient sample token balance blocks review and can be repaired before submission", () => {
  const empty = fundingRailTransitionB(connect(quote()), { type: "SAMPLE_SOURCE_BALANCE", amountAtomic: 0, now: NOW + 2 })
  expect(stablecoinCanAuthorizeB(empty)).toBe(false)
  expect(fundingRailTransitionB(empty, { type: "REVIEW", now: NOW + 3 })).toBe(empty)
  const restored = fundingRailTransitionB(empty, { type: "SAMPLE_SOURCE_BALANCE", amountAtomic: 100_000_000, now: NOW + 3 })
  expect(stablecoinCanAuthorizeB(restored)).toBe(true)
  const sent = authorize()
  expect(fundingRailTransitionB(sent, { type: "SAMPLE_SOURCE_BALANCE", amountAtomic: 0, now: NOW + 4 })).toBe(sent)
})

test("changing asset replaces the quote and clears consent while keeping the sample connection", () => {
  const reviewed = fundingRailTransitionB(connect(quote()), { type: "REVIEW", now: NOW + 2 })
  const changed = fundingRailTransitionB(reviewed, { type: "SELECT_ASSET", asset: "USDT", now: NOW + 3 })
  expect(changed.phase).toBe("quoted")
  expect(changed.quote.quoteId).not.toBe(reviewed.quote.quoteId)
  expect(changed.stablecoin).toMatchObject({ asset: "USDT", signerStatus: "ready", authorizationQuoteId: null, sourceStatus: "not_submitted" })
  const secondReview = fundingRailTransitionB(changed, { type: "REVIEW", now: NOW + 4 })
  expect(fundingRailTransitionB(secondReview, { type: "AUTHORIZE", quoteId: reviewed.quote.quoteId, consent: true, outcome: "settled", now: NOW + 5 })).toBe(secondReview)
  expect(fundingRailTransitionB(secondReview, { type: "AUTHORIZE", quoteId: changed.quote.quoteId, consent: false, outcome: "settled", now: NOW + 5 })).toBe(secondReview)
  const sent = authorize()
  expect(fundingRailTransitionB(sent, { type: "SELECT_ASSET", asset: "USDT", now: NOW + 4 })).toBe(sent)
})

test("expired quotes cannot be signed and amount changes require a fresh signer preparation", () => {
  const reviewed = fundingRailTransitionB(connect(quote("USDT")), { type: "REVIEW", now: NOW + 2 })
  const expired = fundingRailTransitionB(reviewed, { type: "AUTHORIZE", quoteId: reviewed.quote.quoteId, consent: true, outcome: "settled", now: NOW + FUNDING_QUOTE_TTL_MS_B })
  expect(expired.phase).toBe("expired")
  expect(stablecoinHasSubmittedB(expired)).toBe(false)
  const renewed = fundingRailTransitionB(expired, { type: "RETRY", now: NOW + FUNDING_QUOTE_TTL_MS_B + 1 })
  expect(renewed.quote.quoteId).not.toBe(expired.quote.quoteId)
  expect(renewed.stablecoin).toMatchObject({ asset: "USDT", signerStatus: "disconnected", authorizationQuoteId: null })
  const edited = createFundingRailB({ operationId: reviewed.operationId, rail: "digital_dollar", asset: "USDT", creditKrw: 60_000, attempt: reviewed.attempt + 1, now: NOW + 3 })
  expect(edited.stablecoin!.signerStatus).toBe("disconnected")
})

test("a generic status callback or an early destination callback cannot settle stablecoin funding", () => {
  const sent = authorize()
  expect(sent.stablecoin).toMatchObject({ stage: "source_pending", sourceStatus: "pending", destinationStatus: "not_started", authorizationQuoteId: sent.quote.quoteId })
  for (const result of ["settled", "failed", "unknown"] as const) expect(status(sent, "STATUS", result)).toBe(sent)
  expect(status(sent, "DESTINATION_STATUS", "settled")).toBe(sent)
  expect(sent.receipt).toBeNull()
})

test("source confirmation alone does not credit KRW; destination confirmation is separately required", () => {
  const source = status(authorize(), "SOURCE_STATUS", "settled")
  expect(source.phase).toBe("pending")
  expect(source.stablecoin).toMatchObject({ stage: "destination_pending", sourceStatus: "confirmed", destinationStatus: "pending" })
  expect(source.receipt).toBeNull()
  expect(credit(source.receipt!)).toBeNull()
  expect(status(source, "STATUS", "settled", NOW + 5)).toBe(source)
  const complete = status(source, "DESTINATION_STATUS", "settled", NOW + 5)
  expect(complete.phase).toBe("settled")
  expect(complete.stablecoin).toMatchObject({ stage: "settled", sourceStatus: "confirmed", destinationStatus: "confirmed" })
  expect(isFundingRailReceiptB(complete.receipt)).toBe(true)
  expect(stableCommerceBalanceB(credit(complete.receipt!)!)).toBe(90)
})

test("both coin choices produce a flat immutable-compatible receipt with explicit sample references", () => {
  for (const asset of ["USDC", "USDT"] as const) {
    const op = settle(authorize(quote(asset)))
    expect(op.receipt).toMatchObject({ stablecoinAsset: asset, stablecoinNetwork: "sui:testnet", stablecoinDecimals: 6, stablecoinAmountAtomic: 20_250_000, stablecoinFeeAtomic: 250_000, executionTruth: "FIXTURE_REVIEW", externalEffect: "none" })
    expect(op.receipt!.stablecoinSourceReference).toBe(`demo-source:${op.quote.quoteId}`)
    expect(op.receipt!.stablecoinDestinationReference).toBe(`demo-destination:${op.quote.quoteId}`)
    expect(Object.values(op.receipt!).every(value => value === null || typeof value !== "object")).toBe(true)
    expect(readFundingRailB(JSON.stringify(op), NOW + 6)).toEqual(op)
  }
})

test("source failure can create a new quote, but an old callback cannot affect that retry", () => {
  const failed = status(authorize(quote("USDT")), "SOURCE_STATUS", "failed")
  expect(failed.phase).toBe("failed")
  expect(failed.stablecoin!.sourceStatus).toBe("failed")
  expect(failed.receipt).toBeNull()
  const retry = fundingRailTransitionB(failed, { type: "RETRY", now: NOW + 5 })
  expect(retry.operationId).toBe(failed.operationId)
  expect(retry.quote.quoteId).not.toBe(failed.quote.quoteId)
  expect(retry.stablecoin).toMatchObject({ asset: "USDT", signerStatus: "disconnected", sourceStatus: "not_submitted" })
  expect(fundingRailTransitionB(retry, { type: "SOURCE_STATUS", quoteId: failed.quote.quoteId, operationId: failed.operationId, result: "settled", now: NOW + 6 })).toBe(retry)
})

test("destination delay or failure retains the source operation and cannot replay its debit", () => {
  for (const result of ["failed", "unknown"] as const) {
    const source = status(authorize(), "SOURCE_STATUS", "settled")
    const waiting = status(source, "DESTINATION_STATUS", result, NOW + 5)
    expect(waiting.phase).toBe("unknown")
    expect(waiting.stablecoin!.destinationStatus).toBe(result)
    expect(waiting.receipt).toBeNull()
    expect(fundingRailTransitionB(waiting, { type: "RETRY", now: NOW + 6 })).toBe(waiting)
    expect(status(waiting, "SOURCE_STATUS", "settled", NOW + 6)).toBe(waiting)
    const resumed = readFundingRailB(JSON.stringify(waiting), NOW + 6)!
    expect(resumed).toEqual(waiting)
    const done = status(resumed, "DESTINATION_STATUS", "settled", NOW + 7)
    expect(done.operationId).toBe(source.operationId)
    expect(done.quote.quoteId).toBe(source.quote.quoteId)
    expect(done.stablecoin!.sourceReference).toBe(source.stablecoin!.sourceReference)
    expect(done.stablecoin!.sourceConfirmedAt).toBe(source.stablecoin!.sourceConfirmedAt)
  }
})

test("closing an unsubmitted signature cancels safely; submitted close preserves an unresolved operation", () => {
  const reviewed = fundingRailTransitionB(connect(quote()), { type: "REVIEW", now: NOW + 2 })
  const declined = fundingRailTransitionB(reviewed, { type: "CANCEL", now: NOW + 3 })
  expect(declined.phase).toBe("cancelled")
  expect(stablecoinHasSubmittedB(declined)).toBe(false)
  for (const op of [authorize(), status(authorize(), "SOURCE_STATUS", "settled")]) {
    const closed = fundingRailTransitionB(op, { type: "CANCEL", now: NOW + 5 })
    expect(closed.phase).toBe("unknown")
    expect(closed.quote.quoteId).toBe(op.quote.quoteId)
    expect(closed.receipt).toBeNull()
    expect(readFundingRailB(JSON.stringify(closed), NOW + 6)).toEqual(closed)
    expect(fundingRailTransitionB(closed, { type: "RETRY", now: NOW + 6 })).toBe(closed)
  }
})

test("unknown source resumes the same operation and can finish after quote expiration", () => {
  const waiting = status(authorize(), "SOURCE_STATUS", "unknown")
  const resumed = readFundingRailB(JSON.stringify(waiting), NOW + FUNDING_QUOTE_TTL_MS_B + 1)!
  expect(resumed.phase).toBe("unknown")
  expect(resumed.quote.quoteId).toBe(waiting.quote.quoteId)
  const source = status(resumed, "SOURCE_STATUS", "settled", NOW + FUNDING_QUOTE_TTL_MS_B + 2)
  expect(source.receipt).toBeNull()
  const settled = status(source, "DESTINATION_STATUS", "settled", NOW + FUNDING_QUOTE_TTL_MS_B + 3)
  expect(settled.phase).toBe("settled")
})

test("source and destination callbacks bind both operation and quote and ignore older timestamps", () => {
  for (const [op, type] of [[authorize(), "SOURCE_STATUS"], [status(authorize(), "SOURCE_STATUS", "settled"), "DESTINATION_STATUS"]] as const) {
    for (const identity of [{ operationId: "demo-fund:different-operation", quoteId: op.quote.quoteId }, { operationId: op.operationId, quoteId: `${op.operationId}:q99` }]) {
      expect(fundingRailTransitionB(op, { type, ...identity, result: "settled", now: NOW + 5 })).toBe(op)
    }
    expect(status(op, type, "settled", NOW)).toBe(op)
  }
})

test("duplicate source, destination and balance callbacks never credit twice", () => {
  const source = status(authorize(), "SOURCE_STATUS", "settled")
  expect(status(source, "SOURCE_STATUS", "settled", NOW + 5)).toBe(source)
  const op = status(source, "DESTINATION_STATUS", "settled", NOW + 5)
  expect(status(op, "DESTINATION_STATUS", "settled", NOW + 6)).toBe(op)
  expect(status(op, "SOURCE_STATUS", "failed", NOW + 6)).toBe(op)
  const execution = execute(op.receipt!)
  const credited = creditStableCommerceFundingB(createStableCommerceBState(), execution, { allowReviewFixture: true }, NOW + 6)!
  expect(creditStableCommerceFundingB(credited, execution, { allowReviewFixture: true }, NOW + 6)).toBe(credited)
  expect(credited.fundingCredits).toHaveLength(1)
  expect(stableCommerceBalanceB(credited)).toBe(90)
  expect(Object.isFrozen(credited.fundingCredits[0])).toBe(true)
  const conflicting = execute({ ...op.receipt!, stablecoinSignerMethod: "existing_wallet" })
  expect(creditStableCommerceFundingB(credited, conflicting, { allowReviewFixture: true }, NOW + 6)).toBeNull()
})

test("malformed token fields, unsupported representations and fabricated hashes cannot credit", () => {
  const receipt = settle().receipt!
  for (const patch of [
    { stablecoinAsset: "DAI" }, { stablecoinNetwork: "sui:mainnet" }, { stablecoinDecimals: 18 },
    { stablecoinAmountAtomic: 20_250_000.1 }, { stablecoinFeeAtomic: 0 }, { stablecoinCoinType: "0x2::coin::USDC" },
    { stablecoinRepresentation: "native" }, { stablecoinSignerMethod: "did" }, { stablecoinSourceReference: "0x123" },
    { stablecoinDestinationReference: "tx-confirmed" }, { stablecoinSourceConfirmedAt: NOW + 7 },
    { stablecoinDestinationConfirmedAt: NOW + 4 }, { externalEffect: "settled" }, { extraProviderData: "fake" },
  ]) {
    const malformed = { ...receipt, ...patch } as FundingRailReceiptB
    expect(isFundingRailReceiptB(malformed)).toBe(false)
    expect(credit(malformed)).toBeNull()
  }
})

test("legacy generic digital-dollar operations and receipts cannot silently become stablecoin success", () => {
  const fresh = quote()
  const oldQuote = { ...fresh.quote }
  delete oldQuote.stablecoinAsset
  delete oldQuote.stablecoinNetwork
  const { stablecoin: _coin, ...legacy } = fresh
  expect(readFundingRailB(JSON.stringify({ ...legacy, quote: oldQuote }), NOW + 1)).toBeNull()
  const receipt = settle().receipt!
  const oldReceipt = Object.fromEntries(Object.entries(receipt).filter(([key]) => !key.startsWith("stablecoin")))
  expect(isFundingRailReceiptB(oldReceipt)).toBe(false)
  expect(readFundingRailB(JSON.stringify({ ...legacy, quote: oldQuote, phase: "settled", receipt: oldReceipt, updatedAt: NOW + 5 }), NOW + 6)).toBeNull()
})

test("restoration rejects forged source confirmation, changed asset, amount, connection and callback identity", () => {
  const source = status(authorize(), "SOURCE_STATUS", "settled")
  for (const patch of [
    { asset: "USDT" }, { sourceAmountAtomic: 1 }, { sourceBalanceAtomic: 0 }, { signerStatus: "wrong_network" },
    { authorizationQuoteId: "old" }, { sourceReference: "fake" }, { sourceStatus: "pending" },
    { sourceConfirmedAt: NOW + 8 }, { destinationReference: "fake" }, { destinationConfirmedAt: NOW + 4 },
    { coinRepresentation: "native" }, { extra: "ignore-me" },
  ]) expect(readFundingRailB(JSON.stringify({ ...source, stablecoin: { ...source.stablecoin, ...patch } }), NOW + 6)).toBeNull()
  const done = settle()
  expect(readFundingRailB(JSON.stringify({ ...done, receipt: { ...done.receipt, stablecoinSignerMethod: "existing_wallet" } }), NOW + 6)).toBeNull()
})

test("bank and card operation restores remain compatible without stablecoin metadata", () => {
  for (const rail of ["krw_bank", "card_wallet"] as const) {
    const op = createFundingRailB({ operationId: `demo-fund:legacy-${rail.replaceAll("_", "-")}`, rail, creditKrw: 30_000, now: NOW })
    const { stablecoin: _coin, ...legacy } = op
    expect(readFundingRailB(JSON.stringify(legacy), NOW + 1)).toEqual(op)
    expect(fundingRailTransitionB(op, { type: "CONNECT_SIGNER", method: "zklogin", result: "ready", now: NOW + 1 })).toBe(op)
  }
})
