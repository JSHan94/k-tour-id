# ONDO 9시간 QA·인수 계획

상태: 실행 기준 v1 · 2026-08-19
적용 결과물: ONDO Frontend Demo Candidate v2
관련 문서: 01 PRD, 03 Flow Catalog, 04 State Model, 07 Visual Spec, 11 Traceability, 13 As-built

## 1. 목적과 판정 원칙

이 문서는 “많이 확인했다”가 아니라 요구사항, 흐름, 상태마다 어떤 증거가 있어야 인수할 수 있는지를 고정한다. 실행 완료는 기능 수·경과 시간·토큰 사용량이 아니라 아래 Gate의 통과로 판정한다. 초기 9시간 뒤 Gate가 미통과면 Quality Extension Wave를 자동 반복한다.

- 실제 외부 연동과 fixture simulation을 혼동하지 않는다.
- 정상 경로만 통과한 기능은 완료로 보지 않는다.
- 구현 Agent는 자신의 slice를 최종 승인하지 않는다.
- QA는 두 번만 수행하되, 두 번째는 첫 번째의 단순 재실행이 아니라 reviewer를 교환한 adversarial review다.
- Critical·High가 남으면 반복을 무한히 늘리지 않고 불안정 slice를 rollback하거나 Candidate 판정을 보류한다.
- 공개 UI에 DEMO 배지는 두지 않지만 테스트·traceability·as-built에는 `SIMULATED`, `CONTRACT_ONLY`, `NOT_CONFIGURED`, `TESTNET` 여부를 명시한다.

## 2. 현재 Baseline과 QA 도구 도입

2026-08-19 기준 확인된 상태:

- pnpm typecheck: 통과
- pnpm build: 통과
- Next.js 16.2.6, React 19.2.6, Leaflet 1.9.4
- package.json에 E2E·visual·accessibility test script 없음
- Playwright와 axe dev dependency 없음
- 현재 /ondo 도시는 CSS 연출 지도이며 자동화 대상이 정리되지 않음

따라서 Gate 0에서 Integrator만 다음 도구를 도입한다.

- @playwright/test: Chromium E2E와 screenshot
- @axe-core/playwright: 자동 접근성 검사
- Chromium browser binary: 실행 환경에 설치하되 저장소에는 포함하지 않음

package.json과 lockfile은 Integrator 소유다. Worker가 dependency를 직접 추가하지 않는다.

권장 script 계약:

~~~text
test:e2e       Playwright 전체 기능 테스트
test:e2e:core  release Core 8개 composite test
test:visual    승인된 screenshot만
test:a11y      핵심 surface axe 검사
test:contracts CONTRACT-DATA-001~016
qa             typecheck → build → contracts → core/supporting E2E
~~~

최종 QA는 development server가 아니라 production build를 고정 포트에서 실행한다. 테스트 시각, locale, timezone, fixture는 개발 전용 scenario query 또는 fixture adapter로 고정한다.

## 3. ID 체계

### 요구사항

REQ-001부터 REQ-019는 승인된 19개 요구를 그대로 가리킨다. 숫자를 재사용하거나 다른 의미로 바꾸지 않는다.

### 핵심 Flow

| ID | Flow | 주 사용자 |
|---|---|---|
| FL-001 | Guest ONDO → 서울 실제 지도 → 장소 → 저장·길찾기 | 단기 외국인 |
| FL-002 | 독립 Age proof → After 19 → 같은 확장 장소 복귀 | 19+ 야간 프리뷰 사용자 |
| FL-003 | 장소 Table → 참여 → 이미지 대화 → 체크인 → 상호 피드백 | 외국인·로컬 |
| FL-004 | 장소 Checkout(KRW 가격·OOKRW read-only settlement hypothesis) → 별도 현장 방문 증거 → Stamp 9→10 → Labs badge | 검증 사용자 |
| FL-005 | 한국인 Account → CX Mobile ID simulation → Local contribution | 한국인 로컬 |
| FL-006 | 장기체류 외국인 → Residence Card 지원·미지원·대체 경로 | 국내 거주 외국인 |

### 필수 Supporting Flow

| ID | Flow | 최소 인수 |
|---|---|---|
| `FL-007` | Short-term onboarding | finish/skip/failure→Guest home, KYC 없음 |
| `FL-008` | Korean local onboarding | finish/skip/account failure→home, CX 자동 시작 없음 |
| `FL-009` | Resident onboarding | finish/skip/account failure→home, Residence Card 자동 시작 없음 |
| `FL-010` | Account gate | action별 `returnTo` one-shot, cancel/fail/retry/invalid fallback |
| `FL-011` | Save / My Korea | Account 뒤 같은 venue 저장, Guest 직접 저장 금지 |
| `FL-012` | Local Signal / first mission | venue draft/photo/submit/cancel/fail/duplicate/returnTo |
| `FL-013` | Manual 19+ proof | success/cancel/fail/expiry 후 원 CTA 또는 기본 지도 |
| `FL-014` | Auto After19 | 4 guard, manual off, remount 유지, new-session reset |
| `FL-015` | Optional profile | self-declared consent field만 공개 |
| `FL-016` | Evidence / trait | OpenDID/EAS separate mapping, stale/error/mismatch negative |
| `FL-017` | Payment KYC | age/person과 독립, pending/fail/expiry/retry/returnTo |
| `FL-018` | Labs | wallet/bridge negative states, AMM Deferred |

### 핵심 State

State ID는 [State Model](./04_STATE_MODEL.md)의 canonical 값을 그대로 쓴다. `ST-*` 같은 QA 전용 별칭을 새로 만들지 않는다. 네트워크·권한·빈 결과처럼 도메인 상태가 아닌 조건은 Scenario와 Fixture로 표현한다.

