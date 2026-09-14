export type OndoBProductTimelineLocale = "en" | "ko" | "ja"
export type OndoBProductTimelineOverride = "legacy-2026"

const KST_OFFSET_MS = 9 * 60 * 60 * 1_000
const TABLE_RECURRENCE_MS = 28 * 24 * 60 * 60 * 1_000

// The original showcase dates remain available only through an explicit QA
// override. Ordinary product renders roll this four-week cadence forward from
// the same Friday, so a stale build never opens on a past Table.
const LEGACY_TABLE_STARTS_AT_MS = Date.parse("2026-09-18T20:30:00+09:00")
const LEGACY_BENEFIT_EXPIRES_AT_MS = Date.parse("2026-09-30T23:59:59+09:00")

const EN_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const
const EN_WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const KO_WEEKDAY = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"] as const
const JA_WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"] as const

type TimelineLabels = Record<OndoBProductTimelineLocale, string>

export type OndoBProductTimeline = {
  override: OndoBProductTimelineOverride | null
  tableStartsAtMs: number
  tableStartsAt: string
  tableSchedule: TimelineLabels
  benefitExpiresAtMs: number
  benefitExpiresAt: string
  benefitExpiry: TimelineLabels
}

function firstFutureTableStart(nowMs: number) {
  if (nowMs < LEGACY_TABLE_STARTS_AT_MS) return LEGACY_TABLE_STARTS_AT_MS
  const elapsedCadences = Math.floor((nowMs - LEGACY_TABLE_STARTS_AT_MS) / TABLE_RECURRENCE_MS) + 1
  return LEGACY_TABLE_STARTS_AT_MS + elapsedCadences * TABLE_RECURRENCE_MS
}

function endOfTableMonthKst(tableStartsAtMs: number) {
  const tableKst = new Date(tableStartsAtMs + KST_OFFSET_MS)
  return Date.UTC(tableKst.getUTCFullYear(), tableKst.getUTCMonth() + 1, 0, 14, 59, 59)
}

function kstParts(valueMs: number) {
  const value = new Date(valueMs + KST_OFFSET_MS)
  return {
    month: value.getUTCMonth(),
    day: value.getUTCDate(),
    weekday: value.getUTCDay(),
  }
}

function tableScheduleLabels(tableStartsAtMs: number): TimelineLabels {
  const { month, day, weekday } = kstParts(tableStartsAtMs)
  return {
    en: `${EN_WEEKDAY[weekday]}, ${EN_MONTH[month]} ${day} · 20:30 KST`,
    ko: `${month + 1}월 ${day}일 ${KO_WEEKDAY[weekday]} · 20:30 KST`,
    ja: `${month + 1}月${day}日（${JA_WEEKDAY[weekday]}）・20:30 KST`,
  }
}

function benefitExpiryLabels(benefitExpiresAtMs: number): TimelineLabels {
  const { month, day } = kstParts(benefitExpiresAtMs)
  return {
    en: `${EN_MONTH[month]} ${day}`,
    ko: `${month + 1}월 ${day}일`,
    ja: `${month + 1}月${day}日`,
  }
}

/**
 * Product-owned rolling dates for the local frontend walkthrough.
 *
 * `legacy-2026` is accepted only through the QA runtime seam by consumers. It
 * keeps the exact pre/post cutoff testable without making product availability
 * depend on a calendar date frozen in source.
 */
export function ondoBProductTimeline(
  nowMs = Date.now(),
  override: OndoBProductTimelineOverride | null = null,
): OndoBProductTimeline {
  const safeNowMs = Number.isFinite(nowMs) ? nowMs : Date.now()
  const tableStartsAtMs = override === "legacy-2026"
    ? LEGACY_TABLE_STARTS_AT_MS
    : firstFutureTableStart(safeNowMs)
  const benefitExpiresAtMs = override === "legacy-2026"
    ? LEGACY_BENEFIT_EXPIRES_AT_MS
    : endOfTableMonthKst(tableStartsAtMs)

  return {
    override,
    tableStartsAtMs,
    tableStartsAt: new Date(tableStartsAtMs).toISOString(),
    tableSchedule: tableScheduleLabels(tableStartsAtMs),
    benefitExpiresAtMs,
    benefitExpiresAt: new Date(benefitExpiresAtMs).toISOString(),
    benefitExpiry: benefitExpiryLabels(benefitExpiresAtMs),
  }
}
