import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  JAPAN_FIRST_LAUNCH_CONTENT,
  JEJU_EDITORIAL_SEEDS,
  UNIFIED_PULSE_WEIGHTS,
  composeUnifiedPulseB,
} from "../../features/ondo/pulse-b/japan-first-pulse-model-b"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("JP-PULSE-001 one public Pulse includes Japan, Korea-local, and ONDO drivers", () => {
  expect(UNIFIED_PULSE_WEIGHTS).toEqual({ japanMomentum: 0.4, koreaLocalMomentum: 0.4, ondoMomentum: 0.2 })

  const baseline = composeUnifiedPulseB({
    japanMomentum: { value: 50, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
    koreaLocalMomentum: { value: 70, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
    ondoMomentum: { value: 60, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
  })
  const strongerJapanSignal = composeUnifiedPulseB({
    japanMomentum: { value: 90, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
    koreaLocalMomentum: { value: 70, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
    ondoMomentum: { value: 60, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
  })

  expect(baseline.score).toBe(60)
  expect(strongerJapanSignal.score).toBe(76)
  expect(strongerJapanSignal.score).toBeGreaterThan(baseline.score!)
  expect(strongerJapanSignal.publicState).toBe("scored")
  expect(strongerJapanSignal.publicScoreCount).toBe(1)
})

test("JP-PULSE-002 confidence and sponsorship gates prevent false precision", () => {
  const incomplete = composeUnifiedPulseB({
    japanMomentum: null,
    koreaLocalMomentum: { value: 80, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
    ondoMomentum: { value: 75, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
  })
  expect(incomplete).toMatchObject({ score: null, confidence: "growing", publicState: "growing", publicScoreCount: 0 })

  const sponsoredJapan = composeUnifiedPulseB({
    japanMomentum: { value: 100, sourceCount: 4, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: true },
    koreaLocalMomentum: { value: 80, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
    ondoMomentum: { value: 75, sourceCount: 2, verifiedAt: "2026-08-24T00:00:00.000Z", sponsored: false },
  })
  expect(sponsoredJapan).toMatchObject({ score: null, publicState: "growing", excludedSponsoredEvidence: 1 })
})

test("JP-PULSE-003 launch research is bounded and Jeju cannot impersonate official coverage", () => {
  expect(JAPAN_FIRST_LAUNCH_CONTENT.map((item) => item.id)).toEqual(["C01", "C02", "C03", "C06", "C08", "C12", "C18", "C20", "C22"])
  expect(JAPAN_FIRST_LAUNCH_CONTENT.every((item) => item.originalSourceUrl || item.verification === "requires-source-verification")).toBe(true)
  expect(JAPAN_FIRST_LAUNCH_CONTENT.every((item) => item.sponsored === false)).toBe(true)

  expect(JEJU_EDITORIAL_SEEDS).toHaveLength(10)
  expect(new Set(JEJU_EDITORIAL_SEEDS.map((item) => item.name.ko)).size).toBe(10)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.cityId === "jeju")).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.sourceType === "editorial-research")).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.canonicalVenueId === null)).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.officialRecordCount === null)).toBe(true)
})

test("JP-PULSE-004 integration reuses Explore and preserves the five existing product paths", () => {
  const app = source("features/ondo/app/ondo-app-b.tsx")
  const product = source("features/ondo/app/ondo-product-b.tsx")
  const map = source("features/ondo/map/map-entry-b.tsx")
  const discovery = source("features/ondo/map/japan-first-discovery-b.tsx")
  const pulse = source("features/ondo/pulse-b/pulse-model-b.ts")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(app).toContain('data-nav-count="5"')
  for (const tab of ['"ondo"', '"my"', '"tables"', '"id"', '"settings"']) expect(app).toContain(tab)
  expect(product).toContain("MapEntryB")
  expect(map).toContain("JapanFirstDiscoveryB")
  expect(map).toContain("PULSE_COMPOSITION_DISCLOSURE")
  expect(discovery).toContain('data-testid="ondo-b-japan-first-discovery"')
  expect(discovery).toContain('data-testid="ondo-b-jeju-editorial-seeds"')
  expect(discovery).not.toMatch(/new tab|content tab|J-Viral toggle|K-Local toggle/i)
  expect(pulse).toContain("composeUnifiedPulseB")
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
