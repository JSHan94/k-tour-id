# 목업 ↔ 개발 인계 최종 대조 — 2026-09-11

후속 업데이트: 이 점검 이후 `564823e`에서 전체 여정을 검수하고, Local Signal 대비 `abd0f83`·지도/음식 UI `f8960b4`에 이어 카드 열 폭을 보강한 `52f376e`를 배포했다. **현재 URL·기준선 검수·최종 영향 검사는 [9월 11일 배포 기록](./FINAL_JOURNEY_QA_2026-09-11.md)** 을 따른다. 아래는 배포 전 인계 작업의 당시 기록이다.

## 범위와 기준선

사용자 요청: **(2) 기능별 해커톤 목업과 (3) 실제 개발 요구사항을 최종 동기화**하고, 개발자가 읽자마자 담당 작업을 찾게 한다. 실제 연동 구현은 개발자에게 맡기며 목업의 미완료 조건으로 취급하지 않는다.

- 작업본: `.codex-worktrees/did-demo-20260908`, branch `implementation/did-demo-20260908`.
- 점검 시작 HEAD: `8bfcf49`; 검수한 목업 소스는 `770d6b1`로 고정했다. 아래 문서와 문서 회귀 검사는 그 후속 커밋에 함께 인계한다. 빌드/브라우저 실행은 커밋 전 동일 앱 파일로 수행했다.
- 마지막 공개 검수 앱: `3dc392b`, [공개판 및 정확한 당시 결과](./PROTOTYPE_COMPLETION_2026-09-10.md). **이번 문서/목업 변경의 새 배포를 주장하지 않는다.**
- [개발자 시작 문서](./DEVELOPER_START_HERE.md) → [상세 계약](./DEPLOYMENT_SPEC.md) / [BE 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md) / [기술별 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md).

## 세 방향 교차 검토

| 담당 검토 | 대조 대상 | 결과 |
|---|---|---|
| Identity reviewer | CX/Passport/Residence, OpenDID holder/status, 자격/VP/gate와 H01–07 | walkthrough·자격 fixture 구분, 실제 enum/claim mapping, generic verifier와 action context 구분, FE handoff 책임 반영 |
| Commerce/Chain reviewer | 일반/stablecoin funding, 결제·환불·정산·문의, OmniOne/Sui와 BE 작업 | source/destination/credit 분리, ticket 이력·새 동의, sample event/badge의 실제 증거 과장 제거 |
| Main reviewer | 전체 G01–13 + G08-R/G09-S, README/옛 문서, 실행 명령·조회 API·파일·링크 | 15개 플로우 그룹 → BE-01–16 연결, 읽기 순서·구현 순서·산출물·반례 표와 문서 회귀 검사 추가 |

이는 문서/소스 대조와 아래 명시된 실행 범위다. 100% 기기 QA나 외부 공급자 연결 인증은 아니다.

## 발견한 불일치와 수정

