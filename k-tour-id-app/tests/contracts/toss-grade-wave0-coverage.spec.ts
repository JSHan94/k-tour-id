import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { B_CHECKPOINTS, B_FLOW_CONTRACTS, B_FLOW_IDS } from "../helpers/ondo-b-qa"
import { B_SLEEK_VIEWPORTS, B_VISUAL_CASES } from "../helpers/ondo-b-visual-evidence"
import {
  CURRENT_SHARED_PIXEL_BASELINE,
  TOSS_GRADE_ATTACK_MATRIX,
  TOSS_GRADE_ATTACKS,
  TOSS_GRADE_CROSS_SURFACE_MANIFEST,
  TOSS_GRADE_FLOW_MANIFEST,
  TOSS_GRADE_LOCALES,
  TOSS_GRADE_REQUIREMENTS,
  TOSS_GRADE_VIEWPORTS,
} from "../helpers/toss-grade-wave0-manifest"

const APP_ROOT = process.cwd()
const UX_DOC_ROOT = resolve(APP_ROOT, "../docs/toss-grade-ux")
const CHECKPOINT_BY_ATTACK = {
  success: "TERMINAL",
  cancel: "CANCEL",
  failure: "ERROR",
  retry: "RETRY",
  "exact-return": "RETURN",
} as const

function readAppFile(path: string) {
  return readFileSync(resolve(APP_ROOT, path), "utf8")
}

function readUxDoc(path: string) {
  return readFileSync(resolve(UX_DOC_ROOT, path), "utf8")
}

function linkedRequirements(source: string) {
  const linkRow = source.split("\n").find((line) => line.startsWith("| 연결 요구 |")) ?? ""
  return [...new Set(linkRow.match(/REQ-\d{3}/g) ?? [])].sort()
}

