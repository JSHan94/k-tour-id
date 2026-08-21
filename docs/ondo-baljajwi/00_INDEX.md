# ONDO B · 발자취형 제품/QA Source of Truth

상태: `R5 5/5 COMPLETE · NOT CLEAN · OBJECTIVE S2 3 · 3/3 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

| SoT | 현재 값 |
|---|---|
| R5 검토 Evidence/Product/Harness/digest | `39687c33ca5d14b60304b762b373e719bb4bdbbd` / `9ec3d192d0ebdc9614d980bdb173633aee16fc17` / `12354bcf71621c00a08433faf09cbb000683ae61` / `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` |
| Frozen retry Product/Harness/digest | `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` / `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` / `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91` |
| Route | `/ondo-b` |
| 배포 | 새 sleek B 미배포. 기존 private B는 이전 tuple의 역사 preview일 뿐 현재 후보가 아님 |
| Requirements | `19/19 traced` |
| Flows | `18/18 · 126 checkpoints · 121 ACTUAL · 5 reasoned N/A · 0 GAP` |
| Visual registry | `47 cases · 45 distinct state IDs` |
| Pixel target | `47 × 6 exact viewports = 282 committed baselines` |
| Review gate | `SLEEK R5 5/5 COMPLETE · NOT CLEAN · D1/D3/D5 objective S2 3 · D2/D4 CLEAN · retry candidate 3/3 FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING · 0/2` |

이 디렉터리가 현재 발자취형 B 후보의 살아 있는 제품·검수·증거 source of truth다. [`ondo-execution`](../ondo-execution/00_EXECUTION_INDEX.md)은 A/v2의 역사 기록이다. `evidence/RUN-*`과 이전 clean tuple은 당시 결과를 보존하지만 현재 제품의 합격 증거로 재사용하지 않는다.

## 읽는 순서

1. [원요구 감사](./06_FINAL_REQUIREMENTS_AUDIT.md) — 다섯 실행 질문과 19개 아이디어의 구현 깊이
2. [Trace Matrix](./01_TRACE_MATRIX.md) — 19 REQ, 18 Flow, 126 checkpoint disposition
3. [QA Runbook](./02_QA_RUNBOOK.md) — 현재 tuple을 동결하고 다시 실행하는 규칙
4. [Five-Designer Review](./08_UX_UI_FIVE_DESIGNER_REVIEW.md) — 다섯 독립 UX/UI reviewer와 zero-actionable loop
5. [Component & State Matrix](./09_UX_UI_COMPONENT_STATE_MATRIX.md) — 47 case, 45 state, 6 viewport registry
6. [Review Manifest](./03_REVIEW_MANIFEST.md) — 역사 round와 현재 clean streak
7. [Evidence Manifest](./04_EVIDENCE_MANIFEST.md) — 현재/역사 증거를 구분한 인덱스
8. [Route Seam](./05_ROUTE_SEAM.md) — 실제 `/ondo-b` route·state seam
9. [As-built](./07_AS_BUILT.md) — 현재 제품 구현과 아직 미검증인 부분
10. [Visual System](./VISUAL_SYSTEM.md), [Surface Matrix](./VISUAL_SURFACE_MATRIX.md)
11. [Data Pipeline](./DATA_PIPELINE.md), [Truth](./DATA_PROVENANCE_AND_TRUTH.md), [External blockers](./DATA_ENV_AND_BLOCKERS.md)

## 현재 Gate

| Gate | 현재 판정 |
|---|---|
| R5-reviewed tuple | `39687c3… / 9ec3d19… / 12354bc… / 4cfbed3…` · historical `5/5 COMPLETE · NOT CLEAN` tuple |
| Frozen retry candidate | Product `30dcb13…` · Harness/HEAD `ee19adb…` · digest `f1ec9b0c…`; 282 PNG = 18 R5 fix + 264 byte-identical carry |
| Checkpoint registry | `126 mapped` to `pixel | functional_only`; grouped journey step 이름을 126개 exact `test.step`으로 과장하지 않음 |
| R4-reviewed tuple gates | historical `PASS` — discovery `348/25 files`, build/typecheck/contracts/E2E, `276/276` pixels, high-risk `72/72`, error `0`; successor에 재사용하지 않음 |
| Retry automated acceptance | exact visual `282/282`, high-risk `216/216`, landscape `2/2`; nonpixel B `420 PASS + 84 intentional skips`, A `22/22`; `FULL AUTOMATED GATE PASS · R5 RETRY READY TO START` |
| SLEEK R3 | historical `5/5 COMPLETE · NOT CLEAN` — `11 actionable = S1 2 + S2 9`; successor tuple에서 `11/11 FIXED · CLOSURE PENDING` |
| SLEEK R4 | historical `5/5 COMPLETE · NOT CLEAN`; raw `S2 12 + S3 2`, consolidated `10 S2 + 2 accepted S3`; successor에서 `12/12 FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |
| SLEEK R5 | historical `5/5 COMPLETE · NOT CLEAN`; D1/D3/D5 objective `S2 3`, D2/D4 `CLEAN`; retry candidate에서 `3/3 FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING` |
| Clean streak | `0/2` |
| New sleek deployment | `NOT DEPLOYED` |
| Data inventory | 공식 장소 `400`, simulated signal `80`, night-category After19 subset `17` (`서울 7 / 부산 10`) |

이전 accepted tuple과 R3/R4 기록, R4 successor automated PASS는 역사적으로 보존하지만 현재 release gate에는 포함하지 않는다. R5 verdict·finding·fix 연결과 retry candidate는 [`evidence/SLEEK-R5/manifest.md`](./evidence/SLEEK-R5/manifest.md), [`frozen-receipt.md`](./evidence/SLEEK-R5/frozen-receipt.md)에 보존한다.

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
