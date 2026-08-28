import { isCanonicalVenueId } from "@/lib/ondo/venues/canonical-allowlist"
import type { OndoBLocalSignalTag } from "../shared/state/ondo-b-provider"

export const B_ACTION_GATE_TTL_MS = 15 * 60 * 1000
export const B_ACTION_AXIS_TTL_MS = 60 * 60 * 1000
export const B_ACTION_GATE_SESSION_KEY = "ondo-b.action-gates.v1"
export const B_ACTION_GATE_REQUEST_EVENT = "ondo:b:action-gate-request"
export const B_ACTION_GATE_READY_EVENT = "ondo:b:action-gate-ready"
export const B_ACTION_GATE_COMPLETE_EVENT = "ondo:b:action-gate-complete"
export const B_ACTION_GATE_CANCEL_EVENT = "ondo:b:action-gate-cancel"
export const B_ACTION_AXIS_SESSION_EVENT = "ondo:b:action-axis-session"

export type BActionGateKind = "account" | "person" | "age" | "payment_kyc"
export type BActionGateCta = "JOIN_TABLE" | "SUBMIT_LOCAL_SIGNAL" | "START_CHECKOUT"
export type BPersonRouteB = "mobile_id_cx" | "mobile_residence_card" | "passport_ekyc"

type BActionReturnBase = {
  version: 1
  tokenId: string
  gatePlan: readonly BActionGateKind[]
  createdAt: string
  expiresAt: string
  consumedAt: string | null
}

export type BTableActionReturn = BActionReturnBase & {
  cta: "JOIN_TABLE"
  tableId: string
  venueId: string
  draft: string
}

export type BLocalSignalActionReturn = BActionReturnBase & {
  cta: "SUBMIT_LOCAL_SIGNAL"
  venueId: string
  draftNonce: string
  tags: OndoBLocalSignalTag[]
  note: string
}

export type BCheckoutActionReturn = BActionReturnBase & {
  cta: "START_CHECKOUT"
  venueId: string
  offerId: "meal-offer-gukbap"
}

export type BActionReturnTo = BTableActionReturn | BLocalSignalActionReturn | BCheckoutActionReturn

const TABLE_ID = /^table-[a-z0-9-]{1,80}$/
const DRAFT_NONCE = /^[a-z0-9:-]{1,180}$/i
const LOCAL_SIGNAL_TAGS = new Set<OndoBLocalSignalTag>(["calm_now", "lively_now", "quick_stop", "welcoming"])

export function gatePlanForBAction(cta: BActionGateCta): readonly BActionGateKind[] {
  if (cta === "JOIN_TABLE") return ["account", "age"]
  if (cta === "SUBMIT_LOCAL_SIGNAL") return ["account", "person"]
  return ["account", "payment_kyc"]
}

function base(cta: BActionGateCta, now: Date): BActionReturnBase {
  const createdAt = now.toISOString()
  return {
    version: 1,
    tokenId: `RT-${cta}-${now.getTime()}`,
    gatePlan: gatePlanForBAction(cta),
    createdAt,
    expiresAt: new Date(now.getTime() + B_ACTION_GATE_TTL_MS).toISOString(),
    consumedAt: null,
  }
}

export function createBTableActionReturn(input: { tableId: string; venueId: string; draft: string; now?: Date }): BTableActionReturn {
  if (!TABLE_ID.test(input.tableId) || !isCanonicalVenueId(input.venueId)) throw new Error("Invalid Table return context")
  const now = input.now ?? new Date()
  return { ...base("JOIN_TABLE", now), cta: "JOIN_TABLE", tableId: input.tableId, venueId: input.venueId, draft: input.draft.trim().slice(0, 280) }
}

