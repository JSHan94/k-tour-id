import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  classifyBDiscoveryPreferencePresentation,
  orderBCanonicalDiscoveryPlaces,
  orderBDiscoveryByPersonalization,
  type BDiscoveryPersonalizationDescriptor,
} from "../../features/ondo/map/b-discovery-personalization"

const mapSource = readFileSync(resolve(process.cwd(), "features/ondo/map/map-entry-b.tsx"), "utf8")
const onboardingSource = readFileSync(resolve(process.cwd(), "features/ondo/onboarding/official-directory-onboarding.tsx"), "utf8")
const capsuleSource = readFileSync(resolve(process.cwd(), "features/ondo/map/canonical-venue-capsule-b.tsx"), "utf8")

type TruthBearingDescriptor = BDiscoveryPersonalizationDescriptor & Readonly<{
  temperature: Readonly<{ score: number | null; level: string }>
  source: Readonly<{ kind: string; id: string }>
  eligibility: Readonly<{ after19: boolean; payment: string }>
}>

const truthSnapshot = (items: readonly TruthBearingDescriptor[]) => JSON.stringify(items.map((item) => ({
  id: item.id,
  temperature: item.temperature,
  source: item.source,
  eligibility: item.eligibility,
})))

test("W2-PERSONALIZE-001 ranks evidence matches while preserving every canonical and Jeju ID", () => {
  const items: readonly TruthBearingDescriptor[] = [
    {
      kind: "canonical", id: "venue-a", primaryCategory: "korean", preferenceEvidence: ["classic"],
      temperature: { score: 91, level: "peak" }, source: { kind: "official", id: "localdata-a" },
      eligibility: { after19: false, payment: "unknown" },
    },
    {
      kind: "editorial", id: "jeju-a", category: "food", preferenceEvidence: ["classic", "calm"],
      pulseScore: null, temperature: { score: null, level: "unscored" }, source: { kind: "editorial", id: "visitkorea-a" },
      eligibility: { after19: false, payment: "unknown" },
    },
    {
      kind: "canonical", id: "venue-b", primaryCategory: "night", preferenceEvidence: ["late"],
      temperature: { score: 84, level: "hot" }, source: { kind: "official", id: "localdata-b" },
      eligibility: { after19: true, payment: "unknown" },
    },
  ]
  const ranked = orderBDiscoveryByPersonalization(items, { intent: "short_trip", preferences: ["classic", "calm"] })

  expect(ranked.map(({ item }) => item.id)).toEqual(["venue-a", "jeju-a", "venue-b"])
  expect(new Set(ranked.map(({ item }) => item.id)).size).toBe(items.length)
  expect(ranked).toHaveLength(items.length)
  expect(ranked[0]).toMatchObject({ matchCount: 1, matchedPreferenceIds: ["classic"], dietaryUnknown: false })
  expect(ranked.find(({ item }) => item.id === "jeju-a")).toMatchObject({
    matchCount: 1,
    matchedPreferenceIds: ["classic"],
  })
})

test("W2-PERSONALIZE-002 no match keeps source order stable, with ID as a deterministic final tie", () => {
  const items: readonly BDiscoveryPersonalizationDescriptor[] = [
    { kind: "canonical", id: "z", primaryCategory: "casual", originalIndex: 4, pulseScore: 99 },
    { kind: "editorial", id: "b", category: "market", originalIndex: 4, pulseScore: null },
    { kind: "canonical", id: "a", primaryCategory: "night", originalIndex: 8, pulseScore: 1 },
  ]
  const ranked = orderBDiscoveryByPersonalization(items, { intent: "living", preferences: ["cafe"] })

  expect(ranked.map(({ item }) => item.id)).toEqual(["b", "z", "a"])
  expect(ranked.every(({ matchCount }) => matchCount === 0)).toBe(true)
  expect(items.map(({ id }) => id)).toEqual(["z", "b", "a"])
})

