# FL-013 · Manual After19

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-012` |
| 진입 행동 | **공개 탐색:** 지도 utility의 `19+` control. **보호 행동:** 잠긴 주류 장소·Table의 `19+ 확인`. 두 진입점은 같은 시각 언어를 쓰지만 권한은 공유하지 않는다. |
| 성공 결과 | **공개 탐색:** 명시적 자기선언 뒤 현재 탭에만 night-view를 열고 같은 camera·selection에서 bars·night subset과 dark/neon presentation을 강조한다. 이는 `AGE-VERIFIED`가 아니다. **보호 행동:** 유효한 provider 결과(또는 명시적 review fixture)로 `AGE-VERIFIED`와 미만료가 확인된 경우에만 기존 `OPEN_AFTER19`/`JOIN_TABLE` 객체의 다음 guard 또는 원 행동을 한 번 재개한다. |
| 취소 결과 | Age·Payment KYC·Person·Account를 바꾸지 않고 직전 기본 지도 또는 잠긴 장소로 돌아간다. |
| 실패·재시도 | 공개 night-view는 provider를 호출하지 않으며 선언 취소 시 기본 지도를 유지한다. 보호된 주류·Table 경로에서 public provider 미연결은 `AGE-FAILED`가 아닌 `PROVIDER_UNAVAILABLE`로 fail closed한다. 같은 sheet에서 다시 시도하거나 공개 장소·기본 지도를 계속 쓴다. 명시적 review fixture에서만 `FX-AGE-SUCCESS/FAIL`을 실행한다. |
| 정확한 복귀 | 공개 night-view는 별도 보호 행동을 재개하지 않고 같은 지도 객체에서 presentation만 바꾼다. 보호된 장소 진입 token은 정확히 `RT-OPEN_AFTER19-${Date.parse(createdAt)}`이며 canonical envelope에는 `venueId?`만 허용하고 `tableId`와 화면 상태를 넣지 않는다. city·camera·query·filters·sheet snap·scroll·focus는 shell의 local navigation snapshot에 따로 보존한다. 주류 Table에서 Age가 현재 guard면 기존 canonical `JOIN_TABLE` envelope와 token을 바꾸지 않는다. 모든 guard 재검증 뒤 원 mutation 직전 한 번 소비하고 취소·만료·변조 시 삭제한다. |
| 실행 truth | 일반 사용자 지도 경로는 `LOCAL_DECLARATION · SELF_DECLARED · night_view_only`이며 provider 확인·법적 성인 증명·credential 발급으로 표시하지 않는다. 보호 행동의 일반 사용자 경로는 provider 미연결 truth를 유지한다. QA/review mode의 보호 행동 성공은 `SIMULATED`, `fixtureId`, 만료 범위를 표시하며 official ID·DID·VC 발급을 주장하지 않는다. |

### 삭제할 수 없는 PRD 불변식

- Manual After19는 Account 없이 시작할 수 있다. 공개 night-view 선언은 현재 탭 범위에만 남는다. 보호 행동의 Guest 결과는 현재 행동의 memory에만 남고, Account가 있을 때만 최소 predicate·issuer type·expiry를 demo session 안에 보관한다. 어느 경우도 browser session 밖으로 확대하지 않는다.
- `Account ≠ Person ≠ 19+ ≠ Payment KYC ≠ K-Tour ID`이다. 공개 night-view 자기선언은 이 다섯 축 중 어느 것도 완료하지 않는다. 보호 flow는 19+ 외 어떤 축도 완료하지 않는다.
- 보호 행동 성공 시 소비하는 정보는 `19+ confirmed`, issuer type, expiry뿐이다. 공개 night-view는 `19+ self-declared`, `night_view_only`, 탭 범위만 소비한다. 어느 경로도 생년월일, 여권·신분증 이미지, 번호, raw provider response를 저장하지 않는다.
- 취소·실패·만료 중에도 일반 음식점, 같은 장소의 공개 정보, 지도·목록 탐색은 계속 가능하다.
- 서울·부산·제주 모두 같은 MapLibre renderer와 After19 geometry를 쓴다. 제주에 숫자 score를 만들지 않는다.
- After19는 일반 심야 음식점을 제거하는 bars-only filter가 아니다. 승인된 night subset을 추가 강조하는 mode다.

### 공개 탐색과 보호 행동의 경계

| 경로 | 가능한 것 | 불가능한 것 |
|---|---|---|
| 공개 night-view | 본인의 명시적 선택으로 현재 지도 위 dark/neon token과 bars·night subset 강조, 즉시 끄기, 같은 탭 안 재사용 | `AGE-VERIFIED`, 주류 주문·보호 Table 참여 잠금 해제, provider/credential/DID 주장, 다른 탭·기기로 승격 |
| 보호된 주류 장소·Table | 실제 연결된 age provider의 유효 결과 또는 명시적 review fixture가 있을 때 원 행동으로 정확히 복귀 | 자기선언을 법적 연령 확인으로 소비, provider 미연결 상태의 성공, Account·Person·Payment·K-Tour ID 자동 완료 |

`Account`는 앱 세션 계정, `Person`은 한 사람 여부, `19+`는 보호 행동용 연령 predicate, `Payment KYC`는 결제 정책 조건, `K-Tour ID`는 최소 결과를 담는 private service credential이다. 다섯 축과 공개 night-view presentation은 각각 독립이다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| 지도 `19+` control과 보호 행동의 `19+ 확인`이 같은 권한처럼 보인다. | night-view만 여는 자기선언이 주류·Table 잠금도 푼다고 오해할 수 있다. | P0 | map utility ↔ protected venue/Table |
| Age sheet가 K-Tour ID, Person, provider, on-device 설명과 긴 stepper를 함께 노출할 수 있다. | 단순한 19+ 확인이 신원 가입처럼 느껴지고 이탈한다. | P1 | `AGE-UNVERIFIED` → `AGE-PENDING` |
| 보호 행동에서 provider 미연결 상태도 성공처럼 진행될 여지가 있다. | 공개 night-view 자기선언을 공식 연령 확인으로 오인한다. | P0 | protected public path |
| 성공 후 별도 화면 또는 다른 camera로 이동하면 원 장소가 사라진다. | 왜 확인했는지 잊고 행동을 다시 찾아야 한다. | P1 | `AGE-VERIFIED` → `A19-ON` |
| 어두운 테마가 지형과 일반 장소를 지울 수 있다. | mode를 켜면 지도가 아닌 검은 배경처럼 보인다. | P1 | After19 map |

## 3. 목표 경험

### 한 문장 약속

> 밤에 어울리는 장소는 바로 둘러보고, 보호된 행동은 필요한 순간에만 19+를 확인한 뒤 보던 곳으로 돌아간다.

### 사용자가 1초 안에 알아야 하는 것

- 지도에서는 night-view만 켜는지, 보호된 행동을 위해 `19+`를 확인하는지 알 수 있다.
- 확인을 닫아도 일반 지도와 장소 정보는 계속 쓸 수 있다.
- 보호된 행동의 확인 수단을 사용할 수 없으면 완료된 것처럼 보이지 않는다.

### 사용자가 읽지 않아도 알아야 하는 것

- 지도 utility는 moon/night glyph와 dark/neon map 변화로 공개 탐색임을, 보호 행동은 lock glyph와 고정된 장소명으로 별도 확인이 필요함을 보여준다.
- 공개 night-view는 check badge 없이 같은 지도 token만 바뀌고, 보호 행동 성공에서만 lock이 check로 morph한다.
- off control은 mode가 켜진 직후부터 항상 되돌릴 수 있는 위치에 있다.

## 4. 권장 모바일 여정

```text
PUBLIC MAP UTILITY
→ NIGHT-VIEW DECLARATION
→ SAME MAP · DARK/NEON + NIGHT SUBSET EMPHASIS
→ TURN OFF → SAME STANDARD MAP

