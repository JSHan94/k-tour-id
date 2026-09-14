# ONDO 溫圖

ONDO 溫圖 is a map-first Korea food and travel product. It combines 400 official Seoul and Busan food-service records with a clearly separated Jeju editorial collection, then connects discovery to saved places, Tables and an optional privacy-preserving K-Tour ID travel credential flow.

`溫` means warmth and `圖` means map. ONDO remains the international product name; `溫圖` is its Hanja signature. This repository is a clickable mock. Identity, funding, payment and chain outcomes are **simulated**; a sample credential, ticket or receipt is not external confirmation.

## Developer handoff — start here

For the September 21 submission, start with [해커톤 연동 개발 요약](./docs/HARVEY_HACKATHON_HANDOFF_2026-09-14.md), then [Sui 필수 통합 추가 명세](./docs/HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md) and the [1주 해커톤 통합 개발안](./docs/HACKATHON_ONE_WEEK_SPEC_2026-09-14.md). **CX, OpenDID, OmniOne Chain and Sui are all required by the team.** The same nonfinancial entitlement journey adds real Move, zkLogin/PTB and a user-authorized, bounded AI agent. The addendum takes precedence for scope and execution order; Sui staffing and readiness must be confirmed before treating the original one-week schedule as feasible. Financial/reservation integrations, bridge and passport/residence integrations remain mock. Program registration, submission eligibility and matching-prize terms require separate confirmation. The full-product handoff below remains the longer-term reference.

Read [개발자 시작 문서](./docs/DEVELOPER_START_HERE.md) for the current mock → API/SDK/backend work map and implementation order. Start from branch `handoff/harvey-20260914`, which contains the app and docs together. This is a source snapshot; commit IDs in historical release notes describe prior deployments, not checkout targets in this branch.

### Run the handoff

Requires Node.js 22.13+ and pnpm 10.8.0. No provider credentials are needed to run the mock.

```bash
git clone --branch handoff/harvey-20260914 --single-branch https://github.com/woogieboogie-jl/k-tour-id.git k-tour-id-handoff
cd k-tour-id-handoff/k-tour-id-app
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:contracts
pnpm build:vercel:ondo-b
pnpm exec next start .ondo-b-standalone -p 3438
```

Open `http://localhost:3438`. Contract tests regenerate the standalone stage, so stop this server before rerunning them.

The acceptance boundary is **complete mock journeys + matching developer requirements**. Actual integrations are the developer's work, including provider SDK/handoff adapters in the frontend.

## Production deployment

