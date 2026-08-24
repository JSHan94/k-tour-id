# ONDO B · Evidence Index

상태: `FINAL AUTOMATED GATES SEALED GREEN · BLIND REVIEW READY · CLEAN 0/2 · NOT DEPLOYED`

## Current lifecycle and frozen boundaries

| Field | Value |
|---|---|
| R5-reviewed Evidence / Product | `39687c33ca5d14b60304b762b373e719bb4bdbbd` / `9ec3d192d0ebdc9614d980bdb173633aee16fc17` |
| R5-reviewed Harness / digest | `12354bcf71621c00a08433faf09cbb000683ae61` / `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` |
| R5-RETRY reviewed Evidence / Product / Harness | `b0d25fe…` / `30dcb136…` / `ee19adb…` |
| R5-RETRY reviewed digest / verdict | `f1ec9b0c…` · `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1` |
| Failed CLEAN1 b68 Product / Harness / digest | `5b519e60eb7825e2573ca6692683315cbf508401` / `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` / `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` · `INCOMPLETE · NOT CLEAN · raw 0/1/5/0` |
| Failed CLEAN1 c05 Evidence / Product / Harness / digest | `fcd4447d86ac01daf90ee763963e1ddfa7a7f811` / `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` / `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` / `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` · `5/5 COMPLETE · NOT CLEAN · raw 0/0/3/2` |
| Disqualified automated predecessor | Product `be645fb070be8f4c514bd0a2dc96774d238ceffc` / Harness `7c7b39d0986a4a501a23f62a8f80fde16f35fc16` / digest `86ac0588985647163bf8028eee4804d3adbeda1f248206406bd765d5ca19ce00` · full B `586 pass / 135 skip / 1 fail`; failure manifest SHA `091e4e190c75b85109ba8c401f5bc1daaf4f72153c633afe089304f78cdf9348` |
| Current Product / Harness / frozen candidate | `cb4fcd3585cfb8a0693913d3e300881208f8ecad` / `cb4fcd3585cfb8a0693913d3e300881208f8ecad` / `cb4fcd3585cfb8a0693913d3e300881208f8ecad` |
| Current digest / provenance | `86ac0588985647163bf8028eee4804d3adbeda1f248206406bd765d5ca19ce00` · `294 byte-identical c05 carries + 6 localized B-PX-FEEDBACK-KO refreshes` |
| Route | `/ondo-b` |
| Flow registry | `18 flows · 126 checkpoints · 123 ACTUAL · 3 N/A · 0 GAP` |
| Visual registry | `50 cases · 48 state IDs` |
| Exact viewports | `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` |
| Baseline target | `300 committed candidate PNGs` |
| Current static discovery census | B `726 tests / 42 files`; A regression `22 tests / 3 files`; contracts `38 tests / 5 files`. This is a list census, not an execution PASS. |
| Current exact nonpixel receipt | `SEALED GREEN`: B `589 pass / 137 intentional skip / 0 fail`, A `22/22`, contracts `38/38`, anomalies `0`; evidence SHA256SUMS file SHA `11933327bcc1047f67168b2c0f3c237b6d09d2b0606de2c0ad43436c979cebeb`; disclosed post-reporter zsh wrapper-only exit does not alter Playwright PASS |
| Current exact visual receipt | `SEALED GREEN`: `300/300` no-update + `144/144` high-risk + `20/20` safeguards; reporter `464/464`, health `3510/3510`, anomalies `0`; manifest SHA `c9378cdfac905aecebbe9fb66b779be4a89dd5c0b9c015ee39cf2ae529087ef0` |
| R4-reviewed automated run | discovery `348 tests / 25 files` · typecheck PASS · Webpack build `28/28` PASS · contracts `26/26` · B E2E `323 pass / 25 intentional viewport skips / 0 fail` · visual `276/276 PASS` · high-risk repeat `72/72 PASS` · unexpected/flaky/runtime/geometry/Axe/modal errors `0`; successor에 재사용하지 않음 |
| Current lifecycle | b68 and c05 failed CLEAN1 preserved; final automated gates `SEALED GREEN`; blind review `READY`; clean streak `0/2`; `NOT DEPLOYED` |
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
3. registry가 `18 / 126 / 123 / 3 / 0`, visual이 `50 / 48 / 6 / 300` exact census를 통과한다.
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
| `B-SLK-R5-RETRY-REVIEWED-GATE` | historical exact retry full nonpixel + uninterrupted visual | all PASS before historical review | visual `282/282` + high-risk `216/216` + landscape `2/2`; B `420+84/504`; A `22/22`; historical PASS only |
| `B-SLK-R5-RETRY-REVIEW` | five blind roles on `b0d25fe…` evidence | record actual verdict | `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1` |
| `B-SLK-R5R-b68-GATE` | historical exact `5b519e6… / b68fc18… / 1dcfacb7…` nonpixel + uninterrupted visual | all PASS before its blind review | historical `PASS`; later CLEAN1 failed and invalidated release use |
| `B-SLK-R5R-b68-CLEAN1` | five blind roles on exact b68 tuple | record actual verdict | `INCOMPLETE · NOT CLEAN · raw S0 0 / S1 1 / S2 5 / S3 0 · CLEAN 0/2` |
| `B-SLK-R5R-c05-GATE` | exact `5c6383e… / c05a2d0… / addf064…` nonpixel + uninterrupted visual | all PASS before blind review | full automated `PASS`; blind clean round `READY` |
| `B-SLK-R5R-c05-CLEAN1` | five blind roles on exact Evidence `fcd4447…` c05 tuple | record actual verdict | `5/5 COMPLETE · NOT CLEAN · raw S0 0 / S1 0 / S2 3 / S3 2 · CLEAN 0/2` |
| `B-SLK-R5R-7c7-GATE` | exact `be645fb… / 7c7b39d… / 86ac058…` | both nonpixel and visual GREEN required | `DISQUALIFIED`: visual GREEN, but full B `586 pass / 135 skip / 1 fail`; real `844×390` EN rail collision; no PASS credit |
| `B-SLK-R5R-cb4-GATE` | exact `cb4fcd3… / cb4fcd3… / 86ac058…` nonpixel + uninterrupted visual | all PASS before blind review | `SEALED GREEN`; blind review READY; clean credit remains `0/2` |
| `B-SLK-R6-CONFIRM` | same clean retry tuple five blind roles | second 5/5 clean | not started |

