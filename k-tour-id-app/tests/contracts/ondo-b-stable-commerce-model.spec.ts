import { expect, test } from "@playwright/test"
import {
  createStableCommerceBState,
  createStableCommerceBLockedQuote,
  stableCommerceBalanceB,
  stableCommerceBreakdownB,
  stableCommerceBReducer,
  stableCommerceDebitB,
  stableCommerceSettlementB,
} from "../../features/ondo/commerce-b/stable-commerce-model-b"

test("B-COMMERCE-MODEL-001 voucher-adjusted success debits once and creates one stable receipt", () => {
  let state = createStableCommerceBState()
  state = stableCommerceBReducer(state, { type: "SET_VOUCHER", selected: true })
  const quote = createStableCommerceBLockedQuote(state, new Date("2026-08-28T03:15:00.000Z"))
  state = stableCommerceBReducer(state, { type: "CONFIRM", quote })
  state = stableCommerceBReducer(state, { type: "CONFIRM", quote })
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
  state = stableCommerceBReducer(state, { type: "CONFIRM", quote: createStableCommerceBLockedQuote(state, new Date("2026-08-28T03:15:00.000Z")) })
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
    state = stableCommerceBReducer(state, { type: "CONFIRM", quote: createStableCommerceBLockedQuote(state, new Date("2026-08-28T03:15:00.000Z")) })
    state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome })
    expect(stableCommerceBalanceB(state)).toBe(60)
    expect(state.receiptCount).toBe(0)
    expect(state.ledger).toEqual([])
    expect(state.status).toBe("idle")
    expect(state.providerOrder).toBe("NOT_CONNECTED")
    expect(state.lastOutcome).toBe(outcome)
  }
})

test("B-COMMERCE-MODEL-004 a locked quote cannot drift across a failed return and exact retry", () => {
  let state = createStableCommerceBState()
  state = stableCommerceBReducer(state, { type: "SET_VOUCHER", selected: true })
  const locked = createStableCommerceBLockedQuote(state, new Date("2026-08-28T03:15:00.000Z"))
  state = stableCommerceBReducer(state, { type: "CONFIRM", quote: locked })

  const afterBenefitMutation = stableCommerceBReducer(state, { type: "DECLINE_BENEFIT" })
  expect(afterBenefitMutation).toBe(state)
  expect(state.lockedQuote).toEqual(locked)

  state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome: "failure" })
  expect(state.lockedQuote).toEqual(locked)
  expect(state.confirmationPending).toBe(false)
  expect(state.ledger).toEqual([])

  const drifted = createStableCommerceBLockedQuote(createStableCommerceBState(), new Date("2026-08-28T03:15:00.000Z"))
  const rejected = stableCommerceBReducer(state, { type: "CONFIRM", quote: drifted })
  expect(rejected).toBe(state)

  state = stableCommerceBReducer(state, { type: "CONFIRM", quote: locked })
  state = stableCommerceBReducer(state, { type: "PAYMENT_RETURN", outcome: "success" })
  expect(state.chargedDebit).toBe(19)
  expect(state.voucherApplied).toBe(true)
  expect(state.ledger.map(({ amount }) => amount)).toEqual([-19, 19])
})
