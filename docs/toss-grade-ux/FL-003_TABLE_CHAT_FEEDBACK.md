# FL-003 · Table → Image Chat → Feedback

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-008`, `REQ-009`, `REQ-010`, `REQ-015` |
| 진입 행동 | 장소 상세 또는 Tables 목록에서 사용자가 특정 Table을 열고 `참여`를 누른다. |
| 성공 결과 | 필요 gate를 거쳐 참가 확정→member-only chat/text/image lifecycle→check-in→완료→feedback까지 이어지고, 증거가 있는 Visit/Meetup/Contribution 축만 변한다. |
| 취소 결과 | 참가 전 취소는 membership·chat·reputation mutation 없이 같은 venue/Table/scroll로, 참가 후 Leave는 confirmation 뒤 `TMB-LEFT`와 안전한 Table 상세로 돌아간다. |
| 실패·재시도 | full/closed/cancelled/network/policy, message/image failure를 각 객체 자리에서 복구하며 다른 축을 성공처럼 보이지 않는다. |
| 정확한 복귀 | `JOIN_TABLE` 또는 필요 시 `OPEN_CHAT`; envelope에는 allowlisted public tableId↔venueId만 담고 city/camera, Table facts, detail scroll, sheet snap, opener focus를 복원한다. draft text와 image object URL은 token 밖의 memory에만 보존한다. |
| 실행 truth | 현재 Table/chat/host/booking은 frontend fixture 범위다. 참가 결정점에서 실제 host에게 예약이 전송되지 않는다는 consequence를 한 번 보이며, 실제 사람·예약·moderation을 주장하지 않는다. |

### 삭제할 수 없는 PRD 불변식

- `TableAvailability`, `TableMembership`, `TableFailureReason`, `ChatAccess`는 별도 상태다.
- List는 비교 핵심인 시간·남은 자리·형식을, Join 전 Detail은 시간·좌석·형식·메뉴·언어·비용/분담 6개를 icon+label+value로 모두 보인다.
- 일반 Table은 Account만 또는 policy에 따른 Person을 요구하고, 주류 Table만 독립 Age gate를 추가한다.
- `TMB-CONFIRMED/CHECKED-IN/COMPLETED`만 `CHA-OPEN`; nonmember direct chat은 Table 상세로 돌아간다.
- 이미지의 select/preview/replace/remove/pending/sent/fail/retry와 text pending/sent/fail/retry를 보존한다.
- Report/Block/Leave, check-in, completion, feedback을 삭제하지 않는다.
- Meetup은 실제 Table check-in/completion/feedback evidence 뒤에만 변하고, 참가 요청 실패로 변하지 않는다.
- raw message draft·사진/blob/object URL은 URL·gate envelope·localStorage·sessionStorage에 넣지 않는다. route/app lifetime memory를 벗어나면 삭제한다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| Table card가 행정형 텍스트 카드이고 음식·사람·시간의 시각적 맥락이 약하다. | 먹고 싶은지, 누구와 언제 만나는지 판단이 느리다. | P1 | Table list/detail |
| 6개 planning fact가 누락되거나 icon-only로 압축될 수 있다. | Join 직전에 비용·언어·메뉴 같은 중요한 조건을 놓친다. | P0 | Join decision |
| gate와 참가 modal이 겹치고 원 Table header가 사라질 수 있다. | 어떤 모임에 참여하는지 잊고 취소 시 context가 깨진다. | P1 | `JOIN_TABLE` gate |
| frontend fixture인데 실제 예약처럼 보일 수 있다. | host에게 자리가 확정됐다고 오인한다. | P0 | `TMB-REQUESTING/CONFIRMED` |
| sticky CTA가 note/chat composer 또는 마지막 안전 행동을 가릴 수 있다. | 320px/keyboard에서 입력·신고·나가기를 완료하지 못한다. | P1 | Detail/chat short viewport |
| 실패한 이미지가 sent와 유사하거나 retry가 떨어진 화면에 있다. | 전송 여부를 잘못 이해하고 중복 전송한다. | P1 | `MSG/UPL-FAILED` |

## 3. 목표 경험

### 한 문장 약속

> 장소·시간·사람·식사 조건을 한눈에 확인하고, 필요한 확인만 거쳐 대화와 만남의 결과까지 같은 Table 안에서 이어간다.

### 사용자가 1초 안에 알아야 하는 것

- 어느 장소에서 언제 열리고 자리가 남았는지.
- 어떤 식사/만남 형식인지와 지금 `참여`, `대화`, `체크인`, `피드백` 중 어디인지.
- 실패/full/cancelled라면 지금 가능한 회복 행동.

### 사용자가 읽지 않아도 알아야 하는 것

- 장소·음식 media와 사람 avatar cluster, seat ring, time block이 하나의 약속으로 보인다.
- confirmed가 되기 전 chat composer가 잠겨 있고, confirmed 뒤 같은 Table object가 chat으로 확장된다.
- pending/sent/failed는 bubble geometry와 status glyph가 바뀌며 실패 위치에서 바로 Retry한다.
- safety는 숨은 generic kebab이 아니라 `안전` row에서 2 taps 안에 동사로 접근한다.

## 4. 권장 모바일 여정

```text
ENTRY: venue Table card / Tables list
→ DECISION: Table detail의 6 facts + 실제 예약 전송 없음 truth
→ GATES: FL-010 Account → 조건부 FL-005/006 Person → 주류만 FL-002/013 Age
→ PENDING: TMB-REQUESTING
→ SUCCESS TMB-CONFIRMED + CHA-OPEN | FULL/CLOSED/CANCELLED/FAILURE
→ CHAT: text/image pending → sent | failed → retry/remove
→ CHECK-IN → COMPLETE → FEEDBACK
→ TERMINAL
→ RETURN: exact venue/Table/draft/scroll/focus
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| List | 어떤 Table을 볼까? | photo-led Table row+time/seats/format | Table 열기 | list filters/order/scroll |
| Detail | 이 식사 약속에 참여할까? | venue media+people+6 FactStrip | `이 Table 참여` | tableId, venueId, facts, section |
| Gate | 지금 필요한 확인을 할까? | Table header가 고정된 Decision sheet | current gate action | return token, draft, focus |
| Join pending | 자리를 요청 중인가? | seat ring+pending state | 기다림/취소 | availability, token, other states |
| Confirmed | 대화를 시작할까? | confirmed Table→chat entry | `대화 열기` | membership, chat access |
| Chat | 무엇을 보낼까? | message timeline+composer/media slot | 보내기 | text/media draft, scroll |
| On site | 도착/완료했나? | check-in/completion status | 체크인/피드백 | unique evidence, Table identity |
| Safety | 신고·차단·나가기가 필요한가? | labeled safety action sheet | 선택 동사 | Table/member context |