## Integrated implementation receipt — not a PASS ledger

| Slice | Product | Harness | State |
|---|---|---|---|
| Onboarding / Identity / After19 | `81eef070e997bbb8c7f8af0be0486b60c1721570` | `6a0613a1112312dd9014471349300da17c2ffdf2`; legacy alignment `06619cf4d1d8460b4af2cdb8f887deca7c76c208` | fixed · reviewer closure pending |
| Connect / Profile / Checkout | `f9dabea60948ca517518ee5c472c0405602c407a` | `17fa01ddbce3321b71ee22cc844cf3fe901932f7` | fixed · reviewer closure pending |
| Map / Shell / Place | `9ec3d192d0ebdc9614d980bdb173633aee16fc17` | `6ca5c6bada0be665b9571c3b39cfeacf67045d3c` | fixed · reviewer closure pending |

이 표는 R4 열두 finding의 역사 fix 연결이다. R5 세 finding은 [`evidence/SLEEK-R5/fixes.md`](./evidence/SLEEK-R5/fixes.md), R5-RETRY raw finding은 [`evidence/SLEEK-R5-RETRY/issues.md`](./evidence/SLEEK-R5-RETRY/issues.md)와 [`fixes.md`](./evidence/SLEEK-R5-RETRY/fixes.md)가 소유한다. Failed CLEAN1 원문과 receipt는 별도 immutable namespace가 소유한다. Current successor exact nonpixel과 visual receipts는 모두 GREEN이므로 fresh strict-blind review는 READY다.

## Pixel evidence contract

Committed target directories:

```text
k-tour-id-app/tests/visual/ondo-b-flow-pixels-mobile.spec.ts-snapshots/
k-tour-id-app/tests/visual/ondo-b-flow-pixels-desktop.spec.ts-snapshots/
k-tour-id-app/tests/visual/ondo-b-flow-pixels-responsive.spec.ts-snapshots/
```

Exact census:

- mobile canonical: `50` at `390×844`
- desktop canonical: `50` at `1440×1000`
- responsive: `200` = `50` each at `360×800`, `430×932`, `768×1024`, `801×1000`
- total: `300`

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
- [`evidence/SLEEK-R5-RETRY/manifest.md`](./evidence/SLEEK-R5-RETRY/manifest.md), [`frozen-receipt.md`](./evidence/SLEEK-R5-RETRY/frozen-receipt.md), [`baseline-files.tsv`](./evidence/SLEEK-R5-RETRY/baseline-files.tsv), [`issues.md`](./evidence/SLEEK-R5-RETRY/issues.md), [`fixes.md`](./evidence/SLEEK-R5-RETRY/fixes.md), `reviews/`, `coverage/` — immutable R5-RETRY `5/5 NOT CLEAN` originals and the separate current successor boundary/census
- [`evidence/SLEEK-R5R-CLEAN1-b68fc18/`](./evidence/SLEEK-R5R-CLEAN1-b68fc18/) — immutable failed CLEAN1 originals, coverage, and `CLEAN 0/2` receipt
- [`evidence/SLEEK-R5R-CLEAN1-c05a2d0/`](./evidence/SLEEK-R5R-CLEAN1-c05a2d0/) — immutable complete but NOT CLEAN originals, coverage, and `CLEAN 0/2` receipt
- [`evidence/SLEEK-R5R-FINAL-b68fc18/frozen-receipt.md`](./evidence/SLEEK-R5R-FINAL-b68fc18/frozen-receipt.md) — immutable historical b68 strict-blind pack; not current evidence
- [`evidence/SLEEK-R5R-FINAL-c05a2d0/frozen-receipt.md`](./evidence/SLEEK-R5R-FINAL-c05a2d0/frozen-receipt.md) — immutable historical c05 pack; its later CLEAN1 was NOT CLEAN
- [`evidence/SLEEK-R5R-FINAL-cb4fcd3/frozen-receipt.md`](./evidence/SLEEK-R5R-FINAL-cb4fcd3/frozen-receipt.md), [`automated-gates.md`](./evidence/SLEEK-R5R-FINAL-cb4fcd3/automated-gates.md), [`baseline-files.tsv`](./evidence/SLEEK-R5R-FINAL-cb4fcd3/baseline-files.tsv), [`SHA256SUMS`](./evidence/SLEEK-R5R-FINAL-cb4fcd3/SHA256SUMS) — current candidate minimal pack; exact automated gates SEALED GREEN, blind review READY

`RUN-*`, SLEEK-R1~R5-RETRY, failed CLEAN1 review/coverage 원본은 immutable history다. Current Product/Harness/baseline tuple과 다른 결과는 current PASS나 clean streak에 합산하지 않는다. Current successor automated gates는 SEALED GREEN이고 fresh blind review는 `READY`다. Clean streak는 `0/2`, deployment는 `NOT DEPLOYED`다.
