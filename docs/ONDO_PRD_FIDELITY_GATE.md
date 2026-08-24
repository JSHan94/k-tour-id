# ONDO PRD fidelity gate

Status: `RED-first contract`
Baseline: Product commit `d91a51bef56be9c2cdda8245b1e3b8fee5064c90`

## Release rule

The release gate is additive: every P0 journey below must remain reachable from `/ondo-b` and usable as an interactive frontend journey. A detached component, a historical test, a static success screen, or deletion of the flow is not acceptance evidence.

The frontend candidate does **not** require a real identity provider, credential issuer, social backend, payment rail, or production account system. Deterministic local fixtures are allowed when the UI clearly says that it is a preview/walkthrough, exposes success and non-success outcomes, and never claims that an external request or real-world verification happened.

## P0 acceptance inventory

| ID | Must-live journey | Acceptance evidence |
|---|---|---|
| `ONDO-P0-GUEST-DISCOVERY` | Guest Explore | Official Seoul/Busan map, list, search, place detail, and directions work without Account, Person, 19+, consent, or provider setup. |
| `ONDO-P0-ONBOARDING` | Three-step onboarding | Step 1 language/value; step 2 intent/persona; step 3 preferences; finish or guest skip lands on the map without verification mutation. |
| `ONDO-P0-MY-KOREA` | My Korea | Saved, recently viewed, and planned-meal collections have distinct labels and semantics. |
| `ONDO-P0-LOCAL-SIGNAL` | Local Signal | A place opens a contribution draft; note/photo contribution has success/failure recovery and returns to the exact place. |
| `ONDO-P0-PULSE-TABLE` | Pulse Table / Connect | At least one place-based Table can be opened, joined through the walkthrough, recovered from cancel/failure/unavailable, and continued into participant chat. |
| `ONDO-P0-AFTER19` | After 19 | Success, cancel, failure/retry, unavailable provider, proof expiry, and the exact originating place/action return are interactive. |
| `ONDO-P0-ID` | ID | Person, 19+, and consent are independent statuses. A one-time interactive walkthrough explains the boundary before completing a local preview. |
| `ONDO-P0-RETURN-TO` | Exact `returnTo` | Original CTA and public context survive the gate; cancel restores context, success resumes once, and failure/unavailable/expiry do not redirect to a generic surface. |
| `ONDO-P0-INCLUSIVE-WEB` | Inclusive responsive web | P0 journeys complete in English and Korean, at 390px and desktop widths, and by keyboard with dialog focus containment and exact focus return. |

Every P0 row has `removalPolicy=FAIL_RELEASE`. Removing a flow, its route, or its evidence keeps the gate RED.

## Truthful walkthrough boundary

- The first walkthrough states that no request is sent to an external provider and that the result is local/simulated.
- The user can choose success, cancel, failure/retry, and unavailable where applicable.
- Person, 19+, and consent never imply one another.
- Only the minimum claim needed for the originating action is displayed.
- Completion consumes the `returnTo` envelope once; raw identity data, credentials, dates of birth, and payment data never enter the URL or envelope.

## Feedback-loop order

1. Run the dedicated fidelity contract. Guest discovery must stay GREEN while missing P0 journeys stay RED.
2. Restore/implement journeys until all P0 contract rows are GREEN. Do not edit the inventory downward to clear failures.
3. Run journey E2E for success, cancel, failure, unavailable, expiry, and exact return.
4. Run EN/KO, 390px/desktop, keyboard, and accessibility checks.
5. Only then run visual polish, official-data truth, security, packaging, build, and deployment checks.

Global word/module denylists are not a product-truth check. Truth is enforced at the user-facing claim boundary: fixture-backed flows must disclose the preview, while official venue facts keep their canonical provenance and unknown fields remain unknown.

## Deferred P2

Wallet, payment, and voucher journeys are P2 and do not block this P0 candidate. Their deferral does not authorize removing Account/Person/19+/consent separation, exact `returnTo`, or the interactive ID/After 19 walkthrough required by P0.

## Commands and expected baseline

`pnpm test:contracts:fidelity` runs only this gate without starting a browser, build, or deployment. On the `d91a51b` directory-only baseline the expected result is:

- GREEN: preserved Guest Explore, ungated Explore, non-removable inventory, provider/P2 scope.
- RED: onboarding, My Korea semantics, Local Signal, Pulse Table/Connect, After 19, ID axes, one-time walkthrough, exact `returnTo`, inclusive web coverage, and the global packaging denylist.

After the approved onboarding restoration is integrated, the checkpoint is intentionally still RED:

- GREEN (6): preserved Guest Explore, ungated Explore, three-step onboarding, scoped legacy-policy loop, non-removable inventory, and provider/P2 scope.
- RED (8): My Korea recent/planned semantics, Local Signal, Pulse Table/Connect, After 19, ID axes, the one-time walkthrough, exact `returnTo`, and inclusive coverage across the still-missing P0 journeys.
