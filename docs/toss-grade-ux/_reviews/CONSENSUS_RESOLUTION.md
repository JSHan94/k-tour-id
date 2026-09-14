# Three-designer consensus resolution

상태: `LOCKED FOR FLOW AUTHORING · 2026-09-04`

이 문서는 D1 제품 단순성, D2 시각·인터랙션, D3 신뢰·상태·접근성의 독립안과
교차 반박을 하나의 구현 전 설계 계약으로 합친다. 아래 합의만 `FL-001`~`FL-018`
상세 문서의 공통 입력으로 사용한다. 구현 승인은 아니며, 상위 PRD·Flow Catalog·
State Model·Decision Ledger와 충돌하면 상위 정본을 따른다.

## 1. 검토 기록

### 독립 감사

- [D1 · 제품 단순성](./D1_PRODUCT_SIMPLICITY.md)
- [D2 · 시각·인터랙션](./D2_INTERACTION_VISUAL.md)
- [D3 · 신뢰·상태·접근성](./D3_TRUST_INCLUSIVE.md)

### 교차 반박

- [C1 · 제품 반박](./C1_PRODUCT_CHALLENGE.md)
- [C2 · 시각 반박](./C2_VISUAL_CHALLENGE.md)
- [C3 · 신뢰 반박](./C3_TRUST_CHALLENGE.md)

세 리뷰어 모두 `FL-001`~`FL-018` 18개를 독립 검토하고, 다른 두 안을 읽은 뒤
18개 전부에 최종 권고를 남겼다.

## 2. 최종 제품 문장

> ONDO는 한국의 지금 먹을 곳을 온도로 발견하고, 사용자가 선택한 행동에 필요한
> 순간만 K-Tour ID와 여행 잔액을 이어주는 모바일 지도다.

```text
실제 대한민국 지도
→ 도시와 동네의 온도 발견
→ 장소 결정
→ 저장·Table·19+·혜택 중 한 행동 선택
→ 필요한 독립 확인만 JIT 수행
→ 성공·실패·취소 뒤 같은 객체와 행동으로 복귀
→ My Korea에 여행 기억 축적
```

K-Tour ID, DID, VC, wallet, bridge, provider는 이 여정의 입구가 아니다. 사용자가
가치를 선택했을 때 그 행동을 안전하게 이어주는 하위 layer다.

## 3. 충돌 해소와 locked decisions

### 3.1 First entry·onboarding

1. 앱 첫 paint부터 current B의 같은 MapLibre atlas가 보인다. 별도 poster/white
   landing 뒤 지도를 새로 mount하지 않는다.
2. 첫 설정은 atlas 위 compact sheet에서 `한국 여행 / 내 주변 탐색 / 한국에서 생활`
   의도를 묻는다. 이는 추천 context일 뿐 국적·체류·credential 상태가 아니다.
3. 언어, value, intent, 실제로 결과를 바꾸는 food/diet preference를 최대 세
   decision으로 처리한다. 모든 skip/failure/success는 Guest map에 도착한다.
4. preference는 match keyline과 list ordering만 바꾼다. ONDO heat, source truth,
   eligibility, 식이 지원 fact를 조작하지 않는다.
5. onboarding에서 eKYC, Mobile ID, Residence Card, wallet setup을 강제하거나 완료로
   처리하지 않는다. later JIT action과만 연결한다.

### 3.2 Map·temperature·three cities

6. MapLibre, D-14, D-15가 정본이다. 역사적 Leaflet/A 렌더러로 회귀하지 않는다.
7. 서울·부산·제주는 실제 좌표에 같은 `field → aura → core → selected halo →
   capsule` renderer와 같은 hit target/transition을 쓴다.
8. source 상태는 시각 ring과 짧은 label로 분리한다: 서울 curated-scored, 부산
   curated-scored, 제주 editorial-unscored. 제주는 숫자·인기·혼잡 점수가 없다.
9. marker/list/peek의 기본 상태에 `Pulse`, `Hot`, `Peak`, score를 상시 쓰지 않는다.
   서울·부산의 score/freshness/confidence는 사용자가 연 temperature detail에만 둔다.
10. city tap은 80ms 이내 feedback, 100ms 이내 camera start, 일반 거리에서
    420–500ms, 어떤 경우에도 520ms를 넘지 않는다. reduced motion은 0ms `jumpTo`다.
11. atlas→city 동안 map instance, coast, route, city target을 유지한다. label은
    도망가거나 hover에 따라 위치가 바뀌지 않는다.
