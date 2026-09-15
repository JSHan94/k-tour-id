# Independent browser sitemap — initial freeze

2026-09-15 · Phase A · **Partial coverage, not Gate A complete**

Public target: https://ktour-id.vercel.app. Investigation worktree: `ux/flow-refinement-20260915` at `b9cdc42`; deployed app functional baseline supplied by coordinator: `4cb1964`. No other mapper's inventory was read before this freeze.

**UX-08 follow-up, 2026-09-15:** the user subsequently approved a separate Roba digital-guide mock. It is not included in this frozen 40+12-observation inventory. The separately executed [320px JA/dark keyboard review](./evidence/experience-visual-review-5712aed.md) passed on `5712aed`, including the viewport-change return correction; final source-specific regression/deployment results follow the [new release record](../../KTOUR_EXPERIENCE_RELEASE_2026-09-15.md). Neither changes the original observation count. Earlier scope-decision gaps below are historical, not a claim that approval is still missing.

## Method and result

- Actual public UI, fresh isolated Chromium context, 390 × 844, EN, light. No application state seeding or source-derived fixtures.
- 40 timestamped observations across all five tab roots, collected 06:35–06:45 UTC. This is **not 40 unique screens or 40 passed tests**: B001 is loading, B006 is an exit animation, B015 repeats consent.
- Zero JavaScript page errors and zero blocked remote mutation/provider requests. No document-level horizontal overflow in recorded snapshots; this does not prove individual controls or vertical layout are correct.
- All account, identity, wallet, payment and refund actions remained browser-local public demo interactions. No personal document, physical camera, provider, real money or real booking operation.
- Four exploratory locator timeouts were harness assumptions, not app failures: exact Seoul name, Close on a nonmodal settings tab, Seoul while Settings was active, and looking for payment consent after an already-consented operation had resumed. They are not counted as passed transitions.
- Raw text/control capture can include background elements, closed disclosure descendants and diagnostic text. It is not a list of simultaneously actionable controls. Successful UI clicks establish observed transitions; screenshots establish visual claims.

Structured inventory: [sitemap-browser.json](./sitemap-browser.json). Full local observations and 40 screenshots: `k-tour-id-app/artifacts/qa/ux-audit/browser-census/` (ignored artifacts). Interactive runner: [browser-census.mjs](../../../k-tour-id-app/tests/ux-audit/browser-census.mjs). Run from the app directory with `node tests/ux-audit/browser-census.mjs`; one JSON command per line, finish with `{"finish":true}`. Do not rerun into the same evidence folder without archiving the prior run.

## Actual reachable graph

| Browser evidence | Entry → observed states/actions → return | Coverage boundary |
|---|---|---|
| B001–B003 | Fresh landing → country map with Seoul/Busan/Jeju, ambience toggle, preferences icon → **Settings tab** | City selector seen; the later city entry was through Wallet |
| B004–B007 | Settings → discovery preferences (food/dietary, clear/save/reset) → reset → optional purpose onboarding → Skip → Settings → language chooser | Remaining onboarding steps and language selections not traversed |
| B008–B009 | Settings → appearance chooser → Close → privacy/data inventory → Close | Appearance mutations, deletion and account-services branch not exercised |
| B010 | My Korea empty → Explore places / Public profile / Labs entry controls | Saved/recent/profile/Labs subflows not traversed |
| B011 | Tables root → three plans and restaurant reservation entry | Plan detail/join and reservation still untraversed |
| B012–B019 | ID·Wallet guest → K-Tour ID setup → method chooser → Passport → purpose/data consent → sample page check → simulated camera permission → deny → retry available → close → original guest pass | No physical permission, successful issuance, holder or presentation; denial does not grant identity |
| B020–B026 | Wallet setup → sample ready ₩60,000 → Add funds → method selector → Bank account → ₩30,000 quote → separate top-up consent → authorize → success ₩90,000 → Back to balance | Card/coin branches and pending/failure not traversed |
| B027–B029 | Wallet “Find places to use it” → Seoul map with ₩90,000 and nine-place filter → Options → Close → List | Category/permission/guide/After 19 branches seen but not executed |
| B030–B033 | List → Zest research detail → See your benefit → Zest ₩28,000 order → payment-method Change → prior settled top-up receipt → Back to balance → **same Zest order and amount** | Existing balance sufficient; no fresh top-up or insufficient-balance execution in this order |
| B034–B037 | Explicit order consent + Use balance → visit-account gate → payment-readiness gate → confirmation → pending hold/processing → Zest receipt; ₩90,000 → ₩62,000 | Existing consent survives the same-context gate and operation resumes automatically; not a second purchase approval |
| B038–B040 | Receipt → expand Refund options **and** Restore this record → two refund interfaces visible → partial refund ₩5,000 → balance ₩67,000, ₩23,000 still refundable → Return to place → Zest detail over same Seoul list | Full refund, unknown/refund retries, duplicate submission and Wallet receipt variant not yet traversed |

