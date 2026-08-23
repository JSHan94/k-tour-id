# SLEEK-R5R-FINAL-c05a2d0 · automated gates

Status: `FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`

## Frozen boundary

| Item | Exact value |
|---|---|
| Product boundary | `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` |
| Harness / frozen candidate | `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` |
| Candidate tree | `57d45444832ffe9cf6268a2a232761b44b8214b6` |
| Baseline digest | `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` |

## Admitted pre-gate facts · not acceptance credit

| Check | Exact result |
|---|---|
| Static discovery | B `690 tests / 40 files` · A regression `22 tests / 3 files` · contracts `27 tests / 4 files` |
| Registry shape | `18 flows · 126 checkpoints · 123 ACTUAL · 3 reasoned N/A · 0 GAP` |
| Visual shape | `50 cases · 48 states · 6 exact viewports · 300 tracked PNG` |
| Ledger integrity | `300/300` paths, SHA-256 values, PNG IHDR dimensions, viewport counts, and tracked-file membership validated |
| Candidate audit | typecheck PASS · static registry `5/5` PASS · source/harness patch boundaries coherent |

These facts did not substitute for the exact workers-1 nonpixel and uninterrupted no-update visual acceptance runs; both exact runs are recorded below.

## Nonpixel gate · GREEN

Evidence: `/private/tmp/ondo-final-nonpixel-c05a2d0.nXGZMt/evidence`.
`SHA256SUMS` SHA-256: `8fc4d2122eef95bb1aa25ceb79b03d217de3146452ebbff97684efd447e09e12`.

| Check | Exact result |
|---|---|
| Frozen boundary | candidate `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` · tree `57d45444832ffe9cf6268a2a232761b44b8214b6` · Product `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` |
| Preflight | frozen install PASS · typecheck PASS · Webpack production build `28/28` · contracts `27/27` |
| Discovery | B `690 tests / 40 files` · A regression `22 tests / 3 files` · contracts `27 tests / 4 files` |
| B browser · first and only run | workers `1` · retries `0` · `690 = 555 PASS + 135 intentional SKIP` · failure `0` · flaky `0` · retry attempts `0` · summed duration `1,390,586 ms` |
| B durable reporters | `b-results.json` SHA-256 `3374f7b5dc886389439d4d4cf0e26bb1e9ae232388e718f4417528201bc55beb` · `b-junit.xml` SHA-256 `156948d738537e67c0e53d378135d99ea33e978d1aee08430913b0421f3854a9` |
| A regression | initial package-script run `22/22 PASS`, workers `1`, retries `0`, failure `0`; its argument separator prevented reporter creation |
| A evidence-only replay | identical tests/server, workers `1`, retries `0`: `22/22 PASS`, no retry, summed duration `55,772 ms` |
| A durable reporters | `a-results.json` SHA-256 `267b8492508d491bb81da368160f8185fe4c017ade55a971e06022d3e73d7fad` · `a-junit.xml` SHA-256 `7c244cd9f4c4b9f43d7244d7fba115aba6c861fbc6e742ec47656bc3ae7b7e31` |
| Route health | `/`, `/ondo`, `/ondo-b` HTTP `200` |
| Postflight | server output after startup `0` · source worktree clean · server stopped · port closed · no visual suite or snapshot update |

The A replay was evidence-only and is reported separately rather than represented as the first run. Both executions passed all `22` tests; the replay exists solely to create durable JSON/JUnit artifacts after the package-script separator suppressed them.

## Visual gate · GREEN

Evidence: `/private/tmp/ondo-final-visual-c05a2d0.KYmkw9/evidence`.
`MANIFEST.sha256` SHA-256: `6172b3381ffe1ef55ed4a2e35ea5083abd05f2e7aef0acc880f4556dc06e0aad`; all `33/33` manifest entries verified across `35` evidence files.

The in-app Browser was unavailable after required troubleshooting, so the exact repository Playwright fallback was used without changing the frozen tuple.

| Check | Exact result |
|---|---|
| Frozen boundary | candidate `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` · tree `57d45444832ffe9cf6268a2a232761b44b8214b6` · Product `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` · digest `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` |
| Preflight | frozen install PASS · typecheck PASS · Webpack production build `28/28` · static registry `3/3` · `/`, `/ondo`, `/ondo-b` HTTP `200` |
| Full no-update · first and only run | mobile `50/50` in `2.2m` · desktop/responsive `250/250` in `9.0m` · aggregate `300/300` · workers `1` · retries `0` · snapshot updates `0` · failure/skip/interrupted/multi-result `0` |
| High-risk repeat3 | mobile `24/24` · desktop/responsive at five widths `120/120` · aggregate `144/144` · workers `1` · retries `0` |
| Safeguards | inclusive/667 geometry/onboarding Escape/focus/inert/Gate semantics/EN-KO labels/no ellipsis/44px/overlap `9/9` · short landscape/nation `2/2` · onboarding backdrop/landscape `9/9` · aggregate `20/20` |
| Seven-run aggregate | `464/464 PASS` · failed/skipped/interrupted/retry_gt0/multi-result/reporter errors `0` |
| Snapshot ledger | actual PNG `300` = tracked PNG `300` · six exact dimensions `50` each · path/SHA/IHDR/dimension mismatches `0` · digest exact |
| Route health | `254/254` samples HTTP `200`; final `/`, `/ondo`, `/ondo-b` HTTP `200` |
| Runtime and postflight | startup lines `4` · server error scans `0` · process IDs stopped · port `3317` free · worktree clean · HEAD unchanged |

## Gate conclusion

Both exact-boundary automated gates are sealed GREEN. The frozen pack is ready for the next strict-blind clean round; automated PASS grants no reviewer clean credit by itself:

`FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`.
