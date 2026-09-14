# ONDO 목업 운영 배포 — 2026-09-12

## 현재 운영 주소

- [ONDO 운영 앱](https://ondo-tau.vercel.app)
- Vercel project `ondo` · target **production** · **Ready**.
- Deployment: `dpl_9eg5EFadicvMWY9FnEexpfzeURNk`.
- 고유 배포 주소: `https://ondo-epoa8cmwc-jaewook-9643s-projects.vercel.app`.
- 배포 source/runtime `52f376e`. 검수된 프리뷰 `dpl_5UBqY7AuN6764B2VTrvEB3pUrFsY`를 promote했고, Vercel이 새 production deployment를 생성했다. 당시 로컬 HEAD `ddae69b`와의 차이는 문서·테스트뿐이다.
- 사용자가 프리뷰가 아닌 일반 Vercel 배포를 명시적으로 승인했다. 프로젝트 소유자·project/org ID·로그인 사용자를 기존 배포 guard로 확인했다.

**운영 주소에 공개된 목업이다.** 실제 DID/VC 발급, CX·OpenDID·OmniOne Chain·Sui 연결, 예약·자금 이동이 시작된 것은 아니다. 샘플 표시와 미연결 경계를 유지하며 provider/SDK 개발 요구사항은 그대로다. 완벽성이나 실서비스 출시 인증을 주장하지 않는다.

## 운영 주소에서 다시 확인한 범위

| 검사 | 상태 |
|---|---|
| `/`·장소 API·redirect·legacy 404·기존 CSP | 10/10 PASS |
| canonical URL | `https://ondo-tau.vercel.app` 일치 |
| 모바일 지도·검색·옵션·언어·복귀 | 3/3 PASS · 제주320 KO dark / 부산390 EN light / 서울430 JA dark · 1.1분 |
| 신원 callback 복구·연령 거절·지갑 거절/취소 | 3/3 PASS · 공개 샘플 UI, 격리된 브라우저 · 41.8초 |
| 문서 동기화 포함 계약 테스트 | 800/800 PASS · 17.8초 |
| 브라우저 runtime 기록 | 6개 기록 · 앱 오류 0 · 외부 지도 오류 1건 별도 분류 |

두 그룹 모두 worker1·자동 retry0으로 실행했다. 신원 그룹은 invalid callback 복구, 연령 미달 Table 참여 거절·동일 Table 복귀, 320px KO 지갑 충전 거절/이체 취소 후 잔액·신원 축 불변을 검수했다. 해당 그룹 trace의 요청99개는 전부 ONDO/지도 타일 GET이며 외부 신원·결제 호출은 없었다. 기존 사용자의 데이터나 세션을 초기화하지 않았다.

모바일 지도 캡처 3개와 320px 지갑 캡처를 직접 확인했다. Runtime 집계에서 앱 오류는 없었으며, 외부 지도 오류 1건은 신원 그룹에서 발생했다. 외부 asset/preview 오류와 navigation abort는 각각 0건이다. 이 결과는 이번에 실행한 범위에 한정한다.

[9월 11일 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)의 기준선174개·수정 영향27개 및 [9월 12일 프리뷰 재배포](./REDEPLOYMENT_2026-09-12.md)의 3개는 해당 URL에서 실행한 별도 증거다. 이번 운영 URL에서 전부 재실행한 것으로 집계하지 않는다. 실제 iPhone Safari/Android와 실제 provider handoff는 미검증이다.

## 증거와 복구 기준

증거는 `k-tour-id-app/artifacts/qa/`에 보존한다.

- `production-20260912-before.txt`: 전환 전 운영 배포·alias.
- `production-20260912-promote.log`, `production-20260912-deployment.txt`: promote 및 production Ready·alias 확인.
- `production-20260912-http.json`: 운영 URL 응답·CSP·canonical.
- `production-20260912-mobile.log`와 같은 이름 디렉터리: 지도 모바일 검사·trace·runtime·캡처.
- `production-20260912-identity-safety.log`와 같은 이름 디렉터리: 신원·연령·지갑 샘플 안전 경계 검사.
- `production-20260912-contracts.log`: 문서 동기화 포함 계약 테스트 800개 통과.

복구가 필요하면 이전 운영 deployment **`dpl_35p7faUd9DSFYDjge8dZjDu4b1HT`** (`ondo-dpkdodbor-jaewook-9643s-projects.vercel.app`)가 기준이다. 기존 배포를 삭제하지 않았다. 되돌리기는 사용자 데이터/원장 삭제가 아니라 Vercel 운영 deployment 전환으로 수행한다.

개발 착수: [시작 문서](./DEVELOPER_START_HERE.md) → [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md) / [BE 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md) / [기술 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md).
