import { isCanonicalVenueId } from "@/lib/ondo/venues/canonical-allowlist"
import type { ReturnToEnvelope } from "../contracts/domain"
import {
  consumeReturnToOnce,
  createReturnTo,
  createReturnToConsumptionExpectation,
  hashReturnTo,
  isReturnToStructurallyValid,
  resolveReturnTo,
  RETURN_TO_TTL_MS,
  type ReturnToConsumptionExpectation,
} from "../contracts/return-to"
import type { ReturnToSnapshotHash } from "../contracts/return-to-integrity"
import {
  createPlaceReturnUiSnapshot,
  hashPlaceReturnUiSnapshot,
  sanitizePlaceReturnUiSnapshot,
  type PlaceReturnUiSnapshotB,
  type PlaceReturnUiSnapshotInputB,
} from "../map/place-return-ui-snapshot-b"

export const PLACE_AFTER19_RETURN_TTL_MS = RETURN_TO_TTL_MS
export const PLACE_AFTER19_RETURN_SESSION_KEY = "ondo-b.current-action.after19.v2"
export const PLACE_AFTER19_RETURN_REQUEST_EVENT = "ondo:b:after19-place-return-request"
export const PLACE_AFTER19_RETURN_COMPLETE_EVENT = "ondo:b:after19-place-return-complete"

/**
 * This is the public hand-off only. Camera, section, sheet, scroll and focus
 * live in the sibling `privateUiSnapshot` journal field and never enter it.
 */
export type PlaceAfter19ReturnB = Omit<
  ReturnToEnvelope,
  "cta" | "gateQueue" | "activeGate" | "venueId" | "tableId" | "consumedAt"
> & {
  cta: "OPEN_AFTER19"
  gateQueue: ["age"]
  activeGate: "age"
  venueId: string
  consumedAt?: string
}

export type PlaceAfter19ReturnOutcomeB = "success" | "cancel"
export type ConsumedPlaceAfter19ReturnB = PlaceAfter19ReturnB & { consumedAt: string }
export type PlaceAfter19ConsumptionB = {
  tokenId: string
  cta: "OPEN_AFTER19"
  outcome: PlaceAfter19ReturnOutcomeB
  consumedAt: string
}
export type PlaceAfter19ConsumedTokenB = { tokenId: string; expiresAt: string }

export type PlaceAfter19ReturnSessionB = {
  version: 2
  revision: number
  phase: "idle" | "pending" | "consumed"
  publicEnvelope: PlaceAfter19ReturnB | null
  publicExpectation: ReturnToConsumptionExpectation | null
  privateUiSnapshot: PlaceReturnUiSnapshotB | null
  privateUiExpectation: ReturnToSnapshotHash | null
  lastConsumed: PlaceAfter19ConsumptionB | null
  consumedTokens: PlaceAfter19ConsumedTokenB[]
}

export type CompletedPlaceAfter19ReturnB = {
  returnTo: ConsumedPlaceAfter19ReturnB
  uiSnapshot: PlaceReturnUiSnapshotB
}

type ReadStorage = Pick<Storage, "getItem">
type JournalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">
type RestoreStorage = ReadStorage & Partial<Pick<Storage, "removeItem">>

export const DEFAULT_PLACE_AFTER19_RETURN_SESSION: PlaceAfter19ReturnSessionB = {
  version: 2,
  revision: 0,
  phase: "idle",
  publicEnvelope: null,
  publicExpectation: null,
  privateUiSnapshot: null,
  privateUiExpectation: null,
  lastConsumed: null,
  consumedTokens: [],
}

const VENUE_ID_PATTERN = /^mois-[a-z0-9]{20}$/
const TOKEN_PATTERN = /^RT-OPEN_AFTER19-(\d{13})$/
const SESSION_KEYS = new Set([
  "version", "revision", "phase", "publicEnvelope", "publicExpectation",
  "privateUiSnapshot", "privateUiExpectation", "lastConsumed", "consumedTokens",
])
const EXPECTATION_KEYS = new Set(["tokenId", "snapshotHash"])
const CONSUMPTION_KEYS = new Set(["tokenId", "cta", "outcome", "consumedAt"])
const CONSUMED_TOKEN_KEYS = new Set(["tokenId", "expiresAt"])
const SNAPSHOT_HASH_PATTERN = /^RT-HASH-[a-f0-9]{16}$/
const MAX_CONSUMED_TOKENS = 128
const MAX_REVISION = Number.MAX_SAFE_INTEGER - 1

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function hasExactKeys(value: Record<string, unknown>, keys: ReadonlySet<string>) {
  const own = Reflect.ownKeys(value)
  return own.length === keys.size && own.every((key) => typeof key === "string" && keys.has(key))
}

