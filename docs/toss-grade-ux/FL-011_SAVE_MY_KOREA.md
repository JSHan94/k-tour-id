# FL-011 · Save and My Korea

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-005`, `REQ-016` |
| 진입 행동 | canonical official/editorial place의 bookmark `저장`; Guest면 `FL-010`의 `SAVE_VENUE` Account gate |
| 성공 결과 | `SAV-SAVING→SAV-SAVED`, bookmark와 My Korea memory map/timeline이 같은 venue를 반영 |
| 취소 결과 | Account gate 취소 또는 save 취소 시 `SAV-IDLE`; 원 place/map/scroll/focus 유지 |
| 실패·재시도 | local persistence 실패 시 false-filled bookmark를 제거하고 `SAV-FAILED`; 같은 place에서 retry |
| 정확한 복귀 | `SAVE_VENUE` one-shot 뒤 원 venue CTA 재개; My Korea item은 canonical city→map→peek/detail history로 round-trip |
| 실행 truth | saved는 local preference/persistence이며 예약·merchant sync·방문·추천·official verification이 아님 |

### 삭제할 수 없는 PRD 불변식

- Account success와 Save success는 별도 사건이다. Account가 생겼다고 bookmark를 채우지 않는다.
- `SAVE_VENUE`는 registered `venueId` required, `tableId` forbidden이며 mutation 직전에 token을 소비한다.
- official venue와 Jeju editorial place는 같은 card/detail interaction을 쓰되 저장 ID namespace와
  source truth를 합치지 않는다.
- Save는 Visit, Contribution, Meetup, stamp, Person, Age, Payment KYC를 바꾸지 않는다.
- My Korea의 saved/recent/Table/contribution/receipt/stamp 기능은 시각 압축을 이유로 삭제하지 않는다.
- discovery preference reset, ID session reset, saved data removal, wallet/local receipt restore는 서로 다른 scope다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| 저장 Account gate와 실제 bookmark mutation의 경계가 약하다 | 계정을 만들면 이미 저장된 것으로 오해하거나 중복 저장한다 | P0 | account→save handoff |
| My Korea가 saved/planned/recent/receipt/contribution 큰 관리 카드 묶음처럼 보인다 | 장소와 여행 기억보다 기능 목록을 읽게 된다 | P1 | `ondo-b-my-korea-entry` sections |
| `local preview`, `on this device` 같은 maker/storage copy가 반복된다 | 실제 앱이 아니라 내부 데모 관리 화면처럼 느껴진다 | P1 | planned/privacy/receipt boundary copy |
| saved card의 출처 media가 약하거나 빈 상태가 설명문 중심이다 | 다시 가고 싶은 장소를 시각적으로 떠올리기 어렵다 | P1 | saved/reference/empty cards |
| official/editorial 저장이 다른 컴포넌트로 갈라질 수 있다 | 제주 기억이 서울·부산보다 덜 완성된 보조 기능처럼 보인다 | P1 | separate editorial arrays/open handlers |
| 삭제 dialog가 저장 외 기록까지 지울 것처럼 모호할 수 있다 | 사용자가 note/receipt/recent까지 잃을까 걱정한다 | P1 | saved removal modal |

## 3. 목표 경험

### 한 문장 약속

> 장소에서 한 번 저장하고, My Korea의 같은 지도와 사진 기억에서 다시 그 장소로 돌아간다.

### 사용자가 1초 안에 알아야 하는 것

- bookmark가 채워지면 이 장소가 저장됐다.
- 저장에 계정이 필요하면 같은 장소에서 한 번만 묻고 돌아온다.
- My Korea item을 누르면 새로운 관리 상세가 아니라 원래 place experience로 간다.

### 사용자가 읽지 않아도 알아야 하는 것

- outline→filled bookmark morph가 save mutation을 직접 나타낸다.
- My Korea mini-map의 pin, source-backed thumbnail, 날짜 grouping이 여행 기억을 말한다.
- official/editorial 차이는 compact source glyph만 다르고 card geometry와 CTA는 같다.
- 삭제 시 bookmark만 사라지고 다른 기록은 남는다는 scope가 confirm object에 보인다.

## 4. 권장 모바일 여정

```text
ENTRY / DECISION · tap the exact place bookmark
→ if Guest: FL-010 Account Decision with same venue
   → CANCEL/FAILURE returns unsaved to same bookmark
   → SUCCESS resumes the original bookmark action automatically, with no second confirmation
