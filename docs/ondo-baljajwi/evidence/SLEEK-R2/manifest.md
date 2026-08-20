# SLEEK-R2 pixel baseline approval manifest

Status: **FROZEN · AUTOMATED GATE PASS · SLEEK R3 READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED**

This receipt freezes the ONDO B product, harness, and expanded pixel set that passed the final automated gate after all 14 SLEEK-R2 findings were fixed. The fixes remain closure-pending until fresh blind review; this exact tuple is ready to start SLEEK-R3, has a clean streak of `0/2`, and is not deployed.

## Frozen inputs

- Product SHA: `997d671e33919fe333e80faa19124987f9d7dd3f`
- Harness SHA: `594dbf98c690d27c65461404b8a291a606f93b76`
- PNG inventory: `270` files = `45` cases × `6` viewports
- Viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`
- Responsive expansion: `180` files across the four added viewport families
- Canonical mobile: `45` files
- Canonical desktop: `45` files
- Aggregate digest: `eca21a9358dd13f550bc8d96e1948a8475f267ecaa3239f8c15ccd18858566eb`
- Digest working directory: `k-tour-id-app/`
- Digest algorithm: sorted `sha256 path` lines from:

      find tests/visual -path '*ondo-b-flow-pixels*spec.ts-snapshots/*.png' -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256

The digest covers only paths matching `*ondo-b-flow-pixels*spec.ts-snapshots/*.png`, using paths relative to `k-tour-id-app/`. The TSV uses repository-relative paths. Any PNG byte or path change invalidates this receipt.

## Machine-checkable inventory

[baseline-files.tsv](./baseline-files.tsv) has one row per PNG with exact repository-relative path, file SHA-256, PNG dimensions, viewport, canonical case ID, state, flow IDs, locale, status, and issue-scoped approval reason.

Required invariants:

- exactly `270` data rows;
- exactly `45` rows per viewport;
- every `case_id + viewport` pair is unique;
- dimensions equal the declared viewport;
- every file status is `FROZEN` for the exact Product/Harness/baseline tuple above.

## Automated gate receipt

- Status: `PASS`
- Product: `997d671e33919fe333e80faa19124987f9d7dd3f`
- Harness: `594dbf98c690d27c65461404b8a291a606f93b76`
- TypeScript: PASS
- Webpack production build: PASS (`28/28` routes)
- Contracts: `26/26` PASS
- B non-pixel E2E: `253` PASS, `11` intentional viewport-ownership skips, `0` failures
- B pixel evidence: `270/270` PASS with no snapshot update
- Runtime, geometry, accessibility, and modal-isolation failures: `0`
- The Product SHA, Harness SHA, and 270-file baseline digest above are frozen as one review candidate tuple.

## Invalidated tuple history

The preceding tuple — Product `46ad40f9fdbad89d3cf3e701f713803004d3e3af`, Harness `6eceef4fe72be2ce86808821a7b6a8a6dd9a09d6`, and 264-file digest `0f56b0cfde9049e73e32c40d715fb8cd8c475f66c725d32c8e930a482aa45b3e` — previously passed its automated gate and entered blind review. Product, harness, and baseline changes invalidate that review tuple and every verdict collected from it. It remains history only and contributes nothing to the current `0/2` clean streak.

The intermediate 270-file tuple — Product `4286d7aeede98e8c552d2688882bcf93f6dbeee2`, Harness `a4eb3b7fe8ffb6e817e493d681f9f5929675f533`, and digest `e24d5fe2dd16b984e99fbfaad486de8d3ac47d07fefa37e2e63ee5d32df8d812` — was frozen with automated revalidation still in progress. The Product and Harness changes above supersede it before any review verdict or clean credit; the unchanged PNG digest does not make its tuple reusable.

The subsequent split tuple — Product `cf98930e6b3d05f28b55fdad890ed431edac7bb1` and Harness `6101ed752f5ba45dffa0e1e4e65c5f0e37ed1b47` with the same 270-file digest — was also superseded before automated revalidation or review completed.

The SLEEK-R2 review tuple — Product and Harness `b00d5d6c2d9a6fee895dddb52b999733d2ff8026`, digest `e24d5fe2dd16b984e99fbfaad486de8d3ac47d07fefa37e2e63ee5d32df8d812` — completed five-role review as **NOT CLEAN** with 14 consolidated actionable findings. It is immutable historical evidence only. Product, harness, and baseline changes invalidate every R2 verdict for current clean credit, so none carries into the current `0/2` streak.

## Approval reason taxonomy

- `RSP-EXPANSION`: new 360/430/768/801 responsive evidence, named per exact state and viewport.
- `MOBILE-INTEGRATION`: canonical 390 mobile integration closeout, named per exact state.
- `DESKTOP-SHELL`: canonical 1440 wide-shell and integration closeout, named per exact state.
- `TABLE-CTA`: 360px Table join failure retry CTA visibility and clipping correction.
- `AFTER19-ORDER`: After19 unlock CTA action-first ordering.
- `AFTER19-PROMPT`: registered After19 entry prompt with active-modal isolation, focus entry, and reachable exit evidence.
- `MAP-LEGEND`, `MAP-CONTRAST`, `MAP-PLACEHOLDER`, `VENUE-META`: map count legibility and explicit text/placeholder contrast corrections.
- `SHEET-MODAL`: single exposed modal, inert/aria-hidden background, and reachable exit closeout.
- `LABS-STABILIZE`, `TRUST-STABILIZE`: Labs and trust hierarchy/scroll stabilization.

Rows may carry multiple reason IDs when a screenshot proves more than one scoped correction. The viewport/state reason in every row prevents blanket approval.

## Finalization boundary

The automated gate is complete and this exact tuple is ready to start SLEEK-R3 review. All 14 SLEEK-R2 findings are fixed but remain closure-pending: no current reviewer verdict exists, no clean round has started, the clean streak remains `0/2`, and the candidate is not deployed. Five blind reviewers must complete two consecutive clean rounds on this identical tuple before it can be deployed or described as release-clean.
