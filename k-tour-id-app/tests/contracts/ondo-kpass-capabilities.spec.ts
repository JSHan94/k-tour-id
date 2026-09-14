import { expect, test } from "@playwright/test"
import {
  createKPassPresentationBinding,
  evaluateKPassService,
  isKPassPresentationBinding,
  isKPassScenario,
  KPASS_DEMO_PAYMENT_LIMIT_KRW,
  KPASS_DEMO_POLICY_VERSION,
  KPASS_DEMO_SCENARIOS,
  KPASS_SERVICES,
  sameKPassPresentationBinding,
  type KPassNormalizedClaims,
  type KPassPresentationBinding,
  type KPassScenario,
} from "../../features/ondo/contracts/kpass-capabilities"
import {
  createPresentationRequestB,
  createSimulatedCredentialB,
  isPresentationRequestActiveB,
  isSimulatedCredentialActiveB,
  KTOUR_ID_CREDENTIAL_TTL_MS,
  KTOUR_ID_PRESENTATION_TTL_MS,
  resolvePresentationRequestB,
  type OndoBSimulatedCredential,
} from "../../features/ondo/identity-b/ktour-id-setup-model-b"

const NOW = Date.parse("2026-09-08T06:00:00.000Z")
const sample = (scenario: KPassScenario = "adult_visitor") => createSimulatedCredentialB("passport_ekyc", NOW, scenario)
const claimVariant = (claims: Partial<KPassNormalizedClaims>): OndoBSimulatedCredential => {
  const credential = sample()
  return { ...credential, claims: { ...credential.claims, ...claims } }
}

test("KPASS-001 every identity adapter produces explicit, non-PII sample claims", () => {
  const methods = ["mobile_id", "mobile_residence_card", "passport_ekyc"] as const
  const sources = ["omni_one_cx_mobile_id", "residence_card_adapter", "passport_nfc_ekyc"]
  const userTypes = ["citizen", "resident", "visitor"]
  methods.forEach((method, index) => {
    const credential = createSimulatedCredentialB(method, NOW)
    expect(credential).toMatchObject({
      credentialId: `kpass-demo:${method}:${NOW}:adult_visitor`,
      status: "simulated_ready", executionTruth: "FIXTURE_REVIEW", provenanceTruth: "SIMULATED",
      externalProviderConnected: false, externalEffect: "none",
      credentialType: "KTourVisitorCredential", issuedAt: NOW, expiresAt: NOW + KTOUR_ID_CREDENTIAL_TTL_MS,
      claims: {
        policyVersion: KPASS_DEMO_POLICY_VERSION, identitySource: sources[index], userType: userTypes[index],
        personVerified: true, ageOver19: true, paymentLimitKrw: KPASS_DEMO_PAYMENT_LIMIT_KRW,
      },
    })
    expect(isSimulatedCredentialActiveB(credential, NOW)).toBe(true)
    expect(JSON.stringify(credential)).not.toMatch(/dateOfBirth|passportNumber|fullName|walletAddress|privateKey|signature/)
    // Neither a route nor a citizenship label substitutes for the entitlement.
    expect(evaluateKPassService(credential, { service: "visitor_benefit", now: NOW }).status).toBe("allowed")
  })
})

test("KPASS-002 sample scenarios are allowlisted and unknown states cannot fall back to success", () => {
  expect(KPASS_DEMO_SCENARIOS).toEqual([
    "adult_visitor", "age_unknown", "under_age", "stay_expired", "suspended", "revoked", "limit_reached", "benefit_used",
  ])
  expect(isKPassScenario("adult_visitor")).toBe(true)
  expect(isKPassScenario("guest")).toBe(false)
  expect(isKPassScenario("force_success")).toBe(false)
  expect(() => createSimulatedCredentialB("passport_ekyc", NOW, "force_success" as KPassScenario)).toThrow()
  expect(() => createSimulatedCredentialB("passport_ekyc", Number.NaN)).toThrow()
  expect(() => createSimulatedCredentialB("unknown-method" as never, NOW)).toThrow()
  for (const scenario of KPASS_DEMO_SCENARIOS) expect(sample(scenario).credentialId).toContain(scenario)
})

