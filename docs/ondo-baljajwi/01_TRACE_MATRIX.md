# ONDO B · Requirement → Flow → Actual Evidence Matrix

상태: `HONEST REGISTRY · PRODUCT/HARNESS/BASELINE FROZEN · FULL AUTOMATED QA PASS · SLEEK R2 READY TO START`

고정 제품 SHA: `b00d5d6c2d9a6fee895dddb52b999733d2ff8026`

검수 Harness SHA: `b00d5d6c2d9a6fee895dddb52b999733d2ff8026`

## 1. 판정 규칙

- `ACTUAL`: `/ondo-b`의 실제 UI interaction 또는 state persistence로 증명한다.
- `GAP`: Flow Catalog가 요구하지만 고정 제품 SHA에서 도달할 수 없다. PASS/N/A로 세지 않는다.
- `N/A`: 제품 계약상 별도 오류·retry 화면이 없어야 하며 정상 fallback/재평가가 대신한다. 이유가 필수다.
- 하나의 composite browser test가 여러 checkpoint를 증명할 수 있다. checkpoint 수를 화면 수나 test 수로 부풀리지 않는다.

## 2. 19 REQ registry

| B 요구 | 원 요구 | 핵심 B proof |
|---|---|---|
| `B-REQ-001` | `REQ-001` | `FL-005`, `FL-008`: Korean local은 map 우선, CX는 local action의 JIT gate |
| `B-REQ-002` | `REQ-002` | `FL-006`, `FL-009`: Residence 지원 전 disclosure와 passport alternate |
| `B-REQ-003` | `REQ-003` | `FL-007`, `FL-012`: short-term persona, provider-neutral Person check, first mission 분리. `FL-002`는 독립 Age proof flow |
| `B-REQ-004` | `REQ-004` | `FL-016`, `FL-018`: OpenDID/EAS canonical envelope와 Labs truth |
| `B-REQ-005` | `REQ-005` | `FL-002`, `FL-005`~`FL-011`, `FL-013`, `FL-017`, `FL-018`: gate 분리 |
| `B-REQ-006` | `REQ-006` | `FL-004`, `FL-018`: read-only asset projection와 ordered bridge |
| `B-REQ-007` | `REQ-007` | `FL-001`, `FL-012`: sourced F&B + local contribution signal |
| `B-REQ-008` | `REQ-008` | `FL-003`, `FL-015`: place/time Table과 optional public profile |
| `B-REQ-009` | `REQ-009` | `FL-012`: browser-local photo draft/fail/retry |
| `B-REQ-010` | `REQ-010` | `FL-003`: confirmed-member image chat and lock |
| `B-REQ-011` | `REQ-011` | `FL-004`, `FL-017`: KRW/OOKRW truth, independent Payment KYC |
| `B-REQ-012` | `REQ-012` | `FL-002`, `FL-013`, `FL-014`: manual/auto After19 guards |
| `B-REQ-013` | `REQ-013` | `FL-001`, `FL-016`: Can I Go는 place facts로 축소 |
| `B-REQ-014` | `REQ-014` | `FL-016`, `FL-018`: limited trait, no safety guarantee |
| `B-REQ-015` | `REQ-015` | `FL-003`, `FL-012`, `FL-015`: reputation axes 분리 |
| `B-REQ-016` | `REQ-016` | `FL-004`, `FL-011`, `FL-018`: unique visit 9→10, badge opt-in |
| `B-REQ-017` | `REQ-017` | `FL-001`: Korea shell, Seoul/Busan 200 each |
| `B-REQ-018` | `REQ-018` | all actual surfaces: responsive KO/EN + keyboard/a11y |
| `B-REQ-019` | `REQ-019` | `FL-001`: heat non-color labels and signal truth |

## 3. Exact 18-flow checkpoint registry

