# ONDO Frontend Demo Candidate v2 · As-built

상태: `CANDIDATE APPROVED · DEPLOYED`

작성자: Root Integrator

RUN ID: `RUN-20260819-0415-KST`

기준 SPEC SHA: `53a431d1b4c70332b47ab02aa420c812ab883980`

Candidate code SHA: `9678b2b`

배포 URL: `https://k-tour-id.phenixnet-jl.chatgpt.site/ondo`
Evidence manifest: [RUN-20260819-0415-KST](./evidence/RUN-20260819-0415-KST/manifest.md)

이 문서는 계획이 아니라 실제 구현 결과의 source of truth다. 화면에 보이는 외부 연동은 아래 표의 실행 등급보다 높게 해석하지 않는다.

---

## 1. Release Summary

| 항목 | 실제 결과 |
|---|---|
| 결과명 | ONDO Frontend Demo Candidate v2 |
| Hero | 외국인 Guest가 서울·부산 우선 F&B ONDO 지도를 탐색하고 장소 상세까지 이동 |
| Identity | Guest / Account / Person / 19+ / Payment KYC를 독립 gate로 시뮬레이션 |
| Social | 장소·시간 Table, 멤버 채팅·로컬 사진, Local Signal, 체크인·피드백·신고 |
| Commerce | KRW 가격, OOKRW test-token 결제 시뮬레이션, 결제와 방문 Stamp 분리 |
| Labs | OpenDID/EAS 별도 adapter 계약, 분리 자산, bridge·merchant trait·badge 시뮬레이션 |
| Map | 실제 OSM raster tile + Leaflet 좌표; 실패 시 같은 장소 목록 유지 |
| QA Loop 1 | 3인 독립 검수 후 truth·persistence·focus·navigation·pixel 수정 |
| QA Loop 2 | 3인 독립 검수 후 expiry·copy·touch target·feedback/report 수정 |
| QA Loop 3 | Map 32/32, Identity 42/42, Product 22/22; S0/S1 0. 최종 가독성 보강 재검수 중 |
| Critical / High | 0 / 0 |

### 사용자에게 보이는 핵심 변화

- 전국 overview 안에서 서울은 밀도 높은 신호, 부산은 early coverage, 나머지는 숫자 없는 Growing으로 정직하게 구분한다.
- ONDO 점수·표본·신뢰도·최신성을 분리하고 만료·미래 시각 신호를 현재 정보로 표시하지 않는다.
- 3개 persona 온보딩은 KYC로 홈 진입을 막지 않으며, 필요한 행동에서만 Account·Person·19+·Payment KYC가 이어진다.
- 장소 상세에서 길찾기·저장·Table·Local Signal·Checkout으로 뻗고, 완료·취소·실패 후 원래 맥락으로 돌아온다.
- After 19는 미만료 19+ proof, KST 19시 이후, auto-on, 세션 manual-off 아님을 모두 만족할 때만 자동 전환한다.
- 기술 실험은 Labs로 격리하고 `SIMULATED`, `CONTRACT ONLY`, `AMM Deferred`를 화면에서 명시한다.

### 이번 후보가 증명하지 않는 것

- 실제 CX/OpenDID/Residence Card/Passport provider 연동
- 실제 실시간 채팅·사진 업로드·운영 moderation
- 실제 결제·자산 custody·AMM·bridge·merchant settlement
- 실제 ONDO 실시간 데이터 파이프라인·운영 가능한 reputation 시스템

---

## 2. Requirements Final Status

