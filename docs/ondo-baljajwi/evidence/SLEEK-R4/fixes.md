# SLEEK R4 fix ledger

상태: `IMPLEMENTATION IN PROGRESS · 0/12 CLOSED · SUCCESSOR TUPLE PENDING`

| Slice | Owned issues | Product commit | Harness commit | Targeted evidence | Integrated closure |
|---|---|---|---|---|---|
| Map / Shell / Place | `R4-001`, `R4-002`, `R4-004`, `R4-006`, map/app part of `R4-008`, `R4-012` | `PENDING` | `PENDING` | `PENDING` | `PENDING` |
| Onboarding / Identity / After19 | onboarding/identity/After19 part of `R4-003`, `R4-007` | `PENDING` | `PENDING` | `PENDING` | `PENDING` |
| Connect / Profile / Checkout | Browse-all part of `R4-003`, `R4-005`, edge-Sheet part of `R4-008`, `R4-009`, `R4-010`, `R4-011` | `PENDING` | `PENDING` | `PENDING` | `PENDING` |

## Required integration sequence

1. 각 isolated slice에서 PRODUCT와 TEST를 분리해 commit한다.
2. Root가 PRODUCT를 먼저 통합하고 충돌을 해결한 뒤 TEST를 통합한다.
3. Issue-scoped KO/EN, keyboard, rapid-input, Axe, six-width tests를 실행한다.
4. 영향을 받은 visual case×viewport만 allowlist로 갱신하고 원본 해상도로 승인한다.
5. 새 Product/Harness/digest를 동결한 뒤 typecheck, webpack production build, contracts, full B E2E, full `276+` no-update pixel gate를 통과한다.
6. R4 원문은 historical `NOT CLEAN`으로 보존하고 successor tuple에서 R5/R6를 새로 실행한다.

Targeted test나 baseline update 자체는 clean 증거가 아니다. `0/2` clean streak와 `NOT DEPLOYED` 상태는 R5와 R6가 동일 successor tuple에서 각각 `5/5 CLEAN`을 제출하기 전까지 유지한다.
