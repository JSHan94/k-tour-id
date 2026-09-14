# K-Tour ID ZKP 기능 검증 보고서

- 검증일: 2026-08-17 KST
- 대상: OmniOne CX, OpenDID v2.0 계열, 현재 K-Tour 목업
- 목적: 문서에 적힌 ZKP 기능과 실제로 실행·검증된 기능을 분리하고, 19세 이상 Night Map 및 외국인 신원 흐름에 안전하게 적용할 수 있는 범위를 확정한다.
- 공개 증거: [`docs/evidence/zkp/2026-08-17`](evidence/zkp/2026-08-17/README.md)

## 1. 최종 판정

### 한눈에 보는 결론

| 질문 | 판정 | 정확한 의미 |
|---|---|---|
| CX에 ZKP 요청 규격이 있는가? | **있음** | 매뉴얼은 `AdultVerify`, `GenderVerify` 두 값을 QR/App 요청의 `extraParams.zkpType`으로 정의한다. |
| 공개 CX에서 요청이 되는가? | **일부 provider에서 세션 생성 성공** | `comdl_v1.5`, `coidentitydocument_v1.5`는 HTTP 200 + `OACX_SUCCESS/200`으로 세션이 생성됐다. |
| 세션 성공으로 ZKP가 검증됐다고 말할 수 있는가? | **아니오** | 존재하지 않는 `NotARealZkp`도 똑같이 성공했다. 요청 단계는 ZKP mode의 의미를 검증하지 않았다. |
| 실제 모바일 신분증 Holder proof까지 확인했는가? | **아니오** | 테스트 신분증과 Holder 승인 없이 result를 호출하면 `OACX_VERIFIER_ERROR/30020`이었다. 실제 proof 성공·반환 claim은 미확인이다. |
| 모바일 외국인등록증 CX가 지금 되는가? | **공개 환경에서는 안 됨** | `coresidence` dev/prod 모두 provider 상태 `n`, 요청은 `OACX_NO_PARAM_PROVIDER/303`이었다. API key 누락 때문이라고 볼 근거는 없다. |
| OpenDID가 실제 CL ZKP를 구현하는가? | **예, 공식 SDK 로컬 풀사이클 재현 성공** | 합성 credential을 발급하고 DOB를 숨긴 부등식 proof를 Holder 코드로 만든 뒤 Server SDK로 검증했다. |
| OpenDID 공개 API를 바로 호출할 수 있는가? | **아니오** | 공개 hosted base URL이나 팀용 sandbox가 없다. TA·DB·Besu·Issuer·Verifier·Wallet 등을 self-host하고 등록해야 한다. |
| K-Tour 앱이 지금 실제 ZKP를 수행하는가? | **아니오** | 현재 화면의 `predicate` boolean은 목업 정책값이다. 암호학적 proof 생성·검증은 연결되지 않았다. |
| Night Map의 19세 조건에 바로 써도 되는가? | **조건부** | 기술 proof는 가능하지만, CX 실제 Holder E2E·성인 기준 semantics·OpenDID request-policy binding·revocation을 먼저 확정해야 한다. |

가장 중요한 한 문장은 다음이다.

> CX의 **세션 생성 성공**은 ZKP 성공이 아니다. OpenDID의 **로컬 암호 연산 성공**도 K-Tour 운영 E2E 성공은 아니다. 다만 OpenDID 공식 SDK로 부등식 기반 CL proof가 실제 생성·검증되는 것까지는 재현했다.

## 2. 증거 수준

결과를 과장하지 않기 위해 다음 수준을 분리했다.

| 코드 | 증거 수준 |
|---|---|
| D | 공식 문서에 명시됨 |
| S | 고정 commit의 공식 소스에 구현됨 |
| R | 제공·공개 원격 endpoint에 실제 요청이 도달하고 vendor 결과를 받음 |
| L | 공식 SDK를 로컬에서 빌드하고 암호 연산 풀사이클을 실행함 |
| H | 실제 모바일 Holder·발급 credential·배포 서버를 연결한 E2E가 완료됨 |
| N | 거짓 조건, 잘못된 nonce, 변조, replay 등 음성 검증까지 통과함 |

