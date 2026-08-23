# SLEEK-R5-RETRY · successor candidate frozen receipt

Receipt status: `CANDIDATE BOUNDARY + INVENTORY FROZEN · FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`

This seals the exact current-tuple full automated PASS. It does not claim any blind-review CLEAN credit or deployment.

## 1. Frozen boundaries

| Boundary | SHA / value |
|---|---|
| Frozen candidate / Harness | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Last product commit | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Latest test boundary | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Route | `/ondo-b` |
| Canonical snapshot digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |
| Candidate TSV | `baseline-files.tsv` · SHA-256 `cab328685cf24bfb12167f081794377fc01edd83c48f19409bb737b90bd3092f` |
| Registry | `18 flows · 126 checkpoints · 123 ACTUAL · 3 reasoned N/A · 0 GAP` |
| Visual matrix | `50 cases · 48 states · 6 exact viewports · 300 PNG` |
| Static discovery | B `648 tests / 39 files`; A regression `22 tests / 3 files`; contracts `27 tests / 4 files` |

Product boundary means the last commit at or before the frozen candidate that changes `k-tour-id-app/features/ondo/**` product source. Product remains `5b519e6…`; Harness/frozen candidate is the later test-only `b68fc18…`. The static discovery census and exact execution PASS are recorded separately below.

## 2. Reproduction commands

From `k-tour-id-app`:

```bash
find tests/visual -path '*ondo-b-flow-pixels*spec.ts-snapshots/*.png' -type f -print0 \
  | sort -z | xargs -0 shasum -a 256 | shasum -a 256

awk -F '\t' 'NR > 1 && NF { rows++; viewport[$5]++; cases[$6]=1; states[$7]=1; locale[$9]++ }
  END { print rows, length(cases), length(states); for (v in viewport) print v, viewport[v]; for (l in locale) print l, locale[l] }' \
  ../docs/ondo-baljajwi/evidence/SLEEK-R5-RETRY/baseline-files.tsv
```

The first command produces `1dcfacb7…`. The TSV census produces 300 data rows, 50 cases, 48 states, 50 rows at each exact viewport, `198 en` and `102 ko` rows.

## 3. Candidate pixel inventory

| Exact viewport | PNG rows |
|---|---:|
| `360×800` | 50 |
| `390×844` | 50 |
| `430×932` | 50 |
| `768×1024` | 50 |
| `801×1000` | 50 |
| `1440×1000` | 50 |
| **Total** | **300** |

Directory split: `mobile 50 · desktop 50 · responsive 200`. Case locale split per viewport: `33 EN · 17 KO`. Distinct-state count is 48 because `NATION` and `CITY-LIVE` each have EN and KO cases.

Candidate provenance:

| Provenance | Rows | Meaning |
|---|---:|---|
| `R5R-CARRY` | 141 | byte-identical to the `f1ec9b0c…` reviewed-retry baseline |
| `R5R-FIX` | 135 | existing path recaptured after product closure |
| `R5R-FIX+HARNESS` | 6 | Place Peek recaptured after product closure and the history-aware direct-entry/map-ready setup migration |
| `R5R-NEW` | 18 | three new closure states × six exact widths |

All 300 candidate PNGs are Git-tracked at this boundary. The prepared TSV has 300 unique paths and 300 unique `case_id + viewport` pairs; every recorded per-file SHA-256 and PNG IHDR dimension matches the working tree. The separately sealed Playwright no-update receipt below validates all `300/300`.

## 4. Registry disposition

`FL-014/ERROR` and `FL-014/RETRY` are now ACTUAL because the product exposes an expired-proof reason status and a `Check 19+ again` recovery action. The only remaining reasoned N/A cells are:

- `FL-007/RETRY`: validation returns to a usable guest map; there is no separate retry screen.
- `FL-008/RETRY`: guest map is the recovery and onboarding does not begin CX.
- `FL-009/RETRY`: guest map is the recovery and onboarding does not begin Residence verification.

Thus the exact disposition is `123 ACTUAL · 3 N/A · 0 GAP`.

## 5. Helper migration guardrail

`a9b3193…` makes the Place Peek visual setup enter through the same canonical history-aware path as the product and wait for a ready map. `dbb2248…` permits explicit snapshot-update mode to replace an obsolete painted baseline without first satisfying a heat-pixel assertion against that obsolete image. It does **not** relax ordinary no-update execution: once updated, paint receipt, geometry, runtime, modal, state-neutral, and snapshot equality checks all remain required. The baseline refresh at `c1180d6…` and tablet correction at `16a28a7…` are candidate generation, not approval.

The post-baseline correction series does not change the 300 PNG bytes: `c09168e…` aligns focus-return assertions with the already canonical nested history; `985667b…`/`bb67f31…` isolate the offline status from control hitboxes; and Product `8f8e29c…` through `18883f6…` with harness `06d035a…`, `6e95cfe…`, and `377693b…` keep B-owned Back/Forward traversal client-local while genuinely offline. The product/harness boundary therefore advances while the canonical digest remains `1dcfacb7…`; the exact no-update run is sealed GREEN below.

