# 스테이블코인 충전 공백 감사와 인계

상태: **통합 목업 로컬 검수 PASS · 소스 `996119f` 프리뷰 Ready · 공개 URL 35/35 PASS**. 실제 외부 provider·Sui·bridge 연결을 수행했다는 뜻이 아니다. 현재 프리뷰는 [ONDO](https://ondo-pr524cbqq-jaewook-9643s-projects.vercel.app)이며 production alias를 변경하지 않았다. 배포 ID·공개 검수 결과의 정본은 [지도·ID·스테이블코인 릴리스](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md)다. 이전 공유 URL의 결과와 합산하지 않는다.

## 사용자 결정

2026-09-09 사용자는 `USD wallet · Sample → Added to balance +₩30,000` 화면에서 PRD의 스테이블코인 플로우를 확인할 수 없다고 지적했다. 사용자가 직접 선택한 funding branch는 token·network·signer·전환의 연속된 목업을 보여줘야 한다. 기존 9시간 PRD `REQ-011-A1`의 기술 정보를 상세/Labs에만 숨기는 규칙은 이 분기에서 최신 결정으로 대체한다. 일반 지갑/가격의 KRW 중심 표현과 샘플/실제 구분은 유지한다.

## 변경 전 기준선

| 구간 | 읽기 감사에서 확인한 코드 | 부족한 사용자 경험 |
| --- | --- | --- |
| 일반 Wallet funding | `commerce-b/funding-rail-model-b.ts`의 `digital_dollar`: USD cents·고정 환율·fee·quoted/authorize/pending/settled. `id-wallet-commerce-b.tsx`에서 generic 충전 영수증 | USDC/USDT 선택, 자산/network/atomic amount, signer, source/destination 상태 없음 |
| Labs signer/assets | `labs/labs-model.ts`, `labs-entry.tsx`: sample signer 및 실패 선택; USDC/USDT/OOKRW fixture | 일반 funding에 연결되지 않고 자산 잔액은 별도 예시 |
| Labs bridge | `labs/labs-review-truth-b.ts`: 고정 USDT 13.5→OOKRW 13,460 hypothesis; source submitted/confirmed/relaying/destination confirmed | 읽기 전용 성공 영수증. 실제·샘플 Travel Wallet 잔액을 충전하지 않음 |
| credit/checkout | `creditStableCommerceFundingB`의 승인된 sample credit 1회, 별도 Payment KYC/action gate·locked checkout | generic USD receipt가 token 자금 흐름을 설명하지 못함. credit 안전장치는 보존할 것 |
| 기존 테스트 | `ondo-funding-rail-journeys.spec.ts`, `ondo-funding-rail.spec.ts`, `ondo-funding-credit-boundary.spec.ts` | generic rail/credit 검사는 있으나 token/signer/source/destination funding 전체 경로의 증거는 아님 |

따라서 “Labs가 있으므로 stablecoin funding이 완료됐다”는 판정은 성립하지 않는다. 현재 `DEVELOPMENT_SPEC.md`의 구형 운영 요구를 자동 재승격하지 않고, 정본 `DEPLOYMENT_SPEC §1.1`의 최신 결정 우선순위에 따라 G09-S/H08/H13/H14를 연결한다.

## 구현된 목업과 인계 계약

일반 Wallet funding 내부에서 `USDC/USDT 선택 → sample Sui signer(zkLogin/기존 wallet) → locked quote → 사용자 승인 → source 제출/확인 → routing → destination 확인 → 샘플 credit/receipt`를 연결했다. 양쪽 자산 모두 **Sui Testnet 대상의 명시적 시뮬레이션**이며 native/wrapped 자산 지원을 주장하지 않는다. source/destination은 각각 공개 확인 버튼으로 진행하며 generic USD rail의 자동 완료 타이머를 사용하지 않는다.

자산·network·representation·atomic amount와 display KRW는 분리한다. source 성공만으로 잔액을 늘리지 않으며 destination 확인 결과를 같은 operation으로 1회 반영한다. 제출 이후 중단은 pending/unknown 재조회로 복구하고 재승인/새 source 전송을 막는다. funding이 Person/Age/Payment KYC나 자격 한도를 부여하지 않는다. Labs 기존 route와 잔액은 읽기 전용으로 유지한다.

실제 기술·API·ADR은 [DEPLOYMENT_SPEC G09-S/G12/§6/§8](./DEPLOYMENT_SPEC.md), 기능 매핑은 [Integration Matrix H08/H09/H13/H14](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md), 운영 작업은 [Backend BE-06/15/16](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)에 동일하게 연결한다.

## 로컬 후보 실행 증거

경로 기준은 `.codex-worktrees/did-demo-20260908/k-tour-id-app/`이다.

| 항목 | 파일·결과 |
| --- | --- |
| 목업 모델 | `features/ondo/commerce-b/funding-rail-model-b.ts` (`digital_dollar`), credit 경계 `features/ondo/commerce-b/stable-commerce-model-b.ts` |
| 공개 UI | `features/ondo/commerce-b/stablecoin-funding-b.tsx`, `stablecoin-funding-b.module.css`; 진입·공통 잔액 연결은 `features/ondo/commerce-b/id-wallet-commerce-b.tsx` |
| 새 모델 반례 | `tests/contracts/ondo-stablecoin-funding.spec.ts`: **19/19 PASS** |
| 기존 funding 계약 | `tests/contracts/ondo-funding-rail.spec.ts` 7개 + `ondo-funding-credit-boundary.spec.ts` 4개: **11/11 PASS**. 새 모델 19개와 합쳐 funding 계약 **30/30 PASS** |
| funding·identity 브라우저 | `tests/e2e/ondo-stablecoin-funding.spec.ts` 10개 + `ondo-funding-rail-journeys.spec.ts` 7개 + `ondo-identity-polish.spec.ts` 4개: **21/21 PASS**. 스테이블코인 10개와 기존 funding 7개를 구분하며 아래 최종 통합 35개에도 포함 |
| 통합 로컬 브라우저 | **35/35 PASS (1.7분)**: city map 3·nation 1·appearance 2·previsit 8·기존 funding 7·identity 4·stablecoin 10. After 19 라벨·dark 경계선 마무리까지 반영한 소스 `996119f`의 로컬 production 후보에서 재실행. 새 checkout/Labs 브라우저 완주는 포함하지 않음 |
| 타입·빌드 | 최종 통합 후보의 `pnpm typecheck`, `pnpm build:vercel:ondo-b` 및 standalone client scan PASS |
| 전체 계약 후보 | 마지막 UI 마무리까지 반영한 **771/771 PASS (7.9초)**. 이전 funding/identity 후보의 769/769 결과를 대체 |
| 실행 로그 | 최종 통합 `artifacts/qa/identity-stablecoin-map-{contracts,typecheck,build,browser}.log`; 앞선 funding/identity 단독 브라우저 `artifacts/qa/identity-stablecoin-browser-final.log`; 캡처 `artifacts/qa/stablecoin-funding-20260909/` |
| 배포 | **Preview Ready**. 소스 `996119f`, 배포 `dpl_45fsxjQQTpSuoPd1dVQEmxtKGdNx`, [공유 URL](https://ondo-pr524cbqq-jaewook-9643s-projects.vercel.app). production alias 미변경 |
| 공개 URL 검수 | 동일 35개 브라우저 검사 **35/35 PASS (1.7분)**. 로그 `artifacts/qa/identity-stablecoin-map-public.log`; 로컬 검사와 별도 실행이며 최종 결과는 [정본 릴리스](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md)에 기록 |

## 반례별 확인 범위

체크된 항목은 아래 명시한 **샘플 계약 또는 로컬 브라우저 검사**의 통과다. 실제 백엔드/체인 검증으로 승격하지 않는다.

- [x] USDC와 USDT 각각 선택→signer→quote→source/destination→credit/receipt 공개 버튼 완주: 새 브라우저 4개 화면 조합.
- [x] signer 거절/wrong network/source 잔액 부족은 브라우저에서 차단; quote 만료·연결 복구는 새 모델 계약에서 확인.
- [x] source confirmed/destination pending 중 consumer 잔액과 Account/Person/Age/Payment 상태 불변: 브라우저 및 모델.
- [x] token/network/source 금액/수령액/quote 변조와 이전 approval/receipt 거절: 새 모델 계약. network는 UI에서 임의 변경하는 기능이 아니라 샘플 대상값 검증임.
- [x] destination callback 반복·충돌·다른 operation/quote는 추가 credit 0: 모델. 브라우저는 중복 도착 버튼·영수증 재진입의 1회 credit 확인.
- [x] pending/unknown 닫기→재진입은 같은 operation 조회, 새 승인/전송 없음: 동일 mounted session 브라우저 및 모델 역직렬화 검사.
- [x] source 확정 후 destination 실패/unknown은 같은 작업을 보존하고 blind retry 거절: 새 모델 계약. 실제 체인 대사/보상은 미구현.
- [x] signer 종류를 바꾸면 재연결 전 Review 차단; 같은 금액 10회 선택은 quote ID/연결 준비 상태 보존: 브라우저.
- [ ] 샘플 충전 후 checkout의 별도 Payment KYC/자격/금액 gate 전체 브라우저 재검수. 이번에는 독립 상태 불변과 기존 모델 계약을 확인했으며 새 checkout 완주를 실행한 것은 아님.
- [x] `review=0`에서 연결 필요 상태를 유지하고 사용자가 명시적으로 샘플을 선택해야 진입: 스테이블코인 브라우저. 자동 샘플 성공 fallback 없음.
- [x] 샘플 자산 metadata/참조값을 실제 TESTNET tx/네이티브 자산·bridge 근거로 표시하지 않음: 새 모델의 위조/unsupported representation 거절 및 UI의 명시적 시뮬레이션/가설 고지.
- [ ] Labs 읽기 전용 route 완료가 consumer 잔액/credit 이력을 바꾸지 않는 별도 브라우저 재실행. 이번 스테이블코인 10개 검사는 Labs에 들어가지 않음.
- [x] 390px dark EN USDC, 320px light KO USDC, 430px dark JA USDT, 1440px light EN USDT의 견적·영수증: horizontal overflow 없음, axe serious/critical 0. 실패 차단은 390px dark EN에서 확인.
- [x] 소스 `996119f`의 Ready 프리뷰에서도 동일 35개 브라우저 검사를 별도 실행해 PASS(1.7분). 공개 390px dark nation의 경계선·motion/pause·가로 overflow 없음도 독립 캡처로 확인. 세부 결과는 [정본 릴리스](./MAP_ID_STABLECOIN_RELEASE_2026-09-10.md) 참조.
- [ ] 모든 locale×theme×화면폭 교차 조합, 짧은 landscape·키보드·실기기 Safari 검수.

## 현재 목업의 제한

- 연결·로그인·서명·Sui 전송·OmniOne 도착은 준비된 응답이다. 지갑 앱, OAuth/prover, RPC, 실주소·실제 digest/explorer 링크를 만들지 않는다. 환율·수수료·6자리 decimals·100개 시작 token 잔액도 샘플이다.
- credit는 **현재 mounted app session**에만 존재한다. funding sheet 닫기/재진입은 보존하지만 새로고침·wallet reset 뒤 이전 settled 영수증만으로 잔액을 복원하지 않는다. 미확정 작업은 탭의 session storage에서 모델 검증을 거쳐 조회하며 서버 원장·다중 기기 복원은 없다.
- `source confirmed`는 destination 성공이 아니고, destination sample receipt는 상점 checkout/capture·지급/환불 완료가 아니다. 실제 이중분개 원장·영구 멱등 키·routing/attestation·수탁/상환 authority는 백엔드 작업이다.
- Labs의 기존 읽기 전용 route와 이 Wallet funding은 다른 경로다. 이번 로컬 검사 수를 Labs·checkout·실제 체인 완주의 증거로 합산하지 않는다.

## 실제 백엔드에 남는 핵심

검증된 asset/network registry, signer/custody·salt/prover/recovery·gas, provider별 funding KYC/한도/지역, 승인 intent binding, source receipt/finality, 별도 routing/attestation·수탁/상환 authority, destination receipt/finality, durable ledger/idempotency, 대사/보상. 해당 route의 공식 지원 근거가 없으면 실제 기능은 비활성으로 두며 OOKRW peg/원화 상환이나 native Sui↔OmniOne bridge를 주장하지 않는다.
