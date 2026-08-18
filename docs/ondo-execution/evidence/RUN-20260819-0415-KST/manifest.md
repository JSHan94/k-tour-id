# ONDO Candidate Evidence Manifest

RUN_ID: `RUN-20260819-0415-KST`  
SOURCE_SHA: `1ca95f0cb5d1da006bbefa6388c6ecd3ad5d2267`  
SPEC_SHA: `53a431d1b4c70332b47ab02aa420c812ab883980`  
CURRENT_SHARED_SHA: `655fa4177b1b0d47993861aef0b0a08fedfc5715`
Integration branch: `codex/ondo-integration-20260819`  
Execution started: `2026-08-19 04:15 KST`  
Gate source of truth: this manifest. `k-tour-id-app/artifacts/qa/**` is staging only.

## Environment

| Item | Value |
|---|---|
| Node | `25.9.0` |
| pnpm | `10.8.0` |
| Browser | Playwright Chromium |
| Baseline route | `http://localhost:3107/ondo` |
| Baseline app truth | Existing static prototype; retained only as rollback fallback |
| Target truth | Frontend Candidate with explicit `SIMULATED`, `CONTRACT_ONLY`, and `DEFERRED` boundaries |

## Accepted evidence

Artifact rows are added only after Root reproduces them at the recorded integration SHA. A staging result without a durable mapping remains `Not run` for G5/G6.

| Artifact ID | REQ / Flow / Test | Command | Exit | Integration SHA | Reviewer / time | Locale / viewport / scenario | Staging path + SHA-256 | Durable path + SHA-256 | Truth | Status |
|---|---|---|---:|---|---|---|---|---|---|---|
| BASE-TYPECHECK-001 | Baseline | `pnpm typecheck` | 0 | `a640365` | Root · 2026-08-19 04:15 KST | — | command result · not persisted | Pending final log promotion | Baseline | accepted |
| BASE-BUILD-001 | Baseline | `pnpm build` | 0 | `a640365` | Root · 2026-08-19 04:17 KST | — | command result · not persisted | Pending final log promotion | Baseline | accepted |
| BASE-SITES-001 | Baseline | `pnpm build:sites` | 0 | `a640365` | Root · 2026-08-19 04:18 KST | — | command result · not persisted | Pending final log promotion | Baseline | accepted |
| BASE-CONTRACT-001 | CONTRACT-DATA-001..016 | `pnpm test:contracts` | 0 | `a640365` | Root · 2026-08-19 04:25 KST | 16/16 | command result · not persisted | Pending final log promotion | SIMULATED contract | accepted |
| BASE-PX-001 | Baseline visual | Playwright screenshot | 0 | `a640365` | Root · 2026-08-19 04:24 KST | EN · 390×844 · guide | `k-tour-id-app/artifacts/qa/baseline/ondo-mobile-guide.png` · `c243ada682e5e453c1d5dc369a88f1ad7f93a95feab49eab48c325dbc06829cb` | Not promoted; baseline comparison only | Baseline | staging |
| BASE-PX-002 | Baseline visual | Playwright screenshot | 0 | `a640365` | Root · 2026-08-19 04:24 KST | EN · 390×844 · map | `k-tour-id-app/artifacts/qa/baseline/ondo-mobile-map.png` · `dad3a0ae19866d914f160135d762189882dd17be868e2db574909496bd265d19` | Not promoted; baseline comparison only | Baseline | staging |
| BASE-PX-003 | Baseline visual | Playwright screenshot | 0 | `a640365` | Root · 2026-08-19 04:24 KST | EN · 1440×1000 · guide | `k-tour-id-app/artifacts/qa/baseline/ondo-desktop-guide.png` · `3ab8cda9c2d081c0b4829e1f916f0b88fd64c24e30a58f67a79673d81aadfa93` | Not promoted; baseline comparison only | Baseline | staging |
| BASE-PX-004 | Baseline visual | Playwright screenshot | 0 | `a640365` | Root · 2026-08-19 04:24 KST | EN · 1440×1000 · map | `k-tour-id-app/artifacts/qa/baseline/ondo-desktop-map.png` · `c143fb70b44f97842d960568c55192d443b609d0fbccdee83d14451f3f7e4573` | Not promoted; baseline comparison only | Baseline | staging |

## Worker acceptance

| Worker | Branch | Base SHA | Accepted commit | Integration result | State |
|---|---|---|---|---|---|
| Map / Place | `codex/ondo-map-20260819` | `a640365` | — | — | running |
| Identity / After19 | `codex/ondo-identity-20260819` | `a640365` | — | — | running |
| Connect / Commerce / Labs | `codex/ondo-connect-20260819` | `a640365` | — | — | running |

## Release ledger

| Item | Result |
|---|---|
| QA Loop 1 | Not run |
| QA Loop 2 | Not run |
| Critical / High | Not evaluated |
| Deployment | Not started |
| Rollback point | `1ca95f0` existing `/ondo` prototype |
