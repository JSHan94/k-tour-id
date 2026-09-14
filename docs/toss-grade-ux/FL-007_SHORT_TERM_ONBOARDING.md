# FL-007 · Short-term onboarding

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-003`, `REQ-005`, `REQ-018` |
| 진입 행동 | `ONB-NEW` 첫 실행에서 atlas 위 `한국 여행` intent 선택 |
| 성공 결과 | 언어·실제로 적용되는 discovery preference를 저장하고 `ONB-COMPLETE + ACC-GUEST`로 같은 MapLibre `SCR-MAP` 사용 |
| 취소 결과 | `지도 먼저 보기` 또는 Close/Escape로 기본값의 Guest map 사용; Account·Person·Age·Payment 상태 변화 없음 |
| 실패·재시도 | validation/persistence 실패를 sheet 안에서 알리고 `다시 시도` 또는 기본값으로 지도 사용 |
| 정확한 복귀 | 별도 route remount 없이 `MAP-KOREA` atlas, city beacon, map focus destination으로 복귀; Back은 선택한 언어·intent·chip을 유지 |
| 실행 truth | preference와 onboarding completion은 `LOCAL_ACTUAL`; Passport/eKYC/K-Tour ID/provider 호출 없음 |

### 삭제할 수 없는 PRD 불변식

- 단기 여행 intent는 `PER-TOURIST-SHORT` persona context일 뿐 `PER-*` proof, 국적,
  비자, 체류 기간 또는 Passport 보유를 뜻하지 않는다.
- success·skip·failure는 모두 사용 가능한 Guest map에 도착한다.
- onboarding에서 Account, Person, 19+, Payment KYC, K-Tour ID, wallet을 강제하거나
  완료 처리하지 않는다.
- 이후 Local Signal·Table처럼 Person이 필요한 행동에서는 `FL-010`의 Account와 중립
  Passport method를 JIT로 이어 원 venue/Table/draft로 돌아온다.
- 취향은 match keyline과 list ordering만 바꾼다. ONDO temperature, source class,
  eligibility, 식이 지원 사실은 바꾸지 않는다.
- 식이 선택은 사용자의 필요다. 장소가 지원한다고 확인된 사실이 아니다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| 전체 화면 overlay와 큰 value hero가 이미 보이는 지도를 다시 가린다 | 앱이 지도 제품이 아니라 가입 landing처럼 시작하고 city 전환이 끊긴다 | P1 | `onboarding-step-value`, 별도 큰 layer |
| `72`, `simulated preview`, 점수 설명이 첫 결정 앞에 나온다 | 여행자가 temperature를 실제 인기·기온으로 오해하거나 제작자 설명부터 읽는다 | P0 | `onboarding-signal-truth` |
| `방문 여행객`과 Passport/eKYC 요구가 가까워 보인다 | intent 선택이 신원 분류·강제 인증으로 읽힌다 | P1 | persona 설명과 이후 ID surface |
| 긴 body·boundary·dietary 설명이 반복된다 | 320px에서 intent와 CTA가 아래로 밀리고 한 화면 한 결정이 깨진다 | P1 | value/intent/preferences helper paragraphs |
| 현재 onboarding locale이 EN/KO 토글에 머문다 | JA 사용자는 첫 결정부터 fallback 언어를 만난다 | P1 | onboarding `TEXT`와 language control |
| 선택이 실제 지도 결과를 어떻게 바꾸는지 주 객체로 보이지 않는다 | 취향 질문이 설문처럼 느껴지고 제품과 연결되지 않는다 | P1 | chip 선택 뒤 map/list preview 부재 |

## 3. 목표 경험

### 한 문장 약속

> 한국 지도를 먼저 보고, 여행 중 찾고 싶은 한 끼만 골라 바로 탐색한다.

### 사용자가 1초 안에 알아야 하는 것

- 지금 보고 있는 배경은 실제 ONDO 대한민국 지도다.
- 이 선택은 추천을 정돈할 뿐 신원 확인이나 계정 생성이 아니다.
- 언제든 건너뛰고 지도를 쓸 수 있다.

### 사용자가 읽지 않아도 알아야 하는 것

- intent 선택은 여권 아이콘이 아니라 여행 경로 pictogram과 selected keyline으로 보인다.
- chip을 고르면 지도 capsule의 match keyline과 sheet 안 결과 순서만 바뀐다.
- ONDO heat의 크기·색·source ring은 선택 전후 같은 값과 geometry를 유지한다.
- `지도에서 보기` 뒤 같은 map이 확대되고 sheet만 내려가므로 context가 이어진다.

## 4. 권장 모바일 여정

```text
ENTRY · MapLibre atlas already visible; compact locale utility applies immediately
→ DECISION 1 · one value/intent choice, including 한국 여행
→ DECISION 2 · meal/diet preferences with honest result preview
→ PENDING · local preference commit, only when needed
→ TERMINAL · SUCCESS: same Guest map, matched order/keyline applied
  | CANCEL: defaults on same Guest map
  | ERROR: selection remains in memory, no identity mutation
