# C2 · Visual and Interaction Cross-Challenge

상태: **D2 CROSS-REVIEW · NOT FINAL CONSENSUS · IMPLEMENTATION 금지**

작성일: 2026-09-04

검토 관점: 모바일 시각 체계, 공간 연속성, interaction cost, motion, media

검토 입력: D1_PRODUCT_SIMPLICITY, D2_INTERACTION_VISUAL,
D3_TRUST_INCLUSIVE, 00_UX_STANDARD, 00_PRD_PRESERVATION_LEDGER

## 0. 교차 판정

세 독립안은 방향이 대체로 맞지만 그대로 합치면 모순이 남는다. 특히 지도 motion
범위, K-Tour ID의 providerless local result, Wallet의 60,000원 의미, onboarding
구성, Table 정보 밀도, sheet 고정 높이에서 단일 결정을 잠그지 못했다.

이번 C2 판정은 다음과 같다.

- D1의 “한 화면 한 결정”, exact return, maker language 축소는 채택한다.
- D3의 돈·신원 consequence와 accessibility 우선은 채택한다.
- D2의 같은 MapLibre world, 공통 beacon, 짧은 motion, map-backed onboarding은
  채택한다.
- 기능·상태를 없애는 단순화, 역사적 Leaflet/A 회귀, 제주 숫자 온도 생성은
  모두 기각한다.
- 시각 회귀 snapshot이 green이어도 empty basemap 위 screenshot만으로 지도
  선명도와 motion을 승인하는 것은 기각한다.

심각도는 결과 기준으로 다시 정리한다.

| 등급 | 교차 판정 |
|---|---|
| P0 | 실제 돈·외부 주문·공식 신원·credential 발급처럼 오인시키는 상태, gate mutation 오류, payment→stamp 인과 오류 |
| P1 | 지도 맥락 소실, city transition 단절, 320px 주요 행동 차단, modal stack, D-13~D-15 위반 |
| P2 | 과도한 card/radius/shadow, 긴 helper, 일관되지 않은 icon·type·spacing, 미세 모션 |

따라서 D1이 visual ambiguity를 일괄 P0로 둔 부분과 D2가 money/identity truth를
P1로 둔 부분은 모두 수정한다. 실제 오판을 만들면 P0, 이해 비용과 미감 문제면
P1/P2다.

## 1. 세 안의 충돌과 최종 처리

