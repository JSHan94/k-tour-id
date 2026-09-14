import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const source = readFileSync(resolve("features/ondo/map/map-entry-b.tsx"), "utf8")
const css = readFileSync(resolve("features/ondo/map/map-b.module.css"), "utf8")

test("nation ambience is decorative on existing anchors, not new geography or live activity", () => {
  expect(source).toContain('<i aria-hidden="true"><b className={styles.atlasSignalRipple} /></i>')
  expect(source).toContain('data-atlas-motion={atlasMotionPlaying ? "playing" : "paused"}')
  expect(css).toContain("@keyframes atlasWarmthBreath")
  expect(css).toContain("@keyframes atlasWarmthRipple")
  expect(css).toContain("--atlas-breath-delay: -2.6s")
  expect(css).toContain("--atlas-breath-delay: -5.2s")
  expect(css).toContain("Decorative only; it conveys neither visitor counts nor live temperature.")
})

test("ongoing nation ambience has a pause control and sleeps offscreen, hidden, departing, or reduced", () => {
  expect(source).toContain('data-testid="ondo-b-atlas-motion"')
  expect(source).toContain("onClick={() => setAtlasMotionPaused(paused => !paused)}")
  expect(source).toContain('sampleMotion && mapState === "ready" && documentVisible && atlasInView')
  expect(source).toContain('activeAtlasTab === "ondo"')
  expect(source).toContain("!reducedAtlasMotion && !atlasMotionPaused && departingCity === null")
  expect(source).toContain('preference.removeEventListener("change", syncMotion)')
  expect(source).toContain("observer?.disconnect()")
  expect(css).toContain('.koreaAtlas[data-atlas-motion="paused"] .cityNode .atlasSignalRipple { animation-play-state: paused; }')
  expect(css).toContain("@media (prefers-reduced-motion: reduce), (forced-colors: active)")
  expect(css).toContain(".koreaAtlas .cityNode .atlasSignalRipple { display: none; }")
})
