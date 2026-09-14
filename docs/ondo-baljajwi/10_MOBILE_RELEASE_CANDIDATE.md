# ONDO / K-TOUR ID mobile release candidate trace

Status: `RELEASE SEALED · PUBLICLY PROMOTED · 2026-09-02`

This is the small living addendum for the mobile-first continuation after the
historical `cb4fcd3` evidence tuple. It does not rewrite, upgrade, or reuse any
historical review verdict. The frozen product and harness point is
`a6175b9c1e93436a7efd4caffc62d20105c2f4e1`; any later product or harness
change requires the affected checks below to run again.

## Product narrative

ONDO remains an explore-first food and travel map. K-TOUR ID is not a detached
onboarding demo: it appears only when a guest chooses to save, join a Table,
submit a Local Signal, use an age-limited surface, or pay for a place benefit.
Each gate keeps one bounded return envelope and returns to the exact place,
Table, draft, or checkout action. Choosing a travel intent during onboarding
does not silently infer or start an identity route.

The hackathon proposal's three identity inputs still converge into one private
service credential and travel-wallet journey:

- Korean resident: Mobile ID / OmniOne CX route.
- Registered foreign resident: Mobile Residence Card route, with an explicit
  unsupported state and passport alternative.
- Short-term visitor: passport OCR / NFC, face and liveness provider route.

The frontend is deliberately honest about the current boundary. No identity,
OpenDID, bank, card, stablecoin network, merchant, or payment provider is
connected. Passport imagery is decoded only for the local walkthrough and no
passport fields, face image, DID, VC, or provider result is persisted. Customer
amounts lead with KRW and estimated USD; OOKRW, USDC, and USDT are confined to
user-opened technical or funding details.

## Canonical route and release surface

| Concern | Current contract | Evidence |
| --- | --- | --- |
| Canonical product | `/` mounts `OndoProductB` directly | `k-tour-id-app/app/page.tsx` |
| Compatibility URL | `/ondo-b` permanently redirects to `/`; only seven allowlisted discovery keys survive | `k-tour-id-app/app/ondo-b/page.tsx` |
| Branding | `K-TOUR ID | ONDO 溫圖`, K-TOUR icons and `/og-map-first.png` | root page metadata and `public/brand/*` |
| Public access | login-free review surface; `noindex` is indexing policy, not access control | root metadata and deployment smoke |
| QA boundary | failure injection is build-gated and must be absent from the release artifact | `NEXT_PUBLIC_ONDO_QA_CONTROLS=0` artifact scan |
| Device state | `ondo-b.*` schema names remain for compatibility; they are not public routes | provider, route contract, storage tests |

## Mobile connected-flow inventory

| # | Connected journey | Preserved decision and return contract | Current evidence |
| --- | --- | --- | --- |
| 1 | First run | Value -> intent -> food preferences -> the same guest Korea atlas; skip and storage recovery remain available | onboarding restoration, Arc direction, Wave 3 mobile visual tests |
| 2 | Korea atlas | Seoul, Busan, and Jeju share one geographic/temperature grammar; city focus enters the live map without focusing an editable control | atlas, map-truth, red-wave and visual-red contracts |
| 3 | City discovery | map-first loading/ready/fallback, search, category, location, Map/List, selection, and return from Place | map truth, production discovery, URL and focus tests |
| 4 | Japanese editorial | embedded story -> source, or one of eight verified Jeju editorial places; pending sources never become a Place action | Japan-first and Jeju editorial-loop tests |
| 5 | Place decision | compact peek -> detail -> Directions; Save is JIT Account-gated and returns once to the same official or editorial Place | canonical Place, Account Save, editorial save and restoration tests |
| 6 | K-TOUR ID setup | explicit Mobile ID, Residence Card, or passport eKYC choice -> consent -> local walkthrough -> private service credential state | OpenDID onboarding, K-TOUR setup, passport OCR and action-gate tests |
| 7 | After 19 | independent age proof; global and Table-local entry, cancel, failure, expiry, retry, manual-off and exact return | global After19, Place restoration, action-gate and mobile landscape tests |
| 8 | Tables | Table -> ordered Account/Person/Age gates -> join -> chat/media -> check-in/feedback; report/block/leave retain focus and state boundaries | Table, chat, social visual and restoration suites |
| 9 | Local Signal | Place draft/photo -> Account/Person gates -> durable local receipt -> exact Place and My Korea; public temperature is not mutated | Local Signal direction, ID restoration and My Korea tests |
| 10 | Travel wallet | Pass setup -> local travel balance, KRW bank, Apple Pay/card, or digital-dollar funding choice; only the local balance route can complete without a provider | wallet direction, commerce currency and mobile flow tests |
| 11 | Place checkout | meal benefit -> Account and Payment checks -> consent -> processing -> paid/failed/insufficient result -> exact Place return | stable-commerce, action-gate, checkout and Wave 3 flow tests |
| 12 | Refund | paid receipt -> explicit balance restoration -> paired zero-sum local ledger -> exact activity/Place return | wallet/refund reducer, persistence and receipt tests |
| 13 | My Korea | saved, recent, planned Table, Local Signal and paid/refunded objects form one device-local memory without invented routes | My Korea restoration, activity and memory-map tests |
| 14 | Settings | KO/EN/JA, preferences, setup reset, local-data clear failure/rollback and re-entry | Settings, localization, reset and mobile flow tests |
| 15 | Labs | optional technical evidence for OpenDID/asset/bridge/trait/badge hypotheses; never required for ordinary discovery | fidelity, Labs and truth-boundary tests |

