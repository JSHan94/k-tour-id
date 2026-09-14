# End-output coverage audit · 2026-09-09

범위: 최종 G01–G13, H01–H17, REQ-001–019 / FL-001–018. 최초 감사는 `DEPLOYMENT_SPEC.md` v3.1 기준이며 최종 배포는 v3.2다. 아래 최초 공백/후보1/후보2는 당시의 이력이며 최종 공유 URL 결과는 실행 현황과 마지막 절에서 구분한다. 실제 provider 연결은 이번 프런트 완료 조건이 아니지만, 사용자가 직접 누르는 성공·취소·실패·복구 샘플은 필요하다.

## 기준과 증거 수준

- 최초 감사 소스 기준: `bc8f0d0`, `.codex-worktrees/did-demo-20260908/k-tour-id-app`. 이후 후보의 수정·검증은 아래 실행 기록으로 구분한다.
- 최초 공개 프리뷰: <https://ondo-8a76epocn-jaewook-9643s-projects.vercel.app>. 이후 변경은 재배포 전까지 이 주소에서 통과했다고 기록하지 않는다.
- 2026-09-09 공개 브라우저 390×844: Guest skip → ID → K-Tour ID → Passport → consent → bundled OCR sample 진입 확인. 공개 outcome selector 없음. `/tmp/ondo-audit-passport-before.png`.
- 기존 `ondo-b-flow-coverage`의 `setQa`, profile milestone의 `profileActivityEvents` 등 숨은 객체/저장소 주입은 모델·방어 검증에 유용하지만 공개 샘플 완주 증거가 아니다.

## 새로 확인된 공백

| 우선 | 묶음 / 실제 진입 | 소스 근거 | 최초 판정 / 후속 |
|---|---|---|---|
| P1 | G05 · ID → K-Tour ID → 각 신원 경로 | `identity-b/ktour-id-setup-b.tsx` `advance()`는 `readQaRuntime`에서만 failure를 읽음. processing은 항상 holder delivery, `finishHolder()`는 success fixture만 생성 | 수동검토·문서/얼굴 실패·issuer/holder 실패가 공개 UI로 체험 불가. 전용 public simulation/recovery 구현 담당 배정 |
| P1 | G05 · expired/suspended/revoked 자격 → K-Tour ID | 동일 파일 `credential_ready`: status 문구와 Return뿐. renew/recovery journey 없음 | 기존 자격을 유지한 채 새 샘플 발급 여정 후 원자적 replacement 필요. 단순 retry로 검증됨 변경 금지 |
| P1 | G12 · My Korea → Labs → souvenir | `labs-entry.tsx` mint 조건 `stamps === 10`; `VisitStampReceiptB` 실제 공개 호출은 commerce receipt 한 곳. Table `recordActivityAxes([visit])`와 Local Signal은 stamp 불변 | 기존 9→10 QA는 숨은 stamp seed에 의존. 명시된 sample trip(9 unique visits) 및 별도 10번째 visit 행동, duplicate 방지 필요. 결제로 stamp 자동 증가 금지 |
| P1 | G12 · Labs wallet/bridge/badge | `runWalletConnection`, `submitBridge`, `settleBadge` failure는 `readQaScenario()`만; 실제 signer consent/epoch/prover/network/sponsor 분기 UI 없음 | 정상 bridge 가설 시뮬레이션은 존재. 실패·복구 샘플 selector와 signer lifecycle 보완 필요. 실제 bridge 지원을 만들어 주장하지 않음 |
| P1 | G08 · Tables → 참여/대화 | `tables-entry-b.tsx` availability/join failure 및 `sendMessage()` 실패는 `readQaRuntime` 전용 | 정상 로컬 plan→사진/메모→체크인→피드백/신고/차단/나가기 구현. full/organizer cancel/image send retry 공개 샘플은 공백 |
| P2 | G13 · Settings → Privacy & data | `settings-entry-b.tsx` language/appearance/preferences/privacy/delete만 있음 | 로컬 삭제 취소·확정은 존재. G13의 export/account-delete/session-revoke operation mock은 미노출; 이번 범위에서 명확한 sample operation으로 보완 필요 |

