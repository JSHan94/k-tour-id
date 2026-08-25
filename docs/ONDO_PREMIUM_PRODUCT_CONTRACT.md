# ONDO Premium Product Contract

This contract translates the current ONDO/PULSE PRD into a consumer-facing product standard. It is additive to the functional fidelity contracts: a redesign may simplify presentation, but it may not remove the underlying state, privacy, return, idempotency, refund, or accessibility guarantees.

## Product promise

ONDO helps a foreign traveler decide where Korea feels alive now, understand why, join a place-based meal, complete only the minimum just-in-time eligibility check, pay with an explicitly non-live OOKRW test balance, and keep the resulting plan or receipt in My Korea.

The normal product path is an app, not a scenario runner. Test fixtures may create failure, expiry, provider-unavailable, insufficient-balance, and retry states, but normal users never choose an outcome.

## Consumer journey

1. Explore: discover official places through clearly distinct, curated Pulse signals.
2. Place: see decision information, directions, save, a contextual Table, Local Signal, and a separate ONDO benefit.
3. Table: review time, seats, language, menu, cost, meeting point, and trust state; join; chat with text or image retry; check in; leave feedback.
4. Eligibility: when required, disclose only the requested predicate and return to the exact pending action. Normal UI is `Continue`, processing, result; failure states are contextual recoveries.
5. Wallet: review a contextual benefit, minimum consent, OOKRW Test debit, receipt, and refund/support. Provider, identity, and money transfer remain truthful non-live boundaries.
6. My Korea: retain saved places, recent places, planned Tables, Local Signal history, and consumer receipts without storing private claims or drafts.

## Visual language

- Warm cartographic utility: near-white paper, graphite text, restrained borders, and Pulse color reserved for live decision context.
- Pulse is never rendered as temperature. No degree symbol is shown.
- Official clusters are neutral count chips. Pulse uses a borderless translucent heat bloom, small core, and compact score/level label. Selection adds a one-shot halo and place capsule.
- Mobile Explore preserves at least half of the usable content viewport as one contiguous map region.
- Desktop at 1024px and wider uses desktop navigation and a map/information composition; it must not look like a stretched phone with a bottom dock.
- Consumer text avoids `walkthrough`, `sample`, `example outcome`, `choose outcome`, `preview`, fixture terminology, raw state-machine names, ledgers, reconciliation, return envelopes, and idempotency language.
- Technical truth appears once in a compact Prototype/Test-mode affordance and in progressive details, not as repeated primary content.
- At most one filled primary action is visible in a decision block. Card nesting is at most two levels.

## Surface hierarchy

### Explore and Place

Pulse score/level, freshness, evidence strength, and decision reason precede source mechanics. The expanded place surface prioritizes Directions, Save, View/Join Table, Add Local Signal, and the contextual ONDO benefit. Official-source provenance remains reachable in a folded information section.

### Tables and eligibility

Tables are place-bound events, not abstract samples. The normal 19+ path explains the minimum predicate and offers `Verify and continue` or `Not now`; it never displays a grid of success/failure/expired/provider outcomes. Dusk/plum visual treatment may distinguish the eligibility moment without borrowing Pulse data colors for controls.

### Travel Pass and Wallet

The landing surface shows independent Account, Person, 19+, and Payment readiness; a travel/test balance; available benefits; recent receipts/refunds; and privacy details. Merchant offers are contextual, not the identity home page. Holder/merchant mirror ledgers remain model/test evidence and are not consumer UI.

## Release acceptance

- Three independent reviews (premium UX/UI, PO/BM, foreign traveler) report no P0/P1 findings.
- Normal consumer DOM contains no outcome picker or internal QA language.
- Explore -> Place -> Table/eligibility/Local Signal/payment -> My Korea is reachable in EN and KO.
- Existing functional reducers and contracts for returnTo, independent predicates, voucher, payment outcomes, idempotency, receipt, refund, and settlement remain green.
- Exact responsive checks cover 320x720, 360x800, 390x844, 430x932, 844x390, 768x1024, 1440x1000, and 200% zoom.
- Controls are at least 44px, visible text is at least 12px, focus/escape/inert/return work, and reduced motion removes non-essential animation.
- Standalone Sites output remains limited to `/`, `/ondo-b`, and `/api/ondo/venues/:venueId`; no legacy product leakage; no deployment is implied by passing this contract.
