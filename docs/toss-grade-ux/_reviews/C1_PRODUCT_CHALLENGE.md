# C1 · D1 제품 단순성 교차 반박과 합의 권고

상태: `CROSS-REVIEW · D1 CHALLENGE · IMPLEMENTATION 금지 · 2026-09-04`

이 문서는 D1이 다음 네 문서를 전부 읽고 D2·D3의 독립안을 공격적으로 대조한
교차검증 결과다.

- `_reviews/D1_PRODUCT_SIMPLICITY.md`
- `_reviews/D2_INTERACTION_VISUAL.md`
- `_reviews/D3_TRUST_INCLUSIVE.md`
- `00_UX_STANDARD.md`
- `00_PRD_PRESERVATION_LEDGER.md`

여기서 `합의 권고`는 구현을 승인한다는 뜻이 아니다. 다음 단계의 문서 작성자가
그대로 반영할 단일 결정을 뜻하며, PRD·Decision Ledger와 충돌하면 상위 정본이
우선한다. current B의 MapLibre와 D-13~D-15를 역사적 A/Leaflet 문서로 되돌리는
제안은 검토 대상이 아니다.

## 1. 총평

세 독립안은 `지도 먼저`, `한 화면 한 결정`, `JIT gate`, `기능이 아니라 설명을
줄임`, `exact returnTo`, `독립 상태 축`, `세 도시 공통 renderer`, `KRW 소비자
표기`, `EN/KO/JA mobile-first`에 합의한다.

하지만 그대로 병합하면 여섯 곳에서 다시 모순이 생긴다.

1. **외부 provider가 없을 때도 fixture success를 일반 사용자 성공처럼 보일 수 있다.**
2. **`₩60,000`과 `no funds added`를 동시에 유지할 수 있다.**
3. **Table 여섯 사실을 list 첫 카드에 모두 넣어 단순성 목표를 깨뜨릴 수 있다.**
4. **onboarding을 별도 가치 화면으로 둘지, 지도 위 sheet로 둘지 결정되지 않았다.**
5. **Labs에서 public txRef가 없으면 `Testnet`을 쓰지 말자는 문장과 정본의 exact
   `Target network: Sui Testnet · Simulated`가 충돌한다.**
6. **D2의 일부 Flow별 REQ 보존 표기가 canonical registry와 다르다.**

아래 판정으로 이 모순을 잠그지 않으면 개별 Flow 문서를 작성하지 않는다.

## 2. 충돌·모순 판정

