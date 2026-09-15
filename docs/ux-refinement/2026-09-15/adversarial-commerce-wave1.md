# Commerce wave 1 — independent adversarial review

Reviewed 2026-09-15 by the discovery/information-architecture reviewer, not the commerce author. Scope: UX01/02/09 in `id-wallet-commerce-b.tsx`, `stablecoin-funding-b.tsx`, the checkout-specific action-gate copy, and `ktour-ux-refinement-commerce.spec.ts`. Source paths below are relative to `k-tour-id-app/`.

## Verdict

No new financial-authority, duplicate-credit, or cross-order mutation defect was established in this bounded change. Funding purpose, original checkout return, and removal of the second legacy refund entry are consistent with the preserved model. This is **not** an all-journey or real-provider sign-off.

One pre-existing, now browser-confirmed receipt navigation defect (CODE06) must be resolved before claiming complete place → payment → history → same-place continuity. Root owns that fix; this reviewer did not edit runtime or tests.

## Consequential findings

| ID / classification | Evidence and consequence | Required disposition |
| --- | --- | --- |
| AC01 / confirmed existing defect, CODE06 | A real public mock Zest payment produced `sample-order:8b5a7d61-d4a8-4176-acdc-e2dc4ef09f88:receipt`. My Korea subsequently showed generic **Wallet activity**, fixed `ONDO-LOCAL-20260825-001`, and **no same-place button**. `features/ondo/my/saved-entry-b.tsx:291` resolves only canonical venues; lines 568–586 render only the selected commerce session and fixed receipt constants. | Resolve the selected order's place through the commerce registry, use that order's receipt/refund references, and restore research/editorial as well as canonical places. Do not substitute an all-orders claim for the current selected-order shortcut. Recheck Zest and selecting the older of two orders. |
| AC02 / small existing copy residue | Zest's paid receipt still says **Your meal balance and visit history stay separate** in the separate visit-stamp component. The neutral offer change does not reach this text. | Replace only the generic meal wording if included in this refinement; preserve independent visit evidence and the 0/10 initial count. This is not a debit or eligibility defect. |
| AC03 / stale test expectation, not app defect | `tests/e2e/ondo-funding-rail-journeys.spec.ts` retains fresh-onboarding assumptions and expects a previously credited receipt to reappear when changing payment method. The latter now intentionally contradicts UX09. The new commerce file covers two happy/recovery paths, not all old suites. | Update/classify these old expectations before reporting an entire E2E suite as passing. Keep unknown-operation restoration tests; do not weaken them into “always fresh chooser.” |

## Preserved behavior: source review

- **No model rewrite:** reviewed diff is confined to the three assigned UI files. `funding-rail-model-b.ts`, `stable-commerce-model-b.ts`, and `shared/state/ondo-b-provider.tsx` are unchanged by this commerce author.
- **Funding is not payment:** `id-wallet-commerce-b.tsx:883–940` gives funding an explicit purpose; top-up excludes the existing travel balance as an input method. The settled-and-already-credited receipt is ignored for a fresh chooser, while pending/unknown operations remain restored. `useSampleBalance` selects the balance and closes funding; it does not confirm checkout. Opening funding resets checkout consent.
- **Pending is not success or cancellation:** `funding-rail-model-b.ts:210–229` keeps settled terminal, turns cancellation of pending/unknown into unknown, and keeps stablecoin source confirmation separate from destination settlement. The UI's methods chooser refuses unresolved operations (`id-wallet-commerce-b.tsx:1064`).
- **Credit remains idempotent and scoped:** `stable-commerce-model-b.ts:341–355` accepts only the valid review execution and matching settled receipt; the same operation/receipt is a no-op, conflicting receipts are rejected. Provider `ondo-b-provider.tsx:1446–1455` credits balance only and does not grant Person, Age, Payment, or benefit authority.
- **Gate copy describes existing execution:** checkout-specific copy now warns that the already approved payment continues after verification. At `id-wallet-commerce-b.tsx:1335–1435`, the continuation still binds the pending CTA/token, venue, existing consent, quote, account, Payment eligibility/expiry, wallet, funding source and benefit policy. Settlement rechecks live values. Changing this copy did not create an approval path.
- **Refund consolidation retains the operation model:** `commerce-refunds-b.tsx:13–38` scopes to the selected order, blocks another refund while pending/unknown, validates a positive amount within remaining balance, and uses a unique operation. `stable-commerce-model-b.ts:483–512` and provider dispatch guard duplicate/conflicting results. Both callers key the component by order ID. Full refund still updates the existing receipt view; no second direct refund action is required.
- **Cross-order selection is explicit:** `stable-commerce-model-b.ts:171–191` rejects ID reuse and another order while payment confirmation is unresolved. Refund status and references are order-local; shared balance is credited only from the settled refund delta.

