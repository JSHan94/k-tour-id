# D5 Traveler Service coverage — CLEAN round 1

## Review tuple, server, context, and blindness

| Field | Frozen value / review condition |
| --- | --- |
| Evidence SHA | `875ebf49f89c5842b56dc49e89b127a426fa8490` |
| Product SHA | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Harness SHA | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Baseline digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |
| Frozen URL | `http://127.0.0.1:3219/ondo-b` |
| Server check | HTTP 200 at the exact frozen URL |
| Browser context | In-app Browser unavailable after prescribed initialization/troubleshooting; authorized actual-repository Playwright Chromium fallback; fresh isolated BrowserContext/storage for every live case and traveler scenario |
| Blindness | Used only the live `/ondo-b`, four FINAL pack files, `ondo-b-visual-evidence.ts`, `ondo-b-qa.ts`, the three B pixel specs/snapshots, and the named canonical documents. No prior/current reviews, issues/fixes/coverage/manifests/other receipts, peer output, git history, private deployment, product source outside helpers, old session/evidence, or snapshot update was used. |

## Required totals

| Coverage dimension | Result |
| --- | ---: |
| Flows | **18/18** |
| Checkpoints | **126/126 = 123 actual + 3 N/A + 0 gap** |
| Visual cases | **50/50** |
| Distinct states | **48/48** |
| PNGs | **300/300** |
| Widths | **6/6**: 360×800, 390×844, 430×932, 768×1024, 801×1000, 1440×1000 |
| Locale cases | **KO + EN** (`17` KO cases and `33` EN cases; `102` KO PNGs and `198` EN PNGs) |
| Baseline checksum verification | **300/300 match; 0 mismatch** |
| Exact-URL live state sweep | **50/50 pass** |
| Consolidated traveler scenarios | **8/8 pass** |
| Raw findings | **S0=0, S1=0, S2=0, S3=0** |
| Coverage status | **COMPLETE** |

Each width has exactly `50` PNGs. All 300 images were visually inspected, not merely counted or accepted from an automated result.

## Flow/checkpoint ledger

Every flow contains ENTRY, DECISION, CANCEL, ERROR, RETRY, TERMINAL, and RETURN.

| Flow | Traveler contract | Covered | Disposition |
| --- | --- | ---: | --- |
| FL-001 | Guest Discover | 7/7 | 7 actual |
| FL-002 | Age proof to exact After19 venue | 7/7 | 7 actual |
| FL-003 | Table to image chat to feedback | 7/7 | 7 actual |
| FL-004 | Checkout to stamp milestone | 7/7 | 7 actual |
| FL-005 | Korean CX | 7/7 | 7 actual |
| FL-006 | Residence Card | 7/7 | 7 actual |
| FL-007 | Short-term onboarding | 7/7 | 6 actual + RETRY N/A |
| FL-008 | Korean local onboarding | 7/7 | 6 actual + RETRY N/A |
| FL-009 | Resident onboarding | 7/7 | 6 actual + RETRY N/A |
| FL-010 | Account gate | 7/7 | 7 actual |
| FL-011 | Save and My Korea | 7/7 | 7 actual |
| FL-012 | Local signal first mission | 7/7 | 7 actual |
| FL-013 | Manual 19+ proof | 7/7 | 7 actual |
| FL-014 | Auto After19 | 7/7 | 7 actual |
| FL-015 | Optional public profile | 7/7 | 7 actual |
| FL-016 | Evidence and merchant trait | 7/7 | 7 actual |
| FL-017 | Payment KYC | 7/7 | 7 actual |
| FL-018 | Labs wallet and bridge | 7/7 | 7 actual |
| **Total** | **18/18 flows** | **126/126** | **123 actual + 3 N/A + 0 gap** |

The three N/A entries are intentional onboarding RETRY dispositions: the specified failure falls through to a usable guest map and does not define a separate retry screen. They are not missing coverage.

## Visual case and state ledger

