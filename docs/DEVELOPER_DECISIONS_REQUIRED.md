# 개발자 결정·확인 목록

> **역사적 ADR 후보 목록 — 현행 gate 목록 아님.** 현재 담당자가 확정할 8개 ADR 범주는 [DEPLOYMENT_SPEC §9](./DEPLOYMENT_SPEC.md)에 있다. 아래 옛 ID와 미확인 별도 Sui 프로그램 조건을 현재 목업 완료의 추가 조건으로 적용하지 않는다. 작업 순서는 [개발자 시작 문서](./DEVELOPER_START_HERE.md)를 따른다.

상태: `Architecture Gate 입력 문서`

제품팀이 개발 결과를 고정해 두었지만, 아래 상세 사양은 현재 자료만으로 단정할 수 없다. 담당 개발자는 구현 전 ADR 또는 공급자 확인서로 확정해야 한다. `P0` 결정이 미승인인 상태에서는 관련 기능을 `완료`로 표시할 수 없다.

## 1. 제출 형식

각 결정 문서는 아래를 포함한다.

- 결정 ID와 상태: proposed / approved / superseded
- 문제와 제약
- 검토한 대안과 채택/제외 이유
- 선택한 설계와 sequence/data diagram
- 보안·개인정보·법률 영향
- 실패·복구·운영·비용
- 테스트와 acceptance evidence
- owner, reviewer, 결정일, 재검토 trigger

## 2. P0 Architecture Gate

| ID | 결정할 내용 | 담당 | 통과 증거 |
|---|---|---|---|
| ADR-CORE-001 | 서비스 경계, source of truth, synchronous/outbox 흐름 | Tech Lead | C4/sequence, data ownership, failure table |
| ADR-CORE-002 | 서버 runtime, DB, queue/outbox, realtime chat, deployment | Backend/DevOps | topology, SLO, migration/rollback |
| ADR-AUTH-001 | 사용자·파트너·운영자 auth와 tenant/device binding | Security/Backend | session/token model, RBAC matrix, threat model |
| ADR-CX-001 | OmniOne CX hosted/on-prem 환경, base URL, service config, callback 방식 | Identity | 공급자 확인, sandbox smoke test |
| ADR-CX-002 | `coidentitydocument/comdl/comrc/coresidence` 실제 provider/version/claims | Identity | provider list와 test credential 결과 |
| ADR-EKYC-001 | Passport eKYC 공급자와 NFC/OCR/face/liveness/retention | Identity/Legal | API/SDK contract, DPIA/data flow |
| ADR-DID-001 | OpenDID DID method, VC format/schema, issuer governance | DID/Security | 공급자 사양, sample credential, issuer registration |
| ADR-DID-002 | holder key/storage/recovery와 credential delivery | Mobile/DID | device flow, lost-device test |
| ADR-DID-003 | VP/selective disclosure, trusted issuer, status/revocation | DID/Security | verifier E2E, replay/revoked tests |
| ADR-POLICY-001 | persona·서비스·혜택 policy language/version/override | Backend/Product | rule examples, reason codes, rollback |
| ADR-LEDGER-001 | asset types, double-entry, balances, idempotency/reconciliation | Payment/Backend | schema, invariants, concurrency tests |
| ADR-WALLET-001 | wallet custody/non-custody, key recovery, funding/on-off-ramp | Wallet/Security/Legal | custody diagram, lost-device/funding tests |
| ADR-PAY-001 | 실제 결제 자산·수단·수탁·충전·환불·AML/KYC 책임 | Product/Legal/Payment | partner/legal decision, money flow |
| ADR-PARTNER-001 | mobility/delivery/pickup/reservation adapter contract | Integration | OpenAPI, webhook auth, error mapping |
| ADR-EVENT-001 | canonical event, HMAC/pseudonym, outbox, retention | Backend/Security | schemas, PII review, retry/DLQ |
| ADR-OMNI-001 | OmniOne Chain network, contract/API, receipt, upgrade key | Chain | actual test tx/explorer receipt |
| ADR-SUI-001 | Sui stack 2개 이상, Move object/PTB/auth/gas/provenance | Sui/AI/Security | [Sui 브리프](./SUI_INTEGRATION_BRIEF.md) 전체 항목 |
| ADR-AI-001 | 모델/provider, data minimization, tool/capability, evaluation | AI/Security | threat model, eval set, cost/fallback |
| ADR-DATA-001 | PII inventory, purpose/retention/deletion/transfer | Privacy/Legal | data map, retention schedule, DPA |
| ADR-LOC-001 | 위치 정밀도, client/server use, TTL, analytics, background 금지 | Mobile/Privacy | permission UX와 network inspection |
| ADR-SOCIAL-001 | chat backend, moderation, report evidence, retention, age policy | Backend/Trust & Safety | authorization/abuse test, runbook |
| ADR-EVIDENCE-001 | LIVE/SANDBOX 판정과 receipt verification/권한 | Backend/QA | evidence schema, spoofing tests |

## 3. Sui에서 반드시 개발자가 정의할 항목

제품팀 요구는 “Sui를 사용한다”가 아니라 아래 결과를 실제로 만든다는 뜻이다.

### 3.1 기술 선택

