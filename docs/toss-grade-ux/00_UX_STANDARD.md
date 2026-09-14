# ONDO Toss-grade mobile UX standard

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

이 문서는 ONDO 전 화면의 공통 품질 바다. Toss의 공개 제품 글에서 확인되는
`1초 안에 이해`, `One thing per one page`, `Clear CTA`, `Less Policy`,
`Context Based`, `Sleek Experience`, 반복 케이스의 패턴화와 모든 사용자의
접근성을 ONDO에 맞게 해석한다. Toss의 내부 TDS나 공식 승인 문서가 아니다.

참고한 공개 글:

- [크고 복잡한 제품, 과감하게 갈아엎기](https://toss.tech/article/mydoc)
- [토스 디자이너가 제품에만 집중할 수 있는 방법](https://toss.tech/article/toss-design-system)
- [거꾸로 입력하는 가입 화면, 처음에 어떻게 떠올렸을까?](https://toss.tech/article/toss-signup-process)

## 1. 제품의 한 문장과 Golden Journey

> ONDO는 한국의 지금 먹을 곳을 온도로 발견하고, 필요한 순간에만 K-Tour ID와
> 여행 잔액을 이어주는 모바일 지도다.

```text
한국 지도
→ 도시로 부드럽게 줌
→ 동네·장소의 온도 발견
→ 장소 결정
→ 저장·Table·혜택 중 원하는 행동
→ 그 행동에 필요한 최소 확인만 JIT 수행
→ 성공·실패·취소 뒤 같은 장소와 행동으로 복귀
→ My Korea에 여행 기억이 쌓임
```

K-Tour ID, DID, 지갑, settlement, Labs는 Golden Journey를 설명하기 위해
앞에 서지 않는다. 사용자가 저장·함께 먹기·19+·혜택 사용처럼 구체적인 행동을
선택한 순간에만 필요한 만큼 등장한다.

## 2. 열두 가지 공통 원칙

### 2.1 Value before setup

첫 화면은 인증이나 제품 구조가 아니라 실제 한국 지도와 온도를 보여준다.
Guest는 아무 준비 없이 지도·검색·장소·길찾기를 끝낸다.

### 2.2 One decision per viewport

첫 viewport에는 질문 하나, 주 행동 하나, 필요하면 보조 행동 하나만 경쟁한다.
여러 상태를 보여줘야 하면 status object는 한 덩어리로 보이되, 사용자가 지금
결정할 축만 강조한다.

### 2.3 Show the object, not its explanation

- `서울이 뜨겁다`는 문장 대신 지도 위 heat field와 beacon을 보여준다.
- `저장됐다`는 설명 카드 대신 bookmark state와 My Korea의 장소가 바뀐다.
- `혜택이 적용됐다`는 문장 대신 원가→혜택→최종 금액의 숫자 관계를 보여준다.
- `Table이 활발하다`는 문장 대신 사람·좌석·시간·식사 계획을 보여준다.
- `신원 절차가 연결됐다`는 문장 대신 필요한 proof→consent→결과→원 행동 복귀를
  한 sheet에서 진행한다.

아이콘은 의미를 대신할 수 있을 때만 쓴다. 동의, 결제, 삭제, 실패, 공식/편집
경계처럼 오해 비용이 큰 정보는 짧은 텍스트를 함께 둔다.

### 2.4 Context never resets

도시, 지도 camera, query, filter, category, 선택 장소, sheet 높이, scroll,
Table/offer draft와 opener focus는 Gate 전후 동일해야 한다. 새로운 홈이나
ID 탭으로 보내지 않는다.

### 2.5 Progressive disclosure, not concealment

provider·DID·ticker·network·source record·methodology는 기본 decision에서 접는다.
금액·동의·실패·공식성·공개 범위·복귀 결과는 접지 않는다.

### 2.6 Product language, not maker language

일반 화면 제목과 CTA에서 `preview`, `simulated`, `test`, `on-device`, provider
아키텍처 설명을 사용하지 않는다. 실제 연동이 없는 상태에서 오해가 생길 수 있는
결정점에는 사용자가 알아야 할 사건을 한 번 말한다.

예:

- `No real payment provider is connected` → `아직 충전 수단을 연결할 수 없어요`
- `ON-DEVICE CHECK` → 제목에서 삭제, 필요하면 결과 상세에 `이 기기에만 저장`
- `SIMULATED RECEIPT` → `여행 잔액 기록`, 상세에 `실제 금액 이동 없음`

### 2.7 One visual grammar per meaning

같은 의미는 어느 탭에서도 같은 geometry·color·motion을 쓴다. 서울·부산·제주
온도, 선택, 성공, pending, unavailable, destructive action이 화면마다 다른
카드 모양이나 색을 갖지 않는다.

### 2.8 Color is data

near-white와 near-black이 앱의 기본이다. plum→coral→apricot은 ONDO heat에,
neon plum/pink는 After19 active state에만 쓴다. CTA나 일반 카드 장식에 heat
색을 남발하지 않는다.

### 2.9 Honest delight

고급스러운 모션과 이미지는 product truth를 높여야 한다. 실제 사람·매장·결제·
credential처럼 오인시키는 장식은 쓰지 않는다. 외부 연결이 없으면 성공을
연출하는 대신 준비 상태와 사용할 수 없는 다음 행동을 아름답게 보여준다.

### 2.10 Recovery is part of the main design

Loading, Empty, Error, Expired, Unsupported, Cancel, Retry, Return은 부속 화면이
아니다. 성공 화면과 같은 typography, spacing, sheet와 motion을 쓴다.

### 2.11 Mobile is the source composition

390×844가 주 기준이며 320×800, 360×800, 430×932를 함께 설계한다. tablet과
desktop은 mobile을 크게 늘리는 것이 아니라 같은 우선순위를 유지한 확장이다.
844×390 short landscape는 별도 구성을 갖는다.

### 2.12 Simplicity may not delete capability

문구·카드·단계를 줄이기 전에 [PRD preservation ledger](./00_PRD_PRESERVATION_LEDGER.md)
에서 연결 기능, 상태, 실패와 `returnTo`를 확인한다.

## 3. 정보 처리 규칙

### 3.1 다섯 등급

| 등급 | 질문 | 기본 처리 | 예시 |
|---|---|---|---|
| Decision | 지금 판단에 필요한가 | 항상 표시 | 장소, 시간, 좌석, 금액, 선택 CTA |
| Truth | 없으면 오해하는가 | 결정점에 짧게 표시 | 공식/편집, 실제 금액 이동 없음, 공개 범위 |
| Status | 사용자의 다음 행동을 바꾸는가 | 객체 상태로 표시 | 저장됨, 19+ 필요, payment unavailable |
| Provenance | 신뢰 확인에 필요한가 | 한 번 접기 | source, provider, freshness, receipt ID |
| Maker detail | 팀만 궁금한가 | Labs/문서 또는 삭제 | fixture, architecture, “우리가 이렇게 구성” |

### 3.2 문장 삭제 판단

문장을 지우기 전 세 질문에 모두 답한다.

1. 이 문장이 사라져도 사용자가 다음 행동을 안다.
2. 이 문장이 가진 상태·진실을 시각·구조·상호작용이 대신한다.
3. screen reader와 색 제거 상태에서도 같은 의미가 남는다.

하나라도 아니면 짧게 고치거나 접을 뿐 삭제하지 않는다.

### 3.3 UX writing

- 제목은 사용자의 목적 또는 현재 결과를 말한다: `19+ 확인`, `결제 준비`,
  `Roba 저장됨`.
- 명사 연쇄를 피하고 능동형 동사를 쓴다.
- CTA는 결과를 예고한다: `서울 보기`, `이 Table 참여`, `₩19,000 확인`,
  `같은 장소로 돌아가기`.
- `Continue`, `Next`, `Submit`, `Cancel`은 문맥이 분명할 때만 쓴다.
- close와 back을 구분한다. `닫기`는 현 overlay만, `뒤로`는 이전 단계,
  `나중에`는 현재 행동을 건너뛴다.
- KO/EN/JA는 번역 길이로 동일 width를 강제하지 않는다. control은 grow하고
  2줄까지 허용하되 primary verb가 잘리지 않는다.

## 4. 공통 화면 primitives

새로운 플로우 전용 카드·모달을 만들기 전에 아래 primitive로 조합한다.

| Primitive | 책임 | 금지 |
|---|---|---|
| `PageHeader` | back/close, 한 제목, 필요 시 한 상태 | eyebrow+title+subtitle+badge 중복 |
| `DecisionHero` | 현재 장소·Table·금액·proof 등 한 객체 | 설명만 있는 큰 빈 카드 |
| `ActionRow` | icon, label, state, chevron/toggle | 카드 안 카드, 두 개 primary CTA |
| `FactStrip` | 3~6개의 빠른 비교 사실 | 긴 문단, 작은 9~10px metadata |
| `MediaCard` | 장소/사람/여행 기억의 시각적 증거 | 공식 장소 사진인 것처럼 꾸민 category art |
| `MapKey` | compact heat grammar와 source state | full-width 범례 문장 |
| `Sheet` | Peek/Decision/Detail 세 높이 | 임의 radius·header·close·footer |
| `StickyDecision` | primary + optional secondary | safe-area/keyboard 아래로 숨김 |
| `InlineStatus` | loading/error/unavailable와 recovery | 전체 화면 alert, 기술 오류 원문 |
| `Receipt` | amount/result/time/return | 성공 장식으로 실제 거래 암시 |

### 4.1 Sheet variants

| Variant | 용도 | 높이 | 행동 |
|---|---|---:|---|
| Peek | 장소·Table 빠른 선택 | content-fit, 최대 32dvh | swipe/닫기/상세 |
| Decision | account/age/payment/confirm | content-fit, 최대 72dvh | 한 primary, 한 escape |
| Detail | 장소·Table·영수증 | 88dvh, 내부 scroll | sticky actions |
| Full task | chat/eKYC capture/Labs | 100dvh 또는 route | 명확한 back/exit |

동일한 overlay 위에 두 번째 modal을 쌓지 않는다. Gate가 추가되면 같은 Decision
sheet shell 안에서 body가 전환되고 header의 원 행동 context는 고정된다.

### 4.2 기본 geometry

- phone edge inset: 16px at 320/360, 20px at 390/430.
- touch target: 최소 44×44px; 주요 CTA 높이 52–56px.
- sheet radius: 28px; card radius: 18–22px; small control radius: 12–16px.
- spacing: 4/8/12/16/20/24/32/40/48 token만 사용한다.
- 화면 제목: 28–32px/1.08, section 20–22px/1.2, body 15–17px/1.45,
  metadata 12–14px/1.35.
- 가격·잔액·count는 tabular numeral과 locale grouping을 사용한다.
- 그림자는 떠 있는 interactive layer에만; 정적 카드 위계는 border·spacing으로 만든다.

## 5. App shell과 navigation

### 5.1 Mobile dock

- 5개 primary tab은 Explore, My Korea, Tables, ID · Wallet, Settings를 유지한다.
- phone에서는 아이콘만 보이며 visible text label을 넣지 않는다.
- 선택은 검은 tile+흰 pictogram 한 가지 공통 문법을 사용한다. 별도 bar, glow,
  중복 indicator를 겹치지 않는다.
- 각 icon은 기능을 설명하는 localized accessible name과 48–56px hit area를 갖는다.
- first-use 1회 coach label은 허용하되 영구 tooltip은 쓰지 않는다.
- Labs는 primary tab으로 승격하지 않는다.

### 5.2 Desktop rail

- icon+short label 또는 hover/focus label을 허용한다.
- 모바일 dock을 세로로 늘인 것처럼 보이지 않게 content canvas와 한 grid를 쓴다.
- rail width가 콘텐츠를 가리거나 short landscape에서 자동 등장하지 않는다.

## 6. Map-first visual system

### 6.1 First entry

앱이 열리면 실제 MapLibre 대한민국 지도가 이미 배경에 있다. 별도 일러스트
canvas를 거친 뒤 지도를 새로 mount하지 않는다.

```text
map visible immediately
→ coast/route draws softly
→ Seoul/Busan/Jeju field blooms once
→ headline and city labels settle
→ tap city
→ same camera easeTo city
→ city controls fade/slide in only after useful map content is visible
```

### 6.2 Geography

- 대한민국 해안선은 mobile에서도 첫눈에 읽혀야 한다.
- 서울·부산·제주의 실제 위치를 쓰고 route line은 도시 중심을 정확히 연결한다.
- 도시 라벨과 beacon이 지형을 크게 가리지 않는다.
- nation과 city는 같은 map instance와 visual language를 쓴다.

### 6.3 Temperature grammar

모든 지역은 `field → aura → core → selected halo → label` 순서를 공유한다.

- `field`: source-backed spatial signal의 낮은 대비 면.
- `aura`: heat band, confidence와 겹치지 않는 색.
- `core`: 정확한 anchor/venue position.
- `selected halo`: interaction state. heat 자체보다 굵고 명확하다.
- `label`: 이름. 점수와 `Peak/Hot`은 기본 marker에 상시 쓰지 않는다.

선택 전에는 시각으로 온도를 느끼게 하고, 선택·목록·상세에서 숫자, freshness,
confidence를 정확히 확인한다. screen reader name은 선택 전에도 전체 의미를 가진다.

### 6.4 Seoul, Busan, Jeju

- 세 도시는 동일 size scale, hit target, selection, transition을 쓴다.
- 서울·부산의 score는 curated simulated ONDO이고 공식 LOCALDATA와 별도다.
- 제주 field는 검증된 editorial place coverage다. `score=null`, limited ring이며
  인기·혼잡·순위를 암시하지 않는다.
- list card와 place detail의 geometry도 official/editorial에 따라 갈라지지 않는다.
  compact source chip과 source drawer만 다르다.

### 6.5 City chrome

- search는 한 줄 48–52px.
- 자주 쓰는 3~5 filter만 horizontal rail, 나머지는 filter sheet.
- locate, After19, story/editorial은 context utility tray 한 곳에 둔다.
- Map/List, compact key, result state는 하단 한 lane에 두고 서로 겹치지 않는다.
- attribution은 legally visible하지만 primary decision과 경쟁하지 않는 map corner에 둔다.

## 7. Motion system

| Role | Duration | Easing | 사용 |
|---|---:|---|---|
| Tap | 90–120ms | ease-out | press/selection |
| Inline | 160–200ms | standard | row expand, status replace |
| Sheet | 220–280ms | emphasized decel | open/close/snap |
| Route | 240–320ms | standard | full task change |
| Map focus | 420–500ms, hard cap 520ms | cubic smooth | nation→city, city→venue |
| Result | 220–360ms; stamp만 최대 500ms | spring-lite | state replace, stamp ready |

- 60fps를 목표로 transform/opacity와 map camera만 animate한다.
- loop pulse/shimmer는 2초를 넘기지 않으며 정보가 준비되면 멈춘다.
- map focus 중 label은 camera와 함께 도망가지 않고 목적 좌표에 고정된다.
- city tap 즉시 선택 feedback을 주고 camera가 끝날 때 chrome이 들어온다.
- `prefers-reduced-motion`은 duration 0 또는 짧은 opacity로 바꾼다.
- Back은 시간 역재생이 아니라 공간적으로 이전 camera/sheet state를 복원한다.

## 8. Loading·empty·error

### 8.1 Loading

- 기존 map/list/place context를 그대로 둔다.
- 800ms 이내에는 별도 문장을 띄우지 않는다.
- 이후 compact progress를 해당 객체에 붙인다.
- 5초 이후에는 같은 query/filter/selection의 usable List와 Retry를 foreground한다.

### 8.2 Empty

빈 화면 대신 무엇이 0인지 보여주고 가장 가까운 회복 하나를 준다.

- filter 0 → filter chips + `조건 지우기`
- venue Table 0 → 같은 장소 context + `근처 Table`
- My Korea 0 → 작은 memory map + `지도에서 저장`

### 8.3 Error

오류는 기술 원인이 아니라 사용자 상태와 다음 행동을 말한다. 같은 화면 안에서
retry하며 draft/amount/selection을 지우지 않는다. destructive 또는 돈과 관련된
오류는 toast만으로 끝내지 않는다.

## 9. Identity·Wallet의 JIT orchestration

### 9.1 Readiness sheet

여러 gate가 필요한 행동은 한 sheet shell에서 처리한다.

```text
원 행동과 대상 고정
→ 지금 필요한 한 축
→ consent 또는 최소 설정
→ pending
→ result
→ 다음 필요한 축 또는 원 행동 자동 재개
```

progress는 `1/4` 같은 전체 시스템 단계가 아니라 현재 행동에 남은 실제 확인만
표현한다. K-Tour ID 발급 준비의 마지막 단계에 `Present`를 넣지 않는다. 자격 제시는
실제 요청 행동의 별도 JIT 순간이다.

### 9.2 Wallet language

- balance: 출처가 정의된 경우 `이번 여행에 준비된 잔액 ₩60,000`, 보조 환율과
  기준 시각이 있는 경우만 `약 US$44.40`. 출처가 없으면 `₩0`이다.
- funding source: 은행·카드·Apple Pay·USD wallet이라는 소비자 개념.
- OOKRW/USDC/USDT와 network는 `결제 상세` 또는 Labs.
- provider가 연결되지 않으면 선택은 draft일 뿐 Ready로 저장하지 않는다. normal
  public route는 unavailable로 끝나며, 성공 fixture는 명시적 QA/review mode에서만
  provenance와 외부 연결 없음 범위를 함께 보여준다.
- 혜택은 ONDO 소유임을 시각적으로 분리하고 매장 제휴·주문으로 확대하지 않는다.
- receipt는 KRW result, 필요 시 총 USD, 저장 위치와 실제 금액 이동 여부만 전면에 둔다.

## 10. Imagery and iconography

### 10.1 Place media

- 실제 source-backed venue image가 있으면 사용한다.
- category art는 장소 사진인 것처럼 보이지 않게 일관된 illustration crop과
  accessible description을 갖는다.
- list에서 인접 카드가 같은 사진을 반복하지 않도록 asset pool과 crop을 관리한다.
- 이미지가 없으면 icon placeholder를 쓰되 큰 빈 원형 프로필은 만들지 않는다.

### 10.2 People

fictional/synthetic people은 onboarding aspiration, Table invitation, My Korea memory에
사용할 수 있다. 공식 장소, eKYC capture/result, credential에는 넣지 않는다.
외모로 국적·신원·성인 여부를 암시하지 않는다.

### 10.3 Brand

- ONDO wordmark/symbol은 Explore와 consumer shell의 주 브랜드다.
- 제공된 K-Tour ID logo는 K-Tour ID setup, Travel Pass, consent/result 같은
  identity context에만 사용한다.
- K-Tour ID 컬러 gradient를 앱 전역 heat palette로 확장하지 않는다.
- favicon/app icon/social preview는 별도 crop 규칙과 16px optical check를 가진다.

## 11. Accessibility and localization

- text contrast 4.5:1, large text/UI boundary 3:1.
- 44×44px minimum target, 8px minimum gap between adjacent critical controls.
- icon-only control은 모양이 아니라 행동을 설명하는 localized accessible name.
- modal/sheet focus trap, Escape, focus restore; background inert.
- map과 같은 결과의 semantic List를 제공한다.
- 200% text zoom에서도 primary CTA, amount, failure action이 잘리지 않는다.
- KO/EN/JA에서 장소명 외 decision text에 ellipsis를 쓰지 않는다.
- forced colors에서 selected/heat/official/editorial을 border·label로 구분한다.
- VoiceOver/TalkBack 순서는 visual reading order와 같다.

## 12. Component adoption rule

기존 기능 reducer·fixture·testid·returnTo를 유지한 채 presentation을 공통
primitive로 옮긴다. 한 Flow만을 위한 새 modal/card CSS를 만들려면 다음 중 하나를
증명해야 한다.

1. 기존 primitive로 표현하면 의미가 틀린다.
2. 새로운 패턴이 다른 세 곳 이상에 재사용될 예정이다.
3. accessibility 또는 platform 제약 때문에 별도 구현이 필요하다.

증명하지 못하면 공통 primitive를 확장한다. 후행 `final override`, `lock`,
viewport별 임시 offset은 새로운 규격으로 인정하지 않는다.

## 13. Adversarial completion gate

한 Flow는 다음을 모두 통과해야 완료다.

- [ ] 1초 테스트: 첫 화면만 본 사용자가 대상과 다음 행동을 말한다.
- [ ] 3초 질문: 모든 입력·선택을 3초 안에 답할 수 있다.
- [ ] Prose-off: helper paragraph를 가려도 주 흐름을 끝낸다.
- [ ] Color-off: 색을 제거해도 선택·heat·truth를 구분한다.
- [ ] Motion-off: reduced motion에서 맥락과 focus가 같다.
- [ ] Long-copy: KO/EN/JA 최장 문자열, 200% zoom에서 잘림이 없다.
- [ ] Small-phone: 320×800에서 close, title, primary CTA에 도달한다.
- [ ] Short-landscape: 844×390에서 rail/nav/sheet가 겹치지 않는다.
- [ ] Failure-first: cancel/error/retry 화면이 success와 같은 완성도다.
- [ ] Exact-return: camera/filter/selection/draft/opener focus가 복원된다.
- [ ] Truth: official/editorial/live/simulated/contract/deferred가 섞이지 않는다.
- [ ] Preservation: requirement, state, fixture, persistence가 사라지지 않았다.

한 명이 구현하고 같은 사람이 승인할 수 없다. 작성자가 아닌 두 리뷰어 중 한 명은
모바일 시각을, 다른 한 명은 state/truth를 검수하고 둘 다 actionable P0/P1/P2가
0일 때만 구현 완료 후보가 된다.
