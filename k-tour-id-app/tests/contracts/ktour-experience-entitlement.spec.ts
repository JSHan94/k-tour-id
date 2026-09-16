import { expect, test } from "@playwright/test"
import {
  createExperienceB,
  createExperienceMockPermitB,
  EXPERIENCE_ACTOR_B,
  EXPERIENCE_CAMPAIGN_ID_B,
  EXPERIENCE_KEY_B,
  EXPERIENCE_OPEN_EVENT_B,
  EXPERIENCE_PLACE_ID_B,
  EXPERIENCE_SCOPE_MS_B,
  hasExperiencePermitB,
  reduceExperienceB,
  requestExperienceB,
  restoreExperienceB,
  type ExperienceCommandB,
  type ExperienceContextB,
  type ExperienceRecordB,
} from "../../features/ondo/experience-b/experience-model-b"
import { createPersonOnlySimulatedCredentialB, createPresentationRequestB, createSimulatedCredentialB, isPersonOnlySimulatedCredentialB, recoverSimulatedCredentialB, resolvePresentationRequestB } from "../../features/ondo/identity-b/ktour-id-setup-model-b"
import { createKPassPresentationBinding, evaluateKPassService, type KPassDemoCredential, type KPassScenario } from "../../features/ondo/contracts/kpass-capabilities"
import {
  authorizeBActionPresentationDecision,
  B_ACTION_GATE_SESSION_KEY,
  B_ACTION_GATE_TTL_MS,
  bActionPresentationPurpose,
  createBActionReviewAxis,
  createBExperienceActionReturn,
  createBExperiencePersonHandoff,
  DEFAULT_B_ACTION_GATE_SESSION,
  gatePlanForBAction,
  hashBActionReturnTo,
  isBActionReturnStructurallyValid,
  isBExperiencePersonHandoffCurrent,
  persistBActionGateSession,
  privateContextForBAction,
  registerBActionPresentationRequest,
  requiresBActionPresentation,
} from "../../features/ondo/identity-b/action-gate-contract-b"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import { hashReturnToSnapshot } from "../../features/ondo/contracts/return-to-integrity"

const NOW = Date.parse("2026-09-15T08:00:00.000Z")
const INTENT = "EXP-independent-review-0001"
const credential = (scenario: KPassScenario = "adult_visitor") => createSimulatedCredentialB("mobile_id", NOW, scenario)
const context = (proof: KPassDemoCredential | null = credential(), intentId = INTENT, now = NOW): ExperienceContextB => ({
  sampleMode: true, now, credential: proof, permit: createExperienceMockPermitB(intentId, proof, now),
})
function proposed(ctx = context()) {
  return reduceExperienceB(createExperienceB(INTENT, NOW), { type: "propose" }, ctx)
}
function granted(ctx = context()) {
  const proposal = proposed(ctx)
  return reduceExperienceB(proposal, { type: "approve", proposalDigest: proposal.scope!.proposalDigest }, ctx)
}
function consumed(ctx = context()) {
  return reduceExperienceB(granted(ctx), { type: "execution", outcome: "success" }, ctx)
}
function fulfilled(ctx = context()) {
  return reduceExperienceB(consumed(ctx), { type: "fulfill", outcome: "success" }, ctx)
}
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
const run = (record: ExperienceRecordB, command: ExperienceCommandB, ctx: ExperienceContextB) => reduceExperienceB(record, command, ctx)
class HandoffStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}
function livePersonHandoff(offset: number, receiptOffset = 1, fixtureId: "FX-PER-CX-SUCCESS" | "FX-PER-OTHER-SUCCESS" = "FX-PER-CX-SUCCESS") {
  const start = NOW + offset
  const now = new Date(start + 3)
  const action = createBExperienceActionReturn({ venueId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B, intentId: INTENT, now: new Date(start) })
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId })!
  const execution = reviewFixture(authority, { outcome: "success", value: { axis: "person" as const }, now: new Date(start + receiptOffset) })
  const person = createBActionReviewAxis("person", execution, now)!
  const storage = new HandoffStorage()
  const session = { ...DEFAULT_B_ACTION_GATE_SESSION, pending: action, person,
    personRoute: { tokenId: action.tokenId, route: "mobile_id_cx" as const } }
  const options = { allowReviewFixture: true } as const
  expect(persistBActionGateSession(storage, session, now, options)).toBe(true)
  return { storage, action, session, now, options }
}

test("EXP-001 the single local sample campaign is nonfinancial and not keyed by a replaceable credential", () => {
  const initial = createExperienceB(INTENT, NOW)
  expect(initial).toMatchObject({ version: 2, mockOnly: true, actor: EXPERIENCE_ACTOR_B, key: EXPERIENCE_KEY_B,
    placeId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B, scope: null,
    authorization: "none", fulfillment: "not_started", audit: "not_started", executionCount: 0, usedCount: 0 })
  expect(EXPERIENCE_KEY_B).toBe(`${EXPERIENCE_ACTOR_B}:${EXPERIENCE_CAMPAIGN_ID_B}`)
  expect(createExperienceB("EXP-second-wallet-0002", NOW).key).toBe(initial.key)
  expect(proposed().scope).toMatchObject({ maxUses: 1, moneyKrw: 0, action: "save-neighborhood-guide-to-pass", recipient: "demo-traveler-pass" })
})

