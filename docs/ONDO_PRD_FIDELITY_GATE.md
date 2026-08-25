# ONDO golden-candidate fidelity gate

Status: `RED-first · additive product contract`

Baseline product commit: `7120032b5952348f308ff1805ec87ef48b8b2379`
Baseline tree: `2c3c8bfb7850fae53341e9aacaf0a83e48402221`

## Decision basis and precedence

This contract is the non-self-referential release inventory for `/ondo-b`. It reconciles, in order:

1. the product owner's latest decision for a cohesive golden demo;
2. `PROJECT_SCOPE_MEMORY.md` and the execution PRD/decision ledger;
3. `TrackNo2_K-STAYBLE_260531.pdf`;
4. `PULSE_KOREA_PRODUCT_DIRECTION.md`;
5. the current implementation.

The root proposal requires an identity-and-tourism wallet, service/benefit/payment/refund/settlement orchestration, and an AI Benefit Router. PULSE requires food discovery with interpretable evidence, freshness, confidence, and honest low-signal states. The execution PRD requires complete success and non-success frontend journeys even when real integrations are absent. The latest decision makes those user journeys release-blocking now while allowing deterministic local state instead of real providers, money, chain, or backend.

Therefore wallet, payment, benefit/voucher, refund, settlement, and AI benefit preview are **not deferred product UX**. Only their actual external integrations are deferred.

## Product and truth boundary

The golden candidate is a production-quality frontend with one explicitly separate `ONDO demo meal offer`. It must never imply that a LOCALDATA record is an official merchant, accepts ONDO payment, or supports any benefit. Official LOCALDATA place facts and the ONDO offer fixture are separate evidence domains.

The offer is deterministic and device-local:

- no AI/model call;
- no payment-provider or merchant-provider call;
- no real OOKRW, fiat debit, chain transaction, settlement, or backend write;
- no provider order completion;
- no official partnership or LOCALDATA merchant-payment-support claim.

The UI may show an `OOKRW_PREVIEW` balance and mirrored holder/merchant entries only when this boundary is visible. Payment success and provider order success remain separate; the provider order stays `NOT_CONNECTED` in this candidate.

## Additive must-live inventory

All IDs below have `removalPolicy=FAIL_RELEASE`. Deleting the UI, model, route reachability, state branch, packaging entry, test, or truthful label keeps the gate RED.

| ID | Must-live journey | Required behavior |
|---|---|---|
| `ONDO-G0-GUEST-DISCOVERY` | Guest discovery | Seoul/Busan official records, map/list/search/place/directions without ID or wallet gates. |
| `ONDO-G0-ONBOARDING` | Onboarding | Language/value, intent, preferences, and guest completion. |
| `ONDO-G0-PULSE-HOT` | Pulse / Hot | Evidence IDs/count, freshness, confidence, `Limited`, `Hot`, and `Too Hot`; no unsupported live-popularity claim. |
| `ONDO-G0-MY-KOREA` | My Korea | Saved, recently viewed, planned meal, and local contribution history retain distinct semantics. |
| `ONDO-G0-LOCAL-SIGNAL-PULSE` | Local Signal → Pulse | Exact-place draft/recovery; a unique post appears as separate `local-device` evidence once; it never changes the shared curated score/count. |
| `ONDO-G0-TABLE` | Pulse Table | Place-based Table, join/recovery, participant chat, leave/report/block. |
| `ONDO-G0-AFTER19` | After19 | Success, cancel, failure/retry, unavailable, expiry, minimum predicate, exact origin return. |
| `ONDO-G0-ID-WALLET` | ID · Wallet | One navigation entry; Person, 19+, and payment axes remain independent; visible preview balance is not fiat/chain value. |
| `ONDO-G0-MEAL-OFFER` | ONDO demo meal offer | Explore → quote → eligibility/benefit → consent → payment/request → provider state → refund/support. |
| `ONDO-G0-PAYMENT` | Stable preview payment | Success, cancel, failure/retry, insufficient balance, and idempotent double-click/replay. |
| `ONDO-G0-BENEFIT-VOUCHER` | Benefit / voucher | Eligibility, minimum spend, expiry, one-use redemption, no double use, refund restoration. |
| `ONDO-G0-REFUND-SETTLEMENT` | Refund / settlement mirror | Holder and merchant share operation/receipt; opposite deltas reconcile; refund reverses once. |
| `ONDO-G0-AI-BENEFIT-PREVIEW` | AI benefit preview | Deterministic policy inputs, recommend/accept/decline, no AI/provider call, no pre-accept money/voucher mutation. |
| `ONDO-G0-RETURN-TO` | Exact `returnTo` | Origin CTA, place, and offer; cancel/failure/insufficient preserve it; success consumes once. |
| `ONDO-G0-INCLUSIVE-WEB` | Inclusive responsive web | EN/KO, 390px/desktop, keyboard completion, focus containment/return, no serious/critical a11y issue. |

