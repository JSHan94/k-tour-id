# FL-005 · Korean Mobile ID

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-001`, `REQ-005` |
| 진입 행동 | Account가 활성인 사용자가 Local Signal·Table처럼 Person이 필요한 행동을 누르거나 ID 화면에서 Mobile ID 방법을 명시적으로 연다. |
| 성공 결과 | explicit QA/review fixture에서만 Mobile ID 결과를 검증해 Person 축을 `PER-VERIFIED`로 바꾸고 보존된 원 CTA의 다음 gate 또는 원 행동을 재개한다. |
| 취소 결과 | `ACC-ACTIVE`와 discovery/Table/draft는 유지하고 Person은 verified로 올리지 않은 채 원 행동으로 돌아간다. |
| 실패·재시도 | 정적 provider 미구성, denied, invalid callback, timeout, transient failure, expiry를 구분한다. `NOT_CONFIGURED`에는 의미 없는 Retry를 노출하지 않고 다른 방법/나중에를, 연결된 provider의 일시 실패에만 같은 anchored sheet Retry를 제공한다. |
| 정확한 복귀 | Person이 필요했던 기존 `SUBMIT_LOCAL_SIGNAL` 또는 `JOIN_TABLE` token을 유지한다. venueId/tableId, city/camera, draft/media, detail section/scroll, sheet snap, opener focus를 복원한다. 명시적 ID 진입은 같은 ID status row로 돌아간다. |
| 실행 truth | current B normal public route의 provider 미구성은 `executionTruth=NOT_CONFIGURED`, `PER-UNVERIFIED` 유지다. `FX-PER-CX-SUCCESS`는 명시적 review mode의 `SIMULATED` provenance이며 실제 OmniOne callback·정부 신분증·공식 VC 발급을 뜻하지 않는다. |

### 삭제할 수 없는 PRD 불변식

- onboarding의 `내 주변 탐색`/한국 로컬 preference는 nationality나 `PER-VERIFIED`가 아니며 Mobile ID를 자동 호출하지 않는다.
- Account≠Person≠Age≠Payment KYC≠K-Tour credential≠Presentation; Mobile ID 성공은 Person만 바꾼다.
- requester, purpose, requested predicate, sharing scope, unavailable/failure/recovery는 decision 정보로 보인다.
- provider name/adapter/DID·VC/callback 구조는 한 번 접지만 provider 미연결 consequence를 숨기지 않는다.
- K-Tour setup은 `Choose → Check → Add`; 특정 requester에게 `Present`하는 행동은 별도 consent/result이며 이 setup stepper에 넣지 않는다.
- raw Mobile ID 값, 국적, 생년월일, credential, provider response는 URL, returnTo, localStorage에 저장하지 않는다.
- success 직전 full gate plan을 다시 검사하고 token을 정확히 한 번 소비한다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| `ON-DEVICE`, 1–4 stepper, provider·법적 disclaimer가 한 화면에 겹친다. | 무엇을 지금 결정해야 하는지 보이지 않고 기술 demo로 느껴진다. | P1 | Mobile ID setup sheet |
| Person 요청인데 `Present`까지 setup 단계로 보인다. | 자격 준비와 실제 정보 공유를 한 번 동의한 것으로 오인한다. | P0 | K-Tour setup/presentation 혼재 |
| 원 Local Signal/Table object가 gate에서 사라진다. | 왜 Mobile ID가 필요한지와 돌아갈 행동을 잊는다. | P1 | Person gate entry/return |
| provider 미연결인데 verified/issued 성공처럼 보일 수 있다. | 실제 신원 확인과 K-Tour credential이 발급됐다고 오인한다. | P0 | normal `NOT_CONFIGURED` |
| Mobile ID 성공이 Age/Payment/Account까지 check 처리될 수 있다. | 필요한 독립 gate를 우회한다. | P0 | status checklist |
| 320px/short landscape에서 logo/title/CTA가 커서 잘린다. | close·primary·escape에 도달하기 어렵다. | P1 | full/decision sheet |

## 3. 목표 경험

### 한 문장 약속

> 사용자가 고른 행동을 화면에 고정하고, 그 행동에 필요한 Person 확인만 요청한 뒤 같은 지점으로 돌아간다.

### 사용자가 1초 안에 알아야 하는 것

- 어떤 Local Signal/Table 행동을 위해 한 사람 확인이 필요한지.
- 무엇을 확인하고 누구에게 어떤 범위가 공유되는지.
- 현재 Mobile ID를 실제로 연결할 수 있는지와 가장 가까운 대안.

### 사용자가 읽지 않아도 알아야 하는 것

- 원 행동의 media/title이 sheet header에 고정되고 현재 필요한 Person glyph만 보인다.
- 다른 verification 축과 4단계 status wall이 없어 이번 결정 범위를 안다.
- normal unavailable은 checkmark 없이 끝나고, review fixture success는 same object가 verified state로 바뀐다.
- setup completion과 later presentation은 서로 다른 action/receipt로 보인다.

## 4. 권장 모바일 여정

```text
ENTRY: Person-required Local Signal/Table 또는 explicit ID action
→ ACCOUNT: 이미 ACC-ACTIVE; 아니면 FL-010이 먼저 처리
→ DECISION: original object + requester/purpose/Person predicate/scope
→ CHOOSE: Mobile ID
→ NORMAL: NOT_CONFIGURED → unavailable → other method | not now
→ REVIEW FIXTURE: PER-PENDING
   → PER-VERIFIED | PER-FAILED | PER-EXPIRED | CANCEL