test("KPASS-003 a guest has no fabricated authority for any protected service", () => {
  for (const service of KPASS_SERVICES) {
    expect(evaluateKPassService(null, { service, now: NOW, paymentKyc: true, amountKrw: 22_000 }))
      .toMatchObject({ status: "needs_proof", reason: "credential_required", recovery: "verify_identity" })
  }
})

test("KPASS-004 missing age proof and a negative issuer predicate have different recovery", () => {
  expect(evaluateKPassService(sample("age_unknown"), { service: "age", now: NOW }))
    .toEqual({ status: "needs_proof", reason: "age_proof_required", recovery: "prove_age", requiredClaim: "ageOver19" })
  expect(evaluateKPassService(sample("under_age"), { service: "age", now: NOW }))
    .toEqual({ status: "denied", reason: "age_not_eligible", recovery: "return_to_service", requiredClaim: "ageOver19" })
  expect(evaluateKPassService(sample("under_age"), { service: "person", now: NOW }).status).toBe("allowed")
  expect(evaluateKPassService(claimVariant({ personVerified: false }), { service: "age", now: NOW }).status).toBe("allowed")
  expect(evaluateKPassService(claimVariant({ personVerified: false }), { service: "person", now: NOW }))
    .toMatchObject({ status: "needs_proof", reason: "person_proof_required", requiredClaim: "personVerified" })
})

test("KPASS-005 trip entitlement expiry does not expire independent person or age proof", () => {
  const expiredStay = sample("stay_expired")
  expect(evaluateKPassService(expiredStay, { service: "visitor_benefit", now: NOW }))
    .toMatchObject({ status: "expired", reason: "stay_expired", recovery: "renew_stay" })
  expect(evaluateKPassService(expiredStay, { service: "person", now: NOW }).status).toBe("allowed")
  expect(evaluateKPassService(expiredStay, { service: "age", now: NOW }).status).toBe("allowed")
  expect(evaluateKPassService(expiredStay, { service: "payment", now: NOW, amountKrw: 22_000, paymentKyc: true }).status).toBe("allowed")
  expect(evaluateKPassService(claimVariant({ stayPeriod: null }), { service: "visitor_benefit", now: NOW }))
    .toMatchObject({ status: "needs_proof", reason: "stay_proof_required" })
  expect(evaluateKPassService(claimVariant({ stayPeriod: { validFrom: NOW + 1, validUntil: NOW + 1000 } }), { service: "visitor_benefit", now: NOW }))
    .toMatchObject({ status: "denied", reason: "stay_not_started" })
})

test("KPASS-006 suspended, revoked and exactly expired credentials cannot authorize any service", () => {
  for (const scenario of ["suspended", "revoked"] as const) {
    const credential = sample(scenario)
    expect(isSimulatedCredentialActiveB(credential, NOW)).toBe(false)
    for (const service of KPASS_SERVICES) {
      expect(evaluateKPassService(credential, { service, now: NOW, paymentKyc: true, amountKrw: 1 }))
        .toMatchObject({ status: "denied", reason: `credential_${scenario}` })
    }
  }
  const credential = sample()
  expect(isSimulatedCredentialActiveB(credential, credential.expiresAt - 1)).toBe(true)
  expect(isSimulatedCredentialActiveB(credential, credential.expiresAt)).toBe(false)
  expect(isSimulatedCredentialActiveB(credential, credential.issuedAt - 1)).toBe(false)
  for (const service of KPASS_SERVICES) {
    expect(evaluateKPassService(credential, { service, now: credential.expiresAt }))
      .toMatchObject({ status: "expired", reason: "credential_expired" })
  }
  expect(evaluateKPassService({ ...credential, status: "expired" }, { service: "person", now: NOW }).status).toBe("expired")
})

