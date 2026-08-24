import type { CanonicalVenue } from "./contracts"
import { CANONICAL_MAP_VENUES_COMPACT } from "./map-data"

export type CanonicalVenueId = CanonicalVenue["id"]

export const CANONICAL_PRIVATE_NOTE_MAX_LENGTH = 1_000

const canonicalVenueIds = new Set<string>(CANONICAL_MAP_VENUES_COMPACT.map((venue) => venue.id))

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

export function isCanonicalVenueId(value: unknown): value is CanonicalVenueId {
  return typeof value === "string" && canonicalVenueIds.has(value)
}

export function sanitizeCanonicalVenueIds(value: unknown): CanonicalVenueId[] {
  if (!Array.isArray(value)) return []
  const sanitized: CanonicalVenueId[] = []
  const seen = new Set<string>()
  for (const candidate of value) {
    if (!isCanonicalVenueId(candidate) || seen.has(candidate)) continue
    seen.add(candidate)
    sanitized.push(candidate)
  }
  return sanitized
}

export function sanitizeCanonicalVenueNotes(value: unknown, savedVenueIds: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  const saved = new Set<string>(sanitizeCanonicalVenueIds(savedVenueIds))
  const sanitized: Record<string, string> = {}
  for (const [venueId, candidate] of Object.entries(value)) {
    if (!isCanonicalVenueId(venueId) || !saved.has(venueId) || typeof candidate !== "string") continue
    const note = candidate.trim().slice(0, CANONICAL_PRIVATE_NOTE_MAX_LENGTH)
    if (note) sanitized[venueId] = note
  }
  return sanitized
}
