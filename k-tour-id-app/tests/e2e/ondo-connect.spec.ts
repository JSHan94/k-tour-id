import { expect, test } from "@playwright/test"
import { canOpenChat, initialTableRuntime, joinFailureRuntime, toCanonicalMembership } from "../../features/ondo/connect/table-model"
import { TABLES } from "../../features/ondo/connect/table-fixtures"

test("E2E-FL-003 confirmed membership alone unlocks Table chat", () => {
  const open = TABLES.find((table) => table.id === "table-seongsu-dinner")!
  expect(canOpenChat("TMB-NONE", open.availability)).toBeFalsy()
  expect(canOpenChat("TMB-REQUESTING", open.availability)).toBeFalsy()
  expect(canOpenChat("TMB-CONFIRMED", open.availability)).toBeTruthy()
  expect(canOpenChat("TMB-CHECKED-IN", open.availability)).toBeTruthy()
  expect(canOpenChat("TMB-COMPLETED", open.availability)).toBeTruthy()
  expect(toCanonicalMembership("left")).toBe("TMB-LEFT")
})

test("E2E-FL-003 cancelled Table denies confirmed-member chat", () => {
  const cancelled = TABLES.find((table) => table.id === "table-seongsu-cancelled")!
  expect(initialTableRuntime(cancelled, "confirmed")).toMatchObject({
    availability: "TAV-CANCELLED",
    failure: "TFR-CANCELLED",
    chatAccess: "CHA-LOCKED",
  })
})

test("E2E-FL-003 capacity, network, and policy failures remain distinct", () => {
  const open = TABLES.find((table) => table.id === "table-seongsu-dinner")!
  expect(joinFailureRuntime(open, "full")).toMatchObject({ availability: "TAV-FULL", failure: "TFR-FULL", chatAccess: "CHA-LOCKED" })
  expect(joinFailureRuntime(open, "network")).toMatchObject({ availability: "TAV-OPEN", failure: "TFR-NETWORK", chatAccess: "CHA-LOCKED" })
  expect(joinFailureRuntime(open, "policy")).toMatchObject({ availability: "TAV-OPEN", failure: "TFR-POLICY", chatAccess: "CHA-LOCKED" })
})

test("E2E-FL-003 Tables are place and time based without gender or nationality matching fields", () => {
  for (const table of TABLES) {
    expect(table.venueId).toBeTruthy()
    expect(new Date(table.startsAt).toString()).not.toBe("Invalid Date")
    expect(Object.keys(table)).not.toContain("gender")
    expect(Object.keys(table)).not.toContain("nationality")
  }
})
