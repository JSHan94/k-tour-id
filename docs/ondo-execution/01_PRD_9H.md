# ONDO 9시간 PRD

상태: `Approved execution baseline · 2026-08-19`

릴리스 목표: `ONDO Frontend Demo Candidate v2`

제품 책임자 결정: `D-01~D-12 권장안 승인`
대상: Root Integrator, Map & Discovery, Identity & Trust, Connect & Commerce

연관 문서:

- [결정 원장](./02_DECISION_LEDGER.md)
- [플로우 카탈로그](./03_FLOW_CATALOG.md)
- [상태 모델](./04_STATE_MODEL.md)
- [9시간 실행 준비도 감사](../ONDO_9H_EXECUTION_READINESS_AUDIT.md)
- [프론트엔드 제품화 마스터 플랜](../ONDO_FRONTEND_PRODUCTIZATION_PLAN.md)
- [PULSE KOREA 제품 방향](../PULSE_KOREA_PRODUCT_DIRECTION.md)

---

## 1. 목적

초기 9시간 Wave 안에 외부 신원·결제·체인 서비스를 실제 연결하지 않더라도, 사용자가 다음 여정을 성공·취소·실패·재진입까지 끊김 없이 경험하는 프론트 후보를 만든다. 초기 Wave 이후에는 범위를 임의 확장하지 않고 이 PRD의 Candidate Gate를 통과할 때까지 Quality Extension Wave를 자동 반복한다.

> 방한 단기 여행자가 가입 없이 서울의 최신 로컬 식음료 신호를 발견하고, 필요한 순간에만 계정과 자격을 확인한 뒤 식사 자리·대화·현장 피드백까지 진행한다.

이 결과는 `실제 서비스 완성`, `실제 KYC 완료`, `실제 bridge`, `Frontend Complete v1`로 부르지 않는다.

## 2. 제품 불변식

1. Guest는 가입·KYC 없이 지도, 검색, 장소 상세, 외부 길찾기를 사용한다.
2. Account, Person, 19+, Payment KYC, Reputation은 서로 독립된 축이다.
3. ONDO의 핵심은 식음료 발견이다. DID·지갑·체인은 필요한 행동 또는 Labs에서만 보인다.
4. 로컬 전문성은 국적이 아니라 방문·기여·meetup 행동 이력으로 올라간다.
5. After 19는 주류·법적 성인 조건이 있는 식음료만 제한한다. 일반 심야 식당은 기본 지도에 남는다.
6. 전국 overview는 유지하되 서울만 완결 데이터, 부산은 seed, 나머지는 `Explore/Growing`이다.
7. 모든 외부·Labs 상태는 `truth`, provenance, fixture ID를 보존한다. wallet·bridge·mint fixture는 항상 `SIMULATED`이며 `TESTNET`은 실제 공개 testnet txRef를 조회·검증한 경우에만 사용한다. contract-only와 provider 미구성 상태는 각각 `CONTRACT_ONLY`, `NOT_CONFIGURED`로 구분한다.
8. 모든 gate는 원래 사용자가 하던 행동으로 돌아가는 `returnTo`를 보존한다.
9. KYC 국적은 자동 공개하지 않는다. `From`, `Lives in`, `Languages`는 사용자 선택 정보다.
10. 평판·KYC·국적·19+·부정적 제재 정보를 공개 NFT에 기록하지 않는다.

## 3. 구현 등급

| 등급 | 정의 | 완료 증거 |
|---|---|---|
| `Implemented` | 외부 서비스 없이도 실제 프론트 동작으로 완결되는 기능 | 정상·경계 상태, persistence, E2E |
| `Simulated` | 외부 의존성은 fixture지만 UI 상태와 성공·취소·실패·재시도·복귀가 완결됨 | simulation 라벨, fixture ID, 분기 E2E |
| `Contract-only` | 9시간에 UI나 외부 호출을 만들지 않고 adapter·input·output·오류 경계만 고정 | 계약 문서와 소비 지점 |
| `Deferred` | 이번 실행에서 구현하지 않으며 후속 조건과 이유를 명시 | backlog·재개 조건 |