test("EXP-002 preparing a proposal is not user approval and a different proposal cannot be approved", () => {
  const ctx = context()
  const proposal = proposed(ctx)
  expect(proposal.scope).toMatchObject({ consentDigest: null, approvedAt: null })
  expect(proposal.authorization).toBe("none")
  expect(run(proposal, { type: "approve", proposalDigest: "different-proposal" }, ctx)).toBe(proposal)
  expect(run(proposal, { type: "execution", outcome: "success" }, ctx)).toBe(proposal)
  const approved = run(proposal, { type: "approve", proposalDigest: proposal.scope!.proposalDigest }, ctx)
  expect(approved.scope?.approvedAt).toBe(NOW)
  expect(approved.scope?.consentDigest).toBeTruthy()
  expect(approved.authorization).toBe("granted")
  expect(approved.executionCount).toBe(0)
  expect(approved.usedCount).toBe(0)
})

test("EXP-003 serialized or cross-intent permits cannot authorize even valid sample credentials", () => {
  const initial = createExperienceB(INTENT, NOW)
  const ctx = context()
  expect(hasExperiencePermitB(initial, ctx)).toBe(true)
  for (const rejected of [
    { ...ctx, permit: null }, { ...ctx, permit: copy(ctx.permit) }, { ...ctx, sampleMode: false },
    { ...ctx, permit: createExperienceMockPermitB("EXP-different-intent", ctx.credential, NOW) },
    { ...ctx, credential: createSimulatedCredentialB("mobile_id", NOW + 1) },
  ]) {
    expect(hasExperiencePermitB(initial, rejected)).toBe(false)
    expect(run(initial, { type: "propose" }, rejected)).toBe(initial)
  }
})

test("EXP-004 Person-only experience does not infer age, stay, payment or unused financial-benefit claims", () => {
  for (const scenario of ["adult_visitor", "age_unknown", "under_age", "stay_expired", "limit_reached", "benefit_used"] as const) {
    const proof = credential(scenario)
    const before = copy(proof)
    const result = fulfilled(context(proof))
    expect(result.fulfillment, scenario).toBe("fulfilled")
    expect(result.usedCount, scenario).toBe(1)
    expect(proof).toEqual(before)
  }
})

test("EXP-005 missing Person, revoked/suspended status, risk or expired credentials fail closed", () => {
  const base = credential()
  const rejected: (KPassDemoCredential | null)[] = [null, credential("revoked"), credential("suspended"),
    { ...base, expiresAt: NOW }, { ...base, claims: { ...base.claims, personVerified: false } },
    { ...base, claims: { ...base.claims, riskFlag: "blocked" } },
    { ...base, claims: { ...base.claims, riskFlag: "review" } },
    { ...base, claims: { ...base.claims, serviceAccess: ["age"] } },
    { ...base, externalProviderConnected: true } as never]
  for (const proof of rejected) {
    const initial = createExperienceB(INTENT, NOW)
    const ctx = context(proof)
    expect(ctx.permit).toBeNull()
    expect(run(initial, { type: "propose" }, ctx)).toBe(initial)
  }
})

test("EXP-006 execution authorization, fulfillment and audit have distinct receipts and counters", () => {
  const ctx = context()
  const dispatched = consumed(ctx)
  expect(dispatched).toMatchObject({ authorization: "consumed", executionCount: 1, usedCount: 0,
    fulfillment: "pending", audit: "not_started", executionRef: `${INTENT}:execution`, fulfillmentRef: null, auditRef: null })
  const used = run(dispatched, { type: "fulfill", outcome: "success" }, ctx)
  expect(used).toMatchObject({ usedCount: 1, fulfillment: "fulfilled", audit: "pending", fulfillmentRef: `${INTENT}:service`, auditRef: null })
  const recorded = run(used, { type: "audit", outcome: "success" }, ctx)
  expect(recorded).toMatchObject({ audit: "confirmed", auditRef: `${INTENT}:audit`, executionCount: 1, usedCount: 1 })
  expect(restoreExperienceB(copy(recorded))).toEqual(recorded)
})

test("EXP-007 duplicate execution, fulfillment, audit and fresh proposal never produce a second use", () => {
  const ctx = context()
  const dispatched = consumed(ctx)
  expect(run(dispatched, { type: "execution", outcome: "success" }, ctx)).toBe(dispatched)
  const used = run(dispatched, { type: "fulfill", outcome: "success" }, ctx)
  expect(run(used, { type: "fulfill", outcome: "success" }, ctx)).toBe(used)
  expect(run(used, { type: "propose" }, ctx)).toBe(used)
  const recorded = run(used, { type: "audit", outcome: "success" }, ctx)
  expect(run(recorded, { type: "audit", outcome: "success" }, ctx)).toBe(recorded)
  expect(recorded).toMatchObject({ executionCount: 1, usedCount: 1 })
})