- [ ] `zkLogin / PTB / Walrus / DeepBook` 중 최소 2개를 선택했다.
- [ ] 선택한 각 기능이 K-Tour ID의 실제 사용자/사업 문제를 해결한다.
- [ ] DeepBook을 선택했다면 실제 liquidity/FX 필요, token pair, slippage, fee, failure/refund를 설명했다.
- [ ] Walrus를 선택했다면 공개 가능 데이터와 encryption/key/retention을 설명했다.

### 3.2 Move 설계

- [ ] package/module/API와 object ownership을 정의했다.
- [ ] agent/voucher/decision/execution capability의 생성·사용·폐기를 정의했다.
- [ ] admin/upgrade/pause capability 보관·다중승인·rotation을 정의했다.
- [ ] nonce/idempotency/expiry/versioning 불변식을 Move가 강제한다.
- [ ] PTB 안의 원자성과 외부 결제·OpenDID·provider의 saga를 분리했다.

### 3.3 인증·운영

- [ ] zkLogin OAuth provider, `aud`, salt, prover, ephemeral key, `maxEpoch`, 복구를 정의했다.
- [ ] sponsored transaction/gas station의 한도·abuse 방지를 정의했다.
- [ ] Testnet/Mainnet RPC/indexer/finality/reconciliation을 정의했다.
- [ ] package ID/tx digest/object ID를 Evidence와 README에 연결했다.

### 3.4 Agentic AI

- [ ] agent가 보유/위임받는 capability의 scope·amount·expiry를 정의했다.
- [ ] 사용자 승인 전후 변경 시 재승인 규칙을 정의했다.
- [ ] model/prompt/policy/input/output/action provenance의 canonical manifest를 정의했다.
- [ ] AI 실패·hallucination·prompt injection·duplicate action을 테스트했다.

## 4. 공급자에게 즉시 확인할 질문

### OmniOne CX

1. 해커톤 팀별 CX/VC-Verifier 설치 또는 hosted endpoint와 credential은 무엇인가?
2. origin/IP/callback/service code allowlist가 필요한가?
3. `coresidence`가 활성인가? 실제 provider ID/version과 테스트 외국인등록증은 무엇인가?
4. QR/WEB2APP/APP2APP의 지원 OS·앱·direct mode·TTL은 무엇인가?
5. 결과 token parsing에서 요청 가능한 최소 claims와 ZKP mode 범위는 무엇인가?
6. callback/webhook이 없고 polling만 가능한 경우 권장 interval/rate limit은 무엇인가?

### OpenDID

1. issuer, schema, DID 등록을 누가 어떻게 하는가?
2. 지원 VC format과 credential/status 표준은 무엇인가?
3. holder는 전용 wallet SDK, app wallet, web wallet 중 무엇을 쓰는가?
4. selective disclosure와 predicate/ZKP를 실제 지원하는가?
5. verifier trust registry, DID resolution, caching/outage 정책은 무엇인가?
6. suspend/revoke/renew와 lost-device recovery를 어디까지 제공하는가?
7. 샌드박스 receipt와 테스트 credential의 검증 방법은 무엇인가?

### OmniOne Chain/해커톤

1. network/RPC/explorer/contract deployment/rate limit은 무엇인가?
2. 허용 event payload와 PII 정책은 무엇인가?
3. 필수 Mobile ID 시연과 OpenDID/chain 선택과제의 평가 증거는 무엇인가?
4. 단기 여권 경로와 국내 Mobile ID 필수 시연을 별도 보여줘야 하는가?

### Sui program

1. 현재 DeepSurge 제출·등록 상태와 마감 연장이 있는가?
2. 2개 기술 통합의 증빙 기준과 Walrus/DeepBook 인정 범위는 무엇인가?
3. Agentic AI의 최소 onchain ownership/autonomy 요건은 무엇인가?
4. Sui Foundation case study/오픈소스/수상 연계 검증 형식은 무엇인가?

## 5. 제품·사업·법률 결정

| ID | 결정 | 미결정 시 처리 |
|---|---|---|
| BIZ-001 | K-Tour ID VC 법적 발급 주체·책임 | sandbox/demo issuer만 |
| BIZ-002 | Passport eKYC controller/processor·국외이전·retention | 실제 여권 onboarding 금지 |
| BIZ-003 | KRW/stablecoin/point/prepaid asset의 법적 성격 | 명시적 demo balance |
| BIZ-004 | 충전·환불·미사용잔액·수수료·AML | 실결제 금지 |
| BIZ-005 | 브랜드/API/로고 사용·고객지원·SLA 계약 | 연동 예시·simulation |
| BIZ-006 | 지자체 campaign 예산·자격·이의제기 | fixture policy |
| BIZ-007 | 집계 관광 데이터·광고의 동의/재식별/판매 | 수집·판매 금지 |
| BIZ-008 | 액티비티 age/safety/moderation 운영 주체 | 제한된 sandbox |

## 6. 결정 완료 Gate

G0를 통과하려면:

- P0 ADR 모두 owner가 있고 `approved` 또는 명확한 sandbox fallback이다.
- 공급자 미응답 항목은 UI/API에서 `not configured`로 드러난다.
- 제품·법률 결정이 없는 금전/신원/브랜드 기능은 live scope에서 제외된다.
- OpenAPI/schema/state machine/sequence가 서로 일치한다.
- threat model, data inventory, test plan이 구현 backlog에 연결된다.
