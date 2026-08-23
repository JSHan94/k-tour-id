# ONDO Content & Localization

상태: `KO/EN COPY BASELINE · 2026-08-19`
대상 릴리스: `ONDO Frontend Demo Candidate v2`
기본 사용자 언어: 첫 진입에서 선택, 이후 설정 유지
기본 제품 범위: 한국 식음료 발견, 장소 기반 연결, 필요한 순간의 자격 확인

이 문서는 화면에 그대로 넣을 한국어·영어 문구와 진실성 규칙을 고정한다. 개발자가 의미가 비슷한 표현으로 임의 치환하지 않는다. fixture와 실제 연동 상태가 달라지면 `truth`에 맞는 문구를 선택한다.

---

## 1. Voice 원칙

- 짧고 따뜻하지만 과장하지 않는다.
- 외국인을 `도움이 필요한 사람`으로 묘사하지 않는다. 낯선 지역명을 몰라도 취향으로 발견할 수 있게 돕는다.
- `hot`은 ONDO의 최신 로컬 식음료 신호다. 인파·안전·기온으로 말하지 않는다.
- 신원 확인은 자격 확인이지 안전·성품·전문성 보증이 아니다.
- 부정확한 확신보다 `확인 중`, `표본이 적음`, `연결 전`을 사용한다.
- EN에서는 title case를 남발하지 않는다. 브랜드/기능명 외 문장형 대소문자를 쓴다.
- 장소는 가능한 경우 `한국어 이름`을 먼저, 다음 줄에 영어 이름을 쓴다.

### 고정 표기

| 개념 | KO | EN |
|---|---|---|
| 제품 | `ONDO` | `ONDO` |
| 기본 지도 | `ONDO 지도` | `ONDO map` |
| 야간 레이어 | `After 19` | `After 19` |
| 모임 | `Pulse Table` | `Pulse Table` |
| 접근 정보 | `가기 전 확인` | `Before you go` |
| 기념 수집 | `방문 스탬프` | `Visit stamps` |
| 기술 실험 영역 | `Labs` | `Labs` |
| 한국 기준 시간 | `한국 시간` | `Korea time` |

---

## 2. Screen ID와 copy key 규칙

- 화면: PRD의 canonical `SCR-[SURFACE]` (`SCR-ONB`, `SCR-MAP`, `SCR-VENUE`, `SCR-ID`, `SCR-A19`, `SCR-TABLE`, `SCR-CHAT`, `SCR-FEEDBACK`, `SCR-MY`, `SCR-LABS`)
- Account gate는 현재 canonical 화면 위 dialog, 공개 프로필 편집은 `SCR-ID`의 sheet다. PRD 목록 밖의 별도 Screen ID를 만들지 않는다.
- copy key: `<surface>.<element>.<state>`
- interpolation: `{venue}`, `{count}`, `{time}`, `{city}`
- KO/EN 모두 동일 key와 변수를 사용한다.
- 숫자·시간은 locale formatting을 적용한다. KST 조건은 문자열 번역이 아니라 `Asia/Seoul` 계산 결과를 쓴다.

---

## 3. Onboarding

### `SCR-ONB` · 가치 소개 step

| Key | KO | EN |
|---|---|---|
| `onboarding.welcome.eyebrow` | `한국에서의 한 끼` | `A meal in Korea` |
| `onboarding.welcome.title` | `지역 이름을 몰라도, 지금 먹고 싶은 분위기로 찾아보세요.` | `Find what you want to eat now, even if you do not know the neighborhood.` |
| `onboarding.welcome.body` | `ONDO는 최근 로컬 식음료 신호를 모아 한국의 동네와 장소를 보여줍니다.` | `ONDO brings recent local food and drink signals together across Korea.` |
| `onboarding.welcome.primary` | `시작하기` | `Get started` |
| `onboarding.welcome.secondary` | `먼저 둘러보기` | `Explore as a guest` |

`먼저 둘러보기`는 가입 없이 `SCR-MAP`으로 이동한다.

### `SCR-ONB` · 사용 의도 step

| Key | KO | EN |
|---|---|---|
| `onboarding.intent.title` | `ONDO를 어떻게 사용하시나요?` | `How will you use ONDO?` |
| `onboarding.intent.body` | `추천과 인증 경로를 준비하는 데만 사용하며, 나중에 바꿀 수 있어요.` | `This only prepares recommendations and verification routes. You can change it later.` |
| `onboarding.intent.short` | `한국을 여행 중이에요` | `I’m visiting Korea` |
| `onboarding.intent.short_note` | `단기 여행자를 위한 식음료 발견` | `Food and drink discovery for a short stay` |
| `onboarding.intent.resident` | `한국에 거주하고 있어요` | `I live in Korea` |
| `onboarding.intent.resident_note` | `거주 지역과 장기 이용에 맞춘 경로` | `A route for residents and longer stays` |
| `onboarding.intent.local` | `한국 로컬이에요` | `I’m a local in Korea` |
| `onboarding.intent.local_note` | `내가 아는 식음료 신호와 Table 공유` | `Share local food signals and Tables` |
| `onboarding.intent.continue` | `ONDO 지도 열기` | `Open the ONDO map` |
| `onboarding.intent.skip` | `건너뛰고 둘러보기` | `Skip and explore` |

의도 선택은 국적·법적 지위·영구 계정 유형이 아니다.

