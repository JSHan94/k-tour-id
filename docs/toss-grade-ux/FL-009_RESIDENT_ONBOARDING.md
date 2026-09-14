# FL-009 · Resident-context onboarding

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-002`, `REQ-005`, `REQ-018` |
| 진입 행동 | `ONB-NEW` 첫 실행에서 atlas 위 `한국에서 생활` intent 선택 |
| 성공 결과 | 생활권·food preference를 저장하고 Account/Person을 새로 만들지 않은 채 같은 MapLibre Guest map 사용 |
| 취소 결과 | skip/Close/Escape 뒤 기본값 Guest map; Residence Card·Passport·provider 호출 없음 |
| 실패·재시도 | local validation/persistence 실패를 같은 sheet에서 회복하거나 기본값으로 map 사용 |
| 정확한 복귀 | 같은 atlas/camera에서 선택 생활권 또는 first city beacon에 focus; later Person action은 원 venue/Table/draft로 별도 exact return |
| 실행 truth | `PER-RESIDENT-LONG`은 recommendation context이며 체류 자격·국적·Residence Card 보유 증명이 아니다 |

### 삭제할 수 없는 PRD 불변식

- `한국에서 생활` 선택으로 `PER-VERIFIED`, `ACC-ACTIVE`, Residence support, 비자 또는
  법적 체류 상태를 추론하지 않는다.
- Residence Card/Passport 경로는 onboarding이 아니라 later Person-required action의
  `FL-006`에서 supported/unavailable/alternate로 제시한다.
- success·skip·failure는 모두 Guest map에 도착한다.
- 기존 optional Account capability는 첫 protected action의 `FL-010`으로 위치만
  옮긴다. Account 경로를 삭제하거나 living intent로 자동 생성하지 않는다.
- preference는 match keyline/list ordering만 바꾸며 ONDO heat·source·eligibility를
  개인화하지 않는다.
- Account, Person, Age, Payment KYC, K-Tour credential은 서로 독립이다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| `한국에 거주하고 있어요`가 법적 지위를 묻는 첫 질문처럼 보인다 | 사용자가 비자·Residence Card 확인을 예상하거나 민감 정보 제공을 경계한다 | P0 | `persona-long_term_resident` |
| `거주 지역과 장기 이용에 맞춘 경로`가 identity route와 discovery value를 섞는다 | 취향 선택이 credential onboarding의 전단계처럼 읽힌다 | P1 | persona note |
| Residence/Passport availability가 onboarding 성공과 가까이 묶인다 | provider 미연결이 지도 사용 실패로 오해된다 | P1 | persona→identity journey 인접성 |
| 큰 fullscreen layer와 반복 helper가 실제 map을 가린다 | 생활권 선택과 geography 연결이 약하고 320px CTA가 아래로 밀린다 | P1 | onboarding value/intent/preferences |
| 선택 결과가 list/map에 보이지 않는다 | 생활권과 취향이 단순 데이터 수집처럼 느껴진다 | P1 | preview 부재 |
| EN/KO만 있어 JA가 첫 단계부터 누락된다 | locale parity와 접근성 이름이 깨진다 | P1 | binary locale control |

## 3. 목표 경험

### 한 문장 약속

> 한국에서 자주 움직이는 지역과 취향을 골라, 신분 확인 없이 바로 지도를 쓴다.

### 사용자가 1초 안에 알아야 하는 것

- 이 선택은 장기 이용에 맞춘 추천 lens다.
- 거주 자격이나 국적을 묻지 않는다.
- Residence Card 또는 Passport는 나중에 필요한 행동에서만 선택한다.

### 사용자가 읽지 않아도 알아야 하는 것

- home/route pictogram과 map area focus가 생활 context를 표현하고 ID card icon은 없다.
- 생활권 선택 뒤 같은 map이 해당 지역을 focus한다.
- preference effect는 match keyline/list order로만 나타나며 heat/source ring은 그대로다.
- sheet가 사라져도 map instance와 selection이 끊기지 않는다.

## 4. 권장 모바일 여정

```text
ENTRY · same MapLibre Korea atlas; compact locale utility applies immediately
→ DECISION 1 · value/intent, including 한국에서 생활
→ DECISION 2 · starting area
→ DECISION 3 · meal/diet preferences with honest result preview
→ PENDING · local preference commit
→ TERMINAL · SUCCESS: same Guest map at chosen area
  | CANCEL: default Guest map
  | ERROR: draft remains and identity is untouched
→ RETRY · commit again or continue with defaults
→ RETURN · Explore
→ LATER, only on a Person-required action:
   same action → FL-010 Account if needed → FL-006 Residence availability/Passport alternate
   → exact original action
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | — locale은 즉시 적용되는 보조 제어 | atlas + compact locale row | locale 즉시 적용 | map instance/camera |
| Intent | 이번엔 어떻게 둘러보나요? | equal intent rows, `한국에서 생활` selected | 생활권 고르기 | locale, prior choice |
| Area | 자주 움직이는 지역은 어디인가요? | city/district selector tied to map | 지역 선택/나중에 | no location/identity inference |
| Preference | 어떤 한 끼를 찾나요? | chips + actual result preview | 지도에서 보기 | area/chips, heat/source unchanged |
| Pending | 선택을 적용하는 중인가? | row-level progress | 기다림 | all draft choices |
| Success | 어디부터 볼까? | same map focus + ordered list | place selection | Account/Person untouched |
| Cancel | 설정 없이 계속할까? | sheet dismiss | 지도 먼저 보기 | defaults |
| Failure | 선택을 저장하지 못했나? | InlineStatus at failed object | retry/default map | memory draft, no provider state |
| Return | later proof가 필요해졌나? | original action anchored gate | Residence/Passport choice then resume | venue/Table/draft/focus |

