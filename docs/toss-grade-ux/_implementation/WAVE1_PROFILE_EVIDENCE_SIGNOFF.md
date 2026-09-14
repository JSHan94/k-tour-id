# Wave 1 · Public profile and evidence sign-off

Status: `AUTHOR REMEDIATION COMPLETE · ISOLATED BROWSER SIGN-OFF PENDING · 2026-09-04`

## Scope and ownership

This bundle implements the consumer-facing public-profile part of `FL-015` and
the canonical Place fact/evidence part of `FL-016`. It preserves the existing
Travel Pass profile, My Korea, selected Table, Place, source record, and After
19 flows. Merchant-trait issuance and its Labs/commerce surface remain owned by
the concurrent Bundle B; this bundle does not create a second trait flow.

## P1 remediation result

| Review finding | Closed implementation | Evidence |
|---|---|---|
| Profile existed only in the Pass destination | My Korea and the selected Table host now open the same `ProfileReputationB` surface inline | `ProfileReputationEntryB`; `my-korea-profile-open`; `table-host-profile-open` |
| Return lost selection, scroll, or focus | The opener stays mounted; its nearest scroll owner and exact scroll offset are captured, then the same opener receives focus on close | `W1-PROFILE-003`; `W1-PROFILE-CONTEXT` authored |
| Stored public data could flash before hydration | The profile subtree renders a neutral, `aria-busy` skeleton until provider hydration finishes | `data-profile-hydration="loading"`; `W1-PROFILE-003` |
| Whole public profile behaved like a live region | The public view is static. Only the visually hidden, atomic save result announces | exactly one profile `aria-live`; `W1-PROFILE-003` |
| 680–699px and 200% zoom could force two columns | The editor uses container-fit `auto-fit`; the page becomes one column through 699px, and short-landscape two-column layout requires at least 700px | CSS contract; `W1-PROFILE-LAYOUT` authored for 690px and effective 422×195 |
| `Lives in` could be consented but not displayed | The allowlisted public `<dl>` renders `From`, `Lives in`, and `Languages` independently | `data-public-field` contract and EN/KO/JA browser cases |
| Same-tab Person completion did not refresh activity | The contextual entry listens to both native storage updates and `B_ACTION_AXIS_SESSION_EVENT` | `W1-PROFILE-003` |
| Person status could remain Ready after an already-open credential expired | The entry schedules a bounded expiry refresh from the sanitized Person receipt and recomputes on both session signals | `W1-PROFILE-003`; expiry-timer contract |
| Save jumped directly from edit to view with no cancellable pending or visible result | Save now exposes a real painted pending phase, keeps Cancel active, preserves the published snapshot on cancel/failure, then shows a visible saved result before Done returns | `data-editor-state`; `profile-save-result`; `W1-PROFILE-003` |
| Consent controls and persisted limits disagreed with FL-015 | From/Lives inputs use the same 60-character bound as persistence; native toggle buttons expose `aria-pressed`, localized state/action names, and one atomic state announcement | `W1-PROFILE-003`; authored E2E locators |
| Place facts lacked honest freshness/error detail | Each fact derives current/stale state, shows conditional/no values in a nested drawer, and owns a fact-level retry | `W1-EVIDENCE-001/003`; QA runtime matrix authored |
| Evidence disclosure could overgrow the viewport | Evidence is an anchored nested drawer, capped at `88dvh`; only its body scrolls and visual-viewport bounds are republished when the detail branch mounts | CSS contract plus `useModalVisualViewport` ref-mount contract |
| Evidence return captured the non-scrolling Place wrapper | The actual `.body` scroll owner is captured and restored; the exact fact opener receives focus | `W1-EVIDENCE-003`; exact-return E2E authored |
| First-view facts lacked Place context and repeated one source chip four times | Detail and fact headers show a category pictogram; the decision section owns the shared directory source once, while rows show a source chip only for a differing source | `W1-EVIDENCE-003` |
| The four primary decisions were hidden behind a generic disclosure | Opening, foreign-card, menu/price, and English-support rows are always visible; only evidence/value detail is progressively disclosed | `canonical-previsit-facts`; `W1-EVIDENCE-003` |
| Six source classes and seven states were not all reachable | Allowlisted QA-only fact fixtures reach all states/classes; production ignores them unless `QA_RUNTIME_ENABLED` is compiled in | `EVIDENCE_SOURCE_CLASSES`, `CANONICAL_FACT_STATES`, QA runtime types and E2E matrix |
| Maker vocabulary leaked into consumer copy | “On this device / 이 기기에서 / この端末”, preview, simulated, and technical profile copy were removed; necessary privacy/source facts remain inside progressive disclosure | `W1-SURFACE-001` and production-local contracts |
| Browser storage could self-assert reputation, accepted evidence, or ten stamps | Hydration restores only field-level profile consent in both production and QA builds. Current and legacy aggregates, including structurally valid-looking local/review receipts, reset every activity axis, accepted ID, receipt, and stamp. The explicitly compiled QA runtime may install bounded in-memory review events only after storage hydration | `W1-PROFILE-PROVENANCE`; provider in-memory harness |
| Ignored/mismatched storage writes could announce a save or clear that would revert on reload | Profile save, activity publication, related-action rollback, and clear all require exact read-back before React state changes. Failure returns to the existing retry surface and keeps the prior state | `publishBActivityProfileStorage`; `W1-PROFILE-STORAGE` |

