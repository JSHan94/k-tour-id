import { ONDO_B_TABLE, ONDO_B_TABLES } from "./table-model"

export type OndoBTablePolicy = {
  id: string
  venueId: string
  requiresPerson: boolean
  alcohol: boolean
  requiresKTourPresentation: boolean
}

export const TABLE_VENUE_ID = ONDO_B_TABLE.venueId
export const ACTIVE_TABLE_ID = ONDO_B_TABLE.id

/**
 * Canonical policy metadata for the B-native Table surface.
 *
 * The action-return contract reads this registry instead of inferring policy
 * from a component or a special-case table id. New Tables must be registered
 * here before they can create a resumable JOIN_TABLE action.
 */
export const ONDO_B_TABLE_POLICIES = ONDO_B_TABLES.map((table) => (
  {
    id: table.id,
    venueId: table.venueId,
    // Each Table declares only the independent checks its own action needs.
    requiresPerson: table.requiresPerson,
    alcohol: table.alcohol,
    // K-Tour ID may be adjacent, but it is not a JOIN_TABLE gate.
    requiresKTourPresentation: false,
  }
)) satisfies readonly OndoBTablePolicy[]

export function ondoBTablePolicyById(value: unknown): OndoBTablePolicy | null {
  if (typeof value !== "string") return null
  return ONDO_B_TABLE_POLICIES.find((table) => table.id === value) ?? null
}

export function isOndoBTableVenuePair(tableId: unknown, venueId: unknown) {
  const table = ondoBTablePolicyById(tableId)
  return Boolean(table && table.venueId === venueId)
}

/** A bounded front-end fixture can resolve only a registered Table/place pair. */
export function bTableCheckInFixtureEvidenceId(tableId: unknown, venueId: unknown) {
  return isOndoBTableVenuePair(tableId, venueId) ? `activity:table:${String(tableId)}:check-in` : null
}