export function createBLocalSignalActionReturn(input: {
  venueId: string
  draftNonce: string
  tags: readonly OndoBLocalSignalTag[]
  note: string
  now?: Date
}): BLocalSignalActionReturn {
  if (!isCanonicalVenueId(input.venueId) || !DRAFT_NONCE.test(input.draftNonce)) throw new Error("Invalid Local Signal return context")
  const now = input.now ?? new Date()
  return {
    ...base("SUBMIT_LOCAL_SIGNAL", now),
    cta: "SUBMIT_LOCAL_SIGNAL",
    venueId: input.venueId,
    draftNonce: input.draftNonce,
    tags: [...new Set(input.tags.filter((tag) => LOCAL_SIGNAL_TAGS.has(tag)))],
    note: input.note.slice(0, 240),
  }
}

export function createBCheckoutActionReturn(input: { venueId: string; now?: Date }): BCheckoutActionReturn {
  if (!isCanonicalVenueId(input.venueId)) throw new Error("Invalid checkout return context")
  const now = input.now ?? new Date()
  return { ...base("START_CHECKOUT", now), cta: "START_CHECKOUT", venueId: input.venueId, offerId: "meal-offer-gukbap" }
}

function samePlan(value: unknown, expected: readonly BActionGateKind[]) {
  return Array.isArray(value) && value.length === expected.length && value.every((gate, index) => gate === expected[index])
}

function hasExactKeys(candidate: Record<string, unknown>, specific: readonly string[]) {
  const baseKeys = ["version", "tokenId", "gatePlan", "createdAt", "expiresAt", "consumedAt", "cta", "venueId"]
  const expected = new Set([...baseKeys, ...specific])
  return Object.keys(candidate).length === expected.size && Object.keys(candidate).every((key) => expected.has(key))
}

export function isBActionReturnStructurallyValid(value: unknown): value is BActionReturnTo {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  if (candidate.version !== 1 || (candidate.cta !== "JOIN_TABLE" && candidate.cta !== "SUBMIT_LOCAL_SIGNAL" && candidate.cta !== "START_CHECKOUT")) return false
  const createdAt = typeof candidate.createdAt === "string" ? Date.parse(candidate.createdAt) : Number.NaN
  const expiresAt = typeof candidate.expiresAt === "string" ? Date.parse(candidate.expiresAt) : Number.NaN
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt) || expiresAt - createdAt !== B_ACTION_GATE_TTL_MS) return false
  if (candidate.tokenId !== `RT-${candidate.cta}-${createdAt}` || (candidate.consumedAt !== null && typeof candidate.consumedAt !== "string")) return false
  if (typeof candidate.consumedAt === "string") {
    const consumedAt = Date.parse(candidate.consumedAt)
    if (!Number.isFinite(consumedAt) || consumedAt < createdAt || consumedAt > expiresAt) return false
  }
  if (!samePlan(candidate.gatePlan, gatePlanForBAction(candidate.cta))) return false
  if (typeof candidate.venueId !== "string" || !isCanonicalVenueId(candidate.venueId)) return false
  if (candidate.cta === "JOIN_TABLE") return hasExactKeys(candidate, ["tableId", "draft"])
    && typeof candidate.tableId === "string" && TABLE_ID.test(candidate.tableId) && typeof candidate.draft === "string" && candidate.draft.length <= 280
  if (candidate.cta === "SUBMIT_LOCAL_SIGNAL") {
    return hasExactKeys(candidate, ["draftNonce", "tags", "note"])
      && typeof candidate.draftNonce === "string" && DRAFT_NONCE.test(candidate.draftNonce)
      && Array.isArray(candidate.tags) && candidate.tags.length <= LOCAL_SIGNAL_TAGS.size && new Set(candidate.tags).size === candidate.tags.length && candidate.tags.every((tag) => LOCAL_SIGNAL_TAGS.has(tag as OndoBLocalSignalTag))
      && typeof candidate.note === "string" && candidate.note.length <= 240
  }
  return hasExactKeys(candidate, ["offerId"]) && candidate.offerId === "meal-offer-gukbap"
}

export function isBActionReturnPending(value: unknown, now = new Date()): value is BActionReturnTo {
  return isBActionReturnStructurallyValid(value)
    && value.consumedAt === null
    && Date.parse(value.expiresAt) > now.getTime()
}

