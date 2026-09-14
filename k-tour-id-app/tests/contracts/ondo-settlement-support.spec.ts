import { expect, test } from "@playwright/test"
import { createIntegrationDemoEngineB, integrationSettlementExportB } from "../../features/ondo/integration-demo-b/integration-demo-model-b"
import { createStableCommerceBLockedQuote, createStableCommerceBState, stableCommerceBReducer as reduce, STABLE_B_RECEIPT_ID } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = Date.parse("2026-09-09T06:00:00Z")
function paid() {
  const state = reduce(createStableCommerceBState(), { type: "ACCEPT_BENEFIT" })
  const confirmed = reduce(state, { type: "CONFIRM", quote: createStableCommerceBLockedQuote(state, new Date(Date.now() + 60_000)) })
  return { credential: null, walletReady: true, commerce: reduce(confirmed, { type: "PAYMENT_RETURN", outcome: "success" }) }
}
function engine(enabled = true) { let id = 0; return createIntegrationDemoEngineB(enabled, () => String(++id)) }

test("support requires review and binds retry/query to one request without changing financial state or events", () => {
  const demo = engine(), state = paid(), original = JSON.stringify(state)
  const request = demo.startSupport(state, "payment", NOW)!
  expect(request.phase).toBe("review")
  expect(demo.newSupport(request.operationRef)).toBe(false)
  expect(demo.finishSupport(request.operationRef, "success", NOW)).toBeNull()
  expect(demo.submitSupport(state, "wrong")).toBeNull()
  expect(demo.submitSupport(state, request.operationRef)?.phase).toBe("pending")
  expect(demo.newSupport(request.operationRef)).toBe(false)
  expect(demo.submitSupport(state, request.operationRef)).toBeNull()
  expect(demo.finishSupport(request.operationRef, "failure", NOW + 1)?.phase).toBe("failed")
  expect(demo.newSupport(request.operationRef)).toBe(false)
  expect(demo.submitSupport(state, request.operationRef)?.attempts).toBe(2)
  expect(demo.finishSupport(request.operationRef, "unknown", NOW + 2)?.phase).toBe("unknown")
  expect(demo.newSupport(request.operationRef)).toBe(false)
  expect(demo.cancelSupport(request.operationRef)).toBe(false)
  expect(demo.startSupport(state, "refund", NOW + 3)?.operationRef).toBe(request.operationRef)
  const submitted = demo.finishSupport(request.operationRef, "success", NOW + 4)!
  expect(submitted).toMatchObject({ phase: "submitted", attempts: 2, summary: { paymentKrw: 19000, refundKrw: 0, externalEffect: "none" } })
  expect(demo.finishSupport(request.operationRef, "success", NOW + 5)).toBeNull()
  expect(demo.startSupport(state, "payment", NOW + 6)).toBe(submitted)
  expect(demo.read().support).toBe(submitted)
  expect(demo.read().supportHistory).toHaveLength(1)
  expect(demo.read().supportHistory[0]).toEqual(submitted)
  expect(demo.read().events).toEqual([])
  expect(demo.read().settlement).toBeNull()
  expect(JSON.stringify(state)).toBe(original)
})

test("a refund before consent forces new review; a submitted historical ticket keeps frozen amounts", () => {
  const state = paid(), refunded = { ...state, commerce: reduce(state.commerce, { type: "REFUND" }) }
  const demo = engine()
  const request = demo.startSupport(state, "mismatch", NOW)!
  expect(demo.submitSupport(refunded, request.operationRef)?.phase).toBe("stale")
  expect(demo.newSupport(request.operationRef)).toBe(false)
  const fresh = demo.startSupport(refunded, "refund", NOW + 1)!
  expect(fresh.operationRef).not.toBe(request.operationRef)
  expect(fresh.summary).toMatchObject({ refundKrw: 19000, merchantNetKrw: 0 })
  expect(demo.finishSupport(request.operationRef, "success", NOW + 2)).toBeNull()
  const other = engine(), historical = other.startSupport(state, "payment", NOW)!
  other.submitSupport(state, historical.operationRef)
  other.sync(refunded, NOW + 1)
  expect(other.finishSupport(historical.operationRef, "success", NOW + 2)?.summary).toMatchObject({ refundKrw: 0, merchantNetKrw: 19000 })
  expect(historical.phase).toBe("review")
  expect(Object.isFrozen(historical.summary)).toBe(true)
})

