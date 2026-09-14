# FL-001 · Guest Discover

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-007`, `REQ-013`, `REQ-017`, `REQ-018`, `REQ-019` |
| 진입 행동 | 로그인하지 않은 사용자가 앱을 열거나, 국가 지도·도시·장소 deep link로 들어온다. |
| 성공 결과 | 같은 current B MapLibre instance에서 대한민국→도시→장소를 탐색하고 장소 상세 또는 외부 길찾기에 도달한다. |
| 취소 결과 | peek/detail/filter를 닫으면 직전 camera·query·filter·선택·scroll이 그대로인 지도 또는 semantic List로 돌아간다. |
| 실패·재시도 | 지도/타일/위치 실패에도 같은 결과 List와 검색을 유지하고, Retry는 현재 context 안에서만 수행한다. |
| 정확한 복귀 | URL/history에 공개 가능한 city, camera, map/list, query, filters, category, venue, layer, sheet snap, list scroll을 보존한다. 길찾기에서 돌아오면 같은 venue sheet와 opener focus를 복원한다. |
| 실행 truth | 지도는 current B `MapLibre`; 서울·부산은 공식 LOCALDATA 장소와 별도인 curated-scored ONDO signal, 제주는 editorial-unscored coverage다. ONDO는 기온·실시간 혼잡·평점·안전 점수가 아니다. |

### 삭제할 수 없는 PRD 불변식

- Guest는 Account·Person·Age·Payment KYC 없이 지도, 검색, 필터, 장소 상세, 외부 길찾기를 끝낸다.
- 서울·부산의 공식 장소와 제주 editorial place를 같은 출처나 같은 점수로 합치지 않는다.
- 세 도시는 같은 `field → aura → core → selected halo → capsule` renderer, hit target, selection, transition을 쓴다.
- 제주는 `score=null`, `editorial-unscored`이며 장소·story 수를 인기·혼잡·ONDO 점수로 변환하지 않는다.
- Map/List는 결과·순서·filter·selection parity를 유지한다. 저장은 `FL-010`/`FL-011` 소유다.
- D-15의 같은 map instance, 800ms/5s recovery, reduced-motion `jumpTo`를 보존한다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| 지도 위 큰 city pill·hero layer가 해안선과 다른 도시를 가린다. | 한국 지도인지, 어디를 누르는지 1초 안에 이해하기 어렵다. | P1 | `MAP-KOREA`, 320/390 첫 viewport |
| intro와 city 화면이 다른 surface처럼 끊기거나 흰 frame이 보인다. | 장소를 향해 이동한다는 공간 연속성이 사라진다. | P1 | atlas→city 전환 |
| 서울·부산·제주의 beacon·label·source 표현이 다르다. | 제주가 덜 지원되거나 온도가 없는 도시로 오인된다. | P1 | D-14 불일치 |
| `Pulse/Hot/Peak`, record count, 인허가·source 설명이 기본 화면을 차지한다. | 온도를 보기도 전에 제품·행정 설명을 읽게 된다. | P1 | marker/list/peek 기본 상태 |
| 위치 권한 실패가 중앙 popover로 지도를 가린다. | search fallback이 보이지 않고 탐색이 중단된 것처럼 느껴진다. | P1 | `FX-MAP-LOCATION-DENIED` |
| 지도 loading이 blank/splash 또는 무한 pulse로 보일 수 있다. | 느린 네트워크에서 앱이 멈춘 것으로 보이고 query context를 잃는다. | P1 | `FX-MAP-TILE-FAIL` |

## 3. 목표 경험

### 한 문장 약속

> 앱을 여는 순간 살아 있는 대한민국 지도에서 온도를 보고, 한 번의 부드러운 줌으로 원하는 장소까지 간다.

### 사용자가 1초 안에 알아야 하는 것

- 지금 보고 있는 것은 대한민국 지도이며 서울·부산·제주가 선택 가능하다.
- beacon의 field/aura가 장소가 모인 온도 신호이고, label은 도시 이름이다.
- Guest 상태 그대로 도시와 장소를 열 수 있다.

### 사용자가 읽지 않아도 알아야 하는 것

- 선택한 beacon이 즉시 단단한 selected halo가 되고 camera가 그 좌표로 이동한다.
- 도시 진입 뒤 검색·filter·Map/List가 지도 위 같은 공간에 나타난다.
- official/editorial 차이는 같은 source glyph+짧은 label로 보이고 상세 근거는 사용자가 열 때만 나온다.
- 뒤로 가면 camera와 sheet가 역방향 공간 관계로 복원된다.

## 4. 권장 모바일 여정

```text
ENTRY: MapLibre 대한민국 atlas가 첫 paint부터 보임
→ DECISION: Seoul / Busan / Jeju beacon 선택
→ PENDING: 같은 map에서 420–500ms camera 이동
→ CITY: 검색·filter·Map/List로 결과 탐색
→ PLACE: marker/list item → Peek → Detail
→ TERMINAL: 외부 길찾기 또는 장소 판단 완료
→ CANCEL | FAILURE | RETRY
→ RETURN: 같은 city/camera/query/filter/venue/sheet/focus
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 어느 도시를 볼까? | 실제 해안선 위 세 CityTemperatureBeacon | 도시 beacon 탭 | locale, onboarding preference, atlas camera |
| City pending | 선택한 도시로 이동 중인가? | selected halo와 이동하는 동일 지도 | 추가 입력 잠금 없이 기다림/Back | target city, map instance, route line |
| City | 어디서 먹을까? | 온도 field와 장소 marker | search/filter/marker/List | camera, query, filter, category, result order |
| Peek | 이 장소를 더 볼까? | source-backed media+장소명+온도 object | 상세 보기/길찾기 | venueId, marker selection, sheet snap |
| Detail | 가기 전에 충분한가? | hero media+FactStrip+action | 길찾기 | venueId, source/fact states, scroll |
| Failure | 지도가 없어도 계속 볼까? | 같은 결과 semantic List | 다시 시도 | 모든 공개 discovery context |
| Return | 방금 보던 곳인가? | 같은 selected marker와 sheet | 탐색 계속 | history state와 opener focus |

