import type { Locale, PulseTable } from "../contracts/domain"
import type { OndoBProductTimeline, OndoBProductTimelineLocale } from "../shared/time/product-timeline-b"

export type TableAvailabilityState = "TAV-OPEN" | "TAV-FULL" | "TAV-CLOSED" | "TAV-CANCELLED"
export type TableMembershipState = "TMB-NONE" | "TMB-REQUESTING" | "TMB-CONFIRMED" | "TMB-CHECKED-IN" | "TMB-COMPLETED" | "TMB-LEFT" | "TMB-FAILED"
export type TableFailureState = "TFR-NONE" | "TFR-FULL" | "TFR-NETWORK" | "TFR-POLICY" | "TFR-CANCELLED"
export type ChatAccessState = "CHA-LOCKED" | "CHA-OPEN"

export type OndoTable = PulseTable & {
  menu: { en: string; ko: string }
  format: { en: string; ko: string }
  requiresPerson: boolean
  availability: TableAvailabilityState
  fixtureId: string
}

export type OndoBTablePresentation = Readonly<{
  city: { en: string; ko: string; ja: string }
  title: { en: string; ko: string; ja: string }
  subtitle: { en: string; ko: string; ja: string }
  menu: { en: string; ko: string; ja: string }
  format: { en: string; ko: string; ja: string }
  imageSrc: string
  imageAlt: { en: string; ko: string; ja: string }
  imageCaption?: { en: string; ko: string; ja: string }
  placeKind: "official" | "editorial"
}>

export type OndoBTable = OndoTable & { presentation: OndoBTablePresentation }

export type TableRuntime = {
  availability: TableAvailabilityState
  membership: TableMembershipState
  failure: TableFailureState
  chatAccess: ChatAccessState
}

/**
 * The standalone B experience uses the same canonical four-axis model as the
 * shared ONDO surface. It remains outside TABLES because its venue comes from
 * the public LOCALDATA catalogue rather than the legacy fixture registry.
 */
export const ONDO_B_TABLE: OndoBTable = {
  id: "table-seoul-night-bites",
  venueId: "mois-0021cd596bc5b2a922ad",
  title: { en: "Night bites, one shared table", ko: "야식 한 상, 함께 앉는 테이블" },
  startsAt: "2026-09-18T20:30:00+09:00",
  hostName: "Min",
  hostRole: { en: "Host · self-declared", ko: "호스트 · 직접 입력" },
  seatsTaken: 3,
  seatsTotal: 4,
  languages: ["한국어", "English"],
  estimatedPriceKRW: 18_000,
  alcohol: true,
  status: "open",
  menu: { en: "Two savoury plates to share", ko: "짭짤한 요리 두 가지를 함께 나눠요" },
  format: { en: "Shared plates", ko: "함께 나누는 요리" },
  requiresPerson: false,
  availability: "TAV-OPEN",
  fixtureId: "FX-TBL-ALCOHOL",
  presentation: {
    city: { en: "Seoul", ko: "서울", ja: "ソウル" },
    title: { en: "Night bites, one shared table", ko: "야식 한 상, 함께 앉는 테이블", ja: "夜のひと皿を囲むTable" },
    subtitle: { en: "A relaxed Friday meal in Gangnam", ko: "강남에서 가볍게 나누는 금요일 저녁", ja: "江南で気軽に楽しむ金曜の夕食" },
    menu: { en: "Share two savoury plates; order together", ko: "짭짤한 요리 두 가지를 함께 주문해 나눠요", ja: "料理を2品、一緒に注文してシェア" },
    format: { en: "Shared plates", ko: "함께 나누는 요리", ja: "料理をシェア" },
    imageSrc: "/editorial/people/ondo-tables-dinner-v2-landscape.jpg",
    imageAlt: { en: "Friends sharing dinner at one table", ko: "한 테이블에서 저녁을 나누는 사람들", ja: "ひとつのテーブルで夕食を囲む人々" },
    placeKind: "official",
  },
}

/**
 * A Jeju Table is an ONDO meal plan anchored to a source-verified editorial
 * place. It never upgrades that VISITKOREA place into an official LOCALDATA
 * record and it does not claim a restaurant reservation was transmitted.
 */
