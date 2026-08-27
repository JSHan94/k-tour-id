import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { JEJU_EDITORIAL_PLACES, JEJU_EDITORIAL_SEEDS } from "../../features/ondo/pulse-b/japan-first-pulse-model-b"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("JP-MAP-FIRST-001 Korea overview owns Seoul, Busan, and truthful Jeju anchors", () => {
  const map = source("features/ondo/map/map-entry-b.tsx")

  expect(map).toContain('type CityId = "seoul" | "busan" | "jeju"')
  expect(map).toContain('data-testid="ondo-b-korea-atlas"')
  expect(map).toContain('data-city="jeju"')
  expect(map).toContain('data-truth-kind="editorial-region"')
  expect(map).toContain('data-editorial-count="10"')
  expect(map).not.toMatch(/data-city="jeju"[^>]*data-official-count/s)
  expect(map).not.toMatch(/data-city="jeju"[^>]*>\s*<i>200<\/i>/s)
})

test("JP-MAP-FIRST-002 city entry defaults to map without measuring or short-landscape list flash", () => {
  const map = source("features/ondo/map/map-entry-b.tsx")
  const history = source("features/ondo/map/b-discovery-history.ts")

  expect(history).toContain('export type BDiscoveryCity = "seoul" | "busan" | "jeju"')
  expect(history).toContain('value === "jeju"')
  expect(history).toContain('view: requestedCity === "jeju" ? "map" : requestedView')
  expect(history).toContain('query: requestedCity === "jeju" ? "" : requestedQuery')
  expect(history).toContain('category: requestedCity === "jeju" ? "all" : requestedCategory')
  expect(map).toContain('mapLayoutMode === "ultra-short" ? "list" : view')
  expect(map).not.toContain('mapLayoutMode === "ultra-short" || mapLayoutMode === "measuring" ? "list" : view')
  expect(map).toContain('height < 260')
  expect(map).not.toContain('height < 400')
})

test("JP-MAP-FIRST-003 Japan stories are a contextual map layer, never a Nation feed", () => {
  const map = source("features/ondo/map/map-entry-b.tsx")
  const discovery = source("features/ondo/map/japan-first-discovery-b.tsx")
  const nationDirectory = map.slice(map.indexOf("function NationDirectory"), map.indexOf("function toFeatureCollection"))

  expect(map).toContain('<JapanFirstDiscoveryB locale={locale} city={city}')
  expect(map).toContain('presentation={effectiveView === "list" || mapState === "error" ? "list" : "map"}')
  expect(map).toContain('onOpenChange={setEditorialOpen}')
  expect(map).toContain('inert={editorialOpen ? true : undefined}')
  expect(map).toContain('aria-hidden={editorialOpen || effectiveView !== "map" ? true : undefined}')
  expect(nationDirectory).not.toContain("<JapanFirstDiscoveryB")
  expect(discovery).toContain('city: "seoul" | "jeju"')
  expect(discovery).toContain('data-truth-kind="editorial-collection"')
  expect(discovery).toContain("item.cityIds.includes(city)")
})

test("JP-MAP-FIRST-004 only place-page-verified Jeju research becomes an editorial point", () => {
  expect(JEJU_EDITORIAL_SEEDS).toHaveLength(10)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.canonicalVenueId === null)).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.every((item) => item.officialRecordCount === null)).toBe(true)
  expect(JEJU_EDITORIAL_PLACES).toHaveLength(8)
  expect(JEJU_EDITORIAL_PLACES.every((item) => item.kind === "editorial-place" && item.placeEdgeVerification === "verified")).toBe(true)
  expect(JEJU_EDITORIAL_PLACES.every((item) => item.officialRecord === false && item.pulseEligible === false)).toBe(true)
  expect(JEJU_EDITORIAL_PLACES.every((item) => item.location.coordinateSource === "VISITKOREA_EMBEDDED_MAP" && item.location.verifiedAt === "2026-08-28")).toBe(true)
  expect(JEJU_EDITORIAL_SEEDS.filter((item) => item.kind === "editorial-place-candidate").map((item) => item.id)).toEqual(["jeju-tamura", "jeju-sogil-byeolha"])
  expect(JEJU_EDITORIAL_SEEDS.filter((item) => item.kind === "editorial-place-candidate").every((item) => !("location" in item))).toBe(true)

  const map = source("features/ondo/map/map-entry-b.tsx")
  expect(map).toContain("function toEditorialPlaceFeatureCollection")
  expect(map).toContain('instance.addSource("ondo-editorial-places"')
  expect(map).toContain('data-editorial-point-count={city === "jeju" ? JEJU_EDITORIAL_PLACES.length : undefined}')
})
