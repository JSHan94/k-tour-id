# D2 · Interaction and Visual Systems Independent Audit

상태: **INDEPENDENT REVIEW · NOT CONSENSUS · IMPLEMENTATION 금지**

작성일: 2026-09-04

관점: 모바일 시각 시스템, 인터랙션, 모션, 지도 몰입감
대상: current ONDO B, FL-001~FL-018, 320/390/430px portrait와 844×390 short landscape

## 0. 결론

ONDO B는 기능 추적성과 실패·복귀 계약은 강하지만 아직 Toss급 모바일 제품은
아니다. 가장 큰 문제는 기능 부족이 아니라 **한 화면에서 너무 많은 것을
설명하고, 상태 전환이 같은 맥락 안에서 이어지지 않으며, 지도와 주요 객체보다
카드·문장·큰 제목이 먼저 보인다는 것**이다.

이번 리뷰의 P1은 다음 여섯 가지다.

1. Korea intro와 city map이 같은 MapLibre 세계처럼 이어지지 않는다. 도시 선택이
   공유 객체 전환이 아니라 화면 교체로 느껴진다.
2. intro의 큰 도시 pill과 흐릿한 지형은 D-14의 44px 공통 온도 비콘 및 짧은
   인접 라벨 계약을 충분히 구현하지 못한다.
3. 취향 선택은 지도를 바꿀 것처럼 약속하지만 결과 지도에서 변화가 즉시
   보이지 않는다. 이는 단순 미감 문제가 아니라 약속-결과 불일치다.
4. K-Tour ID setup과 실제 행동 시 presentation이 한 4단계 진행선에 섞여 있다.
   사용자는 무엇을 지금 만드는지, 무엇을 나중에 공유하는지 구분하기 어렵다.
5. After 19는 색 반전은 강하지만 지도 지형이 거의 사라져 열점이 검은 공간에
   떠 보인다. night mode가 공간 인지를 깨뜨린다.
6. checkout visual baseline에는 OOKRW가 정상 화면에 노출된다. 이는 D-13의
   소비자 통화 KRW/USD 우선 규칙과 충돌하며 P1 truth/copy 결함이다.

자동 Gate가 green이라는 사실은 clipping·contract 회귀가 없다는 뜻이지, 이
시각·상호작용 수준이 출시 승인되었다는 뜻은 아니다. current successor는
clean 0/2이며 아직 배포되지 않았다.

## 1. 검토한 정본과 적용 우선순위

다음 자료를 전부 검토했다.

- execution PRD, Flow Catalog, State Model, Decision Ledger D-13~D-15,
  Visual Interaction Spec, 역사적 A as-built
- current B의 07_AS_BUILT, 06_FINAL_REQUIREMENTS_AUDIT,
  04_EVIDENCE_MANIFEST
- Product-wide Visual Reset Plan, Mobile Meaning Gate, UX Design Spec
- current B 모바일 visual baseline과 구현 surface
- K-Tour ID 사업계획서 PDF 13쪽의 텍스트와 렌더

충돌 시 적용 순서는 current B as-built와 Decision Ledger amendment를 포함한
최신 execution truth가 먼저이며, 이전 A/Leaflet 명세와 과거 screenshot은
역사 자료로만 쓴다.

### 반드시 지키는 제품 truth

- current B 지도 renderer는 **MapLibre**다. Leaflet/raster로 되돌리지 않는다.
- 서울·부산 공식 장소와 제주 editorial 장소는 source truth가 다르다.
  UI geometry는 같게 하되 제주에 숫자 온도·Hot·Peak·실시간 인기를 발명하지
  않는다.
- 상태값도 그대로 보존한다. 서울·부산은 curated-scored, 제주는
  editorial-unscored이며 제주 score=null, pulseScore=-1, level=limited,
  pulseEligible=false, officialRecord=false다.
- 온도 field는 일반 장소 밀도나 실시간 혼잡 KDE가 아니다. 서울·부산의 명시된
  simulated signal, 제주의 검증된 editorial coverage만 표현한다.
- Guest, Account, Person, Age, Payment KYC는 독립 상태다. 한 단계의 성공으로
  다른 단계를 시각적으로도 자동 완료시키지 않는다.
- frontend local success를 실제 provider, DID/VC 발급, 결제, host, 예약, mint로
  보이게 하지 않는다.
- 소비자 화면의 금액은 KRW, 보조 예상값은 근거가 있을 때 USD다. OOKRW,
  USDC, USDT, network, settlement는 결제 상세 또는 Labs에서만 보인다.
- cancellation과 failure는 원래 context와 exact returnTo를 잃지 않는다.
- 기능을 화면에서 접는 것은 기능 삭제가 아니다. B/C tier로 옮긴 기능도
  접근 가능한 경로와 상태 계약을 유지한다.

사업계획서의 Mobile ID/passport, private K-Pass Capsule, benefit, payment,
partner evidence 연결은 제품 방향으로 보존한다. 반면 국적 기반 타깃 광고,
여권만으로 자동 지갑·공식 신분이 생성되는 듯한 표현, 실제 stablecoin rail
완료 주장은 현재 PRD privacy/truth와 충돌하므로 소비자 UI에 가져오지 않는다.
PDF의 navy/purple 블록형 발표 디자인도 소비자 앱의 시각 기준으로 복제하지
않는다.

## 2. 공통 모바일 시각 계약

### 2.1 화면 밀도와 typography

| 토큰 | 320px | 390px | 430px | 용도 |
|---|---:|---:|---:|---|
| edge inset | 16 | 20 | 20 | 본문·sheet 안전 여백 |
| display | 32/38 | 36/42 | 38/44 | 첫 화면 한 문장에만 사용 |
| screen title | 26/32 | 28/34 | 30/36 | route 또는 full sheet 제목 |
| section | 20/26 | 20/26 | 22/28 | 섹션 제목 |
| card title | 16/22 | 17/23 | 17/23 | 장소·테이블·방법 |
| body | 15/22 | 15/22 | 16/23 | 결정에 필요한 설명 |
| meta | 13/18 | 13/18 | 14/19 | 출처·상태, 12px 미만 금지 |

- 현재처럼 여러 route에서 44px 이상 제목을 반복하지 않는다. display는
  onboarding 첫 장과 명확한 성공 상태에만 한 번 사용한다.
- 한 viewport의 텍스트 역할은 최대 네 단계다. letter spacing을 브랜드 외
  eyebrow에 남발하지 않는다.
- KO/JA는 강제 영문식 줄바꿈을 쓰지 않는다. EN은 action noun을 앞에 둬
  320px에서도 CTA를 두 줄 이내로 유지한다.

### 2.2 spacing, radius, elevation

- 8px rhythm을 기본으로 하고 4px은 optical alignment에만 쓴다.
- control radius 14~16px, content card 18~20px, major feature card 24px,
  sheet 상단 28~32px로 역할을 구분한다. 모든 것을 28px round card로 만들지
  않는다.
- 한 화면에서 경계가 겹치는 깊이는 최대 2단이다. card 안 card 안 badge 구조는
  평면 row, divider, inset background로 압축한다.
- elevation은 base 0, floating control 1, selected object 2, modal/sheet 3의
  네 단계만 쓴다. 일반 리스트 카드에는 shadow 대신 1px neutral border를 쓴다.
- fixed bottom navigation 높이는 64px + safe-area다. mobile은 icon-only를
  기본으로 하고 현재 위치는 filled container와 3px indicator로 표현한다.
  모든 icon-only control은 KO/EN/JA accessible name을 가진다.

### 2.3 icon과 pictogram

- 24px optical grid, 2px round stroke, 48×48px touch target를 공통 규칙으로
  사용한다. 서로 다른 stroke family와 emoji를 섞지 않는다.
- 지도 control은 위치, layer, After19, List의 최대 네 개만 한 tray에 둔다.
  Stories는 별도 중복 CTA가 아니라 layer 안의 editorial glyph로 합친다.
- 온도는 단어·점수 대신 field, aura, core, selected halo, capsule의 순서로
  전달한다. 색만이 아니라 ring 수와 dashed/solid 선으로 상태를 구분한다.
- consent, payment, report, block, leave처럼 결과가 큰 행동에는 icon만 쓰지
  않고 짧은 동사를 유지한다.

### 2.4 sheet와 route

- Peek: 168~220px, medium: 52~64dvh, full: 최대 92dvh. 모든 sheet는
  safe-area와 sticky action 영역을 포함한다.
- 한 번에 modal surface는 하나다. gate가 이어질 때 배경을 다시 blur한 새
  modal을 쌓지 않고 동일 sheet shell 안에서 content만 전환한다.
