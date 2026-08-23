# D4 Content, Truth & Privacy — full coverage census

## Tuple and completion

| Item | Result |
|---|---|
| Evidence / parent | `fcd4447d86ac01daf90ee763963e1ddfa7a7f811` |
| Product | `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` |
| Harness | `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` |
| Digest | `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` |
| Live route | `http://127.0.0.1:3219/ondo-b` |
| Visual coverage | `300/300 frames · 50/50 cases · 48/48 states · 6/6 widths` |
| Locale coverage | `198 EN · 102 KO` |
| Flow coverage | `18/18 flows` |
| Checkpoint coverage | `126/126 = 123 ACTUAL + 3 reasoned N/A + 0 GAP` |
| Surface coverage | `14/14 families × EN/KO = 28/28 live pairs` |
| Result | `COMPLETE · CLEAN · S0 0 / S1 0 / S2 0 / S3 2` |

## Evidence integrity and frame census

The FINAL-c05 `SHA256SUMS` validates all three payloads. Independently recomputing all ledger PNG hashes and IHDR sizes produced `0` hash mismatch and `0` dimension mismatch. The snapshot directories contain exactly the same `300` PNG paths as the ledger: `0` missing and `0` extra.

| Viewport | Role | Frames | EN | KO | Result |
|---|---|---:|---:|---:|---|
| `360×800` | compact mobile | 50 | 33 | 17 | inspected |
| `390×844` | canonical mobile | 50 | 33 | 17 | inspected |
| `430×932` | large mobile | 50 | 33 | 17 | inspected |
| `768×1024` | tablet | 50 | 33 | 17 | inspected |
| `801×1000` | desktop breakpoint | 50 | 33 | 17 | inspected |
| `1440×1000` | canonical desktop | 50 | 33 | 17 | inspected |
| **Total** |  | **300** | **198** | **102** | **300/300** |

All 300 frames were visually inspected in complete viewport sheets; all 50 1440px cases were additionally inspected in enlarged detail sheets. Content/truth-heavy states were then opened on the live route in fresh Chromium contexts.

## Full 50-case / 48-state census

Each case has six frozen frames, one at every exact viewport.

