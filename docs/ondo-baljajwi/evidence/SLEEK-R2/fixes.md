# SLEEK-R2 fix ledger

Status: **IMPLEMENTATION IN PROGRESS · CLEAN STREAK 0/2 · NOT DEPLOYED**

| Slice | Issues | Product SHA | Harness SHA | Targeted receipt | Full gate | Reviewer closure |
|---|---|---|---|---|---|---|
| Map / Place / After19 | `SLK-R2-001,004,005(part),006,007,008,011(part),013` | PENDING | PENDING | PENDING | PENDING | PENDING |
| Connect / Tables / Chat | `SLK-R2-002,003,005(part),009,010,012,014` | PENDING | PENDING | PENDING | PENDING | PENDING |
| Checkout / Profile / Labs | `SLK-R2-005(part),011(part)` | PENDING | PENDING | PENDING | PENDING | PENDING |

Required sequence for every slice:

1. product change and regression harness are committed separately where practical;
2. issue-scoped KO/EN and six-viewport browser/geometry/focus/Axe evidence passes;
3. typecheck, production build, contracts, full B E2E, runtime guard, checkpoint registry, and full no-update pixel matrix pass on one new tuple;
4. baseline changes, if any, are individually reviewed and rehashed—blanket update is forbidden;
5. five fresh blind reviewers complete two consecutive clean rounds on the identical final tuple.

This ledger must not be marked closed from targeted tests alone.