현재 최고 수준은 CX가 `D+R`, OpenDID가 `D+S+L+일부 N`이다. 어느 쪽도 K-Tour 기준 `H`는 아니다.

## 3. OmniOne CX 검증

### 3.1 문서 규격

제공받은 `OmniOne CX_VC-Verifier_v1.0_API 매뉴얼`은 별도 ZKP endpoint가 아니라 다음 요청 body를 정의한다.

```json
{
  "provider": "<provider>_v1.5",
  "token": "<redacted>",
  "txId": "<redacted>",
  "contentInfo": {
    "signType": "ENT_MID",
    "requestType": "WEB2APP 또는 APP2APP"
  },
  "extraParams": {
    "zkpType": "AdultVerify 또는 GenderVerify"
  }
}
```

관련 endpoint는 다음과 같다.

```text
POST /oacx/api/v1.0/trans
POST /oacx/api/v1.0/authen/qr/request
POST /oacx/api/v1.0/authen/app/request
POST /oacx/api/v1.0/authen/qr/result
POST /oacx/api/v1.0/authen/app/result
POST /oacx/api/v1.0/trans/token
```

샘플은 token parse에 `GET /oacx/api/v1.0/trans/{token}`도 사용한다. 공개 환경에서는 문서의 POST 방식과 샘플의 GET 방식 모두 응답했지만, token 값은 증거에 남기지 않았다.

### 3.2 공개 환경 실측 결과

공개 host `cx.raonsecure.co.kr:18543`에서 API key, Authorization, `svcCode`, `serviceId` 없이 테스트했다. 각 요청에는 새 token을 사용했고 token·QR·deep link·`txId`·`cxId`·PII는 출력하거나 보존하지 않았다.

#### 활성 provider

| Provider | ZKP mode | Flow | 결과 | 판정 |
|---|---|---|---|---|
| `comdl_v1.5` | 없음 | QR, WEB2APP, APP2APP | `OACX_SUCCESS/200` | 세션 baseline 성공 |
| `comdl_v1.5` | AdultVerify | QR, App | `OACX_SUCCESS/200` | 요청 수락, proof 미검증 |
| `comdl_v1.5` | GenderVerify | QR, App | `OACX_SUCCESS/200` | 요청 수락, proof 미검증 |
| `coidentitydocument_v1.5` | AdultVerify | QR, App | `OACX_SUCCESS/200` | 요청 수락, proof 미검증 |
| `coidentitydocument_v1.5` | GenderVerify | QR, App | `OACX_SUCCESS/200` | 요청 수락, proof 미검증 |
| `comdl_v1.5` | `NotARealZkp` | QR, App | `OACX_SUCCESS/200` | **음성 대조군 실패**: 값 의미 미검증 |

`comdl`에서는 `ENT_MID`와 `ENT_SIMPLE_AUTH` 모두 요청 세션이 생성됐다. 하지만 매뉴얼 표는 `ENT_MID` 고정이라고 하고 요청 예시·샘플은 `ENT_SIMPLE_AUTH`를 사용한다. 공급자 확인 전 구현 기본값은 매뉴얼 표의 `ENT_MID`로 두고, 두 값이 같은 보안 semantics라고 가정하지 않는다.

#### 비활성·설정 불완전 provider

| Provider request 값 | 당시 상태 | Adult App/QR | Gender App/QR | ZKP 없음 | 잘못된 ZKP | 해석 |
|---|---:|---|---|---|---|---|
| `comnh_v1.5` | prod entry `n` | 500/500 | 500/500 | 500/500 | 500 App | 비활성·불완전 설정. ZKP 전에 실패 |
| `comnh_prod_v1.5` | `n` | 303/303 | 303/303 | 303/303 | 303 App | provider lookup/activation 단계 차단 |
| `comrc_v1.5` | dev `n` | 303/303 | 303/303 | 303/303 | 303 App | provider lookup/activation 단계 차단 |
| `comrc_prod_v1.5` | prod `n` | 303/303 | 303/303 | 303/303 | 303 App | provider lookup/activation 단계 차단 |
| `coresidence_v1.5` | dev `n` | 303/303 | 303/303 | 303/303 | 303 App | 외국인등록증 provider 비활성 |
| `coresidence_prod_v1.5` | prod `n` | 303/303 | 303/303 | 303/303 | 303 App | 외국인등록증 provider 비활성 |

