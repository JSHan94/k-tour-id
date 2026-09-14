# C3 교차검증 · 신뢰·상태·접근성 challenge

상태: `CROSS-REVIEW · D3 CHALLENGE · 2026-09-04`

대상:

- `_reviews/D1_PRODUCT_SIMPLICITY.md`
- `_reviews/D2_INTERACTION_VISUAL.md`
- `_reviews/D3_TRUST_INCLUSIVE.md`
- `00_UX_STANDARD.md`
- `00_PRD_PRESERVATION_LEDGER.md`

이 문서는 D1·D2의 장점을 합치는 요약이 아니다. 간결함과 시각적 세련미가 돈·신원·
공개 범위·실패·복귀를 숨기는 순간을 찾아 반박하고, 세 독립안 중 무엇을 채택·기각·
수정해야 하는지 판정한다. 구현 변경은 하지 않는다.

## 0. 결론

D1과 D2가 제안한 `map-first`, `one decision`, `single sheet`, `setup/presentation 분리`,
`payment ≠ visit ≠ stamp`는 채택할 가치가 높다. 그러나 다음 네 지점은 그대로 합의하면
안 된다.

1. **외부 provider가 없는데 local/fixture result로 Person·Payment KYC·K-Tour issuance를
   정상 성공처럼 끝낼 수 없다.** 기본 제품 경로는 fail-closed/unavailable, 명시적인
   검토 fixture만 별도 provenance로 성공시켜야 한다.
2. **실제 금액 이동 없음은 checkout·receipt에서 접힌 기술 정보가 아니다.** 사용자가
   금액을 확정하기 직전과 결과 첫 화면에 한 번씩 보여야 한다.
3. **비영 `₩60,000` 여행 잔액을 `예산`으로 낮추거나 숨기면 기존 제품 기능을 바꾼다.**
   잔액은 계속 쓸 수 있게 두되 `기기 내 여행 잔액`으로 출처를 일관되게 표시하고
   `no funds added`를 동시에 쓰지 않는다.
4. **아이콘화가 consequential action의 텍스트를 없애서는 안 된다.** 모바일 dock은
   icon-only를 조건부 채택하지만 결제·동의·공개·복원·삭제·신고·차단·나가기는 짧은
   동사를 유지한다.

현재 기능 추적성 18/18은 인정한다. 아래 release blocker가 닫히기 전에는 Toss급 UX나
consumer-ready truth를 선언하지 않는다.

## 1. 세 독립안 충돌과 판정

판정 의미:

- **채택:** 정본·신뢰·접근성에 맞아 그대로 합의안으로 승격 가능.
- **수정:** 방향은 맞지만 상태·truth·접근성 조건을 추가해야 함.
- **기각:** 그대로 적용하면 오해 또는 PRD 회귀가 발생.

