# ONDO Data & Adapter Contracts

상태: `SPEC BASELINE · 2026-08-19`
대상 릴리스: `ONDO Frontend Demo Candidate v2`
적용 요구사항: `REQ-001~REQ-019`
관련 플로우: Core `FL-001~FL-006`, supporting `FL-007~FL-018`

이 문서는 로컬 fixture를 미래 API로 교체해도 화면과 상태 머신을 다시 설계하지 않도록 하는 프론트엔드 계약이다. 타입이 같다는 사실은 외부 연동, 법적 효력, 온체인 완료 또는 운영 가능성을 뜻하지 않는다.

---

## 1. 계약 불변식

1. 모든 외부 의존 응답에는 `truth`와 `provenance`가 있다. `success`만으로 `LIVE`를 추론하지 않는다.
2. fixture, sandbox, testnet, live 데이터는 같은 배열이나 합계에 출처 없이 섞지 않는다.
3. `Account`, `Person verification`, `19+ eligibility`, `Payment KYC`, `Reputation`은 서로 독립된 상태다.
4. ONDO 점수는 인기·최신 로컬 식음료 신호의 제품 지표다. 기온, 실시간 인파, 대기 시간, 평점, 안전 점수가 아니다.
5. USDC, USDT, wrapped asset, OOKRW는 자산 원장에서 분리한다. 화면의 합계는 `Estimated USD value`일 뿐 단일 USD 잔고가 아니다.
6. OpenDID와 EAS는 별도 adapter다. `OpenDID imports/uses EAS`라는 전제를 타입·필드명·주석에 넣지 않는다.
7. Sui zkLogin은 Sui signer 연결 상태일 뿐 ONDO Account, KYC, OpenDID holder 또는 multichain wallet 상태가 아니다.
8. 원본 위치는 바꾸지 않는다. 겹침 해소를 위한 cluster/spiderfy는 표시 상태이며 source geometry를 덮어쓰지 않는다.
9. 국적·법적 이름·생년월일·신분증 원문을 공개 프로필 DTO에 넣지 않는다.
10. 실제 서버가 없는 채팅·사진·결제·bridge·mint는 항상 `SIMULATED`이고 고유 fixture ID를 남긴다.

---

## 2. 공통 TypeScript 원형

아래 shape는 구현 시 `lib/ondo/contracts.ts` 같은 단일 모듈로 옮기는 기준이다. provider SDK 타입을 React component까지 직접 전달하지 않는다.

```ts
export type ISODateTime = string
export type Language = "ko" | "en"

export type ExecutionTruth =
  | "LIVE"
  | "SANDBOX"
  | "TESTNET"
  | "SIMULATED"
  | "CONTRACT_ONLY"
  | "NOT_CONFIGURED"

export type SourceKind =
  | "editorial"
  | "partner"
  | "community"
  | "provider"
  | "chain"
  | "local_fixture"

export interface Provenance {
  truth: ExecutionTruth
  sourceId: string
  sourceKind: SourceKind
  fixtureId?: `FX-${string}`
  observedAt?: ISODateTime
  fetchedAt: ISODateTime
  expiresAt?: ISODateTime
  evidenceRef?: string
  txRef?: string
  isSimulation: boolean
}

export type DataState<T> =
  | { status: "idle" }
  | { status: "loading"; previous?: T }
  | { status: "success"; data: T; provenance: Provenance }
  | { status: "empty"; reason: "no_result" | "limited_coverage"; provenance: Provenance }
  | { status: "error"; code: DomainErrorCode; retryable: boolean; previous?: T }

export type DomainErrorCode =
  | "NETWORK_OFFLINE"
  | "MAP_TILE_UNAVAILABLE"
  | "SOURCE_UNAVAILABLE"
  | "SOURCE_EXPIRED"
  | "NOT_CONFIGURED"
  | "UNSUPPORTED_CREDENTIAL"
  | "USER_CANCELLED"
  | "SESSION_EXPIRED"
  | "PERMISSION_DENIED"
  | "UPLOAD_FAILED"
  | "MESSAGE_FAILED"
  | "INSUFFICIENT_BALANCE"
  | "POLICY_NOT_MET"
  | "UNKNOWN"

export interface DataAdapter<Query, Result> {
  readonly id: string
  readonly truth: ExecutionTruth
  read(query: Query, signal?: AbortSignal): Promise<DataState<Result>>
}

export type ReturnToCta =
  | "SAVE_VENUE"
  | "JOIN_TABLE"
  | "OPEN_CHAT"
  | "SUBMIT_LOCAL_SIGNAL"
  | "START_CHECKOUT"
  | "OPEN_AFTER19"
  | "MINT_BADGE"

export interface ReturnToEnvelope {
  tokenId: `RT-${ReturnToCta}-${number}`
  cta: ReturnToCta
  gateQueue: ("account" | "person" | "age" | "payment_kyc")[]
  activeGate: "account" | "person" | "age" | "payment_kyc"
  venueId?: string // allowlisted public entity ID only
  tableId?: string // allowlisted public entity ID only
  createdAt: ISODateTime
  expiresAt: ISODateTime
  consumedAt?: ISODateTime
}
```

### v3 `gate` 복귀 envelope 안전 계약

- 저장 위치는 `sessionStorage["ondo.session.v3"].gate` 하나이며 localStorage·URL·별도 returnTo key에는 넣지 않는다.
- context는 아래 CTA별 matrix에 필요한 allowlisted 공개 `venueId`, `tableId`만 허용한다. credential, 생년월일, 국적, payment instrument, 사진 blob, private key, access token, raw provider response는 거절한다.
- 허용되는 `cta`와 token prefix는 `SAVE_VENUE` / `RT-SAVE_VENUE-<epoch-ms>`, `JOIN_TABLE` / `RT-JOIN_TABLE-<epoch-ms>`, `OPEN_CHAT` / `RT-OPEN_CHAT-<epoch-ms>`, `SUBMIT_LOCAL_SIGNAL` / `RT-SUBMIT_LOCAL_SIGNAL-<epoch-ms>`, `START_CHECKOUT` / `RT-START_CHECKOUT-<epoch-ms>`, `OPEN_AFTER19` / `RT-OPEN_AFTER19-<epoch-ms>`, `MINT_BADGE` / `RT-MINT_BADGE-<epoch-ms>`뿐이다.
- 복원은 CTA, token, `gateQueue`, `activeGate`, 15분 수명, 공개 ID 형식을 검사하고 unknown field를 제거한다. token의 `<epoch-ms>`는 `Date.parse(createdAt)`과 정확히 같아야 한다.
- `cta`는 최종 resume action이고 `activeGate`는 현재 통과 중인 gate다. Account→Person→원 CTA처럼 gate가 연속돼도 `tokenId`, `cta`, 공개 context는 바꾸지 않고 `activeGate`만 갱신한다.
- 중간 gate 성공에서는 token을 소비하지 않는다. 최종 resume action의 모든 guard가 충족된 뒤 mutation 직전에 compare-and-set으로 정확히 한 번 소비한다. refresh·중복 callback으로 CTA를 두 번 실행하지 않는다.
- 취소는 mutation 없이 원 surface를 복구하고 token을 지운다. 실패 뒤 `재시도`는 만료되지 않은 같은 token을 미소비로 유지하고, `돌아가기`를 선택하면 token을 지운다.
- schema 오류·만료·허용되지 않은 route이면 token을 폐기하고 안전한 map surface로 복귀한다. malformed CTA를 Labs로 보내지 않으며, 검증된 `MINT_BADGE`만 명시적 branch로 Labs를 연다.