500과 303은 ZKP 값 유무와 무관하게 동일했다. 따라서 이는 “해당 ZKP가 틀렸다”가 아니라 ZKP 처리 전에 provider가 활성화되지 않았거나 설정이 불완전한 상태다.

#### Holder 미제출 결과 경계

활성 provider의 성공 세션에서 모바일 신분증 승인을 하지 않고 즉시 result endpoint를 호출하면 다음 결과였다.

```text
HTTP 200
OACX_VERIFIER_ERROR / 30020
AFTER_RESULT
```

이는 Holder가 인증 요청을 완료하지 않았다는 경계이며 ZKP 자체 실패가 아니다. 실제 테스트 모바일 신분증으로 앱 승인 후 `data.zkp`, 최소 공개 claim, 원문 비노출을 확인해야 CX의 `H` 판정을 내릴 수 있다.

### 3.3 문서·샘플·실환경 불일치

1. 매뉴얼 표는 `signType=ENT_MID` 고정, 요청 예시와 샘플은 `ENT_SIMPLE_AUTH`다.
2. 매뉴얼은 QR/App 양쪽에 `zkpType`을 정의하지만 샘플 `event.js`는 QR에만 전달한다.
3. 잘못된 sign type의 실환경 code는 307인데 문서의 열거값은 306이다.
4. `AdultVerify`가 의미하는 정확한 나이·기준일·시간대·법률 기준이 없다.
5. `GenderVerify`의 코드 체계와 verifier가 받는 값이 없다.
6. provider별 ZKP 지원표와 양성 result schema가 없다. 확인된 예시는 `data.zkp=false`뿐이다.
7. 현재 공개 MID UX config의 order list에는 `comdl`만 있고 ZKP 전용 key나 `coresidence` 우회 경로가 보이지 않았다.

정밀 matrix는 [`cx-live-matrix.json`](evidence/zkp/2026-08-17/cx-live-matrix.json), 입력 문서 해시는 [`cx-source-manifest.sha256`](evidence/zkp/2026-08-17/cx-source-manifest.sha256)에 있다.

## 4. OpenDID 공식 SDK 검증

### 4.1 고정 버전과 환경

| 구성요소 | Commit |
|---|---|
| ZKP Server SDK v2.0.0 | `d1ba7410f7bebff7b743f94f6547306301e8dce7` |
| Android Wallet SDK v2.0.1 | `58c5582014908d47f1ce62340ce672727c6a1172` |
| iOS Wallet SDK | `1f2b58da6775c3847020db88d1681cd837bc80d1` |
| Issuer Server | `3b2e950462c5d14348c629b8cec4f6ffb09225da` |
| Verifier Server | `8027086e20714971c24c34546cc2353684fa2b73` |
| TA Server | `b8a41be7350c7962bc25d0656a958502ce132729` |
| Release Guide | `9de71fbb8b8c133d6c961af6ba3aad119e15b91c` |

실행 환경은 Eclipse Temurin OpenJDK 21.0.12, Gradle 8.13, macOS다. clone, build와 테스트 harness는 `/tmp`에서만 실행했고 K-Tour 코드에는 테스트용 암호 데이터나 키를 추가하지 않았다.

### 4.2 빌드 결과

| 대상 | 결과 | 의미 |
|---|---|---|
| ZKP Server SDK | `BUILD SUCCESSFUL` | 공식 SDK 컴파일·패키징 성공 |
| 공식 ZKP SDK tests | `NO-SOURCE` | 저장소에 자동 실행되는 unit test가 없음 |
| Issuer Server | `BUILD SUCCESSFUL`, tests 제외 | 컴파일·boot JAR 생성 확인. 서버 E2E 아님 |
| Verifier Server | `BUILD SUCCESSFUL`, tests 제외 | 컴파일·boot JAR 생성 확인. 서버 E2E 아님 |

### 4.3 오프라인 풀사이클 결과

공식 Android v2.0.1 release JAR의 Holder 구현과 Server SDK를 연결해 다음 전 과정을 실행했다.

