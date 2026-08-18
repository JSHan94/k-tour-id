# ONDO 19개 요구사항 추적표

상태: `CANDIDATE · CODE AND QA COMPLETE`
최종 갱신: `2026-08-19`
Owner: Root Integrator

이 문서는 승인된 19개 요구가 결정·Flow·State·Fixture·Test·Screenshot·Commit·QA·As-built로 끊김 없이 이어지는지 관리하는 source of truth다.

- 제품 범위: [PRD](./01_PRD_9H.md)
- 승인 결정: [Decision Ledger](./02_DECISION_LEDGER.md)
- Flow: [Flow Catalog](./03_FLOW_CATALOG.md)
- State: [State Model](./04_STATE_MODEL.md)
- Fixture/API: [Data Contracts](./05_DATA_ADAPTER_CONTRACTS.md)
- Test: [QA Plan](./08_QA_ACCEPTANCE_PLAN.md)
- 실제 결과: [As-built](./13_AS_BUILT.md)

---

## 1. 사용 규칙

1. REQ ID의 원문 의미와 번호는 바꾸거나 재사용하지 않는다.
2. 구현 전에 `목표 등급`, Flow, State, Fixture, Test가 모두 있어야 한다.
3. 구현 중에는 `Code`, `Commit`, `Screenshot`, QA 1·2를 갱신한다.
4. 완료 시 `As-built`를 `Implemented / Simulated / Contract-only / Deferred / Removed after QA` 중 하나로 판정한다.
5. 목표 등급과 실제 결과가 다르면 숨기지 않고 차이와 이유를 기록한다.
6. 하나의 Test가 여러 REQ를 증명할 수 있으나 각 REQ에는 최소 하나의 blocking 또는 manual evidence가 있어야 한다.
7. Master Matrix에는 wildcard, 범위, slash 합성 ID를 쓰지 않는다. State·Fixture·Test·Screenshot은 registry의 exact ID만 쓴다.
8. `SPEC READY`에서는 Code·Commit은 `Not started`, QA는 `Not run`, As-built는 `Not evaluated`일 수 있다. 실행 종료 때 이 값을 실제 증거로 모두 교체한다.

표의 `Owner`는 구현 slice owner다. 공통 type·route·test harness·release evidence는 Root가 소유한다.

---

## 2. Master Traceability Matrix