LOCKED ALCOHOL VENUE OR TABLE
→ PROTECTED 19+ DECISION
→ AGE-PENDING
→ AGE-VERIFIED | PROVIDER_UNAVAILABLE | AGE-FAILED | CANCEL
→ EXACT VENUE/TABLE ACTION | SAME PUBLIC VENUE/MAP
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Public entry | 이 지도에서 밤에 어울리는 장소를 볼까요? | 지도 `19+`/moon utility와 현재 city | `만 19세 이상이에요` | city, camera, query, filters, selection |
| Public active | night-view를 계속 쓸까요? | 같은 지도 위 dark/neon token과 강화된 night subset | `끄기` | Age·Account·Person·Payment·K-Tour ID 불변 |
| Protected entry | 이 장소·Table의 19+ 조건을 확인할까요? | 잠긴 장소 row와 lock glyph | `19+ 확인` | city, camera, query, filters, selection, sheet snap, scroll, focus |
| Protected decision | 19+ 여부 확인을 시작할까요? | 선택 장소·Table이 고정된 Age Decision sheet | `19+ 확인하기` | 진입 행동의 canonical envelope와 Account 여부; UI snapshot은 별도 local state |
| Protected pending | 확인 중인가요? | lock→progress의 단일 glyph | 취소 | 다른 gate와 원 CTA mutation 전부 불변 |
| Protected success | 원 행동을 이어갈까요? | check glyph와 같은 장소·Table surface | 원 행동 자동 재개 | 같은 camera·selection, 일반 장소 유지 |
| Protected unavailable/failure | 지금 확인할 수 없을 때 무엇을 할까요? | 원인 한 줄 + recovery 두 개 | `다시 시도`, `일반 정보 보기` | Age 미완료, 원 지도 context 유지 |
| Return | 원래 보던 곳으로 돌아왔나요? | 같은 venue marker/control에 focus | 이어서 탐색 | RT 소비 또는 삭제, 중복 mutation 0 |

