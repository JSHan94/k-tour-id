export type OndoBLocale = "en" | "ko"

export type OndoBPersona = "travelling" | "preparing" | "local_contributor"

export const ONDO_B_PERSONA_IDS: readonly OndoBPersona[] = [
  "travelling",
  "preparing",
  "local_contributor",
]

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

export const ONDO_B_DISCOVERY_PREFERENCES: ReadonlyArray<{
  id: OndoBDiscoveryPreference
  group: "meal" | "mood" | "dietary"
  label: Record<OndoBLocale, string>
}> = [
  { id: "classic", group: "meal", label: { ko: "로컬의 익숙한 맛", en: "Local classics" } },
  { id: "cafe", group: "meal", label: { ko: "카페와 디저트", en: "Cafés and dessert" } },
  { id: "late", group: "mood", label: { ko: "늦은 시간의 한 끼", en: "Late-night food" } },
  { id: "lively", group: "mood", label: { ko: "활기찬 분위기", en: "Lively" } },
  { id: "calm", group: "mood", label: { ko: "조금 여유롭게", en: "A little calmer" } },
  { id: "vegetarian", group: "dietary", label: { ko: "채식", en: "Vegetarian" } },
  { id: "vegan", group: "dietary", label: { ko: "비건", en: "Vegan" } },
  { id: "halal", group: "dietary", label: { ko: "할랄", en: "Halal" } },
  { id: "allergy_aware", group: "dietary", label: { ko: "알레르기 주의", en: "Allergy-aware" } },
]
