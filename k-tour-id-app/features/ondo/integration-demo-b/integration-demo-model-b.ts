import {
  createKPassPresentationBinding, evaluateKPassService, isKPassDemoCredentialCurrent, kpassDemoIssuanceRef,
  KPASS_DEMO_POLICY_VERSION, type KPassDemoCredential, type KPassService, type KPassServiceDecision,
} from "../contracts/kpass-capabilities"
import { createPresentationRequestB, KTOUR_ID_PRESENTATION_TTL_MS, resolvePresentationRequestB, type OndoBPresentationRequest } from "../identity-b/ktour-id-setup-model-b"
import { isStableCommerceBLockedQuote, stableCommerceOrderB, type StableCommerceBState } from "../commerce-b/stable-commerce-model-b"

export const INTEGRATION_DEMO_EVENT_TYPES = ["KPassIssued", "WalletLinked", "PaymentAuthorized", "VoucherIssued", "VoucherRedeemed", "PartnerSettlementLogged"] as const
export type IntegrationDemoEventType = typeof INTEGRATION_DEMO_EVENT_TYPES[number]
export type IntegrationDemoSection = "verify" | "settlements" | "events"
export type PartnerSampleCase = "normal" | "wrong_audience" | "replay" | "expired" | "revoked"
export type PartnerSamplePurpose = Extract<KPassService, "person" | "age" | "visitor_benefit">
export type IntegrationSampleOutcome = "success" | "pending" | "failure" | "mismatch"
export type SettlementSupportReasonB = "mismatch" | "payment" | "refund"
export type SettlementSupportOutcomeB = "success" | "failure" | "unknown"
const TRUTH = Object.freeze({ provenanceTruth: "SIMULATED" as const, externalProviderConnected: false as const, externalEffect: "none" as const })

export type IntegrationBusinessSnapshotB = Readonly<{
  credential: KPassDemoCredential | null
  walletReady: boolean
  commerce: StableCommerceBState
}>
export type MinimalPartnerReceiptB = Readonly<{
  receiptRef: string
  decision: KPassServiceDecision["status"]
  reason: KPassServiceDecision["reason"] | "consent_denied" | "wrong_audience" | "request_replayed" | "request_expired" | "context_changed"
  purpose: PartnerSamplePurpose
  checkedAt: number
  /** Names of the requested predicates, never a complete credential or its ID. */
  sharedPredicates: readonly string[]
  provenanceTruth: "SIMULATED"
  externalProviderConnected: false
  externalEffect: "none"
}>
export type PartnerRequestViewB = Readonly<{
  requestRef: string
  purpose: PartnerSamplePurpose
  sampleCase: PartnerSampleCase
  phase: "request" | "consent" | "result"
  expiresAt: number
  receipt: MinimalPartnerReceiptB | null
}>
export type IntegrationDemoEventB = Readonly<{
  eventRef: string
  eventType: IntegrationDemoEventType
  aggregateKind: "credential" | "wallet" | "payment" | "voucher" | "settlement"
  policyVersion: typeof KPASS_DEMO_POLICY_VERSION
  phase: "queued" | "pending" | "recorded" | "failed"
  attempts: number
  occurredAt: number
  receipt: Readonly<{ receiptRef: string; recordedAt: number; transactionHash: null }> | null
  provenanceTruth: "SIMULATED"
  externalProviderConnected: false
  externalEffect: "none"
}>
export type IntegrationSettlementB = Readonly<{
  revision: string
  paymentKrw: number
  refundKrw: number
  merchantNetKrw: number
  phase: "open" | "pending" | "settled" | "mismatched" | "failed"
  receipt: Readonly<{ receiptRef: string; recordedAt: number; merchantNetKrw: number }> | null
  provenanceTruth: "SIMULATED"
  externalProviderConnected: false
  externalEffect: "none"
}>
export type SettlementSupportB = Readonly<{
  operationRef: string
  reason: SettlementSupportReasonB
  phase: "review" | "pending" | "unknown" | "failed" | "stale" | "submitted"
  summary: NonNullable<ReturnType<typeof integrationSettlementExportB>>
  createdAt: number
  attempts: number
  ticket: Readonly<{ ticketRef: string; createdAt: number }> | null
}>
export type SubmittedSettlementSupportB = SettlementSupportB & Readonly<{
  phase: "submitted"
  ticket: NonNullable<SettlementSupportB["ticket"]>
}>

