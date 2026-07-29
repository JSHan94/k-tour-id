# K-Tour ID

K-Tour ID is a privacy-preserving tourist trust wallet prototype for the 2026 Blockchain & AI Hackathon. It turns a verified identity source into a private travel-service credential, lets the holder present only the eligibility a merchant needs, then connects that proof to a benefit, payment, voucher lifecycle and partner settlement evidence.

> This repository is currently a clickable mock. Every integration is labelled `LIVE`, `SANDBOX` or `SIMULATION`; the current credential, payment and chain receipts are simulations unless a screen explicitly says otherwise.

## Live mock

[Open the private K-Tour ID deployment](https://k-tour-id.phenixnet-jl.chatgpt.site)

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

- [Complete developer handoff](./k-tour-id-app/docs/DEVELOPER_HANDOFF.md)
- [Corrected architecture summary](./k-tour-id-app/docs/ARCHITECTURE.md)
- [Presenter and judge Q&A](./k-tour-id-app/docs/PRESENTER_QA.md)
- [AI integration notes](./k-tour-id-app/docs/AI_INTEGRATION.md)

The developer handoff is the source of truth for screens, states, APIs, chain event envelopes, privacy rules, idempotency, recovery, P0/P1/P2 backlog, acceptance criteria and the 90-second demo.

## Run locally

```bash
cd k-tour-id-app
pnpm install
pnpm check
pnpm dev
```

Set `NEXT_PUBLIC_SITE_URL` to the deployed origin so social-preview URLs resolve to the K-Tour ID deployment.

The current UI uses Next.js 16, React 19, TypeScript and Tailwind CSS v4. Its visual language combines hanji paper, ink, seal red, dancheong navy and gold.

## Repository boundaries

- `k-tour-id-app/` is the active K-Tour ID product mock.
- `legacy-contracts/` contains earlier experimental contracts and is not part of the golden-path production architecture. It must not be deployed or presented as audited product code.
- Brand logos in the mock are target-integration examples, not evidence of partnership.