export function renewBActionReturnTo(value: BActionReturnTo, now = new Date()): BActionReturnTo {
  if (value.cta === "JOIN_TABLE") return createBTableActionReturn({ tableId: value.tableId, venueId: value.venueId, draft: value.draft, now })
  if (value.cta === "SUBMIT_LOCAL_SIGNAL") return createBLocalSignalActionReturn({ venueId: value.venueId, draftNonce: value.draftNonce, tags: value.tags, note: value.note, now })
  return createBCheckoutActionReturn({ venueId: value.venueId, now })
}

export function consumeBActionReturnTo(value: BActionReturnTo, satisfied: ReadonlySet<BActionGateKind>, now = new Date()): BActionReturnTo | null {
  if (!isBActionReturnPending(value, now) || value.gatePlan.some((gate) => !satisfied.has(gate))) return null
  return { ...value, consumedAt: now.toISOString() }
}

export function requestBActionGate(returnTo: BActionReturnTo) {
  if (typeof window === "undefined" || !isBActionReturnPending(returnTo)) return false
  try {
    const current = restoreBActionGateSession(window.sessionStorage)
    if (current.pending && isBActionReturnPending(current.pending) && current.pending.tokenId !== returnTo.tokenId) return false
    const personRoute = current.pending?.tokenId === returnTo.tokenId ? current.personRoute : null
    if (!persistBActionGateSession(window.sessionStorage, { ...current, pending: returnTo, personRoute, outcome: null })) return false
  } catch {
    return false
  }
  window.dispatchEvent(new CustomEvent(B_ACTION_GATE_REQUEST_EVENT, { detail: returnTo }))
  return true
}

export type BActionAxisStatus = "unverified" | "eligible" | "failed" | "unavailable" | "expired"
export type BActionAxis = { status: BActionAxisStatus; expiresAt: string | null }
export type BActionGateOutcome = {
  tokenId: string
  gate: BActionGateKind
  status: "failure" | "unavailable" | "expired"
}
export type BActionConsumptionMarker = {
  tokenId: string
  cta: BActionGateCta
  consumedAt: string
}
export type BPersonRouteSelectionB = {
  tokenId: string
  route: BPersonRouteB
}
export type BActionGateSession = {
  version: 1
  person: BActionAxis
  payment: BActionAxis
  pending: BActionReturnTo | null
  // A route is an explicit, non-sensitive choice scoped to one pending token.
  // It contains no nationality, residence status, document data, or provider result.
  personRoute: BPersonRouteSelectionB | null
  // Only a non-sensitive receipt is persisted across the synchronous
  // consume -> device-mutation boundary. Draft text, tags and place context
  // must never survive in the consumed slot.
  lastConsumed: BActionConsumptionMarker | null
  outcome: BActionGateOutcome | null
}

const blankAxis = (): BActionAxis => ({ status: "unverified", expiresAt: null })
export const DEFAULT_B_ACTION_GATE_SESSION: BActionGateSession = { version: 1, person: blankAxis(), payment: blankAxis(), pending: null, personRoute: null, lastConsumed: null, outcome: null }

function sanitizeAxis(value: unknown, now: Date): BActionAxis {
  if (!value || typeof value !== "object" || Array.isArray(value)) return blankAxis()
  const axis = value as Record<string, unknown>
  const expiry = typeof axis.expiresAt === "string" && Number.isFinite(Date.parse(axis.expiresAt)) ? new Date(axis.expiresAt).toISOString() : null
  if (axis.status === "eligible") return expiry && Date.parse(expiry) > now.getTime() ? { status: "eligible", expiresAt: expiry } : { status: "expired", expiresAt: null }
  return axis.status === "failed" || axis.status === "unavailable" || axis.status === "expired" ? { status: axis.status, expiresAt: null } : blankAxis()
}

function parse(storage: Pick<Storage, "getItem">, key: string): unknown {
  try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : null } catch { return null }
}