All `50/50` visual cases were exercised live at the frozen server in isolated contexts and all corresponding PNGs were inspected at every width. The `48/48` distinct states are:

`ONBOARDING-VALUE`, `ONBOARDING-PERSONAS`, `ONBOARDING-PREFERENCES`, `NATION`, `CITY-LIVE`, `CITY-LIST`, `CITY-FILTERED-MAP`, `CITY-FALLBACK`, `PLACE-PEEK`, `PLACE-DETAIL`, `AFTER19-PROMPT`, `AFTER19-EXPIRED-REASON`, `SAVE-RECOVERED`, `SAVE-FAILURE`, `GATE-ACCOUNT-FAIL`, `GATE-PERSON-PASSPORT`, `GATE-PERSON-CX`, `GATE-PERSON-RESIDENCE-UNSUPPORTED`, `AFTER19-VENUE-LOCKED`, `GATE-AGE-FAIL`, `GATE-PAYMENT`, `GATE-PAYMENT-FAIL`, `AFTER19-VENUE-RETURN`, `TABLES-LIST`, `TABLES-VENUE-EMPTY`, `TABLE-DETAIL`, `TABLE-JOIN-FAIL`, `CHAT`, `CHAT-IMAGE-FAIL`, `FEEDBACK`, `REPORT`, `LOCAL-SIGNAL-EMPTY`, `LOCAL-SIGNAL-FAIL`, `LOCAL-SIGNAL-SUCCESS`, `CHECKOUT-IDLE`, `CHECKOUT-CANCEL`, `CHECKOUT-FAIL`, `CHECKOUT-RECEIPT`, `CHECKOUT-STAMP`, `MY`, `SESSION-RESET-CONFIRM`, `DISCOVERY-RESET-CONFIRM`, `PROFILE`, `TRUST-FOUR-AXES`, `LABS`, `LABS-TRAIT-FAIL`, `LABS-BRIDGE-FAIL`, and `LABS-BRIDGE-SUCCESS`.

`NATION` and `CITY-LIVE` each have both KO and EN cases, producing 50 cases from 48 distinct states. The remaining state cases include the locale selected for their copy-expansion or action-risk surface; the complete pack still covers KO and EN across all traveler-service domains.

## Traveler journey coverage

| Service area | Independent live coverage |
| --- | --- |
| First arrival | Value screen, guest escape, short-term intent/preferences, ONB-COMPLETE guest state |
| Nation and cities | Busan early coverage, All Korea return, Seoul full map/list/search/filter/selection |
| Truth and fallback | MOIS LOCALDATA source, snapshot date/record ID, generated transliteration label, not-confirmed facts, simulated-score boundary, map failure with sourced-list fallback and retry |
| Offline/stale/reload/focus | Real Chromium offline transition; loaded fixed-snapshot list stayed searchable; online + focus + reload recovered a usable Seoul surface |
| Saved/My/history | Account gate cancel and complete, one saved record, reload persistence, My Korea history, exact venue return |
| Tables/chat/signal | Table join failure/retry, joined chat and image failure states, feedback/report states, local note draft preservation and success boundary |
| Account/Person/Age/Payment gates | Cancel, failure, retry, terminal state, exact initiating-task return, and cross-gate independence |
| Checkout | Cancel, declined payment, visible retry, simulated receipt, stamp unchanged at 9 until visit proof, then 10 |
| Trust | Identity/visit/contribution/Table axes remain separate; no single safety-score claim |
| Labs | Opt-in, signer boundary, Sui Testnet simulation, Deferred AMM, wallet/quote/bridge cancel/fail/success states, no asset-movement claim |

## Raw severity accounting and completion

| Severity | Raw count |
| --- | ---: |
| S0 | 0 |
| S1 | 0 |
| S2 | 0 |
| S3 | 0 |

**COMPLETE — CLEAN.** There are no checkpoint gaps, uncovered PNGs/cases/states/widths/locales, or raw S0/S1/S2 blocking findings.
