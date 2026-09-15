import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"
import { sampleTravelerActivityB } from "../../features/ondo/contracts/traveler-activity-b"
import {
  normalizeTemperatureSampleMinute,
  TEMPERATURE_SAMPLE_END_MINUTE,
  TEMPERATURE_SAMPLE_START_MINUTE,
} from "../../features/ondo/contracts/temperature-timeline"
import { CURATED_PULSE_SNAPSHOTS } from "../../features/ondo/pulse-b/pulse-model-b"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"

const CITIES = ["seoul", "busan", "jeju"] as const
const LOCALES = ["en", "ko", "ja"] as const
type City = typeof CITIES[number]
type Localized = Record<typeof LOCALES[number], string>
type FoodPick = {
  id: string
  city: City
  name: Localized
  district: Localized
  kind: "food" | "cafe" | "bar"
  signature: Localized
  address: string
  latitude: number
  longitude: number
  coordinateSourceUrl: string
  checkedAt: string
  reason: Localized
  sources: Array<{ url: string; title: string; publishedAt: string | null; evidence: string }>
  canonicalVenueId: string | null
  photo: null | { url: string; sourceUrl: string; credit: string; license: string; licenseUrl: string }
}

const CITY_BOUNDS = {
  seoul: { south: 37.4, north: 37.72, west: 126.7, east: 127.3 },
  busan: { south: 34.85, north: 35.4, west: 128.7, east: 129.4 },
  jeju: { south: 33.05, north: 34.1, west: 126.05, east: 127.1 },
} as const

function readPicks(city: City): FoodPick[] {
  const parsed: unknown = JSON.parse(readFileSync(resolve("data/ondo/research", `${city}-food-pulse.json`), "utf8"))
  expect(Array.isArray(parsed), `${city} research must be a JSON array`).toBe(true)
  return parsed as FoodPick[]
}

function httpUrl(value: string, label: string) {
  expect(typeof value, label).toBe("string")
  const url = new URL(value)
  expect(["http:", "https:"], label).toContain(url.protocol)
  expect(url.hostname, label).not.toBe("")
  expect(url.username, label).toBe("")
  expect(url.password, label).toBe("")
}

function isoDate(value: string, label: string) {
  expect(value, label).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10), label).toBe(value)
}

function countSignature(city: City, minute: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const { arrivals, photos, updates } = sampleTravelerActivityB(city, `contract-place-${index}`, minute)
    return [arrivals, photos, updates]
  })
}

// Frozen location values read from the named coordinates in official tourism
// pages on 2026-09-11, not guessed/geocoded positions or live venue claims.
const SEPTEMBER_11_ADDITIONS = [
  ["research-seoul-okdongsik", 37.5526641273966, 126.91452530534],
  ["research-seoul-geumdwaeji-sikdang", 37.5570820100183, 127.01167403523],
  ["research-busan-hapcheon-gukbapjip", 35.111244, 129.11125],
  ["research-busan-haeundae-amso-galbijip", 35.163258, 129.16626],
  ["research-jeju-oneunjeong-gimbap", 33.249676, 126.56757],
  ["research-jeju-yaksuteo-olle-market", 33.2490102, 126.5627984],
] as const

test("TRAVELER-FOOD-009 six additions preserve official coordinate evidence and historical research dates", () => {
  const picks = CITIES.flatMap(readPicks)
  const additions = new Set<string>(SEPTEMBER_11_ADDITIONS.map(([id]) => id))
  expect(picks).toHaveLength(25)
  for (const [id, latitude, longitude] of SEPTEMBER_11_ADDITIONS) {
    const pick = picks.find(place => place.id === id)
    expect(pick, id).toMatchObject({ latitude, longitude, checkedAt: "2026-09-11", canonicalVenueId: null, photo: null })
    expect(["english.visitkorea.or.kr", "www.visitbusan.net", "www.visitjeju.net"]).toContain(new URL(pick!.coordinateSourceUrl).hostname)
    expect(pick!.sources.some(source => source.url === pick!.coordinateSourceUrl && source.evidence === "tourism"), id).toBe(true)
  }
  const originalPicks = picks.filter(pick => !additions.has(pick.id) && pick.id !== "research-seoul-hakrim-dabang")
  expect(originalPicks).toHaveLength(18)
  for (const pick of originalPicks) {
    expect(pick.checkedAt, "Adding places never refreshes an older source date").toBe("2026-09-09")
  }
  expect(picks.find(pick => pick.id === "research-seoul-hakrim-dabang")).toMatchObject({ checkedAt: "2026-09-15", latitude: 37.5819287995496, longitude: 127.001679855807, canonicalVenueId: null })
})

