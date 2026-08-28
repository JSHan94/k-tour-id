import { isCanonicalVenueId } from "@/lib/ondo/venues/canonical-allowlist"
import { canonicalMapVenueById } from "@/lib/ondo/venues/map-data"

export const PLACE_AFTER19_RETURN_TTL_MS = 15 * 60 * 1000
export const PLACE_AFTER19_RETURN_SESSION_KEY = "ondo-b.after19.place-return.v1"
export const PLACE_AFTER19_RETURN_REQUEST_EVENT = "ondo:b:after19-place-return-request"
export const PLACE_AFTER19_RETURN_COMPLETE_EVENT = "ondo:b:after19-place-return-complete"

export type PlaceAfter19CityB = "seoul" | "busan" | "jeju"
export type PlaceAfter19ViewB = "map" | "list"
export type PlaceAfter19CategoryB = "all" | "korean" | "casual" | "japanese" | "chinese" | "global" | "night" | "specialty"

export type PlaceAfter19ReturnB = {
  version: 1
  tokenId: string
  cta: "OPEN_AFTER19"
  createdAt: string
  expiresAt: string
  consumedAt: string | null
  venueId: string
  cityId: PlaceAfter19CityB
  level: "detail"
  view: PlaceAfter19ViewB
  query: string
  category: PlaceAfter19CategoryB
  focusTarget: "canonical-after19-access"
}

export type PlaceAfter19ReturnOutcomeB = "success" | "cancel"

export type ConsumedPlaceAfter19ReturnB = Omit<PlaceAfter19ReturnB, "consumedAt"> & {
  consumedAt: string
}

export type PlaceAfter19ConsumptionB = {
  tokenId: string
  cta: "OPEN_AFTER19"
  outcome: PlaceAfter19ReturnOutcomeB
  consumedAt: string
}

export type PlaceAfter19ReturnSessionB = {
  version: 1
  pending: PlaceAfter19ReturnB | null
  lastConsumed: PlaceAfter19ConsumptionB | null
}

type ReadStorage = Pick<Storage, "getItem">
type WriteStorage = Pick<Storage, "getItem" | "setItem">

export const DEFAULT_PLACE_AFTER19_RETURN_SESSION: PlaceAfter19ReturnSessionB = {
  version: 1,
  pending: null,
  lastConsumed: null,
}

