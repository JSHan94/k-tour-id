import type { VenueCityId } from "@/lib/ondo/venues/contracts"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"

export const PULSE_LEVELS = ["peak", "hot", "rising", "warming", "low", "limited"] as const

export type PulseLevelB = (typeof PULSE_LEVELS)[number]
export type PulseConfidenceB = "high" | "medium" | "low" | "limited"
export type PulseFreshnessB = "curated-snapshot" | "growing" | "limited"
export type PulseLocalSignalTagB = "calm_now" | "lively_now" | "quick_stop" | "welcoming"
export type PulseLocalEvidenceB = { tags: PulseLocalSignalTagB[]; postedAt: string }
export type PulseLocalEvidenceResultB = PulseLocalEvidenceB & { origin: "local-device" }

export type PulseEvidenceB = {
  origin: "curated-walkthrough" | "local-device"
  label: { en: string; ko: string; ja: string }
}

export type PulseSnapshotB = {
  venueId: string
  cityId: VenueCityId
  level: PulseLevelB
  score: number | null
  signalCount: number | null
  updatedAt: string | null
  freshness: PulseFreshnessB
  confidence: PulseConfidenceB
  evidence: readonly PulseEvidenceB[]
  localEvidence: PulseLocalEvidenceResultB | null
}

export const PULSE_DISCLOSURE = Object.freeze({
  en: "Curated visit signals, not live crowding or official LOCALDATA facts.",
  ko: "선별된 방문 신호이며, 실시간 혼잡도나 공식 LOCALDATA 사실이 아닙니다.",
  ja: "選定した訪問シグナルに基づく参考値です。リアルタイムの混雑状況でも、LOCALDATAの公式情報でもありません。",
})

export const PULSE_CITY_STATUS = Object.freeze({ seoul: "active", busan: "growing" } as const)

const curatedEvidence = (en: string, ko: string, ja: string): readonly PulseEvidenceB[] => Object.freeze([
  { origin: "curated-walkthrough", label: { en, ko, ja } },
])

export const CURATED_PULSE_SNAPSHOTS: readonly PulseSnapshotB[] = Object.freeze([
  {
    venueId: "mois-0021cd596bc5b2a922ad", cityId: "seoul", level: "peak", score: 91, signalCount: 24,
    updatedAt: "2026-08-25T02:20:00.000Z", freshness: "curated-snapshot", confidence: "high",
    evidence: curatedEvidence("Curated pattern: lively tables and a longer stay", "선별 패턴: 활기찬 테이블과 긴 체류", "選定傾向：にぎやかなテーブルと長めの滞在"), localEvidence: null,
  },
  {
    venueId: "mois-0348cfe16225dbbcec8a", cityId: "seoul", level: "hot", score: 84, signalCount: 19,
    updatedAt: "2026-08-25T02:05:00.000Z", freshness: "curated-snapshot", confidence: "high",
    evidence: curatedEvidence("Curated pattern: lively tables and quick turnover", "선별 패턴: 활기찬 테이블과 빠른 회전", "選定傾向：にぎやかなテーブルと速い回転"), localEvidence: null,
  },
  {
    venueId: "mois-02c79775c050624e474d", cityId: "seoul", level: "rising", score: 73, signalCount: 15,
    updatedAt: "2026-08-25T01:55:00.000Z", freshness: "curated-snapshot", confidence: "medium",
    evidence: curatedEvidence("Curated pattern: arrivals building across the set", "선별 패턴: 방문 흐름 증가", "選定傾向：来店の流れが高まりつつある"), localEvidence: null,
  },
  {
    venueId: "mois-0907f914f70fc6e4b7ed", cityId: "seoul", level: "warming", score: 62, signalCount: 12,
    updatedAt: "2026-08-25T01:40:00.000Z", freshness: "curated-snapshot", confidence: "medium",
    evidence: curatedEvidence("Curated pattern: steady arrivals with room to settle", "선별 패턴: 여유가 남은 꾸준한 방문 흐름", "選定傾向：落ち着ける余裕のある安定した来店"), localEvidence: null,
  },
  {
    venueId: "mois-110f0d9867977ae410e8", cityId: "seoul", level: "low", score: 39, signalCount: 9,
    updatedAt: "2026-08-25T01:25:00.000Z", freshness: "curated-snapshot", confidence: "medium",
    evidence: curatedEvidence("Curated pattern: a calmer pace across the set", "선별 패턴: 비교적 차분한 흐름", "選定傾向：比較的穏やかな流れ"), localEvidence: null,
  },
  {
    venueId: "mois-18939eecb43c15ab4305", cityId: "seoul", level: "hot", score: 80, signalCount: 16,
    updatedAt: "2026-08-25T01:10:00.000Z", freshness: "curated-snapshot", confidence: "medium",
    evidence: curatedEvidence("Curated pattern: a lively evening", "선별 패턴: 활기찬 저녁 흐름", "選定傾向：にぎやかな夜の流れ"), localEvidence: null,
  },
  {
    venueId: "mois-03041681b54ea5399763", cityId: "busan", level: "warming", score: 56, signalCount: 7,
    updatedAt: "2026-08-25T01:00:00.000Z", freshness: "growing", confidence: "low",
    evidence: curatedEvidence("Growing curated set: early local pattern", "확장 중인 선별 세트: 초기 로컬 흐름", "拡充中の選定セット：初期のローカル傾向"), localEvidence: null,
  },
  {
    venueId: "mois-0977b107c7db944e75cf", cityId: "busan", level: "low", score: 43, signalCount: 5,
    updatedAt: "2026-08-25T00:45:00.000Z", freshness: "growing", confidence: "low",
    evidence: curatedEvidence("Growing curated set: an early calmer pattern", "확장 중인 선별 세트: 초기의 차분한 흐름", "拡充中の選定セット：初期の穏やかな流れ"), localEvidence: null,
  },
])

