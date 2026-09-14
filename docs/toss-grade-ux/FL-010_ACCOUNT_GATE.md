# FL-010 · Account gate and exact action return

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-005`, `REQ-008`, `REQ-011` |
| 진입 행동 | Guest가 `SAVE_VENUE`, `JOIN_TABLE`, `OPEN_CHAT`, `SUBMIT_LOCAL_SIGNAL`, `START_CHECKOUT` 중 Account가 필요한 CTA 선택 |
| 성공 결과 | `ACC-ACTIVE`; canonical queue의 Account head만 제거하고 다음 unmet gate 또는 원 CTA를 같은 Decision sheet에서 정확히 한 번 재개 |
| 취소 결과 | Account·원 행동 mutation 0; gate 폐기 후 원 route/camera/selection/draft/scroll/opener로 복귀 |
| 실패·재시도 | `ACC-FAILED`에서 입력·미소비 token·원 context를 유지하고 같은 sheet에서 retry 또는 Guest 복귀 |
| 정확한 복귀 | allowlisted `ReturnToEnvelope`의 public IDs와 남아 있는 private in-memory context를 복원; private context가 사라졌으면 public ID의 safe surface로 mutation 0 복귀; full plan 재검증 뒤 원 mutation 직전에만 one-shot consume |
| 실행 truth | Account는 이 tab/session의 `LOCAL_ACTUAL` 방문 계정; Person·Age·Payment KYC·K-Tour credential·Presentation·Reputation이 아님 |

### 삭제할 수 없는 PRD 불변식

- `Account ≠ Person ≠ 19+ ≠ Payment KYC ≠ K-Tour credential ≠ Presentation ≠ Reputation`.
- active overlay는 한 장이며 지금 필요한 `activeGate` 하나만 보인다. 미래 gate badge·status wall·
  nested modal은 만들지 않는다.
- canonical queue는 CTA와 현재 state에서 다시 계산한다. 순서 누락·중복·변조를 허용하지 않는다.
- token은 15분, `RT-${cta}-${Date.parse(createdAt)}` 형식이며 원 CTA mutation 직전에
  정확히 한 번만 소비한다.
- invalid/expired/consumed/unregistered context는 mutation 0으로 gate를 버리고 안전한 map으로 간다.
- reload 등으로 private camera/draft/scroll context가 사라지면 exact 복귀를 가장하지
  않는다. registered public entity를 rehydrate한 safe surface로 가고 token을 지운다.
- raw proof, credential, 사진, payment instrument, PII는 URL이나 return envelope에 넣지 않는다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| `Minimum check · this tab only`, `ON-DEVICE CHECK` 같은 내부 구조가 sheet headline에 보인다 | 사용자는 하려던 행동보다 기술 설명을 먼저 해석한다 | P1 | account/action gate headers |
| `Create a local account`와 무엇을 계속하는지 분리돼 있다 | 계정이 왜 필요한지, 닫으면 어디로 가는지 불명확하다 | P1 | generic account title |
| Account·Payment 등 여러 chip과 긴 boundary가 한 화면에 있다 | 독립 gate가 하나의 setup checklist처럼 보이고 320px CTA가 잘린다 | P1 | account gate status chips/footer |
| success를 별도 결과 page처럼 보여줄 여지가 있다 | Account 성공과 Save/Join/Checkout 성공을 혼동하고 context가 끊긴다 | P0 | coordinator result states |
| 서로 다른 gate component가 같은 action에 중첩될 수 있다 | backdrop/modal stack, focus loss, back ambiguity가 생긴다 | P1 | separate account/person overlays |
| return route는 맞아도 camera/filter/sheet/draft/focus가 빠질 수 있다 | 사용자가 같은 행동을 다시 찾아야 하고 중복 mutation 위험이 있다 | P0 | partial return restoration |

## 3. 목표 경험

### 한 문장 약속

> 하려던 행동을 화면에 고정하고, 지금 필요한 계정 한 가지만 만든 뒤 그 행동을 이어간다.

### 사용자가 1초 안에 알아야 하는 것

- 어떤 장소/Table/금액/초안을 계속하기 위해 계정이 필요한지.
- 계정은 저장과 참여를 이어주는 앱 session이며 본인·19+·결제 확인이 아니다.
- `나중에`를 누르면 아무 변화 없이 정확한 원 행동으로 돌아간다.

### 사용자가 읽지 않아도 알아야 하는 것

- sheet header의 thumbnail/name/amount가 원 객체를 고정한다.
- body에는 Account icon과 한 질문만 있어 현재 unmet gate가 하나임을 보인다.
- success check page 대신 같은 CTA가 pending→ready로 바뀌고 다음 gate/body가 이어진다.
- Close 뒤 opener focus가 돌아가므로 flow 종료가 분명하다.

## 4. 권장 모바일 여정

```text
ENTRY · protected CTA on a locked venue/Table/draft/checkout
→ VALIDATE · CTA registry + public entity IDs + canonical full gate plan
→ DECISION · one Account question in one anchored Decision sheet
→ PENDING · ACC-CREATING, duplicate submit locked
→ TERMINAL · SUCCESS: ACC-ACTIVE
   → recompute full plan
   → if another gate remains: same shell, next gate body
   → if none: validate again, consume token once, mutate original CTA once
  | CANCEL: gate=null, mutation 0, exact opener return
  | ERROR: ACC-FAILED or invalid/expired/duplicate; mutation 0
