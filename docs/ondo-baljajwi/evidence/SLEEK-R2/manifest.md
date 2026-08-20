# SLEEK-R2 pixel baseline approval manifest

Status: **REVIEWED-BY-ROOT-PENDING**

This receipt identifies the exact ONDO B pixel set prepared for the root agent's final full run and visual review. It is a per-file, issue-scoped approval record, not a final clean-round verdict.

## Frozen inputs

- Product SHA: `fb6529e560a6c2b96ae22d1120645e560b8039ef`
- PNG inventory: `264` files = `44` cases × `6` viewports
- Viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`
- Responsive expansion: `176` files across the four added viewport families
- Canonical mobile: `44` files
- Canonical desktop: `44` files
- Aggregate digest: `ba535f1d04a8571a0efd3cfc9c96e24824c47efcbc8b88848a70833f231bc996`
- Digest algorithm: sorted `sha256 path` lines from:

      find k-tour-id-app/tests/visual -path '*ondo-b-flow-pixels*spec.ts-snapshots/*.png' -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256

The digest covers only paths matching `*ondo-b-flow-pixels*spec.ts-snapshots/*.png`. Any PNG byte or path change invalidates this receipt.

## Machine-checkable inventory

[baseline-files.tsv](./baseline-files.tsv) has one row per PNG with exact repository-relative path, file SHA-256, PNG dimensions, viewport, canonical case ID, state, flow IDs, locale, status, and issue-scoped approval reason.

Required invariants:

- exactly `264` data rows;
- exactly `44` rows per viewport;
- every `case_id + viewport` pair is unique;
- dimensions equal the declared viewport;
- every file status remains `REVIEWED-BY-ROOT-PENDING` until the root full run and visual review close.

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

This manifest does not start or complete SLEEK-R2. The root agent must still run the unchanged-baseline 264-shot suite, perform the final visual inspection, freeze the harness SHA, and execute the required blind review rounds on one identical tuple. Until then, the status above must not be promoted.
