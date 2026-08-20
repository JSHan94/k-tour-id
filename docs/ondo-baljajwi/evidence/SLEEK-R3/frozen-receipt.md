# SLEEK-R3 closure-candidate frozen receipt

Status: **PRODUCT/HARNESS/BASELINE FROZEN · FULL AUTOMATED GATE PASS · R4 READY TO START · CLEAN 0/2 · NOT DEPLOYED**

This receipt distinguishes the immutable SLEEK-R3 reviewed tuple from the successor tuple containing its fixes. The historical R3 verdict remains NOT CLEAN.

## Exact successor tuple

| Field | Value |
|---|---|
| Product boundary | `05f3002899485c528e31730bfebd57d71c3d788d` |
| Harness boundary / exact repository HEAD | `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` |
| Pixel baseline commit | `6ecad99a7bc428da060c922e1208a5f13d2effe2` |
| Baseline digest | `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d` |
| Route | `/ondo-b` |
| Flow registry | `18 flows · 126 checkpoints · 121 ACTUAL · 5 reasoned N/A · 0 GAP` |
| Visual registry | `46 cases · 44 distinct state IDs` |
| Viewports | `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` |
| PNG inventory | `276 = 46 per viewport` |

Digest working directory is `k-tour-id-app/`. The exact command is:

```bash
find tests/visual -path '*ondo-b-flow-pixels*spec.ts-snapshots/*.png' -type f -print0 \
  | sort -z \
  | xargs -0 shasum -a 256 \
  | shasum -a 256
```

The digest covers the sorted `sha256 path` lines for all and only the three B flow-pixel snapshot families. Any file byte or path change invalidates this receipt.

## Machine-checkable pixel inventory

[`baseline-files.tsv`](./baseline-files.tsv) has exactly one header plus `276` data rows. Each row records repository-relative path, file SHA-256, actual PNG width/height, exact viewport, case ID, state, flow IDs, locale, frozen status, and approval reason.

Required census:

- `46` rows at each of the six exact viewports;
- `46` canonical mobile rows, `46` canonical desktop rows, `184` responsive rows;
- `276` unique `case_id + viewport` pairs;
- all dimensions equal the declared viewport;
- all paths are git-tracked and all row hashes match current file bytes;
- state/case/flow/locale metadata matches `B_VISUAL_CASES`.

## Automated gate receipt

| Gate | Exact result |
|---|---|
| Discovery | `348 tests in 25 files` |
| TypeScript | `PASS` |
| Webpack production build | `PASS · 28/28 routes` |
| Contracts | `26/26 PASS` |
| B E2E | `323 pass · 25 intentional viewport-ownership skips · 0 fail` |
| Unexpected/flaky/error/stderr | `0` |
| Runtime/server errors | `0`; `/ondo-b` HTTP `200` |
| Pixel execution | fresh production server `http://127.0.0.1:3174`; `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3174 pnpm test:visual:b`; exit `0`; server stopped after receipt |
| Pixel baseline | `276/276 PASS · uninterrupted workers-1 · no update · no rerun · 46/46 each viewport` |
| High-risk visual repeat | `72/72 PASS` — PLACE-DETAIL, TABLES-VENUE-EMPTY, CHECKOUT-RECEIPT, CHECKOUT-STAMP across the six viewport families |
| Post-run integrity | digest unchanged at `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d`; git clean; visual diff empty |

Non-pixel gate source files: `/tmp/ondo-2d7e0f0-final-results.json` and `/tmp/ondo-2d7e0f0-final-junit.xml`. They are transient runner outputs, not substitutes for this durable receipt.

## Review and deployment state

- Historical R3: `5/5 COMPLETE · NOT CLEAN · 11 actionable`.
- Current successor: `11/11 FIXED · REVIEWER CLOSURE PENDING`.
- Next round: `R4 READY TO START`.
- Clean streak: `0/2`.
- Deployment: `NOT DEPLOYED`.

No targeted test, historical D2 CLEAN, or successful automated gate can be promoted into a five-role R4 verdict. Two fresh consecutive 5/5 clean rounds on this exact tuple are still required.