| CTA | 허용 `gateQueue` | `venueId` | `tableId` |
|---|---|---|---|
| `SAVE_VENUE` | `account` | required | forbidden |
| `JOIN_TABLE` | ordered subset of `account → person → age` | required | required |
| `OPEN_CHAT` | `account` | forbidden | required |
| `SUBMIT_LOCAL_SIGNAL` | ordered subset of `account → person` | required | forbidden |
| `START_CHECKOUT` | ordered subset of `account → payment_kyc` | required | forbidden |
| `OPEN_AFTER19` | `age` | optional | forbidden |
| `MINT_BADGE` | `person` | forbidden | forbidden |

`ordered subset`은 비어 있지 않고 위 순서를 보존하며 중복을 허용하지 않는다. required context 누락, forbidden context 추가, 명시적 `null` ID는 모두 envelope 단위로 거절한다. `OPEN_AFTER19.venueId`만 생략 가능하고 명시적 `null`은 생략이 아니다. 현재 제품 `beginAction` 호출이 직접 만드는 `SAVE_VENUE`, `JOIN_TABLE`, `SUBMIT_LOCAL_SIGNAL`, `START_CHECKOUT`, `OPEN_AFTER19` 규칙과 provider가 명시적으로 복원하는 `OPEN_CHAT`, `MINT_BADGE` compatibility destination을 함께 고정한 계약이다.

### 실행 진실성 규칙

| 상황 | `truth` | 필수 UI/Evidence |
|---|---|---|
| 로컬 JSON/메모리 fixture | `SIMULATED` | 사용자 오해 가능 화면에 `시뮬레이션`; fixture ID |
| 공식 sandbox receipt를 실제 검증 | `SANDBOX` | `샌드박스`; receipt/evidence ref |
| 공개 testnet transaction을 실제 조회 | `TESTNET` | `테스트넷`; network와 tx ref |
| 운영 provider 응답을 실제 검증 | `LIVE` | provider·수집시각·운영 정책 |
| interface만 존재 | `CONTRACT_ONLY` | 실행 CTA 비활성 또는 `연결 전` |
| 키·계약·provider 없음 | `NOT_CONFIGURED` | 성공 fixture로 자동 대체 금지 |

`isSimulation`은 `truth === "SIMULATED"`와 일치해야 한다. 빌드 시 assertion으로 검수한다.

---

## 3. ID 규칙과 시나리오 registry

### ID 형식

| 대상 | 형식 | 예시 |
|---|---|---|
| 요구사항 | `REQ-NNN` | `REQ-007` |
| 플로우 | `FL-NNN` | `FL-003` |
| 시나리오 | `SCN-NNN-*` | `SCN-004-TABLE-CHAT` |
| fixture | `FX-[DOMAIN]-[SCENARIO]` | `FX-PER-CX-SUCCESS` |
| entity fixture | `FX-[ENTITY]-[NAME]` | `FX-VENUE-SEOUL-001` |
| 화면 | `SCR-[SURFACE]` | `SCR-MAP` |
| 이벤트 | `EVT-<DOMAIN>-NNN` | `EVT-REP-001` |
| 복귀 토큰 | `RT-[RETURN_TO_CTA]-<epoch-ms>` | `RT-JOIN_TABLE-1787133600000` |
| 계약 테스트 | `CONTRACT-DATA-NNN` | `CONTRACT-DATA-001` |

### 필수 시나리오

| Scenario ID | Flow | 시작 상태 | 성공 결과 | 필수 실패/복귀 |
|---|---|---|---|---|
| `SCN-001-GUEST-DISCOVER` | `FL-001` | guest, day, Seoul | 검색→장소 상세→외부 길찾기 | tile 실패 시 동기화된 목록 유지 |
| `SCN-002-ACCOUNT-RETURN` | `FL-010` → `FL-011` | guest가 저장 선택 | account 생성 후 같은 장소 저장 | 취소·실패하면 상세, 성공 callback 중복에도 저장 1회 |
| `SCN-003-TOURIST-AFTER19` | `FL-002` | age proof 미확인 | 독립 age fixture→같은 venue 상세→After19; 자동 전환은 별도 4 guard | 취소·실패·만료 후 같은 장소의 일반 정보 유지 |
| `SCN-004-TABLE-CHAT` | `FL-003` | account, Table 상세 | 참가→텍스트/이미지→피드백 | 미참가 chat 차단; 이미지 retry |
| `SCN-005-CHECKOUT-LABS` | `FL-004` | payment KYC 미확인 | KYC simulation→mock checkout receipt, stamp 불변 | 잔액 부족·취소·중복 결제 차단 |
| `SCN-006-STAMP-MILESTONE` | `FL-004` | stamp 9; checkout 결과는 guard가 아님 | 별도 unique visit proof 후 10, 기념 badge 선택 노출 | 결제만으로 stamp 증가 금지; NFT는 Labs opt-in simulation만 |
| `SCN-007-KOREAN-CX` | `FL-005` | 한국인 account | CX Mobile ID fixture 성공 | 취소·실패·만료 |
| `SCN-008-RESIDENCE-SUPPORTED` | `FL-006` | 장기체류 account | Residence Card fixture 성공 | session 만료 후 재시도 |
| `SCN-009-RESIDENCE-UNAVAILABLE` | `FL-006` | credential 미지원 | 중립 대체 경로 안내 | 성공으로 가장 금지 |
| `SCN-010-LABS-BRIDGE` | `FL-018` | Labs, asset fixture | simulated state progression | source success를 destination final로 간주 금지 |
| `SCN-011-ONBOARD-SHORT` | `FL-007` | `ONB-NEW`, 단기 여행객 선택 | 언어·취향 후 `ONB-COMPLETE`, Guest map | skip·preference failure도 map 도착; KYC 없음 |
| `SCN-012-ONBOARD-KOREAN` | `FL-008` | `ONB-NEW`, 한국 로컬 선택 | `ONB-COMPLETE`, Guest 또는 선택 Account map | CX는 시작하지 않음; account failure도 Guest map |
| `SCN-013-ONBOARD-RESIDENT` | `FL-009` | `ONB-NEW`, 장기체류 선택 | `ONB-COMPLETE`, Guest 또는 선택 Account map | Residence Card는 시작하지 않음; unsupported여도 map |
| `SCN-014-LOCAL-SIGNAL` | `FL-012` | Account + Person, venue 선택 | draft→현장 사진 preview→submit→Visit/Contribution만 변화 | cancel·upload fail·중복 evidence 후 원 venue 복귀 |
| `SCN-015-PAYMENT-KYC` | `FL-017` | Account, `PKY-NOT-STARTED` | pending→verified→같은 checkout 재개 | failed·expired·cancel 후 결제·stamp 불변 |

테스트는 임의 텍스트 대신 Scenario ID를 test title과 screenshot 이름에 사용한다.

---

## 4. Map, geometry, coverage 계약

