import { expect, test } from "@playwright/test"
import {
  canAutoOpenGlobalAfter19B,
  completeGlobalAfter19AgeB,
  GLOBAL_AFTER19_AGE_TTL_MS,
  GLOBAL_AFTER19_PREFERENCE_KEY,
  GLOBAL_AFTER19_SESSION_EVENT,
  GLOBAL_AFTER19_SESSION_KEY,
  recordGlobalAfter19AgeEligibilityB,
  restoreGlobalAfter19B,
  sanitizeGlobalAfter19Session,
  type GlobalAfter19PreferenceB,
  type GlobalAfter19SessionB,
} from "../../features/ondo/after19/after19-global-b-model"

class MemoryStorage {
  constructor(private readonly values: Record<string, string> = {}) {}
  getItem(key: string) { return this.values[key] ?? null }
}

const NOW = new Date("2026-08-28T11:30:00.000Z") // 20:30 KST

test("B-AFTER19-MODEL-001 auto entry requires every KST, preference, age, expiry and manual-off guard", () => {
  const preference: GlobalAfter19PreferenceB = { version: 1, autoOpen: true }
  const eligible: GlobalAfter19SessionB = {
    ...recordGlobalAfter19AgeEligibilityB(NOW),
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

test("B-AFTER19-MODEL-003 legacy state migrates only when new keys are absent", () => {
  const restored = restoreGlobalAfter19B(
    new MemoryStorage({ "ondo.preferences.v3": JSON.stringify({ autoNight: false }) }),
    new MemoryStorage({ "ondo.session.v3": JSON.stringify({ age: "AGE-VERIFIED", ageExpiresAt: "2026-08-29T20:30:00+09:00", after19: "A19-MANUAL-OFF" }) }),
    NOW,
  )
  expect(restored.preferenceSource).toBe("legacy")
  expect(restored.preference.autoOpen).toBe(false)
  expect(restored.sessionSource).toBe("legacy")
  expect(restored.session).toMatchObject({ age: "eligible", mode: "manual-off", activation: null })
})

test("B-AFTER19-MODEL-004 completion creates a bounded predicate-only OpenDID receipt", () => {
  expect(GLOBAL_AFTER19_SESSION_EVENT).toBe("ondo-b-after19-session-change")
  expect(recordGlobalAfter19AgeEligibilityB(NOW)).toMatchObject({ age: "eligible", mode: "off", activation: null })
  const completed = completeGlobalAfter19AgeB(NOW)
  expect(completed).toMatchObject({ age: "eligible", mode: "on", activation: "manual", expiryNotice: false })
  expect(completed.eligibilityReceipt).toEqual({
    schema: "opendid-age-predicate.v1",
    predicate: "AGE_GTE_19",
    outcome: "eligible",
    issuerType: "SIMULATED_OPENDID_PROVIDER",
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
  const eligible = recordGlobalAfter19AgeEligibilityB(NOW)
  expect(sanitizeGlobalAfter19Session({
    ...eligible,
    eligibilityReceipt: { ...eligible.eligibilityReceipt, expiresAt: "2099-01-01T00:00:00.000Z" },
  }, NOW)).toMatchObject({ age: "unverified", eligibilityReceipt: null, mode: "off" })
})
