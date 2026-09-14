# D1 · 제품 단순성·정보구조·UX writing 독립 감사

상태: `INDEPENDENT ADVERSARIAL REVIEW · NOT CONSENSUS · 2026-09-04`

역할: Toss 수준을 목표로 하는 모바일 제품 디자이너 D1. 이 문서는 다른
리뷰어와 합의하기 전의 독립안이며, 구현 지시나 현재 release 승인서가 아니다.

## 0. 감사 기준과 증거

다음 정본을 모두 대조했다.

- `docs/ondo-execution/01_PRD_9H.md`
- `docs/ondo-execution/02_DECISION_LEDGER.md`, 특히 `D-13`~`D-15`
- `docs/ondo-execution/03_FLOW_CATALOG.md`
- `docs/ondo-execution/04_STATE_MODEL.md`
- `docs/ondo-execution/07_VISUAL_INTERACTION_SPEC.md`
- `docs/ondo-execution/13_AS_BUILT.md` — 역사적 A/v2 기록으로만 사용
- `docs/ondo-baljajwi/04_EVIDENCE_MANIFEST.md`
- `docs/ondo-baljajwi/06_FINAL_REQUIREMENTS_AUDIT.md`
- `docs/ondo-baljajwi/07_AS_BUILT.md` — current B 정본
- `k-tour-id-app/docs/ONDO_PRODUCT_WIDE_VISUAL_RESET_PLAN.md`
- `k-tour-id-app/docs/ONDO_MOBILE_MEANING_GATE.md`
- `docs/ONDO_UX_DESIGN_SPEC.md`
- `TrackNo2_Hope&Woogieboogie_K-Tour ID_260531.pdf` 13쪽의 전체 텍스트와
  렌더 전 페이지. 특히 1, 5, 6, 9, 11쪽을 원본 크기로 확인했다.
- 현재 B의 flow coverage와 320/390/430 모바일 QA, Explore·Identity·Tables·
  Local Signal·My Korea·Wallet·Settings·After19 캡처.

`D-15`에 따라 current B 지도 renderer는 **MapLibre**다. Leaflet/raster A안으로
되돌리는 제안은 모두 기각한다. PDF의 기능 서사는 참고하되, 실제 provider,
결제, chain 연동이 완료된 것처럼 보이게 하는 표현은 가져오지 않는다.

### 0.1 Current B 근거 anchor

| 영역 | 구현 anchor | 확인한 대표 QA |
|---|---|---|
| App shell/navigation | `features/ondo/app/ondo-app-b.tsx`, `ondo-shell.module.css` | `artifacts/qa/explore-excellence/explore-nation-en-390x844.png` |
| Korea/city map | `features/ondo/map/map-entry-b.tsx`, `map-b.module.css` | `explore-map-manual-en-390x844.png`, `explore-list-manual-en-390x844.png` |
| Place | `features/ondo/place/canonical-place-overlay.tsx`, `editorial-place-overlay-b.tsx` | `explore-peek-en-390x844.png`, `explore-detail-en-390x844.png` |
| Onboarding/identity/gates | `features/ondo/onboarding/*`, `features/ondo/identity-b/*` | `artifacts/qa/final-integrated-identity/390-en-method.png`, `390-en-consent.png`, `390-en-ready.png` |
| Tables/chat | `features/ondo/connect/tables-entry-b.tsx`, `connect-overlays.tsx` | `artifacts/qa/visual-excellence-social/en-390x844-tables.png`, `table-detail.png`, `table-chat.png` |
| Local Signal | `features/ondo/local-signal-b/local-signal-layer-b.tsx` | `artifacts/qa/visual-excellence-social/en-390x844-local-signal.png` |
| Wallet/checkout/stamp | `features/ondo/commerce-b/id-wallet-commerce-b.tsx`, `visit-stamp-receipt-b.tsx` | `artifacts/qa/personal-excellence/en-390-id-wallet.png`, `en-390-offer-ready.png` |
| My/Profile/Settings | `features/ondo/my/*`, `identity-b/profile-reputation-b.tsx`, `settings/settings-entry-b.tsx` | `artifacts/qa/personal-excellence/en-390-my.png`, `en-390-settings.png` |
| After19 | `features/ondo/after19/*`, `map-b.module.css` | `artifacts/qa/visual-excellence-social/en-390x844-after19.png` |

표의 QA 경로는 모두 `k-tour-id-app/` 아래다. 실패 screenshot은 현행 제품 결함과
stale assertion을 구분하는 참고로만 썼고, 자동 PASS 자체를 UX 승인 근거로 삼지 않았다.

## 1. 독립 판정

현재 제품은 기능 추적성은 강하지만, 사용자가 보는 첫 viewport에서는 내부 상태와
제품 설명을 너무 자주 말로 가르친다. 가장 큰 문제는 기능 부족이 아니라
**한 결정 앞에 여러 개의 설명·카드·상태 badge가 경쟁하는 것**이다.

| 우선순위 | 문제 | 반드시 지킬 결과 |
|---|---|---|
| P0 | Account·Person·Age·Payment gate가 한 화면에서 서로를 설명해 축이 합쳐져 보임 | 현재 행동에 필요한 축 하나만 JIT로 묻고 나머지는 말하지 않음 |
| P0 | gate 뒤 복귀가 단순 route 복귀처럼 보일 수 있음 | city, mode, query, filter, selection, layer, scroll, focus, draft와 원 CTA를 one-shot 복원 |
| P0 | checkout 성공과 stamp 상승이 한 연속 보상처럼 보일 수 있음 | 결제 결과와 별도의 unique visit evidence 사이에 명확한 사건 경계 유지 |
| P0 | 서울·부산 official, 제주 editorial, ONDO simulated field가 같은 신뢰 의미로 읽힐 수 있음 | 공통 renderer를 쓰되 source/truth state를 합치지 않음 |
| P0 | After19에서 지도 맥락이 거의 사라질 정도로 어두워질 수 있음 | light와 같은 도로·지명·선택 geometry를 유지하고 heat만 neon accent로 전환 |
| P1 | 지도·상세·Table·Wallet에 설명 카드와 큰 제목이 누적됨 | 첫 viewport는 질문 하나, 주 객체 하나, primary action 하나 |
| P1 | `on-device`, provider, `preview`, `simulated`, `test`가 정상 소비자 경로에 반복됨 | 사용자 결과만 전면에 두고 기술명은 접기/Labs, 오해 방지 truth는 결정점에서 한 번 |
| P1 | onboarding이 법적 신분 세 부류를 먼저 고르게 함 | 여행 의도와 취향만 물으며 identity는 실제 필요 행동에서만 요청 |
| P1 | 같은 기능군의 bottom sheet와 타이포 위계가 달라 학습 비용이 큼 | sheet header/body/footer, close, sticky CTA, error/retry 문법 통일 |

자동 gate가 green이라는 사실은 위 정보구조 문제를 반증하지 않는다. 이는 기능·
geometry 회귀가 아니라 사용자의 이해 비용에 대한 독립 제품 판단이다.

## 2. 전역 단순성 계약

### 2.1 텍스트를 남기는 기준

| 처리 | 기준 | 예 |
|---|---|---|
| 항상 표시 | 지금 내려야 할 결정, 금액·시간·장소, consent, 오류 복구 | `결제하기`, `오늘 오후 7:30`, `다시 시도` |
| 시각화 | 상태가 위치·형태·진행으로 이해될 때 | 선택 ring, 좌석 수, 온도 halo, 저장 morph |
| 한 번 접기 | 출처, 기술 ticker, provider, 산식, 보존 방식 | `결제 상세`, `출처`, `확인 방법` |
| Labs로 이동 | network, signer, bridge phase, OpenDID/EAS envelope | Labs stepper |
| 제거 | 제작자 관점의 자랑·중복·무행동 설명 | 반복 `preview`, `simulated`, `on-device`, 카드 안의 카드 설명 |

아이콘은 문장을 장식하는 용도가 아니다. 익숙한 의미의 `검색`, `저장`, `위치`,
`목록`, `닫기`, `뒤로`는 icon-only가 가능하되 44×44px target과 KO/EN/JA
accessible name을 갖는다. `결제`, `신원 확인`, `공개`, `신고`, `삭제`처럼 결과가
모호하거나 위험한 행동은 텍스트 label을 유지한다.

