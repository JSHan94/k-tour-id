# FL-017 · Payment KYC

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-005`, `REQ-011` |
| 진입 행동 | 장소 혜택 checkout의 `결제 계속`; Account gate가 필요하면 `FL-010` 완료 후 동일 `START_CHECKOUT` envelope를 이어받는다. |
| 성공 결과 | 명시적 review fixture에서만 `PKY-VERIFIED`; 같은 merchant·offer·최종 KRW·funding source draft가 있는 checkout으로 돌아간다. 실제 결제 confirm은 사용자가 다시 누르며 `FL-004`가 소유한다. |
| 취소 결과 | 결제·receipt·balance·stamp mutation 없이 같은 장소 혜택 sheet로 돌아가고 기존 usable funding source와 잔액을 유지한다. |
| 실패·재시도 | public provider 미연결은 concise `PROVIDER_UNAVAILABLE`; `PKY-VERIFIED`나 결제 성공을 만들지 않는다. 같은 sheet에서 재시도하거나 장소로 돌아간다. unavailable funding intent는 active source로 저장하지 않는다. |
| 정확한 복귀 | token은 정확히 `RT-START_CHECKOUT-${Date.parse(createdAt)}`이며 canonical envelope에는 required `venueId`만 넣고 `tableId`와 checkout/UI field는 금지한다. merchant·offer·최종 KRW·USD basis/time·usable/draft source는 checkout domain memory에, route·sheet snap·scroll·focus는 shell local snapshot에 따로 보존한다. full guard plan 재검증 뒤 결제 mutation 직전 한 번만 소비한다. |
| 실행 truth | normal public path에는 외부 Payment KYC·bank·card·Apple Pay·digital-dollar provider가 연결되지 않았다. review success는 `SIMULATED` provenance가 있는 QA 경로뿐이며 실제 주문·입금·출금·settlement를 주장하지 않는다. |

### 삭제할 수 없는 PRD 불변식

- `Payment KYC`는 Account, Person, Age, K-Tour credential, presentation, reputation과 독립이다. 이 flow가 다른 축을 완료하지 않는다.
- 장소명, benefit, 최종 KRW는 Payment Decision의 모든 단계에서 header에 고정된다.
- normal UI는 KRW primary다. USD는 환산 기준과 시각이 있을 때만 secondary estimate다.
- `OOKRW`, `USDC`, `USDT`, chain, settlement, provider는 opened payment details 또는 Labs에서만 보인다.
- bank, card·Apple Pay, USD wallet은 persona를 추론하지 않는 selectable funding intent다. 미연결이면 같은 sheet의 unavailable/recovery에서 끝나며 active source·balance를 변경하지 않는다.
- 기존 travel balance는 사용할 수 있다. non-zero balance에는 `이번 여행에 준비된 잔액` 같은 명확한 source가 있어야 하고 `no funds added`와 함께 표시하지 않는다.
- 실패·취소·만료는 payment, receipt, balance, assets, stamp, reputation을 변경하지 않는다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| wallet 설정이 장소 혜택/checkout과 분리되어 별도 제품처럼 보인다. | 왜 잔액을 만들고 어디에 쓰는지 연결되지 않는다. | P1 | place offer→wallet→checkout |
| `OOKRW Test`, `USDC/USDT`, provider/network가 normal balance와 CTA에 노출될 수 있다. | 법정통화·실제 자산·test token을 혼동한다. | P0 | wallet/funding/checkout surface |
| bank/card/Apple Pay/USD wallet 선택이 provider 없이 ready로 저장될 수 있다. | 입금·결제가 가능하다고 오인하고 기존 usable source를 잃는다. | P0 | FundingSourceSheet |
| Payment KYC modal이 K-Tour ID, Person, 19+와 여러 단계로 섞일 수 있다. | 지금 필요한 조건과 공유 범위를 판단할 수 없다. | P0 | `PKY-NOT-STARTED` gate |
| provider 미연결인데 fixture receipt로 곧바로 이동할 수 있다. | 실제 payment eligibility와 결제 성공이 있었다고 오인한다. | P0 | normal public checkout |
| positive travel balance와 `no funds added/local only` 문구가 공존할 수 있다. | ₩60,000의 출처와 사용 가능성을 신뢰할 수 없다. | P0 | wallet balance card |

## 3. 목표 경험

### 한 문장 약속

> 선택한 장소의 최종 KRW를 보며, 쓸 수 있는 잔액 또는 자금 경로를 고르고, 결제에 필요한 확인 하나만 처리한다.

### 사용자가 1초 안에 알아야 하는 것

- 어느 장소에 얼마를 쓰는지, 현재 usable source가 무엇인지 알 수 있다.
- 새 funding route가 아직 연결되지 않았다면 `사용 가능`처럼 보이지 않는다.
- Payment KYC가 완료되어도 Person·19+·K-Tour ID가 완료되는 것은 아니다.

### 사용자가 읽지 않아도 알아야 하는 것

- merchant thumbnail/name, benefit, large tabular KRW가 sheet header에서 움직이지 않는다.
- usable source에는 selected check, unavailable intent에는 clock/minus glyph가 붙는다.
- KYC 결과는 같은 checkout button state로 돌아오며 별도 성공 page를 만들지 않는다.

## 4. 권장 모바일 여정

```text
PLACE BENEFIT ENTRY
→ REVIEW FINAL KRW + USABLE SOURCE OR FUNDING INTENT
→ PAYMENT KYC DECISION
→ PKY-PENDING
→ REVIEW FIXTURE VERIFIED | PROVIDER_UNAVAILABLE | PKY-FAILED | CANCEL
→ SAME CHECKOUT OR SAME PLACE BENEFIT
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 이 장소에서 이 금액을 사용할까요? | merchant+benefit+final KRW | 결제 계속 | venue/offer/amount/source/sheet state |
| Source decision | 어떤 경로를 사용할까요? | usable travel balance와 selectable intent rows | source 선택 | existing usable source와 positive balance |
| KYC decision | 결제를 위해 필요한 확인을 시작할까요? | same checkout header + Payment predicate | 결제 확인 시작 | `START_CHECKOUT` envelope |
| Pending | 확인 중인가요? | payment glyph progress | 취소 | payment/receipt/assets/stamp unchanged |
| Verified review | 원 checkout을 계속할까요? | payment condition check + same amount | checkout으로 돌아가기 | review provenance, RT unconsumed until final mutation |
| Unavailable/Failure | 지금 연결할 수 없을 때 어떻게 할까요? | warning + recovery | 다시 시도/장소로 돌아가기 | old source/balance/draft context |
| Return | 같은 장소·혜택·금액인가요? | original CTA focus | 사용자가 final confirm 여부 결정 | exact return, no auto payment |

