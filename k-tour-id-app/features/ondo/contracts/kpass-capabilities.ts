/**
 * Prepared K-Pass service-policy examples, not a credential verifier.
 * These normalized, non-PII claims model the adapter -> VC/VP -> service boundary.
 * Production must obtain authenticated claims and a current credential status
 * from the issuer/verifier; neither this module nor browser state proves identity.
 */
export const KPASS_DEMO_POLICY_VERSION = "ondo-kpass-demo.v1" as const
/** Illustrative hackathon allowance, not a provider limit or a legal entitlement. */
export const KPASS_DEMO_PAYMENT_LIMIT_KRW = 100_000
export const KPASS_DEMO_STAY_MS = 30 * 24 * 60 * 60 * 1_000

export const KPASS_DEMO_SCENARIOS = [
  "adult_visitor", "age_unknown", "under_age", "stay_expired",
  "suspended", "revoked", "limit_reached", "benefit_used",
] as const
export type KPassScenario = typeof KPASS_DEMO_SCENARIOS[number]
export const KPASS_SERVICES = ["person", "age", "visitor_benefit", "payment"] as const
export type KPassService = typeof KPASS_SERVICES[number]
export type KPassIdentitySource = "omni_one_cx_mobile_id" | "residence_card_adapter" | "passport_nfc_ekyc"
export type KPassCredentialStatus = "simulated_ready" | "expired" | "suspended" | "revoked"
export type KPassClaim = "personVerified" | "ageOver19" | "stayPeriod" | "visitorBenefit" | "paymentLimitKrw" | "serviceAccess"

export type KPassNormalizedClaims = Readonly<{
  policyVersion: typeof KPASS_DEMO_POLICY_VERSION
  identitySource: KPassIdentitySource
  userType: "citizen" | "resident" | "visitor"
  personVerified: boolean
  /** A prepared issuer predicate. Never derive this from a client-entered DOB. */
  ageOver19: boolean | null
  /** Authorized trip window; not a claim that ONDO has issued an immigration visa. */
  stayPeriod: Readonly<{ validFrom: number; validUntil: number }> | null
  trustLevel: "verified_identity" | "limited"
  riskFlag: "none" | "review" | "blocked"
  serviceAccess: readonly KPassService[]
  paymentLimitKrw: number
  paymentSpentKrw: number
  visitorBenefit: Readonly<{
    entitlementId: "demo-welcome-meal"
    entitled: boolean
    status: "available" | "used"
    expiresAt: number
  }>
}>

export type KPassDemoCredential = Readonly<{
  credentialId: string
  status: KPassCredentialStatus
  executionTruth: "FIXTURE_REVIEW"
  provenanceTruth: "SIMULATED"
  externalProviderConnected: false
  externalEffect: "none"
  issuedAt: number
  expiresAt: number
  claims: KPassNormalizedClaims
}>

export type KPassDecisionReason =
  | "allowed" | "credential_required" | "credential_invalid" | "credential_expired"
  | "credential_suspended" | "credential_revoked" | "unsupported_policy"
  | "person_proof_required" | "age_proof_required" | "age_not_eligible"
  | "stay_proof_required" | "stay_not_started" | "stay_expired"
  | "service_not_entitled" | "benefit_not_entitled" | "benefit_used" | "benefit_expired"
  | "risk_review" | "risk_blocked" | "payment_kyc_required"
  | "payment_amount_required" | "payment_amount_invalid" | "payment_limit_reached"
  | "invalid_request"
export type KPassRecovery =
  | "none" | "verify_identity" | "prove_age" | "renew_credential"
  | "contact_support" | "return_to_service" | "renew_stay" | "choose_standard_price"
  | "complete_payment_kyc" | "reduce_amount" | "wait_for_review"
export type KPassServiceDecision = Readonly<{
  status: "allowed" | "needs_proof" | "denied" | "expired"
  reason: KPassDecisionReason
  /** paymentKyc is separate evidence, never an identity-VC claim. */
  requiredClaim?: KPassClaim | "paymentKyc"
  recovery: KPassRecovery
}>
export type KPassServiceRequest = Readonly<{
  service: KPassService
  now?: number
  amountKrw?: number
  /** Consumers must independently validate the current payment-KYC receipt. */
  paymentKyc?: boolean
}>

export function isKPassScenario(value: unknown): value is KPassScenario {
  return typeof value === "string" && (KPASS_DEMO_SCENARIOS as readonly string[]).includes(value)
}

