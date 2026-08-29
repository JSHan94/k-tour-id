import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  B_MAP_PAINT_CANVAS_RECEIPTS,
  B_MAP_PAINT_EDGE_RECEIPTS,
  B_MAP_PAINT_MIN_COMPONENT_PIXELS,
  B_MAP_PAINT_MIN_HEAT_PIXELS,
} from "../helpers/ondo-b-visual-evidence"

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

  test("RESET-004 atlas keeps truth in attributes while Place retains progressive source evidence", () => {
    const map = source("features/ondo/map/map-entry-b.tsx")
    const place = source("features/ondo/place/canonical-place-overlay.tsx")

    expect(map).toContain("cityNodes.map")
    expect(map).toContain("data-official-count={cityNode.officialCount}")
    expect(map).toContain("data-editorial-count={cityNode.editorialCount}")
    expect(map).toContain("accessibleTruth")
    expect(place).toContain('data-testid="canonical-place-source-summary"')
    expect(place).toContain('data-source-presentation="compact-ribbon"')
    expect(place).toContain('data-testid="canonical-source-evidence"')
    expect(place).toContain('data-source-presentation="progressive-details"')
    for (const truth of ["copy.sourceBoundary", "copy.sourceBody", "copy.sourceSnapshot", "copy.sourceRecord", "copy.sourceReference"]) {
      expect(place).toContain(truth)
    }
  })

  test("RESET-005 personal settings and the offer canvas finish in neutral ONDO material", () => {
    const settings = source("features/ondo/settings/settings-entry-b.tsx")
    const personal = source("features/ondo/shared/ui/production-local.module.css")
    const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.module.css")

    expect(settings).toContain('src="/brand/ondo-mark-micro-24.svg"')
    expect(settings).toContain('data-testid="settings-language-control"')
    expect(personal).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    expect(personal).toContain('.screen[data-testid="ondo-b-settings-entry"] { background: #fff; }')
    expect(commerce).toContain('.offerOverlay { background: #fff; color: #20201f; }')
    expect(commerce.lastIndexOf('.offerOverlay { background: #fff; color: #20201f; }'))
      .toBeGreaterThan(commerce.lastIndexOf('linear-gradient(180deg, #fffaf6 0%, #f0e7df 100%)'))
  })

  test("RESET-006 map paint receipts follow the redesigned mobile occlusion contract", () => {
    const receipts = new Set<string>([...B_MAP_PAINT_CANVAS_RECEIPTS, ...B_MAP_PAINT_EDGE_RECEIPTS])
    const opaqueMobileCases = [
      "B-PX-GATE-ACCOUNT-FAIL-KO",
      "B-PX-GATE-PAYMENT-EN",
      "B-PX-GATE-PAYMENT-FAIL-KO",
      "B-PX-GATE-PERSON-CX-KO",
      "B-PX-GATE-PERSON-PASSPORT-EN",
      "B-PX-GATE-RESIDENCE-UNSUPPORTED-EN",
    ]
    for (const caseId of opaqueMobileCases) {
      for (const viewport of ["360x800", "390x844", "430x932"]) {
        expect(receipts.has(`${caseId}:${viewport}`), `${caseId} is opaque at ${viewport}`).toBe(false)
      }
    }

    expect(B_MAP_PAINT_MIN_COMPONENT_PIXELS).toBe(12)
    expect(B_MAP_PAINT_MIN_HEAT_PIXELS).toBe(24)
    expect(B_MAP_PAINT_EDGE_RECEIPTS).toEqual([])
    expect(B_MAP_PAINT_CANVAS_RECEIPTS).toContain("B-PX-PLACE-PEEK-EN:360x800")
    expect(B_MAP_PAINT_CANVAS_RECEIPTS).toContain("B-PX-PLACE-PEEK-EN:390x844")
    for (const viewport of ["360x800", "390x844", "430x932", "768x1024", "801x1000", "1440x1000"]) {
      expect(B_MAP_PAINT_CANVAS_RECEIPTS).toContain(`B-PX-CITY-LIVE-EN:${viewport}`)
      expect(B_MAP_PAINT_CANVAS_RECEIPTS).toContain(`B-PX-CITY-LIVE-KO:${viewport}`)
    }
    for (const caseId of [
      "B-PX-AFTER19-PROMPT-EN",
      "B-PX-GATE-AGE-FAIL-KO",
      "B-PX-GATE-PAYMENT-EN",
      "B-PX-GATE-PAYMENT-FAIL-KO",
    ]) {
      for (const viewport of ["360x800", "390x844", "430x932", "768x1024", "801x1000", "1440x1000"]) {
        expect(receipts.has(`${caseId}:${viewport}`), `${caseId} is deliberately isolated at ${viewport}`).toBe(false)
      }
    }
    expect(receipts.has("B-PX-GATE-ACCOUNT-FAIL-KO:801x1000"), "the 801px place overlay covers the mapped background").toBe(false)
    for (const viewport of ["768x1024", "801x1000"]) {
      expect(
        receipts.has(`B-PX-GATE-PERSON-PASSPORT-EN:${viewport}`),
        `nested Local Signal eligibility overlays cover every visible Pulse core at ${viewport}`,
      ).toBe(false)
    }
    expect(B_MAP_PAINT_CANVAS_RECEIPTS).toContain("B-PX-GATE-ACCOUNT-FAIL-KO:768x1024")
    expect(B_MAP_PAINT_CANVAS_RECEIPTS).toContain("B-PX-GATE-ACCOUNT-FAIL-KO:1440x1000")
  })

  test("RESET-007 the legacy pixel census owns deterministic network and chat framing", () => {
    const evidence = source("tests/helpers/ondo-b-visual-evidence.ts")

    expect(evidence).toContain('Object.defineProperty(Navigator.prototype, "onLine"')
    expect(evidence).toContain("get: () => true")
    expect(evidence).toContain('["CHAT", "CHAT-IMAGE-FAIL", "FEEDBACK", "REPORT"].includes(item.state)')
    expect(evidence).toContain('const chat = page.getByTestId("table-chat")')
    expect(evidence).toContain('stabilizeMobileEvidenceScroll(page, chat, { kind: "top", offset: 80 })')
    expect(evidence).toContain('stabilizeMobileEvidenceScroll(page, chat, { kind: "scrollTop", value: 0 })')
    expect(evidence).toContain('stabilizeMobileEvidenceScroll(page, chat, { kind: "scrollTop", value: 10 })')
  })
})
