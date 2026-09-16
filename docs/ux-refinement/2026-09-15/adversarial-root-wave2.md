# Root wave 2 — independent transaction UX / source review

Reviewed 2026-09-15 by the transaction reviewer, who did not author these changes. Scope: CODE06 `saved-entry-b.tsx`, the English visit-receipt wording, and canonical/editorial sticky peek actions. Static review and an independent rebuilt-artifact browser pass are recorded separately below. No app files were edited by this review.

## Verdict

**CODE06 research/current-selected-purchase flow: independently verified and approved. No new blocker found in this bounded review.** Canonical/editorial receipt returns and final sticky/disclosure restoration have separate reviewers; this document does not claim their runtime results. Static review found no added purchase, refund, visit, credential or provider mutation in the reviewed presentation/return changes.

| Check | Evidence / finding |
| --- | --- |
| Selected purchase ownership | [saved-entry-b.tsx:292](../../../k-tour-id-app/features/ondo/my/saved-entry-b.tsx#L292) derives the venue from the **selected commerce order**, not a separate last-receipt venue. The card exposes the same order/venue IDs at line 577. [Order selection:158](../../../k-tour-id-app/features/ondo/commerce-b/stable-commerce-model-b.ts#L158) swaps order snapshots while retaining shared funding credits. No order selection or ledger logic was changed. |
| Original payment reference | [saved-entry-b.tsx:295](../../../k-tour-id-app/features/ondo/my/saved-entry-b.tsx#L295) uses the selected session receipt, with that same order's receipt as fallback; the former globally fixed UI receipt ID is removed. Successful capture assigns the order receipt to both state and ledger in [stable-commerce-model-b.ts:461](../../../k-tour-id-app/features/ondo/commerce-b/stable-commerce-model-b.ts#L461). |
| Refund attribution | [saved-entry-b.tsx:296](../../../k-tour-id-app/features/ondo/my/saved-entry-b.tsx#L296) selects only **settled** refunds from the current order's refund operations, and lines 583–584 display their actual receipt IDs. Pending, unknown and failed operations cannot appear as confirmed refunds here. Partial refunds remain under the original paid purchase; a full refund retains the original payment reference. |
| Exact place return | [saved-entry-b.tsx:586](../../../k-tour-id-app/features/ondo/my/saved-entry-b.tsx#L586) routes registered canonical/research/editorial places through the existing service-return contract. [map-entry-b.tsx:3073](../../../k-tour-id-app/features/ondo/map/map-entry-b.tsx#L3073) resolves the exact ID, restores that ID's captured map context when present, then opens the matching source-kind detail. Without a snapshot, it opens the resolved place/city, not a fabricated previous camera. An unresolved ID has no invented place button. |
| Scope and translations | The EN/KO/JA headings now say **selected purchase**, not all wallet activity, and direct users to Wallet for other purchases. Canonical places retain their established official-name presentation; research/editorial places use the registry's localized name. The canonical-only memory-map count remains canonical-only: this patch does not relabel research purchases as official-directory visits. |
| Visit boundary | [visit-stamp-receipt-b.tsx:15](../../../k-tour-id-app/features/ondo/commerce-b/visit-stamp-receipt-b.tsx#L15) changes only “meal balance” to “travel balance,” matching existing KO/JA wording. The explicit user action, review-mode check, canonical evidence requirement, duplicate check and separate visit counter at lines 88–105 are unchanged. Payment or a research listing still cannot create visit proof. |
| Sticky action integrity | [canonical-place.module.css:1917](../../../k-tour-id-app/features/ondo/place/canonical-place.module.css#L1917) and [editorial-place-overlay-b.module.css:75](../../../k-tour-id-app/features/ondo/place/editorial-place-overlay-b.module.css#L75) keep the original `.peek` scroll owner and normal-flow CTA space, add scroll padding, and pin actions with an opaque theme background. Action z-index 2 stays below the sticky close control (3); forced-colors gets Canvas. No stats/body content or CTA is removed. |

## Boundaries not to overclaim

- `stableCommerceOrderB` retains its **pre-existing legacy demo order fallback** when `state.order` is absent ([model:143](../../../k-tour-id-app/features/ondo/commerce-b/stable-commerce-model-b.ts#L143)). This is compatibility with the original sample order, not validation of an unknown external receipt. Normal successful payment sets a non-null receipt; the My Korea card renders only paid/refunded state. Do not reuse this fallback as a real-provider validation rule.
- No real-device, external provider or deployed-production claim follows from this review. The browser pass below uses a local production build and local sample purchases. “No charge made” remains truthful for that unchanged mock boundary, not a promise about a future live backend.
- Visit proof remains canonical-only. The wording change does not add research/editorial visit support or make an unavailable visit check succeed.

## Required rebuilt-artifact checks

1. Buy at Zest (research), then inspect My Korea: exact venue name, selected order ID and actual payment receipt; return opens Zest. Repeat on one canonical and the supported Jeju editorial place. Confirm the copied ID is not the legacy constant except for the genuine legacy demo order.
2. Make two purchases; change selected order in Wallet and open My Korea. Venue, payment/refund references and return destination must change together; shared balance/funding credits must not change merely from selecting or opening a receipt.
3. Perform partial refund, unknown/failed refund, and remaining-full refund: show only settled refund references belonging to that order. Check original payment ID stays stable; refunds from the other purchase never leak in.
4. At 320×568 JA, let the prepared activity meter finish expanding in canonical and editorial peeks. Both primary action and Details must remain visible, unobscured and clickable; Close must remain usable. Scroll and keyboard focus must still reach retained content. Repeat light/dark and a larger viewport; confirm no document overflow.
5. After purchase/return, the visit counter must remain unchanged until an independently valid explicit visit check. No ledger or credential mutation may result from the new place-return button or sticky layout.

## Independent browser pass

Origin: `http://127.0.0.1:3315`; Chromium, fresh 390×844 mobile EN/light context. No storage/account/financial-state injection. A request guard blocks non-GET/HEAD/OPTIONS and identity-provider hosts. The first eight observations used the artifact identified by the author as `page-9b5879f4ec0dd6ea`; they are not evidence for the later footer/scroll/empty-state build. Artifacts: `k-tour-id-app/artifacts/qa/root-wave2-review/` (ignored), with `runner.mjs`, `observations.json`, and numbered screenshots.

| Observations | Actual outcome |
| --- | --- |
| R002–R005 | Set up the existing sample wallet: ₩60,000. Buy the Zest ₩28,000 offer without applying a benefit: ₩32,000. Settle a ₩5,000 partial refund: ₩37,000, refundable remainder ₩23,000. The separate visit counter remains 0/10. |
| R006–R007 | My Korea shows **Selected purchase → Zest**, the same generated `sample-order:…:receipt` as checkout, and the settled refund's own `sample-refund:…:receipt`. “Open exact place” reopens `research-seoul-zest`, with the ₩37,000 balance still visible on the map. R006 is named `error` only because the harness first expected a bare ID while the correct UI prefixes it with “Original balance record”; the screenshot shows the exact matching reference. This was a locator assertion mismatch, not an app exception. |
| R008 | Opening a second offer at Bar Cham retains the prior Zest purchase and ₩37,000 balance. This exposed a separate idle-current-order copy conflict: the wallet listed Zest and also said “No purchases yet.” The author subsequently limited that empty state to `orders.length === 0`; the replacement-build result is R013 below. |

R001–R008: **0 page errors, 0 blocked/provider mutations, 0 document horizontal overflow**. The initial run was intentionally paused before the second purchase when the author restarted the local server. Server downtime is an orchestration interruption, not an app failure. The emitted audit records retain generated reference IDs; no personal data or credentials are used.

### Replacement-build continuation — verified

R009 reloads the same browser context onto **`page-4830b1d8d0c4bd61.js`**. Its actual resource URL is recorded in `audit.finalLoadedChunks`. The existing sample-commerce state resets on reload, so setup and purchases were repeated using the UI; no state was injected. Existing local account readiness survived, meaning the fixed two-gate assumption used by the harness was no longer valid. R011 is the resulting extra-gate timeout **after payment had already succeeded**; the subsequent receipt and balance checks recover without another payment. This is not reported as a payment failure or duplicated charge.

| Observations | Post-fix result |
| --- | --- |
| R009–R013 | Repeat sample wallet setup, Zest purchase and ₩5,000 partial refund: ₩60,000 → ₩32,000 → ₩37,000. Open Bar Cham's new offer while Zest remains in purchase history. The contradictory “No purchases yet” block is absent (`wallet-purchases-empty` count 0). |
| R014–R018 | Pay ₩28,000 at Bar Cham: shared balance ₩9,000. A ₩5,000 refund returns **unknown**, then the same operation's status check returns **failed**. Both outcomes leave balance ₩9,000. My Korea keeps Bar Cham's actual payment ID and shows **zero** settled-refund references. Its exact-place action opens `research-seoul-bar-cham`. No Zest refund leaks into this purchase. |
| R019–R020 | Select the older Zest purchase in Wallet. Balance remains ₩9,000. Wallet's actual original receipt matches My Korea's reference; My Korea switches to Zest's selected order ID and shows exactly its own settled ₩5,000 refund reference. |
| R021–R022 | Refund Zest's remaining ₩23,000 through the shared Wallet refund panel. Balance becomes ₩32,000; total Zest refund ₩28,000 and remaining refundable amount ₩0. My Korea retains the **original payment ID** and displays exactly **two distinct settled refund IDs** from that order. Bar Cham's failed operation is excluded. |
| R023–R025 | Return to exact Zest, then select Bar Cham again, inspect My Korea and return to exact Bar Cham. Shared balance stays **₩32,000**, Bar Cham still has its original payment ID and **zero** settled refunds, and the visit counter is still **0/10**. Selecting/opening/returning does not add another visible debit, refund or visit. |

**Run outcome:** 25 recorded observations, including the two explicitly identified harness recoveries; 0 page errors, 0 blocked/provider mutations and 0 horizontal-overflow observations. No external money or identity-provider action occurred. Screenshots R006, R022 and R025 were also visually inspected. The browser and runner were closed cleanly before the next author rebuild.

**Limits:** visible balances, selected order IDs, payment references and settled-refund references were compared—not a byte-for-byte full-ledger snapshot. Source review confirms the new My Korea return action itself does not call commerce mutations. Reload durability, every locale/device, provider integration, canonical/editorial receipt returns and the next small-height/disclosure patch are **not claimed as runtime-covered by this pass**. Canonical/editorial runtime work was assigned to the separate identity reviewer; small-height visual checks remain with the visual reviewer. No historical PASS is reused as their result.

### Follow-up transaction-role decision: same-place disclosure restoration

Approved the author's bounded proposal to capture the currently open native `details` elements by stable test ID inside the existing `data-place-service-scroll` owner, restore `.open` before the existing scroll restoration, and scope that snapshot to the exact same place/source kind. This preserves the user's reading context without durable persistence or authority changes. It must not restore unrelated dialogs/gates or accept arbitrary external selectors. This is **design approval only**, not a runtime PASS for code built after `page-4830b1d8d0c4bd61.js`.
