# Mobile layout repair — 2026-09-10

## Deployment

- Preview: https://ondo-edaree1f6-jaewook-9643s-projects.vercel.app
- Vercel status: Ready; target: preview (no production alias changed).
- Deployment: `dpl_A9e7tzFoTUJtL2Tz2JYTsokSJVFk`.
- Application source: `a45400f`; subsequent edits to this report record verification only.

## Scope

- Phone city discovery now has a 44px navigation row and a separate 52px full-width search field (8px gap). It does not squeeze search under the city name.
- One localized Options sheet owns categories, camera perspective, location/privacy, city guides, discovery preferences, language and sample information. After 19 remains a single independent entry; it does not change the appearance preference.
- List mode has an opaque, bounded scroll surface and a separate Map footer. The last venue action and horizontally scrolling researched picks remain reachable without the map showing through the list edges.
- K-Tour ID's three progress markers are centered in equal tracks, including consent, provider handoff, holder delivery and sample result. The outer margins and both connectors are symmetric.
- Options/guide focus ownership is explicit. Returning from a guide restores the Options opener; switching to Options closes the guide. Interacting with Options during a tile failure preserves explicit list intent through late map recovery.

## Verification

Initial browser testing caught and fixed the guide's delayed focus restoration and inherited important CSS offsets; these were not treated as acceptable failures.

- Contracts: 775/775 passed. TypeScript: passed. Standalone Next build and client artifact scan: passed locally and on Vercel.
- Local staged Chromium: 20/20 layout, map recovery, appearance, identity and nation scenarios passed; 25/25 pre-visit/funding regressions passed.
- Public preview Chromium: 20/20 passed against the exact URL above (2.3 minutes), including the final sample-label contrast/size check. Evidence: `artifacts/qa/mobile-hierarchy-public/` and `mobile-hierarchy-public.log`.
- Independent Options audit: 390px dark/English and 320px light/Korean; zero serious/critical axe violations, 32 forward/backward keyboard steps contained within each dialog, Escape/opener restoration passed.
- Visual inspection: phone map headers, list top/bottom, Options and identity consent. A final scoped selector corrects the small sample label's inherited legacy color and size.
- Safari/WebKit could not launch in this environment (bundled runner exited with bus error 10/code 138 before navigation). No Safari checks passed or are claimed; the reproduction is in `artifacts/qa/mobile-webkit/README.md`.

Local evidence is under `k-tour-id-app/artifacts/qa/mobile-hierarchy-*`. Browser checks cover Korean, English and Japanese, 320/390/430px phones, wide/short layouts, light/dark × After 19, list boundaries, late tile recovery and K-Tour ID progress geometry. Separate regression coverage exercises pre-visit cards and all sample funding rails.

## Boundaries

This release changes presentation and navigation, not provider authority. OpenDID/OmniOne, payment and stablecoin paths remain clearly labeled mocks. No real verification, transfer, balance credit, restaurant reservation or production alias change is performed by this release.