test("TRAVELER-FOOD-001 contribution examples are deterministic and explicitly not observations", () => {
  for (const city of CITIES) {
    const first = sampleTravelerActivityB(city, "contract-place-0", 1200)
    expect(sampleTravelerActivityB(city, "contract-place-0", 1200)).toEqual(first)
    expect(first).toMatchObject({ origin: "PREPARED_ILLUSTRATION", observedAt: null, windowMinutes: 30 })
    for (const forbidden of ["officialScore", "verifiedVisits", "liveCount", "liveVisitors", "measuredAt", "openNow", "credentials"])
      expect(first).not.toHaveProperty(forbidden)
  }
})

test("TRAVELER-FOOD-002 every minute of the prepared evening has finite bounded integer counts", () => {
  for (const city of CITIES) {
    const samples = Array.from({ length: TEMPERATURE_SAMPLE_END_MINUTE - TEMPERATURE_SAMPLE_START_MINUTE + 1 }, (_, offset) =>
      Array.from({ length: 5 }, (_, index) => sampleTravelerActivityB(city, `contract-place-${index}`, TEMPERATURE_SAMPLE_START_MINUTE + offset)),
    ).flat()
    for (const [key, minimum, maximum] of [["arrivals", 2, 24], ["photos", 0, 9], ["updates", 1, 10]] as const) {
      const counts = samples.map((sample) => sample[key])
      expect(counts.every(Number.isSafeInteger), `${city}:${key}`).toBe(true)
      expect(Math.min(...counts), `${city}:${key}`).toBeGreaterThanOrEqual(minimum)
      expect(Math.max(...counts), `${city}:${key}`).toBeLessThanOrEqual(maximum)
    }
    expect(samples.every((sample) => ["arrival", "photo", "mood"].includes(sample.kind)), city).toBe(true)
    expect(samples.every((sample) => sample.origin === "PREPARED_ILLUSTRATION" && sample.observedAt === null), city).toBe(true)
  }
})

test("TRAVELER-FOOD-003 cities and evening windows vary counts, not just a timestamp label", () => {
  const citySignatures = CITIES.map((city) => JSON.stringify(countSignature(city, 1200)))
  expect(new Set(citySignatures).size).toBe(CITIES.length)
  for (const city of CITIES) {
    const eveningSignatures = [1020, 1080, 1140, 1200, 1260, 1320, 1380].map((minute) => JSON.stringify(countSignature(city, minute)))
    expect(new Set(eveningSignatures).size, city).toBeGreaterThan(3)
    const kinds = [1140, 1170, 1200].map((minute) => sampleTravelerActivityB(city, "contract-place-0", minute).kind)
    expect(new Set(kinds), city).toEqual(new Set(["arrival", "photo", "mood"]))
  }
})

test("TRAVELER-FOOD-004 invalid or out-of-range minutes normalize counts and contribution sequence together", () => {
  for (const city of CITIES) {
    for (const minute of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, 0, 1440, 1169.6]) {
      const normalized = normalizeTemperatureSampleMinute(minute)
      const sample = sampleTravelerActivityB(city, "contract-time-boundary", minute)
      expect(sample, `${city}:${String(minute)}`).toEqual(sampleTravelerActivityB(city, "contract-time-boundary", normalized))
      expect(Number.isSafeInteger(sample.sequence)).toBe(true)
      expect(sample.sequence).toBe(Math.floor(normalized / 30))
      expect(["arrival", "photo", "mood"]).toContain(sample.kind)
    }
  }
})