| 쟁점 | D1 | D2 | D3 | C3 판정 |
|---|---|---|---|---|
| MapLibre atlas→city | 같은 지도·연속 camera | 첫 frame부터 같은 MapLibre, shared beacon | D-15와 exact history 강조 | **채택.** 별도 poster/white route/Leaflet 복귀 금지. `easeTo`, reduced-motion `jumpTo`, 800ms/5s recovery를 lock한다. |
| 서울·부산·제주 | 같은 renderer, source는 분리 | double/single/dashed ring으로 상태 표현 | 같은 renderer, 제주는 score=null | **수정.** geometry·hit target·selected halo·transition은 완전히 동일해야 한다. 제주 dashed/limited cue는 source state만 말하고 disabled/덜 중요한 도시처럼 보이면 기각한다. |
| 온도 표현 | 설명 대신 field/beacon | field→aura→core→halo | 숫자·근거는 선택 후 접근 가능 | **채택.** 색·glow만으로 의미를 전하지 말고 list/accessibility name과 compact key에서 같은 상태를 제공한다. `Pulse/Hot/Peak` 상시 문구는 제거한다. |
| 온보딩 shell | intent→taste→map, 별도 가치 화면 여지 | map-backed sheet에서 즉시 preview | 320 첫 CTA와 Guest-first 우선 | **수정.** D2의 map-backed 단일 shell을 채택한다. D1의 별도 큰 가치 화면은 기각하고, 첫 viewport의 지도·한 질문·한 CTA를 유지한다. |
| 세 persona | 법적 분류 대신 여행 의도 wording | 동일 컴포넌트, ID 시각 금지 | preference일 뿐 신원 추론 금지 | **채택.** 세 선택지는 PRD상 유지하되 추천 순서만 바꾼다. Account/Person/Residence/Nationality state를 만들지 않는다. |
| preference 결과 | personalized map을 약속 | marker keyline/list ordering 즉시 반응 | 실제 효과가 없으면 약속 금지 | **수정.** fixture/selector가 실제 결과를 바꿀 때만 keyline·ordering을 보여 준다. ONDO temperature나 official/editorial truth는 절대 바꾸지 않는다. |
| 모바일 nav icon-only | icon-only 가능, accessible name | 5개 icon-only + filled state | 인지 가능성과 screen reader 조건 | **조건부 채택.** 사용자의 명시 피드백을 따른다. 48px, localized accessible name, non-color current state, 1회 coach label을 요구한다. 미인지 테스트 실패 시 active tab에만 짧은 label을 허용한다. |
| 한 gate, 한 sheet | action-specific gate, 한 축씩 | modal stack 없이 shell body 교체 | gate independence·exact return 강조 | **채택.** header에는 원 객체/행동을 고정하고 unmet gate 하나만 노출한다. 전체 시스템 1/4 stepper는 금지한다. |
| Local Signal의 gate 시점 | draft 작성 후 submit에서 Account→Person | 일부 안은 form 전에 gate | draft·media 보존 후 submit JIT | **D2 선행 gate는 기각.** form을 먼저 쓰고 제출 시 gate를 연다. venue/chips/note/photo preview를 보존해 exact resume한다. |
| K-Tour setup과 presentation | setup과 행동별 share 분리 | Choose–Check–Add만 setup, Present 별도 | issuance와 presentation 상태/receipt 분리 | **채택.** 3단계 `Add`가 issuer 성공인지 local 저장인지 명시한다. 특정 requester/purpose/fields의 Present는 이후 JIT flow다. |
| provider 미연결 | 기술명 접기, 결과점 truth 한 줄 | local/frontend result 가능성을 남김 | normal unavailable, 별도 demo provenance 필요 | **수정 필수.** 기본 route는 unavailable이며 verified state를 올리지 않는다. fixture success는 QA/심사 시연 mode로 격리하고 결과에 외부 연결 없음·session scope를 보여 준다. |
| 여행 잔액 `₩60,000` | consumer balance로 유지 | funds가 없으면 숫자 숨김 또는 `여행 예산` | usable local balance로 유지, provenance 일치 | **D2의 숨김/예산 전환은 기각.** 기존 usable travel balance를 유지한다. `기기 내 여행 잔액 ₩60,000`; `Ready · no funds added` 동시 노출 금지. |
| funding source | consumer concept, technical ticker 접기 | payment row로 압축 | sheet-local draft, unavailable 시 이전 source 보존 | **수정.** 은행/카드·Apple Pay/digital dollar는 선택 가능하지만 미연결 terminal로 간다. 선택만으로 active/Ready가 되거나 잔액이 늘면 P0다. |
| checkout wording | `결제 확인`을 제안 | payment/receipt 구조 유지 | 외부 주문 없는 local record로 명확히 | **수정.** 실제 merchant/payment provider가 없으면 primary는 `여행 잔액 ₩19,000 사용`으로 쓴다. `결제 완료`는 금지하고 결과는 `잔액 사용 기록`이다. |
| no-money truth 위치 | 일부 표에서 접기 | 일부 표에서 disclosure로 접기 | 확인 직전·결과에 항상 표시 | **D1/D2의 접기-only는 기각.** 세부 ticker/provider는 접되 `외부 주문 없음 · 실제 금액 이동 없음` consequence는 confirm과 result에 유지한다. |
| receipt/restore | receipt→visit 분리 | flat receipt와 별도 stamp event | 실제 환불 아닌 `잔액 복원` | **채택+수정.** Receipt 기능은 보존하되 제목은 `잔액 사용 기록`, 기술 receipt는 접는다. 복원 금액·범위·외부 환불 아님을 확인/result에 둔다. |
| payment→stamp | unique visit만 stamp | 별도 timeline event | mutation diff/중복 evidence 강조 | **채택.** Payment/receipt/benefit 성공은 stamp와 reputation을 0만큼 바꿔야 한다. 별도 unique visit만 9→10이다. |
| Table 여섯 facts | list/짧은 scroll에서 모두 | list는 time/seat, detail은 2×3 icon grid | before-Join facts와 label/value 의미 | **수정.** list에는 time/seat/menu와 중요한 condition, detail의 Join 전에는 여섯 facts 전부를 제공한다. icon-only grid가 아니라 short label+value를 쓴다. |
| Table safety | Report/Block/Leave 명시 | overflow sheet, 2 taps 이하 | consequential verbs 유지 | **수정.** 세 대형 카드 대신 `안전` labeled row/sheet로 압축하되 Report/Block/Leave 텍스트와 confirmation은 유지한다. generic kebab 속 은닉은 기각한다. |
| Manual After19 control | 19+ label 중심 | icon+first-use tooltip 제안 | `19+`의 non-color 의미 유지 | **D2 icon-only는 수정.** 44px control 안에 `19+`가 항상 읽히거나 동일한 visible label을 둔다. tooltip은 유일한 의미 전달 수단이 아니다. |
| Auto After19 | 같은 camera/geometry, immediate off | dark token crossfade, geography 대비 | four guards/fail closed | **채택.** 일반 야간 식당을 숨기지 않고 night subset을 강조한다. “술집만 표시”는 PRD와 충돌하므로 filter opt-in으로만 허용한다. |
| Evidence facts | fact 중심, source 접기 | pictogram+status+Labs deep detail | refresh/provider 부재 truth 강조 | **수정.** `확인됨`은 실제 연결이 있을 때만 쓴다. snapshot이면 `기록에 있음 · 기준일`, provider 미연결이면 refresh CTA를 제공하지 않는다. |
| profile/reputation | field별 공개, 총점 금지 | 4축 ring/timeline | nationality 추론/자동 공개 금지 | **채택.** PDF의 국적 기반 타기팅과 passport-derived profile/wallet은 현재 제품에서 명시적으로 기각한다. |
| imagery | photo-led places/Table/My Korea | source-backed photo, synthetic people 제한 | truth/alt/license 강조 | **수정.** `sources/` 자산의 출처·권한·crop manifest를 만들고 category art를 실제 venue 사진처럼 쓰지 않는다. eKYC/credential result에 합성 인물을 넣지 않는다. |
| Labs | 별도 opt-in technical space | ordered phase, target testnet | normal surface와 완전 분리 | **채택.** `Target: Sui Testnet · Simulated`는 Labs에서만 허용한다. 실제 txRef 없이 `TESTNET 실행 완료`나 explorer link를 만들지 않는다. |
| exact return | route+camera+draft+focus | shared-object motion과 sheet snap | one-shot token/invalid safe map | **채택+강화.** 성공 후 기대 mutation만 달라지고 나머지 public context·scroll·focus·draft는 동일해야 한다. pixel 동일을 요구해 성공 state 변화를 막지는 않는다. |

