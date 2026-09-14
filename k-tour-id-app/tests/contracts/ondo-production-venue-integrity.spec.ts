import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { dirname, extname, relative, resolve } from "node:path"
import { expect, test } from "@playwright/test"
import canonicalData from "../../data/ondo-venues/canonical-venues.json" with { type: "json" }
import canonicalMapData from "../../data/ondo-venues/canonical-venues-map.json" with { type: "json" }
import provenance from "../../data/ondo-venues/provenance-manifest.json" with { type: "json" }
import { GET as venueDetailGet } from "../../app/api/ondo/venues/[venueId]/route"
import * as venueModule from "../../lib/ondo/venues"
import type { CanonicalVenue, FieldEvidence } from "../../lib/ondo/venues"

const data = canonicalData as unknown as {
  schemaVersion: string
  generatedAt: string
  truthNotice: string
  counts: { total: number; byCity: { seoul: number; busan: number }; byCityDistrict: Record<string, number>; byCategory: Record<string, number> }
  venues: CanonicalVenue[]
}

const compact = canonicalMapData as unknown as {
  type: string
  schemaVersion: string
  features: Array<{
    id: string
    geometry: { type: string; coordinates: [number, number] }
    properties: {
      id: string
      cityId: "seoul" | "busan"
      districtId: string
      nameKo: string
      nameEn: null
      primaryCategory: string
      licenseStatus: string
      openNow: null
      ondoScore: null
      heatTruth: string
      sourceSnapshotAt: string
      sourceRefId: string
    }
  }>
}

const APP_ROOT = process.cwd()
const B_ENTRY = resolve(APP_ROOT, "features/ondo/app/ondo-product-b.tsx")
const canonicalGeoJson = JSON.parse(readFileSync(resolve(APP_ROOT, "data/ondo-venues/canonical-venues.geojson"), "utf8")) as unknown
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const
const LEGACY_VENUE_IDS = [
  "seoul-seongsu-gukbap",
  "seoul-euljiro-nogari",
  "seoul-mangwon-kalguksu",
  "busan-jagalchi-grill",
] as const

function localImportTargets(source: string) {
  const pattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g
  return [...source.matchAll(pattern)].map((match) => match[1]).filter((target) => target.startsWith(".") || target.startsWith("@/"))
}

