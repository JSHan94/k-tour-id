# ONDO B pixel evidence harness

Status: `R5 HISTORICAL NOT CLEAN · 3/3 FIXED AND AUTOMATED · RETRY TUPLE FROZEN · FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN 0/2 · NOT DEPLOYED`

Source route: `/ondo-b`

Primary registry: `tests/helpers/ondo-b-visual-evidence.ts`

## Exact R5 retry candidate

| Field | Value |
|---|---|
| Product boundary | `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` |
| Harness boundary / exact repository HEAD | `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` |
| Baseline digest | `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91` |
| Pixel inventory | `282 = 47 per viewport` |
| Provenance | `18 R5-FIX + 264 byte-identical R5-CARRY` |
| Lifecycle | `FULL AUTOMATED GATE PASS · R5 RETRY READY TO START` |

The immutable R5 reviewer input remains historical evidence candidate `39687c33ca5d14b60304b762b373e719bb4bdbbd`, Product `9ec3d192d0ebdc9614d980bdb173633aee16fc17`, Harness `12354bcf71621c00a08433faf09cbb000683ae61`, digest `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b`, verdict `5/5 COMPLETE · NOT CLEAN · objective S2 3`. It is not current clean credit. R4 review/coverage originals also remain immutable historical evidence.

## Exact registry

- `18` flows and `126` checkpoints
- `121 ACTUAL`, `5` reasoned `N/A`, `0 GAP`
- `47` visual cases and `45` distinct state IDs
- `6` exact viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`
- baseline inventory: `47 × 6 = 282` committed PNGs

`B_CHECKPOINT_VISUAL_EVIDENCE` gives every checkpoint one exact disposition:

- `pixel`: references one or more canonical `B-PX-*` cases.
- `functional_only`: records why no layout-distinct screenshot is claimed and links the canonical browser proof.

The flow suite uses composite journeys and grouped steps. This harness does not claim that all 126 checkpoint IDs are separate, exactly named `test.step` blocks.

## Frozen capture inputs

- frozen retry tuple: Product `30dcb136…`, Harness/HEAD `ee19adb…`, digest `f1ec9b0c…`
- viewport: the six exact sizes above
- locale and local/session fixtures: declared per case
- local application fonts: wait for `document.fonts.ready`
- motion, transitions, caret and smooth scrolling: disabled
- external vector basemap: OpenFreeMap TileJSON is replaced with a deterministic empty vector source

The basemap replacement is not a blanket canvas mask. MapLibre still renders ONDO cluster circles, point markers, heat scores, contribution rings and labels. Every visible map-backed frame is sampled through the common paint guard; blank compositor frames are rejected before capture. Headers, lists, sheets, notices, navigation and truth copy are never masked.

Retry Harness `ee19adb…` retains the paint guard qualified at `12354bcf…` and extends it to the new `CITY-FILTERED-MAP` state. Its state-neutral repaint path is allowed only after real MapLibre rendered-signal readiness and a blank/underpaint receipt; strict painted mismatches and zero-signal readiness fail instead of being repaired. Historical targeted qualification never substitutes for the pending exact-retry full acceptance gate.

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

Digest command, run from `k-tour-id-app/`:

```sh
find tests/visual -path '*ondo-b-flow-pixels*spec.ts-snapshots/*.png' -type f -print0 \
  | sort -z \
  | xargs -0 shasum -a 256 \
  | shasum -a 256
```

Baseline changes are reviewed image-by-image and linked to an issue/approval receipt. A blanket snapshot update is not accepted as release evidence. The exact full uninterrupted no-update gate passed `282/282`; this does not replace the pending nonpixel final gate.

## Baseline census and provenance

The registry and durable [`SLEEK-R5/baseline-files.tsv`](../../../docs/ondo-baljajwi/evidence/SLEEK-R5/baseline-files.tsv) require:

- mobile snapshots: exactly `47` at `390×844`
- desktop snapshots: exactly `47` at `1440×1000`
- responsive snapshots: exactly `188`, with `47` each at `360×800`, `430×932`, `768×1024`, `801×1000`
- total git-tracked PNGs: exactly `282`
- every image dimension matches its viewport
- every case/state/flow/locale metadata record matches `B_VISUAL_CASES`
- `282` unique path and `case_id + viewport` pairs
- `6` `PLACE-DETAIL` and `6` `AFTER19-VENUE-LOCKED` images differ from the R5-reviewed bytes for `R5-001`
- `6` new `CITY-FILTERED-MAP` images cover `R5-003`
- `264` `R5-CARRY` images match the R5-reviewed bytes exactly

Six changed `PLACE-DETAIL` focus frames were approved in `b5f6c0e73758a578ce9f8f7b00157f298e9b2188`; six changed `AFTER19-VENUE-LOCKED` focus frames are in `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f`; the six filtered-map additions are in `9500515197c2f9a77845ed2b9cb4e3d742a8b8cb`. The short-height landscape fix is covered by a dedicated `844×390` browser regression and does not fabricate a seventh canonical pixel viewport.

## Current acceptance state

The R5 review found three independent objective S2 issues: focus/danger semantic collision, short-height landscape Nation collision, and filtered-map marker/legend mismatch. Exact retry Product `30dcb136…` and Harness `ee19adb…` contain `3/3 FIXED AND AUTOMATED`; the visual registry is now `47/45/282` with digest `f1ec9b0c…`.

The exact-HEAD visual receipt passed: first-run no-update `282/282`, high-risk `216/216`, landscape `2/2`, pixel/runtime/geometry/Axe/modal failures `0`, and retained Map paint receipts `63/63 + 117/117`. The exact nonpixel receipt also passed: B `420 PASS + 84 intentional skips`, A `22/22`, contracts `26/26`, with fail/flaky/error `0`. The durable ledger is [`SLEEK-R5/frozen-receipt.md`](../../../docs/ondo-baljajwi/evidence/SLEEK-R5/frozen-receipt.md). Lifecycle is `FULL AUTOMATED GATE PASS`; R5 retry is `READY TO START`; clean streak remains `0/2`; deployment remains `NOT DEPLOYED`.
