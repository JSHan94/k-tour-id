# X-04 · Loading, motion, responsive, recovery

상태: `CROSS-FLOW SPEC · PEER-REVIEWED · IMPLEMENTATION READY`

## 1. 목적

Loading과 transition을 장식이 아니라 맥락 연속성으로 설계한다. 사용자는 화면이
바뀌었다고 느끼기보다 자신이 선택한 도시·장소·행동에 더 가까이 이동했다고 느껴야
한다. 실패·취소·느린 네트워크에서도 같은 객체를 잃지 않는다.

## 2. Motion roles

| role | duration | easing | 허용 대상 | 금지 |
|---|---:|---|---|---|
| Tap | 90–120ms | ease-out | press, selected state | hit target 이동 |
| Inline | 160–200ms | standard | row/status replace | layout jump |
| Sheet | 220–280ms | emphasized decel | open, close, snap | bounce loop |
| Route | 240–320ms | standard | full-task axis | 흰 중간 screen |
| Map focus | 420–500ms, hard cap 520ms | smooth cubic | camera, stable labels | map remount |
| Result | 220–360ms; stamp만 최대 500ms | spring-lite | state/stamp ready object | 무한 confetti/pulse |

60fps 목표로 `transform`, `opacity`, map camera만 animate한다. blur·shadow·large filter를
frame마다 바꾸지 않는다.

## 3. 첫 지도 choreography

첫 프레임부터 실제 MapLibre canvas가 있어야 한다.

```text
0ms      cached/base geography visible
0–280ms  coast and thin route settle
140–360ms Seoul/Busan/Jeju coverage fields bloom once
220–420ms city core and labels appear
after useful content headline/action becomes available
tap≤80ms immediate selected halo
tap≤100ms same camera easeTo(city) starts
≤500ms   target settles; hard cap 520ms
>60% camera progress city search/filter begins to reveal
end       focus moves to city heading or selected map object
```

- headline는 지도 위 한 영역을 덮되 tilted/rotated panel을 쓰지 않는다.
- label은 camera 이동 중 screen position을 임의 보정하지 않고 map coordinate에 고정한다.
- user가 tap하면 animation queue를 취소하고 최신 target으로 한 번만 이동한다.
- Back은 atlas를 새로 렌더하지 않고 이전 camera/filter/sheet state를 복원한다.
- initial settle와 city focus 모두 label·beacon의 map coordinate를 공유한다. CSS로 label을
  따로 translate하거나 hover 시 target hitbox를 옮기지 않는다.

## 4. Map loading contract

| 시간·상태 | foreground | background | 사용자 행동 |
|---|---|---|---|
| cached | 이전 map/list/selection | tile refresh | 계속 탐색 |
| 0–800ms | 설명 없음 | compact object progress | 취소/다른 tab |
| 800ms–5s | 해당 city/place에 progress | map context 유지 | List 보기 |
| 5s+ | 같은 query/filter의 List foreground | map retry | 장소 탐색/재시도 |
| tile fail | List + selected place | muted map skeleton | search/filter/directions |

full-screen spinner, 빈 white canvas, `Loading map...` modal을 사용하지 않는다.

## 5. General loading

- button pending은 label width를 유지하고 중복 tap을 막는다.
- list refresh는 기존 item을 지우지 않고 top progress 또는 stale state로 표시한다.
- image loading은 고정 aspect-ratio skeleton을 사용해 layout shift를 막는다.
- credential/payment pending은 decision sheet의 대상과 금액을 그대로 유지한다.
- 800ms 이내의 빠른 mutation에는 별도 helper copy를 띄우지 않는다.

## 6. Sheet·modal responsive contract

| variant | portrait | short landscape | scroll owner |
|---|---|---|---|
| Peek | content-fit, max 32dvh | compact bottom, max 46dvh | body only if necessary |
| Decision | content-fit, max 72dvh | 844×390은 width 360–430px side sheet | body; header/footer sticky |
| Detail | 88dvh | 844×390은 width 360–430px, 100dvh side panel | body |
| Full task | 100dvh route | two-column 또는 100dvh route | task content |

