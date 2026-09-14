import type { BActionAxis } from "./action-gate-contract-b"

export type TravelerAxisOutcomeB = "success" | "failure" | "unavailable" | "unsupported" | "expired" | null
export type TravelerReviewResultB = "current" | "expired" | null
export type TravelerAxisPresentationB = Readonly<{
  outcome: TravelerAxisOutcomeB
  reviewResult: TravelerReviewResultB
}>

/** Resolve a readiness axis against one explicit clock so an open screen can
 * revoke Ready at the same instant as the persisted eligibility expires. */
export function resolveTravelerAxisOutcomeB(axis: BActionAxis, now = Date.now()): TravelerAxisOutcomeB {
  if (axis.status === "eligible" && axis.expiresAt && Date.parse(axis.expiresAt) > now) return "success"
  if (axis.status === "failed") return "failure"
  if (axis.status === "unavailable") return "unavailable"
  if (axis.status === "unsupported") return "unsupported"
  if (axis.status === "expired" || (axis.status === "eligible" && axis.expiresAt)) return "expired"
  return null
}

/**
 * `reviewReceipt` is consumed only after the action-gate contract has restored
 * and exact-matched it against its in-memory expectation. This helper is a
 * presentation classifier, never an eligibility authority.
 */
export function resolveTravelerAxisPresentationB(axis: BActionAxis, now = Date.now()): TravelerAxisPresentationB {
  const outcome = resolveTravelerAxisOutcomeB(axis, now)
  const receipt = axis.reviewReceipt
  const hasReviewTruth = receipt?.issuer === "ONDO_REVIEW_FIXTURE"
    && receipt.executionTruth === "FIXTURE_REVIEW"
    && receipt.provenanceTruth === "SIMULATED"
    && Number.isFinite(Date.parse(receipt.issuedAt))
    && Number.isFinite(Date.parse(receipt.expiresAt))
  const reviewResult = hasReviewTruth && outcome === "success"
    ? "current"
    : hasReviewTruth && outcome === "expired"
      ? "expired"
      : null
  return { outcome, reviewResult }
}
