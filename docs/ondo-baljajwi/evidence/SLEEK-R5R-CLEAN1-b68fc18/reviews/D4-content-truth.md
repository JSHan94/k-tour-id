# D4 Content, Truth & Privacy — CLEAN round 1

Verdict: **NOT CLEAN**  
Review completeness: **INCOMPLETE**  
Raw findings: **S0 0 · S1 1 · S2 1 · S3 0**

## Frozen boundary and method

- Evidence parent SHA: `875ebf49f89c5842b56dc49e89b127a426fa8490`
- Product: `5b519e60eb7825e2573ca6692683315cbf508401`
- Harness: `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032`
- Frozen URL: `http://127.0.0.1:3219/ondo-b`
- Baseline digest: `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de`
- Server response: HTTP `200`; the `/ondo-b` application root was present.
- Browser context: the mandated exact in-app URL selector returned `No browser is available`; the prescribed troubleshooting document was read completely and the single permitted browser-list retry returned no browser. The audit therefore used the repository's actual Playwright/Chromium runtime. Every live exercise began in a new isolated context with empty cookies and origins.
- Blindness: inspection was limited to the live URL, the four FINAL pack files, the two allowed helpers, the three B flow pixel specs and committed snapshots, and the named canonical documents. No product source beyond the helpers, previous reviews or receipts, peer output, git history, private deployment, or old session/evidence was used. No baseline or snapshot was updated.
- Integrity: all 300 ledger PNG hashes and all four pack checks passed. The baseline ledger digest independently recomputed to the frozen value above.

## Findings

### `D4-BLINE-LIVE-COPY-DRIFT-FILTERED-COUNT` — S1

- Viewport / locale / state: reproducible at `390×844` / EN / `CITY-FILTERED-MAP`; the discrepant committed state exists at all six audited widths (`360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`). Flow: `FL-001`.
- Steps: start a fresh EN context at `/ondo-b`; choose Seoul; switch to List; search for `느린마을 양조장`; switch back to Map; read the filtered-result legend. Compare that exact frozen live state with the ledger-declared `B-PX-CITY-FILTERED-MAP-EN` snapshot.
- Expected: a snapshot declared `FROZEN` for this Product/Harness/URL tuple represents the live state byte-for-content at the same scripted checkpoint; a one-result legend uses singular `place`.
- Actual: the live legend is `1 sourced food place`, while every committed width for this state visibly says `1 sourced food places`. The pack is internally hash-consistent but does not represent the frozen live checkpoint.
- Evidence: representative ledger artifact `k-tour-id-app/tests/visual/ondo-b-flow-pixels-mobile.spec.ts-snapshots/B-PX-CITY-FILTERED-MAP-EN-FL-001-en-390x844-mobile-chromium-darwin.png`, SHA-256 `fc6716fffa2fa38882fcf739587e2c814c95a04ed58c0f1dd4637f18a985f00d`. The other five ledger hashes are `91ef3f49774ef90970e8ff08fd1577f8a06bb2956af4dc79978f5b3dd5fe93b0` (360), `dcb4becfe8b561aa4fa17df7e7b453c60d367e87d6b1970baa85d1d8f2080175` (430), `73d9ef3025d3e440811862073c9fea578b252cf3cf61fc1096401ce61fe6288b` (768), `bac126cc02e36c1f1a83053016d59215c410700d89eafd1f521b75c1cdc646c5` (801), and `e11b816a62374b80971bc8688ae2c41882f6afe7146ad01a7cd4a05b7e7553c2` (1440).
- Impact: this is an evidence-to-runtime contradiction, not merely a grammar-polish issue. It prevents complete coverage credit for the declared frozen tuple and is therefore S1.

### `D4-LABS-KO-TARGET-TRUTH-LITERAL` — S2

- Viewport / locale / state: `390×844` / KO / `LABS`; flows `FL-004`, `FL-016`, `FL-018`.
- Steps: start a fresh KO context with an active account and 10-stamp fixture state; open My Korea; open Labs; select `이해하고 보기`; inspect the signer/asset target-network label.
- Expected: `06_CONTENT_LOCALIZATION.md` lines 445–447 and `07_VISUAL_INTERACTION_SPEC.md` lines 524, 530, and 534 require the locale-invariant exact truth copy `Target network: Sui Testnet · Simulated`.
- Actual: the KO surface renders `대상 네트워크 식별자: Sui Testnet · 시뮬레이션`.
- Evidence: direct live DOM/visible-text inspection at the frozen URL in a fresh context. EN renders the required literal; KO substitutes a localized label.
- Impact: the KO wording remains semantically simulated, so this is not an S0 false live-asset claim. It nevertheless violates an explicit release truth token on a signer/asset boundary and is S2, not cosmetic S3.

## Directly observed truth and privacy controls

No additional raw finding was observed in the following independent checks:

- Sourced, generated, simulated, unknown, stale, and browser-local labels were exercised in KO and EN. Place source/generated/unknown labels, absolute preview timestamps, fixed snapshot dates, Labs stale and no-real-assets boundaries, and simulated checkout wording were visible and distinguishable.
- Account, Person, 19+, Payment KYC, and four reputation axes remained separate. Account success changed only Account; age success changed only 19+/After19; Payment KYC changed only Payment KYC; a Local Signal changed only Visit and Contribution.
- Optional profile fields honored per-field consent. Cancel restored the prior draft and consent state. Include/save and remove/save survived reload. The visible copy states that identity-check nationality is never copied; no raw PII-like or credential storage field was found.
- Session-reset cancel preserved state through reload. Confirm cleared identity, age, payment, profile, activity, Table/chat, Labs, and accepted-visit feature state while preserving locale, guide/appearance settings, saved venues, and discovery preferences through reload.
- Discovery-reset cancel preserved preferences through reload. Confirm cleared only `discoveryPreferences`; session, settings, saved venues, query, and city context remained partitioned through reload.
- Photo, Table, chat, Labs, and checkout boundaries were exercised: local photos and chat images stayed device/browser-local; Tables made no live host/reservation or nationality/gender-matching claim; checkout made no real-payment, automatic-KYC, or payment-equals-stamp claim; Labs remained contract-only/simulated/stale apart from the exact KO literal defect above.
- Error, retry, cancel, terminal, and return copy was inspected across the ledger and exercised on critical live paths. EN singular behavior is correct live, but its frozen snapshot contradiction is the S1 finding above.

## Severity and verdict

Raw counts are `S0=0`, `S1=1`, `S2=1`, `S3=0`. CLEAN requires complete coverage and zero S0/S1/S2. The S1 frozen-evidence contradiction makes coverage **INCOMPLETE**, and both the S1 and S2 counts are non-zero. Verdict: **NOT CLEAN**.
