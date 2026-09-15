# K-Tour ID · 비금전 체험 목업 인계

2026-09-15 · **사용자 승인된 UX-08 목업과 실제 연동 사이의 연결 계약**. 작업 브랜치 `feat/ktour-experience-share-20260915`, 시작점 `5f16c38`. 소스별 구현·검수·배포 상태는 아래 릴리스 기록을 따른다. 이전 운영 앱 `505e475`의 검수는 [기존 UX 릴리스](./ux-refinement/2026-09-15/RELEASE.md)에 별도로 남긴다.

새 체험과 한국 여행 OG의 소스별 검수·배포 상태 정본은 [새 릴리스 기록](./KTOUR_EXPERIENCE_RELEASE_2026-09-15.md)이다. 이 문서는 수치를 중복 유지하지 않으며 이전 운영 결과나 중간 artifact의 PASS를 이후 소스와 합산하지 않는다.

## 1. 사용자에게 보일 흐름

**Roba 전체 상세 → 동네 가이드 체험 → Person 확인·목적별 제시 동의 → 준비된 가이드 제안 → 대상·1회·기한 승인 → 실행/사용/기록 결과 → 실제 가이드 내용 → 같은 장소.**

- 진입은 canonical Roba(`mois-0021cd596bc5b2a922ad`)의 **전체 상세 1개 행**에 한정한다. peek의 기존 두 CTA는 늘리거나 바꾸지 않는다. 별도 Demo 탭이나 선제 ID 가입을 요구하지 않는다. 기술 이름은 주 CTA 대신 펼칠 수 있는 진행/기록 설명에 둔다.
- 결과는 비상업적 **디지털 동네 가이드 내용**이다. 빈 성공 배지나 매장 제공 쿠폰으로 대체하지 않는다. Roba는 시연 배경이며 해당 매장의 제휴·실물 제공을 주장하지 않는다.
- 필요한 자격은 현재 유효한 **Person + 이 체험 목적의 person VP**뿐이다. status/risk/expiry를 확인하고 공개 항목은 `personVerified`로 제한한다. 국적·체류·성인/연령·Payment KYC를 조건으로 쓰거나 숨겨서 소비하지 않는다. Person/패스가 없으면 기존 account/person·K-Tour ID 샘플 설정을 명시적으로 거치며, 기존 샘플 패스 생성은 그 별도 동의 흐름의 결과다.
- 같은 진행 중 체험에서 방금 확인한 Mobile ID 샘플 결과는 다시 수단을 고르거나 provider 확인을 반복하지 않는다. **패스 생성·보관 동의 → holder 준비/수령 확인 → 이 목적의 VP 동의**는 생략하지 않는다. 다른 행동의 과거 결과나 직렬화 이력은 이 단축 경로의 권한이 아니다.
- 안내와 결과에는 목업임을 짧게 표시한다. 실제 제공 의무·금전 가치가 없으며, 할인·예약·결제·방문 인증의 완료가 아니다.
- 금액·자격·권한의 서로 다른 의미를 합치지 않는다. Sui 실행, 서비스 사용 결과, OmniOne 기록은 각 상태로 표시한다. 첫 동의가 이후 범위 확인·승인을 대신하지 않는다.
- 취소·닫기·같은 장소 복귀가 가능해야 한다. 기존 금전 혜택 CTA·Payment KYC·결제 동의·예약과 온도/방문 기록은 그대로 보존한다.

## 2. 목업과 Harvey의 실제 구현 경계

**이 목업은 실제 CX/OpenDID/Sui/AI/OmniOne Chain 호출을 하지 않는다.** 실제 로그인·VC/VP·zkLogin 서명·PTB·agent·chain receipt를 발급하거나 검증하지 않는다. UI의 샘플 상태, 예시 참조와 동의 값은 서버 권한이 아니다. 체험 실행/사용 결과 자체로 Person/Age/Payment KYC·credential을 발급/승격하지 않고, KRW 잔액·방문 횟수/배지를 늘리지 않는다. 사용자가 별도 동의한 기존 샘플 신원 설정과 이를 혼동하지 않는다.

### 현재 저장된 코드 계약

경로 기준은 `k-tour-id-app/features/ondo/`다. model/store/sheet와 앱 진입·복귀 연결을 소스에서 확인했다. 정적 구조 확인이지 실제 브라우저 도달 PASS가 아니다.

