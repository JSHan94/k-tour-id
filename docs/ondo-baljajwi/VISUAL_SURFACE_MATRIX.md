# ONDO B · 발자취형 Surface Matrix

상태: `FINAL AUTOMATED GATES SEALED GREEN · BLIND REVIEW READY · CLEAN 0/2 · NOT DEPLOYED`

발자취의 고유 화면을 복제하지 않고 거의 흰 canvas, 큰 여백, hairline 구획, 절제된 점·기록 메타포, 한 개의 우세한 행동을 ONDO의 F&B heat/identity 흐름에 맞게 번역했다. Map, Place, App shell, Onboarding, Gate, Tables, Chat, Checkout, My, ID, Labs가 모두 같은 B 제품에 통합돼 있다.

| Flow | 정확한 의미 | 주요 B surface | 잠긴 경계 |
|---|---|---|---|
| `FL-001` | Guest Discover | Onboarding, Nation, City map/list/filtered map/fallback, Place | Guest 즉시 탐색, 실제 400과 simulated 80 분리; search/list/map/selection/legend 동기화 |
| `FL-002` | 19+ proof → After19 exact venue | Place locked teaser, Age Gate, unlocked detail | Person/Passport를 강제하지 않고 Age만 독립 확인 |
| `FL-003` | Table → image chat → feedback/report | Tables, Table, Chat, Media, Feedback, Report | confirmed member 전 chat 금지, 국적/성별 matching 없음 |
| `FL-004` | Checkout → receipt → separate visit → stamp | Checkout, My, Labs milestone | payment≠visit, simulated record truth |
| `FL-005` | Korean OmniOne CX | Person Gate CX route | 자동 실행 금지, 실제 CX 아님 |
| `FL-006` | Residence Card | Residence route, unsupported, passport alternate | documented credential와 provider 미구성 분리 |
| `FL-007` | Short-term onboarding | Value, Persona, Preferences, Guest map | KYC 선행 없음 |
| `FL-008` | Korean onboarding | Value, Korean persona, Preferences, Guest map | CX 자동 시작 없음 |
| `FL-009` | Resident onboarding | Value, Resident persona, Preferences, Guest map | Residence 자동 시작 없음 |
| `FL-010` | Account gate | Account pending/fail/retry/return | Account가 Person/KYC를 완료하지 않음 |
| `FL-011` | Save → My → same venue | Place save, failure, retry, My | Guest silent save 금지, venue context 보존 |
| `FL-012` | Local Signal first mission | Draft, photo, fail/retry, submitted | Visit+Contribution만, Meetup/stamp 불변 |
| `FL-013` | Manual 19+ proof | After19 control, Age Gate | Account/Person/Payment와 독립 |
| `FL-014` | Auto After19 | City layer, banner, expiry reason/recovery, setting | 4 guard + expiry + same-session manual-off 우선 |
| `FL-015` | Optional profile/reputation | Profile, four-axis Trust | explicit consent, 네 축 분리, 안전 점수 금지 |
| `FL-016` | Evidence/merchant trait | Place facts, Labs trait valid/stale/error | 특정 fact만, 안전·입장 전체 보증 금지 |
| `FL-017` | Payment KYC | Checkout Gate fail/retry/return | Age/Person과 독립, 실패 시 결제 없음 |
| `FL-018` | Labs hypotheses | Ack, signer/assets/bridge/trait/badge | SIMULATED/CONTRACT_ONLY/DEFERRED, AMM CTA 없음 |

## 상태별 시각 규칙

| 상태 | 원칙 |
|---|---|
| Success | 결과 문구·아이콘에만 의미색을 쓰고 surface 전체를 채우지 않는다. |
| Cancel | 중립 secondary로 두고 원 작업과 선택 맥락을 보존한다. |
| Failure | 오류 문구와 retry를 같은 viewport에 두며 44px target을 유지한다. |
| Pending | 열기색을 쓰지 않고 status text로 진행 상태를 설명한다. |
| Preview/Simulated | 12px 이상 truth copy와 execution label을 유지한다. |
| Unsupported | 대체 경로를 숨기지 않고 같은 정보 위계에 노출한다. |
| Unknown | 미확인 fact를 green/eligible/open으로 승격하지 않는다. |

## 현재 visual 검수 계약

- `50` visual case / `48` distinct state ID를 `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`에서 캡처한다. R5-RETRY reviewed baseline은 harness `ee19adb…`, digest `f1ec9b0c…`, 47/45/282였다. Current candidate는 Product `cb4fcd3…`, Harness/frozen candidate `cb4fcd3…`, digest `86ac058…`, `300 = 294 byte-identical c05 carries + 6 localized B-PX-FEEDBACK-KO refreshes`, 각 viewport `50`; authoritative receipt는 `300/300 + 144/144 + 20/20`, reporter `464/464`, anomaly `0`으로 SEALED GREEN이다.
- 126 flow checkpoint 각각은 machine registry에서 `pixel` 또는 사유 있는 `functional_only`로 연결한다.
- visible metadata 12px 이상, control 44×44 이상, horizontal overflow·nav/CTA overlap 0.
- serious/critical Axe issue 0; keyboard focus, Escape, focus return을 실제 surface에서 검사.
- 외부 vector tile만 deterministic empty source로 대체하고 ONDO marker·cluster·label·sheet·truth copy는 mask하지 않는다.
- heat score는 solid color circle, neutral cluster count는 outline geometry로 구분한다.
- near-white/hairline/negative-space 문법을 전체 surface에 적용하고 heat 이외 색은 status 의미에만 쓴다.

R5-RETRY reviewed tuple은 Product `30dcb13…`, Harness `ee19adb…`, digest `f1ec9b0c…`이고 verdict는 `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1`이었다. 후속 b68 CLEAN1은 `INCOMPLETE · NOT CLEAN · raw S0 0 / S1 1 / S2 5 / S3 0`, c05 CLEAN1은 Evidence `fcd4447…`에서 `5/5 COMPLETE · NOT CLEAN · raw S0 0 / S1 0 / S2 3 / S3 2`로 실패했다. 다음 `7c7b39d…` candidate는 canonical six-viewport pixels와 별개인 `844×390` EN rail collision 때문에 disqualified됐다. Current successor `cb4fcd3… / cb4fcd3… / 86ac058…`에는 c05 D3/D4 correction, complete return-gate safety guards, 그리고 이 short-landscape collision correction과 KO/EN matrix guard가 구현됐다. 여섯 exact width의 `B-PX-FEEDBACK-KO`만 `8:12 PM` → `오후 8:12` correction으로 바뀌며 `294`장은 c05와 byte-identical하고 cb4 correction은 PNG를 바꾸지 않는다. Exact gates는 SEALED GREEN이고 fresh blind review는 `READY`; clean streak `0/2`, 새 sleek B `NOT DEPLOYED`다.
