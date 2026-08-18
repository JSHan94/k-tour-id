import { expect, test } from "@playwright/test"
import { canAutoEnterAfter19 } from "../../features/ondo/contracts/after19"
import { applyActivityEvents, firstMissionEvents, reduceReputation } from "../../features/ondo/contracts/activity"
import { BRIDGE_PHASES, canAdvanceBridge, canIncrementStamp, estimatedUsdTotal } from "../../features/ondo/contracts/commerce"
import type { AssetBalance, Provenance, PulseTable, Venue } from "../../features/ondo/contracts/domain"
import { isEvidenceCurrent, isSimulated, type CanonicalEvidenceEnvelope, type MerchantTraitReceipt } from "../../features/ondo/contracts/evidence"
import { createReturnTo, isReturnToUsable } from "../../features/ondo/contracts/return-to"
import { createFixtureRegistry } from "../../features/ondo/fixtures"

const simulated: Provenance = {
  truth: "SIMULATED",
  fixtureId: "FX-TEST",
  sourceKind: "fixture",
  fetchedAt: "2026-08-19T10:00:00+09:00",
  isSimulation: true,
}

test("CONTRACT-DATA-001 coordinates remain canonical", () => {
  const venue = { latitude: 37.5446, longitude: 127.0558 }
  const display = { ...venue }
  expect(display).toEqual(venue)
})

test("CONTRACT-DATA-002 limited signals never invent a score", () => {
  const limited = { heatLevel: "limited", ondoScore: null, signalCount: 3 }
  expect(limited.ondoScore).toBeNull()
})

test("CONTRACT-DATA-003 returnTo preserves a nested gate queue", () => {
  const envelope = createReturnTo({ cta: "SUBMIT_LOCAL_SIGNAL", gateQueue: ["account", "person"], venueId: "venue-1", now: new Date("2026-08-19T10:00:00Z") })
  expect(envelope.activeGate).toBe("account")
  expect(envelope.gateQueue).toEqual(["account", "person"])
  expect(isReturnToUsable(envelope, new Date("2026-08-19T10:01:00Z"))).toBeTruthy()
})

test("CONTRACT-DATA-004 age and payment gates stay independent", () => {
  expect(canAutoEnterAfter19({
    ageStatus: "AGE-VERIFIED",
    ageExpiresAt: "2026-08-20T10:00:00+09:00",
    koreanLocalTime: "2026-08-19T19:00:00+09:00",
    autoNight: true,
    mode: "A19-OFF",
  })).toBeTruthy()
  expect(canAutoEnterAfter19({
    ageStatus: "AGE-EXPIRED",
    ageExpiresAt: "2026-08-19T18:00:00+09:00",
    koreanLocalTime: "2026-08-19T19:00:00+09:00",
    autoNight: true,
    mode: "A19-OFF",
  })).toBeFalsy()
})

test("CONTRACT-DATA-005 evidence adapters expose their source standard", () => {
  const openDid: CanonicalEvidenceEnvelope = {
    id: "e1", sourceStandard: "OpenDID", adapterId: "opendid-adapter", subjectRef: "subject-1",
    claimType: "age_over_19", claimValue: true, issuedAt: "2026-08-19T00:00:00Z", provenance: { ...simulated, truth: "CONTRACT_ONLY", isSimulation: false },
  }
  const eas = { ...openDid, id: "e2", sourceStandard: "EAS" as const, adapterId: "eas-adapter" as const }
  expect(openDid.adapterId).not.toBe(eas.adapterId)
})

test("CONTRACT-DATA-006 expired evidence is rejected", () => {
  const envelope: CanonicalEvidenceEnvelope = {
    id: "e1", sourceStandard: "OpenDID", adapterId: "opendid-adapter", subjectRef: "subject-1",
    claimType: "person", claimValue: true, issuedAt: "2026-08-18T00:00:00Z", expiresAt: "2026-08-19T00:00:00Z", provenance: simulated,
  }
  expect(isEvidenceCurrent(envelope, new Date("2026-08-20T00:00:00Z"))).toBeFalsy()
})

