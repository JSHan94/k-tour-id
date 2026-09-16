# Root wave 1 · 독립 반례 코드 검토

2026-09-15 · 대상: `b9cdc42` 위 미커밋 root 변경 · **정적 검토, 브라우저/배포 합격 아님**.

범위: FoodPhotoB, researched-food media/credit/Onion Anguk 데이터, PlacePeekActionsB 및 canonical/editorial 호출부·CSS, traveler activity Sample 11px. 런타임 파일 수정이나 실제 provider/금융 요청은 하지 않았다. 사진 권리 심사는 콘텐츠 담당 승인에 의존하며 이 검토가 법적 허락을 새로 인증하지 않는다.

## 판정

현재 diff에서 새로운 자격·금액·제휴 권한 부여나 잘못된 매장 ID 전달은 발견하지 못했다. **아래 정확한 왕복·시각 검수 전 운영 승인 아님.**

| 항목 | 확인 결과 / 위험 | 조치 / 검사 |
|---|---|---|
| 서비스 capability | `place-service-actions-b.tsx:22–35`: review sample + explicit resolveCommercePlaceB + commerce/reservation 존재일 때만 CTA. 사진/연구 존재를 runtime capability로 추정하지 않음 | 등록 canonical/editorial 각 1개, 미등록 각 1개, review=0에서 CTA 없음 확인 |
| 매장/거래 진입 | 새 CTA는 capturePlaceServiceMapReturnB(place.id) 후 기존 action 사용. canonical은 beginFinalDismiss 보호를 유지하고 open 실패 시 exit guard 복원(`canonical-place-overlay.tsx:984`) | 다른 주문 pending 때문에 open 거절될 때 원 peek가 살아 있고 notification/Details/close가 조작 가능해야 함 |
| 복귀/focus | 기존 `map-entry-b.tsx:3055–3116`가 camera/list/history를 캡처하며 return event는 전역 `[data-place-service='offer']`를 focus. 새 peek에도 같은 selector가 생겼음 | **미확정 회귀 위험**: peek→offer→cancel/receipt에서 같은 peek+같은 ID+실제 새 CTA focus인지 검사. detail origin이 peek로 축약되면 안 됨. canonical/editorial 각각 |
| primary 의미 | 검토 시 canonical Details React element는 data-visual-priority=primary를 유지해 새 서비스와 metadata상 둘 다 primary였다. CSS는 last-child를 secondary로 만든다 | root가 metadata 정리 중이라고 전달함. 최종 렌더는 service=primary, Details=secondary인지 확인. 시각/테스트 selector 의미 일치 |
| directions/기능 손실 | 지원 peek는 서비스+Details 2개, 미지원은 기존 Details/Directions 순서. 길찾기는 full detail에 계속 존재. 혜택/예약도 상세에 유지 | 320px/JA에서 CTA 줄 넘침·44px·Details 접근 확인; supporting registry 밖 서비스 생성 금지 |
| 실제 사진 vs 예시 | `researchFoodMediaB`는 승인용 local /media/venues/ 경로+alt가 있을 때만 photograph, 기본 illustration 흐름 유지. photo URL은 hotlink하지 않음. Onion ID/좌표/capability는 변경 안 함 | asset contract에서 정확한 ID/로컬 파일/3언어 nonempty alt/credit/source/license/게시일을 검사. prefix 검사는 runtime 권리 인증기가 아니므로 manifest gate 필수 |
| 이미지 실패 | FoodPhotoB는 실패한 URI를 기억하고 텍스트+aria-label fallback. 실패 시 매장 사진/음식 예시 caption 숨김; 다른 매장/임의 사진으로 대체하지 않음 | 이미지를 abort한 상태에서 identity, 서비스 CTA, 바닥 버튼 유지. 오류 텍스트 320px compact thumbnail에서 overflow 없는지 확인 |
| photo credit | 연구 detail에 촬영 당시 사진이라는 한계, 크레딧·원본·라이선스 링크가 있음. 카드 figure 안 링크를 넣지 않아 nested interactive를 만들지 않음 | local photo render 여부와 credit disclosure 조건이 동일한지 테스트. 현재 한 asset의 metadata는 맞지만 향후 malformed photo를 자동 승인하면 안 됨 |
| 모션 | activity CSS의 Sample font 8→11px만 변경. timer/event/state/좌표는 그대로 | pause/reduced-motion/도시 변경 기능 회귀 없고 말풍선 폭 증가가 지도 주변/상단/타임라인을 가리지 않는지 visual 확인 |
| 공통 컴포넌트 영향 | FoodPhotoB는 research card/detail뿐 아니라 canonical compact image에도 사용됨. loading=lazy와 새 오류 텍스트/caption 11px가 모두 적용됨 | Onion만 보지 말고 canonical 작은 peek 썸네일에서 loading/오류/긴 JA도 검사 |

## 최소 실행 시나리오 제안

1. **Registered canonical**: 쿼리/카메라를 가진 지도 또는 list → peek → 서비스 → 취소 → 동일 ID/peek/원 위치/focus. 이후 Details→offer→취소는 expanded detail을 유지.
2. **Registered editorial**: 같은 왕복 + unsupported editorial은 서비스 없고 Directions/Details 그대로. review=0는 새 CTA 미표시.
3. **Failing open**: 기존 unresolved payment 상태에서 다른 장소 peek 서비스 요청 → 원 장소가 닫히거나 먹통 되지 않고 기존 작업 안내. 새로운 결제/보류 생성 없음. 금융 authority를 테스트 편의로 임의 seed하지 말고 기존 mock UI로 도달.
4. **Photo identity**: Onion Anguk 연구 카드와 detail만 실제 사진; 나머지 음식 illustration/category는 라벨 유지. 원본 URL 요청이 없는지 확인.
5. **Photo failure & layout**: 승인된 local asset만 요청 abort → 읽을 수 있는 fallback + 서비스/credit/close 조작. 320px EN/JA, light/dark 및 canonical compact card. 로딩으로 높이가 튀거나 CTA가 가려지지 않음.
6. **Activity**: 기존 동일 painted frame 상태에서 pause/도시 전환/reduced motion; Sample이 11px 이상이고 타깃/포커스가 안정.

본문은 구현 검토 중간 상태다. root의 metadata/test 수정 후 재확인하고, 실제 UI 증거와 함께 최종 판정을 붙인다.