| 쟁점 | D1 | D2 | D3 | C2 판정 |
|---|---|---|---|---|
| 첫 진입 구조 | 살아 있는 지도 우선이나 가치 한 화면을 별도 단계로 읽을 여지 | 첫 frame부터 동일 MapLibre 위 sheet | short flow를 language→taste로 더 압축 | **수정 채택:** value·intent·taste checkpoint는 보존하되 별도 white route가 아닌 같은 MapLibre 위 content-fit sheet로 처리 |
| persona의 의미 | 여행 의도 문장으로 바꿈 | 세 선택은 identity icon 없이 preference로 표시 | 법적 분류·국적 추론 금지 | **채택:** 세 branch는 남기되 추천 lens일 뿐이며 Account/Person/Age/Payment를 mutate하지 않음 |
| preference 결과 | category highlight로 연결 | marker keyline과 list ordering, heat 불변 | effect가 설명 가능해야 함 | **수정 채택:** 모든 장소를 남기고 match keyline+정렬만 변경. ONDO field·score·official/editorial state는 절대 변경 금지 |
| atlas→city motion | same MapLibre, 구체 duration 약함 | 420~450ms | ease/fly 또는 reduced jump | **D2 채택:** 420~450ms 한 번. 공통 규격의 650ms 상한은 기각 |
| city→venue motion | map context 보존 | marker→peek shared emphasis | focus·screen reader 복귀 강조 | **수정 채택:** camera 이동이 필요하면 280~360ms, sheet는 240~280ms. label이 pointer hover에서 도망가면 반려 |
| result motion | 객체 morph 권장 | 일반 220~320ms | 상태 전달 우선 | **수정 채택:** 일반 220~360ms, stamp만 최대 500ms. 공통 규격의 900ms는 느려 기각 |
| sheet 높이 | 공통 shell·한 primary | Peek 168~220px, medium 52~64dvh | text zoom과 short landscape 우선 | **D2 고정 높이 기각:** content-fit + max-height. Peek≤32dvh, Decision≤72dvh, Detail 88dvh, capture/chat/Labs full route |
| modal orchestration | 한 gate씩 | 동일 shell 안 content swap | canonical queue와 focus trap | **전부 채택:** active modal/sheet는 하나, header의 원 객체는 고정, next unmet gate만 교체 |
| K-Tour setup step | 기술 stepper 축소 | Choose-Check-Add, Present 분리 | issued와 presented 분리 | **전부 채택:** Present는 setup stepper에서 제거하고 실제 requester가 있는 JIT presentation으로 이동 |
| provider 미연결 result | local result는 가능하되 live claim 금지 | consumer result + folded truth | provider 미연결이면 성공 fixture 위장 금지 | **수정 채택:** 정본의 simulated fixture 성공은 삭제하지 않는다. 단, official verified/issued/live callback으로 표현 금지. local/private K-Tour result와 provider truth를 About 상세에서 구분 |
| Age proof | Age만 JIT | exact venue와 night morph | 최소 predicate·expiry 노출 | **전부 채택:** Account/Person/Payment/K-Tour marketing을 Age gate에 섞지 않음 |
| Wallet ₩60,000 | local travel balance로 설명 가능 | budget으로 재명명하거나 funds 숫자 제거 제안 | “Ready · no funds added”와 동시 표시는 P0 | **수정 채택:** 60,000원을 유지하려면 명칭을 여행 잔액으로 고정하고 no funds 문구 삭제. 외부 돈이 아님은 checkout 직전/결과에 한 번, 상세에 근거. 아니면 0원으로 바꿔야 하며 두 의미 병존 금지 |
| payment truth 위치 | 기술 상세로 접되 consequence 유지 | decision point 한 줄 | 확인 직전·결과 첫 화면에 필수 | **D3 채택:** 실제 금액/주문이 없다는 consequence는 확인 직전과 결과에 짧게 보이고 기술 ledger만 접음 |
| funding source | 일반 개념으로 표시 | 미연결 상태를 detail에 | sheet-local draft, commit 전 active 금지 | **D3 채택:** bank/card/Apple Pay/digital dollar 미연결 선택은 draft이며 닫을 때 기존 usable source 복원 |
| Table list facts | 시간·자리 중심, detail에 6 facts | 2×3 icon fact grid | list에서 여섯 fact 비교 필요를 강조 | **수정 채택:** list는 time/seat/menu/19+ 등 최대 4개, Join 전 detail에는 6개 모두. 320px list에 6개를 억지로 넣는 안은 기각 |
| bottom navigation | icon-only 허용 | icon-only 기본 | accessible name·current state 요구 | **전부 채택:** phone은 persistent text 제거, 48~56px icon target, localized accessible name, first-use coach 1회 |
| source truth | 한 번 접기 | fact glyph와 drawer | 공식·편집·unknown을 결정점에서 숨기지 않음 | **수정 채택:** source class가 판단을 바꾸는 곳에는 compact glyph+label, ID/timestamp/adapter만 drawer |
| media | source-backed photo와 category art 분리 | photo-led list, blank avatar 금지 | 실제처럼 오인시키는 합성 media 금지 | **전부 채택:** food/list media는 강화하되 출처 없는 사진을 실제 venue evidence로 쓰지 않음 |
| After19 알림 | 한 줄 banner+off | first-use toast 후 persistent icon | mode/일반 장소/통제권 유지 | **수정 채택:** 최초 또는 자동 진입에만 dismissible one-line status+즉시 Off, 이후 persistent icon. full modal·상시 banner 기각 |
| After19 데이터 | 일반 장소 유지 | night-category field 강조 | 술집만 남기는 것 금지 | **전부 채택:** 일반 심야 음식점은 남고, 승인된 simulated night subset만 추가 강조 |
| 제주 | 같은 UI, 다른 truth | same renderer+dashed limited | source 명시·score 없음 | **전부 채택:** field→aura→core→selected halo→capsule 동일, 제주 score=null·editorial-unscored 유지 |
| visual evidence | screenshot pass는 UX 승인 아님 | empty basemap은 지리 인지를 증명 못함 | focus/forced colors/state diff 필요 | **D2/D3 채택:** deterministic local geometry 또는 live recording을 별도 증거로 추가 |

## 2. 공통 primitives 잠금 제안

이 절의 결정은 새 flow를 만들기 위한 것이 아니라 현재 FL-001~018이 공유할
시각·상호작용 언어를 고정하기 위한 것이다.

### 2.1 Map primitive · LOCK

- renderer는 current B의 MapLibre다. Leaflet, raster poster, 별도 nation canvas로
  되돌리지 않는다.
- 첫 paint부터 같은 map surface가 존재한다. 최초 네트워크 진입에는 locally
  deterministic한 최소 Korea geometry를 쓰거나 MapLibre style skeleton을 써
  흰 빈 화면을 피한다.
- 서울·부산·제주는 실제 좌표의 44×44px CityTemperatureBeacon과 짧은 인접
  label만 쓴다. 큰 pill/card가 지형을 가리면 반려한다.
- 세 도시는 field→aura→core→selected halo→place capsule의 동일 renderer다.
  서울은 double solid, 부산 single solid, 제주 dashed limited ring이다.
- 서울·부산은 curated-scored, 제주는 editorial-unscored다. 제주 score=null,
  pulseScore=-1, level=limited, pulseEligible=false, officialRecord=false를 유지한다.
- 온도 field는 일반 place density, live popularity, crowd, safety KDE가 아니다.
- atlas→city는 420~450ms, north-up, one-shot이다. city tap feedback은 80ms,
  camera는 100ms 안에 시작한다. city→venue camera가 필요하면 280~360ms다.
- city 진입 때 search autofocus와 keyboard pop-up을 금지한다.
- 상단 chrome은 safe-area 제외 152px 이하, city usable map은 390×844 첫
  viewport의 58% 이상을 목표로 한다.
- legal attribution은 항상 접근 가능하되 primary control과 겹치지 않는다.
- Map/List result, order, filter, selection은 parity를 유지한다.