### 2.2 한 화면 한 결정

- 첫 viewport의 primary CTA는 하나다. 같은 무게의 보조 버튼은 두지 않는다.
- 제목은 사용자의 질문을 답하고, body는 최대 두 문장이다. 세 번째 설명부터 접는다.
- stepper는 실제로 순서와 진행을 바꿀 때만 쓴다. 현재 축과 무관한 미래 gate를
  한꺼번에 보여주지 않는다.
- 성공은 새 설명 페이지보다 원 객체의 상태 변화로 보인다: 저장 icon fill, 좌석
  감소, 19+ mode tint, 방문 stamp 증가.
- 같은 의미를 `eyebrow + title + badge + body` 네 번 반복하지 않는다.

### 2.3 exact returnTo의 시각 계약

모든 gate는 `route/surface`, `city`, `map camera`, `map|list`, `query`, `filter`,
`selected venue/table`, `open layer`, `section/scroll`, `opener focus`, `draft`,
`pending CTA`를 필요한 범위에서 캡처한다.

- 성공: 저장된 CTA를 **한 번만** 자동 재개하고 해당 결과 상태를 보여준다.
- 취소: gate를 열기 직전 pixel context와 opener focus로 돌아간다.
- 실패: gate 안에서 원 행동과 입력을 보존하며 재시도한다.
- 중복 callback/reload/back-forward: mutation을 반복하지 않고 같은 context를 복원한다.
- 개인정보와 local draft는 URL에 넣지 않는다.

### 2.4 product-truth

- 이 제품은 완성도 높은 frontend product demo다. 실제 identity provider, live
  payment, custody, bridge, chat server, merchant verification을 주장하지 않는다.
- 정상 소비자 화면에 제작자 용어를 반복하지 않는다. 오해 가능한 결정점에서만
  `결제 제공자가 연결되지 않아 실제 금액은 이동하지 않아요`처럼 사용자 결과를
  한 번 말하고 세부 정보는 접는다.
- Account ≠ Person ≠ Age ≠ Payment KYC를 유지한다. 어느 축도 다른 축을 자동으로
  올리지 않는다.
- 서울·부산 LOCALDATA official record, ONDO simulated signal, 제주 VISITKOREA
  editorial collection을 합치지 않는다.
- `KRW`가 기본 소비자 통화이고 `USD`는 출처·시각이 있는 보조 예상값이다.
  `OOKRW/USDC/USDT/network`는 결제 상세 또는 Labs에서만 보인다.
- 결제 성공은 stamp를 올리지 않는다. unique visit evidence만 stamp를 바꾼다.

### 2.5 모바일·언어 gate

- 320, 390, 430px portrait 모두 horizontal overflow 0, sticky CTA와 bottom nav
  overlap 0, 모든 target 44×44px 이상.
- 320×568과 844×390에서도 제목, 현재 결정, primary CTA, close/back에 도달한다.
- 200% text zoom에서 중요한 label을 ellipsis로 숨기지 않는다.
- KO/EN/JA는 문자열 존재가 아니라 의미·톤·줄바꿈·accessible name이 동등해야 한다.
- 숫자·금액은 locale formatter를 사용하고 `60,000 KRW`처럼 grouping을 유지한다.
- motion은 context 보존에만 쓴다. `prefers-reduced-motion`에서는 즉시 상태 전환하되
  focus와 결과 announcement는 동일하다.

## 3. Flow별 독립안

## FL-001 · Guest Discover

**현재 문제**

Nation 진입은 좋아졌지만, city map에서 검색·category rail·위치 상태·locate·19+·
Stories·personalization·legend/list·attribution이 같은 시야에 경쟁한다. Place peek은
온도와 source 설명을 첫 결정 앞에 노출하고, category 대표 이미지를 실제 venue
사진처럼 반복 사용하면 출처 truth도 흐린다.

**목표 경험**

앱을 열면 살아 있는 한국 지도가 먼저 보이고, 한 번의 도시 선택이 끊김 없이 같은
MapLibre surface의 city 탐색으로 이어진다. 사용자는 설명을 읽지 않고도 beacon의
ring과 heat field, marker 선택, map/list 전환을 이해한다.

**새 모바일 시퀀스**

`Korea atlas → 도시 beacon 선택 → 같은 지도에서 camera ease → city context →
marker/list 선택 → compact peek → 장소 상세 → 길찾기 → 같은 장소 복귀`

- city 진입 직후 검색을 autofocus하지 않는다.
- 800ms까지 이전 atlas를 유지하고, 이후 비차단 progress만 보인다.
- 5초 내 ready가 아니면 같은 query/filter/selection의 List를 foreground한다.

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| hero의 기록 수, `curated`, 중복 city slogan, always-on 위치 설명 | 온도 방법론, source snapshot/date, full attribution | 지도, city label, 검색, category, map/list, 선택 장소명, 정확한 source state |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| city visible label | 서울 | Seoul | ソウル |
| city accessible name | 서울 지도 열기 | Open Seoul map | ソウルの地図を開く |
| place primary | 길찾기 | Directions | 経路 |
| recovery | 목록에서 보기 | View list | リストを見る |

**시각 장치**

MapLibre를 유지한다. 서울·부산·제주는 D-14/D-15의 동일한 `field → aura → core →
selected halo → place capsule` renderer를 쓴다. 서울 active는 이중 ring, 부산
growing은 단일 ring, 제주 limited는 점선 ring이다. 제주 field는 editorial
coverage일 뿐 숫자·인기 순위가 아니다. official 장소에는 source shield, editorial
장소에는 compass mark를 쓰되 선택 전 지형을 가리는 큰 capsule은 금지한다.

**상태·실패·복귀**

tile/glyph/source의 recoverable error는 전체 failure로 만들지 않는다. fatal init만
List fallback과 Retry를 보인다. Back은 detail→peek→city→nation 순서를 복원하고,
query/filter/camera/selection/scroll/focus를 보존한다.

**Acceptance criteria**

- [ ] 첫 viewport에서 지도와 도시 선택 외 경쟁 CTA가 없다.
- [ ] 세 도시가 동일 renderer와 44px hit target을 쓰며 제주에 score/Hot이 없다.
- [ ] category imagery가 실제 venue photo가 아니면 명확히 editorial/category art로 처리된다.
- [ ] 320/390/430에서 search, filter, controls가 겹치지 않는다.
- [ ] loading·fallback·Retry 후 동일 context가 복원된다.

**PRD 보존**: `REQ-007`, `REQ-013`, `REQ-017`~`REQ-019`; Guest map/search/detail/
directions; 서울·부산 각 200 official; 제주 editorial 분리; Map/List parity;
MapLibre, legal attribution, 실제 좌표, D-14/D-15 motion·recovery.

## FL-002 · Age proof → exact After19 venue

**현재 문제**

Age gate가 K-Tour ID, Person, provider, Account 상태를 함께 설명하면 사용자는
여권/KYC를 해야 장소를 볼 수 있다고 오해한다. gate가 원 장소와 분리된 큰 onboarding
화면처럼 보이면 복귀 신뢰도도 낮다.

**목표 경험**

잠긴 장소를 보고 `이 장소의 19+ 콘텐츠만 확인한다`는 한 가지 이유를 이해하고,
확인 뒤 같은 장소가 바로 열린다.

**새 모바일 시퀀스**

`잠긴 venue detail → venue thumbnail/name이 고정된 19+ sheet → consent → 확인 중 →
성공 → 같은 venue·같은 section의 After19 상세`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| K-Tour ID 소개, Person/Account/Payment 설명, `on-device`, provider logo/name | 확인 방식, issuer, expiry, provider 세부 | venue name, 19+ 이유, 필요한 consent, 실패 이유, 다시 확인, 실제 외부 확인이 없다는 truth 한 줄 |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| title | 19+ 콘텐츠 보기 | View 19+ content | 19+コンテンツを見る |
| primary | 19+ 확인하고 계속 | Check 19+ and continue | 19+を確認して続ける |
| secondary | 나중에 | Not now | 今はしない |