### `SCR-ONB` · 선택 취향 step

| Key | KO | EN |
|---|---|---|
| `onboarding.preference.title` | `어떤 한 끼를 찾고 있나요?` | `What kind of meal are you looking for?` |
| `onboarding.preference.body` | `처음 보이는 필터에만 반영하며 계정 없이도 바꿀 수 있어요.` | `This only sets your starting filters. You can change it without an account.` |
| `onboarding.preference.classic` | `로컬의 익숙한 맛` | `Local classics` |
| `onboarding.preference.cafe` | `카페와 디저트` | `Cafés and dessert` |
| `onboarding.preference.late` | `늦은 시간의 한 끼` | `Late-night food` |
| `onboarding.preference.lively` | `활기찬 분위기` | `Lively` |
| `onboarding.preference.calm` | `조금 여유롭게` | `A little calmer` |
| `onboarding.preference.diet` | `식이 선택` | `Dietary preferences` |
| `onboarding.preference.continue` | `ONDO 지도 열기` | `Open the ONDO map` |
| `onboarding.preference.skip` | `기본 설정으로 계속` | `Continue with defaults` |

### Persona·계정 경계

| Key | KO | EN |
|---|---|---|
| `onboarding.boundary` | `선택은 추천 경로만 준비해요. 계정과 신원 확인은 필요한 순간에 따로 진행합니다.` | `This choice only prepares your route. Account creation and person checks happen separately when needed.` |
| `onboarding.account.optional` | `계정은 나중에 저장하거나 Table에 참여할 때 만들 수 있어요.` | `You can create an account later when you save a place or join a Table.` |
| `onboarding.account.failed` | `계정을 만들지 못해도 지도를 둘러볼 수 있어요.` | `You can still explore the map if account creation does not work.` |

단기 여행객·한국 로컬·장기체류 외국인 모두 finish/skip/failure 후 `SCR-MAP`에 도착한다. onboarding 자체는 CX, Residence Card, Passport, 19+, Payment KYC를 시작하지 않는다.

### 첫 가이드

| Key | KO | EN |
|---|---|---|
| `guide.ondo.title` | `색은 ONDO의 열기를 보여줘요.` | `Color shows the ONDO heat.` |
| `guide.ondo.body` | `숫자는 최근 로컬 식음료 신호를 바탕으로 한 0–100 점수예요. 기온이나 실시간 인파는 아닙니다.` | `The number is a 0–100 score based on recent local food and drink signals. It is not temperature or live crowding.` |
| `guide.ondo.primary` | `지도 보기` | `View the map` |
| `guide.ondo.legend` | `열기 기준 보기` | `See heat levels` |

---

## 4. Map, search, heat

### `SCR-MAP` · Header와 탐색

| Key | KO | EN |
|---|---|---|
| `map.tagline` | `로컬이 지금 먹는 곳` | `Where locals eat now` |
| `map.search.placeholder` | `음식, 분위기, 동네를 검색하세요` | `Search food, mood, or neighborhood` |
| `map.chip.nearby` | `지금 주변` | `Near me` |
| `map.chip.hot` | `뜨는 곳` | `Hot now` |
| `map.chip.quiet` | `조금 여유롭게` | `A little calmer` |
| `map.chip.open` | `영업 중` | `Open now` |
| `map.chip.after19` | `After 19` | `After 19` |
| `map.switch.list` | `목록 보기` | `View list` |
| `map.switch.map` | `지도 보기` | `View map` |
| `map.locate` | `내 위치로 이동` | `Go to my location` |
| `map.legend.open` | `ONDO 열기 기준` | `About ONDO heat` |

### Zoom별 heading

| Key | KO | EN |
|---|---|---|
| `map.nation.title` | `한국의 ONDO를 둘러보세요.` | `Explore ONDO across Korea.` |
| `map.city.title` | `{city}에서 지금 뜨는 동네` | `Neighborhoods heating up in {city}` |
| `map.neighborhood.title` | `{count}개의 식음료 신호` | `{count} food and drink signals` |
| `map.venue.title` | `이 근처 장소` | `Places around here` |
| `map.coverage.seed` | `먼저 채워지는 지역` | `Early coverage` |
| `map.coverage.growing` | `이 지역의 신호를 모으는 중이에요.` | `We’re growing signals in this area.` |

### ONDO 단계와 상태

| Key | KO | EN |
|---|---|---|
| `heat.low` | `차분함` | `Calm` |
| `heat.warming` | `온기 있음` | `Warming` |
| `heat.rising` | `떠오름` | `Rising` |
| `heat.hot` | `뜨거움` | `Hot` |
| `heat.peak` | `아주 뜨거움` | `Peak` |
| `heat.limited` | `신호가 더 필요해요` | `More signals needed` |
| `heat.signal_count` | `최근 신호 {count}개` | `{count} recent signals` |
| `heat.fresh.recent` | `방금 업데이트` | `Updated recently` |
| `heat.fresh.today` | `오늘 업데이트` | `Updated today` |
| `heat.fresh.aging` | `업데이트 시각 확인` | `Check update time` |
| `heat.fresh.stale` | `오래된 신호` | `Older signals` |
| `heat.confidence.high` | `근거 충분` | `Strong signal base` |
| `heat.confidence.medium` | `근거 보통` | `Moderate signal base` |
| `heat.confidence.low` | `표본이 적어요` | `Limited sample` |
| `heat.confidence.unknown` | `근거 확인 중` | `Signal base pending` |

