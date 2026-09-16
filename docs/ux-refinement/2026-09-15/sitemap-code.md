# 코드 기반 여정 지도 · 독립 동결 및 교차 분류 완료

최초 독립 기준: `b9cdc42` · 브랜치 `ux/flow-refinement-20260915` · 작성일 2026-09-15. 현행 구조는 2026-09-16 `b7bdba0` 기준 `feat/ktour-public-guide-20260916`의 D04 공개 읽기/선택적 저장 v2까지 반영한다. 이번 v2의 runtime·배포 검수는 아직 별도 판정 전이다.

**상태: 코드↔브라우저 차이 분류 완료, 전체 UI 검수 완료 아님.** 첫 동결 당시 브라우저 실행은 0회였고 다른 mapper의 산출물을 읽지 않았다. 이후 별도 온보딩 증거와 독립 commerce 반례를 대조했다. 현재 판정은 마지막 ‘CODE-01–12 최종 분류’를 따른다. [기계 판독 registry](./sitemap-code.json)가 상세 정본이며 이 파일은 탐색용 요약이다.

**후속 UX08/D04 구조 통합:** 기존 78노드/264행과 D03의 79노드/273행은 각 시점 이력이다. D04는 `PUBLIC_NEIGHBORHOOD_GUIDE`를 선택적 `EXPERIENCE_FLOW`와 분리하고 실제 연결 5개·묶음 전이 1행을 추가했다. 현 구조는 80노드/279행이며 전체 상태 조합 PASS가 아니다. 이전 UX08/D03 검수를 v2에 상속하지 않는다.

## 범위와 수량

- 공개 사용자 URL은 `/` 하나. `/ondo-b`는 redirect, venue API는 읽기 API이지 화면이 아니다. 옛 A 경로는 배포 정책에서 제외된다.
- 최신 구조 재계수: **80개 의미 단위 노드**, **202개 명시적 노드 간 edge**, **77개 묶음 내부 전이 행**(총 279행). 고유 step 이름은 177개이며 화면 수나 브라우저 통과 수가 아니다. 공개 URL은 추가되지 않았다.
- D03 당시 source manifest는 **178행/177개 고유 파일/128개 코드 파일**이었다. D04에는 `experience-b/saved-experience-b.tsx`가 추가됐다. JSON의 manifest 수치와 어휘 285묶음/UI anchor 772개·상세 `source_census`는 각 **D04 이전 snapshot**으로 유지하며 신규 코드의 전체 AST 재추출 수치가 아니다. 타입 문자열을 화면 수로 사용하면 안 된다.
- 기존 FL-001–018 전부, G01–13 및 G08-R/G09-S, MW-01–05를 연결했다. 과거 QA 18 flow/126 checkpoint/50 visual case는 대조 자료일 뿐 이번 검수 결과나 현 기능 전체 분모가 아니다.

## 읽는 법 / 미완료 범위

각 JSON 노드는 steps·states·진입 조건·actions·mutation·복귀·소스 라인·보호할 상태·실행 모드를 가진다. edge는 실제 호출/이벤트/복귀 관계를 기록하되 조건 분기는 실행 전이다. states 일부는 원본 enum, 일부는 화면 의미를 요약한 semantic 이름이며 각 파일의 원본 union/hook/anchor는 source_census로 대조한다.

**다음은 아직 완료가 아니다:** 개별 상태별 브라우저 도달, 모든 내부 버튼→정확한 다음 state 쌍의 분해, gate/overlay 중첩의 실제 focus/scroll 결과, 저장 차단·이미지/타일 실패·만료·새로고침의 재현, private 상태/QA fixture의 실제 사용자 진입 여부, 최신 PRD 필수 연결 여정의 최종 판정. 그룹 내부 전이 행은 행동/상태 후보를 보존한 것으로 Cartesian 전이나 완주를 뜻하지 않는다. 미확인 항목을 누락/성공으로 바꾸지 않고 아래 쟁점과 JSON unknowns에 남겼다.

정적 연결이 있다는 것과 운영 화면에서 클릭 가능하다는 것은 다르다. 기본 공개 앱은 local sample 환경이며, review=0 opt-out·visible sample selector·QA 전용 injection을 분리해서 교차 검수해야 한다. Sumsub 실험과 실제 CX/OpenDID/OmniOne/Sui 구현은 이 W3 배포 코드에 포함되지 않는다.

## 전체 의미 단위

### 공개 셸/탐색/장소