| 영역 | State ID |
|---|---|
| Onboarding | `ONB-NEW`, `ONB-IN-PROGRESS`, `ONB-COMPLETE` |
| Map | `MAP-KOREA`, `MAP-SEOUL`, `MAP-BUSAN`, `MAP-GROWING`, `MAP-VENUE`, `MAP-FALLBACK` |
| Save | `SAV-IDLE`, `SAV-SAVING`, `SAV-SAVED`, `SAV-FAILED` |
| Account | `ACC-GUEST`, `ACC-CREATING`, `ACC-ACTIVE`, `ACC-FAILED` |
| Preference | `PREF-AUTO-NIGHT-ON`, `PREF-AUTO-NIGHT-OFF` |
| Public profile | `PUB-PRIVATE`, `PUB-PARTIAL`, `PUB-EDITING`, `PUB-SAVE-FAILED` |
| Identity | `PER-UNVERIFIED`, `PER-PENDING`, `PER-VERIFIED`, `PER-UNSUPPORTED`, `PER-FAILED`, `PER-EXPIRED` |
| Age | `AGE-UNVERIFIED`, `AGE-PENDING`, `AGE-VERIFIED`, `AGE-FAILED`, `AGE-EXPIRED`; auto off는 `A19-MANUAL-OFF` |
| Payment KYC | `PKY-NOT-STARTED`, `PKY-PENDING`, `PKY-VERIFIED`, `PKY-FAILED`, `PKY-EXPIRED` |
| After19 | `A19-OFF`, `A19-PROMPT`, `A19-ON`, `A19-MANUAL-OFF` |
| Table availability | `TAV-OPEN`, `TAV-FULL`, `TAV-CLOSED`, `TAV-CANCELLED` |
| Table membership | `TMB-NONE`, `TMB-REQUESTING`, `TMB-CONFIRMED`, `TMB-CHECKED-IN`, `TMB-COMPLETED`, `TMB-LEFT`, `TMB-FAILED` |
| Table failure reason | `TFR-NONE`, `TFR-FULL`, `TFR-NETWORK`, `TFR-POLICY`, `TFR-CANCELLED` |
| Chat access | `CHA-LOCKED`, `CHA-OPEN` |
| Media | `UPL-IDLE`, `UPL-PREVIEW`, `UPL-SENDING`, `UPL-SENT`, `UPL-FAILED`, `UPL-REMOVED`; `MSG-IDLE`, `MSG-SENDING`, `MSG-SENT`, `MSG-FAILED` |
| Evidence | `EVD-UNKNOWN`, `EVD-LOADING`, `EVD-VALID`, `EVD-STALE`, `EVD-INVALID`, `EVD-ERROR` |
| Trait | `TRT-UNKNOWN`, `TRT-ELIGIBLE`, `TRT-INELIGIBLE`, `TRT-STALE`, `TRT-ERROR` |
| Payment | `PAY-IDLE`, `PAY-CONFIRMING`, `PAY-PROCESSING`, `PAY-SIMULATED-SUCCESS`, `PAY-FAILED`, `PAY-CANCELLED` |
| Reputation | `REP-VISIT-NEW`, `REP-VISIT-RECENT`, `REP-VISIT-REPEAT`; `REP-CONTRIBUTION-NEW`, `REP-CONTRIBUTION-HELPFUL`, `REP-CONTRIBUTION-ESTABLISHED`; `REP-MEETUP-NEW`, `REP-MEETUP-RELIABLE`, `REP-MEETUP-ESTABLISHED`; read-only `REP-IDENTITY-UNVERIFIED`, `REP-IDENTITY-VERIFIED` |
| Stamp | `STM-N00`~`STM-N10` |
| NFT | `NFT-LOCKED`, `NFT-ELIGIBLE`, `NFT-OPTED-IN`, `NFT-MINTING`, `NFT-MINTED`, `NFT-FAILED` |
| Wallet | `WAL-DISCONNECTED`, `WAL-CONNECTING`, `WAL-READY`, `WAL-FAILED` |
| Bridge | `BRG-IDLE`, `BRG-QUOTED`, `BRG-CONFIRMING`, `BRG-PENDING`, `BRG-SIMULATED-SUCCESS`, `BRG-FAILED`, `BRG-CANCELLED` |
| Bridge phase | `BRP-NONE`, `BRP-SOURCE-SUBMITTED`, `BRP-SOURCE-CONFIRMED`, `BRP-RELAYING`, `BRP-DESTINATION-CONFIRMED` |
| Asset view | `AST-READY`, `AST-STALE`, `AST-ERROR` |

Test ID는 E2E, VIS, A11Y, PERF, MANUAL 접두사를 쓴다. 하나의 Test가 여러 요구를 증명할 수 있지만 각 요구는 최소 한 개의 증거에 연결돼야 한다.

05 Data Contracts의 Scenario ID는 test title과 evidence 파일명에 그대로 포함한다.

