# Wave 3 · My Korea sign-off

Status: `AUTHOR + ADVERSARIAL SIGN-OFF COMPLETE · CROSS-WAVE RELEASE QA PENDING · 2026-09-05`

## Scope

This slice closes the mobile My Korea memory surface from `FL-011`: truthful
official/editorial media, saved-place removal, empty/populated memory states,
and the exact My Korea ↔ canonical Place round trip. It reuses the existing
Explore map and Place overlays; it does not create a parallel place-detail
flow or remove planned Tables, recent places, receipts, contributions, profile,
or Labs access.

## Closed product findings

| Finding | Resolution |
|---|---|
| Saved/recent rows looked like text administration | One shared photo-led memory card presenter now serves official and Jeju editorial places. Category artwork is labelled as illustration and never claims to be an exact venue photo. |
| Empty My Korea lost the map | The memory map remains the first object and the empty state exposes one Explore action; empty administrative lanes stay hidden. |
| Unsave could destroy a private note | Membership and private-note persistence are independent. Failed writes roll back exactly; re-saving reveals the byte-identical note. |
| Removal sheet could clip on short/mobile layouts | One internal scroll owner, fixed actions, safe-area spacing, exact next-row/heading focus, and 844×390/200% coverage are enforced. |
| Saved rows opened a disconnected detail flow | Official and editorial rows enter the canonical map at Place peek, then reuse its detail layer. |
| Back/Close/Escape lost My scroll or focus | A navigation-only receipt restores the exact saved section, bounded scroll offset, and source-specific opener. Detail Back returns to peek; Close/Escape unwind to the exact My origin. |
| Retired MapLibre movement overwrote the My origin | A late `moveend` from an unmounted map is ignored unless the current canonical city entry still belongs to that map. |
| Explicit tab abandonment could resurrect via Forward | The origin is sanitized and its forward Place children are pruned. Push failure restores the origin and the shell fails closed. |
| Official/editorial focus behavior diverged | Both detail Back paths focus the concrete Details opener; peek return focuses the exact saved card. |
| A valid venue could be paired with the wrong city | My entry validates the canonical venue/city pair before any history mutation. |
| Origin reload could flash Explore first | Initial receipt application runs in the layout phase before paint. |

## Preserved truth and boundaries

- The receipt contains only version, journey ID, phase, saved section, bounded
  scroll, source kind, and one allowlisted place ID. It contains no locale,
  query, note, identity, account, age, payment, gate, or media data.
- Official directory and Jeju editorial namespaces remain distinct.
- Unrelated Next/browser history state is shallow-preserved by identity.
- Malformed, private, cross-namespace, or mismatched receipts fall back to the
  canonical Explore entry and are removed.
- Explicit dock navigation abandons only this My journey. Normal Explore
  detail Escape continues to return to peek.
- Save membership is the only unsave mutation; reputation, visits, stamps,
  Tables, receipts, and private notes remain unchanged.

## Verification

- My memory mobile browser matrix: `8/8` passing across EN/KO/JA, 320/390,
  empty/populated, deterministic media crop/reload/CLS, image failures, and
  844×390 JA at 200%.
- Exact return browser matrix: `5/5` passing for official portrait, Jeju
  editorial landscape, Back/Close/Escape/Forward/reload, malformed fallback,
  explicit abandonment, and unchanged legacy A behavior.
- Exact return contracts: `15/15` passing, including forward pruning and
  History push-failure rollback.
- My/media/removal contracts and Jeju namespace contracts passed in the
  focused contract lane.
- Non-author adversarial re-review: no remaining P0/P1 in this slice.

## Release boundary

My Korea is signed off as a slice. Final release still requires the Wave 3
Local Signal and Settings implementations, their mobile browser matrices, and
the final cross-flow production build/deployment audit.