| ID | 표면 / 단계 | 기존 여정 | 주요 보호 상태 |
|---|---|---|---|
| `SHELL` | Public app shell / 5 internal tabs; hydrate → nation_or_restored_context | FL-001, G01, G13 | 진입/취소/복귀·원래 상태 보존 |
| `LEGACY_REDIRECT` | Legacy /ondo-b redirect; redirect | G01 | 진입/취소/복귀·원래 상태 보존 |
| `BLOCKED_ROUTES` | Archived A pages / removed public assets; not_published | 배포/공유 경계 | blocked_http_path |
| `MODAL_SHELL` | Shared sheet, top-layer focus and close contract; opening → open → closing | G01, G05, G09, G13 | 진입/취소/복귀·원래 상태 보존 |
| `NATION` | Nation / first entry; nation | FL-001, FL-007, FL-008, FL-009, G01, G02 | 진입/취소/복귀·원래 상태 보존 |
| `CITY_MAP` | City map, search, category and camera; city_map | FL-001, G01, MW-01, MW-03 | 진입/취소/복귀·원래 상태 보존 |
| `CITY_LIST` | List + research recommendations + balance-place filter; city_list | FL-001, FL-011, G01, G03, MW-01, MW-03 | 진입/취소/복귀·원래 상태 보존 |
| `MAP_OPTIONS` | Compact mobile map options; options | FL-001, FL-013, FL-014, G01, G07, G13 | closed, night_locked |
| `LOCATION` | Requested geolocation / privacy explanation; idle → request → result | FL-001, G01 | denied, unsupported |
| `HEAT_TIMELINE` | Shared temperature/activity replay; sample_frame | FL-001, G01, G03 | 진입/취소/복귀·원래 상태 보존 |
| `HEAT_INFO` | Temperature composition / source / map credits; legend → methodology → source_credits | FL-001, FL-016, G01, G03 | closed |
| `JAPAN_GUIDE` | Seoul / Jeju editorial guide and stories; guide → story → detail | FL-001, FL-016, G01, G03 | image_failed |
| `RESEARCH_PICK` | Worth a stop / researched food detail; recommendation_card → detail | FL-001, FL-016, G03, MW-01, MW-04 | image_failed |
| `PLACE_DATA` | Canonical detail data loading and validity; load → ready_or_recover | FL-001, FL-016, G03 | request_failed |
| `CANONICAL_PEEK` | Canonical place peek; peek | FL-001, FL-011, G03, MW-01, MW-04 | sample_pulse_or_unknown |
| `CANONICAL_DETAIL` | Canonical place full detail; detail | FL-001, FL-002, FL-010, FL-011, FL-012, FL-016, G03, G07, G08, MW-01, MW-04 | save_failed, after19_locked |
| `PLACE_FACT` | Before you go / evidence detail; hours → cards → menu → language → source_details | FL-016, G03 | unknown |
| `EDITORIAL_PEEK` | Editorial place peek; peek | FL-001, FL-011, FL-016, G03, MW-01 | image_failed |
| `EDITORIAL_DETAIL` | Editorial place detail; detail | FL-001, FL-011, FL-016, G03, MW-01, MW-04 | 진입/취소/복귀·원래 상태 보존 |
| `PLACE_SERVICE_ENTRY` | Explicit per-place services / map context capture; capability_lookup → entry | G03, G08-R, G10, MW-01, MW-04 | 진입/취소/복귀·원래 상태 보존 |
| `ONBOARDING` | Optional discovery preferences; intent → area → preferences | FL-007, FL-008, FL-009, G02 | save_error |
| `SAMPLE_INFO` | Review/sample explanation and operator/demo entry; info | G05, G06, G08-R, G11, G13 | 진입/취소/복귀·원래 상태 보존 |

### 자격/ID/연령/기여

