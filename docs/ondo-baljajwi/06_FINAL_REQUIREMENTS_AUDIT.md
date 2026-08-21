# ONDO B · 원요구 최종 반영 감사

상태: `PRODUCT IMPLEMENTATION AUDITED · R4 COMPLETE NOT CLEAN · 12/12 IMPLEMENTED · SUCCESSOR FULL GATES/TUPLE/FRESH CLOSURE PENDING · CLEAN STREAK 0/2 · NOT DEPLOYED`

| 항목 | 값 |
|---|---|
| R4-reviewed Product/Harness | `05f3002899485c528e31730bfebd57d71c3d788d` / `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` |
| R4-reviewed Pixel baseline | `46 × 6 = 276/276` no-update PASS · `46/46` each viewport · high-risk repeat `72/72` · digest `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d` |
| R4-reviewed Automated QA | discovery `348 tests / 25 files` · typecheck PASS · Webpack build `28/28` PASS · contracts `26/26` · B E2E `323 pass / 25 intentional viewport skips / 0 fail` · unexpected/flaky/runtime/geometry/Axe/modal errors `0` |
| Current integration | `06619cf4d1d8460b4af2cdb8f887deca7c76c208` · 12/12 implemented; successor Product/Harness/digest and full gates pending |
| Route | `/ondo-b` |
| 범위 | 외국인 우선 F&B 웹앱 프론트엔드 데모 |
| 실제 장소 | 서울 200 + 부산 200 = 400 |
| ONDO preview signal | 도시별 40, 총 80 · `SIMULATED` |
| After19 subset | night-category signal만 서울 7 + 부산 10 = 17 · `SIMULATED` |

이 문서는 사용자가 처음 제시한 다섯 가지 실행 질문과 열아홉 가지 제품·기술 아이디어가 현재 제품 source에 어떤 깊이로 반영됐는지 판정하는 source of truth다. 구현 존재와 release acceptance를 구분한다. R4는 검토 tuple에서 `5/5 COMPLETE · NOT CLEAN`이었고 raw `S2 12 + S3 2`, consolidated `10 S2 + 2 accepted S3`를 남겼다. 세 product/test slice와 legacy harness alignment가 integration head `06619cf…`까지 합쳐져 12개 구현은 완료됐지만 integrated full gates, successor tuple freeze, fresh R5/R6 closure는 pending이다. Clean streak는 `0/2`, 배포 상태는 `NOT DEPLOYED`다. 이전 [`ondo-execution`](../ondo-execution/00_EXECUTION_INDEX.md) 문서는 A/v2의 역사 기록이다.

## 1. 다섯 가지 실행 질문에 대한 답

| 질문 | 최종 답 | 근거와 경계 |
|---|---|---|
| 온보딩이 빠졌는가? | `아니오` | 새 3단계 온보딩이 실제로 있다. 가치 설명 → 단기 여행자/한국인/장기체류자 선택 → F&B 관심사 → Guest 지도이며, skip/failure도 인증 없이 지도로 간다. 기존 화면의 묵시적 재사용이 아니다. |
| 9시간 이상 무입력 병렬 실행이 가능한가? | `프론트엔드 데모에는 예` | 19 REQ, 18 Flow, 상태·fixture·실패·복귀·owner·merge·rollback·QA Gate가 고정돼 있다. 품질 Gate 미통과 시 2시간 단위 확장 루프를 자동 반복한다. 외부 계정·법무·provider provisioning·배포 권한은 자동 결정 범위가 아니다. |
| 만든 것의 명세가 빠짐없이 남는가? | `예, registry 기준` | 19/19 REQ, FL-001~018, 126 checkpoint(`121 ACTUAL / 5 N/A / 0 GAP`), 46 visual cases/44 states, 6 viewport/276 baseline, KO/EN surface와 외부 연동 등급을 추적한다. R4 reviewed-tuple automated QA와 실제 NOT CLEAN verdict를 보존하며 successor review·배포는 완료로 기록하지 않는다. |
| 한 번에 높은 완성도로 갈 만큼 구체적인가? | `프론트엔드 후보에는 예` | 성공만이 아니라 cancel/error/retry/returnTo, persistence, privacy, truth, a11y, map fallback까지 잠겼다. 실제 운영 서비스 완성은 백엔드·공급자·법무·운영체계가 별도 필요하다. |
| 많은 병렬 agent/token을 써도 충돌 없이 실행 가능한가? | `예, 실행팩 기준` | 경로 소유, frozen contracts, CCR, shared SHA 동기화, durable evidence, 동일 tuple의 두 clean round 규칙이 있다. 과거 clean round는 현재 제품에 재사용하지 않으며 현재 streak는 0/2다. 토큰 소진 자체를 품질로 보지 않고 Gate 실패·미해결 issue만 루프 조건으로 쓴다. |

