# 발견·정보구조 독립 검토 · 2026-09-16

상태: **초기 관찰 고정 / 구현 승인 아님**. 기준 소스 `173e71c`; 조사 중 작업 브랜치는 `feat/ktour-ux-polish-20260916`로 전환됐다. 다른 mapper의 이번 라운드 결과를 읽기 전에 아래 4개 후보를 작성했다. 이 문서의 근거는 활성 코드 조사이며 새 브라우저 실행·실기기 검수·사용성 조사 PASS가 아니다.

보호 기준: [preservation](./preservation.md), [UX08 목업 인계](../../EXPERIENCE_MOCK_HANDOFF_2026-09-15.md). 초기 지도 진입, 기능별 동의와 상태, 출처/샘플 경계, 같은 장소 복귀, Person·Age·Payment 분리를 유지한다. 기존 9/15 mapper의 완료 판정을 새로운 후보의 실행 증거로 사용하지 않는다.

## 활성 범위 확인

- `features/ondo/app/ondo-product-b.tsx:27–32`: 공개 B 지도와 canonical/editorial 장소·commerce·선택 설정·experience·ID setup·공통 gate가 실제 mount된다. 별도 A용 `onboarding-layer.tsx`는 이번 후보의 근거가 아니다.
- `features/ondo/onboarding/official-directory-onboarding.tsx:35–37`: 처음 방문의 `NEW`는 설정 sheet를 열지 않는다. 명시 설정 행동으로 시작한 `ONB-IN-PROGRESS`만 연다. **첫 진입에 설문이 강제된다는 결함은 현재 코드에 없다.**
- `features/ondo/map/map-entry-b.tsx:3680–3709`: 한 목록 안에 연구 장소와 canonical/editorial 장소가 공존한다. 출처 차이는 보존하되 사용자가 경험하는 정보/행동 위계는 별도 검토할 수 있다.
- `features/ondo/experience-b/experience-b.tsx:29–41`: UX08은 sample mode의 Roba 전체 상세 한 행이며 다른 매장이나 peek에 임의 확장되지 않는다.

## 후보 요약

| ID | 개선 대상 | 독립 판단 | 필요한 다음 단계 |
|---|---|---|---|
| D01 | 선택형 내 지도 설정 | 조건부·후순위 | 실제 편집 이득과 의도적 지도 reset 여부 확인 후 단일 폼 판단 |
| D02 | 연구 장소 상세의 주 행동 | 조건부 추천 | 거래/시각 역할 합의 및 짧은 화면 비교 |
| D03 | UX08 패스 보관 전 준비 클릭 | 우선 추천·보호 조건부 | 자동 준비의 최신성·중복·실패 검사 후 구현 가능 |
| D04 | 일반 가이드와 인증 부담의 가치 충돌 | **사용자 선택 대기** | 가이드 공개/선택 저장 또는 기존 열람 gate 중 제품 결정 |

## D01 · 이미 선택한 지도를 다시 설정할 때의 3단계

**근거:** [선택 설정 소스](../../../k-tour-id-app/features/ondo/onboarding/official-directory-onboarding.tsx) 13, 40–46, 57–94, 96–102행. `intent → area → preferences` 세 화면, 두 번의 단계 이동, 마지막 저장이 필요하다. 설정 진입·취소·일부 Back은 국가 지도 focus를 요청한다. 현재 선택을 draft로 복사하고 최종 `completeOnboarding`만 저장하며, 저장 실패/취소 경로는 별도다.

- Before: Settings에서 편집 → 여행 목적 → 지역 → 취향 → `지도 열기`. 이미 알고 있는 선택도 앞 단계부터 지나간다. 이 흐름은 **첫 진입 문제가 아니라 선택 설정 편집 문제**다.
- After 후보: 동일 선택을 한 폼의 `여행 방식 / 시작 지역 / 관심사` 섹션으로 보여주고 `적용 / 취소` 한 쌍으로 끝낸다. 식이 조건은 현재처럼 펼침으로 유지한다. 기존 지역/목적은 먼저 선택된 상태로 보이며 선택 수정만 한다.
- 보호 상태: nearby/living의 지역 필수 조건, short_trip의 지역 생략, 3도시·3언어·식이 unknown, draft/저장실패/취소·재진입, durable 저장 성공 전 기존 설정 불변. 선택 취향으로 장소를 숨기지 않는다. 국가 지도로 reset하는 연출이 의도적이면 이를 결함으로 삭제하지 않는다.
- 검수: 같은 Busan+café 상태에서 취향 한 개만 바꾸기까지의 결정 수를 비교한다. 저장/취소 각각 URL·city·query·category·view·카메라·list scroll을 전후 계측한다. 현재 reset과 복원 동작을 먼저 측정하고, 단일 폼에서 320×480 JA가 더 긴 읽기/스크롤을 만드는지 비교한다. 언어 변경의 기존 즉시 적용 의미를 몰래 취소 거래에 포함하지 않는다.
- 판정: 첫 진입 차단이 아니므로 급한 개선으로 부풀리지 않는다. 실제 편집 이득과 context 정책이 확인될 때만 진행한다.