test("EXP-008 an audit outage retries only the audit and does not require a new execution grant", () => {
  const ctx = context()
  const used = fulfilled(ctx)
  const failed = run(used, { type: "audit", outcome: "failure" }, { ...ctx, permit: null })
  expect(failed).toMatchObject({ audit: "failed", fulfillment: "fulfilled", executionCount: 1, usedCount: 1 })
  const recovered = run(restoreExperienceB(copy(failed))!, { type: "audit", outcome: "success" }, { ...ctx, permit: null, credential: null })
  expect(recovered).toMatchObject({ audit: "confirmed", executionRef: used.executionRef, fulfillmentRef: used.fulfillmentRef, executionCount: 1, usedCount: 1 })
})

test("EXP-009 final eligibility is evaluated again after consumption and never rolls back observed execution", () => {
  const ctx = context()
  const dispatched = consumed(ctx)
  for (const proof of [credential("revoked"), credential("suspended"), null,
    { ...ctx.credential!, claims: { ...ctx.credential!.claims, personVerified: false } },
    { ...ctx.credential!, claims: { ...ctx.credential!.claims, riskFlag: "blocked" as const } }]) {
    const blocked = run(dispatched, { type: "fulfill", outcome: "success" }, { ...ctx, credential: proof })
    expect(blocked).toMatchObject({ authorization: "consumed", executionCount: 1, usedCount: 0, fulfillment: "blocked", blockReason: "eligibility", audit: "not_started" })
    expect(run(blocked, { type: "propose" }, ctx)).toBe(blocked)
  }
})

test("EXP-010 scope expires exactly at its deadline; no approval, dispatch or use is inferred", () => {
  const ctx = context()
  const proposal = proposed(ctx)
  const expired = { ...ctx, now: NOW + EXPERIENCE_SCOPE_MS_B }
  expect(run(proposal, { type: "approve", proposalDigest: proposal.scope!.proposalDigest }, expired)).toBe(proposal)
  const approved = granted(ctx)
  expect(run(approved, { type: "execution", outcome: "success" }, expired)).toBe(approved)
  expect(run(approved, { type: "expire" }, expired).authorization).toBe("expired")
  const dispatched = consumed(ctx)
  expect(run(dispatched, { type: "fulfill", outcome: "success" }, expired))
    .toMatchObject({ executionCount: 1, usedCount: 0, fulfillment: "blocked", blockReason: "expired" })
})

test("EXP-011 a pending unknown execution cannot be silently replaced or re-granted after expiry", () => {
  const ctx = context()
  const unknown = run(granted(ctx), { type: "execution", outcome: "unknown" }, ctx)
  expect(unknown).toMatchObject({ authorization: "unknown", executionCount: 0, usedCount: 0 })
  const later = context(ctx.credential, INTENT, NOW + EXPERIENCE_SCOPE_MS_B + 1)
  expect(run(unknown, { type: "propose" }, later)).toBe(unknown)
  expect(run(unknown, { type: "execution", outcome: "success" }, later)).toBe(unknown)
  // Explicit cancellation reconciliation offers an exit without inventing a
  // late dispatch timestamp or treating an unknown result as unused.
  const cancel = run(unknown, { type: "request_cancel" }, later)
  expect(cancel).toMatchObject({ authorization: "unknown", cancelRequested: true })
  expect(run(cancel, { type: "resolve_cancel", outcome: "revoked" }, later))
    .toMatchObject({ authorization: "revoked", executionCount: 0, usedCount: 0 })
})

test("EXP-012 confirmed unused cancellation permits a new proposal but requires fresh explicit approval", () => {
  const ctx = context()
  const original = granted(ctx)
  const cancelling = run(original, { type: "request_cancel" }, ctx)
  expect(cancelling).toMatchObject({ authorization: "unknown", cancelRequested: true, executionCount: 0 })
  expect(run(cancelling, { type: "propose" }, ctx)).toBe(cancelling)
  const revoked = run(cancelling, { type: "resolve_cancel", outcome: "revoked" }, ctx)
  const renewed = run(revoked, { type: "propose" }, context(ctx.credential, INTENT, NOW + 1))
  expect(renewed).toMatchObject({ intentId: INTENT, authorization: "none", cancelRequested: false, executionCount: 0, usedCount: 0 })
  expect(renewed.scope).toMatchObject({ consentDigest: null, approvedAt: null })
  expect(renewed.scope?.proposalDigest).not.toBe(original.scope?.proposalDigest)
  expect(run(renewed, { type: "approve", proposalDigest: original.scope!.proposalDigest }, context(ctx.credential, INTENT, NOW + 1))).toBe(renewed)
})

test("EXP-013 if consumption wins a cancellation race, it stays consumed and fulfillment stays blocked", () => {
  const ctx = context()
  const cancelling = run(granted(ctx), { type: "request_cancel" }, ctx)
  const result = run(cancelling, { type: "resolve_cancel", outcome: "consumed" }, ctx)
  expect(result).toMatchObject({ authorization: "consumed", executionCount: 1, fulfillment: "blocked", usedCount: 0, blockReason: "cancelled" })
  expect(run(result, { type: "resolve_cancel", outcome: "revoked" }, ctx)).toBe(result)
  expect(run(result, { type: "fulfill", outcome: "success" }, ctx)).toBe(result)
})

