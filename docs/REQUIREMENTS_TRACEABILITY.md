# 요구사항 추적표

> **역사적 v2 추적표 — 현재 개발 인계 정본 아님.** 아래의 독립 route·Sui 프로그램 조건·우선순위는 당시 기록이다. 현행 목업과 개발 작업은 [개발자 시작 문서](./DEVELOPER_START_HERE.md), [DEPLOYMENT_SPEC Appendix A](./DEPLOYMENT_SPEC.md)의 G/FL/REQ 연결과 [Backend 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)를 따른다. 원문은 이력 보존을 위해 남긴다.

상태: `v2.0 · 제품 요구 → 목업 샘플 → 생산 구현 → 검수 증거`

`목업`은 현재 코드에서 확인 가능한 UX 샘플 상태다. `생산`은 실제 개발 완료 상태가 아니다. 모든 항목은 [개발 명세](./DEVELOPMENT_SPEC.md)의 acceptance를 통과해야 한다.

## 1. 소스 코드

| 코드 | 근거 |
|---|---|
| P | 루트 K-Tour ID 제안서 |
| K | 이전 K-STAYBLE 제안서 |
| CX | OmniOne CX API 매뉴얼·샘플 |
| M | 현재 클릭 목업과 제품 책임자 UX 결정 |
| S | 사용자 제공 Sui 프로그램 안내·공식 Sui/Walrus 문서 |
| A | 공개 Maroo Audit Scope 참고 문서 |

## 2. 핵심 제품·신원·자격

| ID | 요구사항 | 근거 | 목업 샘플 | 생산 구현/증거 | 우선순위 |
|---|---|---|---|---|---|
| PRD-001 | 서로 다른 신원 소스를 K-Tour 민간 서비스 자격으로 표준화 | P p.4~6 | `/onboarding`, `/pass` | 3 persona IdentityEvidence → OpenDID VC E2E | P0 |
| PRD-002 | K-Tour ID는 정부 신분증·비자·체류허가가 아님 | M, P p.4~6 | onboarding/pass 고지 | schema, terms, copy, support에서 동일 | P0 |
| ID-001 | 내국인 Mobile ID를 OmniOne CX로 확인 | P p.4~6, CX | Mobile ID simulation | 실제/sandbox provider/token/request/result/parse receipt | P0 |
| ID-002 | 등록 외국인 모바일 외국인등록증 경로 | P p.4~6, CX `coresidence` | residence simulation | provider capability check, test credential 또는 명시적 unavailable | P0 |
| ID-003 | 단기 방문자는 별도 Passport eKYC | P p.4~6, M | Passport simulation | NFC/MRZ/face/liveness adapter와 retention evidence | P0 |
| ID-004 | 가입 완료 즉시 홈, 첫 가이드 제공 | M | `/?welcome=1`, FirstRunGuide | issue commit 후 redirect, one-time guide state | P0 |
| ID-005 | 재방문자는 홈, 만료/폐기만 갱신·복구 | M | route guard/renew returnTo | server credential status와 allowlisted return | P0 |
| AUTH-001 | 단기 해외 방문자는 한국 휴대전화 없이 가입·복구 가능 | P p.4,8 | passport persona에 전화번호 없음 | auth ADR, foreign-device E2E | P0 |
| DID-001 | OpenDID로 VC 발급·holder 보관 | P p.4~6 | fake DID/VC | issuer/schema/holder receipt | P0 |
| DID-002 | 최소정보 VP와 verifier 검증 | P p.6~8 | `/present`, `/partner/verify` | issuer/holder/status/nonce/domain/audience E2E | P0 |
| DID-003 | suspend/revoke/expire/renew/recovery | M | failure preview | actual status mechanism과 lost-device test | P0 |

## 3. 사용자 경험·위치·탐색

| ID | 요구사항 | 근거 | 목업 샘플 | 생산 구현/증거 | 우선순위 |
|---|---|---|---|---|---|
| UX-001 | persona별 진입과 맞춤 홈/첫 추천 | M, P p.4 | persona config | policy/config 기반 콘텐츠, locale test | P0 |
| UX-002 | ID·지갑을 하나의 모바일 진입점으로 통합 | M | 하단 `ID·지갑` | shared IA, credential/wallet deep links | P0 |
| UX-003 | 문구는 사용자 행동 중심, 상세 명세는 화면 밖 | M | polished mock | content QA, support/legal detail links | P0 |
| LOC-001 | opt-in 위치로 가까운 순·coverage·activity 거리 개선 | M | LocationProvider/Control | permission, TTL, privacy, fallback tests | P0 |
| LOC-002 | 위치 거절에도 모든 핵심 작업 가능 | M | persona ranking fallback | denied/unavailable E2E | P0 |
| EXP-001 | 교통·음식·쇼핑·예약 intent로 통합 탐색 | P p.5~8, M | `/explore` | unified search/rank API와 availability | P0 |
| EXP-002 | marketplace와 partner 서비스가 가지처럼 확장 | M | offer adapters/config | domain adapter SDK/OpenAPI | P0 |
| EXP-003 | 브랜드는 계약 전 연동 예시 | M | simulated copy | partner registry와 execution label | P0 |

