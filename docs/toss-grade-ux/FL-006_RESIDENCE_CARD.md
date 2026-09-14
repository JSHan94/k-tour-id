# FL-006 · Residence Card

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-002`, `REQ-003`, `REQ-005` |
| 진입 행동 | Account가 활성인 사용자가 Person이 필요한 Local Signal·Table 행동에서 Residence Card 방법을 고르거나 ID 화면에서 명시적으로 연다. |
| 성공 결과 | explicit QA/review의 supported fixture에서만 Person을 `PER-VERIFIED`로 바꾸고 같은 원 CTA의 다음 gate 또는 행동을 재개한다. |
| 취소 결과 | Account와 원 discovery/Table/draft를 유지하고 Person/other axes를 바꾸지 않은 채 원 행동으로 돌아간다. |
| 실패·재시도 | `NOT_CONFIGURED`, supported/unsupported, outage/failure, denied/cancel을 구분한다. Residence를 사용할 수 없으면 같은 sheet의 provider-neutral Passport alternate로 전환하거나 나중에 한다. |
| 정확한 복귀 | 기존 `SUBMIT_LOCAL_SIGNAL` 또는 `JOIN_TABLE` token을 method 전환 중에도 유지한다. envelope에는 allowlisted public venueId/tableId만 두고 city/camera, section/scroll, sheet snap, opener focus를 복원한다. 원 Local Signal/Table draft/media는 token 밖의 app memory에만 둔다. |
| 실행 truth | method 선택은 nationality·visa·legal residence를 증명하지 않는다. normal provider 미구성은 `executionTruth=NOT_CONFIGURED`, Person 불변; supported/unsupported/passport success fixture는 explicit review mode의 비개인 redacted sample로만 `SIMULATED` provenance를 실행하며 실제 사용자 문서·얼굴을 수집하지 않는다. |

### 삭제할 수 없는 PRD 불변식

- `REQ-002`의 Residence 지원/미지원/대체 verification 분기와 `REQ-003`의 Passport Person 경로를 모두 남긴다.
- onboarding의 `한국에서 생활` preference는 Residence Card 보유·법적 체류·국적·Person state가 아니다.
- availability를 선택 전에 보여주고, unsupported는 사용자 잘못이 아니며 탐색과 Account를 막지 않는다.
- Residence→Passport alternate는 같은 Person gate와 최종 returnTo를 유지하며 새 home/modal stack으로 보내지 않는다.
- 성공은 Person만 바꾸고 Age·Payment KYC·Account·K-Tour credential·Presentation를 자동 완료하지 않는다.
- raw 카드/여권 번호, 국적, DOB, document/face image, credential, provider response는 URL, returnTo, localStorage에 저장하지 않는다.
- 현재 public/review frontend는 camera·file picker로 실제 사용자 카드·여권·얼굴을 받지 않는다. 향후 live provider가 연결되기 전까지 sample fixture만 사용한다.
- K-Tour setup `Choose→Check→Add`와 later `Present`를 분리한다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| `Korean Mobile Residence Card · OmniOne CX` 같은 provider 설명이 사용자 방법보다 크다. | 본인이 선택할 수 있는 방법과 결과를 이해하기 어렵다. | P1 | method list |
| availability를 누른 뒤에야 알거나 미연결을 unsupported와 합칠 수 있다. | 불가능한 경로에 시간을 쓰고 본인 문서가 잘못됐다고 느낀다. | P1 | preflight/unavailable |
| unsupported 뒤 Passport가 다른 route/modal을 열어 원 draft를 잃을 수 있다. | 동일 Person 확인을 처음부터 다시 한다. | P1 | alternate handoff |
| provider 미연결 또는 fixture가 공식 Residence verification 성공처럼 보일 수 있다. | 법적 체류·국적·신원 확인이 끝났다고 오인한다. | P0 | normal `NOT_CONFIGURED`/review success |
| Residence 성공이 Age/Payment/K-Tour까지 check 처리될 수 있다. | 독립 gate를 우회하고 과도한 정보를 공유한다. | P0 | result/status wall |
| document/face capture를 큰 hero와 fixed footer로 구성하면 320/landscape에서 잘린다. | consent, retry, close에 도달하지 못한다. | P1 | Passport alternate full task |

## 3. 목표 경험

### 한 문장 약속

> 원 행동을 그대로 둔 채 사용할 수 있는 Person 확인 방법을 먼저 보여주고, Residence가 어렵다면 같은 자리에서 Passport로 바꾼다.

### 사용자가 1초 안에 알아야 하는 것

- 지금 Person 확인이 필요한 원 행동과 공유 결과.
- Residence Card 방법을 현재 사용할 수 있는지.
- 사용할 수 없을 때 Passport 또는 나중에라는 대안.

### 사용자가 읽지 않아도 알아야 하는 것

- original object가 header에 고정되고 method row의 상태가 available/unavailable/selected로 바뀐다.
- Residence와 Passport가 같은 Person axis 안의 대안이라 sheet와 progress context가 유지된다.
- normal unavailable에는 success seal이 없고, review result도 Person 외 다른 축을 표시하지 않는다.
- 법적 지위·국적 flag·`foreigner` badge가 없어 분류가 아니라 방법 선택임을 안다.

## 4. 권장 모바일 여정

```text
ENTRY: Person-required Local Signal/Table 또는 explicit ID action
→ ACCOUNT: 이미 ACC-ACTIVE; 아니면 FL-010 선행
→ DECISION: original object + requester/purpose/Person predicate/scope
→ METHOD PREFLIGHT: Residence availability
   ├─ NORMAL NOT_CONFIGURED → Passport alternate | not now
   ├─ REVIEW UNSUPPORTED → PER-UNSUPPORTED → Passport alternate
   └─ REVIEW SUPPORTED → consent → PER-PENDING
        → PER-VERIFIED | PER-FAILED | CANCEL
