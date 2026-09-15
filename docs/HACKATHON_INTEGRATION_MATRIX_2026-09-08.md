# K-Tour ID 해커톤 연동·목업·백엔드 작업 매트릭스

**현재 앱·소스:** 대표 주소는 [K-Tour ID](https://ktour-id.vercel.app), 기준 소스는 [`main`](https://github.com/woogieboogie-jl/k-tour-id/tree/main), Harvey 시작 브랜치는 [`handoff/harvey-20260914`](https://github.com/woogieboogie-jl/k-tour-id/tree/handoff/harvey-20260914)다. 배포와 두 브랜치의 동일 소스 동기화 상태는 [현재 배포·인계 기록](./KTOUR_PRODUCTION_HANDOFF_2026-09-15.md)에서 확인한다. 현재는 확인 대기다. 아래 과거 source·검수 기록과 구분하며 Sumsub 실험은 별도다. CX·OpenDID·OmniOne Chain·Sui 필수 구현 범위는 유지한다.

기존 운영 브랜딩 기준선: source/runtime `cc3d7c3`, [운영 앱](https://ondo-tau.vercel.app). 브랜딩 전용 production Ready이며 최종 deployment `dpl_Bf4rBwnqH5PpaHeMRW6NmM8y3Wk1`의 고유 주소·검수 범위는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. 실제 provider/SDK 요구와 해커톤 범위는 변경하지 않았다. 이전 기능 검수 결과를 새 브랜딩 배포의 전체 여정 PASS로 이월하지 않는다.

원 기준선 상태: `2026-09-14 지도 우선 진입 운영 Ready · 로컬 신규5개/desktop1개·832계약·운영 HTTP PASS · 운영 신규5개/실제 desktop1개 PASS · 외부 연동은 별도`

기존 `cc3d7c3`의 당시 로컬 검수는 관련 계약44/44·typecheck·production build/scan·HTTP probe(공개 자산41개)·mobile/desktop 브랜드 E2E6/6(workers1/retries0) PASS다. 최종 고유 배포의 HTTP probe 및 mobile/desktop 브랜드4/4(7.4초, workers1/retries0) PASS. 별칭별 추가 확인 범위는 릴리스 기록을 따르며, 전체 여정 재검수나 실제 provider/실기기 검수로 확대하지 않는다. 마지막 기능 흐름 검수 기준은 이전 `e2ad7c4`다. 당시 전체 계약833/833·After 19 공개 경로 로컬5/5 및 운영5/5 PASS(운영2.0분, workers1/retries0; project mismatch skip5개 제외)는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)의 역사적 증거이며 `cc3d7c3`에서 재실행한 결과가 아니다. 이전 `82ea4c9` 공개 mobile12/desktop·tablet2, `3d02b84` 로컬 mobile12/기존7, 당시 계약826 결과는 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)의 역사적 증거다.

- [x] 9월 11일 프리뷰 `52f376e`의 영향27개 **범위 한정 PASS**. 기준선174개와 별도 URL의 증거이며 현재 운영 URL 실행 수로 세지 않는다. 최초 실패·재실행 조건은 [전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)에 보존한다. 실제 공급자 활용·제출 인정과 별도다.

`996119f`와 `3dc392b`는 역사적 공개 후보다. 당시 증거·제한은 [9월 10일 릴리스](./PROTOTYPE_COMPLETION_2026-09-10.md)에 보존한다. 저장된 패스 Back 복귀, 후속 정산 문의/history, 장소24개 확장은 `770d6b1`에 포함됐다. 배포 전 문서 대조·선택 로컬 회귀는 [인계 정합성 점검](./HANDOFF_SYNC_2026-09-11.md), 현재 공개 검수는 위 최신 배포 기록으로 구분하며 이전 결과를 이번 PASS에 합산하지 않는다.

정본 3개는 [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md), [백엔드 체크리스트](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md), 본 매트릭스다. 개발자는 [시작 안내](./DEVELOPER_START_HERE.md)에서 공개 경로와 작업 순서를 읽고 세 정본의 G/BE/H 번호로 추적한다. 아래에서 **공식 대회 요구**, **이 프로젝트가 채택한 범위**, **목업의 검수 증거**, **실제 연결 증거**를 별개로 판정한다.

이번 납품 수락 기준은 사용자가 실제로 누를 수 있는 **완결된 mock UX와 그 동작에 일치하는 개발 명세**다. 실제 CX/OpenDID/Chain/Sui/provider 연결·운영 FE SDK는 개발자가 후속 수행한다. `백엔드 필요`를 현재 목업 미완료로 세지 않되, 외부 연결이 없다는 이유로 취소·거절·재시도·원 행동 복귀의 목업 공백을 숨기지 않는다. 목업 PASS로 운영 체크박스나 공식 대회 활용 증거를 완료 처리하지 않는다.

## 1. 공식 요구와 프로젝트 선택

| 기술/요구 | 공식 문서에서 확인한 범위 | 이번 프로젝트 범위 | 아직 별도로 확인할 것 |
|---|---|---|---|
| 모바일 신분증 활용 | 공식 필수과제 | 국내 사용자의 Mobile ID 결과가 실제 service 자격 판단에 쓰이는 여정 | Track 2 최종 제출물에서 요구하는 실제 연결/시연 증거, 최신 심사 공지 |
| OmniOne CX | 가이드의 모바일 신분증 필수과제 활용기술. 정부 SDK 직접연동 대안도 제시됨 | 프로젝트가 채택한 Mobile ID 연동 경로. 목업 + backend adapter 필수 작업 | 팀용 환경·테스트 신분증·provider 지원·승인 절차 |
| OpenDID | 공식 선택과제, 가점 대상 | 사용자 요구에 따라 VC 발급·holder·VP·verifier·status 목업과 실개발 계약 포함 | 제출 시 인정되는 활용 수준, 사용 release·trust environment·holder |
| OmniOne Chain | 공식 선택과제, 가점 대상 | 비식별 업무 event·혜택 불변식·receipt·정산 연결 포함 | network·사용 신청·API/EOA·배포 권한·제출 증거 |
| Sui | 확인한 대회 가이드에는 해당 요건 없음 | **사용자가 명시한 추가 목업/인계 요구**. 과거 P2 표기로 제외 금지 | 실제 제품 역할·asset/Move package·별도 바운티가 있으면 그 원문 |
| Passport eKYC / Residence / Payment | 사업의 persona·서비스 실행에 필요한 연동 | 세 persona와 wallet/payment/benefit 완주 목업 + backend 작업 포함 | 계약 provider·법적/지역 지원·테스트 환경 |

