# ONDO B QA · A/B · Five-review Runbook

상태: `READY TO RUN AFTER ROUTE SEAM`

## 1. 실험 보호

1. A는 `fba3ea593fb0b63cc9f0b759f31e152d68d392e9`에서 고정한다.
2. B는 별도 `experiment/ondo-baljajwi-minimal-v1` branch와 별도 preview URL을 쓴다.
3. B의 product SHA가 바뀔 때마다 clean streak를 `0`으로 되돌린다.
4. A의 production alias를 B 검수 중 움직이지 않는다.
5. B 승격은 atomic merge와 새 As-built/evidence 갱신으로만 한다. 실패하면 alias를 A로 돌린다.

## 2. 자동화 Gate 순서

모든 명령은 같은 B product SHA와 같은 production build를 대상으로 한다.

```text
G0  exact registry: 19 REQ, FL-001~FL-018, 126 browser IDs, 72 pixel IDs
G1  typecheck + production build + existing contracts
G2  B browser: success/cancel/fail/retry/terminal/returnTo
G3  B runtime: console error, pageerror, unhandled rejection 0
G4  B dead CTA: visible enabled CTA transition 또는 external href/confirmation 보유
G5  B content: KO/EN, raw fixture/dev copy, truth boundary, long-copy overflow
G6  B a11y: name/role/value, keyboard, focus, dialog, 44px, color+non-color heat
G7  B pixel: 390 EN/KO, 430, desktop; approved masks only
G8  five-person blind round + issue ledger
```

G2~G7은 `/ondo-b` route seam이 Root에 의해 승인될 때까지 collection-only `skip` 상태다. skip 수가 1개라도 남은 라운드는 clean이 아니다.

## 3. Viewport · locale · pixel 계약

| Tier | Viewport | Locale | 범위 |
|---|---:|---|---|
| P0 | 390×844 | EN, KO | 모든 Flow의 layout-distinct entry/error/terminal |
| P1 | 430×932 | EN | 모든 Flow terminal; 긴 sheet·keyboard·safe area |
| P2 | 1440×1000 | EN | 모든 Flow return; 430px 중심 shell·외부 rail 없음 |
| Stress | 360×800 | EN 또는 KO long copy | onboarding/map/place/gate/chat/My/Labs 대표 screen |

- time, timezone, fixture, fonts, animation을 고정한다.
- `.leaflet-tile-pane`과 명시된 `[data-qa-mask="dynamic"]`만 mask 가능하다.
- ONDO marker, heat, label, sheet, attribution, nav, error, focus는 mask 금지다.
- snapshot 전체 갱신 금지. 각 변경은 issue/decision ID, Visual reviewer, Integrator 승인이 필요하다.
- metadata 12/16, body 14/20, enabled control 44×44 이상, primary CTA 48~52px를 bounding-box assertion으로 확인한다.

## 4. Content · truth 계약

각 `B-COPY-FL-NNN-KO/EN`은 정상뿐 아니라 loading/empty/error/expired/unsupported/retry/cancel/return 문구를 읽는다.

자동 차단 문자열/주장:

- raw `FX-*`, `SCN-*`, stack trace, `fixtureId`, `undefined`, `null`
- 제품 UI의 `DEMO`, `mock` 또는 개발자용 route/query 설명
- fixture wallet/bridge/mint를 실제 성공·실제 testnet transaction으로 주장
- OpenDID가 EAS를 사용하거나 상속한다는 주장
- zkLogin이 KYC 또는 멀티체인 지갑이라는 주장
- OOKRW가 상환 가능한 KRW 또는 사용자 custody 잔고라는 주장
- Person/KYC/국적을 안전·전문성·평판 점수로 표현
- 강제 성별·국적 matching 암시

허용되는 사용자 truth copy는 맥락에 맞는 `Simulated`, `Contract only`, `Not connected`, `browser-local`, `read only`다. 기술 라벨을 숨기지 않되 Hero CTA보다 더 큰 hierarchy를 주지 않는다.

## 5. Dead CTA 정의

visible+enabled control은 다음 중 하나를 2초 안에 보여야 한다.

- canonical state 또는 URL 변화
- dialog/sheet/menu의 열림/닫힘
- 명시적 pending/error/success feedback
- 유효한 외부 `href`
- disabled 전환과 진행 상태