→ PASSPORT ALTERNATE: consent → review fixture result 또는 normal unavailable
→ TERMINAL
→ RETURN: same token, next gate 또는 exact original CTA
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | Person 확인을 할까? | original venue/Table/draft+Person glyph | `확인 방법 보기` | token/object/draft/focus |
| Method | 어떤 방법을 지금 사용할 수 있나? | Residence/Passport ActionRows+availability | 방법 선택 | same sheet/header |
| Consent | 이 결과를 공유할까? | requester→predicate→scope | `동의하고 확인` | selected adapter, return token |
| Unavailable | Residence 대신 무엇을 할까? | unavailable row+Passport alternate | `Passport로 확인` | all original context |
| Sample review | 준비된 예시로 확인 단계를 볼까? | Full task redacted sample frame, no user portrait | 계속/뒤로 | sample asset reference only |
| Result | Person 결과만 바뀌었나? | one-axis status+expiry/provenance | 원 행동 계속 | other axes invariant |
| Return | 같은 객체와 draft인가? | original action restored | auto resume/continue | exact context/token |

## 5. 화면별 상세 규격

### Sheet A · Person methods and preflight

**목적**

- 원 행동을 고정하고 Residence 지원 가능성을 선택 전에 보여준다.

**첫 viewport에 보이는 것**

- compact original object, Person purpose/scope, Residence Card와 Passport method rows, 각 availability, primary/`나중에`.
- normal provider가 미구성이면 Residence row는 success-looking selection 없이 `현재 이용할 수 없음`; Passport availability도 독립적으로 표시한다.

**시각·인터랙션**

- shared Decision≤72dvh; 한 active overlay, row≥48px, selected는 border+check+label.
- 국기·법적 status badge·외모 이미지를 사용하지 않는다.
- provider/`OmniOne CX`는 `자세히`로 접고 user-facing method가 먼저다.

**행동**

- Primary: 가능한/review method 선택; Residence unavailable이면 `Passport로 확인`.
- Secondary: `나중에`/`자세히`; Retry는 연결된 provider의 일시 실패에만 보인다.
- Close/Back: exact original action, no mutation.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | original action, Person purpose/scope, method availability, Passport alternate, escape |
| 시각화 | method glyph, available/unavailable/selected state, one Person axis |
| 한 번 접기 | provider name, support basis, expiry/storage policy |
| Labs/개발 문서로 이동 | adapter/fixture/callback/DID schema diagnostics |
| 삭제 | `foreign resident` classification headline, nationality flag, provider logo wall, 모든 gate status, `ON-DEVICE` |

### Sheet B · Residence consent and result

**목적**

- supported review path에서 requester·purpose·predicate·scope를 동의받고 Person만 갱신한다.

**첫 viewport에 보이는 것**

