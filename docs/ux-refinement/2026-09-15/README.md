# K-Tour ID UX 실행 기록 · 2026-09-15

상태: **기존 흐름 개선·운영 배포·한정 검수 완료; UX-08은 9/15 사용자 승인 후 구현·검수 중**. 기존 완료 증거의 기준선은 `b9cdc42`, 앱 소스 `505e475`, 작업 브랜치 `ux/flow-refinement-20260915`다. 새 작업은 `feat/ktour-experience-share-20260915`에서 진행한다. [릴리스 요약·현재 검수 결과](./RELEASE.md) · [체험 목업 인계](../../EXPERIENCE_MOCK_HANDOFF_2026-09-15.md) · [승인된 실행 계획](../../UX_REFINEMENT_EXECUTION_PLAN_2026-09-15.md).

기존 묶음은 별도 브랜치에서 조사·합의·수정·검수 후 main/Harvey를 정상 fast-forward했다. Sumsub 실험은 변경하지 않았다. 그 완료 증거에 후속 UX-08·미승인 콘텐츠·실연동은 포함하지 않는다.

## 작업 보드

| 작업 | 담당 역할 | 상태 | 산출물 |
|---|---|---|---|
| 코드 기반 전체 여정 지도 | 독립 mapper A | 첫 목록·교차 보정 완료 | sitemap-code.json / .md: 78 semantic nodes, 264 transition rows |
| 실제 화면 기반 여정 지도 | 독립 mapper B | 초기 관찰·온보딩·코드 차이 교차 판정 완료 | sitemap-browser.json / .md: 40 초기 관찰 + 12 온보딩 관찰, 후속 검수 별도 |
| 실제 사진·신규 장소 후보 | 콘텐츠/권리 조사 | 12 후보·8 미디어 기록, 승인 사진 2장·장소 1곳 적용; 나머지 보류 | content-research.md, content-candidates.json, media-manifest.json |
| PRD 대조·통합 규칙 | 조정자 | 보호 규칙 고정, 변경별 재검토 | preservation.md |
| 두 지도 교차 반박·registry | mapper A/B + 조정자 | CODE-01–12 교차 판정 기록 | sitemap-code.md / sitemap-browser.md |
| 독립 UX 3역할 평가·합의 | 발견 / 거래 / 시각 | 기존 묶음 한정 합의 완료. 당시 보류한 UX-08은 사용자 후속 승인; 새 반례 검수 대기 | decisions.md와 ux-review-*.md |
| 대표 화면·구현 묶음 | 파일별 소유자 | UX-01/02/03/05/06/07/09 + CODE-06 구현·한정 검수 완료 | 최종 로컬 핵심14·기존 회귀33·desktop After19 1 PASS, 상세 경계는 RELEASE |
| 비작성자 반례 검수 | 독립 검수자 | 거래 귀속·3종 장소 복귀·펼침 상태 확인, artifact별 범위 기록 | adversarial-*-wave1.md, adversarial-root-wave2.md |
| Preview·문서 동기화·운영 판정 | 조정자 | 앱505e475 Ready, main/Harvey 동기화 | 운영 대표 주소24/24 PASS, RELEASE 및 배포·인계 기록 |
| UX-08 비금전 체험 후속 묶음 | 구현자 / 독립 검수자 / 조정자 | 사용자 승인, 구현·검수 중. 기존 결과 상속 없음 | EXPERIENCE_MOCK_HANDOFF_2026-09-15.md, 새 sitemap 보충·검수 결과는 동결 후 연결 |

## 재개 지점

- mapper A/B는 서로의 목록을 읽기 전 첫 목록을 고정했다. 현재는 교차 반박·회귀 검수 단계다.
- 현재 앱 동작에 대한 이전 PASS를 이번 브라우저 검수로 이월하지 않는다.
- 새 질문·결정은 해당 묶음에 연결한다. 기능 삭제, 외부 연동 확대, 권리/계정이 필요한 경우 사용자에게 질문한다.
- 앱 공통 모델·스타일은 조정자가 변경 소유자를 정한 뒤에만 수정한다.

## 완료 표현의 경계

위 node/transition 수는 기존 묶음의 코드 구조 목록이지 모든 화면의 실제 실행 PASS 수가 아니다. 새 UX-08을 아직 재계수하지 않았으며 이후 보충 표와 초기 수치를 구분한다. 계약 검사는 847개 기준선에서 시작했고 소스별 검사 수·결과는 릴리스 기록에 별도로 고정한다. 중간 artifact의 PASS를 추가 변경 후 결과로 이월하지 않는다. 실제 SDK/API 연결, 실제 결제·예약, 물리 기기의 카메라·앱 복귀는 이 UX 결과에 포함하지 않는다. 승인된 비금전 AI/Sui 전용 목업도 실제 인증·AI·두 체인 연동의 증거가 아니다.
