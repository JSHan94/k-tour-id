# D3 Inclusive & Responsive · exact coverage ledger

Status: **COMPLETE** (verdict is **NOT CLEAN** because raw S2 = 3)

## Frozen boundary

| Item | Exact value |
|---|---|
| Evidence SHA | `fcd4447d86ac01daf90ee763963e1ddfa7a7f811` |
| Product | `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` |
| Harness | `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` |
| Baseline digest | `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` |
| Live URL | `http://127.0.0.1:3219/ondo-b` |

Coverage denominators are exact: `18/18` flows, `126/126` checkpoints, `123 ACTUAL`, `3 reasoned N/A`, `0 GAP`; `109` checkpoints have explicit pixel links and `17` are functional-only (including the three N/A rows). All `300` frozen PNGs were hash-reconciled and visually inspected.

## Flow census

| Flow | Title | Checkpoints | ACTUAL | N/A | GAP | Pixel | Functional-only | Result |
|---|---|---:|---:|---:|---:|---:|---:|---|
| FL-001 | Guest Discover | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| FL-002 | Age proof to exact After19 venue | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| FL-003 | Table to image chat to feedback | 7 | 7 | 0 | 0 | 6 | 1 | COVERED |
| FL-004 | Checkout to stamp milestone | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| FL-005 | Korean CX | 7 | 7 | 0 | 0 | 4 | 3 | COVERED |
| FL-006 | Residence Card | 7 | 7 | 0 | 0 | 4 | 3 | COVERED |
| FL-007 | Short-term onboarding | 7 | 6 | 1 | 0 | 5 | 2 | COVERED |
| FL-008 | Korean local onboarding | 7 | 6 | 1 | 0 | 5 | 2 | COVERED |
| FL-009 | Resident onboarding | 7 | 6 | 1 | 0 | 5 | 2 | COVERED |
| FL-010 | Account gate | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| FL-011 | Save and My Korea | 7 | 7 | 0 | 0 | 6 | 1 | COVERED |
| FL-012 | Local signal first mission | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| FL-013 | Manual 19+ proof | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| FL-014 | Auto After19 | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| FL-015 | Optional public profile | 7 | 7 | 0 | 0 | 5 | 2 | COVERED |
| FL-016 | Evidence and merchant trait | 7 | 7 | 0 | 0 | 6 | 1 | COVERED |
| FL-017 | Payment KYC | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| FL-018 | Labs wallet and bridge | 7 | 7 | 0 | 0 | 7 | 0 | COVERED |
| **Total** | **18 flows** | **126** | **123** | **3** | **0** | **109** | **17** | **COMPLETE** |

## Exact checkpoint ledger · 126/126

`ACTUAL` and `N/A` are the frozen registry dispositions. `pixel` names the exact visual case linkage; `functional_only` retains the exact canonical browser-proof reason.