function canonicalPending(value: unknown): PlaceAfter19ReturnB | null {
  if (!isReturnToStructurallyValid(value)
    || value.cta !== "OPEN_AFTER19"
    || value.activeGate !== "age"
    || value.gateQueue.length !== 1
    || value.gateQueue[0] !== "age"
    || typeof value.venueId !== "string"
    || !VENUE_ID_PATTERN.test(value.venueId)
    || value.consumedAt !== undefined) return null
  return value as PlaceAfter19ReturnB
}

export function isPlaceAfter19ReturnStructurallyValid(value: unknown): value is PlaceAfter19ReturnB {
  return canonicalPending(value) !== null
}

export function isPlaceAfter19ReturnPending(value: unknown, now = new Date()): value is PlaceAfter19ReturnB {
  const pending = canonicalPending(value)
  return pending !== null && resolveReturnTo(pending, now).kind === "resume"
}

export function createPlaceAfter19Return(input: { venueId: string; now?: Date }): PlaceAfter19ReturnB {
  if (!isCanonicalVenueId(input.venueId)) throw new Error("Invalid canonical Place After 19 return venue")
  return createReturnTo({ cta: "OPEN_AFTER19", gateQueue: ["age"], venueId: input.venueId, now: input.now }) as PlaceAfter19ReturnB
}

export function renewPlaceAfter19Return(value: PlaceAfter19ReturnB, now = new Date()) {
  if (!isPlaceAfter19ReturnStructurallyValid(value)) throw new Error("Invalid Place After 19 return")
  return createPlaceAfter19Return({ venueId: value.venueId, now })
}

function sanitizeExpectation(value: unknown): ReturnToConsumptionExpectation | null {
  if (!isRecord(value) || !hasExactKeys(value, EXPECTATION_KEYS)) return null
  if (typeof value.tokenId !== "string" || !TOKEN_PATTERN.test(value.tokenId)) return null
  if (typeof value.snapshotHash !== "string" || !SNAPSHOT_HASH_PATTERN.test(value.snapshotHash)) return null
  return { tokenId: value.tokenId, snapshotHash: value.snapshotHash as ReturnToConsumptionExpectation["snapshotHash"] }
}

function sanitizeConsumption(value: unknown): PlaceAfter19ConsumptionB | null {
  if (!isRecord(value) || !hasExactKeys(value, CONSUMPTION_KEYS)) return null
  const consumedAt = typeof value.consumedAt === "string" ? Date.parse(value.consumedAt) : Number.NaN
  if (value.cta !== "OPEN_AFTER19" || (value.outcome !== "success" && value.outcome !== "cancel")) return null
  if (typeof value.tokenId !== "string" || !TOKEN_PATTERN.test(value.tokenId) || !Number.isFinite(consumedAt)) return null
  return { tokenId: value.tokenId, cta: "OPEN_AFTER19", outcome: value.outcome, consumedAt: new Date(consumedAt).toISOString() }
}

function sanitizeConsumedTokens(value: unknown): PlaceAfter19ConsumedTokenB[] {
  if (!Array.isArray(value) || value.length > MAX_CONSUMED_TOKENS) return []
  const seen = new Set<string>()
  const sanitized: PlaceAfter19ConsumedTokenB[] = []
  for (const candidate of value) {
    if (!isRecord(candidate) || !hasExactKeys(candidate, CONSUMED_TOKEN_KEYS)) continue
    if (typeof candidate.tokenId !== "string" || !TOKEN_PATTERN.test(candidate.tokenId) || seen.has(candidate.tokenId)) continue
    const match = TOKEN_PATTERN.exec(candidate.tokenId)
    const tokenCreatedAt = match ? Number(match[1]) : Number.NaN
    const expiresAt = typeof candidate.expiresAt === "string" ? Date.parse(candidate.expiresAt) : Number.NaN
    if (!Number.isFinite(tokenCreatedAt) || !Number.isFinite(expiresAt) || expiresAt !== tokenCreatedAt + PLACE_AFTER19_RETURN_TTL_MS) continue
    seen.add(candidate.tokenId)
    sanitized.push({ tokenId: candidate.tokenId, expiresAt: new Date(expiresAt).toISOString() })
  }
  return sanitized
}

function activeConsumedTokens(tokens: readonly PlaceAfter19ConsumedTokenB[], now: Date) {
  return tokens.filter((token) => Date.parse(token.expiresAt) > now.getTime())
}

