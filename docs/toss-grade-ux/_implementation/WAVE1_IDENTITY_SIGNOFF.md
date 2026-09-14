# Wave 1 · Identity / Account / Person author sign-off

작성일: 2026-09-04
적용 기준: `00_UX_STANDARD`, `00_PRD_PRESERVATION_LEDGER`, `FL-005`, `FL-006`, `FL-010`, `01_PRD_9H`

## 결론

K-Tour ID 준비, Account 생성, Person 확인을 하나의 모바일-first JIT 문법으로 정리했다. Account·Person·19+·Payment KYC·K-Tour artifact·Presentation은 계속 독립 축이며, normal provider 미연결 경로는 성공으로 보이지 않는다. 성공 가능한 검토 경로는 `?qa=1`의 explicit review authority를 통해서만 실행되고 화면에 `외부 서비스 확인 없음` provenance가 보인다.

## Acceptance ↔ evidence

| 요구 | 구현 증거 | 계약 증거 | 상태 |
|---|---|---|---|
| 원 행동에 붙은 한 장의 JIT gate와 exact return | `action-gate-coordinator-b.tsx`: canonical gate 재계산, `privateContextForBAction`, `restoreContext`, ready/cancel events, one-shot action contract 유지 | `ondo-b-action-gate-plan.spec.ts`, `ondo-wave1-identity-jit.spec.ts` W1-ID-004 | PASS |
| Account는 이 탭의 local actual일 뿐 다른 확인 축이 아님 | `account-save-gate-b.tsx`: `localActual("account")`의 `LOCAL_COMMITTED`만 완료 | W1-ID-001 및 기존 account/return contracts | PASS |
| Account return은 정확한 한 객체에만 결합 | `return-to-b.ts`: canonical/editorial exact-own-key allowlist, canonical hash, token-keyed private staged expectation, 15분 TTL, consume/rollback/finalize/discard tombstone | `ondo-wave1-account-return-integrity.spec.ts` W1-ACCOUNT-RT-001~004/006 | PASS |
| Account+Save는 pending 뒤 두 저장소가 모두 성공해야 완료 | provider의 `ACC-CREATING`과 `commitBAccountSaveTransaction`: exact consume → Save preimage+`prepared` marker의 단일 device write → Account write → Save+`terminal` marker의 단일 device write → finalize. marker는 token/hash/target/targetWasSaved/phase만 담는다. begin/cancel/device/Account write 실패는 expectation과 원 객체를 보존하거나 안전하게 폐기하며 Account/Save 성공을 만들지 않음 | W1-ACCOUNT-RT-005/007/008/011~013, B-ACCOUNT-004 | PASS |
| Account/Save cross-key 보상 실패도 reload에서 fail-closed | legitimate `prepared` write는 Save 전 membership과 marker를 동일한 `ondo-b.device.v1` 값에 원자적으로 기록한다. hydration에서 marker는 membership을 추가·삭제하는 권한이 없고 Guest/quarantine 여부만 결정한다. `targetWasSaved`와 실제 membership이 어긋나거나 marker가 extra/missing/target-swap된 경우에도 sanitized raw Save 목록은 그대로 보존한다. exact terminal marker+target만 완료된 device 결과로 인정한다. blocked marker cleanup은 canonical Guest session의 exact readback 뒤에만 허용하며 실패하면 marker와 in-memory device persistence block을 유지한다. | W1-ACCOUNT-RT-011~015 | PASS |
| private Account return context가 reload에서 사라지면 safe surface로 복귀 | hydration은 public token을 성공에 사용하지 않고 canonical Guest/Account-only snapshot으로 교체한다. 교체가 증명되지 않으면 stale token을 삭제하고 readback한다. | W1-ACCOUNT-RT-009/010 | PASS |
| Account pending은 취소 가능하고 opener focus는 overlay 정리 뒤 복원 | processing에도 localized 44px close가 유지되고 Escape/close가 동일 cancel을 사용한다. shared focus handoff가 다음 animation frame부터 inert 해제를 기다려 exact Save opener를 찾는다. | B-ACCOUNT-003/004; browser focus evidence pending | STATIC PASS / BROWSER PENDING |
| normal providerless Person/credential은 fail-closed | coordinator/direct walkthrough/setup에서 normal은 `providerUnavailable`; unavailable에 checkmark·성공 mutation·무의미한 Retry 없음 | W1-ID-001, W1-ID-004 | PASS |
| review fixture가 normal success로 새지 않음 | `useQaControls` + `createReviewFixtureAuthority` + `reviewFixture`; fixture token은 현재 pending token/method에 결합 | W1-ID-001 및 execution-mode contracts | PASS |
| Person·Payment review 결과가 일반 Ready로 축약되지 않음 | canonical axis receipt를 presentation-only classifier로 소비해 Traveler와 Profile에 현재/만료 `검토용 결과 · 외부 확인 없음`과 shield glyph를 표시한다. receipt 없는 normal unavailable/expired에는 review 표기를 만들지 않음 | `ondo-wave1-identity-visible-provenance.spec.ts` W1-ID-PROVENANCE-001/002 | PASS |
| Mobile ID / Residence / Passport는 선택 시점에만 간결히 노출 | 세 method row에 localized label+availability; provider/DID/retention은 한 번 접는 details로 이동 | `ondo-b-opendid-onboarding-restoration.spec.ts`, W1-ID-002 | PASS |
| Residence unavailable → 같은 Person gate의 Passport 대체 | setup/coordinator의 alternate는 adapter만 Passport로 전환; pending return은 유지 | W1-ID-004 및 기존 route contracts | PASS |
| Residence 상태와 선택 결과가 정직하게 일치 | direct walkthrough는 normal 미연결=`outage`, explicit review의 `supported`/`unsupported`/`outage`를 선택 전부터 분리한다. Residence consent에는 Residence 아이콘·이름을 유지하고 unsupported/outage는 같은 sheet의 Passport로 전환한다. canonical Person session에는 unsupported enum이 없어 terminal persistence는 fail-closed `unavailable`로 축약한다. | `ondo-wave1-identity-residence-expiry.spec.ts` W1-ID-RES-001/002 | PASS (visible truth) / ENUM LIMIT NOTED |
| Passport review는 실제 사용자 raw media를 받지 않음 | redacted bundled sample → OCR/NFC boundary → face/liveness boundary → processing → Travel Pass draft; file/camera API 없음 | W1-ID-003, `ondo-b-opendid-onboarding-restoration.spec.ts` sample-only locks | PASS |
| K-Tour 준비와 Presentation 분리 | setup progress는 `Choose → Check → Add` 세 단계. action-gate origin의 Add 완료는 setup을 닫고 실제 pending requester가 있는 coordinator로 복귀; requester 없는 Traveler setup에는 share CTA 없음 | W1-ID-002, updated E2E source assertions | PASS |
| K-Tour review draft와 Presentation은 외부 발급·공유처럼 보이지 않음 | credential에 explicit review/no-provider/no-effect truth를 유지하고 Traveler에는 `검토용 초안`으로 표시한다. Presentation request/result는 `검토용 · 외부 전송 없음`/`검토용 결과 · 전송 없음`으로 표시하며 `공유 완료`를 사용하지 않음 | W1-ID-PROVENANCE-003/004 | PASS |
| review 19+ provenance가 normal과 구분됨 | coordinator의 explicit review age surface에만 localized `age-review-scope`; normal production에는 미노출 | W1-ID-001 | PASS |
| 성공은 현재 축만 변경 | Person result는 Person axis만, Account는 Account만, review Age는 global Age만, K-Tour draft는 artifact만 변경 | W1-ID-002 및 기존 independence contracts | PASS |
| 열린 Traveler ID에서 Person 만료를 즉시 반영 | Person axis `expiresAt`을 공용 status clock의 다음 tick 대상으로 포함하고, 화면의 local success도 복원된 axis가 만료되면 즉시 `expired`로 내린다. | `ondo-wave1-identity-residence-expiry.spec.ts` W1-ID-EXP-001 | PASS |
| 만료된 method를 같은 adapter로 재개 | expired Residence/Mobile ID는 CX handoff, expired Passport만 redacted document preview로 재개한다. Residence를 Passport capture로 바꾸지 않는다. | `ondo-wave1-identity-residence-expiry.spec.ts` W1-ID-EXP-002 | PASS |
| EN/KO/JA parity | method, consent, unavailable, failure, review provenance, passport sample을 모두 세 locale로 제공 | W1-ID-005 및 locale contracts | PASS |
| mobile containment | 320/350/360/390/430 폭, 844×390 계열 landscape, internal scroll, 44–48px controls, reduced-motion/forced-colors 규칙 유지 | W1-ID-005; browser evidence는 통합 lane에서 수집 | STATIC PASS / BROWSER PENDING |

