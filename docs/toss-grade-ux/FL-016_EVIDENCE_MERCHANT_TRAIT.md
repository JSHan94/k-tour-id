# FL-016 · Evidence and Merchant Trait

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-004`, `REQ-013`, `REQ-014` |
| 진입 행동 | 장소 상세의 `가기 전 확인`, 결제·혜택 sheet의 특정 이용 조건·근거 선택 |
| 성공 결과 | card, phone, reservation, language, age, offer 같은 독립 fact를 canonical Evidence Envelope로 정규화해 `yes/no/conditional/unknown/stale/error`로 표시한다. |
| 취소 결과 | evidence drawer를 닫고 같은 venue, fact row, sheet snap, scroll, opener focus로 돌아간다. 공개 장소 정보는 변하지 않는다. |
| 실패·재시도 | provider/source 미구성, stale, invalid, network error를 positive로 승격하지 않는다. 구성된 adapter가 있을 때만 같은 fact row에서 재시도하며 기존 공개 snapshot을 유지한다. |
| 정확한 복귀 | gate `returnTo`는 없다. `venueId + factKey + section + route + map/list selection + scroll + focus`를 local navigation context로 보존한다. |
| 실행 truth | official directory, editorial, ONDO signal, merchant trait, OpenDID, EAS는 서로 다른 source class다. merchant trait는 `CONTRACT_ONLY`, 실제 EAS 발급·조회는 `Deferred`; 한 adapter를 다른 adapter의 구현처럼 표현하지 않는다. |

### 삭제할 수 없는 PRD 불변식

- 공식 directory 기록은 품질, 현재 영업, 결제 가능, 혜택 적격, 안전을 보증하지 않는다.
- 서울·부산 official source와 제주 editorial source를 합치지 않는다. 제주 장소를 official record나 scored ONDO로 승격하지 않는다.
- OpenDID와 EAS는 독립 adapter이며 canonical envelope만 공유한다.
- evidence와 trait의 `unknown`, `stale`, `invalid`, `error`, `ineligible`를 success/eligible처럼 표시하지 않는다.
- merchant trait receipt는 merchant, offer, policy, redemption fact만 다루며 방문·입장·신원·안전을 증명하지 않는다.
- source class가 결정을 바꾸는 곳에는 compact glyph+localized label을 보이고, ID/hash/adapter/timestamp는 한 번 접는다.

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
| 긴 `공식 출처·확인 범위` box와 maker 설명이 장소 행동보다 앞선다. | 사용자가 실제로 필요한 card·예약·언어·19+ 여부를 빨리 찾지 못한다. | P1 | place detail/source disclosure |
| generic shield나 `verified`가 서로 다른 source를 하나로 보이게 한다. | official 등록을 영업·품질·혜택 보증으로 오인한다. | P0 | `EVD-VALID`, `TRT-ELIGIBLE` |
| `unknown/stale/error`가 빈칸이나 positive check로 축약될 수 있다. | 확인되지 않은 조건을 충족한다고 잘못 판단한다. | P0 | `EVD-UNKNOWN/STALE/ERROR`, `TRT-*` |
| provider가 없는데 refresh 또는 live result를 약속할 수 있다. | 재시도가 실제 연결을 복구한다고 오인한다. | P0 | `NOT_CONFIGURED`, `CONTRACT_ONLY` |
| OpenDID와 EAS의 역할이 한 badge에 섞일 수 있다. | 어느 근거가 실제인지, deferred인지 구분할 수 없다. | P1 | evidence provenance drawer |

## 3. 목표 경험

### 한 문장 약속

> 가기 전에 필요한 사실을 한눈에 보고, 궁금할 때만 근거와 최신성을 펼친다.

### 사용자가 1초 안에 알아야 하는 것

- 각 fact가 가능, 불가, 조건부, 미확인, 오래됨 중 무엇인지 알 수 있다.
- source가 판단을 바꾸는 fact에는 `공식 등록 정보`, `편집 정보`, `상점 제공 정보` 같은 짧은 label이 붙는다.
- 확인되지 않은 정보는 check로 보이지 않는다.

### 사용자가 읽지 않아도 알아야 하는 것

- check/question/clock/warning/minus glyph가 fact state를 color 없이 구분한다.
- fact row를 누르면 같은 장소 위 drawer가 열리고 닫으면 같은 row로 돌아간다.
- 긴 hash/provider 기술 정보는 평상시 화면을 밀어내지 않는다.

## 4. 권장 모바일 여정

```text
VENUE OR OFFER ENTRY
→ FACT GRID DECISION
→ EVD/TRT LOADING
→ VALID | ELIGIBLE | INELIGIBLE | UNKNOWN | STALE | ERROR
→ EVIDENCE DRAWER OR CLOSE
→ EXACT VENUE/FACT RETURN
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry | 가기 전에 어떤 사실이 필요한가요? | compact fact grid | fact 선택 | venue, city, map/list selection, detail snap |
| Decision | 이 사실의 현재 상태는 무엇인가요? | glyph+label+state row | 근거 보기 | `factKey`, current snapshot |
| Loading | 기존 값을 유지하며 새 근거를 읽고 있나요? | row-local progress | 취소 | 다른 fact·venue unchanged |
| Result | 상태와 source 범위를 이해했나요? | canonical state glyph + compact source label | drawer 열기/닫기 | source/provenance envelope |
| Failure | 확인되지 않은 사실로 계속 판단할까요? | unknown/error row + available recovery | 다시 시도 또는 닫기 | positive mutation 0 |
| Return | 같은 장소의 같은 fact로 돌아왔나요? | opener row focus | 계속 | route·scroll·focus 복원 |

