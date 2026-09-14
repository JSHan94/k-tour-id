# FL-015 · Optional Public Profile

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-008`, `REQ-015` |
| 진입 행동 | My Korea 또는 Table profile의 `프로필에 표시`·`공개 정보 관리` |
| 성공 결과 | Account 사용자가 명시적으로 켠 `From`, `Lives in`, `Languages` 필드만 공개한다. 네 reputation 축은 합산하지 않고 각각의 evidence 상태로 표시한다. |
| 취소 결과 | draft를 버리고 기존 published profile과 공개 범위를 그대로 유지하며 진입한 My Korea/Table 객체로 돌아간다. |
| 실패·재시도 | 저장 오류는 `PUB-SAVE-FAILED`; 기존 published 값은 유지하고 draft·필드별 consent를 같은 sheet에 남겨 재시도한다. |
| 정확한 복귀 | 별도 canonical gate `returnTo`는 없다. entry route, Table/member/profile selection, sheet snap, scroll, opener focus를 local navigation state로 보존한다. |
| 실행 truth | 공개 정보는 self-declared 값과 field별 opt-in이다. Person/ID 결과로 국적·거주지·언어를 추론하거나 자동 공개하지 않으며 reputation은 안전·신뢰 점수가 아니다. |

### 삭제할 수 없는 PRD 불변식

- `From`, `Lives in`, `Languages`는 각각 독립된 value와 visibility consent를 가진다. 초기값은 모두 private다.
- 한 필드를 공개해도 다른 필드는 공개되지 않는다. 값 입력과 공개 toggle은 별도 결정이다.
- nationality, visa/residence, passport, Mobile ID, identity provider data를 자동 채우거나 공개하지 않는다.
- `본인 확인 참고`, `방문`, `기여`, `모임` 네 축은 독립적으로 존재하며 sum, average, trust score, safety badge로 합치지 않는다. canonical state ID와 영문 domain명은 열린 근거 상세에서만 쓴다.
- profile 저장 성공·실패는 Age, Payment KYC, stamp, Table membership, ONDO temperature를 변경하지 않는다.
- draft와 published snapshot을 분리하며 failure/cancel이 기존 공개 profile을 손상하지 않는다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| 세 profile field가 한 번에 공개되는 bundle처럼 보일 수 있다. | 하나만 공유하려던 사용자가 더 많은 정보를 공개할 위험이 있다. | P0 | `PUB-PRIVATE/PARTIAL` editor |
| 국기·국가명이나 ID 결과가 신뢰 badge처럼 표현될 수 있다. | 국적 추론·차별·identity-derived disclosure로 이어진다. | P0 | public member profile |
| reputation을 하나의 점수나 `trusted/safe` badge로 요약할 여지가 있다. | evidence 범위를 넘어 사람의 안전성을 보증한다고 오인한다. | P0 | Table/profile reputation |
| 장문의 privacy 설명과 빈 원형 avatar가 첫 화면을 차지할 수 있다. | 실제 결정인 field별 공개 범위가 아래로 밀린다. | P1 | edit sheet first viewport |
| 저장 실패가 published 화면까지 실패 상태로 덮을 수 있다. | 이미 공개된 상태와 새 draft를 구분하지 못한다. | P1 | `PUB-SAVE-FAILED` |

## 3. 목표 경험

### 한 문장 약속

> 내가 고른 정보만, 다른 사람에게 어떻게 보이는지 확인한 뒤 공개한다.

### 사용자가 1초 안에 알아야 하는 것

- 각 field 옆에서 공개/비공개를 따로 정한다.
- 오른쪽 또는 아래의 live public view에는 공개한 값만 나타난다.
- 저장 실패 시 현재 공개 profile은 그대로다.

### 사용자가 읽지 않아도 알아야 하는 것

- eye/eye-off glyph와 row state가 각 field의 공개 범위를 직접 보여준다.
- 공개하지 않은 field는 public view에서 공간까지 제거되어 placeholder가 남지 않는다.
- 네 reputation segment는 서로 다른 glyph와 label로 분리되어 합산되지 않는다.

## 4. 권장 모바일 여정

```text
MY KOREA OR TABLE PROFILE ENTRY
→ FIELD-BY-FIELD EDIT + LIVE PUBLIC VIEW
→ SAVE PENDING
→ PUB-PARTIAL | PUB-PRIVATE | PUB-SAVE-FAILED | CANCEL
→ EXACT MY KOREA/TABLE PROFILE RETURN
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 어떤 정보를 보여줄까요? | 세 field row와 compact public view | field 선택 | entry route, selected Table/member, published snapshot |
| Decision | 이 값이 다른 사람에게 이렇게 보여도 될까요? | active row + 즉시 갱신되는 public view | 공개 toggle | draft values와 field별 consent |
| Pending | 선택한 범위를 저장할까요? | primary button progress | 저장 대기/취소 | published snapshot 불변 |
| Success | 공개 범위가 의도대로인가요? | saved rows와 public view check | 완료 | `PUB-PARTIAL` 또는 `PUB-PRIVATE` |
| Failure | 현재 공개본을 유지하고 다시 시도할까요? | inline error와 unchanged published marker | 다시 시도 | draft 보존, published 불변 |
| Return | 원래 보던 profile/Table인가요? | same opener focus | 계속 | scroll·selection·focus 복원 |

