# ONDO Visual & Interaction Specification

상태: `PIXEL/INTERACTION BASELINE · 2026-08-19`
대상 릴리스: `ONDO Frontend Demo Candidate v2`
기준 viewport: `390×844`, `430×932`, desktop smoke
지도: Leaflet 1.9.x + 실제 좌표 + OSM-compatible raster tile

이 문서는 화면 구조, 상태 전이, 반응형, 접근성, 픽셀 검수 기준을 고정한다. 현재 `/ondo` prototype은 시각 참고 자료이며 source of truth가 아니다.

---

## 1. 제품 시각 방향

ONDO는 `발자취` 계열의 절제된 여백·기록 감각과 현대적인 대동여지도 질감을 참고하되, 지도와 정보의 정확성을 장식보다 우선한다.

### 가져올 것

- 따뜻한 종이색 canvas와 충분한 여백
- 작은 점·선·스탬프로 여행의 흔적을 나타내는 방식
- 한 화면에 하나의 중심 행동
- 얇은 경계, 조용한 그림자, 이미지보다 정보가 먼저 보이는 card
- 전국→도시→동네→장소가 자연스럽게 깊어지는 감각

### 가져오지 않을 것

- 특정 앱의 logo, icon, layout을 그대로 복제
- 가독성을 해치는 초소형 text
- 실제 지도 위에 임의 좌표의 장식 marker
- 모든 영역에 전통 문양·붓글씨를 붙이는 테마파크식 한국성
- 광택 gradient, 과한 glassmorphism, 지속 pulse animation
- heat를 실제 면적 전체에 번지는 KDE heatmap으로 표현

### Modern Daedongyeojido layer

- 한국 해안선, 산줄기, 물길은 낮은 대비의 비상호작용 overlay다.
- 실제 도로·장소·pan/zoom은 Leaflet tile과 실제 geometry가 담당한다.
- 유산 layer는 장소 zoom에서 자동 약화되며 marker·도로를 가리지 않는다.
- attribution은 항상 보인다. 장식 layer가 tile/provider attribution을 덮지 않는다.

---

## 2. Design tokens

### Base

| Token | Value | 용도 |
|---|---:|---|
| `--canvas` | `#F6F3EC` | day background |
| `--surface` | `#FFFDF8` | sheet/card |
| `--ink` | `#191816` | primary text |
| `--muted` | `#6F6A63` | secondary text |
| `--line` | `rgba(25,24,22,.14)` | border/divider |
| `--positive` | `#3F6C55` | success, not heat |
| `--danger` | `#B43E31` | error |
| `--focus` | `#1D66D1` | keyboard focus |

### ONDO heat

색·숫자·label을 항상 함께 쓴다. 색만으로 단계를 구분하지 않는다.

| Level | Score | Fill | Text | Stroke |
|---|---:|---|---|---|
| `low` | 0–39 | `#EFE1B7` | `#191816` | `#6B6255` |
| `warming` | 40–59 | `#EBC463` | `#191816` | `#6B5425` |
| `rising` | 60–74 | `#E6843B` | `#191816` | `#794421` |
| `hot` | 75–89 | `#C94832` | `#FFFDF8` | `#7C2E23` |
| `peak` | 90–100 | `#7A2048` | `#FFFDF8` | `#4B122C` |
| `limited` | null | `#CFCAC0` | `#191816` | `#706B64`, dashed |

### After 19

| Token | Value |
|---|---:|
| `--night-canvas` | `#11131A` |
| `--night-surface` | `#1B1E26` |
| `--night-ink` | `#FFFAF4` |
| `--night-muted` | `#B8B5BA` |
| `--night-accent` | `#F05A91` |
| `--night-line` | `rgba(255,255,255,.16)` |

Night mode에서도 ONDO heat fill은 그대로 유지하되 white 2px keyline으로 배경과 분리한다.

### Typography

`Noto Sans KR`, `Inter`, system sans 순서. 장소 한국어 이름에 별도 서체를 강제하지 않는다.

| Role | Size/Line | Weight |
|---|---:|---:|
| Display | 28/34 | 650 |
| Screen title | 24/30 | 650 |
| Section title | 18/24 | 650 |
| Card title | 16/22 | 650 |
| Body | 14/20 | 400–500 |
| CTA/control | 14/20 | 650–700 |
| Metadata | 12/16 | 500 |
| Eyebrow | 11/14 | 700, letter spacing `.08em` |

9–10px 본문/CTA는 금지한다. 지도 attribution처럼 provider가 통제하는 보조 정보만 예외다.

---

## 3. App shell과 navigation

### Mobile shell

