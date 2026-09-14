import { isCanonicalVenueId } from "@/lib/ondo/venues/canonical-allowlist"
import {
  hashReturnToSnapshot,
  type CanonicalSnapshotValue,
  type ReturnToSnapshotHash,
} from "../contracts/return-to-integrity"

export const PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY = "ondo-b.discovery.return-ui.v1"
export const PLACE_RETURN_UI_RESTORE_EVENT = "ondo:b:discovery-return-ui-restore"
export const PLACE_RETURN_UI_SNAPSHOT_TTL_MS = 30 * 60 * 1000

export const PLACE_RETURN_DETAIL_SECTIONS = [
  "identity",
  "temperature",
  "decisions",
  "pre_visit",
  "after19",
  "table",
  "offer",
  "utilities",
  "source",
] as const

export const PLACE_RETURN_OPEN_SECTIONS = ["temperature", "pre_visit", "source"] as const
export const PLACE_RETURN_FOCUS_TARGETS = [
  "after19_unlock",
  "after19_access",
  "detail_back",
  "detail_close",
  "directions",
  "save",
  "temperature",
  "pre_visit",
  "source",
] as const

export type PlaceReturnDetailSectionB = typeof PLACE_RETURN_DETAIL_SECTIONS[number]
export type PlaceReturnOpenSectionB = typeof PLACE_RETURN_OPEN_SECTIONS[number]
export type PlaceReturnFocusTargetB = typeof PLACE_RETURN_FOCUS_TARGETS[number]

export type PlaceReturnCameraB = Readonly<{
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
}>

export type PlaceReturnUiSnapshotB = Readonly<{
  tokenId: string
  venueId: string
  capturedAt: string
  expiresAt: string
  camera: PlaceReturnCameraB
  detail: Readonly<{
    sheetSnap: "detail"
    section: PlaceReturnDetailSectionB
    openSections: readonly PlaceReturnOpenSectionB[]
    scrollTop: number
    focus: PlaceReturnFocusTargetB
  }>
}>

export type PlaceReturnUiSnapshotInputB = Omit<PlaceReturnUiSnapshotB, "capturedAt" | "expiresAt">

type SnapshotSession = Readonly<{
  version: 1
  entries: Readonly<Record<string, PlaceReturnUiSnapshotB>>
}>

type ReadStorage = Pick<Storage, "getItem">
type WriteStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">
type CameraReader = () => unknown

const TOKEN_PATTERN = /^RT-OPEN_AFTER19-(\d{13})$/
const MAX_SNAPSHOTS = 4
const MAX_SCROLL_TOP = 1_000_000
const SESSION_KEYS = new Set(["version", "entries"])
const SNAPSHOT_KEYS = new Set(["tokenId", "venueId", "capturedAt", "expiresAt", "camera", "detail"])
const CAMERA_KEYS = new Set(["longitude", "latitude", "zoom", "bearing", "pitch"])
const DETAIL_KEYS = new Set(["sheetSnap", "section", "openSections", "scrollTop", "focus"])
const SECTION_SET = new Set<string>(PLACE_RETURN_DETAIL_SECTIONS)
const OPEN_SECTION_SET = new Set<string>(PLACE_RETURN_OPEN_SECTIONS)
const FOCUS_TARGET_SET = new Set<string>(PLACE_RETURN_FOCUS_TARGETS)
let cameraReader: CameraReader | null = null
const trustedRestoreEvents = new WeakSet<Event>()

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function hasExactKeys(value: Record<string, unknown>, keys: ReadonlySet<string>) {
  const actual = Reflect.ownKeys(value)
  return actual.length === keys.size && actual.every((key) => typeof key === "string" && keys.has(key))
}

function canonicalIso(value: unknown) {
  if (typeof value !== "string") return null
  const milliseconds = Date.parse(value)
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value ? milliseconds : null
}

function boundedNumber(value: unknown, minimum: number, maximum: number, precision = 6) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) return null
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function sanitizeCamera(value: unknown): PlaceReturnCameraB | null {
  if (!isRecord(value) || !hasExactKeys(value, CAMERA_KEYS)) return null
  const longitude = boundedNumber(value.longitude, -180, 180)
  const latitude = boundedNumber(value.latitude, -85, 85)
  const zoom = boundedNumber(value.zoom, 0, 24, 4)
  const bearing = boundedNumber(value.bearing, -360, 360, 3)
  const pitch = boundedNumber(value.pitch, 0, 85, 3)
  return longitude == null || latitude == null || zoom == null || bearing == null || pitch == null
    ? null
    : { longitude, latitude, zoom, bearing, pitch }
}