## 5. 화면별 상세 규격

### Sheet A · Living-context intent

**목적**

- 법적 status가 아닌 추천 사용 맥락 하나를 고른다.

**첫 viewport에 보이는 것**

- 실제 atlas, locale, 질문, 세 intent row, 한 primary와 `지도 먼저 보기`.

**시각·인터랙션**

- `한국에서 생활`은 home/route pictogram을 쓴다. Residence Card, passport, flag,
  verified shield를 쓰지 않는다.
- three intents share identical size/order semantics; selection uses keyline+check+`aria-pressed`.
- sheet content-fit≤72dvh; map coastline and at least one city beacon remains visible.

**행동**

- Primary: `생활권 고르기`.
- Secondary: `지도 먼저 보기`.
- Close/Back: Back은 value, Close는 defaults의 Guest map.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 추천 intent, selected state, primary/escape |
| 시각화 | living context via route/home glyph and map focus preview |
| 한 번 접기 | 설정에서 바꿀 수 있음 |
| Labs/개발 문서로 이동 | persona fixture ID, future adapter selection logic |
| 삭제 | `장기체류자`, foreigner, visa/residence claim, provider copy, `02` step number |

### Sheet B · Living area, then preferences

**목적**

- 자주 보는 지역과 실제 discovery input만 같은 shell의 두 순차 body에서 받는다.
  두 질문을 한 viewport에 동시에 놓지 않는다.

**State B1 · Area의 첫 viewport**

- `자주 움직이는 지역은 어디인가요?`, city/district selector, 선택한 실제 map
  coordinate와 primary `취향 고르기`.

**State B2 · Preference의 첫 viewport**

- `어떤 한 끼를 찾나요?`, food/mood chips, optional dietary requirements, one live
  result preview와 primary `지도에서 보기`. B1은 compact back summary로만 남긴다.

**시각·인터랙션**

- area choice highlights actual map coordinate; no arbitrary CSS offset or nationality inference.
- B1→B2는 같은 sheet와 map을 유지하고 body만 바꾼다. selected preferences update
  result keyline/order only. Jeju remains editorial-unscored and no
  city score is created.
- dietary unknown remains question/unknown glyph, never green check.

**행동**

- B1 Primary: `취향 고르기`; B2 Primary: `지도에서 보기`.
- Secondary: 각 state에서 `나중에` 또는 `기본 지도로 보기`.
- Close/Back: B2 Back은 draft를 보존한 채 B1로, Close는 Guest defaults로 간다.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 현재 질문 하나, 해당 state의 선택, primary 하나 |
| 시각화 | map focus, match keyline, list order |
| 한 번 접기 | dietary choices are needs, not venue proof |
| Labs/개발 문서로 이동 | ranking weights, fixture/persona identifiers |
| 삭제 | Account toggle, Residence/Passport CTA, legal status copy, unsupported provider warning |

### Later JIT handoff · Residence or Passport

**목적**

- `REQ-002`를 보존하면서 provider complexity를 실제 필요 시점까지 미룬다.

**첫 viewport에 보이는 것**

- later Person-required action의 exact venue/Table/draft, 현재 필요한 Person 질문,
  Residence method의 availability와 Passport alternate.

**시각·인터랙션**

- `FL-010`의 single Decision sheet 안에서 `FL-006` body를 사용한다.
- unsupported/unavailable은 선택 전에 보이며 alternate가 같은 shell에서 교체된다.
- future gates 또는 identity status wall은 표시하지 않는다.

**행동**

