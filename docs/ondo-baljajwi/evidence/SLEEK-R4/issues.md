# SLEEK R4 issue ledger

상태: `12 UNIQUE FINDINGS · 10 OBJECTIVE S2 + 2 ACCEPTED S3 POLISH · 12/12 IMPLEMENTED · FULL GATE/REVIEW CLOSURE PENDING`

| ID | Severity | Dimension | Source | Consolidated finding | Status |
|---|---|---|---|---|---|
| `R4-001` | `S2` | Responsive visual | D1-001 | `1440×800`/`1512×801` desktop rail intersects Nation lead copy and City preference control. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-002` | `S3` | Visual affordance | D1-002 | Desktop venue rows have no perceptible hover affordance or pointer cue. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-003` | `S2` | Focus / IA | D2-001 + D3-004 | Onboarding, Account, CX, Residence→passport, manual 19+, and venue-zero Browse-all transitions can leave focus on `BODY`. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-004` | `S2` | Focus / keyboard | D2-002 + D3-002 | Place peek has no deterministic open focus, Escape dismissal, or Close/Escape focus restoration. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-005` | `S2` | Input safety | D2-003 | Compact-mobile feedback double click can submit, reflow, and activate unrelated Leave Table confirmation. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-006` | `S2` | Localization / a11y | D3-001 | KO ONDO UI can coexist with `html[lang=en]`. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-007` | `S2` | Modal semantics | D3-003 | Nested Identity gate leaves two raw `aria-modal=true` owners even when the parent is covered. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-008` | `S2` | Localization / a11y | D4-001 | KO map, app canvas, and edge Sheet accessible names remain English. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-009` | `S2` | Truth | D4-002 | Session/browser-local Profile preview is worded as actual public publication. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-010` | `S2` | Truth | D4-003 | Fixed local Table-full fixture invents a live last-seat/request race. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-011` | `S3` | Truth polish | D4-004 | Pre-existing tenth-stamp result omits simulated/local-preview qualification. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |
| `R4-012` | `S2` | Provenance / localization | D4-005 | Generated Latin navigation transliterations can be read as official sourced names. | `IMPLEMENTED · FULL GATE/REVIEW PENDING` |

## Closure contract

각 항목은 product commit과 issue-scoped regression harness에 연결됐다. `IMPLEMENTED`는 `CLOSED`, `CLEAN`, 또는 통합 `PASS`를 뜻하지 않는다. 통합 successor tuple의 typecheck, production build, contracts, full B E2E, full six-viewport no-update pixel gate가 모두 통과하고 fresh reviewer가 실제 화면에서 closure를 확인할 때만 `CLOSED`로 승격한다. 현재 successor Product/Harness/digest는 아직 동결되지 않았다.