공식 2026 가이드의 p5/p8은 필수·선택 과제를, p19–26은 CX와 직접연동 경로를 설명한다. OpenDID·Chain 선택과제는 각각 5% 가점 대상으로 기재되어 있다. 이는 목업을 만들면 그 가점이 자동 인정된다는 뜻이 아니다. [공식 가이드북](https://opendid.org/download/hackathon/2026/2026%20%EB%B8%94%EB%A1%9D%EC%B2%B4%EC%9D%B8%20%26%20AI%20%ED%95%B4%EC%BB%A4%ED%86%A4%20%EA%B0%80%EC%9D%B4%EB%93%9C%EB%B6%81.pdf?v=20260430), [주관사 공식 공지](https://opendid.omnione.net/layout/kor/home.php?go=pds.list&mid=&num=96&pds_type=1&s_key1=&s_key2=&s_que=&start=0).

사업 PDF `TrackNo2_Hope&Woogieboogie_K-Tour ID_260531.pdf`의 핵심은 서로 다른 신원 소스를 Identity Adapter/TrustProfile로 정규화하고, 체류기간·결제한도·혜택권·서비스 접근·만료를 K-Pass에 담는 것이다. PDF 표기의 CX 필수·OpenDID/Chain 선택은 위 공식 요구 구분과 함께 읽는다. 사업 설계에 적힌 필드가 현재 앱에서 구현됐다고 추정하지 않는다.

## 2. 현재 코드에서 확인한 경계

- 기준선: 핵심 DID 공개 목업 `bec3257` 이후 v3.2 및 G09-S 변경. 원 인계 기준선은 [snapshot `9d4aec9`](https://github.com/woogieboogie-jl/k-tour-id/tree/9d4aec9)의 `k-tour-id-app/`이며 현재 시작점은 위 main/Harvey 경로다. `996119f`·`a45400f`·core app `5233816`와 이전 공개 source `3dc392b`는 각각의 후보 증거다. 이전 공개 증거는 [Prototype Completion release](./PROTOTYPE_COMPLETION_2026-09-10.md), 당시 문서 대조·선택 로컬 회귀는 [9월 11일 점검](./HANDOFF_SYNC_2026-09-11.md), 이전 `52f376e`·중간 `f8960b4`·`abd0f83`과 기준선 `564823e`의 공개 결과는 [9월 11일 배포 기록](./FINAL_JOURNEY_QA_2026-09-11.md)에 보존한다. 이전 기능 검수 기준 `e2ad7c4`는 [매장 After 19 겹침 수정 릴리스](./PLACE_AFTER19_FIX_2026-09-14.md)의 범위만 따른다.
- 아래 `B/`는 이 기준선의 `k-tour-id-app/features/ondo/`다. 루트의 오래된 앱이나 배포에서 제외된 legacy route를 현재 증거로 세지 않는다.
- `코드 존재`는 읽기 검토 결과다. 각 flow의 실제 브라우저 정상·경계·mobile 검수 통과는 별도 기록이 필요하다.
- `구현중`은 이번 turn의 새 작업이다. 결과를 보지 않고 완료로 갱신하지 않는다.
- 현재 대다수 외부 결과는 샘플이다. 과거 SDK 실험이 성공했더라도 현재 제품에 연결된 결과와는 다르다.
- 9월 12일 작업본은 [MW-01–05 매장 중심 지도·잔액 여정](./MAP_WALLET_JOURNEYS_2026-09-12.md)으로 G01/G03/G08-R/G09/G10을 연결한다. 아래 코드 계약 확장은 기존 release 수치를 새 후보 PASS로 바꾸지 않으며 실제 SDK/provider 완료를 뜻하지 않는다.

| ID | 연동 영역 / 연결 flow | 현재 mock·근거 | mock 한계 / 개발자 후속 연결 | 개발자가 실제 구현할 것 | 실제 연결 완료에 필요한 증거 |
|---|---|---|---|---|---|
| H01 | CX Mobile ID / G05, FL-005 | `identity-b/identity-handoff-step-b.tsx`, `identity-demo-boundary-b.ts`, `ktour-id-setup-b.tsx`: 동의→시작→45초 대기→데모 승인/거절/취소/만료→K-Tour ID 복귀·동일 방법 재시도. 별도 짧은 Person check는 `local-check-walkthrough-b.tsx` | 같은 브라우저의 샘플 앱 화면이며 실제 CX 앱 실행/QR/신분증 승인이 아님. 실제 provider metadata·claim 정책·callback 연결은 후속 | discovery → trans → 실제 QR/WEB2APP → 검증된 result/token → 최소 IdentityEvidence → 원 action. 요청 종료 후 늦은 callback 거절 | 실제 테스트 Holder 승인·검증 결과 + 취소/미설치/만료/중복/잘못된 callback 거절; 신분증 원문 없는 로그 |
| H02 | 장기체류 / G05, FL-006 | Residence method·unsupported/fallback 경로 코드 | provider 지원표를 샘플/실제로 구분; residence entitlement를 passport fallback이 자동 제공하지 않도록 | active provider 조회, 지원 claim·assurance·체류 근거 mapping, 승인된 대체 provider | 지원/미지원 각각의 receipt, fallback 근거·제한, 만료·재진입 |
| H03 | Passport eKYC / G05 | `identity-b/passport-ocr-step-b.tsx`, `passport-face-step-b.tsx`: 가림 샘플→권한 응답/거절·재시도→직접 촬영 선택→샘플 NFC 읽기/재촬영→검토→얼굴 권한/고개 돌리기 예시/재시도. `contracts/identity-journey-samples.ts`에 문서·얼굴 실패/수동검토·추가정보/취소·만료 분기 | 실제 기기 권한을 요청하거나 카메라/NFC를 켜지 않으며 실제 문서·얼굴·liveness를 수집하지 않음. 운영 provider·보안 upload·기기 handoff는 후속 | provider session, 동의, secure upload/native handoff, document/liveness 판정, retention/delete | 공식 sandbox 성공·거짓 문서/얼굴 불일치·취소·manual-review; raw 정보 미보관/삭제 증거 |
| H04 | TrustProfile/K-Pass / G05–G10 | `contracts/kpass-capabilities.ts`, normalized claims, 8개 샘플 자격, service card 및 최종 CTA allow/deny 구현 | 실제 서버 판정기·증거 freshness·spent/reserved 원장 필요. 브라우저 policy는 샘플만 | 검증된 evidence → versioned policy → service/benefit/stay/limit/age/risk claims; last-step 재평가 | 동일 action에서 missing proof/false/expired/revoked/limit 변화에 따라 다른 결과; client claim 위조 거절 |
| H05 | OpenDID issuance/holder/status / G05 | `identity-b/identity-holder-step-b.tsx`: 보관 준비→샘플 receipt→별도 ack 뒤 1회 저장. 실패/취소·재시도/expired·suspended·revoked/device recovery; 기존 method·age·체류·사용한 혜택/한도 보존. 작업본은 저장·재열기 결과의 Back을 원 ID 화면으로 복귀시킴 (`issuedOnceRef` 유지; 선택 로컬 회귀 PASS; 9월 11일 점검 기록 참조) | 실제 issuer/holder ack·status·동일 subject recovery 미연결. mock ack는 실제 credential 보관이 아님. 새 발급은 일반 Back이 아니라 명시적 갱신/기기 복구와 재동의로만 진행 | release 고정, trust registrations, schema/type, issuer, holder binding/delivery, status/recovery | 실제 issue receipt + holder ack + status 조회 + revoke/renew/recovery + 발급/저장 부분실패; duplicate ack/callback 발급 1회 |
| H06 | VP·가맹점 검증 / G06 | `integration-demo-b/partner-handoff-b.tsx`: 샘플 partner/device 준비→동일 브라우저 QR/권한 응답 또는 이 기기에서 열기→holder 동의/거절→최소 결과. generic 요청은 audience/domain/purpose/requestedClaims/credentialId/policyVersion + nonce/TTL/1회 소비 검사; wrong audience/replay/만료/철회 sample | generic partner 요청에는 매장/quote/금액 필드가 **없다**. Table/Local Signal/checkout의 별도 action context 검사를 이 탭의 merchant/amount binding 증거로 세지 않는다. QR은 `ondo-demo:` 샘플 requestRef뿐이며 실제 신분증/검증 URL이 아님 | partner auth/device, 서명된 요청·OpenDID verifier·issuer/status/policy 검증. 거래에 사용하려면 resource/venue/offer/quote/amount/currency 및 사용자에게 보인 digest를 서버 요청/최종 mutation에 명시적으로 binding | 실제 holder/partner 동일 requestId, 최소공개 및 status; wrong nonce/audience/resource/금액/정책·replay·철회 거절. generic 샘플 receipt는 결제/예약을 실행하지 않음 |
| H07 | 연령 predicate / G07, FL-013/014 | map 선언과 서비스 proof 분리, unknown만 동의 후 보완, false 거절 및 같은 Table 복귀 구현 | 실제 연령 증명/기준정책 연결 없음. After19는 appearance 설정을 바꾸지 않음 | CX AdultVerify 또는 Passport-derived OpenDID CL proof 후보; 정책 cutoff/expiry/non-revocation 확인 | 실제 Holder의 true/false predicate + 요청 정책 대조 + 재생 방지. 일반 장소는 계속 사용 가능 |
| H08 | 공통 지갑·funding rails / G09/G09-S, MW-02/03 | 지도 잔액/ID Wallet → 충전 → 사용처 지도, 또는 부족액 → `PREPARE_QUOTE` 보존 → 충전 → 같은 주문/quote 검토·별도 결제 동의. 기존 은행·카드·Apple Pay와 USDC/USDT signer·source/destination·unknown 복구 보존. `996119f` 수치는 **historical mock evidence** | 공통 잔액은 mount 샘플이며 실 ledger 아님. historical funding 계약30개·브라우저10개/공개35/35는 [Map/ID/stablecoin release](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md)의 범위만 따른다. 실제 provider·토큰화·기기 capability·FX·자산/chain 연결 없음 | 공통 balance/held/available·revision, 자산/network/representation allowlist·atomic amount, funding KYC/지원표, signer/custody/gas, FX/fee quote, source/destination receipt·durable credit/reconcile | source 확정/destination pending credit 0, 중복 credit 0, unknown 동일 operation. 원 quote 복귀 후 자동 결제 0·만료/변경 재검토/재동의, 각 채택 rail의 실제 sandbox receipt·금액 대사 |
| H09 | 개별 주문·결제·바우처·환불 / G10, MW-01/05, FL-004/017 | 등록 매장별 quote/혜택·필요 자격→별도 결제 동의→고유 order/operation/receipt→같은 장소. 승인/매입·보류금·unknown, 원 주문 부분/전액환불·누적 상한 보존. 내역 선택은 공통 funding credit/잔액을 초기화하지 않음 | 실제 merchant/processor·order·ledger 미연결. funding은 결제 KYC/한도/혜택을 부여하거나 checkout 승인/상점 지급을 완료하지 않음. 샘플 내역은 영구 이력이 아님 | merchant capability와 venue/offer/금액 binding, Payment KYC·benefit policy/VP, 고유 ID·멱등 payment/refund, voucher atomic use, order saga·이중분개·history 조회 | 다른 매장/주문의 ID·receipt 재사용 거절, 미확정 hold 보존, 옛 주문 환불은 원 captured 이내·1회 공통 잔액 반영 및 다른 주문/발급 불변. merchant payout와 chain 기록 독립 |
| H10 | Tables·chat·현장·예약 / G08, G08-R, MW-04/05 | 서울/부산/제주 Table 및 참여·메시지 실패/재시도. 선택 매장/연결된 Table → 별도 `reservation-b` 날짜·인원→확인/취소→같은 매장. 장소별 history는 venue/operation/confirmation을 유지하며 full/실패/unknown은 동일 요청 조회 | 실제 좌석 예약·영구 chat/upload 미연결. 샘플 예약은 제휴/좌석 보장 아님. 장소별 로컬 기록은 같은 매장의 모든 과거 예약을 저장하는 서버 이력 아님. 일반 예약에 불필요한 DID/결제 gate 없음 | Tables inventory/membership authorization, realtime, object storage/moderation, check-in evidence, 신고 support + 별도 ReservationAdapter의 매장 지원·availability/request/status/cancel·장소별 이력 조회 | full·비회원 접근·image retry·leave/block/report receipt; 실제 예약은 별도 provider 확인번호, 장소 전환으로 원 예약 재명명·unknown 중복 제출 금지 |
| H11 | OmniOne Chain / G11 | 6개 샘플 업무 event→queue→pending→샘플 receipt/failed→retry. PaymentAuthorized는 승인 시점에 생성하고 매입 전에는 VoucherRedeemed/정산 제외. 복구로 같은 발급 event 중복 생성 없음 | 실제 submit/contract/receipt·durable outbox/DLQ 없음. 샘플 receipt에 실제 tx hash 생성 금지 | contract/EOA/API, 비식별 payload, outbox/DLQ/reconcile, event decode·network/contract 검증 | Solidity/ABI+bytecode·contract address·실제 tx/receipt·중복 redemption 거절·RPC 장애 복구 |
| H12 | 파트너 정산 / G11 | 결제/다수 부분환불 원장 대사, pending/실패/불일치/재시도·stale 재대사. 문의 사유/고정 금액 검토/실패·unknown 동일 요청 조회/ticket + 최소 금액 요약 JSON. 작업본은 제출된 문의의 명시적 새 문의와 불변 ticket history를 추가 (선택 로컬 회귀 PASS; 9월 11일 점검 기록 참조) | 실제 지급·partner auth·support backend/export job 미연결. 샘플 문의는 비금융이며 자금을 변경하지 않음. pending/unknown 문의는 새 요청으로 우회하지 않고 같은 operation 조회 | partner RBAC, settlement batch/ledger, payout/reconcile, dispute/export | partner별 권한, 합계 일치·불일치·부분환불·지급 pending/실패·회복 receipt |
| H13 | Sui signer / G09-S/G12, FL-018 | Labs의 공개 실패/복구 선택은 별도. 이전 공개 `3dc392b`는 명시적 signer permission/return, signer 변경·wrong-network 경계를 mock으로 보여준다. `996119f` G09-S sample signer 선택·wrong network 차단·signer 변경 재연결 수치는 **historical mock evidence** | historical candidate funding 브라우저35/35를 Labs proof로 세지 않는다. 실제 OAuth·proof·signer·gas·transaction 연결 없음. 양쪽 token은 Sui Testnet 시뮬레이션이며 sample signer는 DID/Payment KYC 아님 | zkLogin 또는 일반 wallet; salt/prover/ephemeral session/maxEpoch/recovery, Sui SDK transaction, network/target·sponsor allowlist, effects 검증 | 실제 선택 network의 signer/tx receipt, epoch 만료·거부·wrong network·변경 intent·sponsor 차단. signer 연결로 서비스 proof 생성 금지 |
| H14 | Sui↔OmniOne 전환 후보 / G09-S/G12 | 기존 `labs-review-truth-b.ts` 고정 USDT→OOKRW hypothesis quote는 **읽기 전용**이며 Travel Wallet credit 없음. 이전 공개 `3dc392b` complete-commerce/funding mock은 source-only credit 0·동일 operation 재진입·destination mock 1회 경계를 보여준다. `996119f` source→routing→destination→sample credit 수치는 **historical mock evidence** | 합의된 bridge/상환 authority 없음. 새 UI도 native bridge·실제 native/wrapped 자산 지원·원화 상환을 주장하지 않음. source/destination 실제 ledger·최종성 미연결 | `ADR-SUI-01`: 지원 route·routing/attestation·custody/상환 authority 확정 후 source/destination receipt 각각 검증, quote/동의 binding, durable credit 멱등성, 보상/대사 | 공식 지원 route/계약 근거 + 양쪽 receipt와 불일치 복구. source 성공만으로 credit 금지, destination pending/unknown은 동일 operation 조회. 지원 근거 없으면 sample-only |
| H15 | 방문·평판·badge / G12, FL-012/004 | 공개 9회 샘플 방문 준비→새 canonical 장소의 고유 샘플 방문 1회→10회 opt-in badge. 자동 10회 보정 제거. 반복 요청은 기존 샘플 badge 결과를 유지하고 두 번째 샘플 badge를 만들지 않음; 실패 재시도 | 실제 방문 근거·부정방지·Move mint 연결 없음. 샘플 방문과 실제 check-in 구분. `LabsBadgeReviewValue`는 `{badge: "travel-keepsake"}`이며 mint/tx receipt ID가 아님 | unique visit evidence, 부정방지, 활동별 reputation, opt-in Move badge 후보와 durable mint 멱등성 | 9→10은 고유 방문 1회, checkout으로 증가 금지, 실제 mint 1회·재요청 동일 receipt, 공개 metadata에 민감정보 없음 |
| H16 | 지도·사용처·신호·추천 / G01/G02/G03, MW-01/03/04 | 새 방문 전국→선택 도시 지도, 질문·자동 매장 preview 없음. 설정은 선택형이며 취소는 기존 취향/NEW·COMPLETE 보존, legacy 중단 reload도 지도. canonical 좌표·900ms heat dissolve·시간 replay·도시 28°/평면·전국 0°·타일 건물·theme/After19 분리 유지. 출처 장소24개(도시별8)+Table 연결3개를 registry의 27개 체험 사용처로 연결. 지도 잔액/사용처 필터·혜택/예약/Table·같은 매장 복귀; 길찾기는 보조 | 모든 commerce는 sampleOnly. research ID/nullable canonical mapping 유지; 조사 선정은 제휴/메뉴/재고/결제 수용 증거 아님. review=0에도 조사 listing은 남지만 체험 capability 미적용. realtime collector·실제 혼잡도·venue 사진 보장 없음 | rights-aware provenance·canonical mapping과 merchant/service capability 분리, 지원 상태/expiry·사용처 검색, observedAt/confidence·집계; 추천과 policy 분리 | source ID·갱신·동의·위치 최소화, 미등록/만료 capability 거절, 필터 해제 시 원 도시 맥락, 결제/예약 뒤 같은 매장·지도 복귀, duplicate/stale/unknown·fallback |
| H17 | 계정 서버 작업 / G13 | Settings→Privacy & data→Account services: 준비된 샘플 계정 export/다른 기기 revoke/delete·확인·pending/실패/unknown 동일 요청 복구. 실제 사용자 로컬 데이터와 분리 | 실제 계정 export/session revoke/delete backend 미연결 | AccountServicesAdapter exportJob/status/download, session revoke, retention-aware deletion job; authz/audit/idempotency | 본인 범위·signed download TTL·부분실패·동일 job 조회·현재 기기 영향 설명·법적 보존 분리 |

H08/H13/H14의 `996119f` 프리뷰·공개 35/35 문구는 **historical candidate evidence**로 읽는다. 이 행들의 `3dc392b`도 이전 공개 구현 snapshot의 범위 설명이며 이번 작업본 검수 결과가 아니다. G09-S funding 결과를 Labs·실제 signer·실제 bridge·실제 receipt로 승격하지 않는다.

### 2.1 개발자가 재현할 공개 신원 경로

모든 경로는 배포 대상 `/`의 공개 CTA로 시작한다. 브라우저 테스트의 fixture seed나 `__ONDO_*` QA hook을 사용자의 진입방법으로 문서화하지 않는다. 아래 selector는 테스트 추적용이고, UI 문구는 KO/EN/JA로 번역된다.

| 목적 | 공개 조작과 끝 상태 | 코드 / 회귀 근거 |
|---|---|---|
| G05 새 패스 | ID → K-Tour ID 만들기 (`kpass-start-setup`) → Mobile ID/Residence/Passport → 동의 → 각 샘플 확인 → holder receipt/ack → 저장 결과 → ID로 복귀. Account/Payment KYC/Wallet은 별도 | `identity-b/ktour-id-setup-b.tsx`, `identity-demo-boundary-b.ts`; `tests/e2e/ondo-identity-demo-boundaries.spec.ts`, `ondo-did-demo-journeys.spec.ts` |
| G05 기존 패스/복구 | ID → 패스 관리 (`kpass-manage-setup`) → 저장 결과. Back/닫기/돌아가기는 다시 method 선택으로 보내지 않음. 접힌 lifecycle의 명시적 갱신/기기 복구 → 재동의/확인/holder ack; 기존 자격은 새 결과까지 보존 | `ktour-id-setup-b.tsx: goBack, beginSampleRecovery, confirmSampleRecovery, finishHolder`; saved/reopened Back 새 회귀는 로컬 PASS (9월 11일 점검 기록) |
| G05–10 조건별 결과 | ID → 접힌 서비스 정보 (`kpass-service-toggle`)에서 Place notes/19+ Tables/혜택/결제 이동. 샘플 자격 선택 (`kpass-sample-picker`)에서 Guest+8개 조건을 비교 | `identity-b/kpass-service-card-b.tsx`, `contracts/kpass-capabilities.ts`; `ondo-kpass-service-journeys.spec.ts`, `ondo-kpass-age-recovery.spec.ts` |
| G06 실제 행동 복귀 목업 | Table 참여/장소 메모/checkout의 해당 CTA → 필요한 Account/Person/Age/Payment KYC만 확인 → 같은 Table·초안·고정 quote로 복귀. 동의/검증 완료가 최종 결제 동의를 대체하지 않음 | `identity-b/action-gate-coordinator-b.tsx`, `action-gate-contract-b.ts`; `ondo-kpass-service-journeys.spec.ts`, `ondo-traveler-food-pulse.spec.ts`, `ondo-complete-commerce-journey.spec.ts`의 해당 경로 |
| G06 일반 partner 시연 | Demo → 파트너 검증·정산 체험 → 검증 → 샘플 계정/기기 동의 → 목적/실패 상황 선택 → 요청 → 샘플 QR/스캔 또는 같은 기기 요청 → holder 동의/거절 → 최소 receipt → 재검증/닫기 | `integration-demo-b/integration-demo-b.tsx`, `partner-handoff-b.tsx`; `ondo-integration-demo.spec.ts`, `ondo-partner-handoff.spec.ts`. 이 탭의 일반 자격 확인은 merchant checkout 승인이 아님 |

### 2.2 mock 모델과 제안 API를 그대로 동일시하지 않기

`DEPLOYMENT_SPEC` §3의 필드는 **앞으로 구현할 정규화/API 계약**이다. 현 sample 타입이 그 모든 필드를 이미 저장하거나 provider가 같은 이름을 반환한다는 뜻이 아니다.

| 현재 코드의 표현 | 개발자 인계 계약 / 의미 경계 |
|---|---|
| `KPassNormalizedClaims`의 `personVerified`, `ageOver19: boolean|null`, `stayPeriod`, `identitySource`, `userType`, `trustLevel`, `riskFlag`, `serviceAccess`, `paymentLimitKrw/paymentSpentKrw`, `visitorBenefit` | provider evidence와 versioned issuer/policy에서 만들어야 한다. 데모의 30일/100,000원은 예시이며 법적 체류허가·provider 한도·실제 혜택 권리가 아님. 실제 evidenceRef/issuerRef/schema/status freshness 및 체류 `basis`는 별도 추가 |
| `KPassServiceDecision.status: allowed\|needs_proof\|denied\|expired` | 제안 API의 `outcome: allow\|proof_required\|deny\|expired`로 명시적 mapping. `ageOver19=null`은 추가 proof, `false`는 거절이며 장애/unknown을 false로 바꾸지 않음 |
| `KPassDemoCredential.status: simulated_ready\|expired\|suspended\|revoked`; UI의 review-draft 표시 | 실제 VC/status registry가 아니다. 운영 active/status-unavailable/freshness와 실제 holder 보관 receipt는 adapter에서 별도 검증. demo와 provider 저장 공간/권한을 분리 |
| generic `KPassPresentationBinding` 6필드 + 요청 nonce/시간/소비 여부 | 현재 partner 시연에 resource/venue/quote/amount binding은 없음. 반면 사용자 행동의 `BActionReturnTo` 및 process-only private context는 Table/venue/초안/고정 quote를 보존한다. 이 두 계약을 합쳐 이미 merchant-aware verifier가 있다고 주장하지 않음 |
| `MinimalPartnerReceiptB`: receiptRef, decision/reason, purpose, checkedAt, sharedPredicates와 SIMULATED truth | 과거 receipt와 현재 credential/policy/시간 변화에 따른 stale 판정을 분리. 전체 VC/DOB/credential ID 미공개. 실제 signature/trust/status receipt와 서버 최종 소비는 개발자 작업 |
| `CommercePlaceB` / `CommerceOrderContextB` / `StableCommerceBState.order/orders/fundingCredits` | 27개 sampleOnly registry의 source ID·capability, 주문별 venue/offer/가격·고유 operation/receipt, 공통 입금과 개별 결제/환불을 분리. 실제 지원표·서버 wallet/order/issuance 귀속은 BE-06/07/08/11. 옛 receipt/reload로 샘플 잔액/paid 상태 재생성 금지 |
| `ReservationStateB.history`, `PLACE_SERVICE_RETURN_EVENT_B`, `SHOW_BALANCE_PLACES_EVENT_B` | 장소별 예약 기록과 원 operation 보존, 선택 매장/도시/초점 복귀를 위한 로컬 UX 계약. 서버 예약 확인·결제 승인 권한이 아니며 BE-09 history 조회와 BE-01/07 operation binding을 별도 연결 |

코드 추적: `B/contracts/kpass-capabilities.ts`, `B/identity-b/ktour-id-setup-model-b.ts`, `B/identity-b/action-gate-contract-b.ts`, `B/integration-demo-b/integration-demo-model-b.ts`. 단계명만 비슷하다고 샘플 permission/ack/receipt를 실제 신원·보관·서명 증거로 재사용하지 않는다.

MW 연결점은 `B/commerce-b/place-service-registry-b.ts`, `stable-commerce-model-b.ts`, `id-wallet-commerce-b.tsx`, `B/shared/state/ondo-b-provider.tsx`, `B/reservation-b/reservation-model-b.ts`다. 사용처/공통 잔액/주문/예약 조회의 **앱/BFF 제안 API**와 반례는 [DEPLOYMENT_SPEC §4.3](./DEPLOYMENT_SPEC.md#43-성공-화면-외에-연결해야-할-조회복구-api), [BE 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)에 정의한다. 새 vendor API 확정이나 실제 연동 증거가 아니며 소비자 금액은 KRW, ooKRW는 탭/키보드로 여는 안내/상세에만 둔다.

## 3.1 프런트/provider SDK handoff와 API handoff 분리

| 별도 FE/provider handoff | 현재 상태 / 개발자가 연결할 것 | 대응 API/담당 |
|---|---|---|
| CX·Passport 앱/QR/NFC/liveness handoff와 callback 복귀 | 샘플 화면/상태 완주와 실제 SDK는 별도. 개발 FE는 capability 확인·미설치/권한 거절·백그라운드/복귀·정해진 callback origin과 session 매칭을 연결; 개발 BE가 검증한 결과만 소비 | `FE-CX-PASSPORT`; Mobile/FE + Identity 개발 담당, BE-02/03 · H01–H03 |
| OpenDID holder·VP deep link, 동의·verifier SDK/receipt adapter | 샘플 holder/VP 상태만; release·holder platform 미정. 개발 FE는 실제 holder 연결/동의/수신 ack·status 오류·복귀를 연결하고 개발 BE는 issuer/verifier/status·정책과 1회 소비를 구현 | `FE-OPENDID`; Mobile/FE + DID/Security 개발 담당, BE-04/05 · H05/H06 |
| 카드·Apple Pay·은행/onramp capability와 tokenized return | 샘플 quote/rail만; 실제 device capability·processor 없음 | BE-06/07 · H08/H09 |
| Sui signer SDK·zkLogin session·transaction approval/effects | sample signer/hypothesis만; 실제 signer·tx 없음 | BE-15/16 · H13/H14 |
| 식당 예약 provider UI/확인번호/취소 복귀 | `reservation-b` sample만; 실제 좌석 예약 없음 | BE-09 · H10 |

이 handoff는 BFF/ledger API 구현의 부산물이 아니다. provider SDK, 브라우저/기기 capability, signer 승인, 실제 receipt는 각 adapter에서 별도 검증한다. OpenDID release, payment rail, Sui network/asset/bridge는 `ADR-DID-01`, `ADR-PAYMENT-01`, `ADR-SUI-01`이 미정인 동안 선택하지 않는다.

## 3.2 미확정 ADR 8개

| ADR | owner | 결정 필요 | 영향 |
|---|---|---|---|
| ADR-AUTH-01 | Product + Platform | account provider·cookie·복구/merge | account와 Person proof 분리 전 운영 저장 불가 |
| ADR-DID-01 | Identity + provider liaison | release·schema/type·trust domain·holder | 실제 VP/보관 완료 주장 불가 |
| ADR-AGE-01 | Policy + Identity | cutoff·시간대·AdultVerify semantics | age gate 오판 위험 |
| ADR-RESIDENCE-01 | Identity + Legal/Provider | provider·credential·claims·fallback | passport로 체류허가 추정 금지 |
| ADR-PAYMENT-01 | Commerce + Risk/Finance | rail·processor·asset·FX/fees·custody/limits | sample 자금만 허용 |
| ADR-CHAIN-01 | Chain + Security | network·ABI/compiler·roles·key·finality | 실제 receipt 전 `SIMULATED` |
| ADR-SUI-01 | Sui + Product/Risk | signer·asset/Move·gas·bridge authority | native bridge/peg 선결정 금지 |
| ADR-DATA-01 | Data + Privacy/Product | rights·signal·freshness·TTL | replay를 live로 표시 금지 |

2026-09-09 결정: 사용자 선택 스테이블코인 충전 분기는 USDC/USDT·network·서명·전환 단계를 직접 보여준다. 기존 `REQ-011-A1`의 상세/Labs에만 숨기는 규칙은 이 분기에서 대체하며 일반 가격/잔액의 KRW 중심 UX는 유지한다. **Labs 파일 존재는 Wallet funding 완주의 증거가 아니다.** 기준선 공백과 historical candidate 검수 항목은 [Stablecoin Funding Audit](./STABLECOIN_FUNDING_AUDIT_2026-09-09.md)에 기록했다.

G09-S 실행 증거(역사적 후보): 새 모델19·기존 funding11 = **funding 계약30/30**. 당시 최종 후보의 **전체 계약771/771·로컬/공개 브라우저35/35**와 로그는 [Map/ID/stablecoin release](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md)에 보존한다. 이는 이전 공개 source `3dc392b`의 [Prototype Completion release](./PROTOTYPE_COMPLETION_2026-09-10.md) evidence나 이번 작업본 결과와 합산하지 않으며, 새 checkout/Labs 브라우저 완주 또는 실제 chain/provider 연결 증거로 집계하지 않는다.

## 3. 공급자별 기술·설정·개발 책임

다음 이름은 **새 백엔드를 위한 제안 placeholder**다. 현재 `.env`에 이미 존재하거나 유효하다는 뜻이 아니다. 값은 private configuration/secret manager에서 관리한다. secret을 `NEXT_PUBLIC_*`에 두지 않는다.

| 영역 | placeholder 이름 | backend 책임·확정할 값 | 프런트에 전달 가능한 것 |
|---|---|---|---|
| 공통 실행 | `KTOUR_EXECUTION_MODE`, `KTOUR_PUBLIC_APP_ORIGIN`, `KTOUR_CALLBACK_ORIGINS`, `KTOUR_FIXTURE_VERSION` | demo/provider 분리, 배포·callback allowlist, fixture 배포 버전 | public mode/demo notice, 허용 return URL. private config 값은 제외 |
| 계정/BFF | `AUTH_ISSUER_URL`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `SESSION_SIGNING_KEY_REF` | auth ADR, OIDC/code/state/PKCE, Secure HttpOnly session/CSRF, 키 회전 | 로그인 시작 URL, 최소 계정 프로필 |
| CX | `CX_BASE_URL`, `CX_PROVIDER_POLICY_ID`, `CX_CLIENT_CONFIG_REF`, `CX_CREDENTIAL_SECRET_REF`, `CX_CALLBACK_ORIGIN` | 제공 환경·provider ID/version, 인증 요구와 표준창/직접 API 방식. secret 요구 여부 자체도 vendor 확인 | sessionId, expiry, 허용 handoff/QR, normalized 최소 결과 |
| Passport | `PASSPORT_EKYC_BASE_URL`, `PASSPORT_EKYC_SECRET_REF`, `PASSPORT_EKYC_WEBHOOK_KEY_REF`, `IDENTITY_RETENTION_POLICY_ID` | provider·upload/token·signature·deletion/retention 계약 | 단기 업로드/handoff capability와 결과 상태. 생체·전체 문서는 일반 BFF 응답 제외 |
| OpenDID | `OPENDID_RELEASE_REF`, `OPENDID_TA_URL`, `OPENDID_ISSUER_URL`, `OPENDID_VERIFIER_URL`, `OPENDID_WALLET_URL`, `OPENDID_ISSUER_KEY_REF`, `KPASS_SCHEMA_ID`, `KPASS_POLICY_VERSION` | 공식 release pin, trust membership, key/holder/cert, schema/status. endpoint는 release 문서에서 mapping | credential summary, 최소 presentation 요청, status. issuer private key/VC 원문 제외 |
| 정책 | `AGE_POLICY_ID`, `SERVICE_POLICY_VERSION`, `PAYMENT_LIMIT_POLICY_ID`, `CREDENTIAL_STATUS_MAX_AGE_MS` | age 기준·service entitlement·limit·risk·증거 신선도, 서버 최종평가 | 결정 및 이해 가능한 이유·다음 행동 |
| 결제/충전 | `PAYMENT_PROVIDER_BASE_URL`, `PAYMENT_SECRET_REF`, `PAYMENT_WEBHOOK_KEY_REF`, `FUNDING_RAIL_CONFIG_REF`, `FX_RATE_SOURCE_ID` | 선택 processor·rail 지원표, 통화/수수료, signed callback, ledger, reconcile | tokenized handoff, quote, operation status/receipt. 카드 원문 제외 |
| Apple Pay 후보 | `APPLE_PAY_MERCHANT_ID`, `APPLE_PAY_CERT_SECRET_REF`, `APPLE_PAY_ALLOWED_DOMAINS` | 선택 processor 방식/merchant validation·도메인 등록·테스트 지원 확인. 모든 processor가 같은 credential을 요구한다고 가정 금지 | 기기 capability와 결제 session. 인증서 private key 제외 |
| Commerce DB | `DATABASE_URL`, `QUEUE_URL`, `PRIVATE_UPLOAD_BUCKET`, `DATA_ENCRYPTION_KEY_REF` | durable transaction·idempotency·outbox·정산/보상, upload scan·TTL | 공개 DTO, 승인된 short-lived upload URL |
| OmniOne Chain | `OMNIONE_CHAIN_ID`, `OMNIONE_RPC_URL`, `OMNIONE_API_BASE_URL`, `OMNIONE_API_KEY_REF`, `OMNIONE_SIGNER_KEY_REF`, `OMNIONE_CONTRACT_ADDRESS`, `OMNIONE_ABI_REF`, `OMNIONE_FINALITY_POLICY_ID` | 공식 팀 환경, contract 배포/ABI·signer roles·nonce·receipt·finality, RPC/API 실제 규격 | 검증된 chain label, 공개 contract/tx receipt 링크. signer/API secret 제외 |
| Sui | `SUI_NETWORK`, `SUI_RPC_URL`, `SUI_OIDC_CLIENT_ID`, `SUI_SALT_SERVICE_URL`, `SUI_PROVER_URL`, `SUI_SPONSOR_KEY_REF`, `SUI_MOVE_PACKAGE_ID`, `SUI_ALLOWED_MOVE_TARGETS`, `SUI_MAX_GAS_BUDGET` | 선택 network·SDK 버전·OIDC·salt backup/proof, gas rate/target allowlist, Move package, tx effects | public network/nonce/ephemeral session context·서명할 intent·receipt. salt/JWT/secret 로그 금지 |
| 파트너 운영 | `PARTNER_AUTH_ISSUER`, `PARTNER_ALLOWED_ROLES`, `SETTLEMENT_POLICY_ID`, `AUDIT_RETENTION_POLICY_ID` | tenant/device/RBAC, 정산 승인·지급·분쟁·감사 | 해당 조직 범위의 최소 verifier/settlement 정보 |

CX의 `trans → QR/App request → result → token parsing` 순서는 기존 제공 매뉴얼 검토 기록에 있다. production mapping은 공급자가 제공한 최신 schema와 대조한다. 과거 문서 샘플의 `console.log`에 신분증 결과를 출력하는 코드는 가져오지 않는다. [기존 v2.1 연동 계약 §8](./DEVELOPMENT_SPEC_v2.1_SOURCE_2026-08-11.md#8-공급자-연동-계약), [CX 실측·문서 불일치 기록](./ZKP_CAPABILITY_VERIFICATION_2026-08-17.md#3-omnione-cx-검증).

## 4. 반드시 보존할 기술상 경계

| 혼동하기 쉬운 것 | 인계 기준 |
|---|---|
| CX 세션 생성 성공 = 신원/연령 proof 성공 | 아님. 실제 Holder 응답과 결과 semantics·요청 일치를 검증 |
| Passport KYC = 체류허가 확인 | 아님. 여행 서비스 기간과 법적 체류자격 근거를 구분 |
| VP 동의 = verifier 승인 | 아님. 검증·status·policy가 끝나야 해당 서비스 proof로 소비 |
| selective disclosure = ZKP | 아님. 일반 VP/부분공개/CL predicate를 따로 선택·명세 |
| Age proof = Person/Payment KYC | 아님. 각각 독립된 service gate |
| zkLogin = DID KYC | 아님. OAuth 기반 Sui 서명 수단; 신원·연령은 별도 evidence |
| Sui source tx 성공 = OmniOne 도착 | 아님. finality·authority·receipt를 각각 검증 |
| Chain confirmed = 결제/정산 지급 완료 | 아님. ledger/provider 업무 결과와 증거 anchoring 분리 |
| 암호화/단순 hash = 비식별 | 아님. 저엔트로피 신원값·연결 가능한 reference도 개인정보 위험 |
| 온도 애니메이션 = 실제 실시간 수집 | 아님. 결정적 replay는 샘플로 구분, 실제 source freshness 표시 |

OpenDID 공식 architecture는 trust environment와 issuer/verifier/wallet·모바일 SDK를 구분한다. 사용할 서버 release와 holder handoff를 실제 환경에 맞춰 고정한다. [공식 architecture](https://github.com/OmniOneID/did-doc-architecture), [release v2 구성](https://github.com/OmniOneID/did-release/tree/develop/release-V2.0.0.0).

Sui zkLogin은 ephemeral key/OAuth·salt·proof·maxEpoch 흐름이며, signer 세션 만료와 신원자격 만료는 다른 상태다. [공식 zkLogin 문서](https://docs.sui.io/sui-stack/zklogin-integration). Gas sponsor를 쓰면 동일 transaction data에 대한 사용자/sponsor 서명과 허용 target·budget 통제가 필요하다. [공식 gas sponsorship 문서](https://docs.sui.io/develop/transaction-payment/sponsor-txn).

## 5. 기존 19개 REQ의 보존 매핑

이 표는 범위 추적이다. 기존 9시간 PRD의 목표 등급을 현재 완료 등급으로 복사하지 않는다.

| REQ | 보존할 기능 | v3 flow / 연동 작업 |
|---|---|---|
| REQ-001 | 국내 CX Mobile ID | G05 / H01 |
| REQ-002 | Residence 지원/미지원/대체 | G05 / H02 |
| REQ-003 | Passport·첫 현장 미션 | G05/G08/G12 / H03/H15 |
| REQ-004 | OpenDID·canonical evidence·EAS adapter 경계 | G05/G06/G11 / H05/H06/H11. EAS 실제 연결은 채택 근거 없이 추가하지 않되 기존 adapter 요구의 상태를 남김 |
| REQ-005 | Account/KYC 분리·Sui signer | G04/G05/G07/G09/G12 / H04/H07/H13 |
| REQ-006 | USDC/USDT·OOKRW·전환 후보 | G09/G10/G12 / H08/H09/H14. AMM 별도 제품/유동성 요구는 현재 승인되지 않음 |
| REQ-007 | 식음료 ONDO 신호 | G01/G03/G08 / H16 |
| REQ-008 | 장소 기반 Table·대화·공개 프로필 | G04/G08 / H10 |
| REQ-009 | Local Signal 사진 | G08/G12 / H10/H15 |
| REQ-010 | chat 이미지 | G08 / H10 |
| REQ-011 | 지갑·가격·Payment KYC | G09/G10 / H08/H09 |
| REQ-012 | After19·최소 연령증명·auto guard | G07 / H07 |
| REQ-013 | 장소의 방문 전 정보 | G03 / H16; 별도 정보 과잉 탭으로 복원 금지 |
| REQ-014 | 상점 trait/offer policy·계약 receipt | G03/G06/G11 / H06/H11 |
| REQ-015 | 분리된 활동 평판 | G04/G08/G12 / H15 |
| REQ-016 | unique visit 10회·opt-in badge | G12 / H15 |
| REQ-017 | 전국 shell·도시 데이터 범위 | G01/G03 / H16; 서울·부산·제주 조작 통일, 데이터 밀도는 별도 |
| REQ-018 | 모바일 web | G01–G13 / 전체 mobile QA |
| REQ-019 | 온도/Hot 시각화 | G01/G03 / H16; 얕은 2.5D·dynamic signal 우선 |

기존 개발 명세의 `F-080 가맹점 verifier`, `F-081 정산`, `F-100 실행 증거`는 G06/G11로 옮겨 추적한다. 화면 통합이 기능 폐기를 뜻하지 않는다.

## 6. Adversarial 검수 목록

각 항목은 frontend sample mode와 실제 provider mode를 분리해 기록한다. 현재 이 표는 **검수 요구이며 이번 turn의 PASS 기록이 아니다**.

| 검사 | 반례·기대 결과 | 책임 |
|---|---|---|
| A01 최소 허들 | Guest로 지도·검색·상세·길찾기, KYC 없음 | FE + 제품 QA |
| A02 독립 권한 | Account만/Person만/Age만/Payment KYC만 바꿔 다른 축 자동 해제 0건 | FE + Policy |
| A03 자격 정책 | 동일 Table/offer에 proof 없음·false·기간만료·한도초과·철회 fixture | Policy + DID |
| A04 요청 binding | generic partner mock은 nonce/audience/domain/purpose/claims/credential/policy·TTL/재생을 검수. action-gate는 별도 Table/venue/고정 quote context를 검수. 실제 merchant verifier는 venue/offer/quote/amount/currency·predicate/restriction까지 각각 변경해 거절 입증 | DID + 보안 reviewer |
| A05 UI→실행 일치 | 동의 화면의 요청 digest/금액과 실제 operation payload 비교 | FE + BFF |
| A06 callback 공격 | duplicate/out-of-order/위조/잘못된 state·timestamp | Integration + 보안 |
| A07 재진입 | 모바일 외부 앱 취소·백그라운드·새로고침·한 번 더 누름 | FE + Integration |
| A08 credential 상태 | expired/suspended/revoked/status unavailable를 각각 주입 | DID + Policy |
| A09 funding | 선택 rail의 unsupported/cancel/pending/unknown/실패·중복 credit. USDC/USDT·network·amountAtomic 변경, source confirmed/destination pending, destination receipt 중복/변조, 중단 후 동일 작업 조회; funding 이후 Payment KYC 불변 | Commerce + Sui + Policy |
| A10 결제/환불 | quote 만료·한도·잔액·혜택 경쟁 사용·결제 성공/주문 실패·부분환불 | Commerce + QA |
| A11 partner | 타 조직 request/receipt·비등록 device·권한 없는 retry 접근 | Partner backend + 보안 |
| A12 chain | RPC down/submit 후 timeout/retry·duplicate redemption·payload mismatch | Chain + QA |
| A13 Sui | epoch expiry/prover fail/wrong network/변경된 tx intent/sponsor budget 초과 | Sui + 보안 |
| A14 성과 | payment만으로 stamp 증가 0, 같은 visit/mint 재실행 0 | Activity + Chain |
| A15 진실성 | demo token/state를 실제 API에 제출해 거절; 실제 효과 없는 샘플이 LIVE/TESTNET으로 표시되지 않음 | 모든 adapter |
| A16 모바일 | 320/360/390/430px·짧은 높이·키보드·KO/EN/JA·theme×After19·하단 CTA/focus | FE + 독립 visual reviewer |

과거 ZKP 기록의 `verifyProof` 정책 binding 반례는 A04에 반드시 포함한다. 단, 과거 특정 SDK 직접 호출 관찰을 현 vendor 전체 서비스 취약성으로 단정하지 않는다. 팀이 채택한 release/실제 verifier에서 다시 확인한다.

## 7. 제출·인계 패키지에 묶을 증거

| 구분 | 반드시 남길 파일/정보 | 현재 판정 |
|---|---|---|
| 목업 릴리스 | source commit, standalone build ID, 공유 URL, fixture version·진입방법 | **브랜딩 전용 source/runtime `cc3d7c3`:** [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)의 주소·최종 배포·검사 범위를 따른다. 마지막 기능 흐름 검수 `e2ad7c4`의 계약833/833·After 19 로컬5/5·운영5/5는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)의 역사적 결과이며 새 source에서 재실행한 것으로 합산하지 않는다. |
| 플로우 목록 | G01–G13 × 기존 REQ/FL × mock source × test ID × 상태 | 본 문서/Deployment Spec에 대응 계약이 있고 [전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)에 G별 브라우저 범위·상태가 있다 |
| DID 효과 시연 | 신원 경로 3개, 체류/연령/혜택/한도별 allow·proof_required·deny·expired 영상 | 공개 기준선의 identity 52개에 세 신원 경로·8개 자격·서비스별 허용/거절·복구 PASS 증거가 있다. 최초 실패/재실행과 해당 URL은 [전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)를 따른다. 실제 provider 증거 및 제출용 영상 녹화는 별도 후속 작업 |
| API handoff | OpenAPI/schema, 상태전이, callback mapping, error/recovery, DB migration | 본 문서는 요구 계약. 실제 machine-readable schema/backend 구현 필요 |
| 외부 실증 | redacted CX/eKYC/OpenDID receipt, contract ABI/address·tx evidence, Sui effects | 현재 앱의 실제 연결 증거 없음. 과거 로컬 실험은 별도 |
| 운영 | env manifest(값 제외), key custody/RBAC, idempotency/outbox/DLQ/reconcile, reset/rollback | backend 구현 및 runbook 필요 |
| 검수 | 계약/브라우저 명령·실행 결과, viewport 캡처, 반례 review | **브랜딩 전용 `cc3d7c3`:** 이번 로컬 검수는 관련 계약44/44·typecheck·production build/scan·HTTP probe(공개 자산41개)·mobile/desktop 브랜드 E2E6/6(workers1/retries0) PASS다. 최종 운영 검수는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. **마지막 기능 흐름 검수 `e2ad7c4`:** 계약833/833·After 19 로컬5/5·운영5/5 PASS는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md) 참조. **이전 `82ea4c9`:** 공개 mobile12/desktop·tablet2·HTTP·계약826 PASS는 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)에 보존. 이전 `52f376e` HTTP10/mobile6 및 9월 11일 기준선174/영향27은 [이전 운영 기록](./PRODUCTION_RELEASE_2026-09-12.md)·[전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)의 별도 증거. 실제 iPhone Safari/Android·provider 검수나 전체 여정 재실행이 아님 |

우선순위는 H04의 자격→서비스 연결과 H01/H05/H06을 이어 DID 서비스 가치를 입증하고, H08/H09/H11/H12의 금전·혜택·정산·증거를 같은 operation으로 연결하는 것이다. Sui는 그 업무와 충돌하지 않는 독립 signer/transaction 경계로 구현한다. 성과는 완료율 대신 이 표의 재현 가능한 증거로 판단한다.