다음 표현은 사용하지 않는다: `실시간 ONDO`, `현재 92명이 있음`, `대기 20분`, `안전 점수 92`, `평점 92점`. 실제 별도 source가 연결돼도 ONDO와 분리된 label을 쓴다.

### Map failure·permission

| Key | KO | EN |
|---|---|---|
| `map.error.tile_title` | `지도를 표시하지 못했어요.` | `The map could not be displayed.` |
| `map.error.tile_body` | `장소 목록은 계속 볼 수 있어요.` | `You can still browse the place list.` |
| `map.error.list_cta` | `목록으로 보기` | `Browse the list` |
| `map.error.retry` | `지도 다시 시도` | `Try the map again` |
| `map.location.denied_title` | `위치 권한이 꺼져 있어요.` | `Location access is off.` |
| `map.location.denied_body` | `도시나 동네를 검색해 계속 둘러볼 수 있어요.` | `Search a city or neighborhood to keep exploring.` |
| `map.empty.title` | `조건에 맞는 장소가 아직 없어요.` | `No places match these filters yet.` |
| `map.empty.reset` | `필터 초기화` | `Reset filters` |

`실제 지도를 불러오는 중` 같은 내부 구현 문구를 빈 캔버스 위에 장시간 고정하지 않는다. 초기 loading은 skeleton/marker placeholder로 800ms 이내 표시하고, timeout 후 목록 fallback을 연다.

---

## 5. Venue detail와 `가기 전 확인`

### `SCR-VENUE`

| Key | KO | EN |
|---|---|---|
| `venue.ondo.title` | `이 장소의 ONDO` | `ONDO at this place` |
| `venue.ondo.explain` | `최근 로컬 식음료 신호를 바탕으로 계산했어요.` | `Based on recent local food and drink signals.` |
| `venue.before.title` | `가기 전 확인` | `Before you go` |
| `venue.before.note` | `방문 전 장소의 최신 안내도 함께 확인해 주세요.` | `Please also check the venue’s latest information before visiting.` |
| `venue.fact.foreign_card.yes` | `해외 발급 카드 가능` | `Foreign-issued cards accepted` |
| `venue.fact.foreign_card.no` | `해외 발급 카드 이용 어려움` | `Foreign-issued cards may not be accepted` |
| `venue.fact.phone.no` | `한국 전화번호 불필요` | `Korean phone number not required` |
| `venue.fact.phone.yes` | `한국 전화번호 필요` | `Korean phone number required` |
| `venue.fact.reservation.conditional` | `예약 조건 확인 필요` | `Check reservation requirements` |
| `venue.fact.language.yes` | `외국어 응대 정보 있음` | `Language support information available` |
| `venue.fact.unknown` | `최근 정보 확인 중` | `Latest information pending` |
| `venue.save` | `저장` | `Save` |
| `venue.saved` | `저장됨` | `Saved` |
| `venue.directions` | `길찾기` | `Directions` |
| `venue.table` | `이 장소의 Table 보기` | `View Tables here` |

`해외카드 가능`은 결제 승인 보증이 아니다. source 시각과 조건을 상세에 표시한다.

---

## 6. Account gate

### 원 화면 위 Account gate dialog

| Key | KO | EN |
|---|---|---|
| `auth.gate.save_title` | `저장하려면 계정이 필요해요.` | `Create an account to save this place.` |
| `auth.gate.table_title` | `Table에 참여하려면 계정이 필요해요.` | `Create an account to join this Table.` |
| `auth.gate.message_title` | `메시지를 보내려면 계정이 필요해요.` | `Create an account to send a message.` |
| `auth.gate.checkout_title` | `결제를 이어가려면 계정이 필요해요.` | `Create an account to continue checkout.` |
| `auth.gate.body` | `계정을 만든 뒤 지금 하던 곳으로 돌아옵니다. 신원 확인은 아직 필요하지 않아요.` | `You’ll return here after creating an account. Person verification is not required yet.` |
| `auth.gate.primary` | `계정 만들기` | `Create account` |
| `auth.gate.secondary` | `계속 둘러보기` | `Keep exploring` |
| `auth.success` | `계정이 준비됐어요.` | `Your account is ready.` |
| `auth.cancelled` | `계정 만들기를 취소했어요.` | `Account creation was cancelled.` |
| `auth.failed` | `계정을 만들지 못했어요. 다시 시도하거나 계속 둘러볼 수 있어요.` | `The account could not be created. Try again or keep exploring.` |
| `auth.retry` | `계정 만들기 다시 시도` | `Try account creation again` |
| `auth.return` | `이전 화면으로 돌아가기` | `Return to previous screen` |

`로그인 완료`를 `신원 인증 완료`로 바꿔 쓰지 않는다.

---

## 7. Account & ID

### `SCR-ID` · 상태 카드

