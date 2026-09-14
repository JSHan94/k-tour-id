# Wave 0 · executable QA coverage matrix

상태: `EXECUTABLE MANIFEST · IMPLEMENTATION GAPS OPEN · 2026-09-04`

이 문서는 Toss-grade UX 명세를 구현할 때 “테스트 파일이 많다”를 “완료됐다”로
오해하지 않게 하는 실행 원장이다. 앱 코드는 이 문서만으로 합격하지 않는다.
각 Flow 구현 직후 해당 Flow의 adversarial QA를 닫고, 마지막에 Overview 기준으로
전역 회귀를 다시 통과해야 한다.

## 1. 실행 원장

- 코드 원장: `k-tour-id-app/tests/helpers/toss-grade-wave0-manifest.ts`
- 계약 검사: `k-tour-id-app/tests/contracts/toss-grade-wave0-coverage.spec.ts`
- 정규 브라우저 증거: `k-tour-id-app/tests/e2e/ondo-b-flow-coverage.spec.ts`
- 정규 pixel 연결: `k-tour-id-app/tests/helpers/ondo-b-visual-evidence.ts`
- 설계 원장: `docs/toss-grade-ux/00_OVERVIEW.md`

실행 계약은 다음 6,240개 target cell을 빠짐없이 생성한다.

```text
52 Flow↔REQ links
× 3 locales (EN/KO/JA)
× 8 required viewports
× 5 attacks (success/cancel/failure/retry/exact-return)
= 6,240 tracked target cells
```

여기서 `tracked`는 자동 합격을 뜻하지 않는다. target cell이 manifest에서 사라지지
않는다는 뜻이며, 구현 Wave에서 browser/pixel/a11y evidence를 연결해야 `closed`가 된다.

## 2. 필수 화면 크기

| ID | 목적 |
|---|---|
| `320×568` | 최소 높이, safe area, footer/CTA 도달 |
| `320×800` | 좁은 폭, 최장 번역, 2줄 CTA |
| `360×800` | Android 기준 |
| `390×844` | 기준 모바일 composition |
| `430×932` | 큰 모바일 whitespace/media |
| `768×1024` | tablet composition |
| `844×390` | short landscape, dock/sheet/keyboard 충돌 |
| `1440×900` | desktop max-width/map/rail 균형 |

기본 matrix 외에 모든 motion Flow는 reduced-motion, 정보 구분 화면은 forced-colors,
입력 화면은 keyboard open, 모든 Flow는 200% zoom을 별도 adversarial lane으로 갖는다.

## 3. 현재 증거와 새 목표의 차이

| 축 | 현재 확인된 증거 | 새 명세 목표 | 판정 |
|---|---|---|---|
| Flow | `FL-001..018` browser journey 존재 | 18개 유지 | 구조상 covered |
| Checkpoint | 18×7=126 browser checkpoint | 전부 actual evidence | covered; onboarding Retry의 잘못된 N/A 3건 수정 |
| REQ | 기존 PRD trace와 Flow registry가 따로 존재 | Flow 문서의 52 REQ link와 실행 manifest 일치 | contract covered |
| Acceptance | Flow별 산재 | Flow 195개 + X-screen 41개 항목 census | contract tracked, 구현 판정 open |
| Locale | shared pixel baseline은 EN/KO; 일부 별도 JA test | 모든 Flow EN/KO/JA | **P0 gap** |
| Viewport | shared pixel은 360×800, 390×844, 430×932, 768×1024, 801×1000, 1440×1000 | 위 필수 8종 | **P0 gap**: 320×568/800, 844×390, 1440×900 full-flow |
| 조합 | 각 visual case가 한 locale을 소유 | Flow×REQ×locale×viewport×attack | **P0 gap**: full combination evidence 없음 |
| 기본 QA 실행 | `qa:b`가 flow coverage 중 일부만 grep 실행 | 변경 Flow 전체 + 전역 critical journey 실행 | **P0 gap** |
| a11y | 일부 shell/profile/identity/flow test | 18 Flow keyboard/SR/forced-colors/200% | **P1 gap** |
| motion | 일부 화면 전환·snapshot | same MapLibre, queue cancel, reduced motion, stale transition 0 | **P1 gap** |

## 4. Flow별 연결