## 5. 화면별 상세 규격

### Screen A · Pre-visit fact grid

**목적**

- 방문 결정에 필요한 핵심 fact를 prose 없이 비교한다.

**첫 viewport에 보이는 것**

- 장소명/thumbnail과 `가기 전 확인` section.
- 2×2 또는 single-column adaptive grid의 핵심 fact 최대 네 개; 나머지는 `더 보기`로 같은 section 확장.
- 각 fact의 glyph, 짧은 label, human state.

**시각·인터랙션**

- card/phone/reservation/language/age/offer는 의미가 맞는 24px glyph와 text value를 쓴다.
- venue media는 source-backed thumbnail만 쓰고 고정 aspect-ratio로 예약한다. 없으면 category pictogram+accessible label을 같은 slot에 두며 빈 avatar, 임의 이니셜, generic letter box를 만들지 않는다.
- 320px에서는 2열이 text를 세 줄로 만들면 single column로 전환한다. fixed card height를 금지한다.
- `yes`는 check, `no`는 minus, `conditional`은 split/condition, `unknown`은 question, `stale`은 clock, `error`는 warning으로 color와 무관하게 구분한다.
- source label은 source가 선택 판단을 바꾸는 row에만 보인다. 모든 row에 generic shield를 반복하지 않는다.

**행동**

- Primary: 필요한 fact row 선택
- Secondary: `근거 보기` 또는 `더 보기`
- Close/Back: 장소 상세의 기존 의미 유지

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | fact label, human state, 결정에 중요한 source class |
| 시각화 | state glyph, compact grid, stale clock, conditional split |
| 한 번 접기 | source date/freshness, evidence scope, issuer class |
| Labs/개발 문서로 이동 | adapter name, envelope ID, hash, policy version, raw diagnostics |
| 삭제 | 큰 공식-source prose box, generic verified shield, `인허가`, maker 설명, source count |

### Screen/Sheet B · Evidence drawer

**목적**

- 선택 fact의 근거 범위·출처·최신성을 필요한 만큼 확인한다.

**첫 viewport에 보이는 것**

- 장소명 + fact label, 현재 state, compact source label, `기준일/오래됨/확인되지 않음`.
- close/back, 가능한 경우에만 recovery.

**시각·인터랙션**

- Detail drawer는 최대 88dvh, 하나의 internal scroll이며 원 fact row가 header에 고정된다.
- `EVD-VALID`는 `기록에 있음 · 기준일`로 표현한다. live 확인이 아니면 `verified`를 쓰지 않는다.
- official/editorial/ONDO/merchant/OpenDID/EAS를 각자의 glyph+label로 분리하고 provider logo wall을 만들지 않는다.
- `CONTRACT_ONLY`, `Deferred`, `NOT_CONFIGURED`는 결과 state와 혼합하지 않고 `상세`의 scope row에서 정확히 설명한다.

**행동**

- Primary: configured recoverable error일 때만 `다시 확인`
- Secondary: source link가 실제 존재할 때만 `출처 열기`
- Close/Back: 같은 fact row와 focus로 복귀

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | fact, state, source class, freshness/unknown consequence |
| 시각화 | source glyph, timeline/clock, state boundary |
| 한 번 접기 | issuer/source name, observedAt, evidence scope, policy version |
| Labs/개발 문서로 이동 | `sourceId`, `fixtureId`, adapter, envelope schema, hash, contract address |
| 삭제 | 가짜 refresh, fake explorer, raw payload, `공식이라 안전/영업/결제 가능` 문장 |

