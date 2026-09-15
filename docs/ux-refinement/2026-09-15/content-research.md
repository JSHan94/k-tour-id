# Content and real-photo research — 2026-09-15

최종 상태: **어니언·학림 사진 2장과 학림 1곳 승인·반영**, 조사 추천25곳·기존 서비스 capability27곳 유지. 학림은 콘텐츠만 추가했다. 최종 파일·해시·허용 범위는 [media-manifest.json](media-manifest.json), 실제 검수·배포는 [릴리스](RELEASE.md)를 따른다.

아래 표와 초안은 기준 앱 `b9cdc42`에서 2026-09-15에 진행한 **초기 조사와 1차 게이트 당시 기록**이다. 당시에는 어니언만 승인했고 학림은 초안이었다. 이 과거의 ‘진행 중/승인0/어니언만’ 표현을 현재 상태로 읽지 않는다. [실행 계획](../../UX_REFINEMENT_EXECUTION_PLAN_2026-09-15.md)의 권리·ID 보존·PRD 게이트를 적용하며, 조사 기록만으로 UX 전체 합의나 배포 PASS를 선언하지 않는다.

## 1. 먼저 개선할 대상

기준 앱의 연구 장소 24곳(서울·부산·제주 각 8곳)은 모두 `photo: null`이었다. `existingPhotoAudit`는 이 기준 상태를 보존한다. 사실 출처·기존 좌표·기존 확인일을 이번 사진 조사일로 덮어쓰지 않았다. 전체 ID별 원본 출처와 후속 후보 상태는 [content-candidates.json](content-candidates.json)에 있다.

- 기준 UI는 실제 사진 필드가 아닌 `researchFoodIllustrationB`를 사용했다. 실제 사진은 [카드/상세 호출부](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.tsx), [이미지 매핑](../../../k-tour-id-app/features/ondo/map/researched-food-b.ts), [일러스트 레이블/실패 처리](../../../k-tour-id-app/features/ondo/map/food-photo-b.tsx)까지 연결해야 한다. root의 어니언 연결 작업은 별도로 진행 중이며 JSON URL만 채웠다고 완료한 것으로 보지 않는다.
- 현재 기본값은 음식·카테고리 안내 일러스트이며 실제 매장/메뉴 사진으로 표시하지 않는다. 확인된 사진을 도입하더라도 나머지 장소의 정직한 기본값과 로드 실패 처리는 유지한다.
- 공식 400곳의 사업장 데이터 라이선스는 사진 이용허락이 아니다. 기존 [provenance manifest](../../../k-tour-id-app/data/ondo-venues/provenance-manifest.json)의 사진 권리 미확인 경계를 유지한다.
- 사진 배치 제안은 지도 미리보기 → 추천 카드 → 상세 갤러리 순서다. 기존 코드의 카드·상세는 확인했으나 모든 지갑/주문 화면에 사진 슬롯이 이미 있다고 주장하지 않는다. 메뉴/혜택 카드·주문 영수증 사진은 별도 연결 작업이며, 과거 음식 사진으로 현재 판매 메뉴/가격을 증명하지 않는다.

