# ONDO B · UX/UI Component & State Matrix

상태: `BASELINE INVENTORIED · EXPANSION REQUIRED`

## 1. Current exact inventory

| Item | Count |
|---|---:|
| B route | `1` |
| Tab roots | `4` — ONDO, My Korea, Tables, ID |
| Reducer surface kinds | `7` — map, venue, table, chat, local_signal, checkout, labs |
| B content surface families | `14` |
| B product TSX files | `21` |
| Feature directories | `17` |
| Flow | `18` |
| Current visual cases | `44` |
| Distinct visual state IDs | `42` |
| Current snapshots | `88` — mobile 44 + desktop 44 |
| Current locale mix | `EN 28 / KO 16` |

## 2. Family coverage baseline

| Family | Source | Current case | Sleek review expansion |
|---|---|---:|---|
| Shell/nav | `features/ondo/app/*` | `0` independent | nav states, toast, focus, scroll, safe area |
| Onboarding | `onboarding/*` | `3` | three personas, fallback, KO/EN parity, short height |
| Nation/City | `map/map-entry-b.tsx` | `6` | Busan, search empty, preference panel, zoom tiers, 360/430 |
| Place/Save | `place/canonical-place-*` | `6` | loading/error/UNKNOWN/KO detail and action density |
| JIT gates | `identity/gate-overlay.tsx` | `7` | idle/pending/success/cancel/return and locale parity |
| Tables/chat | `connect/*` | `7` | full/requesting/join success/chat locked/send fail/image success/leave |
| Local Signal/photo | `connect/*`, `media/*` | `3` | preview/uploading/remove/duplicate |
| Checkout/stamp | `commerce/*` | `5` | confirming/processing and locale parity |
| My Korea | `my/*` | `1` | empty/pre-milestone/saved/KO |
| ID/Profile/Trust | `identity/*`, `profile/*`, `trust/*` | `2`, ID root `0` | ID root, partial consent, save fail/retry, low-axis states |
| Global After19 | `after19/*` | venue cases only | prompt, auto banner, manual-off, setting off, expiry |
| Labs | `labs/*` | `4` | wallet/quote/confirm/cancel/expired/mismatch/badge states |

## 3. Canonical registry row

한 개의 machine-readable source registry에서 browser, pixel spec, 문서 표를 생성한다.

```ts
type SleekVisualCase = {
  caseId: `B-SLK-${string}`
  familyId: string
  surfaceKind: string
  componentPath: string
  selector: string
  flowIds: readonly string[]
  checkpointIds: readonly string[]
  stateId: string
  stateClass: "idle" | "empty" | "pending" | "success" | "error" | "cancel" | "locked" | "unsupported"
  locale: "ko" | "en"
  viewportId: "360x740" | "390x844" | "430x932" | "768x1024" | "801x1000" | "1440x1000"
  setupFixture: string
  truthAssertions: readonly string[]
  geometryProfile: string
  pixelRequired: boolean
  a11yRequired: boolean
  closeReturnInvariant?: string
  riskTags: readonly string[]
  disposition: "covered" | "gap" | "n/a"
  reason?: string
}
```

## 4. Registry gates

1. visible family마다 mobile/desktop baseline이 있어야 한다.
2. text-heavy family는 KO/EN을 모두 가진다.
3. 명시적 상태는 visual case 또는 사유 있는 N/A를 가진다.
4. 각 Flow checkpoint는 interaction/visual evidence 또는 nonvisual 사유와 연결된다.
5. `360×740`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` breakpoint registry를 관리한다.
6. orphan ID, duplicate ID, unregistered visible component, stale snapshot count는 CI failure다.

기존 `B_PIXEL_CASES`와 `B_VISUAL_CASES` 이중 registry는 새 canonical registry로 통합한다. 전환 전까지 현재 88장은 baseline comparison 자료이며 whole-product completeness 증명으로 단독 사용하지 않는다.