## 이미 배정된 별도 공백

- G10: authorization/capture, partial refund, order unknown. Commerce 담당 구현 중.
- G08: 식당 외부 예약은 로컬 meal plan과 별개. 예약 request/confirmation/rejection/cancel/status mock은 메인 담당 구현 중.
- 지도 시각 개선은 별도 담당. 샘플 시간대 온도를 실제 실시간 인기나 제주 공식 점수로 표시하지 않는다.

## 통과라고 말할 수 있는 범위와 남은 검사

현재 공유 URL에서 이전 DID/VP/결제·전액환불·정산의 계약/공개 E2E가 통과한 것은 핵심 경로 증거다. 이를 전체 REQ/FL 성공·실패·복구 완주로 확대하지 않는다. 새로운 `tests/e2e/ondo-end-output-coverage.spec.ts`는 실제 사용자 버튼만 이용하고, 공개 sample selector만 사용한다. 신규 구현 후 후보별 URL/명령/결과를 아래에 추가한다.

- 최초 감사 당시 신규 전체 공개 회귀는 실행 전이었다. 이후 확보한 candidate1/2 결과는 아래에 분리 기록했다.
- 실제 OpenDID/CX/eKYC/Chain/Sui 서명·거래 receipt는 여전히 백엔드 인계 항목이며 이번 sample PASS에 포함하지 않는다.

## 진행 업데이트

- G05: consent의 접힌 공개 샘플 selector에 16개 결과, manual review의 pending→조회→approved/declined/needs_info, NFC 미지원→문서 검토, 기존 패스를 유지하는 갱신/기기 복구 샘플을 구현했다. provider의 `completeIdentitySetup(method, { sampleRecovery: true })`는 holder 완료 시 같은 사용자의 proof revision만 교체하며 Person/Age/Payment 축을 자동 완료하지 않는다. 원래 method만 선택할 수 있고 기존 나이·체류기간·risk·사용액·혜택 사용 상태를 유지한다. `:age:`/`:recovery:` revision 이후에도 경제 이벤트의 logical issuance는 같다.
- 독립 검토에서 신규 예약의 결과 저장 실패가 `requesting/cancelling`을 영구 유지하는 P1을 찾았다. 동일 결과만 다시 저장하는 CTA를 추가해 재요청/중복 예약 없이 복구한다.
- 신규 계정 서비스의 화면 unmount 시 operation ID와 unknown 상태가 사라지는 P1을 찾았다. 별도 typed sample session journal을 추가했다. 진행 중 reload는 성공을 추측하지 않고 `unknown`으로 복원하며 같은 operation 조회만 허용한다. 결과 저장 실패도 같은 결과 재저장으로 복구한다. 전체 기기 데이터 삭제의 key 제거/rollback은 provider 담당자가 연결했다.
- `pnpm exec playwright test --config=playwright.contracts.config.ts tests/contracts/ondo-identity-journey-samples.spec.ts tests/contracts/ondo-account-services-sample.spec.ts tests/contracts/ondo-reservation-sample.spec.ts --reporter=line`: **21/21 PASS** (G05 8, 계정 저널 8, 예약 5). `pnpm typecheck`: **PASS**. 이는 소스 검증이며 아직 공개 프리뷰의 신규 UI PASS가 아니다.
- 공개 회귀에 추가한 저장소 fault injection은 쓰기를 거절하는 반례 검사다. 성공 응답이나 계정/자격/결제 상태를 주입하지 않으며 정상 플로우 완료 증거와 구분한다.
- 메인 예약·Table 공개 실패분기·G13 account operation 및 지도 담당 G12 구현이 후보로 준비됐다. 담당자의 실제 브라우저 검수 결과로 최초 공백 판정을 갱신한다.

## Candidate 1 운영 빌드 검증

