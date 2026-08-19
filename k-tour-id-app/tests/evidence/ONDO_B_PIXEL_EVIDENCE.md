# ONDO B pixel evidence harness

Source route: `/ondo-b`

Primary source of cases: `tests/helpers/ondo-b-visual-evidence.ts`

## What is frozen

- browser time: `2026-08-19 20:30 KST`
- viewport: `390×844` mobile and `1440×1000` desktop
- locale and local/session fixtures per case
- local application fonts: screenshots wait for `document.fonts.ready`
- motion, transitions, caret and smooth scrolling
- external vector basemap: OpenFreeMap TileJSON is replaced by an empty deterministic vector source

The empty basemap is not a blanket canvas mask. MapLibre still renders ONDO's own
cluster circles, point markers, heat scores, contribution rings and score labels.
Headers, lists, sheets, notices and navigation are never masked.

## Assertions attached to every screenshot

- unexpected product console errors, page errors and first-party request failures: `0`
- serious or critical axe violations: `0`
- hit-testable controls smaller than `44×44 CSS px`: `0`
- visible metadata smaller than `12 CSS px`: `0`
- independent hit-testable control overlap: `0`
- bottom navigation versus visible content-control overlap: `0`
- every active dialog has a hit-testable exit CTA fully inside the viewport
- every visible dialog/control has a programmatic ARIA name
- axe `color-contrast` and ARIA/name/label violations: `0`
- horizontally clipped/overflowing app content: `0`

Each Playwright result attaches `evidence-case.json`, `geometry.json`, and
`axe.json`. Raw runs remain under ignored `artifacts/qa/`; committed screenshot
baselines are the reviewed pixel contract.

## Commands

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3118 pnpm exec playwright test \
  tests/visual/ondo-b-flow-pixels-mobile.spec.ts \
  --project=mobile-chromium --workers=1

PLAYWRIGHT_BASE_URL=http://127.0.0.1:3118 pnpm exec playwright test \
  tests/visual/ondo-b-flow-pixels-desktop.spec.ts \
  --project=desktop-chromium --workers=1
```

Baseline changes are reviewed image-by-image. Do not use a blanket update after
a product change.

## Final-integration cases

- `FL-002`: `AFTER19-VENUE-LOCKED` proves ordinary place facts stay available; `AFTER19-VENUE-RETURN` completes the age-only gate and asserts the exact `venueId`, unlocked card, After19 banner, and consumed return marker.
- `FL-011`: `SAVE-FAILURE` captures the venue-preserving error and both recovery actions; `SAVE-RECOVERED` exercises fail → dismiss → fail → Retry save and captures the persisted Saved state.

These four actual cases replace generic predecessor captures so the registry remains exactly **44 registered states × 2 viewports = 88 pixel contracts** on product SHA `5ac630858389a1ca902a3fcfd01f77ae5bce9bb3` and harness SHA `6e7254af02adcf49a35424203e2201093485872a`.

## Final-SHA verification

The complete matrix was run against product SHA `5ac630858389a1ca902a3fcfd01f77ae5bce9bb3` and harness SHA
`6e7254af02adcf49a35424203e2201093485872a` at both target viewports. Result: **88/88 passed**, with 88 intentional
opposite-project skips. Save failure/recovery and the After19 exact-venue return
pass pixel, geometry, contrast, ARIA, console, runtime and context-preservation
guards. Labs bridge failure/success captures use explicit per-viewport canonical
scroll positions so a long serial run cannot inherit browser auto-scroll. There
are no unresolved actionable visual findings.
