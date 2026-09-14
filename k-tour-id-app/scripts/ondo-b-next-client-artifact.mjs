import { readFile, readdir, stat } from "node:fs/promises"
import { extname, resolve } from "node:path"
import { runInNewContext } from "node:vm"
import { FORBIDDEN_QA_ARTIFACT_TEXT, LEGACY_ARTIFACT_PATH, LEGACY_ARTIFACT_TEXT } from "./ondo-b-standalone/policy.mjs"

const APP_ROOT = resolve(import.meta.dirname, "..")
const SOURCE_ROOT = process.env.ONDO_B_NEXT_SOURCE_ROOT ? resolve(APP_ROOT, process.env.ONDO_B_NEXT_SOURCE_ROOT) : APP_ROOT
const NEXT_ROOT = process.env.ONDO_B_NEXT_ROOT ? resolve(APP_ROOT, process.env.ONDO_B_NEXT_ROOT) : resolve(APP_ROOT, ".next")
const CLIENT_MANIFEST = resolve(NEXT_ROOT, "server/app/page_client-reference-manifest.js")
const SERVER_ROUTE = resolve(NEXT_ROOT, "server/app/api/ondo/venues/[venueId]/route.js")
const SERVER_TRACE = `${SERVER_ROUTE}.nft.json`
const PULSE_SOURCE = resolve(SOURCE_ROOT, "features/ondo/pulse-b/pulse-model-b.ts")
// The single flagship venue is intentionally shared by temperature, Tables,
// Place, commerce and My Korea. Keep that interlink explicit while the total
// occurrence budget and the non-curated-id check still catch dataset leakage.
const MAX_CURATED_PULSE_MULTIPLICITY = 7
const FORBIDDEN_QA_RUNTIME_TEXT = [
  "__ONDO_B_QA__",
  "ondo.qa.controls.v1",
  "ondo.qa.scenario.v1",
  "NEXT_PUBLIC_ONDO_QA_CONTROLS",
]

function fail(message, details) {
  throw new Error(`${message}${details ? `\n${JSON.stringify(details, null, 2)}` : ""}`)
}

async function filesBelow(root, prefix = "") {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const item = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await filesBelow(resolve(root, entry.name), item))
    else files.push(item)
  }
  return files.sort()
}

async function assertIsolatedNextClosure() {
  if (SOURCE_ROOT === APP_ROOT) return null
  const manifest = JSON.parse(await readFile(resolve(NEXT_ROOT, "server/app-paths-manifest.json"), "utf8"))
  const routes = Object.keys(manifest).sort()
  const expectedRoutes = ["/_global-error/page", "/_not-found/page", "/api/ondo/venues/[venueId]/route", "/ondo-b/page", "/page"]
  if (JSON.stringify(routes) !== JSON.stringify(expectedRoutes)) fail("The isolated Next route census drifted", routes)

  const files = await filesBelow(NEXT_ROOT)
  const legacyPaths = files.filter((file) => LEGACY_ARTIFACT_PATH.test(file))
  if (legacyPaths.length) fail("Legacy-named files leaked into the isolated Next artifact", legacyPaths)
  const textFiles = files.filter((file) => new Set([".css", ".html", ".js", ".json", ".mjs", ".rsc", ".txt"]).has(extname(file)))
  const hits = []
  for (const file of textFiles) {
    const source = await readFile(resolve(NEXT_ROOT, file), "utf8")
    for (const pattern of [...FORBIDDEN_QA_ARTIFACT_TEXT, ...LEGACY_ARTIFACT_TEXT]) {
      if (pattern.test(source)) hits.push(`${file}: ${pattern}`)
    }
  }
  if (hits.length) fail("Blocked QA or legacy text leaked into the isolated Next artifact", hits)
  return { routes, files: files.length }
}

