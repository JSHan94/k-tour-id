# K-Tour ID · 현재 운영 배포와 개발자 인계

기록일: 2026-09-15. 상태: **pending — 새 대표 주소 배포·검수 및 main/Harvey 동기화 확인 대기**.

## 현재 공유 경로

| 항목 | 기준 |
|---|---|
| 대표 앱 | [ktour-id.vercel.app](https://ktour-id.vercel.app) |
| 기준 소스 | [main](https://github.com/woogieboogie-jl/k-tour-id/tree/main) |
| Harvey 시작 브랜치 | [handoff/harvey-20260914](https://github.com/woogieboogie-jl/k-tour-id/tree/handoff/harvey-20260914) · 기존 이름 유지 |
| 짧은 개발 인계서 | [해커톤 연동 개발 요약](./HARVEY_HACKATHON_HANDOFF_2026-09-14.md) |
| 실행·개발 작업표 | [README](../README.md#run-the-handoff) · [개발자 시작 문서](./DEVELOPER_START_HERE.md) |
| 전달 메시지 | [Harvey에게 보낼 메시지](./HARVEY_MESSAGE_2026-09-15.md) |
| 배포 source | pending — 실제 배포 소스 확인 후 기록 |
| 배포 ID·고유 URL | pending — Ready와 응답 확인 후 기록 |
| main / Harvey 원격 HEAD | pending — 두 브랜치의 동일 SHA 확인 후 기록 |

앱은 `k-tour-id-app/`에 있다. `main`과 Harvey 브랜치를 **동일한 앱·문서 소스로 동기화**하는 인계이며, 기존 Harvey 브랜치 이름은 바꾸지 않는다. 이 문서의 pending 상태는 아직 원격 반영·배포 확인이 끝나지 않았다는 뜻이다. 문서 작성만으로 동기화·운영 검수 완료를 주장하지 않는다. 배포 runtime source와 이후 문서 전용 커밋은 별도로 기록한다.

## 확인된 배포 구성

- 대표 별칭 `ktour-id.vercel.app`을 확보해 기존 Ready 배포에 연결했다. 새 canonical origin을 적용한 최종 빌드·배포 검수는 위 pending 상태와 별도로 확인 중이다.
- 운영 Vercel 프로젝트 `ondo`의 Git 연결을 `woogieboogie-jl/k-tour-id`, Production 브랜치를 `main`으로 맞췄다.
- 구 `k-tour-id` Vercel 프로젝트는 Git 연결만 해제해 중복 자동 배포를 막았다. 프로젝트·기존 배포·키는 삭제하지 않았다.
- Production의 `NEXT_PUBLIC_SITE_URL`과 `NEXT_PUBLIC_ONDO_B_ORIGIN`은 대표 URL로 설정했다. 기존 환경 키 이름은 유지하며 Preview 환경·KYC secret은 변경하지 않았다.

## 개발자가 연결할 범위

현재 앱은 **순수 목업**이다. CX·OpenDID·OmniOne Chain·Sui는 모두 팀 필수이며 실제 연동은 개발 대상이다. 장소 1곳·비금전 체험 혜택 1개로 다음 여정을 연결한다.

```text
지도 → 장소·체험 혜택 → CX 신원 확인 → OpenDID 패스 발급·제시
 → AI의 허용된 제안 → 사용자 승인 → zkLogin/PTB 제한 위임 → Sui Move 실행
 → 서버의 실제 결과·최종 자격 확인 → 혜택 1회 사용 → OmniOne 기록 → 같은 장소 복귀
```

실제 충전·결제·환불·예약·bridge·여권/체류증 운영 연동은 이번 최소 범위가 아니다. 사용자의 승인, 실패·취소·만료·중복·복귀 처리는 실제 SDK/API에 연결해야 한다. Sui 권한 소비와 DB 혜택 사용·OmniOne 기록은 각각 확인한다. 상세 계약과 Sui 제출 조건은 [Sui 추가 명세](./HACKATHON_SUI_REQUIRED_ADDENDUM_2026-09-14.md)와 [1주 명세](./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md)를 따른다.

## 별도 Sandbox와 과거 기록

[Sumsub Preview](https://ondo-hinsi4hdz-jaewook-9643s-projects.vercel.app)는 별도 [`feat/sumsub-sandbox-onboarding-20260914`](https://github.com/woogieboogie-jl/k-tour-id/tree/feat/sumsub-sandbox-onboarding-20260914) 실험이다. 이 순수 목업 릴리스에는 Sumsub 코드·API·설정을 포함하지 않는다. 실제 WebSDK/API 테스트는 운영 KYC, 실제 얼굴/liveness·전체 촬영/제출 완료 또는 DID 패스 발급 증거가 아니다. [별도 인계 문서](https://github.com/woogieboogie-jl/k-tour-id/blob/feat/sumsub-sandbox-onboarding-20260914/docs/SUMSUB_SANDBOX_HANDOFF_2026-09-14.md)의 검수 한계를 유지한다.

원 인계는 [snapshot `9d4aec9`](https://github.com/woogieboogie-jl/k-tour-id/tree/9d4aec9)로 고정해 보존한다. `cc3d7c3`의 [9/14 공유 이미지 릴리스](./BRAND_SHARE_REFRESH_2026-09-14.md), `0ddc9e1`의 [브랜드 배포 기록](./GITHUB_BRAND_CLEANUP_2026-09-15.md)은 당시 source·URL·검수 증거다. 해당 기록의 PASS를 새 대표 주소나 새 배포에서 재실행한 결과로 합산하지 않는다.

## 공개·인계 확인

- [ ] 실제 배포 source·Ready·고유 URL·대표 주소 응답 확인.
- [ ] main과 Harvey 원격 HEAD가 동일한 앱·문서 SHA인지 확인.
- [ ] 새 대표 주소의 canonical·공유 이미지·모바일/데스크톱 주요 화면 검수.
- [ ] 순수 목업에 Sumsub SDK·서버 경로가 없고 실제 자격·결제·예약을 생성하지 않음을 확인.
- [ ] 문서 계약·링크 검사와 확인한 테스트 범위 기록; 미검수 항목은 미검수로 유지.
- [ ] 완료 사실에 맞춰 README·짧은 인계서·전달 메시지의 대기 표시 갱신.