function privateCredentialContext(credential: KPassDemoCredential | null) {
  return credential ? JSON.stringify([credential.credentialId, credential.status, credential.issuedAt, credential.expiresAt, credential.claims]) : "no-credential"
}

/** This is a local ledger reconciliation, never a provider payout check. */
export function integrationLedgerSnapshotB(commerce: StableCommerceBState) {
  if (commerce.status === "idle" || commerce.receiptCount !== 1 || !commerce.receiptId || !Number.isSafeInteger(commerce.chargedDebit) || commerce.chargedDebit <= 0) return null
  const ledger = commerce.ledger
  const minor = (amount: number) => {
    const value = Math.round(amount * 1_000)
    return Number.isSafeInteger(value) && Math.abs(amount * 1_000 - value) < 0.000001 ? value : NaN
  }
  const validPair = (rows: typeof ledger, magnitudeKrw: number) => {
    if (rows.length !== 2) return false
    const holder = rows.find(row => row.side === "holder")
    const merchant = rows.find(row => row.side === "merchant")
    return !!holder && !!merchant && holder.operationId === merchant.operationId
      && holder.receiptId === merchant.receiptId && holder.amount === -merchant.amount
      && minor(merchant.amount) === magnitudeKrw
  }
  const refunded = commerce.status === "refunded"
  const refundRows = ledger.filter(row => row.kind === "REFUND")
  const refundIds = [...new Set(refundRows.map(row => row.operationId))]
  const refundKrw = refundRows.filter(row => row.side === "holder").reduce((total, row) => total + minor(row.amount), 0)
  const balanced = ledger.length === 2 + refundIds.length * 2
    && validPair(ledger.filter(row => row.kind === "PAYMENT"), commerce.chargedDebit * 1_000)
    && ledger.filter(row => row.kind === "PAYMENT").every(row => row.receiptId === commerce.receiptId)
    && refundIds.length === commerce.refundCount
    && refundIds.every(id => {
      const rows = refundRows.filter(row => row.operationId === id)
      const amount = minor(rows.find(row => row.side === "holder")?.amount ?? NaN)
      return amount > 0 && validPair(rows, -amount)
    })
    && Number.isSafeInteger(refundKrw) && refundKrw >= 0 && refundKrw <= commerce.chargedDebit * 1_000
    && (refunded ? refundKrw === commerce.chargedDebit * 1_000 : refundKrw < commerce.chargedDebit * 1_000)
  return {
    // Private reconciliation identity. This value never enters event payloads.
    revision: JSON.stringify([commerce.status, commerce.receiptId, commerce.chargedDebit, ledger]),
    balanced,
    paymentKrw: commerce.chargedDebit * 1_000,
    refundKrw,
    merchantNetKrw: commerce.chargedDebit * 1_000 - refundKrw,
  }
}

/** The only exportable chain-candidate fields are an allowlist. There is no
 * fake tx hash, credential/DID hash, private source key, or visitor data here. */
export function integrationEvidencePayloadB(event: IntegrationDemoEventB) {
  return Object.freeze({ schemaVersion: 1, eventType: event.eventType, randomEventRef: event.eventRef, aggregateKind: event.aggregateKind, policyVersion: event.policyVersion })
}

/** Consumer-approved sample export, not a raw ledger dump. Even the receipt
 * reference is allowlisted; reconciliation revisions contain private rows. */
