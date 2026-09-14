# ZKP 검증 증거 묶음

이 디렉터리는 2026-08-17(KST)에 수행한 OmniOne CX 공개 환경 점검과 OpenDID 공식 SDK 로컬 재현의 **비식별 요약 증거**만 보관한다.

## 파일

- `cx-live-matrix.json`: 공개 CX 환경의 provider·flow·ZKP mode별 결과
- `cx-source-manifest.sha256`: 제공받은 CX 문서·샘플 원본의 SHA-256
- `opendid-local-run.json`: 고정된 공식 소스 버전의 빌드·암호 연산 재현 결과
- `opendid-source-manifest.txt`: 재현에 사용한 공식 저장소 commit과 공개 근거

## 증거 해석 원칙

- 문서에 기능이 적혀 있다는 사실과 실제 API 요청 성공을 분리한다.
- CX의 세션 생성 성공과 Holder의 proof 제출·Verifier 검증 성공을 분리한다.
- OpenDID의 로컬 SDK 암호 연산 재현과 K-Tour 앱 또는 공개 hosted 환경의 E2E 성공을 분리한다.
- HTTP 200만으로 성공을 판정하지 않고 `oacxCode`, vendor code, 단계와 산출물 존재 여부를 함께 본다.

## 비식별 처리

다음 값은 출력·보관·커밋하지 않았다.

- API key, Authorization header, cookie, JWT
- token, `txId`, `cxId`, QR payload, `m200`, deep link
- DID·VC·VP·proof·credential 원문과 개인키
- 이름, 생년월일, 성별, 주소, 전화번호, 신분증 번호 등 PII

공개 증거에는 provider, provider 상태, flow, 요청한 ZKP mode, HTTP/vendor code, 산출물의 **존재 여부**, 테스트 시간과 고정 source commit만 남겼다.

## 한계

CX 테스트에는 실제 테스트 모바일 신분증 Holder 승인이 포함되지 않았다. OpenDID 테스트는 공식 SDK의 로컬 실행이며, 주최 측 hosted sandbox나 K-Tour 앱의 Holder E2E가 아니다. 따라서 이 묶음은 제품 완성이나 운영 보안 인증을 의미하지 않는다.
