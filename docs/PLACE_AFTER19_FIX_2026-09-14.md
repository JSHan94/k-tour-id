# 매장 After 19 확인 화면 겹침 수정 — 2026-09-14

상태: **production Ready · 운영 HTTP·해당 공개 경로 5개 검수 완료**. 배포 source `e2ad7c4` (동일 runtime). 로컬 PASS와 운영 실행을 구분한다. 실제 provider 연결을 추가하지 않았다.

## 배포 기준

| 항목 | 기록 |
|---|---|
| 작업 브랜치 / 디렉터리 | `implementation/did-demo-20260908` / `.codex-worktrees/did-demo-20260908/k-tour-id-app/` |
| 운영 source/runtime | `e2ad7c4edf0e3b05b70dbdb31e49d0521a57d781`; 후속 문서·검수 인계 commit은 별도 |
| deployment / 생성 / 상태 | `dpl_435M4FCDrrR8AWGgNhmCTD9J3g8J` / 2026-09-14 13:05:48 KST / Ready |
| 운영 주소 | [ONDO](https://ondo-tau.vercel.app), [이번 고유 배포](https://ondo-eq9z4oba8-jaewook-9643s-projects.vercel.app); 별도 alias `ondo-jaewook-9643s-projects.vercel.app` |
| 이전 운영 / 복구 기준 | [이전 고유 배포](https://ondo-6f18nfmzp-jaewook-9643s-projects.vercel.app), source/runtime `d9eda4f`, deployment `dpl_7QvTYJicbaXo6oaZwHzHCxYJGMbC` |

이전 [지도 우선 진입](./MAP_FIRST_ENTRY_2026-09-14.md)과 [지도·지갑 여정](./MAP_WALLET_JOURNEYS_2026-09-12.md)의 결과는 각각의 source에서 얻은 역사적 증거다. 이번 검사 수에 합산하지 않는다. 운영 alias는 새 버전을 가리키므로 복구 기준에는 이전 고유 주소를 사용한다.

## 원인과 수정

- 부산 동래구 장소 상세에서 After 19 확인 화면이 지도 도구의 낮은 stacking context 안에 있어, 보존된 장소 상세 뒤에 가려졌다. 이전 운영 화면에서 재현했다.
- 확인 화면만 공통 `ondo-canvas`에 portal로 렌더링한다. 지도 도구에는 진입 버튼만 남기고, CSS와 논리 모달 우선순위를 모두 `fullTask` 140으로 맞춰 장소 상세 120보다 위에 표시한다.
- 포커스 표시와 지도 제스처 안내 숨김도 portal 위치에 맞춘다. 같은 장소로 돌아오는 return journal, 취소/확인 소비 규칙, 정확한 스크롤·포커스 복원 계약은 변경하지 않는다.
- 게스트의 명시적 야간 보기 전환은 로컬 보기 설정이다. 실제 연령 proof, 신원 발급, Payment KYC 또는 매장 서비스 권한으로 승격하지 않는다.

Runtime 변경: `features/ondo/after19/after19-global-b.tsx`, `after19-global-b.module.css`, `features/ondo/map/map-b.module.css` (앱 디렉터리 기준). 실제 CX/OpenDID/Chain/Sui·예약·결제 연결, 백엔드 계약, 1주 개발 범위는 변경하지 않았다.

## 수락 조건

새 공개 경로 suite는 `tests/e2e/ondo-b-place-after19-topmost.spec.ts`다. 저장소 주입·QA 전역·mock response·강제 클릭 없이 공개 `/`에서 실행한다.

| 검사 | 조건 |
|---|---|
| 동래구 장소 → 확인 → 취소/확인 → 같은 장소 (3개) | 320px light, 390px dark, 실제 mouse desktop 1440px. 확인/취소 버튼이 최상단 hit-test를 통과하고, 단일 활성 modal·동일 venue/URL·스크롤·포커스 복원 확인 |
| 확인 중 새로고침 (1개) | pending return token 유지, 확인 화면 재표시, 취소 시 동일 장소의 정확한 스크롤과 CTA 포커스 복원 |
| 지도에서 직접 진입 (1개) | 취소 시 지도 토글로 포커스 복귀, 확인/끄기 가능, 장소 상세 불필요, 게스트 신원·연령·Payment 상태 불변 |

프로젝트 매칭 때문에 건너뛴 5개는 중복 조합의 skip이며 실행한 검사나 PASS로 세지 않는다. 신규 계약은 portal host·CSS/논리 우선순위 일치를 `tests/contracts/ondo-global-after19-exit-presence.spec.ts`에서 보호한다.

## 실행 증거

증거는 `k-tour-id-app/artifacts/qa/` 아래다.

| 범위 | 확인 결과 | 증거 |
|---|---|---|
| 수정 전 운영 재현 | 장소 상세 뒤에 확인 화면이 가림 | `place-after19-20260914-before.png` |
| 로컬 전체 계약 | 833/833 PASS, 11.3초 | `place-after19-20260914-contracts.log` |
| 최종 인계 문서 동기화 후 전체 계약 | 833/833 PASS, 10.0초 | `place-after19-20260914-contracts-delivery.log` |
| 로컬 TypeScript / standalone build·scan | PASS | `place-after19-20260914-typecheck-final.log`, `place-after19-20260914-build.log` |
| 로컬 HTTP 경계 | PASS — root200, redirect308, discovery7, blocked26, assets19, public35 | `place-after19-20260914-local-http.log` |
| 로컬 공개 경로 | 5/5 PASS, 2.7분; 5개 project mismatch skip은 별도 | `place-after19-20260914-local.log`, `place-after19-20260914-local/`의 screenshots·runtime.json·trace.zip |
| 새 운영 배포 | Ready, source `e2ad7c4` | `place-after19-20260914-production-inspect.log` |
| 새 운영 HTTP 경계 | PASS — root200, redirect308, discovery7, blocked26, assets19, public35 | `place-after19-20260914-production-http.log` |
| 새 운영 공개 경로 | 5/5 PASS, 2.0분, workers1/retries0; 5개 project mismatch skip은 별도 | `place-after19-20260914-production.log`, `place-after19-20260914-production/` |

로컬/운영 각각 5개 실행의 product error는 0건이다. navigation 때 분류된 외부 지도 요청 `ERR_ABORTED`는 로컬 16건·운영 18건이며 그대로 기록한다. 나머지 오류 배열은 0건이다. 로컬 320px light·390px dark·1440px desktop 및 운영 320px·desktop 확인 화면 캡처를 시각 검수했다. 모든 network/error 배열이 0이라고 주장하지 않는다.

## 완료와 한계

- [x] 원인 수정·로컬 계약/타입/build/HTTP·공개 경로 5개 검수.
- [x] 새 production Ready와 운영 HTTP 경계 확인.
- [x] 새 운영 공개 경로 5개 최종 결과·runtime 오류 확인.
- [x] 최종 결과를 현재 인계 문서에 동기화한 뒤 전체 계약833개 재검사.

실제 iPhone Safari/Android 실기기 및 실제 provider handoff는 미검증이다. Chromium viewport 검사는 해당 실행 범위만 입증하며 전체 기기·언어·theme 조합이나 모든 DID/결제 여정 완료를 뜻하지 않는다. [해커톤 1주 개발안](./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md)은 별도 착수 전 검토안으로 유지한다.