| Key | KO | EN |
|---|---|---|
| `id.title` | `계정과 확인` | `Account and checks` |
| `id.account.guest` | `계정 없이 둘러보는 중` | `Exploring without an account` |
| `id.account.pending` | `계정 준비 중` | `Preparing account` |
| `id.account.ready` | `계정 사용 가능` | `Account ready` |
| `id.account.failed` | `계정 준비 실패` | `Account setup failed` |
| `id.person.none` | `사람 확인 전` | `Person check not completed` |
| `id.person.pending` | `사람 확인 중` | `Person check in progress` |
| `id.person.simulated` | `사람 확인 완료 · 시뮬레이션` | `Person check complete · Simulated` |
| `id.person.sandbox` | `사람 확인 완료 · 샌드박스` | `Person check complete · Sandbox` |
| `id.person.verified` | `사람 확인 완료` | `Person check complete` |
| `id.age.none` | `19+ 확인 전` | `19+ not checked` |
| `id.age.eligible` | `19+ 확인됨` | `19+ confirmed` |
| `id.age.expired` | `19+ 확인 만료` | `19+ check expired` |
| `id.payment.none` | `결제용 KYC 전` | `Payment KYC not completed` |
| `id.payment.pending` | `결제용 KYC 확인 중` | `Payment KYC in progress` |
| `id.payment.verified` | `결제용 KYC 확인됨 · 시뮬레이션` | `Payment KYC complete · Simulated` |
| `id.payment.failed` | `결제용 KYC를 완료하지 못했어요.` | `Payment KYC could not be completed.` |
| `id.payment.expired` | `결제용 KYC 확인 만료` | `Payment KYC expired` |
| `id.payment.cancelled` | `결제용 KYC를 취소했어요. 결제는 진행되지 않았습니다.` | `Payment KYC was cancelled. Checkout did not continue.` |
| `id.payment.retry` | `결제용 KYC 다시 시도` | `Try Payment KYC again` |
| `id.payment.return` | `장소로 돌아가기` | `Return to venue` |
| `id.boundary` | `사람 확인은 신원 관련 자격만 확인하며, 안전·성품·전문성을 보증하지 않습니다.` | `A person check confirms specific identity-related eligibility. It does not guarantee safety, character, or expertise.` |

### Verification route

| Key | KO | EN |
|---|---|---|
| `id.route.korean` | `모바일 신분증으로 확인` | `Check with Mobile ID` |
| `id.route.korean_note` | `OmniOne CX 경로를 시뮬레이션합니다.` | `Simulates the OmniOne CX route.` |
| `id.route.residence` | `모바일 외국인등록증으로 확인` | `Check with Mobile Residence Card` |
| `id.route.residence_note` | `지원 여부를 먼저 확인합니다.` | `Availability is checked first.` |
| `id.route.passport` | `Passport verification provider로 확인` | `Check with a passport verification provider` |
| `id.route.passport_note` | `실제 업체 계약 전까지 중립 명칭을 사용합니다.` | `A provider-neutral label is used until a vendor is contracted.` |
| `id.route.start` | `확인 시작` | `Start check` |
| `id.route.simulation_notice` | `이 후보에서는 외부 사업자 대신 시뮬레이션 상태를 사용합니다.` | `This candidate uses simulated states instead of an external provider.` |

### Failure·unsupported

| Key | KO | EN |
|---|---|---|
| `id.error.cancelled` | `확인을 취소했어요. 원래 하던 작업으로 돌아갈 수 있어요.` | `The check was cancelled. You can return to what you were doing.` |
| `id.error.failed` | `확인을 완료하지 못했어요.` | `The check could not be completed.` |
| `id.error.expired` | `확인 세션이 만료됐어요. 다시 시작해 주세요.` | `The check session expired. Please start again.` |
| `id.residence.unavailable_title` | `이 확인 경로는 아직 연결되지 않았어요.` | `This verification route is not connected yet.` |
| `id.residence.unavailable_body` | `모바일 외국인등록증 지원을 확인 중입니다. 가능한 경우 Passport verification provider 경로를 선택할 수 있어요.` | `Mobile Residence Card support is being confirmed. You can choose a passport verification provider route when available.` |
| `id.retry` | `다시 시도` | `Try again` |
| `id.return` | `이전 작업으로 돌아가기` | `Return to previous task` |

미지원·연결 전 상태에 `API 키가 없어서 실패`라고 단정하지 않는다. 제공자·프로파일·계약이 확인되지 않은 상태일 수 있다.

---

## 8. After 19

### `SCR-A19` · 확인 gate

| Key | KO | EN |
|---|---|---|
| `after19.gate.title` | `After 19를 보려면 19+ 확인이 필요해요.` | `Confirm 19+ to view After 19.` |
| `after19.gate.body` | `생년월일 전체를 공개하지 않고 필요한 자격만 확인하는 경로를 사용합니다.` | `The route checks only the required eligibility without displaying your full date of birth.` |
| `after19.gate.primary` | `19+ 확인하기` | `Confirm 19+` |
| `after19.gate.secondary` | `기본 지도에 머물기` | `Stay on the main map` |
| `after19.gate.simulation` | `19+ 확인 시뮬레이션` | `19+ check simulation` |

`생년월일을 공개하지 않는다`는 UI 원칙이며, 실제 provider가 영지식 증명을 사용한다고 자동 주장하지 않는다.

### 자동 전환 banner