| 연결점 | 목업 계약 |
|---|---|
| [experience-model-b.ts](../k-tour-id-app/features/ondo/experience-b/experience-model-b.ts) | `EXPERIENCE_PLACE_ID_B` 1곳, `EXPERIENCE_CAMPAIGN_ID_B=ktour-neighborhood-guide-v1`, `requestExperienceB` → `ktour:experience:open`. Person 정책은 `person-only-nonfinancial.v1` |
| [experience-b.tsx](../k-tour-id-app/features/ondo/experience-b/experience-b.tsx), [copy](../k-tour-id-app/features/ondo/experience-b/experience-copy-b.ts) | `ExperienceEntryB` / `ExperienceMountB`: sample opt-in의 Roba 상세 행과 full-task sheet. 신원 gate 동안 sheet를 suspend하고 목적별 완료를 소비한 뒤 이어감 |
| [place-service-actions-b.tsx](../k-tour-id-app/features/ondo/place/place-service-actions-b.tsx), [ondo-product-b.tsx](../k-tour-id-app/features/ondo/app/ondo-product-b.tsx) | 기존 전체 상세 서비스 아래 별도 행, 공통 overlay mount. `PLACE_SERVICE_RETURN_EVENT_B`의 `focus:"experience"`로 기존 map snapshot·원 장소 복귀를 재사용. peek의 새 행이나 새 공용 page 없음 |
| [action-gate-contract-b.ts](../k-tour-id-app/features/ondo/identity-b/action-gate-contract-b.ts), [coordinator](../k-tour-id-app/features/ondo/identity-b/action-gate-coordinator-b.tsx) | `REDEEM_DEMO_ENTITLEMENT` / `createBExperienceActionReturn`: account/person + 별도 contextual presentation, `bActionPresentationPurpose="person"`. Roba·campaign·intent에 묶고 binding 없는 체험 VP는 거절. checkout의 visitor_benefit/Payment 정책은 유지 |
| [ktour-id-setup-b.tsx](../k-tour-id-app/features/ondo/identity-b/ktour-id-setup-b.tsx) | `createBExperiencePersonHandoff` / `isBExperiencePersonHandoffCurrent`의 WeakSet·same-action token/intent/snapshot/현재 Person receipt → `verified_person_consent` → 기존 holder 준비/ack → contextual VP. 진입 시점·명시 동의·holder 준비·최종 ack에서 현재성 재확인. `experience-pass-consent`는 설명 화면, `experience-pass-approve`는 별도 생성/보관 동의 버튼 |
| [ktour-id-setup-model-b.ts](../k-tour-id-app/features/ondo/identity-b/ktour-id-setup-model-b.ts), [provider](../k-tour-id-app/features/ondo/shared/state/ondo-b-provider.tsx) | 재사용 경로는 `issuanceScope:"person"` / `createPersonOnlySimulatedCredentialB`: `serviceAccess=["person"]`, `ageOver19=null`, `stayPeriod=null`, `trustLevel="limited"`, payment limit/spent0, visitor benefit entitled=false. 실제 상태 변경 직전에도 같은 live handoff를 확인. 추가 자격은 별도 동의/확인 경로이며, 일반 샘플 발급을 이 좁은 결과로 대체하거나 Person에서 자동 승격하지 않음 |
| `ExperienceScopeB` | `open-neighborhood-guide`, 예시 수신 지갑/도우미, intent/place/campaign, 최대1회·금액0·최대5분, 정책·proposal digest. `consentDigest`/`approvedAt`는 제안 때 null이고 명시 승인 뒤 생성. 기존 return-to-integrity의 결정적 비암호학적 hash를 사용하는 mock 결합 검사이며 서명/암호학적 provenance/Move 증거 아님 |
| `createExperienceMockPermitB` / `hasExperiencePermitB` | 목적별 gate 소비 이후 현재 유효 Person과 묶이는 process-only WeakMap permit. permit은 직렬화하지 않으며 새로고침 후 이력을 읽어도 실행/사용 권한은 복원되지 않음 |
| `reduceExperienceB` | `authorization`: none/granted/unknown/consumed/revoked/expired/failed, `fulfillment`: not_started/pending/fulfilled/blocked, `audit`: not_started/pending/confirmed/failed. 실행·사용은 각각 최대1회, 별도 결과 참조 |
| [experience-store-b.ts](../k-tour-id-app/features/ondo/experience-b/experience-store-b.ts) | `openExperienceB` / `readExperienceB` / `commitExperienceB`: IndexedDB `ktour-experience-mock-v1`, 고정 local-demo-traveler+campaign 1개 key, 단일 readwrite transaction+revision. 동일 origin/브라우저 저장소 안의 샘플 이력이며 실제 subject·다른 기기/브라우저의 중복 방지가 아님 |