test("sample opt-out and reset erase support authority, while unpaid or malformed ledgers cannot create requests", () => {
  const state = paid(), disabled = engine(false)
  expect(disabled.startSupport(state, "payment", NOW)).toBeNull()
  expect(disabled.submitSupport(state, "sample-support:1")).toBeNull()
  expect(disabled.finishSupport("sample-support:1", "success", NOW)).toBeNull()
  expect(disabled.newSupport("sample-support:1")).toBe(false)
  const demo = engine(), request = demo.startSupport(state, "payment", NOW)!
  demo.submitSupport(state, request.operationRef)
  demo.reset()
  expect(demo.read().support).toBeNull()
  expect(demo.read().supportHistory).toEqual([])
  expect(demo.finishSupport(request.operationRef, "success", NOW + 1)).toBeNull()
  expect(demo.startSupport({ ...state, commerce: createStableCommerceBState() }, "payment", NOW)).toBeNull()
  expect(demo.startSupport({ ...state, commerce: { ...state.commerce, ledger: [] } }, "payment", NOW)).toBeNull()
  expect(demo.startSupport(state, "payment", NaN)).toBeNull()
})

test("download is an allowlisted sample summary, never the internal ledger, revision, credential or visitor details", () => {
  const state = paid(), output = integrationSettlementExportB(state)!
  expect(Object.keys(output).sort()).toEqual(["schemaVersion", "currency", "paymentReceiptRef", "paymentKrw", "refundKrw", "merchantNetKrw", "provenanceTruth", "externalProviderConnected", "externalEffect"].sort())
  expect(output).toMatchObject({ paymentReceiptRef: STABLE_B_RECEIPT_ID, currency: "KRW", paymentKrw: 19000, provenanceTruth: "SIMULATED", externalProviderConnected: false, externalEffect: "none" })
  expect(JSON.stringify(output)).not.toMatch(/revision|ledger|credential|did:|passport|paymentSpent/)
  const forged = { ...state.commerce, receiptId: "private-visitor", ledger: state.commerce.ledger.map(row => ({ ...row, receiptId: "private-visitor" })) }
  expect(integrationSettlementExportB({ ...state, commerce: forged })).toBeNull()
  const demo = engine(), support = demo.startSupport(state, "refund", NOW)!
  expect(JSON.stringify(support)).not.toMatch(/revision|ledger|credential|did:|passport/)
  expect(demo.cancelSupport(support.operationRef)).toBe(true)
  expect(demo.read().support).toBeNull()
})

