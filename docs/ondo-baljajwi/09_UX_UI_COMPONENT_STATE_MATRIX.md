# ONDO B · UX/UI Component & State Matrix

상태: `EXECUTABLE REGISTRY FROZEN · 276/276 PIXEL PASS · FULL AUTOMATED QA PASS · HISTORICAL R3 NOT CLEAN · R4 READY TO START`

## 1. Current exact inventory

| Item | Count |
|---|---:|
| Product SHA | `05f3002899485c528e31730bfebd57d71c3d788d` |
| Harness SHA | `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` |
| Baseline digest | `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d` |
| B route | `1` — `/ondo-b` |
| Tab roots | `4` — ONDO, My Korea, Tables, ID |
| Reducer surface kinds | `7` — map, venue, table, chat, local_signal, checkout, labs |
| B content surface families | `14` |
| Flow | `18` |
| Flow checkpoints | `126` — `121 ACTUAL / 5 N/A / 0 GAP` |
| Visual cases | `46` |
| Distinct visual state IDs | `44` |
| Exact viewports | `6` |
| Baseline target | `276 committed PNGs` |
| Locale mix per 46-case registry | `EN 30 / KO 16` |

Exact viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`.

## 2. Family coverage

| Family | Source | Registered visual cases | Required complementary proof |
|---|---|---:|---|
| Shell/nav | `features/ondo/app/*` | 모든 case에 포함 | nav state, inert modal background, focus return, scroll, safe area |
| Onboarding | `onboarding/*` | `3` | three personas, skip/fallback, KO/EN content suite |
| Nation/City | `map/*` | `6` | Seoul/Busan 200 each, map/list/fallback/retry, heat/cluster distinction |
| Place/Save | `place/*` | `4` + shared detail cases | UNKNOWN facts, exact venue preservation, save failure/retry |
| JIT gates | `identity/*` | `7` | Account/Person/Age/Payment isolation, cancel/error/retry/return |
| Tables/chat | `connect/*` | `8` | global list, venue-scoped empty recovery, member lock, join failure, image retry, feedback/report |
| Local Signal/photo | `connect/*`, `media/*` | `3` | empty/failure/success, draft preservation |
| Checkout/stamp | `commerce/*` | `5` | cancel/failure invariants, receipt≠visit, stamp milestone |
| My Korea | `my/*` | `1` | same saved venue and milestone persistence |
| Profile/Trust | `profile/*`, `trust/*` | `2` | consent and four independent reputation axes |
| Global/venue After19 | `after19/*`, `place/*` | `3` | manual prompt isolation, four guards, manual-off priority, exact venue return |
| Labs | `labs/*` | `4` | truth boundary, trait failure, bridge failure/success invariants |

Case 수는 중복 surface를 억지로 늘리지 않는다. layout-distinct UI가 없는 checkpoint는 browser assertion과 `functional_only` reason으로 증명한다.

## 3. Executable registry shapes

정본은 `tests/helpers/ondo-b-visual-evidence.ts`다. 문서용 이상형 schema를 별도로 발명하지 않고 현재 코드의 실제 형태를 기록한다.

```ts
type BVisualCase = {
  id: `B-PX-${string}`
  state: BVisualStateId
  flows: readonly BFlowId[]
  locale: "ko" | "en"
  description: string
}

type BCheckpointVisualEvidence = {
  checkpointId: `B-E2E-${BFlowId}-${BCheckpoint}`
  disposition: "pixel" | "functional_only"
  caseIds: readonly BVisualCase["id"][]
  reason: string
}
```

Setup fixture와 truth/geometry/a11y assertions는 case registry를 소비하는 canonical setup 함수와 capture guard가 실행한다. 현재 schema에 없는 `selector`, `stateClass`, `setupFixture` 필드가 있다고 주장하지 않는다.

## 4. Checkpoint mapping

`B_CHECKPOINT_VISUAL_EVIDENCE`는 `18 × 7 = 126` row를 정확히 생성한다.

- `pixel`: 하나 이상의 46 canonical case를 연결한다.
- `functional_only`: 별도 layout screenshot이 필요 없는 이유와 `B_FLOW_CONTRACTS` browser proof를 연결한다.
- 126 checkpoint ID는 unique여야 한다.
- 46 visual case는 적어도 한 checkpoint에서 참조되어야 하며 orphan을 허용하지 않는다.
- 한 composite flow test가 여러 checkpoint를 증명할 수 있다. 126개의 exact named `test.step`이 있다고 주장하지 않는다.

## 5. Baseline census and gates

1. 46 case ID와 44 exact state ID set이 코드와 일치해야 한다.
2. 각 case를 여섯 exact viewport에서 한 번씩 캡처해 `276` PNG를 만든다.
3. mobile directory `46`, desktop directory `46`, responsive directory `184`이어야 한다.
4. 각 PNG 실제 dimension이 filename/viewport registry와 일치해야 한다.
5. 276 PNG 모두 git tracked여야 한다.
6. visible metadata `≥12px`, hit target `≥44×44`, horizontal overflow/independent control overlap/nav overlap `0`이어야 한다.
7. active modal은 하나만 노출되고 background는 inert+aria-hidden이며 visible exit가 있어야 한다.
8. serious/critical Axe, contrast/name/label violation, product runtime failure `0`이어야 한다.
9. baseline update는 issue-scoped approval 후 수행하고 최종에는 no-update full 276 run을 통과해야 한다.

현재 276 PNG baseline set은 harness `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4`, digest `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d`로 동결됐고 uninterrupted workers-1 unchanged-baseline `276/276`, 각 viewport `46/46`, high-risk repeat `72/72`가 통과했다. Discovery `348 tests / 25 files`, typecheck PASS, Webpack build `28/28` PASS, contracts `26/26`, B E2E `323 pass / 25 intentional viewport skips / 0 fail`, unexpected/flaky/runtime/geometry/Axe/modal errors `0`, checkpoint mapping `121 ACTUAL / 5 N/A / 0 GAP`도 통과했다. 역사 SLEEK R3는 `5/5 COMPLETE · NOT CLEAN · 11 actionable`; successor에서 `11/11 FIXED · CLOSURE PENDING`이다. R4는 `READY TO START`이며 clean streak는 `0/2`, 배포 상태는 `NOT DEPLOYED`다.
