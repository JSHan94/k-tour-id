# 선택적 외부 체인 상호운용 메모

상태: `Optional · P2 conditional · 2026-08-11`

## 1. 기본 결정

- K-Tour ID의 기본 신뢰 스택은 `OmniOne CX → OpenDID → K-Tour Policy/Commerce → OmniOne Chain`이다.
- OmniOne Chain이 기본 스마트컨트랙트와 비식별 실행 증거 계층을 맡는다.
- 다른 블록체인은 핵심 제품·P0·기본 발표 범위가 아니다.
- 외부 체인은 파트너가 해당 체인의 검증 가능한 영수증이나 자산 호환을 실제로 요구할 때만 adapter로 추가한다.
- 별도 생태계 바운티는 제품 acceptance와 분리한 독립 실험 브랜치에서만 다룬다.

## 2. 외부 체인 추가 승인 조건

다음 질문에 모두 답한 ADR-XCHAIN-001이 승인돼야 한다.

1. OmniOne Chain이나 기존 서버 계약으로 해결할 수 없는 구체적인 파트너 요구가 있는가?
2. 이 연동이 사용자 경험이나 파트너 정산에 주는 측정 가능한 가치가 있는가?
3. 어느 시스템이 source of truth이고, 두 시스템의 상태가 어긋날 때 어떻게 대사하는가?
4. 추가 wallet, gas, key custody, RPC, indexer와 support 부담을 누가 책임지는가?
5. 온체인 field가 PII·VC·여권·생체·결제 원문을 포함하지 않는가?
6. 계약·transaction·receipt를 재현할 공식 환경과 파트너가 있는가?

## 3. 공통 adapter 계약

```ts
interface ExternalChainEvidenceAdapter {
  submit(event: CanonicalEvidenceEvent): Promise<SubmissionReceipt>;
  getStatus(submissionId: string): Promise<"pending" | "confirmed" | "failed">;
  verify(receipt: SubmissionReceipt): Promise<boolean>;
}
```

- 모든 외부 체인 구현은 K-Tour Core와 직접 결합하지 않고 이 경계를 통과한다.
- 동일 사건은 내부 `eventId`로 연결하되 체인별 confirmation 상태를 독립 관리한다.
- 한 체인의 성공을 다른 체인의 성공이나 주문·결제 성공으로 표시하지 않는다.
- adapter가 없어도 온보딩, ID, 지도 탐색, 서비스 이용, 결제·혜택·정산의 핵심 플로우는 정상 동작해야 한다.

## 4. 예시와 금지

- Sui는 실제 파트너 요구나 별도 실험이 승인됐을 때 검토할 수 있는 여러 후보 중 하나일 뿐이다.
- 바운티나 로고를 이유로 핵심 아키텍처에 체인을 추가하지 않는다.
- 동일 evidence를 이유 없이 여러 체인에 중복 기록하지 않는다.
- 외부 체인 계정과 정부 신원·K-Tour DID를 동일 식별자로 취급하지 않는다.
- 공개 저장소나 영구 저장소에 민감 원문을 기록하지 않는다.

