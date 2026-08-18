# ONDO Frontend Demo Candidate v2 · As-built

상태: `TEMPLATE · IMPLEMENTATION NOT STARTED`
작성자: Root Integrator
RUN ID: `TBD`
기준 SPEC SHA: `TBD`
최종 code SHA: `TBD`
배포 URL: `TBD`
Evidence manifest: `./evidence/<RUN_ID>/manifest.md`

이 문서는 계획이 아니라 실제 구현 결과의 source of truth다. 구현·시뮬레이션·계약만 존재·유예를 구분하고, 화면에 보이는 기능을 근거 없이 실제 외부 연동으로 승격하지 않는다.

---

## 1. Release Summary

| 항목 | 실제 결과 |
|---|---|
| 결과명 | ONDO Frontend Demo Candidate v2 |
| 실행 시간 | TBD |
| 최종 Gate | TBD |
| Hero flow | TBD |
| Foundation flows | TBD |
| Labs flows | TBD |
| QA Loop 1 | TBD |
| QA Loop 2 | TBD |
| Critical/High | TBD |
| Medium/Low | TBD |
| Evidence manifest | TBD |

### 사용자에게 보이는 핵심 변화

TBD

### 이번 후보가 증명하지 않는 것

- 실제 CX/OpenDID/Passport provider 연동
- 실제 실시간 채팅·사진 저장
- 실제 자산 custody·결제·AMM·bridge
- 실제 merchant settlement
- 운영 가능한 reputation·신고 시스템

실제 결과에 따라 항목을 추가·수정하되 증명되지 않은 내용을 삭제하지 않는다.

---

## 2. Requirements Final Status

| REQ | 최종 등급 | 구현 위치 | Test/Evidence | 알려진 차이 |
|---|---|---|---|---|
| REQ-001 | TBD | TBD | TBD | TBD |
| REQ-002 | TBD | TBD | TBD | TBD |
| REQ-003 | TBD | TBD | TBD | TBD |
| REQ-004 | TBD | TBD | TBD | TBD |
| REQ-005 | TBD | TBD | TBD | TBD |
| REQ-006 | TBD | TBD | TBD | TBD |
| REQ-007 | TBD | TBD | TBD | TBD |
| REQ-008 | TBD | TBD | TBD | TBD |
| REQ-009 | TBD | TBD | TBD | TBD |
| REQ-010 | TBD | TBD | TBD | TBD |
| REQ-011 | TBD | TBD | TBD | TBD |
| REQ-012 | TBD | TBD | TBD | TBD |
| REQ-013 | TBD | TBD | TBD | TBD |
| REQ-014 | TBD | TBD | TBD | TBD |
| REQ-015 | TBD | TBD | TBD | TBD |
| REQ-016 | TBD | TBD | TBD | TBD |
| REQ-017 | TBD | TBD | TBD | TBD |
| REQ-018 | TBD | TBD | TBD | TBD |
| REQ-019 | TBD | TBD | TBD | TBD |

허용 값: `Implemented`, `Simulated`, `Contract-only`, `Deferred`, `Removed after QA`.

---

## 3. Flow Final Status

모든 Flow는 구현 여부와 무관하게 행을 유지한다. `Status` 허용 값은 `Passed`, `Partial`, `Deferred`, `Removed after QA`, `Failed`다. `Passed`에는 성공뿐 아니라 지정된 실패·취소·복귀 evidence가 있어야 한다.