- Primary: supported이면 `Residence Card로 확인`, 아니면 `Passport로 계속`.
- Secondary: `나중에`로 원 객체와 draft 복귀.
- Close/Back: no mutation, exact focus return.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | requester, purpose, predicate, availability, alternate, failure/recovery |
| 시각화 | one method row and original action anchor |
| 한 번 접기 | provider, retention, method details |
| Labs/개발 문서로 이동 | adapter/protocol/fixture provenance |
| 삭제 | nationality inference, visa claim, onboarding credential teaser, future-gate checklist |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | map remains, no prose before 800ms | wait / map first | map/identity state unchanged |
| Empty | no match: chips + complete result list | 조건 지우기 / 지역 변경 | no fake place support |
| Failure | local save failure next to preferences | retry / default map | Residence/Passport/provider untouched |
| Retry | same draft and one inline progress | retry | area/chips preserved |
| Cancel | sheet closes to Guest map | explore | account/person/age/payment unchanged |
| Success | `ONB-COMPLETE`; chosen area/order applied | map/list/place | resident context only, no proof |
| Return | later FL-006 cancel/fail resumes exact object | alternate/retry/not now | venue/Table/draft/focus and public map context |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| Atlas→sheet | 220–280ms emphasized decel | map stays mounted; sheet only | 0ms final state |
| Intent→Area; Area→Preference | 각 160–200ms standard | same shell/header, one body crossfade per question | instant + next heading focus |
| Area map focus | 280–360ms cubic smooth | actual coordinate, fixed beacon label | `jumpTo` 0ms |
| Preference preview | 120–160ms ease-out | order/keyline only, heat geometry diff 0 | immediate state/live region |
| Finish→map | 240–280ms emphasized decel | sheet dismiss reveals same map | instant dismiss/focus |
| Later gate handoff | 160–200ms inline body swap | same Decision shell, original object fixed | immediate body/focus change |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Intent | 한국에서 생활 | Living in Korea | 韓国で暮らす | legal residence claim 아님 |
| Area title | 자주 움직이는 지역은 어디인가요? | Which areas are part of your routine? | よく行くエリアはどこですか？ | location proof 아님 |
| Intent CTA | 생활권 고르기 | Choose an area | エリアを選ぶ | recommendation outcome |
| Area CTA | 취향 고르기 | Choose tastes | 好みを選ぶ | 다음 질문을 정확히 예고 |
| Finish CTA | 지도에서 보기 | See it on the map | 地図で見る | same-map continuation |
| Escape | 지도 먼저 보기 | Explore the map first | 先に地図を見る | Guest-first |
| Later alternate | Passport로 계속 | Continue with Passport | パスポートで続ける | only later JIT |
| Error | 선택을 저장하지 못했어요 | We couldn’t save your choices | 選択を保存できませんでした | recovery adjacent |

- onboarding title/CTA에 `resident verified`, `Residence Card ready`, `visa`, provider,
  `on-device`, `optional`을 쓰지 않는다.
- JA decision copy와 accessible name은 EN fallback 없이 제공한다.
- provider는 later disclosure에만, unavailable/alternate는 later decision에 짧게 보인다.

## 9. Accessibility·responsive

| Viewport | 구현 규격 | 통과 기준 |
|---|---|---|
| 320×568/800 | edge 16px, one-column area rows, one internal scroll | title/intent/primary/close reachable, sticky overlap 0 |
| 360×800 | edge 16px, 44px minimum targets | map remains visible, x-overflow 0 |
| 390×844 | edge 20px canonical | map 44%+, one question/primary |
| 430×932 | edge 20px | expand geography, not prose/steps |
| 844×390 | left map/right one-scroll sheet, rail disabled | close/question/primary reachable; no nested scroll |

- 200% text zoom에서 intent/area rows are content-fit and no decision ellipsis.
- focus order locale→intent→area→preferences→primary→escape; finish returns to city/list focus.
- screen reader names say recommendation intent, not identity status.
- forced colors use border/check/text for selected/unknown/source.
- later gate focus trap and opener focus restoration inherit `FL-006`/`FL-010`.

## 10. 계측·완료 기준

### UX signal

- `onboarding_intent_selected(living)`, `area_selected`, `preference_effect_applied`,
  `guest_escape`, `preference_commit_failed`를 기록한다.
- onboarding에서 `residence_started`, `passport_started`, `person_mutated`,
  `account_started`는 0이어야 한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] first/last frame이 같은 MapLibre instance이며 white route flash가 없다.
- [ ] `한국에서 생활` 선택은 legal/person/account state를 바꾸지 않는다.
- [ ] Residence/Passport UI는 later Person-required action 이전에 보이지 않는다.
- [ ] preference는 order/keyline만 바꾸고 heat/source/eligibility는 불변이다.
- [ ] failure·skip에서 Guest map은 완전히 사용 가능하다.
- [ ] later unsupported Residence는 same-sheet Passport alternate와 exact return을 가진다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-002`, `REQ-005`, `REQ-018` | living recommendation과 later Residence/Passport JIT 분리 | `SCN-013-ONBOARD-RESIDENT`, later `FL-006` |
| State | `ONB-*`, `personaId=PER-RESIDENT-LONG` context, `ACC-GUEST`, `PER-UNVERIFIED` | discovery state only during onboarding | domain diff assertion |
| Fixture | `FX-ONB-FIRST`, `FX-ONB-RESIDENT` | success/skip/failure all map; provider call 0 | fixture spy |
| returnTo | onboarding gate 없음; later action owns canonical token | same map then exact later venue/Table/draft | history/focus and RT matrix test |
| Persistence | locale/discovery in preferences; onboarding/persona in session | no nationality/visa/raw proof/provider response | storage allowlist |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | legal persona를 living intent로, identity는 later JIT | 세 decision 이내, no account/credential setup |
| D2 시각·인터랙션 | same-map area focus와 preview; credential icon 제거 | continuous MapLibre, keyline/order effect |
| D3 신뢰·접근성 | residence context≠status; unsupported/alternate truth | no inference, later availability, exact-return/a11y |

잔여 이견: `없음`.