## 실행 truth matrix

| 축 | Normal public | Local actual | Explicit review |
|---|---|---|---|
| Account | 사용자가 만들기 전 guest | 이 탭 방문 Account만 `LOCAL_COMMITTED` | 실패 fixture는 QA surface에만 노출 |
| Person · Mobile ID | provider 미연결 → unavailable | 없음 | success/failure/expired/unavailable/cancel을 fixture provenance와 재현 |
| Person · Residence Card | provider 미연결 → outage/unavailable + Passport 대체 | 없음 | supported는 consent로 진행, unsupported는 별도 결과+Passport 대체, outage는 임시 unavailable+Passport 대체. 모두 review provenance를 표시하며 unsupported/outage는 Person success를 만들지 않음 |
| Person · Passport | provider 미연결 → unavailable | 없음 | bundled redacted sample만 사용; 외부 확인 없음 |
| 19+ | providerless success 금지 | 없음 | explicit review receipt만 임시 eligible |
| K-Tour artifact | providerless Add/issued 금지 | 없음 | private `여행 패스 초안`; 외부 발급·공유 없음 |
| Presentation | requester 없는 setup에 없음 | 없음 | 실제 protected action의 requester/purpose/predicate/scope에서만 one-shot consent |

## Passport capability preservation

삭제된 기능은 없다. 현재 PRD가 고정한 public/review 범위에 맞춰 실제 카메라·파일 입력 대신 비개인 샘플을 사용한다.

