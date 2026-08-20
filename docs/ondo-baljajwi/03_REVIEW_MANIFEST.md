# ONDO B · Five-role Review Manifest

상태: `FROZEN TUPLE · FULL AUTOMATED QA PASS · SLEEK R2 READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

| Field | Current value |
|---|---|
| Product SHA | `46ad40f9fdbad89d3cf3e701f713803004d3e3af` |
| Harness SHA | `6eceef4fe72be2ce86808821a7b6a8a6dd9a09d6` |
| Baseline digest | `0f56b0cfde9049e73e32c40d715fb8cd8c475f66c725d32c8e930a482aa45b3e` · 264 committed PNGs |
| Route | `/ondo-b` |
| Visual scope | `44 cases · 42 state IDs · 6 viewports · 264 baselines` |
| Flow scope | `18 flows · 126 checkpoints · 121 ACTUAL · 5 N/A · 0 GAP` |
| Review rule | 같은 frozen tuple, blind independent submission, actionable `S0/S1/S2=0` |
| Clean streak | `0/2` |
| Deployment | 새 sleek B 미배포; 기존 private B는 이전 tuple의 역사 preview |

## Current sleek round ledger

| Round | Product/Harness/Baseline | Five reviewers | Actionable state | Clean contribution |
|---|---|---|---|---|
| `SLEEK-R1` | 이전 sleek baseline tuple | `5/5 NOT CLEAN` | 22개 finding이 fix/retest loop로 들어감 | `NO` |
| `SLEEK-R2` | `46ad40f… / 6eceef4… / 0f56b0c…`; full automated QA PASS | `READY TO START` | reviewer verdict 없음 | `NO · 0/2` |
| clean confirmation | R2와 동일 tuple에서만 실행 | `NOT STARTED` | R2 clean 뒤에만 가능 | `NO · 0/2` |

`SLEEK-R1` reviewer 원문과 issue ledger는 `evidence/SLEEK-R1/`의 immutable 역사 증거다. 코드 수정이 들어갔으므로 R1 verdict를 현재 제품 closure나 clean으로 재해석하지 않는다. 현재 tuple은 product `46ad40f…`, harness `6eceef4…`, baseline `0f56b0c…`로 동결됐고 automated gate를 통과했다. 이는 R2 검토를 시작할 준비가 됐다는 뜻이며 R2 시작·완료·CLEAN verdict를 미리 뜻하지 않는다.

## Older accepted tuple — history only

이전 제품 `5ac630858389a1ca902a3fcfd01f77ae5bce9bb3`, harness `6e7254af02adcf49a35424203e2201093485872a`, digest `5ffbe67fe65e5d46ecb2b7c217394fd2c29847f272dbf56afdac716c66bb49c1`에는 당시 R3/R4 clean과 private deployment 기록이 있다.

| Historical round | Historical result | Current release gate |
|---|---|---|
| `RUN-20260819-R3-FINAL` | 당시 같은 tuple의 5-role clean | 제품 변경으로 invalidated |
| `RUN-20260819-R4-FINAL` | 당시 같은 tuple의 두 번째 5-role clean | 제품 변경으로 invalidated |

원문은 [`evidence/RUN-20260819-R3-FINAL/manifest.md`](./evidence/RUN-20260819-R3-FINAL/manifest.md)와 [`evidence/RUN-20260819-R4-FINAL/manifest.md`](./evidence/RUN-20260819-R4-FINAL/manifest.md)에 보존한다. 이 기록은 삭제하거나 다시 쓰지 않지만 현재 clean streak에는 포함하지 않는다.

## Review and triage rule

- 다섯 역할 모두 `18/18 flows`, `44/44 cases`, `42/42 states`, `6/6 viewports` coverage receipt를 제출해야 한다.
- 각 reviewer는 다른 reviewer 결과를 읽기 전에 같은 frozen evidence pack을 검토한다.
- 단일 재현 가능한 `S0/S1`과 objective usability/a11y/truth/localization `S2`는 즉시 block한다.
- 주관적 aesthetic `S2`는 동일 fingerprint에 독립 `2/5` 합의가 있어야 actionable이다.
- `S3`는 locked token 위반 또는 독립 `3/5` 합의부터 actionable이다.
- minority truth/privacy/a11y finding은 다수결로 폐기하지 않는다.
- duplicate finding은 살아 있는 issue ID와 fix/retest evidence를 가리켜야 한다.
- product, harness 또는 baseline이 바뀌면 진행 중 review와 clean streak를 모두 무효화한다.

## Next admissible evidence

1. 동결 tuple의 automated receipt(typecheck/build PASS, contracts `26/26`, E2E `213 pass / 5 intentional viewport skips / 0 fail`, pixel `264/264`)를 유지한다.
2. 같은 tuple을 다섯 reviewer에게 blind 배포한다.
3. actionable issue가 있으면 product/harness fix 후 tuple을 다시 고정하고 R2를 처음부터 재시작한다.
4. R2가 5/5 clean이면 같은 tuple에서 두 번째 독립 5/5 clean round를 실행한다.

두 round가 모두 clean이 되기 전에는 새 sleek preview를 final 또는 release candidate로 표시하지 않는다.
