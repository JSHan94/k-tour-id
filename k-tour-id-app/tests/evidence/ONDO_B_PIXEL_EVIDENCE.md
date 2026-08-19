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

## Final-integration follow-up captures

- `FL-002`: final integration `e154b2d` implements the locked venue path via `canonical-after19-access` / `canonical-after19-unlock`.
- `FL-011`: final integration `e154b2d` implements save failure and retry via `canonical-save-error` / `canonical-save-retry`.

They are **not product gaps**. This isolated evidence source is intentionally
fixed at `c1433a9`, which predates those selectors. After cherry-picking this
harness onto final integration, add both reachable states to `B_VISUAL_CASES`
and generate their mobile and desktop baselines through targeted runs.
