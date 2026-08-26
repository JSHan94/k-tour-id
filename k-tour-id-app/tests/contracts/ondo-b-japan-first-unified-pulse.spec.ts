import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  JAPAN_FIRST_LAUNCH_CONTENT,
  JAPAN_FIRST_FEATURED_CONTENT_IDS,
  JEJU_EDITORIAL_SEEDS,
  UNIFIED_PULSE_WEIGHTS,
  composeUnifiedPulseB,
  type UnifiedPulseDriverB,
  type UnifiedPulseEvidenceB,
} from "../../features/ondo/pulse-b/japan-first-pulse-model-b"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
const AS_OF = "2026-08-26T00:00:00.000Z"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

function evidence(value: number, driver: UnifiedPulseDriverB, count = 2, overrides: {
  observedAt?: string
  verifiedAt?: string
  placeEdgeVerified?: boolean
  sponsorship?: "organic" | "paid" | "unknown"
  verificationState?: "verified" | "pending" | "rejected"
  biasReview?: "passed" | "pending" | "failed"
  sharedPublisher?: boolean
  url?: string
  canonicalVenueId?: string
  sourceType?: "official-tourism" | "original-creator" | "editorial" | "korea-local" | "ondo-first-party"
} = {}): UnifiedPulseEvidenceB {
  return {
    value,
    valueExcludesSponsored: true,
    biasReview: overrides.biasReview ?? "passed",
    references: Array.from({ length: count }, (_, index) => ({
      id: `${driver}-${index + 1}`,
      sourceType: overrides.sourceType ?? (driver === "japanMomentum" ? "original-creator" : driver === "koreaLocalMomentum" ? "korea-local" : "ondo-first-party"),
      url: overrides.url ?? `https://${overrides.sharedPublisher ? "shared.example" : `evidence-${driver}-${index + 1}.example`}/${driver}/${index + 1}`,
      observedAt: overrides.observedAt ?? "2026-08-24T00:00:00.000Z",
      verifiedAt: overrides.verifiedAt ?? "2026-08-25T00:00:00.000Z",
      verificationState: overrides.verificationState ?? "verified",
      canonicalVenueId: overrides.canonicalVenueId ?? VENUE_ID,
      placeEdgeVerified: overrides.placeEdgeVerified ?? true,
      sponsorship: overrides.sponsorship ?? "organic",
    })),
  }
}

test("JP-PULSE-001 one public Pulse includes Japan, Korea-local, and ONDO drivers", () => {
  expect(UNIFIED_PULSE_WEIGHTS).toEqual({ japanMomentum: 0.4, koreaLocalMomentum: 0.4, ondoMomentum: 0.2 })

  const baseline = composeUnifiedPulseB(VENUE_ID, {
    japanMomentum: evidence(50, "japanMomentum"),
    koreaLocalMomentum: evidence(70, "koreaLocalMomentum"),
    ondoMomentum: evidence(60, "ondoMomentum"),
  }, AS_OF)
  const strongerJapanSignal = composeUnifiedPulseB(VENUE_ID, {
    japanMomentum: evidence(90, "japanMomentum"),
    koreaLocalMomentum: evidence(70, "koreaLocalMomentum"),
    ondoMomentum: evidence(60, "ondoMomentum"),
  }, AS_OF)

  expect(baseline.score).toBe(60)
  expect(strongerJapanSignal.score).toBe(76)
  expect(strongerJapanSignal.score).toBeGreaterThan(baseline.score!)
  expect(strongerJapanSignal.publicState).toBe("scored")
  expect(strongerJapanSignal.publicScoreCount).toBe(1)
  expect(strongerJapanSignal.confidence).toBe("high")
})

