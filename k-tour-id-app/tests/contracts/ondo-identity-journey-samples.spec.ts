import assert from "node:assert/strict"
import { test } from "@playwright/test"
import {
  IDENTITY_JOURNEY_SAMPLES, createIdentityManualReview, identitySampleInterruption,
  identitySamplesForMethod, mayDeliverIdentityManualReview, resolveIdentityManualReview,
  type IdentitySampleCheckpoint,
} from "../../features/ondo/contracts/identity-journey-samples"

const checkpoints: IdentitySampleCheckpoint[] = ["handoff", "document", "face", "provider", "holder"]

test("every non-success sample is reachable exactly once at its correct method checkpoint", () => {
  for (const method of ["mobile_id", "mobile_residence_card", "passport_ekyc"] as const) {
    for (const sample of identitySamplesForMethod(method)) {
      const outcomes = checkpoints.map(checkpoint => identitySampleInterruption(sample, method, checkpoint, false)).filter(Boolean)
      assert.equal(outcomes.length, sample === "success" ? 0 : 1, `${method}/${sample}`)
      if (outcomes.length) assert.equal(outcomes[0]!.sampleOnly, true)
      for (const checkpoint of checkpoints) assert.equal(identitySampleInterruption(sample, method, checkpoint, true), null)
    }
  }
  assert.equal(IDENTITY_JOURNEY_SAMPLES.length, 16)
})

test("passport-only failures cannot interrupt CX and app-install failure cannot interrupt passport", () => {
  assert.equal(identitySampleInterruption("face_mismatch", "mobile_id", "face", false), null)
  assert.equal(identitySampleInterruption("nfc_unsupported", "mobile_residence_card", "document", false), null)
  assert.equal(identitySampleInterruption("app_missing", "passport_ekyc", "handoff", false), null)
})

test("holder failure is after issuer processing but before a pass can be saved", () => {
  assert.equal(identitySampleInterruption("holder_failed", "passport_ekyc", "provider", false), null)
  assert.deepEqual(identitySampleInterruption("holder_failed", "passport_ekyc", "holder", false), {
    code: "HOLDER_DELIVERY_FAILED", phase: "failed", sampleOnly: true,
  })
})

test("manual review begins pending without approval or a credential", () => {
  const request = createIdentityManualReview("session-a", 1_000, 10_000)
  assert.equal(request.status, "pending")
  assert.equal(request.externalProviderConnected, false)
  assert.equal(request.sampleOnly, true)
  assert.equal(request.checkedAt, null)
  assert.equal(mayDeliverIdentityManualReview(request, "session-a", 1_500), false)
  assert.equal("credential" in request, false)
})

for (const outcome of ["approved", "declined", "needs_info"] as const) {
  test(`manual ${outcome} is a timestamped sample result, not credential issuance`, () => {
    const request = createIdentityManualReview("session-a", 1_000, 10_000)
    const result = resolveIdentityManualReview(request, outcome, "session-a", 2_000)
    assert.equal(request.status, "pending")
    assert.equal(result.status, outcome)
    assert.equal(result.checkedAt, 2_000)
    assert.equal(mayDeliverIdentityManualReview(result, "session-a", 2_100), outcome === "approved")
    assert.equal("credential" in result, false)
    assert.equal(Object.isFrozen(result), true)
    assert.equal(resolveIdentityManualReview(result, "approved", "session-a", 2_500), result)
  })
}

test("wrong session, closed result, expiry and clock rollback never authorize holder delivery", () => {
  const request = createIdentityManualReview("session-a", 1_000, 10_000)
  assert.equal(resolveIdentityManualReview(request, "approved", "session-b", 2_000), request)
  for (const now of [999, 10_000, 10_001]) {
    const result = resolveIdentityManualReview(request, "approved", "session-a", now)
    assert.equal(result.status, "expired")
    assert.equal(mayDeliverIdentityManualReview(result, "session-a", now), false)
  }
  const approved = resolveIdentityManualReview(request, "approved", "session-a", 2_000)
  assert.equal(mayDeliverIdentityManualReview(approved, "session-b", 3_000), false)
  assert.equal(mayDeliverIdentityManualReview(approved, "session-a", 1_999), false)
  assert.equal(mayDeliverIdentityManualReview(approved, "session-a", 10_000), false)
})
