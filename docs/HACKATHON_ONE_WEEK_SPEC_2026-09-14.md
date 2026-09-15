# K-Tour ID 해커톤 1주 개발 명세

작성일: 2026-09-14 · 개발 인계안 v3 · 대상: 구현 개발자, 기술 담당자, 시연 담당자

**2026-09-14 추가 요청으로 OmniOne CX + OpenDID + OmniOne Chain + Sui 모두 이번 팀의 필수 구현 범위다.** [Sui 필수 추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md)의 Move·zkLogin·PTB·Agentic AI 및 A13–A20도 함께 구현한다. 인원·환경·일정은 재확인이 필요하다. [해커톤 연동 개발 요약](./HARVEY_HACKATHON_HANDOFF_2026-09-14.md)에서 시작하며, 아래 API·타입·설정은 새 구현 제안이지 이미 연결된 서버나 공급자 공식 규격이 아니다.

## 0. 먼저 읽을 한 페이지

### 이번 주의 결과

**지도 속 장소 1곳 → 비금전 체험 혜택 1개 → 실제 모바일 신분증 확인 → K-Pass 발급·보관·제시 → AI 제안·사용자 승인 → Sui 한정 권한 위임·agent 실행 → 서버 최종 자격 판정·혜택 1회 사용 → OmniOne 기록 → 같은 장소 복귀.**

- 국내 Mobile ID 경로 1개, 실제 holder 1종, 시연자 1명 이상, 장소 1곳, 캠페인 1개, OmniOne 계약 1개와 Sui Move package 1개를 연결한다.
- 신원은 CX, VC/VP는 OpenDID, 제한된 agent 실행은 실제 Sui effects, 업무 기록은 OmniOne receipt로 검증한다. 서비스 혜택은 **금전·실물 제공 의무 없는 해커톤 체험 권한**이다.
- 화면을 새로 디자인하지 않는다. 기존 모바일 지도·장소·동의·결과·복귀 UX를 재사용한다. 기술명은 소비자 주 CTA에 올리지 않는다.
- 기존 결제·충전·예약·외국인 여권 흐름은 목업으로 유지한다. 이들의 실제 연동은 이번 주 완료 조건이 아니다.
- **기술 범위는 위 요청을 따르되 일정·담당·환경은 착수 합의가 필요하다. 문서 작성이나 기존 목업 테스트 통과가 실제 연동 완료를 뜻하지 않는다.**

### 일정 가정과 우선순위

초안은 숙련 개발자 **2–3명**, 첫날 테스트 환경·실기기 확보, 기존 OpenDID 서버/실제 holder 재사용을 가정했다. Sui/zkLogin/Move/agent가 추가되어 **별도 Sui·AI 담당 배정을 우선 검토**한다. Harvey의 기존 연동과 woogieboogie 측 FE·QA 지원에 새 작업이 더해지므로 같은 인원·같은 일정의 달성을 보장하지 않는다. 신규 holder 앱 개발은 포함하지 않는다. 9/15 정오 환경 Gate, 당일 네 기술 smoke를 목표로 한다.

| 구분 | 이번 주 범위 | 판단 |
|---|---|---|
| M0: 공식 필수에 대응하는 최우선 | 실제 모바일 신분증 결과로 서비스 접근 결정. 기본 경로는 OmniOne CX | 다른 작업보다 먼저 실제 승인·검증 결과 확보 |
| M1: 팀 필수 시연 범위 | 같은 여정의 OpenDID 발급/VP + OmniOne Chain 업무 기록 | 공식적으로는 선택과제지만 **이번 팀 구현에서는 필수** |
| M2: 팀 필수 Sui 바운티 범위 | Move 핵심 권한 로직 + zkLogin/PTB + Agentic AI/provenance + 별도 제출 | **필수**. 등록·심사·지급은 개발 완료와 별도 확인 |
| 제외 | 실제 원화/스테이블코인 충전·결제·환불, 상점 예약 공급자, Passport/Residence, 교통·배달, 새 지도·범용 AI 추천·채팅 시스템 | 기존 목업 보존. 이번 체험 혜택 도우미·agent 구현은 제외 대상 아님 |

M0만 연결하거나 M2 없이 끝내면 이번 팀 필수 구현 완료가 아니다. 환경 지연으로 M1/M2를 자동 제외하지 않는다. 지원·추가 인력·환경 해결을 먼저 요청하며, 범위 변경은 제품 책임자의 새 명시적 승인 사항이다. 1인이거나 환경이 없으면 일정 전제를 재협의한다.

### 기존 문서와의 관계

착수 합의 후 이 문서는 **1주 스프린트의 범위·우선순위·수락 조건**에 한해 기존 전체 개발 문서를 대체한다. 보안·개인정보 경계를 완화하지 않는다. 권장안에서 BE-01–16 전체, 6종 체인 이벤트, 실제 금융/예약 운영화는 이번 주 필수가 아니다. 장기 제품 요구를 삭제한 것은 아니다.

---

## 1. 공식 조건, 사업 제안, 이번 주 선택을 구분하기