function appendConsumedToken(tokens: readonly PlaceAfter19ConsumedTokenB[], envelope: PlaceAfter19ReturnB, now: Date) {
  const active = activeConsumedTokens(tokens, now)
  if (active.some((token) => token.tokenId === envelope.tokenId) || active.length >= MAX_CONSUMED_TOKENS) return null
  return [...active, { tokenId: envelope.tokenId, expiresAt: envelope.expiresAt }]
}

function sanitizeSession(value: unknown, now: Date): PlaceAfter19ReturnSessionB | null {
  if (!isRecord(value) || !hasExactKeys(value, SESSION_KEYS) || value.version !== 2) return null
  if (!Number.isSafeInteger(value.revision) || (value.revision as number) < 0 || (value.revision as number) > MAX_REVISION) return null
  if (value.phase !== "idle" && value.phase !== "pending" && value.phase !== "consumed") return null
  const lastConsumed = value.lastConsumed === null ? null : sanitizeConsumption(value.lastConsumed)
  if (value.lastConsumed !== null && !lastConsumed) return null
  const consumedTokens = sanitizeConsumedTokens(value.consumedTokens)
  if (value.phase === "pending") {
    const publicEnvelope = canonicalPending(value.publicEnvelope)
    const publicExpectation = sanitizeExpectation(value.publicExpectation)
    if (!publicEnvelope || !publicExpectation
      || publicExpectation.tokenId !== publicEnvelope.tokenId
      || publicExpectation.snapshotHash !== hashReturnTo(publicEnvelope)) return null
    const privateUiSnapshot = sanitizePlaceReturnUiSnapshot(value.privateUiSnapshot, publicEnvelope.tokenId, now)
    if (!privateUiSnapshot || privateUiSnapshot.venueId !== publicEnvelope.venueId) return null
    if (typeof value.privateUiExpectation !== "string" || !SNAPSHOT_HASH_PATTERN.test(value.privateUiExpectation)) return null
    if (value.privateUiExpectation !== hashPlaceReturnUiSnapshot(privateUiSnapshot)) return null
    return {
      version: 2,
      revision: value.revision as number,
      phase: "pending",
      publicEnvelope,
      publicExpectation,
      privateUiSnapshot,
      privateUiExpectation: value.privateUiExpectation as ReturnToSnapshotHash,
      lastConsumed,
      consumedTokens,
    }
  }
  if (value.publicEnvelope !== null || value.publicExpectation !== null || value.privateUiSnapshot !== null || value.privateUiExpectation !== null) return null
  if (value.phase === "consumed" && !lastConsumed) return null
  return {
    version: 2,
    revision: value.revision as number,
    phase: value.phase,
    publicEnvelope: null,
    publicExpectation: null,
    privateUiSnapshot: null,
    privateUiExpectation: null,
    lastConsumed,
    consumedTokens,
  }
}

function readRawResult(storage: ReadStorage): { ok: true; raw: string | null } | { ok: false; raw: null } {
  try { return { ok: true, raw: storage.getItem(PLACE_AFTER19_RETURN_SESSION_KEY) } } catch { return { ok: false, raw: null } }
}

function readRaw(storage: ReadStorage) {
  return readRawResult(storage).raw
}

function parseRaw(raw: string | null): unknown {
  if (raw === null) return null
  try { return JSON.parse(raw) } catch { return null }
}

function readJournal(storage: ReadStorage, now: Date) {
  const read = readRawResult(storage)
  if (!read.ok) return { raw: null, session: { ...DEFAULT_PLACE_AFTER19_RETURN_SESSION }, valid: false }
  const { raw } = read
  if (raw === null) return { raw, session: { ...DEFAULT_PLACE_AFTER19_RETURN_SESSION }, valid: true }
  const session = sanitizeSession(parseRaw(raw), now)
  return { raw, session: session ?? { ...DEFAULT_PLACE_AFTER19_RETURN_SESSION }, valid: session !== null }
}

function rollbackRaw(storage: JournalStorage, previousRaw: string | null) {
  try {
    if (previousRaw === null) storage.removeItem(PLACE_AFTER19_RETURN_SESSION_KEY)
    else storage.setItem(PLACE_AFTER19_RETURN_SESSION_KEY, previousRaw)
  } catch {
    return false
  }
  const readback = readRawResult(storage)
  return readback.ok && readback.raw === previousRaw
}