| REQ | 최종 등급 | 실제 구현 | 알려진 경계 |
|---|---|---|---|
| `REQ-001` | `Simulated` | Korean CX JIT gate와 성공·취소·실패·복귀 | CX 호출 없음 |
| `REQ-002` | `Simulated` | Residence Card 지원·미지원·대체 경로 | public provider 미연결 |
| `REQ-003` | `Simulated` | Passport Person gate와 별도 Local Signal first mission | KYC provider·현장 검증 없음 |
| `REQ-004` | `Contract-only` | OpenDID/EAS 별도 adapter → canonical Evidence Envelope | 실제 adapter endpoint 없음 |
| `REQ-005` | `Implemented` | Account·Person·Age·Payment KYC 독립 state와 one-shot returnTo | 외부 proof는 fixture |
| `REQ-006` | `Simulated` | USDC/USDT/OOKRW 분리, ordered bridge states | AMM `Deferred`, 자산 이동 없음 |
| `REQ-007` | `Implemented` | F&B ONDO 점수·근거·표본·최신성·Limited UI | 데이터는 `SIMULATED` |
| `REQ-008` | `Simulated` | Table·멤버 채팅·체크인·피드백·신고·공개 프로필 | 서버·moderation 없음 |
| `REQ-009` | `Simulated` | Local Signal 사진 선택·preview·삭제·실패·retry | 브라우저 로컬 blob만 사용 |
| `REQ-010` | `Simulated` | confirmed member 전용 text/image chat, interrupted retry | 네트워크 전송 없음 |
| `REQ-011` | `Simulated` | KRW 가격·OOKRW settlement 가설·Payment KYC·결제 receipt | 실제 결제 없음 |
| `REQ-012` | `Implemented` | After 19 4-guard + expiry + manual-off/remount | Age proof는 fixture |
| `REQ-013` | `Implemented` | 해외카드·한국 번호·예약·언어·연령을 장소 facts로 흡수 | merchant fact는 fixture |
| `REQ-014` | `Contract-only` | 제한된 merchant trait/evidence receipt와 stale/error | 안전·영업 전체 보증 아님 |
| `REQ-015` | `Implemented` | Identity·Visit·Contribution·Meetup 4축 분리 | 종합 안전 점수 없음 |
| `REQ-016` | `Simulated` | unique visit만 Stamp 9→10, opt-in badge | NFT mint 없음 |
| `REQ-017` | `Implemented` | 전국 overview / 서울 dense / 부산 early / Growing | 콘텐츠 확장은 후속 |
| `REQ-018` | `Implemented` | responsive Next.js web, KO/EN, keyboard/axe, 3 persona home | native app 아님 |
| `REQ-019` | `Implemented` | 줌별 ONDO heat·6단계 범례·confidence·freshness | 실시간 집계 없음 |

---

## 3. Flow Final Status

모든 `Passed`는 지정된 실패·취소·복귀 중 최소 하나 이상의 browser 또는 contract evidence를 포함한다.

| Flow | Status | 실제 entry → terminal | 실패·취소·복귀 evidence |
|---|---|---|---|
| `FL-001` | `Passed` | Guest `/ondo` → Korea → city → neighborhood → venue detail | tile/location failure에서도 list·지도 유지 |
| `FL-002` | `Passed` | venue/After19 action → Person/Age → night layer | fail/cancel/expiry/manual-off |
| `FL-003` | `Passed` | venue Table → join → chat/photo → check-in → feedback/report | non-member lock, join fail, image retry, safe Table return |
| `FL-004` | `Passed` | venue Checkout → Payment KYC → simulated receipt | cancel/decline; payment만으로 Stamp 불변 |
| `FL-005` | `Passed` | Korean persona → CX Person simulation → returnTo | pending/cancel/fail/expiry |
| `FL-006` | `Passed` | resident persona → Residence Card simulation/alternate | unsupported/failure 뒤 지도 유지 |
| `FL-007` | `Passed` | short-term onboarding → Guest home | skip/finish 모두 KYC 선행 없음 |
| `FL-008` | `Passed` | Korean onboarding → Guest 또는 Account home | persona preference만 저장 |
| `FL-009` | `Passed` | resident onboarding → Guest 또는 Account home | verification은 JIT로 분리 |
| `FL-010` | `Passed` | gated CTA → Account create → one-shot returnTo | cancel/fail/retry/fallback |
| `FL-011` | `Passed` | save venue → My Korea → same venue | reload·duplicate·저장 실패 복구 |
| `FL-012` | `Passed` | venue Local Signal → photo → submit | failure draft 유지; Visit+Contribution만 변경 |
| `FL-013` | `Passed` | After19 prompt → 19+ proof → layer on | before-19/unverified/expired/auto-off 차단 |
| `FL-014` | `Passed` | After19 on → manual off | 같은 세션 remount에서 자동 재진입 안 함 |
| `FL-015` | `Passed` | My profile → consented fields·4 reputation axes | save failure 시 기존 값 유지·retry |
| `FL-016` | `Passed` | place facts / Labs trait receipt | stale/error는 eligible로 승격하지 않음 |
| `FL-017` | `Passed` | Checkout → Payment KYC → same checkout | cancel/fail/expiry와 returnTo |
| `FL-018` | `Passed` | My milestone → Labs acknowledge → signer/bridge/trait/badge | expiry/cancel/failure, AMM CTA 없음 |

주요 구현 커밋: `dde0008` route integration, `b68e3ae` map, `9622792` identity, `d772a21` connect, `0286617` accessibility, `beb79b7` QA1, `8b67acb` QA2, `9678b2b` final readability.

