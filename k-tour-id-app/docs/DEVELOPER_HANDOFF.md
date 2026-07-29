# K-Tour ID 개발 핸드오프 명세

상태: `v1.0`
대상: 제품·디자인·프론트엔드·백엔드·모바일·DID·결제·보안·QA 담당자
목표: 해커톤 결선에서 `Mobile ID -> K-Tour VC -> 선택적 공개 VP -> 혜택 사용/정산 증거`가 실제로 닫히는 MVP를 구현한다.

이 문서가 제품 범위와 기술 계약의 기준 문서다. 구현과 발표가 다를 경우 구현 상태를 낮춰 표시하며, 화면이나 발표 문구로 미구현 기능을 실제 연동처럼 표현하지 않는다.

## 0. 변하지 않는 사실과 용어

| 항목 | 확정된 설명 | 금지 표현 |
|---|---|---|
| OmniOne CX | 국가 모바일 신분증을 제출받고 검증하기 위한 연동 경로 | 여권 eKYC도 CX가 수행한다 |
| 단기 외국인 관광객 | 별도의 전자여권 NFC/OCR, 얼굴·라이브니스 eKYC로 최초 신원을 확인 | 여권만으로 국가 모바일 외국인등록증을 발급한다 |
| 모바일 외국인등록증 | 한국에 외국인등록을 마친 대상자가 국가 시스템에서 발급받는 모바일 신분증 | K-Tour ID가 외국인등록증을 발급한다 |
| K-Tour ID VC | K-Tour ID 또는 지정 제휴 발급자가 서비스 이용 자격을 담아 발급하는 민간 VC | 정부 신분증, 비자, 입국·체류 허가, 공식 외국인등록증 |
| OpenDID | K-Tour ID VC의 발급·보관·제시·검증에 사용하는 DID/VC 인프라 | 여권 진위·얼굴·라이브니스를 자동 검증하는 eKYC 제품 |
| OmniOne Chain | 개인정보가 제거된 신뢰 이벤트 해시와 감사 영수증을 앵커링하는 원장 | 결제 원문·여권번호·VC 원본을 저장하는 DB |
| KRW wallet | 결제 사업자·법률 검토가 완료된 레일에 붙는 별도 도메인 | 여권 데이터만으로 실제 지갑·실명계좌가 자동 개설된다 |
| Demo state | 각 기능을 `LIVE`, `SANDBOX`, `SIMULATED` 중 하나로 표시 | mock을 실제 OmniOne/OpenDID/제휴사 처리처럼 표시 |

`Visitor VC`는 이 문서에서 `K-Tour ID Credential`로 통일한다. 여행자에게 이해하기 쉬운 화면명은 `K-Tour ID`, 기술 화면명은 `KTourVisitorCredential`을 사용한다.

## 1. 제품 범위

### 1.1 핵심 문제

여행자는 신원확인, 서비스 자격, 혜택 사용, 결제와 정산 증거가 서로 단절돼 있다. K-Tour ID는 서로 다른 최초 신원확인 결과를 하나의 민간 서비스 자격 VC로 정규화하고, 가맹점에는 필요한 자격만 VP로 제시한다.

핵심 성과는 슈퍼앱의 기능 개수가 아니라 다음 루프의 완결성이다.

```text
신원확인 -> K-Tour ID 발급 -> 최소정보 VP 검증 -> 혜택/결제 승인 -> 정산 감사 증거
```

### 1.2 MVP에 포함

- 국가 모바일 신분증을 이용한 실제 또는 공식 샌드박스 본인확인
- 단기 여행객을 위한 별도 여권 eKYC 어댑터 계약과 시뮬레이션
- OpenDID 기반 K-Tour ID VC 발급·보관·상태 확인
- 가맹점 요청 QR/deep link, 공개 항목 동의, VP 제출·검증
- 정책 기반 혜택 자격 판단과 1회성 바우처 사용
- 결제 어댑터의 승인·실패·환불 상태 모델
- 개인정보 없는 이벤트 해시 앵커와 검증 가능한 실행 증거
- 상태별 `LIVE / SANDBOX / SIMULATED` 표시
- 한국어·영어, 모바일 우선 접근성

### 1.3 MVP에서 제외

- K-Tour ID가 정부 신분증·비자·체류자격을 발급하는 기능
- 미제휴 상태의 배달·교통·쇼핑 서비스가 실제 연결됐다는 주장
- 실결제 레일 없이 `KRW stablecoin`을 실화폐처럼 표시하는 것
- 관광객의 국적·행동 데이터를 이용한 타깃 광고 또는 데이터 판매
- 소멸한 고객 잔액·바우처를 플랫폼 매출로 귀속하는 모델
- NFT, 소셜 매칭, 1/n 정산, 가이드 마켓플레이스를 핵심 데모에 포함
- 완전한 비연결성 또는 ZKP/BBS+가 실제 구현됐다는 주장

## 2. 사용자와 역할

### 2.1 사용자 페르소나

| Persona | 최초 신원확인 | 발급되는 자격 | 핵심 작업 |
|---|---|---|---|
| 한국인 여행자 | Mobile ID via OmniOne CX | 국내 관광 혜택용 K-Tour ID | 지역 혜택 사용, 바우처 제시 |
| 등록 장기체류 외국인 | 모바일 외국인등록증 via CX, 지원 환경에 한함 | 체류 유효성 기반 K-Tour ID | 관광 혜택·서비스 자격 제시 |
| 단기 외국인 관광객 | 별도 Passport eKYC | 민간 `KTourVisitorCredential` | 여권 원문을 반복 제출하지 않고 자격 제시 |
| 가맹점 직원 | 파트너 계정·기기 등록 | Verifier 권한 | 요청 QR 생성, VP 검증, 바우처 사용 처리 |
| 지자체/파트너 운영자 | 조직 관리자 인증 | Campaign/Settlement 권한 | 정책 설정, 집계 리포트, 정산 확인 |