**시각 장치**

원 장소 hero를 뒤에 유지하고 잠긴 영역만 frosted 처리한다. 성공 시 lock이 풀리며
dark theme가 같은 geometry 위로 crossfade한다. 단계 숫자 1~4는 사용자의 결정을
돕지 않으므로 숨기고 progress는 짧은 상태 morph로만 보인다.

외부 age provider가 미연결인 현재 demo에서는 consent 바로 위에 `신분증은 전송되지
않아요`를 한 번만 보인다. 제목·CTA마다 `simulation`을 반복하지 않는다.

**상태·실패·복귀**

Cancel과 failure는 잠긴 같은 venue로 돌아가며 일반 상세는 계속 이용한다. expiry는
이유와 `다시 확인`만 보인다. 성공은 `OPEN_AFTER19`를 one-shot 재개하며 Account,
Person, Payment 상태를 바꾸지 않는다.

**Acceptance criteria**

- [ ] first viewport에 venue context, 이유 한 줄, primary CTA 하나만 있다.
- [ ] Age만 변경되고 Account/Person/Payment는 불변이다.
- [ ] 성공·취소·실패 모두 같은 `venueId`, section, opener focus를 보존한다.
- [ ] provider 기술명은 기본 화면에 없다.

**PRD 보존**: `REQ-005`, `REQ-012`; 독립 `AGE-*`; exact locked venue return;
failure/expiry/retry; 일반 장소 이용 유지; simulated After19 policy truth.

## FL-003 · Table → Image Chat → Feedback

**현재 문제**

Tables 첫 화면의 큰 제목·hero와 detail의 큰 카드들이 실제 결정인 `언제, 무엇을,
누구와, 몇 자리`를 아래로 민다. Join, member-only chat, check-in, feedback, safety가
한 덩어리로 보이고 `preview/no host` 설명이 여러 번 반복된다.

**목표 경험**

목록에서 시간과 남은 자리로 고르고, 상세 첫 viewport에서 여섯 필수 fact를 확인한
뒤 참여한다. 참여가 확정되면 같은 화면이 room으로 변하고, 그때 chat이 열린다.

**새 모바일 시퀀스**

`compact table list → six-fact detail → Join → 필요한 gate를 한 축씩 → confirmed
room → member chat/image retry → check-in → completion → structured feedback →
Meetup 변화`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| 거대한 marketing hero, 반복 fixture 설명, 가입 전 chat preview | 상세 운영 한계, 상세 안전 안내, 참가자 추가 정보 | 장소, 시간, 메뉴, 언어, 비용, 자리, meeting format, 신고·차단·나가기, Join 직전 `실제 예약/host 연락 없음` truth 한 줄 |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| list action | 테이블 보기 | View table | テーブルを見る |
| join | 참여하기 | Join table | 参加する |
| confirmed | 대화 열기 | Open chat | チャットを開く |
| safety | 신고하기 | Report | 報告する |

**시각 장치**

목록 카드는 시각적으로 시간 tile + seat dots + cuisine thumbnail로 구성한다. 여섯
fact는 icon grid가 아니라 label/value 두 열로 읽히게 하며, color만으로 availability를
표현하지 않는다. confirmed 시 Join CTA가 room status와 chat CTA로 morph한다.

**상태·실패·복귀**

Account/Person/Age가 필요하면 동시에 설명하지 않고 현재 gate만 연다. 각 gate
returnTo는 tableId, detail scroll, draft를 유지한다. image 실패는 bubble 자리에서
Retry/Remove, organizer cancel/closed/expired/policy failure는 안전한 목록 복귀를
제공한다. non-member direct chat은 열리지 않는다.

**Acceptance criteria**

- [ ] 여섯 필수 fact가 첫 viewport 또는 한 번의 짧은 스크롤 안에 모두 보인다.
- [ ] 확인되지 않은 host/reservation을 실제처럼 표현하지 않는다.
- [ ] Join 결정점에 외부 host/예약이 없다는 결과를 한 번 표시한다.
- [ ] confirmed member만 chat을 열 수 있다.
- [ ] Report/Block/Leave가 44px 이상이며 destructive confirmation이 있다.
- [ ] check-in+completion+feedback 뒤에만 Meetup이 변한다.

**PRD 보존**: `REQ-008`~`REQ-010`, `REQ-015`; six facts; conditional gates;
confirmed-member chat/image; retry; safety actions; Table evidence 뒤 Meetup만 변경.

## FL-004 · Checkout/Labs → Stamp

**현재 문제**

Wallet·offer·checkout·receipt·stamp·badge가 한 서사로 붙으면 결제가 실제이고 결제만
하면 방문 stamp/NFT를 받는 것처럼 보인다. 큰 balance 카드, KRW와 기술 ticker,
여러 disclosure가 첫 화면의 금액 확인보다 강하다.

**목표 경험**

사용자는 장소·혜택·최종 KRW 금액을 먼저 확인한다. payment demo 결과는 receipt로
끝나고, 별도의 unique visit 사건이 생길 때만 My Korea stamp가 변한다.

**새 모바일 시퀀스**

`venue offer → merchant/amount/benefit checkout → Account → Payment KYC → confirm →
receipt(잔액·stamp 불변) → 별도 unique visit evidence → My Korea 9→10 → 선택 시 Labs
souvenir badge`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| 정상 화면의 OOKRW/USDC/USDT/network, `test/simulated`, 결제와 stamp의 연속 보상 연출 | 결제 제공자 미연결, 실제 금액 이동 없음, settlement unit, USD 예상값 출처·시각 | merchant, benefit, `60,000 KRW`, payment method state, receipt, 별도 visit event |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| checkout | 결제 확인 | Review payment | 支払いを確認 |
| confirm | 60,000원 결제 확인 | Confirm ₩60,000 | ₩60,000の支払いを確認 |
| receipt close | 장소로 돌아가기 | Back to place | お店に戻る |
| visit event | 방문 기록 확인 | Review visit record | 訪問記録を確認 |

**시각 장치**

금액은 locale grouping과 가장 큰 단일 숫자로 보인다. benefit은 가격 옆 한 줄 차감
animation으로만 표현한다. receipt와 visit milestone 사이에는 다른 screen context와
시간 stamp를 둔다. stamp는 별도 visit card에서 9번째가 10번째로 채워진다.

**상태·실패·복귀**

취소·failure·timeout에서 자산과 stamp는 불변이고 checkout merchant/amount를
보존한다. Payment KYC 성공은 같은 confirm action을 한 번만 재개한다. duplicate
receipt/visit evidence는 idempotent하다. badge 취소는 My Korea로 돌아간다.

**Acceptance criteria**

- [ ] 소비자 기본 통화는 KRW, USD는 출처 있는 보조값, 기술 ticker는 접기/Labs다.
- [ ] 결제 성공 assertion 직후 stamp가 증가하지 않는다.
- [ ] unique visit evidence만 9→10을 만들고 중복 evidence는 무시된다.
- [ ] 실제 provider/money movement를 암시하지 않는다.
- [ ] 320px에서 amount, primary CTA, close가 잘리지 않는다.

**PRD 보존**: `REQ-006`, `REQ-011`, `REQ-016`; Payment KYC 독립; OOKRW 내부
fixture와 separate Labs assets; failure asset invariance; unique visit-only stamp;
opt-in badge; D-13.

## FL-005 · Korean CX

**현재 문제**

사용자에게 `OmniOne CX`, `Mobile ID`, `K-Tour ID`, `Person`을 한꺼번에 보여주면
provider 선택처럼 보이고, 확인이 계정·19+·결제까지 완료한다고 오해할 수 있다.

**목표 경험**

Local Signal 또는 Table 행동을 계속하려는 순간 `본인 확인이 필요하다`는 이유만
이해하고 익숙한 Mobile ID로 진행한다.

**새 모바일 시퀀스**