export function createKPassDemoClaims(
  identitySource: KPassIdentitySource,
  now: number,
  scenario: KPassScenario = "adult_visitor",
): KPassNormalizedClaims {
  if (!Number.isFinite(now) || !isKPassScenario(scenario)
    || !["omni_one_cx_mobile_id", "residence_card_adapter", "passport_nfc_ekyc"].includes(identitySource)) {
    throw new Error("Invalid K-Pass sample input")
  }
  const stayExpired = scenario === "stay_expired"
  const stayPeriod = Object.freeze({
    validFrom: now - KPASS_DEMO_STAY_MS,
    validUntil: stayExpired ? now : now + KPASS_DEMO_STAY_MS,
  })
  return Object.freeze({
    policyVersion: KPASS_DEMO_POLICY_VERSION,
    identitySource,
    userType: identitySource === "omni_one_cx_mobile_id" ? "citizen" : identitySource === "residence_card_adapter" ? "resident" : "visitor",
    personVerified: true,
    ageOver19: scenario === "age_unknown" ? null : scenario !== "under_age",
    stayPeriod,
    trustLevel: "verified_identity",
    riskFlag: "none",
    serviceAccess: Object.freeze([...KPASS_SERVICES]),
    paymentLimitKrw: KPASS_DEMO_PAYMENT_LIMIT_KRW,
    paymentSpentKrw: scenario === "limit_reached" ? KPASS_DEMO_PAYMENT_LIMIT_KRW : 0,
    // Eligibility is an explicit entitlement, not inferred from a nationality,
    // identity route, age, Person result or the existence of a payment wallet.
    visitorBenefit: Object.freeze({
      entitlementId: "demo-welcome-meal",
      entitled: true,
      status: scenario === "benefit_used" ? "used" : "available",
      expiresAt: now + KPASS_DEMO_STAY_MS,
    }),
  })
}

function validClaims(claims: KPassNormalizedClaims | undefined): claims is KPassNormalizedClaims {
  if (!claims || typeof claims !== "object") return false
  const stay = claims.stayPeriod
  const benefit = claims.visitorBenefit
  return ["omni_one_cx_mobile_id", "residence_card_adapter", "passport_nfc_ekyc"].includes(claims.identitySource)
    && ["citizen", "resident", "visitor"].includes(claims.userType)
    && typeof claims.personVerified === "boolean"
    && (claims.ageOver19 === null || typeof claims.ageOver19 === "boolean")
    && (stay === null || (typeof stay === "object" && Number.isFinite(stay.validFrom)
      && Number.isFinite(stay.validUntil) && stay.validUntil > stay.validFrom))
    && ["verified_identity", "limited"].includes(claims.trustLevel)
    && ["none", "review", "blocked"].includes(claims.riskFlag)
    && Array.isArray(claims.serviceAccess)
    && claims.serviceAccess.every((service) => (KPASS_SERVICES as readonly string[]).includes(service))
    && new Set(claims.serviceAccess).size === claims.serviceAccess.length
    && Number.isSafeInteger(claims.paymentLimitKrw) && claims.paymentLimitKrw >= 0
    && Number.isSafeInteger(claims.paymentSpentKrw) && claims.paymentSpentKrw >= 0
    && !!benefit && typeof benefit === "object" && benefit.entitlementId === "demo-welcome-meal"
    && typeof benefit.entitled === "boolean" && ["available", "used"].includes(benefit.status)
    && Number.isFinite(benefit.expiresAt)
}

function validDemoCredential(credential: KPassDemoCredential) {
  return typeof credential.credentialId === "string" && credential.credentialId.startsWith("kpass-demo:")
    && credential.credentialId.length <= 200
    && credential.executionTruth === "FIXTURE_REVIEW" && credential.provenanceTruth === "SIMULATED"
    && credential.externalProviderConnected === false && credential.externalEffect === "none"
    && Number.isFinite(credential.issuedAt) && Number.isFinite(credential.expiresAt)
    && credential.expiresAt > credential.issuedAt
    && validClaims(credential.claims)
}

/** The prepared issuer's age/recovery proofs revise this ID. Real adapters
 * must supply an immutable issuance reference separately from a VC revision. */
