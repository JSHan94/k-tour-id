# ONDO B pixel evidence harness

Status: `FINAL AUTOMATED GATES SEALED GREEN · BLIND REVIEW READY · CLEAN 0/2 · NOT DEPLOYED`

Source route: `/ondo-b`

Primary registry: `tests/helpers/ondo-b-visual-evidence.ts`

## Exact current successor candidate

| Field | Value |
|---|---|
| Product boundary | `cb4fcd3585cfb8a0693913d3e300881208f8ecad` |
| Harness / frozen candidate | `cb4fcd3585cfb8a0693913d3e300881208f8ecad` |
| Baseline digest | `86ac0588985647163bf8028eee4804d3adbeda1f248206406bd765d5ca19ce00` |
| Pixel inventory | `300 = 50 per viewport` |
| Provenance | `294 unchanged from b68 candidate + 6 unique corrected paths`; D4 4 + D3 3 refresh operations overlap on 360 filtered map |
| Lifecycle | `FINAL AUTOMATED GATES SEALED GREEN · BLIND REVIEW READY` |

The immutable R5-RETRY reviewer input remains historical evidence candidate `b0d25fe634d9d50a8668501f0fde5f641153168b`, Product `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc`, Harness `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f`, digest `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91`, verdict `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1`. It is not current clean credit. R4/R5/R5-RETRY review/coverage originals remain byte-immutable.

Predecessor `be645fb… / 7c7b39d… / 86ac058…` retained this pixel inventory and passed its visual gate, but its first-only full B run found a real `844×390` EN filter/preference overlap and disqualified the tuple. Current `cb4fcd3…` corrects that noncanonical short-landscape collision without changing any PNG and adds an explicit KO/EN four-short-landscape plus six-canonical-viewport rail-integrity test. Visual evidence must still rerun on the exact current boundary; the predecessor result is not current PASS credit.

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

- frozen current candidate: Product `cb4fcd3…`, Harness/frozen candidate `cb4fcd3…`, digest `86ac058…`
- viewport: the six exact sizes above
- locale and local/session fixtures: declared per case
- local application fonts: wait for `document.fonts.ready`
- motion, transitions, caret and smooth scrolling: disabled
- external vector basemap: OpenFreeMap TileJSON is replaced with a deterministic empty vector source

The basemap replacement is not a blanket canvas mask. MapLibre still renders ONDO cluster circles, point markers, heat scores, contribution rings and labels. Every visible map-backed frame is sampled through the common paint guard; blank compositor frames are rejected before capture. Headers, lists, sheets, notices, navigation and truth copy are never masked.

Current Harness retains the paint guard qualified by earlier rounds and extends the registry with expiry/session-reset/discovery-reset closure states. It additionally requires exact singular filtered-map truth, the locale-invariant Labs target token, and `maxDiffPixels=0` for the two semantic truth cases. Ordinary no-update runs still require every paint and state-neutral invariant. Exact full no-update acceptance for the current tuple is SEALED GREEN.

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

Baseline changes are inventoried image-by-image and linked to the R5-RETRY issue/fix ledger. A blanket snapshot update is not accepted as release evidence. Exact visual acceptance is sealed at full uninterrupted `300/300`, high-risk `144/144`, safeguards `20/20`, reporter `464/464`, health `3510/3510`, anomalies `0`, and clean postflight.

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

The new cases are `AFTER19-EXPIRED-REASON`, `SESSION-RESET-CONFIRM`, and `DISCOVERY-RESET-CONFIRM`. The short-height/reflow fixes remain covered by dedicated browser matrices and do not fabricate a seventh canonical pixel viewport. PNG refresh commits `c1180d6…` and `16a28a7…` create candidate bytes; exact no-update receipts are SEALED GREEN, while release approval still depends on two fresh consecutive blind clean rounds.

## Current acceptance state

The R5-RETRY review found raw `S2 11 + S3 1` across width/pointer feedback, history, landmarks/reflow, reset/localization, offline/expiry/focus. The b68 CLEAN1 then failed with raw `S1 1 + S2 5`, and c05 CLEAN1 failed with raw `S2 3 + S3 2`. Exact current Product `cb4fcd3…` and Harness/frozen candidate `cb4fcd3…` contain those corrections plus the c05 short-landscape/Gate announcement/Labs focus/KO timestamp/v3 docs corrections and complete return-gate safety guards. The visual registry remains `50/48/300` with digest `86ac058…`; 294 PNGs carry byte-identically from c05 and the six `B-PX-FEEDBACK-KO` rows carry the approved canonical KO timestamp refresh.

The current minimal pack is [`SLEEK-R5R-FINAL-cb4fcd3`](../../../docs/ondo-baljajwi/evidence/SLEEK-R5R-FINAL-cb4fcd3/frozen-receipt.md). Its exact visual receipt is `SEALED GREEN` (`300/300 + 144/144 + 20/20`, reporter `464/464`, anomaly `0`), and nonpixel is also `SEALED GREEN`; fresh blind review is `READY`, clean streak `0/2`, deployment `NOT DEPLOYED`. The b68/c05 packs and failed CLEAN1 artifacts remain immutable history.
