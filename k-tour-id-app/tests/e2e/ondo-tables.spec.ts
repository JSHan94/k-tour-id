import { expect, test } from "@playwright/test"
import { initialTableRuntime } from "../../features/ondo/connect/table-model"
import { TABLES } from "../../features/ondo/connect/table-fixtures"

test("E2E-FL-003 Table fixtures use the four stable venue references", () => {
  const expected = new Set([
    "seoul-seongsu-gukbap",
    "seoul-euljiro-nogari",
    "seoul-mangwon-kalguksu",
    "busan-jagalchi-grill",
  ])
  expect(TABLES.every((table) => expected.has(table.venueId))).toBeTruthy()
})

test("E2E-FL-003 availability and membership are independent axes", () => {
  const full = TABLES.find((table) => table.availability === "TAV-FULL")!
  const runtime = initialTableRuntime(full, "none")
  expect(runtime).toMatchObject({ availability: "TAV-FULL", membership: "TMB-NONE", failure: "TFR-FULL", chatAccess: "CHA-LOCKED" })
})