## 5. 화면별 상세 규격

### Screen/Sheet A · Field editor

**목적**

- 자기 기입 값과 공개 consent를 field별로 편집한다.

**첫 viewport에 보이는 것**

- 제목 `공개 정보`, close/back, 한 줄 scope.
- `From`, `Lives in`, `Languages` 중 첫 두 field row와 현재 visibility.
- sticky primary는 값/consent 변경이 있을 때만 활성화된다.

**시각·인터랙션**

- Detail sheet는 content-fit에서 시작하고 최대 88dvh, 하나의 internal scroll만 쓴다.
- 각 row는 label, self-declared value, 48px visibility control로 구성한다. flag-only representation을 금지한다.
- 사진이 없으면 빈 원형 placeholder를 만들지 않는다. 사용자가 등록한 source-backed photo가 있을 때만 media slot을 렌더한다.
- field value를 지우면 visibility도 off로 내려가지만 다른 field에는 영향을 주지 않는다.

**행동**

- Primary: `변경사항 저장`
- Secondary: `다른 사람에게 보이는 모습` 열기/접기
- Close/Back: unsaved draft가 있으면 `변경사항 버리기 / 계속 편집` 확인

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | field label, self-declared value, field별 public/private state, save |
| 시각화 | eye/eye-off glyph, active row border, 공개 field만 구성되는 live view |
| 한 번 접기 | 각 field가 보이는 위치, published timestamp, reputation source 설명 |
| Labs/개발 문서로 이동 | storage keys, fixture ID, internal consent schema |
| 삭제 | nationality inference, ID-derived auto-fill, 한 번에 모두 공개 toggle, 빈 avatar, `ON-DEVICE`, 긴 privacy 선언문 |

### Screen/Sheet B · Public view and reputation

**목적**

- 공개할 field와 reputation evidence가 실제로 어떻게 보이는지 검증한다.

**첫 viewport에 보이는 것**

- display name, 공개 선택된 field만 있는 compact profile.
- `본인 확인 참고`, `방문`, `기여`, `모임` 네 개의 독립 segment.

**시각·인터랙션**

- 320/360/390/430 portrait에서는 public view를 editor 아래 같은 scroll의 inline section으로 고정한다. secondary trigger는 그 section으로 scroll/focus할 뿐 snap이나 새 overlay를 만들지 않는다. 844×390과 tablet/desktop에서만 container가 두 320px column과 24px gutter를 수용할 때 field list/public view 2-column을 쓴다.
- 공개하지 않은 field는 bullet, 빈 label, blur placeholder 없이 DOM과 accessibility tree에서 제거한다.
- 각 reputation segment는 glyph+human label+상태를 가진다. 원형 합산 gauge, 별점, `trusted/safe/local` score를 금지한다.
- `본인 확인 참고`는 Person state의 read-only 파생이며 확인 method나 국적을 공개하지 않는다.

**행동**

- Primary: `변경사항 저장`
- Secondary: 각 reputation segment의 `근거 보기`
- Close/Back: editor의 같은 scroll/focus로 복귀

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 공개 선택 필드, 네 reputation label과 개별 상태 |
| 시각화 | 독립 segment/timeline, field가 켜질 때 public view에만 나타나는 row |
| 한 번 접기 | 각 축의 근거 종류·최근 갱신 시각; source ID는 evidence drawer |
| Labs/개발 문서로 이동 | evidenceRef, fixtureId, internal enum, analytics diagnostics |
| 삭제 | aggregate trust/safety score, nationality badge, ID provider logo, 공개하지 않은 field placeholder, maker `preview` label |