## 2. live-vs-demo 신뢰 계약

### 2.1 세 실행 truth를 UI와 state에서 분리한다

| 실행 truth | 허용 결과 | 금지 결과 | 사용자 표시 |
|---|---|---|---|
| `LOCAL_ACTUAL` | 브라우저 안 Account, preference, bookmark, draft, 기기 내 여행 잔액 기록 | 은행 입금, 카드 승인, Mobile ID/issuer 확인, merchant order, chain tx 주장 | 결과점 한 번 `이 기기에 저장` 또는 `외부 주문 없음` |
| `PROVIDER_UNAVAILABLE` | 방법 선택, preflight, unavailable, alternate, retry/cancel | `PER-VERIFIED`, `PKY-VERIFIED`, credential issued, funded balance, paid receipt | `현재 연결할 수 없어요` + 가장 가까운 recovery |
| `FIXTURE_REVIEW` | 결정적 success/failure/cancel/expiry 시나리오, PRD 상태·returnTo 검증 | consumer default처럼 자동 진입, official/live/testnet claim | QA/심사 전용 mode; 결과에 external service 미연결과 scope 표시 |

정상 consumer route와 review fixture는 URL flag만 달라 보이는 동일 UI여도 좋지만,
provenance는 state와 receipt에 남아야 한다. provider 미연결 상태에서 사용자가 Mobile ID,
Residence, Passport, bank, card·Apple Pay, digital dollar를 선택하면 기본 terminal은
unavailable이며 이전 usable state를 보존한다.

