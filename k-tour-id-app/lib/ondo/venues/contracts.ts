export type VenueCityId = "seoul" | "busan"
export type VenuePrimaryCategory = "korean" | "casual" | "japanese" | "chinese" | "global" | "night" | "specialty"
export type SourceTruth = "OFFICIAL_SOURCE" | "UNKNOWN"

export type FieldEvidence<T> = {
  value: T | null
  truth: SourceTruth
  sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS" | null
  sourceField: string | null
  sourceRecordDigest: string | null
}

export type CanonicalVenue = {
  id: `mois-${string}`
  sourceIds: { moisManagementId: string; municipalityCode: string }
  cityId: VenueCityId
  districtId: string
  sourceSnapshotAt: string
  name: { ko: FieldEvidence<string>; en: FieldEvidence<string> }
  primaryCategory: VenuePrimaryCategory
  sourceCategory: FieldEvidence<string>
  address: { road: FieldEvidence<string>; lot: FieldEvidence<string> }
  location: {
    latitude: number
    longitude: number
    crs: "EPSG:4326"
    source: { x: number; y: number; crs: "EPSG:5174"; sourceFieldX: "좌표정보(X)"; sourceFieldY: "좌표정보(Y)" }
    truth: "OFFICIAL_SOURCE"
    sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS"
    transformation: "EPSG:5174_TO_EPSG:4326__EPSG_OPERATION_5174"
    sourceRecordDigest: string
  }
  licenseStatus: FieldEvidence<"ACTIVE_LICENSE_RECORD">
  licenseOpenedAt: FieldEvidence<string>
  sourceModifiedAt: FieldEvidence<string>
  facts: Record<string, FieldEvidence<unknown>>
  heat: {
    score: null
    level: null
    signalCount: null
    confidence: null
    freshness: null
    truth: "UNKNOWN"
    simulation: null
  }
  sourceRefs: readonly ["MOIS_LOCALDATA_GENERAL_RESTAURANTS"]
}

export type CanonicalMapVenue = {
  id: string
  cityId: VenueCityId
  districtId: string
  sourceSnapshotAt: string
  name: { ko: string; en: string }
  nameEnTruth: "UNKNOWN_FALLBACK_TO_KO"
  primaryCategory: VenuePrimaryCategory
  latitude: number
  longitude: number
  licenseStatus: "ACTIVE_LICENSE_RECORD"
  openNow: null
  heat: null
  ondoScore: null
  sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS"
}