### 2.2 시스템 역할과 책임

| 역할 | 책임 | 보유하면 안 되는 것 |
|---|---|---|
| Holder App | 동의, credential 보관, VP 생성·제출, 키 사용 | 서버 로그에 개인키 노출 |
| K-Tour BFF | 세션 조정, 최소화된 identity result, 정책·UI용 데이터 | 여권 이미지 장기 보관, 개인키 |
| CX Adapter | CX 요청 생성, callback 검증, provider 결과 정규화 | Passport eKYC 수행 |
| Passport eKYC Adapter | NFC/OCR, 문서 진위, 얼굴·라이브니스 결과 정규화 | 국가 Mobile ID 발급 |
| K-Tour Issuer | 검증된 evidence를 근거로 민간 K-Tour ID 발급·폐기 | 공식 체류자격 부여 |
| OpenDID Infrastructure | DID/VC 발급·상태·VP 검증용 기술 기반 | 제품 정책·결제 승인 결정 |
| Verifier Service | 요청 생성, nonce/domain 바인딩, VP 검증 | 필요 없는 이름·여권번호 수집 |
| Policy Service | 자격·한도·혜택·기간 규칙 평가 | VC 서명 자체를 대신 검증 |
| Payment Adapter | quote, authorize, capture, refund, ledger reconciliation | VC 원본·여권 이미지 수집 |
| Voucher Service | issue, reserve, redeem, reverse, expire | 단순 해시만으로 중복사용을 막았다고 가정 |
| Settlement Service | 가맹점 정산 배치·상태·대사 | 고객 PII를 체인에 기록 |
| Audit Anchor | 정규화 이벤트의 해시, anchor receipt 관리 | 개인정보·결제 원문·사람이 읽는 민감 summary |
| Evidence Service | 기능별 실제 실행 수준과 vendor receipt 노출 | 검증되지 않은 `LIVE` 상태 생성 |

## 3. 핵심 사용자 흐름

### 3.1 Golden flow A: Mobile ID -> K-Tour ID

1. 사용자가 언어와 사용자 유형을 선택한다.
2. 앱은 처리 목적, 요청 속성, 보유기간, 발급자를 설명하고 동의를 받는다.
3. 백엔드가 CX 세션을 만들고 `authUrl`, app deep link 또는 QR을 반환한다.
4. 사용자는 국가 모바일 신분증 앱에서 요청을 확인하고 제출한다.
5. CX callback은 서명·state·세션·만료를 검증한다.
6. CX Adapter가 원문을 그대로 넘기지 않고 `IdentityEvidence`로 정규화한다.
7. Policy Service가 발급 가능 여부와 최소 K-Tour ID claims를 결정한다.
8. K-Tour Issuer가 OpenDID를 통해 VC를 발급한다.
9. Holder가 credential 저장을 확인한다.
10. `CredentialIssued` 감사 이벤트가 outbox를 거쳐 체인에 앵커링된다.
11. 완료 화면에는 credential 정보와 별도로 `LIVE/SANDBOX/SIMULATED` evidence가 표시된다.

### 3.2 Golden flow B: Passport eKYC -> 민간 Visitor Pass

1. 단기 외국인 관광객이 `Passport verification`을 선택한다.
2. 앱은 이 과정이 OmniOne CX가 아니며 국가 모바일 신분증 발급도 아님을 설명한다.
3. 여권 NFC 우선, 지원되지 않으면 MRZ/OCR 보조 경로를 시작한다.
4. 얼굴·라이브니스와 문서 소지자 일치를 검사한다.
5. eKYC provider 결과와 위험 플래그를 `IdentityEvidence`로 정규화한다.
6. 원본 여권 이미지와 생체정보는 정책에 따라 즉시 또는 단기 보관 후 삭제한다.
7. K-Tour Issuer가 `assuranceMethod=passport_ekyc_private`인 민간 K-Tour ID를 발급한다.
8. 화면에는 `Not a government ID or immigration status`를 명시한다.

### 3.3 Golden flow C: 가맹점 VP 검증과 바우처 사용

1. 가맹점이 정책과 nonce가 들어간 verification request를 만든다.
2. Holder가 QR을 스캔하거나 deep link를 연다.
3. Holder 화면은 요청 조직, 목적, 공개될 claim/predicate, 보유기간을 보여준다.
4. 사용자가 승인하면 Holder가 nonce, audience, domain, expiry에 바인딩된 VP를 만든다.
5. Verifier는 발급자 신뢰, 서명, holder binding, expiry, status/revocation, nonce replay를 검증한다.
6. Policy Service가 `eligible=true/false`와 reason code를 반환한다.
7. 혜택 사용 시 Voucher Service가 `reserve -> redeem`을 원자적으로 처리한다.
8. Settlement Service가 파트너 원장에 반영하고 감사 이벤트를 생성한다.
9. Holder와 가맹점 모두 동일한 receipt ID를 확인한다.

### 3.4 Recovery flow

- 사용자 취소: 원래 화면으로 돌아가며 재시도와 다른 신원 수단을 제공한다.
- timeout/offline: 세션 상태를 재조회하고 만료됐으면 새 요청을 만든다.
- credential 만료: 재인증이 필요한 이유와 재발급 CTA를 보여준다.
- credential 폐기: 사용을 차단하고 분실·도난·관리자 폐기 사유에 맞는 복구 경로를 제공한다.
- 기기 분실: 기존 credential 폐기, 새 기기 재인증, 새 holder key로 재발급한다.
- 결제 실패: 잔액과 바우처 reservation을 원상복구하고 같은 idempotency key로 재실행하지 않는다.
- 정산/anchor 지연: 사용자 거래 성공 여부와 별도로 `anchor pending`을 표시하고 outbox에서 재시도한다.

## 4. 정보 구조와 화면 명세

### 4.1 권장 IA

