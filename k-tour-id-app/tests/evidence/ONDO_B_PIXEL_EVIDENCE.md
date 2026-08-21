# ONDO B pixel evidence harness

Status: `R4 HISTORICAL NOT CLEAN · SUCCESSOR PRODUCT/HARNESS/BASELINE TUPLE FROZEN · FULL AUTOMATED GATE PASS · R5 READY TO START · CLEAN 0/2 · NOT DEPLOYED`

Source route: `/ondo-b`

Primary registry: `tests/helpers/ondo-b-visual-evidence.ts`

## Exact frozen successor

| Field | Value |
|---|---|
| Product boundary | `9ec3d192d0ebdc9614d980bdb173633aee16fc17` |
| Harness boundary / exact repository HEAD | `12354bcf71621c00a08433faf09cbb000683ae61` |
| Baseline digest | `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` |
| Pixel inventory | `276 = 46 per viewport` |
| Provenance | `84 R4-fix byte changes + 192 byte-identical SLEEK-R3 carries` |
| Lifecycle | `FULL AUTOMATED GATE PASS · R5 READY TO START` |

The immutable R4 reviewer input remains historical Product `05f3002899485c528e31730bfebd57d71c3d788d`, Harness `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4`, digest `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d`, verdict `5/5 COMPLETE · NOT CLEAN`. It is not current clean credit.

## Exact registry

- `18` flows and `126` checkpoints
- `121 ACTUAL`, `5` reasoned `N/A`, `0 GAP`
- `46` visual cases and `44` distinct state IDs
- `6` exact viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`
- baseline inventory: `46 × 6 = 276` committed PNGs

`B_CHECKPOINT_VISUAL_EVIDENCE` gives every checkpoint one exact disposition:

- `pixel`: references one or more canonical `B-PX-*` cases.
- `functional_only`: records why no layout-distinct screenshot is claimed and links the canonical browser proof.

The flow suite uses composite journeys and grouped steps. This harness does not claim that all 126 checkpoint IDs are separate, exactly named `test.step` blocks.

## Frozen capture inputs

- frozen tuple: Product `9ec3d192…`, Harness/HEAD `12354bcf…`, digest `4cfbed3…`
- viewport: the six exact sizes above
- locale and local/session fixtures: declared per case
- local application fonts: wait for `document.fonts.ready`
- motion, transitions, caret and smooth scrolling: disabled
- external vector basemap: OpenFreeMap TileJSON is replaced with a deterministic empty vector source

The basemap replacement is not a blanket canvas mask. MapLibre still renders ONDO cluster circles, point markers, heat scores, contribution rings and labels. Every visible map-backed frame is sampled through the common paint guard; blank compositor frames are rejected before capture. Headers, lists, sheets, notices, navigation and truth copy are never masked.

Final Harness `12354bcf…` qualifies the guard with a production build, forced-blank `1/1`, compact Place Peek `30/30`, affected production matrix `840/840`, and an independent `CLEAN · S0/S1/S2 0` integrity review. Its state-neutral repaint path is allowed only after real MapLibre rendered-signal readiness and a blank/underpaint receipt; strict painted mismatches and zero-signal readiness fail instead of being repaired. These targeted helper checks did not replace the full acceptance gate, which passed independently.

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

Baseline changes are reviewed image-by-image and linked to an issue/approval receipt. A blanket snapshot update is not accepted as release evidence. The final gate is a full uninterrupted no-update `276/276` run.

## Baseline census and provenance

The registry and durable [`SLEEK-R4/baseline-files.tsv`](../../../docs/ondo-baljajwi/evidence/SLEEK-R4/baseline-files.tsv) require:

- mobile snapshots: exactly `46` at `390×844`
- desktop snapshots: exactly `46` at `1440×1000`
- responsive snapshots: exactly `184`, with `46` each at `360×800`, `430×932`, `768×1024`, `801×1000`
- total git-tracked PNGs: exactly `276`
- every image dimension matches its viewport
- every case/state/flow/locale metadata record matches `B_VISUAL_CASES`
- `276` unique path and `case_id + viewport` pairs
- `84` `R4-FIX` images differ from the SLEEK-R3 frozen bytes
- `192` `R4-CARRY` images match the SLEEK-R3 frozen bytes exactly

The 84 intended changes are `78` integrated baseline updates in `e0b13d8242ad4b728b084cb2a11d0b59af03209b` plus `6` Local Signal updates in `8f3908ec9ada20541e4be28d0963e69b3f6da781`.

## Current acceptance

The Product/Harness/baseline identity and inventory are frozen, and the twelve consolidated R4 findings are `12/12 FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING`. On exact Harness `12354bcf…`, the frozen install, TypeScript, `28/28` production build, `26/26` contracts, B `408 PASS + 74 intentional skips`, A `22/22 PASS`, route/runtime checks, and first-run uninterrupted no-update pixel `276/276` all passed with no failure, flaky result, retry, or runtime/server error. The required high-risk repetition passed `180/180`; the extra mobile receipt-preservation run passed `30/30`; retained paint receipts were `159/159` with recovery attempts `0`.

The durable ledger and machine hashes are in [`SLEEK-R4/frozen-receipt.md`](../../../docs/ondo-baljajwi/evidence/SLEEK-R4/frozen-receipt.md). Lifecycle is `FULL AUTOMATED GATE PASS`; R5 is `READY TO START`; clean streak remains `0/2`; deployment remains `NOT DEPLOYED` until two fresh identical-tuple five-role clean rounds complete.
