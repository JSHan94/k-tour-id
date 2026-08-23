# D1 · Visual Art Director · CLEAN1 coverage

## Frozen boundary and result

Evidence `fcd4447d86ac01daf90ee763963e1ddfa7a7f811` · Product `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` · Harness `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` · digest `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6`.

`COMPLETE · CLEAN · raw S0 0 / S1 0 / S2 0 / S3 0`

## Exact census

| Registry | Required | Audited | Disposition |
|---|---:|---:|---|
| Flows | 18 | 18 | COMPLETE |
| Checkpoints | 126 | 126 | `123 ACTUAL + 3 N/A + 0 GAP` |
| Pixel-linked checkpoints | 109 | 109 | COMPLETE |
| Functional-only checkpoints | 17 | 17 | `14 ACTUAL + 3 N/A` |
| Visual cases | 50 | 50 | COMPLETE |
| Distinct states | 48 | 48 | COMPLETE |
| PNG frames | 300 | 300 | SHA/IHDR/visual inspection COMPLETE |
| English rows | 198 | 198 | COMPLETE |
| Korean rows | 102 | 102 | COMPLETE |

| Viewport | Frames inspected |
|---|---:|
| `360×800` | 50 |
| `390×844` | 50 |
| `430×932` | 50 |
| `768×1024` | 50 |
| `801×1000` | 50 |
| `1440×1000` | 50 |

All `300` ledger rows are `FROZEN`; every file hash and PNG dimension matches its row. The complete frame audit used five ordered ten-case sheets per viewport, so each case was inspected at every width.

## Complete 50-case / 48-state inventory

Each entry below was inspected at all six viewports. `NATION` and `CITY-LIVE` each have EN and KO cases; the remaining 46 cases have unique state IDs, yielding 50 cases / 48 states.

1. `B-PX-ONBOARDING-VALUE-EN`
2. `B-PX-ONBOARDING-PERSONAS-KO`
3. `B-PX-ONBOARDING-PREFERENCES-EN`
4. `B-PX-NATION-EN`
5. `B-PX-NATION-KO`
6. `B-PX-CITY-LIVE-EN`
7. `B-PX-CITY-LIVE-KO`
8. `B-PX-CITY-LIST-EN`
9. `B-PX-CITY-FILTERED-MAP-EN`
10. `B-PX-CITY-FALLBACK-KO`
11. `B-PX-PLACE-PEEK-EN`
12. `B-PX-PLACE-DETAIL-EN`
13. `B-PX-AFTER19-PROMPT-EN`
14. `B-PX-AFTER19-EXPIRED-REASON-EN`
15. `B-PX-SAVE-RECOVERED-KO`
16. `B-PX-SAVE-FAILURE-EN`
17. `B-PX-GATE-ACCOUNT-FAIL-KO`
18. `B-PX-GATE-PERSON-PASSPORT-EN`
19. `B-PX-GATE-PERSON-CX-KO`
20. `B-PX-GATE-RESIDENCE-UNSUPPORTED-EN`
21. `B-PX-AFTER19-VENUE-LOCKED-EN`
22. `B-PX-GATE-AGE-FAIL-KO`
23. `B-PX-GATE-PAYMENT-EN`
24. `B-PX-GATE-PAYMENT-FAIL-KO`
25. `B-PX-AFTER19-VENUE-RETURN-EN`
26. `B-PX-TABLES-LIST-EN`
27. `B-PX-TABLES-VENUE-EMPTY-EN`
28. `B-PX-TABLE-DETAIL-KO`
29. `B-PX-TABLE-JOIN-FAIL-EN`
30. `B-PX-CHAT-EN`
31. `B-PX-CHAT-IMAGE-FAIL-EN`
32. `B-PX-FEEDBACK-KO`
33. `B-PX-REPORT-EN`
34. `B-PX-LOCAL-SIGNAL-EMPTY-EN`
35. `B-PX-LOCAL-SIGNAL-FAIL-KO`
36. `B-PX-LOCAL-SIGNAL-SUCCESS-EN`
37. `B-PX-CHECKOUT-IDLE-EN`
38. `B-PX-CHECKOUT-CANCEL-KO`
39. `B-PX-CHECKOUT-FAIL-EN`
40. `B-PX-CHECKOUT-RECEIPT-EN`
41. `B-PX-CHECKOUT-STAMP-KO`
42. `B-PX-MY-EN`
43. `B-PX-SESSION-RESET-CONFIRM-KO`
44. `B-PX-DISCOVERY-RESET-CONFIRM-EN`
45. `B-PX-PROFILE-KO`
46. `B-PX-TRUST-FOUR-AXES-EN`
47. `B-PX-LABS-EN`
48. `B-PX-LABS-TRAIT-FAIL-KO`
49. `B-PX-LABS-BRIDGE-FAIL-EN`
50. `B-PX-LABS-BRIDGE-SUCCESS-EN`

## Per-flow checkpoint dispositions · exact 18 / 126

Legend: `A/P` = ACTUAL with one or more explicit pixel links; `A/F` = ACTUAL functional-only with the exact proof listed below; `N/F` = reasoned N/A functional-only. Every cell represents the exact `B-E2E-<flow>-<checkpoint>` record. There is no GAP cell.