## D02 · 연구 장소 상세에서는 길찾기가 계속 가장 강한 행동

**근거:** [research 상세](../../../k-tour-id-app/features/ondo/map/researched-food-panel-b.tsx) 30–42행은 본문에 장소·혜택/예약·활동·이유를 두고, 고정 footer에는 외부 `Directions`와 `On map`을 둔다. [공유 장소 행동](../../../k-tour-id-app/features/ondo/place/place-service-actions-b.tsx) 19–35행의 peek은 이미 등록 capability를 주 행동으로 사용한다. [canonical 상세](../../../k-tour-id-app/features/ondo/place/canonical-place-overlay.tsx) 1143–1159행은 혜택·예약·모임·저장·길찾기를 본문에서 제공한다.

- Before: 등록된 research 장소에서 `혜택 확인 / 예약`은 본문 스크롤과 함께 사라지지만 외부 길찾기는 footer를 계속 차지한다. peek에서 강화한 앱 내 다음 행동과 상세의 위계가 달라진다. 정확한 fold 위치는 이번 조사에서 실행하지 않았다.
- After 후보: **등록된 research 장소에 한해** footer의 주 행동을 기존 `혜택 확인`으로, 보조를 `지도에서 보기`로 한다. 같은 혜택 버튼은 본문과 중복 노출하지 않고 한 소유자로 둔다. 예약은 구별된 본문 행, 외부 길찾기는 주소 근처 보조 링크로 보존한다. 미등록 장소는 지금처럼 탐색·길찾기가 가능해야 한다.
- 보호 상태: 실제 제휴/결제 가능성 추정 금지, registry/sample mode만 capability 허용, 선택 매장/offer ID, 이전 quote와 재동의, 예약과 함께 먹기 분리, 외부 링크, 정확한 장소·scroll·focus 복귀. peek의 두 CTA를 늘리지 않는다.
- 검수: registered Zest/Jeju 장소와 비등록 장소, review on/off, 320×480 JA 및 390 EN에서 주 행동 first-frame hit/focus를 확인한다. 키보드로 혜택·예약·지도·길찾기를 모두 접근한다. 결제/취소 후 같은 상세·기존 disclosure·scroll 복원과 원 order 귀속을 재검증한다. footer를 옮겨 DOM focus 앵커를 없애지 않는다.
- 판정: 사용자가 요청했던 길찾기 우선순위 하향과 맞는다. 다만 거래 역할의 CTA 소유권, 시각 역할의 footer 높이·줄바꿈 합의가 필요하다.

## D03 · 동의 뒤의 ‘샘플 수신 내역 준비’는 자동 처리할 수 있는 준비 단계

**근거:** [setup](../../../k-tour-id-app/features/ondo/identity-b/ktour-id-setup-b.tsx) 873행은 같은 액션의 Person 결과를 이용한 **생성·보관 동의**다. 그 뒤 [holder](../../../k-tour-id-app/features/ondo/identity-b/identity-holder-step-b.tsx) 8–11, 22–33행은 `샘플 수신 내역 준비` 버튼으로 `onPrepare()`를 호출하고, 다시 `수신 확인하고 샘플 패스 저장` 버튼으로 ack한다. setup 278–282, 870행의 진행 표시는 UX08의 이 시점에서 이미 3단계이며 별도 Person/VP/실행 승인과 구분된다.