| 발견 | 수정 / 개발자가 읽을 기준 |
|---|---|
| README가 차단된 옛 `/pass`·`/partner/*`·`/evidence`를 현재 진입으로 안내 | 실제 `/` 안의 ID·Wallet/Tables/Demo/Labs/Settings 진입으로 교체. 옛 문서에 역사적 자료 안내 |
| 옛 개발 명세·Sui 브리프를 정본으로 안내 | 현행 3문서와 시작 문서를 단일 진입으로 연결. 공식 DID 필수/프로젝트 선택/사용자 추가 범위를 분리 |
| generic partner receipt가 매장·금액 검증까지 한 것처럼 읽힘 | 실제 6필드 binding과 별도 action private venue/quote context를 구분. 실제 resource/quote/금액 검증은 BE-05 수락 조건 |
| 성공 mutation에 비해 조회·복구 endpoint가 불명확 | DEPLOYMENT_SPEC §4.3: operation 조회, 추가정보/복구, capture/void/cancel, upload/report/job/history/badge 조회를 담당 BE에 배정 |
| API만 붙이면 네이티브 holder/카메라/서명까지 된다는 오해 | FE-CX-PASSPORT / FE-OPENDID / FE-PAYMENT / FE-SUI / FE-RESERVATION를 별도 개발 티켓으로 명시 |
| 샘플 chain export가 hash까지 생성하거나 Labs가 mint receipt를 반환한다는 과장 | 현재 event는 허용된 5필드; hash는 개발 후보. badge는 기존 샘플 결과 유지이며 실제 tx/mint receipt는 미생성 |
| 발급 후 Back이 재발급 방법 선택으로 돌아가 무반응 경로를 만듦 | 저장/재열기 결과의 Back을 원 ID로 복귀. 1회 발급 guard와 명시적인 갱신/기기 복구 유지 |
| 첫 정산 문의 제출 뒤 환불 관련 새 문의가 막힘 | immutable submitted history, 완료 후 명시적 새 문의/검토/동의. pending/unknown은 기존 operation 조회 |
| 새 도시 목업 완료 조건에 실제 연동 evidence까지 결합 | 현재 3도시 유지. 새 도시의 목업 탐색/복귀·데이터 QA와 운영 provider evidence를 분리 |
| 이전 공개판 source/test를 새 작업본의 완료 증거로 읽을 위험 | 이전 공개 snapshot과 이번 변경/검수를 분리. 과거 테스트 수는 이번 결과에 더하지 않음 |

## 함께 인계할 카탈로그 변경

이전 요청에서 허용한 장소 보강: 기존 세 도시의 **별도 조사 목록 18→24곳(각8곳)**. 기존 공식400/큐레이션80 데이터를 대체하거나 모두 실시간 인기 장소로 분류하지 않았다. 기존18개의 확인일은 2026-09-09로 유지, 새6개만 2026-09-11이다. 실제 매장 사진·제휴 예약을 추정하지 않으며 새 항목은 권리 없는 사진 대신 정직한 category fallback을 쓴다.

