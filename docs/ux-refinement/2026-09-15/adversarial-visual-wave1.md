# Wave 1 — independent mobile visual review

상태: **세 번째 artifact 확인 — 사진/CTA/하단 배경/canonical 스크롤 해결; editorial의 펼친 출처 상태 복귀 1건 추가 수정 대기**. 대상은 root가 고정한 `http://127.0.0.1:3315`이며, 최신 확인 HTML의 앱 chunk는 `page-4830b1d8d0c4bd61.js`다. 아래 결과를 이후 코드/배포에 자동 상속하지 않는다. 앱 파일은 이 검토자가 수정하지 않았다. 각 artifact의 결과를 다음 절에서 구분한다.

[시각 역할 합의 범위](ux-review-visual.md#6-조정-라운드-a--시각-역할의-명시적-표결)와 [콘텐츠 게이트](content-research.md#7-후속-독립-콘텐츠-게이트)를 기준으로 한다. 거래 회계/원 주문/환불 검수는 별도 역할이며 이 문서의 PASS로 대체하지 않는다.

## 1. 정적 판정

| 대상 | 소스에서 확인한 것 | 판정 / 아직 확인할 것 |
| --- | --- | --- |
| 로컬 어니언 사진 | `researchFoodMediaB`는 `/media/venues/` localSrc와 EN/KO/JA alt가 있어야 photograph로 전달. 원격 provenance URL을 img hotlink로 사용하지 않음 | 정적 경계 확인. 실제 로컬 요청·naturalWidth·로드 완료 후 크롭은 브라우저 대기 |
| 카드/상세 크롭 | `FoodPhotoB` 기본 비율 4:3, compact일 때 1:1. 초기 사전 검토의 상세 호출은 compact를 전달하지 않음 | **AV-01: 합의한 상세 1:1과 호출부 불일치.** 콘텐츠는 두 비율 모두 승인되어 권리 문제는 아니지만, square 상세를 의도했다면 호출부 연결 필요. root에 전달 |
| 사진 실패 | 실패한 src를 별도 기록하고 같은 figure 안에 해당 언어의 Photo unavailable와 원 사진 alt를 표시. 다른 장소/음식 사진으로 대체하지 않음 | 정적 경계 확인. abort 후 높이/폭 유지, JA 줄바꿈, 상세 이동/닫기 가능 여부는 브라우저 대기 |
| 출처/저작자 | 독립 native details의 사진 정보에 Christopher Phua/Unsplash, 게시일, 과거 사진 한계, 원본/라이선스 링크가 있으며 영업/메뉴 연구 정보와 구분 | 정적 경계 확인. summary 최소 44px·focus-visible, 링크 목록 overflow-wrap. 320px에서 확대/스크롤·초점 복귀·푸터 가림은 브라우저 대기 |
| 지원 peek | `sampleMode && resolveCommercePlaceB`에서 명시 capability를 확인해야 서비스 CTA를 만듦. 지원 시 service + Details, 미지원 시 기존 Details + Directions; 상세의 Directions 유지 | 2CTA 및 sample 경계 정적 확인. 320px JA 실제 너비·두 버튼 높이·1차/2차 색상·취소 복귀를 검수할 것 |
| Sample 11px | small을 8→11px, line-height 1.3으로 변경. +1은 10px, 최소 hit target 48px 유지 | 합의 범위와 일치. 동일 painted snapshot, 2개 cue, focus ID 고정, reduced-motion 규칙 유지. 실제 지도 UI/말풍선 간 가림은 브라우저 대기 |

### AV-01 근거와 추적

- [food-photo-b.tsx](../../../k-tour-id-app/features/ondo/map/food-photo-b.tsx), 19/35–37행: compact 기본 false, 로드/실패 상태와 caption.
- [food-photo-b.module.css](../../../k-tour-id-app/features/ondo/map/food-photo-b.module.css), 1/2/6행: 기본 4:3, cover, compact 1:1.
- [researched-food-panel-b.tsx](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.tsx), identity의 FoodPhotoB 호출: 정적 검토 시 compact 없음.
- [researched-food-panel-b.module.css](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.module.css), 16/32행: 320px에서는 identity 사진 열 90px. 상세 사진의 별도 비율 override는 없음.

이 이슈는 화면 캡처로 발견한 clipping 버그라고 부르지 않는다. 지금은 소스 수준의 의도/연결 불일치다. 구현자가 바꾸면 변경 소스와 실제 비율을 다시 확인한 뒤 닫는다.

## 2. 크기·색·스크롤에서 보존할 경계

- [researched-food-panel-b.module.css](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.module.css): 320px card 145px, identity 90px + 남은 텍스트 열, 이름 overflow-wrap, disclosure summary 최소 44px, footer action 최소 48px. 기존 nested footer action은 공통 직접 자식 52px 규칙을 상속하지 않는다. 이번 변경으로 52px가 되었다고 주장하지 않는다.
- [ui.module.css](../../../k-tour-id-app/features/ondo/shared/ui/ui.module.css): detail 88dvh, 헤더/푸터 비축소, 가운데 viewport만 overflow-y auto이며 min-height 0. 구조상 짧은 화면 스크롤이 가능하지만 실제 레이아웃 PASS를 증명하지 않는다.
- [place-service-actions-b.tsx](../../../k-tour-id-app/features/ondo/place/place-service-actions-b.tsx): 버튼 클릭에서 원 장소의 지도 문맥을 저장한 후 같은 placeId의 서비스로 이동한다. 단순 사진/장소 조회를 신원 동의나 구매로 바꾸지 않는다.
- [canonical-place.module.css](../../../k-tour-id-app/features/ondo/place/canonical-place.module.css), [editorial-place-overlay-b.module.css](../../../k-tour-id-app/features/ondo/place/editorial-place-overlay-b.module.css): 지원 peek의 마지막 Details 버튼은 표면색/테두리의 secondary로 분리. 2열·48px 최소 높이. JA에서 실제 글자/아이콘 압박을 측정해야 한다.
- [traveler-activity-map-b.module.css](../../../k-tour-id-app/features/ondo/map/traveler-activity-map-b.module.css): Sample 11px, 48px target, reduced-motion/forced-colors 대응을 보존. [traveler-activity-map-b.tsx](../../../k-tour-id-app/features/ondo/map/traveler-activity-map-b.tsx)의 경계 여백 42px·cue 간 후보 거리 90px은 변경되지 않았다. 글자 확대 후 실제 cue 외곽이 넘지 않는지는 DOM 검수 대상이다.
- [globals.css](../../../k-tour-id-app/app/globals.css)의 토큰 쌍으로만 계산한 Sample 문자/표면 대비: light `#626262` / `#ffffff` = **6.10:1**, dark `#b7b6bc` / `#202126` = **7.98:1**. 렌더 픽셀·반투명 합성 실측이나 전체 UI 접근성 인증이 아니다. 의미 전달은 색만 아니라 Sample 텍스트가 맡는다.

## 3. 서버 준비 후 유한 검수 매트릭스

아래는 실행 전 정한 유한 검수 계획이다. root가 제공한 production 로컬 서버에서 수행한 실제 결과는 §4에 구분한다. 검토자가 서버/빌드/배포를 새로 시작하지 않았다.

1. 320×568 JA dark: 서울 리스트 → 어니언 카드 loaded → 상세 사진 → 사진 정보 확장. 사진 비율/간판 아닌 음식 alt/크레딧·링크/수평 overflow/푸터 가림 확인.
2. 320×480 JA dark: 같은 상세에서 하단 크레딧·Directions·On map·닫기 접근. 스크롤 소유자와 초점 복귀 확인.
3. 같은 환경에서 어니언 파일 요청만 abort: 예측한 한 건의 네트워크 실패를 분리 기록, error copy·frame 크기·다른 장소 사진으로 바뀌지 않음·서비스 조작 유지 확인.
4. 320×568 JA dark: registry 지원 canonical peek은 service + Details만, 취소하면 같은 peek. 미지원은 service 0개와 기존 탐색 2CTA 유지. review=0에서 sample 서비스 없음도 확인.
5. 320×568 JA dark: 기존 Sample cue의 computed font 11px·hitbox≥48px·타임라인/인접 cue와 가림 여부. reduced-motion 명시 단계 이동 후 같은 장소/프레임 소유자 유지.
6. 390px light 짧은 smoke: 어니언 loaded/detail/credit와 peek 위계의 색상 반전 회귀 여부만 교차 확인. 전체 i18n/기기 매트릭스라고 합산하지 않음.

사진의 loaded 또는 error 상태, 실제 제목/주요 조작이 나타난 뒤 캡처한다. 빈 지도/pre-hydration 화면을 정상 캡처로 승인하지 않는다. 실제 pageerror와 의도한 abort/외부 tile 실패를 구분한다. 실제 Safari/iPhone/Android 검증을 수행한 것으로 표현하지 않는다.

## 4. 실제 실행 결과 — 첫 artifact

Playwright Chromium의 모바일 에뮬레이션을 사용했다. JA/dark는 320×568와 320×480, EN/light는 390×844이며 reduced-motion을 켰다. 장치 로컬 선호값(locale/appearance/onboarding-complete)만 준비했고 자격·거래·계정 성공 상태를 주입하지 않았다. provider 요청/결제/실제 신원 검증은 수행하지 않았다.

| 범위 | 실제 결과 | 근거 |
| --- | --- | --- |
| 어니언 loaded / alt / 크레딧 | **확인**. 로컬 사진 naturalWidth 1200. JA 카드 145×108.75, 상세 90×67.5. 크레딧·게시일·과거 사진 한계·원본/Unsplash License 링크가 보이며 클릭 중심이 가려지지 않음 | 캡처 01–04, 20–22 |
| 사진 실패 | **확인**. 해당 로컬 JPG만 실제 abort. JA 오류 문구와 의미 있는 role img 대체, 다른 이미지 0개. 카드/상세 크기 그대로 유지. 오류 상세도 열 수 있고 페이지 너비 320 유지 | 캡처 05–06 |
| 320×480 크레딧/복귀 | **확인**. 내부 스크롤 후 원본/라이선스 링크, close, Directions/On map hit-test 통과. 닫은 후 원 어니언 카드로 focus 복귀 확인 | 캡처 04, DOM 기록 |
| 지원/미지원 의미와 복귀 | **확인**. 지원 장소는 서비스 1개 + Details, 미지원은 서비스 0개 + 기존 탐색 2개. 같은 장소 commerce를 열고 `commerce-origin-return`으로 같은 peek 복귀. 상세 Directions는 `canonical-venue-primary-directions`로 남아 있음 | 캡처 07–10, 12–13, 17–18 |
| review=0 | **확인**. 알려진 지원 장소도 서비스 CTA 0개. 정착 후 Details/Directions가 유지되며 131×50, hit-test 통과 | 최종 캡처 19 |
| 320px 첫 peek CTA 가시성 | **AV-02 재현**. sample frame이 정착하면 지원/미지원 peek 모두 CTA가 처음 보이는 영역 아래로 밀림. 일반 내부 스크롤 후 사용 가능하므로 기능 소실은 아니지만 주 행동 가시성은 미충족 | 캡처 12→13, 17→18 |
| Sample / reduced-motion | **확인**. computed font 11px, line-height 14.3px, hitbox 약 59.45×49.30px. 관찰한 두 frame에서 cue끼리/상단/타임라인 충돌 없이 hit-test 통과. 명시적 다음 시각 1140→1170, source minute 1170, event sequence 39 일치; running false, animation none | 캡처 14–16 |
| EN/light 교차 확인 | **확인**. loaded 사진/출처 정상, 문서 수평 overflow 없음. 390×844의 settled 지원 peek 두 CTA는 첫 화면에 보임 | 캡처 20–23 |

23개 캡처는 **23개 독립 E2E 테스트 PASS라는 뜻이 아니다**. 단계별 캡처를 각각 시각 확인했다. 07/10/11은 지도 준비 전 중간 화면이므로 최종 시각 승인 증거에서 제외하고 settled 12/17/19로 대체한다. 08은 복귀 직후 같은 좁은 peek에서 CTA 밀림을 보여 준다.

브라우저 pageerror **0건**, 의도한 어니언 파일 abort **2건**(카드/상세), 그 밖의 requestfailed **0건**, 보호용 차단에 걸린 write request **0건**. 실제 Safari/iPhone/Android나 다른 motion/도시 전체 조합까지 검증했다고 주장하지 않는다. 모든 검토 브라우저를 종료했다.

증거: [observations.json](../../../k-tour-id-app/artifacts/qa/ux-audit/adversarial-visual-wave1/observations.json), [runtime-summary.json](../../../k-tour-id-app/artifacts/qa/ux-audit/adversarial-visual-wave1/runtime-summary.json). 이 ignored QA 폴더를 원본 evidence로 사용하며 공개 배포 자산이 아니다.

## 5. 수정 재검수 항목과 역할 승인

### AV-01 — 알려진 상세 비율 연결 누락

브라우저에서도 320px 상세는 **90×67.5(4:3)**로 확인했다. root가 다음 content patch에 compact를 연결하기로 했다. 이번 artifact에서 해결됐다고 쓰지 않는다. 다음 검수는 상세 1:1과 JA 오류 대체문구/로드 전후 높이 유지에 한정한다.

### AV-02 — 정착 후 주 행동이 peek 바깥으로 밀림

320×568 JA dark, 지원 로바 peek의 실제 값:

- peek: y253.28, 높이306.72, clientHeight305 / scrollHeight383.
- 처음 두 CTA: y572.875, 높이50, viewport568보다 아래라 hit-test false.
- 일반 내부 scrollTop78 뒤: y494.875, 높이50, 두 버튼 모두 hit-test true.
- 같은 현상이 unsupported sample peek에서도 관찰됐다. review=0과 390×844 light에서는 첫 화면에 보였다.

[밀린 상태](../../../k-tour-id-app/artifacts/qa/ux-audit/adversarial-visual-wave1/12-ja320-dark-supported-settled-top.png) → [정상 스크롤로 접근한 상태](../../../k-tour-id-app/artifacts/qa/ux-audit/adversarial-visual-wave1/13-ja320-dark-supported-settled-cta.png). 단순 CTA 존재/visible matcher만으로 첫 화면 가시성을 검증하면 놓칠 수 있다.

root의 **기존 스크롤 소유자 안 sticky action row** 제안을 시각 역할에서 조건부 승인했다. canonical/editorial 모두 정확히 2CTA를 유지하고 `bottom:0`, 닫기보다 낮은 레이어, 불투명 theme 표면을 사용한다. 새 portal/스크롤 소유자나 sample 정보 삭제는 승인하지 않는다. 넓은 화면에서 정상 흐름이 변하지 않으면 별도 모바일 분기 없이 공유할 수 있다.

수정본 수락 조건:

1. settled 320×568와 320×480에서 두 CTA가 첫 화면 안에 온전히 보이고 눌림.
2. 마지막 sample 정보·기여 버튼을 sticky 위로 끝까지 스크롤할 수 있어 영구 가림이 없음.
3. 닫기·Tab·focus outline·같은 장소/기존 scroll 복귀 계약 유지.
4. dark/forced-colors 표면이 투명하지 않고 desktop에 불필요한 빈 띠가 생기지 않음.

### UXCODE-06 — 선택한 구매 카드의 제한된 연결 제안

root가 별도로 제시한 MyKorea 정리를 **조건부 승인**했다. 제목을 선택한 구매로 한정하고 그 주문의 실제 매장·상태·금액을 먼저, receipt/refund ID는 줄바꿈 가능한 보조 정보로 표시한다. 같은 장소 복귀는 불변 order origin을 사용하고 전체 구매는 Wallet 링크로 연결한다. 새 전체 이력/원장/provider 범위 추가가 아니다. pending/unknown/refund 상태를 지우거나 다른 주문을 자동 선택하지 않아야 한다. 해당 새 구현의 320px 긴 ID/복귀 브라우저 검수는 **아직 수행하지 않았다**.

보조 관찰: 보존된 full-detail Directions는 실제 접근 가능했으나 320px JA에서 작은 utility 버튼 안 문구가 세로로 감긴다(캡처 09). 새 peek 2CTA 회귀와는 별도이며, 이번 승인 조건을 넘겨 기존 utility 전체 재설계를 요구하지 않는다.

하네스의 두 오래된 가정(Back/戻る, detail의 옛 Directions testid)은 실제 DOM의 목적 있는 닫기와 primary-directions로 수정해 이어서 검수했다. 이 selector 실패를 앱 오류로 세지 않았다. 컨텍스트 교체 후 캡처 helper를 다시 연결한 1회도 결과 파일을 만들지 못한 검사 도구 문제이며 앱 pageerror와 구분했다.

## 6. 두 번째 artifact 재검수 — `page-9b5879f4ec0dd6ea.js`

root의 새 standalone artifact를 같은 로컬 주소에서 검토했다. HTML GET으로 위 page chunk를 확인했다. 증거 폴더는 첫 검수와 분리한 [최종 observations.json](../../../k-tour-id-app/artifacts/qa/ux-audit/adversarial-visual-wave1-final/observations.json), [최종 runtime-summary.json](../../../k-tour-id-app/artifacts/qa/ux-audit/adversarial-visual-wave1-final/runtime-summary.json)이다. 이 시점의 18개 단계 캡처를 모두 시각 확인했으며, 18개 독립 E2E PASS라고 세지 않는다.

### 해결을 확인한 범위

- **AV-01 해결:** 어니언 상세가 320px에서 90×90, `data-compact=true`다. 실제 이미지 abort 뒤에도 같은 90×90 frame 안에 JA 오류 문구가 표시된다. 카드 4:3은 유지된다. 캡처 06/11.
- **AV-02 첫 화면 CTA 해결:** 320×568 settled peek의 scrollTop0에서 두 버튼은 131×52, y493–545로 온전히 보이고 hit-test true. 320×480에서도 y405–457, 두 버튼 모두 hit-test true다. 캡처 01/02.
- **본문 말단 접근:** 320×480에서 sample-add-moment에 focus를 주면 기존 peek가 scrollTop136까지 이동하고 마지막 버튼이 y329.41–373.41에 보이며 hit-test true. 다음 Tab은 서비스 CTA로 이동한다. 정보/기여 조작이 영구적으로 덮이지 않았다. 캡처 03.
- **강제 색상:** canonical과 editorial 모두 강제 색상에서 sticky 배경은 불투명 Canvas(관찰값 black), 버튼 글자/테두리·focus가 구분되고 hit-test true다. 캡처 05/18. 실제 OS 접근성 기기를 테스트한 것은 아니다.
- **양 테마/크기:** JA dark 320×568/480, EN light 390×844, 실제 비터치 desktop 에뮬레이션 1440×1000을 확인했다. desktop peek는 460×394.59이고 CTA 209×52로 첫 화면에 보인다. 새 빈 action 띠는 없으며 상세 모달의 기존 여백은 남아 있다. 캡처 12–15. 모든 크기×언어×테마의 전수 조합은 아니다.
- **editorial 동일 규칙:** 제주 해녀의부엌 peek는 320×480에서 두 CTA 136×52, y331–383으로 처음부터 hit-test true. 출처 펼침 후에도 문장과 버튼이 접근 가능하다. 캡처 16–18.

### 새 학림 사진 콘텐츠 게이트의 실제 UI 확인

- 로컬 전달 파일은 브라우저에서 natural 960×1280으로 로드된다. `object-position:50% 0%`를 확인했고, 실제 4:3 카드와 1:1 상세에서 학림 간판이 남아 있다. 옆 매장/현재 메뉴 사진으로 사용하지 않았다. 캡처 08/09.
- 320px 상세 90×90, 390px 상세 약118.31×118.31, desktop 상세 약203.31×203.31이다. 같은 파일·다국어 alt를 사용한다.
- About the photo에 Seefooddiet, Commons, CC BY-SA 4.0, 960px thumbnail/top-aligned display crop 변경 설명, 촬영일 2025-01-10, 원본/라이선스 링크가 있다. 390/1440에서는 크레딧 전체를 한 화면에서 확인했고, 320×480에서는 내부 스크롤로 읽을 수 있다. 캡처 10/12/15.
- 학림 상세의 `data-place-service` **0개**, sample activity meter **0개**를 확인했다. 이름/사진이 있다는 이유로 혜택·예약 capability가 추가되지 않았다. 단, 리스트 화면에는 timeline 자체가 없으므로 리스트에서 timeline 전체 frame signature를 읽으려 한 1회 timeout은 검사 가정 오류로 분리했다. 이번 관찰만으로 지도 내부 모든 데이터 배열의 불변성을 새로 증명한 것은 아니다.
- 어니언 크레딧·라이선스·과거 사진 한계도 다시 확인했다. 상세 1:1의 가운데 crop에서 빵 두 개와 커피가 유지된다.

### 남은 두 작은 반례 — root 수정 후 재확인할 것

1. **내부 scroll 복귀:** 본문 끝에서 서비스로 이동하기 전 scrollTop136이었으나 같은 장소로 돌아온 peek는 scrollTop0이었다(캡처 03→04). 장소/CTA 복귀는 성공했다. root는 기존 capture/restore가 찾는 `data-place-service-scroll`을 원 peek scroll owner에 추가해 재사용하기로 했다. 새 scroll model이나 다른 주문 선택은 필요하지 않다.
2. **하단 배경 틈:** 320×480에서 sticky row 아래 기존 약14px padding 영역에 sample scale의 가는 선이 비친다(캡처 02/04). 버튼은 눌리지만 불투명 footer가 끝까지 이어지지 않는다. root는 같은 scroll owner 안에서 배경을 하단 padding까지 연장하기로 했다. 수정 후 첫 화면/말단 focus/강제 색상에 새 가림이 없는지 재확인한다.

두 번째 검수의 pageerror **0건**, 의도한 어니언 파일 abort **2건**, 다른 requestfailed **0건**, write request 차단 **0건**. 검토 브라우저를 모두 닫았고 root의 작은 재빌드가 가능하다고 전달했다. MyKorea 선택 구매 변경의 전체 거래 여정 검증은 별도 담당자의 범위이며 이 사진/peek 결과로 대신하지 않는다.

## 7. 세 번째 artifact 제한 재검수 — `page-4830b1d8d0c4bd61.js`

이번에는 두 남은 caveat와 desktop smoke만 실행했다. HTML의 page chunk를 다시 확인했다. [closeout observations](../../../k-tour-id-app/artifacts/qa/ux-audit/adversarial-visual-wave1-closeout/observations.json), [closeout summary](../../../k-tour-id-app/artifacts/qa/ux-audit/adversarial-visual-wave1-closeout/runtime-summary.json)에 첫/복귀 scroll과 geometry를 기록했다. pageerror/requestfailed/write request는 모두 0건이며 브라우저를 종료했다.

- **하단 배경 해결:** 320×480 첫 화면에서 row는 y397–471, peek bottom472다. 하단 안쪽 hit-test가 row에 속해 기존 padding의 sample 선이 더 이상 비치지 않는다. 두 CTA는 여전히131×52, y405–457로 모두 눌린다. 강제 색상도 불투명 상태를 유지했다.
- **canonical 내부 스크롤 해결:** 본문 마지막 버튼에서 서비스에 진입하기 직전 scrollTop150, 같은 장소 복귀 후150으로 일치한다. focus는 서비스 버튼으로 돌아왔고 본문 말단은 계속 접근 가능하다.
- **desktop 유지:** 1440×1000 light 비터치 환경에서 peek는460×408.59, 두 CTA209×52가 첫 화면에 보인다. 추가로 늘어난 부분은 실제 footer padding이며 큰 빈 action 띠는 관찰되지 않았다.
- **editorial 펼침 상태 반례:** 제주 peek의 출처 details를 펼친 뒤 scrollTop33에서 서비스로 이동했다. 복귀 때 details가 닫혀 content height386→356으로 줄고 scroll은 최대12로 clamp된다. 같은 장소와 CTA는 유지되지만 **펼친 설명과 정확한 읽던 위치는 아직 보존되지 않는다**. 원인이 scroll capture 실패라고 단정하지 않고 native details의 remount 상태 소실과 구분한다.

root가 제안한 기존 동일-장소 snapshot의 `expandedDisclosures`(선택적 testid 배열) 추가를 시각 역할에서 조건부 승인했다. 기존 기록된 scroll container 안의 named details만 수집하고, 같은 place/container에서 대응하는 disclosure 상태를 복원한 뒤 scrollTop을 적용한다. 알 수 없는 ID는 무시하며 HTML/내용·새 권한·영속 저장소를 추가하지 않는다. 다음 검수는 출처 open 유지·33→33 복귀와 다른 장소에 상태가 번지지 않는지로 한정한다. 이 수정의 PASS는 아직 기록하지 않는다.

### 공유 가능한 작은 화면 증거

다음 4개는 CSS scale screenshot이며 실제 장치 PII/실제 계정/문서/결제 데이터가 없는 sample 앱 화면이다. 320×480 세 장과1440×1000 한 장으로 구성하며 서로 다른 네 테스트라는 뜻이 아니다. 사진 검수 원본 캡처는 §6의 ignored QA evidence에 남아 있다.

| 상태 | 캡처 |
| --- | --- |
| JA320×480 첫 화면: 불투명 footer + 두 CTA | [첫 화면](evidence/01-ja320x480-final-footer-first.png) |
| 같은 peek의 본문 말단에서 서비스 진입 전150px | [진입 전](evidence/02-ja320x480-final-before-service.png) |
| 같은 장소 서비스 복귀 후150px·CTA focus | [복귀 후](evidence/03-ja320x480-final-after-service.png) |
| EN1440 light desktop footer | [desktop](evidence/04-en1440-final-footer.png) |

[media-manifest.json](media-manifest.json)의 실제 승인/로컬 전달 수는 **2건**(어니언·학림)으로 바로잡았다. 두 로컬 파일의 SHA-256 일치도 확인했다. generic runtime pending 대신 §6의 JA/EN 로컬 crop/load/credit 검증 범위를 기록했다. KO 실제 UI, 실제 기기/원격 production, 학림 파일만의 abort를 별도로 수행했다고 쓰지 않았으며, 공통 오류 컴포넌트는 어니언 실제 abort로 확인했음을 구분했다.
