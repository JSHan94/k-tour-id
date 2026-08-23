# D2 Interaction & IA coverage — CLEAN round 1

## Coverage status

**COMPLETE · CLEAN**

| Boundary field | Value |
|---|---|
| Evidence SHA | `875ebf49f89c5842b56dc49e89b127a426fa8490` |
| Product | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Harness | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Server | `http://127.0.0.1:3219/ondo-b` · HTTP 200 |
| Snapshot digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` · unchanged |
| Context | In-app Browser unavailable after required selection/troubleshooting; allowed fresh-context Playwright/Chromium fallback against 3219. No context, local/session storage, history, trace, or screenshot session was reused between branches. |
| Blindness | Strict allowlist observed; no forbidden review/product/history/private-deployment material consulted. |

## Canonical disposition matrix

Legend: `A` = live/manual ACTUAL; `N/A` = specification-defined reasoned N/A; `GAP` = not covered.

| Flow | ENTRY | DECISION | CANCEL | ERROR | RETRY | TERMINAL | RETURN | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| FL-001 | A | A | A | A | A | A | A | 7/7 |
| FL-002 | A | A | A | A | A | A | A | 7/7 |
| FL-003 | A | A | A | A | A | A | A | 7/7 |
| FL-004 | A | A | A | A | A | A | A | 7/7 |
| FL-005 | A | A | A | A | A | A | A | 7/7 |
| FL-006 | A | A | A | A | A | A | A | 7/7 |
| FL-007 | A | A | A | A | N/A | A | A | 7/7 |
| FL-008 | A | A | A | A | N/A | A | A | 7/7 |
| FL-009 | A | A | A | A | N/A | A | A | 7/7 |
| FL-010 | A | A | A | A | A | A | A | 7/7 |
| FL-011 | A | A | A | A | A | A | A | 7/7 |
| FL-012 | A | A | A | A | A | A | A | 7/7 |
| FL-013 | A | A | A | A | A | A | A | 7/7 |
| FL-014 | A | A | A | A | A | A | A | 7/7 |
| FL-015 | A | A | A | A | A | A | A | 7/7 |
| FL-016 | A | A | A | A | A | A | A | 7/7 |
| FL-017 | A | A | A | A | A | A | A | 7/7 |
| FL-018 | A | A | A | A | A | A | A | 7/7 |
| **Total** | **18 A** | **18 A** | **18 A** | **18 A** | **15 A + 3 N/A** | **18 A** | **18 A** | **126/126** |

The three N/A cells are FL-007, FL-008, and FL-009 RETRY. Their canonical onboarding failure behavior applies defaults/fallback and continues to the Guest map; there is intentionally no retry decision state. They are reasoned N/A, not gaps.

Disposition totals: **123 ACTUAL + 3 reasoned N/A + 0 GAP = 126/126**.

## Live interaction coverage

| Area | Covered behavior |
|---|---|
| Entry/navigation | Fresh launch, onboarding, nation/city/list/peek/detail, gate entry, direct venue entry, Labs and My Korea entry. |
| Decision/cancel | Explicit close/cancel, Escape, report/leave/reset confirmation, bridge cancel, gated-action cancellation, draft preservation. |
| Error/retry | Map tile error, Account, Save, Age, Person/CX, Residence unsupported, Table join/image, Checkout, Local Signal, profile, trait/evidence, Payment KYC, wallet/bridge. |
| Terminal/return | Exact venue/draft/checkout resumption, Saved/My Korea, feedback, receipts, visit milestone, profile disclosure, simulated bridge terminal state. |
| History/direct/reload | Back/Forward list↔peek↔detail, direct-entry URL, public reload context, local persistence, same-session After19 manual-off and bridge terminal persistence. |
| Focus/modal | Initial focus, Tab/Shift+Tab containment, inert background, Escape semantics, close-trigger focus restoration after transition settle for dialogs, sheets, gates, alerts, onboarding. |
| Concurrency | Rapid/double activation across account, join, payment, visit proof, signal, Payment KYC, and bridge; no duplicate terminal side effect observed. |
| Reachability | Required controls checked for visibility, keyboard focus, hit reachability, obstruction, responsive sheet/dialog containment, and correct disabled/pending behavior. |
| Origin invariants | One-shot return tokens cleared after use; cancel clears gate intent while retaining public screen/draft context; independent Person/Age/Payment axes remain independent. |

## Frozen visual registry coverage

Every frozen PNG was hash-verified against `baseline-files.tsv` and individually inspected for interaction/IA consequences.

| Viewport | Rows inspected | EN | KO |
|---|---:|---:|---:|
| `360×800` | 50/50 | 33 | 17 |
| `390×844` | 50/50 | 33 | 17 |
| `430×932` | 50/50 | 33 | 17 |
| `768×1024` | 50/50 | 33 | 17 |
| `801×1000` | 50/50 | 33 | 17 |
| `1440×1000` | 50/50 | 33 | 17 |
| **Total** | **300/300** | **198** | **102** |

Visual totals:

- exact visual cases: **50/50**;
- distinct states: **48/48**;
- PNG files: **300/300**;
- widths: **6/6**;
- locales: **KO + EN**.

The 50 cases inspected were: `B-PX-AFTER19-EXPIRED-REASON-EN`, `B-PX-AFTER19-PROMPT-EN`, `B-PX-AFTER19-VENUE-LOCKED-EN`, `B-PX-AFTER19-VENUE-RETURN-EN`, `B-PX-CHAT-EN`, `B-PX-CHAT-IMAGE-FAIL-EN`, `B-PX-CHECKOUT-CANCEL-KO`, `B-PX-CHECKOUT-FAIL-EN`, `B-PX-CHECKOUT-IDLE-EN`, `B-PX-CHECKOUT-RECEIPT-EN`, `B-PX-CHECKOUT-STAMP-KO`, `B-PX-CITY-FALLBACK-KO`, `B-PX-CITY-FILTERED-MAP-EN`, `B-PX-CITY-LIST-EN`, `B-PX-CITY-LIVE-EN`, `B-PX-CITY-LIVE-KO`, `B-PX-DISCOVERY-RESET-CONFIRM-EN`, `B-PX-FEEDBACK-KO`, `B-PX-GATE-ACCOUNT-FAIL-KO`, `B-PX-GATE-AGE-FAIL-KO`, `B-PX-GATE-PAYMENT-EN`, `B-PX-GATE-PAYMENT-FAIL-KO`, `B-PX-GATE-PERSON-CX-KO`, `B-PX-GATE-PERSON-PASSPORT-EN`, `B-PX-GATE-RESIDENCE-UNSUPPORTED-EN`, `B-PX-LABS-BRIDGE-FAIL-EN`, `B-PX-LABS-BRIDGE-SUCCESS-EN`, `B-PX-LABS-EN`, `B-PX-LABS-TRAIT-FAIL-KO`, `B-PX-LOCAL-SIGNAL-EMPTY-EN`, `B-PX-LOCAL-SIGNAL-FAIL-KO`, `B-PX-LOCAL-SIGNAL-SUCCESS-EN`, `B-PX-MY-EN`, `B-PX-NATION-EN`, `B-PX-NATION-KO`, `B-PX-ONBOARDING-PERSONAS-KO`, `B-PX-ONBOARDING-PREFERENCES-EN`, `B-PX-ONBOARDING-VALUE-EN`, `B-PX-PLACE-DETAIL-EN`, `B-PX-PLACE-PEEK-EN`, `B-PX-PROFILE-KO`, `B-PX-REPORT-EN`, `B-PX-SAVE-FAILURE-EN`, `B-PX-SAVE-RECOVERED-KO`, `B-PX-SESSION-RESET-CONFIRM-KO`, `B-PX-TABLE-DETAIL-KO`, `B-PX-TABLE-JOIN-FAIL-EN`, `B-PX-TABLES-LIST-EN`, `B-PX-TABLES-VENUE-EMPTY-EN`, and `B-PX-TRUST-FOUR-AXES-EN`.

The 48 distinct states inspected were: `AFTER19-EXPIRED-REASON`, `AFTER19-PROMPT`, `AFTER19-VENUE-LOCKED`, `AFTER19-VENUE-RETURN`, `CHAT`, `CHAT-IMAGE-FAIL`, `CHECKOUT-CANCEL`, `CHECKOUT-FAIL`, `CHECKOUT-IDLE`, `CHECKOUT-RECEIPT`, `CHECKOUT-STAMP`, `CITY-FALLBACK`, `CITY-FILTERED-MAP`, `CITY-LIST`, `CITY-LIVE`, `DISCOVERY-RESET-CONFIRM`, `FEEDBACK`, `GATE-ACCOUNT-FAIL`, `GATE-AGE-FAIL`, `GATE-PAYMENT`, `GATE-PAYMENT-FAIL`, `GATE-PERSON-CX`, `GATE-PERSON-PASSPORT`, `GATE-PERSON-RESIDENCE-UNSUPPORTED`, `LABS`, `LABS-BRIDGE-FAIL`, `LABS-BRIDGE-SUCCESS`, `LABS-TRAIT-FAIL`, `LOCAL-SIGNAL-EMPTY`, `LOCAL-SIGNAL-FAIL`, `LOCAL-SIGNAL-SUCCESS`, `MY`, `NATION`, `ONBOARDING-PERSONAS`, `ONBOARDING-PREFERENCES`, `ONBOARDING-VALUE`, `PLACE-DETAIL`, `PLACE-PEEK`, `PROFILE`, `REPORT`, `SAVE-FAILURE`, `SAVE-RECOVERED`, `SESSION-RESET-CONFIRM`, `TABLE-DETAIL`, `TABLE-JOIN-FAIL`, `TABLES-LIST`, `TABLES-VENUE-EMPTY`, and `TRUST-FOUR-AXES`.

## Findings and completion

| Measure | Count/status |
|---|---:|
| Raw S0 | 0 |
| Raw S1 | 0 |
| Raw S2 | 0 |
| Raw S3 | 0 |
| Gaps | 0 |
| Coverage state | COMPLETE |
| D2 verdict | CLEAN |

