# ONDO B · UX/UI Component & State Matrix

상태: `EXECUTABLE REGISTRY · FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`

## 1. Exact current successor registry

| Item | Count |
|---|---:|
| R5-reviewed Evidence/Product/Harness/digest | `39687c33…` / `9ec3d192…` / `12354bcf…` / `4cfbed3b…` |
| R5-RETRY reviewed Evidence/Product/Harness/digest | `b0d25fe…` / `30dcb136…` / `ee19adb…` / `f1ec9b0c…` |
| Failed CLEAN1 Product · Harness · digest | `5b519e6…` / `b68fc18…` / `1dcfacb7…` · `INCOMPLETE / NOT CLEAN` |
| Current successor Product · Harness/frozen candidate · digest | `5c6383e…` / `c05a2d0…` / `addf064…` |
| B route | `1` — `/ondo-b` |
| Tab roots | `4` — ONDO, My Korea, Tables, ID |
| Reducer surface kinds | `7` — map, venue, table, chat, local_signal, checkout, labs |
| B content surface families | `14` |
| Flow | `18` |
| Flow checkpoints | `126` — `123 ACTUAL / 3 N/A / 0 GAP` |
| Visual cases | `50` |
| Distinct visual state IDs | `48` |
| Exact viewports | `6` |
| Baseline target | `300 committed candidate PNGs` |
| Locale mix per 50-case registry | `EN 33 / KO 17` |

Exact viewports: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`.

## 2. Family coverage

| Family | Source | Registered visual cases | Required complementary proof |
|---|---|---:|---|
| Shell/nav | `features/ondo/app/*` | 모든 case에 포함 | nav state, inert modal background, focus return, scroll, safe area |
| Onboarding | `onboarding/*` | `3` | three personas, skip/fallback, KO/EN content suite |
| Nation/City | `map/*` | `7` | Seoul/Busan 200 each, map/list/filtered-map/fallback/retry, heat/cluster distinction |
| Place/Save | `place/*` | `4` + shared detail cases | UNKNOWN facts, exact venue preservation, save failure/retry |
| JIT gates | `identity/*` | `7` | Account/Person/Age/Payment isolation, cancel/error/retry/return |
| Tables/chat | `connect/*` | `8` | global list, venue-scoped empty recovery, member lock, join failure, image retry, feedback/report |
| Local Signal/photo | `connect/*`, `media/*` | `3` | empty/failure/success, draft preservation |
| Checkout/stamp | `commerce/*` | `5` | cancel/failure invariants, receipt≠visit, stamp milestone |
| My Korea | `my/*` | `2` | same saved venue and milestone persistence; trusted saved row enters canonical city→peek history with exact Back/Forward/reload/focus and URL privacy; discovery-only reset confirmation |
| Identity/Profile/Trust | `identity/*`, `profile/*`, `trust/*` | `3` | scoped session reset, consent and four independent reputation axes |
| Global/venue After19 | `after19/*`, `place/*` | `4` | manual prompt isolation, expiry reason/recovery, four guards, manual-off priority, exact venue return |
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

- `pixel`: 하나 이상의 50 canonical case를 연결한다.
- `functional_only`: 별도 layout screenshot이 필요 없는 이유와 `B_FLOW_CONTRACTS` browser proof를 연결한다.
- 126 checkpoint ID는 unique여야 한다.
- 50 visual case는 적어도 한 checkpoint에서 참조되어야 하며 orphan을 허용하지 않는다.
- 한 composite flow test가 여러 checkpoint를 증명할 수 있다. 126개의 exact named `test.step`이 있다고 주장하지 않는다.

## 5. Baseline census and gates

1. 50 case ID와 48 exact state ID set이 코드와 일치해야 한다.
2. 각 case를 여섯 exact viewport에서 한 번씩 캡처해 `300` PNG를 만든다.
3. mobile directory `50`, desktop directory `50`, responsive directory `200`이어야 한다.
4. 각 PNG 실제 dimension이 filename/viewport registry와 일치해야 한다.
5. 300 PNG 모두 git tracked여야 한다.
6. visible metadata `≥12px`, hit target `≥44×44`, horizontal overflow/independent control overlap/nav overlap `0`이어야 한다.
7. active modal은 하나만 노출되고 background는 inert+aria-hidden이며 visible exit가 있어야 한다.
8. serious/critical Axe, contrast/name/label violation, product runtime failure `0`이어야 한다.
9. baseline update는 issue-scoped candidate migration 후 수행하고 최종에는 no-update full 300 run을 통과해야 한다.

R5-RETRY가 검토한 282 PNG set은 harness `ee19adb…`, digest `f1ec9b0c…`였고 reviewer verdict는 `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1`이었다. b68 CLEAN1도 raw `S1 1 + S2 5`로 실패했다. Current candidate는 digest `addf064…`, 이전 b68 candidate 대비 `294 unchanged + 6 unique corrected paths`, 각 viewport 50장이다. Exact nonpixel과 visual gate는 모두 GREEN이고 blind clean round는 `READY`다.
