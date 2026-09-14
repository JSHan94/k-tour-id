# FL-002 · Age proof → exact After19 venue

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-005`, `REQ-012` |
| 진입 행동 | 사용자가 잠긴 야간 장소의 `19+ 확인` 또는 After19 장소 행동을 누른다. |
| 성공 결과 | Age 축만 `AGE-VERIFIED`가 되고 동일 `venueId`·camera·section의 After19 상세가 열린다. |
| 취소 결과 | Age와 장소 행동을 바꾸지 않고 같은 잠긴 venue의 일반 상세로 돌아간다. |
| 실패·재시도 | `NOT_CONFIGURED`, denied, timeout, failure, expiry를 구분한다. 정적으로 미구성된 provider에는 무의미한 Retry를 보이지 않고 일반 정보/구성된 다른 방법을 제공하며, 일시 오류만 같은 venue에서 Retry한다. |
| 정확한 복귀 | `RT-OPEN_AFTER19-<epoch-ms>`와 `OPEN_AFTER19`; venueId가 있으면 exact venue, 없으면 원 city/mode CTA. camera, query, filters, section, sheet snap, scroll, opener focus를 함께 보존한다. |
| 실행 truth | current B에 live age provider가 없으면 normal public route는 `executionTruth=NOT_CONFIGURED`, Age state 불변이다. `FX-AGE-SUCCESS`는 명시적 QA/review mode에서만 `SIMULATED` provenance로 가능하다. |

### 삭제할 수 없는 PRD 불변식

- Age는 Account·Person·Payment KYC·K-Tour credential·Presentation과 독립이다.
- Guest도 Age 확인을 시작할 수 있고, 저장/보관에만 별도 Account가 필요할 수 있다.
- raw DOB, 여권/ID 원문, 신분증 이미지, provider response를 returnTo·URL·localStorage에 넣지 않는다.
- 성공은 expiry가 있는 최소 `19+ confirmed` 결과만 소비하며 원 CTA mutation 직전에 token을 한 번 소비한다.
- 취소·실패·만료에도 같은 장소의 일반 상세와 식음료 탐색은 계속 가능하다.
- After19는 같은 map geography 위 lens이며 일반 야간 장소를 제거하지 않는다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| K-Tour ID 전체 setup stepper와 `on-device/provider` 설명이 Age 질문보다 앞선다. | 단순 19+ 확인이 복잡한 신원 가입처럼 느껴진다. | P1 | Age gate entry |
| 원 venue 이름·사진·행동이 sheet에서 사라질 수 있다. | 무엇을 보기 위해 확인하는지 잊고 generic ID flow로 이탈한다. | P0 | `OPEN_AFTER19` return |
| provider 미연결인데 fixture success가 normal verified처럼 보일 수 있다. | 실제 성인 확인이 끝났다고 오인한다. | P0 | `AGE-PENDING/VERIFIED` truth |
| 실패/만료 뒤 home 또는 다른 장소로 돌아갈 수 있다. | 선택·camera·filter를 잃고 다시 찾게 된다. | P1 | cancel/error/expiry |
| night mode가 white card 일괄 반전·neon outline 혼합으로 보일 수 있다. | 지리와 현재 상태를 읽기 어렵고 다른 앱처럼 느껴진다. | P1 | success return to After19 |

## 3. 목표 경험

### 한 문장 약속

> 지금 고른 장소를 화면에 고정한 채 19+ 여부만 확인하고, 결과와 관계없이 바로 그 장소로 돌아간다.

### 사용자가 1초 안에 알아야 하는 것

- 어떤 장소의 어떤 19+ 행동을 열려는지.
- 확인하는 것은 `19+` 한 가지이며 거절해도 일반 정보는 볼 수 있다는 것.
- provider가 지금 연결 가능한지, 지금 누를 수 있는 다음 행동이 무엇인지.

### 사용자가 읽지 않아도 알아야 하는 것

- venue thumbnail/name과 19+ lock이 sheet header에 고정된다.
- 다른 gate badge나 전체 ID stepper가 없어 Age만 요청된다는 것을 구조로 안다.
- 성공하면 같은 map/detail이 dark lens로 이어지고, 실패하면 같은 일반 상세가 유지된다.

## 4. 권장 모바일 여정

```text
ENTRY: locked venue / After19 CTA
→ DECISION: venue 고정 + 19+ predicate·purpose·scope
→ NORMAL UNAVAILABLE: NOT_CONFIGURED → 일반 정보 | 구성된 다른 방법
→ REVIEW FIXTURE: AGE-PENDING
   → AGE-VERIFIED | AGE-FAILED | AGE-EXPIRED | CANCEL