`protected action → action-anchored Person sheet → Mobile ID 선택 → 최소 consent →
provider handoff state → success/failure → 원 CTA one-shot 재개`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| 정상 화면의 OmniOne CX, DID/VC, `on-device`, 4단계 기술 stepper | provider, credential issuer/expiry, 확인 방법 | 원 행동, 필요한 이유, 공유 항목, consent, 실패/재시도, provider 미연결 truth 한 줄 |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| title | 본인 확인 | Confirm your identity | 本人確認 |
| primary | 모바일 신분증으로 계속 | Continue with Mobile ID | モバイルIDで続ける |
| cancel | 지금은 안 할게요 | Not now | 今はしない |

**시각 장치**

sheet 상단에 provider logo 대신 원 행동의 장소/Table thumbnail을 둔다. 확인 과정은
phone→check의 두 상태로 morph하고 성공하면 sheet가 닫히며 원 CTA가 완료된다.

현재 외부 provider가 연결되지 않은 fixture에서는 consent 시점에 `신분증이나 원본
정보는 전송되지 않아요`를 한 번 표시한다. 이를 `on-device` eyebrow나 반복 배지로
대체하지 않는다.

**상태·실패·복귀**

Cancel은 Account 상태로 원 화면에 복귀한다. failure/expired는 같은 sheet에서 이유와
Retry만 보여준다. 성공은 `PER-VERIFIED`만 바꾸며 Account/Age/Payment/reputation은
불변이다. 원 CTA와 focus를 한 번만 재개한다.

**Acceptance criteria**

- [ ] provider 이름을 모르는 사용자가 막히지 않는다.
- [ ] 본인 확인이 필요한 행동과 공유 항목이 한 viewport에 명확하다.
- [ ] success/cancel/failure/expiry 모두 원 context를 보존한다.
- [ ] Person 성공이 안전 보증이나 다른 gate 완료로 표현되지 않는다.

**PRD 보존**: `REQ-001`, `REQ-005`; CX success/cancel/failure/expiry fixtures;
JIT Person; no real provider claim; `SUBMIT_LOCAL_SIGNAL`/`JOIN_TABLE` exact returnTo.

## FL-006 · Residence Card

**현재 문제**

지원되지 않는 Residence Card와 provider 설명이 큰 선택 카드로 노출되면 사용자는
제품 고장으로 느끼며, Passport 대체 경로가 별도 onboarding처럼 길어진다.

**목표 경험**

한국 거주 사용자가 익숙한 card로 확인을 시도하고, 현재 연결되지 않았다면 입력을
잃지 않은 채 Passport라는 한 가지 대안을 선택한다.

**새 모바일 시퀀스**

`protected action → 본인 확인 sheet → Residence Card → available success 또는
neutral unavailable → Passport alternate → result → 원 CTA 재개`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| OmniOne 반복, `registered foreign resident` 설명, Account/Age/Payment 상태 | provider와 지원 범위, credential metadata | Residence Card, 현재 이용 불가, Passport 대안, 원 행동, 외부 확인 미연결 truth |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| primary | 외국인등록증으로 계속 | Continue with residence card | 在留カードで続ける |
| unavailable | 여권으로 확인 | Use passport instead | パスポートを使う |
| retry | 다시 확인 | Try again | もう一度試す |

**시각 장치**

method row는 document icon, 이름, single-line status만 쓴다. unavailable은 빨간
오류 카드가 아니라 muted row와 Passport primary action으로 전환한다.

**상태·실패·복귀**

지원 fixture면 `PER-VERIFIED`, 미지원이면 상태 불변이다. failure와 Passport
alternate 모두 table/place/draft/scroll을 유지한다. 취소는 Account 상태의 원 화면,
성공은 원 CTA one-shot 재개다.

**Acceptance criteria**

- [ ] 미지원이 실패·신분 부정으로 보이지 않는다.
- [ ] Passport 대체 경로가 같은 sheet 안에 한 단계로 제시된다.
- [ ] provider 미연결 truth는 숨기지 않되 기술명은 접힌다.
- [ ] 어느 branch도 Age/Payment/Account를 자동 변경하지 않는다.

**PRD 보존**: `REQ-002`, `REQ-005`; supported/unsupported/alternate fixtures;
JIT Person; provider truth; exact gated-action return.

## FL-007 · Short-term onboarding

**현재 문제**

첫 실행에서 `단기 여행객`이라는 persona와 K-Tour ID를 앞세우면 취향 설정이 신원
분류처럼 느껴진다. hero, persona, preferences, ID prompt가 각각 별도 큰 화면이면
지도를 보기 전 작업 비용도 높다.

**목표 경험**

사용자는 법적 상태가 아니라 여행 의도를 한 번 고르고, 먹고 싶은 것 몇 개를 탭한
뒤 바로 개인화된 Guest 지도에 도착한다. K-Tour ID는 탐색을 막지 않고 실제로
필요한 행동에서만 이어진다.

**새 모바일 시퀀스**

`가치 한 화면 → 무엇을 하러 왔나요? [한국 여행] → 음식·식이 chip 선택 →
선택 결과가 보이는 Guest map → 첫 gated action에서만 K-Tour ID/Person JIT`

- 언어는 header의 compact control로 언제든 바꾸며 별도 대형 step으로 만들지 않는다.
- onboarding preference와 identity credential은 하나로 합치지 않는다. 성공한
  K-Tour ID는 같은 personalized map/action으로 돌아올 뿐 취향을 credential에 넣지 않는다.

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| `short-term`, eKYC, provider, K-Tour ID setup 선제 노출, 긴 가치 설명 | 알레르기 세부, 가격대·기간 추가 설정 | 여행 의도, 음식 관심, 식이 요구, Skip, Guest 이용 가능 |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| intent title | 이번에 무엇을 찾나요? | What are you here for? | 今回の目的は？ |
| intent | 한국 여행 | Visiting Korea | 韓国旅行 |
| primary | 내 지도 보기 | See my map | 自分の地図を見る |
| skip | 바로 둘러보기 | Explore now | すぐに見る |

**시각 장치**

의도는 세 개의 동일 높이 pictogram row로, 취향은 사진이 있는 selectable chips로
표현한다. 선택한 chip이 지도 category highlight로 이어지는 짧은 morph를 써서
`설정이 적용됐다`는 설명 문장을 대신한다.

**상태·실패·복귀**

validation/storage failure는 재시도 화면을 만들지 않고 usable Guest map에 기본값으로
진입한다. Skip도 같은 map으로 간다. Back은 onboarding 선택을 복원하며 identity를
시작하지 않는다.

**Acceptance criteria**

- [ ] 320px에서 intent 3개, 현재 질문, primary/skip가 세로 흐름으로 잘리지 않는다.
- [ ] eKYC/K-Tour ID 없이 map/search/detail/directions를 쓸 수 있다.
- [ ] preference 선택이 지도에 시각적으로 반영된다.
- [ ] failure와 skip은 둘 다 Guest map이라는 안전한 종료를 갖는다.

**PRD 보존**: `REQ-003`, `REQ-005`, `REQ-018`; language/interests/diet 저장;
Guest-first; validation fallback; Passport KYC와 첫 mission 분리; onboarding retry N/A.

## FL-008 · Korean local onboarding

**현재 문제**

`한국 로컬`을 첫 법적 분류로 요구하고 CX·Account를 같은 onboarding 안에 예고하면
탐색 시작 전에 신원 증명을 요구하는 것처럼 읽힌다. 여행자용 취향과 로컬 기여
의향이 한 화면에 섞일 위험도 있다.

**목표 경험**

사용자는 `내 주변을 다시 발견`하는 의도를 고르고 익숙한 맛·새로운 발견 선호를
선택한 뒤 Guest 지도에 간다. Mobile ID는 Local Signal/Table 같은 Person-required
action에서만 열린다.

**새 모바일 시퀀스**

`가치 한 화면 → [내 주변 탐색] → 동네/음식 관심 선택 → personalized Guest map →
기여 또는 Table 시 Mobile ID JIT`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| 국적 인증 뉘앙스, CX/Account 선제 CTA, `trusted local` 점수 | 기여 의향, 추가 동네, 알레르기 | 탐색 의도, 관심 지역, 음식 선호, Skip, Guest path |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| intent | 내 주변 탐색 | Exploring near home | 身近な場所を探す |
| primary | 주변 맛집 보기 | See nearby places | 近くのお店を見る |
| later contribution | 지금 분위기 남기기 | Share what it is like now | 今の様子を共有 |