test("KPASS-007 a missing, consumed or expired benefit never becomes a paid discount", () => {
  expect(evaluateKPassService(sample("benefit_used"), { service: "visitor_benefit", now: NOW }))
    .toMatchObject({ status: "denied", reason: "benefit_used", recovery: "choose_standard_price" })
  expect(evaluateKPassService(claimVariant({ visitorBenefit: { ...sample().claims.visitorBenefit, entitled: false } }), { service: "visitor_benefit", now: NOW }))
    .toMatchObject({ status: "denied", reason: "benefit_not_entitled" })
  expect(evaluateKPassService(claimVariant({ visitorBenefit: { ...sample().claims.visitorBenefit, expiresAt: NOW } }), { service: "visitor_benefit", now: NOW }))
    .toMatchObject({ status: "expired", reason: "benefit_expired" })
  expect(evaluateKPassService(sample("benefit_used"), { service: "payment", now: NOW, paymentKyc: true, amountKrw: 22_000 }).status).toBe("allowed")
})

test("KPASS-008 no credential, person or age result silently satisfies payment KYC", () => {
  const credential = sample()
  for (const paymentKyc of [undefined, false]) {
    expect(evaluateKPassService(credential, { service: "payment", now: NOW, amountKrw: 22_000, paymentKyc }))
      .toEqual({ status: "needs_proof", reason: "payment_kyc_required", recovery: "complete_payment_kyc", requiredClaim: "paymentKyc" })
  }
  expect(evaluateKPassService(credential, { service: "payment", now: NOW, amountKrw: 22_000, paymentKyc: true }).status).toBe("allowed")
})

test("KPASS-009 demo limits reject overspend while preserving an exact remaining allowance", () => {
  expect(evaluateKPassService(sample("limit_reached"), { service: "payment", now: NOW, paymentKyc: true, amountKrw: 1 }))
    .toMatchObject({ status: "denied", reason: "payment_limit_reached", recovery: "reduce_amount" })
  const credential = claimVariant({ paymentSpentKrw: KPASS_DEMO_PAYMENT_LIMIT_KRW - 22_000 })
  expect(evaluateKPassService(credential, { service: "payment", now: NOW, paymentKyc: true, amountKrw: 22_000 }).status).toBe("allowed")
  expect(evaluateKPassService(credential, { service: "payment", now: NOW, paymentKyc: true, amountKrw: 22_001 }).status).toBe("denied")
  expect(evaluateKPassService(credential, { service: "payment", now: NOW, paymentKyc: true }).reason).toBe("payment_amount_required")
  for (const amountKrw of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    expect(evaluateKPassService(credential, { service: "payment", now: NOW, paymentKyc: true, amountKrw }))
      .toMatchObject({ status: "denied", reason: "payment_amount_invalid" })
  }
})

test("KPASS-010 service access and risk are issuer policy, not client preference", () => {
  expect(evaluateKPassService(claimVariant({ serviceAccess: ["person"] }), { service: "age", now: NOW }))
    .toMatchObject({ status: "denied", reason: "service_not_entitled", requiredClaim: "serviceAccess" })
  expect(evaluateKPassService(claimVariant({ riskFlag: "blocked" }), { service: "person", now: NOW }))
    .toMatchObject({ status: "denied", reason: "risk_blocked", recovery: "contact_support" })
  expect(evaluateKPassService(claimVariant({ riskFlag: "review" }), { service: "person", now: NOW }))
    .toMatchObject({ status: "denied", reason: "risk_review", recovery: "wait_for_review" })
})

test("KPASS-011 malformed values and non-sample truth fail closed without mutating claims", () => {
  const credential = sample()
  const snapshot = JSON.stringify(credential)
  expect(evaluateKPassService(credential, { service: "person", now: Number.NaN }).reason).toBe("invalid_request")
  expect(evaluateKPassService({ ...credential, externalProviderConnected: true } as never, { service: "person", now: NOW }).reason).toBe("credential_invalid")
  expect(evaluateKPassService({ ...credential, claims: undefined } as never, { service: "person", now: NOW }).reason).toBe("credential_invalid")
  expect(evaluateKPassService(claimVariant({ paymentLimitKrw: Number.NaN }), { service: "person", now: NOW }).reason).toBe("credential_invalid")
  expect(evaluateKPassService(claimVariant({ policyVersion: "future-policy" as never }), { service: "person", now: NOW }).reason).toBe("unsupported_policy")
  expect(JSON.stringify(credential)).toBe(snapshot)
})