| Scenario | 대표 Test |
|---|---|
| SCN-001-GUEST-DISCOVER | E2E-MAP-01, E2E-MAP-05 |
| SCN-002-ACCOUNT-RETURN | E2E-AUTH-02~05, E2E-MAP-04 |
| SCN-003-TOURIST-AFTER19 | E2E-ID-04, E2E-AGE-01~04 |
| SCN-004-TABLE-CHAT | E2E-TABLES-01~03, E2E-TABLES-04, E2E-CHAT-01, E2E-MEDIA-02~03 |
| SCN-005-CHECKOUT-LABS | E2E-PAY-01~03, E2E-LABS-01~03 |
| SCN-006-STAMP-MILESTONE | E2E-REWARD-01 |
| SCN-007-KOREAN-CX | E2E-ID-01~02 |
| SCN-008-RESIDENCE-SUPPORTED | E2E-ID-03의 supported 분기 |
| SCN-009-RESIDENCE-UNAVAILABLE | E2E-ID-03의 unsupported 분기 |
| SCN-010-LABS-BRIDGE | E2E-LABS-02 |
| SCN-011-ONBOARD-SHORT | E2E-ONB-01 |
| SCN-012-ONBOARD-KOREAN | E2E-ONB-02 |
| SCN-013-ONBOARD-RESIDENT | E2E-ONB-03 |
| SCN-014-LOCAL-SIGNAL | E2E-SIGNAL-01~04, E2E-MEDIA-01 |
| SCN-015-PAYMENT-KYC | E2E-PKY-01~04 |

## 4. 요구사항별 인수·Test ID

| REQ | 9시간 인수 깊이 | 필수 Test ID | 핵심 판정 |
|---|---|---|---|
| REQ-001 한국인 CX | Interactive simulation | E2E-ID-01, E2E-ID-02 | CX 성공·거절 후 원래 Local contribution 문맥 복귀 |
| REQ-002 Residence Card | Interactive simulation | E2E-ID-03 | 지원·미지원·대체 경로, 지도 사용은 유지 |
| REQ-003 Passport KYC+첫 미션 | Interactive simulation | E2E-ID-04, E2E-SIGNAL-01~04, E2E-TRUST-01 | KYC와 행동 평판을 분리하고 첫 미션은 reputation만 변화 |
| REQ-004 Evidence wrapper | Contract-only + UI evidence | E2E-LABS-01, MANUAL-TRUTH-01 | OpenDID가 EAS를 사용한다고 허위 표현하지 않음 |
| REQ-005 Login/KYC 분리 | Interactive simulation | E2E-AUTH-01~05, E2E-PKY-01~04, CONTRACT-DATA-004 | Guest·Account·Person·19+·Payment KYC가 분리됨 |
| REQ-006 Asset display·Bridge hypothesis; AMM Deferred | Labs simulation; AMM Deferred | E2E-LABS-02, CONTRACT-DATA-011, CONTRACT-DATA-013, CONTRACT-DATA-014 | 자산별 상태와 SIMULATED bridge; AMM CTA·fixture·mutation 0 |
| REQ-007 ONDO core | Deep interactive | E2E-MAP-01~05, VIS-MAP-01~04 | 실제 지도, Heat, 근거, 최신성, 지도·목록·URL 일치 |
| REQ-008 Table·Feedback·국적 | Deep representative flow | E2E-TABLES-01~03, E2E-TABLES-04, E2E-CHAT-01 | 장소·시간 맥락, 선택 공개 국적, 상호 피드백, organizer cancel·closed/expired·policy failure·신고·나가기 복귀 |
| REQ-009 Photo upload | Browser-local Local Signal mock | E2E-SIGNAL-01~04, E2E-MEDIA-01 | FL-012 현장 photo 선택·미리보기·삭제·오류, chat image와 분리 |
| REQ-010 Image chat | Fixture simulation | E2E-MEDIA-02, E2E-MEDIA-03 | 참가 확정 후에만 채팅, pending·failed·retry |
| REQ-011 KRW/OOKRW 결제 | Checkout simulation | E2E-PKY-01~04, E2E-PAY-01~04, CONTRACT-DATA-010 | 가격 KRW, OOKRW read-only settlement hypothesis, 결제 성공에도 stamp 불변, unique visit만 증가 |
| REQ-012 Auto After 19 | Interactive | E2E-AGE-01~05 | verified+현지 시각+setting+manual-off guard, remount 유지, 만료 |
| REQ-013 Can I Go 축소 | Deep in place detail | E2E-PLACE-01 | 해외카드·번호·예약·연령 조건을 장소 상세에서 확인 |
| REQ-014 Trait contract | Contract-only + eligibility mock | E2E-LABS-03, CONTRACT-DATA-012 | 전체 안전·입장 보증이 아닌 특정 trait 결과; mismatch/stale/error negative |
| REQ-015 Reputation | Interactive representative | E2E-TRUST-01, E2E-TRUST-02 | Identity·Visit·Contribution·Meetup 축 분리 |
| REQ-016 10 Stamp NFT | Milestone simulation | E2E-REWARD-01 | 9→10 변화, opt-in Labs badge, 실제 mint 주장 금지 |
| REQ-017 서울+부산 | Seoul deep + Busan seed | E2E-MAP-01, E2E-MAP-06 | 서울 완결, 부산 seed, 다른 지역 가짜 ONDO 숫자 금지 |
| REQ-018 Web app | Responsive web | E2E-ONB-01~03, VIS-RWD-01~04, A11Y-CORE-01, A11Y-SR-01, MANUAL-FLOW-01 | 모바일 웹 우선, 3 persona home 도착, desktop 중앙 frame, 키보드·screen reader, 외부 길찾기 복귀·safe-area·manual-off 수동 검수 |
| REQ-019 Hot 시각화 | Deep visual | VIS-HEAT-01~04, A11Y-COLOR-01 | 줌별 Heat, 숫자·단계명 병기, Limited와 Low 구분 |

## 5. 핵심 E2E 인수 시나리오

Release를 막는 Playwright Core suite는 다음 8개 composite test로 제한한다. 아래의 세부 E2E ID는 별도 test case를 무한히 늘리는 번호가 아니라 composite test 안의 test.step과 evidence label로 사용할 수 있다.

