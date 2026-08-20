# SLEEK-R2 consolidated issue ledger

Status: **TRIAGED · FIXES IN PROGRESS · CLEAN STREAK 0/2**

Frozen review tuple: product/harness `b00d5d6c2d9a6fee895dddb52b999733d2ff8026`, baseline digest `e24d5fe2dd16b984e99fbfaad486de8d3ac47d07fefa37e2e63ee5d32df8d812`.

The five sealed reviews were disclosed only after all valid independent submissions were complete. D4's first submission was invalidated after accidental review-file exposure and replaced by a fresh blind review. The product changes below invalidate this review tuple for clean credit; its reports remain immutable evidence.

## Actionable fingerprints

| Issue | Surviving fingerprint | Sources | Severity | Owner slice | Status |
|---|---|---|---|---|---|
| `SLK-R2-001` | `place|visible-filled-primary-count>1` | D1-001 | S2 usability | Map/Place | IN PROGRESS |
| `SLK-R2-002` | `table-chat|sheet-close|no-state-change` | D2-001 | S2 usability | Connect | IN PROGRESS |
| `SLK-R2-003` | `table-chat|nested-confirm|background-not-inert` | D2-002; D1-003 visual consequence | S2 a11y | Connect/shared modal | IN PROGRESS |
| `SLK-R2-004` | `after19-manual-off|notice|overlaps-map-list` | D2-003 | S2 usability | After19/Map | IN PROGRESS |
| `SLK-R2-005` | `state-replacement|focused-control-removed|body-fallback` | D2-004 | S2 a11y | Connect/After19/Checkout/Profile/Labs | IN PROGRESS |
| `SLK-R2-006` | `map-city|screen-title|strong-not-heading` | D2-005 | S2 a11y | Map | IN PROGRESS |
| `SLK-R2-007` | `truth|map-current-claim|simulated-snapshot` | D4-001; D5-002 | S2 truth | Map/content | IN PROGRESS |
| `SLK-R2-008` | `localization|ko-leading-counter-fragment` | D4-002 | S2 localization | Map/Place | IN PROGRESS |
| `SLK-R2-009` | `localization|ko-unresolved-postposition-return-cta` | D4-003 | S2 localization | Tables | IN PROGRESS |
| `SLK-R2-010` | `usability|consumer-fixture-jargon` | D4-004 | S2 usability | Tables/content | IN PROGRESS |
| `SLK-R2-011` | `localization|ko-untranslated-implementation-lexicon` | D4-005 | S2 localization | Place/Checkout/Labs | IN PROGRESS |
| `SLK-R2-012` | `truth|tables|past-start-still-open-and-joinable` | D5-001 | S2 truth | Tables | IN PROGRESS |
| `SLK-R2-013` | `usability|place-peek|directions-before-critical-unknowns` | D5-003 | S2 usability | Place | IN PROGRESS |
| `SLK-R2-014` | `truth|table-chat|confirmed-members-with-person-unverified` | D5-004 | S2 truth | Connect/Identity content | IN PROGRESS |

## Non-actionable dissent retained

| Fingerprint | Source | Disposition |
|---|---|---|
| `onboarding|wide-stage|question-proof-action-spatial-disconnection` | D1-002 | Subjective aesthetic S2 had only `1/5`; no independent consensus. Retain as taste dissent, not a blocker. |
| `table-chat|report-alertdialog|rounded-card-inside-sheet` | D1-003 | S3 token deviation. Its functional/modal consequence is owned by `SLK-R2-003`; no independent blocker credit. |

## Round census

- D1: `NOT CLEAN`, objective actionable S2 `1`; aesthetic S2 `1` pending consensus; S3 `1`.
- D2: `NOT CLEAN`, actionable S2 `5`.
- D3: `CLEAN`, actionable issue `0`.
- D4 replacement: `NOT CLEAN`, actionable S2 `5`.
- D5: `NOT CLEAN`, actionable S2 `4`.
- Consolidated unique actionable S2: `14`.

Any product, harness, or approved-baseline change resets the clean streak to `0/2`. No issue closes until its fix SHA, issue-scoped acceptance test, full automated gate, and fresh blind review evidence are linked.