## 2. 열아홉 가지 원요구 최종 매트릭스

등급은 `ACTUAL`, `SIMULATED`, `SIMULATED_LOCAL`, `CONTRACT_ONLY`, `NOT_CONFIGURED`, `DEFERRED`만 사용한다.

| # | 원래 생각 | 최종 반영 | 등급 | 제품에서 확인할 수 있는 것 | 아직 증명하지 않는 것 |
|---:|---|---|---|---|---|
| 1 | 한국인 OmniOne CX | 한국인 persona의 Person JIT 경로, fail/retry/return | `SIMULATED` | 모바일 신분증 경로 선택과 원 작업 복귀 | 실제 CX 호출·credential 검증 |
| 2 | 장기체류자 외국인등록증 | Residence Card 경로와 passport alternate | `SIMULATED` + `NOT_CONFIGURED` | 문서화된 credential 경로와 데모 provider 미구성의 분리 | 실제 tenant/provider provisioning |
| 3 | 단기 여행자 KYC + 첫 미션 | provider-neutral passport check와 Local Signal을 별도 단계로 구성 | `SIMULATED` | Account/Person/첫 신호가 서로 독립이며 신호는 Visit+Contribution만 변경 | Sumsub 계약, 실제 여권·liveness, 현장 참여자 검증 |
| 4 | OpenDID/EAS/Sui wrapper | OpenDID adapter와 EAS adapter가 canonical evidence envelope로 들어오는 계약 | `CONTRACT_ONLY` | source standard·adapter·truth가 분리된 Labs 표현 | OpenDID가 EAS를 import한다는 주장, 실제 EAS adapter |
| 5 | 로그인과 KYC 분리, zkLogin | Account/Person/19+/Payment KYC를 독립 상태와 one-shot returnTo로 구현 | UI `ACTUAL`, proof/signer `SIMULATED` | 한 축 성공이 다른 축을 자동 성공시키지 않음 | zkLogin=KYC/멀티체인 지갑, 실제 OAuth·Sui account |
| 6 | USDC/USDT/OOKRW/AMM/bridge | 자산별 잔고와 ordered bridge hypothesis를 Labs에 격리 | `SIMULATED`; AMM `DEFERRED` | USDC·USDT·OOKRW가 별도 자산이고 source-confirmed≠final | 실제 custody, DEX pool, burn/mint bridge, 통합 USD 원장 |
| 7 | F&B 한정 + 신뢰 가능한 ONDO | 공식 active-licence F&B 400과 별도 simulated signal 80 | 데이터·지도 `ACTUAL`, Heat `SIMULATED` | 공식 장소와 preview score/sample/band/freshness가 분리됨 | 실시간 한국인 행동 데이터, 운영 산식, 혼잡도 |
| 8 | 대화·밋업·상대 피드백 | 장소·시간 Table, confirmed-member chat, 체크인, 구조화 피드백·신고 | `SIMULATED_LOCAL` | 강제 국적/성별 matching 없이 선택 공개 profile로 이해; 목록·상세에서 실제 host·예약이 없는 preview임을 상시 고지 | 실시간 서버, 실제 host·예약·moderation·block enforcement |
| 9 | 작은 사진 업로드 | Local Signal 사진 선택·미리보기·삭제·실패·재시도 | `SIMULATED_LOCAL` | 이 기기 preview이며 업로드·영구 저장되지 않음을 표시 | object storage·image moderation |
| 10 | 이미지 채팅 | confirmed-member text/image preview와 interrupted retry | `SIMULATED_LOCAL` | 가입 전 chat 차단, 이미지 실패/재시도 | 네트워크 전송·상대 수신 |
| 11 | 원화/OOKRW 결제 | KRW 표시 가격, OOKRW test-token settlement, Payment KYC, receipt | `SIMULATED` | 결제 성공과 방문 Stamp가 분리됨 | 실제 KRW 결제·상환 가능한 stablecoin |
| 12 | 19+ 밤 자동 전환·설정 OFF | simulated signal 중 `night` category에만 미만료 19+, KST 19시 이후, auto-on, manual-off 아님 4 guard 적용 | UI `ACTUAL`, proof/policy `SIMULATED` | 수동/자동 진입, 세션 OFF 우선, 같은 장소 상세 복귀; 공식 연령 제한이 아님을 고지 | 외부 age credential 발급·검증, 공식 영업·주류·연령 제한 사실 |
| 13 | Can I Go 후순위 | 별도 신호등 제품이 아니라 장소 facts와 unknown 상태로 흡수 | UI `ACTUAL`, data `UNKNOWN` | 확인되지 않은 카드·전화·메뉴·시간을 eligible로 추정하지 않음 | 모든 가게의 실시간 이용 가능 판정 |
| 14 | 상점 trait contract | 제한된 trait/evidence receipt, stale/error/mismatch | `CONTRACT_ONLY` | 특정 fact 결과만 표현하고 안전·입장 전체를 보증하지 않음 | OmniOne 배포 contract·실제 merchant registry |
| 15 | Reputation | Identity/Visit/Contribution/Meetup 네 축 | `SIMULATED` | 첫 신호와 Table feedback이 허용된 축만 변경, 종합 안전점수 없음 | 운영 가능한 abuse-resistant reputation |
| 16 | 10개 Stamp + NFT | 서로 다른 simulated visit record로 9→10, opt-in souvenir badge | `SIMULATED` | 결제만으로 stamp 증가 금지, 공개 metadata privacy | GPS/QR/merchant 방문 증거, 실제 NFT mint |
| 17 | 서울 또는 서울+부산 | 서울 200, 부산 200의 실제 공식 장소 | `ACTUAL` | 400 unique stable IDs, source·좌표·license·snapshot | 전국 coverage, 공식 영문명·영업시간 enrichment |
| 18 | 웹앱 우선 | responsive Next.js web route `/ondo-b` | `ACTUAL` | 360×800·390×844·430×932·768×1024·801×1000·1440×1000 target, KO/EN, keyboard, fallback | native iOS/Android 앱 |
| 19 | 핫함의 강한 시각화 | 발자취 원리를 차용한 near-white canvas, 절제된 점·hairline, heat-only accent, score/cluster 분리 | UI `ACTUAL`, Heat `SIMULATED` | MapLibre vector map, count cluster와 heat score의 다른 geometry, 비색상 label | live popularity·temperature·crowd claim |