## 5. 화면별 상세 규격

### Screen A · Table list

**목적**

- 사용자가 여러 Table을 장소/시간/자리/형식 기준으로 빠르게 비교하게 한다.

**첫 viewport에 보이는 것**

- source-backed 장소/음식 thumbnail 또는 명확한 category illustration, Table title, venue.
- 시간, 남은 자리, 식사/만남 형식의 세 fact; 주류·접근성처럼 결과를 바꾸는 condition 한 개까지.
- availability state와 chevron; 6개 fact를 list에 모두 밀어 넣지 않는다.

**시각·인터랙션**

- thumbnail은 4:3/1:1 고정 slot, image error에도 text anchor와 card height가 움직이지 않는다.
- 사람은 동의된/synthetic invitation media만; 외모로 국적·성인·검증을 암시하지 않는다.
- initial letter avatar와 연속 동일 crop을 금지한다.

**행동**

- Primary: Table row 열기.
- Secondary: filter/sort.
- Close/Back: 원 venue 또는 Tables list history.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | venue, time, seats, format, availability |
| 시각화 | food/place media, people cluster, seat ring, time block |
| 한 번 접기 | menu/language/cost preview, host/profile detail |
| Labs/개발 문서로 이동 | fixture/state IDs, adapter/booking architecture |
| 삭제 | 행정형 장문, 빈 avatar, `simulated Table`, 종합 trust score |

### Screen B · Join-ready Table detail

**목적**

- Join 전에 필요한 여섯 사실과 실제 범위를 모두 확인하게 한다.

**첫 viewport에 보이는 것**

- venue media/name, time, remaining seats, meal/meeting format.
- 첫 scroll 안에 menu, language, cost/split까지 총 6/6 icon+label+value.
- 주류이면 visible `19+`, Join 바로 위에 `실제 host에게 예약이 전송되지는 않아요` 한 줄.

**시각·인터랙션**

- icon-only grid를 쓰지 않고 label/value가 200% zoom에서도 읽힌다.
- Detail≈88dvh, 한 internal scroll, 52–56px sticky primary; content bottom padding≥footer+safe area.
- 현재 membership/availability만 한 상태 object로 보이고 다른 gate badge는 미리 전시하지 않는다.

**행동**

