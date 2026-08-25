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
      "ondo-pulse-labels",
      "pulseMarkerLabel",
      "ondo-b-pulse-marker-accessible-detail",
      "ondo-b-map-pulse-places",
      "data-pulse-place-priority",
      "ondo-b-location-details",
      "ondo-points",
      "prefers-reduced-motion: reduce",
    ]) expect(map).toContain(token)

    expect(map).toContain("const duration = 220")
    expect(map).toContain('"text-size": ["interpolate", ["linear"], ["zoom"], 9, 12')
    expect(map).toContain('"text-size": 12')
    expect(map).toContain('id: "ondo-selected-pulse-outer", type: "circle", source: "ondo-pulse"')
    expect(map).toContain('["zoom"], 9, 22')
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

    expect(map).toContain("data-pulse-map-grammar=\"curated-level-score-over-official-groups\"")
    expect(map).toContain("data-testid=\"ondo-b-map-key-details\"")
    expect(map).toContain("data-testid=\"ondo-b-map-credit-details\"")
    expect(map).toContain("data-testid=\"ondo-b-location-details\"")
    expect(css).toContain("@keyframes pulseLegendGlow")
    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  })
})
