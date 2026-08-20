# SLEEK-R3 fix and hardening ledger

Status: **11/11 IMPLEMENTED AND AUTOMATED · REVIEWER CLOSURE PENDING · R4 READY TO START · CLEAN 0/2 · NOT DEPLOYED**

## Finding-to-commit mapping

| Finding | Product fix SHA | Regression/harness SHA | Automated acceptance |
|---|---|---|---|
| `D1-R3-001` | `ce1ca567c6c2be7c68e59e48d989b196f1b00ab5` | `a7fef7a87c071289d88fe0dbdf0403dbf90d1e2c` | short desktop map-key/rail geometry, KO/EN |
| `D3-R3-001` | `ef1752191df5b2261af3d7d788b663635a4d3efa` | `be426cec5b52020368672176ce3352570b8ac7e0` | Table and Local Signal alert/status, recovery focus, retry/success/duplicate |
| `D3-R3-002` | `ef1752191df5b2261af3d7d788b663635a4d3efa` | `be426cec5b52020368672176ce3352570b8ac7e0` | Labs signer failure announcement and Try again focus |
| `D4-R3-001` | `9a0c6c8399f1baffa532329bdccb428a6f403ceb` | `004a7cf6ce2c62e9d7733a2545465213b3446dcf` | simulated-visit copy and four-axis truth checks |
| `D4-R3-002` | `9a0c6c8399f1baffa532329bdccb428a6f403ceb` | `004a7cf6ce2c62e9d7733a2545465213b3446dcf` | KO identity taxonomy across nav/gates/content |
| `D4-R3-003` | `9a0c6c8399f1baffa532329bdccb428a6f403ceb` | `004a7cf6ce2c62e9d7733a2545465213b3446dcf` | explicit dietary subchoices, persistence, return |
| `D4-R3-004` | `9a0c6c8399f1baffa532329bdccb428a6f403ceb` | `004a7cf6ce2c62e9d7733a2545465213b3446dcf` | separated label/provenance and unique KO/EN toggle names |
| `D4-R3-005` | `ef1752191df5b2261af3d7d788b663635a4d3efa` | `be426cec5b52020368672176ce3352570b8ac7e0` | local-preview failure wording and unchanged-state recovery |
| `D5-R3-001` | `3806c4756edd49d2291fd8762f668ee00d35149b` | `b48e98bcb56b89833385b0ab1cc0b8b1005f642b` | normal Residence route unsupported, passport alternate, draft/venue preservation |
| `D5-R3-002` | `56e44a90935268ed9e07364bbea952f5e525fcce` | `bb8afce0bba0868fbe84afe47f6fb2feab414a47` | bounded pizza/chicken/coffee/Korean-dish aliases in both cities; facts unchanged |
| `D5-R3-003` | `e296ce4bf3c3ec8044483a0ca2a0fd9682653c94` | `6aabac31645ba9246f02fa518dcffca635fa1b18` | reference-safe modal cleanup, exact deep journey, six-width zero-Table state |

## Post-R3 hardening and evidence commits

These commits are separate from the 11 original findings. They close issues found while integrating/stress-testing the fixes and strengthen the final harness; they do not rewrite the R3 issue census.

| Slice | Product SHA | Harness SHA | Purpose |
|---|---|---|---|
| Checkout transition focus | `ac795e4d126ca37671cc08ea46ac31e6444879c5` | `c8fcd6b55fd6feaa2f90db04531fa77d7fb575a0` | deterministic focus ownership through checkout failure, retry, receipt, and stamp transitions |
| Pixel approval | — | `6ecad99a7bc428da060c922e1208a5f13d2effe2` | issue-scoped integrated R3 baselines plus the registered venue-empty state |
| Omitted browser suite discovery | — | `c9a2a1426cb6b66d480a4e6543445dc870979274` | make prior R2 and R3 browser coverage discoverable by the final B command |
| Shared Sheet focus handoff | `05f3002899485c528e31730bfebd57d71c3d788d` | `8c5e961b14a229c2ba6731facaf7cca394fd25fa` | prevent an older closing surface from stealing focus from a newer surface |
| Venue detail loading harness | — | `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` | hold the loading state until the dedicated assertion observes it |

Product boundary is therefore `05f3002899485c528e31730bfebd57d71c3d788d`; harness boundary and exact candidate HEAD are `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4`.

## Gate of record

- Test discovery: `348 tests in 25 files`.
- Typecheck: PASS.
- Webpack production build: `28/28` PASS.
- Contracts: `26/26` PASS.
- B E2E: `323 pass · 25 intentional viewport skips · 0 fail`.
- Unexpected/flaky/error/stderr/runtime: `0`.
- Pixel inventory: `46 cases · 44 states · 276 committed PNGs`; uninterrupted workers-1 no-update `276/276 PASS`, `46/46` each viewport, high-risk repeat `72/72 PASS`, pixel/runtime/geometry/Axe/modal errors `0`.

The fixes are implementation-complete but reviewer closure remains pending. Only a fresh five-role R4 review and then a second same-tuple clean confirmation can move the clean streak from `0/2`.