| ID | 표면 / 단계 | 기존 여정 | 주요 보호 상태 |
|---|---|---|---|
| `ID_WALLET_TAB` | ID · Wallet readiness home; readiness → wallet | FL-005, FL-006, FL-015, FL-017, G04, G05, G09 | 진입/취소/복귀·원래 상태 보존 |
| `ACCOUNT_GATE` | Account / save task gate; intro → processing → failure | FL-010, FL-011, G04 | failure |
| `ACTION_GATE` | Purpose-bound prerequisite coordinator; account → person → age → payment_kyc → credential → resume | FL-003, FL-005, FL-006, FL-012, FL-017, FL-018, G04, G05, G06, G07, G10, MW-01, MW-02 | failure, unavailable, unsupported, expired |
| `LOCAL_CHECK` | Direct Person / Age check walkthrough; account → route → consent → processing → result | FL-005, FL-006, FL-013, G04, G05, G07 | cancel, failure, unavailable, unsupported, expired |
| `ID_SETUP` | K-Tour ID method and consent coordinator; method_select → consent → cx_handoff_preview → document_preview → face_liveness_preview → provider_processing_preview → holder_delivery_preview → credential_ready → presentation_request → presentation_consent → presentation_result → failed → unavailable → expired → cancelled → manual_review → recovery_intro | FL-005, FL-006, G05, G06 | failed, unavailable, expired, cancelled |
| `ID_MOBILE_HANDOFF` | Mobile ID / residence preview handoff; ready → waiting → result → return | FL-005, FL-006, G05 | cancelled |
| `ID_DOCUMENT` | Passport document / NFC sample preparation; sample → permission → denied → capture → checking → review | FL-006, G05 | denied, unavailable, unsupported_document, nfc_unsupported, document_read_failed, document_auth_failed |
| `ID_FACE` | Passport face/liveness preview; permission → capture → review → denied | FL-006, G05 | denied, face_mismatch, liveness_failed |
| `ID_PROCESSING` | Identity provider processing / failure recovery; provider_processing_preview → failed → unavailable → expired → cancelled | FL-005, FL-006, G05 | ISSUER_UNAVAILABLE, CREDENTIAL_ISSUANCE_FAILED, IDENTITY_SESSION_EXPIRED, cancelled |
| `ID_MANUAL_REVIEW` | Manual review / additional information loop; manual_review | FL-005, FL-006, G05 | pending, expired |
| `ID_HOLDER_DELIVERY` | Holder delivery / explicit receipt acknowledgment; prepare_delivery → acknowledge | FL-005, FL-006, G05 | HOLDER_DELIVERY_FAILED |
| `ID_CREDENTIAL` | Credential ready / expiry / suspension / revocation; credential_ready | FL-005, FL-006, G05, G06 | expired |
| `ID_RECOVERY` | Renewal / device restoration; recovery_intro → recovery_request → holder_delivery_preview | FL-005, FL-006, G05 | expired, failed |
| `ID_PRESENTATION` | Purpose-bound VP request / consent / result; presentation_request → presentation_consent → presentation_result | FL-005, FL-006, FL-017, G06, MW-01 | denied, PRESENTATION_REQUEST_EXPIRED, PRESENTATION_DENIED, PRESENTATION_CONTEXT_MISMATCH |
| `PASS_SERVICES` | Pass capability explanation / scenario selector; capability_cards → scenario_picker → policy_result | FL-005, FL-013, FL-017, G05, G06, G07, G10 | denied, expired |
| `PROFILE` | Optional public profile / reputation; summary → edit → discard_confirmation | FL-015, G04 | pending, failed |
| `AFTER19` | Global After 19 / exact-place age prompt; intro → pending → result → active_map → notice | FL-002, FL-013, FL-014, G07 | pending, failure, unavailable, expired, checkExpired |
| `LOCAL_SIGNAL` | Place contribution draft / optional local photo; draft → gate → ready → saving → receipt | FL-005, FL-006, FL-012, G08 | UPL-FAILED, photoTypeError, photoSizeError, photoPrepareError |
| `PUBLIC_NEIGHBORHOOD_GUIDE` | Roba 전체 상세 또는 내 패스의 저장 항목 → 공개 팁 3개 읽기 → 선택적 내 패스에 담기 / 원 장소·패스 복귀 | UX08/D04 무료 읽기 | 인증·IDB·intent 생성 없음, 저장소 차단에도 읽기 가능, v1 이력 불변 |
| `EXPERIENCE_FLOW` | 내 패스에 담기 선택 → 현재 Person·저장 목적 VP → 제안/명시 승인 → 제한 실행 → 컬렉션 저장·독립 감사 → 원 장소·패스 | UX08/D04 저장 v2 | unknown, consumed+blocked, audit pending/failed, cancel 미확정, 만료, 저장 실패, stale revision, live permit 상실 |

### Tables/내 기록/거래/예약

| ID | 표면 / 단계 | 기존 여정 | 주요 보호 상태 |
|---|---|---|---|
| `TABLES` | Tables social-plan list / detail; list → detail → confirm → chat | FL-003, G08, MW-04 | FULL, CLOSED, CANCELLED, FAILED |
| `TABLE_JOIN` | Table join / availability / prerequisite recovery; detail → confirm → requesting → result | FL-003, G08, G07 | FAILED, FULL, CANCELLED |
| `TABLE_CHAT` | Table text/image chat; chat | FL-003, G08 | LOCKED, MSG-FAILED, image_error |
| `TABLE_ACTIVITY` | Arrival / completion / feedback; check_in → complete → feedback | FL-003, G08 | persistence_failed |
| `TABLE_SAFETY` | Leave / report / block; leave_confirm → report → block_confirm → receipt | FL-003, G08 | cancelled, blocked, persist_failed |
| `MY_KOREA` | Saved / recent / planned / contribution / commerce overview; overview → saved → recent → plans → contributions → receipt | FL-011, FL-012, FL-015, FL-018, G04, G08, G10, G12, MW-05 | 진입/취소/복귀·원래 상태 보존 |
| `MY_SAVE_REMOVE` | Remove saved place confirmation; confirm → result | FL-011, G04 | failed |
| `MY_PRIVATE_NOTE` | Per-place private note; read → edit → receipt | FL-011, G04 | failed |
| `MY_MEMORY_MAP` | Saved memory map summary; summary | FL-011, G04 | 진입/취소/복귀·원래 상태 보존 |
| `WALLET_HOME` | Wallet balance, holds, funding and history; balance → funding → history | FL-004, FL-017, G09, G10, MW-02, MW-03, MW-05 | 진입/취소/복귀·원래 상태 보존 |
| `WALLET_CONNECT` | Wallet connection preview; info → linking → preview → result | FL-004, G09 | failed |
| `MAP_BALANCE` | Map balance shortcut / supported-place filter; balance_entry → funding → supported_places | G01, G09, MW-02, MW-03 | 진입/취소/복귀·원래 상태 보존 |
| `FUNDING` | Funding source/amount/consent/operation/result; source → quote → consent → authorize → pending → receipt | G09, G09-S, MW-02, MW-03 | pending, unknown, cancelled, failed, expired, save_error |
| `FUNDING_FIAT` | Bank/card/wallet authorization preview; quote → authorization → pending → result | G09, MW-02, MW-03 | pending, unknown, failed, cancelled, expired |
| `FUNDING_STABLECOIN` | Stablecoin source-to-destination funding; quote → authorization → source_pending → destination_pending → settled | G09-S, MW-02, MW-03 | source_pending, source_failed, source_unknown, destination_pending, destination_failed, destination_unknown, expired |
| `CHECKOUT` | Per-place offer / benefit / quote / payment consent; review → processing → operation → receipt → failure → insufficient → refunded | FL-004, FL-017, G10, MW-01, MW-02 | failure, quote_expired |
| `PAYMENT_OPERATION` | Authorize/hold / capture / query / void; authorize → capture → recheck → settlement | FL-004, FL-017, G10, MW-01, MW-02 | capture_pending, capture_failed, unknown |
| `ORDER_RECEIPT` | Order receipt / ledger / next action; receipt → refunded_receipt | FL-004, FL-017, G10, MW-01, MW-05 | refund_pending, refund_unknown |
| `REFUND` | Partial/full refund operation; amount → request → recheck → result | FL-004, G10, MW-05 | pending, unknown, failed |
| `VISIT_STAMP` | Receipt 뒤 별도 local visit check → checking → saved/failed/duplicate → 선택형 milestone | FL-004, FL-012, G12 | payment만으로 stamp 증가 없음, 실제 방문 증명과 분리 |
| `RESERVATION` | Per-place merchant reservation preview; draft → requesting → result → cancellation → history | G08-R, MW-04, MW-05 | full, failed, unknown, cancelling, cancel_failed, cancel_unknown, cancelled, persistence_error |