## 3. 후속 결정으로 의도적으로 바뀐 세 가지

| 초기 아이디어 | 승인된 최종 결정 | 이유 |
|---|---|---|
| KYC를 끝내야 앱 사용 | Guest 탐색 후 필요한 행동에서 JIT gate | 단기 여행자의 핵심 발견 경험을 막지 않고 Account/Person/Age/Payment를 분리하기 위해 |
| Sumsub을 특정 vendor로 고정 | provider-neutral passport verification label | 계약·privacy·국가 coverage가 확정되기 전 특정 업체 연동을 가장하지 않기 위해 |
| 국적으로 자동 matching | self-declared, explicit-consent public profile | 국적·성별 강제 matching과 신원=안전 오해를 방지하기 위해 |

`FL-002`는 Passport KYC 전체가 아니라 독립적인 19+ proof → After19 동일 장소 복귀 flow다. Passport/Person proof는 `FL-005`, `FL-006`, `FL-012`의 Person-required action에서 검증한다.

## 4. 지금 사용자 결정이 필요한가?

현재 프론트엔드 데모를 동결·검수하고 새 별도 sleek B preview로 배포하는 데 추가 사용자 결정은 필요 없다. 다만 그 작업은 아직 완료되지 않았다. 다음 항목을 `실연동`으로 승격할 때만 새로운 사업·보안·법무 결정이 필요하다.

