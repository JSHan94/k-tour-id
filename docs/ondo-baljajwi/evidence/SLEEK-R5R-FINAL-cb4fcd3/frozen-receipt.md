# SLEEK-R5R-FINAL-cb4fcd3 · corrected strict-blind candidate receipt

Status: `FINAL AUTOMATED GATES SEALED GREEN · BLIND REVIEW READY · CLEAN 0/2 · NOT DEPLOYED`

This directory is the new minimal frozen-candidate namespace for the corrected release lineage. The Product, Harness, tree, snapshot digest, and 300-row ledger are fixed below. Both exact-boundary nonpixel and visual receipts are sealed GREEN in [`automated-gates.md`](./automated-gates.md); fresh strict-blind review may now begin from this pack.

## Frozen boundary

| Item | Exact value |
|---|---|
| Evidence boundary | `docs-only freeze commit (exact SHA assigned after commit)` |
| Product boundary | `cb4fcd3585cfb8a0693913d3e300881208f8ecad` |
| Harness / frozen candidate | `cb4fcd3585cfb8a0693913d3e300881208f8ecad` |
| Candidate tree | `9fa3f6d9d40d248fd01f9041efb2b71d146f7d01` |
| Route | `/ondo-b` |
| Canonical snapshot digest | `86ac0588985647163bf8028eee4804d3adbeda1f248206406bd765d5ca19ce00` |
| Baseline ledger | `baseline-files.tsv` · SHA-256 `6fafb55a0fc9b95a1ac3b88cf773a09323331d6111d743d064487085621c52ea` |
| Visual registry | `50 cases · 48 states · 6 exact viewports · 300 PNG` |
| Flow registry | `18 flows · 126 checkpoints · 123 ACTUAL · 3 reasoned N/A · 0 GAP` |
| Locale rows | `198 en · 102 ko` |
| Static discovery | B `726 tests / 42 files` · A regression `22 tests / 3 files` · contracts `38 tests / 5 files` |
| Automated gate | `SEALED GREEN` |
| Exact nonpixel component | `SEALED GREEN`; evidence SHA256SUMS file SHA-256 `11933327bcc1047f67168b2c0f3c237b6d09d2b0606de2c0ad43436c979cebeb` |
| Exact visual component | `SEALED GREEN`; manifest SHA-256 `c9378cdfac905aecebbe9fb66b779be4a89dd5c0b9c015ee39cf2ae529087ef0` |
| Blind review | `READY` |
| Clean streak | `0/2` |
| Deployment | `NOT DEPLOYED` |

Each exact viewport (`360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`) has `50` ledger rows. All `300` rows are marked `FROZEN`; the ledger has `294` byte-identical c05 carries and exactly six refreshed `B-PX-FEEDBACK-KO` rows whose only approved visual change is the canonical KO timestamp `8:12 PM` → `오후 8:12`.

## Correction provenance

The immutable c05 round remains Evidence `fcd4447d86ac01daf90ee763963e1ddfa7a7f811`, Product `5c6383e38a150fc20bd6298ef0c2b7c619e671e1`, Harness `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c`, digest `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6`, and `5/5 COMPLETE · NOT CLEAN · raw S0 0 / S1 0 / S2 3 / S3 2 · CLEAN 0/2`.

- D3 corrections enforce the 12px short-landscape metadata floor, live Gate failure announcements, and Labs Escape focus return.
- D4 corrections localize the KO chat timestamp and align the canonical persistence contract on the v3 envelope.
- Follow-up safety audits reject malformed or unregistered return contexts, incoherent progress, and omitted required gates; CTA/context-derived complete gate plans must be satisfied before the deferred mutation applies.
- The six-PNG atomic Harness commit changes no Product source. Repeated captures were byte-identical per viewport and the timestamp semantic guard passed in KO and EN.
- Exact candidate `be645fb070be8f4c514bd0a2dc96774d238ceffc / 7c7b39d0986a4a501a23f62a8f80fde16f35fc16 / 86ac0588985647163bf8028eee4804d3adbeda1f248206406bd765d5ca19ce00` was disqualified after its first-only full B run reproduced a real `844×390` EN collision between `Signal pending` and `ondo-b-preference-summary`: B `586 passed / 135 skipped / 1 failed`, while A was `22/22`. The sealed failure-artifact manifest SHA-256 is `091e4e190c75b85109ba8c401f5bc1daaf4f72153c633afe089304f78cdf9348`; it grants no acceptance credit.
- Current Product/Harness `cb4fcd3585cfb8a0693913d3e300881208f8ecad` reduces the short-landscape filter padding from `7px` to `4px` while preserving `min-width: 44px`, and adds a deterministic KO/EN rail-integrity matrix over four short-landscape plus six canonical viewports. Its local no-update validation changed `0` PNG; both exact final gates subsequently reran and sealed GREEN on this successor boundary.

The b68 and c05 FINAL packs and their failed CLEAN1 namespaces remain immutable history. They contribute no clean credit to this tuple.

## Minimal pack

- [`frozen-receipt.md`](./frozen-receipt.md)
- [`automated-gates.md`](./automated-gates.md)
- [`baseline-files.tsv`](./baseline-files.tsv)
- [`SHA256SUMS`](./SHA256SUMS) — pack-file checksums created after both exact gate receipts sealed GREEN

The documentary freeze commit must not advance the Product or Harness boundary above. Fresh blind-review distribution is now READY, but clean credit remains `0/2` and deployment remains blocked until two consecutive independent `5/5 CLEAN` rounds complete on this exact tuple.
