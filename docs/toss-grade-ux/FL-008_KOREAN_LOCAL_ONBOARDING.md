# FL-008 · Korean-local onboarding

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-001`, `REQ-005`, `REQ-018` |
| 진입 행동 | `ONB-NEW` 첫 실행에서 atlas 위 `내 주변 탐색` intent 선택 |
| 성공 결과 | 생활권·food preference를 discovery에 적용하고, Account를 새로 만들지 않은 채 같은 MapLibre Guest map 사용 |
| 취소 결과 | skip/Close/Escape 뒤 기본값의 Guest map; Mobile ID와 Account 시작 없음 |
| 실패·재시도 | location/preference/account 관련 외부 동작 없이 local validation만 재시도; 실패해도 기본 map 사용 |
| 정확한 복귀 | 선택 전 atlas camera와 MapLibre instance 유지, first city beacon 또는 사용자가 고른 생활권 결과에 focus |
| 실행 truth | `PER-LOCAL-KR`는 recommendation context; citizenship·Person proof가 아니며 OmniOne CX는 later JIT에서만 가능 |

### 삭제할 수 없는 PRD 불변식

- `내 주변 탐색`은 국적, 주민 여부, 신뢰 badge가 아니다.
- onboarding에서 OmniOne CX를 호출하거나 `PER-VERIFIED`를 만들지 않는다.
- Guest는 지도·검색·필터·장소·길찾기를 끝낼 수 있다. Account는 첫 저장/Table 등
  실제 행동에서 `FL-010`으로 요청한다.
- 기존 optional Account capability는 첫 protected action의 `FL-010`으로 위치만
  옮긴다. Account 경로를 삭제하거나 onboarding intent로 자동 생성하지 않는다.
- 생활권 선택은 추천 순서와 map starting context만 바꾼다. 위치 권한을 자동 요청하지 않는다.
- preference는 match keyline/list ordering 외 ONDO heat, source, eligibility를 바꾸지 않는다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| `한국 로컬이에요`와 sparkle icon이 사람의 신분을 선언하는 카드처럼 보인다 | 추천 취향과 한국인 Mobile ID 상태를 혼동한다 | P0 | `persona-korean_local` |
| 설명에 `내가 아는 신호와 Table 공유`를 미리 약속한다 | Account/Person gate가 필요한 기여 기능이 onboarding 성공으로 열린 듯 보인다 | P1 | persona note copy |
| intent와 identity boundary가 긴 문장으로 반복된다 | 사용자는 읽어야만 Guest-first 구조를 이해하고 CTA는 아래로 밀린다 | P1 | `intentBody`, `boundary` |
| 실제 생활권·추천 결과 변화가 주 시각 객체에 없다 | `로컬` 선택이 기능 없는 분류 질문으로 느껴진다 | P1 | intent→preference 화면 |
| EN/KO만 제공하고 locale 전환이 binary다 | JA 사용자는 첫 실행 의미와 접근성 이름이 일치하지 않는다 | P1 | onboarding language button |
| full-screen sheet가 geography를 가리고 완료 뒤 화면이 교체된다 | 사용자의 `내 주변` 선택과 실제 지도 위치가 공간적으로 연결되지 않는다 | P1 | onboarding backdrop/layer |

## 3. 목표 경험

### 한 문장 약속

> 자주 가는 동네와 한 끼 취향을 골라, 같은 지도에서 바로 주변을 본다.

### 사용자가 1초 안에 알아야 하는 것

- 지금 고르는 것은 `내 주변` 추천 방식이다.
- 위치 권한·계정·신원 확인 없이 지도를 먼저 쓸 수 있다.
- Mobile ID는 이후 본인 확인이 필요한 행동에서만 나온다.

### 사용자가 읽지 않아도 알아야 하는 것

- map이 처음부터 보여 선택한 생활권과 결과가 같은 공간에 있다.
- selected district/city는 map focus ring과 list ordering으로 반영된다.
- account/ID badge가 없으므로 onboarding 성공이 verification처럼 보이지 않는다.
- close 뒤 sheet만 사라지고 map·focus는 그대로 남는다.

## 4. 권장 모바일 여정

```text
ENTRY · same Korea atlas; compact locale utility applies immediately
→ DECISION 1 · value/intent, including 내 주변 탐색
→ DECISION 2 · starting area
→ DECISION 3 · food/diet preference with honest result preview
→ PENDING · local preference commit
→ TERMINAL · SUCCESS: same Guest map, selected area focus and matched order
  | CANCEL: default Guest map
  | ERROR: draft remains, no CX/account call
