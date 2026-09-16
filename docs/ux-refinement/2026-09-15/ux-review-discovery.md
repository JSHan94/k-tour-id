# 발견·정보구조 UX 독립 평가

2026-09-15 · 기준 `b9cdc42` · **제안 승인 범위이지 UI 완료 판정이 아니다.**

독립 코드 지도 first freeze 후에만 browser map, decisions, preservation, visual-standard를 읽었다. 다른 두 UX 평가문은 이 최초 평가 동결 전 읽지 않았다. 브라우저 40개 관찰은 담당자의 실제 실행 증거이며, 본 평가자는 이 단계에서 브라우저를 직접 조작하지 않았다.

## 후보별 판정

| 후보 | 판정 | 근거 / 목적 | 채택 범위와 보존 조건 | 비작성자 검사 |
|---|---|---|---|---|
| UX-01 충전 복귀 | **승인, 제한 구현** | B032→033은 Zest/₩28,000을 보존하지만 ‘Back to balance’가 주문으로 복귀한다. 결과를 예측하는 문구가 필요 | 주문은 ‘주문 확인으로 돌아가기’, Wallet은 ‘잔액으로 돌아가기’. 기존 exact context/quote 유지. 완료 영수증 재열기와 새 충전·pending 재개를 구별; 충전 직후 자동 구매 추가 금지 | 주문/Wallet origin, 부족분 충전, 만료 재견적, unknown 닫기·재열기, 별도 구매 동의 |
| UX-02 환불 통합 | **승인** | B038의 부분 환불과 legacy 전체 복원 경쟁 입구는 같은 목적을 중복한다 | 공통 패널 하나에 부분/전액 선택. ‘전액’은 최초 총액이 아닌 현재 환불 가능 잔액. 원 주문·operation ID·pending/unknown·상한을 유지 | 부분 후 남은 전액, 중복 submit, 실패 재시도, 다른 주문 전환, 원장 합계 |
| UX-03 peek 서비스 | **조건부 승인** | 코드상 canonical은 Details, editorial은 Directions 우선. 길찾기보다 앱 안에서 가능한 일을 먼저 알려야 함 | **registry 지원 매장만** 혜택/주문 primary + Details secondary 2개로 제한. Directions는 detail에 보존; 세 번째 버튼 줄 추가 금지. 미지원은 기존 Details/Directions 유지. research/category 정보를 제휴 증명으로 바꾸지 않음 | canonical/editorial/research 각각 지원/미지원, review=0, 320px 긴 JA, close/gate/receipt 동일 장소 복귀 |
| UX-04 취향 설정 | **보류 — 별도 묶음 증거 필요** | 현재 일반 취향 sheet는 이미 한 장이고, Settings의 다시 설정만 3단계 wizard다. 지도 전 강제 온보딩이 아니다 | wizard를 한 form으로 통합하는 방향은 적합. persona/area/food/dietary를 삭제하지 않고 기존값 preload·commit only on Save·실패 draft·cancel 무변경 보존. 실제 새 방문·도시에서 재설정·취소 복귀 재현 후 승인 | 현재 entry→reset→각 단계→skip/finish를 먼저 완주. 성공한 area 변경만 의도적 지도 이동 허용 |
| UX-05 거래 맥락/용어 | **조건부 승인, copy/layout 범위** | B031 Zest(주점)에 Meal이라는 범용 이름이 맞지 않으며, 매장·금액이 수단 선택 중 유지되어야 함 | neutral order/benefit heading과 매장명/금액/잔액 위계 공통화. ‘예약’, Table, funding, purchase는 합치지 않음. 새 모델/세션 수명 변경은 이번 copy 범위 밖 | 음식/카페/주점에서 명칭, 금액·혜택·잔액 구분, 동의/quote expiry, KO/JA 줄바꿈 |
| UX-06 사진 | **조건부 승인 — 권리·매장 일치 게이트** | 지금 icon/category fallback만 있는 슬롯은 실제 음식 판단에 약함 | 권리 확인된 **정확한 매장** 사진부터 작게 적용(예: Onion 후보도 지점·허락·출처 manifest 확정 후). 실제/예시를 구분. hero/card crop은 같은 음식·장소 의미 유지; 미확보는 정직한 fallback 유지 | 파일 권리·지점 매칭·credit·alt, 모바일 crop/이미지 실패, 메뉴/주문 금액을 가리지 않음 |
| UX-07 pulse | **조건부 승인 — 기존 frame 재사용** | 독립 애니메이션보다 현재 보는 시각과 선택 매장 추세가 일치해야 신뢰 가능 | 기존 painted frame/bus를 재사용하고 읽을 수 있는 Sample 유지(11px 이상 프로젝트 기준 권장). 실제 여행자 활동이라 쓰지 않음. 자동 map 이동/목록 재정렬 금지 | map→peek/list 동시 frame, pause/reduced motion/백그라운드/조작 중 안정, 대비·짧은 높이 |
| UX-08 비금전 체험 | **보류** | 전용 mock action은 current source에서 연결 확인 안 됨; 실제 해커톤 연결은 Labs bridge와 다름 | 사용자 범위 결정 + PRD guardian 승인 전 신규 flow를 임의 추가하지 않음. 승인 시 nonfinancial 목적과 server eligibility/consent/Sui/OmniOne 각각의 상태 보존 | 별도 요구/상태/오류/return 계약 및 세 역할 재검토 |
| UX-09 wallet/funding 문구 | **승인, 목적/문구 제한** | B020 empty 약속→B021 ₩60,000; 잔액 있어도 ‘먼저 충전’; top-up에서 결제 방법/내 잔액 선택 혼동 | seed/원장 변경 없이 현재 상태를 설명. ‘충전 방법’과 ‘결제 방법’을 분리, 자기 잔액을 충전원처럼 표현하지 않음. 구매 내역만 보여주는 영역이면 충전이력 없는 이유를 정직하게 명명 | 빈/충분/부족 잔액, existing settled receipt vs new funding, 3언어, 동의·수령 금액·수수료 불변 |

