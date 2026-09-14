# FL-014 · Auto After19

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-012`; `REQ-019`는 동일 MapLibre geography·renderer 증거를 지원하지만 이 flow의 owner 요구는 아니다. |
| 진입 행동 | 앱이 foreground/resume되거나 KST 19:00 경계를 지날 때 auto guard를 재평가한다. |
| 성공 결과 | valid Age, KST≥19:00, auto on, current session manual-off 아님을 모두 만족하면 `A19-PROMPT → A19-ON`; 같은 map camera·query·selection 위에서 night token과 approved subset emphasis만 바뀐다. |
| 취소 결과 | 첫 status의 `끄기` 또는 persistent active control을 누르면 즉시 `A19-MANUAL-OFF`; 같은 session에는 자동 재활성화하지 않는다. |
| 실패·재시도 | clock/timezone/credential read 오류와 guard 불충족은 fail closed하여 `A19-OFF`; 기본 ONDO와 일반 장소는 그대로 쓰며 다음 resume·시간 경계에서 재평가한다. |
| 정확한 복귀 | 별도 route·gate·`returnTo`가 없다. mode 전후 city, camera, bearing, zoom, query, filters, selected venue, sheet snap, scroll, focus가 동일하다. |
| 실행 truth | 자동 전환은 기존의 유효한 Age predicate만 소비한다. 시간만으로 `AGE-VERIFIED`를 만들지 않고 provider·identity·payment 상태를 호출하거나 변경하지 않는다. |

### 삭제할 수 없는 PRD 불변식

- 정규 guard는 `AGE-VERIFIED && expiresAt > now && KST >= 19:00 && PREF-AUTO-NIGHT-ON && after19 !== A19-MANUAL-OFF`다. 구현에서 valid Age(status+expiry)를 하나의 guard group으로 계산한다.
- `A19-MANUAL-OFF`는 같은 session의 auto guard보다 우선하며 새 session/reset에서만 `A19-OFF`로 돌아간다.
- 일반 심야 음식점과 24시간 식당은 기본 ONDO에 남는다. After19는 bars-only replacement가 아니다.
- light/night는 동일 camera, coast, roads, district labels, marker geometry와 서울·부산·제주 공통 renderer를 쓴다.
- 제주 `score=null`, `editorial-unscored`, `pulseEligible=false`, `officialRecord=false`를 유지하며 야간 전환이 score나 official state를 만들지 않는다.
- Age 만료, timezone 변경, 자정, resume에 재평가하고 invalid state에서 즉시 `A19-OFF`로 fail closed한다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| 어두운 mode가 geography를 거의 지우고 black/gray void처럼 보인다. | 장소 관계와 현재 위치를 잃고 다른 앱 화면처럼 느낀다. | P1 | `A19-ON`, dark map |
| 흰 card, neon outline, gray map이 서로 다른 theme grammar를 쓴다. | selected, active, content의 우선순위를 구분하기 어렵다. | P1 | map controls, place sheet |
| KST 19:00만으로 자동 활성화될 여지가 있다. | 연령을 확인하지 않았는데 성인 mode가 열린다고 오인한다. | P0 | invalid auto transition |
| status banner가 매번 뜨거나 screen을 크게 차지할 수 있다. | 지도 usable area가 줄고 사용자의 manual-off 통제권이 약해진다. | P1 | `A19-PROMPT` |
| 야간 mode가 술집만 남기는 filter처럼 보일 수 있다. | 일반 야간 식당이 사라지고 ONDO의 탐색 범위가 왜곡된다. | P1 | night results |

## 3. 목표 경험

### 한 문장 약속

> 조건이 맞는 저녁에는 보던 지도 그대로 야간 신호가 조용히 살아나고, 사용자는 즉시 끌 수 있다.

### 사용자가 1초 안에 알아야 하는 것

- After19가 켜졌는지 active `19+` control로 알 수 있다.
- 처음 켜진 순간에만 한 줄 status와 `끄기`가 보인다.
- 지도·선택 장소·일반 심야 음식점은 사라지지 않는다.

### 사용자가 읽지 않아도 알아야 하는 것

- 같은 지형 위 color temperature만 바뀌어 mode change를 공간적으로 이해한다.
- active heat와 selected marker만 plum/pink/coral로 살아나고 일반 UI는 near-black neutral을 유지한다.
- off 뒤 즉시 light token으로 돌아오며 camera가 움직이지 않는다.

## 4. 권장 모바일 여정

```text
APP RESUME OR KST BOUNDARY
→ EVALUATE VALID AGE + TIME + AUTO PREF + SESSION OVERRIDE
→ A19-PROMPT
→ A19-ON | A19-MANUAL-OFF | A19-OFF
→ SAME MAP CONTEXT
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 자동 야간 조건이 모두 맞나요? | 현재 MapLibre map과 compact `19+` control | 시스템 평가 | camera, query, filters, selection, sheet snap, focus |
| Prompt | 지금 켜진 mode를 유지할까요? | control에 anchored된 한 줄 status | `끄기` 또는 계속 탐색 | valid Age와 session preference |
| Active | 야간 신호를 어디서 볼까요? | 동일 geography 위 night field/aura/core | 장소 선택 | 일반 결과와 map/list parity |
| Manual off | 이번 session에서 끌까요? | inactive `19+` control과 light map | 필요 시 manual FL-013 | `A19-MANUAL-OFF`, 다른 상태 불변 |
| Guard failure | 기본 지도를 계속 쓸까요? | light map; 오류 modal 없음 | 계속 탐색 | credential·payment·selection 불변 |
| Return | 전환 전과 같은 위치인가요? | 동일 marker/venue focus | 이어서 탐색 | 별도 route·RT·중복 mutation 없음 |