## 5. 화면별 상세 규격

### Screen/Sheet A0 · Public night-view declaration

**목적**

- provider 없이 현재 탭의 지도 presentation만 바꾸는 명시적 자기선언을 받는다.

**첫 viewport에 보이는 것**

- 현재 city, moon/`19+` glyph, 제목 `밤 지도`, 한 줄 가치, primary `만 19세 이상이에요`, secondary `나중에`.

**시각·인터랙션**

- 완료 check, provider logo, credential badge를 쓰지 않는다.
- 확인 뒤 새 화면을 열지 않고 같은 camera에서 220ms 동안 dark/neon token과 approved night subset 강조만 crossfade한다.
- 일반 음식점·검색·필터·선택 장소는 유지하고 active utility 옆에서 즉시 끌 수 있다.

**권한 경계**

- 결과는 `LOCAL_DECLARATION · SELF_DECLARED · night_view_only`다.
- `AGE-VERIFIED`를 만들거나 보호된 주류 주문·Table CTA의 age guard를 충족하지 않는다.
- Account·Person·Payment KYC·K-Tour ID 상태를 읽어 성공을 추론하거나 변경하지 않는다.

### Screen/Sheet A · Protected 19+ Decision

**목적**

- 선택한 주류 장소·Table 행동에 Age 하나만 필요한 이유와 provider 확인 시작 결정을 보여준다.

**첫 viewport에 보이는 것**

- compact header의 lock/`19+` glyph, 선택 장소명 또는 Table명, close.
- 제목 `19+ 확인`과 한 줄 이유.
- primary `19+ 확인하기`, secondary `기본 지도 보기`.

**시각·인터랙션**

- Decision sheet는 content-fit, 최대 72dvh이며 320px에서도 header·질문·primary가 첫 viewport에 들어온다.
- 선택 장소 thumbnail/name은 gate 중 바뀌지 않는다.
- thumbnail은 source-backed media만 쓰고, 없으면 night/category pictogram+accessible label로 대체한다. 빈 원형 avatar, 이니셜, generic letter box를 만들지 않는다.
- `19+`는 color나 generic shield만으로 표현하지 않고 glyph와 보이는 text를 함께 쓴다.

**행동**

- Primary: `19+ 확인하기`
- Secondary: `기본 지도 보기`
- Close/Back: close는 flow 취소, Back은 provider method가 있을 때 이전 decision으로만 이동

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | `19+`, 선택 장소/Table, 필요한 이유, primary, close |
| 시각화 | 잠긴 night glyph, 원 장소가 유지된 header, primary 한 개 |
| 한 번 접기 | 공유하지 않는 정보, 확인 결과의 보관 범위·만료, review fixture provenance |
| Labs/개발 문서로 이동 | adapter/network/raw response schema, fixture selector |
| 삭제 | `ON-DEVICE`, K-Tour setup 홍보, Person·Payment 체크리스트, passport/DID 기술 설명, 4-step progress |

### Screen/Sheet B · Pending and unavailable

**목적**

