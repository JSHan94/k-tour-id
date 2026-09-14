# ONDO 동일 검수본 재배포 — 2026-09-12

- [새 공개 프리뷰](https://ondo-8xuzpqqfv-jaewook-9643s-projects.vercel.app)
- Vercel `ondo` · `preview` · **Ready**.
- Deployment: `dpl_5UBqY7AuN6764B2VTrvEB3pUrFsY`.
- 원본: `dpl_7nv7QZNJU5bNGKrePEi94TyK3s5q`의 검수된 source/runtime `52f376e`를 재빌드·재배포했다.
- 로컬 인계 HEAD `f88f976`와 원본의 차이는 문서·테스트뿐이며 앱·데이터·자산·빌드 설정 변경은 없다. 더 오래된 바깥 작업 디렉터리의 변경은 포함하지 않았다.
- 승인된 개인 ONDO 프로젝트와 로그인 계정을 확인했다. production 도메인, 외부 provider 연결, 실제 신원·자금 상태는 변경하지 않았다.

## 이번 새 주소의 확인 범위

| 확인 | 결과 |
|---|---|
| 원격 빌드 및 배포 상태 | Ready |
| 공개 HTTP·장소 API·redirect·legacy 404·기존 CSP | 10/10 PASS |
| 모바일 공개 여정 | 3/3 PASS · 제주320 KO dark · 부산390 EN light · 서울430 JA dark · 자동 retry0 |
| 실행 중 앱 오류 | page별 기록3개: product0 · 외부 지도/자산0 · preview toolbar 차단6개 별도 보존 |
| 개발 문서 동기화 계약 | 6/6 PASS |

모바일 검사는 실제 MapLibre ready 이후 검색·검색 초기화·옵션·필터·2.5D 전환·언어 전환·설정/이야기 복귀와 앱 runtime 오류를 확인한다. 전체 이전 QA를 새 주소에서 다시 실행한 것으로 세지 않는다. [9월 11일 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)의 기준선174개·집중27개·계약800개는 당시 URL/소스에 대한 별도 증거다. 실기기 및 실제 SDK 연동 검수의 한계도 그대로다.

## 재현 증거

경로는 `k-tour-id-app/artifacts/qa/` 기준이다.

- `redeploy-20260912.log`: 재배포 실행.
- `redeploy-20260912-inspect.txt`: ID·대상·Ready 확인.
- `redeploy-20260912-http.json`: 10개 HTTP 응답·CSP 비교.
- `redeploy-20260912-mobile.log` 및 같은 이름 디렉터리: 브라우저 실행·trace·runtime·캡처.
- `redeploy-20260912-handoff.log`: 최신 주소 안내와 기존 인계 정본의 계약 재확인.

개발자가 연결할 API/SDK·작업 ID·책임 경계는 변하지 않았다. [개발자 시작 문서](./DEVELOPER_START_HERE.md)와 [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md)을 그대로 따른다.