```ts
export interface GeoPoint {
  latitude: number
  longitude: number
}

export type MapGeometry =
  | { type: "Point"; coordinates: [longitude: number, latitude: number] }
  | { type: "Polygon"; coordinates: Array<Array<[longitude: number, latitude: number]>> }
  | { type: "MultiPolygon"; coordinates: Array<Array<Array<[longitude: number, latitude: number]>>> }

export type CoverageTier = "complete" | "seed" | "growing"
export type MapLevel = "nation" | "city" | "neighborhood" | "venue"
export type DiscoveryState =
  | "MAP-KOREA"
  | "MAP-SEOUL"
  | "MAP-BUSAN"
  | "MAP-GROWING"
  | "MAP-VENUE"
  | "MAP-FALLBACK"

export interface MapEntityBase {
  id: string
  level: MapLevel
  geometry: MapGeometry
  sourcePoint?: GeoPoint
  names: { ko: string; en: string }
  coverage: CoverageTier
  provenance: Provenance
}

export interface MapViewportQuery {
  bounds: { north: number; east: number; south: number; west: number }
  zoom: number
  language: Language
  mode: "ondo" | "after19"
  category: "food_drink"
  openNow?: boolean
}

export interface DiscoveryPreferences {
  language: Language
  diet: Array<"vegetarian" | "vegan" | "halal_friendly" | "no_preference">
  moods: Array<"local_classics" | "cafe_dessert" | "late_night" | "lively" | "calm">
  budget?: "low" | "medium" | "high"
}
```

### Geometry 규칙

- venue의 `sourcePoint`와 Point geometry는 실제 장소 좌표다.
- 화면 겹침 해소 좌표는 저장하지 않는다. cluster는 cluster centroid와 member IDs를 별도 표시 모델로만 만든다.
- spiderfy는 사용자 tap 이후에만 허용하며 실제 위치까지 connector를 보인다.
- 전국·도시 집계 geometry는 행정 경계 또는 문서화된 aggregation cell이다. 장식용 `% left/top`은 실제 지도 데이터로 취급하지 않는다.
- 좌표가 없는 venue는 지도 marker를 만들지 않고 목록의 `위치 확인 중` 상태로 둔다.
- 한국 밖 좌표, `NaN`, 위도 ±90/경도 ±180 초과는 adapter 경계에서 거절한다.

### Coverage

```ts
export interface CoverageSummary {
  regionId: string
  tier: CoverageTier
  venueCount: number
  scoredEntityCount: number
  lastEditorialReviewAt?: ISODateTime
  nextExpansionLabel?: { ko: string; en: string }
}
```

- Seoul: `complete`; 빈 정상 상태가 없어야 한다.
- Busan: `seed`; 적은 표본과 시각적 밀도를 숨기지 않는다.
- 그 외: `growing`; 근거 없는 ONDO 숫자를 생성하지 않는다.

---

## 5. ONDO Heat 계약

```ts
export type HeatLevel = "low" | "warming" | "rising" | "hot" | "peak" | "limited"
export type ConfidenceBand = "low" | "medium" | "high" | "unknown"
export type FreshnessBand = "recent" | "today" | "aging" | "stale" | "unknown"

export interface HeatSignalSummary {
  score: number | null
  level: HeatLevel
  signalCount: number
  minSampleMet: boolean
  windowStart?: ISODateTime
  windowEnd?: ISODateTime
  computedAt?: ISODateTime
  freshness: FreshnessBand
  confidence: ConfidenceBand
  reasonCodes: Array<
    | "local_visits"
    | "local_saves"
    | "recent_contributions"
    | "editorial_signal"
    | "partner_signal"
    | "insufficient_sample"
  >
  provenance: Provenance
}
```

검증 규칙:

- `score`는 정수 `0..100` 또는 `null`이다.
- `minSampleMet === false`이면 `score === null`, `level === "limited"`이다.
- `stale`은 점수를 그대로 `live`처럼 표시하지 않는다. 날짜를 노출하거나 limited로 내린다.
- `signalCount`는 익명화된 집계 신호 수다. 사람 수·현재 인파로 번역하지 않는다.
- confidence는 표본 수 하나로 자동 생성하지 않는다. 출처 다양성·검증·편향 정책의 결과다.
- 화면은 score, freshness, confidence, signal count를 각각 분리한다.

ONDO 색상 token은 [Visual Spec](./07_VISUAL_INTERACTION_SPEC.md)의 유일한 palette를 따른다.

---

## 6. Venue와 `가기 전 확인`

```ts
export type FactValue = "yes" | "no" | "conditional" | "unknown"
export type MerchantTraitState =
  | "TRT-UNKNOWN"
  | "TRT-ELIGIBLE"
  | "TRT-INELIGIBLE"
  | "TRT-STALE"
  | "TRT-ERROR"

export interface AccessFact {
  key:
    | "foreign_card"
    | "korean_phone_required"
    | "reservation_required"
    | "foreign_language"
    | "passport_required"
    | "over19_required"
  value: FactValue
  note?: { ko: string; en: string }
  checkedAt?: ISODateTime
  provenance: Provenance
}

export interface MerchantTraitReceipt {
  id: string
  venueId: string
  offerId: string
  traitKey: AccessFact["key"]
  result: Exclude<MerchantTraitState, "TRT-UNKNOWN">
  policyVersion: string
  evaluatedAt: ISODateTime
  expiresAt?: ISODateTime
  evidenceRef?: string
  provenance: Provenance
}

export interface Venue {
  id: string
  names: { ko: string; en: string }
  coordinate: GeoPoint
  address: { ko: string; en: string }
  category: "restaurant" | "cafe" | "bar" | "market" | "food_experience"
  openingStatus: "open" | "closed" | "unknown"
  priceBand?: 1 | 2 | 3 | 4
  heat: HeatSignalSummary
  accessFacts: AccessFact[]
  photoUrls: string[]
  source: Provenance
}
```

`AccessFact`와 `MerchantTraitReceipt`는 특정 venue·offer·policy version의 한 trait 결과다. 사업자 보증, 신원 보증, 안전, 최종 입장·결제 승인이 아니며 unknown/stale/error를 eligible로 기본 처리하지 않는다. 동일 receipt의 venue/offer/policy가 요청과 다르거나 만료됐으면 소비를 거절한다.

---

## 7. Account, identity, eligibility 계약

```ts
export type PersonaIntent = "short_term_visitor" | "long_term_resident" | "korean_local"

export interface OnboardingState {
  status: "ONB-NEW" | "ONB-IN-PROGRESS" | "ONB-COMPLETE"
  personaId: "PER-TOURIST-SHORT" | "PER-RESIDENT-LONG" | "PER-LOCAL-KR" | null
  language: Language
  preferences: DiscoveryPreferences
  completedAt?: ISODateTime
}

export interface AccountState {
  status: "ACC-GUEST" | "ACC-CREATING" | "ACC-ACTIVE" | "ACC-FAILED"
  accountId?: string
  method?: "local_fixture" | "email" | "google_oauth"
  personaIntent?: PersonaIntent
  createdAt?: ISODateTime
  truth: ExecutionTruth
}

export interface SaveState {
  venueId: string
  status: "SAV-IDLE" | "SAV-SAVING" | "SAV-SAVED" | "SAV-FAILED"
  provenance: Provenance
}

export type VerificationRoute =
  | "cx_mobile_id"
  | "cx_residence_card"
  | "passport_provider"

export interface PersonVerificationState {
  status:
    | "PER-UNVERIFIED"
    | "PER-PENDING"
    | "PER-VERIFIED"
    | "PER-FAILED"
    | "PER-EXPIRED"
    | "PER-UNSUPPORTED"
  route?: VerificationRoute
  verifiedAt?: ISODateTime
  expiresAt?: ISODateTime
  assuranceLabel?: string
  provenance: Provenance
}

export interface AgeProofState {
  status: "AGE-UNVERIFIED" | "AGE-PENDING" | "AGE-VERIFIED" | "AGE-FAILED" | "AGE-EXPIRED"
  route?: "policy_fact" | "cx_adult_verify" | "opendid_cl_predicate"
  verifiedAt?: ISODateTime
  expiresAt?: ISODateTime
  provenance: Provenance
}

export interface PaymentKycState {
  status: "PKY-NOT-STARTED" | "PKY-PENDING" | "PKY-VERIFIED" | "PKY-FAILED" | "PKY-EXPIRED"
  route?: "payment_policy_fixture" | "passport_provider"
  verifiedAt?: ISODateTime
  expiresAt?: ISODateTime
  provenance: Provenance
}

export interface PublicProfile {
  state: "PUB-PRIVATE" | "PUB-PARTIAL" | "PUB-EDITING" | "PUB-SAVE-FAILED"
  displayName: string
  avatarUrl?: string
  from?: { value: string; selfDeclared: true; visible: boolean; consent: boolean }
  livesIn?: { value: string; selfDeclared: true; visible: boolean; consent: boolean }
  languages: Array<{ value: string; selfDeclared: true; visible: boolean; consent: boolean }>
}
```

