# Harvey에게 보낼 메시지

발송 전 [현재 배포·인계 기록](./KTOUR_PRODUCTION_HANDOFF_2026-09-15.md)의 Ready 및 main/Harvey 동기화를 확인한다. 현재는 확인 대기이며, 아래 본문만 복사해 전달한다.

---

하비님, K-Tour ID 앱과 개발 인계 자료 공유드립니다!

앱: https://ktour-id.vercel.app
소스: https://github.com/woogieboogie-jl/k-tour-id/tree/handoff/harvey-20260914
인계서: https://github.com/woogieboogie-jl/k-tour-id/blob/handoff/harvey-20260914/docs/HARVEY_HACKATHON_HANDOFF_2026-09-14.md

기존 `handoff/harvey-20260914` 브랜치의 `k-tour-id-app/`에서 시작하시면 됩니다. 설치·실행은 README에 정리했습니다.

이번에는 전체 서비스 백엔드 대신 장소 1곳·비금전 체험 혜택 1개를 실제로 끝까지 연결하는 범위입니다. 필수 연동은 **OmniOne CX, OpenDID, Sui(Move·zkLogin/PTB·승인 기반 AI 실행), OmniOne Chain**입니다.

대표 흐름은 지도에서 혜택 선택 → 신원 확인·패스 발급/제시 → AI 제안·사용자 승인 → Sui 실행 → 서버 최종 자격 확인·혜택 사용 → OmniOne 기록 → 같은 장소 복귀입니다. 실제 충전·결제·환불·예약은 목업으로 두고, Sumsub는 별도 테스트여서 이번 필수 연동을 대신하지 않습니다.

자료 제출은 **9/21(월) 18:00**입니다. 인계서에 작업·플로우·기술 자료와 완료 기준을 정리해뒀으니, 착수에 필요한 계정/환경과 Sui·AI 담당 포함 가능한 일정을 먼저 확인 부탁드립니다!