- 보호 행동의 실제 가능한 provider 결과만 보여주고 재시도 또는 일반 탐색 복귀를 제공한다. 공개 night-view 자기선언에는 이 provider 상태를 만들지 않는다.

**첫 viewport에 보이는 것**

- 같은 header, compact progress 또는 warning glyph, 상태 한 줄, recovery action.

**시각·인터랙션**

- pending은 spinner와 `19+ 확인 중` live status만 사용하고 success skeleton을 쓰지 않는다.
- provider 미연결은 일반 실패와 분리해 `지금 확인할 수 없어요`로 표시한다. provider명은 펼친 상세에서만 보인다.
- review fixture success일 때만 check glyph를 사용하며 `Review fixture · 기기 밖 연결 없음` provenance를 결과 상세에 둔다.

**행동**

- Primary: unavailable/failed이면 `다시 시도`, review success이면 원 행동 자동 재개
- Secondary: `기본 지도 보기`
- Close/Back: 원 지도/장소로 복귀하고 RT 삭제

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 확인 중/사용 불가/실패 중 하나, recovery, 같은 원 객체 |
| 시각화 | lock→progress→check 또는 warning의 한 자리 상태 변화 |
| 한 번 접기 | issuer type, expiry, provider 미구성 이유, review fixture ID |
| Labs/개발 문서로 이동 | callback payload, raw error, adapter diagnostics |
| 삭제 | 가짜 `확인 완료`, 성공 confetti, 생년월일·문서 번호, 다른 gate 완료 badge |

### Screen C · Same-map night-view / protected return

**목적**

- 공개 night-view는 별도 result page 없이 같은 지도 presentation으로, 보호 행동의 확인 성공은 같은 장소·Table의 원 CTA로 돌아가 보여준다.

**첫 viewport에 보이는 것**

- 동일 camera·roads·coast·district labels·markers, active night-view icon, 선택 venue 또는 원 CTA.
- 공개 night-view는 첫 진입에만 `밤 지도가 켜졌어요` 한 줄과 44px `끄기`; 보호 행동은 별도 성공 페이지 없이 원 CTA 상태만 갱신한다.

**시각·인터랙션**

- light/night marker screen position diff는 0~1px다. land/water luminance 차이와 geography contrast를 유지한다.
- plum/pink/coral은 active heat와 selected state에만 쓰며 모든 card outline을 neon으로 만들지 않는다.
- 일반 심야 음식점은 남고 approved night subset만 강화된다.

**행동**