- PageHeader가 있으면 top handle을 제거하고 back 또는 close 중 하나만 둔다. handle을 쓰는
  drag sheet는 별도 header row를 확보하며 handle·title·close를 같은 좌표에 겹치지 않는다.
- primary CTA는 sticky footer에 있고 `env(safe-area-inset-bottom)` 위에 놓인다.
- content bottom padding은 footer의 실제 ResizeObserver height를 반영한다.
- CTA와 `Not now`가 viewport 아래로 잘리지 않는다.
- overlay stack은 한 번에 하나다. 다음 gate는 같은 shell body가 바뀐다.
- sheet 높이는 content-fit+semantic max로 계산하며 screenshot 전용 고정 px height,
  `position: fixed` footer, negative margin으로 맞추지 않는다. 844×390 side sheet는 하나의
  body scroll과 sticky header/footer를 쓰고 dock/rail을 동시에 노출하지 않는다.

## 7. Responsive matrix

### Required viewports

| viewport | 판단 대상 |
|---|---|
| 320×568 | 최소 높이, header/body/footer 도달, browser chrome·safe area |
| 320×800 | 최장 copy, 2줄 CTA, compact dock, sheet fit |
| 360×800 | 저가 Android baseline |
| 390×844 | source composition |
| 430×932 | large phone whitespace와 media |
| 768×1024 | tablet composition |
| 844×390 | short landscape, keyboard/rail/sheet collision |
| 1440×900 | desktop max-width/rail/map balance |

각 required viewport는 EN/KO/JA와 default/200% zoom을 건너뛰지 않는다. map을 포함한
surface는 light/After19를 모두, motion이 있는 전이는 default/reduced motion을 모두
검증한다. 화면에 해당하지 않는 mode만 명시적 N/A로 기록한다.

### Breakpoint보다 container

- component는 가능한 한 container size로 horizontal/vertical layout을 선택한다.
- 320 전용 negative margin 또는 특정 pixel position override를 금지한다.
- long name/translation은 component height를 늘리고 다른 action을 밀어내되 가리지 않는다.
- min-content overflow를 막기 위해 interactive row에 `min-width: 0`과 wrap 규칙을
  명시한다.
- page/sheet의 실제 clipping boundary는 axis-aligned box다. `rotate`, `skew`, large
  pseudo-element transform으로 panel edge를 만들지 않고, `overflow: hidden`은 source
  media crop과 정해진 radius 외에는 사용하지 않는다.

## 8. Error·empty·offline grammar

모든 recovery는 `문제의 객체 + 지금 상태 + 한 회복 행동`을 같은 화면에 둔다.

| 상태 | pattern | 금지 |
|---|---|---|
| Inline error | object 아래 status + retry | 중앙 technical modal |
| Empty | 유지된 context + clear filter/nearby one action | 막힌 blank card |
| Offline | cached result + offline glyph | 모든 화면 차단 |
| Expired | 대상 유지 + 다시 확인 | home reset |
| Unsupported | 가능한 대체 route | provider 용어만 표시 |
| Permission denied | control 옆 status + search 대안 | 긴 browser instruction popover |

오류 원문, stack, provider code는 Labs/log에 둔다. 금액·삭제·credential 실패는 toast만
보여주고 사라지게 하지 않는다.

## 9. Exact return

canonical gate envelope와 화면 복귀 snapshot을 같은 object로 합치지 않는다.

| 층 | 허용 내용 | 금지 |
|---|---|---|
| Canonical `ReturnToEnvelope` | `tokenId`, `cta`, canonical `gateQueue`, `activeGate`, CTA matrix가 허용한 `venueId?`/`tableId?`, `createdAt`, `expiresAt`, `consumedAt?` | camera, query, amount, source, draft, unknown field |
| Shell local snapshot | tab, city, map camera, query, filters, category, sheet variant/snap, scroll, opener focus | raw identity/media/payment instrument |
| Domain memory | checkout merchant/offer/final KRW와 non-sensitive draft, Table/Local Signal의 현재 draft | URL 또는 gate envelope 직렬화 |