Person 전용 샘플 패스는 `:person-only` 식별자와 `identity-person-only-scope` 안내로 범위를 구분한다. 이후 성인/할인/결제 gate에서 필요한 추가 자격이 없으면 `kpass-additional-checks-open` → 기존 수단 선택·동의/provider 확인·holder 흐름을 별도로 열고, `identity-additional-checks-consent`에서 추가 범위를 알린다. 갱신만으로 Person 전용 claim을 넓히지 않는다. 취소·만료 또는 최종 상태 변경 직전의 live receipt 검증 거절은 패스 발급 완료가 아니다. 저장 거절이면 완료/닫힘 표식을 되돌리고 만료 안내로 복구한다. 이 경로의 소스 존재와 실제 여정 검수 결과는 구분한다.

닫기는 작업 삭제나 취소가 아니다. granted 작업을 닫거나 다시 열면 unknown으로 전환해 자동 재실행하지 않는다. `reconcile_execution`은 같은 승인 건의 기존 결과만 읽으므로 만료 후에도 가능하지만 새 실행 권한이나 서비스 사용 승인은 아니다. 최종 사용에는 현재 Person과 runtime permit을 재확인하며, 알려진 철회/만료/범위 만료는 blocked다. reload로 permit만 사라졌다면 새 목적별 확인이 필요하다.

`ktour.experience-open.v1` session marker는 열렸던 sheet만 복원하며 권한이나 정확한 지도 camera/scroll 복원의 증거가 아니다. 저장 차단·손상 이력은 unavailable로 처리하며 localStorage/메모리 성공 fallback으로 우회하지 않는다. 브라우저 저장소 삭제 후 재체험을 서버 1회 제한 우회 방지로 주장하지 않는다.