test("EXP-014 cancelling before approval is immediately unused but closing is not a reducer command", () => {
  const ctx = context()
  const proposal = proposed(ctx)
  const cancelled = run(proposal, { type: "request_cancel" }, ctx)
  expect(cancelled).toMatchObject({ authorization: "revoked", executionCount: 0, usedCount: 0 })
  expect(run(cancelled, { type: "execution", outcome: "success" }, ctx)).toBe(cancelled)
  expect(run(proposal, { type: "close" } as never, ctx)).toBe(proposal)
})

test("EXP-015 restored pending history cannot restore approval authority; rechecking does not execute twice", () => {
  const ctx = context()
  const approved = restoreExperienceB(copy(granted(ctx)))!
  const serialized = { ...ctx, permit: copy(ctx.permit) }
  expect(run(approved, { type: "execution", outcome: "success" }, serialized)).toBe(approved)
  const dispatched = restoreExperienceB(copy(consumed(ctx)))!
  const rechecked = context(ctx.credential)
  expect(run(dispatched, { type: "execution", outcome: "success" }, rechecked)).toBe(dispatched)
  expect(run(dispatched, { type: "fulfill", outcome: "success" }, rechecked))
    .toMatchObject({ executionCount: 1, usedCount: 1, executionRef: dispatched.executionRef })
})

test("EXP-016 restored scope rejects a different venue, campaign, recipient, agent, policy, maximum or digest", () => {
  const record = granted()
  for (const patch of [
    { placeId: "other-place" }, { campaignId: "other-campaign" }, { actor: "other-traveler" }, { key: "different-key" }, { mockOnly: false },
    { scope: { ...record.scope!, placeId: "other-place" } }, { scope: { ...record.scope!, campaignId: "other-campaign" } },
    { scope: { ...record.scope!, recipient: "another-wallet" } }, { scope: { ...record.scope!, agent: "other-agent" } },
    { scope: { ...record.scope!, maxUses: 2 } }, { scope: { ...record.scope!, moneyKrw: 1 } },
    { scope: { ...record.scope!, policy: "different-policy" } }, { scope: { ...record.scope!, action: "pay" } },
    { scope: { ...record.scope!, proposalDigest: "forged" } }, { scope: { ...record.scope!, consentDigest: "forged" } },
    { scope: { ...record.scope!, approvedAt: null, consentDigest: null } }, { unexpectedAuthority: true },
  ]) expect(restoreExperienceB({ ...copy(record), ...patch }), JSON.stringify(patch)).toBeNull()
})

test("EXP-017 incoherent receipt or counter history is unavailable, not reset to a fresh usable campaign", () => {
  const record = fulfilled()
  for (const patch of [
    { executionCount: 0 }, { usedCount: 0 }, { usedCount: 2 }, { authorization: "granted" },
    { executionRef: "different-execution" }, { fulfillmentRef: "different-use" },
    { fulfillment: "not_started" }, { audit: "confirmed", auditRef: null },
    { fulfillment: "blocked", blockReason: null }, { revision: -1 }, { updatedAt: NOW - 1 },
  ]) expect(restoreExperienceB({ ...copy(record), ...patch }), JSON.stringify(patch)).toBeNull()
})

test("EXP-018 every command is inert outside sample mode, with time rollback or malformed history", () => {
  const ctx = context()
  const record = granted(ctx)
  const commands: ExperienceCommandB[] = [{ type: "propose" }, { type: "approve", proposalDigest: record.scope!.proposalDigest },
    { type: "execution", outcome: "success" }, { type: "fulfill", outcome: "success" }, { type: "audit", outcome: "success" },
    { type: "request_cancel" }, { type: "resolve_cancel", outcome: "consumed" }, { type: "expire" }]
  for (const command of commands) {
    expect(run(record, command, { ...ctx, sampleMode: false })).toBe(record)
    expect(run(record, command, { ...ctx, now: NOW - 1 })).toBe(record)
    expect(run(record, command, { ...ctx, now: Number.NaN })).toBe(record)
    const malformed = { ...record, usedCount: 2 } as never
    expect(run(malformed, command, ctx)).toBe(malformed)
  }
})

test("EXP-019 a bounded identity grant expires no later than the actual credential", () => {
  const proof = { ...credential(), expiresAt: NOW + 500 }
  const ctx = context(proof)
  expect(ctx.permit?.expiresAt).toBe(NOW + 500)
  expect(proposed(ctx).scope?.expiresAt).toBe(NOW + 500)
  expect(hasExperiencePermitB(createExperienceB(INTENT, NOW), { ...ctx, now: NOW + 500 })).toBe(false)
  for (const id of ["", "EXP-short", "EXP-space is not allowed", `EXP-${"a".repeat(81)}`]) {
    expect(() => createExperienceB(id, NOW)).toThrow()
    expect(createExperienceMockPermitB(id, proof, NOW)).toBeNull()
  }
})

