# ONDO 9H Execution Pack

상태: `SPEC READY · 2026-08-19`
제품 결과명: `ONDO Frontend Demo Candidate v2`
실행 범위: 프론트엔드·로컬 fixture·시뮬레이션·자동 QA·as-built
비범위: 실제 외부 신원 사업자, 실시간 서버, 실자산 결제, 실제 bridge/AMM, 운영 가능한 KYC·채팅·평판

이 디렉터리는 ONDO를 사용자 개입 없이 병렬 구현·통합·교차 QA하고, 실제 구현 상태를 명세로 남기기 위한 단일 실행팩이다. 첫 실행 Wave는 9시간 기준이지만 이는 종료 상한이 아니다. `CANDIDATE` Gate가 통과할 때까지 2시간 단위 Quality Extension Wave를 자동 반복한다.

상위 방향 문서:

- [9시간 실행 준비도 감사](../ONDO_9H_EXECUTION_READINESS_AUDIT.md)
- [프론트엔드 제품화 마스터 플랜](../ONDO_FRONTEND_PRODUCTIZATION_PLAN.md)
- [ONDO UX 디자인 명세](../ONDO_UX_DESIGN_SPEC.md)
- [PULSE KOREA 제품 방향](../PULSE_KOREA_PRODUCT_DIRECTION.md)

제품 의미가 충돌할 때 우선순위:

```text
02 Decision Ledger
→ 01 PRD 9H
→ 03 Flow Catalog / 04 State Model
→ 05 Data Contracts / 06 Content / 07 Visual
→ 08 QA Plan
→ 상위 방향 문서
→ 현재 prototype 동작
```

현재 prototype은 참고 자료이지 source of truth가 아니다.

문서별 source-of-truth 범위는 서로 다르다. 한 문서가 다른 모든 문서를 전역으로 덮어쓰지 않는다.

| 판단 대상 | Source of truth | 보조 문서 |
|---|---|---|
| 현재 Gate·clock·blocker·handoff | `12_RUN_STATUS` | `09`, `10` |
| 실행 뒤 실제 구현·시뮬레이션·유예 결과 | `13_AS_BUILT` | `11`, evidence manifest |
| REQ→Flow→State→Fixture→Test→증거 연결 | `11_REQUIREMENTS_TRACEABILITY` | `01`~`08` |
| 작업자 운영·시간·소유권 | `09_AGENT_RUNBOOK` | `10`, `12` |
| worktree·commit·병합·rollback | `10_MERGE_PROTOCOL` | `09`, `12` |
| 제품 결정·범위·UX 계약 | 위 제품 의미 우선순위 | `00` index |

아직 실행하지 않은 항목에 대해서는 `13_AS_BUILT` 템플릿의 `TBD`가 제품 결정이나 목표를 바꾸지 않는다. 실행 뒤에는 계획 문서의 목표보다 `13_AS_BUILT`의 증거 기반 실제 판정을 우선한다.

---

## 1. 승인된 제품 구조

### Hero Product

단기 외국인 여행자의 한 끼 발견과 장소 기반 연결을 가장 깊게 구현한다.

```text
Guest ONDO
→ 실제 서울 지도와 ONDO Heat
→ 장소 결정
→ 필요한 행동에서 Account 생성
→ Passport verification simulation
→ After 19 또는 Pulse Table
→ 이미지가 있는 그룹 대화
→ 체크인·피드백
→ Reputation·Stamp 변화
```

### Foundation Proof

- 한국인: OmniOne CX Mobile ID 경로
- 장기체류 외국인: Mobile Residence Card 경로와 미지원 상태
- 단기 여행객: Passport verification provider 경로
- 세 persona 모두 같은 ONDO 홈을 사용하고 권한만 다름

### Labs / Architecture

- Sui zkLogin signer
- 자산별 USDC·USDT와 USD 상당액
- OOKRW test token
- Sui↔OmniOne bridge state hypothesis
- OmniOne merchant eligibility receipt
- 10회 Stamp 후 opt-in NFT badge

Labs는 소비자 홈·하단 내비게이션의 중심이 아니다. `TESTNET`, `SIMULATED`, `CONTRACT_ONLY`, `NOT_CONFIGURED`를 문서·Evidence에서 분명히 하며 실제 연동처럼 주장하지 않는다.

---

## 2. 고정된 불변식