- 실제 모바일 폭에서는 border·fake device frame 없이 `100vw × 100dvh`를 쓴다.
- top safe area: `env(safe-area-inset-top)`; bottom nav: `env(safe-area-inset-bottom)` 포함.
- map은 전체 content canvas이며 header와 bottom sheet가 위에 겹친다.
- header는 scroll content가 아니라 map overlay다. top 12px, 좌우 16px.

### Desktop

- `min-width: 801px`에서 앱 canvas `430px`, 최대 높이 `900px`, 중앙 정렬.
- 외부 배경은 `#DDD8CC`; 제품과 무관한 review rail은 배포 후보에서 제거한다.
- keyboard focus와 wheel zoom이 외부 page가 아니라 현재 map/sheet 문맥에서 예측 가능해야 한다.

### Bottom navigation

4개만 사용한다.

| Tab | KO | EN | 목적 |
|---|---|---|---|
| ONDO | `ONDO` | `ONDO` | map/discovery |
| My Korea | `My Korea` | `My Korea` | save/stamps/activity |
| Tables | `Tables` | `Tables` | joined/nearby Pulse Tables |
| ID | `ID` | `ID` | account/checks/settings |

- 높이 66px + safe area, 좌우 10px, bottom 10px.
- item hit area 최소 54×54px.
- selected 상태는 배경+icon+text로 표시한다.
- `Labs`는 primary tab이 아니다. `ID > Labs` 또는 10 stamp milestone에서만 진입한다.
- badge는 unread/joined count만 사용하며 99 초과는 `99+`.

---

## 4. Onboarding

### `SCR-ONB` 가치 소개 step

```text
safe area
  ONDO wordmark                 language

  warm map-dot illustration (40–44% height)

  eyebrow
  value title, max 3 lines
  body, max 3 lines

  [시작하기 / Get started]      52px
  [먼저 둘러보기]               48px
bottom safe area
```

- 390×844에서 두 CTA가 scroll 없이 보인다.
- illustration은 한국 shape를 느슨하게 암시하되 실제 marker로 오인되지 않는다.
- `Explore as a guest`는 account/persona 없이 map으로 간다.

### `SCR-ONB` intent step

- 3개 선택 card, 각각 최소 높이 76px.
- radio semantics; card 전체가 44px 이상 hit target.
- 선택 여부는 2px border와 check icon으로 표시한다.
- 국기·성별·인종을 persona icon으로 쓰지 않는다.
- 어떤 선택도 verification을 즉시 시작하지 않는다.
- `Skip`은 항상 visible하고 지도 진입을 막지 않는다.

### `SCR-ONB` preference step

- onboarding 전체는 최대 3단계다. language는 header에서 바꾸고, value→intent→preferences 순서다.
- mood는 multi-select chip, diet는 optional sheet다. 선택하지 않아도 진행 가능하다.
- preference는 시작 filter일 뿐 persona·verification·국적을 추론하지 않는다.
- 마지막 CTA는 account/KYC가 아니라 `ONDO 지도 열기`다.
- 세 persona의 finish/skip/preference failure는 모두 home map으로 간다. Candidate 기본은 Guest이며 Account는 저장·Table 같은 JIT 행동에서 요청한다.
- Account 선택 CTA를 persona별 보조 action으로 제공하더라도 실패가 map 진입을 막지 않고 CX·Residence Card·Passport를 연쇄 시작하지 않는다.

### First guide

- map 진입 뒤 bottom sheet 1회만 표시한다.
- 3개의 서로 다른 열기 disc와 `ONDO 32 / 68 / 92`를 예시로 보인다.
- 본문에 `기온·실시간 인파 아님`을 포함한다.
- 닫으면 지도 interaction에 즉시 focus를 돌린다.

---

## 5. 실제 Leaflet 지도

### 기술 기준

- Leaflet 1.9.x, actual lat/lng, OSM-compatible raster tile.
- 지도 container는 client에서만 mount하고 resize/orientation 후 `invalidateSize({ animate:false })`.
- 대한민국 initial bounds와 min zoom을 적용하되 제주·울릉도·독도를 잘라내지 않는다.
- tile attribution은 왼쪽/오른쪽 하단 중 bottom nav·sheet와 겹치지 않는 위치에 둔다.
- tile failure가 전체 앱 failure가 되지 않는다. 같은 query의 list result를 남긴다.

### 금지된 현재 prototype 패턴

- city/neighborhood/venue를 정적인 `% left/top`으로 배치
- 가까운 marker를 원형으로 자동 이동시켜 실제 위치처럼 표시
- 겹친 marker의 source coordinate를 display coordinate로 저장
- 전국 한가운데 모든 지역을 한 cluster로 합침
- 빈 canvas에 `실제 지도를 불러오는 중`/`연결을 확인`만 남김

### Zoom level

