# Sumsub Sandbox 연동 인계

기준: `sumsub-sandbox-20260914` 작업본. 기존 운영 목업을 유지하고 **별도 Preview에서만** Sumsub WebSDK·Sandbox API를 연결한다. 실제 배포 주소·검수 결과는 검증 후 별도로 기록한다.

## 1. 이번 연결의 범위

- ONDO에서 명시적으로 테스트를 시작하면 Sumsub WebSDK를 열고, 문서 제출 후 서버가 해당 테스트 applicant의 결과를 조회한다.
- WebSDK와 API 통신은 실제 공급자 연결이지만, **Sandbox 결과는 운영 신원 확인·금융 KYC가 아니다.** Sumsub는 Sandbox에 운영 승인 알고리즘이 없다고 안내한다. [Sandbox 설명](https://docs.sumsub.com/docs/test-in-sandbox)
- 실제 적용 문서 종류·selfie/liveness 단계는 Sumsub 계정의 verification level 설정에 달려 있다. 설정을 확인하지 않고 여권·얼굴 검증 전체가 활성화됐다고 표시하지 않는다.
- 이번 WebSDK 경로에는 여권 칩 NFC 읽기를 구현하지 않는다. Sandbox 완료로 체류기간·국적·19+·결제한도·잔액·서비스 혜택을 만들지 않는다.
- CX·OpenDID·OmniOne Chain·Sui/AI의 기존 개발 범위는 그대로다. Sumsub 테스트가 DID 해커톤의 모바일 신분증 활용이나 패스 발급·체인 실행을 대신하지 않는다.

## 2. 테스트 흐름과 신뢰 경계

```text
ONDO의 신원 확인 테스트 진입 → Sandbox·외부 문서 제출 안내와 동의
 → 서버가 테스트 applicant를 현재 브라우저 세션에 연결
 → 단기 SDK access token 발급 → Sumsub WebSDK
 → 제출/상태변경 알림 → ONDO 서버가 Sumsub 결과 재조회
 → 입력 필요 / 검토 중 / 재제출 / 거절 / Sandbox 완료
```

브라우저 SDK의 완료 이벤트는 **조회 계기**일 뿐 승인 근거가 아니다. 결과는 서버가 봉인한 HttpOnly 세션의 applicant에 한해 공급자 API로 확인한다. 클라이언트가 보내는 applicant ID·GREEN·credential 값을 신뢰하지 않는다. [WebSDK 시작](https://docs.sumsub.com/docs/get-started-with-web-sdk) · [결과 해석](https://docs.sumsub.com/docs/receive-and-interpret-results-via-api)

이번 빠른 Preview는 **서버 서명 세션 쿠키 + 공급자 상태 재조회** 방식이며, 영속 DB나 webhook 수신 파이프라인을 구현한 것은 아니다. 쿠키가 유효한 같은 브라우저에서만 이어서 확인할 수 있다. 쿠키 유실·만료를 다른 계정의 상태 조회나 승인 복구 근거로 사용하지 않는다.

화면을 닫는 것은 applicant 삭제·공급자 심사 취소가 아니다. 이미 제출한 작업은 다시 열어 결과를 조회하며, 미확정 상태를 성공/실패로 추정하지 않는다. 결과 화면에는 Sandbox임을 유지하고 기존 목업 자격을 자동 변경하지 않는다.

## 3. 연결 환경·데이터 처리

| 준비할 것 | 확인할 내용 |
|---|---|
| Sumsub Sandbox 계정·verification level | 이번 계정에서 조회 확인한 `id-and-liveness` level을 사용. 실제 문서/selfie 단계는 해당 설정을 따르며 테스트 데이터를 준비 |
| Sandbox App token·Secret key | 서버 전용 secret으로 전달. 브라우저·Git·스크린샷·로그에 노출 금지 |
| ONDO 세션 봉인 키 | applicant 바인딩·만료 검증에 사용. 공급자 키와 별도 관리 |
| Preview 접근 코드 | 최초 테스트 시작을 제한하는 서버 전용 설정. 공개 문서·URL·bundle에 코드를 넣지 않음 |
| Preview origin·SDK 허용 설정 | HTTPS·정확한 origin, camera 권한·SDK 로딩·토큰 갱신 확인 |

Sandbox와 Production은 같은 API 호스트를 사용하므로 URL만으로 테스트 환경을 판단하지 않는다. 서버 설정과 공급자 Sandbox 근거를 검증해야 한다. [Sumsub API](https://docs.sumsub.com/reference/about-sumsub-api)

설정 키는 `SUMSUB_MODE=sandbox`, `NEXT_PUBLIC_ONDO_SUMSUB_SANDBOX=1`, `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`, `SUMSUB_SESSION_SECRET`, `SUMSUB_PREVIEW_ACCESS_CODE`, `SUMSUB_LEVEL_NAME`, `SUMSUB_ALLOWED_ORIGINS`다. 공개 가능한 값은 기능 표시용 flag뿐이며 나머지 계정/접속 정보는 필요한 범위의 서버 설정으로 전달한다. `VERCEL_ENV=production`에서는 연결을 거절한다. applicant 응답에 `sandboxMode`가 생략될 수 있으므로 Sandbox 전용 `sbx:` 자격증명과 서버 모드로 환경을 고정하고, 명시적으로 다른 환경을 나타내는 응답은 거절한다.

이번 연결은 `POST /api/kyc/sumsub/session`에서 접근 코드·동의·요청 origin을 확인해 SDK 세션을 만들고, `GET /api/kyc/sumsub/status`에서 연결된 applicant만 조회한다. `DELETE /api/kyc/sumsub/session`은 ONDO 테스트 세션 종료이며 Sumsub applicant/제출 문서 삭제가 아니다. 세션 쿠키는 서버에서 암호화·인증하고 HttpOnly로 설정한다. 요청에는 같은 origin과 전용 헤더 검사를 적용하며, browser가 applicant ID를 지정할 수 없다.

연결 파일: 서버 `k-tour-id-app/lib/kyc/sumsub-sandbox.ts`, 위 두 API route, UI `k-tour-id-app/features/ondo/identity-b/sumsub-passport-step-b.tsx`. 세션은 30분이며, SDK token 갱신은 같은 유효 세션의 applicant에 묶는다. `reviewStatus=completed`와 `reviewAnswer=GREEN`, 같은 verification level을 서버에서 확인한 결과만 **Sandbox 완료**로 표시한다.

문서는 Sumsub SDK를 통해 공급자에게 제출된다. ONDO가 원문을 저장하지 않는다는 설명이 공급자에게 전송되지 않는다는 뜻은 아니다. 테스트 문서를 우선 사용하고, 실제 신분증·생체정보를 입력해야 할 경우 먼저 데이터 처리·동의를 확인한다. ONDO 응답에는 필요한 최소 상태만 반환하며 원본 문서·생년월일·관리자 검토 코멘트를 전달하지 않는다.

## 4. 검수 및 다음 개발 단계

| 검수 | 통과 기준 |
|---|---|
| 설정 없음·잘못된 키/level·공급자 장애 | 안전한 오류, 샘플 승인으로 자동 전환하지 않음 |
| 동의·SDK 진입·토큰 갱신 | 명시적 시작, 유효 세션/applicant 유지, 토큰을 영구 저장하지 않음 |
| 쿠키 변조·만료·다른 applicant·외부 origin 요청 | 요청 거절, 다른 사람의 상태/토큰 조회 불가 |
| 제출·pending·재제출·거절·완료 | 서버 조회 결과에 맞는 상태. 완료 이벤트만으로 승인 금지 |
| 닫기·재진입·새로고침 | 같은 유효 세션만 복구, 중복 applicant/자동 발급 방지 |
| 기존 앱 권한 | Sandbox 완료 후 Person/Age/Payment KYC·K-Pass·잔액·혜택 불변 |
| 배포·정보 노출 | 격리 Preview, 기존 운영 유지, 정확한 API allowlist, client bundle/log에 secret·PII 없음 |

계약 테스트는 코드 경계 검증이다. **실제 WebSDK 제출·계정 level 설정·공급자 상태 조회·모바일 카메라**를 별도 검수해야 공급자 연결 성공으로 보고할 수 있다. Sandbox의 테스트 응답 설정은 실제 신원 검증 통과가 아니다. [Sandbox 응답 시뮬레이션](https://docs.sumsub.com/reference/simulate-review-response-in-sandbox)

이 작업본의 전용 계약 검사 **19개 통과**(실제 provider 호출 없이 가짜 입력/응답 사용). 재실행: `k-tour-id-app/`에서 `pnpm exec playwright test tests/contracts/ondo-sumsub-boundary.spec.ts --config=playwright.contracts.config.ts --workers=1 --reporter=line`. 이 수치는 실제 문서 제출·모바일 촬영·공급자 승인 결과 검수와 별개다.

기존 standalone 패키징·클라이언트 데이터 경계·QA 진입 경계·로컬 기능 검사와 위 전용 검사를 합쳐 **49개 통과**. 패키징의 정확한 route 목록에는 새 API 두 개만 추가했고, 서버 보안 모듈이 클라이언트 import graph에 들어가지 않는 검사도 유지한다. 이 회귀 검사 역시 실제 WebSDK 화면 렌더링이나 카메라 검수를 대신하지 않는다.

운영화에는 실제 계정 인증/DB applicant 바인딩·서버 세션 철회·서명 검증 webhook·재처리·동의/보관/삭제 정책·접근 통제·실제 verification level과 KYC 정책 검증이 별도로 필요하다. 이 Preview를 운영 KYC나 이미 발급된 OpenDID 자격으로 승격하지 않는다.
