# D3 Inclusive & Responsive · CLEAN round 1 · c05a2d0

Status: **COMPLETE · NOT CLEAN**

## Frozen tuple and blindness

| Boundary | Exact value |
|---|---|
| Evidence SHA / review parent | `fcd4447d86ac01daf90ee763963e1ddfa7a7f811` |
| Product | `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` |
| Harness | `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` |
| Baseline digest | `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` |
| Live target | `http://127.0.0.1:3219/ondo-b` only |

I started from a new isolated worktree and branch directly at the Evidence SHA. I did not inspect any non-c05 review, issue, fix, coverage, receipt, or CLEAN material; did not use `/ondo`, a deployed site, product source beyond the two permitted helpers, git history/diffs/messages, or peer review material; did not update snapshots or product code. Review evidence came only from the allowed canonical documents, exact four-file FINAL c05 pack, permitted helpers/specs/snapshots, and the frozen live target.

The Browser skill was read in full before browser work. Exact URL selection with `getForUrl("http://127.0.0.1:3219/ondo-b")` returned `No browser is available`; the prescribed bootstrap troubleshooting document was read and the single permitted `agent.browsers.list()` returned `[]`. I then used repository Playwright Chromium with a fresh isolated context for each live case.

## Methods and completion

- Verified all three checksums in the FINAL pack. Recomputed the SHA-256 of every baseline path: `300/300` matched and `0` mismatched.
- Reconciled the complete census: `50` case IDs, `48` state IDs, six exact dimensions with `50` PNG each, `198 en`, `102 ko`, `300 FROZEN` rows.
- Visually inspected every one of the `300` PNGs as twelve labeled contact sheets of `25` original baseline images each. This covered both halves of every exact viewport: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, and `1440×1000`.
- Audited all `18/18` flow contracts and all `126/126` checkpoints: `123 ACTUAL + 3 reasoned N/A (FL-007/008/009 RETRY) + 0 GAP`. The exact checkpoint and case ledgers are in the companion coverage file.
- Exercised EN and KO at every exact width plus `320×800`, `640×800` (200%-equivalent reflow width), `320×800` (400%-equivalent reflow width), `667×320`, `740×360`, `844×390`, and `926×428`. I checked document/root overflow, clipped text, overlapping controls, true visible-control target geometry, scroll reachability, and surface height.
- Ran Axe in `37` live page-state/viewport combinations spanning nation, place, onboarding, Account Gate, Local Signal, checkout, Tables, Table detail, chat, My Korea, Labs, and ID. All returned zero violations. Separate raw review still found the live-region and focus defects below.
- Exercised keyboard order, visible focus rings, modal wrapping, Escape, return focus, inert/`aria-hidden` isolation, dialog names, landmarks, localized names, status/error announcements, reduced motion, forced colors, contrast/non-color cues, and short-landscape scrolling.
- Confirmed representative focus rings at `2px` (initial dialog focus uses a visible `3px` ring); no true visible control under `44×44`; no horizontal root/document overflow; no interactive overlap; semantic list and non-color numeric labels remained available for map signals.

## Raw findings

### D3-C05-001 · S2 · Short-landscape responsive rules reduce visible metadata below the canonical 12px minimum

Reproduction:

1. Open the fresh nation surface in a reduced-motion context at `667×320` EN, `740×360` KO, `844×390` EN, or `926×428` KO.
2. Inspect computed font sizes for the visible city metadata and, after opening Seoul/place detail, the map filter labels.

Observed:

- Nation city labels render at `11px`; source/preview/fixed-snapshot metadata renders at `10px` in `667×320` and `740×360`.
- The same short-landscape compact mode still exposes `11px` city labels and `10px` source metadata at `844×390` and `926×428` (with fewer rows present at the taller sizes).
- On the live city/place background, the visible `All places` / `ONDO signal` / `Signal pending` labels (and KO equivalents) render at `11px` throughout the short-landscape set.
- Content is vertically scrollable and ultimately reachable, with no horizontal overflow or nav collision; the defect is legibility, not reachability.

Expected: the canonical visual system and frozen surface matrix require visible metadata at least `12px`, including responsive/landscape presentations.

Impact: users in landscape—including low-vision users relying on the compact layout—receive materially smaller source and state text precisely where provenance and simulation boundaries must remain readable. This affects FL-001 nation/city discovery and the shared map background used by venue/gate flows.

