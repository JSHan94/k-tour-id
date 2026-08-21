# ONDO B · Evidence Index

상태: `R4 5/5 COMPLETE · NOT CLEAN · 12/12 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · R5 READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

## Current lifecycle and R4-reviewed tuple

| Field | Value |
|---|---|
| R4-reviewed Product SHA | `05f3002899485c528e31730bfebd57d71c3d788d` |
| R4-reviewed Harness SHA | `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` |
| R4-reviewed baseline digest | `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d`; 276 committed PNGs |
| Frozen successor Product | `9ec3d192d0ebdc9614d980bdb173633aee16fc17` |
| Frozen successor Harness / exact HEAD | `12354bcf71621c00a08433faf09cbb000683ae61` |
| Frozen successor digest | `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` · `84 R4-FIX + 192 R4-CARRY` |
| Route | `/ondo-b` |
| Flow registry | `18 flows · 126 checkpoints · 121 ACTUAL · 5 N/A · 0 GAP` |
| Visual registry | `46 cases · 44 state IDs` |
| Exact viewports | `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` |
| Baseline target | `276 committed PNGs` |
| R4-reviewed automated run | discovery `348 tests / 25 files` · typecheck PASS · Webpack build `28/28` PASS · contracts `26/26` · B E2E `323 pass / 25 intentional viewport skips / 0 fail` · visual `276/276 PASS` · high-risk repeat `72/72 PASS` · unexpected/flaky/runtime/geometry/Axe/modal errors `0`; successor에 재사용하지 않음 |
| Current lifecycle | SLEEK R4 historical `5/5 COMPLETE · NOT CLEAN`; frozen successor `12/12 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · REVIEWER CLOSURE PENDING · R5 READY TO START`; clean streak `0/2` |
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

successor tuple의 evidence는 다음을 모두 만족해야 manifest에 PASS로 기록할 수 있다.

1. product SHA, harness SHA, baseline digest가 고정돼 있다.
2. 명령이 같은 product SHA의 production server를 사용한다.
3. registry가 `18 / 126 / 121 / 5 / 0`, visual이 `46 / 44 / 6 / 276` exact census를 통과한다.
4. 모든 126 checkpoint가 `pixel | functional_only` machine disposition을 가진다.
5. grouped flow journey를 126개 exact named `test.step`으로 과장하지 않는다.
6. runtime guard 설치와 first-party request/HTTP failure 검사가 모든 accepted browser/pixel run에 적용된다.
7. baseline은 issue-scoped approval 뒤 commit되며 no-update run으로 재검증된다.

## R4-reviewed command ledger — historical tuple receipt

| Evidence ID | Command family | Required result | Current state |
|---|---|---|---|
| `B-SLK-R4-BUILD` | `pnpm typecheck`, `pnpm exec next build --webpack` | both PASS | typecheck PASS · build `28/28` PASS |
| `B-SLK-R4-CONTRACT` | `pnpm test:contracts` | all PASS | `26/26 PASS` |
| `B-SLK-R4-E2E` | `PLAYWRIGHT_BASE_URL=… pnpm test:e2e:b` | all B suites PASS; only declared viewport skips | discovery `348/25 files`; `323 pass / 25 intentional viewport skips / 0 fail` |
| `B-SLK-R4-PIXEL` | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3174 pnpm test:visual:b` | 276/276 no-update PASS | `276/276 PASS`; `46/46` each viewport; high-risk repeat `72/72`; digest `74100b05…` |
| `B-SLK-R4-REGISTRY` | registry and baseline census specs | exact counts + 276 tracked PNGs | `PASS` — `121 actual / 5 N/A / 0 GAP` |
| `B-SLK-R4-RUNTIME` | runtime, geometry, Axe, and modal assertions | product/runtime/layout/accessibility/modal failure 0 | `PASS · 0` |
| `B-SLK-R3-REVIEW` | five blind roles on historical tuple | record actual verdict | `5/5 COMPLETE · NOT CLEAN · 11 actionable` |
| `B-SLK-R4-REVIEW` | five blind roles on reviewed tuple | record actual verdict | `5/5 COMPLETE · NOT CLEAN · raw S2 12/S3 2 · consolidated S2 10 + accepted S3 2` |
| `B-SLK-R5-REVIEW` | fresh five blind roles on frozen successor tuple | first 5/5 clean | `READY TO START` — successor final receipts sealed |
| `B-SLK-R6-CONFIRM` | same successor tuple five blind roles | second 5/5 clean | not started |

## Integrated implementation receipt — not a PASS ledger

| Slice | Product | Harness | State |
|---|---|---|---|
| Onboarding / Identity / After19 | `81eef070e997bbb8c7f8af0be0486b60c1721570` | `6a0613a1112312dd9014471349300da17c2ffdf2`; legacy alignment `06619cf4d1d8460b4af2cdb8f887deca7c76c208` | fixed · reviewer closure pending |
| Connect / Profile / Checkout | `f9dabea60948ca517518ee5c472c0405602c407a` | `17fa01ddbce3321b71ee22cc844cf3fe901932f7` | fixed · reviewer closure pending |
| Map / Shell / Place | `9ec3d192d0ebdc9614d980bdb173633aee16fc17` | `6ca5c6bada0be665b9571c3b39cfeacf67045d3c` | fixed · reviewer closure pending |

이 표는 12개 finding의 fix commit 연결을 증명한다. Frozen successor는 통합 typecheck/build/contracts/full B E2E, full no-update pixel과 integrity final receipts에서 `FULL AUTOMATED GATE PASS`; fresh reviewer closure는 아직 `PENDING`이다.

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
- [`evidence/SLEEK-R4/manifest.md`](./evidence/SLEEK-R4/manifest.md), [`frozen-receipt.md`](./evidence/SLEEK-R4/frozen-receipt.md), [`baseline-files.tsv`](./evidence/SLEEK-R4/baseline-files.tsv), [`issues.md`](./evidence/SLEEK-R4/issues.md), [`fixes.md`](./evidence/SLEEK-R4/fixes.md), `reviews/`, `coverage/` — R4 `5/5 COMPLETE · NOT CLEAN` 원문, consolidated 12개 fix, frozen successor tuple/inventory

`RUN-*`, `SLEEK-R1`, `SLEEK-R2`, SLEEK-R3와 SLEEK-R4의 review/coverage 원본은 immutable history다. successor Product/Harness/baseline tuple과 다른 결과는 current PASS나 clean streak에 합산하지 않는다. R4는 `NOT CLEAN`; 12개 finding은 successor에서 fixed and automated이나 fresh closure pending이다. R5는 `READY TO START`, clean streak는 `0/2`, deployment는 `NOT DEPLOYED`다.
