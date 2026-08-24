import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import {
  B_PRODUCTION_STRUCTURAL_VISUAL_CASES,
  B_PRODUCTION_VISUAL_CASES,
} from "../helpers/ondo-b-production-registry"

const APP_ROOT = process.cwd()
const HELPER = resolve(APP_ROOT, "tests/helpers/ondo-b-production-visual-evidence.ts")
const CONFIG = resolve(APP_ROOT, "playwright.production-visual.config.ts")
const VISUAL_SPECS = [
  "tests/visual/ondo-b-production-visual-mobile.spec.ts",
  "tests/visual/ondo-b-production-visual-desktop.spec.ts",
  "tests/visual/ondo-b-production-visual-responsive.spec.ts",
] as const
const STRUCTURAL_SPEC = resolve(APP_ROOT, "tests/visual/ondo-b-production-visual-structural.spec.ts")
const SNAPSHOT_ROOT = resolve(APP_ROOT, "tests/visual/ondo-b-production-snapshots")
const EXPECTED_VIEWPORTS = ["360x800", "390x844", "430x932", "768x1024", "801x1000", "1440x1000"]
const EXPECTED_STRUCTURAL_VIEWPORTS = ["430x720", "667x320"]

function filesBelow(root: string): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name)
    return entry.isDirectory() ? filesBelow(path) : [path]
  })
}

test("PROD-VIS-001 all twenty production cases own an explicit current surface selector and setup", () => {
  const cases = B_PRODUCTION_VISUAL_CASES as readonly Record<string, unknown>[]
  expect(cases).toHaveLength(20)
  expect(new Set(cases.map((item) => item.id)).size).toBe(20)
  expect(cases.map(({ id, surfaceSelector, setup }) => ({ id, surfaceSelector, setup })))
    .toEqual(cases.map(({ id, state }) => ({
      id,
      surfaceSelector: expect.stringMatching(/^\[data-testid='[^']+'\](?:\s.+)?$/),
      setup: state,
    })))
})

test("PROD-VIS-002 the current helper and four visual owners define 120 canonical plus four structural rows", () => {
  const required = [HELPER, CONFIG, STRUCTURAL_SPEC, ...VISUAL_SPECS.map((path) => resolve(APP_ROOT, path))]
  expect(required.filter((path) => !existsSync(path)), "missing current production visual files").toEqual([])

  const source = required.map((path) => readFileSync(path, "utf8")).join("\n")
  for (const viewport of EXPECTED_VIEWPORTS) expect(source).toContain(viewport)
  expect(source).toContain("B_PRODUCTION_VISUAL_CASES")
  expect(source).toContain("PRODUCTION_VISUAL_VIEWPORTS")
  expect(source).toContain("setupBProductionVisualCase")
  expect(source).toContain("expectBProductionVisualGuards")
  expect(source).toContain("B_PRODUCTION_STRUCTURAL_VISUAL_CASES")
  expect(source).toContain("setupBProductionStructuralVisualCase")
  expect(source).toContain("expectBProductionStructuralVisualGuards")
  expect(source).toContain("ondo-b-production-snapshots")
  expect(B_PRODUCTION_VISUAL_CASES.length * EXPECTED_VIEWPORTS.length).toBe(120)
  expect(B_PRODUCTION_STRUCTURAL_VISUAL_CASES).toHaveLength(4)
  expect(B_PRODUCTION_VISUAL_CASES.length * EXPECTED_VIEWPORTS.length + B_PRODUCTION_STRUCTURAL_VISUAL_CASES.length).toBe(124)
})

test("PROD-VIS-003 current production visual harness has no prototype helper, query injection, or legacy storage seam", () => {
  const files = [HELPER, CONFIG, STRUCTURAL_SPEC, ...VISUAL_SPECS.map((path) => resolve(APP_ROOT, path))]
  const source = files.filter(existsSync).map((path) => readFileSync(path, "utf8")).join("\n")
  expect(source).not.toMatch(/ondo-b-visual-evidence|ondo-b-qa|B_VISUAL_CASES|B_SLEEK_VIEWPORTS/)
  expect(source).not.toMatch(/(?:scenario|qaCase|[?&]qa=|[?&]scenario=|sessionStorage|ondo\.(?:preferences|session)\.v3)/i)
  expect(source).not.toMatch(/page\.goto\(\s*["'`]\/ondo-b\?/)
})

test("PROD-VIS-004 the new current namespace contains exactly 124 fresh non-empty PNG baselines", () => {
  const pngs = filesBelow(SNAPSHOT_ROOT).filter((path) => path.endsWith(".png"))
  expect(pngs).toHaveLength(124)
  expect(new Set(pngs.map((path) => path.slice(SNAPSHOT_ROOT.length + 1))).size).toBe(124)
  expect(pngs.filter((path) => statSync(path).size < 10_000), "undersized production PNGs").toEqual([])
  for (const viewport of EXPECTED_VIEWPORTS) {
    expect(pngs.filter((path) => path.includes(viewport)), `missing ${viewport} census`).toHaveLength(20)
  }
  for (const viewport of EXPECTED_STRUCTURAL_VIEWPORTS) {
    expect(pngs.filter((path) => path.includes(viewport)), `missing ${viewport} structural census`).toHaveLength(2)
  }
})

test("PROD-VIS-005 the sparse structural census freezes two locales across compact-map and ultra-short", () => {
  expect(B_PRODUCTION_STRUCTURAL_VISUAL_CASES.map((item) => ({
    id: item.id,
    locale: item.locale,
    viewport: item.viewport,
    expectedLayoutMode: item.expectedLayoutMode,
    expectedRequestedView: item.expectedRequestedView,
    expectedEffectiveView: item.expectedEffectiveView,
    surfaceSelector: item.surfaceSelector,
  }))).toEqual([
    { id: "PR-PX-STRUCTURAL-COMPACT-EN", locale: "en", viewport: { id: "430x720", width: 430, height: 720, owner: "structural" }, expectedLayoutMode: "compact-map", expectedRequestedView: "map", expectedEffectiveView: "map", surfaceSelector: "[data-testid='ondo-b-map-chrome']" },
    { id: "PR-PX-STRUCTURAL-COMPACT-KO", locale: "ko", viewport: { id: "430x720", width: 430, height: 720, owner: "structural" }, expectedLayoutMode: "compact-map", expectedRequestedView: "map", expectedEffectiveView: "map", surfaceSelector: "[data-testid='ondo-b-map-chrome']" },
    { id: "PR-PX-STRUCTURAL-ULTRA-EN", locale: "en", viewport: { id: "667x320", width: 667, height: 320, owner: "structural" }, expectedLayoutMode: "ultra-short", expectedRequestedView: "map", expectedEffectiveView: "list", surfaceSelector: "[data-testid='ondo-b-list-panel']" },
    { id: "PR-PX-STRUCTURAL-ULTRA-KO", locale: "ko", viewport: { id: "667x320", width: 667, height: 320, owner: "structural" }, expectedLayoutMode: "ultra-short", expectedRequestedView: "map", expectedEffectiveView: "list", surfaceSelector: "[data-testid='ondo-b-list-panel']" },
  ])
  expect(existsSync(STRUCTURAL_SPEC), "missing sparse structural visual owner").toBe(true)
})