- Back은 이전 단계, Close는 원 행동 취소, primary는 다음 상태라는 의미를
  전 route에서 고정한다.
- sheet 내부 전환에서도 title anchor와 return context는 움직이지 않는다.

### 2.5 motion

| 종류 | duration | easing | 규칙 |
|---|---:|---|---|
| press/selection | 100~140ms | ease-out | scale 0.98 이하, layout 이동 없음 |
| row/card state | 160~200ms | standard | opacity + 4~8px 이동 |
| route/sheet | 240~320ms | decelerate | backdrop와 sheet를 같은 frame에 시작 |
| atlas→city camera | 420~450ms | smooth decelerate | north-up, 한 번의 연속 flight |
| success morph | 220~320ms | spring-like, no bounce | one-shot, confetti 금지 |

- 도시 tap 피드백은 80ms 안에 시작하고, camera motion은 100ms 안에 시작한다.
- shared city beacon은 flight 중 scale만 1.00→1.08→1.00으로 변하고 위치는
  MapLibre camera projection을 따른다. 별도 DOM 좌표로 순간이동하지 않는다.
- prefers-reduced-motion에서는 camera를 jumpTo/duration 0으로, bloom과
  scale을 opacity 변화로 바꾼다.

## 3. 지도 첫 진입과 loading choreography

첫 화면부터 동일한 MapLibre surface를 유지하는 것이 단일 권장안이다.
별도 landing route, 도시 카드 목록, static poster를 사이에 끼우지 않는다.

1. **0~100ms:** near-white canvas와 이전/cached atlas geometry를 즉시 그린다.
   브랜드와 한 줄 headline은 지도 위 독립 overlay이며 지도를 덮는 흰 카드가
   아니다.
2. **100~260ms:** 서울·부산·제주의 44px 공통 beacon과 짧은 인접 label이
   one-shot으로 나타난다. 서울 double solid, 부산 single solid, 제주 dashed
   halo다.
3. **도시 tap:** beacon이 같은 객체로 유지된 채 MapLibre easeTo/fitBounds가
   420~450ms 진행된다. headline은 120ms에 사라지고 compact city header는
   flight 55% 지점부터 나타난다.
4. **city ready:** temperature field가 180ms fade로 들어오고 검색창은 자동
   focus하지 않는다. 필터와 List는 지도 surface 위 최소 chrome으로 안착한다.
5. **loading:** 800ms 전에는 문장 없는 subtle progress만 허용한다. 800ms부터
   non-blocking compact progress, 5초 안에 ready가 아니면 동일 query/filter/
   selection의 List를 foreground한다. cached atlas와 city beacon은 지우지 않는다.
6. **recover:** tile/glyph/source retry가 성공하면 List 위치와 선택 venue를
   유지한 채 map으로 복귀한다. AbortError/ERR_ABORTED를 fatal 화면으로 만들지
   않는다.

지도 가시성 기준은 daytime에서 coastline 1.25px, administrative hairline
0.75px, water/land luminance 차이 최소 7%, 주요 도시 label contrast 4.5:1이다.
night에서도 coast/road/label이 최소 3:1로 남아야 하며, 검은 빈 화면 위 열점만
떠 있는 상태는 실패다.

## 4. 정보 배치 원칙

| 층 | 항상 보이는 정보 | 처리 |
|---|---|---|
| A · 결정 | 현재 객체, 한 가지 질문, primary action, 돈·공개범위·정확한 실패 | 첫 viewport |
| B · 이해 | source, provider 미연결, 보관, method, evidence, 정책 | 한 번 접는 disclosure |
| C · 기술 | DID/VC, OpenDID/EAS, OOKRW, USDC/USDT, network, fixture | Labs 또는 기술 상세 |

제거 대상은 기능이 아니라 제작자 관점의 중복 문장이다. “on this device”,
“preview”, “simulated”, “provider not connected”를 모든 card와 eyebrow에
반복하지 않는다. 오해가 생길 수 있는 성공·결제·공개 결정점에서는 짧은
consumer truth 한 줄을 남기고, 구체적인 기술 증거는 B/C층에서 보존한다.

---

## FL-001 · Guest가 지도에서 장소를 발견

**현재 문제**

- nation baseline은 지도보다 poster에 가깝고 city control이 큰 pill이라 국토를
  가린다. D-14의 44px beacon + adjacent label 계약과 다르다.
- city baseline은 상단 header/search/filter가 큰 비중을 차지하고, 온도 field는
  공간 근거 없이 흐린 blob처럼 보인다. deterministic baseline에서 basemap이
  비어 있을 때 문제는 더 심해진다.
- Map/List/peek/detail은 기능적으로 연결되지만 atlas→city가 shared object
  transition으로 읽히지 않는다.

**목표 경험**

첫 1초에 “한국 지도, 세 도시, 어디가 더 따뜻한지”를 읽고 한 번 누르면 같은
지도가 자연스럽게 그 도시의 장소로 확대된다.

**새 모바일 시퀀스**

MapLibre atlas first frame → 공통 온도 beacon 선택 → 420~450ms city flight →
field와 compact controls 등장 → marker/field 선택 → peek → detail → directions
또는 save → Back으로 동일 center/zoom/filter/focus 복귀.

**화면·컴포넌트 규격**

- intro overlay는 edge 20px, 최대 너비 250px, pointer event를 지도로 통과시킨다.
- city beacon은 44×44px, label은 한 줄 16/22 semibold, pill 배경 금지.
- city header 48px, collapsed search trigger 48px, horizontal filter 44px,
  bottom List control 48px. top chrome 총 높이는 safe-area 제외 152px 이하.
- selected place는 48px hit target, capsule은 viewport 폭의 64% 이하이며
  지도 중심을 가리지 않도록 anchor 반대 방향에 배치한다.

**모션**

- section 3의 camera choreography를 그대로 쓴다.
- field는 camera 이동 중 흔들리지 않고 city ready 뒤 opacity만 0→1이 된다.
- peek은 marker에서 sheet로 title/photo가 이어지는 shared emphasis를 쓰되
  marker 자체는 남긴다.

**정보 제거·접기·유지**

- 제거: official record 수, 별도 city card, intro 중복 CTA, “Pulse/Peak/Hot”.
- 시각화: temperature level, selection, cluster count.
- 접기: source snapshot, field 방법론, offline timestamp, legal attribution.
- 유지: city/venue name, category, official vs editorial distinction, search/filter,
  List parity, directions.

**상태·실패·복귀**

- 위치 거부는 지도 사용을 막지 않고 locate icon에 작은 slash state만 준다.
- empty filter는 map을 지우지 않고 filter row 바로 아래 한 줄 + reset action.
- tile/source 회복 계약은 D-15를 따른다. fatal initialization만 map unavailable.
- Back/Forward/reload와 List→Map은 exact selection, opener focus, query, filter,
  center/zoom을 복원한다.

**Acceptance criteria**

- [ ] 320/390/430에서 horizontal overflow 0, 지도 usable area가 첫 viewport의
  58% 이상이다.
- [ ] 세 도시 beacon의 screen center가 승인된 실제 좌표 projection에서
  ±8px 이내다.
- [ ] tap 후 100ms 안에 motion 시작, 500ms 안에 city context가 안정된다.
- [ ] map과 list의 결과·순서·selected venue가 일치한다.
- [ ] 색을 제거해도 서울 double, 부산 single, 제주 dashed 상태가 구분된다.

**PRD 보존**

REQ-007/013/017/018/019, MAP-NATION/CITY/FILTERED/LIST/OFFLINE, 400 official
records, 제주 editorial truth, MapLibre, legal attribution, same-tab recovery,
FL-001의 ENTRY~RETURN 전부를 보존한다.

## FL-002 · 19+ 장소 JIT proof 후 같은 상세 복귀

**현재 문제**

- venue context, 설명, privacy, progress가 서로 경쟁하고 gate 성공 뒤 night
  transition과 원 장소 복귀가 하나의 장면처럼 느껴지지 않는다.
- “provider/on-device” 설명이 첫 viewport에 들어오면 사용자가 답해야 할
  질문보다 구현 상태가 앞선다.

**목표 경험**

“이 장소의 19+ 영역을 열기 위해 나이만 확인한다”를 즉시 이해하고, 확인 뒤
같은 장소가 night styling으로 자연스럽게 열린다.

**새 모바일 시퀀스**

locked venue CTA → 동일 venue title이 고정된 medium sheet → 공개 항목 19+
한 개 확인 → local proof 진행/실패 → success icon morph → sheet dismiss와
night crossfade → 같은 venue detail·opener focus.

**화면·컴포넌트 규격**

