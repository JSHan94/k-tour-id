# ONDO 9시간 Agent Runbook

상태: 실행 기준 v1 · 2026-08-19
운영 모델: Root Integrator 1 + Worker 3
목표: 사용자 추가 입력 없이 ONDO Frontend Demo Candidate v2 구현·통합·두 번의 QA·as-built 완료

## 1. Runbook의 범위

이 문서는 누가, 언제, 어느 파일을, 어떤 Gate까지 책임지는지를 고정한다. 제품 결정은 01 PRD와 02 Decision Ledger, 인수 판정은 08 QA Plan, git 통합은 10 Merge Protocol을 따른다.

9시간 실행은 전체 생산 서비스 개발이 아니다.

- 실제 CX·Passport KYC·OpenDID·zkLogin·Bridge·OOKRW·NFT 연동은 하지 않는다.
- AMM은 9시간 후보에서 `Deferred`다. quote·swap UI나 유동성 fixture를 만들지 않는다.
- 외부 secret이나 계약이 필요한 순간에는 멈춰 기다리지 않고 승인된 fixture adapter를 사용한다.
- 구현 깊이는 Hero, Foundation, Labs 세 층을 유지한다.
- 토큰을 많이 쓰는 것 자체를 목표로 하지 않는다. 각 Agent는 Gate를 통과할 때까지 충분히 조사·구현하되 같은 실패를 반복하지 않는다.
- 4:20에 feature를 동결하고 5:00까지는 통합·route wiring·build 복구만 한다. 7:55 이후 넓은 수정은 금지한다.

## 2. 권한과 불변식

모든 Agent가 지켜야 하는 불변식:

1. 원본 dirty checkout의 사용자 변경을 수정·stash·reset·삭제하지 않는다.
2. 각 Agent는 할당된 worktree와 소유 경로에서만 수정한다.
3. 기존 ONDO prototype은 rollback 가능한 fallback으로 남긴다.
4. shared contract, package, route, 공통 token은 Root만 수정한다.
5. fixture를 실제 실시간 정보·실제 신원검증·실제 온체인 receipt·실제 결제로 주장하지 않는다.
6. KYC 국적을 자동 공개하지 않는다.
7. Guest 지도 탐색을 외부 provider 실패로 막지 않는다.
8. 지도 실패 시 동일 장소 목록이 남는다.
9. 성별 비율·소개팅 매칭·무제한 DM을 만들지 않는다.
10. destructive command, force push, broad delete를 사용하지 않는다.

원본 요청에 remote push·deployment 권한이 별도로 포함되지 않았다면 Candidate 생성은 local integration branch에서 끝난다.

## 3. 실행 전 필수 입력

Root는 Worker를 구현 상태로 전환하기 전에 다음 Context Packet을 고정한다.

~~~text
RUN_ID
SOURCE_SHA
SPEC_SHA
CURRENT_SHARED_SHA
integration branch와 worktree path
Worker branch와 worktree path
읽어야 할 execution 문서 목록
담당 REQ / Flow / State / Test ID
소유 파일·금지 파일
현재 typecheck / build 결과
현재 /ondo baseline screenshot 위치
handoff deadline
~~~

각 Worker는 관련 문서를 처음부터 끝까지 읽고 다음 한 줄을 먼저 반환한다.

~~~text
READY — scope, ownership, gates, simulation boundary understood
~~~

문서를 부분적으로 읽었거나 SPEC_SHA가 다르면 구현을 시작하지 않는다.

G1 최초에는 `CURRENT_SHARED_SHA = SPEC_SHA`다. 10 Merge Protocol의 CCR 절차가 실행되면 SPEC_SHA는 고정한 채 `CURRENT_SHARED_SHA`와 각 Worker의 base SHA만 갱신한다.

## 4. 역할·소유권

### Root Integrator

책임:

- execution pack·SPEC_SHA·Decision Ledger 동결
- 새 ONDO App shell과 route wiring
- 공통 Type·repository interface·fixture registry·token
- package.json, lockfile, Playwright config, test web server
- canonical data contract test와 `test:contracts` script
- Context Packet, progress log, integration, rollback, release
- 11 Traceability와 13 As-built 최종 갱신

Root는 feature UI·feature-local fixture·feature별 E2E/visual spec을 대신 구현하지 않는다. G1 전에 shell·shared contract·test harness를 동결하고, 이후에는 worker가 만든 vertical slice의 wiring과 검증에 집중한다.

전용 소유:

~~~text
k-tour-id-app/app/ondo/**
k-tour-id-app/features/ondo/app/**
k-tour-id-app/features/ondo/shared/**
k-tour-id-app/features/ondo/contracts/**
k-tour-id-app/features/ondo/fixtures/index.*
k-tour-id-app/package.json
k-tour-id-app/pnpm-lock.yaml
k-tour-id-app/playwright.config.*
k-tour-id-app/tests/contracts/**
k-tour-id-app/app/globals.css의 ONDO 공통 token
docs/ondo-execution/00_*, 02_*, 11_*, 12_*, 13_*
docs/ondo-execution/evidence/**
~~~

기존 k-tour-id-app/components/ondo/ondo-prototype.*는 Root만 fallback 전환 목적으로 수정할 수 있다. 가능하면 수정하지 않는다.

### Worker A · Map & Discovery

담당:

- REQ-007, REQ-013, REQ-017, REQ-019
- FL-001
- 서울 실제 지도, 부산 seed, ONDO Heat, 장소·Can I Go, 목록 fallback
- `REQ-013` 장소 상세 fact 표현의 primary owner. `REQ-014` merchant receipt 자체는 Worker C가 생산한 canonical adapter 결과만 소비

소유:

~~~text
k-tour-id-app/features/ondo/map/**
k-tour-id-app/features/ondo/place/**
k-tour-id-app/lib/ondo/map/**
k-tour-id-app/tests/e2e/ondo-map*.spec.*
k-tour-id-app/tests/visual/ondo-map*.spec.*
k-tour-id-app/tests/visual/ondo-heat*.spec.*
~~~

완료 증거:

- E2E-MAP-01, E2E-MAP-02, E2E-MAP-03, E2E-MAP-04, E2E-MAP-05, E2E-MAP-06
- E2E-PLACE-01
- E2E-MAP-04의 save pending→failure→retry→saved·중복 callback 1회·새로고침 복원
- VIS-MAP-01~04
- VIS-HEAT-01~04
- tile-error·location-denied fallback

### Worker B · Identity & Trust

담당:

- REQ-001~REQ-005, REQ-012, REQ-015
- FL-002, FL-005~FL-010, FL-013~FL-015
- 세 persona, Account/KYC 분리, After 19, public profile, reputation reducer·selector
- `REQ-015` reputation의 primary owner. Worker C가 보내는 typed activity event만 소비하고 Connect 파일을 직접 수정하지 않음

소유:

~~~text
k-tour-id-app/features/ondo/onboarding/**
k-tour-id-app/features/ondo/identity/**
k-tour-id-app/features/ondo/after19/**
k-tour-id-app/features/ondo/trust/**
k-tour-id-app/features/ondo/profile/**
k-tour-id-app/tests/e2e/ondo-identity*.spec.*
k-tour-id-app/tests/e2e/ondo-age*.spec.*
k-tour-id-app/tests/e2e/ondo-profile*.spec.*
k-tour-id-app/tests/visual/ondo-identity*.spec.*
k-tour-id-app/tests/visual/ondo-after19*.spec.*
k-tour-id-app/tests/visual/ondo-profile*.spec.*
~~~

완료 증거:

- E2E-ONB-01, E2E-ONB-02, E2E-ONB-03
- E2E-AUTH-01, E2E-AUTH-02, E2E-AUTH-03, E2E-AUTH-04, E2E-AUTH-05
- E2E-ID-01, E2E-ID-02, E2E-ID-03, E2E-ID-04
- E2E-AGE-01, E2E-AGE-02, E2E-AGE-03, E2E-AGE-04, E2E-AGE-05
- E2E-TRUST-01, E2E-TRUST-02
- E2E-TABLES-02가 소비할 profile edit·save failure에서 기존 공개값 유지·retry success producer evidence. 최종 composite test 파일과 실행은 Worker C가 소유한다.

### Worker C · Connect & Commerce

담당:

- REQ-006, REQ-008~REQ-011, REQ-014, REQ-016
- FL-003, FL-004, FL-011, FL-012, FL-016~FL-018
- Table, 선택 공개 국적, 사진·이미지 대화, feedback, checkout, Wallet/Labs의 자산·bridge simulation, Stamp
- REQ-006의 AMM은 구현하지 않고 `Deferred` evidence만 남김
- `REQ-014` merchant receipt/Labs adapter와 `FL-012` first-mission UI의 primary owner. 평판을 직접 변경하지 않고 Root가 동결한 activity-event contract로 Worker B reducer에 전달

소유:

~~~text
k-tour-id-app/features/ondo/connect/**
k-tour-id-app/features/ondo/media/**
k-tour-id-app/features/ondo/commerce/**
k-tour-id-app/features/ondo/labs/**
k-tour-id-app/features/ondo/rewards/**
k-tour-id-app/features/ondo/my/**
k-tour-id-app/tests/e2e/ondo-connect*.spec.*
k-tour-id-app/tests/e2e/ondo-commerce*.spec.*
k-tour-id-app/tests/e2e/ondo-my*.spec.*
k-tour-id-app/tests/visual/ondo-connect*.spec.*
k-tour-id-app/tests/visual/ondo-commerce*.spec.*
k-tour-id-app/tests/visual/ondo-labs*.spec.*
k-tour-id-app/tests/visual/ondo-my*.spec.*
~~~

완료 증거:

- E2E-TABLES-01, E2E-TABLES-02, E2E-TABLES-03, E2E-TABLES-04
- E2E-SIGNAL-01, E2E-SIGNAL-02, E2E-SIGNAL-03, E2E-SIGNAL-04
- E2E-PKY-01, E2E-PKY-02, E2E-PKY-03, E2E-PKY-04
- E2E-PAY-01, E2E-PAY-02, E2E-PAY-03, E2E-PAY-04
- E2E-MEDIA-01, E2E-MEDIA-02, E2E-MEDIA-03, E2E-CHAT-01
- E2E-LABS-01, E2E-LABS-02, E2E-LABS-03
- E2E-REWARD-01

### 소유권 예외

공통 Type·fixture registry 변경이 필요하면 Worker는 shared 파일을 수정하지 않고 10 Merge Protocol의 Contract Change Request를 Root에게 보낸다. Root가 호환되는 최소 변경을 먼저 commit하고 새 SHA를 전달한다.

같은 파일을 두 Agent가 공동 소유하지 않는다. 소유권이 불명확한 파일은 Root 소유로 간주한다.

### Cross-slice producer/consumer seam

| Seam | Primary owner / producer | Consumer | 동결 계약 | 금지 |
|---|---|---|---|---|
| Venue fact ↔ merchant receipt | Worker C가 receipt·Labs adapter 생산 | Worker A가 장소 상세 fact로 표시 | Root의 `CanonicalEvidenceEnvelope`·trait result | A가 Labs/contract 파일 수정, C가 place UI 수정 |
| Evidence contract → identity adapter → Labs consumer | Root가 `CanonicalEvidenceEnvelope`, OpenDID/EAS 별도 adapter interface·fixture registry를 생산하고 Worker B가 identity-owned adapter mapping을 생산 | Worker C가 FL-016/FL-018 Labs evidence surface에서 canonical envelope만 소비 | Root의 evidence union·provenance·invalid/stale/error contract | B가 shared contract를 수정, C가 raw OpenDID/EAS payload를 직접 해석, 한 adapter가 다른 adapter를 호출 |
| After19 eligibility → Map layer | Worker B가 네 guard와 expiry를 평가한 read-only `After19ViewState` projection 생산 | Worker A가 Map layer·banner·즉시 off 진입점에서 소비 | Root의 After19 projection DTO와 off command interface | A가 Age credential을 해석하거나 B가 map 파일 수정 |
| Multi-gate returnTo → gated feature resume | Root가 allowlisted one-active-envelope repository·`activeGate` 전이·one-shot consume contract 생산 | Worker B가 Account/Person/Age gate에서, Worker C가 Table/Local Signal/Checkout/Payment KYC에서 같은 envelope를 소비 | Root의 versioned returnTo repository; `tokenId`·최종 `cta`·공개 context 불변, 중간 gate success는 미소비 | B/C가 별도 storage key·중첩 envelope를 만들거나 중간 success에서 최종 CTA를 소비 |
| Table/first mission ↔ reputation | Worker C가 `visit`, `contribution`, `meetup` activity event 생산 | Worker B가 축별 reducer·selector 적용 | Root의 activity-event union과 idempotency key | C가 reputation state 직접 변경, B가 Connect UI 수정 |
| Save ↔ My Korea | Worker A가 save intent·venue reference 생산 | Worker C가 My Korea 목록·stamp surface 소비 | Root의 saved-venue repository interface | 양쪽이 별도 storage key 생성 |
| Public profile ↔ Table participant | Worker B가 consented profile projection 생산 | Worker C가 Table participant card에서 읽기 전용 소비 | Root의 public-profile DTO | C가 KYC/person state에서 국적 추론 |
| Cross-surface responsive smoke | 각 Worker가 자기 visual test 생산 | Root가 전체 shell smoke만 소유 | viewport·locale fixture | Root가 feature visual test를 대신 작성 |

Worker C가 first mission·feedback을 구현해도 `REQ-015`의 최종 판정 owner는 Worker B다. Worker A가 장소 fact를 그려도 `REQ-014` contract 판정 owner는 Worker C다. 위 표의 shared event·DTO·repository interface가 G1에 없거나 producer/consumer test owner가 불명확하면 구현을 시작하지 않고 CCR이 아니라 G1 blocker로 올린다.

## 5. 9시간 Wave

| 시각 | Root | Worker A | Worker B | Worker C | Gate |
|---|---|---|---|---|---|
| 0:00–0:30 | dirty source 격리, baseline, screenshot, SPEC 준비 | 기존 Map 자산 읽기 | 기존 onboarding·ID 읽기 | 기존 Connect·Wallet 읽기 | G0 |
| 0:30–1:10 | Decision·contract·fixture·test harness 동결, `test:contracts` 통과 | Flow/Test 상세화 | State/Test 상세화 | Flow/Test 상세화 | G1 |
| 1:10–2:30 | App shell·integration seam | 실제 Map·Heat | persona·Account/KYC | Table·Media | — |
| 2:30–3:30 | contract request 처리·smoke | Place·fallback | After19·reputation | Checkout·Labs·Stamp | — |
| 3:30–4:20 | handoff 사전 점검 | 자체 typecheck·tests·commit | 자체 typecheck·tests·commit | 자체 typecheck·tests·commit | Feature freeze |
| 4:20–5:00 | 순차 cherry-pick, route wiring, build 복구 | integration 지원 | integration 지원 | integration 지원 | G2 |
| 5:00–5:40 | QA 1 triage | Identity review | Connect review | Map review | G3 |
| 5:40–6:40 | 공통 fix·traceability | 배정 fix | 배정 fix | 배정 fix | Fix freeze |
| 6:40–7:10 | fix cherry-pick, build | handoff | handoff | handoff | G4 |
| 7:10–7:55 | QA 2·release evidence | Connect visual | Map a11y | Identity truth | G5 |
| 7:55–8:25 | S0/S1 fix 또는 revert | blocker만 | blocker만 | blocker만 | Code freeze |
| 8:25–8:50 | Traceability·As-built | 증거 확인 | 증거 확인 | 증거 확인 | Docs freeze |
| 8:50–9:00 | 최종 build·Candidate 판정 | 대기 | 대기 | 대기 | G6 |

초기 Wave의 시간 경계와 Handoff는 지킨다. 미완성 기능을 숨기지 않고 `Partial`·`Dropped`로 표시한다. 다만 9시간은 전체 실행의 종료 상한이 아니다. `CANDIDATE` Gate가 미통과면 Root는 아래 Quality Extension Wave를 사용자 재확인 없이 시작한다.

### Quality Extension Wave · 2시간 반복

1. 직전 evidence에서 S0/S1, 실패 flow, pixel·a11y·console·dead CTA, traceability 공백을 다시 정렬한다.
2. 새 기능이나 새 외부 연동을 추가하지 않고 승인된 REQ의 완결성과 품질만 높인다.
3. 각 2시간 Wave는 `fix → integration → cross-review → evidence`를 한 묶음으로 끝낸다.
4. 동일 reviewer가 자기 fix를 최종 승인하지 않는다.
5. `CANDIDATE` Gate를 통과하거나 새 권한 없이는 해결할 수 없는 외부 blocker가 생길 때만 자동 반복을 끝낸다.

## 6. Agent 작업 루프

각 Worker는 다음 단일 루프만 사용한다.

~~~text
READ
→ PLAN: 담당 REQ·Flow·State·Test mapping
→ IMPLEMENT: 가장 작은 vertical slice
→ VERIFY: typecheck + 담당 test + screenshot
→ COMMIT: atomic REQ commit
→ HANDOFF
~~~

Token-maxing은 다음처럼 해석한다.

- 필요한 문서와 기존 코드를 충분히 읽는다.
- 정상·취소·실패·복귀를 함께 구현한다.
- 테스트 실패 원인을 증거로 좁힌다.
- 같은 접근으로 세 번째 재시도를 하지 않는다.
- Gate 이후 새 아이디어를 구현하지 않는다.
- 더 많은 토큰을 쓰기 위해 이미 통과한 코드를 재작성하지 않는다.

한 오류에서 20분 또는 두 번의 같은 수정 시도가 지나면 Root에게 escalation한다. Root는 contract fix, slice 축소, fallback 또는 drop 중 하나를 선택한다.

## 7. 진행 보고와 복구 가능성

Worker는 다음 시점에 Root에게 상태를 보낸다.

- READY
- 첫 vertical slice 통과
- Contract Change Request
- Feature freeze handoff
- QA fix handoff
- blocker 또는 drop

최소 45분마다 다음 형식으로 progress를 보낸다.

~~~text
STATUS: RUNNING | BLOCKED | HANDOFF | DROPPED
TIME:
OWNER:
REQ / FLOW / STATE:
DONE:
NEXT:
TEST:
COMMIT:
BLOCKER:
DECISION NEEDED:
~~~

Root는 12_RUN_STATUS.md만 갱신한다. Worker가 같은 status 문서를 동시에 수정하지 않는다.

Agent session이 끊겨도 branch의 마지막 atomic commit과 Handoff가 복구 기준이다. 큰 uncommitted 변경을 45분 이상 유지하지 않는다.

## 8. Handoff 계약

Feature handoff에는 반드시 다음이 포함된다.

~~~text
Agent:
Branch:
Base SPEC SHA:
Base shared-contract SHA:
Worker base SHA after shared cherry-pick:
Commit SHA list:
Owned files changed:
REQ IDs:
Flow IDs:
State IDs:
Test IDs:
Commands and results:
Screenshot/report paths:
Staging artifact paths and SHA-256:
Simulation boundary:
Known S2/S3:
Contract changes requested:
Safe cherry-pick order:
Rollback commit or feature flag:
~~~

증거 없이 “완료”라고 쓰지 않는다. 테스트가 없으면 Not tested, visual만 있으면 Visual only라고 기록한다.

## 9. 사용자 입력이 없을 때의 Default

승인된 권장안을 다음과 같이 적용한다.

1. Guest는 지도·검색·상세·길찾기 사용 가능
2. Account는 저장·질문·Table·메시지 진입 시 요청
3. Person·19+·Payment KYC는 각각 필요한 순간에만 요청
4. 단기 외국인 Hero flow를 가장 깊게 구현
5. 한국인 CX와 Residence Card는 짧은 foundation flow
6. Sui는 optional Labs/sidecar이며 ONDO 핵심 탭에 두지 않음
7. Wallet·Bridge·OOKRW·Trait·NFT는 명시적 simulation
8. 전국 overview + 서울 완결 + 부산 seed
9. After 19는 19+ verified, 한국 시각 19:00 이후, auto setting on, 현재 세션에서 manual-off가 아님의 네 조건을 모두 만족할 때만 자동 전환하고 즉시 끄기 제공
10. 국적은 사용자가 선택 공개한 From/Lives in이며 KYC 값 자동 공개 금지
11. 첫 미션은 실제 발생한 Visit·Contribution 축만 변경하고, Meetup은 Table 만남 완료·피드백 뒤에만 변경
12. 계약 전 KYC provider는 중립적인 Passport verification provider로 표기

Default로도 privacy·금전·신원·외부 연동의 진실성을 확정할 수 없으면 구현을 더 깊게 추측하지 않는다. Contract-only 또는 Deferred로 축소하고 as-built에 기록한다.

## 10. Stop·Escalation 조건

즉시 작업을 멈추고 Root에게 알리는 조건:

- 원본 dirty checkout을 건드려야만 진행 가능
- Secret, 유료 API, provider 계정, 실제 transaction이 필요
- 다른 Agent 소유 파일과 충돌
- 동결된 Type을 breaking change 해야 함
- 실제 KYC·결제·체인처럼 보이는 문구를 제거할 수 없음
- 국적·생년월일·신분증 원문을 공개 surface에 노출
- production build가 자신의 commit 이후 실패
- 지도 타일 실패 시 fallback 없이 전체 화면이 사라짐
- 20분 또는 동일 수정 두 번 후에도 같은 blocker

Root의 처리 선택:

1. 최소 shared contract 변경
2. non-breaking adapter 추가
3. feature depth 축소
4. 정적 evidence surface로 변경
5. slice drop·revert

외부 서비스나 사용자 응답을 기다리는 상태로 9시간 clock을 멈추지 않는다.

## 11. Rollback과 Feature Freeze

- Feature freeze: 4:20
- Integration 1 complete: 5:00
- Fix freeze: 6:40
- Code freeze: 8:25
- Docs freeze: 8:50

4:20 이후 새 REQ, 새 route, 새 dependency를 추가하지 않는다. 7:55 이후 S0/S1 외 수정은 하지 않는다.

Rollback은 Root만 수행한다.

- atomic commit 단위 git revert
- 신규 app shell의 feature flag를 기존 prototype으로 전환
- 불안정 slice를 route에서 제거하고 traceability를 Deferred로 변경

금지:

- git reset --hard
- 사용자 checkout에 git checkout -- 적용
- force push
- broad rm 또는 worktree directory 재귀 삭제
- 사용자 변경 stash·drop
- 다른 Worker branch history rewrite

## 12. Agent별 완료 조건

Worker는 다음을 모두 만족할 때 DONE이다.

- 담당 REQ의 구현 등급이 명시됨
- 담당 Core Flow의 정상·최소 한 실패·복귀 테스트
- 소유 경로 밖 변경 0
- atomic commit과 Handoff 완료
- 자기 branch에서 typecheck 통과
- Root가 관리하는 canonical data contract test 통과 또는 담당 contract blocker가 명시됨
- 실제·simulation 경계 문구 확인
- QA 1에서 받은 S0/S1 수정 또는 Root가 revert 결정
- 알려진 S2/S3를 숨기지 않고 기록

Root의 전체 종료는 08 QA Plan G6을 따른다. Agent가 DONE이어도 전체 Candidate가 release 가능한 것은 아니다.