| Checkpoint ID | Disposition | Visual evidence | Exact registry proof/reason | D3 coverage |
|---|---|---|---|---|
| B-E2E-FL-001-ENTRY | ACTUAL | pixel · B-PX-NATION-EN, B-PX-NATION-KO | real /ondo-b nation surface | COVERED |
| B-E2E-FL-001-DECISION | ACTUAL | pixel · B-PX-CITY-LIVE-EN, B-PX-CITY-LIVE-KO, B-PX-CITY-LIST-EN, B-PX-CITY-FILTERED-MAP-EN, B-PX-PLACE-PEEK-EN | Seoul/List/place selection | COVERED |
| B-E2E-FL-001-CANCEL | ACTUAL | pixel · B-PX-PLACE-PEEK-EN | close place and preserve city | COVERED |
| B-E2E-FL-001-ERROR | ACTUAL | pixel · B-PX-CITY-FALLBACK-KO | dedicated map-truth route abort latches data-map-state=error and keeps the sourced list usable | COVERED |
| B-E2E-FL-001-RETRY | ACTUAL | pixel · B-PX-CITY-FALLBACK-KO | Retry map starts a fresh attempt and increments data-map-attempt to 2 | COVERED |
| B-E2E-FL-001-TERMINAL | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN | official-source place detail | COVERED |
| B-E2E-FL-001-RETURN | ACTUAL | pixel · B-PX-CITY-LIVE-EN, B-PX-CITY-FILTERED-MAP-EN | same Seoul discovery context | COVERED |
| B-E2E-FL-002-ENTRY | ACTUAL | pixel · B-PX-AFTER19-VENUE-LOCKED-EN | locked After19 card inside the exact canonical venue | COVERED |
| B-E2E-FL-002-DECISION | ACTUAL | pixel · B-PX-AFTER19-VENUE-LOCKED-EN | age-only JIT explanation preserves venueId | COVERED |
| B-E2E-FL-002-CANCEL | ACTUAL | pixel · B-PX-AFTER19-VENUE-LOCKED-EN | gate cancel returns to the same locked venue detail | COVERED |
| B-E2E-FL-002-ERROR | ACTUAL | pixel · B-PX-GATE-AGE-FAIL-KO | simulated age failure retains the venue-scoped return token | COVERED |
| B-E2E-FL-002-RETRY | ACTUAL | pixel · B-PX-GATE-AGE-FAIL-KO | same venue age task retry | COVERED |
| B-E2E-FL-002-TERMINAL | ACTUAL | pixel · B-PX-AFTER19-VENUE-RETURN-EN | verified After19 venue card and banner | COVERED |
| B-E2E-FL-002-RETURN | ACTUAL | pixel · B-PX-AFTER19-VENUE-RETURN-EN | consumed OPEN_AFTER19 action restores the exact venue detail with After19 on | COVERED |
| B-E2E-FL-003-ENTRY | ACTUAL | pixel · B-PX-TABLES-LIST-EN, B-PX-TABLES-VENUE-EMPTY-EN | shared Tables surface mounted in B | COVERED |
| B-E2E-FL-003-DECISION | ACTUAL | pixel · B-PX-TABLE-DETAIL-KO | place/time join request | COVERED |
| B-E2E-FL-003-CANCEL | ACTUAL | functional_only | leave confirmation cancel | COVERED |
| B-E2E-FL-003-ERROR | ACTUAL | pixel · B-PX-TABLE-JOIN-FAIL-EN, B-PX-CHAT-IMAGE-FAIL-EN | deterministic table-network failure and locked chat | COVERED |
| B-E2E-FL-003-RETRY | ACTUAL | pixel · B-PX-TABLE-JOIN-FAIL-EN, B-PX-CHAT-IMAGE-FAIL-EN | visible join retry | COVERED |
| B-E2E-FL-003-TERMINAL | ACTUAL | pixel · B-PX-CHAT-EN, B-PX-FEEDBACK-KO, B-PX-REPORT-EN | chat photo/check-in/feedback receipt | COVERED |
| B-E2E-FL-003-RETURN | ACTUAL | pixel · B-PX-TABLES-LIST-EN, B-PX-TABLES-VENUE-EMPTY-EN | reload returns to joined Table | COVERED |
| B-E2E-FL-004-ENTRY | ACTUAL | pixel · B-PX-CHECKOUT-IDLE-EN | canonical venue checkout | COVERED |
| B-E2E-FL-004-DECISION | ACTUAL | pixel · B-PX-CHECKOUT-IDLE-EN | KRW/OOKRW preview confirmation | COVERED |
| B-E2E-FL-004-CANCEL | ACTUAL | pixel · B-PX-CHECKOUT-CANCEL-KO | cancel keeps receipt/stamp absent | COVERED |
| B-E2E-FL-004-ERROR | ACTUAL | pixel · B-PX-CHECKOUT-FAIL-EN | payment-declined keeps stamp 9 | COVERED |
| B-E2E-FL-004-RETRY | ACTUAL | pixel · B-PX-CHECKOUT-FAIL-EN | failed checkout Try again | COVERED |
| B-E2E-FL-004-TERMINAL | ACTUAL | pixel · B-PX-CHECKOUT-RECEIPT-EN, B-PX-CHECKOUT-STAMP-KO | receipt then unique visit 9 to 10 | COVERED |
| B-E2E-FL-004-RETURN | ACTUAL | pixel · B-PX-MY-EN | close returns to same venue context | COVERED |
| B-E2E-FL-005-ENTRY | ACTUAL | pixel · B-PX-GATE-PERSON-CX-KO | Korean persona local-signal Person gate | COVERED |
| B-E2E-FL-005-DECISION | ACTUAL | pixel · B-PX-GATE-PERSON-CX-KO | OmniOne CX route | COVERED |
| B-E2E-FL-005-CANCEL | ACTUAL | functional_only | gate cancel preserves signal draft | COVERED |
| B-E2E-FL-005-ERROR | ACTUAL | pixel · B-PX-GATE-PERSON-CX-KO | simulated CX failure | COVERED |
| B-E2E-FL-005-RETRY | ACTUAL | pixel · B-PX-GATE-PERSON-CX-KO | same gate retry | COVERED |
| B-E2E-FL-005-TERMINAL | ACTUAL | functional_only | PER-VERIFIED only | COVERED |
| B-E2E-FL-005-RETURN | ACTUAL | functional_only | original local-signal sheet | COVERED |
| B-E2E-FL-006-ENTRY | ACTUAL | pixel · B-PX-GATE-PERSON-PASSPORT-EN | resident local-signal Person gate | COVERED |
| B-E2E-FL-006-DECISION | ACTUAL | pixel · B-PX-GATE-RESIDENCE-UNSUPPORTED-EN | ordinary Mobile Residence Card action resolves NOT_CONFIGURED | COVERED |
| B-E2E-FL-006-CANCEL | ACTUAL | functional_only | gate cancel preserves the exact signal draft | COVERED |
| B-E2E-FL-006-ERROR | ACTUAL | pixel · B-PX-GATE-RESIDENCE-UNSUPPORTED-EN | visible unsupported result without QA controls | COVERED |
| B-E2E-FL-006-RETRY | ACTUAL | pixel · B-PX-GATE-PERSON-PASSPORT-EN | passport alternate is the only completion route | COVERED |
| B-E2E-FL-006-TERMINAL | ACTUAL | functional_only | PER-VERIFIED only after passport completion | COVERED |
| B-E2E-FL-006-RETURN | ACTUAL | functional_only | original venue-scoped local-signal sheet exactly once | COVERED |
| B-E2E-FL-007-ENTRY | ACTUAL | pixel · B-PX-ONBOARDING-VALUE-EN | first-run guide | COVERED |
| B-E2E-FL-007-DECISION | ACTUAL | pixel · B-PX-ONBOARDING-PERSONAS-KO, B-PX-ONBOARDING-PREFERENCES-EN | short-term intent/preferences | COVERED |
| B-E2E-FL-007-CANCEL | ACTUAL | pixel · B-PX-ONBOARDING-VALUE-EN, B-PX-DISCOVERY-RESET-CONFIRM-EN | Explore as guest | COVERED |
| B-E2E-FL-007-ERROR | ACTUAL | functional_only | onboarding=failure fallback | COVERED |
| B-E2E-FL-007-RETRY | N/A | functional_only | validation failure intentionally falls through to the usable map; no retry screen is specified | COVERED |
| B-E2E-FL-007-TERMINAL | ACTUAL | pixel · B-PX-NATION-EN | ONB-COMPLETE guest | COVERED |
| B-E2E-FL-007-RETURN | ACTUAL | pixel · B-PX-NATION-EN | real B nation/map shell | COVERED |
| B-E2E-FL-008-ENTRY | ACTUAL | pixel · B-PX-ONBOARDING-VALUE-EN | first-run guide | COVERED |
| B-E2E-FL-008-DECISION | ACTUAL | pixel · B-PX-ONBOARDING-PERSONAS-KO, B-PX-ONBOARDING-PREFERENCES-EN | Korean-local persona | COVERED |
| B-E2E-FL-008-CANCEL | ACTUAL | pixel · B-PX-ONBOARDING-VALUE-EN, B-PX-DISCOVERY-RESET-CONFIRM-EN | Explore as guest | COVERED |
| B-E2E-FL-008-ERROR | ACTUAL | functional_only | onboarding=failure fallback | COVERED |
| B-E2E-FL-008-RETRY | N/A | functional_only | fallback is the terminal Guest map; CX is not started here | COVERED |
| B-E2E-FL-008-TERMINAL | ACTUAL | pixel · B-PX-NATION-KO | map without CX gate | COVERED |
| B-E2E-FL-008-RETURN | ACTUAL | pixel · B-PX-NATION-KO | real B nation/map shell | COVERED |
| B-E2E-FL-009-ENTRY | ACTUAL | pixel · B-PX-ONBOARDING-VALUE-EN | first-run guide | COVERED |
| B-E2E-FL-009-DECISION | ACTUAL | pixel · B-PX-ONBOARDING-PERSONAS-KO, B-PX-ONBOARDING-PREFERENCES-EN | resident persona | COVERED |
| B-E2E-FL-009-CANCEL | ACTUAL | pixel · B-PX-ONBOARDING-VALUE-EN, B-PX-DISCOVERY-RESET-CONFIRM-EN | Explore as guest | COVERED |
| B-E2E-FL-009-ERROR | ACTUAL | functional_only | onboarding=failure fallback | COVERED |
| B-E2E-FL-009-RETRY | N/A | functional_only | fallback is the terminal Guest map; Residence Card is not started here | COVERED |
| B-E2E-FL-009-TERMINAL | ACTUAL | pixel · B-PX-NATION-EN | map without Residence gate | COVERED |
| B-E2E-FL-009-RETURN | ACTUAL | pixel · B-PX-NATION-EN | real B nation/map shell | COVERED |
| B-E2E-FL-010-ENTRY | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN | Save on canonical venue | COVERED |
| B-E2E-FL-010-DECISION | ACTUAL | pixel · B-PX-GATE-ACCOUNT-FAIL-KO | account explanation/start | COVERED |
| B-E2E-FL-010-CANCEL | ACTUAL | pixel · B-PX-SESSION-RESET-CONFIRM-KO | Escape preserves selected venue | COVERED |
| B-E2E-FL-010-ERROR | ACTUAL | pixel · B-PX-GATE-ACCOUNT-FAIL-KO | simulated account failure | COVERED |
| B-E2E-FL-010-RETRY | ACTUAL | pixel · B-PX-GATE-ACCOUNT-FAIL-KO | same save task retry | COVERED |
| B-E2E-FL-010-TERMINAL | ACTUAL | pixel · B-PX-SAVE-RECOVERED-KO | ACC-ACTIVE and one saved venue | COVERED |
| B-E2E-FL-010-RETURN | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN | same canonical venue | COVERED |
| B-E2E-FL-011-ENTRY | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN | canonical venue Save | COVERED |
| B-E2E-FL-011-DECISION | ACTUAL | functional_only | local save starts without losing venue context | COVERED |
| B-E2E-FL-011-CANCEL | ACTUAL | pixel · B-PX-SAVE-FAILURE-EN | visible local-save error can be dismissed while remaining unsaved | COVERED |
| B-E2E-FL-011-ERROR | ACTUAL | pixel · B-PX-SAVE-FAILURE-EN | save-failed fixture exposes a visible local-save failure while preserving the venue and CTA | COVERED |
| B-E2E-FL-011-RETRY | ACTUAL | pixel · B-PX-SAVE-RECOVERED-KO | Retry save reaches the persisted Saved state | COVERED |
| B-E2E-FL-011-TERMINAL | ACTUAL | pixel · B-PX-SAVE-RECOVERED-KO, B-PX-MY-EN | saved card persists through reload into My Korea | COVERED |
| B-E2E-FL-011-RETURN | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN | saved card returns to exact venue | COVERED |
| B-E2E-FL-012-ENTRY | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN | venue Local Signal | COVERED |
| B-E2E-FL-012-DECISION | ACTUAL | pixel · B-PX-LOCAL-SIGNAL-EMPTY-EN | note/photo draft | COVERED |
| B-E2E-FL-012-CANCEL | ACTUAL | pixel · B-PX-LOCAL-SIGNAL-EMPTY-EN | Cancel draft returns to venue | COVERED |
| B-E2E-FL-012-ERROR | ACTUAL | pixel · B-PX-LOCAL-SIGNAL-FAIL-KO | local-signal-fail preserves draft | COVERED |
| B-E2E-FL-012-RETRY | ACTUAL | pixel · B-PX-LOCAL-SIGNAL-FAIL-KO | visible Try again plus clean-route success | COVERED |
| B-E2E-FL-012-TERMINAL | ACTUAL | pixel · B-PX-LOCAL-SIGNAL-SUCCESS-EN | Visit and Contribution only | COVERED |
| B-E2E-FL-012-RETURN | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN | Return to same venue | COVERED |
| B-E2E-FL-013-ENTRY | ACTUAL | pixel · B-PX-AFTER19-VENUE-LOCKED-EN | After 19 chip | COVERED |
| B-E2E-FL-013-DECISION | ACTUAL | pixel · B-PX-AFTER19-PROMPT-EN | Confirm 19+ | COVERED |
| B-E2E-FL-013-CANCEL | ACTUAL | pixel · B-PX-AFTER19-PROMPT-EN | Escape to normal ONDO | COVERED |
| B-E2E-FL-013-ERROR | ACTUAL | pixel · B-PX-GATE-AGE-FAIL-KO | simulated proof failure | COVERED |
| B-E2E-FL-013-RETRY | ACTUAL | pixel · B-PX-GATE-AGE-FAIL-KO | same proof retry | COVERED |
| B-E2E-FL-013-TERMINAL | ACTUAL | pixel · B-PX-AFTER19-VENUE-RETURN-EN | AGE-VERIFIED/A19-ON | COVERED |
| B-E2E-FL-013-RETURN | ACTUAL | pixel · B-PX-AFTER19-VENUE-RETURN-EN | B map remains available | COVERED |
| B-E2E-FL-014-ENTRY | ACTUAL | pixel · B-PX-CITY-LIVE-EN | fixed KST evening resume | COVERED |
| B-E2E-FL-014-DECISION | ACTUAL | pixel · B-PX-AFTER19-VENUE-RETURN-EN | four guards cause banner | COVERED |
| B-E2E-FL-014-CANCEL | ACTUAL | pixel · B-PX-CITY-LIVE-EN | manual off | COVERED |
| B-E2E-FL-014-ERROR | ACTUAL | pixel · B-PX-AFTER19-EXPIRED-REASON-EN | an expired-proof reason status explains why the main map returned | COVERED |
| B-E2E-FL-014-RETRY | ACTUAL | pixel · B-PX-AFTER19-EXPIRED-REASON-EN | Check 19+ again reopens the age-check recovery path | COVERED |
| B-E2E-FL-014-TERMINAL | ACTUAL | pixel · B-PX-AFTER19-VENUE-RETURN-EN | A19-ON | COVERED |
| B-E2E-FL-014-RETURN | ACTUAL | pixel · B-PX-CITY-LIVE-EN, B-PX-AFTER19-EXPIRED-REASON-EN | same-session manual-off survives reload | COVERED |
| B-E2E-FL-015-ENTRY | ACTUAL | pixel · B-PX-PROFILE-KO | ID public profile | COVERED |
| B-E2E-FL-015-DECISION | ACTUAL | pixel · B-PX-PROFILE-KO | per-field public consent | COVERED |
| B-E2E-FL-015-CANCEL | ACTUAL | pixel · B-PX-SESSION-RESET-CONFIRM-KO | cancel keeps prior fields | COVERED |
| B-E2E-FL-015-ERROR | ACTUAL | functional_only | profile=failure keeps prior fields | COVERED |
| B-E2E-FL-015-RETRY | ACTUAL | functional_only | Try save again | COVERED |
| B-E2E-FL-015-TERMINAL | ACTUAL | pixel · B-PX-PROFILE-KO, B-PX-TRUST-FOUR-AXES-EN, B-PX-LOCAL-SIGNAL-SUCCESS-EN, B-PX-FEEDBACK-KO | only selected fields public | COVERED |
| B-E2E-FL-015-RETURN | ACTUAL | pixel · B-PX-MY-EN | ID with four-axis trust panel | COVERED |
| B-E2E-FL-016-ENTRY | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN, B-PX-LABS-EN | venue facts and Labs trait section | COVERED |
| B-E2E-FL-016-DECISION | ACTUAL | pixel · B-PX-LABS-TRAIT-FAIL-KO | canonical truth labels | COVERED |
| B-E2E-FL-016-CANCEL | ACTUAL | functional_only | sheet close to venue/My | COVERED |
| B-E2E-FL-016-ERROR | ACTUAL | pixel · B-PX-LABS-TRAIT-FAIL-KO | unknown/stale and ineligible trait | COVERED |
| B-E2E-FL-016-RETRY | ACTUAL | pixel · B-PX-LABS-TRAIT-FAIL-KO | trait retry fixture | COVERED |
| B-E2E-FL-016-TERMINAL | ACTUAL | pixel · B-PX-LABS-EN | limited eligibility, never safety guarantee | COVERED |
| B-E2E-FL-016-RETURN | ACTUAL | pixel · B-PX-PLACE-DETAIL-EN | same venue or Labs parent | COVERED |
| B-E2E-FL-017-ENTRY | ACTUAL | pixel · B-PX-CHECKOUT-IDLE-EN | checkout Continue with Payment KYC | COVERED |
| B-E2E-FL-017-DECISION | ACTUAL | pixel · B-PX-GATE-PAYMENT-EN | separate Payment KYC gate | COVERED |
| B-E2E-FL-017-CANCEL | ACTUAL | pixel · B-PX-GATE-PAYMENT-EN | gate cancel to same checkout | COVERED |
| B-E2E-FL-017-ERROR | ACTUAL | pixel · B-PX-GATE-PAYMENT-FAIL-KO | simulated KYC failure | COVERED |
| B-E2E-FL-017-RETRY | ACTUAL | pixel · B-PX-GATE-PAYMENT-FAIL-KO | same checkout token retry | COVERED |
| B-E2E-FL-017-TERMINAL | ACTUAL | pixel · B-PX-CHECKOUT-RECEIPT-EN | PKY-VERIFIED only | COVERED |
| B-E2E-FL-017-RETURN | ACTUAL | pixel · B-PX-CHECKOUT-IDLE-EN | same checkout, then receipt | COVERED |
| B-E2E-FL-018-ENTRY | ACTUAL | pixel · B-PX-LABS-EN | My Korea Labs opt-in | COVERED |
| B-E2E-FL-018-DECISION | ACTUAL | pixel · B-PX-LABS-EN | acknowledge/signer/quote | COVERED |
| B-E2E-FL-018-CANCEL | ACTUAL | pixel · B-PX-LABS-BRIDGE-FAIL-EN | bridge cancel changes no assets | COVERED |
| B-E2E-FL-018-ERROR | ACTUAL | pixel · B-PX-LABS-BRIDGE-FAIL-EN | expiry and ordered bridge failure | COVERED |
| B-E2E-FL-018-RETRY | ACTUAL | pixel · B-PX-LABS-BRIDGE-FAIL-EN | fresh quote | COVERED |
| B-E2E-FL-018-TERMINAL | ACTUAL | pixel · B-PX-LABS-BRIDGE-SUCCESS-EN | simulated receipt and opt-in badge | COVERED |
| B-E2E-FL-018-RETURN | ACTUAL | pixel · B-PX-MY-EN | reload persistence and My Korea close | COVERED |

