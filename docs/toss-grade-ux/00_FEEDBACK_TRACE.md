# ONDO 사용자 피드백 추적 원장

상태: `THREE-DESIGNER CONSENSUS · IMPLEMENTATION TRACE`

이 문서는 이번 UX 재설계가 최근 화면만 다듬고 과거 피드백을 잊는 일을 막는다.
피드백을 그대로 화면에 추가하는 요구 목록이 아니라, 사용자의 문제 제기를 제품
원칙·Flow·교차 화면·검수 항목으로 변환한 추적표다. 최종 구현 판정은 각 Flow 문서의
acceptance criteria와 이 원장을 함께 사용한다.

## 1. 제품 방향 피드백

| 사용자 피드백 | 합의한 해석 | 닫히는 문서 | 구현·검수 증거 |
|---|---|---|---|
| 기존 뼈대를 많이 활용하고 이유 없는 새 Flow를 만들지 말 것 | reducer, state, fixture, `returnTo`, 정규 Flow ID를 유지하고 공통 primitive로 presentation만 재구성한다 | [UX standard](./00_UX_STANDARD.md), [PRD ledger](./00_PRD_PRESERVATION_LEDGER.md) | 기존 contract test + 변경 primitive 목록 |
| 단순화하다 PRD 기능을 삭제하지 말 것 | 문장·카드는 줄일 수 있지만 decision, truth, failure, retry, exact return은 삭제할 수 없다 | 모든 `FL-*`, PRD ledger | Flow별 preservation ledger |
| 각 기능이 따로 노는 데모가 아니라 유기적인 제품이어야 함 | `지도 발견 → 장소 행동 → 필요한 JIT 확인 → 결과 → 정확한 장소/기억 복귀`를 하나의 Golden Journey로 고정한다 | [Overview](./00_OVERVIEW.md), `FL-001`~`FL-018` | E2E journey + state restore snapshot |
| 실제 라이브 제품처럼 보여야 함 | 제작자 관점의 `preview`, `simulated`, `test`, `on-device`는 일반 제목·CTA에서 제거한다. 단, 금전·신원 오해를 막는 truth는 결정점에서 소비자 문장으로 남긴다 | UX standard, `FL-004`, `FL-005`~`FL-006`, `FL-012`, `FL-017`~`FL-018` | maker-language lint + truth review |
| ONDO와 K-Tour ID를 함께 쓰되 브랜드가 뒤섞이지 않게 할 것 | ONDO는 지도·발견의 소비자 브랜드, K-Tour ID는 필요한 순간의 private pass/identity/wallet 하위 브랜드다 | `X-01`, `FL-005`~`FL-009`, `FL-017`~`FL-018` | brand surface inventory |

## 2. 지도·발견 피드백

