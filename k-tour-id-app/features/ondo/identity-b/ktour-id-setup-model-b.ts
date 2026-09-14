export type OndoBIdentitySetupOrigin = "onboarding" | "traveler_id" | "action_gate"
export type OndoBIdentityMethod = "mobile_id" | "mobile_residence_card" | "passport_ekyc"
export type OndoBIdentityAssurance = "official_mobile_id" | "private_passport_ekyc"
export type OndoBCredentialStatus = "none" | "simulated_ready" | "expired" | "suspended" | "revoked"

export const KTOUR_ID_RECOVERY_CODES = [
  "IDENTITY_METHOD_UNAVAILABLE",
  "CONSENT_DECLINED",
  "DOCUMENT_PERMISSION_DENIED",
  "PASSPORT_NFC_UNSUPPORTED",
  "PASSPORT_READ_FAILED",
  "UNSUPPORTED_DOCUMENT",
  "DOCUMENT_AUTH_FAILED",
  "FACE_MISMATCH",
  "LIVENESS_FAILED",
  "RETRY_LIMIT_REACHED",
  "MANUAL_REVIEW_REQUIRED",
  "PROVIDER_TIMEOUT",
  "CALLBACK_INVALID",
  "IDENTITY_SESSION_EXPIRED",
  "ISSUER_UNAVAILABLE",
  "CREDENTIAL_ISSUANCE_FAILED",
  "HOLDER_DELIVERY_FAILED",
  "CREDENTIAL_EXPIRED",
  "CREDENTIAL_SUSPENDED",
  "CREDENTIAL_REVOKED",
  "PRESENTATION_REQUEST_EXPIRED",
  "PRESENTATION_DENIED",
  "PRESENTATION_REPLAY",
  "PRESENTATION_CONTEXT_MISMATCH",
] as const

export type OndoBIdentityRecoveryCode = typeof KTOUR_ID_RECOVERY_CODES[number]

export const KTOUR_ID_PUBLIC_ACTIONS = [
  "OPEN_KTOUR_ID_SETUP",
  "SELECT_KTOUR_ID_METHOD",
  "ACCEPT_KTOUR_ID_CONSENT",
  "CANCEL_KTOUR_ID_SETUP",
  "RETRY_KTOUR_ID_STEP",
  "RETURN_FROM_KTOUR_ID_SETUP",
  "OPEN_KTOUR_ID_PRESENTATION",
  "APPROVE_KTOUR_ID_PRESENTATION",
  "DENY_KTOUR_ID_PRESENTATION",
  "END_KTOUR_ID_DEMO_SESSION",
] as const

export type OndoBIdentitySetupSession = {
  origin: OndoBIdentitySetupOrigin
  method: OndoBIdentityMethod
  issuedAt: number
  expiresAt: number
  nonce: string
}

export type OndoBSimulatedCredential = KPassDemoCredential & {
  method: OndoBIdentityMethod
  assurance: OndoBIdentityAssurance
  credentialType: "KTourVisitorCredential"
  issuerLabel: "K-Tour ID Demo Issuer"
  issuedAt: number
  expiresAt: number
}

export type OndoBPresentationRequest = {
  nonce: string
  issuedAt: number
  expiresAt: number
  consumedAt: number | null
  /** Legacy unbound samples remain readable; new service flows bind the VP. */
  binding?: KPassPresentationBinding
}

export type OndoBPresentationResolution = {
  request: OndoBPresentationRequest
  approved: boolean
  code: "PRESENTATION_DENIED" | "PRESENTATION_REQUEST_EXPIRED" | "PRESENTATION_REPLAY" | "PRESENTATION_CONTEXT_MISMATCH" | null
}

export const KTOUR_ID_SETUP_TTL_MS = 10 * 60 * 1000
export const KTOUR_ID_CREDENTIAL_TTL_MS = 2 * 60 * 60 * 1000
export const KTOUR_ID_PRESENTATION_TTL_MS = 2 * 60 * 1000

export function createIdentitySetupSessionB(
  origin: OndoBIdentitySetupOrigin,
  method: OndoBIdentityMethod,
  now = Date.now(),
): OndoBIdentitySetupSession {
  return {
    origin,
    method,
    issuedAt: now,
    expiresAt: now + KTOUR_ID_SETUP_TTL_MS,
    nonce: `${origin}:${method}:${now}`,
  }
}

export function isIdentitySetupSessionActiveB(session: OndoBIdentitySetupSession, now = Date.now()) {
  return now >= session.issuedAt && now < session.expiresAt
}