| Level | Leaflet zoom | 보여줄 것 | tap 결과 |
|---|---:|---|---|
| Nation | `6.3–8.49` | 전국 base, 지역 aggregate, 낮은 대비 점묘 | city fitBounds |
| City | `8.5–10.49` | 도시 경계/aggregate, 대표 동네 | neighborhood zoom |
| Neighborhood | `10.5–12.49` | 동네 cluster/cell, 일부 venue | cluster zoom/spiderfy |
| Venue | `12.5–18.5` | 실제 venue point, street context | venue peek sheet |

- zoom threshold에서 level flicker가 없도록 120ms debounce 또는 hysteresis ±0.1을 둔다.
- zoom button, pinch, double tap, keyboard `+/-`가 같은 level transition을 만든다.
- selected venue focus는 최소 zoom 14, header와 peek sheet의 가려짐을 고려해 camera center를 보정한다.

### Loading과 failure

1. mount 즉시 warm paper skeleton과 기존 list cache를 보인다.
2. 800ms 이후에도 tile이 없으면 small non-blocking progress indicator만 보인다.
3. tile error 또는 5초 timeout이면 목록을 foreground로 전환하고 `지도 다시 시도`를 제공한다.
4. retry 중 기존 목록과 선택 상태를 지우지 않는다.
5. offline이면 `오프라인 · 저장된 정보` banner와 cached/fixture timestamp를 표시한다.

빈 성공 상태, 무한 spinner, 화면 전체 blocking alert는 금지한다.

---

## 6. ONDO heat visualization

### 표현 원칙

ONDO는 venue/aggregate마다 하나의 disc로 표현한다. 지도 전체를 번지는 열 영상처럼 만들지 않는다.

```text
fill color       = Heat level
center number    = ONDO score
outer ring       = confidence
caption          = place/neighborhood name
metadata         = freshness + signal count
selection halo   = selected state
19+ corner badge = eligibility requirement
```

### Marker sizes

| Marker | Visual size | Hit target | Text |
|---|---:|---:|---|
| Nation region aggregate | 40–52px | 56×56px | score 14px, city 12px |
| City/neighborhood | 36–46px | 52×52px | score 13px |
| Venue | 32px | 44×44px | no score inside if unreadable; list/peek에 표시 |
| Selected venue | 40px + 4px halo | 48×48px | visible label |
| Limited | same | same | `—`, dashed ring |

크기를 score에 비례시켜 더 중요한 장소처럼 오인시키지 않는다. level별 크기 차이는 최대 8px 이내이며 기본은 동일 크기다.

### Confidence ring

| Confidence | Ring |
|---|---|
| high | 2px solid, 100% opacity |
| medium | 2px solid, 65% opacity |
| low | 2px dashed |
| unknown | 1px dotted |

opacity로 marker 전체를 흐리게 하지 않는다. low confidence도 text contrast를 유지한다.

### Freshness

- map marker에는 6px clock/update glyph 또는 accessible label만 사용한다.
- peek/list/detail에서 `오늘 업데이트`와 absolute timestamp를 보여준다.
- stale은 별도 text와 muted hatch를 사용하며 heat score를 `live`처럼 pulse시키지 않는다.

### Clustering

- cluster 숫자는 member count, center의 큰 숫자는 aggregate ONDO score다. 둘을 한 숫자로 혼합하지 않는다.
- cluster tap은 zoom; 최대 zoom에서도 완전히 겹칠 때만 spiderfy.
- spiderfy connector가 실제 coordinate를 가리킨다.
- selected venue는 cluster에서 분리되며 Escape/지도 tap으로 원상 복귀한다.

### Accessible name

예시:

```text
성수, ONDO 92, 아주 뜨거움, 최근 신호 38개, 근거 충분, 오늘 업데이트
Seongsu, ONDO 92, peak, 38 recent signals, strong signal base, updated today
```

limited 예시:

```text
제주, ONDO 점수 없음, 신호가 더 필요함, 먼저 채워지는 지역
Jeju, no ONDO score, more signals needed, early coverage
```

---

## 7. Map chrome와 synchronized list

### Header stack

```text
row 1: ONDO wordmark/subline     EN/KO · notifications/avatar
row 2: search field             48px
row 3: horizontal filter chips  40px hit height
```

- 전체 header 시각 높이는 156px 이내.
- chip row는 horizontal scroll이며 마지막 chip이 반쯤 잘려도 fade mask로 이어짐을 알린다.
- map/list toggle과 zoom/locate controls는 같은 오른쪽 column에 겹치지 않게 8px 간격.
- map control은 header 하단+12px, peek sheet 상단을 피해 이동한다.

### List synchronization

- 현재 viewport 결과를 같은 정렬로 list에 제공한다.
- marker focus ↔ list card focus/selection이 양방향 동기화된다.
- list card: 88px 이상, image 72×72, Korean name/English name/ONDO/freshness.
- map unavailable이면 list가 `main` surface가 되고 map retry는 secondary CTA다.
- screen reader는 marker가 아니라 list를 주 탐색 표면으로 사용할 수 있다.