### 파트너/설정/Labs/경계

| ID | 표면 / 단계 | 기존 여정 | 주요 보호 상태 |
|---|---|---|---|
| `PARTNER_DEMO` | Integration review workspace; verify → settlements → events | FL-016, G06, G11 | 진입/취소/복귀·원래 상태 보존 |
| `PARTNER_WORKSPACE` | Partner workspace / device / counter request; sign_in → device → counter → permission → scan → denied | G06 | denied |
| `PARTNER_VERIFY` | Partner purpose / request / consent / result; request → consent → result | G06 | expired, denied |
| `PARTNER_SETTLEMENT` | Settlement / reconcile preview; summary → request → result | FL-016, G11 | pending, mismatched, failed |
| `PARTNER_SUPPORT` | Payment/refund/reconciliation support case; reason → review → pending → result → history | G11 | pending, unknown, failed, stale |
| `CHAIN_EVENTS` | Audit event / voucher preview ledger; event_list → submit → check → receipt | FL-016, G11 | pending, failed |
| `SETTINGS` | Settings home / language / appearance / preferences; home → language → appearance → preferences → privacy → delete | G13 | language_error, appearance_error, preference_error, reset_error |
| `LOCAL_DATA_DELETE` | Delete local app data confirmation; review → deleting → result | G13 | 진입/취소/복귀·원래 상태 보존 |
| `ACCOUNT_SERVICES` | Export / revoke / delete service previews; choose → review → pending → result | G13 | pending, unknown, failed |
| `LABS` | Optional Labs acknowledgment / experiments; acknowledgment → experiments | FL-018, FL-016, G12 | history_failed |
| `LABS_WALLET` | Labs signer / zkLogin preview; connect → preview → result | FL-018, G12 | WAL-FAILED, oauth_cancel, epoch_expired, prover_failed, sponsor_denied |
| `LABS_BRIDGE` | Ordered bridge quote / source / relay / destination; quote → confirm → source_submitted → source_confirmed → relaying → destination_confirmed | FL-018, G12 | BRG-PENDING, BRG-FAILED, BRG-CANCELLED, BRG-EXPIRED |
| `LABS_TRAIT` | Merchant trait / limited eligibility; check → result | FL-016, G12 | failed, unknown, stale, error |
| `LABS_BADGE` | Opt-in milestone badge preview; eligibility → opt_in → gate → mint → receipt | FL-004, FL-012, FL-018, G12 | NFT-LOCKED, NFT-FAILED |
| `RELOAD_BOUNDARY` | Device/session restore and failure semantics; persist → restore → recover | FL-002, FL-003, FL-011, FL-014, FL-018, G04, G08, G09, G13, MW-05 | storage_blocked |
| `REQUIRED_REAL_HACKATHON` | Developer real-integration requirement (not public mock implementation); CX → OpenDID VC/VP → AI proposal → user consent → Sui bounded Move action → server final eligibility/use → OmniOne audit | G05, G06, G11, G12 | 진입/취소/복귀·원래 상태 보존 |
| `SUMSUB_EXCLUDED` | Separate real Sandbox passport experiment; not_published_here | G05 | 진입/취소/복귀·원래 상태 보존 |

## 초기 불일치와 위험 후보 · 이력

아래는 독립 동결 당시 후보 목록이다. 현재 분류·해결 여부는 문서 마지막 표가 우선한다.

