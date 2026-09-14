import { expect, test } from "@playwright/test"
import {
  canAutoOpenGlobalAfter19B,
  completeGlobalAfter19LocalConfirmationB,
  completeGlobalAfter19ReviewB,
  GLOBAL_AFTER19_AGE_TTL_MS,
  GLOBAL_AFTER19_PREFERENCE_KEY,
  GLOBAL_AFTER19_SESSION_EVENT,
  GLOBAL_AFTER19_SESSION_KEY,
  isGlobalAfter19AgeCurrent,
  isGlobalAfter19NightViewCurrent,
  recordGlobalAfter19ReviewEligibilityB,
  restoreGlobalAfter19B,
  sanitizeGlobalAfter19Session,
  type GlobalAfter19PreferenceB,
  type GlobalAfter19SessionB,
} from "../../features/ondo/after19/after19-global-b-model"
import { createReviewFixtureAuthority, localActual, providerUnavailable, reviewFixture } from "../../features/ondo/contracts/execution-mode"

class MemoryStorage {
  constructor(private readonly values: Record<string, string> = {}) {}
  getItem(key: string) { return this.values[key] ?? null }
}

const NOW = new Date("2026-08-28T11:30:00.000Z") // 20:30 KST

function successfulAgeReview(now = NOW) {
  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-AGE-GLOBAL-001" })
  if (!authority) throw new Error("Review authority fixture was not created")
  return reviewFixture(authority, {
    outcome: "success",
    value: { predicate: "AGE_GTE_19" as const, outcome: "eligible" as const },
    now,
  })
}

test("B-AFTER19-MODEL-001 auto entry requires every KST, preference, age, expiry and manual-off guard", () => {
  const preference: GlobalAfter19PreferenceB = { version: 1, autoOpen: true }
  const eligible: GlobalAfter19SessionB = {
    ...recordGlobalAfter19ReviewEligibilityB(successfulAgeReview(), NOW),
    mode: "off",
  }

  expect(canAutoOpenGlobalAfter19B(preference, eligible, NOW)).toBe(true)
  expect(canAutoOpenGlobalAfter19B({ ...preference, autoOpen: false }, eligible, NOW)).toBe(false)
  expect(canAutoOpenGlobalAfter19B(preference, { ...eligible, mode: "manual-off" }, NOW)).toBe(false)
  expect(canAutoOpenGlobalAfter19B(preference, { ...eligible, age: "unverified", ageExpiresAt: null }, NOW)).toBe(false)
  expect(canAutoOpenGlobalAfter19B(preference, { ...eligible, ageExpiresAt: NOW.toISOString() }, NOW)).toBe(false)
  expect(canAutoOpenGlobalAfter19B(preference, eligible, new Date("2026-08-28T08:59:00.000Z"))).toBe(false)
})

test("B-AFTER19-MODEL-002 current keys are strictly sanitized and never fall through to legacy values", () => {
  const device = new MemoryStorage({
    [GLOBAL_AFTER19_PREFERENCE_KEY]: JSON.stringify({ version: 9, autoOpen: "yes" }),
    "ondo.preferences.v3": JSON.stringify({ autoNight: false }),
  })
  const session = new MemoryStorage({
    [GLOBAL_AFTER19_SESSION_KEY]: JSON.stringify({ version: 1, age: "eligible", ageExpiresAt: "javascript:bad", mode: "on", activation: "auto" }),
    "ondo.session.v3": JSON.stringify({ age: "AGE-VERIFIED", ageExpiresAt: "2099-01-01T00:00:00.000Z", after19: "A19-ON" }),
  })

  const restored = restoreGlobalAfter19B(device, session, NOW)
  expect(restored.preferenceSource).toBe("current")
  expect(restored.sessionSource).toBe("current")
  expect(restored.preference.autoOpen).toBe(true)
  expect(restored.session).toEqual({
    version: 1,
    age: "unverified",
    ageExpiresAt: null,
    eligibilityReceipt: null,
    mode: "off",
    activation: null,
    expiryNotice: true,
  })
})

test("B-AFTER19-MODEL-003 legacy age claims fail closed while manual-off preference survives", () => {
  const restored = restoreGlobalAfter19B(
    new MemoryStorage({ "ondo.preferences.v3": JSON.stringify({ autoNight: false }) }),
    new MemoryStorage({ "ondo.session.v3": JSON.stringify({ age: "AGE-VERIFIED", ageExpiresAt: "2026-08-29T20:30:00+09:00", after19: "A19-MANUAL-OFF" }) }),
    NOW,
  )
  expect(restored.preferenceSource).toBe("legacy")
  expect(restored.preference.autoOpen).toBe(false)
  expect(restored.sessionSource).toBe("legacy")
  expect(restored.session).toMatchObject({ age: "unverified", mode: "manual-off", activation: null, expiryNotice: true })
})