| Flow | ENTRY | DECISION | CANCEL | ERROR | RETRY | TERMINAL | RETURN |
|---|---|---|---|---|---|---|---|
| `FL-001` | `B-E2E-FL-001-ENTRY` ACTUAL | `B-E2E-FL-001-DECISION` ACTUAL | `B-E2E-FL-001-CANCEL` ACTUAL | `B-E2E-FL-001-ERROR` ACTUAL — deterministic tile abort가 error/list fallback을 표시 | `B-E2E-FL-001-RETRY` ACTUAL — Retry가 새 map attempt 2를 시작 | `B-E2E-FL-001-TERMINAL` ACTUAL | `B-E2E-FL-001-RETURN` ACTUAL |
| `FL-002` | `B-E2E-FL-002-ENTRY` ACTUAL | `B-E2E-FL-002-DECISION` ACTUAL | `B-E2E-FL-002-CANCEL` ACTUAL | `B-E2E-FL-002-ERROR` ACTUAL | `B-E2E-FL-002-RETRY` ACTUAL | `B-E2E-FL-002-TERMINAL` ACTUAL | `B-E2E-FL-002-RETURN` ACTUAL — locked venueId를 보존해 동일 상세와 After19 ON으로 복귀 |
| `FL-003` | `B-E2E-FL-003-ENTRY` ACTUAL | `B-E2E-FL-003-DECISION` ACTUAL | `B-E2E-FL-003-CANCEL` ACTUAL | `B-E2E-FL-003-ERROR` ACTUAL | `B-E2E-FL-003-RETRY` ACTUAL | `B-E2E-FL-003-TERMINAL` ACTUAL | `B-E2E-FL-003-RETURN` ACTUAL |
| `FL-004` | `B-E2E-FL-004-ENTRY` ACTUAL | `B-E2E-FL-004-DECISION` ACTUAL | `B-E2E-FL-004-CANCEL` ACTUAL | `B-E2E-FL-004-ERROR` ACTUAL | `B-E2E-FL-004-RETRY` ACTUAL | `B-E2E-FL-004-TERMINAL` ACTUAL | `B-E2E-FL-004-RETURN` ACTUAL |
| `FL-005` | `B-E2E-FL-005-ENTRY` ACTUAL | `B-E2E-FL-005-DECISION` ACTUAL | `B-E2E-FL-005-CANCEL` ACTUAL | `B-E2E-FL-005-ERROR` ACTUAL | `B-E2E-FL-005-RETRY` ACTUAL | `B-E2E-FL-005-TERMINAL` ACTUAL | `B-E2E-FL-005-RETURN` ACTUAL |
| `FL-006` | `B-E2E-FL-006-ENTRY` ACTUAL | `B-E2E-FL-006-DECISION` ACTUAL | `B-E2E-FL-006-CANCEL` ACTUAL | `B-E2E-FL-006-ERROR` ACTUAL | `B-E2E-FL-006-RETRY` ACTUAL | `B-E2E-FL-006-TERMINAL` ACTUAL | `B-E2E-FL-006-RETURN` ACTUAL |
| `FL-007` | `B-E2E-FL-007-ENTRY` ACTUAL | `B-E2E-FL-007-DECISION` ACTUAL | `B-E2E-FL-007-CANCEL` ACTUAL | `B-E2E-FL-007-ERROR` ACTUAL | `B-E2E-FL-007-RETRY` `N/A` — validation failure는 retry 화면 대신 usable map fallback | `B-E2E-FL-007-TERMINAL` ACTUAL | `B-E2E-FL-007-RETURN` ACTUAL |
| `FL-008` | `B-E2E-FL-008-ENTRY` ACTUAL | `B-E2E-FL-008-DECISION` ACTUAL | `B-E2E-FL-008-CANCEL` ACTUAL | `B-E2E-FL-008-ERROR` ACTUAL | `B-E2E-FL-008-RETRY` `N/A` — Guest map이 recovery이며 onboarding에서 CX를 시작하지 않음 | `B-E2E-FL-008-TERMINAL` ACTUAL | `B-E2E-FL-008-RETURN` ACTUAL |
| `FL-009` | `B-E2E-FL-009-ENTRY` ACTUAL | `B-E2E-FL-009-DECISION` ACTUAL | `B-E2E-FL-009-CANCEL` ACTUAL | `B-E2E-FL-009-ERROR` ACTUAL | `B-E2E-FL-009-RETRY` `N/A` — Guest map이 recovery이며 Residence를 시작하지 않음 | `B-E2E-FL-009-TERMINAL` ACTUAL | `B-E2E-FL-009-RETURN` ACTUAL |
| `FL-010` | `B-E2E-FL-010-ENTRY` ACTUAL | `B-E2E-FL-010-DECISION` ACTUAL | `B-E2E-FL-010-CANCEL` ACTUAL | `B-E2E-FL-010-ERROR` ACTUAL | `B-E2E-FL-010-RETRY` ACTUAL | `B-E2E-FL-010-TERMINAL` ACTUAL | `B-E2E-FL-010-RETURN` ACTUAL |
| `FL-011` | `B-E2E-FL-011-ENTRY` ACTUAL | `B-E2E-FL-011-DECISION` ACTUAL | `B-E2E-FL-011-CANCEL` ACTUAL | `B-E2E-FL-011-ERROR` ACTUAL — `save-failed`가 장소/CTA를 보존한 visible error를 표시 | `B-E2E-FL-011-RETRY` ACTUAL — 같은 장소에서 Retry save가 persisted Saved로 전이 | `B-E2E-FL-011-TERMINAL` ACTUAL | `B-E2E-FL-011-RETURN` ACTUAL |
| `FL-012` | `B-E2E-FL-012-ENTRY` ACTUAL | `B-E2E-FL-012-DECISION` ACTUAL | `B-E2E-FL-012-CANCEL` ACTUAL | `B-E2E-FL-012-ERROR` ACTUAL | `B-E2E-FL-012-RETRY` ACTUAL | `B-E2E-FL-012-TERMINAL` ACTUAL | `B-E2E-FL-012-RETURN` ACTUAL |
| `FL-013` | `B-E2E-FL-013-ENTRY` ACTUAL | `B-E2E-FL-013-DECISION` ACTUAL | `B-E2E-FL-013-CANCEL` ACTUAL | `B-E2E-FL-013-ERROR` ACTUAL | `B-E2E-FL-013-RETRY` ACTUAL | `B-E2E-FL-013-TERMINAL` ACTUAL | `B-E2E-FL-013-RETURN` ACTUAL |
| `FL-014` | `B-E2E-FL-014-ENTRY` ACTUAL | `B-E2E-FL-014-DECISION` ACTUAL | `B-E2E-FL-014-CANCEL` ACTUAL | `B-E2E-FL-014-ERROR` `N/A` — guard false는 normal ONDO | `B-E2E-FL-014-RETRY` `N/A` — 다음 resume 때 자동 재평가 | `B-E2E-FL-014-TERMINAL` ACTUAL | `B-E2E-FL-014-RETURN` ACTUAL |
| `FL-015` | `B-E2E-FL-015-ENTRY` ACTUAL | `B-E2E-FL-015-DECISION` ACTUAL | `B-E2E-FL-015-CANCEL` ACTUAL | `B-E2E-FL-015-ERROR` ACTUAL | `B-E2E-FL-015-RETRY` ACTUAL | `B-E2E-FL-015-TERMINAL` ACTUAL | `B-E2E-FL-015-RETURN` ACTUAL |
| `FL-016` | `B-E2E-FL-016-ENTRY` ACTUAL | `B-E2E-FL-016-DECISION` ACTUAL | `B-E2E-FL-016-CANCEL` ACTUAL | `B-E2E-FL-016-ERROR` ACTUAL | `B-E2E-FL-016-RETRY` ACTUAL | `B-E2E-FL-016-TERMINAL` ACTUAL | `B-E2E-FL-016-RETURN` ACTUAL |
| `FL-017` | `B-E2E-FL-017-ENTRY` ACTUAL | `B-E2E-FL-017-DECISION` ACTUAL | `B-E2E-FL-017-CANCEL` ACTUAL | `B-E2E-FL-017-ERROR` ACTUAL | `B-E2E-FL-017-RETRY` ACTUAL | `B-E2E-FL-017-TERMINAL` ACTUAL | `B-E2E-FL-017-RETURN` ACTUAL |
| `FL-018` | `B-E2E-FL-018-ENTRY` ACTUAL | `B-E2E-FL-018-DECISION` ACTUAL | `B-E2E-FL-018-CANCEL` ACTUAL | `B-E2E-FL-018-ERROR` ACTUAL | `B-E2E-FL-018-RETRY` ACTUAL | `B-E2E-FL-018-TERMINAL` ACTUAL | `B-E2E-FL-018-RETURN` ACTUAL |

