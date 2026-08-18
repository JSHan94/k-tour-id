# ONDO 9시간 Worktree·Merge·Rollback Protocol

상태: 실행 기준 v1 · 2026-08-19
적용 범위: ONDO Frontend Demo Candidate v2의 local integration
최종 책임자: Root Integrator

## 1. 목적

이 문서는 현재 dirty working tree의 사용자 변경을 보존하면서 Root와 세 Worker가 같은 SPEC에서 독립 작업하고, 검증 가능한 atomic commit만 순차 통합하는 절차를 고정한다.

핵심 원칙:

- 사용자 checkout은 source snapshot으로만 읽는다.
- 실행은 새 integration worktree와 Worker worktree에서만 한다.
- 모든 Worker branch는 동일한 SPEC_SHA에서 시작한다.
- 공유 파일은 Root만 수정한다.
- merge commit보다 검증 가능한 atomic cherry-pick을 사용한다.
- 충돌을 즉석에서 봉합하지 않고 원래 owner가 새 commit을 만든다.
- rollback은 reset이 아니라 revert 또는 feature flag로 한다.
- remote push·deploy는 원 요청에 권한이 있을 때만 Root가 수행한다.

## 2. 현재 Source 상태와 보호

2026-08-19 source checkout은 tracked 수정, 삭제, untracked 문서가 함께 있는 dirty 상태다. 이 변경은 ONDO 실행을 위해 만들어진 것이라 추정하거나 자동 정리하지 않는다.

실행 전 Root가 기록할 것:

~~~text
source checkout absolute path
git status --short
SOURCE_SHA
tracked diff summary
untracked file manifest
Node / pnpm version
typecheck / build result
/ondo baseline screenshot
~~~

금지:

- source checkout에서 stash
- reset --hard
- checkout -- 또는 restore로 사용자 파일 되돌리기
- clean -fd
- broad directory delete
- 사용자 변경을 하나의 임의 baseline commit으로 묶기

실행팩이 source에서 아직 untracked라면 Root는 새 integration worktree에 승인된 execution 문서만 명시적으로 옮겨 첫 spec commit을 만든다. unrelated dirty 파일을 함께 복사하거나 stage하지 않는다.

## 3. Run root·Branch·Worktree

Root는 넓거나 모호한 경로 대신 mktemp로 전용 run root를 만든다. 공통 시스템 환경 변수 이름을 재사용하지 않는다.

개념적 구조:

~~~text
RUN_ROOT/
├─ integration/
├─ map/
├─ identity/
└─ connect/
~~~

`RUN_ROOT`는 worktree와 일시 로그만 위한 임시 실행 위치다. release evidence의 정본은 integration worktree 안 `docs/ondo-execution/evidence/<RUN_ID>/`에 둔다. 임시 경로의 파일만으로 Gate를 통과시키지 않는다.

Branch:

~~~text
integration/ondo-9h-RUN_ID
agent/ondo-map-RUN_ID
agent/ondo-identity-RUN_ID
agent/ondo-connect-RUN_ID
~~~

절차:

1. source의 현재 commit을 SOURCE_SHA로 기록한다.
2. SOURCE_SHA에서 새 integration worktree·branch를 만든다.
3. 승인된 execution pack만 integration에 반영하고 spec commit을 만든다.
4. typecheck·build·문서 link를 확인한다.
5. 이 commit을 SPEC_SHA로 기록한다.
6. Worker 세 branch와 worktree를 모두 SPEC_SHA에서 만든다.
7. 12_RUN_STATUS에 path, branch, SHA, owner를 기록한다.

SPEC_SHA가 만들어진 뒤 Worker마다 다른 문서나 Type으로 시작하지 않는다.

## 4. Spec freeze

SPEC_SHA에는 최소 다음이 포함돼야 한다.

