# Visual sign-off · FL-013~018 + shell/motion

- 검토일: `2026-09-04`
- 검토 역할: `D2 · visual/mobile/interaction adversary`
- 범위: `FL-013`~`FL-018`, `X-01_APP_SHELL_NAVIGATION`,
  `X-04_LOADING_MOTION_RESPONSIVE`
- 판정: **문서 기준 SIGN-OFF — actionable P0 0 / P1 0**

이 판정은 구현이 이미 통과했다는 뜻이 아니다. 아래 acceptance matrix를 구현 artifact와
자동 bounds/state test로 증명하기 전에는 release sign-off로 승격하지 않는다. 이번 단계는
구현 코드를 수정하지 않았다.

## 1. 우선한 정본

충돌 시 아래 순서로 판정했다.

1. `docs/ondo-execution/01_PRD_9H.md`
2. `03_FLOW_CATALOG.md`와 `04_STATE_MODEL.md`
3. `docs/ondo-baljajwi/07_AS_BUILT.md`, `06_FINAL_REQUIREMENTS_AUDIT.md`,
   `04_EVIDENCE_MANIFEST.md`
4. `00_UX_STANDARD.md`, `00_PRD_PRESERVATION_LEDGER.md`,
   `_reviews/CONSENSUS_RESOLUTION.md`

특히 D-13 소비자 통화, D-14 세 도시 공통 renderer, D-15 현재 B MapLibre와
canonical `ReturnToEnvelope`를 역사적 UI 제안보다 우선했다.

## 2. 파일별 adversarial 판정

| 파일 | 최초 발견 | 반영한 수정 | 최종 판정 |
|---|---|---|---|
| `FL-013_MANUAL_AFTER19` | `OPEN_AFTER19` token에 camera/filter/Table state를 넣는 서술은 unknown/forbidden field로 envelope를 무효화한다. 주류 Table의 Age guard도 `OPEN_AFTER19`로 바꿀 위험이 있었다. media fallback과 Guest/Account 보관 범위도 불명확했다. | token을 정확한 `RT-OPEN_AFTER19-${Date.parse(createdAt)}`로 고정하고 `venueId?` 외 UI state를 shell snapshot으로 분리했다. Table은 기존 `JOIN_TABLE` token을 유지한다. Guest memory/Account demo-session 최소 보관, source media/category fallback을 잠갔다. | **PASS** |
| `FL-014_AUTO_AFTER19` | 280px popover와 bottom status 중 선택 기준이 없어 320/844×390에서 search·marker·attribution을 가릴 수 있었다. night theme를 전체 invert로 구현할 여지도 있었다. | 12px safe-rectangle collision algorithm과 deterministic bottom fallback을 추가했다. light/night geometry 0~1px, 220ms token crossfade, no global invert/hue filter, natural media와 통일된 night token을 release gate로 고정했다. | **PASS** |
| `FL-015_PUBLIC_PROFILE` | `430px 이상 충분한 높이`와 editor↔preview snap은 기준이 모호하고 새 overlay를 만들 수 있었다. 내부 영문 reputation명이 전면에 있었고 상태 표 separator가 중복됐다. | 320/360/390/430은 같은 scroll의 inline public view, 844×390+충분한 container만 2-column으로 확정했다. snap을 제거하고 사람말 label 네 개로 바꿨으며 표 구조를 정리했다. | **PASS** |
| `FL-016_EVIDENCE_MERCHANT_TRAIT` | fact/source/error/sheet 계약은 정본과 일치했다. 단, venue media 부재가 빈 avatar/letter box로 회귀할 여지가 있었다. | source-backed thumbnail 또는 labeled category pictogram, fixed aspect-ratio와 no layout shift를 acceptance에 추가했다. source class와 unknown/stale/error의 비양성 표현은 유지했다. | **PASS** |
| `FL-017_PAYMENT_KYC` | `START_CHECKOUT` envelope에 merchant/offer/amount/source/UI state를 넣도록 적혀 canonical allowlist와 충돌했다. 320px merchant media와 큰 KRW의 구체적 reflow가 없었다. | token을 정확한 `RT-START_CHECKOUT-${Date.parse(createdAt)}`와 required `venueId`로 제한했다. checkout draft는 domain memory, UI는 shell snapshot으로 분리했다. source media/category fallback과 320/200% full-width KRW row를 고정했다. | **PASS** |
| `FL-018_LABS_WALLET_BRIDGE` | badge milestone object를 `MINT_BADGE` envelope에 넣을 여지가 있었다. exact target truth 반복과 narrow asset trailing column이 Labs 첫 viewport를 과밀하게 만들 수 있었다. | token을 정확한 `RT-MINT_BADGE-${Date.parse(createdAt)}`로 고정하고 milestone UI state를 분리했다. target truth는 persistent line 한 번, 320/360 asset row는 2-line wrap, non-fiat pictogram+text 상태로 잠갔다. | **PASS** |
| `X-01_APP_SHELL_NAVIGATION` | selected tile 또는 indicator라는 이중 선택지가 합의된 단일 문법과 충돌했다. 844×390에서 rail 재등장 가능성이 남아 있었다. | phone selected를 black 48px tile+white pictogram 하나로 확정하고 bar/glow/double outline을 금지했다. icon silhouette와 coach collision을 정의했다. 844×390 rail을 비활성화하고 Decision/Detail/Full task 중 dock을 숨긴 뒤 exact focus를 복구한다. | **PASS** |
| `X-04_LOADING_MOTION_RESPONSIVE` | map 650ms, result 900ms는 hard cap과 충돌했다. fixed header/footer, handle+close, rotated clipping, 320×568 누락, UI state를 gate envelope에 섞는 P0 계약 오류가 있었다. | map 420~500ms/hard cap 520ms, result 220~360ms/stamp max 500ms로 교정했다. content-fit sheet, sticky header/footer, single scroll, 844×390 side sheet, no fixed/negative/rotate clipping을 잠갔다. canonical envelope/shell snapshot/domain memory를 세 층으로 분리했다. | **PASS** |