| Flow | ENTRY | DECISION | CANCEL | ERROR | RETRY | TERMINAL | RETURN |
|---|---|---|---|---|---|---|---|
| `FL-001` Guest Discover | A/P | A/P | A/P | A/P | A/P | A/P | A/P |
| `FL-002` Age proof → exact venue | A/P | A/P | A/P | A/P | A/P | A/P | A/P |
| `FL-003` Table → chat → feedback | A/P | A/P | A/F | A/P | A/P | A/P | A/P |
| `FL-004` Checkout → stamp | A/P | A/P | A/P | A/P | A/P | A/P | A/P |
| `FL-005` Korean CX | A/P | A/P | A/F | A/P | A/P | A/F | A/F |
| `FL-006` Residence Card | A/P | A/P | A/F | A/P | A/P | A/F | A/F |
| `FL-007` Short-term onboarding | A/P | A/P | A/P | A/F | N/F | A/P | A/P |
| `FL-008` Korean local onboarding | A/P | A/P | A/P | A/F | N/F | A/P | A/P |
| `FL-009` Resident onboarding | A/P | A/P | A/P | A/F | N/F | A/P | A/P |
| `FL-010` Account gate | A/P | A/P | A/P | A/P | A/P | A/P | A/P |
| `FL-011` Save and My Korea | A/P | A/F | A/P | A/P | A/P | A/P | A/P |
| `FL-012` Local signal | A/P | A/P | A/P | A/P | A/P | A/P | A/P |
| `FL-013` Manual 19+ | A/P | A/P | A/P | A/P | A/P | A/P | A/P |
| `FL-014` Auto After19 | A/P | A/P | A/P | A/P | A/P | A/P | A/P |
| `FL-015` Optional profile | A/P | A/P | A/P | A/F | A/F | A/P | A/P |
| `FL-016` Evidence / merchant trait | A/P | A/P | A/F | A/P | A/P | A/P | A/P |
| `FL-017` Payment KYC | A/P | A/P | A/P | A/P | A/P | A/P | A/P |
| `FL-018` Labs wallet / bridge | A/P | A/P | A/P | A/P | A/P | A/P | A/P |

Matrix arithmetic: `109 A/P + 14 A/F + 3 N/F = 126`; product disposition arithmetic: `123 ACTUAL + 3 N/A + 0 GAP = 126`.

## All 17 functional-only proofs

| Exact checkpoint | Product disposition | Exact reason/proof audited |
|---|---|---|
| `B-E2E-FL-003-CANCEL` | ACTUAL | Leave-confirmation cancel; no layout-distinct pixel claimed. |
| `B-E2E-FL-005-CANCEL` | ACTUAL | Gate cancel preserves the signal draft. |
| `B-E2E-FL-005-TERMINAL` | ACTUAL | Terminal mutation is `PER-VERIFIED` only. |
| `B-E2E-FL-005-RETURN` | ACTUAL | Return is the original local-signal sheet. |
| `B-E2E-FL-006-CANCEL` | ACTUAL | Gate cancel preserves the exact signal draft. |
| `B-E2E-FL-006-TERMINAL` | ACTUAL | `PER-VERIFIED` occurs only after passport completion. |
| `B-E2E-FL-006-RETURN` | ACTUAL | The original venue-scoped local-signal sheet returns exactly once. |
| `B-E2E-FL-007-ERROR` | ACTUAL | `onboarding=failure` falls through to the usable map. |
| `B-E2E-FL-007-RETRY` | N/A | Validation failure intentionally falls through to the usable map; no retry screen is specified. |
| `B-E2E-FL-008-ERROR` | ACTUAL | `onboarding=failure` falls through to the usable map. |
| `B-E2E-FL-008-RETRY` | N/A | Fallback is the terminal Guest map; CX is not started here. |
| `B-E2E-FL-009-ERROR` | ACTUAL | `onboarding=failure` falls through to the usable map. |
| `B-E2E-FL-009-RETRY` | N/A | Fallback is the terminal Guest map; Residence Card is not started here. |
| `B-E2E-FL-011-DECISION` | ACTUAL | Local save starts without losing venue context. |
| `B-E2E-FL-015-ERROR` | ACTUAL | Profile failure keeps prior fields. |
| `B-E2E-FL-015-RETRY` | ACTUAL | The same profile task exposes `Try save again`. |
| `B-E2E-FL-016-CANCEL` | ACTUAL | Sheet close returns to the venue/My parent. |

## Live role-critical exercise coverage

| Exercise | Fresh context | Result |
|---|---|---|
| Six exact viewport shells | one per viewport | `6/6` HTTP 200, overflow 0, page errors 0 |
| Actual Seoul map | `1440×1000` | ready, 40 signal sources, 9 rendered at capture; low-contrast geography, visible attribution, heat focal hierarchy |
| Filtered discovery | `430×932` | one-source query → one-row list → exact selected place; URL, result, score, and place sheet synchronized |
| EN→KO first-run path | `360×800` | locale switched to KO; three persona rows `82px` high; overflow 0 |
| Place → account gate | `390×844` | single exposed modal; outside controls inert + aria-hidden; backdrop/context preserved |
| Escape/focus return | `390×844` | focus returned to `canonical-venue-save`; exact place remained visible |
| Hover / pressed / focus | `390×844` | restrained hover/press brightness/translation; keyboard focus ring `2px` blue + `2px` offset |

## Completion statement

No frame, case, state, viewport, locale row, flow, or checkpoint remains unverified. D1 coverage is `COMPLETE`; with raw `S0=S1=S2=0`, the verdict is `CLEAN`.