| ID | 쟁점 | 독립안 충돌 | 판정 | 최종 이유·수정 |
|---|---|---|---|---|
| C-01 | 첫 진입 surface | D1은 가치 화면 뒤 map, D2는 첫 paint부터 map-backed sheet, D3는 빠른 language/taste 뒤 map | **D2 채택, D1·D3 수정** | 별도 white landing을 금지한다. 같은 MapLibre atlas 위 compact value/intent sheet로 시작한다. PRD의 value·intent·preference는 유지한다. |
| C-02 | persona 표현 | D1은 human intent, D2도 intent label, D3 일부는 `한국에 익숙한 추천`처럼 recommendation | **수정 채택** | 세 PRD branch는 `한국 여행 / 내 주변 탐색 / 한국에서 생활`의 self-selected intent로 유지한다. 국적·체류·credential을 추론하지 않는다. |
| C-03 | 취향 적용 | D2는 marker keyline/list ordering 실시간 반응, D1은 category highlight, D3는 최소 취향만 | **D2 수정 채택** | 선택은 `개인화 match keyline + list ordering`만 바꾼다. ONDO temperature, official/editorial, eligibility는 절대 바꾸지 않는다. 효과를 구현 못 하면 약속 copy도 쓰지 않는다. |
| C-04 | Local Signal gate 시점 | D1·D3는 draft 작성 후 Submit에서 gate, D2는 form 전에 Person/K-Tour gate 가능 | **D1·D3 채택** | 먼저 가치를 경험하고 Submit 시 Account→Person을 연다. venue/chips/note/photo draft를 session memory에 보존하고 URL에는 넣지 않는다. |
| C-05 | gate shell | 세 안 모두 single anchored sheet를 지지하지만 D2는 multi-gate icon trail을 허용 | **수정 채택** | 하나의 shell만 쓰되 지금 필요한 축 하나만 보인다. `남은 단계 n`은 허용하지만 미래 gate 이름·check badge를 한꺼번에 전시하지 않는다. |
| C-06 | Account/Person/Age/Payment | 모두 독립을 말하지만 몇몇 setup stepper가 미래 `Present`까지 포함 | **독립 축 채택** | Account, Person, Age, Payment KYC, K-Tour credential, Presentation을 합치지 않는다. 현재 행동에 필요한 queue만 계산한다. |
| C-07 | K-Tour setup과 presentation | D2·D3는 `Choose→Check→Add`와 `Present` 분리, D1은 stepper 자체 축소 | **D2·D3 채택** | credential ready와 predicate presentation은 별도 성공·consent·receipt다. setup stepper에 `Present`를 넣지 않는다. |
| C-08 | provider 미연결 | D1/D2는 consumer truth 한 줄 뒤 local success 가능성이 열려 있고, D3는 ordinary path fail-closed | **D3 수정 채택** | public default는 `unavailable`, verified/payment success 없음. 명시적 QA/demo fixture에서만 simulated success를 만들고 그 모드에서는 외부 확인이 없다는 truth를 결과에 보인다. 일반 사용자 UI가 연결 성공을 가장하지 않는다. |
| C-09 | maker language | 모두 normal surface에서 preview/simulated/test/on-device를 줄임 | **채택** | 단, C-08의 명시적 demo fixture와 Labs에는 정확한 simulation truth가 필요하다. consequence 문장은 숨기지 않는다. |
| C-10 | identity truth 위치 | D1은 provider 세부 접기, D3는 요청자·목적·predicate·결과 전면 | **D3 채택** | provider명/architecture는 접되 requester, purpose, requested predicate, sharing scope, unavailable/failure는 decision tier다. |
| C-11 | travel balance | D1/D2는 `₩60,000` fixture를 유지, D3는 `Ready · no funds added`와 동시 표시를 P0로 반려 | **D3 채택** | `여행 잔액 ₩60,000 · 이 기기 기록` 또는 `잔액 ₩0 · 충전 수단 없음` 중 하나만 선택한다. positive spendable balance와 no-funds를 동시에 보여주지 않는다. |
| C-12 | funding method | D3는 bank/card·Apple Pay/USD wallet의 unavailable 선택 draft를 제안, D1/D2는 상세 부족 | **D3 채택** | sheet-local draft 후 explicit commit. 미연결 수단은 selected/ready로 persist하지 않고 직전 usable source를 유지한다. |
| C-13 | checkout truth | D1/D2 일부는 no-money truth를 disclosure로 접고, D3는 확인 직전·결과에 보여야 한다고 주장 | **D3 채택** | 외부 주문·실제 금액 이동이 없다는 consequence를 confirm 직전과 result에 짧게 표시한다. ticker/provider 상세만 접는다. |
| C-14 | payment→stamp | 모두 분리를 요구 | **채택** | receipt와 unique visit event를 별도 화면·시간·state로 분리한다. payment success alone은 stamp/reputation을 바꾸지 않는다. |
| C-15 | Table 여섯 사실 | D2는 list/detail 2×3 icon grid, D3는 list에도 전부, D1은 detail의 label/value 우선 | **D1 수정 채택** | list는 비교에 필요한 `시간·남은 자리·형식`을 우선 노출하고 detail의 Join 결정 전에 여섯 사실 전부를 icon+label+value로 보인다. icon-only grid와 여섯 문장 list는 모두 기각한다. |
| C-16 | Table 실제성 truth | D1은 Join 앞 한 줄, D2는 일부 disclosure, D3는 actual host/reservation 부재를 필수로 봄 | **D1·D3 채택** | Join 결정점에 `실제 host에게 예약이 전송되지 않음`을 한 번 표시한다. 반복 preview badge는 제거한다. |
| C-17 | 모바일 nav | D2·00 Standard는 icon-only, D3는 accessible semantics를 강조 | **동시 채택** | phone은 5 icon-only, 48px default target. selected는 **black filled tile 한 가지 단서만** 쓰고 indicator를 겹치지 않는다. localized accessible name과 first-use coach label을 둔다. |
| C-18 | touch target | D1/ledger는 최소 44px, D2는 48px 공통 | **수정 채택** | 법적 최소 44px, 기본 component 48px. 밀도 때문에 44로 내릴 때 adjacent gap 8px과 automated geometry evidence를 요구한다. |
| C-19 | body typography | D2/00 Standard는 15~17px, D3는 16px 상당 | **D3 수정 채택** | decision/body 기본 16px 이상. 15px는 secondary helper만, 14px는 provenance만, 12px 미만 금지. |
| C-20 | sheet 높이 | D2 absolute px/dvh와 00 Standard semantic max가 다름 | **00 Standard 수정 채택** | Peek content-fit≤32dvh, Decision content-fit≤72dvh, Detail≈88dvh, Full task 100dvh. short landscape는 하나의 internal scroll; sticky header/footer가 본문을 덮지 않는다. |
| C-21 | atlas→city motion | D2 420~450ms, 00 Standard 420~650ms | **수정 채택** | 420~520ms를 locked range로 삼고 80ms 안에 tap feedback, 100ms 안에 camera motion. distance가 커도 650ms를 넘기지 않는다. reduced motion은 jumpTo/0ms. |
| C-22 | 온도 숫자 | D2/Standard는 선택 후 숫자 가능, 사용자 원칙과 D1은 기본 노출 반대 | **D1 채택** | marker/list/peek 기본에 score·Hot·Peak를 쓰지 않는다. 서울·부산 숫자/freshness/confidence는 사용자가 연 temperature detail만, 제주는 어디에도 숫자 없음. |
| C-23 | 세 도시 | 모두 same renderer를 지지 | **채택** | `field→aura→core→selected halo→capsule`, 같은 hit target/shell/list/detail. 서울 double, 부산 single, 제주 dashed; 제주 `editorial-unscored`. |
| C-24 | official/editorial 표현 | 아이콘화 요구와 D3의 visible truth가 긴장 | **수정 채택** | count·장문은 제거하지만 list/detail decision에는 source glyph+짧은 localized label을 둔다. icon-only로 official/editorial truth를 숨기지 않는다. |
| C-25 | place/Table 이미지 | D1·D2는 photo-led, Standard는 source-backed만 venue photo로 허용 | **Standard 채택** | 실제 source media 우선. category art는 illustration으로 명시하며 인접 카드 반복 금지. synthetic people은 onboarding/Table invitation/My memory에만, eKYC/official venue proof에는 금지. |
| C-26 | After19 | 모두 same geometry+dark geography 보존 | **채택** | 일반 장소를 숨기지 않는다. 도로·해안·지명은 남고 eligible night layer만 강조한다. immediate off와 manual-off precedence 유지. |
| C-27 | Labs Testnet 표현 | D3는 public txRef 없으면 TESTNET이라 부르지 말라 하고, 정본은 exact target label 요구 | **D3 해당 문장 기각** | `Target network: Sui Testnet · Simulated`는 target을 말하므로 유지한다. txRef가 없으면 완료 transaction/explorer link만 금지한다. |
| C-28 | Flow별 REQ | D2의 FL-004/007/008/009/010/011 mapping이 canonical registry와 다름 | **D2 매핑 기각** | 아래 18행과 preservation ledger를 사용한다. cross-flow 참고 REQ는 `지원`으로 표기하고 소유 REQ를 바꾸지 않는다. |
| C-29 | reset | D1/D2/D3 모두 discovery와 ID reset 분리 | **채택** | Settings에서 discovery preference reset, ID session reset, public profile change, wallet/local record restore를 별도 scope와 confirmation으로 유지한다. |
| C-30 | route/social metadata | 독립안과 00 문서에 최신 사용자 피드백이 거의 없음 | **추가 채택** | public route에서 `/ondo-b`를 제거하고 legacy redirect를 보존하는 migration spec, `K-Tour ID — ONDO` title/OG/favicon asset 규칙을 cross-screen 문서에 추가한다. 정본 route 변경은 Decision Ledger amendment 없이 조용히 수행하지 않는다. |