| Key | KO | EN |
|---|---|---|
| `after19.auto.banner` | `19+ 확인과 한국 시간 19:00 조건이 맞아 After 19를 열었어요.` | `After 19 opened because your 19+ check and the 19:00 Korea-time condition were met.` |
| `after19.auto.off` | `기본 지도로 돌아가기` | `Return to the main map` |
| `after19.auto.setting` | `조건이 맞으면 자동으로 열기` | `Open automatically when eligible` |
| `after19.auto.reason` | `19+ 확인, 한국 시간 19:00 이후, 자동 열기 설정이 모두 맞아 열렸어요.` | `Opened because your 19+ check, Korea time after 19:00, and auto-open setting all matched.` |
| `after19.auto.session_off` | `이 세션에서는 자동으로 다시 열지 않아요.` | `After 19 will not reopen automatically in this session.` |
| `after19.manual.on` | `After 19 켜짐` | `After 19 on` |
| `after19.manual.off` | `After 19 꺼짐` | `After 19 off` |
| `after19.expired` | `19+ 확인이 만료되어 기본 지도로 돌아왔어요.` | `Your 19+ check expired, so the main map is shown.` |
| `after19.non_alcohol` | `일반 심야 식당과 카페는 기본 지도에서도 볼 수 있어요.` | `Late-night restaurants and cafés remain available on the main map.` |

---

## 9. Pulse Table, chat, photo

### `SCR-TABLE`

| Key | KO | EN |
|---|---|---|
| `table.title` | `Pulse Table` | `Pulse Table` |
| `table.explain` | `같은 장소와 시간에 식사하고 싶은 사람들이 만나는 자리예요.` | `A table for people who want to eat at the same place and time.` |
| `table.seats` | `{count}자리 남음` | `{count} seats left` |
| `table.languages` | `사용 언어` | `Languages` |
| `table.price` | `예상 비용` | `Expected cost` |
| `table.alcohol.none` | `주류 조건 없음` | `No alcohol requirement` |
| `table.alcohol.over19` | `19+ 확인 필요` | `19+ check required` |
| `table.join` | `Table 참여하기` | `Join this Table` |
| `table.joining` | `참여 요청 중` | `Requesting a seat` |
| `table.joined` | `참여 중` | `Joined` |
| `table.join_failed` | `Table 참여를 완료하지 못했어요.` | `Could not join this Table.` |
| `table.retry` | `참여 다시 시도` | `Try joining again` |
| `table.full` | `자리가 모두 찼어요.` | `This Table is full.` |
| `table.closed` | `참여가 마감됐어요.` | `Joining is closed.` |
| `table.expired` | `이미 종료된 Table이에요.` | `This Table has already ended.` |
| `table.cancelled` | `이 Table은 취소됐어요.` | `This Table was cancelled.` |
| `table.alternative` | `근처 다른 Table 보기` | `View another Table nearby` |
| `table.person_note` | `사람 확인은 기본 자격 확인이며 만남의 안전을 보증하지 않습니다.` | `A person check confirms basic eligibility and does not guarantee meeting safety.` |

성별 비율, 소개팅, 국적 매칭을 기본 조건으로 쓰지 않는다. `외국인과 한국인 연결 보장` 대신 장소·시간·언어 기반 자발적 참여를 말한다.

### `SCR-CHAT`

| Key | KO | EN |
|---|---|---|
| `chat.locked` | `Table 참여가 확정되면 대화를 볼 수 있어요.` | `Chat opens after your Table participation is confirmed.` |
| `chat.placeholder` | `Table에 메시지 보내기` | `Message the Table` |
| `chat.send` | `보내기` | `Send` |
| `chat.pending` | `보내는 중` | `Sending` |
| `chat.failed` | `보내지 못했어요.` | `Could not send` |
| `chat.retry` | `다시 보내기` | `Try again` |
| `chat.leave` | `Table 나가기` | `Leave Table` |
| `chat.leave_confirm` | `Table을 나가면 이 대화를 더 이상 볼 수 없어요.` | `After leaving, you will no longer be able to view this chat.` |
| `chat.report` | `신고하기` | `Report` |
| `chat.report_confirm` | `이 대화를 신고할까요?` | `Report this chat?` |
| `chat.report_done` | `신고가 접수된 것으로 시뮬레이션했어요.` | `The report was recorded in this simulation.` |
| `chat.simulation` | `대화 시뮬레이션` | `Chat simulation` |

### Photo

| Key | KO | EN |
|---|---|---|
| `photo.choose` | `사진 선택` | `Choose photo` |
| `photo.preview` | `전송 전 미리보기` | `Preview before sending` |
| `photo.replace` | `다른 사진 선택` | `Choose another photo` |
| `photo.remove` | `사진 삭제` | `Remove photo` |
| `photo.uploading` | `사진 보내는 중` | `Sending photo` |
| `photo.failed` | `사진을 보내지 못했어요.` | `Could not send the photo.` |
| `photo.local_notice` | `사진은 이 시뮬레이션 화면에서만 보이며 서버에 업로드되거나 저장되지 않습니다.` | `The photo is visible only in this simulation and is not uploaded to or stored on a server.` |
| `photo.invalid` | `JPG, PNG, WebP 파일을 선택해 주세요.` | `Choose a JPG, PNG, or WebP file.` |
| `photo.too_large` | `10MB 이하 사진을 선택해 주세요.` | `Choose a photo under 10MB.` |

### `SCR-VENUE` · Local Signal / 첫 미션 sheet

