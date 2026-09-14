# Wave 1 Commerce + Labs sign-off

## Outcome

Bundle B now presents one truthful mobile demo chain:

`place benefit → travel balance → Payment gate when required → balance-use record → separate visit check → separate stamp → optional Labs`

The existing action-gate queue, exact-return payloads, fixture controls, and recovery paths remain the single path. This wave changes consumer hierarchy and copy, adds explicit state visualization, and strengthens the existing reducer with an immutable quote; it does not add a second payment or identity flow.

Adversarial review initially withheld sign-off for five P0 truth/atomicity gaps: providerless Payment could release a ready state, the checkout quote could drift after the gate, badge preparation bypassed the Person gate, recorded QA visits lost visible provenance, and checkout exposed offer/benefit data in the public ReturnTo envelope. A second pass found storage-forgeable Person/Payment axes and K-Tour presentation markers, same-token private-context swapping, and Labs outcomes that could outlive their review provenance. A terminal-order pass then found that the balance/receipt reducer could commit before the consumed action journal finalized. Those findings are now closed by contract as described below. A final FL-013 audit also found one persistence/transition gap in the shared Table gate: Age could be written without an explicit Account guard and review success could commit without a visible pending/result phase. That gap is also closed below. Browser sign-off remains deferred to the one isolated integration lane.

## Consumer contract

- The normal Wallet, funding sheet, offer, and record use `KRW` as the primary unit and an estimated `USD` value only where helpful.
- `OOKRW`, `USDC`, and `USDT` remain reachable only inside user-opened balance/payment details or Labs.
- The positive review balance names its source as “Prepared for this trip” / “이번 여행에 준비된 잔액” / “この旅行用に準備した残高” and carries a compact visible review-sample marker beside the amount. A serialized or directly assigned `ready` value is rendered disconnected outside explicit review mode. Its open detail states that no bank, card, wallet, venue, or payment service is connected and that no money or digital asset moves.
- Bank account, card / Apple Pay, and USD wallet are visible funding intents. They remain unavailable, use sheet-local draft selection, never become the active source, and never increase the balance.
- Normal providerless Wallet, Payment KYC, merchant payment, and Labs signer paths end unavailable. Only an explicit `qa=1` review authority can return the deterministic front-end fixture; that authority is not serializable and does not perform an external effect.
- Person and Payment readiness can be serialized only with an expiring `FIXTURE_REVIEW` / `SIMULATED` receipt created from explicit review authority. Normal restore, provenance-free current storage, and all legacy `verified` values fail closed to unverified; QA restore is an explicit caller option.
- Private checkout/benefit drafts are keyed to the hash of the complete public ReturnTo envelope. Reusing the same token while swapping any otherwise-valid public field is rejected before the gate UI can release an action.
- K-Tour presentation approval requires a registered in-memory request, an exact one-time decision authority, and a compare-and-swap transition before its marker is accepted. Persisted-only, swapped, replayed, or extra approvals fail closed.
- The checkout decision shows venue, price, benefit delta, final KRW amount, balance before → after, and `No external order or real money movement` beside the commit action.
- Checkout creates one immutable, expiring quote in private in-memory action context. The persisted/public ReturnTo contains only its canonical token, gate plan, timestamps, CTA, and venue ID. The full gate plan, exact token, quote expiry, and quote equality are checked again immediately before one-shot consume and balance mutation.
- Terminal success uses one fail-closed publication boundary: the consumed action journal is first tombstoned and read back, then the atomic product writer is invoked, and only a true result may publish the completion event and receipt view. A throwing/ignored journal write never calls the product writer; a false/throwing product writer reconstructs the exact pending action when conforming storage permits. If rollback itself is blocked, success UI and events remain suppressed rather than claiming completion.
- `JOIN_TABLE` remains the only action-gate path that requests Age, with the locked `Account → Person → Age` order. The coordinator refuses to persist its minimal Age receipt unless Account is still active. Guest Manual After19 stays in its current-action memory; the other After19 surfaces independently remove session receipts when no Account is active.
- The explicit Age review fixture now renders a polite pending state, then a visible result with review provenance, and only afterward revalidates the exact pending Table return and Account prerequisite before writing the minimal predicate/issuer/expiry receipt. The original action cannot be released synchronously from the decision click.
- A failed, insufficient, cancelled, expired, or storage-failed path leaves balance, receipt, benefit, visit evidence, and stamp unchanged.
- A successful review fixture creates a local `Balance-use record`, not a venue order or external payment claim.

## Result independence

| Event | What it may change | What it may not imply |
|---|---|---|
| Payment review result | local balance ledger + local receipt | venue order, real money movement, visit, stamp |
| Balance restore | paired refund ledger + benefit availability | visit removal or venue refund |
| Visit review fixture | one unique local evidence ID | payment success or live location confirmation |
| Stamp | count derived from accepted unique visit evidence | payment, reputation, or badge mint |
| Labs badge | opt-in badge information in Labs | NFT, public transaction, or explorer record |

The production visit surface is unavailable without external confirmation. Explicit QA/review builds alone expose the visit review action. Its review provenance stays visible after the visit is recorded and after the tenth-place milestone; it is not replaced by a production-looking success.