## Exact frozen visual census · 50 cases / 300 PNG

Every case below has one verified/inspected PNG at each listed viewport. State count is `48` because `CITY-LIVE` has EN/KO cases and `NATION` has EN/KO cases.

| Case ID | State | Flow links | Locale | Exact viewports | PNG coverage |
|---|---|---|---|---|---:|
| B-PX-AFTER19-EXPIRED-REASON-EN | AFTER19-EXPIRED-REASON | FL-014 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-AFTER19-PROMPT-EN | AFTER19-PROMPT | FL-013 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-AFTER19-VENUE-LOCKED-EN | AFTER19-VENUE-LOCKED | FL-002 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-AFTER19-VENUE-RETURN-EN | AFTER19-VENUE-RETURN | FL-002,FL-013,FL-014 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CHAT-EN | CHAT | FL-003 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CHAT-IMAGE-FAIL-EN | CHAT-IMAGE-FAIL | FL-003 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CHECKOUT-CANCEL-KO | CHECKOUT-CANCEL | FL-004 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CHECKOUT-FAIL-EN | CHECKOUT-FAIL | FL-004 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CHECKOUT-IDLE-EN | CHECKOUT-IDLE | FL-004,FL-017 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CHECKOUT-RECEIPT-EN | CHECKOUT-RECEIPT | FL-004 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CHECKOUT-STAMP-KO | CHECKOUT-STAMP | FL-004 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CITY-FALLBACK-KO | CITY-FALLBACK | FL-001 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CITY-FILTERED-MAP-EN | CITY-FILTERED-MAP | FL-001 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CITY-LIST-EN | CITY-LIST | FL-001 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CITY-LIVE-EN | CITY-LIVE | FL-001,FL-014 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-CITY-LIVE-KO | CITY-LIVE | FL-001,FL-014 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-DISCOVERY-RESET-CONFIRM-EN | DISCOVERY-RESET-CONFIRM | FL-007,FL-008,FL-009 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-FEEDBACK-KO | FEEDBACK | FL-003,FL-015 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-GATE-ACCOUNT-FAIL-KO | GATE-ACCOUNT-FAIL | FL-010 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-GATE-AGE-FAIL-KO | GATE-AGE-FAIL | FL-002,FL-013 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-GATE-PAYMENT-EN | GATE-PAYMENT | FL-017 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-GATE-PAYMENT-FAIL-KO | GATE-PAYMENT-FAIL | FL-017 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-GATE-PERSON-CX-KO | GATE-PERSON-CX | FL-005 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-GATE-PERSON-PASSPORT-EN | GATE-PERSON-PASSPORT | FL-006,FL-012 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-GATE-RESIDENCE-UNSUPPORTED-EN | GATE-PERSON-RESIDENCE-UNSUPPORTED | FL-006 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-LABS-BRIDGE-FAIL-EN | LABS-BRIDGE-FAIL | FL-018 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-LABS-BRIDGE-SUCCESS-EN | LABS-BRIDGE-SUCCESS | FL-018 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-LABS-EN | LABS | FL-004,FL-016,FL-018 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-LABS-TRAIT-FAIL-KO | LABS-TRAIT-FAIL | FL-016 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-LOCAL-SIGNAL-EMPTY-EN | LOCAL-SIGNAL-EMPTY | FL-012 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-LOCAL-SIGNAL-FAIL-KO | LOCAL-SIGNAL-FAIL | FL-012 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-LOCAL-SIGNAL-SUCCESS-EN | LOCAL-SIGNAL-SUCCESS | FL-012,FL-015 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-MY-EN | MY | FL-004,FL-011,FL-015 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-NATION-EN | NATION | FL-001 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-NATION-KO | NATION | FL-001 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-ONBOARDING-PERSONAS-KO | ONBOARDING-PERSONAS | FL-007,FL-008,FL-009 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-ONBOARDING-PREFERENCES-EN | ONBOARDING-PREFERENCES | FL-007,FL-008,FL-009 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-ONBOARDING-VALUE-EN | ONBOARDING-VALUE | FL-007,FL-008,FL-009 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-PLACE-DETAIL-EN | PLACE-DETAIL | FL-001,FL-010,FL-011,FL-012,FL-016 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-PLACE-PEEK-EN | PLACE-PEEK | FL-001 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-PROFILE-KO | PROFILE | FL-015 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-REPORT-EN | REPORT | FL-003 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-SAVE-FAILURE-EN | SAVE-FAILURE | FL-011 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-SAVE-RECOVERED-KO | SAVE-RECOVERED | FL-011 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-SESSION-RESET-CONFIRM-KO | SESSION-RESET-CONFIRM | FL-010,FL-015 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-TABLE-DETAIL-KO | TABLE-DETAIL | FL-003 | ko | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-TABLE-JOIN-FAIL-EN | TABLE-JOIN-FAIL | FL-003 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-TABLES-LIST-EN | TABLES-LIST | FL-003 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-TABLES-VENUE-EMPTY-EN | TABLES-VENUE-EMPTY | FL-003 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |
| B-PX-TRUST-FOUR-AXES-EN | TRUST-FOUR-AXES | FL-003,FL-012,FL-015 | en | 1440x1000, 360x800, 390x844, 430x932, 768x1024, 801x1000 | 6/6 |

