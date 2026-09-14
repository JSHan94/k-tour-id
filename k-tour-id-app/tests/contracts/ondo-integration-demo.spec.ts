import { expect, test } from "@playwright/test"
import { createIntegrationDemoEngineB, integrationEvidencePayloadB, integrationLedgerSnapshotB, INTEGRATION_DEMO_EVENT_TYPES, type IntegrationBusinessSnapshotB } from "../../features/ondo/integration-demo-b/integration-demo-model-b"
import { completeKPassDemoAgeProofB, createSimulatedCredentialB, KTOUR_ID_PRESENTATION_TTL_MS } from "../../features/ondo/identity-b/ktour-id-setup-model-b"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import { createStableCommerceBLockedQuote, createStableCommerceBState, stableCommerceBReducer } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = Date.parse("2026-09-08T09:00:00Z")
const credential = () => createSimulatedCredentialB("passport_ekyc", NOW)
function engine(sampleMode = true) { let serial = 0; return createIntegrationDemoEngineB(sampleMode, () => `test-${++serial}`) }
function snapshot(): IntegrationBusinessSnapshotB { return { credential: credential(), walletReady: false, commerce: createStableCommerceBState() } }
function paid(benefit = false) {
  let commerce = createStableCommerceBState()
  if (benefit) commerce = stableCommerceBReducer(commerce, { type: "ACCEPT_BENEFIT" })
  commerce = stableCommerceBReducer(commerce, { type: "CONFIRM", quote: createStableCommerceBLockedQuote(commerce, new Date(NOW + 60_000)) })
  return stableCommerceBReducer(commerce, { type: "PAYMENT_RETURN", outcome: "success" })
}

test("INTEGRATION-001 provider mode cannot create requests, business events, issues or settlements", () => {
  const demo = engine(false)
  const state = { ...snapshot(), walletReady: true, commerce: paid(true) }
  demo.sync(state, NOW)
  expect(demo.startRequest(state.credential, "age", "normal", NOW)).toBeNull()
  demo.openConsent()
  expect(demo.resolveHolder(state.credential, "approve", NOW)).toBeNull()
  expect(demo.issueVoucher(state.credential, NOW)).toBeNull()
  expect(demo.beginSettlement(state)).toBeNull()
  expect(demo.read()).toEqual({ partner: null, events: [], settlement: null, support: null, supportHistory: [] })
})

test("INTEGRATION-002 partner request requires holder step and returns only a minimal service result", () => {
  const demo = engine()
  const person = credential()
  const before = JSON.stringify(person)
  demo.startRequest(person, "age", "normal", NOW)
  expect(demo.resolveHolder(person, "approve", NOW)).toBeNull()
  demo.openConsent()
  const result = demo.resolveHolder(person, "approve", NOW + 1)!
  expect(result).toMatchObject({ decision: "allowed", purpose: "age", sharedPredicates: ["ageOver19"], provenanceTruth: "SIMULATED", externalProviderConnected: false, externalEffect: "none" })
  expect(Object.keys(result).sort()).toEqual(["checkedAt", "decision", "externalEffect", "externalProviderConnected", "provenanceTruth", "purpose", "reason", "receiptRef", "sharedPredicates"].sort())
  expect(JSON.stringify(result)).not.toContain(person.credentialId)
  expect(JSON.stringify(result)).not.toMatch(/passport_nfc|stayPeriod|paymentLimit|userType/)
  expect(JSON.stringify(person)).toBe(before)
})

test("INTEGRATION-003 denial is consumed and cannot later be changed into approval", () => {
  const demo = engine()
  demo.startRequest(credential(), "age", "normal", NOW)
  demo.openConsent()
  expect(demo.resolveHolder(credential(), "deny", NOW + 1)).toMatchObject({ decision: "denied", reason: "consent_denied", sharedPredicates: [] })
  expect(demo.resolveHolder(credential(), "approve", NOW + 2)).toMatchObject({ decision: "denied", reason: "request_replayed", sharedPredicates: [] })
})

for (const [sampleCase, reason, status] of [
  ["wrong_audience", "wrong_audience", "denied"], ["replay", "request_replayed", "denied"],
  ["expired", "request_expired", "expired"], ["revoked", "credential_revoked", "denied"],
] as const) {
  test(`INTEGRATION-004 ${sampleCase} is rejected without changing the app credential`, () => {
    const demo = engine()
    const person = credential()
    demo.startRequest(person, "age", sampleCase, NOW)
    demo.openConsent()
    expect(demo.resolveHolder(person, "approve", NOW + 1)).toMatchObject({ decision: status, reason })
    expect(person.status).toBe("simulated_ready")
    expect(demo.read().events).toEqual([])
  })
}

