# SLEEK-R5R-FINAL-cb4fcd3 · automated gates

Status: `FINAL AUTOMATED GATES SEALED GREEN · BLIND REVIEW READY · CLEAN 0/2 · NOT DEPLOYED`

## Frozen boundary

| Item | Exact value |
|---|---|
| Evidence boundary | `docs-only freeze commit (exact SHA assigned after commit)` |
| Product boundary | `cb4fcd3585cfb8a0693913d3e300881208f8ecad` |
| Harness / frozen candidate | `cb4fcd3585cfb8a0693913d3e300881208f8ecad` |
| Candidate tree | `9fa3f6d9d40d248fd01f9041efb2b71d146f7d01` |
| Baseline digest | `86ac0588985647163bf8028eee4804d3adbeda1f248206406bd765d5ca19ce00` |

## Admitted pre-gate facts · not acceptance credit

| Check | Exact result |
|---|---|
| Static discovery | B `726 tests / 42 files` · A regression `22 tests / 3 files` · contracts `38 tests / 5 files` |
| Registry shape | `18 flows · 126 checkpoints · 123 ACTUAL · 3 reasoned N/A · 0 GAP` |
| Visual shape | `50 cases · 48 states · 6 exact viewports · 300 tracked PNG` |
| Ledger integrity | `300/300` paths, SHA-256 values, PNG IHDR dimensions, viewport counts, tuple multiplicity, and tracked-file membership validated; all provenance rows are `FINAL-cb4fcd3`; TSV SHA-256 `6fafb55a0fc9b95a1ac3b88cf773a09323331d6111d743d064487085621c52ea` |
| Pixel migration | exactly six `B-PX-FEEDBACK-KO` baselines refreshed at the six registered widths; `294` c05 rows byte-identical; repeat captures byte-identical; KO/EN timestamp semantic guard `2/2` |

These facts do not substitute for the exact workers-1 nonpixel and uninterrupted no-update visual acceptance runs.

## Disqualified predecessor · no acceptance credit

The first-only full B run on exact predecessor `be645fb070be8f4c514bd0a2dc96774d238ceffc / 7c7b39d0986a4a501a23f62a8f80fde16f35fc16 / 86ac0588985647163bf8028eee4804d3adbeda1f248206406bd765d5ca19ce00` finished `586 passed / 135 skipped / 1 failed`. The deterministic failure was the `844×390` EN map/list reflow assertion: `Signal pending` intersected `ondo-b-preference-summary` by `670.734375px²`. A regression was `22/22`; the candidate remained disqualified. Failure-artifact manifest SHA-256: `091e4e190c75b85109ba8c401f5bc1daaf4f72153c633afe089304f78cdf9348`.

Current `cb4fcd3…` corrects that product collision and adds the explicit KO/EN multi-viewport rail-integrity test. Its local 300/300 no-update validation changed zero PNG, but predecessor results and local correction checks cannot be promoted into final acceptance for this new exact boundary.

## Nonpixel gate · SEALED GREEN

The authoritative nonpixel receipt is sealed on exact Product/Harness `cb4fcd3585cfb8a0693913d3e300881208f8ecad` and tree `9fa3f6d9d40d248fd01f9041efb2b71d146f7d01`.

| Check | Sealed result |
|---|---|
| Preflight | frozen install, typecheck, Webpack `28/28`, contracts `38/38`, static discovery, and initial health all PASS |
| Discovery | B `726 tests / 42 files` · A `22 tests / 3 files` · contracts `38 tests / 5 files` |
| Full B first-only | `589 passed / 137 intentional project skips / 0 failed = 726`; duration `1,423,743.359ms`; unexpected/flaky/retry/multi-result/interrupted `0` |
| B reporters | JSON SHA-256 `3b4fe8bf320fda2b3f528cc8f2f9c690dec2369df66f08ecdf82fb6ce42ab06e` · JUnit SHA-256 `e22b0ad98a1cffbf28beae860fd3380e0e3cc3a41002d49aeafa9463a3e4e069` |
| A regression first-only | `22/22 PASS`; anomaly counts `0` |
| A reporters | JSON SHA-256 `04688550b64e98a0f3404abae9e63b617a68deabd611dee980f43389261215f7` · JUnit SHA-256 `b2fc81398b962a51d2267f64b9abf458db03835dacdc153954deab9dd44beb17` |
| Health and smoke | initial `12/12 HTTP 200` · post `12/12 HTTP 200` · route smoke `3/3 HTTP 200` · runtime errors `0` |
| Postflight | server stopped; port free; residual processes `0`; exact tree clean |
| Evidence integrity | SHA256SUMS file SHA-256 `11933327bcc1047f67168b2c0f3c237b6d09d2b0606de2c0ad43436c979cebeb` · summary SHA-256 `b6db442d079b2db2597ae2bc57eb9bac2540d54e7253ac43717dacba60e61596` · teardown SHA-256 `e0acdc39ab748e46a56db120a60b5ba2c61416b2551947950cb7693258d437e1` |

After Playwright had closed both B reporters with PASS, the outer zsh wrapper attempted to assign its result to readonly variable `status` and exited `1`. The Playwright `.last-run`, JSON, and JUnit artifacts remain internally consistent and GREEN; the B suite was not rerun because the accepted command is first-only. This post-reporter wrapper anomaly is disclosed separately at SHA-256 `a4ca4aade5087a7becdf4e69f8f15e09a054a76b8e6bc8c1efcebf1303021f2e` and does not downgrade the test gate.

## Visual gate · SEALED GREEN

The authoritative visual receipt is sealed on exact Product/Harness `cb4fcd3585cfb8a0693913d3e300881208f8ecad`, tree `9fa3f6d9d40d248fd01f9041efb2b71d146f7d01`, and digest `86ac0588985647163bf8028eee4804d3adbeda1f248206406bd765d5ca19ce00`.

| Check | Sealed result |
|---|---|
| Preflight | frozen install, typecheck, Webpack `28/28`, registry `5/5`, dimensions, and canonical digest all PASS |
| Full no-update | `300/300 PASS` · snapshot updates `0` |
| High-risk repeat | `144/144 PASS` |
| Safeguards | `20/20 PASS` |
| Reporter aggregate | `464/464 PASS` · failures/retries/anomalies `0` |
| Route health | `3510/3510 HTTP 200` |
| Postflight | registry `5/5`; server stopped; port free; exact tree clean |
| Ledger | `300` rows with `FINAL-cb4fcd3` provenance · SHA-256 `6fafb55a0fc9b95a1ac3b88cf773a09323331d6111d743d064487085621c52ea` |
| Summary | SHA-256 `559b3fe12bbf2e9422bbe8f0d35342fd84b9a8dcea47cf64a64926e96aa9f363` |
| Evidence manifest | `48` files verified · SHA-256 `c9378cdfac905aecebbe9fb66b779be4a89dd5c0b9c015ee39cf2ae529087ef0` |

This component is GREEN.

## Gate conclusion

Both exact-boundary components are sealed GREEN. Fresh strict-blind review is READY; this automated result contributes no clean-round credit by itself:

`FINAL AUTOMATED GATES SEALED GREEN · BLIND REVIEW READY · CLEAN 0/2 · NOT DEPLOYED`.