export function integrationSettlementExportB(snapshot: IntegrationBusinessSnapshotB) {
  const ledger = integrationLedgerSnapshotB(snapshot.commerce)
  const order = stableCommerceOrderB(snapshot.commerce)
  if (!ledger?.balanced || snapshot.commerce.receiptId !== order.receiptId) return null
  return Object.freeze({ ...TRUTH, schemaVersion: 1 as const, currency: "KRW" as const, paymentReceiptRef: order.receiptId,
    paymentKrw: ledger.paymentKrw, refundKrw: ledger.refundKrw, merchantNetKrw: ledger.merchantNetKrw })
}

/** Session-only interactive simulator. The private request registry enforces
 * one use even when a caller holds an older view. No operation grants app
 * authority, changes its wallet, or claims cryptographic verification. */
export function createIntegrationDemoEngineB(sampleMode: boolean, randomRef: () => string = () => crypto.randomUUID()) {
  let events: readonly IntegrationDemoEventB[] = []
  let settlement: IntegrationSettlementB | null = null
  let partner: PartnerRequestViewB | null = null
  let support: SettlementSupportB | null = null
  let supportHistory: readonly SubmittedSettlementSupportB[] = Object.freeze([])
  let supportRevision: string | null = null
  let trustedRequest: OndoBPresentationRequest | null = null
  let expectedCredentialId: string | null = null
  let checkedCredentialContext: string | null = null
  let checkedPolicyResult: string | null = null
  const seen = new Map<string, string>()
  const issuedVouchers = new Set<string>()
  const eventKind: Record<IntegrationDemoEventType, IntegrationDemoEventB["aggregateKind"]> = {
    KPassIssued: "credential", WalletLinked: "wallet", PaymentAuthorized: "payment", VoucherIssued: "voucher", VoucherRedeemed: "voucher", PartnerSettlementLogged: "settlement",
  }
  function emit(type: IntegrationDemoEventType, privateKey: string, now: number) {
    if (!sampleMode || seen.has(privateKey) || !Number.isFinite(now)) return
    const eventRef = `sample-event:${randomRef()}`
    seen.set(privateKey, eventRef)
    events = [...events, Object.freeze({ ...TRUTH, eventRef, eventType: type, aggregateKind: eventKind[type], policyVersion: KPASS_DEMO_POLICY_VERSION, phase: "queued" as const, attempts: 0, occurredAt: now, receipt: null })]
  }
  function sync(snapshot: IntegrationBusinessSnapshotB, now = Date.now()) {
    if (!sampleMode) return
    const { credential, commerce } = snapshot
    if (credential && isKPassDemoCredentialCurrent(credential, now)) emit("KPassIssued", `credential:${kpassDemoIssuanceRef(credential.credentialId)}`, credential.issuedAt)
    if (snapshot.walletReady) emit("WalletLinked", "wallet:current-sample-session", now)
    const ledger = integrationLedgerSnapshotB(commerce)
    const authorization = commerce.paymentOperation
    const order = stableCommerceOrderB(commerce)
    if (authorization && authorization.operationId === order.operationId && authorization.quote.offerId === order.offerId
      && authorization.provenanceTruth === "SIMULATED" && authorization.externalProviderConnected === false && authorization.externalEffect === "none"
      && authorization.authorizedAt !== null && Number.isFinite(authorization.authorizedAt) && authorization.authorizedAt <= now
      && isStableCommerceBLockedQuote(authorization.quote, new Date(authorization.authorizedAt)) && authorization.amountKrw === authorization.quote.finalDebit * 1_000) {
      // Authorization is evidence of a hold only. Settlement still requires the
      // captured, balanced payment ledger below; no voucher is used here.
      emit("PaymentAuthorized", `payment:${order.receiptId}`, authorization.authorizedAt)
    }
    if (ledger?.balanced) {
      // A paid/refunded sample with its balanced PAYMENT pair establishes the
      // earlier sample payment; wallet readiness alone does not.
      emit("PaymentAuthorized", `payment:${commerce.receiptId}`, now)
      if (commerce.voucherApplied) emit("VoucherRedeemed", `redemption:${commerce.receiptId}`, now)
    }
    // Do not erase a prior successful event when a refund changes the ledger.
    // The previous immutable receipt is retained, but is not current approval.
    if (settlement && (!ledger || !ledger.balanced || ledger.revision !== settlement.revision)) {
      settlement = Object.freeze({ ...settlement, phase: "mismatched" })
    }
    if (support && ["review", "failed"].includes(support.phase) && (!ledger?.balanced || supportRevision !== ledger.revision)) support = Object.freeze({ ...support, phase: "stale" })
  }
  function read() { return Object.freeze({ partner, events, settlement, support, supportHistory }) }
  /** A receipt is an immutable historical sample, not reusable authority.
   * Current context and clock are checked separately on every visible read. */
  function partnerReceiptState(credential: KPassDemoCredential | null, now = Date.now()) {
    if (!sampleMode || !partner?.receipt) return null
    if (!Number.isFinite(now) || now < partner.receipt.checkedAt || (partner.receipt.checkedAt < partner.expiresAt && now >= partner.expiresAt)) return { status: "stale" as const, reason: "request_expired" as const }
    if (checkedCredentialContext !== privateCredentialContext(credential)) return { status: "stale" as const, reason: "context_changed" as const }
    const latest = evaluateKPassService(credential, { service: partner.purpose, now })
    if (checkedPolicyResult !== `${latest.status}:${latest.reason}`) return { status: "stale" as const, reason: "policy_changed" as const }
    return { status: "current" as const, reason: "same_check_context" as const }
  }
  function startRequest(credential: KPassDemoCredential | null, purpose: PartnerSamplePurpose, sampleCase: PartnerSampleCase = "normal", now = Date.now()) {
    if (!sampleMode || !["person", "age", "visitor_benefit"].includes(purpose) || !["normal", "wrong_audience", "replay", "expired", "revoked"].includes(sampleCase) || !Number.isFinite(now)) return null
    expectedCredentialId = credential?.credentialId ?? null
    checkedCredentialContext = null
    checkedPolicyResult = null
    const binding = createKPassPresentationBinding(expectedCredentialId ?? "sample:no-credential", purpose, { audience: "ondo.sample.partner", domain: "partner.ondo.demo" })
    const issuedAt = sampleCase === "expired" ? now - KTOUR_ID_PRESENTATION_TTL_MS - 1 : now
    trustedRequest = createPresentationRequestB(issuedAt, `sample-request:${randomRef()}`, binding)
    if (sampleCase === "replay") trustedRequest = { ...trustedRequest, consumedAt: now }
    partner = Object.freeze({ requestRef: trustedRequest.nonce, purpose, sampleCase, phase: "request", expiresAt: trustedRequest.expiresAt, receipt: null })
    return partner
  }
  function openConsent() {
    if (!sampleMode || !partner || partner.phase !== "request") return
    partner = Object.freeze({ ...partner, phase: "consent" })
  }
  function resolveHolder(credential: KPassDemoCredential | null, consent: "approve" | "deny", now = Date.now()) {
    if (!sampleMode || !partner || !trustedRequest || !Number.isFinite(now) || (partner.phase !== "consent" && partner.phase !== "result")) return null
    const observed = partner.sampleCase === "wrong_audience" && trustedRequest.binding
      ? { ...trustedRequest, binding: { ...trustedRequest.binding, audience: "another.sample.partner" } }
      : trustedRequest
    const resolution = resolvePresentationRequestB(observed, consent, now, trustedRequest.binding)
    trustedRequest = { ...trustedRequest, consumedAt: resolution.request.consumedAt }
    let decision: Pick<MinimalPartnerReceiptB, "decision" | "reason">
    const contextChanged = expectedCredentialId !== (credential?.credentialId ?? null)
    if (!resolution.approved) {
      const reason = resolution.code === "PRESENTATION_DENIED" ? "consent_denied"
        : resolution.code === "PRESENTATION_REPLAY" ? "request_replayed"
          : resolution.code === "PRESENTATION_REQUEST_EXPIRED" ? "request_expired" : "wrong_audience"
      decision = { decision: reason === "request_expired" ? "expired" : "denied", reason }
    } else if (contextChanged) decision = { decision: "denied", reason: "context_changed" }
    else {
      // The revoked case changes only this verifier's prepared status response.
      // It never mutates the holder credential or creates another credential.
      const latest = credential && partner.sampleCase === "revoked" ? { ...credential, status: "revoked" as const } : credential
      const result = evaluateKPassService(latest, { service: partner.purpose, now })
      decision = { decision: result.status, reason: result.reason }
    }
    const receipt: MinimalPartnerReceiptB = Object.freeze({ ...TRUTH, receiptRef: `sample-check:${randomRef()}`, ...decision, purpose: partner.purpose, checkedAt: now, sharedPredicates: Object.freeze(resolution.approved && !contextChanged ? [...trustedRequest.binding!.requestedClaims] : []) })
    checkedCredentialContext = privateCredentialContext(credential)
    const actualPolicy = evaluateKPassService(credential, { service: partner.purpose, now })
    checkedPolicyResult = `${actualPolicy.status}:${actualPolicy.reason}`
    partner = Object.freeze({ ...partner, phase: "result", receipt })
    return receipt
  }
  function issueVoucher(credential: KPassDemoCredential | null, now = Date.now()) {
    if (!sampleMode) return null
    const decision = evaluateKPassService(credential, { service: "visitor_benefit", now })
    if (decision.status !== "allowed" || !credential) return decision
    const key = `voucher:${kpassDemoIssuanceRef(credential.credentialId)}:${credential.claims.visitorBenefit.entitlementId}`
    if (!issuedVouchers.has(key)) {
      issuedVouchers.add(key)
      // Explicit partner-console sample issue. Not an inferred campaign API
      // callback, and does not add a new benefit to the consumer's balance.
      emit("VoucherIssued", key, now)
    }
    return decision
  }
  function beginSettlement(snapshot: IntegrationBusinessSnapshotB) {
    if (!sampleMode) return null
    const ledger = integrationLedgerSnapshotB(snapshot.commerce)
    if (!ledger) return null
    if (settlement?.phase === "settled" && settlement.revision === ledger.revision && ledger.balanced) return settlement
    settlement = Object.freeze({ ...TRUTH, revision: ledger.revision, paymentKrw: ledger.paymentKrw, refundKrw: ledger.refundKrw, merchantNetKrw: ledger.merchantNetKrw, phase: ledger.balanced ? "pending" : "mismatched", receipt: null })
    return settlement
  }
  function finishSettlement(snapshot: IntegrationBusinessSnapshotB, outcome: IntegrationSampleOutcome, now = Date.now()) {
    if (!sampleMode || !settlement || settlement.phase !== "pending" || !Number.isFinite(now)) return settlement
    const ledger = integrationLedgerSnapshotB(snapshot.commerce)
    if (!ledger || !ledger.balanced || ledger.revision !== settlement.revision || outcome === "mismatch") {
      settlement = Object.freeze({ ...settlement, phase: "mismatched" })
    } else if (outcome === "failure") settlement = Object.freeze({ ...settlement, phase: "failed" })
    else if (outcome === "success") {
      settlement = Object.freeze({ ...settlement, phase: "settled", receipt: Object.freeze({ receiptRef: `sample-settlement:${randomRef()}`, recordedAt: now, merchantNetKrw: settlement.merchantNetKrw }) })
      emit("PartnerSettlementLogged", `settlement:${ledger.revision}`, now)
    }
    return settlement
  }
  function startSupport(snapshot: IntegrationBusinessSnapshotB, reason: SettlementSupportReasonB, now = Date.now()) {
    if (!sampleMode || !["mismatch", "payment", "refund"].includes(reason) || !Number.isSafeInteger(now) || now < 0) return null
    // An unknown response is still the same submission, never a fresh ticket.
    if (support && ["pending", "unknown"].includes(support.phase)) return support
    const summary = integrationSettlementExportB(snapshot)
    const ledger = integrationLedgerSnapshotB(snapshot.commerce)
    if (!summary || !ledger) return null
    if (support && support.reason === reason && supportRevision === ledger.revision && support.phase !== "stale") return support
    supportRevision = ledger.revision
    support = Object.freeze({ operationRef: `sample-support:${randomRef()}`, reason, phase: "review", summary, createdAt: now, attempts: 0, ticket: null })
    return support
  }
  function submitSupport(snapshot: IntegrationBusinessSnapshotB, operationRef: string) {
    if (!sampleMode || !support || support.operationRef !== operationRef || !["review", "failed"].includes(support.phase)) return null
    const ledger = integrationLedgerSnapshotB(snapshot.commerce)
    if (!ledger?.balanced || ledger.revision !== supportRevision) {
      support = Object.freeze({ ...support, phase: "stale" })
      return support
    }
    support = Object.freeze({ ...support, phase: "pending", attempts: support.attempts + 1 })
    return support
  }
  function finishSupport(operationRef: string, outcome: SettlementSupportOutcomeB, now = Date.now()) {
    if (!sampleMode || !support || support.operationRef !== operationRef || !["pending", "unknown"].includes(support.phase)
      || !["success", "failure", "unknown"].includes(outcome) || !Number.isSafeInteger(now) || now < support.createdAt) return null
    // Resolve the frozen, consented submission even if a later refund changed
    // the current ledger. This historical ticket cannot approve any payment.
    support = Object.freeze({ ...support, phase: outcome === "success" ? "submitted" : outcome === "failure" ? "failed" : "unknown",
      ticket: outcome === "success" ? Object.freeze({ ticketRef: `sample-ticket:${randomRef()}`, createdAt: now }) : null })
    if (support.phase === "submitted" && support.ticket) {
      // Append only when the pending operation first succeeds. Repeated checks
      // cannot reach this branch, and later requests cannot overwrite history.
      supportHistory = Object.freeze([...supportHistory, Object.freeze({ ...support, phase: "submitted" as const, ticket: support.ticket })])
    }
    return support
  }
  function newSupport(operationRef: string) {
    // An explicit new inquiry must not abandon a still-unresolved submission.
    if (!sampleMode || !support || support.operationRef !== operationRef || support.phase !== "submitted") return false
    support = null; supportRevision = null
    return true
  }
  function cancelSupport(operationRef: string) {
    if (!sampleMode || !support || support.operationRef !== operationRef || !["review", "failed", "stale"].includes(support.phase)) return false
    support = null; supportRevision = null
    return true
  }
  function submitEvent(eventRef: string) {
    if (!sampleMode) return
    events = events.map(event => event.eventRef !== eventRef || (event.phase !== "queued" && event.phase !== "failed") ? event : Object.freeze({ ...event, phase: "pending" as const, attempts: event.attempts + 1 }))
  }
  function finishEvent(eventRef: string, outcome: Exclude<IntegrationSampleOutcome, "mismatch">, now = Date.now()) {
    if (!sampleMode || !Number.isFinite(now)) return
    events = events.map(event => {
      if (event.eventRef !== eventRef || event.phase !== "pending" || outcome === "pending") return event
      return Object.freeze({ ...event, phase: outcome === "failure" ? "failed" as const : "recorded" as const, receipt: outcome === "failure" ? null : Object.freeze({ receiptRef: `sample-anchor:${randomRef()}`, recordedAt: now, transactionHash: null }) })
    })
  }
  function reset() {
    events = []; settlement = null; partner = null; support = null; supportHistory = Object.freeze([]); supportRevision = null; trustedRequest = null; expectedCredentialId = null; checkedCredentialContext = null; checkedPolicyResult = null
    seen.clear(); issuedVouchers.clear()
  }
  return { read, sync, partnerReceiptState, startRequest, openConsent, resolveHolder, issueVoucher, beginSettlement, finishSettlement, startSupport, submitSupport, finishSupport, newSupport, cancelSupport, submitEvent, finishEvent, reset }
}
