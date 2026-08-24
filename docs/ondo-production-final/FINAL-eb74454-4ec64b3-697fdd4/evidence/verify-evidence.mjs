import { createHash } from "node:crypto"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const evidenceRoot = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(evidenceRoot, "../../../..")
const snapshotRoot = join(repositoryRoot, "k-tour-id-app/tests/visual/ondo-b-production-snapshots")
const inspectionRoot = join(evidenceRoot, "visual/inspection")
const nonpixelRoot = join(evidenceRoot, "nonpixel")

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name)
  return entry.isDirectory() ? walk(path) : [path]
})

const expected = {
  product: "4ec64b3de02fdd8f5298a38dde0c84f47eaa3dc6",
  productTree: "0ccf400f61d264e5084862510cee140e3d9786d1",
  harness: "697fdd4dc4af13e35b68c78bbcbd127b306a4291",
  evidence: "eb74454b527445f52322eff0af48e6b703681e16",
  evidenceTree: "47f1a618fa725aad20d84b52b0e8786e2c273989",
  manifest: "20f67da63ec79f6030197271b9b41e5a5b57f082b4bb08076225f53ec9764924",
  manifestChecksum: "9c51fc396e716fdb1c0433f47f7cfd672e2b2169239dc189d129fb22474e768a",
  ledger: "46af2d867a3cb01e8e3c099868fe9b3849d2c8f6c7a43bafcb9d83024ff62b88",
  buildManifest: "3e0ffacf07bfc1418b26d9088e1e3f1b84d02b7bd01dc2bb1f4d470eb6847aa4",
  results: "e98d3d76c776111116ea2b589fc46df27beb93e2cac3c6e918669ff3ae76cee0",
  junit: "4ba1821331e514a8f9e5b887cf1cba72bfb9522eb759050b3dd8d00fb8794faf",
  lastRun: "91d1c43004802cd49950d78eb11c8fa7d05da8ffffe219a8b13b2f561bc00903",
  pngTree: "64cf6dc604c0bd79d38d1957ae23808870d174b305f32e40368d213fee0fa21e",
  nonpixelManifest: "d6d307f91f2184db007af6d501f6fc7bb34b739cb875d138e6e4518af2037fe6",
  nonpixelSums: "71d02218d47c0f04e8483fa460729ebaa38b7b3afda9ad6174e8542052697e4b",
}

const manifestBytes = readFileSync(join(inspectionRoot, "manifest.tsv"))
assert(sha256(manifestBytes) === expected.manifest, "visual manifest digest mismatch")
const manifestChecksumBytes = readFileSync(join(inspectionRoot, "manifest.sha256"))
assert(sha256(manifestChecksumBytes) === expected.manifestChecksum, "visual manifest checksum digest mismatch")
assert(
  manifestChecksumBytes.toString("utf8") === `${expected.manifest}  manifest.tsv\n`,
  "visual manifest checksum file mismatch",
)
const lines = manifestBytes.toString("utf8").trimEnd().split("\n")
const headers = lines[0].split("\t")
assert(headers.join("\t") === "relative_path\tsha256\tbytes\tihdr_width\tihdr_height\tbit_depth\tcolor_type\tcompression\tfilter\tinterlace\tcase_id\tlocale\tviewport\tproject\tcensus", "visual manifest schema mismatch")
const rows = lines.slice(1).map((line) => line.split("\t"))
assert(rows.length === 124, `expected 124 visual rows, found ${rows.length}`)
assert(rows.every((row) => row.length === headers.length), "visual manifest column mismatch")
assert(new Set(rows.map((row) => row[0])).size === 124, "visual paths are not unique")

const actualPaths = walk(snapshotRoot)
  .filter((path) => path.endsWith(".png"))
  .map((path) => path.slice(snapshotRoot.length + 1))
  .toSorted()
assert(JSON.stringify(actualPaths) === JSON.stringify(rows.map((row) => row[0]).toSorted()), "visual path census mismatch")
for (const row of rows) {
  const bytes = readFileSync(join(snapshotRoot, row[0]))
  assert(sha256(bytes) === row[1], `PNG digest mismatch: ${row[0]}`)
  assert(statSync(join(snapshotRoot, row[0])).size === Number(row[2]), `PNG byte mismatch: ${row[0]}`)
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `PNG signature mismatch: ${row[0]}`)
  assert(bytes.subarray(12, 16).toString("ascii") === "IHDR", `PNG IHDR mismatch: ${row[0]}`)
  assert(bytes.readUInt32BE(16) === Number(row[3]), `PNG width mismatch: ${row[0]}`)
  assert(bytes.readUInt32BE(20) === Number(row[4]), `PNG height mismatch: ${row[0]}`)
}