- Before: Person 확인 → 패스 생성·보관 동의 → **준비 버튼** → 준비된 수신 화면 → **수신 확인·보관 버튼** → 목적별 VP → 단일 실행 범위 승인. 준비와 수신 확인은 같은 기술적 보관 작업 안에서도 서로 다른 조작이다.
- After 후보: **이번 UX08의 방금 확인한 Person 재사용 경로에만** 명시 생성 동의 직후 holder 준비를 자동 수행한다. 같은 패스 작업 틀에서 짧은 진행 상태 → 보관할 내용과 `확인하고 패스에 보관` 버튼을 보여준다. 성공했을 때만 수신 내용을 제시하고, 실패·만료·취소는 해당 복구 상태를 그대로 보여준다. 실질 판단이 없는 준비 클릭 한 번만 줄인다.
- 보호 상태: Person 동의, 발급/보관 요청 동의, holder ack, 목적별 VP 동의, 도우미 단일 실행 승인을 합치거나 대리 승인하지 않는다. `onPrepare` 검증 자체는 삭제하지 않는다. same-token/intent/receipt·scope 최신성을 준비와 최종 ack에서 재검증한다. Person-only claim과 독립 Age/Payment 정책을 유지한다.
- 검수: 자동 준비가 재렌더/StrictMode/중복 이벤트에서 최대 한 번만 실행되는지, 준비 후 ack 전 패스가 없는지, holder 실패/취소/receipt 만료·교체 시 저장0인지 확인한다. 마지막 mutation=false의 만료 복구, 새로고침 시 저장 이력만으로 live handoff를 복구하지 않음, 전체 추가 확인/기존 금융 발급 경로 불변을 재검증한다. 320 JA의 목적·요청자·신원 확인 여부·보관 대상·CTA 가시성도 검사한다.
- 문구 원칙: primary는 `수신 내역 준비` 같은 프로토콜 동작이 아니라 사용자가 하는 `확인하고 보관`을 말한다. 기술 이름·긴 샘플 한계는 기존 상세 설명에 두되 짧은 미리보기 표시는 같은 화면에 남긴다. 동의 범위를 설명하기 위해 필요한 내용은 숨기지 않는다.
- 판정: 가장 작은 범위로 인지·조작 비용을 줄이는 우선 후보다. 단, 자동 준비 후 ack를 자동화하는 것은 이 후보에 포함되지 않는다.

## D04 · 일반 음식 팁과 강한 신원 요구 사이의 가치 불일치

**근거:** [체험 화면](../../../k-tour-id-app/features/ondo/experience-b/experience-b.tsx) 222–239행은 offer에서 eligibility 확인을 시작하고 목적별 gate 뒤 실행 승인까지 요구한다. 실제 제공되는 것은 242행의 3개 텍스트 팁이다. [문구](../../../k-tour-id-app/features/ondo/experience-b/experience-copy-b.ts)는 공유 음식, 덜 맵게 요청하기, 짧은 산책 등 일반적 내용을 제공하며 실물·금전·방문 증명을 명시적으로 제공하지 않는다.

- Before: 유익하지만 일반적인 공개 여행 정보를 얻기 위해 Account/Person/패스/VP/실행 승인 흐름을 지나간다. 정교한 승인 UX만으로 ‘왜 이 정도 확인이 필요한가’라는 가치 질문을 해결할 수 없다.
- 선택 A: 가이드는 인증 없이 먼저 읽고, **`내 패스에 담기`를 고른 사람만** 현재의 신원·패스·한정 실행·사용·기록 흐름을 진행한다. 공개 열람/미리보기는 fulfillment나 사용1회 기록을 만들지 않고, 선택적 저장이 서버 entitlement의 새 목적임을 명세와 함께 명시 결정해야 한다.
- 선택 B: 지금의 열람 gate를 유지하되, 강한 신원 확인이 필요한 실제 가치를 별도로 정한다. 어떤 가치인지·이용 자격·제공 책임·리서치 리소스가 필요하므로 임의 쿠폰/제휴/방문 인증을 만들어 해결하지 않는다.
- 보호 상태: 네 해커톤 기술의 책임과 동의·single-use·현재 자격 재검증·독립 audit를 지우지 않는다. 공개된 팁을 읽었다고 서비스 사용/방문/혜택을 부여하지 않는다. 실서비스처럼 보이는 물리 매장 약속을 추가하지 않는다.
- 검수: 선택 A면 새 방문자의 무인증 열람과 선택 저장의 갈림길, 이미 저장한 요청 재조회, 취소·unknown·consumed-but-blocked·audit pending, 원 장소 복귀/잔액·방문 불변을 각각 검사한다. 선택 B는 정해진 가치와 실제 근거를 먼저 검증한다.
- 판정: **HOLD — 사용자 선택 필요.** root가 2026-09-16 비동기 질문을 전달했으며 답변 전에는 어느 대안도 구현 확정으로 간주하지 않는다. 이 후보는 단순 문구 다듬기나 기능 누락 수정과 구분한다.