### 분리 규칙

- `ACC-ACTIVE`는 `PER-VERIFIED`를 의미하지 않는다.
- person verification 성공이 `AGE-VERIFIED`를 자동 보장하지 않는다. provider 결과에 해당 claim이 있어도 별도 `AgeProofState` receipt와 명시적 전이를 거친다.
- `AgeProofState`와 `PaymentKycState`는 route·provenance·expiry를 공유하지 않는다. 한 축의 success·failure·expiry가 다른 축을 변경하지 않는다.
- passport KYC는 여권/NFC/얼굴/liveness 같은 provider 검증 영역이다. OpenDID predicate 증명과 동일시하지 않는다.
- `proofMode=opendid_cl_predicate`는 합성 credential의 로컬/공식 SDK 증명 가능성을 나타낼 뿐 실제 KTour hosted E2E를 뜻하지 않는다.
- CX session 성공을 ZKP 성공으로 번역하지 않는다.
- `cx_residence_card`가 `unsupported` 또는 `NOT_CONFIGURED`이면 passport 경로를 선택지로 제시하되 CX 성공처럼 기록하지 않는다.
- onboarding persona는 추천·adapter route의 초기값일 뿐 Account·Person·Age·Payment KYC를 올리지 않는다. 세 persona 모두 skip/failure 뒤 `ONB-COMPLETE`와 map 도착이 가능하다.
- `visible=true`는 같은 interaction에서 `consent=true`가 명시된 self-declared 필드에만 허용한다. KYC nationality를 PublicProfile로 복사하지 않는다.

### Evidence adapter 경계

```ts
export interface CanonicalEvidenceEnvelope {
  id: string
  subjectRef: string
  evidenceType: "person" | "over19" | "visit" | "eligibility" | "redemption"
  statement: Record<string, boolean | string | number>
  issuedAt: ISODateTime
  expiresAt?: ISODateTime
  sourceStandard: "opendid" | "eas" | "ktour"
  adapterId: "opendid-adapter" | "eas-adapter" | "ktour-local-adapter"
  provenance: Provenance
}

export type EvidenceState =
  | "EVD-UNKNOWN"
  | "EVD-LOADING"
  | "EVD-VALID"
  | "EVD-STALE"
  | "EVD-INVALID"
  | "EVD-ERROR"

export interface EvidenceAdapterSnapshot {
  status: EvidenceState
  envelope?: CanonicalEvidenceEnvelope
  provenance: Provenance
}

export interface OpenDidEvidenceAdapter {
  readonly id: "opendid-adapter"
  mapCredential(input: unknown, provenance: Provenance): DataState<CanonicalEvidenceEnvelope>
}

export interface EasEvidenceAdapter {
  readonly id: "eas-adapter"
  mapAttestation(input: unknown, provenance: Provenance): DataState<CanonicalEvidenceEnvelope>
}
```

`sourceStandard` 값은 상호 import 관계를 뜻하지 않는다. OpenDID credential과 EAS attestation은 별도 raw schema·validator·adapter를 거쳐 ONDO canonical envelope로 각각 매핑한다. 한 adapter가 다른 adapter를 호출하거나 `sourceStandard`를 바꾸는 fallback은 금지한다. 공통 consumer는 canonical envelope만 읽고, 원본 서명 검증 성공·issuer·expiry·provenance가 없는 입력은 `EVD-INVALID`로 거절한다.

---

## 8. After 19 계약

```ts
export interface After19State {
  mode: "A19-OFF" | "A19-PROMPT" | "A19-ON" | "A19-MANUAL-OFF"
  autoPreference: "PREF-AUTO-NIGHT-ON" | "PREF-AUTO-NIGHT-OFF"
  koreanLocalTime: ISODateTime
  reason: "manual" | "auto_guard_passed" | "guard_failed" | "user_disabled"
  eligibility: AgeProofState["status"]
  eligibilityExpiresAt?: ISODateTime
  lastAutoSwitchAt?: ISODateTime
}

export function canAutoEnterAfter19(state: After19State): boolean {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date(state.koreanLocalTime))
  const value = Number(hour.find((part) => part.type === "hour")?.value)
  const proofIsCurrent = state.eligibilityExpiresAt != null
    && new Date(state.eligibilityExpiresAt).getTime() > new Date(state.koreanLocalTime).getTime()
  return state.autoPreference === "PREF-AUTO-NIGHT-ON"
    && state.eligibility === "AGE-VERIFIED"
    && proofIsCurrent
    && state.mode !== "A19-MANUAL-OFF"
    && value >= 19
}
```

- canonical fixture는 `FX-A19-AUTO-READY`(verified, 미만료, auto on, 19:00), `FX-A19-AUTO-ON`, `FX-A19-MANUAL-OFF`, `FX-A19-RESET`을 사용하고, 각 fixture field의 clock을 18:59/19:00/23:30 및 `eligibilityExpiresAt` 경계로 바꿔 검증한다. 별도 time fixture namespace는 만들지 않는다.
- 일반 심야 식당·카페는 day mode에서도 노출한다. `over19_required=yes`인 장소/이벤트만 gate한다.
- 만료된 proof는 `AGE-VERIFIED`로 캐시하지 않는다.
- `A19-MANUAL-OFF`는 같은 tab/session의 remount·route 이동 뒤에도 유지한다. 새 session 또는 명시적 reset만 `A19-OFF`로 돌리고 auto guard를 다시 계산한다.

---

## 9. Table, chat, photo 계약