function compareAndSetJournal(
  storage: JournalStorage,
  previousRaw: string | null,
  next: PlaceAfter19ReturnSessionB,
  now: Date,
) {
  const canonical = sanitizeSession(next, now)
  const current = readRawResult(storage)
  if (!canonical || canonical.revision !== next.revision || !current.ok || current.raw !== previousRaw) return false
  const encoded = JSON.stringify(canonical)
  try { storage.setItem(PLACE_AFTER19_RETURN_SESSION_KEY, encoded) } catch {
    rollbackRaw(storage, previousRaw)
    return false
  }
  const confirmedRaw = readRaw(storage)
  const confirmed = sanitizeSession(parseRaw(confirmedRaw), now)
  if (confirmedRaw === encoded && confirmed && JSON.stringify(confirmed) === encoded) return true
  rollbackRaw(storage, previousRaw)
  return false
}

export function restorePlaceAfter19ReturnSession(storage: RestoreStorage, now = new Date()): PlaceAfter19ReturnSessionB {
  const restored = readJournal(storage, now)
  if (!restored.valid && typeof storage.removeItem === "function") {
    try { storage.removeItem(PLACE_AFTER19_RETURN_SESSION_KEY) } catch {
      // Quarantined in place: no public/private value is returned.
    }
  }
  return restored.session
}

export function persistPlaceAfter19ReturnSession(storage: JournalStorage, session: PlaceAfter19ReturnSessionB, now = new Date()) {
  const latest = readJournal(storage, now)
  if (!latest.valid || session.revision !== latest.session.revision + 1) return false
  return compareAndSetJournal(storage, latest.raw, session, now)
}

export function preparePlaceAfter19Return(
  storage: JournalStorage,
  returnTo: PlaceAfter19ReturnB,
  privateUiInput: PlaceReturnUiSnapshotInputB,
  now = new Date(),
) {
  if (!isPlaceAfter19ReturnPending(returnTo, now) || privateUiInput.tokenId !== returnTo.tokenId || privateUiInput.venueId !== returnTo.venueId) return false
  const publicExpectation = createReturnToConsumptionExpectation(returnTo)
  const privateUiSnapshot = createPlaceReturnUiSnapshot(privateUiInput, now)
  const privateUiExpectation = privateUiSnapshot ? hashPlaceReturnUiSnapshot(privateUiSnapshot) : null
  if (!publicExpectation || !privateUiSnapshot || !privateUiExpectation) return false
  const latest = readJournal(storage, now)
  if (!latest.valid) return false
  const consumedTokens = activeConsumedTokens(latest.session.consumedTokens, now)
  if (consumedTokens.some((token) => token.tokenId === returnTo.tokenId)) return false
  if (latest.session.phase === "pending") {
    return latest.session.publicExpectation?.tokenId === publicExpectation.tokenId
      && latest.session.publicExpectation.snapshotHash === publicExpectation.snapshotHash
      && latest.session.privateUiExpectation === privateUiExpectation
      && JSON.stringify(latest.session.privateUiSnapshot) === JSON.stringify(privateUiSnapshot)
  }
  return compareAndSetJournal(storage, latest.raw, {
    version: 2,
    revision: latest.session.revision + 1,
    phase: "pending",
    publicEnvelope: returnTo,
    publicExpectation,
    privateUiSnapshot,
    privateUiExpectation,
    lastConsumed: latest.session.lastConsumed,
    consumedTokens,
  }, now)
}

export function requestPlaceAfter19Return(
  returnTo: PlaceAfter19ReturnB,
  privateUiInput: PlaceReturnUiSnapshotInputB,
  now = new Date(),
) {
  if (typeof window === "undefined" || !preparePlaceAfter19Return(window.sessionStorage, returnTo, privateUiInput, now)) return false
  window.dispatchEvent(new CustomEvent(PLACE_AFTER19_RETURN_REQUEST_EVENT, { detail: { tokenId: returnTo.tokenId } }))
  return true
}