→ TERMINAL
→ RETURN: exact venue + exact After19 action 또는 같은 일반 detail
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 이 장소의 19+ 내용을 볼까? | 잠긴 venue thumbnail/name+19+ glyph | `19+ 확인` | city, camera, venueId, section, filters |
| Decision | 19+ 결과 공유에 동의할까? | venue-anchored Age Decision sheet | `확인하기` | return token, opener focus |
| Unavailable | 지금 확인할 수 없을 때 무엇을 할까? | inline unavailable state | `일반 정보 보기`/구성된 다른 방법 | Age 불변, venue 유지 |
| Pending | 이 확인만 진행 중인가? | 19+ ring progress | 기다림/닫기 | token 미소비, 다른 axes 불변 |
| Success | 19+ 내용이 열렸는가? | same venue header→night token morph | After19 상세 계속 | `AGE-VERIFIED`, expiry, exact venue |
| Failure/expiry | 다시 확인할까? | same venue+failure status | Retry/일반 정보 | action mutation 0 |
| Return | 방금 고른 장소인가? | same marker/detail/section | 장소 보기 | camera/sheet/scroll/focus 복원 |

## 5. 화면별 상세 규격

### Sheet A · Locked venue decision

**목적**

- 원 장소를 잃지 않고 Age predicate 한 가지만 설명·동의받는다.

**첫 viewport에 보이는 것**

- compact venue media/name, `19+` glyph, 요청 목적, 공유 결과(`19+ 여부만`), primary CTA, `일반 정보 보기`.
- requester가 실제로 존재하면 requester 이름; 없으면 제품 자체 목적만 정확히 표시한다.

**시각·인터랙션**

- shared Decision sheet, content-fit≤72dvh; header에 venue와 close만 둔다.
- 1/4 stepper, phone→badge diagram, provider logo wall, 미래 gate check를 쓰지 않는다.
- 19+는 색뿐 아니라 visible text/glyph로 식별한다.

**행동**

- Primary: `19+ 확인`.
- Secondary: `일반 정보 보기`.
- Close/Back: mutation 없이 exact locked venue.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | venue, 19+ predicate, purpose, sharing scope, 거절 경로 |
| 시각화 | lock→19+ ring, current venue anchor, one-axis progress |
| 한 번 접기 | issuer/provider type, expiry policy, 저장 범위 |
| Labs/개발 문서로 이동 | adapter, raw fixture ID, callback schema, DID/VC 구조 |
| 삭제 | `ON-DEVICE`, K-Tour 전체 setup, `Choose/Check/Issue/Present`, 법적 면책 반복, `Continue` |

### Sheet B · Unavailable/Pending/Result

**목적**

- normal unavailable과 explicit review fixture를 같은 성공처럼 보이지 않게 하고 다음 행동을 명확히 한다.

**첫 viewport에 보이는 것**

- normal: `지금은 19+ 확인을 연결할 수 없어요`와 일반 정보 CTA.
- review fixture: QA/review mode 표식, pending/result, `외부 확인 없음` scope, expiry.
- transient failure/expiry: 이유 한 줄, Retry 또는 재확인, 일반 정보. `NOT_CONFIGURED`에는 Retry를 만들지 않는다.

**시각·인터랙션**

- normal `NOT_CONFIGURED`는 `AGE-UNVERIFIED`를 유지하고 success check를 절대 쓰지 않는다.
- review fixture만 `FX-AGE-PENDING/SUCCESS/FAIL/EXPIRED`를 실행하며 결과 object에 provenance가 남는다.
- result는 새 success page가 아니라 venue header의 lock→19+ 상태 교체로 보여준다.

**행동**

- Primary: normal은 `일반 정보 보기`, review success는 `이 장소 보기`, failure는 `다시 확인`.
- Secondary: 닫기.
- Close/Back: exact venue; token 폐기 또는 미소비 규칙 적용.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | unavailable/failure/expiry, recovery, review fixture일 때 외부 확인 없음 |
| 시각화 | pending ring, success 19+ glyph, failed/expired non-color status |
| 한 번 접기 | provider name, observedAt/expiresAt 세부, receipt reference |
| Labs/개발 문서로 이동 | raw callback, fixture controls, adapter diagnostics |
| 삭제 | normal route의 `simulated/test/preview` badge, generic verified shield, 다른 gate 완료 표시 |