| 사용자 피드백 | 최종 설계 방향 | 닫히는 문서 | 반려 조건 |
|---|---|---|---|
| 기존 맛깔나던 지도 Home을 유지할 것 | 앱 첫 프레임부터 실제 MapLibre 대한민국 지도를 보여주고 별도 카드형 도시 선택 Home을 만들지 않는다 | `FL-001`, `X-04` | 지도 뒤늦게 mount, 흰 전환 화면 |
| 서울 CTA 뒤 전환이 딱딱하고 끊김 | 동일 map instance에서 atlas camera를 city camera로 `easeTo`; 유용한 map content가 보인 뒤 chrome을 순차 등장시킨다 | `FL-001`, `X-04` | route remount, 순간 컷, loading blank |
| 첫 지도가 한국인지 선명해야 함 | 실제 해안선·육지/바다 대비·주요 지리 윤곽을 mobile 첫 viewport에서도 읽히게 한다 | `FL-001` | 추상 점묘만 남고 해안선 식별 불가 |
| 서울·부산·제주의 위치가 정확해야 함 | 검증 좌표를 map coordinate로 사용하고 viewport별 임의 CSS offset으로 맞추지 않는다 | `FL-001` | label 위치와 실제 도시 anchor 불일치 |
| 세 도시가 선으로 유기적으로 연결돼 보이면 좋음 | 이동 경로를 뜻하는 얇은 atlas route를 보조 레이어로 사용하되 도시를 잇는 정확한 순서와 위치를 보존한다 | `FL-001` | 굵은 장식선이 지도보다 우세 |
| 도시 CTA가 지도를 너무 많이 가림 | 44px 이상 hit target을 가진 compact beacon/label을 쓰고 label은 겹침 회피만 수행한다 | `FL-001` | pill이 geography/다른 city를 가림 |
| ONDO 온도가 너무 미니멀하거나 이상한 덩어리로 보임 | `field → aura → core → selected halo → label`을 한 renderer로 사용하고 색은 데이터에만 쓴다 | `FL-001`, UX standard | 거대한 blur blob, 점수 텍스트 상시 노출 |
| 숫자·`Peak/Hot/Pulse`를 말로 표시하지 말고 온도를 시각화 | 기본 marker에서는 숫자·단계 라벨을 숨기고 선택·목록·상세에서만 정확한 score/freshness/confidence를 제공한다. `Pulse`는 소비자 용어에서 제거한다 | `FL-001`, `FL-016` | `91 · Peak`, `Pulse 운영 중` 상시 노출 |
| 제주도도 서울·부산과 같은 온도 UI여야 함 | 동일 geometry·size·selection·transition을 사용한다. 다만 `editorial-unscored`인 사실 때문에 limited ring/source chip만 다르며, editorial label은 좌표·장소 연결만 뜻한다 | `FL-001`, `X-03` | 제주만 다른 카드/빈 아바타/`Explore` CTA, editorial을 품질 확인으로 표현 |
| 제주 리스트·장소가 서울·부산과 다르게 보이면 안 됨 | 모든 도시가 공통 place card/detail primitive를 쓰고 source drawer만 official/editorial에 따라 달라진다 | `FL-001`, `FL-016`, `X-03` | editorial 전용 다른 정보 구조 |
| Stories를 별도 하단 Flow처럼 붙이지 말 것 | 제주 story는 지도 위 좌표·장소가 연결된 place edge와 장소 상세의 editorial layer로 연결한다. 이 연결은 품질·인기·현재 영업 확인이 아니다 | `X-03`, `FL-001` | 독립 promotional banner로만 존재, editorial 연결을 품질 인증처럼 표현 |
| 과한 범례·공식 기록 수·출처 설명이 공간을 차지함 | compact `MapKey`와 선택 가능한 source drawer로 이동한다. count는 다음 결정에 영향을 줄 때만 표시한다 | `FL-001`, `FL-016` | full-width 설명 카드, 닫기 어려운 attribution |
| `200 official records`, `인허가` 같은 공급자 언어가 친화적이지 않음 | 장소 수는 기본 hero에서 제거하고 source는 `공식 등록 정보`/`에디터가 연결한 장소`처럼 범위를 좁혀 표현한다 | `FL-001`, `FL-016`, `X-03` | 행정 데이터 용어가 primary copy, editorial을 품질·영업 확인으로 확대 |
| 처음 지도 loading도 엣지 있고 몰입감 있어야 함 | 실제 지도를 유지한 채 coast/route→heat field→label을 한 번만 reveal하고 800ms/5s recovery rule을 지킨다 | `X-04`, `FL-001` | 무한 pulse, splash 후 지도 교체 |
| 지도 hover 시 CTA가 도망가지 않아야 함 | pointer hover는 geometry를 이동시키지 않고 halo/contrast만 변경하며 touch와 keyboard focus를 동등하게 설계한다 | `FL-001` | hover transform으로 hit target 이동 |
| 위치 권한 안내 popover가 어색함 | locate control 인접 inline status로 짧게 표시하고 search 대안을 유지한다 | `FL-001`, `X-04` | 화면 중앙 기술 문장 modal |

## 3. 모바일·시각 체계 피드백