## 5. 화면별 상세 규격

### Screen A · Korea atlas

**목적**

- 별도 poster나 white landing 없이 같은 MapLibre 안에서 대한민국과 세 도시를 선택하게 한다.

**첫 viewport에 보이는 것**

- 식별 가능한 대한민국 해안선·육지/바다 대비, 얇은 Seoul→Busan→Jeju route.
- 44×44px 이상 beacon 세 개와 인접 도시 label, 한 줄 headline.
- phone icon-only dock은 첫 진입 guide가 끝난 뒤 나타나며 지도를 가리지 않는다.

**시각·인터랙션**

- beacon은 동일 geometry; 서울 double solid, 부산 single solid, 제주 dashed limited ring은 source state만 구분한다.
- label 위치는 projected coordinate에 고정하고 hover/focus/touch에서 이동하지 않는다.
- 지도의 geography가 headline scrim보다 우세하며 회전·기울어진 흰 pseudo-layer를 쓰지 않는다.

**행동**

- Primary: city beacon 탭.
- Secondary: 언어 변경.
- Close/Back: deep link가 아니면 없음; browser Back은 이전 public history.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 도시명, 선택 상태, semantic List 대안 |
| 시각화 | field/aura/core, route, official/editorial source ring |
| 한 번 접기 | compact MapKey의 ONDO 의미와 source 범위 |
| Labs/개발 문서로 이동 | score 산식, fixture ID, source adapter, sampling 세부 |
| 삭제 | `Pulse`, `Hot`, `Peak`, `200 official records`, `인허가`, 큰 city CTA pill, 중복 도시 설명 |

### Screen B · City map/List

**목적**

- 사용자가 검색·filter·온도를 함께 보고 같은 결과를 map 또는 list로 판단하게 한다.