## 취향 설정의 정확한 맥락 위험

- 지도 preferences 아이콘/Options는 Settings **탭**으로 이동한다: `map-entry-b.tsx:3325,3456,3749`. 즉시 wizard가 뜨는 것이 아니다.
- 일반 Preferences는 한 sheet의 draft/save이고, Restart는 `beginOnboarding()`: `settings-entry-b.tsx:151–163,220`.
- 시작 시 `requestBDiscoveryFocus({city:null})`, cancel도 resetMap: `official-directory-onboarding.tsx:43–60`. state provider는 begin/cancel 모두 tab=ondo/surface=map: `ondo-b-provider.tsx:1213–1230`.
- map effect는 IN-PROGRESS에서 기존 discovery history를 nation/query-empty/category-all/listScroll0으로 교체: `map-entry-b.tsx:1683–1702`. **따라서 취소는 취향 값을 보존해도 이전 도시/검색/스크롤을 보존한다는 보장은 없다.**
- save도 실제 persistence 성공 전에 선택 도시 focus를 먼저 요청한다: `official-directory-onboarding.tsx:66–76`. 저장 실패 시 원본 취향은 유지되지만 지도 preview/return은 별도 검증 대상이다.

권장 설계: 일반 취향 편집과 전체 설정을 같은 원칙의 draft form으로 두고, 화면 진입 자체로 discovery history를 지우지 않는다. 취소는 캡처한 origin context로, 성공 Save에서만 사용자가 선택한 area 이동을 적용한다. 이 변경은 source/return 모델 영향이 있으므로 UX01/02/09의 좁은 수정과 묶어 몰래 구현하지 않는다.

## 기능 손실 / 검토 경계

없애는 것은 반복 질문을 넘기는 Next와 중복 환불 입구 후보이지 자격·승인·금액확인·취소·unknown 상태가 아니다. 위의 조건부 승인 항목은 각 조건과 비작성자 검사를 충족해야만 구현 완료/배포 승인으로 바뀐다. 전체 78 코드 노드가 실행됐거나 UI가 완벽하다는 의미는 아니다.

## 독립 평가 동결 후 반대 검토 / 최종 제한 합의

두 UX 문서 및 별도 optional-onboarding 12관찰을 추가로 읽었다. 실제 6개 wizard action(진입 포함 9개)은 목적/지역/취향을 각각 묻고 동일 질문 반복이 아니었다. 임시 nation preview 이후 취소하면 URL은 Busan으로 돌아오고 저장 café 선택도 유지된다. 따라서 **UX04는 재설계/단계 삭제 승인하지 않고 유지**한다. 위의 city-null 정적 위험은 exact camera/query/list-scroll가 아직 측정되지 않았다는 후속 검사 과제이지, 최종 도시 복귀 손실의 확인된 버그가 아니다.

최종 제한 합의: UX01/02/09와 중립 거래 제목 UX05는 현 모델·동의·원장 경계를 보존하는 작은 묶음으로 승인한다. UX03은 registered-only 2개 CTA 구조(서비스/Details, Directions detail 보존), UX06은 검증된 Onion Anguk 해당 사진·credit·fallback만, UX07은 기존 painted frame + Sample 11px 이상으로 승인한다. 다른 사진·새 타이머·무분별한 peek 서비스·새 세션 수명/authority는 포함하지 않는다. UX08은 계속 사용자 결정 대기다.

거래 리뷰의 ‘같은 맥락의 사전 결제 동의가 gate 후 재개’는 적합하다. 이를 화면을 줄인다는 명목으로 무동의 자동 결제로 바꾸거나, 반대로 기존 동일 동의를 무조건 또 받는 새 단계를 추가하지 않는다. quote/대상/금액/목적이 달라진 때 재동의는 유지한다.