**시각 장치**

거주/국적 badge가 아니라 home-radius pictogram과 동네 chips를 쓴다. 지도 진입 시
선택 동네 camera와 category가 반영되되 위치 권한은 자동 요청하지 않는다.

**상태·실패·복귀**

Account/CX는 onboarding에서 호출하지 않는다. preference 저장 실패도 Guest map으로
종료한다. 위치 권한 거부 시 검색과 수동 지역 선택을 유지한다. 이후 JIT gate는
원 Local Signal/Table draft로 정확히 복귀한다.

**Acceptance criteria**

- [ ] 한국 국적이나 신원 확인을 onboarding 성공 조건으로 만들지 않는다.
- [ ] 위치 권한 없이도 지역 선택과 map/list 탐색이 가능하다.
- [ ] CX는 Person-required action 전에는 호출되지 않는다.
- [ ] KO/EN/JA 모두 `local=국적`으로 번역하지 않고 탐색 의도로 표현한다.

**PRD 보존**: `REQ-001`, `REQ-005`, `REQ-018`; Korean-local intent/defaults;
Guest 또는 선택 Account map; CX 미호출; failure/skip map fallback; later JIT CX.

## FL-009 · Resident onboarding

**현재 문제**

`장기체류자`와 Residence Card가 onboarding의 정체성처럼 보이면 이용자가 자신의
법적 상태를 먼저 선언해야 한다고 느낀다. Residence provider 미연결 상태를 이때
노출하면 제품의 첫 인상도 실패 화면이 된다.

**목표 경험**

한국에 사는 사용자는 `한국에서 생활 중`이라는 탐색 의도와 생활 반경·식이 선호만
고르고 지도에 간다. Residence Card/Passport 선택은 이후 확인이 필요한 행동에서만
한다.

**새 모바일 시퀀스**

`가치 한 화면 → [한국에서 생활] → 생활 지역·음식·식이 선택 → Guest map →
Person-required action에서 Residence Card 또는 Passport`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| `long-term resident`, Residence provider 상태, Account/KYC 선제 설명 | 추가 지역, 체류 관련 도움말 | 생활 의도, 관심 지역, 식이, Skip, Guest 이용 가능 |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| intent | 한국에서 생활 중 | Living in Korea | 韓国で暮らしている |
| primary | 생활권 지도 보기 | See my local map | 生活圏の地図を見る |
| skip | 바로 둘러보기 | Explore now | すぐに見る |

**시각 장치**

집/교통 반경 pictogram과 region chips로 의도를 표현한다. credential icon은 onboarding에
쓰지 않는다. 선택 결과는 지도의 초기 camera/filter에만 반영한다.

**상태·실패·복귀**

Residence Card를 onboarding에서 시작하지 않는다. storage failure와 Skip은 Guest
map으로 간다. 이후 unsupported Residence branch는 FL-006 안에서 Passport 대안을
제공하고, 원 action/draft로 복귀한다.

**Acceptance criteria**

- [ ] 거주 의도는 법적 residence verification으로 표현되지 않는다.
- [ ] provider 미연결 상태가 onboarding을 막지 않는다.
- [ ] 식이·지역 선택은 map에 반영되고 identity state는 변하지 않는다.
- [ ] failure/skip 뒤에도 Guest 기능 전체가 살아 있다.

**PRD 보존**: `REQ-002`, `REQ-005`, `REQ-018`; resident defaults; Residence 미호출;
Guest fallback; FL-006의 supported/unsupported/passport alternate 분리.

## FL-010 · Account gate

**현재 문제**

`Create a local account`, `minimum check`, `on-device`, Account/Payment badges처럼
시스템 상태를 설명하는 generic modal은 사용자가 원래 하려던 저장·참여·checkout을
잊게 한다. 여러 gate badge는 계정 생성이 다른 확인까지 끝낸다는 오해도 만든다.

**목표 경험**

사용자는 원 행동의 이점을 보고 계정을 만든다. 계정이 이 기기의 continuity를 위한
것임을 한 줄로 이해하고, 성공 즉시 원 행동이 완료된다.

**새 모바일 시퀀스**

`Save/Join/Message/Checkout tap → action-specific account sheet → create → success →
pending CTA one-shot 실행 → 원 객체의 완료 state`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| `minimum check`, Account/Payment progress pills, Person/19+ 설명, `on-device` eyebrow | 저장 방식·session 범위, 계정 기술 세부 | 원 행동/객체, 이 기기에 저장된다는 결과, Create, cancel, inline error |

**CTA·카피**

| 원 행동 | KO | EN | JA |
|---|---|---|---|
| Save title | 이 장소를 저장할까요? | Save this place? | このお店を保存しますか？ |
| Join title | 이 테이블에 참여할까요? | Join this table? | このテーブルに参加しますか？ |
| primary | 계정 만들고 계속 | Create account and continue | アカウントを作って続ける |
| cancel | 돌아가기 | Go back | 戻る |

**시각 장치**

generic user icon 대신 원 venue/table/offer thumbnail을 상단에 고정한다. 성공은 별도
congratulations page가 아니라 save fill, joined state, checkout return으로 보인다.

**상태·실패·복귀**

`ReturnToCta` allowlist와 complete gate plan을 유지한다. cancel은 정확한 opener,
failure는 같은 sheet와 입력, retry는 pending CTA를 보존한다. duplicate callback은
mutation을 반복하지 않는다. Account 성공은 Person/Age/Payment를 바꾸지 않는다.

**Acceptance criteria**

- [ ] sheet 제목이 원 행동마다 달라지고 generic gate 언어가 첫 viewport에 없다.
- [ ] primary CTA 하나만 경쟁한다.
- [ ] 성공 시 원 CTA가 정확히 한 번 실행된다.
- [ ] cancel/failure/reload/back-forward에서 context와 focus가 보존된다.

**PRD 보존**: `REQ-005`, `REQ-008`, `REQ-011`; Account 독립; v3 return allowlist;
save/Table/message/checkout gating; Guest discovery unaffected; exact one-shot return.

## FL-011 · Save / My Korea

**현재 문제**

저장 완료를 설명 modal로 알리거나 My Korea를 큰 카드와 설명 block의 관리자 화면처럼
구성하면 여행 기억이라는 가치가 약하다. saved row가 map context와 다른 navigation
문법을 쓰면 Back/Forward가 예측되지 않는다.

**목표 경험**

Save icon 한 번으로 장소가 개인 지도에 붙고, My Korea에서 도시 지도와 시간순
memory strip으로 다시 찾는다.

**새 모바일 시퀀스**

`venue Save tap → 필요한 경우 FL-010 → icon fill + map pin echo → My Korea →
saved map/timeline → row tap → canonical city→peek → detail → Back/Forward/reload`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| 저장 성공 문장 modal, 반복 `local/device` 설명, 큰 빈 summary 카드 | saved activity 방법, reset 설명 | 저장 icon, 장소 이미지·이름·도시, date, map/timeline, retry |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| save accessible name | 저장 | Save | 保存 |
| saved | 저장됨 | Saved | 保存済み |
| empty primary | 지도에서 찾아보기 | Find places on the map | 地図で探す |
| retry | 다시 저장 | Try saving again | もう一度保存 |

**시각 장치**

bookmark/heart fill과 160~220ms pin echo로 결과를 알린다. My Korea는 장소 thumbnail이
있는 compact timeline과 mini-map을 주 객체로 하고, reputation/identity 설명은 별도
section으로 둔다.

**상태·실패·복귀**

save failure는 원 venue에서 inline toast+Retry로 보이고 선택 장소를 유지한다. reload
후 persisted Saved가 남는다. saved row는 canonical city→peek history를 만들며 opener
focus를 복원하고 private state를 URL에 노출하지 않는다.

**Acceptance criteria**

- [ ] 저장 성공에 별도 설명 화면이 없다.
- [ ] empty/loading/error가 bottom nav나 sticky CTA와 겹치지 않는다.
- [ ] saved row→peek→detail→Back/Forward/reload가 동일 장소와 focus를 보존한다.
- [ ] 320px에서 최소 두 saved row의 핵심 정보가 과도한 card chrome 없이 보인다.

