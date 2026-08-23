# D1 · Visual Art Director · coverage ledger

Coverage status: `COMPLETE`

Verdict: `CLEAN`

Raw findings: `S0=0 · S1=0 · S2=0 · S3=0`

## Exact tuple, server, and context

| Item | Exact value |
|---|---|
| Evidence SHA | `875ebf49f89c5842b56dc49e89b127a426fa8490` |
| Product | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Harness | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Canonical digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |
| Server | `http://127.0.0.1:3219/ondo-b` · HTTP `200` |
| Browser | Required in-app Browser selection returned unavailable; required bootstrap troubleshooting was read and the runtime list was empty. Permitted fallback used fresh headless Chromium `151.0.7922.34`. |
| Isolation | Six new contexts, six new storage partitions, one for each exact width; no context or stored state was reused. |

## Blindness attestation

Only the request's strict-blind allowlist was used. No prior/current review, issue/fix/coverage/manifest evidence, other-reviewer material, private A/B deployment, disallowed source, old screenshot/trace/session, or git history/diff/commit-message input was consulted. No snapshot, Product, Harness, or baseline was edited.

## Flow checkpoint ledger

Legend: `A` = ACTUAL browser evidence; `N/A` = reasoned not applicable; `G` = gap. Every cell is one checkpoint disposition.

| Flow | ENTRY | DECISION | CANCEL | ERROR | RETRY | TERMINAL | RETURN | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `FL-001` Guest Discover | A | A | A | A | A | A | A | `7A` |
| `FL-002` Age proof → exact After19 venue | A | A | A | A | A | A | A | `7A` |
| `FL-003` Table → image chat → feedback | A | A | A | A | A | A | A | `7A` |
| `FL-004` Checkout → stamp milestone | A | A | A | A | A | A | A | `7A` |
| `FL-005` Korean CX | A | A | A | A | A | A | A | `7A` |
| `FL-006` Residence Card | A | A | A | A | A | A | A | `7A` |
| `FL-007` Short-term onboarding | A | A | A | A | N/A¹ | A | A | `6A+1N/A` |
| `FL-008` Korean local onboarding | A | A | A | A | N/A² | A | A | `6A+1N/A` |
| `FL-009` Resident onboarding | A | A | A | A | N/A³ | A | A | `6A+1N/A` |
| `FL-010` Account gate | A | A | A | A | A | A | A | `7A` |
| `FL-011` Save / My Korea | A | A | A | A | A | A | A | `7A` |
| `FL-012` Local signal / first mission | A | A | A | A | A | A | A | `7A` |
| `FL-013` Manual 19+ proof | A | A | A | A | A | A | A | `7A` |
| `FL-014` Auto After19 | A | A | A | A | A | A | A | `7A` |
| `FL-015` Optional public profile | A | A | A | A | A | A | A | `7A` |
| `FL-016` Evidence / merchant trait | A | A | A | A | A | A | A | `7A` |
| `FL-017` Payment KYC | A | A | A | A | A | A | A | `7A` |
| `FL-018` Labs wallet / bridge | A | A | A | A | A | A | A | `7A` |
| **Total** | **18A** | **18A** | **18A** | **18A** | **15A+3N/A** | **18A** | **18A** | **`126/126 = 123A + 3N/A + 0G`** |

¹ `FL-007 RETRY`: validation failure deliberately falls through to a usable Guest map; the canonical contract specifies no retry screen.  
² `FL-008 RETRY`: the fallback is the terminal Guest map and CX is intentionally not started during onboarding.  
³ `FL-009 RETRY`: the fallback is the terminal Guest map and Residence Card is intentionally not started during onboarding.

## Frozen visual matrix ledger

| Exact viewport | Cases | Distinct states | EN | KO | PNG inspected | Live role-critical surface |
|---|---:|---:|---:|---:|---:|---|
| `360×800` | 50/50 | 48/48 | 33 | 17 | 50/50 | onboarding + focus/hover/pressed |
| `390×844` | 50/50 | 48/48 | 33 | 17 | 50/50 | KO venue/detail; EN ready Seoul cartography |
| `430×932` | 50/50 | 48/48 | 33 | 17 | 50/50 | EN Table detail/join |
| `768×1024` | 50/50 | 48/48 | 33 | 17 | 50/50 | EN After 19 decision modal |
| `801×1000` | 50/50 | 48/48 | 33 | 17 | 50/50 | KO identity/four-axis trust |
| `1440×1000` | 50/50 | 48/48 | 33 | 17 | 50/50 | EN Labs truth/signer/bridge surface |
| **Total** | **50/50 registry cases** | **48/48 registry states** | **198/198** | **102/102** | **300/300** | **six/six exact widths** |

All `300/300` ledger SHA-256 values matched the committed PNGs. All `300/300` physical PNG dimensions matched the declared width and height. Each exact width has the complete identical 50-case registry, so the fixed cross-product is `50 cases × 6 widths = 300 PNG`.

## Visual review dispositions

| Review axis | Coverage | Disposition |
|---|---|---|
| `발자취` translation | onboarding, nation/city, place, My Korea, ID, Tables, Labs | Abstracted restraint, whitespace, hairlines, and single-primary hierarchy are present without brand/layout imitation. |
| Hierarchy/rhythm/whitespace/typography | 48 states × six widths | Complete; no clipping, collapsed hierarchy, density break, or type-scale defect found. |
| Cartography and heat focal point | nation, live city, filtered map, fallback, peek/detail, After 19 | Complete; heat scores lead, neutral counts remain distinct, truth/legend/attribution remain legible. |
| Modal/backdrop layering | account/person/age/payment gates, resets, report, Tables/chat, checkout, Labs | Complete; active layer, backdrop, parent context, dismiss affordance, and semantic status remain distinct. |
| Responsive state consistency | all 50 cases at all six widths | Complete; `0` horizontal overflow in six live contexts and no frozen-matrix clipping found. |
| Locale consistency | `198 EN + 102 KO` PNG | Complete; no KO/EN structural divergence or action loss found. |
| Hover/pressed/focus | mobile primary and desktop outlined action; keyboard focus on live role-critical surfaces | Complete; visible focus ring and distinct hover/pressed transforms observed. |

## Completeness statement

`18/18 flows · 126/126 checkpoints = 123 ACTUAL + 3 reasoned N/A + 0 GAP · 50/50 cases · 48/48 states · 300/300 PNG · six exact widths · KO/EN complete · raw S0=0 · raw S1=0 · raw S2=0 · raw S3=0 · COMPLETE`
