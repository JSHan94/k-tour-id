# ONDO B production-final evidence

Status: AUTOMATED VISUAL PASS · AUTHORITATIVE NONPIXEL PASS · NOT DEPLOYED · NO HUMAN RELEASE VERDICT

This namespace seals the production-final automated evidence for one exact
Product/Harness/PNG tuple. It does not rewrite earlier failed or prototype
evidence, claim a human reviewer decision, or claim that a Site was created,
saved, deployed, or pushed.

## Sealed tuple

| Boundary | Exact identity | State |
|---|---|---|
| Product commit | `4ec64b3de02fdd8f5298a38dde0c84f47eaa3dc6` | SEALED |
| Product tree | `0ccf400f61d264e5084862510cee140e3d9786d1` | SEALED |
| Visual Harness commit | `697fdd4dc4af13e35b68c78bbcbd127b306a4291` | SEALED |
| Visual Harness tree | `7b9944afe0e0608e766bb5ce5162bfab9e6ddb0e` | SEALED |
| Central Harness+PNG commit | `eb74454b527445f52322eff0af48e6b703681e16` | SEALED |
| Central Harness+PNG tree | `47f1a618fa725aad20d84b52b0e8786e2c273989` | SEALED |
| Production PNG census | 124 | SEALED |
| No-update comparison | 124 passed; 0 skipped, unexpected, or flaky | PASS |
| Visual manifest SHA-256 | `20f67da63ec79f6030197271b9b41e5a5b57f082b4bb08076225f53ec9764924` | VERIFIED |
| PNG tree-listing SHA-256 | `64cf6dc604c0bd79d38d1957ae23808870d174b305f32e40368d213fee0fa21e` | BOUND BY VISUAL LEDGER |
| Nonpixel manifest SHA-256 | `d6d307f91f2184db007af6d501f6fc7bb34b739cb875d138e6e4518af2037fe6` | VERIFIED |
| Nonpixel `SHA256SUMS` SHA-256 | `71d02218d47c0f04e8483fa460729ebaa38b7b3afda9ad6174e8542052697e4b` | VERIFIED |

Product is the last product mutation. The following ten commits through the
visual Harness boundary change visual contracts/configuration only, and the
central commit adds exactly 124 production PNG baselines. No post-Product path
outside the production visual harness/configuration/snapshot scope is admitted.

## Production boundary

The release subject is the standalone B-only Sites artifact produced by
`k-tour-id-app/scripts/ondo-b-standalone/`, not the repository's complete legacy
Next.js route surface. It contains one official 400-place directory (200 Seoul,
200 Busan), three tabs—Explore, Saved, and Settings—and browser-local saved
places, preferences, onboarding state, and optional private notes.

It makes no production promise for demo/simulation/fake success, account or
identity/KYC, payment/checkout, Table/chat/report, rewards/trust, Labs/wallet/
bridge, or After19. It also does not infer current opening status, hours, menu,
price, popularity, safety, traveler suitability, or foreign-card acceptance
from the official license records.

## Reading order

1. [Production transformation](./01_PRODUCTION_TRANSFORMATION.md)
2. [Boundary and evidence history](./02_BOUNDARY_AND_HISTORY.md)
3. [Final manifest](./03_RELEASE_MANIFEST.md)
4. [Evidence index](./evidence/00_EVIDENCE_INDEX.md)
5. [Visual receipt](./evidence/01_VISUAL_RECEIPT.md)
6. [Nonpixel receipt](./evidence/02_NONPIXEL_RECEIPT.md)
7. [Acceptance boundary](./evidence/03_ACCEPTANCE_BOUNDARY.md)