### 2.2 Loading and recovery primitive · LOCK

- 0~800ms: 이전 atlas/cached context 또는 map skeleton을 유지하고 설명 문장을
  띄우지 않는다.
- 800ms 이후: 해당 객체에 붙는 compact, non-blocking progress만 보인다.
- 5초 안에 ready가 아니면 동일 query/filter/selection의 usable List를 foreground.
- recoverable tile/glyph/source 및 superseded AbortError/ERR_ABORTED를 full failure로
  승격하지 않는다. fatal initialization만 Map unavailable이다.
- Retry 뒤 camera, query, filters, selection, sheet snap, scroll, opener focus를
  복원한다.
- loading skeleton이 실제 음식 사진, 사람, credential 또는 payment success처럼
  보이지 않게 neutral geometry만 사용한다.

### 2.3 Sheet and route primitive · LOCK

| variant | 규격 | 사용 |
|---|---|---|
| Peek | content-fit, 최대 32dvh | place/Table 빠른 판단 |
| Decision | content-fit, 최대 72dvh | Account, Age, Payment, consent |
| Detail | 88dvh, 단일 내부 scroll | place, Table, receipt |
| Full task | 100dvh route 또는 full sheet | chat, passport capture, Labs |

- active overlay는 하나다. 새 backdrop 위 modal을 또 쌓지 않는다.
- header는 back/close 한 개와 원 객체 한 개만 담고, gate queue 동안 고정한다.
- sticky footer는 52~56px primary와 safe-area를 포함하며 content bottom padding이
  footer 높이보다 작으면 반려한다.
- fixed height는 KO/EN/JA, 200% text zoom, keyboard에 취약하므로 금지한다.
- open/close 240~280ms, inline body swap 160~200ms, full task 280~320ms.
- Back=이전 단계, Close=현재 flow 취소, Not now=이 행동을 건너뜀을 전역에서
  바꾸지 않는다.

### 2.4 Icon and pictogram primitive · LOCK

- 24px optical grid, 2px rounded stroke, critical target 48×48px, 최소 gap 8px.
- phone bottom dock는 5개 icon-only다. label은 localized accessible name으로
  남고 selected state는 48px black squircle+white icon+aria-current로 표현한다.
  별도 indicator를 겹쳐 중복 강조하지 않는다.
- search, back, close, bookmark, locate, list는 icon-only가 가능하다.
- 결제, consent, 공개, 삭제, 신고, 차단, 복원, unavailable 대안은 짧은 text
  verb를 반드시 유지한다.
- 온도, source, seat, time, language는 icon+짧은 label/value로 표현한다.
  color-only dot 세 개, 의미 없는 initial avatar, generic shield 남발은 반려한다.
- map utility tray는 locate, layer/editorial, After19, List의 최대 네 역할만
  갖는다. Stories 별도 floating CTA와 editorial layer가 중복되면 하나로 합친다.

### 2.5 Media primitive · LOCK

- 장소 list와 Table list는 4:3 또는 1:1 source-backed thumbnail slot을 가진다.
  이미지가 없으면 동일 크기의 branded/category illustration fallback을 쓴다.
- category illustration은 실제 venue photo로 오인되지 않게 공통 crop, label,
  accessible description을 가진다. 같은 이미지를 인접 card에서 반복하지 않는다.
- synthetic/fictional person은 onboarding aspiration, Table invitation, My Korea
  memory에만 쓸 수 있다. eKYC, credential result, official place evidence, age
  proof에는 사용하지 않는다.
- 빈 원형 profile/photo placeholder를 장식으로 두지 않는다.
- image loading/error에도 card 높이와 text anchor가 움직이지 않는다.
- photo permission·decode·replace·remove·retry는 media slot 안에서 처리한다.

### 2.6 After19 night primitive · LOCK

- light와 동일한 camera, road, coast, district label, marker geometry를 유지한다.
- canvas는 near-black, land/water는 서로 7% 이상 luminance 차이를 두고,
  주요 text 4.5:1, secondary geography/UI boundary 3:1 이상이다.
- plum/pink/coral neon은 active heat와 selected state에만 쓴다. 일반 white card를
  그대로 반전하거나 모든 outline을 neon으로 만들지 않는다.
- theme crossfade는 220ms, geometry 이동은 0~1px 허용, reduced motion은 duration 0.
- auto-on 첫 진입에만 한 줄 status와 44px Off를 제공하고 이후 icon state로
  축약한다.
- 네 guard, manual-off 우선, expiry/recheck를 유지한다. 일반 심야 음식점은
  숨기지 않는다.

### 2.7 Type, spacing, radius, elevation · LOCK

- 320/360 edge 16px, 390/430 edge 20px.
- display 32~38px, screen title 26~32px, section 20~22px, body 15~17px,
  metadata 12px 미만 금지. 같은 route에서 display를 두 번 쓰지 않는다.
- spacing token은 4/8/12/16/20/24/32/40/48만 사용한다.
- control radius 12~16px, card 18~22px, sheet 28px. 세 겹 round card 금지.
- static card는 border/spacing, floating control과 sheet만 shadow를 쓴다.
- success morph 220~360ms, stamp milestone만 최대 500ms. 900ms result motion과
  반복 pulse/confetti는 반려한다.