`Simulated`는 정적인 성공 화면을 뜻하지 않는다. 외부 응답만 fixture이고 나머지 사용자 경험은 실제로 작동해야 한다.

### 현재 `/ondo` baseline 해석

이 표의 등급은 **현재 완료 상태가 아니라 초기 Wave 목표이자 최종 Candidate 최소선**이다. 현재 코드는 `app/ondo/page.tsx`가 단일 `OndoPrototype`을 렌더링하며, 언어·지도·guide·19+·저장·Table이 component-local state에 있다. 전국 outline·서울 식음료 fixture·장소 상세·외부 길찾기는 출발점으로 재사용할 수 있지만 다음은 아직 목표 상태가 아니다.

- guide는 persona onboarding과 Account 생성 flow가 아니다.
- 기본 프로필의 `Daniel Kim · Person verified`는 verification 전 상태 모델과 충돌한다.
- 19+ 버튼은 provider·pending·cancel·failure·expiry 없이 즉시 성공한다.
- Table 참여·저장·필터는 session memory에 머물며 chat·사진·feedback·결제·평판 전이가 없다.
- budget·dietary control은 결과 변화와 검증 증거가 필요하다.

따라서 기존 시각 자산과 식음료 fixture는 보존하되, gate·flow·state는 이 실행팩 기준으로 재구성한다.

## 4. 3층 범위

### Hero

가장 깊게 구현하는 외국인 핵심 시연이다.

```text
Guest ONDO
→ 서울 Heat 탐색
→ 장소 상세·가기 전 확인
→ 저장 또는 Table에서 Account 생성
→ Passport verification simulation
→ After 19 또는 식사 자리 참여
→ 텍스트·이미지 그룹 대화
→ 현장 체크인·상호 피드백
→ Reputation·10번째 stamp 변화
```

### Foundation

같은 제품이 사용자 유형별로 다른 verification adapter를 사용함을 짧고 클릭 가능하게 증명한다.

- 한국인 Account → OmniOne CX Mobile ID simulation
- 장기체류 외국인 Account → Mobile Residence Card 지원·미지원 simulation
- 단기 여행객 → 중립 `Passport verification provider`
- Guest / Account / Person / 19+ / Payment KYC 분리
- OpenDID 기반 canonical evidence adapter 계약
- OmniOne 상점 eligibility receipt 계약

### Labs

소비자 홈과 분리된 기술 시연이다.

- optional Sui zkLogin signer
- `Target network: Sui Testnet · Simulated` signer/token balance fixture
- USDC·USDT 환산 표시
- OOKRW test token·Sui↔OmniOne bridge hypothesis simulation
- 10회 milestone 이후 opt-in 기념 badge mint simulation

AMM은 9시간 범위에서 `Deferred`다. quote·slippage·pool invariant·liquidity source를 정의하지 않은 화면상 swap은 만들지 않는다.

Labs fixture는 `LABS · SIMULATED`와 대상 네트워크를 분리해 표시한다. `Target network: Sui Testnet · Simulated`는 실제 testnet 실행을 뜻하지 않는다. 실제 공개 txRef를 조회·검증한 경우에만 해당 transaction 증거에 `TESTNET`을 사용한다.

## 5. Persona

| Persona ID | 사용자 | 첫 목적 | verification adapter | Hero 깊이 |
|---|---|---|---|---|
| `PER-TOURIST-SHORT` | 단기 방한 외국인 | 지금 먹을 곳 발견·Table 참여 | Passport provider → service credential fixture | 가장 깊음 |
| `PER-LOCAL-KR` | 한국인·한국 로컬 | 지역 신호·Table 개설 | OmniOne CX Mobile ID fixture | Foundation |
| `PER-RESIDENT-LONG` | 국내 장기체류 외국인 | 여행·지역 기여·Table | Mobile Residence Card fixture, 미지원 대체 경로 | Foundation |

