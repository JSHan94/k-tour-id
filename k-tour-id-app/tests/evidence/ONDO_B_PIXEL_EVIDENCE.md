# ONDO B pixel evidence harness

Status: `FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`

Source route: `/ondo-b`

Primary registry: `tests/helpers/ondo-b-visual-evidence.ts`

## Exact current successor candidate

| Field | Value |
|---|---|
| Product boundary | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Harness / frozen candidate | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Baseline digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |
| Pixel inventory | `300 = 50 per viewport` |
| Provenance | `141 R5R-CARRY + 135 R5R-FIX + 6 R5R-FIX+HARNESS + 18 R5R-NEW` |
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

- frozen current candidate: Product `5b519e6…`, Harness/frozen candidate `b68fc18…`, digest `1dcfacb7…`
- viewport: the six exact sizes above
- locale and local/session fixtures: declared per case
- local application fonts: wait for `document.fonts.ready`
- motion, transitions, caret and smooth scrolling: disabled
- external vector basemap: OpenFreeMap TileJSON is replaced with a deterministic empty vector source

The basemap replacement is not a blanket canvas mask. MapLibre still renders ONDO cluster circles, point markers, heat scores, contribution rings and labels. Every visible map-backed frame is sampled through the common paint guard; blank compositor frames are rejected before capture. Headers, lists, sheets, notices, navigation and truth copy are never masked.

Current Harness retains the paint guard qualified by earlier rounds and extends the registry with expiry/session-reset/discovery-reset closure states. `a9b3193…` makes Place Peek use the history-aware canonical setup and wait for map-ready. `dbb2248…` permits explicit update mode to replace an obsolete painted baseline without demanding a heat receipt from the obsolete image first; ordinary no-update runs still require every paint and state-neutral invariant. Exact full no-update acceptance is now sealed separately from candidate generation.

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

Baseline changes are inventoried image-by-image and linked to the R5-RETRY issue/fix ledger. A blanket snapshot update is not accepted as release evidence. The exact full uninterrupted `300/300` no-update gate is sealed with high-risk repeat3 `144/144`, landscape `2/2`, backdrop `9/9`, reporter anomalies `0`, and `163/163` health samples.

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

The R5-RETRY review found raw `S2 11 + S3 1` across width/pointer feedback, history, landmarks/reflow, reset/localization, offline/expiry/focus. Exact current Product `5b519e6…` and Harness/frozen candidate `b68fc18…` contain that correction set plus offline hitbox/client-local traversal, saved-return/FL-011, Gate-focus, and bounded Age Gate wait audit corrections; the visual registry remains `50/48/300` with digest `1dcfacb7…`.

Current exact frozen-candidate nonpixel and visual GREEN are sealed in [`SLEEK-R5-RETRY/frozen-receipt.md`](../../../docs/ondo-baljajwi/evidence/SLEEK-R5-RETRY/frozen-receipt.md). The separate minimal strict-blind pack is [`SLEEK-R5R-FINAL-b68fc18`](../../../docs/ondo-baljajwi/evidence/SLEEK-R5R-FINAL-b68fc18/frozen-receipt.md). Lifecycle is `FULL AUTOMATED GATE PASS`; blind review is `READY`; clean streak remains `0/2`; deployment remains `NOT DEPLOYED`.
