import { expect, test } from "@playwright/test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  createPresentationRequestB,
  createSimulatedCredentialB,
  isPresentationRequestActiveB,
  isSimulatedCredentialActiveB,
  KTOUR_ID_CREDENTIAL_TTL_MS,
  KTOUR_ID_PRESENTATION_TTL_MS,
  resolvePresentationRequestB,
} from "../../features/ondo/identity-b/ktour-id-setup-model-b"

const root = process.cwd()
const source = (path: string) => {
  const absolute = resolve(root, path)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : ""
}

const setup = source("features/ondo/identity-b/ktour-id-setup-b.tsx")
const passportOcr = source("features/ondo/identity-b/passport-ocr-step-b.tsx")
const model = source("features/ondo/identity-b/ktour-id-setup-model-b.ts")
const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
const product = source("features/ondo/app/ondo-product-b.tsx")
const setupCopy = setup.slice(setup.indexOf("const COPY"), setup.indexOf("const FOCUSABLE"))

test("OPENDID-B-MODEL-001 credential readiness expires at the exact two-hour boundary", () => {
  const issuedAt = 1_000
  const credential = createSimulatedCredentialB("passport_ekyc", issuedAt)
  expect(isSimulatedCredentialActiveB(credential, issuedAt)).toBe(true)
  expect(isSimulatedCredentialActiveB(credential, issuedAt + KTOUR_ID_CREDENTIAL_TTL_MS - 1)).toBe(true)
  expect(isSimulatedCredentialActiveB(credential, issuedAt + KTOUR_ID_CREDENTIAL_TTL_MS)).toBe(false)
})

test("OPENDID-B-MODEL-002 presentation nonce expires and can be consumed only once", () => {
  const issuedAt = 5_000
  const request = createPresentationRequestB(issuedAt, "nonce:contract")
  expect(request.nonce).toBe("nonce:contract")
  expect(isPresentationRequestActiveB(request, issuedAt + KTOUR_ID_PRESENTATION_TTL_MS - 1)).toBe(true)

  const approved = resolvePresentationRequestB(request, "approve", issuedAt + 1)
  expect(approved).toMatchObject({ approved: true, code: null })
  expect(approved.request.consumedAt).toBe(issuedAt + 1)
  expect(resolvePresentationRequestB(approved.request, "approve", issuedAt + 2)).toMatchObject({
    approved: false,
    code: "PRESENTATION_REPLAY",
  })
  expect(resolvePresentationRequestB(createPresentationRequestB(issuedAt), "deny", issuedAt + 1)).toMatchObject({
    approved: false,
    code: "PRESENTATION_DENIED",
  })
  expect(resolvePresentationRequestB(request, "approve", issuedAt + KTOUR_ID_PRESENTATION_TTL_MS)).toMatchObject({
    approved: false,
    code: "PRESENTATION_REQUEST_EXPIRED",
  })
})

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
  expect(setup).toContain("Private K-Tour service credential · no identity provider or OpenDID service is connected, so no real DID or VC is issued")
  expect(setup).not.toContain("Issuer: OmniOne")
  expect(setup).not.toContain("Recorded on OmniOne")
})