**첫 viewport에 보이는 것**

- compact PageHeader, 48–52px search, 자주 쓰는 3~5 filter rail, usable map 58% 이상.
- locate/After19/editorial utility는 한 tray, Map/List는 하단 한 lane.
- 장소는 온도 marker와 짧은 label로 보이며 숫자 score는 없다.

**시각·인터랙션**

- search autofocus 금지; 사용자가 누르기 전 keyboard가 열리지 않는다.
- Map/List toggle은 동일 result IDs/order/filter/selection을 사용한다.
- source-backed venue photo는 장소 match뿐 아니라 사용 권리·허용 surface가 asset registry에서 확인된 경우에만 List의 16:10 또는 4:3 slot에 쓴다. 없으면 category illustration임이 보이는 fallback을 사용한다.

**행동**

- Primary: marker 또는 list item 선택.
- Secondary: query/filter/Map↔List/locate.
- Close/Back: atlas camera로 복귀하되 city state를 history에 보존.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 장소명, category, compact source label, 필터 결과 상태 |
| 시각화 | 온도 aura/core, preference match keyline, selected halo |
| 한 번 접기 | 서울·부산 temperature score/freshness/confidence, source drawer |
| Labs/개발 문서로 이동 | raw LOCALDATA ID, internal score/fixture, adapter 구조 |
| 삭제 | 상시 score·단계 문구, full-width 범례, 무의미한 record count, 빈 initial avatar |

### Screen C · Place Peek/Detail

**목적**

- 장소 사진·핵심 사실·행동을 먼저 보여주고 긴 provenance는 판단 이후에 연다.

**첫 viewport에 보이는 것**

- Peek≤32dvh: media, 이름, category/지역, compact source glyph+label, 상세/길찾기.
- Detail≈88dvh: hero media, ONDO visual, 카드·번호·예약·언어·연령 FactStrip, sticky action.
- 제주도 같은 primitive와 CTA 순서를 사용하고 source label만 editorial로 바뀐다.

**시각·인터랙션**

- marker 선택과 Peek header는 shared-object emphasis로 연결하되 map geometry를 이동시키지 않는다.
- sheet를 내리거나 Back하면 marker와 opener focus가 복원된다.
- 외부 길찾기는 새 context로 열고 복귀 시 같은 detail scroll 또는 peek snap을 유지한다.

**행동**

- Primary: `길찾기`.
- Secondary: 상세/Map/List; 저장은 `FL-010`/`FL-011`로 handoff.
- Close/Back: Detail→Peek→직전 map/list.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 장소명, source class, 결정에 필요한 fact state, 길찾기 |
| 시각화 | media, temperature object, fact glyph+label+value |
| 한 번 접기 | observedAt, source record, methodology, 상세 confidence |
| Labs/개발 문서로 이동 | canonical envelope, provider/adapter, fixture provenance |
| 삭제 | `This is an ONDO presentation choice`, `preview`, 공급자 자기설명, 동일 fact 반복 문단 |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading 0–800ms | 기존 atlas/cached map과 beacon 유지; 새 prose 없음 | 기존 map/list 조작 | map instance, query, filter, selection 불변 |
| Loading 800ms–5s | 대상 city/marker에 compact progress | Back, List | previous context 유지, focus 불필요 이동 금지 |
| Loading ≥5s | 같은 query/filter/selection의 semantic List foreground | List 탐색, Retry | result parity와 선택 venue 유지 |
| Empty | 적용된 filter chips와 0-result 상태 | `조건 지우기` | city/camera/query 유지 |
| Tile failure | `MAP-FALLBACK` List; 중앙 modal 없음 | Retry, 검색/List | `FX-MAP-TILE-FAIL`; venue selection 보존 |
| Location denied | locate icon slashed+인접 InlineStatus | 검색 사용, 설정 열기, 닫기 | `FX-MAP-LOCATION-DENIED`; 공개 지도 상태 불변 |
| Retry | 같은 객체만 pending으로 교체 | 계속 탐색 | 중복 map mount·history entry 금지 |
| Cancel | sheet/filter overlay만 닫힘 | 지도 계속 | 성공 mutation 없음, opener focus 복원 |
| Success | `MAP-KOREA/SEOUL/BUSAN/VENUE`의 대상 상태 | 다음 장소/길찾기 | Account/Person/Age/Payment 불변 |
| Return | history state로 camera/sheet/list scroll 복원 | 탐색 계속 | URL 공개 context만 사용; PII 없음 |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| first reveal | coast/route 180ms, field 220ms, label 160ms; ease-out, 한 번 | MapLibre는 이미 mounted; geography→heat→label 순서 | 최종 atlas 즉시 표시 |
| city tap feedback | 80ms 이내 | core/halo만 변하고 hit target·label 좌표 불변 | 즉시 selected state |
| atlas→city | 420–500ms, hard cap 520ms, cubic smooth | 같은 instance `easeTo`; 100ms 안에 camera start; north-up | `jumpTo`, 0ms |
| city chrome | camera useful content 뒤 160–200ms | header/filter/utility를 순차 opacity+4px translate | 즉시 표시 |
| marker→Peek | sheet 220–280ms emphasized decel | marker/peek anchor 유지; backdrop와 surface 같은 frame 시작 | 즉시 sheet+focus |
| Back/return | 220–320ms 또는 history camera 420ms 이하 | 저장된 camera/snap으로 복원, 역재생 장식 없음 | 즉시 복원 |

