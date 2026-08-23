# D4 Content, Truth & Privacy — coverage

Coverage status: **INCOMPLETE**  
Verdict: **NOT CLEAN**

## Tuple, server, context, and blindness

| Field | Audited value |
|---|---|
| Evidence parent SHA | `875ebf49f89c5842b56dc49e89b127a426fa8490` |
| Product | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Harness | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Frozen URL | `http://127.0.0.1:3219/ondo-b` |
| Server | HTTP `200`; application root present |
| Context | Actual repository Playwright/Chromium fallback; fresh empty-cookie/empty-origin context for each live audit partition |
| In-app-browser disposition | Exact URL selection attempted; runtime unavailable; complete prescribed troubleshooting read; one browser-list retry returned `[]` |
| Blindness | Strict allowed-set only; forbidden reviews/receipts, peers, history, product source, private deployments, old sessions/evidence, and snapshot updates were not used |
| Baseline digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de`, independently reproduced |

## Coverage accounting

| Dimension | Audited | Disposition |
|---|---:|---|
| Flows | `18/18` | `FL-001` through `FL-018` independently reviewed |
| Checkpoint ledger | `126/126` | `123 ACTUAL + 3 reasoned N/A + 0 GAP`; all entries inspected |
| Cases | `50/50` | all unique declared cases inspected |
| States | `48/48` | all unique declared states inspected |
| PNGs | `300/300` | every image manually visually inspected; every SHA-256 matched the ledger |
| Width `360×800` | `50/50` | EN/KO ledger states inspected |
| Width `390×844` | `50/50` | EN/KO ledger states inspected |
| Width `430×932` | `50/50` | EN/KO ledger states inspected |
| Width `768×1024` | `50/50` | EN/KO ledger states inspected |
| Width `801×1000` | `50/50` | EN/KO ledger states inspected |
| Width `1440×1000` | `50/50` | EN/KO ledger states inspected |
| Locale rows | `300/300` | `198 EN + 102 KO`; both locales exercised live across all surface families |
| FINAL pack files | `4/4` | `SHA256SUMS`, `automated-gates.md`, `baseline-files.tsv`, `frozen-receipt.md`; hashes passed |

Accounting is exhaustive, but coverage status is **INCOMPLETE** because the ledger-declared frozen `CITY-FILTERED-MAP` image contradicts the content rendered by the frozen live URL at the same checkpoint. Internal hash completeness cannot supply evidence-to-runtime fidelity.

## Flow checkpoint ledger

| Flow | Checkpoints audited | Flow | Checkpoints audited |
|---|---:|---|---:|
| `FL-001` | `7 ACTUAL` | `FL-010` | `7 ACTUAL` |
| `FL-002` | `7 ACTUAL` | `FL-011` | `7 ACTUAL` |
| `FL-003` | `7 ACTUAL` | `FL-012` | `7 ACTUAL` |
| `FL-004` | `7 ACTUAL` | `FL-013` | `7 ACTUAL` |
| `FL-005` | `7 ACTUAL` | `FL-014` | `7 ACTUAL` |
| `FL-006` | `7 ACTUAL` | `FL-015` | `7 ACTUAL` |
| `FL-007` | `6 ACTUAL + 1 N/A` | `FL-016` | `7 ACTUAL` |
| `FL-008` | `6 ACTUAL + 1 N/A` | `FL-017` | `7 ACTUAL` |
| `FL-009` | `6 ACTUAL + 1 N/A` | `FL-018` | `7 ACTUAL` |

The three N/A entries are the reasoned RETRY dispositions for `FL-007`, `FL-008`, and `FL-009`. The ledger has `109/126` pixel-linked checkpoints and `17/126` functional-only checkpoints; the latter comprise `14 ACTUAL + 3 reasoned N/A`. No checkpoint is unreviewed.

## Live surface-family matrix

All 14 families were exercised in both locales: `28/28` locale-family partitions.

| Surface family | KO | EN | Surface family | KO | EN |
|---|---:|---:|---|---:|---:|
| Onboarding | yes | yes | Nation | yes | yes |
| City/list/map | yes | yes | Place | yes | yes |
| Account gate | yes | yes | Age/After19 gate | yes | yes |
| Tables | yes | yes | Table chat | yes | yes |
| Local Signal | yes | yes | Checkout | yes | yes |
| Identity/Person | yes | yes | Profile | yes | yes |
| Labs | yes | yes | After19 surfaces | yes | yes |

## Truth and privacy path coverage

- Truth classes: sourced, generated, simulated, unknown, stale, and browser-local labels and timestamps.
- Gate isolation: Account, Person, 19+, Payment KYC, Visit, Contribution, Meetup, and Stamp/reputation separation.
- Profile privacy: consent include/remove, cancel, save, reload, hidden-field behavior, and identity-derived nationality non-copy claim.
- Reset partitions: session cancel/confirm/reload and separately clearable discovery-preference cancel/confirm/reload, including preserved settings/saves/query/city partitions.
- Local-data claims: profile photo, Local Signal photo, Table/chat image, Labs receipt, and checkout receipt boundaries.
- Recovery copy: error, retry, cancel, terminal, and return checkpoints; KO/EN meaning parity and EN singular/plural behavior.
- Prohibited leaks: no visible raw fixture identifiers, stack trace, `undefined`/`null`, credential, raw identity document, or PII-like storage key was observed in the live matrix.

## Findings and completeness decision

| Severity | Raw count |
|---|---:|
| S0 | `0` |
| S1 | `1` |
| S2 | `1` |
| S3 | `0` |

- S1 `D4-BLINE-LIVE-COPY-DRIFT-FILTERED-COUNT`: frozen PNG/live content contradiction at `CITY-FILTERED-MAP`.
- S2 `D4-LABS-KO-TARGET-TRUTH-LITERAL`: KO Labs violates the canonical locale-invariant exact target-network truth token.

Although the ledger audit totals are `18/18`, `126/126 = 123 ACTUAL + 3 reasoned N/A`, `50/50`, `48/48`, and `300/300`, the runtime contradiction with a declared frozen checkpoint prevents complete coverage credit. Final coverage status: **INCOMPLETE**. Final verdict: **NOT CLEAN**.