test("INTEGRATION-005 missing, negative, expired and revoked claims stay different", () => {
  for (const [scenario, purpose, status, reason] of [
    [null, "person", "needs_proof", "credential_required"],
    ["age_unknown", "age", "needs_proof", "age_proof_required"],
    ["under_age", "age", "denied", "age_not_eligible"],
    ["stay_expired", "visitor_benefit", "expired", "stay_expired"],
    ["revoked", "person", "denied", "credential_revoked"],
  ] as const) {
    const demo = engine()
    const person = scenario ? createSimulatedCredentialB("passport_ekyc", NOW, scenario) : null
    demo.startRequest(person, purpose, "normal", NOW)
    demo.openConsent()
    expect(demo.resolveHolder(person, "approve", NOW + 1)).toMatchObject({ decision: status, reason })
  }
})

test("INTEGRATION-006 latest status, expiry and holder binding are checked at consent, not request creation", () => {
  const demo = engine()
  const person = credential()
  demo.startRequest(person, "person", "normal", NOW)
  demo.openConsent()
  expect(demo.resolveHolder({ ...person, status: "revoked" }, "approve", NOW + 1)).toMatchObject({ decision: "denied", reason: "credential_revoked" })
  demo.startRequest(person, "person", "normal", NOW)
  demo.openConsent()
  expect(demo.resolveHolder(createSimulatedCredentialB("mobile_id", NOW + 1), "approve", NOW + 2)).toMatchObject({ decision: "denied", reason: "context_changed", sharedPredicates: [] })
  demo.startRequest(person, "person", "normal", NOW)
  demo.openConsent()
  expect(demo.resolveHolder(person, "approve", NOW + 120_000)).toMatchObject({ decision: "expired", reason: "request_expired" })
})

test("INTEGRATION-007 six event types appear only after their own simulated business condition", () => {
  const demo = engine()
  const empty = { ...snapshot(), credential: null }
  demo.sync(empty, NOW)
  expect(demo.read().events).toEqual([])
  const start = { ...snapshot(), walletReady: true }
  demo.sync(start, NOW)
  expect(demo.read().events.map(event => event.eventType)).toEqual(["KPassIssued", "WalletLinked"])
  demo.issueVoucher(start.credential, NOW + 1)
  const state = { ...start, commerce: paid(true) }
  demo.sync(state, NOW + 2)
  expect(demo.read().events.map(event => event.eventType)).toEqual(["KPassIssued", "WalletLinked", "VoucherIssued", "PaymentAuthorized", "VoucherRedeemed"])
  demo.beginSettlement(state)
  expect(demo.read().events).toHaveLength(5)
  demo.finishSettlement(state, "success", NOW + 3)
  expect(demo.read().events.map(event => event.eventType).sort()).toEqual([...INTEGRATION_DEMO_EVENT_TYPES].sort())
  expect(demo.read().events.every(event => event.phase === "queued" && event.receipt === null)).toBe(true)
  demo.sync(state, NOW + 4)
  demo.issueVoucher(start.credential, NOW + 4)
  demo.beginSettlement(state)
  demo.finishSettlement(state, "success", NOW + 4)
  expect(demo.read().events).toHaveLength(6)
})

test("INTEGRATION-008 wallet readiness and an arbitrary paid flag cannot fabricate payment events", () => {
  const demo = engine()
  demo.sync({ ...snapshot(), walletReady: true, commerce: { ...createStableCommerceBState(), status: "paid", chargedDebit: 22 } }, NOW)
  expect(demo.read().events.map(event => event.eventType)).toEqual(["KPassIssued", "WalletLinked"])
  const malformed = paid()
  malformed.ledger = malformed.ledger.map(row => row.side === "merchant" ? { ...row, amount: row.amount - 1 } : row)
  demo.sync({ ...snapshot(), commerce: malformed }, NOW)
  expect(demo.read().events.some(event => event.eventType === "PaymentAuthorized")).toBe(false)
  expect(integrationLedgerSnapshotB(malformed)?.balanced).toBe(false)
})

test("INTEGRATION-009 benefit issue re-evaluates its own entitlement and never grants balance or spends", () => {
  const demo = engine()
  for (const scenario of ["revoked", "stay_expired", "benefit_used"] as const) {
    const person = createSimulatedCredentialB("passport_ekyc", NOW, scenario)
    expect(demo.issueVoucher(person, NOW)?.status).not.toBe("allowed")
  }
  expect(demo.issueVoucher(null, NOW)?.status).toBe("needs_proof")
  expect(demo.read().events).toHaveLength(0)
  const person = credential()
  const before = JSON.stringify(person)
  expect(demo.issueVoucher(person, NOW)?.status).toBe("allowed")
  demo.issueVoucher(person, NOW + 1)
  expect(demo.read().events).toHaveLength(1)
  expect(JSON.stringify(person)).toBe(before)
})

