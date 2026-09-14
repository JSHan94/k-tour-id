import { isLiveReviewFixtureExecution, type ReviewFixtureExecution } from "../contracts/execution-mode"
import { isFundingRailReceiptB, type FundingRailReceiptB } from "./funding-rail-model-b"
import { commercePlaceByOfferIdB, resolveCommercePlaceB } from "./place-service-registry-b"

export const STABLE_B_OPENING_BALANCE = 60
export const STABLE_B_OFFER_ID = "meal-offer-gukbap"
export const STABLE_B_OFFER_VENUE_ID = "mois-0021cd596bc5b2a922ad"
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
export type StableCommerceBLockedQuote = Readonly<{
  version: 1
  offerId: string
  fundingSource: "travel_balance"
  benefitMode: "standard" | "ktour"
  grossDebit: number
  benefitDebit: number
  finalDebit: number
  expiresAt: string
}>
export type StableCommerceBLedgerEntry = {
  operationId: string
  receiptId: string
  side: "holder" | "merchant"
  amount: number
  kind: "PAYMENT" | "REFUND"
}

/** A sample authorization is a hold, not a debit or a merchant receipt. */
export type CommercePaymentOperationB = Readonly<{
  operationId: string
  phase: "authorized" | "capture_pending" | "capture_failed" | "unknown" | "declined" | "voided" | "settled"
  unknownStage: "authorization" | "capture" | null
  authorizedAt: number | null
  amountKrw: number
  captureAttempts: number
  quote: StableCommerceBLockedQuote
  provenanceTruth: "SIMULATED"
  externalProviderConnected: false
  externalEffect: "none"
}>
export type CommerceRefundOperationB = Readonly<{
  operationId: string
  amountKrw: number
  phase: "pending" | "unknown" | "failed" | "settled"
  attempts: number
  requestedAt: number
  settledAt: number | null
  receiptId: string | null
  sampleOutcome?: "success" | "failure" | "unknown"
}>
export type CommerceSampleResponseB = Readonly<{ operationId: string; stage: "authorization" | "capture" | "refund"; outcome: string; amountKrw: number }>

export type CommerceOrderContextB = Readonly<{
  orderId: string
  venueId: string
  offerId: string
  grossKrw: number
  benefitKrw: number
  operationId: string
  receiptId: string
  credentialId?: string | null
}>

export type StableCommerceBState = {
  /** Order snapshots never carry funding credits or nested order history. */
  order?: CommerceOrderContextB
  orders?: readonly StableCommerceBState[]
  status: StableCommerceBStatus
  providerOrder: StableCommerceBProviderOrder
  voucher: StableCommerceBVoucher
  benefitRecommendation: StableCommerceBBenefitRecommendation
  confirmationPending: boolean
  lockedQuote: StableCommerceBLockedQuote | null
  confirmationCount: number
  receiptCount: number
  refundCount: number
  chargedDebit: number
  voucherApplied: boolean
  redemptionCount: number
  receiptId: string | null
  lastOutcome: StableCommerceBOutcome | null
  ledger: readonly StableCommerceBLedgerEntry[]
  /** Sample funding is separate from the double-sided payment/refund ledger. */
  fundingCredits: readonly FundingRailReceiptB[]
  paymentOperation?: CommercePaymentOperationB | null
  refundOperations?: readonly CommerceRefundOperationB[]
}

