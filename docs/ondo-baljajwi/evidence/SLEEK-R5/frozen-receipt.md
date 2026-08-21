# SLEEK-R5 retry candidate frozen receipt

Status: **PRODUCT/HARNESS/BASELINE TUPLE FROZEN FOR AUTOMATED ACCEPTANCE · FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN 0/2 · NOT DEPLOYED**

This receipt keeps the immutable SLEEK-R5 reviewed tuple separate from its three-fix retry candidate. Historical R5 remains `5/5 COMPLETE · NOT CLEAN`. The retry tuple passed both exact visual and nonpixel automated gates and is ready for a fresh blind review; automated PASS does not add clean-round credit.

## Exact retry candidate tuple

| Field | Value |
|---|---|
| Product boundary | `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` |
| Harness boundary / automated-gate HEAD | `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` |
| Baseline digest | `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91` |
| Route | `/ondo-b` |
| Flow registry | `18 flows · 126 checkpoints · 121 ACTUAL · 5 reasoned N/A · 0 GAP` |
| Visual registry | `47 cases · 45 distinct state IDs` |
| Viewports | `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` |
| PNG inventory | `282 = 47 per viewport` |
| Baseline provenance | `18 R5-FIX + 264 byte-identical R5-CARRY` |
| Lifecycle | `FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN 0/2 · NOT DEPLOYED` |

Digest working directory is `k-tour-id-app/`. The exact command is:

```bash
find tests/visual -path '*ondo-b-flow-pixels*spec.ts-snapshots/*.png' -type f -print0 \
  | sort -z \
  | xargs -0 shasum -a 256 \
  | shasum -a 256
```

The digest covers sorted `sha256 path` lines for all and only the three B flow-pixel snapshot families. Any file byte or path change invalidates this receipt and any later clean verdict.

## Historical SLEEK-R5 reviewed tuple — immutable NOT CLEAN provenance

| Field | Historical value |
|---|---|
| Evidence candidate | `39687c33ca5d14b60304b762b373e719bb4bdbbd` |
| Product | `9ec3d192d0ebdc9614d980bdb173633aee16fc17` |
| Harness | `12354bcf71621c00a08433faf09cbb000683ae61` |
| Baseline digest | `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` |
| Visual inventory | `46 cases · 44 states · 276 PNGs` |
| Verdict | `5/5 COMPLETE · NOT CLEAN · objective S2 3` |
| Reviewer lanes | `D1 NOT CLEAN · D2 CLEAN · D3 NOT CLEAN · D4 CLEAN · D5 NOT CLEAN` |

The ten original `reviews/D1.md`…`D5.md` and `coverage/D1.md`…`D5.md` files remain byte-immutable. Their aggregate checksum is `5a5699b3c1dfb14f9ed7c11be37839d324801774a833dc6e3a529963758265e0`, computed from sorted repository-relative `shasum -a 256` lines. Historical R4 originals also remain byte-immutable at checksum `10c68bebb3d90af971e5fc98f7e7d6884a47707266ac95e3a71c3a5067e453a0`.

## Machine-checkable pixel inventory

[`baseline-files.tsv`](./baseline-files.tsv) has exactly one header plus `282` data rows. Each row records repository-relative path, current SHA-256, actual PNG width/height, exact viewport, case ID, state, flow IDs, locale, frozen status, and provenance.

The TSV itself has SHA-256 `59c2855ca53b66186a02b94978b15811d5ddedc1aaf73178816db032b7fca576` on this exact candidate.

Required census:

- `47` rows at each of the six exact viewports;
- `47` canonical mobile rows, `47` canonical desktop rows, `188` responsive rows;
- `282` unique paths and `282` unique `case_id + viewport` pairs;
- every dimension equals the declared viewport;
- every path is git-tracked and every row hash matches current bytes;
- state/case/flow/locale metadata matches `B_VISUAL_CASES`;
- `6` changed `PLACE-DETAIL`, `6` changed `AFTER19-VENUE-LOCKED`, and `6` new `CITY-FILTERED-MAP` frames are `R5-FIX`;
- remaining `264` rows are byte-identical to the reviewed R5 baseline and marked `R5-CARRY`.

## Scope and integrity checks