아래 API는 [1주 명세](./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md#6-최소-bff데이터-계약)와 [Sui 추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md#5-추가-api데이터-계약)의 **앱/BFF 구현 제안**이다. 현재 endpoint나 vendor 공식 API가 아니다. 목업의 Roba/로컬 actor를 실제 허용 장소·캠페인·검증된 subject로 바꾸는 일은 명시적인 서버 정책 연결이다.

| UI 연결 단계 | 실제 adapter/BFF의 책임 |
|---|---|
| 장소의 독립 체험 capability | `GET /places/{venueId}/demo-entitlements`: 서버가 허용한 장소·캠페인 1개. 기존 27개 샘플 commerce 등록과 별개이며 실제 제휴를 추정하지 않음 |
| 신원·패스·목적별 제시 | identity sessions → credentials/holder-ack → presentations requests/submit. 실제 CX 결과, 동일 subject/holder, OpenDID proof·status·nonce·audience·동의 검증 |
| 체험 제안·범위 승인 | proposals → delegations. 실제 허용 AI 호출, 대상·수신자·지갑·기한·1회·정책/제안 digest에 묶인 사용자 승인과 durable intent |
| 한정 실행 | delegation submit + operation 조회. 실제 zkLogin **및** PTB, Move/agent effects·network/package/grant·provenance 검증. digest 수신만으로 성공 처리 금지 |
| 사용 확정·기록 | redeem + operation/evidence 조회. 현재 자격 재검증 후 DB 1회 사용/outbox; OmniOne 기록은 독립 조회. Sui consume는 DB rollback 대상이 아님 |
| 중단·같은 장소 복귀 | actor 범위 operation 재조회, 단계별 cancel/revoke, TTL 복귀 context. 메모리 UI snapshot과 달리 외부 앱/cold return을 복구해야 함 |

실제 구현은 서버 session·소유권·idempotency·동일 subject/campaign 중복 방지·철회·만료·재시작 복구와 암호학적 commitment·issuer/서명된 scope 검증을 별도로 갖춰야 한다. 목업 IndexedDB의 탭 간 직렬화는 서버 DB unique 제약이나 동일인 판정의 대체물이 아니다. `KPassDemoCredential`의 SIMULATED 경계를 provider allow로 바꾸지 않는다.

## 3. 실패·재확인 의미

| 상황 | 목업이 설명/보존할 의미와 실제 연동 시 요구 |
|---|---|
| 승인 전 취소·거절 | 사용 결과 없음. 같은 장소로 복귀; 다른 대상의 동의를 재사용하지 않음 |
| 만료·실패 | 해당 단계가 완료되지 않음. 안전하게 허용된 재시도만 제공하고 새 승인/요청이 필요하면 명시 |
| 전송 후 unknown | 성공·실패·취소를 추정하지 않음. 동일 작업 조회; 새 실행을 자동 생성하지 않음 |
| 실행 소비 후 자격 불충족 | `authorization_consumed / fulfillment_blocked`. 서비스 사용 0, 이미 소비한 체인 권한을 되돌렸다고 표시하지 않음 |
| 사용 완료·감사 기록 대기/실패 | 사용은 유지하고 같은 기록 작업만 재조회/재처리. 체험 재사용·Sui 재실행 금지 |
| 닫기·새로고침 | 닫기는 업무 취소가 아님. 목업의 실제 보존 한계를 명시하고 서버 완료·영속 복원을 주장하지 않음 |

현재 UI 소스에는 설명을 펼쳐 선택하는 준비된 응답 7종(정상, 실행 unknown, 실행 실패, 최종 자격 거절, 기록 대기, 기록 실패, 중단보다 실행이 먼저 완료)이 있다. 취소는 별도 중단 요청, 만료는 시간 조건이다. 이들은 실제 OAuth/prover/RPC/가스/issuer 장애나 실기기 왕복을 구현한 것이 아니다. 실제 도달·복구를 검사한 상태와 artifact는 새 릴리스 기록을 따르며, enum/선택지 존재만으로 모두 PASS라 하지 않는다.

## 4. 검수 범위와 인계

- 비작성자 소스·문구 검토: 한 primary와 같은 장소 복귀, 준비된 응답의 펼침 설명, 실제 가이드 내용, 중단과 기록만 재시도하는 구조를 확인했다. EN/KO/JA의 실제 동일인 중복 제한으로 오해될 문구를 제거하고 `personVerified`를 신원 확인 여부로 맞췄다. 설명/재조회 44px, 기록 텍스트 12px를 소스에서 확인했다. 이는 실제 화면의 시각 PASS가 아니다.
- 독립 로컬 시각 실행(`page-0a579e8a35166cb4.js`): 320px JA/dark의 fresh Person·명시적 Person 전용 패스 생성/보관·holder·VP, Tab/Space/Enter 승인, 실제 가이드 3개와 52px footer의 가시성/히트 영역을 확인했다. 가로 overflow·page error·provider 요청은 없었다. 화면 높이를 568→480으로 바꾼 뒤 복귀하면 같은 장소/DOM focus는 유지하지만 진입 행이 화면 아래에 남는 조건이 있어 한정 보정·재검수 대상으로 남겼다. 근거는 로컬 `k-tour-id-app/artifacts/qa/experience-visual-review/`이며 물리 기기 검수가 아니다. 최종 판정은 새 릴리스 기록을 따른다.
- 수락 검사 대상: 실제 장소 CTA 진입, 한 primary 행동, 취소/거절/만료/unknown·중복, 원 장소 복귀, 다른 장소/잔액/credential/방문 불변, 320px·JA·dark 및 키보드. 실행한 조합만 별도 근거로 판정한다.
- 계약·typecheck·build·브라우저·배포의 **최신 실제 결과와 소스/환경은 새 릴리스 기록**에만 유지한다. 기존 862 계약이나 `505e475` 운영 PASS를 새 기능에 상속하지 않는다. Chromium 검수를 물리 iPhone/Android·실제 provider 검수로 바꾸어 말하지 않는다.
- Harvey의 네 기술 실연동, A01–A20과 Sui 제출/등록·case study 요구는 [짧은 인계서](./HARVEY_HACKATHON_HANDOFF_2026-09-14.md) 및 기존 상세 명세 그대로다. 이 목업은 연결 지점을 제공할 뿐 해커톤 연동 완료나 추가 상금 자격의 증거가 아니다.