```ts
export interface PulseTable {
  id: string
  venueId: string
  hostProfileId: string
  startsAt: ISODateTime
  capacity: number
  participantCount: number
  languages: string[]
  menuNote: { ko: string; en: string }
  priceNote: { ko: string; en: string }
  alcoholCondition: "none" | "optional" | "over19_required"
  availabilityStatus: "TAV-OPEN" | "TAV-FULL" | "TAV-CLOSED" | "TAV-CANCELLED"
  provenance: Provenance
}

export interface TableAvailability {
  tableId: string
  status: "TAV-OPEN" | "TAV-FULL" | "TAV-CLOSED" | "TAV-CANCELLED"
  participantCount: number
  seatsRemaining: number
  checkedAt: ISODateTime
}

export interface TableMembership {
  tableId: string
  accountId: string
  status:
    | "TMB-NONE"
    | "TMB-REQUESTING"
    | "TMB-CONFIRMED"
    | "TMB-CHECKED-IN"
    | "TMB-COMPLETED"
    | "TMB-LEFT"
    | "TMB-FAILED"
  joinedAt?: ISODateTime
}

export interface TableFailureReasonState {
  status: "TFR-NONE" | "TFR-FULL" | "TFR-NETWORK" | "TFR-POLICY" | "TFR-CANCELLED"
  occurredAt?: ISODateTime
}

export interface ChatAccessState {
  status: "CHA-LOCKED" | "CHA-OPEN"
  reason?: "account_required" | "membership_required" | "membership_lost" | "table_cancelled"
  returnTo?: ReturnToEnvelope
}

export type MessageState = "MSG-IDLE" | "MSG-SENDING" | "MSG-SENT" | "MSG-FAILED"
export type UploadState =
  | "UPL-IDLE"
  | "UPL-PREVIEW"
  | "UPL-SENDING"
  | "UPL-SENT"
  | "UPL-FAILED"
  | "UPL-REMOVED"

export interface ChatMessage {
  id: string
  tableId: string
  senderProfileId: string
  kind: "text" | "image" | "system"
  text?: string
  attachment?: PhotoAttachment
  delivery: Exclude<MessageState, "MSG-IDLE">
  createdAt: ISODateTime
  fixtureId?: `FX-${string}`
}

export interface PhotoAttachment {
  id: string
  localPreviewUrl?: string
  remoteUrl?: string
  fileName: string
  mimeType: "image/jpeg" | "image/png" | "image/webp"
  byteSize: number
  purpose: "local_signal" | "chat_image"
  state: UploadState
  truth: ExecutionTruth
}

export interface VisitEvidence {
  id: string
  venueId: string
  accountId: string
  observedAt: ISODateTime
  uniqueGuardKey: string
  provenance: Provenance
}

export interface LocalSignalSubmission {
  id: string
  venueId: string
  accountId: string
  note?: string
  photo?: PhotoAttachment & { purpose: "local_signal" }
  visitEvidence?: VisitEvidence
  status: "draft" | "submitting" | "submitted" | "failed" | "cancelled"
  returnTo: ReturnToEnvelope
  provenance: Provenance
}
```

- `TableAvailability`는 Guest도 볼 수 있다. `TableMembership`은 Account가 join을 시작한 뒤에만 만들며 availability와 account membership을 한 객체로 합치지 않는다.
- membership이 `TMB-CONFIRMED`, `TMB-CHECKED-IN`, `TMB-COMPLETED`가 아니면 chat read/write를 모두 거절하고 `CHA-LOCKED`로 둔다. `ACC-ACTIVE`여도 비참가 direct route는 허용하지 않는다.
- 좌석·운영 상태 `TAV-*`, 사용자 참가 상태 `TMB-*`, 실패 사유 `TFR-*`, chat 접근 `CHA-*`는 별도 객체다. full/closed/expired/network/policy를 하나의 membership 상태로 뭉개지 않고 canonical 조합과 recovery CTA를 제공한다.
- 대표 조합은 full=`TAV-FULL + TMB-FAILED + TFR-FULL + CHA-LOCKED`, network=`TAV-OPEN + TMB-FAILED + TFR-NETWORK + CHA-LOCKED`, cancelled=`TAV-CANCELLED + TMB-LEFT + TFR-CANCELLED + CHA-LOCKED`다. 시간이 지난 Table은 `TAV-CLOSED`와 정책 설명을 쓰며 새 비정규 `TBL-EXPIRED` 상태를 만들지 않는다.
- local `blob:` preview를 업로드 완료 또는 영구 저장으로 표시하지 않는다.
- 이미지 최대 10MB, 허용 MIME만 통과시키고 실패·재시도·교체·삭제 확인 상태를 제공한다.
- `purpose=local_signal`은 `FL-012`의 contribution photo, `purpose=chat_image`는 `FL-003`의 message attachment다. fixture·analytics·copy를 공유해도 서로의 완료 증거로 계산하지 않는다.
- Local Signal 성공은 유효한 현장 증거일 때 Visit, 유효한 정보 제출일 때 Contribution만 올린다. 이 flow에서는 stamp·Meetup·Person·Age를 변경하지 않는다. cancel/failure/duplicate도 모두 불변이다.
- simulation 메시지는 앱 재시작 후 영구 보존을 약속하지 않는다.
- 신고·나가기 CTA는 최소 확인 modal과 복귀 상태가 있어야 한다.

---

## 10. Reputation, visit, stamp 계약

```ts
export type ReputationAxis = "identity" | "visit" | "contribution" | "meetup"
export type ReputationAxisState =
  | "REP-IDENTITY-UNVERIFIED"
  | "REP-IDENTITY-VERIFIED"
  | "REP-VISIT-NEW"
  | "REP-VISIT-RECENT"
  | "REP-VISIT-REPEAT"
  | "REP-CONTRIBUTION-NEW"
  | "REP-CONTRIBUTION-HELPFUL"
  | "REP-CONTRIBUTION-ESTABLISHED"
  | "REP-MEETUP-NEW"
  | "REP-MEETUP-RELIABLE"
  | "REP-MEETUP-ESTABLISHED"

export interface ReputationAxisSnapshot {
  axis: Exclude<ReputationAxis, "identity">
  state: Exclude<ReputationAxisState, "REP-IDENTITY-UNVERIFIED" | "REP-IDENTITY-VERIFIED">
  eventCount: number
  lastEventAt?: ISODateTime
}

export interface IdentityReferenceSnapshot {
  axis: "identity"
  state: Extract<ReputationAxisState, "REP-IDENTITY-UNVERIFIED" | "REP-IDENTITY-VERIFIED">
  derivedFrom: "PersonVerificationState"
}

export interface ReputationEvent {
  id: `EVT-REP-${string}`
  accountId: string
  axis: Exclude<ReputationAxis, "identity">
  delta: number
  reason: "verified_visit" | "useful_update" | "meetup_completed"
  occurredAt: ISODateTime
  provenance: Provenance
}

export interface StampProgress {
  state:
    | "STM-N00" | "STM-N01" | "STM-N02" | "STM-N03" | "STM-N04" | "STM-N05"
    | "STM-N06" | "STM-N07" | "STM-N08" | "STM-N09" | "STM-N10"
  count: number
  milestone: 10
  justReachedMilestone: boolean
  eligibleForSouvenirBadge: boolean
  provenance: Provenance
}
```

- 첫 현장 미션 `FL-012`는 유효한 현장 증거가 있을 때 `visit`, 유효한 신호 기여가 있을 때 `contribution`만 올린다. `meetup`은 `FL-003`의 Table 체크인·완료·피드백 뒤에만 올리고, `identity`는 어떤 reputation event로도 올리지 않는다.
- `REP-IDENTITY-*`는 `PersonVerificationState`에서 읽기 전용으로 파생한다. identity ReputationEvent·delta·eventCount를 만들지 않는다.
- 합산 `trustScore`, `safetyScore`, `localScore` 필드를 만들지 않는다.
- 부정 이벤트, 성인 여부, 국적, KYC 결과를 공개 NFT metadata에 기록하지 않는다.

---

## 11. Payment와 Labs 계약

