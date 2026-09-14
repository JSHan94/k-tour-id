import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "@playwright/test"
import { createIdentitySetupSessionB } from "../../features/ondo/identity-b/ktour-id-setup-model-b"
import { IDENTITY_DEMO_HANDOFF_TTL_MS, resolveIdentityDemoHandoff, returnIdentityDemoHandoff, startIdentityDemoHandoff } from "../../features/ondo/identity-b/identity-demo-boundary-b"

test("demo handoff requires a current opted-in session and retains method/origin", () => {
  const session = createIdentitySetupSessionB("action_gate", "mobile_residence_card", 1_000)
  for (const now of [999, session.expiresAt, Number.NaN]) assert.equal(startIdentityDemoHandoff(session, true, now), null)
  assert.equal(startIdentityDemoHandoff(session, false, 1_100), null)
  const request = startIdentityDemoHandoff(session, true, 1_100)!
  assert.equal(request.method, session.method)
  assert.equal(request.origin, session.origin)
  assert.equal(request.sessionNonce, session.nonce)
  assert.equal(request.expiresAt, 1_100 + IDENTITY_DEMO_HANDOFF_TTL_MS)
  assert.equal(request.status, "waiting")
  assert.equal(request.sampleOnly, true)
  assert.equal(request.externalProviderConnected, false)
  assert.equal("credential" in request, false)
  assert.equal(Object.isFrozen(request), true)
})

for (const decision of ["decline", "cancel", "timeout"] as const) test(`${decision} blocks stale approval and return; retry has fresh state and the same context`, () => {
  const session = createIdentitySetupSessionB("traveler_id", "mobile_id", 1_000)
  const first = startIdentityDemoHandoff(session, true, 1_100)!
  const stopped = resolveIdentityDemoHandoff(first, decision, session.nonce, 1_200)
  assert.equal(stopped.status, decision === "decline" ? "declined" : decision === "cancel" ? "cancelled" : "timed_out")
  assert.equal(resolveIdentityDemoHandoff(stopped, "approve", session.nonce, 1_300), stopped)
  assert.equal(returnIdentityDemoHandoff(stopped, session.nonce, 1_300), stopped)
  const retry = startIdentityDemoHandoff(session, true, 2_000)!
  assert.notEqual(retry, first)
  assert.equal(retry.status, "waiting")
  assert.equal(retry.sessionNonce, first.sessionNonce)
  assert.equal(retry.method, first.method)
  assert.equal(retry.origin, first.origin)
  assert.ok(retry.expiresAt > first.expiresAt)
})

test("only an approved current response returns once, without credential issuance", () => {
  const session = createIdentitySetupSessionB("traveler_id", "mobile_id", 1_000)
  const request = startIdentityDemoHandoff(session, true, 1_100)!
  assert.equal(returnIdentityDemoHandoff(request, session.nonce, 1_200), request)
  assert.equal(resolveIdentityDemoHandoff(request, "approve", "other-session", 1_200), request)
  const approved = resolveIdentityDemoHandoff(request, "approve", session.nonce, 1_200)
  assert.equal(returnIdentityDemoHandoff(approved, "other-session", 1_300), approved)
  assert.equal(returnIdentityDemoHandoff(approved, session.nonce, 1_199).status, "timed_out")
  const returned = returnIdentityDemoHandoff(approved, session.nonce, 1_300)
  assert.equal(returned.status, "returned")
  assert.equal(returnIdentityDemoHandoff(returned, session.nonce, 1_400), returned)
  assert.equal(resolveIdentityDemoHandoff(returned, "approve", session.nonce, 1_400), returned)
  assert.equal("credential" in returned, false)
})

test("expiry, clock rollback and invalid clocks cannot approve or return a response", () => {
  const session = createIdentitySetupSessionB("traveler_id", "mobile_id", 1_000)
  const request = startIdentityDemoHandoff(session, true, 1_100)!
  const approved = resolveIdentityDemoHandoff(request, "approve", session.nonce, 1_200)
  for (const now of [1_099, request.expiresAt, request.expiresAt + 1, Number.NaN]) {
    assert.equal(resolveIdentityDemoHandoff(request, "approve", session.nonce, now).status, "timed_out")
    assert.equal(returnIdentityDemoHandoff(approved, session.nonce, now).status, "timed_out")
  }
  const nearExpiry = startIdentityDemoHandoff(session, true, session.expiresAt - 10)!
  assert.equal(nearExpiry.expiresAt, session.expiresAt)
})

test("sensor and external-app examples do not acquire sensitive data or issue credentials", () => {
  for (const file of ["identity-demo-boundary-b.ts", "identity-handoff-step-b.tsx", "identity-holder-step-b.tsx", "passport-ocr-step-b.tsx", "passport-face-step-b.tsx"]) {
    const source = readFileSync(`features/ondo/identity-b/${file}`, "utf8")
    for (const forbidden of ["getUserMedia", "NDEFReader", 'type="file"', "window.open(", "fetch(", "completeIdentitySetup(", "createSimulatedCredentialB("]) assert.equal(source.includes(forbidden), false, `${file}: ${forbidden}`)
  }
  const passport = readFileSync("features/ondo/identity-b/passport-ocr-step-b.tsx", "utf8")
  assert.equal(passport.includes("setTimeout"), false)
  const setup = readFileSync("features/ondo/identity-b/ktour-id-setup-b.tsx", "utf8")
  assert.ok(setup.includes("if (!holderReceiptRef.current || !reviewMode) return"))
  assert.ok(setup.includes("if (issuedOnceRef.current) return"))
  assert.ok(setup.includes('applySampleCheckpoint("holder", "holder_delivery_preview")'))
})

test("saved-pass Back uses the existing final return while explicit recovery and one-shot issuance remain intact", () => {
  const setup = readFileSync("features/ondo/identity-b/ktour-id-setup-b.tsx", "utf8")
  const back = setup.slice(setup.indexOf("function goBack()"), setup.indexOf("function handleKeyDown("))
  assert.match(back, /if \(phase === "credential_ready"\) \{ requestFinalDismiss\(\); return \}/)
  assert.ok(back.indexOf('phase === "credential_ready"') < back.indexOf('setPhase(previous[phase] ?? "method_select")'))
  assert.match(back, /if \(phase === "recovery_intro"\) \{ setPhase\("credential_ready"\); return \}/)
  assert.equal(back.includes("issuedOnceRef.current = false"), false)
  assert.ok(setup.includes('if (issuedOnceRef.current) return setPhase("credential_ready")'))
  assert.ok(setup.includes('data-testid="identity-renew-open"'))
  assert.ok(setup.includes('data-testid="identity-device-recovery-open"'))
})