## 3. P0/P1/P2 최종화

### P0 · 구현 전 반드시 문서로 잠글 것

1. **Provider truth:** 외부 provider 미연결 default가 verified/payment success를 만들지
   않는다. explicit QA/demo fixture만 별도 성공을 가진다.
2. **Balance provenance:** `₩60,000`의 의미와 `no funds`를 한 vocabulary/state로
   정리한다. 미연결 funding choice는 active source로 persist하지 않는다.
3. **Payment consequence:** confirm 직전과 result에 외부 주문·실제 금액 이동 없음을
   표시하고 decline/cancel/timeout에서 balance·receipt·stamp 불변을 검증한다.
4. **Gate axes/returnTo:** Account·Person·Age·Payment·K-Tour credential·Presentation을
   분리하고, one-shot token과 exact target/draft/focus를 보존한다.
5. **Payment≠visit:** unique visit evidence 이전에는 stamp와 reputation을 바꾸지 않는다.
6. **Source truth:** 서울·부산 official, 제주 editorial-unscored, ONDO simulated field,
   merchant trait contract-only를 같은 신뢰 badge로 합치지 않는다.

### P1 · 제품 경험을 Toss급으로 만들기 위해 이번 설계 파동에서 닫을 것

1. first paint부터 같은 MapLibre를 유지하는 map-backed onboarding과 420~520ms
   atlas→city transition.