test("OPENDID-B-002 every route has one on-device boundary and never performs identity network or sensitive storage", () => {
  expect(`${setup}\n${passportOcr}`).not.toContain("SIMULATED")
  expect(setup).toContain("No identity provider or OpenDID service is connected")
  expect(setup).toContain("ONDO K-Tour ID")
  expect(setup).toContain("No Mobile ID payload, name, birth date, signed callback or provider result is stored")
  expect(setup).toContain("No residence-card payload, name, birth date, signed callback or provider result is stored")
  expect(setup).toContain("No passport fields, face image, provider result, DID or VC payload is stored")
  expect(setup).toContain('details.retention, "identity-consent-retention"')
  expect(passportOcr).toContain("No filename, image or metadata is saved or sent")

  expect(`${setup}\n${passportOcr}`).not.toMatch(/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|FormData)\s*\(/)
  expect(`${setup}\n${passportOcr}`).not.toMatch(/(?:localStorage|sessionStorage)\.(?:setItem|getItem)/)
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
    "ondo-b-ktour-id-setup",
    "ktour-id-route-mobile-id",
    "ktour-id-route-residence-card",
    "ktour-id-route-passport",
    "ktour-id-mobile-handoff",
    "ktour-id-passport-document",
    "ktour-id-passport-face",
    "ktour-id-opendid-issue",
    "ktour-id-setup-failure",
    "ktour-id-setup-unavailable",
    "ktour-id-setup-expired",
    "ktour-id-result",
    'aria-modal="true"',
    "useModalIsolation",
    "Escape",
    "requestAnimationFrame",
  ]) expect(`${setup}\n${passportOcr}`).toContain(contract)

  expect(model).toContain("expiresAt")
  expect(model).toContain("issuedAt")
  expect(model).toContain("10 * 60 * 1000")
  expect(provider).toContain("openIdentitySetup")
  expect(provider).toContain("closeIdentitySetup")
  expect(provider).toContain("completeIdentitySetup")
  expect(setup).toContain('actions.setCommerceWalletStatus("ready")')
  expect(setup).toContain('data-wallet-provisioning="aa-assumed-local"')
})

test("OPENDID-B-005 Account, Person, 19+, identity credential and Payment remain independent", () => {
  expect(traveler).toContain('data-testid="traveler-id-account"')
  expect(traveler).toContain('data-testid="traveler-id-person"')
  expect(traveler).toContain('data-testid="traveler-id-age"')
  expect(traveler).toContain('data-testid="traveler-id-credential"')
  expect(traveler).toContain('data-testid="traveler-id-payment"')
  expect(setup).toContain("does not complete Person, 19+, Account, or Payment")
  const completion = provider.slice(provider.indexOf("completeIdentitySetup:"), provider.indexOf("acknowledgeCommerceLocalBoundary:"))
  expect(completion).not.toMatch(/personOutcome|ageOutcome|commerceWalletStatus|account/)
})