```text
Passport method
→ consent
→ bundled redacted sample
→ OCR/NFC connector boundary
→ face/liveness connector boundary
→ processing
→ review-only Travel Pass draft
→ contextual requester action으로 exact return
```

향후 provider가 연결될 때만 raw capture permission을 요청할 수 있으며, 현재 경로는 URL/localStorage/sessionStorage/network에 document·face·DOB·nationality·provider response를 쓰지 않는다.

## Recovery / return inventory

- Close/Escape/cancel: pending mutation 0, 원 opener로 focus 복귀.
- Static unavailable: 다른 방법 또는 원 행동 복귀; 같은 unavailable을 반복하는 Retry 없음.
- Transient review failure: 동일 method/context에서만 Retry.
- Expiry/invalid return: safe public surface로 복귀; private context가 없으면 원 mutation 0.
- Success: full gate plan 재검사 후 원 mutation 직전에만 one-shot consume.
- Account pending: 동일 frame의 중복 tap은 `ACC-CREATING` 한 건으로 합치고, visible live pending 뒤에만 Account 또는 Account+Save를 commit.
- Account private-context loss: stale serialized return을 canonical Account-only snapshot으로 교체하거나 삭제/readback하고, overlay와 Save mutation은 열지 않음.
- Account cross-key recovery: terminal Save가 증명되기 전에는 legitimate prepared device 값 자체가 Save 전 membership을 유지한다. marker는 reload에서 Guest/quarantine만 강제하고 membership은 절대 재작성하지 않는다. blocked marker는 canonical Guest session의 exact readback이 성공한 뒤에만 제거하고, 실패하면 marker와 device persistence block을 유지해 다음 reload도 Guest로 격리한다. 표준 Web Storage의 atomic throw, ignored write, readback mismatch를 지원하며 non-conformant mutate-before-throw storage를 완전 복구한다고 주장하지 않는다.
- K-Tour setup from protected action: Add 후 setup을 닫고 같은 action coordinator/requester로 복귀.

