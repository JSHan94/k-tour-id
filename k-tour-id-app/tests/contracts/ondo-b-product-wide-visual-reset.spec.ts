import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test.describe("ONDO B product-wide white/ink visual reset", () => {
  test("RESET-001 shared shell owns neutral tokens and an icon-first localized desktop rail", () => {
    const app = source("features/ondo/app/ondo-app-b.tsx")
    const css = source("features/ondo/app/ondo-shell.module.css")

    expect(css).toContain("--ondo-canvas: #ffffff")
    expect(css).toContain("--ondo-paper: #f7f7f5")
    expect(css).toContain("--ondo-ink: #171717")
    expect(css).toContain("--ondo-phone-edge: 16px")
    expect(app).toContain('data-nav-presentation="mobile-labeled-desktop-icon-first"')
    expect(app).toContain("data-nav-tooltip={B_NAV_COPY[state.locale][id]}")
    expect(app).toContain('aria-hidden="true"')
    expect(css).toContain(".nav button[data-state=\"selected\"]")
    expect(css).toContain(".nav button:hover .navLabel")
    expect(css).toContain(".nav button:focus-visible .navLabel")
    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
  })

  test("RESET-002 city chrome removes visible active-status copy and keeps heat aura-first", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")

    expect(map).toContain('data-testid="ondo-b-pulse-city-status"')
    expect(map).toContain('className={styles.srOnly}')
    expect(map).toContain('data-pulse-visual-grammar={city === "jeju" ? undefined : "aura-scale-selection-label"}')
    expect(map).not.toContain("pulseMarkerLabel:")
    expect(map).not.toContain('id: "ondo-pulse-labels"')
    expect(map).toContain('"text-field": ["get", "selectedMarkerLabel"]')
    expect(map).toContain('data-testid="ondo-b-pulse-marker-accessible-detail"')
    expect(map).toContain('data-testid="ondo-b-list-pulse"')
    expect(map).toContain('data-testid="ondo-b-selected-marker-status"')
  })

  test("RESET-003 count, view, Pulse key, location, and legal credits form compact truth chrome", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")
    const css = source("features/ondo/map/map-b.module.css")

    expect(map).toContain('data-chrome-role="count-view"')
    expect(map).toContain('data-pulse-key-presentation="compact-gradient"')
    expect(map).toContain('data-testid="ondo-b-pulse-methodology"')
    expect(map).toContain('data-attribution-presentation="compact-legal"')
    expect(map).toContain("OpenFreeMap")
    expect(map).toContain("OpenMapTiles")
    expect(map).toContain("OpenStreetMap / ODbL")
    expect(css).toContain('grid-template-areas:\n    "message message locate"\n    ". . ."\n    "key result attribution"')
    expect(css).toContain(".methodologyDisclosure")
    expect(css).toContain("--map-edge: var(--ondo-phone-edge, 16px)")
  })

  test("RESET-004 atlas and Place retain full truth behind compact source ribbons", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")
    const place = source("features/ondo/place/canonical-place-overlay.tsx")

    expect(map).toContain('data-source-disclosure="compact-ribbon"')
    expect(map).toContain('data-official-count="400"')
    expect(map).toContain('data-official-count="200"')
    expect(map).toContain('data-editorial-count="10"')
    expect(map).toContain("copy.sourceBoundary")
    expect(place).toContain('data-testid="canonical-place-source-summary"')
    expect(place).toContain('data-source-presentation="compact-ribbon"')
    expect(place).toContain('data-testid="canonical-source-evidence"')
    expect(place).toContain('data-source-presentation="progressive-details"')
    for (const truth of ["copy.sourceBoundary", "copy.sourceBody", "copy.sourceSnapshot", "copy.sourceRecord", "copy.sourceReference"]) {
      expect(place).toContain(truth)
    }
  })
})
