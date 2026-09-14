import { resolveCommercePlaceB } from "../commerce-b/place-service-registry-b"

/** Venue booking is separate from saving an ONDO meal plan. All inventory here
 * is prepared sample inventory, never the availability of a real restaurant. */
export const RESERVATION_SAMPLE_KEY = "ondo-b.reservation-sample.v1"
export const OPEN_RESERVATION_SAMPLE_EVENT = "ondo:b:open-reservation-sample"
export const RESERVATION_SAMPLE_CHANGE_EVENT = "ondo:b:reservation-sample-change"
export const RESERVATION_CITIES = ["seoul", "busan", "jeju"] as const
export type ReservationCityB = typeof RESERVATION_CITIES[number]
export type ReservationOutcomeB = "success" | "full" | "failure" | "unknown"
export type ReservationDraftB = {
  city: ReservationCityB; date: string; time: string; party: number
  venueId?: string
  venueName?: Readonly<Record<"en" | "ko" | "ja", string>>
}
export type ReservationRecordB = {
  version: 1
  draft: ReservationDraftB
  phase: "draft" | "requesting" | "confirmed" | "full" | "failed" | "unknown" | "cancelling" | "cancel_failed" | "cancel_unknown" | "cancelled"
  operationId: string | null
  confirmationRef: string | null
}
export type ReservationStateB = ReservationRecordB & { history: ReservationRecordB[] }
export type ReservationActionB =
  | { type: "edit"; draft: ReservationDraftB }
  | { type: "select_place"; venueId: string; now?: number }
  | { type: "submit"; operationId: string }
  | { type: "resolve"; operationId: string; outcome: ReservationOutcomeB }
  | { type: "query" }
  | { type: "cancel" }
  | { type: "resolve_cancel"; operationId: string; outcome: "success" | "failure" | "unknown" }

export function reservationSampleDatesB(now = Date.now()) {
  const kst = new Date(now + 9 * 60 * 60 * 1000)
  const start = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())
  return [1, 2, 3].map(days => new Date(start + days * 86400000).toISOString().slice(0, 10))
}
export function validReservationDraftB(value: unknown): value is ReservationDraftB {
  if (!value || typeof value !== "object") return false
  const draft = value as ReservationDraftB
  const place = resolveCommercePlaceB(draft.venueId)
  const validPlace = draft.venueId === undefined && draft.venueName === undefined
    || Boolean(place?.reservation && place.cityId === draft.city && draft.venueName
      && (["en", "ko", "ja"] as const).every(locale => draft.venueName?.[locale] === place.name[locale]))
  return validPlace && RESERVATION_CITIES.includes(draft.city) && /^\d{4}-\d{2}-\d{2}$/.test(draft.date)
    && Number.isFinite(Date.parse(`${draft.date}T00:00:00+09:00`))
    && ["18:00", "18:30", "19:00"].includes(draft.time) && Number.isInteger(draft.party) && draft.party >= 1 && draft.party <= 4
}
export function initialReservationB(city: ReservationCityB = "seoul", now = Date.now()): ReservationStateB {
  return { version: 1, draft: { city, date: reservationSampleDatesB(now)[0], time: "18:30", party: 2 }, phase: "draft", operationId: null, confirmationRef: null, history: [] }
}

function recordOnly(state: ReservationRecordB): ReservationRecordB {
  return { version: 1, draft: { ...state.draft, ...(state.draft.venueName ? { venueName: { ...state.draft.venueName } } : {}) },
    phase: state.phase, operationId: state.operationId, confirmationRef: state.confirmationRef }
}

/** Each place owns its request. Switching never relabels a prior result, and
 * an interrupted sample request stays queryable in that place's history. */