→ TERMINAL
→ RETURN: next unmet gate 또는 exact original CTA, one-shot
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 이 행동을 위해 Person 확인을 할까? | 원 venue/Table/draft anchor+Person glyph | `확인 방법 보기` | token, object, draft, focus |
| Choose | Mobile ID로 확인할까? | K-Tour ID context+method row | `Mobile ID 선택` | current action header |
| Consent | 이 요청자에게 이 결과를 공유할까? | requester→predicate→scope | `동의하고 확인` | consent draft, exact return |
| Unavailable | 지금 연결할 수 없으면 무엇을 할까? | unavailable method state | 다른 방법/나중에 | Person/other axes 불변 |
| Pending | Person 확인만 진행 중인가? | one-axis progress | 닫기 | `PER-PENDING`, token 미소비 |
| Result | 무엇이 확인됐나? | Person result+expiry/provenance | 원 행동 계속 | only Person mutation |
| Return | 원 객체와 CTA인가? | same Local Signal/Table object | auto resume/continue | draft/camera/scroll/focus |

## 5. 화면별 상세 규격

### Sheet A · Person gate anchor

**목적**

- 사용자의 원 행동과 Person 필요 이유를 한 화면 한 결정으로 연결한다.

**첫 viewport에 보이는 것**

- compact original object(media/name/action), Person glyph, purpose 한 줄, primary, `나중에`.
- Account는 이미 충족된 context일 뿐 성공 badge로 반복하지 않는다.

**시각·인터랙션**

- shared Decision sheet≤72dvh; header는 original object와 close만 유지한다.
- 미래 Age/Payment/Presentation를 stepper/badge로 노출하지 않는다.
- K-Tour logo는 identity context에 원본 비율로만 쓰고 hero를 점유하지 않는다.

**행동**

- Primary: `확인 방법 보기`.
- Secondary: `나중에`.
- Close/Back: exact original object, mutation 0.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 원 행동, Person 필요 목적, requester가 있으면 requester, escape |
| 시각화 | object anchor, single Person axis, preserved-action cue |
| 한 번 접기 | K-Tour ID가 정부 ID가 아닌 범위, 저장 기간 |
| Labs/개발 문서로 이동 | gate queue, token/adapter/state diagnostics |
| 삭제 | `minimum check`, `ON-DEVICE`, 1–4 status wall, 미래 gate check, 긴 architecture copy |

### Sheet B · Method and consent

**목적**

- Mobile ID 방법을 선택하고 requester·purpose·predicate·sharing scope를 동의받는다.

**첫 viewport에 보이는 것**