### 2.2 issuer와 K-Tour ID

- `Choose → Check → Add`에서 Check가 external issuer callback validation인지 local review
  fixture인지 state provenance로 구분한다.
- issuer가 없으면 `K-Tour ID issued/added`라고 끝내지 않는다. 사용자가 로컬 카드
  모양을 저장했다면 `여행 패스 초안 저장`처럼 실제 결과만 말한다.
- credential 발급 success와 특정 benefit/Table/After19 predicate presentation success는
  별도 receipt와 expiry를 가진다.
- K-Tour ID는 정부 ID·비자·체류 허가·Payment KYC가 아니며, 하나의 성공으로 다른
  축을 check 처리하지 않는다.

### 2.3 wallet·payment·stamp causality

```text
기기 내 초기 여행 잔액 ₩60,000
  ├─ 외부 funding route unavailable → 잔액 변화 0
  └─ ONDO 여행 잔액 사용 기록 ₩19,000
       → 잔액 ₩41,000 + local receipt 1
       → merchant order 0 + external money movement 0
       → stamp 변화 0
       → 별도 unique visit evidence 성공
            → stamp 9→10
```

- USD는 `약 US$44.44 · 환율 기준/시각`처럼 보조 추정치일 때만 쓴다.
- OOKRW/USDC/USDT/network/settlement는 사용자가 연 기술 상세 또는 Labs에서만 보인다.
- external funding 실패/취소는 이전 활성 출처, 잔액, benefit, checkout draft를 보존한다.
- `잔액 복원`은 local receipt를 reverse하는 별도 상태 전이다. 실제 merchant refund,
  card reversal, chain refund를 암시하지 않는다.

## 3. FL-001~FL-018 최종 권고 matrix

각 행은 정본의 `ENTRY → DECISION → CANCEL | ERROR → RETRY → TERMINAL → RETURN`과
연결된다.

