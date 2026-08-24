# ONDO B Production RED Receipt · f7eccf8

상태: `COMPLETE RED RECEIPT · NOT A RELEASE VERDICT`

| Field | Value |
|---|---|
| Product base | `f7eccf8c0219f01f0eb69a0ad17ca9e1083b21fb` |
| RED test commit | `08bc604` |
| Complete-inventory harness follow-up | `7ca120a` |
| Run date | `2026-08-24 KST` |
| Result | `4 total · 1 passed · 3 failed · 0 skipped · 0 flaky` |
| GREEN | `PROD-B-004` registry shape |
| RED | `PROD-B-001`, `PROD-B-002`, `PROD-B-003` |

## `PROD-B-001` inventory

금지 runtime module `21`개:

- After19 `3`
- commerce `3`
- connect/Tables `4`
- identity `3`
- Labs `3`
- rewards `1`
- trust `2`
- legacy map fixture `1`
- demo signals `1`
- 해당 cluster CSS가 위 counts에 포함됨

Exact paths:

```text
features/ondo/after19/after19-layer.tsx
features/ondo/after19/after19-venue-return.tsx
features/ondo/after19/after19.module.css
features/ondo/commerce/checkout-overlay.tsx
features/ondo/commerce/commerce-model.ts
features/ondo/commerce/commerce.module.css
features/ondo/connect/connect-overlays.tsx
features/ondo/connect/connect.module.css
features/ondo/connect/table-model.ts
features/ondo/connect/tables-entry.tsx
features/ondo/identity/gate-overlay.tsx
features/ondo/identity/identity-entry.tsx
features/ondo/identity/identity.module.css
features/ondo/labs/labs-entry.tsx
features/ondo/labs/labs-model.ts
features/ondo/labs/labs.module.css
features/ondo/rewards/reward-model.ts
features/ondo/trust/trust-panel.tsx
features/ondo/trust/trust.module.css
lib/ondo/map/fixtures.ts
lib/ondo/venues/demo-signals.ts
```

## `PROD-B-002` inventory

- query injection seams: `6 files`
- `sessionStorage`: `4 files`
- legacy storage key owners: `4 files`
- non-production storage keys: `6 exact keys`

Query injection files:

```text
features/ondo/commerce/checkout-overlay.tsx
features/ondo/connect/connect-overlays.tsx
features/ondo/identity/gate-overlay.tsx
features/ondo/labs/labs-entry.tsx
features/ondo/place/canonical-place-overlay.tsx
features/ondo/shared/ui/use-qa-controls.ts
```

Legacy/session storage files:

```text
features/ondo/connect/connect-overlays.tsx
features/ondo/labs/labs-entry.tsx
features/ondo/rewards/reward-model.ts
features/ondo/shared/state/ondo-provider.tsx
```

Keys: `ondo.chat.v2`, `ondo.table-outcomes.v2`, `ondo.labs.v2`, `ondo.accepted-visits.v2`, `ondo.preferences.v3`, `ondo.session.v3`.

## `PROD-B-003` inventory

중복 literal을 `file + banned-pattern`으로 합친 결과는 `85 hits / 23 files`다.

| Pattern group | Unique file-pattern hits |
|---|---:|
| simulation EN | 19 |
| demo EN | 8 |
| fixture EN | 8 |
| hypothesis EN | 6 |
| After 19 | 5 |
| OOKRW | 5 |
| checkout | 8 |
| Payment KYC | 4 |
| local preview | 5 |
| visit stamps | 2 |
| test token | 1 |
| KO banned-copy group | 14 |
| Total | 85 |

이 receipt는 production rewrite 전 문제를 고정한 RED 증거다. 이후 GREEN 실행이 이 수치를 대체하더라도 삭제하거나 성공 증거로 재해석하지 않는다.