→ RETRY · commit again or continue with defaults
→ RETURN · Explore; Mobile ID only from a later Person-required action
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | — locale은 즉시 적용되는 보조 제어 | MapLibre atlas + locale row | locale 즉시 적용 | map instance/camera |
| Intent | 어떻게 둘러볼까요? | 세 intent rows 중 `내 주변 탐색` | 지역 고르기 | locale, prior choice |
| Area | 자주 보는 곳은 어디인가요? | city/district compact selector on map | 지역 선택 또는 건너뛰기 | permission unrequested, atlas visible |
| Preference | 어떤 한 끼를 찾나요? | chip + ordered result preview | 지도에서 보기 | area, chips, unchanged heat/source |
| Pending | 선택을 적용할까요? | selected row inline progress | 기다림 | current draft |
| Success | 주변에서 무엇을 볼까요? | focused map/list; match keyline | place 선택 | Account/person unchanged |
| Cancel | 기본 지도로 갈까요? | sheet dismiss | 지도 먼저 보기 | default area/preference |
| Failure | 선택 없이 계속할까요? | InlineStatus under failed object | 다시 시도 / 기본값 | draft in memory, no provider call |
| Return | 나중에 본인 확인이 필요하면? | original action anchored `FL-010`/`FL-005` JIT | later action | exact venue/Table draft |

## 5. 화면별 상세 규격

### Sheet A · Intent

**목적**

- 신분이 아니라 탐색 방식 하나를 고른다.

**첫 viewport에 보이는 것**

- actual atlas, locale control, 질문, 동일 geometry의 세 intent row, primary 하나.

**시각·인터랙션**

- `내 주변 탐색`은 target/compass pictogram을 쓴다. flag, ID card, verified shield는 금지한다.
- 선택은 keyline/check/`aria-pressed`; heat accent는 쓰지 않는다.
- sheet는 content-fit≤72dvh이고 지도 해안선과 city beacon 일부를 항상 남긴다.

**행동**

- Primary: `지역 고르기`.
- Secondary: `지도 먼저 보기`.
- Close/Back: Back은 value, Close는 default Guest map.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 세 recommendation intent와 selected state, primary/escape |
| 시각화 | `내 주변` lens를 target pictogram과 map focus preview로 표현 |
| 한 번 접기 | 설정에서 언제든 변경 가능 |
| Labs/개발 문서로 이동 | `PER-LOCAL-KR` fixture ID, future CX route hints |
| 삭제 | `한국 로컬`, citizenship 의미, Table 공유 약속, CX/provider copy, `02` step number |

### Sheet B · Area, then preferences

**목적**

- 자동 권한 요청 없이 시작 위치와 실제 추천 input을 같은 shell의 두 순차 body에서
  정한다. 두 질문을 한 viewport에 동시에 놓지 않는다.

**State B1 · Area의 첫 viewport**

- `자주 보는 곳은 어디인가요?`, `서울 / 부산 / 제주 / 나중에` compact selector,
  선택한 실제 city beacon과 primary `취향 고르기`.

**State B2 · Preference의 첫 viewport**

- `어떤 한 끼를 찾나요?`, meal/mood chips, optional diet disclosure, real result
  preview와 primary `지도에서 보기`. B1 질문과 selector는 compact back summary로만
  남긴다.

**시각·인터랙션**