## 3. FL-001~FL-018 최종 시각·상호작용 권고

| Flow | C2 최종 권고 | 반려 조건 | 보존 REQ·truth |
|---|---|---|---|
| FL-001 | 첫 frame부터 같은 MapLibre atlas. 44px 3-city beacon→420~450ms city camera→field/list/peek를 한 spatial sequence로 연결한다. search는 사용자 tap 전 focus하지 않는다. | 큰 city pill, 흰 중간 화면, Leaflet/A 회귀, 제주 숫자, popularity KDE, empty basemap screenshot만으로 승인 | REQ-007/013/017/018/019, 400 official, 제주 editorial-unscored, Map/List parity, coordinates, attribution, fallback |
| FL-002 | 선택 venue thumbnail/name이 고정된 Age Decision sheet 한 장. 19+ predicate와 이유만 확인하고 lock→check→같은 venue night detail로 morph한다. | Person/Account/Payment/K-Tour marketing 노출, 다른 장소 복귀, DOB/passport 원문 저장, night geometry 이동 | REQ-005/012, independent AGE, exact OPEN_AFTER19, expiry/retry, base detail 유지 |
| FL-003 | photo-led list에는 비교 핵심 최대 4개, Join 전 detail에는 6 planning facts 전부. confirmed state가 chat room으로 morph하고 image failure는 bubble 자리에서 회복한다. | 320 list에 6 facts 강제, sticky CTA가 note를 덮음, nonmember chat, 실제 host/reservation 암시, safety action icon-only | REQ-008/009/010/015, availability/membership/chat 분리, image retry, check-in/feedback, Report/Block/Leave |
| FL-004 | merchant·benefit·최종 KRW 한 개를 primary object로 둔다. payment record 뒤 별도 visit event가 있고 그 뒤에만 9→10 ring이 채워진다. | 정상 화면 ticker/network, 외부 주문·돈 이동처럼 보이는 receipt, payment 직후 stamp, failure asset mutation | REQ-006/011/016, D-13, independent Payment KYC, receipt, unique visit, stamp, opt-in badge |
| FL-005 | 원 Local Signal/Table 객체가 고정된 Person sheet. Mobile ID→consent→fixture result→exact CTA. K-Tour setup은 Choose-Check-Add, presentation은 별도 JIT다. | onboarding 자동 CX, official verified/issued 암시, provider logo wall, Present를 setup 4단계로 유지, 다른 axis check | REQ-001/005, CX success/cancel/fail/expire fixture, Person-only, exact returnTo, provider truth |
| FL-006 | method list에서 Residence availability를 선택 전에 보이고, unavailable이면 같은 sheet에서 Passport를 primary 대안으로 준다. | “foreigner” 분류, 국적 추정, unsupported를 user failure로 표현, alternate가 새 modal/route를 열어 context 소실 | REQ-002/003/005, supported/unsupported/alternate, provider-neutral passport, Person-only return |
| FL-007 | value→여행 의도→taste의 세 의미 checkpoint를 같은 map-backed sheet에서 진행. 선택 match는 marker keyline/list order로 즉시 보인다. | 별도 hero/white route, map 전 eKYC·wallet, Skip 차단, preference가 heat/official truth 변경, primary 두 개 | REQ-003/005/018, short-trip branch, language/taste/diet, Guest map, skip/failure fallback |
| FL-008 | “한국인”을 법적 badge가 아닌 “익숙한 곳 다시 찾기” recommendation lens로 표현. map 진입 후 Person-required action에서만 Mobile ID를 추천한다. | ID/shield badge, CX 자동 호출, local=국적/신뢰 표현, location permission 자동 요청, Guest map 차단 | REQ-001/005/018, Korean branch/defaults, optional Account, later CX, Guest fallback |
| FL-009 | “한국에 머무는 중”을 생활권 lens로 표현하고 credential icon을 제거. Residence/Passport는 later JIT method다. | visa/card 보유 전제, nationality 공개, provider 미연결을 첫 인상 error로 노출, residence choice가 identity state mutate | REQ-002/005/018, resident branch/defaults, optional Account, later Residence/passport, Guest fallback |
| FL-010 | 모든 protected action은 하나의 anchored Decision sheet와 canonical unmet queue를 쓴다. 성공은 별도 page가 아니라 원 CTA 객체 상태로 나타난다. | modal stack, generic “minimum check/on-device” hero, 여러 axis badge, duplicate mutation, route만 복귀하고 focus/draft 소실 | REQ-005 및 trigger REQ-008/011, Account independence, 7 return CTA allowlist, TTL, one-shot consume |
| FL-011 | bookmark 140ms morph+짧은 toast, My Korea는 mini-map과 photo timeline. saved row는 canonical city→peek history를 재사용한다. | 저장 success modal, 반복 ON THIS DEVICE, icon nav의 persistent 두 줄 label, blank avatar, noncanonical detail route | REQ-005/016, save persistence/error/retry, My Korea history, reset partition, exact focus |
| FL-012 | venue header 아래 2×2 pictogram, optional note/photo를 compact row로 두고 Submit 때 Account→Person JIT. success는 Visit/Contribution 두 축만 morph한다. | 기술 hero, public heat 변화 암시, photo 전송 성공 가장, gate에서 draft 소실, sticky header/footer overlap, stamp/Meetup 변화 | REQ-003/007/009/015, photo lifecycle, Account+Person, idempotency, Visit/Contribution only |
| FL-013 | map 19+ icon과 동일 glyph의 Age sheet를 사용하고 success 뒤 같은 camera에서 night tokens만 바꾼다. Guest도 시작 가능하다. | master ID setup, Account 강제, 일반 지도 차단, mode가 filter처럼 불명확, manual-off 무시 | REQ-012, manual proof, AGE expiry, exact OPEN_AFTER19, session/account persistence split |
| FL-014 | four guards 통과 시 same camera에서 220ms night crossfade, 최초 one-line status+Off 후 compact active icon. 일반 심야 장소는 남긴다. | black void map, bars-only replacement, full-screen 설명, 매번 banner, light/night marker displacement, 제주 별도 renderer | REQ-012/019, four guards, manual-off precedence, expiry/recheck, night-category subset, D-14/D-15 |
| FL-015 | From/Lives/Languages를 field별 value+visibility row와 live public preview로 연결. reputation은 4개 독립 segment/timeline이다. | ID-derived nationality, 국가 flag만 표시, aggregate trust/safety score, default public, save failure가 published state 손상 | REQ-008/015, self-declared field consent, four-axis evidence, no aggregate score, privacy |
| FL-016 | place의 card/phone/reservation/language/age fact를 check/question/clock/warning glyph+label로 표시하고 evidence는 drawer로 연다. | official=추천/영업/결제 가능, source class 완전 숨김, generic shield, OpenDID=EAS 암시, unknown을 positive 처리 | REQ-004/013/014, fact states, provenance/freshness, separate adapters, contract-only/deferred truth |
| FL-017 | checkout final KRW와 merchant를 sheet header에 고정하고 Payment predicate 하나만 처리. unavailable source는 draft로 남기고 기존 usable source를 복원한다. | K-Tour/Person/Age 동시 완료, amount 소실, providerless live payment receipt, normal ticker, cancel/fail asset mutation | REQ-005/011, D-13, independent PKY, exact START_CHECKOUT, failure/expiry/retry/no-stamp |
| FL-018 | consumer Wallet 밖 Labs full task. USDC/USDT/OOKRW를 separate rows로 두고 source submitted→confirmed→relaying→destination final timeline을 보인다. | 합산 USD ledger, source confirmed에 success check, fake txRef/explorer, AMM CTA, destination final 전 balance 증가 | REQ-004/005/006/014/016, acknowledgment, signer fixture, separate assets, ordered bridge, asset invariance, badge opt-in |