- `Mobile ID` method row, availability, requester/purpose, `한 사람 확인 결과만 공유`, primary/other method.
- normal provider가 없으면 선택 전에 unavailable을 알린다.

**시각·인터랙션**

- method row는 48px+ target; provider명 `OmniOne CX`는 `자세히`에 둔다.
- consent는 icon-only가 아니며 sharing scope와 거절 경로를 텍스트로 유지한다.
- K-Tour preparation이 필요한 기존 surface에서는 `Choose→Check→Add`만 표시하고 `Present`는 넣지 않는다.

**행동**

- Primary: available/review mode에서 `동의하고 확인`; normal unavailable은 `다른 방법`.
- Secondary: `나중에`/`자세히`.
- Close/Back: previous gate body, same header.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | method availability, requester, purpose, predicate, sharing scope, decline |
| 시각화 | phone credential glyph, requester→predicate relation, selected method |
| 한 번 접기 | OmniOne/provider name, expiry/storage, K-Tour scope |
| Labs/개발 문서로 이동 | DID/VC/OpenID callback, raw schema, fixture control |
| 삭제 | provider logo wall, legal-status claims, `Present` setup step, repeated optional/maker copy |

### Sheet C · Unavailable/Pending/Result

**목적**

- ordinary unavailable과 review fixture를 분리하고 Person 외 다른 상태를 바꾸지 않는다.

**첫 viewport에 보이는 것**

- normal: `지금은 Mobile ID를 연결할 수 없어요`, `다른 방법`, `나중에`.
- review fixture: visible review scope, pending 또는 result, expiry, `외부 확인 없음`.
- failure/expired: 정확한 status, Retry와 alternate.

**시각·인터랙션**

- normal `NOT_CONFIGURED`는 `PER-UNVERIFIED` 유지, verified seal/issued card 금지.
- `FX-PER-CX-PENDING`, `FX-PER-CX-SUCCESS`, `FX-PER-CX-FAIL`, `FX-PER-CX-EXPIRED`만 각각 `PER-PENDING`, `PER-VERIFIED`, `PER-FAILED`, `PER-EXPIRED` 전이를 만든다.
- success는 original object 옆 Person state morph로 보이고 Age/Payment/K-Tour/Account badge를 추가하지 않는다.

**행동**

- Primary: unavailable=`다른 방법`, pending=없음, success=`원래 행동 계속`, failure=`다시 확인`.
- Secondary: `나중에`.
- Close/Back: same original action, no false mutation.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | unavailable/failure/expiry, recovery, review fixture external-service scope |
| 시각화 | one-axis pending/result/error, Person-only delta |
| 한 번 접기 | provider/provenance, expiry timestamp, result reference |
| Labs/개발 문서로 이동 | raw callback/fixture response, adapter logs |
| 삭제 | normal success fixture badge, official verified/issued claim, generic celebration, all-axis checklist |

### Screen D · Exact action return

**목적**

- 성공·취소·실패 뒤 원 Local Signal/Table/ID context를 손실 없이 복원한다.

**첫 viewport에 보이는 것**

- 원 object, preserved draft/media/facts, 같은 primary CTA와 updated Person requirement state.
- success는 다음 unmet gate 또는 원 CTA를 한 번 재개; cancel/failure는 사용자가 다시 선택한다.

**시각·인터랙션**

- valid token은 full plan을 재검증하고 원 action mutation 직전에만 소비한다.
- expired/forged/duplicate/registry mismatch는 gate를 버리고 toast 없이 안전한 map으로 간다.
- direct ID entry는 ID status row로 복귀하고 다른 feature를 자동 실행하지 않는다.

**행동**

- Primary: success auto-resume 또는 `계속`; failure/cancel은 original action/Retry.
- Secondary: 장소/Table로 돌아가기.
- Close/Back: stored public history/focus.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | original object/action, Person state, next available action |
| 시각화 | restored draft/selection, satisfied current gate only |
| 한 번 접기 | Person result details |
| Labs/개발 문서로 이동 | token/provenance diagnostics |
| 삭제 | generic K-Tour home redirect, success page, repeated provider copy |

### Screen E · K-Tour preparation versus contextual presentation