- Primary: 보호 행동 성공에서만 잠겼던 venue/Table CTA를 정확히 한 번 재개
- Secondary: `끄기`
- Close/Back: venue detail은 같은 map selection으로 닫힘

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 공개 night-view active state와 immediate off 또는 보호 행동의 원 장소/CTA context |
| 시각화 | 공개 경로는 220ms color-token crossfade·selected aura, 보호 경로는 lock→open state |
| 한 번 접기 | 확인 만료 시각, 보관 범위 |
| Labs/개발 문서로 이동 | guard debug, fixture clock, token diff |
| 삭제 | bars-only 문구, `인증된 사용자` badge, 상시 banner, 별도 success page |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Public declaration | check badge 없이 같은 지도가 dark/neon token으로 바뀌고 night subset이 강조된다. | 끄기, 장소 탐색 | `SELF_DECLARED · night_view_only`; `AGE-VERIFIED` 및 보호 CTA 불변 |
| Loading | 원 지도/venue가 dim 뒤에 남고 glyph만 progress로 변한다. | 취소 | Account·Person·Payment KYC·map context 불변 |
| Empty | night subset이 없으면 `이 지역의 야간 추천이 아직 없어요`와 일반 결과가 남는다. | 일반 결과 보기, mode 끄기 | 가짜 장소·온도 생성 금지 |
| Failure | warning + 짧은 이유; check 없음 | 다시 시도, 기본 지도 보기 | `AGE-FAILED`, 원 CTA 미실행, RT 보존 |
| Retry | 같은 sheet·같은 원 객체에서 `AGE-PENDING` 재진입 | 취소 | 새 modal·route 금지, 중복 callback 무시 |
| Cancel | sheet가 닫히고 opener에 focus가 돌아간다. | 일반 탐색 | Age와 다른 gate 불변, RT 삭제 |
| Protected success | 연결된 provider 결과 또는 review fixture에서만 check 후 원 객체로 복귀 | 원 CTA 계속 | `AGE-VERIFIED`; Account·Person·Payment KYC·K-Tour ID 불변 |
| Return | 성공은 same object, 실패·취소는 standard map/locked venue | 이어서 탐색 | success RT one-shot consume; invalid/expired RT는 안전한 같은 city list |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| public declaration→night-view | 220ms token crossfade | camera·coast·road·label·marker 0~1px 이내; 완료 check 없음 | duration 0, token 즉시 교체 |
| opener→Decision sheet | 240~280ms, standard decelerate | backdrop와 sheet가 같은 frame에 시작; map camera 고정 | duration 0, focus 즉시 이동 |
| Decision→Pending | 160~200ms body crossfade | header·venue anchor·footer 위치 고정 | 즉시 상태 교체 + live announcement |
| Pending→Success | 220~360ms glyph morph | lock과 check의 center 고정; confetti 없음 | opacity 없이 static check |
| protected success→original action | 220~280ms reverse | 원 venue/Table와 opener의 screen position 고정 | 즉시 close + 원 CTA focus |
| close/return | 240~280ms reverse | opener와 선택 marker가 움직이지 않음 | 즉시 close + opener focus |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Public title | 밤 지도 | Night view | 夜の地図 | 공개 탐색 presentation임을 먼저 표현 |
| Public reason | 밤에 어울리는 장소를 모아봐요 | See places for a night out | 夜のお出かけに合う場所を表示します | 영업·주류 제공 사실을 단정하지 않음 |
| Public CTA | 만 19세 이상이에요 | I’m 19 or older | 19歳以上です | 자기선언이며 provider 확인 CTA와 구분 |
| Title | 19+ 확인 | Confirm 19+ | 19歳以上を確認 | 법적 신원 전체가 아닌 predicate만 명시 |
| Reason | 이 야간 경험에 필요해요 | Required for this night experience | この夜の体験に必要です | 선택 객체와 함께 한 줄 |
| Primary CTA | 19+ 확인하기 | Confirm 19+ | 19歳以上を確認 | 결과를 미리 단정하지 않음 |
| Secondary CTA | 기본 지도 보기 | Keep standard map | 通常の地図を見る | Guest 탐색이 계속됨을 표현 |
| Pending | 19+ 확인 중 | Checking 19+ | 19歳以上を確認中 | `aria-live=polite` |
| Unavailable | 지금 확인할 수 없어요 | Can’t confirm right now | 現在確認できません | provider명은 disclosure로 이동 |
| Retry | 다시 시도 | Try again | もう一度試す | 같은 context 재시도 |
| Active status | 밤 지도가 켜졌어요 | Night view is on | 夜の地図がオンになりました | 공개 경로에서 최초 한 번만; verified 문구 금지 |
| Off CTA | 끄기 | Turn off | オフにする | 44px text action 유지 |

- provider·network·architecture 명칭은 결정에 필요할 때만 보인다.
- normal UI에 `preview`, `simulated`, `test`, `on-device`, DID/VC 발급 문구를 쓰지 않는다.
- review mode provenance는 숨기지 않되 consumer title/CTA와 경쟁하지 않는 result detail에 둔다.

## 9. Accessibility·responsive

- 320×568/800과 360px은 edge 16px, 390×844와 430px은 edge 20px이며 horizontal overflow는 0이다.
- 844×390은 rail 없이 하나의 internal scroll만 사용하고 header·질문·primary·close가 keyboard 없이 도달 가능하다.
- primary와 `끄기`, close는 48px default, 법적 최소 44×44px이며 인접 control gap은 8px 이상이다.
- 지도 utility의 `19+` icon은 `밤 지도, 꺼짐/켜짐`의 KO/EN/JA accessible name과 `aria-pressed`를 가진다. 보호 행동의 control은 `19+ 확인`으로 별도 명명한다.
- pending·unavailable·success·mode change를 polite live region으로 알리고 focus를 임의로 지도에 보내지 않는다.
- sheet는 focus trap, Escape close, background inert, opener focus restore를 지원한다.
- 200% text zoom에서 제목·reason·primary가 sticky footer 뒤로 숨지 않으며 footer 높이만큼 content padding을 둔다.
- forced colors에서 lock/check/warning과 selected/unselected가 border·glyph·text로 구분된다.
- night palette 주요 text는 4.5:1, secondary geography/UI boundary는 3:1 이상이며 색 없이도 active state를 읽을 수 있다.

