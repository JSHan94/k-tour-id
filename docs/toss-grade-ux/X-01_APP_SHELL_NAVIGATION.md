# X-01 · App shell, navigation, brand

상태: `CROSS-FLOW SPEC · PEER-REVIEWED · IMPLEMENTATION READY`

## 1. 책임과 비책임

App shell은 사용자가 현재 어느 공간에 있고 어디로 이동할 수 있는지 알려주며,
모든 화면의 safe area, overlay, scroll, focus를 소유한다. 장소 발견·ID 발급·결제
같은 업무 자체를 설명하거나 대신 수행하지 않는다.

정규 primary destination은 다음 다섯 개를 유지한다.

| ID | 사용자 목적 | 모바일 표식 | 데이터·상태 보존 |
|---|---|---|---|
| Explore | 지도에서 장소 발견 | map pin/atlas | camera, city, filters, selected place |
| My Korea | 저장·최근·방문 기억 | bookmark | saved, recent, memory scroll |
| Tables | 함께 먹을 계획 | two people/table | list filter, selected Table |
| ID · Wallet | 자격·여행 잔액 | pass/wallet | 독립 readiness axes |
| Settings | 언어·취향·데이터 | gear | locale, preferences, disclosures |

Labs는 primary destination이 아니다. 기술 상세 또는 명시적 개발/demo entry에서만
도달한다.

## 2. Mobile dock

- phone에서는 visible text label을 제거하고 아이콘만 둔다.
- 각 tab은 48–56px hit area, 최소 44×44px 실제 target을 가진다.
- 선택 상태는 `near-black 48×48px tile + white pictogram` 한 문법만 사용한다.
  별도 indicator bar, glow, 이중 outline, icon 배경을 겹치지 않는다.
- 다섯 아이콘은 서로 다른 silhouette를 사용하며 1.75px idle/2.25px selected처럼
  stroke 변화 범위를 고정한다.
- first-use에서만 선택된 tab 위에 1회 coach label을 1.5초 또는 다음 tap까지 보여줄
  수 있다. coach는 폭 120px 이하, safe rectangle 12px을 지키고 primary CTA·sheet를
  가리면 표시하지 않는다. 영구 tooltip은 쓰지 않는다.
- `aria-label`은 EN/KO/JA로 목적을 구체적으로 말한다. visible label을 숨기는 것은
  accessible name을 제거하는 일이 아니다.
- tab을 다시 누르면 해당 root로 부드럽게 scroll-to-top한다. 다른 tab으로 갔다
  돌아오면 이전 scroll과 local selection을 복원한다.
- pictogram은 Explore=map-pin/atlas, My Korea=bookmark, Tables=two-person/table,
  ID · Wallet=pass-card, Settings=gear silhouette로 고정한다. 문자·국기·fingerprint만으로
  목적을 표현하지 않고 selected에서도 silhouette를 바꾸지 않는다.

### 권장 모바일 geometry

| 항목 | 값 |
|---|---:|
| dock lateral inset | 12px at 320/360, 16px at 390/430 |
| dock content height | 64px |
| bottom padding | `max(10px, env(safe-area-inset-bottom))` |
| icon optical size | 22–24px |
| selected tile | 48×48px, radius 16px |
| content bottom reserve | dock total height + 16px |

## 3. Desktop·tablet

- 768px 이상에서 rail은 아이콘+짧은 label을 사용할 수 있다.
- rail과 content canvas는 같은 grid를 공유하며 지도·sheet를 가리지 않는다.
- 844×390 short landscape에서는 width 기반 desktop rail을 비활성화하고 compact
  horizontal icon-only dock을 쓴다. full task에서는 dock을 숨기고 task 종료 뒤 원 tab과
  focus를 복원한다. Decision/Detail side sheet가 열려도 dock을 숨겼다가 opener focus와
  함께 복원한다. 같은 viewport에서 dock/rail 중 임의 선택하지 않는다.
- desktop이 mobile composition의 단순 확대판이 되지 않되, 정보 우선순위와
  destination 수는 동일하다.

## 4. Scroll·safe area·overlay 계약

- 페이지 전체와 내부 content가 동시에 scroll하는 구조를 금지한다. shell이 단일
  scroll owner를 지정한다.
- modal open 시 background는 `inert`; close 후 opener로 focus를 돌리고 기존
  scroll position을 복원한다.
- overlay z-order는 `map/content < dock < peek sheet < decision/detail sheet <
  full task < critical confirmation`으로 고정한다.
- sheet가 열렸다고 shell scroll을 0으로 만든 뒤 복구하는 것이 보이면 안 된다.
- header, dock, sheet footer는 `env(safe-area-inset-*)`를 사용한다.
- keyboard open 시 primary CTA는 visual viewport 위에 남고 content는 그 뒤로
  scroll 가능하다.

## 5. 잘림·기울어진 레이어 제거 규칙

다음은 사용자가 반복 지적한 공통 결함이며 임시 CSS로 가리지 않는다.

- decorative pseudo-element에 `transform: rotate(...)`를 사용해 실제 container
  boundary를 만드는 패턴 금지.
