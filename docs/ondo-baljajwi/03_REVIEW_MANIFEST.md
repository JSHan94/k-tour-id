# ONDO B · Five-role Review Manifest

상태: `R3 CLEAN · R4 CLEAN · TWO CONSECUTIVE CLEAN ROUNDS`

| Field | Value |
|---|---|
| Product SHA | `5ac630858389a1ca902a3fcfd01f77ae5bce9bb3` |
| Harness SHA | `6e7254af02adcf49a35424203e2201093485872a` |
| Baseline digest | `5ffbe67fe65e5d46ecb2b7c217394fd2c29847f272dbf56afdac716c66bb49c1` |
| Route | `/ondo-b` |
| Review rule | 같은 tuple, 독립 제출, actionable `S0/S1/S2=0` |
| Clean streak | `2/2` — 동일 tuple에서 R3와 R4 모두 다섯 역할 clean |

## Round ledger

| Round | UX/IA | Visual | Data/Content | Traveler | Business/PO | Automated | New actionable | Clean |
|---|---|---|---|---|---|---|---:|---|
| R1 | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | partial | multiple, triaged | `NO` |
| R2 | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | functional pass, evidence incomplete | multiple, triaged | `NO` |
| R3 | `CLEAN` | `CLEAN` | `CLEAN` | `CLEAN` | `CLEAN` | `172/172 nonpixel · 88/88 pixel` | 0 | `YES · 1/2` |
| R4 | `CLEAN` | `CLEAN` | `CLEAN` | `CLEAN` | `CLEAN` | `172/172 nonpixel · 88/88 pixel` fresh rerun | 0 | `YES · 2/2` |

R1/R2는 개선 루프의 역사 기록이며 release clean streak에 포함하지 않는다. R3와 R4의 다섯 역할 모두 같은 제품·harness tuple에서 독립적으로 제출해야 한다.

## R3 role evidence

| Evidence ID | Role | Scope | Current verdict |
|---|---|---|---|
| `B-REV-R3-UX-001` | UX/IA | FL-001~018, onboarding semantics, cancel/error/retry/return, dead ends | `CLEAN · S0/S1/S2/S3=0` |
| `B-REV-R3-VISUAL-001` | Visual system | 발자취 원리, 44×2 pixels, hierarchy, geometry, Axe | `CLEAN · S0/S1/S2=0 · non-actionable S3=2` |
| `B-REV-R3-CONTENT-001` | Data/Content/Truth | official/simulated/unknown, 400 data, KO/EN, payload boundary | `CLEAN · S0/S1/S2/S3=0` |
| `B-REV-R3-TRAVELER-001` | Short-term traveler | Guest discovery, bilingual choice, JIT recovery, truth comprehension | `CLEAN · S0/S1/S2/S3=0` |
| `B-REV-R3-PO-001` | Business/PO | original 19 requirements, product sharpness, as-built completeness | `CLEAN · S0/S1/S2/S3=0` |

## Closed issue ledger

| Issue ID | First seen | Scope | Severity | Resolution | Fix evidence | Status |
|---|---|---|---|---|---|---|
| `B-ISS-R1-MAP-001` | R1 | Map/list | S1 | actual 200+200 official venue layer, density hierarchy, opaque list, fallback | product history → current Product SHA | `CLOSED` |
| `B-ISS-R1-TRUTH-001` | R1 | Data/heat | S1 | official venue와 simulated signal 분리, score/sample/band/freshness 표시 | contracts + map truth suite | `CLOSED` |
| `B-ISS-R1-CONTEXT-001` | R1 | Tables/My | S1 | selected venue context와 city return 보존 | canonical flow suite | `CLOSED` |
| `B-ISS-R2-PREFERENCE-001` | R2 | Onboarding/Map | S1 | 여섯 preference가 B map filter에 반영되고 reset 가능 | flow/content suite | `CLOSED` |
| `B-ISS-R2-AFTER19-001` | R2 | After19 | S1 | arbitrary index가 아니라 simulated `night` category만 policy 대상 | Product history → current Product SHA; contracts | `CLOSED` |
| `B-ISS-R2-QA-001` | R2 | Evidence | S1 | synthetic seam 제거, 126 checkpoint real-interaction registry | `121 ACTUAL · 5 N/A · 0 GAP` | `CLOSED` |
| `B-ISS-R3-ONB-CTA-001` | R3 | Onboarding step 2 | S2 | step 2를 `Choose meal preferences`/`한 끼 취향 고르기`로 수정; 최종 CTA와 분리 | Product `0cc65f2`; onboarding 32/32 | `CLOSED` |
| `B-ISS-R3-HARNESS-001` | R3 | Runtime/pixel/time evidence | S2-test | detail-ready wait, 44px 반올림, capture 직전 Labs scroll 고정, After19 KST 저녁 clock 고정으로 abort/raster/order/time false positive 제거 | Harness `8b0060f`; affected repeats PASS | `CLOSED` |
| `B-ISS-R4-AFTER19-OVERLAY-001` | invalidated R4 | selected venue + global After19 | S2 | prompt를 active venue peek 위 최상위로 올리고 cancel/age return에서 exact venue context 보존 | Product `ff3d8aa`; regression mobile+desktop + current full suite | `CLOSED · OLD ROUND INVALIDATED` |
| `B-ISS-R3-ONBOARDING-EXIT-001` | invalidated R3 | desktop Guest/Skip onboarding exits | S2 | desktop onboarding 높이를 canvas-relative로 제한해 첫 viewport center hit-test 보장 | Product `5ac6308`; geometry `4/4`, current pixels `88/88` | `CLOSED · ROUND RESTARTED` |
| `B-ISS-R3-EVIDENCE-PREMATURE-001` | invalidated R3 | review/evidence integrity | S2-doc | 실제 제출 전 clean 선기록을 제거하고 `0/2 · IN PROGRESS`로 복원; 이전 tuple은 invalidated history로만 유지한 뒤 실제 다섯 제출을 연결 | current 00/03/06/07 + R3 role originals | `CLOSED` |

`0cc65f2/8b0060f`와 `ff3d8aa/25b09ae`에서 나온 clean 또는 진행 중 판정은 이후 제품 변경으로 모두 무효다. 현재 tuple의 제출만 clean streak에 포함한다.

## Review and triage rule

- 단일 재현 가능한 S0/S1은 즉시 block한다.
- 측정 가능한 truth/privacy/a11y/flow S2도 단일 재현으로 actionable이다.
- 취향 S2는 독립 2인 합의, S3는 locked token 위반 또는 3/5 합의가 있어야 actionable이다.
- `CLOSED`에는 fix SHA와 같은 제품 tuple의 자동 재검수 및 독립 reviewer closure가 모두 필요하다.
- 제품 또는 harness가 바뀌면 R3/R4를 모두 무효화하고 clean streak를 `0/2`로 되돌린다.
- evidence-only 문서 commit은 제품/harness tuple을 바꾸지 않는다.

Durable 원문과 명령 digest는 [`evidence/RUN-20260819-R3-FINAL/manifest.md`](./evidence/RUN-20260819-R3-FINAL/manifest.md), [`evidence/RUN-20260819-R4-FINAL/manifest.md`](./evidence/RUN-20260819-R4-FINAL/manifest.md)에 기록한다.