## 3. 공통 locked visual decisions

### 3.1 After19

- light/night는 같은 MapLibre instance, camera, coast, road, district label, marker와
  hitbox를 쓴다. screen-position diff 허용치는 `0~1px`이다.
- 전환은 component inversion이 아닌 `220ms` token crossfade다. photo·logo에
  `invert`, `hue-rotate`, global opacity를 적용하지 않는다.
- night canvas는 near-black이고 land/water luminance 차이 `≥7%`, 주요 text
  `≥4.5:1`, secondary geography/UI boundary `≥3:1`이다.
- plum/pink/coral neon은 active heat와 selected state에만 사용한다. 일반 card와
  dock은 neutral night surface다.
- valid Age+expiry, KST≥19:00, auto preference on, session manual-off 아님 네 guard와
  immediate off를 보존한다. 일반 심야 음식점은 사라지지 않는다.
- auto status는 12px collision rule을 통과할 때만 anchored; 아니면 dock/attribution
  위 2-line `InlineStatus`다. marker/anchor는 hover로 이동하지 않는다.

### 3.2 Sheet fit와 clipping

- `Peek≤32dvh`, `Decision≤72dvh`, `Detail≈88dvh`, `Full task=100dvh`를 사용하고
  screenshot 전용 px height를 금지한다.
- PageHeader에는 back 또는 close 하나만 둔다. PageHeader가 있으면 drag handle을
  제거한다. handle이 필요한 sheet는 독립 row를 사용한다.
- header/footer는 sheet 안에서 sticky이고 scroll owner는 body 하나다. footer의 실제
  ResizeObserver height+safe area만큼 body bottom padding을 둔다.
- 844×390의 Decision/Detail은 360~430px side sheet, rail/dock hidden, one body scroll로
  고정한다. close, 질문, primary가 keyboard 없이 도달해야 한다.
- page/sheet clipping boundary는 axis-aligned다. `rotate`, `skew`, large pseudo-element,
  negative margin, 임의 top으로 container edge를 만들지 않는다.

### 3.3 Motion과 loading

