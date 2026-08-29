import { expect, test } from "@playwright/test"
import {
  createStableCommerceBState,
  stableCommerceBalanceB,
  stableCommerceBreakdownB,
  stableCommerceBReducer,
  stableCommerceDebitB,
  stableCommerceSettlementB,
} from "../../features/ondo/commerce-b/stable-commerce-model-b"

test("B-COMMERCE-MODEL-001 voucher-adjusted success debits once and creates one stable receipt", () => {
  let state = createStableCommerceBState()
  state = stableCommerceBReducer(state, { type: "SET_VOUCHER", selected: true })
  state = stableCommerceBReducer(state, { type: "CONFIRM" })
  state = stableCommerceBReducer(state, { type: "CONFIRM" })
  state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome: "success" })
  state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome: "success" })

  expect(stableCommerceDebitB(state)).toBe(19)
  expect(stableCommerceBalanceB(state)).toBe(41)
  expect(state.confirmationCount).toBe(1)
  expect(state.receiptCount).toBe(1)
  expect(state.receiptId).toBe("ONDO-LOCAL-20260825-001")
  expect(state.providerOrder).toBe("NOT_CONNECTED")
  expect(state.voucher).toBe("consumed")
  expect(state.redemptionCount).toBe(1)
  expect(state.ledger).toEqual([
    { side: "holder", amount: -19, kind: "PAYMENT", operationId: "ONDO-LOCAL-OP-20260825-001", receiptId: "ONDO-LOCAL-20260825-001" },
    { side: "merchant", amount: 19, kind: "PAYMENT", operationId: "ONDO-LOCAL-OP-20260825-001", receiptId: "ONDO-LOCAL-20260825-001" },
  ])
  expect(stableCommerceSettlementB(state)).toBe(19)
  expect(stableCommerceBreakdownB(state)).toEqual({ gross: 22, benefit: 3, net: 19 })
})

test("B-COMMERCE-MODEL-002 refund reverses the ledger and restores the one-use voucher", () => {
  let state = createStableCommerceBState()
  state = stableCommerceBReducer(state, { type: "SET_VOUCHER", selected: true })
  state = stableCommerceBReducer(state, { type: "CONFIRM" })
  state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome: "success" })
  state = stableCommerceBReducer(state, { type: "REFUND" })
  state = stableCommerceBReducer(state, { type: "REFUND" })

  expect(stableCommerceBalanceB(state)).toBe(60)
  expect(state.status).toBe("refunded")
  expect(state.providerOrder).toBe("NOT_CONNECTED")
  expect(state.refundCount).toBe(1)
  expect(state.voucher).toBe("available")
  expect(state.redemptionCount).toBe(0)
  expect(state.ledger.slice(2)).toEqual([
    { side: "holder", amount: 19, kind: "REFUND", operationId: "ONDO-LOCAL-REFUND-20260825-001", receiptId: "ONDO-LOCAL-REFUND-20260825-001" },
    { side: "merchant", amount: -19, kind: "REFUND", operationId: "ONDO-LOCAL-REFUND-20260825-001", receiptId: "ONDO-LOCAL-REFUND-20260825-001" },
  ])
  expect(stableCommerceSettlementB(state)).toBe(0)
})

test("B-COMMERCE-MODEL-003 failure and insufficient returns never mutate the ledger", () => {
  for (const outcome of ["failure", "insufficient"] as const) {
    let state = createStableCommerceBState()
    state = stableCommerceBReducer(state, { type: "CONFIRM" })
    state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome })
    expect(stableCommerceBalanceB(state)).toBe(60)
    expect(state.receiptCount).toBe(0)
    expect(state.ledger).toEqual([])
    expect(state.status).toBe("idle")
    expect(state.providerOrder).toBe("NOT_CONNECTED")
    expect(state.lastOutcome).toBe(outcome)
  }
})
