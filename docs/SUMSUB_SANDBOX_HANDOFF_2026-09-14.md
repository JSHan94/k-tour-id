# Sumsub Sandbox 연동 인계

브랜치: `feat/sumsub-sandbox-onboarding-20260914` · 배포 소스: `f5c5af3`.

**[Sumsub Sandbox Preview 열기](https://ondo-h8khioo8p-jaewook-9643s-projects.vercel.app)** — 기존 Production 배포는 변경하지 않았다. 앱의 **ID · Wallet → 여행 준비 상태(Trip readiness) 펼치기 → K-Tour ID 열기(Open K-Tour ID) → Passport → 테스트 안내 동의**로 진입한다. 최초 시작에 필요한 테스트 접근 코드는 별도 전달하며 이 문서·URL·Git에는 넣지 않는다.

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

이번 빠른 Preview는 **서버에서 암호화·인증한 HttpOnly 세션 쿠키 + 공급자 상태 재조회** 방식이며, 영속 DB나 webhook 수신 파이프라인을 구현한 것은 아니다. 새로고침·재진입은 같은 브라우저의 유효 쿠키가 있을 때만 기존 applicant에 연결된다. 쿠키 유실·만료 후 새 시작은 다른 applicant를 만들 수 있으며, 영속적인 중복 방지나 계정 기반 복구를 보장하지 않는다.

미완료 상태에서 명시적으로 닫으면 `DELETE`로 ONDO 브라우저 세션 쿠키를 지운다. 완료·최종 거절 화면에서 닫을 때는 쿠키를 유지한다. 어느 쪽도 **공급자 applicant 삭제·심사 취소가 아니며**, 제출된 심사는 공급자에 남을 수 있다. 쿠키를 지운 뒤 기존 심사를 앱에서 복구한다고 약속하지 않는다. 결과 화면에는 Sandbox임을 유지하고 기존 목업 자격을 자동 변경하지 않는다.

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

현재 배포는 **Vercel Preview 전용**이다. `scripts/kyc/deploy-sumsub-preview.mjs`가 승인된 프로젝트·브랜치를 확인하고 `--target preview`로 실행하며, secret은 **이번 deployment에만** 전달한다. 프로젝트 전체·브랜치 공통·Production 환경 변수는 변경하지 않는다. 공개 기능 flag는 build에도 전달한다. Vercel에서는 해당 deployment의 `VERCEL_URL`을 정확한 허용 origin으로 사용한다.

재배포는 담당자가 필요한 서버 설정을 로컬에 준비한 뒤 `k-tour-id-app/`에서 `node --env-file=.env.local scripts/kyc/deploy-sumsub-preview.mjs`로 수행한다. `.env.local`은 Git에 올리지 않는다. 명령 반환 뒤 deployment가 Ready인지 확인하고 새 URL을 검수한다.

이번 연결은 `POST /api/kyc/sumsub/session`에서 접근 코드·동의·요청 origin을 확인해 SDK 세션을 만들고, `GET /api/kyc/sumsub/status`에서 연결된 applicant만 조회한다. `DELETE /api/kyc/sumsub/session`은 ONDO 테스트 세션 종료이며 Sumsub applicant/제출 문서 삭제가 아니다. 세션 쿠키는 서버에서 암호화·인증하고 HttpOnly로 설정한다. 요청에는 같은 origin과 전용 헤더 검사를 적용하며, browser가 applicant ID를 지정할 수 없다.

연결 파일: 서버 `k-tour-id-app/lib/kyc/sumsub-sandbox.ts`, 위 두 API route, UI `k-tour-id-app/features/ondo/identity-b/sumsub-passport-step-b.tsx`. 세션은 30분이며, SDK token 갱신은 같은 유효 세션의 applicant에 묶는다. `reviewStatus=completed`와 `reviewAnswer=GREEN`, 같은 verification level을 서버에서 확인한 결과만 **Sandbox 완료**로 표시한다.

문서는 Sumsub SDK를 통해 공급자에게 제출된다. ONDO가 원문을 저장하지 않는다는 설명이 공급자에게 전송되지 않는다는 뜻은 아니다. 테스트 문서를 우선 사용하고, 실제 신분증·생체정보를 입력해야 할 경우 먼저 데이터 처리·동의를 확인한다. ONDO 응답에는 필요한 최소 상태만 반환하며 원본 문서·생년월일·관리자 검토 코멘트를 전달하지 않는다.

공급자 SDK 동의 화면의 조직명은 현재 Sumsub 계정 설정인 `ohayo.global`로 표시된다. 이번 연결에서는 바꾸지 않았으며, 외부 공개·운영 전 서비스 운영 주체와 동의 문구를 일치시켜야 한다.

## 4. 검수 및 다음 개발 단계

| 검수 | 통과 기준 |
|---|---|
| 설정 없음·잘못된 키/level·공급자 장애 | 안전한 오류, 샘플 승인으로 자동 전환하지 않음 |
| 동의·SDK 진입·토큰 갱신 | 명시적 시작, 유효 세션/applicant 유지, 토큰을 영구 저장하지 않음 |
| 쿠키 변조·만료·다른 applicant·외부 origin 요청 | 요청 거절, 다른 사람의 상태/토큰 조회 불가 |
| 제출·pending·재제출·거절·완료 | 서버 조회 결과에 맞는 상태. 완료 이벤트만으로 승인 금지 |
| 닫기·재진입·새로고침 | 유효 쿠키에서만 같은 applicant 재사용. 미완료 명시적 닫기는 쿠키 삭제, 완료·최종 거절 닫기는 유지 |
| 기존 앱 권한 | Sandbox 완료 후 Person/Age/Payment KYC·K-Pass·잔액·혜택 불변 |
| 배포·정보 노출 | 격리 Preview, 기존 운영 유지, 정확한 API allowlist, client bundle/log에 secret·PII 없음 |

확인된 결과:

- **계약 검사 49개 통과**: Sumsub 전용 19개와 기존 standalone 패키징·클라이언트 데이터·QA 진입·로컬 기능 경계 검사. 실제 provider 호출 없이 가짜 입력/응답으로 검증했다.
- **Preview UI 회귀 검사 8개 통과**: API를 mock한 원격 검사이며 실제 provider 요청은 0회. 브라우저 오류·재시도 없이 통과했다. 위 계약 검사 49개와 별도다.
- **실제 Sandbox WebSDK 표시·닫기 확인**: 390×844 브라우저에서 `api.sumsub.com` iframe 표시, 가로 넘침·브라우저 오류 없음, 패스 미발급·닫기 후 복귀를 확인했다. 실제 모바일 기기·물리 카메라 검증은 아니다.
- **실제 Sandbox API 확인**: 공급자에 설정한 `GREEN`, `RED + RETRY`, `RED + FINAL`을 각각 완료·재제출·최종 거절로 읽었다. 접근 코드 미충족 `401`, 잘못된 origin `403`, token 갱신 시 같은 applicant 유지, HttpOnly·no-store, `DELETE` 후 세션 접근 차단도 확인했다. [Sandbox 응답 시뮬레이션](https://docs.sumsub.com/reference/simulate-review-response-in-sandbox)
- **미검증**: 실제 신분증 제출·liveness 통과·물리 카메라, 운영 KYC.

전용 계약 검사 재실행: `k-tour-id-app/`에서 `pnpm exec playwright test tests/contracts/ondo-sumsub-boundary.spec.ts --config=playwright.contracts.config.ts --workers=1 --reporter=line`.

패키징은 정확한 route 목록에 새 API 두 개만 허용한다. 서버 보안 모듈의 클라이언트 import 금지 검사도 유지한다. **SDK가 표시되거나 Sandbox 응답이 정상이어도 실제 신원 검증을 통과한 것은 아니다.**

운영화에는 실제 계정 인증/DB applicant 바인딩·서버 세션 철회·서명 검증 webhook·재처리·동의/보관/삭제 정책·접근 통제·실제 verification level과 KYC 정책 검증이 별도로 필요하다. 이 Preview를 운영 KYC나 이미 발급된 OpenDID 자격으로 승격하지 않는다.