---

## 4. Route and Screen Inventory

| Route/Entry | Screen/Sheet | 실제 CTA |
|---|---|---|
| `/ondo` first visit | 3-step onboarding | Get started, persona, preference, finish, Guest skip |
| `/ondo` | ONDO Map | search, filters, zoom/list/location, city/neighborhood/venue |
| venue marker/card | Place peek/detail | directions, save, Table, Local Signal, Checkout |
| bottom `Tables` | Table list/detail/chat | join, leave, check-in, photo, feedback, report/block preview |
| bottom `My Korea` | saved/stamp/profile/Labs | saved return, profile edit, milestone, Labs entry |
| bottom `ID` | identity overview | Account/Person/19+/Payment status and truthful JIT preview |
| After19 chip/prompt | night layer / age gate | auto preference, verify, turn off |
| Labs | wallet/bridge/traits/badge | simulation acknowledge, progress/retry/cancel |

visible dead CTA는 최종 browser audit에서 0건이었다.

---

## 5. Actual State and Persistence

| Domain | Actual | Persistence |
|---|---|---|
| preferences | locale, guideSeen, autoNight, saved venues, discovery preferences | `localStorage: ondo.preferences.v3` |
| core session | onboarding/persona/account/person/age/paymentKyc/gate/returnTo/Table/stamps/reputation | `sessionStorage: ondo.session.v3` |
| chat | text/image preview status, interrupted send recovery | `sessionStorage: ondo.chat.v2` |
| Table outcomes | structured feedback, report reason/receipt, preview block | `sessionStorage: ondo.table-outcomes.v2` |
| Labs | acknowledge, wallet, bridge phase/receipt, trait, badge | `sessionStorage: ondo.labs.v2` |
| visit idempotency | accepted unique visit evidence IDs | `sessionStorage: ondo.accepted-visits.v2` |
| map | URL query + Leaflet view; tile state ready/error | URL + component state |
| photo | browser object URL; no raw blob serialization | component/session preview only |

`resetSession`은 core session과 네 feature session key를 함께 제거한다. PII 원문·신분증 이미지·정확한 사용자 위치는 저장하지 않는다.

---

## 6. Data and Simulation Inventory

| Adapter/Provider | Execution label | 실제 확인 범위 | UI 표현 |
|---|---|---|---|
| OpenStreetMap raster | `LIVE NETWORK DEPENDENCY` | tile load·decoded pixels, failure fallback | attribution + 같은 장소 list |
| ONDO content | `SIMULATED` | 서울 4 venue, 부산 early aggregate, Growing regions | score/sample/confidence/freshness 분리 |
| OmniOne CX | `SIMULATED` | state·copy·return flow | 실제 인증으로 표현하지 않음 |
| Residence/Passport | `SIMULATED` / `NOT_CONFIGURED` | supported/unsupported/failure fixtures | alternate path 제공 |
| OpenDID/EAS | `CONTRACT_ONLY` | 별도 source adapter envelope | 상속·호환 주장 없음 |
| Sui zkLogin | `SIMULATED` | Labs testnet signer fixture | Account/KYC/멀티체인 지갑으로 표현 안 함 |
| USDC/USDT/OOKRW | `SIMULATED` | 자산별 별도 잔고 | 합산 custody 잔고 없음 |
| OOKRW bridge | `SIMULATED` | ordered phase·expiry·failure receipt | target testnet·simulation 명시 |
| Merchant contract | `CONTRACT_ONLY` | limited trait/evidence/stale/error | 안전 전체 보증 금지 |
| Badge/NFT | `SIMULATED` | opt-in UI·receipt | 실제 mint 없음 |
| Chat/photo | `SIMULATED LOCAL` | member guard·preview·retry | 서버 업로드 없음 명시 |

---

## 7. Test Evidence

최종 명령·exit code·viewport별 수치·스크린샷 checksum은 [evidence manifest](./evidence/RUN-20260819-0415-KST/manifest.md)에 기록한다.

| 검증 | 현재 결과 |
|---|---|
| TypeScript | PASS |
| Contract | 16/16 PASS |
| Next production build | PASS · `/ondo` static prerender |
| Sites build | PASS |
| Loop 3 Map/Place | 32/32 browser + 10/10 visual PASS |
| Loop 3 Identity/Onboarding | 42/42 browser + 8/8 axe + 12/12 visual PASS |
| Loop 3 Product flows | 22/22 browser PASS |
| runtime collector extension | Commerce/Labs mobile+desktop PASS |
| final readability closure | Map E2E 22/22 + affected visuals 20/20 PASS |