| # | Case ID | State | Locale | Flows | Frames |
|---:|---|---|---|---|---:|
| 1 | `B-PX-AFTER19-EXPIRED-REASON-EN` | `AFTER19-EXPIRED-REASON` | EN | FL-014 | 6 |
| 2 | `B-PX-AFTER19-PROMPT-EN` | `AFTER19-PROMPT` | EN | FL-013 | 6 |
| 3 | `B-PX-AFTER19-VENUE-LOCKED-EN` | `AFTER19-VENUE-LOCKED` | EN | FL-002 | 6 |
| 4 | `B-PX-AFTER19-VENUE-RETURN-EN` | `AFTER19-VENUE-RETURN` | EN | FL-002, FL-013, FL-014 | 6 |
| 5 | `B-PX-CHAT-EN` | `CHAT` | EN | FL-003 | 6 |
| 6 | `B-PX-CHAT-IMAGE-FAIL-EN` | `CHAT-IMAGE-FAIL` | EN | FL-003 | 6 |
| 7 | `B-PX-CHECKOUT-CANCEL-KO` | `CHECKOUT-CANCEL` | KO | FL-004 | 6 |
| 8 | `B-PX-CHECKOUT-FAIL-EN` | `CHECKOUT-FAIL` | EN | FL-004 | 6 |
| 9 | `B-PX-CHECKOUT-IDLE-EN` | `CHECKOUT-IDLE` | EN | FL-004, FL-017 | 6 |
| 10 | `B-PX-CHECKOUT-RECEIPT-EN` | `CHECKOUT-RECEIPT` | EN | FL-004 | 6 |
| 11 | `B-PX-CHECKOUT-STAMP-KO` | `CHECKOUT-STAMP` | KO | FL-004 | 6 |
| 12 | `B-PX-CITY-FALLBACK-KO` | `CITY-FALLBACK` | KO | FL-001 | 6 |
| 13 | `B-PX-CITY-FILTERED-MAP-EN` | `CITY-FILTERED-MAP` | EN | FL-001 | 6 |
| 14 | `B-PX-CITY-LIST-EN` | `CITY-LIST` | EN | FL-001 | 6 |
| 15 | `B-PX-CITY-LIVE-EN` | `CITY-LIVE` | EN | FL-001, FL-014 | 6 |
| 16 | `B-PX-CITY-LIVE-KO` | `CITY-LIVE` | KO | FL-001, FL-014 | 6 |
| 17 | `B-PX-DISCOVERY-RESET-CONFIRM-EN` | `DISCOVERY-RESET-CONFIRM` | EN | FL-007, FL-008, FL-009 | 6 |
| 18 | `B-PX-FEEDBACK-KO` | `FEEDBACK` | KO | FL-003, FL-015 | 6 |
| 19 | `B-PX-GATE-ACCOUNT-FAIL-KO` | `GATE-ACCOUNT-FAIL` | KO | FL-010 | 6 |
| 20 | `B-PX-GATE-AGE-FAIL-KO` | `GATE-AGE-FAIL` | KO | FL-002, FL-013 | 6 |
| 21 | `B-PX-GATE-PAYMENT-EN` | `GATE-PAYMENT` | EN | FL-017 | 6 |
| 22 | `B-PX-GATE-PAYMENT-FAIL-KO` | `GATE-PAYMENT-FAIL` | KO | FL-017 | 6 |
| 23 | `B-PX-GATE-PERSON-CX-KO` | `GATE-PERSON-CX` | KO | FL-005 | 6 |
| 24 | `B-PX-GATE-PERSON-PASSPORT-EN` | `GATE-PERSON-PASSPORT` | EN | FL-006, FL-012 | 6 |
| 25 | `B-PX-GATE-RESIDENCE-UNSUPPORTED-EN` | `GATE-PERSON-RESIDENCE-UNSUPPORTED` | EN | FL-006 | 6 |
| 26 | `B-PX-LABS-BRIDGE-FAIL-EN` | `LABS-BRIDGE-FAIL` | EN | FL-018 | 6 |
| 27 | `B-PX-LABS-BRIDGE-SUCCESS-EN` | `LABS-BRIDGE-SUCCESS` | EN | FL-018 | 6 |
| 28 | `B-PX-LABS-EN` | `LABS` | EN | FL-004, FL-016, FL-018 | 6 |
| 29 | `B-PX-LABS-TRAIT-FAIL-KO` | `LABS-TRAIT-FAIL` | KO | FL-016 | 6 |
| 30 | `B-PX-LOCAL-SIGNAL-EMPTY-EN` | `LOCAL-SIGNAL-EMPTY` | EN | FL-012 | 6 |
| 31 | `B-PX-LOCAL-SIGNAL-FAIL-KO` | `LOCAL-SIGNAL-FAIL` | KO | FL-012 | 6 |
| 32 | `B-PX-LOCAL-SIGNAL-SUCCESS-EN` | `LOCAL-SIGNAL-SUCCESS` | EN | FL-012, FL-015 | 6 |
| 33 | `B-PX-MY-EN` | `MY` | EN | FL-004, FL-011, FL-015 | 6 |
| 34 | `B-PX-NATION-EN` | `NATION` | EN | FL-001 | 6 |
| 35 | `B-PX-NATION-KO` | `NATION` | KO | FL-001 | 6 |
| 36 | `B-PX-ONBOARDING-PERSONAS-KO` | `ONBOARDING-PERSONAS` | KO | FL-007, FL-008, FL-009 | 6 |
| 37 | `B-PX-ONBOARDING-PREFERENCES-EN` | `ONBOARDING-PREFERENCES` | EN | FL-007, FL-008, FL-009 | 6 |
| 38 | `B-PX-ONBOARDING-VALUE-EN` | `ONBOARDING-VALUE` | EN | FL-007, FL-008, FL-009 | 6 |
| 39 | `B-PX-PLACE-DETAIL-EN` | `PLACE-DETAIL` | EN | FL-001, FL-010, FL-011, FL-012, FL-016 | 6 |
| 40 | `B-PX-PLACE-PEEK-EN` | `PLACE-PEEK` | EN | FL-001 | 6 |
| 41 | `B-PX-PROFILE-KO` | `PROFILE` | KO | FL-015 | 6 |
| 42 | `B-PX-REPORT-EN` | `REPORT` | EN | FL-003 | 6 |
| 43 | `B-PX-SAVE-FAILURE-EN` | `SAVE-FAILURE` | EN | FL-011 | 6 |
| 44 | `B-PX-SAVE-RECOVERED-KO` | `SAVE-RECOVERED` | KO | FL-011 | 6 |
| 45 | `B-PX-SESSION-RESET-CONFIRM-KO` | `SESSION-RESET-CONFIRM` | KO | FL-010, FL-015 | 6 |
| 46 | `B-PX-TABLE-DETAIL-KO` | `TABLE-DETAIL` | KO | FL-003 | 6 |
| 47 | `B-PX-TABLE-JOIN-FAIL-EN` | `TABLE-JOIN-FAIL` | EN | FL-003 | 6 |
| 48 | `B-PX-TABLES-LIST-EN` | `TABLES-LIST` | EN | FL-003 | 6 |
| 49 | `B-PX-TABLES-VENUE-EMPTY-EN` | `TABLES-VENUE-EMPTY` | EN | FL-003 | 6 |
| 50 | `B-PX-TRUST-FOUR-AXES-EN` | `TRUST-FOUR-AXES` | EN | FL-003, FL-012, FL-015 | 6 |

