export type OndoBLocale = "en" | "ko" | "ja"

export const ONDO_B_LOCALES: readonly OndoBLocale[] = ["en", "ko", "ja"]

export function ondoBText<T>(locale: OndoBLocale, copy: Record<OndoBLocale, T>): T {
  return copy[locale]
}

/** A discovery preference only. It is never evidence for the Person axis. */
export type OndoBDiscoveryIntent = "short_trip" | "nearby" | "living"

/**
 * `persona` remains the persisted property name for backwards compatibility,
 * but its value is a recommendation intent — never nationality, residence or
 * Person evidence.
 */
export type OndoBPersona = OndoBDiscoveryIntent

export type OndoBLegacyDiscoveryIntent = "travelling" | "preparing" | "local_contributor"
export type OndoBDiscoveryArea = "seoul" | "busan" | "jeju" | null

export const ONDO_B_PERSONA_IDS: readonly OndoBPersona[] = ["short_trip", "nearby", "living"]
export const ONDO_B_DISCOVERY_AREAS: readonly Exclude<OndoBDiscoveryArea, null>[] = ["seoul", "busan", "jeju"]

/**
 * Migrate only meanings that remain unambiguous. `local_contributor` described
 * an activity rather than a travel/living context, so asking again is safer
 * than silently inferring where or how somebody lives.
 */
export function normalizeOndoBDiscoveryIntent(value: unknown): OndoBPersona | null {
  if (value === "short_trip" || value === "nearby" || value === "living") return value
  if (value === "travelling" || value === "preparing") return "short_trip"
  return null
}

export function normalizeOndoBDiscoveryArea(value: unknown): OndoBDiscoveryArea {
  return value === "seoul" || value === "busan" || value === "jeju" ? value : null
}

export type OndoBDiscoveryPreference =
  | "classic"
  | "cafe"
  | "late"
  | "lively"
  | "calm"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "allergy_aware"

/**
 * Consumer presentation support for a persisted discovery choice.
 *
 * - `effective`: backed by a place fact and allowed to rank/highlight results.
 * - `dietary_unknown`: retained as a user need, but current place data cannot
 *   claim support; the map may only show an explicit unknown-evidence cue.
 * - `unsupported_legacy`: a backwards-compatible stored value that must not be
 *   presented as an effective control until a source-backed capability exists.
 */
export type OndoBDiscoveryPreferenceCapability =
  | "effective"
  | "dietary_unknown"
  | "unsupported_legacy"

export const ONDO_B_DISCOVERY_PREFERENCES: ReadonlyArray<{
  id: OndoBDiscoveryPreference
  group: "meal" | "mood" | "dietary"
  capability: OndoBDiscoveryPreferenceCapability
  label: Record<OndoBLocale, string>
}> = [
  { id: "classic", group: "meal", capability: "effective", label: { ko: "로컬의 익숙한 맛", en: "Local classics", ja: "地元の定番" } },
  { id: "cafe", group: "meal", capability: "effective", label: { ko: "카페와 디저트", en: "Cafés and dessert", ja: "カフェ・スイーツ" } },
  { id: "late", group: "mood", capability: "unsupported_legacy", label: { ko: "늦은 시간의 한 끼", en: "Late-night food", ja: "夜遅めの食事" } },
  { id: "lively", group: "mood", capability: "unsupported_legacy", label: { ko: "활기찬 분위기", en: "Lively", ja: "にぎやか" } },
  { id: "calm", group: "mood", capability: "unsupported_legacy", label: { ko: "조금 여유롭게", en: "A little calmer", ja: "ゆったり" } },
  { id: "vegetarian", group: "dietary", capability: "dietary_unknown", label: { ko: "채식", en: "Vegetarian", ja: "ベジタリアン" } },
  { id: "vegan", group: "dietary", capability: "dietary_unknown", label: { ko: "비건", en: "Vegan", ja: "ヴィーガン" } },
  { id: "halal", group: "dietary", capability: "dietary_unknown", label: { ko: "할랄", en: "Halal", ja: "ハラール" } },
  { id: "allergy_aware", group: "dietary", capability: "dietary_unknown", label: { ko: "알레르기 주의", en: "Allergy-aware", ja: "アレルギー情報を確認したい" } },
]

export function ondoBDiscoveryPreferenceCapability(
  id: OndoBDiscoveryPreference,
): OndoBDiscoveryPreferenceCapability {
  return ONDO_B_DISCOVERY_PREFERENCES.find((preference) => preference.id === id)!.capability
}