| Core Test | Flow | 포함 증거 |
|---|---|---|
| E2E-CORE-01 | FL-001 Guest discover | 전국→서울→장소, 지도·목록·길찾기; Guest 저장은 불가 |
| E2E-CORE-02 | FL-001 Map failure | tile-error→동일 목록, location denied |
| E2E-CORE-03 | FL-002 After 19 success | age-only returnTo, 같은 venueId·확장 상세, 19+ 전환·off |
| E2E-CORE-04 | FL-002 After 19 failure | rejected·expired·cancel 후 일반 지도 유지 |
| E2E-CORE-05 | FL-003 Table | Account non-member direct chat deny→참여→이미지 pending/fail/retry→체크인·피드백 |
| E2E-CORE-06 | FL-004 Checkout | KRW 가격+OOKRW read-only settlement hypothesis→mock receipt; 결제 전후 stamp 불변 |
| E2E-CORE-07 | FL-005 Korean CX | 성공·거절 후 Local contribution returnTo |
| E2E-CORE-08 | FL-006 Residence Card | supported·unsupported·대체 경로 |

세부 ID 중 Core에 들어가지 않은 viewport·copy·드문 edge는 QA Loop의 Playwright smoke 또는 MANUAL evidence로 남길 수 있다. 단, 11 Traceability에서 증거 종류와 미자동화 이유를 숨기지 않는다.

### Release-required supporting suite

Core 8개 수를 늘리지 않되 아래는 release-required다.

| Suite | 필수 증거 |
|---|---|
| `E2E-ONB-01`~`E2E-ONB-03` | 세 persona finish/skip/failure→home, verification state 불변 |
| `E2E-AUTH-03`~`E2E-AUTH-05` | account fail/retry, returnTo one-shot, invalid/expired fallback |
| `E2E-SIGNAL-01`~`E2E-SIGNAL-04` | Local Signal success/cancel/fail/duplicate; photo와 activity-axis 분리 |
| `E2E-PKY-01`~`E2E-PKY-04` | pending/success/fail/expiry와 checkout returnTo |
| `E2E-AGE-05` | `A19-MANUAL-OFF` remount 유지/new-session reset |
| `E2E-CHAT-01` | `ACC-ACTIVE` non-member direct route deny |
| `E2E-TABLES-04` | organizer cancel·closed/expired·policy failure, 신고 confirmation, 나가기 뒤 chat lock·Table 복귀 |

### E2E-MAP

- E2E-MAP-01: Guest → 전국 → 서울 → 성수 → 장소 상세 → 지도 복귀
- E2E-MAP-02: 필터 → 마커 → 목록 카드 → 같은 장소·결과 수
- E2E-MAP-03: 지도 이동 → 이 지역 검색 → URL 갱신 → 새로고침 복원
- E2E-MAP-04: Account 뒤 저장 pending→failure→retry→saved → My Korea 반영; 중복 callback 1회 저장, 새로고침 복원
- E2E-MAP-05: tile-error → 빈 지도가 아니라 동일 결과 목록
- E2E-MAP-06: 부산 seed → Growing/Editorial과 실제 Pulse 구분

### E2E-AUTH·ID·AGE

- E2E-AUTH-01: Guest는 지도·검색·상세·길찾기 사용 가능
- E2E-AUTH-02: 저장·Table 진입 시 FL-010 Account 요청 후 FL-011/원 CTA returnTo 복귀
- E2E-AUTH-03: account failure → 같은 returnTo retry 또는 Guest 탐색
- E2E-AUTH-04: Account→Person 다단계 gate가 같은 `SUBMIT_LOCAL_SIGNAL` 또는 `JOIN_TABLE` envelope의 최종 CTA를 보존하고, success callback 2회에도 원 mutation 1회
- E2E-AUTH-05: invalid/expired/unsafe/unregistered returnTo → token 폐기, 안전한 map surface, 원 mutation·별도 toast 없음
- E2E-ID-01: 한국인 CX 성공 → 첫 Local signal 게시
- E2E-ID-02: CX 거절·취소 → 지도와 작성 draft 유지
- E2E-ID-03: Residence Card unsupported → 대체 검증·나중에, 지도 유지
- E2E-ID-04: Passport review → verified simulation → 첫 미션
- E2E-AGE-01: 19+ verified + 19:00 이후 + auto on → After 19 전환
- E2E-AGE-02: 전환 banner의 끄기 → 설정 유지
- E2E-AGE-03: age rejected → 일반 심야 식음료 계속 탐색
- E2E-AGE-04: expired → 재확인 취소 후 원래 장소 복귀
- E2E-AGE-05: banner off → `A19-MANUAL-OFF`; component remount/route 왕복에도 off, 새 session에서만 reset

### E2E-ONBOARDING

- E2E-ONB-01: Short-term finish/skip/preference failure → `ONB-COMPLETE`, Guest home, verification 불변
- E2E-ONB-02: Korean local finish/skip/account failure → home, CX 자동 시작 없음
- E2E-ONB-03: Resident finish/skip/account failure → home, Residence Card 자동 시작 없음

### E2E-TABLES·MEDIA·LOCAL SIGNAL