## 5. 화면별 상세 규격

### Screen/Sheet A · Checkout anchor and funding source

**목적**

- 장소 혜택과 잔액/자금 경로를 한 journey로 연결하되 미연결 경로의 truth를 지킨다.

**첫 viewport에 보이는 것**

- merchant thumbnail/name, benefit, final price `₩19,000` 같은 locale-formatted KRW.
- 현재 usable source와 available balance; source change trigger.
- primary `결제 계속` 또는 usable balance 사용 시 `여행 잔액 ₩19,000 사용`.

**시각·인터랙션**

- Decision sheet는 content-fit, 최대 72dvh. 금액은 tabular numerals와 locale grouping을 쓰고 ticker를 붙이지 않는다.
- merchant media는 source-backed 1:1 thumbnail을 56~64px로 쓴다. 이미지가 없으면 음식 category pictogram+accessible label을 같은 slot에 두며 빈 avatar, 임의 이니셜, generic `P` box를 만들지 않는다.
- 320px에서는 merchant row와 final KRW를 각각 full-width row로 둔다. `₩`+숫자는 하나의 tabular amount로 유지하고 ticker를 붙이거나 ellipsis로 자르지 않으며, 200% zoom에서는 responsive type token으로 한 줄을 확보한다.
- non-zero fixture balance는 `이번 여행에 준비된 잔액 ₩60,000`으로 표현하고 접힌 상세에서만 `기기 안의 데모 잔액 · 외부 입금 없음` truth를 보인다.
- source rows는 `여행 잔액`, `은행 계좌`, `카드 · Apple Pay`, `USD 지갑`이다. 국적·persona로 숨기지 않고 capability에 따라 정렬/추천만 한다.
- unavailable row를 tap하면 selected draft outline은 보이지만 active check를 주지 않는다. recovery close 시 기존 usable source로 돌아간다.