export function createSimulatedCredentialB(
  method: OndoBIdentityMethod,
  now = Date.now(),
  scenario: KPassScenario = "adult_visitor",
): OndoBSimulatedCredential {
  if (!["mobile_id", "mobile_residence_card", "passport_ekyc"].includes(method)) throw new Error("Invalid K-Tour identity method")
  const identitySource = method === "mobile_id" ? "omni_one_cx_mobile_id"
    : method === "mobile_residence_card" ? "residence_card_adapter" : "passport_nfc_ekyc"
  return {
    credentialId: `kpass-demo:${method}:${now}:${scenario}`,
    status: scenario === "suspended" ? "suspended" : scenario === "revoked" ? "revoked" : "simulated_ready",
    executionTruth: "FIXTURE_REVIEW",
    provenanceTruth: "SIMULATED",
    externalProviderConnected: false,
    externalEffect: "none",
    method,
    assurance: method === "passport_ekyc" ? "private_passport_ekyc" : "official_mobile_id",
    credentialType: "KTourVisitorCredential",
    issuerLabel: "K-Tour ID Demo Issuer",
    issuedAt: now,
    expiresAt: now + KTOUR_ID_CREDENTIAL_TTL_MS,
    claims: createKPassDemoClaims(identitySource, now, scenario),
  }
}

export function isSimulatedCredentialActiveB(credential: OndoBSimulatedCredential, now = Date.now()) {
  return isKPassDemoCredentialCurrent(credential, now)
}

/** An explicit, successfully checked sample proof revision for the same
 * holder. Renewing proof does not create a new economic issuance, adult age,
 * trip entitlement or unused allowance. The provider owns the review gate. */
export function recoverSimulatedCredentialB(credential: OndoBSimulatedCredential | null, now = Date.now()): OndoBSimulatedCredential | null {
  if (!credential || !Number.isSafeInteger(now) || now < credential.issuedAt
    || !["simulated_ready", "expired", "suspended", "revoked"].includes(credential.status)
    || !isKPassDemoCredentialCurrent({ ...credential, status: "simulated_ready" }, credential.issuedAt)) return null
  const base = kpassDemoIssuanceRef(credential.credentialId)
  if (!base) return null
  const previousRevision = Number(credential.credentialId.match(/:(?:age|recovery):(\d+)$/)?.[1] ?? 0)
  const revision = Math.max(now, previousRevision + 1)
  if (!Number.isSafeInteger(revision)) return null
  return { ...credential, credentialId: `${base}:recovery:${revision}`, status: "simulated_ready", issuedAt: now, expiresAt: now + KTOUR_ID_CREDENTIAL_TTL_MS }
}

/** Lifecycle and time validity are different: a revoked/held credential must
 * not be described as merely expired because it cannot authorize a service. */
export function simulatedCredentialStatusB(credential: OndoBSimulatedCredential | null, now = Date.now()): OndoBCredentialStatus {
  if (!credential) return "none"
  if (credential.status !== "simulated_ready") return credential.status
  return now >= credential.expiresAt ? "expired" : "simulated_ready"
}

export type KPassAgeProofValueB = Readonly<{ predicate: "AGE_GTE_19"; outcome: "eligible" }>
const completedAgeProofs = new WeakSet<object>()

/** Supplements an absent age predicate only. A live review execution is not a
 * provider credential, cannot reverse a negative issuer answer, and cannot
 * grant Person, payment KYC, an entitlement, or a fresh allowance. */
export function completeKPassDemoAgeProofB(
  credential: OndoBSimulatedCredential | null,
  execution: ReviewFixtureExecution<KPassAgeProofValueB>,
  options: Readonly<{ allowReviewFixture?: boolean }> = {},
  now = Date.now(),
): OndoBSimulatedCredential | null {
  if (options.allowReviewFixture !== true || !isLiveReviewFixtureExecution(execution)
    || completedAgeProofs.has(execution) || execution.result !== "FIXTURE_SUCCESS"
    || execution.executionTruth !== "FIXTURE_REVIEW" || execution.provenanceTruth !== "SIMULATED"
    || execution.externalProviderConnected !== false || execution.externalEffect !== "none"
    || !execution.value || execution.value.predicate !== "AGE_GTE_19" || execution.value.outcome !== "eligible"
    || !credential || !isSimulatedCredentialActiveB(credential, now)
    || credential.claims.ageOver19 !== null
    || evaluateKPassService(credential, { service: "age", now }).reason !== "age_proof_required") return null
  const recordedAt = Date.parse(execution.recordedAt)
  if (!Number.isFinite(recordedAt) || recordedAt < credential.issuedAt || recordedAt > now
    || now - recordedAt >= KTOUR_ID_PRESENTATION_TTL_MS) return null
  completedAgeProofs.add(execution)
  return {
    ...credential,
    // Existing presentations stay bound to the previous revision and cannot
    // be silently reused after the disclosed claims change.
    credentialId: `${credential.credentialId}:age:${recordedAt}`,
    claims: { ...credential.claims, ageOver19: true },
  }
}