## 5. 화면별 상세 규격

### Screen A · First auto-on status

**목적**

- 자동으로 바뀐 mode와 즉시 끌 수 있는 통제권을 한 번만 알린다.

**첫 viewport에 보이는 것**

- map utility의 active `19+` control.
- control에 anchored된 `After19가 켜졌어요`와 44px `끄기` 한 줄.
- 기존 지도·search·선택 장소가 그대로 보인다.

**시각·인터랙션**

- status는 utility control 기준 safe rectangle 안에 폭 280px 이하, 모든 edge·다른 control과 12px 이상 간격이 확보될 때만 anchored popover다. 이 조건을 하나라도 못 맞추면 dock·attribution 위의 compact bottom `InlineStatus`로 결정적으로 전환하며 최대 두 줄+분리된 44px `끄기`만 둔다. 큰 흰 정보 box와 임의 좌표 보정은 금지한다.
- status는 최초 auto-on 한 번만 노출한다. dismiss 뒤 persistent active control만 남는다.
- safe area, search, utility tray, attribution, selected marker의 실제 bounding box를 계산하고 충돌 시 bottom status로 flip한다. hover/focus에 따라 anchor나 marker가 이동하지 않는다.

**행동**

- Primary: 계속 지도 사용; 별도 CTA를 만들지 않는다.
- Secondary: `끄기`
- Close/Back: status dismiss는 mode 유지, Back route 생성 없음

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | active `19+` control; 첫 진입 한정 mode status와 `끄기` |
| 시각화 | control selected state, map token crossfade, active field |
| 한 번 접기 | auto setting과 Age 만료 시각으로 이동하는 contextual settings link |
| Labs/개발 문서로 이동 | fixture clock, guard debug, token names |
| 삭제 | full-screen modal, 매번 banner, provider/identity 설명, countdown, 축하 animation |

### Screen B · Active night map/list/place

**목적**

- geography를 잃지 않은 채 approved night subset을 더 잘 발견하게 한다.

**첫 viewport에 보이는 것**

- same coast/roads/district labels, selected city/venue, active `19+`, 기존 search/filter/list access.
- 일반 장소와 추가 강조된 night places가 함께 보인다.

**시각·인터랙션**

- canvas near-black; land와 water는 7% 이상 luminance 차이를 둔다.
- 주요 text 4.5:1, secondary geography와 boundary 3:1 이상이다.
- active heat와 selected state만 plum/pink/coral을 쓰고 일반 card는 near-black surface + neutral border다.
- light component 전체에 `filter: invert()`/`hue-rotate()`를 적용하지 않는다. photo·brand asset은 원색을 유지하고 text가 필요한 media에만 국소 neutral scrim을 쓴다. surface/icon/text는 각각 night token으로 교체해 흰 card·검은 map·neon outline이 섞이지 않게 한다.
- map/list/peek/detail은 동일 data order와 selected state를 공유한다. 제주도 같은 field→aura→core→halo→capsule renderer를 쓴다.

**행동**