### Screen C · Exact venue return

**목적**

- 성공은 같은 venue의 After19 detail, 그 외에는 같은 venue의 일반 detail로 복귀시킨다.

**첫 viewport에 보이는 것**

- 동일 장소명/사진/marker, 동일 camera와 detail section.
- 성공일 때 same geometry의 near-black lens와 제한된 neon temperature; 일반 장소와 지리 유지.
- 실패·취소 시 기본 detail과 다시 확인 가능한 19+ action.

**시각·인터랙션**

- success 시 map/detail geometry displacement≤1px; theme만 220ms crossfade.
- venue가 registry에서 사라졌으면 같은 city의 일반 장소 List와 짧은 recovery를 보여준다.

**행동**

- Primary: 성공은 원 After19 CTA 자동 1회 재개; 실패/취소는 일반 상세 계속.
- Secondary: `19+ 끄기` 또는 Retry.
- Close/Back: stored city/list/history.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | venue, After19 active/locked state, expiry 또는 unavailable recovery |
| 시각화 | same marker geometry, night tokens, active 19+ control |
| 한 번 접기 | 확인 결과 provenance |
| Labs/개발 문서로 이동 | fixture transaction log |
| 삭제 | generic K-Tour home, 성공 축 전체 checklist, 반복 provider 설명 |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Initial | `AGE-UNVERIFIED/FAILED/EXPIRED`, venue locked | 확인/일반 정보 | other axes 불변 |
| Normal unavailable | inline unavailable, no success mark | 일반 정보, 구성된 다른 방법 | `truth=NOT_CONFIGURED`; Age/action/balance 불변 |
| Loading/Pending | `AGE-PENDING`, one-axis progress | 닫기 | token 미소비, raw PII 저장 금지 |
| Failure | `AGE-FAILED`+원인·Retry | Retry/일반 정보 | `FX-AGE-FAIL`; venue context 유지 |
| Expired | `AGE-EXPIRED`, After19 off | 재확인/일반 정보 | `FX-AGE-EXPIRED`; `A19-OFF` 강제 |
| Cancel | sheet close | 일반 상세 | Age/action mutation 0, gate null |
| Review success | `AGE-VERIFIED`+expiry+fixture scope | exact venue 보기 | `FX-AGE-SUCCESS`; other axes 불변 |
| Return | success만 `OPEN_AFTER19` 재개 | After19 상세 | full plan 재검증→mutation 직전 token one-shot 소비 |
| Invalid return | safe map/List | 탐색 계속 | expired/forged/duplicate token 삭제, toast 없음 |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| venue→Decision | 220–280ms emphasized decel | venue header가 sheet anchor로 유지 | 즉시 sheet+focus |
| decision→pending | 160–200ms standard | body만 교체, header/height jump 최소화 | 즉시 pending state |
| pending→result | 220–320ms spring-lite | lock glyph가 19+ glyph로 morph; confetti 없음 | static glyph+live region |
| result→venue | 220ms theme crossfade | camera/marker/card displacement≤1px | duration 0 |
| cancel/failure return | 160–220ms | same sheet reverse, opener focus restore | 즉시 복원 |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Title | 19+ 확인 | Confirm 19+ | 19歳以上の確認 | K-Tour setup 제목 금지 |
| Purpose | 이 장소의 19+ 내용을 열어요 | Unlock 19+ details for this place | この場所の19歳以上向け情報を開きます | venue 고정 |
| Scope | 19+ 여부만 공유해요 | Share only whether you are 19+ | 19歳以上かどうかだけを共有します | 절대 접지 않음 |
| Primary CTA | 19+ 확인 | Confirm 19+ | 19歳以上を確認 | 결과 예고 |
| Escape CTA | 일반 정보 보기 | View general details | 通常情報を見る | Guest 기능 유지 |
| Unavailable | 지금은 19+ 확인을 연결할 수 없어요 | 19+ confirmation is unavailable right now | 現在、19歳以上の確認を利用できません | provider명 불필요 |
| Retry | 다시 확인 | Try again | もう一度確認 | configured transient failure 또는 expiry에만; `NOT_CONFIGURED`에는 숨김 |
| Success | 19+ 내용 열림 | 19+ details unlocked | 19歳以上向け情報を開きました | review mode에서만 fixture scope 병기 |
| Expired | 확인이 만료됐어요 | Confirmation expired | 確認の有効期限が切れました | 재확인 행동과 함께 |