2. 서울·부산·제주 same renderer, 실제 좌표, 작은 adjacent label, no score/Hot/Peak.
3. After19 dark에서도 coast/road/label과 일반 장소를 유지.
4. single-sheet JIT coordinator와 K-Tour setup/presentation 분리.
5. Table detail의 여섯 사실, sticky obstruction 0, chat/safety hierarchy.
6. Local Signal draft-first→Submit gate→exact draft return, photo failure/replace/remove.
7. place/list/My Korea에 source-backed media를 넣되 category art를 venue photo로 가장하지 않음.
8. phone 5-tab icon-only dock, Settings compact IA, KO/EN/JA 320/390/430/short-landscape.
9. public route·title·OG/favicon과 provided K-Tour ID/ONDO asset 사용 규칙.

### P2 · P0/P1 contract 이후 polish

1. shared type/spacing/radius/elevation/icon tokens와 final override 제거.
2. success page 대신 source object morph, one-shot haptic/animation, no confetti.
3. source/privacy/provider disclosure의 한 위치 통합.
4. 200% zoom, forced colors, reduced motion, pseudo-expansion 130%, JA 금칙/줄바꿈.
5. first-use coach label, empty state imagery, placeholder crop, image-pool repetition 방지.

P2를 이유로 P0/P1을 미루거나, 반대로 polish 과정에서 PRD 상태를 삭제해서는 안 된다.

## 4. FL-001~FL-018 최종 합의 권고