- `00_EXECUTION_INDEX.md`
- `01_PRD_9H.md`와 `REQ-001`~`REQ-019`
- `02_DECISION_LEDGER.md`
- `03_FLOW_CATALOG.md`와 `FL-001`~`FL-018`
- `04_STATE_MODEL.md`
- `05_DATA_ADAPTER_CONTRACTS.md`
- `06_CONTENT_LOCALIZATION.md`
- `07_VISUAL_INTERACTION_SPEC.md`
- `08_QA_ACCEPTANCE_PLAN.md`
- `09_AGENT_RUNBOOK.md`
- `10_MERGE_PROTOCOL.md`
- `11_REQUIREMENTS_TRACEABILITY.md`
- `12_RUN_STATUS.md` 초기 상태와 audit SHA
- `13_AS_BUILT.md` template
- 공통 Type·fixture interface가 구현에 필요하면 그 초기 skeleton

즉, `00_EXECUTION_INDEX.md`부터 `13_AS_BUILT.md`까지 14개 문서 전체와 `REQ-001`~`REQ-019`, `FL-001`~`FL-018`이 같은 spec commit에 있어야 한다. 하나라도 누락되면 그 commit은 SPEC_SHA가 아니다.

SPEC_SHA 이후 문서 정정은 다음 중 하나로만 한다.

- S0 진실성·privacy·금전 오류 수정
- 명백한 오탈자로 구현 의미가 바뀌지 않는 수정
- Root가 승인한 Decision Ledger 추가

범위를 늘리는 spec 수정은 9시간 run에서 받지 않는다. 새 제안은 as-built backlog다.

## 5. 파일 Ownership

Ownership은 09 Agent Runbook의 경로를 따른다.

Root-only:

- route와 App shell
- shared Type·contract·fixture registry
- package.json·lockfile·Playwright config
- 공통 token·global CSS
- Traceability·Run Status·As-built

Worker:

- Map은 map/place와 담당 test
- Identity는 onboarding/identity/after19/trust/profile과 담당 E2E·visual test
- Connect는 connect/media/commerce/labs/rewards/my와 담당 E2E·visual test

교차 slice의 producer/consumer와 primary owner는 09 Runbook의 `Cross-slice producer/consumer seam` 표가 유일한 기준이다. consumer는 producer의 소유 파일을 수정하지 않고 Root가 동결한 shared DTO/event만 사용한다.

판정 규칙:

- 소유자가 없는 파일은 Root-only다.
- Worker가 다른 owner 파일을 수정한 commit은 cherry-pick하지 않는다.
- 생성 파일도 ownership에 포함된다.
- import 편의를 이유로 공통 index 파일을 Worker가 동시에 수정하지 않는다.
- feature-local fixture는 Worker 소유가 가능하지만 공통 registry 연결은 Root가 한다.

## 6. Atomic commit 규칙

하나의 commit은 한 개의 독립적인 인수 단위를 담는다.

좋은 단위:

- Map adapter + tile-error fallback
- Passport KYC state + returnTo
- Table image message failure·retry
- OOKRW checkout simulation
- QA 1의 특정 S1 수정

나쁜 단위:

- Map, onboarding, wallet을 한 commit에 혼합
- 기능과 대규모 formatting 혼합
- dependency 변경과 세 Worker 기능 혼합
- 테스트 없이 UI만 추가한 뒤 완료 표시

Commit message 형식:

~~~text
feat(ondo-map): [REQ-007,REQ-019][FL-001] add recent map heat states
feat(ondo-id): [REQ-003,REQ-012][FL-002] add passport and age return flow
feat(ondo-connect): [REQ-008,REQ-010][FL-003] add image message retry
test(ondo): [REQ-011][E2E-PAY-02] cover declined OOKRW checkout
fix(ondo): [S1][MAP-FALLBACK][FX-MAP-TILE-FAIL] keep list fallback visible
docs(ondo): update traceability and as-built evidence
~~~

Commit 전에 Worker가 확인할 것:

- git diff가 소유 경로만 포함
- secret, environment value, 생성 binary 포함 없음
- 담당 typecheck·test 결과
- simulation truth copy
- Handoff의 REQ·Flow·State·Test와 일치

## 7. Shared Contract Change Request

Worker는 shared Type을 직접 바꾸지 않고 다음 요청을 Root에게 보낸다.

~~~text
CCR ID:
Requester:
REQ / Flow / State:
Current contract:
Requested additive change:
Why feature-local adapter is insufficient:
Consumers affected:
Backward compatibility:
Fixture migration:
Tests added or changed:
Latest safe decision time:
Fallback if rejected:
~~~