| Flow | REQ | acceptance | 현재 primary evidence | 구현 직후 adversarial focus |
|---|---|---:|---|---|
| FL-001 Guest Discover | 007/013/017/018/019 | 12 | flow coverage + map truth | same MapLibre, 세 도시 renderer, tile fail/List, exact history |
| FL-002 exact After19 venue | 005/012 | 11 | flow coverage + place return | public fail-closed, one-shot, cancel/fail/expiry exact venue |
| FL-003 Table/chat/feedback | 008/009/010/015 | 12 | flow coverage + consumer Table | six facts, image lifecycle, safety, raw draft privacy |
| FL-004 Checkout/stamp | 006/011/016 | 12 | flow coverage | KRW/USD truth, no-funds invariant, receipt≠visit≠stamp |
| FL-005 Korean CX | 001/005 | 14 | flow coverage + person route | Person-only mutation, setup≠Present, unavailable truth |
| FL-006 Residence/Passport | 002/003/005 | 12 | flow coverage + person route | alternate method same sheet/token, raw media 0 |
| FL-007 short-term onboarding | 003/005/018 | 8 | flow coverage + onboarding | same map, no pre-emptive ID, persistence retry |
| FL-008 Korean local onboarding | 001/005/018 | 8 | flow coverage + onboarding | no nationality inference, locate JIT, later CX only |
| FL-009 resident onboarding | 002/005/018 | 8 | flow coverage + onboarding | no legal inference, later Residence alternate only |
| FL-010 Account gate | 005/008/011 | 10 | flow coverage + account gate | one overlay, tamper/TTL/duplicate/private-loss |
| FL-011 Save/My Korea | 005/016 | 9 | flow coverage + My Korea | bookmark exactly once, source class, scroll/focus return |
| FL-012 Local Signal | 003/007/009/015 | 10 | flow coverage + signal restoration | draft/media memory only, provider unavailable, limited axes |
| FL-013 Manual 19+ | 012 | 10 | flow coverage + global After19 | Guest escape, Age only, three-city geometry parity |
| FL-014 Auto After19 | 012 + 019 support | 12 | flow coverage + global After19 | four guards, manual-off priority, no global invert |
| FL-015 Public profile | 008/015 | 11 | flow coverage + profile | field-level private default, no aggregate score/leak |
| FL-016 Evidence/trait | 004/013/014 | 11 | flow coverage + disclosure | nonpositive states, source classes, contract-only truth |
| FL-017 Payment KYC | 005/011 | 12 | flow coverage | source noncommit, Payment-only mutation, exact amount return |
| FL-018 Labs wallet/bridge | 004/005/006/014/016 | 13 | flow coverage + wallet direction | ordered finality, asset invariance, no fake explorer/success |

## 5. Flow-local adversarial closure

각 Flow 구현 PR은 아래 순서로 닫는다.

1. 명세의 acceptance를 stable ID로 연결하고 변경 전/후 객체를 기록한다.
2. success만 보지 않고 cancel→failure→retry→success→exact-return을 같은 session에서
   공격한다.
3. Account/Person/Age/Payment/K-Tour/Reputation 독립 축의 before/after diff를 검사한다.
4. EN/KO/JA에서 320×568, 390×844, 430×932, 844×390을 우선 실행한다.
5. 개인정보·돈·공식성 Flow는 public provider-unavailable과 explicit review fixture를
   분리한다.
6. 구현자가 아닌 reviewer가 false success, stale token, duplicate mutation, clipped CTA,
   focus loss를 다시 공격한다.
7. P0/P1이 0일 때만 다음 Flow 묶음으로 넘어간다.

## 6. 전역 Overview adversarial closure

Flow-local QA 후에도 아래는 마지막에 별도로 실행한다.

- 같은 MapLibre atlas→city→place instance와 Back/Forward/reload
- icon-only 5-tab dock, tab별 scroll/selection, overlay opener focus
- 언어 변경 중 열린 place/sheet/draft/amount 유지
- 서울·부산·제주 source/temperature/media grammar parity
- Table→Person/Age→return, venue→Payment→return처럼 Flow 경계 gate chain
- Settings reset/clear가 허용 범위 밖 데이터를 지우지 않는지
- 19+ light/night geometry, 일반 심야 장소 유지, 즉시 끄기
- 6초 map failure, offline, image failure, rapid city tap, browser Back during camera
- raw ID/photo/payment instrument/return envelope/storage/URL 누출 0
- consumer surface의 `preview/simulated/test/on-device/Pulse/Hot/Peak` 회귀 0

## 7. 현재 열린 위험

### P0

1. `qa:b` 기본 경로가 18개 정규 Flow browser suite 전체를 실행하지 않는다.
2. 모든 Flow에 대한 JA 기능·시각 증거가 없다. shared pixel registry는 JA 0건이다.
3. 필수 320×568/800 및 844×390이 모든 Flow/pixel case의 공통 baseline이 아니다.
4. 6,240 target cell은 추적되지만 실제 evidence link가 cell 단위로 아직 닫히지 않았다.

### P1

1. 모든 Flow의 200% zoom·keyboard·screen reader·forced-colors가 동일 수준이 아니다.
2. reduced-motion에서 default와 동일한 target/focus/return을 전 Flow가 증명하지 않는다.
3. acceptance 236개는 census가 고정됐지만 개별 항목별 passing evidence ID는 구현 Wave에서
   연결해야 한다.

## 8. 완료 정의

- [ ] 변경 Flow의 5개 공격과 7개 checkpoint가 실제 browser evidence를 가진다.
- [ ] 6,240 target cell에 evidence 또는 승인된 동등성 근거가 연결된다.
- [ ] 195개 Flow acceptance와 41개 X-screen acceptance가 evidence ID를 가진다.
- [ ] 기본 QA 명령에서 18개 Flow 전체 critical journey가 실행된다.
- [ ] P0/P1 gap 0 후 Overview adversarial run을 다시 통과한다.
- [ ] 구현자와 다른 reviewer가 sign-off한다.

현재 상태는 `manifest complete`, `implementation evidence incomplete`다.