export const ONDO_B_JEJU_TABLE: OndoBTable = {
  id: "table-jeju-haenyeo-supper",
  venueId: "jeju-haenyeo-kitchen-bukchon",
  title: { en: "Haenyeo stories over dinner", ko: "해녀 이야기와 함께하는 저녁" },
  startsAt: "2026-09-18T18:30:00+09:00",
  hostName: "Sora",
  hostRole: { en: "Host · self-declared", ko: "호스트 · 직접 입력" },
  seatsTaken: 2,
  seatsTotal: 4,
  languages: ["한국어", "English", "日本語"],
  estimatedPriceKRW: 32_000,
  alcohol: false,
  status: "open",
  menu: { en: "A shared Jeju seafood set", ko: "함께 나누는 제주 해산물 한 상" },
  format: { en: "Shared dinner", ko: "함께하는 저녁" },
  requiresPerson: false,
  availability: "TAV-OPEN",
  fixtureId: "FX-TBL-JEJU-HAENYEO",
  presentation: {
    city: { en: "Jeju", ko: "제주", ja: "済州" },
    title: { en: "Haenyeo stories over dinner", ko: "해녀 이야기와 함께하는 저녁", ja: "海女の物語を囲む夕食" },
    subtitle: { en: "A small evening table in Bukchon", ko: "북촌에서 만나는 작은 저녁 테이블", ja: "北村で囲む小さな夕食のTable" },
    menu: { en: "Choose a Jeju dinner together", ko: "제주 저녁 메뉴를 함께 골라요", ja: "済州の夕食メニューを一緒に選択" },
    format: { en: "Shared dinner", ko: "함께하는 저녁", ja: "夕食をシェア" },
    imageSrc: "/editorial/food/ondo-category-specialty-v1.jpg",
    imageAlt: { en: "Food mood for a shared Korean meal", ko: "함께하는 한식 식사의 분위기 이미지", ja: "韓国料理を囲む食事のイメージ" },
    imageCaption: { en: "Editorial image", ko: "에디토리얼 이미지", ja: "編集イメージ" },
    placeKind: "editorial",
  },
}

/** A prepared Busan plan, not a partnership or a restaurant booking. */
export const ONDO_B_BUSAN_TABLE: OndoBTable = {
  ...ONDO_B_JEJU_TABLE,
  id: "table-busan-gijang-dinner",
  venueId: "mois-03041681b54ea5399763",
  title: { en: "A small dinner in Gijang", ko: "기장에서 나누는 저녁" },
  hostName: "Jin",
  estimatedPriceKRW: 20_000,
  fixtureId: "FX-TBL-BUSAN-DINNER",
  menu: { en: "Choose a Korean dinner together", ko: "한식 저녁 메뉴를 함께 골라요" },
  presentation: {
    ...ONDO_B_JEJU_TABLE.presentation,
    city: { en: "Busan", ko: "부산", ja: "釜山" },
    title: { en: "A small dinner in Gijang", ko: "기장에서 나누는 저녁", ja: "機張で囲む小さな夕食" },
    subtitle: { en: "A relaxed evening in Busan", ko: "부산에서 가볍게 나누는 저녁", ja: "釜山で気軽に囲む夕食" },
    menu: { en: "Choose a Korean dinner together", ko: "한식 저녁 메뉴를 함께 골라요", ja: "韓国料理を一緒に選択" },
    placeKind: "official",
  },
}

export const ONDO_B_TABLES: readonly OndoBTable[] = Object.freeze([
  ONDO_B_TABLE,
  ONDO_B_JEJU_TABLE,
  ONDO_B_BUSAN_TABLE,
])

const KST_OFFSET_MS = 9 * 60 * 60 * 1_000
const EN_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const
const EN_WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const KO_WEEKDAY = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"] as const
const JA_WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"] as const

export type OndoBTableTimeline = Readonly<{
  startsAtMs: number
  startsAt: string
  schedule: string
}>

/**
 * The product timeline rolls the canonical Seoul date forward. Preserve each
 * Table's own KST time-of-day (Jeju is 18:30, Seoul is 20:30) while sharing that
 * rolling date, so cards, detail, expiry, and mutation guards all use one
 * table-specific instant.
 */
