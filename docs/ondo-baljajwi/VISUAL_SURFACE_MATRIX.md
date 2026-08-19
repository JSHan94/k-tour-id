# ONDO 발자취형 Surface Matrix

이 표는 `FL-001`–`FL-018`에 새 시각 언어가 도달하는 위치를 표시한다. 이 브랜치는 비지도 surface만 소유하므로 Map/Place/App shell은 Root의 A 브랜치에서 처리한다.

| Flow | 주요 surface | B 적용 | A/기존 의존 | 유지해야 할 경계 |
|---|---|---:|---|---|
| FL-001 Guest Discover | 지도, 온보딩 | 온보딩 | 지도/셸 | Guest 즉시 탐색, 자동 인증 금지 |
| FL-002 Short-term KYC → After19 | JIT Gate, After19 | 적용 | 지도 | Account→Person→Age, 원 `returnTo` |
| FL-003 Table → Image Chat → Feedback | Tables, chat, media | 적용 | 공통 Sheet | membership 전 direct chat 금지 |
| FL-004 Checkout/Labs → Stamp | Checkout, Labs, My | 적용 | Place 진입 | payment≠visit, unique visit 뒤 stamp |
| FL-005 Korean CX | Identity | 적용 | 공통 provider | CX는 미리보기, 자동 실행 금지 |
| FL-006 Residence Card | Identity | 적용 | 공통 provider | unsupported/passport alternate |
| FL-007 Onboarding Value | Onboarding | 적용 | App 진입 | finish/skip/failure 모두 map 복귀 |
| FL-008 Persona Intent | Onboarding | 적용 | 상태 계약 | 3 persona 선택, 행동 삭제 금지 |
| FL-009 Preferences | Onboarding | 적용 | 상태 계약 | 빈 기본값/기존값 보존 |
| FL-010 Save Place | My saved list | 적용 | Place CTA | Account gate 뒤 원 목적 복귀 |
| FL-011 Save Journey | My | 적용 | Journey | Account gate와 저장 결과 분리 |
| FL-012 Local Signal + Photo | Connect, media | 적용 | Place | chat image/meetup/stamp와 분리 |
| FL-013 Table Discovery | Tables | 적용 | Map/Place entry | available/full/closed 상태 유지 |
| FL-014 Table Membership | Table sheet | 적용 | 공통 Sheet | join/cancel/fail/return 완결 |
| FL-015 Account/Person Verification | Identity/Profile | 적용 | 공통 gate state | self-declared와 verified 분리 |
| FL-016 Age Proof/After19 | After19, Identity | 적용 | KST/세션 state | 4 guard와 manual-off 유지 |
| FL-017 Payment KYC/Checkout | Identity, Checkout | 적용 | provider contract | Age proof와 Payment KYC 분리 |
| FL-018 Profile/Reputation | Profile, Trust | 적용 | 중앙 state | 언어 opt-in 전 비공개 |

## 상태별 시각 검수

| 상태 | 원칙 |
|---|---|
| Success | 초록은 결과 문구/선에만 사용하고 카드 전체 채움은 피한다. |
| Cancel | 중립 secondary로 유지하며 이전 화면의 `returnTo`를 보존한다. |
| Failure | 붉은 hairline과 문구를 사용하고 retry hit target은 44px 이상이다. |
| Pending | 중립 점/문구를 사용하며 열기색을 쓰지 않는다. |
| Preview/Simulated | 12px truth copy를 유지하고 decorative badge 반복을 제거한다. |
| Unsupported | 대체 경로를 같은 정보 위계에 노출하고 disabled처럼 숨기지 않는다. |

## 완료 기준

- 비지도 surface의 사용자 가시 텍스트가 12px 미만이 아니다.
- 모든 클릭/터치 제어가 44px 이상이다.
- 비지도 CSS의 장식용 그림자가 0개다.
- 열기 팔레트가 비지도 장식에 쓰이지 않는다.
- KO/EN 긴 문구가 390px에서 잘리지 않는다.
- 430px와 desktop에서 시트/문서 읽기 폭이 과도하게 넓어지지 않는다.