| Flow | 최종 합의 권고 | 반려 조건 | 보존 REQ |
|---|---|---|---|
| `FL-001` | 같은 MapLibre first frame에서 map-backed intro→44px city beacon→420~520ms camera→city chrome. search autofocus 금지, Map/List/peek/detail same history. | 별도 poster/white route, 큰 city pill, score/Hot/Peak, 제주 별도 renderer, source/count 장문, context 없는 fallback. | `REQ-007`, `REQ-013`, `REQ-017`~`REQ-019` |
| `FL-002` | locked venue가 sheet anchor. Age predicate 하나→consent→result→같은 venue After19. 외부 check 미연결 truth를 consent/result에 한 번. | Account/Person/Passport/Payment 강제, generic K-Tour setup, 다른 venue·camera 복귀, 일반 상세 차단. | `REQ-005`, `REQ-012` |
| `FL-003` | list는 time/seats/format, detail Join 전 six facts 전부. 한 anchored gate shell→member chat→check-in→feedback. Join 앞 no real host/reservation truth 한 번. | icon-only facts, six-fact 누락, sticky note 가림, nonmember chat, report/block/leave 삭제, Table 실패가 reputation 변경. | `REQ-008`~`REQ-010`, `REQ-015` |
| `FL-004` | merchant/benefit/final KRW→source draft→Account/Payment→local usage record→별도 unique visit→9→10→optional Labs badge. | OOKRW/ticker 기본 노출, positive balance+no funds, 실제 주문/돈 이동 암시, payment만으로 stamp 증가. | `REQ-006`, `REQ-011`, `REQ-016` |
| `FL-005` | Person-required action에서 Mobile ID JIT. requester/purpose/predicate consent, public default provider unavailable, explicit fixture만 local result. setup과 presentation 분리. | onboarding auto-CX, providerless official success, Person 성공으로 Age/Payment/Account 완료, 원 draft 소실. | `REQ-001`, `REQ-005` |
| `FL-006` | Residence availability를 method row에서 먼저 알리고 unavailable이면 같은 sheet의 Passport alternate. 원 행동 고정. | 국적/법적 체류 추론, unavailable을 Person success로 처리, modal stack, alternate가 새 home으로 이동. | `REQ-002`, `REQ-003`, `REQ-005` |
| `FL-007` | 첫 MapLibre 위 `[한국 여행]` intent→food/diet chips→personalization preview→Guest map. KYC/Wallet 없음. | 별도 hero route, CTA below fold, short-term=Passport 강제, preference가 temperature/eligibility 변경. | `REQ-003`, `REQ-005`, `REQ-018` |
| `FL-008` | 같은 sheet의 `[내 주변 탐색]` intent→지역/취향→Guest map. Mobile ID는 later Person action에서만 추천. | Korean=verified/Account/CX 완료, 국적 badge, onboarding CX 호출, failure가 map 차단. | `REQ-001`, `REQ-005`, `REQ-018` |
| `FL-009` | `[한국에서 생활]` intent→생활권/취향→Guest map. Residence/Passport는 later JIT method. | legal residency/card 보유 추론, credential CTA 선제 노출, provider 미연결로 onboarding 실패. | `REQ-002`, `REQ-005`, `REQ-018` |
| `FL-010` | 원 Save/Table/checkout 객체와 현재 unmet gate 하나를 같은 Decision sheet에서 처리. success 직전 full plan 재검증 후 token one-shot 소비. | `minimum check/on-device` wall, 모든 축 badge, nested modal, cancel/reload/duplicate/forged RT mutation. | `REQ-005`, `REQ-008`, `REQ-011` |
| `FL-011` | bookmark morph→필요 시 Account→실제 Save mutation→My Korea memory map/timeline→canonical venue round trip. | gate success=save success, 반복 on-device copy, nav text 2줄, failure인데 filled bookmark, reset partition 병합. | `REQ-005`, `REQ-016` |
| `FL-012` | venue에서 chips/note/photo draft 먼저, Submit 시 Account→Person, exact draft resume, success는 Visit/Contribution만. | form 전 강제 K-Tour setup, draft URL 저장/손실, fake upload, heat/Person/Meetup/stamp 변경, sticky clipping. | `REQ-003`, `REQ-007`, `REQ-009`, `REQ-015` |
| `FL-013` | city/locked alcohol target에서 Age-only sheet, Guest 가능, 성공 후 same map/place, Account는 persistence에만 필요. | Account/Person 강제, mode/filter 혼동, manual-off 무시, raw DOB/document 저장. | `REQ-012` |
| `FL-014` | exact guard set 통과 시 같은 camera/geometry 위 night token crossfade, 한 줄 status+즉시 off, 일반 장소·geography 유지. | 검은 빈 지도, 술집 외 장소 삭제, recurring modal/banner, manual-off 뒤 auto re-enable. | `REQ-012`; `REQ-019` 시각 문법 지원 |
| `FL-015` | From/Lives in/Languages field별 value+visibility→실제 public preview→save. 네 reputation 축 독립 timeline. | ID-derived 자동 공개, nationality matching, aggregate trust/safety score, save failure가 published state 변경. | `REQ-008`, `REQ-015` |
| `FL-016` | place fact를 source checked/unknown/stale/error로 표시하고 source detail을 접기. official/editorial/trait 범위 분리. | official=추천/영업/안전/결제 가능, unknown을 yes/no로 변환, OpenDID=EAS, 연결 없는 live refresh 성공. | `REQ-004`, `REQ-013`, `REQ-014` |
| `FL-017` | final KRW+merchant를 고정한 Payment-only gate. default disconnected=unavailable, explicit fixture result만 local/demo truth. exact checkout one-shot return. | KYC가 Person/Age/K-Tour 완료, providerless receipt/돈 이동, cancel/fail asset mutation, amount context 소실. | `REQ-005`, `REQ-011` |
| `FL-018` | consumer Wallet 밖 Labs. acknowledgement→separate assets→quote→source confirmed→destination final→technical receipt; target label exact 유지. | 합산 USD ledger, destination final 전 success/balance, fake tx/explorer, AMM/redemption claim, 일반 nav에 Labs 승격. | `REQ-004`~`REQ-006`, `REQ-014`, `REQ-016` |