- hover/focus는 transform으로 CTA나 label을 이동시키지 않고 halo/contrast만 바꾼다.
- 반복 pulse/shimmer는 금지하며 loading cue는 준비되면 멈춘다.

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Atlas title | 다음 식사를 찾아보세요 | Find your next meal | 次の一食を見つけよう | 도시 label이 이미 있어 지역 count를 반복하지 않음 |
| City accessible CTA | 서울 보기 | Explore Seoul | ソウルを見る | beacon visible label은 도시명만, 행동은 accessible name |
| Place primary | 길찾기 | Directions | 経路を見る | 새 context임을 SR hint로 알림 |
| Map/List | 지도 / 목록 | Map / List | 地図 / リスト | 동일 result parity |
| Empty recovery | 조건 지우기 | Clear filters | 条件をクリア | 원인을 해결하는 한 행동 |
| Tile failure | 목록에서 계속 볼 수 있어요 | Keep browsing the list | リストで続けられます | 기술 오류 원문 금지 |
| Location denied | 현재 위치 없이 검색할 수 있어요 | Search without your location | 現在地なしで検索できます | permission consequence+대안 |
| Source official | 공식 등록 정보 | Official directory | 公的登録情報 | 추천·영업 보장 아님 |
| Source editorial | 에디터가 연결한 장소 | Editorial place match | 編集部による場所照合 | 좌표·장소 연결만 확인; 인기·품질·ONDO 점수 아님 |

- `Pulse`, `Hot`, `Peak`, `preview`, `simulated`, `test`, `on-device`, `official records`, `인허가`는 normal marker/list/peek/title/CTA에 0회다.
- 장소 고유명만 full-name 경로가 있을 때 제한적으로 ellipsis를 허용하고 결정 CTA·error는 2줄까지 전부 보인다.

## 9. Accessibility·responsive

- 320×568/800과 360×800은 edge 16px, 390×844와 430×932는 edge 20px; horizontal overflow 0이다.
- 390×844 city 화면은 usable map 58% 이상, search/filter/utility/Map-List가 서로 겹치지 않는다.
- 430은 정보를 더 추가하지 않고 map/media와 여백만 확장한다.
- 844×390은 desktop rail을 띄우지 않고 compact top chrome+한 bottom lane을 사용한다; sheet는 단일 internal scroll이다.
- beacon/control은 최소 44×44px, 기본 48px, 인접 critical target gap 8px다.
- semantic List가 map과 같은 결과·순서·선택·행동을 제공한다.
- beacon accessible name은 도시, source state, 선택 가능 상태를 말한다. 온도는 color/glow 없이 ring pattern과 label로 구분한다.
- 200% zoom에서 도시 label, fact state, failure recovery, primary CTA가 잘리지 않는다.
- VoiceOver/TalkBack 순서는 header→search/filter→map summary→result List→dock이며 map gesture 없이 완료 가능하다.
- forced colors에서 field는 사라져도 core/selected/source ring과 text가 남고, reduced motion에서도 focus와 history 결과는 같다.

