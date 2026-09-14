# Trust sign-off · FL-001~006, X-03, feedback trace

상태: `D3 TRUST/STATE/A11Y SIGN-OFF · ACTIONABLE P0 0 · ACTIONABLE P1 0`

이 문서는 구현 완료나 시각 QA 완료를 뜻하지 않는다. 아래 문서 묶음이 canonical
PRD·Flow·State·preservation ledger와 충돌하지 않으며, 구현자가 따라도 사용자에게
실제 source·신원·결제·방문·공유 결과를 과장하지 않도록 닫혔다는 문서 단계의
독립 sign-off다.

## 1. 검수 범위와 기준

검수 대상:

- `FL-001_GUEST_DISCOVER.md`
- `FL-002_AFTER19_EXACT_VENUE.md`
- `FL-003_TABLE_CHAT_FEEDBACK.md`
- `FL-004_CHECKOUT_STAMP.md`
- `FL-005_KOREAN_MOBILE_ID.md`
- `FL-006_RESIDENCE_CARD.md`
- `X-03_JAPANESE_JEJU_EDITORIAL_MEDIA.md`
- `00_FEEDBACK_TRACE.md`

대조 기준은 `_reviews/CONSENSUS_RESOLUTION.md`, `00_UX_STANDARD.md`,
`00_PRD_PRESERVATION_LEDGER.md`, `docs/ondo-execution/01_PRD_9H.md`,
`03_FLOW_CATALOG.md`, `04_STATE_MODEL.md`, current-B `docs/ondo-baljajwi/07_AS_BUILT.md`
및 D-13~D-15다.

다음 중 하나라도 남으면 sign-off하지 않는 기준으로 보았다.

1. normal provider 미연결 경로의 verified/issued/funded/paid 성공.
2. review fixture를 일반 사용자 결과처럼 숨기거나 실제 외부 확인으로 표현.
3. official/editorial/ONDO를 하나의 품질·인기·영업 인증으로 합침.
4. Account/Person/Age/Payment KYC/K-Tour setup/Present/Reputation 축의 합침.
5. 결제 기록→방문→stamp 사이의 거짓 인과 또는 잔액 출처 모순.
6. raw 신원·결제·사진·draft를 URL, return envelope, browser persistence에 저장.
7. 취소·오류·거절 뒤 원 객체·공개 context·scroll·focus로 정확히 돌아오지 못함.
8. 동의·금액·failure·official/editorial·destructive consequence를 icon만으로 숨김.
9. 44px 최소 target, 200% zoom, keyboard/SR, forced colors, reduced motion,
   KO/EN/JA 또는 320/360/390/430/844×390 acceptance 누락.

## 2. 파일별 adversarial 판정