## Verification

- `pnpm exec tsc --noEmit --pretty false` → PASS.
- Bundle A focused contracts (기존 21 + 신규 5) → **26/26 PASS**.
- Account return/provider focused contracts (exact key/hash, forged/unstaged/swap/extra, begin/cancel, cross-key prepared/terminal marker, forged marker membership preservation, Guest-readback-before-cleanup across two reloads, ignored/mismatch/atomic-throw storage, pending UI) + standalone dependency closure → **37/37 PASS**.
- Account hydration independent adversarial reattack (forged/corrupt marker + selective Guest-session write failure over two reloads) → **15/15 PASS**, typecheck PASS.
- `traveler-id-status-b.ts`를 standalone positive policy와 dependency assertion에 포함; `ondo-b-standalone-packaging.spec.ts` → **18/18 PASS**.
- Account stale-token quarantine + After 19 consumer persistence focused non-author rerun → **51/51 PASS**.
- `pnpm exec playwright test tests/contracts/ondo-wave1-identity-jit.spec.ts tests/contracts/ondo-wave1-identity-residence-expiry.spec.ts --config=playwright.contracts.config.ts --workers=1 --reporter=line` → **10/10 PASS** (JIT 6 + Residence/expiry 4).
- Identity/Profile visible-provenance + related regression contracts (`identity-visible-provenance`, JIT, Residence/expiry, Profile evidence, OpenDID, K-Tour meaning, premium ID/wallet, Flow 8) → **74/74 PASS**.
- Earlier related contract selection (`opendid`, `after19 restoration`, `premium consumer`, `JA`, `consumer place/table`, `action gate`) → **45/45 PASS**; final provenance lock을 포함한 Bundle A focused rerun도 **26/26 PASS**.
- `git diff --check` (owned identity + related tests) → PASS.
- Browser E2E/visual: shared Next `.next/dev` lock 지시에 따라 이 author lane에서는 실행하지 않음. root의 single isolated browser lane에서 320×568, 390×844, 430×932, 844×390, EN/KO/JA를 검증해야 함.

## Legacy contract → current behavior mapping

| 오래된 assertion | 현재 PRD-aligned contract |
|---|---|
| Account가 존재하지 않는 외부 provider를 장문으로 설명 | Account는 `localActual("account")`의 이 탭 상태이며, Person·19+·Payment가 필요할 때만 독립 확인된다는 짧은 EN/KO/JA 문구 |
| Passport 선택에서 항상 `Passport and face check`를 한 덩어리로 노출 | 선택/동의에는 `Passport check`만 노출하고, bundled redacted sample → OCR/NFC boundary → face/liveness boundary는 다음 단계에서 progressive disclosure |
| K-Tour setup progress가 `Choose → Check → Issue → Present`를 항상 노출 | setup은 `Choose → Check → Add` 세 단계만 표시; Presentation은 `origin === "action_gate"`인 실제 protected action에만 requester와 함께 표시 |
| Passport 대체 버튼이 pending envelope를 직접 다시 작성하고 provider failure helper에 의존 | 같은 pending token을 유지한 채 `selectPersonRoute("passport_ekyc")` adapter만 전환; normal은 `providerUnavailable`, explicit review만 authority-bound fixture |
| Account return이 timestamp/public venue만 맞으면 복구·저장 가능 | exact keys + canonical snapshot hash + module-private staged expectation이 모두 일치해야 consume; reload/private context loss, extra field, same-token target swap, unstaged copy는 mutation 0 |
| Account 생성과 Save가 즉시 동기 성공처럼 보이고 저장소 실패 뒤 overlay가 닫힐 수 있음 | `ACC-CREATING` live pending을 먼저 paint하고, device+Account persistence 후에만 one-shot finalize; begin 실패는 staged token 폐기, cancel clear 실패는 overlay/return 유지, commit 실패는 rollback+same-token retry |

