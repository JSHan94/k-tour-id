import type { Neighborhood, PulseTable, Venue } from "../contracts/domain"

export type OndoFixtureRegistry = {
  neighborhoods: Neighborhood[]
  venues: Venue[]
  tables: PulseTable[]
}

export function createFixtureRegistry(input: OndoFixtureRegistry): OndoFixtureRegistry {
  const venueIds = new Set(input.venues.map((venue) => venue.id))
  const tableIds = new Set(input.tables.map((table) => table.id))
  if (venueIds.size !== input.venues.length) throw new Error("Duplicate ONDO venue fixture id")
  if (tableIds.size !== input.tables.length) throw new Error("Duplicate ONDO table fixture id")
  if (input.tables.some((table) => !venueIds.has(table.venueId))) throw new Error("Table fixture references an unknown venue")
  return input
}
