# ONDO B · Evidence Index

상태: `CURRENT TUPLE FROZEN · FULL AUTOMATED QA PASS · HISTORICAL R3 NOT CLEAN · R4 READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

## Current tuple

| Field | Value |
|---|---|
| Product SHA | `05f3002899485c528e31730bfebd57d71c3d788d` |
| Harness SHA | `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` |
| Baseline digest | `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d`; 276 committed PNGs |
| Route | `/ondo-b` |
| Flow registry | `18 flows · 126 checkpoints · 121 ACTUAL · 5 N/A · 0 GAP` |
| Visual registry | `46 cases · 44 state IDs` |
| Exact viewports | `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` |
| Baseline target | `276 committed PNGs` |
| Current automated run | discovery `348 tests / 25 files` · typecheck PASS · Webpack build `28/28` PASS · contracts `26/26` · B E2E `323 pass / 25 intentional viewport skips / 0 fail` · visual `276/276 PASS` · high-risk repeat `72/72 PASS` · unexpected/flaky/runtime/geometry/Axe/modal errors `0` |
| Current review | historical SLEEK R3 `5/5 COMPLETE · NOT CLEAN · 11 actionable`; successor `11/11 FIXED · CLOSURE PENDING`; R4 ready to start; clean streak `0/2` |
| Current deployment | `NOT DEPLOYED` |

## Historical private B — not current evidence

| Field | Historical value |
|---|---|
| Product / Harness | `5ac630858389a1ca902a3fcfd01f77ae5bce9bb3` / `6e7254af02adcf49a35424203e2201093485872a` |
| Baseline digest | `5ffbe67fe65e5d46ecb2b7c217394fd2c29847f272dbf56afdac716c66bb49c1` |
| Private URL | `https://ondo-b-private-20260820.phenixnet-jl.chatgpt.site/ondo-b` |
| Status | 이전 tuple의 accepted history. 현재 sleek 제품, 276 baseline 또는 R4를 증명하지 않음 |

이전 URL과 `RUN-20260819-*-FINAL`은 보존 대상 역사 자료다. 제품 변경 뒤 current release evidence나 최종 링크로 사용하지 않는다.

## Evidence admission rules

현재 tuple의 evidence는 다음을 모두 만족해야 manifest에 PASS로 기록할 수 있다.

1. product SHA, harness SHA, baseline digest가 고정돼 있다.
2. 명령이 같은 product SHA의 production server를 사용한다.
3. registry가 `18 / 126 / 121 / 5 / 0`, visual이 `46 / 44 / 6 / 276` exact census를 통과한다.
4. 모든 126 checkpoint가 `pixel | functional_only` machine disposition을 가진다.
5. grouped flow journey를 126개 exact named `test.step`으로 과장하지 않는다.
6. runtime guard 설치와 first-party request/HTTP failure 검사가 모든 accepted browser/pixel run에 적용된다.
7. baseline은 issue-scoped approval 뒤 commit되며 no-update run으로 재검증된다.

## Current command ledger — frozen-tuple execution receipt

