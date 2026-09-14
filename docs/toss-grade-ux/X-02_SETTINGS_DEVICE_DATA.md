# X-02 · Settings, language, preferences, device data

상태: `CROSS-FLOW SPEC · PEER-REVIEWED · IMPLEMENTATION READY`

## 1. 화면의 한 문장

> 설정은 언어·탐색 취향·이 기기의 데이터를 조용히 바꾸는 곳이다.

페이지 제목은 `설정 / Settings / 設定`이다. `On this device`는 제목·eyebrow가
아니며 저장 범위를 알아야 하는 데이터 행의 상세에만 둔다.

## 2. 첫 viewport

390×844에서 아래 세 row의 제목과 현재 상태가 보인다.

1. 언어 — 현재 선택된 값 하나(예: `한국어`)
2. 탐색 취향 — 선택 수 또는 대표 2개
3. 개인정보·데이터 — 저장된 범주 수(예: `3개 항목`)

큰 intro 문장, 큰 언어 card, 중첩 card, 제품 설명은 두지 않는다. 각 row는 icon,
label, current value, chevron/toggle만 갖는다.

## 3. Language

- row tap 시 compact selection sheet를 연다.
- 세 언어는 자기 표기로 쓴다: `한국어`, `English`, `日本語`.
- 선택 즉시 전체 앱 copy, `document.lang`, accessible names를 바꾸되 현재 route,
  scroll, query, filter, selected place, open disclosure를 유지한다.
- confirmation modal을 띄우지 않는다. 저장 실패 시 이전 언어를 유지하고 row 아래
  `언어를 바꾸지 못했어요 · 다시 시도`를 표시한다.
- 번역되지 않은 핵심 CTA를 영어 fallback으로 조용히 노출하지 않는다.

## 4. Discovery preferences

### 기본 row

- 대표 선택 최대 2개를 icon/chip으로 보여주고 나머지는 `+N`으로 표현한다.
- 취향이 0개면 `모두 보기` 상태이며 오류나 미완료로 취급하지 않는다.

### 편집 sheet

- 음식, 분위기, 시간대, 식이 요구를 의미별 section으로 나눈다.
- 한 chip의 label은 모바일에서 최대 2줄이며 hit area 44px 이상이다.
- 선택은 실제 map/list ranking·highlight를 바꿔야 한다.
- 공식 지원 여부를 확인하지 못한 식이 조건은 장소를 숨기지 않고 `확인 필요`
  fact를 보여준다.
- `저장`은 선택 변화가 있을 때만 활성화하고 성공하면 같은 Settings row로 복귀한다.
- `처음 설정 다시 하기`는 취향 편집과 분리된 secondary disclosure다. 저장 장소,
  visit, Table, notes를 지우지 않는다.

## 5. Privacy & data

기본 row는 저장된 범주 수만 보여준다. 탭한 detail의 범위 문장에만
`이 기기에만 저장`을 한 번 두고 아래 상태 묶음을 보여준다.

| 범주 | 보이는 요약 | 세부에서만 |
|---|---|---|
| 발견 | 저장 장소·최근 본 장소·취향 | item count와 마지막 변경 |
| 함께 먹기 | 참여 Table·draft·local signals | 각 local-only 범위 |
| ID | Account, Person, 19+, Payment의 독립 상태 | provider, expiry, consent log |
| 여행 잔액 | 준비 상태·기록 존재 여부 | ticker/network/fixture truth |
| 앱 설정 | 언어·After19 preference | 저장 key/architecture 제외 |

`Account`, `Person`, `19+`, `Payment`를 하나의 `verified` 행으로 합치지 않는다.

## 6. Clear/reset

### 가벼운 reset

- `탐색 취향 초기화`: 취향만 기본값으로 되돌린다.
- `처음 설정 다시 하기`: onboarding state와 취향을 다시 묻되 저장·활동은 유지한다.

### 저장 내용 삭제

- destructive action은 Settings detail의 마지막에 분리한다.
- confirmation은 실제 삭제 범주를 짧은 grouped list로 보여주고, 유지되는 항목도 한
  줄로 말한다.
- primary는 neutral `유지`, destructive는 red text/button `저장 내용 삭제`다.
- 삭제 실패 시 confirmation을 닫지 않고 retry를 제공한다.
- 삭제 성공 시 toast와 함께 Settings root로 돌아가고 focus는 data row로 복귀한다.

긴 한 문단에 모든 삭제 key를 나열하지 않는다. screen reader에는 동일한 grouped
범주를 list semantics로 제공한다.