export function kpassDemoIssuanceRef(credentialId: string | null | undefined): string | null {
  if (typeof credentialId !== "string" || !credentialId.startsWith("kpass-demo:")
    || credentialId.length > 200 || /\s/.test(credentialId)) return null
  return credentialId.replace(/(?::(?:age|recovery):\d+)+$/, "")
}

/** Bookkeeping for a committed refund delta, never an unconfirmed callback.
 * Age/recovery proof revisions share an economic issuance; another persona or
 * new issuance does not. A benefit is restored only on the final refund delta.
 * Restoring usage never renews or un-revokes the credential itself. */
export function restoreKPassDemoRefundClaims<T extends KPassDemoCredential>(
  credential: T | null,
  paidCredentialId: string | null | undefined,
  amountKrw: number,
  benefitApplied: boolean,
): T | null {
  const paidIssuance = kpassDemoIssuanceRef(paidCredentialId)
  if (!credential || !validDemoCredential(credential) || !paidIssuance
    || paidIssuance !== kpassDemoIssuanceRef(credential.credentialId)
    || !Number.isSafeInteger(amountKrw) || amountKrw <= 0) return credential
  return {
    ...credential,
    claims: {
      ...credential.claims,
      paymentSpentKrw: Math.max(0, credential.claims.paymentSpentKrw - amountKrw),
      visitorBenefit: { ...credential.claims.visitorBenefit, status: benefitApplied ? "available" : credential.claims.visitorBenefit.status },
    },
  }
}

/** This is a sample lifecycle/shape check, not signature or issuer verification. */
export function isKPassDemoCredentialCurrent(credential: KPassDemoCredential, now = Date.now()) {
  return Number.isFinite(now) && validDemoCredential(credential)
    && credential.claims.policyVersion === KPASS_DEMO_POLICY_VERSION
    && credential.status === "simulated_ready"
    && now >= credential.issuedAt && now < credential.expiresAt
}

function decision(
  status: KPassServiceDecision["status"], reason: KPassDecisionReason,
  recovery: KPassRecovery, requiredClaim?: KPassServiceDecision["requiredClaim"],
): KPassServiceDecision {
  return requiredClaim ? { status, reason, recovery, requiredClaim } : { status, reason, recovery }
}

/** Re-evaluate at the action boundary and immediately before any mutation. */
export function evaluateKPassService(
  credential: KPassDemoCredential | null,
  request: KPassServiceRequest,
): KPassServiceDecision {
  const now = request.now ?? Date.now()
  if (!Number.isFinite(now) || !(KPASS_SERVICES as readonly string[]).includes(request.service)) {
    return decision("denied", "invalid_request", "return_to_service")
  }
  if (!credential) return decision("needs_proof", "credential_required", "verify_identity", request.service === "age" ? "ageOver19" : "personVerified")
  if (!validDemoCredential(credential)) return decision("denied", "credential_invalid", "renew_credential")
  if (credential.claims.policyVersion !== KPASS_DEMO_POLICY_VERSION) return decision("denied", "unsupported_policy", "renew_credential")
  if (credential.status === "revoked") return decision("denied", "credential_revoked", "renew_credential")
  if (credential.status === "suspended") return decision("denied", "credential_suspended", "contact_support")
  if (credential.status === "expired" || now >= credential.expiresAt) return decision("expired", "credential_expired", "renew_credential")
  if (credential.status !== "simulated_ready" || now < credential.issuedAt) return decision("denied", "credential_invalid", "renew_credential")
  const claims = credential.claims
  if (claims.riskFlag === "blocked") return decision("denied", "risk_blocked", "contact_support")
  if (claims.riskFlag === "review") return decision("denied", "risk_review", "wait_for_review")
  if (!claims.serviceAccess.includes(request.service)) return decision("denied", "service_not_entitled", "return_to_service", "serviceAccess")

  if (request.service === "person") {
    return claims.personVerified
      ? decision("allowed", "allowed", "none")
      : decision("needs_proof", "person_proof_required", "verify_identity", "personVerified")
  }
  if (request.service === "age") {
    if (claims.ageOver19 === null) return decision("needs_proof", "age_proof_required", "prove_age", "ageOver19")
    return claims.ageOver19
      ? decision("allowed", "allowed", "none")
      : decision("denied", "age_not_eligible", "return_to_service", "ageOver19")
  }
  if (request.service === "visitor_benefit") {
    if (!claims.stayPeriod) return decision("needs_proof", "stay_proof_required", "renew_stay", "stayPeriod")
    if (now < claims.stayPeriod.validFrom) return decision("denied", "stay_not_started", "choose_standard_price", "stayPeriod")
    if (now >= claims.stayPeriod.validUntil) return decision("expired", "stay_expired", "renew_stay", "stayPeriod")
    if (!claims.visitorBenefit.entitled) return decision("denied", "benefit_not_entitled", "choose_standard_price", "visitorBenefit")
    if (claims.visitorBenefit.status === "used") return decision("denied", "benefit_used", "choose_standard_price", "visitorBenefit")
    if (now >= claims.visitorBenefit.expiresAt) return decision("expired", "benefit_expired", "choose_standard_price", "visitorBenefit")
    return decision("allowed", "allowed", "none")
  }
  // Identity, age, stay and a benefit do not grant payment-KYC authority.
  if (request.paymentKyc !== true) return decision("needs_proof", "payment_kyc_required", "complete_payment_kyc", "paymentKyc")
  if (request.amountKrw === undefined) return decision("denied", "payment_amount_required", "return_to_service")
  if (!Number.isSafeInteger(request.amountKrw) || request.amountKrw <= 0) return decision("denied", "payment_amount_invalid", "return_to_service")
  if (request.amountKrw > claims.paymentLimitKrw - claims.paymentSpentKrw) return decision("denied", "payment_limit_reached", "reduce_amount", "paymentLimitKrw")
  return decision("allowed", "allowed", "none")
}