## 다음 합의·검수 경계

1. 이 초기 독립 관찰을 고정한 뒤 거래/시각 역할의 이번 라운드 결과와 교차검토한다.
2. D03의 보호 조건부터 합의하고 D02는 footer/행동 소유권 충돌을 해결한다. D01은 context 정책과 실제 편집 이득을 확인한 다음 판단한다. D04는 사용자 답을 기다린다.
3. 구현 승인 시 후보별 작성자와 비작성자 검수자를 분리한다. 이번 조사로 ‘전체 UX 완벽’이나 모든 분기 실행 완료를 주장하지 않는다.

## 초기 고정 이후 · 기존 sitemap와 UX08의 구체 delta

이 절은 위 초기 제안 고정 후 기존 [code JSON](./sitemap-code.json)과 [code MD](./sitemap-code.md), [browser MD](./sitemap-browser.md)를 대조해 덧붙였다. 이번 거래 mapper의 신규 관찰은 아직 읽지 않았다. **기존 숫자나 관찰을 합산해 새 QA 완료율을 만들지 않는다.**

### 구조 누락과 보충표의 상태 · 동기화 전 최초 관찰 이력

- 기존 JSON은 실제로 `nodes.length=78`, `edges.length=264`(명시 cross-surface189 + 내부 묶음75)다. node/edge 전체에서 `experience` 또는 `REDEEM_DEMO_ENTITLEMENT`를 가진 항목은 **0**이다. `ID_SETUP.steps`에도 `verified_person_consent`가 없다.
- MD의 `UX08-ENTRY/PERSON/PROPOSAL/EXECUTION/RESULT/RESUME` 6개는 흐름 보충 ID다. 6개 화면/노드나 6개 PASS를 뜻하지 않으며 JSON graph에 아직 병합되지 않았다.
- 소스 manifest를 현재 코드에서 읽으면 **178 entries / 177 unique files**이며, 기존 기록173/172보다 각각5 증가했다. 추가된 것은 `experience-b`의 model/store/copy/component/CSS 5개다. 이전 AST anchor772·타입285 등의 전체 재추출은 하지 않았다. 파일 수는 테스트 수가 아니다.
- 초기 조사 시 `sitemap-code.md` 보충의 ‘추가 중/실제 도달 대기’ 문구는 이미 배포된 `173e71c` 기준과 오래된 표현이다. 실제 버전별 범위는 [체험 릴리스](../../KTOUR_EXPERIENCE_RELEASE_2026-09-15.md)와 독립 visual 기록이 정본이며, parent가 이 문서 동기화를 담당한다. browser MD의 역사 CODE-08 HOLD와 그 뒤 사용자 승인된 UX08은 시점이 다르다.

### 다음 graph 갱신에 넣을 노드·속성 delta · 구현 전 제안 이력

기존의 의미 단위 묶음 방식을 따른다면 **새 UI 의미 노드 `EXPERIENCE_FLOW` 한 개**를 추가하고 아래 기존 노드를 보강하는 편이 적절하다. receipt/authorization/audit enum마다 새 페이지를 만들지 않는다. 정확한 전체 재계수는 JSON 통합 후 별도로 수행한다.