| role | locked duration | 불변식 |
|---|---:|---|
| Tap | 90~120ms | hit target 이동 0; city feedback≤80ms |
| Inline | 160~200ms | row/object anchor와 최소 height 유지 |
| Sheet | 220~280ms | 한 shell; nested modal 0 |
| Route | 240~320ms | blank/white intermediate frame 0 |
| Map focus | 420~500ms, hard cap 520ms | camera start≤100ms, map remount 0, label coordinate 고정 |
| Result | 220~360ms; stamp≤500ms | ordinary success page/confetti 0 |

- 첫 frame부터 cached/base geography가 있고 field/core/label은 한 번만 settle한다.
- 800ms 전 helper copy를 만들지 않는다. 5s에는 동일 query/filter/selection의 semantic
  List가 foreground가 된다.
- reduced motion은 map `jumpTo`, 즉시 state, 짧은 opacity로 바꾸되 target, focus,
  return, controls는 동일하다.

### 3.4 Navigation과 icon semantics

- phone primary nav는 Explore, My Korea, Tables, ID · Wallet, Settings 다섯 icon-only다.
  visible text label은 0이고 각 button에는 KO/EN/JA 목적 기반 accessible name이 있다.
- selected는 `near-black 48×48 tile + white pictogram` 하나다. bar, glow, 이중 outline,
  다른 selected icon을 추가하지 않는다.
- canonical silhouette는 map-pin/atlas, bookmark, two-person/table, pass-card, gear다.
  ID · Wallet을 fingerprint 하나로 표현하지 않는다.
- After19와 forced colors에서도 tile boundary는 3:1 또는 2px system border로 남는다.
  이는 추가 indicator가 아니라 같은 selected tile의 경계다.
- 844×390은 horizontal icon-only dock이며 side sheet/full task 중 숨기고 종료 후 원 tab,
  scroll, focus를 복구한다. width만 보고 desktop rail을 켜지 않는다.

### 3.5 Media, empty, error

- place/merchant/locked venue media는 source-backed 고정 aspect-ratio만 쓴다. 부재·실패
  시 labeled category pictogram을 쓰고 빈 원형 avatar, 임의 이니셜, generic letter box를
  만들지 않는다.
- loading skeleton은 최종 media ratio를 예약한다. 다섯 연속 image failure에도 card
  geometry와 CTA가 움직이지 않는다.
- error/empty/offline은 `대상 + 지금 상태 + 한 recovery`를 같은 surface에 둔다.
  provider/raw error modal, blank card, toast-only consequential failure를 금지한다.
- public unavailable은 positive check를 쓰지 않는다. configured recovery가 없으면
  `다시 시도`를 허위로 노출하지 않는다.

### 3.6 KRW와 Labs density

- checkout은 grouping한 KRW가 primary이고 근거/time이 있는 USD만 secondary다.
  `OOKRW`, `USDC`, `USDT`, network, settlement는 payment detail 또는 Labs뿐이다.
- 320px의 merchant와 final KRW는 서로 다른 full-width row다. currency symbol+number는
  atomic tabular amount이고 ticker·ellipsis가 없다.
- positive travel balance에는 한 source가 있고 `no funds added`와 공존하지 않는다.
  unavailable funding intent는 selected draft일 뿐 active/ready source가 아니다.
- Labs만 exact `Target network: Sui Testnet · Simulated`를 compact persistent line으로
  한 번 표시한다. asset/quote/timeline card마다 반복하지 않는다.
- USDC/USDT/OOKRW는 separate rows다. 320/360은 asset+representation / amount+state 두
  줄이며 합산 USD/KRW와 fiat glyph 암시가 없다.
- source confirmed는 terminal success가 아니다. destination confirmed 전 balance delta,
  public `txRef` 없는 explorer/success, AMM execution CTA는 모두 0이다.

### 3.7 Exact return

- canonical token은 `RT-${cta}-${Date.parse(createdAt)}`와 CTA별 public-ID matrix만 쓴다.
  unknown/forbidden field가 있으면 envelope 전체를 거절한다.
- camera/query/filter/sheet/scroll/focus는 shell local snapshot, checkout/Table/Local Signal의
  non-sensitive draft는 domain memory다. 둘 다 gate envelope에 합치지 않는다.