```text
Onboarding
  Language
  Value & trust explanation
  Persona / identity method
  Consent
  Mobile ID handoff OR Passport eKYC
  Evidence review
  K-Tour ID issuance
  Completion

Holder App
  Home
  K-Tour ID
    Credential detail
    Present / Scan request
    Presentation history
    Renewal / Revoke / Recovery
  Wallet
    Balance / source / fees
    Pay / refund / transactions
  Benefits
    Eligible / reserved / used / expired
  AI assistant
  Profile / privacy / support
  Integration Evidence

Verifier App
  Partner sign-in / device registration
  Create request
  QR / deep link
  Verification result
  Voucher redeem
  Receipt / settlement

Operator
  Issuer & verifier registry
  Policies / campaigns
  Revocation
  Settlement / audit
  Environment & integration health
```

`Verified Connect`, 소셜 채팅, 1/n 결제는 P2 확장이다. P0 데모 내비게이션에서는 숨긴다.

### 4.2 공통 상태 규칙

모든 비동기 화면은 다음 상태를 명시적으로 가진다.

| 상태 | 필수 UI |
|---|---|
| idle | 작업 목적과 예상 결과 |
| consent-required | 요청 주체, 목적, 속성, 보유기간, 취소 가능성 |
| launching | 외부 앱/카메라/NFC를 여는 중 |
| pending | 진행 단계와 안전한 취소 버튼 |
| user-action-required | 모바일 ID 앱 또는 여권 태그 등 다음 행동 |
| success | receipt/evidence와 다음 CTA |
| rejected | 사용자가 거절했는지, 검증이 실패했는지 구분 |
| expired | 세션/credential/offer 중 무엇이 만료됐는지 표시 |
| timeout | 상태 재조회, 새 세션, 고객지원 |
| offline | 로컬에서 가능한 작업과 불가능한 작업 구분 |
| provider-unavailable | 대체 수단과 나중에 다시 시도 |
| rate-limited | 재시도 가능 시각 |
| revoked | 사용 차단과 재발급/지원 경로 |
| partial-success | 결제 성공·anchor 지연처럼 도메인별 상태 분리 |

### 4.3 화면별 필수 상태

| 화면 | 핵심 내용 | 실패·경계 상태 |
|---|---|---|
| Language | 한국어/영어, 접근성 설정 | 저장 실패 시 세션 기본값 |
| Value preview | K-Tour ID가 무엇이고 무엇이 아닌지 | `정부 신분증 아님` 고지 |
| Persona picker | Korean / short-term visitor / registered foreign resident | 지원되지 않는 provider 비활성 이유 |
| Consent | 목적별 동의, 필수/선택 분리, 전문 링크 | 미동의 시 진행 금지, 철회 경로 |
| Mobile ID start | 선택 provider, app/QR 방식, 만료 시간 | 앱 미설치, QR 만료, provider 비활성, 303 등 vendor 오류 |
| Passport capture | NFC 가이드, MRZ, 카메라, 얼굴·라이브니스 | NFC 미지원, 문서 읽기 실패, 얼굴 불일치, 재시도 제한 |
| Identity result | 검증 수단, assurance, 최소 필드, evidence level | 수동검토, 거절 reason code |
| Issuance | policy evaluation, DID/VC 발급, holder 저장, anchor 단계 | 발급 실패, holder 저장 실패, anchor pending을 구분 |
| Completion | credential, 유효기간, issuer, evidence status | mock이면 `SIMULATED` 영구 표시 |
| Home | Pass 상태, 가장 중요한 다음 행동, 혜택/지갑 요약 | credential 만료·폐기 banner, 파트너는 `예시` 표시 |
| K-Tour ID | 상태, claims, issuer, 발급근거, history | Present, renew, revoke, recovery CTA |
| Scan request | 카메라/QR 또는 deep link | 악성·만료 request, 잘못된 audience |
| Disclosure consent | verifier, purpose, 요청 claim/predicate, 보유기간 | 과도한 claim 경고, deny, always allow 금지 |
| VP progress/result | 생성, 제출, verifier result, receipt | nonce replay, 서명·issuer·expiry·revocation 실패 |
| Wallet | 잔액 출처, 자산/포인트 구분, 수수료, 거래 | 입금 pending, 결제 실패, refund pending, 잔액 부족 |
| Voucher | eligible/issued/reserved/redeemed/expired | reservation timeout, 중복사용, reversal |
| AI | 근거가 있는 추천, 추정 표시, 명시적 승인 | AI는 신원·결제 정책을 우회할 수 없음 |
| Integration Evidence | 기능별 환경, 마지막 검증 시각, receipt, redacted payload | 증거 없으면 LIVE 불가 |
| Recovery | 분실, 폐기, 재인증, 지원 | 기존 키로 재사용 금지 |
| Verifier result | verified/denied, 충족 predicate, receipt | PII 기본 숨김, 실패 reason 최소화 |
| Settlement | batch, gross/fee/net, status, anchor | discrepancy, retry, manual review |

## 5. 도메인 모델과 수명주기

### 5.1 핵심 엔터티

```ts
type Environment = "live" | "sandbox" | "simulated"

interface IdentityEvidence {
  id: string
  subjectRef: string                 // 내부 pseudonymous reference
  method: "mobile_id" | "mobile_residence_card" | "passport_ekyc"
  provider: string
  providerRequestId?: string
  assurance: "official_mobile_id" | "private_passport_ekyc"
  verifiedAt: string
  expiresAt?: string
  normalizedClaims: {
    nationalityCode?: string
    ageOver19?: boolean
    stayValidUntil?: string
    residentCategory?: "korean" | "registered_foreigner" | "visitor"
  }
  riskFlags: string[]
  environment: Environment
  rawRetentionUntil?: string
}

interface CredentialRecord {
  id: string
  type: "KTourVisitorCredential"
  issuerDid: string
  holderDid: string
  identityEvidenceId: string
  policyVersion: string
  status: "pending" | "active" | "suspended" | "revoked" | "expired"
  issuedAt: string
  expiresAt: string
  statusReference?: string
  environment: Environment
}

interface PresentationSession {
  id: string
  requestId: string
  verifierId: string
  nonce: string
  audience: string
  domain: string
  requestedPredicates: string[]
  status: "created" | "viewed" | "consented" | "submitted" | "verified" | "denied" | "expired" | "failed"
  expiresAt: string
}

interface ExecutionEvidence {
  feature: "mobile_id" | "passport_ekyc" | "vc_issue" | "vp_verify" | "payment" | "voucher" | "anchor"
  environment: Environment
  status: "not_configured" | "ready" | "running" | "succeeded" | "failed" | "degraded"
  provider?: string
  requestId?: string
  receiptId?: string
  verifiedAt?: string
  redactedProof?: Record<string, unknown>
}
```