### Viewport and locale census

| Dimension | PNG | EN | KO | Inspection |
|---|---:|---:|---:|---|
| 360×800 | 50 | 33 | 17 | 50/50 inspected |
| 390×844 | 50 | 33 | 17 | 50/50 inspected |
| 430×932 | 50 | 33 | 17 | 50/50 inspected |
| 768×1024 | 50 | 33 | 17 | 50/50 inspected |
| 801×1000 | 50 | 33 | 17 | 50/50 inspected |
| 1440×1000 | 50 | 33 | 17 | 50/50 inspected |
| **Total** | **300** | **198** | **102** | **300/300 inspected** |

## Live inclusive/responsive matrix

| Live case | Locales | Surfaces | Overflow / clipped core text | True targets <44 | Axe | D3 result |
|---|---|---|---:|---:|---:|---|
| 360×800 | EN + KO | Nation; frozen-state visual review | 0 | 0 | 0 | PASS |
| 390×844 | EN + KO | Nation, place, onboarding, gates, Tables/chat, signal, checkout, My/ID/Labs | 0 | 0 | 0 | PASS except gate live announcement and Labs return focus |
| 430×932 | EN + KO | Nation, place; frozen-state visual review | 0 | 0 | 0 | PASS |
| 768×1024 | EN + KO | Nation, place; frozen-state visual review | 0 | 0 | 0 | PASS |
| 801×1000 | EN + KO | Nation; frozen-state visual review | 0 | 0 | 0 | PASS |
| 1440×1000 | EN + KO | Nation; frozen-state visual review | 0 | 0 | 0 | PASS |
| 320×800 | EN + KO | Nation, place | 0 | 0 | 0 | PASS |
| 640×800 · 200%-equivalent reflow width | EN | Nation, place | 0 | 0 | 0 | PASS |
| 320×800 · 400%-equivalent reflow width | KO | Nation, place | 0 | 0 | 0 | PASS |
| 667×320 | EN | Nation, place | 0; scroll reachable | 0 | 0 | S2: 10–11px metadata |
| 740×360 | KO | Nation, place | 0; scroll reachable | 0 | 0 | S2: 10–11px metadata |
| 844×390 | EN | Nation, place | 0; scroll reachable | 0 | 0 | S2: 10–11px metadata |
| 926×428 | KO | Nation, place | 0; scroll reachable | 0 | 0 | S2: 10–11px metadata |

