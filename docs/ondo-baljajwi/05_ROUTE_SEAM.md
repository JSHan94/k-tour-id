# ONDO B Real Route QA Seam

상태: `ACTIVE · R4 REVIEW COMPLETE NOT CLEAN · 12/12 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · R5 READY TO START · CLEAN 0/2 · NOT DEPLOYED`

R4가 검토한 tuple은 product `05f3002899485c528e31730bfebd57d71c3d788d`, harness `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4`, baseline digest `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d`다. 이 tuple은 자동 gate를 통과했지만 reviewer verdict는 `5/5 COMPLETE · NOT CLEAN`이었다. Frozen successor Product `9ec3d192…`, Harness/HEAD `12354bcf…`, digest `4cfbed3b…`에 `12/12 FIXED AND AUTOMATED`와 issue-scoped harness가 포함됐다. Exact-tuple automated gate는 통과했고 R5는 `READY TO START`; clean streak는 `0/2`, 새 sleek B는 `NOT DEPLOYED`다.

## 원칙

QA는 `/ondo-b`의 **actual product UI**만 조작한다. 제품에 테스트 전용 flow/checkpoint/action DOM을 넣지 않는다. 결정적 상태는 browser storage에 공개 fixture state만 seed하며, 테스트가 실제 버튼·sheet·dialog·state transition을 따라간다.

## 실제 route와 안정 selector

| 목적 | 실제 seam |
|---|---|
| B root | `/ondo-b`, `[data-testid="ondo-b-root"][data-variant="B"]` |
| B map | `[data-testid="ondo-b-map-entry"]`, `data-map-state` |
| City | `[data-city="seoul"]`, `[data-city="busan"]` |
| Canonical place | `?venueId=<public venue id>`, `canonical-place-peek/overlay` |
| Venue-scoped After19 return | `canonical-after19-access/unlock`; consumed gate restores exact `venueId` and expanded detail |
| Local save recovery | `?scenario=save-failed`; `canonical-save-error/retry/dismiss` preserves the same venue |
| Shared navigation | accessible `Main navigation` / `주요 메뉴` |
| Shared non-map | `tables-entry`, `ondo-my-entry`, `ondo-identity-entry` |
| JIT gate | `ondo-gate-overlay`, real accessible button names |
| Connect/commerce/Labs | 실제 `table-*`, `local-signal-*`, `checkout-*`, `labs-*` selector |

## Seed 경계

- local: `ondo.preferences.v3`
- session: `ondo.session.v3`
- feature session: `ondo.chat.v2`, `ondo.table-outcomes.v2`, `ondo.labs.v2`, `ondo.accepted-visits.v2`
- PII, credential 원문, 사진 blob, 사용자 위치는 seed/query/evidence에 넣지 않는다.
- public `venueId`와 documented failure query만 사용한다.
- success 증거는 seed한 terminal state가 아니라 실제 CTA transition으로 만든다.

## External map runtime 분류

- runtime guard가 설치되지 않았으면 clean evidence를 만들지 않는다.
- `pageerror`, unhandled rejection, product console error, first-party request failure와 HTTP `4xx/5xx`는 항상 product failure다.
- `tiles.openfreemap.org` request/console failure는 `externalMap`, 외부 font/CDN 실패는 `externalAsset` evidence로 분리한다.
- canonical flow suite의 tile abort는 기능 실패를 흉내 내기 위한 것이 아니라 외부 basemap SLA를 격리하기 위한 test seam이다. 실제 live/failure 경계는 dedicated product-browser suite에서 검증한다.
- 외부 장애를 무시하는 것으로 끝내지 않는다. B map이 `data-map-state=error`, usable venue list, `Retry map`을 실제로 보여야 한다.
- pixel run은 외부 vector basemap을 deterministic empty source로 대체한다. MapLibre canvas를 임의 색 mask하지 않으며 ONDO marker/cluster/label, legend/list/sheet/nav/truth copy를 모두 실제 raster에 남긴다.

## Modal isolation seam

- 동시에 노출된 modal dialog는 하나만 허용한다. Sheet 위의 확인 alert는 nested `aria-modal`로 중복 노출하지 않는다.
- modal이 열리면 일반 canvas/nav sibling은 `inert`와 `aria-hidden`으로 격리하고 닫힐 때 이전 값을 정확히 복구한다.
- 키보드 focus, Escape exit, trigger focus return을 실제 overlay에서 검증한다.

## Shared non-map mount proof

`/ondo-b`에서 실제 nav로 Tables, My Korea, ID에 진입하고, place에서 Local Signal/Checkout, My에서 Labs, After19에서 JIT gate를 연다. `/ondo` 테스트가 통과했다는 사실만으로 B mount를 증명하지 않는다.