### Flow table 공통 반려 규칙

- 어느 Flow든 ENTRY/DECISION/CANCEL/ERROR/RETRY/TERMINAL/RETURN 중 하나를
  card 축소와 함께 삭제하면 반려한다.
- 한 Flow의 성공이 Account/Person/Age/Payment/K-Tour/Reputation 중 계약 밖의
  축을 시각적으로 check 처리하면 반려한다.
- return route만 맞고 camera/query/filter/selection/sheet/scroll/focus/draft가
  달라지면 exact return 실패다.
- 기능을 disclosure로 옮겼다면 keyboard, screen reader, Back/Forward/reload에서도
  도달 가능해야 한다.

## 4. 모바일·언어·reduced motion acceptance

### 4.1 viewport matrix

| viewport | source composition | 필수 첫 화면 | 즉시 반려 |
|---|---|---|---|
| 320×568/800 | edge 16px, single column, content-fit sheet, icon-only dock | context, 질문, primary, close/back가 한 scroll container에서 도달 | fixed footer가 마지막 field를 덮음, 2열 card 강제, 12px 미만 text, horizontal scroll |
| 360×800 | edge 16px, 320과 같은 우선순위 | map/decision object가 늘어난 여백을 차지 | 390용 padding을 그대로 써 map 축소, nav label 재등장 |
| 390×844 | canonical mobile composition, edge 20px | map usable area 58%+, 한 primary, compact chrome | display title/card가 viewport 절반 이상 점유, utility tray와 field 충돌 |
| 430×932 | edge 20px, 정보 추가가 아니라 공간 확대 | 더 큰 map/media와 여유 있는 line length | 글자·card를 비례 확대해 같은 정보가 덜 보임 |
| 844×390 | short-landscape 전용 grid, rail 비활성, single sheet scroll | close/back, current decision, primary가 keyboard 없이 도달 | desktop rail 자동 등장, header/footer 양쪽 고정으로 body 120px 이하, 이중 scroll |

기존 evidence matrix의 768×1024, 801×1000, 1440×1000은 삭제하지 않는다.
이번 mobile-first gate는 위 다섯 구성을 추가·강화한다.

### 4.2 KO/EN/JA

- decision title, CTA, error, money, consent, public scope에 ellipsis를 금지한다.
  장소 고유명만 별도 full-name 접근 경로가 있을 때 제한적으로 허용한다.