12. 800ms 전에는 설명 loading을 만들지 않고, 5초 뒤 같은 query/filter/selection의
    semantic List를 foreground한다.

### 3.3 Information density·visual grammar

13. 첫 viewport는 질문 하나, 주 객체 하나, primary action 하나다.
14. `preview`, `simulated`, `test`, `on-device`, provider/architecture, 행정 record count,
    `인허가`는 일반 제목·CTA에서 제거한다. consequence를 숨기지는 않는다.
15. phone primary nav는 5개 icon-only, 48px default target이다. selected는 black
    filled tile 하나만 사용하며 추가 bar/glow를 겹치지 않는다. 지역화된 accessible
    name과 first-use coach를 제공한다.
16. body/decision text는 16px 이상, 15px는 helper, 14px는 provenance, 12px 미만은
    쓰지 않는다. title/CTA/결정 copy는 ellipsis로 숨기지 않는다.
17. Peek≤32dvh, Decision≤72dvh, Detail≈88dvh, Full task=100dvh를 기본으로 한다.
    short landscape는 한 internal scroll과 sticky header/footer를 사용한다.
18. screen별 새 modal/card를 만들지 않고 shared PageHeader, DecisionHero, ActionRow,
    FactStrip, MediaCard, MapKey, Sheet, StickyDecision, InlineStatus, Receipt를 확장한다.
19. near-white/near-black이 기본이며 heat accent는 데이터, neon은 After19에만 쓴다.
    decorative rotated layer, beige wash, 중첩 shadow/card를 사용하지 않는다.

### 3.4 Identity·K-Tour ID·gates

20. `Account ≠ Person ≠ 19+ ≠ Payment KYC ≠ K-Tour credential ≠ Presentation ≠
    Reputation`을 state와 시각에서 유지한다.
21. gate는 한 anchored Decision sheet shell 안에서 현재 필요한 축 하나만 묻는다.
    미래 gate 이름·check badge를 한꺼번에 전시하거나 modal을 쌓지 않는다.
22. requester, purpose, requested predicate, sharing scope, unavailable/failure는 decision
    정보다. provider/adapter/network 세부만 접는다.
23. K-Tour ID `Choose → Check → Add`와 action-specific `Present`는 별도 사건·consent·
    result다. setup progress에 `Present`를 넣지 않는다.
24. normal public route의 provider 미연결 상태는 `PROVIDER_UNAVAILABLE`이며 verified,
    issued, funded, paid success를 만들지 않는다. 성공 fixture는 명시적 QA/review
    mode에만 있고 provenance와 외부 연결 없음이 결과에 남는다.
25. success는 full gate plan 재검증 직전에 one-shot token을 소비한다. cancel/error/
    retry는 mutation 없이 exact context와 opener focus를 보존한다.

### 3.5 Wallet·checkout·stamp

26. 소비자 단위는 locale grouping을 쓴 KRW, 필요할 때만 근거 있는 USD 보조값이다.
    OOKRW, USDC, USDT, network, settlement는 payment detail/Labs에만 둔다.
27. non-zero balance에는 한 가지 정확한 출처가 있어야 한다. 권장 fixture는
    `이번 여행에 준비된 잔액 ₩60,000`이며 detail에서 `이 기기에서만 사용하는 잔액,
    외부 입금 없음`을 밝힌다. 이를 `충전 완료` 또는 bank/card funds로 표현하지 않는다.
    출처를 구현하지 못하면 default는 `₩0`이다.
28. bank/card·Apple Pay·USD wallet은 funding intent다. provider unavailable이면
    active/ready source로 persist하지 않고 이전 usable state와 balance를 유지한다.
29. 장소 benefit→최종 KRW 확인→Account/Payment KYC→local balance-use record까지
    한 checkout 객체를 보존한다. 확인 직전과 결과에서 외부 merchant order/실제 금액
    이동이 없음을 짧게 밝힌다.
30. payment result, local receipt, unique visit, stamp는 별도 사건이다. unique visit
    evidence가 성공하기 전 stamp/reputation은 바뀌지 않는다.
31. Labs에서 `Target network: Sui Testnet · Simulated`는 target+truth의 정본 label로
    허용한다. public txRef가 없으면 transaction success/explorer link는 금지한다.

### 3.6 Table·Local Signal·profile·evidence

32. Table list는 비교에 필요한 시간·남은 자리·형식만, Join 전 detail은 장소·시간·
    좌석·메뉴·언어·비용/분담 여섯 사실을 icon+label+value로 모두 보여준다.
