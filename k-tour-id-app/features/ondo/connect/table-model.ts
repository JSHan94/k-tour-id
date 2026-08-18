import type { Locale, PulseTable } from "../contracts/domain"

export type TableAvailabilityState = "TAV-OPEN" | "TAV-FULL" | "TAV-CLOSED" | "TAV-CANCELLED"
export type TableMembershipState = "TMB-NONE" | "TMB-REQUESTING" | "TMB-CONFIRMED" | "TMB-CHECKED-IN" | "TMB-COMPLETED" | "TMB-LEFT" | "TMB-FAILED"
export type TableFailureState = "TFR-NONE" | "TFR-FULL" | "TFR-NETWORK" | "TFR-POLICY" | "TFR-CANCELLED"
export type ChatAccessState = "CHA-LOCKED" | "CHA-OPEN"

export type OndoTable = PulseTable & {
  menu: { en: string; ko: string }
  requiresPerson: boolean
  availability: TableAvailabilityState
  fixtureId: string
}

export type TableRuntime = {
  availability: TableAvailabilityState
  membership: TableMembershipState
  failure: TableFailureState
  chatAccess: ChatAccessState
}

export const TABLES: OndoTable[] = [
  {
    id: "table-seongsu-dinner",
    venueId: "seoul-seongsu-gukbap",
    title: { en: "First gukbap together", ko: "처음 먹는 국밥 같이" },
    startsAt: "2026-08-19T19:30:00+09:00",
    hostName: "Jieun",
    hostRole: { en: "Area regular · self-declared", ko: "지역 단골 · 직접 입력" },
    seatsTaken: 2,
    seatsTotal: 5,
    languages: ["한국어", "English"],
    estimatedPriceKRW: 15_000,
    alcohol: false,
    status: "open",
    menu: { en: "Pork soup, rice and shared sides", ko: "돼지국밥, 공깃밥, 함께 먹는 반찬" },
    requiresPerson: false,
    availability: "TAV-OPEN",
    fixtureId: "FX-TBL-SEOUL-DINNER",
  },
  {
    id: "table-euljiro-night",
    venueId: "seoul-euljiro-nogari",
    title: { en: "Euljiro night bites", ko: "을지로 야식 한 상" },
    startsAt: "2026-08-19T20:30:00+09:00",
    hostName: "Minjun",
    hostRole: { en: "Frequent visitor · self-declared", ko: "자주 방문함 · 직접 입력" },
    seatsTaken: 3,
    seatsTotal: 5,
    languages: ["English", "日本語"],
    estimatedPriceKRW: 25_000,
    alcohol: true,
    status: "open",
    menu: { en: "Dried pollack, fried snacks and optional beer", ko: "노가리, 튀김과 선택 주류" },
    requiresPerson: true,
    availability: "TAV-OPEN",
    fixtureId: "FX-TBL-ALCOHOL",
  },
  {
    id: "table-mangwon-full",
    venueId: "seoul-mangwon-kalguksu",
    title: { en: "Mangwon market lunch", ko: "망원시장 점심 한 상" },
    startsAt: "2026-08-20T12:30:00+09:00",
    hostName: "Hana",
    hostRole: { en: "Market regular · self-declared", ko: "시장 단골 · 직접 입력" },
    seatsTaken: 4,
    seatsTotal: 4,
    languages: ["한국어", "English"],
    estimatedPriceKRW: 12_000,
    alcohol: false,
    status: "full",
    menu: { en: "Kalguksu and market snacks", ko: "칼국수와 시장 간식" },
    requiresPerson: false,
    availability: "TAV-FULL",
    fixtureId: "FX-TBL-JOIN-FAIL",
  },
  {
    id: "table-busan-closed",
    venueId: "busan-jagalchi-grill",
    title: { en: "Jagalchi grilled fish", ko: "자갈치 생선구이 한 상" },
    startsAt: "2026-08-18T18:30:00+09:00",
    hostName: "Sora",
    hostRole: { en: "Busan resident · self-declared", ko: "부산 거주 · 직접 입력" },
    seatsTaken: 3,
    seatsTotal: 4,
    languages: ["한국어", "English"],
    estimatedPriceKRW: 22_000,
    alcohol: false,
    status: "closed",
    menu: { en: "Grilled fish and seasonal sides", ko: "생선구이와 제철 반찬" },
    requiresPerson: false,
    availability: "TAV-CLOSED",
    fixtureId: "FX-TBL-CANCEL",
  },
  {
    id: "table-seongsu-cancelled",
    venueId: "seoul-seongsu-gukbap",
    title: { en: "Late soup stop", ko: "늦은 국밥 한 끼" },
    startsAt: "2026-08-19T22:00:00+09:00",
    hostName: "Yuna",
    hostRole: { en: "Host · self-declared", ko: "호스트 · 직접 입력" },
    seatsTaken: 1,
    seatsTotal: 4,
    languages: ["한국어", "English"],
    estimatedPriceKRW: 14_000,
    alcohol: false,
    status: "cancelled",
    menu: { en: "Soup and rice", ko: "국밥과 공깃밥" },
    requiresPerson: false,
    availability: "TAV-CANCELLED",
    fixtureId: "FX-TBL-CANCEL",
  },
]

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

export function joinFailureRuntime(table: OndoTable, reason: "network" | "policy" | "full"): TableRuntime {
  return {
    availability: reason === "full" ? "TAV-FULL" : table.availability,
    membership: "TMB-FAILED",
    failure: reason === "network" ? "TFR-NETWORK" : reason === "policy" ? "TFR-POLICY" : "TFR-FULL",
    chatAccess: "CHA-LOCKED",
  }
}

export function tableStatusCopy(table: OndoTable, locale: Locale) {
  if (table.availability === "TAV-FULL") return locale === "ko" ? "자리가 모두 찼어요." : "This Table is full."
  if (table.availability === "TAV-CLOSED") return locale === "ko" ? "이미 종료된 Table이에요." : "This Table has already ended."
  if (table.availability === "TAV-CANCELLED") return locale === "ko" ? "이 Table은 취소됐어요." : "This Table was cancelled."
  return locale === "ko" ? `${table.seatsTotal - table.seatsTaken}자리 남음` : `${table.seatsTotal - table.seatsTaken} seats left`
}