for (const city of CITIES) {
  test(`TRAVELER-FOOD-005 ${city} food discovery has usable localized, located, sourced records`, () => {
    const picks = readPicks(city)
    expect(picks).toHaveLength(city === "seoul" ? 9 : 8)
    expect(new Set(picks.map((pick) => pick.kind)).size).toBeGreaterThanOrEqual(2)
    const bounds = CITY_BOUNDS[city]
    for (const pick of picks) {
      expect(pick.id).toMatch(new RegExp(`^research-${city}-[a-z0-9]+(?:-[a-z0-9]+)*$`))
      expect(pick.city, pick.id).toBe(city)
      expect(["food", "cafe", "bar"]).toContain(pick.kind)
      for (const field of ["name", "district", "signature", "reason"] as const) {
        for (const locale of LOCALES) {
          expect(typeof pick[field]?.[locale], `${pick.id}:${field}:${locale}`).toBe("string")
          expect(pick[field][locale].trim().length, `${pick.id}:${field}:${locale}`).toBeGreaterThan(0)
        }
      }
      expect(typeof pick.address, pick.id).toBe("string")
      expect(pick.address.trim().length, pick.id).toBeGreaterThan(0)
      expect(Number.isFinite(pick.latitude), pick.id).toBe(true)
      expect(Number.isFinite(pick.longitude), pick.id).toBe(true)
      expect(pick.latitude, pick.id).toBeGreaterThanOrEqual(bounds.south)
      expect(pick.latitude, pick.id).toBeLessThanOrEqual(bounds.north)
      expect(pick.longitude, pick.id).toBeGreaterThanOrEqual(bounds.west)
      expect(pick.longitude, pick.id).toBeLessThanOrEqual(bounds.east)
      httpUrl(pick.coordinateSourceUrl, `${pick.id}:coordinateSourceUrl`)
      isoDate(pick.checkedAt, `${pick.id}:checkedAt`)
      // Historical picks retain their actual research date; adding records is
      // not evidence that every older venue was freshly rechecked.
      expect(pick.id === "research-seoul-hakrim-dabang" ? ["2026-09-15"] : ["2026-09-09", "2026-09-11"], pick.id).toContain(pick.checkedAt)
      expect(Array.isArray(pick.sources), pick.id).toBe(true)
      expect(pick.sources.length, pick.id).toBeGreaterThan(0)
      for (const source of pick.sources) {
        httpUrl(source.url, `${pick.id}:source`)
        expect(source.title.trim().length, pick.id).toBeGreaterThan(0)
        expect(["operator", "tourism", "award", "editorial"]).toContain(source.evidence)
        if (source.publishedAt !== null) {
          isoDate(source.publishedAt, `${pick.id}:publishedAt`)
          expect(source.publishedAt <= pick.checkedAt, `${pick.id}:future publication`).toBe(true)
        }
      }
    }
  })
}

test("TRAVELER-FOOD-006 all research IDs are unique and never masquerade as canonical or curated IDs", () => {
  const picks = CITIES.flatMap(readPicks)
  const canonicalById = new Map(CANONICAL_MAP_VENUES_COMPACT.map((venue) => [venue.id, venue]))
  const curatedIds = new Set(CURATED_PULSE_SNAPSHOTS.map((snapshot) => snapshot.venueId))
  expect(new Set(picks.map((pick) => pick.id)).size).toBe(picks.length)
  for (const pick of picks) {
    expect(canonicalById.has(pick.id), pick.id).toBe(false)
    expect(curatedIds.has(pick.id), pick.id).toBe(false)
    if (pick.canonicalVenueId !== null) {
      const canonical = canonicalById.get(pick.canonicalVenueId)
      expect(canonical, `${pick.id}:unknown canonical reference`).toBeDefined()
      expect(canonical?.cityId, pick.id).toBe(pick.city)
    }
    for (const field of ["ondoScore", "heat", "liveCount", "visitorCount", "openNow", "licenseStatus", "verifiedAge", "pulseEligible", "observedAt"])
      expect(pick, pick.id).not.toHaveProperty(field)
  }
})