33. membership, chat access, message/image lifecycle, check-in, feedback, Report/Block/
    Leave를 유지한다. 실제 host 예약 전송이 없는 frontend 범위는 Join 결정점에서
    한 번 알린다.
34. Local Signal은 chips/note/photo draft를 먼저 만들고 Submit에서 Account→Person을
    JIT로 처리한다. draft는 session memory에 보존하고 URL/localStorage에 raw media를
    넣지 않는다.
35. Local Signal은 Visit/Contribution만 바꿀 수 있다. Person, Meetup, stamp, public
    ONDO heat를 자동으로 바꾸지 않는다.
36. public profile은 From/Lives in/Languages 각각 explicit opt-in이고 기본 private다.
    nationality targeting, ID-derived disclosure, aggregate trust/safety score는 금지한다.
37. official/editorial/ONDO/merchant trait/OpenDID/EAS의 truth를 하나의 verified badge로
    합치지 않는다. unknown/stale/error는 각 fact에 남는다.

### 3.7 Media·language·accessibility

38. source-backed venue photo를 우선한다. category art는 illustration임이 드러나야
    하며 인접 card 중복 crop과 빈 원형 avatar를 금지한다.
39. synthetic people은 onboarding aspiration, Table invitation, My Korea memory에서만
    허용한다. eKYC/credential/official venue evidence에 사용하거나 외모로 국적·성인·
    verification을 암시하지 않는다.
40. ONDO는 consumer map brand, K-Tour ID는 identity/pass/wallet context brand다.
    제공 asset의 비율을 지키고 K-Tour gradient를 ONDO heat/CTA 전역에 확장하지 않는다.
41. EN/KO/JA, 320/360/390/430 portrait, 844×390, 200% zoom, keyboard, screen reader,
    forced colors, reduced motion을 모든 Flow의 acceptance에 넣는다.
42. 44px는 법적 최소, 48px는 기본 target이다. icon-only control은 localized name,
    visible focus, non-color current state를 가진다.

## 4. 최종 Flow 권고

| Flow | 하나의 권장 경험 | 핵심 반려 조건 | 소유 REQ |
|---|---|---|---|
| `FL-001` | 같은 MapLibre에서 map-backed intro→city→place→directions | poster route, 큰 city pill, score 상시, 제주 다른 renderer | `REQ-007`, `REQ-013`, `REQ-017`~`019` |
| `FL-002` | locked venue에서 Age-only JIT→같은 After19 venue | Account/Person/KYC 강제, generic return | `REQ-005`, `REQ-012` |
| `FL-003` | Table facts→gates→join→chat/media→check-in→feedback | six facts/safety 삭제, nonmember chat | `REQ-008`~`010`, `REQ-015` |
| `FL-004` | place benefit→local balance record→별도 visit→9→10 | ticker 전면, false payment/order, payment=stamp | `REQ-006`, `REQ-011`, `REQ-016` |
| `FL-005` | Person-required action에서 Mobile ID JIT | onboarding auto-CX, providerless official success | `REQ-001`, `REQ-005` |
| `FL-006` | Residence availability→supported check 또는 Passport alternate | legal status 추론, unavailable=success | `REQ-002`, `REQ-005` |
| `FL-007` | atlas 위 한국 여행 intent→taste→Guest map | eKYC 강제, separate landing | `REQ-003`, `REQ-005`, `REQ-018` |
| `FL-008` | atlas 위 내 주변 intent→taste→Guest map | Korean=verified, onboarding CX | `REQ-001`, `REQ-005`, `REQ-018` |
| `FL-009` | atlas 위 한국 생활 intent→taste→Guest map | Residence 보유 추론, onboarding ID | `REQ-002`, `REQ-005`, `REQ-018` |
| `FL-010` | 원 객체 고정→현재 unmet gate→one-shot action resume | status wall, nested modal, context reset | `REQ-005`, `REQ-008`, `REQ-011` |
| `FL-011` | bookmark→Account if needed→save→memory map→place round-trip | gate success=save, admin-card My Korea | `REQ-005`, `REQ-016` |
| `FL-012` | visual draft→Submit gates→exact draft→Visit/Contribution result | form 전 ID, fake upload, other-axis mutation | `REQ-003`, `REQ-007`, `REQ-009`, `REQ-015` |
| `FL-013` | Guest-capable Age-only sheet→same map/place | Account/Person 강제, raw DOB 저장 | `REQ-012` |
| `FL-014` | four guards→same geography night layer→immediate off | 검은 빈 지도, 일반 야간 장소 삭제 | `REQ-012` |
| `FL-015` | field-level visibility→preview→save, four axes timeline | nationality 공개, aggregate trust score | `REQ-008`, `REQ-015` |
| `FL-016` | place facts→state→source detail | official=추천/영업, OpenDID=EAS | `REQ-004`, `REQ-013`, `REQ-014` |
| `FL-017` | pinned merchant/amount→Payment-only JIT→exact checkout | other axes 완료, unavailable false payment | `REQ-005`, `REQ-011` |
| `FL-018` | Labs consent→assets→quote→ordered bridge→technical receipt | 합산 asset, fake tx/explorer, AMM | `REQ-004`~`006`, `REQ-014`, `REQ-016` |

