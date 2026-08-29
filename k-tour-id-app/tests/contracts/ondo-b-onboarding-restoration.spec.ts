import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const appRoot = process.cwd()
const source = (path: string) => readFileSync(resolve(appRoot, path), "utf8")

test("B-ONBOARDING-RESTORE-001 production B owns a three-step guest onboarding contract", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")

  expect(onboarding).toContain('type Step = "value" | "intent" | "preferences"')
  expect(onboarding).toContain('id: "travelling"')
  expect(onboarding).toContain('id: "preparing"')
  expect(onboarding).toContain('id: "local_contributor"')
  expect(onboarding).toContain('data-testid="onboarding-step-intent"')
  expect(onboarding).toContain('data-testid="onboarding-step-preferences"')
  expect(onboarding).toContain('data-testid="onboarding-finish"')
  expect(onboarding).toContain("Set guest preferences")
  expect(onboarding).toContain("Explore without setup")
  expect(onboarding).toContain("건너뛰고 탐색")
})

test("B-ONBOARDING-RESTORE-002 source truth and dietary boundaries remain in both languages", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const options = source("features/ondo/shared/state/ondo-b-preferences.ts")

  for (const truth of ["LOCALDATA", "200", "Aug 19, 2026", "2026년 8월 19일", "2026年8月19日"]) {
    expect(onboarding).toContain(truth)
  }
  expect(onboarding).not.toContain("400 official")
  expect(onboarding).toContain("Official records do not confirm dietary support")
  expect(onboarding).toContain("공식 기록은 식이 요구사항 지원 여부를 확인하지 않습니다")
  for (const preference of ["classic", "cafe", "late", "lively", "calm", "vegetarian", "vegan", "halal", "allergy_aware"]) {
    expect(options).toContain(`id: "${preference}"`)
  }
})

test("B-ONBOARDING-RESTORE-003 onboarding state is a local-device allowlist with a real reset", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const preferences = source("features/ondo/shared/state/ondo-b-preferences.ts")
  const settings = source("features/ondo/settings/settings-entry-b.tsx")

  expect(preferences).toContain('export type OndoBPersona = "travelling" | "preparing" | "local_contributor"')
  expect(provider).toContain("persona: OndoBPersona | null")
  expect(provider).toContain("setLocale(locale: OndoBLocale): boolean")
  expect(provider).toContain("setPersona(persona: OndoBPersona): boolean")
  expect(provider).toContain("completeOnboarding(preferences: OndoBDiscoveryPreference[]): boolean")
  expect(provider).toContain("resetOnboarding(): boolean")
  expect(provider).toContain("persona: ONDO_B_PERSONAS.has(record.persona as OndoBPersona)")
  expect(settings).toContain("actions.resetOnboarding()")

  const deviceTypeStart = provider.indexOf("type OndoBDeviceState")
  const deviceType = provider.slice(deviceTypeStart, provider.indexOf("\n}", deviceTypeStart) + 2)
  expect(deviceType).toContain("persona")
  expect(deviceType).not.toMatch(/account:|person:|age:|paymentKyc:|gate:|provider:/)
})

test("B-ONBOARDING-RESTORE-004 optional identity never gates or auto-starts the guest journey", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const product = source("features/ondo/app/ondo-product-b.tsx")
  const policy = source("scripts/ondo-b-standalone/policy.mjs")

  expect(onboarding).toContain('data-testid="k-tour-id-setup-open"')
  expect(onboarding).toContain('onClick={() => actions.openIdentitySetup("onboarding")}')
  expect(onboarding).toContain('data-testid="onboarding-guest-skip"')
  expect(onboarding).not.toMatch(/GateOverlay|After19|Checkout|sessionStorage|setTimeout|URLSearchParams|services\/|provider:/i)
  expect(product).toContain("OfficialDirectoryOnboardingLayer")
  expect(product).not.toContain('from "../onboarding/onboarding-layer"')
  expect(policy).not.toMatch(/\(\?:\^\|\[\^A-Za-z0-9\]\|_\)persona/)
})
