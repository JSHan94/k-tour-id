import { expect, test } from "@playwright/test"
import {
  restoreBDeviceState,
  sanitizeBOnboardingDraft,
} from "../../features/ondo/shared/state/ondo-b-provider"

test("W2-ONB-STATE-001 canonical onboarding draft accepts optional trip area and requires nearby/living area", () => {
  expect(sanitizeBOnboardingDraft({ intent: "short_trip", area: null, preferences: ["classic"] })).toEqual({
    intent: "short_trip",
    area: null,
    preferences: ["classic"],
  })
  expect(sanitizeBOnboardingDraft({ intent: "nearby", area: null, preferences: [] })).toBeNull()
  expect(sanitizeBOnboardingDraft({ intent: "living", area: "jeju", preferences: ["calm", "halal"] })).toEqual({
    intent: "living",
    area: "jeju",
    preferences: ["calm", "halal"],
  })
  expect(sanitizeBOnboardingDraft({ intent: "living", area: "elsewhere", preferences: [] })).toBeNull()
  expect(sanitizeBOnboardingDraft({ intent: "nearby", area: "seoul", preferences: ["invented"] })).toBeNull()
})

test("W2-ONB-STATE-002 legacy discovery values migrate only where meaning is unambiguous", () => {
  expect(restoreBDeviceState({ onboarding: "ONB-COMPLETE", persona: "travelling" })).toMatchObject({
    onboarding: "ONB-COMPLETE",
    persona: "short_trip",
    discoveryArea: null,
  })
  expect(restoreBDeviceState({ onboarding: "ONB-COMPLETE", persona: "preparing" })).toMatchObject({
    onboarding: "ONB-COMPLETE",
    persona: "short_trip",
  })
  expect(restoreBDeviceState({ onboarding: "ONB-COMPLETE", persona: "local_contributor" })).toMatchObject({
    onboarding: "ONB-NEW",
    persona: null,
  })
})

test("W2-ONB-STATE-003 a location-shaped intent without an area fails closed to re-selection", () => {
  expect(restoreBDeviceState({ onboarding: "ONB-COMPLETE", persona: "nearby", discoveryArea: null })).toMatchObject({
    onboarding: "ONB-NEW",
    persona: "nearby",
    discoveryArea: null,
  })
  expect(restoreBDeviceState({ onboarding: "ONB-COMPLETE", persona: "living", discoveryArea: "busan" })).toMatchObject({
    onboarding: "ONB-COMPLETE",
    persona: "living",
    discoveryArea: "busan",
  })
})

test("W2-ONB-STATE-004 onboarding persistence remains a discovery-only allowlist", () => {
  const restored = restoreBDeviceState({
    onboarding: "ONB-COMPLETE",
    persona: "nearby",
    discoveryArea: "seoul",
    discoveryPreferences: ["cafe"],
    account: "ACC-ACTIVE",
    person: "PER-VERIFIED",
    age: "AGE-VERIFIED",
    payment: "ready",
    identityCredential: { forged: true },
  })
  expect(restored).toMatchObject({
    onboarding: "ONB-COMPLETE",
    persona: "nearby",
    discoveryArea: "seoul",
    discoveryPreferences: ["cafe"],
  })
  expect(restored).not.toHaveProperty("account")
  expect(restored).not.toHaveProperty("person")
  expect(restored).not.toHaveProperty("age")
  expect(restored).not.toHaveProperty("payment")
  expect(restored).not.toHaveProperty("identityCredential")
})