### D3-C05-002 · S2 · Shared identity-gate failure changes are not exposed as an alert/status or live-region update

Reproduction:

1. Open the canonical venue as a guest with `qa=1`, invoke Save, and activate `Simulate failure`; repeat through the manual 19+ and Payment KYC gate paths.
2. Observe the accessibility semantics and mutations of `[role=alert]`, `[role=status]`, and `[aria-live]` for `500ms` around the transition.

Observed:

- Account, Age, and Payment Gate failures replace the dialog heading with `The check could not be completed.` and replace the action body.
- None of those transitions creates a `role="alert"`, `role="status"`, or relevant `aria-live` mutation. The only remaining live node is the unrelated persistent After 19 preference region.
- Keyboard focus moves to a remaining return action, but focus alone does not announce the new error text or changed dialog name reliably.
- Control comparison confirmed that Save failure and Local Signal failure use `role="alert"`, checkout decline uses `role="alert"`, and checkout processing uses `role="status"`; the omission is specific to the shared identity gate failure surface.

Expected: loading, success, and error changes use an appropriate live announcement, as required by the canonical accessibility contract.

Impact: screen-reader users can trigger a failed Account/Age/Payment verification simulation and receive no programmatic error announcement, obscuring both failure and recovery. Confirmed flow impact: FL-010, FL-002/FL-013, and FL-017; the same shared gate surface also serves Person checks.

### D3-C05-003 · S2 · Closing the Labs modal with Escape loses focus even though the opener remains available

Reproduction:

1. Seed an active My Korea state with `10` stamps, open My Korea, focus and activate `open-labs-milestone`.
2. Confirm the named modal `role="dialog" aria-modal="true" aria-label="Labs"` opens and traps focus.
3. Press Escape.

Observed:

- The dialog closes, but `document.activeElement` becomes `BODY`.
- `open-labs-milestone` remains present and visible (`354×58` in the tested `390×844` context); the ordinary `open-labs` control is also still present and visible.
- By comparison, the Account Gate restores focus to the exact Save opener and the report alertdialog restores focus to the report opener.

Expected: modal dismissal restores focus to the invoking control (or a documented logical replacement only when that control no longer exists).

Impact: keyboard and screen-reader users lose their location in a long, scrollable My Korea document after closing Labs and must rediscover the control. This affects the Labs entry/return portions of FL-018 and the shared Labs access represented in FL-004/FL-016.

## Passed inclusive/responsive checks

| Area | Raw result |
|---|---|
| Exact frozen visual census | `300/300` inspected; no unrecorded state, viewport, locale, or hash mismatch |
| Checkpoint completeness | `126/126 COVERED`; `123 ACTUAL`, `3 reasoned N/A`, `0 GAP` |
| Exact EN/KO widths | Six widths × both locales: overflow `0`, true target failures `0`, control overlap `0`, Axe violations `0` |
| Reflow | `320`, `640` 200%-equivalent, and `320` 400%-equivalent widths: overflow/clipping/target failures `0` on audited nation/place surfaces |
| Orientation | All four short landscapes remained scrollable and reachable; the raw 10–11px defect is recorded above |
| Dialog isolation | Onboarding, Account Gate, Local Signal, checkout, Table, report, and Labs expose named modal semantics; tested background layers are inert/hidden |
| Keyboard | Logical main/onboarding order, wrapped traps, Escape, and visible focus passed except Labs return focus |
| Announcements | Save, Local Signal, checkout processing/failure passed; shared identity-gate failure is the raw exception |
| Contrast/non-color | Axe color checks passed; forced-colors retained visible controls/focus; heat score and cluster count remain distinguishable by text/geometry as well as color |
| Reduced motion | `prefers-reduced-motion: reduce` matched; no named animation remained and residual computed durations were negligible `0.00001s` |
| Names/landmarks/localization | `html lang` switched `en`/`ko`; main navigation and map regions were named; icon-only controls and marker/city controls had localized accessible names |

## Verdict

Raw counts: **S0 0 · S1 0 · S2 3 · S3 0**.

Coverage is **COMPLETE**, but CLEAN requires COMPLETE and raw `S0=S1=S2=0`. Because three raw S2 defects remain, the strict verdict is **NOT CLEAN**.
