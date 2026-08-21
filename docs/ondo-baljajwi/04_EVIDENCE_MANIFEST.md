# ONDO B · Evidence Index

상태: `R5 5/5 COMPLETE · NOT CLEAN · OBJECTIVE S2 3 · 3/3 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

## Current lifecycle and R5-reviewed tuple

| Field | Value |
|---|---|
| R5-reviewed Evidence / Product | `39687c33ca5d14b60304b762b373e719bb4bdbbd` / `9ec3d192d0ebdc9614d980bdb173633aee16fc17` |
| R5-reviewed Harness / digest | `12354bcf71621c00a08433faf09cbb000683ae61` / `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` |
| Frozen retry Product | `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` |
| Frozen retry Harness / exact HEAD | `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` |
| Frozen retry digest | `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91` · `18 R5-FIX + 264 R5-CARRY` |
| Route | `/ondo-b` |
| Flow registry | `18 flows · 126 checkpoints · 121 ACTUAL · 5 N/A · 0 GAP` |
| Visual registry | `47 cases · 45 state IDs` |
| Exact viewports | `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` |
| Baseline target | `282 committed PNGs` |
| R4-reviewed automated run | discovery `348 tests / 25 files` · typecheck PASS · Webpack build `28/28` PASS · contracts `26/26` · B E2E `323 pass / 25 intentional viewport skips / 0 fail` · visual `276/276 PASS` · high-risk repeat `72/72 PASS` · unexpected/flaky/runtime/geometry/Axe/modal errors `0`; successor에 재사용하지 않음 |
| Current lifecycle | SLEEK R5 historical `5/5 COMPLETE · NOT CLEAN · objective S2 3`; retry `3/3 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · REVIEWER CLOSURE PENDING · R5 RETRY READY TO START`; clean streak `0/2` |
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
3. registry가 `18 / 126 / 121 / 5 / 0`, visual이 `47 / 45 / 6 / 282` exact census를 통과한다.
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
| `B-SLK-R5-REVIEW` | five blind roles on reviewed successor | record actual verdict | `5/5 COMPLETE · NOT CLEAN · objective S2 3`; D1/D3/D5 NOT CLEAN, D2/D4 CLEAN |
| `B-SLK-R5-RETRY-GATE` | exact retry full nonpixel + uninterrupted visual | all PASS before review | visual `282/282` + high-risk `216/216` + landscape `2/2`; B `420+84/504`; A `22/22`; `FULL AUTOMATED GATE PASS` |
| `B-SLK-R6-CONFIRM` | same clean retry tuple five blind roles | second 5/5 clean | not started |

## Integrated implementation receipt — not a PASS ledger

| Slice | Product | Harness | State |
|---|---|---|---|
| Onboarding / Identity / After19 | `81eef070e997bbb8c7f8af0be0486b60c1721570` | `6a0613a1112312dd9014471349300da17c2ffdf2`; legacy alignment `06619cf4d1d8460b4af2cdb8f887deca7c76c208` | fixed · reviewer closure pending |
| Connect / Profile / Checkout | `f9dabea60948ca517518ee5c472c0405602c407a` | `17fa01ddbce3321b71ee22cc844cf3fe901932f7` | fixed · reviewer closure pending |
| Map / Shell / Place | `9ec3d192d0ebdc9614d980bdb173633aee16fc17` | `6ca5c6bada0be665b9571c3b39cfeacf67045d3c` | fixed · reviewer closure pending |

이 표는 R4 열두 finding의 역사 fix 연결이다. R5 세 finding의 retry commits는 [`evidence/SLEEK-R5/fixes.md`](./evidence/SLEEK-R5/fixes.md)가 소유한다. Retry exact visual/nonpixel receipts는 모두 `PASS`; fresh reviewer closure는 `PENDING`이다.

## Pixel evidence contract

Committed target directories:

```text
k-tour-id-app/tests/visual/ondo-b-flow-pixels-mobile.spec.ts-snapshots/
k-tour-id-app/tests/visual/ondo-b-flow-pixels-desktop.spec.ts-snapshots/
k-tour-id-app/tests/visual/ondo-b-flow-pixels-responsive.spec.ts-snapshots/
```

Exact census:

- mobile canonical: `47` at `390×844`
- desktop canonical: `47` at `1440×1000`
- responsive: `188` = `47` each at `360×800`, `430×932`, `768×1024`, `801×1000`
- total: `282`

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
- [`evidence/SLEEK-R5/manifest.md`](./evidence/SLEEK-R5/manifest.md), [`frozen-receipt.md`](./evidence/SLEEK-R5/frozen-receipt.md), [`baseline-files.tsv`](./evidence/SLEEK-R5/baseline-files.tsv), [`issues.md`](./evidence/SLEEK-R5/issues.md), [`fixes.md`](./evidence/SLEEK-R5/fixes.md), `reviews/`, `coverage/` — R5 `5/5 COMPLETE · NOT CLEAN` 원문과 세 fix의 retry candidate

`RUN-*`와 SLEEK-R1~R5 review/coverage 원본은 immutable history다. Retry Product/Harness/baseline tuple과 다른 결과는 current PASS나 clean streak에 합산하지 않는다. R5는 `NOT CLEAN`; 세 finding은 retry에서 fixed and automated이며 full gate가 통과했지만 fresh closure는 pending이다. R5 retry는 `READY TO START`, clean streak는 `0/2`, deployment는 `NOT DEPLOYED`다.
