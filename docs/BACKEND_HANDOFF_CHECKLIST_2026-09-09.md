# Backend 인계 작업표

최신 브랜딩 배포: source/runtime `cc3d7c3`, [운영 앱](https://ondo-tau.vercel.app). 브랜딩 전용 production Ready이며 최종 deployment `dpl_Bf4rBwnqH5PpaHeMRW6NmM8y3Wk1`의 고유 주소·검수 범위는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. 이번 로컬 검수는 관련 계약44/44·typecheck·production build/scan·HTTP probe(공개 자산41개)·mobile/desktop 브랜드 E2E6/6(workers1/retries0) PASS다. 최종 고유 배포의 HTTP probe 및 mobile/desktop 브랜드4/4(7.4초, workers1/retries0) PASS. 별칭별 추가 확인 범위는 릴리스 기록을 따르며, 전체 여정 재검수나 실제 provider/실기기 검수로 확대하지 않는다.

마지막 기능 흐름 검수 기준은 이전 `e2ad7c4`다. 당시 전체 계약833/833·After 19 공개 경로 로컬5/5 및 운영5/5 PASS(운영2.0분, workers1/retries0; project mismatch skip5개 제외)는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)의 역사적 증거이며 `cc3d7c3`에서 재실행한 결과가 아니다. 이전 `82ea4c9`의 공개 mobile12개/desktop·tablet2개·계약826개는 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md), [9월 11일 검수](./FINAL_JOURNEY_QA_2026-09-11.md)도 별도다. 운영 공개와 QA는 실제 연동 체크박스의 완료를 뜻하지 않는다.

정본: [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md). 기능·해커톤 대응: [Integration Matrix](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md). 개발 시작점은 `handoff/harvey-20260914`를 clone한 저장소의 `k-tour-id-app/`이다. 배포 이력은 위 기준을 따른다. 배포 전 source/document 대조는 [인계 정합성 점검](./HANDOFF_SYNC_2026-09-11.md), 이전 공개판 `3dc392b`는 [9월 10일 릴리스](./PROTOTYPE_COMPLETION_2026-09-10.md)에 보존한다.

이 문서는 **개발자가 실제 연동 단계에서 수행할 일**을 분리한 실행 목록이다. 빈 체크박스는 실제 연동 미완료를 뜻하며 목업 완성의 차단 조건이 아니다. UI 상태 구현, 해당 소스의 브라우저 검수, 실제 공급자 연동 증거를 각각 판정한다. 새 문의 이력은 모델 계약과 기존 f79 공개 기준선의 모바일 브라우저 EN390/KO320 두 케이스를 통과했다. 실제 공급자 접수나 전체 기기 검수를 뜻하지 않는다.

9월 12일 배포의 [MW-01–05 매장 중심 지도·잔액 여정](./MAP_WALLET_JOURNEYS_2026-09-12.md)은 아래 BE-06–09/11 및 복귀 계약을 확장한다. 기존 release/브라우저 수치를 새 배포의 PASS로 이월하지 않는다. 공통 지갑·개별 주문·장소별 예약 연결은 샘플 구현이며 실제 merchant/provider 연동은 여전히 별도다.

## 먼저 확정할 네 가지

- [ ] CX: 팀 환경과 provider metadata, 테스트 신분증/앱, handoff/callback origin, 정확한 반환 claim과 AdultVerify 의미.
- [ ] OpenDID: 사용할 공식 release, issuer/TA/verifier/holder 구성, K-Pass schema·type·정책 버전, holder의 네이티브 앱 또는 웹 handoff.
- [ ] OmniOne Chain: 제공 network/RPC/API/EOA, 계약 배포 권한·compiler/ABI, 업무 event와 중복 redemption을 검증할 역할.
- [ ] Sui: zkLogin 또는 기존 signer, network/coin type/representation allowlist, salt/prover·recovery, custody/gas sponsor, 기념 badge Move package. stablecoin funding의 source/destination receipt와 routing/attestation·수탁/상환 주체는 `ADR-SUI-01`에서 확정. cross-chain route는 공식 지원/운영 주체 확인 전 hypothesis로 유지.