## Product truth preserved

- `From`, `Lives in`, and `Languages` are private by default. Empty values
  cannot retain public consent, and the public payload omits private fields
  rather than masking them in the DOM.
- Display name is not identity, nationality, residency, or immigration truth.
  No checked identity field auto-fills the self-authored profile.
- Identity, Visit, Contribution, and Meetup remain four independent records.
  There is no aggregate reputation, trust, safety, expertise, or “local” score.
- In the providerless production demo, activity progression is mounted-session
  state only. A reload restores the self-authored profile consent but resets
  reputation, accepted evidence, and stamps. Serializable browser storage is
  never treated as proof. The compiled QA runtime can exercise a bounded
  in-memory fixture, but cannot make any serialized receipt authoritative.
- Canonical Place exposes `yes`, `no`, `conditional`, `unknown`, `loading`,
  `stale`, and `error` as distinct glyph/state pairs. Only `yes` is positive.
- Missing source data remains `unknown`; age alone never turns a missing fact
  into `stale`. A sighted fact becomes stale after the explicit freshness
  window.
- Official directory, editorial, ONDO, merchant, OpenDID, and EAS are separate
  source classes. A directory listing never implies current hours, card
  acceptance, quality, offer eligibility, or safety.
- The first four canonical decisions remain opening hours, foreign-issued card
  support, menu/prices, and English-language support. No phone/reservation
  truth is fabricated because the current canonical source does not contain it.

## Acceptance ↔ implementation

### FL-015 / REQ-008 / REQ-015

| Acceptance | Implementation | Status |
|---|---|---|
| field-level consent; default private | field-local editor state + allowlisted `publicBActivityProfile` | PASS |
| toggle and value contracts match persistence | native `aria-pressed` toggles; From/Lives input and sanitizer both cap at 60 characters | PASS |
| one field cannot publish another | independent value/consent pairs; empty value forces only that consent off | PASS |
| private fields absent from public payload/DOM | optional public keys are omitted; public `<dl>` maps only returned keys | PASS |
| My Korea and selected Table entry | shared inline entry component; no duplicate profile route | PASS |
| exact return | owner selection remains mounted; scroll and focus restored to the exact opener | PASS at contract; browser rerun pending |
| failure/cancel preserves published state and draft | failed save shows unchanged published snapshot; same action retries; dirty close asks to discard | PASS at contract; browser rerun pending |
| save state is perceptible and cancellable | painted pending state; Cancel remains enabled and cancels the queued mutation; visible saved receipt precedes Done | PASS at contract; browser rerun pending |
| no hydration flash or noisy announcements | hydration skeleton; one atomic save-result live region | PASS |
| four independent activity axes | four source-labelled rows; no aggregate score | PASS |
| browser storage cannot forge positive activity | current and legacy hydration restores profile consent only and resets typed-looking receipts, axes, accepted IDs, and stamps even in QA; the compile-time QA seam can add bounded in-memory events only after hydration | PASS |
| save/clear storage publication is exact | set/remove must read back the exact target bytes; ignored, throwing, and mismatched operations do not publish React success and attempt exact rollback | PASS |
| EN/KO/JA and mobile/zoom reflow | localized copy; 320×568, 390×844, 430×932, 690×844, 844×390, effective 422×195 cases authored | PASS at contract; visual runtime pending |
| no unrelated axis mutation | profile writes only its existing activity-profile session contract | PASS |

### FL-016 / REQ-004 / REQ-013 / REQ-014

