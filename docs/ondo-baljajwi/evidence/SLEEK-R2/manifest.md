# SLEEK-R2 pixel baseline approval manifest

Status: **FROZEN · REVIEW READY · CLEAN STREAK 0/2**

This receipt freezes the exact ONDO B product, harness, and pixel set that passed the automated release gate. It is not a clean-round verdict, and the SLEEK-R2 clean streak remains `0/2` until five blind reviewers complete two consecutive clean rounds on this identical tuple.

## Frozen inputs

- Product SHA: `46ad40f9fdbad89d3cf3e701f713803004d3e3af`
- Harness SHA: `6eceef4fe72be2ce86808821a7b6a8a6dd9a09d6`
- PNG inventory: `264` files = `44` cases × `6` viewports
- Viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`
- Responsive expansion: `176` files across the four added viewport families
- Canonical mobile: `44` files
- Canonical desktop: `44` files
- Aggregate digest: `0f56b0cfde9049e73e32c40d715fb8cd8c475f66c725d32c8e930a482aa45b3e`
- Digest working directory: `k-tour-id-app/`
- Digest algorithm: sorted `sha256 path` lines from:

      find tests/visual -path '*ondo-b-flow-pixels*spec.ts-snapshots/*.png' -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256

The digest covers only paths matching `*ondo-b-flow-pixels*spec.ts-snapshots/*.png`, using paths relative to `k-tour-id-app/`. The TSV uses repository-relative paths. Any PNG byte or path change invalidates this receipt.

## Machine-checkable inventory

[baseline-files.tsv](./baseline-files.tsv) has one row per PNG with exact repository-relative path, file SHA-256, PNG dimensions, viewport, canonical case ID, state, flow IDs, locale, status, and issue-scoped approval reason.

Required invariants:

- exactly `264` data rows;
- exactly `44` rows per viewport;
- every `case_id + viewport` pair is unique;
- dimensions equal the declared viewport;
- every file status is `FROZEN` for the exact Product/Harness/baseline tuple above.

## Automated gate receipt

- TypeScript: PASS
- Webpack production build: PASS (`28` routes, including `/ondo-b`)
- Contracts: `26/26` PASS
- B non-pixel E2E: `213` PASS, `5` intentional viewport-ownership skips, `0` failures
- B pixel evidence: `264/264` PASS with no snapshot update
- Checkpoint mapping: `121 ACTUAL`, `5` reasoned `N/A`, `0 GAP`
- Runtime/product errors observed by the gate: `0`

## Approval reason taxonomy

- `RSP-EXPANSION`: new 360/430/768/801 responsive evidence, named per exact state and viewport.
- `MOBILE-INTEGRATION`: canonical 390 mobile integration closeout, named per exact state.
- `DESKTOP-SHELL`: canonical 1440 wide-shell and integration closeout, named per exact state.
- `TABLE-CTA`: 360px Table join failure retry CTA visibility and clipping correction.
- `AFTER19-ORDER`: After19 unlock CTA action-first ordering.
- `MAP-LEGEND`, `MAP-CONTRAST`, `MAP-PLACEHOLDER`, `VENUE-META`: map count legibility and explicit text/placeholder contrast corrections.
- `SHEET-MODAL`: single exposed modal, inert/aria-hidden background, and reachable exit closeout.
- `LABS-STABILIZE`, `TRUST-STABILIZE`: Labs and trust hierarchy/scroll stabilization.

Rows may carry multiple reason IDs when a screenshot proves more than one scoped correction. The viewport/state reason in every row prevents blanket approval.

## Finalization boundary

The automated gates are complete and this tuple is frozen for review. No clean round has started. Five blind reviewers must now complete two consecutive clean rounds on this identical tuple before the candidate can be deployed or described as release-clean.