## 4. 거래·서비스·비즈니스

| ID | 요구사항 | 근거 | 목업 샘플 | 생산 구현/증거 | 우선순위 |
|---|---|---|---|---|---|
| COM-001 | 상품 옵션→quote→자격/혜택→결제→fulfilment | P p.5~8, M | explore/order flow | server orchestration E2E | P0 |
| COM-002 | taxi/transport pass 특화 구성·상태 | P p.3,5,7, M | Kakao T/Uber/T-money flows | mobility adapter sandbox/real receipt | P0 |
| COM-003 | delivery 주소·메뉴·최소금액·부분환불 | P p.3,5,7, M | Baemin/Coupang Eats flows | delivery adapter, missing item refund | P0 |
| COM-004 | shopping/convenience 재고·픽업 | P p.5,7, M | Olive Young/GS25 flows | stock reservation/pickup/refund | P1 |
| COM-005 | 결제와 provider 주문 상태 분리·보상 | M | status-unknown/refund simulation | saga, void/refund, reconciliation tests | P0 |
| COM-006 | quote TTL, 재견적, 재동의 | M | 10분 quote simulation | authoritative price/expiry tests | P0 |
| WAL-001 | 잔액·거래·충전·환불 | P p.3,5,7 | `/wallet` local ledger | double-entry ledger/payment adapter | P0 |
| WAL-002 | KRW/stablecoin/point/voucher 자산 구분 | P p.3,7, M | demo balance | legal/asset type ADR와 UI/API distinction | P0 |
| WAL-003 | 남은 잔액을 user-funded voucher로 전환·미사용 환불 | P p.3,8,10 | `/wallet` convert/refund mock | quote, issue, refund, accounting E2E | P1 |
| PAY-002 | KakaoPay 등 on/off-ramp·결제수단 후보 | P p.3 | 로고/개념 수준 | 계약·법률·provider receipt 전 simulation | P1 |
| BEN-001 | 자격 기반 1회성 바우처·중복사용 방지 | P p.4~10 | voucher state mock | atomic reserve/redeem, concurrency test | P0 |
| BEN-002 | 캠페인/provider/user-funded 혜택 원천 구분 | P p.8,10, M | funding fields | budget ledger, settlement evidence | P0 |
| REF-001 | 사용 전/후, 전액/부분 환불과 혜택 복원 | M | order/refund mock | provider quote/receipt와 ledger reconciliation | P0 |
| SET-001 | 가맹점 정산과 비식별 감사 | P p.4~8 | `/partner/settlements` | gross/fee/benefit/net ledger, receipt | P0 |
| BIZ-001 | app-in-app fee·캠페인 수익 확장 | P p.10 | 구조 샘플 | 계약·가격·세무 확정 후 | P1 |
| BIZ-002 | 광고/관광 데이터 수익화는 개인정보 검토 후 | P p.10, M | 제품에 직접 노출 안 함 | consent/aggregation/legal approval 전 금지 | P2 |
| BIZ-003 | 미사용 잔액·바우처 자동 매출 귀속 금지 | P p.10, M | refundable mock | 약관/법률/회계 승인 | P0 guardrail |

## 5. 액티비티·안전·AI

| ID | 요구사항 | 근거 | 목업 샘플 | 생산 구현/증거 | 우선순위 |
|---|---|---|---|---|---|
| ACT-001 | 액티비티 참여 확정자만 그룹 채팅 | M | `/connect`, `/connect/chat` | server membership authorization | P1 |
| ACT-002 | 친구 만들기 목적, 성별 매칭/소개팅 아님 | M | copy/data model | policy/content/moderation 기준 | P1 |
| ACT-003 | 정원·참여·나가기·재가입 | M | membership local state | transactional capacity/membership | P1 |
| ACT-004 | 신고·차단·도움·증거·운영 대응 | M | safety UI/receipt mock | moderation backend/RBAC/runbook | P1 |
| ACT-005 | 1/n 비용 나누기 | M | payment simulation | payment/legal/recipient/refund 확정 전 simulated | P2 |
| AI-001 | 상황 기반 추천·쿠폰 최적화·이상 사용 보조 | P p.4,7,8 | assistant/fallback | model gateway, eval, reason, policy separation | P1 |
| AI-002 | 금전/자격 행동은 사용자 승인·정책·receipt | M, S | mock approval UX | Agent action envelope, tool allowlist | P0 for Sui flow |
| AI-003 | prompt/AI에 여권·생체·VC 원문 미사용 | M | no real PII | input scan/redaction/privacy test | P0 |
| GAM-001 | QR stamp tour·방문 기록·재방문 추천 | P p.3,8 | `/journey` check-in mock | anti-replay/offline/campaign policy | P1 |
| COL-001 | 여정 기반 digital souvenir/NFT | P p.3,10 | 현재 핵심 UI에서 제외 | utility/rights/recovery/cost 정의 후 | P2 |