`Persona`는 영구 계정 타입이 아니다. 사용 의도와 verification 경로를 초기화하는 fixture일 뿐 역할은 행동에 따라 변한다.

## 6. 19개 요구사항 registry

| REQ ID | 원 요구 | Layer | 9시간 목표 | 제품화 깊이 | 핵심 Flow / State | 대표 Fixture |
|---|---|---|---|---|---|---|
| `REQ-001` | 한국인 OmniOne CX | Foundation | `Simulated` | 성공·취소·실패·만료 fixture; 실제 CX 호출 없음 | `FL-005`, `PER-*` | `FX-PER-CX-SUCCESS` |
| `REQ-002` | 장기체류 외국인 외국인등록증 | Foundation | `Simulated` | 지원·미지원·대체 verification 분기 | `FL-006`, `PER-UNSUPPORTED` | `FX-PER-RESIDENCE-UNSUPPORTED` |
| `REQ-003` | 단기 여행객 Passport KYC + 첫 현장 미션 | Hero | `Simulated` | KYC와 행동 평판을 분리; `FL-012`는 unique evidence에 따른 Visit·Contribution만 변경하고 Meetup은 `FL-003` 이후 | `FL-002`, `FL-012`, `PER-*`, `REP-*` | `FX-PER-PASSPORT-SUCCESS`, `FX-UPL-LOCAL-SIGNAL-SUCCESS` |
| `REQ-004` | OpenDID·EAS·chain receipt adapter 경계 | Foundation | `Contract-only` | OpenDID와 EAS를 별도 adapter로 두고 canonical Evidence Envelope로 정규화; 실제 EAS adapter 구현은 Deferred | `FL-016`, `FL-018`, `EVD-*` | `FX-EVD-VALID` |
| `REQ-005` | 로그인/KYC 분리·Sui zkLogin | Foundation | `Simulated` | Account와 verification gate 분리; zkLogin은 Labs signer 선택지 | `FL-010`, `FL-018`, `ACC-*`, `WAL-*` | `FX-ACC-SUCCESS`, `FX-WAL-LABS-READY` |
| `REQ-006` | USDC/USDT·OOKRW·bridge; AMM Deferred | Labs | `Simulated` | 자산별 잔고와 bridge source/destination state; 실제 자산 이동 없음. AMM은 9시간 비구현 | `FL-018`, `BRG-*`, `BRP-*` | `FX-BRG-DESTINATION-CONFIRMED` |
| `REQ-007` | 식음료 한정·신뢰 로컬 신호 ONDO | Hero | `Implemented` | 실제 지도, 최신성·근거·신호 수, 가짜 전국 점수 금지 | `FL-001`, `FL-012`, `MAP-*` | `FX-MAP-SEOUL-RECENT` |
| `REQ-008` | 장소 기반 meetup·대화·피드백·선택 공개 프로필 | Hero | `Simulated` | 강제 외국인↔한국인 매칭 없음; Table availability·membership·failure reason·chat access 분리 | `FL-003`, `FL-015`, `TAV-*`, `TMB-*`, `TFR-*`, `CHA-*`, `PUB-*` | `FX-TBL-SEOUL-DINNER` |
| `REQ-009` | 사진 업로드 mock | Hero | `Simulated` | 로컬 파일 선택·미리보기·교체·삭제·실패 | `FL-012`, `UPL-*` | `FX-UPL-PHOTO-PREVIEW` |
| `REQ-010` | 채팅 이미지 전송 mock | Hero | `Simulated` | pending·sent·failed·retry와 삭제 전 확인 | `FL-003`, `MSG-*` | `FX-MSG-IMAGE-FAIL` |
| `REQ-011` | 식음료 지갑 KRW 표시 가격/OOKRW read-only settlement hypothesis | Hero | `Simulated` | KRW는 사용자 표시 가격이다. OOKRW는 별도 settlement simulation test token이며 사용자 결제수단·상환 가능한 원화가 아니다; payment KYC gate; 원장은 Labs fixture | `FL-004`, `FL-017`, `PAY-*`, `PKY-*` | `FX-PAY-SUCCESS`, `FX-PKY-SUCCESS` |
| `REQ-012` | verified 19+ 야간 자동 전환 | Hero | `Simulated` | `AGE-VERIFIED`·미만료, KST 19:00+, auto setting on, session manual-off 아님의 4개 guard; 즉시 off banner | `FL-002`, `FL-013`, `FL-014`, `A19-*`, `AGE-*` | `FX-A19-AUTO-READY`, `FX-AGE-SUCCESS` |
| `REQ-013` | Can I Go 비중 축소 | Hero | `Implemented` | 독립 탭 없이 장소 상세의 `가기 전 확인` facts | `FL-001`, `FL-016`, `TRT-*` | `FX-TRT-ELIGIBLE` |
| `REQ-014` | OmniOne 상점 trait smart contract | Foundation | `Contract-only` | OfferRegistry·redemption·evidence receipt 계약; 전체 이용 가능 보증 금지 | `FL-016`, `TRT-*` | `FX-TRT-STALE` |
| `REQ-015` | Reputation | Hero | `Simulated` | Identity·Visit·Contribution·Meetup 분리, 종합 점수 없음 | `FL-003`, `FL-012`, `REP-*` | `FX-REP-BEFORE`, `FX-REP-AFTER` |
| `REQ-016` | 방문 10회 stamp와 NFT | Labs | `Simulated` | 9→10 milestone은 UI; NFT는 opt-in badge mint simulation | `FL-004`, `STM-*`, `NFT-*` | `FX-STM-10`, `FX-NFT-MINT-SUCCESS` |
| `REQ-017` | 서울 또는 서울+부산 집중 | Hero | `Implemented` | 전국 shell + 서울 완결 + 부산 seed; 나머지 Explore/Growing | `FL-001`, `MAP-*` | `FX-MAP-KOREA`, `FX-MAP-BUSAN-SEED` |
| `REQ-018` | 웹앱 우선 | Foundation | `Implemented` | Next.js responsive web, 390×844 우선, 데스크톱 중앙 프레임 | `FL-001`, `FL-007`, `FL-008`, `FL-009`, `MAP-*`, `ONB-*` | `FX-ONB-SHORT`, `FX-MAP-TILE-FAIL` |
| `REQ-019` | Hot 시각화 강화·레퍼런스 | Hero | `Implemented` | 발자취형 전국 점묘 + 실제 지도 ONDO layer + 숫자·단계·신뢰 | `FL-001`, `MAP-*`, `EVD-*` | `FX-MAP-SEOUL-RECENT`, `FX-EVD-VALID` |

