# K-Tour ID 발표·기술 Q&A

이 문서는 현재 구현 상태에 맞춰 답하기 위한 크립시트다. `LIVE`, `SANDBOX`, `SIMULATED`는 데모 직전 [Integration Evidence](./DEVELOPER_HANDOFF.md#9-실행-증거-live--sandbox--simulated)에서 확인하고 실제 상태로 읽는다.

## 20초 피치

> K-Tour ID는 서로 다른 신원확인 결과를 하나의 민간 관광 자격 VC로 표준화하는 Tourist Trust Wallet입니다. 국가 모바일 신분증은 OmniOne CX로, 단기 여행객의 여권 확인은 별도 eKYC로 처리합니다. 이후 OpenDID 기반 K-Tour ID를 발급하고, 가맹점에는 이름이나 여권번호 대신 필요한 자격만 VP로 제시합니다. 사용·정산 이벤트는 개인정보 없이 해시로 감사 가능하게 남깁니다.

## 90초 데모

1. `0-10초`: 문제와 K-Tour ID 가치
2. `10-30초`: 실제/공식 sandbox Mobile ID QR와 callback 성공
3. `30-45초`: OpenDID K-Tour ID VC 발급과 issuer/credential evidence
4. `45-65초`: 가맹점 QR, 요청 속성 확인, 선택적 공개 동의
5. `65-78초`: VP 검증과 1회성 voucher redeem receipt
6. `78-86초`: 개인정보 없는 chain anchor evidence
7. `86-90초`: AI 추천 preview와 사용자 승인 원칙

소셜·1/n 결제·NFT·전체 쇼핑 카탈로그는 핵심 데모에서 제외한다.

## 해커톤 기술 매핑

- **필수 Mobile ID**: 국가 모바일 신분증을 OmniOne CX로 요청·검증한다.
- **OpenDID 선택과제**: K-Tour ID VC 발급, holder 제시, verifier의 VP 검증에 사용한다.
- **OmniOne Chain 선택과제**: 개인정보 없는 발급·검증·혜택·정산 event hash를 앵커링한다.
- **Passport eKYC**: 단기 여행객을 위한 별도 신원확인 어댑터이며 OmniOne CX 기능이라고 말하지 않는다.

## 예상 질문

### 모바일 신분증/OpenDID를 실제로 연동했나요?

데모 화면에 표시된 실행 수준대로 답한다.

- `LIVE`: “운영 환경에서 실행했고 provider receipt를 서버에서 검증했습니다.”
- `SANDBOX`: “공식 테스트 환경에서 실행한 결과입니다.”
- `SIMULATED`: “이 단계는 deterministic mock입니다. 실제 효력은 없으며 adapter 계약과 실패 상태를 검증하기 위한 클릭 데모입니다.”

mock인데 “어댑터 한 줄만 바꾸면 끝난다”라고 말하지 않는다. 실제 연동에는 credential provisioning, callback 검증, claim mapping, status/revocation, 오류·복구, 운영·보안 작업이 필요하다.

### 외국인도 모바일 외국인등록증을 바로 발급받나요?

아니다. 모바일 외국인등록증은 한국에 외국인등록을 마친 대상자가 국가 시스템에서 발급받는다. 일반 단기 관광객은 여권 eKYC 후 K-Tour ID가 발급하는 민간 K-Tour ID를 받을 수 있지만, 이것은 정부 신분증·비자·체류 허가가 아니다.

### Passport eKYC도 OmniOne CX인가요?

아니다. CX는 국가 모바일 신분증 연동 경로다. 여권 NFC/OCR, 얼굴·라이브니스는 별도 eKYC provider를 사용하고, 두 결과를 K-Tour ID의 IdentityEvidence 모델로 정규화한다.

### 가맹점은 무엇을 보고 믿나요?

가맹점은 nonce와 목적이 포함된 요청을 만들고, 사용자가 동의한 predicate만 담긴 VP를 받는다. Verifier는 신뢰된 issuer, 서명, holder binding, 만료, 폐기, nonce replay를 확인한 뒤 정책을 평가한다. 기본 결과는 `stayValid=true`, `benefitEligible=true` 같은 decision이며 이름·여권번호를 받지 않는다.

### K-Tour ID가 공식 신분증인가요?

아니다. K-Tour ID는 서비스 이용 자격과 혜택을 담은 민간 VC다. 공식 신원·체류 상태를 대체하지 않는다. 발급 근거가 Mobile ID인지 별도 Passport eKYC인지 credential metadata에 구분한다.

### 개인정보가 체인에 올라가나요?

아니다. 체인에는 versioned event type, pseudonymous reference, canonical payload hash와 receipt만 올린다. 이름·여권번호·생년월일·전체 DID·VC·결제 원문은 올리지 않는다. PII를 그대로 해시한 값도 재식별 위험이 있어 허용하지 않는다.

### 체인 hash가 결제나 쿠폰 중복사용을 막나요?

직접 막지는 않는다. 결제 ledger와 voucher의 원자적 상태전이·unique redemption key가 source of truth다. chain anchor는 사후 위변조 탐지와 감사 증거다.

### K-Tour ID가 분실·만료·폐기되면요?

Verifier가 status와 expiry를 확인해 사용을 거절한다. 분실 기기에서는 기존 credential을 폐기하고 새 기기에서 재인증·재발급한다. 실제 status/revocation 지원 범위는 OpenDID 제공 환경에 맞춰 구현·표시한다.

### ZKP도 되나요?

현재 확정된 목표는 필요한 속성만 공개하는 selective disclosure다. 완전한 비연결성, 특정 BBS+/ZKP 방식, OmniOne의 기본 지원 여부는 확인 전까지 구현됐다고 주장하지 않는다.

### 결제는 진짜 돈인가요?

화면의 environment 표시대로 답한다. 실제 결제 partner와 ledger가 연결되지 않았다면 demo point simulation이다. 실제 KRW/선불/stablecoin 결제는 자산 정의, 충전·환불·미사용잔액, AML/KYC, 수수료와 사업자 책임을 확정한 뒤 연동한다.

### T-money, 배민, 올리브영과 제휴됐나요?

실제 계약과 API evidence가 없으면 “연동 대상 사용 사례를 보여주는 시뮬레이션이며 제휴를 의미하지 않습니다”라고 답한다. 화면에서도 `Partner/Linked`가 아니라 `Integration concept`으로 표시한다.

### AI는 무엇을 하나요?

체류기간, 사용자가 동의한 예산·혜택 상태를 바탕으로 다음 행동을 추천한다. AI의 출력은 추정임을 표시하고, 신원·정책·결제의 최종 결정은 deterministic service가 수행한다. 돈이 움직이는 행동은 금액·대상·수수료를 보여준 뒤 사용자가 별도로 승인한다.

### 외국인은 한국 전화번호 없이 모든 국내 서비스를 이용할 수 있나요?

K-Tour ID만으로 기존 플랫폼의 가입·전화번호·결제 정책이 자동 해제되지는 않는다. K-Tour ID와 계약된 파트너 어댑터가 K-Tour ID를 수용할 때 해당 서비스를 이용할 수 있다는 것이 정확한 범위다.

### 현재 가장 중요한 미해결 사항은 무엇인가요?

`coresidence` 활성화와 테스트 credential, 팀별 CX provisioning, OpenDID issuer/holder/verifier/status 범위, chain receipt 환경, Passport eKYC와 결제 provider 선정이다. 이 항목은 숨기지 않고 Evidence 화면에서 `not configured` 또는 `pending confirmation`으로 표시한다.

## 금지 문장

- “CX로 여권 eKYC를 합니다.”
- “단기 관광객에게 모바일 외국인등록증을 발급합니다.”
- “K-Tour ID는 공식 체류자격입니다.”
- “hash를 올렸으니 결제·쿠폰 중복사용이 방지됩니다.”
- “OmniOne에 기록됐습니다.” — 실제 confirmed receipt가 없을 때
- “T-money/배민/Kakao와 연동됐습니다.” — 계약·API evidence가 없을 때
- “화면은 전혀 안 바꾸고 어댑터 한 줄만 교체하면 됩니다.”
- “ZKP/BBS+와 완전한 비연결성을 구현했습니다.” — 검증 전

상세 제품·API·보안·테스트 기준은 [DEVELOPER_HANDOFF.md](./DEVELOPER_HANDOFF.md)를 따른다.