**행동**

- Primary: `결제 계속` 또는 `여행 잔액 {amount} 사용`
- Secondary: `결제 수단 변경`, `결제 상세`
- Close/Back: 같은 place benefit으로 복귀, funding draft discard

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | merchant, benefit, final KRW, usable source, available balance, primary |
| 시각화 | selected usable check, unavailable clock/minus, KRW hierarchy, source icon |
| 한 번 접기 | USD estimate+basis/time, demo balance source, payment consequence, OOKRW settlement hypothesis |
| Labs/개발 문서로 이동 | USDC/USDT chain rows, network, adapter/provider, fixtureId, ledger diagnostics |
| 삭제 | `OOKRW Test` primary label, `Provider needed`, `Local only`, nationality branches, fake funding success, wallet marketing hero |

### Screen/Sheet B · Funding intent unavailable

**목적**

- 사용자가 원하는 route를 선택해볼 수 있게 하되, 연결되지 않은 경로를 honest recovery에서 끝낸다.

**첫 viewport에 보이는 것**

- 선택한 human route (`은행 계좌`, `카드 · Apple Pay`, `USD 지갑`).
- `아직 사용할 수 없어요`, 기존 travel balance 유지 상태, `여행 잔액 사용` 또는 `다른 방법 보기`.

**시각·인터랙션**

- 같은 FundingSourceSheet에서 inline result로 morph하며 새 modal을 쌓지 않는다.
- `Not available yet`은 disabled dead end가 아니라 route intent를 보존한 recovery state다. provider명/기술 원인은 한 번 접는다.
- close/back 또는 다른 method 선택 시 unavailable draft를 active state에 commit하지 않는다.
- `USD 지갑` 상세을 열었을 때만 USDC/USDT를 separate rows로 보여주며 combined USD asset처럼 합치지 않는다.

**행동**

- Primary: 기존 잔액이 있으면 `여행 잔액 사용`, 없으면 `다른 방법 보기`
- Secondary: `나중에 다시 보기`; provider가 실제 구성된 경우에만 `다시 시도`
- Close/Back: source list 또는 checkout으로 돌아가고 기존 usable source 복원

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | selected human route, unavailable state, preserved source/balance, recovery |
| 시각화 | unavailable glyph, prior usable source check, noncommitted draft border |
| 한 번 접기 | provider 미구성 범위, 예상 지원 형태, USD asset detail 진입 |
| Labs/개발 문서로 이동 | USDC/USDT network/representation, provider adapter, raw error, test token |
| 삭제 | 연결/입금 완료 check, 새 balance, `ready`, fake Apple Pay sheet, 자동 source commit |

### Screen/Sheet C · Payment KYC Decision

**목적**

- checkout에 필요한 Payment predicate 하나의 이유·범위·결과를 처리한다.

**첫 viewport에 보이는 것**

- 고정 merchant/benefit/final KRW header.
- payment glyph, 제목 `결제를 위한 확인`, 이유 한 줄, primary.
- close/back과 normal public provider availability.

