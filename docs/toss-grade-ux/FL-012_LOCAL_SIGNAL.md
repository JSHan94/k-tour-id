# FL-012 · Local Signal and first contribution

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-003`, `REQ-007`, `REQ-009`, `REQ-015` |
| 진입 행동 | canonical place detail의 `지금 분위기 남기기` |
| 성공 결과 | draft 작성 뒤 Submit에서 Account→Person JIT; accepted unique evidence만 해당 Visit/Contribution 축을 변화시키고 같은 place로 복귀 |
| 취소 결과 | draft를 `계속 작성` 또는 `버리기`로 명시 선택; gate 취소는 exact draft와 place를 보존 |
| 실패·재시도 | photo prepare/save/Person unavailable을 구분하고 preview·tags·note를 유지한 채 replace/remove/retry |
| 정확한 복귀 | `SUBMIT_LOCAL_SIGNAL` one-shot과 registered `venueId`; raw draft/photo는 envelope/URL 밖 originating task memory에 유지하고, gate return은 이미 열린 그 draft로 복귀 |
| 실행 truth | photo/note는 preview-only이고 외부 업로드·공개 게시물 없음; normal provider-unavailable은 Person success 없음; explicit review fixture만 simulated result |

### 삭제할 수 없는 PRD 불변식

- 사용자는 Account/Person gate 전에 venue, signal chips, note, photo preview를 만들 수 있다.
- `SUBMIT_LOCAL_SIGNAL` full plan은 `account→person`; venueId required, tableId forbidden이다.
- 사진은 JPEG/PNG/WebP, 최대 10MB, preview/replace/remove/failure/retry를 유지한다.
- raw note/photo/blob/object URL은 URL, return envelope, localStorage, sessionStorage에 넣지 않는다.
- photo preview는 upload/sent가 아니며 Table chat `chat_image`, `MSG-*`, `CHA-*`와 결합하지 않는다.
- success가 바꿀 수 있는 reputation은 accepted evidence에 해당하는 Visit/Contribution뿐이다.
  Person, Meetup, stamp, public ONDO heat, source/official state는 바꾸지 않는다.
- `venueId + subjectRef + evidenceRef` idempotency로 중복 증가를 막는다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| 사진·태그보다 storage/identity boundary 문장이 크게 보인다 | 현장 경험보다 데모 기술을 먼저 읽고 contribution 의욕이 떨어진다 | P1 | `local-signal-privacy`, long `boundaryBody` |
| Person check가 draft 전 또는 별도 setup처럼 느껴질 수 있다 | 가치를 경험하기 전에 ID flow로 이탈하고 초안이 사라질까 불안하다 | P1 | gate handoff/state copy |
| bottom sticky action과 긴 privacy/error가 작은 화면에서 겹칠 수 있다 | 320/short landscape에서 note/photo/retry/CTA가 잘린다 | P1 | local signal full sheet/footer |
| `UPL-SENT` 시각이 실제 사진 업로드처럼 보일 수 있다 | 외부 공개·전송이 없는데 게시 완료로 오해한다 | P0 | upload state naming vs consumer result |
| 성공이 온도·stamp·Meetup까지 바꾼 듯한 celebration을 만들 여지가 있다 | signal 범위보다 큰 신뢰·인기 효과를 오인한다 | P0 | success/reputation presentation |
| gate 실패별 결과는 있으나 원 draft와 focus 복원을 시각적으로 증명하지 못한다 | retry 때 사진·메모를 다시 만들거나 submit을 중복 실행할 수 있다 | P1 | gate return branches |

## 3. 목표 경험

### 한 문장 약속

> 장소에서 본 분위기를 사진과 신호로 먼저 담고, 남기는 순간에만 필요한 확인을 거쳐 같은 초안으로 돌아온다.

### 사용자가 1초 안에 알아야 하는 것

- 어느 장소에 무엇을 남기는지.
- 최소 한 개 signal을 고른 뒤, photo/note는 optional preview라는 것.
- 남기기 직전 필요한 Account/Person 확인이 있어도 초안은 그대로라는 것.
- 사진과 메모는 공개되거나 외부로 전송되지 않는다는 결과 범위.

### 사용자가 읽지 않아도 알아야 하는 것

- venue photo/name가 header에 고정돼 대상이 분명하다.
- 2×2 pictogram chip과 live photo slot이 form을 설명보다 먼저 보여준다.
- selected chip, photo preview, draft count가 gate 전후 pixel-stable하게 남는다.
- success 뒤 Visit/Contribution segment만 morph하고 temperature/stamp/Meetup은 움직이지 않는다.

## 4. 권장 모바일 여정

```text
ENTRY · exact venue detail
→ DECISION · choose at least one visual signal; optional note/photo
→ PHOTO PREVIEW | PHOTO FAILURE→REPLACE/REMOVE/RETRY
→ SUBMIT
→ if unmet: FL-010 Account → Person method/check in same anchored sheet
   → CANCEL/UNAVAILABLE/FAILURE returns to exact draft
   → SUCCESS keeps same token until all guards pass
