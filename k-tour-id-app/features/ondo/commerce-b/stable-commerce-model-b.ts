export const STABLE_B_OPENING_BALANCE = 60
export const STABLE_B_KRW_PRICE = 22_000
export const STABLE_B_OOKRW_PRICE = 22
export const STABLE_B_VOUCHER_VALUE = 3
export const STABLE_B_RECEIPT_ID = "ONDO-LOCAL-20260825-001"
export const STABLE_B_PAYMENT_OPERATION_ID = "ONDO-LOCAL-OP-20260825-001"
export const STABLE_B_REFUND_OPERATION_ID = "ONDO-LOCAL-REFUND-20260825-001"
export const STABLE_B_REFUND_RECEIPT_ID = "ONDO-LOCAL-REFUND-20260825-001"

export type StableCommerceBStatus = "idle" | "paid" | "refunded"
export type StableCommerceBProviderOrder = "NOT_CONNECTED"
export type StableCommerceBVoucher = "available" | "selected" | "consumed"
export type StableCommerceBBenefitRecommendation = "recommended" | "accepted" | "declined"
export type StableCommerceBBenefitPolicyStatus = "recommended" | "ineligible" | "below_minimum" | "expired"
export type StableCommerceBOutcome = "success" | "failure" | "insufficient"
export type StableCommerceBLedgerEntry = {
  operationId: string
  receiptId: string
  side: "holder" | "merchant"
  amount: number
  kind: "PAYMENT" | "REFUND"
}

export type StableCommerceBState = {
  status: StableCommerceBStatus
  providerOrder: StableCommerceBProviderOrder
  voucher: StableCommerceBVoucher
  benefitRecommendation: StableCommerceBBenefitRecommendation
  confirmationPending: boolean
  confirmationCount: number
  receiptCount: number
  refundCount: number
  chargedDebit: number
  voucherApplied: boolean
  redemptionCount: number
  receiptId: string | null
  lastOutcome: StableCommerceBOutcome | null
  ledger: readonly StableCommerceBLedgerEntry[]
}

export type StableCommerceBAction =
  | { type: "RESET" }
  | { type: "SET_VOUCHER"; selected: boolean }
  | { type: "ACCEPT_BENEFIT" }
  | { type: "DECLINE_BENEFIT" }
  | { type: "CONFIRM" }
  | { type: "CANCEL_CONFIRMATION" }
  | { type: "PAYMENT_RETURN"; outcome: StableCommerceBOutcome }
  | { type: "REFUND" }

export function createStableCommerceBState(): StableCommerceBState {
  return {
    status: "idle",
    providerOrder: "NOT_CONNECTED",
    voucher: "available",
    benefitRecommendation: "recommended",
    confirmationPending: false,
    confirmationCount: 0,
    receiptCount: 0,
    refundCount: 0,
    chargedDebit: 0,
    voucherApplied: false,
    redemptionCount: 0,
    receiptId: null,
    lastOutcome: null,
    ledger: [],
  }
}

export function stableCommerceBenefitPolicyB(input: {
  venueEligible: boolean
  mealOOKRW: number
  minimumOOKRW: number
  nowMs: number
  expiresAtMs: number
}): { status: StableCommerceBBenefitPolicyStatus; minimumOOKRW: number } {
  const status: StableCommerceBBenefitPolicyStatus = !input.venueEligible
    ? "ineligible"
    : input.nowMs > input.expiresAtMs
      ? "expired"
      : input.mealOOKRW < input.minimumOOKRW
        ? "below_minimum"
        : "recommended"
  return { status, minimumOOKRW: input.minimumOOKRW }
}

export function stableCommerceQuoteDebitB(state: StableCommerceBState) {
  return STABLE_B_OOKRW_PRICE - (state.voucher === "selected" || state.voucher === "consumed" ? STABLE_B_VOUCHER_VALUE : 0)
}

export function stableCommerceDebitB(state: StableCommerceBState) {
  return state.chargedDebit
}

export function stableCommerceBalanceB(state: StableCommerceBState) {
  return state.status === "paid"
    ? STABLE_B_OPENING_BALANCE - state.chargedDebit
    : STABLE_B_OPENING_BALANCE
}

