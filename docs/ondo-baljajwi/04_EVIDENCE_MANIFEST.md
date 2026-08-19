# ONDO B Evidence Manifest

상태: `SLOTS READY · NO B EVIDENCE CLAIMED`

RUN ID: `PENDING`

B product SHA: `PENDING`

Production build SHA: `PENDING`

## 1. Evidence rule

증거는 현재 B product SHA에 귀속되어야 한다. 로컬 임시 경로만 남기지 않고 repo 내부 `docs/ondo-baljajwi/evidence/<RUN_ID>/`에 저장하며 `sha256`, 생성 명령, viewport, locale, fixture/scenario, 결과를 이 문서에 기록한다. 실패 trace/video에는 secret·PII·정확한 사용자 위치를 넣지 않는다.

## 2. Commands

Route seam 활성화 후 Root가 실제 명령과 exit code를 채운다.

| Gate | Command ID | Command | Exit | Result file |
|---|---|---|---:|---|
| Registry | `B-CMD-REGISTRY-001` | `pnpm exec playwright test tests/e2e/ondo-b-registry.spec.ts --project=desktop-chromium --workers=1` | `NOT RUN` | `PENDING` |
| Browser | `B-CMD-E2E-001` | `pnpm exec playwright test tests/e2e/ondo-b-flow-coverage.spec.ts --project=mobile-chromium --project=desktop-chromium --workers=1` | `NOT RUN` | `PENDING` |
| Content | `B-CMD-CONTENT-001` | `pnpm exec playwright test tests/e2e/ondo-b-content.spec.ts --project=mobile-chromium --workers=1` | `NOT RUN` | `PENDING` |
| A11y/dead CTA | `B-CMD-A11Y-001` | `pnpm exec playwright test tests/e2e/ondo-b-a11y-interaction.spec.ts --project=mobile-chromium --project=desktop-chromium --workers=1` | `NOT RUN` | `PENDING` |
| Pixel mobile | `B-CMD-PIXEL-001` | `pnpm exec playwright test tests/visual/ondo-b-flow-pixels-mobile.spec.ts --project=mobile-chromium --workers=1` | `NOT RUN` | `PENDING` |
| Pixel desktop | `B-CMD-PIXEL-002` | `pnpm exec playwright test tests/visual/ondo-b-flow-pixels-desktop.spec.ts --project=desktop-chromium --workers=1` | `NOT RUN` | `PENDING` |

## 3. Exact browser slot registry

각 Flow는 다음 일곱 exact suffix를 가진다. 실제 결과에는 126 ID를 개별 행으로 확장하고 wildcard를 쓰지 않는다.

