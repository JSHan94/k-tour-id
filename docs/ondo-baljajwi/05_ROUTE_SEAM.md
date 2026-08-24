# ONDO B Real Route QA Seam

상태: `ACTIVE · FINAL AUTOMATED GATES SEALED GREEN · BLIND REVIEW READY · CLEAN 0/2 · NOT DEPLOYED`

R5-RETRY가 검토한 tuple은 evidence `b0d25fe…`, Product `30dcb136…`, Harness `ee19adb…`, digest `f1ec9b0c…`이며 verdict는 `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1`이었다. 후속 b68 CLEAN1은 `INCOMPLETE · NOT CLEAN · raw S0 0 / S1 1 / S2 5 / S3 0`, c05 CLEAN1은 Evidence `fcd4447…`에서 `5/5 COMPLETE · NOT CLEAN · raw S0 0 / S1 0 / S2 3 / S3 2`로 실패했다. `7c7b39d…` automated candidate도 `844×390` EN rail collision으로 disqualified됐다. Current successor는 이를 고친 Product/Harness `cb4fcd3…`, digest `86ac058…`, `50/48/300`, `123 ACTUAL / 3 N/A / 0 GAP`다. Exact nonpixel과 visual gates는 SEALED GREEN, blind review는 READY, clean streak는 `0/2`다.

## 원칙

QA는 `/ondo-b`의 **actual product UI**만 조작한다. 제품에 테스트 전용 flow/checkpoint/action DOM을 넣지 않는다. 결정적 상태는 browser storage에 공개 fixture state만 seed하며, 테스트가 실제 버튼·sheet·dialog·state transition을 따라간다.

## 실제 route와 안정 selector

| 목적 | 실제 seam |
|---|---|
| B root | `/ondo-b`, `[data-testid="ondo-b-root"][data-variant="B"]` |
| B map | `[data-testid="ondo-b-map-entry"]`, `data-map-state` |
| City | `[data-city="seoul"]`, `[data-city="busan"]` |
| Filtered map synchronization | non-empty search → Map / place close keeps the filtered marker, rendered/source signal counts, selection and filtered legend aligned |
| Discovery history | URL exposes sanitized `city/view/venueId/detail`; namespaced history state retains transient query/heat/focus; Back/Forward unwinds detail → peek → exact city context → nation. B-owned traversal is intercepted before framework navigation, so list/marker peek and Back/Forward stay in the hydrated document while offline; invalid, non-B, and other-path events remain unowned. |
| Canonical place | `?venueId=<public venue id>`, `canonical-place-peek/overlay`; direct entry and Forward restore peek/detail level |
| Venue-scoped After19 return | `canonical-after19-access/unlock`; consumed gate restores exact `venueId` and expanded detail |
| Local save recovery | `?scenario=save-failed`; `canonical-save-error/retry/dismiss` preserves the same venue |
| My saved return | FL-011 closes the mounted detail before actual My navigation; a trusted saved row opens canonical city→peek history. Nation/other-city/detail origins unwind deterministically, Back/Forward/reload restore venue and opener focus, and untrusted/private IDs never enter URL/history. |
| Shared navigation | accessible `Main navigation` / `주요 메뉴` |
| Shared non-map | `tables-entry`, `ondo-my-entry`, `ondo-identity-entry` |
| Scoped reset | `session-reset-open/confirm` clears proven session partitions; `discovery-reset-open/confirm` clears only discovery choices; both have confirmation, status and reload proof |
| Resilience status | `ondo-b-offline-status`, `ondo-b-map-fallback-status`, `after19-expiry-notice` expose provenance/reason/timestamp/recovery. The offline status uses safe responsive slots and does not participate in pointer hit-testing, so zoom and independent map controls remain reachable. |
| JIT gate | `ondo-gate-overlay`, real accessible button names |
| Connect/commerce/Labs | 실제 `table-*`, `local-signal-*`, `checkout-*`, `labs-*` selector |

## Seed 경계

- local: `ondo.preferences.v3`
- session: `ondo.session.v3`
- feature session: `ondo.chat.v2`, `ondo.table-outcomes.v2`, `ondo.labs.v2`, `ondo.accepted-visits.v2`
- discovery URL에는 public city/view/venue/detail만 둔다. query/heat/focus token은 namespaced `history.state`에만 두며 reload에서 transient context를 지운다.
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
- Gate의 delayed trigger-focus timer는 discovery traversal이 canonical target을 복원하면 무효화돼야 하며, traversal focus를 다시 빼앗을 수 없다.

## Shared non-map mount proof

`/ondo-b`에서 실제 nav로 Tables, My Korea, ID에 진입하고, place에서 Local Signal/Checkout, My에서 Labs, After19에서 JIT gate를 연다. `/ondo` 테스트가 통과했다는 사실만으로 B mount를 증명하지 않는다.
