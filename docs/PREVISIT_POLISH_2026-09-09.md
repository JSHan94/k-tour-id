# Before you go · 카드 마감 수정

2026-09-09 사용자 캡처에서 발견한 중복 가로선·아이콘 정렬 문제.

- 원인: 은퇴한 `.before > div`, `.before > div span`, `.beforeContent > div` 규칙이 새 카드 그리드와 내부 아이콘/상태 배지에도 적용됐다. 어두운 테마에서도 밝은 구분선이 남고, grid 중앙 정렬이 flex/space-between에 덮였다.
- 수정: 위 legacy 규칙 제거, 현재 그리드/행의 border 명시 초기화, 제목 여백 정리. 개별 카드 테두리는 보존했다. 모바일에서 다음 After19 카드의 -4px 음수 여백도 정상 간격으로 수정했다.
- 사실값·unknown 표시·접근성 이름·근거 열기/닫기·DID/온도 로직은 변경하지 않았다.
- 기존 빌드에서 신규 1440px dark 회귀 검사가 **실패**하는 것을 먼저 확인했다 (`gridBorder: 1px`, 기대 0px).
- 수정 후 production 빌드·artifact scan·typecheck PASS. 계약 검사 749/749 PASS.
- 최종 production 브라우저 **12/12 PASS**: 기존 압축/접근성 검사 4개와 신규 8개. 320/390/430/768/1440px, light/dark 실제 적용, EN/KO/JA, 중복 선 0px·카드 선 유지·SVG/배지 중심 오차 ≤1px·모바일 다음 카드 간격 ≥8px·근거창/포커스 복귀를 확인했다.
- 로그: `k-tour-id-app/artifacts/qa/previsit-{before,after,contracts,build,typecheck}.log`. 캡처: `artifacts/qa/previsit-polish-20260909/`.

## 공개 프리뷰 검수

- 배포 소스: `5425804`.
- URL: https://ondo-zgtm7pqd4-jaewook-9643s-projects.vercel.app
- Vercel: `dpl_95pAxRsGKcuhoWYsP6Wd19ATFzJq`, **Ready**, preview. 기존 production alias는 변경하지 않았다.
- 동일 브라우저 검사 **12/12 PASS**. 공개 배포의 실제 장소 API와 상세 페이지에서 확인했다. 이 카드 검사와 무관한 외부 지도 타일 요청만 차단했다.
- 로그: `k-tour-id-app/artifacts/qa/previsit-public.log`.
- iOS Safari 실기기 검증은 포함하지 않았다.