test("JP-PULSE-002 confidence and sponsorship gates prevent false precision", () => {
  const incomplete = composeUnifiedPulseB(VENUE_ID, {
    japanMomentum: null,
    koreaLocalMomentum: evidence(80, "koreaLocalMomentum"),
    ondoMomentum: evidence(75, "ondoMomentum"),
  }, AS_OF)
  expect(incomplete).toMatchObject({ score: null, confidence: "growing", publicState: "growing", publicScoreCount: 0 })

  const sponsoredJapan = composeUnifiedPulseB(VENUE_ID, {
    japanMomentum: evidence(100, "japanMomentum", 1, { sponsorship: "paid" }),
    koreaLocalMomentum: evidence(80, "koreaLocalMomentum"),
    ondoMomentum: evidence(75, "ondoMomentum"),
  }, AS_OF)
  expect(sponsoredJapan).toMatchObject({ score: null, publicState: "growing", excludedSponsoredEvidence: 1 })

  for (const rejectedJapan of [
    evidence(90, "japanMomentum", 1, { sponsorship: "unknown" }),
    evidence(90, "japanMomentum", 1, { placeEdgeVerified: false }),
    evidence(90, "japanMomentum", 1, { observedAt: "2026-06-01T00:00:00.000Z" }),
    evidence(90, "japanMomentum", 1, { verifiedAt: "2026-08-27T00:00:00.000Z" }),
    evidence(90, "japanMomentum", 1, { verificationState: "pending" }),
    evidence(90, "japanMomentum", 1, { biasReview: "pending" }),
    evidence(90, "japanMomentum", 1, { url: "https://" }),
    evidence(90, "japanMomentum", 1, { url: "https://[bad" }),
    evidence(90, "japanMomentum", 1, { url: "https://user:pass@example.com/evidence" }),
  ]) {
    expect(() => composeUnifiedPulseB(VENUE_ID, {
      japanMomentum: rejectedJapan,
      koreaLocalMomentum: evidence(80, "koreaLocalMomentum"),
      ondoMomentum: evidence(75, "ondoMomentum"),
    }, AS_OF)).not.toThrow()
    expect(composeUnifiedPulseB(VENUE_ID, {
      japanMomentum: rejectedJapan,
      koreaLocalMomentum: evidence(80, "koreaLocalMomentum"),
      ondoMomentum: evidence(75, "ondoMomentum"),
    }, AS_OF)).toMatchObject({ score: null, publicState: "growing", publicScoreCount: 0 })
  }

  expect(composeUnifiedPulseB(VENUE_ID, {
    japanMomentum: evidence(90, "japanMomentum", 2, { sharedPublisher: true }),
    koreaLocalMomentum: evidence(80, "koreaLocalMomentum"),
    ondoMomentum: evidence(75, "ondoMomentum"),
  }, AS_OF)).toMatchObject({ score: 83, confidence: "medium", publicState: "scored" })

  expect(composeUnifiedPulseB(VENUE_ID, {
    japanMomentum: evidence(90, "japanMomentum", 1, { sourceType: "editorial" }),
    koreaLocalMomentum: evidence(80, "koreaLocalMomentum"),
    ondoMomentum: evidence(75, "ondoMomentum"),
  }, AS_OF)).toMatchObject({ score: 83, publicState: "scored" })

  for (const invalidJapan of [
    evidence(90, "japanMomentum", 1, { canonicalVenueId: "mois-other" }),
    evidence(90, "japanMomentum", 1, { sourceType: "ondo-first-party" }),
  ]) {
    expect(composeUnifiedPulseB(VENUE_ID, {
      japanMomentum: invalidJapan,
      koreaLocalMomentum: evidence(80, "koreaLocalMomentum"),
      ondoMomentum: evidence(75, "ondoMomentum"),
    }, AS_OF)).toMatchObject({ score: null, publicState: "growing" })
  }

  const duplicatedAcrossDrivers = evidence(80, "koreaLocalMomentum")
  const duplicateOnJapan = evidence(90, "japanMomentum").references.map((reference, index) => index === 0 ? {
    ...reference,
    id: duplicatedAcrossDrivers.references[0].id,
  } : reference)
  expect(composeUnifiedPulseB(VENUE_ID, {
    japanMomentum: { ...evidence(90, "japanMomentum"), references: duplicateOnJapan },
    koreaLocalMomentum: duplicatedAcrossDrivers,
    ondoMomentum: evidence(75, "ondoMomentum"),
  }, AS_OF)).toMatchObject({ score: null, publicState: "growing" })
})