test("EXP-020 the experience has its own Person presentation gate and does not replace payment or visit gates", () => {
  const action = createBExperienceActionReturn({ venueId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B, intentId: INTENT, now: new Date(NOW + 20) })
  expect(action.cta).toBe("REDEEM_DEMO_ENTITLEMENT")
  expect(action.gatePlan).toEqual(["account", "person"])
  expect(requiresBActionPresentation(action)).toBe(true)
  expect(bActionPresentationPurpose(action)).toBe("person")
  expect(gatePlanForBAction("START_CHECKOUT")).toEqual(["account", "payment_kyc"])
  expect(gatePlanForBAction("SUBMIT_LOCAL_SIGNAL")).toEqual(["account", "person"])
  expect(privateContextForBAction(action)).toMatchObject({ cta: "REDEEM_DEMO_ENTITLEMENT", intentId: INTENT, campaignId: EXPERIENCE_CAMPAIGN_ID_B })
})

test("EXP-021 the action envelope binds the exact place, campaign and intent without carrying approval", () => {
  const action = createBExperienceActionReturn({ venueId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B, intentId: INTENT, now: new Date(NOW + 21) })
  expect(isBActionReturnStructurallyValid(action)).toBe(true)
  for (const patch of [{ venueId: "different-place" }, { campaignId: "different-campaign" }, { approved: true }, { gatePlan: ["account"] }]) {
    expect(isBActionReturnStructurallyValid({ ...action, ...patch })).toBe(false)
    expect(hashBActionReturnTo({ ...action, ...patch } as never)).toBeNull()
  }
  const changedIntent = { ...action, intentId: "EXP-different-intent" }
  expect(hashBActionReturnTo(changedIntent)).not.toBe(hashBActionReturnTo(action))
  expect(privateContextForBAction(changedIntent)).toBeNull()
  expect(() => createBExperienceActionReturn({ venueId: "different-place", campaignId: EXPERIENCE_CAMPAIGN_ID_B, intentId: INTENT })).toThrow()
})

test("EXP-022 an unbound, wrong-place or financial-benefit presentation cannot authorize this experience", () => {
  const now = NOW + 22
  const action = createBExperienceActionReturn({ venueId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B, intentId: INTENT, now: new Date(now) })
  expect(registerBActionPresentationRequest(action, createPresentationRequestB(now, "unbound"))).toBe(false)
  for (const binding of [
    createKPassPresentationBinding(credential().credentialId, "person", { audience: "other-place" }),
    createKPassPresentationBinding(credential().credentialId, "visitor_benefit", { audience: EXPERIENCE_PLACE_ID_B }),
    createKPassPresentationBinding(credential().credentialId, "payment", { audience: EXPERIENCE_PLACE_ID_B }),
  ]) expect(registerBActionPresentationRequest(action, createPresentationRequestB(now, `invalid-${binding.purpose}`, binding))).toBe(false)
  const binding = createKPassPresentationBinding(credential().credentialId, "person", { audience: EXPERIENCE_PLACE_ID_B })
  expect(binding.requestedClaims).toEqual(["personVerified"])
  expect(registerBActionPresentationRequest(action, createPresentationRequestB(now, "exact-place-person", binding))).toBe(true)
})

test("EXP-023 a scoped presentation approval cannot be replayed to another experience intent", () => {
  const now = NOW + 23
  const action = createBExperienceActionReturn({ venueId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B, intentId: INTENT, now: new Date(now) })
  const binding = createKPassPresentationBinding(credential().credentialId, "person", { audience: EXPERIENCE_PLACE_ID_B })
  const request = createPresentationRequestB(now, "experience-bound-approval", binding)
  expect(registerBActionPresentationRequest(action, request)).toBe(true)
  const decision = resolvePresentationRequestB(request, "approve", now + 1, binding)
  expect(authorizeBActionPresentationDecision({ ...action, intentId: "EXP-other-campaign-intent" }, decision)).toBeNull()
  expect(authorizeBActionPresentationDecision(action, decision)).not.toBeNull()
  expect(authorizeBActionPresentationDecision(action, decision)).toBeNull()
})

test("EXP-024 same-intent status reconciliation can observe past consumption but not grant post-expiry fulfillment", () => {
  const ctx = context()
  const unknown = run(granted(ctx), { type: "execution", outcome: "unknown" }, ctx)
  const expired = { ...ctx, now: NOW + EXPERIENCE_SCOPE_MS_B, permit: null }
  expect(run(unknown, { type: "execution", outcome: "success" }, expired)).toBe(unknown)
  const observed = run(unknown, { type: "reconcile_execution", outcome: "success", executionRef: `${INTENT}:execution` }, expired)
  expect(observed).toMatchObject({ authorization: "consumed", executionCount: 1, usedCount: 0, fulfillment: "pending" })
  const blocked = run(observed, { type: "fulfill", outcome: "success" }, expired)
  expect(blocked).toMatchObject({ fulfillment: "blocked", blockReason: "expired", executionCount: 1, usedCount: 0 })
  expect(restoreExperienceB(copy(blocked))).toEqual(blocked)
})

