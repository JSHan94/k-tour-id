# Independent UX review — transactions and recovery

2026-09-15 · Reviewer role: transaction UX · **First proposal freeze**

Inputs: independently frozen [browser inventory](./sitemap-browser.md), public screenshots B001–B040, coordinator candidate [decisions](./decisions.md), and [visual standard](./visual-standard.md). Other UX reviewers' proposals were not read before this first freeze. This is one role's decision, **not three-role consensus, PRD approval, implementation completion or an all-flow PASS**.

## Main judgment

The useful object is **this place / this use / this amount**, not a succession of Wallet, identity and technology products. Preserve the existing operation model but reduce competing labels and entry surfaces.

First implementation bundle should be UX-01 + UX-02 + UX-09: context-aware funding return, one refund interface, and truthful funding/balance labels. They have direct observed evidence and do not require changing provider or financial authority.

## Candidate decisions

| Candidate | Decision | Evidence / smallest useful change | Protected behavior and acceptance |
|---|---|---|---|
| UX-01 funding return | **Approve, bounded** | B032–B033: Back to balance returns to Zest order. Pass origin context into existing funding presentation; use Back to Zest payment versus Back to balance. Also resolve completed-receipt entry versus new funding intent. | Keep pending-operation resume, quote expiry, original place/offer/amount. A completed top-up must not recredit. Closing funding does not approve purchase. Recheck consent when quote/context changes. |
| UX-02 one refund entry | **Approve, bounded** | B038 visually shows amount-based Refund options and legacy Restore balance together. Keep the existing amount-based panel, including a clear full remaining amount option; remove the competing legacy action from both receipt entry variants. | Same original order/credential, amount cap, pending/unknown status, retry same operation and full-refund benefit restoration. Do not relabel a partial refund as fully refunded. B039 provides baseline ₩5k refund and ₩23k remaining. |
| UX-03 service CTA on peek | **Conditional** | B030 shows service actions inside researched-place detail; peek visibility was not independently traversed. One actionable benefit/visit entry can be useful before the full detail. | Explicit service capability only, no inferred merchant participation. No identity modal triggered by merely viewing a place. Same origin camera/list/focus restored. Scope canonical/editorial/research separately before adoption. |
| UX-04 shorten preferences | **Hold step deletion; approve copy review** | B003–B007 prove settings → reset → optional onboarding; later purpose/area/taste sequence was not completed. There is insufficient observed evidence to delete a step yet. | Map remains available without preferences. Cancel retains original selections; preference edits must not imply allergy/halal verification or hide places. First obtain actual full sequence and before/after action count. |
| UX-05 common order/funding layout | **Conditional** | B031 has the essential place/price/balance but calls a bar transaction Meal offer. Consolidate the place-aware summary and action hierarchy; use neutral service copy when the category is not a meal. Reuse visual components, not one state machine for all operations. | Order consent, eligibility, funding authorization, source/destination confirmation, payment authorization/capture, refund and visit evidence remain distinct. Do not rename a settled funding receipt as payment success. |
| UX-06 relevant photography | **Conditional** | B030 uses a labelled food illustration. Small identifying image in an order can retain place context, but a photo cannot verify a real booking/payment or merchant participation. | Rights/attribution and actual-place versus illustration distinction; readable failed-image fallback. No decoration added to legal/identity content solely for consistency. |
| UX-07 one pulse model | **Conditional** | Map timeline and activity sampled in B027; selected-place trend synchronization was not tested. Shared frame is preferable to unrelated animation. | Buying, topping up, authenticating, claiming a benefit or selecting a photo does not constitute visiting. Keep sample provenance, pause/reduced motion and fixed tap targets; no fake real-time social proof. |
| UX-08 nonfinancial entitlement | **Hold pending user scope decision** | Existing transaction browser path is a financial mock; it is not the proposed AI/Sui nonfinancial benefit action. | Separate capability/action/confirmation/result. No reuse of payment authority or visit proof. Approval would require its own mock state/return contract and PRD mapping, not a claim that the flow already exists. |
| UX-09 balance/funding copy | **Approve, bounded** | B020 promises empty wallet, B021 shows sample ₩60k; B026 still says Add funds first at ₩90k; B022 funding entry asks How would you like to pay. Change text based on actual demo state and purpose, not the opening balance arithmetic. | Keep seed amount and ledger unchanged. Existing balance is not an incoming funding rail. A real-zero state must remain representable. Check EN/KO/JA at 320/390 and funded/unfunded/held states. |

