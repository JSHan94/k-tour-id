export type OndoBLocale = "en" | "ko" | "ja"

export const ONDO_B_LOCALES: readonly OndoBLocale[] = ["en", "ko", "ja"]

export function ondoBText<T>(locale: OndoBLocale, copy: Record<OndoBLocale, T>): T {
  return copy[locale]
}

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
  { id: "classic", group: "meal", label: { ko: "로컬의 익숙한 맛", en: "Local classics", ja: "地元の定番" } },
  { id: "cafe", group: "meal", label: { ko: "카페와 디저트", en: "Cafés and dessert", ja: "カフェ・スイーツ" } },
  { id: "late", group: "mood", label: { ko: "늦은 시간의 한 끼", en: "Late-night food", ja: "夜遅めの食事" } },
  { id: "lively", group: "mood", label: { ko: "활기찬 분위기", en: "Lively", ja: "にぎやか" } },
  { id: "calm", group: "mood", label: { ko: "조금 여유롭게", en: "A little calmer", ja: "ゆったり" } },
  { id: "vegetarian", group: "dietary", label: { ko: "채식", en: "Vegetarian", ja: "ベジタリアン" } },
  { id: "vegan", group: "dietary", label: { ko: "비건", en: "Vegan", ja: "ヴィーガン" } },
  { id: "halal", group: "dietary", label: { ko: "할랄", en: "Halal", ja: "ハラール" } },
  { id: "allergy_aware", group: "dietary", label: { ko: "알레르기 주의", en: "Allergy-aware", ja: "アレルギー情報を確認したい" } },
]