| Key | KO | EN |
|---|---|---|
| `signal.title` | `방문 신호 남기기` | `Share a visit signal` |
| `signal.body` | `최근 방문과 도움이 될 식음료 정보를 남겨주세요. 신원 등급은 바뀌지 않아요.` | `Share a recent visit and useful food information. This does not change your identity status.` |
| `signal.photo` | `현장 사진 선택 · 선택 사항` | `Choose an on-site photo · Optional` |
| `signal.photo_truth` | `로컬 미리보기만 제공하며 서버에 업로드하지 않습니다.` | `Local preview only. The photo is not uploaded to a server.` |
| `signal.submit` | `신호 남기기` | `Submit signal` |
| `signal.submitting` | `신호를 남기는 중` | `Submitting signal` |
| `signal.success` | `방문 신호를 남겼어요. 해당 활동 이력만 업데이트됐어요.` | `Visit signal recorded. Only the relevant activity history was updated.` |
| `signal.cancel` | `작성 취소` | `Cancel draft` |
| `signal.failed` | `신호를 남기지 못했어요. 초안을 유지한 채 다시 시도할 수 있어요.` | `The signal could not be submitted. Your draft is kept so you can retry.` |
| `signal.duplicate` | `이미 반영된 방문이에요. 활동 이력은 다시 늘어나지 않아요.` | `This visit was already recorded. Activity history will not increase again.` |
| `signal.return` | `장소로 돌아가기` | `Return to venue` |

Local Signal 사진은 `FL-012` contribution evidence이고 Table의 chat image는 `FL-003` message attachment다. 서로의 완료 증거로 사용하지 않는다. `FL-012`는 Visit·Contribution의 해당 활동 이력만 바꾸며 Stamp·Meetup은 변경하지 않는다.

---

## 10. Feedback, reputation, stamps

### `SCR-FEEDBACK`

| Key | KO | EN |
|---|---|---|
| `feedback.title` | `오늘의 Table은 어땠나요?` | `How was today’s Table?` |
| `feedback.visit` | `이 장소에서 만났어요` | `We met at this place` |
| `feedback.helpful` | `정보가 도움이 됐어요` | `The information was helpful` |
| `feedback.respectful` | `약속과 기본 예절을 지켰어요` | `They kept the plan and were respectful` |
| `feedback.private_note` | `피드백은 분리된 활동 이력에 반영되며 종합 안전 점수를 만들지 않습니다.` | `Feedback updates separate activity histories and does not create an overall safety score.` |
| `feedback.submit` | `피드백 남기기` | `Submit feedback` |

### `SCR-MY`

| Key | KO | EN |
|---|---|---|
| `reputation.title` | `활동 이력` | `Activity history` |
| `reputation.identity` | `사람 확인` | `Person check` |
| `reputation.visit` | `확인된 방문` | `Confirmed visits` |
| `reputation.contribution` | `도움이 된 정보` | `Helpful contributions` |
| `reputation.meetup` | `완료한 Table` | `Completed Tables` |
| `stamp.title` | `방문 스탬프` | `Visit stamps` |
| `stamp.progress` | `10개 중 {count}개` | `{count} of 10` |
| `stamp.milestone` | `열 번째 방문을 남겼어요.` | `You recorded your tenth visit.` |
| `stamp.badge_offer` | `원하면 Labs에서 기념 badge 시뮬레이션을 볼 수 있어요.` | `If you choose, you can view a souvenir badge simulation in Labs.` |
| `stamp.badge_skip` | `지금은 건너뛰기` | `Not now` |

`신뢰도 상승`, `안전 점수`, `인증 등급 상승`을 사용하지 않는다.

---

## 11. Wallet, checkout, Labs

### `SCR-LABS` · 경계

| Key | KO | EN |
|---|---|---|
| `labs.title` | `Labs` | `Labs` |
| `labs.notice` | `기술 가설을 보여주는 실험 영역입니다. 실제 자산 이동이나 운영 서비스가 아닙니다.` | `This is an experimental area for technical hypotheses. It does not move real assets or represent a production service.` |
| `labs.acknowledge` | `이해하고 보기` | `I understand` |
| `labs.not_configured` | `연결 전` | `Not configured` |
| `labs.contract_only` | `계약 코드만` | `Contract only` |
| `labs.simulated` | `시뮬레이션` | `Simulated` |
| `labs.sandbox` | `샌드박스` | `Sandbox` |
| `labs.testnet` | `테스트넷` | `Testnet` |
| `labs.testnet_target` | `Target network: Sui Testnet · Simulated` | `Target network: Sui Testnet · Simulated` |

`테스트넷` 단독 실행 label은 공개 testnet transaction evidence가 있을 때만 사용한다. fixture가 testnet을 대상으로 한 화면이면 locale과 무관하게 exact truth copy `Target network: Sui Testnet · Simulated`를 사용한다.

### Signer와 asset