**Observed commerce sequence:** bank top-up → Wallet → filtered Seoul map/list → Zest → order review → account/payment readiness → receipt → partial refund → Zest. Place and amount were preserved through the observed funding-return detour; map balance reflected the result.

## Concrete issues and protected behavior

| ID | Direct observation | Proposed follow-up / protected behavior |
|---|---|---|
| BR-01 | B020 says “Start with an empty travel wallet”; B021 immediately shows sample ₩60,000 | Align the setup promise with the demo opening balance; do not fabricate an actual external deposit |
| BR-02 | B021 and B026 show “Add funds first” despite ₩60,000/₩90,000 | Use neutral “Add funds” when already funded; reserve insufficient-balance wording for actual shortage |
| BR-03 | B022: Add funds opens “Payment method / How would you like to pay?” with existing balance alongside funding rails | Separate the purpose of spending existing balance from choosing how to top up |
| BR-04 | B032: order Change opens the **previous completed** bank top-up receipt, not a new method chooser | Define pending-resume versus settled-receipt versus new funding entry; preserve receipt idempotency rather than blindly deleting stored completion |
| BR-05 | B032–B033: “Back to balance” returns to Zest checkout, not Wallet | Context-aware completion CTA; retain venue, offer, amount and unchecked purchase consent |
| BR-06 | B038: “Refund ₩5,000” and legacy “Restore balance” are visible on the same receipt | One refund interface with full/partial/pending/unknown; preserve amount caps and original order binding |
| BR-07 | B026 shows “No balance records yet” immediately after a completed top-up | Define whether Recent activity means purchases only or all balance movements; do not promise a unified ledger without implementing one |
| BR-08 | B035 says “Confirm and return” / no charge on this screen, then B036 resumes the previously consented purchase automatically | Clarify resume semantics; not evidence of unauthorized purchase because B034 already provided explicit same-order consent |

Visual evidence especially useful for independent review: 020-wallet-connect, 021-wallet-ready, 022-wallet-topup-methods, 026-wallet-after-topup, 027-map-from-wallet, 030-research-place-detail, 031-zest-order-review, 032-order-topup-methods, **038-duplicate-refund-controls**, 039-partial-refund-result, 040-receipt-back-zest. The transaction reviewer personally inspected screenshot 038; the coordinator separately inspected several entry/map/place screenshots.

## Remaining at the initial freeze / not counted as complete

This list preserves the original independent boundary. Later scoped results are recorded below; it is not the current status of every item.

