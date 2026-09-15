# K-Tour ID brand marks

The public service name is **K-Tour ID**. The map header, ID setup, wallet,
requester descriptions and sharing metadata use this name; ONDO and 溫圖
are retired public brand labels. Internal `ondo-*` filenames, event names,
storage keys and historical receipt IDs remain unchanged for compatibility.

The header uses `KTourIdMark` with a typographic K-Tour ID wordmark. The
K / location-pin / route silhouette follows the monochrome favicon master.
Use dark ink on light surfaces and white ink on dark surfaces; no gradient,
photography, status color or verification badge belongs inside the app logo.

## K-TOUR ID supplied mark

`ktour-id-mark.png` is the byte-for-byte transparent mark supplied in the
workspace `sources/` folder (SHA-256
`2f7467cb8efe5640489f8387e7b7f842b56b45a53619f61268b864fb9cd9b38d`).
The `-32`, `-64`, `-180`, `-192`, and `-512` files are historical size-only
PNG exports from that master. Preserve these supplied assets; new browser and
Apple icons use the monochrome variant below.

## K-TOUR ID monochrome app icon

`ktour-id-mono-v1.svg` is a code-native simplification of the supplied K,
location pin and route silhouette. The mark is white on a near-black rounded
tile, with no photo, gradient, status badge or verification claim. It remains
readable on light and dark browser chrome.

Browser metadata uses the SVG and 16/32/192 px PNG variants; Apple touch uses
the 180 px PNG. The 512 px PNG is retained for app-icon use. Render each size
directly from the SVG with `node scripts/brand/export-ktour-id-mono.mjs`.
The original colorful logo is deliberately not overwritten.

## Food-first sharing card

`../og-ktour-food-v2.png` is the active 1200×630 Open Graph and Twitter card.
K-TOUR ID is the lead brand; food, café and bar imagery describes the service.
The dishes are generated brand illustrations, not photographs of named venues
or evidence of visits. See `docs/branding/KTOUR_SOCIAL_REFRESH_2026-09-14.md`
for the original prompt, and `docs/branding/KTOUR_BRAND_UNIFICATION_2026-09-15.md`
for the imagegen edit removing the old endorsement. Versioned filenames separate
the new artwork from cached old link previews.

## Archived ONDO assets (not the current public brand)

The remaining guidance below documents the historical files retained in Git.
Do not introduce these assets into new K-Tour ID screens.

The ONDO mark is a three-facet open atlas with a waypoint cutout: a calm travel brand object, not a badge or status symbol. Its folded silhouette must remain recognisable without the wordmark and must never collapse into a letterform.

## Sizes

- Use the dedicated `ondo-mark-micro-16.svg`, `-20.svg`, or `-24.svg` at 16–24 px. Their facet gaps and waypoint cutout are tuned for interface sizes.
- Use `ondo-mark.svg` at 32 px and above. Use `ondo-mark-inverse.svg` on dark surfaces.
- Use `ondo-lockup.svg` inside the code-native `OndoBrandLockupB` where the full
  `ONDO · 溫圖` name has at least 144 CSS px of width.

## Clear space

Keep clear space equal to one quarter of the mark width on every side. Do not place notification dots, status dots, counters, rings, or selection outlines inside that space.

## Color and backgrounds

The primary is near-black `#191817`; inverse is warm white `#F8F7F4`. Do not recolor the mark to a success, warning, Pulse-temperature, identity, or payment color. Never add gradients, shadows, animation, or an external destination dot.

## Misuse guard

Never use the ONDO mark as an identity, eKYC, credential, age-proof, official-record, verified, government, payment, provider, or venue-acceptance seal. It must not imply that a traveler, place, payment, or source has been verified.

The micro mark may be exported as a favicon or app icon only from the dedicated 16/20/24 masters. Do not crop the 32+ mark, lockup, or an ImageGen concept board into an icon.