### Screen/Sheet C · Save result and recovery

**목적**

- published와 draft를 분리해 성공·실패·취소 결과를 명확히 한다.

**첫 viewport에 보이는 것**

- 성공은 primary가 compact check로 바뀌고 `저장됨`을 알린다.
- 실패는 editor 하단의 한 줄 error, `다시 시도`, `현재 공개본 유지`를 보인다.

**시각·인터랙션**

- 별도 success page나 confetti 없이 원 field rows가 published state로 morph한다.
- failure에서는 public view에 `현재 공개 중`과 `저장되지 않은 변경`을 시각적으로 분리한다.
- retry는 같은 draft와 focus를 사용하며 다른 modal을 열지 않는다.

**행동**

- Primary: success `완료`, failure `다시 시도`
- Secondary: failure `현재 공개본 유지`
- Close/Back: success는 exact entry return, failure close는 draft discard 확인

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | save 상태, published/draft 구분, recovery action |
| 시각화 | row check, draft accent, unchanged published outline |
| 한 번 접기 | 실패 시각·비민감 error category |
| Labs/개발 문서로 이동 | raw error, fixture selector, write diagnostics |
| 삭제 | 저장 실패를 공개 profile 삭제처럼 보이는 full error, 자동 retry loop, 다른 reputation 변화 |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
| Loading | published snapshot skeleton은 field row 구조만 유지한다. | close | 민감 값·가짜 avatar skeleton 금지 |
| Empty | 세 field가 모두 private이면 `공개된 정보 없음`과 `정보 추가`만 보인다. | 편집, 닫기 | Account·reputation 불변 |
| Failure | `PUB-SAVE-FAILED`, inline error, old published snapshot 표시 | 다시 시도, 현재 공개본 유지 | draft 유지; published 손상 0 |
| Retry | same editor에서 pending으로 전환 | 취소 | 동일 draft·consent·focus 유지 |
| Cancel | draft가 있으면 discard 확인 후 exact return | 계속 편집, 변경사항 버리기 | published·reputation 불변 |
| Success | `PUB-PARTIAL` 또는 `PUB-PRIVATE`, row check | 완료, 다시 편집 | 선택 field만 publish |
| Return | My Korea/Table의 같은 profile opener로 복귀 | 기존 action 계속 | route·selection·scroll·focus 복원 |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| entry→editor | 240~280ms sheet open | opener/member object 고정 | duration 0 + focus heading |
| field visibility toggle | 140~180ms | row 높이 고정; public view row는 layout animation 최대 8px | 즉시 show/hide + state announcement |
| editor→inline public view | 160~200ms | portrait는 같은 scroll에서 최대 8px reveal 후 heading focus; 새 snap/overlay 없음 | 즉시 scroll/focus 이동 |
| pending→saved | 220~320ms button/check morph | field positions 고정, confetti 없음 | static check + live status |
| failure→retry | 160~200ms inline body swap | draft row와 scroll 고정 | 즉시 state 교체 |
| close→opener | 240~280ms reverse | selected Table/profile card 불변 | 즉시 close + focus restore |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Title | 공개 정보 | Public profile | 公開プロフィール | optional scope를 title 과설명으로 반복하지 않음 |
| Scope | 보여줄 항목만 선택하세요 | Choose only what you want to show | 表示したい項目だけ選んでください | 한 줄 |
| From field | 출신 지역 | From | 出身 | self-declared; nationality 아님 |
| Lives field | 현재 생활권 | Lives in | 居住地 | legal residence 아님 |
| Languages field | 사용 언어 | Languages | 使用言語 | proficiency 인증 아님 |
| Public state | 공개 | Public | 公開 |
| Private state | 비공개 | Private | 非公開 |
| Primary CTA | 변경사항 저장 | Save changes | 変更を保存 | mutation verb 유지 |
| Public view | 다른 사람에게 보이는 모습 | What others see | ほかの人に見える内容 | `preview` maker term 금지 |
| Failure | 저장하지 못했어요. 현재 공개 정보는 그대로예요. | Couldn’t save. Your current public profile is unchanged. | 保存できませんでした。現在の公開内容は変わりません。 | consequence+recovery |
| Retry | 다시 시도 | Try again | もう一度試す | same draft |