Root의 판정:

1. feature-local adapter로 해결
2. additive shared contract 변경
3. 기존 field 재사용
4. 요청 거절 후 scope 축소

Breaking rename·삭제는 G1 이후 금지한다. 승인된 additive CCR 또는 불가피한 S0 shared 수정은 다음 단일 절차만 사용한다.

1. Root가 integration branch에 shared contract만 담은 atomic commit을 만들고 `typecheck`와 `test:contracts`를 통과시킨다.
2. Root가 해당 commit을 `SHARED_CONTRACT_SHA`로 12 Run Status에 기록하고 세 Worker 모두에게 전달한다.
3. 세 Worker는 진행 중인 feature commit을 먼저 정리한 뒤 자기 branch에서 `git cherry-pick <SHARED_CONTRACT_SHA>`만 실행한다. merge·rebase·수동 복사는 금지한다.
4. cherry-pick으로 생성된 각 Worker의 새 HEAD를 `WORKER_BASE_SHA`로 기록한다. `SPEC_SHA`는 바꾸지 않고 Context Packet의 `CURRENT_SHARED_SHA`, Handoff의 `Base shared-contract SHA`, `Worker base SHA after shared cherry-pick`을 갱신한다.
5. 세 Worker 모두 자기 branch에서 `typecheck`와 전체 `test:contracts`를 재실행한다. 영향이 없어 보인다는 이유로 생략하지 않는다.
6. 이후 Handoff에는 `WORKER_BASE_SHA` 뒤의 feature commit만 Safe cherry-pick 대상으로 적는다. integration에 이미 있는 Root shared commit을 다시 cherry-pick하지 않는다.

어느 Worker라도 contract test가 실패하면 새 feature commit을 쌓지 않고 Root가 contract fix, CCR 철회 또는 slice 축소 중 하나를 결정한다. 다른 Worker가 같은 변경을 재작성하지 않는다.

## 8. Cherry-pick 순서와 Gate

통합은 다음 순서다.

1. SPEC·test harness·shared contract
2. Worker A Map vertical slice
3. Worker B Identity vertical slice
4. Worker C Connect vertical slice
5. Root App shell·fixture registry wiring
6. Worker별 추가 atomic slice
7. QA 1 test·fix commit
8. QA 2 blocker fix 또는 revert
9. Traceability·As-built·release evidence

각 cherry-pick 뒤 최소 확인:

| 단계 | 확인 |
|---|---|
| Shared contract | typecheck, `test:contracts` |
| Map | typecheck, E2E-MAP smoke, tile-error |
| Identity | typecheck, E2E-AUTH/ID/AGE smoke |
| Connect | typecheck, E2E-TABLES-01, E2E-CHAT-01, E2E-PAY-01 smoke |
| App shell | production build, FL-001~FL-004 smoke |
| QA fix | 해당 실패 test + 인접 Core |
| Final | typecheck, build, `test:contracts`, Core E2E, visual, axe, console |

첫 실패에서 다음 commit을 계속 쌓지 않는다. 실패 원인이 현재 commit인지 이전 wiring인지 식별하고 통합 branch를 다시 green으로 만든 뒤 진행한다.

## 9. Conflict 처리

### Worker-owned 파일끼리 충돌

Ownership 설계가 실패한 것이다.

1. 현재 cherry-pick을 abort해 통합 branch를 이전 green 상태로 돌린다.
2. 두 commit과 ownership을 12 Run Status에 기록한다.
3. Root가 한 owner를 지정한다.
4. 지정 owner가 최신 integration 기준 새 commit을 만든다.
5. 원래 충돌 commit은 cherry-pick하지 않는다.

### Shared 파일 충돌

Root가 직접 의미를 판정한다. Worker commit에서 shared 파일 변경만 제거하도록 Worker에게 새 atomic commit을 요청하는 것이 기본이다.

### Test conflict

같은 test 파일을 여러 Agent가 수정하지 않는다. Flow별 test 파일을 유지하고 공통 helper는 Root가 관리한다.

### Lockfile conflict

