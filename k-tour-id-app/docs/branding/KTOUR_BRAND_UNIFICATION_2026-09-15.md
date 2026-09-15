# K-Tour ID public-brand unification — 2026-09-15

App source: `4464697` on `feat/sumsub-sandbox-onboarding-20260914`.
Verified Ready **Preview**: https://ondo-mi9i0eh8v-jaewook-9643s-projects.vercel.app
The existing Production and Harvey handoff branch were not changed.

## Public presentation

- The app name is **K-Tour ID**, not ONDO or ONDO 溫圖.
- The map header and ID setup share a monochrome K / location-pin / route mark,
  following the existing `public/brand/ktour-id-mono-v1.svg` favicon master.
  The shared inline mark inherits dark ink on light surfaces and light ink on
  dark surfaces. Original supplied colorful raster masters remain archived.
- Map heat is a feature, labelled “Place temperature” / “장소 온도” /
  “スポットのにぎわい”, not a second product brand.
- Browser metadata, share metadata and the active 1200×630 social card use only
  K-Tour ID. File version v2 separates the card from prior preview caches.

Internal `ondo` routes, environment variables, event and storage keys, fixture
issuers and historical operation/receipt identifiers are unchanged. This is a
presentation change, not a protocol or backend migration. Sumsub's own consent
organization (`ohayo.global`) is account-owned and was not relabelled.

## Social image

- Active asset: `public/og-ktour-food-v2.png`.
- Original: `public/og-ktour-food-v1.png`, retained as historical source.
- Edited with the built-in imagegen tool, using the original as edit target.
- The output is resized to its declared 1200×630 dimensions with
  `node scripts/brand/export-ktour-social.mjs <generated-png>`.
- Food imagery remains generated editorial illustration, not proof of any
  named venue, purchase, visit, or identity verification.

Exact imagegen prompt:

```text
Use case: text-localization. Asset type: existing K-Tour ID food discovery social sharing card, landscape 1200x630. Image 1 is the edit target. Make exactly one change: remove the small "by ONDO" text at the bottom left and restore the white subtly textured background behind it. Preserve the existing huge black K-TOUR ID headline, Food · Cafés · Bars subheading, every food/coffee/cocktail photo-like illustration, pink map signals, rounded photo panels, map lines, dimensions and all other composition unchanged. No new text, no new marks, no other changes.
```

## Review scope

Brand-specific contract and browser checks cover the public name, metadata,
monochrome icon paths, shared logo, fresh map-first entry and narrow light/dark
headers. No new KYC approval, credentials, payment or production authority is
introduced by this change.

Verified before Preview deployment: TypeScript; isolated Next build and client
boundary scan; HTTP artifact probe (41 public assets and 26 blocked paths);
50 targeted brand/identity/map source contracts; 2 packaging-brand contracts;
34 additional Sumsub/client-data/QA-boundary contracts; 10 branding browser
cases against the built app (mobile/desktop, light/dark, 320/390/1440 CSS px).
The browser cases assert zero application errors. Header screenshots are
branding evidence, not a new end-to-end KYC or live-map performance claim.

After the deployment reached Ready, 4 mobile branding browser cases passed
against the actual Preview (12.6 seconds, no retries, zero application errors),
and the remote HTTP probe passed the same 41 assets / 26 blocked-path checks.
Settled local screenshots also confirmed the hero, city labels and options;
earlier empty-map captures were taken before map projection settled.