function sanitizeDetail(value: unknown): PlaceReturnUiSnapshotB["detail"] | null {
  if (!isRecord(value) || !hasExactKeys(value, DETAIL_KEYS) || value.sheetSnap !== "detail") return null
  if (typeof value.section !== "string" || !SECTION_SET.has(value.section)) return null
  if (typeof value.focus !== "string" || !FOCUS_TARGET_SET.has(value.focus)) return null
  const scrollTop = boundedNumber(value.scrollTop, 0, MAX_SCROLL_TOP, 0)
  if (scrollTop == null || !Array.isArray(value.openSections) || value.openSections.length > PLACE_RETURN_OPEN_SECTIONS.length) return null
  const openSections: PlaceReturnOpenSectionB[] = []
  for (const section of value.openSections) {
    if (typeof section !== "string" || !OPEN_SECTION_SET.has(section) || openSections.includes(section as PlaceReturnOpenSectionB)) return null
    openSections.push(section as PlaceReturnOpenSectionB)
  }
  return {
    sheetSnap: "detail",
    section: value.section as PlaceReturnDetailSectionB,
    openSections,
    scrollTop,
    focus: value.focus as PlaceReturnFocusTargetB,
  }
}

export function sanitizePlaceReturnUiSnapshot(
  value: unknown,
  tokenKey: string,
  now: Date,
  allowExpired = false,
): PlaceReturnUiSnapshotB | null {
  if (!isRecord(value) || !hasExactKeys(value, SNAPSHOT_KEYS)) return null
  const token = TOKEN_PATTERN.exec(tokenKey)
  if (!token || value.tokenId !== tokenKey || typeof value.venueId !== "string" || !isCanonicalVenueId(value.venueId)) return null
  const tokenCreatedAt = Number(token[1])
  const capturedAt = canonicalIso(value.capturedAt)
  const expiresAt = canonicalIso(value.expiresAt)
  if (!Number.isFinite(tokenCreatedAt)
    || capturedAt !== tokenCreatedAt
    || expiresAt !== tokenCreatedAt + PLACE_RETURN_UI_SNAPSHOT_TTL_MS
    || (!allowExpired && expiresAt <= now.getTime())) return null
  const camera = sanitizeCamera(value.camera)
  const detail = sanitizeDetail(value.detail)
  if (!camera || !detail) return null
  return {
    tokenId: tokenKey,
    venueId: value.venueId,
    capturedAt: new Date(capturedAt).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    camera,
    detail,
  }
}

export function createPlaceReturnUiSnapshot(
  input: PlaceReturnUiSnapshotInputB,
  now = new Date(),
) {
  const token = TOKEN_PATTERN.exec(input.tokenId)
  if (!token) return null
  const tokenCreatedAt = Number(token[1])
  if (!Number.isFinite(tokenCreatedAt) || tokenCreatedAt > now.getTime() + 5_000) return null
  return sanitizePlaceReturnUiSnapshot({
    ...input,
    capturedAt: new Date(tokenCreatedAt).toISOString(),
    expiresAt: new Date(tokenCreatedAt + PLACE_RETURN_UI_SNAPSHOT_TTL_MS).toISOString(),
  }, input.tokenId, now)
}

export function hashPlaceReturnUiSnapshot(snapshot: PlaceReturnUiSnapshotB): ReturnToSnapshotHash | null {
  const canonical = sanitizePlaceReturnUiSnapshot(snapshot, snapshot.tokenId, new Date(snapshot.capturedAt), true)
  if (!canonical) return null
  return hashReturnToSnapshot({
    camera: { ...canonical.camera },
    capturedAt: canonical.capturedAt,
    detail: {
      focus: canonical.detail.focus,
      openSections: [...canonical.detail.openSections],
      scrollTop: canonical.detail.scrollTop,
      section: canonical.detail.section,
      sheetSnap: canonical.detail.sheetSnap,
    },
    expiresAt: canonical.expiresAt,
    tokenId: canonical.tokenId,
    venueId: canonical.venueId,
  } satisfies CanonicalSnapshotValue)
}