function acceptanceItems(source: string) {
  const acceptance = source.split(/^## 11\./m)[0].split(/^### Acceptance criteria$/m)[1] ?? ""
  return acceptance.split("\n").filter((line) => line.startsWith("- [ ] "))
}

test("W0-COVERAGE-001 fixes the exact 18-flow × requirement × locale × viewport × attack target", () => {
  expect(TOSS_GRADE_FLOW_MANIFEST.map((flow) => flow.id)).toEqual(B_FLOW_IDS)
  expect(new Set(TOSS_GRADE_FLOW_MANIFEST.map((flow) => flow.id)).size).toBe(18)
  expect(TOSS_GRADE_LOCALES).toEqual(["en", "ko", "ja"])
  expect(TOSS_GRADE_VIEWPORTS.map((viewport) => viewport.id)).toEqual([
    "320x568", "320x800", "360x800", "390x844", "430x932", "768x1024", "844x390", "1440x900",
  ])
  expect(TOSS_GRADE_ATTACKS).toEqual(["success", "cancel", "failure", "retry", "exact-return"])

  const requirementLinks = TOSS_GRADE_FLOW_MANIFEST.reduce((sum, flow) => sum + flow.requirements.length, 0)
  expect(requirementLinks).toBe(52)
  expect(TOSS_GRADE_ATTACK_MATRIX).toHaveLength(requirementLinks * 3 * 8 * 5)
  expect(TOSS_GRADE_ATTACK_MATRIX).toHaveLength(6_240)
  expect(new Set(TOSS_GRADE_ATTACK_MATRIX.map((cell) => cell.id)).size).toBe(TOSS_GRADE_ATTACK_MATRIX.length)

  for (const flow of TOSS_GRADE_FLOW_MANIFEST) {
    for (const requirement of flow.requirements) {
      for (const locale of TOSS_GRADE_LOCALES) {
        for (const viewport of TOSS_GRADE_VIEWPORTS) {
          const attacks = TOSS_GRADE_ATTACK_MATRIX
            .filter((cell) => cell.flowId === flow.id && cell.requirement === requirement.id && cell.locale === locale && cell.viewport === viewport.id)
            .map((cell) => cell.attack)
          expect(attacks, `${flow.id}/${requirement.id}/${locale}/${viewport.id}`).toEqual(TOSS_GRADE_ATTACKS)
        }
      }
    }
  }
})

test("W0-COVERAGE-002 keeps the flow documents, REQ ownership, and all 195 acceptance items executable", () => {
  let acceptanceTotal = 0
  const coveredRequirements = new Set<string>()

  for (const flow of TOSS_GRADE_FLOW_MANIFEST) {
    const path = resolve(UX_DOC_ROOT, flow.doc)
    expect(existsSync(path), `${flow.id} specification must exist`).toBe(true)
    const source = readFileSync(path, "utf8")
    expect(source).toContain("THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY")
    expect(linkedRequirements(source), `${flow.id} linked requirements`).toEqual(flow.requirements.map((item) => item.id).sort())
    const items = acceptanceItems(source)
    expect(items, `${flow.id} acceptance census`).toHaveLength(flow.acceptanceCount)
    expect(items[0], `${flow.id} must preserve the seven checkpoints`).toContain("ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN")
    acceptanceTotal += items.length
    flow.requirements.forEach((item) => coveredRequirements.add(item.id))
  }

  expect(acceptanceTotal).toBe(195)
  expect([...coveredRequirements].sort()).toEqual([...TOSS_GRADE_REQUIREMENTS].sort())
})

test("W0-COVERAGE-003 maps every branch to non-placeholder browser evidence", () => {
  const behaviorSource = readAppFile("tests/e2e/ondo-b-flow-coverage.spec.ts")
  expect(behaviorSource).not.toMatch(/test\.(?:skip|fixme)\s*\(/)

  for (const flow of TOSS_GRADE_FLOW_MANIFEST) {
    expect(behaviorSource, `${flow.id} must be reachable in the canonical browser suite`).toContain(flow.id)
    const contract = B_FLOW_CONTRACTS.find((item) => item.flow === flow.id)
    expect(contract, `${flow.id} checkpoint registry`).toBeDefined()
    expect(contract?.checkpoints.map((checkpoint) => checkpoint.checkpoint)).toEqual(B_CHECKPOINTS)
    for (const attack of TOSS_GRADE_ATTACKS) {
      const checkpoint = CHECKPOINT_BY_ATTACK[attack]
      const evidence = contract?.checkpoints.find((item) => item.checkpoint === checkpoint)
      expect(evidence?.disposition, `${flow.id}/${attack} cannot be an unproved N/A`).toBe("actual")
      expect(evidence?.proof.length, `${flow.id}/${attack} requires a concrete proof statement`).toBeGreaterThan(20)
    }

    for (const path of Object.values(flow.currentEvidence)) {
      expect(existsSync(resolve(APP_ROOT, path)), `${flow.id} evidence file ${path}`).toBe(true)
      const source = readAppFile(path)
      expect(source.length, `${path} cannot be a placeholder`).toBeGreaterThan(500)
      if (path.endsWith(".spec.ts")) {
        expect(source, `${path} must execute assertions`).toMatch(/\btest(?:\.describe)?\s*\(/)
        expect(source, `${path} must contain an assertion`).toMatch(/\bexpect\s*\(/)
      }
    }
    expect(readAppFile(flow.currentEvidence.visualRegistry), `${flow.id} visual checkpoint mapping`).toContain(`"${flow.id}:ENTRY"`)
  }
})

test("W0-COVERAGE-004 tracks cross-flow shell/settings/editorial/motion acceptance without deleting it", () => {
  const expected = [
    ["X-01", 10],
    ["X-02", 11],
    ["X-03", 10],
    ["X-04", 10],
  ]
  expect(TOSS_GRADE_CROSS_SURFACE_MANIFEST.map((surface) => [surface.id, surface.acceptanceCount])).toEqual(expected)

  let acceptanceTotal = 0
  for (const surface of TOSS_GRADE_CROSS_SURFACE_MANIFEST) {
    const source = readUxDoc(surface.doc)
    const items = source.split("\n").filter((line) => line.startsWith("- [ ] "))
    expect(items, `${surface.id} acceptance census`).toHaveLength(surface.acceptanceCount)
    for (const requirement of surface.requirements) expect(source).toContain(requirement)
    acceptanceTotal += items.length
  }
  expect(acceptanceTotal).toBe(41)
})

test("W0-COVERAGE-005 reports the shared pixel baseline gaps instead of claiming a full target matrix", () => {
  const actualLocales = [...new Set(B_VISUAL_CASES.map((item) => item.locale))].sort()
  const actualViewports = B_SLEEK_VIEWPORTS.map((viewport) => viewport.id)
  expect(actualLocales).toEqual([...CURRENT_SHARED_PIXEL_BASELINE.locales].sort())
  expect(actualViewports).toEqual(CURRENT_SHARED_PIXEL_BASELINE.viewports)

  const missingLocales = TOSS_GRADE_LOCALES.filter((locale) => !actualLocales.includes(locale as "en" | "ko"))
  const missingViewports = TOSS_GRADE_VIEWPORTS.map((viewport) => viewport.id)
    .filter((viewport) => !actualViewports.includes(viewport as (typeof actualViewports)[number]))
  expect(missingLocales).toEqual(CURRENT_SHARED_PIXEL_BASELINE.knownTargetGaps.locales)
  expect(missingViewports).toEqual(CURRENT_SHARED_PIXEL_BASELINE.knownTargetGaps.viewports)
  expect(CURRENT_SHARED_PIXEL_BASELINE.knownTargetGaps.combinationCoverage).toBe("partial")
})