| Key | KO | EN |
|---|---|---|
| `labs.signer.title` | `Sui zkLogin signer` | `Sui zkLogin signer` |
| `labs.signer.body` | `Sui 주소와 트랜잭션 서명 경로를 보여줍니다. ONDO 계정, KYC 또는 멀티체인 지갑을 만들지는 않습니다.` | `Shows a Sui address and transaction-signing route. It does not create an ONDO account, KYC, or multichain wallet.` |
| `labs.assets.title` | `자산별 잔고` | `Balances by asset` |
| `labs.assets.estimate` | `예상 USD 환산액` | `Estimated USD value` |
| `labs.assets.quote` | `{time} 기준 환산` | `Estimated at {time}` |
| `labs.assets.note` | `USDC와 USDT는 서로 다른 자산으로 보관합니다.` | `USDC and USDT remain separate assets.` |
| `labs.ookrw.title` | `OOKRW test token` | `OOKRW test token` |
| `labs.ookrw.note` | `KRW 상환이나 1:1 가치를 보증하지 않습니다.` | `No KRW redemption or 1:1 value is guaranteed.` |

### Checkout

| Key | KO | EN |
|---|---|---|
| `checkout.title` | `결제 시뮬레이션` | `Checkout simulation` |
| `checkout.amount` | `장소 가격 · {price}원` | `Venue price · ₩{price}` |
| `checkout.settlement` | `읽기 전용 정산 가설 · OOKRW test token · 시뮬레이션` | `Read-only settlement hypothesis · OOKRW test token · Simulated` |
| `checkout.settlement_note` | `OOKRW는 실제 원화 결제, 상환 또는 1:1 가치를 보증하지 않습니다.` | `OOKRW does not guarantee real KRW payment, redemption, or 1:1 value.` |
| `checkout.kyc_required` | `이 흐름을 계속하려면 결제용 KYC 시뮬레이션이 필요해요.` | `A payment KYC simulation is required to continue this flow.` |
| `checkout.confirm` | `시뮬레이션 확인` | `Confirm simulation` |
| `checkout.approved` | `시뮬레이션이 완료됐어요. 실제 결제는 발생하지 않았습니다.` | `Simulation complete. No real payment occurred.` |
| `checkout.no_stamp` | `결제 결과만으로 방문 스탬프는 늘어나지 않아요.` | `A payment result alone does not add a visit stamp.` |
| `checkout.visit_required` | `현장 방문이 별도로 확인되면 방문 스탬프에 반영됩니다.` | `A visit stamp is added only after a separate on-site visit check.` |
| `checkout.declined` | `시뮬레이션을 완료하지 못했어요.` | `The simulation could not be completed.` |
| `checkout.cancel` | `취소` | `Cancel` |

### Bridge

| Key | KO | EN |
|---|---|---|
| `bridge.title` | `Bridge 가설 시뮬레이션` | `Bridge hypothesis simulation` |
| `bridge.warning` | `공식 Sui↔OmniOne bridge가 확인된 것이 아닙니다.` | `An official Sui↔OmniOne bridge has not been confirmed.` |
| `bridge.source_submitted` | `출발 체인 제출됨 · 시뮬레이션` | `Source submitted · Simulated` |
| `bridge.source_confirmed` | `출발 체인 확인됨 · 도착 전` | `Source confirmed · Destination pending` |
| `bridge.relaying` | `전달 단계 · 시뮬레이션` | `Relaying · Simulated` |
| `bridge.destination_confirmed` | `도착 단계 확인됨 · 시뮬레이션` | `Destination confirmed · Simulated` |
| `bridge.failed` | `시뮬레이션 실패` | `Simulation failed` |
| `bridge.cancelled` | `시뮬레이션을 취소했어요. 잔고는 바뀌지 않았습니다.` | `Simulation cancelled. Balances did not change.` |
| `bridge.mismatch` | `자산·체인·금액이 quote와 달라 진행하지 않았어요.` | `The asset, chain, or amount did not match the quote, so nothing was submitted.` |

### AMM

| Key | KO | EN |
|---|---|---|
| `amm.deferred` | `AMM 교환은 이번 후보 범위에 포함되지 않습니다.` | `AMM swaps are not included in this candidate.` |

AMM에는 실행 CTA·성공 toast·잔고 변화·fixture success를 만들지 않는다.

### NFT badge

| Key | KO | EN |
|---|---|---|
| `nft.title` | `기념 badge 시뮬레이션` | `Souvenir badge simulation` |
| `nft.body` | `열 번째 방문을 기념하는 선택 기능입니다. 신원, 국적, 19+ 또는 부정적 평판은 공개 metadata에 넣지 않습니다.` | `An optional souvenir for the tenth visit. Identity, nationality, 19+, and negative reputation are not included in public metadata.` |
| `nft.consent` | `공개 badge 시뮬레이션에 동의해요.` | `I consent to the public badge simulation.` |
| `nft.mint` | `시뮬레이션 시작` | `Start simulation` |
| `nft.complete` | `Badge 시뮬레이션 완료` | `Badge simulation complete` |

### Merchant trait · Contract-only

| Key | KO | EN |
|---|---|---|
| `trait.checked` | `특정 이용 조건 확인 · 계약 코드 기준` | `Specific access condition checked · Contract only` |
| `trait.stale` | `이 조건의 확인 시점이 지났어요.` | `This condition check is out of date.` |
| `trait.mismatch` | `장소·혜택·정책 정보가 일치하지 않아 적용하지 않았어요.` | `The venue, offer, or policy did not match, so the result was not applied.` |
| `trait.error` | `이용 조건을 확인하지 못했어요. 최신 장소 안내를 확인해 주세요.` | `This access condition could not be checked. Please review the venue’s latest information.` |
| `trait.retry` | `조건 다시 확인` | `Check again` |

