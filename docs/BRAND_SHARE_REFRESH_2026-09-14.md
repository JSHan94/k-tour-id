# K-TOUR ID 공유 카드·아이콘 릴리스 — 2026-09-14

상태: **최종 production Ready · 고유 배포 HTTP·브랜드 브라우저·두 운영 별칭의 봇/자산 해시 검수 PASS**. 배포 source `cc3d7c3`이며 첫 후보와 최종 재배포의 실행 증거를 아래에서 분리한다.

## 변경과 배포 기준

| 항목 | 기준 |
|---|---|
| 배포 source | `cc3d7c3` |
| 변경 범위 | 음식·카페·바 중심 공유 카드, K-TOUR ID 무채색 아이콘, 관련 메타데이터·공개 자산 allowlist·검사 |
| 운영 주소 | [ONDO](https://ondo-tau.vercel.app), [K-TOUR ID 공유 주소](https://ondo-k-tour-id.vercel.app). 두 별칭 모두 동일한 승인된 `ondo` 프로젝트의 최종 배포로 연결됨을 CLI로 확인 |
| 최종 deployment / 고유 URL | `dpl_Bf4rBwnqH5PpaHeMRW6NmM8y3Wk1` **Ready**, [고유 배포 주소](https://ondo-hn9weswki-jaewook-9643s-projects.vercel.app). 저장소 루트의 추적된 `.vercelignore`를 포함한 동일 소스 재배포 |
| 마지막 기능 흐름 검수 | 이전 `e2ad7c4`의 [매장 After 19 수정·검수](./PLACE_AFTER19_FIX_2026-09-14.md). 계약833/833·After 19 로컬5/5·운영5/5는 그 배포의 역사적 증거이며 이번 소스에서 재실행한 결과가 아님 |
| 아트워크·생성 프롬프트 | [앱 브랜딩 기록](../k-tour-id-app/docs/branding/KTOUR_SOCIAL_REFRESH_2026-09-14.md) |

앱 제목은 `K-TOUR ID | ONDO 溫圖`를 유지한다. 공유 설명은 음식·카페·바 탐색과 여행 패스에 맞췄다. 기존 지도·취향·장소·신원·Wallet·Tables·예약 플로우 및 해커톤 개발 범위는 변경하지 않았다.

## 자산과 캐시 경계

- 공유 이미지: `/og-ktour-food-v1.png`, 실제 PNG 1200×630.
- 아이콘: `/brand/ktour-id-mono-v1.svg`와 `/brand/ktour-id-mono-v1-{16,32,180,192,512}.png`. 제공받은 마크를 바탕으로 만든 무채색 벡터와 래스터 출력이며 원본 마크는 보존했다.
- `app/page.tsx`, `app/layout.tsx`, standalone 생성 layout의 메타데이터를 맞췄다. 이전 OG는 원본 보존과 별개로 활성 allowlist에서 제외했다.
- 새 파일명은 이전 자산 캐시와 구분한다. 이미 전송한 메시지의 미리보기는 Telegram 등 공유 서비스가 캐시를 유지할 수 있으며, 서버 배포만으로 과거 메시지 카드가 즉시 갱신된다고 보장하지 않는다.
- 음식 사진은 브랜드 카드용 합성 이미지다. 특정 매장의 실사진·실제 방문·인기·제휴 증거가 아니다.

## 이번 변경의 실행 증거

| 실행 범위 | 결과 |
|---|---|
| 관련 계약 | 로컬44/44 PASS. 브랜드 자산·standalone 패키징·OpenDID onboarding 관련 검사이며 전체 계약 suite 재실행 아님 |
| 인계 문서 정합성 | 배포 기록 동기화 후 HANDOFF-SYNC 9/9 PASS. 네 기술의 요구·소스 연결·문서 링크·현재 release 기준 일치 확인 |
| 타입 | 로컬 typecheck PASS |
| 운영형 빌드·격리 | 로컬 production standalone build·client-artifact scan PASS |
| 로컬 HTTP | PASS: root200, legacy entry308, 차단 경로26개, 공개 자산41개. 새 OG·PNG 아이콘 실제 크기와 메타데이터 일치 |
| 로컬 브라우저 | mobile/desktop 브랜드6/6 PASS, workers1/retries0. 메타데이터·아이콘·지도 우선 진입·허용 요청 호스트의 canonical/image URL 검증 |
| 첫 운영 후보 브라우저 | `dpl_AhC61t8y33iySS37Hkj5eG4aNS9a`에서4/4 PASS(8.1초, mobile2+desktop2, workers1/retries0). 아래 패키징 문제 발견 전 후보 결과이며 최종 재배포 결과로 이월하지 않음 |
| 최종 운영 HTTP | 최종 고유 URL에서 PASS: root200, legacy308·허용 discovery query7개, 차단 경로26개, 공개 자산41개 |
| 최종 운영 브라우저 | 최종 고유 URL에서4/4 PASS(7.4초, mobile2+desktop2, workers1/retries0). 메타데이터·아이콘·지도 우선 진입 검사이며 로컬의 요청 호스트 override 검사는 원격 실행 수에 포함하지 않음 |
| 운영 별칭·공유 봇 | 두 별칭의 최종 배포 연결 CLI 확인. `ondo-k-tour-id`와 `ondo-tau` 각각 TelegramBot `?share=food-v1` 메타데이터200, 확인한 새 자산5개씩의 SHA가 로컬과 일치, 제외 대상 `/og-modern-atlas.png`404. 두 별칭 PASS |

재현 진입점은 앱 디렉터리 기준 `pnpm typecheck`, 해당 계약 파일의 Playwright 실행, `pnpm build:vercel:ondo-b`, `tests/e2e/ondo-b-brand-deployment.spec.ts`의 해당 프로젝트 실행이다. HTTP의 실제 검수는 `probeStandaloneHttp`를 직접 import해 실행했으며, 같은 검사를 CLI로 재현하는 동등한 명령은 `ONDO_B_PROBE_BASE_URL=<origin> pnpm probe:sites:ondo-b`다. 이 CLI 문자열 자체를 실제 실행했다고 기록하지 않는다. 브라우저 실행 수는 프로젝트별 실제 실행을 센 것이며 로컬6개와 최종 원격4개를 고유 여정10개로 합산하지 않는다. 재실행으로 덮인 임시 산출물에 영구 로그 경로를 부여하지 않는다.

일반 개발 서버의 최초 병렬 cold run은6개 중 모바일 hydration timeout1개가 있었고, 이후 serial 개발 서버6/6 및 독립적인 production build의6/6은 PASS했다. 상세 범위는 [앱 브랜딩 기록](../k-tour-id-app/docs/branding/KTOUR_SOCIAL_REFRESH_2026-09-14.md)을 따른다.

### 첫 운영 후보의 패키징 문제

첫 후보는 source `cc3d7c3`, deployment `dpl_AhC61t8y33iySS37Hkj5eG4aNS9a`, [고유 주소](https://ondo-x06yqyc1o-jaewook-9643s-projects.vercel.app)였다. 새 메타데이터·자산과 브랜드 브라우저4개는 확인했지만 전체 HTTP probe에서 제외 대상 `/og-modern-atlas.png`가200으로 응답했다. 앱 디렉터리만 묶은 임시 업로드에서 저장소 루트의 추적된 `.vercelignore`가 빠진 것이 확인되어, 해당 파일을 포함해 **같은 source를 재배포**했다. 위 최종 배포에서 HTTP와 브랜드 브라우저를 다시 검증했다. 첫 후보는 대체되었으며 그 Ready 상태나 부분 PASS를 최종 결과에 합산하지 않는다.

## 유지한 한계와 복구 기준

- 실제 provider 연결을 추가하지 않았다. CX/OpenDID/OmniOne Chain/Sui·금융·예약 결과는 기존 목업/개발 인계 경계를 유지한다.
- 실제 iPhone Safari/Android 기기 테스트는 수행하지 않았다. 모바일 viewport의 브라우저 검사는 실기기 또는 네이티브 provider handoff 검수가 아니다.
- 이번 배포는 전체 기능 여정·전체 계약833개 재실행이 아니다. [이전 기능 검수](./PLACE_AFTER19_FIX_2026-09-14.md), [지도 우선 진입](./MAP_FIRST_ENTRY_2026-09-14.md), [지도·지갑 여정](./MAP_WALLET_JOURNEYS_2026-09-12.md)의 source·URL·범위를 분리한다.
- 이전 기능 배포의 고유 URL은 [e2ad7c4 운영 스냅샷](https://ondo-eq9z4oba8-jaewook-9643s-projects.vercel.app)이다. 이동 가능한 운영 별칭을 이전 스냅샷으로 취급하지 않는다. 실제 rollback은 배포 대상·고유 URL·차단 경로를 확인한 별도 승인 작업이며 여기서 실행하지 않았다.