/** Visible surfaces consume this truth predicate without exposing the internal
 * provenance vocabulary as product copy or DOM state. */
export function isReviewCredentialDraftB(credential: OndoBSimulatedCredential | null): credential is OndoBSimulatedCredential {
  return Boolean(credential
    && credential.executionTruth === "FIXTURE_REVIEW"
    && credential.provenanceTruth === "SIMULATED"
    && credential.externalProviderConnected === false
    && credential.externalEffect === "none")
}

export function createPresentationRequestB(
  now = Date.now(),
  nonce = `presentation:${now}`,
  binding?: KPassPresentationBinding,
): OndoBPresentationRequest {
  if (binding !== undefined && !isKPassPresentationBinding(binding)) throw new Error("Invalid K-Pass presentation context")
  return {
    nonce,
    issuedAt: now,
    expiresAt: now + KTOUR_ID_PRESENTATION_TTL_MS,
    consumedAt: null,
    ...(binding ? { binding: Object.freeze({ ...binding, requestedClaims: Object.freeze([...binding.requestedClaims]) }) } : {}),
  }
}

export function isPresentationRequestActiveB(request: OndoBPresentationRequest, now = Date.now()) {
  return Number.isFinite(now) && Number.isFinite(request.issuedAt) && Number.isFinite(request.expiresAt)
    && typeof request.nonce === "string" && request.nonce.length > 0
    && request.expiresAt - request.issuedAt === KTOUR_ID_PRESENTATION_TTL_MS
    && request.consumedAt === null && now >= request.issuedAt && now < request.expiresAt
    && (request.binding === undefined || isKPassPresentationBinding(request.binding))
}

export function resolvePresentationRequestB(
  request: OndoBPresentationRequest,
  decision: "approve" | "deny",
  now = Date.now(),
  expectedBinding?: KPassPresentationBinding,
): OndoBPresentationResolution {
  if (request.consumedAt !== null) {
    return { request, approved: false, code: "PRESENTATION_REPLAY" }
  }
  if (!Number.isFinite(now) || !Number.isFinite(request.issuedAt) || !Number.isFinite(request.expiresAt)
    || now < request.issuedAt || now >= request.expiresAt
    || request.expiresAt - request.issuedAt !== KTOUR_ID_PRESENTATION_TTL_MS) {
    return { request, approved: false, code: "PRESENTATION_REQUEST_EXPIRED" }
  }

  const consumed = { ...request, consumedAt: now }
  if (decision !== "approve" && decision !== "deny") {
    return { request: consumed, approved: false, code: "PRESENTATION_CONTEXT_MISMATCH" }
  }
  if (decision === "deny") {
    return { request: consumed, approved: false, code: "PRESENTATION_DENIED" }
  }
  // New bound requests fail closed unless the action supplies its own expected
  // context. Do not derive expectedBinding from untrusted callback data.
  if ((request.binding !== undefined || expectedBinding !== undefined)
    && !sameKPassPresentationBinding(request.binding, expectedBinding)) {
    return { request: consumed, approved: false, code: "PRESENTATION_CONTEXT_MISMATCH" }
  }
  if (typeof request.nonce !== "string" || request.nonce.length === 0) {
    return { request: consumed, approved: false, code: "PRESENTATION_CONTEXT_MISMATCH" }
  }
  return { request: consumed, approved: true, code: null }
}
import {
  createKPassDemoClaims,
  evaluateKPassService,
  isKPassDemoCredentialCurrent,
  kpassDemoIssuanceRef,
  isKPassPresentationBinding,
  sameKPassPresentationBinding,
  type KPassDemoCredential,
  type KPassPresentationBinding,
  type KPassScenario,
} from "../contracts/kpass-capabilities"
import { isLiveReviewFixtureExecution, type ReviewFixtureExecution } from "../contracts/execution-mode"