### 5.2 수명주기

```text
IdentitySession:
created -> launched -> pending -> verified
                         |-> rejected | expired | failed | cancelled

Credential:
pending -> active -> suspended -> active
                  |-> revoked
                  |-> expired -> renewed(new credential id)

Presentation:
created -> viewed -> consented -> submitted -> verified
                    |-> denied        |-> failed
        |-> expired

Payment:
quoted -> authorized -> captured -> settled
                  |-> declined
                  |-> cancelled
                            captured -> refund_pending -> refunded | refund_failed

Voucher:
eligible -> issued -> reserved -> redeemed -> settled
                 |-> expired   |-> released
                              redeemed -> reversed

AuditAnchor:
queued -> submitted -> confirmed
                   |-> retrying -> confirmed
                   |-> dead_letter
```

상태는 UI animation으로 추정하지 않는다. 백엔드의 canonical status를 조회한다. 하나의 작업이 재시도돼도 새 credential, 결제, 바우처 사용이 중복 생성되지 않아야 한다.

## 6. API 계약

### 6.1 공통 규칙

- 외부 provider는 서버 어댑터 뒤에 둔다. 브라우저에 secret을 두지 않는다.
- 모든 mutation은 `Idempotency-Key`를 요구한다.
- 모든 응답은 `requestId`, `environment`, `evidence`를 포함한다.
- 날짜는 UTC ISO-8601, 금액은 정수 KRW minor unit을 사용한다.
- callback은 서명, timestamp, nonce/state, audience를 검증한 뒤 처리한다.
- 오류는 HTTP status와 안정된 `code`를 함께 사용한다.
- `providerPayload`는 운영 UI나 로그에 그대로 노출하지 않고 redaction한다.

```json
{
  "error": {
    "code": "IDENTITY_PROVIDER_UNAVAILABLE",
    "message": "The selected identity provider is unavailable.",
    "retryable": true,
    "requestId": "req_01...",
    "details": { "provider": "coresidence_v1.5" }
  }
}
```

### 6.2 Mobile ID / OmniOne CX Adapter

`POST /v1/identity/mobile-id/sessions`

```json
{
  "persona": "registered_foreigner",
  "providerPreference": "coresidence_v1.5",
  "requestClaims": ["residentCategory", "stayValidUntil"],
  "interactionMode": "qr_or_app",
  "returnUrl": "https://app.example.com/identity/callback"
}
```

```json
{
  "sessionId": "ids_01...",
  "status": "created",
  "providerRequested": "coresidence_v1.5",
  "providerSelected": "coresidence_v1.5",
  "authUrl": "https://...",
  "qrPayload": "...",
  "expiresAt": "2026-07-29T04:00:00Z",
  "environment": "sandbox",
  "evidence": { "feature": "mobile_id", "status": "running", "requestId": "req_01..." }
}
```

- `GET /v1/identity/mobile-id/sessions/{sessionId}`: canonical status poll.
- `POST /internal/callbacks/omnione-cx`: provider callback; public client가 직접 호출하지 않는다.
- `POST /v1/identity/mobile-id/sessions/{sessionId}/cancel`: 사용자 취소.

허용 provider 후보는 매뉴얼과 실제 환경을 대조해 configuration으로 관리한다. `coidentitydocument_v1.5`, `comdl_v1.5`, `comrc_v1.5`, `coresidence_v1.5`를 코드에 하드코딩하지 않는다. provider list의 active status와 팀별 서비스 설정을 health check에 반영한다.

### 6.3 Passport eKYC Adapter

`POST /v1/identity/passport/sessions`

```json
{
  "countryHint": "US",
  "capturePreference": "nfc_first",
  "requireLiveness": true,
  "returnUrl": "https://app.example.com/identity/passport/callback"
}
```

응답은 SDK session token 또는 provider handoff URL, 만료시각, 개인정보 보관정책을 포함한다. `GET /v1/identity/passport/sessions/{id}`의 성공 결과는 원본 문서가 아니라 `IdentityEvidence` reference와 최소 claims만 반환한다.

필수 실패 코드:

- `PASSPORT_NFC_UNSUPPORTED`
- `PASSPORT_READ_FAILED`
- `DOCUMENT_AUTH_FAILED`
- `FACE_MISMATCH`
- `LIVENESS_FAILED`
- `MANUAL_REVIEW_REQUIRED`
- `RAW_DATA_DELETION_PENDING`

### 6.4 Policy Service

`POST /v1/policies/evaluate`

```json
{
  "policy": "k-tour-pass.issue.v1",
  "subjectRef": "subj_01...",
  "evidenceIds": ["ide_01..."],
  "context": { "campaignId": "cmp_seoul_2026" }
}
```

```json
{
  "decisionId": "dec_01...",
  "eligible": true,
  "reasonCodes": [],
  "policyVersion": "1.3.0",
  "derivedClaims": {
    "visitorCategory": "short_term_visitor",
    "stayValid": true,
    "benefitGroup": "seoul_welcome"
  }
}
```

정책 결과는 설명 가능해야 하며, AI가 정책을 우회하거나 최종 신원·결제 결정을 내려서는 안 된다.