미판정 요구는 허용하지 않는다. 목표 등급이 바뀌면 [결정 원장](./02_DECISION_LEDGER.md)에 새 결정과 영향을 기록한다.

## 7. 핵심 화면

| Surface ID | 화면 | 필수 내용 |
|---|---|---|
| `SCR-ONB` | Persona onboarding | 언어, 가치, 의도, 선택 취향, 인증 건너뛰기, 지도 도착 |
| `SCR-MAP` | ONDO home | 전국/서울/부산, 검색·필터, 지도/목록, 현재 위치, heat legend |
| `SCR-VENUE` | 장소 상세 | ONDO 근거, 영업·가격·예약·언어·카드·연령, 저장·길찾기·Table |
| `SCR-ID` | Account & ID | Account, Person, 19+, Payment KYC, consent를 별도 표시 |
| `SCR-A19` | After 19 | manual proof, auto banner, off, 실패·미지원·만료 |
| `SCR-TABLE` | Table | 장소·시간·메뉴·언어·가격·주류 조건, 참여 gate |
| `SCR-CHAT` | 그룹 대화 | 참가 확정 후만, 텍스트·이미지, 신고·나가기 |
| `SCR-FEEDBACK` | 종료·피드백 | 체크인, 유용성·약속·행동 피드백, reputation 변화 |
| `SCR-MY` | My Korea | 저장, 방문 stamp, 9→10 milestone |
| `SCR-LABS` | Labs | wallet·bridge·contract·NFT simulation과 증거 라벨 |

