# ONDO 실행 현황 — 2026-09-12

## 현재 운영 배포 — 목업 공개

- [운영 앱](https://ondo-tau.vercel.app): source/runtime `82ea4c9`, production `dpl_E8wWPKBCa3GnXvUvqGbag8E5VV62`, Ready. 운영 모바일 12개와 데스크톱·태블릿 2개를 재시도 없이 검수 완료했다.
- 매장 중심 결제/혜택·부족액 충전 왕복·사용처 지도·매장별 예약/Table·주문별 환불의 다섯 여정을 구현하고 운영 배포했다. 현재 검수 범위·제한·복구 기준은 [지도·지갑 여정 릴리스](./MAP_WALLET_JOURNEYS_2026-09-12.md)를 따른다. 이전 source `52f376e`의 [운영 배포 기록](./PRODUCTION_RELEASE_2026-09-12.md)은 역사적 증거다.
- 개발 요구사항과 새 원장/장소/예약 계약을 맞췄다. 실제 외부 연동·자금 이동은 활성화하지 않았다. 아래 기존 프리뷰 수치를 이번 운영 URL의 재실행 결과로 세지 않는다.

## 이전 프리뷰 검수 — 2026-09-11

- [최신 프리뷰](https://ondo-1909uxusq-jaewook-9643s-projects.vercel.app): source/runtime `52f376e`, `dpl_7nv7QZNJU5bNGKrePEi94TyK3s5q`, Ready. 기존 기준선 대비 runtime 변경은 LocalSignal 대비·지도 안내/출처·시간축·음식 분류·peek 대비를 다루는 CSS 5개 파일뿐이다.
- [x] 최신 `52f376e` URL의 영향 범위 27개 PASS 증거 확보: 지도·음식 최초 16/17 + Busan 1개 재실행 PASS, G03·방문 전 정보 10/10 PASS. Busan은 동일 assertion을 유지하되 CLI 제한을 원래 30초에서 60초로 늘려 재실행했다. 최신 전체 계약 800/800·typecheck·공개 HTTP 10/10도 PASS이며 브라우저 고유 수에 합산하지 않는다.
- [기준선 프리뷰](https://ondo-f79cplfqu-jaewook-9643s-projects.vercel.app): source `564823e` / runtime `770d6b1`, `dpl_9omVMcfYcQj9iieCcyeJNFxL96Zb`, Ready. 고유 174개 PASS 증거는 이 URL의 기준선이며 최신 URL 실행 수와 분리한다. 중간 `abd0f83`·`f8960b4`의 검사·시각 결함과 보정 기록은 [전체 여정 검수](./FINAL_JOURNEY_QA_2026-09-11.md)에 보존한다.
- [전체 여정 검수 현황과 증거](./FINAL_JOURNEY_QA_2026-09-11.md)에서 기준선 174개와 최신 URL의 27개를 분리한다. 중간 `abd0f83` 19개·`f8960b4` 27개는 후속 시각 결함 발견 기록과 함께 보존하며 최신 URL 실행으로 집계하지 않는다.
- 기존 production alias와 실제 외부 연동은 변경하지 않았다.

## 이전 인계 기준선 — 2026-09-11

- **문서 동기화 완료**: [개발자 시작 문서](./DEVELOPER_START_HERE.md)에서 15개 플로우 그룹 → BE-01–16 / FE provider handoff / 기술별 증거 / 구현 순서를 찾을 수 있다.
- 정본 3개: [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md), [BE 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md), [해커톤 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md). README의 옛 route/정본 안내도 수정했다.
- 기준선 목업 소스 `770d6b1`: 패스 저장 후 Back, 환불 후 새 정산 문의와 이력, 세 도시 조사 목록18→24. 문서/QA는 후속 인계 커밋.
- 기준선의 배포 전 전체 계약799/799·typecheck·standalone build/scan·선택 Chromium16개 고유 PASS. 첫 실패/테스트 수정/재실행·검수 한계는 [9월 11일 점검 기록](./HANDOFF_SYNC_2026-09-11.md)에 분리했다.
- 위 인계 작업 이후 사용자 요청으로 기준선 `564823e`를 공개 프리뷰에 배포했고, 중간 대비 수정 `abd0f83` 이후 지도·음식 CSS 보강 `f8960b4`을 거쳐 폭 보정 `52f376e`을 당시 최신 프리뷰로 배포했다. 현재 운영은 상단 `82ea4c9` 기록을 따른다. 실제 외부 연결은 개발자 범위이고, 미연결이 목업 완료를 차단하는 조건은 아니다.

## 이전 공개 배포 — 2026-09-10 (역사적 기록)

당시 상태: **목업 구현·모바일 마감 프리뷰 배포 완료. 당시 공개 검수와 제한은 아래 9월 10일 릴리스 문서를 기준으로 삼는다.**

- [당시 프리뷰](https://ondo-3n9pfey06-jaewook-9643s-projects.vercel.app) — source `3dc392b`, `dpl_G3xVXrLsq4YXDPmNtESzBucfTp6n`, Ready, 비로그인 앱 실행 확인.
- [이번 변경·검수·제한](./PROTOTYPE_COMPLETION_2026-09-10.md) · [인계 정본](./DEPLOYMENT_SPEC.md) · [개발 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md) · [해커톤 기술 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md).
- 기능 source `5233816`에 일본어 문서/얼굴 제목 CSS 후속 `3dc392b`. 작업본·브랜치는 `did-demo-20260908` / `implementation/did-demo-20260908` 유지. QA/문서 후속 커밋은 배포된 앱 source와 별도다.
- DID 외부 앱·문서·얼굴·holder, 파트너 QR/기기/최소 동의, 지갑 연결 승인·거절·timeout을 클릭 가능한 샘플 단계로 연결했다. Travel Pass 우선순위·음식별 예시·다크 결제 대비를 다듬었다.
- source `3dc392b` 계약 785/785·typecheck·standalone build/scan PASS. 정확한 공개 테스트 수·실패 원인/재실행은 새 릴리스 문서에 기록한다. 아래 과거 수치를 이번 PASS로 합산하지 않는다.
- 실제 provider/SDK 연결·자금 이동·운영 도메인 변경은 하지 않았다. 실제 백엔드와 프런트 handoff, 8개 미정 ADR, Safari/실기기 검수는 별도 미완료다.

## 이전 릴리스 — 2026-09-09 (역사적 기록)

### 당시 상태

**v3.2 구현·교차 검토·프리뷰 배포 완료. 공유 URL 36/36 검사 PASS.** 실제 외부 연동과 실기기 검수는 아래처럼 별도다.

- [새 프리뷰 열기](https://ondo-126u0k6jr-jaewook-9643s-projects.vercel.app) — Ready, 비로그인 HTTP 200. 기존 production 도메인은 변경하지 않았다.
- 앱 소스 커밋: `6fb5b96`. 배포 ID: `dpl_DwwSyw3MxkmoTiwPQw3YmZrd6UzG`, target `preview`.

- 현재 구현 작업본: `.codex-worktrees/did-demo-20260908`, 브랜치 `implementation/did-demo-20260908`.
- 최종 로컬 build ID `fk95fNnpKL5GLBnDmCsIL`. candidate2 `XTp_InkFWEMl2Fdw1tBd7`에서 제품 변경은 한국어 제목 keep-all CSS 한 줄뿐이다. 로컬 서버는 최종 빌드를 위해 종료했으므로 새 프리뷰를 사용한다.
- [최종 범위·진행표](./END_OUTPUT_RELEASE_2026-09-09.md) · [백엔드 인계 정본 v3.2](./DEPLOYMENT_SPEC.md) · [개발자가 할 일만](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md) · [해커톤 기술 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md).
- 루트의 오래된 실험 앱과 사용자 수정 원본은 보존한다. 백엔드 개발자는 위 브랜치의 `k-tour-id-app`과 v3.2 스펙을 함께 사용한다.

## 이번에 달라진 것

| 영역 | 공개 화면 / 결과 |
| --- | --- |
| 지도 | 실제 좌표·같은 canvas·전국→도시 연속 카메라 유지. 가독성 높은 중립 수계/육지, 시간대별 샘플 온도 native 900ms crossfade, 32° 얕은 보기 선택. After 19와 앱 theme 독립 |
| DID | Mobile ID/CX·Residence·Passport, 공개 문서/얼굴/앱/QR/issuer/holder 실패·취소·재시도 및 수동검토/추가정보. 갱신·기기 복구는 원래 method/나이/체류/사용액/혜택 사용을 보존 |
| 서비스 권한 | Guest·성인·증거 없음·연령 미달·체류 만료·보류·철회·한도/혜택 사용 상태에 따라 같은 실제 CTA가 허용/추가확인/거절. Account·Person·Age·Payment 확인 별개 |
| 식당 예약 | Tables→매장 예약. 서울·부산·제주 준비된 샘플 식당→날짜/인원→요청/만석/실패/unknown→확인번호→취소·실패·동일 요청 조회. 로컬 식사 계획과 별개 |
| Tables | 세 도시 meal plan, 공개 full/취소/조건/참여·메시지 실패 시나리오. 사진·도착·피드백·신고·차단·나가기 |
| 지갑/결제 | 은행·카드·Apple Pay·USD 충전, 별도 승인/매입·보류금·실패/unknown 조회. 원 KRW 기준 부분환불과 누적 원금 상한·재시도, 전액 도달 시만 혜택 복원 |
| 파트너/OmniOne | 최소 VP 요청·동의/거절·검증/반례. 실제 샘플 업무 6종 event→queue/pending/실패/receipt. 다수 환불 정산·문의/고정 금액 검토/동일 요청 조회/ticket·최소 요약 JSON |
| Sui/방문 | 공개 signer 취소/epoch/salt/prover/network/gas·전환 후보·trait/mint 복구. 명시적 샘플 방문9→별도 고유 방문10→opt-in badge. 자동 10회 보정/중복 민팅 금지 |
| 계정 작업 | 설정→개인정보→계정 서비스. 준비된 샘플 계정 export/다른 기기 logout/delete·검토·실패/unknown 동일 작업 조회. 실제 사용자 데이터와 분리 |
| 모바일 | 아이콘 중심 내비, 중립 라이트/다크 표면. 결과 버튼 제거 후 focus 복구·중첩 Escape 소유권·다크 결제 header·시간 표시 충돌 수정 |

모든 외부 결과는 **샘플**이다. `review=0`에서는 실제 미연결 상태를 정직하게 유지하며 샘플 성공으로 우회하지 않는다. 샘플 예약은 실제 제휴/좌석 보장이 아니고, 시간대별 열 표현은 실제 실시간 혼잡도가 아니다.

## 체험 순서

1. Guest → 서울/부산/제주. 도시 하단에서 온도 시간 재생·직접 이동, 지도 기울기 아이콘을 조작한다.
2. ID · Wallet → K-Tour ID → 신원 경로 → 동의 → 접힌 샘플 상황. 수동검토·실패·재시도·보관까지 본다.
3. 서비스 카드의 자격 선택에서 나이 증거 없음/미달, 체류 만료, 한도·혜택 사용을 바꿔 동일 행동의 결과를 비교한다.
4. Tables에서 로컬 식사 계획과 별도 매장 예약을 각각 체험한다. 예약 응답 지연 후 닫기/새로고침/같은 요청 조회도 가능하다.
5. 충전 → 장소 혜택 결제. 접힌 샘플 응답에서 승인/매입 분리·실패·지연을 선택한다. 결제 후 부분환불을 진행한다.
6. Demo → 파트너 검증·정산 → 정산/이벤트/문의. 실제 발생한 샘플 업무만 목록에 생성된다.
7. My Korea → Labs → 샘플 여행 이력9 → 별도 방문1 → 동의 → badge. signer·전환·mint 실패도 접힌 샘플 상황으로 체험한다.
8. 설정 → 개인정보·데이터 → 계정 서비스(샘플). export·다른 기기 logout·계정 삭제를 체험한다.

## 검수 증거 — 이번 후보만

| 검사 | 현재 결과 / 증거 |
| --- | --- |
| 전체 계약 | **731/731 PASS**, 최종 소스 `artifacts/qa/end-output-contracts-final-20260909.log` |
| 타입·운영 빌드 | PASS. `pnpm typecheck`, standalone production build + client artifact scan. `end-output-build-final-20260909.log`; Vercel 최종 빌드 Ready |
| 모바일 공통·예약·계정 | **12/12 PASS**, 320/360/390/430px·KO/EN/JA·light/dark·축소모션. `end-output-mobile-candidate2.log` |
| 지도·Labs·After19 | **20/20 PASS**, 동일 canvas·900ms dissolve·32°/전국0°·focus2px·시간표시 비겹침·고유 방문·민팅·11개 Labs·theme 조합. `map-labs-candidate2-20260909` |
| DID·계정·Table 경계 | 후보2 **25개 고유 PASS**(본실행23 + 테스트의 정확한 age CTA/포커스 복귀 대기 후 단독2). `end-output-coverage-candidate2-20260909.log`, `end-output-coverage-candidate2-targeted-20260909.log` |
| 기존 핵심 DID | 후보2 **30/30 PASS**, 320/390/1280px. `did-candidate2-20260909.log` |
| 파트너·승인/환불·정산 | 후보2 **10개 고유 PASS**(본실행8 + 부모 summary 선택자 정확화 후2). `commerce-integration-candidate2-20260909`, `commerce-integration-candidate2-selector-20260909` |
| 최종 공유 URL | **36/36 PASS**: 모바일/예약/계정/짧은 높이14 + 지도8 + mobile390 DID10 + 승인/환불/문의4. 아래 실행 근거 참조 |
| Safari / 실기기 | **미검증**. WebKit2251/2203이 이 Mac(macOS14.2)에서 페이지 전 Bus error10. 실제 iOS Safari·Android·중급 기기 성능을 PASS로 집계하지 않음 |

개별 실행의 실패·재실행은 [독립 감사](./end-output-review-20260909.md)에 구분한다. 서로 다른 build와 기존 결과를 더해 전수 QA라고 표시하지 않는다. 전체 오래된 E2E, 모든 기기/언어/가로/키보드/확대 조합을 전부 실행했다는 뜻이 아니다.

최종 공유 URL 근거: `artifacts/qa/end-output-public-mobile.log` 및 동명 output(14개), `tests/e2e/ondo-temperature-timeline.spec.ts` 1worker 공개 실행(8개, 최신 지도 캡처 `map-final-preview-20260909`), `did-final-preview-20260909.log`(10개), `commerce-public-6fb5b96-20260909`(4개). 짧은 viewport는 320×460 및 844×390이며 실제 소프트 키보드/실기기 측정을 대신하지 않는다. 세 reviewer와 메인이 각 실행·캡처를 교차 검토했다.

## 반례 검토로 수정한 것

- 복구가 연령/사용액/혜택을 초기화하던 위험 → 동일 사용자의 proof revision만 갱신, 경제 이벤트 중복 방지.
- 예약 확정/취소 결과 저장 실패 → 같은 결과 저장 재시도. 재예약/중복 취소 없이 복구.
- 계정 operation 화면 unmount/reload → durable 샘플 journal, 진행 중은 unknown, 같은 operation 조회.
- async 결과 버튼 교체 후 body focus 유실 → heading 복구. 자식 task의 Escape가 부모 Privacy를 닫지 않도록 owner 분리.
- 어두운 결제 header와 시간 표시의 원형 legend 충돌 → theme token/독립 요소, 실제 화면 재확인.
- 샘플 badge를 위해 방문을 자동10으로 올림 → 명시적 이력9와 별도 고유 방문10, opt-in/중복 mint 방지.
- 문의/내보내기 목업 공백 → 비금융 ticket과 개인정보 없는 금액 요약. 문의가 원장을 변경하지 않음.

## 실제로 남은 개발 / 승인

[백엔드 작업표 BE-01–16](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)에 실제 개발·기술·수락 증거를 묶었다. CX/OpenDID/OmniOne Chain은 DID 시연의 핵심 우선순위, Sui는 사용자가 지정한 추가 통합 범위다. 공식 기술활용 인정은 실제 공급자 결과·서명·receipt로 별도 입증한다.

실제 신분증/eKYC, 서버 auth·정책·원장·예약·chat·업로드·계정 작업, 결제 callback, OmniOne outbox/contract/receipt, Sui signer/Move/gas/effects, 실시간 온도 수집은 아직 연결하지 않았다. cross-chain은 지원 근거 확인 전 hypothesis다. 교통·쇼핑·배달 독립 앱과 AMM 거래소는 현재 PRD의 별도 미래 범위다.

미적 최종 승인·실기기 성능은 별도다. “95%” 또는 “완벽”을 테스트 숫자로 보장하지 않는다.

## 이전 버전 기록

- core 소스 `bec3257`, 실행기록 `bc8f0d0`.
- 이전 [핵심 DID 프리뷰](https://ondo-8a76epocn-jaewook-9643s-projects.vercel.app), deployment `dpl_9WHNsYL6HuDSDUjJ2CKWGVY1qhUw`, production 도메인 변경 없음.
- 이전 core 계약684/684·공유 URL15/15은 이번 후보 결과에 합산하지 않는다.
- v2.1 원문 스냅샷 SHA-256: `890c9518d82db5d0d263744f890aacdd68c15191ae4f43a5e2379e3ea67a5288`. 사용자 원본은 덮어쓰지 않는다.

## 재실행

앱 디렉터리에서 타입·계약·`pnpm build:vercel:ondo-b`를 실행한다. 계약 검사가 isolated 작업 폴더를 재생성하므로 그 폴더의 로컬 서버를 먼저 종료한다. 이후 `PLAYWRIGHT_BASE_URL`을 새 후보 URL로 지정하고 e2e를 1 worker씩 실행한다. 테스트의 raw trace/HAR는 공개 배포에 넣지 않는다.
