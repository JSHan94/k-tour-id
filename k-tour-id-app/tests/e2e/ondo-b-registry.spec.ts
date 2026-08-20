import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { B_CHECKPOINTS, B_CONTENT_CASES, B_FLOW_CONTRACTS, B_FLOW_IDS } from "../helpers/ondo-b-qa"
import { B_CHECKPOINT_VISUAL_EVIDENCE, B_VISUAL_CASES } from "../helpers/ondo-b-visual-evidence"

const read = (file: string) => readFileSync(resolve(process.cwd(), `../docs/ondo-baljajwi/${file}`), "utf8")

test("B registry is exact, honest, and contains no synthetic qaCase adapter", () => {
  const trace = read("01_TRACE_MATRIX.md")
  const seam = read("05_ROUTE_SEAM.md")
  const helper = readFileSync(resolve(process.cwd(), "tests/helpers/ondo-b-qa.ts"), "utf8")
  const reqs = Array.from({ length: 19 }, (_, index) => `B-REQ-${String(index + 1).padStart(3, "0")}`)

  expect(B_FLOW_IDS).toHaveLength(18)
  expect(B_FLOW_CONTRACTS).toHaveLength(18)
  expect(new Set(B_FLOW_CONTRACTS.map((item) => item.flow)).size).toBe(18)
  expect(B_VISUAL_CASES).toHaveLength(44)
  expect(B_CONTENT_CASES.length).toBeGreaterThanOrEqual(20)

  const checkpoints = B_FLOW_CONTRACTS.flatMap((item) => item.checkpoints)
  expect(checkpoints).toHaveLength(18 * 7)
  expect(new Set(checkpoints.map((item) => item.id)).size).toBe(18 * 7)
  for (const contract of B_FLOW_CONTRACTS) {
    expect(contract.checkpoints.map((item) => item.checkpoint)).toEqual(B_CHECKPOINTS)
    expect(contract.checkpoints.filter((item) => item.disposition === "actual").length).toBeGreaterThanOrEqual(5)
  }

  for (const id of [...reqs, ...B_FLOW_IDS, ...checkpoints.map((item) => item.id), ...B_CONTENT_CASES.map((item) => item.id)]) {
    expect(trace, `${id} must be exact in trace`).toContain(id)
  }

  const visualCaseIds = new Set(B_VISUAL_CASES.map((item) => item.id))
  expect(B_CHECKPOINT_VISUAL_EVIDENCE).toHaveLength(18 * 7)
  expect(new Set(B_CHECKPOINT_VISUAL_EVIDENCE.map((item) => item.checkpointId)).size).toBe(18 * 7)
  expect(new Set(B_CHECKPOINT_VISUAL_EVIDENCE.flatMap((item) => item.caseIds))).toEqual(visualCaseIds)
  for (const item of B_CHECKPOINT_VISUAL_EVIDENCE) {
    expect(checkpoints.some((checkpoint) => checkpoint.id === item.checkpointId)).toBe(true)
    expect(item.reason.length).toBeGreaterThan(30)
    if (item.disposition === "pixel") {
      expect(item.caseIds.length).toBeGreaterThan(0)
      expect(item.caseIds.every((caseId) => visualCaseIds.has(caseId))).toBe(true)
    } else {
      expect(item.caseIds).toEqual([])
    }
  }

  for (const source of [trace, seam, helper]) {
    expect(source).not.toMatch(/\?qaCase=|data-b-flow|data-b-checkpoint|data-b-primary-action|18\s*[×x]\s*7\s*=\s*126/)
  }
  expect(seam).toContain("/ondo-b")
  expect(seam).toContain("actual product UI")
})

test("the honest registry has zero product gaps and every N/A is explicit and reasoned", () => {
  const trace = read("01_TRACE_MATRIX.md")
  const gaps = B_FLOW_CONTRACTS.flatMap((flow) => flow.checkpoints.filter((item) => item.disposition === "gap"))
  expect(gaps).toEqual([])
  const nonActual = B_FLOW_CONTRACTS.flatMap((flow) => flow.checkpoints.filter((item) => item.disposition !== "actual"))
  expect(nonActual.length).toBeGreaterThan(0)
  for (const item of nonActual) {
    expect(item.proof.length).toBeGreaterThan(30)
    expect(trace).toContain(item.id)
    expect(trace).toContain("`N/A`")
  }
})
