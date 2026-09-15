# K-Tour ID 브랜드·공개 패키징 정리 — 2026-09-15

App source: `4a6904a` on `feat/sumsub-sandbox-onboarding-20260914`.
Verified Ready **Preview**: https://ondo-hinsi4hdz-jaewook-9643s-projects.vercel.app

Deployment: `dpl_EbZv6Fp4PLPVQRAEDdv2ToZxcqee` · project `ondo` · target **Preview** · Vercel inspect에서 Ready 확인.

이 기록은 별도 Sumsub Sandbox가 포함된 개발 Preview의 유지보수 배포·검수 기록이다. 기존 Production 또는 `handoff/harvey-20260914`를 이 브랜치로 교체했다는 뜻이 아니다. 별도 운영 목업 후보 `release/ktour-brand-20260915` / source `0ddc9e1`의 배포 상태·검수는 이 기록으로 보장하지 않는다.

## 변경 범위

- 장소 데이터 설명에 남은 구 브랜드와 사진 로딩 실패 시 장소 카드에 표시되던 `ONDO` 대체 문구를 정리했다.
- 활성 공유 카드 `og-ktour-food-v2.png`와 무채색 `ktour-id-mono-v1` 아이콘을 유지하며, 보관용 구형 이미지는 디스크에서 지우지 않고 배포 공개 목록에서 제외했다. 이번 공개 이미지 목록은 27개, 차단 HTTP 경로는 41개다.
- README와 개발 인계 문서는 현재 Sandbox Preview, 원 운영 목업, 실제 개발이 필요한 해커톤 네 기술을 구분한다. 관련 소스·패키징·문서 계약 검사를 함께 갱신했다.
- Sumsub API/SDK 승인 로직이나 공급자 설정을 변경하지 않았다. CX·OpenDID·OmniOne Chain·Sui/AI, 실제 금융·예약·bridge 및 여권 NFC의 개발 범위도 그대로다.

이미지 제작 프롬프트와 이전 브랜딩 검수는 [원본 브랜딩 통일 기록](../k-tour-id-app/docs/branding/KTOUR_BRAND_UNIFICATION_2026-09-15.md)에 보존한다. 그 문서의 `4464697`/이전 Preview 결과를 이번 배포 결과로 합산하지 않는다.

## 확인한 결과

| 검사 | 이번 결과·범위 |
|---|---|
| TypeScript | PASS |
| 선별 계약 검사 | 58/58 PASS. 전체 계약 검사를 의미하지 않음 |
| Vercel 배포 확인 | 위 deployment ID·Preview target·Ready 확인 |
| 원격 HTTP probe | PASS: `/` 200, `/ondo-b` 308, 보존 discovery key 7개, 차단 경로 41개, 참조 build asset 19개, 공개 이미지 27개 |
| 원격 모바일 브랜딩 | 4/4 PASS · 12.8초 · worker 1 · retry 0 · application error 0 |
| 화면 육안 확인 | EN light / KO dark × 320/390 CSS px의 4장. 지도 제목·도시 라벨·설정 버튼 표시, 무채색 K-Tour ID 헤더, 인접 버튼 겹침 없음 |
| 추가 전체 계약 검사 | 866/866 PASS · 14.7초 · worker 1 · skip 0 · unexpected 0 · flaky 0. 위 58개를 포함하는 전체 소스 계약이며 실제 공급자 여정 검수 수가 아님 |
| 추가 원격 fallback 검사 | 4/4 PASS · 32.5초. EN/KO/JA 24개 대표 화면, 실제 사진 실패 fallback, 구형 자산 15개 404·현재 자산 3개 200 확인. application error·KYC request 각각 0 |

브랜딩 4개는 공유 메타데이터, 새 사용자 지도 우선 진입, light 헤더, dark 헤더 검사다. 원격에서 프록시 헤더를 인위적으로 변경하는 `allowed deployment host` 검사는 제외했다. 모바일은 Chromium 기기 에뮬레이션이며 실제 iPhone Safari·Android 기기 검수가 아니다.

검수 산출물은 앱 기준 `artifacts/qa/brand-cleanup-preview/http.log`, `browser.log`, `browser/**/brand-header-{light,dark}-{320,390}.png`다. 로컬 검수 산출물이며 공개 Git 포함을 전제로 하지 않는다.

추가 fallback 검사는 별도 운영 목업 작업 디렉터리(W2)의 테스트를 **위 Sandbox Preview URL**에 대해 실행했다. 산출물은 그 작업 디렉터리의 앱 기준 `artifacts/qa/brand-cleanup-sandbox-fallback/`이다. 위 브랜딩 4개와 다른 검사이며, 24개 화면을 24개의 독립 사용자 여정으로 집계하지 않는다.

실행한 원격 검수 명령(앱 디렉터리 기준):

```sh
ONDO_B_PROBE_BASE_URL=https://ondo-hinsi4hdz-jaewook-9643s-projects.vercel.app pnpm probe:sites:ondo-b
PLAYWRIGHT_BASE_URL=https://ondo-hinsi4hdz-jaewook-9643s-projects.vercel.app pnpm exec playwright test tests/e2e/ondo-b-brand-deployment.spec.ts --project=mobile-chromium --grep-invert 'allowed deployment host' --workers=1 --retries=0 --reporter=list --output=artifacts/qa/brand-cleanup-preview/browser
```

## 신뢰 경계와 역사적 증거

이번 원격 검사에는 KYC 세션 생성·상태 조회·공급자 승인 요청을 사용하지 않았다. 브랜딩 통과는 Sumsub SDK 여정 재실행이나 실제 얼굴/liveness·전체 문서 촬영/제출 성공이 아니다. [Sumsub Sandbox 인계](./SUMSUB_SANDBOX_HANDOFF_2026-09-14.md)의 이전 `c80d1da` 문서 업로드·테스트 카메라와 명시적 GREEN 시뮬레이션 증거는 별도로 유지한다. Sandbox 완료는 운영 신원 확인·OpenDID 패스·혜택·결제 권한을 부여하지 않는다.

이전 운영 `cc3d7c3`의 [공유 카드 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md), 기능 검수 `e2ad7c4`의 [After 19 기록](./PLACE_AFTER19_FIX_2026-09-14.md), [지도·지갑 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)의 수치는 해당 소스·주소의 역사적 증거다. 이번 Preview에서 전체 제품 여정을 다시 검수했다고 표시하지 않는다.