- 성공은 full guard plan을 재검증한 뒤 원 mutation 직전에 one-shot consume한다.
  cancel은 원 공개 context 복구 뒤 gate 삭제, retry만 미소비 token 유지다.
- raw identity, media blob, payment instrument는 envelope/snapshot/URL 어디에도 없다.

## 4. Required mobile/adversarial matrix

| viewport | 필수 증거 |
|---|---|
| `320×568` | 최소 높이 sheet reachability, 2-line CTA, no footer cut, long JA |
| `320×800` | icon dock spacing, source/media fallback, KRW/Labs 2-line rows, 200% zoom |
| `360×800` | Android baseline, all Decision states, KO/EN/JA |
| `390×844` | canonical portrait composition, light/After19, default/reduced motion |
| `430×932` | no gratuitous whitespace, profile inline view, source media sizing |
| `844×390` | rail disabled, side sheet one scroll, dock hidden during task, close/primary reachability |

각 relevant surface는 KO/EN/JA, default/200% zoom, keyboard, forced colors,
default/reduced motion을 통과한다. After19 surface는 light/night pair screenshot과
geometry diff를 함께 남긴다. N/A는 이유를 기록하며 silent skip을 허용하지 않는다.

## 5. PRD/state 보존 확인

| Flow | 보존 REQ | 삭제 금지 결과 |
|---|---|---|
| `FL-013` | `REQ-012` | Age-only, Guest entry, exact map/Table action return, expiry, raw DOB 0 |
| `FL-014` | `REQ-012`; `REQ-019` renderer support | four guards, manual-off precedence, same geography, general night venues |
| `FL-015` | `REQ-008`, `REQ-015` | field-level opt-in, default private, four independent reputation axes |
| `FL-016` | `REQ-004`, `REQ-013`, `REQ-014` | independent fact/source states, unknown/stale/error, OpenDID≠EAS, contract/deferred truth |
| `FL-017` | `REQ-005`, `REQ-011` | Account→Payment-only gate, KRW amount anchor, unavailable noncommit, no automatic payment/stamp |
| `FL-018` | `REQ-004`~`006`, `REQ-014`, `REQ-016` | Labs consent, separate assets, ordered bridge, no fake tx, independent badge |
| `X-01/X-04` | `REQ-005`, `REQ-018`, D-13~D-15 | five destinations, exact return, same MapLibre, all mobile/localization states |

No feature or state axis was deleted. `Account ≠ Person ≠ Age ≠ Payment KYC ≠ K-Tour
credential ≠ Presentation ≠ Reputation` remains visible in behavior while internal terms remain
folded outside consequential decisions/Labs.

## 6. Residual risk and sign-off condition

### Actionable specification defects

- **P0: 0**
- **P1: 0**

### Implementation evidence still required

- bounds assertions for header/body/footer/dock/sheet at all six mobile sizes
- light/night pixel geometry diff and contrast measurement
- city tap feedback/camera start/hard-cap frame timing
- KO/EN/JA + 200% zoom + forced-colors + reduced-motion artifacts
- canonical envelope negative tests for unknown/forbidden fields and one-shot consume
- normal public provider-unavailable negative paths and explicit review/Labs provenance

위 항목은 문서의 미결 결정이 아니라 구현 release gate다. 하나라도 실패하면 이 문서의
spec sign-off는 유지되더라도 제품 sign-off는 실패한다.

## 7. 문서 검증 결과

- `FL-013`~`FL-018` numbered template sections: **각 12/12**
- 검토 파일의 `320`, `360`, `390`, `430`, `844×390`, `KO/EN/JA`,
  `reduced motion` coverage: **8/8 파일**
- stale conflict search: `issuedAtEpochMs`, `420–650`, `500–900`, `0–650ms`,
  profile snap ambiguity, wildcard return token: **0건**
- source spec placeholder search(본 sign-off 보고서 제외): `TODO`, `TBD`,
  `PLACEHOLDER`, `FIXME`, lorem: **0건**
- Markdown table duplicate separator: **0건**
- `git diff --check` / untracked-file whitespace check: **PASS**