- sheet header: venue thumbnail 40px + name + 19+ lock glyph.
- title 26/32, body 최대 두 줄, disclosure 한 개, primary 52px, quiet cancel.
- progress stepper는 실제 단계가 둘 이상일 때만 compact dots로 보인다.
- night map geometry와 place geometry는 light와 동일하다.

**모션**

- locked glyph→check morph 220ms, sheet dismiss 260ms, light→night token
  crossfade 220ms를 80ms overlap한다.
- camera와 selected marker는 움직이지 않는다.

**정보 제거·접기·유지**

- 제거: generic KYC 설명, Person/passport 암시, on-device eyebrow.
- 접기: provider 부재, retention, proof expiry 세부.
- 유지: 왜 필요한지, 19+ predicate 하나, cancel, expiry/failure, 해당 장소.

**상태·실패·복귀**

- Account/Person/Payment는 변화하지 않는다.
- 실패 시 sheet 안에서 reason + Retry/Cancel, 원 venue는 뒤에 그대로 유지한다.
- 취소는 locked venue로, 성공은 exact After19 venue로 돌아간다.

**Acceptance criteria**

- [ ] 첫 viewport의 질문과 primary가 각각 하나다.
- [ ] success 전후 venue ID와 map camera가 동일하다.
- [ ] Age proof만 갱신되며 다른 readiness badge는 바뀌지 않는다.
- [ ] EN/KO/JA에서 reason·Retry·Cancel이 320px에 모두 도달 가능하다.

**PRD 보존**

AGE-UNVERIFIED/VERIFIED/EXPIRED, exact venue returnTo, night category policy,
official restriction 비주장, FL-002의 cancel/error/retry/terminal/return을
보존한다.

## FL-003 · Table 발견, 참여, chat, check-in, feedback

**현재 문제**

- list/detail/chat이 큰 headline과 card-in-card를 반복해 사람이 아니라 UI
  container가 먼저 보인다.
- detail의 여섯 필수 정보는 좋지만 host 설명, 19+ 배너, memo, privacy가 같은
  무게로 쌓여 primary 참여 행동이 늦게 보인다.
- chat은 안전 행동을 보존했지만 상단 card와 banner가 대화 공간을 압축한다.

**목표 경험**

사진과 사람 수, 장소, 시간을 먼저 보고 한 번에 참여 여부를 결정한 뒤,
필요한 gate를 지나 같은 table context에서 chat으로 들어간다.

**새 모바일 시퀀스**

photo-led Table list → card tap shared image transition → 6-fact compact detail →
Join → 필요한 JIT gate를 같은 sheet에서 순차 처리 → joined state morph →
chat → check-in → feedback → My Korea planned meal.

**화면·컴포넌트 규격**

- list card 96px thumbnail + title + time/seat 두 줄, border only.
- detail hero 4:3 photo 최대 220px, participant face stack 32px, 6 facts는
  2×3 icon grid. 19+는 관련 table에만 한 row.
- sticky join CTA 52px. chat header 52px, message composer 52px.
- Report/Block/Leave는 overflow sheet에 모으되 report emergency access는
  두 tap을 넘지 않는다.

**모션**

- list photo/title→detail 280ms, Join 성공 시 남은 seat 숫자와 face stack만
  200ms update한다. 전체 화면 success page를 만들지 않는다.
- chat unlock은 composer opacity/translate 180ms, 메시지는 160ms.

**정보 제거·접기·유지**

- 제거: generic host prose, 중복 preview badge, 반복되는 place card.
- 시각화: seat, language, meeting point, per-person spend, dish plan.
- 접기: table privacy, preview/server truth, full host note.
- 유지: 장소·시간·좌석·언어·비용·만남 위치, actual host/reservation 부재 truth,
  report/block/leave, image retry.

**상태·실패·복귀**

- join 실패는 detail context와 입력 memo를 보존한다.
- confirmed member 전 chat/photo는 locked composer로 이유를 표시한다.
- check-in은 Meetup만, feedback은 허용된 축만 변경한다.
- cancel/back은 source list scroll과 selected Table을 복원한다.

**Acceptance criteria**

- [ ] 첫 viewport에 사진, table title, time, remaining seat, primary가 보인다.
- [ ] 320px에서 6 facts가 잘리지 않고 2열 또는 1열 adaptive로 바뀐다.
- [ ] gate 후 동일 table ID로 자동 resume한다.
- [ ] image failure/retry, report, block, leave가 keyboard와 screen reader로 가능하다.

**PRD 보존**

REQ-008/009/010/015, TABLE-LIST/DETAIL/JOINED/CHAT/CHECKED-IN/FEEDBACK,
confirmed-member guard, simulated-local truth와 FL-003 전체 checkpoint를
보존한다.

## FL-004 · meal benefit checkout, receipt, visit stamp, Labs

**현재 문제**

- current baseline은 OOKRW를 amount card와 “You pay”에 노출해 D-13과 충돌한다.
- benefit card, dark amount card, privacy card, consent, sticky CTA가 모두 큰
  container라 가격 결정이 분산된다.
- receipt와 visit proof가 truth상 분리된 것은 옳지만 화면 전환이 길고 stamp
  결과가 checkout reward처럼 오해될 수 있다.

**목표 경험**

사용자는 원화 총액, 적용할 혜택, 결제 준비 상태만 보고 결정한다. 결제 기록과
방문 기록은 명확히 분리되며 기술 단위는 원할 때만 본다.

**새 모바일 시퀀스**

venue offer → benefit 선택 → single price summary → Account/Payment gate 필요 시
같은 checkout shell에서 처리 → confirm → processing → local receipt →
별도 “방문 기록 남기기” → Visit proof → 9→10 milestone → 선택 시 Labs.

**화면·컴포넌트 규격**

- pinned summary: venue, gross KRW, benefit, final KRW. USD estimate는 source/time
  설명이 있을 때만 작은 보조값.
- payment method와 benefit은 각각 56px row, consent 한 줄, CTA 52px.
- receipt는 한 장의 flat ticket, stamp는 별도 timeline event.
- technical balance disclosure에만 OOKRW/USDC/USDT/network를 둔다.

**모션**

- benefit 선택 시 금액 숫자 crossfade 180ms, row check morph 140ms.
- processing은 800ms 전 문장 없이 progress, 실패/성공은 같은 amount anchor에서
  전환한다.
- stamp milestone은 하나의 ring fill 320ms, confetti와 coin rain 금지.

**정보 제거·접기·유지**

- 제거: 정상 화면의 OOKRW ticker, test/simulated headline, 반복 privacy card.
- 접기: no-money/provider truth, technical ledger, estimate source, Labs route.
- 유지: KRW amount, benefit eligibility, payment readiness, consent, actual
  money movement 부재 truth가 필요한 결정점, payment≠visit.

**상태·실패·복귀**

- Account와 Payment KYC가 독립적으로 필요한 순서만 보인다.
- 실패/cancel은 benefit, amount, consent, venue를 보존한다.
- 결제 failure에서 wallet asset은 불변이며 receipt를 만들지 않는다.
- visit failure는 receipt를 취소하지 않고 Retry/Skip을 제공한다.

**Acceptance criteria**

- [ ] normal checkout/receipt 첫 viewport에 OOKRW/USDC/USDT/network가 없다.
- [ ] KRW total이 가장 큰 숫자이며 같은 화면에 경쟁하는 총액이 없다.
- [ ] payment success만으로 stamp/reputation이 바뀌지 않는다.
- [ ] gate 후 exact amount/benefit/venue로 복귀한다.

**PRD 보존**

REQ-006/011/015/016, D-13, CHECKOUT/PAYMENT-KYC/RECEIPT/STAMP-9→10,
separate asset ledger, visit dedupe, optional Labs와 FL-004 전 상태를 보존한다.

## FL-005 · 한국인 Mobile ID/CX Person route

**현재 문제**

- current gate는 작은 type과 여러 nested row로 압축됐지만 무엇을 확인하는지보다
  경로/기술 설명이 여전히 많다.
- K-Tour ID의 Choose-Check-Add-Present 4단계는 setup과 이후 행동별 공유를
  같은 lifecycle처럼 보이게 한다.
- provider가 없는 local result가 공식 Mobile ID 연결 성공처럼 보일 위험이 있다.

**목표 경험**

원 행동에 필요한 Person 확인만 짧게 진행하고, K-Tour ID를 만드는 단계와
특정 행동에 자격을 공유하는 단계를 분리한다.

**새 모바일 시퀀스**

Person-required CTA → anchored gate sheet → Mobile ID 선택 → requester/purpose/
requested evidence 동의 → CX handoff preview/failure → consumer result →
필요하면 K-Tour ID에 추가 → exact action resume. 이후 presentation은 별도
contextual consent 한 장으로 처리한다.

