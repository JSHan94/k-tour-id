import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test.describe("ONDO B map Pulse visual contract", () => {
  test("curated Pulse stays visible above neutral official groups from the city zoom", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")
    const css = source("features/ondo/map/map-b.module.css")
    const model = source("features/ondo/pulse-b/pulse-model-b.ts")

    for (const token of [
      "pulseRank",
      "toPulseFeatureCollection",
      "addSource(\"ondo-pulse\"",
      "ondo-clusters",
      "ondo-pulse-halo",
      "ondo-pulse-points",
      "ondo-pulse-hit",
      "ondo-pulse-labels",
      "pulseMarkerLabel",
      "ondo-b-pulse-marker-accessible-detail",
      "ondo-b-map-pulse-places",
      "data-pulse-place-priority",
      "ondo-b-location-details",
      "ondo-points",
      "prefers-reduced-motion: reduce",
    ]) expect(map).toContain(token)

    expect(map).toContain("const duration = 240")
    expect(map).toContain('"text-size": 12')
    expect(map).toContain('data-pulse-visual-grammar={city === "jeju" ? undefined : "borderless-aura-core-label"}')
    expect(map).toContain('data-selected-pulse-grammar={city === "jeju" ? undefined : "one-shot-halo-place-capsule"}')
    expect(map).toContain('id: "ondo-selected-pulse-outer", type: "circle", source: "ondo-pulse"')
    expect(map).toContain('id: "ondo-selected-pulse-rising", type: "circle", source: "ondo-pulse"')
    expect(map).toContain('id: "ondo-selected-pulse-warming", type: "circle", source: "ondo-pulse"')
    expect(map).toContain('id: "ondo-pulse-hit", type: "circle", source: "ondo-pulse"')
    expect(map).toContain('"circle-radius": 22')
    expect(map).toContain('"circle-translate": risingTranslate')
    expect(map).toContain('"circle-translate": warmingTranslate')
    expect(map).toContain('const centralPeakFilter: ExpressionSpecification = ["==", ["get", "pulseScore"], 91]')
    expect(map).toContain('const centralHotFilter: ExpressionSpecification = ["==", ["get", "pulseScore"], 80]')
    expect(map).toContain('const unselectedPulseFilter: ExpressionSpecification = ["!=", ["get", "selected"], true]')
    expect(map).toContain('const centralPeakLabelFilter: ExpressionSpecification = ["all", centralPeakFilter, unselectedPulseFilter]')
    expect(map).toContain('const centralHotLabelFilter: ExpressionSpecification = ["all", centralHotFilter, unselectedPulseFilter]')
    expect(map).toContain('const centralPeakLabelLayout: SymbolLayerSpecification["layout"] = { ...pulseLabelLayout, "text-offset": [-1.2, 1.1], "text-anchor": "top" }')
    expect(map).toContain('const centralHotLabelLayout: SymbolLayerSpecification["layout"] = { ...pulseLabelLayout, "text-offset": [0.35, 1.1], "text-anchor": "top" }')
    expect(map).toContain('id: "ondo-pulse-labels-central-peak"')
    expect(map).toContain('id: "ondo-pulse-labels-central-hot"')
    expect(map).toContain('filter: centralPeakLabelFilter')
    expect(map).toContain('filter: centralHotLabelFilter')
    expect(map).toContain('"text-anchor": "top"')
    expect(map).not.toContain("clusterProperties:")

    const palette = {
      peak: "#7A2048",
      hot: "#C94832",
      rising: "#E6843B",
      warming: "#EBC463",
      low: "#EFE1B7",
      limited: "#CFCAC0",
    }
    for (const [level, color] of Object.entries(palette)) {
      expect(map).toContain(`\"${level}\"`)
      expect(map.toUpperCase()).toContain(color)
      expect(css.toUpperCase()).toContain(color)
      expect(model.toUpperCase()).toContain(color)
    }
    expect(css).toContain('.pulseLegend span[data-level="limited"] i')
    expect(css).toContain("border-style: dashed")
    expect(css).toContain(".pulsePlaces button")
    expect(css).not.toContain(".mapKey > div > span { font-size: 0; }")
  })

  test("the map keeps a restrained motion and progressive-disclosure grammar", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")
    const css = source("features/ondo/map/map-b.module.css")

    expect(map).toContain('data-pulse-map-grammar={city === "jeju" ? undefined : "curated-level-score-over-official-groups"}')
    expect(map).toContain("data-testid=\"ondo-b-map-key-details\"")
    expect(map).toContain("data-testid=\"ondo-b-map-credit-details\"")
    expect(map).toContain("data-testid=\"ondo-b-location-details\"")
    expect(css).toContain("@keyframes pulseLegendGlow")
    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  })
})
