# ONDO 9시간 결정 원장

상태: `Locked · 2026-08-19`

승인 문구: `D-01~D-12 모두 권장안대로 진행`
적용 범위: [9시간 PRD](./01_PRD_9H.md)의 모든 구현·QA·as-built

연관 문서:

- [플로우 카탈로그](./03_FLOW_CATALOG.md)
- [상태 모델](./04_STATE_MODEL.md)
- [준비도 감사의 원 결정](../ONDO_9H_EXECUTION_READINESS_AUDIT.md#8-구현-전에-필요한-사용자-결정)

---

## 1. 사용 규칙

1. `Approved` 결정은 9시간 실행 중 임의로 다시 열지 않는다.
2. 구현이 어려운 경우 결정 자체를 바꾸지 않고 목표 등급을 낮춰야 하는 이유와 영향부터 Root Integrator에게 보고한다.
3. 안전·프라이버시·기술 진실성 위반이 발견되면 해당 slice를 중지하고 결정 원장에 amendment가 생긴 뒤 재개한다.
4. 충돌 시 우선순위는 `안전·법적 정직성 → 승인된 결정 → Hero 여정 → Foundation → Labs → 시각 polish`다.
5. 결정 변경은 `D-xx-A1` 형식의 amendment, 승인자, 시각, 영향 REQ·Flow·State를 남긴다.

## 2. 승인 결정

### D-01 · 앱 진입과 KYC

- 상태: `Approved`
- 결정: Guest는 지도·검색·장소 상세·외부 길찾기를 사용한다. Account는 저장·질문·Table 참여·메시지에 필요하다. Person, 19+, Payment KYC는 해당 기능에서 각각 요청한다.
- 복귀 계약: gated CTA는 allowlist된 `returnTo`만 만들고 terminal success에서 정확히 한 번 소비한다. 세 persona onboarding은 완료·건너뛰기·fixture 실패 모두 `SCR-MAP`에 도달하며 KYC는 onboarding 성공 조건이 아니다.
- 배제: 로그인 선행, Full KYC 선행, 하나의 `verified` boolean으로 모든 자격 표현.
- 이유: 지도 탐색에 full KYC 목적이 없고 provider 미지원이 전체 제품 장애가 되어서는 안 된다.
- 영향: `REQ-001`~`REQ-005`, `REQ-008`, `REQ-011`, `REQ-012`; `FL-002`, `FL-005`, `FL-006`, `FL-010`, `FL-017`; `ACC-*`, `PER-*`, `AGE-*`, `PKY-*`.
- 재검토 조건: 규제상 Guest 탐색까지 본인확인이 필요하다는 서면 근거가 생긴 경우.

### D-02 · 9시간 핵심 시연 대상

- 상태: `Approved`
- 결정: 단기 외국인 여행객을 Hero flow로 가장 깊게 만든다. 한국인·장기체류 외국인은 짧은 Foundation flow로 제공한다.
- 이유: 초기 사업 타깃과 해커톤 확장 비전을 동시에 표현하면서 범위를 통제한다.
- 영향: `REQ-001`~`REQ-003`, `REQ-007`~`REQ-012`, `REQ-015`~`REQ-019`; `PER-TOURIST-SHORT`가 기준 E2E persona.
- 재검토 조건: 심사 시연 대상이 명시적으로 국내 모바일 ID 사용자만으로 변경된 경우.

### D-03 · Sui의 위치

- 상태: `Approved`
- 결정: Sui는 OmniOne CX/OpenDID 본체와 분리된 optional sidecar/Labs다. 9시간 fixture의 wallet·bridge·mint는 모두 `truth=SIMULATED`이며 UI에는 `Target network: Sui Testnet · Simulated`로 표시한다. 검증 가능한 실제 공개 `txRef`가 있는 실행만 `truth=TESTNET`으로 승격할 수 있다.
- 배제: zkLogin을 K-Tour Account·KYC·OpenDID wallet·OmniOne signer로 표현.
- 이유: 서로 다른 계정·신원·체인 키 역할을 합치면 recovery와 보안 경계가 거짓이 된다.
- 영향: `REQ-004`~`REQ-006`, `REQ-016`; `FL-018`; `WAL-*`, `BRG-*`, `NFT-*`.
- 재검토 조건: 별도의 account linking·custody·recovery PRD와 실제 SDK 범위가 승인된 경우.

### D-04 · 결제·bridge 깊이

- 상태: `Approved`
- 결정: Wallet·USDC·USDT·OOKRW·bridge는 Labs의 명시적 simulation으로 둔다. USDC/USDT는 chain별 representation과 잔고를 분리하고 `Estimated USD`만 읽기 전용으로 합산한다. Hero checkout의 `KRW`는 표시 가격이고 `OOKRW` test token은 mock settlement 수단이다. bridge의 source confirmed는 destination finality가 아니며 simulated success는 destination confirmed 뒤에만 표시한다. 상점 receipt는 금액·상점·정책·redemption 결과만 증명하고 방문·입장·안전을 증명하지 않는다.
- 배제: 실제 asset bridge, custom AMM 실거래, 실제 OOKRW mint/burn, 실제 정산 주장. 9시간의 AMM·pool·liquidity·swap은 `Deferred`다.
- 이유: 공식 bridge·권한·finality·공급 불변식이 확정되지 않았다.
- 영향: `REQ-006`, `REQ-011`, `REQ-014`; `FL-004`, `FL-017`, `FL-018`; `PKY-*`, `PAY-*`, `BRG-*`.
- 재검토 조건: 테스트 자산, 계약 주소, relayer·mint 권한, reconciliation과 rollback 계획이 승인된 경우.

### D-05 · 지역 범위

- 상태: `Approved`
- 결정: 전국 overview를 유지한다. 서울은 완결, 부산은 seed, 나머지는 `Explore/Growing`으로 표시하며 가짜 ONDO 숫자를 주지 않는다.
- 이유: 전국 제품 비전을 보존하면서 9시간 데이터 밀도를 정직하게 통제한다.
- 영향: `REQ-007`, `REQ-017`, `REQ-019`; `FL-001`; `MAP-KOREA`, `MAP-SEOUL`, `MAP-BUSAN`, `MAP-GROWING`.
- 재검토 조건: 서울만 시연하도록 명시되거나 부산 fixture 품질이 Hero를 방해하는 경우 부산을 seed 목록으로 더 축소.

### D-06 · After 19 자동 동작

- 상태: `Approved`
- 결정: `AGE-VERIFIED`이고 age proof가 만료되지 않았으며 KST 19:00 이후이고 `Auto night mode=true`이며 현재 session이 `A19-MANUAL-OFF`가 아닐 때만 자동 전환한다. banner에서 즉시 끌 수 있다. 일반 심야 식당은 계속 노출한다.
- 배제: 미인증 자동 전환, 시간만으로 성인 판정, 일반 야간 콘텐츠 전체 잠금.
- 이유: 승인된 자동 경험을 제공하면서 예측 가능성과 이용자 통제를 보장한다.
- 영향: `REQ-012`; `FL-002`, `FL-013`, `FL-014`; `AGE-*`, `A19-*`, `PREF-AUTO-NIGHT-*`.
- 재검토 조건: 자동 전환 usability에서 중대한 혼란이 확인되면 수동 banner 방식으로 amendment.

### D-07 · 국적 공개

- 상태: `Approved`
- 결정: KYC 국적은 자동 공개하지 않는다. 사용자가 `From`, `Lives in`, `Languages`를 각각 선택 공개한다.
- 배제: `Verified Korean` badge, 국적 강제 매칭, 신분증 국적의 무동의 공개.
- 이유: 국적은 로컬 전문성·안전 보증이 아니며 차별과 과노출 위험이 있다.
- 영향: `REQ-008`, `REQ-015`; `FL-003`, `FL-015`; `PUB-*`, `REP-*`.
- 재검토 조건: 확인된 국가 공개가 법적·운영상 필수이고 별도 명시 동의가 설계된 경우.

### D-08 · 첫 미션의 의미

- 상태: `Approved`
- 결정: 첫 현장 미션 `FL-012`는 신원 등급을 바꾸지 않고 유효한 현장 증거가 있을 때 Visit, 유효한 신호 기여가 있을 때 Contribution만 각각 상승시킨다. Meetup은 `FL-003`의 Table 체크인·완료·피드백 이후에만 상승한다.
- 배제: 동행자의 확인으로 KYC·법적 신원·19+ 상승.
- 이유: 행동 증거와 발급자 신원 증거는 검증 주체와 의미가 다르다.
- 영향: `REQ-003`, `REQ-008`, `REQ-015`, `REQ-016`; `FL-003`, `FL-004`, `FL-012`; `PER-*`는 불변, `REP-*`만 변경.
- 재검토 조건: 공인 issuer가 현장 미션 결과를 credential로 발급하는 별도 정책이 승인된 경우에도 Person과 구분.

### D-09 · Reputation 표현

- 상태: `Approved`
- 결정: Identity / Visit / Contribution / Meetup을 분리 표시하고 하나의 종합 점수를 만들지 않는다.
- 이유: 숫자 하나가 안전·맛 전문성·신원 수준을 과장한다.
- 영향: `REQ-015`; `FL-003`, `FL-012`; `REP-VISIT-*`, `REP-CONTRIBUTION-*`, `REP-MEETUP-*`, `REP-IDENTITY-*`.
- 재검토 조건: 산식·이의제기·조작 방지·설명 가능성까지 포함한 별도 reputation PRD가 승인된 경우.

### D-10 · Stamp와 NFT

- 상태: `Approved`
- 결정: My Korea에 10회 stamp milestone을 보여준다. NFT mint는 Labs의 opt-in 기념 badge simulation이다.
- 배제: KYC·국적·19+·부정 평판 NFT, 사용자의 동의 없는 mint, 실제 mainnet 주장.
- 이유: 여행 기억과 공개 신원·평판 원장을 분리한다.
- 영향: `REQ-016`; `FL-004`, `FL-018`; `STM-*`, `NFT-*`.
- 재검토 조건: 실제 Sui testnet package·wallet·mint transaction과 개인정보 검토가 완료된 경우.

### D-11 · KYC provider 표기

- 상태: `Approved`
- 결정: 계약 전에는 `Passport verification provider`라는 중립 adapter를 사용한다. Sumsub는 후보·fixture 이름으로만 문서화한다.
- 배제: 계약·sandbox key 없이 Sumsub 공식 연동으로 표시.
- 이유: 공급사 확정과 실제 지원 범위를 과장하지 않는다.
- 영향: `REQ-003`, `REQ-005`; `FL-002`, `FL-012`; `FX-PER-PASSPORT-*`.
- 재검토 조건: 공급사 계약, sandbox key, 수집 데이터·보관·지역 범위가 확정된 경우.

### D-12 · 9시간 종료 기대치

- 상태: `Approved`
- 결정: `Demo Candidate v2`를 목표로 Critical/High 0, 핵심 5~8 E2E, QA 2회, as-built까지 완료한다.
- 배제: 외부 연동 없이 실제 서비스 완성 또는 `Frontend Complete v1` 판정.
- 이유: 품질 gate와 기술 진실성을 지키는 현실적 종료 조건이다.
- 영향: 19개 REQ 전체와 release gate.
- 재검토 조건: 시간·환경·외부 의존성이 확대되면 이름을 올리는 대신 범위를 줄인다.

## 3. 충돌 해소 표

| 충돌 | 승인된 해소 |
|---|---|
| `KYC 뒤 앱 이용` vs Guest discovery | Guest discovery 유지, KYC는 행동별 JIT |
| `신뢰 내국인` vs 국적≠전문성 | `신뢰 로컬 기여자`로 표현 |
| 국적 표시 vs 개인정보 비공개 | self-declared 필드만 선택 공개 |
| 자동 After 19 vs 수동 JIT | age proof를 해당 CTA에서 JIT로 받고 자동 전환은 별도의 4개 guard를 모두 통과할 때만 허용 |
| 전국 vs 서울 집중 | 전국 shell + 서울 complete + 부산 seed |
| 결제·bridge MVP 제외 vs 기술 시연 | Hero checkout 1회 + Labs simulation |
| 방문 NFT 제외 vs 10회 NFT 요구 | My Korea milestone + Labs opt-in badge simulation |
| 자동 After 19 vs 이용자 manual-off | `AGE-VERIFIED` + 미만료 + KST 19:00+ + auto on + session manual-off 아님의 4개 guard |
| OpenDID와 EAS 동일시 | OpenDID adapter와 EAS adapter를 분리해 canonical Evidence Envelope로 정규화; 실제 EAS 발급·조회 구현은 9시간 `Deferred`이며 구현 전에는 EAS 호환 주장 금지 |
| zkLogin을 범용 계정으로 간주 | optional Sui signer로만 사용 |
| fixture에 `TESTNET` 표기 | 검증 가능한 실제 공개 `txRef`가 없으면 `truth=SIMULATED`; `Target network: Sui Testnet · Simulated`로만 표기 |
| KRW와 OOKRW 동일시 | KRW는 표시 가격, OOKRW test token은 mock settlement 수단 |
| checkout success와 방문 동일시 | `PAY-SIMULATED-SUCCESS`는 stamp를 바꾸지 않으며 중복 방지된 unique visit evidence만 stamp를 증가 |
| bridge source confirmed와 완료 동일시 | destination finality 확인 전에는 success·잔고 증가를 표시하지 않음 |
| custom AMM을 9시간 범위로 포함 | quote fixture만 허용하고 AMM·pool·liquidity·swap은 `Deferred` |

## 4. 변경 기록 양식

```text
Amendment ID: D-xx-A1
Requested at:
Requested by:
Reason:
Old decision:
New decision:
Affected REQ / Flow / State / Fixture:
Safety and privacy impact:
Approved by:
Implemented by commit:
```

현재 amendment: `없음`.
