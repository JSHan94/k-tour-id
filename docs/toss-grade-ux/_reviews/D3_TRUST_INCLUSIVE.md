# D3 독립 감사 · 신뢰·상태·접근성·결제/ID

상태: `INDEPENDENT ADVERSARIAL REVIEW · 2026-09-04`

역할: D3는 기능을 줄이는 미니멀리즘이 아니라, 사용자가 **지금 무엇을 하며,
무엇이 실제로 일어났고, 실패하면 어디로 돌아가는지**를 모바일 한 화면에서
오해하지 않게 만드는 것을 우선한다. 구현 변경이나 다른 리뷰어와의 합의는 이
문서 범위가 아니다.

## 0. 감사 범위와 정본

다음 자료를 문서·코드·저장된 QA 화면 단위로 교차 확인했다.

- 정본: `docs/ondo-execution/01_PRD_9H.md`, `03_FLOW_CATALOG.md`,
  `04_STATE_MODEL.md`, `02_DECISION_LEDGER.md`
- 현재 B 정본: `docs/ondo-baljajwi/07_AS_BUILT.md`,
  `06_FINAL_REQUIREMENTS_AUDIT.md`, `04_EVIDENCE_MANIFEST.md`
- 시각·제품 계약: `docs/ondo-execution/07_VISUAL_INTERACTION_SPEC.md`,
  `docs/ONDO_UX_DESIGN_SPEC.md`, `k-tour-id-app/docs/ONDO_PRODUCT_WIDE_VISUAL_RESET_PLAN.md`,
  `k-tour-id-app/docs/ONDO_MOBILE_MEANING_GATE.md`
- 역사 기록: `docs/ondo-execution/13_AS_BUILT.md`. 이는 과거 A/Leaflet 설명이며
  현재 B를 이 상태로 되돌리는 근거로 사용하지 않는다.
- 사업계획 PDF: `TrackNo2_Hope&Woogieboogie_K-Tour ID_260531.pdf`의 텍스트를
  추출하고 13개 페이지를 모두 렌더해 시각적으로 확인했다.
- 현재 앱의 gate, Tables, wallet/checkout 및 저장된 320/390 모바일 QA 화면.

충돌 시 D-13~D-15 amendment를 우선한다.

- **D-13:** 일반 화면의 통화는 KRW가 주 단위이고 USD는 기준·시각이 있는 보조
  추정치다. OOKRW/USDC/USDT/network/settlement는 사용자가 연 상세 또는 Labs에만
  둔다. 외부 공급자가 없는데 입금·주문·가맹점 결제를 성공시켜서는 안 된다.
- **D-14:** 서울·부산·제주는 같은 `CityTemperatureBeacon` 렌더러와 Map/List
  구조를 쓴다. 제주는 `score=null`인 editorial-unscored 상태이지 인기도 숫자를
  만들어내는 예외 도시가 아니다.
- **D-15:** 현재 B 지도는 MapLibre다. 역사적 Leaflet/A 후보로 회귀하지 않는다.
  지도 로딩은 기존 atlas/cached map을 보존하고 약 800ms 뒤 진행 상태, 5초 안에
  전면 list fallback을 제공하며 reduced-motion에서는 `jumpTo`를 쓴다.

현재 B는 요구 기능 18/18과 다수 자동 검증을 갖고 있다. 따라서 이 문서는
“기능이 없다”는 감사가 아니다. 다만 자동화가 통과해도 금액·자격·완료 상태를
사람이 잘못 해석하면 Toss급 신뢰 UX라고 할 수 없다. 아래 화면 문제는 **저장된
QA 캡처와 현재 코드 기준 관찰**이며, 최신 후보에서는 acceptance criteria로 다시
확인해야 한다.

## 1. 독립 판정

### P0 · 오해가 곧 금전·신원 상태 오판이 되는 문제

1. Wallet에 `₩60,000`이 보이면서 같은 표면에 `Ready · no funds added`가 나타난다.
   비영(0) 잔액의 출처와 “funds가 없다”는 상태가 동시에 참일 수 없다. 외부
   입금이 없는 기기 내 여행 잔액이라면 그 한 가지 의미로 통일해야 한다.
2. Checkout·혜택·receipt가 실제 가맹점 주문이나 외부 결제로 읽힐 여지가 있다.
   “외부 주문·실제 돈 이동 없음”이 접힌 기술 상세에만 있으면 늦다. 확인 직전과
   결과 첫 화면에서 사용자 결과로 보여야 한다.
3. K-Tour ID 화면은 3단계에서 `added` 완료를 말하면서 4단계 presentation을 남긴다.
   credential 발급과 특정 목적의 predicate 제시는 서로 다른 성공 상태로 보여야
   한다.

### P1 · 핵심 행동을 막거나 잘못된 상태를 남기는 문제

1. 320px 온보딩에서 첫 지도 CTA가 첫 유효 viewport 아래로 밀린다.
2. Table 상세의 sticky CTA가 host note를 가리고, Local Signal의 sticky header가
   제목을 침범하는 저장 캡처가 있다.
3. Funding source sheet에서 미연결 bank/card·Apple Pay/digital-dollar route를 고른
   뒤 닫으면, 쓸 수 없는 수단이 활성 결제 출처처럼 남을 위험이 있다. sheet-local
   draft와 명시적 commit이 필요하다.
4. Table 목록은 상세 진입 전 계획에 필요한 여섯 사실 중 일부만 보여 준다.
5. 장소 상세에서 Directions, Save, After19, Table, benefit가 동급 CTA로 경쟁한다.
   사용자가 선택한 intent 하나가 그 화면의 primary여야 한다.

### P2 · 완성도와 학습 비용 문제

- My Korea가 기록 타임라인보다 관리 카드 묶음처럼 보이고, eyebrow·기술 설명이
  반복된다.
- 일부 상태가 색·점·아이콘만으로 표현되어 이름과 결과를 알기 어렵다.
- 실패·복원·삭제의 범위가 CTA 문구와 확인 화면에서 항상 동일하게 보이지 않는다.

## 2. 전역 신뢰·상태 계약

### 2.1 하나의 권장 연결 여정

```text
Guest Map
  → Place
  → 사용자 intent 선택(Directions / Save / Table / ONDO benefit / Local Signal / After19)
  → 해당 intent에 부족한 gate만 한 줄 readiness로 표시
  → 필요할 때만 하나의 JIT gate coordinator
  → 원 CTA를 정확히 한 번 재개
  → 결과 객체(무엇이 변했는지 / 변하지 않았는지 / 다음 행동)
  → My Korea activity
  → 같은 place/table로 복귀
```

결제 단일 여정은 다음과 같다.

```text
Place의 ONDO benefit
  → 혜택 반영 KRW 금액(+기준 있는 USD 보조값)
  → funding source sheet의 임시 선택
      ├─ 기기 내 여행 잔액: 계속
      └─ 은행 / 카드·Apple Pay / digital dollar: 아직 연결되지 않음
         → 이전 사용 가능한 수단 보존 + 다시 선택 / 잔액으로 계속
  → Account → Payment KYC → 필요 시 별도 K-Tour credential presentation
  → “여행 잔액 ₩19,000 사용” 최종 확인
  → 기기 내 기록 결과(외부 주문·실제 돈 이동 없음)
  → 영수증 상세에는 OOKRW/USDC/USDT·network 기술 정보
  → 잔액 복원(실제 환불 아님) 확인·완료·되돌리기
  → 원 Place
```