test("B-AFTER19-MODEL-004 only an explicit review fixture creates a bounded confirmation receipt", () => {
  expect(GLOBAL_AFTER19_SESSION_EVENT).toBe("ondo-b-after19-session-change")
  expect(providerUnavailable("age")).toMatchObject({ result: "PROVIDER_UNAVAILABLE", provenanceTruth: "NOT_CONFIGURED" })
  const execution = successfulAgeReview()
  expect(recordGlobalAfter19ReviewEligibilityB(execution, NOW)).toMatchObject({ age: "eligible", mode: "off", activation: null })
  const completed = completeGlobalAfter19ReviewB(execution, NOW)
  expect(completed).toMatchObject({ age: "eligible", mode: "on", activation: "manual", expiryNotice: false })
  expect(completed.eligibilityReceipt).toEqual({
    schema: "review-age-predicate.v1",
    predicate: "AGE_GTE_19",
    outcome: "eligible",
    issuerType: "REVIEW_FIXTURE",
    provenanceTruth: "SIMULATED",
    fixtureId: "FX-AGE-GLOBAL-001",
    issuedAt: NOW.toISOString(),
    expiresAt: completed.ageExpiresAt,
    disclosure: "predicate_only",
  })
  expect(Date.parse(completed.ageExpiresAt!)).toBe(NOW.getTime() + GLOBAL_AFTER19_AGE_TTL_MS)
  expect(sanitizeGlobalAfter19Session(completed, new Date(NOW.getTime() + GLOBAL_AFTER19_AGE_TTL_MS + 1))).toMatchObject({
    age: "unverified",
    ageExpiresAt: null,
    eligibilityReceipt: null,
    mode: "off",
    expiryNotice: true,
  })
})

test("B-AFTER19-MODEL-005 rejects a forged or mismatched predicate receipt", () => {
  const eligible = recordGlobalAfter19ReviewEligibilityB(successfulAgeReview(), NOW)
  expect(sanitizeGlobalAfter19Session({
    ...eligible,
    eligibilityReceipt: { ...eligible.eligibilityReceipt, expiresAt: "2099-01-01T00:00:00.000Z" },
  }, NOW, { allowReviewFixture: true })).toMatchObject({ age: "unverified", eligibilityReceipt: null, mode: "off" })

  expect(sanitizeGlobalAfter19Session(eligible, NOW)).toMatchObject({
    age: "unverified",
    eligibilityReceipt: null,
    mode: "off",
  })
  expect(sanitizeGlobalAfter19Session(eligible, NOW, { allowReviewFixture: true })).toMatchObject({
    age: "eligible",
    eligibilityReceipt: { provenanceTruth: "SIMULATED", fixtureId: "FX-AGE-GLOBAL-001" },
  })
})

test("B-AFTER19-MODEL-006 an explicit local declaration opens only a bounded night-view session", () => {
  const completed = completeGlobalAfter19LocalConfirmationB(localActual("age_declaration", {
    predicate: "AGE_GTE_19" as const,
    outcome: "eligible" as const,
  }), NOW)

  expect(completed).toMatchObject({
    age: "eligible",
    mode: "on",
    activation: "manual",
    eligibilityReceipt: {
      schema: "local-age-declaration.v1",
      issuerType: "LOCAL_DECLARATION",
      provenanceTruth: "SELF_DECLARED",
      disclosure: "night_view_only",
    },
  })
  expect(completed.eligibilityReceipt).not.toHaveProperty("fixtureId")
  expect(isGlobalAfter19NightViewCurrent(completed, NOW)).toBe(true)
  expect(isGlobalAfter19AgeCurrent(completed, NOW)).toBe(false)
  expect(sanitizeGlobalAfter19Session(completed, NOW)).toEqual(completed)
  expect(sanitizeGlobalAfter19Session(completed, new Date(NOW.getTime() + GLOBAL_AFTER19_AGE_TTL_MS + 1))).toMatchObject({
    age: "unverified",
    eligibilityReceipt: null,
    mode: "off",
    expiryNotice: true,
  })
})