| Flow | Status | Actual entry → terminal | Failure/cancel/returnTo | Commit | Test/Evidence |
|---|---|---|---|---|---|
| FL-001 | TBD | TBD | TBD | TBD | TBD |
| FL-002 | TBD | TBD | TBD | TBD | TBD |
| FL-003 | TBD | TBD | TBD | TBD | TBD |
| FL-004 | TBD | TBD | TBD | TBD | TBD |
| FL-005 | TBD | TBD | TBD | TBD | TBD |
| FL-006 | TBD | TBD | TBD | TBD | TBD |
| FL-007 | TBD | TBD | TBD | TBD | TBD |
| FL-008 | TBD | TBD | TBD | TBD | TBD |
| FL-009 | TBD | TBD | TBD | TBD | TBD |
| FL-010 | TBD | TBD | TBD | TBD | TBD |
| FL-011 | TBD | TBD | TBD | TBD | TBD |
| FL-012 | TBD | TBD | TBD | TBD | TBD |
| FL-013 | TBD | TBD | TBD | TBD | TBD |
| FL-014 | TBD | TBD | TBD | TBD | TBD |
| FL-015 | TBD | TBD | TBD | TBD | TBD |
| FL-016 | TBD | TBD | TBD | TBD | TBD |
| FL-017 | TBD | TBD | TBD | TBD | TBD |
| FL-018 | TBD | TBD | TBD | TBD | TBD |

`Partial`, `Deferred`, `Removed after QA`, `Failed`는 사용자 영향·fallback·후속 조건을 10절 Known Issues에도 연결한다. Flow ID range나 wildcard 대신 각 행에 exact Test/Evidence ID와 상대 링크를 기록한다.

---

## 4. Route and Screen Inventory

| Route/Entry | Screen/Sheet | 상태 | 주요 CTA | Notes |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

visible CTA가 다음 상태 또는 명시적 외부 handoff 없이 남아 있으면 Candidate를 승인하지 않는다.

---

## 5. Actual State Model

계획된 상태와 실제 구현 차이를 기록한다.

| Domain | Planned | Actual | Persistence | Difference |
|---|---|---|---|---|
| Onboarding | TBD | TBD | TBD | TBD |
| Guest/Account | TBD | TBD | TBD | TBD |
| Person verification | TBD | TBD | TBD | TBD |
| 19+ / After 19 preference | TBD | TBD | TBD | TBD |
| Payment KYC | TBD | TBD | TBD | TBD |
| Map/Search | TBD | TBD | TBD | TBD |
| Save repository / one-shot returnTo | TBD | TBD | TBD | TBD |
| Public Profile / field consent | TBD | TBD | TBD | TBD |
| Table membership | TBD | TBD | TBD | TBD |
| Chat message | TBD | TBD | TBD | TBD |
| Upload / local preview | TBD | TBD | TBD | TBD |
| Evidence | TBD | TBD | TBD | TBD |
| Merchant Trait | TBD | TBD | TBD | TBD |
| Checkout / Payment | TBD | TBD | TBD | TBD |
| Reputation | TBD | TBD | TBD | TBD |
| Stamp/NFT | TBD | TBD | TBD | TBD |
| Wallet / Bridge / Labs | TBD | TBD | TBD | TBD |

각 `Actual`에는 구현된 exact State ID, 초기값, terminal/failure state를 적는다. Persistence는 저장소 이름·versioned key·수명·reset trigger를 기록하며, 계획과 다르면 차이를 숨기지 않는다.

---

## 6. Data and Simulation Inventory

| Adapter/Provider | Execution label | Fixture/Endpoint | 실제 확인 범위 | UI 표현 |
|---|---|---|---|---|
| Map tile | TBD | TBD | TBD | TBD |
| ONDO data | TBD | TBD | TBD | TBD |
| OmniOne CX | TBD | TBD | TBD | TBD |
| Residence Card | TBD | TBD | TBD | TBD |
| Passport verification | TBD | TBD | TBD | TBD |
| OpenDID | TBD | TBD | TBD | TBD |
| Sui zkLogin | TBD | TBD | TBD | TBD |
| Stable assets | TBD | TBD | TBD | TBD |
| OOKRW bridge | TBD | TBD | TBD | TBD |
| Merchant contract | TBD | TBD | TBD | TBD |
| NFT mint | TBD | TBD | TBD | TBD |
| Chat/photo | TBD | TBD | TBD | TBD |

사용한 fixture와 실제 endpoint를 같은 행에서 섞지 않는다.