- E2E-TABLES-01: 장소 상세 → Table 참여 → 확정 후 Tables membership 생성
- E2E-TABLES-02: self-declared From/Lives in 공개 범위와 언어 표시; profile save failure에서 기존 공개값 유지→retry success
- E2E-TABLES-03: 체크인 → 상호 피드백 → Meetup `REP-MEETUP-RELIABLE` 변화
- E2E-TABLES-04: organizer cancel·closed/expired·policy failure의 `TAV/TMB/TFR/CHA` 조합, 신고 confirmation, 나가기 뒤 `CHA-LOCKED`와 안전한 Table 복귀
- E2E-CHAT-01: `ACC-ACTIVE`지만 non-member인 direct chat route → `CHA-LOCKED`, `MSG-*` 불변, Table로 복귀
- E2E-MEDIA-01: FL-012 Local Signal 사진 선택 → 미리보기 → 삭제 → 잘못된 파일; 서버 업로드 없음
- E2E-MEDIA-02: FL-003 Table chat image는 confirmed member만 접근; Local Signal photo와 fixture/evidence 분리
- E2E-MEDIA-03: 전송 pending → failed → retry → fixture message 생성
- E2E-SIGNAL-01: venue → Account+Person gate → draft/photo→submit→Visit/Contribution 해당 축만 변화
- E2E-SIGNAL-02: cancel/failure → draft 또는 venue selection 유지, returnTo 복귀
- E2E-SIGNAL-03: 최초·중복 Local Signal 모두 stamp 불변; duplicate uniqueGuardKey는 Visit/Contribution 재증가 0
- E2E-SIGNAL-04: first mission 전후 Person/Age/Payment KYC/Identity reference 불변

### E2E-PAY·LABS·REWARD

- E2E-PKY-01: Payment KYC pending→verified → 동일 checkout returnTo
- E2E-PKY-02: Payment KYC failed → retry, Person/Age 불변
- E2E-PKY-03: Payment KYC expired → 결제 차단, 재확인 취소 후 venue 복귀
- E2E-PKY-04: age proof success가 Payment KYC status/provenance를 변경하지 않음
- E2E-PAY-01: 사용자 가격 KRW + OOKRW read-only settlement hypothesis → receipt, stamp 불변
- E2E-PAY-02: OOKRW는 별도 결제수단 선택지가 아니라 read-only settlement hypothesis row; redeem/1:1 문구 0
- E2E-PAY-03: 결제 실패·취소 → receipt·balance·stamp 불변, retry/venue return
- E2E-PAY-04: 결제 성공 receipt만으로는 `STM-N09` 유지; 방문 증거를 결제 결과로 합성하지 않음
- E2E-LABS-01: Evidence Envelope의 source·status·simulation 경계
- E2E-LABS-02: zkLogin fixture는 Sui signer만 만들고 Account·KYC·타 체인 자산을 변경하지 않음; USDC/USDT estimated USD 분리; bridge는 source-submitted→source-confirmed→relaying→destination-confirmed에서만 simulated success이고 failure/cancel은 자산 불변; AMM CTA·fixture·mutation 0
- E2E-LABS-03: Trait eligible/ineligible/stale/error와 venue·offer·policy version mismatch 거절
- E2E-PLACE-01: 장소 상세에서 해외카드·한국 번호·예약·언어·연령 fact를 모두 확인; `FX-TRT-ERROR`는 이용 가능으로 승격하지 않고 재확인 안내
- E2E-REWARD-01: 결제와 독립된 unique visit proof → `STM-N09 → STM-N10` → opt-in badge simulation
- E2E-TRUST-01: 첫 미션이 KYC가 아닌 Visit/Contribution 평판만 변경
- E2E-TRUST-02: Identity와 Meetup reputation을 단일 종합점수로 합치지 않음

## 6. Viewport·언어·Scenario Matrix

초기 9시간에는 Core와 smoke를 구분한다. 이후 Extension Wave에서는 남은 S0/S1, 실패 분기, 대표 viewport·locale 조합을 위험 기반으로 반복하며 같은 미해결 이슈를 문서만 낮춰 통과시키지 않는다.

| Viewport | EN | KO | 범위 |
|---|---:|---:|---|
| 390×844 iPhone | Core 전체 | Core 전체 | QA 1·2 모두 |
| 430×932 Large iPhone | Core | Visual smoke | QA 2 |
| 360×800 Small Android | Core smoke | Core smoke | QA 1·2 |
| 768×1024 Tablet | Layout smoke | 생략 가능 | QA 2 |
| 1440×900 Desktop | 중앙 frame·keyboard | 중앙 frame smoke | QA 2 |

필수 scenario:

| Scenario | Canonical State / Fixture 결과 |
|---|---|
| normal | 모든 기본 Flow |
| no-signals | `MAP-GROWING` + `FX-MAP-GROWING` |
| no-results | 현재 `MAP-*` 유지 + 필터 결과 0 + 초기화 CTA |
| tile-error | `MAP-FALLBACK` + `FX-MAP-TILE-FAIL` |
| location-denied | 현재 공개 Map state 유지 + `FX-MAP-LOCATION-DENIED` |
| offline | `MAP-FALLBACK` + stale cached evidence fixture |
| age-rejected | `AGE-FAILED` + 기본 `A19-OFF` |
| age-expired | `AGE-EXPIRED` + 원 CTA `returnTo` |
| after19-manual-off-remount | `A19-MANUAL-OFF` + route 왕복/remount 후 유지; new session `A19-OFF` |
| account-failed | `ACC-FAILED` + same valid `RT-*` + retry/Guest return |
| return-invalid | invalid/expired `ondo.session.v3.gate` 폐기 + 안전한 기본 ONDO surface |
| payment-kyc-failed | `PKY-FAILED` + checkout mutation 0 |
| payment-kyc-expired | `PKY-EXPIRED` + checkout 차단 + venue return |
| table-full | `TAV-FULL` + `TMB-FAILED` + `TFR-FULL` + `CHA-LOCKED` |
| account-nonmember-chat | `ACC-ACTIVE` + `TMB-NONE` → `CHA-LOCKED`; `MSG-*` 불변 |
| residence-unsupported | `PER-UNSUPPORTED` + `FX-PER-RESIDENCE-UNSUPPORTED` |
| media-failed | `UPL-FAILED` 또는 `MSG-FAILED` |
| local-signal-duplicate | duplicate VisitEvidence + stamp/reputation mutation 0 |
| payment-declined | `PAY-FAILED` + 자산·stamp 불변 |
| bridge-pending | `BRG-PENDING` + 자산 불변 |
| translation-failed | 원문 유지·번역 실패 설명 |