export const KPASS_SERVICE_REQUESTED_CLAIMS: Readonly<Record<KPassService, readonly KPassClaim[]>> = Object.freeze({
  person: Object.freeze(["personVerified"] as const),
  age: Object.freeze(["ageOver19"] as const),
  visitor_benefit: Object.freeze(["stayPeriod", "visitorBenefit", "serviceAccess"] as const),
  payment: Object.freeze(["paymentLimitKrw", "serviceAccess"] as const),
})
export type KPassPresentationBinding = Readonly<{
  audience: string
  domain: string
  purpose: KPassService
  requestedClaims: readonly KPassClaim[]
  credentialId: string
  policyVersion: typeof KPASS_DEMO_POLICY_VERSION
}>

export function createKPassPresentationBinding(
  credentialId: string,
  service: KPassService,
  context: Readonly<{ audience?: string; domain?: string }> = {},
): KPassPresentationBinding {
  const binding: KPassPresentationBinding = Object.freeze({
    audience: context.audience ?? "ondo.demo.service",
    domain: context.domain ?? "ondo.demo",
    purpose: service,
    requestedClaims: KPASS_SERVICE_REQUESTED_CLAIMS[service],
    credentialId,
    policyVersion: KPASS_DEMO_POLICY_VERSION,
  })
  if (!isKPassPresentationBinding(binding)) throw new Error("Invalid K-Pass presentation context")
  return binding
}

export function isKPassPresentationBinding(value: unknown): value is KPassPresentationBinding {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const binding = value as Record<string, unknown>
  if (Object.keys(binding).sort().join("|") !== ["audience", "domain", "purpose", "requestedClaims", "credentialId", "policyVersion"].sort().join("|")) return false
  const boundedText = (text: unknown) => typeof text === "string" && text.trim() === text && text.length > 0 && text.length <= 256 && !/[\u0000-\u001f\u007f]/.test(text)
  if (!boundedText(binding.audience) || !boundedText(binding.domain) || !boundedText(binding.credentialId)
    || binding.policyVersion !== KPASS_DEMO_POLICY_VERSION
    || !(KPASS_SERVICES as readonly unknown[]).includes(binding.purpose)) return false
  const expectedClaims = KPASS_SERVICE_REQUESTED_CLAIMS[binding.purpose as KPassService]
  return Array.isArray(binding.requestedClaims) && binding.requestedClaims.length === expectedClaims.length
    && binding.requestedClaims.every((claim, index) => claim === expectedClaims[index])
}

export function sameKPassPresentationBinding(left: unknown, right: unknown) {
  return isKPassPresentationBinding(left) && isKPassPresentationBinding(right)
    && left.audience === right.audience && left.domain === right.domain
    && left.purpose === right.purpose && left.credentialId === right.credentialId
    && left.policyVersion === right.policyVersion
    && left.requestedClaims.every((claim, index) => claim === right.requestedClaims[index])
}