| Flow | Truth | State/gate | Failure·recovery | Exact return | REQ 보존과 최종 권고 |
|---|---|---|---|---|---|
| `FL-001` | MapLibre, official Seoul/Busan와 editorial Jeju, ONDO≠live crowd/weather | Guest, map/list/filter/selection 독립 | atlas 유지→800ms progress→5s same-query List; permission denial은 search 유지 | camera/query/filter/category/selected venue/list scroll/opener | `REQ-007/013/017~019`; 같은 map instance·3-city renderer를 채택, score 없는 제주를 disabled처럼 보이지 않게 한다. |
| `FL-002` | age predicate 하나; provider/fixture provenance | Age만 변경, Account/Person/Payment 불변 | denied/timeout/expiry는 locked venue+retry/general detail | exact `venueId`, section, camera, opener; `OPEN_AFTER19` one-shot | `REQ-005/012`; setup/ID marketing을 빼고 결과의 19+·expiry·provider truth는 유지한다. |
| `FL-003` | Table/chat/host/booking은 frontend 범위; 실제 사람·예약 과장 금지 | availability/membership/chat/failure 분리; 조건부 Account→Person→Age | sold out/closed/organizer cancel/policy/image fail별 recovery; mutation 최소화 | tableId, venueId, six facts, memo/media draft, scroll/focus | `REQ-008~010/015`; Join 전 6 facts, confirmed-member chat, image retry, report/block/leave, evidence별 reputation을 모두 유지한다. |
| `FL-004` | local balance-use record이지 merchant payment가 아님; ticker folded | Account→Payment KYC; payment/visit/stamp 분리 | provider/funding unavailable, decline/cancel/timeout은 balance·receipt·stamp 불변 | venue/benefit/final KRW/source/consent; `START_CHECKOUT` one-shot | `REQ-006/011/016`; `Use ₩… travel balance`→local record→별도 visit→9→10→opt-in Labs로 확정한다. |
| `FL-005` | Mobile ID provider가 없으면 official Person success 아님 | Person만 변경; K-Tour issuance/presentation 별도 | unavailable/denied/callback invalid/timeout/expiry→alternate/retry/not now | 원 Local Signal/Table action, venue/table/draft/focus | `REQ-001/005`; Korean preference에서 자동 호출 금지, normal fail-closed와 fixture provenance를 분리한다. |
| `FL-006` | Residence selection은 nationality/legal status 추론 아님 | supported일 때만 Person; unsupported 상태 불변 | unavailable vs outage vs denied 분리, Passport alternate | 같은 returnTo의 Person method만 교체; public context/draft 유지 | `REQ-002/005`; 선택 전에 availability를 알리고 neutral alternate를 유지한다. |
| `FL-007` | short-trip preference≠passport/KYC | onboarding state만; Guest map | preference 저장 실패도 기본값 map, skip도 map | 선택/언어와 map camera; identity 시작 없음 | `REQ-003/005/018`; map-backed `intent→taste→map`, 320 첫 CTA, no eKYC를 확정한다. |
| `FL-008` | Korean local은 추천 intent이지 citizenship 아님 | identity axes byte-for-byte 불변 | preference/account 선택 실패가 map을 막지 않음 | 같은 map; later CX gate에서만 exact action | `REQ-001/005/018`; local preference와 JIT Mobile ID를 분리한다. |
| `FL-009` | resident preference≠Residence Card/visa/nationality | discovery state만 변경 | provider unavailable과 onboarding success 무관; later alternate | map preference와 later gated context 독립 보존 | `REQ-002/005/018`; document/credential을 onboarding에서 노출하지 않는다. |
| `FL-010` | local Account는 Person/Age/Payment/K-Tour 아님 | canonical unmet queue 한 축씩 | create fail은 sheet input 보존; expired/forged/duplicate RT는 mutation 없이 safe map | allowlisted public IDs, route/camera/filter/selection/snap/scroll/draft/focus | `REQ-005/008/011`; one anchored shell, one-shot consume, full-plan recheck를 lock한다. |
| `FL-011` | saved는 local persistence이며 reservation/merchant sync 아님 | Account 후 Save mutation 별도 | storage fail은 false bookmark 제거+retry; reset partition 분리 | saved row↔canonical city/peek/detail, My Korea scroll/focus | `REQ-005/016`; photo timeline·mini-map을 채택하고 My Korea 기능을 admin copy와 함께 삭제하지 않는다. |
| `FL-012` | contribution은 public heat/review·Person 증명이 아님 | form 먼저, submit에서 Account→Person; Visit/Contribution만 | photo prepare/send fail은 preview+replace/remove/retry; cancel draft keep/discard | venue/chips/note/photo/draft/sheet/focus | `REQ-003/007/009/015`; sticky clipping 해소, visual chips+labels, success mutation whitelist를 lock한다. |
| `FL-013` | 19+ session predicate; K-Tour/Person/Payment 아님 | Guest도 Age 시작; Account는 보관에만 필요 | fail/expiry/cancel은 base map과 일반 탐색 유지 | city/venue CTA별 exact `OPEN_AFTER19`, camera/filter | `REQ-012`; visible `19+`, reason, expiry, retry, manual-off를 유지한다. |
| `FL-014` | night lens는 official restriction/open-hours/safety가 아님 | four guards 모두 참일 때만 `A19-ON`; manual-off 우선 | clock/guard error fail-closed base map; expiry→recheck | same camera/query/filter/selected place/geometry | `REQ-012`; dark geography 대비, immediate off, 일반 식당 유지, bar-only는 선택 filter로만 허용한다. |
| `FL-015` | self-declared public fields; no nationality targeting/safety score | field visibility와 4 reputation axes 독립 | save fail은 old published+draft; cancel mutation 0 | My Korea/Table entry scroll/focus와 live preview | `REQ-008/015`; default private, field-level consent, no aggregate trust를 lock한다. |
| `FL-016` | record/snapshot/contract-only 사실; official≠eligible/safe/open | each fact confirmed/unknown/stale/error; adapters separate | provider 없음에는 fake refresh 금지; error는 다른 facts/map을 막지 않음 | exact venue/fact/section/focus | `REQ-004/013/014`; consumer answer+observed date, source drawer, OpenDID/EAS separation을 유지한다. |
| `FL-017` | Payment KYC는 external policy proof; provider 없으면 verified 아님 | Payment만 변경, 다른 axes 불변 | unavailable/decline/timeout/cancel/expiry는 receipt·balance·stamp 0 mutation | pinned venue/final KRW/method/benefit/consent; `START_CHECKOUT` | `REQ-005/011`; normal fail-closed, review fixture provenance, exact checkout resume를 요구한다. |
| `FL-018` | Labs only; target network≠actual tx, assets separate | acknowledgment→signer→quote→ordered bridge phases | timeout/fail/cancel assets invariant; source confirmed≠destination final | entry Wallet/Labs disclosure focus와 pending phase | `REQ-004~006/014/016`; OOKRW/USDC/USDT 분리, no AMM, no fake explorer, optional badge를 유지한다. |