**목적**

- 기존 K-Tour ID 준비 UI를 삭제하지 않되 `Choose → Check → Add`와 실제 요청자에게 결과를 제시하는 `Present`를 서로 다른 consent·result로 구현한다. 이 구분은 새 Flow ID나 Person 통합 state를 만들지 않는다.

**첫 viewport에 보이는 것**

- 준비: 선택한 방법, 현재 availability, `확인`, `내 K-Tour ID에 추가`의 세 단계 중 현재 하나와 `나중에`.
- 제시: 실제 requester, purpose, requested predicate, sharing scope, `공유`와 `거절`.
- normal provider 미연결이면 성공 seal 대신 unavailable과 원 행동 복귀.

**시각·인터랙션**

- setup progress는 `Choose → Check → Add`만 가진다. `Present`를 네 번째 점·future badge로 넣지 않는다.
- normal public route는 Check/Add를 완료·발급 상태로 만들지 않는다. explicit review mode만 internal Add 단계를 실행해 private `여행 패스 초안`을 `외부 발급 없음` provenance와 함께 저장할 수 있으며, visible result를 `발급`·`추가 완료` 또는 official DID/VC로 표현하지 않는다.
- Present는 requester가 있는 protected action에서만 열린다. 준비된 review artifact가 있어도 매번 action-specific scope를 다시 동의받고 거절 시 공유 receipt를 만들지 않는다.
- Present result는 `무엇을 누구에게 어떤 목적으로 공유했는지`의 최소 local review receipt만 보여주며 원 credential/raw ID를 노출하지 않는다.

**행동**