`CITY-LIVE` and `NATION` each have EN and KO cases, producing `50 cases` over `48 distinct state IDs`. Every other state has one locale case in the frozen pixel registry; complementary locale semantics were covered by the 28 live surface-locale pairs below.

## 18-flow / 126-checkpoint census

Legend: `A` = actual browser checkpoint; `N/A` = reasoned not applicable; `P/F` = pixel-linked / functional-only checkpoint count.

| Flow | Entry | Decision | Cancel | Error | Retry | Terminal | Return | Actual | N/A | P/F |
|---|---|---|---|---|---|---|---|---:|---:|---:|
| `FL-001` Guest Discover | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| `FL-002` exact After19 venue | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| `FL-003` Table/chat/feedback | A | A | A | A | A | A | A | 7 | 0 | 6/1 |
| `FL-004` checkout/stamp | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| `FL-005` Korean CX | A | A | A | A | A | A | A | 7 | 0 | 4/3 |
| `FL-006` Residence Card | A | A | A | A | A | A | A | 7 | 0 | 4/3 |
| `FL-007` short-term onboarding | A | A | A | A | N/A | A | A | 6 | 1 | 5/2 |
| `FL-008` Korean onboarding | A | A | A | A | N/A | A | A | 6 | 1 | 5/2 |
| `FL-009` resident onboarding | A | A | A | A | N/A | A | A | 6 | 1 | 5/2 |
| `FL-010` Account gate | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| `FL-011` save/My Korea | A | A | A | A | A | A | A | 7 | 0 | 6/1 |
| `FL-012` Local Signal | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| `FL-013` manual 19+ | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| `FL-014` auto After19 | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| `FL-015` optional profile | A | A | A | A | A | A | A | 7 | 0 | 5/2 |
| `FL-016` evidence/trait | A | A | A | A | A | A | A | 7 | 0 | 6/1 |
| `FL-017` Payment KYC | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| `FL-018` wallet/bridge | A | A | A | A | A | A | A | 7 | 0 | 7/0 |
| **Total** | **18 A** | **18 A** | **18 A** | **18 A** | **15 A + 3 N/A** | **18 A** | **18 A** | **123** | **3** | **109/17** |

The three N/A checkpoints are exact and reasoned:

- `B-E2E-FL-007-RETRY`: onboarding validation failure intentionally falls through to the usable Guest map; no retry screen is specified.
- `B-E2E-FL-008-RETRY`: fallback is the terminal Guest map; CX is not started during onboarding.
- `B-E2E-FL-009-RETRY`: fallback is the terminal Guest map; Residence Card is not started during onboarding.

The complete `functional_only` set is:

