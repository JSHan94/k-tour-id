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

export type EvidenceSourceClass = "official_directory" | "editorial" | "ondo" | "merchant" | "opendid" | "eas"
export type CanonicalEvidenceState = "unknown" | "loading" | "valid" | "stale" | "invalid" | "error"
export type CanonicalFactState = "yes" | "no" | "conditional" | "unknown" | "loading" | "stale" | "error"
export type CanonicalFactRetry = { factKey: string; phase: "loading" | "error" }
export type MerchantTraitState = "unknown" | MerchantTraitReceipt["result"]

export const EVIDENCE_SOURCE_CLASSES = ["official_directory", "editorial", "ondo", "merchant", "opendid", "eas"] as const satisfies readonly EvidenceSourceClass[]
export const CANONICAL_FACT_STATES = ["yes", "no", "conditional", "unknown", "loading", "stale", "error"] as const satisfies readonly CanonicalFactState[]
export const CANONICAL_FACT_FRESHNESS_MS = 30 * 24 * 60 * 60 * 1000

const EVIDENCE_SOURCE_SET = new Set<EvidenceSourceClass>(EVIDENCE_SOURCE_CLASSES)
const CANONICAL_FACT_STATE_SET = new Set<CanonicalFactState>(CANONICAL_FACT_STATES)

/**
 * Runtime evidence may originate outside the three canonical adapter standards
 * (for example a directory or editorial record). Keep that source class
 * explicit instead of collapsing it into a generic verified badge.
 */
export function sanitizeEvidenceSourceClass(value: unknown, fallback: EvidenceSourceClass = "official_directory"): EvidenceSourceClass {
  return EVIDENCE_SOURCE_SET.has(value as EvidenceSourceClass) ? value as EvidenceSourceClass : fallback
}

/** Allowlisted state seam used by the QA-only renderer and contract fixtures. */
export function sanitizeCanonicalFactState(value: unknown, fallback: CanonicalFactState = "unknown"): CanonicalFactState {
  return CANONICAL_FACT_STATE_SET.has(value as CanonicalFactState) ? value as CanonicalFactState : fallback
}

export function canonicalFactFreshness(observedAt: unknown, now = new Date(), maxAgeMs = CANONICAL_FACT_FRESHNESS_MS): "current" | "stale" {
  if (typeof observedAt !== "string" || !Number.isFinite(Date.parse(observedAt))) return "stale"
  const observedAtMs = Date.parse(observedAt)
  const age = now.getTime() - observedAtMs
  return age >= 0 && age <= maxAgeMs ? "current" : "stale"
}

/** Earliest point at which a currently sighted fact must be re-rendered stale. */
export function nextCanonicalFactFreshnessTransition(
  observedAtValues: readonly unknown[],
  now = new Date(),
  maxAgeMs = CANONICAL_FACT_FRESHNESS_MS,
) {
  const nowMs = now.getTime()
  const transitions = observedAtValues.flatMap((value) => {
    if (typeof value !== "string") return []
    const observedAtMs = Date.parse(value)
    if (!Number.isFinite(observedAtMs) || observedAtMs > nowMs) return []
    const transitionAt = observedAtMs + maxAgeMs + 1
    return transitionAt > nowMs ? [transitionAt] : []
  })
  return transitions.length ? Math.min(...transitions) : null
}

/** A retry belongs to one fact row; sibling rows keep their own honest state. */
export function canonicalFactStateWithRetry(retry: CanonicalFactRetry | null, factKey: string, fallback: CanonicalFactState): CanonicalFactState {
  return retry?.factKey === factKey ? retry.phase : fallback
}

export function evidenceSourceClass(sourceStandard: CanonicalEvidenceEnvelope["sourceStandard"]): EvidenceSourceClass {
  if (sourceStandard === "OpenDID") return "opendid"
  if (sourceStandard === "EAS") return "eas"
  return "ondo"
}

export function canonicalEvidenceState(envelope: CanonicalEvidenceEnvelope | null, now = new Date()): CanonicalEvidenceState {
  if (!envelope) return "unknown"
  const issuedAt = Date.parse(envelope.issuedAt)
  if (!Number.isFinite(issuedAt) || issuedAt > now.getTime()) return "invalid"
  if (envelope.expiresAt != null && !Number.isFinite(Date.parse(envelope.expiresAt))) return "invalid"
  return isEvidenceCurrent(envelope, now) ? "valid" : "stale"
}

export function canonicalFactState(input: {
  requestState: "idle" | "loading" | "ready" | "error"
  truth: "OFFICIAL_SOURCE" | "UNKNOWN" | null | undefined
  value: unknown
  freshness?: "current" | "stale"
}): CanonicalFactState {
  if (input.requestState === "idle" || input.requestState === "loading") return "loading"
  if (input.requestState === "error") return "error"
  if (input.truth !== "OFFICIAL_SOURCE" || input.value == null) return "unknown"
  // Missing evidence remains unknown even when the surrounding directory
  // snapshot is old. Stale is reserved for a previously sighted fact value.
  if (input.freshness === "stale") return "stale"
  if (input.value === true) return "yes"
  if (input.value === false) return "no"
  return typeof input.value === "string" && input.value.trim() ? "conditional" : "unknown"
}

export function merchantTraitState(receipt: MerchantTraitReceipt | null, now = new Date()): MerchantTraitState {
  if (!receipt) return "unknown"
  if (!Number.isFinite(Date.parse(receipt.checkedAt))) return "error"
  if (receipt.result === "error" || receipt.result === "stale") return receipt.result
  if (receipt.expiresAt != null) {
    const expiresAt = Date.parse(receipt.expiresAt)
    if (!Number.isFinite(expiresAt)) return "error"
    if (expiresAt <= now.getTime()) return "stale"
  }
  return receipt.result
}

export function isPositiveFactState(state: CanonicalFactState) {
  return state === "yes"
}

export function isPositiveMerchantTraitState(state: MerchantTraitState) {
  return state === "eligible"
}

export function isEvidenceCurrent(envelope: CanonicalEvidenceEnvelope, now: Date): boolean {
  if (!envelope.expiresAt) return true
  return new Date(envelope.expiresAt).getTime() > now.getTime()
}

export function isSimulated(provenance: Provenance): boolean {
  return provenance.truth === "SIMULATED" && provenance.isSimulation
}