**시각·인터랙션**

- Account가 완료되어도 이 sheet에는 Account/Person/Age/K-Tour ID stepper를 재노출하지 않는다.
- Decision→Pending→result는 같은 sheet body만 160~200ms 교체한다.
- provider 미연결은 check를 쓰지 않고 `지금 결제 확인을 연결할 수 없어요`와 recovery를 보인다.
- explicit review fixture success만 check를 쓰며 `Review fixture · 기기 밖 연결 없음` provenance를 한 번 접는다.

**행동**

- Primary: available review mode에서 `결제 확인 시작`; unavailable이면 `장소로 돌아가기`
- Secondary: `다시 시도` 또는 `결제 상세`
- Close/Back: 장소 혜택 또는 source decision으로 정확 복귀

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | merchant, benefit, final KRW, Payment condition, availability, recovery |
| 시각화 | payment-only glyph, progress/check/warning 한 자리, pinned amount |
| 한 번 접기 | 확인 범위·expiry, provider/review provenance, USD basis/time, no-external-money consequence |
| Labs/개발 문서로 이동 | raw KYC response, provider/network config, fixture selector, OOKRW/USDC/USDT implementation detail |
| 삭제 | K-Tour/Person/19+ 동시 완료, 4-step identity flow, `ON-DEVICE`, normal ticker, 자동 결제·receipt |

### Screen D · Exact checkout handoff

**목적**

- review fixture의 Payment KYC 성공 후 원 checkout을 사용자가 다시 확인하게 한다.

**첫 viewport에 보이는 것**

- same merchant, benefit, final KRW, usable source, enabled final action.
- final action 직전 `외부 주문이나 실제 돈 이동은 없어요` 한 줄.

**시각·인터랙션**

- KYC success가 payment success로 morph하지 않는다. receipt와 stamp는 보이지 않는다.
- `FL-004`가 final confirm, processing, local receipt, separate unique visit, stamp를 소유한다.
- amount/source/offer가 변했거나 KYC가 만료되면 confirm을 차단하고 새 decision을 만든다.

**행동**

