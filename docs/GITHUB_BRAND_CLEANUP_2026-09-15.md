# K-Tour ID · GitHub와 배포 경로 정리

**이 문서는 `0ddc9e1` 브랜드 배포 당시의 역사적 기록이다.** 최신 대표 주소와 main/Harvey 동기화 상태는 [현재 배포·인계 기록](./KTOUR_PRODUCTION_HANDOFF_2026-09-15.md)을 따른다. 아래 실제 source·배포 ID·검수 결과는 그 당시 증거로 보존한다.

기록일: 2026-09-15. **K-Tour ID 브랜드 Production 배포 Ready.** 배포 시 릴리스 브랜치의 원격 소스와 실제 배포 source는 `0ddc9e1bd2df4a496a9d1d588ad6012eedbac680`이다. 이후 문서만 수정한 커밋과 이 runtime source를 구분한다. 과거 PASS를 이번 배포 결과로 이월하지 않는다.

## 당시 배포·인계 경로

| 구분 | 경로와 상태 |
|---|---|
| 당시 순수 목업 소스 | [`release/ktour-brand-20260915`](https://github.com/woogieboogie-jl/k-tour-id/tree/release/ktour-brand-20260915) · 앱은 `k-tour-id-app/`, 실행은 [README](../README.md#run-the-handoff) |
| 운영 앱 | [ondo-tau.vercel.app](https://ondo-tau.vercel.app) · K-Tour ID 브랜드 배포 Ready, source `0ddc9e1` |
| 고유 운영 배포 | [ondo-gafo82sil](https://ondo-gafo82sil-jaewook-9643s-projects.vercel.app) · `dpl_HVfUAJY7CiFdKDoJCoynvp9rBYwV` |
| 기존 공유 별칭 | [ondo-k-tour-id.vercel.app](https://ondo-k-tour-id.vercel.app) · 이전 배포에 고정된 별칭을 위 같은 Ready 배포로 수정 후 확인 |
| 원 Harvey 인계 기준선 | [인계 snapshot `9d4aec9`](https://github.com/woogieboogie-jl/k-tour-id/tree/9d4aec9) · 역사적 스냅샷이며 최신 브랜드 릴리스와 구분 |
| 별도 Passport 실험 | [`feat/sumsub-sandbox-onboarding-20260914`](https://github.com/woogieboogie-jl/k-tour-id/tree/feat/sumsub-sandbox-onboarding-20260914) · [Sumsub Preview](https://ondo-hinsi4hdz-jaewook-9643s-projects.vercel.app), source `4a6904a`, Ready · `dpl_EbZv6Fp4PLPVQRAEDdv2ToZxcqee` |

## 이번 릴리스에 포함되는 것

- 사용자에게 보이는 제품명은 **K-Tour ID**다. 흑백 K 심벌, 앱 제목·공유 이미지·주요 화면 문구와 개발자 진입 문서를 같은 이름으로 정리한다.
- 순수 목업을 기반으로 하며 **Sumsub 코드·API·자격증명은 포함하지 않는다.** 외부 신원·패스·결제·예약·체인 결과는 실제 연동 완료가 아니다.
- CX·OpenDID·OmniOne Chain·Sui의 필수 개발 범위, 비금전 체험 혜택 대표 여정과 제출 조건은 바꾸지 않는다. 개발자는 [짧은 인계서](./HARVEY_HACKATHON_HANDOFF_2026-09-14.md) → [Sui 추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md) → [상세 1주 명세](./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md)를 따른다.
- 내부 `ondo` 모듈명·API·환경 키·저장 키·역사적 요구 ID와 기존 호스트 이름은 호환성을 위해 유지한다. 과거 릴리스 문서·증거를 일괄 개명하지 않는다.

Sumsub는 별도 Sandbox에서 실제 WebSDK/API를 테스트한 실험이다. 운영 KYC나 실제 얼굴/liveness·전체 촬영/제출 완료를 증명하지 않으며 기존 DID 자격·혜택·잔액을 만들지 않는다. 자세한 범위와 수동 검수 잔여 사항은 [그 브랜치의 인계 문서](https://github.com/woogieboogie-jl/k-tour-id/blob/feat/sumsub-sandbox-onboarding-20260914/docs/SUMSUB_SANDBOX_HANDOFF_2026-09-14.md)를 따른다.

## 당시 GitHub 변경 범위

이 브랜드 릴리스 당시에는 GitHub 기본 브랜치 `main`, 저장소 About 또는 기존 `k-tour` 자동 배포 구성을 변경하지 않았다. 당시 인계 기준선은 `9d4aec9`였다. 이후 대표 URL·main·Harvey 브랜치의 변경은 위 현재 배포·인계 기록과 구분한다.

## 이번 릴리스 검수

- **로컬:** typecheck·production build·artifact scan 통과. 전체 계약 **842/842**(16.0초), 모바일·데스크톱 브랜드 E2E **10/10**(21.2초), EN/KO/JA fallback·24개 화면·자산 검사 E2E **4/4**(22.9초) 통과. 후자의 24개 화면은 4개 테스트가 점검한 화면 수이며 추가 테스트 수가 아니다.
- **로컬 HTTP:** 공개 자산/경로 27개·차단 경로 41개 검사 통과. 순수 목업의 Sumsub session/status 경로는 `404`이며 SDK·서버 코드를 포함하지 않는다.
- **운영 모바일:** 브랜드 4개 + EN/KO/JA fallback·24개 화면 검사 4개, 합계 **8/8** 통과(48.9초, workers 1, retries 0). 브라우저 오류·KYC 요청 각각 0회. 24개 화면은 4개 fallback 테스트의 점검 범위이며 테스트 수에 추가하지 않는다.
- **운영 HTTP:** 고유 `ondo-gafo82sil` URL, 공유용 `ondo-tau.vercel.app`, 기존 공유 별칭 `ondo-k-tour-id.vercel.app` 세 주소에서 각각 공개 27개·차단 41개, root `200`, legacy redirect `308`, discovery 7개 검사 통과. Sumsub session/status는 모두 `404`다.
- **기존 별칭 수정 이력:** `ondo-k-tour-id.vercel.app` 최초 probe는 이전 배포에 직접 고정된 별칭 때문에 새 제목을 찾지 못해 실패했다. 같은 승인된 프로젝트의 위 Ready 배포로 별칭을 옮긴 뒤 전체 HTTP probe가 통과했다. 최초 실패를 최초부터 성공한 것처럼 집계하지 않는다. 별칭 추가 확인은 HTTP 검사이며 원격 모바일 8개를 이 주소에서 추가 재실행했다는 뜻은 아니다.
- **별도 Sumsub Preview:** 모바일 브랜드 4개(12.8초), fallback 4개(32.5초), HTTP 공개 27개·차단 41개 통과. 이 결과는 브랜드/표시 회귀이며 실제 얼굴/liveness 또는 전체 SDK 제출 완료 검수가 아니다. 순수 목업의 테스트 수에 합산하지 않는다.
- **최종 문서:** 개발자 인계 계약 9/9 통과, 문서 9개의 로컬 링크 211개 확인, `git diff --check` 통과. 이는 문서 정합성 검사이며 추가 제품 여정 검수가 아니다.

이 검수는 브랜딩·지정 화면·목업 경계 확인이다. CX/OpenDID/OmniOne Chain/Sui의 실제 연동, 실자금 이동, 예약 확정 또는 실제 iPhone Safari/Android 기기 검수 완료로 확대하지 않는다. 별도 수동 KYC 검수의 미완료 범위는 위 Sumsub 인계 문서에 유지한다.