function sanitizeConsumptionMarker(value: unknown): BActionConsumptionMarker | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const cta = record.cta
  const consumedAt = typeof record.consumedAt === "string" ? Date.parse(record.consumedAt) : Number.NaN
  if ((cta !== "JOIN_TABLE" && cta !== "SUBMIT_LOCAL_SIGNAL" && cta !== "START_CHECKOUT")
    || typeof record.tokenId !== "string"
    || !Number.isFinite(consumedAt)) return null
  // Accept the previous full-envelope representation only to migrate it
  // one-way into this payload-free marker on the next persistence write.
  if (Object.keys(record).length !== 3 && !isBActionReturnStructurallyValid(value)) return null
  return { tokenId: record.tokenId, cta, consumedAt: new Date(consumedAt).toISOString() }
}

function sanitizePersonRoute(value: unknown, pending: BActionReturnTo | null): BPersonRouteSelectionB | null {
  if (!pending || !pending.gatePlan.includes("person") || !value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== 2 || record.tokenId !== pending.tokenId) return null
  if (record.route !== "mobile_id_cx" && record.route !== "mobile_residence_card" && record.route !== "passport_ekyc") return null
  return { tokenId: pending.tokenId, route: record.route }
}

function sanitizeBActionGateSession(value: unknown, now: Date): BActionGateSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...DEFAULT_B_ACTION_GATE_SESSION, person: blankAxis(), payment: blankAxis() }
  const record = value as Record<string, unknown>
  if (record.version !== 1) return { ...DEFAULT_B_ACTION_GATE_SESSION, person: blankAxis(), payment: blankAxis() }
  const pending = isBActionReturnStructurallyValid(record.pending) && record.pending.consumedAt === null ? record.pending : null
  const candidateOutcome = record.outcome && typeof record.outcome === "object" && !Array.isArray(record.outcome) ? record.outcome as Record<string, unknown> : null
  const outcome = pending && candidateOutcome?.tokenId === pending.tokenId
    && pending.gatePlan.includes(candidateOutcome.gate as BActionGateKind)
    && (candidateOutcome.status === "failure" || candidateOutcome.status === "unavailable" || candidateOutcome.status === "expired")
    ? { tokenId: pending.tokenId, gate: candidateOutcome.gate as BActionGateKind, status: candidateOutcome.status as BActionGateOutcome["status"] } satisfies BActionGateOutcome
    : null
  return {
    version: 1,
    person: sanitizeAxis(record.person, now),
    payment: sanitizeAxis(record.payment, now),
    pending,
    personRoute: sanitizePersonRoute(record.personRoute, pending),
    lastConsumed: sanitizeConsumptionMarker(record.lastConsumed),
    outcome,
  }
}

function migrateLegacyActionAxes(storage: Pick<Storage, "getItem">, now: Date): BActionGateSession {
  const legacy = parse(storage, "ondo.session.v3")
  if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) return { ...DEFAULT_B_ACTION_GATE_SESSION, person: blankAxis(), payment: blankAxis() }
  const record = legacy as Record<string, unknown>
  // The locked v3 session shape has no Person/Payment expiry fields. A verified
  // value can only come from this same browser tab, so migrate it once into a
  // bounded canonical TTL instead of inventing a nonexistent legacy timestamp.
  // The legacy record remains byte-for-byte untouched.
  const migratedExpiry = new Date(now.getTime() + B_ACTION_AXIS_TTL_MS).toISOString()
  const person = record.person === "PER-VERIFIED" ? { status: "eligible", expiresAt: migratedExpiry } satisfies BActionAxis : blankAxis()
  const payment = record.paymentKyc === "PKY-VERIFIED" ? { status: "eligible", expiresAt: migratedExpiry } satisfies BActionAxis : blankAxis()
  return { version: 1, person, payment, pending: null, personRoute: null, lastConsumed: null, outcome: null }
}

export function restoreBActionGateSession(storage: Pick<Storage, "getItem">, now = new Date()): BActionGateSession {
  let hasCurrent = false
  try { hasCurrent = storage.getItem(B_ACTION_GATE_SESSION_KEY) !== null } catch { return { ...DEFAULT_B_ACTION_GATE_SESSION, person: blankAxis(), payment: blankAxis() } }
  if (!hasCurrent) return migrateLegacyActionAxes(storage, now)
  const value = parse(storage, B_ACTION_GATE_SESSION_KEY)
  return sanitizeBActionGateSession(value, now)
}