→ PENDING · SAV-SAVING, duplicate tap locked
→ TERMINAL · SUCCESS: SAV-SAVED bookmark morph + short live status
  | CANCEL: SAV-IDLE, exact unsaved place
  | ERROR: SAV-FAILED, unfilled bookmark
→ RETRY · same venue and same save control
→ RETURN · same place
→ My Korea icon → memory map/timeline → saved item
→ canonical city/map/peek/detail → Back to same My Korea scroll/focus
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 이 장소를 저장할까? | place photo/name + bookmark | 저장 | city/camera/map-list/venue/sheet/scroll/focus |
| Account | 계정을 만들고 저장할까? | same venue header + Account icon | 계정 만들고 저장 | pending `SAVE_VENUE` |
| Pending | 저장 중인가? | bookmark spinner/morph | wait | original place and token |
| Success | 저장됐나? | filled bookmark + My Korea pin | continue / My Korea | only saved state changes |
| Failure | 다시 저장할까? | unfilled bookmark + InlineStatus | 다시 시도 | venue/context, no false saved state |
| Memory | 저장한 곳을 다시 볼까? | mini-map + photo timeline/card | place open | My Korea section/scroll/opener |
| Removal | 이 저장만 지울까? | exact venue thumbnail/name + scope | 저장 삭제 | recent/note/receipt/contribution unchanged |
| Return | 원 장소와 기억을 왕복했나? | canonical peek/detail or My Korea row | Back | source/city/history/focus |

## 5. 화면별 상세 규격

### Place action A · Bookmark

**목적**

- 저장 상태를 설명 카드 없이 원 place object에서 바꾼다.

**첫 viewport에 보이는 것**

- place hero media/name/source glyph, 48px bookmark control, 기존 primary place action.

**시각·인터랙션**

- bookmark target 48px, outline idle, inline spinner saving, filled saved, warning dot+text failed.
- success toast는 2초 이하 `저장됨`; 별도 success modal/card는 없다.
- official/editorial 모두 동일 위치/size/motion이며 source glyph만 진실을 구분한다.

**행동**

- Primary: bookmark toggle.
- Secondary: 저장 후 `My Korea에서 보기`는 toast/accessible action으로 1회 제공 가능.
- Close/Back: place의 기존 close/back; save pending 동안 duplicate만 막고 navigation은 confirmation 없이 차단하지 않는다.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | bookmark state, venue identity, failure/retry |
| 시각화 | outline/fill/spinner + My Korea pin |
| 한 번 접기 | saved is private/local, source detail |
| Labs/개발 문서로 이동 | storage key, fixture IDs, namespace mapping |
| 삭제 | saved success modal, `on-device/local preview`, reservation/merchant implication |

### My Korea B · Memory map and timeline

**목적**

- 기능 admin page가 아니라 장소·시간 기반 여행 기억으로 saved/recent/planned/contribution을 찾는다.

**첫 viewport에 보이는 것**

- compact title `My Korea`, mini-map with saved/recent pins, most recent photo-led memory cards.

**시각·인터랙션**

- source-backed venue photo 16:10 또는 4:3; 없으면 labeled category illustration.
- 빈 원형 avatar와 인접 duplicate crop을 금지한다.
- sections are timeline filters/lanes, not nested elevated cards. static content uses border/spacing only.
- synthetic people은 Table/memory context에만 허용하고 official venue evidence처럼 쓰지 않는다.