### 6.5 OpenDID Issuer Adapter

`POST /v1/credentials/k-tour-pass`

```json
{
  "subjectRef": "subj_01...",
  "holderDid": "did:...",
  "identityEvidenceId": "ide_01...",
  "policyDecisionId": "dec_01...",
  "claims": {
    "visitorCategory": "short_term_visitor",
    "stayValid": true,
    "benefitGroup": "seoul_welcome"
  },
  "expiresAt": "2026-08-12T00:00:00Z"
}
```

응답은 `credentialId`, `issuerDid`, `credentialType`, `status`, holder delivery 정보, status/revocation reference와 evidence를 반환한다. VC 원본을 일반 앱 DB·로그에 저장할지는 OpenDID holder 모델과 보안 검토 후 결정하며, 기본값은 holder 보관이다.

- `GET /v1/credentials/{id}/status`
- `POST /v1/credentials/{id}/suspend`
- `POST /v1/credentials/{id}/revoke`
- `POST /v1/credentials/{id}/renew`

### 6.6 Holder Presentation API

- `GET /v1/presentation-requests/{requestId}`: verifier, purpose, requested claims/predicates, retention, nonce, expiry.
- `POST /v1/presentations`: 사용자가 동의한 항목과 holder-generated VP 제출.
- `GET /v1/presentations/{id}`: 제출·검증 상태.

```json
{
  "requestId": "vpr_01...",
  "consent": {
    "approvedPredicates": ["stayValid", "benefitEligible"],
    "approvedAt": "2026-07-29T03:20:00Z"
  },
  "presentation": "<opaque VP from holder>",
  "holderBinding": { "nonce": "...", "audience": "verifier_123", "domain": "merchant.example" }
}
```

### 6.7 Verifier API

`POST /v1/verifier/requests`

```json
{
  "verifierId": "merchant_123",
  "purpose": "Redeem Seoul welcome benefit",
  "policy": "benefit.seoul-welcome.redeem.v1",
  "requestedPredicates": ["stayValid", "benefitEligible"],
  "retentionSeconds": 0,
  "callbackUrl": "https://merchant.example/callback"
}
```

응답은 1회용 `requestId`, QR/deep link, nonce, 만료시각을 반환한다. 검증 결과는 아래처럼 PII가 아닌 decision만 기본 반환한다.

```json
{
  "verificationId": "ver_01...",
  "status": "verified",
  "issuerTrusted": true,
  "holderBound": true,
  "notExpired": true,
  "notRevoked": true,
  "predicates": { "stayValid": true, "benefitEligible": true },
  "receiptId": "rcpt_01..."
}
```

### 6.8 Payment API

- `POST /v1/payments/quotes`: amount, asset, fee, FX, expiry.
- `POST /v1/payments`: quote, merchant, funding source, policy decision.
- `POST /v1/payments/{id}/confirm`: 사용자 2단계 확인 또는 provider challenge.
- `POST /v1/payments/{id}/refunds`: 전액/부분 환불.
- `GET /v1/payments/{id}`: provider와 내부 ledger 상태.

결제는 `authorized`와 `captured/settled`을 구분한다. 체인 anchor 성공을 결제 승인으로 사용하지 않는다. 실제 결제 파트너가 없으면 UI와 응답 환경은 `simulated`이며 실제 원화/스테이블코인으로 부르지 않는다.

### 6.9 Voucher API

- `POST /v1/vouchers/issue`
- `POST /v1/vouchers/{id}/reserve`
- `POST /v1/vouchers/{id}/redeem`
- `POST /v1/vouchers/{id}/release`
- `POST /v1/vouchers/{id}/reverse`
- `GET /v1/vouchers/{id}`

중복사용 방지는 DB의 unique redemption key와 상태전이를 먼저 사용하고, 체인 anchor는 감사 증거다. 만료·미사용 금액의 귀속은 약관·법률·파트너 계약으로 결정하며 플랫폼 수익으로 자동 전환하지 않는다.

### 6.10 Settlement and Audit Anchor API

- `POST /v1/settlements/batches`: 기간·파트너별 gross/fee/net 계산.
- `GET /v1/settlements/{id}`: pending/reconciling/settled/disputed.
- `POST /internal/audit-events`: domain outbox에서 canonical event 수신.
- `GET /v1/audit-events/{eventId}/evidence`: redacted event hash와 anchor receipt.

정산 원장은 내부 ledger가 source of truth이고, chain은 tamper-evident audit anchor다.

## 7. 체인 이벤트와 신뢰성

### 7.1 Canonical event envelope

```json
{
  "schemaVersion": "1.0",
  "eventId": "evt_01...",
  "eventType": "CredentialIssued",
  "aggregateType": "credential",
  "aggregateId": "cred_01...",
  "occurredAt": "2026-07-29T03:30:00.000Z",
  "actorRole": "issuer",
  "subjectPseudonym": "hmac:v1:...",
  "environment": "sandbox",
  "idempotencyKey": "issue:subj_01:policy_1.3",
  "payloadHash": "sha256:...",
  "previousEventHash": "sha256:...",
  "dataClassification": "non_pii",
  "evidenceRef": "evi_01..."
}
```

허용 P0 이벤트:

- `IdentityVerified`
- `CredentialIssued`
- `CredentialSuspended`
- `CredentialRevoked`
- `PresentationVerified`
- `PolicyDecisionMade`
- `VoucherIssued`
- `VoucherReserved`
- `VoucherRedeemed`
- `VoucherReversed`
- `PaymentAuthorized`
- `PaymentCaptured`
- `PaymentRefunded`
- `SettlementRecorded`

### 7.2 Hash와 idempotency

