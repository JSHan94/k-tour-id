# Wave 0 · shared foundation sign-off

Status: `FOUNDATION ACCEPTED · FLOW RUNTIME GAPS CARRIED FORWARD · 2026-09-04`

Wave 0 freezes the shared contracts that later flow bundles are allowed to use. It
does not claim that the 18 product flows are visually complete.

## Accepted foundation

- Canonical, allowlisted, expiring, one-shot `ReturnTo` envelopes.
- Exact snapshot-hash checks for consume, rollback, and finalize operations.
- Public provider-unavailable, local actual, and explicit review-fixture execution
  modes remain structurally distinct.
- Semantic `peek`, `decision`, `detail`, and `full-task` Sheet variants with one
  scroll owner, safe-area/visual-viewport handling, focus trapping, opener return,
  and reference-counted modal isolation.
- The 18-flow, 52 Flow↔REQ, 3-locale, 8-viewport, 5-attack QA target matrix is
  executable and cannot silently shrink.

## Adversarial findings closed in this wave

1. A consumed token could be paired with a swapped venue/table/benefit payload.
   Consume, rollback, and finalize now require the canonical snapshot hash.
2. Suspending a parent Sheet could hide its active nested alertdialog from
   assistive technology. The nested decision now owns modality without hiding
   itself through the parent.
3. A hidden or disabled preferred focus target could leave focus outside a Sheet.
   Initial focus now falls through to the first rendered focusable element and
   finally the dialog itself.

## Verification

- Contract suite: `322/322` passing.
- TypeScript: passing.
- `git diff --check`: passing.
- Focused return/action/Sheet/standalone contracts: passing.
- P0 foundation defects: `0`.
- P1 foundation defects: `0` after the three fixes above.

## Runtime gaps carried into flow waves

These are not marked as passed:

- The legacy Table browser seed currently activates the Tables tab without
  rendering the expected seeded card, so its nested-dialog test cannot reach the
  shared Sheet assertion.
- A legacy Local Signal browser test reaches the Sheet but asserts copy that was
  intentionally replaced by the current concise UI; the dev router also emitted
  an initialization error during that run.

Both gaps must be rewritten against the current product journey and closed by
real mobile browser evidence in the owning flow bundle. They are tracked as P1
test/harness debt, not waived as product success.

## Parallel execution rule after this sign-off

Flow bundles may run in parallel only when they do not edit the same feature
owner. Shared shell, Sheet, ReturnTo, token, locale, and map-camera changes remain
serialized through the root integration lane. Every bundle is reviewed by a
non-author before merge, followed by an overview-level adversarial run.
