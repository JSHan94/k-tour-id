# ONDO B · 발자취형 최종 제품/QA 팩

상태: `PRODUCT + HARNESS FROZEN · AUTOMATED GATES PASS · CLEAN ROUNDS IN PROGRESS`

| SoT | 값 |
|---|---|
| 제품 SHA | `0cc65f2793ca7a17f59397b1e9e0391f281f9649` |
| 검수 Harness SHA | `8b0060ff6f371402eb2c9d8766461b50f57e4742` |
| Baseline set digest | `f37ac108b1a7814f747e9e5c89b804ad15b258df29d1958b59da7656ea8725fc` |
| Route | `/ondo-b` |
| Requirements | `19/19 traced` |
| Flows | `18/18 · 121 ACTUAL · 0 GAP · 5 reasoned N/A` |
| Pixel | `44 mobile + 44 desktop = 88/88 PASS` |

이 디렉터리가 발자취형 B 후보의 제품·검수·증거 source of truth다. [`ondo-execution`](../ondo-execution/00_EXECUTION_INDEX.md)은 A/v2의 역사 기록이며 현재 B 판정을 덮어쓰지 않는다.

## 읽는 순서

1. [원요구 최종 감사](./06_FINAL_REQUIREMENTS_AUDIT.md) — 다섯 실행 질문과 19개 아이디어의 구현 깊이
2. [Trace Matrix](./01_TRACE_MATRIX.md) — 19 REQ, 18 Flow, 121 actual checkpoints
3. [QA Runbook](./02_QA_RUNBOOK.md) — 같은 tuple의 실행·재검수 규칙
4. [Review Manifest](./03_REVIEW_MANIFEST.md) — 5개 독립 역할과 두 clean round
5. [Evidence Manifest](./04_EVIDENCE_MANIFEST.md) — 자동 검수 수치·명령·digest
6. [Route Seam](./05_ROUTE_SEAM.md) — 실제 `/ondo-b` route·state seam
7. [Final As-built](./07_AS_BUILT.md) — 최종 구현·데이터·연동 등급·검수 수치
8. [Visual System](./VISUAL_SYSTEM.md), [Surface Matrix](./VISUAL_SURFACE_MATRIX.md)
9. [Data Pipeline](./DATA_PIPELINE.md), [Truth](./DATA_PROVENANCE_AND_TRUTH.md), [External blockers](./DATA_ENV_AND_BLOCKERS.md)

## 현재 Gate

| Gate | 결과 |
|---|---|
| Product build + typecheck | `PASS` |
| Contracts | `26/26 PASS` |
| 18 Flow mobile+desktop | `36/36 PASS` |
| Pixel mobile+desktop | `88/88 PASS`, project-mismatch `88 intentional skip` |
| A11y mobile+desktop | `28/28 PASS` |
| KO/EN content + map/product/regression/registry | `102/102 PASS` |
| Data | 공식 장소 `400`, simulated signal `80`, night-category After19 subset `17` (`서울 7 / 부산 10`) |
| R3 independent review | [Review Manifest](./03_REVIEW_MANIFEST.md) 참조 |
| R4 independent review | [Review Manifest](./03_REVIEW_MANIFEST.md) 참조 |
| B deployment | `PENDING FINAL CLEAN ROUNDS` |

## 고정 불변식

- Guest 탐색을 Account/KYC로 선행 차단하지 않는다.
- Account, Person, 19+, Payment KYC와 네 reputation 축은 독립이다.
- 공식 장소 source와 simulated ONDO signal을 섞지 않는다.
- score, cluster count, sample, confidence band, freshness는 서로 다른 정보다.
- 지도 실패 시 같은 200개 목록과 Retry를 제공한다.
- 결제 성공만으로 Stamp가 증가하지 않는다.
- 외부 receipt가 없으면 `SIMULATED`, `CONTRACT ONLY`, `NOT CONFIGURED`, `DEFERRED`를 제거하지 않는다.
- 같은 제품·harness tuple에서 5인 독립 clean round 두 번 전에는 최종 승격하지 않는다.