| 노드 | 추가/변경할 코드 기반 내용 | 근거 |
|---|---|---|
| **NEW `EXPERIENCE_FLOW`** | 단계 `loading, offer, proposal, running, unknown, failed, pending, complete, blocked, cancelled, cancelPending, expired`. `error`·`busy`는 병행 표시이고 별도 페이지 아님. authorization7 / fulfillment4 / audit4 enum은 독립 축이지만 7×4×4가 유효 상태 수는 아님 | experience-b.tsx:181–249, experience-model-b.ts:15–31,137–164 |
| `PLACE_SERVICE_ENTRY` | canonical Roba/sample mode에만 동네 가이드 행. peek 행 추가 없음 | experience-b.tsx:29–37, place-service-actions-b.tsx:66 |
| `ACTION_GATE` | 새 CTA `REDEEM_DEMO_ENTITLEMENT`, exact place/campaign/intent, Account+Person 및 별도 purpose=person VP. 제한 패스의 추가 확인 버튼도 기존 정책 화면의 행동 | action-gate-contract-b.ts:67,183–197,267–273; coordinator:1345 |
| `ID_SETUP` | `verified_person_consent`와 same-action live handoff 경로; 제한 패스의 full-purpose 추가 확인은 기존 method/consent 화면을 재사용 | ktour-id-setup-b.tsx:400–420,618–623,675–689,873–883 |
| `ID_HOLDER_DELIVERY` | 현재 release에서는 준비/ack 두 행동 그대로. live handoff를 준비·ack에서 재검증, 마지막 저장 거절 시 닫힘 복구. D03 자동 준비는 아직 **미구현 후보** | ktour-id-setup-b.tsx:703–739, identity-holder-step-b.tsx:22–33 |
| `ID_CREDENTIAL` | Person-only 범위 구분(`:person-only`, Person service only) 및 별도 추가 확인 진입. 기본 full fixture와 구분 | ktour-id-setup-model-b.ts:134–160; setup:903,909–912 |
| `ID_RECOVERY` | 갱신 시 제한 claim과 issuance lineage 보존. full-purpose 재발급은 renewal과 다른 명시 경로 | ktour-id-setup-model-b.ts:167–182; setup:608–639 |
| `RELOAD_BOUNDARY` | experience IndexedDB fixed actor/campaign+revision 이력, session marker의 sheet 복원, runtime WeakMap permit 복원 불가, granted→unknown, 저장 차단/손상은 unavailable | experience-store-b.ts:17–66; experience-b.tsx:94–115,150–174 |

### cross-surface edge 누락 및 기존 edge 조건 보강

아래 `DX-*`는 **이번 검토의 delta 키**이며 영구 `E-*` 번호나 실행 PASS ID가 아니다.

| delta | from → to / 조건·행동 | 기존 JSON과의 관계 |
|---|---|---|
| DX-01 | `PLACE_SERVICE_ENTRY → EXPERIENCE_FLOW`: Roba 상세 행 선택, map snapshot capture | 새 연결. 기존 E-047의 canonical→service 경로 뒤에 추가 |
| DX-02 | `EXPERIENCE_FLOW → ACTION_GATE`: eligibility/recheck, same intent의 새 gate 요청 | 새 연결; experience-b.tsx:117–124 |
| DX-03 | `ACTION_GATE → EXPERIENCE_FLOW`: exact READY 소비/완료 후 runtime permit·proposal 또는 pending 재개; CANCEL은 권한/동의 없이 복귀 | 새 연결이며 READY/CANCEL의 서로 다른 mutation 조건을 명시; 126–157행 |
| DX-04 | `ID_SETUP → ID_HOLDER_DELIVERY`: 현재 Person handoff의 명시 pass 동의 뒤 provider 재실행 없이 보관 준비 | 새 bypass 연결. 기존 E-074/E-084 정상 발급 경로는 삭제하지 않음 |
| DX-05 | `EXPERIENCE_FLOW → CANONICAL_DETAIL`: close/return, 같은 Roba·focus=experience; granted면 unknown 처리, 취소로 추정하지 않음 | 새 연결; 108–115행 |
| DX-06 | `RELOAD_BOUNDARY → EXPERIENCE_FLOW`: open marker/이력 재조회, 같은 intent 복원; live permit은 복원하지 않음 | 새 연결; 94–105,167행 |
| DX-07 | `EXPERIENCE_FLOW → RELOAD_BOUNDARY`: IDB 읽기/commit/다른 탭 변경 후 refresh·거절·storage error | 새 상태 경계 연결; 78–106,162–166행 및 store:45–66 |
| DX-08 | `ID_CREDENTIAL → ID_SETUP`: limited pass의 명시 ‘다른 패스 확인 절차 보기’, 기존 full consent로 이동 | 새 연결. 갱신 E-088/E-089와 구분 |
| DX-M01 | E-097 `ACTION_GATE → ID_SETUP` | missing credential뿐 아니라 same-action Person shortcut 및 limited-pass service_not_entitled의 명시 추가 확인 조건 보강 |
| DX-M02 | E-086 `ID_HOLDER_DELIVERY → ID_CREDENTIAL` | scope=person과 full/recovery 구분, mutation false는 성공 edge 아님 |
| DX-M03 | E-090/E-091 presentation 경로 | 경험 목적 person/해당 audience·credential revision binding을 기존 financial purpose와 구분 |

