import { expect, test } from "@playwright/test"
import { canonicalVenueDetailById } from "../../lib/ondo/venues/detail-server"

const VENUE_ID = "mois-0021cd596bc5b2a922ad"

test("VENUE-DETAIL-001 resolves one stable venue without weakening field provenance", () => {
  const venue = canonicalVenueDetailById(VENUE_ID)
  expect(venue).toBeDefined()
  expect(venue).toMatchObject({
    id: VENUE_ID,
    sourceSnapshotAt: "2026-08-19T02:34:13.000Z",
    address: {
      road: {
        truth: "OFFICIAL_SOURCE",
        sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS",
        sourceField: "도로명주소",
      },
    },
    licenseStatus: {
      value: "ACTIVE_LICENSE_RECORD",
      truth: "OFFICIAL_SOURCE",
    },
    facts: {
      openingHours: { value: null, truth: "UNKNOWN" },
      foreignCardAccepted: { value: null, truth: "UNKNOWN" },
      menu: { value: null, truth: "UNKNOWN" },
      englishSupport: { value: null, truth: "UNKNOWN" },
    },
  })
  expect(venue?.address.road.sourceRecordDigest).toMatch(/^[a-f0-9]{64}$/)
})

test("VENUE-DETAIL-002 unknown ids do not fall back to a different record", () => {
  expect(canonicalVenueDetailById("mois-does-not-exist")).toBeUndefined()
})