## 6. 체인·Sui·증거·제출

| ID | 요구사항 | 근거 | 목업 샘플 | 생산 구현/증거 | 우선순위 |
|---|---|---|---|---|---|
| CHN-001 | OmniOne Chain에 비식별 이벤트 hash anchor | P p.4~6,11 | fake event evidence | real/sandbox receipt와 explorer | P0 |
| CHN-002 | chain은 PII/VC/결제 원문·ledger를 보관하지 않음 | P p.6,11, M | redacted mock | payload schema/chain scan | P0 |
| CHN-003 | anchor 지연이 결제/주문을 뒤집지 않음 | M | pending concept | outbox/retry/DLQ/reconcile | P0 |
| SUI-001 | Move package를 Sui Testnet/Mainnet 배포 | S | 없음 | package ID/source/build/test/explorer | P0 |
| SUI-002 | Sui 기능 2개 이상 실제 통합 | S | 없음 | tx/blob/proof와 user flow | P0 |
| SUI-003 | Agentic AI onchain asset/capability·provenance | S | ambient AI UX만 | Move objects/events, approval, receipt | P0 |
| SUI-004 | Sui exact spec은 개발자 ADR로 확정 | M | 없음 | approved ADR-SUI-001 | P0 Gate |
| SUI-005 | Walrus 사용 시 public/no-confidentiality guardrail | S official | 없음 | data inventory/encryption/scan | P0 if selected |
| EV-001 | LIVE/SANDBOX/SIMULATED 사실 표시 | M | `/evidence` | provider-verifiable evidence service | P0 |
| EV-002 | 동일 operation ID로 holder/partner/chain 대사 | M | shared demo journey | reconciliation report/tests | P0 |
| SUB-001 | 공개 GitHub와 재현 README | S | repo/README 있음; 루트 제안서에 팀 PII 존재 | sanitized 자료, history/secret scan, clean setup | P0 |
| SUB-002 | DeepSurge 등록·최종 제출 | S | 없음 | submission URL/receipt | P0 external |
| SUB-003 | Sui AI case study 1페이지 | S | 없음 | reviewed final artifact | P0 |

## 7. 보안 감사 관점

| ID | 요구사항 | 근거 | 적용 |
|---|---|---|---|
| SEC-001 | chain/Move upgrade·admin·currency 권한 감사 | A, S | Sui/OmniOne ADR, capability custody |
| SEC-002 | 정책·attestation·agent delegation 감사 | A, S | OpenDID/Policy/Sui capability |
| SEC-003 | ZK/nullifier/Merkle/trusted setup 의존성 감사 | A | 실제 ZK를 선택할 때 specialist review |
| SEC-004 | OAuth/custody/credential store AppSec | A | CX/OpenDID/zkLogin/wallet |
| SEC-005 | RPC/mempool/explorer/operational DoS·권한 | A | Sui/OmniOne/provider ops |

Maroo의 Cosmos-EVM·OKRW·PCL·gnark 구현 자체는 K-Tour 필수 범위가 아니다. 위 표는 적용 가능한 감사 렌즈만 추적한다.

## 8. 현재 가장 큰 생산 공백

1. 실제 CX/OpenDID 공급자 환경·credential·receipt가 없다.
2. Passport eKYC·결제·partner API 공급자가 확정되지 않았다.
3. 서버 auth/DB/ledger/outbox/realtime/moderation이 없고 상태가 localStorage다.
4. Sui Move·zkLogin/PTB/Walrus/DeepBook·Agentic provenance 구현이 아직 없다.
5. PII retention, asset 법적 성격, issuer/partner 책임이 미결정이다.
6. 실제 실행 증거·DeepSurge·case study가 없다.
7. 공개 GitHub 전 루트 제안서의 팀원 PII와 git history를 정리해야 한다.

이 공백은 목업의 UX 완성도와 별개이며, [개발자 결정 목록](./DEVELOPER_DECISIONS_REQUIRED.md)과 구현 Gate에서 닫는다.