검증 결과: `FL-001`부터 `FL-018`까지 **18/18개**가 각각 truth, state/gate,
failure/recovery, exact return, REQ 보존 권고를 가진다.

## 4. privacy·accessibility 위험과 수정 조건

### 4.1 Privacy

- persona, 언어, 위치, 얼굴/여권 이미지, Mobile ID/Residence route로 국적·비자·체류
  상태를 추론하지 않는다.
- PDF의 `DID 국적 기반 타깃 광고`와 `여권 데이터 기반 자동 지갑 생성`은 현 PRD와
  충돌하므로 기각한다.
- raw passport/DOB/ID photo/provider callback/payment instrument/private key/token은
  URL, returnTo, localStorage에 넣지 않는다.
- Local Signal media draft는 URL 밖 session scope이며 replace/remove/close 때 object URL을
  해제한다. public publish 범위는 제출 전 보인다.
- profile은 From/Lives in/Languages 각각 explicit visibility이며 기본 private다.

### 4.2 Accessibility

- 320×568/320×800/390×844/430×932/844×390, 200% text zoom을 모두 release matrix에
  포함한다. 390 snapshot만으로 승인하지 않는다.
- 모든 sheet는 단일 scroll container, safe-area sticky footer, content bottom padding을
  써서 마지막 field와 CTA가 겹치지 않게 한다.
- icon-only dock/control은 localized accessible name, 48px hit target, 8px critical gap,
  visible focus, non-color current state를 가진다.
- heat/official/editorial/limited/selected/pending/error는 색·glow만으로 구분하지 않는다.
- modal focus trap, background inert, Escape/close, opener focus return을 성공·실패·취소
  모두에서 검증한다.
- amount/status update는 polite `aria-live`, 오류 요약은 focusable heading, loading은
  800ms 전 불필요하게 읽지 않는다.
- Report/Block/Leave, consent, amount confirm, restore/reset는 icon-only 금지다.
- EN/KO/JA 최장 문자열과 locale grouping을 실제 component 폭에서 확인한다. decision
  text를 ellipsis로 숨기지 않는다.

### 4.3 “Prose-off”의 한계

공통 standard의 Prose-off test는 좋은 밀도 검사지만 다음 문구에는 적용하지 않는다.

- 실제 금액 이동/merchant order 없음
- 공개할 field와 requester/purpose
- provider unavailable/unsupported/expired/stale/unknown
- destructive scope와 되돌릴 수 있는지
- Table의 여섯 planning facts와 report/block/leave

