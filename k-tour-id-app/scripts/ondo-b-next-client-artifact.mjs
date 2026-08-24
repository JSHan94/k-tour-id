import { readFile, stat } from "node:fs/promises"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"

const APP_ROOT = resolve(import.meta.dirname, "..")
const NEXT_ROOT = resolve(APP_ROOT, ".next")
const CLIENT_MANIFEST = resolve(NEXT_ROOT, "server/app/ondo-b/page_client-reference-manifest.js")
const SERVER_ROUTE = resolve(NEXT_ROOT, "server/app/api/ondo/venues/[venueId]/route.js")
const SERVER_TRACE = `${SERVER_ROUTE}.nft.json`

function fail(message, details) {
  throw new Error(`${message}${details ? `\n${JSON.stringify(details, null, 2)}` : ""}`)
}

export async function scanOndoBNextClientArtifact() {
  const manifestSource = await readFile(CLIENT_MANIFEST, "utf8")
  const context = { globalThis: {} }
  runInNewContext(manifestSource, context)
  const manifest = context.globalThis.__RSC_MANIFEST?.["/ondo-b/page"]
  const entry = Object.entries(manifest?.clientModules ?? {})
    .find(([file]) => file.endsWith("/features/ondo/app/ondo-product-b.tsx"))?.[1]
  if (!entry) fail("The /ondo-b client entry is absent from the Next build manifest")

  const chunkFiles = [...new Set(entry.chunks.filter((item) => typeof item === "string" && item.endsWith(".js")))]
  const chunks = await Promise.all(chunkFiles.map(async (file) => ({
    file,
    bytes: (await stat(resolve(NEXT_ROOT, file))).size,
    source: await readFile(resolve(NEXT_ROOT, file), "utf8"),
  })))
  const clientSource = chunks.map(({ source }) => source).join("\n")
  const venueIds = [...clientSource.matchAll(/mois-[0-9a-f]+/g)].map((match) => match[0])
  const venueIdCounts = new Map()
  for (const venueId of venueIds) venueIdCounts.set(venueId, (venueIdCounts.get(venueId) ?? 0) + 1)

  const client = {
    files: chunks.length,
    decodedBytes: chunks.reduce((sum, chunk) => sum + chunk.bytes, 0),
    venueIdOccurrences: venueIds.length,
    uniqueVenueIds: venueIdCounts.size,
    maxVenueIdMultiplicity: Math.max(0, ...venueIdCounts.values()),
  }
  if (clientSource.includes("sourceRecordDigest") || clientSource.includes('"sourceIds"')) {
    fail("Full canonical venue details leaked into the /ondo-b client chunks", client)
  }
  if (!clientSource.includes("UNKNOWN_FALLBACK_TO_KO") || !clientSource.includes("MOIS_LOCALDATA_GENERAL_RESTAURANTS")) {
    fail("Compact canonical venue data is absent from the /ondo-b client chunks", client)
  }
  if (client.venueIdOccurrences !== 800 || client.uniqueVenueIds !== 400 || client.maxVenueIdMultiplicity !== 2) {
    fail("The /ondo-b client venue multiplicity differs from the compact 400-record dataset", client)
  }

  const [serverSource, serverTrace] = await Promise.all([
    readFile(SERVER_ROUTE, "utf8"),
    readFile(SERVER_TRACE, "utf8").then(JSON.parse),
  ])
  const serverRetainsFullData = serverSource.includes("sourceRecordDigest")
    && serverSource.includes('"sourceIds"')
    && serverTrace.files.some((file) => file.endsWith("data/ondo-venues/canonical-venues.json"))
  if (!serverRetainsFullData) fail("The venue detail API no longer retains the full canonical server dataset")

  const report = { client, serverRetainsFullData, chunks: chunks.map(({ file, bytes }) => ({ file, bytes })) }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  return report
}

if (process.argv[1] === import.meta.filename) await scanOndoBNextClientArtifact()
