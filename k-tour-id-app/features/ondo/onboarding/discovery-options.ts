import type { DiscoveryPreference, LocalizedText, Persona } from "../contracts/domain"

export const DISCOVERY_PREFERENCE_OPTIONS: ReadonlyArray<{
  id: DiscoveryPreference
  label: LocalizedText
}> = [
  { id: "classic", label: { ko: "로컬의 익숙한 맛", en: "Local classics" } },
  { id: "cafe", label: { ko: "카페와 디저트", en: "Cafés and dessert" } },
  { id: "late", label: { ko: "늦은 시간의 한 끼", en: "Late-night food" } },
  { id: "lively", label: { ko: "활기찬 분위기", en: "Lively" } },
  { id: "calm", label: { ko: "조금 여유롭게", en: "A little calmer" } },
  { id: "diet", label: { ko: "식이 선택", en: "Dietary preferences" } },
]

export const PERSONA_OPTIONS: ReadonlyArray<{
  id: Persona
  label: LocalizedText
}> = [
  { id: "short_term", label: { ko: "한국을 여행 중이에요", en: "I’m visiting Korea" } },
  { id: "long_term_resident", label: { ko: "한국에 거주하고 있어요", en: "I live in Korea" } },
  { id: "korean_local", label: { ko: "한국 로컬이에요", en: "I’m a local in Korea" } },
]