---

## 8. Bottom sheets와 modal

### Sheet 규격

| State | 높이 | 용도 |
|---|---:|---|
| Peek | 176–208px + safe area | 선택 venue 요약, 핵심 CTA |
| Medium | `58dvh` | venue/Table detail |
| Full | `min(88dvh, 760px)` | 긴 detail/chat/filter |

- top radius 28px, grabber 36×4px, horizontal padding 18px.
- sheet open 시 map은 유지되며 선택 marker가 sheet 위 공간에 보인다.
- drag threshold 48px 또는 velocity 0.45px/ms. keyboard 사용자는 heading focus와 Close button으로 제어한다.
- modal은 focus trap, `aria-modal=true`, Escape close, close 후 trigger로 focus 복귀.
- destructive action은 bottom sheet 위 별도 confirm dialog로 한 단계만 추가한다.

### Venue peek

```text
grabber
ONDO score + level                freshness
한국어 장소명
English venue name
open/price · Before you go 2 facts
[길찾기] [상세 보기]
```

- 가장 중요한 CTA는 `길찾기` 또는 `상세 보기`; 결제가 첫 CTA가 아니다.
- score와 freshness/confidence를 같은 문장으로 섞지 않는다.

---

## 9. Venue detail

### `SCR-VENUE`

- hero image 16:9, max 220px. 이미지가 없으면 warm paper placeholder와 category icon.
- Close/Save 44×44, image 위 14px inset.
- 장소명, 영어명, 영업 상태, price는 first viewport에 보인다.
- `이 장소의 ONDO` card: score, 단계, freshness, confidence, signal count.
- `가기 전 확인`: yes/conditional/no/unknown을 text+icon으로 표시. Green/Yellow/Red 단일 판정은 만들지 않는다.
- source timestamp와 `방문 전 최신 안내 확인` note.
- sticky bottom actions: `길찾기`, `Table 보기`. Guest도 길찾기 가능.
- Table이 없으면 `근처 Table 보기`; dead CTA 금지.

---

## 10. Account, ID, verification

### Account gate

- 사용자가 누른 CTA 위에 context-preserving sheet로 연다.
- 제목은 action별로 다르게 쓴다(`저장`, `Table 참여`, `메시지`, `결제`).
- body에 `신원 확인은 아직 필요하지 않음`을 표시한다.
- 성공 후 새 홈으로 보내지 않고 `returnTo` CTA를 자동 재개한다.
- cancel은 이전 detail과 scroll/selection을 유지한다.
- failure는 같은 `returnTo`로 retry하거나 Guest 탐색으로 돌아갈 수 있다. invalid/expired token은 `/ondo`로 안전하게 보내고 재시도 안내를 노출한다.
- gate 성공 callback은 token을 한 번만 소비해 중복 저장·중복 join·중복 결제를 만들지 않는다.

### `SCR-ID`

상태를 한 장의 `verified identity card`로 합치지 않는다.

```text
Account             ready / guest
Person check        not started / pending / complete / expired
19+                 not checked / eligible / expired
Payment KYC         not started / pending / complete / failed / expired
Profile visibility  From / Lives in / Languages
──────────────────────────────────────────────────────────────
Labs                secondary row
```

- 각 row는 64px 이상, 독립 상태와 CTA.
- simulation/sandbox/testnet label은 상태 text 바로 옆.
- `Person check complete`에 shield/check icon은 허용하지만 `safe` label은 금지.
- legal name, DOB, document number, credential raw payload를 노출하지 않는다.
- 국적은 공개 card header에 자동 표시하지 않는다.

### Provider flow

- 시작 전 중립 provider sheet, 수행 범위, simulation truth, Cancel을 보인다.
- success/cancel/failure/expired/unsupported 각각 별도 screen state.
- 성공 animation은 240ms 이하의 one-shot check; confetti 금지.
- CX 성공을 ZKP 성공 badge로 시각화하지 않는다.
- Residence Card 미지원은 red failure가 아니라 neutral unavailable state와 대체 경로.

---

## 11. After 19 자동 전환

### Guard

다음 네 guard가 모두 true일 때만 자동 전환한다.

```text
19+ eligibility = eligible
Asia/Seoul hour >= 19:00
autoAfter19 = on
current session != A19-MANUAL-OFF
```

앞의 세 가지는 자동 전환 자격 조건이고 마지막은 해당 세션의 사용자 거부권이다. 하나라도 false면 `A19-OFF` 또는 `A19-MANUAL-OFF`를 유지한다.

### Transition

상태 전이는 `A19-OFF → A19-PROMPT → A19-ON`이다. `A19-PROMPT`는 자동 전환 이유 banner를 준비하는 짧은 내부 상태이며 추가 확인 tap을 요구하지 않는다. banner의 off를 누르면 즉시 `A19-MANUAL-OFF`다.