export function stableCommerceSettlementB(state: StableCommerceBState) {
  return state.status === "paid" ? state.chargedDebit : 0
}

export function stableCommerceBreakdownB(state: StableCommerceBState) {
  const benefit = state.voucherApplied || state.voucher === "consumed" || state.voucher === "selected" ? STABLE_B_VOUCHER_VALUE : 0
  return {
    gross: STABLE_B_OOKRW_PRICE,
    benefit,
    net: state.status === "refunded"
      ? 0
      : state.status === "paid" ? state.chargedDebit : STABLE_B_OOKRW_PRICE - benefit,
  }
}

export function stableCommerceBReducer(state: StableCommerceBState, action: StableCommerceBAction): StableCommerceBState {
  switch (action.type) {
    case "RESET":
      return createStableCommerceBState()
    case "SET_VOUCHER":
      if (state.status !== "idle" || state.confirmationPending || state.voucher === "consumed") return state
      return {
        ...state,
        voucher: action.selected ? "selected" : "available",
        benefitRecommendation: action.selected ? "accepted" : "declined",
      }
    case "ACCEPT_BENEFIT":
      if (state.status !== "idle" || state.confirmationPending || state.voucher === "consumed") return state
      return { ...state, voucher: "selected", benefitRecommendation: "accepted" }
    case "DECLINE_BENEFIT":
      if (state.status !== "idle" || state.confirmationPending || state.voucher === "consumed") return state
      return { ...state, voucher: "available", benefitRecommendation: "declined" }
    case "CONFIRM":
      if (state.status !== "idle" || state.confirmationPending) return state
      return { ...state, confirmationPending: true, confirmationCount: state.confirmationCount + 1, lastOutcome: null }
    case "CANCEL_CONFIRMATION":
      if (state.status !== "idle" || !state.confirmationPending) return state
      return { ...state, confirmationPending: false, lastOutcome: null }
    case "PAYMENT_RETURN":
      if (state.status !== "idle" || !state.confirmationPending) return state
      if (action.outcome !== "success") {
        return { ...state, confirmationPending: false, lastOutcome: action.outcome }
      }
      return {
        ...state,
        status: "paid",
        voucher: state.voucher === "selected" ? "consumed" : state.voucher,
        confirmationPending: false,
        chargedDebit: stableCommerceQuoteDebitB(state),
        voucherApplied: state.voucher === "selected",
        redemptionCount: state.voucher === "selected" ? 1 : 0,
        receiptId: STABLE_B_RECEIPT_ID,
        receiptCount: state.receiptCount + 1,
        lastOutcome: "success",
        ledger: [
          {
            operationId: STABLE_B_PAYMENT_OPERATION_ID,
            receiptId: STABLE_B_RECEIPT_ID,
            side: "holder",
            amount: -stableCommerceQuoteDebitB(state),
            kind: "PAYMENT",
          },
          {
            operationId: STABLE_B_PAYMENT_OPERATION_ID,
            receiptId: STABLE_B_RECEIPT_ID,
            side: "merchant",
            amount: stableCommerceQuoteDebitB(state),
            kind: "PAYMENT",
          },
        ],
      }
    case "REFUND":
      if (state.status !== "paid") return state
      return {
        ...state,
        status: "refunded",
        voucher: state.voucherApplied ? "available" : state.voucher,
        redemptionCount: 0,
        refundCount: state.refundCount + 1,
        ledger: [
          ...state.ledger,
          {
            operationId: STABLE_B_REFUND_OPERATION_ID,
            receiptId: STABLE_B_REFUND_RECEIPT_ID,
            side: "holder",
            amount: state.chargedDebit,
            kind: "REFUND",
          },
          {
            operationId: STABLE_B_REFUND_OPERATION_ID,
            receiptId: STABLE_B_REFUND_RECEIPT_ID,
            side: "merchant",
            amount: -state.chargedDebit,
            kind: "REFUND",
          },
        ],
      }
    default:
      return state
  }
}
