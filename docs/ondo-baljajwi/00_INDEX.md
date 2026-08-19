# ONDO B · 발자취 미니멀 실험 QA 팩

상태: `TRACE READY · ROUTE SEAM PENDING`

기준 문서 SHA: `fba3ea593fb0b63cc9f0b759f31e152d68d392e9`

기준 제품 코드 SHA: `9678b2b`

실험 브랜치: `experiment/ondo-baljajwi-minimal-v1`

이 디렉터리는 기존 ONDO 후보 A를 덮지 않고, 발자취에서 영감을 받은 미니멀 시각 체계를 별도 B 후보에 적용할 때 기능·진실성·접근성이 비열화되지 않도록 검증하는 source of truth다. 기존 [`ondo-execution`](../ondo-execution/00_EXECUTION_INDEX.md)의 `REQ-001`~`REQ-019`, `FL-001`~`FL-018`, 상태·fixture·truth 계약은 변경하지 않는다.

## 문서 순서

1. [B Trace Matrix](./01_TRACE_MATRIX.md) — 19개 요구와 18개 Flow의 entry/decision/cancel/error/retry/terminal/return 증거
2. [QA Runbook](./02_QA_RUNBOOK.md) — A/B 보호, 자동화, 5인 blind review, 반복 종료 조건
3. [Review Manifest](./03_REVIEW_MANIFEST.md) — 라운드별 reviewer·issue·clean streak 기록
4. [Evidence Manifest](./04_EVIDENCE_MANIFEST.md) — 현재 SHA에 귀속되는 명령·결과·스크린샷·checksum
5. [Route Seam](./05_ROUTE_SEAM.md) — `/ondo-b`가 생기기 전 테스트를 안전하게 skip하고 이후 활성화하는 계약

## 고정 불변식

- A 배포 URL과 branch/tag는 B 검수 중 변경하지 않는다.
- B는 시각 실험이다. 상태 ID, fixture, gate, `returnTo`, persistence, truth label을 조용히 바꾸지 않는다.
- `Guest`, `Account`, `Person`, `19+`, `Payment KYC`, Reputation은 계속 독립된 축이다.
- ONDO는 식음료 발견이 Hero다. DID·지갑·체인은 JIT 행동 또는 Labs에만 보인다.
- `SIMULATED`, `CONTRACT_ONLY`, `NOT_CONFIGURED`, 실제 네트워크 의존성을 서로 바꾸어 부르지 않는다.
- ONDO Heat는 색만으로 설명하지 않는다. 숫자/단계, sample, confidence, freshness를 함께 제공한다.
- 전국 shell, 서울 complete, 부산 seed, 나머지 Growing이라는 데이터 경계를 유지한다.
- 동일 SHA에서 두 번 연속 clean 전에는 B를 Candidate 또는 Production으로 승격하지 않는다.

## 현재 Gate

| Gate | 상태 | 통과 조건 |
|---|---|---|
| Baseline frozen | `PASS` | 문서 SHA와 제품 코드 SHA 기록 |
| REQ coverage | `PASS` | `B-REQ-001`~`B-REQ-019` 존재 |
| Flow checkpoint coverage | `PASS` | 18 Flow × 7 checkpoint ID 존재 |
| Evidence slots | `PASS` | browser/pixel/content/a11y/runtime slot 존재 |
| `/ondo-b` route seam | `PENDING` | [Route Seam](./05_ROUTE_SEAM.md) 구현·Root 승인 |
| B automated QA | `NOT RUN` | 현재 B SHA에서 전체 Gate 실행 |
| Blind round 1 | `NOT STARTED` | 5역할 독립 제출 후 triage |
| Blind round 2 | `NOT STARTED` | 동일 SHA에서 두 번째 clean round |
| Promotion | `BLOCKED` | 두 번 연속 clean + stakeholder 결정 |

`PENDING`, `NOT RUN`, `NOT STARTED`를 `PASS`로 간주하지 않는다.
