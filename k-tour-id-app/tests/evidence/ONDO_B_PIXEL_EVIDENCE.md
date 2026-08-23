# ONDO B pixel evidence harness

Status: `FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`

Source route: `/ondo-b`

Primary registry: `tests/helpers/ondo-b-visual-evidence.ts`

## Exact current successor candidate

| Field | Value |
|---|---|
| Product boundary | `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` |
| Harness / frozen candidate | `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` |
| Baseline digest | `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` |
| Pixel inventory | `300 = 50 per viewport` |
| Provenance | `294 unchanged from b68 candidate + 6 unique corrected paths`; D4 4 + D3 3 refresh operations overlap on 360 filtered map |
| Lifecycle | `FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY` |

The immutable R5-RETRY reviewer input remains historical evidence candidate `b0d25fe634d9d50a8668501f0fde5f641153168b`, Product `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc`, Harness `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f`, digest `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91`, verdict `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1`. It is not current clean credit. R4/R5/R5-RETRY review/coverage originals remain byte-immutable.

## Exact registry

- `18` flows and `126` checkpoints
- `123 ACTUAL`, `3` reasoned `N/A`, `0 GAP`
- `50` visual cases and `48` distinct state IDs
- `6` exact viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`
- baseline inventory: `50 × 6 = 300` committed candidate PNGs

`B_CHECKPOINT_VISUAL_EVIDENCE` gives every checkpoint one exact disposition:

- `pixel`: references one or more canonical `B-PX-*` cases.
- `functional_only`: records why no layout-distinct screenshot is claimed and links the canonical browser proof.

The flow suite uses composite journeys and grouped steps. This harness does not claim that all 126 checkpoint IDs are separate, exactly named `test.step` blocks.

## Frozen capture inputs

- frozen current candidate: Product `5c6383e…`, Harness/frozen candidate `c05a2d0…`, digest `addf064…`
- viewport: the six exact sizes above
- locale and local/session fixtures: declared per case
- local application fonts: wait for `document.fonts.ready`
- motion, transitions, caret and smooth scrolling: disabled
- external vector basemap: OpenFreeMap TileJSON is replaced with a deterministic empty vector source

The basemap replacement is not a blanket canvas mask. MapLibre still renders ONDO cluster circles, point markers, heat scores, contribution rings and labels. Every visible map-backed frame is sampled through the common paint guard; blank compositor frames are rejected before capture. Headers, lists, sheets, notices, navigation and truth copy are never masked.

Current Harness retains the paint guard qualified by earlier rounds and extends the registry with expiry/session-reset/discovery-reset closure states. It additionally requires exact singular filtered-map truth, the locale-invariant Labs target token, and `maxDiffPixels=0` for the two semantic truth cases. Ordinary no-update runs still require every paint and state-neutral invariant. Exact full no-update acceptance is sealed GREEN at `300/300` for the current tuple.

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

Baseline changes are inventoried image-by-image and linked to the R5-RETRY issue/fix ledger. A blanket snapshot update is not accepted as release evidence. The exact full uninterrupted `300/300` no-update gate is sealed with high-risk repeat3 `144/144`, safeguards `20/20` (including landscape `2/2` and backdrop `9/9`), reporter anomalies `0`, and `254/254` health samples.

## Baseline census and provenance

The registry and durable candidate [`SLEEK-R5-RETRY/baseline-files.tsv`](../../../docs/ondo-baljajwi/evidence/SLEEK-R5-RETRY/baseline-files.tsv) require:

- mobile snapshots: exactly `50` at `390×844`
- desktop snapshots: exactly `50` at `1440×1000`
- responsive snapshots: exactly `200`, with `50` each at `360×800`, `430×932`, `768×1024`, `801×1000`
- total git-tracked PNGs: exactly `300`
- every image dimension matches its viewport
- every case/state/flow/locale metadata record matches `B_VISUAL_CASES`
- `300` unique path and `case_id + viewport` pairs
- `141` paths are byte-identical to the R5-RETRY reviewed bytes
- `141` existing paths changed (`135` product-fix provenance + `6` product/helper Place Peek provenance)
- `18` paths are the three new closure states at six widths

The new cases are `AFTER19-EXPIRED-REASON`, `SESSION-RESET-CONFIRM`, and `DISCOVERY-RESET-CONFIRM`. The short-height/reflow fixes remain covered by dedicated browser matrices and do not fabricate a seventh canonical pixel viewport. PNG refresh commits `c1180d6…` and `16a28a7…` create candidate bytes; approval still depends on exact no-update receipts and blind review.

## Current acceptance state

The R5-RETRY review found raw `S2 11 + S3 1` across width/pointer feedback, history, landmarks/reflow, reset/localization, offline/expiry/focus. The first b68 CLEAN1 then failed with raw `S1 1 + S2 5`. Exact current Product `5c6383e…` and Harness/frozen candidate `c05a2d0…` contain those corrections plus explicit onboarding Escape/hydration focus, Gate list semantics, canonical `2px + 2px` focus locking, `667/740/844/926` landscape and 360 control pairwise assertions, locale-invariant Labs truth, and singular filtered-map semantic guards. The visual registry remains `50/48/300` with digest `addf064…`.

The current minimal pack is [`SLEEK-R5R-FINAL-c05a2d0`](../../../docs/ondo-baljajwi/evidence/SLEEK-R5R-FINAL-c05a2d0/frozen-receipt.md). Its nonpixel and visual receipts are both `GREEN`; the blind clean round is `READY`; clean streak remains `0/2`; deployment remains `NOT DEPLOYED`. The b68 pack and failed CLEAN1 artifacts remain immutable history.