- app canvas의 배경 장식은 content clipping과 분리된 non-interactive layer다.
- `overflow: hidden`은 media crop과 정해진 sheet radius 외에는 사용 근거가 필요하다.
- viewport height를 `100vh` 하나로 고정하지 않고 `100dvh`와 safe area를 사용한다.
- 320px, 390px, 430px, 844×390에서 top header와 bottom dock 사이 실제 usable
  rectangle을 snapshot으로 검증한다.
- 임의 `top`, negative margin, 마지막 override로 특정 screenshot만 맞추지 않는다.

## 6. 브랜드 체계

### ONDO

- Explore, place, Tables, My Korea, Settings의 primary consumer brand다.
- near-black ONDO mark/wordmark와 white canvas를 기본으로 한다.
- `溫圖`는 로고 lockup 일부로만 제한하고 body copy 장식으로 반복하지 않는다.

### K-Tour ID

- Person, consent, credential, Payment KYC, travel balance의 context brand다.
- 제공된 공식 lockup은 원본 비율과 clear space를 지킨다.
- K-Tour ID의 blue-purple gradient를 ONDO heat, CTA, 일반 card에 확장하지 않는다.
- favicon/social thumbnail은 production route와 공유 문맥을 확인해 별도 export한다.

### 함께 보이는 경우

`ONDO에서 이 행동을 이어가기 위해 K-Tour ID가 필요하다`는 위계를 사용한다.
두 full wordmark를 같은 크기로 나란히 두지 않는다. ONDO 대상 context를 header에,
K-Tour ID mark를 현재 확인 object에 둔다.

## 7. Header·toast·system feedback

- `PageHeader`는 back 또는 close 중 하나, 제목 하나, 필요하면 상태 하나만 가진다.
- `on-device`, `preview`, provider명, 화면 내부 단계 수를 eyebrow에 반복하지 않는다.
- toast는 저장·언어 변경처럼 되돌리기 쉬운 가벼운 결과에만 쓴다.
- 결제 실패, credential 실패, 데이터 삭제 실패는 inline status 또는 decision
  sheet에 recovery action과 함께 남는다.
- 언어 변경은 같은 화면·scroll·selection을 유지하고 text만 교체한다.

## 8. Motion

| 전이 | 규격 | reduced motion |
|---|---|---|
| tab switch | 160–200ms opacity/translate 4px, scroll restore 후 reveal | 즉시 replace + focus |
| dock selection | 100–140ms scale 0.98→1, tile fill 교체 | fill·border 즉시 변경 |
| peek/decision sheet | 220–280ms emphasized decel | 짧은 opacity |
| full task | 240–320ms shared axis | 즉시 route, 동일 focus |

탭 전환과 지도 camera 이동을 동시에 실행하지 않는다. Explore로 복귀하면 먼저
map context를 복원한 뒤 dock selection feedback을 끝낸다.

## 9. Accessibility·localization

- tab 순서는 DOM·visual·screen reader에서 동일하다.
- selected tab은 `aria-current="page"`; icon은 장식이고 button에 accessible name을 둔다.
- keyboard focus ring은 heat accent가 아니라 고대비 neutral 2px + offset을 쓴다.
- KO/EN/JA accessible name은 줄임말이 아닌 목적을 말한다.
- forced colors에서 selected tile과 unselected icon이 구분된다.
- After19 dock은 selected tile과 dock surface 사이 3:1 boundary 또는 2px neutral border를
  유지하되 별도 indicator bar/glow를 만들지 않는다. forced colors에서는
  `Highlight`/`HighlightText` system color로 같은 tile 문법을 보존한다.
- 200% zoom에서는 dock가 2행으로 바뀌지 않는다. icon-only 구조와 horizontal safe
  spacing을 유지한다.

## 10. Acceptance criteria

- [ ] phone dock에 visible text label이 0개다.
- [ ] 5개 destination과 접근 가능한 지역화 label은 유지된다.
- [ ] selected state는 black tile+white pictogram 하나이며 indicator bar/glow/이중 outline이 0개다.
- [ ] tab 왕복 시 각 tab의 scroll·selection이 복원된다.
- [ ] overlay close 후 opener focus가 복원된다.
- [ ] 320/360/390/430 portrait, 844×390, safe area, keyboard, 200% zoom에서 잘림이 없다.
- [ ] 844×390에서 desktop/icon-only rail이 나타나지 않고 compact horizontal dock 또는 full-task hidden state만 존재한다.
- [ ] decorative layer가 content를 기울이거나 잘라 보이게 하지 않는다.
- [ ] ONDO와 K-Tour ID의 역할이 visual hierarchy로 구분된다.
- [ ] Labs가 primary nav에 나타나지 않는다.

## 11. PRD preservation

- `REQ-005`: 독립 gate와 exact `returnTo`를 shell navigation이 훼손하지 않는다.
- `REQ-018`: mobile-first, KO/EN/JA, tablet/desktop/landscape를 보존한다.
- `FL-001`~`FL-018`: Flow가 tab change 또는 overlay 때문에 초기화되지 않는다.
- persistence clear/reset 동작은 Settings의 명시적 action에서만 발생한다.
