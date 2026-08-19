import type { HeatLevel, LocalizedText } from "@/features/ondo/contracts/domain"
import { CANONICAL_MAP_VENUES_COMPACT } from "./map-data"

export type BDemoSignal = {
  score: number
  level: HeatLevel
  signalCount: number
  confidence: number
  computedAt: string
  freshness: LocalizedText
  modelVersion: "ONDO-DEMO-1"
  reason: LocalizedText
  truth: "SIMULATED"
  after19?: true
}

const seoul = CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === "seoul")
const busan = CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === "busan")

function levelFor(score: number): HeatLevel {
  if (score >= 88) return "peak"
  if (score >= 76) return "hot"
  if (score >= 62) return "rising"
  return "warming"
}

function citySignals(venues: typeof CANONICAL_MAP_VENUES_COMPACT, cityOffset: number) {
  return venues
    .filter((_, index) => index % 5 === cityOffset)
    .slice(0, 40)
    .map((venue, index) => {
      const score = 48 + ((index * 17 + cityOffset * 11) % 47)
      const signalCount = 7 + ((index * 7 + cityOffset) % 17)
      const confidence = Number((0.55 + ((index * 9 + cityOffset) % 34) / 100).toFixed(2))
      const after19 = index % 4 === 0 ? true as const : undefined
      const signal: BDemoSignal = {
        score,
        level: levelFor(score),
        signalCount,
        confidence,
        computedAt: "2026-08-19T03:00:00.000Z",
        freshness: { en: "Updated for this preview", ko: "이 프리뷰 기준 업데이트" },
        modelVersion: "ONDO-DEMO-1",
        reason: {
          en: "A simulated food pulse based on recent local saves and visit signals.",
          ko: "최근 로컬 저장·방문 신호로 구성한 식음료 열기 시뮬레이션이에요.",
        },
        truth: "SIMULATED",
        after19,
      }
      return [venue.id, signal] as const
    })
}

export const B_DEMO_SIGNAL_BY_VENUE_ID = new Map<string, BDemoSignal>([
  ...citySignals(seoul, 0),
  ...citySignals(busan, 2),
])