export async function scanOndoBNextClientArtifact() {
  const isolated = await assertIsolatedNextClosure()
  const [manifestSource, pulseSource] = await Promise.all([
    readFile(CLIENT_MANIFEST, "utf8"),
    readFile(PULSE_SOURCE, "utf8"),
  ])
  const context = { globalThis: {} }
  runInNewContext(manifestSource, context)
  const manifest = context.globalThis.__RSC_MANIFEST?.["/page"]
  const entry = Object.entries(manifest?.clientModules ?? {})
    .find(([file]) => file.endsWith("/features/ondo/app/ondo-product-b.tsx"))?.[1]
  if (!entry) fail("The canonical / client entry is absent from the Next build manifest")

  const chunkFiles = [...new Set(entry.chunks.filter((item) => typeof item === "string" && item.endsWith(".js")))]
  const chunks = await Promise.all(chunkFiles.map(async (file) => {
    // Turbopack may serialize browser-facing chunk URLs (/_next/static/...)
    // while webpack serializes paths relative to .next (static/...). Both
    // describe the same production artifact and must remain inside NEXT_ROOT.
    const artifactPath = file.replace(/^\/?_next\//, "")
    const absolutePath = resolve(NEXT_ROOT, artifactPath)
    return {
      file,
      bytes: (await stat(absolutePath)).size,
      source: await readFile(absolutePath, "utf8"),
    }
  }))
  const clientSource = chunks.map(({ source }) => source).join("\n")
  const qaRuntimeHits = FORBIDDEN_QA_RUNTIME_TEXT.filter((text) => clientSource.includes(text))
  if (qaRuntimeHits.length) fail("Production QA controls leaked into the canonical / client chunks", qaRuntimeHits)
  const venueIds = [...clientSource.matchAll(/mois-[0-9a-f]+/g)].map((match) => match[0])
  const venueIdCounts = new Map()
  for (const venueId of venueIds) venueIdCounts.set(venueId, (venueIdCounts.get(venueId) ?? 0) + 1)
  const pulseVenueIds = new Set([...pulseSource.matchAll(/mois-[0-9a-f]+/g)].map((match) => match[0]))
  const unexpectedElevatedVenueIds = [...venueIdCounts]
    .filter(([venueId, count]) => count > 2 && !pulseVenueIds.has(venueId))
    .map(([venueId]) => venueId)

  const client = {
    files: chunks.length,
    decodedBytes: chunks.reduce((sum, chunk) => sum + chunk.bytes, 0),
    venueIdOccurrences: venueIds.length,
    uniqueVenueIds: venueIdCounts.size,
    minimumVenueIdMultiplicity: Math.min(...venueIdCounts.values()),
    maxVenueIdMultiplicity: Math.max(0, ...venueIdCounts.values()),
    curatedPulseVenueIds: pulseVenueIds.size,
    unexpectedElevatedVenueIds,
  }
  if (clientSource.includes("sourceRecordDigest") || clientSource.includes('"sourceIds"')) {
    fail("Full canonical venue details leaked into the canonical / client chunks", client)
  }
  if (!clientSource.includes("UNKNOWN_FALLBACK_TO_KO") || !clientSource.includes("MOIS_LOCALDATA_GENERAL_RESTAURANTS")) {
    fail("Compact canonical venue data is absent from the canonical / client chunks", client)
  }
  if (
    client.venueIdOccurrences < 800
    || client.venueIdOccurrences > 800 + pulseVenueIds.size * 3
    || client.uniqueVenueIds !== 400
    || client.minimumVenueIdMultiplicity !== 2
    || client.maxVenueIdMultiplicity > MAX_CURATED_PULSE_MULTIPLICITY
    || unexpectedElevatedVenueIds.length
  ) {
    fail("The canonical / client venue multiplicity differs from the compact 400-record dataset", client)
  }

  const [serverSource, serverTrace] = await Promise.all([
    readFile(SERVER_ROUTE, "utf8"),
    readFile(SERVER_TRACE, "utf8").then(JSON.parse),
  ])
  const serverRetainsFullData = serverSource.includes("sourceRecordDigest")
    && serverSource.includes('"sourceIds"')
    && serverTrace.files.some((file) => file.endsWith("data/ondo-venues/canonical-venues.json"))
  if (!serverRetainsFullData) fail("The venue detail API no longer retains the full canonical server dataset")

  const report = { isolated, client, serverRetainsFullData, chunks: chunks.map(({ file, bytes }) => ({ file, bytes })) }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  return report
}

if (process.argv[1] === import.meta.filename) await scanOndoBNextClientArtifact()