```text
Schema / CL Credential Definition / key
  → Credential Offer
  → Holder blinded Credential Request
  → Issuer CL Credential + signature correctness proof
  → Holder credential 검증
  → city 공개 + birth 비공개 predicate proof 생성
  → Server proof 검증
```

| 단계 | 결과 |
|---|---|
| Schema·CL definition 생성 | PASS |
| Credential offer | PASS |
| Holder blinded request | PASS |
| Issuer credential 발급 | PASS |
| Holder signature correctness 검증 | PASS |
| 공개 attribute proof | PASS (`city`) |
| DOB 비공개 predicate proof | PASS (`birth` 미공개) |
| Server verification | PASS |
| 거짓 부등식 proof | Holder가 생성 거부 |
| credential request nonce 변조 | 거부 |
| proof nonce 변조 | 거부 |

암호 알고리즘은 새로 구현하지 않았고 공식 SDK 클래스만 연결했다. credential 값은 실제 사용자가 아닌 합성 fixture다.

### 4.4 Predicate 연산자

| 연산자 | Android 검색 | proof 생성 | Server 검증 | 제품 판정 |
|---|---:|---:|---:|---|
| GE | PASS | PASS | PASS | 사용 가능 후보 |
| GT | PASS | PASS | PASS | 사용 가능 후보 |
| LE | PASS | PASS | PASS | 사용 가능 후보 |
| LT | PASS | PASS | PASS | 사용 가능 후보 |
| EQ | FAIL | 저수준 API PASS | PASS | **크로스플랫폼 약속 금지** |

소스 enum에는 `EQ`가 있지만 Android 고수준 credential 검색은 GE/LE/GT/LT만 선택하고 iOS enum에는 EQ가 없다. 따라서 K-Tour의 안전한 공통 범위는 네 부등식뿐이다.

### 4.5 중요: proof request 정책 결합 확인 필요

Server SDK v2.0.0의 `verifyProof()` 직접 호출에서, 정상 proof는 그대로 둔 채 verifier 요청만 바꾼 세 가지 검사를 수행했다.

| 변경 | 예상 | 실제 |
|---|---|---|
| 요청 predicate를 다른 연산·임계값으로 변경 | 거부 | `true` |
| 요청 `credDefId` restriction을 존재하지 않는 값으로 변경 | 거부 | `true` |
| proof에 없는 필수 attribute referent 추가 | 거부 | `true` |

정확한 해석은 다음과 같다.

> OpenDID ZKP Server SDK v2.0.0 직접 호출에서는 proof의 암호학적 자기 일관성과 nonce 결합을 확인했다. 그러나 verifier가 보낸 proof request의 predicate, restriction, 필수 referent와 제출 proof 사이의 **정책 결합**은 SDK 계층에서 강제되지 않는 동작을 재현했다. 배포된 Verifier HTTP 서비스가 별도의 상위 계층 검사를 수행하는지는 전체 인프라 E2E 전까지 미확인이다.

이는 “ZKP 수학이 깨졌다”거나 “운영 Verifier 전체가 취약하다”는 결론이 아니다. 하지만 Night Map의 성인 접근 제어처럼 보안 결정에 쓰기 전에는 다음 둘 중 하나가 필수다.

1. 라온시큐어/OpenDID 담당자가 상위 Verifier의 request-policy binding을 확인하고 acceptance evidence를 제공한다.
2. K-Tour Verifier가 nonce뿐 아니라 요청한 referent, predicate name/operator/value, schema/credential definition restriction과 제출 proof 식별자를 별도로 대조한다.

이 관찰은 공개 발표용 성과가 아니라 공급사 기술 확인이 필요한 P0 항목으로 취급한다. sanitized 결과는 [`opendid-local-run.json`](evidence/zkp/2026-08-17/opendid-local-run.json)에만 남겼다.

### 4.6 HTTP E2E가 막힌 이유

공식 Verifier에는 다음 소스 endpoint가 있다.

```text
POST /verifier/api/v1/request-proof-request-profile
POST /verifier/api/v1/request-verify-proof
```

그러나 문서의 URL은 `${Host}:${Port}` 또는 localhost 형식이고 공개 sandbox host·팀 credential은 없다. API 문서상 일반 Authorization은 `-`다. 즉 “API key가 없어서 못 찌르는 상황”이 아니라 다음 환경이 배포되지 않아 호출할 대상이 없는 상황이다.