- region selector는 실제 city beacon을 강조하지만 좌표·ONDO aura를 움직이지 않는다.
- browser location은 사용자가 locate icon을 누를 때만 요청한다.
- B1→B2는 같은 sheet와 map을 유지하고 body만 바꾼다. source와 diet support는
  compact glyph+label로 남고 unknown을 positive check로 만들지 않는다.
- 최대 6 chip, 나머지는 expand; selected chip은 check+border로 표시한다.

**행동**

- B1 Primary: `취향 고르기`; B2 Primary: `지도에서 보기`.
- Secondary: 각 state에서 `나중에` 또는 `기본 지도로 보기`.
- Close/Back: B2 Back은 선택을 memory에 둔 채 B1로, Close는 Guest map으로 간다.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 현재 질문 하나, 해당 state의 선택, primary 하나 |
| 시각화 | focus ring, match keyline, list order |
| 한 번 접기 | dietary choices are needs, not confirmed venue support |
| Labs/개발 문서로 이동 | rank weights, location adapter, fixture identifiers |
| 삭제 | contribution intent 질문, 선제 Account toggle, Mobile ID CTA, long identity disclaimer |

### Later JIT handoff · not an onboarding screen

**목적**

- `REQ-001`의 Mobile ID 경로를 삭제하지 않고 필요한 행동과 결합한다.

**첫 viewport에 보이는 것**

- 사용자가 나중에 Person-required action을 눌렀을 때 그 장소/Table/draft와 현재 unmet
  gate 한 개만 `FL-010` sheet header에 보인다.

**시각·인터랙션**

- onboarding에서 ID setup teaser를 띄우지 않는다. later handoff는 `FL-005`의
  requester/purpose/predicate consent와 exact return을 그대로 쓴다.

**행동**

- Primary: later action에서 `Mobile ID로 확인`.
- Secondary: `나중에`로 원 객체 복귀.
- Close/Back: 원 venue/Table/draft/focus 보존.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | later requester/purpose/predicate/unavailable/recovery |
| 시각화 | original action anchor와 one unmet gate |
| 한 번 접기 | provider/retention details |
| Labs/개발 문서로 이동 | adapter/fixture/protocol |
| 삭제 | onboarding success에 verified badge, future gate checklist |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | map remains; no prose under 800ms | 기다림 / 지도 먼저 보기 | camera, identity axes 유지 |
| Empty | selected area has no match: whole result list + selected chips | 조건 지우기 / 다른 지역 | no fake match, heat unchanged |
| Failure | `선택을 저장하지 못했어요` near preference | 다시 시도 / 기본값 map | no Account/CX mutation |
| Retry | same selector/chips, one inline progress | 재시도 | draft preserved |
| Cancel | content-fit sheet closes | Guest explore | `ACC-GUEST`, `PER-UNVERIFIED` |
| Success | `ONB-COMPLETE`; area focus/order applied | place/map/list | account/person/age/payment unchanged |
| Return | later protected action opens JIT only then | Mobile ID or alternate | exact action context, not onboarding |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| Atlas→intent sheet | 220–280ms emphasized decel | map stays mounted; sheet translates 16px | 0ms final state |
| Intent→Area; Area→Preference | 각 160–200ms standard | same shell, one body replacement per question | instant + next heading focus |
| Area selection | 120ms selection, optional camera 280–360ms | beacon anchor fixed, no hover transform | `jumpTo` or no camera animation |
| Preference effect | 120–160ms ease-out | order/keyline only; heat geometry diff 0 | instant state+live region |
| Finish→map | 240–280ms | sheet dismiss; same map/focus expands | instant dismiss+focus |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Intent | 내 주변 탐색 | Explore nearby | 近くを探す | citizenship/verification 의미 없음 |
| Area title | 자주 보는 곳은 어디인가요? | Where do you usually look? | よく行くエリアはどこですか？ | permission 요구 아님 |
| Intent CTA | 지역 고르기 | Choose an area | エリアを選ぶ | 다음 질문을 정확히 예고 |
| Area CTA | 취향 고르기 | Choose tastes | 好みを選ぶ | 다음 질문을 정확히 예고 |
| Finish CTA | 지도에서 보기 | See it on the map | 地図で見る | 같은 map continuation |
| Escape | 지도 먼저 보기 | Explore the map first | 先に地図を見る | Guest-first |
| Location option | 현재 위치 사용 | Use my location | 現在地を使う | tap 때만 permission |
| Error | 선택을 저장하지 못했어요 | We couldn’t save your choices | 選択を保存できませんでした | recovery adjacent |

