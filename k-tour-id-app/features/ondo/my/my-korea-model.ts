import { isCanonicalVenueId, sanitizeCanonicalVenueIds } from "@/lib/ondo/venues/canonical-allowlist"

export const MY_KOREA_HISTORY_LIMIT = 12

export const MY_KOREA_TABLE_CATALOG = {
  "table-seoul-night-bites": {
    venueId: "mois-0021cd596bc5b2a922ad",
    title: { en: "Night bites, one shared table", ko: "야식 한 상, 함께 앉는 테이블" },
    schedule: { en: "Fri, Sep 18 · 20:30 KST", ko: "9월 18일 금요일 · 20:30 KST" },
  },
} as const

export type OndoBPlannedTableRef = {
  tableId: keyof typeof MY_KOREA_TABLE_CATALOG
  venueId: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

export function sanitizeRecentVenueIds(value: unknown) {
  return sanitizeCanonicalVenueIds(value).slice(0, MY_KOREA_HISTORY_LIMIT)
}

export function sanitizePlannedTableRefs(value: unknown): OndoBPlannedTableRef[] {
  if (!Array.isArray(value)) return []
  const result: OndoBPlannedTableRef[] = []
  const seen = new Set<string>()
  for (const candidate of value) {
    if (!isRecord(candidate) || typeof candidate.tableId !== "string" || typeof candidate.venueId !== "string") continue
    const tableId = candidate.tableId as keyof typeof MY_KOREA_TABLE_CATALOG
    const catalogEntry = MY_KOREA_TABLE_CATALOG[tableId]
    if (!catalogEntry || catalogEntry.venueId !== candidate.venueId || !isCanonicalVenueId(candidate.venueId) || seen.has(tableId)) continue
    seen.add(tableId)
    result.push({ tableId, venueId: candidate.venueId })
    if (result.length === MY_KOREA_HISTORY_LIMIT) break
  }
  return result
}

export function sanitizeLocalSignalVenueIds(value: unknown) {
  return sanitizeCanonicalVenueIds(value).slice(0, MY_KOREA_HISTORY_LIMIT)
}

export function recordRecentVenue(current: readonly string[], venueId: string) {
  if (!isCanonicalVenueId(venueId)) return sanitizeRecentVenueIds(current)
  return sanitizeRecentVenueIds([venueId, ...current.filter((id) => id !== venueId)])
}

export function recordPlannedTable(current: readonly OndoBPlannedTableRef[], tableId: string, venueId: string) {
  return sanitizePlannedTableRefs([{ tableId, venueId }, ...current.filter((item) => item.tableId !== tableId)])
}

export function removePlannedTable(current: readonly OndoBPlannedTableRef[], tableId: string) {
  return sanitizePlannedTableRefs(current.filter((item) => item.tableId !== tableId))
}