**화면·컴포넌트 규격**

- method row 64px, title + 한 줄 human label만 표시한다.
- consent는 requester, human purpose, requested evidence 세 row.
- provider, callback, payload, retention은 “데이터 및 보관” disclosure 한 곳.
- setup stepper는 Choose-Check-Add의 3단계만. Present는 flow 밖 action gate다.

**모션**

- sheet shell은 유지하고 method→consent→handoff→result content만
  180ms crossfade/8px slide한다.
- provider handoff 실패 시 full page로 튕기지 않고 같은 step에서 shake 없이
  error row가 나타난다.

**정보 제거·접기·유지**

- 제거: 항상 보이는 OmniOne CX, on-device, DID/VC, generic KYC 문장.
- 접기: provider 미연결, signed callback, retention, OpenDID state.
- 유지: Mobile ID라는 선택, requester, purpose, evidence, cancel, 실패,
  local/frontend truth를 오해가 생기는 결과점에서 한 줄.

**상태·실패·복귀**

- 실패 시 Person은 unverified로 남고 K-Tour credential을 만들지 않는다.
- Account/Age/Payment는 불변이다.
- cancel은 원 CTA로, success는 exact returnTo로 one-shot 복귀한다.

**Acceptance criteria**

- [ ] setup stepper에 Present가 없다.
- [ ] providerless result가 “official/verified/issued”로 읽히지 않는다.
- [ ] 320px에서 primary와 cancel이 첫 scroll container 안에 도달 가능하다.
- [ ] presentation은 실제 요청자·목적·공개 항목이 있을 때만 별도 표시된다.

**PRD 보존**

REQ-001/004/005, PERSON-UNVERIFIED→PROOFING→VERIFIED/FAILED,
OmniOne CX route hypothesis, selective disclosure, independent axes, exact
returnTo와 FL-005 checkpoint를 보존한다.

## FL-006 · 장기체류 Residence route unavailable과 passport alternate

**현재 문제**

- Residence provider 미구성이 선택 뒤에야 긴 문장으로 드러나 경로를 잘못
  고른 느낌을 준다.
- unavailable state와 alternate passport가 한 modal 안에서 동일한 visual
  priority로 경쟁한다.
- “registered foreign resident” 같은 설명은 사용자가 이미 선택한 정체성을
  반복할 뿐 행동을 돕지 않는다.

**목표 경험**

이 방법을 지금 쓸 수 없는지 즉시 알고, 입력을 잃지 않은 채 여권 경로로
한 번에 전환한다.

**새 모바일 시퀀스**

Person-required CTA → method sheet에서 Residence unavailable 표시 →
“여권으로 계속” 선택 → passport consent/photo/face preview → result →
exact action resume.

**화면·컴포넌트 규격**

- unavailable method는 64px muted row + 작은 status glyph. 탭 시 이유/대안
  inline expansion, 별도 error modal 금지.
- alternate primary는 52px, “다른 방법”은 text action.
- nationality나 visa status는 카드에 표시하지 않는다.

**모션**

- unavailable row expansion 180ms, 선택 method underline/outline 140ms.
- Residence→passport는 sheet title과 return context를 고정하고 content만
  crossfade한다.

**정보 제거·접기·유지**

- 제거: persona 설명 반복, 국적 추정, generic provider jargon.
- 접기: provider profile 미연결 세부와 data retention.
- 유지: 현재 사용 불가, 여권 대안, cancel, retry 조건, truth.

**상태·실패·복귀**

- Residence unsupported는 실패가 아니라 unavailable decision state다.
- alternate passport 실패는 Residence availability를 바꾸지 않는다.
- 모든 cancel은 원 action과 opener focus를 복원한다.

**Acceptance criteria**

- [ ] Residence availability가 선택 전에 인지된다.
- [ ] alternate 전환에 modal stack이나 route flash가 없다.
- [ ] KO/EN/JA에서 status와 대안 CTA가 320px에 두 줄 이내다.
- [ ] nationality, Age, Account, Payment 상태가 암묵적으로 바뀌지 않는다.

**PRD 보존**

REQ-002/003/005, Residence NOT_CONFIGURED, passport alternate,
provider-neutral proof, privacy와 FL-006 ENTRY~RETURN을 보존한다.

## FL-007 · 단기 여행자 onboarding

**현재 문제**

- value, persona, preference가 각각 흰 full page로 이어져 실제 제품의 핵심인
  지도를 세 번 뒤로 미룬다.
- hero photo와 큰 display title은 예쁘지만 여행 장소를 고르는 행동과 연결되지
  않는다. “바로 지도”와 “20초 개인화”가 경쟁해 primary가 둘처럼 보인다.
- preference를 선택해도 지도에서 어떤 변화가 생겼는지 알 수 없다.

**목표 경험**

처음부터 한국 지도를 보면서 세 번의 가벼운 선택만 하고, 선택 결과가 지도의
장소 강조와 list ordering으로 바로 나타난다. KYC는 묻지 않는다.

**새 모바일 시퀀스**

MapLibre atlas 즉시 표시 + compact value overlay → 여행 방식에서 단기 여행
선택 → taste sheet에서 관심사/식이 요구 선택 → 뒤 지도 marker outline과
추천 순서가 즉시 미리보기로 반응 → “지도로 보기” → Guest city 선택.

세 단계의 의미는 보존하되 세 route로 분리하지 않고 하나의 지도 surface 위
bottom sheet의 snap point로 진행한다. Skip은 어느 단계에서도 Guest map으로
간다.

**화면·컴포넌트 규격**

- map은 viewport 전체, onboarding sheet는 첫 단계 38dvh, 선택 단계 최대
  58dvh다.
- 여행 방식은 3개 64px icon row, preference는 48px chips 또는 2열 tile이다.
- primary 52px 하나, Skip은 quiet text. language switch는 top safe-area에
  44px control 하나.
- 선택 효과는 marker의 2px neutral/accent keyline과 list sort badge로만
  나타낸다. ONDO temperature field의 수치·색·강도는 개인화로 바꾸지 않는다.

**모션**

- sheet snap 280ms, chip selection 120ms, 지도 matching marker keyline
  180ms. 카메라는 선택 단계 사이에 움직이지 않는다.
- completion에서 sheet가 240ms 내려가고 기존 city beacon이 그대로 남는다.

**정보 제거·접기·유지**

- 제거: 별도 hero photo page, step number eyebrow, 장문의 “why we ask”.
- 시각화: 여행 방식, 관심사, 식이 요구, 선택 결과.
- 접기: preference 저장 범위와 source 한 곳.
- 유지: 가치 설명, 세 persona 선택, food/mood/timing/dietary preference,
  skip, change later, Guest discovery.

**상태·실패·복귀**

- preference 저장 실패 시 선택은 sheet 안에 남고 map 진입을 막지 않는다.
- Skip/Close는 KYC 없이 map으로 간다.
- onboarding으로 Back 했을 때 기존 선택과 map camera를 복원한다.

**Acceptance criteria**

- [ ] 첫 paint부터 MapLibre atlas가 있고 별도 white route flash가 없다.
- [ ] preference 선택 후 250ms 안에 최소 한 개 marker 또는 list preview가
  반응한다.
- [ ] 개인화가 온도 점수나 official/editorial truth를 바꾸지 않는다.
- [ ] 320px에서 primary/Skip이 safe-area 위에 함께 도달 가능하다.

**PRD 보존**

REQ-003/007/013/018/019, ONBOARDING-VALUE/INTENT/PREFERENCES,
Guest without KYC, discovery-only storage/reset와 FL-007 checkpoint를 보존한다.

## FL-008 · 한국인 onboarding

**현재 문제**

- “한국인” persona가 identity route처럼 보이거나 이후 Mobile ID가 자동으로
  이어질 수 있다는 오해가 있다.
- 세 persona card의 설명이 길고, 실제 map 차이는 거의 없어 선택 이유가
  약하다.

**목표 경험**

한국인 선택은 오직 탐색 문맥을 조정하는 가벼운 선택이며 신원 확인이 아님을
말이 아니라 흐름으로 드러낸다. 선택 후 바로 같은 지도에 머문다.

**새 모바일 시퀀스**

atlas + onboarding sheet → “한국에서 생활해요” icon row 선택 → preference
선택 → all venues를 유지한 Guest map → Person이 필요한 행동에서만 별도
Mobile ID gate.

**화면·컴포넌트 규격**

- persona label은 identity noun 대신 human intent 한 줄을 쓴다.
- 선택 row에는 ID/shield/check badge를 금지한다. map/list personalization
  preview만 보인다.
- 공통 FL-007 sheet, spacing, CTA 규격을 재사용한다.

**모션**