## 10. 계측·완료 기준

### UX signal

- 지도 utility tap→public night-view paint p95와 보호 CTA tap→Decision, decision→pending, pending→same-object return 시간을 서로 다른 event로 기록한다.
- cancel/unavailable 뒤 일반 탐색 계속률과 exact `OPEN_AFTER19` return 성공률을 본다.
- review fixture에서 Age 외 state mutation 수, duplicate callback mutation 수, geometry diff를 자동 감사한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] public night-view와 protected 19+ 각각의 first viewport에는 질문 하나와 primary 하나만 경쟁한다.
- [ ] Guest가 시작·취소·실패 후 일반 지도를 계속 쓸 수 있고 Account를 강제하지 않는다.
- [ ] 공개 자기선언은 현재 탭의 night-view만 열고 `AGE-VERIFIED`나 보호된 주류·Table unlock을 만들지 않으며, 보호 행동의 provider 미연결 경로는 `PROVIDER_UNAVAILABLE`로 fail closed한다.
- [ ] explicit review fixture에만 `fixtureId`, `SIMULATED`, expiry가 있으며 다른 gate는 변하지 않는다.
- [ ] raw DOB/passport/ID image/number/provider response가 state·storage·analytics에 없다.
- [ ] 성공은 원 venue/Table 또는 map control을 정확히 한 번 재개한다.
- [ ] 서울·부산·제주의 light/night geometry diff가 0~1px이고 일반 심야 장소가 유지된다.
- [ ] 320/360/390/430 portrait, 320×568, 844×390, 200% zoom에서 clipping·이중 scroll이 없다.
- [ ] KO/EN/JA, keyboard, VoiceOver/TalkBack, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-012` manual 19+ | 공개 night-view presentation과 보호 행동 Age-only Decision을 분리; 보호 행동은 same venue/Table return | requirement trace와 두 경로 CTA E2E |
| State | `AGE-UNVERIFIED/PENDING/VERIFIED/FAILED/EXPIRED`, `A19-OFF/ON/MANUAL-OFF` | PRD Age/After19 축은 그대로 유지한다. `LOCAL_DECLARATION/SELF_DECLARED/night_view_only`는 탭 한정 presentation receipt이며 protected-age evaluator가 거절한다. | reducer illegal-transition + self-declaration negative authorization test |
| Fixture | `FX-AGE-PENDING/SUCCESS/FAIL/EXPIRED` | 공개 night-view는 fixture가 아닌 local declaration; 보호 성공·실패 fixture는 explicit review mode만, 보호 public 경로는 provider unavailable | provenance snapshot와 public/protected negative test |
| returnTo | 보호 장소는 `OPEN_AFTER19`, `RT-OPEN_AFTER19-${Date.parse(createdAt)}`; 주류 Table은 기존 `JOIN_TABLE` | 공개 night-view는 같은 map state에서 token만 전환한다. 보호 canonical envelope에는 CTA matrix의 공개 ID만, 화면 context는 local snapshot으로 분리하고 success mutation 직전 one-shot consume한다. | public geometry stability + protected success/cancel/fail/expired/tampered E2E |
| Persistence | Age proof memory/demo session, manual-off sessionStorage | 공개 declaration은 현재 탭 밖으로 나가지 않는다. 보호 Guest는 현재 행동 memory만; Account만 최소 predicate·issuer type·expiry를 demo session에 보관; raw identity 0 | reload/reset/storage allowlist test |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 지도 night-view와 보호 행동을 분리하고 각 화면에는 질문 하나만 둔다. | public declaration은 같은 지도 presentation만 변경; protected Age-only sheet는 원 행동으로 복귀 |
| D2 시각·인터랙션 | 같은 map/marker geometry, lock→check morph, 220ms night crossfade | 서울·부산·제주 공통 renderer와 0~1px geometry diff를 acceptance로 고정 |
| D3 신뢰·접근성 | 자기선언 권한 제한, 보호 provider 미연결 fail closed, minimal predicate, raw identity 금지, exact return | `SELF_DECLARED/night_view_only`와 protected Age를 분리하고 screen-reader 상태·focus 복귀를 고정 |

잔여 이견: `없음`.
