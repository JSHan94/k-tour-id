# ONDO B pixel evidence harness

Status: `PRODUCT FROZEN · HARNESS/BASELINE UNFROZEN · CURRENT FULL RUN PENDING`

Source route: `/ondo-b`

Primary registry: `tests/helpers/ondo-b-visual-evidence.ts`

Current product SHA: `fb6529e560a6c2b96ae22d1120645e560b8039ef`

Current harness SHA and baseline digest: `PENDING`

## Exact registry

- `18` flows and `126` checkpoints
- `121 ACTUAL`, `5` reasoned `N/A`, `0 GAP`
- `44` visual cases and `42` distinct state IDs
- `6` exact viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`
- baseline target: `44 × 6 = 264` committed PNGs

`B_CHECKPOINT_VISUAL_EVIDENCE` gives every checkpoint one exact disposition:

- `pixel`: references one or more canonical `B-PX-*` cases.
- `functional_only`: records why no layout-distinct screenshot is claimed and links the canonical browser proof.

The flow suite uses composite journeys and grouped steps. This harness does not claim that all 126 checkpoint IDs are separate, exactly named `test.step` blocks.

## Frozen capture inputs

- browser time: `2026-08-19 20:30 KST`
- viewport: the six exact sizes above
- locale and local/session fixtures: declared per case
- local application fonts: wait for `document.fonts.ready`
- motion, transitions, caret and smooth scrolling: disabled
- external vector basemap: OpenFreeMap TileJSON is replaced with a deterministic empty vector source

The basemap replacement is not a blanket canvas mask. MapLibre still renders ONDO cluster circles, point markers, heat scores, contribution rings and labels. Headers, lists, sheets, notices, navigation and truth copy are never masked.

## Assertions attached to every screenshot

- runtime guard is installed
- unexpected product console errors and page errors: `0`
- first-party request failure and HTTP `4xx/5xx`: `0`
- serious or critical Axe violations: `0`
- Axe contrast/name/label/ARIA violations: `0`
- hit-testable controls smaller than `44×44 CSS px`: `0`
- visible metadata smaller than `12 CSS px`: `0`
- independent hit-testable control overlap: `0`
- bottom navigation versus visible content-control overlap: `0`
- horizontally clipped/overflowing app content: `0`
- more than one exposed modal dialog: `0`
- active modal background without paired `inert` and `aria-hidden`: `0`
- every active dialog has at least one hit-testable exit fully inside the viewport
- every visible dialog/control has a programmatic accessible name

Each Playwright result attaches `evidence-case.json`, `geometry.json`, `axe.json`, and runtime evidence. Raw runs remain under ignored `artifacts/qa/`; committed screenshot baselines are the reviewed pixel contract.

## Commands

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:<PORT> pnpm test:visual:b
```

Equivalent explicit ownership:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:<PORT> pnpm exec playwright test \
  tests/visual/ondo-b-flow-pixels-mobile.spec.ts \
  --project=mobile-chromium --workers=1

PLAYWRIGHT_BASE_URL=http://127.0.0.1:<PORT> pnpm exec playwright test \
  tests/visual/ondo-b-flow-pixels-desktop.spec.ts \
  tests/visual/ondo-b-flow-pixels-responsive.spec.ts \
  --project=desktop-chromium --workers=1
```

Baseline changes are reviewed image-by-image and linked to an issue/approval receipt. A blanket snapshot update is not accepted as release evidence. The final gate is a full no-update `264/264` run.

## Baseline census

The registry test requires:

- mobile snapshots: exactly `44` at `390×844`
- desktop snapshots: exactly `44` at `1440×1000`
- responsive snapshots: exactly `176`, with `44` each at `360×800`, `430×932`, `768×1024`, `801×1000`
- total git-tracked PNGs: exactly `264`
- every image dimension matches its viewport
- every case/state/flow ID is registered and non-orphaned

## Current acceptance

The current product source is frozen, but the harness commit and 264-image digest are not yet frozen. Therefore no `264/264 PASS`, clean review round, or final deployment is claimed here. The older `5ac6308… / 6e7254a… / 5ffbe67…` 88-image tuple is historical evidence only and does not validate this product SHA.