- 선택 row의 background와 trailing check만 140ms 전환한다.
- map transition은 FL-007과 동일하며 CX handoff animation을 onboarding에
  절대 노출하지 않는다.

**정보 제거·접기·유지**

- 제거: “한국인 확인”, “신뢰 로컬”처럼 검증을 암시하는 copy와 badge.
- 접기: 이 선택이 identity와 무관하다는 설명 한 곳.
- 유지: 한국인 선택지, preference, skip, 나중에 수정.

**상태·실패·복귀**

- selection은 Account/Person/Age/Payment를 바꾸지 않는다.
- 저장 실패, Skip, reset 동작은 FL-007과 같다.
- 나중에 Person gate가 열려도 onboarding choice와 exact action return을
  독립적으로 유지한다.

**Acceptance criteria**

- [ ] persona card에 credential/provider/verified 시각 언어가 없다.
- [ ] selection 전후 identity state가 byte-for-byte 동일하다.
- [ ] KO/EN/JA label이 320px에서 한 row 두 줄을 넘지 않는다.
- [ ] 선택 결과가 지도/list의 설명 가능한 personalization으로 나타난다.

**PRD 보존**

REQ-001/007/013, 한국인 onboarding option, Guest access, JIT Mobile ID,
state-axis independence와 FL-008 전체를 보존한다.

## FL-009 · 장기체류자 onboarding

**현재 문제**

- “장기체류자” 선택이 Residence Card 제출 또는 국적 공개의 시작처럼 보일 수
  있다.
- current persona 설명은 provider availability와 탐색 preference를 한 카드에
  섞을 위험이 있다.

**목표 경험**

생활권 탐색을 위한 preference만 받고, Residence Card는 실제 Person-required
행동에서 사용자가 직접 고를 때까지 등장하지 않는다.

**새 모바일 시퀀스**

atlas + onboarding sheet → “한국에 머물고 있어요” 선택 → 일상 식사/조용한
시간 등 preference → Guest map → 필요 행동에서만 Residence 또는 passport
method choice.

**화면·컴포넌트 규격**

- passport, residence card, nationality flag 이미지를 persona row에서 금지한다.
- preference preview는 생활권 lens를 marker/list ordering에만 적용한다.
- FL-007과 같은 map-backed sheet를 쓴다.

**모션**

- FL-007과 동일. Residence unavailable animation은 FL-006에서만 보인다.

**정보 제거·접기·유지**

- 제거: visa/residency 검증 암시, 국적 flag, provider copy.
- 접기: persona choice가 private preference라는 설명.
- 유지: 장기체류자 option, food/mood/dietary 선택, skip, edit later.

**상태·실패·복귀**

- Residence provider가 unavailable이어도 onboarding 완료와 map 사용은
  영향을 받지 않는다.
- persona reset은 discovery-only state만 지우며 ID session을 지우지 않는다.
- Back은 기존 선택과 map preview를 복원한다.

**Acceptance criteria**

- [ ] onboarding 중 document/photo/credential CTA가 나타나지 않는다.
- [ ] selection은 nationality/public profile을 자동 채우지 않는다.
- [ ] 320/390/430에서 세 persona가 같은 component와 vertical rhythm을 쓴다.
- [ ] reset 범위가 discovery와 identity에서 시각적으로 분리된다.

**PRD 보존**

REQ-002/003/007, 장기체류자 option, Guest discovery, Residence JIT,
nationality privacy와 FL-009 checkpoint를 보존한다.

## FL-010 · protected action의 Account gate

**현재 문제**

- current gate는 “minimum check”, “this tab only”, 계정/본인 chip, return card를
  동시에 보여 사용자가 실제로 해야 할 일보다 상태 모델을 먼저 읽게 한다.
- gate가 identity setup 또는 payment gate와 겹치면 modal이 쌓이는 인상을 준다.
- 큰 두 개 버튼이 경쟁하고 긴 cancel 문장이 320px에서 무겁다.

**목표 경험**

원 행동이 화면의 anchor로 남고 “계정을 만들고 계속” 또는 “취소”만 결정한다.
추가 gate가 필요하면 같은 sheet 안에서 다음 요구로 이어진다.

**새 모바일 시퀀스**

protected CTA → 원 객체를 배경에 유지한 medium sheet → local Account 한 단계 →
성공 즉시 다음 unmet gate 또는 exact action → failure면 같은 sheet Retry →
cancel이면 source control focus.

**화면·컴포넌트 규격**

- header에 source object thumbnail/title 40px.
- account glyph 48px, title 26/32, body 두 줄 이하, disclosure 하나,
  primary 52px, cancel은 44px text action.
- multi-gate progress는 실제 unmet requirement만 icon trail로 보이며 완료하지
  않은 축을 check로 표시하지 않는다.

**모션**

- source CTA→sheet 280ms, success check morph 180ms, 다음 gate content
  crossfade 180ms. modal backdrop를 다시 생성하지 않는다.
- cancel은 sheet 240ms dismiss 후 opener focus ring을 600ms 유지한다.

**정보 제거·접기·유지**

- 제거: “Minimum check”, 항상 보이는 on-device/account boundary,
  generic return card, axis chips.
- 접기: session/local account, storage, provider truth.
- 유지: 원 행동, 계정이 필요한 이유, primary, cancel, failure/retry,
  다음 unmet gate.

**상태·실패·복귀**

- local Account 생성은 Person/Age/Payment/K-Tour ID를 바꾸지 않는다.
- 실패 시 pending token과 target payload를 보존한다.
- cancel/timeout/refresh는 one-shot return contract와 stale pending 정리 규칙을
  따른다.

**Acceptance criteria**

- [ ] 첫 viewport에서 질문 하나와 primary 하나만 경쟁한다.
- [ ] 연속 gate 동안 modal/sheet DOM depth가 한 층을 넘지 않는다.
- [ ] 성공 후 추가 tap 없이 원 행동 또는 다음 unmet gate로 간다.
- [ ] 200% text zoom에서도 close/primary/cancel이 도달 가능하다.

**PRD 보존**

REQ-004/005, ACCOUNT-ABSENT/PRESENT, independent gate axes, pending payload,
TTL, one-shot consume, exact returnTo와 FL-010 전체를 보존한다.

## FL-011 · Save 후 My Korea 복귀

**현재 문제**

- current My Korea는 “ON THIS DEVICE”를 heading과 map card에서 반복하고,
  저장·Table·Local Signal의 긴 설명을 card마다 붙여 기록보다 운영 설명이
  먼저 보인다.
- nested cards, pills, shadows가 많고 저장 장소의 음식 사진이 약해 기억을
  불러오는 힘이 부족하다.
- bottom nav label은 좁은 화면에서 두 줄이 되어 nav가 콘텐츠보다 커진다.

**목표 경험**

bookmark를 누르면 즉시 저장됐음을 느끼고, My Korea에서 지도와 사진 기반
여행 기억으로 다시 찾는다. local-only와 no-reservation truth는 필요한 곳에서만
확인한다.

**새 모바일 시퀀스**

venue Save → bookmark fill/micro-toast → My Korea icon nav →
saved map + photo timeline → saved venue tap → canonical city/peek →
Back으로 동일 My Korea scroll/focus. Account가 없으면 FL-010 후 자동 save.

**화면·컴포넌트 규격**

- mobile bottom nav 5개 icon-only, 48px target, 전체 64px + safe-area.
- My Korea title 28/34, map memory 180px, saved row 88px photo + name/category/
  city, planned meal은 compact timeline.
- local storage truth와 reset은 top info disclosure 한 곳에만 둔다.
- no reservation은 planned meal row의 calendar-outline status와 accessible
  label로 표시하고 상세에서 한 문장으로 설명한다.

**모션**

- bookmark outline→fill 140ms, toast 180ms in/2s/160ms out.
- saved row→venue peek은 photo/title shared emphasis 260ms.
- canonical history 복귀 시 scroll jump 대신 180ms focus highlight.

**정보 제거·접기·유지**

- 제거: 반복 “on this device”, card별 운영 설명, bottom nav visible labels.
- 시각화: saved, planned, signal 종류와 도시 분포.
- 접기: local-only/no sync, reset 범위, source details.
- 유지: saved venue, table plan, signal history, no reservation truth,
  reset, canonical Back/Forward.

**상태·실패·복귀**

- save failure는 bookmark 원상복구 + compact retry toast.
- duplicate save는 개수를 늘리지 않고 saved state를 유지한다.
- reset confirmation은 discovery data와 ID session reset을 분리한다.
- saved entry는 exact venue/opener/city history를 복원한다.

**Acceptance criteria**