## 8. 초기 9시간 + Quality Extension acceptance criteria

### Release gate

- 19개 REQ 모두 목표 등급과 Flow·State·Fixture가 연결된다.
- 단기 외국인 Hero flow의 success·cancel·failure·returnTo가 자동 검수된다.
- 한국인 CX와 장기체류 외국인 지원·미지원 Foundation flow가 클릭 가능하다.
- Guest가 KYC 없이 지도·검색·상세·길찾기를 완료한다.
- Account가 없어 저장·Table을 누르면 account gate 후 원래 CTA로 복귀한다.
- 실제 지도 또는 지도 실패 목록 fallback 중 하나가 항상 남는다.
- 서울은 빈 성공 화면 없이 완결되고 부산은 seed임이 정직하게 표시된다.
- After 19 자동 전환은 `AGE-VERIFIED + KST≥19:00 + auto on + current session≠A19-MANUAL-OFF` 네 guard를 모두 만족할 때만 발생한다.
- Table 참가 전 채팅 접근, Payment KYC 전 결제, 9 stamp 전 NFT mint가 불가능하다.
- mock checkout 성공만으로 stamp가 증가하지 않으며, 중복되지 않은 unique visit evidence 이후에만 9→10으로 증가한다.
- 이미지 mock은 pending·failed·retry·remove를 갖는다.
- simulation을 실제 provider·실거래·실제 mint로 주장하는 문구가 0개다.
- 한·영 핵심 화면 잘림, visible dead CTA, console error, Critical/High 이슈가 0개다.
- typecheck와 production build가 통과하고 QA 2회 결과가 기록된다.

### 기능 동결

- 4시간 20분 이후 새 REQ나 화면을 시작하지 않는다. 5시간은 첫 integration 완료 시각이다.
- 7시간 55분 이후에는 Critical/High와 build blocker만 수정한다.
- 불안정한 Labs slice는 Hero를 위험하게 만들 경우 rollback한다.

## 9. 비범위

- 실제 CX·모바일 외국인등록증·Passport provider·OpenDID E2E
- 실제 zkLogin, Sui/OmniOne signer custody와 recovery
- 실제 USDC·USDT·OOKRW·AMM·bridge·mint·merchant settlement
- AMM simulation UI·quote·pool·liquidity
- 실제 실시간 채팅 서버와 사진 영구 저장
- 운영 가능한 신고·분쟁·reputation 시스템
- 전국 동일 밀도의 장소·ONDO 숫자
- 앱 내부 배달·택시·숙박·범용 관광 Super App

## 10. 실행 우선순위

1. shared types, fixture registry, state contract 동결
2. 온보딩 → Guest 지도 → 서울 장소 결정
3. Account·verification gate와 세 persona
4. After 19와 한 개 Table E2E
5. chat photo·feedback·reputation·stamp
6. Labs simulation
7. E2E·스크린샷·접근성·문구 진실성 QA

Hero가 미완료이면 Foundation과 Labs의 시각 polish를 중단한다.

상태 persistence·reset·one-shot `returnTo`의 유일한 source of truth는 [State Model](./04_STATE_MODEL.md)이다. 세 persona onboarding은 성공·skip·실패 모두 verification을 전제하지 않고 `SCR-MAP`에 도착해야 한다.
