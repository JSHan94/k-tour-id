import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("B-ACCOUNT-001 Save owns a B-native Account gate with exact one-shot venue return", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const product = source("features/ondo/app/ondo-product-b.tsx")
  const gate = source("features/ondo/identity-b/account-save-gate-b.tsx")
  const css = source("features/ondo/identity-b/account-save-gate-b.module.css")
  const returnTo = source("features/ondo/contracts/return-to-b.ts")

  expect(place).toContain("actions.saveVenue(currentVenueId)")
  expect(product).toContain("AccountSaveGateMountB")
  expect(gate).toContain("state.accountReturnTo")
  expect(gate).toContain("restoreExactVenue")
  expect(gate).toContain("openSavedBDiscoveryVenue")
  for (const evidence of [
    'action: "SAVE_VENUE"',
    'activeGate: "account"',
    'returnLevel: "detail"',
    "draft: null",
    "consumeBAccountReturnTo",
    "isCanonicalVenueId",
    "isEditorialPlaceId",
    "RT-B-SAVE_EDITORIAL_PLACE",
    "B_ACCOUNT_RETURN_TO_TTL_MS",
  ]) expect(returnTo).toContain(evidence)
  for (const evidence of ["ondo-gate-overlay", "account-return-context", "account-boundary", "account-start", "gate-cancel", "account-gate-close", "gate-failure", "gate-retry"]) {
    expect(gate).toContain(evidence)
  }
  expect(gate).not.toContain('data-testid="account-complete"')
  expect(css).toContain("background: var(--ondo-surface-raised")
  expect(css).toContain("min-height: 52px")
  expect(css).toContain("@media (max-width: 520px)")
})

test("B-ACCOUNT-002 Account is session-only, migrates only the legacy Account axis, and gates every canonical add", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const deviceTypeStart = provider.indexOf("type OndoBDeviceState")
  const deviceType = provider.slice(deviceTypeStart, provider.indexOf("\n}", deviceTypeStart) + 2)
  const persistenceStart = provider.indexOf("function restoreBDeviceState")
  const devicePersistence = provider.slice(persistenceStart, provider.indexOf("export type BAccountSessionState", persistenceStart))

  expect(provider).toContain('B_ACCOUNT_SESSION_KEY = "ondo-b.account.v1"')
  expect(provider).toContain('LEGACY_SESSION_KEY = "ondo.session.v3"')
  expect(provider).toContain('legacy?.account')
  expect(provider).toContain('current.account !== "ACC-ACTIVE"')
  expect(provider).toContain("beginAccountSave(venueId)")
  expect(provider).toContain("beginEditorialAccountSave(editorialPlaceId)")
  expect(provider).toContain("return beginEditorialAccountSave(editorialPlaceId)")
  expect(provider).toContain("activateAccount(): boolean")
  expect(provider).toContain('if (stateRef.current.account === "ACC-CREATING") return true')
  expect(provider).toContain('if (stateRef.current.account !== "ACC-CREATING") return false')
  expect(provider).toContain("persistBAccountSession({ account: \"ACC-ACTIVE\", returnTo: null })")
  for (const forbidden of ["account:", "accountReturnTo", "person:", "age:", "paymentKyc:", "profile:"]) {
    expect(deviceType).not.toContain(forbidden)
  }
  expect(devicePersistence).not.toContain("B_ACCOUNT_SESSION_KEY")
})

test("B-ACCOUNT-003 the walkthrough is localized, provider-neutral, and keeps identity/payment axes separate", () => {
  const gate = source("features/ondo/identity-b/account-save-gate-b.tsx")
  const css = source("features/ondo/identity-b/account-save-gate-b.module.css")
  const intro = gate.slice(gate.indexOf('{view === "intro" ? ('), gate.indexOf('{view === "processing" ? ('))
  const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
  const policy = source("scripts/ondo-b-standalone/policy.mjs")

  for (const locale of ["en", "ko", "ja"]) expect(gate).toContain(`${locale}: {`)
  for (const truth of [
    "Your account stays in this tab. Person, 19+, and payment are checked separately only when an action needs them.",
    "계정은 이 탭에만 유지돼요. 본인·19+·결제는 행동에 필요할 때 각각 따로 확인합니다.",
    "アカウントはこのタブだけに保持されます。本人、19歳以上、決済は操作に必要な時だけ個別に確認します。",
  ]) expect(gate).toContain(truth)
  expect(gate).toContain('localActual("account", { action: "save_place" as const, tokenId: returnTo.tokenId })')
  expect(gate).toContain('execution.result !== "LOCAL_COMMITTED"')
  expect(gate).toContain("useModalIsolation")
  expect(gate).toContain("focusFirstAvailableDestination")
  expect(gate).toContain('[href],summary,[tabindex]')
  expect(intro.indexOf('data-testid="account-return-context"')).toBeLessThan(intro.indexOf('id="account-save-title"'))
  expect(intro).not.toContain('id="account-save-session-truth"')
  expect(intro).toMatch(/<details className=\{styles\.boundary\} data-testid="account-boundary"><summary>/)
  for (const visibleScope of ["For this visit · this tab only", "이번 방문 · 이 탭에서만", "今回の滞在・このタブのみ"]) {
    expect(gate).toContain(visibleScope)
  }
  expect(gate).toContain('[closing, returnTo.tokenId, view]')
  expect(gate).toContain('ref={retryRef}')
  expect(gate).toContain('data-testid="account-gate-processing"')
  expect(gate).toContain('role="status" aria-live="polite" aria-busy="true"')
  expect(gate).toContain('data-testid="account-gate-close" aria-label={t.cancel} disabled={closing} onClick={cancel}')
  expect(gate).toContain("useDocumentScrollLock")
  expect(css).toContain("width: 44px")
  expect(css).toContain("max-width: 100%")
  expect(css).toContain("overflow-wrap: anywhere")
  expect(css).not.toContain(".sessionTruth")
  expect(gate).not.toMatch(/OndoProvider|GateOverlay|fetch\(|XMLHttpRequest|WebSocket|credentialPayload|dateOfBirth/)
  expect(traveler).toContain('state.account === "ACC-ACTIVE"')
  expect(traveler).toContain('data-testid="traveler-id-account"')
  expect(policy).toContain('"features/ondo/identity-b/account-save-gate-b.tsx"')
  expect(policy).toContain('"features/ondo/identity-b/account-save-gate-b.module.css"')
})

test("B-ACCOUNT-004 Account exposes one duplicate-locked pending state before either commit path", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const saveGate = source("features/ondo/identity-b/account-save-gate-b.tsx")
  const coordinator = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")

  expect(provider).toContain('"ACC-GUEST" | "ACC-CREATING" | "ACC-ACTIVE"')
  expect(provider).toContain('if (stateRef.current.account === "ACC-CREATING") return true')
  expect(provider).toContain('if (current.account !== "ACC-CREATING" || !returnTo) return "account_failed"')
  expect(saveGate).toContain('else setView("processing")')
  expect(saveGate).toContain('data-testid="account-gate-processing"')
  expect(saveGate).toContain('role="status" aria-live="polite" aria-busy="true"')
  expect(coordinator).toContain('if (!actions.beginAccountActivation()) { fail(activeGate, "failure"); return }')
  expect(coordinator).toContain('activeGate !== "account" || view !== "processing"')
  expect(coordinator).toContain('data-testid={resolvedView === "processing" ? gate === "account" ? "account-gate-processing"')
  expect(coordinator).toContain('aria-busy={resolvedView === "processing" ? true : undefined}')
})