| 사용자 피드백 | 최종 설계 방향 | 닫히는 문서 | 반려 조건 |
|---|---|---|---|
| 모바일이 가장 중요하고 여백·폰트·잘림이 반복됨 | 390×844 source composition, 320/360/430 portrait와 844×390을 별도 acceptance로 둔다 | UX standard, 모든 `FL-*`, `X-04` | desktop 축소판, viewport 임시 offset |
| 하단 탭의 글자를 없애고 아이콘으로 전달 | phone은 5개 icon-only dock, 각 아이콘 48–56px hit area와 지역화된 accessible name을 가진다 | `X-01` | 영구 visible label, 의미 불명 아이콘 |
| 굳이 말하지 않아도 아이콘·픽토그램·UX로 알아야 함 | 상태가 구조·색·형태로 안전하게 대체되는 경우만 prose를 제거한다. 결제·동의·실패·공식/편집 경계에는 짧은 텍스트를 유지한다 | UX standard, 모든 `FL-*` | 장식 아이콘, 접근 가능한 이름 누락 |
| 화면이 누렇고 카드가 많음 | near-white/near-black을 기본으로 하고 heat accent만 제한적으로 사용한다. 정적 카드 위계는 그림자보다 spacing/border를 쓴다 | UX standard, `X-01` | beige wash, 모든 카드에 glow/elevation |
| 타이포와 줄바꿈이 어색함 | mobile type scale, 2줄 CTA 허용, 장소명을 제외한 결정 문구 ellipsis 금지, 200% zoom 검수 | UX standard, `X-04` | CTA·heading 잘림, 10px metadata 남발 |
| sheet/modal 하단이 잘리고 CTA가 가려짐 | content-fit/72dvh/88dvh/full-task 네 variant, 내부 scroll, sticky decision, safe-area/keyboard 계약을 사용한다 | `X-04`, gate 관련 Flow | viewport 바깥 primary CTA, 겹친 modal |
| 위쪽이 잘리거나 비스듬한 레이어가 보임 | 장식 pseudo-layer가 clipping context를 만들지 못하게 하고 app shell의 top/bottom insets를 하나의 layout token으로 고정한다 | `X-01`, `X-04` | transform/overflow 기반 임시 마스킹 |
| 목록에 음식점 사진이 있어야 먹고 싶은 느낌 | source-backed 사진을 우선하고 없으면 명백한 category illustration을 사용한다. 반복 crop과 빈 아바타를 금지한다 | `FL-001`, `X-03` | 가짜 venue photo, 연속 동일 이미지 |
| 실제 사람 이미지를 넣어 앱처럼 보이게 | Table invitation·여행 기억에는 동의된/synthetic 사람 이미지를 쓸 수 있지만 eKYC·credential·공식 장소 증거에는 쓰지 않는다 | `FL-003`, `FL-007`~`FL-009`, `FL-011` | 외모로 국적·성인·검증 상태 암시 |
| 로고가 진짜 브랜드처럼 보여야 함 | 제공된 K-Tour ID 자산을 ID/Wallet/pass surface에서 원본 비율로 사용하고 ONDO map brand와 위계를 분리한다 | `X-01`, `FL-005`~`FL-009`, `FL-017`~`FL-018` | 저해상도 원본 확대, 임의 재색상, 모든 화면 gradient화 |

## 4. 온보딩·K-Tour ID 피드백

| 사용자 피드백 | 최종 설계 방향 | 닫히는 문서 | 반려 조건 |
|---|---|---|---|
| OpenDID onboarding/eKYC가 빠지면 안 됨 | K-Tour ID의 Person 경로와 credential/evidence 상태를 보존하되 Guest map 진입을 막지 않고 JIT 행동에서 연결한다 | `FL-005`~`FL-009`, `FL-016` | 앱 시작 직후 강제 인증 또는 기능 삭제 |
| 단기·장기·내국인 구분을 요구사항 때문에 억지로 먼저 노출하지 말 것 | 온보딩에서는 여행 의도·언어·실제로 반영되는 취향을 묻고 persona는 관련 옵션/adapter를 준비하는 내부 context로만 쓴다 | `FL-007`~`FL-009` | 법적 지위 선택이 첫 질문 |
| 식음료 취향과 K-Tour ID가 긴밀히 연결돼야 함 | 취향은 즉시 지도 결과에 반영하고, 저장·Table·19+·혜택에서만 필요한 K-Tour ID 축을 readiness sheet로 이어준다 | `FL-007`~`FL-010` | 취향 저장 후 지도 변화 없음, 선제 ID setup |
| K-Tour ID setup 화면의 정보가 너무 많고 중복됨 | 한 화면 한 결정, 한 sheet shell, provider/`on-device`/법적 disclaimer는 상세로 이동한다 | `FL-005`~`FL-009`, `X-04` | `1–4` 단계와 긴 기술 문구 동시 노출 |
| `Optional · Explore without it` 같은 설명을 반복하지 말 것 | Guest 우선은 구조와 `지도 먼저 보기` escape action으로 표현한다 | `FL-007`~`FL-009` | optional을 headline로 반복 |
| setup과 present 단계가 섞임 | credential 준비 완료와 실제 요청자에게 proof를 제시하는 JIT present를 별도 사건으로 둔다 | `FL-005`~`FL-006`, `FL-016`~`FL-017` | setup 완료 전에 `Present` 단계 표시 |
| provider 미연결 상태를 이해하기 쉽게 | 일반 경로는 fail-closed/unverified, 성공 fixture는 명시적 QA/review mode에서만 provenance와 외부 연결 없음 범위를 갖고 가능하다 | `FL-005`~`FL-006`, `FL-017`~`FL-018` | 미연결 상태에서 verified 성공 연출, review fixture를 normal/Labs 결과로 노출 |

## 5. After19 피드백

