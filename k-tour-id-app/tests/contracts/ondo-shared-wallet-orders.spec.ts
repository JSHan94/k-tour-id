import { expect, test } from "@playwright/test"
import { supportedCommercePlacesB } from "../../features/ondo/commerce-b/place-service-registry-b"
import { createStableCommerceBState, createStableCommerceBLockedQuote, isStableCommerceBLockedQuote, openStableCommerceOrderB, selectStableCommerceOrderB, stableCommerceBalanceB, stableCommerceBReducer, stableCommerceOrderB, stableCommerceOrdersB, type CommerceOrderContextB, type StableCommerceBState } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const seoul = "research-seoul-okdongsik"
const cafe = "research-jeju-moasi"
function order(venueId: string, suffix: string): CommerceOrderContextB {
  const place = supportedCommercePlacesB().find(item => item.id === venueId)!
  return { orderId: `visit-${suffix}`, venueId, offerId: place.commerce!.offerId,
    grossKrw: place.commerce!.grossKrw, benefitKrw: place.commerce!.benefitKrw,
    operationId: `visit-operation-${suffix}`, receiptId: `visit-receipt-${suffix}` }
}
function pay(state: StableCommerceBState, benefit = false) {
  let next = stableCommerceBReducer(state, { type: "SET_VOUCHER", selected: benefit })
  next = stableCommerceBReducer(next, { type: "CONFIRM", quote: createStableCommerceBLockedQuote(next) })
  return stableCommerceBReducer(next, { type: "PAYMENT_RETURN", outcome: "success" })
}

test("MW-LEDGER-01 every registered venue quote is owned and cannot be repriced", () => {
  for (const place of supportedCommercePlacesB()) {
    const state = openStableCommerceOrderB(createStableCommerceBState(), order(place.id, place.id))!
    expect(state).not.toBeNull()
    const quote = createStableCommerceBLockedQuote(state)
    expect(quote.offerId).toBe(place.commerce!.offerId)
    expect(quote.finalDebit * 1_000).toBe(place.commerce!.grossKrw)
    expect(isStableCommerceBLockedQuote(quote)).toBe(true)
    expect(isStableCommerceBLockedQuote({ ...quote, grossDebit: 1, finalDebit: 1 })).toBe(false)
    const benefitState = stableCommerceBReducer(state, { type: "ACCEPT_BENEFIT" })
    expect(createStableCommerceBLockedQuote(benefitState).finalDebit * 1_000).toBe(place.commerce!.grossKrw - place.commerce!.benefitKrw)
  }
})

test("MW-LEDGER-02 two venues share balance; old receipt selection and refund do not reset the other order", () => {
  const a = order(seoul, "a"), b = order(cafe, "b")
  let state = pay(openStableCommerceOrderB(createStableCommerceBState(), a)!, true)
  expect(stableCommerceBalanceB(state)).toBe(41)
  state = pay(openStableCommerceOrderB(state, b)!)
  expect(stableCommerceBalanceB(state)).toBe(29)
  expect(stableCommerceOrdersB(state)).toHaveLength(2)
  expect(new Set(stableCommerceOrdersB(state).map(item => item.receiptId)).size).toBe(2)
  state = selectStableCommerceOrderB(state, a.orderId)!
  expect(stableCommerceOrderB(state).venueId).toBe(seoul)
  expect(stableCommerceBalanceB(state)).toBe(29)
  state = stableCommerceBReducer(state, { type: "REFUND" })
  expect(stableCommerceBalanceB(state)).toBe(48)
  const duplicate = stableCommerceBReducer(state, { type: "REFUND" })
  expect(duplicate).toBe(state)
  state = selectStableCommerceOrderB(state, b.orderId)!
  expect(state.status).toBe("paid")
  expect(state.chargedDebit).toBe(12)
  expect(stableCommerceBalanceB(state)).toBe(48)
})

test("MW-LEDGER-03 repeated selection never duplicates a debit; fresh order has its own receipt", () => {
  const a = order(cafe, "first")
  let state = pay(openStableCommerceOrderB(createStableCommerceBState(), a)!)
  for (let index = 0; index < 3; index++) state = openStableCommerceOrderB(state, a)!
  expect(stableCommerceOrdersB(state)).toHaveLength(1)
  expect(stableCommerceBalanceB(state)).toBe(48)
  state = pay(openStableCommerceOrderB(state, order(cafe, "second"))!)
  expect(stableCommerceOrdersB(state)).toHaveLength(2)
  expect(stableCommerceBalanceB(state)).toBe(36)
})

test("MW-LEDGER-04 pending checkout cannot switch orders or consume a different venue quote", () => {
  const a = order(seoul, "pending"), b = order(cafe, "other")
  let state = openStableCommerceOrderB(createStableCommerceBState(), a)!
  const other = openStableCommerceOrderB(createStableCommerceBState(), b)!
  expect(stableCommerceBReducer(state, { type: "CONFIRM", quote: createStableCommerceBLockedQuote(other) })).toBe(state)
  state = stableCommerceBReducer(state, { type: "CONFIRM", quote: createStableCommerceBLockedQuote(state) })
  expect(openStableCommerceOrderB(state, b)).toBeNull()
  expect(stableCommerceBalanceB(state)).toBe(60)
  state = stableCommerceBReducer(state, { type: "CANCEL_CONFIRMATION" })
  expect(openStableCommerceOrderB(state, b)).not.toBeNull()
})

test("MW-LEDGER-05 cross-venue order ID or receipt reuse is rejected", () => {
  const a = order(seoul, "original"), b = order(cafe, "different")
  const state = pay(openStableCommerceOrderB(createStableCommerceBState(), a)!)
  expect(openStableCommerceOrderB(state, { ...b, orderId: a.orderId })).toBeNull()
  expect(openStableCommerceOrderB(state, { ...b, operationId: a.operationId })).toBeNull()
  expect(openStableCommerceOrderB(state, { ...b, receiptId: a.receiptId })).toBeNull()
  expect(openStableCommerceOrderB(state, { ...b, grossKrw: 1 })).toBeNull()
  expect(selectStableCommerceOrderB(state, "missing")).toBeNull()
})