→ revalidate full plan + venue + still-owned in-memory draft
→ consume token once immediately before local signal mutation
→ PENDING · local save, duplicate locked
→ TERMINAL · SUCCESS: exact venue; Visit/Contribution eligible diff only
  | CANCEL: exact draft kept or explicitly discarded
  | ERROR: photo/gate/save failure at its source object
→ RETRY · replace/remove/retry in place with the same in-memory draft
→ RETURN · same venue section/opener focus
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 지금 이곳은 어떤가요? | venue hero thumbnail/name | signal 선택 | city/camera/venue/sheet/scroll/focus |
| Draft | 무엇을 남길까요? | 2×2 signal pictograms + note/photo slot | 최소 1개 chip | venue, selected tags, note, photo preview |
| Photo | 이 사진을 쓸까요? | stable media preview | 교체 / 삭제 | tags/note/layout anchor |
| Submit | 이 신호를 남길까요? | compact draft summary + public/local scope | 남기기 | originating task remains mounted; raw media memory-only |
| Gate | 지금 필요한 확인을 할까요? | same venue/draft header + one unmet gate | account/person action | exact draft, token unconsumed |
| Pending | 저장 중인가요? | submit control inline progress | wait | duplicate locked, all draft data |
| Success | 무엇이 달라졌나? | Visit/Contribution segments only | 장소로 돌아가기 | heat/stamp/Meetup/source unchanged |
| Failure | 어디서 다시 시작할까? | failure at photo/submit/gate object | retry/replace/remove/not now | exact draft preserved |
| Return | 같은 장소인가? | canonical venue detail + contribution state | continue exploring | section/scroll/opener focus |

## 5. 화면별 상세 규격

### Full task A · Visual draft

**목적**

- 기술 form이 아니라 현장 관찰을 빠르게 담게 한다.

**첫 viewport에 보이는 것**

- back/close, venue thumbnail/name/source glyph, 질문, four primary signal pictograms,
  optional note/photo row, sticky `남기기`.

**시각·인터랙션**

- 390 기준 edge 20px, single scroll, sticky footer 52–56px+safe area.
- signal chip은 icon+short label+check, 최소 44px; color dot-only는 금지한다.
- note는 optional, 240자; counter는 입력 후에만 보인다.
- photo slot은 4:3, loading/error에도 height fixed by aspect-ratio; source image와 혼합하지 않는다.
- gate 전 draft 작성 전체가 가능하고 submit만 guard를 건다.

**행동**

- Primary: 최소 1 chip 뒤 `이 신호 남기기`.
- Secondary: photo `추가/교체/삭제`, close 시 `계속 작성/초안 버리기`.
- Close/Back: unsaved draft choice sheet; accidental loss 금지.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | venue, selected signals, photo/note optionality, submit, `공개되지 않음` consequence |
| 시각화 | pictogram chips, photo preview, draft state |
| 한 번 접기 | 데이터와 보관: place/tags/time만 local record, photo/note discarded |
| Labs/개발 문서로 이동 | `UPL-*`, fixture IDs, object URL, idempotency internals |
| 삭제 | `on-device check`, provider/architecture, public heat change claim, technical storage wall |

### Decision sheet B · Account/Person JIT

**목적**

- 완성된 draft를 anchor로 지금 unmet gate 하나만 처리한다.

**첫 viewport에 보이는 것**

- venue + selected signal count + photo thumbnail, current Account 또는 Person question,
  primary and `나중에`.

**시각·인터랙션**

- `FL-010` shared Decision sheet, content-fit≤72dvh; no nested modal.
- Account success 뒤 Person이 남으면 same header/shell body만 160–200ms 교체한다.
- provider unavailable은 Person 상태를 올리지 않고 exact draft로 돌아갈 action을 보인다.
- explicit review fixture success는 provenance를 folded detail에 남기되 official/live로 표현하지 않는다.