| Acceptance | Implementation | Status |
|---|---|---|
| every fact state is human and non-colour-only | state-specific glyph + localized label | PASS |
| non-positive states never look positive | only `yes` passes `isPositiveFactState` | PASS |
| source classes do not collapse | six explicit classes, labels, glyphs, and scope notes | PASS at model/runtime seam |
| official directory does not imply open/payment/quality/safety | unsupported facts stay unknown; source date and scope remain one disclosure away | PASS |
| conditional/no values are visible | drawer’s value block renders source value or explicit unavailable/conditional copy | PASS |
| freshness reaches stale | 30-day fact freshness reducer; invalid/future dates fail stale | PASS |
| fact-level failure and retry | row-scoped error opens an anchored drawer; retry drops only that QA error and re-fetches the real detail | PASS at contract; browser rerun pending |
| progressive disclosure | compact decision row → anchored fact drawer → existing full source record | PASS |
| bounded mobile drawer | `max-height ≤ 88dvh`; header fixed; one internal scrolling body; keyboard/visual viewport aware | PASS at contract; visual runtime pending |
| exact fact return | close restores detail scroll and exact fact opener focus | PASS at contract; browser rerun pending |
| production truth cannot be changed by fixtures | QA values are read only behind `QA_RUNTIME_ENABLED` and allowlisted sanitizers | PASS |

## After 19 production boundary addendum

Canonical Place gives both the stored-session restore and the live session event
sanitizer the explicit option `{ allowReviewFixture: QA_RUNTIME_ENABLED }`.
Normal production therefore rejects serialized or dispatched review-success
fixtures; the allowance cannot come from storage/event payloads. An opted-in QA
build can still exercise the exact-venue return. The caller uses the current
canonical return envelope `createPlaceAfter19Return({ venueId })`.

## FL-002 / FL-013 exact UI-return addendum

- Public `ReturnTo` carries only its frozen action/context contract. Camera,
  sheet/detail section, body scroll, and focus never cross that boundary.
- A separate token-keyed session snapshot accepts only the exact UI allowlist,
  binds token, venue, and creation time, expires after 30 minutes, caps retained
  entries, and fails closed on malformed/tampered values or storage failure.
- Success and cancel consume the snapshot once. Failure preserves the same
  retryable snapshot. Expired retry renews the private snapshot before issuing
  the replacement public envelope and rolls back if that issue fails.
- Account reload may restore the bounded session snapshot. Guest After 19 state
  survives dock unmount/remount only in module memory; a document reload returns
  to locked and no Guest age receipt is restored from storage.
- The trusted restore event applies the exact MapLibre camera and then restores
  the canonical detail section, real `.body` scroll offset, and exact focus
  target. Arbitrary page events cannot invoke the camera restore path.

## Verification

- Non-author adversarial contract verdict: **PASS**. The combined
  Profile/Evidence, consumer Place, Person return, After 19 return, and exact UI
  snapshot matrix is `48/48` passing after storage-forgery,
  storage-publication, lazy-source, and row-retry regressions were added.
- The reviewer directly injected structurally valid-looking current
  `LOCAL_INTERACTION` receipts, review receipts, aggregate reputation/stamps,
  and legacy activity values. Restoration retained only explicitly consented
  profile fields and reset every positive activity field.
- The reviewer also injected ignored/throwing/mismatched profile writes and
  ignored/throwing removals. Exact readback is required before saved/cleared
  React state publishes; every injected failure remained fail-closed and kept
  the prior exact value whenever the storage boundary permitted rollback.
- Standalone closure was rerun after Bundle C remediation. It currently stops at
  `B-STANDALONE-003` because the concurrent Identity bundle's new
  `traveler-id-status-b.ts` dependency is not staged; the preparer did not
  report a missing Bundle C dependency. This is a cross-bundle release blocker,
  not a Bundle C sign-off.
- Dedicated browser inventory lists `38` project cases across
  `tests/e2e/ondo-wave1-profile-evidence.spec.ts` and
  `tests/e2e/ondo-b-place-after19-restoration.spec.ts` without starting a shared
  server. Cases cover EN/KO/JA; profile success/cancel/failure/retry; contextual
  exact return; required viewport/zoom shapes; seven fact states; six source
  classes; fact retry; camera/scroll/focus; tamper; Guest remount/reload; and
  overflow/a11y assertions.
- TypeScript: whole-tree `pnpm exec tsc --noEmit` passing on the shared tree.
- `git diff --check`: passing.

## Open P0 / P1

- P0: none in Bundle C’s contract/model review.
- P1: root must run the authored browser suite once in one isolated server lane;
  shared browser ports were intentionally not used.
- P1 integration dependency: Bundle B must demonstrate merchant-trait
  unknown/ineligible/stale/error in its existing Labs/commerce fold without
  claiming global merchant safety or live EAS execution.
- P1 product-data dependency: production currently has honest official-directory
  facts only. Additional source classes become consumer truth only when their
  real adapters/envelopes exist; QA reachability is not production data.

Do not promote this document to final Wave 1 sign-off until the isolated browser
lane and cross-bundle merchant-trait review are green.
