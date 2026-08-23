# CLEAN round 1 · D3 Inclusive & Responsive coverage

Status: **COMPLETE · NOT CLEAN**

## Tuple, server, context, blindness

| Field | Result |
|---|---|
| Evidence SHA | `875ebf49f89c5842b56dc49e89b127a426fa8490` |
| Product | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Harness | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |
| Server | `http://127.0.0.1:3219/ondo-b` · HTTP `200` before and after review |
| Browser context | In-app runtime unavailable after mandated troubleshooting (`browsers.list() = []`); locked repo Playwright `1.62.1` Chromium fallback; new non-persistent context per scenario, cleared cookies, no reused storage/profile |
| Strict blindness | Honored: only live `/ondo-b`, four frozen evidence files, two allowed helpers, three allowed pixel specs/snapshots, and named canonical docs inspected |

The digest value agrees across the allowlisted frozen receipt/gate material. Constituent validation independently matched every one of the `300` ledger SHA-256 values and PNG dimensions; the ledger itself matches its sealed SHA-256 `ac90e46afb7813dc5800d39767e3b8431f42f9ed96ca2a75bdbd45b5163ebefb`.

## Required totals

| Coverage dimension | Result |
|---|---:|
| Flows | `18/18` |
| Checkpoints | `126/126 = 123 ACTUAL + 3 reasoned N/A + 0 GAP` |
| Checkpoint evidence modes | `109 pixel + 17 functional_only = 126` |
| Visual cases | `50/50` |
| Distinct states | `48/48` |
| Frozen PNG | `300/300` |
| Exact widths | `6/6` |
| Locales | `KO + EN` · `102 + 198 = 300` rows |
| Raw findings | `S0=0 · S1=0 · S2=4` |
| S3 separate | `S3=0` |
| Completeness | `COMPLETE` |
| Clean status | `NOT CLEAN` |

## 18-flow / 126-checkpoint ledger

| Flow | Actual | N/A | Gap | Pixel | Functional only | Audit |
|---|---:|---:|---:|---:|---:|---|
| `FL-001` | 7 | 0 | 0 | 7 | 0 | complete |
| `FL-002` | 7 | 0 | 0 | 7 | 0 | complete |
| `FL-003` | 7 | 0 | 0 | 6 | 1 | complete |
| `FL-004` | 7 | 0 | 0 | 7 | 0 | complete |
| `FL-005` | 7 | 0 | 0 | 4 | 3 | complete |
| `FL-006` | 7 | 0 | 0 | 4 | 3 | complete |
| `FL-007` | 6 | 1 | 0 | 5 | 2 | complete |
| `FL-008` | 6 | 1 | 0 | 5 | 2 | complete |
| `FL-009` | 6 | 1 | 0 | 5 | 2 | complete |
| `FL-010` | 7 | 0 | 0 | 7 | 0 | complete |
| `FL-011` | 7 | 0 | 0 | 6 | 1 | complete |
| `FL-012` | 7 | 0 | 0 | 7 | 0 | complete |
| `FL-013` | 7 | 0 | 0 | 7 | 0 | complete |
| `FL-014` | 7 | 0 | 0 | 7 | 0 | complete |
| `FL-015` | 7 | 0 | 0 | 5 | 2 | complete |
| `FL-016` | 7 | 0 | 0 | 6 | 1 | complete |
| `FL-017` | 7 | 0 | 0 | 7 | 0 | complete |
| `FL-018` | 7 | 0 | 0 | 7 | 0 | complete |
| **Total** | **123** | **3** | **0** | **109** | **17** | **126/126** |

The three N/A entries are the explicitly reasoned onboarding retry checkpoints for `FL-007`, `FL-008`, and `FL-009`; each contract falls through to a usable Guest map rather than defining a retry screen.

## Visual registry audit

| Exact viewport | Cases | States represented through registry | Locale rows | PNG/hash/dimension audit |
|---|---:|---:|---:|---|
| `360×800` | 50 | registry-complete | 33 EN + 17 KO | `50/50` |
| `390×844` | 50 | registry-complete | 33 EN + 17 KO | `50/50` |
| `430×932` | 50 | registry-complete | 33 EN + 17 KO | `50/50` |
| `768×1024` | 50 | registry-complete | 33 EN + 17 KO | `50/50` |
| `801×1000` | 50 | registry-complete | 33 EN + 17 KO | `50/50` |
| `1440×1000` | 50 | registry-complete | 33 EN + 17 KO | `50/50` |
| **Total** | **300** | **48 distinct states / 50 cases** | **198 EN + 102 KO** | **300/300** |

Audit method: every PNG was placed in a labeled per-viewport contact sheet and inspected; high-risk onboarding, profile, place, Table, local-signal failure, unsupported identity, checkout stamp, reset confirmation, and Labs failure frames were also inspected at original size. All `300` ledger paths are unique, all are `FROZEN`, total PNG bytes are `21,919,032`, and IHDR dimension mismatches are `0`.

## Live inclusive/responsive probe coverage

| Probe | Viewport / locale / state | Result |
|---|---|---|
| Keyboard order + focus style | `390×844`, KO+EN; onboarding, place, account gate | complete; finding `D3-R1-INC-003` |
| Modal trap, Escape, backdrop, restore | onboarding, place, account gate | place/gate pass; onboarding finding `D3-R1-INC-001` |
| Inert modal isolation | onboarding, place, account gate | pass |
| Landmarks and accessible names | nation/map, place, identity gate | complete; finding `D3-R1-INC-002` |
| Target size + center hit | representative visible controls; all six exact widths on place | no visible target below `44×44`; representative center hits pass |
| Contrast | onboarding, place, account gate, Labs | no confirmed failure; manual ratios `4.66:1` and `5.06:1` resolved axe overlap incompletes |
| Non-color status cues | heat, success/error/unsupported/pending/simulated frames | pass |
| Overflow/reflow | six exact widths, KO+EN, place | document/root overflow `0` throughout |
| 320px | `320×800`, KO+EN, place | pass: overflow `0`, targets pass, keyboard scrolling reaches actions |
| 200% proxy | `640×800` reflow proxy, KO+EN, place | pass |
| 400% proxy | `320×800` reflow proxy, KO+EN, place | pass |
| Short-height landscape | `844×390`, `667×320`, EN city/place | usable with overflow `0`; finding `D3-R1-RESP-004` |
| Reduced motion | `390×844`, EN city/place | media query active; duration clamped to `0.00001s`, no persistent motion |
| KO/EN wrapping | six matrix widths plus `320`, `640`, landscape | complete; only the landscape EN ellipsis finding remains |

## Completeness decision

There is no coverage gap: all `18` flows, all `126` checkpoints, all `50` cases, all `48` states, all `300` PNGs, all six exact widths, and KO+EN were audited. Coverage is therefore **COMPLETE**. Because raw `S2=4`, the review verdict remains **NOT CLEAN**.