**PRD 보존**: `REQ-005`, `REQ-016`; Account-gated save; persistence; failure/retry;
canonical B history; discovery reset과 ID session reset 분리; My Korea milestone 접근.

## FL-012 · Local signal / first mission

**현재 문제**

`first mission`, reputation 축, privacy, photo 기술 상태를 모두 설명하면 사용자의
단순한 질문인 `지금 여기는 어때요?`가 사라진다. form 전에 gate를 열어도 맥락이
끊기고, form 후 gate가 draft를 잃어도 신뢰가 깨진다.

**목표 경험**

장소 상세에서 분위기 pictogram을 탭하고 선택적으로 사진/메모를 더한 뒤 제출한다.
필요한 확인은 제출 시 JIT로 열리며 작성 내용은 그대로 남는다.

**새 모바일 시퀀스**

`venue → 지금 분위기 → icon chips → optional note/photo preview → Submit →
Account gate → Person gate → same draft → success ripple on venue/My Korea`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| `mission`, Visit/Contribution 점수 설명, provider, 업로드 pipeline, 반복 privacy 문구 | 이 기기 보존 범위, 평판 축 변화, 사진 처리 세부 | 장소, signal choices, optional note/photo, submit, photo error/retry/remove |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| title | 지금 여기는 어때요? | What is it like right now? | 今の様子は？ |
| photo | 사진 추가 | Add photo | 写真を追加 |
| primary | 남기기 | Share | 共有する |
| discard | 작성 내용 지우기 | Discard draft | 下書きを削除 |

**시각 장치**

혼잡·분위기·대기 같은 source-backed choice만 icon+short label chips로 보여준다. 사진은
실제 thumbnail과 remove target으로, 성공은 장소 heat를 즉시 조작하지 않고 작은
contribution ripple과 My Korea activity로 표현한다.

**상태·실패·복귀**

gate가 열릴 때 venueId, note, selected chips, photo preview를 보존한다. photo decode/
prepare 실패는 thumbnail slot에서 Retry/Remove한다. cancel 시 draft 유지/폐기를 한
번만 묻는다. 같은 `venueId+subjectRef+evidenceRef`는 중복 적용하지 않는다.

**Acceptance criteria**

- [ ] draft 작성 중 Account/Person 설명이 보이지 않는다.
- [ ] gate cancel/failure/retry 뒤 chips/note/photo가 그대로다.
- [ ] photo failure가 전체 form을 막지 않는다.
- [ ] success가 Person, Meetup, stamp, public heat를 바꾸지 않는다.
- [ ] privacy truth는 사진 선택/제출 시 한 번만 명확하다.

**PRD 보존**: `REQ-003`, `REQ-007`, `REQ-009`, `REQ-015`; Account+Person;
browser-local photo; fail/replace/retry; idempotency; Visit/Contribution만 변경;
Meetup/stamp/Person/public heat 불변.

## FL-013 · Manual 19+ proof

**현재 문제**

지도 위 19+ control에서 generic identity setup으로 이동하면 사용자는 왜 지금
확인하는지 잊는다. proof 저장에 Account가 필요하다는 이유로 proof 시작부터 계정을
강제하면 Guest-first 계약도 깨진다.

**목표 경험**

19+ chip을 누르면 야간 장소를 보기 위한 확인이라는 사실만 이해하고 진행한다.
Guest도 확인할 수 있고, Account가 없으면 이번 session에만 유지된다.

**새 모바일 시퀀스**

`city map/locked alcohol CTA → 19+ sheet → reason + consent → check → After19 또는
원 alcohol CTA one-shot 재개 → 선택적으로 이후 Account에서 proof 보관`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| K-Tour ID marketing, Person/Payment 설명, `on-device`, provider stepper | 확인 방식, expiry, session/account 보관 차이 | 19+ 이유, consent, 이번 session 상태, failure/retry, off |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| title | 19+ 장소 보기 | View 19+ places | 19+のお店を見る |
| primary | 19+ 확인 | Check 19+ | 19+を確認 |
| cancel | 기본 지도 유지 | Keep standard map | 通常の地図を使う |
| expiry | 다시 확인 | Check again | もう一度確認 |

**시각 장치**

map의 19+ chip과 sheet의 icon을 동일하게 써 연속성을 만든다. 성공 시 chip이 selected
state로 morph하고 지도가 제자리에서 dark theme로 전환한다. Account badge는 보이지
않는다.

**상태·실패·복귀**

취소·실패는 기본 지도와 query/filter/camera/selection을 그대로 유지한다. 성공은
`AGE-VERIFIED`만 변경하고 `OPEN_AFTER19` 또는 원 alcohol CTA를 한 번 재개한다.
expiry는 기본 지도+reason status로 돌아가며 Retry를 제공한다.

**Acceptance criteria**

- [ ] Guest가 Account/Person/Payment 없이 proof를 시작할 수 있다.
- [ ] Account가 없으면 session-only임을 저장 순간에만 설명한다.
- [ ] failure/expiry 뒤 기본 탐색이 막히지 않는다.
- [ ] 성공은 원 CTA 또는 After19로 정확히 한 번 복귀한다.

**PRD 보존**: `REQ-012`; manual proof; Guest start; Account only for persistence;
independent Age state; failure/expiry/retry; exact `OPEN_AFTER19` return.

## FL-014 · Auto After19

**현재 문제**

자동 전환을 큰 modal과 긴 설명으로 알리거나, dark theme가 도로·지명·장소 맥락까지
지우면 사용자는 기능을 이해하기 전에 길을 잃는다. neon heat만 남는 검은 canvas는
지도라기보다 효과 화면이다.

**목표 경험**

검증된 사용자가 19시 이후 앱을 열면 같은 지도 위에서 야간 장소가 자연스럽게
강조된다. 작은 상태 banner로 즉시 끌 수 있고, 선택·검색·filter는 전혀 움직이지 않는다.

**새 모바일 시퀀스**

`app resume/time reevaluation → four guards 통과 → 같은 MapLibre camera에서 240ms
theme crossfade → compact 19+ status + Turn off → manual off 시 즉시 light 복귀`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| full-screen mode explanation, `policy preview`, temperature 숫자, 반복 19+ copy | 자동 전환 조건·expiry, ONDO 자체 policy truth | 19+ selected control, off action, 장소·도로·지명, expiry reason/recheck |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| status | 19+ 장소가 켜졌어요 | 19+ places are on | 19+のお店を表示中 |
| immediate action | 끄기 | Turn off | オフにする |
| expired | 19+를 다시 확인해 주세요 | Check 19+ again | 19+を再確認してください |

**시각 장치**

light와 동일한 road/place label 대비와 marker geometry를 유지한다. canvas만 charcoal,
heat aura만 plum→coral neon으로 전환한다. banner는 한 줄, 44px off target이며 한 번
상태 확인 뒤 compact chip으로 축소된다.

**상태·실패·복귀**

`AGE-VERIFIED + unexpired + KST≥19 + auto on + session manual-off 아님`의 네 guard를
모두 요구한다. 계산 실패/expired는 standard ONDO로 fail closed한다. manual off는
session 동안 우선하며 resume이 다시 켜지 않는다. selected venue와 filter를 보존한다.

**Acceptance criteria**

- [ ] 네 guard 중 하나라도 false면 자동 전환하지 않는다.
- [ ] dark map에서도 도로·지명·선택 place가 WCAG 대비로 읽힌다.
- [ ] mode change 전후 camera/query/filter/selection/geometry가 동일하다.
- [ ] reduced motion에서는 duration 0이지만 status와 focus 결과는 동일하다.

**PRD 보존**: `REQ-012`; four auto guards; manual-off precedence; expiry reason/retry;
night-category subset only; official legal/alcohol/open-hours claim 금지; D-15 geometry.

## FL-015 · Optional public profile

**현재 문제**

From/Lives in/Languages를 하나의 profile card나 verification badge로 묶으면 사용자가
모두 공개한다고 오해한다. identity와 reputation의 큰 요약 점수도 안전 보증처럼
읽힌다.

**목표 경험**

