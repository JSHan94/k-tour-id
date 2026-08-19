# ONDO B · Five-role Review Manifest

상태: `R3 FINAL REVIEW IN PROGRESS · R4 NOT STARTED`

| Field | Value |
|---|---|
| Product SHA | `0cc65f2793ca7a17f59397b1e9e0391f281f9649` |
| Harness SHA | `8b0060ff6f371402eb2c9d8766461b50f57e4742` |
| Baseline digest | `f37ac108b1a7814f747e9e5c89b804ad15b258df29d1958b59da7656ea8725fc` |
| Route | `/ondo-b` |
| Review rule | 같은 tuple, 독립 제출, actionable `S0/S1/S2=0` |
| Clean streak | `0/2` — R3의 Visual·Business 최종 제출 전 |

## Round ledger

| Round | UX/IA | Visual | Data/Content | Traveler | Business/PO | Automated | New actionable | Clean |
|---|---|---|---|---|---|---|---:|---|
| R1 | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | partial | multiple, triaged | `NO` |
| R2 | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | `NOT CLEAN` | functional pass, evidence incomplete | multiple, triaged | `NO` |
| R3 | `CLEAN` | `CLEAN` | `CLEAN` | `CLEAN` | `PENDING FINAL DOC REVIEW` | automated gates pass | 0 so far | `IN PROGRESS` |
| R4 | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | `NOT STARTED` | must rerun on identical tuple | — | `NO` |

R1/R2는 개선 루프의 역사 기록이며 release clean streak에 포함하지 않는다. R3와 R4의 다섯 역할 모두 같은 제품·harness tuple에서 독립적으로 제출해야 한다.

## R3 role evidence

| Evidence ID | Role | Scope | Current verdict |
|---|---|---|---|
| `B-REV-R3-UX-001` | UX/IA | FL-001~018, onboarding semantics, cancel/error/retry/return, dead ends | `CLEAN · S0/S1/S2/S3=0` |
| `B-REV-R3-VISUAL-001` | Visual system | 발자취 원리, 44×2 pixels, hierarchy, geometry, Axe | `CLEAN · S0/S1/S2=0 · non-actionable S3=3` |
| `B-REV-R3-CONTENT-001` | Data/Content/Truth | official/simulated/unknown, 400 data, KO/EN, payload boundary | `CLEAN · S0/S1/S2/S3=0` |
| `B-REV-R3-TRAVELER-001` | Short-term traveler | Guest discovery, bilingual choice, JIT recovery, truth comprehension | `CLEAN · S0/S1/S2/S3=0` |
| `B-REV-R3-PO-001` | Business/PO | original 19 requirements, product sharpness, as-built completeness | `PENDING FINAL DOC REVIEW` |

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

## Review and triage rule

- 단일 재현 가능한 S0/S1은 즉시 block한다.
- 측정 가능한 truth/privacy/a11y/flow S2도 단일 재현으로 actionable이다.
- 취향 S2는 독립 2인 합의, S3는 locked token 위반 또는 3/5 합의가 있어야 actionable이다.
- `CLOSED`에는 fix SHA와 같은 제품 tuple의 자동 재검수 및 독립 reviewer closure가 모두 필요하다.
- 제품 또는 harness가 바뀌면 R3/R4를 모두 무효화하고 clean streak를 `0/2`로 되돌린다.
- evidence-only 문서 commit은 제품/harness tuple을 바꾸지 않는다.

Durable 원문과 명령 digest는 [`evidence/RUN-20260819-R3-FINAL/manifest.md`](./evidence/RUN-20260819-R3-FINAL/manifest.md), [`evidence/RUN-20260819-R4-FINAL/manifest.md`](./evidence/RUN-20260819-R4-FINAL/manifest.md)에 기록한다.