| 파일 | 발견한 blocker | 직접 반영한 수정 | 최종 판정 | 잔여 P0/P1 |
|---|---|---|---|---:|
| `FL-001` | editorial label이 장소 품질 확인처럼 읽힐 여지, 장소 사진의 사용 권리 경계 부족 | source를 `공식 등록 정보`와 `에디터가 연결한 장소`로 좁히고 후자는 좌표·장소 연결일 뿐임을 명시했다. venue photo는 source/match/rights/allowed-surface registry가 모두 맞을 때만 사용하고 아니면 illustration로 fail closed한다 | PASS | 0/0 |
| `FL-002` | 정적으로 provider가 없는 상태에도 Retry를 주면 회복 가능한 장애처럼 보임 | `NOT_CONFIGURED`에는 일반 정보/구성된 대안/나중에만 제공하고, Retry는 연결된 provider의 일시 오류에만 허용했다. Age-only mutation과 exact venue return을 유지했다 | PASS | 0/0 |
| `FL-003` | Table draft/media의 return token 유입 위험, Report/Block/Leave의 실제 범위·인과가 모호함 | envelope는 public tableId↔venueId만 허용하고 draft/blob/object URL은 app-lifetime memory로 격리했다. Report/Block은 외부 moderation·실계정 제재·membership 변경이 없는 기록임을, Leave만 `TMB-LEFT + CHA-LOCKED`를 만든다는 consequence와 confirmation을 KO/EN/JA로 고정했다 | PASS | 0/0 |
| `FL-004` | 잔액 출처 모순, local record가 실제 주문/결제처럼 보일 위험, payment가 stamp를 만드는 거짓 인과, static unavailable Retry, funding draft의 token 유입 위험 | 출처 있는 `₩60,000` 또는 `₩0`만 허용하고 confirm/result에 외부 주문·실제 금액 이동 없음 truth를 남겼다. local receipt, explicit review-only unique visit, 9→10 stamp, Labs badge를 별도 사건으로 잠갔다. `NOT_CONFIGURED` Retry를 제거하고 canonical cta/gate/public venueId 외 결제 context는 navigation registry/app memory로 분리했다 | PASS | 0/0 |
| `FL-005` | K-Tour setup과 action-specific Present 혼합, issuer 없는 review 결과가 `발급/추가 완료`처럼 보일 위험, static Retry와 return privacy 누락 | setup은 internal `Choose→Check→Add`, Present는 requester/purpose/predicate/scope별 별도 consent/result로 분리했다. issuer 없는 Add 결과는 visible `여행 패스 초안`으로만 저장하며 외부 발급·공유 없음 provenance를 둔다. `NOT_CONFIGURED` Retry를 제거하고 token에는 public IDs만, draft/media는 memory에 둔다. Present focus 순서·거절 exact return도 명시했다 | PASS | 0/0 |
| `FL-006` | provider 없는 Passport review가 실제 여권/OCR/얼굴 capture를 받을 위험, Residence→Passport 전환 중 token/privacy 손실, static Retry | current public/review frontend는 실제 camera/file picker와 user document/face를 0개로 하고 bundled non-personal redacted sample reference만 memory에서 사용한다. future live capture는 provider SDK contract로 격리한다. 같은 Person gate/token을 유지하되 envelope에는 public IDs만 두고, `NOT_CONFIGURED`에는 alternate/나중에만 둔다 | PASS | 0/0 |
| `X-03` | editorial edge가 검증·품질 보증처럼 읽힘, source-backed media의 권리/만료와 fallback, cross-screen a11y matrix 부족 | editorial은 좌표·장소 match만 뜻하고 인기·영업·품질·ONDO를 뜻하지 않게 했다. asset license/consent/surface/expiry와 만료 시 cache 제거+illustration fallback을 잠갔다. 844×390, 44/48px, keyboard/focus return, forced colors/reduced motion을 추가했다 | PASS | 0/0 |
| `00_FEEDBACK_TRACE` | `verified place edge`, review fixture의 normal/Labs 노출, Table 6-fact list 과밀, nationality 기반 funding 분기, non-zero balance 문서 연결 누락 | `좌표·장소가 연결된 edge`로 좁히고 fixture를 명시적 QA/review mode로 제한했다. List≤4/Detail 6 facts, capability self-selection, balance provenance를 FL-004/017/018 전체로 추적했다 | PASS | 0/0 |

## 3. 최종 locked trust/state 계약

### Source와 media

- 서울·부산 official record, 제주 editorial place match, ONDO temperature, merchant
  trait는 서로 다른 source/state다. 어느 하나도 맛·인기·안전·영업을 보증하지 않는다.
- 제주 editorial은 `score=null`; story 수를 ONDO 점수로 바꾸지 않는다.
- venue photo는 장소 match만으로 충분하지 않다. 권리·허용 surface·만료까지 registry가
  통과해야 하며, 실패하면 사진처럼 가장하지 않는 category illustration을 쓴다.

### Identity와 presentation

- `Account ≠ Person ≠ Age ≠ Payment KYC ≠ K-Tour credential ≠ Present ≠ Reputation`.
- normal provider 미연결은 `NOT_CONFIGURED`와 unchanged state로 끝난다. 재시도로
  달라질 수 없는 상태에는 Retry를 보이지 않는다.
- 성공 fixture는 명시적 QA/review mode에서만 provenance와 `외부 확인/발급/공유 없음`
  범위를 보인다. Mobile ID/Residence/Passport fixture는 다른 축을 완료하지 않는다.
- current Passport review는 실제 사용자 문서·얼굴을 받지 않는다. redacted sample은
  non-personal asset reference일 뿐 identity evidence가 아니다.