- OmniOne CX/Residence tenant와 provider provisioning
- passport KYC vendor, 국가 coverage, 보존·삭제·appeal 정책
- OpenDID/EAS adapter 배포 주체와 canonical envelope versioning
- zkLogin OAuth provider와 account recovery
- custody, Payment KYC, USDC/USDT 지원 chain, OOKRW 법적·회계 정의
- bridge/AMM security model, relayer/finality/replay/liquidity 책임
- chat/photo/report moderation와 abuse operations
- merchant trait issuer·expiry·appeal, reputation gaming 방지
- 실제 방문 증거와 NFT 발행·privacy·취소 정책
- ONDO signal source, 최소표본, bias·freshness·지역 편향 운영 기준

## 5. 발표·제품에서 금지할 주장

- OpenDID가 EAS를 사용하거나 자동 호환된다고 말하지 않는다.
- zkLogin을 KYC, 앱 계정 전체, 멀티체인 지갑이라고 말하지 않는다.
- USDC와 USDT를 하나의 실제 온체인 USD 잔고로 합쳤다고 말하지 않는다.
- OOKRW를 상환 가능한 1:1 KRW stablecoin이라고 말하지 않는다.
- Sui와 OmniOne 사이 공식 bridge나 production AMM이 있다고 말하지 않는다.
- ONDO를 실시간 혼잡도·실시간 한국인 인기·안전 점수라고 말하지 않는다.
- Person verified, reputation, merchant trait를 안전 보증으로 말하지 않는다.
- simulated visit record를 GPS·QR·가맹점 확인 방문 증거라고 말하지 않는다.
- badge preview를 실제 NFT mint라고 말하지 않는다.

정직한 한 문장: **ONDO B는 공식 서울·부산 F&B 장소 400개와 실제 웹 지도·UI를 연결한 외국인 우선 프론트엔드 데모이며, ONDO 신호·신원·결제·체인 기능은 화면에서 명시된 시뮬레이션 또는 계약 가설이다.**

## 6. 최종 수용 기준

- 19/19 REQ와 18/18 Flow가 trace되고 `GAP=0`이어야 한다.
- typecheck, production build, contract, flow, KO/EN content, map truth, a11y, pixel이 동일 tuple에서 통과해야 한다.
- 46 visual cases/44 state IDs를 여섯 exact viewport에서 검증해 276/276 committed no-update baseline을 만들고 clipping, nav/CTA overlap, 12px 미만 metadata, 44px 미만 control, serious/critical Axe issue가 없어야 한다.
- 126 checkpoint 모두 machine registry에서 `pixel | functional_only` disposition을 가져야 하며 grouped journey를 exact named step 126개로 과장하지 않는다.
- 다섯 독립 역할이 같은 tuple에서 actionable S0/S1/S2를 0으로 판정한 clean round가 두 번 연속이어야 한다.
- 제품·harness/baseline이 바뀌면 clean streak는 0으로 돌아간다. 현재 streak는 `0/2`; R4는 `5/5 COMPLETE · NOT CLEAN`, 12개 finding은 implementation-complete이나 successor full gate와 fresh reviewer closure 전에는 닫히지 않는다.