```ts
export interface LabsState {
  enabled: boolean
  entry: "id_settings" | "milestone" | "direct_url"
  truth: ExecutionTruth
  warningAcknowledged: boolean
}

export interface SignerConnection {
  kind: "sui_zklogin"
  status: "WAL-DISCONNECTED" | "WAL-CONNECTING" | "WAL-READY" | "WAL-FAILED"
  suiAddress?: string
  network: "testnet"
  provenance: Provenance
}

export type AssetViewState = "AST-READY" | "AST-STALE" | "AST-ERROR"

export interface AssetBalance {
  assetId: string
  status: AssetViewState
  symbol: "USDC" | "USDT" | "OOKRW"
  chain: "sui" | "omnione"
  representation: "native" | "wrapped" | "test_token"
  issuerOrContract?: string
  availableAtomic: string
  reservedAtomic: string
  pendingAtomic: string
  decimals: number
  estimatedUsd?: { value: string; quoteAt: ISODateTime; sourceId: string }
  provenance: Provenance
}

export interface CheckoutState {
  id: string
  venueId: string
  displayPrice: { value: string; currency: "KRW" }
  settlementSimulation: {
    amountAtomic: string
    asset: "OOKRW"
    representation: "test_token"
    truth: "SIMULATED"
  }
  status:
    | "PAY-IDLE"
    | "PAY-CONFIRMING"
    | "PAY-PROCESSING"
    | "PAY-SIMULATED-SUCCESS"
    | "PAY-FAILED"
    | "PAY-CANCELLED"
  duplicateGuardKey: string
  paymentKycStatus: PaymentKycState["status"]
  visitEvidenceId?: string
  provenance: Provenance
}

export interface BridgeOperation {
  id: string
  source: { chain: "sui" | "omnione"; assetId: string; txRef?: string }
  destination: { chain: "sui" | "omnione"; assetId: string; txRef?: string }
  amountAtomic: string
  status:
    | "BRG-IDLE"
    | "BRG-QUOTED"
    | "BRG-CONFIRMING"
    | "BRG-PENDING"
    | "BRG-SIMULATED-SUCCESS"
    | "BRG-FAILED"
    | "BRG-CANCELLED"
  phase:
    | "BRP-NONE"
    | "BRP-SOURCE-SUBMITTED"
    | "BRP-SOURCE-CONFIRMED"
    | "BRP-RELAYING"
    | "BRP-DESTINATION-CONFIRMED"
  provenance: Provenance
}

export interface SouvenirBadgeMint {
  status:
    | "NFT-LOCKED"
    | "NFT-ELIGIBLE"
    | "NFT-OPTED-IN"
    | "NFT-MINTING"
    | "NFT-MINTED"
    | "NFT-FAILED"
  publicMetadata: { title: string; milestoneCount: 10 }
  txRef?: string
  provenance: Provenance
}
```

### Labs 제한

- `sui_zklogin` 연결은 Sui address와 signer만 제공한다. Account/KYC/multichain wallet 필드를 채우지 않는다.
- `phase=source_confirmed`는 bridge 완료가 아니다. `phase=destination_confirmed`와 별도다.
- `SIMULATED` bridge는 tx hash처럼 보이는 임의 문자열을 실제 explorer에 연결하지 않는다.
- OOKRW는 `test_token`; `KRW redeemable`, `stablecoin`, `1:1 guaranteed`로 모델링하지 않는다.
- `network=testnet`은 대상 network다. 실제 공개 testnet transaction evidence가 없으면 `truth=TESTNET`으로 승격하지 않고 exact truth copy `Target network: Sui Testnet · Simulated`로 표시한다.
- checkout의 사용자 가격은 KRW로 표시하고 OOKRW는 별도의 **settlement simulation test token**으로만 표시한다. 환율·상환·실제 merchant settlement를 암시하지 않는다.
- `PAY-SIMULATED-SUCCESS`는 mock receipt만 만든다. stamp는 그대로이며, 별도 unique `VisitEvidence` 검증 후에만 `STM-N09 → STM-N10`이 가능하다.
- checkout은 단일 mock flow이며 실제 merchant settlement, refund, chargeback을 증명하지 않는다.
- OmniOne merchant contract는 `OfferRegistry`, `BenefitRedemption`, `EvidenceAnchor` 같은 제한적 receipt adapter로만 다룬다. 전체 상점 이용 가능성 보증이 아니다.
- AMM swap·pool·price impact·liquidity는 `Deferred`다. 9시간 후보에는 실행 CTA, 성공 fixture, 잔고 mutation을 만들지 않는다.
- bridge negative contract: source-confirmed만으로 destination success 금지, 만료 quote 제출 금지, amount/asset/chain mismatch 거절, duplicate operation idempotent, failure/cancel 시 모든 실제·demo balance 불변.
- merchant negative contract: venue/offer/policy version mismatch, stale/expired receipt, unknown/error trait는 eligible·redeemed로 승격하지 않는다.

---

## 12. 최소 fixture registry