- selected Residence method, requester/purpose, `한 사람 확인 결과만 공유`, primary, alternate/decline.
- normal unavailable 또는 review pending/success/failure/unsupported가 서로 다른 status object로 보인다.

**시각·인터랙션**

- normal `NOT_CONFIGURED`는 `PER-UNVERIFIED`를 유지하고 verified/issued seal을 쓰지 않는다.
- `FX-PER-RESIDENCE-UNSUPPORTED`만 `PER-UNSUPPORTED`, supported review success만 `PER-VERIFIED`를 만든다.
- review result에는 외부 서비스 연결 없음·session scope가 보이고 raw details는 접는다.

**행동**

- Primary: supported review=`동의하고 확인`, unsupported/unavailable=`Passport로 확인`, fail=`다시 확인`.
- Secondary: `나중에`.
- Close/Back: methods sheet, same header/token.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | requester/purpose/predicate/scope, availability/result, recovery, review fixture scope |
| 시각화 | Person-only pending/result/unsupported state |
| 한 번 접기 | provider/provenance, observedAt/expiry, result reference |
| Labs/개발 문서로 이동 | raw callback/fixture response, adapter internals |
| 삭제 | 법적 체류 확인 문구, government ID claim, all-axis checks, generic celebration |

### Full task C · Passport alternate

**목적**

- Residence가 unavailable/unsupported일 때 같은 Person gate에서 Passport 경로를 선택·동의·실행한다.

**첫 viewport에 보이는 것**

- original action compact header, Passport method, 필요한 입력 단계와 consent, back/exit.
- capture가 실제 연결되지 않은 normal route라면 시작 전에 unavailable과 다른 recovery를 보인다.
- explicit review fixture에서만 OCR/NFC/face/liveness 단계를 bundled redacted sample frame으로 재현하고 외부 확인 없음 범위를 유지한다. 실제 camera/file input은 렌더하지 않는다.

**시각·인터랙션**

- Full task 100dvh, 한 scroll; document frame은 실제 사람 이미지/완료 증거를 장식으로 사용하지 않는다.
- current public/review route에는 raw capture 자체가 없다. sample fixture는 비개인 asset ID만 memory에 두고 URL/returnTo/persistent storage에 문서·얼굴 data를 넣지 않는다.
- future live provider contract에서만 camera/file permission을 직전 목적·retention과 함께 요청할 수 있으며, provider SDK 밖 raw media를 app state나 browser persistence에 쓰지 않는다.
- alternate 전환 중 tokenId와 final CTA는 그대로, adapter만 residence→passport로 바뀐다.

**행동**

- Primary: review path=`Passport 확인 계속`; normal unavailable=`원래 행동으로 돌아가기`.
- Secondary: `Residence 방법으로 돌아가기`/나중에.
- Close/Back: same methods sheet or exact original action.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | Passport method, consent, sample-step status/failure, return/retry |
| 시각화 | document frame, step-local progress, retry at failed step |
| 한 번 접기 | OCR/NFC/face/liveness provider detail, retention policy |
| Labs/개발 문서로 이동 | raw fixture controls, adapter schema/callback logs |
| 삭제 | 실제 사용자 camera/file input, synthetic identity portrait, nationality inference, official eKYC success on normal route, repeated technical paragraphs |

### Screen D · Exact action return

**목적**

- Residence 또는 Passport review success 뒤 Person만 갱신하고 원 action을 한 번 재개한다.

**첫 viewport에 보이는 것**

- 같은 venue/Table/draft와 original CTA; current Person requirement가 충족됐거나 그대로임을 object state로 표현.
- remaining gate가 있으면 같은 shell body가 다음 축으로 바뀌고, 없으면 원 CTA를 재개한다.

**시각·인터랙션**

- success 직전 full plan과 table↔venue pair를 재검증하고 token을 one-shot 소비한다.
- cancel/fail/unavailable은 token terminal 규칙에 따라 원 object로 돌아가며 action mutation 0.
- expired/forged/duplicate/mismatch는 safe map, no toast, no Labs fallback.

**행동**

