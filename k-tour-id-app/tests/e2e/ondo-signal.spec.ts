import { expect, test } from "@playwright/test"
import { applyActivityEvents, firstMissionEvents } from "../../features/ondo/contracts/activity"

test("E2E-FL-012 first local signal changes Visit and Contribution only once", () => {
  const before = { identity: "verified", visit: "new", contribution: "new", meetup: "new" } as const
  const events = firstMissionEvents({ subjectRef: "account:fixture", evidenceRef: "local-signal:seoul-seongsu-gukbap:2026-08-19", occurredAt: "2026-08-19T20:00:00+09:00" })
  const first = applyActivityEvents(before, [], events)
  const duplicate = applyActivityEvents(first.reputation, first.acceptedKeys, events)

  expect(events.map((event) => event.kind)).toEqual(["visit", "contribution"])
  expect(first.reputation).toEqual({ identity: "verified", visit: "recent", contribution: "helpful", meetup: "new" })
  expect(duplicate).toEqual(first)
})