test("EXP-025 status reconciliation rejects another receipt, an unapproved request and duplicate observations", () => {
  const ctx = context()
  const unknown = run(granted(ctx), { type: "execution", outcome: "unknown" }, ctx)
  const command = { type: "reconcile_execution", outcome: "success", executionRef: `${INTENT}:execution` } as const
  expect(run(unknown, { ...command, executionRef: "EXP-other-intent:execution" }, ctx)).toBe(unknown)
  const proposal = proposed(ctx)
  expect(run(proposal, command, ctx)).toBe(proposal)
  const cancelled = run(unknown, { type: "request_cancel" }, ctx)
  expect(run(cancelled, command, ctx)).toBe(cancelled)
  const observed = run(unknown, command, { ...ctx, permit: null })
  expect(run(observed, command, ctx)).toBe(observed)
  expect(run(observed, { type: "execution", outcome: "success" }, ctx)).toBe(observed)
  expect(run(observed, { type: "fulfill", outcome: "success" }, context(ctx.credential)))
    .toMatchObject({ executionCount: 1, usedCount: 1 })
})

test("EXP-026 all accepted bounded command transitions round-trip without manufacturing a new record", () => {
  // Deterministic adversarial sequences, not a production concurrency proof.
  // Multiple restarts cover successful, pending, cancel-race and expiry axes.
  const commands = (r: ExperienceRecordB): ExperienceCommandB[] => [
    { type: "propose" }, { type: "approve", proposalDigest: r.scope?.proposalDigest ?? "no-proposal" },
    { type: "execution", outcome: "success" }, { type: "execution", outcome: "unknown" },
    { type: "execution", outcome: "failure" }, { type: "fulfill", outcome: "success" },
    { type: "fulfill", outcome: "blocked" }, { type: "audit", outcome: "success" },
    { type: "audit", outcome: "pending" }, { type: "audit", outcome: "failure" },
    { type: "request_cancel" }, { type: "resolve_cancel", outcome: "revoked" },
    { type: "resolve_cancel", outcome: "consumed" }, { type: "expire" },
    { type: "reconcile_execution", outcome: "success", executionRef: `${INTENT}:execution` },
    { type: "reconcile_execution", outcome: "failure", executionRef: `${INTENT}:execution` },
  ]
  let seed = 8191
  let accepted = 0
  for (let path = 0; path < 25; path += 1) {
    let record = createExperienceB(INTENT, NOW)
    for (let step = 0; step < 60; step += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      const at = NOW + step * (path % 3 === 0 ? 10_000 : 10)
      const ctx = context(credential(), INTENT, at)
      const next = run(record, commands(record)[seed % commands(record).length], ctx)
      if (next !== record) accepted += 1
      expect(restoreExperienceB(copy(next)), `path ${path}, step ${step}`).toEqual(next)
      expect(next.executionCount).toBeLessThanOrEqual(1)
      expect(next.usedCount).toBeLessThanOrEqual(next.executionCount)
      record = next
    }
  }
  expect(accepted).toBeGreaterThan(50)
  const proposal = proposed()
  const later = context(credential(), INTENT, NOW + EXPERIENCE_SCOPE_MS_B)
  const expired = run(proposal, { type: "expire" }, later)
  expect(expired.authorization).toBe("expired")
  expect(expired.scope?.approvedAt).toBeNull()
  expect(restoreExperienceB(copy(expired))).toEqual(expired)
  const renewed = run(expired, { type: "propose" }, later)
  expect(renewed.authorization).toBe("none")
  expect(restoreExperienceB(copy(renewed))).toEqual(renewed)
})

test("EXP-027 identity reuse requires the current same-action live Mobile ID fixture; JSON is not a handoff", () => {
  const { storage, action, now, options } = livePersonHandoff(27_000)
  const handoff = createBExperiencePersonHandoff(storage, now, options)!
  expect(handoff).toMatchObject({ tokenId: action.tokenId, intentId: INTENT, route: "mobile_id_cx" })
  expect(isBExperiencePersonHandoffCurrent(storage, handoff, now, options)).toBe(true)
  expect(isBExperiencePersonHandoffCurrent(storage, copy(handoff), now, options)).toBe(false)
  expect(isBExperiencePersonHandoffCurrent(storage, { ...handoff, intentId: "EXP-other-intent" }, now, options)).toBe(false)
  const freshStorage = new HandoffStorage()
  freshStorage.setItem(B_ACTION_GATE_SESSION_KEY, storage.getItem(B_ACTION_GATE_SESSION_KEY)!)
  expect(createBExperiencePersonHandoff(freshStorage, now, options)).toBeNull()
  expect(isBExperiencePersonHandoffCurrent(freshStorage, handoff, now, options)).toBe(false)
  expect(createBExperiencePersonHandoff(storage, now, { allowReviewFixture: false })).toBeNull()
  expect(createBExperiencePersonHandoff(storage, now, { ...options, credential: credential() })).toBeNull()
})

