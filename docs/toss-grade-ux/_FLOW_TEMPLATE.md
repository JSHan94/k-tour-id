# FL-NNN · Flow title

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION READY`

## 1. Flow contract

| 항목 | 값 |
|---|---|
| 연결 요구 | `REQ-NNN` |
| 진입 행동 |  |
| 성공 결과 |  |
| 취소 결과 |  |
| 실패·재시도 |  |
| 정확한 복귀 |  |
| 실행 truth |  |

### 삭제할 수 없는 PRD 불변식

-

## 2. 현재 경험 진단

| 문제 | 사용자 영향 | 심각도 | 근거 화면·상태 |
|---|---|---|---|
|  |  |  |  |

## 3. 목표 경험

### 한 문장 약속

>

### 사용자가 1초 안에 알아야 하는 것

-

### 사용자가 읽지 않아도 알아야 하는 것

-

## 4. 권장 모바일 여정

```text
ENTRY
→ DECISION
→ PENDING
→ SUCCESS | CANCEL | FAILURE
→ RETURN
```

| 단계 | 화면의 한 가지 질문 | 주 시각 객체 | 주 행동 | 보존 context |
|---|---|---|---|---|
| Entry |  |  |  |  |

## 5. 화면별 상세 규격

### Screen/Sheet A

**목적**

-

**첫 viewport에 보이는 것**

-

**시각·인터랙션**

-

**행동**

- Primary:
- Secondary:
- Close/Back:

**정보 배치**

| 처리 | 정보 |
|---|---|
| 항상 표시 |  |
| 시각화 |  |
| 한 번 접기 |  |
| Labs/개발 문서로 이동 |  |
| 삭제 |  |

## 6. 상태·오류·복귀

| 상태 | 보이는 변화 | 가능한 행동 | 데이터·맥락 불변식 |
|---|---|---|---|
| Loading |  |  |  |
| Empty |  |  |  |
| Failure |  |  |  |
| Retry |  |  |  |
| Cancel |  |  |  |
| Success |  |  |  |
| Return |  |  |  |

## 7. Motion choreography

| 전이 | duration/easing | 공간 규칙 | reduced motion |
|---|---|---|---|
|  |  |  |  |

## 8. Copy·localization

| 역할 | KO | EN | JA | 규칙 |
|---|---|---|---|---|
| Title |  |  |  |  |
| Primary CTA |  |  |  |  |

- provider·network·architecture 명칭은 결정에 필요할 때만 보인다.
- 제품 truth를 숨기지 않되 제작자 관점의 `preview`, `simulated`, `test`는 일반
  화면 제목·CTA에 쓰지 않는다. 오해가 생기는 결정점에서는 실제 가능한 사건을
  한 줄로 설명한다.

## 9. Accessibility·responsive

- 320, 360, 390, 430px portrait에서 horizontal overflow 0.
- 844×390 short landscape에서 heading·primary CTA·close에 도달 가능.
- 모든 target 44×44px 이상, icon-only control에는 지역화된 accessible name.
- 200% text zoom, VoiceOver/TalkBack 순서, keyboard focus restore를 검증한다.
- 색과 모션이 없어도 같은 결정을 내릴 수 있다.

## 10. 계측·완료 기준

### UX signal

-

### Acceptance criteria

- [ ] `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN` 계약이 유지된다.
- [ ] 첫 viewport에 질문 하나, primary CTA 하나만 경쟁한다.
- [ ] 문장을 없앤 자리에 상태·구조·시각 단서가 실제로 생겼다.
- [ ] PRD 기능·상태·truth·복귀가 삭제되거나 합쳐지지 않았다.
- [ ] KO/EN/JA와 필수 viewport의 수동·자동 검수를 통과한다.

## 11. PRD preservation ledger

| 보존 대상 | 현재 연결 | 개선 후 연결 | 검증 |
|---|---|---|---|
| REQ |  |  |  |
| State |  |  |  |
| Fixture |  |  |  |
| returnTo |  |  |  |
| Persistence |  |  |  |

## 12. 세 디자이너 합의 기록

| 관점 | 제안 | 최종 반영 |
|---|---|---|
| D1 제품 단순성 |  |  |
| D2 시각·인터랙션 |  |  |
| D3 신뢰·접근성 |  |  |

잔여 이견: `없음` 또는 명시.