→ RETRY · only ACC-FAILED keeps the unconsumed canonical envelope
→ RETURN · original object/action with only expected mutation changed
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 무엇을 계속하려는가? | venue/Table/draft/final KRW object | protected CTA | route, camera, map/list, query/filter, selected object, scroll, focus |
| Validate | 이 CTA와 context가 canonical인가? | no new screen; immediate state validation | none | public IDs, full required plan |
| Decision | 계정을 만들고 이 행동을 계속할까? | anchored action header + Account row | context-specific account CTA | same object and pending action |
| Pending | 계정을 준비 중인가? | inline spinner in primary/object | wait | token unconsumed, duplicate locked |
| Success | 다음 unmet gate가 있는가? | same shell body or original CTA morph | automatic continue | exact token/context, Account only changed |
| Cancel | 지금 멈출까? | original object remains behind sheet | 나중에 | mutation 0, opener target |
| Failure | 다시 시도할까? | InlineStatus replacing pending row | 다시 시도 / 원래 화면 | draft/token/context retained |
| Return | 같은 행동이 정확히 이어졌나? | original Save/Join/Signal/Checkout control | continue use | expected mutation only |

## 5. 화면별 상세 규격

### Decision sheet A · Account

**목적**

- Account가 필요한 이유와 정확한 복귀 대상을 한 화면에 연결한다.

**첫 viewport에 보이는 것**

- close/back 하나, original object mini-header, context-specific title, Account pictogram,
  primary 한 개, `나중에` 한 개.

**시각·인터랙션**

- content-fit Decision sheet, 최대 72dvh, radius 28px, edge 16/20px.
- object mini-header는 venue photo/name, Table/time, signal draft count 또는 merchant/final KRW 중
  해당 action에 필요한 사실만 쓴다.
- `1/4`, future gate icon trail, generic shield, large empty hero, nested card를 금지한다.
- body 16px 이상, CTA 52–56px, single internal scroll, safe-area footer padding을 쓴다.

**행동**

- Primary: `계정 만들고 저장/참여/신호 남기기/잔액 사용`처럼 원 결과를 예고한다.
- Secondary: `나중에`.
- Close/Back: Close는 gate 취소와 exact return; Back은 같은 shell의 이전 gate step이 있을 때만.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | original object/action, Account가 지금 필요한 이유, primary, escape |
| 시각화 | object anchor, Account pictogram, pending→ready state morph |
| 한 번 접기 | Account와 privacy: session 범위, identity/19+/payment와 별개 |
| Labs/개발 문서로 이동 | optional zkLogin, token schema, fixture IDs, storage key |
| 삭제 | `Minimum check`, `on-device`, 모든 gate chip, provider/architecture, generic `Continue` |

### Inline state B · Pending / failure

**목적**

- 같은 decision을 떠나지 않고 비동기 상태를 회복한다.

**첫 viewport에 보이는 것**

