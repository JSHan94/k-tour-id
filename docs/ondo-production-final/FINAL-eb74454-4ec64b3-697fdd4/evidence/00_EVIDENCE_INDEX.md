# ONDO B production-final evidence index

Status: EXACT SOURCE RECEIPTS COPIED · HASHES REVALIDATED

| Evidence component | Receipt | State |
|---|---|---|
| Visual | [Visual receipt](./01_VISUAL_RECEIPT.md) | PASS |
| Nonpixel | [Nonpixel receipt](./02_NONPIXEL_RECEIPT.md) | PASS |
| Acceptance limits | [Acceptance boundary](./03_ACCEPTANCE_BOUNDARY.md) | SEALED |
| Local verifier | [`verify-evidence.mjs`](./verify-evidence.mjs) | PASS WHEN RUN FOR THIS TREE |

## Durable files

- `visual/inspection/manifest.tsv`: header plus 124 data rows; exact copied
  source bytes; SHA-256 `20f67da63ec79f6030197271b9b41e5a5b57f082b4bb08076225f53ec9764924`.
- `visual/inspection/ledger.json`: final tuple, census, and visual receipts;
  SHA-256 `46af2d867a3cb01e8e3c099868fe9b3849d2c8f6c7a43bafcb9d83024ff62b88`.
- `visual/no-update/results.json`: Playwright JSON reporter with 124 expected and
  zero skipped, unexpected, or flaky.
- `nonpixel/00-MANIFEST.json`: authoritative PASS receipt; SHA-256
  `d6d307f91f2184db007af6d501f6fc7bb34b739cb875d138e6e4518af2037fe6`.
- `nonpixel/SHA256SUMS`: 32-entry source checksum ledger; SHA-256
  `71d02218d47c0f04e8483fa460729ebaa38b7b3afda9ad6174e8542052697e4b`.

The verifier checks every TSV digest, byte count, and PNG IHDR dimension against
the 124 committed production baselines, verifies reporter/ledger identities and
counts, and verifies every copied nonpixel file against the preserved source
checksum ledger. The documentary namespace contains no PNG.

Return to the [final manifest](../03_RELEASE_MANIFEST.md).
