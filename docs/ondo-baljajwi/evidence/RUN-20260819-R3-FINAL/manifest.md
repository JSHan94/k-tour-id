# RUN-20260819-R3-FINAL

상태: `IN PROGRESS · BUSINESS FINAL SUBMISSION PENDING`

| Field | Value |
|---|---|
| Product SHA | `0cc65f2793ca7a17f59397b1e9e0391f281f9649` |
| Harness SHA | `8b0060ff6f371402eb2c9d8766461b50f57e4742` |
| Baseline digest | `f37ac108b1a7814f747e9e5c89b804ad15b258df29d1958b59da7656ea8725fc` |
| Route | `/ondo-b` |
| Browser | Chromium · mobile 390×844 · desktop 1440×1000 |
| Product worktree | clean at the frozen tuple before accepted runs |

## Automated evidence

| Evidence ID | Scope | Result | Unexpected skip | Product runtime error |
|---|---|---:|---:|---:|
| `B-R3-BUILD` | TypeScript + Next production build | `PASS` | 0 | 0 |
| `B-R3-CONTRACT` | identity/data/truth/bridge/visit contracts | `26/26 PASS` | 0 | 0 |
| `B-R3-FLOW` | FL-001~018 × mobile/desktop | `36/36 PASS` | 0 | 0 |
| `B-R3-PIXEL` | 44 states × mobile/desktop | `88/88 PASS` | 88 project-mismatch intentional | 0 |
| `B-R3-A11Y` | 14 surfaces × mobile/desktop | `28/28 PASS` | 0 | 0 |
| `B-R3-SUPPORT` | KO/EN, map/product truth, regression, registry | `102/102 PASS` | 0 | 0 |
| `B-R3-NONPIXEL-SERIAL` | flow+a11y+support final serial aggregation | `166/166 PASS` | 0 | 0 |

`externalMap`은 OpenFreeMap 실패를 제품 오류와 분리한다. 실패 fixture에서도 같은 도시의 200개 장소 목록, Retry와 usable first card가 유지돼야 PASS다. Google Fonts 등 외부 asset은 기록하되 first-party document/script/fetch 실패를 allowlist하지 않는다.

## Exact product facts

- Official active-licence venue: `400` = Seoul `200` + Busan `200`.
- Simulated ONDO signal place: `80` = `40 + 40`.
- Simulated After19 policy subset: `17` = Seoul `7` + Busan `10`, category=`night` only.
- Trace: `19/19 REQ`, `18/18 Flow`, `121 ACTUAL`, `5 reasoned N/A`, `0 GAP`.
- Full official evidence is lazy `/api/ondo/venues/[venueId]`; initial payload contains compact public map data only.

## Independent review submissions

| Review ID | Role | Verdict | Notes |
|---|---|---|---|
| `B-REV-R3-UX-001` | UX/IA | `CLEAN` | 36/36 flows, 126 checkpoint registry, JIT/context/recovery verified |
| `B-REV-R3-VISUAL-001` | Visual system | `CLEAN` | 88/88 pixel, 48/48 geometry/a11y; three non-actionable S3 notes |
| `B-REV-R3-CONTENT-001` | Data/Content/Truth | `CLEAN` | official/simulated/unknown and payload privacy clean |
| `B-REV-R3-TRAVELER-001` | Short-term traveler | `CLEAN` | onboarding→map→detail→Tables/After19 comprehension clean |
| `B-REV-R3-PO-001` | Business/PO | `PENDING` | final committed as-built review required |

R3는 다섯 제출과 actionable S0/S1/S2=0이 모두 확인되기 전에는 clean streak에 포함하지 않는다.
