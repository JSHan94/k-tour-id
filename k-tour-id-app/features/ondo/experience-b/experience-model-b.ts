import { evaluateKPassService, type KPassDemoCredential } from "../contracts/kpass-capabilities"
import { hashReturnToSnapshot } from "../contracts/return-to-integrity"

/** Local pass-collection demonstration only, NOT a merchant entitlement or
 * signed credential claim. Public guide reading has no record or permission. */
export const EXPERIENCE_PLACE_ID_B = "mois-0021cd596bc5b2a922ad"
export const EXPERIENCE_CAMPAIGN_ID_B = "ktour-neighborhood-guide-save-v2"
export const EXPERIENCE_ACTOR_B = "local-demo-traveler"
export const EXPERIENCE_KEY_B = `${EXPERIENCE_ACTOR_B}:${EXPERIENCE_CAMPAIGN_ID_B}`
export const EXPERIENCE_OPEN_EVENT_B = "ktour:experience:open"
export const EXPERIENCE_CHANGED_EVENT_B = "ktour:experience:changed"
export const EXPERIENCE_CHANNEL_B = "ktour-experience-mock-v1"
export const EXPERIENCE_SCOPE_MS_B = 5 * 60 * 1000
export const EXPERIENCE_POLICY_B = "person-only-nonfinancial.v1"

export type ExperienceAuthorizationB = "none" | "granted" | "unknown" | "consumed" | "revoked" | "expired" | "failed"
export type ExperienceFulfillmentB = "not_started" | "pending" | "fulfilled" | "blocked"
export type ExperienceAuditB = "not_started" | "pending" | "confirmed" | "failed"
export type ExperienceScopeB = Readonly<{
  action: "save-neighborhood-guide-to-pass"; recipient: "demo-traveler-pass"; agent: "local-demo-helper"
  placeId: typeof EXPERIENCE_PLACE_ID_B; campaignId: typeof EXPERIENCE_CAMPAIGN_ID_B
  intentId: string; maxUses: 1; moneyKrw: 0; expiresAt: number; policy: typeof EXPERIENCE_POLICY_B
  proposalDigest: string; consentDigest: string | null; approvedAt: number | null
}>
export type ExperienceRecordB = Readonly<{
  version: 2; mockOnly: true; key: typeof EXPERIENCE_KEY_B; actor: typeof EXPERIENCE_ACTOR_B
  placeId: typeof EXPERIENCE_PLACE_ID_B; campaignId: typeof EXPERIENCE_CAMPAIGN_ID_B
  intentId: string; revision: number; createdAt: number; updatedAt: number
  scope: ExperienceScopeB | null; authorization: ExperienceAuthorizationB; fulfillment: ExperienceFulfillmentB
  audit: ExperienceAuditB; cancelRequested: boolean; executionCount: 0 | 1; usedCount: 0 | 1
  executionRef: string | null; fulfillmentRef: string | null; auditRef: string | null
  blockReason: "eligibility" | "cancelled" | "expired" | null
}>
export type ExperiencePermitB = Readonly<{ intentId: string; expiresAt: number }>
const livePermits = new WeakMap<object, { credentialId: string; intentId: string; expiresAt: number }>()

/** Called by the UI only after consuming/finalizing its contextual action gate.
 * Never serialize this object: restored history cannot recreate this permit. */
