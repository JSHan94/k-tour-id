import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

const map = source("features/ondo/map/map-entry-b.tsx")
const mapCss = source("features/ondo/map/map-b.module.css")
const editorial = source("features/ondo/map/japan-first-discovery-b.tsx")
const place = source("features/ondo/place/canonical-place-overlay.tsx")

test("B-EXPLORE-V3-001 Korea overview is a geographic living atlas rather than a city-card report", () => {
  expect(map).toContain('data-visual-object="living-atlas"')
  expect(map).toContain('id: "ondo-overview-route"')
  expect(map).toContain('id: "ondo-korea-land-fill"')
  expect(map).toContain('id: "ondo-korea-coastline"')
  expect(map).toContain('regionRole: "official-directory"')
  expect(map).toContain('regionRole: "editorial-collection"')
  expect(map).toContain("officialCount: 200")
  expect(map).toContain("editorialCount: JEJU_EDITORIAL_PLACES.length")
  expect(map).toContain("signalState: JEJU_EDITORIAL_TEMPERATURE.level")
  expect(map).toContain("data-region-role={cityNode.regionRole}")
  expect(map).toContain("data-official-count={cityNode.officialCount}")
  expect(map).toContain("data-editorial-count={cityNode.editorialCount}")
  expect(map).toContain('data-atlas-pin="true"')
  expect(map).not.toContain("data-region-kind-label")
  expect(map).toContain("koreaLandFeatureCollection()")
  expect(map).toContain("overviewRouteFeatureCollection()")
  expect(mapCss).not.toContain(".koreaAtlas .atlasLandmass")
  expect(mapCss).not.toMatch(/\.koreaAtlas\s*>\s*svg/)
})

test("B-EXPLORE-V3-002 every city shares one temperature grammar while official records stay scoped", () => {
  expect(map).toContain('data-pulse-visual-grammar="aura-scale-selection-capsule"')
  expect(map).toContain('data-temperature-visual-grammar="shared-field-aura-core-scale-selection-capsule"')
  expect(map).toContain('data-temperature-model={city === "jeju" ? JEJU_EDITORIAL_TEMPERATURE.model : "curated-scored"}')
  expect(map).toContain('data-cluster-grammar={city === "jeju" ? undefined : "official-record-count"}')
  expect(map).toContain('data-testid="ondo-b-view-toggle"')
  expect(map).toContain('data-testid="ondo-b-map-key"')
  expect(map).toContain('data-testid="ondo-b-venue-list"')
  expect(map).toContain('data-testid="ondo-b-map-fallback-status"')
  expect(map).toContain('data-testid="ondo-b-map-transport-status"')
  expect(map).toContain('instance.once("render"')
  expect(map).toContain("instance.triggerRepaint()")
  expect(map, "the shared five-second deadline must settle into an explicit recoverable or fatal boundary").toMatch(
    /MAP_LOAD_FALLBACK_DELAY_MS\s*=\s*5_000|window\.setTimeout\(failMap,\s*5_000\)/,
  )
  expect(map).toContain("if (localFramePainted) setMapPartialFailure(true)")
  expect(map).toContain("failMap()")
  expect(map).toContain('data-foreground={effectiveView === "map" ? "map" : "list"}')
  expect(mapCss).toContain("In List, the editorial collection is part of the reading sequence")
  expect(mapCss).toContain('.root:has(> .listPanel) > .listPanel { padding-top: 114px; }')
  expect(mapCss).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
})

test("B-EXPLORE-V3-003 Japanese editorial keeps source truth while verified Jeju stories may focus an editorial point", () => {
  expect(editorial).toContain('visualRole?: "lead" | "supporting" | "compact"')
  expect(editorial).toContain('data-editorial-role={visualRole}')
  expect(editorial).toContain('data-presentation={presentation}')
  expect(editorial).toContain('visualRole={index === 0 ? "lead" : "supporting"}')
  expect(editorial).toContain('data-place-edge={item.placeEdgeVerification}')
  expect(editorial).toContain("item.editorialMedia.credit[locale]")
  expect(editorial).toContain('data-editorial-story-opener={mappedPlace.id}')
  expect(editorial).not.toMatch(/canonical-venue-directions|canonical-venue-save|canonical-place-table|canonical-meal-benefit-open/)
})

test("B-EXPLORE-V3-004 Place owns a truthful cartographic identity stage before decisions and provenance", () => {
  expect(place).toContain('data-testid="canonical-place-identity-stage"')
  expect(place).toContain('data-testid="canonical-place-atmosphere"')
  expect(place).toContain('data-testid="canonical-place-decisions"')
  expect(place).toContain('data-testid="canonical-source-evidence"')
  expect(place.indexOf('data-testid="canonical-place-identity-stage"')).toBeLessThan(place.indexOf('data-testid="canonical-place-decisions"'))
  expect(place.indexOf('data-testid="canonical-place-decisions"')).toBeLessThan(place.indexOf('data-testid="canonical-source-evidence"'))
})

test("B-EXPLORE-V3-005 redesign freezes the connected journey actions and truth domains", () => {
  for (const testid of [
    "ondo-b-korea-atlas",
    "ondo-b-city-back",
    "ondo-b-search-shell",
    "ondo-b-category-rail",
    "ondo-b-japan-first-discovery",
    "canonical-place-peek",
    "canonical-place-overlay",
    "canonical-venue-directions",
    "canonical-venue-save",
    "canonical-place-table",
    "canonical-local-signal-open",
  ]) expect(`${map}\n${editorial}\n${place}`).toContain(`data-testid="${testid}"`)
  expect(place).toContain('offerTestId="canonical-meal-benefit-open"')
  const services = source("features/ondo/place/place-service-actions-b.tsx")
  expect(services).toContain('data-testid={offerTestId ?? "place-offer-open"}')
  expect(services).toContain("if (!sampleMode || !place")
  expect(services).toContain("resolveCommercePlaceB(placeId)")

  expect(map).toContain('data-editorial-point-count={city === "jeju" ? JEJU_EDITORIAL_PLACES.length : undefined}')
  expect(map).toContain('data-directory-source={city === "jeju" ? undefined : SOURCE_ID}')
  expect(editorial).toContain('data-geometry-basis={city === "jeju" ? "verified-points" : "region"}')
  expect(editorial).toContain('data-place-point-count={city === "jeju" ? JEJU_EDITORIAL_PLACES.length : 0}')
})
