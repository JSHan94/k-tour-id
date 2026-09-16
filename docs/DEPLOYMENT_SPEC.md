# K-Tour ID Deployment Spec

**현재 앱·소스:** 대표 주소는 [K-Tour ID](https://ktour-id.vercel.app), 기준 소스는 [`main`](https://github.com/woogieboogie-jl/k-tour-id/tree/main), Harvey 시작 브랜치는 [`handoff/harvey-20260914`](https://github.com/woogieboogie-jl/k-tour-id/tree/handoff/harvey-20260914)다. 현재 Production과 브랜치 동기화는 [배포·인계 기록](./KTOUR_PRODUCTION_HANDOFF_2026-09-15.md), 최신 UI 계약·검수와 보류 사항은 [9/16 UX 후속 기록](./ux-refinement/2026-09-15/round-20260916.md)을 따른다. [9/15 UX 릴리스](./ux-refinement/2026-09-15/RELEASE.md)는 당시 source의 이력이며 Sumsub 실험은 별도다. CX·OpenDID·OmniOne Chain·Sui 필수 구현 범위는 유지한다.

상태: `v3.3 · 목업 ↔ 개발 인계 정합화 · 2026-09-11 · 실제 연결은 개발자 구현 범위`

**개발자는 [시작 문서](./DEVELOPER_START_HERE.md)부터 읽는다.** 이 문서는 상세 계약 정본, [Backend 인계 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)는 배정 단위, [해커톤 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md)는 기술별 충족 증거다.

**기존 운영 기준선은 [운영 앱](https://ondo-tau.vercel.app)** 이다. source/runtime `cc3d7c3`, [운영 앱](https://ondo-tau.vercel.app). 브랜딩 전용 production Ready이며 최종 deployment `dpl_Bf4rBwnqH5PpaHeMRW6NmM8y3Wk1`의 고유 주소·검수 범위는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. 이번 로컬 검수는 관련 계약44/44·typecheck·production build/scan·HTTP probe(공개 자산41개)·mobile/desktop 브랜드 E2E6/6(workers1/retries0) PASS다. 최종 고유 배포의 HTTP probe 및 mobile/desktop 브랜드4/4(7.4초, workers1/retries0) PASS. 별칭별 추가 확인 범위는 릴리스 기록을 따르며, 전체 여정 재검수나 실제 provider/실기기 검수로 확대하지 않는다.

마지막 기능 흐름 검수 기준은 이전 `e2ad7c4`다. 당시 전체 계약833/833·After 19 공개 경로 로컬5/5 및 운영5/5 PASS(운영2.0분, workers1/retries0; project mismatch skip5개 제외)는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)의 역사적 증거이며 `cc3d7c3`에서 재실행한 결과가 아니다. 이전 `82ea4c9`의 공개 mobile12개/desktop·tablet2개·계약826개는 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md), [9월 11일 전체 검수](./FINAL_JOURNEY_QA_2026-09-11.md)도 각각의 역사적 범위만 따른다. 실제 provider 연결·실기기 완료가 아니다.

배포 전 문서 대조·선택 로컬 회귀는 [인계 정합성 점검](./HANDOFF_SYNC_2026-09-11.md), 이전 공개 source `3dc392b`는 [9월 10일 릴리스](./PROTOTYPE_COMPLETION_2026-09-10.md)에 보존한다.

`6fb5b96`·`996119f`·`a45400f`·`5233816`도 역사적 후보 증거다. 과거 G09-S 결과는 [Map/ID/stablecoin release](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md)에 남기며 이전 PASS를 이번 배포 결과에 합산하지 않는다.

목표는 **같은 사용자 행동을 목업에서는 샘플 응답으로, 실제 서비스에서는 검증된 백엔드 응답으로 완주**하게 하는 것이다. 이 문서는 실제 개발할 계약을 정의하며, 아래의 제안 API가 현재 배포되어 있다는 뜻이 아니다.

## 0. 2026-09-11 acceptance scope

이번 acceptance의 프런트 범위는 현재 지원하는 서울·부산·제주에 대해 요구된 mock UI, 명시적인 상태·실패·복귀 경계, 그리고 실제 연동을 위해 필요한 FE/provider handoff 요구사항을 정확히 보존하는 것이다. 실제 identity, venue, reservation, payment, signer, chain/provider 연동의 구현·운영 책임은 개발 인계 범위이며, mock UI가 완주된 사실을 실제 연동 완료의 gate로 간주하지 않는다. 아래 기존 계약의 provider·adapter·backend 요구사항과 미결정 ADR은 이 acceptance로 삭제하거나 완화하지 않는다.

네 번째 도시는 현재 활성화하지 않는다. 새 도시의 목업 완료 조건은 (1) city ID·좌표·라벨·필터·저장/복귀 경로를 FE 전체 city union에 반영하고, (2) 같은 schema의 출처·좌표 근거·`checkedAt`·사진 권리/`canonicalVenueId` 경계를 갖추며, (3) 목록·상세·길찾기·지도 이동·`review=0` 및 실패/복귀를 contract/E2E로 검증하는 것이다. 실제 provider/예약/결제/신원 연결 evidence는 **별도 운영화 조건이지 새 도시 목업 완료의 선행 조건이 아니다.** 이번 작업은 기존 세 도시의 조사 목록을 보강하며 새 도시 활성화를 주장하지 않는다.

관련 문서: [최종 산출물·사용자 승인](./KTOUR_END_OUTPUT_ALIGNMENT_2026-09-08.md), [해커톤 기술별 작업·증거](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md), [기존 PRD](./ondo-execution/01_PRD_9H.md), [기존 Flow Catalog](./ondo-execution/03_FLOW_CATALOG.md), [과거 ZKP 실측](./ZKP_CAPABILITY_VERIFICATION_2026-08-17.md).

## 1. 적용 기준과 현재 소스

### 1.1 문서 우선순위

1. 2026-09-08 사용자 승인과 이후 명시적 결정.
2. 본 v3 계약과 기술별 Integration Matrix. 세부 ADR이 미정인 항목은 미정으로 유지한다.
3. 현행 코드 및 같은 배포 후보의 브라우저 검수 결과. 코드는 현재 구현 증거이지 누락 요구를 폐기하는 근거가 아니다.
4. [기존 v2.1 원문 스냅샷](./DEVELOPMENT_SPEC_v2.1_SOURCE_2026-08-11.md) 및 9시간 실행팩. 보안·복구·REQ/FL ID를 보존하되 아래 충돌은 v3로 해소한다. 작업 브랜치의 기존 `DEVELOPMENT_SPEC.md`는 더 오래된 v2.0이며 정본으로 재승격하지 않는다.

| 기존 문서와 충돌 | v3 기준 |
|---|---|
| 가입/KYC 후 홈 진입 | Guest 탐색 → 필요한 서비스 행동에서만 자격 요청 |
| 교통·배달·쇼핑 Super App, 옛 독립 route | 현재 지도·장소·Tables·My Korea·ID/Wallet 맥락에 통합. 해당 산업은 향후 adapter 확장 예시이며 이번에 새 탭으로 복원하지 않음 |
| OpenDID·merchant trait `Contract-only` | 이번 목표는 클릭 가능한 성공·거절·복구 목업까지. 아직 없는 구현은 아래에 명시 |
| Sui `P2/optional`이므로 제외 | 사용자 지정 인계·목업 범위에 포함. 공식 해커톤 필수 여부와는 별도 |
| 서울 완결, 다른 도시 기능 제한 | 서울·부산·제주는 같은 조작과 플로우. 실제 데이터·파트너 지원 상태는 도시별로 정직하게 구분 |
| `KTourServiceCredential` vs 코드 `KTourVisitorCredential` vs PDF `K-Pass Capsule` | 제품명 K-Tour ID, 정규화 정책 모델 K-Pass. 실제 VC schema/type ID는 `ADR-DID-01`에서 고정하고 버전·migration 명시. 이름만 바꿔 이미 발급된 VC로 취급하지 않음 |
| `LIVE/SANDBOX/SIMULATED`만으로 화면 상태 표현 | 실제 업무 상태와 실행 출처를 별도 필드로 관리. 샘플 성공은 실제 인증·이체 성공이 아님 |
| KO/EN만 검수 | KO/EN/JA, light/dark/system × After 19 독립 조합 검수 |
| `REQ-011-A1`의 토큰·network를 상세/Labs에서만 표시 | 2026-09-09 사용자 요청에 따라 **사용자가 선택한 스테이블코인 충전 분기**는 USDC/USDT·network·서명·전환 단계를 직접 표시. 일반 잔액/가격은 KRW 중심을 유지. 이 결정은 실제 지원 자산이나 native bridge 승인이 아님 |

루트의 사용자 수정 파일 `DEVELOPMENT_SPEC.md`와 작업 브랜치의 기존 판은 변경하지 않았다. v2.1은 원문 그대로 스냅샷을 묶었다. 그 문서의 운영 수준 요구가 이번 프런트 작업으로 충족되었다고 해석하면 안 된다. 과거 Scope Memory·Traceability·External Chain 메모는 역사적 자료이고 최신 사용자 승인과 본 계약이 우선한다.

### 1.2 감사 기준선