2026-09-14 확인한 공식 가이드 p5·p8은 모바일 신분증 활용을 필수, OpenDID와 OmniOne Chain을 각각 가점 5%의 선택과제로 구분한다. CX는 채택 연동 경로이며 정부 SDK 직접연동 대안도 안내된다(p19–26). **선택과제의 실제 활용 인정 수준은 주관사에 확인하며, 연결 버튼이나 샘플 성공만으로 가점을 주장하지 않는다.** [공식 가이드북](https://opendid.org/download/hackathon/2026/2026%20%EB%B8%94%EB%A1%9D%EC%B2%B4%EC%9D%B8%20%26%20AI%20%ED%95%B4%EC%BB%A4%ED%86%A4%20%EA%B0%80%EC%9D%B4%EB%93%9C%EB%B6%81.pdf?v=20260430)

같은 가이드 p12에는 Track 2의 결선 제안서와 MVP 시연 동영상 제출일이 **2026-09-21**로 적혀 있다. **18:00 KST 마감은 9/14 팀 대화로 전달된 시각**이며 PDF에서 추정하지 않는다. 9/18 기능 동결, 9/20 자료 확정, 9/21 15:00 내부 제출·접수 확인을 제안한다. 최신 메일의 영상 형식·제출 방법·환경 인정 조건은 제출 담당자가 확인한다. [공식 가이드북 p12](https://opendid.org/download/hackathon/2026/2026%20%EB%B8%94%EB%A1%9D%EC%B2%B4%EC%9D%B8%20%26%20AI%20%ED%95%B4%EC%BB%A4%ED%86%A4%20%EA%B0%80%EC%9D%B4%EB%93%9C%EB%B6%81.pdf?v=20260430#page=12)

사업 제안서의 신원 정규화 → K-Pass → 서비스 권한 → 업무 기록을 한 개의 체험 혜택으로 축소 구현한다. **외국인 온보딩·체류권·Payment KYC·지역 주민 혜택을 Mobile ID 한 번으로 입증했다고 주장하지 않는다.** 실제 원화 스테이블코인은 후속 범위다. Sui는 추가 바운티를 목표로 이번 팀 필수에 포함하지만 DID 주관사의 공식 필수/후원 트랙으로 표현하지 않는다. 확인한 Sui 프로그램 조건·상금 차이·별도 접수는 [추가 명세 §1](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md#1-범위와-공식-근거)을 따른다. 사업 PDF의 개인정보·연락처는 개발 자료/영상에 복사하지 않는다.

## 2. 코드와 환경: 첫 30분

| 항목 | 시작점 |
|---|---|
| UX 목업 | [K-Tour ID](https://ktour-id.vercel.app), 공개 진입 `/`. 새 대표 주소 배포·검수는 [현재 인계 기록](./KTOUR_PRODUCTION_HANDOFF_2026-09-15.md) 참고 |
| 앱·문서 인계 기준 | 기준 `main`, Harvey 시작 `handoff/harvey-20260914`; 앱 코드·동기화 검수 기준 `4cb1964`에서 일치 확인. 이후 문서 전용 커밋은 양 브랜치 동일 반영. [원 인계 snapshot `9d4aec9`](https://github.com/woogieboogie-jl/k-tour-id/tree/9d4aec9)와 runtime source `cc3d7c3`는 과거 기록 |
| 기존 운영 목업 기준 | `cc3d7c3`, [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md). 공유 카드·무채색 아이콘만 변경했으며 최종 배포·검수 상태는 해당 기록을 따른다. 마지막 기능 흐름 검수 `e2ad7c4`는 [이전 매장 After 19 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md)의 별도 증거다. 실제 CX/OpenDID/Chain/Sui 연동 및 이 문서의 개발 범위는 변경하지 않음 |
| 앱 디렉터리 | 인계 브랜치를 clone한 저장소의 `k-tour-id-app/` |
| 새 구현 분리 | 위 소스에서 해커톤 연동 브랜치와 별도 HTTPS staging을 생성. 기존 공개 목업을 즉시 덮어쓰지 않음 |

코드 저장소 접근 권한과 인계 브랜치 존재를 먼저 확인한다. Node.js 22.13 이상과 pnpm 10.8.0을 사용한다.

```bash
git clone --branch handoff/harvey-20260914 --single-branch https://github.com/woogieboogie-jl/k-tour-id.git k-tour-id-handoff
cd k-tour-id-handoff/k-tour-id-app
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:contracts
pnpm build:vercel:ondo-b
pnpm exec next start .ondo-b-standalone -p 3438
```

계약 테스트는 standalone stage를 다시 만들므로 위 stage 서버를 켠 상태에서 병렬 실행하지 않는다. 기존 테스트는 목업 회귀 검사이며 실제 공급자 검증의 대체물이 아니다.

**제안 구현 구성:** 기존 Next.js/TypeScript UI·BFF + 트랜잭션을 지원하는 PostgreSQL 1개 + DB outbox를 처리할 작은 worker 1개. OpenDID는 선택 release의 공식 서버 구성과 실제 holder를 재사용한다. 이미 팀 환경이 있으면 그 구성을 우선한다. Kafka·Redis·마이크로서비스 분리는 필수가 아니다. OpenDID 장기 실행 서버와 worker를 Vercel 요청 함수 하나에 억지로 넣지 않는다.

## 3. 착수(9/14–15)에 확정할 것과 진행/중단 기준

역할 제안: A=Harvey(Identity·서비스 서버·OmniOne), B=woogieboogie 측(FE·QA), C=Sui·AI 담당(미정, 별도 배정 우선). 서비스 서버/Move/agent를 FE 담당에게 자동 이전하지 않는다. 실제 가용 시간과 지원 인원을 확인한 후 확정하며, 제품 책임자는 계정·주관사 문의·시연자·Sui 등록을 지원한다.

| 확인 항목 | 담당 | 통과 증거 |
|---|---|---|
| CX 팀 환경, 테스트 Mobile ID, 제공 앱, 허용 도메인/callback, 결과 검증 방법 | A + 제품 책임자 | 시연 실기기에서 승인 → 서버 검증된 결과 1건. 브라우저 success 문자열로 대체 금지 |
| OpenDID release/commit, issuer·TA·verifier 등록, schema, 실제 holder 플랫폼 | A | 같은 환경에서 실제 VC 발급·보관·VP 제출 smoke 성공 |
| OmniOne network/API 또는 RPC, 배포 권한·signer·gas, receipt 검증 방법 | A (+ 필요 시 C) | 계약 테스트 배포·호출 및 조회 가능한 실제 receipt |
| Sui network·Move 권한·zkLogin/prover·agent·gas와 등록 조건 | C + 제품 책임자 | 실제 zkLogin/PTB·Move smoke, agent/provenance 구현안, DeepSurge 등록/마감 확인 |
| 서비스 정책·장소·사용자 중복 기준 | A + 제품 책임자 | 아래 캠페인 1개 확정. 신원 subject 연속성·만료·사용횟수 기준 문서화 |
| 제출 마감/동영상 형식/테스트 환경 인정, 인원·지원 담당자 | 제품 책임자 | 최신 팀 안내 확인 및 담당자 기재 |

**정책 기본안:** `hk-identity-perk-v1`, 서비스 목적 `redeem_demo_entitlement`, 신원 확인된 동일 subject당 1회, 현금 가치 0, 만료는 캠페인 종료 시각. 국내/외국인·체류·연령·지출 한도 조건은 넣지 않는다. 실제 협력 매장이 없다면 기존 장소는 시연 배경일 뿐이며 “해커톤 체험 혜택”임을 사용 전/결과에 짧게 표시한다.

**Gate:** 9/15 정오까지 네 기술의 환경 준비 상태·blocker를 공유하고, 당일 종료까지 실제 smoke를 목표로 한다. 어느 하나라도 미확보이면 원인·지원 담당·해결 기한·추가 인력 필요를 즉시 팀에 공유한다. **OpenDID/OmniOne/Sui를 자동 제외하거나 CX-only를 이번 팀 완료로 처리하지 않는다.** 범위 변경은 제품 책임자의 별도 새 승인 사항이다. 샘플을 실제 연결로 바꾸어 말하지 않으며 정부 SDK 전환도 별도 승인·환경 확인 없이 즉석 우회책으로 취급하지 않는다.

## 4. 만들 사용자 흐름

```text
장소 상세 → 체험 혜택 확인 → 이용 조건·정보 제공 동의
 → CX 실제 확인 → OpenDID K-Pass 발급·holder 보관
 → 해당 장소/혜택 목적의 VP 요청·동의·검증
 → 서버 자격 판정 → AI의 허용된 행동 제안 → 범위 확인·사용자 승인
 → zkLogin/PTB 위임 → Sui agent 실행 → 실제 effects 검증
 → 서버 최종 자격/취소 재확인 → 1회 사용 기록
 → 같은 장소로 복귀
                  └→ outbox → OmniOne 실제 기록 → 증거 조회
```

| 상태 | 소비자에게 보일 행동 | 서버 결과 |
|---|---|---|
| 미확인 | 필요한 신원 확인 시작 또는 닫기 | `proof_required`, 사용 기록 없음 |
| 유효한 VC·VP | 조건 확인 후 혜택 사용 | `allow`; **허용 판정만으로 사용하지 않음** |
| 전송 전 동의 거절/취소 | 같은 장소로 돌아가기 | 해당 요청 종료, 발급/사용을 임의 생성하지 않음. 전송 후 중단은 추가 명세 §4의 경합 처리 적용 |
| 만료·철회·다른 요청의 proof | 재확인 또는 이용 불가와 이유 | `expired` / `deny` |
| 공급자 장애/결과 미확정 | 같은 요청의 상태 확인 | `pending` / `unknown`; 자격 false나 성공으로 바꾸지 않음 |
| 사용 완료/재클릭 | 동일 사용 내역 보기 | 사용 1회, 기존 operation 반환 |
| 사용 완료·체인 대기 | 서비스 결과 유지, 상세에서 기록 상태 확인 | 업무 완료와 체인 확인 상태 분리 |
| Sui 실행됨·서비스 미확정 | 처리 확인/이유 보기 | `authorization_consumed / fulfillment_pending` 또는 `fulfillment_blocked`; 혜택 완료로 표시하지 않음 |

### 기존 코드에서 새로 필요한 부분

현재 `START_CHECKOUT`은 account+payment KYC를 요구하고 `visitor_benefit`은 체류 조건을 소비한다. 이 경로의 검사를 제거해서 CX 전용 시연을 만들지 않는다. **금액 없는 `REDEEM_DEMO_ENTITLEMENT` action·정책·작은 확인/결과 UI를 별도 추가**한다. 이는 이번 개발의 명시적 FE 작업이며 현재 목업에 이미 연결되어 있다는 뜻이 아니다.

- 필요 화면은 기존 장소 CTA, 신원/holder/presentation sheet, 결과 카드 디자인으로 조립한다. 주 CTA는 “체험 혜택 보기”, “확인하고 사용하기”처럼 사용자 행동으로 표현한다.
- 결제·충전·예약 목업은 별도 모드에 남긴다. 실제 인증 결과를 목업 결제 권한으로 복사하지 않는다.
- `KPassDemoCredential`의 SIMULATED 경계를 완화하지 않는다. 실제 결과는 별도 provider DTO와 서버 판정 adapter로 연결한다.
- 외부 앱 복귀는 전체 페이지 재생성을 전제로 한다. 현재 메모리 기반 지도 snapshot만으로 충분하지 않다. 장소·도시·검색·목록/지도·카메라·선택 UI를 TTL 있는 복귀 context로 보존하고, 서버 operation 조회 후 복원한다. 권한/proof/메모/서명은 URL이나 UI 저장소에 넣지 않는다.
- Sui/AI 제안·위임·agent 실행 상태도 새 provider 흐름으로 연결한다. 단순 wallet 연결 또는 기존 방문 badge 민팅으로 대체하지 않는다. [추가 명세 §2–5](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md#2-대표-여정과-기술-역할)를 따른다.

## 5. 기술별 최소 상세 스펙

### 5.1 CX: 신원 증거 하나

1. 서버 세션과 불투명 operation ID를 만들고 목적·동의 버전·복귀 context·만료를 묶는다. 익명 탐색은 유지하고 필요한 때만 서버 세션을 시작한다.
2. 팀에 제공된 방식의 표준창/실제 앱 handoff를 연결한다. 모바일 앱 전환과 돌아오기, 사용 취소를 구현한다.
3. callback은 완료 알림이지 성공 권한이 아니다. 서버에서 팀 제공 규격에 맞게 token/result, 서명/issuer/audience/시간, 원 transaction/session을 검증하고 재사용을 차단한다.
4. 내부 `IdentityEvidence`로 최소 변환: `evidenceId, subjectRef, source=cx_mobile_id, personVerified, verifiedAt, expiresAt, providerTransactionRef`. 원문은 일반 DB·로그·분석 도구에 남기지 않는다.
5. `subjectRef`는 서버가 검증된 동일 인물을 연결하는 식별자다. credential 재발급·holder 변경으로 혜택 횟수를 초기화하지 않는다. 공급자가 같은 인물을 연계할 근거를 주지 않으면 임의 이름/DOB 해시로 보완하지 말고 D1 blocker로 기록한다.

### 5.2 OpenDID: 최소 K-Pass 하나

- 선택한 release의 issuer/TA/verifier/holder를 동일 환경·버전으로 고정한다. 공식 release 설치 문서를 사용하되 새 native wallet 제품 개발은 하지 않는다. [공식 release 자료](https://github.com/OmniOneID/did-release)
- **`did-demo-app` 웹페이지는 실제 holder의 대체물이 아니다.** 공식 README도 실제 데이터 및 QR 자격 거래가 없는 시뮬레이션임을 설명한다. 준비된 실제 앱/SDK로 발급·보관·제시 receipt를 얻어야 한다. [공식 Demo App 설명](https://github.com/OmniOneID/did-demo-app)
- 앱 정규화 schema 제안: `KPassHackathonCredential/v1`. `holderBinding, issuerRef, schemaVersion, personVerified, serviceAccess=["redeem_demo_entitlement"], validFrom, validUntil, policyVersion, statusRef`만 사용한다. 실제 VC 문서 구조·proof 필드와의 mapping은 고정 release 규격으로 구현한다.
- `personVerified`는 CX 검증에서, `serviceAccess`는 K-Tour ID 체험 정책에서 부여한다. 정부의 상업 혜택 보증이나 실제 관광 주민증 발급으로 표현하지 않는다. 불필요한 이름·생년월일·국적·체류기간·결제한도를 VC에 추가하지 않는다.
- 발급 성공과 holder 저장 완료를 분리한다. 저장 확인 실패는 같은 발급 operation을 조회·재전달하며 새 VC를 무조건 발급하지 않는다. CX subject와 holder 소유 증명을 발급 세션에 바인딩한다.
- VP는 holder 동의·proof·issuer 신뢰·현재 status·유효기간·요청 nonce/audience/domain/purpose를 검증한다. 최소 claim을 가진 VC/VP를 사용한다. 별도 ZKP를 구현하지 않았다면 최소공개와 영지식증명을 동일시하지 않는다.
- VP challenge nonce는 검증 성공과 판정 생성 시 원자적으로 소비한다. 동일 제출의 멱등 재시도는 기존 판정을 반환하고 다른 제출/요청으로의 재사용은 거절한다. 취소·거절·만료된 요청은 다시 제출할 수 없다. 서비스 사용 권한은 별도의 단기 `decisionRef`로 발급하고 다음 단계에서 한 번만 소비한다.
- 취소·만료·철회된 VC, 다른 holder/request/venue의 proof는 최종 사용을 허용하지 않는다. status 조회 실패는 unknown이며 allow로 캐시하지 않는다.

### 5.3 서버 서비스: 체험 혜택 하나

- 독립된 서버 capability로 **지정 장소/캠페인 하나만** 활성화한다. 기존 27개 sampleOnly registry를 실제 제휴 명단으로 바꾸지 않는다.
- `subjectRef + campaignId`에 unique 제약을 두고 1회 사용을 DB transaction으로 보장한다. 발급 VC ID·브라우저 세션 ID만으로 중복 사용을 판단하지 않는다.
- 판정은 `session subject + holder + credential + venueId + campaignId + purpose + policyVersion + nonce + expiresAt + consentDigest`에 묶는다. 다른 장소/캠페인으로 옮긴 approval은 거절한다.
- 사용 승인 시 서버가 자격을 확인하고 **durable intent/예약만 생성**한다. 아직 혜택 사용 완료가 아니다. proof/decision TTL 기본 5분, status freshness 최대 60초에 더해 Sui grant 실행 기한과 서비스 확정 기한을 D2에 별도 고정한다.
- 같은 intent의 Sui 실행 effects를 검증한 뒤 현재 만료·철회/status freshness·캠페인·취소·미사용을 최종 재확인한다. 외부 issuer 상태와 체인·DB의 원자성은 보장하지 않는다. 자격 불충족/불명은 fulfillment blocked/pending이며 사용하지 않는다.
- 최종 서버 권한 확인 → `decisionRef` 1회 소비 → redemption 1건 + OmniOne outbox 1건만 DB transaction으로 기록한다. **이미 확정된 Sui consume는 DB rollback 대상이 아니다.** VP nonce를 다시 소비하지 않으며, 동일 idempotency key/동일 body는 같은 결과, 다른 body는 conflict다. intent/grant 중복·취소 경합·재조정은 추가 명세 §4를 따른다.
- 직접 reload·재로그인·중복 callback·동시 두 탭에서도 새 혜택을 만들지 않는다. 신규 캠페인 reset은 관리자용 분리 동작이며 소비자 UI·query flag로 열지 않는다.

### 5.4 OmniOne Chain: 기록 계약 하나

- 이벤트는 `DemoEntitlementRedeemed` 1종만. 기존 6종 이벤트·결제 승인·정산·지갑 연결 전부를 이번 주에 구현하지 않는다.
- 제안 인터페이스: `recordRedemption(bytes32 eventKey, bytes32 payloadCommitment)`. 허용된 signer만 호출하고 이미 기록한 eventKey는 거절한다. 실제 network·contract·ABI·receipt 규격은 팀 환경과 맞춘다.
- eventKey는 업무별 무작위 식별자. commitment에는 비식별 업무 종류·schema version·무작위 salt만 사용하며, 개인정보/그 단순 해시, DID/VC ID, 생년월일·국적·정확한 위치를 올리지 않는다. 원 operation↔event 매핑은 서버 내부에 둔다.
- outbox worker가 제출하고 chain/network/contract, 성공 receipt, eventKey·payload 일치를 조회한 후 `confirmed`로 표시한다. tx hash만 받았다고 확인 완료로 표시하지 않는다.
- 제출 후 응답 유실은 기존 tx/eventKey 조회로 복구한다. 무조건 새 tx를 보내지 않는다. 재처리 중 contract의 duplicate 오류는 해당 기존 event가 같은 payload임을 검증한 경우에만 기존 기록과 연결한다.
- 혜택 사용 원장은 DB, 체인은 그 결과의 중복 기록 방지·검증 증거다. **체인이 실제 혜택 승인이나 금융 정산을 수행한다고 말하지 않는다.** 체인 장애가 이미 완료된 혜택을 다시 사용하게 만들면 안 된다.

### 5.5 Sui·zkLogin/PTB·Agentic AI: 필수

[Sui 필수 추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md)의 HK-06–09, 데이터·API·실패 계약과 A13–A20을 구현한다. OmniOne 감사 기록과 Sui 실행 권한의 역할은 다르며 두 체인의 확정 상태를 합치지 않는다. 실제 금융·브리지·10회 방문 badge는 포함하지 않는다.

## 6. 최소 BFF·데이터 계약

아래 `/api/hackathon/v1`은 **신규 격리 API 제안**이다. 현재 배포된 endpoint도 CX/OpenDID 공식 endpoint도 아니다. 9/15 종료까지 OpenAPI로 고정한다. 전체 제품의 `/api/v1` 제안을 이번 주에 모두 구현할 필요는 없다.

| API | 입력/출력과 책임 |
|---|---|
| `POST /sessions`, `GET /me` | 서버 session 생성·현재 actor 조회. Secure/HttpOnly cookie, state/CSRF·origin 검증. 시연 계정 접근 제한과 rate limit |
| `GET /places/{venueId}/demo-entitlements` | 서버가 허용한 캠페인·목적·기간·사용 상태. 금액 없음, 다른 장소는 미지원 |
| `POST /identity/sessions`, `POST /identity/sessions/{id}/cancel` | 목적/consentVersion/returnContextId → operationId·만료·허용 handoff. 취소 가능 단계만 수용 |
| `POST /identity/callbacks/cx` | vendor correlation 검증과 서버 result 조회. callback 입력만으로 verified commit 금지 |
| `POST /credentials`, `POST /credentials/{id}/holder-ack`, `GET /credentials/{id}/status` | 검증 evidence·holder binding → 발급/보관/현재 status. ack는 실제 holder 증거 검증, boolean 수신만으로 완료 금지 |
| `POST /presentations/requests` | venue/campaign/purpose → 요청 ID·nonce·expiry·사용자가 확인할 최소 항목/요청 digest |
| `POST /presentations/{id}/submit`, `POST /presentations/{id}/deny` | 실제 holder proof 또는 명시 거절. 요청/동의 digest와 proof 결합 검증 |
| `POST /demo-entitlements/{id}/redeem` | presentationId·decisionRef·consentDigest·동일 intent의 검증된 Sui 실행 증거·idempotency key → 최종 서버 재검증 후 redemption. Sui 증거 없는 DB-first 성공 금지 |
| `GET /operations/{id}` | actor 범위의 identity/issuance/presentation/redemption 상태·결과·복구 행동. polling/reload/unknown 복구 공통 |
| `GET /operations/{id}/evidence` | 연결된 체인의 pending/confirmed/failed/unknown·검증된 공개 receipt. 다른 actor 기록은 거절 |

```ts
// DID/서비스 공통 DTO 초안. Sui proposal/delegation/dispatch/fulfillment DTO는 추가 명세 §5와 함께 D2 OpenAPI로 확정.
// SDK raw response 또는 기존 mock enum과 동일하지 않음.
type OperationStatus = "pending" | "succeeded" | "failed" | "cancelled" | "expired" | "unknown";
type Decision = "allow" | "proof_required" | "deny" | "expired";
type OperationResult = {
  operationId: string; kind: "identity" | "issuance" | "presentation" | "redemption";
  status: OperationStatus; revision: number;
  phase: "handoff" | "verification" | "issuance" | "holder_delivery" | "holder_ack" | "decision" | "commit" | "done";
  execution: "provider"; safeNextAction: "wait" | "check_status" | "retry" | "return";
  allowedActions: Array<"open_handoff" | "issue" | "ack_holder" | "present" | "redeem" | "cancel" | "check_status" | "return">;
  result?: {
    evidenceRef?: string; credentialRef?: string; presentationId?: string;
    decision?: Decision; decisionRef?: string; redemptionRef?: string;
  };
  error?: { code: string; retryable: boolean };
};
```

정상 identity 결과는 evidenceRef, 발급 후에는 credentialRef, 제시 요청은 presentationId를 반환하여 cold return 뒤 동일 단계를 재개할 수 있게 한다. phase/allowedActions는 서버 상태에 맞게 내려주며 허용하지 않은 action은 서버도 거절한다. 식별자는 불투명 참조일 뿐 권한이 아니며 모든 조회·mutation에 소유권을 검사한다. 전달용 result에는 VC 원문·provider token·민감 claim을 넣지 않는다. policy deny는 정상적으로 수행한 판정 결과일 수 있으며 network failed와 구분한다. identity 승인과 presentation allow, redemption success를 혼동하지 않는다.

필수 테이블은 `sessions, identity_evidence, credentials, presentations, redemptions, operations, outbox` 정도로 제한한다. 캠페인 1개는 서버 설정으로 고정 가능하다. 모든 operation은 actor·요청 digest·idempotency key·상태·revision·생성/만료·provider ref를 보관한다. `redemptions(subjectRef,campaignId)`, `outbox(eventKey)`, nonce 소비, scoped idempotency key의 unique 제약을 migration으로 제공한다.

Sui 때문에 `agent_proposals, delegations, sui_operations` 또는 동등 구조가 추가된다. durable intent/grant/provenance/체인별 receipt와 서비스 사용 여부를 분리한다. 추가 API·필드·unique 제약은 추가 명세 §5를 포함해 고정하며 위 공통 DTO만으로 전체 구현이 끝난다고 해석하지 않는다.

보관 기본안: 해커톤 테스트 계정만 허용하고 종료 후 삭제일·담당자를 D1에 지정한다. 비밀키는 secret manager/환경 secret에만, `NEXT_PUBLIC_*`에는 넣지 않는다. 실제 키·신분증·전체 VP·JWT는 로그/녹화/Git에 금지한다. SDK가 원문 임시 보관을 요구하면 암호화·접근 제한·삭제 경로를 먼저 확정하고 원문 미보관이라고 주장하지 않는다.

## 7. FE 연결 파일과 배포 체크

경로 기준은 `k-tour-id-app/features/ondo/`이다. 아래는 기존 파일이며, 오른쪽의 provider adapter·새 action은 **이번 주 구현 대상**이다.

| 기존 연결점 | 이번 주 바꿀 지점 |
|---|---|
| `place/place-service-actions-b.tsx`, `commerce-b/place-service-registry-b.ts` | 지정 장소의 독립 체험 혜택 capability/CTA. 기존 가격·결제·예약 capability와 분리 |
| `identity-b/identity-handoff-step-b.tsx`, `ktour-id-setup-b.tsx` | 실제 CX 시작·앱 복귀·서버 조회. provider 모드에서 sample 승인 버튼 사용 금지 |
| `identity-b/identity-holder-step-b.tsx` | 실제 발급/보관 상태·부분실패·동일 operation 재조회 |
| `identity-b/action-gate-contract-b.ts`, `action-gate-coordinator-b.tsx` | 새 비금전 action, 최소 목적 동의, provider DTO/VP adapter. 기존 checkout/person/payment 규칙을 느슨하게 만들지 않음 |
| `map/map-entry-b.tsx`, `map/place-service-map-return-b.ts` | TTL 복귀 context와 cold return. useRef snapshot 유실 시 기본 지도만 보여주고 원 행동 성공을 추정하지 않음 |
| `integration-demo-b/integration-demo-b.tsx`, `integration-demo-model-b.ts` | 최소 증거 panel에 실제 operation·chain receipt 연결. 로컬 mock event와 provider event 분리 |
| `commerce-b/wallet-connection-preview-b.tsx`, `labs/labs-entry.tsx` | 디자인만 재사용. 실제 zkLogin/PTB/agent adapter·provider 상태·새 action은 구현 대상; 기존 방문 badge/fixture와 분리 |

최소 환경 항목: `HACKATHON_EXECUTION_MODE`, `PUBLIC_APP_ORIGIN`, 허용 callback origin, DB 접속 secret, CX 팀 config/검증 설정, OpenDID release·서버 주소·schema·키 참조, OmniOne network·contract·ABI·signer secret·finality 정책, 캠페인/장소/만료. 이름은 제안이며 실제 vendor 설정명을 가장하지 않는다.

Sui network/package/SDK 버전, OAuth audience·허용 callback, zkLogin prover/salt/ephemeral key 정책, gas/sponsor, agent signer·모델 설정·provenance version도 추가한다. 비밀값은 공개 bundle/문서에 넣지 않는다.

- 기능별 provider/mock 모드를 서버 설정으로 고정하고 API도 검사한다. 브라우저의 `review`·fixture·localStorage로 provider 권한을 만들 수 없어야 한다.
- 실제 연동 API·정적 파일은 `scripts/ondo-b-standalone/policy.mjs` 등의 배포 allowlist에 **정확한 경로만** 추가한다. 전체 legacy route 개방 금지. 기존 artifact scan/HTTP 경계 검사를 유지한다.
- CSP·CORS·callback·딥링크를 실제 공급자 origin 단위로 허용한다. wildcard·임의 return URL 금지. 외부 return에는 opaque state만 사용한다.
- 백그라운드 재조회와 worker는 새로고침·프로세스 재시작 후 DB에서 재개한다. 세션을 잃은 경우 안전하게 재확인하며 client의 과거 allow를 복구 근거로 쓰지 않는다.
- 기존 공개 목업은 유지하고 별도 staging에서 시연한다. 키·신분증이 없는 팀원도 목업을 볼 수 있지만 실제 연동 완료 화면에 자동 합류하면 안 된다.

## 8. 7일 작업표와 수락 기준

| 일자 | 구현 | 그날 끝내야 할 증거 |
|---|---|---|
| D1 (9/14) | GitHub 앱·문서 인계, 접근·가용 시간·정책·계정/기기 준비 확인 | 인계 commit·담당/환경 현황·지원 요청 |
| D2 (9/15) | 정오 환경 Gate, CX/OpenDID/OmniOne/Sui 실제 smoke. API/DTO·장소 action·복귀·grant 계약 고정 | CX·VC/VP·OmniOne receipt·zkLogin/PTB/Move 증거, Sui 등록 상태. 미확보 항목 즉시 지원 요청 |
| D3 (9/16) | A: DID/서버/OmniOne, C: Move/agent/provenance, B: 새 흐름 FE·QA 병렬 | 실제 proof·제한된 Sui 실행·최종 재검증·DB 사용/체인 대사 |
| D4 (9/17) | 장소에서 끝까지 통합, pending/취소/unknown·재조회 | 공개 staging에서 실제 여정 1회 완주. 미완주면 추가 기능 전부 중단 |
| D5 (9/18) | 실기기 앱 왕복·cold return·공격/중복·만료·철회 검수 후 기능 동결 | A01–A20 결과와 증거. 신규 기능 추가 없음 |
| D6 (9/19) | 동결 버전 회귀·배포·성공/거절 녹화·제출 문서 | 같은 commit·config의 URL/영상/receipt, 키·PII 검열 |
| D7 (9/20) | 장애 버퍼·리허설·마감 전 전달 | 제출 패키지와 실제/목업 구분표. 신규 기술/기능 추가 없음 |
| 제출 (9/21) | 15:00 내부 제출·접수 확인 목표, 팀 안내 18:00 최종 마감 | 제출 담당자의 실제 접수 확인. 공식 시각과 내부 버퍼 구분 |

### 개발 티켓: 이것만 먼저 배정

| ID | 담당 | 완료 조건 | 기존 전체 문서 대응 |
|---|---|---|---|
| HK-00 | 책임자+A+C | 9/14–15 환경·정책·시연 기기/계정·Sui 등록, 네 필수 기술 환경 Gate | BE-01 일부·기술 ADR |
| HK-01 | A | session/CX 실제 검증, replay 거절, evidence·subject 연결 | BE-01/02 최소 |
| HK-02 | A | 실제 VC 1종 발급·holder ack·status·VP 검증 | BE-04/05 최소 |
| HK-03 | A 서버 + B FE | 지정 장소 비금전 action, 서버 판정·1회 사용·cold return. 장소 CTA·API 상태 표시·복귀 연결을 FE 하위 작업으로 포함 | BE-08/11 일부 + 새 FE action |
| HK-04 | A (+ 필요 시 C) | DB outbox·계약1개·event1종·실제 receipt·중복 방지 | BE-13 최소 |
| HK-05 | 전원 | A01–A20·모바일 회귀·녹화·DID 제출 패키지 | 영향 범위 QA |
| HK-06 | C, A 협업 | Sui Move 한정 권한·실제 effects·서비스 대사 | BE-15 일부, 추가 명세 §3 |
| HK-07 | C + B | 실제 zkLogin/PTB·서명·복귀·가스/실패 처리 | BE-15 SDK/FE |
| HK-08 | C, A 협업 | 실제 AI 제안·승인 범위 내 agent 실행·provenance 검증 | 새 최소 AI/Move 연동 |
| HK-09 | 책임자 + C | DeepSurge 등록/제출·공개 재현 코드·1페이지 case study | Sui 별도 제출 |

### 반드시 통과할 12개 검사

| ID | 행동/공격 | 기대 결과 |
|---|---|---|
| A01 | 미확인 사용자로 장소→혜택 | 먼저 proof_required, 사용 0. 지도 탐색은 계속 가능 |
| A02 | CX→VC/holder→VP→AI 제안·승인→Sui 위임/실행→최종 재검증 | 같은 subject·venue·campaign으로 사용 1건, 실제 DID/Sui/OmniOne 증거 연결 |
| A03 | CX 또는 VP 거절/취소 | 사용 0, 원 장소 복귀. 이전 승인 상태 재사용 금지 |
| A04 | 만료·철회된 credential / status 응답 불가 | expired/deny 또는 unknown, allow 0 |
| A05 | 잘못된 issuer/holder/signature/audience/nonce | 거절, 데이터 변경 0 |
| A06 | 다른 장소·캠페인·purpose·동의 digest로 승인 재사용 | 거절, 원 요청과 다른 사용 생성 0 |
| A07 | 두 탭 동시 사용·callback 중복·새 VC 발급 | subject/campaign 기준 사용 1회. 같은 key 다른 body conflict |
| A08 | 사용 제출 중 timeout·서버 재시작·reload | 동일 operation 조회, 중복 사용/outbox 생성 0 |
| A09 | 실제 외부 앱을 거친 cold return | 로그인/operation 재확인 후 같은 장소·검색/목록·카메라 복원. 서비스 확정 전 취소 수락이면 미사용, 확정 후에는 기존 결과 복원. 앱 이탈을 취소로 간주하지 않음 |
| A10 | 다른 사용자 operation 조회·CSRF·임의 callback/return URL | 권한/무결성 거절. 조회 API도 actor 소유권 검사 |
| A11 | Chain 제출 후 timeout·RPC 장애·중복 event·잘못된 receipt | 기존 event 조회·재조정, verified 전 confirmed 금지, 서비스 사용 재실행 0 |
| A12 | staging bundle·로그·영상·체인 payload·mock 주입 | 키/PII/raw VC 없음. mock/fixture 입력으로 실제 사용 0 |

실제 시연 기기 1대의 전체 native-app 왕복은 필수다. 다른 모바일 OS는 실제 지원 여부를 기록하고 목업/브라우저 회귀와 구분한다. EN/KO/JA 기존 레이아웃을 보존하되 실제 공급자 시연 언어·OS를 1개 먼저 고정한다. 실패 반례 중 공급자가 실상황을 만들 수 없는 것은 통합 테스트 fault injection으로 검증하고 **실제 공급자에서 재현했다고 표시하지 않는다.**

## 9. Sui 필수 범위와 남겨둘 목업

**Sui는 필수다.** [추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md)의 HK-06–09·A13–A20을 함께 구현한다. Move 핵심 권한·zkLogin/PTB·Agentic AI/provenance·별도 제출까지 필요하며 단순 wallet 연결/민팅은 대체물이 아니다. 추가 인력·환경·일정은 재확인한다.

Sui↔OmniOne bridge, USDC/USDT→ooKRW 전환, 실제 원화 상환은 여전히 제외한다. zkLogin은 이번 새 Sui 경로에 실제 연결하지만 금융 KYC·DID를 대체하지 않는다. 두 체인의 성공/실패·사용 권한/서비스 사용 상태를 분리하며 정확한 추가 상금 지급은 별도 운영자 검증 사항이다.

후속 유지: Passport/Residence, 금융 rails·KYC·영구 원장·환불/정산, 상점 예약 API, 모든 도시에 대한 실시간 데이터, chat/upload/moderation, 운영 계정 export/delete, 6종 체인 event, 전체 기기 조합. 이들은 기존 목업과 전체 인계 문서에 남는다.

## 10. 최종 체크리스트와 제출 묶음

### 착수

- [ ] 개발자 인원·실명 담당·시연 날짜/기기·주관사 마감 확인.
- [ ] 지정 장소/캠페인/정책 및 M0/M1/M2 담당·일정 확인.
- [ ] CX/OpenDID/OmniOne/Sui 실제 smoke와 지원 담당자 확보.
- [ ] Sui 별도 등록·참가 조건·마감·기술 활용 인정 확인.
- [ ] 브랜치·staging·server config·schema/version·DB migration 고정.

### 구현

- [ ] HK-01: 실제 CX 검증이 신원 증거를 만들고 mock와 격리됨.
- [ ] HK-02: 실제 VC 보관·VP·status, 최소 정보와 동일 holder/subject 보장.
- [ ] HK-03: 비금전 action·서버 최종 판정·사용 1회·cold return.
- [ ] HK-04: 실제 Chain receipt 검증, DB 사용과 비동기 증거 분리.
- [ ] HK-06/07: 실제 Sui Move·zkLogin/PTB·한정 권한·결과 검증.
- [ ] HK-08: 실제 AI/agent·동의·provenance·변조 검출.
- [ ] A01–A20 결과·실제/테스트 주입 여부·미해결 사항 기록.

### 전달

- [ ] 같은 커밋의 staging URL, 실행/환경설정 README, 마이그레이션과 배포/롤백 방법.
- [ ] 새 API OpenAPI·에러/상태 mapping, 고정 SDK/서버/contract/schema 버전.
- [ ] 시연용 계정/기기 준비법과 비밀정보 전달 채널. 키나 실제 문서 사본을 파일에 넣지 않음.
- [ ] 실제 CX·VC/holder·VP·AI 제안/동의·Sui 실행·redemption·OmniOne receipt의 비식별 evidence 묶음.
- [ ] HK-09: DeepSurge 실제 접수·공개 Move/앱 코드·재현 README·1페이지 Sui–AI case study.
- [ ] 정상+거절/중복/복구 영상, MVP 시연 영상과 결선 제안서. 실제 연결/목업/제외 기능 표.
- [ ] 실제 기관 서비스가 아닌 K-Tour ID 체험 혜택이라는 설명, 남은 연동과 종료 후 테스트 데이터 삭제 담당.

**녹화 권장 구성(공식 영상 길이 제한 아님):** 지도·혜택 → 실제 CX/holder·VC/VP → AI 제안·사용자 승인·Sui 실제 실행 → 서버 사용·같은 장소 복귀 → 중복·거절/복구 → 두 체인 증거·실제/목업 구분. 공급자 왕복 시간에 맞게 편집하되 실제 개인정보·QR secret·token은 가린다. 실패 장면을 샘플 성공 영상으로 덮지 않는다.

완료 판정은 “M0 실제 연결, M1 실제 연결, M2 Sui/AI 실제 연결, 서비스 시연, 복구·보안, DID 제출, Sui 접수”를 각각 체크한다. 과거 목업 테스트 수치를 이번 실제 연동 PASS로 재사용하지 않는다. **모든 새 연동 체크박스는 개발 전 미완료 상태이며 수상·지급을 보장하지 않는다.**

## 11. 개발자가 첫 회신에 채울 양식

```text
개발 인원 / 담당: A=Harvey(BE·OmniOne, 수락 여부 ___), B=woogieboogie 측(FE·QA, 담당 ___), C=Sui·AI 담당 ___
CX / OpenDID / OmniOne / Sui 환경: 준비됨(증거 ___) / 미준비(담당·해결기한 ___)
실제 holder / 시연 OS·기기 / 언어: ___
지정 장소 / 캠페인 / 정책 만료: ___
M0·M1·M2 범위: 수락 / 변경 요청(사유·대안 ___)
Sui: Move/zkLogin/PTB/agent/provenance 담당·예정일 ___, DeepSurge 등록·마감 확인 ___
우리 측에서 필요한 계정·등록·담당자 지원: ___
D4 첫 전체 시연 예정 / 제출 마감 확인: ___
가장 큰 blocker와 결정 필요 시각: ___
```

## 12. 참고 자료: 막힐 때만 열기

- 공식 조건은 §1 링크와 최신 팀 안내를 따른다. 공급자 상세 규격은 실제 제공 문서와 고정 OpenDID release를 따른다.
- 사업 원문: 저장소 루트 `TrackNo2_Hope&Woogieboogie_K-Tour ID_260531.pdf`, 신원→권한→업무 기록 설계. 개인 연락처가 있어 외부 공유용으로 그대로 복사하지 않는다.
- [전체 개발 스펙](./DEPLOYMENT_SPEC.md), [전체 BE 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md), [전체 기술 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md)는 **후속 운영화/확장용**. 이번 주에 모든 항목을 구현하라는 뜻이 아니다.
- [브랜딩 공유·아이콘 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md), [이전 매장 After 19 수정·검수 기록](./PLACE_AFTER19_FIX_2026-09-14.md), [이전 지도 우선 진입 기록](./MAP_FIRST_ENTRY_2026-09-14.md), [이전 지도·지갑 여정 기록](./MAP_WALLET_JOURNEYS_2026-09-12.md)은 UX 참고용이며 실제 공급자 연동 증거와 분리한다.
