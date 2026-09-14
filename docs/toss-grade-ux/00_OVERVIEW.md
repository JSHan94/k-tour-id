# ONDO · Toss-grade mobile UX redesign overview

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION PLAN`

2026-09-08 이후 적용 안내: 이 18개 Flow의 UX·복귀·접근성 계약은 보존한다. 다만 실행 출처와 연동 범위는 [최신 산출물 기준](../KTOUR_END_OUTPUT_ALIGNMENT_2026-09-08.md), [DEPLOYMENT_SPEC v3.1](../DEPLOYMENT_SPEC.md), [해커톤 연동 목록](../HACKATHON_INTEGRATION_MATRIX_2026-09-08.md)이 우선한다. 공유 링크는 기본 **명시적 샘플 체험**이며 실제 provider 상태 점검은 별도 모드다. 아래의 ‘consumer default fixture 금지’는 이전 운영 경로 기준이고, After 19 역시 지금은 light/dark 테마와 독립이다. 실제 구현·검사·배포 상태는 [실행 현황](../EXECUTION_STATUS_2026-09-08.md)에서 확인한다.

이 문서는 ONDO의 18개 정규 Flow와 Flow 사이의 나머지 화면을 하나의 모바일 제품으로
재설계하는 전체 지도다. 화면을 더 단순하고 아름답게 만들되 PRD 기능·상태·실패·
truth·exact `returnTo`를 삭제하지 않는다. 현재 구현이 이미 완성됐다는 판정이 아니라,
다음 구현 단계가 따라야 할 합의 명세다.

## 1. 한눈에 보는 변화

| 지금 반복되는 문제 | 합의한 제품 변화 | 사용자가 느끼는 결과 |
|---|---|---|
| 지도는 좋아졌지만 다른 탭은 설명 카드와 큰 modal이 많음 | 전 앱을 10개 shared primitive와 한 화면 한 결정으로 재구성 | 화면마다 새 사용법을 배우지 않음 |
| 첫 지도와 도시 지도가 route처럼 끊김 | 첫 paint부터 같은 MapLibre를 유지하고 atlas→city→place camera 연속 전환 | 선택한 곳으로 실제 이동하는 느낌 |
| 서울·부산·제주, 특히 제주가 다른 제품처럼 보임 | 세 도시 동일 temperature/place renderer, source state만 짧게 구분 | 하나의 ONDO 지도에서 세 도시 탐색 |
| `Pulse`, `Peak`, `official records`, `preview`, `on-device`가 사용자 앞에 나옴 | 메이커·행정 언어는 제거/접고 상태를 heat, source glyph, amount relation, object change로 전달 | 읽기 전에 의미를 이해 |
| K-Tour ID와 취향 onboarding, wallet, 장소 행동이 분리됨 | Guest map first → 행동 선택 → 필요한 독립 gate만 JIT → 같은 행동 복귀 | 인증을 위해 여행 흐름을 떠나지 않음 |
| ID·wallet 데모가 실제 연결처럼 보이거나 반대로 기술 설명이 과함 | normal unavailable, local actual, explicit review fixture를 분리하고 consequence만 결정점에 표시 | 데모가 세련되면서도 정직함 |
| 모바일 dock·sheet·CTA가 잘리거나 공간을 과점 | icon-only dock, semantic sheet heights, safe-area/keyboard/200% zoom 계약 | 작은 폰과 가로 화면에서도 핵심 행동 도달 |
| 성공 화면만 다듬고 실패·취소·복귀가 낡은 UI | success/cancel/error/retry/return을 같은 primitive와 evidence matrix로 설계 | 실패해도 길을 잃지 않음 |

## 2. 제품 구조

```text
ONDO / Explore
├─ 실제 대한민국 MapLibre atlas
│  ├─ Seoul · curated-scored
│  ├─ Busan · curated-scored
│  └─ Jeju · editorial-unscored
├─ 장소 발견
│  ├─ 저장 → My Korea
│  ├─ Table → chat/photo/check-in/feedback
│  ├─ Local Signal → 현장 사진·Visit/Contribution
│  ├─ After19 → Age-only night layer
│  └─ Benefit → travel balance record → optional visit milestone
├─ 행동 시 필요한 독립 확인 layer
│  ├─ Account
│  ├─ Person · Mobile ID / Residence / Passport alternate
│  ├─ 19+
│  ├─ Payment KYC
│  └─ K-Tour credential setup ≠ contextual presentation
└─ Supporting spaces
   ├─ My Korea
   ├─ Tables
   ├─ ID · Wallet
   ├─ Settings
   └─ Labs · technical/demo evidence only