Core matrix는 normal, tile-error, age-rejected, table-full, media-failed, payment-declined다. 나머지는 한 viewport EN에서 자동 확인하고 한국어는 copy·overflow smoke로 보완한다.

### Contract·manual·a11y evidence

`pnpm test:contracts`는 05의 `CONTRACT-DATA-001`~`CONTRACT-DATA-016`을 모두 실행한다.

| 묶음 | Test ID | 필수 판정 |
|---|---|---|
| Geometry/Heat | `CONTRACT-DATA-001`, `CONTRACT-DATA-002` | coordinate 불변, 범위·limited·stale invariant |
| Gate/Return | `CONTRACT-DATA-003`, `CONTRACT-DATA-004`, `CONTRACT-DATA-016` | one-shot returnTo, 독립 KYC, zkLogin signer 경계, onboarding no-KYC |
| Evidence | `CONTRACT-DATA-005`, `CONTRACT-DATA-006` | OpenDID/EAS separate adapters, invalid/expired negative |
| Table/Media/Reputation | `CONTRACT-DATA-007`, `CONTRACT-DATA-008`, `CONTRACT-DATA-009` | non-member deny, photo purpose 분리, identity event 금지 |
| Commerce/Labs | `CONTRACT-DATA-010`~`CONTRACT-DATA-015` | checkout≠visit, bridge positive finality·negative, merchant negative, asset 분리, AMM Deferred, registry별 fixture truth |

자동화 도구의 raw output staging root는 `artifacts/qa/`로 고정한다. 이 경로와 `manifest.json`은 수집·검토 전 중간 산출물이며 Gate의 정본이 아니다. 승인된 결과는 Root가 `docs/ondo-execution/evidence/<RUN_ID>/`로 반영하고, 그 디렉터리의 `manifest.md`만 durable release evidence와 Gate의 유일한 source of truth다.

```text
artifacts/qa/
  manifest.json
  contracts/contract-data.json
  contracts/junit.xml
  e2e/playwright-report/
  e2e/results.json
  visual/PX-001__VIS-MAP-01__en__390x844.png
  visual/diff/
  a11y/axe-results.json
  a11y/keyboard-focus.md
  a11y/screen-reader.md
  manual/MANUAL-TRUTH-01.md
  manual/MANUAL-FLOW-01.md
  console/console-errors.json
```

절차:

1. 자동 결과는 test ID, commit SHA, scenario, fixture, locale, viewport, started/finished time, pass/fail, artifact path를 staging `manifest.json`에 기록한다. Root는 승인·거절·revert 상태와 durable 상대 경로를 `docs/ondo-execution/evidence/<RUN_ID>/manifest.md`에 옮기고 checksum을 대조한다.
2. `A11Y-CORE-01`은 axe JSON 외에 keyboard-only로 onboarding skip, map/list fallback, account cancel, Table, chat composer, dialog focus restore를 검수하고 `keyboard-focus.md`에 actual focus order를 기록한다.
3. `A11Y-SR-01`은 map의 semantic list, ONDO accessible name, After19 mode change, upload/error announcement를 VoiceOver 또는 동등 screen reader로 확인해 `screen-reader.md`에 환경·발화·판정을 적는다.
4. `MANUAL-TRUTH-01`은 simulation/contract-only/testnet/AMM Deferred/merchant·bridge negative 문구를 KO/EN에서 읽고, fixture Labs 화면의 exact truth copy가 `Target network: Sui Testnet · Simulated`인지 확인해 screenshot path를 연결한다.
5. `MANUAL-FLOW-01`은 자동화하기 어려운 external directions 복귀, 모바일 keyboard/safe-area, remount 후 manual-off를 수행해 steps/expected/actual/reviewer/time을 기록한다.
6. artifact가 없거나 SHA·fixture가 다르면 해당 판정은 `Not run`이다. 구두 확인이나 screenshot 없는 `Pass`를 허용하지 않는다.

## 7. Visual Screenshot 규칙

### 승인 Screenshot registry

07 Visual Spec의 PX ID와 아래 Visual Test ID는 1:1이다. evidence 파일명은 `{PX_ID}__{VIS_ID}__{locale}__{viewport}.png`다.