| ID | 현재 근거 / 상태 | 판정할 내용 | 담당 |
|---|---|---|---|
| CODE-01 | Historical production catalog excludes currently mounted B ID/After19/Tables/commerce/Labs. (code_doc_conflict_confirmed) | Use active code and browser evidence; guardian reconcile stale document, do not delete current features. | coordinator/PRD guardian |
| CODE-02 | 18 flows/126 checkpoint registry is not the current comprehensive inventory; later reservation, rail funding, authorization/capture, partial refunds, support and account-service states exceed it. (confirmed_registry_scope_limit) | Use this semantic graph plus census and browser delta; registry actual labels do not imply real providers or fresh PASS. | inventory reviewers |
| CODE-03 | Canonical peek prioritizes details while editorial peek prioritizes directions; registered service actions appear at full detail. (static_candidate_not_browser_verified) | UX consensus before any CTA consolidation; preserve source type and registry eligibility. | discovery UX |
| CODE-04 | Order-origin top-up completion copy is generic wallet return despite pending checkout context. (static_candidate_not_browser_verified) | Browser verify actual return then align CTA with origin without auto-paying. | commerce UX |
| CODE-05 | Partial-refund panel and legacy full refund action coexist. (static_candidate_not_browser_verified) | One entry may be desirable; protect full/partial/pending/unknown/failed/same-order behavior. | commerce UX |
| CODE-06 | My Korea receipt shortcuts use selected current commerce session and fixed legacy receipt IDs while commerce supports multiple orders. (unverified_risk) | Test two distinct place orders and refund navigation; do not label confirmed bug without runtime evidence. | browser + commerce reviewer |
| CODE-07 | Device persisted subsets differ from initial commerceSession; reload completeness cannot be inferred. (unverified_behavior_boundary) | Enumerate full/partial/unknown payment and top-up reload guarantees; prevent double-credit restoration. | commerce/state guardian |
| CODE-08 | Public Labs previews are not the integrated real CX→OpenDID→bounded AI/Sui→server eligibility→OmniOne workflow. (requirement_mapping_pending) | Guardian separates developer integration from any missing connected prototype; do not call existing Labs complete real implementation. | PRD guardian |
| CODE-09 | Optional setup requests city-null focus and resetMap on cancel/finish; re-opening preferences from city may lose current discovery context. (static_candidate_not_browser_verified) | Inspect exact origin and browser behavior before one-form simplification; retain draft save failure and explicit no-change cancel. | discovery UX |
| CODE-10 | QA-only injection is not public reachability. Review-mode sample selectors are public conditional controls; review=0 is a separate opt-out state. (classification_rule) | Browser classify normal visible action, visible sample selector, test injection only, unreachable or requirement gap separately. | both inventory reviewers |
| CODE-11 | Recommendation content photo absence must not be mistaken for a loading failure, and new photos do not grant service capabilities. (content_manifest_reconciliation_pending) | Content owner separately confirms coverage/rights; this map records photo absent/failed branch not real-photo availability. | content reviewer |
| CODE-12 | Some source branches/types are not independent reachable surfaces: onboarding origin enum, legacy preference intents, inner empty sections already guarded by count>0, legacy A domain/tab vocabulary. (do_not_overcount) | Retain in source census, not counted as live pages. Resolve only if browser or active call site proves an entry. | both inventory reviewers |

## 반드시 보존할 계약

- INV-01: Map-first guest browsing; optional preferences/ID must not block initial map.
- INV-02: Account, Person, Age, credential/VP, Payment KYC and service entitlement remain separate. Fixture/local declarations never become real provider verification.
- INV-03: One topmost modal owns focus, inert background, close and keyboard; closing restores exact source focus or safe same-context fallback.
- INV-04: Return token binds action, subject and exact place/context. No private draft, proof, wallet or payment authority in URL; consume once and reject stale/mismatched intent.
- INV-05: Pre-submit cancel does not mutate. Closing after submission is not cancellation or refund: pending/unknown/held amounts must remain identifiable and recheckable.
- INV-06: Funding credit only after destination confirmation; apply once. Funding is not purchase consent, age/person proof, benefit eligibility or visit proof.
- INV-07: Authorize/hold, capture, settlement and partial/full refund remain separate. Unknown is neither paid nor failed; retries target same operation.
- INV-08: Table social plan is not merchant reservation. Listing/research/photo does not imply partner services or verified live availability.
- INV-09: Heat replay, local contribution and actual verified activity are distinct. Payment/photo/ID is not a real visit.
- INV-10: Locale, theme and After 19 are independent dimensions. Preserve reduced-motion, image/tile failure, keyboard, small-height and storage failure branches.
- INV-11: Reload persistence is feature-specific; sharing a state provider is not proof that money/order/identity sessions survive reload.

## 증거와 다음 작업

공개 마운트는 [root product](../../../k-tour-id-app/features/ondo/app/ondo-product-b.tsx), 배포 경계는 [standalone policy](../../../k-tour-id-app/scripts/ondo-b-standalone/policy.mjs), 원래 FL registry는 [QA helper](../../../k-tour-id-app/tests/helpers/ondo-b-qa.ts)를 확인한다. 개별 node의 line은 JSON source에 기록했다.

첫 동결 후 `사용자 도달 / 샘플 선택으로 도달 / injection 전용 / 코드상만 존재 / 미구현 요구 / 미검수` 분류를 완료했다. 승인된 작은 UX 묶음은 구현·부분 실행 검수까지 진행했지만, 상태별 완주·새로고침·After 19·모든 화면 크기 등 미검수 범위를 성공으로 바꾸지 않았다. 하단 표와 별도 비작성자 검수 문서가 현재 결과다.

## 첫 동결 후 브라우저 교차 검토