현재 registry 판정은 정확히 `18 flows · 126 checkpoints · 121 ACTUAL · 5 N/A · 0 GAP`이다. 18개 composite journey가 여러 checkpoint를 함께 증명하고 각 checkpoint는 assertion/proof 또는 reasoned N/A와 연결된다. 모든 checkpoint가 같은 이름의 독립 `test.step`을 가진다고 주장하지 않는다. 동결 tuple의 nonpixel E2E는 `215 pass / 5 intentional viewport skips / 0 fail`이며, checkpoint mapping은 `121 actual + 5 N/A + 0 GAP`으로 통과했다.

## 4. Browser suites

| Suite | Real evidence | Count per project |
|---|---|---:|
| `ondo-b-flow-coverage.spec.ts` | 18 composite journeys; grouped steps와 assertions가 121 ACTUAL checkpoint proof를 함께 제공 | 18 |
| `ondo-b-product-browser.spec.ts` | Seoul/Busan 200, official truth, external map fallback/retry | 4 |
| `ondo-b-content.spec.ts` | 14 actual surfaces × KO/EN | 28 |
| `ondo-b-a11y-interaction.spec.ts` | 14 actual surfaces | 14 |
| `ondo-b-registry.spec.ts` | exact ID, gap/N/A reason, synthetic adapter absence | 2 |