| Checkpoint | Disposition | Functional proof audited |
|---|---|---|
| `FL-003:CANCEL` | ACTUAL | leave confirmation cancel |
| `FL-005:CANCEL` | ACTUAL | Person gate cancel preserves Local Signal draft |
| `FL-005:TERMINAL` | ACTUAL | CX completion changes only Person to verified |
| `FL-005:RETURN` | ACTUAL | returns to original Local Signal sheet |
| `FL-006:CANCEL` | ACTUAL | Residence gate cancel preserves exact draft |
| `FL-006:TERMINAL` | ACTUAL | passport alternate completes Person only |
| `FL-006:RETURN` | ACTUAL | returns once to the venue-scoped signal sheet |
| `FL-007:ERROR` | ACTUAL | failure falls through to Guest map |
| `FL-007:RETRY` | N/A | usable-map fallback has no retry screen |
| `FL-008:ERROR` | ACTUAL | failure falls through to Guest map without CX |
| `FL-008:RETRY` | N/A | Guest-map terminal has no retry screen |
| `FL-009:ERROR` | ACTUAL | failure falls through to Guest map without Residence gate |
| `FL-009:RETRY` | N/A | Guest-map terminal has no retry screen |
| `FL-011:DECISION` | ACTUAL | local save begins without losing venue context |
| `FL-015:ERROR` | ACTUAL | profile failure preserves prior fields |
| `FL-015:RETRY` | ACTUAL | retry resumes the same profile save |
| `FL-016:CANCEL` | ACTUAL | closes the evidence/trait child and returns to parent |

No registry checkpoint has `gap` disposition.

## 14 surface families × EN/KO live census

| Surface family | EN | KO | Content/truth/privacy coverage |
|---|---|---|---|
| onboarding | checked | checked | Guest escape, simulated score preview, no KYC/person inference |
| nation | checked | checked | sourced records vs fixed simulated scores, not-live label |
| city-list | checked | checked | official Korean names, generated Romanization, singular/plural, source/simulation separation |
| place | checked | checked | MOIS source, unknown facts, official vs ONDO, After19 preview boundary |
| account-gate | checked | checked | Account≠identity, simulated provider, same-task return |
| age-gate | checked | checked | eligibility-only, simulated proof, no ZKP overclaim |
| tables | checked | checked | fixed availability preview, no live host/reservation, no nationality/gender matching |
| table-chat | checked | checked | confirmed-member scope, unverified participant identity, session-only photo/message; S3 KO time |
| local-signal | checked | checked | note/photo requirement, memory-only image, Visit+Contribution-only mutation |
| checkout | checked | checked | KRW price, OOKRW test token, Payment KYC separation, no real payment/assets |
| identity | checked | checked | Account/Person/19+/Payment axes, safety disclaimer, browser session scope |
| profile | checked | checked | self-declared fields, default private, KYC nationality not copied |
| labs | checked | checked | signer/assets/bridge/trait/badge/AMM truth labels and negative contracts |
| after19 | checked | checked | four guards, simulated age status, ordinary venues remain, manual-off behavior |
| **Total** | **14/14** | **14/14** | **28/28 pairs** |

One-result copy was checked separately in both locales: EN rendered `1 sourced food place`; KO rendered `1곳의 공식 식음료 장소`.

## Truth/provenance matrix

| Boundary | Surfaces/states checked | Result |
|---|---|---|
| `OFFICIAL_SOURCE` / sourced | nation, city list/map, place peek/detail, save failure/recovery | official Korean name/address/licence snapshot preserved |
| generated/derived name | city list, place | navigation Romanization labeled generated and not official English |
| `SIMULATED` | scores, onboarding, gates, Table/chat, Local Signal, checkout, wallet/bridge/badge | explicit in context; no live/provider/payment/chain overclaim |
| `UNKNOWN` | place facts | unconfirmed hours/cards/menu/phone/alcohol/admission/age not promoted |
| stale/unavailable/error | merchant trait, map fallback, After19 expiry, save/table/chat/signal/payment failures | status and retry/recovery present; no stale→eligible promotion |
| `CONTRACT_ONLY` | OpenDID/EAS adapters, merchant conditions | distinct adapters and policy-limited claims |
| `NOT_CONFIGURED` | Residence Card unsupported | visible alternate, no fake success |
| browser-local | profile, chat, photo, signals, Table/report | no server/publishing claim; disclosed scope |
| receipt/finality | checkout, stamp, bridge | payment≠visit; source-confirmed≠destination-confirmed |

