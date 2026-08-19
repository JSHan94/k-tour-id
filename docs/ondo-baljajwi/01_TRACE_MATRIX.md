# ONDO B Requirements · Flow · Evidence Trace Matrix

상태: `EXACT REGISTRY · EVIDENCE PENDING`

기준: [`REQ-001`~`REQ-019`](../ondo-execution/01_PRD_9H.md#6-19개-요구사항-registry), [`FL-001`~`FL-018`](../ondo-execution/03_FLOW_CATALOG.md#2-전체-flow-matrix)

## 1. ID 규칙

| 대상 | 형식 | 예시 |
|---|---|---|
| B 요구 증거 | `B-REQ-NNN` | `B-REQ-012` |
| B browser checkpoint | `B-E2E-FL-NNN-CHECKPOINT` | `B-E2E-FL-003-ERROR` |
| B pixel | `B-PX-FL-NNN-CHECKPOINT-VIEWPORT-LANG` | `B-PX-FL-003-ERROR-390-KO` |
| B content | `B-COPY-FL-NNN-LANG` | `B-COPY-FL-003-EN` |
| B a11y | `B-A11Y-FL-NNN` | `B-A11Y-FL-003` |
| B issue | `B-ISS-RR-NNN` | `B-ISS-R1-004` |
| Review evidence | `B-REV-RR-ROLE-NNN` | `B-REV-R1-UX-001` |

Checkpoint는 `ENTRY`, `DECISION`, `CANCEL`, `ERROR`, `RETRY`, `TERMINAL`, `RETURN` 일곱 개만 쓴다. `RETURN`은 화면을 닫았다는 뜻이 아니라 Flow catalog가 지정한 직전 장소·지도·Table·My·Labs 맥락이 실제로 보존됐음을 뜻한다.

## 2. 19개 REQ registry

| B REQ | 원 REQ | 관련 Flow | B에서 지킬 제품 불변식 | Browser / Pixel / Content evidence | 상태 |
|---|---|---|---|---|---|
| `B-REQ-001` | `REQ-001` | `FL-005`, `FL-008`, `FL-010`, `FL-012` | 한국인은 Guest map 뒤 필요한 행동에서만 CX를 시작 | §3의 `FL-005`, `FL-008`, `FL-010`, `FL-012` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-002` | `REQ-002` | `FL-006`, `FL-009`, `FL-010`, `FL-012` | Residence Card 지원·미지원·대체 경로; 지도 유지 | §3의 `FL-006`, `FL-009`, `FL-010`, `FL-012` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-003` | `REQ-003` | `FL-002`, `FL-007`, `FL-012` | Passport proof와 첫 현장 미션 분리; Visit/Contribution만 변경 | §3의 `FL-002`, `FL-007`, `FL-012` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-004` | `REQ-004` | `FL-016`, `FL-018` | OpenDID/EAS 입력은 별도 adapter; canonical envelope에서만 만남 | §3의 `FL-016`, `FL-018` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-005` | `REQ-005` | `FL-002`, `FL-005`~`FL-011`, `FL-013`, `FL-017`, `FL-018` | Account/Person/Age/Payment KYC 분리; zkLogin은 Labs signer | §3의 열거된 각 Flow exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-006` | `REQ-006` | `FL-004`, `FL-018` | 자산 분리·read-only projection·ordered bridge; AMM 없음 | §3의 `FL-004`, `FL-018` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-007` | `REQ-007` | `FL-001`, `FL-012` | 식음료 ONDO의 score/sample/confidence/freshness 분리 | §3의 `FL-001`, `FL-012` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-008` | `REQ-008` | `FL-003`, `FL-015` | 장소·시간 Table, confirmed chat, 선택 공개 profile; 강제 매칭 없음 | §3의 `FL-003`, `FL-015` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-009` | `REQ-009` | `FL-012` | browser-local photo preview/remove/fail/retry | §3의 `FL-012` exact row | `PENDING_ROUTE_SEAM` |
| `B-REQ-010` | `REQ-010` | `FL-003` | confirmed member image chat pending/fail/retry; nonmember deny | §3의 `FL-003` exact row | `PENDING_ROUTE_SEAM` |
| `B-REQ-011` | `REQ-011` | `FL-004`, `FL-017` | KRW 가격·OOKRW settlement hypothesis; Payment KYC; payment만으로 stamp 불변 | §3의 `FL-004`, `FL-017` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-012` | `REQ-012` | `FL-002`, `FL-013`, `FL-014` | 19+·미만료·KST 19시·auto on·manual-off 아님 네 guard | §3의 `FL-002`, `FL-013`, `FL-014` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-013` | `REQ-013` | `FL-001`, `FL-016` | Can I Go 독립 tab 없음; 가기 전 확인 facts에 흡수 | §3의 `FL-001`, `FL-016` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-014` | `REQ-014` | `FL-016`, `FL-018` | merchant trait는 제한된 offer/policy receipt; 안전 전체 보증 금지 | §3의 `FL-016`, `FL-018` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-015` | `REQ-015` | `FL-003`, `FL-012`, `FL-015` | Identity/Visit/Contribution/Meetup 분리; 종합 안전 점수 없음 | §3의 `FL-003`, `FL-012`, `FL-015` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-016` | `REQ-016` | `FL-004`, `FL-011`, `FL-018` | unique visit만 9→10; badge는 opt-in simulation | §3의 `FL-004`, `FL-011`, `FL-018` exact rows | `PENDING_ROUTE_SEAM` |
| `B-REQ-017` | `REQ-017` | `FL-001` | Korea shell, Seoul complete, Busan seed, 나머지 scoreless Growing | §3의 `FL-001` exact row | `PENDING_ROUTE_SEAM` |
| `B-REQ-018` | `REQ-018` | `FL-001`, `FL-007`, `FL-008`, `FL-009` | responsive web·KO/EN·keyboard·screen reader·세 persona home | §3의 관련 exact rows와 `B-A11Y-FL-001`, `B-A11Y-FL-007`, `B-A11Y-FL-008`, `B-A11Y-FL-009` | `PENDING_ROUTE_SEAM` |
| `B-REQ-019` | `REQ-019` | `FL-001` | Heat를 색+단계/숫자+sample/confidence/freshness로 표현 | §3의 `FL-001` exact row와 `B-A11Y-FL-001` | `PENDING_ROUTE_SEAM` |

아래 Flow 표와 [Evidence Manifest](./04_EVIDENCE_MANIFEST.md)는 모든 실행 ID를 개별 나열한다. 실행 manifest에는 wildcard를 허용하지 않는다.

## 3. 18개 Flow checkpoint matrix

각 행의 browser evidence는 정확히 일곱 개다. Pixel은 layout-distinct 네 장을 최소선으로 하고, 동일 레이아웃의 cancel/retry는 browser+content evidence로 검증한다.

| Flow | Entry → decision → error/terminal → return | Exact browser IDs | Exact pixel IDs | Content / A11y | 상태 |
|---|---|---|---|---|---|
| `FL-001` Guest Discover | Korea map → city/place → tile/location/no-result → venue/directions → same map context | `B-E2E-FL-001-ENTRY`, `B-E2E-FL-001-DECISION`, `B-E2E-FL-001-CANCEL`, `B-E2E-FL-001-ERROR`, `B-E2E-FL-001-RETRY`, `B-E2E-FL-001-TERMINAL`, `B-E2E-FL-001-RETURN` | `B-PX-FL-001-ENTRY-390-EN`, `B-PX-FL-001-ERROR-390-KO`, `B-PX-FL-001-TERMINAL-430-EN`, `B-PX-FL-001-RETURN-DESKTOP-EN` | `B-COPY-FL-001-KO`, `B-COPY-FL-001-EN`; `B-A11Y-FL-001` | `PENDING_ROUTE_SEAM` |
| `FL-002` Short-term KYC → After19 | locked F&B → Passport/age → cancel/fail/expiry → night venue → original venue | `B-E2E-FL-002-ENTRY`, `B-E2E-FL-002-DECISION`, `B-E2E-FL-002-CANCEL`, `B-E2E-FL-002-ERROR`, `B-E2E-FL-002-RETRY`, `B-E2E-FL-002-TERMINAL`, `B-E2E-FL-002-RETURN` | `B-PX-FL-002-ENTRY-390-EN`, `B-PX-FL-002-ERROR-390-KO`, `B-PX-FL-002-TERMINAL-430-EN`, `B-PX-FL-002-RETURN-DESKTOP-EN` | `B-COPY-FL-002-KO`, `B-COPY-FL-002-EN`; `B-A11Y-FL-002` | `PENDING_ROUTE_SEAM` |
| `FL-003` Table → Image Chat → Feedback | Table → requesting/confirmed → join/message/report failure → feedback/report receipt → safe Table | `B-E2E-FL-003-ENTRY`, `B-E2E-FL-003-DECISION`, `B-E2E-FL-003-CANCEL`, `B-E2E-FL-003-ERROR`, `B-E2E-FL-003-RETRY`, `B-E2E-FL-003-TERMINAL`, `B-E2E-FL-003-RETURN` | `B-PX-FL-003-ENTRY-390-EN`, `B-PX-FL-003-ERROR-390-KO`, `B-PX-FL-003-TERMINAL-430-EN`, `B-PX-FL-003-RETURN-DESKTOP-EN` | `B-COPY-FL-003-KO`, `B-COPY-FL-003-EN`; `B-A11Y-FL-003` | `PENDING_ROUTE_SEAM` |
| `FL-004` Checkout/Labs → Stamp | checkout → Payment KYC/confirm → fail/cancel → receipt then unique visit 9→10 → venue/My | `B-E2E-FL-004-ENTRY`, `B-E2E-FL-004-DECISION`, `B-E2E-FL-004-CANCEL`, `B-E2E-FL-004-ERROR`, `B-E2E-FL-004-RETRY`, `B-E2E-FL-004-TERMINAL`, `B-E2E-FL-004-RETURN` | `B-PX-FL-004-ENTRY-390-EN`, `B-PX-FL-004-ERROR-390-KO`, `B-PX-FL-004-TERMINAL-430-EN`, `B-PX-FL-004-RETURN-DESKTOP-EN` | `B-COPY-FL-004-KO`, `B-COPY-FL-004-EN`; `B-A11Y-FL-004` | `PENDING_ROUTE_SEAM` |
| `FL-005` Korean CX | local contribution → Account/CX → cancel/fail/expired → Person verified → original draft | `B-E2E-FL-005-ENTRY`, `B-E2E-FL-005-DECISION`, `B-E2E-FL-005-CANCEL`, `B-E2E-FL-005-ERROR`, `B-E2E-FL-005-RETRY`, `B-E2E-FL-005-TERMINAL`, `B-E2E-FL-005-RETURN` | `B-PX-FL-005-ENTRY-390-EN`, `B-PX-FL-005-ERROR-390-KO`, `B-PX-FL-005-TERMINAL-430-EN`, `B-PX-FL-005-RETURN-DESKTOP-EN` | `B-COPY-FL-005-KO`, `B-COPY-FL-005-EN`; `B-A11Y-FL-005` | `PENDING_ROUTE_SEAM` |
| `FL-006` Residence Card | resident contribution → support check → unsupported/fail → verified or alternate → original context | `B-E2E-FL-006-ENTRY`, `B-E2E-FL-006-DECISION`, `B-E2E-FL-006-CANCEL`, `B-E2E-FL-006-ERROR`, `B-E2E-FL-006-RETRY`, `B-E2E-FL-006-TERMINAL`, `B-E2E-FL-006-RETURN` | `B-PX-FL-006-ENTRY-390-EN`, `B-PX-FL-006-ERROR-390-KO`, `B-PX-FL-006-TERMINAL-430-EN`, `B-PX-FL-006-RETURN-DESKTOP-EN` | `B-COPY-FL-006-KO`, `B-COPY-FL-006-EN`; `B-A11Y-FL-006` | `PENDING_ROUTE_SEAM` |
| `FL-007` Short-term onboarding | first visit → intent/preferences → skip/fallback → Guest map → guide/map | `B-E2E-FL-007-ENTRY`, `B-E2E-FL-007-DECISION`, `B-E2E-FL-007-CANCEL`, `B-E2E-FL-007-ERROR`, `B-E2E-FL-007-RETRY`, `B-E2E-FL-007-TERMINAL`, `B-E2E-FL-007-RETURN` | `B-PX-FL-007-ENTRY-390-EN`, `B-PX-FL-007-ERROR-390-KO`, `B-PX-FL-007-TERMINAL-430-EN`, `B-PX-FL-007-RETURN-DESKTOP-EN` | `B-COPY-FL-007-KO`, `B-COPY-FL-007-EN`; `B-A11Y-FL-007` | `PENDING_ROUTE_SEAM` |
| `FL-008` Korean onboarding | first visit → local intent → skip/account fail → map without CX → map | `B-E2E-FL-008-ENTRY`, `B-E2E-FL-008-DECISION`, `B-E2E-FL-008-CANCEL`, `B-E2E-FL-008-ERROR`, `B-E2E-FL-008-RETRY`, `B-E2E-FL-008-TERMINAL`, `B-E2E-FL-008-RETURN` | `B-PX-FL-008-ENTRY-390-EN`, `B-PX-FL-008-ERROR-390-KO`, `B-PX-FL-008-TERMINAL-430-EN`, `B-PX-FL-008-RETURN-DESKTOP-EN` | `B-COPY-FL-008-KO`, `B-COPY-FL-008-EN`; `B-A11Y-FL-008` | `PENDING_ROUTE_SEAM` |
| `FL-009` Resident onboarding | first visit → resident intent → skip/account fail → map without Residence → map | `B-E2E-FL-009-ENTRY`, `B-E2E-FL-009-DECISION`, `B-E2E-FL-009-CANCEL`, `B-E2E-FL-009-ERROR`, `B-E2E-FL-009-RETRY`, `B-E2E-FL-009-TERMINAL`, `B-E2E-FL-009-RETURN` | `B-PX-FL-009-ENTRY-390-EN`, `B-PX-FL-009-ERROR-390-KO`, `B-PX-FL-009-TERMINAL-430-EN`, `B-PX-FL-009-RETURN-DESKTOP-EN` | `B-COPY-FL-009-KO`, `B-COPY-FL-009-EN`; `B-A11Y-FL-009` | `PENDING_ROUTE_SEAM` |
| `FL-010` Account gate | gated CTA → create account → cancel/fail/invalid token → active → exact one-shot CTA | `B-E2E-FL-010-ENTRY`, `B-E2E-FL-010-DECISION`, `B-E2E-FL-010-CANCEL`, `B-E2E-FL-010-ERROR`, `B-E2E-FL-010-RETRY`, `B-E2E-FL-010-TERMINAL`, `B-E2E-FL-010-RETURN` | `B-PX-FL-010-ENTRY-390-EN`, `B-PX-FL-010-ERROR-390-KO`, `B-PX-FL-010-TERMINAL-430-EN`, `B-PX-FL-010-RETURN-DESKTOP-EN` | `B-COPY-FL-010-KO`, `B-COPY-FL-010-EN`; `B-A11Y-FL-010` | `PENDING_ROUTE_SEAM` |
| `FL-011` Save / My Korea | venue save → Account/pending → cancel/fail → saved → My same venue | `B-E2E-FL-011-ENTRY`, `B-E2E-FL-011-DECISION`, `B-E2E-FL-011-CANCEL`, `B-E2E-FL-011-ERROR`, `B-E2E-FL-011-RETRY`, `B-E2E-FL-011-TERMINAL`, `B-E2E-FL-011-RETURN` | `B-PX-FL-011-ENTRY-390-EN`, `B-PX-FL-011-ERROR-390-KO`, `B-PX-FL-011-TERMINAL-430-EN`, `B-PX-FL-011-RETURN-DESKTOP-EN` | `B-COPY-FL-011-KO`, `B-COPY-FL-011-EN`; `B-A11Y-FL-011` | `PENDING_ROUTE_SEAM` |
| `FL-012` Local Signal / first mission | venue signal → Account+Person/photo → cancel/upload/duplicate fail → submitted → same venue/My | `B-E2E-FL-012-ENTRY`, `B-E2E-FL-012-DECISION`, `B-E2E-FL-012-CANCEL`, `B-E2E-FL-012-ERROR`, `B-E2E-FL-012-RETRY`, `B-E2E-FL-012-TERMINAL`, `B-E2E-FL-012-RETURN` | `B-PX-FL-012-ENTRY-390-EN`, `B-PX-FL-012-ERROR-390-KO`, `B-PX-FL-012-TERMINAL-430-EN`, `B-PX-FL-012-RETURN-DESKTOP-EN` | `B-COPY-FL-012-KO`, `B-COPY-FL-012-EN`; `B-A11Y-FL-012` | `PENDING_ROUTE_SEAM` |
| `FL-013` Manual 19+ proof | After19/venue → age proof → cancel/fail/expired → verified → original CTA | `B-E2E-FL-013-ENTRY`, `B-E2E-FL-013-DECISION`, `B-E2E-FL-013-CANCEL`, `B-E2E-FL-013-ERROR`, `B-E2E-FL-013-RETRY`, `B-E2E-FL-013-TERMINAL`, `B-E2E-FL-013-RETURN` | `B-PX-FL-013-ENTRY-390-EN`, `B-PX-FL-013-ERROR-390-KO`, `B-PX-FL-013-TERMINAL-430-EN`, `B-PX-FL-013-RETURN-DESKTOP-EN` | `B-COPY-FL-013-KO`, `B-COPY-FL-013-EN`; `B-A11Y-FL-013` | `PENDING_ROUTE_SEAM` |
| `FL-014` Auto After19 | KST resume → four guards/banner → guard failure/manual off → night map → same-session off/new-session reset | `B-E2E-FL-014-ENTRY`, `B-E2E-FL-014-DECISION`, `B-E2E-FL-014-CANCEL`, `B-E2E-FL-014-ERROR`, `B-E2E-FL-014-RETRY`, `B-E2E-FL-014-TERMINAL`, `B-E2E-FL-014-RETURN` | `B-PX-FL-014-ENTRY-390-EN`, `B-PX-FL-014-ERROR-390-KO`, `B-PX-FL-014-TERMINAL-430-EN`, `B-PX-FL-014-RETURN-DESKTOP-EN` | `B-COPY-FL-014-KO`, `B-COPY-FL-014-EN`; `B-A11Y-FL-014` | `PENDING_ROUTE_SEAM` |
| `FL-015` Optional public profile | My/ID profile → consent fields → cancel/save fail → partial saved → profile with four axes | `B-E2E-FL-015-ENTRY`, `B-E2E-FL-015-DECISION`, `B-E2E-FL-015-CANCEL`, `B-E2E-FL-015-ERROR`, `B-E2E-FL-015-RETRY`, `B-E2E-FL-015-TERMINAL`, `B-E2E-FL-015-RETURN` | `B-PX-FL-015-ENTRY-390-EN`, `B-PX-FL-015-ERROR-390-KO`, `B-PX-FL-015-TERMINAL-430-EN`, `B-PX-FL-015-RETURN-DESKTOP-EN` | `B-COPY-FL-015-KO`, `B-COPY-FL-015-EN`; `B-A11Y-FL-015` | `PENDING_ROUTE_SEAM` |
| `FL-016` Evidence / merchant trait | venue facts/Labs → evidence check → stale/error/mismatch → limited receipt → same venue/Labs | `B-E2E-FL-016-ENTRY`, `B-E2E-FL-016-DECISION`, `B-E2E-FL-016-CANCEL`, `B-E2E-FL-016-ERROR`, `B-E2E-FL-016-RETRY`, `B-E2E-FL-016-TERMINAL`, `B-E2E-FL-016-RETURN` | `B-PX-FL-016-ENTRY-390-EN`, `B-PX-FL-016-ERROR-390-KO`, `B-PX-FL-016-TERMINAL-430-EN`, `B-PX-FL-016-RETURN-DESKTOP-EN` | `B-COPY-FL-016-KO`, `B-COPY-FL-016-EN`; `B-A11Y-FL-016` | `PENDING_ROUTE_SEAM` |
| `FL-017` Payment KYC | checkout → Payment KYC → cancel/fail/expired → verified → same checkout | `B-E2E-FL-017-ENTRY`, `B-E2E-FL-017-DECISION`, `B-E2E-FL-017-CANCEL`, `B-E2E-FL-017-ERROR`, `B-E2E-FL-017-RETRY`, `B-E2E-FL-017-TERMINAL`, `B-E2E-FL-017-RETURN` | `B-PX-FL-017-ENTRY-390-EN`, `B-PX-FL-017-ERROR-390-KO`, `B-PX-FL-017-TERMINAL-430-EN`, `B-PX-FL-017-RETURN-DESKTOP-EN` | `B-COPY-FL-017-KO`, `B-COPY-FL-017-EN`; `B-A11Y-FL-017` | `PENDING_ROUTE_SEAM` |
| `FL-018` Labs wallet / bridge | My milestone/Labs → acknowledge/signer/quote → cancel/fail/expiry/mismatch → simulated receipt/badge → My | `B-E2E-FL-018-ENTRY`, `B-E2E-FL-018-DECISION`, `B-E2E-FL-018-CANCEL`, `B-E2E-FL-018-ERROR`, `B-E2E-FL-018-RETRY`, `B-E2E-FL-018-TERMINAL`, `B-E2E-FL-018-RETURN` | `B-PX-FL-018-ENTRY-390-EN`, `B-PX-FL-018-ERROR-390-KO`, `B-PX-FL-018-TERMINAL-430-EN`, `B-PX-FL-018-RETURN-DESKTOP-EN` | `B-COPY-FL-018-KO`, `B-COPY-FL-018-EN`; `B-A11Y-FL-018` | `PENDING_ROUTE_SEAM` |

## 4. Coverage arithmetic

| Registry | 필수 수 | 현재 slot 수 | 현재 실행 PASS |
|---|---:|---:|---:|
| Requirements | 19 | 19 | 0 |
| Browser checkpoints | 18 × 7 = 126 | 126 | 0 |
| Pixel checkpoints | 18 × 4 = 72 | 72 | 0 |
| Content locale checks | 18 × 2 = 36 | 36 | 0 |
| A11y checks | 18 | 18 | 0 |
| Blind review roles / round | 5 | 5 | 0 |

Slot이 있다는 사실은 검증 결과가 아니다. 실행한 현재 B SHA, viewport, locale, screenshot checksum, browser 결과, reviewer evidence가 [Evidence Manifest](./04_EVIDENCE_MANIFEST.md)에 연결돼야만 `PASS`가 된다.