이 정보는 장식 prose가 아니라 결정·truth다. 아이콘·모션이 보조할 수 있지만 텍스트
의미를 완전히 대체해서는 안 된다.

## 5. locked decisions

1. **Map:** current B MapLibre, D-14/D-15, 같은 map instance·세 도시 renderer·실제 좌표.
2. **Guest-first:** 지도·검색·상세·길찾기는 setup 없이 완료.
3. **Persona:** 세 onboarding 선택은 preference이며 identity/legal class가 아니다.
4. **Gate axes:** Account ≠ Person ≠ 19+ ≠ Payment KYC ≠ K-Tour credential ≠
   Presentation ≠ Reputation.
5. **JIT shell:** 원 행동 하나와 현재 unmet gate 하나, one-shot exact returnTo.
6. **Provider truth:** `NOT_CONFIGURED` default는 unavailable; fixture는 별도 provenance.
7. **Currency:** KRW primary, 근거 있는 USD secondary, ticker/network folded/Labs.
8. **Balance:** 기존 기기 내 여행 잔액 사용 가능; nonzero와 `no funds added` 동시 표시 금지.
9. **Funding:** bank/card·Apple Pay/digital dollar 선택 가능, 미연결이면 no mutation/recovery.
10. **Commerce:** local balance-use record ≠ merchant payment/order; restore ≠ external refund.
11. **Causality:** payment/receipt ≠ visit ≠ stamp; unique visit만 9→10.
12. **K-Tour:** issuance/add와 contextual presentation을 분리하고 각 consent/result를 둔다.
13. **Social:** Table 6 facts, confirmed-member chat, image lifecycle, safety actions 유지.
14. **After19:** four guards, immediate off, same geography, 일반 야간 장소 유지.
15. **Privacy:** no nationality inference/targeting, no passport-derived auto wallet/profile.
16. **Accessibility:** 44px minimum, icon semantics, keyboard/focus, reduced motion, forced colors,
    EN/KO/JA, 320/short landscape/200% zoom.

## 6. release blockers

| 등급 | blocker | 닫힘의 증거 |
|---|---|---|
| P0 | `₩60,000`과 `no funds added` 모순 | Wallet/checkout/receipt 전체에서 하나의 balance provenance, reload 전후 state diff |
| P0 | external provider 없는 Mobile ID/Residence/Passport/Payment/K-Tour false success | normal `NOT_CONFIGURED` E2E는 unavailable+state unchanged, fixture E2E는 provenance 표시 |
| P0 | local receipt가 merchant order/payment처럼 보임 | confirm/result 첫 화면의 no-order/no-money consequence, 영수증·잔액·merchant invariant |
| P0 | K-Tour `added`와 `Present` 상태 혼재 | setup 3-step terminal과 action-specific presentation receipt를 별도 테스트 |
| P0 | funding unavailable selection이 active/Ready로 남음 | sheet cancel/unavailable/reload에서 이전 usable source와 balance 유지 |
| P1 | gate exact-return 일부 맥락 누락 | 7 CTA별 camera/filter/selection/sheet/scroll/focus/draft hash 비교 |
| P1 | 320/short landscape sticky clipping | onboarding, Table note, Local Signal title, wallet/gate footer screenshot+DOM bounds 0 overlap |
| P1 | icon-only nav/control 인지·접근성 | localized accessible names, current state, focus order, 44/48px audit, first-use coach |
| P1 | Table list/detail planning facts와 safety discoverability | Join 직전 6/6 facts, report/block/leave ≤2 taps와 explicit label |
| P1 | source truth와 refresh 과장 | official/editorial/ONDO/unknown/stale/providerless fixture assertions |
| P1 | After19 dark geography와 mode control | coast/road/label contrast, geometry displacement ≤1px, four guard negative matrix |
| P1 | locale parity | EN/KO/JA 320/390/430 + 200% zoom에서 truncation/meaning diff 0 |

동일 product/harness tuple에서 기능·contract gate와 위 의미/visual gate가 함께 통과하고,
작성자가 아닌 reviewers의 clean round 2회가 끝나기 전에는 blockers를 닫지 않는다.

## 7. 사용자 피드백 중 누락 또는 과소 명세된 항목

