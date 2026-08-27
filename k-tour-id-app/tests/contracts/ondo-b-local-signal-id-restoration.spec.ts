import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("B-P0-SIGNAL-001 canonical place owns a B-native Local Signal entry and exact in-memory draft return", () => {
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(place).toContain("actions.openLocalSignal(currentVenueId)")
  expect(place).toContain('data-testid="canonical-local-signal-open"')
  expect(signal).toContain('data-testid="ondo-b-local-signal"')
  expect(signal).toContain('data-testid="local-signal-draft"')
  expect(signal).toContain('data-testid="local-signal-person-check"')
  expect(provider).toContain("localSignalDraft: OndoBLocalSignalDraft | null")
  expect(provider).toContain("openLocalSignal(venueId: string): void")
  expect(provider).toContain("updateLocalSignalDraft")
  expect(provider).toContain("closeLocalSignal(): void")
})

test("B-P0-SIGNAL-002 the local walkthrough is truthful, consentful, synchronous, and covers every return", () => {
  const walkthrough = source("features/ondo/identity-b/local-check-walkthrough-b.tsx")

  for (const field of ["requester", "purpose", "minimum", "retention", "decline"]) {
    expect(walkthrough).toContain(`${field}:`)
  }
  for (const outcome of ['"success"', '"cancel"', '"failure"', '"unavailable"', '"expired"']) {
    expect(walkthrough).toContain(outcome)
  }
  expect(walkthrough).toContain("No identity provider is connected and no credential is created")
  expect(walkthrough).toContain("연결된 신원 공급자나 생성되는 자격증명은 없습니다")
  expect(walkthrough).toContain("No name, document, birth date, profile, or credential is saved")
  expect(walkthrough).toContain("useModalIsolation")
  expect(walkthrough).not.toMatch(/setTimeout|fetch\(|XMLHttpRequest|WebSocket|URLSearchParams|crypto\.|Math\.random|Date\.now/)
  expect(walkthrough).not.toMatch(/from\s+["'][^"']*(?:identity\/identity-entry|identity\/gate-overlay|ondo-provider|services\/mock|mock-data)/)
})

test("B-P0-ID-001 Traveler ID presents Person and 19+ as independent local walkthrough semantics", () => {
  const identity = source("features/ondo/identity-b/traveler-id-entry-b.tsx")

  expect(identity).toContain('data-testid="ondo-b-traveler-id"')
  expect(identity).toContain('data-testid="traveler-id-person"')
  expect(identity).toContain('data-testid="traveler-id-age"')
  expect(identity).toContain("Person does not prove 19+")
  expect(identity).toContain("19+ does not prove identity")
  expect(identity).toContain("본인 확인은 19+를 증명하지 않습니다")
  expect(identity).toContain("19+는 본인을 증명하지 않습니다")
})

test("B-P0-DATA-001 only coarse posted-signal/device fields cross the device persistence boundary", () => {
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const myKoreaModel = source("features/ondo/my/my-korea-model.ts")
  const deviceTypeStart = provider.indexOf("type OndoBDeviceState")
  const deviceType = provider.slice(deviceTypeStart, provider.indexOf("\n}", deviceTypeStart) + 2)
  const persistenceStart = provider.indexOf("function restoreBDeviceState")
  const devicePersistence = provider.slice(persistenceStart, provider.indexOf("export type BAccountSessionState", persistenceStart))

  expect(deviceType).toContain("localSignalPostedVenueIds: string[]")
  expect(deviceType).toContain("localInteractionBoundarySeen: boolean")
  expect(deviceType).not.toMatch(/localSignalDraft|personCheck|ageCheck|claim|credential|did|profile|raw|outcome/i)
  expect(provider).toContain("sanitizeLocalSignalVenueIds(record.localSignalPostedVenueIds)")
  expect(myKoreaModel).toContain("return sanitizeCanonicalVenueIds(value).slice(0, MY_KOREA_HISTORY_LIMIT)")
  expect(devicePersistence).not.toMatch(/sessionStorage|URLSearchParams/)
})

test("B-P0-PACKAGE-001 standalone policy positively includes required B-native journeys and still bans legacy providers", () => {
  const policy = source("scripts/ondo-b-standalone/policy.mjs")

  expect(policy).toContain('"features/ondo/identity-b/local-check-walkthrough-b.tsx"')
  expect(policy).toContain('"features/ondo/identity-b/traveler-id-entry-b.tsx"')
  expect(policy).toContain('"features/ondo/local-signal-b/local-signal-layer-b.tsx"')
  expect(policy).toContain('"features/ondo/commerce-b/id-wallet-commerce-b.tsx"')
  expect(policy).toContain('"features/ondo/commerce-b/id-wallet-commerce-b.module.css"')
  expect(policy).toContain("B_NATIVE_INTERACTIVE_FILES")
  expect(policy).toContain("LEGACY_ARTIFACT_PATH")
  expect(policy).not.toContain("BANNED_ARTIFACT_PATH")
  expect(policy).toMatch(/KYC|WalletProvider|blockchain|mock-data/)
  expect(policy).toContain("REQUIRED_B_NATIVE_COMMERCE_FILES")
})
