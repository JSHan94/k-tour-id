import type { Provenance } from "./domain"

export type CanonicalEvidenceEnvelope = {
  id: string
  sourceStandard: "OpenDID" | "EAS" | "ONDO_LOCAL"
  adapterId: "opendid-adapter" | "eas-adapter" | "ondo-local-adapter"
  subjectRef: string
  claimType: "person" | "age_over_19" | "visit" | "merchant_trait"
  claimValue: boolean | string
  issuedAt: string
  expiresAt?: string
  provenance: Provenance
}

export type MerchantTraitReceipt = {
  merchantId: string
  offerId: string
  policyId: string
  result: "eligible" | "ineligible" | "stale" | "error"
  checkedAt: string
  expiresAt?: string
  provenance: Provenance
}

export function isEvidenceCurrent(envelope: CanonicalEvidenceEnvelope, now: Date): boolean {
  if (!envelope.expiresAt) return true
  return new Date(envelope.expiresAt).getTime() > now.getTime()
}

export function isSimulated(provenance: Provenance): boolean {
  return provenance.truth === "SIMULATED" && provenance.isSimulation
}