**행동**

- Primary: saved/recent/planned item open.
- Secondary: empty state `지도에서 장소 찾기`.
- Close/Back: canonical venue Back은 My Korea exact section/scroll/opener로 복귀.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | venue/media, city/time, saved state, compact official/editorial label |
| 시각화 | mini-map pins, chronological grouping, activity icon |
| 한 번 접기 | private note, receipt detail, source provenance, data scope |
| Labs/개발 문서로 이동 | fixture/ID namespace/debug state |
| 삭제 | `local preview`, repeated storage banners, admin-style feature descriptions, blank avatar |

### Decision sheet C · Remove saved place

**목적**

- 삭제 대상과 범위를 명확히 하고 다른 memories를 보존한다.

**첫 viewport에 보이는 것**

- exact venue photo/name, `저장에서만 삭제`, destructive primary와 `유지`.

**시각·인터랙션**

- content-fit Decision sheet, one destructive action; generic trash icon-only 금지.
- 삭제 success는 row collapse/morph로 나타내고 별도 celebration을 만들지 않는다.

**행동**

- Primary: `저장에서 삭제`.
- Secondary: `유지`.
- Close/Back: no mutation, opener focus restore.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 대상, saved-only scope, undo availability, destructive verb |
| 시각화 | exact card thumbnail and bookmark transition |
| 한 번 접기 | note/recent/receipt partitions |
| Labs/개발 문서로 이동 | storage record/fixture details |
| 삭제 | vague `Remove`, all-data implication, repeated privacy prose |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | current place/My Korea skeleton anchors remain; no blank page | wait/back | layout/media slots fixed |
| Empty | mini-map + one `지도에서 장소 찾기`; no large explanation wall | Explore | receipts/recent etc shown only if present |
| Failure | bookmark unfilled, inline error by control | retry | saved array unchanged, other activity untouched |
| Retry | `SAV-SAVING` in same control | wait/cancel | venue/token/context retained |
| Cancel | gate/removal closes | return to opener | save mutation 0 |
| Success | filled bookmark and saved row/pin appear | continue/open My Korea | Visit/Contribution/Meetup/stamp unchanged |
| Return | canonical place ↔ My Korea round-trip | Back/continue | city/camera/section/scroll/focus restored |
| Remove failure | row stays and destructive status appears in sheet | retry/keep | saved item and all other partitions unchanged |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| Bookmark idle→saving→saved | 120–160ms ease-out | control anchor fixed, no scale over 1.04 | immediate icon/state+live region |
| Guest→Account gate | 220–280ms sheet | venue header remains spatial anchor | instant sheet/focus |
| Save success→My Korea | 240–320ms route | optional shared venue thumbnail/pin; no white flash | immediate route+heading focus |
| My Korea item→place | city camera 280–360ms, sheet 240–280ms | canonical map instance/history; pin/venue anchor stable | `jumpTo`+instant sheet |
| Remove row | 160–200ms | row height collapses after focus moves to next heading/item | immediate removal+focus announcement |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Bookmark name | 저장 | Save | 保存 | accessible name includes venue |
| Success | 저장됨 | Saved | 保存しました | short status, not a modal |
| Account CTA | 계정 만들고 저장 | Create account and save | アカウントを作成して保存 | Account≠Save boundary still in state |
| Failure | 저장하지 못했어요 | We couldn’t save this | 保存できませんでした | retry adjacent |
| Retry | 다시 저장 | Try saving again | もう一度保存 | same venue |
| Empty CTA | 지도에서 장소 찾기 | Find a place on the map | 地図で場所を探す | value action |
| Remove title | 저장에서 삭제할까요? | Remove from saved? | 保存から削除しますか？ | exact scope |
| Remove CTA | 저장에서 삭제 | Remove from saved | 保存から削除 | destructive visible verb |