| Flow | ENTRY | DECISION | CANCEL | ERROR | RETRY | TERMINAL | RETURN |
|---|---|---|---|---|---|---|---|
| `FL-001` | `B-E2E-FL-001-ENTRY` | `B-E2E-FL-001-DECISION` | `B-E2E-FL-001-CANCEL` | `B-E2E-FL-001-ERROR` | `B-E2E-FL-001-RETRY` | `B-E2E-FL-001-TERMINAL` | `B-E2E-FL-001-RETURN` |
| `FL-002` | `B-E2E-FL-002-ENTRY` | `B-E2E-FL-002-DECISION` | `B-E2E-FL-002-CANCEL` | `B-E2E-FL-002-ERROR` | `B-E2E-FL-002-RETRY` | `B-E2E-FL-002-TERMINAL` | `B-E2E-FL-002-RETURN` |
| `FL-003` | `B-E2E-FL-003-ENTRY` | `B-E2E-FL-003-DECISION` | `B-E2E-FL-003-CANCEL` | `B-E2E-FL-003-ERROR` | `B-E2E-FL-003-RETRY` | `B-E2E-FL-003-TERMINAL` | `B-E2E-FL-003-RETURN` |
| `FL-004` | `B-E2E-FL-004-ENTRY` | `B-E2E-FL-004-DECISION` | `B-E2E-FL-004-CANCEL` | `B-E2E-FL-004-ERROR` | `B-E2E-FL-004-RETRY` | `B-E2E-FL-004-TERMINAL` | `B-E2E-FL-004-RETURN` |
| `FL-005` | `B-E2E-FL-005-ENTRY` | `B-E2E-FL-005-DECISION` | `B-E2E-FL-005-CANCEL` | `B-E2E-FL-005-ERROR` | `B-E2E-FL-005-RETRY` | `B-E2E-FL-005-TERMINAL` | `B-E2E-FL-005-RETURN` |
| `FL-006` | `B-E2E-FL-006-ENTRY` | `B-E2E-FL-006-DECISION` | `B-E2E-FL-006-CANCEL` | `B-E2E-FL-006-ERROR` | `B-E2E-FL-006-RETRY` | `B-E2E-FL-006-TERMINAL` | `B-E2E-FL-006-RETURN` |
| `FL-007` | `B-E2E-FL-007-ENTRY` | `B-E2E-FL-007-DECISION` | `B-E2E-FL-007-CANCEL` | `B-E2E-FL-007-ERROR` | `B-E2E-FL-007-RETRY` | `B-E2E-FL-007-TERMINAL` | `B-E2E-FL-007-RETURN` |
| `FL-008` | `B-E2E-FL-008-ENTRY` | `B-E2E-FL-008-DECISION` | `B-E2E-FL-008-CANCEL` | `B-E2E-FL-008-ERROR` | `B-E2E-FL-008-RETRY` | `B-E2E-FL-008-TERMINAL` | `B-E2E-FL-008-RETURN` |
| `FL-009` | `B-E2E-FL-009-ENTRY` | `B-E2E-FL-009-DECISION` | `B-E2E-FL-009-CANCEL` | `B-E2E-FL-009-ERROR` | `B-E2E-FL-009-RETRY` | `B-E2E-FL-009-TERMINAL` | `B-E2E-FL-009-RETURN` |
| `FL-010` | `B-E2E-FL-010-ENTRY` | `B-E2E-FL-010-DECISION` | `B-E2E-FL-010-CANCEL` | `B-E2E-FL-010-ERROR` | `B-E2E-FL-010-RETRY` | `B-E2E-FL-010-TERMINAL` | `B-E2E-FL-010-RETURN` |
| `FL-011` | `B-E2E-FL-011-ENTRY` | `B-E2E-FL-011-DECISION` | `B-E2E-FL-011-CANCEL` | `B-E2E-FL-011-ERROR` | `B-E2E-FL-011-RETRY` | `B-E2E-FL-011-TERMINAL` | `B-E2E-FL-011-RETURN` |
| `FL-012` | `B-E2E-FL-012-ENTRY` | `B-E2E-FL-012-DECISION` | `B-E2E-FL-012-CANCEL` | `B-E2E-FL-012-ERROR` | `B-E2E-FL-012-RETRY` | `B-E2E-FL-012-TERMINAL` | `B-E2E-FL-012-RETURN` |
| `FL-013` | `B-E2E-FL-013-ENTRY` | `B-E2E-FL-013-DECISION` | `B-E2E-FL-013-CANCEL` | `B-E2E-FL-013-ERROR` | `B-E2E-FL-013-RETRY` | `B-E2E-FL-013-TERMINAL` | `B-E2E-FL-013-RETURN` |
| `FL-014` | `B-E2E-FL-014-ENTRY` | `B-E2E-FL-014-DECISION` | `B-E2E-FL-014-CANCEL` | `B-E2E-FL-014-ERROR` | `B-E2E-FL-014-RETRY` | `B-E2E-FL-014-TERMINAL` | `B-E2E-FL-014-RETURN` |
| `FL-015` | `B-E2E-FL-015-ENTRY` | `B-E2E-FL-015-DECISION` | `B-E2E-FL-015-CANCEL` | `B-E2E-FL-015-ERROR` | `B-E2E-FL-015-RETRY` | `B-E2E-FL-015-TERMINAL` | `B-E2E-FL-015-RETURN` |
| `FL-016` | `B-E2E-FL-016-ENTRY` | `B-E2E-FL-016-DECISION` | `B-E2E-FL-016-CANCEL` | `B-E2E-FL-016-ERROR` | `B-E2E-FL-016-RETRY` | `B-E2E-FL-016-TERMINAL` | `B-E2E-FL-016-RETURN` |
| `FL-017` | `B-E2E-FL-017-ENTRY` | `B-E2E-FL-017-DECISION` | `B-E2E-FL-017-CANCEL` | `B-E2E-FL-017-ERROR` | `B-E2E-FL-017-RETRY` | `B-E2E-FL-017-TERMINAL` | `B-E2E-FL-017-RETURN` |
| `FL-018` | `B-E2E-FL-018-ENTRY` | `B-E2E-FL-018-DECISION` | `B-E2E-FL-018-CANCEL` | `B-E2E-FL-018-ERROR` | `B-E2E-FL-018-RETRY` | `B-E2E-FL-018-TERMINAL` | `B-E2E-FL-018-RETURN` |

## 4. Result summary

| Family | Expected | Passed | Failed | Skipped | Manifest/checksum |
|---|---:|---:|---:|---:|---|
| Registry | 1 | 0 | 0 | 0 | `PENDING` |
| Browser checkpoints | 126 | 0 | 0 | 126 | `PENDING_ROUTE_SEAM` |
| Pixel checkpoints | 72 | 0 | 0 | 72 | `PENDING_ROUTE_SEAM` |
| Content locale | 36 | 0 | 0 | 36 | `PENDING_ROUTE_SEAM` |
| A11y/dead CTA | 18 | 0 | 0 | 18 | `PENDING_ROUTE_SEAM` |
| Runtime console/pageerror | all browser tests | 0 | 0 | all | `PENDING_ROUTE_SEAM` |
| Blind review round 1 | 5 | 0 | 0 | 5 | `NOT STARTED` |
| Blind review round 2 | 5 | 0 | 0 | 5 | `NOT STARTED` |

## 5. Release evidence

| Item | Value |
|---|---|
| Round 1 verdict | `NOT RUN` |
| Round 2 verdict | `NOT RUN` |
| Consecutive clean count | `0` |
| Unresolved actionable | `UNKNOWN` |
| A functional non-inferiority | `NOT EVALUATED` |
| B preference | `NOT EVALUATED` |
| Promotion | `BLOCKED` |
