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
    "B_RETURN_TO_TTL_MS",
  ]) expect(returnTo).toContain(evidence)
  for (const evidence of ["ondo-gate-overlay", "account-return-context", "account-start", "account-complete", "gate-cancel", "gate-failure", "gate-retry"]) {
    expect(gate).toContain(evidence)
  }
  expect(css).toContain("background: #fff")
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
  expect(provider).toContain("activateAccount(): boolean")
  expect(provider).toContain("persistBAccountSession({ account: \"ACC-ACTIVE\", returnTo: null })")
  for (const forbidden of ["account:", "accountReturnTo", "person:", "age:", "paymentKyc:", "profile:"]) {
    expect(deviceType).not.toContain(forbidden)
  }
  expect(devicePersistence).not.toContain("B_ACCOUNT_SESSION_KEY")
})

test("B-ACCOUNT-003 the walkthrough is localized, provider-neutral, and keeps identity/payment axes separate", () => {
  const gate = source("features/ondo/identity-b/account-save-gate-b.tsx")
  const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
  const policy = source("scripts/ondo-b-standalone/policy.mjs")

  for (const locale of ["en", "ko", "ja"]) expect(gate).toContain(`${locale}: {`)
  for (const truth of [
    "No account provider is connected",
    "Person, 19+, and payment checks remain separate and incomplete",
    "연결된 계정 제공기관이나 생성되는 자격증명은 없고",
    "本人、19歳以上、決済の確認は別で、完了しません",
  ]) expect(gate).toContain(truth)
  expect(gate).toContain("useModalIsolation")
  expect(gate).toContain("focusFirstAvailableDestination")
  expect(gate).not.toMatch(/OndoProvider|GateOverlay|fetch\(|XMLHttpRequest|WebSocket|credentialPayload|dateOfBirth/)
  expect(traveler).toContain('state.account === "ACC-ACTIVE"')
  expect(traveler).toContain('data-testid="traveler-id-account"')
  expect(policy).toContain('"features/ondo/identity-b/account-save-gate-b.tsx"')
  expect(policy).toContain('"features/ondo/identity-b/account-save-gate-b.module.css"')
})