1. Guest는 가입 없이 지도·검색·장소 상세·길찾기를 사용할 수 있다.
2. Account, Person verification, 19+, Payment KYC, Reputation은 서로 다른 상태다.
3. Hero flow는 단기 외국인 여행객이다.
4. 실제 지도는 Leaflet 기반이며 전국 overview, 서울 완결, 부산 seed를 제공한다.
5. 나머지 지역은 `Explore/Growing`이고 근거 없는 ONDO 숫자를 만들지 않는다.
6. After 19 자동 전환은 `19+ verified + proof 미만료 + 한국 시각 19:00 이후 + autoNightMode=true + 현재 세션 manual-off 아님`을 모두 만족할 때만 발생한다.
7. 일반 심야 식당·카페는 After 19에 잠기지 않는다.
8. KYC 국적을 자동 공개하지 않는다. `From`, `Lives in`, `Languages`는 사용자 선택 공개다.
9. 첫 현장 미션은 법적 신원 등급이 아니라 실제 발생한 Visit·Contribution만 바꾼다. Meetup은 Table 체크인·완료·피드백 뒤에만 바뀐다.
10. Reputation은 단일 안전 점수가 아니라 분리된 축이다.
11. Stamp 10회 milestone은 소비자 UX, NFT mint는 Labs의 opt-in simulation이다.
12. KYC 업체 계약 전에는 `Passport verification provider`라는 중립 명칭을 쓴다.
13. Sui는 OmniOne CX/OpenDID 본체를 대체하지 않는 optional sidecar다.
14. OpenDID가 EAS를 import하거나 사용한다고 쓰지 않는다.
15. USDC·USDT·wrapped asset은 원장에서 분리하고 화면에는 `Estimated USD value`만 합산한다.
16. Custom OOKRW bridge·AMM·실자산 결제는 구현하지 않는다.
17. 공개 UI에 `DEMO` badge를 남발하지 않되 Evidence와 as-built에서는 시뮬레이션을 숨기지 않는다.
18. 기존 dirty worktree와 사용자 파일을 덮어쓰지 않는다.
19. 초기 9시간 결과만으로 `Frontend Complete v1` 또는 생산 서비스라고 부르지 않는다.
20. 시각이 아니라 품질 Gate가 종료 기준이다. 사용자 추가 입력 없이 Extension Wave를 계속하되, 승인되지 않은 외부 계정·실자산·운영 API로 범위를 넓히지 않는다.

---

## 3. 문서 읽기 순서

| 순서 | 문서 | 질문 |
|---:|---|---|
| 1 | [PRD 9H](./01_PRD_9H.md) | 9시간에 무엇을 얼마나 깊게 만드는가? |
| 2 | [Decision Ledger](./02_DECISION_LEDGER.md) | 모호할 때 어떤 결정을 적용하는가? |
| 3 | [Flow Catalog](./03_FLOW_CATALOG.md) | 사용자는 어디서 어디로 이동하고 실패하면 어디로 복귀하는가? |
| 4 | [State Model](./04_STATE_MODEL.md) | Account·Identity·지도·연결·결제가 어떤 상태를 가지는가? |
| 5 | [Data Adapter Contracts](./05_DATA_ADAPTER_CONTRACTS.md) | fixture와 미래 API가 어떤 계약을 공유하는가? |
| 6 | [Content & Localization](./06_CONTENT_LOCALIZATION.md) | 한국어·영어로 정확히 무엇을 말하고 무엇을 금지하는가? |
| 7 | [Visual & Interaction](./07_VISUAL_INTERACTION_SPEC.md) | 실제 지도와 모든 화면이 어떻게 보여야 하는가? |
| 8 | [QA & Acceptance](./08_QA_ACCEPTANCE_PLAN.md) | 무엇을 통과해야 완료인가? |
| 9 | [Agent Runbook](./09_AGENT_RUNBOOK.md) | 누가 언제 무엇을 구현하고 검수하는가? |
| 10 | [Merge Protocol](./10_MERGE_PROTOCOL.md) | 변경을 어떻게 안전하게 통합·되돌리는가? |
| 11 | [Requirements Traceability](./11_REQUIREMENTS_TRACEABILITY.md) | 19개 요구가 코드·테스트·증거 어디에 있는가? |
| 12 | [Run Status](./12_RUN_STATUS.md) | 현재 wave·blocker·gate는 무엇인가? |
| 13 | [As-built](./13_AS_BUILT.md) | 실제로 무엇이 구현·시뮬레이션·유예됐는가? |

모든 파일이 존재하고 `SPEC READY` gate를 통과하기 전에는 장시간 구현을 시작하지 않는다.

---

## 4. 요구사항 ID

