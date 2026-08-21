# ONDO B · Requirement → Flow → Actual Evidence Matrix

상태: `HONEST REGISTRY · R5 COMPLETE NOT CLEAN · 3/3 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

R5 검토 제품 SHA: `9ec3d192d0ebdc9614d980bdb173633aee16fc17`

R5 검토 Harness SHA는 `12354bcf71621c00a08433faf09cbb000683ae61`, reviewed digest는 `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b`다. Frozen retry candidate는 Product `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc`, Harness/HEAD `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f`, digest `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91`다.

## 1. 판정 규칙

- `ACTUAL`: `/ondo-b`의 실제 UI interaction 또는 state persistence로 증명한다.
- `GAP`: Flow Catalog가 요구하지만 검증 대상 제품 SHA에서 도달할 수 없다. PASS/N/A로 세지 않는다.
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

현재 registry 판정은 정확히 `18 flows · 126 checkpoints · 121 ACTUAL · 5 N/A · 0 GAP`이다. 18개 composite journey가 여러 checkpoint를 함께 증명하고 각 checkpoint는 assertion/proof 또는 reasoned N/A와 연결된다. 모든 checkpoint가 같은 이름의 독립 `test.step`을 가진다고 주장하지 않는다. Retry static discovery는 `B 504 tests / 31 files`, registry는 `5/5 PASS`; full browser result는 automated gate가 끝난 뒤에만 봉인한다.

## 4. Browser suites

| Suite | Real evidence | Count per project |
|---|---|---:|
| `ondo-b-flow-coverage.spec.ts` | 18 composite journeys; grouped steps와 assertions가 121 ACTUAL checkpoint proof를 함께 제공 | 18 |
| `ondo-b-product-browser.spec.ts` | Seoul/Busan 200, official truth, external map fallback/retry | 4 |
| `ondo-b-content.spec.ts` | 14 actual surfaces × KO/EN | 28 |
| `ondo-b-a11y-interaction.spec.ts` | 14 actual surfaces | 14 |
| `ondo-b-registry.spec.ts` | exact ID, gap/N/A reason, synthetic adapter absence | 2 |

## 5. Pixel evidence

실제 layout/state가 다른 `47 visual cases / 45 distinct state IDs`를 아래 여섯 viewport에서 각각 실행한다.

`360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`

SLEEK R5는 reviewed tuple에서 `5/5 COMPLETE · NOT CLEAN`이며 D1/D3/D5가 서로 다른 objective S2 세 건을 남겼고 D2/D4는 `CLEAN`이었다. Retry tuple에 `3/3 FIXED AND AUTOMATED`가 포함됐고 exact-tuple full automated gate가 통과했다. R5 retry는 `READY TO START`, clean streak는 `0/2`, 배포 상태는 `NOT DEPLOYED`다.

목표 baseline은 `47 × 6 = 282` PNG다. 기존 surface에 `CITY-FILTERED-MAP`을 추가해 한 건 검색 후 Map/selection/legend 동기화를 고정한다.

`B_CHECKPOINT_VISUAL_EVIDENCE`가 126개 checkpoint 각각을 `pixel` 또는 `functional_only`로 매핑한다. 외부 vector tile은 결정론적 empty source로 대체하되 ONDO marker, cluster, label, sheet, navigation, truth copy는 mask하지 않는다. Retry digest는 `f1ec9b0c…`, 282장은 `18 R5-FIX + 264 R5-CARRY`; exact uninterrupted no-update full result는 `282/282 PASS`, high-risk는 `216/216 PASS`다. Nonpixel B `420+84/504`와 A `22/22`도 통과했다.

## 6. Content evidence

다음 KO/EN surface evidence ID가 registry에 있으며 retry tuple의 exact content/browser result도 full automated gate에서 통과했다.

`B-COPY-ONBOARDING-KO`, `B-COPY-ONBOARDING-EN`, `B-COPY-NATION-KO`, `B-COPY-NATION-EN`, `B-COPY-CITY-LIST-KO`, `B-COPY-CITY-LIST-EN`, `B-COPY-PLACE-KO`, `B-COPY-PLACE-EN`, `B-COPY-ACCOUNT-GATE-KO`, `B-COPY-ACCOUNT-GATE-EN`, `B-COPY-AGE-GATE-KO`, `B-COPY-AGE-GATE-EN`, `B-COPY-TABLES-KO`, `B-COPY-TABLES-EN`, `B-COPY-TABLE-CHAT-KO`, `B-COPY-TABLE-CHAT-EN`, `B-COPY-LOCAL-SIGNAL-KO`, `B-COPY-LOCAL-SIGNAL-EN`, `B-COPY-CHECKOUT-KO`, `B-COPY-CHECKOUT-EN`, `B-COPY-IDENTITY-KO`, `B-COPY-IDENTITY-EN`, `B-COPY-PROFILE-KO`, `B-COPY-PROFILE-EN`, `B-COPY-LABS-KO`, `B-COPY-LABS-EN`, `B-COPY-AFTER19-KO`, `B-COPY-AFTER19-EN`.

## 7. Shared non-map B mount

Tables, Table chat, Local Signal, Checkout, My Korea, ID/Profile/Trust, Labs, After19/JIT gate는 모두 `/ondo-b` actual route에서 연다. `/ondo`의 기존 pass 결과를 B 증거로 재사용하지 않는다.
