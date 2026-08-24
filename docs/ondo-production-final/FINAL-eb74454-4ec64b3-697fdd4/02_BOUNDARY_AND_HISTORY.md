# ONDO B boundary and evidence history

Status: EXACT FINAL LINEAGE SEALED · EARLIER FAILURES PRESERVED

## Exact lineage

| Boundary | Commit | Tree | Meaning |
|---|---|---|---|
| Product | `4ec64b3de02fdd8f5298a38dde0c84f47eaa3dc6` | `0ccf400f61d264e5084862510cee140e3d9786d1` | Last product mutation; URL minimization and standalone shipped-byte cleanup are present in its lineage |
| Visual Harness | `697fdd4dc4af13e35b68c78bbcbd127b306a4291` | `7b9944afe0e0608e766bb5ce5162bfab9e6ddb0e` | Final visual contracts, registry, helpers, and runner configuration before baseline addition |
| Central Harness+PNG | `eb74454b527445f52322eff0af48e6b703681e16` | `47f1a618fa725aad20d84b52b0e8786e2c273989` | Final central evidence parent with 124 production PNG baselines |

Product is an ancestor of the visual Harness boundary, which is an ancestor of
the central Harness+PNG commit. There are 11 commits after Product through
central: ten visual-harness/configuration commits followed by one commit adding
exactly 124 PNGs. The Product-to-central path census contains no changed path
outside `k-tour-id-app/playwright.production-visual.config.ts` and
`k-tour-id-app/tests/`.

## Corrective product history

The former Product boundary
`1129f65964de08f86cb41e29c9821632ff05f6ff` and former documentary base
`5eedc48fad010f935dc0c439d8168bb2781c32fb` remain ancestors, not the final
Product identity. The corrective sequence adds tests for canonical discovery
URLs and standalone legacy-byte rejection, canonicalizes `/ondo-b` history,
separates repository source truth from shipped bytes, and culminates in Product
`4ec64b3…` with production-only onboarding CSS, reduced shipped venue detail,
and tightened compiled-byte scanning.

## Visual history

The final visual ledger preserves capture and successor history, then binds its
final base to Product `4ec64b3…`, final Harness to `697fdd4…`, and final evidence
to central `eb74454…`. The final no-update reporter records 124 expected, zero
skipped, zero unexpected, and zero flaky. The 124-row digest manifest matches
the 124 committed PNG paths, byte sizes, SHA-256 values, and IHDR dimensions.

No PNG is copied into this documentary namespace. The source snapshot tree
remains the visual evidence object.

## Earlier RED and prototype evidence

The [production RED receipt](../../ondo-production/03_RED_RECEIPT_f7eccf8.md)
records the pre-transformation state at `f7eccf8c0219f01f0eb69a0ad17ca9e1083b21fb`:
4 gates, 1 passed, 3 failed, and no release verdict. It remains immutable failed
history.

The earlier [prototype evidence](../../ondo-baljajwi/00_INDEX.md) and
[execution evidence](../../ondo-execution/00_EXECUTION_INDEX.md) bind different
Product/Harness tuples. Their automated, PNG, reviewer, CLEAN1, or CLEAN labels
do not transfer here. No old 18-flow, 50-case, 300-PNG, or 300-row claim is
carried forward.

## Preservation rule

This finalization adds only documents and exact evidence copies. It does not
edit Product source, visual Harness source, PNGs, hosting metadata, or historical
receipts.