- `한국인`, `local verified`, `on-device`, `Mobile ID ready`, provider명은 onboarding에 쓰지 않는다.
- KO/EN/JA decision text와 accessible name은 같은 locale로 동시에 바뀐다.
- 장소 고유명 외에는 ellipsis를 쓰지 않고 primary는 최대 2줄이다.

## 9. Accessibility·responsive

| Viewport | 구현 규격 | 통과 기준 |
|---|---|---|
| 320×568/800 | edge 16px, area selector horizontal scroll 대신 wrap/one-column | title, 3 intents, current selection, primary 도달; sticky overlap 0 |
| 360×800 | edge 16px, 44px rows | map remains visible and no x-overflow |
| 390×844 | edge 20px canonical | map 44% 이상, one question/primary |
| 430×932 | edge 20px | larger map/preview only; no extra prose |
| 844×390 | left map/right single-scroll sheet, rail off | close/question/primary visible without nested scroll |

- target 44px minimum, default 48px; critical gap 8px.
- 200% zoom에서 region row가 fixed height로 잘리지 않고 sticky footer가 본문을 덮지 않는다.
- focus order는 locale→intent→area→chips→primary→escape; 완료 뒤 selected city beacon/list heading.
- location permission denial은 control 인접 InlineStatus와 search fallback을 제공한다.
- forced colors에서 selection/match/source가 border+glyph+text로 구분된다.

## 10. 계측·완료 기준

### UX signal

- `onboarding_intent_selected(nearby)`, `area_selected`, `location_requested_by_user`,
  `preference_effect_applied`, `guest_escape`를 분리한다.
- onboarding 중 `cx_started`, `account_started`, `person_mutated`는 항상 0이어야 한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] first paint와 finish 뒤 MapLibre instance/camera relationship이 이어진다.
- [ ] `내 주변 탐색`은 국적·Person·Account를 mutation하지 않는다.
- [ ] 위치 permission은 locate action 전 요청되지 않는다.
- [ ] preference effect는 order/keyline뿐이고 ONDO/source/eligibility diff가 0이다.
- [ ] persistence failure·skip 뒤 Guest map을 사용할 수 있다.
- [ ] later Mobile ID는 Person-required action에서만 exact returnTo와 함께 열린다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-001`, `REQ-005`, `REQ-018` | nearby preference와 later JIT Mobile ID를 분리 | `SCN-012-ONBOARD-KOREAN`, later `FL-005` |
| State | `ONB-*`, `ACC-GUEST`, `PER-UNVERIFIED`, `personaId=PER-LOCAL-KR` context | onboarding/discovery만 mutation | domain diff assertion |
| Fixture | `FX-ONB-FIRST`, `FX-ONB-KOREAN` | success/skip/failure all map, CX 0 calls | fixture spy |
| returnTo | onboarding gate 없음; later protected CTA owns token | same map focus, later exact venue/Table/draft | history/focus and RT registry test |
| Persistence | locale/discovery in preferences; persona/onboarding in session | no citizenship/location proof/raw provider response | storage allowlist |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | legal persona 대신 human intent, setup은 later JIT | intent→area→taste 세 decision 이내, no onboarding account |
| D2 시각·인터랙션 | same-map area focus와 recommendation preview | MapLibre 유지, focus/keyline/order로 효과 증명 |
| D3 신뢰·접근성 | local≠citizenship/verified, permission opt-in | no flag/shield/CX call, denial recovery, JA/a11y |

잔여 이견: `없음`.