- Primary: `여행 잔액 {amount} 사용` 또는 현재 source 기반 final confirm
- Secondary: `결제 수단 변경`
- Close/Back: 같은 place benefit; payment mutation 0

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | merchant, benefit, final KRW, usable source, final action, no-external consequence |
| 시각화 | KYC condition check와 still-unconfirmed payment button |
| 한 번 접기 | Payment expiry, USD estimate basis/time, settlement detail |
| Labs/개발 문서로 이동 | technical ticker/network/fixture ledger |
| 삭제 | KYC result만으로 receipt/stamp/visit, fake merchant acceptance, auto confirm |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | merchant/amount/source anchor 유지, payment glyph만 progress | 취소 | checkout mutation·asset·stamp 불변 |
| Empty | usable source 0이면 `사용할 잔액이 없어요`와 funding intent rows | 방법 보기, 장소로 돌아가기 | 가짜 positive balance 금지 |
| Failure | `PKY-FAILED` 또는 selected funding unavailable의 inline warning | 다시 시도, 기존 잔액 사용, 장소로 돌아가기 | previous usable source·balance·offer draft 유지 |
| Retry | same sheet, same `START_CHECKOUT` envelope로 pending | 취소 | new modal/route·duplicate request 금지 |
| Cancel | KYC/source draft 취소, same place benefit | 탐색 계속 | PKY/payment/receipt/assets/stamp mutation 0; RT 삭제 |
| Success | explicit review fixture에서만 `PKY-VERIFIED`, checkout final action 활성 | 사용자 final confirm 또는 닫기 | Person/Age/K-Tour/reputation 불변; payment 아직 unconfirmed |
| Return | same venue/offer/amount/source/scroll/focus | `FL-004`로 confirm 또는 place 복귀 | RT는 final payment mutation 직전 one-shot consume |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| place benefit→checkout | 240~280ms sheet morph | merchant image/name/amount shared anchor | duration 0 + focus title |
| checkout→source list | 160~200ms body swap | amount/header/footer 고정 | 즉시 swap |
| source→unavailable | 160~200ms inline morph | selected row anchor·sheet snap 고정 | 즉시 state + live announcement |
| checkout→KYC decision | 160~200ms | merchant/amount header 유지 | 즉시 body swap |
| pending→review result | 220~320ms glyph morph | progress center·amount 고정; confetti 없음 | static check/warning |
| exact return | 240~280ms reverse/morph | original CTA와 sheet snap 고정 | 즉시 return + opener focus |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| KYC Title | 결제를 위한 확인 | Confirm for payment | 支払いの確認 | Payment scope 하나 |
| KYC Primary | 결제 확인 시작 | Start payment check | 支払い確認を始める | payment success를 약속하지 않음 |
| KYC Unavailable | 지금 결제 확인을 연결할 수 없어요 | Payment check isn’t available right now | 現在、支払い確認を利用できません | provider명은 detail |
| Funding title | 결제 수단 | Payment method | 支払い方法 | wallet 기술어 금지 |
| Existing source | 여행 잔액 | Travel balance | 旅行残高 | non-zero면 source 설명 가능 |
| Bank route | 은행 계좌 | Bank account | 銀行口座 | persona-neutral |
| Card route | 카드 · Apple Pay | Card · Apple Pay | カード・Apple Pay | capability 기반 표시 |
| USD route | USD 지갑 | USD wallet | USDウォレット | USDC/USDT는 detail |
| Unavailable route | 아직 사용할 수 없어요 | Not available yet | まだ利用できません | active/ready 금지 |
| Final CTA | 여행 잔액 {amount} 사용 | Use {amount} travel balance | 旅行残高から{amount}を使う | locale amount, text verb |
| Consequence | 외부 주문이나 실제 돈 이동은 없어요 | No external order or real money movement | 外部注文や実際の資金移動はありません | final confirm 직전 한 번 |
| Retry | 다시 시도 | Try again | もう一度試す | provider/configured branch만 |
| Return | 장소로 돌아가기 | Back to place | お店に戻る | exact return |

- normal surface에 `OOKRW`, `USDC`, `USDT`, `Sui`, `settlement`, `provider`, `local-only`, `test wallet`을 쓰지 않는다.
- `₩60,000`, `$45.20`처럼 locale grouping과 currency symbol을 사용하며 USD estimate에는 `기준 {time}`을 함께 둔다.
- `no funds added`는 positive balance와 함께 쓰지 않는다. 잔액이 0일 때만 `아직 준비된 잔액이 없어요`를 쓴다.

## 9. Accessibility·responsive

- 320×568/800·360px edge 16px, 390×844·430px edge 20px; amount, merchant, primary, close가 horizontal overflow 없이 도달한다.
- 844×390은 merchant/amount summary와 decision body를 2-column로 배치할 수 있으나 하나의 internal scroll만 사용하고 primary를 content 위에 겹치지 않는다.
- source row·primary·close는 48px default, 최소 44×44px, gap 8px 이상이다.
- amount는 screen reader가 KRW/USD 단위와 estimate 여부를 읽으며 technical ticker를 normal accessible name에 섞지 않는다.
- selected usable, unavailable draft, preserved previous source를 glyph+text+`aria-selected/disabled` semantics로 구분한다.
- pending/unavailable/failure/review result는 polite live region; final consequence는 confirm button description으로 연결한다.
- sheet는 focus trap, Escape close, background inert, exact opener focus restore를 갖는다.
- 200% zoom에서 final KRW와 CTA가 두 줄까지 허용되며 sticky footer bottom padding이 last recovery를 덮지 않는다.
- forced colors에서 usable/unavailable/selected/pending이 border·glyph·text로 구분된다.
- KO/EN/JA 긴 CTA와 JA 금칙, 130% pseudo expansion에서 ellipsis를 금지한다.