1. 320px, KO/JA, Busan/Jeju, dark/system, physical iOS/Android and short-height cases.
2. Search/empty/category/permission/2.5D/tile-failure; After 19 and city guides.
3. Canonical/editorial detail, save/recent/notes/profile/Labs; Tables and reservations.
4. Mobile ID/Residence and successful Passport issue/holder/presentation; expired/revoked states.
5. Applied-benefit eligibility, insufficient balance and a fresh top-up originating in checkout.
6. Card/Apple Pay/stablecoin stages and unknown/failed/retry; manual authorization/capture/void.
7. Multi-order history, Wallet refund duplication, full refund, duplicate submissions, reload and denied-storage recovery.
8. New nonfinancial AI/Sui entitlement flow: not assumed reachable; PRD/code cross-review and scope decision required.

These are coverage gaps, not automatically product bugs. Current five-tab traversal is not a declaration that all app flows are complete. Cross-review with the code mapper begins **after this freeze**; PRD/legacy flow IDs remain unresolved in JSON until that reconciliation.

## Post-freeze targeted onboarding pass

Separate evidence folder: `k-tour-id-app/artifacts/qa/ux-audit/optional-onboarding/`. Twelve additional observations, EN 390×844, no page errors/provider requests. These do not replace or expand the original 40-observation freeze.

- Settings → preferences → Set up discovery again → purpose → area → tastes → Open map completed. Chosen Travel in Korea / Busan / Cafés and dessert. Six wizard actions, nine including Settings/preferences/reset entry. Purpose and area are distinct choices, not duplicate questions; the obsolete unsolicited store card is absent.
- Save opens `?city=busan`. Settings confirms Cafés and dessert.
- Reopen setup; change draft to Living / Jeju / Local classics; Back twice → Close. Returns to `?city=busan`; Settings UI confirms saved café pressed=true, unsaved classic pressed=false.
- Cancel preserves the saved city/preferences in this test. Exact camera/zoom was not measured. The reset temporarily displays the nation map behind the wizard but that is not proof of lost final return context.
- Close is available on the first step; later steps offer Back and Skip. A full three-step redesign is not justified by duplicate questions observed here. Keep ordinary direct preference editing available; consider clearer cancel access separately.

## Code-map reconciliation after both independent freezes

Read [sitemap-code.md](./sitemap-code.md) only after the original browser freeze. Its 78 nodes, 186 edges and 75 internal transition groups are static candidates, not browser PASS counts; the 40 observations are not an equivalent denominator.

| Code item | Browser evidence / verdict | Follow-up owner |
|---|---|---|
| CODE-04 generic funding return | Confirmed B032–B033; same Zest quote returns despite misleading Back to balance label | Commerce implementation UX-01 |
| CODE-05 duplicate refund controls | Confirmed B038; actual ₩5k refund and same-place return B039–B040 | Commerce implementation UX-02 |
| CODE-06 multi-order My Korea receipt | AC01 confirmed the old defect. Post-fix independent research multi-order R009–025 (4830), canonical Roba (4830), and editorial Haenyeo's Kitchen (0b1f) confirm their exact selected purchase/reference/place returns. Version/condition boundaries remain explicit below | Root author + independent reviewers |
| CODE-07 reload boundary | Not exercised. Shared state alone does not establish persistence | State/transaction QA |
| CODE-09 setup loses city context | Narrow cancel counterexample: Busan and saved café survive modified-draft cancellation in optional-onboarding pass. Exact camera/query/list state remains untested | Discovery QA |
| CODE-08 real integrated hackathon flow | No such completion demonstrated in browser inventory; scope decision remains separate | PRD guardian |
| CODE-10 public controls versus injection | This run used visible UI only; no test-injected application state. Public demo result controls remain simulated | Both inventories |
| ID_DOCUMENT / ID_FACE boundary | B016–B018 reached document workflow's simulated camera permission denial, not physical face/liveness or completed passport issue | Identity QA |
| VISIT_STAMP naming | B037 explicitly shows zero stamps after payment and separate Check this visit action. “Payment sample stamp milestone” must not imply payment creates a stamp | Code-map author / PRD guardian |