- `on-device`, `local preview`, `official records`, `admin`, `sync complete`는 normal title/CTA에 없다.
- official/editorial source label은 localized short text와 glyph로 유지한다.
- 장소 고유명만 full-name route가 있을 때 제한적으로 truncate하며 decision/CTA는 ellipsis 금지다.

## 9. Accessibility·responsive

| Viewport | 구현 규격 | 통과 기준 |
|---|---|---|
| 320×568/800 | edge 16px, one-column cards, 48px icon dock/control | bookmark, latest memory, Back/CTA reachable; no footer overlap/x-scroll |
| 360×800 | edge 16px, mini-map 128–152px | source/media/text anchors remain aligned |
| 390×844 | edge 20px canonical | mini-map + first memory in first viewport |
| 430×932 | edge 20px | larger media/map, not extra admin prose |
| 844×390 | two-column mini-map/timeline with one body scroll; phone dock stays bottom/icon-only | header, first item, Back reachable; rail does not appear automatically |

- bookmark and dock targets 48px; minimum 44px and critical gap 8px.
- screen reader announces venue-specific `저장/저장됨/저장 실패`, not icon shape.
- 200% zoom keeps source label, venue, destructive scope, retry visible without clipping.
- focus after save remains on bookmark; after removal goes to next item or section heading; Back restores opener.
- forced colors distinguish saved/unsaved/failure with fill pattern/border/text, not color alone.

## 10. 계측·완료 기준

### UX signal

- `save_requested`, `account_gate_for_save`, `save_succeeded/failed/retried`,
  `my_korea_item_opened`, `save_removed`를 venue/source kind와 기록한다.
- Account success and Save success are separate events; stamp/reputation mutation count must be 0.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] Guest save uses one `SAVE_VENUE` token and actual save occurs exactly once after Account.
- [ ] Account cancel/failure leaves bookmark unfilled and exact place context restored.
- [ ] storage failure removes false saved visual and offers retry at the same control.
- [ ] official/editorial cards share geometry/action order; editorial ID never escalates to official evidence.
- [ ] My Korea item opens canonical map/peek/detail and Back restores section/scroll/focus.
- [ ] save/remove does not mutate Visit/Contribution/Meetup/stamp/Person/Age/Payment.
- [ ] source-backed media/fallback provenance and adjacent duplicate crop audit pass.
- [ ] KO/EN/JA and 320/360/390/430/844×390, 200% zoom, reduced motion pass.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-005`, `REQ-016` | Account JIT→separate save→memory round-trip | `SCN-002-ACCOUNT-RETURN`, save/My Korea journey |
| State | `SAV-IDLE/SAV-SAVING/SAV-SAVED/SAV-FAILED`; Account independent | bookmark object morph only after save mutation | domain diff and failure snapshot |
| Fixture | `FX-SAVE-PENDING`, `FX-SAVE-SUCCESS`, `FX-SAVE-FAIL`; `FX-ACC-START`, `FX-ACC-SUCCESS`, `FX-ACC-CANCEL`, `FX-ACC-FAIL` | all terminal/retry branches retained | deterministic fixture matrix |
| returnTo | `SAVE_VENUE`, registered venueId, table forbidden | one-shot resume to exact bookmark | forged/duplicate/expiry and focus tests |
| Persistence | official/editorial saved ID allowlists in preferences; session activity partitions separate | no source escalation; remove saved only | reload/reset partition/storage tests |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | bookmark→필요 시 Account→save→memory map | success modal과 admin copy 제거, original action first |
| D2 시각·인터랙션 | bookmark morph, source-backed media, canonical spatial round-trip | mini-map/photo timeline, same official/editorial geometry |
| D3 신뢰·접근성 | Account≠Save, persistence/source/removal scope, exact focus | false saved prevention, partition-safe removal, localized semantics |

잔여 이견: `없음`.