| Check | Prepared result |
|---|---|
| Product source after Product boundary | `0 files changed` in `app/`, `features/`, and `lib/` from `30dcb136…ee19adb` |
| Harness-only tail | registry, test helper, issue regression, six new filtered-map PNGs, and six focus baseline refreshes only |
| R4 review/coverage originals | `10/10 byte-immutable`; aggregate `10c68bebb3d90af971e5fc98f7e7d6884a47707266ac95e3a71c3a5067e453a0` |
| R5 review/coverage originals | `10/10 byte-immutable`; aggregate `5a5699b3c1dfb14f9ed7c11be37839d324801774a833dc6e3a529963758265e0` |
| Known original formatting | `coverage/D2.md` and `reviews/D2.md` retain their sealed extra EOF blank line; the pre-existing diff-check warning is not rewritten |
| Pre-baseline static preflight | supporting `PASS` at `95005151…`; superseded by the exact-`ee19adb…` final receipt below |
| Local evidence links | `58/58 resolved · 0 missing` across the 16 prepared aggregate/living/pixel-evidence files |
| Stale-current tuple scan | `PASS` · current lifecycle uses retry `30dcb136… / ee19adb… / f1ec9b0c…`; older tuples appear only as explicit history |
| Full nonpixel gate | `PASS` · exact `ee19adb…` · first run · workers 1 · retries 0 |
| Full uninterrupted visual gate | `PASS` · exact `ee19adb…` · first run · no update · workers 1 · retries 0 · `282/282` |

## Exact visual gate receipt — PASS

| Check | Result |
|---|---|
| Production build in visual lane | `28/28 PASS` |
| Full pixel matrix | first run, no update, workers 1, retries 0: `282/282 PASS`; each frozen width `47/47` |
| High-risk repetition | `12 cases × 6 widths × repeat 3 = 216/216 PASS` |
| Short-height landscape regression | `2/2 PASS` |
| Visual assertions | pixel/runtime/geometry/Axe/modal failures `0` |
| Map paint receipts | full matrix `63/63`; high-risk `117/117`; failures `0` |
| Route/runtime | `/ondo-b 200 · /ondo 200`; server errors `0` |
| Post-run integrity | digest unchanged at `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91`; tracked visual-run tree clean |

## Exact nonpixel gate receipt — PASS

| Check | Result |
|---|---|
| Frozen install | `PASS` |
| Discovery | `B 504 tests / 31 files · A 22 tests / 3 files` |
| TypeScript | `PASS` |
| Webpack production build | `28/28 routes PASS` |
| Contracts | `26/26 PASS · 0 fail/skip/error · 0.895802s` |
| B E2E | first run, workers 1, retries/reruns 0: `420 PASS + 84 intentional project/viewport skips = 504 · 0 fail/flaky/error · 1017.321965s` |
| A regression | first run, workers 1, retries/reruns 0: `22/22 PASS · 0 skip/fail/flaky/error · 52.347262s` |
| Routes and runtime | `/ondo-b 200 · /ondo 200`; post-ready server errors `0` |
| Post-run integrity | tracked nonpixel-run tree clean; product-source diff after Product boundary `0` |

Machine evidence is rooted at `/private/tmp/ondo-r5-nonpixel-ee19adb-evidence`. B JSON/JUnit SHA-256 are `63f79488f43c7c67002121bdfb5e08691808cfb587c1ffd78ada2a69873263d9` / `ead3380534f383c5671964c6aa5f219e2238107f4ac3f817d92a84dd97503adc`; A JSON/JUnit are `01a007bf2d895399efad6d88adebd225d436e4034b6e06b7ba32c996920ad55f` / `2cbdffbc4c7270320824cc34e5568d032f0a27ffb646a1b62aa4ee065713dd62`; contract JSON/JUnit are `680dc056383f65775151a04b100d39813a73347b1b7e879c50f216856cb1eedd` / `c97ceb9600046db4f2dc821e5c5e12d544e0ac7436293c30d03befb2e6151e73`.

The exact visual and nonpixel lanes both passed without product, harness, or baseline drift. Aggregate lifecycle is `FULL AUTOMATED GATE PASS`; R5 retry is `READY TO START`; historical R5 remains NOT CLEAN and clean streak remains `0/2`.

## Fix and release state

- Historical R5: `5/5 COMPLETE · NOT CLEAN · objective S2 3`.
- Retry candidate: `3/3 FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING`.
- Automated lifecycle: `FULL AUTOMATED GATE PASS`.
- Next review: `R5 RETRY READY TO START`.
- Clean streak: `0/2`.
- Deployment: `NOT DEPLOYED`.

No automated or issue-scoped result may rewrite R5 as CLEAN. After both full exact-tuple gates pass, five fresh blind reviewers must inspect this exact Product/Harness/digest tuple. Any product, harness, or baseline change invalidates their evidence and restarts the clean streak at `0/2`.
