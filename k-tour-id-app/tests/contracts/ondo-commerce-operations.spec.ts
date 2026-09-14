import { expect, test } from "@playwright/test"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import { createIntegrationDemoEngineB, integrationLedgerSnapshotB } from "../../features/ondo/integration-demo-b/integration-demo-model-b"
import { createStableCommerceBState, createStableCommerceBLockedQuote, stableCommerceBReducer as reduce, stableCommerceBalanceB, stableCommerceHeldKrwB, stableCommerceRefundableKrwB, stableCommerceRefundedKrwB, STABLE_B_PAYMENT_OPERATION_ID, type StableCommerceBState, type CommerceSampleResponseB } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = Date.parse("2026-09-09T03:00:00Z")
function response(stage: CommerceSampleResponseB["stage"], outcome: string, amountKrw = 19000, operationId = STABLE_B_PAYMENT_OPERATION_ID) {
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-ADVANCED-COMMERCE" })!
  return reviewFixture(authority, { outcome: "success", value: { operationId, stage, outcome, amountKrw }, now: new Date(NOW) })
}
function confirm() {
  const state = reduce(createStableCommerceBState(), { type: "ACCEPT_BENEFIT" })
  return reduce(state, { type: "CONFIRM", quote: createStableCommerceBLockedQuote(state, new Date(NOW + 60_000)) })
}
function authorize(state = confirm(), outcome: "success" | "failure" | "unknown" = "success") {
  return reduce(state, { type: "AUTHORIZE_PAYMENT", outcome, now: NOW, execution: response("authorization", outcome) })
}
function paid() { return reduce(reduce(authorize(), { type: "CAPTURE_REQUEST" }), { type: "PAYMENT_RETURN", outcome: "success" }) }
function request(state: StableCommerceBState, amountKrw: number, id = "sample-refund:a") { return reduce(state, { type: "REFUND_REQUEST", operationId: id, amountKrw, now: NOW }) }
function result(state: StableCommerceBState, outcome: "success" | "failure" | "unknown" = "success", id = "sample-refund:a") {
  const amount = state.refundOperations!.find(item => item.operationId === id)!.amountKrw
  return reduce(state, { type: "REFUND_RESULT", operationId: id, outcome, now: NOW + 1, execution: response("refund", outcome, amount, id) })
}

test("authorization is a hold, never a capture, voucher redemption or settlement", () => {
  const state = authorize()
  expect(state.status).toBe("idle")
  expect(state.ledger).toEqual([])
  expect(stableCommerceBalanceB(state)).toBe(60)
  expect(stableCommerceHeldKrwB(state)).toBe(19000)
  expect(state.voucher).toBe("selected")
  expect(reduce(state, { type: "PAYMENT_RETURN", outcome: "success" })).toBe(state)
  const engine = createIntegrationDemoEngineB(true, () => "auth")
  engine.sync({ credential: null, walletReady: false, commerce: state }, NOW)
  expect(engine.read().events.map(event => event.eventType)).toEqual(["PaymentAuthorized"])
  expect(engine.beginSettlement({ credential: null, walletReady: false, commerce: state })).toBeNull()
})

test("only the exact live sample response can approve an authorization", () => {
  const state = confirm()
  for (const execution of [JSON.parse(JSON.stringify(response("authorization", "success"))), response("capture", "success"), response("authorization", "success", 22000), response("authorization", "failure")]) {
    expect(reduce(state, { type: "AUTHORIZE_PAYMENT", outcome: "success", now: NOW, execution })).toBe(state)
  }
  expect(reduce(state, { type: "AUTHORIZE_PAYMENT", outcome: "success", now: NOW + 60001, execution: response("authorization", "success") })).toBe(state)
})

test("unknown approval cannot be retried, voided or charged before querying its operation", () => {
  const state = authorize(confirm(), "unknown")
  for (const action of [{ type: "CANCEL_CONFIRMATION" }, { type: "VOID_AUTHORIZATION" }, { type: "CAPTURE_REQUEST" }, { type: "PAYMENT_RETURN", outcome: "success" }] as const) expect(reduce(state, action)).toBe(state)
  const engine = createIntegrationDemoEngineB(true)
  engine.sync({ credential: null, walletReady: false, commerce: state }, NOW)
  expect(engine.read().events).toEqual([])
  const resolved = reduce(state, { type: "PAYMENT_STATUS", outcome: "success", now: NOW + 1, execution: response("authorization", "success") })
  expect(resolved.paymentOperation?.phase).toBe("authorized")
  expect(resolved.paymentOperation?.operationId).toBe(state.paymentOperation?.operationId)
  expect(stableCommerceBalanceB(resolved)).toBe(60)
})

test("capture failure retries the same authorization and duplicate success cannot double debit", () => {
  const pending = reduce(authorize(), { type: "CAPTURE_REQUEST" })
  const failed = reduce(pending, { type: "CAPTURE_RESULT", outcome: "failure", execution: response("capture", "failure") })
  expect(stableCommerceBalanceB(failed)).toBe(60)
  expect(stableCommerceHeldKrwB(failed)).toBe(19000)
  const captured = reduce(reduce(failed, { type: "CAPTURE_REQUEST" }), { type: "PAYMENT_RETURN", outcome: "success" })
  expect(captured.paymentOperation?.captureAttempts).toBe(2)
  expect(captured.paymentOperation?.phase).toBe("settled")
  expect(stableCommerceBalanceB(captured)).toBe(41)
  expect(captured.ledger).toHaveLength(2)
  expect(reduce(captured, { type: "PAYMENT_RETURN", outcome: "success" })).toBe(captured)
  expect(stableCommerceHeldKrwB(captured)).toBe(0)
})