The machine-readable inventory is in `tests/helpers/ondo-prd-fidelity.ts`, but tests do not derive expected IDs, module paths, transitions, or artifact contents from that inventory. `tests/contracts/ondo-prd-fidelity.spec.ts` contains a separate literal oracle and executes the production state models via `tests/helpers/ondo-fidelity-runtime-probe.ts`.

## Exact Pulse state contract

Production module: `features/ondo/pulse-b/pulse-model-b.ts`

Exports:

- `PULSE_LEVELS=["peak","hot","rising","warming","low","limited"]`
- `pulseForVenue(venueId, localEvidence?)`

The exact return fields are `{ venueId, cityId, level, score, signalCount, updatedAt, freshness, confidence, evidence, localEvidence }`. The fixed candidate examples are:

| Venue | `level` / UI | score/count | snapshot | confidence/evidence |
|---|---|---|---|---|
| `mois-0021cd596bc5b2a922ad` | `peak` / `Too Hot` affordance | `91` / `24` | `2026-08-25T02:20:00.000Z` · `curated-snapshot` | `high` · `curated-walkthrough` |
| `mois-0348cfe16225dbbcec8a` | `hot` / `Hot` | `84` / `19` | `2026-08-25T02:05:00.000Z` · `curated-snapshot` | `high` · `curated-walkthrough` |
| any canonical ID not in the curated set | `limited` / `Limited` | `null` / `null` | `null` · `limited` | `limited` · empty evidence |

`pulseForVenue(venueId, { tags, postedAt })` adds a separate evidence item with `origin="local-device"` and `localEvidence`, while every base field—level, score, signal count, update time, freshness, and confidence—stays unchanged. Re-rendering the same local input is deterministic. Duplicate persistence is suppressed by the existing `markLocalSignalPosted`/sanitization state boundary. A local device post never promotes `Limited` to `Hot`/`peak` and never invents a shared crowd signal.

The model must be imported directly by the reachable `features/ondo/map/map-entry-b.tsx` and `features/ondo/place/canonical-place-overlay.tsx`; no parallel Pulse entry component is required. The live surfaces expose score/level/evidence/freshness/confidence and equivalent EN/KO labels.

## Exact meal state contract

Production module: `features/ondo/commerce-b/stable-commerce-model-b.ts`

Exports:

- `createStableCommerceBState()`
- `stableCommerceBReducer(state, action)`
- `stableCommerceQuoteDebitB(state)`
- `stableCommerceBalanceB(state)`
- `stableCommerceSettlementB(state)`

Fixed offer:

```text
offerId        meal-offer-gukbap
venueId        mois-0021cd596bc5b2a922ad
kind           MEAL
price          ₩22,000 · 22 OOKRW_PREVIEW
voucher        3 OOKRW_PREVIEW · single use
holder balance 60 OOKRW_PREVIEW
returnTo       START_MEAL_PAYMENT + exact venueId + exact offerId
```

Initial truth/state:

```text
truthBoundary.mode                  DETERMINISTIC_LOCAL_PREVIEW
aiCall/paymentProviderCall          false/false
chainCall/backendCall               false/false
officialMerchantPaymentSupport      false
payment/providerOrder               idle/NOT_CONNECTED
holder/merchant balance             60/0
voucher                             available
ledger                              empty
```

Exact reducer events:

- `SET_VOUCHER { selected: true|false }` moves `available ↔ selected` without a debit.
- `CONFIRM` opens one pending confirmation and increments the confirmation count once.
- `PAYMENT_RETURN` has `success`, `failure`, and `insufficient` outcomes. Cancel is a live-UI close/return transition before a provider-return fixture.
- A failed return can run `CONFIRM` and `PAYMENT_RETURN success` again.
- `REFUND` reverses the successful local preview payment.

The AI benefit preview is a visible `RECOMMENDED → ACCEPTED|DECLINED` UI state based on the fixed local inputs `{ offerKind: MEAL, priceKRW: 22000, locale, voucherAvailable: true }`. It explicitly says `NO_AI_OR_PROVIDER_CALL`; no money, payment, or voucher state changes before accept. AI does not decide eligibility or approve payment.

Success debits `19` preview OOKRW after the `3` voucher, moves holder `60→41`, credits merchant mirror `0→19`, consumes the voucher once, creates exactly one `ONDO-LOCAL-20260825-001` receipt, leaves provider order `NOT_CONNECTED`, and consumes `returnTo`. Replaying the same success return—including a UI double-click—returns byte-for-byte equal state: one holder debit, one merchant credit, one voucher consumption, one receipt.