- Primary: `이 Table 참여`.
- Secondary: 장소 보기/공유; confirmed 뒤 `대화 열기`.
- Close/Back: 원 장소/목록과 opener focus.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | 6 facts, availability, 주류 조건, 실제 예약 범위, Join/회복 행동 |
| 시각화 | media, people, time, seats, format, membership state |
| 한 번 접기 | self-declared public profile, detailed policy, fixture provenance |
| Labs/개발 문서로 이동 | state machine/fixture controls, internal evidence IDs |
| 삭제 | 국적 매칭, `trusted local`, 여러 verification check badge, 반복 preview disclaimer |

### Sheet C · Join gate/result

**목적**

- Table object를 고정하고 현재 미충족 gate 하나와 Join result를 같은 shell에서 처리한다.

**첫 viewport에 보이는 것**

- compact Table name/time/seat anchor, current Account/Person/Age question, primary/escape.
- 마지막 gate 뒤 `TMB-REQUESTING`, confirmed/full/network/policy/cancel result.

**시각·인터랙션**

- `FL-010` canonical queue를 사용하며 미래 gate 목록과 nested modal을 금지한다.
- success 직전 table↔venue pair, availability, full plan을 다시 검증하고 token을 한 번 소비한다.
- result는 seat/membership object의 morph로 나타나며 다른 verification 축을 check하지 않는다.

**행동**

- Primary: 현재 gate 또는 `참여 요청`.
- Secondary: `나중에`/Retry/근처 Table.
- Close/Back: exact Table, no Join mutation.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | Table anchor, current requirement, availability/result, recovery |
| 시각화 | gate axis glyph, seat pending/confirmed/full state |
| 한 번 접기 | provider/provenance, detailed policy |
| Labs/개발 문서로 이동 | raw fixture callbacks, gate diagnostics |
| 삭제 | `minimum check`, `on-device`, 모든 gate status wall, generic success page |

### Screen D · Chat, image, check-in, feedback, safety

**목적**

- confirmed member가 대화·현장 완료·피드백을 수행하고 실패와 안전 행동을 제자리에서 처리하게 한다.

**첫 viewport에 보이는 것**

- Table context header, member message timeline, composer; image preview는 composer media slot 안.
- check-in/completion 시에는 current step과 한 CTA; feedback은 대상·공개 범위·한 submit.
- `안전` row에서 Report/Block/Leave 텍스트 동사와 각각의 실제 범위·되돌림 가능성을 말하는 confirmation.

**시각·인터랙션**

- Full task 100dvh, 한 scroll; keyboard와 dock/sticky footer가 composer를 가리지 않는다.
- pending/sent/failed message는 glyph+text/accessible status로 구분; failed bubble에서 Retry/Remove.
- nonmember/deep-link access는 `CHA-LOCKED` 후 같은 Table detail로 복귀한다.
- Report/Block은 현재 frontend fixture의 로컬 기록만 만들며 외부 운영팀 전송·실제 계정 제재·membership 변경을 주장하지 않는다. Leave만 confirmation 뒤 `TMB-LEFT`, `CHA-LOCKED`를 만든다.

**행동**

