# ONDO B Five-review Manifest

상태: `NOT STARTED`

## 1. Candidate

| Field | Value |
|---|---|
| Baseline A docs SHA | `fba3ea593fb0b63cc9f0b759f31e152d68d392e9` |
| Baseline A code SHA | `9678b2b` |
| B product SHA | `PENDING` |
| A URL | `PENDING_CONFIRMATION` |
| B preview URL | `PENDING_DEPLOYMENT` |
| Route seam | `PENDING` |
| Clean streak | `0` |

## 2. Round status

| Round | Product SHA | UX | Visual | Data/Content | Traveler | Business/PO | Automated Gate | New actionable | Unresolved | Clean |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R1 | `PENDING` | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | `NOT RUN` | — | — | `NO` |
| R2 | `PENDING` | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | `NOT RUN` | — | — | `NO` |
| R3 | `IF REQUIRED` | — | — | — | — | — | — | — | — | `NO` |

두 clean round 사이에 B product SHA가 다르면 streak는 `0`이다.

## 3. Blind assignment

| Round | Role | Evidence ID | Variant order | Scenario pack | Reviewer | 제출 상태 |
|---|---|---|---|---|---|---|
| R1 | UX/IA | `B-REV-R1-UX-001` | `B→A` | `FL-001`, `FL-003`, `FL-010`, `FL-017` | `UNASSIGNED` | `NOT STARTED` |
| R1 | Visual | `B-REV-R1-VISUAL-001` | `A→B` | `FL-001`, `FL-007`, `FL-014`, `FL-015` | `UNASSIGNED` | `NOT STARTED` |
| R1 | Data/Content | `B-REV-R1-CONTENT-001` | `B→A` | `FL-002`, `FL-005`, `FL-006`, `FL-016`, `FL-018` | `UNASSIGNED` | `NOT STARTED` |
| R1 | Traveler | `B-REV-R1-TRAVELER-001` | `A→B` | `FL-001`, `FL-002`, `FL-011`, `FL-012` | `UNASSIGNED` | `NOT STARTED` |
| R1 | Business/PO | `B-REV-R1-PO-001` | `B→A` | `FL-001`, `FL-003`, `FL-004`, `FL-013`, `FL-018` | `UNASSIGNED` | `NOT STARTED` |
| R2 | UX/IA | `B-REV-R2-UX-001` | `A→B` | R1과 다른 failure/return pack | `UNASSIGNED` | `NOT STARTED` |
| R2 | Visual | `B-REV-R2-VISUAL-001` | `B→A` | R1과 다른 surface/state pack | `UNASSIGNED` | `NOT STARTED` |
| R2 | Data/Content | `B-REV-R2-CONTENT-001` | `A→B` | R1과 다른 KO/EN/stale pack | `UNASSIGNED` | `NOT STARTED` |
| R2 | Traveler | `B-REV-R2-TRAVELER-001` | `B→A` | R1과 다른 persona/recovery pack | `UNASSIGNED` | `NOT STARTED` |
| R2 | Business/PO | `B-REV-R2-PO-001` | `A→B` | R1과 다른 Foundation/Labs pack | `UNASSIGNED` | `NOT STARTED` |

## 4. Issue ledger

| Issue ID | Round | Reporter | REQ | FL | Checkpoint | Viewport/lang | Severity | Evidence | Actionable rule | Owner | Status | Fix SHA | Closure evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `B-ISS-TEMPLATE-001` | — | — | — | — | — | — | — | — | — | — | `TEMPLATE` | — | — |

허용 status는 `OPEN`, `IN_PROGRESS`, `NEEDS_DECISION`, `FIXED_PENDING_REVIEW`, `CLOSED`, `DUPLICATE`, `DEFERRED_NON_ACTIONABLE`이다. `CLOSED`는 fix SHA와 closure evidence가 모두 있어야 한다.

## 5. Clean audit

| Check | R1 | R2 |
|---|---|---|
| Same B product SHA | `NO` | `NO` |
| 19/19 REQ evidence | `NOT RUN` | `NOT RUN` |
| 18/18 Flow evidence | `NOT RUN` | `NOT RUN` |
| Browser 126/126 | `NOT RUN` | `NOT RUN` |
| Pixel 72/72 | `NOT RUN` | `NOT RUN` |
| Content 36/36 | `NOT RUN` | `NOT RUN` |
| A11y 18/18 | `NOT RUN` | `NOT RUN` |
| Runtime/dead CTA clean | `NOT RUN` | `NOT RUN` |
| Five blind submissions | `0/5` | `0/5` |
| Unresolved actionable | `UNKNOWN` | `UNKNOWN` |
| Clean verdict | `NO` | `NO` |

## 6. Promotion decision

`BLOCKED · ROUTE SEAM, IMPLEMENTATION, TWO CLEAN ROUNDS REQUIRED`