const CURATED_BY_VENUE = new Map(CURATED_PULSE_SNAPSHOTS.map((snapshot) => [snapshot.venueId, snapshot] as const))

function localEvidenceItem(): PulseEvidenceB {
  return {
    origin: "local-device",
    label: {
      en: "On this device · your latest Local Signal",
      ko: "이 기기에서 · 내가 남긴 최신 로컬 시그널",
      ja: "この端末・自分が投稿した最新のローカルシグナル",
    },
  }
}

export function pulseForVenue(venueId: string, localEvidence: PulseLocalEvidenceB | null = null): PulseSnapshotB {
  const curated = CURATED_BY_VENUE.get(venueId)
  const base: PulseSnapshotB = curated ?? {
    venueId,
    cityId: canonicalMapVenueById(venueId)?.cityId ?? "seoul",
    level: "limited",
    score: null,
    signalCount: null,
    updatedAt: null,
    freshness: "limited",
    confidence: "limited",
    evidence: [],
    localEvidence: null,
  }
  if (!localEvidence) return base
  return {
    ...base,
    evidence: [...base.evidence, localEvidenceItem()],
    localEvidence: { origin: "local-device", ...localEvidence },
  }
}

export function pulseAlternativesForVenue(venueId: string): readonly PulseSnapshotB[] {
  const source = CURATED_BY_VENUE.get(venueId)
  if (!source || source.level !== "peak") return []
  return CURATED_PULSE_SNAPSHOTS
    .filter((snapshot) => snapshot.cityId === source.cityId && ["rising", "warming", "low"].includes(snapshot.level))
    .sort((left, right) => (left.score ?? 0) - (right.score ?? 0))
    .slice(0, 3)
}

export function pulseLevelLabel(level: PulseLevelB, locale: "en" | "ko" | "ja") {
  const labels = {
    peak: { en: "PEAK", ko: "피크", ja: "ピーク" },
    hot: { en: "HOT", ko: "핫", ja: "ホット" },
    rising: { en: "RISING", ko: "상승", ja: "上昇中" },
    warming: { en: "WARMING", ko: "달아오름", ja: "高まり中" },
    low: { en: "LOW", ko: "여유", ja: "ゆったり" },
    limited: { en: "LIMITED", ko: "신호 부족", ja: "シグナル不足" },
  } as const
  return labels[level][locale]
}

export function pulseColor(level: PulseLevelB) {
  return ({
    peak: "#7A2048",
    hot: "#C94832",
    rising: "#E6843B",
    warming: "#EBC463",
    low: "#EFE1B7",
    limited: "#CFCAC0",
  } as const)[level]
}
