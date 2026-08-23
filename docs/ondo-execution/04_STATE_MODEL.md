# ONDO 9시간 State Model

상태: `Locked execution contract · 2026-08-19`
범위: [9시간 PRD](./01_PRD_9H.md), [결정 원장](./02_DECISION_LEDGER.md), [Flow Catalog](./03_FLOW_CATALOG.md)

이 문서는 하나의 `verified` boolean으로 계정·신원·연령·결제를 합치지 않기 위한 정규 상태 계약이다. fixture는 외부 응답을 대신하지만 전이·guard·실패·persistence는 실제 프론트처럼 동작해야 한다.

---

## 0. ID와 namespace 규칙

| 대상 | 형식 | 예시 | 규칙 |
|---|---|---|---|
| 요구사항 | `REQ-NNN` | `REQ-003` | `REQ-001`~`REQ-019` |
| Flow | `FL-NNN` | `FL-006` | [Flow Catalog](./03_FLOW_CATALOG.md#2-전체-flow-matrix)의 세 자리 ID |
| State | `[DOMAIN]-[STATE]` | `PER-VERIFIED` | 아래 정규 domain만 사용; 축약·동의어 금지 |
| Fixture | `FX-[DOMAIN]-[SCENARIO]` | `FX-AGE-SUCCESS` | 동일 입력에 동일 결과를 주는 결정적 test data |
| Entity fixture | `FX-[ENTITY]-[NAME]` | `FX-VENUE-SEOUL-001` | 공개 entity ID; 민감 데이터 포함 금지 |
| 복귀 토큰 | `RT-[RETURN_TO_CTA]-<epoch-ms>` | `RT-OPEN_AFTER19-1787133600000` | [Flow Catalog의 v3 allowlist](./03_FLOW_CATALOG.md#0-id와-표기-규칙)만 직렬화 |

정규 domain:

```text
ONB onboarding       ACC account          PER person proof
AGE age proof        PKY payment KYC       PREF preferences
MAP discovery        SAV saved venue       A19 After 19
TAV table availability
TMB table membership TFR table failure     CHA chat access
MSG chat message     UPL upload            EVD evidence
TRT merchant trait   REP reputation        STM stamp
NFT commemorative    WAL Labs wallet       BRG Labs bridge
BRP bridge phase     PAY mock payment      PUB public profile
AST asset view
```

Persona fixture `PER-TOURIST-SHORT`의 `PER`는 사용자 여정 표식일 뿐 `PER-*` person-proof domain과 섞어 저장하지 않는다. 구현에서는 `personaId`와 `personStatus`를 별도 필드로 둔다.

## 1. 정규 State ID

### 1.1 진입·계정·검증

| Domain | 허용 상태 | 초기값 | terminal/재평가 |
|---|---|---|---|
| Onboarding | `ONB-NEW`, `ONB-IN-PROGRESS`, `ONB-COMPLETE` | `ONB-NEW` | complete는 사용자가 재설정하기 전 유지 |
| Account | `ACC-GUEST`, `ACC-CREATING`, `ACC-ACTIVE`, `ACC-FAILED` | `ACC-GUEST` | sign-out 시 guest |
| Person | `PER-UNVERIFIED`, `PER-PENDING`, `PER-VERIFIED`, `PER-UNSUPPORTED`, `PER-FAILED`, `PER-EXPIRED` | `PER-UNVERIFIED` | expiry·issuer 상태로 재평가 |
| Age | `AGE-UNVERIFIED`, `AGE-PENDING`, `AGE-VERIFIED`, `AGE-FAILED`, `AGE-EXPIRED` | `AGE-UNVERIFIED` | expiry·정책 변경으로 재평가 |
| Payment KYC | `PKY-NOT-STARTED`, `PKY-PENDING`, `PKY-VERIFIED`, `PKY-FAILED`, `PKY-EXPIRED` | `PKY-NOT-STARTED` | checkout마다 expiry 확인 |
| Preference | `PREF-AUTO-NIGHT-ON`, `PREF-AUTO-NIGHT-OFF` | onboarding 선택 또는 off | local preference |
| Public profile | `PUB-PRIVATE`, `PUB-PARTIAL`, `PUB-EDITING`, `PUB-SAVE-FAILED` | `PUB-PRIVATE` | 각 필드의 명시 동의 필요 |

### 1.2 제품 여정

| Domain | 허용 상태 | 초기값 | 비고 |
|---|---|---|---|
| Map | `MAP-KOREA`, `MAP-SEOUL`, `MAP-BUSAN`, `MAP-GROWING`, `MAP-VENUE`, `MAP-FALLBACK` | `MAP-KOREA` 또는 보존된 공개 context | 서울 complete, 부산 seed, 나머지 growing |
| Save | `SAV-IDLE`, `SAV-SAVING`, `SAV-SAVED`, `SAV-FAILED` | venue별 `SAV-IDLE` | Account gate와 저장 실패·재시도를 분리 |
| After 19 | `A19-OFF`, `A19-PROMPT`, `A19-ON`, `A19-MANUAL-OFF` | `A19-OFF` | session manual off가 auto보다 우선 |
| Table availability | `TAV-OPEN`, `TAV-FULL`, `TAV-CLOSED`, `TAV-CANCELLED` | fixture별 | 좌석·운영 상태이며 membership과 별도 |
| Table membership | `TMB-NONE`, `TMB-REQUESTING`, `TMB-CONFIRMED`, `TMB-CHECKED-IN`, `TMB-COMPLETED`, `TMB-LEFT`, `TMB-FAILED` | `TMB-NONE` | 참가자의 여정 상태 |
| Table failure reason | `TFR-NONE`, `TFR-FULL`, `TFR-NETWORK`, `TFR-POLICY`, `TFR-CANCELLED` | `TFR-NONE` | failure 원인을 membership과 분리 |
| Chat access | `CHA-LOCKED`, `CHA-OPEN` | `CHA-LOCKED` | membership에서 파생하되 별도 guard로 검증 |
| Message | `MSG-IDLE`, `MSG-SENDING`, `MSG-SENT`, `MSG-FAILED` | `MSG-IDLE` | access와 delivery를 분리 |
| Upload | `UPL-IDLE`, `UPL-PREVIEW`, `UPL-SENDING`, `UPL-SENT`, `UPL-FAILED`, `UPL-REMOVED` | `UPL-IDLE` | local object URL은 memory only |
| Evidence | `EVD-UNKNOWN`, `EVD-LOADING`, `EVD-VALID`, `EVD-STALE`, `EVD-INVALID`, `EVD-ERROR` | `EVD-UNKNOWN` | stale은 valid처럼 표시 금지 |
| Trait | `TRT-UNKNOWN`, `TRT-ELIGIBLE`, `TRT-INELIGIBLE`, `TRT-STALE`, `TRT-ERROR` | `TRT-UNKNOWN` | 앱은 contract receipt 소비자 |
| Payment | `PAY-IDLE`, `PAY-CONFIRMING`, `PAY-PROCESSING`, `PAY-SIMULATED-SUCCESS`, `PAY-FAILED`, `PAY-CANCELLED` | `PAY-IDLE` | 결제 성공과 방문은 별도 |

### 1.3 평판·기억·Labs

| Domain | 허용 상태 | 초기값 | 비고 |
|---|---|---|---|
| Visit reputation | `REP-VISIT-NEW`, `REP-VISIT-RECENT`, `REP-VISIT-REPEAT` | fixture별 | 현장 proof만 변경 |
| Contribution | `REP-CONTRIBUTION-NEW`, `REP-CONTRIBUTION-HELPFUL`, `REP-CONTRIBUTION-ESTABLISHED` | fixture별 | 정보 유용성 기반 |
| Meetup | `REP-MEETUP-NEW`, `REP-MEETUP-RELIABLE`, `REP-MEETUP-ESTABLISHED` | fixture별 | 참가·약속 이행 기반 |
| Identity reference | `REP-IDENTITY-UNVERIFIED`, `REP-IDENTITY-VERIFIED` | `PER-*`에서 읽기 전용 파생 | 종합 점수 산입 금지 |
| Stamp | `STM-N00`~`STM-N10` | fixture별 | `N` 뒤 두 자리 방문 수; 이번 milestone은 9→10 |
| NFT | `NFT-LOCKED`, `NFT-ELIGIBLE`, `NFT-OPTED-IN`, `NFT-MINTING`, `NFT-MINTED`, `NFT-FAILED` | `NFT-LOCKED` | Labs opt-in commemorative simulation |
| Wallet | `WAL-DISCONNECTED`, `WAL-CONNECTING`, `WAL-READY`, `WAL-FAILED` | `WAL-DISCONNECTED` | optional Sui signer fixture |
| Bridge | `BRG-IDLE`, `BRG-QUOTED`, `BRG-CONFIRMING`, `BRG-PENDING`, `BRG-SIMULATED-SUCCESS`, `BRG-FAILED`, `BRG-CANCELLED` | `BRG-IDLE` | real asset mutation 없음 |
| Bridge phase | `BRP-NONE`, `BRP-SOURCE-SUBMITTED`, `BRP-SOURCE-CONFIRMED`, `BRP-RELAYING`, `BRP-DESTINATION-CONFIRMED` | `BRP-NONE` | source confirmed는 final success 아님 |
| Asset view | `AST-READY`, `AST-STALE`, `AST-ERROR` | fixture별 | chain별 representation·available/reserved/pending을 분리 |

`REP-*` 네 축은 동시에 존재한다. 하나의 `reputationScore`, `trustScore`, `localScore`로 합치지 않는다.

## 2. 정규 상태 shape

```ts
type ExecutionTruth =
  | "LIVE"
  | "SANDBOX"
  | "TESTNET"
  | "SIMULATED"
  | "CONTRACT_ONLY"
  | "NOT_CONFIGURED";

type SourceKind =
  | "editorial"
  | "partner"
  | "community"
  | "provider"
  | "chain"
  | "local_fixture";

type Provenance = {
  truth: ExecutionTruth;
  sourceId: string;
  sourceKind: SourceKind;
  observedAt?: string;
  fetchedAt: string;
  expiresAt?: string;
  fixtureId?: `FX-${string}`;
  evidenceRef?: string;
  txRef?: string;
  isSimulation: boolean;
};

type ReturnToState = {
  tokenId: `RT-${ReturnToCta}-${number}`;
  cta:
    | "SAVE_VENUE"
    | "JOIN_TABLE"
    | "OPEN_CHAT"
    | "SUBMIT_LOCAL_SIGNAL"
    | "START_CHECKOUT"
    | "OPEN_AFTER19"
    | "MINT_BADGE";
  gateQueue: ("account" | "person" | "age" | "payment_kyc")[];
  activeGate: "account" | "person" | "age" | "payment_kyc";
  venueId?: string;
  tableId?: string;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
};

type CanonicalDomainState = {
  scenario: Provenance;
  personaId: "PER-TOURIST-SHORT" | "PER-LOCAL-KR" | "PER-RESIDENT-LONG" | null;
  onboarding: "ONB-NEW" | "ONB-IN-PROGRESS" | "ONB-COMPLETE";
  account: "ACC-GUEST" | "ACC-CREATING" | "ACC-ACTIVE" | "ACC-FAILED";
  gate?: ReturnToState;
  person: { status: PersonState; adapter: "cx" | "residence" | "passport" | null; expiresAt?: string; provenance: Provenance };
  age: { status: AgeState; expiresAt?: string; provenance: Provenance };
  paymentKyc: { status: PaymentKycState; expiresAt?: string; provenance: Provenance };
  preferences: { autoNight: "PREF-AUTO-NIGHT-ON" | "PREF-AUTO-NIGHT-OFF"; language: "ko" | "en"; diet: string[]; budget?: string };
  publicProfile: {
    state: PublicProfileState;
    from?: { value: string; consent: boolean };
    livesIn?: { value: string; consent: boolean };
    languages?: { value: string[]; consent: boolean };
  };
  discovery: { mapState: MapState; city?: string; neighborhood?: string; venueId?: string; filters: string[]; provenance: Provenance };
  savedByVenueId: Record<string, { status: SaveState; provenance: Provenance }>;
  after19: After19State;
  tableById: Record<string, {
    availability: TableAvailabilityState;
    membership: TableMembershipState;
    failureReason: TableFailureReasonState;
    chatAccess: ChatAccessState;
    provenance: Provenance;
  }>;
  messageById: Record<string, { status: MessageState; tableId: string; provenance: Provenance }>;
  uploadById: Record<string, { status: UploadState; context: "local_signal" | "chat_image"; provenance: Provenance }>;
  evidenceById: Record<string, {
    status: EvidenceState;
    envelopeId?: string;
    adapter: "opendid" | "eas" | "fixture";
    schemaRef?: string;
    issuerRef?: string;
    subjectRef?: string;
    expiresAt?: string;
    provenance: Provenance;
  }>;
  traitById: Record<string, {
    status: TraitState;
    receiptId?: string;
    merchantId?: string;
    offerId?: string;
    policyVersion?: string;
    redemptionResult?: "eligible" | "ineligible" | "unknown";
    provenance: Provenance;
  }>;
  payment: { status: PaymentState; displayPriceKrw?: number; settlementToken?: "OOKRW"; receiptId?: string; provenance: Provenance };
  reputation: {
    visit: { status: VisitState; provenance: Provenance };
    contribution: { status: ContributionState; provenance: Provenance };
    meetup: { status: MeetupState; provenance: Provenance };
  };
  stamps: { status: StampState; acceptedEvidenceIds: string[]; provenance: Provenance };
  assetsById: Record<string, {
    status: AssetState;
    symbol: "USDC" | "USDT" | "OOKRW";
    chain: string;
    representation: string;
    available: string;
    reserved: string;
    pending: string;
    estimatedUsd?: string;
    provenance: Provenance;
  }>;
  labs: {
    wallet: { status: WalletState; targetNetwork: "Sui Testnet"; provenance: Provenance };
    bridge: { status: BridgeState; phase: BridgePhaseState; receiptId?: string; provenance: Provenance };
    nft: { status: NftState; provenance: Provenance };
  };
};
```

`CanonicalDomainState`는 domain 전체의 개념 모델이며 그대로 browser storage에 직렬화하는 DTO가 아니다. 실제 v3 저장 필드 allowlist는 [6절](#6-persistence와-개인정보-경계)만 source of truth로 사용한다. 허용되는 CTA/token prefix는 `SAVE_VENUE` / `RT-SAVE_VENUE-<epoch-ms>`, `JOIN_TABLE` / `RT-JOIN_TABLE-<epoch-ms>`, `OPEN_CHAT` / `RT-OPEN_CHAT-<epoch-ms>`, `SUBMIT_LOCAL_SIGNAL` / `RT-SUBMIT_LOCAL_SIGNAL-<epoch-ms>`, `START_CHECKOUT` / `RT-START_CHECKOUT-<epoch-ms>`, `OPEN_AFTER19` / `RT-OPEN_AFTER19-<epoch-ms>`, `MINT_BADGE` / `RT-MINT_BADGE-<epoch-ms>`뿐이다.

외부 credential 원문, 여권 번호, 외국인등록번호, 생년월일, 신분증 이미지, raw provider response는 이 shape에 저장하지 않는다. demo에서는 상태·adapter type·만료 시각·비민감 receipt/evidence 참조만 가진다. 모든 fixture provenance는 `fixtureId`를 필수로 가진다. wallet·bridge·mint fixture는 `truth="SIMULATED"`이며 `truth="TESTNET"`은 검증 가능한 실제 공개 `txRef`가 있을 때만 허용한다. contract-only와 provider 미구성은 각각 `CONTRACT_ONLY`, `NOT_CONFIGURED`로 구분한다. wallet·bridge·mint fixture UI의 정규 표기는 `Target network: Sui Testnet · Simulated`다.

`assetsById`는 USDC/USDT를 chain별 별도 representation으로 보존한다. 통합 USD는 읽기 전용 추정치일 뿐 합쳐진 실제 자산이 아니다. `OOKRW`는 9시간 동안 test token mock settlement 표현이며 KRW 법정화폐 잔고·예금·상환청구권으로 표시하지 않는다.

## 3. 파생 guard

| Capability | Boolean contract | 실패 시 진입 Flow |
|---|---|---|
| Browse | 항상 `true` | 없음 |
| Save | `account === "ACC-ACTIVE"` | `FL-010` |
| Contribute local signal | `account === "ACC-ACTIVE" && person.status === "PER-VERIFIED"` | `FL-010` 후 persona별 `FL-005`, `FL-006` 또는 passport fixture |
| Host Table | `account === "ACC-ACTIVE" && person.status === "PER-VERIFIED"` | 위와 같음 |
| Join ordinary Table | `account === "ACC-ACTIVE" && availability === "TAV-OPEN"`; fixture 정책이 Person을 요구하면 추가 | `FL-010`, 조건부 Person |
| Join alcohol Table | ordinary 조건 + `age.status === "AGE-VERIFIED"` + 미만료 | `FL-013` |
| Enter After 19 manually | `age.status === "AGE-VERIFIED"` + 미만료 | `FL-013` |
| Auto After 19 | `age.status === "AGE-VERIFIED" && age.expiresAt > now && KST>=19:00 && preferences.autoNight === "PREF-AUTO-NIGHT-ON" && after19 !== "A19-MANUAL-OFF"` | 조건 미충족이면 `A19-OFF` |
| Open chat | `chatAccess === "CHA-OPEN"` 그리고 membership이 `{ "TMB-CONFIRMED", "TMB-CHECKED-IN", "TMB-COMPLETED" }` 중 하나 | `FL-003`의 Table 상세 |
| Checkout | `account === "ACC-ACTIVE" && paymentKyc.status === "PKY-VERIFIED"` | `FL-010` 후 `FL-017` |
| Increment stamp | `SCN-006-STAMP-MILESTONE`의 unique valid visit evidence + `evidenceId`가 `acceptedEvidenceIds`에 없음; payment·Local Signal success는 불충분 | `FL-004`의 visit-independent milestone branch |
| Mint badge | `stamps.status === "STM-N10" && labs.nft.status === "NFT-OPTED-IN" && labs.wallet.status === "WAL-READY"` | `FL-004`, `FL-018` |

국적, persona, Account, Payment KYC만으로 로컬 전문성·Visit·Meetup·Contribution을 부여하지 않는다.
Age와 Payment KYC는 독립 상태 축이다. 한 축의 시작·성공·실패·만료는 다른 축을 변경하지 않는다.

## 4. 전이 계약

### 4.1 Onboarding·Account

| Event | From | Guard | To | Side effect | Persistence | Fixture |
|---|---|---|---|---|---|---|
| first open | 없음 | no stored v2 completion | `ONB-NEW` | guide 표시 | memory | `FX-ONB-FIRST` |
| choose persona | `ONB-NEW` | 유효 persona | `ONB-IN-PROGRESS` | personaId와 기본값 준비 | memory | `FX-ONB-SHORT`, `FX-ONB-KOREAN`, `FX-ONB-RESIDENT` |
| finish | `ONB-IN-PROGRESS` | 유효 입력 또는 안전한 기본값 | `ONB-COMPLETE` | verification 없이 `SCR-MAP` 이동 | `ondo.session.v3` | persona fixture |
| skip | `ONB-NEW` 또는 `ONB-IN-PROGRESS` | 없음 | `ONB-COMPLETE` | 기본값으로 Guest `SCR-MAP` 이동 | `ondo.session.v3` | persona fixture |
| onboarding failure | `ONB-IN-PROGRESS` | validation/account/provider fixture 실패 | `ONB-COMPLETE` | 실패 이유 안내·기본값 적용·Guest `SCR-MAP`; KYC 미요구 | `ondo.session.v3` | persona fixture |
| press gated CTA | `ACC-GUEST` | allowlist 검증된 미소비 `returnTo` | `ACC-CREATING` | one-shot RT 생성·gate 열기 | RT는 sessionStorage | `FX-ACC-START` |
| account success | `ACC-CREATING` | fixture success + RT 미소비 | `ACC-ACTIVE` | 다음 Person·Age·Payment KYC guard가 있으면 같은 RT의 `activeGate`만 갱신; 없으면 원 CTA mutation 직전 1회 소비 | demo session | `FX-ACC-SUCCESS` |
| account cancel | `ACC-CREATING` | user cancel | `ACC-GUEST` | 원 화면 복귀, mutation 없음 | RT 삭제 | `FX-ACC-CANCEL` |
| account failure | `ACC-CREATING` | fixture failure | `ACC-FAILED` | retry/Guest 계속 | memory | `FX-ACC-FAIL` |
| retry | `ACC-FAILED` | user retry | `ACC-CREATING` | 동일 RT 유지 | sessionStorage | `FX-ACC-SUCCESS` |
| duplicate/invalid RT | any Account | consumed·expired·변조·allowlist 밖 | 현재 account 유지 | `/ondo` fallback, mutation 없음 | RT 삭제 | `FX-ACC-FAIL` |
| save venue | `SAV-IDLE` 또는 `SAV-FAILED` | `ACC-ACTIVE`, venue exists | `SAV-SAVING` | 중복 입력 잠금 | memory | `FX-SAVE-PENDING` |
| save success | `SAV-SAVING` | fixture success | `SAV-SAVED` | My Korea에 같은 venue 1회 반영 | demo session | `FX-SAVE-SUCCESS` |
| save failure | `SAV-SAVING` | fixture failure | `SAV-FAILED` | 기존 저장값 불변, retry 제공 | memory | `FX-SAVE-FAIL` |
| retry save | `SAV-FAILED` | user retry | `SAV-SAVING` | 같은 venue와 미소비 RT 유지 | memory | `FX-SAVE-PENDING` |

### 4.2 Person·Age·Payment KYC

| Event | From | Guard | To | Side effect | Persistence | Fixture |
|---|---|---|---|---|---|---|
| start CX | `{ "PER-UNVERIFIED", "PER-FAILED", "PER-EXPIRED" }` | `ACC-ACTIVE`, Korean path | `PER-PENDING` | adapter=`cx`; Age·Payment KYC 불변 | memory | `FX-PER-CX-PENDING` |
| CX success | `PER-PENDING` | valid fixture receipt | `PER-VERIFIED` | expiry 저장; 다음 guard가 있으면 같은 RT 유지, 모두 충족되면 원 CTA mutation 직전 소비; Age·Payment KYC 불변 | demo session | `FX-PER-CX-SUCCESS` |
| CX cancel/fail/expire | `{ "PER-PENDING", "PER-VERIFIED" }` | scenario | `{ "PER-UNVERIFIED", "PER-FAILED", "PER-EXPIRED" }` | gated action 미실행; Age·Payment KYC 불변 | demo session | `FX-PER-CX-CANCEL`, `FX-PER-CX-FAIL`, `FX-PER-CX-EXPIRED` |
| start residence | `{ "PER-UNVERIFIED", "PER-FAILED" }` | `ACC-ACTIVE`, resident path | `PER-PENDING` | adapter=`residence`; Age·Payment KYC 불변 | memory | `FX-PER-RESIDENCE-PENDING` |
| residence success | `PER-PENDING` | supported fixture | `PER-VERIFIED` | 같은 최종 RT를 유지해 다음 guard 또는 원 CTA 재개, nationality private | demo session | `FX-PER-RESIDENCE-SUCCESS` |
| residence unsupported | `PER-PENDING` | unsupported fixture | `PER-UNSUPPORTED` | 대체 passport 경로 제안 | demo session | `FX-PER-RESIDENCE-UNSUPPORTED` |
| start passport | `{ "PER-UNVERIFIED", "PER-UNSUPPORTED", "PER-FAILED" }` | explicit consent | `PER-PENDING` | adapter=`passport`; Age·Payment KYC 불변 | memory | `FX-PER-PASSPORT-PENDING` |
| passport success/fail | `PER-PENDING` | scenario | `{ "PER-VERIFIED", "PER-FAILED" }` | success만 같은 최종 RT로 다음 guard 또는 원 CTA 재개; Age·Payment KYC 불변 | demo session | `FX-PER-PASSPORT-SUCCESS`, `FX-PER-PASSPORT-FAIL` |
| start age proof | `{ "AGE-UNVERIFIED", "AGE-FAILED", "AGE-EXPIRED" }` | reason shown | `AGE-PENDING` | RT 보존; Payment KYC 불변 | memory | `FX-AGE-PENDING` |
| age success/fail | `AGE-PENDING` | scenario | `{ "AGE-VERIFIED", "AGE-FAILED" }` | success만 같은 최종 RT의 After19·주류 CTA를 재개하고 mutation 직전 소비; Payment KYC 불변 | demo session | `FX-AGE-SUCCESS`, `FX-AGE-FAIL` |
| age expiry | `AGE-VERIFIED` | now ≥ expiresAt | `AGE-EXPIRED` | `A19-OFF` 강제 | demo session | `FX-AGE-EXPIRED` |
| start payment KYC | `{ "PKY-NOT-STARTED", "PKY-FAILED", "PKY-EXPIRED" }` | `ACC-ACTIVE`, checkout RT | `PKY-PENDING` | checkout mutation 없음; Age 불변 | memory | `FX-PKY-PENDING` |
| payment KYC success/fail | `PKY-PENDING` | scenario | `{ "PKY-VERIFIED", "PKY-FAILED" }` | success만 같은 `START_CHECKOUT` envelope를 재개하고 결제 mutation 직전 소비; Age 불변 | demo session | `FX-PKY-SUCCESS`, `FX-PKY-FAIL` |

### 4.3 Discovery·After 19

| Event | From | Guard | To | Side effect | Persistence | Fixture |
|---|---|---|---|---|---|---|
| choose Korea | `{ "MAP-KOREA", "MAP-SEOUL", "MAP-BUSAN", "MAP-GROWING", "MAP-VENUE", "MAP-FALLBACK" }` | 없음 | `MAP-KOREA` | venue sheet 닫음 | URL | `FX-MAP-KOREA` |
| choose Seoul | `{ "MAP-KOREA", "MAP-GROWING", "MAP-BUSAN" }` | 서울 fixture 존재 | `MAP-SEOUL` | heat/list 로드 | URL | `FX-MAP-SEOUL-RECENT` |
| choose Busan | `{ "MAP-KOREA", "MAP-GROWING", "MAP-SEOUL" }` | seed fixture 존재 | `MAP-BUSAN` | seed 라벨 | URL | `FX-MAP-BUSAN-SEED` |
| choose growing region | `MAP-KOREA` | region not Seoul/Busan | `MAP-GROWING` | 가짜 ONDO 없이 overview | URL | `FX-MAP-GROWING` |
| select venue | `{ "MAP-SEOUL", "MAP-BUSAN", "MAP-FALLBACK" }` | venue exists | `MAP-VENUE` | sheet·facts 표시 | URL | `FX-VENUE-SEOUL-001` |
| map tile failure | `{ "MAP-KOREA", "MAP-SEOUL", "MAP-BUSAN", "MAP-GROWING", "MAP-VENUE" }` | map failure | `MAP-FALLBACK` | 목록·검색·선택 유지 | URL context 유지 | `FX-MAP-TILE-FAIL` |
| location denied | 현재 공개 Map 상태 | browser permission denied | 현재 공개 Map 상태 유지 | 현재 위치 없이 같은 검색·목록 사용, 설정 안내 | URL context 유지 | `FX-MAP-LOCATION-DENIED` |
| auto guard true | `A19-OFF` | 4중 guard | `A19-PROMPT` | banner 표시 | memory | `FX-A19-AUTO-READY` |
| accept/auto prompt | `A19-PROMPT` | guard still true | `A19-ON` | eligible layer 표시 | memory | `FX-A19-AUTO-ON` |
| turn off | `{ "A19-PROMPT", "A19-ON" }` | user action | `A19-MANUAL-OFF` | 기본 layer 복구 | sessionStorage | `FX-A19-MANUAL-OFF` |
| new session/reset | `A19-MANUAL-OFF` | session boundary | `A19-OFF` | guard 재평가 가능 | session key 삭제 | `FX-A19-RESET` |

### 4.4 Evidence·상점 trait·공개 프로필

| Event | From | Guard | To | Side effect | Persistence | Fixture |
|---|---|---|---|---|---|---|
| open venue facts | `EVD-UNKNOWN` | venueId exists | `EVD-LOADING` | OpenDID 또는 EAS adapter를 각각 호출하고 canonical Evidence Envelope로 정규화; 실제 EAS 구현은 `Deferred` | memory | `FX-EVD-VALID` |
| evidence valid | `EVD-LOADING` | schema·issuer·expiry valid | `EVD-VALID` | 근거 시각·신호 수 표시 | public cache only | `FX-EVD-VALID` |
| evidence stale | `{ "EVD-LOADING", "EVD-VALID" }` | now ≥ freshness boundary | `EVD-STALE` | 오래됨·재확인 표시 | public cache only | `FX-EVD-STALE` |
| evidence failure | `EVD-LOADING` | invalid/error | `{ "EVD-INVALID", "EVD-ERROR" }` | ONDO 신뢰 표현 축소 | memory | `FX-EVD-ERROR` |
| evaluate trait | `TRT-UNKNOWN` | venue/offer input valid | `{ "TRT-ELIGIBLE", "TRT-INELIGIBLE", "TRT-STALE", "TRT-ERROR" }` | receipt는 merchant·offer·정책·redemption fact만 갱신; 방문·입장·안전은 증명하지 않음 | public cache only | `FX-TRT-ELIGIBLE`, `FX-TRT-INELIGIBLE`, `FX-TRT-STALE`, `FX-TRT-ERROR` |
| edit public profile | `{ "PUB-PRIVATE", "PUB-PARTIAL", "PUB-SAVE-FAILED" }` | `ACC-ACTIVE` | `PUB-EDITING` | 기존 consent 복사 | memory | `FX-PUB-EDIT` |
| save selected fields | `PUB-EDITING` | field별 explicit consent | `PUB-PARTIAL` 또는 `PUB-PRIVATE` | 선택 필드만 저장 | demo session | `FX-PUB-SAVE-SUCCESS` |
| profile save failure | `PUB-EDITING` | fixture error | `PUB-SAVE-FAILED` | 기존 공개값 유지 | memory | `FX-PUB-SAVE-FAIL` |

### 4.5 Table·upload·chat·feedback

| Event | From | Guard | To | Side effect | Persistence | Fixture |
|---|---|---|---|---|---|---|
| join | `TMB-NONE` | `TAV-OPEN`, required gates pass | `TMB-REQUESTING` | `TFR-NONE`, `CHA-LOCKED`, 중복 클릭 잠금 | memory | `FX-TBL-SEOUL-DINNER` |
| join success | `TMB-REQUESTING` | `TAV-OPEN`, seat reserved | `TMB-CONFIRMED` | `TFR-NONE`, `CHA-OPEN`; message는 `MSG-IDLE` | demo session | `FX-TBL-JOIN-SUCCESS` |
| join full | `TMB-REQUESTING` | capacity fixture | `TMB-FAILED` | `TAV-FULL`, `TFR-FULL`, `CHA-LOCKED` | memory | `FX-TBL-JOIN-FAIL` |
| join network fail | `TMB-REQUESTING` | network fixture | `TMB-FAILED` | availability 유지, `TFR-NETWORK`, `CHA-LOCKED` | memory | `FX-TBL-JOIN-FAIL` |
| retry join | `TMB-FAILED` | gates valid, `TAV-OPEN` | `TMB-REQUESTING` | `TFR-NONE`, 새 요청 | memory | `FX-TBL-JOIN-SUCCESS` |
| leave/cancel | `{ "TMB-CONFIRMED", "TMB-REQUESTING" }` | confirmation | `TMB-LEFT` | `TFR-CANCELLED`, `CHA-LOCKED` | demo session | `FX-TBL-CANCEL` |
| organizer cancel | `{ "TAV-OPEN", "TAV-FULL" }` | organizer fixture | `TAV-CANCELLED` | active membership은 `TMB-LEFT`, `TFR-CANCELLED`, `CHA-LOCKED`; 대체 Table 안내 | demo session | `FX-TBL-CANCEL` |
| table closed/expired | `TAV-OPEN` | endAt 경과 | `TAV-CLOSED` | 새 join 차단; nonmember는 `TMB-NONE`, `CHA-LOCKED` | demo session | `FX-TBL-CANCEL` |
| join policy failure | `TMB-REQUESTING` | policy fixture | `TMB-FAILED` | `TFR-POLICY`, `CHA-LOCKED`; 조건 설명 | memory | `FX-TBL-JOIN-FAIL` |
| report participant | `{ "TMB-CONFIRMED", "TMB-CHECKED-IN", "TMB-COMPLETED" }` | confirmation + reason | membership 유지 | fixture 신고 receipt와 차단 선택; 원 Table로 안전 복귀 | demo session | `FX-TBL-COMPLETE` |
| select local-signal image | `{ "UPL-IDLE", "UPL-REMOVED", "UPL-FAILED" }` | context=`local_signal`, type·size 허용 | `UPL-PREVIEW` | local object URL; `MSG-*` 불변 | memory only | `FX-UPL-PHOTO-PREVIEW` |
| submit local signal | `UPL-PREVIEW` | `FL-012` gates와 현장 조건 | `UPL-SENDING` | local signal pending; chat message 생성 금지 | memory | `FX-UPL-PHOTO-PREVIEW` |
| local signal success/fail | `UPL-SENDING` | scenario | `{ "UPL-SENT", "UPL-FAILED" }` | unique evidence일 때만 Visit/Contribution 해당 축 변화; Meetup 불변 | demo session metadata only | `FX-UPL-LOCAL-SIGNAL-SUCCESS`, `FX-UPL-LOCAL-SIGNAL-FAIL` |
| remove image | `{ "UPL-PREVIEW", "UPL-FAILED" }` | user action | `UPL-REMOVED` | object URL revoke | memory only | `FX-UPL-PHOTO-REMOVED` |
| send text | `{ "MSG-IDLE", "MSG-FAILED" }` | nonempty, `CHA-OPEN`, membership allowed | `MSG-SENDING` | pending bubble | memory | `FX-MSG-TEXT-PENDING` |
| text result | `MSG-SENDING` | scenario | `{ "MSG-SENT", "MSG-FAILED" }` | sent indicator 또는 retry | demo session metadata only | `FX-MSG-TEXT-SUCCESS`, `FX-MSG-TEXT-FAIL` |
| send chat image | `UPL-PREVIEW` | context=`chat_image`, `CHA-OPEN`, membership allowed | `UPL-SENDING` + `MSG-SENDING` | pending bubble | memory | `FX-MSG-IMAGE-PENDING` |
| chat image success | `UPL-SENDING` | context=`chat_image`, fixture success | `UPL-SENT` + `MSG-SENT` | sent indicator | demo session metadata only | `FX-MSG-IMAGE-SUCCESS` |
| chat image failure | `UPL-SENDING` | context=`chat_image`, fixture failure | `UPL-FAILED` + `MSG-FAILED` | retry/remove | memory | `FX-MSG-IMAGE-FAIL` |
| check in | `TMB-CONFIRMED` | unique valid visit fixture | `TMB-CHECKED-IN` | Visit reputation 변화; stamp는 별도 `SCN-006` 전까지 불변; `CHA-OPEN` 유지 | demo session | `FX-TBL-CHECKIN-SUCCESS` |
| complete | `TMB-CHECKED-IN` | end event | `TMB-COMPLETED` | feedback open; `CHA-OPEN` 유지 | demo session | `FX-TBL-COMPLETE` |
| submit feedback | `TMB-COMPLETED` | valid nonduplicate feedback | `TMB-COMPLETED` | Meetup/Contribution의 해당 축만 변화 | demo session | `FX-REP-AFTER` |

### 4.6 Payment·stamp·Labs

| Event | From | Guard | To | Side effect | Persistence | Fixture |
|---|---|---|---|---|---|---|
| open checkout | `{ "PAY-IDLE", "PAY-CANCELLED", "PAY-FAILED" }` | Account + Payment KYC | `PAY-CONFIRMING` | KRW 표시 가격·OOKRW test token mock settlement 고정 | memory | `FX-PAY-OOKRW-QUOTE` |
| confirm | `PAY-CONFIRMING` | amount/merchant unchanged | `PAY-PROCESSING` | 버튼 잠금 | memory | `FX-PAY-PROCESSING` |
| payment success | `PAY-PROCESSING` | success fixture | `PAY-SIMULATED-SUCCESS` | merchant·offer·price·mock settlement receipt만 생성; 방문·입장·안전·stamp는 불변 | demo session | `FX-PAY-SUCCESS` |
| payment fail/cancel | `{ "PAY-PROCESSING", "PAY-CONFIRMING" }` | scenario | `{ "PAY-FAILED", "PAY-CANCELLED" }` | 자산·stamp 불변 | memory | `FX-PAY-FAIL`, `FX-PAY-CANCEL` |
| visit proof | `STM-N09` | unique valid evidence + evidenceId 미사용 | `STM-N10` | acceptedEvidenceIds에 기록 후 `NFT-ELIGIBLE`; checkout 상태만으로 금지 | demo session | `FX-STM-10` |
| opt in badge | `NFT-ELIGIBLE` | explicit consent | `NFT-OPTED-IN` | Labs 이동 | demo session | `FX-NFT-OPT-IN` |
| wallet connect | `{ "WAL-DISCONNECTED", "WAL-FAILED" }` | Labs consent | `WAL-CONNECTING` | `truth=SIMULATED`, `Target network: Sui Testnet · Simulated` 표시 | memory | `FX-WAL-LABS-CONNECTING` |
| wallet ready/fail | `WAL-CONNECTING` | scenario | `{ "WAL-READY", "WAL-FAILED" }` | simulated address/asset view 또는 retry; `TESTNET` truth 승격 없음 | demo session | `FX-WAL-LABS-READY`, `FX-WAL-LABS-FAIL` |
| disconnect wallet | `{ "WAL-READY", "WAL-FAILED" }` | user action | `WAL-DISCONNECTED` | bridge pending이 아니면 fixture wallet 제거 | demo session | `FX-WAL-LABS-DISCONNECT` |
| quote bridge | `{ "BRG-IDLE", "BRG-FAILED", "BRG-CANCELLED" }` | wallet ready, valid simulated amount | `BRG-QUOTED` | fee·route·expiry 표시; AMM·pool·liquidity·swap `Deferred` | memory | `FX-BRG-QUOTE` |
| confirm bridge | `BRG-QUOTED` | quote unexpired | `BRG-CONFIRMING` | user confirmation | memory | `FX-BRG-CONFIRM` |
| bridge submit | `BRG-CONFIRMING` | Labs simulation | `BRG-PENDING` + `BRP-SOURCE-SUBMITTED` | simulated receipt pending; 실제 txRef·explorer link 없음 | memory | `FX-BRG-SOURCE-SUBMITTED` |
| source confirmed | `BRG-PENDING` + `BRP-SOURCE-SUBMITTED` | source fixture | `BRG-PENDING` + `BRP-SOURCE-CONFIRMED` | destination 잔고·success 불변 | memory | `FX-BRG-SOURCE-CONFIRMED` |
| relay | `BRG-PENDING` + `BRP-SOURCE-CONFIRMED` | relayer fixture | `BRG-PENDING` + `BRP-RELAYING` | destination 잔고·success 불변 | memory | `FX-BRG-RELAYING` |
| destination confirmed | `BRG-PENDING` + `BRP-RELAYING` | destination fixture | `BRG-SIMULATED-SUCCESS` + `BRP-DESTINATION-CONFIRMED` | simulated destination asset view·receipt 갱신; 실제 자산 불변 | demo session | `FX-BRG-DESTINATION-CONFIRMED` |
| bridge cancel | `{ "BRG-QUOTED", "BRG-CONFIRMING" }` | user action | `BRG-CANCELLED` + `BRP-NONE` | 실제·simulated balance 불변 | memory | `FX-BRG-CANCEL` |
| bridge failure | `BRG-PENDING` | scenario | `BRG-FAILED` | phase 보존, simulated/실제 자산 불변, retry | demo session | `FX-BRG-SIM-FAIL` |
| mint | `NFT-OPTED-IN` | `WAL-READY && STM-N10` | `NFT-MINTING` | simulated tx pending | memory | `FX-NFT-MINT-PENDING` |
| mint result | `NFT-MINTING` | scenario | `{ "NFT-MINTED", "NFT-FAILED" }` | `truth=SIMULATED` commemorative fixture 또는 retry; 실제 txRef가 없으면 `TESTNET` 금지 | demo session | `FX-NFT-MINT-SUCCESS`, `FX-NFT-MINT-FAIL` |

## 5. 불법 전이

아래 전이는 reducer·route guard·E2E에서 모두 거부한다.

| Illegal transition | 이유 | 기대 처리 |
|---|---|---|
| `ACC-GUEST`에서 `PER-VERIFIED`, `AGE-VERIFIED`, `PKY-VERIFIED` 중 하나로 직접 전이 | 외부 proof 과정을 생략 | 해당 pending flow로만 이동 |
| first mission이 Person·Age·Payment KYC·Meetup·stamp를 변경 | 행동 증거의 의미 확대 | unique evidence에 따른 Visit·Contribution만 변경 |
| `personaId`나 국적만으로 `PER-VERIFIED` | 자기선언은 verification 아님 | unverified 유지 |
| KST 19:00만으로 `AGE-VERIFIED` 또는 `A19-ON` | 시간은 성인 증명이 아님 | 기본 ONDO 유지 |
| `A19-ON`인데 age 미검증/만료, KST 19:00 전, auto off 또는 session manual off | 4개 auto guard 위반 | 즉시 `A19-OFF` 또는 `A19-MANUAL-OFF` |
| `ACC-GUEST` 또는 Payment KYC가 `PKY-VERIFIED`가 아닌 상태에서 `PAY-PROCESSING` | 결제 gate 우회 | `FL-010` 뒤 `FL-017`로 redirect |
| membership이 `{ "TMB-CONFIRMED", "TMB-CHECKED-IN", "TMB-COMPLETED" }` 밖인데 `CHA-OPEN` 또는 `MSG-SENT` | 미참가 chat 접근 | `CHA-LOCKED`, Table 상세 redirect |
| local-signal upload가 `MSG-*`를 생성 | 기여 사진과 chat 전송 혼합 | upload context=`local_signal` 유지, message 불변 |
| `{ "UPL-PREVIEW", "UPL-FAILED" }`에서 메시지를 sent 표시 | 업로드 성공 과장 | preview/failed 유지 |
| KYC 국적을 `PUB-*`에 자동 복사 | 동의·목적 제한 위반 | `PUB-PRIVATE` 유지 |
| payment success만으로 stamp 증가 | 결제와 실제 방문 혼합 | visit evidence 대기 |
| 중복 evidence로 stamp·reputation 재증가 | 조작 가능 | idempotent reject |
| `{ "STM-N00", "STM-N01", "STM-N02", "STM-N03", "STM-N04", "STM-N05", "STM-N06", "STM-N07", "STM-N08", "STM-N09" }`에서 `NFT-ELIGIBLE` 또는 `NFT-MINTING` | milestone 미달 | `NFT-LOCKED` 유지 |
| opt-in 또는 wallet 없이 mint | 사용자 동의·signer 부재 | 조건 안내 |
| bridge success fixture가 실제 잔고·실자산 성공을 주장 | simulation을 실거래로 과장 | demo balance view만, `SIMULATED` 라벨 |
| bridge source confirmed만으로 `BRG-SIMULATED-SUCCESS` | destination finality 누락 | `BRG-PENDING` 유지; destination confirmed 대기 |
| fixture wallet·bridge·mint를 `TESTNET` truth로 기록 | 공개 실제 txRef가 없음 | `truth=SIMULATED`, `Target network: Sui Testnet · Simulated` |
| OpenDID payload를 EAS 구현으로 표시 | 서로 다른 adapter·신뢰 경계를 혼합 | separate adapter→canonical envelope; EAS 구현 `Deferred` |
| merchant receipt가 방문·입장·안전을 증명 | receipt 의미 과장 | merchant·offer·policy·redemption fact로 제한 |
| Age 성공이 Payment KYC를 변경하거나 그 반대 | 독립 gate 혼합 | 비대상 verification state 불변 |
| 소비·만료·변조된 `returnTo` 재사용 | gated mutation 중복·open redirect 위험 | RT 삭제, `/ondo` fallback, mutation 없음 |
| stale/error merchant trait를 eligible로 사용 | 오래되거나 불확실한 증거 | unknown/stale UI와 재확인 CTA |

## 6. Persistence와 개인정보 경계

이 절이 `01`~`04`의 persistence source of truth다. 다른 문서의 저장 예시는 이 표와 충돌할 수 없다.

| 저장소 | 허용 | 금지 | 수명 |
|---|---|---|---|
| URL | city, neighborhood, venueId, 공개 filters, list/map mode | 계정·신원·연령·국적·KYC·사진·잔고 | 공유 가능한 공개 context |
| `localStorage` | `ondo.preferences.v3`: locale, guideSeen, autoNight, savedVenueIds, discoveryPreferences | raw proof, credential, PII, 생년월일, 국적, 사진, payment instrument, private key, access token, raw provider response | 사용자가 reset할 때까지 |
| `sessionStorage` | `ondo.session.v3`: onboarding, persona, account, person, age, ageExpiresAt, paymentKyc, after19, gate, gateState, tableMembershipById, reputation, acceptedActivityEventKeys, stamps, profile | 신분증 원문·credential·생년월일·국적 원문·payment instrument·사진/blob·private key·access token·raw provider response | tab/session; gate는 terminal success/cancel 또는 invalidation 때 `null` |
| memory | modal, toast, pending request, object URL, raw 선택 사진 | 페이지 종료 뒤 보존 | route/app lifetime |
| future server | Account, consented public profile, chat, reputation event, evidence receipt | 최소화되지 않은 raw KYC·불필요한 PII | 별도 retention 정책 필요 |

- main key는 `ondo.preferences.v3`, `ondo.session.v3`다. 별도 `ondo.returnTo.*` key는 없고 allowlisted active `gate` envelope 하나만 `ondo.session.v3` 안에 둔다.
- feature session key는 `ondo.chat.v2`, `ondo.table-outcomes.v2`, `ondo.labs.v2`, `ondo.accepted-visits.v2`다. 각각 preview URL을 뺀 session chat item, Table outcome/receipt, 비민감 Labs simulation state, 중복 방지용 공개 evidence ID만 보관한다.
- `gate`는 아래 CTA별 v3 matrix와 [Flow Catalog의 v3 shape](./03_FLOW_CATALOG.md#0-id와-표기-규칙)가 모두 맞을 때만 복원한다. token은 정확히 `RT-${cta}-${Date.parse(createdAt)}`여야 하고 unknown field를 버린다. `cta`는 최종 원 행동이고 `activeGate`만 바꾼다. Account→Person 같은 중간 success에서는 소비하지 않으며 모든 guard가 충족된 뒤 최종 mutation 직전에 `consumedAt`을 기록하고 원 CTA를 한 번 재개한다. cancel은 직전 공개 context 복구 뒤 `gate=null`로 만들고 retry만 미소비 envelope를 유지한다.

| CTA | 허용 `gateQueue` | `venueId` | `tableId` |
|---|---|---|---|
| `SAVE_VENUE` | `account` | required | forbidden |
| `JOIN_TABLE` | ordered subset of `account → person → age` | required | required |
| `OPEN_CHAT` | `account` | forbidden | required |
| `SUBMIT_LOCAL_SIGNAL` | ordered subset of `account → person` | required | forbidden |
| `START_CHECKOUT` | ordered subset of `account → payment_kyc` | required | forbidden |
| `OPEN_AFTER19` | `age` | optional | forbidden |
| `MINT_BADGE` | `person` | forbidden | forbidden |

`ordered subset`은 한 개 이상이며 표의 순서를 보존하고 중복 gate를 허용하지 않는다. required context가 빠지거나 forbidden context가 들어오거나 ID가 명시적 `null`이면 envelope 전체를 거절한다. `OPEN_AFTER19.venueId`만 생략할 수 있으며 명시적 `null`은 생략으로 보지 않는다. `OPEN_CHAT`과 `MINT_BADGE`는 provider가 명시적으로 소유하는 복원 호환 destination이며 임의 CTA의 catch-all route가 아니다. schema·matrix가 잘못된 envelope는 gate를 폐기하고 안전한 map surface로 복귀하며 Labs로 보내지 않는다.
- migration 실패 시 공개 preference만 기본값으로 되돌리고 Guest discovery는 유지한다.
- sign-out/reset은 session 검증 상태, Table·payment·Labs fixture를 제거한다. public map preference는 사용자가 별도로 지울 수 있다.

## 7. Fixture registry

이 registry의 UI branch fixture는 provider의 실제 지원 상태를 단정하지 않는다. Wallet·bridge·mint fixture의 실행 truth는 예외 없이 `SIMULATED`이고 목표 네트워크 표기는 `Target network: Sui Testnet · Simulated`다. 검증 가능한 실제 공개 `txRef`가 있는 별도 실행만 `TESTNET` truth를 사용할 수 있다. Evidence·Trait 계약 fixture는 `CONTRACT_ONLY`, provider가 구성되지 않은 지원성 branch는 `NOT_CONFIGURED`로 구분한다.
[Canonical scenario mapping](./03_FLOW_CATALOG.md#21-canonical-scenario-mapping)의 `SCN-001`~`SCN-015`가 fixture 묶음과 success·cancel·failure 경계를 소유한다.

### 7.1 Onboarding·Account·Identity

| Fixture ID | 목적 | 결정적 결과 |
|---|---|---|
| `FX-ONB-FIRST` | 첫 실행 | `ONB-NEW` |
| `FX-ONB-SHORT` | 단기 여행객 | en, Guest, Seoul interest, no verification |
| `FX-ONB-KOREAN` | 한국 로컬 | ko, Seoul local, Account optional |
| `FX-ONB-RESIDENT` | 장기체류 외국인 | en, Korea resident, Account optional |
| `FX-ACC-START`, `FX-ACC-SUCCESS`, `FX-ACC-CANCEL`, `FX-ACC-FAIL` | Account gate | creating/active/guest/failed |
| `FX-SAVE-PENDING`, `FX-SAVE-SUCCESS`, `FX-SAVE-FAIL` | Save / My Korea | saving/saved/failed와 retry |
| `FX-PER-CX-PENDING`, `FX-PER-CX-SUCCESS`, `FX-PER-CX-CANCEL`, `FX-PER-CX-FAIL`, `FX-PER-CX-EXPIRED` | OmniOne CX simulation | 각 `PER-*` 결과 |
| `FX-PER-RESIDENCE-PENDING`, `FX-PER-RESIDENCE-SUCCESS`, `FX-PER-RESIDENCE-UNSUPPORTED`, `FX-PER-RESIDENCE-FAIL` | Residence Card simulation | verified/unsupported/failed |
| `FX-PER-PASSPORT-PENDING`, `FX-PER-PASSPORT-SUCCESS`, `FX-PER-PASSPORT-FAIL` | 중립 Passport provider | pending/verified/failed |
| `FX-AGE-PENDING`, `FX-AGE-SUCCESS`, `FX-AGE-FAIL`, `FX-AGE-EXPIRED` | age proof | pending/verified/failed/expired |
| `FX-PKY-PENDING`, `FX-PKY-SUCCESS`, `FX-PKY-FAIL` | Payment KYC | pending/verified/failed |
| `FX-PUB-EDIT`, `FX-PUB-SAVE-SUCCESS`, `FX-PUB-SAVE-FAIL` | 선택 공개 프로필 | editing/partial-or-private/save-failed |

### 7.2 Discovery·Table·Content

| Fixture ID | 목적 | 결정적 결과 |
|---|---|---|
| `FX-MAP-KOREA` | 전국 overview | Seoul complete, Busan seed, others Growing |
| `FX-MAP-SEOUL-RECENT` | Hero 데이터 | 검증 가능한 F&B 장소·ONDO 근거 |
| `FX-MAP-BUSAN-SEED` | 확장 예고 | 소수 seed, seed 라벨 |
| `FX-MAP-GROWING` | 나머지 지역 | 숫자 없는 Explore/Growing |
| `FX-MAP-TILE-FAIL` | 지도 실패 | 같은 필터·venue list fallback |
| `FX-MAP-LOCATION-DENIED` | 위치 권한 거부 | 현재 공개 지도·목록 유지, 설정 안내 |
| `FX-VENUE-SEOUL-001` | Hero 장소 | ONDO 근거, 가격, 식이, 예약, 언어, 카드 facts |
| `FX-A19-AUTO-READY`, `FX-A19-AUTO-ON`, `FX-A19-MANUAL-OFF`, `FX-A19-RESET` | 야간 자동 전환 | guard별 `A19-*` |
| `FX-TBL-SEOUL-DINNER` | 일반 Table | `TAV-OPEN`, `TMB-NONE`, `TFR-NONE`, `CHA-LOCKED` |
| `FX-TBL-ALCOHOL` | 주류 Table | age gate required |
| `FX-TBL-JOIN-SUCCESS`, `FX-TBL-JOIN-FAIL`, `FX-TBL-CANCEL` | 참여 분기 | `TMB-CONFIRMED`, `TMB-FAILED`, `TMB-LEFT`와 해당 `TFR-*`, `CHA-*` |
| `FX-TBL-CHECKIN-SUCCESS`, `FX-TBL-COMPLETE` | 현장 완료 | visit evidence/feedback open |
| `FX-UPL-PHOTO-PREVIEW` | 로컬 사진 | preview only |
| `FX-UPL-PHOTO-REMOVED` | 사진 제거 | object URL revoke, removed |
| `FX-UPL-LOCAL-SIGNAL-SUCCESS`, `FX-UPL-LOCAL-SIGNAL-FAIL` | `FL-012` 사진 기여 | `UPL-SENT` 또는 `UPL-FAILED`; `MSG-*` 불변 |
| `FX-MSG-TEXT-PENDING`, `FX-MSG-TEXT-SUCCESS`, `FX-MSG-TEXT-FAIL` | chat text | sending/sent/failed |
| `FX-MSG-IMAGE-PENDING`, `FX-MSG-IMAGE-SUCCESS`, `FX-MSG-IMAGE-FAIL` | chat image | sending/sent/failed |
| `FX-EVD-VALID`, `FX-EVD-STALE`, `FX-EVD-ERROR` | evidence adapter 소비 | valid/stale/error |
| `FX-TRT-ELIGIBLE`, `FX-TRT-INELIGIBLE`, `FX-TRT-STALE`, `FX-TRT-ERROR` | merchant trait | 해당 fact state |

### 7.3 Payment·Reputation·Labs

| Fixture ID | 목적 | 결정적 결과 |
|---|---|---|
| `FX-PAY-OOKRW-QUOTE`, `FX-PAY-PROCESSING`, `FX-PAY-SUCCESS`, `FX-PAY-FAIL`, `FX-PAY-CANCEL` | Hero checkout | 명시된 `PAY-*`; 실결제 없음 |
| `FX-REP-BEFORE` | 초기 행동 평판 | Visit new, Contribution new, Meetup new |
| `FX-REP-AFTER` | Table feedback 이후 | 대상 축만 한 단계 상승 |
| `FX-STM-09`, `FX-STM-10` | milestone 경계 | `STM-N09`/`STM-N10` |
| `FX-NFT-OPT-IN`, `FX-NFT-MINT-PENDING`, `FX-NFT-MINT-SUCCESS`, `FX-NFT-MINT-FAIL` | badge simulation | eligible 이후에만 전이 |
| `FX-WAL-LABS-CONNECTING`, `FX-WAL-LABS-READY`, `FX-WAL-LABS-FAIL`, `FX-WAL-LABS-DISCONNECT` | optional signer | `truth=SIMULATED`; 목표 Sui Testnet fixture wallet 또는 실패·해제 |
| `FX-BRG-QUOTE`, `FX-BRG-CONFIRM`, `FX-BRG-SOURCE-SUBMITTED`, `FX-BRG-SOURCE-CONFIRMED`, `FX-BRG-RELAYING`, `FX-BRG-DESTINATION-CONFIRMED`, `FX-BRG-CANCEL`, `FX-BRG-SIM-FAIL` | bridge simulation | 단계별 `BRP-*` lifecycle, destination confirmed 전 success 금지, 실자산 불변 |

## 8. 초기 scenario snapshots

| Scenario | 핵심 초기 상태 | 사용 Flow |
|---|---|---|
| Guest fresh | `ONB-NEW`, `ACC-GUEST`, 모든 verification 미완료, `MAP-KOREA`, `A19-OFF` | `FL-001`, `FL-007` |
| Short-term Hero | `ONB-COMPLETE`, `ACC-GUEST`, `PER-UNVERIFIED`, `AGE-UNVERIFIED`, `MAP-SEOUL` | `FL-001`~`FL-004`, `FL-010`, `FL-012`~`FL-014`, `FL-017`~`FL-018` |
| Korean Foundation | `ONB-COMPLETE`, `ACC-ACTIVE`, `PER-UNVERIFIED`, `MAP-SEOUL` | `FL-005`, `FL-008` |
| Resident supported | `ONB-COMPLETE`, `ACC-ACTIVE`, `PER-UNVERIFIED` | `FL-006`, `FL-009` |
| Resident unsupported | 위와 같음 + `FX-PER-RESIDENCE-UNSUPPORTED` | `FL-006` 대체 경로 |
| After19 auto | `AGE-VERIFIED`, autoNight true, fixture KST 19:30, `A19-OFF` | `FL-014` |
| Milestone | `ACC-ACTIVE`, `PKY-VERIFIED`, `STM-N09`, `WAL-DISCONNECTED` | `FL-004`, `FL-017`, `FL-018` |

## 9. Reducer와 QA 불변식

1. event는 한 번에 해당 domain만 직접 바꾼다. 다른 축은 명시된 파생 effect만 허용한다.
2. 모든 async state는 `pending → success|failure|cancel`을 가지며 중복 submit을 막는다.
3. 모든 gated event는 valid `returnTo`를 만들고 terminal state에서 한 번만 소비한다.
4. fixture와 production adapter는 같은 input/output union을 사용하되 demo에는 simulation 라벨을 노출한다.
5. route 직접 진입에서도 guard를 다시 계산한다. UI 숨김만으로 권한을 구현하지 않는다.
6. reload 후 URL 공개 context는 복구되지만 memory의 raw 사진·pending proof는 복구하지 않는다.
7. 오류가 발생해도 `FL-001` Guest discovery는 사용할 수 있다.
8. QA는 이 문서의 illegal transition을 각각 최소 한 번 시도한다.
