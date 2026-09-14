import {
  ONDO_B_DISCOVERY_PREFERENCES,
  normalizeOndoBDiscoveryIntent,
  type OndoBDiscoveryIntent,
  type OndoBDiscoveryPreference,
} from "../shared/state/ondo-b-preferences"

export const B_DISCOVERY_FOCUS_EVENT = "ondo:b-discovery-focus"

export type BDiscoveryFocusCity = "seoul" | "busan" | "jeju"
export type BDiscoveryFocusRequest = Readonly<{
  city: BDiscoveryFocusCity | null
  source: "onboarding"
  motion: "standard"
  personalization?: Readonly<{
    intent: OndoBDiscoveryIntent
    preferences: readonly OndoBDiscoveryPreference[]
  }>
}>

const DISCOVERY_PREFERENCE_IDS = new Set<OndoBDiscoveryPreference>(ONDO_B_DISCOVERY_PREFERENCES.map(({ id }) => id))

export function readBDiscoveryFocusRequest(value: unknown): BDiscoveryFocusRequest | null {
  if (!value || typeof value !== "object") return null
  const request = value as Record<string, unknown>
  if (request.city !== null && request.city !== "seoul" && request.city !== "busan" && request.city !== "jeju") return null
  if (request.source !== "onboarding" || request.motion !== "standard") return null
  let personalization: BDiscoveryFocusRequest["personalization"]
  if (request.personalization !== undefined) {
    if (!request.personalization || typeof request.personalization !== "object") return null
    const draft = request.personalization as Record<string, unknown>
    const intent = normalizeOndoBDiscoveryIntent(draft.intent)
    if (!intent || !Array.isArray(draft.preferences)
      || draft.preferences.some((preference) => typeof preference !== "string" || !DISCOVERY_PREFERENCE_IDS.has(preference as OndoBDiscoveryPreference))) return null
    personalization = { intent, preferences: [...new Set(draft.preferences as OndoBDiscoveryPreference[])] }
  }
  return {
    city: request.city,
    source: "onboarding",
    motion: "standard",
    ...(personalization ? { personalization } : {}),
  }
}

/**
 * A semantic focus request, not a second router. The already-mounted map owns
 * camera motion, reduced-motion behavior, history and final focus placement.
 */
export function requestBDiscoveryFocus(request: BDiscoveryFocusRequest) {
  if (typeof window === "undefined") return false
  const safeRequest = readBDiscoveryFocusRequest(request)
  if (!safeRequest) return false
  window.dispatchEvent(new CustomEvent(B_DISCOVERY_FOCUS_EVENT, { detail: safeRequest }))
  return true
}