test("INTEGRATION-010 settlement pending, failure, mismatch and retry never change the commerce ledger", () => {
  const demo = engine()
  const state = { ...snapshot(), commerce: paid() }
  const before = JSON.stringify(state)
  for (const [outcome, status] of [["pending", "pending"], ["failure", "failed"], ["mismatch", "mismatched"]] as const) {
    demo.beginSettlement(state)
    expect(demo.finishSettlement(state, outcome, NOW)?.phase).toBe(status)
    expect(demo.read().events).toHaveLength(0)
  }
  demo.beginSettlement(state)
  expect(demo.finishSettlement(state, "success", NOW)?.phase).toBe("settled")
  expect(demo.read().events).toHaveLength(1)
  expect(JSON.stringify(state)).toBe(before)
})

test("INTEGRATION-011 refund invalidates current settlement without erasing immutable past events", () => {
  const demo = engine()
  const state = { ...snapshot(), commerce: paid(true) }
  demo.sync(state, NOW)
  demo.beginSettlement(state)
  demo.finishSettlement(state, "success", NOW)
  const originalEvents = [...demo.read().events]
  const originalSettlementReceipt = demo.read().settlement!.receipt
  const refunded = { ...state, commerce: stableCommerceBReducer(state.commerce, { type: "REFUND" }) }
  demo.sync(refunded, NOW + 1)
  expect(demo.read().settlement).toMatchObject({ phase: "mismatched", receipt: originalSettlementReceipt })
  expect(demo.read().events).toEqual(originalEvents)
  expect(demo.read().events.some(event => event.eventType === "VoucherRedeemed")).toBe(true)
  demo.beginSettlement(refunded)
  expect(demo.finishSettlement(refunded, "success", NOW + 2)).toMatchObject({ phase: "settled", merchantNetKrw: 0, paymentKrw: 19_000, refundKrw: 19_000 })
  expect(demo.read().events.filter(event => event.eventType === "PartnerSettlementLogged")).toHaveLength(2)
  expect(originalSettlementReceipt!.merchantNetKrw).toBe(19_000)
})

test("INTEGRATION-012 ledger change while reconciliation is pending cannot finalize the old net amount", () => {
  const demo = engine()
  const state = { ...snapshot(), commerce: paid() }
  demo.beginSettlement(state)
  const refunded = { ...state, commerce: stableCommerceBReducer(state.commerce, { type: "REFUND" }) }
  expect(demo.finishSettlement(refunded, "success", NOW)?.phase).toBe("mismatched")
  expect(demo.read().events).toHaveLength(0)
})

test("INTEGRATION-013 outbox failure and retry reuse one event without repeating its business action", () => {
  const demo = engine()
  const state = { ...snapshot(), commerce: paid(true) }
  const before = JSON.stringify(state)
  demo.sync(state, NOW)
  const event = demo.read().events.find(item => item.eventType === "PaymentAuthorized")!
  demo.submitEvent(event.eventRef)
  demo.submitEvent(event.eventRef)
  demo.finishEvent(event.eventRef, "pending", NOW)
  expect(demo.read().events.find(item => item.eventRef === event.eventRef)).toMatchObject({ phase: "pending", attempts: 1, receipt: null })
  demo.finishEvent(event.eventRef, "failure", NOW)
  demo.submitEvent(event.eventRef)
  demo.finishEvent(event.eventRef, "success", NOW + 1)
  const recorded = demo.read().events.find(item => item.eventRef === event.eventRef)!
  expect(recorded).toMatchObject({ eventRef: event.eventRef, phase: "recorded", attempts: 2, receipt: { transactionHash: null }, externalProviderConnected: false, externalEffect: "none" })
  demo.submitEvent(event.eventRef)
  demo.finishEvent(event.eventRef, "success", NOW + 2)
  expect(demo.read().events.find(item => item.eventRef === event.eventRef)).toBe(recorded)
  expect(event.phase).toBe("queued")
  expect(JSON.stringify(state)).toBe(before)
})

test("INTEGRATION-014 exportable evidence is non-PII allowlisted and contains no invented chain receipt", () => {
  const demo = engine()
  demo.sync({ ...snapshot(), commerce: paid(true) }, NOW)
  for (const event of demo.read().events) {
    const payload = integrationEvidencePayloadB(event)
    expect(Object.keys(payload).sort()).toEqual(["schemaVersion", "eventType", "randomEventRef", "aggregateKind", "policyVersion"].sort())
    expect(JSON.stringify(payload)).not.toMatch(/credentialId|kpass-demo:|passport|birth|nationality|name|balance|receiptId|latitude|longitude|0x[a-f0-9]{20}/i)
  }
})