### 2.2 Gate를 합치지 않는 법

| 상태 | 사용자가 이해할 의미 | 열리는 것 | 절대 암시하지 않는 것 |
|---|---|---|---|
| Guest | 바로 둘러보기 | 지도·검색·상세·길찾기 | 계정·신원 |
| Account | 앱 안에 저장할 공간 | Save·질문·Table 요청 | Person·19+·Payment KYC |
| Person | 지원 경로가 한 사람임을 확인 | Local Signal·Table host 등 | 나이·결제·국적 |
| 19+ | 성인 조건 하나 확인 | After19·주류 맥락 | Person·결제 KYC |
| Payment KYC | 해당 결제 정책 요건 확인 | checkout 재개 | Person·19+·실제 돈 이동 |
| K-Tour credential | 선택한 service claim 발급 | 보관 | 모든 서비스 자격 |
| Presentation | 그 claim의 최소 predicate 제출 | 원 서비스 행동 | 원본 신분·전체 credential 공개 |
| Reputation | 분리된 활동 증거 | 해당 축 변화 | 안전도·신용·신원 점수 |

온보딩의 “방문 여행객/한국 로컬/한국 거주”는 설명·추천 순서를 바꾸는 preference다.
국적·체류 자격·법적 신원 상태를 추론하거나 영구 분류해서는 안 된다.

### 2.3 모바일 화면 문법

- 첫 viewport에는 **맥락 1개, 결정 1개, primary CTA 1개**만 둔다.
- 아이콘은 탐색·닫기·저장 상태처럼 회복 가능한 행동을 압축할 수 있다. 동의,
  결제, 삭제, 신고, 차단, 복원, 개인정보 공개 범위는 텍스트 동사를 유지한다.
- 정상 화면에서는 provider, VC, OpenDID, OOKRW, USDC, USDT, network를 설명하지
  않는다. 사용자가 연 상세와 실제 실패·복구 지점에서는 정확한 사실을 숨기지
  않는다.
- 모든 선택은 `idle → pending → success | failure | cancel`로 보인다. pending 중
  중복 CTA를 막고, failure는 같은 맥락의 retry, cancel은 정확한 직전 공개 맥락을
  복구한다.
- touch target은 최소 44×44 CSS px, body text는 16px 상당, 200% 확대와 320px 폭,
  390×844, 430px, 짧은 landscape에서 가림·이중 스크롤이 없어야 한다.
- focus trap, Escape/닫기, 열었던 trigger로 focus 복귀, 논리적 DOM/tab 순서,
  `aria-live` 상태, non-color cue를 모든 sheet/gate/result에 적용한다.

## FL-001 · Guest Discover

- **현재 문제:** 현재 B의 MapLibre·세 도시 공통 온도 beacon 방향은 맞다. 그러나
  320px에서는 header/search/chips/bottom nav가 지도 면적을 과하게 줄이고, 온보딩
  CTA가 아래로 밀릴 수 있다. 온도 근거나 공식 기록 수를 앞세우면 발견보다 제품
  설명이 먼저 된다.
- **목표 경험:** 앱을 열면 이미 그 자리의 한국 지도가 보이고 서울·부산·제주가
  같은 시각 문법으로 읽힌다. 사용자는 로그인이나 데이터 설명 없이 도시→장소를
  한 손으로 연다.
- **새 모바일 시퀀스:** cached atlas/MapLibre 표시 → 짧은 headline overlay → 동일
  `CityTemperatureBeacon` 3개 → 도시 tap → `easeTo`/`flyTo`로 실제 지도 안에서
  확대 → 검색·필터는 확대가 안정된 뒤 등장 → marker tap → place peek → detail 또는
  directions. `prefers-reduced-motion`은 동일 상태로 즉시 `jumpTo`한다.
- **정보 제거·접기·유지:** 제거: hero의 record count·방법론·중복 도시 CTA.
  접기: heat score 산식·freshness/confidence·LOCALDATA/VISITKOREA provenance.
  유지: 도시 이름, 제주 editorial-unscored 구분, 현 선택, 지도 attribution, 검색·필터
  결과 수 변화.
- **상태·실패·복귀:** 800ms 이후 작은 loading status, 5초 안에 list foreground,
  재시도 중 기존 지도/검색/필터/선택 장소 보존. offline/cache/permission denied는
  서로 다른 회복 CTA를 주며 `AbortError`는 사용자 오류로 띄우지 않는다. 뒤로 가기는
  정확한 camera/filter/place history를 복원한다.
- **접근성·신뢰:** marker와 list item은 동일 장소를 가리키고 accessible name에
  도시/장소/온도 상태를 제공한다. beacon 크기나 색만으로 점수를 전달하지 않는다.
  지도 gesture 외 keyboard/list 대안, 44px marker hit area, zoom control label,
  attribution 접근을 보장한다.
- **Acceptance criteria:** Guest로 320/390/430에서 첫 유효 viewport 안에 지도와
  도시 선택이 보인다. 3개 도시가 동일 renderer/shell/legend/list position을 쓰고
  제주는 숫자 없이 limited/editorial로 읽힌다. city entry가 search autofocus나
  keyboard pop-up을 일으키지 않는다. slow/offline/retry/history/reduced-motion에서
  선택·필터·URL 맥락이 사라지지 않는다.
- **PRD 보존 항목:** `REQ-007`, `REQ-013`, `REQ-017`~`REQ-019`; Guest browse,
  Map/List parity, 검색·필터, 공식/편집 source truth, external directions, D-14/D-15,
  MapLibre와 loading fallback을 모두 유지한다.

## FL-002 · Age proof → exact After19 venue

- **현재 문제:** After19가 Person·K-Tour ID·Account와 한 덩어리처럼 보이면 불필요한
  신원 확인으로 느껴진다. 현재 화면의 의미가 없는 점/체크 아이콘은 성공 상태를
  색과 장식에만 의존하게 만든다.
- **목표 경험:** 사용자는 선택한 장소에서 “19+만 확인하면 야간 정보가 열린다”는
  한 가지 거래를 이해하고, 생년월일이나 여권 원문을 앱에 주지 않은 채 같은 장소로
  돌아온다.
- **새 모바일 시퀀스:** locked After19 peek → `이 장소의 19+ 정보 열기` → 확인하는
  predicate/요청자/목적 3행 → age proof → 성공 `19+ 확인됨 · 만료 시각` → 같은
  `venueId` detail을 After19 layer로 확장. Account나 Person 화면을 끼우지 않는다.
- **정보 제거·접기·유지:** 제거: provider marketing, `ON-DEVICE` eyebrow, 내부 단계명,
  장식 status dots. 접기: issuer/verification method/retention. 유지: 정확한 장소,
  `19+` 조건, 공유하지 않는 정보, 만료, 취소·재시도, 일반 장소 계속 보기.
- **상태·실패·복귀:** pending 중 CTA 1회; 거절/timeout/만료는 같은 locked venue에서
  retry 또는 일반 정보 보기를 준다. 취소는 `OPEN_AFTER19`를 소비하지 않고 base
  place로, success는 one-shot으로 같은 venue에 복귀한다. venue가 없어졌을 때만 같은
  지역 일반 목록으로 안전 복귀한다.
- **접근성·신뢰:** stepper는 숫자뿐 아니라 현재 단계명을 screen reader에 알리고,
  success/failure를 색 외 아이콘+텍스트로 제공한다. 만료 시간은 locale/KST를
  명시하고 zoom 200%에서도 CTA와 cancel이 함께 보인다.