| Evidence ID | Command family | Required result | Current state |
|---|---|---|---|
| `B-SLK-R4-BUILD` | `pnpm typecheck`, `pnpm exec next build --webpack` | both PASS | typecheck PASS · build `28/28` PASS |
| `B-SLK-R4-CONTRACT` | `pnpm test:contracts` | all PASS | `26/26 PASS` |
| `B-SLK-R4-E2E` | `PLAYWRIGHT_BASE_URL=… pnpm test:e2e:b` | all B suites PASS; only declared viewport skips | discovery `348/25 files`; `323 pass / 25 intentional viewport skips / 0 fail` |
| `B-SLK-R4-PIXEL` | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3174 pnpm test:visual:b` | 276/276 no-update PASS | `276/276 PASS`; `46/46` each viewport; high-risk repeat `72/72`; digest `74100b05…` |
| `B-SLK-R4-REGISTRY` | registry and baseline census specs | exact counts + 276 tracked PNGs | `PASS` — `121 actual / 5 N/A / 0 GAP` |
| `B-SLK-R4-RUNTIME` | runtime, geometry, Axe, and modal assertions | product/runtime/layout/accessibility/modal failure 0 | `PASS · 0` |
| `B-SLK-R3-REVIEW` | five blind roles on historical tuple | record actual verdict | `5/5 COMPLETE · NOT CLEAN · 11 actionable` |
| `B-SLK-R4-REVIEW` | five blind roles on successor tuple | 5/5 complete, actionable 0 | ready to start; no verdict |
| `B-SLK-R5-CONFIRM` | same successor tuple five blind roles | second 5/5 clean | not started |

## Pixel evidence contract

Committed target directories:

```text
k-tour-id-app/tests/visual/ondo-b-flow-pixels-mobile.spec.ts-snapshots/
k-tour-id-app/tests/visual/ondo-b-flow-pixels-desktop.spec.ts-snapshots/
k-tour-id-app/tests/visual/ondo-b-flow-pixels-responsive.spec.ts-snapshots/
```

Exact census:

- mobile canonical: `46` at `390×844`
- desktop canonical: `46` at `1440×1000`
- responsive: `184` = `46` each at `360×800`, `430×932`, `768×1024`, `801×1000`
- total: `276`

각 결과는 case metadata, geometry, Axe, runtime evidence를 붙인다. viewport dimension, case/state uniqueness, git-tracked count를 registry test가 검사한다. 외부 vector basemap만 deterministic empty source로 대체하며 ONDO overlay와 UI는 숨기지 않는다.

## Checkpoint evidence contract

`B_CHECKPOINT_VISUAL_EVIDENCE`는 18 flow × 7 checkpoint = 126 exact row를 가진다.

- `pixel`: layout-distinct state를 증명하는 하나 이상의 `B-PX-*` case ID를 가리킨다.
- `functional_only`: 별도 screenshot을 만들지 않는 이유와 canonical browser proof를 기록한다.

이 매핑은 visual completeness를 checkpoint 수만큼 중복 screenshot으로 부풀리지 않으면서도 orphan checkpoint와 orphan visual case를 금지한다.

## Data and truth evidence

- 공식 LOCALDATA active-licence F&B 장소 `400` (`서울 200 / 부산 200`)
- stable venue ID, source/licence/snapshot provenance
- simulated ONDO signal `80`, official place record와 분리
- simulated After19 night-category subset `17` (`서울 7 / 부산 10`)
- unknown field는 인기·영업 중·외국인 친화·안전으로 승격하지 않음
- CX/Residence/Passport/Age/Payment, chat/photo/payment/bridge/trait/badge는 화면에 표시한 simulation/contract/deferred 경계를 유지

## Durable history

- [`evidence/RUN-20260819-R3-FINAL/manifest.md`](./evidence/RUN-20260819-R3-FINAL/manifest.md)
- [`evidence/RUN-20260819-R4-FINAL/manifest.md`](./evidence/RUN-20260819-R4-FINAL/manifest.md)
- `evidence/SLEEK-R1/`
- `evidence/SLEEK-R2/` — immutable R2 history
- [`evidence/SLEEK-R3/manifest.md`](./evidence/SLEEK-R3/manifest.md), `frozen-receipt.md`, `baseline-files.tsv`, `issues.md`, `fixes.md`, `reviews/`, `coverage/` — historical R3 NOT CLEAN 원문과 11개 successor fix/evidence 연결

`RUN-*`, `SLEEK-R1`, `SLEEK-R2`, SLEEK-R3의 열 개 review/coverage 원본은 immutable history다. 현재 product/harness/baseline tuple과 다른 결과는 current PASS나 clean streak에 합산하지 않는다. 역사 R3는 `NOT CLEAN`이고 11개 finding은 successor tuple에서 fixed/closure-pending이다. Full automated receipt가 닫혀 fresh R4는 `READY TO START`이며, clean streak는 `0/2`, deployment는 `NOT DEPLOYED`다.