독립 [브라우저 지도](./sitemap-browser.md)의 B001–B040을 **첫 코드 동결 후에만** 읽었다. 다음은 구체적 차이이며 코드 78개 노드 전체를 PASS로 승격하지 않는다.

| 차이 | 판정 / 수정 | 남은 검증 / 담당 |
|---|---|---|
| 국가/Options의 취향 조작을 초기 graph가 wizard 직결로 요약 | 실제로 Settings 탭을 거친다. B003/B028 및 map-entry-b.tsx:3325/3749로 E-010/E-061 정정 | Settings Preferences one-sheet와 Restart 3-step을 구분. 발견 UX |
| setup 완료/취소 복귀를 nation으로 묶음 | 취소는 city-null, 완료는 선택 area 이동 가능. E-060 설명 정정; 아직 완료 성공 edge 별도 분해는 미완료 | 기존 취향 보존과 원 도시/검색/scroll 보존은 별도. provider:1213–1230, map:1683–1702 기준 재현. 브라우저 담당 |
| 주문 충전 복귀 손실 가능성 | B032→033에서 Zest와 ₩28,000은 유지됨. 이 관찰의 문제는 ‘잔액으로’ 문구와 이전 settled 영수증 재열기 | 부족분 새 충전·unknown·만료·Wallet origin은 아직 미검수. 거래 UX |
| 환불 중복 입구 | B038에서 실제 두 입구, B039 부분 환불 ₩5,000 후 ₩23,000 잔액 확인. CODE-05의 중복 노출은 재현 근거 있음 | 전액·unknown·반복 submit·다른 주문 귀속은 별도. 거래 UX |
| ID coverage | B012–019는 Passport 선택/동의/샘플 문서 permission deny 및 복귀까지만 실행 | 발급/holder/VP/만료/폐기·Mobile ID/Residence는 static inventory이지 완료 아님. identity 검수 |
| Tables/Labs/예약/안전·설정 데이터 | 첫 browser map은 대부분 root/진입점만 관찰 | 의미 노드·원본 enum으로 후속 시나리오 구성, 도달 못함과 미구현을 구분. Gate A 담당 |
| Wallet 문구와 funding entry | B020–026의 empty→seed 60k, 잔액 있는데 ‘먼저 충전’, 충전에서 자기 잔액 선택을 별도 발견 | 금액 모델을 바꾸지 않고 목적/상태 copy부터 정리. UX09 |

추가 UI 결함을 추정만으로 확정하지 않는다. 전체 Gate A는 아직 부분 상태 도달·최신 필수 요구 대조가 남아 있으며, 승인된 작은 수정 묶음과 전체 완주를 별도로 관리한다.

### 후속 증거 반영 · CODE-01–12 최종 분류

브라우저 담당의 별도 `optional-onboarding/observations.json` 12관찰 및 두 UX 리뷰를 최초 독립 평가 **후** 읽었다. 010–012에서 취소 후 `?city=busan`, 저장된 café=true / 미저장 classic=false가 확인된다. 도시/취향 보존은 실제 반례이므로 CODE-09를 ‘도시가 사라지는 확인된 버그’로 주장하지 않는다. camera/zoom/query/list-scroll의 정확한 복원은 측정하지 않았다.

| 코드 항목 | 교차 검토 후 분류 | 후속 담당 / 범위 |
|---|---|---|
| CODE-01 | 분류 완료: 현행 마운트/브라우저가 정본, 과거 catalog와 불일치 확정 | 역사 문서로 현 기능 삭제·완료 판단 금지 |
| CODE-02 | 분류 완료: 18/126은 역사 registry, 40+12 관찰도 전체 분모 아님 | 구조 78노드/189edge/75묶음과 실행 증거를 분리 |
| CODE-03 | UX03 등록 매장 한정 primary service + Details로 source 변경 | 짧은 높이의 sticky CTA·타입별 focus/시각 검수는 별도. 이 지도에서 일괄 PASS 아님 |
| CODE-04 | B032→033 문구 불일치 확정 후 목적/복귀 copy 수정. 독립 bank unknown→닫기→같은 operation 복원→1회 credit→새 methods PASS | 원 checkout의 모든 부족/만료 조건은 아직 미검수 |
| CODE-05 | 중복 입구 source 제거. 독립 두 주문에서 Zest 환불 unknown 복원/조회/1회 credit, Bar Cham 미변경 PASS | 전액·급속 중복 submit·비EN 전체를 통과로 추정하지 않음 |
| CODE-06 | **3가지 origin의 선택 구매→실제 영수증→동일 매장 복귀 표적 PASS**: canonical Roba(4830), editorial 제주 해녀의부엌(0b1f), research Zest/Bar Cham 및 다중 주문·환불 격리(4830 비작성자 R009–025) | 빌드·대상·조건별 증거이며 모든 상태/locale/device/reload 통과가 아님. canonical/research 결과를 후속 0b1f 재실행으로 표기하지 않음 |
| CODE-07 | same-session 닫기/재열기는 PASS, **reload/저장 실패는 미검수** | 두 상태를 혼동하지 않고 수명 변경은 별도 승인 |
| CODE-08 | real CX/OpenDID/AI-Sui/OmniOne 통합과 local Labs를 구분 완료 | 당시 보류한 UX08은 9/15 후속 사용자 승인으로 별도 목업 구현·검수 중(아래 보충). 실제 연동은 개발자 범위 |
| CODE-09 | Busan/저장 café 보존은 실제 PASS, 임시 nation preview≠맥락 손실 | exact camera/query/list-scroll 미측정; UX04 재설계 보류 |
| CODE-10 | 최초/추가 검수 모두 visible local sample UI 사용, 금융·계정 state injection 없음 | review=0/실제 provider/미방문 분기는 별도 미검수 |
| CODE-11 | 초기 Onion-only 게이트 이후 **어니언 안국·학림다방 2개 실제 사진 승인/반영**. 학림 콘텐츠 1곳 추가로 research 25곳; 최신 media manifest·시각 검수·릴리스가 근거 | absent/failed·권리/출처/크롭 구분 유지. 기존 서비스 등록 27곳 불변, 학림 사진/추천 추가≠결제·예약·혜택 capability |
| CODE-12 | legacy enum/guarded-empty는 source census 어휘로만 유지 | 도달·화면·구조 노드로 과장하지 않음 |