---

## 8. QA Loop History

| Loop | 공통 발견 | Fix | 결과 |
|---|---|---|---|
| 1 | route 미연결, JIT 복귀, session reset, focus, touch/text, report/feedback 공백 | `dde0008`~`beb79b7` | S0/S1 0 |
| 2 | access expiry, fixture truth, context overlap, runtime observability, structured outcome | `8b67acb`, `b2ed025` | S0/S1 0 |
| 3 | 현재보다 미래인 fixture, 8~11px metadata, live-tile 자동 증거 공백 | `9678b2b` | 현재시각 정상화, 12px+, decoded tile assertion |

자기 구현을 자기 혼자 승인하지 않았으며 Map·Identity·Product 세 범위를 서로 다른 reviewer가 검수했다.

---

## 9. Known Issues and Deferred Work

| Gap | Severity | 사용자 영향 | 후속 조건 |
|---|---|---|---|
| 서울 외 실제 venue 콘텐츠 밀도 | Low / intentional | 부산은 early, 기타 지역은 Growing | 운영 데이터 pipeline·editorial 확보 |
| ONDO 실시간 산식/API | Deferred | 현재 점수는 deterministic fixture | provenance 포함 API 계약 구현 |
| CX/Residence/Passport/KYC | Deferred external | 실제 credential 발급·검증 불가 | provider provisioning·키·정책 확정 |
| 채팅·사진·신고 moderation | Deferred backend | 동일 브라우저 session preview만 가능 | auth, storage, abuse ops, retention 정책 |
| 결제·bridge·merchant contract·NFT | Deferred external | 시뮬레이션 외 자산 이동 없음 | 법무·PG/KYC·testnet security review |
| AMM | Deferred | CTA 없음 | 별도 승인 전 scope에 넣지 않음 |

Critical/High known issue는 0이다.

---

## 10. Security, Privacy and Truth Review

- [x] KYC 국적 자동 공개 없음
- [x] 법적 이름·생년월일·신분증 원문 노출 없음
- [x] 정확한 사용자 위치 공유 없음
- [x] `Person verified`를 안전·전문성 보증으로 사용하지 않음
- [x] OpenDID가 EAS를 사용한다고 표현하지 않음
- [x] zkLogin을 KYC·멀티체인 지갑으로 표현하지 않음
- [x] USDC·USDT를 하나의 실제 USD 자산으로 표현하지 않음
- [x] custom bridge·AMM을 실제 안전한 연결로 표현하지 않음
- [x] OOKRW를 상환 가능한 KRW stablecoin으로 표현하지 않음
- [x] NFT에 국적·성인·부정 평판을 기록하지 않음
- [x] fixture와 실제 provider receipt 혼합 없음
- [x] public asset/repo에 secret·PII 없음

---

## 11. Developer Handoff

### Fixture → API 교체 지점

- `lib/ondo/map/fixtures.ts` → provenance를 보존하는 ONDO/venue adapter
- `features/ondo/identity/**` → Account·CX·Residence·Passport provider adapter
- `features/ondo/connect/**` → Table/chat/media/moderation backend
- `features/ondo/commerce/**` → price·Payment KYC·payment receipt adapter
- `features/ondo/labs/**` → 별도 승인된 signer/bridge/evidence/trait adapter

### 유지해야 할 UX 불변식

- Guest 탐색을 KYC로 선행 차단하지 않는다.
- Account, Person, Age, Payment KYC 한 축의 성공이 다른 축을 자동 성공시키지 않는다.
- gate 완료 뒤 one-shot returnTo로 원 CTA를 한 번만 재개한다.
- 만료·미래·출처 없는 신호를 current/eligible로 승격하지 않는다.
- 결제 성공만으로 Stamp를 주지 않는다.
- 실제 외부 receipt가 없으면 `SIMULATED` 또는 `CONTRACT ONLY`를 제거하지 않는다.

### 실행 명령

```text
cd k-tour-id-app
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:contracts
pnpm exec playwright test tests/e2e --workers=1
pnpm exec playwright test tests/visual --workers=1
pnpm build
pnpm build:sites
```

---

## 12. Final Decision

판정: `CANDIDATE APPROVED FOR FRONTEND DEMO DEPLOYMENT`

판정자: Root + 3 independent reviewers

Candidate code: `9678b2b`
배포: `https://k-tour-id.phenixnet-jl.chatgpt.site/ondo` · owner-only private access · remote HTTP 200

최종 full-suite, durable manifest, private production deployment와 원격 `/ondo` smoke를 모두 통과했다.