| REQ | 승인 요구·결정 | Frontend depth | External truth | Owner | Exact Flow / Screen | Exact State | Exact Scenario / Fixture | Exact Test / Screenshot | Code / Commit | QA 1 / QA 2 / QA 3 | As-built |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `REQ-001` | 한국인은 필요한 순간 CX Mobile ID를 거치고 Guest 지도는 선행 차단하지 않음. | `Simulated` | `SIMULATED` | Identity | `FL-005`; `SCR-ONB`, `SCR-ID`, `SCR-MAP` | `ACC-ACTIVE`, `PER-PENDING`, `PER-VERIFIED`, `PER-FAILED`, `PER-EXPIRED` | `SCN-007-KOREAN-CX`; `FX-PER-CX-PENDING`, `FX-PER-CX-SUCCESS`, `FX-PER-CX-CANCEL`, `FX-PER-CX-FAIL`, `FX-PER-CX-EXPIRED` | `E2E-CORE-07`, `E2E-ID-01`, `E2E-ID-02`, `CONTRACT-DATA-006`; `PX-016`, `VIS-FLOW-06` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-002` | Residence Card 지원·미지원·대체 경로를 보이고 지도는 유지. | `Simulated` | `SIMULATED`, `NOT_CONFIGURED` | Identity | `FL-006`, `FL-009`; `SCR-ONB`, `SCR-ID`, `SCR-MAP` | `ONB-COMPLETE`, `PER-PENDING`, `PER-VERIFIED`, `PER-UNSUPPORTED`, `PER-FAILED` | `SCN-008-RESIDENCE-SUPPORTED`, `SCN-009-RESIDENCE-UNAVAILABLE`, `SCN-013-ONBOARD-RESIDENT`; `FX-ONB-RESIDENT`, `FX-PER-RESIDENCE-PENDING`, `FX-PER-RESIDENCE-SUCCESS`, `FX-PER-RESIDENCE-FAIL`, `FX-PER-RESIDENCE-UNSUPPORTED` | `E2E-CORE-08`, `E2E-ID-03`, `E2E-ONB-03`, `CONTRACT-DATA-006`, `CONTRACT-DATA-016`; `PX-010`, `PX-017`, `VIS-ONB-01`, `VIS-FLOW-07` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-003` | Passport simulation과 첫 미션을 분리하고 첫 미션은 Visit·Contribution만 변경. | `Simulated` | `SIMULATED` | Identity + Connect | `FL-002`, `FL-007`, `FL-012`; `SCR-ONB`, `SCR-ID`, `SCR-VENUE`, `SCR-MY` | `PER-PENDING`, `PER-VERIFIED`, `PER-FAILED`, `UPL-PREVIEW`, `UPL-FAILED`, `REP-VISIT-NEW`, `REP-VISIT-RECENT`, `REP-CONTRIBUTION-NEW`, `REP-CONTRIBUTION-HELPFUL` | `SCN-003-TOURIST-AFTER19`, `SCN-011-ONBOARD-SHORT`, `SCN-014-LOCAL-SIGNAL`; `FX-PER-PASSPORT-PENDING`, `FX-PER-PASSPORT-SUCCESS`, `FX-PER-PASSPORT-FAIL`, `FX-UPL-LOCAL-SIGNAL-SUCCESS`, `FX-UPL-LOCAL-SIGNAL-FAIL`, `FX-REP-BEFORE`, `FX-REP-AFTER` | `E2E-ID-04`, `E2E-SIGNAL-01`, `E2E-SIGNAL-02`, `E2E-SIGNAL-03`, `E2E-SIGNAL-04`, `E2E-TRUST-01`, `CONTRACT-DATA-008`, `CONTRACT-DATA-009`; `PX-010`, `PX-011`, `PX-013`, `VIS-ONB-01`, `VIS-FLOW-01`, `VIS-FLOW-03` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-004` | OpenDID와 EAS 입력은 별도 adapter로 canonical Evidence Envelope에 정규화. | `Contract-only` | `CONTRACT_ONLY` | Root contract; Identity adapter; Connect consumer | `FL-016`, `FL-018`; `SCR-ID`, `SCR-LABS` | `EVD-UNKNOWN`, `EVD-LOADING`, `EVD-VALID`, `EVD-STALE`, `EVD-INVALID`, `EVD-ERROR` | `SCN-010-LABS-BRIDGE`; `FX-EVD-VALID`, `FX-EVD-STALE`, `FX-EVD-ERROR` | `E2E-LABS-01`, `CONTRACT-DATA-005`, `CONTRACT-DATA-006`, `MANUAL-TRUTH-01`; `PX-018`, `PX-025`, `VIS-LABS-01` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-005` | Guest·Account·Person·19+·Payment KYC를 분리하고 zkLogin은 Labs signer로만 사용. | `Implemented` | `SIMULATED` | Identity primary; Root contract; Map save consumer | `FL-007`, `FL-008`, `FL-009`, `FL-010`, `FL-011`, `FL-013`, `FL-017`, `FL-018`; `SCR-ONB`, `SCR-ID`, `SCR-LABS`, `SCR-MY` | `ONB-NEW`, `ONB-IN-PROGRESS`, `ONB-COMPLETE`, `ACC-GUEST`, `ACC-CREATING`, `ACC-ACTIVE`, `ACC-FAILED`, `SAV-IDLE`, `SAV-SAVING`, `SAV-SAVED`, `SAV-FAILED`, `PER-UNVERIFIED`, `PER-VERIFIED`, `AGE-UNVERIFIED`, `AGE-VERIFIED`, `PKY-NOT-STARTED`, `PKY-VERIFIED`, `WAL-DISCONNECTED`, `WAL-READY` | `SCN-002-ACCOUNT-RETURN`, `SCN-003-TOURIST-AFTER19`, `SCN-011-ONBOARD-SHORT`, `SCN-012-ONBOARD-KOREAN`, `SCN-013-ONBOARD-RESIDENT`, `SCN-015-PAYMENT-KYC`; `FX-ACC-START`, `FX-ACC-SUCCESS`, `FX-ACC-CANCEL`, `FX-ACC-FAIL`, `FX-SAVE-PENDING`, `FX-SAVE-SUCCESS`, `FX-SAVE-FAIL`, `FX-AGE-SUCCESS`, `FX-PKY-SUCCESS`, `FX-WAL-LABS-READY` | `E2E-AUTH-01`, `E2E-AUTH-02`, `E2E-AUTH-03`, `E2E-AUTH-04`, `E2E-AUTH-05`, `E2E-MAP-04`, `E2E-PKY-01`, `E2E-PKY-02`, `E2E-PKY-03`, `E2E-PKY-04`, `CONTRACT-DATA-003`, `CONTRACT-DATA-004`, `CONTRACT-DATA-016`; `PX-010`, `PX-011`, `PX-018`, `VIS-ONB-01`, `VIS-FLOW-01`, `VIS-LABS-01` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-006` | 자산은 분리하고 bridge는 simulation; AMM은 Deferred. | `Simulated` | `SIMULATED` | Connect | `FL-018`; `SCR-LABS` | `AST-READY`, `AST-STALE`, `AST-ERROR`, `WAL-DISCONNECTED`, `WAL-CONNECTING`, `WAL-READY`, `WAL-FAILED`, `BRG-IDLE`, `BRG-QUOTED`, `BRG-CONFIRMING`, `BRG-PENDING`, `BRG-SIMULATED-SUCCESS`, `BRG-FAILED`, `BRG-CANCELLED`, `BRP-NONE`, `BRP-SOURCE-SUBMITTED`, `BRP-SOURCE-CONFIRMED`, `BRP-RELAYING`, `BRP-DESTINATION-CONFIRMED` | `SCN-010-LABS-BRIDGE`; `FX-WAL-LABS-CONNECTING`, `FX-WAL-LABS-READY`, `FX-WAL-LABS-FAIL`, `FX-WAL-LABS-DISCONNECT`, `FX-BRG-QUOTE`, `FX-BRG-CONFIRM`, `FX-BRG-SOURCE-SUBMITTED`, `FX-BRG-SOURCE-CONFIRMED`, `FX-BRG-RELAYING`, `FX-BRG-DESTINATION-CONFIRMED`, `FX-BRG-CANCEL`, `FX-BRG-SIM-FAIL` | `E2E-LABS-02`, `CONTRACT-DATA-011`, `CONTRACT-DATA-013`, `CONTRACT-DATA-014`, `CONTRACT-DATA-015`; `PX-018`, `PX-025`, `VIS-LABS-01` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-007` | 식음료 ONDO의 근거·최신성·표본을 분리하고 Limited에는 숫자를 만들지 않음. | `Implemented` | `SIMULATED` | Map primary; Connect signal producer | `FL-001`, `FL-012`; `SCR-MAP`, `SCR-VENUE` | `MAP-KOREA`, `MAP-SEOUL`, `MAP-BUSAN`, `MAP-GROWING`, `MAP-VENUE`, `MAP-FALLBACK`, `EVD-VALID`, `EVD-STALE`, `REP-CONTRIBUTION-NEW`, `REP-CONTRIBUTION-HELPFUL` | `SCN-001-GUEST-DISCOVER`, `SCN-014-LOCAL-SIGNAL`; `FX-MAP-KOREA`, `FX-MAP-SEOUL-RECENT`, `FX-MAP-BUSAN-SEED`, `FX-MAP-GROWING`, `FX-MAP-TILE-FAIL`, `FX-MAP-LOCATION-DENIED`, `FX-EVD-VALID`, `FX-EVD-STALE` | `E2E-CORE-01`, `E2E-CORE-02`, `E2E-MAP-01`, `E2E-MAP-02`, `E2E-MAP-03`, `E2E-MAP-04`, `E2E-MAP-05`, `E2E-SIGNAL-01`, `CONTRACT-DATA-001`, `CONTRACT-DATA-002`; `PX-001`, `PX-002`, `PX-003`, `PX-004`, `PX-005`, `PX-006`, `PX-007`, `VIS-MAP-01`, `VIS-MAP-02`, `VIS-MAP-03`, `VIS-MAP-04`, `VIS-MAP-05`, `VIS-HEAT-01`, `VIS-HEAT-02` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-008` | 장소·시간 기반 Table, 멤버 전용 대화, 체크인·피드백, 선택 공개 프로필. | `Implemented` | `SIMULATED` | Connect primary; Identity profile producer | `FL-003`, `FL-015`; `SCR-TABLE`, `SCR-CHAT`, `SCR-FEEDBACK`, `SCR-MY` | `TAV-OPEN`, `TAV-FULL`, `TAV-CLOSED`, `TAV-CANCELLED`, `TMB-NONE`, `TMB-REQUESTING`, `TMB-CONFIRMED`, `TMB-CHECKED-IN`, `TMB-COMPLETED`, `TMB-LEFT`, `TMB-FAILED`, `TFR-NONE`, `TFR-FULL`, `TFR-NETWORK`, `TFR-POLICY`, `TFR-CANCELLED`, `CHA-LOCKED`, `CHA-OPEN`, `PUB-PRIVATE`, `PUB-PARTIAL`, `PUB-EDITING`, `PUB-SAVE-FAILED`, `REP-MEETUP-NEW`, `REP-MEETUP-RELIABLE` | `SCN-004-TABLE-CHAT`; `FX-PUB-EDIT`, `FX-PUB-SAVE-SUCCESS`, `FX-PUB-SAVE-FAIL`, `FX-TBL-SEOUL-DINNER`, `FX-TBL-ALCOHOL`, `FX-TBL-JOIN-SUCCESS`, `FX-TBL-JOIN-FAIL`, `FX-TBL-CANCEL`, `FX-TBL-CHECKIN-SUCCESS`, `FX-TBL-COMPLETE`, `FX-REP-BEFORE`, `FX-REP-AFTER` | `E2E-CORE-05`, `E2E-TABLES-01`, `E2E-TABLES-02`, `E2E-TABLES-03`, `E2E-TABLES-04`, `E2E-CHAT-01`, `CONTRACT-DATA-007`, `CONTRACT-DATA-009`; `PX-012`, `PX-023`, `VIS-FLOW-02`, `VIS-CONNECT-01` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-009` | Local Signal 사진을 브라우저 로컬에서 선택·미리보기·교체·삭제·실패 처리. | `Simulated` | `SIMULATED` | Connect | `FL-012`; `SCR-VENUE`, `SCR-MY` | `UPL-IDLE`, `UPL-PREVIEW`, `UPL-SENDING`, `UPL-SENT`, `UPL-FAILED`, `UPL-REMOVED` | `SCN-014-LOCAL-SIGNAL`; `FX-UPL-PHOTO-PREVIEW`, `FX-UPL-PHOTO-REMOVED`, `FX-UPL-LOCAL-SIGNAL-SUCCESS`, `FX-UPL-LOCAL-SIGNAL-FAIL` | `E2E-MEDIA-01`, `E2E-SIGNAL-01`, `E2E-SIGNAL-02`, `E2E-SIGNAL-03`, `E2E-SIGNAL-04`, `CONTRACT-DATA-008`; `PX-013`, `VIS-FLOW-03` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-010` | Confirmed Table 멤버만 이미지 대화, pending·failed·retry 지원. | `Simulated` | `SIMULATED` | Connect | `FL-003`; `SCR-CHAT` | `CHA-LOCKED`, `CHA-OPEN`, `MSG-IDLE`, `MSG-SENDING`, `MSG-SENT`, `MSG-FAILED`, `UPL-PREVIEW`, `UPL-SENDING`, `UPL-SENT`, `UPL-FAILED` | `SCN-004-TABLE-CHAT`; `FX-MSG-IMAGE-PENDING`, `FX-MSG-IMAGE-SUCCESS`, `FX-MSG-IMAGE-FAIL` | `E2E-CORE-05`, `E2E-CHAT-01`, `E2E-MEDIA-02`, `E2E-MEDIA-03`, `CONTRACT-DATA-007`, `CONTRACT-DATA-008`; `PX-012`, `VIS-FLOW-02` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-011` | 가격은 KRW, OOKRW는 settlement test token; Payment KYC와 mock 결제, stamp 불변. | `Simulated` | `SIMULATED` | Connect | `FL-004`, `FL-017`; `SCR-VENUE`, `SCR-LABS` | `PKY-NOT-STARTED`, `PKY-PENDING`, `PKY-VERIFIED`, `PKY-FAILED`, `PKY-EXPIRED`, `PAY-IDLE`, `PAY-CONFIRMING`, `PAY-PROCESSING`, `PAY-SIMULATED-SUCCESS`, `PAY-FAILED`, `PAY-CANCELLED`, `STM-N09` | `SCN-005-CHECKOUT-LABS`, `SCN-015-PAYMENT-KYC`; `FX-PKY-PENDING`, `FX-PKY-SUCCESS`, `FX-PKY-FAIL`, `FX-PAY-OOKRW-QUOTE`, `FX-PAY-PROCESSING`, `FX-PAY-SUCCESS`, `FX-PAY-FAIL`, `FX-PAY-CANCEL`, `FX-STM-09` | `E2E-CORE-06`, `E2E-PKY-01`, `E2E-PKY-02`, `E2E-PKY-03`, `E2E-PKY-04`, `E2E-PAY-01`, `E2E-PAY-02`, `E2E-PAY-03`, `E2E-PAY-04`, `CONTRACT-DATA-004`, `CONTRACT-DATA-010`; `PX-014`, `PX-024`, `VIS-FLOW-04`, `VIS-COMMERCE-01` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-012` | 19+·미만료·KST 19시·auto on·세션 manual-off 아님일 때만 After19 자동 전환. | `Implemented` | `SIMULATED` | Identity primary; Map consumer | `FL-002`, `FL-013`, `FL-014`; `SCR-A19`, `SCR-MAP`, `SCR-ID` | `AGE-UNVERIFIED`, `AGE-PENDING`, `AGE-VERIFIED`, `AGE-FAILED`, `AGE-EXPIRED`, `PREF-AUTO-NIGHT-ON`, `PREF-AUTO-NIGHT-OFF`, `A19-OFF`, `A19-PROMPT`, `A19-ON`, `A19-MANUAL-OFF` | `SCN-003-TOURIST-AFTER19`; `FX-AGE-PENDING`, `FX-AGE-SUCCESS`, `FX-AGE-FAIL`, `FX-AGE-EXPIRED`, `FX-A19-AUTO-READY`, `FX-A19-AUTO-ON`, `FX-A19-MANUAL-OFF`, `FX-A19-RESET` | `E2E-CORE-03`, `E2E-CORE-04`, `E2E-AGE-01`, `E2E-AGE-02`, `E2E-AGE-03`, `E2E-AGE-04`, `E2E-AGE-05`; `PX-008`, `PX-011`, `VIS-HEAT-03`, `VIS-FLOW-01` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-013` | Can I Go를 없애고 해외카드·번호·예약·언어·연령을 장소 상세에 흡수. | `Implemented` | `CONTRACT_ONLY` | Map | `FL-001`, `FL-016`; `SCR-VENUE` | `TRT-UNKNOWN`, `TRT-ELIGIBLE`, `TRT-INELIGIBLE`, `TRT-STALE`, `TRT-ERROR`, `EVD-VALID`, `EVD-STALE`, `EVD-ERROR` | `SCN-001-GUEST-DISCOVER`; `FX-TRT-ELIGIBLE`, `FX-TRT-INELIGIBLE`, `FX-TRT-STALE`, `FX-TRT-ERROR`, `FX-EVD-VALID`, `FX-EVD-STALE`, `FX-EVD-ERROR` | `E2E-PLACE-01`, `E2E-LABS-03`, `CONTRACT-DATA-012`; `PX-004`, `VIS-MAP-04` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-014` | Merchant contract는 제한된 Offer·Policy·Redemption·Evidence receipt이며 안전·영업 전체를 보증하지 않음. | `Contract-only` | `CONTRACT_ONLY` | Connect primary; Map consumer; Identity adapter | `FL-016`, `FL-018`; `SCR-VENUE`, `SCR-LABS` | `TRT-UNKNOWN`, `TRT-ELIGIBLE`, `TRT-INELIGIBLE`, `TRT-STALE`, `TRT-ERROR`, `EVD-UNKNOWN`, `EVD-VALID`, `EVD-STALE`, `EVD-ERROR` | `SCN-010-LABS-BRIDGE`; `FX-TRT-ELIGIBLE`, `FX-TRT-INELIGIBLE`, `FX-TRT-STALE`, `FX-TRT-ERROR`, `FX-EVD-VALID`, `FX-EVD-STALE`, `FX-EVD-ERROR` | `E2E-LABS-03`, `CONTRACT-DATA-012`, `MANUAL-TRUTH-01`; `PX-004`, `PX-018`, `PX-025`, `VIS-MAP-04`, `VIS-LABS-01` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-015` | Identity·Visit·Contribution·Meetup을 분리하고 종합 안전 점수를 만들지 않음. | `Implemented` | `SIMULATED` | Identity + Connect | `FL-003`, `FL-012`, `FL-015`; `SCR-MY`, `SCR-FEEDBACK` | `REP-IDENTITY-UNVERIFIED`, `REP-IDENTITY-VERIFIED`, `REP-VISIT-NEW`, `REP-VISIT-RECENT`, `REP-VISIT-REPEAT`, `REP-CONTRIBUTION-NEW`, `REP-CONTRIBUTION-HELPFUL`, `REP-CONTRIBUTION-ESTABLISHED`, `REP-MEETUP-NEW`, `REP-MEETUP-RELIABLE`, `REP-MEETUP-ESTABLISHED` | `SCN-004-TABLE-CHAT`, `SCN-014-LOCAL-SIGNAL`; `FX-REP-BEFORE`, `FX-REP-AFTER` | `E2E-TABLES-03`, `E2E-SIGNAL-01`, `E2E-SIGNAL-04`, `E2E-TRUST-01`, `E2E-TRUST-02`, `CONTRACT-DATA-009`; `PX-012`, `PX-013`, `VIS-FLOW-02`, `VIS-FLOW-03` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-016` | 고유 방문 증거로 Stamp 9→10; NFT는 opt-in 기념 badge simulation. | `Implemented` | `SIMULATED` | Connect | `FL-004`, `FL-011`, `FL-018`; `SCR-MY`, `SCR-LABS` | `STM-N09`, `STM-N10`, `NFT-LOCKED`, `NFT-ELIGIBLE`, `NFT-OPTED-IN`, `NFT-MINTING`, `NFT-MINTED`, `NFT-FAILED` | `SCN-006-STAMP-MILESTONE`; `FX-STM-09`, `FX-STM-10`, `FX-NFT-OPT-IN`, `FX-NFT-MINT-PENDING`, `FX-NFT-MINT-SUCCESS`, `FX-NFT-MINT-FAIL` | `E2E-PAY-04`, `E2E-REWARD-01`, `CONTRACT-DATA-010`, `CONTRACT-DATA-015`; `PX-015`, `VIS-FLOW-05` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-017` | 전국 overview, 서울 complete, 부산 seed, 나머지는 숫자 없는 Growing. | `Implemented` | `SIMULATED` | Map | `FL-001`; `SCR-MAP` | `MAP-KOREA`, `MAP-SEOUL`, `MAP-BUSAN`, `MAP-GROWING`, `MAP-FALLBACK` | `SCN-001-GUEST-DISCOVER`; `FX-MAP-KOREA`, `FX-MAP-SEOUL-RECENT`, `FX-MAP-BUSAN-SEED`, `FX-MAP-GROWING`, `FX-MAP-TILE-FAIL`, `FX-MAP-LOCATION-DENIED` | `E2E-MAP-01`, `E2E-MAP-05`, `E2E-MAP-06`, `CONTRACT-DATA-001`, `CONTRACT-DATA-002`; `PX-001`, `PX-002`, `PX-005`, `PX-009`, `VIS-MAP-01`, `VIS-MAP-02`, `VIS-MAP-05`, `VIS-HEAT-04` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-018` | Next.js responsive web, KO/EN, keyboard·screen reader, 세 persona home 도착. | `Implemented` | `SIMULATED` | Root + all | `FL-001`, `FL-007`, `FL-008`, `FL-009`; `SCR-ONB`, `SCR-MAP`, `SCR-VENUE`, `SCR-ID`, `SCR-TABLE`, `SCR-CHAT`, `SCR-FEEDBACK`, `SCR-MY`, `SCR-LABS` | `ONB-NEW`, `ONB-IN-PROGRESS`, `ONB-COMPLETE`, `MAP-KOREA`, `MAP-SEOUL`, `MAP-FALLBACK`, `ACC-GUEST`, `ACC-ACTIVE` | `SCN-001-GUEST-DISCOVER`, `SCN-011-ONBOARD-SHORT`, `SCN-012-ONBOARD-KOREAN`, `SCN-013-ONBOARD-RESIDENT`; `FX-ONB-FIRST`, `FX-ONB-SHORT`, `FX-ONB-KOREAN`, `FX-ONB-RESIDENT`, `FX-MAP-TILE-FAIL` | `E2E-ONB-01`, `E2E-ONB-02`, `E2E-ONB-03`, `A11Y-CORE-01`, `A11Y-SR-01`, `MANUAL-FLOW-01`; `PX-010`, `PX-019`, `PX-020`, `PX-021`, `PX-022`, `VIS-ONB-01`, `VIS-RWD-01`, `VIS-RWD-02`, `VIS-RWD-03`, `VIS-RWD-04` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |
| `REQ-019` | 줌별 ONDO Heat를 숫자·단계·근거·Limited와 함께 표현. | `Implemented` | `SIMULATED` | Map | `FL-001`; `SCR-MAP`, `SCR-VENUE` | `MAP-KOREA`, `MAP-SEOUL`, `MAP-BUSAN`, `MAP-GROWING`, `MAP-VENUE`, `EVD-VALID`, `EVD-STALE` | `SCN-001-GUEST-DISCOVER`; `FX-MAP-KOREA`, `FX-MAP-SEOUL-RECENT`, `FX-MAP-BUSAN-SEED`, `FX-MAP-GROWING`, `FX-EVD-VALID`, `FX-EVD-STALE` | `E2E-MAP-01`, `VIS-HEAT-01`, `VIS-HEAT-02`, `VIS-HEAT-03`, `VIS-HEAT-04`, `A11Y-COLOR-01`, `CONTRACT-DATA-001`, `CONTRACT-DATA-002`; `PX-006`, `PX-007`, `PX-008`, `PX-009` | `9678b2b` | PASS / PASS / PASS | See 13 As-built |

---

## 3. Core Flow Coverage

| Flow | 관련 REQ | Blocking Core Test | 필수 성공 | 필수 실패·복귀 |
|---|---|---|---|---|
| `FL-001` Guest Discover | 007, 013, 017, 018, 019 | `E2E-CORE-01`, `E2E-CORE-02` | 전국→서울→장소→길찾기, 지도·목록·URL 일치; 저장은 `FL-010`, `FL-011` | tile-error 목록, location denied, no results |
| `FL-002` Short-term KYC → After19 | 003, 005, 012 | `E2E-CORE-03`, `E2E-CORE-04` | Account returnTo→Passport fixture→19+→원래 장소 | 취소·거절·만료에도 일반 ONDO 유지 |
| `FL-003` Table → Image Chat → Feedback | 008, 010, 015 | `E2E-CORE-05` | 참여→채팅→이미지 retry→체크인→상호 피드백 | 참가 전 chat 차단, 나가기·신고, 전송 실패 |
| `FL-004` Checkout → visit-independent milestone branch | 011, 016 | `E2E-CORE-06`, `E2E-REWARD-01` | Payment KYC→mock checkout 뒤 stamp 불변; 별도 unique visit 증거 뒤 9→10·badge opt-in | 취소·거절·중복 visit에서 자산·stamp 불변 |
| `FL-005` Korean CX | 001, 005 | `E2E-CORE-07` | Account→CX success→Local contribution returnTo | 거절·만료·취소에도 draft·지도 유지 |
| `FL-006` Residence Card | 002, 005 | `E2E-CORE-08` | supported success→원 CTA | unsupported·실패→대체·나중에, 지도 유지 |

보조 Flow `FL-007`, `FL-008`, `FL-009`, `FL-010`, `FL-011`, `FL-012`, `FL-013`, `FL-014`, `FL-015`, `FL-016`, `FL-017`, `FL-018`은 [Flow Catalog](./03_FLOW_CATALOG.md)와 세부 E2E·manual evidence로 추적한다.

---

## 4. Document Coverage

각 문서는 자신의 책임 열을 충족해야 한다.

| 문서 | REQ coverage 책임 | 현재 상태 |
|---|---|---|
| `00_EXECUTION_INDEX` | ID·불변식·Gate | Cross-audited · Ready |
| `01_PRD_9H` | 가치·Layer·목표 등급·비범위 | Cross-audited · Ready |
| `02_DECISION_LEDGER` | D-01~D-12와 충돌 해소 | Approved · Cross-audited |
| `03_FLOW_CATALOG` | CTA·guard·success/cancel/failure/returnTo | Cross-audited · Ready |
| `04_STATE_MODEL` | 상태·전이·불법 전이·persistence | Cross-audited · Ready |
| `05_DATA_ADAPTER_CONTRACTS` | fixture/API shape·truth·scenario | Cross-audited · Ready |
| `06_CONTENT_LOCALIZATION` | KO/EN·금지 문구·용어 | Cross-audited · Ready |
| `07_VISUAL_INTERACTION_SPEC` | 화면·map·motion·viewport·pixel | Cross-audited · Ready |
| `08_QA_ACCEPTANCE_PLAN` | REQ/Flow/Test·severity·Gate | Cross-audited · Ready |
| `09_AGENT_RUNBOOK` | owner·시간·무개입 기본값 | Cross-audited · Ready |
| `10_MERGE_PROTOCOL` | worktree·atomic merge·rollback | Cross-audited · Ready |
| `11_REQUIREMENTS_TRACEABILITY` | End-to-end 연결 | Exact registry audit passed; code pending by design |
| `12_RUN_STATUS` | 현재 clock·wave·issue | `SPEC READY` |
| `13_AS_BUILT` | 실제 구현·증거·차이 | Template ready; implementation pending |

---

## 5. Build 중 갱신 계약

### Worker handoff 때

각 worker commit을 받으면 Root가 해당 REQ 행에 다음을 기록한다.

```text
Code path
Atomic commit SHA
실제로 통과한 세부 Test
수동 확인 항목
알려진 차이
```

### Integration 1 뒤

- `QA 1`에 `PASS`, issue ID 또는 `ROLLBACK CANDIDATE` 기록
- Test가 미작성이라면 `MANUAL ONLY`와 이유 기록
- 목표보다 얕은 구현은 As-built 후보를 낮춤

### Integration 2 뒤

- 다른 reviewer의 `QA 2` 결과 기록
- 수정 commit 또는 revert commit 연결
- Critical/High가 남으면 Candidate 승인 금지

### 종료 때

- 모든 `Not started`, `Not run`, `Not evaluated`를 실제 값으로 교체
- 제거된 기능도 행을 삭제하지 않고 `Removed after QA`로 표시
- Deferred에는 사용자 영향과 후속 조건 기록
- 19개 행의 최종 상태를 [As-built](./13_AS_BUILT.md)에 복제·대조

---

## 6. Pre-run Coverage Gate

문서 기준 현재 미판정 REQ: `0`
코드 기준 현재 구현 판정: `COMPLETE · candidate code 9678b2b`
QA 기준 현재 증거: `PASS · E2E 158/158 · visual 32/32 · contract 16/16 · S0/S1 0`

장시간 구현 전 Root가 다음을 다시 확인한다.

- [x] 모든 REQ가 PRD·Decision에 존재
- [x] 모든 REQ가 최소 한 Flow 또는 Contract flow에 연결
- [x] 모든 REQ가 State 또는 stateless contract 경계에 연결
- [x] 모든 interactive/simulated REQ가 fixture와 실패 fixture를 가짐
- [x] 모든 REQ가 Test 또는 명시적 manual truth review를 가짐
- [x] Core 6 Flow가 blocking E2E 8개에 연결
- [x] Content와 Visual 문서가 핵심 surface를 빠짐없이 포함
- [x] Owner가 다른 shared file을 직접 수정하지 않도록 Runbook·Merge 일치
- [x] 19개 행의 Code/Commit, QA 1·2·3, As-built를 실제 후보 값으로 교체

이 gate와 구현 후 검증을 모두 통과해 [Run Status](./12_RUN_STATUS.md)의 현재 Gate를 `CANDIDATE APPROVED`로 변경했다.