**원 코드 지도의 의미 정정:** `VISIT_STAMP`는 결제로 9→10을 자동 만드는 단계가 아니다. B037은 결제 후 0개와 별도 Check this visit을 보여준다. `visit-stamp-receipt-b.tsx:84–105`에서 명시적 로컬 확인 후 canonical venue 조건과 unique evidence 검사를 거쳐서만 기록된다. 실패/duplicate/unavailable을 보존한다. 역사 FL-004의 stamp milestone 문구를 현재 자동 동작처럼 읽지 않는다. JSON 노드와 내부 grouped transition에도 이 교정을 반영했다.

### 선택 구매 복귀 graph 정정

`MY_KOREA`의 Selected purchase는 기존 탭 안의 카드이며 새 페이지가 아니다. `E-132`는 잘못된 ‘별도 영수증 화면’ 요약을 실제 **Open wallet → WALLET_HOME**으로 정정했다. `E-187/188/189`는 같은 카드에서 각각 canonical/editorial/research 장소로 복귀하는 조건부 edge다. 현재 source는 `saved-entry-b.tsx:292,573`, registry 반환 이벤트, `map-entry-b.tsx:3073`을 연결하며 구매/잔액/자격을 변경하지 않는다. **세 edge 모두 수정 후 버전별 표적 PASS**이며 모든 주문/상태를 커버하지 않는다.

추가 실제 검수는 [adversarial-commerce-wave1.md](./adversarial-commerce-wave1.md)에 초기 결함과 조건·잔액·같은 operation ID·캡처를 기록했다. 수정 후 CODE-06 증거는 아래 버전별 기록과 [비작성자 후속](./adversarial-root-wave2.md)을 따른다. Scoped PASS는 전체 상태 완료를 뜻하지 않는다. 전체 노드의 모든 상태를 실행한 수는 여전히 0이며, 이는 일부 실제 PASS를 부정하는 수치가 아니라 보수적인 **whole-node coverage** 정의다.

수정 후 research 증거: root 보고 `artifacts/qa/ux-wave2-core` 및 `/tmp/ktour-ux-wave2-core.json` 12/12 중 commerce 테스트가 Zest 5천원+남은 2만3천원 환불 후 실제 payment/refund 참조 2개와 같은 장소 복귀를 확인했다. 별도 비작성자 [R002–007](./adversarial-root-wave2.md)은 첫 수정 artifact `page-9b5879f4ec0dd6ea`에서 5천원 부분 환불 후 My Korea 참조/같은 Zest/잔액 3만7천원을 확인했다. 둘은 독립 검증 수준이 다르며 이후 footer/scroll/empty-state가 포함된 최종 빌드의 통과로 재사용하지 않는다.

독립 canonical 최종 표적: `page-4830b1d8d0c4bd61.js`, 공개 Roba URL, 새 EN 390×844 세션, visible sample 동작만 사용. 2만2천원 구매→영수증→매장→My Korea의 동일 canonical/order/reference→같은 장소→잔액 3만8천원·동일 order 유지 PASS. `artifacts/qa/ux-audit/canonical-receipt-isolated-4830/results.json`에 기록했다. pageerror/외부 mutation 0. 앞선 동시작업 중 timeout은 단독으로 재현되지 않았지만 원인을 확정하지 않는다. 이후 disclosure source 변경은 이 결과에 포함되지 않는다.

독립 editorial 최종 표적: **`page-0b1f4b74cde440be.js`**, 새 EN 390×844 세션에서 공개 `jeju-haenyeo-kitchen-bukchon` URL→peek 서비스→명시적 지갑 설정/구매 동의/Account·Payment→3만2천원 구매→영수증→My Korea의 같은 매장/생성 order/실제 receipt→동일 editorial 복귀→잔액 2만8천원·같은 order 유지 PASS. `artifacts/qa/ux-audit/editorial-receipt-final-0b1f/results.json`과 3개 캡처에 기록했다. pageerror/외부 mutation/state injection 0. 연구 다중 주문 R009–025는 **4830**에서 두 매장별 receipt/settled refund 참조 격리, unknown/failed 환불 참조 제외와 복귀 후 잔액 보존을 확인했다. 각 결과를 동일 빌드의 전체 여정 완료로 합치지 않는다.