export function createExperienceMockPermitB(intentId: string, credential: KPassDemoCredential | null, now = Date.now()): ExperiencePermitB | null {
  if (!/^EXP-[a-z0-9-]{8,80}$/i.test(intentId) || evaluateKPassService(credential, { service: "person", now }).status !== "allowed" || !credential) return null
  const expiresAt = Math.min(now + EXPERIENCE_SCOPE_MS_B, credential.expiresAt)
  const permit = Object.freeze({ intentId, expiresAt })
  livePermits.set(permit, { credentialId: credential.credentialId, intentId, expiresAt })
  return permit
}
export type ExperienceContextB = { sampleMode: boolean; now: number; credential: KPassDemoCredential | null; permit: ExperiencePermitB | null }
export function hasExperiencePermitB(record: ExperienceRecordB, context: ExperienceContextB) {
  const live = context.permit ? livePermits.get(context.permit) : null
  return Boolean(context.sampleMode && live && live.intentId === record.intentId && live.expiresAt > context.now
    && live.credentialId === context.credential?.credentialId
    && evaluateKPassService(context.credential, { service: "person", now: context.now }).status === "allowed")
}
export function createExperienceB(intentId: string, now = Date.now()): ExperienceRecordB {
  if (!/^EXP-[a-z0-9-]{8,80}$/i.test(intentId) || !Number.isSafeInteger(now) || now < 0) throw new Error("Invalid experience intent")
  return { version: 2, mockOnly: true, key: EXPERIENCE_KEY_B, actor: EXPERIENCE_ACTOR_B, placeId: EXPERIENCE_PLACE_ID_B,
    campaignId: EXPERIENCE_CAMPAIGN_ID_B, intentId, revision: 0, createdAt: now, updatedAt: now, scope: null,
    authorization: "none", fulfillment: "not_started", audit: "not_started", cancelRequested: false,
    executionCount: 0, usedCount: 0, executionRef: null, fulfillmentRef: null, auditRef: null, blockReason: null }
}
function proposalDigest(intentId: string, expiresAt: number) {
  return hashReturnToSnapshot({ intentId, placeId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B,
    action: "save-neighborhood-guide-to-pass", recipient: "demo-traveler-pass", agent: "local-demo-helper", maxUses: 1, moneyKrw: 0,
    expiresAt, policy: EXPERIENCE_POLICY_B, model: "prepared-proposal.v1" })!
}
function scopeFor(record: ExperienceRecordB, expiresAt: number): ExperienceScopeB {
  const digest = proposalDigest(record.intentId, expiresAt)
  return { action: "save-neighborhood-guide-to-pass", recipient: "demo-traveler-pass", agent: "local-demo-helper",
    placeId: EXPERIENCE_PLACE_ID_B, campaignId: EXPERIENCE_CAMPAIGN_ID_B, intentId: record.intentId,
    maxUses: 1, moneyKrw: 0, expiresAt, policy: EXPERIENCE_POLICY_B, proposalDigest: digest,
    consentDigest: null, approvedAt: null }
}
export type ExperienceCommandB =
  | { type: "propose" } | { type: "approve"; proposalDigest: string }
  | { type: "execution"; outcome: "success" | "unknown" | "failure" }
  | { type: "reconcile_execution"; outcome: "success" | "failure"; executionRef: string }
  | { type: "fulfill"; outcome: "success" | "blocked" }
  | { type: "audit"; outcome: "success" | "pending" | "failure" }
  | { type: "request_cancel" } | { type: "resolve_cancel"; outcome: "revoked" | "consumed" }
  | { type: "expire" }

/** Separate axes deliberately model non-atomic service / execution / audit.
 * Returning the same object means rejected/no-op (including duplicate receipts). */