Worker dependency 추가를 허용하지 않았으므로 발생하면 commit을 거절한다. 필요한 dependency는 Root가 integration에서 단 한 번 추가하고 frozen lockfile을 모든 Worker에게 전달한다.

금지:

- conflict marker를 남긴 채 commit
- ours/theirs를 의미 검토 없이 전체 적용
- rebase로 다른 Worker의 공개 branch history rewrite
- force push

## 10. Integration 실패 Budget

| 상황 | Budget | 초과 시 |
|---|---|---|
| 한 commit의 typecheck 실패 | 15분 또는 2회 수정 | commit drop·owner 재작업 |
| Core E2E failure | 20분 또는 2회 동일 접근 | slice 축소·fallback |
| Shared contract 불일치 | 1회 CCR | Root 판정 후 freeze |
| Visual diff | S1만 즉시, S2/S3는 기록 | QA 2 이후 새 polish 금지 |
| 외부 tile/provider | 즉시 fixture/fallback | 외부 응답 대기 금지 |

Budget은 품질을 낮추기 위한 것이 아니라 무한 수정으로 전체 Candidate를 잃지 않기 위한 것이다.

## 11. Rollback

Rollback 단위는 atomic commit 또는 feature flag다.

우선순위:

1. 문제 commit의 후속 fix가 15분 안에 가능하면 수정
2. 독립 slice이면 git revert
3. App shell wiring에서 해당 slice를 숨기고 기존 prototype·fallback 사용
4. REQ 상태를 Simulated-static, Contract-only 또는 Deferred로 낮춤
5. traceability와 as-built에 사용자 영향 기록

Revert 후 반드시:

- typecheck
- production build
- 영향 받은 Core flow
- adjacent flow 한 개
- route·navigation dead CTA

되돌린 branch와 evidence는 최종 판정 전까지 보존한다. rollback이 있었다는 사실을 release note에서 숨기지 않는다.

절대 금지:

- git reset --hard
- source checkout restore
- force push
- broad recursive delete
- 사용자 stash 생성·삭제
- 다른 branch에서 작업 중인 파일 덮어쓰기

## 12. Release Candidate Evidence

### 영구 경로와 ownership

정본 경로:

~~~text
docs/ondo-execution/evidence/<RUN_ID>/
├─ manifest.md
├─ baseline/
├─ qa-1/
├─ qa-2/
└─ final/
~~~

- Root가 디렉터리와 `manifest.md`를 소유한다. Worker는 자기 worktree의 test output 경로를 Handoff로 전달하고 Root가 승인된 artifact만 정본 경로로 반영한다.
- `manifest.md` 각 행에는 artifact ID, REQ/Flow/Test ID, 생성 command, exit code, commit SHA, reviewer, timestamp, locale/viewport/scenario, 상대 경로, truth label을 기록한다.
- screenshot·report·log는 11 Traceability와 13 As-built에서 이 manifest 또는 개별 파일로 상대 링크한다. `/tmp`, `RUN_ROOT`, 사용자 홈의 절대 경로는 evidence가 아니다.
- secret, token, raw credential, 여권/얼굴 이미지, private chat·정확한 위치 등 민감정보는 저장하지 않는다. fixture artifact에도 비식별 fixture ID만 쓴다.
- 최종 판정 뒤에도 Candidate branch와 함께 보존한다. artifact가 너무 커 Git 추적이 부적합하면 manifest에 지속 가능한 CI artifact URL, retention 만료일, checksum을 기록하고 만료 전 handoff 사본을 만든다.
- rejected/reverted slice의 증거도 삭제하지 않고 `accepted`, `rejected`, `reverted` 상태를 manifest에 표시한다.

### QA staging → 영구 evidence 승격

`k-tour-id-app/artifacts/qa/manifest.json`과 그 아래 test output은 Playwright·contract·axe 도구가 만드는 **staging 결과**다. Worker handoff와 integration 재실행에 사용하지만 release Gate의 source of truth가 아니며, 이 경로만으로 G5·G6를 통과할 수 없다.

G5·G6 evidence의 유일한 Gate source of truth는 integration branch의 `docs/ondo-execution/evidence/<RUN_ID>/manifest.md`다. Root는 staging 결과를 다음 순서로 승격한다.