export function persistBActionGateSession(storage: Pick<Storage, "setItem">, session: BActionGateSession, now = new Date()) {
  const sanitized = sanitizeBActionGateSession(session, now)
  try { storage.setItem(B_ACTION_GATE_SESSION_KEY, JSON.stringify(sanitized)); return true } catch { return false }
}

export function updateBActionAxisSession(
  storage: Pick<Storage, "getItem" | "setItem">,
  gate: "person" | "payment_kyc",
  status: BActionAxisStatus,
  now = new Date(),
): BActionGateSession | null {
  const current = restoreBActionGateSession(storage, now)
  const axis: BActionAxis = status === "eligible"
    ? { status, expiresAt: new Date(now.getTime() + B_ACTION_AXIS_TTL_MS).toISOString() }
    : { status, expiresAt: null }
  const next = {
    ...current,
    person: gate === "person" ? axis : current.person,
    payment: gate === "payment_kyc" ? axis : current.payment,
  }
  return persistBActionGateSession(storage, next) ? next : null
}

export function consumePendingBActionAtMutation(
  storage: Pick<Storage, "getItem" | "setItem">,
  expected: BActionReturnTo,
  satisfied: ReadonlySet<BActionGateKind>,
  now = new Date(),
): BActionReturnTo | null {
  const latest = restoreBActionGateSession(storage, now)
  if (!latest.pending || latest.pending.tokenId !== expected.tokenId) return null
  const consumed = consumeBActionReturnTo(latest.pending, satisfied, now)
  if (!consumed) return null
  const lastConsumed: BActionConsumptionMarker = { tokenId: consumed.tokenId, cta: consumed.cta, consumedAt: consumed.consumedAt! }
  const next = { ...latest, pending: null, personRoute: null, lastConsumed, outcome: null }
  return persistBActionGateSession(storage, next) ? consumed : null
}

export function restoreConsumedBActionAfterMutationFailure(
  storage: Pick<Storage, "getItem" | "setItem">,
  consumed: BActionReturnTo,
  now = new Date(),
) {
  const latest = restoreBActionGateSession(storage, now)
  if (latest.pending || latest.lastConsumed?.tokenId !== consumed.tokenId || consumed.consumedAt === null) return false
  const pending = { ...consumed, consumedAt: null }
  if (!isBActionReturnPending(pending, now)) return false
  return persistBActionGateSession(storage, { ...latest, pending, personRoute: null, lastConsumed: null, outcome: null })
}

export function finalizeConsumedBAction(
  storage: Pick<Storage, "getItem" | "setItem">,
  consumed: BActionReturnTo,
  now = new Date(),
) {
  const latest = restoreBActionGateSession(storage, now)
  if (latest.pending || latest.lastConsumed?.tokenId !== consumed.tokenId || consumed.consumedAt === null) return false
  return persistBActionGateSession(storage, { ...latest, personRoute: null, lastConsumed: null, outcome: null })
}

export function abandonPendingBAction(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  expected: Pick<BActionReturnTo, "tokenId">,
  now = new Date(),
) {
  const latest = restoreBActionGateSession(storage, now)
  if (!latest.pending || latest.pending.tokenId !== expected.tokenId) return false
  if (persistBActionGateSession(storage, { ...latest, pending: null, personRoute: null, outcome: null })) return true
  // Privacy-first fallback: if a browser refuses the bounded rewrite, remove
  // the complete gate record so a discarded draft cannot survive a reload.
  try { storage.removeItem(B_ACTION_GATE_SESSION_KEY); return true } catch { return false }
}

export function clearBActionGateSession(storage: Pick<Storage, "removeItem">) {
  try { storage.removeItem(B_ACTION_GATE_SESSION_KEY); return true } catch { return false }
}