## Independent browser counterexamples

Target: fixed production artifact at `http://127.0.0.1:3315`, Chromium 390×844, EN, fresh browser contexts. Used only visible public sample actions. No account/financial state injection; session-storage reads were diagnostic only. All non-local non-GET/HEAD requests were blocked. All completed runs recorded **0 page errors and 0 attempted external mutations**.

| Probe | Observed result |
| --- | --- |
| Bank top-up → visible Pending sample → close → reopen | **PASS.** Phase remained `unknown`, same operation ID restored, balance remained ₩60,000, no fresh method/authorize path was offered. |
| Resolve that same top-up → return → reopen Add funds | **PASS.** One ₩30,000 credit (₩60,000 → ₩90,000); return reached wallet; fresh entry showed methods rather than the credited receipt. Closing the fresh chooser left ₩90,000 unchanged. |
| Zest purchase after funding | **PASS.** ₩28,000 charged once (₩90,000 → ₩62,000), named Zest receipt, original research detail restored. Independent visit count remained 0/10. |
| Zest purchase → My Korea | **FAIL: AC01.** Wrong fixed receipt reference, generic heading, no same-place action. Screenshot below. |
| Zest ₩5,000 refund → unknown → leave → pay Bar Cham → select Zest in wallet | **PASS.** Two separate ₩28,000 orders; unresolved refund kept its original operation ID; no premature refund credit (balance ₩4,000 after both purchases); Zest's same operation remained unknown and prevented another refund request. |
| Resolve Zest refund → switch Bar Cham → switch Zest again | **PASS.** Balance ₩4,000 → ₩9,000 once. Zest showed ₩5,000 refunded / ₩23,000 remaining / one refund operation. Bar Cham remained ₩0 refunded / ₩28,000 remaining / no refund operations. Re-selection did not duplicate credit. |

Artifacts: `artifacts/qa/ux-audit/adversarial-commerce/01-funding-unknown.png`, `02-zest-receipt.png`, `03-my-korea-receipt.png`, `04-zest-refund-restored.png`.

Two intermediate automation failures are not counted as app failures: a Close locator was initially scoped to the detail article rather than its enclosing dialog; another run clicked a card during the wallet→map transition before its intended map view settled. Corrected read-only probes used the actual dialog header and waited for the visible transition. The final results above are from completed runs.

## Remaining limits / acceptance follow-up

This browser review did not newly execute stablecoin source/destination failure or expiry, storage-write failure, non-review mode, non-EN locales, reload without session authority, or rapid simultaneous double taps. Those are protected in source but require the dedicated existing regression suites; they are not browser PASS here. New tests also need a strict page-error assertion if used as a complete release claim.

A low-confidence restore edge remains worth a targeted regression: the funding restore effect depends on incoming `source`; old persisted non-balance source state changing to travel balance on credit could rerun that effect during the same visible receipt. No current public happy-path reproduction was established, so this is not a confirmed new blocker and should not justify model changes without evidence.