export function reduceExperienceB(record: ExperienceRecordB, command: ExperienceCommandB, context: ExperienceContextB): ExperienceRecordB {
  if (!restoreExperienceB(record) || !context.sampleMode || !Number.isSafeInteger(context.now) || context.now < record.updatedAt) return record
  const valid = hasExperiencePermitB(record, context)
  const update = (patch: Partial<ExperienceRecordB>): ExperienceRecordB => ({ ...record, ...patch, revision: record.revision + 1, updatedAt: context.now })
  if (command.type === "propose") {
    if (!valid || record.executionCount || record.usedCount || !["none", "expired", "failed", "revoked"].includes(record.authorization)) return record
    return update({ scope: scopeFor(record, Math.min(context.now + EXPERIENCE_SCOPE_MS_B, context.permit!.expiresAt)), authorization: "none", cancelRequested: false })
  }
  if (command.type === "approve") {
    if (!valid || record.authorization !== "none" || record.cancelRequested || !record.scope || record.scope.expiresAt <= context.now || command.proposalDigest !== record.scope.proposalDigest) return record
    return update({ authorization: "granted", scope: { ...record.scope, approvedAt: context.now,
      consentDigest: hashReturnToSnapshot({ intentId: record.intentId, proposalDigest: record.scope.proposalDigest, approvedAt: context.now, approved: true })! } })
  }
  if (command.type === "execution") {
    if (!["granted", "unknown", "failed"].includes(record.authorization) || record.executionCount || !record.scope) return record
    // An unknown result is reconciled, never a second grant. No successful
    // dispatch is simulated from a stale proof; current proof must be reviewed.
    if (command.outcome !== "success") return update({ authorization: command.outcome === "unknown" ? "unknown" : "failed" })
    if (!valid || record.cancelRequested || record.scope.expiresAt <= context.now) return record
    return update({ authorization: "consumed", executionCount: 1, executionRef: `${record.intentId}:execution`, fulfillment: "pending" })
  }
  if (command.type === "fulfill") {
    if (record.authorization !== "consumed" || record.fulfillment !== "pending" || !record.scope) return record
    const blockReason = record.cancelRequested ? "cancelled" : record.scope.expiresAt <= context.now ? "expired" : !valid || command.outcome === "blocked" ? "eligibility" : null
    if (blockReason) return update({ fulfillment: "blocked", blockReason })
    return update({ fulfillment: "fulfilled", usedCount: 1, fulfillmentRef: `${record.intentId}:service`, audit: "pending" })
  }
  if (command.type === "reconcile_execution") {
    if (record.authorization !== "unknown" || record.executionCount || !record.scope || record.scope.approvedAt === null || record.cancelRequested
      || command.executionRef !== `${record.intentId}:execution`) return record
    // Observation of the SAME approved request is not permission to dispatch.
    // An expired/revoked credential cannot prevent reading an old result; the
    // independent fulfillment check below will still deny stale eligibility.
    return command.outcome === "failure" ? update({ authorization: "failed" })
      : update({ authorization: "consumed", executionCount: 1, executionRef: command.executionRef, fulfillment: "pending" })
  }
  if (command.type === "audit") {
    if (record.fulfillment !== "fulfilled" || !["pending", "failed"].includes(record.audit)) return record
    return update({ audit: command.outcome === "success" ? "confirmed" : command.outcome === "failure" ? "failed" : "pending", auditRef: command.outcome === "success" ? `${record.intentId}:audit` : null })
  }
  if (command.type === "request_cancel") {
    if (record.fulfillment === "fulfilled" || record.fulfillment === "blocked" || record.cancelRequested || ["revoked", "expired"].includes(record.authorization)) return record
    if (record.authorization === "none") return update({ cancelRequested: true, authorization: "revoked" })
    return update({ cancelRequested: true, authorization: record.authorization === "consumed" ? "consumed" : "unknown" })
  }
  if (command.type === "resolve_cancel") {
    if (!record.cancelRequested || record.authorization !== "unknown" || record.executionCount) return record
    return command.outcome === "revoked" ? update({ authorization: "revoked" })
      : update({ authorization: "consumed", executionCount: 1, executionRef: `${record.intentId}:execution`, fulfillment: "blocked", blockReason: "cancelled" })
  }
  if (command.type === "expire" && ["none", "granted", "failed"].includes(record.authorization) && record.scope && record.scope.expiresAt <= context.now) return update({ authorization: "expired" })
  return record
}

/** Restore only v2 local pass-save history, not authenticated identity or a
 * signed receipt. A v1 guide-opening approval is never a v2 save approval. */
