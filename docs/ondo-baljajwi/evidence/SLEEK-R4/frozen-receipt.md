# SLEEK-R4 successor closure-candidate frozen receipt

Status: **PRODUCT/HARNESS/BASELINE TUPLE FROZEN · FULL AUTOMATED GATE PASS · R5 READY TO START · CLEAN 0/2 · NOT DEPLOYED**

This receipt keeps the immutable SLEEK-R4 reviewed tuple separate from the frozen successor containing all twelve consolidated fixes. R4 remains historical `5/5 COMPLETE · NOT CLEAN`. The successor exact-tuple automated gate passed, but that is not reviewer closure or clean-round credit.

## Exact frozen successor tuple

| Field | Value |
|---|---|
| Product boundary | `9ec3d192d0ebdc9614d980bdb173633aee16fc17` |
| Harness boundary / exact repository HEAD | `12354bcf71621c00a08433faf09cbb000683ae61` |
| Pixel baseline commits | `e0b13d8242ad4b728b084cb2a11d0b59af03209b` · `8f3908ec9ada20541e4be28d0963e69b3f6da781` |
| Baseline digest | `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b` |
| Route | `/ondo-b` |
| Flow registry | `18 flows · 126 checkpoints · 121 ACTUAL · 5 reasoned N/A · 0 GAP` |
| Visual registry | `46 cases · 44 distinct state IDs` |
| Viewports | `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000` |
| PNG inventory | `276 = 46 per viewport` |
| Baseline provenance | `84 R4-fix byte changes + 192 byte-identical SLEEK-R3 carries` |

Digest working directory is `k-tour-id-app/`. The exact command is:

```bash
find tests/visual -path '*ondo-b-flow-pixels*spec.ts-snapshots/*.png' -type f -print0 \
  | sort -z \
  | xargs -0 shasum -a 256 \
  | shasum -a 256
```

The digest covers the sorted `sha256 path` lines for all and only the three B flow-pixel snapshot families. Any file byte or path change invalidates this frozen receipt and requires a new digest plus a restarted clean streak.

## Historical SLEEK-R4 reviewed tuple — immutable NOT CLEAN provenance

| Field | Historical value |
|---|---|
| Evidence base | `de64140c5644b543683453d994b925a212d0fbe9` |
| Product | `05f3002899485c528e31730bfebd57d71c3d788d` |
| Harness | `2d7e0f05258ab6b39d2a72f6c86db8b4fbc08bb4` |
| Baseline digest | `74100b05ca1502de3498aca3b6280c8713a67ae9401e94942ce3c82679ba9d6d` |
| Verdict | `5/5 COMPLETE · NOT CLEAN · raw S2 12 + S3 2 · consolidated objective S2 10 + accepted S3 2` |

The ten original `reviews/D1.md`…`D5.md` and `coverage/D1.md`…`D5.md` files remain byte-immutable. Their aggregate checksum is `10c68bebb3d90af971e5fc98f7e7d6884a47707266ac95e3a71c3a5067e453a0`, computed from sorted repository-relative `shasum -a 256` lines:

```bash
find docs/ondo-baljajwi/evidence/SLEEK-R4/reviews \
     docs/ondo-baljajwi/evidence/SLEEK-R4/coverage \
     -type f -print0 \
  | sort -z \
  | xargs -0 shasum -a 256 \
  | shasum -a 256
```

No historical R1/R2/R3 tuple, R4 reviewer verdict, or older private deployment is promoted into this frozen successor's acceptance state.

## Machine-checkable pixel inventory

[`baseline-files.tsv`](./baseline-files.tsv) has exactly one header plus `276` data rows. Each row records repository-relative path, current file SHA-256, actual PNG width/height, exact viewport, case ID, state, flow IDs, locale, frozen status, and provenance.

Required census:

- `46` rows at each of the six exact viewports;
- `46` canonical mobile rows, `46` canonical desktop rows, `184` responsive rows;
- `276` unique `case_id + viewport` pairs and `276` unique paths;
- all dimensions equal the declared viewport;
- all paths are git-tracked and every row hash matches current file bytes;
- state/case/flow/locale metadata matches `B_VISUAL_CASES`;
- `84` rows are marked `R4-FIX` and differ from SLEEK-R3; `192` are marked `R4-CARRY` and remain byte-identical.

The 84 intended changes are the union of `78` PNGs approved in `e0b13d8…` and `6` Local Signal PNGs approved in `8f3908e…`. Approval is not a substitute for the uninterrupted full no-update visual gate.

## Map paint stability investigation receipt

These receipts qualify the map paint guard and recovery mechanism. They did not replace the uninterrupted full no-update pixel gate, which subsequently passed independently, and they do not advance the reviewer lifecycle.

### Controlled compositor-clear study

On the pre-finalization candidate HEAD `1a0e5ade8bb78e880b4594335cf8830e8f995345`, the WebGL framebuffer was deliberately cleared after a rendered map state was established across three representative surface families (`CITY`, `PLACE`, `GATE`), three widths (`360`, `430`, `1440`), and three repetitions (`3 × 3 × 3 = 27`). Dispatching the browser `online` event recovered the exact committed baseline SHA in `27/27`; URL/storage/map-attempt/tier/source/rendered-signal/min-distance/location and canvas-geometry invariants remained unchanged in `27/27`. The accepted recovery and invariant enforcement are included in final Harness `12354bcf71621c00a08433faf09cbb000683ae61`.

Negative controls did not recover the cleared framebuffer: no action, `requestAnimationFrame`, map-container resize, and CSS invalidation each recovered `0/18`. Zoom-and-restore repainted but was rejected because it introduced pixel drift. Therefore only the state-neutral MapLibre online repaint path was accepted for the test-harness recovery candidate. Provenance is an independent controlled-experiment receipt sealed in the coordinator mailbox; no separate durable machine artifact was retained, so this result is supporting investigation evidence rather than a final-gate artifact.

### Independent natural-run statistics

An independent no-update run on the same pre-finalization candidate exercised all `14` map-backed cases at all six frozen widths for five repetitions (`14 × 6 × 5 = 420`). Result: `420/420 actual PASS`, with `280/280` executions covered by the map paint guard and `140/140` non-guard executions; no natural blank timeout occurred. Machine result: `/private/tmp/ondo-blank-audit.RV4AJR/wt/k-tour-id-app/artifacts/qa/playwright/results.json` (SHA-256 `799573c039390be3d55879b15a64ef740799577ea3a717c54687fb89b021807c`); per-run traces: sibling `/private/tmp/ondo-blank-audit.RV4AJR/wt/k-tour-id-app/artifacts/qa/map-blank-stats/`.

### Final helper acceptance

Harness `12354bcf71621c00a08433faf09cbb000683ae61` was accepted without a product-source delta. Its targeted receipt is:

| Check | Result |
|---|---|
| Production build after helper integration | `PASS` |
| Forced WebGL blank recovery with unchanged state/geometry and exact baseline | `1/1 PASS` |
| Compact `360×800` Place Peek repetition | `30/30 PASS` |
| Affected production map-backed matrix | `840/840 PASS` |
| Independent helper-integrity review | `CLEAN · S0 0 · S1 0 · S2 0` |

Recovery is limited to a rendered MapLibre state whose captured paint receipt is blank or underpainted. A zero rendered-signal readiness receipt is never repaired synthetically; a painted strict mismatch fails immediately; recovery is capped at three state-neutral attempts; and URL, storage, map readiness, location, viewport, and canvas geometry must remain identical. These targeted checks qualify the final helper; the exact-HEAD full nonpixel and uninterrupted `276/276` no-update gates below passed separately.

## Automated gate receipt — PASS

