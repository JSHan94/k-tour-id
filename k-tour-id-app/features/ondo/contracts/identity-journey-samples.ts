import type { OndoBIdentityMethod, OndoBIdentityRecoveryCode } from "../identity-b/ktour-id-setup-model-b"

/** Prepared frontend outcomes, never provider evidence or authority to issue. */
export const IDENTITY_JOURNEY_SAMPLES = [
  "success", "cancelled", "method_unavailable", "app_missing", "session_expired",
  "nfc_unsupported", "document_read_failed", "unsupported_document", "document_auth_failed",
  "face_mismatch", "liveness_failed", "manual_review", "provider_timeout", "callback_invalid",
  "issuer_failed", "holder_failed",
] as const
export type IdentityJourneySample = typeof IDENTITY_JOURNEY_SAMPLES[number]
export type IdentitySampleCheckpoint = "handoff" | "document" | "face" | "provider" | "holder"
export type IdentitySampleInterruption = Readonly<{
  code: OndoBIdentityRecoveryCode
  phase: "failed" | "unavailable" | "expired" | "cancelled" | "manual_review"
  sampleOnly: true
}>

const PASSPORT_ONLY = new Set<IdentityJourneySample>([
  "nfc_unsupported", "document_read_failed", "unsupported_document", "document_auth_failed",
  "face_mismatch", "liveness_failed", "manual_review",
])

export function identitySamplesForMethod(method: OndoBIdentityMethod): IdentityJourneySample[] {
  return IDENTITY_JOURNEY_SAMPLES.filter(value => method === "passport_ekyc"
    ? value !== "app_missing"
    : !PASSPORT_ONLY.has(value))
}

export function identitySampleInterruption(
  sample: IdentityJourneySample,
  method: OndoBIdentityMethod,
  checkpoint: IdentitySampleCheckpoint,
  consumed: boolean,
): IdentitySampleInterruption | null {
  if (consumed || !identitySamplesForMethod(method).includes(sample)) return null
  const first = method === "passport_ekyc" ? "document" : "handoff"
  const definitions: Partial<Record<IdentityJourneySample, [IdentitySampleCheckpoint, OndoBIdentityRecoveryCode, IdentitySampleInterruption["phase"]]>> = {
    cancelled: [first, "CONSENT_DECLINED", "cancelled"],
    method_unavailable: [first, "IDENTITY_METHOD_UNAVAILABLE", "unavailable"],
    app_missing: ["handoff", "IDENTITY_METHOD_UNAVAILABLE", "failed"],
    session_expired: [first, "IDENTITY_SESSION_EXPIRED", "expired"],
    nfc_unsupported: ["document", "PASSPORT_NFC_UNSUPPORTED", "failed"],
    document_read_failed: ["document", "PASSPORT_READ_FAILED", "failed"],
    unsupported_document: ["document", "UNSUPPORTED_DOCUMENT", "failed"],
    document_auth_failed: ["document", "DOCUMENT_AUTH_FAILED", "failed"],
    face_mismatch: ["face", "FACE_MISMATCH", "failed"],
    liveness_failed: ["face", "LIVENESS_FAILED", "failed"],
    manual_review: ["provider", "MANUAL_REVIEW_REQUIRED", "manual_review"],
    provider_timeout: ["provider", "PROVIDER_TIMEOUT", "failed"],
    callback_invalid: ["provider", "CALLBACK_INVALID", "failed"],
    issuer_failed: ["provider", "CREDENTIAL_ISSUANCE_FAILED", "failed"],
    holder_failed: ["holder", "HOLDER_DELIVERY_FAILED", "failed"],
  }
  const definition = definitions[sample]
  return definition?.[0] === checkpoint ? { code: definition[1], phase: definition[2], sampleOnly: true } : null
}

export type IdentityManualReview = Readonly<{
  requestRef: string
  sessionNonce: string
  createdAt: number
  expiresAt: number
  checkedAt: number | null
  status: "pending" | "approved" | "declined" | "needs_info" | "expired"
  sampleOnly: true
  externalProviderConnected: false
}>
export type IdentityManualOutcome = "approved" | "declined" | "needs_info"

export function createIdentityManualReview(sessionNonce: string, now: number, expiresAt: number): IdentityManualReview {
  return Object.freeze({ requestRef: `sample-review:${now}`, sessionNonce, createdAt: now, expiresAt, checkedAt: null, status: "pending", sampleOnly: true, externalProviderConnected: false })
}

/** A review result only unlocks the next sample step, never creates a credential. */
export function resolveIdentityManualReview(
  request: IdentityManualReview,
  outcome: IdentityManualOutcome,
  sessionNonce: string,
  now = Date.now(),
): IdentityManualReview {
  if (request.status !== "pending" || sessionNonce !== request.sessionNonce) return request
  return Object.freeze({ ...request, checkedAt: now, status: !Number.isFinite(now) || now < request.createdAt || now >= request.expiresAt ? "expired" : outcome })
}

export function mayDeliverIdentityManualReview(request: IdentityManualReview | null, sessionNonce: string, now = Date.now()) {
  return request?.status === "approved" && request.sessionNonce === sessionNonce
    && request.checkedAt !== null && now >= request.checkedAt && now < request.expiresAt
}