function resolveSource(importer: string, target: string) {
  const base = target.startsWith("@/") ? resolve(APP_ROOT, target.slice(2)) : resolve(dirname(importer), target)
  const candidates = extname(base)
    ? [base]
    : [...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`), ...SOURCE_EXTENSIONS.map((extension) => resolve(base, `index${extension}`))]
  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function bProductionImportGraph() {
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
  return [...visited]
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function officialEvidence(venue: CanonicalVenue) {
  return [
    venue.name.ko,
    venue.sourceCategory,
    venue.address.road,
    venue.address.lot,
    venue.licenseStatus,
    venue.licenseOpenedAt,
    venue.sourceModifiedAt,
  ].filter((evidence) => evidence.truth === "OFFICIAL_SOURCE") as FieldEvidence<unknown>[]
}

test("VENUE-PROD-001 four canonical artifacts describe the same exact 400-record directory", () => {
  expect(data.schemaVersion).toBe("ondo-venues-1.0.0")
  expect(data.counts).toMatchObject({ total: 400, byCity: { seoul: 200, busan: 200 } })
  expect(data.venues).toHaveLength(400)
  expect(compact.type).toBe("FeatureCollection")
  expect(compact.schemaVersion).toBe(data.schemaVersion)
  expect(compact.features).toHaveLength(400)
  expect(canonicalGeoJson).toEqual(canonicalMapData)

  const canonicalIds = data.venues.map((venue) => venue.id)
  const compactIds = compact.features.map((feature) => feature.properties.id)
  expect(new Set(canonicalIds).size).toBe(400)
  expect(new Set(compactIds)).toEqual(new Set(canonicalIds))
  expect(data.venues.filter((venue) => venue.cityId === "seoul")).toHaveLength(200)
  expect(data.venues.filter((venue) => venue.cityId === "busan")).toHaveLength(200)
  expect(Object.values(data.counts.byCityDistrict)).toHaveLength(20)
  expect(Object.values(data.counts.byCityDistrict).every((count) => count === 20)).toBeTruthy()
})

test("VENUE-PROD-002 every record has a derived canonical id, complete source evidence, and bounded coordinates", () => {
  const managementIds = new Set<string>()
  const compactById = new Map(compact.features.map((feature) => [feature.properties.id, feature]))
  const bounds = {
    seoul: { south: 37.4, west: 126.7, north: 37.72, east: 127.3 },
    busan: { south: 34.85, west: 128.7, north: 35.4, east: 129.4 },
  } as const

  for (const venue of data.venues) {
    expect(venue.id).toBe(`mois-${sha256(venue.sourceIds.moisManagementId).slice(0, 20)}`)
    expect(managementIds.has(venue.sourceIds.moisManagementId), venue.id).toBeFalsy()
    managementIds.add(venue.sourceIds.moisManagementId)
    expect(venue.name.ko.value?.trim().length, venue.id).toBeGreaterThan(0)
    expect(venue.districtId.trim().length, venue.id).toBeGreaterThan(0)
    expect(venue.address.road.value ?? venue.address.lot.value, venue.id).toBeTruthy()
    expect(venue.sourceSnapshotAt).toBe(data.generatedAt)
    expect(venue.sourceRefs).toEqual(["MOIS_LOCALDATA_GENERAL_RESTAURANTS"])
    expect(venue.licenseStatus).toMatchObject({ value: "ACTIVE_LICENSE_RECORD", truth: "OFFICIAL_SOURCE" })
    expect(venue.heat).toEqual({ score: null, level: null, signalCount: null, confidence: null, freshness: null, truth: "UNKNOWN", simulation: null })

    const cityBounds = bounds[venue.cityId]
    expect(venue.location.latitude, venue.id).toBeGreaterThanOrEqual(cityBounds.south)
    expect(venue.location.latitude, venue.id).toBeLessThanOrEqual(cityBounds.north)
    expect(venue.location.longitude, venue.id).toBeGreaterThanOrEqual(cityBounds.west)
    expect(venue.location.longitude, venue.id).toBeLessThanOrEqual(cityBounds.east)
    expect(venue.location).toMatchObject({ crs: "EPSG:4326", truth: "OFFICIAL_SOURCE", sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS" })

    const compactVenue = compactById.get(venue.id)
    expect(compactVenue?.id).toBe(venue.id)
    expect(compactVenue?.properties).toMatchObject({
      id: venue.id,
      cityId: venue.cityId,
      districtId: venue.districtId,
      nameKo: venue.name.ko.value,
      nameEn: null,
      primaryCategory: venue.primaryCategory,
      licenseStatus: "ACTIVE_LICENSE_RECORD",
      openNow: null,
      ondoScore: null,
      heatTruth: "UNKNOWN",
      sourceSnapshotAt: data.generatedAt,
      sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS",
    })
    expect(compactVenue?.geometry).toEqual({ type: "Point", coordinates: [venue.location.longitude, venue.location.latitude] })
  }
  expect(managementIds.size).toBe(400)
})

test("VENUE-PROD-003 provenance and per-field digests preserve the LOCALDATA snapshot boundary", () => {
  expect(provenance.generatedAt).toBe(data.generatedAt)
  expect(provenance.source).toMatchObject({
    id: "MOIS_LOCALDATA_GENERAL_RESTAURANTS",
    agency: "Ministry of the Interior and Safety (MOIS)",
    datasetNameKo: "행정안전부_식품_일반음식점",
    publicDownloadRequiresApiKey: false,
  })
  expect(provenance.selection.cityQuota).toEqual({ seoul: 200, busan: 200 })
  expect(provenance.selection.objective).toContain("not a popularity or quality ranking")
  expect(provenance.source.sourceFiles).toHaveLength(2)
  expect(new Set(provenance.source.sourceFiles.map((source) => source.cityId))).toEqual(new Set(["seoul", "busan"]))
  for (const source of provenance.source.sourceFiles) {
    expect(source.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(source.byteSize).toBeGreaterThan(0)
    expect(source.sourceRowCount).toBeGreaterThan(source.eligibleCandidateCount)
  }
  expect(data.truthNotice).toContain("at the LOCALDATA snapshot")
  expect(data.truthNotice).toContain("do not prove current opening hours, popularity")

  for (const venue of data.venues) {
    const digest = venue.location.sourceRecordDigest
    expect(digest, venue.id).toMatch(/^[a-f0-9]{64}$/)
    for (const evidence of officialEvidence(venue)) {
      expect(evidence.value, `${venue.id}:${evidence.sourceField}`).not.toBeNull()
      expect(evidence.sourceRefId, `${venue.id}:${evidence.sourceField}`).toBe("MOIS_LOCALDATA_GENERAL_RESTAURANTS")
      expect(evidence.sourceRecordDigest, `${venue.id}:${evidence.sourceField}`).toBe(digest)
    }
    for (const evidence of Object.values(venue.facts)) {
      expect(evidence).toMatchObject({ value: null, truth: "UNKNOWN", sourceRefId: null, sourceField: null, sourceRecordDigest: null })
    }
  }
})

test("VENUE-PROD-004 detail API is canonical-only and carries an explicit snapshot limitation", async () => {
  const venueId = data.venues[0].id
  const response = await venueDetailGet(new Request(`https://example.test/api/ondo/venues/${venueId}`), { params: Promise.resolve({ venueId }) })
  expect(response.status).toBe(200)
  expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600, stale-while-revalidate=86400")
  const payload = await response.json() as Record<string, unknown>
  expect(payload).toMatchObject({
    venue: {
      id: venueId,
      sourceSnapshotAt: data.generatedAt,
      licenseStatus: { value: "ACTIVE_LICENSE_RECORD", truth: "OFFICIAL_SOURCE" },
      facts: {
        openingHours: { value: null, truth: "UNKNOWN" },
        foreignCardAccepted: { value: null, truth: "UNKNOWN" },
        menu: { value: null, truth: "UNKNOWN" },
        englishSupport: { value: null, truth: "UNKNOWN" },
      },
    },
    source: {
      id: "MOIS_LOCALDATA_GENERAL_RESTAURANTS",
      snapshotAt: data.generatedAt,
      truthNotice: data.truthNotice,
    },
  })
  expect(payload).not.toHaveProperty("venue.openNow")
  expect(payload).not.toHaveProperty("venue.heat")
  expect(payload).not.toHaveProperty("venue.ondoScore")
  expect(payload).not.toHaveProperty("venue.popularity")

  for (const invalid of ["mois-does-not-exist", "MOIS-0021CD596BC5B2A922AD", ...LEGACY_VENUE_IDS, "../canonical-venues.json", ""]) {
    const missing = await venueDetailGet(new Request("https://example.test/api/ondo/venues/invalid"), { params: Promise.resolve({ venueId: invalid }) })
    expect(missing.status, invalid).toBe(404)
    expect(await missing.json()).toEqual({ error: "Venue not found" })
  }
})