test("submitted payment inquiry survives refund and a separately consented refund inquiry without duplicate tickets", () => {
  const demo = engine(), state = paid()
  const paymentState = JSON.stringify(state)
  const paymentRequest = demo.startSupport(state, "payment", NOW)!
  demo.submitSupport(state, paymentRequest.operationRef)
  const paymentTicket = demo.finishSupport(paymentRequest.operationRef, "success", NOW + 1)!
  const firstHistory = demo.read().supportHistory
  expect(firstHistory).toHaveLength(1)
  expect(Object.isFrozen(firstHistory)).toBe(true)
  expect(Object.isFrozen(firstHistory[0])).toBe(true)
  expect(Object.isFrozen(firstHistory[0].ticket)).toBe(true)

  const refunded = { ...state, commerce: reduce(state.commerce, { type: "REFUND" }) }
  const refundState = JSON.stringify(refunded)
  demo.sync(refunded, NOW + 2)
  const businessEvents = demo.read().events
  expect(demo.read().support).toBe(paymentTicket)
  expect(demo.newSupport("another-operation")).toBe(false)
  expect(demo.newSupport(paymentRequest.operationRef)).toBe(true)
  expect(demo.newSupport(paymentRequest.operationRef)).toBe(false)
  expect(demo.read().support).toBeNull()
  expect(demo.read().supportHistory).toBe(firstHistory)

  // Opening and cancelling a fresh review do not submit or erase anything.
  const cancelled = demo.startSupport(refunded, "refund", NOW + 3)!
  expect(cancelled).toMatchObject({ phase: "review", attempts: 0, ticket: null, summary: { paymentKrw: 19000, refundKrw: 19000, merchantNetKrw: 0 } })
  expect(demo.finishSupport(cancelled.operationRef, "success", NOW + 4)).toBeNull()
  expect(demo.cancelSupport(cancelled.operationRef)).toBe(true)
  expect(demo.read().supportHistory).toBe(firstHistory)
  const refundRequest = demo.startSupport(refunded, "refund", NOW + 5)!
  expect(refundRequest.operationRef).not.toBe(cancelled.operationRef)
  expect(refundRequest.operationRef).not.toBe(paymentRequest.operationRef)
  expect(demo.submitSupport(refunded, refundRequest.operationRef)?.phase).toBe("pending")
  for (let check = 0; check < 3; check++) {
    expect(demo.finishSupport(refundRequest.operationRef, "unknown", NOW + 6 + check)?.phase).toBe("unknown")
    expect(demo.startSupport(refunded, "payment", NOW + 6 + check)?.operationRef).toBe(refundRequest.operationRef)
    expect(demo.newSupport(refundRequest.operationRef)).toBe(false)
    expect(demo.read().supportHistory).toBe(firstHistory)
  }
  const refundTicket = demo.finishSupport(refundRequest.operationRef, "success", NOW + 9)!
  expect(refundTicket.ticket?.ticketRef).not.toBe(paymentTicket.ticket?.ticketRef)
  const history = demo.read().supportHistory
  expect(history).toHaveLength(2)
  expect(history[0]).toBe(firstHistory[0])
  expect(history[0]).toMatchObject({ reason: "payment", summary: { refundKrw: 0, merchantNetKrw: 19000 } })
  expect(history[1]).toMatchObject({ reason: "refund", summary: { refundKrw: 19000, merchantNetKrw: 0 } })
  for (let check = 0; check < 3; check++) {
    expect(demo.finishSupport(refundRequest.operationRef, "success", NOW + 10 + check)).toBeNull()
    expect(demo.finishSupport(paymentRequest.operationRef, "success", NOW + 10 + check)).toBeNull()
    expect(demo.read().supportHistory).toBe(history)
  }
  expect(demo.read().events).toBe(businessEvents)
  expect(demo.read().settlement).toBeNull()
  expect(JSON.stringify(state)).toBe(paymentState)
  expect(JSON.stringify(refunded)).toBe(refundState)
  expect(JSON.stringify(history)).not.toMatch(/revision|ledger|credential|did:|passport|paymentSpent/)
})

test("an explicit new inquiry can revisit the same reason and amounts, but requires consent and reset clears all history", () => {
  const demo = engine(), state = paid()
  const first = demo.startSupport(state, "payment", NOW)!
  demo.submitSupport(state, first.operationRef)
  demo.finishSupport(first.operationRef, "success", NOW + 1)
  expect(demo.newSupport(first.operationRef)).toBe(true)
  const second = demo.startSupport(state, "payment", NOW + 2)!
  expect(second.operationRef).not.toBe(first.operationRef)
  expect(second.phase).toBe("review")
  expect(demo.finishSupport(second.operationRef, "success", NOW + 3)).toBeNull()
  expect(demo.read().supportHistory).toHaveLength(1)
  demo.submitSupport(state, second.operationRef)
  demo.finishSupport(second.operationRef, "success", NOW + 4)
  expect(demo.read().supportHistory).toHaveLength(2)
  demo.reset()
  expect(demo.read().support).toBeNull()
  expect(demo.read().supportHistory).toEqual([])
  expect(demo.newSupport(second.operationRef)).toBe(false)
  expect(demo.finishSupport(second.operationRef, "success", NOW + 5)).toBeNull()
  expect(demo.read().supportHistory).toEqual([])
})
