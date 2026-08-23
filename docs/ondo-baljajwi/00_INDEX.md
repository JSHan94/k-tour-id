# ONDO B · 발자취형 제품/QA Source of Truth

상태: `FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`

| SoT | 현재 값 |
|---|---|
| R5 검토 Evidence/Product/Harness/digest | `39687c33ca5d14b60304b762b373e719bb4bdbbd` / `9ec3d192d0ebdc9614d980bdb173633aee16fc17` / `12354bcf71621c00a08433faf09cbb000683ae61` / `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` |
| R5-RETRY reviewed Evidence/Product/Harness/digest | `b0d25fe634d9d50a8668501f0fde5f641153168b` / `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` / `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` / `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91` |
| Current successor Product · Harness/frozen candidate · digest | `5b519e60eb7825e2573ca6692683315cbf508401` / `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` / `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |
| Route | `/ondo-b` |
| 배포 | 새 sleek B 미배포. 기존 private B는 이전 tuple의 역사 preview일 뿐 현재 후보가 아님 |
| Requirements | `19/19 traced` |
| Flows | `18/18 · 126 checkpoints · 123 ACTUAL · 3 reasoned N/A · 0 GAP` |
| Visual registry | `50 cases · 48 distinct state IDs` |
| Pixel target | `50 × 6 exact viewports = 300 committed candidate baselines` |
| Review gate | `SLEEK-R5-RETRY 5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1 · successor full automated gate PASS · blind round READY · 0/2` |

이 디렉터리가 현재 발자취형 B 후보의 살아 있는 제품·검수·증거 source of truth다. [`ondo-execution`](../ondo-execution/00_EXECUTION_INDEX.md)은 A/v2의 역사 기록이다. `evidence/RUN-*`과 이전 clean tuple은 당시 결과를 보존하지만 현재 제품의 합격 증거로 재사용하지 않는다.

## 읽는 순서

1. [원요구 감사](./06_FINAL_REQUIREMENTS_AUDIT.md) — 다섯 실행 질문과 19개 아이디어의 구현 깊이
2. [Trace Matrix](./01_TRACE_MATRIX.md) — 19 REQ, 18 Flow, 126 checkpoint disposition
3. [QA Runbook](./02_QA_RUNBOOK.md) — 현재 tuple을 동결하고 다시 실행하는 규칙
4. [Five-Designer Review](./08_UX_UI_FIVE_DESIGNER_REVIEW.md) — 다섯 독립 UX/UI reviewer와 zero-actionable loop
5. [Component & State Matrix](./09_UX_UI_COMPONENT_STATE_MATRIX.md) — 50 case, 48 state, 6 viewport registry
6. [Review Manifest](./03_REVIEW_MANIFEST.md) — 역사 round와 현재 clean streak
7. [Evidence Manifest](./04_EVIDENCE_MANIFEST.md) — 현재/역사 증거를 구분한 인덱스
8. [Route Seam](./05_ROUTE_SEAM.md) — 실제 `/ondo-b` route·state seam
9. [As-built](./07_AS_BUILT.md) — 현재 제품 구현과 자동 검증·blind closure·배포 경계
10. [Visual System](./VISUAL_SYSTEM.md), [Surface Matrix](./VISUAL_SURFACE_MATRIX.md)
11. [Data Pipeline](./DATA_PIPELINE.md), [Truth](./DATA_PROVENANCE_AND_TRUTH.md), [External blockers](./DATA_ENV_AND_BLOCKERS.md)

## 현재 Gate

| Gate | 현재 판정 |
|---|---|
| R5-reviewed tuple | `39687c3… / 9ec3d19… / 12354bc… / 4cfbed3…` · historical `5/5 COMPLETE · NOT CLEAN` tuple |
| R5-RETRY reviewed tuple | `b0d25fe… / 30dcb13… / ee19adb… / f1ec9b0c…`; historical `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1` |
| Current successor candidate | Product `5b519e6…` · Harness/frozen candidate `b68fc18…` · digest `1dcfacb7…`; `300 = 141 carry + 141 changed prior paths + 18 new` |
| Current discovery census | B `648 tests / 39 files`; A regression `22 tests / 3 files`; contracts `27 tests / 4 files`; exact execution PASS sealed in the automated receipt. |
| Checkpoint registry | `126 mapped` to `pixel | functional_only`; grouped journey step 이름을 126개 exact `test.step`으로 과장하지 않음 |
| R4-reviewed tuple gates | historical `PASS` — discovery `348/25 files`, build/typecheck/contracts/E2E, `276/276` pixels, high-risk `72/72`, error `0`; successor에 재사용하지 않음 |
| Current automated acceptance | `PASS`; nonpixel GREEN plus visual `300/300`, high-risk repeat3 `144/144`, landscape `2/2`, backdrop `9/9`, reporter failure/skip/interrupted/retry/multi-result `0`, health `163/163 HTTP 200`, postflight clean, digest `1dcfacb7…`. |
| SLEEK R3 | historical `5/5 COMPLETE · NOT CLEAN` — `11 actionable = S1 2 + S2 9`; successor tuple에서 `11/11 FIXED · CLOSURE PENDING` |
| SLEEK R4 | historical `5/5 COMPLETE · NOT CLEAN`; raw `S2 12 + S3 2`, consolidated `10 S2 + 2 accepted S3`; successor에서 `12/12 FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |
| SLEEK R5 | historical `5/5 COMPLETE · NOT CLEAN`; D1/D3/D5 objective `S2 3`, D2/D4 `CLEAN`; retry candidate에서 `3/3 FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |
| SLEEK R5 RETRY | historical `5/5 COMPLETE · 0/5 CLEAN`; raw `S2 11 + S3 1`, consolidated `9 S2 + 1 S3`; current successor full automated gate PASS, blind reviewer closure ready and pending |
| Clean streak | `0/2` |
| New sleek deployment | `NOT DEPLOYED` |
| Data inventory | 공식 장소 `400`, simulated signal `80`, night-category After19 subset `17` (`서울 7 / 부산 10`) |

이전 accepted tuple과 R3/R4/R5 기록은 역사적으로 보존하지만 현재 release gate에는 포함하지 않는다. R5-RETRY raw verdict와 current successor 연결은 [`evidence/SLEEK-R5-RETRY/manifest.md`](./evidence/SLEEK-R5-RETRY/manifest.md), [`issues.md`](./evidence/SLEEK-R5-RETRY/issues.md), [`fixes.md`](./evidence/SLEEK-R5-RETRY/fixes.md), [`frozen-receipt.md`](./evidence/SLEEK-R5-RETRY/frozen-receipt.md)에 보존한다. Fresh blind input은 별도 최소 팩 [`evidence/SLEEK-R5R-FINAL-b68fc18/`](./evidence/SLEEK-R5R-FINAL-b68fc18/)만 사용한다.

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