- payload는 versioned schema로 validation하고 JSON Canonicalization Scheme 등 결정론적 규칙으로 직렬화한 뒤 SHA-256 해시한다.
- 사람 이름, 여권번호, DID 전체값, 결제 설명문 등 연결 가능한 PII를 payload에 넣지 않는다.
- `eventId`와 `idempotencyKey`에 unique constraint를 둔다.
- 도메인 mutation과 outbox write는 같은 DB transaction으로 처리한다.
- anchor worker는 exponential backoff와 dead-letter queue를 사용한다.
- 같은 event 재전송은 같은 receipt를 반환한다.
- chain receipt는 `network`, `transactionId`, `block/commit reference`, `submittedAt`, `confirmedAt`을 저장한다.
- anchor 지연은 결제·바우처 결과를 되돌리지 않으며 UI에 `Anchor pending`으로 분리 표시한다.

## 8. 보안과 개인정보

### 8.1 필수 통제

- 모바일 신분증·eKYC callback: state/nonce, timestamp, signature, audience, single-use 검증.
- VP: verifier challenge, domain, audience, expiry, holder binding으로 replay 방지.
- QR: 1회용, 짧은 TTL, verifier 조직과 요청 목적을 holder 화면에 표시.
- credential: trusted issuer registry, expiry, status/revocation 확인.
- 키: holder private key는 앱 서버 로그나 API payload로 전송하지 않는다. 실제 저장 위치·복구 방식은 SDK 특성에 맞춰 문서화한다.
- 저장: 전송 TLS, 서버 저장 암호화, secret manager, 운영자 RBAC, 감사 로그.
- 관측성: body 전체 로깅 금지, PII redaction, trace ID와 provider request ID만 허용.
- 생체·여권 원본: 목적·보관기한·삭제 SLA를 동의 화면과 데이터 인벤토리에 기록.
- 분석: opt-in 또는 적법한 근거가 있는 집계 데이터만 사용하며 개인 DID·국적을 광고 키로 사용하지 않는다.
- AI: credential 원본·여권·생체를 prompt에 넣지 않으며 정책·결제의 최종 결정을 맡기지 않는다.
- 결제: amount/merchant/fee를 두 번째 확인 화면에 고정 표시하고 double-click/idempotency를 방어한다.
- 접근성: 44px 이상 터치 영역, 키보드·스크린리더, reduced motion, 색상 외 상태 표시.

### 8.2 데이터 분류

| 분류 | 예시 | 기본 저장 위치 |
|---|---|---|
| Restricted | 여권 이미지/NFC DG, 얼굴·라이브니스, 외국인등록번호 | eKYC/identity provider; 최소 기간 후 삭제 |
| Confidential | 이름, 생년, 국적, 전체 DID, 결제 원장 | 암호화된 off-chain 서비스 |
| Pseudonymous | subjectRef, HMAC pseudonym, credential internal ID | 서비스 DB |
| Public/non-PII | schema version, event type, payload hash | chain anchor 가능 |

`hash(PII)`도 작은 후보군이나 외부 데이터로 재식별될 수 있으므로 개인정보가 아닌 것으로 자동 간주하지 않는다. PII 자체가 event payload에 들어가지 않게 한 뒤 그 비식별 payload를 해시한다.

## 9. 실행 증거: LIVE / SANDBOX / SIMULATED

### 9.1 표시 규칙

| Label | 조건 | 화면 표현 |
|---|---|---|
| LIVE | 실제 운영 provider가 성공했고 서버가 receipt를 검증 | 녹색 `LIVE`, provider, verified timestamp, redacted receipt |
| SANDBOX | 공식 테스트 환경·테스트 credential이 성공 | 파란색 `SANDBOX`, 테스트 데이터 경고 |
| SIMULATED | local mock/fixture/가짜 DID/hash | 주황색 `SIMULATED`, 실제 효력 없음 |

- 단순히 실제와 비슷한 URL이나 hash를 만들었다고 LIVE가 아니다.
- `Issuer: OmniOne`은 실제 issuerDid와 검증 가능한 VC가 있을 때만 표시한다. mock은 `K-Tour ID Demo Issuer`로 표시한다.
- `Recorded on OmniOne Chain`은 확인된 anchor receipt가 있을 때만 표시한다. 그 전에는 `Local simulation` 또는 `Anchor pending`이다.
- 실제 제휴 계약이 없는 브랜드는 `예시 연동 대상`으로 표시한다.
- Evidence 화면은 발표자 전용이 아니라 credential·결제·VP 결과에서 항상 접근 가능해야 한다.

### 9.2 Evidence acceptance

각 P0 연동은 아래 증거를 저장한다.

- 시작 요청의 내부 `requestId`
- provider와 environment
- provider receipt/transaction identifier
- 서버가 receipt를 검증한 시간
- redacted request/response schema
- 실패 시 stable error code
- simulated fixture이면 fixture version과 seed

## 10. 우선순위 백로그

### 10.0 현재 목업 완료 현황

| 범위 | 상태 | 구현 경로 |
|---|---|---|
| 신원 경로별 화면과 timeout | 완료 · SIMULATED | `/onboarding` |
| Holder 요청 확인·claim 동의·VP 결과 | 완료 · SIMULATED | `/present` |
| expired/revoked/offline 복구 화면 | 완료 · SIMULATED | `/present?step=result&result=...` |
| 혜택 정책·결제·voucher redeem·settlement receipt | 완료 · SIMULATED | `/benefits?verified=1` |
| Merchant request·Verifier 상태 | 완료 · SIMULATED | `/partner/verify` |
| Partner 정산·anchor receipt | 완료 · SIMULATED | `/partner/settlements` |
| 통합 상태와 event evidence | 완료 · SIMULATED | `/evidence` |
| 실제 CX, OpenDID, 결제, chain provider 응답 | 미구현 | 아래 P0 |

이 표의 `완료`는 클릭 목업 완료를 뜻한다. 공급자 receipt가 연결되기 전에는 실제 통합 완료로 간주하지 않는다.

### P0: 해커톤 핵심 루프