| ID | 짧은 이름 | 기본 구현 등급 |
|---|---|---|
| REQ-001 | 한국인 CX onboarding | Simulated Foundation |
| REQ-002 | 장기체류 외국인 Residence Card | Simulated Foundation |
| REQ-003 | 단기 여행객 Passport + First Mission | Simulated Hero |
| REQ-004 | OpenDID/Evidence/chain adapter | Contract-only |
| REQ-005 | Account와 verification 분리 | Implemented Hero |
| REQ-006 | Stable asset·OOKRW·bridge | Simulated Labs |
| REQ-007 | 식음료 ONDO | Implemented Hero |
| REQ-008 | Table·Chat·Feedback | Implemented/Simulated Hero |
| REQ-009 | 사진 선택·미리보기 | Simulated Hero |
| REQ-010 | 이미지 메시지 | Simulated Hero |
| REQ-011 | KRW/OOKRW checkout | Simulated Labs/Branch |
| REQ-012 | After 19 자동 전환 | Implemented Hero |
| REQ-013 | 가기 전 확인 | Implemented Hero |
| REQ-014 | Merchant eligibility contract | Contract-only + Simulated receipt |
| REQ-015 | 다축 Reputation | Implemented/Simulated Hero |
| REQ-016 | 10회 Stamp·NFT | Implemented milestone + Simulated Labs |
| REQ-017 | 전국 shell·서울·부산 | Implemented Hero |
| REQ-018 | Responsive Web App | Implemented Foundation |
| REQ-019 | ONDO Heat visualization | Implemented Hero |

`Implemented`는 프론트에서 실제로 동작한다는 뜻이며 외부 provider가 연결됐다는 뜻이 아니다.

---

## 5. 상태 용어

### 구현 등급

| 값 | 의미 |
|---|---|
| `Implemented` | 프론트 기능·상태·복구가 실제로 동작 |
| `Simulated` | 외부 시스템 결과를 deterministic fixture로 재현 |
| `Contract-only` | interface·데이터·상태·기술 경계만 정의 |
| `Deferred` | 이번 후보에서 의도적으로 구현하지 않음 |

### 실행 증거

| 값 | 의미 |
|---|---|
| `LIVE` | 운영 provider receipt를 검증함 |
| `SANDBOX` | 공식 sandbox receipt를 검증함 |
| `TESTNET` | 공개 testnet transaction을 검증함 |
| `SIMULATED` | 로컬 fixture이며 외부 효력이 없음 |
| `CONTRACT_ONLY` | interface·validator·상태 경계만 있고 실행 가능한 외부 연동은 없음 |
| `NOT_CONFIGURED` | 연결에 필요한 환경·계약이 없음 |

구현 등급의 `Contract-only`와 실행 증거의 `CONTRACT_ONLY`는 같은 표기 계층이 아니다. 프론트에서 자연스러운 소비자 문구를 쓰더라도 Evidence·개발 상태에서는 위 실행 증거 값을 숨기거나 띄어쓰기·하이픈 별칭으로 바꾸지 않는다.

---

## 6. Gate

| Gate | 의미 | 통과 조건 |
|---|---|---|
| `SPEC BUILDING` | 문서 작성 중 | 일부 파일·결정·상호참조 미완성 |
| `SPEC READY` | 구현 시작 가능 | 14개 파일, 미판정 REQ 0, exact state/fixture/test/screenshot ID 존재, wildcard 0, 링크·ownership·persistence 교차검수 통과 |
| `BUILDING` | 병렬 구현 중 | ownership 준수, atomic handoff 진행 |
| `INTEGRATION 1` | 첫 병합 | typecheck/build 복구 |
| `QA 1` | 기능·상태·문구·반응형 교차검수 | blocker 분류·owner 재할당 |
| `INTEGRATION 2` | 수정 병합 | 신규 기능 금지, 회귀 복구 |
| `QA 2` | E2E·visual·a11y·console adversarial | Critical/High 0 |
| `CANDIDATE` | 배포 후보 | traceability·as-built·evidence 완료 |
| `REJECTED` | 배포 불가 | 핵심 E2E/build 또는 진실성 gate 실패 |

현재 상태는 [Run Status](./12_RUN_STATUS.md)가 유일한 source of truth다.

---

## 7. 시작 전 필수 명령

장시간 실행 시작 명령은 이 문서 승인과 별개다. 제품 책임자가 명시적으로 구현 시작을 요청한 뒤에만 `09_AGENT_RUNBOOK.md`의 초기 9시간 clock을 시작한다. `2026-08-19` 제품 책임자는 초기 Wave 이후에도 Candidate Gate 통과까지 무개입 자동 진행하도록 승인했다.

시작 전 최소 확인:

```text
14개 실행 문서 검수
dirty worktree 보호
integration worktree 생성
SPEC SHA 기록
baseline typecheck/build
baseline screenshot
agent ownership 확인
```

문서 승인만으로 실제 배포·외부 연결·실자산 transaction 권한을 추론하지 않는다.
