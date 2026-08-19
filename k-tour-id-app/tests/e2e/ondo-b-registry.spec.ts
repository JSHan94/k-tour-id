import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { B_BROWSER_CASES, B_CHECKPOINTS, B_CONTENT_CASES, B_FLOW_IDS, B_PIXEL_CASES } from "../helpers/ondo-b-qa"

test("B exact registry has 19 REQ, 18 flows and complete evidence slots", () => {
  const trace = readFileSync(resolve(process.cwd(), "../docs/ondo-baljajwi/01_TRACE_MATRIX.md"), "utf8")
  const reqs = Array.from({ length: 19 }, (_, index) => `B-REQ-${String(index + 1).padStart(3, "0")}`)

  expect(new Set(reqs).size).toBe(19)
  expect(B_FLOW_IDS).toHaveLength(18)
  expect(B_CHECKPOINTS).toHaveLength(7)
  expect(B_BROWSER_CASES).toHaveLength(126)
  expect(B_PIXEL_CASES).toHaveLength(72)
  expect(B_CONTENT_CASES).toHaveLength(36)
  expect(new Set(B_BROWSER_CASES.map((item) => item.id)).size).toBe(126)
  expect(new Set(B_PIXEL_CASES.map((item) => item.id)).size).toBe(72)
  expect(new Set(B_CONTENT_CASES.map((item) => item.id)).size).toBe(36)

  for (const id of [...reqs, ...B_BROWSER_CASES.map((item) => item.id), ...B_PIXEL_CASES.map((item) => item.id), ...B_CONTENT_CASES.map((item) => item.id)]) {
    expect(trace, `${id} must be present in the B trace`).toContain(id)
  }
})