- 소스 기준: `7776a7228d7df96f5981038bf77a3da6e5bd37c1` 기반 B 앱 및 복구된 후속 변경.
- 원 인계 기록: [snapshot `9d4aec9`](https://github.com/woogieboogie-jl/k-tour-id/tree/9d4aec9)의 `k-tour-id-app/`. 현재는 위 main/Harvey 인계 경로를 사용하며 과거 배포 commit ID는 이력 참고값이다.
- 기존 운영 목업·배포 source/runtime `cc3d7c3`, [운영 앱](https://ondo-tau.vercel.app). 브랜딩 전용 production Ready이며 최종 deployment `dpl_Bf4rBwnqH5PpaHeMRW6NmM8y3Wk1`의 고유 주소·검수 범위는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. 마지막 기능 흐름 검수 `e2ad7c4`는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md), [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md) 및 [이전 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)와 함께 source·URL별로 구분한다.
- 이전 핵심 목업·인계 커밋 `bec3257`·`bc8f0d0`, v3.2/G09-S `6fb5b96`·`996119f`, 모바일 `a45400f`, docs `d99ca9c`, core app `5233816`와 공개판 `3dc392b`는 각각의 역사적 기록이다.
- 저장소 루트의 오래된 `k-tour-id-app`을 최신 구현으로 집계하지 않는다.
- 아래 `B/`는 **이 기준선의** `k-tour-id-app/features/ondo/`를 뜻한다. 인계 시 이 branch의 코드·문서를 같은 commit으로 묶어야 한다.
- 현 standalone HTTP route는 `/`, `/ondo-b`(redirect), `/api/ondo/venues/[venueId]`이다. `scripts/ondo-b-standalone/policy.mjs`가 `/partner/verify`, `/partner/settlements`, `/evidence`, `/onboarding`, `/wallet`, `/pass`, `/present` 등 legacy route를 배포에서 차단한다.
- 따라서 옛 파일의 존재는 고객·심사자에게 접근 가능한 mock 증거가 아니다. 새 partner/evidence surface는 B 안의 명시적 진입점 또는 별도로 승인한 신규 route로 패키징하고 E2E를 추가한다.

### 1.3 현재 상태의 의미

| 표기 | 의미 |
|---|---|
| 코드 존재 | 읽기 검토에서 component/model 확인. 성공/모바일/배포 QA 통과와 동의어가 아님 |
| 구현중 | 이번 작업에서 변경 중. 후속 commit과 실제 브라우저 결과로 판정 갱신 필요 |
| 목업 공백 | 필요한 연결 또는 surface를 최신 B에서 확인하지 못함. 정적 안내만 있으면 여기에 포함 |
| 백엔드 필요 | 실제 provider·서버·chain 연결 작업. 현 프런트 완료와 독립적으로 남음 |

## 2. 실행 수준과 제품 불변식

- 공유 데모의 기본 경로는 샘플 신원·충전·결제를 완주할 수 있어야 한다. 최초 1회 간결한 데모 안내, 민감한 동의/금액 확정에는 샘플임을 식별할 단서를 유지한다. 기술 용어는 상세 정보에 둔다.
- 샘플 데이터는 `fixtureId`, `provenanceTruth: SIMULATED`, `externalProviderConnected: false`, `externalEffect: none`을 유지한다. 데모 상태가 실제 운영 권한으로 승격되어서는 안 된다.
- 실제 모드에서 provider 미구성은 `NOT_CONFIGURED/PROVIDER_UNAVAILABLE`이다. 실제 실패를 샘플 성공으로 자동 대체하지 않는다. 사용자가 데모로 전환하면 별도 저장 공간·작업으로 시작한다.
- `LOCAL_ACTUAL`은 저장·취향·초안 등 로컬 동작을 뜻하며 신원/결제/chain 결과로 사용하지 않는다. 현 `contracts/execution-mode.ts`의 구분을 보존한다.
- Account, Person, Age, Payment KYC, Wallet readiness, service entitlement, reputation, visual theme는 별개다. 로그인·VP 동의·지갑 연결·After 19 토글이 다른 축의 확인을 자동 완료하지 않는다.
- Guest 지도·검색·일반 장소·길찾기는 자격 상태와 무관하게 열린다. 제한된 서비스의 실행만 정책으로 통제한다.
- 샘플 모드라도 `age=false`, 체류기간 만료, 철회, 결제한도 초과, 사용한 바우처가 실제로 다른 결과를 내야 한다. 모든 실패 버튼을 결국 성공으로 바꾸는 목업은 불합격이다.
- 사용자에게 보여줄 기본 분기는 `사용 가능 / 확인 필요 / 이용 조건 미충족 / 만료`다. 내부 오류와 provider 장애는 자격 거절로 혼동하지 않는다.
- 모든 gate는 장소·Table·금액·선택과 원 행동을 보존한다. 권한 확인 성공 자체가 결제 동의나 예약 동의를 대신하지 않는다.

## 3. DID 자격 → 서비스 결정 계약

### 3.1 데이터 경계

```text
CX / Passport eKYC / 지원 Residence provider
  → Identity Adapter의 최소 IdentityEvidence
  → TrustProfile + 발급 정책
  → OpenDID issuer / holder의 K-Pass credential
  → 요청 목적에 맞는 VP·predicate 검증
  → 서버 PolicyDecision
  → Table / 연령제한 행동 / 혜택 / 결제 한도에 적용
  → 비식별 업무 event·receipt
```

PDF의 체류기간·결제한도·혜택권·서비스 권한·만료를 서비스 판단에 연결한다. 아래는 **앱/BFF 정규화 모델 요구사항**이며 OpenDID가 그대로 제공하는 공식 claim 이름은 아니다.

| 정규화 필드 | 생성·확인 책임 | 소비와 금지 |
|---|---|---|
| `subjectRef`, `issuerRef`, `evidenceRef`, `credentialRef`, `schemaVersion` | identity/issuer adapter | 서버 내부 연계. 원 신분증 번호·이름·DID를 공개 분석 식별자로 사용 금지 |
| `personAssurance`, `method`, `userContext` | 검증된 provider 결과 + 발급 정책 | provider/보증 수준 분리. 국적을 로컬 전문성 점수로 사용 금지 |
| `stay.validFrom`, `stay.validUntil`, `basis` | 체류 근거를 가진 issuer/서비스 기간 정책 | 단순 여권 소지만으로 입국일·비자·합법 체류 자격 추정 금지. 샘플 서비스 기간과 정부 체류허가를 구분 |
| `age.predicate`, `age.result`, `age.policyId`, `age.verifiedAt`, `age.expiresAt` | 검증된 연령 proof와 버전 정책 | 실제 DOB는 UI·URL·analytics에 넘기지 않음. 증거 없음과 조건 거짓을 분리 |
| `payment.limit`, `currency`, `period`, `paymentKycRef` | 결제 provider와 위험/한도 정책 | VC의 한도는 정책 입력. 실시간 사용액·reserved 금액은 원장으로 확인 |
| `serviceEntitlements[]`, `benefitEntitlements[]` | issuer/campaign 정책 | venue·offer·기간·사용횟수 범위 바인딩. 전 서비스에 통용되는 verified boolean 금지 |
| `status`, `validFrom`, `expiresAt`, `statusCheckedAt` | issuer/status adapter | active·expired·suspended·revoked와 status 조회 장애를 분리 |
| `riskFlags[]`, `policyVersion` | 권한 있는 risk/policy backend | 접근 제어용 최소 코드만. 공개 프로필·NFT·광고에 복제 금지 |

구현 연결점은 `B/contracts/kpass-capabilities.ts`와 `B/identity-b/ktour-id-setup-model-b.ts`다. 정규화와 `evaluateKPassService`, ID의 서비스 카드 및 실제 Table/결제 CTA 연결을 구현했다. 게스트 + 8개 자격 시나리오가 있으며, 운영 API·암호학적 proof는 연결하지 않았다. 현재 실행 범위·제한은 [9월 11일 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md), 과거 수치는 각각의 역사적 릴리스 기록을 따른다.

### 3.2 결정 요청·결과

제안 내부 API: `POST /api/v1/policy/evaluate`.

- 요청: `action`, `venueId/tableId/offerId`, `quoteId?`, `presentationReceiptId?`, `expectedPolicyVersion`, `returnContextId`. subject는 인증 세션에서 결정한다.
- 서버 입력: 검증된 credential/status, 최소 proof 결과, service/campaign 조건, 현재 원장 사용액. 클라이언트가 보낸 `verified`, `age`, `limit`를 신뢰하지 않는다.
- 결과: `decisionId`, `outcome: allow|proof_required|deny|expired`, `reasonCodes[]`, `requiredProofs[]`, `policyVersion`, `checkedAt`, `expiresAt`, `safeNextAction`, `executionTruth`.
- 추가 확인이 필요한 경우 요청할 최소 claim과 목적을 돌려준다. `deny`를 재인증 반복으로 유도하지 않는다.
- `allow`는 해당 action·resource·quote에만 유효하다. 마지막 mutation 시 credential/quote/한도/재고를 다시 확인한다. 다른 venue나 변경된 금액에 재사용하지 않는다.
- 게스트 행동은 credential 조회 자체가 필요 없다. provider 장애는 `503 EVIDENCE_UNAVAILABLE` 등 업무 오류로 반환하고 일반 탐색을 유지한다.

| 동일 행동에서 반드시 다른 결과가 나는 샘플 | 기대 결과·복구 |
|---|---|
| 신원 없이 일반 지도/길찾기 | allow, 인증창 없음 |
| 신원 확인이 필요한 Table에 증거 없음 | proof_required → 적합한 신원 경로 → 같은 Table |
| 주류 조건 Table에서 Person만 있고 Age 없음 | age proof만 요청. Person 성공으로 통과 금지 |
| 동일 Table에서 연령 predicate=false | deny → 일반 식사 대안/원 화면. 성공 재시도 금지 |
| 활성 자격이지만 혜택 대상 아님 | 혜택만 제외. 일반 서비스 가능 여부는 별도 평가 |
| 체류 서비스 기간 또는 VC 만료 | expired → 갱신/대체 서비스. Guest 기능 유지 |
| revoked/suspended 또는 차단 risk | deny → 지원/재검토. 새로고침으로 통과 금지 |
| 결제금액 + reserved 금액이 한도 초과 | deny → 금액/수단 재선택, 중복 debit 없음 |
| 사용된 바우처 또는 다른 가게의 proof | deny/requote → 명시적 재동의. 일반 가격 결제 자동 실행 금지 |

### 3.3 발급·제시·검증

| 단계 | 제안 내부 API | 필수 계약 |
|---|---|---|
| 세션 생성/조회/취소 | `POST /identity/sessions`, `GET /identity/sessions/{id}`, `POST /identity/sessions/{id}/cancel` | method, 목적, consentVersion, returnContextId → sessionId, handoff, expiry, 상태. 여기부터 표의 endpoint는 `/api/v1` 하위 |
| provider 결과 | `POST /identity/callbacks/{adapter}` | vendor signature/token/state/nonce·audience·시간 검증, replay 방지 → IdentityEvidence. 브라우저 callback만으로 성공 commit 금지 |
| 자격 발급/보관 | `POST /credentials`, `POST /credentials/{id}/holder-ack` | evidenceRef, schema/policy version, holder binding → 발급 결과 + holder receipt. 실제 wallet 수신 확인 전 보관 완료 금지 |
| 상태·갱신/폐기 | `GET /credentials/{id}/status`, `POST /credentials/{id}/renew`, `POST /credentials/{id}/revoke` | 권한/상태 확인. 갱신은 새 credentialRef와 이전 상태 이력. 기기 복구는 별도 재인증/키 교체 |
| 제시 요청 | `POST /presentations/requests` | verifier, action/resource, claim/predicate, purpose, retention, nonce, domain/audience, expiry, policyVersion. 요청 자체도 신뢰 검증 |
| 동의/제출 | `POST /presentations/{id}/submit`, `POST /presentations/{id}/deny` | 사용자에게 보인 요청의 digest와 제출 proof가 일치. 요청된 항목만 공개 |
| verifier 결과 | `GET /presentations/{id}/result` | issuer trust, holder binding, proof, 요청 정책, status, nonce, expiry 모두 통과 후 receipt. `동의함`과 `검증 성공`을 별도 상태로 보존 |

운영 nonce는 CSPRNG를 사용한다. 현재 샘플의 timestamp nonce를 운영 구현으로 이식하지 않는다. 서버가 `requestId+nonce+verifier+domain+audience+action+resource+claim policy`를 묶어 저장하고 1회 소비한다. 서명/암호 검증 성공만으로 정책 검증까지 성공했다고 판단하지 않는다.

과거 [ZKP 검증 기록](./ZKP_CAPABILITY_VERIFICATION_2026-08-17.md)은 공식 SDK의 합성 credential 로컬 풀사이클과 앱 통합 E2E를 구분한다. `verifyProof()` 직접 호출의 request-policy binding 관찰, CX `AdultVerify`의 정확한 연령 의미, ZKP credential의 non-revocation 지원은 **운영 적용 전 P0 재검증**이다. VP, selective disclosure, CL ZKP를 같은 말로 쓰지 않는다.

OpenDID 공식 구현은 issuer/TA/verifier/wallet 서버와 모바일 SDK를 제공한다. 사용할 release·trust environment·holder 앱/웹 handoff를 고정해야 한다. 순수 Next.js 웹에 네이티브 holder SDK가 자동 포함된다고 가정하지 않는다. [공식 architecture](https://github.com/OmniOneID/did-doc-architecture), [공식 release 구성](https://github.com/OmniOneID/did-release/tree/develop/release-V2.0.0.0).

## 4. 플로우별 목업 ↔ 백엔드 계약

G01~G13은 최종 산출물의 검수 묶음이다. 기존 FL/REQ를 대체하지 않는다. 다음 API는 **백엔드 구현 제안**이며, 배포된 vendor API 명칭이 아니다. 모든 mutation에는 §5 공통 envelope와 멱등성 규칙이 적용된다.

### G01 진입·지도·검색 — FL-001

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/map/map-entry-b.tsx`, `B/map/b-discovery-focus.ts`, `B/map/place-return-ui-snapshot-b.ts` |
| 현재 | 새 방문은 질문 없이 전국 지도→선택 도시 온도 지도로 진입하며 매장 preview를 자동으로 열지 않는다. 명시적 설정 중에만 onboarding canvas를 사용하고, 타일 error에서도 전국 resize 재맞춤은 수행하되 error truth는 유지한다. 같은 MapLibre를 유지하는 전국→도시 전환. 도시 기본 28°·평면 전환·전국 0°, 가까운 z14+에서 기존 타일 건물의 높이를 최대 18m로 제한한 얕은 입체 표현. `map/temperature-timeline-b.tsx`의 17–23시 샘플이 앞뒤로 재생되며 열 분포·작은 마커·장소 미리보기가 같은 프레임을 사용한다. 좌표/기존 장소 점수/자격은 변경하지 않음. After 19는 light/dark와 독립된 필터·색상 축. 숨겨진 탭·카메라 이동·reduced motion을 존중하며 실제 realtime 수집은 미연동 |
| API·요청 → 결과 | `GET /discovery/places?city&bounds&query&filters&cursor` → canonical place, position, freshness; `GET /discovery/signals?since&bounds` → eventId, venueId, occurredAt, confidence, intensity, provenance |
| 기술·실개발 | canonical venue DB/검색 index, 허가된 수집 adapter, 증분 신호 API(SSE는 필요 시), cache. 타일과 장소 실패를 별도 처리 |
| 오류·복구·QA | tile fail에도 목록 탐색; 위치 거절·offline·0 results; 같은 카메라/선택 복원. 샘플 replay는 실제 실시간 인파로 표시 금지. 신호 event 중복은 한 번만 반영 |

### G02 온보딩·취향 — FL-007/008/009

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/onboarding/official-directory-onboarding.tsx`, `B/map/b-discovery-personalization.ts`, `B/shared/state/ondo-b-preferences.ts` |
| 현재 | 지도 옵션/설정에서 선택형 취향 편집·명시적 단계형 지도 설정을 연다. ONB-NEW는 강제 sheet가 아니며 기존 취향을 초안으로 재편집한다. 자동 추천 매장 preview 없음. 완료만 저장하고 취소/닫기/건너뛰기는 기존 NEW/COMPLETE·persona·도시·취향을 보존한다. legacy IN-PROGRESS reload도 지도 진입. 신원확인 경로가 아님 |
| API·요청 → 결과 | `GET/PATCH /me/preferences` → locale, dietary/interests, user-selected travel context, version. Guest는 local persistence 가능 |
| 기술·실개발 | 선택적 계정 동기화, revision conflict 처리. 사용자가 고른 persona를 검증된 신원 claim으로 승격 금지 |
| 오류·복구·QA | 저장 실패/취소에도 지도; 건너뛰기를 저장된 취향 삭제로 해석하지 않음. 재편집·완료/reload·NEW/COMPLETE 취소 보존·legacy 중단 상태를 `tests/contracts/ondo-map-first-entry.spec.ts`, `tests/e2e/ondo-map-first-entry.spec.ts`로 추적. 국적/식이 추론 자동 공개 금지 |

### G03 장소·콘텐츠·방문 전 정보 — FL-001/011/016

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/place/canonical-place-overlay.tsx`, `B/map/japan-first-discovery-b.tsx`, `B/contracts/evidence.ts`; 현재 API `/api/ondo/venues/{venueId}` |
| 현재 | 상세·콘텐츠·facts 코드 존재. 공식 디렉터리 등 출처는 사용자가 필요 시 여는 정보로만 제공. 장소 메모/분위기 기여는 `B/local-signal-b/local-signal-layer-b.tsx`와 `local-signal-model-b.ts`: 태그/메모/사진 preview→필요한 gate→로컬 저장 성공/중복 no-op/실패·재시도→원 장소. 메모·사진은 process-only draft이며 영속 mutation에는 포함하지 않음. 내부 `UPL-SENT`는 기기 처리 상태이지 서버 업로드/공개 게시가 아님 |
| API·요청 → 결과 | `GET /places/{id}`, `GET /places/{id}/facts`, `GET /content/{id}` → facts별 value/state/observedAt/sourceRef, rights-aware media, connected venue IDs |
| 기술·실개발 | 출처별 adapter·expiry·이미지 이용권·canonical ID 매칭. 정책 자격은 §3으로 분리 |
| 오류·복구·QA | unknown을 false로 표시 금지; stale facts를 영업/결제 보장으로 사용 금지. 길찾기 복귀, 긴 이름, 빈 사진, 좁은 폭 2열 붕괴 검사 |

분위기 기여의 제안 API는 `POST /places/{id}/signals` 및 `GET /places/{id}/signals/{operationId}`다 (BE-11, media를 실제 채택하면 BE-10). 검증된 최소 proof receipt·태그·원 action digest → accepted/pending/duplicate/rejected와 비식별 evidenceRef. 신원 확인은 물리적 방문 증명이 아니므로 방문 판정은 별도 정책으로 검증한다. 새 public upload/게시를 연결할 때 현재 메모/사진을 몰래 포함하지 말고 대상·공개 범위·보존에 대한 별도 동의를 설계한다. 현 샘플의 `account:local`·venue 기반 evidence key는 서버 subject/방문 검증을 대신하지 않는다.

**9월 15일 목업 UX 계약:** 등록된 샘플 매장의 지도 미리보기는 혜택/상세 두 액션으로 연결하고, 미지원 매장은 기존 상세/길찾기를 유지한다. 길찾기는 전체 상세에서도 제공한다. 같은 장소의 서비스 복귀는 펼친 설명·스크롤을 함께 복원하며 다른 장소에 전파하지 않는다. 사진·디렉터리 등재·신규 리서치만으로 예약/결제 capability를 부여하지 않는다. 사진은 실제 매장 사진과 예시를 구분하고 로컬 자산·번역 alt·출처/라이선스·오류 대체 표시를 함께 전달한다. 실행 판정은 [UX 검수 기록](./ux-refinement/2026-09-15/README.md)을 따른다.

**9월 16일 후속:** research 전체 상세도 등록된 장소만 고정 footer에 결제 확인/지도 두 행동을 둔다. 본문의 같은 결제 버튼만 제거하고 예약·보조 길찾기는 유지한다. 미지원 research 장소는 지도/길찾기만 제공한다. 결제 sheet가 완전히 닫힌 뒤 동일 장소·행동 버튼의 focus를 복원하며, 이미 새 화면이 focus를 가진 경우 빼앗지 않는다. 온도 수치 강조는 기존 준비된 frame의 표시일 뿐 실시간 방문 집계·서비스 권한이 아니다.

### G04 계정·저장·My Korea·공개 프로필 — FL-010/011/015

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/identity-b/account-save-gate-b.tsx`, `B/my/korea-memory-map-b.tsx`, `B/identity-b/profile-reputation-b.tsx` |
| 현재 | 로컬 계정·저장·프로필 코드 존재. 실제 auth/sync 미연결 |
| API·요청 → 결과 | `POST /auth/sessions`, `GET /me`; `PUT/DELETE /me/bookmarks/{venueId}`; `PATCH /me/public-profile` → authenticated account, collection revision, 명시 선택 필드 |
| 기술·실개발 | 인증 provider/passkey/OIDC 선택, Secure HttpOnly 세션, CSRF, auth callback, 계정 merge·충돌·삭제 |
| 오류·복구·QA | auth 취소 후 원 장소; 저장 1회; storage 실패 rollback; 공개 From/Lives in/Languages는 자기선택 정보, KYC 원문 미노출 |

### G05 K-Tour ID·세 신원 경로 — FL-005/006

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/identity-b/ktour-id-setup-b.tsx`, `B/identity-b/passport-ocr-step-b.tsx`, `B/identity-b/local-check-walkthrough-b.tsx`, `B/identity-b/ktour-id-setup-model-b.ts` |
| 현재 | 기본 demo, method·동의·OCR·발급/보관/제시·normalized K-Pass 및 게스트+8개 자격. v3.2는 `contracts/identity-journey-samples.ts`의 공개 문서/얼굴/앱/QR/발급/보관 실패·수동검토/추가서류·복구를 추가. 복구는 원 자격을 보관한 채 전체 동의/확인/holder 절차 후 새 proof revision으로 교체하며 연령 predicate·사용액·혜택을 초기화하지 않음. 공개 브라우저 증거는 후보 기록에서 확인 |
| API·요청 → 결과 | §3.3 Identity/Credential. 국내 CX / 지원 Residence / Passport adapter → 최소 evidence → 발급·holder 상태 |
| 기술·실개발 | CX provider discovery + QR/WEB2APP; Passport NFC/eKYC/liveness는 별도 provider; OpenDID issuer/schema/holder/status; unsupported residence 대체 |
| 오류·복구·QA | 취소·미지원·미설치·QR/session 만료·얼굴 불일치·수동검토·issuer 실패·holder 저장 실패. 중복 callback 발급 1회. 체인 지연으로 발급 성공을 되돌리지 않음 |

비금전 가이드의 **내 패스에 담기**에 필요한 Person 전용 패스는 [체험 인계](./EXPERIENCE_MOCK_HANDOFF_2026-09-15.md)의 목적별 계약을 따른다. 공개 가이드 읽기에는 인증·패스·gate가 필요 없다. 저장을 선택한 같은 진행 중 Person 확인 재사용 경로에서만 명시적 생성/보관 동의 후 holder **준비 요청**을 1회 자동화한다. 서버/holder 결과 준비와 **사용자 수령 승인**, 저장 목적의 VP 동의는 별도 단계다. 일반 신원 설정·추가 자격의 수동 절차를 이 경로로 대체하거나 Person을 Age/Payment로 승격하지 않는다.

### G06 VP 동의·파트너 검증 — 기존 holder + verifier 보완

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/identity-b/ktour-id-setup-b.tsx`, `action-gate-coordinator-b.tsx`, `action-gate-contract-b.ts`; `B/integration-demo-b/integration-demo-b.tsx`의 verify 탭 |
| 현재 | Demo 표시 → 파트너 검증·정산 체험 → 검증. 목적 선택→요청→holder 동의/거절→최소 receipt. generic console은 service/credential/policy/audience/domain·재사용·만료·철회 샘플을 검사한다. 별도 checkout/Table gate는 private venue/quote context와 token snapshot을 보존한다. **generic console이 매장·금액·quote binding까지 검증했다는 뜻은 아니다.** 과거 checkedAt 영수증과 현재 stale 상태를 구분. 파트너 UI에 전체 VC·DOB·credential ID를 공개하지 않음 |
| API·요청 → 결과 | §3.3 Presentation; `POST /partner/presentation-requests` → single-use request; `GET /partner/presentations/{id}` → 최소 정책결과/receipt |
| 기술·실개발 | OpenDID verifier, request-policy binding, merchant RBAC/device binding. 사용자는 짧은 목적·공유항목·동의만, partner는 필요한 yes/no·조건만 |
| 오류·복구·QA | 다른 가게/금액/nonce/audience 재사용, 철회·만료·거부·신뢰 안 된 issuer·누락 claim 전부 실패. 취소는 Table/quote 보존, 중복 승인 mutation 0회 |

### G07 After 19 — FL-002/013/014

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/after19/after19-global-b-model.ts`, `B/identity-b/action-gate-coordinator-b.tsx`, `B/map/map-entry-b.tsx` |
| 현재 | 모드/선언/샘플 predicate·TTL 코드 존재. 로컬 night-view 선언은 실제 연령제한 서비스 proof가 아님 |
| API·요청 → 결과 | §3의 age-only presentation/policy → 해당 action의 eligible/denied/expired. `PATCH /me/preferences`는 자동전환 설정만 |
| 기술·실개발 | CX AdultVerify 또는 Passport-derived OpenDID proof 후보. 정확한 연령정책·기준일·시간대·issuer 신뢰는 ADR 필요 |
| 오류·복구·QA | age 없음/false/만료를 분리; 일반 심야 식당은 유지. auto=유효 Age + KST 19시 이후 + auto on + session manual-off 아님. 테마(light/dark) 변경 없음 |

### G08 Tables·대화·이미지·피드백·안전 — FL-003/012

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/connect/tables-entry-b.tsx`, `B/connect/table-policy-b.ts`, `B/connect/table-activity-b.ts`, `B/identity-b/activity-profile-b-provider.tsx`; 별도 `B/reservation-b/*` |
| 현재 | 서울·부산·제주 Table/로컬 meal plan. 상세의 접힌 샘플 상황에서 저장 실패/full/주최자 취소/조건 변경 및 메모 응답 실패. 9월 12일 작업본 MW-04는 선택 매장/연결된 Table 또는 Demo → 별도 매장 예약 → 날짜·시간·인원 → 확인번호/만석/실패/unknown → 취소/재조회 → 같은 매장으로 연결. 장소별 예약 기록은 원 venue/operation/confirmation을 유지하며 다른 장소를 선택해도 결과를 재명명하지 않음. 실제 좌석 재고나 파트너 계약을 주장하지 않음 |
| API·요청 → 결과 | `GET/POST /tables`; `POST /tables/{id}/{action}` (join, leave, check-in, feedback); `GET/POST /tables/{id}/messages`; `POST /uploads/intents`; `POST /safety/{action}` (reports, blocks) → availability/membership/chat access/receipt 각각 |
| 기술·실개발 | 좌석 원자적 할당, 조건부 Person/Age/entitlement, membership 기반 realtime 권한, presigned upload·scan·TTL, moderation/support queue. 식당 예약은 별도 ReservationAdapter의 order/confirmation |
| 오류·복구·QA | full/organizer-cancelled/nonmember direct access/중복 join/image fail/retry/leave; 신고 영수증. 새로고침·하단 CTA·키보드 overlap 검사. 식당 예약 미지원이면 식사 모임과 다른 의미로 표시 |

#### G08-R 매장 예약 adapter — 식사 모임과 독립

- 제안 API: `GET /reservations/availability` (venueId, date, party), `POST /reservations` (slotQuoteId, party, contactCapability, explicitConsent), `GET /reservations/{id}`, `GET /reservations?venueId&cursor`, `POST /reservations/{id}/cancel`.
- 응답: `operationId`, provider-neutral `status`, `confirmationRef?`, locked slot/date/timezone/party, quote expiry, cancellation policy, 최소 requiredProofs. provider ref는 서버 내부 매핑한다.
- 프런트 샘플 `ReservationStateB`: draft/requesting/confirmed/full/failed/unknown/cancelling/cancel_failed/cancel_unknown/cancelled. `draft`의 venueId/name/city는 registry와 일치해야 하며, `history`는 장소별 보존 기록이다(같은 장소의 모든 과거 예약을 영구 보관하는 서버 이력은 아님). 장소 재선택은 해당 기록을 복원하고 진행 중 request/cancel을 중단한 경우 unknown/cancel_unknown으로 조회한다. unknown에서 같은 기록의 새 예약·초안 변경을 막고 같은 operation을 조회한다. 로딩 중 reload도 unknown으로 복구한다.
- 이 샘플 식당은 일반 식사이므로 자격/결제를 임의로 강제하지 않는다. 실제 매장 정책이 최소 proof·보증금·선결제를 요구할 때만 §3의 action-bound gate 및 별도 결제 동의를 추가한다. After 19 토글로 연령 proof를 대체하지 않는다.
- 성공 확인번호 `SAMPLE-*`는 데모 표기일 뿐 운영 예약 확인서가 아니다. 실제 원장/재고는 provider 검증 응답과 idempotency store가 결정한다.

### G09 Travel Wallet·충전 경로

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/commerce-b/id-wallet-commerce-b.tsx`의 wallet/funding sheets, `B/commerce-b/funding-rail-model-b.ts`, `B/identity-b/action-gate-coordinator-b.tsx`. 명시적 충전 UI는 같은 sheet 안의 `B/commerce-b/stablecoin-funding-b.tsx`와 `.module.css`; credit 경계는 `B/commerce-b/stable-commerce-model-b.ts` |
| 9월 12일 작업본 MW-02/03 | 지도 잔액/ID Wallet → 충전 → 사용할 곳 보기 → 등록 장소, 또는 checkout 부족액 → 충전 → 같은 주문/quote 검토. 잔액은 매장 공통이며 내역 선택으로 초기화하지 않음. `PREPARE_QUOTE`는 funding 전에 quote만 보존하고 결제 제출/승인을 시작하지 않음. 아직 승인하지 않은 구매는 별도 결제 동의가 필요하며, 기존 승인이 유효한 동일 quote의 재개와 구분한다. quote 만료/변경은 재검토·재동의. 해당 후보 증거는 [MW-01–05](./MAP_WALLET_JOURNEYS_2026-09-12.md)에서 별도 추적 |
| 현재·확장 상태 | 은행/카드/Apple Pay 견적→승인→pending→settled·영수증/실패/재시도/unknown 조회와 G09-S 샘플 상태를 보존했다. 이전 기능 검수 기준 `e2ad7c4`의 실행 범위는 [매장 After 19 겹침 수정 릴리스](./PLACE_AFTER19_FIX_2026-09-14.md)을 따른다. 이전 `52f376e`와 f79 기준선은 [9월 11일 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md), `3dc392b`는 [Prototype Completion release](./PROTOTYPE_COMPLETION_2026-09-10.md)의 역사적 범위만 따른다. `a45400f`·`996119f`·`5233816`의 funding 수치/URL도 역사적 후보 증거이며 최신 public PASS나 실제 funding receipt로 집계하지 않는다. 모든 경우 실제 은행/카드/Apple Pay/Sui/bridge API 호출은 없다 |
| API·요청 → 결과 | `GET /wallets/current` → 공통 balance/held/available·revision; `GET /funding/methods`; `POST /funding/quotes`; `POST /funding/intents`; `GET /funding/intents/{id}` → 지원·요구 proof·asset/network·rate/fee/expiry·provider handoff·금전 상태. Sui signer는 G12의 세션/prepare/submit 계약을 사용하고, funding operation이 source/destination 상태와 각 receipt를 묶는다. 결제 복귀용 order/quote reference는 funding의 지급 권한이 아님 |
| 기술·실개발 | 은행/외국발행 카드/Apple Pay processor/onramp adapter, 자산·network·representation allowlist, provider별 funding KYC·거주/국가/통화/한도 정책, custody/recovery·gas, FX/fee 견적, source/destination receipt·finality 검증, 검증된 도착 결과와 durable 이중분개 credit의 원자성 |
| 오류·복구·QA | 기기 미지원/3DS cancel/한도·KYC 부족/서명 거절/network 오류/source 잔액 부족/견적 만료. source 확인·destination pending/unknown에서는 잔액 불변; 같은 operation 재조회만 가능. 중복·충돌 callback과 오래된 quote 거절, 도착 credit 1회. 실제 카드·여권·private key를 demo에 입력 요구 금지 |

#### G09-S · 명시적 스테이블코인 충전 계약

**9월 15일 목업 UX 계약:** funding 진입에 `purpose`(충전/결제수단 선택)와 원 매장 문맥을 전달한다. 충전에서는 기존 잔액을 입금 수단으로 제시하지 않는다. Wallet에서 완료하면 잔액으로, 주문에서 완료하면 같은 매장의 주문 검토로 돌아간다. 이미 반영된 완료 영수증은 새 수단 선택을 가리지 않지만 미확정 작업은 동일 operation으로 복구한다. 완료 화면을 닫거나 새 수단을 선택해도 credit를 재적용하지 않는다. 충전 완료는 구매 동의·매입이 아니다. 이 필드는 화면 복귀용이며 서버 지급 권한이 아니다.

**9월 16일 후속:** 주문 충전 화면에 원 매장과 충전 전 부족 KRW를 표시하고, credit 반영 완료 후 그 과거 부족액은 숨긴다. 이 표시 값은 견적/잔액에서 계산한 UI 맥락이며 서버 지급 권한·충전 금액 자동 선택·새 구매 동의가 아니다. `소셜 계정으로 연결` 같은 사용자 용어를 쓰되 signer/asset/network/수수료/승인 범위와 상세 Sui zkLogin·가설 경로 설명을 보존한다.

이번 변경은 generic USD 전환에 이름만 붙이는 작업이 아니다. `USDC/USDT 선택 → sample Sui signer(zkLogin 또는 기존 wallet) → 고정 견적 → 명시적 승인 → source 제출/확인 → routing → destination 확인 → 샘플 잔액/영수증`을 동일 Wallet 맥락에서 연결한다. 심사용 fixture는 실제 OAuth·지갑 서명창·token 전송을 호출하지 않는다.

구현·검수 파일은 `k-tour-id-app/tests/contracts/ondo-stablecoin-funding.spec.ts`, `tests/contracts/ondo-funding-rail.spec.ts`, `tests/contracts/ondo-funding-credit-boundary.spec.ts`, `tests/e2e/ondo-stablecoin-funding.spec.ts`, `tests/e2e/ondo-funding-rail-journeys.spec.ts`다. 양쪽 token의 network는 Sui Testnet **시뮬레이션 대상값**이며 실제 native/wrapped 배포 증거가 아니다. 같은 금액 재선택은 quote를 바꾸지 않고, signer 선택이 바뀌면 재연결을 요구한다. funding sheet 닫기/재진입은 같은 operation을 이어가지만 새로고침·wallet reset 뒤 이전 settled receipt로 credit를 재생성하지 않는다. 과거 `996119f` funding 묶음은 새 checkout 완주나 Labs 재검수를 포함하지 않았다. 이후 `3dc392b`의 complete-commerce 결과도 역사적 기록이며 현재 URL별 실행 범위는 [9월 11일 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)를 따른다.

- 승인 시 token symbol뿐 아니라 `{network, coinType, representation, amountAtomic, decimals}`, 출금 자산/금액, fee, 수령 KRW 표시액, destination 자산/경로, expiry, quote/operation ID를 고정한다. token·network·금액·받는 곳 변경은 기존 동의를 폐기하고 재견적/재승인을 요구한다. `sample` asset ID를 실제 Move coin type으로 전송하지 않는다.
- USD는 표시 통화이며 USDC/USDT 자산 그 자체가 아니다. 서로 다른 자산의 잔액·예약액을 합쳐 하나의 사용 가능 토큰 잔액처럼 표시하지 않는다. 샘플 rate/fee/decimals/representation은 provider 지원이나 실제 peg의 근거가 아니다.
- signer 준비, funding 지원 정책, Person/Age, Payment KYC, 자격 한도는 각각 독립이다. 현재 샘플 충전이 결제 KYC를 자동 완료하지 않는다. 실제 funding에 필요한 proof는 provider/지역/자산/금액별 정책으로 조회하며, 모든 충전에 무조건 DID 또는 Passport를 강제하지 않는다. 결제 시점의 G10 gate는 별도로 유지한다.
- source finality는 source receipt로, destination finality는 도착 시스템의 receipt로 판정한다. source 성공만으로 destination 자산 발행·KRW 상환·상점 지급을 선언하지 않는다. credit commit은 검증된 destination 결과와 동일 operation의 영구 멱등 키로 정확히 1회 처리한다.
- 제출 이후 닫기/timeout은 취소 성공이 아니다. pending/unknown operation을 보존하고 같은 요청을 조회한다. source 확정 이후 장애는 자동 재전송/새 quote가 아니라 대사·보상 정책으로 복구한다.
- 영수증은 source token/network/금액, fee/환산, destination 상태, 샘플 credit와 샘플 잔액을 구분한다. 실제 tx가 없으면 가짜 digest/explorer 링크를 만들지 않는다. 도착 확인과 상점 결제/정산·환불은 다른 operation이다.
- G12의 기존 Labs bridge는 **읽기 전용 가설 시연**으로 남는다. Labs의 고정 fixture receipt를 재사용해 Travel Wallet을 충전하거나 새 경로의 실제 실행 증거로 집계하지 않는다.

실제 Sui↔OmniOne 경로의 지원·routing/attestation·수탁/상환 주체는 `ADR-SUI-01`에서 결정한다. 공식 지원 근거가 없는 동안 sample-only이며, 이 문서가 native bridge나 OOKRW 원화 상환을 보증하지 않는다. [기준선 공백 및 검수 요구](./STABLECOIN_FUNDING_AUDIT_2026-09-09.md)를 새 후보의 실행 기록과 함께 인계한다.

### G10 결제·혜택·환불 — FL-004/017

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/commerce-b/place-service-registry-b.ts`, `B/commerce-b/stable-commerce-model-b.ts`, `B/commerce-b/id-wallet-commerce-b.tsx`, `B/commerce-b/visit-stamp-receipt-b.tsx` |
| 현재 | MW-01/05: 등록 장소별 locked quote·샘플 debit/고유 receipt 및 최종 K-Pass 한도/혜택 검사. `order`는 선택 주문, `orders`는 다른 주문 snapshot이며 `fundingCredits`는 공통 잔액의 입금 기록이다. `paymentOperation`은 승인/매입/실패/unknown을 분리하며 기본 경로는 별도 결제 동의 후 자동 매입, 접힌 샘플 설정에서 수동 단계를 선택. `refundOperations`는 선택한 원 주문의 부분환불·누적 원금 상한·실패/unknown/동일 작업 retry를 처리. 승인만으로 debit/혜택 사용이 없고 전액환불 때만 해당 주문이 사용한 혜택을 정책대로 복원. idle/paid/refunded는 선택 주문의 요약이며 공통 잔액 상태가 아님 |
| API·요청 → 결과 | `POST /quotes`; `POST /payments`; `GET /payments/{id}`; `GET /orders?cursor`; `GET /orders/{id}`; `POST /refunds/quotes`; `POST /refunds`; `GET /refunds/{id}`; `POST /vouchers/{id}/{action}` (reserve, redeem, release) → 장소/주문 귀속, §6 상태/분개/receipt. 실제 경로·schema는 BFF 제안이며 provider mapping은 후속 |
| 기술·실개발 | Payment KYC, 자격+benefit policy, payment processor, 주문 saga, ledger·voucher 원자성, provider callback/poll·대사 |
| 오류·복구·QA | 부족·한도 초과·quote 만료·중복 submit·혜택 경쟁사용·결제성공/주문실패·부분환불·환불실패. 불명 상태에서 재결제 금지. checkout 성공만으로 방문 stamp 증가 금지 |

샘플의 매입 성공은 최종 자격 검사·원장·혜택·기기 저장이 모두 성공한 뒤 한 번에 publish한다. 실제 processor에서는 이미 확정된 capture를 나중의 자격 변화만으로 “차감 없음”으로 되돌려 표시하면 안 된다. 서버 사전 정책 검사와 확정 거래 대사·필요한 보상/환불 상태를 별도로 구현한다.

**9월 15일 목업 UX 계약:** checkout/Wallet 모두 `CommerceRefundsB`의 하나의 환불 패널로 부분 금액·잔여 전액·실패 재시도·unknown 조회를 제공한다. 중복된 legacy 전액환불 버튼을 별도 연결하지 않는다. 구매 내역은 ‘구매/환불’이며 모든 입출금 원장을 뜻하지 않는다. My Korea에는 선택한 주문의 장소·원결제·확정 환불 ID를 연결하고 미확정/실패·타 주문 환불을 포함하지 않는다. 결제 자격 확인의 완료 문구는 기존 동의한 같은 결제를 이어간다고 명시하며, quote/대상/금액이 달라지면 재검토·재동의한다. Account/Person/Age/Payment KYC와 방문 기록은 여전히 별개다.

`CommerceOrderContextB`는 orderId/venueId/offerId/grossKrw/benefitKrw/operationId/receiptId와 자격 귀속을 묶는다. legacy 첫 샘플 주문의 고정 ID는 호환용이며 이후 주문은 고유 ID를 사용한다. 기존 orderId의 다른 매장·offer·금액 바인딩과 다른 주문의 operationId/receiptId 재사용을 거절한다. payment pending/unknown 중 내역 전환으로 hold를 버리지 않는다. 과거 주문 선택/재결제/부분환불은 다른 주문을 덮어쓰거나 공통 funding credit를 복제하지 않으며, 환불 사용액·혜택은 원 발급에 귀속한다.

혜택 추천도 같은 플로우의 일부다. 현재 `StableCommerceBBenefitRecommendation`은 recommended/accepted/declined이며 결정론적 local preview다. **실제 AI 호출은 없다.** BE-08은 offer/기간/최소금액/자격/사용 상태의 authoritative eligibility를 구현한다. BE-11이 추천 모델을 채택하면 제안 `POST /recommendations/benefits`에 최소 여행 맥락·offer ID만 전달하고 후보/설명/expiry를 반환한다. 추천 실패 시 정책 기반 기본 목록을 유지한다. 추천/수락 자체로 결제·혜택 사용을 commit하지 않고 최종 quote/동의/정책을 거친다. 모델·provider·비용·eval은 ADR-DATA-01의 별도 결정이며 원본 VC/여권/생체/정확한 사용자 위치 입력을 금지한다.

### G11 파트너·정산·OmniOne 기록 — FL-016 보완

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/integration-demo-b/integration-demo-b.tsx`, `integration-demo-model-b.ts`. Demo → 파트너 검증·정산 체험 → 정산 / 이벤트 탭. legacy `/partner/*`, `/evidence`는 복원하지 않음 |
| 현재 | 실제 샘플 결제 원장과 여러 부분환불 pair를 읽어 정산 성공/대기/불일치/실패·재조회·재시도. 6개 event를 queue→pending→샘플 receipt/failed→retry로 연결. PaymentAuthorized는 승인 단계에서 생성하며 capture와 구분. 부분·전액환불 후 이전 정산은 재대사 필요. 접힌 문의에서 사유→고정 금액 검토→전송/실패/unknown 동일 요청 조회→샘플 ticket. 금액 요약 JSON은 허용 필드만 내보내고 DID·원장 내부 revision·개인정보 제외. 문의로 결제/환불/chain event 생성 금지 |
| API·요청 → 결과 | `GET /partner/settlements`; `POST /partner/settlements/{id}/reconcile`; `POST /partner/disputes`; `GET /partner/disputes/{id}`; `GET /partner/disputes?settlementId&cursor`; `POST /partner/settlement-exports`; `GET /operations/{id}/evidence`; `POST /operations/{id}/evidence/retry` → 대사/문의/history/job 상태와 chain별 receipt |
| 기술·실개발 | partner RBAC, settlement ledger, transactional outbox/worker/DLQ, OmniOne contract/EOA/RPC·API, 비식별 evidence 검증 |
| 오류·복구·QA | 정산 불일치/지급 pending/재시도 중복/권한 없는 partner/chain outage; 문의 전 원장 revision 변경 시 재검토, 전송 결과 미확정이면 같은 operation 조회. export는 tenant 범위·다운로드 TTL·최소 필드 검증. 결제·자격 완료와 chain anchoring 상태를 분리. §7의 6개 event 연결 |

9월 11일 목업은 제출한 문의를 `supportHistory`에 보존하고, 제출 완료 후 명시적인 **새 문의**로 새 검토·동의를 시작한다. 뒤늦은 환불이 옛 ticket의 금액·사유를 덮어쓰지 않는다. pending/unknown은 새 문의로 우회하지 않고 같은 요청을 조회한다. history는 현재 앱 세션의 샘플이며 실제 티켓 저장소가 아니다. 개발자는 actor/partner/settlement 소유권, immutable snapshot, pagination, operation 멱등성, 최신 revision 재검토를 서버에서 보장한다.

### G12 Sui·방문 성과·badge — FL-004/012/018

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/labs/labs-entry.tsx`, `B/labs/labs-review-truth-b.ts`, `B/labs/labs-model.ts`, `B/identity-b/profile-reputation-b.tsx`, `B/commerce-b/visit-stamp-receipt-b.tsx`. 일반 Wallet 안의 스테이블코인 충전 surface/검수는 G09-S로 추적 |
| 현재 | Labs wallet/bridge hypothesis·자산 sample은 별도 읽기 전용 시연이며 Travel Wallet 잔액을 바꾸지 않는다. 명시적 샘플 이력9→별도 고유 방문10→opt-in badge mock과 signer 실패/복구 mock은 구현되어 있다. 이전 기능 검수 기준 `e2ad7c4`의 재검사 범위는 [매장 After 19 겹침 수정 릴리스](./PLACE_AFTER19_FIX_2026-09-14.md)을 따른다. 이전 `52f376e`와 f79 기준선의 Labs 실행은 [9월 11일 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md), `3dc392b`는 [Prototype Completion release](./PROTOTYPE_COMPLETION_2026-09-10.md)의 역사적 범위이며 `a45400f`·`996119f`·`5233816` funding 결과도 역사적 evidence다. 실제 Sui signer/tx/source·destination finality·receipt는 미연결 |
| API·요청 → 결과 | `POST /sui/sessions`; `POST /sui/transactions/{action}` (prepare, submit); `GET /sui/transactions/{id}`; `POST /visits`; `POST /badges/claims` → signer session·서명할 intent·chain status·고유 visit/badge receipt |
| 기술·실개발 | §8 zkLogin/일반 wallet signer, Sui SDK, 허용된 network/coin type/Move target, salt·ephemeral key·maxEpoch·recovery, gas sponsor, transaction effects 확인. G09-S가 세션/서명 계약을 사용하되 badge·source 자산 전송·destination 정산은 다른 operation/receipt. Visit는 중복 방지된 별도 evidence |
| 오류·복구·QA | OAuth cancel/epoch expiry/salt recovery/prover fail/wrong network/sponsor denial/duplicate mint; 9→10 milestone은 10번째 unique visit에서만, mint는 opt-in. 신원·평판·국적·위치 원문 공개 금지 |

### G13 설정·공통 상태

| 항목 | 계약 |
|---|---|
| 실제 surface | `B/settings/settings-entry-b.tsx`, `B/settings/settings-model-b.ts`, `B/settings/account-services-sample-b.tsx`, `B/shared/state/ondo-b-preferences.ts`, `B/contracts/return-to-integrity.ts` |
| 현재 | theme/언어/취향·로컬 데이터 관리, ID 샘플 자격, 기본 demo/provider opt-out. v3.2 설정→개인정보→계정 서비스(샘플)에서 준비된 계정의 JSON export/다른 sample 기기 logout/account deletion 동의→처리→영수증, 실패/unknown 재조회. 샘플 계정 작업은 현재 로컬 여행·자격을 삭제하거나 실제 세션을 revoke하지 않음. 실제 로컬 삭제는 기존 명시 confirm 동작으로 분리 |
| API·요청 → 결과 | `GET/PATCH /me/preferences`; `POST /me/data-exports`; `DELETE /me/account`; `POST /sessions/revoke` → version/operation status/retention summary |
| 기술·실개발 | 동기화·보안세션 revoke·삭제 worker·법정 보존 데이터 분리. demo reset은 운영 credential revoke나 실금액 소멸이 아님 |
| 오류·복구·QA | storage 차단·새로고침·다중 탭·삭제 취소·설정 conflict·키보드/focus; reset 이전 confirm, locale/theme/After19 조합 간 상태 오염 없음 |

### 4.1 현재 샘플 타입 → 실제 adapter 매핑

서버 응답을 현재 `ReviewFixtureExecution`에 캐스팅해서 연결하지 않는다. 위 제안 API와 아래 프런트 타입 사이에 검증된 provider adapter를 새로 구현하고, 샘플 판정기를 운영 verifier로 재사용하지 않는다.

| 현재 코드 / 상태 | 실제 계약으로 옮길 것 | 그대로 이식하면 안 되는 것 |
|---|---|---|
| `contracts/sample-environment.ts`, `use-qa-controls.ts` | 공개 execution mode와 provider availability. 샘플/운영 세션 분리 | 기본 샘플의 `review=1`·브라우저 플래그를 서버 권한으로 인정 금지 |
| `KPassNormalizedClaims` | identitySource/userType/personVerified/ageOver19/stayPeriod/serviceAccess/riskFlag/benefit → §3 정규화 evidence·정책 | 준비된 30일 기간·₩100,000 한도·샘플 true를 실제 승인값으로 사용 금지 |
| `KPassServiceDecision.status` | allowed→allow, needs_proof→proof_required, denied→deny, expired→expired. reason/recovery는 messageKey/safeNextAction에 매핑 | `paymentSpentKrw` 클라이언트 값 대신 서버 원장의 spent+reserved 사용 |
| `OndoBPresentationRequest`, `KPassPresentationBinding` | action/resource/credential/purpose/claims/audience/domain/policy/expiry binding 및 1회 소비 | timestamp 샘플 nonce·in-memory registry 대신 서버 CSPRNG·durable replay store |
| `FundingRailOperationB` | quoted→견적, authorize→requires_action, pending/unknown→원 operation 조회, settled→검증된 credit receipt. G09-S token/network·signer·source/destination 진행은 실제 자산 DTO/세션/독립 receipt 및 서버 최종성 정책에 매핑 | 고정 환율 1,500원/USD·고정 fee·샘플 asset ID/decimals를 실제 지원 값으로 복사 금지. 샘플 signer는 실제 권한이 아니며 receipt 복구는 자금 복구가 아님 |
| `CommercePlaceB` / `place-service-registry-b.ts` | 27개 체험 등록 장소: 조사 장소24 + Table 연결 장소3. source ID와 canonical/editorial/research origin, city, nullable tableId, reservation/offer capability를 분리. 서버는 실제 merchant 지원·유효기간·offer 가격/자격을 별도 검증 | 모든 commerce는 `sampleOnly: true`. 조사 listing·좌표·추천 선정은 제휴/메뉴/재고/결제 수용 증거가 아님. research ID를 canonical ID로 위장하거나 review=0에서 샘플 권한으로 승격 금지 |
| `StableCommerceBState` / `CommerceOrderContextB` | 공통 fundingCredits와 order/orders별 quote/pay/refund/voucher/ledger를 서버 wallet/order 원장으로 확장. 고유 order/operation/receipt와 원 issuanceRef를 고정하며 과거 환불을 다른 발급/주문에 귀속하지 않음 | mount 샘플 history를 영구 원장으로 사용하거나 내역 선택으로 잔액 복원 금지. OOKRW의 1단위=1,000원 샘플 환산을 실제 decimals/peg로 사용 금지. `:age:` 문자열 대신 서버의 불변 issuanceRef와 VC revision 분리 |
| `ReservationStateB` / `ReservationRecordB` | 장소별 draft/phase/operationId/confirmationRef와 history를 서버 예약 목록·동일 operation 조회로 연결. Table membership 원장과 독립 | local sample 저장은 실제 좌석/예약 확정이 아니며 다른 장소의 confirmation을 재사용하지 않음 |
| `MinimalPartnerReceiptB` | 서버가 확인한 yes/no·purpose·policy·expiry와 최소 receiptRef | UI 동의만으로 issuer trust·proof·status 검증 완료 금지 |
| `IntegrationDemoEventB` | queued/pending/recorded/failed → outbox/submit/검증된 receipt/retry | `recorded`는 로컬 샘플 용어. 현재 null인 txHash를 임의 문자열로 채우지 않음 |
| `IntegrationSettlementB` | 결제·환불·수수료·보조금 원장 대사와 지급 상태를 각각 구현 | 샘플 merchantNet=payment-refund가 실제 payout 성공을 뜻하지 않음 |
| `SettlementSupportB` / `SubmittedSettlementSupportB` / `supportHistory` | submitted 문의의 금액·사유·revision snapshot과 ticket 목록을 영속 저장; 새 문의마다 재검토·동의, pending/unknown은 동일 operation 조회 | 세션 내 ticket을 실제 접수/영구 이력으로 표시하거나 문의로 결제·환불·chain event를 만들지 않음 |

세션 수명: 현재 credential·샘플 지갑 잔액/주문 이력·integration registry는 mount 세션에만 있다. funding pending/unknown operation은 `ondo-b.funding-rail.v1`에서 재진입하되, settled 상태는 현재 메모리의 승인 credit와 정확히 일치할 때만 복구한다. 새로고침 후 옛 주문/입금 영수증으로 잔액이나 paid 상태를 재생성하지 않는다. 예약의 로컬 장소별 기록도 실제 예약 조회 권한/확정 증거가 아니다. 향후 지갑 단독 초기화 UI를 만들면 operation도 함께 초기화해야 한다.

### 4.2 프런트·provider SDK 인계 (백엔드 API와 별도)

아래 항목은 API/DB 구현 완료로 자동 충족되지 않는다. 현재 프런트는 샘플 adapter와 상태·복귀 계약을 제공할 뿐이며, provider SDK 선택·앱 handoff·브라우저 capability·signer 승인과 실제 receipt 연결은 별도 인계다.

| 프런트/SDK 경계 | 남은 FE·provider 작업 | 백엔드 API와의 경계 | 현재 proof |
|---|---|---|---|
| CX/Passport handoff | 모바일 앱·QR/WEB2APP·NFC/liveness capability, callback origin·취소 복귀, 민감정보 redaction | BE-02/03 API가 세션·결과를 중계해도 SDK/provider 결과의 실제 검증은 별도 | 샘플 flow만; 실제 provider receipt 없음 |
| OpenDID holder/VP | 채택 release의 holder 앱/웹 handoff, deep link, 동의 화면, verifier SDK/서명 결과 adapter | BE-04/05가 credential·presentation 상태를 저장해도 holder ack/VP proof는 자동 생성되지 않음 | 샘플 발급·동의·검증 상태; 실제 holder/VP 없음 |
| Wallet/payment rails | 카드/Apple Pay/은행 capability, processor UI·token handoff, quote/결제 복귀와 오류 mapping | BE-06/07/08이 quote·ledger를 소유; FE는 token/원문을 보관하지 않음 | 기존 funding/checkout 샘플; 실결제 receipt 없음 |
| Sui signer/asset | 선택 signer SDK, zkLogin OAuth·ephemeral key·salt/prover·maxEpoch, wallet 승인, transaction intent/effects adapter | BE-15/16이 operation·finality·credit를 소유; signer 연결은 DID/Payment KYC가 아님 | G09-S sample signer·Labs hypothesis만; 실제 tx 없음 |
| 식당 예약 | provider availability/confirmation/cancel SDK 또는 web handoff, 확인번호와 unknown 재조회 UI | BE-09가 재고·멱등성·예약 원장을 소유; Tables meal plan과 별도 | `reservation-b` sample confirmation만; 실제 좌석 receipt 없음 |

이 표의 provider/SDK 작업은 `ADR-DID-01`, `ADR-PAYMENT-01`, `ADR-SUI-01`, `ADR-RESIDENCE-01` 결정 뒤에 진행한다. 공식 release·network·자산·실제 bridge를 이 문서에서 선택하지 않는다.

### 4.3 성공 화면 외에 연결해야 할 조회·복구 API

아래도 **새로 구현할 앱/BFF 제안 경로**이며 현재 route나 vendor SDK 메서드가 아니다. §4의 mutation만 구현하고 조회·복구를 빠뜨리면 목업의 pending/unknown/재진입 화면을 연결할 수 없다. 모든 조회는 session/tenant/원 operation 소유권을 확인한다.

| 담당 | 추가 계약 | 화면이 필요로 하는 결과·경계 |
|---|---|---|
| BE-01 + 각 도메인 | `GET /operations/{id}` | domain/kind/status/revision/execution/allowedActions/evidenceRefs/error. 도메인별 조회를 사용할 경우도 같은 의미로 매핑; unknown을 새 mutation으로 처리하지 않음 |
| BE-02–04 | identity session 조회의 manual_review/needs_info/approved/declined; `POST /identity/sessions/{id}/additional-evidence`, `POST /credentials/{id}/recovery-sessions` | 최소 추가정보 요구·secure upload/handoff·review 결과; recovery는 검증된 동일 subject의 새 키/VC revision이며 사용한 혜택·한도를 초기화하지 않음. holder-ack 실패는 재발급 없이 저장을 재시도 |
| BE-06/07 | funding/payment 조회 + `POST /funding/intents/{id}/cancel`, `POST /payments/{id}/capture`, `POST /payments/{id}/void` | allowedActions는 provider의 취소/매입 가능 시점 기준. 서명/전송 이후 cancel 성공을 추정하지 않음. capture/void는 partner/server 권한과 정책을 확인하며 임의 consumer 호출 금지 |
| BE-11/07 | `GET /places/{id}/services`, `GET /places?capability=wallet&cityId&cursor` | source ID/provenance와 검증된 merchantId·reservation/table/offer 지원·정책 revision/expiry. 지도 사용처 필터는 실제 지원 응답으로 구성하며 조사 listing만으로 결제 가능 판정 금지 |
| BE-06/07/08 | `GET /wallets/current`, `GET /orders?cursor`, `GET /orders/{id}` | 공통 balance/held/available·revision과 주문별 venue/offer/paymentOperationId/receiptRef·gross/benefit/payable/refunded·allowedActions. 옛 주문 조회는 현재 지갑을 초기화하지 않으며 source/도착/credit와 주문 capture/refund의 reference를 구분 |
| BE-09 | `GET /reservations?venueId&cursor`, `GET /reservations/{id}` | 원 venue/date/timezone/party·operation/confirmation·cancel status. 장소별 history와 미확정 요청 재조회를 분리하고 다른 매장 기록을 현재 예약으로 재명명하지 않음 |
| BE-10 | `GET /tables/{id}`, `GET /uploads/intents/{id}`, `POST /uploads/intents/{id}/complete`, `GET /safety/reports/{id}` | membership·message cursor·upload scan/failed/ready·redacted 접수 상태. 임의 object URL 제출로 검수 완료 처리 금지 |
| BE-12 | `GET /me/data-exports/{id}`, `GET /me/account-deletions/{id}` | 준비중/완료/실패/만료 + 짧은 다운로드 권한 또는 보존 요약. 삭제로 로그인 세션이 해제된 뒤 조회가 필요하면 해당 작업만 보는 제한된 capability를 설계 |
| BE-14 | `GET /partner/disputes?settlementId&cursor`, `GET /partner/settlement-exports/{id}` | immutable 문의 이력·다음 cursor·tenant 범위 export job/다운로드 만료. 새 문의와 기존 요청 재시도를 구분 |
| BE-15 | `GET /badges/claims/{id}`, `GET /visits?cursor` | mint pending/unknown/effects와 고유 방문 집계. 10번째 visit와 mint는 별도, 기존 claim 재조회로 이중 mint 금지 |

DTO/enum·HTTP status·version·OpenAPI는 개발자가 §5 envelope와 각 도메인 상태에 맞춰 확정한다. transport timeout은 자격 거절이나 금전 실패로 번역하지 않는다. 앱은 `allowedActions`와 `safeNextAction`을 표시하되 서버도 동일 권한을 검사한다.

## 5. API·보안·복귀 공통 계약

### 5.1 공통 envelope

```ts
// Proposed BFF wire contract; provider response schemas are mapped by adapters.
type OperationResponse<T> = {
  schemaVersion: "1";
  requestId: string;
  operationId: string;
  status: string; // domain-specific state, not a generic success boolean
  execution: {
    mode: "demo" | "provider";
    truth: "SIMULATED" | "SANDBOX" | "LIVE" | "NOT_CONFIGURED";
    fixtureId?: string;
    providerRef?: string;
  };
  data: T;
  evidenceRefs: string[];
  occurredAt: string;
};
type OperationError = {
  code: string;
  messageKey: string;
  retryable: boolean;
  safeNextAction: string;
  operationId?: string;
  fieldErrors?: Record<string, string>;
};
```

이 wire envelope는 현 프런트의 `execution-mode.ts` union과 adapter에서 명시적으로 매핑한다. `SANDBOX`는 공급자 공식 테스트 응답이 검증된 경우, chain의 `TESTNET`은 실제 조회 가능한 tx evidence에만 쓴다. 환경 이름만 testnet인 fixture는 항상 `SIMULATED`다.

### 5.2 멱등성·callback

- mutation은 `Idempotency-Key`를 받는다. `(actor, operationKind, key)`와 요청 digest를 DB에 유일하게 저장한다. 같은 key·다른 body는 `409 IDEMPOTENCY_CONFLICT`; 같은 요청 재시도는 기존 operation 결과를 돌려준다.
- provider event ID를 unique 처리하며 이전 상태로 회귀하는 늦은 callback을 무시/대사한다. signature·timestamp·nonce/state·target audience를 검증하고 원문 token을 로그에 남기지 않는다.
- 분개·업무상태 변경·outbox 삽입은 같은 transaction. 네트워크 재시도가 새 청구/새 발급/새 혜택 사용을 만들지 않도록 한다.
- `202 pending`은 성공 영수증이 아니다. 클라이언트 timeout은 서버 작업 취소가 아니다. get/poll/reconcile로 결론을 찾고 중복 재실행을 막는다.
- 공통 오류 예: `AUTH_REQUIRED`, `CONSENT_DECLINED`, `SESSION_EXPIRED`, `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`, `CALLBACK_INVALID`, `EVIDENCE_STALE`, `POLICY_DENIED`, `QUOTE_EXPIRED`, `INSUFFICIENT_BALANCE`, `LIMIT_EXCEEDED`, `ALREADY_REDEEMED`, `OPERATION_UNKNOWN`, `RATE_LIMITED`.

### 5.3 returnTo와 개인정보

- public context만 allowlist 검증하여 저장한다. raw credential, DOB, 여권, private note, 결제수단 token, 업로드 URL을 query나 returnTo에 넣지 않는다.
- 현재 `B/identity-b/action-gate-contract-b.ts`는 token TTL·snapshot binding·one-shot 소비·private context를 가진다. 이 의미를 서버 operation binding으로 이어간다.
- 앱이 재시작되어 private draft가 복원되지 않을 때는 사용자에게 재입력을 요청한다. 불완전한 snapshot으로 결제를 재개하지 않는다.
- 요청 목적/금액/venue가 바뀌면 이전 approval 폐기 → 새 요청/quote → 사용자 재동의. 취소·권한 실패 시 일반 탐색은 유지한다.
- MW-01–05의 map 복귀는 registry의 `PLACE_SERVICE_RETURN_EVENT_B`(placeId, focus)와 `SHOW_BALANCE_PLACES_EVENT_B`(선택 cityId)를 사용한다. 선택 장소·도시·지도 탐색 snapshot과 초점 복귀는 로컬 UX 맥락이지 결제/예약 권한이 아니다. 서버 operation은 별도로 원 venue/order/quote에 binding하고 공개 이벤트만으로 승인하지 않는다.
- 인증세션 cookie, partner RBAC, CSRF, CSP, rate limiting, callback origin allowlist, 업로드 MIME/size 검증, secrets manager, 암호화·retention·삭제 감사가 필요하다.

## 6. Wallet·금전·바우처 계약

### 6.1 금액과 funding

- 법정통화는 `{currency, amountMinor, scale}`로 저장하고 integer 연산한다. KRW/USD 환산에는 `quoteId`, rate, fee, provider, expiry를 고정한다.
- 디지털 자산은 `{network, coinType, representation, amountAtomic, decimals}`를 분리한다. USDC/USDT 이름만으로 native/wrapped·network를 추정하지 않는다.
- 현재 OOKRW 숫자와 고정 환율은 샘플 내부 값이다. 이를 실제 원화 상환권이나 검증된 stablecoin peg로 선언하지 않는다. 일반 잔액/가격/환불은 KRW를 주표시로 하며 ooKRW는 모바일 탭·키보드로 열 수 있는 잔액 안내/접힌 상세에만 둔다. 표시 통화·참고 환산과 settlement 자산은 adapter에서 분리한다. 최종 확인/결과에는 샘플·외부 청구/예약 미발생 경계를 간결히 표시한다.
- 지원 funding 방법은 provider의 사용자·지역·통화·기기 지원표로 조회한다. “외국인은 카드”, “거주자는 은행”을 문서만으로 보장하지 않는다.
- Apple Pay는 지원 processor·merchant/domain 등록·기기 capability가 필요한 결제 진입점이다. 단순 웹 버튼을 누른 결과를 실제 token authorization으로 간주하지 않는다.
- 사용자가 선택한 stablecoin funding branch에서는 G09-S에 따라 토큰·network·source 금액과 KRW 표시 credit를 직접 보여준다. 일반 잔액/가격 화면의 KRW 중심 UX와 충돌하지 않는다. 실제 adapter는 승인된 자산 registry의 metadata를 제공하며 샘플 화면의 이름·주소·decimals를 지원 근거로 삼지 않는다.

### 6.2 상태와 보상

공통 지갑의 사용 가능 금액은 확정 funding credit와 모든 주문의 capture/refund·미확정 hold를 함께 반영한다. 주문별 ledger는 해당 원금/환불만 소유하며, 과거 주문 조회·다른 장소 선택·새 주문은 잔액을 복제/초기화하지 않는다. 같은 확정 환불의 중복 callback은 잔액 추가 0, 누적 환불은 해당 주문 captured 금액 이하이며 다른 주문/발급의 혜택·사용액을 바꾸지 않는다.

| 도메인 | 최소 상태 | 실패 시 불변식 |
|---|---|---|
| Funding | created → requires_action → pending → settled; cancelled/failed/expired/unknown | settled 전 available credit 없음. unknown은 재조회 후 결론 |
| Stablecoin funding | signer 준비/quote/동의 → source submitted → source confirmed → routing → destination confirmed → credit committed | 두 시스템 receipt를 독립 검증. source 성공 또는 제출 후 quote 만료로 새 전송 금지. destination 확정과 원장 credit는 멱등 대사하며 merchant payout/Payment KYC와 분리 |
| Payment | quoted → authorized → captured → settled; declined/voided/expired/unknown | quote 변경 재동의; authorized와 captured 분리; 중복 청구 없음 |
| Order/Reservation | pending → confirmed → fulfilled; rejected/cancelled/unknown | 결제와 주문 독립. 결제 성공·주문 실패는 상태 조회 후 void/refund |
| Refund | requested → pending → partially_refunded/refunded/failed | 원 결제 누적 refund ≤ captured; 환불 실패 시 환불 완료 표시 금지 |
| Voucher | issued → reserved → redeemed; released/expired/reversed | reserve/redeem 1회. 취소/환불 시 캠페인 정책에 맞춰 복원; 무조건 새 바우처 지급 금지 |
| Settlement | open → calculated → pending → settled; mismatched/disputed | customer, merchant, fee, subsidy, refund 합계 대사. chain confirmed가 지급 완료를 뜻하지 않음 |

각 quote는 gross/discount/fee/payable, 통화, funding asset, cancellation rule, policy version을 묶는다. AI는 혜택 후보만 제안하며 자격판정·금액변경·거래승인의 최종 주체가 아니다.

## 7. OmniOne Chain·파트너 증거

### 7.1 이벤트와 source of truth

| PDF의 업무 event | 실제 생성 지점 | chain 실패 때 유지할 업무상태 |
|---|---|---|
| `KPassIssued` | 발급 결과와 holder 보관 확인 | 활성 credential. chain receipt만 pending |
| `WalletLinked` | wallet/provider 연결 검증 | 연결 결과와 자금 상태 분리 |
| `PaymentAuthorized` | 승인 결과 검증 | authorization. capture/정산으로 과장 금지 |
| `VoucherIssued` | campaign 발급 transaction | voucher record와 사용가능 조건 |
| `VoucherRedeemed` | 원자적 사용 commit | 사용 1회. chain retry로 재사용 금지 |
| `PartnerSettlementLogged` | 정산 결과 대사/기록 | 지급 provider 상태. 기록 event가 지급의 증거를 대신하지 않음 |

업무 DB/ledger가 거래 source of truth이며 체인은 검증 가능한 비식별 증거/선택된 불변식 계층이다. `outbox: queued → submitted → confirmed`, 실패 시 retry/backoff → dead_letter → 권한 있는 reconcile을 제공한다. `confirmed`는 실제 chain receipt의 network/address/status/event payload를 확인한 뒤에만 사용한다.

최소 chain payload 후보: `schemaVersion, eventType, randomEventRef, aggregateKind, policyVersion, nonPiiPayloadHash`. 개인정보를 먼저 삭제/최소화한 후 canonicalize/hash한다. 여권/DOB/이름/전체 VC/정확 위치/카드 원문 및 이들의 단순 hash를 비식별이라고 간주하지 않는다. 공개 주소·event의 연결 가능성도 privacy 검토 대상이다.

위 hash payload는 **개발 계약 후보**다. 현재 샘플 event export의 허용 필드나 null txHash가 실제 hashing/chain 검증 구현을 뜻하지 않는다. source event 생성과 worker의 제출/receipt/finality를 각각 구현·검증한다.

### 7.2 계약 구현

- 프로젝트 후보: `OfferRegistry`(정책 버전/유효기간), `RedemptionRegistry`(승인된 1회성 혜택의 중복 사용 거절), `EvidenceAnchor`(최소 업무 증거). 구체 ABI·ownership/roles·upgrade·compiler·chain ID는 `ADR-CHAIN-01`에서 고정한다.
- 최소 한 개의 제품 불변식을 실제 contract가 거절하는 negative test가 있어야 한다. 로고·고정 hash·로그 표시만으로 Chain 활용 완료가 아니다.
- 공식 2026 가이드의 OmniOne Chain 설명은 Solidity 또는 ABI+Bytecode 등록·배포와 EOA/API 사용을 다룬다. 팀 환경의 정확한 network/RPC/API·지원 compiler는 제공받아 확인한다. [공식 가이드 p33–34](https://opendid.org/download/hackathon/2026/2026%20%EB%B8%94%EB%A1%9D%EC%B2%B4%EC%9D%B8%20%26%20AI%20%ED%95%B4%EC%BB%A4%ED%86%A4%20%EA%B0%80%EC%9D%B4%EB%93%9C%EB%B6%81.pdf?v=20260430).
- transaction 제출 worker의 key는 브라우저에 두지 않는다. partner UI의 retry는 원 outbox operation을 재조정하며 임의 contract call을 허용하지 않는다.

## 8. Sui의 역할과 연동 경계

**9/21 해커톤 최소 연동은 공개 골목 가이드의 선택적 패스 저장 여정이다.** [Sui 필수 추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md)의 네 기술·실행/서비스/감사 분리 요건이 아래 전체 제품의 자산/bridge/badge 예시보다 우선한다. 9/16 승인된 v2 연결점은 [체험 목업 인계](./EXPERIENCE_MOCK_HANDOFF_2026-09-15.md)를 따른다. 로바 전체 상세의 가이드 내용은 인증 없이 무료로 읽으며 IDB·gate·intent·사용 기록을 만들지 않는다. **내 패스에 담기** 선택에만 Person/CX → OpenDID 발급·holder·VP → 준비된 AI 제안·명시 승인 → Sui 실행 → 최종 자격 재확인·패스 컬렉션 저장 → OmniOne 감사를 연결한다. 기존 금융 혜택이나 방문 badge는 이 완료 증거가 아니다.

저장 자격 정책은 현재 유효한 Person 확인만이다. VP로 요청하지 않은 국적·체류·성인·결제 정보를 추정하지 않는다. scope action은 `save-neighborhood-guide-to-pass`, campaign은 `ktour-neighborhood-guide-save-v2`, recipient는 `demo-traveler-pass`다. 결과는 로컬 목업 패스 컬렉션 항목이며 서명 VC claim이 아니다. 이전 v1 읽기 승인·기록은 삭제·변환·저장 동의 재사용을 하지 않는다. 1회 제한은 저장에만 적용하며 무료 열람은 반복 가능하다.

고정된 브라우저 샘플 사용자/캠페인 기록은 실제 사용자 중복 방지나 암호학적 영수증이 아니다. 하비는 서버 세션·현재 자격·durable intent와 실제 AI/zkLogin/PTB/Move, 최종 DB 컬렉션 저장, OmniOne outbox를 연결한다. Sui 권한 소비는 저장 완료가 아니며 감사 pending/실패는 저장 재실행 사유가 아니다. 실제 매장의 제공 의무가 있는 상품권·할인·예약은 만들지 않는다.

Sui는 이번 사용자가 지정한 목업·인계 범위다. DID 신원확인의 대체재가 아니다. 제품 후보는 **사용자 서명 수단(zkLogin/기존 wallet) → 명시 동의한 자산 동작 또는 선택적 기념 badge → receipt**다. 실제 대상 asset/Move package/수탁·상환 구조는 `ADR-SUI-01`의 결정 항목이다.

- zkLogin은 OAuth JWT·ephemeral key·salt·maxEpoch·proving service를 사용하는 Sui 서명 방식이다. 계정 로그인 또는 signer 준비가 Person/Age/Payment KYC 증명을 만들지 않는다. salt 백업·복구와 epoch 만료 후 재로그인을 정의한다. [Sui 공식 zkLogin](https://docs.sui.io/sui-stack/zklogin-integration).
- 실제 개발은 Sui SDK transaction builder, 선택된 Move entrypoint, network allowlist, 사용자 승인, transaction effects/receipt 검증, 실패·재조회·중복 방지가 필요하다.
- gas sponsorship을 쓰면 사용자·sponsor가 동일 transaction data에 서명하고, sponsor는 허용된 target/금액/가스 한도·rate limit만 승인한다. [Sui 공식 Sponsored Transactions](https://docs.sui.io/develop/transaction-payment/sponsor-txn).
- 방문 badge는 unique visit milestone 뒤 선택적으로 민팅한다. VC·국적·법적 연령·평판·제재·정확 위치를 공개 badge metadata에 넣지 않는다.
- 현재 `Sui → OmniOne` UI는 **interoperability hypothesis simulation**이다. 검증되지 않은 native bridge·보장된 peg·source burn 후 destination mint를 지원 기술로 서술하지 않는다.
- G09-S 일반 Wallet 충전은 사용자가 선택한 USDC/USDT·signer·source/destination 단계를 보여주는 별도 샘플 확장이다. 기존 Labs 고정 quote는 읽기 전용이며 consumer credit의 source of truth가 아니다. 두 surface의 샘플 또는 실제 receipt를 혼용하지 않는다.
- bridge/전환을 실제 채택하면 source finality, destination finality, routing/attestation authority, custody, quote expiry, compensation/reconcile를 별도 adapter로 구현한다. source 성공으로 destination 자산을 임의 발행하지 않는다. 공식 지원 route가 없으면 실제 기능은 운영 전까지 비활성으로 두되 데모는 명시적 샘플 상태로 전체 분기를 보여준다.
- badge mint·자산 전송·OmniOne 증거는 서로 다른 작업이다. 같은 transaction hash로 셋을 완료 처리하지 않는다.

## 9. 배포 단위와 백엔드 책임

| 단위 | 책임·권장 경계 | 필요한 운영 항목 |
|---|---|---|
| Next.js web/BFF | public app, auth session, 입력 검증, provider-neutral API | HTTPS, CSP, origins, locale, 접근성, 로그 redaction |
| Identity/Policy | adapter, TrustProfile, credential lifecycle, verifier, service decision | issuer 신뢰·policy version·nonce store·status TTL·감사 |
| Commerce | quote/payment/funding/order/refund/voucher/settlement | durable ledger·transaction·webhook·idempotency·reconciliation |
| Data/Realtime | 장소·신호·Table membership·chat·uploads | freshness, rights, pagination, authz, moderation·retention |
| Chain worker | outbox·OmniOne/Sui submit·receipt 검증·DLQ | key custody, budget, RPC health, alert·재처리 권한 |

구현 참조 구성은 PostgreSQL의 durable transaction/ledger + 별도 worker/queue + private object storage다. Redis·특정 queue vendor·BFF 언어는 필수가 아니며 동일 불변식을 만족하는 팀 스택으로 ADR 확정한다. OpenDID는 선택한 공식 release의 서버/SDK 환경 요구를 별도로 따른다. 데모 browser state를 운영 DB로 복사하지 않는다.

설정 이름·키·네트워크 placeholder 및 기술별 제출 증거는 [Integration Matrix](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md)에 있다. 현재 확인되지 않은 공급자 endpoint/secret 값은 발명하지 않는다.

### 미확정 ADR

아래 8개 범주는 모두 미확정이다. 이 표는 릴리스·네트워크·실제 bridge를 선택하는 표가 아니며, 각 결정 전에는 샘플/가설만 노출한다.

| ID | 담당 owner | 결정이 필요한 것 | 결정 지연 시 영향 / 완료 전 통제 |
|---|---|---|---|
| ADR-AUTH-01 | Product + Platform | app account provider, cookie/복구/merge, 계정 경계 | 저장·복구·삭제 API를 운영화할 수 없음; Person proof와 account를 분리 |
| ADR-DID-01 | Identity lead + provider liaison | OpenDID release, schema/type, trust domain, holder platform/handoff | 실제 VP/보관 완료 주장 금지; issuer·holder·verifier adapter를 계약 상태로 유지 |
| ADR-AGE-01 | Policy + Identity | 적용 서비스 연령정책, cutoff·시간대, CX AdultVerify semantics | 접근제어 오판 위험; 샘플 policy로만 표시하고 실제 gate 전 검증 |
| ADR-RESIDENCE-01 | Identity + Legal/Provider | active provider, test credential, claims·assurance·fallback | 여권으로 체류허가 추정 금지; provider별 지원/미지원 상태로 유지 |
| ADR-PAYMENT-01 | Commerce + Risk/Finance | rail/processor, 자산의 법적 성격, FX·fees·custody·limits, KYC 정책 | 샘플 자금만 사용; 결제·funding·환불·상환을 운영 성공으로 표시하지 않음 |
| ADR-CHAIN-01 | Chain + Security | OmniOne network/ABI/compiler/roles/key·finality 및 불변식 | 실제 contract/receipt 검증 전 `SIMULATED`; chain 기록을 지급 완료로 표시하지 않음 |
| ADR-SUI-01 | Sui owner + Product/Risk | signer·salt/prover·gas·Move/asset 및 bridge/routing/attestation/custody·상환 authority | native bridge/peg·source→destination 완료 주장 금지; Labs와 Wallet receipt를 분리 |
| ADR-DATA-01 | Data + Privacy/Product | 수집 rights, signal 정의/freshness, canonical mapping, 개인정보 TTL | 샘플 replay를 live 혼잡도로 표시 금지; 사진·정확 위치·DID 원문은 공개하지 않음 |

### 9.1 Traveler pulse / 음식 리서치 — 2026-09-09 추가 경계

프런트 구현·검수 기록: [Traveler pulse 릴리스](./TRAVELER_PULSE_2026-09-09.md). 장소별 조사 원본은 `k-tour-id-app/data/ondo/research/{seoul,busan,jeju}-food-pulse.json`이며 공식 디렉터리와 별도 데이터셋이다.

| 플로우 | 현재 목업 | 실제 백엔드 개발 |
|---|---|---|
| 지도에서 방문·사진·분위기 이벤트 보기 | 같은 재생 프레임에서 계산한 30분 샘플 집계와 좌표 고정 이벤트. `origin=PREPARED_ILLUSTRATION`, `observedAt=null` | 시간창 집계·감쇠·중복 제거·최소 공개 집계수, 늦은 이벤트 보정, SSE/WS 또는 폴링 cursor·resume·stale 상태. 실제 수집 전 live 라벨 금지 |
| 장소에서 나도 분위기 남기기 | 기존 local-signal/DID 샘플 분기로 연결. 기기 내 메모와 전역 샘플 집계를 별도 표시 | 인증·권한·idempotency, 장소 ID 결합, 제출 nonce/replay 방지, 악성 리뷰/스팸 rate limit, moderation·삭제·보존 정책 |
| DID 검증 방문 기반 신뢰 | 샘플 방문 수는 DID 증거/자격/평판을 생성하지 않음 | OpenDID VP 검증·상태/만료·서비스 정책과 업무 이벤트 결합. CX 신원확인은 물리적 방문 증거가 아니므로 별도 방문증명 정책이 필요. 검증된 이벤트만 OmniOne outbox로 제출하고 receipt/finality를 대사. Sui badge는 기존 선택적 milestone 조건을 별도 검증 |
| 음식 사진 | 기존 소유 음식 예시 이미지에 명시적 라벨. 실제 매장/사용자 사진 아님 | 업로드 동의·image MIME/크기 검사·EXIF 제거·비공개 원본 저장·검수·파생 이미지/CDN·사용권·삭제 전파. 임의 외부 hotlink 금지 |
| 조사된 식당·카페·바 24곳 | 도시별 8곳, EN/KO/JA 이름/지역/메뉴 힌트, 출처와 좌표, 목록·상세·길찾기·지도 이동. 기존 18곳의 checkedAt=2026-09-09는 보존, 새 6곳만 2026-09-11. 현재 작업본 기준이며 9월 10일 공개판은 18곳 | editorial ingest schema·재검증·폐점/이전 이력·중복 canonical 매칭 승인·사진 권한 관리. 수상/관광 소개를 실시간 인기·예약 가능·연령 자격으로 승격하지 않음 |

개인별 이동 경로·DID·국적·원본 VP·정확한 사용자 위치를 공개 활동 지도나 온체인 metadata에 싣지 않는다. 공개 지도에는 장소 단위로 집계된 신호만 노출한다. `checkedAt`은 리서치 확인일이며 영업 확인·방문 시각이 아니다. 현재 연구 데이터의 `photo`와 `canonicalVenueId`는 모두 null이고, 매장 실사진 권한과 공식 기록 매칭은 미확정이다. 예약을 받지 않는다고 확인된 Living Room Bar 등에 예약 CTA를 자동 생성하지 않는다.

## 10. 검수·인계 완료 조건

### 목업 완료 조건

- G01~G13마다 실제 B 진입점, 이전/다음 화면, 성공·취소·오류·재시도·재진입 fixture, browser test, screenshot/video가 연결된다.
- 핵심 DID 반례는 §3.2 전부 검수한다. UI 색만 바뀌고 서비스 action은 같으면 실패다.
- 모바일 320/360/390/430px, 짧은 높이·키보드·가로모드, KO/EN/JA, light/dark × After 19에서 CTA 겹침·잘림·읽을 수 없는 대비가 없다.
- UI에서 보여준 claim/목적/금액과 실제 샘플 operation이 같다. gate 완료 후 action은 1회만 수행한다.
- legacy 파일·문자열 contract test만으로 flow 완료 처리하지 않는다. standalone 배포 후보의 실제 route/surface를 검수한다.

### 실제 연동 완료 조건 — 별도 백엔드 작업

- CX 실제/공식 sandbox Holder 응답, OpenDID issue/holder/VP/verifier/status, 정책 allow/deny, payment/funding callback, chain receipt를 같은 operation 맥락으로 증명한다.
- 만료·철회·잘못된 claim/request·replay·다른 partner·중복 지급·반복 환불·chain outage·비정상 callback을 독립 검토자가 재현한다.
- demo와 provider 환경 데이터·키·route가 분리된다. 샘플 권한을 real API가 거절하는 테스트가 있다.
- source commit, build ID, 공유 URL, env manifest(값은 비공개), fixture version, 테스트 명령/결과, backend API/OpenAPI, schema migration, rollback runbook이 같은 릴리스에 묶인다.
- 실제 외부 연결이 없는 현 상태를 해커톤 공식 기술 활용 충족으로 자동 판정하지 않는다. 목업 completeness와 공식 제출 evidence는 별도 열로 관리한다.

### 작성 시점의 남은 작업

| 항목 | 상태 |
|---|---|
| 기본 전체 demo·K-Pass claim 기반 service 분기·profile selector | 구현·계약 검증 완료. 배포형 브라우저 결과는 실행 현황 참조 |
| 독립 partner verifier·업무 연결 evidence·정산 | 신규 샘플 surface·상태 모델 구현, 실제 backend 필요 |
| rail별 funding | 4개 사용자 수단의 승인/영수증/복구 구현, 실제 provider 필요 |
| 식당 예약/부분환불·별도 authorize/capture | 샘플 구현 및 기존 f79 기준선 commerce 검수 PASS. 이전 기능 검수 기준 `e2ad7c4`의 실행 범위·제한은 [매장 After 19 겹침 수정 릴리스](./PLACE_AFTER19_FIX_2026-09-14.md)을 따르며 [9월 11일 검수](./FINAL_JOURNEY_QA_2026-09-11.md)와 합산하지 않는다. 실제 예약·주문 processor와 금전 원장은 별도 backend 필요 |
| 업무 event 기반 OmniOne outbox/receipt | 6개 event 샘플 연결 구현. 실제 submit/receipt 검증·durable worker는 backend 필요 |
| Sui signer/tx·cross-chain 실제 상태 대사 | Labs 샘플 존재, 실제 연결 없음 |
| 모바일·adversarial·최종 공유 URL QA | **브랜딩 전용 `cc3d7c3`:** 이번 로컬 검수는 관련 계약44/44·typecheck·production build/scan·HTTP probe(공개 자산41개)·mobile/desktop 브랜드 E2E6/6(workers1/retries0) PASS다. 최종 운영 검수는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. **마지막 기능 흐름 검수 `e2ad7c4`:** 계약833/833·After 19 로컬5/5·운영5/5 PASS는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)의 역사적 증거다. 이전 `82ea4c9`의 공개 mobile12개/desktop·tablet2개·계약826개는 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)에 보존하며 합산하지 않는다. 전체 여정 재검수·실제 iPhone Safari/Android·provider handoff 검수가 아님 |

이 문서에는 완료율을 부여하지 않는다. 상태는 해당 commit의 재현 가능한 증거가 생긴 뒤에만 갱신한다.

## Appendix A. G01–G13 인계 추적 요약

이 표는 기존 FL/REQ를 유지한 compact trace다. 경로는 `k-tour-id-app/` 기준이며 표의 `B/`는 `features/ondo/`를 뜻한다. 현재 source/runtime `cc3d7c3`의 브랜딩 전용 배포·검사는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md), 마지막 기능 흐름 검수 `e2ad7c4`의 After 19 결과는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)를 따른다. 이전 `82ea4c9` 결과는 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)에 보존한다. G01/G02 진입의 `d9eda4f` 결과는 [지도 우선 진입 기록](./MAP_FIRST_ENTRY_2026-09-14.md)의 역사적 증거다. 아래 G별 상세 검수는 **역사적** [9월 11일 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)의 프리뷰 기준선174개·수정 영향27개다. 각 행의 “현재/최신”은 그 기록 당시 범위이며 새 운영 URL 실행으로 합산하지 않는다. `52f376e` 운영 증거는 [이전 운영 기록](./PRODUCTION_RELEASE_2026-09-12.md)에 보존한다. 최초 실패와 재실행 조건을 제외하고 모두 첫 실행 PASS로 읽지 않는다. 관련 test 열은 공개 `/` suite와 계약의 소스 연결점이며 파일 존재 자체가 실행 또는 PASS 증거는 아니다. `3dc392b`는 [9월 10일 릴리스](./PROTOTYPE_COMPLETION_2026-09-10.md), `a45400f`·`996119f`·`5233816`/v3.2도 역사적 기록이다. FE gap은 프런트·provider handoff 관점의 남은 표면이며 backend 작업 전체를 반복하지 않는다.

| G | 기존 FL / REQ · 사용자 결과 | 실제 공개 진입 / component | fixture·관련 test | FE gap (backend 전체 아님) | BE / H | provider / ADR | 현재 proof status |
|---|---|---|---|---|---|---|---|
| G01 | FL-001; REQ-007/017/019 — 빈 저장소→전국→선택 도시 온도 지도. 질문·자동 매장 preview 없음 | 공개 `/` → `B/app/ondo-app-b.tsx`, `B/map/map-entry-b.tsx`, `B/map/b-discovery-focus.ts` | `tests/contracts/ondo-map-first-entry.spec.ts`; `tests/e2e/ondo-map-first-entry.spec.ts`, `ondo-b-onboarding-personalized-map.spec.ts` 및 기존 map/history/recovery 검사 | 실제 realtime/provider signal·tile capability 미연결. error fallback resize를 ready로 위장하지 않음 | BE-11 / H16 | MapLibre·장소 adapter / ADR-DATA-01 | 현재 진입/resize·후보별 실행·운영 범위는 [지도 우선 진입 릴리스](./MAP_FIRST_ENTRY_2026-09-14.md). [이전 G01 검수](./FINAL_JOURNEY_QA_2026-09-11.md)는 역사적 별도 증거 |
| G02 | FL-007/008/009 — 명시적 선택형 설정·취향 편집, 취소는 기존 값 보존·완료만 저장 | 공개 `/` 지도 옵션/Settings → `B/onboarding/official-directory-onboarding.tsx`, `B/settings/settings-entry-b.tsx`, `B/shared/state/ondo-b-provider.tsx` | `tests/contracts/ondo-map-first-entry.spec.ts`, `ondo-wave2-onboarding-state.spec.ts`; `tests/e2e/ondo-map-first-entry.spec.ts`, `ondo-b-onboarding-personalized-map.spec.ts` | NEW에서 강제 설문 없음, 선택형 설정도 매장 preview 없음. NEW/COMPLETE 취소·legacy IN-PROGRESS reload에서 취향 보존. 실제 계정 sync 미연결 | BE-11 / H16 | preference adapter / ADR-AUTH-01, ADR-DATA-01 | 현재 계약·새5개·기존 회귀의 source별 결과는 [지도 우선 진입 릴리스](./MAP_FIRST_ENTRY_2026-09-14.md). [이전 G02 검수](./FINAL_JOURNEY_QA_2026-09-11.md)와 합산하지 않음 |
| G03 | FL-001/011/016; REQ-013/017 — 장소 facts·출처·방문 전 정보를 보고 길찾기/원 장소로 복귀 | 공개 `/` 장소 sheet → `B/place/canonical-place-overlay.tsx`, `B/map/japan-first-discovery-b.tsx`; `/api/ondo/venues/{venueId}` | `tests/e2e/ondo-previsit-polish.spec.ts`, `ondo-traveler-food-pulse.spec.ts`, `ondo-local-signal-public-completion.spec.ts`; `tests/contracts/ondo-venue-detail-server.spec.ts` | 이미지 권리·출처 freshness/provider data는 미연결. 실제 매장 정보와 로컬 음식 예시 image는 구분 | BE-11 / H16 | official directory/editorial adapter / ADR-DATA-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G03 상태·실행 범위·증거를 따른다. 장소·음식·로컬 기여의 최신 영향 범위 PASS 증거이며 실제 provider data 검증과 구분 |
| G04 | FL-010/011/015; REQ-008/015 — 필요한 순간 계정·저장·My Korea·자기선택 프로필로 복귀 | 공개 `/` ID/My Korea → `B/identity-b/account-save-gate-b.tsx`, `B/my/korea-memory-map-b.tsx`, `B/identity-b/profile-reputation-b.tsx` | `tests/e2e/ondo-b-account-save-gate.spec.ts`, `ondo-b-my-korea-restoration.spec.ts`, `ondo-end-output-coverage.spec.ts` | mock local storage/profile은 구현. auth callback·server sync·provider deletion handoff는 미연결 | BE-01, BE-12 / H17 | auth/storage adapter / ADR-AUTH-01, ADR-DATA-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G04 상태·최초 실패/재실행·증거를 따른다. public sample/local storage 범위이며 실제 auth/sync 증거가 아님 |
| G05 | FL-005/006; REQ-001/002/003/004/005 — 세 신원 경로에서 K-Pass 상태·복구를 보고 같은 행동으로 복귀 | 공개 `/` ID sheet → `B/identity-b/ktour-id-setup-b.tsx`, `B/identity-b/passport-ocr-step-b.tsx`, `B/identity-b/local-check-walkthrough-b.tsx` | `tests/contracts/ondo-identity-journey-samples.spec.ts`, `ondo-kpass-proof-recovery.spec.ts`; `tests/e2e/ondo-identity-demo-boundaries.spec.ts`, `ondo-did-demo-journeys.spec.ts`, `ondo-end-output-coverage.spec.ts` | implemented mock permission/return, Passport capture/NFC/face, holder ack. 실제 SDK/provider session·검증 결과·실제 holder receipt는 여전히 별도 | BE-02–04 / H01–H05 | CX, Passport, OpenDID / ADR-DID-01, ADR-RESIDENCE-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G05 상태·최초 실패/재실행·증거를 따른다. 공개 walkthrough와 자격 fixture 검수이며 실제 issuer/provider receipt가 아님 |
| G06 | 기존 holder/verifier; REQ-004/014 — 목적·최소 항목에 동의하고 파트너 요청이 service/credential/policy/audience/domain과 실제 action의 private venue/quote context를 혼동하지 않게 검증 | 공개 `/` Demo verify 탭 → `B/integration-demo-b/integration-demo-b.tsx`, `B/identity-b/action-gate-coordinator-b.tsx` | `tests/contracts/ondo-kpass-action-boundary.spec.ts`; `tests/e2e/ondo-integration-demo.spec.ts`, `ondo-did-demo-journeys.spec.ts`, `ondo-partner-handoff.spec.ts` | generic partner console의 mock은 service/credential/policy/audience/domain과 device setup·QR/camera·phone handoff/direct deeplink만 검증하며 merchant·venue·amount·quote 검증을 주장하지 않음. `B/identity-b/action-gate-contract-b.ts`의 checkout/Table action은 token snapshot·audience와 private venue/quote context를 이미 보존·binding한다. 실제 partner auth/device·OpenDID verifier·VP receipt 및 서로 다른 merchant/venue/amount/issuer에 대한 server-side request/resource/quote binding은 developer implementation 필요 | BE-05 / H06 | OpenDID verifier·partner adapter·request/resource/quote binding / ADR-DID-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G06 상태·최초 실패/재실행·증거를 따른다. generic mock QA이며 real partner auth/VP 또는 merchant/amount binding proof가 아님. action-bound checkout/Table contract는 별도 경계로 유지 |
| G07 | FL-002/013/014; REQ-012 — 필요한 행동에서만 연령 predicate를 확인하고 실패 시 같은 장소/Table로 복귀 | 공개 `/` After 19 + action gate → `B/after19/after19-global-b-model.ts`, `B/identity-b/action-gate-coordinator-b.tsx`, `B/map/map-entry-b.tsx` | `tests/contracts/ondo-kpass-age-recovery.spec.ts`, `ondo-b-global-after19.spec.ts`; `tests/e2e/ondo-kpass-age-recovery.spec.ts`, `ondo-kpass-service-journeys.spec.ts`, `ondo-temperature-appearance.spec.ts` | implemented mock readiness/age failure recovery; actual age provider/predicate handoff and receipt remain pending | BE-05 / H07 | CX AdultVerify/OpenDID predicate 후보 / ADR-AGE-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G07 상태·최초 실패/재실행·증거를 따른다. local predicate sample이며 실제 age proof가 아님 |
| G08 | FL-003/012; REQ-008/009/010 — Table 모임·chat·사진·안전과 실제 매장 예약을 각각 완주 | 공개 `/` Tables/place → `B/connect/tables-entry-b.tsx`, `B/connect/table-activity-b.ts`, `B/reservation-b/reservation-b.tsx` | `tests/contracts/ondo-reservation-sample.spec.ts`, `ondo-wave3-table-runtime.spec.ts`; `tests/e2e/ondo-end-output-services.spec.ts`, `ondo-end-output-coverage.spec.ts`, `ondo-commerce-retained-public.spec.ts` | Tables local meal plan과 actual restaurant booking은 별도 범위. mock confirmation/cancel/retry는 구현되었으나 실제 ReservationAdapter 확인번호·좌석 provider handoff는 미연결 | BE-09, BE-10 / H10 | realtime/upload + ReservationAdapter / ADR-AUTH-01, ADR-DATA-01 (결제 시 ADR-PAYMENT-01) | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G08(Table)·G08-R(예약) 상태와 증거를 각각 따른다. 실제 restaurant seat/partner receipt는 주장하지 않는다 |
| G09 | REQ-006/011 — 자격에 맞는 은행·카드·Apple Pay·stablecoin funding을 견적부터 영수증까지 확인 | 공개 `/` Wallet sheet → `B/commerce-b/id-wallet-commerce-b.tsx`, `B/commerce-b/funding-rail-model-b.ts`, `B/commerce-b/stablecoin-funding-b.tsx` | `tests/contracts/ondo-funding-rail.spec.ts`, `ondo-stablecoin-funding.spec.ts`, `ondo-funding-credit-boundary.spec.ts`; `tests/e2e/ondo-funding-rail-journeys.spec.ts`, `ondo-stablecoin-funding.spec.ts`, `ondo-complete-commerce-journey.spec.ts` | implemented mock explicit connect-permission/return and source/destination boundary; actual bank/card/Apple Pay/onramp capability, signer/provider handoff, asset metadata remain pending | BE-06, BE-15, BE-16 / H08, H13, H14 | payment/onramp + Sui signer / ADR-PAYMENT-01, ADR-SUI-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G09·G09-S 상태·최초 실패/재실행·증거를 따른다. signer permission·source/destination·credit 경계를 검수하며 실제 funding receipt는 주장하지 않는다 |
| G10 | FL-004/017; REQ-006/011/014 — quote·동의·결제·혜택·부분/전액 환불 결과를 원 장소/금액으로 복귀 | 공개 `/` Wallet/place checkout → `B/commerce-b/stable-commerce-model-b.ts`, `B/commerce-b/id-wallet-commerce-b.tsx`, `B/commerce-b/visit-stamp-receipt-b.tsx` | `tests/contracts/ondo-wave1-commerce-experience.spec.ts`; `tests/e2e/ondo-commerce-operations.spec.ts`, `ondo-complete-commerce-journey.spec.ts` | implemented mock approval/capture/refund and benefit boundary; processor token handoff·실제 order/benefit ledger는 미연결 | BE-07, BE-08 / H09 | payment processor/benefit adapter / ADR-PAYMENT-01, ADR-AGE-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G10 상태·최초 실패/재실행·증거를 따른다. funding credit와 결제 성공을 혼용하지 않으며 실제 processor/ledger 증거가 아님 |
| G11 | FL-016; REQ-004/014 — 혜택 사용·정산 대사·OmniOne 업무 event/receipt를 독립 상태로 확인 | 공개 `/` Demo partner/settlement 탭 → `B/integration-demo-b/integration-demo-b.tsx`, `B/integration-demo-b/integration-demo-model-b.ts` | `tests/contracts/ondo-settlement-support.spec.ts`; `tests/e2e/ondo-integration-demo.spec.ts`, `ondo-commerce-operations.spec.ts`, `ondo-settlement-support-history.spec.ts`, `ondo-complete-commerce-journey.spec.ts` | implemented sample event/receipt/retry states; actual outbox/worker/tx receipt/partner payout remains unconnected | BE-13, BE-14 / H11, H12 | OmniOne Chain worker/partner adapter / ADR-CHAIN-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G11 상태·최초 실패/재실행·증거를 따른다. event·정산·문의 history는 sample 검수이며 실제 tx/ABI/payout 증거가 아님 |
| G12 | FL-004/012/018; REQ-003/005/006/015/016 — 방문 근거·평판·10번째 unique visit opt-in badge를 자산/서명과 분리 | 공개 `/` Labs/profile → `B/labs/labs-entry.tsx`, `B/labs/labs-review-truth-b.ts`, `B/commerce-b/visit-stamp-receipt-b.tsx` | `tests/e2e/ondo-labs-public-samples.spec.ts`, `ondo-commerce-retained-public.spec.ts`, `ondo-complete-commerce-journey.spec.ts`; `tests/contracts/ondo-labs-public-samples.spec.ts` | implemented mock signer failure/retry and 9→10 opt-in badge; actual unique-visit evidence, signer intent/effects, Move receipt remain pending | BE-15, BE-16 / H13–H15 | Sui SDK/Move 후보 + chain evidence / ADR-SUI-01, ADR-CHAIN-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G12 상태·최초 실패/재실행·증거를 따른다. 고유 방문·opt-in·재진입은 sample/hypothesis 범위이며 실제 Move receipt가 아님 |
| G13 | 공통; REQ-018 — 언어·theme·After 19·reset·접근성·오류 복구 상태가 오염되지 않음 | 공개 `/` Options/Settings → `B/settings/settings-entry-b.tsx`, `B/settings/settings-model-b.ts`, `B/settings/account-services-sample-b.tsx`, `B/contracts/return-to-integrity.ts` | `tests/contracts/ondo-wave3-settings-mobile.spec.ts`, `ondo-map-options.spec.ts`; `tests/e2e/ondo-wave3-settings-mobile.spec.ts`, `ondo-end-output-coverage.spec.ts`, `ondo-end-output-services.spec.ts`, `ondo-temperature-appearance.spec.ts`, `ondo-city-chrome-compact.spec.ts` | implemented mock settings/reset/delete and same-DOM language path; account backend/session adapter and Safari/real-device proof remain pending | BE-01, BE-12 / H17 | auth/data adapter / ADR-AUTH-01, ADR-DATA-01 | [현재 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md#검수-방식과-현재-상태)의 G13 상태·실행 범위·증거를 따른다. settings 기준선 검수와 최신 appearance 회귀를 구분하며 product 오류와 외부 증거를 분리한다. Safari/WebKit·실기기는 미검증 |

## Appendix B. 기계 판독 가능한 handoff completeness

문서/추적표 확인과 실제 연동 완료를 분리한다. 체크된 문서 항목은 실제 provider 활용 완료를 뜻하지 않는다. 운영 증거 항목은 샘플 PASS나 API 설계만으로 체크하지 않는다.

<!-- ktour-handoff:v1 -->

- [x] `trace:G01`–`trace:G13`: Appendix A의 FL/REQ·공개 component·fixture/test·FE gap·BE/H·ADR·proof status가 모두 갱신됨
- [x] `release:current`: [현재 배포·인계 기록](./KTOUR_PRODUCTION_HANDOFF_2026-09-15.md)에 대표 URL·main·Harvey 브랜치·배포 상태를 분리 기록한다. 문서 연결 완료이며 배포·연동 완료 체크가 아니다.
- [x] `release:historical:cc3d7c3`: source/runtime `cc3d7c3`, [운영 앱](https://ondo-tau.vercel.app). 브랜딩 전용 production Ready이며 최종 deployment `dpl_Bf4rBwnqH5PpaHeMRW6NmM8y3Wk1`의 고유 주소·검수 범위는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. 기존 기능 검수와 실제 provider 완료는 별도다
- [x] `release:historical-separated`: `3dc392b`의 24개 공개 검사 및 `996119f`/v3.2 evidence는 historical로 표시하고 현재 PASS와 합산하지 않음
- [x] `fe:provider-sdk-handoff`: CX/Passport/OpenDID/payment/Sui/restaurant adapter·SDK handoff와 실제 API 경계가 기록됨 (연동 구현 완료 아님)
- [x] `mock:truth-boundary`: mock receipt·sample signer·local meal plan이 실제 provider receipt·signer·restaurant booking으로 표시되지 않음
- [x] `adr:unresolved`: ADR-AUTH-01, ADR-DID-01, ADR-AGE-01, ADR-RESIDENCE-01, ADR-PAYMENT-01, ADR-CHAIN-01, ADR-SUI-01, ADR-DATA-01 각각 owner/decision/impact가 있고 release/network/bridge를 선결정하지 않음
- [ ] `evidence:provider`: CX/Passport/OpenDID/processor/Sui/OmniOne의 redacted receipt·signature·status evidence가 실제 환경에서 재현됨
- [ ] `evidence:recovery`: 실제 provider 환경에서 cancel/timeout/unknown/retry/replay/expiry/revocation/duplicate payment·redemption을 같은 operation으로 재조회함
- [x] `qa:public`: **실행 범위별 판정** — 브랜딩 전용 `cc3d7c3`의 최종 운영 검사 상태는 [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md)를 따른다. 마지막 기능 흐름 검수 `e2ad7c4`의 운영 HTTP·After 19 공개 경로5/5(2.0분, workers1/retries0; project mismatch skip5개 제외) PASS는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)의 역사적 결과다. 이전 `82ea4c9`의 공개 mobile12개/desktop·tablet2개·계약826개는 [이전 지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md), [9월 11일 검수](./FINAL_JOURNEY_QA_2026-09-11.md)도 별도로 보존한다. 이전 또는 로컬 PASS를 새 운영 전체 여정 PASS로 이월하지 않는다
- [ ] `ops:backend`: OpenAPI/schema/migration/env manifest(비밀값 제외)/RBAC/idempotency/outbox-DLQ/reconcile/rollback가 Backend checklist와 같은 release에 묶임
