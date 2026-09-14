import { expect, test } from "@playwright/test"
import { kpassDemoIssuanceRef, restoreKPassDemoRefundClaims, evaluateKPassService } from "../../features/ondo/contracts/kpass-capabilities"
import { createReviewFixtureAuthority, reviewFixture, type ReviewFixtureExecution } from "../../features/ondo/contracts/execution-mode"
import { completeKPassDemoAgeProofB, createSimulatedCredentialB, KTOUR_ID_PRESENTATION_TTL_MS, simulatedCredentialStatusB, type KPassAgeProofValueB } from "../../features/ondo/identity-b/ktour-id-setup-model-b"

const NOW = Date.parse("2026-09-08T07:00:00Z")
const OPTIONS = { allowReviewFixture: true }
let serial = 0

function proof(now = NOW) {
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: `FX-AGE-RECOVERY-${++serial}` })!
  return reviewFixture(authority, { outcome: "success", value: { predicate: "AGE_GTE_19", outcome: "eligible" } as const, now: new Date(now) })
}

test("a separate age proof supplements only an absent predicate, without renewing any other claim", () => {
  const issued = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "age_unknown")
  const original = { ...issued, claims: { ...issued.claims, personVerified: false, paymentSpentKrw: 91_000, visitorBenefit: { ...issued.claims.visitorBenefit, status: "used" as const } } }
  const revised = completeKPassDemoAgeProofB(original, proof(), OPTIONS, NOW)
  expect(revised).not.toBeNull()
  expect(revised!.credentialId).not.toBe(original.credentialId)
  expect(revised!.claims).toEqual({ ...original.claims, ageOver19: true })
  expect(revised!.issuedAt).toBe(original.issuedAt)
  expect(revised!.expiresAt).toBe(original.expiresAt)
  expect(revised!.executionTruth).toBe("FIXTURE_REVIEW")
  expect(revised!.externalProviderConnected).toBe(false)
  expect(original.claims.ageOver19).toBeNull()
})

test("a negative age predicate, blocked credential, or absent credential cannot be upgraded", () => {
  for (const scenario of ["adult_visitor", "under_age", "revoked", "suspended"] as const) {
    const credential = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, scenario)
    expect(completeKPassDemoAgeProofB(credential, proof(), OPTIONS, NOW)).toBeNull()
  }
  const credential = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "age_unknown")
  expect(completeKPassDemoAgeProofB(null, proof(), OPTIONS, NOW)).toBeNull()
  expect(completeKPassDemoAgeProofB({ ...credential, expiresAt: NOW }, proof(), OPTIONS, NOW)).toBeNull()
  expect(completeKPassDemoAgeProofB({ ...credential, claims: { ...credential.claims, riskFlag: "blocked" } }, proof(), OPTIONS, NOW)).toBeNull()
  expect(completeKPassDemoAgeProofB({ ...credential, claims: { ...credential.claims, serviceAccess: ["person"] } }, proof(), OPTIONS, NOW)).toBeNull()
})

test("provider inspection, serialized success and replay cannot provide age authority", () => {
  const credential = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "age_unknown")
  const execution = proof()
  expect(completeKPassDemoAgeProofB(credential, execution, {}, NOW)).toBeNull()
  expect(completeKPassDemoAgeProofB(credential, JSON.parse(JSON.stringify(execution)), OPTIONS, NOW)).toBeNull()
  expect(completeKPassDemoAgeProofB(credential, { ...execution }, OPTIONS, NOW)).toBeNull()
  expect(completeKPassDemoAgeProofB(credential, execution, OPTIONS, NOW)).not.toBeNull()
  expect(completeKPassDemoAgeProofB(credential, execution, OPTIONS, NOW)).toBeNull()
  const other = createSimulatedCredentialB("mobile_id", NOW - 1_000, "age_unknown")
  expect(completeKPassDemoAgeProofB(other, execution, OPTIONS, NOW)).toBeNull()
})

test("failed or unrelated live executions are not positive age proof", () => {
  const credential = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "age_unknown")
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-AGE-RECOVERY-NEGATIVE" })!
  for (const outcome of ["failure", "cancel", "expired", "unavailable"] as const) {
    expect(completeKPassDemoAgeProofB(credential, reviewFixture(authority, { outcome, now: new Date(NOW) }), OPTIONS, NOW)).toBeNull()
  }
  const wrong = reviewFixture(authority, { outcome: "success", value: { predicate: "PERSON", outcome: "eligible" }, now: new Date(NOW) })
  expect(completeKPassDemoAgeProofB(credential, wrong as ReviewFixtureExecution<KPassAgeProofValueB>, OPTIONS, NOW)).toBeNull()
})

