# SLEEK R5 issue ledger

상태: `3 UNIQUE OBJECTIVE S2 · 3/3 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · REVIEWER CLOSURE PENDING · R5 RETRY READY TO START · CLEAN 0/2 · NOT DEPLOYED`

| ID | Severity | Dimension | Source | Consolidated finding | Status |
|---|---|---|---|---|---|
| `R5-001` | `S2` | Visual / a11y integrity | `R5-D1-001` | Global keyboard focus uses danger red instead of the designated `#1D66D1` focus token and has inconsistent ring geometry across controls. | `FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |
| `R5-002` | `S2` | Responsive usability | `D3-R5-NATION-844x390-CITY-NAV-COLLISION` | At `844×390`, Seoul and Busan choices overlap each other and the bottom navigation; Busan intercepts a normal Seoul click in EN and KO. | `FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |
| `R5-003` | `S2` | Map/list truth and usability | `R5-D5-001` | A one-result search can return to a blank Map with zero rendered signals while retaining an unrelated score legend, breaking filtered result/selection synchronization. | `FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |

## Closure contract

Each issue is linked to product commits and issue-scoped regression coverage in [`fixes.md`](./fixes.md). Candidate Product `30dcb136…`, Harness/HEAD `ee19adb…`, digest `f1ec9b0c…` includes all three implementations and their automated checks. The registry is now `47 cases · 45 states · 282 PNGs`, including a new six-viewport filtered-map case.

`FIXED AND AUTOMATED` is not `CLOSED`, reviewer `CLEAN`, or release acceptance. Exact-tuple full visual and nonpixel receipts passed, so five fresh blind reviewers may retest the new tuple. The original R5 verdict remains permanently `NOT CLEAN`; clean streak remains `0/2`; deployment remains `NOT DEPLOYED`.