The later `8d332a3…`/`d0ce19f…`/`759cdcc…`/`225e1ec…` series closes FL-011's mounted-detail setup and makes My saved-place return use the canonical B city→peek history, including privacy, exact focus, Back/Forward, reload, untrusted-ID, and A-preservation coverage. `7f57ec7…` then captured a delayed Gate trigger-focus race and Product `5b519e6…` invalidated that pending focus on traversal. These functional changes also leave the 300 PNG bytes unchanged.

Harness `b68fc18…` is test-only: the identity-focus test now waits up to a bounded 20 seconds for the successful Age Gate overlay to close and for the exact terminal session state before checking returned focus. Product source, visual cases, PNG bytes, and discovery counts do not change.

## 6. Immutable historical originals

| Set | Aggregate checksum |
|---|---|
| SLEEK-R4 reviewer/coverage originals | `10c68bebb3d90af971e5fc98f7e7d6884a47707266ac95e3a71c3a5067e453a0` |
| SLEEK-R5 reviewer/coverage originals | `5a5699b3c1dfb14f9ed7c11be37839d324801774a833dc6e3a529963758265e0` |
| SLEEK-R5-RETRY reviewer/coverage originals | `7e6f990a00d08f84bca0aae8679c33568af3fd7d5a81621b5cb8f48ec04ae8c0` |

The checksum input is sorted repository-relative `shasum -a 256` lines. No original review or coverage file is modified.

## 7. Exact current-tuple nonpixel GREEN

Evidence directory: `/private/tmp/ondo-r5r-final-nonpixel-b68fc18.urTcWx/evidence`.
`SHA256SUMS` SHA-256: `5e516c51a6c20277e4420b1afa946505ddcab7f70af44c36c23e38ac09b82743`

| Gate | Exact result |
|---|---|
| Frozen preflight | exact HEAD `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032`; frozen install PASS; initial and final gate worktree clean |
| Static/build | typecheck PASS · Webpack production build `28/28` PASS · contracts `27/27` PASS |
| Discovery | B `648 tests / 39 files` · A regression `22 tests / 3 files` · contracts `27 tests / 4 files` |
| B browser | `648 = 525 pass + 123 intentional viewport skips`; unexpected `0`; flaky `0`; retry `0`; workers `1`; duration `24.4m` |
| A regression | `22/22 PASS`; unexpected `0`; flaky `0`; retry `0`; workers `1`; duration `1.1m` |
| Route health | `/` `200` · `/ondo` `200` · `/ondo-b` `200` |
| Runtime/shutdown | server-error scan `0`; production server stopped; port listeners `0`; automation processes `0`; gate worktree clean |

This seals the exact nonpixel half.

## 8. Exact current-tuple visual GREEN

Evidence directory: `/private/tmp/ondo-r5r-final-visual-retry-b68fc18.aak1NG/evidence`.
`MANIFEST.sha256` SHA-256: `56fc0682aa2d2f8ec49a076a442165241caf9c090c6323efe598f0fa2ae49793` · `151/151` entries validated

| Gate | Exact result |
|---|---|
| Preflight/registry | frozen install PASS · typecheck PASS · build `28/28` · registry `3/3` · no source edits, commits, or snapshot updates |
| Full no-update pixel | mobile `50/50` · desktop/responsive `250/250` · total `300/300` |
| High-risk repeat3 | mobile `24/24` · desktop/responsive `120/120` · total `144/144` |
| Safeguards | landscape `2/2` · onboarding backdrop `9/9` |
| Reporter invariants | failures `0` · skips `0` · interrupted `0` · retry > 0 `0` · multi-result tests `0` |
| Health/postflight | `163/163` numeric health samples HTTP `200` · server/health processes stopped · launchd jobs removed · port free · worktree clean |
| Baseline identity | `300` tracked PNG · `50` at each exact viewport · digest `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |

The initial diagnostic RED (`8` connection-refused results before the pixel matcher) remains preserved and classified as infrastructure contamination. The recovered diagnostic and every acceptance run are separately labeled; no rerun hides the original evidence.

## 9. Automated release state

The first full nonpixel run on the earlier predecessor exposed the deterministic delayed Gate focus race; a later prior run was scheduling-contaminated when Age Gate completion exceeded the harness's default wait. The visual diagnostic also preserves its initial connection-refused infrastructure RED. None counts as acceptance. Current exact nonpixel and visual receipts above are independently sealed GREEN on `b68fc18…` without product, harness, or PNG mutation during the gates.

Full automated gate is PASS and the strict-blind round is READY. No blind-review CLEAN credit has been assigned, so the candidate remains:

`FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`.
