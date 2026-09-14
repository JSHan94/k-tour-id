# 지도 우선 첫 진입 — 2026-09-14

상태: **production Ready · 운영 HTTP/새 진입 브라우저 검수 완료**. 배포 source `d9eda4f` (동일 runtime). 로컬 후보·최종 운영·이전 릴리스의 증거를 구분하며 실제 provider 연결을 추가하지 않았다.

## 배포와 소스 구분

| 항목 | 현재 기록 |
|---|---|
| 작업 브랜치 | `implementation/did-demo-20260908` |
| 작업 디렉터리 | `.codex-worktrees/did-demo-20260908/k-tour-id-app/` |
| 운영 source/runtime | `d9eda4f`. 문서·QA 후속 인계 commit은 별도 |
| 운영 deployment / 생성 / 상태 | `dpl_7QvTYJicbaXo6oaZwHzHCxYJGMbC` · 2026-09-14 12:16:06 KST · Ready |
| 운영 URL | [ONDO](https://ondo-tau.vercel.app), 고유 주소 `https://ondo-6f18nfmzp-jaewook-9643s-projects.vercel.app`; 별도 alias `ondo-jaewook-9643s-projects.vercel.app` |
| 이전 운영/복구 기준 | [이전 고유 배포](https://ondo-6ojlcpoqf-jaewook-9643s-projects.vercel.app), source/runtime `82ea4c9`, deployment `dpl_E8wWPKBCa3GnXvUvqGbag8E5VV62`. 운영 alias는 현재 새 버전을 가리킴 |
| 이전 운영 고유 주소 | `https://ondo-6ojlcpoqf-jaewook-9643s-projects.vercel.app` |

운영 기준의 기존 증거는 [지도·지갑 여정 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)에 보존한다. 이번 배포의 완료 증거로 합산하지 않는다. 해커톤 1주 명세 변경 `d4ed215`는 별도 문서 작업이며, 이번 runtime 수정이나 실제 공급자 연결의 완료 증거가 아니다.

## 사용자 경험 변경

- 처음 방문한 사용자는 질문 sheet 없이 전국 지도에 들어간다. 서울/부산/제주 중 원하는 도시를 선택하면 해당 도시의 기존 온도 지도로 이동한다.
- 지도를 쓰기 위해 persona·취향·식이 질문을 먼저 완료할 필요가 없다. `ONB-NEW`는 설정 미완료 상태이지 모달을 열라는 요청이 아니다.
- 기존 지도 옵션/설정의 취향 편집은 유지한다. 단계형 지도 설정은 사용자가 설정에서 명시적으로 시작할 때만 열린다.
- 선택형 지도 설정에서도 첫 추천 매장 capsule/미리보기를 자동으로 보여주지 않는다. 취향 선택이 매장 상세를 자동으로 열지 않으며, 사용자가 지도/목록에서 장소를 선택한다.
- 설정을 시작하면 기존 저장값으로 임시 초안을 만든다. 취소/닫기/건너뛰기는 미확정 초안을 저장하지 않고 진입 전 `ONB-NEW` 또는 `ONB-COMPLETE`와 저장된 persona·도시·취향을 유지한다. 완료 버튼으로 저장한 경우만 확인한 값을 반영한다.
- 옛 저장 데이터의 `ONB-IN-PROGRESS`는 reload 때 강제 설문을 재개하지 않는다. 저장된 탐색 취향은 유지하며 정상 지도 진입/명시적인 도시 링크를 사용한다.

## runtime 변경 범위

아래 경로는 `k-tour-id-app/features/ondo/` 기준이며 runtime 파일은 5개다.

| 파일 | 변경 계약 |
|---|---|
| `app/ondo-app-b.tsx` | hydration 이후 `ONB-IN-PROGRESS`에서만 onboarding modal ownership 적용. 새 방문 지도 사용을 막지 않음 |
| `map/map-entry-b.tsx` | 강제 전국 preview는 명시적 설정 중에만 적용. 새 방문자의 도시 선택·지도 history·선택 장소 복귀를 설정 완료 여부로 차단하지 않음. 전국 지도 resize 재맞춤은 `ready` 또는 `error`에서 실행해 타일 장애 fallback의 제주 잘림을 방지하되 error 상태를 ready로 바꾸지 않음 |
| `onboarding/official-directory-onboarding.tsx` | 명시적 시작에서만 sheet 표시, 저장값으로 초안 준비, 자동 매장 preview 제거, 취소는 `cancelOnboarding` 사용 |
| `settings/settings-entry-b.tsx` | 기존 설정을 삭제하는 reset 대신 sheet를 닫고 선택형 `beginOnboarding` 실행 |
| `shared/state/ondo-b-provider.tsx` | 시작 전 NEW/COMPLETE 기억, 설정 열기는 ephemeral, 취소 시 기존 상태/저장값 유지, 완료 시 확인한 초안만 저장 |

새 API·실제 CX/OpenDID/OmniOne Chain/Sui·예약/결제 provider를 추가하지 않는다. 취향·온보딩 상태가 신원·연령·혜택·지갑 권한을 만들지 않으며, 기존 sampleOnly/미연결 경계를 유지한다. 온도 지도는 기존 샘플/출처 정책을 따르고 실제 혼잡도 수집을 새로 구현한 것이 아니다.

## 수락 조건과 관련 검사

| ID | 기대 행동 | 관련 검사 |
|---|---|---|
| MF-01 | 빈 저장소 → 전국 지도 → 선택 도시 온도 지도. 질문·자동 매장 상세 없음 | `tests/e2e/ondo-map-first-entry.spec.ts`의 390 EN light / 320 KO dark / 1440 EN light |
| MF-02 | 지도 옵션으로 기존 취향 편집 가능, 저장 후 reload 유지. 선택형 설정 취소는 NEW/COMPLETE와 기존 취향 보존 | 같은 파일의 `MAP-FIRST-PREFS` |
| MF-03 | legacy IN-PROGRESS 저장값으로 진입/reload해도 강제 설문 없음. 도시 링크·기존 취향 유지 | 같은 파일의 `MAP-FIRST-LEGACY` |
| MF-04 | 선택형 설정에서 매장 preview 없음. 시작/취소/완료·hydration이 신원/금전 권한을 변경하지 않음 | `tests/contracts/ondo-map-first-entry.spec.ts` |
| MF-05 | 기존 선택형 설정·지도·K-Pass·지갑 여정과 데스크톱/태블릿 사용성 유지 | 영향 범위 legacy·map-wallet·desktop/tablet 회귀. 실행 파일/건수는 아래 최종 증거로 한정 |
| MF-06 | 타일 차단·빠른 resize에서도 전국 fallback 지형이 프레임에 맞음. 지도 error truth와 로컬 geometry 유지 | `tests/contracts/ondo-map-first-entry.spec.ts`의 resize guard 및 브라우저 반복 검사 |

새 공개 UI suite의 정의된 검사는 5개이며, 신규 map-first 계약은 resize guard를 포함해 6개다. 기존 지도·지갑 suite의 실행 7개를 과거 릴리스의 12개와 혼동하지 않는다. 파일 존재·검사 계획만으로 실행 PASS를 주장하지 않는다.

## 검수 증거

증거 경로는 `k-tour-id-app/artifacts/qa/` 기준이다. 아래는 `d9eda4f`의 로컬 실행과 운영 URL 실행을 구분한 기록이다. 이전 작업 후보는 별도 표에 보존한다.

| 실행 범위 | 현재 결과 | 로그/후속 증거 |
|---|---|---|
| `d9eda4f` TypeScript | PASS | `map-first-20260914-typecheck-final.log` |
| `d9eda4f` standalone build·artifact scan | PASS | `map-first-20260914-build-final.log` |
| `d9eda4f` 전체 계약 | 832/832 PASS, 26초 | `map-first-20260914-contracts-final.log` |
| 최종 인계 문서 동기화 후 전체 계약 | 832/832 PASS, 10.4초. 단일 현재 기준·1주 명세 우선 링크·새 문서 경로 검사 포함 | `map-first-20260914-contracts-delivery-final.log` |
| `d9eda4f` 로컬 HTTP·asset/구 경로 경계 | PASS — root200, redirect308, discovery7, blocked26, assets19, public35 | `map-first-20260914-local-http.log` |
| resize guard 적용 후 personalized 지도 회귀 | 로컬 8/8 PASS, 1.0분 | `map-first-20260914-final-guard-personalized.log` |
| resize guard 적용 후 반복 resize 검사 | 로컬 3/3 PASS, 30.5초 | `map-first-20260914-final-guard-resize-repeat.log` |
| `d9eda4f` 새 map-first 공개 UI | 로컬 5/5 PASS, 1.6분 | `map-first-20260914-final-guard-new`의 `.last-run.json`·각 `runtime.json`·`trace.zip` |
| `d9eda4f` 실제 desktop mouse 회귀 | 로컬 1/1 PASS, 11.2초 | `map-first-20260914-final-guard-desktop`의 `.last-run.json`·`runtime.json`·`trace.zip`. 1440px desktop Chromium; 태블릿 추가 실행으로 세지 않음 |
| 최종 source 배포·Ready | PASS — `d9eda4f` | `map-first-20260914-production-inspect.log` |
| 새 운영 HTTP·asset/구 경로 경계 | PASS — root200, redirect308, discovery7, blocked26, assets19, public35 | `map-first-20260914-production-http.log` |
| 새 운영 map-first mobile project | 5/5 PASS, 1.8분, workers1/retries0 | `map-first-20260914-production-new` 및 `.log` |
| 새 운영 실제 desktop mouse | 1/1 PASS, 12.3초, workers1/retries0 | `map-first-20260914-production-desktop` 및 `.log`; 1440px, DPR1, touch0 |

최종 운영 6개는 순차 실행했고 product error는 0건이다. EN390 light·KO320 dark·실제 desktop1440 및 선택형 취향 화면의 안정된 스크린샷을 시각 확인했다. 여러 navigation을 수행하는 취향 검사에서 분류된 외부 tile 요청 중단 1건은 그대로 기록한다. 모든 network/error 배열이 0이라고 주장하지 않는다.

### 이전 작업 후보의 실행과 수정 이력

| 실행 범위 | 결과와 한계 | 증거 |
|---|---|---|
| 전체 계약 첫 실행 | 829/831 PASS, 2개 실패. 제거된 preview 속성의 구 assertion 1개·새 검사의 잘못된 source 위치 1개를 수정. 이후 resize 계약이 추가되어 최종 실행은 832개 | `map-first-20260914-contracts.log` |
| resize guard 전 legacy 묶음 | 최초 32개 중 30 PASS·2 FAIL. 실패한 2개는 assertion 변경 없이 개별 재실행하여 2/2 PASS, 20.8초. 최초 실패를 없애거나 32개 일괄 PASS로 바꾸지 않음 | `map-first-20260914-public-legacy.log`, `map-first-20260914-public-legacy-isolated.log` |
| 공개 Options 경유 deep-link 검사 | 테스트의 공개 Options selector 수정 후 정확한 경로 1/1 PASS, 4.6초 | `map-first-20260914-public-legacy-deeplink-verified.log` |
| resize guard 전 지도·지갑 여정 | 로컬 7/7 PASS, 2.7분. `tests/e2e/ondo-map-wallet-journeys.spec.ts`만 실행한 범위 | `map-first-20260914-map-wallet.log` |
| resize guard 전 지도·지갑 desktop/tablet | 로컬 2/2 PASS. guard 후 후보의 재실행 결과와 별도 | `map-first-20260914-map-wallet-desktop.log` |

legacy 최초 실패에는 지도 준비 지연과, 타일 차단/빠른 resize에서 나타난 타이밍 의존 제주 clipping이 있었다. 기존 전국 프레임 재맞춤이 `ready`일 때만 실행되던 경계를 `ready || error`로 보완했다. 타일 장애를 성공으로 위장하지 않고 error truth·로컬 geometry를 유지한다. 개별 재실행 성공만으로 타이밍 문제를 없다고 판단하지 않았으며, guard 후 8개 회귀와 별도 반복 resize 검사를 구분한다.

최초 실패와 수정 이유는 최종 PASS 후에도 남긴다. 아직 확인되지 않은 반례를 테스트 코드 수정만으로 해결했다고 표시하지 않으며, 중간 후보·재실행을 합산해 하나의 전체 PASS matrix나 부풀린 고유 검사 수를 만들지 않는다.

## 완료 확인

- [x] 후보 `d9eda4f` 전체 계약832개·typecheck·build/artifact scan·로컬 HTTP 확인.
- [x] 로컬 신규5개·반복 resize3개·실제 desktop1개·personalized8개를 각 실행 범위로 확인.
- [x] 새 production deployment Ready·고유 URL·runtime `d9eda4f` 확인.
- [x] 새 운영 HTTP probe 및 신규5개/실제 desktop1개 브라우저 완료·증거 연결.
- [x] 확인된 결과와 source별 한계를 반영하고 README/현재 release metadata를 이 기록으로 전환.

한계: 실제 iPhone Safari/Android 실기기와 실제 provider handoff는 미검증이다. Chromium viewport 검사는 해당 브라우저 범위이며 전체 기기×언어×theme 조합의 완전 검수는 아니다. 실제 공급자·VC/VP·자금·좌석·체인 거래는 이번 변경에 포함되지 않는다. [해커톤 1주 개발 명세](./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md)는 별도의 착수 전 검토안으로 유지한다.