`EXPERIENCE_FLOW` 내부 grouped transition은 최소 `propose/approve/execution/reconcile_execution/fulfill/audit/request_cancel/resolve_cancel/expire` 명령과 각 guard를 보존해야 한다. 특히 unknown 상태 조회≠재실행, consumed+blocked의 service 사용0, fulfilled+audit pending의 guide 접근 가능, revoke 확인 뒤 새 proposal은 같은 intent·새 동의라는 구분을 유지한다. 이 명령 9개를 9개 브라우저 PASS로 표기하지 않는다.

## 2026-09-16 합의 회신

- parent가 전달한 D02의 등록 research 상세 footer `혜택 → 지도`, 미등록 `지도 → 길찾기`와 본문 동일 offer 중복 제거에 발견 역할 **조건부 동의**했다. 예약·외부 길찾기·정확한 반환 및 mode/capability 경계를 유지해야 한다.
- Zest의 일반 `Offer/Meal offer`를 특정 메뉴를 창작하지 않는 **매장 결제** 표현으로 정리하는 방향에 동의했다.
- D03는 **experiencePerson 재사용 경로만** 자동 준비할 것을 권고했다. 모든 review holder에 확대하면 일반 발급·갱신·수동심사·취소 시나리오까지 바뀌므로 이번 승인에 포함하지 않는다.
- 기존 pulse 값의 같은 frame 변화에만 미세 강조를 주고 타이머/실데이터 의미는 바꾸지 않는 안은 reduced-motion·11px 최소 표시 유지 조건으로 동의했다. 직접 시각 검수를 했다는 뜻은 아니다.
- D04는 사용자 응답 전 계속 HOLD다.

## 합의 후 구현·구조 동기화 결과

**D03 소스 구현 완료, 이번 artifact 브라우저 검수는 대기.** `IdentityHolderStepB.autoPrepare`의 기본값은 false이며, `ktour-id-setup-b.tsx:899`에서 `experiencePersonRef.current !== null`인 경로에만 true를 전달한다. 발급/보관 동의 이후 준비를 한 번 실행하고, 기존 ‘확인하고 패스 저장’ acknowledgement 버튼은 그대로 사용한다. 일반 발급·갱신·추가 확인은 수동 준비 동작을 유지한다.

- 전후: 체험의 명시 패스 생성 동의 → **준비 클릭 → ack 클릭**에서, 동의 → **자동 준비 → ack 클릭**으로 1 action 감소. 신원 확인·패스 발급·VP·한정 실행 승인은 합치지 않는다.
- `prepareHolderOnceB`는 callback 전에 attempted를 기록한다. effect 재실행/동기 재진입에도 한 번만 준비하고, 실패한 시도를 자동 재시도하지 않는다. 명시 재시도는 새 mount에서 준비한다. 자동 준비는 `onAcknowledge`를 호출하지 않는다.
- 기존 준비/최종 ack의 live receipt·pending token·session TTL 검증과 최종 저장 false의 dismiss/issued ref 복구는 변경하지 않았다. 자동 준비가 claim/발급을 만들지 않는다.
- 검수: 새 실행형 helper 계약4 + 기존 JIT7 + experience31 = **targeted 42/42 PASS, 1.8초**. CSS import 불가로 처음 실패한 테스트 로더를 실제 helper 소스만 TypeScript transpile해 실행하도록 수정했다. 앱 오류로 보고하지 않는다. E2E의 fresh 체험은 자동 준비/receipt와 holder ack 정확히1회를 검사하도록 보강했다. 현재 라운드 브라우저 실행 결과는 아직 없음.

**Sitemap 통합 완료:** 위 제안 delta는 JSON `EXPERIENCE_FLOW`, `E-190`–`E-197`, `S-EXPERIENCE_FLOW`와 기존7노드에 반영했다. 재계수는 **79 nodes / cross edges197 / grouped rows76 / 총273행 / unique step176**이다. source manifest178행·177고유·코드128과 별도로 초기 AST772/285는 이력으로 보존했다. 모든 전이 조합 PASS가 아니며, 위 최초 관찰의 78/264와 ‘미구현 후보’는 명시적으로 이전 시점이다.

