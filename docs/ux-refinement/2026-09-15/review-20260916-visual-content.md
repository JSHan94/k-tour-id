# 역할 C · 시각/콘텐츠 첫 독립 제안

2026-09-16 · 기준 소스 `173e71c`. **초기 제안 동결: 앱 수정·통합 합의 전.** 다른 A/B의 초기 평가 문서를 읽지 않았다. [승인된 실행 계획](../../UX_REFINEMENT_EXECUTION_PLAN_2026-09-15.md)과 기존 콘텐츠/미디어 기록을 읽고 활성 컴포넌트·현재 `https://ktour-id.vercel.app`를 대조했다. 실제 통합·배포 PASS를 선언하는 문서가 아니다.

## 1. 개선 후보 — 최대 세 가지

| ID / 우선순위 | 직접 근거와 사용자 손실 | 최소 제안 / 보호 조건 | 수락 검사 |
|---|---|---|---|
| C01 · P1 사진으로 장소 판단하기 | 연구 추천25곳 중 로컬 실제 사진은 어니언·학림2곳. 나머지23곳은 illustration/category 안내다. [media 연결](../../../k-tour-id-app/features/ondo/map/researched-food-b.ts#L70), [카드/상세](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.tsx#L24). 메뉴·분위기의 차이를 그림만으로 판단하기 어렵다 | 기존 Momos 영도 사진1장 또는 권리/좌표를 확인한 신설오름1곳+음식사진1장을 작은 배치로 추가. 4:3 카드/1:1 상세 구조는 유지. 사진 없는 곳을 실패 UI로 만들지 않고 정직한 분류 안내 유지 | 실제 파일·hash·지점·촬영 시점·alt·출처/라이선스·크롭·로드 실패. 장소 추가가 sample capability27개/실제 제휴·예약·결제/heat를 늘리지 않음 |
| C02 · P1 상세 화면의 행동 위계 | 운영 JA320 어니언 상세에서 혜택은 본문 중간의 큰 카드인데, 고정 footer는 계속 `ルート / 地図で見る`다. [footer](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.tsx#L31), [본문 서비스](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.tsx#L38), [동일 톤48px footer](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.module.css#L29). 본문을 읽을수록 제품 안 행동보다 외부 이동이 더 잘 남는다 | 지원 장소만 기존 혜택/매장 결제 액션 하나를 primary footer로, 지도 복귀는 secondary로 둔다. 같은 offer의 본문 중복만 제거하며 예약/이력 등 다른 기능은 유지. 길찾기는 본문 보조 링크. 미지원 장소는 지도 primary + 길찾기 secondary | 지원/미지원·스크롤 말단·320JA480·키보드·등록지점 변경·동일 quote/원장/복귀 snapshot 보존. 새 서비스 권한 부여나 동의 생략 금지 |
| C03 · P2 작은 설명 글자의 일관성 | 실제/예시 사진 caption11px, category caption9px, 실패 문구11px다. [FoodPhoto CSS](../../../k-tour-id-app/features/ondo/map/food-photo-b.module.css#L4). 지역·카테고리 metadata도11px지만 일반 상세 설명13px, 서비스 보조12px로 섞여 있다. 운영 어니언의 사진 표시는 computed11px 확인 | sample/photo/category 짧은 badge는 최소11px, 의미 있는 실패·설명·지역 metadata는12px을 기준으로 정돈. 필요한 정보 삭제나 전체 폰트 일괄확대는 하지 않는다. 긴 이름은 상세에서 유지하고 작은 카드의 기존2줄 한도를 유지 | JA/KO320, 텍스트 확대, 대비 실측, placeholder/사진 실패, card 높이·단일 footer와 닫기44px 유지. 9px→11px으로 샘플 경계를 더 읽기 쉽게 하되 live 표시로 바꾸지 않음 |

공통 보호: 흑백 브랜드·온도색 구분, 지도 우선·선택형 취향 설정, 목적별 신원/패스/VP/구매 동의, 상태별 취소·unknown·복구, 필수 네 기술의 실제 연동 인계. 한국풍 AI 공유 이미지는 실제 매장/음식/방문 사진 슬롯에 사용하지 않는다. 새 골목 가이드의 공개/신원 경계 변경은 별도 사용자 결정 사항이며 이번 시각 제안으로 바꾸지 않는다.

## 2. 바로 다음 배치로 제안할 콘텐츠

### C-PH01 · 신설오름 1곳 + 몸국 사진 — 콘텐츠 통합 제안 가능

기존 `candidate-jeju-sinseoloreum`의 보류 원인이었던 **두 번째 공식 좌표를 이번에 확보했다**. [VisitJeju](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000020185&menuId=DOM_000001719000000000)의 고마로17길2, `33.50546,126.54163`과 [KTO 상세](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=f8eee625-9581-4af7-99c8-bd69e9dcde02)의 공개 콘텐츠 GET이 같은 이름·주소와 `33.5053848808039,126.541578109031`을 반환했다. 두 점 차이는 약10m다. 현장 출입구 측량이나 오늘 영업 확인으로 확대하지 않는다.

재현용 읽기 전용 자료: [KTO 공개 콘텐츠 응답](https://korean.visitkorea.or.kr/call?cmd=TOUR_CONTENT_BODY_DETAIL&cotId=f8eee625-9581-4af7-99c8-bd69e9dcde02&locationx=&locationy=&stampId=). 계정/키/POST 없이 HTTP200으로 확인했다. 현재 앱 `data/`와 연구/서비스 source에서 신설오름·Sinseol·고마로17길 exact text match는0이다. 기존 ID를 병합/삭제하지 않으며 최종 alias 검토는 통합 게이트에서 유지한다.

- 제안 ID: 기존 초안 그대로 `research-jeju-sinseoloreum`; EN `Sinseoloreum`, KO `신설오름`, JA `シンソルオルム`. `food`, signature `Momguk / 몸국 / モムクッ`. 설명은 관광 출처가 소개한 제주 몸국 식당이라는 수준으로 제한한다. 가격·현재 재고·열림·라이브 인기/제휴는 넣지 않는다.
- 사진: [공석배의 신설오름 몸국](https://commons.wikimedia.org/wiki/File:신설오름_몸국.jpg), 2019-07-23, **CC BY4.0**. 파일 설명이 음식과 식당을 함께 명시하며 Commons의 원게시물 라이선스 검토 표시도 재확인했다. [라이선스](https://creativecommons.org/licenses/by/4.0/)에 따라 저자·원본·라이선스·변경 표시를 유지한다.
- [원본 JPG](https://upload.wikimedia.org/wikipedia/commons/1/12/%EC%8B%A0%EC%84%A4%EC%98%A4%EB%A6%84_%EB%AA%B8%EA%B5%AD.jpg): 961×961, 229,740bytes. 이번 읽기 전용 QA 취득 SHA256 `1550a36f18e307d644c5856573de445e0ae62530137cb1d4f2e945c983885666`. 직접 이미지 확인: 몸국 한 그릇과 반찬, 인물 없음. 중앙 음식이 명확하다. 정사각 상세는 적합하며 카드4:3 crop은 실제 UI에서 추가 확인한다.
- 제안 local path: `/media/venues/research-jeju-sinseoloreum/momguk-gong-seokbae-20190723-v1.jpg`. 초안의 webp 경로를 형식 변환 없이 재사용하지 않는다. credit: `신설오름 몸국 — 공석배 / Wikimedia Commons, CC BY4.0, 2019-07-23; 화면 크롭`. alt는 세 언어 모두 ‘2019년 신설오름에서 촬영한 몸국’의 의미를 유지한다.
- **콘텐츠만** 추가한다. 기존 서비스 registry에 넣지 않고 benefit/payment/reservation/sample meter를 새로 부여하지 않는다. 우진해장국이나 다른 식당의 현재 메뉴 사진으로 전용하지 않는다.

### C-PH02 · 기존 모모스 영도 사진 — 권리 확인, 원본 취득 절차 조건부

[부산관광아카이브 METADATA013508](https://visitbusan.net/archive/dataSearch/view.nm?dataSid=METADATA013508)은 정확한 영도 주소 `봉래나루로160`, 제작자 하이픈그룹, 발행자 부산관광공사 글로벌마케팅팀, 생산일2024-08-01, **공공누리 제1유형**을 명시한다. [공식 저작권 안내](https://visitbusan.net/archive/index.nm?menuCd=9)는 해당 유형의 출처 표시·상업 이용·변형 조건을 설명한다.

- [공개 미리보기](https://visitbusan.net/archive/upload/2025/09/10/20250910144124987280_m.png)는499×750이며 이번 SHA256은 `180d33e529394c17767294a4ecd1c29b1269ff1bac830b4e0272fd248f57fd79`. 직접 확인한 장면은 카페 좌석과 창 너머 항구다. 음식·외관 사진으로 표시하면 안 된다. 식별 가능한 인물 없음.
- 현재 공개 미리보기를36.355MB 원본 JPG로 오인하지 않는다. 정상 다운로드 UI의 사용 목적/사용자 분류 제출은 수행하지 않았다. **기존 기록의 원본 취득 조건을 임의 해제하지 않음**: 원본 정상 취득 후 축소/크롭 게이트를 마치거나, 미리보기만 전달본으로 채택하는 별도 소스·품질 승인을 받는다. 즉시 앱 반영 가능한 두 번째 파일이라고 집계하지 않는다.
- 기존 `research-busan-momos-yeongdo`에만 귀속. 이름만 비슷한 전포 MP4 `METADATA013551`은 주소 불일치로 계속 제외한다. 기존27 sample capability를 수정할 이유가 없다.

수량을 맞추기 위한 추가 수락은 하지 않는다. 새로 찾은 [명동교자 칼국수 사진](https://commons.wikimedia.org/wiki/File:Kalguksu_20230430_002.jpg)은 Mobius6,2023-04-30,CC BY-SA4.0이지만 **본점/분점이 명시되지 않아 현재 본점 후보에 연결 보류**다. Hakrim02 인물 사진, 허가 문구가 충돌하는 토속촌 파일도 이전 보류를 유지한다.

## 3. 실행 증거·이번 검토 한계

운영 Chromium1page, JA/dark320×568에서 서울→목록→어니언 상세를 직접 확인했다. locale/theme/온보딩 preference만 설정했고 자격/잔액/서비스 완료를 주입하지 않았다. 어니언 실제사진 loaded 상태와 caption11px 확인 후 캡처했고 browser를 닫았다. `?city=seoul` 직후 map에는 추천 carousel이 없는 첫 harness 가정을 정정해 보이는 목록 전환 버튼으로 진입했다. 첫 목록 캡처의 illustration 이미지가 아직 표시되지 않은 상태는 사진 실패 버그로 판정하지 않았다.

로컬 증거: `k-tour-id-app/artifacts/qa/ux-round-20260916-visual/`의 `01-research-list-ja320.png`, `02-onion-detail-ja320.png`, 두 후보 이미지. ignored 파일은 GitHub 링크로 쓰지 않는다. 앱·manifest·schema·배포·외부 계정/설정을 변경하지 않았으며, 이 소유 문서만 추가했다. 대표 상세 관찰이지 전체 페이지/모든 상태 PASS가 아니다. 다음 단계는 세 역할 교차 판정 → 승인된 작은 배치 → 실제 크롭·실패·복귀 검사다.

## 4. 첫 제안 동결 이후 · C의 교차 판정

초기 문서를 저장한 뒤 [A의 발견 검토](./review-20260916-discovery.md)를 읽었다. B의 Zest/충전 관찰은 조정자가 전달한 실제 실행 결과이며 C가 같은 금융 여정을 직접 재생한 것은 아니다. 다음은 C 역할의 승인 조건이지 세 역할 전체 합의나 구현 완료 선언이 아니다.

| 통합 제안 | C 판정과 보호 조건 |
|---|---|
| 지원 research footer 혜택/결제 primary + 지도 secondary, 본문 동일 offer 제거 | **조건부 승인.** 기존 exact offer handler·귀속·return focus anchor를 한 소유자로 이동한다. 예약은 다른 기능이므로 유지, 길찾기는 본문에 유지. 미지원은 지도/길찾기이고 새 capability 없음. 320JA480에서 두 CTA52px·hit·키보드 접근을 확인한다. |
| Zest의 일반 Offer/Meal offer를 매장 결제로 명확히 | **승인.** 현재 상품/금액은 유지하고 음식·제공 구성을 창작하지 않는다. 음식점/카페/바에 중립적인 매장 결제와 selected venue 문맥을 사용한다. |
| 같은 Person 확인 재사용 경로의 holder 준비 자동화 | **조건부 승인.** experiencePerson 경로만, 별도 pass 생성·보관 동의 이후 준비1회. 준비 중/실패/만료를 숨기지 않고 최종 수령 ack와 목적별 VP는 별도 유지. 준비만으로 발급0, 마지막 mutation 거절 복구 유지. 기존 일반 발급·추가 자격·갱신까지 확대하지 않는다. |
| 같은 pulse frame의 값 변화에 미세 CSS 강조 | **조건부 승인.** 기존 frame/값에만 연결하고 새 타이머·fake visit/실수집·자동 지도 이동/재정렬 금지. reduced-motion에서는 강조 없음, source/sample badge 최소11px, contrast 및320 시각 확인. 지도 전체 점멸보다 변경한 값/작은 표시만 짧게 강조한다. |
| 주문 충전 첫 화면에 매장·부족 KRW, 연결 방식의 사용자용어 | **조건부 승인.** 부족액은 현재 동일 quote/잔액에서 읽고 기존 amount picker/fee/signature/asset/network를 보존한다. `소셜 계정으로 연결`과 세부 `Sui zkLogin`을 함께 제공한다. 충전 자체가 구매 완료라는 뜻은 아니다. **이미 동의한 동일 quote의 자동 재개 분기**에서는 ‘충전 뒤 다시 구매 동의를 받는다’고 약속하지 않으며, 기존 consent 상태에 맞춰 원 주문 재개를 설명한다. 단순 문구 수정으로 승인/결제 상태를 변경하지 않는다. |

가이드 무인증 공개/패스에 저장할 때만 확인하는 대안은 사용자 응답 전 HOLD다. C01 콘텐츠는 신설오름의 권리·사실·사진과 콘텐츠-only 조건을 우선 수락 후보로 제시한다. Momos 원본 취득 절차를 축약한다고 이미 승인된 것으로 해석하지 않는다.

## 5. 합의 후 C 구현·비작성자 검토 인계

조정자의 명시 승인 뒤 C는 신설오름 JSON1건·원본 local JPEG1개·category caption9→11px·PUBLIC_FILES1건·packaging exact-list1행·관련 콘텐츠 manifest/계약만 변경했다. [신규 계약](../../../k-tour-id-app/tests/contracts/ktour-sinseoloreum-content.spec.ts)3개와 기존 traveler-food11개를 합쳐 **14/14 PASS(1.0s)**, JSON3개 파싱·diff whitespace 검사 PASS. 이 수치는 source 범위이며 신규 전체 build/실제 이미지 crop/실패/원격 배포 결과가 아니다. 앱 source는 이 시점에 동결했다.

작성자가 자기 구현의 최종 수락을 대신하지 않도록 신설오름의 실제4:3/1:1 crop, 사진정보·실패 fallback, 미지원 지도 footer, sample activity/commerce 없음은 B/조정자에게 넘겼다. Momos 이미지는 QA 비교용일 뿐 앱에 넣지 않았다.

C는 이후 A가 작성한 holder 자동 준비 source를 독립 검토했다. `identity-holder-step-b.tsx:15–39`의 호출 전 attempted ref·receipt전 ack 불가·ack1회, `ktour-id-setup-b.tsx:677–738`의 별도 pass동의·live handoff/session/review 재검사·최종 저장 거절 복구,899행의 experiencePerson에만 autoPrepare 적용을 확인했다. **권한을 넓히는 차단 결함은 발견하지 않았다.** 자동 준비 후 ack 전 credential0, 취소/만료/실패 복구, 일반 manual holder 유지의 실제 실행은 새 artifact에서 별도로 판정해야 한다. 이 소스 검토를 React StrictMode나 모든 실패 분기의 실행 PASS라고 쓰지 않는다.

## 6. 고정 로컬 산출물 · C 비작성자 시각 검수

2026-09-16, `http://127.0.0.1:3116`의 `page-89e7da8028d5dcc7.js`에서 실행했다. Chromium 한 브라우저/한 페이지씩, JA/dark320×480와 EN/light390×844를 사용했다. locale/theme/온보딩 preference 외 신원·패스·구매 완료 상태를 주입하지 않았다. 작성자 C의 사진 자체 수락은 조정자/B의 독립 검토와 별개이며, 아래는 주로 조정자가 작성한 footer/pulse의 실제 표시 확인이다.

| 확인 범위 | 직접 관찰·측정 결과 |
|---|---|
| Zest 지원 상세 · JA320×480 | 고정 footer에 결제 확인 primary1개 + 지도 secondary1개. 각52px, top416/bottom468, 중앙 hit 및 가로 overflow 없음. 본문 offer 중복0, 예약1개·길찾기1개 유지. 설명 말단으로 실제 스크롤한 뒤에도 양 footer가 같은 위치에 남는다. 바에 식사 상품을 새로 단정하는 문구 없음. |
| 신설오름 콘텐츠-only · JA320×480 | 지도 primary + 길찾기 두52px 액션만 표시. offer/reservation/pulse0. 실제 이미지 loaded961×961, 상세90×90의1:1 crop, 촬영연도 포함 JA alt 확인. 음식 그릇이 식별되고 badge와 상호가 충돌하지 않는다. |
| 신설오름 목록 crop | 별도 JA320 검수에서145×108.75의4:3 `object-fit:cover`, 원본961×961을 확인했다. 중앙 몸국이 유지되고 사진을 다른 음식점/현재 메뉴로 표시하지 않는다. |
| 사진정보 · EN390×844 | 저자 공석배·Commons·CC BY4.0·2019-07-23 촬영일·화면 crop·원본/라이선스 링크와 ‘오늘의 메뉴·가격·가능 여부 보장 아님’ 안내를 실제 펼쳐 읽었다. 고정 지도/길찾기와 겹치지 않고 본문을 스크롤할 수 있다. |
| 실제 canonical Roba pulse · EN390 및 JA320×480 | 기존 `PREPARED_ILLUSTRATION` frame만 표시. Sample/サンプル 및 수치 label computed11px. reduced-motion=true에서 running=false, 모든 meter 하위 animation=`none`, EN transition=`0s`. JA의 샘플 표시·방문/사진/업데이트가 읽히고 페이지 가로 overflow0. 짧은 화면의 본문은 기존 내부 스크롤을 사용하며, 모든 본문 액션이 동시에 화면에 보인다는 판정은 아니다. |

대표 캡처5장과 보조2장을 **직접 열어 확인**했다. 이 범위에서 새 시각 차단 결함은 발견하지 않았다. 각 실행의 pageerror0/금지된 provider·쓰기 요청0, 종료 시 context/browser 모두 닫힘을 확인했다. 키보드 exact-return·거래·holder 실패 분기·실기기 Safari/Android·원격 배포 전체 QA를 이 검토로 대신하지 않는다.

로컬 ignored 증거(공개 GitHub 링크 아님): `k-tour-id-app/artifacts/qa/ux-round-20260916-visual/final-89e7-r2/`의 `01-ja320-zest-footer.png`, `02-ja320-zest-directions.png`, `03-ja320-sinseoloreum-photo.png`, `04-en390-sinseoloreum-credit.png`, `05-en390-canonical-reduced-pulse.png`, `summary.json`; `final-89e7-small/`의 `06-ja320-list-crop.png`, `07-ja320-reduced-pulse.png`, `summary.json`.

검수 과정의 제한도 보존한다. 첫 서버 접속 실패는 packaging stage 재생성/재빌드 순서 문제로 브라우저 시작 전에 중단되었다. 이후 첫 기하 검사의 실패는 시트 진입 애니메이션 종료 전 측정이었다. 실제 `getAnimations()` 종료를 기다린 같은 앱 산출물 재실행이 통과했으며 앱 패치로 해결한 결함으로 집계하지 않는다. Zest research 상세에 실제 painted pulse frame이 없던 경우는 `NOT_RENDERED_NO_PAINTED_FRAME`으로 남겼고, 데이터 주입 없이 기존 canonical Roba 공개 진입에서 pulse를 검수했다. C 앱 소스는 이 검수 동안 변경하지 않았다.

## 7. 최종 인계 경계와 Preview 사진 확인 · `8fcbeb1`

`173e71c`→`8fcbeb1` diff와 [통합 라운드](./round-20260916.md), [Harvey 요약](../../HARVEY_HACKATHON_HANDOFF_2026-09-14.md), [체험 목업 계약](../../EXPERIENCE_MOCK_HANDOFF_2026-09-15.md)을 다시 독립 대조했다. **기능 삭제나 실제 네 기술 연동 완료로 오표기하는 차단 사항은 발견하지 않았다.** guide의 공개 열람/선택 저장 정책은 여전히 사용자 선택 HOLD다. experience domain·공통 provider·금융 모델·서비스 registry·API·package 의존성에 이 커밋의 변경은 없다. Person 전용 경로의 준비1회만 자동화하고 명시 holder ack/VP·일반 수동 발급을 보존한다. 실제 CX/OpenDID/Sui/AI/OmniOne 호출과 서비스 사용 확정은 개발 대상으로 유지한다. 이전 시각 artifact의 PASS를 최종 focus 변경에 이월하지 않는 문서 구분도 확인했다.

조정자가 Git source `8fcbeb1`의 Ready를 확인한 Preview `https://ondo-cmk176e1e-jaewook-9643s-projects.vercel.app`에서 C는 **사진 정상·실패의 두 시나리오만 PASS**했다. 브라우저가 받은 chunk는 `page-efb3bd6fb35a971f.js`이며 로컬 chunk와 혼용하지 않는다. JA/dark320×480, reduced-motion, Chromium1browser/1page, preference만 설정했다.

- 정상: 신설오름 실제 local 사진961×961·2019 촬영 alt, 저자 공석배/Commons/CC BY4.0/2019-07-23·현재 메뉴 보장 아님·원본/라이선스 링크를 펼쳐 확인했다. 지도 primary+길찾기 각52px·top416/bottom468·중앙 hit·가로 overflow0. offer/reservation/pulse0.
- 실패1case: 해당 사진 URL만 실제 네트워크 단계에서 차단했다. 목록·상세에서 총2회 요청이 차단됐으며 실패 케이스를2개로 부풀리지 않는다. `data-photo-state="error"`와 일본어 ‘写真を読み込めませんでした’가 보이고 사진 img/실제사진 caption은 사라진다. 상호·설명·지도/길찾기는 유지된다. 응답 mock/자격 주입/앱 source 변경 없음.
- 정상·크레딧·실패 캡처3장을 직접 열어 확인했다. pageerror0, 금지된 provider/쓰기 요청0. 종료 후 context/browser 모두 닫힘. 이 결과는 원격 전체 여정·focus·holder·실기기·실연동 검수가 아니다.

로컬 ignored 증거: `k-tour-id-app/artifacts/qa/ux-round-20260916-visual/preview-8fcbeb1/`의 `01-ja320-photo-loaded.png`, `02-ja320-photo-credit.png`, `03-ja320-photo-fallback.png`, `summary.json`. 현재 운영 배포의 최종 판정은 조정자의 릴리스 기록을 따른다.
