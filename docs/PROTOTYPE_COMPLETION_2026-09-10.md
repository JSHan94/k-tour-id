# ONDO 목업 완결·모바일 마감 릴리스

상태: **이번 목업 구현·모바일 마감·인계 문서 정합성 확인·프리뷰 배포 완료. 최종 공개 주소의 선택된 24개 브라우저 검사 PASS. 실제 provider 연결 및 실기기 검수는 별도 미완료.**

## 확인할 곳과 소스

- [현재 프리뷰](https://ondo-3n9pfey06-jaewook-9643s-projects.vercel.app) — 비로그인 HTTP 200·앱 hydration 확인. 기존 production 도메인은 변경하지 않았다.
- 배포 source: `3dc392b` (기능 구현 `5233816` + 일본어 Passport/face 제목 줄바꿈 CSS 한 줄). 배포 뒤의 QA/문서 변경은 앱 배포 소스와 구분한다.
- Vercel: `dpl_G3xVXrLsq4YXDPmNtESzBucfTp6n`, target `preview`, **Ready**, 2026-09-10 18:57 KST.
- 최종 로컬 standalone build ID: `PvnFC1EkV3XVH_FTrS4R-`. Vercel 원격 빌드 ID와 같다고 주장하지 않는다.
- 작업본: `.codex-worktrees/did-demo-20260908/k-tour-id-app`, branch `implementation/did-demo-20260908`. 루트의 오래된 앱과 사용자 dev server는 변경하지 않았다.
- 샘플 정책 버전 `ondo-kpass-demo.v1`, funding operation version `1`. 실제 provider·asset·VC schema/version은 ADR에서 별도 확정한다.
- 중간 source `5233816`의 `ondo-ewvrra210-…` 프리뷰와 이전 `a45400f` 프리뷰는 역사적 후보다. 아래 공개 검수는 위 **3dc392b URL**에만 귀속한다.

## 산출물과 경계

- 모바일 웹앱: 기존 지도 진입·얕은 2.5D·동적 샘플 온도·After 19/테마 독립성을 유지한다. 이번 변경은 Travel Pass 정보 계층, 음식 예시 이미지, 신원/결제/파트너 체험, 다크 모드 대비를 마감한다.
- 기능별 목업: 실제 외부 앱에서 일어날 권한 확인과 돌아오기까지 사용자 조작으로 이어진다. 성공·거절·시간 초과·취소·재시도를 구분한다.
- 인계: [정본 스펙](./DEPLOYMENT_SPEC.md), [기술별 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md), [실제 개발 체크리스트](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)를 동일 릴리스와 연결한다.

모든 새 외부 결과는 **데모**다. 실제 신분증, 카메라, NFC, 얼굴 촬영, 로그인, wallet 연결, VP, 예약, 결제, chain transaction은 실행하지 않는다. 실제 모드의 미연결 상태를 샘플 성공으로 대체하지 않는다. 실제 연동에는 백엔드뿐 아니라 선택한 provider SDK, 브라우저/기기 capability, handoff/callback adapter의 프런트 작업도 남아 있다.

## 이번에 채운 연결

| 영역 | 공개 사용자 경로 | 새 상태 / 검증 경계 |
|---|---|---|
| Mobile ID·Residence | ID · Wallet → K-Tour ID → 방법 → 동의 → 외부 앱 체험 → 돌아오기 → holder 보관 | 명시 승인·거절·취소·45초 timeout·동일 맥락 재시도. 승인 후 돌아오기와 보관 확인은 별개 |
| Passport | 방법 → 동의 → 샘플 카메라 권한 → 문서 촬영/다시 촬영 → NFC → 얼굴 확인 → holder | 실제 카메라·파일 업로드 없이 명시적인 준비된 문서/생체 체험. 문서 단계만으로 발급 성공 금지 |
| Wallet | 충전 → USDC/USDT → signer → 샘플 연결 권한 → 견적/전송 동의 → source/destination → credit | 연결은 전송 승인과 다름. source-only credit 금지. decline/timeout 뒤 잔액·신원·결제 자격 불변 |
| Partner | Demo → Partner tools → 샘플 작업 공간 → 기기 동의 → QR 또는 같은 기기 요청 → 최소 정보 동의 → 결과 | QR는 불투명한 샘플 요청 번호만 인코딩. 카메라 권한·VP 동의만으로 게스트 자격 생성 금지. 취소/expired/replay/wrong partner 결과 분리 |
| Travel Pass | 다음 할 일 → Wallet → 접힌 서비스/상태 상세 | 핵심 CTA를 첫 화면에 두고 5개 독립 자격 축은 필요할 때 펼친다 |
| 음식 | 도시 목록의 조사된 식음료 카드 → 장소 | 음식별 맞는 예시 이미지. 실제 매장 사진이 없는 항목은 정직한 범주 fallback. [이미지 출처·생성 프롬프트](./FOOD_ILLUSTRATION_ASSETS_2026-09-10.md) |
| 영수증 | 결제 결과 → 잔액/원 장소 → 부분·전액 환불 → 정산 | 라이트/다크 공통 의미 색상. 자동 axe 외 실제 계산 대비와 스크린샷 검수 |

## 검수 기록

로그 경로는 별도 표기가 없으면 `k-tour-id-app/artifacts/qa/` 기준이다. 모든 결과를 더해 전체 앱·모든 기기 조합의 전수 검수라고 표시하지 않는다. 테스트 환경 또는 오래된 선택자 때문에 실패한 실행도 삭제하지 않고 원인과 재실행을 구분한다.

### 최종 앱 source `3dc392b`

| 검사 | 결과와 증거 |
|---|---|
| 계약 테스트 | **785/785 PASS**. `prototype-completion-contracts-3dc392b.log` |
| 인계 QA 후속 | **790/790 PASS**. 위 785개 + 배포 툴바 오류 분류의 부정·증거 보존 계약 5개. `prototype-completion-contracts-handoff-final.log`. 앱 소스 변경 없이 QA만 추가했으며 785와 790을 합산하지 않음 |
| 타입 검사 | PASS. `completion-typecheck-3dc392b.log` |
| standalone production build + client artifact scan | PASS. `prototype-completion-build-3dc392b.log`. 배포는 동일 source에서 Vercel 원격 빌드 Ready |
| 배포 신원·비로그인 실행 | `prototype-completion-public-deployment.txt`, `completion-public-hydration.log`; Vercel placeholder가 아닌 실제 `ondo-b-root[data-hydrated=true]` 확인 |
| 공개 DID 10개 | **10/10 PASS**, 320/390/430px, KO/EN/JA, light/dark. 외부 앱 승인·거절·취소·timeout·late approval·holder·Passport permission/capture/NFC/face. `completion-identity-public.log` |
| 공개 결제 5개 + 음식 2개 | **7/7 PASS**. Wallet 연결→USDC/USDT funding→결제 자격→승인/매입→영수증→환불→정산, 연결 거절·timeout. Busan 음식 예시 두 theme. 영수증 계산 대비 4.5:1 이상 및 실제 일본어 다크 캡처 확인. `completion-commerce-food-public.log` |
| 공개 파트너 4개 + 제주 예약 1개 | **5/5 PASS**. 320/390/1440px QR·권한·동의·same-device·취소/expired 및 제주 예약 확인/명시 취소. `completion-core-public.log`의 해당 5건 |
| 공개 개인화 | **1/1 PASS**. 기존 상단 취향 아이콘 대신 모바일 Options→Discovery preferences의 실제 경로로 수정한 테스트. 선택 유지·206개 결과 보존·설정 편집. `completion-onboarding-public-r2.log` |
| 공개 언어 변경 | **1/1 PASS**. EN→JA→KO→EN→JA 동안 같은 dialog DOM 유지, reload 후 JA 보존. `completion-settings-public-evidence-final.log`; 대응 output의 `runtime.json`에는 product 오류 0, 차단된 Vercel toolbar 2회에 대한 원문 4건(console 2 + requestfailed 2)을 별도 보존. 앱 CSP를 완화하지 않음 |
| 공개 정적 asset | HTML에서 연결된 19/19 HTTP 200. `completion-identity-public-assets.log` |

### 동일 작업의 로컬 회귀 — 공개 결과와 별도

`5233816` 로컬 production 후보에서는 identity/wrong-network **11/11** (`completion-identity-final.log`), Travel Pass·음식·결제 **12/12** (`completion-ui-commerce-final.log`)를 통과했다. 이후 앱 변경은 일본어 Passport/face 제목의 `text-wrap: balance` 한 줄뿐이며 해당 화면은 최종 공개 DID 검사로 다시 확인했다.

그 전 단계의 회귀는 DID/연령/서비스 정책, stablecoin 10개, 결제 업무·환불·문의, 3도시 예약/계정 작업, 설정/프로필, Before you go의 320–1440px·3언어·두 theme, Labs/고유 방문/민팅을 각각 검사했다. 관련 원본 `completion-did-regression-prod*`, `completion-broader-gates-prod-r2.log`, `completion-food-isolated-prod-r2.log`, `completion-reservation-account-prod.log`, `completion-settings-*`, `completion-stablecoin-*`를 보존한다. 일부는 최종 CSS 수정 이전 증거이므로 최신 공개 PASS 수에 더하지 않는다.

### 실패를 재분류/수정한 근거

- 실제 다크 UI 결함: Passport 상단 자주색 설명, Wallet 빈 내역·영수증의 어두운 글씨를 theme token으로 수정. axe 결과만 믿지 않고 계산 대비·스크린샷을 추가했다.
- 일본어 face 제목 마지막 한 글자가 고립됨: balanced wrapping을 적용하고 최종 공개 화면 확인.
- 개인화 테스트는 200개만 기대하고 제거된 모바일 floating control을 찾던 과거 경로였다. 현재는 directory 200 + 조사 장소 6을 각각 확인하고 공개 Options 경로를 누른다. 선호 데이터가 삭제되거나 필터링된 것이 아니다.
- 공개 언어 변경의 최초 실패는 Vercel이 webpack 응답에 주입한 toolbar가 앱 CSP에 차단된 기록이었다. 원 로그 `completion-core-public.log`, 헤더 진단 `completion-preview-toolbar-trace-headers.log`, `completion-preview-toolbar-injection-diagnosis.log`를 보존했다. 요청별 toolbar 제외 헤더도 이미 삽입된 응답에는 효과가 없어 그 임시 설정은 제거했다. 정확한 HTTPS URL·GET/script·`csp` 실패와 일치하는 콘솔 문구만 별도 `externalPreview`로 분류한다. 앱 예외·다른 CSP·변조 URL/상태는 여전히 실패하며 새 계약 5개로 검증했다. **모든 콘솔 경고가 사라졌다는 뜻이 아니다.** 최종 TypeScript 확인은 `completion-preview-runtime-typecheck-final.log`.
- 초기에 개발 모드 hydration이 운영 CSP의 `unsafe-eval` 차단에 막힘: 보안 정책 변경 없이 production build로 검수했다.
- 브라우저 4그룹 동시 실행에서 전체 테스트 시간 초과/WebGL 부하가 발생해 최대 2그룹으로 제한했다. 반복 여정의 전체 시간 한도를 늘리되 개별 결과 단언의 제한·부정 분기는 완화하지 않았다.

### 재실행 예시

앱 디렉터리에서 `pnpm typecheck`, `pnpm test:contracts`, `pnpm build:vercel:ondo-b`를 사용한다. 계약 테스트가 standalone staging을 재생성하므로 같은 staging의 로컬 서버·브라우저 검수와 동시에 실행하지 않는다. 공개 브라우저 검사는 `PLAYWRIGHT_BASE_URL=https://ondo-3n9pfey06-jaewook-9643s-projects.vercel.app pnpm exec playwright test <spec> --project=mobile-chromium --workers=1 --reporter=line --timeout=60000` 형태다. 각 실행의 테스트 파일/선택 범위는 로그에 남아 있다.

### 기기 검수 제한

- 설치된 Playwright WebKit은 페이지 생성 전에 Bus error 10 / exit 138로 종료된다. `completion-webkit-launch.log`.
- 시스템 Safari 17.2 WebDriver도 확인했으나 `Allow Remote Automation`이 꺼져 있어 세션 생성이 거절됐다. 사용자 브라우저 설정을 변경하지 않았다. `completion-system-safari-launch.log`.
- 따라서 Chromium 반응형 검수는 Safari/실제 iPhone/Android 성능·키보드 검수를 대신하지 않는다. 이 항목은 미완료로 남긴다.

## 실제 구현 우선순위

1. CX Mobile ID 실제 응답 → 최소 evidence 정규화 → OpenDID 발급/holder/status → 목적에 묶인 VP/verifier 정책: BE-02/04/05.
2. OmniOne 업무 outbox/계약 불변식/receipt: BE-13. 기록 성공과 지급 완료를 구분한다.
3. Wallet processor·금전 원장 + Sui signer/asset/effects + 승인된 경우에만 source/destination routing: BE-06/15/16.
4. 계정/복구/삭제, 예약·Table/chat/media, 실제 장소·온도 수집: 각 BE 체크리스트.

공식 DID 대회 필수과제와 프로젝트 선택 기술, 실제 receipt 증거는 Integration Matrix에서 별도 열로 관리한다. 8개 ADR은 미확정이며, 목업 완성으로 실제 기술 활용이나 운영 준비가 완료됐다고 판정하지 않는다.