export function ondoBTableTimeline(
  table: OndoBTable,
  productTimeline: OndoBProductTimeline,
  locale: OndoBProductTimelineLocale,
): OndoBTableTimeline {
  const canonicalSeedMs = Date.parse(ONDO_B_TABLE.startsAt)
  const tableSeedMs = Date.parse(table.startsAt)
  const offsetMs = Number.isFinite(tableSeedMs) && Number.isFinite(canonicalSeedMs)
    ? tableSeedMs - canonicalSeedMs
    : 0
  const startsAtMs = productTimeline.tableStartsAtMs + offsetMs
  const kst = new Date(startsAtMs + KST_OFFSET_MS)
  const month = kst.getUTCMonth()
  const day = kst.getUTCDate()
  const weekday = kst.getUTCDay()
  const time = `${String(kst.getUTCHours()).padStart(2, "0")}:${String(kst.getUTCMinutes()).padStart(2, "0")}`
  const schedule = locale === "ko"
    ? `${month + 1}월 ${day}일 ${KO_WEEKDAY[weekday]} · ${time} KST`
    : locale === "ja"
      ? `${month + 1}月${day}日（${JA_WEEKDAY[weekday]}）・${time} KST`
      : `${EN_WEEKDAY[weekday]}, ${EN_MONTH[month]} ${day} · ${time} KST`
  return {
    startsAtMs,
    startsAt: new Date(startsAtMs).toISOString(),
    schedule,
  }
}

export function ondoBTableById(value: unknown) {
  return typeof value === "string" ? ONDO_B_TABLES.find((table) => table.id === value) : undefined
}

export function initialTableRuntime(table: OndoTable, membership: string | undefined): TableRuntime {
  const canonicalMembership = toCanonicalMembership(membership)
  return {
    availability: table.availability,
    membership: canonicalMembership,
    failure: table.availability === "TAV-FULL" ? "TFR-FULL" : table.availability === "TAV-CANCELLED" ? "TFR-CANCELLED" : "TFR-NONE",
    chatAccess: canOpenChat(canonicalMembership, table.availability) ? "CHA-OPEN" : "CHA-LOCKED",
  }
}

export function toCanonicalMembership(value?: string): TableMembershipState {
  const values: Record<string, TableMembershipState> = {
    none: "TMB-NONE",
    requesting: "TMB-REQUESTING",
    confirmed: "TMB-CONFIRMED",
    checked_in: "TMB-CHECKED-IN",
    completed: "TMB-COMPLETED",
    left: "TMB-LEFT",
    failed: "TMB-FAILED",
  }
  return values[value ?? "none"] ?? "TMB-NONE"
}

export function canOpenChat(membership: TableMembershipState, availability: TableAvailabilityState) {
  return availability !== "TAV-CANCELLED"
    && ["TMB-CONFIRMED", "TMB-CHECKED-IN", "TMB-COMPLETED"].includes(membership)
}

export type TableRuntimeEvent =
  | { type: "RESTORE_MEMBERSHIP"; membership: TableMembershipState }
  | { type: "AVAILABILITY_CHANGED"; availability: TableAvailabilityState }
  | { type: "REQUEST_JOIN" }
  | { type: "JOIN_CONFIRMED" }
  | { type: "JOIN_FAILED"; reason: "network" | "policy" | "full" }
  | { type: "ORGANIZER_CANCELLED" }
  | { type: "LEAVE" }
  | { type: "CHECK_IN" }
  | { type: "COMPLETE" }

const ACTIVE_MEMBERSHIPS = new Set<TableMembershipState>(["TMB-CONFIRMED", "TMB-CHECKED-IN", "TMB-COMPLETED"])

function runtimeWith(
  availability: TableAvailabilityState,
  membership: TableMembershipState,
  failure: TableFailureState,
): TableRuntime {
  const cancelledMembership = availability === "TAV-CANCELLED" && ACTIVE_MEMBERSHIPS.has(membership)
    ? "TMB-LEFT"
    : membership
  return {
    availability,
    membership: cancelledMembership,
    failure: availability === "TAV-CANCELLED" ? "TFR-CANCELLED" : failure,
    chatAccess: canOpenChat(cancelledMembership, availability) ? "CHA-OPEN" : "CHA-LOCKED",
  }
}