- Primary: 보내기/체크인/피드백 제출 중 현재 하나.
- Secondary: 이미지 선택·교체·삭제, Retry.
- Close/Back: draft 보존 여부를 결정하고 Table detail; Leave/Report/Block은 confirmation.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | membership/chat access, delivery failure, feedback scope, Report/Block/Leave와 confirmation consequence |
| 시각화 | bubbles, media slot, check-in/complete timeline, four-axis reputation delta |
| 한 번 접기 | message/feedback provenance, safety receipt detail |
| Labs/개발 문서로 이동 | fixture IDs, internal moderation architecture |
| 삭제 | nonmember composer, failed-as-sent check, aggregate trust/safety score, 실제 전송/예약 과장 |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | existing list/detail 유지+800ms 뒤 object progress | Back/List | tableId/venueId/facts/scroll 보존 |
| Empty | venue context+`근처 Table` | 근처 보기 | 장소 선택 유지 |
| Open | `TAV-OPEN`, `TMB-NONE`, `CHA-LOCKED` | Join | 다른 axes 불변 |
| Requesting | `TMB-REQUESTING`, duplicate tap locked | 취소 | `TFR-NONE`, chat locked |
| Full/closed | `TAV-FULL/CLOSED`, join disabled | 근처 Table | membership/chat/reputation 불변 |
| Network/policy failure | `TMB-FAILED`, `TFR-NETWORK/POLICY` | Retry/나가기 | availability truth와 draft 보존 |
| Confirmed | `TMB-CONFIRMED`, `CHA-OPEN` | 대화/나가기 | other gate states 불변 |
| Message pending/sent/fail | bubble-local `MSG-*`, image는 `UPL-*` 병행 | Retry/remove | failure는 sent receipt 없음 |
| Organizer cancel | `TAV-CANCELLED`, `TMB-LEFT`, `CHA-LOCKED` | 대체 Table | 안전하게 draft 처리, reputation false mutation 0 |
| Check-in/complete | `TMB-CHECKED-IN/COMPLETED` | feedback | unique evidence만 Visit, completion/feedback만 Meetup/Contribution |
| Cancel/Leave | 참가 전 no mutation; 참가 후 confirmed leave | 원 Table/장소 | explicit confirmation, focus 복원 |
| Return | exact Table/chat/venue surface | 이어서 하기 | valid token만 one-shot; invalid는 safe map |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| list→detail | 240–320ms standard | thumbnail/title shared emphasis, scroll top 안정 | 즉시 detail+focus |
| Join sheet | 220–280ms emphasized decel | Table header 고정, backdrop/surface 동시 | 즉시 sheet |
| gate body swap | 160–200ms | 현재 축 body만 교체 | 즉시 state |
| requesting→confirmed | 220–360ms spring-lite | seat ring/membership object morph, confetti 없음 | static state+live region |
| send→sent/failed | 160–220ms | 같은 bubble 자리, layout jump 0 | 즉시 glyph/text 변경 |
| check-in/feedback result | 220–360ms | 해당 reputation segment만 한 번 변화 | 즉시 delta label |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Detail title | 함께 먹을 Table | Join this table | このテーブルに参加 | 장소/시간이 바로 이어짐 |
| Primary CTA | 이 Table 참여 | Join this table | このテーブルに参加 | generic Continue 금지 |
| Fixture truth | 실제 host에게 예약이 전송되지는 않아요 | This does not send a booking to a real host | 実際のホストには予約送信されません | Join 직전 한 번 |
| Full | 자리가 찼어요 | This table is full | 満席です | 대체 행동과 함께 |
| Retry | 다시 요청 | Try again | もう一度リクエスト | same Table |
| Chat locked | 참여가 확인되면 대화할 수 있어요 | Chat opens after you join | 参加確認後にチャットできます | access reason |
| Image failure | 사진을 보내지 못했어요 | Photo wasn’t sent | 写真を送信できませんでした | Retry/remove 노출 |
| Check-in | 도착 확인 | Check in | チェックイン | evidence 결과 예고 |
| Feedback | 피드백 남기기 | Leave feedback | フィードバックを送る | 대상/범위 명시 |
| Safety | 신고 / 차단 / 나가기 | Report / Block / Leave | 報告 / ブロック / 退出 | icon-only 금지 |
| Report consequence | 외부 운영팀에는 전송되지 않아요. 현재 화면에 신고 기록만 남아요. | This is not sent to an external moderation team. Only a report record is kept here. | 外部の運営チームには送信されません。ここに報告記録だけが残ります。 | confirm 전 visible; 구현 용어 없이 membership 불변 |
| Block consequence | 현재 대화에 차단 선택만 남아요. 실제 계정이나 Table 참여는 바뀌지 않아요. | Only your block choice is kept in this chat. The real account and Table membership do not change. | このチャットにブロックの選択だけが残ります。実際のアカウントやTable参加状態は変わりません。 | fixture scope를 과장하지 않음 |
| Leave consequence | 나가면 대화가 닫혀요. 다시 참여하려면 새로 요청해야 해요. | Leaving closes chat. You’ll need a new request to join again. | 退出するとチャットが閉じます。再参加には新しいリクエストが必要です。 | `TMB-LEFT`, `CHA-LOCKED` |
| Confirm / Cancel | 계속 / 취소 | Continue / Cancel | 続ける / キャンセル | destructive confirmation의 두 행동 |

- provider/state/fixture ID는 normal copy에 쓰지 않는다. Table의 6 facts와 safety 동사는 prose-off 대상이 아니다.
- 장소 고유명 외 결정 문구는 ellipsis 금지, CTA 최대 2줄을 허용한다.

## 9. Accessibility·responsive

- 320×568/800과 360×800은 single-column, 390×844/430×932는 동일 우선순위+media 확장; horizontal overflow 0.
- 844×390은 detail/chat 모두 하나의 internal scroll과 sticky header/footer를 쓰며 desktop rail은 나타나지 않는다.
- row, seat control, close, composer, safety action은 최소 44px, 주요 CTA 52–56px, critical gap 8px다.
- 200% zoom에서 6/6 fact label/value, 실제 예약 truth, failure Retry, safety confirmation, composer가 footer에 가리지 않는다.
- VoiceOver/TalkBack은 media alt→Table name→time/seats/format→remaining facts→truth→CTA 순서다.
- pending/sent/failed는 색 외 glyph+localized status+live region으로 구분한다.
- focus trap/background inert/Escape를 sheet에 적용하고 close/result 뒤 opener focus를 복원한다.
- Report/Block/Leave confirmation은 제목→대상→consequence→확정→취소 순서로 읽고, 취소가 destructive primary보다 focus order에서 사라지지 않는다.
- forced colors에서 availability, selection, delivery status가 border/text로 남고 사람 이미지는 정보 전달의 유일 수단이 아니다.