test("EXP-028 cancellation, replacement and receipt expiry invalidate an already issued reuse handle", () => {
  const { storage, action, now, options } = livePersonHandoff(28_000)
  const handoff = createBExperiencePersonHandoff(storage, now, options)!
  expect(handoff).not.toBeNull()
  expect(isBExperiencePersonHandoffCurrent(storage, handoff, new Date(Date.parse(action.createdAt) + B_ACTION_GATE_TTL_MS), options)).toBe(false)
  const saved = JSON.parse(storage.getItem(B_ACTION_GATE_SESSION_KEY)!)
  for (const patch of [
    { pending: null },
    { pending: { ...saved.pending, intentId: "EXP-replaced-intent" } },
    { personRoute: { tokenId: action.tokenId, route: "passport_ekyc" } },
    { personRoute: { tokenId: "RT-other-token", route: "mobile_id_cx" } },
    { person: { ...saved.person, reviewReceipt: { ...saved.person.reviewReceipt, issuedAt: new Date(now.getTime() - 1).toISOString() } } },
    { person: { ...saved.person, reviewReceipt: { ...saved.person.reviewReceipt, issuer: "REAL_PROVIDER" } } },
    { person: { status: "unverified", expiresAt: null } },
  ]) {
    storage.setItem(B_ACTION_GATE_SESSION_KEY, JSON.stringify({ ...saved, ...patch }))
    expect(isBExperiencePersonHandoffCurrent(storage, handoff, now, options), JSON.stringify(patch)).toBe(false)
    expect(createBExperiencePersonHandoff(storage, now, options)).toBeNull()
  }
})

test("EXP-029 an earlier unrelated Person result or another prepared route cannot skip identity selection", () => {
  const stale = livePersonHandoff(29_000, -1)
  expect(createBExperiencePersonHandoff(stale.storage, stale.now, stale.options)).toBeNull()
  const different = livePersonHandoff(29_100, 1, "FX-PER-OTHER-SUCCESS")
  expect(createBExperiencePersonHandoff(different.storage, different.now, different.options)).toBeNull()
})

test("EXP-030 reused Person proof issues only the explicitly consented identity scope, never other eligibility", () => {
  const limited = createPersonOnlySimulatedCredentialB(NOW)
  expect(isPersonOnlySimulatedCredentialB(limited)).toBe(true)
  expect(limited.credentialId).not.toBe(credential().credentialId)
  expect(limited).toMatchObject({ credentialId: `kpass-demo:mobile_id:${NOW}:person-only`,
    executionTruth: "FIXTURE_REVIEW", provenanceTruth: "SIMULATED", externalProviderConnected: false, externalEffect: "none",
    claims: { personVerified: true, ageOver19: null, stayPeriod: null, trustLevel: "limited",
      serviceAccess: ["person"], paymentLimitKrw: 0, paymentSpentKrw: 0, visitorBenefit: { entitled: false } } })
  expect(evaluateKPassService(limited, { service: "person", now: NOW }).status).toBe("allowed")
  for (const service of ["age", "visitor_benefit", "payment"] as const) {
    expect(evaluateKPassService(limited, { service, now: NOW, paymentKyc: true, amountKrw: 1 }))
      .toMatchObject({ status: "denied", reason: "service_not_entitled" })
  }
  expect(fulfilled(context(limited))).toMatchObject({ usedCount: 1, executionCount: 1 })
})

test("EXP-031 limited-credential recovery cannot promote claims; separately consented standard issuance remains unchanged", () => {
  const limited = createPersonOnlySimulatedCredentialB(NOW)
  const original = copy(limited)
  const recovered = recoverSimulatedCredentialB(limited, NOW + 100)!
  expect(recovered).not.toBeNull()
  expect(recovered.credentialId).toContain(":person-only:recovery:")
  expect(recovered.claims).toEqual(limited.claims)
  expect(isPersonOnlySimulatedCredentialB(recovered)).toBe(true)
  expect(limited).toEqual(original)
  const standard = credential()
  expect(isPersonOnlySimulatedCredentialB(standard)).toBe(false)
  expect(standard.claims).toMatchObject({ serviceAccess: ["person", "age", "visitor_benefit", "payment"],
    ageOver19: true, paymentLimitKrw: 100_000, visitorBenefit: { entitled: true } })
  expect(evaluateKPassService(standard, { service: "payment", now: NOW, paymentKyc: true, amountKrw: 1 }).status).toBe("allowed")
})

/** Reconstruct the old opening contract, including its original digest. This
 * is a negative compatibility fixture, never a v2 save/migration helper. */
function legacyOpeningRecord(record: ExperienceRecordB) {
  const campaignId = "ktour-neighborhood-guide-v1"
  const scope = record.scope ? { ...copy(record.scope), campaignId,
    action: "open-neighborhood-guide", recipient: "demo-traveler-wallet" } : null
  if (scope) {
    scope.proposalDigest = hashReturnToSnapshot({ intentId: record.intentId, placeId: EXPERIENCE_PLACE_ID_B, campaignId,
      action: scope.action, recipient: scope.recipient, agent: scope.agent, maxUses: 1, moneyKrw: 0,
      expiresAt: scope.expiresAt, policy: scope.policy, model: "prepared-proposal.v1" })!
    scope.consentDigest = scope.approvedAt === null ? null : hashReturnToSnapshot({ intentId: record.intentId,
      proposalDigest: scope.proposalDigest, approvedAt: scope.approvedAt, approved: true })!
  }
  return { ...copy(record), version: 1, campaignId, key: `${EXPERIENCE_ACTOR_B}:${campaignId}`, scope }
}

