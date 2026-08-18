# ONDO Candidate Evidence Manifest

RUN_ID: `RUN-20260819-0415-KST`

SOURCE_SHA: `9678b2bbf50ac43cf537a38c15bc8359294940c2`

SPEC_SHA: `53a431d1b4c70332b47ab02aa420c812ab883980`

Integration branch: `codex/ondo-integration-20260819`

Execution: `2026-08-19 04:15–06:38 KST`
Gate source of truth: this manifest; `k-tour-id-app/artifacts/qa/**` is staging only.

## Environment

| Item | Value |
|---|---|
| Node / package manager | `25.9.0` / pnpm `10.8.0` |
| Browser | Playwright Chromium · mobile 390×844 · desktop 1440×1000 |
| Runtime route | `/ondo` |
| Map | Leaflet + live OpenStreetMap raster tile dependency |
| Product truth | ONDO/provider/community/commerce/Labs fixtures are `SIMULATED`, `CONTRACT_ONLY`, `NOT_CONFIGURED`, or `DEFERRED` as displayed |

## Accepted automated evidence

| Artifact | Result | Integration SHA | Durable evidence | Staging mapping |
|---|---|---|---|---|
| `QA-TYPECHECK-001` | PASS | `9678b2b` | [qa-summary](./qa-summary.md) | console result; normalized into summary |
| `QA-CONTRACT-001` | 16/16 PASS | `9678b2b` | [qa-summary](./qa-summary.md) | `artifacts/qa/contracts/contract-data.json` · `c257a2c9148d21fcaa943403e423ceefac0cc2c91a64e42d28ec290854176bb3` |
| `QA-E2E-MOBILE-001` | 79/79 PASS; unexpected/flaky/skipped 0 | `9678b2b` | [qa-summary](./qa-summary.md) | command result; normalized into summary |
| `QA-E2E-DESKTOP-001` | 79/79 PASS; unexpected/flaky/skipped 0 | `9678b2b` | [qa-summary](./qa-summary.md) | `artifacts/qa/playwright/results.json` · `8da59f30c52888c8d67f6015e17591321d4f2863b1eec9f69927af94f4b2c2c9` |
| `QA-VIS-MOBILE-001` | 16/16 PASS | `9678b2b` | committed visual baselines + [qa-summary](./qa-summary.md) | deterministic overlay snapshots |
| `QA-VIS-DESKTOP-001` | 16/16 PASS | `9678b2b` | committed visual baselines + [qa-summary](./qa-summary.md) | deterministic overlay snapshots |
| `QA-BUILD-001` | Next build PASS; `/ondo` static | `9678b2b` | [qa-summary](./qa-summary.md) | console result; normalized into summary |
| `QA-SITES-001` | Sites build PASS | `9678b2b` | [qa-summary](./qa-summary.md) | console result; normalized into summary |

## Accepted live-map visual evidence

| Artifact | Viewport / locale | SHA-256 | Truth |
|---|---|---|---|
| [final-mobile-live-map.png](./final-mobile-live-map.png) | 390×844 · EN | `f003c96dc0701faa30fb74bd7eb791569afe0bfbf5f94a160eac62518d0612ec` | live OSM tiles + simulated ONDO overlay |
| [final-mobile-place-detail.png](./final-mobile-place-detail.png) | 390×844 · EN | `70622e8db611aa3f53d094ea7b0e73a0422d160bf5d0f591612d4714971611c8` | simulated venue/ONDO content |
| [final-desktop-live-map.png](./final-desktop-live-map.png) | 1440×1000 · KO | `f2776ee9a7d06b27a66f7aac991314d923ac3e6b1020d17e57e7ff4ef6f9a5f3` | live OSM tiles + simulated ONDO overlay |
| [final-desktop-place-detail.png](./final-desktop-place-detail.png) | 1440×1000 · KO | `6a505ab1884be22a3aa1e1c8183693dc9c90eb4a2e3e0ffb19e06d9016a5804e` | simulated venue/ONDO content |

## QA loop ledger

| Loop | Reviewers | Closure |
|---|---|---|
| QA 1 | Map / Identity / Product | route, returnTo, persistence, accessibility and pixel findings fixed through `beb79b7` |
| QA 2 | Map / Identity / Product | expiry, structured outcomes, context/readability and runtime collectors fixed through `8b67acb`, `b2ed025` |
| QA 3 | Map / Identity / Product | S0 0 · S1 0; final timestamp/12px/tile evidence fixed in `9678b2b`; focused closure S2 0 |

## Release ledger

| Item | Result |
|---|---|
| Requirements | 19/19 final grades recorded in As-built |
| Flows | 18/18 Passed at frontend/simulation depth |
| Critical / High | 0 / 0 |
| Known gaps | external identity/KYC/payment/bridge/moderation/data operations remain deferred and truth-labeled |
| Candidate | `APPROVED FOR FRONTEND DEMO DEPLOYMENT` |
| Deployment | succeeded · `https://k-tour-id.phenixnet-jl.chatgpt.site/ondo` · owner-only private access · remote HTTP 200 |
| Rollback | prior static `/ondo` prototype at source `1ca95f0` |
