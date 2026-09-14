import { expect, test } from "@playwright/test"
import {
  createBTableActionReturn,
  gatePlanForBAction,
  isBActionReturnStructurallyValid,
} from "../../features/ondo/identity-b/action-gate-contract-b"
import { ONDO_B_BUSAN_TABLE, ONDO_B_JEJU_TABLE, ONDO_B_TABLES, ondoBTableTimeline } from "../../features/ondo/connect/table-model"
import { isOndoBTableVenuePair, ondoBTablePolicyById } from "../../features/ondo/connect/table-policy-b"
import { recordPlannedTable, sanitizePlannedTableRefs } from "../../features/ondo/my/my-korea-model"
import { editorialPlaceById } from "../../features/ondo/pulse-b/japan-first-pulse-model-b"
import { ondoBProductTimeline } from "../../features/ondo/shared/time/product-timeline-b"

const NOW = new Date("2026-09-05T03:00:00.000Z")

test("JEJU-TABLE-CONTRACT-001 registers one exact editorial food-place Table with account-only gating", () => {
  const place = editorialPlaceById(ONDO_B_JEJU_TABLE.venueId)
  const policy = ondoBTablePolicyById(ONDO_B_JEJU_TABLE.id)

  expect(place).toMatchObject({ kind: "editorial-place", category: "food" })
  expect(policy).toMatchObject({
    id: ONDO_B_JEJU_TABLE.id,
    venueId: ONDO_B_JEJU_TABLE.venueId,
    alcohol: false,
    requiresPerson: false,
  })
  expect(gatePlanForBAction("JOIN_TABLE", { tableId: ONDO_B_JEJU_TABLE.id })).toEqual(["account"])
  expect(isOndoBTableVenuePair(ONDO_B_JEJU_TABLE.id, ONDO_B_JEJU_TABLE.venueId)).toBe(true)
  expect(isOndoBTableVenuePair(ONDO_B_JEJU_TABLE.id, ONDO_B_TABLES[0].venueId)).toBe(false)
})

test("JEJU-TABLE-CONTRACT-002 exact Jeju Table/place return is accepted while swapped and invented pairs fail closed", () => {
  const returned = createBTableActionReturn({
    tableId: ONDO_B_JEJU_TABLE.id,
    venueId: ONDO_B_JEJU_TABLE.venueId,
    draft: "Window seat if possible",
    now: NOW,
  })

  expect(returned.gatePlan).toEqual(["account"])
  expect(isBActionReturnStructurallyValid(returned)).toBe(true)
  expect(isBActionReturnStructurallyValid({ ...returned, venueId: ONDO_B_TABLES[0].venueId })).toBe(false)
  expect(() => createBTableActionReturn({
    tableId: "table-jeju-invented",
    venueId: ONDO_B_JEJU_TABLE.venueId,
    draft: "",
    now: new Date(NOW.getTime() + 1),
  })).toThrow("Invalid Table return context")
})

test("JEJU-TABLE-CONTRACT-003 My Korea retains only the registered editorial Table/place pair", () => {
  expect(sanitizePlannedTableRefs([
    { tableId: ONDO_B_JEJU_TABLE.id, venueId: ONDO_B_TABLES[0].venueId },
    { tableId: ONDO_B_JEJU_TABLE.id, venueId: ONDO_B_JEJU_TABLE.venueId },
    { tableId: ONDO_B_JEJU_TABLE.id, venueId: ONDO_B_JEJU_TABLE.venueId },
    { tableId: "table-jeju-invented", venueId: ONDO_B_JEJU_TABLE.venueId },
  ])).toEqual([{
    tableId: ONDO_B_JEJU_TABLE.id,
    venueId: ONDO_B_JEJU_TABLE.venueId,
  }])
})

test("JEJU-TABLE-CONTRACT-004 each Table keeps its own KST schedule and expiry instant", () => {
  const productTimeline = ondoBProductTimeline(NOW.getTime(), "legacy-2026")
  const seoul = ondoBTableTimeline(ONDO_B_TABLES[0], productTimeline, "en")
  const jeju = ondoBTableTimeline(ONDO_B_JEJU_TABLE, productTimeline, "en")
  const betweenJejuAndSeoul = Date.parse("2026-09-18T19:00:00+09:00")

  expect(seoul.schedule).toContain("20:30 KST")
  expect(jeju.schedule).toContain("18:30 KST")
  expect(seoul.startsAtMs - jeju.startsAtMs).toBe(2 * 60 * 60 * 1_000)
  expect(betweenJejuAndSeoul < jeju.startsAtMs).toBe(false)
  expect(betweenJejuAndSeoul < seoul.startsAtMs).toBe(true)
})

test("BUSAN-TABLE-CONTRACT-001 its registered venue survives plan persistence while unknown and swapped IDs fail closed", () => {
  const busan = { tableId: ONDO_B_BUSAN_TABLE.id, venueId: ONDO_B_BUSAN_TABLE.venueId }
  expect(gatePlanForBAction("JOIN_TABLE", busan)).toEqual(["account"])
  expect(recordPlannedTable([], busan.tableId, busan.venueId)).toEqual([busan])
  expect(sanitizePlannedTableRefs([
    busan, busan,
    { tableId: busan.tableId, venueId: ONDO_B_JEJU_TABLE.venueId },
    { tableId: busan.tableId, venueId: "mois-invented" },
    { tableId: "table-busan-invented", venueId: busan.venueId },
  ])).toEqual([busan])
  for (const table of ONDO_B_TABLES) {
    expect(recordPlannedTable([], table.id, table.venueId)).toEqual([{ tableId: table.id, venueId: table.venueId }])
  }
})