- setup의 internal Add 결과는 issuer가 없으면 `여행 패스 초안`; requester에게 Present할
  때는 매번 purpose/predicate/scope 동의와 별도 no-share/result가 필요하다.

### Balance, payment, visit, stamp

- 소비자 표면은 locale-grouped KRW, 근거 있는 경우에만 USD 보조값을 쓴다.
  OOKRW/USDC/USDT/network는 detail/Labs 밖에 나오지 않는다.
- positive balance는 정의된 준비 잔액 provenance를 가지며 `no funds added`와 동시에
  보이지 않는다. bank/card/Apple Pay/USD-wallet unavailable 선택은 balance/source를
  commit하지 않는다.
- checkout 결과는 외부 주문이나 실제 돈 이동이 아닌 local balance-use record다.
  receipt, unique visit, stamp, badge는 각각 독립 사건이며 payment alone의 stamp와
  reputation delta는 0이다.

### Exact return, privacy, safety

- return envelope는 canonical cta/gate metadata와 CTA matrix가 허용한 public
  venueId/tableId만 가진다. draft text, blob/object URL, raw ID, DOB, nationality,
  credential, 결제수단, provider response는 금지한다.
- draft/media와 funding draft는 token 밖 app memory에만 두고 cancel/error/retry 후
  같은 객체·camera/section/scroll/sheet snap/opener focus를 복원한다.
- success는 full gate plan을 재검증한 뒤 원 action mutation 직전에 token을 한 번만
  소비한다. invalid/expired/forged/duplicate는 mutation 없이 safe map으로 간다.
- Report/Block/Leave는 텍스트 동사와 confirm 전 consequence가 필요하다. Report/Block은
  current fixture에서 실제 moderation·제재·membership 변화가 없고, Leave만 대화와
  membership을 닫는다.

## 4. Accessibility sign-off

- 여덟 문서 모두 mobile-first KO/EN/JA 의미 parity를 요구한다.
- Flow 여섯 개와 X-03 모두 320/360/390/430 portrait, 844×390, 200% zoom,
  horizontal overflow 0, sticky obstruction 0을 acceptance에 포함한다.
- interactive target은 44px 법적 최소, 48px 기본이며 icon-only control에는 localized
  accessible name과 visible focus가 필요하다.
- status·source·availability·selected·pending·failure·stamp는 색/animation만으로
  전달하지 않고 glyph+label/text+SR status를 남긴다.
- dialog focus trap, background inert, Escape, error focus, polite live region,
  result/cancel 뒤 exact opener focus를 각 해당 Flow에서 보존한다.
- destructive/safety, 동의, 금액, source truth는 prose-off 대상이 아니다.

## 5. 잔여 위험과 release 경계

- 문서 기준 actionable P0: **0**.
- 문서 기준 actionable P1: **0**.
- P2/구현 증거: 실제 viewport screenshots, screen-reader run, keyboard traversal,
  forced-colors/reduced-motion run, storage/network inspection, asset-rights registry,
  normal-vs-review E2E는 구현 파동에서 수집해야 한다. 이는 이 문서 묶음의 설계
  blocker가 아니라 release evidence gate다.
- 따라서 **D3 trust/state/accessibility 관점 sign-off**한다. Product/visual reviewer와
  구현·배포 QA의 별도 승인을 대체하지 않는다.

## 6. 검증 기록

- 대상 Flow `6/6`, cross-flow/trace `2/2`를 전수 읽었다.
- `FL-001`~`FL-006`의 template section `1`~`12`: 각 파일 `12/12`.
- 미완성 표식 검사: `0`.
- canonical REQ mapping: `FL-001 007/013/017/018/019`, `FL-002 005/012`,
  `FL-003 008/009/010/015`, `FL-004 006/011/016`, `FL-005 001/005`,
  `FL-006 002/003/005` 유지.
- maker-language는 삭제 규칙·문제 진단·명시적 review/Labs truth에서만 언급되고,
  normal title/CTA에 허용하지 않는 계약으로 확인했다.
- Markdown trailing whitespace와 patch whitespace error: `0`.