function parseSession(storage: ReadStorage, now: Date): SnapshotSession {
  let parsed: unknown
  try {
    const raw = storage.getItem(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  if (!isRecord(parsed) || !hasExactKeys(parsed, SESSION_KEYS) || parsed.version !== 1 || !isRecord(parsed.entries)) {
    return { version: 1, entries: {} }
  }
  const candidates = Object.entries(parsed.entries)
  if (candidates.length > MAX_SNAPSHOTS) return { version: 1, entries: {} }
  const entries: Record<string, PlaceReturnUiSnapshotB> = {}
  for (const [tokenId, value] of candidates) {
    const snapshot = sanitizePlaceReturnUiSnapshot(value, tokenId, now)
    if (snapshot) entries[tokenId] = snapshot
  }
  return { version: 1, entries }
}

function persistSession(storage: Pick<Storage, "setItem" | "removeItem">, session: SnapshotSession) {
  try {
    if (!Object.keys(session.entries).length) storage.removeItem(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)
    else storage.setItem(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}

export function registerPlaceReturnCameraReader(reader: CameraReader) {
  cameraReader = reader
  return () => { if (cameraReader === reader) cameraReader = null }
}

export function readPlaceReturnCamera(): PlaceReturnCameraB | null {
  try {
    return cameraReader ? sanitizeCamera(cameraReader()) : null
  } catch {
    return null
  }
}

export function stagePlaceReturnUiSnapshot(
  storage: WriteStorage,
  input: PlaceReturnUiSnapshotInputB,
  now = new Date(),
) {
  const candidate = createPlaceReturnUiSnapshot(input, now)
  if (!candidate || candidate.venueId !== input.venueId) return false
  const latest = parseSession(storage, now)
  const existing = latest.entries[input.tokenId]
  if (existing && JSON.stringify(existing) !== JSON.stringify(candidate)) return false
  if (!existing && Object.keys(latest.entries).length >= MAX_SNAPSHOTS) return false
  return persistSession(storage, { version: 1, entries: { ...latest.entries, [input.tokenId]: candidate } })
}

export function restorePlaceReturnUiSnapshot(
  storage: ReadStorage,
  tokenId: string,
  venueId: string,
  now = new Date(),
) {
  if (!TOKEN_PATTERN.test(tokenId) || !isCanonicalVenueId(venueId)) return null
  const snapshot = parseSession(storage, now).entries[tokenId] ?? null
  return snapshot?.venueId === venueId ? snapshot : null
}

export function consumePlaceReturnUiSnapshot(
  storage: WriteStorage,
  tokenId: string,
  venueId: string,
  now = new Date(),
) {
  const latest = parseSession(storage, now)
  const snapshot = latest.entries[tokenId]
  const { [tokenId]: _discarded, ...remaining } = latest.entries
  // Consume/delete before returning the value. A failed write must not release
  // a replayable UI snapshot to the caller.
  if (!persistSession(storage, { version: 1, entries: remaining })) return null
  return snapshot?.venueId === venueId ? snapshot : null
}

export function discardPlaceReturnUiSnapshot(storage: WriteStorage, tokenId: string, now = new Date()) {
  const latest = parseSession(storage, now)
  if (!latest.entries[tokenId]) return persistSession(storage, latest)
  const { [tokenId]: _discarded, ...remaining } = latest.entries
  return persistSession(storage, { version: 1, entries: remaining })
}

export function renewPlaceReturnUiSnapshot(
  storage: WriteStorage,
  previousTokenId: string,
  nextTokenId: string,
  venueId: string,
  now = new Date(),
) {
  if (!TOKEN_PATTERN.test(previousTokenId) || !TOKEN_PATTERN.test(nextTokenId) || previousTokenId === nextTokenId) return false
  // The public return expires at 15 minutes. Keep a bounded 15-minute UI-only
  // grace so an expired decision can still return to its exact local surface.
  let raw: unknown
  try {
    const value = storage.getItem(PLACE_RETURN_UI_SNAPSHOT_SESSION_KEY)
    raw = value ? JSON.parse(value) : null
  } catch {
    return false
  }
  if (!isRecord(raw) || !hasExactKeys(raw, SESSION_KEYS) || raw.version !== 1 || !isRecord(raw.entries)) return false
  const previous = sanitizePlaceReturnUiSnapshot(raw.entries[previousTokenId], previousTokenId, now, true)
  if (!previous || previous.venueId !== venueId || Date.parse(previous.expiresAt) <= now.getTime()) return false
  const next = stagePlaceReturnUiSnapshot(storage, {
    tokenId: nextTokenId,
    venueId,
    camera: previous.camera,
    detail: previous.detail,
  }, now)
  // Keep the previous key until the public return envelope stages. The caller
  // then commits by discarding the previous key, or rolls back by discarding
  // the next key. This prevents a quota/write failure in either store from
  // silently entering a gate without an exact-return snapshot.
  return next
}

export function dispatchPlaceReturnUiRestore(snapshot: PlaceReturnUiSnapshotB, now = new Date()) {
  if (typeof window === "undefined") return false
  const sanitized = sanitizePlaceReturnUiSnapshot(snapshot, snapshot.tokenId, now)
  if (!sanitized) return false
  const event = new CustomEvent(PLACE_RETURN_UI_RESTORE_EVENT, { detail: sanitized })
  trustedRestoreEvents.add(event)
  window.dispatchEvent(event)
  return true
}

export function readPlaceReturnUiRestoreEvent(event: Event, now = new Date()) {
  if (!trustedRestoreEvents.has(event) || !(event instanceof CustomEvent) || event.type !== PLACE_RETURN_UI_RESTORE_EVENT || !isRecord(event.detail)) return null
  return typeof event.detail.tokenId === "string" ? sanitizePlaceReturnUiSnapshot(event.detail, event.detail.tokenId, now) : null
}