- 고정된 original object, 상태 한 줄, retry 또는 escape.

**시각·인터랙션**

- primary 내부 spinner와 `aria-live=polite`; 800ms 전 설명 panel을 추가하지 않는다.
- failure는 red icon만이 아니라 짧은 원인 범주와 `다시 시도` text verb를 쓴다.
- failure에서 input/object/sheet snap이 움직이지 않는다.

**행동**

- Primary: retry.
- Secondary: `원래 화면으로`.
- Close/Back: cancel semantics와 동일.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | pending/failure, next recovery, unchanged original object |
| 시각화 | spinner/status icon + static text |
| 한 번 접기 | local session storage scope |
| Labs/개발 문서로 이동 | fixture error code, token internals |
| 삭제 | raw exception, provider wall, repeated privacy paragraph |

### Shell transition C · Next gate or action resume

**목적**

- Account 결과를 최종 행동 성공으로 가장하지 않고 canonical queue를 이어간다.

**첫 viewport에 보이는 것**

- 다음 gate가 있으면 같은 header 아래 그 gate의 한 질문; 없으면 original CTA의 pending/result.

**시각·인터랙션**

- Account check를 160ms 보여준 뒤 body만 교체한다. 별도 success page/toast stack은 없다.
- original object header와 sheet geometry가 고정된다.
- final mutation 뒤 sheet가 닫히면 opener 또는 changed object로 focus한다.

**행동**

- Primary: next gate 또는 resumed action의 contract가 소유.
- Secondary: cancel and exact return.
- Close/Back: current flow cancel; already-completed Account는 독립 상태로 유지하되 original mutation은 하지 않는다.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | current unmet gate or original action result |
| 시각화 | one body swap, expected object mutation |
| 한 번 접기 | completed Account session detail |
| Labs/개발 문서로 이동 | full queue and validation diagnostics |
| 삭제 | `All checks complete`, merged verified badge, future axis checklist |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | original surface remains; sheet opens only after valid envelope | wait | no mutation, no duplicate envelope |
| Empty | N/A: valid protected action always has an object; missing object is invalid | safe map | invalid envelope discarded |
| Failure | `ACC-FAILED`, object and input unchanged | retry / Guest return | token unconsumed, original mutation 0 |
| Retry | `ACC-CREATING`, same envelope | wait/cancel | tokenId/cta/public context identical |
| Cancel | `ACC-GUEST`, `gate=null` | original action remains available | route/camera/filter/selection/draft/scroll/focus restored |
| Success | `ACC-ACTIVE`; completed queue head removed | next gate or resumed CTA | Person/Age/Payment/K-Tour/Reputation unchanged |
| Return | expected original mutation once | continue from object | no duplicate save/join/post/payment |
| Expired/invalid | no success UI; safe map focus | restart from valid CTA | envelope cleared, all protected mutations 0 |
| Private context lost | registered venue/Table 또는 safe map, no exact-return claim | restart from source action | token cleared, original mutation 0 |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| CTA→Decision sheet | 220–280ms emphasized decel | object anchor persists; backdrop/sheet same frame | 0ms, focus to title |
| Decision→Pending | 160ms standard | primary label/spinner replace in place | instant+live status |
| Account→next gate | 160–200ms standard | header/sheet fixed, body crossfade+8px | instant body+heading focus |
| Account→original action | 220–280ms | sheet dismiss and object state morph | instant dismiss+focus |
| Failure→Retry | 160ms | error row replaces status without height collapse | instant state change |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Save title | 이 장소를 저장하려면 | Save this place | この場所を保存するには | original action first |
| Table title | 이 Table에 참여하려면 | Join this Table | このTableに参加するには | Table name remains in header |
| Signal title | 이 장소에 남기려면 | Add to this place | この場所に残すには | draft context fixed |
| Checkout title | 여행 잔액을 사용하려면 | Use your travel balance | 旅行残高を使うには | venue/final KRW visible |
| Generic primary | 계정 만들고 계속 | Create account and continue | アカウントを作成して続ける | contextual verb preferred |
| Escape | 나중에 | Not now | あとで | no mutation |
| Failure | 계정을 준비하지 못했어요 | We couldn’t prepare your account | アカウントを準備できませんでした | recovery adjacent |
| Retry | 다시 시도 | Try again | もう一度試す | same token |

