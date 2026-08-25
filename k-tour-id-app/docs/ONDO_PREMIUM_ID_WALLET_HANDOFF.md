# ONDO Premium ID / Wallet integration handoff

The owned ID / Wallet lane is complete without changing the provider, Place, Tables, map, app shell, or My Korea.

## Preserved contracts

- Person and 19+ remain independent local results.
- Eligibility returns to the exact caller with every existing `LocalCheckOutcome`.
- Contextual commerce still uses the existing voucher, confirm, payment-return, idempotency, paired ledger, refund, and `returnTo` reducer contracts.
- Normal UI exposes no outcome selector, holder/merchant ledger, reconciliation, reset, or raw state-machine control.
- Test-only failures are injected before hydration with `window.__ONDO_B_QA__` (`wallet: "failure"`, `payment: "failure" | "insufficient"`, or `eligibility`) and never through URL or storage.

## Integration wiring still owned elsewhere

1. Place should keep one contextual entry action and use the consumer test id `canonical-meal-benefit-open`. It must continue calling `openDemoMealOfferFromPlace(venueId)` until that provider action is renamed in a coordinated contract change.
2. To show actual recent receipts/refunds on Travel Pass and My Korea after returning from a place, lift a privacy-safe ephemeral commerce activity summary into the B provider. Do not persist claim, consent, wallet, balance, ledger, or origin fields in device storage. The current dashboard truthfully shows an empty session state because this lane cannot mutate provider ownership.
3. The shared shell must provide the final desktop navigation rail/composition. This lane responds at desktop widths, but it intentionally does not alter shell navigation or scroll ownership.
4. Replace old E2E selectors that click `wallet-link-ready`, `payment-outcome-*`, `commerce-outcome-*`, ledgers, reset, or reconciliation. Use the new normal Link/Pay buttons plus `addInitScript` QA injection, as demonstrated in `tests/e2e/ondo-b-premium-id-wallet-redesign.spec.ts`.