**행동**

- Primary: current gate-specific confirm.
- Secondary: `나중에` → exact draft.
- Close/Back: no signal mutation; opener/draft restore.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | original draft object, requester/purpose/predicate, unavailable/failure/recovery |
| 시각화 | current one-gate icon and unchanged draft thumbnail/chips |
| 한 번 접기 | provider, retention, review-fixture/local result truth |
| Labs/개발 문서로 이동 | adapter/protocol/raw fixture diagnostics |
| 삭제 | future gate badges, K-Tour setup marketing, `minimum check`, generic status wall |

### Result C · Local signal outcome

**목적**

- 실제 변경된 축과 외부 전송이 없는 범위를 짧고 정확하게 보여준다.

**첫 viewport에 보이는 것**

- venue, saved signal glyphs/time, Visit and/or Contribution changed segments, `장소로 돌아가기`.

**시각·인터랙션**

- success is 220–360ms state morph, not confetti/full-screen badge.
- photo preview fades out only after local mutation final; raw object URL revoked on close/remove.
- ONDO heat, stamp ring, Meetup, official/source glyph do not animate.

**행동**

- Primary: `장소로 돌아가기`.
- Secondary: `내가 남긴 신호 보기` if local record exists.
- Close/Back: same venue section/opener.

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | changed Visit/Contribution axes, venue, local-only/public-none result |
| 시각화 | eligible segment morph and signal glyphs |
| 한 번 접기 | evidence reference/time, stored-field list |
| Labs/개발 문서로 이동 | canonical envelope, fixture/provenance, domain diff |
| 삭제 | `uploaded/published/verified`, temperature increase, stamp or Meetup celebration |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | current draft remains; no extra prose before 800ms | wait/cancel | raw draft memory, no mutation |
| Empty | no chip selected: primary disabled with concise hint | select a signal | venue/photo/note unchanged |
| Photo failure | error in media slot, preview anchor stable | retry / another photo / remove | tags/note unchanged, no sent state |
| Gate failure/unavailable | one InlineStatus in gate, then exact draft | retry/alternate/not now | Person unchanged unless valid success, token unconsumed |
| Submit failure | `저장하지 못했어요` by primary | retry / keep draft | Visit/Contribution and all other axes unchanged |
| Retry | same still-mounted photo/draft | retry | no new envelope unless old invalidated safely |
| Draft memory lost | safe venue detail, no recovered-draft claim | start again | token cleared; signal/reputation mutation 0 |
| Cancel | keep/discard explicit; gate cancel defaults keep | continue editing / discard | no local signal mutation |
| Success | `UPL-SENT` internal, consumer sees local signal saved | return | only accepted Visit/Contribution changes; idempotent |
| Return | canonical venue and opener focus | continue | camera/venue/section/scroll retained |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| Place→full task | 240–320ms route | venue thumbnail/name shared anchor; no white flash | instant route+title focus |
| Chip select | 90–120ms ease-out | no chip displacement; check appears in place | immediate state |
| Photo decode→preview | 160–200ms opacity | 4:3 slot height fixed, no layout shift | instant preview+status |
| Draft→gate | 220–280ms sheet | venue/draft mini-header remains anchored | instant sheet+heading focus |
| Account→Person | 160–200ms | same sheet/header, body swap only | instant swap+focus |
| Success→venue | 220–360ms | eligible segments morph; venue anchor persists | instant state+focus/live region |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Title | 지금 이곳은 어떤가요? | What is it like here now? | 今、この場所はどんな様子ですか？ | one question |
| Photo action | 사진 추가 | Add a photo | 写真を追加 | optional visual action |
| Submit | 이 신호 남기기 | Add this signal | この情報を残す | upload/publish 금지 |
| Scope | 사진과 메모는 공개되지 않아요 | Your photo and note won’t be public | 写真とメモは公開されません | decision consequence |
| Gate escape | 나중에 | Not now | あとで | exact draft retained |
| Photo retry | 사진 다시 시도 | Retry photo | 写真をもう一度試す | media slot recovery |
| Save failure | 저장하지 못했어요 | We couldn’t save this | 保存できませんでした | draft remains |
| Return | 장소로 돌아가기 | Back to this place | この場所に戻る | exact venue |