- Primary: 장소 선택/기존 place CTA
- Secondary: active `19+` control에서 `끄기`
- Close/Back: 기존 map/list/place navigation 의미를 유지

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | active mode, 장소명·category·결정 사실, off 접근 경로 |
| 시각화 | night field, selected halo, eligible subset emphasis, persistent icon |
| 한 번 접기 | mode 설명, auto setting, Age expiry |
| Labs/개발 문서로 이동 | heat samples, style token diff, fixture time |
| 삭제 | `PEAK/HOT/Pulse`, bars-only 제목, score 없는 제주 숫자, 모든 outline neon, 상시 maker disclaimer |

### Screen C · Re-evaluation and fail-closed return

**목적**

- guard가 깨졌을 때 오류 page 없이 안전하게 기본 ONDO로 되돌린다.

**첫 viewport에 보이는 것**

- 같은 map context의 light token과 inactive `19+` control.
- Age 만료처럼 사용자 행동이 필요한 경우에만 control 옆 compact status 한 줄.

**시각·인터랙션**

- clock read error는 toast storm이나 modal을 만들지 않고 다음 resume에 재평가한다.
- Age expiry는 `19+ 확인 필요`를 control accessible state에 반영하되 일반 탐색을 막지 않는다.
- manual-off는 session 끝 전까지 auto 재평가 결과를 무시한다.

**행동**

- Primary: 계속 탐색
- Secondary: 만료된 경우 `19+ 다시 확인`
- Close/Back: compact status dismiss; mode state는 guard 결과 유지

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | inactive state와 필요한 경우 한 줄 recovery |
| 시각화 | night→light token, active→inactive control |
| 한 번 접기 | guard가 꺼진 이유와 setting |
| Labs/개발 문서로 이동 | timezone/clock error code, guard evaluation log |
| 삭제 | fatal error page, 연령 미확인 사용자 차단, 자동 재활성화 toast 반복 |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | 별도 loader 없이 현재 map을 유지하고 guard를 동기 평가한다. | 기존 지도 사용 | 지형·selection·results 불변 |
| Empty | approved night subset 0이면 일반 결과와 compact empty hint만 남는다. | 일반 장소 보기, 끄기 | 가짜 night place/score 생성 0 |
| Failure | clock/timezone/state read 실패 시 light map; 필요한 경우 non-blocking status | 계속 탐색, 다음 resume 재평가 | `A19-ON` 금지, Age/Account/Payment 불변 |
| Retry | resume·KST boundary·valid Age 갱신 시 guard 전체를 재평가 | 없음 또는 manual 확인 | 이전 `A19-MANUAL-OFF` 우선 |
| Cancel | first status의 `끄기`가 `A19-MANUAL-OFF`로 전이 | manual FL-013만 가능 | same-session auto reactivation 0 |
| Success | `A19-PROMPT → A19-ON`, 220ms token crossfade | 장소 탐색, 끄기 | same geometry/general venues/map context |
| Return | mode on/off 모두 같은 route와 focus | 기존 action 계속 | 별도 `returnTo`·modal stack·route remount 0 |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| guard true→Prompt | status 180~220ms fade/slide 4px | map·utility anchor 고정 | 즉시 표시 + live announcement |
| Prompt→On | 220ms token crossfade | coast/road/label/marker screen diff 0~1px | duration 0, state 즉시 교체 |
| On→Manual off | 220ms reverse crossfade | camera/bearing/zoom/selection 고정 | duration 0 |
| selected place emphasis | 140~180ms | marker center·capsule anchor 고정 | static border/glyph |
| status dismiss | 160~200ms opacity | active control은 움직이지 않음 | 즉시 제거, focus control로 복귀 |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| First status | After19가 켜졌어요 | After19 is on | After19がオンになりました | 첫 auto-on 한 번만 |
| Off CTA | 끄기 | Turn off | オフにする | text verb, 44px 이상 |
| Active label | 19+ 보기 켜짐 | 19+ view on | 19+表示オン | accessible state; screen text는 compact 가능 |
| Expired status | 19+ 확인이 필요해요 | Confirm 19+ again | 19歳以上の再確認が必要です | 일반 지도는 계속 사용 가능 |
| Recheck CTA | 19+ 다시 확인 | Confirm again | もう一度確認 | FL-013으로 연결 |
| Empty | 이 지역의 야간 추천이 아직 없어요 | No night picks here yet | このエリアには夜のおすすめがまだありません | 일반 결과를 숨기지 않음 |

- provider·network·architecture 명칭은 normal map에 표시하지 않는다.
- `bars only`, `exclusive`, `verified adult`, `Pulse/Peak/Hot`과 maker-oriented mode 설명을 금지한다.
- After19라는 product label은 유지하되 `19+ 보기`를 accessible purpose로 함께 제공한다.