아무 변화가 없거나, 잘못된 Flow로 이동하거나, 맥락 없는 home으로 튕기면 actionable issue다. 취소·뒤로·닫기·retry도 CTA로 센다.

## 6. 5인 blind review

| 역할 | 독립 질문 | 필수 evidence |
|---|---|---|
| UX/IA | 다음 행동, 깊이, backtracking, returnTo, dead end가 명확한가 | task 녹화/steps, FL/state, blocking moment |
| Visual | hierarchy, spacing, typography, heat encoding, 모든 surface의 일관성 | viewport screenshot, token/geometry 근거 |
| Data/Content | provenance/freshness/Limited/simulation과 KO/EN이 정직한가 | copy excerpt, fixture/state, truth 판정 |
| Traveler | 한국 지명을 몰라도 F&B hot place를 찾고 gate/recovery를 이해하는가 | A/B task result, 혼동 지점, locale |
| Business/PO | “로컬이 알려주는 지금 뜨는 식음료” 가치와 DID의 JIT 위치가 맞는가 | value comprehension, scope/roadmap 영향 |

Round 시작 전 reviewer에게 A/B task pack만 주고 다른 reviewer 이슈를 보여주지 않는다. 순서는 R1에서 3명 B→A, 2명 A→B로 counterbalance한다. R2에서는 순서와 scenario pack을 교환한다.

제출 schema:

```text
Evidence ID:
Reviewer role:
Candidate SHA:
Variant order:
REQ / FL / checkpoint:
Persona / viewport / locale:
Reproduction steps:
Observed / expected:
Screenshot or trace:
Severity S0/S1/S2/S3:
Actionable yes/no + rule:
Proposed fix:
```

## 7. Triage · 합의

- S0/S1은 한 명이 재현해도 block한다.
- 자동화 실패는 투표 없이 actionable이다.
- S2는 재현 가능한 locked invariant 위반이면 한 명 evidence로도 actionable이고, 순수 UX 판단이면 2명 독립 제보부터 actionable이다.
- S3 취향은 token 위반 또는 3/5 독립 합의일 때 actionable이다.
- 3/5 공통 피드백은 우선순위를 올리지만 minority truth/privacy/a11y 문제를 지우지 않는다.
- `Duplicate`는 살아 있는 issue ID를 가리켜야 한다.
- `Deferred`는 owner, 이유, 재개 trigger/date, 현재 B 영향 없음의 증거가 모두 있어야 한다.
- `Needs decision`은 unresolved actionable로 센다.

## 8. Clean round와 종료

Clean round 조건:

1. 같은 product SHA에 G0~G8이 실행됨.
2. 19/19 REQ, 18/18 FL, 126/126 browser slot, 72/72 pixel slot, 36/36 content slot, 18/18 a11y slot이 `PASS` 또는 근거 있는 `NOT_APPLICABLE`이다.
3. skip, not run, missing evidence가 0이다.
4. S0/S1/S2 unresolved가 0이다.
5. token/a11y/content/truth violation이 0이다.
6. 기존 issue가 commit·test·review evidence로 닫혔다.
7. 새 actionable issue가 0이다.

종료는 **동일 product SHA에서 다섯 역할이 두 번 연속 clean**일 때만 가능하다. CSS, copy, fixture, selector, product code가 바뀌면 clean streak를 0으로 되돌린다. manifest/checksum처럼 제품에 영향 없는 evidence-only commit만 streak를 유지할 수 있고 Root가 이를 기록한다.

목표는 주관적 literal issue 0이 아니라 `zero unresolved actionable issues`다. 재현 불가 취향 메모를 억지로 수정하지 않고, 재현 가능한 소수 의견을 다수결로 묻지 않는다.

## 9. B promotion

- B는 A보다 18 Flow completion/recovery가 비열하지 않아야 한다.
- 5명 중 3명 이상이 B의 clarity/hierarchy를 선호해야 한다.
- 어느 reviewer도 truth/privacy/accessibility regression을 재현하지 않아야 한다.
- stakeholder가 promote/hold를 결정한다.
- promote 시 새 candidate SHA, URL, evidence manifest, As-built를 기록한다. A tag와 URL은 rollback을 위해 보존한다.