- [x] 앱 전체 integration status banner와 Evidence 화면 목업
- [ ] 실제/공식 sandbox OmniOne CX 세션, QR/deep link, callback, 오류 상태
- [ ] `coresidence` capability를 configuration/health check로 관리
- [ ] Passport eKYC를 CX와 분리한 adapter와 명확한 민간 VC 고지
- [ ] OpenDID K-Tour ID issuer/holder 저장과 status 확인
- [x] Verifier request QR, disclosure consent, VP 제출·검증 결과 목업
- [ ] 실제 OpenDID Holder/Verifier 요청·응답과 nonce replay 검증
- [ ] Voucher reserve/redeem 원자성, 중복사용 방지
- [ ] 감사 outbox, canonical hash, real/sandbox anchor receipt
- [x] issuer/partner/chain의 mock 오인 표현 제거
- [ ] 개인정보 동의, 실패/만료/취소/재시도 상태
- [ ] 90초 demo seed, reset, 네트워크 preflight, fallback recording
- [ ] 공개 저장소·발표자료의 팀원 PII 제거

### P1: 제품 신뢰와 거래 완결성

- [ ] credential suspend/revoke/renew와 분실 기기 recovery
- [ ] 결제 quote/authorize/capture/refund와 provider reconciliation
- [ ] 바우처 reverse/expire와 분쟁 처리
- [ ] 파트너 로그인, verifier device registration, settlement dashboard
- [ ] 원문 삭제 job, consent receipt, data export/delete
- [ ] 보안 테스트, rate limit, webhook replay protection, DLQ 운영 화면
- [ ] 접근성, 저속망·오프라인·다국어 오류 QA
- [ ] AI 추천의 근거·추정 표시와 안전한 action approval

### P2: 확장

- [ ] B2G campaign management와 집계 리포트
- [ ] 추가 언어·지역·신원 provider
- [ ] Verified Connect/소셜 안전·신고·모더레이션
- [ ] 1/n 결제와 escrow 규제·파트너 설계
- [ ] 검증된 표준·SDK가 있을 때 ZKP unlinkability 고도화

## 11. 90초 데모 스크립트

데모 시작 전에 `/evidence`에서 CX, OpenDID, verifier, chain 상태가 원하는 environment인지 확인한다. LIVE와 SIMULATED를 섞을 경우 각 단계에서 소리 내어 구분한다.

| 시간 | 화면·행동 | 발표 문장 | 보여줄 증거 |
|---:|---|---|---|
| 0-10초 | 문제/Pass 가치 한 화면 | “신원 소스가 달라도 한국에서 필요한 서비스 자격은 한 장으로 표준화합니다.” | 없음 |
| 10-30초 | Mobile ID QR/app handoff와 성공 | “필수과제인 국가 모바일 신분증을 CX로 실제 검증합니다.” | provider, environment, requestId |
| 30-45초 | K-Tour ID 발급 완료 | “검증 결과로 OpenDID 기반 민간 관광 자격 VC를 발급합니다.” | issuerDid, credentialId, status |
| 45-65초 | 가맹점 요청 QR, 공개항목 동의 | “이름과 여권번호 없이 체류 유효·혜택 대상만 제시합니다.” | nonce, requested predicates |
| 65-78초 | verifier 성공과 voucher redeem | “서명·소지자·만료·폐기·정책을 확인한 뒤 1회 사용 처리합니다.” | verification/receipt ID |
| 78-86초 | chain evidence | “원문이 아니라 비식별 이벤트 해시만 앵커링합니다.” | real/sandbox receipt |
| 86-90초 | AI 추천 preview | “AI는 다음 혜택을 추천하지만 실행은 사용자가 승인합니다.” | `AI estimate`, 실행 전 상태 |

소셜, NFT, 모든 파트너 로고, 긴 아키텍처 페이지, 기술 Q&A는 90초 본편에서 제외한다.

## 12. Acceptance criteria와 테스트 계획

### 12.1 기능 acceptance

- [ ] Mobile ID 성공은 서버가 검증한 callback 없이는 `verified`가 되지 않는다.
- [ ] inactive provider는 시작 전에 감지되고 대체 provider/경로를 제시한다.
- [ ] Passport eKYC 화면과 로그 어디에도 OmniOne CX 처리라고 표시하지 않는다.
- [ ] Passport 경로의 K-Tour ID에 `private service credential` 고지가 보인다.
- [ ] 같은 `Idempotency-Key`로 발급·결제·redeem을 10회 재시도해도 결과가 한 건이다.
- [ ] 만료·폐기 VC의 VP는 verifier에서 거절된다.
- [ ] 다른 nonce/domain으로 재사용한 VP는 거절된다.
- [ ] disclosure 화면에 없는 claim은 verifier 결과에 노출되지 않는다.
- [ ] voucher 동시 redeem 두 건 중 하나만 성공한다.
- [ ] anchor 장애 중에도 결제/바우처 canonical 상태가 보존되고 `pending`으로 표시된다.
- [ ] simulated receipt는 LIVE 배지를 얻을 수 없다.
- [ ] 앱·로그·chain payload에서 여권번호, 얼굴, 이름, 전체 DID를 검색해도 발견되지 않는다.

### 12.2 자동화 테스트

- Unit: policy rules, state machines, canonicalization, redaction, money arithmetic.
- Contract: CX/eKYC/OpenDID/payment provider fixtures와 schema drift 검사.
- Integration: webhook signature, timeout, duplicate callback, out-of-order event.
- E2E: 세 persona 성공, 사용자 거절, provider inactive, QR expiry, revoked VC, duplicate redeem, refund, anchor pending.
- Security: replay, CSRF/state mismatch, open redirect, QR phishing, IDOR, SSRF, log injection, secret exposure, rate limit.
- Privacy: raw artifact deletion SLA, consent withdrawal, export/delete, analytics payload inspection.
- Accessibility: keyboard, screen reader names, focus return, 200% zoom, contrast, reduced motion, 44px target.
- Performance: p95 session create < 1s excluding provider, status poll jitter/backoff, mobile LCP < 2.5s on demo assets.
- Resilience: provider 5xx, callback delay, network loss, worker retry, DLQ replay.

