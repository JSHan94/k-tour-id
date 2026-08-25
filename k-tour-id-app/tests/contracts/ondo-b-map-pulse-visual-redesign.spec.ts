import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test.describe("ONDO B map Pulse visual contract", () => {
  test("aggregate map clusters inherit the strongest curated Pulse instead of painting every group neutral", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")

    for (const token of [
      "pulseRank",
      "clusterProperties",
      "ondo-cluster-pulse-halo",
      "ondo-clusters",
      "ondo-pulse-halo",
      "ondo-points",
      "prefers-reduced-motion: reduce",
    ]) expect(map).toContain(token)

    for (const level of ["peak", "hot", "rising", "warming", "low", "limited"]) {
      expect(map).toContain(`\"${level}\"`)
    }
  })

  test("the map keeps a restrained motion and progressive-disclosure grammar", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")
    const css = source("features/ondo/map/map-b.module.css")

    expect(map).toContain("data-pulse-map-grammar=\"heat-ranked-clusters\"")
    expect(map).toContain("data-testid=\"ondo-b-map-key-details\"")
    expect(map).toContain("data-testid=\"ondo-b-map-credit-details\"")
    expect(css).toContain("@keyframes pulseLegendGlow")
    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  })
})
