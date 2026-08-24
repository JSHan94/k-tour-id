# ONDO B Production · 전환 Source of Truth

상태: `PRODUCTION TRANSITION · RED · NOT RELEASEABLE`

이 디렉터리는 `/ondo-b`를 실제 운영 가능한 공식 장소 디렉터리로 전환하는 **현재 작업 정본**이다. 기존 [`ondo-baljajwi`](../ondo-baljajwi/00_INDEX.md)의 product/evidence/reviewer 문서는 당시 prototype tuple의 불변 역사다. 그 문서와 PNG를 수정하거나 새 제품의 합격 근거로 재사용하지 않는다.

| 항목 | 현재 전환 계약 |
|---|---|
| Route | `/ondo-b` |
| 제공 기능 | 공식 장소 탐색, 검색, 지도/목록, 장소 정보, 브라우저 history, directions, location, offline fallback, device-local 저장/비공개 메모, 설정/초기화 |
| 외부 데이터 | 행정안전부 LOCALDATA snapshot 기반 서울 200 + 부산 200 canonical records |
| 브라우저 저장 | `ondo-b.device.v1` 하나만 허용; 기기 설정·canonical saved IDs·선택적 비공개 메모만 저장 |
| 운영 제외 | identity/KYC, After 19, Tables/chat/report, checkout/payment/OOKRW, Labs/wallet/bridge, trust/reputation/stamps, synthetic score/signal |
| Active flows | `PR-FL-001..006` · 6개 |
| Pre-baseline visual census | `PR-PX-*` · 20 cases · PNG 미생성 |
| Production acceptance | `PROD-B-001..004` · 현재 `3 RED / 1 GREEN` |
| Release | product acceptance GREEN → functional/a11y/responsive gates → 새 PNG → 두 번의 fresh independent CLEAN round 이후에만 가능 |

## 읽는 순서

1. [Production Flow Catalog](./01_FLOW_CATALOG.md)
2. [Acceptance and migration gate](./02_ACCEPTANCE_AND_MIGRATION.md)
3. [f7eccf8 RED receipt](./03_RED_RECEIPT_f7eccf8.md)

실행 가능한 registry의 정본은 `k-tour-id-app/tests/helpers/ondo-b-production-registry.ts`, enforcement는 `k-tour-id-app/tests/contracts/ondo-b-production-acceptance.spec.ts`다. 문서는 이 두 파일의 ID와 수를 그대로 반영해야 한다.

## 데이터 진실 경계

- canonical record는 LOCALDATA snapshot 시점의 음식점 인허가 기록을 보여준다.
- 현재 영업 여부, 영업시간, 메뉴, 가격, 인기, 혼잡도, 카드 결제, 여행자 적합성은 이 데이터가 증명하지 않는다.
- synthetic score, heat, confidence, sample, trend, “locals” 행동 주장은 제품 graph에 포함하지 않는다.
- directions는 canonical 좌표를 외부 지도에 전달하는 handoff이며 ONDO가 경로·소요시간을 계산했다고 주장하지 않는다.
- saved place와 private note는 서버 계정이나 동기화 기능이 아니라 이 기기의 브라우저 데이터다.

## 역사 보존 규칙

- `docs/ondo-baljajwi/evidence/**`, `docs/ondo-execution/evidence/**`, 기존 reviewer 원문과 frozen receipt는 byte-for-byte 역사로 남긴다.
- 기존 18-flow/50-case/300-PNG tuple은 새 production flow의 current evidence가 아니다.
- 새 product/harness tuple이 고정되기 전에 PNG baseline이나 final evidence manifest를 만들지 않는다.
