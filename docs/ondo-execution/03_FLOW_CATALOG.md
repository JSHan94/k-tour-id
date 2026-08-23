# ONDO 9시간 Flow Catalog

상태: `Locked execution contract · 2026-08-19`
범위: [9시간 PRD](./01_PRD_9H.md), [결정 원장](./02_DECISION_LEDGER.md), [상태 모델](./04_STATE_MODEL.md)

이 문서는 화면 목록이 아니라 **CTA가 눌린 뒤 성공·취소·실패·원래 행동 복귀까지 보장하는 계약**이다. 외부 신원·결제·체인 응답은 fixture여도 사용자 여정은 정적 성공 화면이 아니어야 한다.

---

## 0. ID와 표기 규칙

| 대상 | 형식 | 예시 | 규칙 |
|---|---|---|---|
| 요구사항 | `REQ-NNN` | `REQ-012` | [PRD registry](./01_PRD_9H.md#6-19개-요구사항-registry)의 `REQ-001`~`REQ-019`만 사용 |
| Flow | `FL-NNN` | `FL-003` | 세 자리, 성공·취소·실패·복귀를 가진 사용자 여정 |
| 상태 | `[DOMAIN]-[STATE]` | `AGE-VERIFIED` | 대문자 domain과 state; 전체 목록은 [상태 모델](./04_STATE_MODEL.md#1-정규-state-id) |
| Fixture | `FX-[DOMAIN]-[SCENARIO]` | `FX-PER-CX-SUCCESS` | 외부 의존성·경계 조건의 결정적 시나리오 |
| 화면 | `SCR-[SURFACE]` | `SCR-MAP` | PRD 화면과 일치 |
| 복귀 토큰 | `RT-[RETURN_TO_CTA]-<epoch-ms>` | `RT-JOIN_TABLE-1787133600000` | v3 session gate가 원 CTA를 한 번 재개하기 위한 안전한 참조 |

`returnTo`의 정규 shape는 다음과 같다.

```ts
type ReturnToCta =
  | "SAVE_VENUE"
  | "JOIN_TABLE"
  | "OPEN_CHAT"
  | "SUBMIT_LOCAL_SIGNAL"
  | "START_CHECKOUT"
  | "OPEN_AFTER19"
  | "MINT_BADGE";

type ReturnToEnvelope = {
  tokenId: `RT-${ReturnToCta}-${number}`;
  cta: ReturnToCta;
  gateQueue: ("account" | "person" | "age" | "payment_kyc")[];
  activeGate: "account" | "person" | "age" | "payment_kyc";
  venueId?: string; // allowlist된 공개 entity ID만
  tableId?: string; // allowlist된 공개 entity ID만
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
};
```

원본 신분증 값, 국적, 생년월일, credential, 결제수단, 사진 blob은 URL·gate envelope에 넣지 않는다. v3 구현은 `cta`, CTA별 `gateQueue`·context matrix, `activeGate`, token 형식, 15분 수명, 공개 ID 형식을 allowlist로 검사하고 알 수 없는 필드는 복원 시 버린다. token의 epoch-ms는 `Date.parse(createdAt)`과 정확히 같아야 한다. required context 누락, forbidden context 추가, 명시적 `null` ID, 비정규 gate 순서·중복은 envelope 전체를 무효화한다. hydration은 venue를 canonical map 또는 Table venue registry에, table을 canonical `TABLES` registry에 대조하며 `JOIN_TABLE`은 그 table의 실제 `venueId`와 envelope pair가 같아야 한다. `cta`는 최종 resume action이고 `activeGate`만 현재 Account·Person·Age·Payment KYC 단계를 나타낸다. 다단계 gate에서도 같은 tokenId·cta·공개 context를 유지하고 마지막 guard가 충족된 뒤 원 CTA mutation 직전에 정확히 한 번만 소비한다. retry는 미소비 envelope를 유지하고 cancel은 직전 공개 context를 복구한 뒤 `gate=null`로 만든다. 중복 소비, 변조, 만료, 미등록·불일치 context는 별도 toast 없이 안전한 map surface로 복귀하며 임의 CTA가 Labs로 떨어지는 기본 branch는 없다. CTA별 정규 matrix, persistence와 수명은 [상태 모델](./04_STATE_MODEL.md#6-persistence와-개인정보-경계)이 source of truth다.

허용되는 `cta`와 token prefix는 다음뿐이다: `SAVE_VENUE` / `RT-SAVE_VENUE-<epoch-ms>`, `JOIN_TABLE` / `RT-JOIN_TABLE-<epoch-ms>`, `OPEN_CHAT` / `RT-OPEN_CHAT-<epoch-ms>`, `SUBMIT_LOCAL_SIGNAL` / `RT-SUBMIT_LOCAL_SIGNAL-<epoch-ms>`, `START_CHECKOUT` / `RT-START_CHECKOUT-<epoch-ms>`, `OPEN_AFTER19` / `RT-OPEN_AFTER19-<epoch-ms>`, `MINT_BADGE` / `RT-MINT_BADGE-<epoch-ms>`.

## 1. Gate 체계

| Gate | 의미 | 요구되는 행동 | 열리는 기능 | 열리지 않는 기능 |
|---|---|---|---|---|
| `Guest` | 계정 없음 | 없음 | 지도·검색·필터·장소 상세·외부 길찾기 | 저장·Table·대화·결제 |
| `Account` | 앱 세션 계정 | 간단 계정 생성 fixture | 저장·질문·Table 요청 | 법적 Person·19+·Payment KYC가 필요한 행동 |
| `Person` | 지원 issuer가 한 사람임을 확인 | persona별 adapter | local signal 기여·Table host | 19+·Payment KYC 자동 충족 |
| `19+` | 성인 조건만 확인 | 필요한 순간의 age proof | 주류·성인 식음료, After 19 | 결제 KYC·Person 자동 충족 |
| `Payment KYC` | 결제 정책 요건 충족 | checkout 시 별도 simulation | mock 결제 | Person·19+·공개 프로필 자동 충족 |

한 gate의 성공은 다른 gate를 암묵적으로 올리지 않는다. 특히 `Account ≠ Person ≠ 19+ ≠ Payment KYC`다. age proof와 Payment KYC는 순서·성공·만료가 서로 독립이며 어느 쪽도 다른 쪽의 선행조건이 아니다.

## 2. 전체 Flow matrix

| Flow ID | 이름 | 연결 REQ | 진입 CTA | 전제 | Success | Cancel | Failure | `returnTo` | 9시간 목표 |
|---|---|---|---|---|---|---|---|---|---|
| `FL-001` | Guest Discover | `REQ-007`, `REQ-013`, `REQ-017`~`REQ-019` | 앱 열기, 지역·heat·장소 선택 | 없음 | 서울 장소 상세 또는 외부 길찾기 도착 | sheet 닫고 직전 지도 보존 | 지도 fallback 목록·재시도 | gate 없음; URL/history context | `Implemented` |
| `FL-002` | Age proof → exact After19 venue | `REQ-005`, `REQ-012` | `19+ 장소 보기`, 잠긴 야간 프리뷰 | 일반 장소 상세 사용 가능 | 독립 19+ fixture 성공 후 같은 확장 장소 After19 상세 | 같은 잠긴 장소 상세로 돌아감 | age 이유·재시도·일반 장소 계속 이용 | `OPEN_AFTER19` | `Simulated` |
| `FL-003` | Table → Image Chat → Feedback | `REQ-008`~`REQ-010`, `REQ-015` | `Table 참여` | Account; 조건부 Person/19+ | 참가→대화→체크인→피드백→평판 변화 | 직전 장소/Table 복귀 | 단계별 retry·안전한 나가기 | `JOIN_TABLE`; 필요 시 `OPEN_CHAT` | `Simulated` |
| `FL-004` | Checkout/Labs → Stamp | `REQ-006`, `REQ-011`, `REQ-016` | `결제 시뮬레이션 계속` | Account, Payment KYC | KRW 표시 가격·OOKRW read-only settlement hypothesis→별도 unique visit evidence→9에서 10 stamp→Labs badge opt-in | checkout 또는 Labs 닫고 장소/My Korea 복귀 | 자산·stamp 불변, 재시도 | `START_CHECKOUT`; badge는 `MINT_BADGE` | `Simulated` |
| `FL-005` | Korean CX | `REQ-001`, `REQ-005` | 홈 도착 뒤 Local Signal·Table의 Person gate 또는 ID 화면의 명시적 확인 | Account, 한국인 경로 선택 | CX fixture로 `PER-VERIFIED`, 보존된 원 CTA 복귀 | Account 상태로 계속 탐색 | 실패·만료·재시도 | gated action의 기존 `SUBMIT_LOCAL_SIGNAL` 또는 `JOIN_TABLE` | `Simulated` |
| `FL-006` | Residence Card | `REQ-002`, `REQ-005` | 홈 도착 뒤 Local Signal·Table의 Person gate 또는 ID 화면의 명시적 확인 | Account, 장기체류 경로 선택 | 지원 fixture이면 `PER-VERIFIED`, 보존된 원 CTA 복귀 | Account 상태로 계속 탐색 | 미지원 대체 경로·재시도 | gated action의 기존 `SUBMIT_LOCAL_SIGNAL` 또는 `JOIN_TABLE` | `Simulated` |
| `FL-007` | Short-term onboarding | `REQ-003`, `REQ-005`, `REQ-018` | 첫 실행 `방문 여행객` | `ONB-NEW` | 언어·관심·식이 저장 후 Guest `SCR-MAP` | skip 후 Guest `SCR-MAP` | validation 실패는 기본값 적용 후 Guest `SCR-MAP` | gate 없음 | `Implemented` |
| `FL-008` | Korean local onboarding | `REQ-001`, `REQ-005`, `REQ-018` | 첫 실행 `한국 로컬` | `ONB-NEW` | Guest 또는 선택 Account로 `SCR-MAP`; CX 시작 없음 | Guest `SCR-MAP` | preference·선택 Account 실패 후 Guest `SCR-MAP`; CX 미호출 | gate 없음 | `Simulated` |
| `FL-009` | Resident onboarding | `REQ-002`, `REQ-005`, `REQ-018` | 첫 실행 `한국 거주` | `ONB-NEW` | Guest 또는 선택 Account로 `SCR-MAP`; Residence Card 시작 없음 | Guest `SCR-MAP` | preference·선택 Account 실패 후 Guest `SCR-MAP`; Residence 미호출 | gate 없음 | `Simulated` |
| `FL-010` | Account gate | `REQ-005`, `REQ-008`, `REQ-011` | 저장·Table·메시지·checkout | `ACC-GUEST` | `ACC-ACTIVE` 후 원 CTA 자동 재개 | 원 화면·선택 장소 보존 | 오류 후 Guest 기능 유지 | v3 `ReturnToCta` allowlist | `Simulated` |
| `FL-011` | Save / My Korea | `REQ-005`, `REQ-016` | `저장` | Account | 저장 토글·My Korea 반영 | gate 취소 시 미저장 | 로컬 저장 실패·재시도 | `SAVE_VENUE` | `Implemented` |
| `FL-012` | Local signal / first mission | `REQ-003`, `REQ-007`, `REQ-009`, `REQ-015` | `방문 신호 남기기` | Account + Person; 현장 조건 | browser-local 사진 preview + local signal 제출→해당 Visit/Contribution만 상승 | draft 폐기 또는 유지 선택 | 업로드 실패·교체·재시도 | `SUBMIT_LOCAL_SIGNAL` | `Simulated` |
| `FL-013` | Manual 19+ proof | `REQ-012` | After 19 chip, 주류 메뉴 | Account가 없어도 proof 시작 가능; 보관은 Account 필요 | `AGE-VERIFIED`, After19 또는 원 주류 CTA 재개 | 기본 지도 | 실패·만료·재시도 | `OPEN_AFTER19` | `Simulated` |
| `FL-014` | Auto After19 | `REQ-012` | KST 19:00 도달 또는 앱 resume | `AGE-VERIFIED` + 미만료 + KST≥19 + auto on + session manual-off 아님 | `A19-ON` banner와 즉시 off | banner에서 off→`A19-MANUAL-OFF` | 계산 실패 시 기본 ONDO | gate 없음; session mode | `Simulated` |
| `FL-015` | Optional public profile | `REQ-008`, `REQ-015` | `프로필에 표시` | Account | 선택한 From/Lives in/Languages만 공개 | 변경 없음 | 저장 오류·재시도 | gate 없음 | `Implemented` |
| `FL-016` | Evidence / merchant trait | `REQ-004`, `REQ-014` | `가기 전 확인`, offer eligibility 조회 | venue fixture | 분리된 OpenDID/EAS adapter가 canonical envelope로 정규화한 fact 표시 | sheet 닫기 | stale/unknown/error를 명시 | gate 없음 | `Contract-only`; 실제 EAS `Deferred` |
| `FL-017` | Payment KYC | `REQ-005`, `REQ-011` | mock checkout `결제 계속` | Account | `PKY-VERIFIED` 후 동일 checkout 재개 | 결제 전 장소 복귀 | 실패·만료·재시도, 결제 없음 | `START_CHECKOUT` | `Simulated` |
| `FL-018` | Labs wallet / bridge | `REQ-004`~`REQ-006`, `REQ-014`, `REQ-016` | Labs의 `지갑 연결`, `Quote`, `Bridge simulation` | Labs 동의, fixture account | simulated 자산·quote·source/destination phase·receipt 표시 | 자산 변화 없이 Labs | 실패·timeout·retry, 자산 불변 | badge gate만 `MINT_BADGE` | `SIMULATED`; `Target network: Sui Testnet · Simulated`; AMM `Deferred` |

### 2.1 Canonical scenario mapping

| Scenario ID | Primary Flow | 경계 |
|---|---|---|
| `SCN-001-GUEST-DISCOVER` | `FL-001` | 지도 성공·tile 실패 fallback; 저장은 제외 |
| `SCN-002-ACCOUNT-RETURN` | `FL-010` → `FL-011` | one-shot returnTo success·cancel·failure·duplicate callback |
| `SCN-003-TOURIST-AFTER19` | `FL-002`, `FL-013`, `FL-014` | Person/Age 분리, 4 guard, manual-off |
| `SCN-004-TABLE-CHAT` | `FL-003` | availability·membership·failure·chat access 분리, nonmember lock, organizer cancel·closed/expired·policy failure, 신고 confirmation·나가기 복귀 |
| `SCN-005-CHECKOUT-LABS` | `FL-004` | KRW 표시 가격·OOKRW read-only settlement hypothesis; stamp 불변 |
| `SCN-006-STAMP-MILESTONE` | `FL-004` | 별도 unique visit evidence 뒤에만 9→10 |
| `SCN-007-KOREAN-CX` | `FL-005` | 성공·취소·실패·만료 |
| `SCN-008-RESIDENCE-SUPPORTED` | `FL-006` | 지원 fixture 성공 |
| `SCN-009-RESIDENCE-UNAVAILABLE` | `FL-006` | 미지원 branch·중립 대체 경로 |
| `SCN-010-LABS-BRIDGE` | `FL-018` | all Labs fixtures simulated; source/destination finality 분리 |
| `SCN-011-ONBOARD-SHORT` | `FL-007` | success·skip·failure 모두 Guest map, KYC 없음 |
| `SCN-012-ONBOARD-KOREAN` | `FL-008` | success·skip·preference/선택 Account failure 모두 map; CX 미호출 |
| `SCN-013-ONBOARD-RESIDENT` | `FL-009` | success·skip·preference/선택 Account failure 모두 map; Residence Card 미호출 |
| `SCN-014-LOCAL-SIGNAL` | `FL-012` | local signal photo와 chat 분리, Visit·Contribution만 변화 |
| `SCN-015-PAYMENT-KYC` | `FL-017` | Age와 독립, 동일 checkout one-shot 복귀 |

## 3. Core flow 상세

### FL-001 · Guest Discover

```text
앱 열기
→ 3장 이하의 최소 가이드 또는 Skip
→ 전국 overview
→ 서울 선택
→ ONDO heat legend 확인
→ 식음료 검색·필터·지도/목록 전환
→ 장소 sheet
→ ONDO 근거 + 가기 전 확인
→ 외부 길찾기
```

- Guest 상태에서 auth modal이 선제 노출되면 실패다.
- 전국 overview는 지역의 `Explore/Growing` 상태를 보여줄 수 있지만 서울·부산 외 가짜 숫자를 표시하지 않는다.
- `hot`은 현재 기온·안전도·품질 점수가 아니라 최근 로컬 식음료 신호임을 legend와 상세에서 설명한다.
- 검색·필터는 보이는 결과를 실제로 바꾼다. 필터가 결과에 적용되지 않으면 disabled 또는 `준비 중`으로 처리한다.
- 지도 실패 시 목록은 그대로 탐색 가능하고, 선택 장소·검색·필터는 보존된다.
- 외부 길찾기는 새 context에서 열며 돌아오면 같은 장소 sheet가 유지된다.
- 이 flow는 발견·상세·길찾기까지만 책임진다. `저장`은 `FL-010` Account gate와 `FL-011` Save/My Korea 계약으로 분리한다.

### FL-002 · Age proof → exact After19 venue

```text
잠긴 야간 프리뷰/After 19 CTA
→ 19+가 필요한 이유·공유하지 않는 정보 안내
→ AGE proof 결과
→ AGE-VERIFIED
→ 원래 선택한 venueId의 확장 장소 상세와 After 19 ON
```

- Person/Passport proof를 이 flow의 선행 조건으로 강제하지 않는다.
- Age proof는 Account, Person, Payment KYC와 독립이다.
- 성공 시 전체 여권·생년월일이 아니라 `19+ confirmed`, issuer type, expiry의 최소 결과만 앱이 소비한다.
- 취소·실패·만료 시 일반 식음료 탐색과 같은 장소의 공식 정보는 계속 가능하다.
- `returnTo` venue가 사라졌다면 같은 지역의 일반 장소 목록으로 안전하게 돌아간다.

### FL-003 · Table → Image Chat → Feedback

```text
장소 상세의 Table 카드
→ 좌석·시간·언어·가격·주류 여부 확인
→ Account gate
→ 조건부 Person/19+ gate
→ 참가 확정
→ group chat unlock
→ 텍스트/이미지 pending → sent 또는 failed → retry
→ 현장 check-in
→ 종료·상호 feedback
→ Visit/Meetup/Contribution의 해당 축만 변화
```

- 외국인↔한국인을 강제 매칭하지 않는다. Table은 장소·시간·관심 기반 공개 모임이다.
- 참가자의 신분증 국적은 노출하지 않는다. self-declared 프로필만 표시한다.
- `TableAvailability`, `TableMembership`, `TableFailureReason`, `ChatAccess`는 별도 상태 축이다. 참가 가능 여부가 곧 membership이나 chat 권한을 뜻하지 않는다.
- `TMB-CONFIRMED`, `TMB-CHECKED-IN`, `TMB-COMPLETED`가 아닌 사용자는 `CHA-LOCKED`이며 chat route 직접 접근을 Table 상세로 돌린다.
- 주류 Table만 `AGE-VERIFIED`를 요구한다. 일반 식사는 연령 gate가 없다.
- 이미지에는 선택·미리보기·교체·삭제·전송·실패·재시도가 있다. 실패 이미지는 sent처럼 보이면 안 된다.
- 첫 현장 미션 `FL-012`는 `PER-*`를 바꾸지 않으며 Visit/Contribution만 바꿀 수 있다. Meetup은 `FL-003`에서 참가 확정 뒤 실제 체크인·완료·피드백 evidence가 있을 때만 바뀐다.
- 신고·나가기·차단 CTA는 최소한 confirmation과 안전한 종료 상태를 가진다.

### FL-004 · Checkout/Labs → Stamp

```text
식음료 checkout
→ Account gate
→ Payment KYC gate
→ KRW 표시 가격 + OOKRW test token read-only settlement hypothesis
→ 사용자 확인
→ processing
→ simulated success receipt 또는 실패/취소
→ 방문 proof 확정 시 stamp 9 → 10
→ My Korea milestone
→ 선택 시 Labs의 opt-in badge mint simulation
```

- Hero checkout은 한 장소·한 금액의 단일 mock flow로 범위를 고정한다. OOKRW는 사용자가 선택하는 결제수단이 아니라 읽기 전용 settlement hypothesis row다.
- `Payment KYC`는 Person·19+를 자동으로 부여하지 않는다.
- 실패·취소 시 잔고·stamp·reputation은 변하지 않는다.
- 결제 성공만으로 방문 stamp를 올리지 않는다. 현장 visit proof fixture가 별도로 성공해야 한다.
- 10번째 stamp 전, 사용자의 opt-in 전, Labs 밖에서는 mint가 불가능하다.
- Labs wallet·bridge·mint fixture는 모두 `truth=SIMULATED`이며 `Target network: Sui Testnet · Simulated`를 표시한다. 검증 가능한 실제 공개 `txRef`가 생길 때만 해당 실행을 `truth=TESTNET`으로 기록한다.

### FL-005 · Korean CX

```text
한국 로컬 persona
→ Account 생성 또는 로그인
→ Person이 필요한 CTA
→ OmniOne CX Mobile ID simulation
→ success / cancel / failure / expired
→ success일 때만 PER-VERIFIED
→ 원 CTA 재개
```

- onboarding에서 CX는 선택이며 지도 home 도착을 막지 않는다.
- 취소·실패·만료 시 Account는 유지하며 Guest/Account 탐색 기능을 사용할 수 있다.
- `PER-VERIFIED`는 곧 `trusted local` 또는 `19+`를 뜻하지 않는다.

### FL-006 · Residence Card

```text
한국 거주 persona
→ Account 생성 또는 로그인
→ Person이 필요한 CTA
→ Mobile Residence Card adapter simulation
→ supported success / unsupported / failure / cancel
→ 원 CTA 또는 대체 Passport provider 안내
```

- UI는 실지원이 확정되지 않은 credential을 지원한다고 주장하지 않는다.
- `unsupported`는 사용자의 계정과 탐색을 막지 않으며, 지원 확인이 필요한 사실과 대체 경로를 구분한다.
- 성공했을 때도 국적을 자동 공개하지 않는다.

## 4. Onboarding 계약

세 persona 모두 성공·건너뛰기·validation/provider 실패의 최종 목적지는 `SCR-MAP`이다. 온보딩은 Account·Person·19+·Payment KYC 완료 여부와 무관하게 끝난다.

| Flow | 최대 단계 | 필수 | 선택 | Success | Skip | Failure |
|---|---:|---|---|---|---|---|
| `FL-007` 단기 여행객 | 3 | 언어 | 여행 기간, 식이, 가격대, 관심 지역 | `ONB-COMPLETE + ACC-GUEST → SCR-MAP` | 기본값으로 `SCR-MAP` | validation fallback 뒤 `SCR-MAP` |
| `FL-008` 한국 로컬 | 3 | 언어 | 지역, 기여 의향, Account, CX | Guest 또는 Account `SCR-MAP` | Guest `SCR-MAP` | account/CX 실패를 설명하고 Guest `SCR-MAP` |
| `FL-009` 장기체류자 | 3 | 언어 | 거주 지역, 식이, Account, Residence Card | Guest 또는 Account `SCR-MAP` | Guest `SCR-MAP` | 미지원/실패를 설명하고 Guest `SCR-MAP` |

최소 가이드 microcopy:

- `지금 뜨는 맛을 찾아보세요 / Find what locals are into now.`
- `숫자는 기온이 아니라 최근 로컬 식음료 신호예요 / ONDO is a recent local food signal, not the weather.`
- `인증은 필요한 순간에만 / Verify only when an experience requires it.`
- `건너뛰고 지도 보기 / Skip to map`

### FL-012 · Local signal / first mission

```text
장소 상세의 방문 신호 CTA
→ Account + Person gate
→ browser-local 사진 선택·미리보기·교체·삭제
→ local signal 근거와 함께 제출
→ unique visit evidence이면 Visit 변화
→ 유용한 신호 기여이면 Contribution 변화
```

- 사진 업로드 context는 `local_signal`이다. Table chat용 `chat_image` context, `MSG-*`, `CHA-*`와 결합하지 않는다.
- 선택 사진은 전송 성공처럼 보이지 않으며 memory의 object URL만 사용한다. 실패 시 교체·삭제·재시도를 제공한다.
- 같은 `venueId + subjectRef + evidenceRef`는 idempotency key로 중복 Visit·Contribution 증가를 차단한다. `FL-012`는 stamp를 변경하지 않는다.
- 이 flow는 Meetup을 변경하지 않는다. Meetup은 `FL-003`의 Table evidence 이후에만 변경한다.

## 5. After 19 계약

자동 mode의 유일한 guard는 다음과 같다.

```text
AGE-VERIFIED
AND Asia/Seoul local time >= 19:00
AND PREF-AUTO-NIGHT-ON
AND current session is not A19-MANUAL-OFF
```

- 모두 참이면 `A19-PROMPT → A19-ON`, 상단 banner `After 19가 켜졌어요 / After 19 is on`을 노출한다.
- banner `끄기 / Turn off`는 즉시 `A19-MANUAL-OFF`로 전이한다.
- 자정·timezone 변경·credential 만료 시 재평가한다.
- 일반 심야 음식점·24시간 식당은 age proof와 무관하게 기본 ONDO에 남는다.

## 6. Evidence·receipt·bridge 경계

- OpenDID와 EAS는 각각 독립 adapter다. 둘의 결과는 동일한 canonical Evidence Envelope로 정규화하지만 한쪽을 다른 쪽의 구현·import로 표현하지 않는다. 실제 EAS 발급·조회는 9시간 `Deferred`다.
- 상점 receipt는 `merchantId`, `offerId`, 표시 가격, mock settlement, 정책 버전, redemption 결과의 사실만 표현한다. 방문·입장 허가·안전·KYC 완료를 대신 증명하지 않는다.
- bridge는 `source submitted → source confirmed → relaying → destination confirmed`를 분리한다. source confirmed만으로 destination 잔고나 success를 표시하지 않는다.
- AMM·pool·liquidity·swap은 9시간 `Deferred`다. quote fixture는 swap 실행이나 시장가격을 뜻하지 않는다.
- wallet·bridge·mint fixture의 provenance는 `truth=SIMULATED`, `fixtureId`, `sourceId`, `observedAt`을 가진다. `truth=TESTNET`은 검증 가능한 실제 공개 `txRef`가 있는 실행에만 허용한다.

## 7. Flow별 최소 검증

| 검증 묶음 | 필수 케이스 |
|---|---|
| Hero E2E | `FL-001` success+map failure, `FL-002` success/cancel/failure, `FL-003` success+image retry+direct chat denial, `FL-004` success/cancel/failure |
| Persona | `FL-005` success/cancel/expired, `FL-006` success/unsupported/failure, `FL-007`~`FL-009` skip→home |
| Gate | `FL-010` returnTo 보존, `FL-013` proof failure에도 기본 지도, `FL-017` 미완료 결제 차단 |
| Trust | `FL-012`가 Person을 변경하지 않음, `FL-015` 미선택 필드 비공개, `FL-016` stale/unknown 정직 표기 |
| Labs | `FL-018` 실패·취소 시 자산 불변, 실거래 주장 0개 |

이 표의 자동 검수 상태와 실제 구현 차이는 release 전에 as-built에 기록한다.