## PRD and proposal integrity check

| Required product idea | Current disposition |
| --- | --- |
| Guest discovery before identity | Preserved. Map, search, Place and Directions do not require Account or KYC. |
| Three identity sources, one service journey | Preserved as explicit route choice; no persona is silently inferred from onboarding preferences. |
| OpenDID K-TOUR credential | Honest local product walkthrough only. Issuer, holder, status and provider integration remain external blockers. |
| Account / Person / 19+ / Payment independence | Preserved in separate state axes and ordered action plans. |
| Identity connected to food actions | Preserved through Save, Table, Local Signal and checkout JIT gates with exact object return. |
| KRW travel wallet for local/long-stay users | KRW bank funding is visible but unavailable until a provider connects; it is not falsely completed. |
| USDC/USDT route for visitors | Visible as a digital-dollar funding choice and technical detail; no exchange or asset movement is claimed. |
| Apple Pay/card route | Visible but provider-unavailable; it cannot produce a paid receipt. |
| Place-connected payment and refund | Preserved through meal-benefit entry, receipt, My Korea activity and exact Place return. |
| Privacy and chain boundary | Raw identity/payment data is not put on-chain; only a future normalized, non-PII event receipt belongs in the chain adapter. |
| KO/EN/JA mobile UX | Sealed on the frozen candidate across 320x720, 390x844, 430x932, 844x390 and desktop evidence. |

## Release closure

No frontend P0 or P1 remains open on the frozen candidate. Three independent
adversarial lanes reviewed the mobile product, visual evidence and release
boundary during the implementation waves. Findings were fixed and re-run at
the affected boundary instead of being deferred to one final audit.

The release guard now admits only GitHub owner `woogieboogie-jl`, authenticated
Vercel user `jaewook-9643`, and personal Vercel project `ondo`
(`prj_w5rckTz9B1DO55fvVRXjQRy9L5RM`). Organization scopes, protected historical
projects and every other project identity fail closed. The isolated Vercel
deployment `dpl_7U9QwtoSmV7kHMp1uppej3fwqR9v`
(`https://ondo-1kvvcujiq-jaewook-9643s-projects.vercel.app`) returned without
authentication and passed the complete external route, asset and API probe
before promotion. It was promoted at 2026-09-02 04:12 KST. The public share URL
is `https://ondo-k-tour-id.vercel.app`; the previously shared
`https://ondo-korea-pulse.vercel.app/ondo-b` remains a permanent compatibility
entry into the same deployment.

### External integration boundaries - not blockers for the honest frontend demo

- OmniOne CX / Mobile Residence Card provider and signed callbacks.
- Passport eKYC/NFC/face/liveness provider.
- OpenDID issuer, holder, verifier and status/revocation service.
- Bank, Apple Pay/card, stablecoin network, merchant and settlement providers.
- Production chain event receipt, legal/custody/AML and reconciliation policy.

## Release evidence checklist

- [x] Frozen product SHA recorded: `a6175b9c1e93436a7efd4caffc62d20105c2f4e1`.
- [x] Typecheck, 295-contract census and 17 focused packaging contracts green.
- [x] QA-enabled production build proves failure, retry, expiry and exact return.
- [x] QA-off isolated Next build admits five internal route-manifest entries and
      its artifact scan contains no QA controls or retired product routes.
- [x] B core 108/108, product-wide 390x844 reflow 15/15, A regression 22/22,
      current-reference visual 36/36 and production visual 124/124 are green.
- [x] 320x720, 390x844, 430x932, 844x390 and 200%-equivalent mobile decisions
      are visible, reachable and non-overlapping in KO/EN/JA.
- [x] Root `/`, `/ondo-b` redirect, metadata image/icons and public venue API
      passed the external candidate probe; 26 retired paths remained `404`.
- [x] Personal Vercel target passes the reconciled deploy guard; no organization
      scope is used.
- [x] The observed candidate URL returns without authentication.

## Documentation update rule

After the final SHA is frozen, update this addendum and the canonical-route
contract with observed release facts. Add a new evidence receipt for that SHA.
Do not edit old `evidence/RUN-*`, `SLEEK-*`, clean-round reviews, PNG digests, or
the `cb4fcd3` historical verdicts to make them look current.