- 대상: `http://localhost:3019`, 2026-09-09 새 standalone production 후보. 앞서 공유한 Vercel 프리뷰와는 별도다.
- `PLAYWRIGHT_BASE_URL=http://localhost:3019 pnpm exec playwright test --config=playwright.config.ts --project=mobile-chromium --workers=1 --reporter=line --output=artifacts/qa/end-output-coverage-candidate1-20260909 tests/e2e/ondo-end-output-coverage.spec.ts` → **22 PASS / 3 FAIL**. 로그: `artifacts/qa/end-output-coverage-candidate1-20260909.log`.
- G05 실패·취소·안전 복구 15개, manual decline/needs_info, revoked의 취소/holder 실패/재발급, 닫기 후 늦은 callback 및 provider opt-out, 경제 자격 5종 보존 반복은 모두 통과했다. 320px manual 추가정보, 390px revoked 보관 실패 스크린샷을 직접 검토했고 clipping/버튼 중첩은 없었다.
- G08 Table 완주는 테스트가 Account 다음 별도 19+ 동의를 생략했다. snapshot은 정상 `Confirm 19+ and continue` 대기 상태다. 해당 동의를 추가했으며 다음 후보에서 완주 재검사한다.
- G04는 첫 guest-skip 클릭 26.7초로 전체 30초 deadline이 list 클릭 중 만료됐다. trace의 최종 `session closed`/빈 venue ID는 teardown 이후 assert라 실제 복귀 실패로 단정하지 않는다. 복합 지도 경로에 60초 budget으로 단독 재확인이 필요하다.
- G13 unknown 재진입은 결과 버튼이 제거된 뒤 focus가 body로 빠져 Escape를 처리하지 못하는 문제를 재현했다. 메인이 예약/계정의 결과 heading focus와 공유 SheetB의 중첩 Escape owner guard를 후보2에 수정한다. 저장 실패 후 동일 결과 재저장(계정 및 예약 확정/취소)은 후보1에서 모두 통과했다.
- 기존 identity source contracts의 exact string/count 7건은 회복 분기로 인한 drift였다. 포커스/assurance/원자적 exit/각 async owner guard의 의미를 유지하도록 갱신한 4개 파일 전체 **38/38 PASS**. 결과를 줄여 통과시킨 것이 아니며 공개 포커스 회귀와 함께 검증한다.

## Candidate 2 재검증 — 25개 고유 경로 PASS

- 대상: 같은 `http://localhost:3019`의 **candidate2** production artifact. 제품 소스 변경 없이 아래 두 번의 실행을 합쳐 **25개 고유 경로 전부 PASS**를 확보했다. 아직 Vercel 재배포 검증은 아니다.
- 본 실행: 위와 같은 명령에서 output/log만 `end-output-coverage-candidate2-20260909`로 분리 → **23 PASS / 2 FAIL**. 모든 실행에 uncaught `pageerror` 검사를 추가했다.
- 남은 G08 실패는 19+ 버튼의 실제 public testid가 `after19-start`인데 account의 `action-gate-confirm`을 재사용한 테스트 선택자 오류였다. G13은 첫 Escape가 정상으로 닫힌 뒤 포커스 복귀 전에 두 번째 Escape를 전송한 테스트 타이밍이었다. 공개 opener의 `toBeFocused()`를 기다려 부모 닫기/제거를 검사하도록 바꿨다. 임의 sleep이나 숨은 상태 주입은 추가하지 않았다.
- `PLAYWRIGHT_BASE_URL=http://localhost:3019 pnpm exec playwright test --config=playwright.config.ts --project=mobile-chromium --workers=1 --reporter=line --grep 'G08 public Table completes|G13 account query survives' --output=artifacts/qa/end-output-coverage-candidate2-targeted-20260909 tests/e2e/ondo-end-output-coverage.spec.ts` → **2/2 PASS (19.1초)**.
- G08 실제 Account → 별도 19+ 동의 → join 확인 → 사진/메모 전송 → 체크인/완료 → 피드백 → 신고 → 차단/해제 → 나가기 완주. G13은 inner sheet → parent sheet 이탈 → 동일 unknown operation 재진입 → reload → 같은 ID 조회 → 완료를 확인했다. 재발급의 경제/나이/체류 보존, G04 exact 장소 복귀 및 두 저장소 failure 회귀도 통과했다. uncaught pageerror **0**.
- 캡처 직접 검토: `end-output-coverage-candidate2-20260909`의 `manual-needs-info-320.png`, `old-revoked-pass-during-recovery.png`, `settings-dark-ko-320.png`; targeted output의 `table-photo-feedback-safety-390.png`. 320/390에서 버튼 중첩·가로 잘림 없음. 이는 해당 캡처의 시각 검토이지 앱 전체의 미감이 완벽하다는 판정은 아니다.
- 다른 담당자가 실행한 G10/G11/G12/지도 공개 회귀와 최종 공유 프리뷰 재검증은 메인 실행 상태 문서를 따른다. 이 문서의 직접 실행 결과와 혼합하지 않는다. 실제 backend/provider 구현은 여전히 별도 handoff다.

