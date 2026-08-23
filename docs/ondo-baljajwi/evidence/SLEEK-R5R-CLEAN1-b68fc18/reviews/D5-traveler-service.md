# D5 Traveler Service review — CLEAN round 1

## Verdict

**CLEAN** — coverage is complete and the raw finding counts are **S0=0, S1=0, S2=0, S3=0**.

I found no traveler-blocking, trust-blocking, recovery, clarity, or service-usefulness defect in the frozen `/ondo-b` evidence. There are no raw findings to fingerprint. S3 was evaluated separately; no functional or trust concern was moved into S3.

## Frozen evidence boundary

- Evidence SHA: `875ebf49f89c5842b56dc49e89b127a426fa8490`
- Product SHA: `5b519e60eb7825e2573ca6692683315cbf508401`
- Harness SHA: `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032`
- Baseline-set digest: `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de`
- Frozen server: `http://127.0.0.1:3219/ondo-b` (HTTP 200)

The in-app Browser was unavailable after the prescribed initialization and one troubleshooting browser-list check returned no available browser. I therefore used the authorized actual-repository Playwright/Chromium fallback. Every live case and traveler scenario used a fresh BrowserContext with fresh storage; no old session or evidence context was reused.

The review stayed inside the strict-blind boundary: the live route, the four FINAL pack files, the two B helpers, the three B pixel specifications and their snapshots, and the named canonical execution/truth documents. I did not use prior or current review outputs, issue/fix/coverage receipts, private deployments, product source outside the helpers, git history, or snapshot updating.

## Independent evidence inspected

- **Visual evidence:** all `300/300` baseline PNGs were checksum-recomputed from the baseline ledger with `0` mismatches, then visually inspected. This covers `50/50` cases, `48/48` distinct states, all six widths (`360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`), and both KO and EN. I checked legibility, information hierarchy, clipping, overlap, modal containment, action visibility, desktop framing, mobile reachability, state distinction, and truth-label prominence rather than accepting an automated PASS.
- **Live state sweep:** `50/50` cases passed on the exact frozen URL in isolated contexts. Each case was brought to its real state using the allowed helper, then checked for visible/usable geometry, accessible controls and focus behavior, raw truth leaks, and runtime errors. This independently exercised all `48/48` distinct states in KO/EN.
- **Flow ledger:** `18/18` flows and `126/126` checkpoints were audited. The disposition is `123 actual + 3 not applicable + 0 gap`; the only N/A checkpoints are RETRY for FL-007, FL-008, and FL-009, whose specified validation-failure result is the usable guest map rather than a retry screen.
- **Traveler interaction run:** a consolidated eight-scenario Playwright run passed `8/8` on the frozen route. It covered first arrival, short-term onboarding, Busan early coverage, return to the nation view, Seoul map/list/search/selected sourced venue, map failure/list fallback, real offline transition, online/focus/reload recovery, save/account persistence and My Korea exact return, Person and Age cancel/fail/retry/success, Payment KYC separation, checkout cancel/decline/retry/success/stamp, Table failure recovery, the four trust axes, and Labs wallet/bridge cancellation truth.

## Traveler-service assessment

### First arrival and discovery

The first-arrival guide explains the traveler value before asking for intent, offers an immediate guest escape, and completes into the real nation/map shell. Busan is clearly framed as early coverage; returning to All Korea and entering Seoul does not strand the traveler. Seoul exposes a keyboard-usable sourced list, a meaningful search/filter path, a mapped filtered result, and a selected-place route. The selected venue distinguishes the official Korean name, generated transliteration, fixed simulated score, official MOIS LOCALDATA source, snapshot date, record ID, and facts not confirmed by the source.

When the map fails, the same sourced list remains usable and the map retry is visible. During an actual browser-offline transition, the already-loaded list remained searchable and explicitly said it was a fixed simulated snapshot, not live activity or trends. Restoring connectivity, dispatching focus, and reloading returned to a usable Seoul context.

### Saved places, exact return, Tables, chat, and local signal

Saving as a guest opens only the just-in-time account gate. Escape returns to the same selected venue with focus restored; completion changes only account state, saves once, persists through reload, and exposes the saved venue in My Korea. Selecting the saved record returns to the exact venue (peek first, with details one action away), preserving the venue identifier.

Tables present place/time decisions, a deterministic failure with a visible retry, locked chat until membership, device-local image failure recovery, check-in/feedback, and reporting states without dead ends. The local-signal sheet accepts a practical traveler note, preserves the draft through Person-gate cancellation and failure, and returns to the same venue. Its copy keeps the contribution local/simulated and does not imply that one note changes a public safety or trust score.

### Just-in-time gates and checkout

Account, Person, Age, and Payment KYC are separate tasks. Each gate states its simulation/provider boundary, supports cancel/error/retry, and returns to the initiating task without losing the selected venue or draft. Person completion did not silently complete Age or Payment KYC; Age completion did not complete Payment KYC. The venue-scoped 19+ route remained locked after cancel/failure, unlocked only after successful proof, and returned to the exact venue with the After19 banner.

Checkout cancellation and decline kept the stamp at 9 and created no completion effect. Payment KYC completed independently, a simulated checkout receipt still left the stamp at 9, and only the separate visit-proof action advanced it to 10. Recovery controls were visible at every nonterminal checkout state.

### Trust, Labs, persistence, and focus

The ID history keeps identity, visits, local-preview contributions, and Tables activity as four separate axes and explicitly rejects a single safety score. Labs identifies Sui Testnet and every wallet, quote, bridge, asset, and receipt step as simulated/read-only; AMM is Deferred. Bridge cancellation did not reach simulated success or claim asset movement. Overlay escape, reload, restored My navigation, and focus dispatch all left a usable surface with no raw runtime evidence.

## Raw findings

None.

| Severity | Count |
| --- | ---: |
| S0 | 0 |
| S1 | 0 |
| S2 | 0 |
| S3 | 0 |

No coverage gap or raw blocking finding remains; the D5 traveler-service verdict is **CLEAN**.
