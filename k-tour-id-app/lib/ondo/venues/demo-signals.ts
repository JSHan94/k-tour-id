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
    en: "A fixed simulated local-classic score assembled from preview saves and visit inputs; it is not live activity or a trend.",
    ko: "프리뷰 저장·방문 입력으로 만든 고정 한식 점수 시뮬레이션이며 실시간 현황이나 추세가 아니에요.",
  },
  casual: {
    en: "A fixed simulated casual-meal score assembled from preview saves and visit inputs; it is not live activity or a trend.",
    ko: "프리뷰 저장·방문 입력으로 만든 고정 간편식 점수 시뮬레이션이며 실시간 현황이나 추세가 아니에요.",
  },
  japanese: {
    en: "A fixed simulated Japanese-food score assembled from preview saves and visit inputs; it is not live activity or a trend.",
    ko: "프리뷰 저장·방문 입력으로 만든 고정 일식 점수 시뮬레이션이며 실시간 현황이나 추세가 아니에요.",
  },
  chinese: {
    en: "A fixed simulated Chinese-food score assembled from preview saves and visit inputs; it is not live activity or a trend.",
    ko: "프리뷰 저장·방문 입력으로 만든 고정 중식 점수 시뮬레이션이며 실시간 현황이나 추세가 아니에요.",
  },
  global: {
    en: "A fixed simulated global-food score assembled from preview saves and visit inputs; it is not live activity or a trend.",
    ko: "프리뷰 저장·방문 입력으로 만든 고정 세계 음식 점수 시뮬레이션이며 실시간 현황이나 추세가 아니에요.",
  },
  night: {
    en: "A fixed simulated food-and-drink score, not live activity or a trend. Opening hours and alcohol service are not verified.",
    ko: "실시간 현황이나 추세가 아닌 고정 식음료 점수 시뮬레이션이에요. 영업시간과 주류 제공 여부는 확인되지 않았어요.",
  },
  specialty: {
    en: "A fixed simulated specialty-food score assembled from preview saves and visit inputs; it is not live activity or a trend.",
    ko: "프리뷰 저장·방문 입력으로 만든 고정 전문 음식점 점수 시뮬레이션이며 실시간 현황이나 추세가 아니에요.",
  },
}

function reasonFor(category: VenuePrimaryCategory, after19: boolean): LocalizedText {
  const base = CATEGORY_REASON[category]
  if (!after19) return base
  return {
    en: `${base.en} ONDO includes this food-and-drink source category under its simulated night-preview policy. The official record does not confirm opening hours, alcohol service, or an age restriction.`,
    ko: `${base.ko} ONDO의 시뮬레이션 야간 프리뷰 정책에 따라 이 식음료 출처 카테고리를 포함해요. 공식 기록은 영업시간·주류 제공·연령 제한을 확인하지 않습니다.`,
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
      const after19 = venue.primaryCategory === "night" ? true as const : undefined
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