→ RETRY · commit again or choose defaults without leaving the map
→ RETURN · first city beacon or preserved map focus
→ LATER · Person-required action → FL-010 Account if needed → Passport method
  → exact original venue/Table/draft
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | — locale은 즉시 적용되는 보조 제어 | 이미 보이는 Korea atlas + compact locale row | locale 즉시 적용 | MapLibre instance, north-up camera |
| Intent | 이번엔 어떻게 둘러보나요? | 같은 크기의 3 intent rows; `한국 여행` 선택 | 취향 고르기 | locale, map camera, previous choice |
| Preference | 어떤 한 끼를 찾나요? | meal/mood/diet chip + 실제 match preview | 지도에서 보기 | intent, selected chips, unchanged heat/source |
| Pending | 선택을 적용하는 중인가? | 선택 capsule의 160ms state replace | 기다림/중복 입력 잠금 | all selections |
| Success | 어디부터 볼까? | 같은 atlas의 matched keyline·ordered results | city/place 선택 | `ACC-GUEST`, public map context |
| Cancel | 설정 없이 볼까? | sheet가 내려가고 atlas 유지 | 지도 먼저 보기 | default preferences |
| Failure | 저장 없이 계속할까? | chip 아래 compact InlineStatus | 다시 시도 / 기본값으로 보기 | unsaved selections in memory |
| Return | 지도를 계속 쓸 수 있나? | first city beacon 또는 이전 focus | Explore | focus destination, no identity state |

## 5. 화면별 상세 규격

### Sheet A · Value and intent

**목적**

- 지도 제품임을 숨기지 않고 추천 intent 한 가지를 고른다. locale은 이 결정을
  가로막지 않는 header utility다.

**첫 viewport에 보이는 것**

- 실제 MapLibre atlas, compact ONDO wordmark, EN/KO/JA locale utility, 질문 한 줄,
  `한국 여행 / 내 주변 탐색 / 한국에서 생활` 세 ActionRow, primary `취향 고르기`,
  secondary `지도 먼저 보기`.

**시각·인터랙션**

- Decision sheet는 content-fit, 최대 56dvh이며 390 기준 edge 20px다.
- 별도 hero canvas, 72 score card, 흰 route flash를 만들지 않는다.
- coast/route/city field는 sheet 뒤에서도 읽히며 scrim은 text 영역에만 70% 이하로 둔다.
- 세 row는 동일 geometry와 travel/local/home pictogram을 쓴다. ID card, passport,
  shield, flag는 쓰지 않으며 선택은 keyline+check+`aria-pressed`로 표시한다.

**행동**

- Primary: 선택한 intent를 유지한 채 preference body로 전환.
- Secondary: 기본값으로 Guest map.
- Close/Back: Close/Escape는 secondary와 동일; identity mutation 없음.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 현재 locale, 질문, 세 intent label, selected state, primary/escape |
| 시각화 | 실제 atlas·세 city temperature field와 추천 lens; score·신원 badge 없음 |
| 한 번 접기 | `나중에 설정에서 바꿀 수 있음` 한 문장 |
| Labs/개발 문서로 이동 | fixture/persona ID, score example, renderer methodology |
| 삭제 | `시작하기` 중간 단계, `simulated preview`, `72`, coverage count, 체류 분류 설명, Passport/eKYC CTA, provider/identity boundary paragraph |