- **Acceptance criteria:** Account 없이 manual age flow가 시작·완료된다. 성공해도
  Account/Person/Payment KYC 상태가 바뀌지 않는다. 원본 DOB/passport/credential이
  URL·storage·returnTo에 없다. EN/KO/JA에서 exact venue, 목적, 19+, 만료, retry가
  동등하게 전달된다.
- **PRD 보존 항목:** `REQ-005`, `REQ-012`, `AGE-*`, `OPEN_AFTER19`, 15분 one-shot
  return contract, 최소 predicate 소비, 일반 탐색 fallback을 유지한다.

## FL-003 · Table → Image Chat → Feedback

- **현재 문제:** Table 목록의 카드가 사진과 일부 숫자는 보여도 시간·좌석·언어·비용·
  주류·host 조건의 여섯 계획 사실을 진입 전에 모두 비교하기 어렵다. 상세의 sticky
  join CTA가 host note를 덮는 캡처가 있으며, chat 안전 행동이 세 개의 동급 대형
  카드로 대화를 압도한다.
- **목표 경험:** 장소에서 모임을 발견하고 “누구와 무엇을 언제 어떤 조건으로” 하는지
  한눈에 판단한 뒤, 필요한 gate만 거쳐 같은 Table로 복귀하고, 대화·체크인·피드백의
  각 증거가 분리된 상태로 남는다.
- **새 모바일 시퀀스:** place의 Table preview → compact list card(사진+핵심 6 facts) →
  detail → Join → Account → 조건부 Person/19+ → confirm → chat unlock → image
  preview/replace/remove/send → check-in → completed → mutual feedback → 해당 reputation
  axes만 갱신.
- **정보 제거·접기·유지:** 제거: 목록의 내부 state ID/provider 설명. 접기: 전체 host
  소개, 정책·증거 세부, 운영 내역. 유지: 여섯 planning facts, availability와 내
  membership, language, alcohol/age condition, 가격, report/block/leave의 명시적 동사,
  image 전송 상태.
- **상태·실패·복귀:** availability, membership, failure reason, chat access를 분리한다.
  sold out/closed/organizer cancel/policy failure는 각각 다른 recovery를 준다. gate cancel은
  같은 Table; send failure는 원 preview와 retry; leave/block/report는 확인 후 안전한
  Table 목록으로 간다. direct chat URL의 nonmember는 detail로 돌린다.
- **접근성·신뢰:** sticky CTA 아래 실제 safe-area와 content padding을 확보해 note를
  가리지 않는다. seat 변화는 `aria-live`, image alt/preview/remove label, message status,
  keyboard send, report/block confirmation, 44px controls를 보장한다. 국적은 ID에서
  가져오지 않고 선택 공개 프로필만 보인다.
- **Acceptance criteria:** 320×568과 landscape에서 마지막 field·host note·CTA가 겹치지
  않는다. 여섯 facts가 list와 detail에서 동일 값을 가진다. nonmember/closed/failed/
  organizer-cancel/image-fail 경로가 chat unlock이나 reputation mutation을 만들지 않는다.
  checked-in+completed+feedback evidence가 있을 때만 Meetup 관련 축이 변한다.
- **PRD 보존 항목:** `REQ-008`~`REQ-010`, `REQ-015`; `JOIN_TABLE`/`OPEN_CHAT`, Table
  state 축 분리, image chat lifecycle, check-in, feedback, report/block/leave, 주류 Table의
  조건부 age gate를 모두 유지한다.

## FL-004 · Checkout/Labs → Stamp

- **현재 문제:** “결제/영수증/혜택 사용” 언어가 실제 가맹점 주문·돈 이동처럼
  들리지만 현재 가능한 것은 기기 내 여행 잔액 기록이다. 이 사실이 접힌 상세에만
  있으면 확인 후에야 오해를 바로잡는다. 결제 성공과 방문 stamp가 시각적으로 가까우면
  자동 적립처럼 보인다.
- **목표 경험:** 사용자는 장소·혜택·최종 KRW 차감액·사용할 여행 잔액을 확인하고,
  외부 주문이나 실제 돈 이동은 없다는 결과를 행동 직전/직후에 안다. 방문 evidence는
  별도 행동이며 그 뒤에만 stamp가 오른다.
- **새 모바일 시퀀스:** place benefit → 가격 breakdown(원가/혜택/사용액 KRW,
  필요 시 기준 있는 USD) → funding source → Account → Payment KYC → `여행 잔액
  ₩19,000 사용` → pending → 기기 내 사용 기록 → `외부 주문 없음 · 실제 돈 이동 없음`
  → 별도 `방문 확인` → unique evidence → stamp 9→10 → opt-in Labs badge.
- **정보 제거·접기·유지:** 제거: 정상 checkout의 `simulated/test/preview`, OOKRW,
  chain/network, settlement architecture. 접기: technical receipt, OOKRW hypothesis,
  USD basis/time, fixture/provider details. 유지: 장소, benefit 조건, KRW 각 금액,
  사용 후 잔액, 무엇이 실제로 변하지 않았는지, cancel/decline/retry, 방문과 결제의 분리.
- **상태·실패·복귀:** source selection은 sheet-local draft다. 미연결 bank/card·Apple Pay/
  digital dollar는 concise unavailable→이전 사용 가능한 출처 유지→다시 선택/잔액으로
  계속. pending 중 잔액 선차감 금지. decline/cancel/timeout은 잔액·receipt·stamp 불변.
  성공 기록 뒤 visit failure도 stamp 불변이며 exact place/checkout으로 복귀한다.
- **접근성·신뢰:** 최종 CTA에 동사+금액+출처를 포함한다. price breakdown은 screen
  reader 읽기 순서와 통화 단위를 명시하며 숫자 tabular alignment를 쓴다. 상태 변화는
  live region으로 한 번만 알리고 receipt/refund/restore 버튼은 scope를 텍스트로 쓴다.
- **Acceptance criteria:** 일반 checkout/receipt 첫 화면에서 OOKRW/USDC/USDT/network가
  0회 노출되고 KRW가 primary, USD는 estimate/basis/time이 있을 때만 secondary다.
  확인 직전과 결과에 실제 외부 주문·돈 이동이 없다는 consequence가 보인다. 결제
  결과만으로 stamp/reputation이 변하지 않으며 unique visit 뒤에만 9→10이 된다.
- **PRD 보존 항목:** `REQ-006`, `REQ-011`, `REQ-016`; Account/Payment KYC, cancel/
  decline/retry/receipt, KRW/OOKRW separation, unique visit, stamp milestone, opt-in Labs
  mint를 삭제하지 않고 D-13 표현 계층으로 재배치한다.

## FL-005 · Korean CX

- **현재 문제:** Korean Mobile ID가 온보딩의 “한국 로컬” 선택 직후 자동으로 열리거나
  K-Tour ID 자체로 표현되면 preference가 법적 신원과 합쳐진다. `OmniOne CX`, callback,
  on-device 같은 구현어는 사용자의 현재 목적을 가린다.
- **목표 경험:** Person이 필요한 Local Signal/Table 행동에서만 “한 사람 확인”을
  요청하고, 사용자가 Korean Mobile ID를 선택하면 최소 동의 후 그 행동으로 돌아온다.
  K-Tour credential 발급/제시는 별도 선택 또는 후속 gate다.
