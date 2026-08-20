import type { DiscoveryPreference, LocalizedText, Persona } from "../contracts/domain"

export const DISCOVERY_PREFERENCE_OPTIONS: ReadonlyArray<{
  id: DiscoveryPreference
  group: "meal" | "mood" | "dietary"
  label: LocalizedText
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

export const PERSONA_OPTIONS: ReadonlyArray<{
  id: Persona
  label: LocalizedText
}> = [
  { id: "short_term", label: { ko: "한국을 여행 중이에요", en: "I’m visiting Korea" } },
  { id: "long_term_resident", label: { ko: "한국에 거주하고 있어요", en: "I live in Korea" } },
  { id: "korean_local", label: { ko: "한국 로컬이에요", en: "I’m a local in Korea" } },
]