- `upload`, `publish`, `verified contribution`, `on-device`, provider/adapter를 normal title/CTA에 쓰지 않는다.
- external/public scope는 아이콘만으로 숨기지 않고 submit 가까이에 위 한 줄을 둔다.
- JA/KO long text at 200% zoom gets content-fit rows; no decision ellipsis.

## 9. Accessibility·responsive

| Viewport | 구현 규격 | 통과 기준 |
|---|---|---|
| 320×568/800 | edge 16px, 2×2 chips or one-column at 200%, single body scroll, sticky footer | last note/photo/retry not covered; close/title/primary reachable; x-overflow 0 |
| 360×800 | edge 16px, 4:3 media | photo actions and error remain in slot |
| 390×844 | edge 20px canonical | venue + question + four signals in first viewport |
| 430×932 | edge 20px | media grows; no extra technical copy |
| 844×390 | left draft media/right fields in one full-task grid; one scroll, rail off | close/question/primary/retry reachable, no double sticky |

- all chips/photo actions/close≥44px, primary 52–56px, adjacent critical gap≥8px.
- file input has localized accessible name; preview alt describes preview, not venue evidence.
- focus after photo error goes to error heading then retry; remove returns to add-photo control.
- focus trap/background inert during gate; cancel returns to submit button/draft location.
- forced colors use check/border/label; `aria-live` announces preview/pending/failure/result once.

## 10. 계측·완료 기준

### UX signal

- `signal_draft_started`, `signal_selected`, `photo_previewed/failed/retried/removed`,
  `submit_requested`, `gate_returned_to_draft`, `signal_saved`, `duplicate_blocked`를 분리한다.
- success event includes changed-axis allowlist; raw note/photo/file name is never analytics payload.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] draft is fully editable before Account/Person and exact after gate cancel/failure/unavailable while the originating task remains mounted.
- [ ] reload/memory loss never invents a non-canonical envelope field; it clears the token and returns safely to the registered venue with mutation 0.
- [ ] raw photo/note never enters URL, return envelope, localStorage, sessionStorage, analytics.
- [ ] photo preview/replace/remove/failure/retry works without layout shift or false sent state.
- [ ] public default provider-unavailable leaves Person/signal/reputation unchanged; review fixture provenance is preserved.
- [ ] token is consumed once immediately before validated signal mutation; duplicate evidence does not increment axes.
- [ ] success changes only eligible Visit/Contribution; heat/Person/Meetup/stamp/source remain unchanged.
- [ ] sticky footer overlap is 0 in all required viewports and keyboard states.
- [ ] KO/EN/JA and 320/360/390/430/844×390, 200% zoom, forced colors, reduced motion pass.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-003`, `REQ-007`, `REQ-009`, `REQ-015` | visual draft→Submit gates→exact draft→limited reputation result | `SCN-014-LOCAL-SIGNAL` |
| State | `UPL-IDLE/PREVIEW/REMOVED/FAILED/SENDING/SENT`; Account/Person gates; four reputation axes | photo lifecycle and gate separate; Visit/Contribution allowlist | domain/mutation diff |
| Fixture | `FX-UPL-PHOTO-PREVIEW`, `FX-UPL-PHOTO-REMOVED`, `FX-UPL-LOCAL-SIGNAL-SUCCESS`, `FX-UPL-LOCAL-SIGNAL-FAIL`, canonical Account/Person fixtures | all pending/fail/retry/cancel/success branches | deterministic fixture matrix |
| returnTo | `SUBMIT_LOCAL_SIGNAL`, account→person, venue required/table forbidden | canonical envelope carries only registered public context; still-mounted task owns draft memory | forged/expired/duplicate/exact-draft/memory-loss tests |
| Persistence | raw draft/photo object URL memory only; accepted non-sensitive metadata session/local scope per model | revoke on remove/close, no raw media persistence | storage/URL/analytics inspection |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | draft first, Submit에서 gates, 기술 form 축소 | one visual draft, one submit, exact return |
| D2 시각·인터랙션 | pictogram/media-led composition, stable sheet/footer, limited result morph | 2×2 signals, 4:3 preview, same venue anchor, no false celebration |
| D3 신뢰·접근성 | raw media/privacy/provider truth와 mutation allowlist | public-none line, memory-only raw data, fail-closed default, a11y recovery |

잔여 이견: `없음`.