test("capture unknown queries the same attempt, while a known authorization can be voided", () => {
  const pending = reduce(authorize(), { type: "CAPTURE_REQUEST" })
  const unknown = reduce(pending, { type: "CAPTURE_RESULT", outcome: "unknown", execution: response("capture", "unknown") })
  expect(reduce(unknown, { type: "CAPTURE_REQUEST" })).toBe(unknown)
  const queried = reduce(unknown, { type: "PAYMENT_STATUS", outcome: "success", now: NOW + 1, execution: response("capture", "success") })
  expect(queried.paymentOperation?.captureAttempts).toBe(1)
  expect(reduce(queried, { type: "PAYMENT_RETURN", outcome: "success" }).receiptCount).toBe(1)
  const voided = reduce(authorize(), { type: "VOID_AUTHORIZATION" })
  expect(stableCommerceHeldKrwB(voided)).toBe(0)
  expect(voided.lockedQuote).toBeNull()
  expect(voided.ledger).toEqual([])
})

test("whole-won partial refunds preserve used benefits until the captured amount is fully refunded", () => {
  const first = result(request(paid(), 9501))
  expect(first.status).toBe("paid")
  expect(stableCommerceRefundedKrwB(first)).toBe(9501)
  expect(stableCommerceRefundableKrwB(first)).toBe(9499)
  expect(stableCommerceBalanceB(first)).toBe(50.501)
  expect(first.voucher).toBe("consumed")
  expect(first.redemptionCount).toBe(1)
  const final = result(request(first, 9499, "sample-refund:b"), "success", "sample-refund:b")
  expect(final.status).toBe("refunded")
  expect(final.refundCount).toBe(2)
  expect(final.voucher).toBe("available")
  expect(final.redemptionCount).toBe(0)
  expect(final.ledger).toHaveLength(6)
  expect(stableCommerceBalanceB(final)).toBe(60)
  expect(integrationLedgerSnapshotB(final)).toMatchObject({ balanced: true, paymentKrw: 19000, refundKrw: 19000, merchantNetKrw: 0 })
})

test("failed and unknown refunds never credit money, and retries retain operation identity", () => {
  const pending = request(paid(), 5000)
  const unknown = result(pending, "unknown")
  expect(stableCommerceBalanceB(unknown)).toBe(41)
  expect(request(unknown, 5000, "sample-refund:b")).toBe(unknown)
  expect(reduce(unknown, { type: "REFUND" })).toBe(unknown)
  const failed = result(unknown, "failure")
  expect(failed.ledger).toHaveLength(2)
  const retry = reduce(failed, { type: "REFUND_RETRY", operationId: "sample-refund:a" })
  expect(retry.refundOperations?.[0]).toMatchObject({ operationId: "sample-refund:a", attempts: 2, phase: "pending" })
  const settled = result(retry)
  expect(result(settled)).toBe(settled)
  expect(stableCommerceBalanceB(settled)).toBe(46)
  expect(settled.refundCount).toBe(1)
})

test("refund request bounds and response binding cannot be bypassed", () => {
  const state = paid()
  for (const amount of [0, -1, 0.5, 19001, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(request(state, amount)).toBe(state)
  const pending = request(state, 5000)
  const bad = response("refund", "success", 6000, "sample-refund:a")
  expect(reduce(pending, { type: "REFUND_RESULT", operationId: "sample-refund:a", outcome: "success", now: NOW + 1, execution: bad })).toBe(pending)
  const copied = JSON.parse(JSON.stringify(response("refund", "success", 5000, "sample-refund:a")))
  expect(reduce(pending, { type: "REFUND_RESULT", operationId: "sample-refund:a", outcome: "success", now: NOW + 1, execution: copied })).toBe(pending)
  const first = result(pending)
  expect(request(first, 14001, "sample-refund:b")).toBe(first)
  expect(request(first, 1000, "sample-refund:a")).toBe(first)
})

test("partial refunds stale the earlier settlement and never duplicate authorization/redemption events", () => {
  const engine = createIntegrationDemoEngineB(true, (() => { let n = 0; return () => String(++n) })())
  const state = paid()
  const snapshot = { credential: null, walletReady: false, commerce: state }
  engine.sync(snapshot, NOW)
  engine.beginSettlement(snapshot)
  engine.finishSettlement(snapshot, "success", NOW)
  const partial = result(request(state, 4321))
  const changed = { ...snapshot, commerce: partial }
  engine.sync(changed, NOW + 1)
  expect(engine.read().settlement?.phase).toBe("mismatched")
  expect(engine.beginSettlement(changed)).toMatchObject({ refundKrw: 4321, merchantNetKrw: 14679 })
  engine.finishSettlement(changed, "success", NOW + 2)
  expect(engine.read().events.filter(item => item.eventType === "PaymentAuthorized")).toHaveLength(1)
  expect(engine.read().events.filter(item => item.eventType === "VoucherRedeemed")).toHaveLength(1)
  const corrupted = { ...partial, ledger: partial.ledger.map((row, index) => index === 3 ? { ...row, amount: -4.322 } : row) }
  expect(integrationLedgerSnapshotB(corrupted)?.balanced).toBe(false)
})

test("legacy immediate payment and full-refund compatibility uses the same balanced ledger", () => {
  const state = reduce(confirm(), { type: "PAYMENT_RETURN", outcome: "success" })
  const refunded = reduce(state, { type: "REFUND" })
  expect(refunded.status).toBe("refunded")
  expect(refunded.refundCount).toBe(1)
  expect(integrationLedgerSnapshotB(refunded)).toMatchObject({ balanced: true, refundKrw: 19000, merchantNetKrw: 0 })
  expect(reduce(refunded, { type: "REFUND" })).toBe(refunded)
})
