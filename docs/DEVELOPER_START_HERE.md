# K-Tour ID 개발자 시작 문서 — 목업을 실제 서비스에 연결하기

**현재 앱·소스:** 대표 주소는 [K-Tour ID](https://ktour-id.vercel.app), 기준 소스는 [`main`](https://github.com/woogieboogie-jl/k-tour-id/tree/main), Harvey 시작 브랜치는 [`handoff/harvey-20260914`](https://github.com/woogieboogie-jl/k-tour-id/tree/handoff/harvey-20260914)다. 현재 배포·검수 SHA와 두 브랜치 동기화는 [배포·인계 기록](./KTOUR_PRODUCTION_HANDOFF_2026-09-15.md), 9/15 여정 수정과 그 상태는 [UX 릴리스](./ux-refinement/2026-09-15/RELEASE.md)를 따른다. 아래 과거 source·검수 기록과 구분하며 Sumsub 실험은 별도다. CX·OpenDID·OmniOne Chain·Sui 필수 구현 범위는 유지한다.

**최신 UX 운영 배포:** 앱 source `8fcbeb1`을 main/Harvey에 함께 반영했다. [9/16 후속 기록](./ux-refinement/2026-09-15/round-20260916.md)에서 매장 행동·충전 맥락·체험 holder 준비 단축·실제 사진의 검수/배포를 확인한다. 목업 상태·함수와 실제 구현 매핑은 [체험 인계](./EXPERIENCE_MOCK_HANDOFF_2026-09-15.md)를 따른다. 기존 `5712aed` 체험·한국 여행 OG는 [이전 릴리스](./KTOUR_EXPERIENCE_RELEASE_2026-09-15.md)로 보존하며, 외부 네 기술의 실제 연동 완료는 아니다.

**9/21 제출 작업은 [해커톤 연동 개발 요약](./HARVEY_HACKATHON_HANDOFF_2026-09-14.md)부터 확인한다.** CX·OpenDID·OmniOne Chain·Sui 네 기술 모두 팀 필수다. 같은 비금전 혜택 여정에 실제 Move·zkLogin/PTB·사용자가 제한적으로 위임한 AI 실행을 연결한다. [Sui 필수 통합 추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md)의 범위·실행 순서가 기존 단일안과 아래 전체 제품 목록보다 우선한다. 실제 금융·예약·bridge·여권/체류증 연동은 목업으로 유지한다.

**[단일 통합 개발안](./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md)은 공통 CX/OpenDID·서버 계약의 상세 참고다.** Sui 담당·환경·가용 시간을 추가 확인해 일정을 확정한다. 네 기술과 AI 실행을 기존 1주 일정에 그대로 완료할 수 있다고 가정하지 않으며, 프로그램 등록·별도 제출 자격·추가 상금 적용 조건도 확인한다. 아래는 전체 제품 인계로, 금융·예약 등 전체 목록이 이번 주 필수라는 뜻은 아니다.

기준: **기존 2026-09-14 운영 source/runtime `cc3d7c3` · [원 인계 snapshot `9d4aec9`](https://github.com/woogieboogie-jl/k-tour-id/tree/9d4aec9)**. [운영 앱](https://ondo-tau.vercel.app)과 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 확인한다. 당시 변경은 공유 카드·아이콘뿐이며 해당 기록의 Ready·검수 수치를 이번 릴리스로 이월하지 않는다. 과거 배포 commit ID는 이력 참고값이며 현재 시작점은 위 Harvey 브랜치다.

이전 운영 source `d9eda4f`의 [지도 우선 진입 릴리스](./MAP_FIRST_ENTRY_2026-09-14.md)와 `82ea4c9`의 [지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)는 역사적 배포·검수 기록으로 별도 보존한다. 현재 앱의 기준으로 혼용하지 않는다.

목표는 새 화면을 처음부터 만드는 것이 아니라 **지금 클릭되는 목업의 성공·거절·대기·복구를 실제 응답에 연결하는 것**이다. 실제 SDK/provider/서버 연결은 개발자 작업이다. 그 연결이 아직 없다는 이유만으로 목업을 미완료로 보지 않으며, 반대로 샘플 성공을 실제 연동 증거로 쓰지 않는다.

## 1. 처음에는 이것만 읽기

1. 이 문서에서 담당 플로우와 **BE 작업 ID**를 고른다.
2. [Backend 인계 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)에서 구현 단위·수락 증거를 티켓으로 나눈다.
3. [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md) §3–8에서 API·상태·보안·금전 계약을 읽고 OpenAPI/DB/adapter를 구현한다.
4. [해커톤 기술 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md)에서 기술별 환경과 제출 증거를 확인한다.

9월 12일 지도↔공통 잔액 연결과 해당 배포의 실행 증거는 [매장 중심 여정 MW-01–05](./MAP_WALLET_JOURNEYS_2026-09-12.md)를 함께 읽는다. 이전 배포 기록의 검증 범위를 새 release에 이월하지 않는다.

**위 세 문서가 현행 인계 정본이다.** `DEVELOPMENT_SPEC.md`, 예전 traceability·Sui 브리프·실행팩은 배경/역사적 요구 자료다. 옛 독립 route나 과거 Sui 프로그램 조건을 현재 앱의 완료/필수 조건으로 그대로 이식하지 않는다. 범위 충돌은 DEPLOYMENT_SPEC §1.1을 따른다.

실제 앱은 `handoff/harvey-20260914`를 clone한 저장소의 `k-tour-id-app/`이다. [README 실행 안내](../README.md#run-the-handoff)를 따른다. `main`과 인계 브랜치는 앱 검수 기준 `505e475`에서 같은 소스로 확인했다. 이후 결과 문서·테스트만 바꾼 커밋도 두 브랜치에 동일 반영하며 앱 코드 검수 기준과 구분한다. 예전 로컬 checkout과 새 문서를 혼용하지 않는다.

## 2. 실행 화면과 구현 상태

- 공개 진입은 **`/` 한 곳**이다. `/ondo-b`는 redirect, 현재 장소 데이터 HTTP API는 `/api/ondo/venues/[venueId]`다.
- 지도/추천의 선택 매장과 지도 잔액 진입, ID/Wallet, Tables, My Korea, Settings, Demo의 sheet·탭이 플로우 진입점이다. 매장에서는 혜택·결제·Table·예약으로 이어지고 길찾기/저장은 보조 행동이다. `/pass`, `/wallet`, `/present`, `/partner/verify`, `/partner/settlements`, `/evidence`를 새 API나 현재 공개 페이지로 가정하지 않는다.
- 기본 데모에서 샘플 상황을 선택할 수 있다. `review=0`은 실제 미연결 경계를 확인하는 경로이며, provider 실패를 샘플 성공으로 자동 대체하지 않는다.
- 준비된 K-Pass 자격 선택기는 **테스트 fixture 주입**이다. 별도의 K-Tour ID setup walkthrough는 provider 동의/복귀/holder 보관을 시연한다. walkthrough의 `review-draft`가 실제 Person/Age/Payment 자격 발급을 의미하지 않는다.
- **기존 운영 브랜딩 기준선:** source/runtime `cc3d7c3`, [운영 앱](https://ondo-tau.vercel.app). 브랜딩 전용 production Ready이며 최종 deployment `dpl_Bf4rBwnqH5PpaHeMRW6NmM8y3Wk1`의 고유 주소·검수 범위는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. 이번 로컬 검수는 관련 계약44/44·typecheck·production build/scan·HTTP probe(공개 자산41개)·mobile/desktop 브랜드 E2E6/6(workers1/retries0) PASS다. 최종 고유 배포의 HTTP probe 및 mobile/desktop 브랜드4/4(7.4초, workers1/retries0) PASS. 별칭별 추가 확인 범위는 릴리스 기록을 따르며, 전체 여정 재검수나 실제 provider/실기기 검수로 확대하지 않는다. [아트워크·생성 프롬프트](../k-tour-id-app/docs/branding/KTOUR_SOCIAL_REFRESH_2026-09-14.md)를 별도로 보존한다.
- **기능 검수 이력:** 마지막 기능 흐름 검수 기준은 이전 `e2ad7c4`다. 당시 전체 계약833/833·After 19 공개 경로 로컬5/5 및 운영5/5 PASS(운영2.0분, workers1/retries0; project mismatch skip5개 제외)는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)의 역사적 증거이며 `cc3d7c3`에서 재실행한 결과가 아니다. 이전 `82ea4c9`의 공개 mobile12개/desktop·tablet2개·계약826개는 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md), [9월 11일 검수](./FINAL_JOURNEY_QA_2026-09-11.md)도 각각의 실행 범위만 따른다.

### 플로우 → 개발 작업

아래의 “목업 결과”는 source/model과 공개 진입 경로의 대응표다. 개별 브라우저 검증 범위는 위 기록을 따른다. **API는 모두 앱/BFF 구현 제안이며, 이미 배포된 endpoint나 공급자 공식 API명이 아니다.** 상세 source/fixture/test는 DEPLOYMENT_SPEC Appendix A에 있다.

| 플로우 | 목업에서 확인할 동작 | 개발자가 연결할 것 | 작업 ID |
|---|---|---|---|
| G01 지도·온도 | 빈 저장소→전국 지도→선택 도시 온도 지도. 질문·자동 매장 preview 없음. 지도 잔액/사용처·검색/목록·시간 replay 유지 | 장소 검색/페이지네이션·실제 사용처 capability·신호 freshness, 타일 장애 분리. 탐색에 onboarding 완료·신원 강제 금지 | BE-11, BE-06 |
| G02 여행 맥락 | 지도 옵션/설정에서 선택형 취향 편집·명시적 지도 설정. 완료만 저장, 취소/닫기/건너뛰기는 기존 NEW/COMPLETE·persona·도시·취향 보존. legacy IN-PROGRESS reload도 지도 | preference 저장/version 충돌, 동의 범위 내 추천 입력. 취향으로 DID 자격 생성 금지 | BE-11, BE-12 |
| G03 장소·분위기 기여 | 선택 매장→혜택/결제·예약·연결된 Table→같은 지도/매장 복귀, 방문 전 정보·음식·보조 길찾기. 장소 태그/메모·사진 preview→필요 gate→로컬 결과·중복/실패 | canonical/editorial/research 출처 ID·상세/권리·갱신, merchant capability와 listing 분리, 검증된 신호 수집/중복 방지. 메모/사진은 임시 draft이며 실제 게시/업로드 아님 | BE-11, BE-10, BE-07, BE-09 |
| G04 계정·My Korea | 필요한 때 계정 gate→저장/취소→같은 장소, 프로필 | auth session/callback, 저장 sync·중복·충돌·계정 경계 | BE-01, BE-12 |
| G05 신원·K-Pass | Mobile ID / Residence / Passport, 동의·실패·수동검토·발급/보관·갱신/복구 | CX/eKYC adapter → 최소 evidence → TrustProfile → OpenDID issuer/holder/status. schema/release 확정 | BE-02, BE-03, BE-04 |
| G06 VP·파트너 | Demo→파트너 검증, 기기/QR/앱 handoff→목적·항목 동의→최소 결과 | partner/device 인증, 요청 신뢰, 실제 VP/proof/status, nonce/audience/policy 및 **서비스 action의 매장·quote 바인딩** | BE-05 |
| G07 연령 제한 | After 19 탐색과 서비스 연령 gate 구분; 증거 없음/미달/만료 | 최소 age predicate와 cutoff/timezone 정책. 모드 토글로 age proof 제공 금지 | BE-05 |
| G08 Tables·안전 | 식사 계획·참여/나가기·대화/사진·피드백·신고/차단 | 모임 정원·membership, realtime/chat authz, upload 검사, moderation·접수 상태 | BE-10 |
| G08-R 매장 예약 | 선택 매장/연결된 Table 또는 Demo→별도 매장 예약→시간/인원→확정/만석/unknown→취소·같은 매장. 장소별 기록 재선택 | ReservationAdapter의 매장 지원표·재고·slot quote·멱등 예약·장소별 이력 조회·취소. local meal plan과 다른 원장 | BE-09 |
| G09 Wallet·일반 충전 | 지도 잔액/ID Wallet 또는 결제 부족액→은행/카드/Apple Pay→견적/승인→대기/영수증/복구→원 quote 또는 사용처 지도 | 공통 balance/held/available·revision, 기기·사용자 지원표, funding KYC, provider UI/token handoff, FX/fee quote, double-entry credit. 충전 후 자동 결제 금지 | BE-06, BE-07 |
| G09-S 스테이블코인 충전 | USDC/USDT→signer 연결 동의/복귀→고정 견적→source→destination→credit | network/coinType/representation/atomic amount, Sui signer, 승인된 routing/수탁·상환 주체, 양쪽 receipt와 1회 credit | BE-06, BE-15, BE-16 |
| G10 결제·혜택·환불 | 매장별 혜택 수락/거절→필요 자격→별도 결제 동의→승인/매입→고유 주문 영수증→같은 매장. 내역의 원 주문 부분/전액환불 후 공통 잔액으로 다른 사용처 탐색 | venue/offer/quote/금액·고유 order/operation/receipt 바인딩, 공통 원장과 개별 주문·환불/혜택 대사. 현재 추천은 local rule이며 모델 채택 시 별도 ranking adapter, 추천 자체로 결제/자격 결정 금지 | BE-07, BE-08, BE-11 |
| G11 정산·체인·문의 | Demo→정산/이벤트, 실제 발생한 샘플 업무 기록, 문의 검토/접수/이력/새 문의 | partner RBAC·정산/지급, durable outbox/worker/receipt, immutable ticket snapshot/이력/export | BE-13, BE-14 |
| G12 Sui·방문·badge | My Korea→Labs, 방문 이력9→고유 방문10→별도 opt-in badge, signer 실패 복구 | 방문 증거/중복 방지, Sui SDK/Move/권한·gas·effects, claim 상태 조회. Labs bridge fixture는 읽기 전용 | BE-15, BE-16 |
| G13 설정·계정 작업 | theme/언어/After 19 독립, 로컬 reset, 별도 sample export/logout/delete | preference sync, session revoke, export/deletion job·보존 정책·조회. local reset과 서버 자격/잔액 삭제 분리 | BE-01, BE-12 |

## 3. DID 해커톤에서 우선 연결할 것

9/15 추가한 비금전 골목 가이드의 화면·상태·연결 함수는 [체험 목업 인계](./EXPERIENCE_MOCK_HANDOFF_2026-09-15.md)에서 바로 찾는다. 이 체험은 현재 Person 확인만 요청하며, 국적/체류/성인/결제 자격이나 매장 할인권을 만들지 않는다. 실제 연동과 검수 범위는 아래 네 기술의 증거로 판단한다.

공식 과제 구분은 [매트릭스 §1의 원문 근거](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md)를 따른다. 아래는 **프로젝트에서 개발할 범위**이며 목업만으로 공식 기술활용 인정이 완료됐다는 뜻이 아니다.

| 기술 | 이번 서비스에서 맡는 일 | 구분 / 개발 완료 증거 |
|---|---|---|
| **OmniOne CX** | Mobile ID와 지원되는 Residence 결과를 IdentityEvidence로 정규화 | 모바일 신분증은 공식 필수 축, CX는 프로젝트가 채택한 경로. 실제 테스트 Holder 결과·검증·취소/만료/replay 거절 — BE-02 |
| **OpenDID** | K-Pass VC 발급→holder 보관→최소 VP→verifier/status→서비스 allow/deny | 공식 선택과제이지만 **프로젝트 범위에 포함**. issue/holder ack/VP/status와 같은 행동의 허용·거절 증거 — BE-04/05 |
| **OmniOne Chain** | 비식별 업무 event 기록·receipt, 최소 1개 계약 불변식 | 공식 선택과제이지만 **프로젝트 범위에 포함**. 실제 tx/receipt와 중복 redemption 등 거절 테스트 — BE-13 |
| **Sui** | 해커톤: 사용자 범위 승인→zkLogin/PTB 위임→Agent의 Move 1회 실행·provenance. 금융/방문 badge는 별도 전체 제품 범위 | **팀 필수**. 실제 grant/consume·effects·제한 위반 거절, 같은 intent의 서비스 확정과 구분 — BE-15. 실제 bridge는 이번 최소 연동에서 제외 |

네 기술을 포함하는 첫 수직 슬라이스:

```text
Mobile ID 승인 → CX 결과 검증 → 최소 evidence / TrustProfile
 → OpenDID 발급 + holder ack → 같은 서비스의 VP / 서버 정책
 → 허용된 체험 제안 → 사용자 범위 승인 → zkLogin/PTB → Agent/Move 1회 실행
 → 서버 현재 자격 재확인 → DB 체험 사용 → 발생한 업무만 OmniOne outbox / receipt
```

만료·철회·취소·중복·unknown·사용 후 감사 기록 지연은 같은 여정에서 검수한다. Passport/Residence·실제 commerce는 이번 최소 범위 밖이다. Sui signer 연결은 DID 신원확인이나 결제 KYC의 대체재가 아니다.

## 4. 구현 순서와 책임

| 순서 | 병렬 가능한 작업 | 먼저 확정 / 산출물 |
|---|---|---|
| 0 | Tech lead + provider 담당 | DEPLOYMENT_SPEC §9의 8개 ADR owner 배정, SDK release/환경/holder/정책/rail/network 확정. 실제 값·키는 비공개 관리 |
| 1 | BE-01 공통 + Identity팀 BE-02–05 | auth/tenant, operation·멱등성·replay 저장소, OpenAPI/DTO·오류 mapping; 위 DID 수직 슬라이스 |
| 2 | Chain팀 BE-13, Data/Social팀 BE-09–12, Commerce팀 BE-06–08/14 | outbox+검증 receipt / 예약·모임·계정 / 금전 원장과 대사. identity decision은 공통 계약으로 소비 |
| 3 | Sui팀 BE-15/16 + Commerce팀 BE-06 | signer·승인 intent·source/destination·credit 연결, opt-in badge 별도. 공식 경로 미확보 시 운영 전송은 닫고 샘플만 유지 |
| 4 | FE통합 + QA + 보안 reviewer | 아래 반례·같은 operation 복귀·모바일 provider handoff 확인, 배포 설정·migration·rollback·redacted evidence 묶음 |

**“백엔드만 붙이면 끝”에서 빠지기 쉬운 FE 연결 작업도 개발 티켓이다.**
기존 UI는 재사용하되 CX 앱/QR, Passport capture/NFC/liveness, OpenDID holder, 카드/Apple Pay, Sui 승인창의 **실제 SDK·capability·복귀 adapter**는 별도로 연결해야 한다. API 구현만으로 브라우저가 네이티브 SDK 기능을 갖게 되지 않는다. FE/BE 경계표는 DEPLOYMENT_SPEC §4.2에 있다.

### 파일을 열면 어디부터 바꿀까?

`B/` = `k-tour-id-app/features/ondo/`. 실 provider 응답을 fixture 타입으로 강제 캐스팅하지 말고 경계 adapter에서 검증·변환한다.

| 시작 파일 | 연결 책임 |
|---|---|
| `B/contracts/kpass-capabilities.ts` | 현재 sample claims/decision → 서버 정규화 claim·정책 결과. 브라우저 evaluator는 운영 권한 판정기가 아님 |
| `B/identity-b/ktour-id-setup-b.tsx`, `B/identity-b/identity-handoff-step-b.tsx`, `B/identity-b/identity-holder-step-b.tsx` | method/session/동의/return/holder ack·status adapter |
| `B/identity-b/action-gate-contract-b.ts`, `B/identity-b/action-gate-coordinator-b.tsx` | 원 action의 private context·TTL·one-shot 복귀를 서버 request/quote 바인딩으로 연결 |
| `B/commerce-b/place-service-registry-b.ts`, `B/shared/state/ondo-b-provider.tsx` | 27개 체험 사용처(조사 장소24+Table 연결 장소3)의 source ID·originKind·offer/table/reservation capability와 같은 장소 복귀. 실제 merchant 지원표/상태로 교체하며 조사 listing을 제휴로 승격하지 않음 |
| `B/commerce-b/funding-rail-model-b.ts`, `B/commerce-b/stablecoin-funding-b.tsx`, `B/commerce-b/stable-commerce-model-b.ts`, `B/commerce-b/id-wallet-commerce-b.tsx` | mount 세션의 공통 funding credit·주문별 원장/환불을 서버 wallet/order로 연결. `PREPARE_QUOTE`는 부족액 충전 전 quote 보존일 뿐 결제 승인이 아님. 충전 복귀 후 별도 동의, sample 고정 환율/자산 ID·옛 receipt 잔액 복원 금지 |
| `B/integration-demo-b/integration-demo-model-b.ts` | partner 결과/정산/event/support 상태를 tenant별 API·worker·ticket 저장소로 연결 |
| `B/reservation-b/reservation-b.tsx`, `B/reservation-b/reservation-model-b.ts`, `B/connect/tables-entry-b.tsx` | 장소별 예약 기록·operation/confirmation 조회와 식당 provider를 연결. 모임 membership/chat은 별도 API, 일반 예약에 불필요한 Person/Age/결제 gate 추가 금지 |
| `B/labs/labs-entry.tsx`, `B/labs/labs-review-truth-b.ts` | 시연 fixture와 실제 signer/Move receipt를 분리. Labs 결과로 Wallet credit 생성 금지 |
| `B/settings/account-services-sample-b.tsx` | export/revoke/delete 샘플 job을 실제 계정 작업과 안전하게 연결 |

## 5. 각 개발 티켓의 완료 조건

각 BE 티켓은 아래 **6개 산출물**을 함께 낸다. UI에서 성공 한 번 보였다는 사실만으로 닫지 않는다.

1. **계약:** OpenAPI·DTO/enum·error code·버전, 현재 UI 상태와의 mapping.
2. **권한/데이터:** session·tenant/subject·동의·PII 최소화, DB migration·retention, key/secret 위치.
3. **operation:** 서버 operationId·request digest·멱등 키, webhook signature·replay/중복 차단.
4. **복구:** pending/unknown 조회, 취소 가능 시점, 실패/재시도·새로고침/재진입·보상/대사. **조회 endpoint도 구현**한다 — DEPLOYMENT_SPEC §4.3.
5. **FE adapter:** 실제 provider handoff, consent·금액/목적 표시, same-action return, KO/EN/JA·mobile 상태.
6. **증거:** 채택 provider의 redacted sandbox/live receipt 또는 chain effects, 정상+아래 반례, 실행 commit/config·rollback 기록.

공통 서버 envelope/멱등성/개인정보 계약은 DEPLOYMENT_SPEC §5다. 세션/도메인마다 같은 규칙을 다시 설계하지 않는다.

### 연결 후 반드시 통과할 반례

| 행동 | 기대 결과 |
|---|---|
| 미로그인 지도/검색/일반 길찾기 | 열린 상태 유지. 신원 provider 장애로 탐색 차단 금지 |
| 제한 Table: Person 있음, Age 없음 / false / 만료 | 필요한 age만 요청 / 거절 / 갱신. After 19 토글·지갑 연결로 통과 금지 |
| 동일 VP를 다른 매장·금액·purpose·nonce로 재사용 | 거절 또는 새 요청·재동의. generic Demo 검증만으로 이 action binding을 통과했다고 판단 금지 |
| 발급 성공 뒤 holder 저장 실패·중복 callback·닫기 | 발급 1회·저장 재시도·원 맥락 복귀. 복구가 나이/체류/사용액/혜택을 리셋하지 않음 |
| 예약 request/cancel 또는 결제 제출 후 timeout | 같은 operation 조회. 새 예약·재결제·성공 영수증 생성 금지 |
| stablecoin source 확정 + destination pending/unknown | credit 0, 새 전송 금지. 검증된 도착 결과의 중복 callback은 credit 추가 0 |
| 부족액 충전 후 checkout 복귀 / quote 만료·변경 | 원 order/venue/quote 유지·결제 동의는 별도. 만료/변경이면 재검토·재동의, 자동 결제 없음 |
| 다른 매장 또는 과거 주문/예약 선택 | source ID와 개별 operation/receipt 유지. 같은 주문 ID의 다른 매장·금액 바인딩 거절; 미확정 결제의 hold를 선택 전환으로 버리지 않음 |
| 옛 주문 부분환불 뒤 다른 사용처 탐색 | 원 주문 captured 상한 안에서 확정 환불 1회만 공통 잔액에 반영. 다른 주문 금액·혜택/자격 귀속 불변; 내역 선택/새로고침으로 잔액 재생성 금지 |
| 승인만 완료 / 부분환불 / 누적 환불 초과 | capture·settlement와 구분 / 기존 원금 기준 / 상한 초과 거절. 정상가 자동 결제 금지 |
| 결제 문의 후 환불하고 새 문의 | 옛 ticket 금액·사유 유지, 새 revision 검토+동의. 문의는 금전 mutation이 아님 |
| Chain 장애 / Labs bridge sample / badge 중복 시도 | 업무 성공 유지+outbox 재시도 / consumer credit 불변 / 두 번째 mint 없음 |
| 다른 사용자·파트너의 operation/export/ticket 조회 | 권한 거절, 원문 PII·서명·token·장기 다운로드 URL 유출 없음 |

## 6. 이번 범위에서 하지 않는 것

- 실제 연동·테스트 자금 이동·운영 credential 발급을 목업 완료의 조건으로 요구하지 않는다. 해당 구현/실행 증거는 개발자 인계 범위다.
- 교통/배달/쇼핑 독립 앱, 검증되지 않은 native bridge, 고정 KRW peg, DeepBook/Walrus를 채택된 기술인 것처럼 추가하지 않는다.
- 피부로 느끼는 “실시간 열기”를 표현하는 샘플 애니메이션을 실제 혼잡도/방문 증명으로 저장하지 않는다. 실제 신호 수집·검증은 BE-11이다.
- 여기서 서버 프레임워크·DB vendor·SDK release·실제 asset/network·금융/연령 정책을 임의 확정하지 않는다. **사용자 여정·경계는 확정**, provider 종속 결정은 owner가 ADR로 확정한다.

## 7. 로컬 검증 시작 명령

선택한 인계 브랜치에서 아래 순서로 실행한다. 계약 검사가 standalone stage를 재생성하므로 **기존 stage 서버를 켠 채 계약 검사를 병렬 실행하지 않는다.**

```bash
cd k-tour-id-app
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:contracts
pnpm build:vercel:ondo-b
pnpm exec next start .ondo-b-standalone -p 3438
```

다른 터미널에서 `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3438 pnpm exec playwright test tests/e2e/ondo-identity-demo-boundaries.spec.ts --project=mobile-chromium --workers=1`로 실제 standalone을 검증한다. 나머지 플로우별 test는 DEPLOYMENT_SPEC Appendix A에서 선택한다. 전체 E2E 파일에는 역사적 route 검사가 있으므로 무차별 실행 결과를 현행 플로우 검증으로 해석하지 않는다. 개발 preview를 위해 CSP를 느슨하게 바꾸지 않는다.
