# 최신 배포 · 전체 여정 최종 검수 — 2026-09-11

## 배포 기준

- [최신 공개 프리뷰](https://ondo-1909uxusq-jaewook-9643s-projects.vercel.app)
- Vercel deployment: `dpl_7nv7QZNJU5bNGKrePEi94TyK3s5q`, target `preview`, 상태 **Ready**.
- 배포 source `52f376e`; 앱 runtime 변경 기준도 `52f376e`. 테스트·검수 문서는 후속 커밋이다.
- 전체 여정 기준선: [직전 프리뷰](https://ondo-f79cplfqu-jaewook-9643s-projects.vercel.app), source `564823e` / runtime `770d6b1`, deployment `dpl_9omVMcfYcQj9iieCcyeJNFxL96Zb`.
- 기준선 대비 앱 차이는 **CSS 5개 파일**뿐이다: Local Signal 색상, 음식 placeholder 레이아웃, 장소 meta 색상, 지도 안내 위치/저작권 색상, timeline 간격. 기능 상태·권한·금전 로직은 바꾸지 않았다. 전체 174개는 기준선에서 검수하고, 최종판은 수정 영향 27개를 별도 확인했다. 174개 전부를 최종 URL에서 다시 실행했다고 주장하지 않는다.
- 중간 배포 `abd0f83` / `dpl_3jCeS81cxVShWhzWpJfoC67PcqX9`의19개 검사는 [59572 프리뷰](https://ondo-59572e8rr-jaewook-9643s-projects.vercel.app)에서 수행한 별도 기록이다.
- 다음 후보 `f8960b4` / [51y7 프리뷰](https://ondo-51y7h1q7l-jaewook-9643s-projects.vercel.app)의27개 기능 검사는 통과했지만, 교차 시각 검수에서 placeholder의 외부 폭 회귀를 발견했다. 그 후보를 최종 시각 완료로 판정하지 않았으며 최신 `52f376e`에서 폭 제약과 형제 요소 간격까지 보강했다.
- 비로그인 `/` HTTP **200**, `data-hydrated=true`, 페이지 제목 확인.
- production alias는 변경하지 않았다. 실제 provider 연결·credential 발급·자금 이동도 하지 않았다.
- 증거 경로는 모두 `k-tour-id-app/artifacts/qa/` 기준. 최종 배포 로그: `final-journey-deploy-release.log`, 상태: `final-journey-deployment-release.txt`. 기준선·중간 배포의 로그/검사도 별도로 보존한다.

## 검수 방식과 현재 상태

**이번 목업 배포·정의된 전체 여정 검수를 완료했다. 기준선 174개와 최종판 수정 영향 27개 모두 PASS 증거를 확보했다.** 최종판은 최초 26/27 통과 후 부산 1개를 동일 assertion·늘어난 전체 실행 시간 제한으로 재검증했다. 첫 실행 전체 통과로 표기하지 않는다. 지도·음식 54장과 장소·기여 10장도 직접 시각 검수했으며, 이 한정된 검수 집합에 남은 확정적 UI 결함은 발견하지 못했다. 모든 실제 기기나 외부 SDK 조합의 인증은 아니다.

세 명이 기능군을 나누고 실제 브라우저는 최대 두 그룹, 그룹당 worker 1개로 실행했다. 자동 retry는 0이며 최초 실패의 trace/runtime/screenshot을 보존했다. 구형 독립 route와 현재 공개 `/` 여정을 섞지 않았다.

| 범위 | 이번 검수 항목 | 상태 |
|---|---|---|
| G01 | 전국→3도시, 검색/빈 결과/목록, 타일 지연·실패 복구, 2.5D·시간대 열 표현 | PASS · 최종 영향 검사 포함 |
| G02 | 첫 진입·언어/여행 취향·건너뛰기/재편집·도시 진입·화면 회전 | PASS |
| G03 | 조사 장소24개 중 새6개, 음식 예시/상세/길찾기/동일 장소 복귀, 방문 전 정보, 로컬 기여·사진 preview·저장/중복/복구 | PASS · 최종 기여 대비·음식 영향 검사 포함 |
| G04 | EN/KO/JA 계정 gate 취소/완료/저장·재진입·My Korea | PASS |
| G05 | 3신원 경로, 문서/얼굴/외부 앱·수동검토·추가정보, issuer/holder, 갱신·복구·8개 자격 | PASS · identity 묶음 |
| G06 | partner 등록/기기·QR·VP 최소 동의, audience/nonce/replay/status 거절 | PASS · identity 묶음 |
| G07 | Age 없음/미달/만료·별도 보충 확인, After 19와 theme/서비스 권한 분리 | PASS · 최종 appearance 검사 포함 |
| G08 | 식사 계획·참여/사진 대화·도착·피드백·신고/차단/나가기 | PASS · social/settings 묶음 |
| G08-R | 3도시 매장 예약·만석/실패·unknown 재진입/취소·같은 operation 조회 | PASS · commerce + 저장 고장 주입 |
| G09 | 은행·카드·Apple Pay 지원/승인/거절·KYC·견적·잔액 | PASS · commerce 묶음 |
| G09-S | USDC/USDT signer 동의/거절/timeout, source/destination/credit 분리·재진입 | PASS · commerce 묶음 |
| G10 | 혜택·동의·별도 Payment gate, 승인/매입·unknown 조회·부분/전액환불 | PASS · commerce 묶음 |
| G11 | 업무6종 event·재시도, 정산·문의 불변 이력/새 동의·요약 export | PASS · commerce 묶음 |
| G12 | Labs 별도 opt-in/signer, 고유 방문9→10, badge 중복 방지·실패/복구·read-only bridge | PASS · commerce 묶음 |
| G13 | theme/언어, 개인정보 reset, 별도 sample export/logout/delete·실패/unknown 복구 | PASS |

### 증거 분류

- **공개 샘플 여정:** 방문자가 실제 보이는 버튼과 sample 선택기로 진행한다. 샘플 신원 선택은 실제 DID 발급 증거가 아니다.
- **초기 기기 설정 fixture:** locale/theme/onboarding 저장값 설정은 준비 조건으로 표시한다. 서비스 승인 결과를 주입한 것으로 세지 않는다.
- **고장 주입:** storage quota/session 오류, 타일 차단·지연은 명시적 부정 테스트다. 일반 정상 상태의 동작과 구분한다.
- **Runtime:** 앱 pageerror/console/HTTP/CSP 오류는 실패시킨다. 외부 지도·자산·Vercel preview toolbar는 정해진 분류에 따라 별도 보존한다. CSP를 느슨하게 하거나 모든 console 오류를 무시하지 않는다.
- **모바일:** Chromium viewport/touch emulation과 실제 브라우저 DOM·스크린샷 검수다. 실제 iPhone Safari/Android 기기 완료와 동의어가 아니다.

## 결과

고유 174개 = identity 52 + commerce 50 + social/settings 추가 8 + discovery/settings 64. 재실행과 기존 릴리스 PASS를 이 수에 중복 합산하지 않는다.

| 실행 / 로그 | 결과 | 해석 |
|---|---|---|
| 전체 계약 `final-journey-contracts.log` / `final-journey-contracts-final.log` | 최초799/799 → 보강 후800/800 PASS | 모델/문서/소스 계약. 브라우저 수에 더하지 않음 |
| `final-journey-typecheck.log` | PASS | 테스트 보강 후 TypeScript 검사 |
| 공개 HTTP `final-journey-public-routes.json` | 10/10 PASS | root/review0/장소 API200, redirect, 잘못된 장소·legacy route404 |
| Identity `final-journey-identity-20260911.log` | 최초49/52 PASS | 로딩/화면 안정화 시간 초과3건 보존 |
| `final-journey-identity-rerun-20260911.log` | 동일 테스트3/3 PASS | URL·assertion·시간 제한 변경 없음. 고유52개에 PASS 증거 확보; 자동 retry0 |
| Commerce `final-journey-commerce-main.log` | 최초36/39 PASS | obsolete preview selector2, KO320 초기 지연1 보존 |
| `final-journey-commerce-reservation.log` | 8/8 PASS | 3도시 예약·unknown·취소, Labs source-confirmed 재진입 포함 |
| `final-journey-commerce-integration-funding.log` | 10/10 PASS | funding7 재검증 + integration3 |
| `final-journey-commerce-isolated.log` | 2/2 PASS | KO320 동일 시간 제한 그대로 재검증 + Labs screenshot 재확인. commerce 고유50개 PASS |
| `final-journey-social-settings-coverage-20260911.log` | 5/5 PASS | G08 대화/도착/피드백/안전, G13 계정·저장 고장 복구 |
| `final-journey-social-settings-services-20260911.log` | 3/3 PASS | 계정 작업과 좁고 낮은 화면의 footer 접근 |
| `final-journey-discovery.log` | 최초41/64 PASS | 최초23건은 아래 원인별로 분리해 보존 |
| `final-journey-my-korea-rerun-20260911.log` / `final-journey-my-korea-footer-rerun-20260911.log` | 3/4 → 나머지1/1 PASS | hydration 대기·현재 modal footer 범위·공개 sample selector로 이동 |
| `final-journey-onboarding-lens-rerun-20260911.log` | 2/2 PASS | 정상 타일 준비 상태의 실제 lens 접근성·focus 검증 |
| `final-journey-local-signal-rerun.log` / `final-journey-local-signal-r2.log` | 0/2 → 2/2 PASS | 사진 오류의 실제 복구 버튼, 유효 Person proof 재사용·새 draft 바인딩 |
| `final-journey-temperature-food-rerun-20260911.log` | 17/17 PASS | timeline8 + traveler8 + appearance1. 테스트 초기화 오류 수정 후 모든 runtime guard 유지 |
| `final-journey-local-signal-contrast-before.log` | 의도한 회귀 재현1/1 FAIL | 기준선의 실제 어두운 글자 결함. 앱 수정 전 1.86:1 대비를 검출 |
| `final-journey-local-signal-final.log` | 중간 abd0f83 URL 2/2 PASS | draft·저장 성공·중복 결과의 색상 대비, 파일 복구/저장/재진입·고장 원복 |
| `final-journey-temperature-food-final-20260911.log` | 중간 abd0f83 URL 17/17 PASS | timeline8·traveler8·appearance1, 자동 retry0 |
| `final-journey-public-routes-final.json` | 중간 abd0f83 URL 10/10 PASS | 동일 HTTP 경계·CSP·redirect 확인 |
| `final-journey-food-visual-before.log` / `final-journey-timeline-focus-before.log` / `final-journey-map-visual-before.log` | 수정 전2+1+1 FAIL 재현 | placeholder overflow, peek3:1 대비, focus/tick −9px 겹침, off-notice 화면 밖 위치를 새 assertion으로 검출 |
| `final-journey-public-routes-release.json` | 중간 f8960b4 URL 10/10 PASS | root/review0/장소 API, legacy 경계·redirect·CSP 유지 |
| `final-journey-map-food-release.log` / `final-journey-place-release.log` | 중간 f8960b4 URL 17+10 PASS | 기능·추가 측정 검사 통과. 이후 시각 검수의 외부 폭 회귀는 별도 미해결로 분류 |
| `food-placeholder-css-preflight-f8960b4.log` | 진단4/4 PASS, 배포 PASS 아님 | 기존 overflow를 먼저 확인하고 제안 CSS만 브라우저에 주입해320/390 light/dark 검증. tile138.656px→배정된90/118.3125px, 옆 본문 간격12/16px |
| `final-journey-contracts-52f376e.log` | 최신판800/800 PASS | 최신 배포 source와 개발자 문서 동기화 계약 포함 |
| `final-journey-contracts-handoff-final.log` | 인계 확정 후800/800 PASS | 여정·개발자 정본의 완료 상태 반영 후 전체 계약 재확인 |
| `final-journey-typecheck-52f376e.log` | 최신판 PASS | 현재 소스·테스트 TypeScript 검사 |
| `final-journey-public-routes-52f376e.json` | 최신 URL10/10 PASS | 공개 진입·장소 API·redirect·legacy404·기존 CSP 확인 |
| `final-journey-place-52f376e.log` | 최신 URL10/10 PASS | 로컬 기여2·방문 전 정보8, 저장/중복/복구·다크 대비·카드 레이아웃 |
| `final-journey-map-food-52f376e.log` | 최신 URL 최초16/17 PASS | 지도·음식·appearance 검사. 부산 왕복 1개는 전체30초 제한 및 trace ZIP 오류로 실패 |
| `final-journey-map-food-52f376e-busan-rerun.log` | 동일 URL1/1 PASS · 17.7초 | 같은 source/assertion, CLI 전체 제한만60초, 자동 retry0. 고유17개에 PASS 증거 확보 |

Identity55회 실행의 runtime product 오류0/application asset 실패0, 외부 지도66·정확히 분류된 Vercel toolbar124개 항목은 별도 보존했다. Commerce59회 실행도 product0/asset0이며 외부 지도79·toolbar126개를 보존했다. 재실행 횟수를 고유 테스트 수에 더하지 않는다. 실제 SDK/암호학적 proof/자금 receipt의 검증 횟수가 아니다.

`abd0f83`의19개 중 custom-context 테스트는 여러 page를 사용하므로 runtime 기록은 총23개다. product/application asset 오류0이며 외부 지도와 정확히 분류된 toolbar 차단은 `final-journey-runtime-final.json`에 합산·보존했다. 수정 후 다크 저장 완료 스크린샷도 직접 확인했다. 이후 교차 검수의 음식 placeholder/peek 결함과 아래 실기기·실연동 제한은 기능 통과와 별도로 취급한다.

최종 `52f376e`의 27개와 부산 1회 재실행에서는 page별 runtime 기록 **46개**를 확보했다. product 오류 **0**(앱 자산 HTTP 실패 포함), 분류된 외부 자산 오류0, 외부 지도89·preview toolbar84·navigation abort0이다. 중복된 attachment 사본은 제외했으며 `final-journey-runtime-52f376e.json`에 파일별 목록과 그룹별 합계를 보존했다. 외부 지도/toolbar 항목을 제품 오류로 오인하지 않지만 숨기지도 않는다.

### 최초 실패의 원인과 실제 수정

1. **실제 앱 결함 — Local Signal 다크 대비.** 저장 완료의 장소명/비공개 안내, draft의 privacy 표시와 placeholder, 중복 아이콘·닫기 선택이 고정된 라이트 색상을 사용했다. scoped CSS 6개 선언을 기존 app appearance token으로 연결했다. `abd0f83`에서 배포했고 draft/unique/duplicate의 `color-contrast` 검사를 추가했다. 상태 전이·권한·저장·전역 theme CSS는 변경하지 않았다.
2. **초기 화면 안정화와 낡은 locator.** My Korea는 hydration 이전 keyboard 조작, 삭제 버튼은 body가 아닌 Sheet footer, funding preview는 교체된 page-level surface가 원인이었다. 현재 보이는 public UI를 사용하도록 테스트를 고쳤고 금액·권한·rollback·중복 방지 assertion을 제거하지 않았다. identity3건과 commerce 초기 진입1건은 시간 제한을 늘리지 않은 재실행에서 통과했다.
3. **온보딩 준비 조건.** lens 검사가 모든 타일을 차단한 상태에서 준비 전 의도적으로 inert인 버튼을 조작했다. 두 정상 lens 케이스만 실제 basemap ready를 기다린다. 타일 실패/지연 반례는 별도4개에서 계속 검증한다.
4. **테스트의 opaque document storage 접근.** timeline/traveler의 context init script가 앱 navigation 이전 `about:blank`에서 storage에 접근했다. trace의 오류 시각721733.073은 첫 goto721738.739보다 앞선다. 테스트 seed를 정확한 앱 origin에서만 실행하도록 수정했다. 오류 무시/catch를 추가하지 않았고 앱 origin의 storage 오류는 그대로 실패한다. 초기16건과 정상 재실행21개 page runtime을 모두 보존한다.
5. **새 G03 검사의 경로 가정.** 잘못된 사진을 선택하면 보이는 “다른 사진 선택”으로 복구해야 하며 숨겨진 Remove를 누르지 않는다. 두 번째 기여에서는 아직 유효한 Person proof가 새 draft의 gate를 충족하므로 동의 창 재등장을 요구하지 않는다. 이후 중복 판정·기존 timestamp 불변·원 장소·새로고침 후 기록을 계속 검사한다.
6. **교차 시각 검수의 실제 앱 결함5건.** 음식 placeholder의 긴 제목/Category guide 겹침과 아이콘 잘림은 두 행의 normal-flow 배치로 수정했다. 다크 peek의 mobile span 고정색(3:1)과 장소 eyebrow는 theme token으로 연결했다. compact After19 off/expiry 안내가 좁은 chip을 기준으로 화면 왼쪽 밖에 놓이는 위치를 보정하고, 저작권 summary도 theme ink를 쓰게 했다. timeline의 음수 tick 간격을 바꿔 keyboard outline과 숫자가 겹치지 않게 했다. 요소별 bounds/쌍별 간격, 실제 outline 폭, 텍스트 axe 대비, 반투명 copyright 배경의 밝고 어두운 바탕 대비를 추가 검사한다. 그림·문구를 감추거나 focus ring을 제거해서 통과시키지 않았다.
7. **수정 과정의 폭 회귀도 추적.** category tile의 최소 높이가 기존 aspect-ratio를 통해 최소 폭으로 전달되어 옆 장소명을 덮었다. 최초 내부 geometry만으로는 잡지 못했으므로 figure 폭/최소폭/aspect를 부모 열에 묶고, 카드 자체의 그리드 경계와 옆 본문 간격 assertion을 추가했다. 진단 주입 결과를 공개판 PASS로 세지 않았으며 새 배포의 실제 CSS로 390-light/320-dark × sample/review=0 네 화면과 DOM 검사를 통과했다.
8. **최종 부산 검사 시간 초과와 증거 수집 오류.** 첫 실행에서 기울기 전환·도시 화면 캡처 후 전국 복귀 화면까지 도달했으나 전체30초 제한에 걸렸고 trace ZIP 작성도 실패했다. 따라서 최초 원인을 앱/네트워크/teardown 중 하나로 단정할 수 없다. 해당 실행의 screenshot/runtime/error-context를 보존했고, 같은 테스트를 전체60초 제한에서 재실행해17.7초에 통과했다. 재실행 trace 무결성도 확인했다. 이는 30초 내 항상 완료된다는 성능 보장이나 원래 실패 기록 삭제가 아니다.

### 시각·기기 검수 범위

- EN/KO/JA, light/dark/After 19의 선택 조합. 폰 너비320/390/430, 보조360, 태블릿768, 데스크톱1280/1440, 낮은320×460·가로844×390 등. 모든 언어×기기×상태의 완전한 직교 조합은 아니다.
- 모바일 상단 navigation44px/search52px·입력16px·총104px, 옵션 복귀, 목록의 한 scroll owner·맨 아래 장소/지도 버튼, visit facts 카드 경계·아이콘, 중앙 stepper, 결제/예약 footer의 화면 내 접근을 DOM과 스크린샷으로 확인했다.
- 최종판의 지도·음식 예정 캡처54장과 장소·기여10장을 전부 검토했다. 부산 최초 실패 진단 이미지와 동일 케이스 재실행 이미지도 별도 확인했다. 수정된 음식 카드의 내부 내용뿐 아니라 옆 장소명과의 간격, After 19 안내의 화면 경계, 다크 meta/저작권/기여 문구, 시간축 keyboard focus 간격이 유지된다.
- `prefers-reduced-motion`에서는 자동 재생하지 않고 수동 시간 선택을 유지한다. sample 시간/음식 category illustration/비공개 방문 기록을 실제 realtime·실매장 사진·공개 게시로 혼동시키지 않는다.
- **실제 iPhone Safari/Android는 미검증.** 이 환경의 WebKit 실행은 OS/엔진 오류로 종료했고 Safari 원격 자동화도 활성화되어 있지 않다. 브라우저 보안 설정을 바꾸지 않았다. 운영 출시 전 실제 기기 provider handoff와 SDK별 capability 검수가 별도로 필요하다.

## 재현 방법

각 로그와 동일 이름의 디렉터리에 trace/runtime/screenshot이 있다. `final-journey-discovery`만 최초64개의 묶음이며, 실패 원인별 재실행은 위 표의 별도 이름을 따른다. 생성 증거는 로컬 `artifacts/qa`에 보존하며 공개 웹앱 정적 파일에 포함하지 않는다.

```bash
cd k-tour-id-app
PLAYWRIGHT_BASE_URL=https://ondo-1909uxusq-jaewook-9643s-projects.vercel.app pnpm exec playwright test \
  tests/e2e/ondo-temperature-appearance.spec.ts tests/e2e/ondo-temperature-timeline.spec.ts \
  tests/e2e/ondo-traveler-food-pulse.spec.ts tests/e2e/ondo-local-signal-public-completion.spec.ts \
  tests/e2e/ondo-previsit-polish.spec.ts --project=mobile-chromium --workers=1 --retries=0 --timeout=60000 --trace=on
pnpm typecheck
pnpm test:contracts
```

동일한 기능군을 재검수할 때는 DEPLOYMENT_SPEC Appendix A의 현행 `/` suite를 선택한다. 오래된 route 검사를 포함하는 전체 E2E 디렉터리를 무차별 실행한 결과와 혼합하지 않는다.

## 개발자 인계

[개발자 시작 문서](./DEVELOPER_START_HERE.md) → [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md) / [BE 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md) / [해커톤 기술 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md).

실제 CX/OpenDID/OmniOne Chain/Sui SDK·API·키·정책 연결은 개발자 범위다. 미연결 자체를 목업 결함으로 세지 않으며 샘플 성공을 실제 연동 성공으로 표기하지 않는다.