### B 거래 변경 비작성자 소스 검토

검토 범위는 `id-wallet-commerce-b.tsx`, `stablecoin-funding-b.tsx`, `action-gate-coordinator-b.tsx`의 이번 diff다. **승인, 신규 권한/원장 변경 없음.**

- `returnShortageKrw`는 displayed snapshot의 quote debit−balance를 KRW로 환산한 표시용 prop이다(2042행). 승인/견적 생성/원장에 입력되지 않는다. 1117–1123행은 ‘충전 전 부족 금액’을 명시하고 creditComplete 뒤 숫자를 숨긴다. 기존 승인 quote 복귀에서 추가 승인을 무조건 약속하지 않도록 ‘충전은 결제와 별개’로 제한했다.
- stablecoin 64–92행의 USDC/USDT·샘플 network·fee·quote expiry·signer guard·명시 funding-consent와 authorize 조건은 유지됐다. social account label만 일상어로 바꾸고 Sui zkLogin 및 미연결/브리지 가설 경계는 상세에 남겼다. 실제 네트워크 정보를 숨기지 않는다.
- coordinator는 checkout 표시 이름 3개만 변경했다. 자격/VP/중복 결제/환불/credit guard를 바꾸지 않았다. 메뉴나 매장 제공 서비스를 새로 주장하지 않는다. 소스 검토는 실제 충전/복귀 여정 PASS를 대신하지 않는다.

### 초기 독립 고정 뒤 B/C 문서 교차 판정

[B 거래 관찰](./review-20260916-transactions.md)과 [C 시각·콘텐츠](./review-20260916-visual-content.md)를 원문으로 대조했다. D02/C02/TX01의 행동 위계 개선은 동일 문제이며 기존 정확한 매장 액션 하나를 footer로 이동하는 조건을 유지한다. TX03/C의 이미 승인한 quote 복귀 경고에 동의하여 ‘반드시 재승인’이라는 약속은 제외했다. TX04 시스템 처리 클릭 자동화는 이번 D03과 다른 금융 행동 변경이므로 별도 보류한다. C의 신설오름 추가는 자료/사진 콘텐츠만이고 서비스 capability를 늘리지 않는 조건에 동의한다. 라이선스 자료를 A가 새로 재검색하거나 원본 파일을 직접 검사했다는 뜻은 아니다. D01은 의도적 설정 reset 정책 확인 전 미구현, D04는 사용자 선택 전 HOLD를 유지한다.

## 최종 artifact 실행 결과 · 이전 대기 상태 갱신

최종 로컬 `page-cb3c6ace225a6949.js` / `http://127.0.0.1:3116`, `tests/e2e/ktour-experience-entitlement.spec.ts`, mobile-chromium·workers1·retries0로 **8/8 PASS(110.15초)**. skip/flaky/unexpected/pageerror0, 프로세스 exit0 및 브라우저 종료 확인. JSON `/tmp/ktour-ux16-experience-release.json`, ignored 캡처 `artifacts/qa/ux16-experience-release`4개를 근거로 남긴다. GitHub 링크로 배포하지 않는다.

검사한 범위는 새 Person 재사용 여정에서 holder 자동 준비 후 **ack 정확히1회**와 별도 VP·실행 승인, 가이드 내용/같은 장소/새로고침 단일 사용, audit pending/failure의 기록만 재시도, consumed-but-service-blocked, unknown→중단 확인→같은 intent의 새 동의, IndexedDB unavailable, 두 same-origin 탭의 단일 실행·사용, 제한 Person 패스가 다른 서비스를 자동 허용하지 않고 **명시 full-purpose 재발급에서는 수동 준비와 ack를 유지**하는 경로다. 승인·가이드 캡처를 직접 열어 번호01–03과 고정 복귀 버튼의 표시를 확인했다.

위 소스 구현 절의 ‘브라우저 대기’는 실행 전 이력이며 이 절이 최신이다. 모든 만료/취소 타이밍·모든 언어/물리 기기의 전체 UX, 실제 제공자/금융/체인 연동 PASS는 아니다. 이번 결과 때문에 D04의 사용자 가치 선택이나 금융 상태 자동화 보류가 해제되지 않는다.