- provider, raw identity method, nationality, internal state명을 normal profile copy에 쓰지 않는다.
- KO/EN/JA에서 field meaning이 법적 출신·거주 증명처럼 강화되지 않도록 번역 검수한다.
- reputation은 `신뢰 점수`가 아니라 `방문`, `기여`, `모임`, `본인 확인 참고`의 개별 label을 쓴다.

## 9. Accessibility·responsive

- 320×568/800·360px edge 16px, 390×844·430px edge 20px; single column이며 horizontal overflow 0이다.
- 844×390에서는 left field list/right public view의 2-column을 허용하되 전체 route에 하나의 scroll만 사용하고 sticky CTA가 마지막 field를 덮지 않는다.
- row와 visibility control은 최소 48px target, label 자체도 control의 accessible name에 포함한다.
- toggle은 `aria-pressed`와 `출신 지역 공개/비공개` 같은 KO/EN/JA 상태를 읽는다. eye glyph에만 의존하지 않는다.
- public view 갱신은 polite live region으로 요약하되 toggle마다 전체 profile을 재낭독하지 않는다.
- keyboard 순서는 field value→해당 visibility→다음 field→public view→save이며 saved/failed 뒤 focus가 primary/status로 간다.
- 200% zoom에서 field label, 값, toggle이 겹치면 value를 다음 줄로 보내고 fixed row height를 쓰지 않는다.
- forced colors에서 public/private, draft/published, four reputation segments를 border·glyph·text로 구분한다.
- photo가 없을 때 accessibility tree에 `빈 프로필 사진` 장식을 만들지 않는다.

## 10. 계측·완료 기준

### UX signal

- field별 toggle과 save/cancel/failure/retry를 기록하되 value·국가·언어 원문은 analytics에 보내지 않는다.
- published field set과 draft field set이 failure/cancel에서 일치하지 않는지 invariant로 검사한다.
- public view에 비동의 field가 DOM·accessibility snapshot·network payload에 없는지 자동 검사한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] From/Lives in/Languages는 value와 visibility가 각각 독립이고 기본 private다.
- [ ] 한 field toggle이 다른 field consent를 변경하지 않는다.
- [ ] Person/ID/provider 정보로 국적·거주·언어를 추론·자동 입력·자동 공개하지 않는다.
- [ ] public view와 payload에 동의하지 않은 field가 없다.
- [ ] Identity/Visit/Contribution/Meetup이 네 독립 축이며 aggregate trust/safety/local score가 없다.
- [ ] 320/360/390/430 portrait의 public view는 같은 scroll의 inline section이고 새 snap·overlay가 없다; 2-column은 실제 container가 두 320px column+24px gutter를 수용할 때만 쓴다.
- [ ] save failure/cancel 뒤 기존 published snapshot은 byte-for-byte 불변이고 draft recovery가 가능하다.
- [ ] success/failure가 Age, Payment KYC, stamp, Table membership, ONDO temperature를 바꾸지 않는다.
- [ ] 320/360/390/430, 320×568, 844×390, 200% zoom에서 clipping·sticky overlap이 없다.
- [ ] KO/EN/JA, keyboard, screen reader, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-008` public Table identity context, `REQ-015` reputation | field consent와 independent evidence segments | requirement trace + profile/Table E2E |
| State | `PUB-PRIVATE/PARTIAL/EDITING/SAVE-FAILED`; four `REP-*` domains | draft/published 분리, no aggregate score | reducer/state snapshot tests |
| Fixture | `FX-PUB-EDIT/SAVE-SUCCESS/SAVE-FAIL`, `FX-REP-BEFORE/AFTER` | deterministic save/failure와 axis별 evidence | fixture provenance + negative mutation tests |
| returnTo | canonical gate 없음 | My Korea/Table navigation context와 opener focus 보존 | success/cancel/fail/reload return E2E |
| Persistence | 선택 field·consent는 demo session, draft는 memory | field별 allowlist; raw ID/nationality inference 0 | storage/network/accessibility audit |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 공개 결정을 field row와 한 primary로 압축 | 장문 privacy copy 대신 row state와 live public view로 고정 |
| D2 시각·인터랙션 | eye state·public view·네 reputation segment로 시각화 | 빈 avatar와 aggregate gauge를 제거하고 same-sheet morph로 고정 |
| D3 신뢰·접근성 | explicit opt-in, default private, no nationality inference, published/draft 분리 | field별 consent·failure invariance·screen-reader scope를 release gate로 고정 |

잔여 이견: `없음`.