export function restoreExperienceB(value: unknown): ExperienceRecordB | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const r = value as ExperienceRecordB
  if (r.version !== 2 || r.mockOnly !== true || r.key !== EXPERIENCE_KEY_B || r.actor !== EXPERIENCE_ACTOR_B || r.placeId !== EXPERIENCE_PLACE_ID_B || r.campaignId !== EXPERIENCE_CAMPAIGN_ID_B
    || typeof r.intentId !== "string" || !/^EXP-[a-z0-9-]{8,80}$/i.test(r.intentId)
    || !Number.isSafeInteger(r.revision) || r.revision < 0 || !Number.isSafeInteger(r.createdAt) || !Number.isSafeInteger(r.updatedAt) || r.createdAt < 0 || r.updatedAt < r.createdAt
    || !["none", "granted", "unknown", "consumed", "revoked", "expired", "failed"].includes(r.authorization)
    || !["not_started", "pending", "fulfilled", "blocked"].includes(r.fulfillment) || !["not_started", "pending", "confirmed", "failed"].includes(r.audit)
    || typeof r.cancelRequested !== "boolean" || ![0, 1].includes(r.executionCount) || ![0, 1].includes(r.usedCount)
    || ![null, "eligibility", "cancelled", "expired"].includes(r.blockReason)) return null
  const keys = Object.keys(createExperienceB(r.intentId, r.createdAt)).sort().join("|")
  if (Object.keys(r).sort().join("|") !== keys) return null
  if (r.scope !== null && (!Number.isSafeInteger(r.scope?.expiresAt) || r.scope.expiresAt <= r.createdAt
    || Object.keys(r.scope).sort().join("|") !== Object.keys(scopeFor(r, r.scope.expiresAt)).sort().join("|")
    || Object.entries(scopeFor(r, r.scope.expiresAt)).filter(([key]) => key !== "consentDigest" && key !== "approvedAt").some(([key, expected]) => r.scope![key as keyof ExperienceScopeB] !== expected))) return null
  if (r.scope) {
    if (r.scope.approvedAt === null ? r.scope.consentDigest !== null : !Number.isSafeInteger(r.scope.approvedAt) || r.scope.approvedAt < r.createdAt || r.scope.approvedAt >= r.scope.expiresAt
      || r.scope.consentDigest !== hashReturnToSnapshot({ intentId: r.intentId, proposalDigest: r.scope.proposalDigest, approvedAt: r.scope.approvedAt, approved: true })) return null
    if (["granted", "unknown", "consumed", "failed"].includes(r.authorization) && r.scope.approvedAt === null) return null
  }
  if (r.authorization !== "none" && r.authorization !== "revoked" && !r.scope) return null
  if ((r.authorization === "consumed") !== (r.executionCount === 1) || (r.executionCount === 1 ? r.executionRef !== `${r.intentId}:execution` : r.executionRef !== null)) return null
  if (r.fulfillment !== "not_started" && r.authorization !== "consumed" || r.authorization === "consumed" && r.fulfillment === "not_started") return null
  if ((r.fulfillment === "fulfilled") !== (r.usedCount === 1) || (r.usedCount === 1 ? r.fulfillmentRef !== `${r.intentId}:service` : r.fulfillmentRef !== null)) return null
  if ((r.fulfillment === "blocked") !== (r.blockReason !== null)) return null
  if ((r.fulfillment === "fulfilled") !== (r.audit !== "not_started")) return null
  if (r.audit === "confirmed" ? r.auditRef !== `${r.intentId}:audit` : r.auditRef !== null) return null
  return r
}

export function requestExperienceB(placeId: string, source: "place" | "pass" = "place") {
  if (typeof window === "undefined" || placeId !== EXPERIENCE_PLACE_ID_B || (source !== "place" && source !== "pass")) return false
  window.dispatchEvent(new CustomEvent(EXPERIENCE_OPEN_EVENT_B, { detail: { placeId, source } }))
  return true
}