test("W2-PERSONALIZE-003 dietary-only preferences never create a positive without source evidence", () => {
  const unknown = orderBDiscoveryByPersonalization([
    { kind: "canonical", id: "venue-unknown", primaryCategory: "korean" },
    { kind: "editorial", id: "jeju-unknown", category: "food" },
    { kind: "editorial", id: "jeju-culture-unknown", category: "culture-shopping" },
  ] as const, { intent: "nearby", preferences: ["vegan", "halal"] })
  expect(unknown.map(({ matchCount }) => matchCount)).toEqual([0, 0, 0])
  expect(unknown.every(({ dietaryUnknown }) => dietaryUnknown)).toBe(true)

  const evidenced = orderBDiscoveryByPersonalization([
    {
      kind: "canonical", id: "venue-evidenced", primaryCategory: "korean",
      dietaryEvidence: { vegan: true, halal: false },
    },
  ] as const, { intent: "nearby", preferences: ["vegan", "halal"] })
  expect(evidenced[0]).toMatchObject({ matchCount: 1, matchedPreferenceIds: ["vegan"], dietaryUnknown: false })
})

test("W2-PERSONALIZE-004 ordering leaves heat, source and eligibility snapshots byte-equivalent", () => {
  const items: readonly TruthBearingDescriptor[] = [
    {
      kind: "canonical", id: "venue-cold", primaryCategory: "casual", preferenceEvidence: ["calm"], pulseScore: 22,
      temperature: { score: 22, level: "warm" }, source: { kind: "official", id: "record-1" },
      eligibility: { after19: false, payment: "unknown" },
    },
    {
      kind: "editorial", id: "jeju-unscored", category: "screen-location", pulseScore: null,
      temperature: { score: null, level: "unscored" }, source: { kind: "editorial", id: "story-1" },
      eligibility: { after19: false, payment: "unknown" },
    },
  ]
  const before = truthSnapshot(items)
  const ranked = orderBDiscoveryByPersonalization(items, { intent: "living", preferences: ["calm", "vegan"] })
  const afterInSourceOrder = truthSnapshot(ranked.map(({ item }) => item).sort((left, right) => items.indexOf(left) - items.indexOf(right)))

  expect(afterInSourceOrder).toBe(before)
  expect(ranked.find(({ item }) => item.id === "jeju-unscored")?.item.pulseScore).toBeNull()
  expect(ranked.map(({ item }) => item)).toEqual(expect.arrayContaining([...items]))
  expect(ranked.every(({ item }) => items.includes(item))).toBe(true)
})

test("W2-PERSONALIZE-005 canonical map applies saved discovery choices through one source-backed mapper", () => {
  const places = [
    { id: "classic", primaryCategory: "korean", after19PresentationEligible: false, untouched: "official-a" },
    { id: "cafe", primaryCategory: "night", after19PresentationEligible: false, untouched: "official-b" },
    { id: "late", primaryCategory: "night", after19PresentationEligible: true, untouched: "official-c" },
    { id: "unknown", primaryCategory: "casual", after19PresentationEligible: false, untouched: "official-d" },
  ] as const
  const ranked = orderBCanonicalDiscoveryPlaces(places, { intent: "short_trip", preferences: ["late", "lively"] })
  expect(ranked.map(({ place }) => place.id)).toEqual(["classic", "cafe", "late", "unknown"])
  expect(ranked.every(({ matchCount, matchedPreferenceIds }) => (
    matchCount === 0 && matchedPreferenceIds.length === 0
  ))).toBe(true)
  expect(ranked.map(({ place }) => place.untouched)).toEqual(["official-a", "official-b", "official-c", "official-d"])

  const sourceClassified = orderBCanonicalDiscoveryPlaces(places, {
    intent: "short_trip",
    preferences: ["classic", "cafe"],
  })
  expect(sourceClassified.map(({ place }) => place.id)).toEqual(["classic", "cafe", "late", "unknown"])
  expect(sourceClassified.slice(0, 2).map(({ matchedPreferenceIds }) => matchedPreferenceIds)).toEqual([
    ["classic"],
    ["cafe"],
  ])

  const dietaryOnly = orderBCanonicalDiscoveryPlaces(places, { intent: "living", preferences: ["vegan", "halal"] })
  expect(dietaryOnly.every(({ matchCount, dietaryUnknown }) => matchCount === 0 && dietaryUnknown)).toBe(true)
})

