# ONDO B Production Acceptance and Migration

상태: `RED-FIRST CONTRACT ACTIVE`

## 1. Executable gates

| Gate | 합격 조건 |
|---|---|
| `PROD-B-001` | `features/ondo/app/ondo-product-b.tsx`에서 시작한 local import graph에 identity/connect/commerce/After19/Labs/rewards/trust, fixture, demo-signals와 retired cluster symbol이 0개 |
| `PROD-B-002` | reachable graph의 `scenario`, `qa`, `qaCase` query injection seam 0개; `sessionStorage` 0개; legacy keys 0개; production storage key는 `ondo-b.device.v1`만 존재 |
| `PROD-B-003` | reachable JS/TS string literals의 demo/simulation/fixture/mock/hypothesis/test-token 및 retired fake-success copy 0개 |
| `PROD-B-004` | active registry가 `PR-FL-001..006` exact 6 flows, unique 20 pre-baseline cases이며 retired product concept 0개 |

실행:

```sh
cd k-tour-id-app
pnpm exec playwright test --config=playwright.contracts.config.ts tests/contracts/ondo-b-production-acceptance.spec.ts
```

## 2. Production injection boundary

Production UI/state를 재현하기 위해 URL이나 persisted product state에 failure token을 넣지 않는다.

- 허용 URL state: city, map/list view, search query, canonical venue ID, detail/history restoration.
- 금지 URL state: `scenario`, `qa`, `qaCase` 및 save/payment/table/gate/Labs 성공·실패를 만드는 모든 token.
- network/offline 검증: Playwright request interception 또는 실제 transport failure로 수행.
- location granted/denied 검증: browser context permission/geolocation API로 수행.
- 저장 실패 검증: production UI에 hidden scenario를 두지 않고 storage adapter의 명시적 test seam 또는 browser storage exception으로 수행.
- onboarding/reset 등 실제 상태는 사용자가 직접 실행할 수 있는 UI와 `ondo-b.device.v1` allowlist로만 전이.

## 3. Device storage allowlist

`ondo-b.device.v1`에 허용하는 값은 다음뿐이다.

- `locale`
- onboarding 완료 여부와 실제 directory preference
- canonical dataset에 존재하는 saved venue IDs
- saved venue별 선택적 private note

Account/person/age/payment status, profile/persona fixture, stamps/trust/reputation, table/chat/report, Labs/wallet/bridge, test outcome, QA flag는 저장·마이그레이션하지 않는다. 이전 storage에서 가져올 수 있는 값도 locale과 canonical-valid saved IDs뿐이며, 나머지는 폐기한다.

## 4. Migration order

1. RED production acceptance를 현재 prototype tuple에서 확정한다.
2. `/ondo-b` mount/import graph를 Explore/Saved/Settings와 canonical place 기능으로 축소한다.
3. canonical directory에서 demo signals, synthetic score/heat/confidence/sample/After19 policy를 제거한다.
4. `ondo-b.device.v1` allowlist와 실제 저장 완료 후 success UI를 구현한다.
5. `PROD-B-001..004`를 GREEN으로 만들고 전체 type/build/contracts/A regression을 실행한다.
6. 실제 6-flow functional/a11y/responsive harness를 고정한다.
7. 그 뒤에만 새 PNG registry/baseline과 evidence manifest를 만든다.
8. final Product/Harness/Evidence/digest tuple에서 fresh independent CLEAN1, CLEAN2를 수행한다.

각 단계에서 prototype frozen evidence를 수정하지 않는다. 새 tuple의 current 문서는 `docs/ondo-production` 아래에서만 진화한다.
