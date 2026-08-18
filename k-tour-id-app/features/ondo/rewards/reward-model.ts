import { canIncrementStamp } from "../contracts/commerce"

const VISIT_KEY = "ondo.accepted-visits.v2"

export function acceptedVisitEvidence(): string[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(VISIT_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : []
  } catch {
    return []
  }
}

export function acceptUniqueMilestoneVisit(evidenceId: string) {
  const accepted = acceptedVisitEvidence()
  const allowed = canIncrementStamp({ scenarioId: "SCN-006-STAMP-MILESTONE", evidenceId, acceptedEvidenceIds: accepted })
  if (!allowed) return false
  window.sessionStorage.setItem(VISIT_KEY, JSON.stringify([...accepted, evidenceId]))
  return true
}

export function badgeMetadata() {
  return { title: "ONDO · Tenth visit", milestoneCount: 10 as const }
}