test("INTEGRATION-015 full demo reset clears private requests and ephemeral observer receipts", () => {
  const demo = engine()
  const state = snapshot()
  demo.sync(state, NOW)
  demo.issueVoucher(state.credential, NOW)
  demo.startRequest(state.credential, "age", "normal", NOW)
  demo.openConsent()
  const earlier = [...demo.read().events]
  demo.reset()
  expect(demo.read()).toEqual({ partner: null, events: [], settlement: null, support: null, supportHistory: [] })
  expect(demo.resolveHolder(state.credential, "approve", NOW)).toBeNull()
  expect(earlier).toHaveLength(2)
})

test("INTEGRATION-016 a changed or revoked pass makes an earlier allowed receipt stale, not current authority", () => {
  const demo = engine()
  const person = credential()
  demo.startRequest(person, "age", "normal", NOW)
  demo.openConsent()
  const receipt = demo.resolveHolder(person, "approve", NOW + 1)!
  expect(demo.partnerReceiptState(person, NOW + 2)?.status).toBe("current")
  const revoked = { ...person, status: "revoked" as const }
  demo.sync({ ...snapshot(), credential: revoked }, NOW + 3)
  expect(demo.partnerReceiptState(revoked, NOW + 3)).toEqual({ status: "stale", reason: "context_changed" })
  expect(demo.partnerReceiptState(null, NOW + 3)?.status).toBe("stale")
  expect(demo.partnerReceiptState(createSimulatedCredentialB("passport_ekyc", NOW + 3), NOW + 4)?.status).toBe("stale")
  expect(demo.read().partner!.receipt).toBe(receipt)
  expect(receipt).toMatchObject({ decision: "allowed", checkedAt: NOW + 1 })
})

test("INTEGRATION-017 an open receipt expires on its request or service clock without a business state change", () => {
  const demo = engine()
  const person = credential()
  demo.startRequest(person, "age", "normal", NOW)
  demo.openConsent()
  const receipt = demo.resolveHolder(person, "approve", NOW + 1)!
  expect(demo.partnerReceiptState(person, NOW + KTOUR_ID_PRESENTATION_TTL_MS)).toEqual({ status: "stale", reason: "request_expired" })
  expect(demo.read().partner!.receipt).toBe(receipt)
  const shortStay = { ...person, claims: { ...person.claims, stayPeriod: { validFrom: NOW - 1, validUntil: NOW + 20 } } }
  demo.startRequest(shortStay, "visitor_benefit", "normal", NOW)
  demo.openConsent()
  expect(demo.resolveHolder(shortStay, "approve", NOW + 1)?.decision).toBe("allowed")
  expect(demo.partnerReceiptState(shortStay, NOW + 20)).toEqual({ status: "stale", reason: "policy_changed" })
  // A request that was already expired when checked keeps its truthful denial.
  demo.startRequest(person, "age", "expired", NOW)
  demo.openConsent()
  expect(demo.resolveHolder(person, "approve", NOW + 1)?.decision).toBe("expired")
  expect(demo.partnerReceiptState(person, NOW + 2)?.status).toBe("current")
})

test("INTEGRATION-018 age proof revision does not fabricate another issuance or benefit issue", () => {
  const demo = engine()
  const original = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "age_unknown")
  demo.sync({ ...snapshot(), credential: original }, NOW)
  demo.issueVoucher(original, NOW)
  const before = [...demo.read().events]
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-INTEGRATION-AGE-SUPPLEMENT" })!
  const proof = reviewFixture(authority, { outcome: "success", value: { predicate: "AGE_GTE_19", outcome: "eligible" } as const, now: new Date(NOW) })
  const revised = completeKPassDemoAgeProofB(original, proof, { allowReviewFixture: true }, NOW)!
  expect(revised.credentialId).not.toBe(original.credentialId)
  demo.sync({ ...snapshot(), credential: revised }, NOW + 1)
  demo.issueVoucher(revised, NOW + 1)
  expect(demo.read().events).toEqual(before)
  const newIssuance = createSimulatedCredentialB("passport_ekyc", NOW + 2, "adult_visitor")
  demo.sync({ ...snapshot(), credential: newIssuance }, NOW + 2)
  demo.issueVoucher(newIssuance, NOW + 2)
  expect(demo.read().events.filter(event => event.eventType === "KPassIssued")).toHaveLength(2)
  expect(demo.read().events.filter(event => event.eventType === "VoucherIssued")).toHaveLength(2)
})