## 5. 사용자 피드백 누락 가능성 감사

18개 Flow만 쓰면 아래 항목이 다시 빠질 수 있다. `X-*` 교차 화면 명세와 release
문서에서 명시적으로 소유해야 한다.

| 사용자 피드백 | 현재 문서 커버리지 | 잠글 조치 |
|---|---|---|
| phone bottom nav에 글자 없이 icon 중심 | 00 Standard/D2에 있음 | `X-AppShell`: 5 icon-only, 48px, one selected cue, localized accessible name. |
| Settings의 `On this device`·긴 언어 카드 제거, 일본어 지원 | 부분 커버 | `X-Settings`: title은 `Settings`, 첫 row compact KO/EN/JA language selector, data/reset은 별도 disclosure. |
| `/ondo-b`를 정규 route로 전환 | 거의 누락 | `X-Release`: canonical public route amendment, legacy `/ondo-b` redirect, deep-link/Back/OG smoke. |
| URL/썸네일 모두 K-Tour ID 또는 ONDO(K-Tour ID) | Brand에만 부분 커버 | public metadata는 `K-Tour ID — ONDO`, social description/OG/favicons는 제공 asset crop을 쓰고 구형 `Korea Pulse` 문구 제거. |
| root `sources`의 logo/PNG 활용 | 누락 | asset inventory, license/source, favicon 16/32, app icon, identity lockup, OG 1200×630 crop을 cross spec에 명시. |
| intro의 잘림·기울어진 흰 layer 제거 | D2 map-first에 포함 | `X-Map`: headline은 map 위 gradient scrim, rotated/tilted white hero 금지, safe-area clipping 0. |
| 위치 거부 popup이 heat/map을 가림 | 부분 커버 | locate control에 slashed state; prose는 denial 때만 anchored InlineStatus, dismiss/recovery 후 동일 map. |
| 도시 pin 실제 위치·도시 연결선 | geography에 포함 | 실제 projection 좌표와 route line anchor pixel tolerance를 mobile evidence로 잠금. |
| 제주가 서울·부산과 같은 list/place/temperature UI | D-14와 세 안에 있음 | 같은 renderer/shell/card/detail, 제주만 compact editorial/limited label; 숫자·Hot 없음. |
| place/list에 음식 이미지 | Standard에 포함 | source media 우선, category illustration label, adjacent duplicate 금지, 16:10 thumbnail crop. |
| 실제 사람 느낌의 이미지 | 제한만 있음 | synthetic people은 onboarding aspiration/Table invite/My memory만. nationality·age·verification 암시 금지, eKYC/official proof에 사용 금지. |
| 91 Peak, 200 official records, source scope 설명 제거 | 세 안에 부분 커버 | 숫자/count/methodology는 detail disclosure. source class는 짧은 glyph+label로 남겨 truth 보존. |
| `Pulse` 용어 제거, ONDO는 온도로 표현 | 부분 커버 | consumer copy registry에서 `Pulse/Peak/Hot` 0회, `ONDO 온도`와 visual field만 사용. 내부 ID는 migration 전 유지 가능. |
| wallet 숫자 comma·KRW/USD 우선 | 00 Standard/D-13에 있음 | locale formatter, tabular numeral, `₩60,000`/`60,000 KRW`, USD는 basis/time 있을 때만. |
| 국내/장기 거주 bank top-up, 여행자 USDC/USDT·Apple Pay 경로 | D3만 상세 | consumer funding options는 보이되 current provider status가 unavailable이면 commit 금지. technical asset/settlement는 details/Labs. |
| After19 neon/dark이면서 지도는 읽힘 | 모두 포함 | coast/road/labels 3:1 이상, same geometry, 일반 장소 유지, auto/manual guards. |
| K-Tour onboarding과 food preference의 유기적 연결 | D1/D2에 있음 | credential에 preference를 넣지 않고, preference→map→필요 action→JIT credential→exact map/action 복귀로 연결. |
| 이미지/지도 loading animation | D2/00 Standard에 있음 | previous atlas 유지, 800ms compact progress, 5s List, one-shot field bloom, reduced motion. |
| 모든 모바일 페이지의 잘림·여백·sticky obstruction | 원칙만 있음 | Flow별 320×568, 320×800, 390×844, 430×932, 844×390 artifact와 overlap assertion을 요구. |

