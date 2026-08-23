# D5 Traveler Service — coverage and checkpoint ledger

## Boundary

Frozen tuple: Evidence `fcd4447d86ac01daf90ee763963e1ddfa7a7f811`; Product `5c6383e38a150fc20bd6298ef0c2b7c619e671e1`; Harness `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c`; digest `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6`.

The ledger below is the complete Cartesian registry of 18 flows × 7 checkpoints = 126. Legend: `A/P` = ACTUAL with pixel-linked evidence; `A/F` = ACTUAL with canonical functional-only browser evidence; `N/F` = NOT_APPLICABLE with functional contract; every populated cell finished **PASS**. There are no gaps.

## Full 126-checkpoint ledger

| Flow | ENTRY | DECISION | CANCEL | ERROR | RETRY | TERMINAL | RETURN |
|---|---|---|---|---|---|---|---|
| FL-001 Guest Discover | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-002 Age proof to exact After19 venue | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-003 Table → image chat → feedback | A/P PASS | A/P PASS | A/F PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-004 Checkout → stamp milestone | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-005 Korean CX | A/P PASS | A/P PASS | A/F PASS | A/P PASS | A/P PASS | A/F PASS | A/F PASS |
| FL-006 Residence Card | A/P PASS | A/P PASS | A/F PASS | A/P PASS | A/P PASS | A/F PASS | A/F PASS |
| FL-007 Short-term onboarding | A/P PASS | A/P PASS | A/P PASS | A/F PASS | N/F PASS | A/P PASS | A/P PASS |
| FL-008 Korean-local onboarding | A/P PASS | A/P PASS | A/P PASS | A/F PASS | N/F PASS | A/P PASS | A/P PASS |
| FL-009 Resident onboarding | A/P PASS | A/P PASS | A/P PASS | A/F PASS | N/F PASS | A/P PASS | A/P PASS |
| FL-010 Account gate | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-011 Save and My Korea | A/P PASS | A/F PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-012 Local Signal first mission | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-013 Manual 19+ proof | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-014 Auto After19 | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-015 Optional public profile | A/P PASS | A/P PASS | A/P PASS | A/F PASS | A/F PASS | A/P PASS | A/P PASS |
| FL-016 Evidence and merchant trait | A/P PASS | A/P PASS | A/F PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-017 Payment KYC | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |
| FL-018 Labs wallet and bridge | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS | A/P PASS |

Ledger arithmetic: `109 A/P + 14 A/F + 3 N/F = 126`; disposition arithmetic: `123 ACTUAL + 3 NOT_APPLICABLE + 0 GAP = 126`.

## Flow audit census

| Flow | Traveler-service conclusion | Result |
|---|---|---|
| FL-001 | Guest reaches Seoul/Busan food discovery; search/filter/list/map/fallback and place facts support a decision without identity. | PASS |
| FL-002 | Locked After19 preview leaves ordinary facts visible and returns from age proof to the exact venue. | PASS |
| FL-003 | Table selection, join failure/retry, confirmed chat, device-local image failure, feedback, report, and reload membership are covered. | PASS |
| FL-004 | Cancel/decline preserve state; simulated receipt and separate visit proof enforce the 9→10 milestone. | PASS |
| FL-005 | Korean-local Person verification uses the clearly simulated OmniOne CX path and restores the draft. | PASS |
| FL-006 | Residence Card NOT_CONFIGURED is explicit; passport alternate is offered and exact signal intent returns once. | PASS |
| FL-007 | Short-term first run, preferences, guest escape, fallback, completion, and map return are covered; retry is contractually N/A. | PASS |
| FL-008 | Korean-local onboarding does not pre-emptively start CX; fallback ends on a usable guest map; retry is N/A. | PASS |
| FL-009 | Resident onboarding does not pre-emptively start Residence verification; fallback ends on a usable guest map; retry is N/A. | PASS |
| FL-010 | Save invokes Account just in time; cancel/failure/retry/completion retain the canonical venue. | PASS |
| FL-011 | Save failure is dismissible and retryable; persistence into My and exact-place return are covered. | PASS |
| FL-012 | Required contribution content, draft-preserving failure, retry, narrow trust effects, and venue return are covered. | PASS |
| FL-013 | Manual After19 confirm/cancel/failure/retry and map return keep Age independent from other gates. | PASS |
| FL-014 | Fixed-KST auto mode, manual off, expiry reason, re-check, reload, and same-session behavior are covered. | PASS |
| FL-015 | Consent is per profile field; failures preserve prior values; the four trust axes remain independent. | PASS |
| FL-016 | Official facts, unknown/stale fields, limited trait eligibility, retry, and no-safety-guarantee wording are covered. | PASS |
| FL-017 | Payment KYC is separate, returns to the same checkout, and changes only Payment KYC before receipt. | PASS |
| FL-018 | Labs opt-in, signer/quote, cancel, ordered failure, retry, simulated receipt, persistence, and unchanged-assets boundaries are covered. | PASS |

## Visual and artifact census

| Dimension | Audited evidence |
|---|---:|
| Frozen snapshot ledger | 300 rows, all `FROZEN` |
| Snapshot SHA-256 comparison | 300 match, 0 mismatch |
| Reachable visual cases | 50 / 50 |
| Distinct states | 48 / 48 |
| 360×800 | 50 / 50 |
| 390×844 | 50 / 50 |
| 430×932 | 50 / 50 |
| 768×1024 | 50 / 50 |
| 801×1000 | 50 / 50 |
| 1440×1000 | 50 / 50 |
| EN | 198 / 198 |
| KO | 102 / 102 |
| Frames visually inspected | 300 / 300 |

The 109 pixel-linked checkpoint cells resolve through the allowed checkpoint-to-pixel registry into the 50 cases above. The 17 functional-only cells are exactly: `FL-003 CANCEL`; `FL-005 CANCEL/TERMINAL/RETURN`; `FL-006 CANCEL/TERMINAL/RETURN`; `FL-007 ERROR/RETRY`; `FL-008 ERROR/RETRY`; `FL-009 ERROR/RETRY`; `FL-011 DECISION`; `FL-015 ERROR/RETRY`; and `FL-016 CANCEL`. The three onboarding RETRY cells are the only NOT_APPLICABLE entries; their contracts deliberately fall through to the usable guest map and specify no retry surface.

## Raw severity and completion

`S0=0 · S1=0 · S2=0 · S3=0`.

Coverage is **COMPLETE**: 18/18 flows, 126/126 checkpoints, 300/300 frames, and zero gaps. Verdict is **CLEAN**.