- **새 모바일 시퀀스:** gated action → `이 행동에는 한 사람 확인이 필요해요` → 방법
  선택에서 Korean Mobile ID 추천 → requester/purpose/evidence 동의 → 외부 provider
  handoff → signed callback validation → Person success → exact Local Signal/Table CTA.
- **정보 제거·접기·유지:** 제거: 정상 단계의 provider brand 반복, VC/OpenDID 구조,
  `ON-DEVICE` eyebrow. 접기: callback/issuer/retention/technical evidence. 유지: 원 행동,
  요청 이유, 공유 predicate, 취소, 만료, retry, alternative method, success expiry.
- **상태·실패·복귀:** provider 미연결은 성공 fixture로 위장하지 않고 unavailable→다른
  방법/나중에/원 행동 복귀. invalid callback, timeout, denied, expired를 구분하며 같은
  미소비 returnTo를 retry한다. cancel은 Account/Guest map을 계속 사용할 수 있게 한다.
- **접근성·신뢰:** method radio는 label+설명+selected state를 프로그램적으로 연결한다.
  새 앱/브라우저 이동 전 경고와 돌아올 위치를 알리고 focus가 원 CTA로 돌아온다.
  stepper는 current/complete를 색 외 텍스트로 제공한다.
- **Acceptance criteria:** Korean onboarding 완료만으로 CX가 호출되지 않는다. CX success는
  Person만 올리고 Age/Payment KYC/Account/K-Tour credential을 올리지 않는다. raw ID,
  DOB, nationality, callback payload가 URL/storage/returnTo에 없다. failure/cancel/expiry가
  원 place/table draft를 보존한다.
- **PRD 보존 항목:** `REQ-001`, `REQ-005`, `PER-*`, `FX-PER-CX-*`, provider adapter,
  consent, callback validation, gated `SUBMIT_LOCAL_SIGNAL`/`JOIN_TABLE` exact return을
  유지한다.

## FL-006 · Residence Card

- **현재 문제:** “한국 거주” preference가 곧 Residence Card 보유로 읽히거나, 미지원
  경로에서 사용자를 국적/체류 자격으로 분류하면 차별적이고 사실도 아니다. 지원되지
  않는데 generic error만 주면 사용 가능한 passport 경로를 찾기 어렵다.
- **목표 경험:** Person 확인이 필요한 순간 사용자가 Residence Card를 자발적으로
  고르고, 지원 여부를 즉시 확인한 뒤 지원이면 계속하고 미지원이면 중립적인 대체
  경로를 선택한다.
- **새 모바일 시퀀스:** gated action → identity method sheet → Residence Card 선택 →
  support preflight → supported: consent→provider→Person→exact return / unavailable:
  `현재 연결되지 않았어요`→Passport eKYC/다른 방법/나중에 → same action context.
- **정보 제거·접기·유지:** 제거: `foreigner`, 추정 국적, provider architecture, 불필요한
  residence 설명. 접기: document field list, issuer/retention. 유지: method명, 지원 여부,
  요청 purpose, 대체 방법, 취소/재시도, 원 행동.
- **상태·실패·복귀:** unsupported와 outage와 user denial을 분리한다. 어떤 실패도 Account,
  map, draft를 지우지 않는다. retry는 같은 route, alternate은 같은 returnTo의 Person
  gate만 교체하며, cancel은 직전 public context로 복귀한다.
- **접근성·신뢰:** 지원 불가를 빨간 오류만으로 전달하지 않고 다음 선택을 함께 준다.
  document capture가 실제 연결될 때 camera permission 전 목적을 설명하고, keyboard/
  screen reader 경로와 수동 대안을 제공한다.
- **Acceptance criteria:** persona/language/IP로 Residence route를 자동 실행하거나 국적을
  기록하지 않는다. unsupported fixture가 Person success를 만들지 않는다. alternate
  passport 경로가 원 CTA/venue/table을 잃지 않으며, raw card data가 browser persistence에
  없다.
- **PRD 보존 항목:** `REQ-002`, `REQ-005`, supported/unavailable fixtures, neutral alternate,
  Person gate와 exact returnTo를 유지한다.

## FL-007 · Short-term onboarding

- **현재 문제:** 320px 저장 화면에서 큰 브랜드 이미지와 설명 때문에 `Open Korea map`
  CTA가 첫 유효 viewport 아래에 있다. “방문 여행객” 선택이 passport eKYC나 wallet을
  선행 절차처럼 보이게 할 위험이 있다.
- **목표 경험:** 단기 방문자는 10초 안에 언어·최소 취향만 고르고 Guest map을 먼저
  본다. ID/wallet은 실제 Save/Table/benefit/After19 intent가 생길 때 맥락적으로 제안된다.
- **새 모바일 시퀀스:** language → optional taste chips(기본값/skip) → `한국 지도 열기`
  → Guest map. 첫 place intent 시 필요한 기능만 readiness로 보여 주고, K-Tour ID는
  목적이 있는 경우에만 soft recommendation/JIT로 시작한다.
- **정보 제거·접기·유지:** 제거: 장기/단기 요구사항 설명, eKYC/provider/지갑 구조,
  “optional” 반복, 큰 브랜드 반복. 접기: 개인정보와 preference 저장 범위. 유지: 언어,
  취향·식이 선택, skip, 언제든 변경 가능, primary map CTA.
- **상태·실패·복귀:** preference save failure는 기본값으로 map을 연 뒤 nonblocking
  recovery를 준다. skip/success/failure 모두 Guest map이다. onboarding retry 상태가
  정본상 N/A이면 가짜 retry UI를 만들지 않는다.
- **접근성·신뢰:** 320×568에서 primary CTA가 스크롤 없이 보이고, chip은 selected
  상태와 그룹 label을 가지며 44px 이상이다. language 변경 즉시 전체 onboarding의
  EN/KO/JA가 바뀌며, 이미지가 CTA보다 먼저 focus되지 않는다.
- **Acceptance criteria:** 세 결과(success/skip/failure)가 map으로 끝나고 CX/Residence/
  passport KYC를 호출하지 않는다. first viewport에 가치·선택·CTA가 들어온다. 취향이
  법적 persona나 eligibility를 바꾸지 않으며 Settings에서 재설정 가능하다.
- **PRD 보존 항목:** `REQ-003`, `REQ-005`, `REQ-018`; 언어·관심·식이, Guest map, skip,
  failure default, 후속 passport eKYC 선택지는 유지한다.

## FL-008 · Korean local onboarding

- **현재 문제:** 세 persona를 법적 구획처럼 앞세우면 한국 로컬 선택이 Account/CX
  완료로 오인된다. 음식 취향과 신원 경로를 같은 단계에서 묻는 것은 과도한 선행
  부담이다.
- **목표 경험:** “한국에 익숙한 추천” 정도만 바꾸고 Guest map으로 바로 간다. Mobile
  ID는 Person이 필요한 실제 행동에서 추천 순서만 높인다.
- **새 모바일 시퀀스:** language → `한국에 익숙한 추천` 선택 가능 → taste/diet optional
  → Guest map → Save를 누르면 Account, Person 필요 행동을 누르면 Mobile ID 우선 method
  sheet. 계정 생성은 사용자가 명시적으로 선택할 때만 온보딩 뒤 이어진다.
- **정보 제거·접기·유지:** 제거: “한국인=Mobile ID 완료” 암시, CX 브랜드, 체류 설명.
  접기: recommendation personalization detail. 유지: 선택 취소/변경, Guest 진입, optional
  Account, JIT identity method.