assert(sha256(readFileSync(join(inspectionRoot, "build-manifest.mts"))) === expected.buildManifest, "visual manifest builder digest mismatch")
const ledgerBytes = readFileSync(join(inspectionRoot, "ledger.json"))
assert(sha256(ledgerBytes) === expected.ledger, "visual ledger digest mismatch")
const ledger = JSON.parse(ledgerBytes.toString("utf8"))
assert(ledger.provenance.finalBaseSha === expected.product, "visual ledger Product mismatch")
assert(ledger.provenance.finalBaseTree === expected.productTree, "visual ledger Product tree mismatch")
assert(ledger.provenance.finalHarnessSha === expected.harness, "visual ledger Harness mismatch")
assert(ledger.provenance.finalEvidenceSha === expected.evidence, "visual ledger evidence mismatch")
assert(ledger.provenance.finalEvidenceTree === expected.evidenceTree, "visual ledger evidence tree mismatch")
assert(ledger.provenance.pngTreeListingSha256 === expected.pngTree, "PNG tree-listing digest mismatch")
assert(ledger.manifestDigest === expected.manifest && ledger.total === 124, "visual ledger census mismatch")

const noUpdateRoot = join(evidenceRoot, "visual/no-update")
const reporterBytes = readFileSync(join(noUpdateRoot, "results.json"))
assert(sha256(reporterBytes) === expected.results, "visual results digest mismatch")
assert(sha256(readFileSync(join(noUpdateRoot, "junit.xml"))) === expected.junit, "visual JUnit digest mismatch")
assert(sha256(readFileSync(join(noUpdateRoot, ".last-run.json"))) === expected.lastRun, "visual last-run digest mismatch")
const reporter = JSON.parse(reporterBytes.toString("utf8"))
assert(reporter.stats.expected === 124, "visual reporter expected-count mismatch")
assert(reporter.stats.skipped === 0 && reporter.stats.unexpected === 0 && reporter.stats.flaky === 0, "visual reporter is not a clean no-update pass")
assert((reporter.errors ?? []).length === 0, "visual reporter contains top-level errors")

assert(sha256(readFileSync(join(nonpixelRoot, "00-MANIFEST.json"))) === expected.nonpixelManifest, "nonpixel manifest digest mismatch")
const nonpixelSumsBytes = readFileSync(join(nonpixelRoot, "SHA256SUMS"))
assert(sha256(nonpixelSumsBytes) === expected.nonpixelSums, "nonpixel SHA256SUMS digest mismatch")
const sumLines = nonpixelSumsBytes.toString("utf8").trimEnd().split("\n")
assert(sumLines.length === 32, `expected 32 nonpixel checksum entries, found ${sumLines.length}`)
for (const line of sumLines) {
  const match = line.match(/^([0-9a-f]{64})  (.+)$/)
  assert(match, `invalid nonpixel checksum line: ${line}`)
  const basename = match[2].split("/").at(-1)
  assert(sha256(readFileSync(join(nonpixelRoot, basename))) === match[1], `nonpixel digest mismatch: ${basename}`)
}
const nonpixel = JSON.parse(readFileSync(join(nonpixelRoot, "00-MANIFEST.json"), "utf8"))
assert(nonpixel.status === "PASS", "nonpixel manifest is not PASS")
assert(nonpixel.identity.commit === expected.product && nonpixel.identity.tree === expected.productTree, "nonpixel Product identity mismatch")
assert(nonpixel.gates.contracts.passed === 65 && nonpixel.gates.contracts.failed === 0, "nonpixel contract census mismatch")
assert(nonpixel.gates.productionB.passed === 75 && nonpixel.gates.productionB.skipped === 11 && nonpixel.gates.productionB.failed === 0, "nonpixel B census mismatch")
assert(nonpixel.gates.protectedA.passed === 22 && nonpixel.gates.protectedA.failed === 0, "nonpixel A census mismatch")
assert(nonpixel.gates.standalone.artifact.files === 29 && nonpixel.gates.standalone.artifact.bytes === 7133962, "standalone census mismatch")

console.log(JSON.stringify({ status: "PASS", visualRows: rows.length, nonpixelChecksumEntries: sumLines.length }, null, 2))
