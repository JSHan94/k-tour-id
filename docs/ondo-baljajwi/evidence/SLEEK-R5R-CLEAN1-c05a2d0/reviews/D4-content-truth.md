# D4 Content, Truth & Privacy — CLEAN round 1

## Verdict

`COMPLETE · CLEAN`

Raw severity count: `S0 0 · S1 0 · S2 0 · S3 2`.

The CLEAN rule supplied for this round is `COMPLETE && S0=0 && S1=0 && S2=0`. Both conditions are met. The two S3 findings are reported independently and were not downgraded, deduplicated, or omitted.

## Frozen tuple

| Boundary | Exact value |
|---|---|
| Evidence / parent | `fcd4447d86ac01daf90ee763963e1ddfa7a7f811` |
| Product | `5c6383e38a150fc20bd6298ef0c2b7c619e671e1` |
| Harness | `c05a2d0f08ef81a500b3ab44cfc94699a23c6f0c` |
| Canonical snapshot digest | `addf064d8df5467bc06a14c239a9da24a35ed89ccf58944bb8c554e1c115bab6` |
| Live route | `http://127.0.0.1:3219/ondo-b` |

The four-file FINAL-c05 pack identifies the same Product, Harness, digest, `50 cases / 48 states / 6 viewports / 300 PNG`, `18 flows / 126 checkpoints / 123 ACTUAL / 3 reasoned N/A / 0 GAP`, and `198 en / 102 ko` tuple. Its three checksummed payloads pass `SHA-256`, and every one of the 300 ledger paths, hashes, PNG dimensions, and snapshot-directory memberships was independently checked with `0` mismatch, missing file, or extra file.

## Blindness and allowed-surface statement

This review began in a fresh worktree directly at the Evidence SHA. I did not read prior SLEEK/RUN/CLEAN reviewer output, coverage, issues, fixes, manifests, receipts other than the exact FINAL-c05 four-file pack, peer output/messages, Git history/diff/log/show/blame, product source, old deployments, or old browser/evidence state. I made no product, harness, or snapshot edit.

I read the mandatory Browser skill in full and attempted `getForUrl("http://127.0.0.1:3219/ondo-b")`. No browser was available. I then read the required bootstrap troubleshooting guidance and called the browser list exactly once; it returned `[]`. As authorized, I used repository Chromium in fresh isolated contexts for every live check. The server at port `3219` was left untouched.

Review inputs were limited to the live route, exact FINAL-c05 pack, `ondo-b-visual-evidence.ts`, `ondo-b-qa.ts`, the three pixel specs and their snapshot directories, and the named canonical documents.

## Method

- Inspected all `300/300` frozen frames through six complete viewport contact sheets and five enlarged 1440px case sheets, then drilled into content/truth-heavy surfaces live.
- Audited the `50/50` visual cases, `48/48` distinct states, all six exact widths (`50` frames each), and the `198 EN / 102 KO` locale census.
- Audited all `18/18` flow contracts and all `126/126` checkpoints from the frozen helper registry: `123 ACTUAL`, `3` reasoned `not_applicable` (`FL-007/008/009 RETRY`), `0 GAP`. The visual link census is `109 pixel` plus `17 functional_only`; the latter contains `14 ACTUAL` and the three reasoned N/A checkpoints.
- Opened all `14` content surface families in both locales in fresh live contexts: onboarding, nation, city-list, place, account-gate, age-gate, tables, table-chat, local-signal, checkout, identity, profile, labs, and after19.
- Exercised live failure/retry/receipt states for save, Account, Payment KYC, Table join, chat image, Local Signal, checkout cancel/failure/receipt/stamp, expired After19, merchant trait, and bridge source-confirmed failure/destination-confirmed success.
- Exercised discovery reset, sign-out/session reset, After19 manual-off reload persistence, browser-local photo preview disappearance on reload, storage/URL inspection, and EN/KO one-result singular copy.

Full case, frame, flow, checkpoint, surface, provenance, and privacy census is in the companion coverage file.

## Raw findings

### D4-C05-001 — S3 — KO Table chat time remains EN-formatted

Live reproduction: fresh KO `table-chat` surface at `390×844`.

Observed: the message timestamp is `8:12 PM` while the surrounding surface is Korean.

Expected: the canonical localization contract requires Korean date/time order using `오후`, for example `오후 8:12`, while EN may use `8:12 PM`.

Impact: a minor mixed-locale string on the KO chat fixture. It does not alter message status, privacy, membership gating, or flow completion.

### D4-C05-002 — S3 — canonical persistence identifiers lag the live safe envelope

Live reproduction: fresh EN/KO account, age, and payment gates plus reset inspection.

Observed: the live implementation uses versioned keys including `ondo.preferences.v3` and `ondo.session.v3`, and embeds a session-only gate envelope with identifiers such as `RT-SAVE_VENUE-…` / `SAVE_VENUE`. The canonical persistence source of truth still names `ondo.pref.v2`, a separate `ondo.returnTo.v2`, and fixed pairs such as `RT-SAVE→save` and `RT-CHECKOUT→checkout`.

