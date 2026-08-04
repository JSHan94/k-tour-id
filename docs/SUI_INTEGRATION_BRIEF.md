# K-Tour ID × Sui 개발 브리프

상태: `필수 개발 범위 · 상세 설계는 개발자 확정`

이 문서는 Sui 에코시스템 빌더 지원 프로그램의 기술 요건을 K-Tour ID 개발 범위에 포함하기 위한 제품 브리프다. 제품팀은 결과와 검수 기준을 고정하고, 개발자는 실제 구현 사양을 ADR로 정의한다.

## 1. 전제와 주의사항

- Sui 특별 바운티는 사용자가 전달한 프로그램 안내를 기준으로 기록했다. 해커톤 주관사의 공식 기술 트랙이나 공식 후원으로 표현하지 않는다.
- 바운티 지급은 공식 해커톤 1~3위 수상 등 외부 조건에도 의존한다. 이는 제품 개발 완료 기준과 별개다.
- 전달받은 참가 신청 마감은 `2026-05-31`이며 이 문서 작성일보다 이전이다. 참가/등록 상태와 최신 프로그램 조건은 제출 전에 담당자가 다시 확인해야 한다.
- Sui 구현은 OmniOne CX, OpenDID, OmniOne Chain 요구를 대체하지 않는다. 각 기술은 독립된 역할과 증거를 가진다.
- 현재 루트 제안서에는 팀 연락처·생년월일 등 공개 저장소에 부적절한 정보가 포함돼 있다. Sui의 공개 GitHub 요건을 충족하기 전 sanitized proposal/deck만 남기고 원본은 접근 통제된 보관소로 이동해야 한다.
- 공식 Sui 문서는 Sui가 Move 기반의 객체 중심 플랫폼이라고 설명한다. zkLogin은 OAuth를 이용해 seed phrase 없이 Sui 주소로 트랜잭션하는 온보딩 primitive이며, PTB는 여러 Move/객체 명령을 하나의 트랜잭션으로 조합한다.
- Walrus의 blob은 기본적으로 공개되고 native confidentiality를 제공하지 않는다. PII나 원본 credential을 올리지 않는다.
- DeepBook은 spot/margin/prediction market용 liquidity layer다. 실제 환전·유동성 요구가 없으면 억지로 선택하지 않는다.

공식 기술 기준:

- Sui: <https://docs.sui.io/>
- Sui objects: <https://docs.sui.io/develop/objects/>
- zkLogin: <https://docs.sui.io/sui-stack/zklogin-integration/>
- PTB commands: <https://docs.sui.io/references/ptb-commands>
- DeepBook: <https://docs.sui.io/onchain-finance/deepbook/>
- Walrus: <https://docs.wal.app/>
- Walrus data security: <https://docs.wal.app/docs/data-security>

## 2. 필수 결과 요구사항

| ID | 요구 결과 | 최소 증거 |
|---|---|---|
| SUI-CORE-01 | K-Tour ID의 핵심 로직이 포함된 Move package를 Sui Testnet 또는 Mainnet에 배포 | source, `Move.toml`, package ID, explorer URL, publish digest |
| SUI-CORE-02 | Generic EVM bridge 없이 Move module을 직접 구현 | module source, build/test log |
| SUI-CORE-03 | zkLogin·PTB·Walrus·DeepBook 중 2개 이상 실제 통합 | 각 기능의 성공 tx/blob/로그와 재현 절차 |
| SUI-AI-01 | Agentic AI가 온체인 자산/권한을 소유 또는 명시적으로 위임받아 제한된 행동을 실행 | agent identity/capability object, policy, user approval, action receipt |
| SUI-AI-02 | AI 결정 입력·정책·모델/프롬프트 버전·출력·실행 결과의 provenance와 위변조 검증 | canonical hash, Sui object/event, 검증 스크립트 |
| SUI-PRIV-01 | Sui/Walrus에 개인정보·VC 원문·여권·생체·민감 결제 설명을 저장하지 않음 | 데이터 인벤토리, chain/blob scan, redaction test |
| SUI-OPS-01 | 중복 제출, 실패, 만료, gas 부족, RPC 지연, tx 불확정에 대한 복구 | idempotency test, retry/reconcile runbook |
| SUI-SUB-01 | 공개 저장소와 재현 가능한 README 제공 | clean checkout부터 testnet 실행까지 절차 |
| SUI-SUB-02 | DeepSurge 등록·최종 제출 | 프로젝트 URL/제출 확인 |
| SUI-SUB-03 | “왜 AI 앱에 Sui가 적합했는가” 1페이지 case study | PDF/Markdown 최종본 |