| 추가 ID | 장소 / 좌표 근거 |
|---|---|
| `research-seoul-okdongsik` | 옥동식 · 37.5526641273966,126.91452530534 · [한국관광공사](https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=191592) |
| `research-seoul-geumdwaeji-sikdang` | 금돼지식당 · 37.5570820100183,127.01167403523 · [한국관광공사](https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=191564) |
| `research-busan-hapcheon-gukbapjip` | 합천국밥집 · 35.111244,129.11125 · [Visit Busan](https://www.visitbusan.net/index.do?lang_cd=en&menuCd=DOM_000000301002001000&uc_seq=1511) |
| `research-busan-haeundae-amso-galbijip` | 해운대암소갈비집 · 35.163258,129.16626 · [Visit Busan](https://www.visitbusan.net/index.do?lang_cd=ko&menuCd=DOM_000000201002001000&uc_seq=2370) |
| `research-jeju-oneunjeong-gimbap` | 오는정김밥 · 33.249676,126.56757 · [Visit Jeju](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000020123) |
| `research-jeju-yaksuteo-olle-market` | 제주약수터 올레시장점 · 33.2490102,126.5627984 · [Visit Jeju](https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_200000000012730) |

좌표는 관광 공식 페이지의 해당 장소에 연결된 구조화 필드로 대조했다. 관광지 소개는 오늘 영업·실시간 혼잡도·예약 재고·DID 자격의 증거가 아니다. 데이터 원본: `k-tour-id-app/data/ondo/research/{seoul,busan,jeju}-food-pulse.json`.

## 이번 작업본 검증

| 검사 | 상태 / 범위 |
|---|---|
| 세 사람 source/document 대조 | 완료. 위 불일치 수정; 미확정 provider/SDK/정책 결정은 ADR8개로 유지 |
| 문서 연결 회귀 | **5/5 PASS**, 전체799에 포함. `tests/contracts/ondo-developer-handoff-sync.spec.ts`: 플로우/BE 배정·실제 소스 파일·상대 링크·조회 계약·책임 분리. 동작/암호 검증을 대신하지 않음 |
| identity targeted contracts | 8/8 PASS — saved Back guard 포함, browser와 별도 |
| settlement/integration targeted contracts | 27/27 PASS — submitted history·same-operation/new-request 분기 포함 |
| food targeted contracts | 14/14 PASS — 24개·6개 좌표/확인일·기존400/80 경계·음식 hierarchy |
| typecheck / 전체 계약 | **PASS / 799/799 PASS**. `handoff-sync-typecheck-final-20260911.log`, `handoff-sync-contracts-final-20260911.log`. targeted 수치를799에 더하지 않음 |
| standalone build / scan | **PASS**, `handoff-sync-build-20260911.log`. build ID `gpOEkbAhsnV3oFJnQScQb`; 관리형 로컬3438 서버에서 검사 후 종료, 사용자 기존3018 서버와 별도 |
| identity browser | **11개 고유 PASS**: 첫 실행10 PASS + 테스트 버튼 이름 수정 후 saved/reopened Back1 PASS. `handoff-sync-identity-20260911.log`, `handoff-sync-identity-r2-20260911.log` |
| 문의 history browser | **2/2 PASS**: EN390 light / KO320 dark. 결제 문의→전액환불→새 동의→unknown 재조회→서로 다른 두 ticket·옛 금액 유지. `handoff-sync-support-catalog-20260911.log`의 SUPPORT-HISTORY 두 케이스 |
| 새 장소 browser | **3/3 PASS**: 서울320 KO dark / 부산390 EN light / 제주430 JA dark·review=0, 새6개 모두 검색·상세·관광 출처·좌표 길찾기·원 지도/목록. `handoff-sync-catalog-r2-20260911.log` |
| 캡처 직접 확인 | KO320 패스 저장 결과, KO320 문의 두 이력, EN390 새 문의/기존 ticket, JA430 제주약수터 상세·출처·footer 확인. 전체 기기/화면의 미적 전수 승인 아님 |

선택 browser는 총 **16개 고유 케이스**다. 첫 실행 실패3개를 숨기지 않는다: (1) 테스트가 실제 accessible label `Previous step` 대신 `Back`을 찾음 → selector 정정 후1 PASS; (2–3) 서울/부산 목록에서 연 상세에 지도 전용 sample pulse를 요구함 → 목록 전환은 timeline을 해제하고 pulse snapshot을 비우므로 잘못된 가정이었다. 목록 상세의 pulse 부재와 원 지도에서 같은 장소를 다시 눌렀을 때의 sample/no-rating 표시를 각각 검사하도록 수정, 3도시 재실행 PASS. 제품 소스를 테스트 통과용으로 바꾸거나 좌표·원 맥락·사실 표시 검사를 제거하지 않았다.

로그는 `k-tour-id-app/artifacts/qa/`에 보존한다. 계약 검사와 source matching이 runtime 전수 검증은 아니다. iOS Safari/실기기·실제 provider·real money/chain은 이번 실행 범위 밖이며 이전 Chromium 증거로 채우지 않는다.

## 개발팀에 넘길 결론

- 구현할 단위: **BE-01–16 + FE provider handoff 5묶음**. G01–13·예약·stablecoin 분기가 같은 ID로 연결되어 있다.
- 미정인 것: ADR-AUTH/DID/AGE/RESIDENCE/PAYMENT/CHAIN/SUI/DATA의 실제 공급자·환경·정책. 목업의 성공/실패/복구 UX를 다시 기획하라는 뜻이 아니다.
- 실제 연결 수락: OpenAPI/DTO·DB migration·권한/PII·멱등성·복구·FE adapter·redacted receipt/반례·배포/rollback 증거를 티켓별 제출한다.
- 이번 인계는 **실제 연동을 완료했다는 보고가 아니라, 목업과 개발 계약을 일치시킨 인계**다.
