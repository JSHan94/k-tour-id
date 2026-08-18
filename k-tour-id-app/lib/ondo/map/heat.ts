import type { Locale } from "../../../features/ondo/contracts/domain"
import type { Provenance } from "../../../features/ondo/contracts/domain"
import type { ConfidenceBand, FreshnessBand, HeatDisplay } from "./models"

export const HEAT_COLORS = {
  low: { fill: "#EFE1B7", text: "#191816", stroke: "#6B6255" },
  warming: { fill: "#EBC463", text: "#191816", stroke: "#6B5425" },
  rising: { fill: "#E6843B", text: "#191816", stroke: "#794421" },
  hot: { fill: "#C94832", text: "#FFFDF8", stroke: "#7C2E23" },
  peak: { fill: "#7A2048", text: "#FFFDF8", stroke: "#4B122C" },
  limited: { fill: "#CFCAC0", text: "#191816", stroke: "#706B64" },
} as const

export const HEAT_LABELS = {
  en: { low: "Calm", warming: "Warming", rising: "Rising", hot: "Hot", peak: "Peak", limited: "More signals needed" },
  ko: { low: "차분함", warming: "온기 있음", rising: "떠오름", hot: "뜨거움", peak: "아주 뜨거움", limited: "신호가 더 필요해요" },
} as const

export const CONFIDENCE_LABELS: Record<Locale, Record<ConfidenceBand, string>> = {
  en: { high: "Strong signal base", medium: "Moderate signal base", low: "Limited sample", unknown: "Signal base pending", limited: "Limited sample" },
  ko: { high: "근거 충분", medium: "근거 보통", low: "표본이 적어요", unknown: "근거 확인 중", limited: "표본이 적어요" },
}

export const FRESHNESS_LABELS: Record<Locale, Record<FreshnessBand, string>> = {
  en: { recent: "Updated recently", today: "Updated today", aging: "Check update time", stale: "Older signals", unknown: "Update pending" },
  ko: { recent: "방금 업데이트", today: "오늘 업데이트", aging: "업데이트 시각 확인", stale: "오래된 신호", unknown: "업데이트 확인 중" },
}

export function resolveFreshness(
  input: { freshness: FreshnessBand; updatedAt?: string; provenance: Provenance },
  now = Date.now(),
): FreshnessBand {
  if (input.freshness === "unknown") return "unknown"
  const expiresAt = input.provenance.expiresAt ? Date.parse(input.provenance.expiresAt) : Number.NaN
  if (Number.isFinite(expiresAt) && now > expiresAt) return "stale"
  const sourceTime = Date.parse(input.updatedAt ?? input.provenance.fetchedAt)
  if (!Number.isFinite(sourceTime)) return "unknown"
  const ageHours = Math.max(0, now - sourceTime) / 3_600_000
  if (ageHours <= 2) return "recent"
  if (ageHours <= 24) return "today"
  if (ageHours <= 72) return "aging"
  return "stale"
}

export function heatAccessibleName(input: HeatDisplay & { name: string; locale: Locale }) {
  if (input.score == null) {
    return input.locale === "ko"
      ? `${input.name}, ONDO 점수 없음, 신호가 더 필요함, 먼저 채워지는 지역`
      : `${input.name}, no ONDO score, more signals needed, early coverage`
  }
  const signal = input.locale === "ko" ? `최근 신호 ${input.signalCount}개` : `${input.signalCount} recent signals`
  return [input.name, `ONDO ${input.score}`, HEAT_LABELS[input.locale][input.level], signal, CONFIDENCE_LABELS[input.locale][input.confidence], FRESHNESS_LABELS[input.locale][input.freshness]].join(", ")
}

export function confidenceClass(confidence: ConfidenceBand) {
  if (confidence === "high") return "confidenceHigh"
  if (confidence === "medium") return "confidenceMedium"
  if (confidence === "low" || confidence === "limited") return "confidenceLow"
  return "confidenceUnknown"
}