export type StableCommerceBAction =
  | { type: "RESET" }
  | { type: "SET_VOUCHER"; selected: boolean }
  | { type: "ACCEPT_BENEFIT" }
  | { type: "DECLINE_BENEFIT" }
  | { type: "PREPARE_QUOTE"; quote: StableCommerceBLockedQuote }
  | { type: "CONFIRM"; quote: StableCommerceBLockedQuote }
  | { type: "CANCEL_CONFIRMATION" }
  | { type: "PAYMENT_RETURN"; outcome: StableCommerceBOutcome }
  | { type: "REFUND" }
  | { type: "AUTHORIZE_PAYMENT"; outcome: "success" | "failure" | "unknown"; now: number; execution: ReviewFixtureExecution<CommerceSampleResponseB> }
  | { type: "PAYMENT_STATUS"; outcome: "success" | "failure"; now: number; execution: ReviewFixtureExecution<CommerceSampleResponseB> }
  | { type: "CAPTURE_REQUEST" }
  | { type: "CAPTURE_RESULT"; outcome: "failure" | "unknown"; execution: ReviewFixtureExecution<CommerceSampleResponseB> }
  | { type: "VOID_AUTHORIZATION" }
  | { type: "REFUND_REQUEST"; operationId: string; amountKrw: number; now: number; sampleOutcome?: "success" | "failure" | "unknown" }
  | { type: "REFUND_RETRY"; operationId: string }
  | { type: "REFUND_RESULT"; operationId: string; outcome: "success" | "failure" | "unknown"; now: number; execution: ReviewFixtureExecution<CommerceSampleResponseB> }

export function createStableCommerceBState(): StableCommerceBState {
  return {
    status: "idle",
    providerOrder: "NOT_CONNECTED",
    voucher: "available",
    benefitRecommendation: "recommended",
    confirmationPending: false,
    lockedQuote: null,
    confirmationCount: 0,
    receiptCount: 0,
    refundCount: 0,
    chargedDebit: 0,
    voucherApplied: false,
    redemptionCount: 0,
    receiptId: null,
    lastOutcome: null,
    ledger: [],
    fundingCredits: [],
    paymentOperation: null,
    refundOperations: [],
  }
}

export function stableCommerceOrderB(state: StableCommerceBState): CommerceOrderContextB {
  return state.order ?? { orderId: STABLE_B_PAYMENT_OPERATION_ID, venueId: STABLE_B_OFFER_VENUE_ID, offerId: STABLE_B_OFFER_ID,
    grossKrw: STABLE_B_KRW_PRICE, benefitKrw: STABLE_B_VOUCHER_VALUE * 1_000,
    operationId: STABLE_B_PAYMENT_OPERATION_ID, receiptId: STABLE_B_RECEIPT_ID }
}

export function stableCommerceOrdersB(state: StableCommerceBState): readonly StableCommerceBState[] {
  return [...(state.orders ?? []), ...(state.order || state.status !== "idle" || state.confirmationPending ? [state] : [])]
}

function orderSnapshotB(state: StableCommerceBState): StableCommerceBState {
  const { orders: _orders, fundingCredits: _credits, ...order } = state
  return { ...order, order: stableCommerceOrderB(state), fundingCredits: [] }
}

/** Selecting a receipt changes the active order, never the shared wallet. */
export function selectStableCommerceOrderB(state: StableCommerceBState, orderId: string): StableCommerceBState | null {
  if (stableCommerceOrderB(state).orderId === orderId) return state
  if (stableCommerceOrdersB(state).some(item => item.confirmationPending && stableCommerceOrderB(item).orderId !== orderId)) return null
  const selected = state.orders?.find(item => stableCommerceOrderB(item).orderId === orderId)
  if (!selected) return null
  const remaining = (state.orders ?? []).filter(item => stableCommerceOrderB(item).orderId !== orderId)
  if (state.order || state.status !== "idle" || state.confirmationPending) remaining.push(orderSnapshotB(state))
  return { ...selected, orders: remaining, fundingCredits: state.fundingCredits }
}