---

## 7. Test Evidence

### Automated

| Command/Test | 결과 | Artifact/Log | 비고 |
|---|---|---|---|
| typecheck | TBD | TBD | — |
| production build | TBD | TBD | — |
| test:contracts | TBD | TBD | canonical contract 전체 |
| E2E Hero flow | TBD | TBD | — |
| E2E identity states | TBD | TBD | — |
| E2E map fallback | TBD | TBD | — |
| visual screenshots | TBD | TBD | map tile mask 여부 기록 |
| accessibility | TBD | TBD | 자동+수동 범위 구분 |

모든 Artifact/Log는 `./evidence/<RUN_ID>/manifest.md` 또는 그 아래 파일로 상대 링크한다. manifest에는 command, exit code, code SHA, reviewer, 시각, scenario/locale/viewport, truth label이 있어야 한다. `k-tour-id-app/artifacts/qa/manifest.json`은 생성 도구의 staging 입력일 뿐 이 문서의 evidence 링크나 Gate source of truth가 아니다. 각 영구 artifact에는 staging 경로·staging SHA-256·영구 상대 경로·영구 SHA-256 mapping이 있어야 하며, checksum 불일치가 정규화·redaction으로 설명되지 않으면 결과를 `Not run`으로 기록한다.

### Manual

| Viewport/Language | Flow | Reviewer | 결과 | Evidence |
|---|---|---|---|---|
| 390×844 EN | TBD | TBD | TBD | TBD |
| 390×844 KO | TBD | TBD | TBD | TBD |
| 430×932 EN | TBD | TBD | TBD | TBD |
| Desktop smoke | TBD | TBD | TBD | TBD |

---

## 8. QA Loop History

### Loop 1

| Issue | Severity | Owner | Fix commit | Retest |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

### Loop 2

| Issue | Severity | Owner | Fix commit/rollback | Retest |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

자기 구현을 자기 혼자 승인하지 않는다.

---

## 9. Visual and Accessibility Differences

| Screen | Spec | Actual | 이유 | 사용자 영향 | Backlog |
|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD |

Critical/High 접근성 문제가 있으면 Candidate 승인을 보류한다.

---

## 10. Known Issues and Deferred Work

| Issue/Gap | Severity | 사용자 영향 | 우회 | 후속 owner |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

Medium/Low가 0일 필요는 없지만 모두 기록한다. Critical/High는 0이어야 한다.

---

## 11. Security, Privacy and Truth Review

- [ ] KYC 국적 자동 공개 없음
- [ ] 법적 이름·생년월일·신분증 원문 노출 없음
- [ ] 정확한 사용자 위치 공유 없음
- [ ] `Person verified`를 안전·전문성 보증으로 사용하지 않음
- [ ] OpenDID가 EAS를 사용한다고 표현하지 않음
- [ ] zkLogin을 KYC·멀티체인 지갑으로 표현하지 않음
- [ ] USDC·USDT를 하나의 실제 USD 자산으로 표현하지 않음
- [ ] Custom bridge·AMM을 실제 안전한 연결로 표현하지 않음
- [ ] OOKRW를 상환 가능한 KRW stablecoin으로 표현하지 않음
- [ ] NFT에 국적·성인·부정 평판을 기록하지 않음
- [ ] Fixture와 실제 provider receipt 혼합 없음
- [ ] public asset/repo에 secret·PII 없음

한 항목이라도 실패하면 `REJECTED — TRUTH/PRIVACY`를 검토한다.

---

## 12. Developer Handoff

### Fixture → API 교체 지점

TBD

### 실제 연동 전 필요한 결정

TBD

### 유지해야 할 UX 불변식

TBD

### 실행 명령

```text
TBD
```

---

## 13. Final Decision

판정: `NOT EVALUATED`

판정자: `TBD`
판정 시각: `TBD`
최종 commit: `TBD`
배포: `TBD`

판정 사유:

TBD
