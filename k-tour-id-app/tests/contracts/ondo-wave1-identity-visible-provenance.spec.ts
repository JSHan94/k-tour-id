import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import {
  B_ACTION_AXIS_TTL_MS,
  createBActionReviewAxis,
  type BActionAxisGate,
} from "../../features/ondo/identity-b/action-gate-contract-b"
import { createSimulatedCredentialB, simulatedCredentialStatusB } from "../../features/ondo/identity-b/ktour-id-setup-model-b"
import { resolveTravelerAxisPresentationB } from "../../features/ondo/identity-b/traveler-id-status-b"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
const profile = source("features/ondo/identity-b/profile-reputation-b.tsx")
const setup = source("features/ondo/identity-b/ktour-id-setup-b.tsx")

function reviewAxis(gate: BActionAxisGate, now: Date) {
  const fixtureId = gate === "person" ? "FX-PER-VISIBLE-PROVENANCE" : "FX-PKY-VISIBLE-PROVENANCE"
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId })
  if (!authority) throw new Error("review authority missing")
  const execution = reviewFixture(authority, { outcome: "success", value: { axis: gate }, now })
  const axis = createBActionReviewAxis(gate, execution, now)
  if (!axis) throw new Error("review axis missing")
  return axis
}

test("W1-ID-PROVENANCE-001 Person and Payment retain current and expired review provenance", () => {
  const now = new Date("2026-09-04T10:00:00.000Z")
  for (const gate of ["person", "payment_kyc"] as const) {
    const axis = reviewAxis(gate, now)
    expect(resolveTravelerAxisPresentationB(axis, now.getTime())).toEqual({ outcome: "success", reviewResult: "current" })
    expect(resolveTravelerAxisPresentationB(axis, now.getTime() + B_ACTION_AXIS_TTL_MS)).toEqual({ outcome: "expired", reviewResult: "expired" })
  }
  expect(resolveTravelerAxisPresentationB({ status: "unavailable", expiresAt: null }, now.getTime())).toEqual({ outcome: "unavailable", reviewResult: null })
  expect(resolveTravelerAxisPresentationB({ status: "expired", expiresAt: null }, now.getTime())).toEqual({ outcome: "expired", reviewResult: null })
})

test("W1-ID-PROVENANCE-002 Traveler and Profile never collapse a review axis into generic Ready", () => {
  expect(traveler).toContain("resolveTravelerAxisPresentationB(actionSession.person, statusClock)")
  expect(traveler).toContain("resolveTravelerAxisPresentationB(actionSession.payment, statusClock)")
  expect(traveler).toContain('data-review-result={personReviewResult ?? "none"}')
  expect(traveler).toContain('data-review-result={paymentReviewResult ?? "none"}')
  expect(profile).toContain("resolveTravelerAxisPresentationB(personAxis, statusClock)")
  expect(profile).toContain('data-review-result={axis.reviewResult ?? "none"}')
  for (const label of [
    "Review result · no provider check",
    "Review result expired · no provider check",
    "검토용 결과 · 외부 확인 없음",
    "검토용 결과 만료 · 외부 확인 없음",
    "レビュー用結果 · 外部確認なし",
    "レビュー用結果は期限切れ · 外部確認なし",
  ]) expect(`${traveler}\n${profile}`).toContain(label)
})

test("W1-ID-PROVENANCE-003 a review draft preserves revoked, suspended and expired lifecycle states", () => {
  const now = Date.parse("2026-09-04T10:00:00.000Z")
  const credential = createSimulatedCredentialB("passport_ekyc", now)
  expect(credential).toMatchObject({
    executionTruth: "FIXTURE_REVIEW",
    provenanceTruth: "SIMULATED",
    externalProviderConnected: false,
    externalEffect: "none",
  })
  expect(simulatedCredentialStatusB(null, now)).toBe("none")
  expect(simulatedCredentialStatusB(credential, now)).toBe("simulated_ready")
  expect(simulatedCredentialStatusB(credential, credential.expiresAt - 1)).toBe("simulated_ready")
  expect(simulatedCredentialStatusB(credential, credential.expiresAt)).toBe("expired")
  for (const status of ["revoked", "suspended", "expired"] as const) {
    expect(simulatedCredentialStatusB({ ...credential, status }, now)).toBe(status)
    expect(simulatedCredentialStatusB({ ...credential, status }, credential.expiresAt + 1)).toBe(status)
  }
  expect(traveler).toContain("isReviewCredentialDraftB(state.identityCredential)")
  expect(traveler).toContain('data-status={credentialStatus} data-review-result={credentialReviewResult ?? "none"}')
  expect(traveler).toContain("simulatedCredentialStatusB(state.identityCredential, statusClock)")
  expect(traveler).toContain('lifecycleStatus === "simulated_ready" ? "review-draft" : lifecycleStatus')
  expect(traveler).toContain('lifecycleStatus === "simulated_ready" ? "current" : lifecycleStatus')
  expect(traveler).not.toContain('credentialActive ? "review-draft" : "expired"')
  for (const label of [
    "Review draft · no provider check",
    "검토용 초안 · 외부 확인 없음",
    "レビュー用下書き · 外部確認なし",
  ]) expect(traveler).toContain(label)
  expect(setup).toContain("simulatedCredentialStatusB(state.identityCredential, credentialClock)")
  expect(setup).toMatch(/const credentialSurfaceStatus = credentialStatus === "none"\s*\? "none"\s*: statusMessage\s*\? credentialStatus/)
  expect(setup).toContain('? "review-draft"')
})

test("W1-ID-PROVENANCE-004 presentation request and result say review-only and nothing sent", () => {
  expect(setup).toContain('data-review-stage={phase === "presentation_result" ? "result" : presentationPhase ? "request" : "setup"}')
  for (const label of [
    "Review only · nothing will be sent",
    "Review result · nothing sent",
    "검토용 · 외부 전송 없음",
    "검토용 결과 · 전송 없음",
    "レビュー用 · 外部送信なし",
    "レビュー結果 · 送信なし",
  ]) expect(setup).toContain(label)
  expect(setup).not.toMatch(/Sharing complete|공유 완료|共有完了/)
})