## 3. 권장 기준 시나리오 — 구속력 없는 기본안

개발자가 더 나은 설계를 제안할 수 있다. 다만 아래 조합은 K-Tour ID의 사용자와 해커톤 요건을 가장 자연스럽게 연결하는 기본 검토안이다.

```text
OpenCX / Passport eKYC
→ OpenDID K-Tour ID VC
→ AI가 혜택·여정 후보 계산
→ 사용자가 실행 범위·금액·만료를 승인
→ zkLogin 세션으로 Sui 주소 인증
→ PTB가 한 트랜잭션에서
   1) AgentDecisionReceipt 기록
   2) 1회성 BenefitExecution/Voucher object 소비
   3) 사용자/파트너용 실행 event 발생
→ 오프체인 서비스·결제 실행
→ reconcile 결과와 공급자 receipt hash 연결
```

권장 2개는 `zkLogin + PTB`다. Walrus는 공개 가능한 비식별 AI provenance manifest나 암호화된 대용량 artifact가 실제로 필요할 때 강한 세 번째 후보가 된다. DeepBook은 실제 stablecoin/FX liquidity 흐름과 법률·가격·slippage·refund 설계가 있을 때만 후보로 둔다.

이 기본안도 자동 승인되지 않는다. 개발자는 아래 ADR에서 온체인 원자성과 외부 결제/서비스의 비원자성을 분리해 설명해야 한다.

## 4. 개발자가 제출할 ADR-SUI-001

구현 시작 전에 다음을 한 문서로 제출하고 제품·보안 승인을 받는다.

### 4.1 선택과 문제 적합성

- 선택한 Sui 기능 2개 이상
- 각 기능이 해결하는 실제 K-Tour ID 문제
- 기능을 제거했을 때 사라지는 사용자/사업 가치
- 단순 바운티 체크리스트용 장식이 아닌 이유

### 4.2 객체·권한 모델

- package/module 이름과 책임
- address-owned/shared/immutable/wrapped 객체 선택
- 예: `AgentIdentity`, `AgentCapability`, `DecisionReceipt`, `BenefitExecution`, `PolicyRegistry`
- object owner와 생성·이전·소비·폐기 권한
- admin/upgrade/pause capability 보관과 다중승인 여부
- replay 방지 nonce, expiry, version, idempotency key

이 예시는 필수 타입명이 아니다. 개발자가 불변식과 권한을 기준으로 정의한다.

### 4.3 트랜잭션 경계

- PTB 안에서 실제로 원자적인 명령 목록
- PTB 밖의 OpenDID, 결제, 파트너 주문, OmniOne Chain 처리
- 외부 호출 전/후 순서와 saga/compensation
- 사용자가 서명하기 전에 보게 되는 amount, provider, action, expiry
- tx digest를 내부 `operationId`와 연결하는 방식

### 4.4 인증·키·가스

- zkLogin provider와 `aud` 관리
- ephemeral key, `maxEpoch`, prover, user salt 보관·백업·분실 복구
- OAuth identity와 K-Tour identity를 동일인으로 연결하는 최소정보 방식
- sponsored transaction 또는 gas station 여부, 한도, abuse 방지
- agent key/capability 보관과 회전·폐기
- RPC·indexer 공급자, timeout, finality/reconciliation 정책

Kakao zkLogin은 공식 문서상 Testnet/Mainnet 지원 여부가 Google/Apple 등과 다를 수 있으므로 현재 표를 확인한 뒤 고른다.

### 4.5 데이터와 개인정보

- 온체인 각 field의 분류: public / pseudonymous / confidential / restricted
- 직접 PII뿐 아니라 작은 후보군으로 재식별 가능한 해시 차단
- 전체 DID 대신 rotate 가능한 pseudonymous reference 사용 여부
- Walrus blob 공개 가능성, client-side encryption, key access, retention
- AI prompt/model/decision manifest에서 비밀·PII 제거
- 삭제 요구가 있는 데이터는 immutable public store에 넣지 않음

### 4.6 운영·업그레이드

- Testnet/Mainnet package IDs와 network config
- package upgrade policy와 upgrade cap custody
- event schema/versioning과 indexer backfill
- pause, incident response, key compromise recovery
- gas/RPC/Walrus 비용과 rate limit
- monitoring, explorer/evidence screen, alerting

### 4.7 테스트와 증거

- Move unit test와 불변식/negative test
- TypeScript integration test
- duplicate/replay/expired/unauthorized/gas-failure test
- Testnet E2E와 clean-wallet 재현
- package/tx/object/blob explorer 링크
- redacted screen recording과 제출용 evidence bundle

