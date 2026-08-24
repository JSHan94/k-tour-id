# ONDO B production-final visual receipt

Status: PASS · 124/124 NO-UPDATE · ZERO PNG PATH CHANGES

## Bound identities

| Field | Exact value |
|---|---|
| Product | `4ec64b3de02fdd8f5298a38dde0c84f47eaa3dc6` |
| Product tree | `0ccf400f61d264e5084862510cee140e3d9786d1` |
| Visual Harness | `697fdd4dc4af13e35b68c78bbcbd127b306a4291` |
| Visual Harness tree | `7b9944afe0e0608e766bb5ce5162bfab9e6ddb0e` |
| Central Harness+PNG | `eb74454b527445f52322eff0af48e6b703681e16` |
| Central Harness+PNG tree | `47f1a618fa725aad20d84b52b0e8786e2c273989` |
| Snapshot namespace | `k-tour-id-app/tests/visual/ondo-b-production-snapshots` |

## Result

The final no-update command recorded by the ledger is
`pnpm exec playwright test --config=playwright.production-visual.config.ts --workers=1 --retries=0`.
Its copied reporters show 124 expected, zero skipped, zero unexpected, zero
flaky, and zero top-level errors. The ledger records `finalNoUpdate` as
`124 passed (4.2m), workers=1, retries=0` and `pngDiff` as `0 changed paths`.

The 124 PNG census is 120 core plus 4 structural images across 24 case IDs, 74
English and 50 Korean images, 104 desktop-project and 20 mobile-project images.
The ledger records 10,955,911 total bytes.

## Integrity

| File or listing | SHA-256 |
|---|---|
| [`manifest.tsv`](./visual/inspection/manifest.tsv) | `20f67da63ec79f6030197271b9b41e5a5b57f082b4bb08076225f53ec9764924` |
| [`manifest.sha256`](./visual/inspection/manifest.sha256) | `9c51fc396e716fdb1c0433f47f7cfd672e2b2169239dc189d129fb22474e768a` |
| [`ledger.json`](./visual/inspection/ledger.json) | `46af2d867a3cb01e8e3c099868fe9b3849d2c8f6c7a43bafcb9d83024ff62b88` |
| [`build-manifest.mts`](./visual/inspection/build-manifest.mts) | `3e0ffacf07bfc1418b26d9088e1e3f1b84d02b7bd01dc2bb1f4d470eb6847aa4` |
| [`results.json`](./visual/no-update/results.json) | `e98d3d76c776111116ea2b589fc46df27beb93e2cac3c6e918669ff3ae76cee0` |
| [`junit.xml`](./visual/no-update/junit.xml) | `4ba1821331e514a8f9e5b887cf1cba72bfb9522eb759050b3dd8d00fb8794faf` |
| [`.last-run.json`](./visual/no-update/.last-run.json) | `91d1c43004802cd49950d78eb11c8fa7d05da8ffffe219a8b13b2f561bc00903` |
| PNG tree listing, recorded in ledger | `64cf6dc604c0bd79d38d1957ae23808870d174b305f32e40368d213fee0fa21e` |

The TSV was copied byte-for-byte from the final visual inspection output. Local
revalidation confirms one header and 124 unique data rows, a one-to-one path
match with the central snapshot tree, and matching SHA-256, file size, and PNG
IHDR dimensions for every row. No spreadsheet formulas are present or needed;
all cells are literal receipt values.

No PNG was authored, copied, updated, or removed by evidence finalization. This
receipt grants automated visual PASS only; it does not claim a separate human
reviewer CLEAN label, release, or deployment.
