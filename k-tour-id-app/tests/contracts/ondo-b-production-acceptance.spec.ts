import { existsSync, readFileSync } from "node:fs"
import { dirname, extname, relative, resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { B_PRODUCTION_FLOWS, B_PRODUCTION_VISUAL_CASES } from "../helpers/ondo-b-production-registry"

const APP_ROOT = process.cwd()
const B_ENTRY = resolve(APP_ROOT, "features/ondo/app/ondo-product-b.tsx")
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const

function localImportTargets(source: string) {
  const targets: string[] = []
  const pattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g
  for (const match of source.matchAll(pattern)) targets.push(match[1])
  return targets.filter((target) => target.startsWith(".") || target.startsWith("@/"))
}

function resolveSource(importer: string, target: string) {
  const base = target.startsWith("@/")
    ? resolve(APP_ROOT, target.slice(2))
    : resolve(dirname(importer), target)
  const candidates = extname(base)
    ? [base]
    : [
        ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
        ...SOURCE_EXTENSIONS.map((extension) => resolve(base, `index${extension}`)),
      ]
  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function productionImportGraph(entry = B_ENTRY) {
  const pending = [entry]
  const visited = new Set<string>()
  while (pending.length > 0) {
    const file = pending.pop()
    if (!file || visited.has(file)) continue
    visited.add(file)
    const source = readFileSync(file, "utf8")
    for (const target of localImportTargets(source)) {
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

const BANNED_RUNTIME_PATHS = [
  /(^|\/)after19(\/|$)/i,
  /(^|\/)commerce(\/|$)/i,
  /(^|\/)connect(\/|$)/i,
  /(^|\/)identity(\/|$)/i,
  /(^|\/)labs(\/|$)/i,
  /(^|\/)rewards(\/|$)/i,
  /(^|\/)trust(\/|$)/i,
  /demo-signals/i,
  /(^|\/)fixtures?(\.|\/|$)/i,
] as const

const BANNED_VISIBLE_COPY = [
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
  /\bafter\s*19\b/i,
  /\b(?:join|open)\s+(?:a\s+)?table\b/i,
  /\btable\s+chat\b/i,
  /\btrust\s+(?:score|axis|axes)\b/i,
  /\bvisit\s+stamps?\b/i,
  /\b(?:wallet|bridge)\s+(?:success|complete|confirmed)\b/i,
  /데모|시뮬레이션|모의\s*(?:성공|결제|인증)|가설|테스트\s*토큰|픽스처|샘플\s*(?:데이터|신호)/i,
] as const

test("PROD-B-001 active /ondo-b import graph excludes unconfigured product clusters and synthetic data", () => {
  const paths = productionImportGraph().map((file) => relative(APP_ROOT, file))
  const banned = paths.filter((path) => BANNED_RUNTIME_PATHS.some((pattern) => pattern.test(path)))
  expect(banned, `banned runtime modules:\n${banned.join("\n")}`).toEqual([])

  const source = graphSource(productionImportGraph())
  const clusterTokens = /\b(?:TablesEntry|ConnectOverlays|GateOverlay|IdentityEntry|After19Layer|After19VenueReturn|CheckoutOverlay|LabsEntry|stamps?)\b/
  const tokenHits = source.filter(({ source: text }) => clusterTokens.test(text)).map(({ file }) => file)
  expect(tokenHits, `retired cluster symbols in runtime graph:\n${tokenHits.join("\n")}`).toEqual([])
})

test("PROD-B-002 scenario, QA, and legacy storage injection cannot mutate production UI or state", () => {
  const source = graphSource(productionImportGraph())
  const queryHits = source.filter(({ source: text }) => (
    /\.get\(\s*["'](?:scenario|qa|qaCase)["']\s*\)/.test(text)
    || /use-qa-controls|useQaControls|data-qa-controls/.test(text)
  )).map(({ file }) => file)
  expect(queryHits, `query injection seams:\n${queryHits.join("\n")}`).toEqual([])

  const sessionHits = source.filter(({ source: text }) => /\bsessionStorage\b/.test(text)).map(({ file }) => file)
  expect(sessionHits, `session-backed product state:\n${sessionHits.join("\n")}`).toEqual([])

  const legacyKeys = /ondo\.(?:preferences|session)\.v3|ondo\.(?:chat|table-outcomes|labs|accepted-visits)\.v2/
  const legacyHits = source.filter(({ source: text }) => legacyKeys.test(text)).map(({ file }) => file)
  expect(legacyHits, `legacy injected storage keys:\n${legacyHits.join("\n")}`).toEqual([])

  const localStorageFiles = source.filter(({ source: text }) => /\blocalStorage\b/.test(text))
  for (const { file, source: text } of localStorageFiles) {
    expect(text, `${file} must use only the production device boundary`).toContain("ondo-b.device.v1")
  }
})

test("PROD-B-003 reachable user-facing literals contain no demo, simulation, hypothesis, or fake-success copy", () => {
  const source = graphSource(productionImportGraph()).filter(({ file }) => /\.[jt]sx?$/.test(file))
  const hits = source.flatMap(({ file, source: text }) => {
    const literals = [...text.matchAll(/(["'`])([^"'`\n]{1,500})\1/g)].map((match) => match[2])
    return literals.flatMap((literal) => BANNED_VISIBLE_COPY
      .filter((pattern) => pattern.test(literal))
      .map((pattern) => ({ file, literal: literal.slice(0, 180), pattern: String(pattern) })))
  })
  expect(hits, JSON.stringify(hits, null, 2)).toEqual([])
})

test("PROD-B-004 active production registry contains only six real flows and twenty pre-baseline cases", () => {
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
  const represented = new Set(B_PRODUCTION_VISUAL_CASES.flatMap((item) => item.flowIds))
  expect(represented).toEqual(new Set(B_PRODUCTION_FLOWS.map((flow) => flow.id)))

  const registryText = JSON.stringify({ flows: B_PRODUCTION_FLOWS, cases: B_PRODUCTION_VISUAL_CASES })
  expect(registryText).not.toMatch(/identity|account|kyc|payment|commerce|checkout|tables?|chat|report|labs|after\s*19|trust|stamps?|signal|score|fixture|simulat|demo/i)
})