test("KPASS-012 a service-bound presentation contains only its minimal requested claims", () => {
  const binding = createKPassPresentationBinding(sample().credentialId, "age")
  expect(binding).toEqual({
    audience: "ondo.demo.service", domain: "ondo.demo", purpose: "age",
    requestedClaims: ["ageOver19"], credentialId: sample().credentialId, policyVersion: KPASS_DEMO_POLICY_VERSION,
  })
  expect(isKPassPresentationBinding(binding)).toBe(true)
  expect(isKPassPresentationBinding({ ...binding, requestedClaims: ["ageOver19", "personVerified"] })).toBe(false)
  expect(isKPassPresentationBinding({ ...binding, unexpected: true })).toBe(false)
  expect(isKPassPresentationBinding({ ...binding, audience: "\nwrong" })).toBe(false)
  expect(() => createPresentationRequestB(NOW, "bound", { ...binding, requestedClaims: [] })).toThrow()
})

test("KPASS-013 approval requires the action's expected audience, domain, credential and policy", () => {
  const binding = createKPassPresentationBinding(sample().credentialId, "visitor_benefit")
  const request = createPresentationRequestB(NOW, "bound:benefit", binding)
  expect(isPresentationRequestActiveB(request, NOW)).toBe(true)
  expect(resolvePresentationRequestB(request, "approve", NOW + 1, binding).approved).toBe(true)
  expect(resolvePresentationRequestB(request, "approve", NOW + 1))
    .toMatchObject({ approved: false, code: "PRESENTATION_CONTEXT_MISMATCH" })
  for (const changed of [
    { ...binding, audience: "different-service" },
    { ...binding, domain: "different.example" },
    { ...binding, credentialId: "kpass-demo:different-credential" },
    { ...binding, policyVersion: "different-policy" },
    { ...binding, purpose: "age", requestedClaims: ["ageOver19"] },
  ]) {
    expect(sameKPassPresentationBinding(binding, changed)).toBe(false)
    expect(resolvePresentationRequestB(request, "approve", NOW + 1, changed as KPassPresentationBinding))
      .toMatchObject({ approved: false, code: "PRESENTATION_CONTEXT_MISMATCH" })
  }
})

test("KPASS-014 bound presentation cancellation, replay and exact expiry preserve one-time semantics", () => {
  const binding = createKPassPresentationBinding(sample().credentialId, "age")
  const request = createPresentationRequestB(NOW, "bound:age", binding)
  const approved = resolvePresentationRequestB(request, "approve", NOW + 1, binding)
  expect(resolvePresentationRequestB(approved.request, "approve", NOW + 2, binding))
    .toMatchObject({ approved: false, code: "PRESENTATION_REPLAY" })
  const denied = resolvePresentationRequestB(request, "deny", NOW + 1)
  expect(denied).toMatchObject({ approved: false, code: "PRESENTATION_DENIED" })
  expect(resolvePresentationRequestB(denied.request, "approve", NOW + 2, binding).code).toBe("PRESENTATION_REPLAY")
  expect(isPresentationRequestActiveB(request, NOW + KTOUR_ID_PRESENTATION_TTL_MS)).toBe(false)
  expect(resolvePresentationRequestB(request, "approve", NOW + KTOUR_ID_PRESENTATION_TTL_MS, binding))
    .toMatchObject({ approved: false, code: "PRESENTATION_REQUEST_EXPIRED" })
})

test("KPASS-015 existing unbound samples remain compatible but cannot satisfy a bound expectation", () => {
  const request = createPresentationRequestB(NOW, "legacy:sample")
  expect(resolvePresentationRequestB(request, "unexpected" as never, NOW + 1).approved).toBe(false)
  expect(Object.keys(request).sort()).toEqual(["consumedAt", "expiresAt", "issuedAt", "nonce"])
  expect(resolvePresentationRequestB(request, "approve", NOW + 1).approved).toBe(true)
  const expected = createKPassPresentationBinding(sample().credentialId, "visitor_benefit")
  expect(resolvePresentationRequestB(request, "approve", NOW + 1, expected))
    .toMatchObject({ approved: false, code: "PRESENTATION_CONTEXT_MISMATCH" })
})