| Gate | Current state |
|---|---|
| Frozen install | `PASS · 2s` |
| Discovery | `B 482 tests / 28 files · A 22 tests / 3 files` |
| TypeScript | `PASS · 5s` |
| Webpack production build | `PASS · 28/28 routes · 21s` |
| Contracts | `26/26 PASS · 0 fail/skip/error · 1.210s` |
| B E2E | first run, workers 1, retries/reruns 0: `408 PASS + 74 intentional project/viewport skips · 0 fail/flaky/error · 1191.584s` |
| A regression | first run, workers 1, retries/reruns 0: `22/22 PASS · 0 skip/fail/flaky/error · 53.242s` |
| Routes and runtime | `/ondo-b 200 · /ondo 200` before and after; server/runtime/Playwright result errors `0` |
| Pixel baseline | first uninterrupted no-update run, workers 1, retries 0: `276/276 PASS`; each of six widths `46/46`; no first failure or tail rerun |
| High-risk pixel repetition | required `10 cases × 6 widths × repeat 3 = 180/180 PASS`; receipt-preservation mobile extra `30/30 PASS`; executed total `210/210` |
| Visual assertions | retained map-paint receipts `159/159`, recovery attempts `0`; runtime/Axe/geometry/modal/map failures `0` |
| Post-run integrity | digest unchanged at `4cfbed3b2f2fba3d7813e0c3ff6a160bfcec9605c947d84d1bc35f73e97c314b`; tracked worktrees clean; product-source diff after Product boundary empty |

Nonpixel machine evidence is in `/private/tmp/ondo-r4-nonpixel-12354bc.aBY7Gc/evidence/`; `sha256sums.txt` has SHA-256 `d1b729ef0b9bd2a4b2f7e5f0e259e79ec8adb360b5e850d97b6157b099554578`. Its B JSON/JUnit hashes are `ffb28e5b3bca652ebc2b891164923ef9cc6487dffa0c5d73d445f9ec00d2a35d` / `87e6a57682a0d78f266d7aea507f50d84af50f68f9a7582b7b96d5682ff9bc5e`; A JSON/JUnit hashes are `9e21a9f87cb2e1921ff2d1beb893c691a859c948211c845a4443963e0a289229` / `c7521628dcd0fb0dae65bd88f4f6043ad379886e59f6fcb901ad811a7b4eb87c`.

Visual machine evidence is rooted at `/private/tmp/ondo-r4-final-visual.TM78re`. Retained high-risk JSON receipts are `/private/tmp/ondo-r4-final-visual-12354bc-highrisk-desktop-responsive-repeat3.json` (SHA-256 `2749e11295ac843cfc53b386a56bc8720b636616161931ccfb2573918a0699c5`) and `/private/tmp/ondo-r4-final-visual-12354bc-highrisk-mobile-repeat3-receipt.json` (SHA-256 `5e7f0420f04d277241109f16efa984ecbc7d3b248a76e66b21171885198200c5`). Their JUnit hashes are `4b489dcdefec2ab9d286ce2f6a9ad59d9bf006135190879dc06d9fa0ef6c092f` and `8d0079ff0c405fd00da8688f0f79d32c35cbabd3501c932330ead277ccaafef4`.

Targeted tests, issue-scoped baseline approvals, and preflight runs did not close this table by themselves. The two independent exact-tuple final gate receipts above establish `FULL AUTOMATED GATE PASS`; R5 is `READY TO START`.

## Fix, review, and deployment state

- Historical R4: `5/5 COMPLETE · NOT CLEAN`.
- Current frozen successor: `12/12 FIXED AND AUTOMATED · REVIEWER CLOSURE PENDING`.
- Next round: `R5 READY TO START`.
- Clean streak: `0/2`.
- Deployment: `NOT DEPLOYED`.

After final automated acceptance, five fresh blind reviewers must inspect this exact Product/Harness/digest tuple in R5. Only an R5 `5/5 CLEAN` can produce `1/2`; a second fresh R6 `5/5 CLEAN` on the identical tuple is required for `2/2`. Any product, harness, or baseline change invalidates those verdicts.
