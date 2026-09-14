# 매장 중심 지도·잔액 여정 — 2026-09-12

상태: 다섯 여정 구현·운영 배포·운영 URL 브라우저 검수 완료. 기존 운영 배포 기록을 이번 변경의 검증으로 사용하지 않는다.

## 현재 배포

- [운영 앱](https://ondo-tau.vercel.app) · Vercel `ondo` · production **Ready**.
- 배포 source `82ea4c9` (동일 runtime). 문서·QA 후속 커밋은 이 앱 소스와 별도다.
- Deployment `dpl_E8wWPKBCa3GnXvUvqGbag8E5VV62`.
- 고유 주소: `https://ondo-6ojlcpoqf-jaewook-9643s-projects.vercel.app`.
- 이 주소는 공개 **목업**이다. 실제 provider 연결, 실제 예약·자금 이동을 활성화하지 않았다.
- 직전 배포: source `3d02b84` / `dpl_FA5MJZAgDEp7NtPZsvpP7VjfmkXt` / `ondo-nxw07x3mb-jaewook-9643s-projects.vercel.app`. 모바일 12개는 PASS였으나 아래 태블릿·지도 겹침 두 건이 남아 있어 최종본으로 사용하지 않는다.
- 기능 추가 전 복구 기준: `dpl_9eg5EFadicvMWY9FnEexpfzeURNk` / `ondo-epoa8cmwc-jaewook-9643s-projects.vercel.app` / source `52f376e`. 이전 배포·사용자 데이터를 삭제하지 않았다.

## 사용자 경험 원칙

- 지도에서 매장 발견 → 이용·혜택 선택 → 필요한 자격만 확인 → 결제·결과 → 같은 매장으로 복귀.
- 길찾기·저장은 보조 행동. 상단 바를 추가하지 않으며 도시 지도 잔액 진입과 사용처 필터는 기존 영역에 배치한다.
- 소비자 금액은 KRW. ooKRW는 탭/키보드로 열 수 있는 잔액 안내·접힌 상세에서만 설명한다. 표시 금액과 내부 정산 단위를 실제 원화 상환권으로 혼동하지 않는다.
- 기술명은 주 CTA가 아니다. 실제 외부 예약·청구가 없다는 안내는 최종 확인·결과에 유지한다.
- 등록된 체험 기능은 실제 제휴·메뉴·재고·결제 수용의 증거가 아니다. `review=0`에는 체험 사용처 권한을 적용하지 않는다.

## 다섯 여정 / 수락 조건

| ID | 공개 화면에서 시작하는 여정 | 핵심 수락 조건 |
|---|---|---|
| MW-01 | 지도/추천 매장 → 혜택·결제 검토 → 필요한 자격 → 결제 → 같은 매장 | 추천/공식/편집 장소 출처 ID 유지. 새 매장의 금액·혜택·영수증이 이전 주문과 섞이지 않음 |
| MW-02 | 결제 검토 → 부족액 충전 → 같은 결제 검토 → 별도 동의 | 도착·반영 전 사용 불가. 충전은 자동 결제 아님. quote 만료·혜택 변경은 재검토 |
| MW-03 | 지도 잔액 → 충전 → 사용할 곳 보기 → 매장 선택 | 같은 공유 잔액, 등록 사용처만 지도에 표시, 필터 해제와 원 도시 복귀 가능 |
| MW-04 | 매장 → 해당 Table 또는 예약 → 날짜·인원 → 결과·취소 → 같은 매장 | 모임과 예약 원장 분리, 무료 행동에 결제/신원 강제 없음, 여러 매장 및 unknown 복구에서 장소·operation 보존 |
| MW-05 | 내역 → 해당 주문/예약 → 같은 매장, 환불 → 잔액 → 다른 사용처 | 다른 매장 주문의 영수증 재사용 금지, 확정 환불만 1회 반영, 보류액 포함 사용 가능 잔액 일치 |

## 연결 계약 / 개발자 구현

공유 매장 기능 정본: `k-tour-id-app/features/ondo/commerce-b/place-service-registry-b.ts`.

- `resolveCommercePlaceB`: source를 유지한 place ID, 표시 이름/도시/좌표, 등록된 offer/Table/예약 체험 지원 여부.
- `commercePlaceByOfferIdB`: offer → 소유 place 및 고정 체험 견적. 소비자 제공 금액·할인·다른 매장 ID를 신뢰하지 않는다.
- `PLACE_SERVICE_RETURN_EVENT_B`: `{ placeId, focus? }`를 사용한 동일 장소 복귀. 메모/증거/결제 secret을 event·URL에 담지 않는다.
- `SHOW_BALANCE_PLACES_EVENT_B`: `{ cityId? }`로 사용처 지도를 연다. wallet 연결 여부를 신원·연령·가맹점 지원 증거로 쓰지 않는다.

| 작업 | 실제 개발자가 구현할 것 | 기존 담당 |
|---|---|---|
| 매장 사용처 | source ID 정합성 검증, merchant/offer/capability API, 지원·중지·만료 상태. 조사 장소를 가맹점으로 자동 승격 금지 | BE-11, BE-07 |
| 공통 잔액·개별 주문 | 사용자별 잔액 원장과 주문별 상태/환불을 분리. 고유 order/operation/receipt ID, hold/available 금액, 중복 반영 방지, 사용자/매장 권한 | BE-06, BE-07, BE-08 |
| 충전 왕복 | 원 주문·quote·동의 목적 바인딩, 충전 결과 조회·확정 후 1회 credit, 만료 견적 재검토. 제출 성공만으로 credit/결제 완료 금지 | BE-06, BE-15, BE-16 |
| 매장별 예약 | venue/date/party/slot 견적 및 예약 API, 매장별 다중 이력, unknown 동일 operation 조회, 취소/환불 필요 정책은 별도 명시 | BE-09 |
| 내역과 복귀 | 계정/주문별 조회·pagination, 불변 영수증과 현재 환불 상태, 매장 복귀 context. 로그아웃/삭제 시 타 사용자 내역 노출 금지 | BE-01, BE-08, BE-12 |

화면 변경이 실제 CX/OpenDID/OmniOne Chain/Sui 연결을 뜻하지 않는다. 실제 SDK·서명·원장·운영 정책 인계는 [개발자 시작 문서](./DEVELOPER_START_HERE.md), [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md), [BE 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)의 기존 책임을 유지한다.

## 검수 증거

| 실행 범위 | 결과 / 증거 |
|---|---|
| 최종 전체 계약·문서 연결 | 826/826 PASS, 7.5초 · `map-wallet-contracts-final.log` (배포 소스 및 최종 인계 문서 동기화 후 재실행) |
| 최종 TypeScript / 배포용 build / client artifact scan | PASS · `map-wallet-typecheck-final.log`, `map-wallet-responsive-build.log` |
| 기능 기준선 `3d02b84` 로컬 신규 공개 UI 여정 | 12/12 PASS · `map-wallet-release.log` 및 디렉터리 |
| 기능 기준선 `3d02b84` 기존 결제·K-Pass 회귀 | 7/7 PASS · `map-wallet-legacy-regressions-verified` |
| 최종 `82ea4c9` 로컬 데스크톱·태블릿 | 2/2 PASS · `map-wallet-desktop-tablet-local-final` |
| 최종 운영 HTTP / 보안·구 경로·asset 경계 | PASS · `map-wallet-responsive-production-http.log` (root200, redirect308, discovery7, blocked26, asset19, public asset35) |
| 최종 운영 모바일 재실행 | 12/12 PASS, 1.9분, 재시도 없음 · `map-wallet-responsive-production.log` 및 디렉터리 |
| 최종 운영 데스크톱·태블릿 | 2/2 PASS, 15초, 재시도 없음 · `map-wallet-desktop-tablet-production-82ea4c9` |

증거 경로는 `k-tour-id-app/artifacts/qa/` 기준이다. 로컬 신규12개는 320/390/430px, EN/KO/JA, light/dark를 배치한 Chromium 검사다. 선호·온보딩만 준비하고 실제 공개 UI를 통해 매장 선택·충전·계정/결제 확인·필요 시 ID 발급 샘플과 1회 자격 제시·혜택·결제·환불·예약·취소를 수행했다. 돈/credential/주문 상태를 주입해 성공 화면만 캡처하지 않았다.

최종 운영 모바일도 같은 12개를 공개 주소에서 재실행했다. 추가 2개는 1440px EN light / 768px KO dark의 검색·잔액 진입·매장 CTA·결제 동의·지도 복귀·동일 도시 사용처 필터를 검증했다. 최종 운영 14개 runtime 기록에서 product, externalMap, externalAsset, externalPreview, navigationAbort는 모두 0건이다. 스크린샷으로 320px 충전 후 동의·혜택 영수증과 태블릿 결제/지도 배치를 확인했다. 과거 결과나 재실행을 합산하여 고유 여정 수를 부풀리지 않는다.

추가 세부 증거:

- 서로 다른 두 매장에서 하나의 잔액 사용 → 이전 주문만 환불 → 같은 장소 복귀.
- 부족액 충전의 source 확인만으로 credit되지 않음 → 도착 확인 → 원 quote 복귀 → 별도 동의 전 미결제.
- 혜택 신청 중 ID 준비 → 원 매장의 최소 자격 동의 → 해당 매장에만 할인 반영.
- 무료 예약에 ID/월렛 강제 없음. 예약 unknown → 닫기/reload → 동일 operation 조회 → 다른 장소의 독립 예약·취소 이력.
- 부산 연결 Table 참여 후 저장·동일 장소 복귀. 검색어/list/camera/focus 보존, 기존 After19와 사용처 필터 분리.
- 기존 승인/매입 unknown·재시도·부분/전액 환불, 연령 미달 거절·연령 보완·혜택 기간 만료·지출 한도 거절.

첫 시도에서 찾은 실제 결함(예약 내역이 Table 카드에 가려짐, 부산 Table 저장 목록 누락, 다크 결제 동의·Table 장소 라벨 대비, 한국어 단어 잘림)을 수정한 뒤 위 최종 후보에서 재검수했다. 초안 테스트의 잘못된 selector/복귀 타이밍/ID 단독 발급 화면 가정도 수정했다. 기존 만료 혜택 테스트는 금액이 ₩19,000→₩22,000으로 바뀐 뒤 동의 초기화가 정상임을 확인하고, **자동 결제 없음 → 새 동의 → 결제**를 검증하도록 강화했다. 최초 실패·중간 후보를 모두 최초 PASS로 기록하지 않는다.

중간 운영 `3d02b84`의 모바일 12개 PASS 이후 확장 검수에서 태블릿 결제 하단 영역이 동의를 가리는 현상과 사용처 필터가 지도 옵션 버튼을 가리는 현상을 발견했다. `82ea4c9`는 이 두 CSS 보정과 데스크톱·태블릿 회귀 테스트만 추가한 최종 소스다. 768px 세로 화면의 결제 하단을 문서 흐름에 두고 비 compact 지도의 필터를 옵션 버튼에서 분리했다. 실제 클릭 가능 여부·영역 비중첩 assertion을 유지한 채 로컬 2개 및 최종 운영 14개를 통과했다.

한계: 실제 iPhone Safari/Android 실기기와 실제 provider handoff는 미검증이다. 금융/credential/주문 샘플은 mount 세션이고 실제 durable 원장·provider finality가 아니다. 로컬 예약 복구도 실제 좌석 확정이 아니다. 전체 viewport×locale×theme 조합의 완전 검수나 실제 해커톤 기술 연결 완료를 주장하지 않는다. 기존 기준선174개·이전 영향27개는 [이전 전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md), 이전 운영 source는 [이전 운영 배포 기록](./PRODUCTION_RELEASE_2026-09-12.md)의 별도 증거다.
