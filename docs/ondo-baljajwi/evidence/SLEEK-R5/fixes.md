# SLEEK R5 fix ledger

상태: `3/3 FIXED AND AUTOMATED · 0/3 REVIEWER-CLOSED · FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN 0/2 · NOT DEPLOYED`

| Issue | Product commit(s) | Primary regression / baseline commit(s) | Candidate state |
|---|---|---|---|
| `R5-001` focus semantic | `a429958974361154c4d6ca97fba0df60de32c87e` | `b5f6c0e73758a578ce9f8f7b00157f298e9b2188`, final baseline `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` | `FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |
| `R5-002` short landscape Nation | `d30b2d7a78a32623c3b321551eb2c5d990b1080c`, `6e8a5e61740d79977fa9ae9704401b4356b84597` | `c565b0f94280b4e1ba5426b6c424467c1b525f38`, `b56acee148054000da2377575e5c1de3c99b2cf8` | `FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |
| `R5-003` filtered map synchronization | `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` | `9500515197c2f9a77845ed2b9cb4e3d742a8b8cb` | `FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |

## Exact candidate boundary

| Field | Value |
|---|---|
| R5 reviewed tuple | Evidence candidate `39687c33ca5d14b60304b762b373e719bb4bdbbd` · Product `9ec3d192d0ebdc9614d980bdb173633aee16fc17` · Harness `12354bcf71621c00a08433faf09cbb000683ae61` · digest `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` |
| Retry Product boundary | `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` |
| Retry Harness / exact HEAD | `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` |
| Retry baseline digest | `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91` |
| Retry inventory | `282 = 47 per viewport · 18 R5-FIX + 264 R5-CARRY` |

Six `PLACE-DETAIL` and six `AFTER19-VENUE-LOCKED` baselines changed only for the accepted focus-token correction. Six new `CITY-FILTERED-MAP` baselines cover the previously absent filtered List→Map/close-return state. The short-height landscape correction is exercised through dedicated `844×390` regression coverage rather than by inventing a seventh frozen pixel viewport.

There is no product-source delta after Product boundary `30dcb136…`: `30dcb136…ee19adb` contains only registry, test helper, E2E harness, six new filtered-map PNGs, and six additional focus baseline refreshes. Exact per-file hashes and prior-byte relationships are in [`baseline-files.tsv`](./baseline-files.tsv).

## Remaining closure sequence

1. `완료` — all three product fixes and issue-scoped regressions are integrated.
2. `완료` — affected pixel baselines are case-scoped; inventory is `282`, not a blanket update.
3. `완료` — exact-HEAD pixel `282/282`, high-risk `216/216`, landscape `2/2`, nonpixel B `420+84/504`, and A `22/22` passed.
4. `완료` — both final receipts are sealed; R5 retry is `READY TO START`.
5. `대기` — execute five fresh blind reviewers; any new actionable finding restarts the fix loop and keeps streak at `0/2`.

Issue-scoped or automated PASS does not create reviewer clean credit. Current lifecycle is `FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN 0/2 · NOT DEPLOYED`.