/** An unconfirmed payment must be resolved before a different order is opened. */
export function openStableCommerceOrderB(state: StableCommerceBState, order: CommerceOrderContextB): StableCommerceBState | null {
  const place = resolveCommercePlaceB(order.venueId)
  if (!place?.commerce || place.commerce.offerId !== order.offerId || place.commerce.grossKrw !== order.grossKrw || place.commerce.benefitKrw !== order.benefitKrw) return null
  if (![order.orderId, order.operationId, order.receiptId].every(id => typeof id === "string" && id.length > 0 && id.length <= 180)) return null
  const allOrders = stableCommerceOrdersB(state)
  const sameId = allOrders.find(item => stableCommerceOrderB(item).orderId === order.orderId)
  if (sameId) {
    const existing = stableCommerceOrderB(sameId)
    if (["venueId", "offerId", "grossKrw", "benefitKrw", "operationId", "receiptId"].some(key => existing[key as keyof CommerceOrderContextB] !== order[key as keyof CommerceOrderContextB])) return null
  }
  if (!sameId && allOrders.length >= 100) return null
  if (allOrders.some(item => {
    const existing = stableCommerceOrderB(item)
    return existing.orderId !== order.orderId && (existing.operationId === order.operationId || existing.receiptId === order.receiptId)
  })) return null
  if (stableCommerceOrdersB(state).some(item => item.confirmationPending && stableCommerceOrderB(item).orderId !== order.orderId)) return null
  const existing = selectStableCommerceOrderB(state, order.orderId)
  if (existing) return existing
  const orders = [...(state.orders ?? [])]
  if (state.order || state.status !== "idle" || state.confirmationPending) orders.push(orderSnapshotB(state))
  return { ...createStableCommerceBState(), order, orders, fundingCredits: state.fundingCredits }
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
    : input.nowMs >= input.expiresAtMs
      ? "expired"
      : input.mealOOKRW < input.minimumOOKRW
        ? "below_minimum"
        : "recommended"
  return { status, minimumOOKRW: input.minimumOOKRW }
}

export function stableCommerceQuoteDebitB(state: StableCommerceBState) {
  if (state.lockedQuote) return state.lockedQuote.finalDebit
  const order = stableCommerceOrderB(state)
  return (order.grossKrw - (state.voucher === "selected" || state.voucher === "consumed" ? order.benefitKrw : 0)) / 1_000
}

export function createStableCommerceBLockedQuote(
  state: StableCommerceBState,
  expiresAt = new Date(Date.now() + 15 * 60 * 1000),
): StableCommerceBLockedQuote {
  return createStableCommerceBLockedQuoteFromMode(
    state.voucher === "selected" || state.voucher === "consumed" ? "ktour" : "standard",
    expiresAt,
    stableCommerceOrderB(state),
  )
}

export function createStableCommerceBLockedQuoteFromMode(
  benefitMode: StableCommerceBLockedQuote["benefitMode"],
  expiresAt = new Date(Date.now() + 15 * 60 * 1000),
  offer: Pick<CommerceOrderContextB, "offerId" | "grossKrw" | "benefitKrw"> = stableCommerceOrderB(createStableCommerceBState()),
): StableCommerceBLockedQuote {
  const benefitDebit = benefitMode === "ktour" ? offer.benefitKrw / 1_000 : 0
  return Object.freeze({
    version: 1,
    offerId: offer.offerId,
    fundingSource: "travel_balance",
    benefitMode,
    grossDebit: offer.grossKrw / 1_000,
    benefitDebit,
    finalDebit: offer.grossKrw / 1_000 - benefitDebit,
    expiresAt: expiresAt.toISOString(),
  })
}

export function isStableCommerceBLockedQuote(value: unknown, now?: Date): value is StableCommerceBLockedQuote {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const quote = value as Record<string, unknown>
  const keys = Object.keys(quote).sort().join("|")
  const expiresAt = typeof quote.expiresAt === "string" ? Date.parse(quote.expiresAt) : Number.NaN
  const benefitDebit = quote.benefitDebit
  const offer = commercePlaceByOfferIdB(quote.offerId)?.commerce
  const valid = keys === ["benefitDebit", "benefitMode", "expiresAt", "finalDebit", "fundingSource", "grossDebit", "offerId", "version"].sort().join("|")
    && quote.version === 1
    && Boolean(offer)
    && quote.fundingSource === "travel_balance"
    && quote.grossDebit === offer!.grossKrw / 1_000
    && (benefitDebit === 0 || benefitDebit === offer!.benefitKrw / 1_000)
    && quote.finalDebit === offer!.grossKrw / 1_000 - Number(benefitDebit)
    && quote.benefitMode === (benefitDebit === offer!.benefitKrw / 1_000 ? "ktour" : "standard")
    && Number.isFinite(expiresAt)
  return valid && (!now || expiresAt > now.getTime())
}