### Screen/Sheet C · Offer/merchant trait result

**목적**

- 특정 offer가 조건에 맞는지와 근거 범위를 checkout 전에 분리해 보여준다.

**첫 viewport에 보이는 것**

- merchant, offer, policy fact, `사용 가능/사용 불가/오래됨/확인되지 않음` 중 하나.
- 최종 결제 CTA와 경쟁하지 않는 compact fact row.

**시각·인터랙션**

- `TRT-ELIGIBLE`은 offer policy fact일 뿐 입장, 안전, Person, Payment KYC를 check 처리하지 않는다.
- `TRT-STALE/ERROR/UNKNOWN`에서는 benefit을 자동 적용하거나 checkout success를 만들지 않는다.
- actual EAS action은 제공하지 않는다. contract-only receipt가 있으면 정확한 scope와 fixture provenance를 한 번 접는다.

**행동**

- Primary: eligibility가 명확하고 checkout prerequisites가 따로 충족될 때 기존 checkout CTA
- Secondary: `근거 보기`
- Close/Back: 같은 offer/place sheet로 복귀

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 | merchant/offer, human eligibility state, 결정 source scope |
| 시각화 | eligible/ineligible/conditional/unknown glyph와 benefit application state |
| 한 번 접기 | policy version, observedAt, canonical receipt scope |
| Labs/개발 문서로 이동 | contract-only adapter, EAS deferred note, receipt/hash/fixture diagnostics |
| 삭제 | global `verified merchant`, 방문·안전 badge, fake onchain/explorer success, provider marketing |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading | 선택 row 안에서 progress; 기존 snapshot은 `확인 중` 상태로 유지 | 닫기 | 다른 fact·venue·offer 불변 |
| Empty | evidence 없음은 `확인된 정보 없음` question state | 닫기, 다른 연락 방법 보기 | positive/negative 추론 0 |
| Failure | invalid/error는 warning과 간결한 consequence | configured일 때 재시도, 닫기 | prior public snapshot·checkout·gates 불변 |
| Retry | 같은 `venueId/factKey`에서 loading | 취소 | 새 modal/route와 fake refresh 금지 |
| Cancel | drawer close, opener row focus restore | 장소 계속 보기 | cache·selection·scroll 불변 |
| Success | `EVD-VALID` 또는 `TRT-ELIGIBLE/INELIGIBLE` human state | 근거 보기, 기존 flow 계속 | scope 밖 state mutation 0 |
| Return | 같은 venue fact/offer row | 다음 결정 | exact section/snap/scroll/focus 복원 |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
| fact row→drawer | 240~280ms sheet open | 장소·fact header가 같은 anchor에서 확장 | duration 0 + focus heading |
| row loading→result | 160~200ms | row height·glyph center 고정 | 즉시 glyph/text 교체 + live status |
| stale transition | 140~180ms | clock glyph만 교체; card 재배치 없음 | static state |
| drawer close | 240~280ms reverse | 원 row가 움직이지 않음 | 즉시 close + opener focus |
| list/place source sync | 140~180ms | source class 변화가 order/ONDO field를 바꾸지 않음 | 즉시 update |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Section title | 가기 전 확인 | Before you go | 行く前に確認 | 행정 용어 금지 |
| Recorded state | 기록에 있음 · {date} | On record · {date} | 記録あり · {date} | live verification 아님 |
| No state | 이용 불가로 표시됨 | Listed as unavailable | 利用不可と記載 | source가 말한 범위만 |
| Conditional | 조건 확인 필요 | Conditions apply | 条件を確認 | 조건 disclosure 제공 |
| Unknown | 확인된 정보 없음 | Not confirmed | 確認情報なし | positive로 추론 금지 |
| Stale | 오래된 정보 | May be outdated | 情報が古い可能性があります | 기준일 함께 표시 |
| Error | 정보를 불러오지 못했어요 | Couldn’t load this information | 情報を読み込めませんでした | 기존 snapshot 유지 |
| Source official | 공식 등록 정보 | Official directory | 公的登録情報 | 품질·영업 보증 아님 |
| Source editorial | 편집 정보 | Editorial source | 編集情報 | 제주 truth 유지 |
| Source merchant | 상점 제공 정보 | Merchant-provided | 店舗提供情報 | 독립 source class |
| Primary CTA | 근거 보기 | View source | 根拠を見る | 실제 drawer가 있을 때만 |
| Retry | 다시 확인 | Check again | もう一度確認 | configured recovery만 |