test("W2-PERSONALIZE-005A presentation eligibility never becomes mood or opening-hours evidence", () => {
  const ranked = orderBCanonicalDiscoveryPlaces([
    { id: "after19", primaryCategory: "night", after19PresentationEligible: true },
    { id: "specialty", primaryCategory: "specialty", after19PresentationEligible: false },
  ] as const, { intent: "living", preferences: ["late", "lively", "calm", "classic"] })

  expect(ranked).toEqual([
    expect.objectContaining({ place: expect.objectContaining({ id: "after19" }), matchCount: 0, matchedPreferenceIds: [] }),
    expect.objectContaining({ place: expect.objectContaining({ id: "specialty" }), matchCount: 0, matchedPreferenceIds: [] }),
  ])
})

test("W2-PERSONALIZE-005B consumer labels expose only source-backed preferences and explicit dietary unknown", () => {
  expect(classifyBDiscoveryPreferencePresentation([
    "classic", "cafe", "late", "lively", "calm", "vegan", "halal", "vegan",
  ])).toEqual({
    effective: ["classic", "cafe"],
    dietaryUnknown: ["vegan", "halal"],
    unsupportedLegacy: ["late", "lively", "calm"],
  })
})

test("W2-PERSONALIZE-005D guest choices personalize presentation without inferring an intent", () => {
  const places = [
    { id: "neutral", primaryCategory: "casual", after19PresentationEligible: false },
    { id: "classic", primaryCategory: "korean", after19PresentationEligible: false },
  ] as const
  const ranked = orderBCanonicalDiscoveryPlaces(places, { preferences: ["classic", "late"] })

  expect(ranked.map(({ place }) => place.id)).toEqual(["classic", "neutral"])
  expect(ranked[0]).toMatchObject({ matchCount: 1, matchedPreferenceIds: ["classic"] })
  expect(ranked.every(({ matchedPreferenceIds }) => !matchedPreferenceIds.includes("late"))).toBe(true)
})

test("W2-PERSONALIZE-005C the map list owns canonical capsules while setup never previews a place", () => {
  expect(mapSource).toContain('import { CanonicalVenueCapsuleB } from "./canonical-venue-capsule-b"')
  expect(onboardingSource).not.toContain("CanonicalVenueCapsuleB")
  expect(mapSource).toContain("<CanonicalVenueCapsuleB")
  expect(mapSource).toContain("onOpen={() => onSelect(venue)}")
  expect(onboardingSource).not.toContain('data-testid="onboarding-map-preview"')
  expect(onboardingSource).not.toContain("openBDiscoveryVenue")
  expect(capsuleSource).toContain('data-source-glyph="official-directory"')
  expect(capsuleSource).toContain('role="group"')
  expect(capsuleSource).toContain('"data-source-class": "official_directory"')
})

test("W2-PERSONALIZE-006 real list and GeoJSON expose the same visual-only keyline metadata", () => {
  expect(mapSource).toContain("orderBCanonicalDiscoveryPlaces")
  expect(mapSource).toContain("data-personalization-match-count={personalMatchCount}")
  expect(mapSource).toContain('data-personalized-match={personalMatchCount > 0 ? "true" : "false"}')
  expect(mapSource).toContain("personalMatchCount: personalMatchCountByVenue[venue.id] ?? 0")
  expect(mapSource).toContain("personalKeyline: (personalMatchCountByVenue[venue.id] ?? 0) > 0")
  expect(mapSource).toContain('id: "ondo-personalized-keyline"')
  expect(mapSource).toContain('["==", ["get", "personalKeyline"], true]')
  expect(mapSource).not.toContain("dietaryEvidence:")
})