- [ ] 320px bottom nav item이 두 줄 text를 만들지 않는다.
- [ ] save feedback가 200ms 안에 보이며 실패 시 false filled state가 남지 않는다.
- [ ] saved venue에서 Back/Forward/reload가 같은 My Korea context로 돌아간다.
- [ ] 사진 없는 장소는 같은 크기의 branded placeholder를 쓰고 layout이
  흔들리지 않는다.

**PRD 보존**

REQ-004/007/015, account-gated save, local persistence, My Korea aggregation,
canonical B history, separate reset partitions와 FL-011 전체를 보존한다.

## FL-012 · Local Signal과 작은 사진

**현재 문제**

- current full sheet는 큰 질문, 네 선택, note, photo, privacy 설명을 한 번에
  보여 세로가 길고 primary가 늦게 나온다.
- local signal이 온도 field나 public review에 즉시 반영되는 것처럼 느껴질
  여지가 있다.
- Person/K-Tour gate에서 돌아올 때 place context가 약해지고 modal 전환이
  연속되지 않는다.

**목표 경험**

현재 장소를 anchor로 두고 느낌 1~2개를 탭하고, 필요하면 사진/메모를 더한 뒤
보낸다. 무엇이 바뀌는지는 Visit와 Contribution 두 축으로만 명확하다.

**새 모바일 시퀀스**

place CTA → Person/K-Tour gate가 필요하면 같은 anchored shell → place photo/
name header → 2×2 pictogram 선택 → optional note/photo row → preview →
submit/failure → one-shot result → place 또는 My Korea로 복귀.

**화면·컴포넌트 규격**

- place header 56px, signal pictogram tile 72px 2×2, 최대 두 개 선택.
- note는 collapsed 48px row에서 열고, photo는 72px thumbnail + replace/remove.
- privacy/source는 disclosure 하나, CTA 52px sticky.
- success는 Visit/Contribution 두 작은 axis ring만 채우고 종합 점수를 금지한다.

**모션**

- pictogram selection 120ms fill, photo thumbnail 180ms fade, upload-like
  fake progress 금지.
- success ring 260ms one-shot 뒤 700ms 유지하고 자동 return 또는 명확한 CTA.
- gate→signal은 동일 place header를 공유해 180ms content swap한다.

**정보 제거·접기·유지**

- 제거: public review/heat contribution 암시, 반복 local-device 문장.
- 시각화: 선택 느낌, photo presence, Visit/Contribution 변화.
- 접기: image memory lifecycle, provider/server 부재, 상세 privacy.
- 유지: note/photo optionality, replace/remove, fail/retry, publish scope,
  exact place, Person gate.

**상태·실패·복귀**

- 실패 시 선택·note·preview를 보존하고 Retry/Cancel.
- image object URL은 replace/remove/close 시 해제한다.
- success는 Meetup/stamp/heat/public profile을 바꾸지 않는다.
- cancel은 place CTA focus와 sheet snap을 복원한다.

**Acceptance criteria**

- [ ] 390px 첫 viewport에 place, 네 signal tile, primary가 보인다.
- [ ] 320px에서는 tile label이 두 줄 이내이고 touch target 48px 이상이다.
- [ ] failure/retry 후 draft와 photo preview가 유지된다.
- [ ] success 전후 Meetup, stamp, temperature field가 불변이다.

**PRD 보존**

REQ-003/009/015, note/photo preview/remove/fail/retry, Person-required action,
Visit+Contribution only, simulated-local truth와 FL-012 전체를 보존한다.

## FL-013 · 수동 After 19 진입

**현재 문제**

- map tray의 “19+” text control은 기능은 찾기 쉽지만 위치·layer·Stories control과
  같은 무게라 모드 전환인지 필터인지 불분명하다.
- 수동 진입 proof와 venue-specific FL-002가 유사한 화면을 반복해 사용자가
  같은 일을 두 번 하는 느낌을 받을 수 있다.

**목표 경험**

moon/19+ layer를 켜는 행동으로 이해하고, proof가 필요할 때만 한 장의 sheet가
나온 뒤 동일 도시·지도 상태에서 layer가 켜진다.

**새 모바일 시퀀스**

map의 moon/19+ icon → 이미 유효하면 즉시 night crossfade → 미확인이면
city-anchored Age sheet → proof success → 같은 center/zoom/filter에서 After19
layer on → 수동 off 시 즉시 원 테마·필터로 복귀.

**화면·컴포넌트 규격**

- inactive icon 48px, active는 filled magenta keyline + 작은 moon, label은
  accessible name과 first-use tooltip에만 둔다.
- proof sheet는 FL-002와 같은 component를 쓰되 venue thumbnail 대신 city
  context를 표시한다.
- active state는 top tray 한 곳에서만 지속 표시한다.

**모션**

- control press 120ms, proof 완료 뒤 theme crossfade 220ms.
- marker/field geometry와 camera는 전환 동안 고정한다.

**정보 제거·접기·유지**

- 제거: 화면 곳곳의 반복 After19 배너, mode 설명 card.
- 접기: preview policy와 official restriction 비주장.
- 유지: active/off state, proof expiry, cancel/retry, simulated night-category
  범위의 truth.

**상태·실패·복귀**

- proof 실패/취소 시 layer는 off이고 map context는 그대로다.
- manual off는 해당 세션에서 auto-on보다 우선한다.
- expired state는 이유와 다시 확인 action을 제공한다.

**Acceptance criteria**

- [ ] active/inactive가 색 없이도 glyph/fill/outline로 구분된다.
- [ ] mode 전환 전후 map center/zoom/selection이 동일하다.
- [ ] manual off 뒤 같은 세션에서 자동으로 다시 켜지지 않는다.
- [ ] 320px에서 tooltip이 viewport와 bottom nav를 넘지 않는다.

**PRD 보존**

REQ-005/012, AGE independent state, manual After19, session manual-off,
expiry/retry, simulated night subset와 FL-013 전체를 보존한다.

## FL-014 · guard 기반 자동 After 19

**현재 문제**

- current night surface는 black/dark contrast가 강하지만 coastline, road,
  district label이 거의 사라져 heat point가 공간과 분리된다.
- light component를 단순 반전해 white card와 magenta outline이 섞이며,
  일부 control의 elevation과 radius가 daytime과 다르게 보인다.
- 자동 진입 이유와 만료 이유가 banner/card로 반복되면 map을 가린다.

**목표 경험**

같은 지도의 야간 lens가 조용히 켜지고, 사용자는 지형과 선택 장소를 잃지 않은
채 밤 카테고리의 온도를 더 선명하게 본다.

**새 모바일 시퀀스**

네 guard 통과 → 현재 map frame 유지 → 220ms night token crossfade →
night-category field/eligible venue emphasis → 첫 진입에만 compact toast →
manual off 또는 proof expiry → 같은 frame에서 light 복귀. 만료 뒤 재진입은
FL-013 proof로 연결한다.

**화면·컴포넌트 규격**

- night canvas #0b0d12 계열, land #171b22, water #0d151b, road #303641,
  primary label 4.5:1, secondary geography 3:1 이상.
- heat core에는 2px neutral keyline을 둬 magenta/orange가 dark field에
  묻히지 않게 한다.
- 모든 control geometry, 48px target, sheet radius는 light와 동일하다.
- 제주도 동일 renderer와 dashed limited halo를 유지한다.

**모션**

- color/background only 220ms; camera, geometry, cluster 위치는 변경 금지.
- first auto-on에만 beacon bloom 240ms one-shot. reduced motion은 즉시 토큰
  교체 + live region announcement.

**정보 제거·접기·유지**

- 제거: 지속 banner, “dark mode” 설명, 법적 restriction처럼 보이는 lock 남발.
- 시각화: active night layer, eligible category, expired/off.
- 접기: 네 guard와 policy 세부.
- 유지: first-use 이유, manual off, expiry reason, Check again, 공식 사실
  비주장.

**상태·실패·복귀**

- guard는 Age verified + unexpired + KST 19:00+ + auto-on + not manual-off를
  모두 만족해야 한다.
- expiry는 field를 안전하게 해제하고 selected venue를 locked state로 되돌린다.
- error/retry는 map을 지우지 않고 active control 근처 compact message로 처리한다.

**Acceptance criteria**

- [ ] night에서도 coast/road/district를 보고 현재 도시를 식별할 수 있다.
- [ ] light/night pixel geometry diff에서 marker center displacement가 0~1px다.
- [ ] 네 guard 중 하나라도 false이면 auto-on되지 않는다.
- [ ] toast dismissal 후에도 icon state와 accessible name으로 mode를 알 수 있다.

**PRD 보존**

REQ-012/019, AFTER19-AUTO-ON/OFF/EXPIRED, 네 guard, manual-off 우선,
night-category only, same selection geometry, D-14/D-15와 FL-014를 보존한다.

