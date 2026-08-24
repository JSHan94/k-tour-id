import type { FieldEvidence, VenuePrimaryCategory } from "./contracts"

export type CanonicalVenueDetail = {
  id: string
  sourceIds: {
    moisManagementId: string
    municipalityCode: string
  }
  sourceSnapshotAt: string
  primaryCategory: VenuePrimaryCategory
  name: {
    ko: FieldEvidence<string>
    en: FieldEvidence<string>
  }
  address: {
    road: FieldEvidence<string>
    lot: FieldEvidence<string>
  }
  sourceCategory: FieldEvidence<string>
  licenseStatus: FieldEvidence<"ACTIVE_LICENSE_RECORD">
  licenseOpenedAt: FieldEvidence<string>
  sourceModifiedAt: FieldEvidence<string>
  facts: {
    openingHours: FieldEvidence<unknown>
    foreignCardAccepted: FieldEvidence<unknown>
    menu: FieldEvidence<unknown>
    englishSupport: FieldEvidence<unknown>
  }
}

export type CanonicalVenueDetailResponse = {
  venue: CanonicalVenueDetail
}