Open the [production app](https://ondo-tau.vercel.app), deployment source/runtime `e2ad7c4`, **Ready**. The [place After 19 fix record](./docs/PLACE_AFTER19_FIX_2026-09-14.md) tracks the exact deployment and verification status. The After 19 confirmation now opens above retained place details, with the same place, scroll position and focus restored on return. Local checks passed: 833 contracts, typecheck, standalone build/scan, HTTP probe and 5 public-route browser cases. New-production HTTP checks and the same 5 public-route cases passed (2.0 minutes, one worker, no retries); 5 project-mismatch skips are not counted as executed cases. The [previous map-first entry](./docs/MAP_FIRST_ENTRY_2026-09-14.md) and [map–wallet release](./docs/MAP_WALLET_JOURNEYS_2026-09-12.md) preserve their own historical evidence. This is a publicly deployed **mock**: no actual identity, payment, reservation or chain provider was added. Earlier [production](./docs/PRODUCTION_RELEASE_2026-09-12.md) and [full-journey QA](./docs/FINAL_JOURNEY_QA_2026-09-11.md) remain historical.

## Golden flow

```text
Identity source
  → K-Tour service credential (VC)
  → merchant proof request
  → holder reviews claims, purpose and retention
  → holder creates a VP
  → merchant verifies issuer, holder binding, status and policy
  → benefit is applied
  → payment and single-use voucher redemption
  → partner settlement and non-PII audit anchor
```

The K-Tour Visitor Credential is a private service credential. It is not a government ID, visa, residence card or official immigration status.

## Identity paths

| User | Identity source | Adapter boundary |
|---|---|---|
| Korean resident | Government Mobile ID | OmniOne CX |
| Registered foreign resident | Mobile residence card, subject to hackathon environment support | OmniOne CX `coresidence` candidate |
| Short-stay visitor | Passport MRZ/NFC, face match and liveness | Separate passport eKYC adapter; not OmniOne CX |

## Current demo entry points

| Entry from `/` | Purpose |
|---|---|
| Map / city / place sheets | Fresh nation → chosen city heatmap without setup; guest search and explicit place selection |
| ID · Wallet → K-Tour ID | Mobile ID, Residence and Passport setup, consent, holder and recovery |
| ID · Wallet → Wallet / place benefit | Funding, explicit USDC/USDT branch, checkout, voucher and refund |
| Tables → meal plan / restaurant reservation | Separate social-plan and reservation operations |
| Demo → partner verification / settlement / events | Partner request/consent/results, reconciliation, ticket history and event evidence |
| My Korea → Labs | Sample signer, interoperability hypothesis and opt-in visit badge |
| Settings → privacy / account services | Local controls and separate sample account export/revoke/deletion |

Use the in-flow sample controls for failure/cancel/unknown/recovery. Legacy `/onboarding`, `/pass`, `/present`, `/wallet`, `/partner/*` and `/evidence` routes are not current standalone entry points. `/ondo-b` redirects to `/`; the current venue-data route is `/api/ondo/venues/[venueId]`. Proposed `/api/v1/*` endpoints in the spec are **to be implemented**, not existing vendor APIs.

## Integration boundaries

The frontend depends on typed contracts for:

- identity verification;
- credential issuance;
- holder presentation;
- merchant verification;
- policy evaluation;
- payment and refund;
- voucher issuance/redemption;
- partner settlement;
- audit anchoring.

OmniOne CX is the Mobile ID transport/verification layer. OpenDID is the VC, VP and Credential Status infrastructure. OmniOne Chain is designed as the non-PII event-hash anchor. Passport eKYC and payment rails are separate integrations.

## Canonical specifications

The current canonical set is:

- [DEPLOYMENT_SPEC — flow/API/state/security contract](./docs/DEPLOYMENT_SPEC.md)
- [Backend handoff — BE-01–16 work packages](./docs/BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)
- [Hackathon integration matrix — technology scope and evidence](./docs/HACKATHON_INTEGRATION_MATRIX_2026-09-08.md)

Older `DEVELOPMENT_SPEC.md`, traceability, scope memory, Sui brief and app architecture notes are historical context. They do not override the current scope, route packaging or the eight unresolved ADR categories in DEPLOYMENT_SPEC §9. Sui remains user-requested project scope, not a requirement automatically attributed to the DID competition.

## Run locally

```bash
cd k-tour-id-app
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:contracts
pnpm build:vercel:ondo-b
pnpm exec next start .ondo-b-standalone -p 3438
```

Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ONDO_B_ORIGIN` to the deployed ONDO origin so canonical and social-preview URLs resolve correctly.

The current UI uses Next.js 16, React 19, TypeScript and Tailwind CSS v4. ONDO's map-first flow uses MapLibre with a source-attributed OpenFreeMap basemap for prototype validation; this is not a partnership claim. Its visual language is modern white and black with restrained Pulse and editorial accents.

## Repository boundaries

- `k-tour-id-app/` is the active ONDO product mock; the directory name stays stable to preserve historical evidence and test contracts.
- `docs/` contains the current canonical trio above and clearly dated historical records. The ONDO rebrand does not delete identity, privacy or recovery requirements.
- `legacy-contracts/` contains earlier experimental contracts and is not part of the golden-path production architecture. It must not be deployed or presented as audited product code.
- Brand logos in the mock are target-integration examples, not evidence of partnership.
