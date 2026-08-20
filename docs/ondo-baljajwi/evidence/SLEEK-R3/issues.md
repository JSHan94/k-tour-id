# SLEEK-R3 consolidated issue ledger

Status: **HISTORICAL ROUND NOT CLEAN · 11/11 FIXED · REVIEWER CLOSURE PENDING · CLEAN 0/2 · NOT DEPLOYED**

Historical reviewed tuple: Product `997d671e33919fe333e80faa19124987f9d7dd3f`, Harness `594dbf98c690d27c65461404b8a291a606f93b76`, baseline `eca21a9358dd13f550bc8d96e1948a8475f267ecaa3239f8c15ccd18858566eb`.

Current closure candidate: Product `05f3002899485c528e31730bfebd57d71c3d788d`, Harness `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4`, baseline `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d`.

## Actionable findings

| Finding | Source | Severity | Dimension | Surviving fingerprint / acceptance boundary | Current status |
|---|---|---|---|---|---|
| `D1-R3-001` | D1 | S2 | USABILITY | short desktop rail overlaps map key; zero intersection at `1440×800` and `1512×801`, KO/EN | FIXED · CLOSURE PENDING |
| `D3-R3-001` | D3 | S2 | A11Y | Table and Local Signal async outcomes need status semantics, deliberate recovery focus, and non-stale announcements | FIXED · CLOSURE PENDING |
| `D3-R3-002` | D3 | S2 | A11Y | Labs signer `WAL-FAILED` needs a complete announcement and Try again focus | FIXED · CLOSURE PENDING |
| `D4-R3-001` | D4 | S2 | TRUTH | browser-local checkout activity must be named simulated/local preview, never confirmed evidence | FIXED · CLOSURE PENDING |
| `D4-R3-002` | D4 | S2 | LOCALIZATION | natural KO identity taxonomy while Account/Person/Age/Payment remain distinct | FIXED · CLOSURE PENDING |
| `D4-R3-003` | D4 | S2 | USABILITY/LOCALIZATION | dietary preference must store an explicit requirement rather than an underspecified Boolean | FIXED · CLOSURE PENDING |
| `D4-R3-004` | D4 | S2 | A11Y | profile field names, provenance descriptions, and public toggles must be unique and stateful in KO/EN | FIXED · CLOSURE PENDING |
| `D4-R3-005` | D4 | S2 | TRUTH | local Table preview failure must not imply a live network/host contact | FIXED · CLOSURE PENDING |
| `D5-R3-001` | D5 | S1 | TRUTH | unconfigured Residence provider cannot complete Person; passport alternate preserves draft/venue | FIXED · CLOSURE PENDING |
| `D5-R3-002` | D5 | S2 | USABILITY/LOCALIZATION | bounded English food-intent aliases must find matching official Korean venues without altering official facts | FIXED · CLOSURE PENDING |
| `D5-R3-003` | D5 | S1 | USABILITY/A11Y | deep modal sequence cannot leave venue-scoped zero-Table recovery or global nav inert | FIXED · CLOSURE PENDING |

## Census and disposition

- Raw and consolidated actionable: `11`; the findings are distinct and were not merged away.
- Severity: `S0 0 · S1 2 · S2 9 · S3 0`.
- D1 `1`, D2 `0`, D3 `2`, D4 `5`, D5 `3`.
- Historical five-role round verdict: `NOT CLEAN`.
- Current successor status means implementation and automated acceptance exist; it does not mean reviewer `CLOSED`.

Fresh blind R4 reviewers must independently reproduce the affected surfaces and then review the full 18-flow/46-case/44-state/276-image matrix. Until that round is 5/5 clean, every row remains closure-pending and the clean streak remains `0/2`.