## Labs contract

- Entry and active content show the route `Sui Testnet → OmniOne` with the adjacent balance consequence. The exact localized `Target network: Sui Testnet · Simulated` truth is authored once and persists across the entry/active alternatives; nested cards do not repeat it. The explanatory sample-data/no-external-effect truth remains in a user-opened disclosure instead of putting “simulated” in the primary CTA.
- USDC, USDT, and OOKRW remain separate asset rows. Each row has a typed glyph/text state: `available`, `reserved`, `pending`, `stale`, or `error`. At 320px the amount and state move to a second row without ellipsis. No combined actual USD/KRW balance is displayed; any legacy estimate includes its basis date.
- The route timeline is always visible and ordered: source submitted → source confirmed → relaying → destination confirmed.
- Provider-B signer readiness cannot be restored from a previous review fixture into a normal session. Normal connect/recheck attempts fail closed; successful review states require explicit QA authority.
- Provider-B signer, bridge, and badge success persist only beside a strictly sanitized successful review execution. QA reload restores the signer/route/result and its visible provenance together; missing, malformed, wrong-fixture, future-dated, or normal-runtime receipts reset the apparent success.
- Closing while pending preserves the pending bridge and phase; it is not converted to failure or cancellation.
- Destination projection appears only at the terminal simulated result. No public `txRef` means no explorer link or testnet-success claim.
- AMM remains deferred behind technical disclosure.
- Merchant traits are rendered one condition at a time with glyph-first `available`, `unavailable`, `unknown`, `stale`, `loading`, or `error` states. Only canonical `eligible` is positive; `ineligible` is explicitly non-positive. Checked date and policy ID are in a disclosure. No aggregate score, reputation, admission, safety, or payment implication is made.
- The optional keepsake uses the canonical `MINT_BADGE → Person` gate, exact ReturnTo, full terminal recheck, and one-shot consume before its only success mutation. Normal providerless use fails closed and never creates a badge/NFT/transaction claim.

## Mobile and accessibility coverage

- The phone checkout reserves `138px + safe-area-inset-bottom` for the two-row fixed decision zone so the consequence and CTA do not cover content at 320×568, 390×844, or 430×932.
- The decision consequence spans both columns; the primary action and icon-only return have deterministic columns.
- Wallet setup and funding use one internal scroll owner with safe-area padding; landscape compression remains active at 844×390.
- EN, KO, and JA retain human payment labels and localized unavailable / no-movement truth.
- Labs timeline has a keyboard focus ring. Labs and visit components include reduced-motion and forced-colors fallbacks.
- Browser screenshots are intentionally deferred to the single isolated integration lane because this shared worktree has one Next `.next/dev` lock. No additional dev server was started or stopped by this bundle.

## Superseded assertion mapping

| Previous assertion | PRD-aligned replacement | Preserved meaning |
|---|---|---|
| `Set up Travel Wallet` + generic setup body | `Prepare your travel balance` + trip/benefit context | setup remains reachable without provider jargon in the first viewport |
| `Confirm {amount}` | `Use {amount} travel balance` | the committed amount and source are explicit |
| `Saved to Travel Wallet` | `Balance-use record` | terminal result is a local record, not an external payment claim |
| external funding radio immediately called `onSelect(id)` | radio changes `draftSource`; only available travel balance can commit | unavailable intent cannot persist or fake readiness |
| `Provider connection required · no charge made` | `Not available yet · your current balance is unchanged` | unavailable and no-money truth stay visible in consumer language |
| `Asset details` | `Balance details` | technical tickers remain reachable without becoming first-frame labels |
| implicit receipt-only success | balance before → after + no-order/no-money consequence | amount effect and execution boundary are visible together |
| bridge phase text / hidden progress | four-step ordered timeline + persistent target truth | source confirmation cannot be mistaken for destination finality |
| merchant trait facts in a dense table | glyph status + concise result + disclosed checked date/policy | all condition states remain reachable without aggregate implication |
| public `START_CHECKOUT` carried `offerId` and `benefitMode` | exact public envelope carries only canonical metadata + `venueId`; offer, funding and benefit are held in a private immutable quote | exact return remains restorable without persisting decision data |
| gate-ready immediately implied a payable checkout | normal Payment KYC and merchant payment fail closed; explicit review authority is required at both boundaries | no provider/money success can be fabricated by a stale gate axis |
| amount/benefit were recomputed from mutable commerce state | frozen quote is validated at gate return and again immediately before one-shot terminal consume | price and benefit cannot drift across gate, delay, failure or retry |
| Labs badge changed state directly | `MINT_BADGE` uses the existing Person gate and exact consume/finalize/restore protocol | badge success cannot bypass identity readiness or run twice |
| recorded visit hid the QA boundary | persistent glyph provenance appears before and after record/milestone | a local review visit cannot look externally confirmed |
| main amount appended both `₩` and `KRW` | locale currency formatter owns the main amount; technical ticker remains in details | amount is legible without duplicate units |
| generic food-offer monogram | 60px soup pictogram anchors the merchant benefit | the checkout reads as a food purchase without unsupported photography |
| USD estimate had a rate but no time basis | the estimate places its fixed `₩1,350 = US$1` basis and Aug 19, 2026 as-of date directly beside the USD value | an estimate cannot be mistaken for a current live rate |
| Table Age review wrote immediately on decision | `decision → checking → visible review result → Account/exact-return recheck → minimal receipt` | QA fixture success is never synchronous or visually indistinguishable from an external result |
| Table Age writer accepted any caller state | only canonical `JOIN_TABLE` after `ACC-ACTIVE` reaches the Account-guarded writer | a Guest action cannot leak a reusable Age receipt into session storage |
| every action-gate return was assumed to display a venue | venue actions retain their exact venue; venue-less `MINT_BADGE` explicitly renders none | exact Place/Table restoration remains locked without inventing a merchant for a keepsake |
| Person/Payment `eligible` storage had status + expiry only | eligible storage requires an expiring typed review receipt and an explicit QA restore option | forged current or legacy eligibility cannot release a gated action |
| presentation approval was trusted from `{tokenId, approvedAt}` storage | an exact registered request and one-time in-memory decision authority must complete its CAS transition | copied, swapped, replayed, or extra markers cannot approve a benefit |
| private action data was looked up by token + CTA | private data is additionally bound to the canonical hash of the full public envelope | same-token changes to venue, plan, time, or other public fields cannot inherit a quote |
| Labs restored terminal enum values alone | signer, bridge, and badge outcomes restore only with their exact successful review execution and visible provenance | QA state cannot silently outlive the evidence that labels it simulated |
| product receipt/balance committed before consumed ReturnTo finalized | verified action-journal tombstone → atomic product writer → completion event/receipt UI, with exact retry reconstruction on ordinary write/commit failure | a failed finalize cannot leave paid state or a replayable success |
| ready wallet showed only “Prepared for this trip” | adjacent localized review-sample provenance plus normal-runtime ready quarantine | a fixture balance cannot look like a connected live wallet |
| target-network truth appeared in nested Labs cards | one persistent localized target-truth object shared by entry or active content | the Labs boundary stays visible without repetitive technical prose |

