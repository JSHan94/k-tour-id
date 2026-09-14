import { expect, test } from "@playwright/test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { CANONICAL_MAP_VENUES_COMPACT, canonicalMapVenueById } from "../../lib/ondo/venues/map-data"
import {
  CURATED_PULSE_SNAPSHOTS,
  PULSE_CITY_STATUS,
  PULSE_DISCLOSURE,
  PULSE_LEVELS,
  pulseAlternativesForVenue,
  pulseForVenue,
} from "../../features/ondo/pulse-b/pulse-model-b"
import { openBDiscoveryAlternativeVenue, openBDiscoveryVenue } from "../../features/ondo/map/b-discovery-history"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const FEATURED_SIGNAL_IDS = [
  "mois-0021cd596bc5b2a922ad", "mois-0348cfe16225dbbcec8a", "mois-02c79775c050624e474d",
  "mois-0907f914f70fc6e4b7ed", "mois-110f0d9867977ae410e8", "mois-18939eecb43c15ab4305",
  "mois-03041681b54ea5399763", "mois-0977b107c7db944e75cf",
] as const
const FEATURED_SIGNAL_ID_SET = new Set<string>(FEATURED_SIGNAL_IDS)

test("B-PULSE-HOT-001 Pulse is a separate B-native evidence model over all 400 canonical places", () => {
  expect(CANONICAL_MAP_VENUES_COMPACT).toHaveLength(400)
  expect(PULSE_LEVELS).toEqual(["peak", "hot", "rising", "warming", "low", "limited"])
  expect(PULSE_CITY_STATUS).toMatchObject({ seoul: "active", busan: "growing" })

  const canonicalIds = new Set(CANONICAL_MAP_VENUES_COMPACT.map((venue) => venue.id))
  expect(CURATED_PULSE_SNAPSHOTS).toHaveLength(80)
  expect(new Set(CURATED_PULSE_SNAPSHOTS.map((snapshot) => snapshot.venueId)).size).toBe(80)
  expect(CURATED_PULSE_SNAPSHOTS.every((snapshot) => canonicalIds.has(snapshot.venueId))).toBe(true)
  expect(CURATED_PULSE_SNAPSHOTS.filter((snapshot) => snapshot.cityId === "seoul")).toHaveLength(40)
  expect(CURATED_PULSE_SNAPSHOTS.filter((snapshot) => snapshot.cityId === "busan")).toHaveLength(40)
  expect(CURATED_PULSE_SNAPSHOTS.filter((snapshot) => canonicalMapVenueById(snapshot.venueId)?.primaryCategory === "night" && snapshot.cityId === "seoul")).toHaveLength(7)
  expect(CURATED_PULSE_SNAPSHOTS.filter((snapshot) => canonicalMapVenueById(snapshot.venueId)?.primaryCategory === "night" && snapshot.cityId === "busan")).toHaveLength(10)
  for (const featuredId of FEATURED_SIGNAL_IDS) expect(CURATED_PULSE_SNAPSHOTS.some((snapshot) => snapshot.venueId === featuredId)).toBe(true)
  expect(createHash("sha256").update(CURATED_PULSE_SNAPSHOTS.map((snapshot) => snapshot.venueId).join("\n")).digest("hex"))
    .toBe("aedda4c065ce94259171f6eabb369f9eb1f40fddc7545457b2997a49d68fbc79")

  for (const cityId of ["seoul", "busan"] as const) {
    const canonicalDistricts = new Set(CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === cityId).map((venue) => venue.districtId))
    const canonicalCategories = new Set(CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === cityId).map((venue) => venue.primaryCategory))
    const signalDistricts = new Set(CURATED_PULSE_SNAPSHOTS.filter((snapshot) => snapshot.cityId === cityId)
      .map((snapshot) => canonicalMapVenueById(snapshot.venueId)?.districtId))
    const signalCategories = new Set(CURATED_PULSE_SNAPSHOTS.filter((snapshot) => snapshot.cityId === cityId)
      .map((snapshot) => canonicalMapVenueById(snapshot.venueId)?.primaryCategory))
    expect(signalDistricts).toEqual(canonicalDistricts)
    expect(signalCategories).toEqual(canonicalCategories)
  }

  for (const snapshot of CURATED_PULSE_SNAPSHOTS) {
    expect(snapshot.score).toBeGreaterThanOrEqual(0)
    expect(snapshot.score).toBeLessThanOrEqual(100)
    expect(snapshot.signalCount).toBeGreaterThanOrEqual(5)
    expect(snapshot.updatedAt).toMatch(/^2026-/)
    expect(snapshot.confidence).not.toBe("limited")
    expect(snapshot.evidence.length).toBeGreaterThan(0)
    expect(snapshot.truth).toBe("SIMULATED")
    if (!FEATURED_SIGNAL_ID_SET.has(snapshot.venueId)) expect(snapshot.evidence.every((item) => item.origin === "simulated-fixture")).toBe(true)
  }
})