export function sameStableCommerceBLockedQuote(left: unknown, right: unknown) {
  if (!isStableCommerceBLockedQuote(left) || !isStableCommerceBLockedQuote(right)) return false
  return left.version === right.version
    && left.offerId === right.offerId
    && left.fundingSource === right.fundingSource
    && left.benefitMode === right.benefitMode
    && left.grossDebit === right.grossDebit
    && left.benefitDebit === right.benefitDebit
    && left.finalDebit === right.finalDebit
    && left.expiresAt === right.expiresAt
}

export function stableCommerceDebitB(state: StableCommerceBState) {
  return state.chargedDebit
}

export function stableCommerceOpeningBalanceB(state: StableCommerceBState) {
  const previousNetKrw = (state.orders ?? []).reduce((total, order) => total + (order.status === "paid" ? order.chargedDebit * 1_000 - stableCommerceRefundedKrwB(order) : 0), 0)
  return STABLE_B_OPENING_BALANCE + (state.fundingCredits ?? []).reduce((total, receipt) => total + receipt.creditKrw / 1_000, 0) - previousNetKrw / 1_000
}

export function stableCommerceBalanceB(state: StableCommerceBState) {
  return state.status === "paid"
    ? (Math.round(stableCommerceOpeningBalanceB(state) * 1_000) - state.chargedDebit * 1_000 + stableCommerceRefundedKrwB(state)) / 1_000
    : stableCommerceOpeningBalanceB(state)
}

export function stableCommerceRefundedKrwB(state: StableCommerceBState) {
  return state.ledger.filter(row => row.kind === "REFUND" && row.side === "holder")
    .reduce((total, row) => total + Math.round(row.amount * 1_000), 0)
}

export function stableCommerceRefundableKrwB(state: StableCommerceBState) {
  return state.status === "paid" ? Math.max(0, state.chargedDebit * 1_000 - stableCommerceRefundedKrwB(state)) : 0
}

export function stableCommerceHeldKrwB(state: StableCommerceBState): number {
  const operation = state.paymentOperation
  const active = state.status === "idle" && operation && operation.authorizedAt !== null
    && ["authorized", "capture_pending", "capture_failed", "unknown"].includes(operation.phase) ? operation.amountKrw : 0
  return active + (state.orders ?? []).reduce((total, order) => total + stableCommerceHeldKrwB(order), 0)
}

/** The public callback boundary still needs a live fixture capability. A copied
 * JSON success or a response for another amount/stage cannot mutate money. */
export function isCommerceSampleResponseB(execution: ReviewFixtureExecution<CommerceSampleResponseB>, expected: CommerceSampleResponseB) {
  if (!isLiveReviewFixtureExecution(execution) || execution.result !== "FIXTURE_SUCCESS" || !execution.value) return false
  return Object.keys(execution.value).sort().join("|") === "amountKrw|operationId|outcome|stage"
    && Object.keys(expected).every(key => execution.value![key as keyof CommerceSampleResponseB] === expected[key as keyof CommerceSampleResponseB])
}

function settleRefundB(state: StableCommerceBState, operation: CommerceRefundOperationB, now: number) {
  const totalKrw = stableCommerceRefundedKrwB(state) + operation.amountKrw
  if (state.status !== "paid" || !Number.isSafeInteger(operation.amountKrw) || operation.amountKrw <= 0 || totalKrw > state.chargedDebit * 1_000) return state
  const complete = totalKrw === state.chargedDebit * 1_000
  const receiptId = operation.operationId === STABLE_B_REFUND_OPERATION_ID ? STABLE_B_REFUND_RECEIPT_ID : `${operation.operationId}:receipt`
  const settled = { ...operation, phase: "settled" as const, settledAt: now, receiptId }
  const previous = state.refundOperations ?? []
  return {
    ...state,
    status: complete ? "refunded" as const : "paid" as const,
    voucher: complete && state.voucherApplied ? "available" as const : state.voucher,
    redemptionCount: complete ? 0 : state.redemptionCount,
    refundCount: state.refundCount + 1,
    refundOperations: previous.some(item => item.operationId === operation.operationId)
      ? previous.map(item => item.operationId === operation.operationId ? settled : item) : [...previous, settled],
    ledger: [...state.ledger,
      { operationId: operation.operationId, receiptId, side: "holder" as const, amount: operation.amountKrw / 1_000, kind: "REFUND" as const },
      { operationId: operation.operationId, receiptId, side: "merchant" as const, amount: -operation.amountKrw / 1_000, kind: "REFUND" as const },
    ],
  }
}

