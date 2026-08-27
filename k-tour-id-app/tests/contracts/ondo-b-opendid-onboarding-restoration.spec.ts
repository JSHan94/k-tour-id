import { expect, test } from "@playwright/test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = process.cwd()
const source = (path: string) => {
  const absolute = resolve(root, path)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : ""
}

const setup = source("features/ondo/identity-b/ktour-id-setup-b.tsx")
const model = source("features/ondo/identity-b/ktour-id-setup-model-b.ts")
const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
const product = source("features/ondo/app/ondo-product-b.tsx")

test("OPENDID-B-001 restores the three truthful identity routes without provider substitution", () => {
  expect(setup).toContain('"mobile_id"')
  expect(setup).toContain('"mobile_residence_card"')
  expect(setup).toContain('"passport_ekyc"')
  expect(setup).toContain("OmniOne CX")
  expect(setup).toContain("Passport eKYC")
  expect(setup).toContain("NFC / OCR")
  expect(setup).toContain("face and liveness")
  expect(setup).toContain("OpenDID")
  expect(setup).toContain("KTourVisitorCredential")

  expect(setup).toContain("Passport eKYC uses a separate provider — not OmniOne CX")
  expect(setup).toContain("K-Tour ID is a private service credential — not a government ID, visa, or residence permit")
  expect(setup).not.toContain("Issuer: OmniOne")
  expect(setup).not.toContain("Recorded on OmniOne")
})

test("OPENDID-B-002 every route is visibly simulated and never performs identity network or sensitive storage", () => {
  expect(setup).toContain("SIMULATED")
  expect(setup).toContain("No request is sent to an identity provider")
  expect(setup).toContain("K-Tour ID Demo Issuer")
  expect(setup).toContain("No passport image, NFC data, face image, name, document number, or credential is saved")

  expect(setup).not.toMatch(/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|FormData)\s*\(/)
  expect(setup).not.toMatch(/(?:localStorage|sessionStorage)\.(?:setItem|getItem)/)
  expect(model).not.toMatch(/passport(?:Number|Image)|face(?:Image|Template)|birthDate|residentNumber/i)

  const deviceState = provider.slice(provider.indexOf("type OndoBDeviceState"), provider.indexOf("const B_DEVICE_KEY"))
  expect(deviceState).not.toMatch(/identitySetup|identityCredential|passport|face|liveness|issuerDid|credentialId/)
})

test("OPENDID-B-003 guest Explore remains primary and setup is an optional branch in both entry points", () => {
  expect(onboarding).toContain('data-testid="onboarding-ktour-id-open"')
  expect(onboarding).toContain("actions.openIdentitySetup(\"onboarding\")")
  expect(onboarding).toContain('data-testid="onboarding-finish"')
  expect(onboarding).toContain("actions.skipOnboarding()")
  expect(onboarding).toContain("actions.completeOnboarding(preferences)")

  expect(traveler).toContain('data-testid="traveler-id-ktour-id-open"')
  expect(traveler).toContain('data-testid="traveler-id-credential"')
  expect(traveler).toContain("actions.openIdentitySetup(\"traveler_id\")")
  expect(product).toContain("<KTourIdSetupB")
})

test("OPENDID-B-004 setup owns explicit progress, recovery, return and focus states", () => {
  for (const contract of [
    'data-testid="ondo-b-ktour-id-setup"',
    'data-testid="ktour-id-route-mobile-id"',
    'data-testid="ktour-id-route-residence-card"',
    'data-testid="ktour-id-route-passport"',
    'data-testid="ktour-id-mobile-handoff"',
    'data-testid="ktour-id-passport-document"',
    'data-testid="ktour-id-passport-face"',
    'data-testid="ktour-id-opendid-issue"',
    'data-testid="ktour-id-setup-failure"',
    'data-testid="ktour-id-setup-unavailable"',
    'data-testid="ktour-id-setup-expired"',
    'data-testid="ktour-id-result"',
    'aria-modal="true"',
    "useModalIsolation",
    "Escape",
    "requestAnimationFrame",
  ]) expect(setup).toContain(contract)

  expect(model).toContain("expiresAt")
  expect(model).toContain("issuedAt")
  expect(model).toContain("10 * 60 * 1000")
  expect(provider).toContain("openIdentitySetup")
  expect(provider).toContain("closeIdentitySetup")
  expect(provider).toContain("completeIdentitySetup")
})

test("OPENDID-B-005 Account, Person, 19+, identity credential and Payment remain independent", () => {
  expect(traveler).toContain('data-testid="traveler-id-account"')
  expect(traveler).toContain('data-testid="traveler-id-person"')
  expect(traveler).toContain('data-testid="traveler-id-age"')
  expect(traveler).toContain('data-testid="traveler-id-credential"')
  expect(traveler).toContain('data-testid="traveler-id-payment"')
  expect(setup).toContain("does not complete Person, 19+, Account, or Payment")
  expect(provider).not.toMatch(/completeIdentitySetup[\s\S]{0,500}(?:personOutcome|ageOutcome|commerceWalletStatus)/)
})

test("OPENDID-B-006 EN, KO and JA carry equivalent provider and private-credential boundaries", () => {
  expect(setup).toMatch(/const COPY\s*=\s*\{[\s\S]*?en:\s*\{[\s\S]*?ko:\s*\{[\s\S]*?ja:\s*\{/)
  for (const truth of [
    "정부 신분증·비자·체류 허가가 아닌 민간 서비스 자격증명",
    "여권 eKYC는 OmniOne CX가 아닌 별도 제공자",
    "政府の身分証明書、ビザ、在留許可ではない民間サービスの資格情報",
    "パスポートeKYCはOmniOne CXではなく別の事業者",
  ]) expect(setup).toContain(truth)
})

test("OPENDID-B-007 existing B and A product seams remain frozen", () => {
  for (const testId of [
    "ondo-onboarding",
    "onboarding-step-value",
    "onboarding-step-intent",
    "onboarding-step-preferences",
    "travel-pass-card",
    "traveler-id-account",
    "traveler-id-person",
    "traveler-id-age",
    "traveler-id-payment",
  ]) expect(`${onboarding}\n${traveler}`).toContain(testId)

  expect(onboarding).toContain('data-testid={`persona-${persona.id}`}')
  for (const persona of ['id: "travelling"', 'id: "preparing"', 'id: "local_contributor"']) {
    expect(onboarding).toContain(persona)
  }

  expect(product).toContain("<CanonicalPlaceMount />")
  expect(product).toContain("<LocalSignalLayerB />")
  expect(product).toContain("<OfficialDirectoryOnboardingLayer />")
  expect(source("features/ondo/identity/gate-overlay.tsx")).toContain("export function GateOverlay")
})