## 6. 문서 작성자가 그대로 사용할 locked decisions

아래 문장은 합의 문서에 의미를 바꾸지 않고 옮긴다.

1. `L-01` current consumer map은 MapLibre 한 instance이며 intro→city 사이에 poster,
   static map, white route flash를 두지 않는다.
2. `L-02` first paint는 MapLibre atlas이고 value/intent/preferences는 그 위 하나의
   bottom sheet에서 진행한다.
3. `L-03` onboarding 세 branch는 추천 의도이지 국적·체류·신원 state가 아니다.
4. `L-04` preference는 match keyline/list ordering만 바꾸고 ONDO temperature,
   source class, eligibility를 바꾸지 않는다.
5. `L-05` atlas→city는 420~520ms, tap feedback≤80ms, camera start≤100ms다.
   reduced motion은 `jumpTo`/0ms다.
6. `L-06` 서울·부산·제주는 같은 `field→aura→core→selected halo→capsule` renderer와
   44px minimum hit target을 쓴다. 제주는 `editorial-unscored`, 숫자 없음이다.
7. `L-07` score·Hot·Peak·record count는 marker/list/peek 기본에서 보이지 않는다.
   서울·부산 score/freshness/confidence는 temperature detail에만 있다.
8. `L-08` phone dock은 Explore/My Korea/Tables/ID·Wallet/Settings 5개 icon-only다.
   기본 48px target, black filled selected tile 하나만 쓰며 visible label/indicator를
   겹치지 않는다.
9. `L-09` body는 16px 이상, helper만 15px, provenance만 14px, 12px 미만은 금지한다.
10. `L-10` Peek≤32dvh, Decision≤72dvh, Detail≈88dvh, Full task=100dvh이고 active
    modal/sheet는 한 층이다.
11. `L-11` JIT sheet는 원 객체를 고정하고 지금 필요한 축 하나만 보여준다. 미래
    gate를 badge/checklist로 전시하지 않는다.
12. `L-12` Account, Person, Age, Payment KYC, K-Tour credential, Presentation,
    Reputation은 독립 상태다.
13. `L-13` exact return object는 route/surface, city, camera, map/list, query, filter,
    selection, layer, section/scroll, opener focus, draft, pending CTA를 필요한 범위로
    보존한다. success 직전 full plan을 재검증하고 token을 one-shot 소비한다.
14. `L-14` public default provider 미연결은 unavailable이며 verified/payment success를
    만들지 않는다. 성공 fixture는 명시적 QA/demo mode에서만 가능하다.
15. `L-15` provider명·DID/VC·network·ticker는 접지만 requester, purpose, predicate,
    consent, 금액, public scope, unavailable/failure/recovery는 접지 않는다.
16. `L-16` K-Tour setup은 `Choose→Check→Add`; `Present`는 실제 요청 행동의 별도
    consent/result다.
17. `L-17` consumer balance는 KRW primary, 근거 있는 USD secondary다. OOKRW/USDC/
    USDT/network는 payment detail 또는 Labs다.