Cancel, failure, and insufficient balance create no ledger entry, do not consume the voucher, and preserve exact `returnTo`. Refund restores holder `41→60` and merchant `19→0`, restores the voucher to `available`, produces a mirrored refund pair, and is itself idempotent. Each payment/refund operation has exactly two ledger entries with the same `operationId` and `receiptId`; their amounts sum to zero.

Required reachable UI/CSS:

- `features/ondo/commerce-b/id-wallet-commerce-b.tsx`
- `features/ondo/commerce-b/id-wallet-commerce-b.module.css`

The entry CTA is `data-testid="canonical-demo-meal-offer-open"`. The cohesive surface is `ondo-b-id-wallet-commerce`; its semantic subcontrols use the `commerce-*` prefix and are exercised by `tests/e2e/ondo-b-production-golden-fidelity.spec.ts`. The flow includes explicit AI accept/decline, success/cancel/fail/retry/insufficient controls, visible OOKRW delta, voucher state, one receipt, holder/merchant ledgers, refund, reset, close, focus return, and an exact serialized public `data-return-to` envelope.

## Standalone positive-inclusion rule

The `/ondo-b` import graph and `scripts/ondo-b-standalone/policy.mjs#SOURCE_FILES` must both positively include `pulse-b/pulse-model-b.ts` and the B-native stable-commerce model/UI/CSS. `prepare:sites:ondo-b` must physically copy all four into `.ondo-b-standalone`.

Artifact scanners may continue rejecting exact retired implementation identifiers such as `CheckoutOverlay`, `ChatOverlay`, `RewardsEntry`, `LabsEntry`, `WalletProvider`, `demo-journey`, `k-tour-id.wallet`, or an erased `"simulation":null`. They may **not** reject required product vocabulary or module paths merely because they contain `Pulse`, `Too Hot`, `After19`, ID/Wallet, payment, benefit, voucher, refund, settlement, OOKRW, or `ONDO demo meal offer`. Deleting a feature can never make packaging pass.

## Deferred actual integrations

Only these implementation classes are deferred:

- `ONDO-EXT-REAL-IDENTITY`: real CX/passport/OpenDID provider execution and credential issuance;
- `ONDO-EXT-REAL-MONEY-CHAIN-BACKEND`: real payment, OOKRW/fiat, chain, provider, settlement, canonical backend, reconciliation, and support operations;
- `ONDO-EXT-BROAD-SERVICE-INTEGRATIONS`: actual transport, delivery, shopping, and reservation integrations.

The root proposal's broad service categories are represented in this golden candidate by one meal offer proving the reusable service orchestration. It must not display fake brand partnerships. Each actual transport/delivery/shopping/reservation integration remains a separate deferred adapter and commercial/security decision.

## RED-first commands and baseline receipt

Static/runtime/packaging contract:

```sh
pnpm exec playwright test tests/contracts/ondo-prd-fidelity.spec.ts tests/contracts/ondo-b-standalone-packaging.spec.ts --config=playwright.contracts.config.ts --workers=1 --retries=0
```

Exact result on product base `7120032b5952348f308ff1805ec87ef48b8b2379` with only this TEST contract applied:

- exit: `1` (intentional RED);
- total: `19`;
- passed: `9`;
- failed: `10`;
- preserved GREEN: build/hosting lane declaration, A hosting identity protection, exact retired-identifier scanner, B onboarding CSS, current Table/After19/return packaging, current Local Signal/Traveler ID packaging, inventory/scope, and ungated guest discovery/onboarding;
- expected RED: prepared positive closure (`B-STANDALONE-003/004/010`), name-safe policy (`B-STANDALONE-007`), `/ondo-b` reachability (`FID-G0-004`), Pulse runtime (`FID-STATE-001`), meal/payment runtime (`FID-STATE-002/003`), and fidelity positive packaging (`FID-PACK-001/002`).

The runtime failures are exact missing-module failures for:

- `features/ondo/pulse-b/pulse-model-b.ts`
- `features/ondo/commerce-b/stable-commerce-model-b.ts`

Live EN/KO/responsive/a11y contract:

```sh
env -u CI PLAYWRIGHT_BASE_URL=<optimized-next-start-url> pnpm exec playwright test tests/e2e/ondo-b-production-golden-fidelity.spec.ts --project=mobile-chromium --project=desktop-chromium --workers=1 --retries=0
```

This live lane is also intentionally RED until the reachable UI is implemented. No server, image, deployment, hosting identity, or product source was changed to obtain the baseline receipt.
