# SLEEK-R5-RETRY · raw issue ledger

Reviewed tuple: Evidence `b0d25fe634d9d50a8668501f0fde5f641153168b` · Product `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` · Harness `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` · digest `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91`.

Reviewer verdict: `5/5 COMPLETE · 0/5 CLEAN · raw S0 0 · S1 0 · S2 11 · S3 1 · NOT CLEAN`.

아래 표는 독립 reviewer가 제출한 raw finding을 dedupe하지 않는다. `FIX IMPLEMENTED`는 current successor에 correction이 존재한다는 뜻이다. Current full automated gate is PASS, but old finding의 reviewer closure나 fresh clean credit를 뜻하지 않는다.

| Raw finding | Sev | Fingerprint / observed defect | Current implementation status |
|---|---:|---|---|
| `D1-R5R-DESKTOP-CANVAS-WIDTH-01` | S2 | B desktop canvas exceeds 430px; document/onboarding measures exceed frozen caps | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `D1-R5R-POINTER-FEEDBACK-01` | S3 | primary filled CTA idle/hover/pressed render identically | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `R5R-D2-001` | S2 | Back leaves the app; Forward cannot restore city/list/query/place/detail/focus context | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `D3-R5R-001` | S2 | nested duplicate `main` landmarks in My and Labs states | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `D3-R5R-002` | S2 | independent city-map controls collide at short landscape and 320px reflow | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `D4-R5R-001` | S2 | no visible scoped withdrawal/reset for session state or discovery choices | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `D4-R5R-002` | S2 | English singular reads `1 sourced food places` | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `R5R-D5-001` | S2 | browser history does not represent nested traveler navigation | `FIX IMPLEMENTED · same cause as R5R-D2-001 · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `R5R-D5-002` | S2 | offline mode lacks saved/fixture provenance and timestamp | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `R5R-D5-003` | S2 | expired 19+ proof silently turns After19 off without reason/recovery | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `R5R-D5-004` | S2 | desktop full place detail exceeds canonical reading width | `FIX IMPLEMENTED · same root as D1 width · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |
| `R5R-D5-005` | S2 | successful map retry leaves focus on `BODY` | `FIX IMPLEMENTED · FULL AUTOMATED GATE PASS · BLIND CLOSURE PENDING` |

Consolidation for implementation ownership is `9 objective S2 causes + 1 S3 polish cause`. Raw counts remain `S2 11 + S3 1` in every historical summary.

Current lifecycle: `FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`.
