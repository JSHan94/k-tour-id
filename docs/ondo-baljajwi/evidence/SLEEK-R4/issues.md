# SLEEK R4 issue ledger

상태: `12 UNIQUE FINDINGS · 10 OBJECTIVE S2 + 2 ACCEPTED S3 POLISH · FIX IN PROGRESS`

| ID | Severity | Dimension | Source | Consolidated finding | Status |
|---|---|---|---|---|---|
| `R4-001` | `S2` | Responsive visual | D1-001 | `1440×800`/`1512×801` desktop rail intersects Nation lead copy and City preference control. | `OPEN · FIX ASSIGNED` |
| `R4-002` | `S3` | Visual affordance | D1-002 | Desktop venue rows have no perceptible hover affordance or pointer cue. | `ACCEPTED POLISH · FIX ASSIGNED` |
| `R4-003` | `S2` | Focus / IA | D2-001 + D3-004 | Onboarding, Account, CX, Residence→passport, manual 19+, and venue-zero Browse-all transitions can leave focus on `BODY`. | `OPEN · FIX ASSIGNED` |
| `R4-004` | `S2` | Focus / keyboard | D2-002 + D3-002 | Place peek has no deterministic open focus, Escape dismissal, or Close/Escape focus restoration. | `OPEN · FIX ASSIGNED` |
| `R4-005` | `S2` | Input safety | D2-003 | Compact-mobile feedback double click can submit, reflow, and activate unrelated Leave Table confirmation. | `OPEN · FIX ASSIGNED` |
| `R4-006` | `S2` | Localization / a11y | D3-001 | KO ONDO UI can coexist with `html[lang=en]`. | `OPEN · FIX ASSIGNED` |
| `R4-007` | `S2` | Modal semantics | D3-003 | Nested Identity gate leaves two raw `aria-modal=true` owners even when the parent is covered. | `OPEN · FIX ASSIGNED` |
| `R4-008` | `S2` | Localization / a11y | D4-001 | KO map, app canvas, and edge Sheet accessible names remain English. | `OPEN · FIX ASSIGNED` |
| `R4-009` | `S2` | Truth | D4-002 | Session/browser-local Profile preview is worded as actual public publication. | `OPEN · FIX ASSIGNED` |
| `R4-010` | `S2` | Truth | D4-003 | Fixed local Table-full fixture invents a live last-seat/request race. | `OPEN · FIX ASSIGNED` |
| `R4-011` | `S3` | Truth polish | D4-004 | Pre-existing tenth-stamp result omits simulated/local-preview qualification. | `ACCEPTED POLISH · FIX ASSIGNED` |
| `R4-012` | `S2` | Provenance / localization | D4-005 | Generated Latin navigation transliterations can be read as official sourced names. | `OPEN · FIX ASSIGNED` |

## Closure contract

각 항목은 최소 product commit과 issue-scoped regression evidence를 가져야 한다. 동일 source file을 여러 slice가 수정하면 root가 integration에서 semantic merge하고 두 회귀군을 모두 재실행한다. Targeted PASS만으로 `CLOSED` 처리하지 않는다. 통합 successor tuple의 typecheck, production build, contracts, full B E2E, full six-viewport no-update pixel gate가 모두 통과하고 fresh reviewer가 실제 화면에서 closure를 확인할 때 `CLOSED`로 승격한다.