| Fixture ID | Domain | Truth | Scenario | 설명 |
|---|---|---|---|---|
| `FX-MAP-KOREA`, `FX-MAP-GROWING` | Map/ONDO | `SIMULATED` | `SCN-001-GUEST-DISCOVER` | 전국 overview와 숫자 없는 Growing 지역 |
| `FX-MAP-SEOUL-RECENT` | Map/ONDO | `SIMULATED` | `SCN-001-GUEST-DISCOVER` | 서울 complete; 최근 검증 fixture이며 실시간을 뜻하지 않음 |
| `FX-MAP-BUSAN-SEED` | Map/ONDO | `SIMULATED` | `SCN-001-GUEST-DISCOVER` | 부산 seed |
| `FX-MAP-TILE-FAIL` | Map failure | `SIMULATED` | `SCN-001-GUEST-DISCOVER` | tile timeout + 목록 fallback |
| `FX-MAP-LOCATION-DENIED` | Geolocation failure | `SIMULATED` | `SCN-001-GUEST-DISCOVER` | 현재 공개 지도·목록 유지, 설정 안내 |
| `FX-VENUE-SEOUL-001` | Venue entity | `SIMULATED` | `SCN-001-GUEST-DISCOVER` | Hero 장소의 좌표·ONDO 근거·가격·식이·예약·언어·카드 fact |
| `FX-ONB-FIRST`, `FX-ONB-SHORT`, `FX-ONB-KOREAN`, `FX-ONB-RESIDENT` | Onboarding | `SIMULATED` | `SCN-011-ONBOARD-SHORT`, `SCN-012-ONBOARD-KOREAN`, `SCN-013-ONBOARD-RESIDENT` | first + 3 persona, verification 없음 |
| `FX-ACC-START`, `FX-ACC-SUCCESS`, `FX-ACC-CANCEL`, `FX-ACC-FAIL` | Account | `SIMULATED` | `SCN-002-ACCOUNT-RETURN` | pending/success/cancel/failure |
| `FX-SAVE-PENDING`, `FX-SAVE-SUCCESS`, `FX-SAVE-FAIL` | Save / My Korea | `SIMULATED` | `SCN-002-ACCOUNT-RETURN` | saving/saved/failed와 retry |
| `FX-PER-PASSPORT-PENDING` | Passport provider | `SIMULATED` | `SCN-003-TOURIST-AFTER19` | person proof pending |
| `FX-PER-PASSPORT-SUCCESS` | Passport provider | `SIMULATED` | `SCN-003-TOURIST-AFTER19` | person proof 성공 fixture |
| `FX-AGE-SUCCESS` | Age proof | `SIMULATED` | `SCN-003-TOURIST-AFTER19` | `AGE-VERIFIED` fixture |
| `FX-PER-PASSPORT-FAIL` | Passport provider | `SIMULATED` | `SCN-003-TOURIST-AFTER19` | 실패 |
| `FX-AGE-PENDING`, `FX-AGE-FAIL`, `FX-AGE-EXPIRED` | Age proof | `SIMULATED` | `SCN-003-TOURIST-AFTER19` | pending/failure/expiry |
| `FX-A19-AUTO-READY`, `FX-A19-AUTO-ON`, `FX-A19-MANUAL-OFF`, `FX-A19-RESET` | After19 | `SIMULATED` | `SCN-003-TOURIST-AFTER19` | 4 guard, off, remount/reset |
| `FX-PER-CX-PENDING`, `FX-PER-CX-SUCCESS`, `FX-PER-CX-CANCEL`, `FX-PER-CX-FAIL`, `FX-PER-CX-EXPIRED` | CX Mobile ID | `SIMULATED` | `SCN-007-KOREAN-CX` | 전체 terminal 분기 |
| `FX-PER-RESIDENCE-PENDING`, `FX-PER-RESIDENCE-SUCCESS`, `FX-PER-RESIDENCE-FAIL` | Residence Card | `SIMULATED` | `SCN-008-RESIDENCE-SUPPORTED` | pending/success/failure |
| `FX-PER-RESIDENCE-UNSUPPORTED` | Residence Card | `NOT_CONFIGURED` | `SCN-009-RESIDENCE-UNAVAILABLE` | 미지원·대체 경로 |
| `FX-PKY-PENDING`, `FX-PKY-SUCCESS`, `FX-PKY-FAIL` | Payment KYC | `SIMULATED` | `SCN-015-PAYMENT-KYC` | pending/verified/failed; age와 별도 |
| `FX-PUB-EDIT`, `FX-PUB-SAVE-SUCCESS`, `FX-PUB-SAVE-FAIL` | Public profile | `SIMULATED` | `SCN-004-TABLE-CHAT` | field별 self-declared consent와 save failure |
| `FX-TBL-SEOUL-DINNER`, `FX-TBL-ALCOHOL` | Table availability | `SIMULATED` | `SCN-004-TABLE-CHAT` | ordinary/alcohol table |
| `FX-TBL-JOIN-SUCCESS`, `FX-TBL-JOIN-FAIL`, `FX-TBL-CANCEL` | Membership | `SIMULATED` | `SCN-004-TABLE-CHAT` | join terminal 분기 |
| `FX-TBL-CHECKIN-SUCCESS`, `FX-TBL-COMPLETE` | Visit/Table | `SIMULATED` | `SCN-004-TABLE-CHAT`, `SCN-006-STAMP-MILESTONE` | unique check-in과 completion |
| `FX-MSG-TEXT-PENDING`, `FX-MSG-TEXT-SUCCESS`, `FX-MSG-TEXT-FAIL` | Chat text | `SIMULATED` | `SCN-004-TABLE-CHAT` | pending/sent/fail |
| `FX-MSG-IMAGE-PENDING`, `FX-MSG-IMAGE-SUCCESS`, `FX-MSG-IMAGE-FAIL` | Chat image | `SIMULATED` | `SCN-004-TABLE-CHAT` | pending/sent/fail/retry |
| `FX-UPL-PHOTO-PREVIEW`, `FX-UPL-PHOTO-REMOVED`, `FX-UPL-LOCAL-SIGNAL-SUCCESS`, `FX-UPL-LOCAL-SIGNAL-FAIL` | Local Signal photo | `SIMULATED` | `SCN-014-LOCAL-SIGNAL` | local preview/remove 및 제출 분기; 영구 업로드 없음 |
| `FX-PAY-OOKRW-QUOTE`, `FX-PAY-PROCESSING`, `FX-PAY-SUCCESS`, `FX-PAY-FAIL`, `FX-PAY-CANCEL` | Checkout | `SIMULATED` | `SCN-005-CHECKOUT-LABS` | KRW price/OOKRW settlement simulation; stamp 불변 |
| `FX-REP-BEFORE`, `FX-REP-AFTER` | Reputation | `SIMULATED` | `SCN-004-TABLE-CHAT`, `SCN-014-LOCAL-SIGNAL` | 행동 축만 변화 |
| `FX-STM-09`, `FX-STM-10` | Stamp | `SIMULATED` | `SCN-006-STAMP-MILESTONE` | 결제와 독립된 unique visit로만 9→10 milestone |
| `FX-EVD-VALID`, `FX-EVD-STALE`, `FX-EVD-ERROR` | Evidence adapters | `CONTRACT_ONLY` | `SCN-001-GUEST-DISCOVER`, `SCN-010-LABS-BRIDGE` | OpenDID/EAS separate mapping |
| `FX-TRT-ELIGIBLE`, `FX-TRT-INELIGIBLE`, `FX-TRT-STALE`, `FX-TRT-ERROR` | Merchant trait | `CONTRACT_ONLY` | `SCN-001-GUEST-DISCOVER` | policy-scoped receipt와 negative state |
| `FX-WAL-LABS-CONNECTING`, `FX-WAL-LABS-READY`, `FX-WAL-LABS-FAIL`, `FX-WAL-LABS-DISCONNECT` | zkLogin signer | `SIMULATED` | `SCN-010-LABS-BRIDGE` | signer terminal 분기 |
| `FX-BRG-QUOTE`, `FX-BRG-CONFIRM`, `FX-BRG-SOURCE-SUBMITTED`, `FX-BRG-SOURCE-CONFIRMED`, `FX-BRG-RELAYING`, `FX-BRG-DESTINATION-CONFIRMED`, `FX-BRG-CANCEL`, `FX-BRG-SIM-FAIL` | Bridge | `SIMULATED` | `SCN-010-LABS-BRIDGE` | 단계별 progression/negative; 실제 자산 불변 |
| `FX-NFT-OPT-IN`, `FX-NFT-MINT-PENDING`, `FX-NFT-MINT-SUCCESS`, `FX-NFT-MINT-FAIL` | Badge | `SIMULATED` | `SCN-006-STAMP-MILESTONE` | opt-in 이후 simulated mint |

동일 ID로 성공과 실패를 모두 표현하지 않는다. 테스트가 특정 fixture를 명시적으로 선택할 수 있어야 한다.

`PKY-EXPIRED`는 새 alias fixture를 만들지 않고 `FX-PKY-SUCCESS.expiresAt` 이후로 고정 clock을 이동해 재현한다. retry는 같은 `FX-PKY-PENDING`으로 돌아가며 Age·Person provenance는 불변이다.

---

## 13. Persistence와 reset

| 상태 | 기본 저장 | Reset |
|---|---|---|
| `ondo.preferences.v3`: locale, guideSeen, autoNight, savedVenueIds, discoveryPreferences | localStorage | Settings 또는 QA reset |
| `ondo.session.v3`: onboarding, persona, account, person, age, ageExpiresAt, paymentKyc, after19, gate, gateState, tableMembershipById, reputation, acceptedActivityEventKeys, stamps, profile | sessionStorage, 비민감 demo session + one active allowlisted gate envelope | expiry / Sign out / tab close / QA reset; gate는 success/cancel/invalid/expiry 때 `null` |
| `ondo.chat.v2` | sessionStorage, preview URL을 제거한 chat simulation item | session end / QA reset |
| `ondo.table-outcomes.v2` | sessionStorage, Table simulation outcome/receipt | session end / QA reset |
| `ondo.labs.v2` | sessionStorage, 비민감 Labs acknowledgement와 simulation state | session end / QA reset |
| `ondo.accepted-visits.v2` | sessionStorage, 중복 방지용 공개 evidence ID | session end / QA reset |
| raw photo/blob/object URL | memory only | remove / route unmount / session end |
| reputation, stamp | sessionStorage의 비민감 fixture scenario; future server는 event/receipt | session end / QA reset |
| Labs acknowledgement | sessionStorage | session end |
| bridge/mint simulation | session/scenario store, 실제 잔고와 분리 | QA reset |