1. map camera/selection을 유지한다.
2. 180–240ms crossfade로 night token을 적용한다.
3. top banner를 표시한다: 자동 전환 이유 + `기본 지도로 돌아가기`.
4. screen reader `aria-live=polite`로 mode change를 한 번 알린다.
5. banner는 자동으로 완전히 사라지지 않는다. 사용자가 닫아도 mode off control은 header chip에 남는다.

`prefers-reduced-motion`이면 즉시 전환한다.

### Content rule

- `over19_required` venue/event만 잠근다.
- 심야 식당·카페, 야식은 기본 map에도 남는다.
- 19+ 확인이 만료되면 선택 상태를 유지한 채 day mode로 복귀하고 이유 banner를 보인다.
- fixture proof에서는 `19+ 확인 · 시뮬레이션`을 확인 sheet/ID surface에 유지한다.
- banner off 뒤 `A19-MANUAL-OFF`는 같은 tab의 component remount·route 왕복에도 유지한다. 새 session/reset에서만 auto guard를 다시 적용한다.

---

## 12. Pulse Table와 chat/photo

### `SCR-TABLE`

- 장소·시간·남은 좌석·메뉴/예상 비용·언어·주류 조건을 first viewport에 둔다.
- host photo가 실제 인물과 국적을 암시하지 않도록 profile의 `From`은 self-declared label과 visibility 동의가 있을 때만 표시한다.
- `verified host` badge 금지. 필요하면 `Person check complete · Simulated`처럼 범위와 truth를 쓴다.
- gender ratio, dating, nationality pairing control을 두지 않는다.
- Join CTA는 account/person/19+ 중 필요한 최소 gate만 순서대로 실행하고 `returnTo`를 유지한다.

### Joined state

- join 성공 후 CTA는 `대화 열기`; chat unread badge가 Tables tab에 생긴다.
- 중복 join은 idempotent하며 participant count가 두 번 오르지 않는다.
- full/cancelled/expired state에는 설명과 nearby alternative CTA가 있다.
- Guest가 보는 availability와 Account의 membership은 별도다. 로그인했어도 confirmed member가 아니면 direct chat route는 `CHA-LOCKED` 후 Table로 복귀하고 `MSG-*` delivery는 변하지 않는다.

### `SCR-CHAT`

- message list가 first focus target, composer는 bottom safe area 위.
- text bubble 최대 폭 78%, time/status는 12px.
- pending: clock icon + `보내는 중`; failed: danger outline + `다시 보내기`.
- image preview는 4:3 또는 1:1 max 240px; object-fit cover, tap 시 contained preview.
- local preview에는 `로컬 미리보기`를 visually hidden 포함 accessible description으로 표시한다.
- accessible description은 `시뮬레이션에서만 보이며 서버 업로드·저장 없음`을 포함한다.
- upload failure가 text message를 지우지 않는다.
- report/leave는 overflow menu 안에 있되 keyboard 접근 가능.

### Photo picker

- native file input를 완전히 inaccessible하게 숨기지 않는다.
- 선택→preview→교체/삭제→send 순서.
- 10MB/MIME 오류는 input 아래 inline error; toast만 사용하지 않는다.
- 삭제는 unsent preview/failed upload에만 제공한다. sent fixture는 서버 삭제를 가장하지 않으며 신고·나가기만 제공한다.

### `SCR-VENUE` · Local Signal / first mission

- 장소 상세의 secondary CTA `방문 신호 남기기`로 연다. Table/chat 안에 넣지 않는다.
- Account + Person gate를 통과한 뒤 venue·최근 방문·선택 photo·정보 note를 한 sheet에서 확인한다.
- 상태는 draft → local preview → submitting → success/failed/cancelled이며 duplicate evidence는 성공 animation 없이 설명한다.
- Local Signal photo는 `UPL-*`의 `local_signal` context, chat image는 `UPL-*`의 `chat_image` context와 `MSG-*` delivery evidence를 함께 쓴다. fixture·purpose·완료 증거를 공유하지 않고 둘 다 local simulation truth를 가까이 표시한다.
- success에서 Visit/Contribution 중 실제 발생 축만 highlight하고 Person/Identity·Age·Payment KYC는 시각적으로 그대로 둔다.
- success에서도 Stamp·Meetup은 변경하거나 highlight하지 않는다.
- cancel/failure 뒤 venue selection·scroll을 유지하고 `returnTo`로 복귀한다.

---

## 13. Feedback, reputation, stamp