Current safety behavior was verified: gate envelopes contain only public venue context and non-sensitive timing/state; no credential, DOB, nationality, payment instrument, photo/blob, private key, or provider response appears in URL or browser storage; cancel/terminal/reset behavior clears or neutralizes the gate; and no open redirect was observed.

Impact: internal documentary identifier/schema drift, not a current data exposure or user-flow break. The canonical contract should be reconciled with the v3 implementation before it is used as an integration or migration reference.

## Truth findings by domain

### Official, sourced, simulated, unknown, and stale labels

- Nation and city surfaces explicitly separate `official/sourced place records` from fixed `simulated` ONDO scores and input counts, with `not live` language in both locales.
- Venue cards lead with the official Korean source name. Generated Romanization is explicitly labeled navigation-only and not an official English name.
- The canonical place detail identifies `MOIS LOCALDATA`, the active-license-record boundary, the source snapshot date, and a truncated public source-record identifier. It does not call the license record `open now`.
- Opening hours, foreign-card acceptance, English menu, phone requirement, alcohol service, admission, and official age restrictions remain `not confirmed by this source` rather than being promoted from unknown.
- The merchant condition surface keeps `CONTRACT ONLY`, stale/out-of-date, unavailable, and failed retry states separate; it expressly denies admission, safety, and payment guarantees.
- No visible `FX-*`, `SCN-*`, `fixtureId`, `undefined`, `null`, or stack trace leaked on the 28 live surface-locale pairs.

### Account, Person, age, Payment KYC, and After19

- Account creation copy says it does not complete identity verification. Person, 19+, and Payment KYC are independently labeled and independently stored.
- Passport is provider-neutral and simulated; Korean CX is a simulated route; Residence Card unsupported is `NOT CONNECTED` with a passport alternative, never a fabricated success.
- The age gate limits its claim to eligibility and explicitly declines to claim that an external provider uses zero-knowledge proofs.
- After19 copy covers manual proof, the four automatic guards, expiry reason/recovery, ordinary late-night venues remaining on the main map, and the absence of identity detail on the map.
- Manual-off became `A19-MANUAL-OFF` and stayed off across reload in the same tab. Expired proof forced the main map and presented `Check 19+ again`.

### Tables, chat, Local Signal, profile, and discovery

- Tables are fixed local previews, not current availability or live reservations; nationality/gender matching is explicitly absent.
- Chat is confirmed-member-only. Participant identity is not claimed as verified. Text/photo content is described as session-local and not uploaded or stored on a server.
- Failed chat image metadata persisted only `id/kind/status`; no filename, blob, or image data entered storage.
- Local Signal states clearly say only Visit and Contribution change; identity, 19+, payment verification, Meetup, stamps, and the public ONDO score remain unchanged. Failure preserves the draft; success stores only non-sensitive event keys.
- Profile location/language fields are self-declared, session-local, private by default, and not copied from KYC nationality.
- Discovery reset cleared only `discoveryPreferences`; saved venue, locale, session checks, and public query context remained. Session reset cleared Account/Person/Age/Payment/After19/stamp state while preserving local saved/discovery preferences as disclosed.

### Checkout, receipts, Labs wallet/bridge, and badge truth

- Checkout consistently labels the flow simulated, states that no real payment/assets move, distinguishes KRW display price from OOKRW read-only test-token settlement, and denies redemption/1:1 guarantees.
- Cancel and failure left stamp `9`, completion created a `SIM-SG01` preview receipt while leaving stamp `9`, and a separate explicitly non-real preview visit advanced to `10`.
- Labs always exposes `Target network: Sui Testnet · Simulated`; zkLogin is a Sui signing route, not an ONDO account, KYC, or multichain wallet.
- USDC, USDT, and OOKRW remain separate asset rows; OOKRW has no USD estimate and no redemption claim.
- Bridge failure at `source_confirmed` says destination is pending and balances unchanged. Success occurs only at `destination_confirmed`, is labeled simulated, and shows projected read-only before/after values while stating actual balances/transactions did not change.
- AMM is Deferred with no execution CTA. Badge copy is optional and excludes identity, nationality, 19+, and negative reputation from public metadata.

## Privacy/storage/URL conclusion

Across live states, URLs contained only `/ondo-b` plus public `city`, `view`, `query`, `venueId`, `detail`, and deterministic QA `scenario/qa` parameters. No Account, Person, age, nationality, KYC result, profile value, photo, balance, credential, or payment instrument appeared in a URL.

Local storage contained locale/onboarding/guide/auto-night/saved-venue/discovery preferences. Session storage contained simulated account/check states, public entity IDs, non-sensitive activity IDs, membership/chat status, and Labs state. The selected photo remained memory-only and disappeared on reload with no blob URL or filename retained. Sign-out and discovery reset honored their disclosed scopes.

## Final gate

| Condition | Result |
|---|---|
| Review completeness | `COMPLETE` |
| Raw S0 | `0` |
| Raw S1 | `0` |
| Raw S2 | `0` |
| Raw S3 | `2` |
| CLEAN rule | `PASS` |
| Final verdict | `CLEAN` |

