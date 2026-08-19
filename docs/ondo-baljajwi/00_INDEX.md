# ONDO B · 발자취 미니멀 실험 QA 팩

상태: `REAL ROUTE QA IMPLEMENTED · EXECUTION PENDING`

고정 제품 SHA: `70b5b7b130de0fa3102bbcc6239f334c1226e8fb`

QA 브랜치: `codex/ondo-b-exact-qa-20260819`

이 디렉터리는 `/ondo-b`의 실제 UI를 검증한다. 테스트 전용 `qaCase`, 가짜 checkpoint DOM, 18×7 Cartesian 화면을 제품에 요구하지 않는다. 기존 [`ondo-execution`](../ondo-execution/00_EXECUTION_INDEX.md)의 `REQ-001`~`REQ-019`, `FL-001`~`FL-018`, 상태·truth 계약은 바꾸지 않는다.

## 문서 순서

1. [Trace Matrix](./01_TRACE_MATRIX.md) — 실제 browser proof, 제품 gap, 정당한 N/A
2. [QA Runbook](./02_QA_RUNBOOK.md) — 실제 journey·pixel·content·a11y 실행 순서
3. [Review Manifest](./03_REVIEW_MANIFEST.md) — 동일 SHA 5인 blind review와 clean streak
4. [Evidence Manifest](./04_EVIDENCE_MANIFEST.md) — 명령·결과·외부 지도 장애 분류
5. [Route Seam](./05_ROUTE_SEAM.md) — 실제 `/ondo-b` selector/state seed 계약

## 고정 불변식

- A와 B 제품 source, package, Playwright config는 이 QA branch에서 수정하지 않는다.
- Account, Person, 19+, Payment KYC와 네 reputation 축은 독립이다.
- ONDO Heat는 색뿐 아니라 단계/숫자/sample/confidence/freshness로 설명한다.
- OpenFreeMap resource 실패는 외부 증거로 분류하되, 제품 `pageerror`를 숨기지 않는다.
- 지도 실패 시 실제 목록 fallback과 retry가 동작해야 한다.
- 같은 제품 SHA에서 자동 Gate와 5인 blind review가 두 번 연속 clean이어야 승격할 수 있다.

## 현재 Gate

| Gate | 상태 | 근거 |
|---|---|---|
| `/ondo-b` real route | `PASS` | root `data-variant=B`; shared non-map surface 실제 mount |
| 19 REQ / 18 FL registry | `PASS` | exact registry와 reasoned `GAP`/`N/A` |
| Synthetic adapter 제거 | `PASS` | `qaCase`, `data-b-flow/checkpoint/action` 계약 없음 |
| Browser journey code | `READY` | 18 composite journey + 실제 product/data/map tests |
| Pixel plan | `READY` | 13 layout-distinct real selectors; map canvas만 명시 mask |
| Content / a11y | `READY` | 14 reachable surfaces, KO/EN; 실제 CTA/DOM |
| 전체 실행 evidence | `NOT RUN` | [Evidence Manifest](./04_EVIDENCE_MANIFEST.md)에 결과 필요 |
| Product gaps | `OPEN` | `FL-001 ERROR/RETRY`, `FL-002 RETURN`, `FL-011 ERROR/RETRY` |
| Two clean rounds | `0/2` | unresolved actionable이 있으므로 승격 불가 |

`READY`는 `PASS`가 아니다. 실제 실행과 checksum 없는 증거는 clean으로 세지 않는다.