### 12.3 데모 리허설 기준

- [ ] 새 기기/새 세션에서 reset 후 3회 연속 성공한다.
- [ ] 모든 vendor credential, allowlist, callback URL, clock sync를 preflight가 확인한다.
- [ ] 실제 데모 실패 시 사용할 녹화본과 `SANDBOX/SIMULATED` fallback 버튼이 있다.
- [ ] 발표자가 현재 단계의 environment를 2초 안에 확인할 수 있다.
- [ ] 90초 스크립트가 네트워크 정상 기준 80초 이내에 끝나 10초 여유가 있다.

## 13. 구현 순서와 소유권

| 순서 | 작업 | 주 담당 | 선행조건 |
|---:|---|---|---|
| 1 | provider/env configuration, Evidence model, status banner | Backend + FE | 사무국 환경 답변 |
| 2 | CX adapter와 callback | Identity | service provisioning |
| 3 | Passport eKYC adapter contract | Identity + Security | provider 선정 |
| 4 | OpenDID issuer/status/holder adapter | DID | schema·issuer governance |
| 5 | Verifier request/VP/consent | DID + FE | holder 방식 확정 |
| 6 | Policy와 voucher state machine | Backend | claim/predicate 확정 |
| 7 | Audit outbox와 chain anchor | Chain | network access |
| 8 | Payment adapter와 settlement | Payment | 사업·규제·파트너 결정 |
| 9 | 실패/recovery/accessibility/E2E | QA + 전체 | 위 기능 상태 안정화 |

## 14. 가정과 미해결 질문

### 14.1 현재 가정

- OmniOne CX는 모바일 신분증 검증에만 사용하고 Passport eKYC는 별도 provider다.
- K-Tour ID는 민간 서비스 credential이며 정부 신분증·비자·체류 허가가 아니다.
- OpenDID의 실제 credential format, holder SDK, status/revocation, selective disclosure 방식은 제공 환경을 확인한 후 adapter 내부에서 결정한다.
- 체인은 결제 ledger가 아니라 감사 anchor로 사용한다.
- 실제 결제·교통·배달 파트너가 확정되기 전 관련 화면은 simulation/연동 예시다.

### 14.2 사무국·라온시큐어 확인 필요

1. 매뉴얼의 `coresidence`가 해커톤 hosted 환경에서 어떤 provider ID와 버전으로 활성화되는가?
2. 현재 public provider list에서 `coresidence`/`coresidence_prod`가 inactive이고 직접 요청이 303인 것이 정상 정책인가?
3. 외국인등록증 테스트 wallet/credential을 제공하는가, 실제 보유자가 필요한가?
4. `coidentitydocument_v1.5` 통합 선택창에서 외국인등록증을 선택할 수 있는가?
5. 팀별 `serviceCode`, `serviceId`, origin/IP allowlist, callback URL 등록이 필요한가?
6. `coresidence`에서 반환이 보장되는 최소 claims와 선택 가능한 claims는 무엇인가?
7. 실제 환경의 holder app/deep link/QR 지원 조합과 세션 TTL은 무엇인가?
8. OpenDID 해커톤 환경에서 issuer 등록, schema 등록, holder 전달, VP verifier, status/revocation을 어디까지 제공하는가?
9. OpenDID의 selective disclosure/ZKP 지원 범위와 공식 demo credential은 무엇인가?
10. OmniOne Chain network, explorer, transaction receipt, rate limit, event payload 제한은 무엇인가?
11. 필수과제 평가는 target user가 아닌 국내 사용자/서비스 제공자의 실제 Mobile ID 검증으로도 인정되는가?
12. Passport eKYC 후 발급한 민간 K-Tour ID는 OpenDID 선택과제로 평가되며 Mobile ID 필수과제는 별도로 시연해야 하는가?

### 14.3 제품·법률·사업 결정 필요

- K-Tour ID의 법적 발급 주체와 issuer governance
- 여권·생체 원본의 processor/controller 역할, 보관기간, 국외 이전
- 결제 자산이 실제 KRW, 선불전자지급수단, stablecoin, demo point 중 무엇인지
- 충전·환불·미사용잔액·수수료·AML/KYC 책임
- 파트너 로고와 서비스명을 사용할 수 있는 계약·브랜드 권한
- 지자체 혜택의 자격 규칙과 이의제기·수동검토 절차

## 15. 기존 목업 마이그레이션

| 현재 구현 | 변경 |
|---|---|
| 모든 identity path가 1.4초 후 성공 | provider session 상태와 오류를 사용; mock은 SIMULATED 표시 |
| fake `did:omn`과 fake tx hash | demo issuer/receipt로 명명; 실제 evidence와 혼동 금지 |
| `Issuer: OmniOne (Open DID)` 고정 | 실제 issuerDid 또는 `K-Tour ID Demo Issuer` |
| `Recorded on OmniOne` 고정 | confirmed receipt, anchor pending, local simulation 분기 |
| T-money/Baemin 등 Linked/partner 표현 | 계약 전 `연동 예시` 또는 제거 |
| `/pass` 정보 전용 | Present/Scan, consent, VP result, renew/revoke 추가 |
| `/connect`가 주요 내비게이션 | P2로 이동, P0 데모에서 숨김 |
| 하나의 consent checkbox | 목적·속성·보관기간별 동의와 전문/철회 |
| 고정 2026-06-24 시각 | 서버 시각과 provider receipt 시각 사용 |
| architecture/발표에서 CX가 여권도 처리 | CX와 Passport eKYC를 명확히 분리 |

완료의 정의는 “화면이 존재한다”가 아니라, 각 단계가 신뢰할 수 있는 상태·증거·실패·복구 경로를 갖고 golden flow가 중복 없이 끝나는 것이다.
