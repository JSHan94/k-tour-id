# SLEEK-R5R-FINAL-c05a2d0 · strict-blind candidate receipt

Status: `FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`

This directory is the minimal frozen candidate input for the next strict-blind round. The exact nonpixel and visual gates are both GREEN in [`automated-gates.md`](./automated-gates.md); this pack is ready for blind reviewer distribution. Automated PASS does not grant clean credit.

## Frozen boundary

| Item | Exact value |
|---|---|
| Product boundary | `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` |
| Harness / frozen candidate | `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` |
| Candidate tree | `57d45444832ffe9cf6268a2a232761b44b8214b6` |
| Route | `/ondo-b` |
| Canonical snapshot digest | `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` |
| Baseline ledger | `baseline-files.tsv` · SHA-256 `0abd5b887e445f79a2b84748d0deb058774006149dbbd0a3de353c62a1f92f60` |
| Visual registry | `50 cases · 48 states · 6 exact viewports · 300 PNG` |
| Flow registry | `18 flows · 126 checkpoints · 123 ACTUAL · 3 reasoned N/A · 0 GAP` |
| Locale rows | `198 en · 102 ko` |
| Static discovery | B `690 tests / 40 files` · A regression `22 tests / 3 files` · contracts `27 tests / 4 files` |
| Automated gate | `FULL PASS` |
| Blind review | `CLEAN ROUND READY` |
| Clean streak | `0/2` |
| Deployment | `NOT DEPLOYED` |

Each exact viewport (`360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`) has `50` ledger rows. All `300` rows are marked `FROZEN`; automated acceptance is separately sealed in `automated-gates.md`, and reviewer clean credit remains `0/2`.

The previous b68 candidate and its failed CLEAN1 remain immutable history. They contribute no clean credit to this tuple.

## Minimal pack

- [`frozen-receipt.md`](./frozen-receipt.md)
- [`automated-gates.md`](./automated-gates.md)
- [`baseline-files.tsv`](./baseline-files.tsv)
- [`SHA256SUMS`](./SHA256SUMS)

The later documentary commit containing this pack must not advance the Product or Harness boundary above. Blind-clean credit remains `0/2`.