- PostgreSQL
- Hyperledger Besu와 계약
- TA 및 entity registration
- Issuer/Verifier membership certificate
- Wallet·모바일 앱
- issuance profile·VC plan
- ZKP schema·credential definition·proof request/profile/policy
- offer ID·tx ID·nonce를 포함한 거래 상태

OpenDID HTTP E2E는 위 trust domain을 제공받거나 직접 배포한 다음 수행해야 한다.

## 5. K-Tour의 19세 이상 Night Map에 어떻게 쓰는가

### 경로 A — 지원되는 국내 모바일 신분증

```text
Night Map 진입
  → CX AdultVerify 요청
  → 모바일 신분증 Holder 승인
  → CX result와 최소 결과 검증
  → 짧은 TTL의 ageEligible 세션 발급
  → Night Map 해제
```

가장 짧은 해커톤 경로지만 아직 `AdultVerify`의 법적 나이 기준, 반환값, 원문 비노출, replay/거부/만료가 확인되지 않았다. 이를 확인하기 전에는 “19세 이상 ZKP 완료”가 아니라 “CX AdultVerify 연동 후보”라고 써야 한다.

### 경로 B — 모바일 외국인등록증

문서에는 `coresidence` provider가 있지만 현재 공개 환경 dev/prod는 모두 비활성이다. 라온시큐어가 provider 활성화, 테스트 외국인등록증, allowlist/service provisioning과 ZKP 지원 범위를 제공해야 E2E가 가능하다.

### 경로 C — 여권을 쓰는 방한 외국인

```text
Passport eKYC
  여권 진위/NFC/얼굴/liveness 검증
        ↓ 검증된 DOB
신뢰된 K-Tour Issuer
  Numeric DOB를 포함한 CL credential 발급
        ↓
OpenDID Holder
  birth <= 정책 cutoff proof 생성
        ↓
K-Tour Verifier
  proof + request-policy binding + 상태 검증
        ↓
Night Map ageEligible 세션
```

ZKP 자체는 여권 진위, NFC 칩, 얼굴, liveness, 비자·체류자격을 확인하지 않는다. 신뢰할 수 있는 eKYC/issuer가 검증한 사실을 원문 없이 증명할 뿐이다.

`YYYYMMDD`는 32-bit 정수 범위라 NUMBER predicate로 표현 가능하다. 다만 “오늘 기준 만 19세”, 청소년보호법의 연도 기준, 주류 제공 기준 등 어떤 정책을 적용할지는 법무·서비스 정책에서 먼저 확정해야 한다. 기술 테스트 cutoff를 실제 법률 기준이라고 주장하면 안 된다.

### 현재 목업에서 바로 고쳐야 할 기술 표현

현재 코드의 boolean `privacy: "predicate"`는 암호학적 ZKP predicate가 아니다. 다음처럼 분리하는 것이 정확하다.

```text
현재 목업: policyFact / eligibilityDecision
실제 OpenDID: { name, pType: GE|GT|LE|LT, pValue }
```

또한 다음 표현은 수정 대상이다.

- “OmniOne이 ZKP를 제공하는지 미확정”
  - → “OpenDID 공식 v2.0은 CL ZKP를 지원하고 로컬 재현도 성공했지만 K-Tour에는 아직 통합되지 않았다.”
- “VP = selective disclosure = ZKP”
  - → 서로 다른 제출·증명 방식을 분리한다.
- “CX AdultVerify = OpenDID custom predicate”
  - → CX의 사전 정의 mode와 OpenDID CL predicate는 별도 경로다.
- “revocation이 있으므로 ZKP credential도 비철회 증명됨”
  - → 이번 ZKP 경로의 non-revocation proof는 확인하지 못했다.

## 6. 회의록과의 잠정 정합성

이 절은 사용자가 전달한 멘토링 회의록을 **이해한 결과**이며, 후속으로 전달될 최종 결정 전에는 제품 요구사항으로 확정하지 않는다.