D1·D2·공통 문서는 핵심 방향을 많이 반영했지만 다음 항목은 실행 가능 acceptance로
충분히 추적되지 않는다.

1. **정규 route·배포 metadata:** `/ondo-b`를 정규 route로 승격하고 redirect/history/
   canonical URL을 확인하는 조건, 공유 링크 제목과 thumbnail의 `K-Tour ID` 표기,
   로그인 없는 공개 접근 검증이 flow 문서 밖에 남아 있다.
2. **제공 로고·`sources/` asset 사용:** K-Tour ID 원본 로고를 identity context에만
   쓰는 원칙은 있으나 favicon, app icon, social image, 16px optical crop, light/dark,
   asset provenance/라이선스의 구체적 acceptance가 없다.
3. **전역 jargon sweep:** `Pulse`, `Peak`, `Hot`, `preview`, `simulated`, `test`,
   `ON-DEVICE`, `Local account`, `official records`, `licence` 같은 maker/행정 언어를
   normal surface별로 0회 검증하는 정적/visual audit가 필요하다. 필요한 truth는 사용자
   consequence로 교체해야지 일괄 삭제하면 안 된다.
4. **permission popover:** 위치 권한 거부 시 이상하게 떠 있는 info popover의 anchor,
   dismiss, retry, search fallback, focus return을 별도 cross-screen acceptance로 잠가야 한다.
5. **실제 asset 기반 food/place list:** photo-led 원칙은 있지만 source-backed image와
   category art를 자동 구분하고 카드 간 중복 crop을 막는 manifest/test가 없다.
6. **사람 이미지 범위:** 실제 앱 같은 인물감을 원한다는 피드백을 반영하되 onboarding/
   Table invitation/My Korea memory에만 허용하고, 외모로 nationality/age/identity를 암시하지
   않으며 eKYC/credential success에는 쓰지 않는 review gate가 필요하다.
7. **지도 좌표·route line:** 실제 서울·부산·제주 projection 오차, label/line collision,
   beacon hover/selected 시 CTA가 도망가지 않는지 frame 단위 검증이 부족하다.
8. **제주 place flow parity:** city renderer뿐 아니라 제주 list→peek→detail→back의 사진,
   temperature/source placement, sheet height, CTA 순서가 서울·부산과 동일 component인지
   DOM-level parity가 필요하다.
9. **숫자 formatting:** Wallet뿐 아니라 record count, seats, amount, receipt, balance의
   locale grouping(`60,000`)과 tabular numeral을 전역 acceptance로 추가해야 한다.
10. **wallet↔place 연결:** bank/local KRW, card·Apple Pay, digital-dollar route가 place의
    benefit→checkout→receipt→My Korea에 실제로 이어지는 한 개 E2E가 필요하다. 사용자의
    nationality/residency를 추론해 route를 숨기지 말고, 명시 선택과 provider availability로
    추천·순서만 바꾼다.
11. **After19 component parity:** 색상만 반전한 white card·magenta outline 혼합, 위치/
    info/list control의 daytime/night geometry 차이를 전 앱 visual diff로 검사해야 한다.
12. **모든 페이지의 bottom dock/scroll:** 지도 외 Settings, My Korea, Tables, Wallet,
    gate/result에서 icon dock과 home indicator, sticky footer, keyboard가 겹치지 않는
    전수 matrix가 필요하다.

## 8. C3 최종 판정

합의안은 D2의 map-backed composition과 motion, D1의 단순한 intent·writing, D3의
truth/state/recovery 경계를 조합하되 아래 세 가지를 우선한다.

1. 사용자가 보는 언어를 줄이는 것보다 false success를 먼저 없앤다.
2. flow 수를 줄이지 않고 공통 shell과 정보 계층으로 작업량을 줄인다.
3. 아름다운 success보다 unavailable/cancel/retry/exact return을 먼저 같은 품질로 만든다.

검증:

- Flow matrix 포함 수: **18/18**
- locked decisions: **16개**
- 명시 release blockers: **12개(P0 5, P1 7)**
- 구현 파일 변경: **0개**