/** Only a settled live sample operation can change the sample balance.
 * Returning the same state means an identical callback was already applied;
 * null means the caller must keep the operation unresolved, not show success. */
export function creditStableCommerceFundingB(
  state: StableCommerceBState,
  execution: ReviewFixtureExecution<FundingRailReceiptB>,
  options: { allowReviewFixture?: boolean },
  now = Date.now(),
): StableCommerceBState | null {
  if (!options.allowReviewFixture || !isLiveReviewFixtureExecution(execution)
    || execution.result !== "FIXTURE_SUCCESS" || !isFundingRailReceiptB(execution.value)
    || !Number.isFinite(now) || execution.value.settledAt < 0 || execution.value.settledAt > now) return null
  const receipt = execution.value
  const credits = state.fundingCredits ?? []
  const existing = credits.find(item => item.operationId === receipt.operationId)
  if (existing) return (Object.keys(existing) as (keyof FundingRailReceiptB)[]).every(key => existing[key] === receipt[key]) ? state : null
  if (credits.length >= 100) return null
  return { ...state, fundingCredits: [...credits, Object.freeze({ ...receipt })] }
}

export function stableCommerceSettlementB(state: StableCommerceBState) {
  return state.status === "paid" ? (state.chargedDebit * 1_000 - stableCommerceRefundedKrwB(state)) / 1_000 : 0
}

export function stableCommerceBreakdownB(state: StableCommerceBState) {
  const order = stableCommerceOrderB(state)
  const benefit = state.voucherApplied || state.voucher === "consumed" || state.voucher === "selected" ? order.benefitKrw / 1_000 : 0
  return {
    gross: order.grossKrw / 1_000,
    benefit,
    net: state.status === "refunded"
      ? 0
      : state.status === "paid" ? stableCommerceSettlementB(state) : order.grossKrw / 1_000 - benefit,
  }
}

