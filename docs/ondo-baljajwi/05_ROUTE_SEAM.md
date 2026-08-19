# ONDO B Real Route QA Seam

상태: `ACTIVE AT PRODUCT SHA 7e36de2`

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

- `pageerror`, unhandled rejection, product console error는 항상 product failure다.
- `tiles.openfreemap.org` request/console failure는 `externalMap`, Google Fonts CDN 실패는 `externalAsset` evidence로 분리한다.
- canonical flow suite의 tile abort는 기능 실패를 흉내 내기 위한 것이 아니라 외부 basemap SLA를 격리하기 위한 test seam이다. 실제 live/failure 경계는 dedicated product-browser suite에서 검증한다.
- 외부 장애를 무시하는 것으로 끝내지 않는다. B map이 `data-map-state=error`, usable venue list, `Retry map`을 실제로 보여야 한다.
- 정상 map pixel은 외부 tile 변동 때문에 전면 baseline으로 승인하지 않는다. layout screenshot에서는 MapLibre canvas만 명시 mask하고 marker/legend/list/sheet/nav는 mask하지 않는다.

## Shared non-map mount proof

`/ondo-b`에서 실제 nav로 Tables, My Korea, ID에 진입하고, place에서 Local Signal/Checkout, My에서 Labs, After19에서 JIT gate를 연다. `/ondo` 테스트가 통과했다는 사실만으로 B mount를 증명하지 않는다.