Trait 결과는 특정 정책 fact만 나타내며 장소 전체의 입장·안전·결제를 보증하지 않는다.

---

## 12. 공개 프로필과 국적

### `SCR-ID` · 공개 프로필 sheet

| Key | KO | EN |
|---|---|---|
| `profile.from` | `From` | `From` |
| `profile.lives` | `Lives in` | `Lives in` |
| `profile.languages` | `Languages` | `Languages` |
| `profile.self_declared` | `직접 입력` | `Self-declared` |
| `profile.visibility` | `프로필에 공개` | `Show on profile` |
| `profile.privacy` | `KYC에서 확인된 국적을 자동으로 공개하지 않습니다.` | `Nationality checked during KYC is not published automatically.` |

`Republic of Korea · 모바일 신분증 확인`처럼 국적과 신원 경로를 하나의 verified 문장으로 결합하지 않는다. 법적 국적 증명이 실제 제품 요건이면 별도 동의·목적·보존정책·evidence가 필요하다.

---

## 13. `verified`, `live`, `KYC` 사용 규칙

| 개념 | 허용 문구 | 금지 문구 | 이유 |
|---|---|---|---|
| Account | `계정 사용 가능` | `인증된 사용자` | 로그인≠신원 확인 |
| Person fixture | `사람 확인 완료 · 시뮬레이션` | `신원 인증 완료` | 외부 효력 없음 |
| 19+ | `19+ 확인됨` | `성인 신원 완전 인증` | claim 범위 초과 |
| Host | `사람 확인 상태 보기` | `안전한 호스트`, `검증된 좋은 사람` | 안전·성품 보증 아님 |
| ONDO fixture | `최근 신호`, `오늘 업데이트` | `실시간`, `live` | live feed 증거 없음 |
| Access fact | `최근 확인`, `조건 확인 필요` | `입장 보장`, `결제 보장` | 사업자 최종 정책 의존 |
| Payment mock | `결제 시뮬레이션 완료` | `결제 완료` | 실제 자산 이동 없음 |
| Testnet | `테스트넷 트랜잭션` | `온체인 결제 완료` | 운영 settlement 아님 |
| Bridge fixture | `Bridge 가설 시뮬레이션` | `안전한 bridge`, `bridge 완료` | 공식 경로/감사 없음 |
| NFT fixture | `Badge 시뮬레이션` | `NFT 발급 완료` | 실제 mint 없음 |

`KYC`는 결제 규제/사업자 프로세스를 가리킬 때만 쓴다. 단순 account 또는 self-declared profile에 쓰지 않는다.

---

## 14. 기술 명칭 truth table

| 잘못된 문구 | 사용할 문구 |
|---|---|
| `OpenDID는 EAS를 사용합니다.` | `OpenDID와 EAS 결과를 각각 ONDO canonical evidence envelope로 매핑할 수 있습니다.` |
| `EAS 기반 OpenDID 인증` | `OpenDID adapter contract` 또는 실제 source에 맞는 `EAS adapter contract` |
| `OpenDID ZKP로 여권을 검증합니다.` | `여권 검증은 passport verification provider 영역이며, OpenDID는 발급된 credential의 선택적 증명 후보입니다.` |
| `CX 인증 성공 = ZKP 성공` | `CX session 결과와 ZKP proof 결과는 별도 상태입니다.` |
| `zkLogin으로 ONDO 계정과 멀티체인 지갑 생성` | `zkLogin으로 Sui 주소·signer 경로 연결` |
| `USDC/USDT 통합 USD 잔고` | `자산별 잔고와 예상 USD 환산액` |
| `OOKRW 원화 스테이블코인` | `OOKRW test token` |
| `Sui와 OmniOne 공식 bridge` | `Sui↔OmniOne bridge 가설 시뮬레이션` |
| `NFT에 신뢰 등급 기록` | `선택형 비민감 기념 badge` |

---

## 15. Date, time, number formatting

- KO: `8월 19일 오후 7:30`, 금액 `₩18,000`.
- EN: `Aug 19, 7:30 PM`, 금액 `₩18,000`.
- After 19 guard 문구에는 `한국 시간`/`Korea time`을 포함한다.
- 상대 시간(`방금`, `12분 전`)에는 accessible label로 절대 갱신 시각을 함께 제공한다.
- ONDO score는 온도 기호(`°C`)를 붙이지 않는다. 예: `92`, `ONDO 92`.
- confidence를 퍼센트로 꾸며 가짜 정밀도를 만들지 않는다.

---

## 16. Localization QA

- [ ] 모든 핵심 key에 KO/EN이 있음
- [ ] interpolation variable 개수와 이름이 KO/EN에서 같음
- [ ] 390×844에서 EN CTA가 줄바꿈으로 가려지지 않음
- [ ] 장소의 KO/EN 이름 순서가 일관됨
- [ ] `verified`, `live`, `KYC`, `payment`, `bridge`, `NFT` 금지 문구 0개
- [ ] fixture 화면의 truth label이 context 안에 있음
- [ ] 국적이 KYC 결과에서 공개 프로필로 자동 복사되지 않음
- [ ] `OpenDID uses EAS`, `zkLogin=multichain wallet` 문구 0개
- [ ] screen reader label도 시각 문구와 같은 truth를 말함
- [ ] 실패·취소·만료·미지원 상태마다 다음 CTA가 있음
