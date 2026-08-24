import { expect, test } from "@playwright/test"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"
import {
  MY_KOREA_HISTORY_LIMIT,
  recordPlannedTable,
  recordRecentVenue,
  removePlannedTable,
  sanitizeLocalSignalVenueIds,
  sanitizePlannedTableRefs,
  sanitizeRecentVenueIds,
} from "../../features/ondo/my/my-korea-model"

const TABLE_ID = "table-seoul-night-bites"
const TABLE_VENUE_ID = "mois-0021cd596bc5b2a922ad"

test("B-MY-MODEL-001 recent history is canonical, deduplicated, newest-first, and bounded", () => {
  const canonical = CANONICAL_MAP_VENUES_COMPACT.slice(0, MY_KOREA_HISTORY_LIMIT + 2).map((venue) => venue.id)
  expect(sanitizeRecentVenueIds(["not-canonical", canonical[0], canonical[0], ...canonical])).toEqual(canonical.slice(0, MY_KOREA_HISTORY_LIMIT))
  expect(recordRecentVenue(canonical.slice(0, 3), canonical[2])).toEqual([canonical[2], canonical[0], canonical[1]])
  expect(recordRecentVenue(canonical.slice(0, 3), "not-canonical")).toEqual(canonical.slice(0, 3))
})

test("B-MY-MODEL-002 planned history accepts only its exact local Table/place pair", () => {
  expect(sanitizePlannedTableRefs([
    { tableId: TABLE_ID, venueId: "not-canonical" },
    { tableId: "unknown-table", venueId: TABLE_VENUE_ID },
    { tableId: TABLE_ID, venueId: TABLE_VENUE_ID },
    { tableId: TABLE_ID, venueId: TABLE_VENUE_ID },
  ])).toEqual([{ tableId: TABLE_ID, venueId: TABLE_VENUE_ID }])
  const recorded = recordPlannedTable([], TABLE_ID, TABLE_VENUE_ID)
  expect(recorded).toEqual([{ tableId: TABLE_ID, venueId: TABLE_VENUE_ID }])
  expect(removePlannedTable(recorded, TABLE_ID)).toEqual([])
})

test("B-MY-MODEL-003 contribution integration keeps canonical venue references only", () => {
  expect(sanitizeLocalSignalVenueIds([TABLE_VENUE_ID, "untrusted", TABLE_VENUE_ID])).toEqual([TABLE_VENUE_ID])
})