## 10. 계측·완료 기준

### UX signal

- place→benefit→checkout→source→KYC→exact return funnel과 cancel/unavailable recovery를 object ID 없이 pseudonymous event로 기록한다.
- unavailable intent가 active source로 commit된 횟수, public path `PKY-VERIFIED` 횟수, KYC-only receipt/stamp mutation 횟수는 항상 0이어야 한다.
- amount/source/offer return mismatch, duplicate RT consume, expired KYC confirm 차단을 invariant로 검사한다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] merchant·benefit·final KRW·usable source가 모든 Payment KYC 단계에서 고정된다.
- [ ] normal public provider 미연결 경로는 `PKY-VERIFIED`, payment, receipt, balance, stamp를 만들지 않는다.
- [ ] explicit review fixture만 `PKY-VERIFIED`를 만들며 `SIMULATED` provenance와 expiry가 있다.
- [ ] bank/card·Apple Pay/USD wallet은 selectable intent지만 unavailable이면 active source·balance를 변경하지 않고 이전 usable source를 복원한다.
- [ ] normal surface는 KRW primary, basis/time 있는 USD secondary이며 OOKRW/USDC/USDT/network는 details/Labs에만 있다.
- [ ] positive travel balance에는 source가 있고 `no funds added`와 공존하지 않는다.
- [ ] merchant media는 source-backed이거나 labeled category pictogram이며 320px/200% zoom에서 amount와 서로 압축·잘림·ellipsis를 만들지 않는다.
- [ ] Payment KYC 성공이 Person/Age/K-Tour ID/reputation을 바꾸거나 자동 결제하지 않는다.
- [ ] `START_CHECKOUT`은 final payment mutation 직전 한 번만 소비되고 cancel/fail/expiry/tamper는 mutation 0이다.
- [ ] 320/360/390/430, 320×568, 844×390, 200% zoom에서 clipping·overflow·footer overlap이 없다.
- [ ] KO/EN/JA, keyboard, screen reader, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-005` independent gate, `REQ-011` mock payment and currency truth | checkout-anchored Payment-only Decision + truthful funding intents | requirement trace + place/payment E2E |
| State | `PKY-NOT-STARTED/PENDING/VERIFIED/FAILED/EXPIRED`; `PAY-*`는 FL-004 소유 | KYC result와 payment confirm/result 분리 | reducer illegal-transition + no-auto-pay tests |
| Fixture | `FX-PKY-PENDING/SUCCESS/FAIL`, `FX-PAY-OOKRW-QUOTE` | review-only KYC success; public unavailable; OOKRW folded settlement hypothesis | public/review provenance snapshots |
| returnTo | `START_CHECKOUT`, `RT-START_CHECKOUT-${Date.parse(createdAt)}` | envelope는 required `venueId`만; checkout draft와 UI snapshot은 별도 domain/local state로 exact return, final mutation 전 one-shot | success/cancel/fail/expired/tampered/duplicate/unknown-field E2E |
| Persistence | PKY demo session; usable travel balance/source는 explicit source와 함께 | funding draft memory-only, unavailable method noncommit, raw KYC/provider data 0 | storage/ledger/source invariance audit |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 장소·혜택·최종 금액 한 객체, Payment 질문 하나, 기술 copy 접기 | checkout anchor와 single Payment Decision, consumer source names로 고정 |
| D2 시각·인터랙션 | amount/header 고정, source→unavailable inline morph, result→same CTA | stable sheet geometry와 same-object exact return으로 고정 |
| D3 신뢰·접근성 | provider 미연결 fail closed, positive balance causality, draft noncommit, hidden ticker | public/review truth 분리와 funding/payment mutation invariants를 release blocker로 고정 |

잔여 이견: `없음`.
