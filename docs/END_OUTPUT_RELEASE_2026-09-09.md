# 최종 산출물 확장 — 2026-09-09

상태: **v3.2 구현·교차 검토·프리뷰 배포 완료**. 앱 소스 `6fb5b96`, 전체 계약 731/731, production build·artifact scan PASS, 최종 공유 URL 36/36 PASS. [새 버전](https://ondo-126u0k6jr-jaewook-9643s-projects.vercel.app) · [후보별 결과·한계](./EXECUTION_STATUS_2026-09-08.md).

## 이번 작업의 범위

1. 모바일 웹앱: 중립적인 라이트/다크 UI, After 19 독립, 실제 좌표/같은 지도 인스턴스/연속 카메라. 단순한 지형보다 동적인 열 표현을 우선하고 얕은 2.5D는 선택형이다.
2. 현재 ONDO 18개 FL/19개 REQ에 연결된 기능별 샘플: 정상·거절·취소·실패·재시도·재진입을 일반 화면에서 조작할 수 있어야 한다. 숨은 QA 주입만 가능한 경로는 공개 목업 완주가 아니다.
3. 해당 flow와 정확히 대응하는 backend 계약 및 CX/OpenDID/OmniOne Chain/Sui 작업 목록. 샘플 PASS는 공식 공급자 실연동 또는 해커톤 심사 요건 충족 증거가 아니다.

사업 PDF의 교통·쇼핑·배달 산업 노드는 v3 §1.1에 따라 향후 서비스 adapter 확장 예시다. 이번에 세 개의 새 서비스 앱을 만드는 범위는 아니다. AMM 거래소도 현재 선택한 Sui signer·badge·전환 후보 시연과 별개의 미래 기술 검토다. 식당 예약 샘플은 **로컬 식사 계획 저장과 별도**로 구현한다.

## 변경 및 검수 표

| 묶음 | 이번 변경 | source / 공개 진입 | 현재 검수 |
| --- | --- | --- | --- |
| G01 지도 | 온도 두 frame 900ms dissolve, 같은 source/canvas 유지, 도시 얕은 32° 보기, 한강/육지 대비, 초기·runtime palette 통일 | `map/map-entry-b.tsx`, `temperature-timeline-b.tsx`, `lib/ondo/map/ondo-map-style.ts`; 도시 지도 하단 | 후보2 지도8 + theme1 PASS. 최종 공유 URL 지도8 PASS, KO 단어경계·dark 실화면 확인 |
| G05 발급 | 문서·얼굴·앱·QR·issuer·holder 실패, 수동검토/추가서류, 갱신·새 기기 복구 | ID → K-Tour ID → 경로 → 동의 → 접힌 샘플 상황 | 후보2 신규25 묶음·기존DID30 PASS. 정확한 개별 실행은 감사 참조 |
| G08 예약 | 서울·부산·제주 준비된 좌석 → 요청 → 확인번호/만석/실패/unknown → 취소/취소 실패·재조회 | Tables → 매장 예약, 또는 Demo → 매장 예약 체험; `reservation-b/*` | 세 도시 정상·취소, unknown 재진입, full/실패/저장오류 복구 PASS |
| G08 Tables | 부산 meal plan 추가, 공개 저장 실패/full/주최자 취소/조건 변경 및 메모 응답 실패 | Tables → 상세 → 접힌 샘플 상황; `connect/table-model.ts`, `tables-entry-b.tsx` | 기존 제주 정책4 + 공개사진/채팅/도착/피드백/신고/차단/나가기 완주 PASS |
| G10/G11 결제 | 승인/매입 분리, unknown 조회, 부분환불·누적 상한·재시도, 다수 환불 대사, 문의/ticket·요약 export | ID·Wallet 결제 상세의 샘플 응답; `commerce-b/*`, `integration-demo-b/*` | 후보2 commerce4 + integration6 고유 PASS |
| G12 Sui/방문 | 자동 10stamp 제거, 명시적 샘플 이력9 + 독립 고유 방문10 + opt-in mint; signer/bridge/badge 실패·복구 | My Korea → Labs → 샘플 상황/여행 이력 | 후보2 공개 Labs11 PASS, auto10/중복mint 방지 |
| G13 계정 | 준비된 계정의 export JSON/다른 기기 logout/delete review→pending→receipt, 실패·unknown 같은 요청 조회 | 설정 → 개인정보·데이터 → 계정 서비스(샘플); `settings/account-services-sample-b.tsx` | 공개3작업·unknown reload·결과저장실패·자식/부모 Escape 복귀 PASS |

## 교차 검토

- 메인: 예약·Tables·계정 서비스 구현, 전체 통합과 산출물 매핑.
- DID reviewer: 발급·복구 구현, 다른 flow 누락 감사, 메인 예약·계정 코드 반례 검토.
- Commerce reviewer: 승인·매입·부분환불·정산 구현 및 자격/원장 불변식 검토.
- Map/Sui reviewer: 지도·열 표현, Sui 공개 복구/unique milestone. 이후 메인과 실제 스크린샷 교차 검수.

검수 근거는 [독립 감사 기록](./end-output-review-20260909.md)과 최종 [실행 현황](./EXECUTION_STATUS_2026-09-08.md)에 후보별로 기록한다. 과거 프리뷰에서 통과한 숫자를 이번 후보의 PASS로 합치지 않는다.

후보1에서 발견해 후보2로 수정한 사항: async 결과 버튼 제거 후 포커스 유실, 중첩 task의 Escape 소유권, 다크 결제 header 대비, 시간 재생 표시와 기존 legend 선택자의 충돌. G11 문의/최소 요약 export도 추가했다. `731/731` 계약 PASS와 이 화면들의 실제 브라우저 재검수를 구분한다.

## 남아야 하는 실제 개발

- CX/provider discovery, session/handoff, callback 서명·nonce 검증, 최소 normalized identity evidence.
- Passport NFC/eKYC/liveness와 Residence adapter의 지원·수동검토·retention.
- OpenDID issuer/schema/holder/verifier/status 및 request-policy binding, revoke/renew/key recovery.
- 서버 account/auth, 서비스 정책, 실제 결제·충전·원장·재고/예약·대화/업로드·신고/삭제 작업.
- OmniOne 계약·outbox·RPC/API·비식별 6종 event·확인된 receipt/정산.
- Sui signer/SDK/epoch/salt/prover/gas sponsor/Move badge/effects 확인. Bridge 지원은 별도 근거가 있어야 하며 현재는 hypothesis.
- 실제 live 신호 수집·검증·집계·권리 관리. 샘플 온도 재생을 실시간 인기라고 표시하지 않는다.

정확한 flow/API/기술/실패 상태는 [DEPLOYMENT_SPEC](./DEPLOYMENT_SPEC.md), 해커톤 대응은 [연동 매트릭스](./HACKATHON_INTEGRATION_MATRIX_2026-09-08.md), 실제 할 일만 보려면 [백엔드 작업표](./BACKEND_HANDOFF_CHECKLIST_2026-09-09.md)를 사용한다. 세 문서 모두 v3.2 공개 목업과 실제 개발을 별도 열로 반영했다.