## Additional findings to include in those bundles

1. **Completed funding receipt is not a new method chooser.** B032 Change opened the previous +₩30k result. Default new entry should explain this existing receipt or lead to a method chooser; unresolved work must still resume rather than creating another operation. Never delete completion solely to make the screen look fresh.
2. **Activity naming must match its contents.** B026 says No balance records yet after bank funding success. If this section is purchase-only, call it purchase/visit activity; if it promises all balance movements, adding funding records is real additional model/UI work, not copy-only.
3. **Gate completion resumes an earlier consented action.** B034 includes explicit purchase consent; B035 says Confirm and return but automatically continues that same purchase in B036. Prefer Confirm and continue this payment where accurate. Do not force an unnecessary second identical consent merely to add a confirmation screen; require new consent for changed/expired quote, target or purpose.

## Proposed acceptance bundle

- From Wallet: funding completion returns to Wallet; from a venue order: returns to the same order with venue, offer and amount intact.
- Funding entry distinguishes new operation, unresolved existing operation and completed receipt. Same receipt applies at most once.
- Before any submission, cancel leaves transaction values unchanged. After submission, closing does not void/refund/reset unknown work.
- Insufficient balance requests only the needed funding action; successful funding alone does not purchase. Changed/expired quote triggers re-review.
- Checkout and Wallet expose one refund workflow; full/partial/failed/unknown and original-order limits survive.
- Refund A while viewing B must affect A only; other orders and shared wallet history remain identifiable.
- Source confirmation alone does not credit stablecoin funding; destination confirmation and receipt application are separate facts.
- Ordinary price/balance stays KRW. Network, source asset, amount, fees and signing intent remain available in the selected crypto branch.
- Account, identity, age, payment eligibility and visit evidence cannot grant each other authority by visual simplification.
- Non-writer verifies mobile screenshots and transitions before merge; existing contract PASS is a baseline, not proof of newly changed UX.

## Open reconciliation

At first review freeze, the code mapper's sitemap was not available. Exact old flow-ID mapping, omitted surfaces and browser reachability reconciliation remain pending. No implementation should be approved for an untraversed P0/required path solely because this transaction proposal is approved.

## Cross-review and bounded final verdict

After first freeze, read the independent code map and visual/motion review. Discovery review file was not yet present at read time; coordinator subsequently reports all three bounded approvals and PRD pass for the commerce bundle. The following is this reviewer's explicit acceptance of the revised proposal, not a claim of completed implementation:

- **Approve UX-01/02/09:** wallet/order-aware funding purpose and completion label; ignore already-applied terminal funding as a new chooser's starting screen but retain unresolved same-operation resume; one full/partial refund panel at both entry points; keep ₩60k sample seed with honest copy; label purchase-only activity accurately rather than invent funding history.
- **Approve bounded UX-05:** neutral place/offer/item terminology and icon; preserve source asset/network/fee/signing information. Clarify that payment-readiness confirmation resumes an already-consented unchanged payment; no blanket extra consent.
- **Approve bounded UX-03:** only explicit registered capabilities get a service primary CTA on peek, with Details secondary and Directions retained in full detail. Do not enable it for every map listing or open identity on simple viewing.
- **Approve bounded UX-06:** only the coordinator-verified licensed Onion Anguk photo and the correct place/media slot, with credit and fallback. No endorsement of unrelated or unlicensed photos.
- **Approve bounded UX-07:** readable Sample provenance and existing frame bus; no new timer or invented live visits.
- **UX-04 remains no step deletion:** the separate twelve-observation onboarding pass confirms all three optional steps and cancel preservation. No repeated identical question was observed. Six wizard actions for purpose/changed city/one taste/save; ordinary preferences already have a shorter direct edit.
- **UX-08 remains hold** until the user's explicit scope decision and separate action contract.

Implementation authorization supplied by coordinator is restricted to the approved commerce bundle. New layouts, privacy authority changes and untraversed sensitive-state simplification remain outside that authorization.