- pseudo expansion 130%와 실제 JA 금칙/영문 장단어를 모두 검사한다.
- 같은 component에 고정 height를 쓰지 않는다. primary는 최대 두 줄,
  ActionRow는 3줄이 필요하면 description을 disclosure로 옮긴다.
- 통화는 locale formatter와 tabular numeral을 사용한다. 60000, 60 000 같은
  비지역화 숫자나 comma 누락을 반려한다.
- 언어 switch는 즉시 현재 route/sheet/draft를 유지하며 바뀐다. 첫 onboarding,
  map, Place, K-Tour ID, gate, Wallet, Table, Settings에서 EN/KO/JA 의미가 같다.
- icon-only control은 보이는 언어와 같은 accessible name을 가진다.
- 기술 brand명은 번역하지 않더라도 앞뒤 human purpose는 각 언어로 번역한다.

### 4.3 Reduced motion과 접근성

- prefers-reduced-motion에서 atlas→city/venue는 jumpTo 또는 duration 0,
  After19는 즉시 token 교체, success bloom/scale은 opacity로 바꾼다.
- animation을 꺼도 selection, progress, success, failure, mode change를
  live region과 static state로 알 수 있어야 한다.
- focus trap, Escape, background inert, close, opener focus return을 모든
  sheet/full task에서 검증한다.
- forced colors에서 beacon ring, selected row, unavailable, error, official/
  editorial이 border·glyph·text로 구분된다.
- map gesture를 쓰지 못해도 semantic List에서 같은 결과와 action을 완료한다.
- critical controls는 44×44px 이상, 인접 control gap 8px 이상이다.
- 200% text zoom에서 amount, consent, failure recovery, destructive scope를
  가리거나 sticky 영역 뒤로 보내지 않는다.

### 4.4 motion evidence

정적 pixel baseline만으로 transition 품질을 승인하지 않는다.

- atlas→city 60fps frame recording: tap feedback≤80ms, camera start≤100ms,
  settle 420~450ms.
- city→venue/peek: label이 좌표에서 이탈하거나 CTA hover/focus 중 움직이지 않음.
- sheet: backdrop와 surface가 같은 frame에 시작하며 open/close 240~280ms.
- loading: 800ms threshold, 5s list foreground, late map recovery의 context 유지.
- After19: geometry diff 0~1px, 220ms color crossfade, general place 유지.
- reduced motion: 위 sequence의 state/focus/return 결과는 동일하며 시간만 0이다.

## 5. 사용자 피드백 누락 감사

세 독립안과 공통 규격이 방향을 언급했더라도, 구현 가능한 계약과 검증 증거가
없으면 “반영 완료”로 보지 않았다.