- token은 정확히 `RT-${cta}-${Date.parse(createdAt)}`이고 CTA별 required/forbidden ID
  matrix를 통과해야 한다. unknown field가 있으면 envelope 전체를 폐기한다.
- success는 full required gate plan을 다시 검증한 뒤 원 mutation 직전에 one-shot
  consume한다. cancel은 원 공개 context 복구 뒤 gate를 삭제하고 retry만 같은 미소비
  envelope를 유지한다.
- invalid/expired/tampered/duplicate context는 기술 toast 없이 가장 가까운 안전한
  map/list로 돌아간다.
- 개인정보·원본 문서·사진 blob·결제수단은 envelope, local snapshot, URL에 넣지 않는다.

## 10. Reduced motion

- map focus는 `jumpTo` 또는 0ms로 바꾸되 target/zoom/resulting controls가 같다.
- sheet는 opacity replace; focus 순서와 scroll restoration은 같다.
- heat aura는 정적 band로 보이고 색·border·accessible name이 의미를 제공한다.
- result celebration은 생략하지만 resulting count/state는 즉시 읽힌다.
- OS setting을 앱 session 중 바꿔도 다음 motion부터 적용한다.

## 11. Performance budgets

- 첫 usable map 또는 semantic List: cached 환경 1.5s 목표, slow path 5s recovery 필수.
- route/sheet interaction input feedback: 100ms 이내.
- CLS: map/media/sheet open에서 0.1 이하 목표.
- animation 중 long task 50ms 이상 0개 목표.
- image는 viewport 적합 source와 lazy loading을 사용하되 first place hero는 우선한다.

수치는 구현 단계에서 측정하고 환경·결과를 evidence manifest에 기록한다.

## 12. Adversarial visual cases

- 320px + 일본어 + 200% zoom + keyboard open
- 844×390 + Decision sheet + dock/rail
- After19 + tile fail + selected locked venue
- map loading 6초 + filter active + selected place
- language switch while detail sheet open
- account gate cancel after Table draft
- payment failure after amount confirmation
- image failure across five consecutive place cards
- browser back during camera transition
- rapid Seoul→Busan→Jeju tap

## 13. Acceptance criteria

- [ ] first entry와 atlas→city 사이 MapLibre instance가 바뀌지 않는다.
- [ ] map transition에 blank frame, tilted clipping, jumping label이 없다.
- [ ] 800ms/5s loading recovery가 query/filter/selection을 보존한다.
- [ ] 모든 sheet에서 320px와 844×390의 close/title/primary CTA가 도달 가능하다.
- [ ] safe area, keyboard, 200% zoom에서 dock/footer가 content를 가리지 않는다.
- [ ] 320×568/800·360×800·390×844·430×932·844×390에서 fixed-height/negative-margin/rotated clipping과 이중 scroll이 0개다.
- [ ] reduced motion에서 기능·focus·return 결과가 동일하다.
- [ ] failure/cancel/retry가 success와 같은 visual primitive를 쓴다.
- [ ] exact return envelope는 canonical fields만 가지며 shell/domain context가 unknown field로 섞이지 않고 private raw data가 어느 복귀 층에도 없다.
- [ ] rapid input과 browser back이 stale transition을 남기지 않는다.

## 14. PRD preservation

- D-15의 MapLibre, same-instance camera, 800ms/5s 계약을 보존한다.
- `REQ-005`의 one-shot `returnTo`와 private-data 경계를 보존한다.
- `REQ-018`의 모바일·tablet·desktop·KO/EN/JA를 보존한다.
- 모든 Flow의 Loading/Empty/Error/Retry/Cancel/Return checkpoint에 적용한다.
