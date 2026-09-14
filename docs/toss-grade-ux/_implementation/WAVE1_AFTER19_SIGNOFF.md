# Wave 1 · After 19 exact-return implementation record

Status: `STATIC/CONTRACT PASS · ISOLATED BROWSER SIGN-OFF PENDING`

Applied standards: `00_UX_STANDARD`, `00_PRD_PRESERVATION_LEDGER`, `FL-002`, `FL-013`, `FL-014`

## Outcome

After 19 is an Age-only presentation lens over the existing discovery map. It
does not create Account, Person, Payment, venue eligibility, or a replacement
bars-only result set. The normal providerless path fails closed. A deterministic
positive result exists only behind the explicit review authority and remains
visibly labelled as a review result with no external check.

## State and persistence truth

| Boundary | Implemented result |
|---|---|
| Normal providerless check | `PROVIDER_UNAVAILABLE`; no success mutation and no meaningless retry loop |
| Explicit review | decision → visible pending → result/provenance; the exact pending action is revalidated before Age mutation |
| Guest | eligible state may survive component remounts in the same JavaScript document only; no browser storage; reload returns locked |
| Account | the minimal predicate, issuer type, and expiry may persist in bounded `sessionStorage`; raw DOB or provider response is never stored |
| Manual off | takes precedence over auto-open for the applicable session and preserves map/query/filter/selection |
| Jeju | keeps editorial places and stories; the night lens does not invent a score, official status, or pub eligibility |

## Exact place return

- The public `OPEN_AFTER19` return envelope contains only canonical action
  metadata and `venueId`. It is strict-key, hash-bound, compare-and-consume,
  one-shot, and protected by a bounded consumed-token tombstone ledger.
- The public envelope and its private token-keyed UI snapshot are siblings in
  one strict v2 journal. Private UI never enters the public envelope. The UI
  allowlist is MapLibre longitude/latitude/zoom/bearing/pitch, detail snap,
  section, opened disclosures, real body scroll offset, and focus target.
- Both siblings carry independent expectations/hashes and are token/venue
  cross-bound. A revisioned set/readback compare-and-set makes prepare,
  success, cancel, and renewal atomic over standards-conformant Web Storage.
  An ignored write, readback mismatch, or spec-atomic throw publishes no UI or
  completion event and preserves or quarantines a safe retry state.
- Tampering, token substitution, venue substitution, TTL expiry, same-millisecond
  replacement, replay, and storage write failure all fail closed.
- Success and cancel consume both siblings once. A transient check failure
  keeps them retryable. Expired retry re-keys both siblings in one CAS.
- The restore event is internally trusted; arbitrary page-authored events cannot
  move the map or sheet.
- Account review eligibility is set/readback validated before journal
  completion, React Age/mode publication, or the session event. The shared
  action coordinator and the direct Traveler ID check use the same canonical
  persistence boundary instead of raw storage writes. A blocked, ignored, or
  mismatched write leaves success unpublished. Guest success uses module memory
  and is never interpreted as Account/sessionStorage success.

Storage scope: this implementation relies on the WHATWG Storage contract that
`setItem` either commits the new value or throws without changing it. A custom
storage double that mutates and then throws, especially while also blocking its
rollback, is explicitly outside the product guarantee; this sign-off does not
claim dual-slot recovery for that non-conformant behavior.

## Mobile presentation contract

- The active map utility remains a compact, directly legible `19+` control; it
  does not collapse to an unexplained moon glyph.
- The inactive utility also shows `19+` beside its moon glyph in a 64×44 touch
  target; no icon interpretation is required.
- An active review-only Place row names the localized review provenance rather
  than presenting the unlocked state as an externally verified fact.
- Review provenance opens adjacent to that control instead of being clipped in
  its 44px utility lane.
- Light/night mode changes tokens and approved emphasis only. Query, category,
  result membership, general places, camera, and selected object remain stable.
- Failure, unavailable, expiry, cancel, and off all return to the same map or
  place rather than opening a status page.

## Verification evidence

- Independent non-author rerun after remediation — After 19 + Account consumer
  persistence ordering, ignored write, readback mismatch, and spec-atomic throw:
  **51/51 PASS**.

- Root focused contract run on the integrated tree: After 19, public return,
  private UI snapshot, map lens, profile/evidence integration — **41/41 PASS**.
- Dedicated After 19 subset within that run — **33/33 PASS**.
- Atomic journal/private-snapshot focused rerun — **19/19 PASS**.
- Expanded After 19 + production-contract sample — **28/30 PASS**; the two
  failures are current concurrent Bundle-B/provider production-discovery
  findings (`simulated` literals and a stale legacy-storage inventory), not
  After 19 journal failures, and remain owned by root/Bundle B.
- `git diff --check` — PASS.
- Authored browser scenarios compile/list; actual 320×568, 390×844, 430×932,
  844×390, EN/KO/JA, 200% zoom, focus, reduced-motion, and screenshot evidence
  remain assigned to the single isolated root browser lane.

## Open release gates

- Non-author static/contract recheck is PASS for exact camera/section/scroll/focus
  return, Guest remount versus reload, review provenance, active-control source
  geometry, and canonical consumer persistence ordering.
- Root must complete the isolated browser matrix and close any visual or focus
  regression before this record can be promoted to final Wave 1 sign-off.
