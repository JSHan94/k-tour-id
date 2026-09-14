# ONDO Toss-grade UX specification set

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY · 2026-09-04`

이 디렉터리는 구현 전 합의용 UX 설계 계약이다. `토스급`은 Toss의 공식
승인이나 Toss Design System의 복제를 뜻하지 않는다. 공개된 Toss 제품 원칙의
핵심인 빠른 이해, 한 화면 한 결정, 명확한 CTA, 낮은 작업 비용, 맥락 연속성,
패턴화와 접근성을 ONDO에 맞춘 내부 품질 기준을 뜻한다.

## 산출물 구조

- [00_OVERVIEW.md](./00_OVERVIEW.md): 전체 제품 변화, 우선순위, 의존성과 실행 파동
- [00_UX_STANDARD.md](./00_UX_STANDARD.md): 모든 화면이 공유하는 모바일 UX·비주얼·모션 규격
- [00_PRD_PRESERVATION_LEDGER.md](./00_PRD_PRESERVATION_LEDGER.md): 기능·상태·truth·returnTo 삭제 방지 원장
- [00_FEEDBACK_TRACE.md](./00_FEEDBACK_TRACE.md): 사용자 피드백을 Flow·교차 화면·검수 증거에 연결
- `FL-001`~`FL-018`: 정규 Flow별 구현 가능한 상세 명세
- [X-01](./X-01_APP_SHELL_NAVIGATION.md)~[X-04](./X-04_LOADING_MOTION_RESPONSIVE.md):
  Flow ID 하나로 귀속되지 않는 앱 셸, Settings, 일본/제주 editorial,
  loading/error/responsive 교차 화면 명세
- [_reviews/](./_reviews/): 세 디자이너의 독립 감사, 교차 반박과
  [단일 합의](./_reviews/CONSENSUS_RESOLUTION.md)

## 정본 우선순위

문서가 충돌하면 아래 순서를 따른다.

1. `docs/ondo-execution/01_PRD_9H.md`
2. `docs/ondo-execution/03_FLOW_CATALOG.md`
3. `docs/ondo-execution/04_STATE_MODEL.md`
4. `docs/ondo-execution/02_DECISION_LEDGER.md`
5. 이 디렉터리의 합의 명세
6. 현재 구현과 기존 visual spec

UX 개선안은 상위 정본의 기능, 상태, 개인정보 경계, 실행 truth 또는 정확한
복귀 계약을 삭제하거나 암묵적으로 합칠 수 없다. 충돌이 발견되면 디자인 문서를
수정하고 PRD를 조용히 덮어쓰지 않는다.

## 합의 절차

1. D1 제품 단순성, D2 시각·인터랙션, D3 신뢰·접근성 관점에서 18개 Flow를
   각각 독립 감사한다.
2. 세 리뷰어가 다른 두 독립안을 반박하고 충돌 목록을 만든다.
3. 공통 원칙과 Flow별 단일 권장안을 확정한다.
4. Flow 문서를 나누어 작성하되 동일 템플릿과 합의 규격을 쓴다.
5. 작성자가 아닌 리뷰어가 각 문서를 교차 검수한다.
6. 마지막으로 PRD requirement·state·fixture·mobile viewport 추적성을 기계적으로
   검사한다.

독립 감사, 교차 반박, 18개 Flow 작성과 비작성자 교차 검수까지 완료됐다.
`IMPLEMENTATION READY`는 코드 구현이 끝났다는 뜻이 아니라, 구현자가 새로운 제품
결정을 만들지 않아도 될 정도로 설계 계약이 닫혔다는 뜻이다.

## 이번 단계의 완료 정의

- 18개 정규 Flow에 각각 하나의 상세 MD가 있다.
- Settings 등 나머지 화면도 교차 명세에서 빠짐없이 다룬다.
- 각 Flow에 현재 문제, 목표 경험, 모바일 시퀀스, 보이는 정보, 접히는 정보,
  상태·실패·복귀, 모션, 접근성, PRD 보존 원장과 acceptance criteria가 있다.
- `00_OVERVIEW.md`에서 모든 Flow와 교차 화면의 변화 및 구현 순서를 한 번에
  확인할 수 있다.
- 구현 변경은 이 문서 세트가 승인된 다음 별도 단계에서 시작한다.