- `local account`, `on-device`, `minimum check`, `provider`, `verified`, `all set`은 title/CTA에 쓰지 않는다.
- Account와 다른 axes의 차이는 `계정과 개인정보` disclosure에 한 번만 둔다.
- consequence가 필요한 checkout/Table copy는 해당 Flow의 decision tier를 그대로 유지한다.

## 9. Accessibility·responsive

| Viewport | 구현 규격 | 통과 기준 |
|---|---|---|
| 320×568/800 | edge 16px, Decision content-fit≤72dvh, one scroll, sticky 52px CTA | header/object/title/primary/close reachable; footer-body overlap 0 |
| 360×800 | edge 16px | long KO/JA primary max 2 lines, no x-overflow |
| 390×844 | edge 20px canonical | original object + one question + primary in first viewport |
| 430×932 | edge 20px | extra space goes to object/media, not gate checklist |
| 844×390 | left original context/right one-scroll Decision sheet; rail off | close/title/current gate/primary reachable without nested scroll |

- focus trap/background inert/Escape/close/opener restore를 pending/failure/success/cancel마다 검증한다.
- 200% zoom에서 fixed height를 금지하고 footer bottom padding≥footer height+safe area다.
- status change is announced once via polite live region; error heading receives focus on terminal failure.
- icon-only close는 localized accessible name, 모든 consequential CTA는 visible verb를 유지한다.
- forced colors에서 active gate/pending/failure는 border+glyph+text로 구분한다.

## 10. 계측·완료 기준

### UX signal

- `protected_action_started(cta, publicObjectId)`, `account_gate_opened`, `account_succeeded`,
  `next_gate_started`, `return_token_consumed`, `exact_return_completed`를 분리한다.
- invalid/expired/duplicate/cancel/failure에는 `original_mutation_count=0`; terminal success에는 정확히 1이다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] 한 overlay, 한 current gate, 한 primary만 보이며 nested modal이 없다.
- [ ] Account success가 Person/Age/Payment/K-Tour/Reputation을 바꾸지 않는다.
- [ ] CTA별 full required plan과 public ID registry를 entry와 consume 직전에 모두 검증한다.
- [ ] cancel/fail/retry는 route/camera/map-list/query/filter/selection/sheet/scroll/draft/focus를 보존한다.
- [ ] invalid/expired/consumed token은 original mutation 0, safe map, gate clear다.
- [ ] reload/private-context loss는 exact return을 가장하지 않고 registered public object 또는 safe map으로 mutation 0 복귀한다.
- [ ] normal success는 original CTA를 정확히 한 번만 재개한다.
- [ ] visible surface에 `minimum check/on-device/status wall`이 0회다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-005`, `REQ-008`, `REQ-011` | protected action의 single Account gate + exact resume | `SCN-002-ACCOUNT-RETURN`과 trigger scenarios |
| State | `ACC-GUEST→ACC-CREATING→ACC-ACTIVE/ACC-FAILED` | Account head만 mutation; other axes independent | before/after domain diff |
| Fixture | `FX-ACC-START`, `FX-ACC-SUCCESS`, `FX-ACC-CANCEL`, `FX-ACC-FAIL` | pending/success/cancel/failure/duplicate matrix | deterministic fixture tests |
| returnTo | 7-CTA registry; Account step은 Account가 필요한 canonical plans만 | 15분, full-plan recheck, one-shot consume; private context loss는 safe public rehydrate | forged/expired/duplicate/entity hydration/context-loss tests |
| Persistence | active gate in `ondo.session.v3`; private drafts in memory | no PII/photo/payment instrument in URL/envelope | storage allowlist and reload tests |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 원 action을 고정하고 지금 필요한 한 gate만 | context-specific title, one primary, success page 삭제 |
| D2 시각·인터랙션 | single anchored sheet, body swap, object morph | fixed header geometry, content-fit sheet, exact focus transition |
| D3 신뢰·접근성 | independent axes, canonical queue, one-shot/invalid safety | full-plan double validation, mutation count, failure/recovery/a11y |

잔여 이견: `없음`.