- Primary: success=`원래 행동 계속`; unavailable/failure=`다른 방법` 또는 original action.
- Secondary: 장소/Table로 돌아가기.
- Close/Back: exact stored history/focus.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | original object/action, Person result, next action/recovery |
| 시각화 | restored draft/selection, current gate-only status |
| 한 번 접기 | result provenance/expiry |
| Labs/개발 문서로 이동 | return token/adapter diagnostics |
| 삭제 | generic ID home redirect, `verified foreign resident`, repeated provider/maker copy |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Initial | `PER-UNVERIFIED/FAILED`, methods preflight | Residence/Passport/나중에 | Account active, other axes unchanged |
| Normal unavailable | method unavailable, no success seal | alternate/나중에 | `truth=NOT_CONFIGURED`; 재시도해도 달라질 설정이 없고 Person/action/draft unchanged |
| Residence pending | `PER-PENDING`, adapter=residence | 닫기 | `FX-PER-RESIDENCE-PENDING`; token unconsumed |
| Review unsupported | `PER-UNSUPPORTED` | Passport alternate | `FX-PER-RESIDENCE-UNSUPPORTED`; no nationality inference |
| Residence failure | `PER-FAILED` | Retry/Passport | `FX-PER-RESIDENCE-FAIL`; draft/context preserved |
| Passport pending | `PER-PENDING`, adapter=passport | 뒤로/닫기 | `FX-PER-PASSPORT-PENDING`; bundled sample asset reference only, user raw media 0 |
| Passport failure | `PER-FAILED` | failed-step Retry/back | `FX-PER-PASSPORT-FAIL`; original context preserved |
| Cancel | current check stops | original action/methods | Person/action mutation 0; sample reference cleared |
| Review success | `PER-VERIFIED`, adapter+expiry+provenance | next gate/original action | Residence or Passport success fixture; only Person changes |
| Return | same token through method/partial gates | continue | full plan recheck, consume once immediately before action mutation |
| Invalid return | safe map surface | 탐색 | token/sample reference deleted, no toast/Labs fallback |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| action→methods | 220–280ms emphasized decel | original object header fixed | immediate sheet+focus |
| Residence→Passport | 160–200ms body swap or 280–320ms full task | same header/token; no second backdrop | immediate content replace |
| sample review step | 160–200ms | failed step stays in place, no full-page carousel | static numbered/local status |
| pending→result | 220–320ms | Person status morph only, no credential celebration | static result+live region |
| exact return | 220–320ms | camera/object/draft anchors preserved | immediate restore |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Gate title | 한 사람 확인 | Confirm one person | 一人であることを確認 | legal status headline 금지 |
| Residence method | 체류 카드로 확인 | Use residence card | 在留カードで確認 | `foreigner`·provider명 제외 |
| Passport alternate | Passport로 확인 | Use passport instead | パスポートで確認 | same Person purpose |
| Scope | 한 사람이라는 결과만 공유해요 | Share only the one-person result | 一人であるという結果だけを共有します | consent 전 visible |
| Primary CTA | 동의하고 확인 | Agree and confirm | 同意して確認 | selected method 함께 |
| Unavailable | 지금은 이 방법을 이용할 수 없어요 | This method is unavailable right now | 現在この方法は利用できません | unsupported와 구분 |
| Unsupported | 이 카드 방식은 지원되지 않아요 | This card method isn’t supported | このカード方式には対応していません | user blame 금지 |
| Retry | 다시 확인 | Try again | もう一度確認 | same method/context |
| Return | 원래 행동 계속 | Continue your original action | 元の操作を続ける | object-specific label 권장 |

- normal surface의 `on-device`, `preview`, `simulated`, `test`, provider/architecture는 0회다.
- review fixture result에는 `검토용 결과 · 외부 서비스 확인 없음`을 지역화해 표시하고 정부 ID/visa/permit 문구로 확대하지 않는다.

## 9. Accessibility·responsive

- 320×568/800, 360×800 edge 16px; 390×844/430×932 edge 20px; horizontal overflow 0.
- 844×390은 original object+method/decision+primary/escape가 단일 scroll로 접근되고 desktop rail/이중 modal은 없다.
- method rows, close/back, sample-step Retry, primary/alternate는 최소 44px; default 48px, primary 52–56px.
- 200% zoom에서 availability, requester/purpose/scope, Passport alternate, failure/recovery, primary가 sticky footer에 가리지 않는다.
- focus는 object→method availability→scope→primary→alternate; dialog trap/background inert/Escape와 exact opener restore를 지킨다.
- available/unsupported/unavailable/selected/result는 색만이 아니라 glyph+label+border+screen-reader status로 구분한다.
- current public/review route는 camera/document permission을 요청하지 않는다. future live provider에서만 요청 직전에 목적·retention을 알리고 denial 뒤 same step과 alternate를 유지한다.
- KO/EN/JA decision text는 ellipsis 금지; forced colors/reduced motion에도 same method/result/return 의미가 남는다.