test("OPENDID-B-006 EN, KO and JA carry equivalent provider and private-credential boundaries", () => {
  expect(setup).toMatch(/const COPY\s*=\s*\{[\s\S]*?en:\s*\{[\s\S]*?ko:\s*\{[\s\S]*?ja:\s*\{/)
  for (const truth of [
    "민간 K-Tour 서비스 자격증명 · 신원확인 기관과 OpenDID 서비스가 연결되지 않아 실제 DID·VC를 발급하지 않습니다",
    "여권 eKYC는 OmniOne CX가 아닌 별도 제공자",
    "民間のK-Tourサービス資格情報 · 本人確認事業者とOpenDIDサービスは未接続のため、実際のDID・VCは発行しません",
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

test("OPENDID-B-008 freezes the complete consent-to-presentation state machine", () => {
  for (const phase of [
    '"method_select"',
    '"consent"',
    '"route_prepare"',
    '"cx_handoff_preview"',
    '"document_preview"',
    '"face_liveness_preview"',
    '"provider_processing_preview"',
    '"evidence_preview"',
    '"issuance_preview"',
    '"holder_delivery_preview"',
    '"credential_ready"',
    '"presentation_request"',
    '"presentation_consent"',
    '"presentation_result"',
  ]) expect(setup).toContain(phase)

  for (const testId of [
    "k-tour-id-setup",
    "k-tour-id-environment",
    "k-tour-id-private-boundary",
    "k-tour-id-methods",
    "k-tour-id-method-mobile-id",
    "k-tour-id-method-mobile-residence-card",
    "k-tour-id-method-passport-ekyc",
    "k-tour-id-consent",
    "identity-consent-requester",
    "identity-consent-purpose",
    "identity-consent-provider",
    "identity-consent-evidence",
    "identity-consent-retention",
    "identity-consent-wallet",
    "k-tour-id-route-step",
    "k-tour-id-evidence-preview",
    "k-tour-id-issuance-preview",
    "k-tour-id-holder-delivery",
    "k-tour-id-credential",
    "k-tour-id-presentation-request",
    "k-tour-id-presentation-consent",
    "k-tour-id-presentation-result",
    "k-tour-id-failure",
    "k-tour-id-unavailable",
    "k-tour-id-expired",
    "k-tour-id-retry",
    "k-tour-id-cancel",
    "k-tour-id-return",
    "passport-ocr-input",
    "passport-ocr-start",
    "passport-ocr-processing",
    "passport-ocr-review",
  ]) expect(`${setup}\n${passportOcr}`).toContain(testId)
})

test("OPENDID-B-009 keeps the internal environment contract and presents concise on-device truth in three locales", () => {
  for (const truth of [
    'env: "ON-DEVICE"',
    'envDetail: "No identity provider or OpenDID service is connected."',
    "Private K-Tour service credential · no identity provider or OpenDID service is connected, so no real DID or VC is issued.",
    'env: "기기 내"',
    'envDetail: "신원확인 기관이나 OpenDID 서비스에 연결하지 않습니다."',
    "민간 K-Tour 서비스 자격증명 · 신원확인 기관과 OpenDID 서비스가 연결되지 않아 실제 DID·VC를 발급하지 않습니다.",
    'env: "端末内"',
    'envDetail: "本人確認事業者やOpenDIDサービスには接続しません。"',
    "民間のK-Tourサービス資格情報 · 本人確認事業者とOpenDIDサービスは未接続のため、実際のDID・VCは発行しません。",
  ]) expect(setup).toContain(truth)

  expect(setup).toContain('data-environment="simulated"')
  expect(setup).toContain('data-integration-status="not_configured"')
  expect(`${setup}\n${passportOcr}`).not.toMatch(/navigator\.(?:mediaDevices|credentials)|NDEFReader|showOpenFilePicker/)
  expect(passportOcr).toContain('type="file"')
  expect(passportOcr).toContain('accept="image/jpeg,image/png,image/webp"')
  expect(passportOcr).toContain('capture="environment"')
})

test("OPENDID-B-014 consent is route-specific, discloses local wallet preparation, and keeps protocol detail progressive", () => {
  expect(setup).toContain("mobileRetention")
  expect(setup).toContain("residenceRetention")
  expect(setup).toContain("passportRetention")
  expect(setup).not.toMatch(/mobileRetention:\s*"[^"]*(?:image|이미지|画像)/i)
  expect(setup).not.toMatch(/residenceRetention:\s*"[^"]*(?:image|이미지|画像)/i)
  expect(setup).toContain("After K-Tour ID is ready, ONDO prepares a device-only travel balance in this tab")
  expect(setup).toContain("K-Tour ID 준비가 끝나면 ONDO가 이 탭에 기기 전용 여행 잔액을 준비합니다")
  expect(setup).toContain("K-Tour IDの準備後、ONDOがこのタブに端末専用の旅行残高を用意します")
  expect(setup).toContain('<details className={styles.protocolDetails}>')
  expect(setup).toContain('<p data-testid="k-tour-id-technical-truth">')
  expect(setup).not.toContain('<span className={styles.contractOnly} data-testid="k-tour-id-technical-truth">')
  expect(setupCopy).not.toMatch(/\b(?:walkthrough|preview|simulated|test)\b/i)
  expect(traveler).not.toContain("Test wallet")
  expect(traveler).not.toContain("테스트 지갑")
  expect(traveler).not.toContain("テストウォレット")
})

test("OPENDID-B-015 official K-Tour ID source assets stay inside identity contexts", () => {
  for (const asset of [
    "public/brand/ktour-id-lockup-transparent.png",
    "public/brand/ktour-id-mark.png",
    "public/brand/ktour-id-mark-32.png",
  ]) expect(existsSync(resolve(root, asset))).toBe(true)
  expect(setup).toContain('/brand/ktour-id-lockup-transparent.png')
  expect(setup).toContain('/brand/ktour-id-mark.png')
  expect(traveler).toContain('/brand/ktour-id-mark-32.png')
  expect(setup).toContain('data-testid="k-tour-id-brand-lockup"')
})

test("OPENDID-B-010 freezes deterministic recovery, credential status, and one-shot guards", () => {
  for (const code of [
    "IDENTITY_METHOD_UNAVAILABLE",
    "CONSENT_DECLINED",
    "DOCUMENT_PERMISSION_DENIED",
    "PASSPORT_NFC_UNSUPPORTED",
    "PASSPORT_READ_FAILED",
    "UNSUPPORTED_DOCUMENT",
    "DOCUMENT_AUTH_FAILED",
    "FACE_MISMATCH",
    "LIVENESS_FAILED",
    "RETRY_LIMIT_REACHED",
    "MANUAL_REVIEW_REQUIRED",
    "PROVIDER_TIMEOUT",
    "CALLBACK_INVALID",
    "IDENTITY_SESSION_EXPIRED",
    "ISSUER_UNAVAILABLE",
    "CREDENTIAL_ISSUANCE_FAILED",
    "HOLDER_DELIVERY_FAILED",
    "CREDENTIAL_EXPIRED",
    "CREDENTIAL_SUSPENDED",
    "CREDENTIAL_REVOKED",
    "PRESENTATION_REQUEST_EXPIRED",
    "PRESENTATION_DENIED",
    "PRESENTATION_REPLAY",
  ]) expect(`${model}\n${setup}`).toContain(code)

  for (const status of ["none", "simulated_ready", "expired", "suspended", "revoked"]) {
    expect(model).toContain(`"${status}"`)
  }
  expect(setup).toContain("issuedOnceRef")
  expect(setup).toContain("readQaRuntime<QaRuntime>()")
})

test("OPENDID-B-011 keeps the five axes independent and identity data out of device persistence", () => {
  const originalActions = [
    "beginOnboarding", "completeOnboarding", "skipOnboarding", "resetOnboarding", "setPersona",
    "setDiscoveryPreferences", "openLocalSignal", "closeLocalSignal", "acknowledgeCommerceLocalBoundary",
    "setCommerceWalletStatus", "dispatchCommerce", "clearBDeviceContent",
  ]
  for (const action of originalActions) expect(provider).toContain(action)

  const deviceState = provider.slice(provider.indexOf("type OndoBDeviceState"), provider.indexOf("const B_DEVICE_KEY"))
  expect(deviceState).not.toMatch(/identity|passport|credential|did|presentation/i)
  expect(provider).toContain('const B_DEVICE_KEY = "ondo-b.device.v1"')
  expect(`${setup}\n${passportOcr}`).not.toMatch(/(?:localStorage|sessionStorage|indexedDB|caches)\./)
})

test("OPENDID-B-013 keeps passport OCR local, bounded, masked and cleanup-owned", () => {
  expect(passportOcr).toContain("12 * 1024 * 1024")
  expect(passportOcr).toContain('new Set(["image/jpeg", "image/png", "image/webp"])')
  expect(passportOcr).toContain("URL.createObjectURL")
  expect(passportOcr).toContain("URL.revokeObjectURL")
  expect(passportOcr).toContain('role="alert"')
  expect(passportOcr).toContain('role="status"')
  expect(passportOcr).toContain('aria-live="polite"')
  expect(passportOcr).toContain('aria-busy={stage === "decoding" || stage === "processing"}')
  for (const truth of ["ON-DEVICE OCR", "기기 내 OCR", "端末内OCR"]) expect(passportOcr).toContain(truth)
  expect(passportOcr).toContain("•••••••• · masked example")
  expect(passportOcr).toContain("Not extracted or retained")
  expect(passportOcr).toContain("No provider decision")
  expect(passportOcr).toContain("No name, passport number, MRZ, birth date, image or metadata continues to the next step")
  expect(passportOcr).not.toMatch(/console\.|FileReader|readAsDataURL|FormData|fetch\s*\(/)
})

test("OPENDID-B-012 keeps onboarding guest-primary and places one compact optional entry", () => {
  expect(onboarding.match(/data-testid="onboarding-step-value"/g) ?? []).toHaveLength(1)
  expect(onboarding.match(/data-testid="k-tour-id-setup-open"/g) ?? []).toHaveLength(1)
  expect(onboarding.indexOf('data-testid="k-tour-id-setup-open"')).toBeGreaterThan(onboarding.indexOf('data-testid="onboarding-step-value"'))
  expect(onboarding.indexOf('data-testid="k-tour-id-setup-open"')).toBeLessThan(onboarding.indexOf('data-testid="onboarding-source-boundary"'))
  expect(onboarding).not.toMatch(/persona[\s\S]{0,300}(?:mobile_id|mobile_residence_card|passport_ekyc)/)
})
