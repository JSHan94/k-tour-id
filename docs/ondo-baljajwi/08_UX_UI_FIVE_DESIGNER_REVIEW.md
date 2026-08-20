# ONDO B · Five-Designer Sleekness Review

상태: `FROZEN TUPLE · FULL AUTOMATED QA PASS · SLEEK R2 READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

이 문서는 기존 기능·진실·접근성 계약을 보존하면서 `/ondo-b`의 모든 Flow, surface, component, state를 더 sleek하고 일관된 제품 언어로 개선하는 실행 정본이다. 목표는 의견을 억지로 없애는 것이 아니라 **동일 제품 SHA에서 unresolved actionable UX/UI issue를 0으로 수렴**시키는 것이다.

## 1. Frozen input

| Field | Value |
|---|---|
| Current product SHA | `46ad40f9fdbad89d3cf3e701f713803004d3e3af` |
| Current harness SHA | `6eceef4fe72be2ce86808821a7b6a8a6dd9a09d6` |
| Current baseline digest | `0f56b0cfde9049e73e32c40d715fb8cd8c475f66c725d32c8e930a482aa45b3e`; 264 committed PNGs |
| Review route | `/ondo-b` |
| Flow scope | `FL-001`~`FL-018` |
| Current visual target | `44 cases · 42 state IDs · 6 viewports = 264 committed screenshots` |
| Checkpoint registry | `126 exact rows · pixel | functional_only` |
| Automated gate | typecheck/build PASS · contracts `26/26` · E2E `213 pass / 5 intentional viewport skips / 0 fail` · pixel `264/264` |
| Current round | `SLEEK R2 READY TO START`; reviewer verdict 없음; R1 was `5/5 NOT CLEAN` and is immutable history |

제품, harness 또는 승인 baseline이 바뀌면 진행 중 reviewer verdict와 clean streak는 무효화한다. 이전 캡처와 이전 clean tuple은 비교·역사 자료로만 보존한다. 현재 세 값은 고정됐고 frozen-tuple automated gate도 통과했으므로 R2를 시작할 준비가 됐다. 아직 reviewer verdict나 CLEAN 결과는 없다.

## 2. Sleekness의 조작적 정의

Sleek는 단순히 카드와 색을 줄이는 취향이 아니다. 다음 조건이 한 제품 언어로 동시에 충족된 상태다.

1. **Hierarchy** — 한 시점에 결정해야 할 질문과 primary action이 하나로 읽힌다.
2. **Density** — 정보가 부족하지 않으면서 불필요한 pill, nested card, 반복 truth block이 없다.
3. **Rhythm** — spacing, alignment, type scale, divider, radius가 surface마다 같은 논리를 따른다.
4. **Component coherence** — 같은 역할의 button, field, row, sheet, status가 같은 형태와 동작을 가진다.
5. **Interaction clarity** — entry, cancel, failure, retry, terminal, return이 맥락을 잃지 않는다.
6. **Responsive polish** — 360/390/430/mobile-height/tablet/desktop에서 clipping, awkward void, hidden CTA가 없다.
7. **Inclusive detail** — focus, keyboard, touch, contrast, text scaling, KO/EN wrapping이 시각 품질과 함께 유지된다.
8. **Truth hierarchy** — official/simulated/unknown/deferred 고지는 읽히되 제품의 핵심 판단을 압도하지 않는다.

각 reviewer는 위 여덟 축을 1~5로 기록한다. 점수는 비교용 진단이며 S0/S1/S2 blocker를 평균으로 상쇄하지 못한다.

## 3. 다섯 독립 디자이너

모든 reviewer가 전체 `18 Flow`, 전체 visible surface family, 전체 visual state registry를 확인한다. 전문 역할은 범위를 줄이는 것이 아니라 관찰 렌즈를 깊게 한다.

| Role ID | 역할 | 주 렌즈 |
|---|---|---|
| `D1` | Visual Art Director | 발자취 원리의 번역, 위계, 여백, typography, color, cartography, heat focal point |
| `D2` | Interaction & IA Designer | 발견 가능성, decision count, state transition, cancel/error/retry/return, dead end |
| `D3` | Inclusive & Responsive Designer | 360~desktop geometry, touch, keyboard, focus, contrast, text resize, safe area |
| `D4` | Content & Truth UX Designer | KO/EN hierarchy, microcopy, loading/empty/error, simulated/unknown disclosure |
| `D5` | Traveler Service Designer | first-use comprehension, map→place→Table/payment/My/Labs 연결, JIT gate 회복 |

현재 실행 슬롯은 coordinator를 포함해 4개다. 따라서 `D1~D3`를 Wave A, `D4~D5`를 Wave B로 실행한다. 두 Wave는 동일 frozen pack만 받으며 앞선 reviewer의 결과를 읽지 않는다. 다섯 원문이 모두 제출된 뒤에만 triage한다.

## 4. Mandatory coverage receipt

각 reviewer 제출에는 다음 receipt가 전부 있어야 한다.

- `18/18 Flow` 확인
- `14/14 content surface family` 확인
- 현재 `44/44 visual case` 확인
- 현재 `42/42 distinct state ID` 확인
- `KO/EN` copy-heavy surface 확인
- `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` 전수 확인
- `44 cases × 6 viewports = 264` image census 확인
- 126 checkpoint의 `pixel | functional_only` disposition 확인
- loading, empty, pending, success, error, cancel, locked, unsupported 상태 확인 또는 사유 있는 N/A
- shell/nav/toast/sheet/focus/scroll 같은 shared component 확인

receipt가 빠진 제출은 verdict와 무관하게 `INCOMPLETE`다.

## 5. Finding schema

```text
ID · round · reviewer · frozen tuple · dimension
flow · checkpoint · surface · component path · state
locale · viewport/input · reproduction
expected · actual · user impact · evidence path/digest
severity · objective/subjective · violated token/invariant
acceptance test · confidence · duplicate fingerprint
proposed fix · owner · status · fix SHA · retest evidence
```

`dimension`은 `AESTHETIC | USABILITY | A11Y | TRUTH | LOCALIZATION` 중 하나다. 미학 이슈가 가독성, hit target, task completion에 영향을 주면 `USABILITY` 또는 `A11Y`로 재분류한다.

## 6. Severity와 합의

- `S0/S1`: 단일 재현으로 즉시 block.
- 측정 가능한 usability/a11y/truth/localization `S2`: 단일 재현으로 actionable.
- 주관적 aesthetic `S2`: 동일 fingerprint에 독립 `2/5` 합의가 있어야 actionable.
- `S3`: locked token 위반 또는 독립 `3/5` 합의부터 actionable.
- minority truth/privacy/a11y finding은 다수결로 폐기하지 않는다.
- Duplicate는 살아 있는 issue ID를 반드시 가리킨다.

## 7. Fix loop

1. 다섯 blind report를 봉인 제출한다.
2. 모두 제출된 뒤 fingerprint로 중복 제거하고 actionable ledger를 만든다.
3. token/shared component 문제를 먼저, flow-local 문제를 다음으로 묶는다.
4. product fix와 regression harness를 분리해 커밋한다.
5. 영향 surface의 실제 browser, geometry, Axe, KO/EN, pixel을 먼저 통과시킨다.
6. G0~G6와 `FL-001`~`FL-018`, 264-image full pixel matrix를 no-update로 다시 실행한다.
7. 새 tuple에서 다섯 reviewer가 다시 blind review한다.
8. 같은 tuple에서 두 번 연속 `5/5 CLEAN`이 될 때 종료한다.

제품 수정 뒤 이전 clean 판단을 재사용하지 않는다. snapshot은 blanket update하지 않고 issue ID와 reviewer 승인 단위로 갱신한다.

## 8. Clean gate

Clean round는 다음을 모두 충족한다.

- reviewer coverage receipt `5/5 COMPLETE`
- build/typecheck/contracts/flow/content/a11y/runtime/pixel gate PASS
- unexpected skip, orphan state, unregistered visible component `0`
- unresolved actionable `S0/S1/S2=0`
- token/geometry/content/truth violation `0`
- 이전 issue의 fix SHA, acceptance test, reviewer closure 연결
- 다섯 독립 원문과 evidence checksum 보존

동일 tuple의 clean round가 `2/2`일 때만 새 sleek B preview를 배포한다. 현재는 `0/2`이며 기존 private B는 현재 tuple의 배포가 아니다.

## 9. Evidence layout

```text
docs/ondo-baljajwi/evidence/SLEEK-RN/
  manifest.md
  frozen-receipt.md
  reviews/D1.md ... D5.md
  coverage/D1.md ... D5.md
  issues.md
  fixes.md
  screenshots/
  geometry/
  a11y/
  runtime/
```

[`03_REVIEW_MANIFEST.md`](./03_REVIEW_MANIFEST.md)는 round verdict만 요약한다. 상세 원문과 checksum은 위 evidence directory가 소유한다.

`evidence/SLEEK-R1/`은 수정하지 않는 역사 원본이다. 현재 tuple은 product `46ad40f…`, harness `6eceef4…`, baseline digest `0f56b0cf…`로 동결됐고 unchanged-baseline `264/264 PASS`를 포함한 전체 automated gate를 통과했다. R2는 `READY TO START`이며 reviewer verdict, CLEAN 또는 release PASS를 미리 기록하지 않는다.
