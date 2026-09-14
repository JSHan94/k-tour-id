# Product simplicity sign-off · FL-007~012 + Settings/Overview

상태: `D1 ADVERSARIAL PEER REVIEW · SPEC P0/P1 CLOSED`

검토 범위는 [FL-007](../FL-007_SHORT_TERM_ONBOARDING.md)부터
[FL-012](../FL-012_LOCAL_SIGNAL.md), [X-02 Settings](../X-02_SETTINGS_DEVICE_DATA.md),
[00 Overview](../00_OVERVIEW.md)다. 제품 구현 코드는 변경하지 않았다. 이 판정은
구현 명세의 제품 단순성·IA·UX writing sign-off이며 실제 화면 QA sign-off가 아니다.

## 1. 판정 기준

- [합의 정본](./CONSENSUS_RESOLUTION.md)의 one screen/one decision, map-first,
  guest-first, JIT gate, exact return을 우선했다.
- [PRD 보존 원장](../00_PRD_PRESERVATION_LEDGER.md)의 기능·상태·실패·retry·truth를
  줄이지 않았다.
- canonical [PRD](../../ondo-execution/01_PRD_9H.md),
  [Flow Catalog](../../ondo-execution/03_FLOW_CATALOG.md),
  [State Model](../../ondo-execution/04_STATE_MODEL.md)의 REQ, fixture, state,
  `ReturnToEnvelope` allowlist를 대조했다.
- visible mobile UI는 결정, 정확한 truth, recovery, consent만 말한다. provider,
  fixture, storage key, architecture와 제작자 설명은 folded detail/Labs/문서로 보낸다.
- 320/360/390/430 portrait, 844×390, 200% zoom, KO/EN/JA, 최소 44px target을
  acceptance에 유지했다.

## 2. 발견·수정 결과

| 파일 | 발견 심각도 | 공격적 검토 결과와 적용한 수정 | 최종 판정 |
|---|---:|---|---|
| [FL-007](../FL-007_SHORT_TERM_ONBOARDING.md) | P1 | language/value와 intent가 연속 주 결정으로 중복되고 질문과 세 intent가 불일치했다. locale을 즉시 적용되는 header utility로 낮추고 value+intent를 한 질문으로 합쳤다. `시작하기` 중간 단계를 삭제하고 intent→taste로 이어지며 title을 세 intent와 맞췄다. | 승인 |
| [FL-008](../FL-008_KOREAN_LOCAL_ONBOARDING.md) | P1 | language, intent, area+preference가 세 단계처럼 쓰였지만 실제로는 네 질문이고 Area/Preference가 첫 viewport에 겹쳤다. locale utility→intent→area→taste의 최대 세 주 결정으로 고정하고 같은 sheet의 B1/B2 body로 분리했다. CTA가 다음 질문을 정확히 말하게 수정했다. historical optional Account는 첫 protected action의 FL-010으로 위치만 옮긴다고 명시했다. | 승인 |
| [FL-009](../FL-009_RESIDENT_ONBOARDING.md) | P1 | FL-008과 같은 과밀·단계 불일치가 있었고 `PER-RESIDENT-LONG`이 proof state처럼 읽힐 여지가 있었다. intent→area→taste를 순차 body로 나누고 `personaId` recommendation context로 명시했다. optional Account와 later Residence/Passport 기능 보존도 잠갔다. | 승인 |
| [FL-010](../FL-010_ACCOUNT_GATE.md) | P0/P1 | Account gate가 checkout을 `결제 계속`으로 말해 FL-004의 local balance-use truth보다 큰 결과를 약속했고, reload로 private context가 사라진 경우 exact return을 과장할 여지가 있었다. `여행 잔액 사용`과 venue/final KRW consequence로 맞추고, context loss는 registered public object/safe map으로 mutation 0 복귀하게 했다. Account fixture ID도 canonical 이름으로 펼쳤다. | 승인 |
| [FL-011](../FL-011_SAVE_MY_KOREA.md) | P1 | bookmark tap 뒤 Account 성공 후 다시 `저장할까`를 묻는 두 번째 decision으로 읽혔다. 첫 tap을 유일한 Save decision으로 두고 Account 성공은 별도 확인 없이 원 bookmark action을 자동 재개하게 했다. Save/Account fixture를 canonical 이름으로 펼쳤다. | 승인 |
| [FL-012](../FL-012_LOCAL_SIGNAL.md) | **P0** | canonical envelope에 없는 opaque draft reference를 복귀 계약에 추가하고 있었다. 비표준 field를 전부 제거하고 raw draft/photo는 originating task memory가 소유하며 registered `venueId`만 envelope에 남긴다. reload로 memory가 사라지면 token을 지우고 venue로 mutation 0 안전 복귀한다. canonical photo fixture 이름도 정정했다. | 승인 |
| [X-02](../X-02_SETTINGS_DEVICE_DATA.md) | P1 | Settings root가 현재 locale 대신 세 언어 전체와 storage scope를 반복 표시했고 row target·KO/EN/JA 핵심 카피가 덜 잠겨 있었다. root에는 현재 locale 하나와 저장된 범주 수만, 전체 언어 선택지는 compact sheet만 사용하게 했다. 48px 기본/44px 최소 target과 핵심 카피 3개 언어를 추가했다. `이 기기에만 저장`은 data detail에서 정확한 scope로 한 번만 유지했다. | 승인 |
| [00 Overview](../00_OVERVIEW.md) | P1 | Account가 K-Tour ID 하위 state처럼 보이는 IA와 onboarding preview 중복 단계가 남아 있었다. Account/Person/Age/Payment/K-Tour credential을 독립 확인 layer로 다시 그렸고 locale utility→intent→optional area→taste의 합의 sequence로 맞췄다. | 승인 |

