import canonicalVenueData from "../../../data/ondo-venues/canonical-venues.json" with { type: "json" }
import type { CanonicalVenue } from "./contracts"
import type { CanonicalVenueDetail } from "./detail-contract"

const venues = canonicalVenueData.venues as unknown as readonly CanonicalVenue[]
const venuesById = new Map(venues.map((venue) => [venue.id, venue] as const))

export const CANONICAL_VENUE_DETAIL_SOURCE = Object.freeze({
  id: "MOIS_LOCALDATA_GENERAL_RESTAURANTS" as const,
  snapshotAt: canonicalVenueData.generatedAt,
  truthNotice: canonicalVenueData.truthNotice,
})

export function canonicalVenueDetailById(id: string): CanonicalVenueDetail | undefined {
  const venue = venuesById.get(id as CanonicalVenue["id"])
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
    licenseOpenedAt: venue.licenseOpenedAt,
    sourceModifiedAt: venue.sourceModifiedAt,
    facts: {
      openingHours: venue.facts.openingHours,
      foreignCardAccepted: venue.facts.foreignCardAccepted,
      menu: venue.facts.menu,
      englishSupport: venue.facts.englishSupport,
    },
  }
}