## 10. 계측·완료 기준

### UX signal

- entry source, Residence preflight, normal unavailable→Passport, review supported/unsupported/failure, exact return을 별도 계측한다.
- method switch 전후 token/object/draft hash와 success/cancel/fail별 axis mutation whitelist를 기록한다.
- current public/review route의 user raw media 수집 0과 sample reference lifecycle, viewport/locale clipping, accessible method status를 검증한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] onboarding intent로 Residence/Person/nationality/legal status를 추론하거나 자동 시작하지 않는다.
- [ ] Residence availability가 선택 전에 보이고 unavailable/unsupported/failure가 각각 구분된다.
- [ ] normal `NOT_CONFIGURED`는 `PER-VERIFIED/PER-UNSUPPORTED` 또는 credential success를 만들지 않는다.
- [ ] 정적 `NOT_CONFIGURED`에는 무의미한 Retry가 없고, 연결된 provider의 일시 실패에서만 같은 method/context Retry를 제공한다.
- [ ] explicit review fixture만 provenance와 함께 Residence/Passport success/unsupported/failure를 재현한다.
- [ ] Passport alternate가 같은 Person sheet와 최종 returnTo를 유지하고 새 home/modal stack을 만들지 않는다.
- [ ] success는 Person만 바꾸고 Account/Age/Payment/K-Tour/Presentation을 완료 처리하지 않는다.
- [ ] valid token만 full-plan 재검증 후 one-shot 소비하고 cancel/failure/invalid에서 original action mutation 0이다.
- [ ] raw document/face/DOB/nationality/provider response가 URL/returnTo/localStorage에 없다.
- [ ] current public/review Passport fixture에는 camera/file picker가 없고 실제 사용자 document/face data 수집·network 전송·browser persistence가 0이다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, keyboard, SR, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-002`, `REQ-003`, `REQ-005` | Residence supported/unsupported와 Passport alternate, independent gates 유지 | requirement reachability |
| State | `PER-UNVERIFIED/PENDING/VERIFIED/UNSUPPORTED/FAILED/EXPIRED`, adapter residence/passport; other axes independent | methods→consent/result→exact return in one shell | transition+mutation whitelist |
| Fixture | `FX-PER-RESIDENCE-PENDING`, `FX-PER-RESIDENCE-SUCCESS`, `FX-PER-RESIDENCE-UNSUPPORTED`, `FX-PER-RESIDENCE-FAIL`, `FX-PER-PASSPORT-PENDING`, `FX-PER-PASSPORT-SUCCESS`, `FX-PER-PASSPORT-FAIL` | explicit QA/review mode only, `SIMULATED` provenance | normal-vs-fixture E2E |
| returnTo | existing `SUBMIT_LOCAL_SIGNAL` 또는 `JOIN_TABLE` | same token across alternate; envelope에는 allowlisted public venueId/tableId만, draft/media는 token 밖 app memory, camera/section/scroll/focus는 navigation context | one-shot/TTL/registry/forgery/privacy tests |
| Persistence | non-sensitive Person status/adapter/expiry/provenance in demo session | bundled sample asset reference만 memory; raw card/passport/face/DOB/nationality/credential 수집·저장 금지 | storage/network/media lifecycle audit |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | method와 대안을 원 행동 안에서 한 결정씩 보여줌 | provider prose를 접고 Residence→Passport same-sheet handoff |
| D2 시각·인터랙션 | availability preflight, one shell, full-task sample review, exact anchor | ActionRow states, no modal stack, token/header continuity |
| D3 신뢰·접근성 | no nationality/legal inference, normal fail-closed, raw data boundary | `NOT_CONFIGURED` no mutation, review provenance, Person-only result |

잔여 이견: `없음`. 원 Flow Catalog의 주 mapping에 더해 final consensus/PRD ledger가 Passport alternate 보존을 위해 잠근 `REQ-003`을 canonical mapping으로 포함한다.