## 10. 계측·완료 기준

### UX signal

- Join 전 6/6 fact 노출, Table open→Join, join failure→same-Table Retry, confirmed→chat 진입을 측정한다.
- message/image lifecycle별 bubble 상태와 duplicate send 0, safety actions≤2 taps를 기록한다.
- gate/Join/chat/check-in/feedback 단계별 expected state mutation whitelist를 비교한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] List는 time/seats/format, Detail Join 전에는 6 facts 모두 icon+label+value로 보인다.
- [ ] Table photo/people/time/seat가 행정형 prose를 대신하되 source/합성 범위를 지킨다.
- [ ] Join 직전에 실제 host 예약 미전송 truth가 한 번 보인다.
- [ ] canonical gate queue와 exact `JOIN_TABLE/OPEN_CHAT` return을 사용하고 modal을 쌓지 않는다.
- [ ] nonmember chat 0, confirmed member chat open, organizer cancel 시 safe lock을 검증한다.
- [ ] text/image pending/sent/fail/retry/remove가 모두 존재하고 실패를 sent처럼 표시하지 않는다.
- [ ] check-in/completion/feedback evidence만 지정 reputation 축을 바꾸며 aggregate score가 없다.
- [ ] Report/Block/Leave는 labeled action으로 2 taps 안에 도달하고 confirmation을 가진다.
- [ ] Report/Block은 local fixture receipt 외 membership/account 제재를 만들지 않고, Leave만 명시적 confirmation 뒤 `TMB-LEFT + CHA-LOCKED`를 만든다.
- [ ] draft text·사진/blob/object URL은 return envelope·URL·browser persistence에 없고 app lifetime memory에서만 보존된다.
- [ ] KO/EN/JA와 320/360/390/430/844×390, 200% zoom, keyboard, SR, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-008/009/010/015` | meetup/profile boundary, photo/chat lifecycle, independent reputation 유지 | requirement reachability |
| State | `TAV-*`, `TMB-*`, `TFR-*`, `CHA-*`, `MSG-*`, `UPL-*`, Visit/Meetup/Contribution | 같은 object hierarchy와 shared sheets로 시각화 | transition+mutation whitelist |
| Fixture | `FX-TBL-SEOUL-DINNER`, `FX-TBL-ALCOHOL`, `FX-TBL-JOIN-SUCCESS`, `FX-TBL-JOIN-FAIL`, `FX-TBL-CANCEL`, `FX-TBL-CHECKIN-SUCCESS`, `FX-TBL-COMPLETE`, `FX-MSG-TEXT-PENDING`, `FX-MSG-TEXT-SUCCESS`, `FX-MSG-TEXT-FAIL`, `FX-MSG-IMAGE-PENDING`, `FX-MSG-IMAGE-SUCCESS`, `FX-MSG-IMAGE-FAIL`, `FX-REP-AFTER` | 각 failure/result를 동일 품질로 보존 | deterministic scenario E2E |
| returnTo | `JOIN_TABLE`, 필요 시 `OPEN_CHAT` | envelope에는 valid tableId↔venueId만; camera/facts/scroll/focus는 public navigation context, draft는 memory-only | one-shot/registry pair/deep-link/privacy tests |
| Persistence | non-sensitive membership/outcome/message metadata는 demo session | raw image/blob/profile proof는 URL/localStorage 금지 | storage/object URL audit |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | List는 비교 핵심, Detail은 Join 결정을 위한 6 facts | list density를 줄이고 사실·안전·failure 기능은 삭제하지 않음 |
| D2 시각·인터랙션 | photo-led list, seat/time/people object, same-position lifecycle morph | shared MediaCard/FactStrip/Sheet, sticky obstruction 0, bubble-local recovery |
| D3 신뢰·접근성 | 실제 예약 범위, separate state axes, consequential verbs 보존 | Join truth 전면, icon+label+value, Report/Block/Leave text 유지 |

잔여 이견: `없음`. List에 6개 fact를 모두 넣는 안과 Detail에서 icon-only로 줄이는 안을 모두 기각했다.
