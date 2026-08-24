# ONDO B production transformation

Status: PRODUCT BOUNDARY SEALED AT `4ec64b3` · STANDALONE GATES PASS

## 1. Artifact boundary

The transformation builds a standalone Sites source tree from the explicit
allowlist in `k-tour-id-app/scripts/ondo-b-standalone/policy.mjs`; it does not
package the repository's full application.

| Standalone route | Purpose |
|---|---|
| `/` | Redirect to `/ondo-b` |
| `/ondo-b` | Official food-place directory |
| `/api/ondo/venues/:venueId` | Canonical venue-detail lookup |

The authoritative receipt records 4 route source files, the three emitted route
patterns above, 26 named blocked-route probes returning 404, and 7 required
asset probes returning 200. The sealed build contains 29 files totaling
7,133,962 bytes: 14 JavaScript, 4 CSS, and 1 image file, plus supporting files.

## 2. URL privacy boundary

The corrective Product lineage canonicalizes discovery history URLs. Navigation
for `/ondo-b` is rebuilt from the route origin and permits only these directory
keys when applicable: `city`, `view`, `q`, `category`, `venueId`, and `detail`.
Unrelated query keys and the hash fragment are removed during normalization.

This is a minimization boundary, not a secrecy claim. Search text under `q` and
selected canonical venue IDs may intentionally remain in browser history or a
shared URL. Saved-place IDs, preferences, onboarding state, and private notes
remain in device storage and are not written into the canonical URL.

## 3. Standalone legacy-byte cleanup

Product commit `4ec64b3de02fdd8f5298a38dde0c84f47eaa3dc6` completes
the shipped-byte cleanup by:

- using a production-only official-directory onboarding stylesheet;
- writing a reduced canonical venue-detail payload from source records;
- preserving source-only truth types in the repository while scanning compiled
  standalone output; and
- rejecting legacy persona, demo/simulation, KYC, chat, reward, Labs, After19,
  checkout, and overlay product identifiers from shipped UI bytes.

The receipt reports zero exact product-token matches and zero CSS token or
legacy-selector matches. Seven raw substrings were classified as infrastructure
fragments—`persona` inside `impersonate`, `chat` inside `chatgpt.site`, and
`deMo` inside `__toESM`—rather than product surfaces. This is a standalone
artifact guarantee, not a claim that historical repository modules were
deleted.

## 4. User-visible product

- Explore provides official-directory map/list discovery, search, canonical
  place details, location handling, directions handoff, and recovery states.
- Saved provides device-local canonical saved places and optional private notes.
- Settings provides language, local preferences, and clearing ONDO B device
  content.

The persistent navigation has exactly three tabs: Explore (`ondo`), Saved
(`my`), and Settings (`id`). No production account is required, and the local
state is not represented as a synchronized profile.

## 5. Data truth and local storage

Canonical JSON, map JSON, and GeoJSON each contain the same 400 official
MOIS LOCALDATA food-service license records: 200 Seoul and 200 Busan. Selection
is a reproducible balanced directory seed, not a popularity, quality, safety,
or traveler-suitability ranking.

The `ondo-b.device.v1` storage record permits locale, onboarding completion,
discovery preferences, canonical saved venue IDs, and private notes attached to
saved canonical venue IDs. Restored values are sanitized against canonical
venue and preference allowlists.

## 6. Explicit non-promises

The standalone B product is not evidence of:

- demo, simulation, mock, fixture-driven, or test-token success;
- account creation, sign-in, identity verification, KYC, or age proof;
- payment, checkout, OOKRW, settlement, receipt, or purchase;
- Table joining, chat, report submission, or social coordination;
- rewards, stamps, trust/reputation scoring, or public profile;
- Labs, zkLogin, wallet, bridge, badges, traits, or NFTs; or
- After19 discovery, gating, policy, or verified-access flows.

## 7. Sites/hosting boundary

Checked-in hosting metadata names an existing protected Site project and has no
D1 or R2 binding. The standalone preparer refuses that protected identity and
defaults to a local-only placeholder unless a separate project ID is supplied.
This evidence finalization performs no Site creation, deployment, version save,
credential request, source push, or hosting-metadata edit.