## 3. 기능·truth 보존 확인

| 위험 | 최종 잠금 |
|---|---|
| onboarding intent로 identity 추론 | `한국 여행 / 내 주변 탐색 / 한국에서 생활`은 `personaId` recommendation context뿐이며 Account·Person·Age·Payment를 바꾸지 않는다. |
| 취향의 무효 약속 | taste는 match keyline/list order만 바꾼다. ONDO heat, source, eligibility, 식이 지원 fact는 불변이다. |
| optional Account 삭제 | onboarding prompt에서 첫 protected action의 FL-010 JIT로 위치만 옮긴다. Account capability와 실패·retry·exact return은 남는다. |
| maker/demo copy 노출 | normal title/CTA에 `preview/simulated/test/on-device/provider/minimum check`를 두지 않는다. 실제 consequence와 unavailable/recovery는 숨기지 않는다. |
| Save와 Account 합치기 | Account success와 bookmark mutation은 별도 state/event이며 Save는 one-shot으로 한 번만 실행한다. |
| payment 과장 | Account sheet는 `여행 잔액 사용`을 말하며 paid/order/bank movement를 약속하지 않는다. |
| Local Signal draft 위조 | envelope에는 allowlisted public IDs만 둔다. raw draft/photo는 memory-only이고 memory loss는 venue safe return·mutation 0이다. |
| 새 Flow 생성 | 추가 Flow 없음. onboarding body 상태, FL-010 shared gate, existing Settings disclosure만 사용한다. |

## 4. canonical mapping

| Flow | canonical REQ |
|---|---|
| FL-007 | `REQ-003`, `REQ-005`, `REQ-018` |
| FL-008 | `REQ-001`, `REQ-005`, `REQ-018` |
| FL-009 | `REQ-002`, `REQ-005`, `REQ-018` |
| FL-010 | `REQ-005`, `REQ-008`, `REQ-011` |
| FL-011 | `REQ-005`, `REQ-016` |
| FL-012 | `REQ-003`, `REQ-007`, `REQ-009`, `REQ-015` |

각 Flow의 `ENTRY / DECISION / CANCEL / ERROR / RETRY / TERMINAL / RETURN`,
one-shot consume, invalid/expired safe return, state-axis mutation allowlist를 확인했다.
`SAVE_VENUE`와 `SUBMIT_LOCAL_SIGNAL`은 canonical CTA registry 밖 값을 만들지 않는다.

## 5. 구조·링크·문서 검사

- FL-007, FL-008, FL-009, FL-010, FL-011, FL-012: 각각 numbered section
  **12/12**.
- X-02: numbered section **12/12**. Overview는 의도된 overview 구조 **14개**.
- 선택 범위의 상대 `.md` link **27개**, broken **0개**.
- 미완성 placeholder·conflict marker·trailing whitespace: **0개**.
- `git diff --no-index --check /dev/null <file>`을 각 8개 파일에 실행:
  whitespace error **0개**.
- 모든 Flow에 KO/EN/JA copy table, 320/360/390/430/844×390, 200% zoom,
  reduced-motion acceptance가 남아 있다.

## 6. 잔여 판정

- actionable spec P0: **0**
- actionable spec P1: **0**
- 구현 후 반드시 다시 검증할 항목: first viewport 실측, sticky/safe-area overlap,
  44px target, KO/EN/JA 장문 reflow, actual map continuity, exact focus/scroll restore,
  normal provider-unavailable와 explicit review fixture 분리.

결론: 이 범위는 제품 단순성 관점에서 구현 단계로 넘길 수 있다. 실제 구현이 이
명세를 충족한다는 뜻은 아니며, screenshot·state-diff·failure-first 증거 없이
production sign-off로 승격하지 않는다.
