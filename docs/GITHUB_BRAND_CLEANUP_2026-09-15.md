# K-Tour ID · GitHub와 배포 경로 정리

기록일: 2026-09-15. **현재 브랜드 릴리스는 배포·검수 대기다.** 코드 수정, GitHub 게시, 실제 배포 Ready와 브라우저 검수는 각각 확인한 뒤 기록한다. 과거 PASS를 이번 배포 결과로 이월하지 않는다.

## 어디에서 시작하나요?

| 구분 | 경로와 상태 |
|---|---|
| 최신 순수 목업 소스 | [`release/ktour-brand-20260915`](https://github.com/woogieboogie-jl/k-tour-id/tree/release/ktour-brand-20260915) · 앱은 `k-tour-id-app/`, 실행은 [README](../README.md#run-the-handoff) |
| 운영 앱 | [ondo-tau.vercel.app](https://ondo-tau.vercel.app) · 이번 K-Tour ID 브랜드 배포는 아직 완료 판정 전 |
| 원 Harvey 인계 기준선 | [`handoff/harvey-20260914`](https://github.com/woogieboogie-jl/k-tour-id/tree/handoff/harvey-20260914), `9d4aec9` · 역사적 스냅샷이며 최신 브랜드 릴리스와 구분 |
| 별도 Passport 실험 | [`feat/sumsub-sandbox-onboarding-20260914`](https://github.com/woogieboogie-jl/k-tour-id/tree/feat/sumsub-sandbox-onboarding-20260914) · [Sumsub Preview](https://ondo-mi9i0eh8v-jaewook-9643s-projects.vercel.app), 브랜딩 배포 소스 `4464697` |

## 이번 릴리스에 포함되는 것

- 사용자에게 보이는 제품명은 **K-Tour ID**다. 흑백 K 심벌, 앱 제목·공유 이미지·주요 화면 문구와 개발자 진입 문서를 같은 이름으로 정리한다.
- 순수 목업을 기반으로 하며 **Sumsub 코드·API·자격증명은 포함하지 않는다.** 외부 신원·패스·결제·예약·체인 결과는 실제 연동 완료가 아니다.
- CX·OpenDID·OmniOne Chain·Sui의 필수 개발 범위, 비금전 체험 혜택 대표 여정과 제출 조건은 바꾸지 않는다. 개발자는 [짧은 인계서](./HARVEY_HACKATHON_HANDOFF_2026-09-14.md) → [Sui 추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md) → [상세 1주 명세](./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md)를 따른다.
- 내부 `ondo` 모듈명·API·환경 키·저장 키·역사적 요구 ID와 기존 호스트 이름은 호환성을 위해 유지한다. 과거 릴리스 문서·증거를 일괄 개명하지 않는다.

Sumsub는 별도 Sandbox에서 실제 WebSDK/API를 테스트한 실험이다. 운영 KYC나 실제 얼굴/liveness·전체 촬영/제출 완료를 증명하지 않으며 기존 DID 자격·혜택·잔액을 만들지 않는다. 자세한 범위와 수동 검수 잔여 사항은 [그 브랜치의 인계 문서](https://github.com/woogieboogie-jl/k-tour-id/blob/feat/sumsub-sandbox-onboarding-20260914/docs/SUMSUB_SANDBOX_HANDOFF_2026-09-14.md)를 따른다.

## GitHub에서 아직 별도인 것

이 릴리스가 GitHub 기본 브랜치 `main`, 저장소 About 또는 기존 `k-tour` 자동 배포 구성을 변경했다고 해석하지 않는다. 현재 이들은 기존 상태를 유지하며, 최신 앱 공유에는 위 명시적 릴리스 브랜치를 사용한다. 기본 브랜치·About·자동 배포 연결을 최신 앱으로 전환할지는 사용자 결정 후 별도 작업으로 처리한다. 원 인계 브랜치나 운영 배포를 무단 덮어쓰지 않는다.

## 공개 전 확인

- [ ] 릴리스 브랜치의 원격 commit과 실제 배포 source를 기록한다.
- [ ] 운영 배포 Ready, 고유 URL 및 운영 별칭 응답을 확인한다.
- [ ] 모바일·데스크톱 앱 이름·흑백 로고·공유 이미지와 주요 화면을 확인한다.
- [ ] Sumsub 서버 경로·SDK·설정이 순수 목업 산출물에 없음을 확인한다.
- [ ] 검수한 테스트·환경·제한만 기록하고 README와 인계 문서의 대기 상태를 갱신한다.