사용자는 Table에서 보여줄 필드만 행별로 켜고, 실제 상대에게 보이는 mini preview를
확인한 뒤 저장한다. 기본은 모두 비공개다.

**새 모바일 시퀀스**

`Table/Profile entry → From/Lives in/Languages row별 value+visibility switch → live
mini preview → Save → 원 Table/My Korea 복귀`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| `verified profile`, 종합 trust score, 국적 기반 matching, 공개 이점 marketing | 각 필드 출처·수정 방법 | 세 필드 값, field별 toggle, 상대에게 보일 preview, save/cancel/error |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| title | 프로필에 보일 정보 | What others can see | 他の人に見える情報 |
| helper | 선택한 항목만 보여요 | Only selected fields are shown | 選んだ項目だけ表示されます |
| primary | 공개 설정 저장 | Save visibility | 公開設定を保存 |

**시각 장치**

각 row의 eye/hidden state와 Table avatar preview를 연결한다. 국가 flag만으로 From을
표현하지 않고 text value를 보조한다. 공개되지 않은 field는 preview에서 실제로
사라진다.

**상태·실패·복귀**

cancel은 기존 public values를 유지한다. 저장 실패는 toggle 선택을 보존하고 inline
Retry를 제공한다. 성공은 선택된 필드만 Table에 반영하며 Person/Identity/평판 점수를
바꾸지 않는다.

**Acceptance criteria**

- [ ] 세 필드가 독립 toggle이며 default private다.
- [ ] mini preview와 실제 Table card 공개값이 일치한다.
- [ ] 저장 실패/취소가 기존 공개 상태를 손상하지 않는다.
- [ ] 국적·성별 자동 matching과 안전 점수가 없다.

**PRD 보존**: `REQ-008`, `REQ-015`; self-declared explicit consent; field-level
visibility; Account requirement; error/retry; optional profile ≠ identity/reputation.

## FL-016 · Evidence / merchant trait

**현재 문제**

OpenDID, EAS, envelope, issuer, hash, trait 같은 내부 단어가 장소 상세의 첫 화면에
나오면 사용자는 자신의 질문인 `카드가 되나`, `영어 메뉴가 있나`의 답을 찾기 어렵다.
반대로 긴 disclaimer를 삭제만 하면 contract-only fact가 안전·입장 보증으로 보인다.

**목표 경험**

사용자는 장소별 fact를 `확인됨 / 정보 없음 / 오래됨`의 상태로 즉시 보고, 필요할 때
출처와 최신 시점을 펼친다. 어떤 상태도 장소 전체의 안전을 의미하지 않는다.

**새 모바일 시퀀스**

`place facts → fact row 선택 → compact evidence sheet → result/status + checked time →
source details disclosure → close/back to exact place section`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| 별도 `Can I Go` 제품, provider architecture, EAS/OpenDID 동치 암시, 전체 안전 문구 | source adapter, issuer, evidenceRef/hash, canonical envelope, contract-only truth | fact name, accepted/unknown/stale/error, checked time, refresh/retry |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| fact states | 출처 확인 · 정보 없음 · 오래됨 | Source checked · Unknown · Outdated | 出典あり・情報なし・古い情報 |
| primary | 출처 보기 | View source | 出典を見る |
| failure | 다시 확인 | Try again | もう一度確認 |

**시각 장치**

확인됨은 check, 오래됨은 clock, unknown은 question mark로 색 없이도 구분한다. shield는
전체 안전 보증으로 오해될 수 있어 사용하지 않는다. 한 fact의 상태만 강조하고 장소
전체 card를 green/red로 칠하지 않는다.

**상태·실패·복귀**

stale/unknown/error를 eligible로 승격하지 않는다. Retry는 같은 fact만 재조회한다.
close/back은 동일 venue와 detail section/focus를 복원한다. adapter failure는 다른
place facts와 탐색을 막지 않는다.

실제 issuer/adapter가 연결되지 않은 branch에서 `새로 확인`처럼 보이는 행동을
제공하지 않는다. 사용자가 세부 정보를 열면 `연결된 출처가 없어 새 확인은 할 수
없어요`를 그 상태에서 한 번만 보여준다.

**Acceptance criteria**

- [ ] 사용자가 기술 용어 없이 fact의 상태와 최신 시점을 이해한다.
- [ ] unknown/stale/error가 confirmed 또는 안전 보증처럼 보이지 않는다.
- [ ] OpenDID와 EAS는 별도 adapter로 유지되고 실제 EAS 연동을 주장하지 않는다.
- [ ] 320px에서 상태 row와 Retry target이 겹치지 않는다.

**PRD 보존**: `REQ-004`, `REQ-013`, `REQ-014`; canonical envelope; separate adapters;
contract-only/deferred truth; stale/unknown/error; limited merchant trait, no safety guarantee.

## FL-017 · Payment KYC

**현재 문제**

checkout 전에 Account, wallet setup, identity, 19+, Payment를 한꺼번에 보여주면 결제
확인이 무엇을 위해 필요한지 모호하다. generic K-Tour ID setup으로 빠지면 merchant와
amount를 잃고, 성공이 다른 gate까지 완료한 듯 보인다.

**목표 경험**

사용자는 결제를 확정하려는 바로 그 순간 merchant와 KRW 금액을 보면서 payment
확인이 필요한 이유·동의만 처리하고 같은 confirm 단계로 돌아온다.

**새 모바일 시퀀스**

`checkout review → Confirm payment → merchant/amount anchored Payment sheet → consent →
checking → verified → same confirm action one-shot → receipt`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| Person/Age/K-Tour ID 소개, provider/network/ticker, `test/simulated` title | provider 미연결, 실제 금액 이동 없음, 보존 범위, technical asset | merchant, KRW amount, payment reason, consent, failure/retry, cancel |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| title | 결제를 위한 확인 | Confirm for payment | 支払いの確認 |
| primary | 확인하고 결제 계속 | Confirm and continue | 確認して支払いへ |
| cancel | 결제로 돌아가기 | Back to payment | 支払いに戻る |

**시각 장치**

merchant thumbnail과 `60,000 KRW`를 sheet top anchor로 유지한다. 확인 성공 icon은
sheet 안에서 짧게 morph한 뒤 checkout confirm으로 돌아가며 별도 dashboard를 열지 않는다.

**상태·실패·복귀**

failure/expired는 결제하지 않고 same sheet에서 Retry한다. cancel은 checkout의
merchant/amount/method/scroll로 복귀한다. success는 `PKY-VERIFIED`만 바꾸고
Account/Person/Age/stamp를 변경하지 않으며 `START_CHECKOUT`을 한 번 재개한다.

**Acceptance criteria**

- [ ] Payment KYC는 confirm payment 직전 외에는 선제 노출되지 않는다.
- [ ] sheet 전 구간에서 merchant와 금액을 잃지 않는다.
- [ ] failure/cancel에서 결제·자산·stamp mutation이 없다.
- [ ] success가 Person/Age 또는 실제 provider 연결로 표현되지 않는다.

**PRD 보존**: `REQ-005`, `REQ-011`; independent `PKY-*`; Account prerequisite;
failure/expiry/retry; no payment on failure; exact one-shot `START_CHECKOUT`; D-13.

## FL-018 · Labs wallet / bridge

**현재 문제**

기술 데모가 consumer wallet에 섞이면 KRW balance가 실제 custody이고 USDC/USDT/OOKRW
bridge가 동작한다고 오해한다. 반대로 모든 단계에 `simulated/test`를 반복하면 Labs도
읽기 어려운 disclosure wall이 된다.

**목표 경험**

일반 Wallet은 여행 잔액과 혜택만 보여주고, 사용자가 명시적으로 Labs에 들어왔을 때
한 번의 truth acknowledgement 뒤 signer·assets·quote·bridge phase를 실험한다.

**새 모바일 시퀀스**

`Settings/technical details → Labs intro truth 한 번 → acknowledge → signer fixture →
USDC/USDT/OOKRW separate asset 선택 → quote → source confirmed → destination finality →
receipt 또는 failure/timeout → assets unchanged/updated only by valid terminal fixture →
optional badge simulation`

**정보 처리**