test("VENUE-PROD-005 persistence sanitizers accept canonical ids and notes only", () => {
  const exports = venueModule as unknown as Record<string, unknown>
  expect(typeof exports.isCanonicalVenueId).toBe("function")
  expect(typeof exports.sanitizeCanonicalVenueIds).toBe("function")
  expect(typeof exports.sanitizeCanonicalVenueNotes).toBe("function")
  if (
    typeof exports.isCanonicalVenueId !== "function"
    || typeof exports.sanitizeCanonicalVenueIds !== "function"
    || typeof exports.sanitizeCanonicalVenueNotes !== "function"
  ) return

  const isCanonicalVenueId = exports.isCanonicalVenueId as (value: unknown) => boolean
  const sanitizeCanonicalVenueIds = exports.sanitizeCanonicalVenueIds as (value: unknown) => string[]
  const sanitizeCanonicalVenueNotes = exports.sanitizeCanonicalVenueNotes as (value: unknown) => Record<string, string>
  const [first, second] = data.venues.map((venue) => venue.id)
  expect(isCanonicalVenueId(first)).toBeTruthy()
  expect(isCanonicalVenueId("mois-00000000000000000000")).toBeFalsy()
  expect(isCanonicalVenueId(LEGACY_VENUE_IDS[0])).toBeFalsy()
  expect(sanitizeCanonicalVenueIds([first, LEGACY_VENUE_IDS[0], first, second, null, 42])).toEqual([first, second])
  expect(sanitizeCanonicalVenueIds("not-an-array")).toEqual([])
  expect(sanitizeCanonicalVenueNotes({
    [first]: "  quiet corner  ",
    [second]: "  canonical note survives an unsave  ",
    [LEGACY_VENUE_IDS[0]]: "must be dropped",
    "mois-00000000000000000000": "must be dropped",
  })).toEqual({ [first]: "quiet corner", [second]: "canonical note survives an unsave" })
  expect(sanitizeCanonicalVenueNotes(null)).toEqual({})
})

test("VENUE-PROD-006 canonical / production graph contains no fictional legacy venue ids", () => {
  const hits = bProductionImportGraph().flatMap((file) => {
    const source = readFileSync(file, "utf8")
    return LEGACY_VENUE_IDS.filter((id) => source.includes(id)).map((id) => ({ file: relative(APP_ROOT, file), id }))
  })
  expect(hits).toEqual([])
})