모바일 신분증 활용은 공식 필수과제다. CX는 이 프로젝트가 선택한 연동 경로이며, 가이드에는 정부 SDK 직접연동 대안도 있다. OpenDID·OmniOne Chain은 각각 5% 가점의 공식 선택과제지만 **이번 프로젝트에서는 채택한 개발 범위**다. Sui는 사용자가 지정한 추가 범위이며 해당 DID 대회의 필수라고 표시하지 않는다. 공식 활용·제출 인정은 실제 공급자 결과/서명/receipt로 별도 입증한다. 과제 분류는 2026-09-11 다시 확인한 [공식 가이드 p5·p8](https://opendid.org/download/hackathon/2026/2026%20%EB%B8%94%EB%A1%9D%EC%B2%B4%EC%9D%B8%20%26%20AI%20%ED%95%B4%EC%BB%A4%ED%86%A4%20%EA%B0%80%EC%9D%B4%EB%93%9C%EB%B6%81.pdf?v=20260430)을 기준으로 하며, 최신 제출 인정 조건은 주관사에 별도 확인한다.

## 프런트/provider handoff (BE API 완료와 별도)

다음 체크는 BE-01–16 구현 체크와 독립이다. SDK·브라우저/기기 capability·외부 앱 복귀·signer 승인·provider receipt가 연결되기 전에는 운영 완료로 체크하지 않는다.

- [ ] `FE-CX-PASSPORT`: CX QR/WEB2APP·Passport NFC/liveness handoff와 callback/cancel/timeout 복귀
- [ ] `FE-OPENDID`: 채택 release의 holder deep link·동의·VP/verifier SDK 및 최소 receipt adapter
- [ ] `FE-PAYMENT`: 카드/Apple Pay/은행/onramp capability·processor handoff·quote/결제 복귀
- [ ] `FE-SUI`: signer/zkLogin session·transaction intent 승인·effects/receipt adapter
- [ ] `FE-RESERVATION`: 실제 provider availability/confirmation/cancel handoff; local meal plan과 분리

현재 상태: mock permission/return 및 sample adapter 단계는 구현되어 있으나 provider/SDK/receipt는 미구성이다. OpenDID release, payment rail, Sui network/asset/bridge는 `ADR-DID-01`, `ADR-PAYMENT-01`, `ADR-SUI-01`에서 결정하기 전 선택하지 않는다. 실제 restaurant booking은 `BE-09`의 별도 ReservationAdapter이며 Tables의 local meal plan이 아니다.

## 순서대로 배정할 작업

| ID | 구현 단위 / 연결 flow | 기술·실제 구현 | 수락 증거 |
| --- | --- | --- | --- |
| BE-01 | 공통 BFF·세션 / G04,G13 | 선택한 auth provider, Secure HttpOnly 세션, callback state/PKCE, authz/CSRF, operation envelope, durable idempotency store | 다른 계정·다른 요청 digest 접근 거절, 재시도 1회 결과, provider/demo 격리 |
| BE-02 | CX adapter / G05 | provider discovery → session/trans → QR/WEB2APP → 검증된 결과; 최소 evidence 정규화 | 공식 sandbox/실기기 신분증 결과, 취소/미설치/timeout/replay/wrong audience 검증 |
| BE-03 | Passport·Residence / G05 | 지원표, eKYC/NFC/liveness provider, 수동검토 queue·추가서류·retention, fallback | 문서·얼굴 불일치, 미지원, approved/declined/needs_info; 원문 유출 없는 결과 |
| BE-04 | OpenDID 발급/holder/status / G05 | schema/issuer policy, 최소 TrustProfile → VC, wallet 수신 ack, status/renew/revoke/key recovery | issue→실제 holder 수신→status; 중복 callback 발급 1회, 복구가 나이·경제권한을 초기화하지 않음 |
| BE-05 | VP·정책 / G06,G07 | verifier trust/proof/status/nonce/audience/domain/claim policy 검증, current server decision 및 action binding | 동의와 검증 구분, 누락/거짓/만료/철회 각각 다른 결과, 다른 매장·금액·목적 재사용 거절 |
| BE-06 | 공통 Wallet·충전 / G09/G09-S, MW-02/03/05 | 모든 주문을 반영하는 balance/held/available·revision, 은행/카드/Apple Pay/onramp adapter, funding KYC·지역·자산·금액 정책, FX/fee quote, callback/poll, double-entry credit. USDC/USDT 자산 DTO는 BE-15 signer·BE-16 destination receipt에 연결 | source만 확정이면 credit 0, destination 확정과 durable credit 1회, unknown 동일 작업 조회/재서명 금지. 부족액 충전 후 원 주문/quote 검토로 복귀하되 결제는 별도 동의; 충전으로 Person/Age/Payment KYC·혜택/한도 생성 금지 |
| BE-07 | 주문·승인·매입·환불 / G10, MW-01/02/05 | venue/offer/가격과 고유 order/operation/receipt 바인딩, 주문별 이력, authorization reserve와 capture 구분, 가격·자격 재검사, 부분환불/누적액·unknown·retry | 매장 간 ID/영수증 재사용 거절, 내역 선택으로 공통 잔액·hold 초기화 금지. 한도·혜택 경쟁, 원 주문 captured 초과 환불 거절, 옛 주문 환불이 다른 주문/발급을 바꾸지 않음 |
| BE-08 | 혜택 / G10,G11 | campaign entitlement, reserve/redeem/release, 발급과 사용의 원자성, 조건부 정상가격 재견적 | 1회성 혜택 중복 거절, 전액환불 시 정의된 정책대로만 반환, 신규 동의 없는 정상가 결제 금지 |
| BE-09 | 매장 예약 / G08-R, MW-04/05 | 별도 ReservationAdapter: source ID를 보존한 매장 지원표·날짜/인원/재고 견적 → request/status/confirmation/cancel, 장소별 이력·provider idempotency | 로컬 meal plan과 구분된 확인번호, 장소 변경에도 원 venue/operation 보존, 만석·unknown 동일 요청 조회·취소 실패, 중복 예약 0회. 무료 일반 예약에 불필요한 신원/결제 요구 금지 |
| BE-10 | Tables·대화·사진·안전 / G08 | 모임 재고·membership, realtime 권한, presigned upload/검사/TTL, 신고·차단 support queue | 비회원 접근 거절, full/주최자 취소, 이미지 실패 재시도, leave 후 권한 제거 |
| BE-11 | 장소·사용처·온도·추천 / G01–03, MW-01/03/04 | 권리 확인한 수집/정규화, canonical/editorial/research provenance와 nullable mapping, 실제 merchant/offer/reservation/table capability·expiry, observedAt·confidence, 비식별 집계/recent signal | 지도 탐색에 설정 완료·신원 강제 금지. 선택형 설정 취소는 기존 취향/NEW·COMPLETE 보존, 완료만 저장. 조사 listing을 제휴/결제 수용으로 승격 금지; 사용처 필터는 검증된 capability 기준. 근거 없는 실시간/제주 점수 생성 없음, stale/duplicate 제거, 추천은 자격 결정 아님 |
| BE-12 | 저장·계정 데이터 / G04,G13 | sync/version conflict, 실제 export archive·단기 다운로드 권한, session revoke, deletion worker/보존 고지 | 계정 경계·삭제 취소/작업 조회·데이터 보존 설명, local 삭제와 서버 삭제 구분 |
| BE-13 | OmniOne event / G11 | transaction outbox→worker→contract/API→receipt 검증, DLQ·reconcile. 최소 1개 계약 불변식 | KPassIssued, WalletLinked, PaymentAuthorized, VoucherIssued, VoucherRedeemed, PartnerSettlementLogged 6종과 실제 tx/receipt. 원문 PII·그 단순 hash 금지 |
| BE-14 | 정산·문의 이력 / G11 | partner/actor RBAC, payment/refund/voucher ledger 대사, payout·분쟁·export. 제출 문의의 불변 요약/동의/번호를 보관하고 이후 환불 문의는 새 operation·새 동의로 생성 | 부분/전액환불 합계, mismatch·pending·실패/재조회, 체인 기록과 은행 지급 분리. 이전 문의 금액 보존·unknown 동일 작업 조회·중복 ticket 0회·문의로 잔액/event 변경 0회 |
| BE-15 | Sui signer·자산 승인·badge / G09-S/G12 | Sui SDK, zkLogin 또는 기존 wallet, OAuth·ephemeral key·salt·maxEpoch/prover·recovery, network/coinType/Move target allowlist, custody·sponsor/gas 정책, transaction effects. source 자산 전송과 badge mint는 별도 intent/operation | 사용자 승인과 실제 tx data 일치, 서명 취소·epoch/network/prover/gas 실패, wrong asset·변경된 금액 거절. badge는 10번째 unique visit/opt-in mint 1회·별도 실제 receipt |
| BE-16 | Sui↔OmniOne 후보 / G09-S/G12 | 승인된 route가 있을 때만 source/destination 별도 finality, routing/attestation/custody·상환 authority, quote expiry/operation binding, credit ledger 멱등 commit, 보상/대사. 기존 Labs 고정 fixture는 읽기 전용으로 분리 | 지원 근거·양쪽 검증 receipt. source 성공만으로 destination 성공·상환·credit 금지. destination pending/unknown 재전송 0회, duplicate/충돌 receipt credit 0회, source 확정 이후 장애 대사 |

BE-02/04/05/13은 **DID 해커톤 핵심 시연에 우선 배정**한다. BE-06/15/16은 사용자가 요청한 명시적 스테이블코인 funding·Sui 통합의 연결 작업으로 함께 추적한다. BE-16의 실제 활성화는 승인된 route/authority 확보에 종속되며 native bridge 구현 완료로 미리 표시하지 않는다. 나머지는 해당 실제 서비스 출시/파트너 연결 전 필요하다. 실제 은행/결제/체인 비용이 드는 호출은 각 환경의 별도 실행 승인과 한도를 둔다.

## 개발자가 먼저 열 소스와 보존할 상태

아래 이름은 **현재 프런트 샘플 타입**이다. 서버 wire enum과 동일하다고 가정하지 말고 §5의 operation envelope로 명시적으로 변환한다. 모든 진입은 현재 공개 `/` 안의 sheet이며 legacy `/wallet`·`/partner` route를 새 API 연결점으로 사용하지 않는다.

| 공개 진입 / FE 연결점 | 실제 샘플 상태·동작 | 서버가 분리해서 소유할 것 |
| --- | --- | --- |
| 지도/추천 매장 → 서비스: [place-service-registry-b.ts](../k-tour-id-app/features/ondo/commerce-b/place-service-registry-b.ts), [ondo-b-provider.tsx](../k-tour-id-app/features/ondo/shared/state/ondo-b-provider.tsx) | 27개 등록 장소(조사24+Table 연결3), source ID/originKind·nullable tableId·reservation·sampleOnly offer. `PLACE_SERVICE_RETURN_EVENT_B`로 같은 장소 복귀, `SHOW_BALANCE_PLACES_EVENT_B`로 사용처 지도 | 실제 merchant capability·유효 가격/정책·예약 지원을 listing provenance와 별도로 확인. research ID를 canonical로 위장하지 않으며 review=0에서 체험 권한을 적용하지 않음. map 이벤트는 권한 토큰이 아님 |
| 지도 잔액/ID Wallet 또는 부족액 → 충전: [id-wallet-commerce-b.tsx](../k-tour-id-app/features/ondo/commerce-b/id-wallet-commerce-b.tsx), [funding-rail-model-b.ts](../k-tour-id-app/features/ondo/commerce-b/funding-rail-model-b.ts) | `krw_bank` / `card_wallet`의 `card, apple_pay` / `digital_dollar`; `quoted → authorize → pending → settled`, `cancelled/failed/expired/unknown` 복구. `PREPARE_QUOTE`로 보존한 checkout은 funding 후 같은 order/quote 검토로 복귀, wallet-origin은 사용할 곳 보기 | 공통 balance/held/available·revision, rail/device/region 지원표, 견적, provider authorization, receipt·원장 credit. funding 완료는 결제 승인 아님; 만료/변경 quote 재검토·별도 동의. unsupported를 sample 성공으로 대체 금지 |
| 충전 → USDC/USDT → signer: [stablecoin-funding-b.tsx](../k-tour-id-app/features/ondo/commerce-b/stablecoin-funding-b.tsx), [wallet-connection-preview-b.tsx](../k-tour-id-app/features/ondo/commerce-b/wallet-connection-preview-b.tsx) | signer 선택은 `zklogin/existing_wallet`; 권한 미리보기 `waiting/declined/timed_out` → 승인 또는 재시도/견적 복귀. 모델 signer는 `disconnected/ready/failed/wrong_network` | 연결 승인과 자산 전송 동의는 별개. 연결 취소/timeout으로 자금·Account/Person/Age/Payment KYC를 변경하지 않음 |
| 같은 stablecoin sheet의 source/arrival/잔액 단계: [funding-rail-model-b.ts](../k-tour-id-app/features/ondo/commerce-b/funding-rail-model-b.ts), [stable-commerce-model-b.ts](../k-tour-id-app/features/ondo/commerce-b/stable-commerce-model-b.ts) | `quote/authorization/source_pending/destination_pending/settled`; source `not_submitted/pending/confirmed/failed/unknown`, destination `not_started/pending/confirmed/failed/unknown`. 도착 확인과 credit 반영을 별도 표시 | source receipt, destination receipt, durable credit commit은 각각 별도 증거. Wallet `fundingCredits`를 결제·환불 ledger pair나 DID proof로 변환하지 않음 |
| 매장 혜택/일반가격 → checkout → 영수증: [id-wallet-commerce-b.tsx](../k-tour-id-app/features/ondo/commerce-b/id-wallet-commerce-b.tsx), [stable-commerce-model-b.ts](../k-tour-id-app/features/ondo/commerce-b/stable-commerce-model-b.ts), [action-gate-coordinator-b.tsx](../k-tour-id-app/features/ondo/identity-b/action-gate-coordinator-b.tsx) | `order`/`orders`는 개별 주문 context/원장, `fundingCredits`는 공통 입금. `idle/paid/refunded`는 선택 주문 요약이고 `paymentOperation.phase = authorized/capture_pending/capture_failed/unknown/declined/voided/settled`와 다름. `unknownStage`가 authorization/capture를 구분 | 고유 order/operation/receipt 및 venue/offer/가격 binding, 별도 Payment KYC, 서버 policy/limit·benefit reserve, processor hold/capture. 다른 주문 ID/영수증 재사용 금지; Person 또는 signer 연결은 결제 동의가 아님 |
| Wallet 주문 내역 → 원 주문 → 부분/전액환불 → 공통 잔액/같은 매장 | 선택 주문의 `refundOperations[].phase = pending/unknown/failed/settled`; `operationId`, `amountKrw`, `attempts`, `receiptId`. 전액환불 때만 사용한 샘플 혜택 복원. 과거 주문 선택은 공통 잔액 불변 | 원 주문 captured 상한·동시 환불 lock·동일 요청 retry/query·원 발급 귀속·캠페인 복원 정책. 다른 주문/발급에 환불 혜택을 전가하지 않음. 샘플 `REFUND` shortcut을 운영 API로 복사 금지 |
| 매장/연결된 Table → 별도 예약: [reservation-model-b.ts](../k-tour-id-app/features/ondo/reservation-b/reservation-model-b.ts), [reservation-b.tsx](../k-tour-id-app/features/ondo/reservation-b/reservation-b.tsx) | 장소별 draft/phase/operationId/confirmationRef와 `history`. 선택 변경은 해당 장소 기록을 복원하며 중단된 request/cancel은 unknown/cancel_unknown 조회 | 영구 예약 목록·재고·원 operation의 confirmation/cancel 상태. 샘플 history는 같은 장소의 모든 과거 예약을 저장하는 서버 이력이 아니며 Table membership과 독립 |
| ID → Demo → Partner tools → 정산/이벤트: [integration-demo-b.tsx](../k-tour-id-app/features/ondo/integration-demo-b/integration-demo-b.tsx), [integration-demo-model-b.ts](../k-tour-id-app/features/ondo/integration-demo-b/integration-demo-model-b.ts) | 정산 `open/pending/settled/mismatched/failed`; 환불 후 과거 receipt는 보존하되 현재 승인 아님. 이벤트 `queued/pending/recorded/failed`; `recorded` receipt의 `transactionHash`는 null | 업무원장, 정산 대사, 실제 지급, OmniOne outbox/검증 receipt를 분리. 현재 export는 `schemaVersion/eventType/randomEventRef/aggregateKind/policyVersion` 5필드; `nonPiiPayloadHash`는 향후 계약 후보이지 현 export 필드가 아님 |
| 같은 정산 탭 → 정산 문의 펼치기 | `support.phase = review/pending/unknown/failed/stale/submitted`. `submitted`에서만 새 문의 CTA; `newSupport(operationRef)` 후 사유 선택→새 review→새 consent. 불변 `supportHistory`에 제출 성공만 1회 추가 | `supportHistory`는 이번 mount 세션의 비금융 기록. 서버는 actor/settlement 소유권, 고정 요약 revision·동의, durable ticket 이력과 접근제어 구현. draft 취소/새 문의로 이전 제출 기록 삭제 금지 |
| Labs → signer/route/badge: [labs-entry.tsx](../k-tour-id-app/features/ondo/labs/labs-entry.tsx), [labs-model.ts](../k-tour-id-app/features/ondo/labs/labs-model.ts), [labs-review-truth-b.ts](../k-tour-id-app/features/ondo/labs/labs-review-truth-b.ts) | 접두사별 상태: `WAL-{DISCONNECTED,CONNECTING,READY,FAILED}`, `BRG-{IDLE,QUOTED,CONFIRMING,PENDING,SIMULATED-SUCCESS,FAILED,CANCELLED,EXPIRED}`, `NFT-{LOCKED,ELIGIBLE,OPTED-IN,MINTING,MINTED,FAILED}` | Labs route는 읽기 전용 가설, Travel Wallet credit 0. badge opt-in·고유 방문·signer/person gate는 자산 funding과 별도. 반복 mint UI는 기존 샘플 결과를 유지할 뿐 실제 mint receipt/idempotent provider 응답을 만들지 않음 |

### 앱 제안 API와 공급업체 계약의 경계

다음 경로는 [Deployment Spec §4–5](./DEPLOYMENT_SPEC.md)의 **새 ONDO BFF 제안**이다. 현재 배포된 API, CX/OpenDID/OmniOne/Sui의 공식 endpoint, 확정된 provider schema로 읽지 않는다. 업체 선택·팀 환경 수령 후 담당자가 request/response·callback·error·receipt mapping 문서를 작성한다.

POST 성공만 연결해서 완료 처리하지 않는다. [§4.3 조회·복구 API](./DEPLOYMENT_SPEC.md#43-성공-화면-외에-연결해야-할-조회복구-api)의 `GET /operations/{id}`, capture/void/funding cancel, 문의 이력/export job 조회, 방문/badge 조회를 해당 BE 작업에 함께 배정한다. 취소 요청이 허용되는 단계와 이미 제출된 작업의 상태 조회를 구분하고 FE의 닫기·재진입·unknown CTA를 실제 응답에 연결한다.

| 앱 제안 API 묶음 | FE가 필요로 하는 결과 / 서버 계약 산출물 | 공급업체와 별도로 확인할 것 |
| --- | --- | --- |
| `GET /places/{id}/services`, `GET /places?capability=wallet&cityId&cursor` | source/provenance·merchantId·offer/reservation/table 지원·policy revision/expiry. 지도 사용처 필터와 실제 선택 매장 action 지원 | 제휴/결제 수용·예약 제공 권한, 데이터 권리와 매장 mapping. 현재 27개 sampleOnly registry를 실제 가맹점 명단으로 수입 금지 |
| `GET /wallets/current`, `GET /orders?cursor`, `GET /orders/{id}`, `GET /reservations?venueId&cursor` | 공통 balance/held/available·revision, 주문별 venue/offer/operation/receipt·capture/refund, 장소별 예약/취소 상태·cursor. 모든 조회는 actor/resource 소유권 검사 | wallet ledger와 merchant order·예약 provider ID mapping·정합성·보존 정책. 서버 endpoint가 이미 존재하거나 vendor API와 동일하다는 의미 아님 |
| `/funding/methods`, `/funding/quotes`, `/funding/intents`, `/funding/intents/{id}` | 지원표·required proof·expiry·사용자 검토용 금액/asset·허용 handoff·원 operation 상태·검증 receipt. 지원하지 않는 수단은 명시적 unavailable | 선택 rail의 processor/onramp API·device capability·tokenization·callback signature·최종성. Apple Pay 버튼 자체는 processor 아님 |
| `/quotes`, `/payments`, `/payments/{id}`, `/refunds/quotes`, `/refunds`, `/refunds/{id}`, `/vouchers/{id}/{action}` | 서버 재계산 quote·정책 revision·reserve/capture/refund·voucher 원자성·상태 조회 | provider의 auth/capture/refund/void semantics·이벤트 순서·대사 reference·취소 가능 시점 |
| `/partner/settlements`, `/partner/settlements/{id}/reconcile`, `/partner/disputes`, `/partner/disputes/{id}`, `/partner/settlement-exports` | tenant/actor 범위의 정산·문의·export job. 문의 검토에는 서버 요약 revision/digest와 금액을 제공하고 submit 시 같은 revision·동의를 검사 | support/ticket SaaS 사용 여부, payout processor, 허용 역할과 retention. 고객 문의자인지 partner staff인지 route auth 정책에 명시; 현재 sample console이 실제 partner 인증은 아님 |
| §4.3의 이력 조회 제안 `GET /partner/disputes?settlementId&cursor` | 제출된 문의의 reason·ticketRef·createdAt·고정 금액 요약 이력. 새 문의는 새 idempotency key, 기존 unknown은 기존 `{id}` 조회 | 최종 경로·pagination·보존 정책은 OpenAPI에서 합의. vendor endpoint로 확정하거나 이 API가 이미 구현됐다고 표시하지 않음 |
| `/operations/{id}/evidence`, `/operations/{id}/evidence/retry` | 원 업무 operation과 분리된 outbox 상태·확인된 chain receipt. retry는 같은 증거 작업 | OmniOne 팀 network/API/RPC·EOA·ABI/compiler·roles·finality. 계약 주소나 실제 hash 없이 confirmed 금지 |
| `/sui/sessions`, `/sui/transactions/{action}`, `/sui/transactions/{id}`, `/visits`, `/badges/claims` | signer session·승인 intent·effects 조회와 별도 고유 방문/badge claim. source transfer·badge·destination operation ID를 분리 | 선택 Sui SDK/wallet·zkLogin 구성, Move package·asset registry·gas 정책. cross-chain 공급자/authority는 ADR-SUI-01 전 미선택 |

API 착수 산출물은 OpenAPI/schema + 상태전이표 + error code/`safeNextAction` + provider mapping + DB migration/idempotency/outbox 설계 + 비식별 fixture다. 현재 reducer action이나 `ReviewFixtureExecution`을 서버 API로 노출하지 않는다. `operationId`는 추적 식별자일 뿐 접근 권한이 아니며 모든 조회/재시도에도 actor/resource 검사를 적용한다.

### Commerce·Chain 담당자가 바로 나눌 작업

| 작업 묶음 | 구현 순서 / FE 리뷰 지점 | 반드시 실패시킬 반례 |
| --- | --- | --- |
| BE-01 + BE-06: 지원표·공통 잔액·입금 원장 | auth/operation 저장 → methods/quotes → provider handoff → webhook/status → destination 검증·credit 원자 commit → 모든 주문의 balance/held/available 조회. 부족액 funding은 원 order/quote 검토로, wallet funding은 사용처 지도로 복귀 | 같은 key의 다른 body는 conflict; 다른 actor/quote/asset/network/amount receipt 거절; source-only/중복 credit 0; unknown 새 전송 0; 복귀 자동 결제 0·만료 quote 재동의 |
| BE-07/08: 개별 주문·결제·혜택·환불 | venue/offer capability → 고유 order/operation/receipt → policy·spent+reserved → locked quote/동의 → hold → capture+원장/혜택 → 원 주문 환불 saga. [ondo-b-provider.tsx](../k-tour-id-app/features/ondo/shared/state/ondo-b-provider.tsx)의 최종 commit을 provider adapter로 교체 | cross-venue ID/receipt 재사용 거절; 내역 선택으로 hold/잔액 초기화 0; 옛 주문 환불은 다른 주문/발급 불변; 승인만으로 debit 0; 혜택 중복 거절; refund 합계 > captured 거절; 확정 capture를 “차감 없음”으로 덮지 않음 |
| BE-14: 문의 이력·export | 서버 ledger summary/revision → consented dispute operation → durable immutable ticket → history/status → 새 문의. 문의 생성과 payout/ledger mutation을 다른 권한·transaction으로 유지 | 결제 문의 제출→환불→새 환불 문의에서 old/new 요약 유지; review 전후 revision 변화는 stale 재검토; pending/unknown은 같은 작업; 반복 check ticket 1개; cancel draft가 제출 이력을 지우거나 돈/event를 만들지 않음; 타 tenant history/export 거절 |
| BE-13: OmniOne 증거 | 업무 transaction+outbox → worker submit → network/address/event 검증 → receipt → retry/backoff/DLQ/reconcile. event UI의 `recorded`를 검증된 provider 상태로 mapping | out-of-order/중복 callback 상태 회귀·업무 재실행 0; 실패한 anchor 때문에 capture를 취소로 표시 금지; 권한 없는 replay/임의 contract call 거절; 원문 PII 및 그 단순 hash 제출 거절 |
| BE-15: signer·선택적 badge | ADR-SUI-01의 선택 분기(일반 wallet 또는 zkLogin) 구현 → intent 승인 → effects 확인; 10번째 고유 visit와 opt-in badge는 별도 operation | signer 취소/만료/wrong network가 Person/Age/Payment KYC를 생성하지 않음; 변경 intent·sponsor 초과 거절; payment만으로 visit 증가 0; duplicate visit/mint 생성 0 |
| BE-16: 승인된 route의 최종성·복구 | 지원 근거/authority 확정 전 provider 기능은 NOT_CONFIGURED. 확정 후 source/destination adapter·receipt verifier·보상/대사·credit commit 연결 | Labs fixture를 consumer funding receipt로 수용 금지; source 확정 뒤 timeout을 새 source 전송으로 복구 금지; 다른 route/operation receipt·근거 없는 OOKRW 상환 거절 |

수락 증거는 각 작업의 정상 receipt 1개만이 아니라 위 반례의 requestId/operationId·비식별 응답·DB/ledger 변화·UI return context를 함께 남긴다. 실제 연동 준비가 미완료여도 이 계약과 샘플 fixture를 이용한 개발·목업 검수는 진행할 수 있다. AUTH/DID/AGE/RESIDENCE/PAYMENT/CHAIN/SUI/DATA **8개 ADR은 모두 미확정 상태를 유지**하며 이 작업표가 provider·release·network·bridge·금융 정책을 대신 결정하지 않는다.

### 스테이블코인 연결 전 별도 확인

- [ ] 채택 network와 실제 자산 registry: symbol이 같아도 coin type·native/wrapped·decimals가 다르면 다른 자산으로 처리. `sample` 식별자와 고정 환율을 운영 설정에 복사하지 않음.
- [ ] signer 준비와 provider funding 정책, Person/Age/Payment KYC를 분리. 어떤 rail/금액에 어떤 proof가 필요한지 서버 지원표로 정의하며 generic Passport 강제 gate를 추가하지 않음.
- [ ] 출금 token·atomic amount·fee·수령 표시액·destination·quote expiry와 사용자 서명 intent를 동일 operation에 고정.
- [ ] source receipt/finality, destination receipt/finality, consumer credit, merchant payment/payout를 각 상태로 관리. 체인 tx 하나로 모두 완료 처리하지 않음.
- [ ] 제출 후 닫기/timeout/새로고침은 미확정 operation 조회로 복구. source가 확정된 후 실패는 대사/보상이며 새 source 전송을 자동 시작하지 않음.
- [ ] 정산된 destination receipt 검증과 ledger credit를 영구 idempotency key로 1회 commit. 중복·충돌·다른 quote receipt·다른 계정 receipt 거절.
- [ ] OOKRW의 test-token/settlement hypothesis와 KRW 표시 가격을 구분. 상환 주체·route 계약이 없으면 운영 기능 비활성, mock은 명시적 샘플로만 유지.

프런트 G09-S의 `996119f` 프리뷰 Ready·공개35/35는 **historical mock evidence**다. 해당 URL과 수치는 [Map/ID/stablecoin release](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md), 이전 `3dc392b`는 [Prototype Completion release](./PROTOTYPE_COMPLETION_2026-09-10.md)에 보존한다. `52f376e`의 프리뷰 영향27개 및 기존 `564823e` 기준선은 [9월 11일 검수](./FINAL_JOURNEY_QA_2026-09-11.md), 당시 운영 URL은 [이전 운영 주소 검사](./PRODUCTION_RELEASE_2026-09-12.md)의 역사적 증거다. 이전 `82ea4c9`의 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)과 이전 기능 검수 기준 `e2ad7c4`의 [매장 After 19 겹침 수정 릴리스](./PLACE_AFTER19_FIX_2026-09-14.md)을 구분한다. `k-tour-id-app/features/ondo/commerce-b/stablecoin-funding-b.tsx`와 `funding-rail-model-b.ts`는 샘플 signer/source/destination 확인을 보여주며 `stable-commerce-model-b.ts`는 샘플 credit1회를 처리한다. 실제 funding receipt가 아니며 이 체크리스트의 운영 항목을 완료하지 않는다.

역사적 후보 로컬 증거: funding 계약30/30(새 stablecoin 모델19·기존11), **전체 계약771/771·통합 브라우저35/35·typecheck/standalone build/client scan PASS**. 당시 로그와 공개 35/35는 [Map/ID/stablecoin release](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md)에 보존하며 공개 기준선 `3dc392b` 결과와 합산하지 않는다. `tests/e2e/ondo-stablecoin-funding.spec.ts`가 source-only credit 금지·닫기/재진입·중복 도착·명시적 sample opt-in·signer 변경·같은 금액 반복을 검수한다. 새 checkout/Labs 브라우저 완주는 이 역사적 수치에도 포함되지 않는다.

credit는 현재 mounted app session에만 존재하며 새로고침·wallet reset 뒤 이전 settled receipt로 잔액을 되살리지 않는다. 실제 영구 원장·복원·서명·routing/attestation·수탁/상환은 BE-06/15/16에서 구현한다. 양쪽 token은 Sui Testnet 대상으로 표시하는 시뮬레이션이며 실제 지원 자산/bridge 주장이 아니다. [감사 기준선·확인한 반례·로그](./STABLECOIN_FUNDING_AUDIT_2026-09-09.md) 참조.

## 프런트와 맞추는 방법

1. 현재 샘플 모델을 서버 API처럼 복사하지 않는다. `DEPLOYMENT_SPEC §5`의 envelope에 실제 응답을 담고, 명시적 provider adapter로 프런트 상태에 변환한다.
2. 미구성 provider는 실제 모드에서 `NOT_CONFIGURED`로 남긴다. 실패 시 샘플 성공으로 fallback하지 않는다.
3. 브라우저의 샘플 `verified`, 한도 사용액, milestone, ledger, `SAMPLE-` 번호는 운영 권한·거래 증거가 아니다.
4. 새 API의 정상·취소·실패·unknown/retry를 현재 공개 목업과 같은 CTA/return context로 검수한다. URL·analytics·trace에 문서/생체/전체 VC·결제 원문을 남기지 않는다.
5. 인계 소스·스펙·환경 manifest·테스트 증거를 같은 commit/release로 묶는다. 구형 root 실험 앱이나 legacy `/wallet`, `/partner` 파일은 현재 배포 증거가 아니다.

이전 기능 검수 기준 `e2ad7c4`의 구현·검수 범위는 [매장 After 19 겹침 수정 릴리스](./PLACE_AFTER19_FIX_2026-09-14.md)을 따른다. 이전 `52f376e` 및 f79 기준선은 [9월 11일 배포 기록](./FINAL_JOURNEY_QA_2026-09-11.md), `3dc392b`는 [Prototype Completion release](./PROTOTYPE_COMPLETION_2026-09-10.md), 역사적 모바일/G09-S 후보는 [Mobile layout release](./MOBILE_LAYOUT_RELEASE_2026-09-10.md)와 [Map/ID/stablecoin release](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md)에 보존한다. 실제 backend 체크박스는 이번 UI 작업으로 대신 체크하지 않는다.

### 새 문의 이력 변경의 검수 상태와 재현 명령

2026-09-11 작업본에서 [support 계약](../k-tour-id-app/tests/contracts/ondo-settlement-support.spec.ts) 6개와 [integration 계약](../k-tour-id-app/tests/contracts/ondo-integration-demo.spec.ts) 21개, 합계 **27/27 PASS** 및 `pnpm typecheck` PASS를 확인했다. 이 결과는 로컬 모델/타입 검사이며 공개 배포 또는 공급자 검증이 아니다. 이후 [support-history E2E](../k-tour-id-app/tests/e2e/ondo-settlement-support-history.spec.ts)는 기존 f79 공개 기준선 `564823e` / runtime `770d6b1`에서 EN 390 light·KO 320 dark **2/2 PASS**했다. 결제 문의→환불→새 동의·환불 문의→이전/새 ticket 보존, unknown 재진입, 중복 방지, 잔액 불변, 포커스·reflow 결과는 `final-journey-commerce-main.log`에 기록되어 있으며 commerce 묶음의 고유 50개 범위에 포함된다. URL·trace·runtime 증거는 [전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)를 따른다. 이 두 케이스의 기존 URL 결과를 이후 `52f376e` 또는 이후 `82ea4c9`/이전 기능 검수 기준 `e2ad7c4`에서 재실행한 것으로 표시하지 않는다.

`k-tour-id-app`에서 실행한다. 아래 브라우저 명령은 담당자가 새 standalone 후보를 준비한 다음 승인된 `PLAYWRIGHT_BASE_URL`에 대해 실행하며, 이전 공개 URL 결과로 새 변경을 통과 처리하지 않는다. 해당 환경변수는 기존 서버를 사용하도록 하므로 다른 개발 서버를 자동 시작하지 않는다.

```sh
pnpm exec playwright test tests/contracts/ondo-settlement-support.spec.ts tests/contracts/ondo-integration-demo.spec.ts --config=playwright.contracts.config.ts --workers=1 --reporter=line --output=artifacts/qa/settlement-support-history-contracts
pnpm typecheck
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3438 pnpm exec playwright test tests/e2e/ondo-settlement-support-history.spec.ts --project=mobile-chromium --workers=1 --reporter=line --output=artifacts/qa/settlement-support-history-browser
```

기존 연결 회귀는 `tests/e2e/ondo-complete-commerce-journey.spec.ts`, `ondo-stablecoin-funding.spec.ts`, `ondo-commerce-operations.spec.ts`다. 새 provider adapter에는 위 반례를 실제 sandbox 응답으로 재현하는 별도 suite가 필요하며 샘플 PASS를 provider PASS로 이름만 바꾸지 않는다.

## 인계 gate (machine-checkable)

<!-- ktour-backend-handoff:v1 -->

- [x] `baseline:current:cc3d7c3`: source/runtime `cc3d7c3`, [운영 앱](https://ondo-tau.vercel.app). 브랜딩 전용 production Ready이며 최종 deployment `dpl_Bf4rBwnqH5PpaHeMRW6NmM8y3Wk1`의 고유 주소·검수 범위는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. 마지막 기능 흐름 검수 `e2ad7c4`의 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md) 및 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md) 결과와 합산하지 않는다
- [x] `baseline:historical:996119f`: 이전 G09-S 수치·URL이 historical로 분리되고 current evidence와 합산되지 않음
- [x] `trace:G01-G13`: [DEPLOYMENT_SPEC Appendix A](./DEPLOYMENT_SPEC.md#appendix-a-g01g13-인계-추적-요약)의 각 row에 public component·fixture/test·FE gap·BE/H·ADR·proof status가 있음
- [ ] `fe:provider-sdk`: `FE-CX-PASSPORT`, `FE-OPENDID`, `FE-PAYMENT`, `FE-SUI`, `FE-RESERVATION` 각각 실제 handoff evidence 보유
- [x] `mock:not-receipt`: sample signer/receipt/local meal plan을 실제 signer/receipt/restaurant booking으로 표시하지 않음
- [x] `adr:8-unresolved`: AUTH, DID, AGE, RESIDENCE, PAYMENT, CHAIN, SUI, DATA ADR 모두 owner/decision/impact 기록; release/network/real bridge 미선택
- [ ] `backend:evidence`: 각 BE ID의 API/schema/callback/error/recovery/receipt/rollback evidence가 같은 release에 묶임