| 제거 | 접기 | 유지 |
|---|---|---|
| main nav의 bridge/chain jargon, consumer balance의 token ticker, 단계마다 반복 truth | adapter envelope, raw IDs/hash, network detail, timeout diagnostics | Labs label, 한 번의 no-real-money truth, exact `Target network: Sui Testnet · Simulated`, separate assets, quote expiry, ordered phases, retry/cancel |

**CTA·카피**

| 역할 | KO | EN | JA |
|---|---|---|---|
| entry title | 기술 실험실 | Labs | ラボ |
| truth | 실제 자산이나 금액은 이동하지 않아요 | No real assets or money move | 実際の資産やお金は動きません |
| primary | 실험 시작 | Start experiment | 試してみる |
| quote | 견적 보기 | Get quote | 見積もりを見る |
| cancel | 자산 변경 없이 나가기 | Exit without changes | 変更せず終了 |

**시각 장치**

Labs는 consumer surface와 다른 technical frame을 허용하되 한 화면 한 phase를 지킨다.
source와 destination은 방향선과 두 개의 독립 status node로 표현한다. `confirmed`와
`final`을 같은 green check로 합치지 않는다. asset별 숫자는 별도 row로 유지한다.

**상태·실패·복귀**

acknowledgement 전 signer/quote action은 없다. quote expiry·timeout·source failure·
destination failure는 해당 phase에서 Retry하며 잔고는 불변이다. destination finality
전 success나 balance increase를 표시하지 않는다. badge 취소는 My Korea로 복귀한다.

**Acceptance criteria**

- [ ] consumer Wallet 기본 화면에 OOKRW/USDC/USDT/network가 없다.
- [ ] Labs 진입 시 no-real-money truth를 한 번 분명히 확인한다.
- [ ] USDC, USDT, OOKRW를 합친 USD 원장으로 표현하지 않는다.
- [ ] source confirmed와 destination finality가 독립 상태다.
- [ ] failure/timeout/cancel에서 assets와 badge가 불변이다.
- [ ] zkLogin을 KYC나 범용 wallet/account로 설명하지 않는다.

**PRD 보존**: `REQ-004`~`REQ-006`, `REQ-014`, `REQ-016`; acknowledgement;
optional zkLogin signer; separate assets; ordered bridge; simulated Sui Testnet truth;
AMM deferred; adapter separation; opt-in badge; failure invariance.

## 4. K-Tour ID와 ONDO를 연결하는 권장 서사

PDF의 `identity → trust profile → tourism services → benefit/settlement` 서사를 그대로
한 onboarding에 넣으면 현재 PRD의 Guest-first와 독립 gate 계약을 깨뜨린다. 대신
다음처럼 **행동을 통해 연결**한다.

```text
여행 의도·취향
  → 즉시 개인화된 ONDO 지도
  → 저장은 Account만 JIT
  → 사람·현장 상호작용은 Person만 JIT
  → 19+ 콘텐츠는 Age만 JIT
  → 결제 확정은 Payment KYC만 JIT
  → 각 성공은 원 장소·Table·checkout으로 정확히 복귀
  → My Korea가 저장·방문·Table·혜택을 한 여행 기억으로 묶음
```

K-Tour ID는 모든 것을 한 번에 푸는 `master pass`가 아니다. 필요한 확인을 한곳에서
관리하는 개인 travel credential container이며, preference는 credential이 아니다.
이 구분을 지켜야 ONDO와 K-Tour ID가 긴밀하면서도 정직하게 연결된다.

## 5. 구현 우선순위

1. **P0 gate grammar와 returnTo**: FL-002/005/006/010/013/017의 sheet를 한 문법으로
   묶고, 현재 행동 하나와 필요한 axis 하나만 보이게 한다.
2. **P0 truth/causality**: FL-004의 payment→visit→stamp를 사건 세 개로 분리하고,
   FL-001/014/016/018의 source·simulation·status 의미를 보존한다.
3. **P1 onboarding compression**: FL-007~009를 같은 `intent → tastes → map` skeleton으로
   합치되 저장 state와 later JIT route는 persona별로 유지한다.
4. **P1 map/detail density**: FL-001의 floating controls를 우선순위화하고 peek/detail의
   source·방법론을 접는다. MapLibre/D-14/D-15는 변경하지 않는다.
5. **P1 social/personal hierarchy**: FL-003/011/012/015의 giant hero와 설명 카드를
   실제 시간·자리·사진·지도·공개 preview로 교체한다.
6. **P2 polish**: 공통 sheet spacing/type/motion, icon accessible name, KO/EN/JA
   line-break, 320/390/430과 short-landscape를 동일 component contract로 봉인한다.

## 6. D1 반려 조건

아래 중 하나라도 있으면 `Toss-grade`로 승인하지 않는다.

- 첫 viewport에서 primary CTA 두 개가 같은 무게로 경쟁한다.
- 원 action과 무관한 Account/Person/Age/Payment 상태를 한 gate에 나열한다.
- `preview`, `simulated`, `test`, `on-device`, provider/network 이름이 정상 소비자
  제목·CTA에 반복된다.
- 기술 문구를 지운 자리에 명확한 state, hierarchy, interaction이 생기지 않았다.
- 오해를 막는 truth까지 장식 문구와 함께 삭제했다.
- 성공·취소·실패 뒤 route만 맞고 camera/filter/selection/scroll/focus/draft가 다르다.
- 제주 editorial을 official/scored로, ONDO field를 live popularity/crowd/safety로 말한다.
- Payment success가 stamp를 올리거나 Person/Age를 바꾼다.
- After19 dark map에서 도로·지명·selected place가 사라진다.
- 320/390/430 중 하나에서 44px target, CTA 접근, text zoom, KO/EN/JA 의미 동등성이
  깨진다.

## 7. PRD 삭제 방지 원장

| Flow | 반드시 남는 기능·상태 | 단순화가 허용하는 것 |
|---|---|---|
| FL-001 | Guest map/search/detail/directions, Map/List, actual coordinates, three-city truth, fallback | 기록 수·방법론·source metadata 접기 |
| FL-002 | Age-only, exact venue, expiry/retry | provider·다른 gate 설명 접기 |
| FL-003 | six facts, gates, member chat/image, check-in/feedback/safety | hero·중복 preview 문구 축소 |
| FL-004 | KRW/OOKRW boundary, Payment KYC, receipt, separate unique visit, stamp, badge | consumer ticker·network 숨김 |
| FL-005 | CX fixtures, Person-only, exact gated action | OmniOne/DID 전면 노출 접기 |
| FL-006 | supported/unsupported/passport alternate | provider status 반복 제거 |
| FL-007 | short-trip intent/preferences, Guest fallback | eKYC 선제 노출 제거 |
| FL-008 | local intent/defaults, Guest fallback, later CX | nationality/KYC onboarding 제거 |
| FL-009 | resident intent/defaults, Guest fallback, later Residence | legal-status onboarding 제거 |
| FL-010 | Account-only, allowlisted one-shot return | generic system-state prose 제거 |
| FL-011 | save persistence/error/retry/history | success modal·admin cards 제거 |
| FL-012 | draft/photo retry, Account+Person, Visit/Contribution only | mission·score 설명 접기 |
| FL-013 | Guest age proof, session/account persistence split | master identity setup 제거 |
| FL-014 | four guards, manual off, expiry recovery | full-screen explanation 제거 |
| FL-015 | field-level explicit public consent | aggregate trust/profile claim 제거 |
| FL-016 | accepted/unknown/stale/error, adapter boundary | protocol identifiers 접기 |
| FL-017 | Payment-only, merchant/amount exact return | Person/Age/wallet marketing 제거 |
| FL-018 | acknowledgement, separate assets, ordered phases, invariance | 반복 disclaimer·consumer exposure 축소 |

이 원장의 `제거`는 기능·상태·truth 삭제가 아니다. 사용자 결정에 필요 없는 설명을
접거나 위치를 옮기는 것이며, 18개 flow의 `ENTRY / DECISION / CANCEL / ERROR / RETRY /
TERMINAL / RETURN` 126 checkpoint(`123 ACTUAL / 3 reasoned N/A`)는 모두 유지해야 한다.
