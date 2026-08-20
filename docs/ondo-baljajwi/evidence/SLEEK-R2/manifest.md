# SLEEK-R2 pixel baseline approval manifest

Status: **FROZEN-PENDING-HARNESS**

This receipt freezes the exact ONDO B pixel set that passed the unchanged-baseline `264/264` visual run. It records the Product SHA and image inventory while the Harness SHA is still pending. It is not a clean-round verdict, and the SLEEK-R2 clean streak remains `0/2`.

## Frozen inputs

- Product SHA: `46ad40f9fdbad89d3cf3e701f713803004d3e3af`
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
- every file status is `FROZEN-PENDING-HARNESS` until the Harness SHA is frozen.

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

The unchanged-baseline `264/264` visual run is complete and this PNG inventory is frozen. The root agent must still freeze the Harness SHA, complete the remaining non-pixel gates, and execute the required blind review rounds on one identical tuple. No clean round has started; until those steps close, this status must not be promoted.