| PX ID | Visual Test ID | 필수 포착 |
|---|---|---|
| `PX-001` | `VIS-MAP-01` | 전국 ONDO |
| `PX-002` | `VIS-MAP-02` | 서울 동네 Heat |
| `PX-003` | `VIS-MAP-03` | 장소 선택 + Peek |
| `PX-004` | `VIS-MAP-04` | 장소 상세 + Before you go |
| `PX-005` | `VIS-MAP-05` | tile failure 목록 fallback |
| `PX-006` | `VIS-HEAT-01` | six-level legend |
| `PX-007` | `VIS-HEAT-02` | selected marker + confidence ring |
| `PX-008` | `VIS-HEAT-03` | After 19 banner/dark/off |
| `PX-009` | `VIS-HEAT-04` | 부산 seed/Growing truth |
| `PX-010` | `VIS-ONB-01` | 세 persona + Skip |
| `PX-011` | `VIS-FLOW-01` | Passport/age simulation |
| `PX-012` | `VIS-FLOW-02` | member Table chat image fail/retry |
| `PX-013` | `VIS-FLOW-03` | Local Signal photo fail/return |
| `PX-014` | `VIS-FLOW-04` | KRW price/OOKRW read-only settlement hypothesis + stamp 불변 |
| `PX-015` | `VIS-FLOW-05` | unique visit→Stamp 10 |
| `PX-016` | `VIS-FLOW-06` | Korean CX truth/returnTo |
| `PX-017` | `VIS-FLOW-07` | Residence unsupported/alternate |
| `PX-018` | `VIS-LABS-01` | separated assets + bridge negative; AMM 없음 |
| `PX-019` | `VIS-RWD-01` | 360×800 |
| `PX-020` | `VIS-RWD-02` | 390×844 |
| `PX-021` | `VIS-RWD-03` | 430×932 |
| `PX-022` | `VIS-RWD-04` | 1440×900 |
| `PX-023` | `VIS-CONNECT-01` | confirmed Table chat + local image/feedback entry |
| `PX-024` | `VIS-COMMERCE-01` | simulated checkout receipt + settlement boundary |
| `PX-025` | `VIS-LABS-01` | separated assets + simulated bridge/trait truth |

### Determinism

- timezone은 Asia/Seoul로 고정한다.
- 테스트 clock은 2026-08-19 20:00 KST로 고정한다.
- animation·transition·cursor·caret을 screenshot 시 비활성화한다.
- fixture id와 이미지 asset을 고정하고 네트워크 이미지에 의존하지 않는다.
- font load 완료와 Leaflet ready signal 후 촬영한다.
- screenshot마다 scenario·locale·viewport를 파일명에 포함한다.

### Mask

외부 타일은 시간·provider에 따라 달라질 수 있으므로 Leaflet tile pane만 mask한다. 다음은 mask하면 안 된다.

- ONDO aggregate·marker·Heat halo
- 선택 ring·label·score
- 검색·filter·map control
- attribution
- Peek·Sheet
- empty·error fallback

상대 시간이나 랜덤 avatar는 mask하지 말고 clock·fixture로 고정한다. 제품 결함을 숨기는 광범위한 rectangle mask는 금지한다. 승인 예외는 11 Traceability에 selector와 이유를 남긴다.

## 8. 접근성·성능·Console·Dead CTA

### 접근성

자동 axe 기준:

- Core surface의 Critical 0
- Core surface의 Serious 0
- Moderate·Minor는 as-built에 기록

수동 기준:

- Skip 또는 목록 fallback으로 지도 없이 같은 장소에 도달
- 키보드로 검색, filter, 장소, 저장, Table, dialog 취소 가능
- Dialog·Sheet focus trap, 닫은 뒤 trigger로 focus 복원
- visible focus가 지도·야간 배경에서 보임
- 44×44px 핵심 touch target
- ONDO 단계는 색 외에 숫자·단계명·ring을 가짐
- input·upload·error에 label과 설명이 있음
- reduced motion에서 지속 animation 없음

### 성능

Lighthouse Performance 85+, Accessibility 95+는 목표다. CI 환경 변동이 있으므로 9시간 Candidate의 절대 release blocker는 다음으로 좁힌다.

- production build 성공
- 초기 화면이 무한 loading이 아님
- Core 정상 시나리오 LCP 4초 이내를 목표로 하고 초과 시 수치·환경 기록
- CLS 0.1 이하 목표
- 지도 이동과 Sheet 조작이 장시간 main thread를 막지 않음
- 이미지가 원본 크기 그대로 과도하게 전송되지 않음

성능 수치가 목표 미달이어도 Critical/High 기능·진실성 문제가 없다면 Candidate는 만들 수 있으나 13 As-built에 측정값과 원인을 기록한다.

### Console

Playwright가 console.error, pageerror, unhandled rejection, failed request를 수집한다.

- normal scenario의 허용되지 않은 console error 0
- 예상된 tile-error·offline의 request failure만 allowlist
- React hydration·key·state update warning 0
- 외부 provider error를 무시하지 않고 사용자 fallback과 함께 검증
- 새로운 allowlist는 selector가 아니라 정확한 message pattern과 이유를 기록

### Dead CTA

Core 화면의 visible button, link, menu item은 모두 다음 중 하나를 충족한다.

- route·state·sheet·dialog가 실제로 변함
- 외부 handoff URL이 생성됨
- disabled이며 이유가 보임
- `CONTRACT_ONLY`/Labs이면 설명 surface로 이동함

toast만 띄우고 다음 상태가 없는 핵심 CTA는 dead CTA다. 자동 crawler와 reviewer가 visible control을 표로 만들고 action 전후 URL, focus, 주요 State 변화를 비교한다. Critical flow dead CTA는 0이어야 한다.

## 9. 두 번의 Cross-review

### QA Loop 1 · Integration 1 후

목표: 기능 누락과 구조적 결함을 일찍 찾는다.

| Reviewer | 자신이 구현하지 않은 검토 범위 |
|---|---|
| Map Agent | Identity·After 19의 returnTo·failure |
| Identity Agent | Tables·Payment의 신뢰 문구·privacy |
| Tables Agent | Map·Place의 실제 탐색·dead CTA |
| Root | build, traceability, console, 계약 경계 |

실행:

1. Core E2E와 실패 scenario 실행
2. 390×844 EN·KO, 360×800 smoke
3. 이슈에 severity·REQ·Flow·State·증거 지정
4. Root가 중복을 합치고 owner를 재지정
5. owner는 S0/S1과 공통 원인의 S2만 우선 수정

### QA Loop 2 · Integration 2 후

목표: 수정으로 생긴 회귀와 시각·접근성·진실성 문제를 찾는다.