| 사용자 피드백 | 현재 문서 반영 | 남은 gap / C2 요구 |
|---|---|---|
| 첫 진입부터 실제 지도, layer를 걷어내고 city tap 시 몰입감 있게 zoom | 원칙과 motion은 반영 | current visual baseline은 basemap을 비우므로 선명도·동영상 증거 없음. deterministic Korea/city geometry와 frame recording 필수 |
| 서울·부산·제주 실제 위치와 연결선 정확성 | D-14/D-15, FL-001에 반영 | 좌표 projection screen diff와 north-up/route-line anchor test를 별도로 추가해야 함 |
| 서울·부산·제주 온도 UI 완전 통일 | 반영 | 제주가 같은 renderer인지 light/night, map/list/peek 전 상태의 geometry diff 증거 필요 |
| 제주에도 온도가 보이되 숫자 인기처럼 만들지 않기 | 반영 | editorial coverage field가 실제 검증 좌표만 쓰는지 fixture audit 필요 |
| 지도 선명도와 너무 굵은 선 개선 | 원칙만 반영 | coastline/road/admin/label의 exact light/night token과 320 실기기 캡처 필요 |
| marker hover/focus 때 CTA가 도망가지 않기 | 부분 반영 | pointer, keyboard focus, touch selection 각각 anchor displacement 0~1px test 추가 |
| 지도 loading animation과 800ms/5s recovery | 반영 | 정적 screenshot이 아닌 fake-timer state 및 recording evidence 필요 |
| 전체 앱에서 말 줄이고 icon/pictogram/flow로 설명 | 반영 | 화면별 “삭제 문장→대체 상태/interaction” inventory가 아직 없음. 구현 PR마다 작성 필수 |
| mobile bottom nav text 제거 | C2에서 lock | 실제 320/360/390/430과 EN/KO/JA accessible name 증거 없음 |
| 온도/Pulse 표현은 소비자에게 “온도” 중심 | 일부 누락 | 내부 state/testid는 유지 가능하나 visible Pulse/Peak/Hot copy 전수 검색과 제거 기준을 cross-screen 문서에 추가 |
| 음식점 list에 식욕을 자극하는 이미지 | primitive에 반영 | source-backed venue image와 category illustration의 asset/provenance mapping, 중복 crop QA가 없음 |
| 실제 사람 이미지로 앱다운 느낌 | 허용 범위만 반영 | 사용 위치·권리·다양성 art direction 미정. eKYC/credential/official evidence에는 금지하고 Table/onboarding/My Korea만 후보 |
| 빈 원형 avatar/photo placeholder 제거 | C2에서 lock | 모든 list/peek/K-Tour method/profile의 placeholder census 필요 |
| modern white/black, 누런 전역 tone 제거 | near-white/near-black 원칙 반영 | exact neutral palette와 semantic token mapping이 없어 페이지마다 beige가 다시 생길 수 있음 |
| After19 dark/neon이면서 모든 component가 자연스럽게 연결 | C2에서 lock | 실제 basemap geography, sheet/control/list 상태의 light↔night pair evidence 필요 |
| “on-device”, “preview”, “simulated”, “test”, 기술 자기설명 축소 | 반영 | Settings, My Korea, Labs entry, receipt, source sheet를 포함한 visible-copy census가 없음 |
| 공식 기록 수·인허가·curated 같은 행정 문구를 전면에 두지 않기 | 반영 | “공식 등록 정보” 정도의 human label과 source drawer 위치를 cross-screen copy sheet에서 확정해야 함 |
| info popover가 지도 위 큰 흰 상자로 뜨지 않기 | 직접 계약 누락 | utility에 붙는 280px 이하 anchored popover 또는 bottom disclosure로 통일하고 viewport edge collision test 필요 |
| 숫자 60,000처럼 locale grouping | 반영 | KRW/JPY/USD 각 locale snapshot 및 screen-reader amount pronunciation test 필요 |
| KRW/USD를 전면, OOKRW/USDC/USDT는 tooltip/detail | 반영 | current baseline의 OOKRW 노출이 실제 제거됐다는 evidence 필요 |
| 내국인·장기체류자의 bank funding, 외국인의 digital dollar/Apple Pay 경로 | truth 경계만 일부 반영 | provider 미연결 current demo에서는 selectable draft+unavailable까지만 가능. live funding처럼 보이지 않는 persona-neutral funding matrix 별도 필요 |
| 지도 venue와 wallet/payment가 서로 연결된 경험 | Golden Journey/FL-004에 반영 | 실제 place offer→checkout→exact place return E2E와 merchant acceptance 비주장 copy를 잠가야 함 |
| Passport OCR/face와 DID/K-Tour onboarding 연결 | identity flow에 반영 | passport capture를 full task로 두되 setup과 presentation을 분리하는 최종 screen sequence와 320/landscape media QA 필요 |
| K-Tour ID 제공 logo, favicon, PNG, social thumbnail 사용 | brand 원칙만 반영 | sources asset inventory, 최소 크기, crop, background, favicon, OG image의 exact spec이 없음 |
| ONDO와 K-Tour ID 이름 관계 | brand 원칙만 반영 | consumer shell=ONDO, identity/pass=K-Tour ID는 맞지만 공유 링크 title·thumbnail·canonical name을 확정해야 함 |
| ondo-b를 정규 route로 전환 | 네 문서에 미반영 | current B 정본은 여전히 /ondo-b이고 NOT DEPLOYED. route alias/canonical/redirect와 old link 정책은 X-01 release spec으로 별도 결정 |
| Settings는 “Settings”면 충분하고 언어는 compact, JA 지원 | 언어 원칙만 반영 | Settings는 정규 FL 밖이라 screen-specific compression·language control·reset scope를 X 문서에 추가해야 함 |
| URL/thumbnail 배포 후 전달 | UX 문서 범위 밖 | deployment smoke, canonical URL, public access, OG cache refresh를 release checklist에 남겨야 함 |

### 누락 판정

사용자 피드백의 **방향**은 대부분 반영됐지만 다음 다섯 가지는 아직 별도 산출물
없이는 닫혔다고 말할 수 없다.

1. canonical route/URL/social thumbnail와 제공 logo asset spec
2. Settings와 info popover를 포함한 정규 Flow 밖 화면
3. source-backed food/people media inventory와 권리·fallback
4. visible maker-language/Pulse/행정용어 전수 census
5. 실제 MapLibre geography/motion/night pair evidence

## 6. 00_UX_STANDARD 수정 제안

| 현재 초안 | 문제 | C2 수정안 |
|---|---|---|
| 제품 문장 “한국의 지금 먹을 곳” | current/live local popularity로 읽힐 수 있음 | “한국에서 먹을 곳을 온도로 발견하고…”처럼 live claim을 제거하거나 명시된 signal truth와 연결 |
| Map focus 420~650ms | 650ms는 phone에서 sluggish하고 D2/기존 interaction 상한과 충돌 | atlas→city 420~450ms, city→venue 280~360ms로 분리 |
| Result 500~900ms | ordinary result에 900ms는 느리고 새 success page를 유도 | 일반 morph 220~360ms, stamp만 최대 500ms |
| Sheet variant의 height만 기술 | localized content와 keyboard에서 구현자가 fixed height로 오해 가능 | 모두 content-fit+max-height, 단일 scroll, footer padding 공식을 명시 |
| mobile selected state “tile 또는 indicator” | 구현 선택이 남아 화면마다 달라질 수 있음 | 48px black squircle+white icon+aria-current 하나로 잠그고 별도 indicator 금지 |
| balance 예시 ₩60,000 | no funds/provider truth와 충돌 가능 | 여행 잔액 의미·source를 하나로 고정. 60,000 유지 시 no funds 삭제, 아니면 0원. checkout consequence는 별도 한 줄 |
| 숫자 ONDO를 선택/list/detail에서 확인 | 제주에도 score를 넣는 오해 가능 | 숫자는 서울·부산 source-backed detail에만 가능, 제주 모든 consumer state에는 금지 |
| 실제 지도 즉시 | external basemap 실패 첫 실행의 객체가 불명확 | same MapLibre instance의 local minimal geometry/cached atlas/fallback 순서를 명시 |
| color token이 역할 수준 | beige 재발과 night 불일치 차단 부족 | exact light/night neutral, heat, focus, error token 표와 contrast를 추가 |
| MediaCard 원칙 | asset provenance와 중복 방지 증거 부족 | source type, rights, fallback, crop, duplicate-neighbor test를 component 계약에 추가 |