## Error, retry, cancel, receipt, and return census

| Path | Live result |
|---|---|
| map fallback | sourced list remains, retry available |
| After19 expiry | main map restored, reason shown, recheck CTA |
| save failure/recovery | venue context preserved; retry persists saved venue in local preference |
| Account failure | gate/token remains retryable; return changes nothing |
| age failure | age-only retry; unrelated axes unchanged |
| Payment KYC failure | checkout stays idle, stamp 9, same-task retry |
| Table join failure | `TMB-FAILED / TFR-NETWORK / CHA-LOCKED`, same Table retry |
| chat image failure | `MSG-FAILED`, retry; status-only storage, no image/blob |
| Local Signal failure | draft retained; invariants preserved |
| Local Signal success | Visit and Contribution only; stamp 9 and other axes unchanged |
| checkout cancel | `PAY-CANCELLED`, no receipt/assets/stamp mutation |
| checkout failure | `PAY-FAILED`, no completion record/assets/stamp mutation |
| checkout receipt | `PAY-SIMULATED-SUCCESS`, `SIM-SG01`, stamp remains 9 |
| separate visit | explicit preview visit advances 9→10 and denies real GPS/QR/merchant evidence |
| merchant trait failure | stale/unavailable remains non-eligible with retry |
| bridge failure | `BRG-FAILED`, phase `source_confirmed`, destination pending, balances unchanged |
| bridge success | `BRG-SIMULATED-SUCCESS`, phase `destination_confirmed`, projected values read-only |

## Privacy, persistence, storage, and URL census

| Check | Before | Action | After | Result |
|---|---|---|---|---|
| discovery reset | saved venue + `vegan/late`, active verified session, public query | confirm `Reset choices` | discovery choices cleared; saved venue, locale, session, query preserved | pass |
| session reset | Account/Person/Age/Payment/After19/stamp active; saved/discovery preferences present | confirm `로그아웃하고 지우기` | Account Guest, checks reset, After19 off, stamp 9; local saved/discovery preferences preserved | pass |
| After19 manual off | eligible and auto-opened | return to main map, reload | `A19-MANUAL-OFF` remains; no auto reopen | pass |
| Local Signal photo | no object/file state in storage | select `private-photo.png` | preview visible only in memory; storage unchanged | pass |
| photo reload | preview visible | reload | filename absent; blob URL count 0 | pass |
| chat image failure | confirmed membership | select/send failing image | only message `id/kind/MSG-FAILED` stored; no filename/blob/data | pass |
| URL scan | all live families and targeted errors | inspect route/search | only public context plus deterministic QA controls | pass |

Observed storage classes:

- Local: versioned language/onboarding/guide/auto-night/saved-venue/discovery preferences.
- Session: simulated Account/Person/Age/Payment/After19 state, public entity IDs, non-sensitive membership/activity identifiers, Labs state, and status-only failed chat metadata.
- Absent: raw credential/proof/provider response, passport or residence number/image, DOB, nationality, payment instrument, private key/token, photo filename/blob/data, or profile publication without consent.

Canonical-vs-live internal key/token names differ as recorded in `D4-C05-002`; current reset, storage class, URL, and sensitive-data behavior passed.

## Findings and final counts

| ID | Severity | Coverage locus | Result |
|---|---|---|---|
| `D4-C05-001` | S3 | KO table-chat live surface | `8:12 PM` is not KO-formatted |
| `D4-C05-002` | S3 | canonical persistence docs vs live v3 gate envelope | safe behavior; identifiers/schema need reconciliation |

| Severity | Raw count |
|---|---:|
| S0 | 0 |
| S1 | 0 |
| S2 | 0 |
| S3 | 2 |

`COMPLETE · CLEAN`