## 5. Agentic AI 안전 계약

AI가 실행 가능한 행동은 아래 envelope를 가져야 한다.

```json
{
  "decisionId": "dec_...",
  "agentRef": "agent_...",
  "policyVersion": "benefit-agent.v1",
  "modelManifestHash": "sha256:...",
  "inputManifestHash": "sha256:...",
  "proposedAction": "redeem_benefit",
  "targetRef": "campaign_...",
  "maxAmountKRW": 5000,
  "expiresAt": "...",
  "userApprovalId": "approve_...",
  "idempotencyKey": "..."
}
```

필수 규칙:

- 온체인에는 canonicalized redacted manifest의 hash와 실행에 필요한 최소 값만 둔다.
- 금액·수령자·혜택·만료는 사용자 승인 후 바뀌면 재승인한다.
- 정책 서비스는 AI 출력과 독립적으로 최종 자격을 다시 평가한다.
- AI는 개인키, salt, raw OAuth JWT, VC 원문을 보지 않는다.
- agent capability는 scope, amount, action, expiry로 제한하고 취소 가능해야 한다.
- 동일 `idempotencyKey`는 한 번만 소비한다.
- 실패 시 외부 주문·결제와 Sui object를 대사하며 자동 재결제하지 않는다.

## 6. OpenDID·OmniOne Chain과의 중복 방지

| 사실 | Source of truth | Sui에 남길 수 있는 것 |
|---|---|---|
| 사용자의 신원확인 결과 | CX/eKYC + K-Tour IdentityEvidence | PII 없는 evidence reference/hash |
| K-Tour ID VC 유효성 | OpenDID의 실제 status 메커니즘 | VC 원본이 아닌 credential class/status evidence reference |
| 혜택 자격 결정 | K-Tour Policy | policy version, decision hash, result code |
| 결제·환불·정산 | K-Tour/결제 provider ledger | final receipt hash와 operation reference |
| Track 제안서 감사 anchor | OmniOne Chain adapter | 동일 canonical event의 독립 Sui receipt 또는 agent-specific event |
| AI 실행 권한·provenance | 승인된 Sui Move 설계 | capability/decision/execution object와 event |

한 도메인 사건에서 Sui와 OmniOne Chain을 모두 쓸 경우 동일 canonical event ID를 outbox에서 각각 전송한다. 한 체인의 성공을 다른 체인의 성공으로 표시하지 않으며, `confirmed/pending/failed`를 독립적으로 대사한다.

## 7. 완료 판정 체크리스트

- [ ] `sui move build`와 `sui move test`가 clean checkout에서 성공한다.
- [ ] 실제 Testnet/Mainnet package ID가 README에 있다.
- [ ] Move module이 제품의 핵심 불변식을 강제한다.
- [ ] 선택한 Sui 기능이 2개 이상이며 둘 다 실제 사용자 플로우에서 호출된다.
- [ ] Agentic AI 행동에 사용자 승인·정책·capability·실행 receipt가 있다.
- [ ] 성공 tx 3회와 핵심 실패 tx/테스트가 재현된다.
- [ ] 동일 요청 10회 재전송에도 실행 객체/바우처 소비가 한 건이다.
- [ ] 개인정보와 secret이 Sui/Walrus/RPC 로그에서 검출되지 않는다.
- [ ] RPC/indexer 지연과 tx 미확정 상태가 UI/운영 도구에 표시된다.
- [ ] OpenDID·OmniOne Chain·결제와 상태 불일치가 대사된다.
- [ ] DeepSurge, public GitHub, README, 1페이지 case study가 준비됐다.
- [ ] public branch/history와 release artifact에 팀원 PII, API secret, provider credential이 없다.

## 8. 사용자 제공 프로그램 메모

| 공식 해커톤 수상 등급 | 전달받은 Sui 추가 격려금 |
|---|---:|
| 대상 1위 | 1,000만 원 상당 |
| 최우수상 2위 | 700만 원 상당 |
| 우수상 3위 | 500만 원 상당 |

추가 리소스:

- Sui Korea builder community: <https://go.sui.io/sui-kr-may2026>
- Telegram developer bot: `@sui_devrel_agent_bot`
- DeepSurge submission: <https://www.deepsurge.xyz/hackathons/d3da2166-edab-4af2-b750-4c8d29f4b12a>

금액·일정·등록 링크·지원 조건은 제출 직전 프로그램 운영자에게 다시 확인하고, 외부 수상 조건을 소프트웨어 acceptance로 오인하지 않는다.
