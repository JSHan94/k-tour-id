import { expect, test } from "@playwright/test"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { CANONICAL_MAP_VENUES_COMPACT } from "../../lib/ondo/venues/map-data"

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const productionSurfaceFiles = [
  "features/ondo/map/map-entry-b.tsx",
  "features/ondo/onboarding/official-directory-onboarding.tsx",
  "features/ondo/onboarding/discovery-options.ts",
  "features/ondo/place/canonical-place-overlay.tsx",
]

test("PROD-DISCOVERY-001 publishes exactly the official Seoul and Busan directory", () => {
  expect(CANONICAL_MAP_VENUES_COMPACT).toHaveLength(400)
  expect(CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === "seoul")).toHaveLength(200)
  expect(CANONICAL_MAP_VENUES_COMPACT.filter((venue) => venue.cityId === "busan")).toHaveLength(200)
  expect(new Set(CANONICAL_MAP_VENUES_COMPACT.map((venue) => venue.id)).size).toBe(400)
  expect(CANONICAL_MAP_VENUES_COMPACT.every((venue) => venue.sourceRefId === "MOIS_LOCALDATA_GENERAL_RESTAURANTS")).toBe(true)
})

test("PROD-DISCOVERY-002 map records expose source facts, never a product score layer", () => {
  for (const venue of CANONICAL_MAP_VENUES_COMPACT) {
    expect(venue).toMatchObject({
      licenseStatus: "ACTIVE_LICENSE_RECORD",
      openNow: null,
      sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS",
    })
    expect(venue).not.toHaveProperty("ondoScore")
    expect(venue).not.toHaveProperty("heat")
  }
})

test("PROD-DISCOVERY-003 B discovery source has no preview vocabulary or preview data dependency", () => {
  for (const relativePath of productionSurfaceFiles) {
    const source = readFileSync(path.join(appRoot, relativePath), "utf8")
    if (relativePath === "features/ondo/place/canonical-place-overlay.tsx") {
      expect(source).toContain("canonical-meal-benefit-open")
      expect(source).toContain("This venue is not presented as an accepting merchant")
      expect(source, relativePath).not.toMatch(/simulat|fixture|locals eat now/i)
    } else {
      expect(source, relativePath).not.toMatch(/\bdemo\b|simulat|fixture|locals eat now/i)
    }
    expect(source, relativePath).not.toContain("demo-signals")
    expect(source, relativePath).not.toContain("lib/ondo/map/fixtures")
  }
  expect(existsSync(path.join(appRoot, "lib/ondo/venues/demo-signals.ts"))).toBe(false)
})

test("PROD-DISCOVERY-004 place surface preserves sourced facts and canonical decisions when journeys are added", () => {
  const source = readFileSync(path.join(appRoot, "features/ondo/place/canonical-place-overlay.tsx"), "utf8")
  expect(source).toContain("canonical-venue-directions")
  expect(source).toContain("canonical-venue-save")
  expect(source).toContain("Official LOCALDATA record")
  expect(source).toContain("data-address-truth")
  expect(source).toContain("UNKNOWN")
})