- meetup 종료 후 한 장씩 묻고 progress `1/3` 제공.
- 평판은 4개 축을 각각 row/bar로 표시; 종합 원형 점수 금지.
- `Identity`는 person check event, `Visit`, `Contribution`, `Meetup`은 행동 event.
- 첫 미션 완료 animation에서 올라간 축만 highlight한다. Identity highlight 금지.
- stamp는 2×5 grid, 최소 cell 40×40, 완료에는 fill+check+label.
- 9→10은 240ms 이하 stamp press 후 milestone sheet.
- NFT/badge는 milestone primary CTA가 아니다. `Labs에서 선택적으로 보기` secondary link.

---

## 14. Wallet과 Labs

### Hero mock checkout

- 장소 가격은 `₩12,000`처럼 KRW로 first line에 표시한다.
- 그 아래 `읽기 전용 정산 가설 · OOKRW test token · SIMULATED` row를 분리해 원화 결제수단이나 선택 가능한 tender처럼 보이지 않게 한다.
- Payment KYC pending/failed/expired는 독립 row와 retry/cancel을 가지며 Person·19+ status를 바꾸지 않는다.
- `PAY-SIMULATED-SUCCESS` receipt 뒤 stamp progress는 그대로다. 별도 unique visit 확인이 완료될 때만 9→10 animation을 실행한다.
- 취소·실패·중복 submit은 receipt·balance·stamp를 바꾸지 않고 원 venue/checkout context로 복귀한다.

### 진입 경계

- ID 화면 하단 또는 milestone secondary link.
- 첫 진입에 `실제 자산 이동 아님` acknowledgement sheet.
- Labs header에 persistent truth badge.
- fixture signer·asset·bridge·mint surface에는 locale과 무관하게 exact truth copy `Target network: Sui Testnet · Simulated`를 유지한다.
- Labs를 ONDO 홈처럼 보이게 하지 않는다. background는 neutral technical panel, consumer heat palette 최소화.

### Asset card

```text
USDC · Sui · native          Target network: Sui Testnet · Simulated
available / reserved / pending
Estimated USD value · quote time

USDT · Sui · representation  Target network: Sui Testnet · Simulated
...
```

- USDC/USDT row를 합치지 않는다.
- total이 필요하면 `Estimated USD value`라는 별도 summary이고 asset rows가 바로 아래 보인다.
- OOKRW는 `test token`; 원화 symbol만으로 실제 KRW처럼 꾸미지 않는다.

### zkLogin

- card title `Sui zkLogin signer`.
- connected 시 Sui address 축약과 network만 표시.
- `Account verified`, `KYC complete`, `Multichain wallet` badge 금지.

### Bridge

- source asset/chain → amount → destination asset/chain 세 단계.
- quote와 실제 이동을 혼동시키지 않게 button은 `시뮬레이션 확인`.
- stepper는 `Source submitted → Source confirmed → Relaying → Destination confirmed`.
- source confirmed에서 success color 전체 card 금지; destination pending을 강조한다.
- official Sui↔OmniOne connection으로 보이는 chain logo lockup 금지.
- 실패·refundable은 simulation copy와 reset CTA.
- quote expiry, asset/chain/amount mismatch, duplicate, cancel을 success보다 먼저 negative-state screenshot으로 검수한다.

### AMM · Deferred

- AMM swap/pool/liquidity/price-impact UI는 Candidate에서 렌더링하지 않는다.
- 기술 범위 설명이 필요하면 disabled CTA가 아니라 `이번 후보 범위 제외` 텍스트만 Labs에 둔다.

### Merchant trait · Contract-only

- venue/offer/policy version과 checked/expiry를 한 receipt detail에 표시한다.
- stale/error/mismatch는 eligible green state를 사용하지 않으며 `가기 전 최신 안내 확인`으로 복귀한다.
- trait 결과는 장소 전체의 안전·입장·결제 보증처럼 확장하지 않는다.

### Badge/NFT

- 10 stamps와 explicit consent 전 mint CTA 비활성.
- public metadata preview를 먼저 보인다.
- 신원·국적·19+·부정 평판 field가 0개인지 visual review.
- fixture 성공은 `Badge simulation complete`; explorer link 없음.

---

## 15. Responsive criteria

### 필수 viewport

| Viewport | 기준 |
|---|---|
| `360×800` | 최소 지원 smoke; CTA/검색/nav 잘림 없음 |
| `390×844` | primary KO/EN pixel baseline |
| `430×932` | large mobile baseline |
| `768×1024` | tablet centered/full-height smoke |
| `1440×900` | desktop centered 430px app canvas |

### Layout constraints

- horizontal overflow 0.
- header/search/chips/bottom nav가 서로 겹치지 않는다.
- sheet full state에서 close/heading/primary CTA가 keyboard와 scroll로 도달 가능.
- landscape `844×390`은 map/list 사용 가능, sheet max height 92dvh.
- software keyboard가 chat composer와 focused input을 덮지 않는다.
- EN 200% text zoom에서 core CTA text가 잘리지 않는다. 필요하면 높이를 늘린다.