- **상태·실패·복귀:** recommendation 저장이나 선택 Account 실패가 map 진입을 막지
  않는다. Account cancel은 Guest map, 후속 Person cancel은 같은 gated action으로
  돌아온다. persona 선택은 gate state를 mutate하지 않는다.
- **접근성·신뢰:** persona 카드에 신분이 아니라 추천 방식임을 accessible description으로
  명확히 한다. 선택을 강제하지 않고 “건너뛰기”가 primary와 동등한 keyboard 경로를
  가진다.
- **Acceptance criteria:** onboarding success 후 `ACC-GUEST`, `PER-UNVERIFIED`,
  `AGE-*`, `PKY-*`가 독립 상태를 유지할 수 있다. CX 자동 호출 0회, failure에서도
  map 진입, Settings에서 preference 변경 가능.
- **PRD 보존 항목:** `REQ-001`, `REQ-005`, `REQ-018`; Korean local branch, optional
  Account, Mobile ID JIT path, Guest fallback을 유지한다.

## FL-009 · Resident onboarding

- **현재 문제:** “한국 거주” 선택만으로 Residence Card, 국적, 장기 체류 status를
  추론하기 쉽다. 사용자에게는 추천 맥락인데 내부 요구사항 분기처럼 보일 수 있다.
- **목표 경험:** 거주자에게 반복 방문·동네·언어 중심 추천을 제공하되 신분증 보유나
  결제 권한을 가정하지 않는다. 필요한 행동에서 Residence Card를 추천하되 Passport/
  Mobile ID 대안도 함께 둔다.
- **새 모바일 시퀀스:** language → `한국에 머무는 중` 추천 preference → taste/diet →
  Guest/optional Account map → later Person intent → Residence Card가 먼저지만 미선택
  가능한 method sheet → consent/provider → exact return.
- **정보 제거·접기·유지:** 제거: 외국인 라벨, 체류기간 추정, 카드 보유 전제, provider
  설명. 접기: 추천 순서 결정과 preference 저장 범위. 유지: self-selection, skip,
  alternate methods, Guest map, Settings 변경.
- **상태·실패·복귀:** preference/Account failure는 map을 막지 않는다. Residence
  unsupported는 passport alternate과 나중에를 제공하고 Person을 올리지 않는다.
  route를 바꿔도 원 venue/table/draft와 returnTo는 유지한다.
- **접근성·신뢰:** 카드는 “신원 분류”가 아닌 “추천 설정”으로 읽혀야 한다. 쉬운 언어,
  EN/KO/JA 동일 의미, 44px, screen reader selected state, no auto-advance를 적용한다.
- **Acceptance criteria:** resident preference가 citizenship/residency legal claim이나
  Payment KYC를 생성하지 않는다. Residence provider 미연결에서도 탐색·저장된 preference를
  잃지 않고, alternate/cancel 후 정확한 맥락으로 돌아온다.
- **PRD 보존 항목:** `REQ-002`, `REQ-005`, `REQ-018`; resident branch, Residence Card
  route, support check/alternate, optional Account, Guest map을 유지한다.

## FL-010 · Account gate

- **현재 문제:** 여러 modal이 연속으로 뜨고 각 화면이 `local/on-device/provider`를
  반복하면 사용자는 원래 Save/Table/checkout 행동을 잊는다. Account가 Person·19+·
  Payment KYC를 모두 열어 주는 것처럼 보이기도 쉽다.
- **목표 경험:** 원 행동과 부족한 조건을 한 화면에서 보고 Account만 생성한 뒤,
  필요한 다음 gate가 있으면 같은 coordinator 안에서 계속해 원 CTA가 정확히 한 번
  실행된다.
- **새 모바일 시퀀스:** CTA tap → compact readiness sheet(`Roba 저장`, 필요한 단계
  Account) → create account → queue head 제거 → 다음 미충족 gate 또는 원 CTA → result.
  이미 충족된 gate는 보여 주지 않고, K-Tour credential은 Account와 합치지 않는다.
- **정보 제거·접기·유지:** 제거: “minimum check/this tab only”, internal state IDs,
  구현 경계 반복, 같은 목적 설명 중복. 접기: local persistence/technical account detail.
  유지: 대상 place/table/action, 필요한 현재 gate, 다음 단계 수, cancel, data scope,
  exact-return promise.
- **상태·실패·복귀:** v3 allowlist와 canonical order를 재계산한다. retry는 같은 unconsumed
  token, cancel은 gate를 지우고 직전 public context, duplicate/forged/expired/invalid는
  mutation 없이 safe map. final mutation 직전 full required gate plan을 다시 검증하고
  token을 one-shot 소비한다.
- **접근성·신뢰:** sheet focus trap/Escape/close, opener focus return, current step name,
  `aria-live` pending/result, no layout jump. 320px short viewport에서 header/body/footer를
  각각 고정하지 말고 단일 scroll container와 safe-area footer를 쓴다.
- **Acceptance criteria:** Save는 Account만, Local Signal은 Account→Person, alcohol
  Table은 Account→Person→Age, checkout은 Account→Payment KYC로 계산된다. cancel/retry/
  reload/duplicate callback/expired/forged token에서 정확한 state와 context가 검증된다.
  modal content가 320×568에서 잘리거나 이중 스크롤되지 않는다.
- **PRD 보존 항목:** `REQ-005`, `REQ-008`, `REQ-011`; 7개 `ReturnToCta`, 공개 ID allowlist,
  15분 수명, canonical gate queue, one-shot consume, safe-map fallback을 유지한다.

## FL-011 · Save / My Korea

- **현재 문제:** My Korea가 saved place·trip plan·wallet activity·stamp를 큰 관리 카드로
  병렬 나열해 현재 여행 흐름보다 대시보드처럼 느껴진다. Save 성공과 Account gate가
  분리되어 보이지 않으면 gate 완료가 곧 저장 완료처럼 오해된다.
- **목표 경험:** place의 bookmark 한 번으로 저장 의도를 시작하고, Account가 필요하면
  만든 뒤 같은 place가 저장된다. My Korea는 지도와 연결된 시간순 여행 기록으로
  보여 준다.
- **새 모바일 시퀀스:** bookmark tap → Account if needed → pending bookmark → saved
  haptic/status → My Korea timeline(map strip + saved/plan/activity) → row tap → exact
  city camera/place peek. unsave는 같은 위치에서 상태를 되돌린다.
- **정보 제거·접기·유지:** 제거: 카드마다 반복되는 source/implementation 설명, 큰
  섹션 eyebrow. 접기: 기술 wallet activity/receipt ID, provenance. 유지: place photo/name/
  city, saved state, 계획 시간, balance activity 금액·상태, stamp provenance, empty state.
- **상태·실패·복귀:** Account success와 Save mutation은 별도 pending/success다. storage
  failure는 bookmark를 saved처럼 남기지 않고 retry. reload에서도 canonical saved IDs와
  map selection이 일치한다. unsave failure는 이전 saved state를 복원한다.
- **접근성·신뢰:** bookmark의 accessible name이 `Save Roba`/`Remove Roba`로 바뀌고
  icon만 보이더라도 상태를 말한다. timeline은 시각적 선 없이도 DOM 순서와 heading으로
  이해되며, amount는 locale 숫자 포맷을 사용한다.