### Sheet C · Preferences and preview

**목적**

- 실제로 discovery를 바꾸는 최소 선택만 받고 즉시 효과를 증명한다.

**첫 viewport에 보이는 것**

- meal/mood chip, optional diet row, 한 개의 map/list match preview, sticky primary.

**시각·인터랙션**

- 최대 6개 추천 chip을 먼저 보이고 나머지는 `더 보기`; chip target 44px 이상.
- match preview는 같은 venue capsule/list primitive다. 선택 전후 ONDO aura pixel geometry와
  source glyph는 바뀌지 않고 keyline·순서만 바뀐다.
- diet support가 unknown이면 preview에 check를 만들지 않는다.

**행동**

- Primary: `지도에서 보기`.
- Secondary: 선택이 없으면 `지도 먼저 보기`, 선택이 있으면 `기본값으로 보기`.
- Close/Back: Back은 선택을 memory에 둔 채 intent로 돌아간다.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 선택 chip, 결과에 반영되는 preview, dietary unknown cue, primary |
| 시각화 | match keyline과 list ordering |
| 한 번 접기 | 식이 선택은 요구사항이며 venue 지원 확인이 아니라는 설명 |
| Labs/개발 문서로 이동 | preference selector weights, fixture IDs |
| 삭제 | 효과 없는 survey field, 장문의 account/identity 설명, fake support badges |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | 기존 map 유지; 800ms 전 별도 안내 없음 | 대기, 지도 먼저 보기 | map instance·camera 유지 |
| Empty | match 0이면 chip과 `조건 지우기`, 전체 결과는 유지 | 조건 지우기 / 지도 보기 | heat/source/eligibility 불변 |
| Failure | 선택 아래 `선택을 저장하지 못했어요` | 다시 시도 / 기본값으로 지도 보기 | memory selection 유지, identity 불변 |
| Retry | 같은 sheet에서 commit 재시도 | 중복 입력 잠금 | intent/chips/camera 유지 |
| Cancel | sheet close, default Guest map | 탐색 | Account/Person/Age/Payment/K-Tour 모두 불변 |
| Success | `ONB-COMPLETE`, `ACC-GUEST`; ordered result/keyline 적용 | city/place 선택 | preference 이외 domain 불변 |
| Return | first city beacon에 focus, Back 시 sheet 재생성 금지 | map/list 탐색 | 같은 MapLibre·history |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| First paint→sheet settle | 220ms emphasized decel | map은 이미 mount; sheet만 bottom에서 16px 이동 | 0ms, 최종 위치 |
| Intent→Preference | 160–200ms standard | shell/header 고정, body crossfade+8px horizontal cue | 즉시 body 교체, heading focus |
| Chip selection→preview | 120–160ms ease-out | keyline/order만 변하고 heat/capsule anchor는 이동하지 않음 | 즉시 state+live region |
| Finish→map | 240–280ms emphasized decel | sheet가 내려가며 같은 atlas 노출; white frame 0 | sheet 즉시 제거, focus 복원 |
| 이어지는 city tap | 420–500ms, hard cap 520ms | 동일 map `easeTo`, tap feedback≤80ms, camera start≤100ms | `jumpTo` 0ms |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Intent | 한국 여행 | Visiting Korea | 韓国を旅行 | 국적·여권을 뜻하지 않음 |
| Value title | 한국에서 어떻게 둘러볼까요? | How would you like to explore Korea? | 韓国をどう巡りますか？ | 세 intent와 같은 질문, 최대 2줄 |
| Intent CTA | 취향 고르기 | Choose tastes | 好みを選ぶ | 결과를 예고 |
| Finish CTA | 지도에서 보기 | See it on the map | 地図で見る | `Continue` 금지 |
| Escape | 지도 먼저 보기 | Explore the map first | 先に地図を見る | Guest 가능성을 구조로 표현 |
| Error | 선택을 저장하지 못했어요 | We couldn’t save your choices | 選択を保存できませんでした | recovery와 함께 표시 |
| Retry | 다시 시도 | Try again | もう一度試す | 동일 draft 유지 |

