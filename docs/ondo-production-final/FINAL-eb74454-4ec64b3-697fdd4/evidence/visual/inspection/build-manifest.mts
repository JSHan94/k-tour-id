import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"

import {
  B_PRODUCTION_STRUCTURAL_VISUAL_CASES,
  B_PRODUCTION_VISUAL_CASES,
} from "../../../tests/helpers/ondo-b-production-registry"

const namespace = "tests/visual/ondo-b-production-snapshots"
const outputDir = "artifacts/qa/production-visual-inspection"
const canonicalViewports = ["390x844", "1440x1000", "360x800", "430x932", "768x1024", "801x1000"] as const

type Expected = {
  relativePath: string
  caseId: string
  locale: "en" | "ko"
  viewport: string
  project: "production-mobile-chromium" | "production-desktop-chromium"
  census: "core" | "structural"
}

const expected: Expected[] = []
for (const visualCase of B_PRODUCTION_VISUAL_CASES) {
  for (const viewport of canonicalViewports) {
    const project = viewport === "390x844" ? "production-mobile-chromium" : "production-desktop-chromium"
    expected.push({
      relativePath: `${project}/${visualCase.id}-${visualCase.locale}-${viewport}.png`,
      caseId: visualCase.id,
      locale: visualCase.locale,
      viewport,
      project,
      census: "core",
    })
  }
}
for (const visualCase of B_PRODUCTION_STRUCTURAL_VISUAL_CASES) {
  const project = "production-desktop-chromium"
  expected.push({
    relativePath: `${project}/${visualCase.id}-${visualCase.locale}-${visualCase.viewport.id}.png`,
    caseId: visualCase.id,
    locale: visualCase.locale,
    viewport: visualCase.viewport.id,
    project,
    census: "structural",
  })
}

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const expectedSorted = expected.toSorted((left, right) => left.relativePath.localeCompare(right.relativePath))
const expectedRelative = expectedSorted.map((entry) => entry.relativePath)
const actualRelative = walk(namespace)
  .filter((path) => path.endsWith(".png"))
  .map((path) => relative(namespace, path))
  .toSorted()
if (JSON.stringify(actualRelative) !== JSON.stringify(expectedRelative)) {
  const expectedSet = new Set(expectedRelative)
  const actualSet = new Set(actualRelative)
  throw new Error(JSON.stringify({
    missing: expectedRelative.filter((path) => !actualSet.has(path)),
    unexpected: actualRelative.filter((path) => !expectedSet.has(path)),
  }, null, 2))
}

const columns = [
  "relative_path", "sha256", "bytes", "ihdr_width", "ihdr_height", "bit_depth",
  "color_type", "compression", "filter", "interlace", "case_id", "locale",
  "viewport", "project", "census",
]
const rows: string[][] = []
let totalBytes = 0
let minBytes = Number.POSITIVE_INFINITY
let maxBytes = 0
for (const entry of expectedSorted) {
  const path = join(namespace, entry.relativePath)
  const bytes = readFileSync(path)
  const size = statSync(path).size
  const signature = bytes.subarray(0, 8).toString("hex")
  const chunk = bytes.subarray(12, 16).toString("ascii")
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  const [expectedWidth, expectedHeight] = entry.viewport.split("x").map(Number)
  if (signature !== "89504e470d0a1a0a" || chunk !== "IHDR") throw new Error(`Invalid PNG: ${entry.relativePath}`)
  if (width !== expectedWidth || height !== expectedHeight) throw new Error(`Dimension mismatch: ${entry.relativePath}`)
  if (size < 10_000) throw new Error(`Undersized PNG: ${entry.relativePath}`)
  totalBytes += size
  minBytes = Math.min(minBytes, size)
  maxBytes = Math.max(maxBytes, size)
  rows.push([
    entry.relativePath,
    createHash("sha256").update(bytes).digest("hex"),
    String(size), String(width), String(height), String(bytes[24]), String(bytes[25]),
    String(bytes[26]), String(bytes[27]), String(bytes[28]), entry.caseId, entry.locale,
    entry.viewport, entry.project, entry.census,
  ])
}

const manifest = `${columns.join("\t")}\n${rows.map((row) => row.join("\t")).join("\n")}\n`
const manifestDigest = createHash("sha256").update(manifest).digest("hex")
const countBy = (index: number) => Object.fromEntries(
  [...new Set(rows.map((row) => row[index]))].toSorted().map((value) => [value, rows.filter((row) => row[index] === value).length]),
)
const ledger = {
  provenance: {
    captureBaseSha: "5eedc48fad010f935dc0c439d8168bb2781c32fb",
    captureHarnessSha: "975444adae5abfbccacd4d105bc246bc1fa733a6",
    captureEvidenceSha: "c486967aab85c1a4b2c4ffcd0ec46281307e449e",
    successorEvidenceSha: "1ea13ec97c21f8b900b7a36a89c478a733e1cf25",
    finalBaseSha: "4ec64b3de02fdd8f5298a38dde0c84f47eaa3dc6",
    finalBaseTree: "0ccf400f61d264e5084862510cee140e3d9786d1",
    finalHarnessSha: "697fdd4dc4af13e35b68c78bbcbd127b306a4291",
    finalHarnessTree: "7b9944afe0e0608e766bb5ce5162bfab9e6ddb0e",
    finalEvidenceSha: "eb74454b527445f52322eff0af48e6b703681e16",
    finalEvidenceTree: "47f1a618fa725aad20d84b52b0e8786e2c273989",
    pngTreeListingSha256: "64cf6dc604c0bd79d38d1957ae23808870d174b305f32e40368d213fee0fa21e",
  },
  captureCommand: "pnpm exec playwright test --config=playwright.production-visual.config.ts --update-snapshots=all --workers=1 --retries=0",
  finalVerificationCommand: "pnpm exec playwright test --config=playwright.production-visual.config.ts --workers=1 --retries=0",
  namespace,
  total: rows.length,
  core: rows.filter((row) => row[14] === "core").length,
  structural: rows.filter((row) => row[14] === "structural").length,
  totalBytes,
  minBytes,
  maxBytes,
  byLocale: countBy(11),
  byViewport: countBy(12),
  byProject: countBy(13),
  byCensus: countBy(14),
  uniqueCaseIds: new Set(rows.map((row) => row[10])).size,
  manifestDigest,
  inspection: "six canonical contact sheets and four structural originals passed",
  receipts: {
    initialCapture: "124 passed (3.9m)",
    candidateNoUpdate1: "124 passed (3.8m), workers=1, retries=0",
    candidateNoUpdate2: "124 passed (3.7m), workers=1, retries=0",
    highRiskRepeat3: "138 passed (4.8m), workers=1, retries=0",
    successorNoUpdate: "124 passed (4.5m), workers=1, retries=0",
    finalTypecheck: "pass",
    finalStaticContract: "5 passed",
    finalList: "124 tests in 4 files",
    finalNoUpdate: "124 passed (4.2m), workers=1, retries=0",
    pngDiff: "0 changed paths",
  },
}

mkdirSync(dirname(`${outputDir}/manifest.tsv`), { recursive: true })
writeFileSync(`${outputDir}/manifest.tsv`, manifest)
writeFileSync(`${outputDir}/manifest.sha256`, `${manifestDigest}  manifest.tsv\n`)
writeFileSync(`${outputDir}/ledger.json`, `${JSON.stringify(ledger, null, 2)}\n`)
console.log(JSON.stringify(ledger, null, 2))