실제 credential, 생년월일, 국적 원문, passport image, face image, 사진/blob, payment instrument, raw provider response, private key, access token을 browser storage에 넣지 않는다. URL에는 city/neighborhood/venue/filter 같은 공개 discovery context만 둔다.

---

## 14. Fixture → API 교체 규칙

1. component는 `DataAdapter`와 canonical DTO만 import한다.
2. provider raw response는 `adapters/<provider>/map*.ts`에서 canonical DTO로 변환한다.
3. fixture adapter와 API adapter는 동일 contract test를 통과한다.
4. API가 미설정이면 자동 성공 fixture로 fallback하지 않는다. `NOT_CONFIGURED` 상태를 반환한다.
5. fixture와 API를 섞는 hybrid 화면은 각 데이터 행/영역에 provenance를 보존한다.
6. AbortSignal, timeout, retryability, stale previous data를 지원한다.
7. analytics event에는 fixture ID와 `truth`를 포함하되 PII를 포함하지 않는다.

### Contract test 최소 항목

구현 script 계약은 `pnpm test:contracts`다. 실행 중 최소 **staging 산출물**은 `artifacts/qa/contracts/contract-data.json`과 `artifacts/qa/contracts/junit.xml`이며 각 case는 아래 ID를 test title에 그대로 사용한다.

`artifacts/qa/**/*.json`, JUnit XML, Playwright report 같은 raw QA 파일은 실행·재시도를 위한 staging 진단 자료다. 개별 raw 파일, 터미널 출력 또는 임시 report를 gate의 source of truth로 사용하지 않는다. 지속 가능한 gate 판정의 유일한 source of truth는 Root가 작성하는 `docs/ondo-execution/evidence/<RUN_ID>/manifest.md`다. manifest에는 실행 commit SHA, 명령, 시각, exact test ID별 결과, staging artifact의 상대 경로와 digest, screenshot/evidence 경로, reviewer와 최종 판정을 기록한다. raw artifact가 존재해도 manifest에 연결·해시·판정되지 않으면 gate 증거로 인정하지 않는다.

| Test ID | 불변식 |
|---|---|
| `CONTRACT-DATA-001` | malformed/out-of-Korea geometry 거절; cluster/spiderfy가 source coordinate를 변경하지 않음 |
| `CONTRACT-DATA-002` | heat score 정수 0..100; minimum sample 미달은 score null + limited; stale을 live로 승격 금지 |
| `CONTRACT-DATA-003` | v3 gate allowlist, 15분 expiry, one-shot consume, invalid token의 안전한 기본 surface fallback |
| `CONTRACT-DATA-004` | Account/Person/Age/Payment KYC 독립; age proof가 Payment KYC provenance·status를 변경하지 않음; zkLogin signer 연결이 Account·KYC·타 체인 자산을 만들거나 변경하지 않음 |
| `CONTRACT-DATA-005` | OpenDID/EAS raw input은 서로 다른 adapter·validator를 거쳐 동일 canonical envelope로만 매핑 |
| `CONTRACT-DATA-006` | expired/invalid evidence와 unsupported CX credential이 valid/verified가 되지 않음 |
| `CONTRACT-DATA-007` | `TMB-CONFIRMED` 전 Guest와 Account non-member의 chat read/write 모두 거절; `TAV-*`/`TMB-*`/`TFR-*`/`CHA-*` 분리 |
| `CONTRACT-DATA-008` | local-signal photo와 chat image fixture/evidence 분리; blob preview가 uploaded가 되지 않음 |
| `CONTRACT-DATA-009` | first mission은 실제 행동 축만 변경; identity ReputationEvent 생성 불가 |
| `CONTRACT-DATA-010` | KRW display price/OOKRW settlement simulation 분리; payment success로 stamp 불변; unique visit만 9→10 |
| `CONTRACT-DATA-011` | bridge는 source-submitted→source-confirmed→relaying→destination-confirmed 순서를 지키고 destination-confirmed에서만 simulated success; 만료 quote·mismatch·duplicate·failure/cancel negative contract |
| `CONTRACT-DATA-012` | merchant receipt venue/offer/policy/expiry mismatch와 stale/error는 eligible/redeemed 금지 |
| `CONTRACT-DATA-013` | USDC/USDT/OOKRW 원장 entry 분리; Estimated USD만 별도 계산 |
| `CONTRACT-DATA-014` | AMM은 Deferred: adapter export·success fixture·실행 CTA·balance mutation 0 |
| `CONTRACT-DATA-015` | 모든 fixture 응답은 registry의 canonical truth와 fixtureId를 보존; `SIMULATED`만 `isSimulation=true`, `CONTRACT_ONLY`·`NOT_CONFIGURED`는 각 truth와 `isSimulation=false` |
| `CONTRACT-DATA-016` | 세 persona onboarding success/skip/failure가 map에 도착하고 verification state를 올리지 않음 |

---

## 15. 금지 필드·금지 shortcut

다음 이름은 구현에 사용하지 않는다.

```text
isVerified                 // 무엇이 확인됐는지 불명확
trustScore / safetyScore   // 분리 평판을 잘못 합산
liveHeat                   // 실제 live source 없이는 금지
usdBalance                 // 서로 다른 asset을 단일 잔고로 오인
isMultichainWallet         // zkLogin 결과로 추론 금지
easBackedOpenDid           // 사실 아님
bridgeComplete             // source/destination 분리 없음
nftIdentity                // 공개 민감정보 결합 위험
nationalityFromKycPublic   // 동의 없는 공개 금지
displayLatitude/Longitude  // source geometry를 옮기는 shortcut 금지
```

대신 domain-specific 상태와 provenance를 사용한다.

---

## 16. 완료 체크리스트

- [ ] `FL-001`~`FL-018` 중 release 대상 flow에 `SCN-*`, canonical `FX-*`, success/cancel/failure/returnTo가 연결됨
- [ ] `REQ-001~019` 소비 화면이 canonical DTO만 사용함
- [ ] success·empty·error·expired·unsupported 상태가 fixture로 재현됨
- [ ] 지도 source coordinate와 cluster display state가 분리됨
- [ ] ONDO score/freshness/confidence/signal count가 분리됨
- [ ] Account/Person/19+/Payment KYC/Reputation이 분리됨
- [ ] Local Signal photo와 chat image가 분리되고 각각 pending·failed·retry/remove가 존재함
- [ ] stable asset/bridge/mint가 Labs와 truth label로 격리됨
- [ ] OpenDID/EAS/zkLogin에 잘못된 상속·대체 관계가 없음
- [ ] `pnpm test:contracts`와 `CONTRACT-DATA-001`~`016` staging artifact의 경로·digest·판정이 durable `docs/ondo-execution/evidence/<RUN_ID>/manifest.md`에 기록되고 As-built가 그 manifest를 참조함