- Primary: setup=`확인 계속`/review Add 단계의 `여행 패스 초안 저장`; presentation=`이 결과 공유`.
- Secondary: `나중에`/`공유하지 않기`.
- Close/Back: setup은 ID status row, Present는 정확한 requester action과 opener focus로 mutation 없이 복귀.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 현재 setup 단계 또는 Present requester/purpose/predicate/scope, availability, decline, result truth |
| 시각화 | 세 단계 중 현재 한 단계, private artifact glyph, requester→predicate relation |
| 한 번 접기 | issuer/provider, expiry, retention, review provenance, local receipt detail |
| Labs/개발 문서로 이동 | DID/VC payload, callback schema, fixture selector, adapter logs |
| 삭제 | setup의 `Present` 4단계, requester 없는 share CTA, normal issued/added success, 전체 credential 공개, all-axis verified badge |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Initial | `PER-UNVERIFIED/FAILED/EXPIRED` at Person-required action | 방법 보기/나중에 | `ACC-ACTIVE`; other axes 불변 |
| Normal unavailable | method row unavailable, no seal | 다른 방법/나중에 | `truth=NOT_CONFIGURED`; 재시도해도 달라질 설정이 없고 Person/action 불변 |
| Pending | `PER-PENDING`, one-axis progress | 닫기 | `FX-PER-CX-PENDING`; token 미소비 |
| Failure | `PER-FAILED`+reason | Retry/alternate | `FX-PER-CX-FAIL`; draft/context 유지 |
| Expired | `PER-EXPIRED` | 다시 확인/alternate | `FX-PER-CX-EXPIRED`; original action 미실행 |
| Cancel | `PER-UNVERIFIED`, sheet close | original action/탐색 | `FX-PER-CX-CANCEL`; gate terminal, no mutation |
| Review success | `PER-VERIFIED`+expiry+fixture provenance | next gate/original action | `FX-PER-CX-SUCCESS`; only Person/identity reference derived |
| Setup unavailable | Check/Add unavailable, no issued seal | 나중에, 다른 방법 | Person과 K-Tour artifact 모두 불변 |
| Review setup result | `여행 패스 초안` + `외부 발급 없음` | ID status로 복귀, 필요 시 later Present | internal Add event만 완료; official credential/other axes 불변 |
| Present unavailable/cancel | requester action + no-share result | 원 행동 복귀 | presentation receipt 0, prepared artifact 불변 |
| Review Present result | requester/purpose/predicate/scope의 최소 local receipt | exact requester action | raw credential/ID 0, other axes 불변 |
| Return | full plan next gate or CTA | continue | token same through partial gates, consume once before mutation |
| Invalid return | safe map surface | 탐색 | token 삭제, PII 없음, toast/Labs fallback 없음 |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| action→Person sheet | 220–280ms emphasized decel | original object header 고정 | 즉시 sheet+focus |
| method/consent swap | 160–200ms standard | same shell/body only | 즉시 body |
| pending→result | 220–320ms | Person glyph/state morph, logo/hero scale animation 없음 | static state+live region |
| result→original action | 220–320ms route/sheet | camera/object/draft anchor 유지 | 즉시 exact context |
| cancel/fail return | 160–220ms | opener focus restore, backdrop/surface 동시 | 즉시 복원 |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Gate title | 한 사람 확인 | Confirm one person | 一人であることを確認 | `Connect Mobile ID`보다 목적 우선 |
| Method | Mobile ID | Mobile ID | モバイルID | provider명은 detail |
| Purpose | 이 행동을 이어가기 위해 필요해요 | Needed to continue this action | この操作を続けるために必要です | original object 함께 |
| Scope | 한 사람이라는 결과만 공유해요 | Share only the one-person result | 一人であるという結果だけを共有します | consent 전 visible |
| Primary CTA | 동의하고 확인 | Agree and confirm | 同意して確認 | consequence 명확 |
| Unavailable | 지금은 Mobile ID를 연결할 수 없어요 | Mobile ID is unavailable right now | 現在モバイルIDを利用できません | provider blame 금지 |
| Alternate | 다른 방법 | Choose another method | 別の方法を選ぶ | same sheet |
| Retry | 다시 확인 | Try again | もう一度確認 | draft 유지 |
| Return | 원래 행동 계속 | Continue your original action | 元の操作を続ける | object-specific accessible label 권장 |
| Review draft save | 여행 패스 초안 저장 | Save travel pass draft | 旅行パスの下書きを保存 | internal Add 단계의 소비자 문구; external issuer·official issuance 주장 금지 |
| Present title | 이 결과를 공유할까요? | Share this result? | この結果を共有しますか？ | requester와 purpose 바로 아래 표시 |
| Present primary | 이 결과 공유 | Share this result | この結果を共有 | predicate 최소 범위 |
| Present decline | 공유하지 않기 | Don’t share | 共有しない | 원 action으로 no mutation 복귀 |
| Review result truth | 검토용 결과 · 외부 발급·공유 없음 | Review result · no external issuance or sharing | 検証用の結果・外部での発行や共有なし | setup/present result에 맞게 범위 표시 |

- normal title/CTA에 `ON-DEVICE`, `preview`, `simulated`, `test`, provider/architecture를 쓰지 않는다.
- explicit review mode의 결과에는 `검토용 결과 · 외부 서비스 확인 없음`을 지역화해 반드시 표시한다.

## 9. Accessibility·responsive

- 320×568/800, 360×800 edge 16px; 390×844, 430×932 edge 20px; horizontal overflow 0.
- 844×390은 compact object header+한 internal scroll+sticky primary/escape; desktop rail·이중 scroll 없음.
- close/back, method row, primary, alternate는 최소 44px; default 48px, primary 52–56px, critical gap 8px.
- 200% zoom에서 logo는 축소/접힘 가능하지만 original object, requester/purpose/scope, unavailable, primary/escape는 모두 도달 가능하다.
- dialog focus trap/background inert/Escape, result/cancel/failure 뒤 exact opener focus restore를 검증한다.
- contextual Present는 requester→purpose→predicate/scope→공유→공유하지 않기 순으로 읽고, 거절·결과 뒤 해당 requester action opener에 focus를 복원한다.
- glyph만으로 verified/unavailable/failure를 말하지 않고 localized label+screen-reader status를 둔다.
- pending/result는 polite live region, error heading은 focusable; raw provider error를 announce하지 않는다.
- KO/EN/JA decision copy는 ellipsis 금지, CTA 2줄 허용, forced colors에서 selected/result를 border+glyph+text로 구분한다.

## 10. 계측·완료 기준

