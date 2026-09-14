import { expect, test } from "@playwright/test"
import { createSimulatedCredentialB, recoverSimulatedCredentialB } from "../../features/ondo/identity-b/ktour-id-setup-model-b"
import { evaluateKPassService, kpassDemoIssuanceRef, restoreKPassDemoRefundClaims } from "../../features/ondo/contracts/kpass-capabilities"
import { createIntegrationDemoEngineB } from "../../features/ondo/integration-demo-b/integration-demo-model-b"
import { createStableCommerceBState } from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = Date.parse("2026-09-09T05:00:00Z")

test("proof recovery never upgrades age, remaining allowance, benefit, stay, risk or service claims", () => {
  for (const scenario of ["under_age", "age_unknown", "limit_reached", "benefit_used", "stay_expired", "revoked", "suspended"] as const) {
    const credential = createSimulatedCredentialB("passport_ekyc", NOW - 1000, scenario)
    const recovered = recoverSimulatedCredentialB(credential, NOW)!
    expect(recovered).not.toBeNull()
    expect(recovered.credentialId).not.toBe(credential.credentialId)
    expect(recovered.claims).toBe(credential.claims)
    expect(recovered.method).toBe(credential.method)
    expect(recovered.status).toBe("simulated_ready")
    expect(kpassDemoIssuanceRef(recovered.credentialId)).toBe(credential.credentialId)
    if (scenario === "under_age") expect(evaluateKPassService(recovered, { service: "age", now: NOW }).reason).toBe("age_not_eligible")
    if (scenario === "age_unknown") expect(evaluateKPassService(recovered, { service: "age", now: NOW }).reason).toBe("age_proof_required")
    if (scenario === "limit_reached") expect(evaluateKPassService(recovered, { service: "payment", paymentKyc: true, amountKrw: 1, now: NOW }).reason).toBe("payment_limit_reached")
    if (scenario === "benefit_used") expect(evaluateKPassService(recovered, { service: "visitor_benefit", now: NOW }).reason).toBe("benefit_used")
    if (scenario === "stay_expired") expect(evaluateKPassService(recovered, { service: "visitor_benefit", now: NOW }).reason).toBe("stay_expired")
  }
  const credential = createSimulatedCredentialB("mobile_id", NOW - 1000)
  const restricted = { ...credential, claims: { ...credential.claims, personVerified: false, riskFlag: "blocked" as const, serviceAccess: [] } }
  expect(recoverSimulatedCredentialB(restricted, NOW)!.claims).toBe(restricted.claims)
})

test("recovery retains the paid economic issuance, restores only actual refunds and does not reissue events", () => {
  const base = createSimulatedCredentialB("passport_ekyc", NOW - 1000)
  const paid = { ...base, credentialId: `${base.credentialId}:age:${NOW - 10}`, claims: { ...base.claims, paymentSpentKrw: 19000, visitorBenefit: { ...base.claims.visitorBenefit, status: "used" as const } } }
  const recovered = recoverSimulatedCredentialB(paid, NOW)!
  const partial = restoreKPassDemoRefundClaims(recovered, base.credentialId, 9501, false)!
  expect(partial.claims.paymentSpentKrw).toBe(9499)
  expect(partial.claims.visitorBenefit.status).toBe("used")
  const full = restoreKPassDemoRefundClaims(partial, base.credentialId, 9499, true)!
  expect(full.claims.paymentSpentKrw).toBe(0)
  expect(full.claims.visitorBenefit.status).toBe("available")
  const engine = createIntegrationDemoEngineB(true, () => "same-holder")
  engine.sync({ credential: base, walletReady: false, commerce: createStableCommerceBState() }, NOW)
  engine.issueVoucher(base, NOW)
  engine.sync({ credential: full, walletReady: false, commerce: createStableCommerceBState() }, NOW)
  engine.issueVoucher(full, NOW)
  expect(engine.read().events.map(event => event.eventType)).toEqual(["KPassIssued", "VoucherIssued"])
})

test("recovery rejects absent/provider/malformed samples and proof revisions do not grow without bound", () => {
  const base = createSimulatedCredentialB("passport_ekyc", NOW - 1000)
  expect(recoverSimulatedCredentialB(null, NOW)).toBeNull()
  expect(recoverSimulatedCredentialB({ ...base, externalProviderConnected: true } as never, NOW)).toBeNull()
  expect(recoverSimulatedCredentialB({ ...base, claims: undefined } as never, NOW)).toBeNull()
  expect(recoverSimulatedCredentialB(base, NaN)).toBeNull()
  expect(recoverSimulatedCredentialB(base, base.issuedAt - 1)).toBeNull()
  let recovered = base
  for (let index = 0; index < 100; index++) {
    const next = recoverSimulatedCredentialB(recovered, NOW + index)!
    expect(next.credentialId).not.toBe(recovered.credentialId)
    expect(next.credentialId.length).toBeLessThan(200)
    expect(kpassDemoIssuanceRef(next.credentialId)).toBe(base.credentialId)
    recovered = next
  }
})