## 5. Pixel evidence

실제 layout/state가 다른 `45 visual cases / 43 distinct state IDs`를 아래 여섯 viewport에서 각각 실행한다.

`360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`

현재 SLEEK R2는 `READY TO START`이고 reviewer verdict는 아직 없다. Clean streak는 `0/2`, 배포 상태는 `NOT DEPLOYED`다.

목표 baseline은 `45 × 6 = 270` PNG다. 온보딩 3단계, Nation/City/List/Fallback, Place peek/detail, After19 prompt/locked/return, Save error/recovery, Account/Person/Age/Payment gate, Tables/chat/media/feedback/report, Local Signal, Checkout, My/Profile/Trust, Labs trait/bridge를 포함한다.

`B_CHECKPOINT_VISUAL_EVIDENCE`가 126개 checkpoint 각각을 `pixel` 또는 `functional_only`로 매핑한다. `pixel`은 하나 이상의 canonical visual case ID를, `functional_only`는 별도 layout screenshot을 만들지 않는 이유와 browser proof를 가진다. 외부 vector tile은 결정론적 empty source로 대체하되 ONDO marker, cluster, label, sheet, navigation, truth copy는 mask하지 않는다. 동결된 270장 baseline은 digest `e24d5fe2dd16b984e99fbfaad486de8d3ac47d07fefa37e2e63ee5d32df8d812`이며 unchanged-baseline `270/270 PASS`를 통과했다.

## 6. Content evidence

다음 KO/EN surface evidence ID가 registry에 있으며 동결 tuple의 content/browser gate에서 통과했다.

`B-COPY-ONBOARDING-KO`, `B-COPY-ONBOARDING-EN`, `B-COPY-NATION-KO`, `B-COPY-NATION-EN`, `B-COPY-CITY-LIST-KO`, `B-COPY-CITY-LIST-EN`, `B-COPY-PLACE-KO`, `B-COPY-PLACE-EN`, `B-COPY-ACCOUNT-GATE-KO`, `B-COPY-ACCOUNT-GATE-EN`, `B-COPY-AGE-GATE-KO`, `B-COPY-AGE-GATE-EN`, `B-COPY-TABLES-KO`, `B-COPY-TABLES-EN`, `B-COPY-TABLE-CHAT-KO`, `B-COPY-TABLE-CHAT-EN`, `B-COPY-LOCAL-SIGNAL-KO`, `B-COPY-LOCAL-SIGNAL-EN`, `B-COPY-CHECKOUT-KO`, `B-COPY-CHECKOUT-EN`, `B-COPY-IDENTITY-KO`, `B-COPY-IDENTITY-EN`, `B-COPY-PROFILE-KO`, `B-COPY-PROFILE-EN`, `B-COPY-LABS-KO`, `B-COPY-LABS-EN`, `B-COPY-AFTER19-KO`, `B-COPY-AFTER19-EN`.

## 7. Shared non-map B mount

Tables, Table chat, Local Signal, Checkout, My Korea, ID/Profile/Trust, Labs, After19/JIT gate는 모두 `/ondo-b` actual route에서 연다. `/ondo`의 기존 pass 결과를 B 증거로 재사용하지 않는다.