### UX signal

- Person gate entry source(Local Signal/Table/direct ID), normal unavailable recovery, review fixture outcome, exact return을 분리 계측한다.
- success/cancel/fail/expire마다 Account/Person/Age/Payment/K-Tour/Presentation mutation diff와 context hash를 기록한다.
- maker-language visibility와 first-viewport object/CTA clipping을 locale×viewport로 검사한다.
- setup `Choose/Check/Add`와 Present consent/result event가 분리됐는지, no-share와 unavailable에서 presentation receipt가 0인지 검사한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] onboarding preference만으로 Mobile ID를 시작하거나 Person/Nationality를 추론하지 않는다.
- [ ] 원 Local Signal/Table object, purpose, requester/predicate/scope가 gate에서 유지된다.
- [ ] normal `NOT_CONFIGURED`는 `PER-VERIFIED`/credential added/issued를 만들지 않는다.
- [ ] explicit review fixture만 provenance와 함께 `PER-*` success/fail/cancel/expire를 재현한다.
- [ ] 성공은 Person만 바꾸고 Account/Age/Payment/K-Tour/Presentation을 완료 처리하지 않는다.
- [ ] K-Tour setup `Choose→Check→Add`와 contextual `Present`가 별도 consent/result다.
- [ ] setup progress에는 Present가 없고, requester 없는 화면에서 share CTA가 나타나지 않는다.
- [ ] normal provider unavailable은 K-Tour artifact를 added/issued로 만들지 않으며, explicit review의 internal Add 결과도 visible `여행 패스 초안`과 외부 발급·공유 없음 provenance로만 표현한다.
- [ ] 정적 `NOT_CONFIGURED`에는 무의미한 Retry가 없고, 연결된 provider의 일시 실패에서만 같은 anchored action Retry를 제공한다.
- [ ] Present 거절/unavailable은 공유 receipt 0이고 exact requester action/focus로 복귀한다.
- [ ] valid `SUBMIT_LOCAL_SIGNAL/JOIN_TABLE` token만 full-plan 재검증 후 one-shot 소비한다.
- [ ] cancel/failure/expiry/invalid return에서 draft/camera/selection/scroll/focus와 other axes가 보존된다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, keyboard, SR, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-001`, `REQ-005` | Korean Mobile ID route와 Account/verification 분리 유지 | requirement reachability |
| State | `PER-UNVERIFIED/PENDING/VERIFIED/FAILED/EXPIRED`, `ACC-ACTIVE`; K-Tour setup/Presentation은 별도 UI 사건 | one anchored Person sheet, `Choose/Check/Add`, requester-specific Present, exact return | state+event mutation whitelist |
| Fixture | `FX-PER-CX-PENDING`, `FX-PER-CX-SUCCESS`, `FX-PER-CX-CANCEL`, `FX-PER-CX-FAIL`, `FX-PER-CX-EXPIRED` | explicit QA/review mode, `SIMULATED` provenance | normal-vs-fixture E2E |
| returnTo | existing `SUBMIT_LOCAL_SIGNAL` 또는 `JOIN_TABLE`; direct ID history | envelope에는 allowlisted public venueId/tableId만; draft/media는 token 밖 app memory, camera/section/scroll/focus는 navigation context로 복원 | one-shot/TTL/forgery/duplicate/privacy tests |
| Persistence | non-sensitive Person status/adapter/expiry/provenance는 demo session | raw ID/DOB/nationality/credential/provider response 금지 | storage allowlist audit |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 원 행동에 붙은 Person 한 결정, provider/maker prose 접기 | one object/one gate/one primary, generic setup page 제거 |
| D2 시각·인터랙션 | shared Decision shell, K-Tour brand 제한, setup/presentation 분리 | object header 고정, body swap, `Choose→Check→Add`, no Present step |
| D3 신뢰·접근성 | requester/purpose/scope 가시화, normal fail-closed, axes 독립 | `NOT_CONFIGURED` no-success, review provenance, Person-only mutation |

잔여 이견: `없음`. providerless local success를 normal route에서 허용하는 안은 최종 resolution에 따라 기각했다.