| 사용자 피드백 | 최종 설계 방향 | 닫히는 문서 | 반려 조건 |
|---|---|---|---|
| 19+는 색 반전/dark/neon vibe로 구분 | 같은 지도 geometry를 유지하고 near-black basemap + 제한된 neon heat token으로 mode를 전환한다 | `FL-002`, `FL-013`, `FL-014` | 모든 component 무차별 반전 |
| 자동으로 술집 중심이되 일반 야간 장소를 없애지 말 것 | alcohol/age-restricted layer를 전면화하되 일반 심야 음식점·24시간 장소는 기본 layer에 유지한다 | `FL-014` | 일반 식당 전체 필터링 |
| 다크모드에서 지리와 컴포넌트가 안 보임 | light와 동일한 도로·지명·선택 geometry 대비를 보존하고 sheet는 dark token으로 일관되게 만든다 | `FL-014`, `X-04` | 회색 overlay로 전체 지도/시트 소실 |
| 수동 끄기·만료·정확한 장소 복귀 | 4 guard를 모두 만족할 때만 자동 ON, 즉시 OFF, 만료 시 locked venue와 camera 보존 | `FL-002`, `FL-013`, `FL-014` | Age가 Person/KYC를 겸함, 홈으로 복귀 |

## 6. 장소·Table·커뮤니티 피드백

| 사용자 피드백 | 최종 설계 방향 | 닫히는 문서 | 반려 조건 |
|---|---|---|---|
| 장소 상세가 설명 문단 중심이면 안 됨 | hero media, heat object, fact strip, 행동 순으로 재구성하고 source/근거는 drawer로 접는다 | `FL-001`, `FL-016` | 큰 설명 카드가 첫 viewport 점유 |
| `This is an ONDO presentation choice` 같은 문구 불필요 | 메이커 문구를 제거하고 source/availability truth를 해당 fact 상태에 붙인다 | `FL-016` | 일반 place detail에 제품 변명 문장 |
| 지도 장소와 지갑/결제가 떨어져 있음 | 장소의 실제 offer CTA에서 checkout을 시작하고 완료·실패 뒤 같은 장소와 금액으로 복귀한다 | `FL-004`, `FL-017` | Wallet 탭에서만 결제 가능 |
| Table이 음식·사람·약속처럼 보여야 함 | List에는 장소 사진과 시간·좌석·형식 등 비교 핵심 최대 4개, Join 전 Detail에는 메뉴·언어·비용/분담을 포함한 6개 사실 전부를 시각적으로 배치한다 | `FL-003` | 행정형 text card 목록, 320px List에 6개 사실 과밀 배치, Join 전 사실 누락 |
| 채팅·사진·피드백·안전 기능을 빼지 말 것 | membership/chat access/image lifecycle/check-in/feedback/report/block/leave를 독립 상태로 보존한다 | `FL-003`, `FL-015` | 참가와 채팅 권한 합침, 실패 이미지가 sent처럼 보임 |
| Local Signal이 기술 제출 화면처럼 보이지 않게 | 현장 사진과 선택 가능한 신호를 중심으로 만들고 저장 범위/실패는 결과에 한 번 표시한다 | `FL-012` | provider/storage 설명이 첫 viewport |

## 7. Wallet·stablecoin·혜택 피드백

| 사용자 피드백 | 최종 설계 방향 | 닫히는 문서 | 반려 조건 |
|---|---|---|---|
| 내국인·장기체류자는 은행 등으로 KRW 충전, 외국인은 USD/Apple Pay/USDC·USDT 경로를 이해할 수 있어야 함 | 소비자 funding source를 은행·카드·Apple Pay·USD wallet로 구분하되 국적·persona를 추론해 숨기지 않고 capability 기반 self-selection/추천만 한다. provider availability는 별도 상태다 | `FL-017`, `FL-018` | 국적 기반 강제 분기, source 선택만으로 Ready/충전 완료 표시 |
| 기본 단위는 KRW/USD, ticker는 상세에서만 | balance/offer/receipt는 `₩60,000`처럼 locale grouping을 사용하고 USD는 보조값; OOKRW/USDC/USDT/network는 결제 상세/Labs | `FL-004`, `FL-017`, `FL-018` | 일반 CTA/잔액에 ticker 노출 |
| 콤마·숫자 가독성 | tabular numeral, locale grouping, 금액 위계, 원가→혜택→최종 금액 관계를 사용한다 | `FL-004`, `FL-017` | `60 OOKRW Test`, 자릿수 구분 없음 |
| `Travel wallet`, test offer, simulation 같은 제작자 어휘를 줄일 것 | 소비자에게는 `여행 잔액`, `혜택`, `결제 준비`를 쓰고 실제 이동 없음은 decision/result에 한 번만 말한다 | `FL-004`, `FL-017`, `FL-018` | 성공처럼 꾸미고 truth를 접기 안에만 숨김 |
| non-zero 잔액과 “충전 없음” 모순 | 외부 source 미연결이면 0/draft 또는 출처가 명확한 준비 잔액만 보여준다 | `FL-004`, `FL-017`, `FL-018` | `₩60,000`과 `no funds added` 동시 표시 |
| 결제 성공과 stamp가 인과처럼 붙으면 안 됨 | checkout result와 별도의 unique visit evidence를 분리한 뒤에만 9→10 milestone을 만든다 | `FL-004` | 결제 버튼 직후 stamp 증가 |
| K-Tour ID/AA/DID/stablecoin 데모가 작동하는 서사를 보존 | 사용자 여정은 JIT gate와 exact return으로 단순화하되 내부 상태·fixture·Labs 기술 증거는 삭제하지 않는다 | `FL-004`~`FL-006`, `FL-010`, `FL-016`~`FL-018` | 하나의 `verified wallet` 상태로 통합 |