test("proof timestamps must belong to this credential and remain within the short presentation window", () => {
  const credential = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "age_unknown")
  expect(completeKPassDemoAgeProofB(credential, proof(NOW - 1_001), OPTIONS, NOW)).toBeNull()
  expect(completeKPassDemoAgeProofB(credential, proof(NOW + 1), OPTIONS, NOW)).toBeNull()
  expect(completeKPassDemoAgeProofB(credential, proof(), OPTIONS, NOW + KTOUR_ID_PRESENTATION_TTL_MS)).toBeNull()
})

test("a held or revoked pass keeps its lifecycle label even after its expiration time", () => {
  for (const scenario of ["suspended", "revoked"] as const) {
    const credential = createSimulatedCredentialB("passport_ekyc", NOW, scenario)
    expect(simulatedCredentialStatusB(credential, NOW)).toBe(scenario)
    expect(simulatedCredentialStatusB(credential, credential.expiresAt + 1)).toBe(scenario)
  }
  const credential = createSimulatedCredentialB("passport_ekyc", NOW)
  expect(simulatedCredentialStatusB(null, NOW)).toBe("none")
  expect(simulatedCredentialStatusB(credential, NOW)).toBe("simulated_ready")
  expect(simulatedCredentialStatusB(credential, credential.expiresAt)).toBe("expired")
})

test("a full refund restores usage after an age supplement, not a new issuance", () => {
  const issued = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "age_unknown")
  const paid = { ...issued, claims: { ...issued.claims, paymentSpentKrw: 38_000, visitorBenefit: { ...issued.claims.visitorBenefit, status: "used" as const } } }
  const revised = completeKPassDemoAgeProofB(paid, proof(), OPTIONS, NOW)!
  expect(kpassDemoIssuanceRef(revised.credentialId)).toBe(issued.credentialId)
  const refunded = restoreKPassDemoRefundClaims(revised, paid.credentialId, 8_000, true)!
  expect(refunded.claims.paymentSpentKrw).toBe(30_000)
  expect(refunded.claims.visitorBenefit.status).toBe("available")
  expect(refunded.claims.ageOver19).toBe(true)
  expect(refunded.credentialId).toBe(revised.credentialId)
  expect(refunded.issuedAt).toBe(revised.issuedAt)
  expect(refunded.expiresAt).toBe(revised.expiresAt)
})

test("refunds do not credit another persona, method, issuance or unbound receipt", () => {
  const paid = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "age_unknown")
  for (const other of [
    createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "under_age"),
    createSimulatedCredentialB("mobile_id", NOW - 1_000, "age_unknown"),
    createSimulatedCredentialB("passport_ekyc", NOW, "age_unknown"),
  ]) expect(restoreKPassDemoRefundClaims(other, paid.credentialId, 8_000, true)).toBe(other)
  for (const receipt of [null, undefined, "", "fake:age:123"])
    expect(restoreKPassDemoRefundClaims(paid, receipt, 8_000, true)).toBe(paid)
  for (const amount of [-1, 0, 0.5, NaN, Infinity])
    expect(restoreKPassDemoRefundClaims(paid, paid.credentialId, amount, true)).toBe(paid)
  expect(restoreKPassDemoRefundClaims(null, paid.credentialId, 8_000, true)).toBeNull()
})

test("refund bookkeeping never renews a revoked pass or an unrelated benefit", () => {
  const issued = createSimulatedCredentialB("passport_ekyc", NOW - 1_000, "revoked")
  const paid = { ...issued, claims: { ...issued.claims, paymentSpentKrw: 8_000, visitorBenefit: { ...issued.claims.visitorBenefit, status: "used" as const } } }
  const refunded = restoreKPassDemoRefundClaims(paid, paid.credentialId, 8_000, false)!
  expect(refunded.claims.paymentSpentKrw).toBe(0)
  expect(refunded.claims.visitorBenefit.status).toBe("used")
  expect(refunded.status).toBe("revoked")
  expect(evaluateKPassService(refunded, { service: "visitor_benefit", now: NOW }).reason).toBe("credential_revoked")
})
