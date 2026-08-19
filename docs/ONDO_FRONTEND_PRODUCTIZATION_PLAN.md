# ONDO 프론트엔드 제품화 마스터 플랜

상태: `HISTORICAL PLAN · FINAL B IMPLEMENTED`

최종 제품·검수 정본은 [ONDO B Index](./ondo-baljajwi/00_INDEX.md)와 [원요구 최종 감사](./ondo-baljajwi/06_FINAL_REQUIREMENTS_AUDIT.md)다.

## 목표

외국인이 한국 지명을 몰라도 식음료 열기를 발견하고, 필요한 행동에서만 Account·Person·19+·Payment KYC를 거쳐 원래 행동으로 복귀하는 responsive web demo를 만든다.

## 제품 구조

1. Guest onboarding과 서울·부산 F&B discovery.
2. 공식 장소 원장과 simulated ONDO signal을 분리한 지도·목록·상세.
3. After19, Tables·chat·photo·feedback, Local Signal, checkout, reputation·stamp.
4. Identity와 Labs에서 CX/Residence/passport, zkLogin, 자산·bridge, evidence/trait 가설을 정직하게 시뮬레이션.

## 실행 구조

- Root: shell, shared state/contracts, route, integration, durable evidence.
- Map: 400 장소, MapLibre, heat/fallback/place.
- Identity: onboarding, Account/Person/Age/Payment separation, After19, profile.
- Connect: Tables/chat/photo/feedback, checkout, Labs, reputation/stamp.
- 각 slice는 public entry와 frozen contract로만 연결하고 shared 변경은 CCR로만 수행한다.

## 완료 Gate

- 19/19 REQ, 18/18 Flow, `GAP=0`.
- build/typecheck/contracts/flow/content/a11y/pixel/runtime 통과.
- 44 states × mobile/desktop.
- 다섯 독립 역할의 actionable S0/S1/S2=0 clean round 두 번.
- 외부 receipt 없는 기능은 simulation/contract/deferred 표기를 유지한다.