- `verified`, `licensed`, `safe`, `approved`, `officially open`처럼 범위를 확장하는 번역을 금지한다.
- OpenDID, EAS 같은 기술명은 source detail에서만 그대로 표기하고 normal fact label은 목적 중심으로 번역한다.
- provider가 미구성일 때 CTA로 재연결을 약속하지 않으며 `현재 연결된 확인 수단이 없어요`와 닫기만 제공한다.

## 9. Accessibility·responsive

- 320×568/800·360px edge 16px, 390×844·430px edge 20px; grid가 text를 압축하면 single-column로 전환하고 horizontal overflow 0이다.
- 844×390은 place summary/fact grid 2-column을 허용하되 drawer는 하나의 internal scroll, close와 current fact와 recovery가 도달 가능해야 한다.
- fact row·drawer trigger·close는 48px default, 최소 44×44px, gap 8px 이상이다.
- glyph마다 KO/EN/JA accessible state를 제공한다. check/question/clock/warning을 color만으로 구분하지 않는다.
- loading/result/error는 row-scoped polite live region이며 전체 장소 정보를 반복 낭독하지 않는다.
- drawer focus trap, Escape close, background inert, opener row focus restore를 검증한다.
- forced colors에서 source class와 fact state가 border style, glyph, text로 구분된다.
- 200% zoom에서 fact label/state/source가 잘리지 않고, fixed grid/card height와 ellipsis를 decision copy에 쓰지 않는다.
- 출처 link는 외부 context임을 accessible name으로 알리고 돌아왔을 때 같은 venue/fact focus를 복구한다.

## 10. 계측·완료 기준

### UX signal

- fact별 state distribution과 drawer open/close/retry를 수집하되 source payload와 user identity는 수집하지 않는다.
- `unknown/stale/error→eligible` illegal visual mapping, source-class collapse, scope 밖 state mutation을 자동 탐지한다.
- same fact exact-return과 320/KO·JA line-wrap, screen reader state pronunciation을 증거로 남긴다.

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] card/phone/reservation/language/age/offer fact가 독립 state와 human label을 가진다.
- [ ] unknown/stale/invalid/error/ineligible가 positive check·benefit 적용·checkout success로 보이지 않는다.
- [ ] official/editorial/ONDO/merchant/OpenDID/EAS source class가 합쳐지지 않는다.
- [ ] official directory가 품질·현재 영업·결제·안전 보증으로 표현되지 않는다.
- [ ] merchant trait는 `CONTRACT_ONLY`, actual EAS는 `Deferred`, 미구성 provider는 fake refresh가 없다.
- [ ] source class는 결정점에 compact하게 보이고 ID/hash/adapter는 한 번 접거나 Labs로 이동한다.
- [ ] source media 실패/부재는 안정된 category pictogram으로 대체되고 빈 avatar·letter box·layout shift가 없다.
- [ ] drawer close/back이 같은 venue/fact/section/snap/scroll/focus로 복귀한다.
- [ ] 320/360/390/430, 320×568, 844×390, 200% zoom에서 clipping·overflow·sticky overlap이 없다.
- [ ] KO/EN/JA, keyboard, screen reader, forced colors, reduced motion을 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ | `REQ-004` evidence interface, `REQ-013` embedded Can I Go facts, `REQ-014` merchant trait contract | compact fact grid + scoped evidence drawer + separate offer trait | requirement trace와 venue/offer E2E |
| State | `EVD-UNKNOWN/LOADING/VALID/STALE/INVALID/ERROR`, `TRT-UNKNOWN/ELIGIBLE/INELIGIBLE/STALE/ERROR` | 모든 nonpositive state 독립 유지 | reducer + visual semantic mapping tests |
| Fixture | `FX-EVD-VALID/STALE/ERROR`, `FX-TRT-ELIGIBLE/INELIGIBLE/STALE/ERROR` | canonical envelope와 source truth 표시 | fixture provenance/source-class snapshots |
| returnTo | canonical gate 없음 | venueId+factKey+section+map/list context+focus 보존 | open/close/error/external-source return E2E |
| Persistence | public cache only 또는 memory; profile/identity storage와 분리 | stale boundary·source scope만 cache; raw adapter response 저장 0 | cache allowlist/privacy audit |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 | 긴 source prose 대신 결정 fact와 한 번 접는 근거 | 핵심 fact grid와 source drawer 두 층으로 고정 |
| D2 시각·인터랙션 | check/question/clock/warning glyph와 stable row geometry | mobile adaptive grid, row-local loading, exact opener morph로 고정 |
| D3 신뢰·접근성 | source scope 분리, unknown/stale 정직 표시, contract/deferred truth | source-class ledger와 negative-state·screen-reader acceptance를 고정 |

잔여 이견: `없음`.