- **Acceptance criteria:** Guest save→Account→같은 venue 저장이 one-shot으로 완료되고,
  cancel은 미저장 place에 머문다. My Korea row→map/list/detail round trip이 선택/scroll을
  보존한다. reload·storage fail·unsave fail과 EN/KO/JA empty state가 검증된다.
- **PRD 보존 항목:** `REQ-005`, `REQ-016`, `SAVE_VENUE`, My Korea saved/plan/activity/
  stamp surfaces, persistence와 city→place 복귀를 유지한다.

## FL-012 · Local signal / first mission

- **현재 문제:** 저장 캡처에서 sticky header가 `How does it feel here?` 제목을 침범하고,
  사진·note·기술 privacy 설명이 한 화면에 몰린다. “local signal”이 공개 heat나 신원
  인증을 직접 바꾸는 것처럼 보일 수 있다.
- **목표 경험:** 장소 맥락을 유지한 채 몇 개의 감각 태그를 고르고, 사진/note는
  선택적으로 확인한 뒤 제출한다. 성공은 Visit/Contribution 변화만 명시한다.
- **새 모바일 시퀀스:** place → `지금 분위기 남기기` → venue header → tag grid → optional
  photo preview/replace/remove + optional note → submit → Account→Person JIT if needed →
  exact draft resume → pending → result(`기록됨`, 영향 받은 두 축) → place.
- **정보 제거·접기·유지:** 제거: hero 기술 문장, 상시 `on-device` eyebrow, provider/VC,
  공개 heat 기여 암시. 접기: 저장 위치·retention·evidence mechanics. 유지: venue,
  selected tags, photo 상태, note optional, 누가 볼 수 있는지, submit/cancel, 영향을 받는
  reputation 축.
- **상태·실패·복귀:** gate 전에 draft를 session-local로 보존하되 민감 media를 URL에
  넣지 않는다. upload/send failure는 preview와 retry/replace, cancel은 discard/keep
  선택, success만 Visit/Contribution 증가. Person/Meetup/stamp/public heat는 불변이다.
- **접근성·신뢰:** sticky header 아래 safe-area offset과 scroll padding을 두어 제목이
  가려지지 않는다. tag는 checkbox semantics, photo preview alt/remove label, upload
  progress/live region, permission denial 대안을 제공한다.
- **Acceptance criteria:** 320×568/390×844/short landscape에서 header·title·footer·keyboard가
  겹치지 않는다. draft→gate→resume이 정확하며 fail/cancel에서 mutation 0, success에서
  Visit/Contribution만 기대량만큼 변한다. 사진은 전송 전 preview/replace/remove 가능하다.
- **PRD 보존 항목:** `REQ-003`, `REQ-007`, `REQ-009`, `REQ-015`, `SUBMIT_LOCAL_SIGNAL`,
  Account+Person, browser-local photo lifecycle, first mission/reputation 축 분리를 유지한다.

## FL-013 · Manual 19+ proof

- **현재 문제:** 수동 After19 entry가 ID/Account onboarding으로 보이거나, “우리는
  생년월일을 보관하지 않는다” 같은 설명이 CTA보다 커지면 한 가지 predicate 확인이
  복잡해진다. 색 반전과 장식 점만으로 야간 모드를 알리면 접근성이 낮다.
- **목표 경험:** 지도/장소의 19+ affordance를 누르면 이유와 결과를 1-screen decision으로
  확인하고, 성공 뒤 야간 지도로 자연스럽게 돌아간다.
- **새 모바일 시퀀스:** After19 chip/locked alcohol item → exact target+`19+ 확인` →
  method/consent → pending → `19+ 확인됨` → 원 After19 place/layer. 실패면 retry 또는
  일반 지도 계속 보기.
- **정보 제거·접기·유지:** 제거: Account/Person 전제, provider 홍보, 내부 단계 숫자 반복.
  접기: issuer/expiry mechanics/retention. 유지: target, reason, 19+ predicate, 최소 공유,
  expiry, cancel/retry, 일반 지도 대안.
- **상태·실패·복귀:** Account 없이 시작 가능하다. success는 AGE만 변경하고 manual
  After19 view를 연다. denied/fail/expired는 기본 지도와 장소 정보를 막지 않는다.
  invalid returnTo는 safe map이며 임의 venue로 가지 않는다.
- **접근성·신뢰:** 야간 palette도 WCAG contrast를 유지하며 non-color `After 19` label,
  visible focus, 44px close, reduced motion을 지원한다. step result는 text/live region으로
  알린다.
- **Acceptance criteria:** Age success가 Person/Account/Payment KYC를 바꾸지 않는다.
  DOB/raw document 저장 0, exact venue resume, cancel/failure/expiry/general-map path,
  EN/KO/JA, keyboard, 200% zoom이 모두 통과한다.
- **PRD 보존 항목:** `REQ-012`, `OPEN_AFTER19`, Account-independent proof, AGE expiry,
  minimal predicate, base-map fallback을 유지한다.

## FL-014 · Auto After19

- **현재 문제:** 자동 전환이 갑자기 전체 화면을 검게 만들거나 술집만 남기면 사용자가
  일반 장소가 사라졌다고 오해할 수 있다. night mode의 원인을 설명하는 큰 modal은
  흐름을 끊고, 반대로 아무 status도 없으면 통제권이 없다.
- **목표 경험:** 이미 19+ 확인된 사용자가 KST 19:00 이후 앱을 열면 같은 camera에서
  야간 layer가 부드럽게 강조되고, 한 줄 banner로 즉시 끌 수 있다. 일반 장소는 남는다.
- **새 모바일 시퀀스:** app resume/clock guard → 4조건 검증 → same camera crossfade to
  After19 → compact `After 19 켜짐 · 끄기` → place selection 유지. `끄기`는 그 session에
  즉시 base layer로 돌아간다.
- **정보 제거·접기·유지:** 제거: 매번 뜨는 설명 modal, 전면 provider/age architecture,
  일반 장소 숨김. 접기: KST/expiry guard 상세. 유지: mode name, on/off control, age expiry
  시 재확인, 현재 선택/필터, night-only venue의 구분.
- **상태·실패·복귀:** `AGE-VERIFIED + unexpired + KST≥19 + auto on + session not manual-off`
  모두 참일 때만 `A19-ON`. 계산/clock 실패는 base ONDO. manual-off는 session 동안
  자동 재활성화 금지. expiry는 locked state로 내리고 선택 venue는 보존한다.
- **접근성·신뢰:** mode 변경을 polite live region으로 한 번 알리고, 색 외 moon/label로
  구분한다. reduced-motion은 crossfade 없이 즉시 layer 변경, forced colors에서도
  selected/unselected marker가 구분된다.
- **Acceptance criteria:** 네 guard 각각의 negative test에서 auto-on이 되지 않는다.
  on→off→resume에서 manual-off가 유지되고 일반 장소·camera·filter가 보존된다. night
  layer의 contrast, keyboard toggle, screen-reader 상태가 통과한다.
- **PRD 보존 항목:** `REQ-012`, 4-guard invariant, `A19-ON`/`A19-MANUAL-OFF`, banner-off,
  KST/expiry, 일반 map fallback을 유지한다.

## FL-015 · Optional public profile

- **현재 문제:** identity route에서 얻은 국적/거주 정보를 프로필에 자동 채우거나 PDF의
  “DID 국적 기반 타기팅”을 소비자 기능으로 옮기면 purpose limitation을 위반한다.
  reputation을 하나의 안전/신용 점수처럼 합치면 과도한 신뢰를 유도한다.