- normal title/CTA에 `preview`, `simulated`, `test`, `on-device`, provider명을 쓰지 않는다.
- explicit QA/review mode에서는 숨기지 않고 `Review fixture · no external check`의 지역화된 provenance를 result에 둔다.

## 9. Accessibility·responsive

- 320×568/800, 360×800은 edge 16px, 390×844/430×932는 edge 20px이며 Decision content-fit≤72dvh다.
- 844×390은 header·venue anchor·predicate·primary·escape가 하나의 internal scroll과 sticky footer로 접근 가능하다.
- close, 19+ control, primary/secondary는 최소 44px; primary는 52–56px다.
- dialog focus는 title→venue→purpose/scope→primary→escape→details 순서, background inert, Escape/close 뒤 opener focus 복원이다.
- `19+` 의미는 neon/color만이 아니라 visible text, glyph, screen-reader label로 남는다.
- 200% zoom과 KO/EN/JA 최장 문구에서 primary/escape가 2줄 안에 전부 보이고 footer가 content를 덮지 않는다.
- status change는 polite live region, failure heading은 focusable, pending은 800ms 전 불필요하게 반복 announce하지 않는다.
- forced colors에서 locked/verified/failed/expired를 glyph+border+text로 구분한다.

## 10. 계측·완료 기준

### UX signal

- gate open→venue anchor 인지, normal unavailable→일반 정보 복귀, review fixture→exact venue 복귀율을 분리 측정한다.
- success/cancel/failure/expiry별 return context hash와 mutation diff를 기록한다.
- normal `NOT_CONFIGURED`에서 `AGE-VERIFIED` 전이와 다른 axis 변화는 0이어야 한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] 첫 viewport에는 exact venue, 19+ predicate, primary, 일반 정보 escape만 경쟁한다.
- [ ] Account/Person/Payment/K-Tour setup을 Age flow에 추가하지 않는다.
- [ ] normal provider unavailable은 Age 불변·no success이며 review fixture와 state/provenance가 분리된다.
- [ ] `NOT_CONFIGURED`에는 무의미한 Retry가 없고, configured transient failure에서만 같은 venue Retry를 제공한다.
- [ ] success만 full gate plan 재검증 뒤 `OPEN_AFTER19`를 one-shot 소비한다.
- [ ] failure/cancel/expiry에도 동일 venue/camera/query/filter/section/sheet/focus가 복원된다.
- [ ] venue가 사라진 경우 같은 지역의 일반 List로 안전하게 복귀한다.
- [ ] After19 return은 same geography/marker geometry와 일반 장소를 유지한다.
- [ ] raw DOB/ID/document/provider response가 URL/storage/returnTo에 없다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, keyboard, SR, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-005`, `REQ-012` | independent Age gate와 verified 19+ exact return 유지 | requirement reachability |
| State | `AGE-UNVERIFIED/PENDING/VERIFIED/FAILED/EXPIRED`, `A19-OFF/ON` | 한 Decision sheet와 same-venue result로 표현 | state transition/mutation diff |
| Fixture | `FX-AGE-PENDING`, `FX-AGE-SUCCESS`, `FX-AGE-FAIL`, `FX-AGE-EXPIRED` | explicit QA/review mode에서만 `SIMULATED` success | normal-vs-fixture E2E |
| returnTo | `OPEN_AFTER19`, `RT-OPEN_AFTER19-<epoch-ms>` | venue/camera/filter/section/sheet/scroll/focus 포함 exact public context | one-shot/expiry/forgery/duplicate tests |
| Persistence | Age/expiry는 demo session, manual-off는 session scope | raw PII·credential 없음; cancel terminal에 gate null | storage allowlist audit |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | K-Tour setup 대신 venue-anchored Age-only decision | 한 질문·한 primary·일반 정보 escape, 기술 문구 접기 |
| D2 시각·인터랙션 | same venue thumbnail/name과 night token morph | shared Decision sheet, header 고정, geometry displacement≤1px |
| D3 신뢰·접근성 | provider 미연결 fail-closed, scope/expiry/recovery 가시화 | normal unavailable과 explicit review fixture 분리, consequence text 유지 |

잔여 이견: `없음`. icon-only Age control 안은 `19+` predicate의 비색상 가시성을 해치므로 기각했다.