**반환 수준 정정:** 두 독립 캡처에서 canonical/editorial은 원래 진입한 **peek**로 돌아왔다. JSON E-187/E-188의 주 target은 실제 확인한 `CANONICAL_PEEK`/`EDITORIAL_PEEK`이며, expanded detail-origin 복귀는 `conditional_alternative_target`으로만 남긴다. 같은 매장 복귀 PASS를 expanded detail 복귀 PASS로 바꾸지 않는다. 이는 노드나 edge를 새로 늘린 것이 아니다.

## UX-08/D04 후속 — 무료 읽기와 선택적 패스 저장

v1은 `feat/ktour-experience-share-20260915`에서 구현·한정 검수했다. 사용자 승인된 D04는 `feat/ktour-public-guide-20260916`에서 공개 reader와 선택적 저장을 분리한다. 아래 구간은 별도 공용 페이지 수가 아니다. 기존 `E-190`–`E-197`를 저장 v2에 맞추고 reader/패스/취소 연결 `E-198`–`E-202`, 내부 `S-PUBLIC_NEIGHBORHOOD_GUIDE`를 추가했다.

| 보충 ID | 진입 → 상태/행동 → 다음·복귀 | 정적 계약 / 현재 확인 범위 |
|---|---|---|
| UX08-ENTRY | canonical Roba 전체 상세 → 공개 골목 가이드 / 내 패스의 저장 항목 → 같은 공개 reader | 장소 `mois-0021cd596bc5b2a922ad` 1곳, `requestExperienceB(placeId, source)`/`ktour:experience:open`. 공개 열람은 IDB/gate/intent/실행 기록 없음. peek 2CTA·금융/예약 유지. 패스 출발은 닫으면 패스로, 장소 출발은 같은 장소로 복귀 |
| UX08-PERSON | **내 패스에 담기 선택** → 필요한 account/person → 동일 행동의 Person 결과 재사용 → 명시 패스 생성/보관 동의 → holder 준비/ack → 저장 목적 person VP | `experience-add-to-pass`에서 필요한 gate로 바로 이동. gate 취소는 무료 reader 복귀. `verified_person_consent`는 같은 live token/intent/receipt만 재사용하며, 준비만 자동·ack/발급/VP는 명시 동의 유지. Person 이외 자격 추정 없음 |
| UX08-PROPOSAL | 유효 runtime permit → 준비된 저장 제안 → 대상/수신자/1회/금액0/최대5분 승인 | action `save-neighborhood-guide-to-pass`, campaign `ktour-neighborhood-guide-save-v2`, recipient `demo-traveler-pass`, record version2. v1 읽기 승인·기록은 삭제/변환/재사용 없음. 실제 모델/지갑/서명 호출 아님 |
| UX08-EXECUTION | approve → granted → success/unknown/failure 또는 stop/revoke/expired | `authorization` 축, 같은 intent·최대1회, unknown에서 새 건 자동 생성 금지 |
| UX08-RESULT | consumed → 현재 자격 재확인 → 컬렉션 pending/fulfilled/blocked → 독립 audit pending/confirmed/failed | `experience-saved-guides`/`experience-saved-guide`는 fulfilled일 때만 표시. 컬렉션 항목은 로컬 목업이며 signed VC·매장 쿠폰·방문·잔액/Payment 권한 아님. 실패 결과에서도 공개 내용은 읽을 수 있음 |
| UX08-RESUME | 이미 선택한 저장 흐름 닫기/새로고침 → 같은 v2 이력 → 필요한 새 목적별 확인 | `ktour.experience-save-open.v2`의 place/pass는 UI 복귀용. 기존 DB/store의 새 campaign key만 사용하며 v1 marker/record는 보존. permit은 WeakMap으로 복원 불가. 공개 reader는 이력 조회 없이 반복 열람 가능 |

구체 파일과 Harvey adapter 매핑은 [체험 목업 인계](../../EXPERIENCE_MOCK_HANDOFF_2026-09-15.md#현재-저장된-코드-계약)에 있다. v2는 정적 연결 확인과 새 runtime 검수를 분리하며, 아래 v1 결과를 무료 읽기·저장 v2 PASS로 바꾸지 않는다. 12개 저장 UI 단계와 승인7/저장4/감사4 축은 가능한 모든 조합이나 완주 수가 아니다.

**D04 이전 v1 local artifact 한정 검수:** `page-cb3c6ace225a6949.js` / 3116에서 experience E2E **8/8 PASS, 110.15초**, mobile-chromium·workers1·retries0·skip/flaky/pageerror0. 당시 자동 holder 준비/명시 ack1회·VP, 새로고침 같은 사용 이력, audit pending/failure 단독 재시도, consumed+service-blocked, unknown→중단 확인→같은 intent의 새 동의, IndexedDB 차단, 두 탭 단일 실행, 제한 패스→별도 full-purpose 동의/수동 delivery를 검사했다. 근거는 로컬 `/tmp/ktour-ux16-experience-release.json`과 `artifacts/qa/ux16-experience-release` 캡처4개다. D04 v2·기존 7회 probe·다른 배포 PASS에 합산하지 않는다. 모든 만료·취소 타이밍, 언어/물리 기기, 실제 provider 연동까지 실행했다는 뜻은 아니다.
