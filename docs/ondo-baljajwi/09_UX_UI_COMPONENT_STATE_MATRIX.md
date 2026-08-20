# ONDO B · UX/UI Component & State Matrix

상태: `EXECUTABLE REGISTRY FROZEN · 264/264 PIXEL PASS · FULL AUTOMATED QA PASS · SLEEK R2 READY TO START`

## 1. Current exact inventory

| Item | Count |
|---|---:|
| Product SHA | `46ad40f9fdbad89d3cf3e701f713803004d3e3af` |
| Harness SHA | `6eceef4fe72be2ce86808821a7b6a8a6dd9a09d6` |
| Baseline digest | `0f56b0cfde9049e73e32c40d715fb8cd8c475f66c725d32c8e930a482aa45b3e` |
| B route | `1` — `/ondo-b` |
| Tab roots | `4` — ONDO, My Korea, Tables, ID |
| Reducer surface kinds | `7` — map, venue, table, chat, local_signal, checkout, labs |
| B content surface families | `14` |
| Flow | `18` |
| Flow checkpoints | `126` — `121 ACTUAL / 5 N/A / 0 GAP` |
| Visual cases | `44` |
| Distinct visual state IDs | `42` |
| Exact viewports | `6` |
| Baseline target | `264 committed PNGs` |
| Locale mix per 44-case registry | `EN 28 / KO 16` |

Exact viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`.

## 2. Family coverage

| Family | Source | Registered visual cases | Required complementary proof |
|---|---|---:|---|
| Shell/nav | `features/ondo/app/*` | 모든 case에 포함 | nav state, inert modal background, focus return, scroll, safe area |
| Onboarding | `onboarding/*` | `3` | three personas, skip/fallback, KO/EN content suite |
| Nation/City | `map/*` | `6` | Seoul/Busan 200 each, map/list/fallback/retry, heat/cluster distinction |
| Place/Save | `place/*` | `4` + shared detail cases | UNKNOWN facts, exact venue preservation, save failure/retry |
| JIT gates | `identity/*` | `7` | Account/Person/Age/Payment isolation, cancel/error/retry/return |
| Tables/chat | `connect/*` | `7` | member lock, join failure, image retry, feedback/report |
| Local Signal/photo | `connect/*`, `media/*` | `3` | empty/failure/success, draft preservation |
| Checkout/stamp | `commerce/*` | `5` | cancel/failure invariants, receipt≠visit, stamp milestone |
| My Korea | `my/*` | `1` | same saved venue and milestone persistence |
| Profile/Trust | `profile/*`, `trust/*` | `2` | consent and four independent reputation axes |
| Global/venue After19 | `after19/*`, `place/*` | `2` | four guards, manual-off priority, exact venue return |
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

- `pixel`: 하나 이상의 44 canonical case를 연결한다.
- `functional_only`: 별도 layout screenshot이 필요 없는 이유와 `B_FLOW_CONTRACTS` browser proof를 연결한다.
- 126 checkpoint ID는 unique여야 한다.
- 44 visual case는 적어도 한 checkpoint에서 참조되어야 하며 orphan을 허용하지 않는다.
- 한 composite flow test가 여러 checkpoint를 증명할 수 있다. 126개의 exact named `test.step`이 있다고 주장하지 않는다.

## 5. Baseline census and gates

1. 44 case ID와 42 exact state ID set이 코드와 일치해야 한다.
2. 각 case를 여섯 exact viewport에서 한 번씩 캡처해 `264` PNG를 만든다.
3. mobile directory `44`, desktop directory `44`, responsive directory `176`이어야 한다.
4. 각 PNG 실제 dimension이 filename/viewport registry와 일치해야 한다.
5. 264 PNG 모두 git tracked여야 한다.
6. visible metadata `≥12px`, hit target `≥44×44`, horizontal overflow/independent control overlap/nav overlap `0`이어야 한다.
7. active modal은 하나만 노출되고 background는 inert+aria-hidden이며 visible exit가 있어야 한다.
8. serious/critical Axe, contrast/name/label violation, product runtime failure `0`이어야 한다.
9. baseline update는 issue-scoped approval 후 수행하고 최종에는 no-update full 264 run을 통과해야 한다.

현재 264 PNG baseline set은 harness `6eceef4fe72be2ce86808821a7b6a8a6dd9a09d6`, digest `0f56b0cfde9049e73e32c40d715fb8cd8c475f66c725d32c8e930a482aa45b3e`로 동결됐고 unchanged-baseline `264/264 PASS`를 통과했다. Typecheck/build PASS, contracts `26/26`, nonpixel E2E `213 pass / 5 intentional viewport skips / 0 fail`, checkpoint mapping `121 ACTUAL / 5 N/A / 0 GAP`도 통과했다. SLEEK R2는 시작 준비 상태지만 reviewer verdict나 release acceptance는 아직 없다.