## 8. Settings·언어·개인 영역 피드백

| 사용자 피드백 | 최종 설계 방향 | 닫히는 문서 | 반려 조건 |
|---|---|---|---|
| Settings에서 언어가 너무 큰 범위를 차지함 | compact language row 또는 segmented control로 EN/KO/JA를 제공하고 결과를 즉시 전체 앱에 반영한다 | `X-02` | 전체 viewport를 언어 카드가 점유 |
| 일본어 지원 필요 | 모든 결정 CTA·error·a11y label을 EN/KO/JA로 검수하고 장소 고유명은 원문+필요 시 보조 표기한다 | 모든 `FL-*`, `X-03`, `X-04` | 영어 fallback이 핵심 행동에 노출 |
| `On this device Settings` 같은 eyebrow 불필요 | 제목은 `설정/Settings/設定`; storage truth는 데이터 관리 row 상세에서만 표시한다 | `X-02` | 기술 저장 위치가 페이지 헤드라인 |
| My Korea가 설정/관리 카드처럼 보이지 않게 | 저장·방문·Table·기여를 시간과 장소의 memory map/timeline으로 보여준다 | `FL-011` | 기능별 큰 admin card 묶음 |
| 공개 profile은 선택이어야 함 | From/Lives in/Languages 각 필드 opt-in과 네 reputation 축을 분리한다 | `FL-015` | 신원·국적 자동 공개, 단일 신뢰 점수 |

## 9. 구현 단계의 공통 adversarial 질문

아래 중 하나라도 `아니오`면 해당 화면은 완료가 아니다.

1. helper paragraph를 가려도 사용자가 다음 행동을 안다.
2. 문장을 지운 의미가 실제 상태·아이콘·공간·motion으로 대체됐다.
3. 색과 motion이 없어도 같은 의미와 행동을 찾을 수 있다.
4. 320px/200% zoom/KO·EN·JA에서 close, 핵심 객체, primary CTA가 잘리지 않는다.
5. 취소·실패·재시도 뒤 camera, filter, 장소, sheet, draft, focus가 정확히 복원된다.
6. 공식·편집, live·fixture, account·person·age·payment 상태를 합치지 않았다.
7. 실제 돈·신원·사람·제휴·인기처럼 오인할 시각 연출이 없다.
8. 새 전용 modal/card가 아니라 기존 상태 계약과 공통 primitive를 사용한다.
9. 서울·부산·제주의 공통 동작이 source 차이 때문에 갈라지지 않는다.
10. 구현자가 아닌 시각 리뷰어와 truth/state 리뷰어가 각각 승인했다.

## 10. 범위 밖 또는 후속 결정

- 정규 `/ondo-b`를 `/`로 전환하는 routing·deployment 작업은 이번 문서 단계의 구현
  범위가 아니다. 구현 파동에서 migration/redirect/SEO metadata를 함께 검증한다.
- Vercel URL, social thumbnail, favicon 교체도 구현·배포 파동에서 official asset 권리와
  실제 production URL을 확인한 뒤 수행한다.
- 실제 provider, 실제 eKYC, 실제 돈 이동, 실제 testnet tx, 운영 moderation은 현재 PRD의
  비범위다. 연결 전에는 frontend contract를 정직하게 보여주고 성공을 위조하지 않는다.
- 사용자가 제공한 `sources/`의 K-Tour ID 자산은 원본·파생 파일·사용 surface를 asset
  registry로 남긴 뒤 사용한다. 이 문서 단계에서는 파일을 이동하거나 변형하지 않는다.