export function selectReservationPlaceB(state: ReservationStateB, venueId: string, now = Date.now()): ReservationStateB {
  const place = resolveCommercePlaceB(venueId)
  if (!place?.reservation || state.draft.venueId === place.id) return state
  const previous = restoreReservationRecordB(recordOnly(state))!
  const history = state.history.filter(record => record.draft.venueId !== place.id
    && !(record.draft.venueId === previous.draft.venueId && record.draft.city === previous.draft.city))
  if (previous.operationId || previous.draft.venueId) history.push(previous)
  const restored = state.history.find(record => record.draft.venueId === place.id)
  const next = restored ?? { ...recordOnly(initialReservationB(place.cityId, now)),
    draft: { ...initialReservationB(place.cityId, now).draft, venueId: place.id, venueName: { ...place.name } } }
  return { ...recordOnly(next), history }
}
export function reduceReservationB(state: ReservationStateB, action: ReservationActionB): ReservationStateB {
  if (action.type === "select_place") return selectReservationPlaceB(state, action.venueId, action.now)
  if (action.type === "edit") {
    if (!["draft", "full", "failed", "cancelled"].includes(state.phase) || !validReservationDraftB(action.draft)) return state
    if (state.draft.venueId !== action.draft.venueId) return state
    return { ...state, draft: { ...action.draft }, phase: "draft", operationId: null, confirmationRef: null }
  }
  if (action.type === "submit") {
    if (!["draft", "full", "failed", "cancelled"].includes(state.phase) || !/^sample-booking-[a-z0-9-]{1,80}$/.test(action.operationId)) return state
    return { ...state, phase: "requesting", operationId: action.operationId, confirmationRef: null }
  }
  if (action.type === "resolve") {
    if (state.phase !== "requesting" || state.operationId !== action.operationId) return state
    return { ...state, phase: action.outcome === "success" ? "confirmed" : action.outcome === "failure" ? "failed" : action.outcome,
      confirmationRef: action.outcome === "success" ? `SAMPLE-${action.operationId.slice(-8).toUpperCase()}` : null }
  }
  if (action.type === "query") {
    // An unknown response never starts a new order. Query the existing one.
    if (state.phase === "unknown") return { ...state, phase: "requesting" }
    if (state.phase === "cancel_unknown") return { ...state, phase: "cancelling" }
    return state
  }
  if (action.type === "cancel") return ["confirmed", "cancel_failed"].includes(state.phase) ? { ...state, phase: "cancelling" } : state
  if (state.phase !== "cancelling" || action.operationId !== state.operationId) return state
  return { ...state, phase: action.outcome === "success" ? "cancelled" : action.outcome === "failure" ? "cancel_failed" : "cancel_unknown" }
}
function restoreReservationRecordB(value: unknown): ReservationRecordB | null {
  if (!value || typeof value !== "object") return null
  const state = value as ReservationStateB
  const phases = ["draft", "requesting", "confirmed", "full", "failed", "unknown", "cancelling", "cancel_failed", "cancel_unknown", "cancelled"]
  if (state.version !== 1 || !validReservationDraftB(state.draft) || !phases.includes(state.phase)) return null
  if (state.phase !== "draft" && (typeof state.operationId !== "string" || !/^sample-booking-[a-z0-9-]{1,80}$/.test(state.operationId))) return null
  if (["confirmed", "cancelling", "cancel_failed", "cancel_unknown", "cancelled"].includes(state.phase)
    && (typeof state.confirmationRef !== "string" || !/^SAMPLE-[A-Z0-9-]{8}$/.test(state.confirmationRef))) return null
  return { version: 1, draft: { city: state.draft.city, date: state.draft.date, time: state.draft.time, party: state.draft.party,
    ...(state.draft.venueId ? { venueId: state.draft.venueId, venueName: { ...state.draft.venueName! } } : {}) },
    phase: state.phase === "requesting" ? "unknown" : state.phase === "cancelling" ? "cancel_unknown" : state.phase,
    operationId: state.phase === "draft" ? null : state.operationId, confirmationRef: state.confirmationRef ?? null }
}

export function restoreReservationB(value: unknown): ReservationStateB | null {
  const record = restoreReservationRecordB(value)
  if (!record) return null
  const storedHistory = (value as Partial<ReservationStateB>).history
  if (storedHistory !== undefined && (!Array.isArray(storedHistory) || storedHistory.length > 100)) return null
  const history = (storedHistory ?? []).map(restoreReservationRecordB)
  if (history.some(entry => !entry)) return null
  const records = history as ReservationRecordB[]
  const keys = records.map(entry => `${entry.draft.venueId ?? "sample-city"}:${entry.draft.city}`)
  if (new Set(keys).size !== keys.length || keys.includes(`${record.draft.venueId ?? "sample-city"}:${record.draft.city}`)) return null
  return { ...record, history: records }
}

export function requestReservationSampleB(context?: ReservationCityB | { venueId: string }) {
  if (typeof window === "undefined") return false
  if (typeof context === "object" && !resolveCommercePlaceB(context.venueId)?.reservation) return false
  window.dispatchEvent(new CustomEvent(OPEN_RESERVATION_SAMPLE_EVENT, { detail: typeof context === "object" ? context : { city: context } }))
  return true
}
