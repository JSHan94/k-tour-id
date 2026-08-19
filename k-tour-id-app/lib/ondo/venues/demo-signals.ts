import type { HeatLevel, LocalizedText } from "@/features/ondo/contracts/domain"
import type { VenuePrimaryCategory } from "./contracts"
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

const CATEGORY_REASON: Record<VenuePrimaryCategory, LocalizedText> = {
  korean: {
    en: "A simulated local-classic pulse assembled from preview saves and visit signals.",
    ko: "프리뷰 저장·방문 신호로 구성한 로컬 한식 열기 시뮬레이션이에요.",
  },
  casual: {
    en: "A simulated casual-meal pulse assembled from preview saves and visit signals.",
    ko: "프리뷰 저장·방문 신호로 구성한 간편식 열기 시뮬레이션이에요.",
  },
  japanese: {
    en: "A simulated Japanese-food pulse assembled from preview saves and visit signals.",
    ko: "프리뷰 저장·방문 신호로 구성한 일식 열기 시뮬레이션이에요.",
  },
  chinese: {
    en: "A simulated Chinese-food pulse assembled from preview saves and visit signals.",
    ko: "프리뷰 저장·방문 신호로 구성한 중식 열기 시뮬레이션이에요.",
  },
  global: {
    en: "A simulated global-food pulse assembled from preview saves and visit signals.",
    ko: "프리뷰 저장·방문 신호로 구성한 세계 음식 열기 시뮬레이션이에요.",
  },
  night: {
    en: "A simulated food-and-drink pulse. Opening hours and alcohol service are not verified.",
    ko: "식음료 열기 시뮬레이션이에요. 영업시간과 주류 제공 여부는 확인되지 않았어요.",
  },
  specialty: {
    en: "A simulated specialty-food pulse assembled from preview saves and visit signals.",
    ko: "프리뷰 저장·방문 신호로 구성한 전문 음식점 열기 시뮬레이션이에요.",
  },
}

function reasonFor(category: VenuePrimaryCategory, after19: boolean): LocalizedText {
  const base = CATEGORY_REASON[category]
  if (!after19) return base
  return {
    en: `${base.en} This preview is in the After 19 subset; it does not confirm opening hours or age-restricted service.`,
    ko: `${base.ko} After 19 프리뷰 대상이지만 영업시간이나 연령 제한 서비스는 확인하지 않아요.`,
  }
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
        freshness: { en: "Preview snapshot · Aug 19, 2026 12:00 KST", ko: "프리뷰 스냅샷 · 2026. 8. 19. 12:00 KST" },
        modelVersion: "ONDO-DEMO-1",
        reason: reasonFor(venue.primaryCategory, Boolean(after19)),
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