- **목표 경험:** 사용자가 `From`, `Lives in`, `Languages` 각각을 직접 입력하고 공개 여부를
  따로 고른다. 네 reputation 축은 근거 있는 활동 범위만 보여 주며 법적 신원이나 안전
  보증으로 읽히지 않는다.
- **새 모바일 시퀀스:** profile → field-by-field edit → visibility toggle → public preview
  → save pending → result. reputation row tap → 해당 축 evidence timeline; overall score는
  없다.
- **정보 제거·접기·유지:** 제거: ID-derived nationality, 자동 공개, 전체 trust score,
  공개 credential/issuer ID. 접기: evidence details, moderation history, local storage.
  유지: 각 field value/visibility, preview, cancel, four separate axes, source action/date,
  report/block boundary.
- **상태·실패·복귀:** draft와 published profile을 분리한다. save fail은 기존 공개값을
  유지하고 draft/retry를 제공한다. cancel은 변경 없음. block/report가 profile facts나
  reputation을 자동 mutate하지 않고 별도 moderation 상태를 만든다.
- **접근성·신뢰:** visibility toggle에 field 이름과 결과(`Public/Only me`)를 포함하고
  preview가 screen reader에도 실제 공개 순서를 따른다. axis chart는 숫자·label·설명으로
  대체 가능하며 색만 사용하지 않는다.
- **Acceptance criteria:** identity/onboarding/payment 데이터가 사용자 동의 없이 public
  fields에 들어가지 않는다. 각 field를 독립 공개/비공개, save fail/cancel/reload가
  이전 published state를 보존한다. four-axis evidence가 서로 또는 Person/Age/Payment로
  전이되지 않는다.
- **PRD 보존 항목:** `REQ-008`, `REQ-015`; optional public profile, selected fields,
  self-declaration, four-axis reputation, evidence drill-down, privacy와 failure를 유지한다.

## FL-016 · Evidence / merchant trait

- **현재 문제:** official/editorial/ONDO signal/merchant trait가 같은 badge로 보이면 정부
  기록이 품질·영업 중·결제 수락·혜택 eligibility를 보증하는 것처럼 읽힌다. 자세한
  source 설명을 본문에 모두 노출하면 사용자가 정작 가기 전 사실을 못 찾는다.
- **목표 경험:** 장소에서 의사결정에 필요한 사실만 먼저 보고, 각 fact의 출처·시점·
  범위는 열어 확인한다. unknown/stale/unavailable은 빈칸이 아니라 명시적 상태다.
- **새 모바일 시퀀스:** place → `가기 전 확인` compact facts → fact row tap → source sheet
  (fact, source class, observedAt, freshness, scope) → close to same place. benefit intent는
  separate eligibility adapter/result를 거친다.
- **정보 제거·접기·유지:** 제거: “official=추천/안전/결제 가능”, builder contract copy,
  source marketing. 접기: adapter/proof/provider payload, OpenDID/EAS contract details.
  유지: fact 자체, official/editorial/ONDO 분류, 시점, unknown/stale, 제한 범위, retry.
- **상태·실패·복귀:** OpenDID와 EAS adapter는 canonical envelope로만 합치고 source는
  보존한다. pending/stale/unknown/error를 success와 구분한다. fetch fail은 기존
  last-known fact에 stale 표시 또는 unknown이며 같은 place에서 retry한다.
- **접근성·신뢰:** badge 색뿐 아니라 source text/icon label을 제공한다. disclosure는
  button semantics/expanded state, table-like fact는 올바른 reading order, timestamps는
  locale과 timezone을 명시한다.
- **Acceptance criteria:** official license fact가 open-now, quality, price, merchant
  acceptance를 파생하지 않는다. Jeju editorial이 official count에 섞이지 않는다.
  stale/unknown/error/retry와 source adapter separation을 EN/KO/JA에서 검증한다.
- **PRD 보존 항목:** `REQ-004`, `REQ-014`; merchant trait, `FactEnvelope`, OpenDID/EAS
  separate adapters, provenance/freshness/unknown/error, EAS actual Deferred를 유지한다.

## FL-017 · Payment KYC

- **현재 문제:** Payment KYC가 Account/Person/K-Tour ID/19+와 한 번에 완료되는 “verified
  user” 단계처럼 보이거나, provider가 없는데 성공 후 실제 결제가 된 듯한 receipt를
  주는 것은 가장 큰 신뢰 위반이다.
- **목표 경험:** 사용자는 선택한 장소·사용액·잔액 출처를 유지한 채 “이 사용 기록을
  위해 결제 정책 확인이 필요하다”는 한 predicate만 처리하고 동일 checkout으로 돌아온다.
- **새 모바일 시퀀스:** final checkout → readiness(`Payment check 필요`) → requester/
  purpose/evidence → consent → provider preflight → connected: verify→PKY success→exact
  checkout / disconnected: unavailable→same balance action without external claim 또는
  cancel→same place. K-Tour presentation이 필요하면 다음 별도 step으로 명명한다.
- **정보 제거·접기·유지:** 제거: “full verification”, 신원/나이 동시 완료, 상시 provider
  jargon. 접기: KYC vendor/technical evidence/retention. 유지: place, exact KRW amount,
  requested predicate, consequence, provider unavailable, retry/cancel, 무엇이 결제되지
  않았는지.
- **상태·실패·복귀:** Payment KYC success만 `PKY-VERIFIED`; decline/timeout/cancel/expiry는
  잔액·receipt·stamp 불변. provider가 없으면 fixture success로 실제 연동처럼 가장하지
  않는다. retry는 동일 unconsumed `START_CHECKOUT`; cancel은 exact place, invalid RT는
  safe map.
- **접근성·신뢰:** consent action과 cancel을 모두 keyboard 접근 가능하게 하고,
  amount/purpose를 modal 제목에 연결한다. loading에는 취소 가능 여부, error에는 원인
  범주+recovery를 제공하고 focus를 실패 요약으로 이동한다.
- **Acceptance criteria:** Payment success/failure/cancel/expiry 어떤 경우도 Person/Age/
  Account/K-Tour credential을 암묵 변경하지 않는다. raw payment instrument/PII/provider
  payload가 persistence에 없다. provider disconnected path가 receipt나 돈 이동을 만들지
  않으며 exact checkout context가 보존된다.
- **PRD 보존 항목:** `REQ-005`, `REQ-011`, `PKY-*`, `START_CHECKOUT`, consent/provider
  adapter, failure/cancel/retry/expiry, payment/no-stamp invariant를 유지한다.

## FL-018 · Labs wallet / bridge

- **현재 문제:** Labs의 USDC/USDT/OOKRW/network/bridge 용어가 일반 Travel Wallet로
  새어 나오거나, `source-confirmed`를 destination success로 보이면 기술 데모가 실제
  자산 이동 약속으로 바뀐다. 여러 asset을 합친 USD 잔액처럼 보여도 안 된다.
- **목표 경험:** 일반 사용자는 KRW/USD 소비자 레이어만 보며, 관심 있는 사용자가
  명시적으로 Labs에 들어가 기술 가설과 단계별 상태를 본다. 각 asset/representation은
  분리되고 실제 tx가 없으면 simulated 상태를 명확히 안다.