---

## 16. Accessibility

### Minimum

- text contrast 4.5:1, large text 3:1, status/UI boundary 3:1.
- 모든 interactive target 최소 44×44 CSS px.
- visible focus ring 2px `--focus` + 2px offset.
- icon-only button에 localized accessible name.
- modal focus trap, Escape, focus restore.
- map과 동기화된 semantic list 제공.
- marker accessible name에 이름·score/limited·freshness·confidence 포함.
- score를 색만으로 표현하지 않음.
- loading/success/error는 적절한 `aria-live`; 지속적인 count update는 live region에서 제외.
- drag-only action 없음. sheet snap은 button/keyboard로도 가능.
- screen reader에서 hidden local preview와 simulation truth가 누락되지 않음.

### Motion

- standard duration 180–240ms, map flight 최대 450ms.
- 반복 pulse, shimmer loop 2초 초과 금지.
- `prefers-reduced-motion: reduce`에서 flyTo/crossfade/stamp motion 제거.
- mode change 후 focus가 사라지지 않는다.

---

## 17. State visual matrix

각 surface는 다음 상태를 갖고 픽셀 검수한다.

| Surface | Loading | Empty | Error | Expired/unsupported | Recovery |
|---|---|---|---|---|---|
| Onboarding | n/a | defaults | preference/account failure | n/a | skip→map |
| Map | skeleton+list cache | filter reset | list foreground | n/a | tile retry |
| ONDO score | neutral disc | limited | source note | stale | refresh/list |
| Account | inline progress | guest | failure sheet | recovery required | retry/return |
| Person/19+ | progress steps | not started | failed/cancelled | expired/unsupported | retry/alternate |
| Payment KYC | progress steps | not started | failed/cancelled | expired | retry/checkout return |
| Table | card skeleton | nearby suggestion | join failure | full/closed/cancelled/expired | alternate/return |
| Chat | message skeleton | first prompt | failed message | membership lost | retry/return |
| Local Signal | submitting | empty draft | upload/submit failed | duplicate visit | retry/cancel/venue return |
| Chat photo | preview | choose photo | inline send error | local blob invalid | replace/retry |
| Checkout | confirming | draft | declined | KYC expired | retry/cancel |
| Bridge | stepper | quote | failed | source confirmed only | reset |
| Badge | eligibility check | locked | simulation failed | consent missing | retry/skip |

visible CTA가 눌러도 상태가 바뀌지 않으면 Candidate blocker다.

---

## 18. Pixel-perfect acceptance

### Screenshot set

| PX ID | Visual Test ID | Scenario / Fixture | Viewport | Lang | 필수 포착 |
|---|---|---|---:|---|---|
| `PX-001` | `VIS-MAP-01` | `SCN-001-GUEST-DISCOVER` | 390×844 | EN | nation map+heat+nav |
| `PX-002` | `VIS-MAP-02` | `SCN-001-GUEST-DISCOVER` | 390×844 | KO | Seoul neighborhood |
| `PX-003` | `VIS-MAP-03` | `SCN-001-GUEST-DISCOVER` | 390×844 | EN | venue peek+selected marker |
| `PX-004` | `VIS-MAP-04` | `SCN-001-GUEST-DISCOVER` | 430×932 | EN | venue full sheet+Before you go |
| `PX-005` | `VIS-MAP-05` | `FX-MAP-TILE-FAIL` | 390×844 | KO | list fallback+retry |
| `PX-006` | `VIS-HEAT-01` | `FX-MAP-SEOUL-RECENT` | 390×844 | EN | six-level legend |
| `PX-007` | `VIS-HEAT-02` | `FX-MAP-SEOUL-RECENT` | 390×844 | KO | selected marker+confidence ring |
| `PX-008` | `VIS-HEAT-03` | `SCN-003-TOURIST-AFTER19` | 390×844 | EN | auto banner+night map+off |
| `PX-009` | `VIS-HEAT-04` | `FX-MAP-BUSAN-SEED` | 390×844 | EN | Busan seed/Growing truth |
| `PX-010` | `VIS-ONB-01` | `SCN-011-ONBOARD-SHORT`, `SCN-012-ONBOARD-KOREAN`, `SCN-013-ONBOARD-RESIDENT` | 390×844 | KO | 3 persona cards+skip |
| `PX-011` | `VIS-FLOW-01` | `SCN-003-TOURIST-AFTER19` | 390×844 | EN | age-only simulation truth + exact venue return |
| `PX-012` | `VIS-FLOW-02` | `SCN-004-TABLE-CHAT` | 390×844 | EN | member chat image failed/retry |
| `PX-013` | `VIS-FLOW-03` | `SCN-014-LOCAL-SIGNAL` | 390×844 | KO | Local Signal photo+failure/return |
| `PX-014` | `VIS-FLOW-04` | `SCN-005-CHECKOUT-LABS` | 390×844 | KO | KRW price/OOKRW read-only settlement hypothesis+no stamp |
| `PX-015` | `VIS-FLOW-05` | `SCN-006-STAMP-MILESTONE` | 430×932 | EN | unique visit→10 stamp milestone |
| `PX-016` | `VIS-FLOW-06` | `SCN-007-KOREAN-CX` | 390×844 | KO | simulation truth+return |
| `PX-017` | `VIS-FLOW-07` | `SCN-009-RESIDENCE-UNAVAILABLE` | 390×844 | EN | neutral unavailable+alternate |
| `PX-018` | `VIS-LABS-01` | `SCN-010-LABS-BRIDGE` | 430×932 | EN | assets separated+bridge negative state |
| `PX-019` | `VIS-RWD-01` | `SCN-001-GUEST-DISCOVER` | 360×800 | EN | small mobile |
| `PX-020` | `VIS-RWD-02` | `SCN-001-GUEST-DISCOVER` | 390×844 | KO | primary mobile |
| `PX-021` | `VIS-RWD-03` | `SCN-001-GUEST-DISCOVER` | 430×932 | EN | large mobile |
| `PX-022` | `VIS-RWD-04` | `SCN-001-GUEST-DISCOVER` | 1440×900 | EN | centered shell, no review rail |
| `PX-023` | `VIS-CONNECT-01` | `SCN-004-TABLE-CHAT` | 390×844 / 1440×1000 | EN | confirmed Table chat, local image preview, feedback entry |
| `PX-024` | `VIS-COMMERCE-01` | `SCN-005-CHECKOUT-LABS` | 390×844 / 1440×1000 | EN | simulated checkout receipt, KRW price, OOKRW settlement boundary |
| `PX-025` | `VIS-LABS-01` | `SCN-010-LABS-BRIDGE` | 390×844 / 1440×1000 | EN | separated assets, simulated bridge, merchant trait truth |

