# CLEAN round 1 · D3 Inclusive & Responsive review

Verdict: **NOT CLEAN**

Coverage is `COMPLETE`, but the raw defect set is `S0=0 · S1=0 · S2=4`; a clean verdict requires all three raw counts to be zero. `S3=0` is tracked separately.

## Frozen boundary

| Item | Reviewed value |
|---|---|
| Evidence SHA | `875ebf49f89c5842b56dc49e89b127a426fa8490` |
| Product | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Harness | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Canonical snapshot digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |
| Frozen URL | `http://127.0.0.1:3219/ondo-b` · live HTTP `200` |

The in-app Browser skill was read in full and its exact URL selection was attempted first. The runtime returned `No browser is available`; required bootstrap troubleshooting was read and the one permitted browser inventory returned `[]`. Live review therefore used the locked repository Playwright `1.62.1` Chromium fallback. Every probe used a new non-persistent browser context, no prior storage state, cleared cookies, and scenario-local storage seeding only.

The review stayed inside the strict-blind allowlist: live `/ondo-b`; the four frozen evidence files; the two allowed helpers; the three flow-pixel specs and their committed PNGs; and the named canonical documents. Automated PASS text was treated as provenance, not as the conclusion.

## Raw findings

### D3-R1-INC-001 · First-run modal has no Escape path

- Fingerprint: `D3|ONBOARDING|MODAL_ESCAPE_NO_DISMISS|390x844|en|ONBOARDING-VALUE`
- Severity: **S2 Medium**
- Scope: `FL-007`, `FL-008`, `FL-009`; first-run `ONBOARDING-VALUE`; reproduced at `390×844` EN and structurally present in the six-width onboarding frames.
- Steps: open a fresh isolated context at `/ondo-b`; confirm the `ONDO onboarding` element is `role=dialog` and `aria-modal=true`; Tab through `Get started → Explore as a guest → KO`; press `Escape`.
- Expected: the modal Escape contract dismisses onboarding through its existing guest escape, leaves the map usable, and places focus at a stable destination.
- Actual: the dialog count stays `1`; focus is moved back to `Get started`. Focus trapping and inert/`aria-hidden` background isolation do work, so this is specifically a missing keyboard dismissal path.
- Evidence: live Playwright, `390×844`, EN, fresh storage. Before Escape the trap cycles over three modal controls; after Escape the same dialog remains visible and focused.

### D3-R1-INC-002 · Gate progress name is attached to a roleless generic element

- Fingerprint: `D3|IDENTITY_GATE|ARIA_LABEL_PROHIBITED_GENERIC_DIV|390x844|ko|GATE-ACCOUNT`
- Severity: **S2 Medium**
- Scope: shared identity/gate progress UI used by `FL-002`, `FL-005`, `FL-006`, `FL-010`, `FL-013`, and `FL-017`; reproduced on `GATE-ACCOUNT` at `390×844` KO.
- Steps: seed a completed onboarding session with `ACC-GUEST`; open the canonical venue; activate `Save`; inspect the visible gate progress with an accessibility audit and the live accessibility attributes.
- Expected: the visible procedure grouping has a supported semantic role/name association so assistive technology receives “필요한 절차” and the current step.
- Actual: `<div aria-label="필요한 절차">…1 계정…</div>` has no role. Axe reports `aria-prohibited-attr` with serious impact in its manual-review/incomplete set: `aria-label` is not well supported on a generic roleless `div` and may be ignored.
- Evidence: live DOM and independent axe on `390×844` KO account gate. The gate itself otherwise traps focus, dismisses with Escape/backdrop, restores focus to `저장`, and has no sub-44px controls.

### D3-R1-INC-003 · Focus-visible width is not the required uniform 3px token