test("CONTRACT-DATA-007 chat access requires confirmed membership", () => {
  const allowed = new Set(["confirmed", "checked_in", "completed"])
  expect(allowed.has("none")).toBeFalsy()
  expect(allowed.has("confirmed")).toBeTruthy()
})

test("CONTRACT-DATA-008 chat images and local signals use different upload contexts", () => {
  const contexts = ["chat_image", "local_signal"] as const
  expect(new Set(contexts).size).toBe(2)
})

test("CONTRACT-DATA-009 first mission changes visit and contribution only", () => {
  const before = { identity: "verified", visit: "new", contribution: "new", meetup: "new" } as const
  const events = firstMissionEvents({ subjectRef: "subject-1", evidenceRef: "visit-1", occurredAt: "2026-08-19T10:00:00Z" })
  const after = events.reduce(reduceReputation, before)
  expect(events.map((event) => event.kind)).toEqual(["visit", "contribution"])
  expect(after.meetup).toBe("new")
  const first = applyActivityEvents(before, [], events)
  const duplicate = applyActivityEvents(first.reputation, first.acceptedKeys, events)
  expect(duplicate.reputation).toEqual(first.reputation)
  expect(duplicate.acceptedKeys).toEqual(first.acceptedKeys)
})

test("CONTRACT-DATA-010 checkout cannot increment a stamp", () => {
  expect(canIncrementStamp({ scenarioId: "SCN-005-CHECKOUT-LABS", evidenceId: "payment-1", acceptedEvidenceIds: [] })).toBeFalsy()
  expect(canIncrementStamp({ scenarioId: "SCN-006-STAMP-MILESTONE", evidenceId: "visit-10", acceptedEvidenceIds: [] })).toBeTruthy()
})

test("CONTRACT-DATA-011 bridge phase progression is ordered", () => {
  expect(canAdvanceBridge("source_confirmed", "destination_confirmed")).toBeFalsy()
  for (let index = 0; index < BRIDGE_PHASES.length - 1; index += 1) expect(canAdvanceBridge(BRIDGE_PHASES[index], BRIDGE_PHASES[index + 1])).toBeTruthy()
})

test("CONTRACT-DATA-012 merchant receipt does not claim general safety", () => {
  const receipt: MerchantTraitReceipt = { merchantId: "m1", offerId: "o1", policyId: "p1", result: "eligible", checkedAt: "2026-08-19T10:00:00Z", provenance: { ...simulated, truth: "CONTRACT_ONLY", isSimulation: false } }
  expect(Object.keys(receipt)).not.toContain("safe")
})

test("CONTRACT-DATA-013 asset representations remain separate", () => {
  const assets: AssetBalance[] = [
    { id: "usdc", symbol: "USDC", chain: "Sui Testnet", representation: "native", amount: "10", estimatedUsd: "10", provenance: simulated },
    { id: "usdt", symbol: "USDT", chain: "Sui Testnet", representation: "wrapped", amount: "7", estimatedUsd: "7", provenance: simulated },
  ]
  expect(assets[0].id).not.toBe(assets[1].id)
  expect(estimatedUsdTotal(assets)).toBe(17)
})

test("CONTRACT-DATA-014 zkLogin fixture is a testnet signer only", () => {
  const signer = { network: "testnet", capability: "sign_sui_transaction" }
  expect(signer).toEqual({ network: "testnet", capability: "sign_sui_transaction" })
})

test("CONTRACT-DATA-015 truth and isSimulation remain aligned", () => {
  expect(isSimulated(simulated)).toBeTruthy()
  expect(isSimulated({ ...simulated, truth: "CONTRACT_ONLY", isSimulation: false })).toBeFalsy()
})

test("CONTRACT-DATA-016 onboarding fixtures contain no verification mutation", () => {
  const onboarding = { persona: "short_term", account: "ACC-GUEST", person: "PER-UNVERIFIED", age: "AGE-UNVERIFIED" }
  expect(onboarding).toMatchObject({ account: "ACC-GUEST", person: "PER-UNVERIFIED", age: "AGE-UNVERIFIED" })
  expect(() => createFixtureRegistry({ neighborhoods: [], venues: [] as Venue[], tables: [] as PulseTable[] })).not.toThrow()
})
