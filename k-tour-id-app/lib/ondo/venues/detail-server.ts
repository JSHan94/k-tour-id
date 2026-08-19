import canonicalVenueData from "../../../data/ondo-venues/canonical-venues.json" with { type: "json" }
import type { CanonicalVenue } from "./contracts"
import type { CanonicalVenueDetail } from "./detail-contract"

const venues = canonicalVenueData.venues as unknown as readonly CanonicalVenue[]

export function canonicalVenueDetailById(id: string): CanonicalVenueDetail | undefined {
  const venue = venues.find((candidate) => candidate.id === id)
  if (!venue) return undefined
  return {
    id: venue.id,
    sourceIds: venue.sourceIds,
    sourceSnapshotAt: venue.sourceSnapshotAt,
    primaryCategory: venue.primaryCategory,
    name: venue.name,
    address: venue.address,
    sourceCategory: venue.sourceCategory,
    licenseStatus: venue.licenseStatus,
    sourceModifiedAt: venue.sourceModifiedAt,
    facts: {
      openingHours: venue.facts.openingHours,
      foreignCardAccepted: venue.facts.foreignCardAccepted,
      menu: venue.facts.menu,
      englishSupport: venue.facts.englishSupport,
    },
  }
}
