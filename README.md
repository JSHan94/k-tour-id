# ONDO 溫圖

ONDO 溫圖 is a map-first Korea food and travel product. It combines 400 official Seoul and Busan food-service records with a clearly separated Jeju editorial collection, then connects discovery to saved places, Tables and an optional privacy-preserving K-Tour ID travel credential flow.

`溫` means warmth and `圖` means map. ONDO remains the international product name; `溫圖` is its Hanja signature. This repository is currently a clickable mock. Every identity, payment and chain integration is labelled `LIVE`, `SANDBOX` or `SIMULATED`; those receipts are simulations unless a screen explicitly says otherwise.

## Review deployment

The no-login ONDO Vercel URL is published from the personal `woogieboogie-jl/ondo` repository after the frozen QA commit passes. The existing K-Tour ID deployment remains historical and is not renamed or overwritten.

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

## Demo routes

| Route | Purpose |
|---|---|
| `/onboarding` | Path-specific Mobile ID, passport eKYC and residence-card mock states |
| `/pass` | K-Tour ID status, claims and primary presentation action |
| `/present` | Merchant request, selective claim consent, VP creation and success/failure states |
| `/benefits` | Proof-gated benefit, payment, voucher redemption and settlement receipt |
| `/partner/verify` | Merchant request builder and Verifier state machine |
| `/partner/settlements` | Partner reconciliation and chain-anchor evidence |
| `/evidence` | Truthful integration-mode and non-PII event evidence dashboard |

Failure demos:

```text
/present?step=result&result=expired
/present?step=result&result=revoked
/present?step=result&result=offline
```

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

Phase 2 has started: the ONDO experience remains the usability sample, while the K-Tour ID identity subsystem's production requirements remain intact in the root `docs/` set.

- [Project scope memory](./docs/PROJECT_SCOPE_MEMORY.md)
- [Production development specification](./docs/DEVELOPMENT_SPEC.md)
- [Requirements traceability](./docs/REQUIREMENTS_TRACEABILITY.md)
- [Developer decisions required before implementation](./docs/DEVELOPER_DECISIONS_REQUIRED.md)
- [Mandatory Sui integration brief](./docs/SUI_INTEGRATION_BRIEF.md)
- [Current mock architecture summary](./k-tour-id-app/docs/ARCHITECTURE.md)
- [Presenter and judge Q&A](./k-tour-id-app/docs/PRESENTER_QA.md)
- [AI integration notes](./k-tour-id-app/docs/AI_INTEGRATION.md)

The root development specification is the source of truth for production scope. The older app-level handoff is retained as a historical implementation draft and must not override the v2 scope.

## Run locally

```bash
cd k-tour-id-app
pnpm install
pnpm check
pnpm dev
```

Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ONDO_B_ORIGIN` to the deployed ONDO origin so canonical and social-preview URLs resolve correctly.

The current UI uses Next.js 16, React 19, TypeScript and Tailwind CSS v4. ONDO's map-first flow uses MapLibre with a source-attributed OpenFreeMap basemap for prototype validation; this is not a partnership claim. Its visual language is modern white and black with restrained Pulse and editorial accents.

## Repository boundaries

- `k-tour-id-app/` is the active ONDO product mock; the directory name stays stable to preserve historical evidence and test contracts.
- `docs/` contains the canonical K-Tour ID identity-subsystem v2 product, development, Sui and traceability specifications. The ONDO rebrand does not delete or weaken these requirements.
- `legacy-contracts/` contains earlier experimental contracts and is not part of the golden-path production architecture. It must not be deployed or presented as audited product code.
- Brand logos in the mock are target-integration examples, not evidence of partnership.