const VENUE_ID_PATTERN = /^mois-[a-z0-9]{20}$/
const TOKEN_PATTERN = /^RT-OPEN_AFTER19-(\d{13})-([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
const RETURN_KEYS = new Set([
  "version", "tokenId", "cta", "createdAt", "expiresAt", "consumedAt",
  "venueId", "cityId", "level", "view", "query", "category", "focusTarget",
])
const SESSION_KEYS = new Set(["version", "pending", "lastConsumed"])
const CONSUMPTION_KEYS = new Set(["tokenId", "cta", "outcome", "consumedAt"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: ReadonlySet<string>) {
  const own = Object.keys(value)
  return own.length === keys.size && own.every((key) => keys.has(key))
}

function cityValue(value: unknown): value is PlaceAfter19CityB {
  return value === "seoul" || value === "busan" || value === "jeju"
}

function categoryValue(value: unknown): value is PlaceAfter19CategoryB {
  return value === "all" || value === "korean" || value === "casual" || value === "japanese"
    || value === "chinese" || value === "global" || value === "night" || value === "specialty"
}

function parse(storage: ReadStorage): unknown {
  try {
    const raw = storage.getItem(PLACE_AFTER19_RETURN_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isPlaceAfter19ReturnStructurallyValid(value: unknown): value is PlaceAfter19ReturnB {
  if (!isRecord(value) || !hasExactKeys(value, RETURN_KEYS)) return false
  if (value.version !== 1 || value.cta !== "OPEN_AFTER19" || value.consumedAt !== null) return false
  if (value.level !== "detail" || value.focusTarget !== "canonical-after19-access") return false
  if (!cityValue(value.cityId) || (value.view !== "map" && value.view !== "list") || !categoryValue(value.category)) return false
  if (typeof value.query !== "string" || value.query.length > 120) return false
  // Creation requires a current allowlisted venue. Restoration deliberately
  // accepts the canonical ID grammar so a venue removed by a later catalogue
  // can still resolve to its stored city fallback without trusting arbitrary IDs.
  if (typeof value.venueId !== "string" || !VENUE_ID_PATTERN.test(value.venueId)) return false

  const createdAt = typeof value.createdAt === "string" ? Date.parse(value.createdAt) : Number.NaN
  const expiresAt = typeof value.expiresAt === "string" ? Date.parse(value.expiresAt) : Number.NaN
  const token = typeof value.tokenId === "string" ? TOKEN_PATTERN.exec(value.tokenId) : null
  return Number.isFinite(createdAt)
    && Number.isFinite(expiresAt)
    && new Date(createdAt).toISOString() === value.createdAt
    && new Date(expiresAt).toISOString() === value.expiresAt
    && expiresAt - createdAt === PLACE_AFTER19_RETURN_TTL_MS
    && token !== null
    && Number(token[1]) === createdAt
}

export function isPlaceAfter19ReturnPending(value: unknown, now = new Date()): value is PlaceAfter19ReturnB {
  return isPlaceAfter19ReturnStructurallyValid(value) && Date.parse(value.expiresAt) > now.getTime()
}

export function createPlaceAfter19Return(input: {
  venueId: string
  cityId: PlaceAfter19CityB
  view: PlaceAfter19ViewB
  query: string
  category: PlaceAfter19CategoryB
  now?: Date
}): PlaceAfter19ReturnB {
  const venue = isCanonicalVenueId(input.venueId) ? canonicalMapVenueById(input.venueId) : null
  if (!venue || venue.cityId !== input.cityId) throw new Error("Invalid canonical Place After 19 return venue")
  if ((input.view !== "map" && input.view !== "list") || !categoryValue(input.category) || typeof input.query !== "string") {
    throw new Error("Invalid canonical Place After 19 return context")
  }
  const now = input.now ?? new Date()
  const createdAt = now.toISOString()
  return {
    version: 1,
    tokenId: `RT-OPEN_AFTER19-${now.getTime()}-${globalThis.crypto.randomUUID()}`,
    cta: "OPEN_AFTER19",
    createdAt,
    expiresAt: new Date(now.getTime() + PLACE_AFTER19_RETURN_TTL_MS).toISOString(),
    consumedAt: null,
    venueId: input.venueId,
    cityId: input.cityId,
    level: "detail",
    view: input.view,
    query: input.query.slice(0, 120),
    category: input.category,
    focusTarget: "canonical-after19-access",
  }
}

export function renewPlaceAfter19Return(value: PlaceAfter19ReturnB, now = new Date()) {
  if (!isPlaceAfter19ReturnStructurallyValid(value)) throw new Error("Invalid Place After 19 return")
  return createPlaceAfter19Return({
    venueId: value.venueId,
    cityId: value.cityId,
    view: value.view,
    query: value.query,
    category: value.category,
    now,
  })
}

function sanitizeConsumption(value: unknown): PlaceAfter19ConsumptionB | null {
  if (!isRecord(value) || !hasExactKeys(value, CONSUMPTION_KEYS)) return null
  const consumedAt = typeof value.consumedAt === "string" ? Date.parse(value.consumedAt) : Number.NaN
  if (value.cta !== "OPEN_AFTER19" || (value.outcome !== "success" && value.outcome !== "cancel")) return null
  if (typeof value.tokenId !== "string" || !TOKEN_PATTERN.test(value.tokenId) || !Number.isFinite(consumedAt)) return null
  return {
    tokenId: value.tokenId,
    cta: "OPEN_AFTER19",
    outcome: value.outcome,
    consumedAt: new Date(consumedAt).toISOString(),
  }
}

function sanitizeSession(value: unknown): PlaceAfter19ReturnSessionB {
  if (!isRecord(value) || !hasExactKeys(value, SESSION_KEYS) || value.version !== 1) return { ...DEFAULT_PLACE_AFTER19_RETURN_SESSION }
  return {
    version: 1,
    pending: isPlaceAfter19ReturnStructurallyValid(value.pending) ? value.pending : null,
    lastConsumed: sanitizeConsumption(value.lastConsumed),
  }
}

export function restorePlaceAfter19ReturnSession(storage: ReadStorage): PlaceAfter19ReturnSessionB {
  return sanitizeSession(parse(storage))
}

export function persistPlaceAfter19ReturnSession(storage: Pick<Storage, "setItem">, session: PlaceAfter19ReturnSessionB) {
  const sanitized = sanitizeSession(session)
  try {
    storage.setItem(PLACE_AFTER19_RETURN_SESSION_KEY, JSON.stringify(sanitized))
    return true
  } catch {
    return false
  }
}

export function stagePlaceAfter19Return(storage: WriteStorage, returnTo: PlaceAfter19ReturnB, now = new Date()) {
  if (!isPlaceAfter19ReturnPending(returnTo, now)) return false
  const latest = restorePlaceAfter19ReturnSession(storage)
  if (latest.pending && latest.pending.tokenId !== returnTo.tokenId && isPlaceAfter19ReturnPending(latest.pending, now)) return false
  return persistPlaceAfter19ReturnSession(storage, { version: 1, pending: returnTo, lastConsumed: null })
}

export function requestPlaceAfter19Return(returnTo: PlaceAfter19ReturnB, now = new Date()) {
  if (typeof window === "undefined" || !stagePlaceAfter19Return(window.sessionStorage, returnTo, now)) return false
  window.dispatchEvent(new CustomEvent(PLACE_AFTER19_RETURN_REQUEST_EVENT, { detail: { tokenId: returnTo.tokenId } }))
  return true
}

export function consumePendingPlaceAfter19Return(
  storage: WriteStorage,
  expected: Pick<PlaceAfter19ReturnB, "tokenId">,
  outcome: PlaceAfter19ReturnOutcomeB,
  now = new Date(),
): ConsumedPlaceAfter19ReturnB | null {
  const latest = restorePlaceAfter19ReturnSession(storage)
  if (!latest.pending || latest.pending.tokenId !== expected.tokenId) return null
  if (outcome === "success" && !isPlaceAfter19ReturnPending(latest.pending, now)) return null
  const consumed = { ...latest.pending, consumedAt: now.toISOString() }
  const lastConsumed: PlaceAfter19ConsumptionB = {
    tokenId: consumed.tokenId,
    cta: "OPEN_AFTER19",
    outcome,
    consumedAt: consumed.consumedAt,
  }
  return persistPlaceAfter19ReturnSession(storage, { version: 1, pending: null, lastConsumed }) ? consumed : null
}

export function completePlaceAfter19Return(returnTo: PlaceAfter19ReturnB, outcome: PlaceAfter19ReturnOutcomeB, now = new Date()) {
  if (typeof window === "undefined") return null
  const consumed = consumePendingPlaceAfter19Return(window.sessionStorage, returnTo, outcome, now)
  if (!consumed) return null
  window.dispatchEvent(new CustomEvent(PLACE_AFTER19_RETURN_COMPLETE_EVENT, { detail: { tokenId: consumed.tokenId, outcome } }))
  return consumed
}