1. MVP가 정보·큐레이션 우선이라면 DID/ZKP는 첫 가입의 필수 허들이 아니라 Night Map 같은 명확한 순간에만 요청하는 `just-in-time verification`이 적합하다.
2. 방한 외국인 우선 MVP는 현재 비활성인 `coresidence`에 의존해 시작하면 안 된다. 일반 지도·온도 큐레이션은 누구나 쓰고, 연령 제한 feature만 CX 또는 여권 eKYC 파생 credential 경로로 단계화해야 한다.
3. 해커톤에서는 내·외국인 통합 비전을 보이되, 실제 구현 증거는 지원되는 국내 모바일 신분증 경로와 OpenDID 합성 credential PoC를 분리해 제시하는 편이 정직하다.
4. 결제·KYC는 후속 단계이므로 ZKP가 결제 KYC 전체를 해결한다고 설명하지 않는다. 국가별 Local KYC와 여권 진위는 별도 신뢰 공급자 문제다.
5. 성별 기반 기능은 친구 만들기라는 현재 제품 의도와 맞지 않는다. `GenderVerify`는 기술 시험 결과로만 남기고 MVP feature에는 연결하지 않는 편이 맞다.

## 7. 개발 전 P0 확인 질문

### OmniOne CX / 라온시큐어

1. `AdultVerify`와 `GenderVerify`를 provider·버전·환경별로 지원하는 정확한 표가 있는가?
2. `AdultVerify`의 나이 기준, 기준일, 시간대, 반환 type과 공개되는 claim은 무엇인가?
3. `GenderVerify`의 값·코드와 verifier가 받는 최소 결과는 무엇인가?
4. 왜 잘못된 `zkpType`도 request 단계에서 성공하며, 실제 적용된 mode를 확인할 canonical receipt/field는 무엇인가?
5. 실제 성공 시 `data.zkp`, result, token parse의 정확한 schema는 무엇인가?
6. `coresidence` dev/prod 활성화, test residence credential, service provisioning과 allowlist를 제공할 수 있는가?
7. `ENT_MID`와 `ENT_SIMPLE_AUTH` 중 권장값은 무엇이며 두 값의 보안 semantics가 같은가?
8. 문서에 없는 `OACX_VERIFIER_ERROR/30020`의 정의와 재시도 정책은 무엇인가?

### OpenDID

1. 팀이 직접 전체 trust domain을 배포해야 하는가, 해커톤 hosted 환경이 따로 있는가?
2. custom namespace/schema/CL definition 등록에 TA·governance 승인 절차가 있는가?
3. 공식 Android/iOS Holder가 같은 predicate 범위를 지원하는가? `EQ` 불일치는 수정 예정인가?
4. Verifier HTTP service는 SDK 외부에서 requested attribute/predicate/restriction 완전성을 검사하는가?
5. `request-verify-proof`가 SDK boolean 반환과 request-policy binding 실패를 어떻게 처리하는가?
6. ZKP credential의 revocation/non-revocation proof를 현재 release에서 지원하는가?
7. 심사 acceptance evidence로 로컬 SDK PoC가 충분한가, 실제 Holder와 배포 Verifier E2E가 필요한가?

## 8. 발표·문서에 사용할 수 있는 표현

### 지금 사용 가능

> OmniOne CX 매뉴얼의 AdultVerify·GenderVerify 요청 mode를 공개 환경에서 점검했고 활성 provider의 세션 생성까지 확인했다. 실제 Holder ZKP 완료는 테스트 credential이 필요하다.

> OpenDID 공식 v2.0 계열 SDK를 고정 commit에서 빌드하고, 합성 credential 발급부터 DOB 비공개 부등식 proof 생성·서버 검증까지 로컬로 재현했다.

> K-Tour는 온도 기반 지도 이용 자체를 신원 확인으로 막지 않고, 19세 이상 Night Map 같은 제한 feature에만 최소 속성 증명을 요청하는 방향이다.

### 아직 사용 금지

- “모바일 외국인등록증 ZKP가 현재 완성됐다.”
- “CX AdultVerify로 실제 19세 판정을 E2E 검증했다.”
- “여권 진위와 본인 확인을 ZKP가 해결한다.”
- “OpenDID public API 연동이 완료됐다.”
- “모든 모바일 SDK에서 GE/GT/LE/LT/EQ가 동일하게 지원된다.”
- “ZKP proof가 verifier의 요청 정책·restriction·revocation까지 자동으로 보장한다.”
- “현재 K-Tour 목업이 실제 ZKP를 수행한다.”