## Files

- `k-tour-id-app/features/ondo/commerce-b/id-wallet-commerce-b.tsx`
- `k-tour-id-app/features/ondo/commerce-b/id-wallet-commerce-b.module.css`
- `k-tour-id-app/features/ondo/commerce-b/visit-stamp-receipt-b.tsx`
- `k-tour-id-app/features/ondo/commerce-b/visit-stamp-receipt-b.module.css`
- `k-tour-id-app/features/ondo/commerce-b/stable-commerce-model-b.ts`
- `k-tour-id-app/features/ondo/identity-b/action-gate-contract-b.ts`
- `k-tour-id-app/features/ondo/identity-b/action-gate-coordinator-b.tsx`
- `k-tour-id-app/features/ondo/shared/state/ondo-b-provider.tsx`
- `k-tour-id-app/features/ondo/labs/labs-entry.tsx`
- `k-tour-id-app/features/ondo/labs/labs.module.css`
- `k-tour-id-app/tests/contracts/ondo-b-action-gate-plan.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-b-stable-commerce-model.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-wave0-return-truth.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-wave1-commerce-experience.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-b-flow8-wallet-direction.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-b-premium-id-wallet-redesign.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-b-offer-venue-scope.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-b-person-route-restoration.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-b-feature-visual-cohesion.spec.ts`
- `k-tour-id-app/tests/contracts/ondo-b-consumer-place-table.spec.ts`

## Verification

- `pnpm exec playwright test -c playwright.contracts.config.ts tests/contracts/ondo-b-action-gate-plan.spec.ts tests/contracts/ondo-wave1-commerce-experience.spec.ts --reporter=line` — **18/18 passed**, including injected throwing/ignored journal writes, false/throwing product commits, blocked rollback, success, replay, target-truth count, and visible review-balance provenance.
- The current wider Bundle B/adjacent contract batch is **97/97 passed** across Commerce, Labs, action-gate, stable model, consumer Place, After 19 return, exact UI snapshot, PRD fidelity, responsive feature, and premium Wallet contracts. The superseded Place assertion that previously required a hidden `sourceRefId` in collapsed consumer DOM now follows the disclosure-only contract and is green.
- `pnpm exec tsc --noEmit` — **passed** after the cross-owner caller/signature integration was resolved.
- `git diff --check` — **passed** for the Bundle B product, gate, contract, and sign-off files.

## Open integration checks

- Run the single isolated browser lane after all authors are idle at 320×568, 390×844, 430×932, and 844×390 in EN/KO/JA, including keyboard traversal and 200% zoom.
- The Commerce/Labs P0 findings, terminal publication-order regression, and final FL-013 persistence/transition gap have focused contract closure; the shared typecheck is green. Do not restore final Bundle B sign-off until the isolated browser lane confirms mobile font metrics, safe-area/keyboard behavior, default fail-closed states, visible Age pending/result/provenance, exact return, and retry at all required viewports/locales.