## 5. Cross-flow 문서 소유

| 문서 | 소유 문제 |
|---|---|
| `X-01_APP_SHELL_NAVIGATION` | icon-only mobile dock, scroll/focus, safe area, brand, clipping |
| `X-02_SETTINGS_DEVICE_DATA` | compact language/preferences/data/reset/destructive scope |
| `X-03_JAPANESE_JEJU_EDITORIAL_MEDIA` | three-city parity, story-place edge, photos/people, JA |
| `X-04_LOADING_MOTION_RESPONSIVE` | same-map motion, loading/recovery, sheet fit, viewport matrix |
| `00_FEEDBACK_TRACE` | 사용자가 지적한 항목이 어느 Flow/X 문서에서 닫히는지 |

정규 route, canonical URL, redirect, OG/title/favicon, 로그인 없는 public access는
구현·배포 파동에서 별도 release checklist로 추가한다. 이번 문서 단계에서 route나
metadata를 변경하지 않는다.

## 6. P0/P1/P2 implementation waves

### P0 · truth와 context

1. provider unavailable vs review fixture
2. balance provenance와 unavailable funding mutation
3. local record vs merchant payment/order
4. K-Tour setup vs presentation
5. Account/Person/Age/Payment gate axes와 exact return
6. payment vs unique visit vs stamp
7. official/editorial/ONDO/trait truth

### P1 · mobile product journey

1. map-backed onboarding + same-map atlas→city
2. three-city temperature renderer + After19 geography
3. shared sheets + icon-only nav + global typography/spacing
4. place media/detail + Table + Local Signal
5. My Korea + Settings + identity/wallet orchestration
6. EN/KO/JA, 320/360/390/430/844×390

### P2 · finish and release

1. motion performance, reduced motion, forced colors, screen reader
2. error/empty/loading parity and asset repetition audit
3. root route/redirect/metadata/public access
4. two clean adversarial rounds and evidence manifest

P2 visual polish는 P0 truth를 덮지 못하며, P0를 이유로 P1의 시각 완성도를 생략하지
않는다.

## 7. Authoring contract

각 `FL-*` 문서는 `_FLOW_TEMPLATE.md`의 12개 section을 모두 채운다.

- 현재 구현을 완벽하다고 전제하지 않고 구체적 문제와 사용자 영향을 쓴다.
- sequence는 mobile first이며 Entry/Decision/Pending/Success/Cancel/Failure/Retry/Return을
  포함한다.
- 화면에서 삭제·시각화·접기·Labs 이동할 정보를 구분한다.
- 세 리뷰어의 제안과 최종 반영을 기록하고 잔여 이견을 남기지 않는다.
- 정규 REQ mapping은 `00_PRD_PRESERVATION_LEDGER.md`만 따른다.
- implementation-ready란 코드 완료가 아니라 다음 구현자가 추가 제품 결정을 하지
  않아도 된다는 뜻이다.

## 8. 구현 전 반려 조건

다음 중 하나라도 있으면 문서 합의가 끝나지 않은 것이다.

- Flow 파일 18개 중 누락 또는 정규 REQ mapping 오류
- normal provider-unavailable path의 false success
- positive balance의 출처 모호함 또는 `no funds` 동시 표시
- payment/receipt/visit/stamp 인과 혼합
- 제주 별도 renderer 또는 editorial count를 온도화
- onboarding에서 신분·eKYC·wallet 강제
- sheet CTA clipping, nested modal, exact return 누락
- maker copy 제거와 함께 사용자 consequence까지 삭제
- KO/EN/JA 또는 320/short-landscape acceptance 누락
- 작성자가 자기 Flow를 단독 승인