/**
 * Canonical Table transition boundary. Availability, membership, failure and
 * chat access remain independently inspectable, while chat access is always
 * re-derived after an allowed transition. Illegal transitions are no-ops.
 */
export function reduceTableRuntime(current: TableRuntime, event: TableRuntimeEvent): TableRuntime {
  if (event.type === "RESTORE_MEMBERSHIP") {
    return runtimeWith(current.availability, event.membership, current.failure)
  }
  if (event.type === "AVAILABILITY_CHANGED") {
    const failure = event.availability === "TAV-FULL"
      ? "TFR-FULL"
      : event.availability === "TAV-CANCELLED"
        ? "TFR-CANCELLED"
        : current.failure === "TFR-FULL" || current.failure === "TFR-CANCELLED"
          ? "TFR-NONE"
          : current.failure
    return runtimeWith(event.availability, current.membership, failure)
  }
  if (event.type === "REQUEST_JOIN") {
    if (current.availability !== "TAV-OPEN" || !["TMB-NONE", "TMB-LEFT", "TMB-FAILED"].includes(current.membership)) return current
    return runtimeWith(current.availability, "TMB-REQUESTING", "TFR-NONE")
  }
  if (event.type === "JOIN_CONFIRMED") {
    if (current.availability !== "TAV-OPEN" || current.membership !== "TMB-REQUESTING") return current
    return runtimeWith(current.availability, "TMB-CONFIRMED", "TFR-NONE")
  }
  if (event.type === "JOIN_FAILED") {
    if (current.membership !== "TMB-REQUESTING") return current
    const availability = event.reason === "full" ? "TAV-FULL" : current.availability
    const failure = event.reason === "network" ? "TFR-NETWORK" : event.reason === "policy" ? "TFR-POLICY" : "TFR-FULL"
    return runtimeWith(availability, "TMB-FAILED", failure)
  }
  if (event.type === "ORGANIZER_CANCELLED") {
    const membership = ACTIVE_MEMBERSHIPS.has(current.membership) || current.membership === "TMB-REQUESTING"
      ? "TMB-LEFT"
      : current.membership
    return runtimeWith("TAV-CANCELLED", membership, "TFR-CANCELLED")
  }
  if (event.type === "LEAVE") {
    if (!ACTIVE_MEMBERSHIPS.has(current.membership) && current.membership !== "TMB-REQUESTING") return current
    return runtimeWith(current.availability, "TMB-LEFT", "TFR-CANCELLED")
  }
  if (event.type === "CHECK_IN") {
    return current.membership === "TMB-CONFIRMED"
      ? runtimeWith(current.availability, "TMB-CHECKED-IN", current.failure)
      : current
  }
  if (event.type === "COMPLETE") {
    return current.membership === "TMB-CHECKED-IN"
      ? runtimeWith(current.availability, "TMB-COMPLETED", current.failure)
      : current
  }
  return current
}

export function joinFailureRuntime(table: OndoTable, reason: "network" | "policy" | "full"): TableRuntime {
  return {
    availability: reason === "full" ? "TAV-FULL" : table.availability,
    membership: "TMB-FAILED",
    failure: reason === "network" ? "TFR-NETWORK" : reason === "policy" ? "TFR-POLICY" : "TFR-FULL",
    chatAccess: "CHA-LOCKED",
  }
}

export function tableStatusCopy(table: OndoTable, locale: Locale) {
  if (table.availability === "TAV-FULL") return locale === "ko" ? "지금은 저장할 수 없는 계획이에요." : "This plan is unavailable right now."
  if (table.availability === "TAV-CLOSED") return locale === "ko" ? "이미 종료된 계획이에요." : "This plan has already ended."
  if (table.availability === "TAV-CANCELLED") return locale === "ko" ? "이 계획은 취소됐어요." : "This plan was cancelled."
  return locale === "ko" ? "저장 가능한 계획" : "Plan available"
}