test("B-PULSE-HOT-002 limited samples never invent a score, count, recency, or confidence", () => {
  const curatedIds = new Set(CURATED_PULSE_SNAPSHOTS.map((snapshot) => snapshot.venueId))
  const limitedVenue = CANONICAL_MAP_VENUES_COMPACT.find((venue) => !curatedIds.has(venue.id))
  expect(limitedVenue).toBeTruthy()

  const pulse = pulseForVenue(limitedVenue!.id)
  expect(pulse).toMatchObject({
    level: "limited",
    score: null,
    signalCount: null,
    updatedAt: null,
    freshness: "limited",
    confidence: "limited",
    truth: "UNKNOWN",
  })
  expect(PULSE_DISCLOSURE.en).toBe("Curated visit signals, not live crowding or official LOCALDATA facts.")
  expect(PULSE_DISCLOSURE.ko).toBe("선별된 방문 신호이며, 실시간 혼잡도나 공식 LOCALDATA 사실이 아닙니다.")
})

test("B-PULSE-HOT-003 a local-device post becomes evidence without inflating the shared score", () => {
  const curatedIds = new Set(CURATED_PULSE_SNAPSHOTS.map((snapshot) => snapshot.venueId))
  const venue = CANONICAL_MAP_VENUES_COMPACT.find((item) => !curatedIds.has(item.id))!
  const pulse = pulseForVenue(venue.id, { tags: ["lively_now"], postedAt: "2026-08-25T12:00:00.000Z" })

  expect(pulse.level).toBe("limited")
  expect(pulse.score).toBeNull()
  expect(pulse.signalCount).toBeNull()
  expect(pulse.localEvidence).toMatchObject({ origin: "local-device", tags: ["lively_now"], postedAt: "2026-08-25T12:00:00.000Z" })
  expect(pulse.evidence.some((item) => item.origin === "local-device")).toBe(true)
})

test("B-PULSE-HOT-004 only a peak place offers calmer evidence-backed Too Hot alternatives", () => {
  const crowded = CURATED_PULSE_SNAPSHOTS.find((snapshot) => snapshot.level === "peak")!
  const hot = CURATED_PULSE_SNAPSHOTS.find((snapshot) => snapshot.level === "hot")!
  const alternatives = pulseAlternativesForVenue(crowded.venueId)
  expect(alternatives.length).toBeGreaterThanOrEqual(2)
  expect(alternatives.every((item) => item.venueId !== crowded.venueId)).toBe(true)
  expect(alternatives.every((item) => ["rising", "warming", "low"].includes(item.level))).toBe(true)
  expect(pulseAlternativesForVenue(hot.venueId)).toEqual([])
})

