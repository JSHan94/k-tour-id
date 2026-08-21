# SLEEK R4 issue ledger

상태: `12 UNIQUE FINDINGS · 10 OBJECTIVE S2 + 2 ACCEPTED S3 POLISH · 12/12 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · REVIEWER CLOSURE PENDING · R5 READY TO START · CLEAN 0/2 · NOT DEPLOYED`

| ID | Severity | Dimension | Source | Consolidated finding | Status |
|---|---|---|---|---|---|
| `R4-001` | `S2` | Responsive visual | D1-001 | `1440×800`/`1512×801` desktop rail intersects Nation lead copy and City preference control. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-002` | `S3` | Visual affordance | D1-002 | Desktop venue rows have no perceptible hover affordance or pointer cue. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-003` | `S2` | Focus / IA | D2-001 + D3-004 | Onboarding, Account, CX, Residence→passport, manual 19+, and venue-zero Browse-all transitions can leave focus on `BODY`. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-004` | `S2` | Focus / keyboard | D2-002 + D3-002 | Place peek has no deterministic open focus, Escape dismissal, or Close/Escape focus restoration. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-005` | `S2` | Input safety | D2-003 | Compact-mobile feedback double click can submit, reflow, and activate unrelated Leave Table confirmation. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-006` | `S2` | Localization / a11y | D3-001 | KO ONDO UI can coexist with `html[lang=en]`. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-007` | `S2` | Modal semantics | D3-003 | Nested Identity gate leaves two raw `aria-modal=true` owners even when the parent is covered. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-008` | `S2` | Localization / a11y | D4-001 | KO map, app canvas, and edge Sheet accessible names remain English. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-009` | `S2` | Truth | D4-002 | Session/browser-local Profile preview is worded as actual public publication. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-010` | `S2` | Truth | D4-003 | Fixed local Table-full fixture invents a live last-seat/request race. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-011` | `S3` | Truth polish | D4-004 | Pre-existing tenth-stamp result omits simulated/local-preview qualification. | `FIXED · REVIEWER CLOSURE PENDING` |
| `R4-012` | `S2` | Provenance / localization | D4-005 | Generated Latin navigation transliterations can be read as official sourced names. | `FIXED · REVIEWER CLOSURE PENDING` |

## Closure contract

각 항목은 product commit과 issue-scoped regression harness에 연결됐고 frozen successor Product `9ec3d192…`, Harness/HEAD `12354bcf…`, digest `4cfbed3b…`에 포함된다. `FIXED AND AUTOMATED`는 `CLOSED`나 reviewer `CLEAN`을 뜻하지 않는다.

Exact-tuple automated gate는 통과했다. Fresh blind R5 reviewer가 실제 화면에서 각 fingerprint의 부재를 확인할 때만 `CLOSED`로 승격한다. R4 원문 verdict는 영구히 `NOT CLEAN`으로 남고, R5는 `READY TO START`; clean streak는 `0/2`, deployment는 `NOT DEPLOYED`다.
