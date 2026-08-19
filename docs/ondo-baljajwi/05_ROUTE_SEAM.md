# ONDO B Test Route Seam

상태: `PENDING ROOT CONTRACT`

제품 source를 이 QA branch에서 수정하지 않는다. `/ondo-b`가 구현되기 전에는 B browser/visual/content tests가 `test.skip`으로 수집되고 registry test만 실행된다.

## 1. 최소 route 계약

| 항목 | 계약 |
|---|---|
| B route | `/ondo-b` |
| Root | `[data-testid="ondo-b-root"]` |
| Variant | root `data-variant="B"` |
| Flow | root `data-b-flow="FL-001"`~`FL-018` |
| Checkpoint | root `data-b-checkpoint="entry|decision|cancel|error|retry|terminal|return"` |
| Locale | root `data-locale="ko|en"` 또는 동일한 공개 locale state |
| Primary action | `[data-b-primary-action]` |
| Cancel action | `[data-b-cancel-action]` |
| Retry action | `[data-b-retry-action]` |
| Return anchor | `[data-b-return-anchor]`로 원 venue/Table/map/My/Labs context 식별 |
| Dynamic mask | `[data-qa-mask="dynamic"]`; third-party tile 외 최소 사용 |

## 2. 결정적 QA query 제안

```text
/ondo-b?qaCase=B-E2E-FL-003-ERROR&locale=ko
```

`qaCase`는 개발·QA 환경에서만 exact allowlist로 해석한다. 임의 state mutation, PII, raw credential, blob, private profile 값은 query에 넣지 않는다. production에서 알 수 없는 `qaCase`는 안전하게 일반 `/ondo-b` entry로 간다.

각 `qaCase`는 [Trace Matrix](./01_TRACE_MATRIX.md)의 exact checkpoint 하나를 재현한다. `ENTRY→DECISION`, `ERROR→RETRY`, `TERMINAL→RETURN` 전이는 canonical 상태 모델을 사용하고 테스트 전용 DOM만 흉내 내지 않는다.

## 3. Activation checklist

- [ ] Root가 실제 B route와 component owner를 확인
- [ ] `qaCase` allowlist 또는 동등 fixture adapter를 확인
- [ ] root/checkpoint/action selector를 실제 UI에 연결
- [ ] `/ondo-b`가 production build에서 compile
- [ ] helper의 `B_ROUTE_SEAM_READY`를 `true`로 변경
- [ ] skipped 126+72+36+18이 실제 실행으로 전환되는지 `--list` 확인
- [ ] 첫 실행 전 screenshot baseline을 자동 승인하지 않음
- [ ] A `/ondo` existing tests도 같이 실행해 non-inferiority 확인

Root가 다른 seam을 선택하면 이 문서와 helper를 한 atomic commit에서 함께 갱신한다. selector를 test마다 제각각 하드코딩하지 않는다.
