import type { ReputationSnapshot } from "./domain"

export type ActivityEvent = {
  id: string
  kind: "visit" | "contribution" | "meetup"
  subjectRef: string
  evidenceRef: string
  occurredAt: string
}

export function activityIdempotencyKey(event: ActivityEvent) {
  return `${event.kind}:${event.subjectRef}:${event.evidenceRef}`
}

export function reduceReputation(current: ReputationSnapshot, event: ActivityEvent): ReputationSnapshot {
  if (event.kind === "visit") return { ...current, visit: current.visit === "new" ? "recent" : "repeat" }
  if (event.kind === "contribution") return { ...current, contribution: current.contribution === "new" ? "helpful" : "established" }
  return { ...current, meetup: current.meetup === "new" ? "reliable" : "established" }
}

export function firstMissionEvents(input: { subjectRef: string; evidenceRef: string; occurredAt: string }): ActivityEvent[] {
  return [
    { id: `${input.evidenceRef}:visit`, kind: "visit", ...input },
    { id: `${input.evidenceRef}:contribution`, kind: "contribution", ...input },
  ]
}