## P0 / P1

- P0 resolved: normal providerless result가 review success로 보일 수 있던 경로를 fail-closed로 분리.
- P0 resolved: Passport raw file/camera fixture를 bundled redacted sample-only 경로로 교체.
- P0 resolved: Age review success provenance가 sighted 사용자에게 없던 문제를 explicit review surface에만 표시.
- P0 resolved: Person·Payment의 현재/만료 review axis와 Profile identity evidence가 일반 `Ready`로 축약되던 문제를 canonical receipt-bound localized review provenance와 glyph로 교체.
- P0 resolved: review로 만든 K-Tour credential을 일반 준비 완료처럼 보이거나 Presentation을 외부 공유 완료처럼 읽히게 하던 표면을 `검토용 초안` 및 `전송 없음` 상태로 교체.
- P0 resolved: forged/unstaged/extra/same-token-swapped Account return이 Account 활성화나 canonical/editorial Save mutation에 도달하지 못하도록 private staged hash와 provider commit 경계를 추가.
- P0 resolved: Account+Save가 device/Account 두 persistence 성공 전에 닫히거나 one-shot token을 잃지 않도록 rollback/finalize 순서를 고정.
- P0 resolved: Account write 뒤 terminal Save write와 보상 rollback이 함께 실패해도 `ondo-b.device.v1`의 legitimate prepared 값은 Save 전 membership을 유지하고 marker는 다음 hydration을 Guest로 격리한다. forged/corrupt marker도 기존 Save를 추가·삭제하지 않으며, 같은 token retry의 exact terminal 성공만 노출된다.
- P1 resolved: blocked Account marker hydration은 Guest session write+exact readback이 성공하기 전 device marker를 지우지 않으며, 실패한 탭과 다음 reload 모두 Account/Save를 fail-closed로 유지한다.
- P1 resolved: 기술/maker 문구와 미래축 status wall을 consumer first viewport에서 제거하고 details로 이동.
- P1 resolved: normal providerless 19+ unavailable은 성공 불가능한 Retry를 제거하고, exact 원 행동으로 돌아가는 단일 primary recovery만 제공. explicit review failure/expired의 Retry는 유지.
- P1 resolved: direct Residence 선택의 Passport 아이콘/이름 오표시를 Residence로 수정하고, normal 미연결·review unsupported·review outage·review supported를 서로 다른 visible state로 분리.
- P1 resolved: 열린 Traveler ID가 Person axis `expiresAt`을 timer로 추적하여 만료 시 Ready와 profile Person 표시를 즉시 해제.
- P1 resolved: expired Residence retry가 Passport document preview로 잘못 진입하던 adapter swap을 제거.
- P1 resolved: Account 생성은 EN/KO/JA live `ACC-CREATING` pending을 먼저 표시하며 same-frame duplicate submit을 idempotent하게 잠금. cancel storage clear 실패 시 Account return overlay는 유지.
- P1 resolved: Account private context가 reload에서 사라지거나 stored session에 extra field가 있으면 stale token/extra bytes를 canonical Account-only snapshot으로 교체하거나 삭제 후 readback한다.
- P1 resolved (static): Account processing에도 44px localized close/Escape가 남고, focus handoff는 modal unmount/inert cleanup 뒤 exact Save opener를 bounded retry한다. 실제 브라우저 focus assertion은 통합 lane pending이다.
- P1 contract limitation: canonical `BActionAxis.status`에는 `unsupported`가 없으므로 direct sheet에서 구분한 unsupported terminal은 session persistence 시 안전한 `unavailable`로 축약한다. 별도 enum이 추가되기 전 unsupported를 reload 후에도 보존한다고 주장하지 않는다.
- Open P0: 없음(정적/계약 범위).
- Open P1: 브라우저 runtime의 viewport·focus·scroll·visual 회귀 여부는 root 통합 lane 전까지 미확정.