test("EXP-032 v2 pass saving has a new campaign/key and never interprets old opening history as a save", () => {
  expect(EXPERIENCE_CAMPAIGN_ID_B).toBe("ktour-neighborhood-guide-save-v2")
  const fresh = createExperienceB(INTENT, NOW)
  expect(fresh.version).toBe(2)
  const ctx = context()
  for (const current of [fresh, proposed(ctx), granted(ctx),
    run(granted(ctx), { type: "execution", outcome: "unknown" }, ctx), consumed(ctx), fulfilled(ctx)]) {
    const legacy = legacyOpeningRecord(current)
    const before = copy(legacy)
    expect(legacy.key).not.toBe(EXPERIENCE_KEY_B)
    expect(restoreExperienceB(legacy)).toBeNull()
    for (const command of [{ type: "propose" }, { type: "execution", outcome: "success" },
      { type: "fulfill", outcome: "success" }, { type: "audit", outcome: "success" }] as ExperienceCommandB[]) {
      expect(run(legacy as never, command, ctx)).toBe(legacy)
    }
    expect(legacy).toEqual(before)
    expect(restoreExperienceB(copy(current))).toEqual(current)
  }
})

test("EXP-033 changing an old record version/key cannot promote opening consent into pass-save consent", () => {
  const current = granted()
  const legacy = legacyOpeningRecord(current)
  expect(current.scope).toMatchObject({ action: "save-neighborhood-guide-to-pass", recipient: "demo-traveler-pass" })
  expect(current.scope!.proposalDigest).not.toBe(legacy.scope!.proposalDigest)
  expect(current.scope!.consentDigest).not.toBe(legacy.scope!.consentDigest)
  const renamed = { ...legacy, version: 2, campaignId: EXPERIENCE_CAMPAIGN_ID_B, key: EXPERIENCE_KEY_B }
  expect(restoreExperienceB(renamed)).toBeNull()
  expect(restoreExperienceB({ ...current, scope: { ...current.scope!, proposalDigest: legacy.scope!.proposalDigest,
    consentDigest: legacy.scope!.consentDigest } })).toBeNull()
  expect(restoreExperienceB({ ...current, scope: { ...current.scope!, action: "open-neighborhood-guide" } })).toBeNull()
  expect(restoreExperienceB({ ...current, scope: { ...current.scope!, recipient: "demo-traveler-wallet" } })).toBeNull()
  const proposal = proposed()
  expect(run(proposal, { type: "approve", proposalDigest: legacy.scope!.proposalDigest }, context())).toBe(proposal)
})

test("EXP-034 the legacy campaign gate cannot bind a new save request", () => {
  const action = createBExperienceActionReturn({ venueId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B,
    intentId: INTENT, now: new Date(NOW + 34) })
  const legacyAction = { ...action, campaignId: "ktour-neighborhood-guide-v1" }
  expect(isBActionReturnStructurallyValid(legacyAction)).toBe(false)
  expect(hashBActionReturnTo(legacyAction as never)).toBeNull()
  expect(privateContextForBAction(legacyAction as never)).toBeNull()
  expect(() => createBExperienceActionReturn({ venueId: EXPERIENCE_PLACE_ID_B,
    campaignId: "ktour-neighborhood-guide-v1", intentId: INTENT })).toThrow()
})

test("EXP-035 public read is not a saving reducer command and cannot mark a guide used", () => {
  const ctx = context()
  for (const record of [createExperienceB(INTENT, NOW), granted(ctx), fulfilled(ctx)]) {
    const before = copy(record)
    for (const type of ["view", "read", "open", "public_guide"]) {
      expect(run(record, { type } as never, ctx)).toBe(record)
    }
    expect(record).toEqual(before)
  }
})

test("EXP-036 the open event preserves exact place/pass origin without carrying approval or creating an intent", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window")
  const dispatched: CustomEvent[] = []
  Object.defineProperty(globalThis, "window", { configurable: true,
    value: { dispatchEvent: (event: CustomEvent) => { dispatched.push(event); return true } } })
  try {
    expect(requestExperienceB(EXPERIENCE_PLACE_ID_B)).toBe(true)
    expect(requestExperienceB(EXPERIENCE_PLACE_ID_B, "pass")).toBe(true)
    expect(requestExperienceB("other-place", "pass")).toBe(false)
    expect(requestExperienceB(EXPERIENCE_PLACE_ID_B, "other" as never)).toBe(false)
    expect(dispatched.map(event => ({ type: event.type, detail: event.detail }))).toEqual([
      { type: EXPERIENCE_OPEN_EVENT_B, detail: { placeId: EXPERIENCE_PLACE_ID_B, source: "place" } },
      { type: EXPERIENCE_OPEN_EVENT_B, detail: { placeId: EXPERIENCE_PLACE_ID_B, source: "pass" } },
    ])
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor)
    else Reflect.deleteProperty(globalThis, "window")
  }
})