### Pass criteria

- 1px unintended seam, clipped radius, scroll bar overlap, attribution obstruction 0개.
- text baseline/vertical center deviation 2px 이내.
- 동일 계층 spacing은 token 기준 ±2px.
- primary CTA와 bottom nav가 safe area/keyboard에 가려지는 장면 0개.
- marker와 장소 실제 좌표 불일치 0개; spiderfy는 connector 증거 필요.
- heat color token 이탈 0개.
- 12px 미만 사용자 정보 text와 44px 미만 control 0개.
- KO/EN ellipsis가 장소명 외 핵심 상태/CTA에 발생하는 장면 0개.
- simulation/unsupported/expired truth label 누락 0개.
- map/list selection mismatch 0개.
- console error와 hydration warning 0개.

시각 diff threshold만으로 승인하지 않는다. 지도 tile은 dynamic mask 처리하고, header/sheet/marker/CTA는 수동 픽셀 검수한다.

---

## 19. Implementation priority

1. 실제 Leaflet mount, bounds, tile fallback, synchronized list
2. source coordinate 기반 ONDO marker/cluster와 zoom hierarchy
3. onboarding→guest map→venue detail
4. account returnTo와 ID 분리 상태
5. After 19 guard·auto banner·off
6. Local Signal/photo와 Table→chat image→feedback를 분리 구현
7. Payment KYC→KRW checkout/OOKRW read-only settlement hypothesis→unique visit→stamp
8. reputation/stamp와 Labs boundary·asset/bridge/badge simulation; AMM은 Deferred
9. KO/EN responsive·a11y·pixel QA

4시간 20분 이후 새 visual motif를 추가하지 않는다. 5시간은 첫 integration 완료 시각이다. Hero가 불완전하면 Labs polish를 중단한다.

---

## 20. Final visual gate

- [ ] `/ondo`가 추상 SVG만이 아니라 실제 Leaflet map을 사용함
- [ ] Nation/City/Neighborhood/Venue 4개 zoom level이 연결됨
- [ ] 임의 marker 이동이 없고 cluster/spiderfy가 actual coordinate를 보존함
- [ ] ONDO score/freshness/confidence/signal count가 시각적으로 분리됨
- [ ] After 19 auto guard와 즉시 off가 동작함
- [ ] non-alcohol late-night content가 기본 지도에 남음
- [ ] account/verification/Labs가 map hero를 가리지 않음
- [ ] Table chat/image pending·failed·retry가 보임
- [ ] Wallet/Labs가 실제 결제·bridge·NFT처럼 보이지 않음
- [ ] 필수 viewport KO/EN screenshot이 pass함
- [ ] 접근성·motion·focus 기준이 pass함
- [ ] Critical/High와 visible dead CTA가 0개임