- **새 모바일 시퀀스:** Settings/technical details → Labs acknowledgement → wallet connect
  fixture → separate USDC/USDT/OOKRW rows → quote → source submit → source confirmed →
  relaying → destination confirmed 또는 fail/timeout/cancel → technical receipt → optional
  milestone badge after explicit opt-in.
- **정보 제거·접기·유지:** 제거: 일반 Wallet/place/checkout의 token ticker/network/
  bridge CTA. 접기: Labs 진입 affordance, contract IDs, quote math. 유지(Labs): truth label,
  target network, asset별 amount/representation, USD estimate basis, ordered phases, timeout,
  retry/cancel, no-AMM/no-redemption boundary.
- **상태·실패·복귀:** source confirmed는 destination success가 아니다. destination
  confirmed 전에 balance mutation 금지; failure/timeout/cancel은 모든 assets 불변.
  unsupported network/asset은 quote 전에 차단하고, reconnect는 이전 pending을 success로
  만들지 않는다. 실제 공개 txRef 없이는 TESTNET이라 부르지 않는다.
- **접근성·신뢰:** phase stepper는 current/completed/failed를 text로 읽고, 긴 hashes는
  copy label과 축약 accessible name을 제공한다. acknowledgement/asset select/quote/
  confirm 모두 44px, keyboard, 200% zoom을 지원한다.
- **Acceptance criteria:** 일반 consumer surfaces에서 기술 ticker 0회(사용자가 상세를
  열기 전), Labs에서 USDC/USDT/OOKRW row가 합쳐지지 않는다. ordered phase negative
  tests, timeout/cancel/assets unchanged, no AMM CTA/mutation, no false TESTNET/fiat redemption
  claim이 통과한다.
- **PRD 보존 항목:** `REQ-004`~`REQ-006`, `REQ-014`, `REQ-016`; Labs opt-in, wallet/quote/
  bridge phases, separate assets, estimated USD, OOKRW test-token boundary, badge opt-in,
  AMM Deferred를 유지한다.

## 3. 교차 릴리스 게이트

### 3.1 금전·결제 truth

- `₩60,000`을 유지한다면 상태는 `기기 내 여행 잔액`처럼 그 금액의 출처와 일치해야
  한다. `no funds added`와 동시 표시는 금지한다. 반대로 “입금 없음”을 유지하려면
  사용자 잔액을 `₩0`으로 보여야 한다.
- ONDO benefit은 실제 merchant acceptance가 확인되지 않았다면 `가맹점 할인/결제`로
  부르지 않고 ONDO 안의 여행 혜택/기기 내 기록 범위로 제한한다.
- 외부 bank, card/Apple Pay, digital dollar는 선택 가능하되 `아직 연결되지 않음` 뒤에
  이전 usable source를 유지한다. 그 선택으로 잔액·receipt가 변하면 P0다.
- `환불`은 실제 결제 취소가 아니라면 `잔액 복원`으로 부르고, 확인 화면에 복원 금액,
  바뀌는 기록, 바뀌지 않는 외부 주문 상태를 표시한다.

### 3.2 K-Tour ID truth

- PDF의 가치 사슬은 `identity source → private K-Pass/K-Tour credential → service
  eligibility → activity record`로 가져오되, 기술 architecture를 온보딩에 전시하지
  않는다.
- `credential issued/added`와 `predicate presented/shared`를 별도 상태·CTA·receipt로 둔다.
- PDF의 국적 기반 광고 targeting이나 passport 기반 자동 wallet 생성은 현재 PRD의
  purpose minimization, no inference, explicit consent와 충돌하므로 현재 제품 여정에
  넣지 않는다.
- Mobile ID/Residence/Passport는 route 선택지이지 persona를 결정하는 분류기가 아니다.

### 3.3 접근성·포용성

| 검증 | 릴리스 조건 |
|---|---|
| 320px/200% zoom | 핵심 CTA, 닫기, 마지막 field가 겹치거나 잘리지 않음 |
| 390×844/430px | 한 화면 한 primary, sticky footer와 safe area 확보 |
| short landscape | sheet 단일 scroll, header/footer가 본문을 가리지 않음 |
| keyboard | map/list 대안, modal trap, Escape, opener focus return |
| screen reader | 단계명, 선택, 오류, 금액, 변화·불변 결과가 텍스트로 전달됨 |
| forced colors | selected/current/error가 색 외 경계·아이콘·텍스트로 구분됨 |
| reduced motion | map `jumpTo`, crossfade/celebration 제거, 상태는 동일 |
| EN/KO/JA | 숫자·통화·줄바꿈·CTA 우선순위와 truth가 동일 |

### 3.4 상태·복귀 adversarial matrix

모든 gated CTA는 아래 조합을 flow별로 통과해야 한다.

1. fresh success, cancel, provider denial, timeout, offline, retry success.
2. reload before gate, during pending, after gate before action, after action.
3. duplicate callback, back/forward, double tap, stale/expired/forged returnTo.
4. 원 venue/table 삭제·불일치, forbidden field가 든 token, gate order 변조.
5. 실패 전후 Account/Person/Age/Payment/K-Tour/Reputation/Balance/Stamp diff 검사.
6. exact return object, scroll/focus/camera/filter/draft 복원 검사.

## 4. PRD 기능 삭제 방지 판정

이번 감사의 단순화는 다음을 삭제하자는 제안이 아니다.

- MapLibre 지도, 검색·필터·Map/List, 세 도시 공통 renderer, 제주 editorial/unscored.
- 세 persona onboarding, 언어/취향/식이, Guest/optional Account.
- Mobile ID, Residence Card, Passport eKYC, OpenDID/K-Tour credential과 presentation.
- Account/Person/19+/Payment KYC의 독립 상태와 JIT gate/returnTo.
- Save/My Korea, Table planning/chat/image/check-in/feedback/report/block/leave.
- Local Signal, optional public profile, four-axis reputation, source/merchant traits.
- KRW checkout, USD 보조 추정, 기술 상세의 OOKRW/USDC/USDT, receipt/잔액 복원.
- unique visit와 stamp 9→10, opt-in badge, Labs wallet/bridge ordered phases.
- failure/cancel/retry/expiry/offline/loading/history/persistence/locale/accessibility.

줄여야 하는 것은 기능이 아니라 **정상 순간에 노출되는 내부 설명, 중복 문구, 동급
CTA 수**다. 모든 truth·기술·source detail은 삭제 대신 의미 gate에 맞춰 first screen,
disclosure, Labs 중 올바른 계층으로 이동한다.

## 5. D3 최종 권고

현재 B의 구조를 유지한 채 다음 순서로 닫는 것이 가장 안전하다.

1. P0 세 가지—wallet balance provenance, checkout/receipt consequence, K-Tour
   issuance/presentation 상태—를 먼저 하나의 vocabulary와 state diagram으로 고정한다.
2. FL-004/017/018을 같은 fixture로 이어 end-to-end balance diff와 false-success를 막는다.
3. FL-010 gate coordinator를 모든 JIT flow의 유일한 shell로 만들고 exact return/focus를
   계약화한다.
4. FL-003/007/012의 320px clipping/obstruction을 고치고 short landscape·200% zoom을
   포함한 시각 회귀를 잠근다.
5. 마지막에 copy를 줄인다. consequential action과 truth는 남기고 provider/architecture/
   score/source는 적절한 disclosure로 이동한다.

이 다섯 단계가 닫히기 전에는 18/18 기능 커버리지와 visual snapshot 통과만으로
“Toss급 완성”을 선언하지 않는다.