Reviewer를 교환한다.

| Reviewer | 검토 범위 |
|---|---|
| Map Agent | Tables·Media·Checkout visual/state |
| Identity Agent | Map Heat·Responsive·color/accessibility |
| Tables Agent | Onboarding·Identity·After19·simulation truth |
| Root | production build, full Core, screenshot, release evidence |

Loop 2 이후 새 기능과 넓은 refactor는 금지한다. S0/S1은 고치거나 해당 atomic slice를 revert한다. S2/S3는 사용자 영향과 evidence를 as-built backlog에 남긴다.

## 10. Severity와 처리

| 등급 | 정의 | 예시 | 종료 전 처리 |
|---|---|---|---|
| S0 Critical | build 불가, 데이터·privacy·금전·신원 허위, 전체 앱 불가 | 실제 결제처럼 표현, KYC 정보 무동의 공개 | 반드시 수정 또는 slice revert |
| S1 High | 핵심 Flow 단절, fallback 없음, 주요 상태 오판 | 흰 지도, After19 취소 후 갇힘, 저장 유실 | 반드시 수정 또는 slice revert |
| S2 Medium | 우회 가능하지만 명확한 UX·a11y·반응형 결함 | 긴 한글 잘림, focus 복원 실패 | 시간 내 공통 원인 우선; 나머지 기록 |
| S3 Low | polish·일관성·경미한 문구 | 4px 간격 차이, 덜 자연스러운 보조문구 | as-built backlog 가능 |

같은 원인의 이슈는 하나로 합치되 영향을 받은 REQ·Flow·State를 모두 연결한다. “취향”만으로 severity를 높이지 않는다.

## 11. Gate와 종료 조건

| Gate | 시점 | 필수 조건 |
|---|---|---|
| G0 Baseline | 0:30 | dirty source 보호, SPEC SHA, typecheck·build, current screenshot |
| G1 Contract Freeze | 1:10 | 19 REQ 판정, Flow·State·Fixture ID, ownership, Playwright+`test:contracts` harness |
| G2 Integration 1 | 5:00 | 세 slice cherry-pick, typecheck·build, Core 일부 실행 |
| G3 QA 1 | 5:40 | cross-review 이슈 triage·owner·severity 확정 |
| G4 Integration 2 | 7:10 | S0/S1 수정, typecheck·build, traceability 갱신 |
| G5 QA 2 | 7:55 | Core+release-required E2E, `CONTRACT-DATA-001~016`, screenshot, axe, console, dead CTA 결과 |
| G6 Candidate | 9:00 | staging `artifacts/qa/manifest.json` 대조 완료, durable `docs/ondo-execution/evidence/<RUN_ID>/manifest.md`, as-built·release evidence |

최종 종료 조건:

- REQ-001~REQ-019가 Implemented, Simulated, Contract-only, Deferred 중 하나이며 Unknown 0
- FL-001~FL-004 Core E2E 100% 통과
- FL-005~FL-006 foundation flow는 적어도 성공·거절 또는 unsupported 상태 통과
- release-required `E2E-ONB-01~03`, `E2E-AUTH-03~05`, `E2E-SIGNAL-01~04`, `E2E-PKY-01~04`, `E2E-AGE-05`, `E2E-CHAT-01`, `E2E-TABLES-04` 통과
- `pnpm test:contracts`의 `CONTRACT-DATA-001~016` 전부 통과
- pnpm typecheck와 production build 통과
- S0 0, S1 0
- Core visible dead CTA 0
- normal console error 0
- tile-error에서 목록 fallback
- 390×844 EN·KO 핵심 화면 잘림 0
- fixture를 실제 CX·KYC·체인·결제로 주장하는 문구 0
- staging `artifacts/qa/manifest.json`과 durable `docs/ondo-execution/evidence/<RUN_ID>/manifest.md`의 SHA·fixture·locale·viewport·test ID·artifact path·checksum 대조가 끝나고, Gate 판정은 durable `manifest.md`만 참조하며 누락 증거 0
- axe 결과와 keyboard focus·screen reader·truth/flow 수동 증거가 정해진 artifact path에 있으며 Critical·Serious 0, 필수 수동 시나리오 Pass
- 두 QA 결과, 수정·revert commit, screenshot과 report가 11 Traceability에 연결
- 13 As-built에 구현·simulation·contract-only·deferred·known S2/S3 기록

## 12. 초기 Wave 종료·Quality Extension

초기 Wave 7:55 이후에는 새 기능을 추가하지 않고 S0/S1 수정, slice revert, evidence 작성에 집중한다. 8:25까지 S0/S1 또는 build 실패가 남아도 실행을 끝내거나 판정을 낮추지 않는다. G6 미통과 상태를 그대로 기록한 뒤 2시간 Quality Extension Wave를 자동 시작한다.

처리 순서:

1. 마지막 불안정 atomic slice를 식별
2. 사용자 변경을 건드리지 않고 integration branch에서 git revert
3. Core flow와 build 재실행
4. 되돌린 REQ를 Deferred 또는 Simulated-static으로 traceability에 기록
5. G6을 만족하면 검증된 Candidate로 판정
6. G6 미통과면 남은 이슈·소유자·증거를 다음 Extension Wave로 넘겨 `fix → integration → cross-review → evidence` 반복
7. Candidate Gate 통과 또는 승인되지 않은 외부 계정·권한 없이는 해결할 수 없는 blocker일 때만 자동 반복 종료

종료 시 Medium·Low가 0일 필요는 없다. 그러나 숨겨진 Unknown, 증거 없는 Pass, 실제 연동처럼 보이는 simulation은 허용하지 않는다.