## 9. Accessibility·responsive

- 320×568/800·360px은 edge 16px, 390×844·430px은 edge 20px이며 map usable area를 text status가 막지 않는다.
- 844×390에서는 rail을 띄우지 않고 status가 search·utility·attribution·selected marker와 충돌하지 않는다.
- active control과 `끄기`는 44×44px 이상, 기본 48px이며 인접 control gap은 8px 이상이다.
- `aria-pressed`, localized accessible name, first status `aria-live=polite`로 mode 변화를 전달한다.
- VoiceOver/TalkBack 순서는 map heading→active state→off→search/list→places다. status dismiss 뒤 focus는 active control로 간다.
- keyboard Space/Enter로 toggle 가능하고 Escape는 status만 닫으며 mode를 암묵적으로 끄지 않는다.
- forced colors에서는 active/inactive를 solid/dashed border, glyph, text로 구분하고 heat color만 의존하지 않는다.
- 200% zoom에서도 status는 최대 두 줄 + 별도 off action이며 horizontal scroll과 clipped CTA가 없다.
- reduced motion에서도 geography·selected state·mode label로 동일한 상태를 판단할 수 있다.

## 10. 계측·완료 기준

### UX signal

- guard별 on/off reason, first status 노출 횟수, 즉시 off 비율, same-session 재활성화 0을 기록한다.
- light/night renderer의 camera/feature/marker screen diff와 일반 장소 결과 parity를 자동 비교한다.
- mode 전환 frame recording에서 token crossfade duration, frame drop, focus stability를 측정한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN`에 해당하는 auto evaluation·prompt·off·fail-closed·re-evaluation·active·same-context 계약이 유지된다.
- [ ] valid Age(status+expiry), KST time, auto preference, manual-off override가 모두 맞을 때만 `A19-ON`이다.
- [ ] KST 19:00만으로 Age, Person, Account, Payment KYC가 바뀌지 않는다.
- [ ] `A19-MANUAL-OFF`는 session 동안 자동 전환보다 우선한다.
- [ ] coast/roads/labels/camera/markers의 light/night screen diff가 0~1px다.
- [ ] photo·logo에 global invert/hue filter가 없고 map/list/peek/detail이 같은 night surface/icon/text token을 쓴다.
- [ ] 일반 심야 음식점과 24시간 식당이 night mode에서 유지된다.
- [ ] 서울·부산·제주가 같은 renderer를 쓰며 제주에 score·official state를 만들지 않는다.
- [ ] first status는 한 번만 보이고 44px 이상 `끄기`가 즉시 동작한다.
- [ ] anchored/bottom status 선택은 12px safe-rectangle collision 규칙으로 결정되고 hover·locale 변경에도 anchor와 marker가 이동하지 않는다.
- [ ] 320/360/390/430, 320×568, 844×390, 200% zoom에서 collision·clipping·이중 scroll이 없다.
- [ ] KO/EN/JA, keyboard, screen reader, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-012` auto After19; `REQ-019` map evidence support | four guard groups + same-map night tokens + immediate off | guard matrix와 light/night recording |
| State | `A19-OFF/PROMPT/ON/MANUAL-OFF`, `AGE-VERIFIED/EXPIRED`, `PREF-AUTO-NIGHT-*` | manual-off precedence와 fail-closed 유지 | reducer transition/clock/timezone tests |
| Fixture | `FX-A19-AUTO-READY/ON/MANUAL-OFF/RESET`, `FX-AGE-EXPIRED` | deterministic time·expiry·session branches | fixture provenance + boundary tests |
| returnTo | 없음; session mode | route·camera·query·selection·focus 자체를 보존 | before/after state deep comparison |
| Persistence | auto preference local, manual-off sessionStorage, valid Age 최소 result | raw identity 0; reset에서 manual-off key만 삭제 | storage allowlist/reset test |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 최초 한 줄 status와 즉시 off, 상시 설명 제거 | 첫 auto-on 한 번만 status, 이후 active icon으로 축약 |
| D2 시각·인터랙션 | same camera 220ms night primitive, geography와 일반 장소 유지 | token-only crossfade와 0~1px geometry diff를 release gate로 고정 |
| D3 신뢰·접근성 | valid Age를 포함한 guard, manual-off 우선, 오류 fail closed | 독립 state·session control·live region·forced-colors 계약으로 고정 |

잔여 이견: `없음`.