## 9. 완료·미완료 경계

### 완료

- CX 매뉴얼의 두 ZKP mode, QR/App 요청, provider 부록, signType과 sample 불일치 검토
- 활성 provider 세션 생성, 비활성 provider, 잘못된 ZKP/signType, Holder 미제출 result 실측
- OpenDID 공식 SDK·Issuer·Verifier 빌드
- 합성 credential 기반 CL 발급·Holder proof 생성·Server verify 풀사이클
- GE/GT/LE/LT 및 EQ의 실제 플랫폼 차이 확인
- 잘못된 nonce·거짓 predicate 음성 검증
- 비식별 evidence와 고정 commit 기록

### 미완료이며 외부 지원 필요

- CX 실제 테스트 모바일 신분증으로 positive ZKP result
- 외국인등록증 provider 활성화와 E2E
- OpenDID 전체 trust domain HTTP 배포·Holder 앱 E2E
- request-policy binding에 대한 공급사 확인 또는 K-Tour 보완 검증
- ZKP credential revocation/non-revocation 검증
- 여권 eKYC 공급자와 파생 credential issuer 정책
- 실제 법률에 맞는 19세 cutoff 정책

## 10. 근거

### 로컬 제공 자료

- `OmniOne CX_VC-Verifier_v1.0_API 매뉴얼_해커톤_20250709.docx`
- `모바일신분증API 샘플.zip`
- `hackerton.zip`
- SHA-256: [`cx-source-manifest.sha256`](evidence/zkp/2026-08-17/cx-source-manifest.sha256)

### 공식 OpenDID 자료

- [ZKP Server SDK v2.0.0](https://github.com/OmniOneID/did-zkp-sdk-server/tree/d1ba7410f7bebff7b743f94f6547306301e8dce7)
- [ZKP Server SDK API](https://github.com/OmniOneID/did-zkp-sdk-server/blob/d1ba7410f7bebff7b743f94f6547306301e8dce7/docs/ZKP_SDK_SERVER_API.md)
- [Server ProofVerifier](https://github.com/OmniOneID/did-zkp-sdk-server/blob/d1ba7410f7bebff7b743f94f6547306301e8dce7/source/did-zkp-sdk-server/src/main/java/org/omnione/did/zkp/crypto/signature/ProofVerifier.java)
- [Android 공식 ZKP fixture/test](https://github.com/OmniOneID/did-client-sdk-aos/blob/58c5582014908d47f1ce62340ce672727c6a1172/source/did-wallet-sdk-aos/src/androidTest/java/org/omnione/did/sdk/core/api/ZKPManagerTest.java)
- [Android predicate 검색 구현](https://github.com/OmniOneID/did-client-sdk-aos/blob/58c5582014908d47f1ce62340ce672727c6a1172/source/did-wallet-sdk-aos/src/main/java/org/omnione/did/sdk/datamodel/zkp/AvailableReferent.java)
- [iOS PredicateType](https://github.com/OmniOneID/did-client-sdk-ios/blob/1f2b58da6775c3847020db88d1681cd837bc80d1/DIDWalletSDK/DataModel/Client/ZKP/Verify/ProofRequest.swift)
- [Verifier HTTP API](https://github.com/OmniOneID/did-verifier-server/blob/8027086e20714971c24c34546cc2353684fa2b73/docs/api/Verifier_API.md)
- [OpenDID v2.0 설치·Demo 구성](https://github.com/OmniOneID/did-release/blob/9de71fbb8b8c133d6c961af6ba3aad119e15b91c/release-V2.0.0.0/OpenDID_Installation_Guide-V2.0.0.0.md)
- 고정 버전 목록: [`opendid-source-manifest.txt`](evidence/zkp/2026-08-17/opendid-source-manifest.txt)

---

이 보고서는 기능 검증 기록이지 보안 인증서가 아니다. 특히 OpenDID request-policy binding 관찰은 공급사 확인 전 공개 발표에서 취약점으로 단정하지 않는다.