Browser-specific additions BR-01–03 and BR-07–08 concern purpose/copy and activity semantics that the static graph alone did not establish. Remaining source nodes without observation IDs stay untraversed; do not infer reachability from this reconciliation.

## Final discrepancy classification after wave-1 independent probes

The code/browser discrepancy **classification is complete**, not the entire app's execution audit. Original B001–B040 and the twelve optional-onboarding observations remain frozen evidence. Later local production-artifact probes are documented separately in [adversarial-commerce-wave1.md](./adversarial-commerce-wave1.md); they do not overwrite `sitemap-browser.json` or inflate its 40 observations.

| Reconciled item | Current evidence-backed conclusion |
| --- | --- |
| CODE-01/02/12 | Historical catalogs, 18/126 checks and source enum/anchor counts are not the current page/PASS denominator. Active B-only source and observed public entry are authoritative. |
| CODE-03 | Registered-only peek service primary + Details is source-updated under UX03. Type-specific/short-height/focus visual acceptance is tracked separately; not all peek variants passed by this census. |
| CODE-04/05; BR-01–08 | Purpose/copy, credited-receipt chooser behavior, and the duplicated legacy refund entry were corrected in source. Independent bank unknown→close→same operation→one credit→fresh chooser PASS. Two-order Zest unknown refund recovery PASS, Bar Cham unaffected; no premature or duplicate credit in those probes. This is not all funding/payment/refund branches. |
| CODE-06 | Existing defect is source-corrected; **all three origin types have targeted PASS**: canonical Roba (4830), editorial Haenyeo's Kitchen (0b1f), research Zest/Bar Cham and their multi-order refund isolation (4830). Versions and conditions are not collapsed into one all-journey PASS. Selected purchase is one existing card, not a new page or all-orders history. |
| CODE-07 | Same-session funding/refund recovery was observed; reload and denied-storage semantics remain untested here. |
| CODE-08 | Local Labs does not prove the required real integrated hackathon chain. **UX08 remains on hold**; no new nonfinancial flow is assumed implemented. |
| CODE-09 | Saved Busan/café survives changed-draft cancellation. Exact camera/query/list-scroll not measured; no evidence to justify declaring city-loss bug or deleting wizard steps. |
| CODE-10 | Visible local sample actions only in both inventories and independent probes; no injected financial authority or real provider completion. |
| CODE-11 | After the initial Onion-only gate, the final content scope contains **two approved real photographs: Onion Anguk and Hakrim Dabang**. Hakrim adds one content-only recommendation (25 research places total); the existing 27 service-capability entries remain unchanged. Latest media manifest/visual review/release records supersede the initial scope, without treating absent images as failures or photographs as merchant authority. |

The reconciled code graph is **78 semantic nodes, 189 explicit cross-surface edges, 75 grouped internal rows**. Three added edges (`E-187–189`) describe Selected purchase → exact canonical/editorial/research place; the node count remains unchanged. `E-132` now correctly maps Open wallet, not a fictional extra My Korea receipt page. All three return edges have version-bound targeted evidence below, not exhaustive state coverage. Current source membership was recounted as 173 manifest entries, 172 unique files, 124 code files; historical 285 vocabulary groups/772 anchors were not regenerated as current screen counts.

Post-fix evidence is version-bound: root-reported `artifacts/qa/ux-wave2-core` (`/tmp/ktour-ux-wave2-core.json`, 12/12) includes the research commerce test. The independent [R002–007 pass](./adversarial-root-wave2.md) used artifact `page-9b5879f4ec0dd6ea`; it does not certify later footer/scroll/empty-state changes. Both leave whole-node/all-journey completion unclaimed.

No source node is promoted wholesale to PASS from a partial family visit. Stablecoin source/destination, real permissions/providers, all locales/viewports, reload/storage recovery and untraversed identity/Tables/reservation/Labs states remain explicit gaps.

### Final-artifact origin-type probe — paused, not a PASS

