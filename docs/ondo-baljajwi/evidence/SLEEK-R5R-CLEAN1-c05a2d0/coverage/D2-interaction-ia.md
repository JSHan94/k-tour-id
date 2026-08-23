# D2 Interaction & IA coverage — CLEAN round 1

## Frozen census

| Measure | Verified disposition |
|---|---|
| Flows | `18/18` |
| Checkpoints | `126/126` |
| Registry | `123 ACTUAL + 3 reasoned N/A + 0 GAP` |
| Cases / states | `50/50 cases · 48/48 states` |
| Frames | `300/300` committed PNGs inspected |
| Locales | `EN 198 · KO 102` |
| File integrity | `300` unique paths; missing `0`; SHA mismatch `0`; PNG/IHDR dimension mismatch `0`; duplicates `0` |

| Exact viewport | Frames inspected | Census disposition |
|---|---:|---|
| `360×800` | 50 | COMPLETE |
| `390×844` | 50 | COMPLETE |
| `430×932` | 50 | COMPLETE |
| `768×1024` | 50 | COMPLETE |
| `801×1000` | 50 | COMPLETE |
| `1440×1000` | 50 | COMPLETE |
| **Total** | **300** | **COMPLETE** |

Each `ACTUAL` below was checked by its mapped committed pixel evidence and, where the helper marks it functional-only, by a fresh live Chromium context. `N/A` is used only for the three registry-declared onboarding RETRY checkpoints and retains the canonical reason.

## Per-flow checkpoint dispositions

| Flow | Entry | Decision | Cancel | Error | Retry | Terminal | Return | Checkpoints | Exercise disposition |
|---|---|---|---|---|---|---|---|---:|---|
| FL-001 Guest Discover | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | First entry/guest; Seoul map/list/search/filter/place; map abort kept list usable and retry advanced attempt `1→2`; offline/online; direct URL, Back/Forward/reload, exact city/place context. |
| FL-002 Age proof to exact After19 venue | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Locked exact venue; age-only intent; Escape preserved lock and venue; failure/retry; `AGE-VERIFIED`; exact unlocked venue return. |
| FL-003 Table to image chat to feedback | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Tables entry/join; network error/retry; joined chat; report ownership; leave-confirm cancel; feedback terminal; reload returned to joined Table. |
| FL-004 Checkout to stamp milestone | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Exact venue checkout; KRW/OOKRW decision; cancel/decline/retry; simulated receipt; payment did not stamp; unique visit moved `9→10`; venue/My return evidence. |
| FL-005 Korean CX | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Korean Local Signal invoked CX; cancel preserved Korean draft; simulated failure/retry; only `PER-VERIFIED` advanced; original sheet returned. |
| FL-006 Residence Card | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Resident signal intent; cancel preserved exact draft; unsupported result; passport-only alternate; `PER-VERIFIED` only; exact sheet return. |
| FL-007 Short-term onboarding | ACTUAL | ACTUAL | ACTUAL | ACTUAL | N/A | ACTUAL | ACTUAL | 7/7 | First guide, intent/preferences, guest cancel, injected validation fallback, terminal usable guest map, nation/map return. N/A: validation failure intentionally falls through to the usable map; no retry screen is specified. |
| FL-008 Korean local onboarding | ACTUAL | ACTUAL | ACTUAL | ACTUAL | N/A | ACTUAL | ACTUAL | 7/7 | Korean-local intent, guest cancel, injected fallback, terminal map without CX, real B shell return. N/A: fallback is the terminal Guest map; CX is not started here. |
| FL-009 Resident onboarding | ACTUAL | ACTUAL | ACTUAL | ACTUAL | N/A | ACTUAL | ACTUAL | 7/7 | Resident intent, guest cancel, injected fallback, terminal map without Residence gate, real B shell return. N/A: fallback is the terminal Guest map; Residence Card is not started here. |
| FL-010 Account gate | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Save intent owned the account modal; Escape returned focus to Save; failure/retry; `ACC-ACTIVE` and one save; same venue. Rapid double activation produced one modal and dead background hit target. |
| FL-011 Save and My Korea | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Local save kept venue; error dismissal remained unsaved; deterministic failure/retry reached `Saved`; reload persisted into My Korea; card returned to exact venue ID. |
| FL-012 Local signal first mission | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Empty submit disabled; draft cancel returned exact venue; failure preserved draft; retry/clean success; only Visit/Contribution axes; same-venue return. |
| FL-013 Manual 19+ proof | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | After 19 prompt; Escape to normal ONDO; proof failure/retry; `AGE-VERIFIED/A19-ON`; B map available. |
| FL-014 Auto After19 | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Fixed KST guard banner; manual off; expired-proof reason; `Check 19+ again` reopened prompt/gate; auto terminal; manual-off survived reload. |
| FL-015 Optional public profile | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | ID four-axis trust; three independent consent controls; cancel retained prior fields; `profile=failure` retained fields; retry saved only selection; returned to ID. |
| FL-016 Evidence and merchant trait | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Official place source/Before you go; Labs truth labels; venue and Labs sheet close; unknown/ineligible trait error/retry; limited eligibility with no safety guarantee; parent return. |
| FL-017 Payment KYC | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | Checkout Payment KYC intent; modal owned payment task; Escape returned same checkout; failure/retry; only `PKY-VERIFIED`; same checkout/receipt path. |
| FL-018 Labs wallet and bridge | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | ACTUAL | 7/7 | My Korea opt-in; explicit simulated Sui Testnet signer/quote; cancel kept assets; ordered failure; fresh quote reached confirmation; simulated success receipt at `destination_confirmed`; reload returned to My Korea. |
| **Total** | **18/18** | **18/18** | **18/18** | **18/18** | **15 ACTUAL + 3 N/A** | **18/18** | **18/18** | **126/126** | **COMPLETE · 123 ACTUAL + 3 reasoned N/A + 0 GAP** |

## Interaction/IA cross-checks

- Navigation and state restoration: direct entry, selected venue/city query, Back, Forward, reload, My Korea exact return, joined Table reload, Labs reload, and focus return all preserved the owning context.
- Surface ownership: account, person, age, payment, report, checkout, profile, Local Signal, and Labs layers exposed one active owner with intent-specific copy; rapid Save activation did not duplicate the gate, and the covered Save target was not hit-testable.
- Controls: filter toggles persisted across reload; disabled empty submission remained dead; staged checkout/bridge actions were unavailable until prerequisites; cancel paths did not advance protected state axes.
- Truth boundaries: official-source/transliteration labels, simulated scores, provider-neutral gate semantics, OOKRW read-only settlement, Labs simulation/network wording, and limited merchant traits matched the canonical contracts.

Coverage status: `COMPLETE · CLEAN`, raw `S0=0 · S1=0 · S2=0 · S3=0`.
