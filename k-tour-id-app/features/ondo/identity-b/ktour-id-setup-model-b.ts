export type OndoBIdentitySetupOrigin = "onboarding" | "traveler_id"
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

export type OndoBSimulatedCredential = {
  status: "simulated_ready"
  method: OndoBIdentityMethod
  assurance: OndoBIdentityAssurance
  credentialType: "KTourVisitorCredential"
  issuerLabel: "K-Tour ID Demo Issuer"
  issuedAt: number
  expiresAt: number
}

export const KTOUR_ID_SETUP_TTL_MS = 10 * 60 * 1000
export const KTOUR_ID_CREDENTIAL_TTL_MS = 2 * 60 * 60 * 1000

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
): OndoBSimulatedCredential {
  return {
    status: "simulated_ready",
    method,
    assurance: method === "passport_ekyc" ? "private_passport_ekyc" : "official_mobile_id",
    credentialType: "KTourVisitorCredential",
    issuerLabel: "K-Tour ID Demo Issuer",
    issuedAt: now,
    expiresAt: now + KTOUR_ID_CREDENTIAL_TTL_MS,
  }
}

export function isSimulatedCredentialActiveB(credential: OndoBSimulatedCredential, now = Date.now()) {
  return now >= credential.issuedAt && now < credential.expiresAt
}