## 7. 화면별 정보 처리

| 처리 | 정보 |
|---|---|
| 항상 표시 | row label, 현재 값, destructive action 이름 |
| 시각화 | 선택 chip, 상태 icon, category group |
| 한 번 접기 | 저장 범위, 각 ID axis, reset의 유지 범위 |
| Labs/개발 문서 | storage key, fixture ID, adapter, network |
| 삭제 | `On this device Settings` eyebrow, 반복 lead, 제작자 설명 |

## 8. States

| 상태 | 보이는 변화 | recovery | 불변식 |
|---|---|---|---|
| Loading | 기존 값 유지 + 해당 row progress | 기다림/취소 | 다른 row 조작 가능 |
| Save failure | row 아래 한 줄 error | 다시 시도 | 이전 값 유지 |
| Clear pending | confirmation action progress | 취소 불가 시 명시 | 중복 실행 차단 |
| Clear failure | dialog 내 error | 다시 시도/유지 | 데이터 불변 |
| Clear success | root values reset + toast | 계속 사용 | language/travel intent는 계약대로 유지 |
| Storage unavailable | data row unavailable | browser setting 안내 | 탐색은 계속 가능 |

## 9. Motion

- Settings root row는 scroll 진입 animation을 쓰지 않는다.
- selection sheet 220–280ms, row value replace 160–200ms.
- destructive dialog는 scale이 아닌 opacity+short translate를 사용해 경고를 장난스럽게
  보이지 않게 한다.
- reduced motion은 공간 이동 없이 즉시 상태를 교체한다.

## 10. Accessibility·responsive

- row 전체가 하나의 button이되 내부에 중첩 button을 두지 않는다.
- 모든 row·sheet action은 기본 48px, 절대 최소 44px hit area를 갖는다.
- language selection은 현재 항목을 `aria-checked`로 알린다.
- destructive dialog는 initial focus를 `유지`에 두고 focus trap/Escape/restore를
  제공한다.
- 320px에서 title, 세 row, 첫 action이 horizontal overflow 없이 보인다.
- 200% zoom에서는 값이 다음 줄로 내려갈 수 있으나 label·value·chevron 순서는
  유지된다.
- KO/EN/JA 최장 delete copy를 430px와 320px에서 검증한다.

| 역할 | KO | EN | JA |
|---|---|---|---|
| Page title | 설정 | Settings | 設定 |
| Language | 언어 | Language | 言語 |
| Preferences | 탐색 취향 | Discovery preferences | 探索の好み |
| Data | 개인정보·데이터 | Privacy & data | プライバシーとデータ |
| Stored scope | 이 기기에만 저장 | Saved only on this device | この端末にのみ保存 |
| Keep | 유지 | Keep | 保持する |
| Delete | 저장 내용 삭제 | Delete saved data | 保存データを削除 |

## 11. Acceptance criteria

- [ ] language control이 첫 viewport 대부분을 차지하지 않는다.
- [ ] root에는 현재 locale 하나만 보이고 세 언어 전체는 selection sheet에서만 보인다.
- [ ] locale 변경 후 같은 screen/context가 유지된다.
- [ ] preferences가 실제 discovery 결과를 바꾸거나, 그렇지 않으면 옵션이 제거/비활성화된다.
- [ ] data detail에서 Account/Person/19+/Payment가 별도 상태다.
- [ ] 일반 화면에 storage/provider 기술 설명이 반복되지 않는다.
- [ ] `이 기기에 저장` scope는 data detail에 한 번만 있고 Settings root에는 반복되지 않는다.
- [ ] reset과 destructive clear의 범위가 서로 다르고 결과가 테스트된다.
- [ ] clear cancel/failure/success와 focus restore가 모두 정의된다.
- [ ] 320/360/390/430, 844×390, 200% zoom, KO/EN/JA에 잘림이 없다.
- [ ] 모든 row와 sheet action의 hit area가 44px 미만으로 줄지 않는다.

## 12. PRD preservation

- `REQ-005`: 독립 상태 축과 consent를 유지한다.
- `REQ-012`: After19 자동 preference와 session manual-off를 잘못 reset하지 않는다.
- `REQ-018`: 언어·responsive·접근성 범위를 유지한다.
- `FL-007`~`FL-009`: onboarding reset이 Guest map reachability를 막지 않는다.
- `FL-011`, `FL-012`, `FL-015`, `FL-018`: clear 범위와 persistence를 상태 모델대로
  유지한다.
