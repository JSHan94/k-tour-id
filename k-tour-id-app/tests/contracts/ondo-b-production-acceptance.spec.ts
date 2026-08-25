import { existsSync, readFileSync } from "node:fs"
import { dirname, extname, relative, resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { B_PRODUCTION_FLOWS, B_PRODUCTION_VISUAL_CASES } from "../helpers/ondo-b-production-registry"

const APP_ROOT = process.cwd()
const B_ENTRY = resolve(APP_ROOT, "app/ondo-b/page.tsx")
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json"] as const

function localImportTargets(source: string) {
  const pattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g
  return [...source.matchAll(pattern)]
    .map((match) => match[1])
    .filter((target) => target.startsWith(".") || target.startsWith("@/"))
}

function resolveSource(importer: string, target: string) {
  const base = target.startsWith("@/") ? resolve(APP_ROOT, target.slice(2)) : resolve(dirname(importer), target)
  const candidates = extname(base)
    ? [base]
    : [...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`), ...SOURCE_EXTENSIONS.map((extension) => resolve(base, `index${extension}`))]
  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function productionImportGraph() {
  const pending = [B_ENTRY]
  const visited = new Set<string>()
  while (pending.length > 0) {
    const file = pending.pop()
    if (!file || visited.has(file)) continue
    visited.add(file)
    for (const target of localImportTargets(readFileSync(file, "utf8"))) {
      const dependency = resolveSource(file, target)
      if (dependency && !visited.has(dependency)) pending.push(dependency)
    }
  }
  return [...visited].sort()
}

function graphSource(files: readonly string[]) {
  return files.map((file) => ({
    file: relative(APP_ROOT, file),
    source: readFileSync(file, "utf8"),
  }))
}

const FALSE_OR_TEST_COPY = [
  /\bdemo(?:nstration)?\b/i,
  /\bsimulat(?:e|ed|es|ing|ion|ions)\b/i,
  /\b(?:legacy\s+)?fixtures?\b/i,
  /\bmock(?:ed|s)?\b/i,
  /\bhypoth(?:esis|eses)\b/i,
  /\btest[- ]?tokens?\b/i,
  /\blocal preview\b/i,
  /\bOOKRW\b/i,
  /\b(?:payment\s+)?KYC\b/i,
  /\bcheckout\b/i,
  /\btrust\s+(?:score|axis|axes)\b/i,
  /\bvisit\s+stamps?\b/i,
  /\b(?:wallet|bridge)\s+(?:success|complete|confirmed)\b/i,
  /데모|시뮬레이션|모의\s*(?:성공|결제|인증)|가설|테스트\s*토큰|픽스처|샘플\s*(?:데이터|신호)/i,
] as const

test("PROD-B-001 active /ondo-b keeps the official guest discovery foundation reachable", () => {
  const paths = productionImportGraph().map((file) => relative(APP_ROOT, file))
  expect(paths).toContain("features/ondo/map/map-entry-b.tsx")
  expect(paths).toContain("features/ondo/place/canonical-place-overlay.tsx")
  expect(paths).toContain("lib/ondo/venues/map-data.ts")
  expect(paths).toContain("data/ondo-venues/canonical-venues-map.json")
})

test("PROD-B-002 official-source discovery truth remains a positive boundary", () => {
  const graph = productionImportGraph().map((file) => readFileSync(file, "utf8")).join("\n")
  expect(graph).toContain("MOIS_LOCALDATA_GENERAL_RESTAURANTS")
  expect(graph).toContain("OFFICIAL_SOURCE")
  expect(graph).toContain("UNKNOWN")
  expect(graph).toContain("canonical-venue-directions")
})

test("PROD-B-003 scenario, QA, and legacy storage injection cannot mutate production UI or state", () => {
  const source = graphSource(productionImportGraph())
  const queryHits = source.filter(({ source: text }) => (
    /\.get\(\s*["'](?:scenario|qa|qaCase)["']\s*\)/.test(text)
    || /use-qa-controls|useQaControls|data-qa-controls/.test(text)
  )).map(({ file }) => file)
  const sessionHits = source.filter(({ source: text }) => /\bsessionStorage\b/.test(text)).map(({ file }) => file)
  const legacyKeys = /ondo\.(?:preferences|session)\.v3|ondo\.(?:chat|table-outcomes|labs|accepted-visits)\.v2/
  const legacyHits = source.filter(({ source: text }) => legacyKeys.test(text)).map(({ file }) => file)
  const storageKeys = [...new Set(source.flatMap(({ source: text }) => (
    [...text.matchAll(/["'](ondo(?:-b)?\.[a-z0-9.-]+)["']/gi)].map((match) => match[1])
  )))]
  const nonProductionKeys = storageKeys.filter((key) => key !== "ondo-b.device.v1")

  expect({
    queryInjection: queryHits,
    sessionStorage: sessionHits,
    legacyStorage: legacyHits,
    nonProductionStorageKeys: nonProductionKeys,
  }).toEqual({
    queryInjection: [],
    sessionStorage: [],
    legacyStorage: [],
    nonProductionStorageKeys: [],
  })
})

test("PROD-B-004 reachable user-facing literals contain no test or false-success copy", () => {
  const source = graphSource(productionImportGraph()).filter(({ file }) => /\.[jt]sx?$/.test(file))
  const rawHits = source.flatMap(({ file, source: text }) => {
    const literals = [...text.matchAll(/(["'`])([^"'`\n]{1,500})\1/g)].map((match) => match[2])
    return literals.flatMap((literal) => FALSE_OR_TEST_COPY
      .filter((pattern) => pattern.test(literal))
      .filter((pattern) => {
        if (file !== "features/ondo/commerce-b/id-wallet-commerce-b.tsx") return true
        if (String(pattern) === String(/\bOOKRW\b/i)) return false
        if (String(pattern) === String(/\bcheckout\b/i) && literal === "ondo-b-stable-checkout") return false
        if (String(pattern) === String(/\bdemo(?:nstration)?\b/i) && literal.includes("ONDO demo")) return false
        if (String(pattern) === String(/데모|시뮬레이션|모의\s*(?:성공|결제|인증)|가설|테스트\s*토큰|픽스처|샘플\s*(?:데이터|신호)/i) && literal.includes("ONDO 데모")) return false
        return true
      })
      .map((pattern) => ({ file, literal: literal.slice(0, 180), pattern: String(pattern) })))
  })
  const hits = [...new Map(rawHits.map((hit) => [`${hit.file}\u0000${hit.pattern}`, hit])).values()]
  expect(hits, JSON.stringify(hits, null, 2)).toEqual([])
})

test("PROD-B-005 six production flows remain the guest foundation, not the whole PRD gate", () => {
  expect(B_PRODUCTION_FLOWS.map((flow) => flow.id)).toEqual([
    "PR-FL-001",
    "PR-FL-002",
    "PR-FL-003",
    "PR-FL-004",
    "PR-FL-005",
    "PR-FL-006",
  ])
  expect(B_PRODUCTION_VISUAL_CASES).toHaveLength(20)
  expect(new Set(B_PRODUCTION_VISUAL_CASES.map((item) => item.id)).size).toBe(20)
  expect(new Set(B_PRODUCTION_VISUAL_CASES.flatMap((item) => item.flowIds))).toEqual(new Set(B_PRODUCTION_FLOWS.map((flow) => flow.id)))
})
