import { expect, test } from "@playwright/test"
import { ONDO_B_TABLE, initialTableRuntime, reduceTableRuntime } from "../../features/ondo/connect/table-model"

test("FL003 keeps availability, membership, failure, and chat access as four canonical axes", () => {
  const initial = initialTableRuntime(ONDO_B_TABLE, "none")
  expect(initial).toEqual({
    availability: "TAV-OPEN",
    membership: "TMB-NONE",
    failure: "TFR-NONE",
    chatAccess: "CHA-LOCKED",
  })

  const requesting = reduceTableRuntime(initial, { type: "REQUEST_JOIN" })
  expect(requesting).toEqual({ ...initial, membership: "TMB-REQUESTING" })

  const networkFailure = reduceTableRuntime(requesting, { type: "JOIN_FAILED", reason: "network" })
  expect(networkFailure).toEqual({
    availability: "TAV-OPEN",
    membership: "TMB-FAILED",
    failure: "TFR-NETWORK",
    chatAccess: "CHA-LOCKED",
  })

  const retry = reduceTableRuntime(networkFailure, { type: "REQUEST_JOIN" })
  expect(retry).toEqual({
    availability: "TAV-OPEN",
    membership: "TMB-REQUESTING",
    failure: "TFR-NONE",
    chatAccess: "CHA-LOCKED",
  })
  expect(reduceTableRuntime(retry, { type: "JOIN_CONFIRMED" })).toEqual({
    availability: "TAV-OPEN",
    membership: "TMB-CONFIRMED",
    failure: "TFR-NONE",
    chatAccess: "CHA-OPEN",
  })
})

test("FL003 full and organizer-cancel outcomes never leak member chat", () => {
  const requesting = reduceTableRuntime(initialTableRuntime(ONDO_B_TABLE, "none"), { type: "REQUEST_JOIN" })
  expect(reduceTableRuntime(requesting, { type: "JOIN_FAILED", reason: "full" })).toEqual({
    availability: "TAV-FULL",
    membership: "TMB-FAILED",
    failure: "TFR-FULL",
    chatAccess: "CHA-LOCKED",
  })

  const confirmed = reduceTableRuntime(requesting, { type: "JOIN_CONFIRMED" })
  expect(reduceTableRuntime(confirmed, { type: "ORGANIZER_CANCELLED" })).toEqual({
    availability: "TAV-CANCELLED",
    membership: "TMB-LEFT",
    failure: "TFR-CANCELLED",
    chatAccess: "CHA-LOCKED",
  })

  const policyFailure = reduceTableRuntime(requesting, { type: "JOIN_FAILED", reason: "policy" })
  expect(policyFailure).toEqual({
    availability: "TAV-OPEN",
    membership: "TMB-FAILED",
    failure: "TFR-POLICY",
    chatAccess: "CHA-LOCKED",
  })

  expect(reduceTableRuntime(confirmed, { type: "LEAVE" })).toEqual({
    availability: "TAV-OPEN",
    membership: "TMB-LEFT",
    failure: "TFR-CANCELLED",
    chatAccess: "CHA-LOCKED",
  })
})

test("FL003 only advances arrival and completion for the exact preceding membership", () => {
  const initial = initialTableRuntime(ONDO_B_TABLE, "none")
  expect(reduceTableRuntime(initial, { type: "CHECK_IN" })).toEqual(initial)
  const confirmed = reduceTableRuntime(reduceTableRuntime(initial, { type: "REQUEST_JOIN" }), { type: "JOIN_CONFIRMED" })
  const checkedIn = reduceTableRuntime(confirmed, { type: "CHECK_IN" })
  expect(checkedIn).toMatchObject({ membership: "TMB-CHECKED-IN", chatAccess: "CHA-OPEN" })
  expect(reduceTableRuntime(checkedIn, { type: "COMPLETE" })).toMatchObject({ membership: "TMB-COMPLETED", chatAccess: "CHA-OPEN" })
})