```

## 3. Golden Journey

### 3.1 처음 사용자

```text
MapLibre atlas visible
→ compact locale utility + one intent decision on the atlas
→ optional area decision when it changes the starting focus
→ taste decision with an honest result preview
→ city beacon tap
→ 420–500ms same-camera focus
→ place/list/detail/directions as Guest
```

### 3.2 보호된 행동

```text
exact place/Table/amount/draft
→ one action chosen
→ one anchored Decision sheet
→ current unmet gate only
→ pending → result
→ next unmet gate or exact original action
→ expected mutation once
```

### 3.3 기억으로 돌아오기

```text
save / Table / local signal / visit result
→ My Korea timeline and memory map update
→ tap memory
→ canonical city camera + exact place/detail
```

## 4. Flow별 변화

각 제목은 상세 구현 계약으로 연결된다.

| Flow | 지금 해결할 문제 | 합의한 목표 | 우선순위 |
|---|---|---|---|
| [FL-001 Guest Discover](./FL-001_GUEST_DISCOVER.md) | 도시 CTA·heat·source copy가 지도를 가리고 전환이 끊김 | 같은 MapLibre에서 atlas→city→place, 세 도시 공통 temperature, media-led list | P1 |
| [FL-002 Age → exact venue](./FL-002_AFTER19_EXACT_VENUE.md) | age, ID, account가 한 setup처럼 보이고 target을 잃음 | locked venue에 Age-only JIT, 성공/실패 모두 같은 장소 | P0 |
| [FL-003 Table→Chat→Feedback](./FL-003_TABLE_CHAT_FEEDBACK.md) | text card 밀도, sticky clipping, 실제 모임처럼 오해 | list 3 facts/detail 6 facts, media, membership/chat/safety 분리 | P1 |
| [FL-004 Checkout→Stamp](./FL-004_CHECKOUT_STAMP.md) | test ticker, balance truth, payment=stamp 인과 혼합 | KRW benefit/local record→별도 unique visit→9→10 | P0 |
| [FL-005 Korean Mobile ID](./FL-005_KOREAN_MOBILE_ID.md) | 긴 기술 setup, providerless success, setup/present 혼합 | Person 행동에서 requester/purpose 중심 JIT, unavailable truth | P0 |
| [FL-006 Residence Card](./FL-006_RESIDENCE_CARD.md) | 체류·국적 추론과 unsupported dead-end | method availability 먼저, neutral Passport alternate, exact return | P0 |
| [FL-007 Short-term onboarding](./FL-007_SHORT_TERM_ONBOARDING.md) | persona/ID를 앞세우고 취향 결과 연결이 약함 | atlas 위 여행 intent→taste→Guest map, eKYC 없음 | P1 |
| [FL-008 Korean local onboarding](./FL-008_KOREAN_LOCAL_ONBOARDING.md) | Korean 선택이 verified/CX처럼 읽힘 | `내 주변 탐색` intent→area→preference만 저장, Mobile ID는 later JIT | P1 |
| [FL-009 Resident onboarding](./FL-009_RESIDENT_ONBOARDING.md) | Residence Card가 onboarding 전제처럼 읽힘 | `한국에서 생활` intent→area→preference만 저장, document는 later JIT | P1 |
| [FL-010 Account gate](./FL-010_ACCOUNT_GATE.md) | status wall, nested modal, CTA/scroll 복귀 손실 | 원 객체가 고정된 single sheet, one-shot exact return | P0 |
| [FL-011 Save / My Korea](./FL-011_SAVE_MY_KOREA.md) | 저장 상태와 gate success 혼합, admin-style cards | bookmark mutation→memory map/timeline→place round-trip | P1 |
| [FL-012 Local Signal](./FL-012_LOCAL_SIGNAL.md) | form 전 ID 강제, 기술 copy, media draft 복귀 위험 | visual draft 먼저→Submit gates→Visit/Contribution만 변화 | P1 |
| [FL-013 Manual After19](./FL-013_MANUAL_AFTER19.md) | 공개 night-view와 보호된 19+가 한 권한처럼 보이고 일반 탐색 차단 | 탭 한정 self-declared night-view + provider-required protected Age, exact venue/Table return | P0 |
| [FL-014 Auto After19](./FL-014_AUTO_AFTER19.md) | dark overlay로 지리/controls 소실, 일반 장소 삭제 위험 | four guards, 같은 geography의 neon layer, 즉시 off | P1 |
| [FL-015 Public profile](./FL-015_PUBLIC_PROFILE.md) | 국적·신뢰 종합점수로 오인할 위험 | field별 opt-in + public preview + 4축 reputation | P0 |
| [FL-016 Evidence / traits](./FL-016_EVIDENCE_MERCHANT_TRAIT.md) | official/ONDO/trait/adapter가 verified 하나로 뭉침 | fact별 confirmed/unknown/stale/error + source drawer | P0 |
| [FL-017 Payment KYC](./FL-017_PAYMENT_KYC.md) | 결제 KYC가 ID 전부를 완료한 듯 보임 | merchant/amount 고정 Payment-only JIT, unavailable no-mutation | P0 |
| [FL-018 Labs wallet / bridge](./FL-018_LABS_WALLET_BRIDGE.md) | ticker·network가 소비자 경험을 침범하고 fake success 위험 | Labs에서만 asset 분리·ordered bridge·exact simulated target truth | P0/P2 |

## 5. 나머지 화면 확장

18개 Flow만 설계하면 반복 결함이 shell과 상태 화면에 남는다. 아래 네 문서는 모든
Flow가 공유하는 화면까지 소유한다.

| 문서 | 바뀌는 화면·문제 |
|---|---|
| [X-01 App shell & navigation](./X-01_APP_SHELL_NAVIGATION.md) | phone icon-only dock, desktop rail, brand hierarchy, z-index, focus/scroll, safe area, tilted clipping 제거 |
| [X-02 Settings & device data](./X-02_SETTINGS_DEVICE_DATA.md) | compact EN/KO/JA, preference edit, 독립 state detail, reset/clear scope, `On this device` headline 제거 |
| [X-03 Japanese, Jeju & media](./X-03_JAPANESE_JEJU_EDITORIAL_MEDIA.md) | 제주 parity, story-place edge, source vocabulary, venue photo/category art/people truth, JA typography |
| [X-04 Loading, motion & responsive](./X-04_LOADING_MOTION_RESPONSIVE.md) | map choreography, 800ms/5s recovery, sheet fit, keyboard, reduced motion, exact return, 전 viewport |

## 6. 공통 화면 문법

### 6.1 Shared primitives

| primitive | 하나의 책임 | 적용 예 |
|---|---|---|
| PageHeader | back/close, title, 필요한 status 하나 | Settings, K-Tour task |
| DecisionHero | 지금 결정할 객체 | place, Table, amount, predicate |
| ActionRow | 한 행동과 현재 state | language, source, funding method |
| FactStrip | 빠른 비교 사실 3–6개 | place, Table |
| MediaCard | 장소·사람·기억의 시각 증거 | list, Table, My Korea |
| MapKey | compact temperature/source 의미 | atlas/city map |
| Sheet | Peek/Decision/Detail/Full task | place/gate/receipt |
| StickyDecision | primary + optional escape | consent, join, checkout |
| InlineStatus | loading/error/unavailable + recovery | locate/provider/storage |
| Receipt | amount/result/time/return | local balance record, proof result |

새 Flow 전용 modal/card는 기존 primitive로 의미를 틀리게 표현할 때만 허용한다.

### 6.2 정보 처리

| 등급 | 기본 처리 | 예시 |
|---|---|---|
| Decision | 항상 표시 | 장소, 시간, 좌석, 금액, 공개 항목, CTA |
| Truth | 결정점에 짧게 | 외부 주문/돈 이동 없음, official/editorial, unavailable |
| Status | 객체 변화로 표시 | saved, selected, locked, pending, expired |
| Provenance | 한 번 접기 | provider, source, freshness, receipt ID |
| Maker detail | Labs/문서 또는 삭제 | fixture architecture, `우리가 이렇게 만들었어요` |

아이콘은 이해 비용을 낮출 때 사용한다. 동의·금액·공개·실패·파괴적 행동처럼 오해
비용이 큰 의미는 짧은 label을 유지한다.

## 7. 모바일 source composition

- 주 기준: 390×844.
- 동시 설계: 320×800, 360×800, 430×932.
- 필수 예외: 844×390 short landscape, keyboard open, 200% zoom.
- 모든 interactive target 기본 48px, 절대 최소 44px.
- phone dock은 visible label 없는 5개 icon; accessible name은 EN/KO/JA.
- heading 28–32px, section 20–22px, body 16–17px, helper 15px, provenance 14px.
- decision CTA는 52–56px이며 2줄 grow는 허용하되 잘림/ellipsis는 금지한다.
- sheet footer는 safe area와 visual viewport 위에 있고 본문을 덮지 않는다.

## 8. Brand·color·media

### Brand

- ONDO: 지도·발견·장소·Table·기억의 primary consumer brand.
- K-Tour ID: identity, credential, consent, payment readiness, travel balance의 context brand.
- 제공된 K-Tour ID logo는 해당 context에서 원본 비율로 사용한다. 두 full wordmark를
  같은 크기로 병렬 전시하지 않는다.

### Color

- 기본 surface: near-white / near-black.
- ONDO heat: plum→coral→apricot, 데이터에만 사용.
- After19: near-black geography + 제한된 neon plum/pink.
- K-Tour blue-purple: K-Tour ID object 안에서만 사용.

### Media

- source-backed venue photo 우선.
- 실제 사진이 없으면 venue photo처럼 가장하지 않는 category illustration.
- synthetic people은 onboarding/Table invitation/My Korea memory만.
- eKYC, credential result, official fact에는 사람 이미지 사용 금지.

## 9. Truth model

| truth | 가능한 것 | 불가능한 것 | 기본 사용자 표현 |
|---|---|---|---|
| Local actual | preference, save, draft, local activity/balance record | 은행 입금, issuer, merchant order, chain tx | 결과점 한 번 `이 기기에 저장`/`외부 주문 없음` |
| Provider unavailable | method 선택·preflight·alternate | verified/issued/funded/paid success | `현재 연결할 수 없어요` + recovery |
| Explicit review fixture | 결정적 success/failure/expiry와 returnTo 검증 | consumer default, official/live claim | QA/review mode provenance |
| Contract-only | schema/fact adapter 결과 | 실제 issuer/merchant integration | source detail/Labs |
| Deferred | 미래 capability | visible dead CTA | roadmap/developer docs only |

normal public route에서 provider 미연결인데 verified/issued/funded/paid 결과를 보여주는
것은 P0다.

## 10. 삭제하지 않는 PRD 기능

- Guest는 인증 없이 지도·검색·상세·길찾기를 끝낸다.
- Account, Person, 19+, Payment KYC는 독립이다.
- Mobile ID, Residence supported/unavailable/alternate, Passport 경로를 보존한다.
- 모든 gate의 one-shot `returnTo`와 invalid/expired safe return을 보존한다.
- Table availability/membership/chat/image/check-in/feedback/safety를 보존한다.
- Local Signal photo lifecycle과 Visit/Contribution 제한을 보존한다.
- manual/auto After19, four guards, immediate off, expiry를 보존한다.
- place fact의 yes/conditional/no/unknown과 merchant trait truth를 보존한다.
- KRW/USD presentation, hidden ticker detail, checkout cancel/fail/receipt를 보존한다.
- unique visit 9→10과 opt-in Labs badge를 결제와 분리해 보존한다.
- Labs asset/quote/source/destination/receipt, AMM deferred를 보존한다.
- EN/KO/JA와 mobile/tablet/desktop/short landscape를 보존한다.

전체 trace는 [PRD preservation ledger](./00_PRD_PRESERVATION_LEDGER.md)에서 확인한다.

## 11. 구현 파동

### Wave 0 · contract harness

- shared primitives와 token contract
- normal unavailable / local actual / review fixture harness 분리
- exact return snapshot/hash helper
- 18 Flow scenario와 viewport/locale evidence manifest

### Wave 1 · P0 truth and gates

- FL-002, 004–006, 010, 013, 015–018
- balance provenance, payment≠visit, setup≠present
- unavailable/cancel/error/retry/exact return 먼저

### Wave 2 · map-backed core

- FL-001, 007–009, 014
- same MapLibre first paint, atlas→city, three-city renderer, After19 geography
- X-01/X-03/X-04 동시 적용

### Wave 3 · place, social, memory

- FL-003, 011, 012, 016
- photo-led place/Table, Local Signal draft, My Korea narrative
- Settings와 app shell 전체 확장

### Wave 4 · visual finish and release

- 모든 Flow EN/KO/JA × required viewport × success/failure/cancel/retry
- prose-off/color-off/motion-off/forced-colors/200% zoom
- `/` canonical route, `/ondo-b` redirect, OG/title/favicon, public no-login smoke
- 두 번 연속 clean adversarial round 뒤 배포 후보

## 12. Adversarial QA 운영

한 Flow의 작성자와 승인자는 같을 수 없다.

```text
implementer
→ visual/mobile reviewer
→ truth/state reviewer
→ automated contract + screenshot matrix
→ P0/P1 fix
→ second clean round
→ release candidate
```

### 매 Flow 필수 공격

1. 1초 이해: 대상과 다음 행동을 말할 수 있는가.
2. Prose-off: helper를 숨겨도 끝낼 수 있는가.
3. Color/motion-off: 상태와 의미가 남는가.
4. Failure-first: 실패·취소·재시도가 성공만큼 완성됐는가.
5. Exact return: camera/filter/object/draft/scroll/focus가 복원되는가.
6. Truth: official/editorial/live/local/fixture/contract/deferred가 섞이지 않는가.
7. Preservation: REQ/state/fixture/persistence가 사라지지 않았는가.

### 필수 viewport·언어

`320×800`, `360×800`, `390×844`, `430×932`, `844×390`, tablet, desktop ×
`KO`, `EN`, `JA`; 200% zoom과 reduced motion을 포함한다.

## 13. 이번 문서 단계의 완료 정의

- [x] `FL-001`~`FL-018` 각각 하나의 implementation-ready MD.
- [x] 공통 UX standard와 PRD preservation ledger.
- [x] 사용자 피드백 추적 원장.
- [x] 나머지 화면 X-01~X-04 implementation-ready 교차 명세.
- [x] 세 디자이너 독립 감사 3개와 교차 반박 3개.
- [x] 단일 consensus resolution.
- [x] 작성자가 아닌 리뷰어의 Flow 문서 cross-signoff.
- [x] 링크·REQ·heading·placeholder·Markdown whitespace 기계 검증.

이번 단계에서는 제품 code, route, asset, metadata, deployment를 변경하지 않는다.
문서 승인 다음 단계에서 이 overview의 Wave 순서로 구현하고, 각 Wave 안에서 adversarial
QA를 바로 수행한다.

## 14. 참고 기준

- [공통 UX standard](./00_UX_STANDARD.md)
- [PRD preservation ledger](./00_PRD_PRESERVATION_LEDGER.md)
- [사용자 피드백 trace](./00_FEEDBACK_TRACE.md)
- [세 디자이너 합의](./_reviews/CONSENSUS_RESOLUTION.md)
- [Toss · 크고 복잡한 제품, 과감하게 갈아엎기](https://toss.tech/article/mydoc)
- [Toss Design System 공개 글](https://toss.tech/article/toss-design-system)
- [Toss 가입 화면 공개 글](https://toss.tech/article/toss-signup-process)

`토스급`은 Toss의 공식 승인 또는 TDS 복제가 아니라 1초 이해, 한 화면 한 결정,
명확한 CTA, 낮은 작업 비용, 맥락 연속성, 패턴화, 접근성을 적용한 ONDO 내부 품질
기준이다.
