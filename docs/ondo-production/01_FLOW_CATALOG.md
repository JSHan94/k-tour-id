# ONDO B Production Flow Catalog

상태: `ACTIVE TRANSITION REGISTRY · PRODUCT ACCEPTANCE RED`

## 1. Active product flows

| ID | 이름 | 실제 사용자 결과 | 필수 증거 |
|---|---|---|---|
| `PR-FL-001` | First-run directory | 언어를 선택하고 계정 없이 서울/부산 공식 장소 디렉터리에 진입 | onboarding, locale, guest directory entry |
| `PR-FL-002` | Explore directory | 지도/목록을 전환하고 canonical 장소를 검색하며 결과 없음에서 회복 | map, list, search, empty results |
| `PR-FL-003` | Place and return | 출처가 있는 장소 사실을 보고 canonical 좌표로 directions를 열며 Back으로 맥락 복귀 | place peek/detail, directions, history return |
| `PR-FL-004` | Location and fallback | 실제 브라우저 위치 권한을 사용하거나 거부/지도 실패에도 전체 목록 유지 | location granted/denied, offline list fallback, retry |
| `PR-FL-005` | Device-local places | canonical 장소를 이 기기에 저장하고 선택적 비공개 메모를 reload 뒤 복원 | saved empty/item, private note, reload persistence |
| `PR-FL-006` | Settings and reset | 실제 기기 설정을 바꾸고 확인 후 ONDO B 기기 데이터만 초기화 | language setting, device boundary, reset confirm/result |

## 2. Explicitly retired flows

다음 기능은 설정된 실제 backend/provider/운영 계약이 없으므로 문구 변경이 아니라 `/ondo-b` import/runtime graph에서 제거한다.

- Account, Person, Age, Payment KYC와 모든 자동 성공 timer
- After 19 category/policy/gate/return flow
- Tables, join, chat, photo contribution, feedback, report, Local Signal
- checkout, OOKRW, receipt, settlement, payment success
- Labs, zkLogin, wallet, bridge, merchant trait, badge/NFT
- trust/reputation axes, seeded profile, visit stamps
- demo signals, heat score, confidence/sample/freshness score UI, legacy fixtures

외부 연동이 실제로 구성되기 전까지 이 항목들은 hidden/inert route로도 유지하지 않는다.

## 3. Pre-baseline visual census

이 20개 case는 구현 후 기능 검증이 끝났을 때 새 pixel harness가 수집할 최소 layout/state census다. 현재 PNG를 생성하거나 기존 prototype PNG에 연결하지 않는다.

| Case | Flow | Locale | State |
|---|---|---|---|
| `PR-PX-FIRST-RUN-EN` | `PR-FL-001` | EN | first run |
| `PR-PX-FIRST-RUN-KO` | `PR-FL-001` | KO | first run |
| `PR-PX-NATION-EN` | `PR-FL-001,002` | EN | nation directory |
| `PR-PX-CITY-MAP-EN` | `PR-FL-002` | EN | city map |
| `PR-PX-CITY-MAP-KO` | `PR-FL-002` | KO | city map |
| `PR-PX-CITY-LIST-EN` | `PR-FL-002` | EN | city list |
| `PR-PX-SEARCH-EN` | `PR-FL-002` | EN | search results |
| `PR-PX-SEARCH-EMPTY-KO` | `PR-FL-002` | KO | empty results |
| `PR-PX-PLACE-PEEK-EN` | `PR-FL-003` | EN | selected place peek |
| `PR-PX-PLACE-DETAIL-KO` | `PR-FL-003` | KO | sourced place detail |
| `PR-PX-HISTORY-RETURN-EN` | `PR-FL-003` | EN | Back return |
| `PR-PX-DIRECTIONS-EN` | `PR-FL-003` | EN | directions handoff |
| `PR-PX-LOCATION-READY-KO` | `PR-FL-004` | KO | location granted |
| `PR-PX-LOCATION-DENIED-EN` | `PR-FL-004` | EN | permission denied |
| `PR-PX-OFFLINE-FALLBACK-KO` | `PR-FL-004` | KO | map offline list fallback |
| `PR-PX-SAVED-EMPTY-EN` | `PR-FL-005` | EN | Saved empty |
| `PR-PX-SAVED-PLACE-KO` | `PR-FL-005` | KO | Saved item |
| `PR-PX-PRIVATE-NOTE-EN` | `PR-FL-005` | EN | device-private note |
| `PR-PX-SETTINGS-EN` | `PR-FL-006` | EN | Settings |
| `PR-PX-RESET-CONFIRM-KO` | `PR-FL-006` | KO | reset confirmation |

Viewport matrix와 pixel count는 product interface 및 functional acceptance가 GREEN인 tuple에서 별도로 고정한다. 20 cases를 기존 여섯 viewport에 적용할지는 그때 responsive risk를 근거로 결정하며, 이 문서는 아직 `20 × 6 = 120`을 final evidence로 주장하지 않는다.