## Candidate 2 기존 DID 회귀 — 30/30 PASS

- 직접 실행 대상: `http://localhost:3019` **candidate2** production artifact. `mobile-390`(390×844), `small-320`(320×740), `desktop`(1280×900), 각 10개씩 **30/30 PASS (2.0분)**. 이 검사는 한 번의 전체 실행에서 모두 통과했다.
- 명령: `PLAYWRIGHT_BASE_URL=http://localhost:3019 pnpm exec playwright test --config=playwright.did-demo.config.ts --workers=1 --reporter=line --output=artifacts/qa/did-candidate2-20260909`.
- 로그: `k-tour-id-app/artifacts/qa/did-candidate2-20260909.log`. 대상 파일은 `ondo-did-demo-journeys.spec.ts`, `ondo-kpass-age-recovery.spec.ts`, `ondo-kpass-service-journeys.spec.ts`다.
- 확인 범위: QA query 없는 공유 샘플 발급, provider opt-out의 권한 분리, missing/negative age와 expired stay/revoked 구분, 명시된 동의 후 age 보완, Person/Payment 축 불변, 실제 Table의 거절·동일 경로 복귀·명시적 참여, 체류 만료 시 혜택 거절과 checkout 보존, 충전/Payment KYC로 소진된 결제 한도를 우회할 수 없음.
- 신규 end-output **25개 고유 PASS(본 실행 23 + 선택자·포커스 대기 수정 후 단독 2)**와 기존 DID **30/30 단일 실행 PASS**는 서로 다른 검사 묶음이다. 숨은 QA 상태를 넣어 성공 경로를 대신하지 않았다.
- 최종 preview 배포본은 별도 검증해야 한다. 위 결과는 아직 그 새 공개 URL의 통과를 의미하지 않는다.

## 최종 공개 배포본 모바일 DID 검증

- 2026-09-09, 소스 `6fb5b96`의 [최종 공개 preview](https://ondo-126u0k6jr-jaewook-9643s-projects.vercel.app)에서 `PLAYWRIGHT_BASE_URL=https://ondo-126u0k6jr-jaewook-9643s-projects.vercel.app pnpm exec playwright test --config=playwright.did-demo.config.ts --project=mobile-390 --workers=1 --reporter=line --output=artifacts/qa/did-final-preview-20260909`를 직접 실행해 **10/10 PASS (48.4초)**를 확인했다. 로그: `k-tour-id-app/artifacts/qa/did-final-preview-20260909.log`. 공유 샘플 발급·provider opt-out·연령/체류/폐기 분기·동의 후 age 보완·Table 복귀/참여·혜택 거절·결제 한도 우회 방지를 공개 UI로 재검증했으며 제품 소스 수정은 없었다. 전체 30개를 이 URL에서 실행한 결과로 확대하지 않는다.

## 산업별 확장 범위

`DEPLOYMENT_SPEC.md` §1.1 표는 “교통·배달·쇼핑 Super App, 옛 독립 route”를 현재 지도·장소·Tables·My Korea·ID/Wallet 맥락에 통합하고, 해당 산업을 향후 adapter 확장 예시로 명시한다. 현재 v3에서 독립 교통/배달/쇼핑 앱 복원은 승인 범위가 아니다. PDF의 산업 노드는 backend adapter/정책 소비 예시로 보존하되, “모든 mock”의 완료 범위와 이 제외 기준을 최종 handoff에 함께 명시해야 한다.