## FL-015 · 선택 공개 profile과 4축 reputation

**현재 문제**

- public profile form은 From/Lives/Languages를 모두 같은 text input 무게로
  보여 공개 범위 결정을 충분히 시각화하지 못한다.
- My Korea의 reputation은 Identity/Visit/Contribution/Meetup을 설명 card로
  늘어놓으면 종합 “신뢰 점수”처럼 읽히거나 정보 밀도가 커진다.
- 사업계획서의 국적 기반 타깃 문맥을 가져오면 privacy와 전문성 오해가 생긴다.

**목표 경험**

각 필드가 선택 공개임을 눈으로 이해하고, 네 축은 서로 독립된 활동 기록으로만
본다. nationality/identity가 안전·전문성 점수로 변하지 않는다.

**새 모바일 시퀀스**

My Korea → profile compact summary → Edit sheet → From/Lives/Languages 각각
value + visibility toggle → preview → Save/failure → profile summary →
activity axes tap 시 evidence timeline.

**화면·컴포넌트 규격**

- field row 56px, trailing visibility eye 44px, 공개는 filled, 비공개는 slash.
- profile preview는 avatar/name/공개한 필드만 한 card.
- 네 축은 동일 크기 4-segment ring 또는 2×2 metric row로 표시하고 총점,
  평균, green safety badge를 금지한다.
- 각 축 tap 시 source event timeline을 medium sheet로 연다.

**모션**

- visibility toggle 140ms icon morph, preview field 180ms fade.
- axis update는 변경된 segment만 240ms 채우고 전체 badge celebration을
  만들지 않는다.

**정보 제거·접기·유지**

- 제거: nationality flag 자동 표시, “trusted/safe/expert” 총평, 국적 기반 추천.
- 시각화: public/private, 네 독립 축, source event.
- 접기: local storage/reset, evidence metadata.
- 유지: From/Lives/Languages 선택 공개, empty/clear, Save failure,
  Identity/Visit/Contribution/Meetup separation.

**상태·실패·복귀**

- Save failure 시 draft와 visibility를 유지한다.
- empty field는 공개 toggle을 켤 수 없고 이유를 inline으로 표시한다.
- discovery reset과 ID session reset은 public profile 변경과 별도다.
- Back은 My Korea scroll/focus를 복원한다.

**Acceptance criteria**

- [ ] 비공개 필드는 profile preview와 public surface에 나타나지 않는다.
- [ ] 네 축 중 한 event가 다른 축의 visual value를 바꾸지 않는다.
- [ ] 색을 제거해도 공개/비공개와 axis 상태가 구분된다.
- [ ] 320px/200% zoom에서 field label, value, toggle이 겹치지 않는다.

**PRD 보존**

REQ-008/015, optional self-declared From/Lives/Languages, four-axis reputation,
no aggregate safety score, independent reset/persistence와 FL-015 전체를
보존한다.

## FL-016 · 장소 fact와 merchant evidence

**현재 문제**

- place detail의 source/evidence가 prose row와 disclosure에 묻혀 실제 방문
  결정에 필요한 “카드/전화/메뉴/언어/예약” 상태가 빠르게 읽히지 않는다.
- verified, unknown, stale, error가 text에 의존하면 official place record가
  모든 상점 특성을 보증하는 것처럼 오해된다.
- Labs trait와 소비자 fact가 시각적으로 떨어져 있어 evidence의 존재 이유가
  약하다.

**목표 경험**

상점 이용 가능 정보는 pictogram과 명확한 상태로 먼저 읽고, 근거가 궁금할 때
source drawer를 연다. unknown은 빈칸이나 긍정으로 보이지 않는다.

**새 모바일 시퀀스**

place detail → “방문 전 확인” fact rail → fact tap →
confirmed/unknown/stale/error evidence sheet → source/retry →
place detail exact fact focus. Labs에서는 동일 fact ID의 adapter receipt를
기술적으로 확인한다.

**화면·컴포넌트 규격**

- fact는 48px icon cell, label, 상태 glyph로 구성한 horizontal rail 또는
  2×3 grid. 색 외에 check/question/clock/warning shape를 쓴다.
- evidence sheet 첫 줄은 consumer answer, 둘째 줄 source/freshness.
- adapter/version/signature 상세는 Labs deep link에만 둔다.

**모션**

- fact tap 120ms, evidence sheet 260ms, retry state 180ms.
- stale→fresh에서 icon morph만 하고 place 전체를 rerender하지 않는다.

**정보 제거·접기·유지**

- 제거: “Can I Go” 총판정, official=eligible 암시, safety guarantee.
- 시각화: card/phone/reservation/language/menu/19 fact와 네 상태.
- 접기: source ID, snapshot timestamp, issuer, adapter, receipt envelope.
- 유지: official/editorial provenance, UNKNOWN, stale/error/mismatch, retry.

**상태·실패·복귀**

- unknown은 negative와 다르며 CTA를 임의로 차단하지 않는다.
- error/mismatch는 이전 confirmed value를 현재로 재사용하지 않는다.
- Retry 후 exact fact sheet를 유지하고 Back은 place detail의 해당 fact로 간다.

**Acceptance criteria**

- [ ] 모든 fact가 confirmed/unknown/stale/error 중 하나를 시각·accessible
  text로 가진다.
- [ ] official record만으로 payment/language/open status가 confirmed되지 않는다.
- [ ] 320px에서 rail은 잘린 label 대신 의도적 horizontal scroll cue를 보인다.
- [ ] consumer screen에 OpenDID/EAS adapter 이름이 항상 노출되지 않는다.

**PRD 보존**

REQ-004/007/013/014, evidence envelope, OpenDID/EAS adapter 분리,
merchant trait limitation, unknown/stale/error/mismatch와 FL-016 전체를
보존한다.

## FL-017 · checkout JIT Payment KYC

**현재 문제**

- Account/Person/Payment chip과 technical truth가 동시에 보이면 사용자는
  결제에 필요한 한 단계 대신 내부 상태표를 읽게 된다.
- checkout amount가 배경에서 사라지거나 gate modal이 새로 쌓이면 돌아와
  금액이 바뀌지 않았는지 확인할 수 없다.
- “₩60,000”과 “Ready · no funds added” 같은 조합은 local frontend ledger와
  실제 spendable funds를 모순되게 보이게 한다.

**목표 경험**

금액과 선택 혜택을 계속 보면서 결제 준비에 필요한 항목 하나만 확인한다.
provider가 없으면 spendable balance처럼 보이지 않으며, 성공 뒤 같은 checkout
결정으로 자동 복귀한다.

**새 모바일 시퀀스**

Confirm offer → pinned venue/final KRW summary → unmet Payment KYC sheet →
consumer consent → provider-unavailable/local outcome → exact checkout resume →
confirm/cancel/failure. 여러 gate가 있으면 실제 unmet 순서만 동일 shell에서
진행한다.

**화면·컴포넌트 규격**

- pinned amount header 64px, 변하지 않는 final KRW를 표시한다.
- payment requirement row 64px, disclosure 한 개, primary 52px.
- 실제 funds가 없으면 balance 숫자를 보여주지 않고 “결제수단 준비 필요”로
  표시한다. local fixture 60,000은 “여행 예산”처럼 비금전 계획으로 명확히
  라벨하거나 technical detail로 옮긴다.
- OOKRW/USDC/USDT/network는 payment details 또는 Labs에만 둔다.

**모션**

- checkout→gate는 amount header를 shared anchor로 유지한 260ms sheet morph.
- result→checkout 180ms content swap, final amount는 crossfade하지 않는다.
- failure는 160ms inline row, destructive shake 금지.

**정보 제거·접기·유지**

- 제거: 정상 화면의 technical ticker, 모든 axis chip, provider brand.
- 접기: provider 미연결, no-money-moves, technical ledger, retention.
- 유지: final KRW, 결제에 필요한 이유, consent, failure/retry/cancel,
  Payment independence.

**상태·실패·복귀**

- Payment KYC success/failure는 wallet asset과 Person/Age를 바꾸지 않는다.
- cancel/failure에서 venue, benefit, amount, consent draft를 보존한다.
- stale/expired pending은 안전하게 취소하고 false success receipt를 금지한다.

**Acceptance criteria**

- [ ] gate 모든 단계에서 final KRW와 venue를 확인할 수 있다.
- [ ] spendable funds가 없을 때 positive balance + “no funds”가 함께 보이지 않는다.
- [ ] Account, Person, Age, Payment 상태가 독립적으로 테스트된다.
- [ ] success 뒤 추가 tap 없이 exact checkout으로 복귀한다.

