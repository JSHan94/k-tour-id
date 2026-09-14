import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const appRoot = process.cwd()
const source = (path: string) => readFileSync(resolve(appRoot, path), "utf8")

test("B-ONBOARDING-RESTORE-001 production B owns a three-step guest onboarding contract", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const intentStep = onboarding.slice(onboarding.indexOf('{step === "intent"'), onboarding.indexOf('{step === "area"'))

  expect(onboarding).toContain('type Step = "intent" | "area" | "preferences"')
  for (const intent of ["short_trip", "nearby", "living"]) expect(onboarding).toContain(`id: "${intent}"`)
  expect(onboarding).toContain('data-testid="onboarding-step-intent"')
  expect(onboarding).toContain('data-testid="onboarding-step-area"')
  expect(onboarding).toContain('data-testid="onboarding-step-preferences"')
  expect(onboarding).toContain('"onboarding-finish"')
  expect(onboarding).toContain("What brings you here?")
  expect(onboarding).toContain("Skip for now")
  expect(onboarding).toContain("건너뛰기")
  expect(onboarding).toContain("スキップ")
  expect(intentStep).not.toMatch(/K-Tour ID|openIdentitySetup|identity provider|OmniOne|eKYC/i)
})

test("B-ONBOARDING-RESTORE-002 source truth stays discoverable while dietary boundaries remain compact in all locales", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const map = source("features/ondo/map/map-entry-b.tsx")
  const options = source("features/ondo/shared/state/ondo-b-preferences.ts")

  for (const truth of ["LOCALDATA", "Aug 19, 2026", "2026. 8. 19.", "2026年8月19日"]) expect(map).toContain(truth)
  expect(onboarding).not.toMatch(/LOCALDATA|Aug 19, 2026|2026년 8월 19일|2026年8月19日/)
  expect(onboarding).not.toContain("400 official")
  expect(onboarding).toContain("Check dietary needs with each place")
  expect(onboarding).toContain("식이 조건은 방문 전 장소에 확인해 주세요")
  expect(onboarding).toContain("食の条件は訪問前に店舗へ確認してください")
  for (const preference of ["classic", "cafe", "late", "lively", "calm", "vegetarian", "vegan", "halal", "allergy_aware"]) {
    expect(options).toContain(`id: "${preference}"`)
  }
})

test("B-ONBOARDING-RESTORE-003 onboarding state is a local-device allowlist with a real reset", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const preferences = source("features/ondo/shared/state/ondo-b-preferences.ts")
  const settings = source("features/ondo/settings/settings-entry-b.tsx")

  expect(preferences).toContain('export type OndoBDiscoveryIntent = "short_trip" | "nearby" | "living"')
  expect(preferences).toContain('export type OndoBLegacyDiscoveryIntent = "travelling" | "preparing" | "local_contributor"')
  expect(preferences).toContain('export type OndoBDiscoveryArea = "seoul" | "busan" | "jeju" | null')
  expect(preferences).toContain("export type OndoBPersona = OndoBDiscoveryIntent")
  expect(provider).toContain("persona: OndoBPersona | null")
  expect(provider).toContain("discoveryArea: OndoBDiscoveryArea")
  expect(provider).toContain("setLocale(locale: OndoBLocale): boolean")
  expect(provider).toContain("setPersona(persona: OndoBPersona | OndoBLegacyDiscoveryIntent): boolean")
  expect(provider).toContain("completeOnboarding(draft: OndoBOnboardingDraft): OndoBOnboardingCommitResult")
  expect(provider).toContain("resetOnboarding(): boolean")
  expect(provider).toContain("normalizeOndoBDiscoveryIntent(record.persona)")
  expect(provider).toContain("normalizeOndoBDiscoveryArea(record.discoveryArea)")
  expect(settings).toContain("actions.beginOnboarding()")
  expect(settings).not.toContain("actions.resetOnboarding()")

  const deviceTypeStart = provider.indexOf("type OndoBDeviceState")
  const deviceType = provider.slice(deviceTypeStart, provider.indexOf("\n}", deviceTypeStart) + 2)
  expect(deviceType).toContain("persona")
  expect(deviceType).not.toMatch(/account:|person:|age:|paymentKyc:|gate:|provider:/)
})

test("B-ONBOARDING-RESTORE-005 discovery intent is visibly and structurally separate from Person evidence", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const preferences = source("features/ondo/shared/state/ondo-b-preferences.ts")

  expect(preferences).toContain("It is never evidence for the Person axis")
  expect(onboarding).toContain('role="radiogroup" aria-label={copy.intentTitle}')
  expect(onboarding).toContain("actions.completeOnboarding({ intent, area, preferences })")
  expect(onboarding).not.toMatch(/openIdentitySetup|mobile_id|mobile_residence_card|passport_ekyc|OmniOne|registered foreign resident/i)
  expect(onboarding).not.toMatch(/personOutcome|ageOutcome|paymentKyc|commerceWalletStatus/)
})

test("B-ONBOARDING-RESTORE-006 place object permanence survives Table, JIT gate, checkout, and receipt", () => {
  const table = source("features/ondo/connect/tables-entry-b.tsx")
  const gate = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")

  expect(table).toContain('data-testid="table-place-context"')
  // Badge issuance has no place target; every venue-backed action keeps the
  // exact place anchor. The attribute is therefore conditional rather than a
  // misleading unconditional literal.
  expect(gate).toContain('data-place-context={pending.cta === "MINT_BADGE" ? undefined : "venue"}')
  expect(gate).toContain("returnVenueLabel")
  expect(commerce).toContain('data-testid="commerce-place-context"')
  expect(commerce).toContain('data-testid="receipt-place-context"')
  expect(commerce).toContain("venueName")
})

test("B-ONBOARDING-RESTORE-004 onboarding returns both personalized and guest paths directly to Explore", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const product = source("features/ondo/app/ondo-product-b.tsx")
  const policy = source("scripts/ondo-b-standalone/policy.mjs")
  const escapeHandler = onboarding.slice(onboarding.indexOf("const escape = () =>"), onboarding.indexOf("const goBack = () =>"))
  const finishHandler = onboarding.slice(onboarding.indexOf("const finish = () =>"), onboarding.indexOf("const next = () =>"))

  expect(onboarding).not.toContain('data-testid="k-tour-id-setup-open"')
  expect(finishHandler).toContain("actions.completeOnboarding({ intent, area, preferences })")
  expect(finishHandler).toContain("requestBDiscoveryFocus")
  expect(finishHandler).not.toContain("openIdentitySetup")
  expect(escapeHandler).toContain("actions.cancelOnboarding()")
  expect(escapeHandler).toContain("resetMap()")
  expect(escapeHandler).not.toContain("openIdentitySetup")
  expect(onboarding).toContain('data-testid="onboarding-guest-skip"')
  expect(onboarding).not.toMatch(/GateOverlay|After19|Checkout|sessionStorage|URLSearchParams|services\/|provider:/i)
  expect(onboarding).toContain("useSheetPresence")
  expect(onboarding).not.toContain("afterExit")
  expect(product).toContain("OfficialDirectoryOnboardingLayer")
  expect(product).not.toContain('from "../onboarding/onboarding-layer"')
  expect(policy).not.toMatch(/\(\?:\^\|\[\^A-Za-z0-9\]\|_\)persona/)
})