## 7. 00_PRD_PRESERVATION_LEDGER 보강 제안

원장의 기능·상태 보존 방향은 채택한다. 다음은 의미 변경이 아니라 visual
implementation에서 삭제를 막기 위한 보강이다.

1. REQ-001~003에 “providerless simulated fixture result는 live official
   verification으로 표시하지 않되 fixture branch 자체는 삭제하지 않는다”를 추가한다.
2. REQ-007/019에 preference가 marker emphasis/list order만 바꾸고 ONDO field,
   score, sample, band, freshness를 mutate하지 않는다고 명시한다.
3. REQ-011에 positive 여행 잔액과 “no funds added” 동시 표시 금지를 추가한다.
4. REQ-012에 일반 심야 음식점 유지와 light/night marker geometry diff 0~1px를
   visual invariant로 추가한다.
5. REQ-018에 320×568/800, 360×800, 390×844, 430×932, 844×390의 composition
   matrix와 KO/EN/JA/200% zoom을 명시한다.
6. REQ-019에 empty-basemap pixel evidence만으로 지도 가시성·좌표·motion을
   승인할 수 없다는 evidence rule을 추가한다.
7. Flow 밖 Settings, app shell, info popover, canonical route/OG metadata도
   preservation check의 X-screen 항목으로 연결한다.

## 8. 합의 문서 반려 조건

다음 중 하나라도 최종 합의에 남으면 C2는 반려한다.

- MapLibre를 다시 mount하거나 atlas→city 사이에 white frame/별도 poster가 있다.
- motion 범위가 “420~650”, “500~900”처럼 구현마다 체감이 달라지는 상태로 남는다.
- 같은 기능의 sheet가 px 고정 높이와 임의 radius/shadow를 가진다.
- phone dock에 visible label이 남거나 selected grammar가 두 가지다.
- 서울·부산·제주 중 하나가 다른 marker/list/peek renderer를 쓴다.
- preference가 ONDO field를 개인화하거나 제주에 score를 만든다.
- K-Tour setup에 Present가 남거나 local result가 official DID/VC issuance처럼 보인다.
- 실제 provider가 없는데 bank/card/Apple Pay/digital dollar가 active source로 commit된다.
- checkout 직전과 결과 어디에도 실제 money/order consequence가 없다.
- payment result와 unique visit 사이 visual 사건 경계가 없다.
- ordinary night place를 숨기거나 After19에서 geography가 사라진다.
- icon-only로 줄인 consequential action에 text verb 또는 accessible name이 없다.
- food/people imagery의 source/fallback/권리 계약 없이 실제 evidence처럼 사용한다.
- 320/360/390/430/844×390 중 하나 또는 KO/EN/JA/reduced motion 증거가 없다.
- route/Settings/logo/social metadata의 사용자 피드백이 “Flow 밖”이라는 이유로
  최종 checklist에서 사라진다.

## 9. C2 권장 합의 순서

1. 먼저 D-13~D-15와 money/identity consequence를 표준·ledger에 보강한다.
2. Map, Loading, Sheet, Icon, Media, After19 primitive를 이 문서처럼 단일값으로
   잠근다.
3. FL-001과 FL-007~009의 same-map choreography와 preference effect를 prototype한다.
4. FL-005/006/010/013/017의 single-sheet gate와 setup/presentation 분리를 prototype한다.
5. FL-004/011/018의 balance, receipt, visit, Labs visual causality를 연결한다.
6. FL-003/012/015/016의 media/fact/safety/accessibility를 적용한다.
7. Settings/route/brand/OG/media inventory의 cross-screen 문서를 닫는다.
8. 모든 motion·map evidence와 viewport/locale matrix가 green인 뒤에만 visual
   baseline을 갱신한다.

이 순서는 새 복잡성을 더하는 것이 아니라 current B의 state와 18개 Flow를 공통
primitives로 압축하면서 사용자가 보는 인과관계만 더 명확하게 만드는 순서다.

## 10. 구조 검증 보고

- FL-001~FL-018 행 수: **18/18 · 중복 0 · 누락 0**
- 필수 viewport 명시: **320/360/390/430/844×390 모두 확인**
- KO/EN/JA 및 reduced motion: **명시 확인**
- git diff --check: **PASS · tracked diff exit 0, 신규 문서 whitespace 진단 0**
