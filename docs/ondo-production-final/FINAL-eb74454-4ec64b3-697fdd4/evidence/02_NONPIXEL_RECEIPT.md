# ONDO B production-final nonpixel receipt

Status: AUTHORITATIVE PASS · EXACT PRODUCT `4ec64b3`

## Identity and integrity

| Field | Exact value |
|---|---|
| Product | `4ec64b3de02fdd8f5298a38dde0c84f47eaa3dc6` |
| Product tree | `0ccf400f61d264e5084862510cee140e3d9786d1` |
| Equivalent source commit/tree | `a6d92d93525dcb093c19876f3794686df48a9876` / `0ccf400f61d264e5084862510cee140e3d9786d1` |
| Sealed time | `2026-08-24T11:56:22.633Z` |
| [Authoritative manifest](./nonpixel/00-MANIFEST.json) SHA-256 | `d6d307f91f2184db007af6d501f6fc7bb34b739cb875d138e6e4518af2037fe6` |
| [Source checksum ledger](./nonpixel/SHA256SUMS) SHA-256 | `71d02218d47c0f04e8483fa460729ebaa38b7b3afda9ad6174e8542052697e4b` |

All 32 entries in the preserved source checksum ledger match the adjacent
copied evidence files byte-for-byte. The ledger retains its original absolute
capture paths so the sealed file itself is unchanged; verification resolves
each entry by basename inside this namespace.

## Gate result

| Gate | Authoritative result |
|---|---|
| Frozen install | 1 attempt; pass |
| Typecheck | 1 attempt; pass |
| Optimized webpack build | 1 attempt; pass; 30 routes |
| Contracts | 65 selected/passed; 0 skipped; 0 failed |
| Production B | 86 selected; 75 passed; 11 skipped; 0 failed; workers 1; retries 0; red-matrix violations 0 |
| Protected A | 22 selected/passed; 0 skipped; 0 failed; workers 1; retries 0 |
| Browser smoke | Playwright fallback because browser plugin was unavailable; `/`, `/ondo`, `/ondo-b` all 200; 0 page errors |
| Standalone | build and scan pass; root 307; page 200; 26 blocked routes 404; 7 assets 200 |
| Standalone census | 29 files; 7,133,962 bytes; 14 JS; 4 CSS; 1 image |
| Teardown | owned processes stopped; ports free; worktree clean |

The browser fallback is recorded explicitly and is not described as an in-app
browser-plugin run. The production-B 11 skips remain skips.

## Classified anomalies

- The health monitor began before Next was ready and recorded three connection
  refusals. All 225 samples after readiness returned HTTP 200, with zero
  failures after first success.
- Seven raw substrings are classified as toolchain/infrastructure fragments:
  two `persona` occurrences inside `impersonate`, one `chat` occurrence inside
  `chatgpt.site`, and four case-insensitive `deMo` occurrences inside
  `__toESM`. Exact product-token and CSS/legacy-selector matches are both zero.
- Wrangler created four ignored cache files after the sealed 29-file census;
  the original 29 artifact files remain present and separately hashed.
- Vinext emitted a non-failing chunk-size advisory.

The receipt records that no deploy, Site creation, push, user-root mutation, or
product-test rerun was performed.
