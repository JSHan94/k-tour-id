import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test.describe("ONDO B map Pulse visual contract", () => {
  test("curated Pulse stays visible above neutral official groups from the city zoom", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")

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
      "ondo-points",
      "prefers-reduced-motion: reduce",
    ]) expect(map).toContain(token)

    expect(map).toContain("const duration = 220")
    expect(map).toContain('"text-size": ["interpolate", ["linear"], ["zoom"], 9, 12')
    expect(map).not.toContain("clusterProperties:")

    for (const level of ["peak", "hot", "rising", "warming", "low", "limited"]) {
      expect(map).toContain(`\"${level}\"`)
    }
  })

  test("the map keeps a restrained motion and progressive-disclosure grammar", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")
    const css = source("features/ondo/map/map-b.module.css")

    expect(map).toContain("data-pulse-map-grammar=\"curated-level-score-over-official-groups\"")
    expect(map).toContain("data-testid=\"ondo-b-map-key-details\"")
    expect(map).toContain("data-testid=\"ondo-b-map-credit-details\"")
    expect(css).toContain("@keyframes pulseLegendGlow")
    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  })
})
