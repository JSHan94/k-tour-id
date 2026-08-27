export const GLOBAL_AFTER19_PREFERENCE_KEY = "ondo-b.after19.preferences.v1"
export const GLOBAL_AFTER19_SESSION_KEY = "ondo-b.after19.session.v1"
export const GLOBAL_AFTER19_SESSION_EVENT = "ondo-b-after19-session-change"
export const GLOBAL_AFTER19_AGE_TTL_MS = 24 * 60 * 60 * 1000

const LEGACY_PREFERENCE_KEY = "ondo.preferences.v3"
const LEGACY_SESSION_KEY = "ondo.session.v3"

export type GlobalAfter19PreferenceB = {
  version: 1
  autoOpen: boolean
}

export type GlobalAfter19SessionB = {
  version: 1
  age: "unverified" | "eligible"
  ageExpiresAt: string | null
  mode: "off" | "on" | "manual-off"
  activation: "manual" | "auto" | null
  expiryNotice: boolean
}

export type GlobalAfter19RestoreB = {
  preference: GlobalAfter19PreferenceB
  session: GlobalAfter19SessionB
  preferenceSource: "current" | "legacy" | "default"
  sessionSource: "current" | "legacy" | "default"
}

type StorageRead = Pick<Storage, "getItem">

export const DEFAULT_GLOBAL_AFTER19_PREFERENCE: GlobalAfter19PreferenceB = {
  version: 1,
  autoOpen: true,
}

export const DEFAULT_GLOBAL_AFTER19_SESSION: GlobalAfter19SessionB = {
  version: 1,
  age: "unverified",
  ageExpiresAt: null,
  mode: "off",
  activation: null,
  expiryNotice: false,
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function parseStored(storage: StorageRead | null, key: string): unknown {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    return raw == null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function hasStored(storage: StorageRead | null, key: string): boolean {
  if (!storage) return false
  try {
    return storage.getItem(key) !== null
  } catch {
    return false
  }
}

function validExpiry(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 48) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

export function sanitizeGlobalAfter19Preference(value: unknown): GlobalAfter19PreferenceB {
  const current = record(value)
  return {
    version: 1,
    autoOpen: current.version === 1 && typeof current.autoOpen === "boolean"
      ? current.autoOpen
      : DEFAULT_GLOBAL_AFTER19_PREFERENCE.autoOpen,
  }
}

export function sanitizeGlobalAfter19Session(value: unknown, now = new Date()): GlobalAfter19SessionB {
  const current = record(value)
  if (current.version !== 1) return { ...DEFAULT_GLOBAL_AFTER19_SESSION }

  const expiry = validExpiry(current.ageExpiresAt)
  const eligible = current.age === "eligible" && expiry !== null && Date.parse(expiry) > now.getTime()
  const requestedMode = current.mode === "on" || current.mode === "manual-off" ? current.mode : "off"
  const mode = requestedMode === "on" && !eligible ? "off" : requestedMode
  const activation = mode === "on" && (current.activation === "manual" || current.activation === "auto")
    ? current.activation
    : null

  return {
    version: 1,
    age: eligible ? "eligible" : "unverified",
    ageExpiresAt: eligible ? expiry : null,
    mode,
    activation,
    expiryNotice: current.expiryNotice === true || (current.age === "eligible" && !eligible),
  }
}

function migrateLegacyPreference(value: unknown): GlobalAfter19PreferenceB {
  const legacy = record(value)
  return {
    version: 1,
    autoOpen: typeof legacy.autoNight === "boolean" ? legacy.autoNight : DEFAULT_GLOBAL_AFTER19_PREFERENCE.autoOpen,
  }
}

function migrateLegacySession(value: unknown, now: Date): GlobalAfter19SessionB {
  const legacy = record(value)
  const expiry = validExpiry(legacy.ageExpiresAt)
  const eligible = legacy.age === "AGE-VERIFIED" && expiry !== null && Date.parse(expiry) > now.getTime()
  const requestedMode = legacy.after19 === "A19-ON"
    ? "on"
    : legacy.after19 === "A19-MANUAL-OFF"
      ? "manual-off"
      : "off"
  const mode = requestedMode === "on" && !eligible ? "off" : requestedMode
  return {
    version: 1,
    age: eligible ? "eligible" : "unverified",
    ageExpiresAt: eligible ? expiry : null,
    mode,
    activation: mode === "on" ? "manual" : null,
    expiryNotice: legacy.age === "AGE-VERIFIED" && !eligible,
  }
}

export function restoreGlobalAfter19B(
  deviceStorage: StorageRead | null,
  sessionStorage: StorageRead | null,
  now = new Date(),
): GlobalAfter19RestoreB {
  const hasPreference = hasStored(deviceStorage, GLOBAL_AFTER19_PREFERENCE_KEY)
  const hasSession = hasStored(sessionStorage, GLOBAL_AFTER19_SESSION_KEY)
  const hasLegacyPreference = !hasPreference && hasStored(deviceStorage, LEGACY_PREFERENCE_KEY)
  const hasLegacySession = !hasSession && hasStored(sessionStorage, LEGACY_SESSION_KEY)

  return {
    preference: hasPreference
      ? sanitizeGlobalAfter19Preference(parseStored(deviceStorage, GLOBAL_AFTER19_PREFERENCE_KEY))
      : hasLegacyPreference
        ? migrateLegacyPreference(parseStored(deviceStorage, LEGACY_PREFERENCE_KEY))
        : { ...DEFAULT_GLOBAL_AFTER19_PREFERENCE },
    session: hasSession
      ? sanitizeGlobalAfter19Session(parseStored(sessionStorage, GLOBAL_AFTER19_SESSION_KEY), now)
      : hasLegacySession
        ? migrateLegacySession(parseStored(sessionStorage, LEGACY_SESSION_KEY), now)
        : { ...DEFAULT_GLOBAL_AFTER19_SESSION },
    preferenceSource: hasPreference ? "current" : hasLegacyPreference ? "legacy" : "default",
    sessionSource: hasSession ? "current" : hasLegacySession ? "legacy" : "default",
  }
}

export function isGlobalAfter19AgeCurrent(session: GlobalAfter19SessionB, now = new Date()): boolean {
  return session.age === "eligible"
    && session.ageExpiresAt !== null
    && Date.parse(session.ageExpiresAt) > now.getTime()
}

export function isKoreanAfter19(now = new Date()): boolean {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now).find((part) => part.type === "hour")?.value)
  return Number.isFinite(hour) && hour >= 19
}

export function canAutoOpenGlobalAfter19B(
  preference: GlobalAfter19PreferenceB,
  session: GlobalAfter19SessionB,
  now = new Date(),
): boolean {
  return preference.autoOpen
    && session.mode !== "manual-off"
    && isGlobalAfter19AgeCurrent(session, now)
    && isKoreanAfter19(now)
}

export function recordGlobalAfter19AgeEligibilityB(now = new Date()): GlobalAfter19SessionB {
  return {
    version: 1,
    age: "eligible",
    ageExpiresAt: new Date(now.getTime() + GLOBAL_AFTER19_AGE_TTL_MS).toISOString(),
    mode: "off",
    activation: null,
    expiryNotice: false,
  }
}

export function completeGlobalAfter19AgeB(now = new Date()): GlobalAfter19SessionB {
  return {
    ...recordGlobalAfter19AgeEligibilityB(now),
    mode: "on",
    activation: "manual",
  }
}
