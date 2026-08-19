import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import provenance from "../../data/ondo-venues/provenance-manifest.json" with { type: "json" }
import { CANONICAL_MAP_VENUES, CANONICAL_VENUE_COUNTS, CANONICAL_VENUES, venueToMapRecord } from "../../lib/ondo/venues"
import { B_DEMO_SIGNAL_BY_VENUE_ID } from "../../lib/ondo/venues/demo-signals"

const geoJson = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/ondo-venues/canonical-venues.geojson"), "utf8")) as {
  type: string
  features: Array<{ geometry: { coordinates: number[] }; properties: { id: string } }>
}

const fixtureIds = new Set(["seoul-seongsu-gukbap", "seoul-euljiro-nogari", "seoul-mangwon-kalguksu", "busan-jagalchi-grill"])

test("VENUE-DATA-001 publishes exact Seoul 200 and Busan 200 quotas", () => {
  expect(CANONICAL_VENUE_COUNTS).toEqual({ total: 400, byCity: { seoul: 200, busan: 200 } })
  expect(CANONICAL_VENUES.filter((venue) => venue.cityId === "seoul")).toHaveLength(200)
  expect(CANONICAL_VENUES.filter((venue) => venue.cityId === "busan")).toHaveLength(200)
})

test("VENUE-DATA-002 ids and official source records are unique", () => {
  expect(new Set(CANONICAL_VENUES.map((venue) => venue.id)).size).toBe(400)
  expect(new Set(CANONICAL_VENUES.map((venue) => venue.sourceIds.moisManagementId)).size).toBe(400)
  expect(CANONICAL_VENUES.every((venue) => venue.id.startsWith("mois-") && !fixtureIds.has(venue.id))).toBeTruthy()
})

test("VENUE-DATA-003 source evidence does not become open-now or heat truth", () => {
  for (const venue of CANONICAL_VENUES) {
    expect(venue.licenseStatus).toMatchObject({ value: "ACTIVE_LICENSE_RECORD", truth: "OFFICIAL_SOURCE", sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS" })
    expect(venue.facts.openNow).toMatchObject({ value: null, truth: "UNKNOWN" })
    expect(venue.facts.openingHours).toMatchObject({ value: null, truth: "UNKNOWN" })
    expect(venue.facts.foreignCardAccepted).toMatchObject({ value: null, truth: "UNKNOWN" })
    expect(venue.facts.menu).toMatchObject({ value: null, truth: "UNKNOWN" })
    expect(venue.facts.image).toMatchObject({ value: null, truth: "UNKNOWN" })
    expect(venue.heat).toEqual({ score: null, level: null, signalCount: null, confidence: null, freshness: null, truth: "UNKNOWN", simulation: null })
  }
})

test("VENUE-DATA-004 map seam preserves coordinate and truth boundaries", () => {
  expect(CANONICAL_MAP_VENUES).toHaveLength(400)
  const venue = CANONICAL_VENUES[0]
  expect(venueToMapRecord(venue)).toMatchObject({
    id: venue.id,
    name: { ko: venue.name.ko.value, en: venue.name.ko.value },
    nameEnTruth: "UNKNOWN_FALLBACK_TO_KO",
    sourceSnapshotAt: venue.sourceSnapshotAt,
    latitude: venue.location.latitude,
    longitude: venue.location.longitude,
    openNow: null,
    heat: null,
    ondoScore: null,
  })
})

test("VENUE-DATA-005 canonical JSON and GeoJSON have an exact id/coordinate set", () => {
  expect(geoJson.type).toBe("FeatureCollection")
  expect(geoJson.features).toHaveLength(400)
  const canonical = new Map<string, number[]>(CANONICAL_VENUES.map((venue) => [venue.id, [venue.location.longitude, venue.location.latitude]]))
  for (const feature of geoJson.features) expect(feature.geometry.coordinates).toEqual(canonical.get(feature.properties.id))
})

test("VENUE-DATA-006 provenance fixes official source, license and source hashes", () => {
  expect(provenance.source.id).toBe("MOIS_LOCALDATA_GENERAL_RESTAURANTS")
  expect(provenance.source.license).toMatchObject({ code: "PUBLIC_DATA_UNRESTRICTED", labelKo: "이용허락범위 제한 없음", cost: "FREE" })
  expect(provenance.source.publicDownloadRequiresApiKey).toBeFalsy()
  expect(provenance.source.sourceFiles).toHaveLength(2)
  for (const source of provenance.source.sourceFiles) expect(source.sha256).toMatch(/^[a-f0-9]{64}$/)
})

test("VENUE-DATA-007 each city-district/category quota is exact", () => {
  const categoryQuota = { korean: 5, casual: 3, japanese: 2, chinese: 2, global: 3, night: 3, specialty: 2 }
  for (const cityId of ["seoul", "busan"] as const) {
    const city = CANONICAL_VENUES.filter((venue) => venue.cityId === cityId)
    for (const districtId of new Set(city.map((venue) => venue.districtId))) {
      const district = city.filter((venue) => venue.districtId === districtId)
      expect(district).toHaveLength(20)
      for (const [category, count] of Object.entries(categoryQuota)) expect(district.filter((venue) => venue.primaryCategory === category)).toHaveLength(count)
    }
  }
})

test("VENUE-DATA-008 After19 eligibility is exactly the simulated night-category signal set", () => {
  const eligibleByCity = { seoul: 0, busan: 0 }

  for (const venue of CANONICAL_MAP_VENUES) {
    const signal = B_DEMO_SIGNAL_BY_VENUE_ID.get(venue.id)
    if (!signal) continue
    expect(Boolean(signal.after19)).toBe(venue.primaryCategory === "night")
    if (!signal.after19) continue

    eligibleByCity[venue.cityId] += 1
    expect(signal.truth).toBe("SIMULATED")
    expect(signal.reason.en).toContain("ONDO includes this food-and-drink source category under its simulated night-preview policy")
    expect(signal.reason.en).toContain("does not confirm opening hours, alcohol service, or an age restriction")
    expect(signal.reason.ko).toContain("ONDO의 시뮬레이션 야간 프리뷰 정책")
    expect(signal.reason.ko).toContain("영업시간·주류 제공·연령 제한을 확인하지 않습니다")
  }

  expect(eligibleByCity).toEqual({ seoul: 7, busan: 10 })
})
