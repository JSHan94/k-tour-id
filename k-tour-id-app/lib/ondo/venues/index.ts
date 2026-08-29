import canonicalVenueData from "../../../data/ondo-venues/canonical-venues.json" with { type: "json" }
import type { CanonicalMapVenue, CanonicalVenue, VenueCityId } from "./contracts"

export type { CanonicalMapVenue, CanonicalVenue, FieldEvidence, SourceTruth, VenueCityId, VenuePrimaryCategory } from "./contracts"
export {
  CANONICAL_PRIVATE_NOTE_MAX_LENGTH,
  isCanonicalVenueId,
  sanitizeCanonicalVenueIds,
  sanitizeCanonicalVenueNotes,
  type CanonicalVenueId,
} from "./canonical-allowlist"

export const CANONICAL_VENUES = Object.freeze(canonicalVenueData.venues) as unknown as readonly CanonicalVenue[]
const CANONICAL_VENUES_BY_ID = new Map(CANONICAL_VENUES.map((venue) => [venue.id, venue] as const))

export const CANONICAL_VENUE_COUNTS = Object.freeze({
  total: canonicalVenueData.counts.total,
  byCity: Object.freeze({
    seoul: canonicalVenueData.counts.byCity.seoul,
    busan: canonicalVenueData.counts.byCity.busan,
  }),
}) as Readonly<{ total: 400; byCity: Readonly<Record<VenueCityId, 200>> }>

export function venuesByCity(cityId: VenueCityId) {
  return CANONICAL_VENUES.filter((venue) => venue.cityId === cityId)
}

export function canonicalVenueById(id: string) {
  return CANONICAL_VENUES_BY_ID.get(id as CanonicalVenue["id"])
}

export function venueToMapRecord(venue: CanonicalVenue): CanonicalMapVenue {
  return {
    id: venue.id,
    cityId: venue.cityId,
    districtId: venue.districtId,
    sourceSnapshotAt: venue.sourceSnapshotAt,
    name: { ko: venue.name.ko.value!, en: venue.name.en.value ?? venue.name.ko.value! },
    nameEnTruth: "UNKNOWN_FALLBACK_TO_KO",
    primaryCategory: venue.primaryCategory,
    after19PresentationEligible: venue.primaryCategory === "night" && venue.sourceCategory.value !== "까페",
    latitude: venue.location.latitude,
    longitude: venue.location.longitude,
    licenseStatus: "ACTIVE_LICENSE_RECORD",
    openNow: null,
    sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS",
  }
}

export const CANONICAL_MAP_VENUES = Object.freeze(CANONICAL_VENUES.map(venueToMapRecord))
