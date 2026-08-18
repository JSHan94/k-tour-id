import { expect, test } from "@playwright/test"
import { applyActivityEvents, type ActivityEvent } from "../../features/ondo/contracts/activity"

test("E2E-FL-003 My Korea keeps identity, visit, contribution, and meetup separate", () => {
  const before = { identity: "verified", visit: "recent", contribution: "helpful", meetup: "new" } as const
  const meetup: ActivityEvent = { id: "meetup:table-seongsu-dinner", kind: "meetup", subjectRef: "account:fixture", evidenceRef: "meetup:table-seongsu-dinner:2026-08-19", occurredAt: "2026-08-19T22:00:00+09:00" }
  const after = applyActivityEvents(before, [], [meetup]).reputation
  expect(after).toEqual({ identity: "verified", visit: "recent", contribution: "helpful", meetup: "reliable" })
  expect(Object.keys(after)).not.toContain("score")
})