test("B-PULSE-HOT-005 map, list, place, local signal, EN/KO, and standalone packaging stay connected", () => {
  const map = source("features/ondo/map/map-entry-b.tsx")
  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const policy = source("scripts/ondo-b-standalone/policy.mjs")
  const css = `${source("features/ondo/map/map-b.module.css")}\n${source("features/ondo/place/canonical-place.module.css")}`

  for (const token of ["ondo-b-pulse-legend", "ondo-b-pulse-city-status", "ondo-b-list-pulse", "pulseForVenue"]) expect(map).toContain(token)
  for (const token of ["pulseLevel", "ondo-points", "ondo-selected-pulse", "ondo-b-selected-marker-status", "ondo-b-map-instruction", "aria-describedby", "aria-haspopup=\"dialog\"", "aria-expanded"]) expect(map).toContain(token)
  for (const token of ["canonical-place-pulse", "pulse-confidence", "pulse-evidence", "pulse-too-hot", "pulse-alternative"]) expect(place).toContain(token)
  expect(signal).toContain("activeDraft.tags")
  expect(signal).toContain("actions.markLocalSignalPosted")
  expect(provider).toContain("localPulseEvidenceByVenue")
  expect(provider).toContain("postedAt")
  expect(policy).toContain('"features/ondo/pulse-b/pulse-model-b.ts"')
  expect(`${map}\n${place}`).toContain("PULSE_DISCLOSURE")
  expect(`${map}\n${place}`).toMatch(/locale === "ko"|\[locale\]/)
  expect(css).toContain(":focus-visible")
  expect(css).toContain("min-height: 44px")
})

test("B-PULSE-HOT-006 the Next client scan allows only curated Pulse ids above canonical multiplicity", () => {
  const scanner = source("scripts/ondo-b-next-client-artifact.mjs")
  expect(scanner).toContain("PULSE_SOURCE")
  expect(scanner).toContain("pulseVenueIds")
  expect(scanner).toContain("unexpectedElevatedVenueIds")
  expect(scanner).toContain("minimumVenueIdMultiplicity")
  expect(scanner).toContain("MAX_CURATED_PULSE_MULTIPLICITY = 7")
  expect(scanner).not.toContain("client.venueIdOccurrences !== 800")
})

test("B-PULSE-HOT-007 only an exact current place can canonically transition to an alternative peek", () => {
  const currentVenueId = "mois-0021cd596bc5b2a922ad"
  const alternativeVenueId = pulseAlternativesForVenue(currentVenueId)[0].venueId
  class FixtureHistory {
    state: Record<string, unknown> = {
      preserved: "outer-state",
      __ondoBDiscovery: {
        v: 3,
        documentId: "pulse-alternative-contract",
        level: "detail",
        city: "seoul",
        view: "list",
        query: "late dinner",
        category: "korean",
        venueId: currentVenueId,
      },
    }
    url = ""
    replaceState(state: Record<string, unknown>, _title: string, url: string) {
      this.state = state
      this.url = url
    }
  }
  const history = new FixtureHistory()
  const previousHistory = Object.getOwnPropertyDescriptor(globalThis, "History")
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "History", { configurable: true, value: FixtureHistory })
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { history, location: { origin: "https://ondo.test", pathname: "/" } },
  })

  try {
    expect(openBDiscoveryVenue(alternativeVenueId)).toBe(false)
    expect(openBDiscoveryAlternativeVenue("not-a-venue", alternativeVenueId)).toBe(false)
    expect(openBDiscoveryAlternativeVenue("mois-aaaaaaaaaaaaaaaaaaaa", alternativeVenueId)).toBe(false)
    expect(openBDiscoveryAlternativeVenue(currentVenueId, currentVenueId)).toBe(false)
    expect(openBDiscoveryAlternativeVenue(currentVenueId, alternativeVenueId)).toBe(true)
    expect(history.state).toMatchObject({
      preserved: "outer-state",
      __ondoBDiscovery: {
        v: 4,
        documentId: "pulse-alternative-contract",
        level: "peek",
        city: "seoul",
        view: "list",
        query: "late dinner",
        category: "korean",
        editorialCategory: "all",
        layer: "standard",
        sheetSnap: "peek",
        listScroll: 0,
        venueId: alternativeVenueId,
      },
    })
    expect(history.url).toBe(`/?city=seoul&view=list&q=late+dinner&category=korean&venueId=${alternativeVenueId}`)
  } finally {
    if (previousHistory) Object.defineProperty(globalThis, "History", previousHistory)
    else Reflect.deleteProperty(globalThis, "History")
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")
  }
})