export function stableCommerceBReducer(state: StableCommerceBState, action: StableCommerceBAction): StableCommerceBState {
  const order = stableCommerceOrderB(state)
  switch (action.type) {
    case "RESET":
      return createStableCommerceBState()
    case "SET_VOUCHER":
      if (state.status !== "idle" || state.confirmationPending || state.lockedQuote || state.voucher === "consumed") return state
      return {
        ...state,
        voucher: action.selected ? "selected" : "available",
        benefitRecommendation: action.selected ? "accepted" : "declined",
      }
    case "ACCEPT_BENEFIT":
      if (state.status !== "idle" || state.confirmationPending || state.lockedQuote || state.voucher === "consumed") return state
      return { ...state, voucher: "selected", benefitRecommendation: "accepted" }
    case "DECLINE_BENEFIT":
      if (state.status !== "idle" || state.confirmationPending || state.lockedQuote || state.voucher === "consumed") return state
      return { ...state, voucher: "available", benefitRecommendation: "declined" }
    case "PREPARE_QUOTE":
      if (state.status !== "idle" || state.confirmationPending || !isStableCommerceBLockedQuote(action.quote)
        || action.quote.offerId !== order.offerId || action.quote.grossDebit !== order.grossKrw / 1_000
        || (state.lockedQuote && !sameStableCommerceBLockedQuote(state.lockedQuote, action.quote))) return state
      return { ...state, lockedQuote: action.quote }
    case "CONFIRM":
      if (state.status !== "idle" || state.confirmationPending || !isStableCommerceBLockedQuote(action.quote)) return state
      if (action.quote.offerId !== order.offerId || action.quote.grossDebit !== order.grossKrw / 1_000 || action.quote.benefitDebit !== (action.quote.benefitMode === "ktour" ? order.benefitKrw / 1_000 : 0)) return state
      if (state.lockedQuote && !sameStableCommerceBLockedQuote(state.lockedQuote, action.quote)) return state
      return { ...state, confirmationPending: true, lockedQuote: action.quote, paymentOperation: null, confirmationCount: state.confirmationCount + 1, lastOutcome: null }
    case "CANCEL_CONFIRMATION":
      if (state.paymentOperation?.phase === "unknown") return state
      if (state.status !== "idle" || (!state.confirmationPending && !state.lockedQuote)) return state
      return { ...state, confirmationPending: false, lockedQuote: null, lastOutcome: null, paymentOperation: state.paymentOperation ? { ...state.paymentOperation, phase: "voided", unknownStage: null } : null }
    case "AUTHORIZE_PAYMENT": {
      if (state.status !== "idle" || !state.confirmationPending || !state.lockedQuote || state.paymentOperation || !Number.isFinite(action.now)
        || !["success", "failure", "unknown"].includes(action.outcome)
        || !isStableCommerceBLockedQuote(state.lockedQuote, new Date(action.now))
        || stableCommerceBalanceB(state) < state.lockedQuote.finalDebit
        || !isCommerceSampleResponseB(action.execution, { operationId: order.operationId, stage: "authorization", outcome: action.outcome, amountKrw: state.lockedQuote.finalDebit * 1_000 })) return state
      return { ...state, paymentOperation: {
        operationId: order.operationId, phase: action.outcome === "success" ? "authorized" : action.outcome === "unknown" ? "unknown" : "declined",
        authorizedAt: action.outcome === "success" ? action.now : null, unknownStage: action.outcome === "unknown" ? "authorization" : null,
        amountKrw: state.lockedQuote.finalDebit * 1_000, captureAttempts: 0, quote: state.lockedQuote,
        provenanceTruth: "SIMULATED", externalProviderConnected: false, externalEffect: "none",
      } }
    }
    case "CAPTURE_REQUEST": {
      const operation = state.paymentOperation
      if (state.status !== "idle" || !state.confirmationPending || !operation || !["authorized", "capture_failed"].includes(operation.phase)) return state
      return { ...state, paymentOperation: { ...operation, phase: "capture_pending", captureAttempts: operation.captureAttempts + 1 } }
    }
    case "CAPTURE_RESULT": {
      const operation = state.paymentOperation
      if (!operation || operation.phase !== "capture_pending" || state.status !== "idle" || !["failure", "unknown"].includes(action.outcome)
        || !isCommerceSampleResponseB(action.execution, { operationId: operation.operationId, stage: "capture", outcome: action.outcome, amountKrw: operation.amountKrw })) return state
      return { ...state, paymentOperation: { ...operation, phase: action.outcome === "unknown" ? "unknown" : "capture_failed", unknownStage: action.outcome === "unknown" ? "capture" : null } }
    }
    case "PAYMENT_STATUS": {
      const operation = state.paymentOperation
      if (!operation || operation.phase !== "unknown" || state.status !== "idle" || !Number.isFinite(action.now) || !["success", "failure"].includes(action.outcome)
        || !isCommerceSampleResponseB(action.execution, { operationId: operation.operationId, stage: operation.unknownStage!, outcome: action.outcome, amountKrw: operation.amountKrw })) return state
      const authorization = operation.unknownStage === "authorization"
      return { ...state, paymentOperation: { ...operation,
        phase: action.outcome === "success" ? authorization ? "authorized" : "capture_pending" : authorization ? "declined" : "capture_failed",
        authorizedAt: authorization && action.outcome === "success" ? action.now : operation.authorizedAt, unknownStage: null,
      } }
    }
    case "VOID_AUTHORIZATION": {
      const operation = state.paymentOperation
      if (state.status !== "idle" || !operation || !["authorized", "capture_failed", "declined"].includes(operation.phase)) return state
      return { ...state, confirmationPending: false, lockedQuote: null, paymentOperation: { ...operation, phase: "voided", unknownStage: null } }
    }
    case "PAYMENT_RETURN":
      if (state.status !== "idle" || !state.confirmationPending || !state.lockedQuote) return state
      if (state.paymentOperation && state.paymentOperation.phase !== "capture_pending") return state
      if (action.outcome !== "success") {
        return { ...state, confirmationPending: false, lastOutcome: action.outcome }
      }
      const lockedQuote = state.lockedQuote
      if (stableCommerceBalanceB(state) < lockedQuote.finalDebit) return state
      return {
        ...state,
        status: "paid",
        voucher: lockedQuote.benefitMode === "ktour" ? "consumed" : state.voucher,
        confirmationPending: false,
        lockedQuote: null,
        chargedDebit: lockedQuote.finalDebit,
        voucherApplied: lockedQuote.benefitMode === "ktour",
        redemptionCount: lockedQuote.benefitMode === "ktour" ? 1 : 0,
        receiptId: order.receiptId,
        receiptCount: state.receiptCount + 1,
        lastOutcome: "success",
        paymentOperation: state.paymentOperation ? { ...state.paymentOperation, phase: "settled" } : null,
        ledger: [
          {
            operationId: order.operationId,
            receiptId: order.receiptId,
            side: "holder",
            amount: -lockedQuote.finalDebit,
            kind: "PAYMENT",
          },
          {
            operationId: order.operationId,
            receiptId: order.receiptId,
            side: "merchant",
            amount: lockedQuote.finalDebit,
            kind: "PAYMENT",
          },
        ],
      }
    case "REFUND": {
      if ((state.refundOperations ?? []).some(item => item.phase === "pending" || item.phase === "unknown")) return state
      const refundId = order.operationId === STABLE_B_PAYMENT_OPERATION_ID ? STABLE_B_REFUND_OPERATION_ID : `${order.operationId}:refund`
      return settleRefundB(state, { operationId: state.refundCount ? `${refundId}:${state.refundCount + 1}` : refundId,
        amountKrw: stableCommerceRefundableKrwB(state), phase: "pending", attempts: 1, requestedAt: Date.now(), settledAt: null, receiptId: null }, Date.now())
    }
    case "REFUND_REQUEST": {
      const operations = state.refundOperations ?? []
      if (state.status !== "paid" || !/^sample-refund:[A-Za-z0-9-]{1,80}$/.test(action.operationId) || !Number.isFinite(action.now)
        || !Number.isSafeInteger(action.amountKrw) || action.amountKrw <= 0 || action.amountKrw > stableCommerceRefundableKrwB(state)
        || operations.length >= 100 || operations.some(item => item.operationId === action.operationId || ["pending", "unknown"].includes(item.phase))) return state
      return { ...state, refundOperations: [...operations, { operationId: action.operationId, amountKrw: action.amountKrw, phase: "pending", attempts: 1, requestedAt: action.now, settledAt: null, receiptId: null, sampleOutcome: action.sampleOutcome ?? "success" }] }
    }
    case "REFUND_RETRY": {
      const operations = state.refundOperations ?? []
      const operation = operations.find(item => item.operationId === action.operationId)
      if (state.status !== "paid" || !operation || operation.phase !== "failed" || operation.amountKrw > stableCommerceRefundableKrwB(state)
        || operations.some(item => ["pending", "unknown"].includes(item.phase))) return state
      return { ...state, refundOperations: operations.map(item => item === operation ? { ...item, phase: "pending", attempts: item.attempts + 1, sampleOutcome: "success" } : item) }
    }
    case "REFUND_RESULT": {
      const operations = state.refundOperations ?? []
      const operation = operations.find(item => item.operationId === action.operationId)
      if (!operation || state.status !== "paid" || !["pending", "unknown"].includes(operation.phase) || !Number.isFinite(action.now) || action.now < operation.requestedAt
        || !["success", "failure", "unknown"].includes(action.outcome)
        || !isCommerceSampleResponseB(action.execution, { operationId: operation.operationId, stage: "refund", outcome: action.outcome, amountKrw: operation.amountKrw })) return state
      if (action.outcome === "success") return settleRefundB(state, operation, action.now)
      return { ...state, refundOperations: operations.map(item => item === operation ? { ...item, phase: action.outcome === "unknown" ? "unknown" : "failed" } : item) }
    }
    default:
      return state
  }
}
