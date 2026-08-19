# ONDO B Five-role Review Manifest

상태: `R1/R2 NOT CLEAN`

| Field | Value |
|---|---|
| Fixed product SHA | `70b5b7b130de0fa3102bbcc6239f334c1226e8fb` |
| Route | `/ondo-b` |
| QA contract | real UI; no synthetic adapter |
| Known product gaps | `FL-001 ERROR/RETRY`, `FL-002 RETURN`, `FL-011 ERROR/RETRY` |
| Clean streak | `0` |

## Round ledger

| Round | UX/IA | Visual | Data/Content | Traveler | Business/PO | Automated | Gap count | Clean |
|---|---|---|---|---|---|---|---:|---|
| R1 | `SUBMITTED, TRIAGE PENDING` | `SUBMITTED, TRIAGE PENDING` | `SUBMITTED, TRIAGE PENDING` | `SUBMITTED, TRIAGE PENDING` | `SUBMITTED, TRIAGE PENDING` | `NOT RUN ON THIS QA COMMIT` | 5 | `NO` |
| R2 | `SUBMITTED, TRIAGE PENDING` | `SUBMITTED, TRIAGE PENDING` | `SUBMITTED, TRIAGE PENDING` | `SUBMITTED, TRIAGE PENDING` | `SUBMITTED, TRIAGE PENDING` | `NOT RUN ON THIS QA COMMIT` | 5 | `NO` |

## Blind evidence IDs

R1: `B-REV-R1-UX-001`, `B-REV-R1-VISUAL-001`, `B-REV-R1-CONTENT-001`, `B-REV-R1-TRAVELER-001`, `B-REV-R1-PO-001`.

R2: `B-REV-R2-UX-001`, `B-REV-R2-VISUAL-001`, `B-REV-R2-CONTENT-001`, `B-REV-R2-TRAVELER-001`, `B-REV-R2-PO-001`.

이 파일은 독립 리뷰 제출이 있었다는 사실만 기록한다. triage/closure evidence가 없으므로 clean을 주장하지 않는다.

## Issue schema

| Issue ID | Round | Role | REQ/FL/checkpoint | SHA | Steps | Observed/expected | Severity | Actionable | Owner | Status | Fix SHA | Closure evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `B-ISS-TEMPLATE-001` | — | — | — | — | — | — | — | — | — | `TEMPLATE` | — | — |

`CLOSED`에는 fix SHA와 같은 SHA의 automated + reviewer closure evidence가 모두 필요하다.
