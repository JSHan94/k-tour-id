# K-Tour ID 해커톤 필수 Sui 연동 — 개발·제출 추가 명세

작성일: 2026-09-14 · 상태: **개발 대상, 실제 구현·검수 완료 아님**

현재 앱 참고는 [K-Tour ID Preview](https://ondo-hinsi4hdz-jaewook-9643s-projects.vercel.app)(source `4a6904a`, `feat/sumsub-sandbox-onboarding-20260914`)와 [유지보수 검수 기록](./KTOUR_BRAND_CLEANUP_2026-09-15.md)을 따른다. 이 브랜딩·패키징 검수는 아래 Sui 개발·제출 요건의 완료 증거가 아니다.

## 1. 범위와 공식 근거

이번 팀의 필수 기술은 **OmniOne CX + OpenDID + OmniOne Chain + Sui**다. 이 문서는 [1주 개발 명세](./HACKATHON_ONE_WEEK_SPEC_2026-09-14.md)의 Sui 상세 계약이며, 기존 Sui 제외 문구와 DB 선사용 방식보다 아래의 통합 순서가 우선한다. 실제 금융·브리지·매장 예약·외국인 인증까지 확대하는 것은 아니다.

2026-09-14에 직접 읽은 [Sui 재단 프로그램 안내](https://mystenlabs.notion.site/2026-AI-1-1-Sui-2c76d9dcb4e980c4ba47c9c81dd1564a)는 아래를 요구한다. 이는 DID 주관사의 공식 후원/트랙이 아니라 **독립적인 Sui 지원 프로그램**이다.

| 프로그램 조건 | 이번 구현·제출에서 준비할 것 |
|---|---|
| 핵심 Move 로직을 Testnet 또는 Mainnet에 배포 | 한정된 서비스 실행 권한을 발급·철회·1회 소비하는 Move package, 배포 ID와 재현 절차 |
| zkLogin·PTB·Walrus·DeepBook 중 2개 이상 활용 | **zkLogin + PTB**를 기본안으로 고정. 둘 다 실제 사용자 여정에서 실행 |
| Agentic AI 활용과 AI 데이터 기원·위변조 검증 | 실제 모델 제안 → 승인된 권한 안의 agent 실행 → 입력/출력/승인/실행 연결 및 변조 검출 |
| DID 해커톤 공식 1–3위 수상 | 소프트웨어 구현과 별개의 외부 결과. 개발 완료로 보장 불가 |
| DeepSurge 등록·최종 제출 | 프로젝트 등록 URL 및 실제 접수 확인 |
| 공개 GitHub·README·1페이지 기술 요약 | 실행 가능한 코드, 비밀값 없는 설정, 왜 AI 앱에 Sui가 필요한지 설명 |

**상금 확인 주의:** Sui 안내의 추가 지원금은 등급별 1,000/700/500만 원 상당이며 현재 [DID 공식 안내](https://opendid.org/hackathon/2026/)의 1,500/600/300만 원과 다르다. “항상 정확히 두 배”나 지급 확정을 문서에 약속하지 않는다. 우수상 복수 팀의 적용과 실제 지급 조건도 담당자 확인 대상이다.

DeepSurge 공개 페이지의 기간 표시는 최종 제출 시각·시간대의 확정 근거가 아니다. 팀 등록 상태, 참가자 조건, Sui 별도 마감과 수정 가능 기간을 확인해야 한다. 안내의 5/31은 **DID 공식 참가 신청**으로 쓰여 있으므로 Sui 접수가 이미 닫혔다고 추정하지 않는다. [DeepSurge 프로젝트 등록처](https://www.deepsurge.xyz/hackathons/d3da2166-edab-4af2-b750-4c8d29f4b12a)

## 2. 대표 여정과 기술 역할

아래는 프로그램 조건을 서비스에 연결하는 **우리 구현안**이다. 운영자가 이 구체 설계의 바운티 인정을 사전 승인한 것은 아니다.

```text
지도 → 지정 장소의 체험 혜택
 → 실제 CX 신원 확인 → OpenDID 패스 발급·보관·VP 검증
 → 혜택 도우미가 허용된 비금전 행동 제안
 → 사용자가 대상·수신 지갑·1회 범위·기한 확인/승인
 → zkLogin 서명 + PTB로 제한된 Sui 실행 권한 위임
 → agent가 Move 권한을 1회 행사하고 결정·실행 기록 연결
 → 서버가 Sui 결과 검증 + 현재 자격·취소·만료 최종 재확인
 → DB 혜택 사용 1건 + OmniOne outbox 1건
 → 같은 장소의 사용 내역으로 복귀
                         └→ OmniOne 기록·확정 결과 조회
```

- **CX:** 신원 근거. **OpenDID:** 사용자가 보관·제시하는 자격. **Sui:** 사용자가 한정한 agent 실행 권한과 검증 가능한 실행 기록. **서비스 DB:** 체험 혜택 사용 여부. **OmniOne Chain:** 그 서비스 결과의 감사 기록.
- 사용자 CTA는 “혜택 확인”, “확인하고 사용하기”, “사용 내역”처럼 유지한다. 기술 이름과 explorer는 설명/증거 화면에만 둔다. 이미 지도 탐색 중인 사용자에게 선제 신원 확인을 요구하지 않는다.
- 사용자는 거절·나가기가 가능하다. 다만 이번 납품·대표 시연은 Sui까지 실제 완료해야 한다. Sui를 생략한 CX 데모를 전체 완료로 판정하지 않는다.
- 혜택은 금전/실물 제공 의무 없는 K-Tour ID 체험이다. 실제 방문, 10회 방문 badge, 19+, 금융 KYC, KRW 잔액을 올리지 않는다.

## 3. 구현 작업

### HK-06 · Move 권한 및 실제 결과

- package 1개, 캠페인 1개, 비금전 action 1종. K-Tour ID의 검증된 발급 근거와 사용자 승인을 모두 요구한다. 임의 사용자가 유효 권한을 생성하는 public mint는 불가다.
- `logicalIntent`에 대응하는 무작위 참조, 허용 agent, 행동/대상 commitment, 수신 지갑, network/package, 정책 버전, 제안·동의 digest, 실행 기한, 최대 1회, 금전 이동 0을 묶는다. 공개 객체에는 DID/VC/내부 subject/실제 위치·개인정보를 넣지 않는다.
- 계약이 발급자·소유권·허용 agent·범위·만료·철회·사용 횟수를 검사한다. 동일 grant는 revoke/consume 중 먼저 확정된 결과를 따른다.
- 서버는 network/package/version, grant/intent, owner/agent, event·성공 effects·객체 상태를 확인한다. 서명 성공·digest 수신만으로 완료 표시 금지. 업그레이드 권한·signer 보관 방식도 고정한다.

### HK-07 · zkLogin + PTB와 모바일 복귀

- 지원 OAuth provider 1개, 실제 zkLogin 주소/서명 경로 1개를 연결한다. audience/nonce, ephemeral key·maxEpoch, salt/prover, 세션 복구, 가스 지급 주체를 준비한다. 로그인만 한 것은 실제 Sui 통합 완료가 아니다.
- DID subject와 zkLogin 계정이 동일인이라고 추정하지 않는다. 검증된 서비스 세션에서 지갑 소유 증명과 요청별 동의를 결합한다. 지갑/네트워크/대상이 바뀌면 재승인한다.
- 사용자 PTB는 승인한 범위의 위임을, agent PTB는 권한 소비와 결정·실행 기록을 처리한다. 다중 명령의 실사용을 증명한다. **PTB 내부만 원자적이며 DB·CX·OpenDID·OmniOne을 포함하지 않는다.**
- 모델이 만든 임의 transaction bytes를 실행하지 않는다. 신뢰된 builder가 allowlist로 조립하고, 추가 Coin 전송/임의 Move 호출을 검출한다. 가스 후원이면 sponsor도 전체 거래와 budget을 검증한다. 실패에도 네트워크 가스가 발생할 수 있다.
- 실제 승인창 왕복·거절·epoch 만료·prover/RPC 장애·가스 부족·cold return을 구현한다. 지도·장소 복귀 context는 보존하되 키/JWT/proof는 URL·브라우저 일반 상태에 넣지 않는다.

### HK-08 · 제한된 AI 실행과 provenance

- 실제 모델 호출로 허용된 체험 행동을 제안하고, 사용자 승인 후 agent worker가 허용 tool을 실행한다. 고정 문구 생성만 하고 “자율 실행”이라고 설명하지 않는다.
- 자격 판정은 모델이 아닌 DID verifier·서버 정책이 한다. 한정된 action 1종·대상·1회·기한 밖의 행동은 서버와 Move 양쪽에서 거절한다. AI가 금액/수령자/계약을 임의 변경할 수 없다.
- 모델에는 비식별·허용된 장소/혜택 정보만 전달한다. VC 원문·OAuth JWT·salt·개인키는 전달하지 않는다. agent signer는 격리된 실행 계층에서 사용한다.
- 비식별 입력, 정책·모델·프롬프트 버전, 출력, 제안·승인 digest, 권한, 실행 결과를 같은 intent로 연결한다. 공개 가능한 최소 manifest의 commitment를 Sui 기록에 연결하고 검증 스크립트에서 한 필드 변경 시 불일치를 재현한다.
- commitment는 기록 일치·위변조 검출 근거이지 AI 판단의 진실성·정확성 보증이 아니다. 출력 provenance와 실행 provenance는 단계별로 기록하며 아직 나오지 않은 tx 결과를 최초 commitment에 넣었다고 주장하지 않는다.

### HK-09 · 바운티 증거·접수

- 공개 source commit, `Move.toml`, clean build/test, network/package/publish digest, zkLogin·PTB·agent 실제 호출 및 negative test를 묶는다.
- DID 신원/VC·VP → consent → Sui grant/agent effects → DB 사용 → OmniOne receipt를 비식별 evidence로 연결한다. 공개 두 체인에 동일 개인 식별자를 기록해 연결하지 않는다.
- DeepSurge 등록/접수, 실행 README, 1페이지 Sui–AI case study, 같은 버전의 시연 영상/URL을 준비한다. 원본 신분증·사업제안서의 연락처·키를 공개 Git에 넣지 않는다.

## 4. DB·두 체인의 실패 경계

**Sui 권한 행사 성공은 혜택 사용 완료가 아니다.** Sui 전에 durable intent/사용권 예약을 만들고 최종 서비스 사용 직전에 서버가 다시 판단한다.

| 상황 | 처리 |
|---|---|
| 서명·전송 전 거절 | intent 종료, 혜택 사용 0 |
| 전송 후 unknown | 동일 digest/grant/intent 조회. 새 grant 자동 발급 금지 |
| grant 활성, 중단 요청 | agent 중단 및 필요한 onchain revoke. 요청과 철회 확정을 구분 |
| Sui consume 성공, DB 처리 대기 | `authorization_consumed / fulfillment_pending`; 서비스 완료로 표시하지 않음 |
| Sui consume 뒤 자격 철회·만료·취소·status 불명 | `authorization_consumed / fulfillment_blocked`; 사용 0. 체인 기록을 되돌렸다고 말하지 않음 |
| DB 사용 완료, OmniOne 대기/장애 | 사용 내역 유지, 같은 outbox 재처리. Sui 또는 혜택 재실행 금지 |
| 앱을 닫음/뒤로 감 | 위임 철회나 미사용으로 추정하지 않고 서버 상태 재조회 |

외부 OpenDID 상태와 Sui 합의·DB commit 사이의 무지연 원자성을 보장할 수 없다. status freshness·grant 실행 만료·서비스 확정 기한을 각각 고정하고, 내부 취소/상태 버전은 최종 DB commit과 직렬화한다. 오래된 allow를 되살리지 않는다.

같은 subject/campaign은 다른 지갑·VC·탭에서도 같은 논리 사용 건을 조회한다. intent/grant/event/DB unique 제약으로 재시도를 묶는다. unknown/consumed 상태에서 다른 grant로 우회하지 않는다. 복구 불가능한 blocked 상태는 명시적 운영 해결 대상으로 남기며 자동 재사용시키지 않는다.

## 5. 추가 API·데이터 계약

기존 `/api/hackathon/v1`에 추가할 **제안**이며 실제 구현된 endpoint가 아니다.

| API | 책임 |
|---|---|
| `POST /demo-entitlements/{id}/proposals` | 유효한 VP/판정에서 허용 AI 제안·digest 생성 |
| `POST /delegations` | actor·proposal·consent·지갑 소유 증명 재검증, durable intent/위임 생성. **사용 완료 아님** |
| `POST /delegations/{id}/submit` | 승인된 Sui 거래 상관관계 확인·조회. client success를 신뢰하지 않음 |
| `POST /delegations/{id}/revoke` | 단계별 중단/철회. 방송 후 취소 보장 금지 |
| `GET /operations/{id}` | AI proposal, delegation, agent dispatch, Sui 결과, fulfillment 상태·허용 행동 조회 |
| `GET /operations/{id}/evidence` | Sui와 OmniOne의 독립 receipt/상태, 비식별 provenance 검증 자료 |

기존 `POST .../redeem`은 **검증된 같은 Sui 실행 증거가 있어야** 최종 재판정·사용 commit 가능하다. 없는 경우 pending/deny이며 DB-first 우회 성공을 허용하지 않는다. worker/재조정 경로도 동일 서비스를 사용한다.

`agent_proposals`, `delegations`, `sui_operations` 또는 동등 구조를 추가한다. `logicalIntent`, subject/campaign, request digest, grant 참조, Sui digest/effects, fulfillment 상태·버전, idempotency와 provenance를 연결한다. chain별 outbox/receipt는 독립적이다. 전체 enum·OpenAPI·에러와 상태 mapping은 D2에 고정한다.

기존 장소/신원 sheet, Labs의 승인·대기·실패 UI와 evidence 레이아웃만 재사용한다. **현재 fixture 모델·10회 방문 badge·샘플 지갑 연결을 실제 SDK/Move/agent로 간주하지 않는다.** 현재 앱에 실제 Sui·zkLogin·Move·agent 구현은 없다.

## 6. 추가 수락 검사 — A13–A20

기존 A01–A12와 함께 통과해야 한다. Sui 포함 대표 여정은 A02를 확장해 검사한다.

| ID | 반례/행동 | 완료 조건 |
|---|---|---|
| A13 | 실제 zkLogin → 위임 PTB → agent Move 실행 | 고정 network/package의 실제 서명·effects·grant·provenance와 같은 서비스 사용 1건 연결 |
| A14 | 잘못된 agent/owner/지갑/대상/기한, 추가 Coin 전송, prompt injection | 범위 밖 거래 및 혜택 사용 0; 모델 출력이 권한을 만들지 못함 |
| A15 | 두 탭·새 VC·새 지갑·grant 재사용 | 같은 subject/campaign 사용 1회; 새로운 grant로 중복 실행 우회 불가 |
| A16 | 서명 취소·prover 실패·epoch 만료·gas 부족·다른 network | 단계에 맞는 거절/실패/재확인. 혜택 false-success 0 |
| A17 | Sui unknown·consume 뒤 DB 재시작·지연 응답 | 같은 intent 재조정; 중복 grant/사용/OmniOne outbox 0 |
| A18 | grant 후 철회·취소 경합·consume 후 자격 무효 | Sui 상태와 서비스 결과를 분리, 최종 자격 미충족 시 사용 0, 거짓 rollback 0 |
| A19 | 다른 intent/package의 receipt, 두 체인의 서로 다른 상태 | 잘못된 증거 거절, 각 체인 독립 조회, 한쪽 성공으로 다른 쪽 완료 금지 |
| A20 | provenance 한 필드 변경, mock 주입, 공개 코드/체인/로그/영상 검사 | 변조 검출, 실제 권한 생성 0, PII·secret 노출 0; 재현 README/1페이지 case study 준비 |

## 7. 담당·일정·미확인 사항

Harvey의 CX/OpenDID/OmniOne 업무에 Sui/zkLogin/Move/AI 실행·복구가 추가된다. **이름만 추가한 변경이 아니며, 같은 인원으로 같은 1주 일정 달성을 보장하지 않는다.** Sui/AI 담당을 별도 배정하는 안을 우선한다. 배정·환경 미확보 시 즉시 제품 책임자와 지원/일정을 조정하며 Sui를 자동 제외하지 않는다.

- D2: 네 기술 실제 smoke, Sui 등록/조건 확인, zkLogin 환경·Move 설계·agent 범위 고정.
- D3: Sui 권한/agent/provenance와 DID·서버를 병렬 구현.
- D4: 지도부터 두 체인 결과까지 통합 시연. D5: A01–A20, D6–7: 영상·자료·접수 준비.
- 별도 확인: 팀의 DeepSurge 등록, 참가 자격, 최종 제출 마감/시각, 실제 지급 등급·금액, 이 MVP의 핵심 활용 인정. **코드 완료와 접수/수상/격려금 지급은 별도 판정**이다.

기술 참고: [Sui 문서](https://docs.sui.io/), [zkLogin](https://docs.sui.io/sui-stack/zklogin-integration/zklogin), [PTB](https://docs.sui.io/develop/transactions/ptbs/prog-txn-blocks), [기존 전체 Sui 브리프](./SUI_INTEGRATION_BRIEF.md). 기존 브리프의 넓은 금융/bridge 예시는 이번 최소 범위를 자동 확대하지 않는다.