1. staging `manifest.json`의 test ID, scenario, fixture, locale, viewport, command, exit code, code SHA를 현재 integration HEAD와 대조한다.
2. accepted artifact를 `baseline/`, `qa-1/`, `qa-2/`, `final/` 중 맞는 영구 상대 경로로 복사한다. private data·secret·절대 경로가 있으면 승격하지 않는다.
3. 각 staging 파일과 영구 파일의 SHA-256을 계산한다. 그대로 복사한 artifact는 두 checksum이 같아야 한다. 정규화·redaction으로 달라지면 변환 이유, 도구, 원본 checksum, 영구 checksum을 모두 기록한다.
4. `manifest.md`에 아래 mapping 한 행을 추가하고, 실제 파일 존재·checksum·integration SHA를 다시 확인한다.
5. 08 QA Plan의 release-required Test/PX/Manual ID가 모두 영구 manifest에 있고 11 Traceability·13 As-built가 그 상대 링크를 가리킬 때만 Gate evidence로 인정한다.

| Evidence ID | Test/PX/Manual ID | Staging relative path | Staging SHA-256 | Durable relative path | Durable SHA-256 | Integration SHA | Status |
|---|---|---|---|---|---|---|---|
| TBD | TBD | `k-tour-id-app/artifacts/qa/...` | TBD | `qa-1/...` 또는 `qa-2/...` 또는 `final/...` | TBD | TBD | `accepted` / `rejected` / `reverted` |

`manifest.json`은 생성 도구의 입력 장부로 보존할 수 있지만 `manifest.md`와 동급의 정본이 아니다. 매핑되지 않은 staging artifact, checksum이 맞지 않는 artifact, 현재 integration SHA가 아닌 결과, 임시 URL만 있는 결과는 `Not run`으로 판정한다.

G6 판정 전에 Root가 evidence bundle에 남길 것:

~~~text
RUN_ID
SOURCE_SHA
SPEC_SHA
integration HEAD SHA
integration branch
Worker branch와 accepted / rejected commit
revert commit
git status --short of integration worktree
Node / pnpm version
dependency·lockfile diff
typecheck result
production build result
data contract test result
Core E2E report
visual screenshot·diff report
axe report
console·failed request report
dead CTA report
REQ traceability
known S2/S3
simulation / contract-only / deferred inventory
deployment status
rollback point
~~~

Evidence path는 11 Requirements Traceability와 13 As-built에서 상대 링크로 접근할 수 있어야 한다. 임시 절대 경로만 기록하지 않으며 `manifest.md`가 없는 evidence bundle은 불완전하다.

## 13. Remote push·Deploy

Remote side effect는 Root만 수행한다.

- 원 사용자 지시에 push·deploy가 명시돼 있는지 다시 확인
- 대상 GitHub owner, repository, branch를 읽기 전용으로 확인
- 대상 Vercel account·project·domain을 확인
- integration worktree clean, G6 통과, rollback SHA 확보
- production과 preview를 혼동하지 않음

권한이나 계정이 불명확하면 local Candidate와 preview-ready evidence까지만 만든다. 임의의 Vercel team이나 사용자 계정에 배포하지 않는다.

배포 후에도 다음을 확인한다.

- 배포 URL의 exact commit
- /ondo 직접 진입
- 지도 tile success·fallback
- Core smoke
- console error
- 이전 배포로 돌아갈 방법

## 14. 최종 Merge 판정

다음이 모두 참일 때만 Candidate를 release-ready로 표시한다.

- integration worktree가 clean
- HEAD가 기록된 SPEC_SHA의 후손
- accepted commit이 Handoff와 일치
- 소유권 위반 commit 0
- unresolved conflict marker 0
- package·lockfile 변경은 Root commit 하나로 추적
- typecheck·build·Core E2E 통과
- S0 0, S1 0
- 두 QA loop와 revert가 evidence에 기록
- REQ-001~REQ-019 Unknown 0
- as-built에 실제·simulation·contract-only·deferred 구분

하나라도 거짓이면 merge 완료가 아니라 Release blocked 또는 축소 Candidate로 판정한다.