test("JP-PULSE-003 launch research is bounded and Jeju cannot impersonate official coverage", () => {
  expect(JAPAN_FIRST_LAUNCH_CONTENT.map((item) => item.id)).toEqual(["C01", "C02", "C03", "C06", "C08", "C12", "C18", "C20", "C22"])
  expect(JAPAN_FIRST_LAUNCH_CONTENT.every((item) => item.sourceReferences.length >= 1)).toBe(true)
  expect(JAPAN_FIRST_LAUNCH_CONTENT.flatMap((item) => item.sourceReferences).every((sourceRef) => /^https:\/\//.test(sourceRef.url))).toBe(true)
  expect(JAPAN_FIRST_FEATURED_CONTENT_IDS).toEqual(["C01", "C03", "C06"])
  expect(JAPAN_FIRST_LAUNCH_CONTENT.flatMap((item) => item.sourceReferences).every((sourceRef) => sourceRef.verificationState === "report-linked" && sourceRef.importedAt === "2026-08-26" && sourceRef.liveCheckedAt === null)).toBe(true)
  expect(JAPAN_FIRST_LAUNCH_CONTENT.flatMap((item) => item.sourceReferences).every((sourceRef) => sourceRef.rightsMode === "link-only" && ["organic-official", "unknown"].includes(sourceRef.sponsorship))).toBe(true)
  expect(JAPAN_FIRST_LAUNCH_CONTENT.every((item) => item.sourceVerification === "report-linked")).toBe(true)
  expect(JAPAN_FIRST_LAUNCH_CONTENT.every((item) => item.placeEdgeVerification === "pending")).toBe(true)
  expect(JAPAN_FIRST_LAUNCH_CONTENT.every((item) => item.pulseEligible === false)).toBe(true)
  expect(JAPAN_FIRST_LAUNCH_CONTENT.every((item) => item.rightsMode === "link-only")).toBe(true)

  expect(JEJU_EDITORIAL_SEEDS).toHaveLength(10)
  expect(new Set(JEJU_EDITORIAL_SEEDS.map((item) => item.name.ko)).size).toBe(10)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.cityId === "jeju")).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.sourceType === "editorial-research")).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => /^https:\/\//.test(item.sourceUrl))).toBe(true)
  expect(new Set(JEJU_EDITORIAL_SEEDS.map((item) => item.sourceUrl)).size).toBe(4)
  expect(new Set(JEJU_EDITORIAL_SEEDS.map((item) => item.sourceCollection.en)).size).toBe(4)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.sourceVerification === "report-linked" && item.importedAt === "2026-08-26" && item.liveCheckedAt === null)).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.placeEdgeVerification === "pending")).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.canonicalVenueId === null)).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.officialRecordCount === null)).toBe(true)
})

test("JP-PULSE-004 integration reuses Explore and preserves the five existing product paths", () => {
  const app = source("features/ondo/app/ondo-app-b.tsx")
  const product = source("features/ondo/app/ondo-product-b.tsx")
  const map = source("features/ondo/map/map-entry-b.tsx")
  const discovery = source("features/ondo/map/japan-first-discovery-b.tsx")
  const pulse = source("features/ondo/pulse-b/pulse-model-b.ts")
  const unifiedPulse = source("features/ondo/pulse-b/japan-first-pulse-model-b.ts")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(app).toContain('data-nav-count="5"')
  for (const tab of ['"ondo"', '"my"', '"tables"', '"id"', '"settings"']) expect(app).toContain(tab)
  expect(product).toContain("MapEntryB")
  expect(map).toContain("JapanFirstDiscoveryB")
  expect(map).toContain("PULSE_COMPOSITION_DISCLOSURE")
  expect(discovery).toContain('data-testid="ondo-b-japan-first-discovery"')
  expect(discovery).toContain('data-testid="ondo-b-jeju-editorial-seeds"')
  expect(discovery).toContain("JAPAN_FIRST_FEATURED_CONTENT_IDS.map")
  expect(discovery).not.toContain("slice(0, 3)")
  expect(discovery).not.toMatch(/content tab|J-Viral toggle|K-Local toggle/i)
  expect(discovery).toContain('target="_blank" rel="noreferrer"')
  expect(unifiedPulse).toContain("composeUnifiedPulseB")
  expect(pulse).not.toContain("composition:")
  expect(provider).not.toContain("japanContentSurface")
  expect(provider).not.toContain("japanPulseMode")
})

test("JP-PULSE-005 the spec forbids the adversarial shortcuts", () => {
  const spec = source("docs/ONDO_JAPAN_FIRST_PULSE_SPEC.md")
  for (const assertion of [
    "No J-Viral/K-Local toggle",
    "No new content tab",
    "outsider = Japanese",
    "Sponsored or paid-placement evidence is excluded",
    "ten editorial seeds",
    "Full Japanese UI localization is a separate release gate",
  ]) expect(spec).toContain(assertion)
})
