# ONDO 9시간+ 자율 실행 준비도 감사

상태: `HISTORICAL PLAN · EXECUTED BY ONDO B`

현재 결과 정본은 [ONDO B 원요구 최종 감사](./ondo-baljajwi/06_FINAL_REQUIREMENTS_AUDIT.md)다. 이 문서는 사용자의 추가 입력 없이 병렬 구현을 시작할 수 있는지 판단한 원 준비도 기록이다.

## 1. 판정

- 온보딩, 19개 요구, 18개 Flow, 실패·취소·재시도·복귀가 ID로 고정되어 프론트엔드 데모 자율 실행이 가능하다.
- Root/Map/Identity/Connect의 파일 소유, frozen contract, CCR, cherry-pick·rollback 절차로 병렬 충돌을 통제한다.
- 초기 9시간은 상한이 아니라 첫 Wave다. Gate 미통과 시 2시간 Quality Extension을 자동 반복한다.
- 제품·harness를 동결하고 동일 tuple에서 두 번 연속 5인 clean round가 나와야 종료한다.

## 2. 빠지면 안 되는 산출물

1. 19 REQ ↔ 18 Flow ↔ state/fixture/test/pixel의 exact trace.
2. 성공뿐 아니라 cancel/error/retry/returnTo와 persistence/reset 증거.
3. KO/EN, 390×844·1440×1000, keyboard·Axe·runtime 검증.
4. `ACTUAL / SIMULATED / CONTRACT_ONLY / NOT_CONFIGURED / DEFERRED` 경계.
5. final as-built, durable evidence manifest, issue closure, rollback 가능한 SHA.

## 8. 구현 전에 필요한 사용자 결정

프론트엔드 데모에는 추가 결정이 필요하지 않다. 다음 실연동 단계에서는 provider·법무·보안 권한이 필요하다.

- OmniOne CX/Residence tenant와 passport KYC provider
- zkLogin OAuth·account recovery, custody·Payment KYC
- OOKRW 법적 정의, bridge/AMM 보안·유동성·finality
- chat/photo moderation, merchant trait issuer, 실제 방문 증거, NFT 정책
- 운영 ONDO signal source·bias·minimum sample·freshness

이 항목은 임의 가정으로 실연동하지 않고 현재 데모에서 명시적 simulation 또는 contract boundary로 남긴다.
