# ONDO B · Current As-built

상태: `PRODUCT IMPLEMENTED · TUPLE FROZEN · FULL AUTOMATED QA PASS · HISTORICAL R3 NOT CLEAN · R4 READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

| 항목 | 최종 값 |
|---|---|
| Product SHA | `05f3002899485c528e31730bfebd57d71c3d788d` |
| Harness SHA | `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` |
| Route | `/ondo-b` |
| Current preview | `NOT DEPLOYED`; 기존 private B URL은 이전 tuple의 역사 preview |
| 제품 형태 | responsive Next.js web app |
| Product scope | 외국인 우선 서울·부산 F&B discovery + JIT identity/commerce/community demo |
| Requirement trace | `19/19` |
| Flow trace | `18/18 · 126 checkpoints · 121 ACTUAL · 5 reasoned N/A · 0 GAP` |
| Pixel target | `46 cases · 44 states · 6 viewports = 276 committed baselines` |
| Data | 공식 장소 `400` (`서울 200 / 부산 200`) |
| ONDO preview | `SIMULATED` signal `80` (`40 / 40`) |
| After19 preview | `SIMULATED` night-category signal `17` (`서울 7 / 부산 10`) |

이 문서가 B 제품 source의 실제 구현 상태 정본이다. 구현 상태와 현재 tuple의 QA/review acceptance는 별개다. [`docs/ondo-execution/13_AS_BUILT.md`](../ondo-execution/13_AS_BUILT.md)는 `/ondo` A/v2 후보의 역사 기록이며 이 문서의 수치와 상태를 덮어쓰지 않는다.

## 1. 실제 구현된 제품 구조

| 영역 | As-built |
|---|---|
| App entry | `/ondo-b`가 B shell/provider 안에 Map, Place, Identity, After19, Tables, Chat, Local Signal, Checkout, My, Labs를 mount한다. |
| Onboarding | 가치 설명 → 단기 여행자/한국인/장기체류자 → 관심사 → Guest map. skip/failure도 KYC 없이 map으로 간다. |
| Map | MapLibre vector map, Nation → Seoul/Busan → list/place, score와 cluster geometry 분리, tile error 시 동일 200개 list+Retry. |
| Place | 공식 한글명·좌표·주소·source snapshot을 보여주며 영업시간·카드·메뉴·영어 지원은 evidence가 없으면 UNKNOWN이다. |
| Identity | Guest, Account, Person, Age, Payment KYC를 독립 상태로 유지하고 one-shot returnTo로 원 행동을 재개한다. |
| After19 | simulated signal 중 `night` category만 ONDO 자체 19+ preview policy 대상이다. 공식 장소의 법적 연령·주류·영업 사실을 주장하지 않는다. |
| Tables | 장소·시간 fixture list/detail, join preview, confirmed-member chat/photo/check-in/feedback/report. 실제 host·reservation·server가 없음을 상시 표시한다. |
| Local Signal | note/photo draft, device-local preview, fail/retry, simulated Visit+Contribution event. Meetup/stamp/public heat는 자동 증가하지 않는다. |
| Checkout | KRW display price, OOKRW test-token hypothesis, independent Payment KYC, simulated receipt. 결제만으로 stamp가 증가하지 않는다. |
| My/Reputation | saved venue, stamp 9→10, Identity/Visit/Contribution/Meetup 네 축, optional public profile. 종합 안전점수는 없다. |
| Labs | zkLogin signer fixture, separate USDC/USDT/OOKRW views, ordered bridge hypothesis, OpenDID/EAS adapters, merchant trait, opt-in badge simulation. |

## 2. 데이터와 진실 경계

| 데이터 | 실제 상태 | 공개 제품 표현 |
|---|---|---|
| LOCALDATA F&B | `ACTUAL` official active-licence snapshot, stable IDs and coordinates | `Official place record`; 인기·영업 중·외국인 친화로 승격하지 않음 |
| ONDO score/sample/band/freshness | `SIMULATED` 80-place fixture | preview/simulated 고정 표시; 공식 장소 수와 분리 |
| After19 subset | `SIMULATED` night-category 17 places | ONDO 자체 preview policy; 공식 연령·주류 제한 아님 |
| Account/CX/Residence/Passport/Age/Payment KYC | frontend state `ACTUAL`, proof/provider `SIMULATED` or `NOT_CONFIGURED` | provider truth와 원 행동 복귀 상태를 표시 |
| Chat/photo/Table/payment/reputation/stamp/badge | `SIMULATED_LOCAL` 또는 `SIMULATED` | device/session preview, no live host/server/payment/mint |
| OpenDID/EAS and merchant trait | `CONTRACT_ONLY` | canonical adapter/receipt contract만 표시 |
| live EAS, AMM, custody, real bridge/payment/NFT | `DEFERRED` | 제품에서 구현·연동됐다고 주장하지 않음 |

초기 HTML/JS에는 compact 장소 이름·좌표·stable ID만 포함한다. 전체 주소·source digest·관리 ID는 선택 장소의 `/api/ondo/venues/[venueId]` 응답에서만 요청한다.

## 3. 실제 사용자 여정

정본 여정은 [`01_TRACE_MATRIX.md`](./01_TRACE_MATRIX.md)의 `FL-001`~`FL-018`이다. 각 Flow는 `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN`을 추적한다. 의도적으로 별도 retry/error UI가 없는 다섯 checkpoint만 이유 있는 `N/A`이며, 나머지 `121`개는 `/ondo-b` 실제 interaction이다.

중요한 승인 변경:

- 앱 사용 전 KYC 강제 대신 Guest discovery + 행동 시 JIT gate.
- `FL-002`는 Person/Passport가 아니라 Age proof만 거쳐 같은 After19 장소로 복귀.
- 특정 Sumsub 연동 주장 대신 provider-neutral Passport simulation.
- 국적 기반 자동 matching 대신 명시적으로 공개한 profile 정보만 사용.
- Can I Go 별도 제품 대신 evidence-backed place facts와 UNKNOWN 상태.

## 4. 현재 자동 검수 상태

| Gate | 현재 상태 |
|---|---|
| Product source | `FROZEN` at `05f3002899485c528e31730bfebd57d71c3d788d` |
| Harness SHA | `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` |
| Baseline | frozen `276/276 no-update PASS`; `46/46` each viewport; high-risk repeat `72/72`; digest `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d` |
| Checkpoint registry | `18 flows · 126 checkpoints · 121 ACTUAL · 5 N/A · 0 GAP`; `pixel | functional_only` mapping present |
| Full current automated receipt | `PASS` — discovery `348 tests / 25 files` · typecheck PASS · Webpack build `28/28` · contracts `26/26` · B E2E `323 pass / 25 intentional viewport skips / 0 fail` · visual `276/276` · unexpected/flaky/runtime/geometry/Axe/modal errors `0` |
| SLEEK R3 | historical `5/5 COMPLETE · NOT CLEAN · 11 actionable`; successor `11/11 FIXED · CLOSURE PENDING` |
| SLEEK R4 | `READY TO START` |
| Clean streak | `0/2` |

이전 `5ac6308… / 6e7254a… / 5ffbe67…` tuple의 자동 PASS와 R3/R4는 [`04_EVIDENCE_MANIFEST.md`](./04_EVIDENCE_MANIFEST.md)와 `evidence/RUN-20260819-*-FINAL/`에 역사적으로 보존한다. 제품 변경 뒤 현재 결과로 합산하지 않는다.

## 5. 아직 운영 제품이 아닌 부분

다음 항목은 이 front-end candidate를 통과했다고 자동으로 승인되지 않는다.

- OmniOne CX/Residence tenant와 production credential verification
- passport KYC vendor, retention/deletion/appeal policy
- zkLogin OAuth/account recovery와 custody
- live chat/photo/moderation/report enforcement
- merchant issuer/trait registry와 실제 reservation/payment
- USDC/USDT chain support, OOKRW 법적 정의, bridge/AMM security
- 실제 현장 방문 증거, NFT 발행, ONDO 운영 산식·bias·freshness governance

## 6. 릴리스 판정

제품 또는 harness가 바뀌면 clean streak를 0으로 되돌린다. 같은 tuple에서 다섯 독립 역할의 actionable `S0/S1/S2=0` round가 두 번 연속 끝나고 durable evidence가 연결된 뒤에만 B preview를 승격한다.

이전 tuple은 당시 R3/R4에서 조건을 충족해 별도 private preview로 배포됐지만 현재 제품 SHA와 다르다. 현재 sleek B는 역사 SLEEK R3의 11개 finding을 수정했고 successor tuple의 full automated gate를 통과해 fresh R4가 시작 준비 상태다. 같은 tuple의 두 차례 5/5 clean round 및 별도 deployment smoke는 아직 통과하지 않았다. 따라서 기존 private URL을 현재 최종 버전으로 제공하지 않는다. 기존 A project와 `/ondo`는 변경하지 않는다.