- provider·network·architecture 명칭은 이 Flow의 decision에 없으므로 기본 UI에 없다.
- `preview`, `simulated`, `test`, `on-device`, `Passport required`를 title/CTA에 쓰지 않는다.
- JA는 실제 translation registry에 추가하며 EN fallback을 핵심 행동에 허용하지 않는다.

## 9. Accessibility·responsive

| Viewport | 구현 규격 | 통과 기준 |
|---|---|---|
| 320×568/800 | edge 16px, sheet 한 scroll, sticky CTA 52px, preview 96px 이하 | title·선택·primary·close가 도달 가능하고 footer overlap/horizontal scroll 0 |
| 360×800 | edge 16px, 동일 우선순위 | 390 padding 복사로 map을 축소하지 않음 |
| 390×844 | edge 20px source composition | background map usable area 44% 이상, 질문/primary 한 개 |
| 430×932 | edge 20px, media/map만 여유 있게 확장 | 새 설명이나 네 번째 단계 추가 없음 |
| 844×390 | 좌 map 52% + 우 single-scroll sheet 48%; dock/rail 비활성 | close, 질문, primary가 keyboard 없이 도달 |

- 모든 target은 44×44px 이상, primary는 52–56px다.
- 200% zoom에서 intent row는 content-fit, primary는 최대 두 줄이며 ellipsis가 없다.
- dialog focus trap, Escape=Guest map, 완료 뒤 first city beacon focus를 검증한다.
- map을 사용할 수 없는 사용자는 같은 ordered semantic List와 preference effect를 쓴다.
- forced colors에서 selected chip/keyline/source가 border·check·text로 구분된다.

## 10. 계측·완료 기준

### UX signal

- `onboarding_intent_selected(short_term)`과 `preference_effect_applied`를 분리한다.
- `guest_escape`, `preference_commit_failed`, `default_map_opened`를 terminal로 기록한다.
- identity/provider event는 이 Flow에서 0이어야 한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] 첫 viewport에 질문 하나, primary CTA 하나만 경쟁한다.
- [ ] 첫 paint부터 동일 MapLibre이며 finish 전후 map instance ID가 같다.
- [ ] short-term 선택 뒤 Account/Person/Age/Payment/K-Tour state diff가 0이다.
- [ ] preference는 result order/keyline만 바꾸고 heat/source/eligibility snapshot diff가 0이다.
- [ ] persistence failure·skip에서도 Guest map과 검색/장소가 사용 가능하다.
- [ ] maker language와 Passport/eKYC 선제 CTA가 visible surface에 0회다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-003`, `REQ-005`, `REQ-018` | map-backed short-trip intent와 Guest-first JIT 분리 | scenario `SCN-011-ONBOARD-SHORT` |
| State | `ONB-NEW→ONB-IN-PROGRESS→ONB-COMPLETE`, `ACC-GUEST` | onboarding/preference만 mutation | before/after domain diff |
| Fixture | `FX-ONB-FIRST`, `FX-ONB-SHORT` | success/skip/failure default-map branch 유지 | deterministic fixture matrix |
| returnTo | gate 없음 | 같은 MapLibre `SCR-MAP`, first city beacon focus | map instance/history/focus assertion |
| Persistence | locale/discovery preferences는 `ondo.preferences.v3`; persona/onboarding은 session | raw identity·photo·nationality 저장 없음 | storage allowlist 검사 |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 여행 intent→taste→Guest map, 강제 setup 제거 | 세 결정 이내, 한 primary, maker prose 삭제 |
| D2 시각·인터랙션 | first frame MapLibre, 선택 effect를 keyline/order로 증명 | same-map sheet와 연속 camera, heat geometry 불변 |
| D3 신뢰·접근성 | intent≠identity, 식이 support·provider truth 과장 금지 | no eKYC, no false support, JA/forced-colors/screen-reader 계약 |

잔여 이견: `없음`.