## Inclusive behavior ledger

| Check | Evidence | Result |
|---|---|---|
| Keyboard main/onboarding order | Onboarding initial focus `Get started`; Tab wraps through guest/language/primary actions with visible ring | PASS |
| Modal trap/isolation | Onboarding and Account Gate cycles remained inside; backgrounds were inert and `aria-hidden`; report alertdialog was modal and trapped | PASS |
| Escape/return focus | Account Gate → exact Save; report → exact report control; place-family overlays → logical surviving place control | PASS |
| Labs return focus | Escape closes named Labs dialog but leaves `BODY` active while opener remains visible | RAW S2 |
| Dialog names | Onboarding, Account, Signal, Checkout, Table, report, Labs all had programmatic names | PASS |
| Landmarks | One main app landmark; localized main navigation; named map region/canvas where mounted | PASS |
| Localized names/lang | `html lang=en/ko`, localized nav and map/city control names | PASS |
| Live updates | Save and Local Signal errors use alerts; checkout uses status/alert | PASS |
| Shared gate error update | Account/Age/Payment failure produces no alert/status/live mutation | RAW S2 |
| 44px targets | No true visible target below `44×44`; visually hidden `1×1` file inputs have visible 44px proxy buttons and are not direct targets | PASS |
| Contrast | Axe returned no contrast violations; representative 12px muted text measured above 4.5:1 | PASS |
| Non-color meaning | Signal buttons expose city/source/input/score text; map heat score is filled numeric geometry while clusters are outlined numeric geometry | PASS |
| Forced colors | Text, city controls, nav boundaries, score numerals, and the 2px focus ring remained visible | PASS |
| Reduced motion | Reduced-motion media matched; named animations removed; only negligible `0.00001s` residual durations | PASS |
| Horizontal reflow | Document/root overflow 0 across the exact and extended matrix | PASS |
| Short-landscape legibility | Layout scrolls and remains reachable, but visible provenance/filter metadata drops to 10–11px | RAW S2 |

## Coverage conclusion

Coverage status is **COMPLETE**: no flow, checkpoint, state, case, viewport, or locale is missing from the denominators above. Raw severity is **S0 0 · S1 0 · S2 3 · S3 0**, so the review verdict remains **NOT CLEAN**.