- Fingerprint: `D3|GLOBAL|FOCUS_VISIBLE_WIDTH_TOKEN_DRIFT|KO+EN|INTERACTIVE`
- Severity: **S2 Medium**
- Scope: global keyboard focus across onboarding, place, and identity gate controls; both locales; mobile and desktop frames.
- Steps: navigate only with Tab in onboarding, canonical place, and account gate; inspect computed focus-visible styles on each focused control.
- Expected: the clean-round contract’s uniform `3px` focus-visible treatment using the focus color token.
- Actual: ordinary buttons render `2px solid rgb(29, 102, 209)` with `2px` offset, while the primary Directions link renders `3px` with `0px` offset. The color token is present (`--focus: #1d66d1`), but no shared width token is exposed and the rendered width/offset treatment is inconsistent.
- Evidence: live computed styles. Examples: `Get started`, `Explore as a guest`, `KO`, place Close/Save, and all account-gate actions are `2px + 2px offset`; `canonical-venue-primary-directions` is `3px + 0px offset`.

### D3-R1-RESP-004 · Core EN labels ellipsize in short-height landscape

- Fingerprint: `D3|CITY_LIVE|LANDSCAPE_CORE_LABEL_ELLIPSIS|844x390+667x320|en`
- Severity: **S2 Medium**
- Scope: `FL-001`, `CITY-LIVE`, EN, `844×390` and `667×320` short-height landscape.
- Steps: seed completed onboarding in EN; open `/ondo-b?city=seoul` at `844×390` or `667×320`; inspect the preference action and map-key status.
- Expected: landscape remains compact and usable without ellipsizing core CTA/status text, per the responsive and pixel-acceptance copy rules.
- Actual: `Tune interests` is visibly rendered as `Tune int…`; its inner span is `64px` client width versus `87px` scroll width with `text-overflow: ellipsis`. `Highest simulated scores at this zoom` is also ellipsized (`156px` versus `216px`). There is no page-level horizontal overflow and the targets remain usable, so the defect is responsive copy loss rather than a flow break.
- Evidence: live Playwright screenshots and DOM geometry at both landscape sizes; EN only. The synchronized List control and bottom navigation remain available.

## Independent pass evidence

- Frozen visual matrix: `300/300` PNG reviewed, `50/50` cases, `48/48` states; six exact widths each contain `50` images. All declared PNG SHA-256 values and IHDR dimensions match the frozen ledger; `300` paths are unique and `300` rows are `FROZEN`.
- Locale rows: `198 EN + 102 KO`; KO and EN copy/wrapping were inspected across the six contact sheets and original-size high-risk frames.
- Flow ledger: `18/18`; `126/126 = 123 ACTUAL + 3 reasoned N/A + 0 GAP`. Pixel links cover `109` checkpoints and explicit functional-only reasons cover `17`.
- Exact-width live place audit in KO and EN at `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, and `1440×1000`: horizontal overflow `0`, visible sub-44px controls `0`, and a reachable internal scroll owner on long sheets.
- Reflow proxies: `640px` (200% from a 1280px reference) and `320px` (400%) in KO and EN had horizontal overflow `0`, sub-44px controls `0`, and keyboard focus auto-scrolled each core place action into view.
- Place and account-gate dialogs: focus entered predictably; trap, Escape, backdrop dismissal, inert/`aria-hidden` modal isolation, and trigger focus restoration passed. Representative center-point hit tests passed for actually visible controls.
- Landmarks/names: one `main`; `Main navigation` and the map/list region are named; dialogs expose modal semantics. The unsupported progress label is the isolated name defect recorded above.
- Contrast: independent axe found no color-contrast violation on onboarding, place, account gate, or Labs surfaces. Its overlap-related incomplete samples were manually resolved: onboarding lead `rgb(116,113,107)` on `rgb(251,250,247)` is `4.66:1`; gate body `rgb(111,108,102)` on `rgb(252,251,248)` is `5.06:1`.
- Non-color cues: heat uses score text/geometry/legend; success, warning, error, unsupported, pending, and simulated states use text and/or icons in addition to color.
- Reduced motion: `matchMedia('(prefers-reduced-motion: reduce)')` was true and residual animation/transition duration was clamped to `0.00001s`; no persistent movement was observed.

## Conclusion

Coverage is complete and no S0/S1 issue was found, but four raw S2 accessibility/responsive defects remain. Under the clean-round rule, this tuple is **NOT CLEAN**.