18. `L-18` positive balance와 `no funds added`를 함께 보이지 않는다. funding choice는
    sheet-local draft이며 unavailable method는 ready로 commit하지 않는다.
19. `L-19` 외부 주문·실제 금액 이동이 없는 current checkout은 confirm 직전과 result에
    그 consequence를 한 번 보여준다.
20. `L-20` payment receipt와 unique visit event는 별도다. payment만으로 stamp 또는
    reputation을 바꾸지 않는다.
21. `L-21` Table list는 time/seats/format을 우선하고, Join 결정 전 detail에 six facts
    전부를 icon+label+value로 보여준다. Report/Block/Leave 동사는 유지한다.
22. `L-22` Local Signal은 draft-first이고 Submit 시 Account→Person을 거친 뒤 exact
    draft로 복귀한다. 성공은 Visit/Contribution만 바꾼다.
23. `L-23` After19는 일반 지도를 교체하지 않는 lens다. coast/road/labels와 일반
    장소를 유지하고 manual-off가 session auto-on보다 우선한다.
24. `L-24` source-backed place media만 venue photo로 쓴다. category art는 illustration,
    synthetic people은 사람 맥락에만 제한한다.
25. `L-25` official/editorial distinction은 짧은 glyph+localized label로 decision에
    남기고 full provenance는 drawer로 접는다.
26. `L-26` Labs는 consumer Wallet 밖에 있고 exact `Target network: Sui Testnet ·
    Simulated`를 유지한다. txRef가 없으면 completed transaction/explorer link는 없다.
27. `L-27` Settings는 `Settings` 한 제목, compact KO/EN/JA language row, 분리된
    discovery/ID/profile/wallet data scopes를 쓴다. `On this device`는 page title이 아니다.
28. `L-28` public route/metadata 전환은 별도 amendment와 redirect/smoke를 가진다.
    표시명은 `K-Tour ID — ONDO`이고 제공 logo asset을 identity/social/favicon 규칙에 쓴다.
29. `L-29` normal consumer title/CTA에 `preview/simulated/test/on-device/provider`
    제작자 언어를 반복하지 않는다. 오해 방지 consequence는 삭제하지 않는다.
30. `L-30` 모든 Flow는 320/390/430 portrait, 320×568, 844×390, KO/EN/JA, 200%
    zoom, forced colors, reduced motion, keyboard/screen reader에서 동일 meaning과
    exact return을 증명한다.

## 7. 문서 반영 순서

1. `00_UX_STANDARD.md`에 C-08, C-11~13, C-15, C-17~22, C-27을 먼저 반영한다.
2. `00_PRD_PRESERVATION_LEDGER.md`의 provider-default/demo fixture, balance provenance,
   public route/metadata, 정확한 Flow별 REQ owner를 보강한다.
3. FL-001~018 문서는 Section 4의 한 행을 각각 baseline으로 삼고, 모든 문서에
   `ENTRY/DECISION/CANCEL/ERROR/RETRY/TERMINAL/RETURN`과 exact return fields를 쓴다.
4. `X-AppShell`, `X-Settings`, `X-Japan-Jeju`, `X-Loading-Error-Responsive`,
   `X-Release-Brand`가 Section 5의 교차 항목을 소유한다.
5. 마지막에만 visual baseline을 갱신한다. 기존 contract/fixture/test ID를 presentation
   정리 명목으로 삭제하지 않는다.

## 8. 교차검증 완료 조건

- Flow 합의 권고 행: `18 / 18`
- canonical checkpoint 보존: `18 × 7 = 126` (`123 ACTUAL / 3 reasoned N/A`)
- locked decisions: `30`
- 구현 source 수정: `0`
- `git diff --check`: `PASS` — exit `0`, 출력 없음.

새 파일 자체는 아직 untracked이므로 추가로
`git diff --no-index --check /dev/null docs/toss-grade-ux/_reviews/C1_PRODUCT_CHALLENGE.md`
를 실행했다. content difference로 예상된 exit `1`이었고 whitespace diagnostic은
`0`건이었다.

검증 결과: `18 / 18 FLOW ROWS · 30 LOCKS · DIFF CHECK CLEAN`