test("TRAVELER-FOOD-007 a photo is absent or carries explicit credit and reusable-license provenance", () => {
  for (const pick of CITIES.flatMap(readPicks)) {
    expect(pick, pick.id).toHaveProperty("photo")
    if (pick.photo === null) continue
    for (const field of ["url", "sourceUrl", "licenseUrl"] as const) httpUrl(pick.photo[field], `${pick.id}:photo:${field}`)
    for (const field of ["credit", "license"] as const) {
      expect(typeof pick.photo[field], `${pick.id}:photo:${field}`).toBe("string")
      expect(pick.photo[field].trim().length, `${pick.id}:photo:${field}`).toBeGreaterThan(0)
    }
    expect(pick.photo.license, pick.id).not.toMatch(/unknown|unverified|pending|all rights reserved|^tbd$|^none$/i)
  }
})

test("TRAVELER-FOOD-008 researching and animating do not replace the original official 400 or curated 80", () => {
  const official = JSON.parse(readFileSync(resolve("data/ondo-venues/canonical-venues.json"), "utf8"))
  const compact = JSON.parse(readFileSync(resolve("data/ondo-venues/canonical-venues-map.json"), "utf8"))
  expect(official.counts).toMatchObject({ total: 400, byCity: { seoul: 200, busan: 200 } })
  expect(official.venues).toHaveLength(400)
  expect(CANONICAL_MAP_VENUES_COMPACT).toHaveLength(400)
  expect(compact.features).toHaveLength(400)
  const canonicalIds = CANONICAL_MAP_VENUES_COMPACT.map((venue) => venue.id)
  expect(new Set(canonicalIds).size).toBe(400)
  expect(new Set(official.venues.map((venue: { id: string }) => venue.id))).toEqual(new Set(canonicalIds))
  expect(createHash("sha256").update(canonicalIds.join("\n")).digest("hex"))
    .toBe("caa3610aa2a73f724dab440679960edb23ca073e0eba1e84d6afe9d5794ae9bd")
  for (const feature of compact.features) {
    expect(feature.properties).toMatchObject({ openNow: null, ondoScore: null, heatTruth: "UNKNOWN" })
  }
  expect(CURATED_PULSE_SNAPSHOTS).toHaveLength(80)
  expect(new Set(CURATED_PULSE_SNAPSHOTS.map((snapshot) => snapshot.venueId)).size).toBe(80)
  expect(CURATED_PULSE_SNAPSHOTS.filter((snapshot) => snapshot.cityId === "seoul")).toHaveLength(40)
  expect(CURATED_PULSE_SNAPSHOTS.filter((snapshot) => snapshot.cityId === "busan")).toHaveLength(40)
  expect(CURATED_PULSE_SNAPSHOTS.every((snapshot) => snapshot.truth === "SIMULATED")).toBe(true)
  expect(createHash("sha256").update(CURATED_PULSE_SNAPSHOTS.map((snapshot) => snapshot.venueId).join("\n")).digest("hex"))
    .toBe("aedda4c065ce94259171f6eabb369f9eb1f40fddc7545457b2997a49d68fbc79")

  const before = JSON.stringify([CANONICAL_MAP_VENUES_COMPACT, CURATED_PULSE_SNAPSHOTS])
  for (const city of CITIES) {
    for (const pick of readPicks(city)) {
      sampleTravelerActivityB(city, pick.id, 1020)
      sampleTravelerActivityB(city, pick.id, 1380)
    }
  }
  expect(JSON.stringify([CANONICAL_MAP_VENUES_COMPACT, CURATED_PULSE_SNAPSHOTS])).toBe(before)
})