| 기존 장소 우선순위 | 재사용 권한/장소 근거 | 시각 확인 | 아직 필요한 작업 |
| --- | --- | --- | --- |
| 어니언 안국 | [Christopher Phua의 사진 페이지](https://unsplash.com/photos/desserts-and-a-coffee-are-served-on-a-tray-VVwfHGp8in8)가 안국 촬영지와 Unsplash License를 명시. [운영자 주소](https://www.onionkr.com/category/contact/26/)는 기존 안국 주소와 일치 | 후속: 실제 1200×800 전달 JPEG·해시 독립 확인. 빵 2개와 커피, 인물 없음. 중앙 4:3/1:1 콘텐츠 크롭 승인 | 실제 앱의 크롭/로드/실패/크레딧 QA. 지점은 촬영자 위치 메타데이터에 의존하며 현재 메뉴 증거가 아님 |
| 모모스 영도 | [부산관광아카이브 METADATA013508](https://visitbusan.net/archive/dataSearch/view.nm?dataSid=METADATA013508), 봉래나루로 160, 하이픈그룹/부산관광공사, 공공누리 제1유형 | 499×750 미리보기 확인. 좌석과 창 너머 항구. **외관 사진이 아님** | 원본 정상 다운로드·크롭 검수. 세로 갤러리 우선, 가로 히어로 강제 확대 금지 |
| 나머지 22곳 | 이 제한된 초기 조사에서 지점 일치+재사용 권한을 갖춘 사진 미확보 | 개별 원본 전체 검수 미실시 | 기존 정직한 일러스트 유지. 권리자가 제공한 사진 또는 파일 단위 공개 라이선스 추가 조사 |

공공누리 제1유형은 출처 표시 조건으로 상업/비상업 이용과 변형을 허용한다. 단, 이 판단은 해당 파일에 실제로 붙은 유형과 [아카이브 이용안내](https://visitbusan.net/archive/index.nm?menuCd=9)를 함께 확인한 결과이지 관광 사이트의 모든 사진에 대한 포괄 허가가 아니다. Unsplash 파일은 [Unsplash License](https://unsplash.com/license)에 따른 재사용 후보이며, 프로젝트 정책상 법적 필수 여부와 무관하게 사진가·출처를 표시한다. 인물·상표·별도 권리와 오인성은 파일별로 추가 확인한다.

## 2. 사진 전달 manifest — 초기 게이트 기록

[media-manifest.json](media-manifest.json)의 조사 기록은 8건이다: 기존 장소 2건, 새 후보 2곳의 사진 3건, 지점/권리 충돌 예시 3건. 초기에는 `integrationAllowed: true`가 어니언 1건이었고 후속 승인으로 학림 간판까지 2건이 됐다. 학림 실내 사진은 인물이 주목적으로 보여 보류했다. 파일별 권리·날짜 의미·지점·크롭·제안 경로·금지 용도를 분리했다.

- 어니언: root가 `/media/venues/onion-anguk-christopher-phua-20250301.jpg`에 1200×800 JPEG를 추가했다. manifest의 `deliveredUrl`과 `sha256`이 실제 전달 파일을 특정한다. 기존 조사용 3000px `downloadUrl`과 같은 바이트라고 주장하지 않는다. 어니언만 이번 1차 사진 구현 범위다.
- 모모스: 공개 미리보기 URL은 확인했지만 36.355 MB 원본 JPG는 받지 않았다. 원본 다운로드 UI는 사용목적·사용자 분류를 받고 통계 POST를 수행한다. 이번 무변경 조사에서는 제출하지 않았다. 다음 단계에서 정상 다운로드 절차를 수행하거나 권리 확인된 원본 파일을 전달받아야 한다. 미리보기 주소를 원본 주소로 둔갑시키거나 다운로드 절차를 우회하지 않는다.
- 학림: [Seefooddiet의 01 간판 사진](https://commons.wikimedia.org/wiki/File:Hakrim_Dabang_01.jpg)은 CC BY-SA 4.0, 2025-01-10 촬영. 방향 보정한 원본과 상단 정렬 4:3/1:1 크롭을 메모리에서 시각 확인했다. 이름 간판이 명확하고 식별 가능한 얼굴은 없다. 중앙 가로 크롭은 간판을 자르므로 불허한다. [02 실내 사진](https://commons.wikimedia.org/wiki/File:Hakrim_Dabang_02.jpg)은 식별 가능한 손님이 두드러져 이번 배치에서 제외한다. 변형 이미지의 동일조건 공유·출처·변경 표시를 보존한다.
- 신설오름: [공석배의 몸국 사진](https://commons.wikimedia.org/wiki/File:신설오름_몸국.jpg), 2019-07-23, 961×961, CC BY 4.0. Commons의 원출처 라이선스 검토 기록과 실제 사진을 확인했다. 인물 없는 음식 사진이지만 과거 차림새다. 정사각 상세 콘텐츠만 검토했으며, 새 핀은 두 번째 좌표 출처가 없어 보류한다.

다운로드 링크는 조사·취득 위치다. 앱에서 임의 핫링크하라는 뜻이 아니다. 사진 수락 후 로컬 파일/체크섬/제작 변형/배포 allowlist를 기록하고 실제 앱에서 크레딧을 확인해야 한다.

## 3. 새 장소 12곳 — 조사 후보, 승인/삽입 아님

모두 음식·카페 지점이다. 시장 전체나 지역을 단일 가맹점으로 바꾸지 않았다. 이름·주소·분류·메뉴의 사실 근거와 원본 지도 좌표를 분리했다. 영업시간/가격/현재 혼잡도는 이번 후보 데이터로 가져오지 않는다.

| 도시 | 후보와 일차 사실 출처 | 좌표 상태 | 사진 상태 |
| --- | --- | --- | --- |
| 서울 | [학림다방](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=47863) | KTO 좌표와 Commons 공개 좌표 약 16m 차이로 교차 대조. 정밀 출입구 측량 아님 | 01 간판 시각/권리 검토, 상단 크롭 조건. 로컬 파일·앱 승인 남음 |
| 서울 | [토속촌삼계탕](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=97919) | 공식 페이지 좌표 추출; 지도 대조 남음 | 발견한 Commons 파일의 허가 문구 충돌로 보류 |
| 서울 | [명동교자 본점](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=99925) | 공식 페이지 좌표 추출; 지도 대조 남음 | 파일별 재사용 권한 미확보 |
| 서울 | [청수당 익선](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=187836) | 기사 지도 index 5 추출; 해당 지점 바인딩 재확인 필요 | 권리 미확보, 기사 작성 시점도 2023년이라 현재 운영 확인 필요 |
| 부산 | [브라운핸즈백제](https://www.visitbusan.net/index.do?lang_cd=en&menuCd=DOM_000000301002001000&uc_seq=231) | 공식 페이지 좌표 추출; 지도 대조 남음 | 파일별 재사용 권한 미확보 |
| 부산 | [초량1941](https://www.visitbusan.net/index.do?lang_cd=en&menuCd=DOM_000000301002001000&uc_seq=245) | 공식 페이지 좌표 추출; 지도 대조 남음 | 파일별 재사용 권한 미확보 |
| 부산 | [금수복국 해운대본점](https://www.visitbusan.net/index.do?menuCd=DOM_000000202017001000&uc_seq=1941) | 공식 페이지 좌표 추출; 지도 대조 남음 | 파일별 재사용 권한 미확보 |
| 부산 | [신발원](https://www.visitbusan.net/index.do?menuCd=DOM_000000201001001000&uc_seq=242) | 공식 페이지 좌표 추출; 지도 대조 남음 | 파일별 재사용 권한 미확보 |
| 제주 | [신설오름](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000020185&menuId=DOM_000001719000000000) | 공식 1차 좌표만 확보. 두 번째 좌표 대조 전 새 핀 보류 | CC BY 음식 사진 시각 확인, 2019 사진이라는 한계 유지 |
| 제주 | [봄날](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000018337&menuId=DOM_000002017001000000) | 공식 페이지 좌표 추출; 지도 대조 남음 | 파일별 재사용 권한 미확보 |
| 제주 | [명진전복](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000020047&menuId=DOM_000001719000000000) | 공식 페이지 좌표 추출; 지도 대조 남음 | 파일별 재사용 권한 미확보 |
| 제주 | [자매국수 본점](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_200000000012575) | **주소/좌표 충돌 의심으로 accepted 좌표 null** | 파일별 재사용 권한 미확보 |

좌표는 KTO JSON-LD, 부산 공개 지도 입력 필드, 제주 공개 latitude/longitude 필드에서 읽었다. 11개 원본 좌표쌍을 확보했지만 청수당의 기사-마커 연결 확인은 미완료이며, 자매국수 원본 좌표쌍은 수락하지 않았다. 출처에서 읽었다는 사실과 올바른 문앞 핀 검수 완료는 다르다.

기존 canonical 400개 및 연구 24개의 이름을 NFKC/공백·구두점 정규화해 비교했고, 제주 editorial 10개 seed 이름도 대조했다. 이번 12개에 동일 이름 매치는 없었다. canonical 주소 prefix 비교도 0건이었다. 이는 모든 별칭/동일건물 업소 동일성이 증명되었다는 뜻이 아니므로 앱 반영 전 주소·별칭을 독립 검토한다. 기존 ID/저장/주문/예약/return 참조는 하나도 수정하지 않았다.

## 4. 거절해야 하는 쉬운 오인

1. [London Bagel Museum Jamsil 샌드위치](https://commons.wikimedia.org/wiki/File:런던베이글뮤지엄_잠실점_브릭레인_샌드위치.jpg)는 CC 라이선스가 있어도 기존 **도산점** 사진이 아니다.
2. [Momos METADATA013551](https://visitbusan.net/archive/dataSearch/view.nm?dataSid=METADATA013551)은 제목이 비슷하지만 전포동 주소/MP4다. 영도 JPG의 대체 근거로 삼지 않는다.
3. [Tosokchon 2016 Commons 파일](https://commons.wikimedia.org/wiki/File:Malbok_Tosokchon_Samgyetang_01_(28730531750).jpg)은 CC 표기와 보도/개인사용 제한 문구가 함께 있어 이번 수락 대상에서 제외한다. 라이선스 충돌을 임의로 해석해 배포하지 않는다.
4. 자매국수의 공식 페이지는 이호동 항골남길 46을 적으면서 `33.5168201,126.5169905`를 내보낸다. 주소와 핀이 일치하는지 별도 출처로 확인 전까지 지도 노출을 막는다.
5. 관광 페이지의 날씨·혼잡도·조회수는 이 앱의 live heat 원천이 아니다. 사진에도 실제 방문/가맹/결제수락/예약 가능/현재 인기 배지를 붙이지 않는다.

## 5. 수락 게이트와 후속 입력

- 파일 단위 권한 → 정확한 지점·장면 → 사진 시점 → 인물/상표 오인 위험 → 원본/해시 → 크롭·압축·alt/credit → 로컬 배포 경로 → 기존 ID 연결 → 독립 UX/PRD 승인 순으로 검토한다.
- 첫 앱 통합은 위 두 기존 장소의 검증된 사진만 따로 제안할 수 있다. 12개 후보를 채우기 위해 권리/좌표 불확실한 항목을 넣지 않는다.
- 콘텐츠 출처/실제 사진 필드와 sample merchant capability는 분리한다. 후보 추가만으로 sample commerce 27개, 실제 가맹/혜택, VP 조건, 결제/예약 가능 여부를 자동 확장하지 않는다.
- 사용자 입력이 필요한 경우는 권리 불명 사진을 꼭 써야 할 때다: 권리자 원본과 웹/앱 공개 사용·변형 허가, 정확한 촬영 지점/날짜, 원하는 크레딧을 받아야 한다. 이번 조사에서는 권리자 연락·로그인·외부 제출을 하지 않았다. 공공누리 파일은 별도 허가를 추정할 필요 없이 명시된 정상 다운로드 절차가 남은 상태다.

## 6. 초기 체크포인트에서 검증한 범위 — 후속 결과와 구분

- JSON 파싱 PASS: 24개 기존 사진 audit, 12개 유일 후보 ID, 도시별 4개, manifest 7개.
- 후보 → media ID 참조 누락 0, canonical 주소 prefix 매치 0, 앱 통합 허용 true 0.
- 실제 사진 시각 검수: 기존 장소 미리보기 2건만. 새 후보 사진 원본 검수·기기 렌더·네트워크 실패 UX 검수는 아직 아님.
- 웹 검색/공개 GET과 메모리 이미지 확인만 수행. 앱 소스/스키마/상태·프로바이더·계정·배포 변경 없음. 테스트/빌드는 수행하지 않았다.

## 7. 후속 독립 콘텐츠 게이트

- **어니언 승인:** 실제 전달 JPEG는 1200×800, SHA-256 `99c36696d3900d0224adcb6c548c2ac1b19744d2526db1ae9447a36af16daa23`. 연구 카드 4:3와 상세 1:1에 CSS object-fit만 적용하는 범위를 승인했다. About this pick의 Christopher Phua/Unsplash 크레딧·출처·라이선스를 유지한다. 2025-03-01은 게시일이며 촬영일/현재 메뉴로 바꾸지 않는다. 실제 UI QA PASS는 아직 이 기록의 주장이 아니다.
- **새 장소 초안은 학림 1곳만:** KTO 공개 JSON-LD `37.5819287995496,127.001679855807`과 [Commons 공개 지점](https://commons.wikimedia.org/wiki/Category:Hakrim_Dabang)의 `37.5818,127.0016`은 약 16m 차이다. 두 번째 출처는 커뮤니티 좌표이지 현장 측량이 아니다. 기존 400 canonical·24 research·제주 editorial 10개의 정확 ID/정규화 이름/주소 prefix와 겹침은 확인되지 않았다. EN/KO/JA `appDataDraft`를 후보 JSON에 제안했으며 기존 ID는 바꾸지 않는다.
- **학림 미디어 전달 조건:** 원본 encoded pixels는 4032×3024, EXIF orientation 6을 반영하면 3024×4032 세로 사진이다. 방향을 무시한 재인코딩은 금지한다. `object-position: 50% 0%`로 간판을 남긴 상단 4:3/1:1 크롭만 수락하며, 현재 중앙 크롭 구현을 그대로 재사용 가능하다고 가정하지 않는다. 로컬 파일/해시·출처 및 CC BY-SA 이미지 변경 표시·실제 앱 QA 후 root가 추가 여부를 결정한다.
- **신설오름은 보류:** VisitJeju의 좌표와 KTO의 업소 사실/사진 원게시글은 확보했으나 두 번째 좌표쌍은 확인하지 못했다. 승인 수를 맞추려고 새 핀이나 현재 메뉴 주장을 추가하지 않는다.
- **권한 경계:** 새 장소 초안은 콘텐츠만이다. sample service 27개, 가맹·혜택·결제·예약 capability, heat/signal은 확대하지 않는다. 이 연구 담당자는 앱 파일/실제 공급자/배포를 변경하지 않았다. root의 어니언 앱 작업은 이 문서 수정과 별개다.