**PRD 보존**

REQ-005/006/011, D-13, PAYMENT-KYC-REQUIRED/VERIFIED/FAILED, asset invariance,
exact checkout returnTo와 FL-017 전체를 보존한다.

## FL-018 · Labs wallet/asset/bridge

**현재 문제**

- current Labs intro는 honest하지만 큰 빈 공간과 중앙 정렬 설명으로 실험
  도구보다 또 하나의 onboarding처럼 보인다.
- 여러 자산과 bridge state를 소비자 wallet에 가까운 카드로 표현하면 실제
  spendable/custodied asset으로 오해할 수 있다.
- success animation이 source confirmed와 destination final을 한 번에 축하하면
  bridge truth를 훼손한다.

**목표 경험**

Labs는 소비자 여정과 분리된 명확한 technical workspace다. 자산은 서로 다른
ledger로 보이고, bridge의 각 단계와 실패 불변식을 시각적으로 추적한다.

**새 모바일 시퀀스**

My Korea/ID & Wallet의 기술 상세 → Labs acknowledgment 1회 →
signer 상태 → USDC/USDT/OOKRW separate asset tabs → bridge amount/route →
source pending/confirmed → destination pending/final 또는 timeout/failure →
receipt/evidence → optional badge preview.

**화면·컴포넌트 규격**

- persistent Labs flask glyph + “Labs” 44px header, production wallet과 다른
  neutral grid background. 매 방문마다 큰 intro modal을 띄우지 않는다.
- asset selector는 48px segmented rows이며 합산 USD 총액을 금지한다.
- bridge는 4-step vertical timeline: source request, source confirmed,
  destination pending, destination final.
- exact “Target network: Sui Testnet · Simulated”는 network decision surface에
  보존한다. txRef가 없으면 explorer-like link를 만들지 않는다.

**모션**

- step state 180ms line fill, pending은 low-motion opacity pulse 1.2s.
- source confirmed에서 success celebration 금지; destination final에서만
  compact check 240ms.
- timeout/failure는 timeline을 유지하고 Retry를 해당 step에 붙인다.

**정보 제거·접기·유지**

- 제거: consumer home의 bridge/AMM claim, 합산 USD balance, fake explorer.
- 시각화: separate assets, ordered finality, immutable failure balance.
- 접기: adapter payload, evidence envelope, signer fixture metadata.
- 유지: OOKRW/USDC/USDT, zkLogin fixture, OpenDID/EAS separate adapters,
  merchant trait, badge opt-in, target network truth, no AMM.

**상태·실패·복귀**

- source confirmed 전 cancel 가능, 이후는 state를 되돌린 것처럼 보이지 않는다.
- failure/timeout에서 destination balance가 증가하지 않는다.
- Retry는 idempotent route를 사용하고 duplicate receipt를 만들지 않는다.
- Labs close는 진입한 My Korea/Wallet disclosure focus로 복귀한다.

**Acceptance criteria**

- [ ] 세 asset이 합쳐지거나 서로 치환된 것처럼 보이지 않는다.
- [ ] destination final 전 success copy/icon/balance 증가가 없다.
- [ ] failure/timeout 전후 asset invariant가 시각·상태 테스트에서 일치한다.
- [ ] 320px에서 4-step timeline과 Retry가 horizontal overflow 없이 읽힌다.

**PRD 보존**

REQ-004/005/006/014/016, D-13, LABS-ACK/SIGNER/ASSETS/BRIDGE,
OpenDID/EAS adapter separation, merchant trait, badge opt-in, no AMM,
truth=SIMULATED와 FL-018 전체를 보존한다.

---

## 5. 교차 Flow에서 반드시 닫아야 할 gap

### P1 · 구현 전에 합의해야 함

1. **실제 지도 continuity:** intro와 city가 동일 MapLibre instance/visual
   world인지 확정하고 shared beacon/camera choreography를 잠근다.
2. **D-14 renderer 준수:** 큰 city pill을 44px beacon + adjacent label로 바꾸고
   서울 double, 부산 single, 제주 dashed halo를 색 외 형태로 증명한다.
3. **개인화의 실제 효과:** preference는 temperature truth를 바꾸지 않으면서
   marker keyline/list ordering에 즉시 반영돼야 한다. 효과를 구현하지 못하면
   효과를 약속하는 copy만 줄일 것이 아니라 해당 약속을 제품팀이 다시
   결정해야 한다.
4. **setup/presentation 분리:** K-Tour ID의 setup은 Choose-Check-Add, 실제
   presentation은 gated action의 requester/purpose/fields 화면으로 분리한다.
5. **night geography:** After19에서도 지도 맥락과 동일 geometry를 보존한다.
6. **currency truth:** normal checkout/receipt/wallet에서 OOKRW/USDC/USDT를
   제거하고 “positive balance인데 funds 없음” 모순을 없앤다.
7. **single-sheet gate:** Account→Person→Age→Payment가 modal stack이 아니라
   한 anchored shell의 unmet requirements로 이어져야 한다.

### P2 · 시각 품질 파동에서 함께 수정

- bottom navigation mobile icon-only와 accessible labels
- display title 반복 축소, card/radius/elevation 단계 정리
- photo-led venue/Table/My Korea lists
- source/privacy/provider 문장 한 disclosure로 통합
- EN/KO/JA line-break token과 short-landscape rail 재검증
- success page 남발 대신 source object의 inline morph 사용

## 6. 검증 계획

현재 300개 visual baseline은 UI geometry regression 증거로 유효하지만 외부
basemap을 deterministic empty source로 대체하므로 **실제 지도 선명도와
지리 인지는 증명하지 못한다**. MapLibre를 유지한 채 최소 Korea/city geometry를
담은 deterministic local fixture 또는 별도 live-map recording evidence가
필요하다.

### viewport와 언어

- current evidence의 360×800, 390×844, 430×932, 768×1024, 801×1000,
  1440×1000 matrix는 삭제하지 않는다. 아래는 mobile-first 추가 gate다.
- 320×568, 320×800, 390×844, 430×932 portrait
- 844×390 short landscape
- EN/KO/JA 각각 system font, 200% text zoom
- safe-area top/bottom 0과 notch/home-indicator 환경

### 자동·수동 acceptance

- horizontal overflow 0, 12px 미만 metadata 0, 44px 미만 target 0
- nav/CTA/keyboard/close collision 0
- 한 viewport에서 primary CTA 경쟁 0
- modal/sheet active layer 최대 1
- map camera selection displacement, Map/List parity, Back/Forward/reload
- 800ms progress와 5초 List foreground를 fake timer로 검증
- prefers-reduced-motion에서 camera duration 0, focus/announcement 유지
- 실제 420~450ms atlas→city와 light→night를 frame recording으로 검토
- locale별 pseudo-expansion 130%, JA 금칙과 line-height, CTA 두 줄 제한
- screen reader에서 icon-only nav/control의 current state와 accessible name 확인

### D2 완료 판정

다음 조건 전에는 D2 CLEAN이 아니다.

- FL-001~018 각각 ENTRY/DECISION/CANCEL/ERROR/RETRY/TERMINAL/RETURN이
  시각 명세와 연결된다.
- D-13~D-15 위반이 0이다.
- 지도 first frame, city flight, loading, fallback, night transition의
  동영상 evidence가 있다.
- 320/390/430 EN/KO/JA에서 clipping, unreachable action, text collision이 0이다.
- 기능·state·truth·returnTo를 숨긴 것이 아니라 A/B/C 정보층으로 추적 가능하다.
- 같은 product/harness tuple에서 독립 clean round 2회가 끝난다.

## 7. D2 단일 권장 구현 순서

1. global type/spacing/radius/elevation/icon/sheet/motion token을 먼저 고정한다.
2. FL-001과 D-14/D-15 지도 choreography를 닫고 Map/List/Jeju/After19 공통
   renderer를 잠근다.
3. FL-007~009 onboarding을 같은 map-backed sheet로 바꾸고 preference effect를
   연결한다.
4. FL-005/006/010/013/017의 gate를 single-sheet coordinator로 통일하고
   K-Tour setup과 presentation을 분리한다.
5. FL-004/011/015/018의 wallet/My/Labs hierarchy와 D-13 통화를 정리한다.
6. FL-003/012/016의 photo, pictogram, fact evidence를 시각화한다.
7. 마지막에만 baseline을 갱신하고 위 검증 계획을 동일 tuple에서 수행한다.

이 순서는 새 복잡한 flow를 만드는 안이 아니다. 현재 18개 flow와 상태 머신을
그대로 두고, 공통 shell·component·motion grammar로 합쳐 사용자가 읽어야 하는
양과 맥락 단절을 줄이는 안이다.