An independent fresh 390×844 EN context reached canonical Roba via its public place URL on `page-4830b1d8d0c4bd61.js`, explicitly set up the sample wallet in checkout, consented, and obtained the genuine legacy sample order receipt `ONDO-LOCAL-20260825-001` with ₩60,000 → ₩38,000. The subsequent Return to place click timed out during dispatch; even the diagnostic body read did not respond within its timeout. Multiple browser workers were active concurrently, and the coordinator paused further runs to reduce renderer load. **This is an inconclusive run failure, not evidence of an app defect or successful return.** Editorial had not started. Evidence: `artifacts/qa/ux-audit/canonical-editorial-receipt-final/canonical-01-purchase.png`. Canonical/editorial post-fix return remains pending until a controlled rerun.

### Controlled canonical rerun — targeted PASS on 4830

After other browser owners stopped, the same public Roba entry and visible wallet/account/payment actions ran in a fresh, single Chromium context (390×844 EN). On the **same `page-4830b1d8d0c4bd61.js` artifact**, the full targeted loop completed: canonical peek → offer → sample wallet setup → explicit purchase consent → account/payment readiness → ₩22,000 receipt → Return to place → My Korea → selected canonical purchase and matching `ONDO-LOCAL-20260825-001` → Open exact place → same canonical ID. A subsequent wallet read stayed at ₩38,000 and My Korea retained order `ONDO-LOCAL-OP-20260825-001`. These legacy identifiers are correct for this genuine legacy demo order, not evidence of the previous research-order bug.

Result: **E-187 targeted PASS**, zero page errors/blocked external mutations, no injected source/application state. The earlier concurrent-run timeout did not reproduce in this controlled run; its cause is not conclusively attributed to resource load. Evidence: `artifacts/qa/ux-audit/canonical-receipt-isolated-4830/results.json` and `canonical-01-purchase.png`, `canonical-02-selected-purchase.png`, `canonical-03-same-place.png`. Editorial E-188 remains pending. Later unbuilt disclosure-restoration changes are not covered by this result.

### Editorial final artifact — targeted PASS on 0b1f

On **`page-0b1f4b74cde440be.js`**, a fresh 390×844 EN context followed the public Jeju Haenyeo's Kitchen Bukchon place URL, its peek service action, explicit sample wallet setup, purchase consent and account/payment checks. A ₩32,000 purchase produced `sample-order:ecf11ee0-936b-413b-912a-2ad8afa92f7e:receipt` and balance ₩28,000. Receipt return opened the exact editorial place. My Korea then showed that same place, generated order and actual payment reference, with no invented refund reference. Open exact place returned to `jeju-haenyeo-kitchen-bukchon`; wallet balance remained ₩28,000 and My Korea retained the same order.

Result: **E-188 targeted PASS**, zero page errors/blocked external mutations, no state injection. Evidence: `artifacts/qa/ux-audit/editorial-receipt-final-0b1f/results.json` and `editorial-01-purchase.png`, `editorial-02-selected-purchase.png`, `editorial-03-same-place.png`. Browser closed before other jobs resumed. This verifies the selected-purchase return on that build, not all disclosure, payment-failure, locale or device variants.

The independent [research continuation R009–025](./adversarial-root-wave2.md) separately verifies **4830**: older Zest versus newer Bar Cham selection, correct original payment IDs, only each order's settled refund references, exclusion of unknown/failed refunds, and same-place returns without another debit/refund/visit. Combined with canonical and editorial evidence, CODE06's identified origin/receipt defect has targeted post-fix coverage. These version-bound runs are not substituted for the coordinator's final-release regression gate.

The canonical/editorial return screenshots were opened and inspected directly: both preserve the original **peek**, not expanded detail. E-187/E-188 therefore target their peek nodes; expanded-detail history restoration remains an explicitly conditional, unverified alternative. No extra page/edge count or expanded-detail PASS is inferred from those observations.
