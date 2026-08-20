# ONDO B · 발자취형 제품/QA Source of Truth

상태: `PRODUCT/HARNESS/BASELINE TUPLE FROZEN · FULL AUTOMATED QA PASS · SLEEK R2 READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

| SoT | 현재 값 |
|---|---|
| 제품 SHA | `b00d5d6c2d9a6fee895dddb52b999733d2ff8026` |
| 검수 Harness SHA | `b00d5d6c2d9a6fee895dddb52b999733d2ff8026` |
| Baseline set digest | `e24d5fe2dd16b984e99fbfaad486de8d3ac47d07fefa37e2e63ee5d32df8d812` — 270 committed PNGs |
| Route | `/ondo-b` |
| 배포 | 새 sleek B 미배포. 기존 private B는 이전 tuple의 역사 preview일 뿐 현재 후보가 아님 |
| Requirements | `19/19 traced` |
| Flows | `18/18 · 126 checkpoints · 121 ACTUAL · 5 reasoned N/A · 0 GAP` |
| Visual registry | `45 cases · 43 distinct state IDs` |
| Pixel target | `45 × 6 exact viewports = 270 committed baselines` |
| Review gate | `SLEEK R2 READY TO START · 0/2 clean rounds` |

이 디렉터리가 현재 발자취형 B 후보의 살아 있는 제품·검수·증거 source of truth다. [`ondo-execution`](../ondo-execution/00_EXECUTION_INDEX.md)은 A/v2의 역사 기록이다. `evidence/RUN-*`과 이전 clean tuple은 당시 결과를 보존하지만 현재 제품의 합격 증거로 재사용하지 않는다.

## 읽는 순서

1. [원요구 감사](./06_FINAL_REQUIREMENTS_AUDIT.md) — 다섯 실행 질문과 19개 아이디어의 구현 깊이
2. [Trace Matrix](./01_TRACE_MATRIX.md) — 19 REQ, 18 Flow, 126 checkpoint disposition
3. [QA Runbook](./02_QA_RUNBOOK.md) — 현재 tuple을 동결하고 다시 실행하는 규칙
4. [Five-Designer Review](./08_UX_UI_FIVE_DESIGNER_REVIEW.md) — 다섯 독립 UX/UI reviewer와 zero-actionable loop
5. [Component & State Matrix](./09_UX_UI_COMPONENT_STATE_MATRIX.md) — 45 case, 43 state, 6 viewport registry
6. [Review Manifest](./03_REVIEW_MANIFEST.md) — 역사 round와 현재 clean streak
7. [Evidence Manifest](./04_EVIDENCE_MANIFEST.md) — 현재/역사 증거를 구분한 인덱스
8. [Route Seam](./05_ROUTE_SEAM.md) — 실제 `/ondo-b` route·state seam
9. [As-built](./07_AS_BUILT.md) — 현재 제품 구현과 아직 미검증인 부분
10. [Visual System](./VISUAL_SYSTEM.md), [Surface Matrix](./VISUAL_SURFACE_MATRIX.md)
11. [Data Pipeline](./DATA_PIPELINE.md), [Truth](./DATA_PROVENANCE_AND_TRUTH.md), [External blockers](./DATA_ENV_AND_BLOCKERS.md)

## 현재 Gate

| Gate | 현재 판정 |
|---|---|
| Product source | `FROZEN` at `b00d5d6c2d9a6fee895dddb52b999733d2ff8026` |
| Harness source | `FROZEN` at `b00d5d6c2d9a6fee895dddb52b999733d2ff8026` |
| Checkpoint registry | `126 mapped` to `pixel | functional_only`; grouped journey step 이름을 126개 exact `test.step`으로 과장하지 않음 |
| Pixel baseline | frozen `270/270 no-update PASS` across `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`; digest `e24d5fe2…` |
| Current automated acceptance | `PASS` — typecheck/build PASS · contracts `26/26` · nonpixel E2E `215 pass / 5 intentional viewport skips / 0 fail` · pixel `270/270` |
| SLEEK R2 | `READY TO START` — reviewer verdict 없음 |
| Clean streak | `0/2` |
| New sleek deployment | `NOT DEPLOYED` |
| Data inventory | 공식 장소 `400`, simulated signal `80`, night-category After19 subset `17` (`서울 7 / 부산 10`) |

이전 `5ac6308… / 6e7254a… / 5ffbe67…` tuple의 자동 PASS, R3/R4 clean, private deployment는 역사적으로 유효하지만 제품 변경 뒤 현재 release gate에는 포함하지 않는다.

## 고정 불변식

- Guest 탐색을 Account/KYC로 선행 차단하지 않는다.
- Account, Person, 19+, Payment KYC와 네 reputation 축은 독립이다.
- 공식 장소 source와 simulated ONDO signal을 섞지 않는다.
- score, cluster count, sample, confidence band, freshness는 서로 다른 정보다.
- 지도 실패 시 같은 200개 목록과 Retry를 제공한다.
- 결제 성공만으로 Stamp가 증가하지 않는다.
- 외부 receipt가 없으면 `SIMULATED`, `CONTRACT ONLY`, `NOT CONFIGURED`, `DEFERRED`를 제거하지 않는다.
- 제품 또는 harness/baseline이 바뀌면 review verdict와 clean streak를 폐기한다.
- 같은 frozen tuple에서 5인 독립 clean round 두 번 전에는 새 sleek B를 승격·배포하지 않는다.
