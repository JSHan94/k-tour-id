import compactVenueGeoJson from "../../../data/ondo-venues/canonical-venues-map.json" with { type: "json" }
import type { CanonicalMapVenue, VenueCityId, VenuePrimaryCategory } from "./contracts"

type CompactFeature = {
  id: string
  geometry: { coordinates: [number, number] }
  properties: {
    id: string
    cityId: VenueCityId
    districtId: string
    nameKo: string
    nameEn: string | null
    primaryCategory: VenuePrimaryCategory
    after19PresentationEligible: boolean
    sourceSnapshotAt: string
    sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS"
  }
}

const features = compactVenueGeoJson.features as unknown as CompactFeature[]

export const CANONICAL_MAP_VENUES_COMPACT: readonly CanonicalMapVenue[] = Object.freeze(features.map((feature) => ({
  id: feature.properties.id,
  cityId: feature.properties.cityId,
  districtId: feature.properties.districtId,
  sourceSnapshotAt: feature.properties.sourceSnapshotAt,
  name: { ko: feature.properties.nameKo, en: feature.properties.nameEn ?? feature.properties.nameKo },
  nameEnTruth: "UNKNOWN_FALLBACK_TO_KO" as const,
  primaryCategory: feature.properties.primaryCategory,
  after19PresentationEligible: feature.properties.after19PresentationEligible,
  latitude: feature.geometry.coordinates[1],
  longitude: feature.geometry.coordinates[0],
  licenseStatus: "ACTIVE_LICENSE_RECORD" as const,
  openNow: null,
  sourceRefId: feature.properties.sourceRefId,
})))
const CANONICAL_MAP_VENUES_BY_ID = new Map(CANONICAL_MAP_VENUES_COMPACT.map((venue) => [venue.id, venue] as const))

export function canonicalMapVenueById(id: string) {
  return CANONICAL_MAP_VENUES_BY_ID.get(id)
}