export function consumePendingPlaceAfter19ReturnJournal(
  storage: JournalStorage,
  expected: PlaceAfter19ReturnB,
  outcome: PlaceAfter19ReturnOutcomeB,
  now = new Date(),
): CompletedPlaceAfter19ReturnB | null {
  const latest = readJournal(storage, now)
  if (!latest.valid || latest.session.phase !== "pending") return null
  const { publicEnvelope, publicExpectation, privateUiSnapshot, privateUiExpectation } = latest.session
  const callerExpectation = createReturnToConsumptionExpectation(expected)
  if (!publicEnvelope || !publicExpectation || !privateUiSnapshot || !privateUiExpectation || !callerExpectation) return null
  if (publicExpectation.tokenId !== callerExpectation.tokenId
    || publicExpectation.snapshotHash !== callerExpectation.snapshotHash
    || publicExpectation.snapshotHash !== hashReturnTo(publicEnvelope)
    || privateUiSnapshot.tokenId !== publicEnvelope.tokenId
    || privateUiSnapshot.venueId !== publicEnvelope.venueId
    || privateUiExpectation !== hashPlaceReturnUiSnapshot(privateUiSnapshot)) return null
  const consumedTokens = appendConsumedToken(latest.session.consumedTokens, publicEnvelope, now)
  if (!consumedTokens) return null
  const consumedAt = now.toISOString()
  let returnTo: ConsumedPlaceAfter19ReturnB
  if (outcome === "cancel") {
    // Cancel/general-details is allowed during the private UI grace window so
    // an expired check can still restore the exact Place without granting Age.
    if (!isPlaceAfter19ReturnStructurallyValid(publicEnvelope)) return null
    returnTo = { ...publicEnvelope, consumedAt }
  } else {
    const result = consumeReturnToOnce(publicEnvelope, publicExpectation, now)
    if (result.kind !== "consumed" || result.envelope.cta !== "OPEN_AFTER19" || !result.envelope.venueId) return null
    returnTo = result.envelope as ConsumedPlaceAfter19ReturnB
  }
  const lastConsumed: PlaceAfter19ConsumptionB = { tokenId: returnTo.tokenId, cta: "OPEN_AFTER19", outcome, consumedAt: returnTo.consumedAt }
  const committed = compareAndSetJournal(storage, latest.raw, {
    version: 2,
    revision: latest.session.revision + 1,
    phase: "consumed",
    publicEnvelope: null,
    publicExpectation: null,
    privateUiSnapshot: null,
    privateUiExpectation: null,
    lastConsumed,
    consumedTokens,
  }, now)
  return committed ? { returnTo, uiSnapshot: privateUiSnapshot } : null
}

export function consumePendingPlaceAfter19Return(
  storage: JournalStorage,
  expected: PlaceAfter19ReturnB,
  outcome: PlaceAfter19ReturnOutcomeB,
  now = new Date(),
) {
  return consumePendingPlaceAfter19ReturnJournal(storage, expected, outcome, now)?.returnTo ?? null
}

export function renewPreparedPlaceAfter19Return(
  storage: JournalStorage,
  previous: PlaceAfter19ReturnB,
  renewed: PlaceAfter19ReturnB,
  now = new Date(),
) {
  const latest = readJournal(storage, now)
  if (!latest.valid || latest.session.phase !== "pending") return false
  const previousExpectation = createReturnToConsumptionExpectation(previous)
  const renewedExpectation = createReturnToConsumptionExpectation(renewed)
  const snapshot = latest.session.privateUiSnapshot
  if (!previousExpectation || !renewedExpectation || !snapshot
    || latest.session.publicExpectation?.snapshotHash !== previousExpectation.snapshotHash
    || latest.session.publicEnvelope?.tokenId !== previous.tokenId
    || snapshot.tokenId !== previous.tokenId
    || snapshot.venueId !== previous.venueId
    || renewed.venueId !== previous.venueId) return false
  const renewedUi = createPlaceReturnUiSnapshot({
    tokenId: renewed.tokenId,
    venueId: renewed.venueId,
    camera: snapshot.camera,
    detail: snapshot.detail,
  }, now)
  const renewedUiExpectation = renewedUi ? hashPlaceReturnUiSnapshot(renewedUi) : null
  if (!renewedUi || !renewedUiExpectation) return false
  return compareAndSetJournal(storage, latest.raw, {
    ...latest.session,
    revision: latest.session.revision + 1,
    phase: "pending",
    publicEnvelope: renewed,
    publicExpectation: renewedExpectation,
    privateUiSnapshot: renewedUi,
    privateUiExpectation: renewedUiExpectation,
  }, now)
}

export function completePlaceAfter19Return(
  returnTo: PlaceAfter19ReturnB,
  outcome: PlaceAfter19ReturnOutcomeB,
  now = new Date(),
) {
  if (typeof window === "undefined") return null
  const completed = consumePendingPlaceAfter19ReturnJournal(window.sessionStorage, returnTo, outcome, now)
  if (!completed) return null
  window.dispatchEvent(new CustomEvent(PLACE_AFTER19_RETURN_COMPLETE_EVENT, { detail: { tokenId: completed.returnTo.tokenId, outcome } }))
  return completed
}
