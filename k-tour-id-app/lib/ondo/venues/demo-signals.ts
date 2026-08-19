import type { HeatLevel, LocalizedText } from "@/features/ondo/contracts/domain"
import { CANONICAL_MAP_VENUES } from "."

export type BDemoSignal = {
  score: number
  level: HeatLevel
  signalCount: number
  reason: LocalizedText
  truth: "SIMULATED"
}

const seoul = CANONICAL_MAP_VENUES.filter((venue) => venue.cityId === "seoul")
const busan = CANONICAL_MAP_VENUES.filter((venue) => venue.cityId === "busan")

export const B_DEMO_SIGNAL_BY_VENUE_ID = new Map<string, BDemoSignal>([
  [seoul[0]?.id ?? "", { score: 92, level: "peak", signalCount: 18, reason: { en: "A simulated cluster of recent local saves and visit signals.", ko: "최근 로컬 저장·방문 신호를 시뮬레이션한 예시예요." }, truth: "SIMULATED" }],
  [seoul[41]?.id ?? "", { score: 84, level: "hot", signalCount: 14, reason: { en: "A simulated dinner pulse rising faster than its usual baseline.", ko: "평소보다 빠르게 오르는 저녁 신호를 시뮬레이션했어요." }, truth: "SIMULATED" }],
  [seoul[86]?.id ?? "", { score: 68, level: "rising", signalCount: 10, reason: { en: "A simulated neighborhood food pulse with enough recent signals.", ko: "최근 표본이 모인 동네 식음료 신호 시뮬레이션이에요." }, truth: "SIMULATED" }],
  [seoul[132]?.id ?? "", { score: 52, level: "warming", signalCount: 7, reason: { en: "A simulated early pulse from a smaller set of local signals.", ko: "적은 로컬 표본으로 시작한 초기 신호 시뮬레이션이에요." }, truth: "SIMULATED" }],
  [busan[0]?.id ?? "", { score: 86, level: "hot", signalCount: 15, reason: { en: "A simulated Busan dinner pulse built on recent local signals.", ko: "최근 로컬 신호로 구성한 부산 저녁 시뮬레이션이에요." }, truth: "SIMULATED" }],
  [busan[64]?.id ?? "", { score: 71, level: "rising", signalCount: 11, reason: { en: "A simulated rise in local food interest.", ko: "로컬 식음료 관심 상승을 시뮬레이션했어요." }, truth: "SIMULATED" }],
  [busan[129]?.id ?? "", { score: 49, level: "warming", signalCount: 6, reason: { en: "A simulated early signal with limited confidence.", ko: "신뢰도가 제한된 초기 신호 시뮬레이션이에요." }, truth: "SIMULATED" }],
])
