# ONDO B · Evidence Index

상태: `CURRENT TUPLE PREFREEZE · HARNESS/BASELINE UNFROZEN · SLEEK R2 NOT STARTED`

## Current tuple

| Field | Value |
|---|---|
| Product SHA | `fb6529e560a6c2b96ae22d1120645e560b8039ef` |
| Harness SHA | `PENDING` |
| Baseline digest | `PENDING` — staging candidate digest `81adf5c4d807888d63ce7fcec1bc795c8997a21d043f82e42465d5c071ee2d62`, not frozen |
| Route | `/ondo-b` |
| Flow registry | `18 flows · 126 checkpoints · 121 ACTUAL · 5 N/A · 0 GAP` |
| Visual registry | `44 cases · 42 state IDs` |
| Exact viewports | `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` |
| Baseline target | `264 committed PNGs` |
| Current accepted automated run | `NONE` — frozen current tuple의 full receipt 대기 |
| Current review | `SLEEK R2 NOT STARTED · clean streak 0/2` |
| Current deployment | `NOT DEPLOYED` |

## Historical private B — not current evidence

| Field | Historical value |
|---|---|
| Product / Harness | `5ac630858389a1ca902a3fcfd01f77ae5bce9bb3` / `6e7254af02adcf49a35424203e2201093485872a` |
| Baseline digest | `5ffbe67fe65e5d46ecb2b7c217394fd2c29847f272dbf56afdac716c66bb49c1` |
| Private URL | `https://ondo-b-private-20260820.phenixnet-jl.chatgpt.site/ondo-b` |
| Status | 이전 tuple의 accepted history. 현재 sleek 제품, 264 baseline 또는 R2를 증명하지 않음 |

이전 URL과 `RUN-20260819-*-FINAL`은 보존 대상 역사 자료다. 제품 변경 뒤 current release evidence나 최종 링크로 사용하지 않는다.

## Evidence admission rules

현재 tuple의 evidence는 다음을 모두 만족해야 manifest에 PASS로 기록할 수 있다.

1. product SHA, harness SHA, baseline digest가 고정돼 있다.
2. 명령이 같은 product SHA의 production server를 사용한다.
3. registry가 `18 / 126 / 121 / 5 / 0`, visual이 `44 / 42 / 6 / 264` exact census를 통과한다.
4. 모든 126 checkpoint가 `pixel | functional_only` machine disposition을 가진다.
5. grouped flow journey를 126개 exact named `test.step`으로 과장하지 않는다.
6. runtime guard 설치와 first-party request/HTTP failure 검사가 모든 accepted browser/pixel run에 적용된다.
7. baseline은 issue-scoped approval 뒤 commit되며 no-update run으로 재검증된다.

## Current command ledger — pending execution receipt

| Evidence ID | Command family | Required result | Current state |
|---|---|---|---|
| `B-SLK-R2-BUILD` | `pnpm typecheck`, `pnpm exec next build --webpack` | both PASS | receipt pending |
| `B-SLK-R2-CONTRACT` | `pnpm test:contracts` | all PASS | receipt pending |
| `B-SLK-R2-E2E` | `PLAYWRIGHT_BASE_URL=… pnpm test:e2e:b` | all B suites PASS, unexpected skip 0 | receipt pending |
| `B-SLK-R2-PIXEL` | `PLAYWRIGHT_BASE_URL=… pnpm test:visual:b` | 264/264 no-update PASS | baseline freeze pending |
| `B-SLK-R2-REGISTRY` | registry and baseline census specs | exact counts + 264 tracked PNGs | commit pending |
| `B-SLK-R2-RUNTIME` | per-test runtime attachments | product error/failure/HTTP 4xx·5xx 0 | receipt pending |
| `B-SLK-R2-REVIEW` | five blind roles | 5/5 complete, actionable 0 | not started |
| `B-SLK-R2-CONFIRM` | same tuple five blind roles | second 5/5 clean | not started |

## Pixel evidence contract

Committed target directories:

```text
k-tour-id-app/tests/visual/ondo-b-flow-pixels-mobile.spec.ts-snapshots/
k-tour-id-app/tests/visual/ondo-b-flow-pixels-desktop.spec.ts-snapshots/
k-tour-id-app/tests/visual/ondo-b-flow-pixels-responsive.spec.ts-snapshots/
```

Exact census:

- mobile canonical: `44` at `390×844`
- desktop canonical: `44` at `1440×1000`
- responsive: `176` = `44` each at `360×800`, `430×932`, `768×1024`, `801×1000`
- total: `264`

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
- `evidence/SLEEK-R2/manifest.md` and `baseline-files.tsv` — current 264-file staging receipt, `REVIEWED-BY-ROOT-PENDING`

`RUN-*`과 `SLEEK-R1`은 immutable history다. 현재 product/harness/baseline tuple과 다른 결과는 current PASS나 clean streak에 합산하지 않는다. `SLEEK-R2` staging receipt는 baseline 후보 파일을 식별할 뿐이며, harness commit·no-update full run·blind review 전에는 round 시작 또는 PASS로 승격하지 않는다.