## 10. 계측·완료 기준

### UX signal

- city tap feedback p95≤80ms, camera start p95≤100ms, settle p95≤520ms.
- first useful atlas와 city usable map, 800ms progress, 5s List foreground를 각각 계측한다.
- Map/List result ID·order·filter·selection diff 0.
- hover/focus/touch 전후 beacon/label anchor displacement≤1px.
- Detail/길찾기 round-trip의 camera/query/filter/venue/sheet/scroll/focus hash 일치.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] 첫 paint와 city 화면이 같은 current B MapLibre instance이며 white/poster frame이 없다.
- [ ] 서울·부산·제주의 renderer·hit target·transition·place card/detail DOM contract가 같다.
- [ ] 제주에는 score/Hot/Peak가 없고 editorial coverage가 disabled처럼 보이지 않는다.
- [ ] coast/route/city projected anchors가 320/390/430 캡처에서 실제 지리와 맞는다.
- [ ] normal marker/list/peek에 score·record count·maker/행정 copy가 없다.
- [ ] map 실패·location denied에서도 검색/List/선택 context가 보존된다.
- [ ] helper paragraph를 숨겨도 도시→장소→길찾기를 완료한다.
- [ ] source truth는 glyph+짧은 label로 남고 provenance는 접근 가능한 drawer에 있다.
- [ ] source-backed media/fallback/adjacent duplicate 규칙을 통과한다.
- [ ] venue photo마다 source, 장소 match, 사용 권리, 허용 surface가 asset registry에 있고 불명확하면 illustration fallback을 쓴다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, keyboard, SR, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-007/013/017/018/019` | discovery, decision facts, 전국 shell, responsive, temperature grammar 유지 | requirement reachability E2E |
| State | `MAP-KOREA`, `MAP-SEOUL`, `MAP-BUSAN`, `MAP-GROWING`, `MAP-VENUE`, `MAP-FALLBACK` | 같은 상태를 MapLibre camera/sheet로 표현 | state transition assertion |
| Fixture | `FX-MAP-KOREA`, `FX-MAP-SEOUL-RECENT`, `FX-MAP-BUSAN-SEED`, `FX-MAP-GROWING`, `FX-MAP-TILE-FAIL`, `FX-MAP-LOCATION-DENIED`, venue fixtures | source truth를 유지한 visual states | fixture-by-locale snapshots+contracts |
| returnTo | gate 없음; URL/history public context | city/camera/map-list/query/filter/category/venue/sheet/scroll/focus | Back/Forward/reload/길찾기 round-trip |
| Persistence | 공개 discovery context는 URL/history, preference는 allowlisted local key | PII 없이 동일; raw source/provider 응답 저장 금지 | storage allowlist audit |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 설명·count·큰 CTA를 걷고 같은 지도에서 장소 행동까지 연결 | one headline, compact beacon, prose를 visual grammar와 source label로 대체 |
| D2 시각·인터랙션 | first paint MapLibre, same-map camera, shared beacon, loading/motion evidence | D-14/D-15 renderer, 420–520ms cap, no remount, frame/anchor metrics |
| D3 신뢰·접근성 | official/editorial/ONDO truth와 semantic List, color-off meaning 보존 | source glyph+label은 유지하고 score/provenance만 detail로 접음 |

잔여 이견: `없음`. C2의 420–450ms 권고와 최종 resolution의 일반 거리 420–500ms는 최종 resolution을 따라 hard cap 520ms로 잠갔다.
