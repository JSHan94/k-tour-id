# SLEEK-R5-RETRY · successor candidate manifest

상태: `FULL AUTOMATED GATE PASS · BLIND CLEAN ROUND READY · CLEAN 0/2 · NOT DEPLOYED`

이 manifest는 SLEEK-R5-RETRY 다섯 reviewer의 **원 verdict를 바꾸지 않고**, 그 raw finding을 수정한 후속 candidate를 인덱싱한다. 현재 문서는 자동 합격이나 reviewer CLEAN을 선언하는 receipt가 아니다.

## 1. Reviewed source tuple

| Field | Frozen value |
|---|---|
| Evidence candidate | `b0d25fe634d9d50a8668501f0fde5f641153168b` |
| Product | `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc` |
| Harness | `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f` |
| Pixel digest | `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91` |
| Inventory | `47 cases · 45 states · 282 PNG · 121 ACTUAL · 5 N/A · 0 GAP` |
| Reviewer result | `5/5 COMPLETE · 0/5 CLEAN · raw S2 11 + S3 1 · NOT CLEAN` |

Raw S2에는 동일 원인을 독립적으로 재현한 중복이 있다: D1 desktop width와 D5 wide detail, D2 history와 D5 history. 중복을 삭제하지 않는다. Raw evidence는 reviewer가 제출한 그대로 [`reviews/`](./reviews/)와 [`coverage/`](./coverage/)에 보존한다.

## 2. Current successor tuple

| Field | Candidate value |
|---|---|
| Product boundary | `5b519e60eb7825e2573ca6692683315cbf508401` |
| Harness / frozen candidate | `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` |
| Canonical PNG digest | `1dcfacb73c4eeff6be3e3c3fca6aab2b3ae6c817366fbdac631cf877b40f21de` |
| Registry | `18 flows · 126 checkpoints · 123 ACTUAL · 3 reasoned N/A · 0 GAP` |
| Visual inventory | `50 cases · 48 distinct states · 6 exact viewports · 300 PNG` |
| Locale inventory | `33 EN + 17 KO cases per viewport`; `198 EN + 102 KO PNG` |
| Baseline provenance | `141 R5R-CARRY + 135 R5R-FIX + 6 R5R-FIX+HARNESS + 18 R5R-NEW` |
| Static discovery | B `648 tests / 39 files`; A regression `22 tests / 3 files`; contracts `27 tests / 4 files` |
| Automated gate | `FULL PASS`; exact nonpixel and visual GREEN sealed |
| Blind review | `READY`; clean streak remains `0/2` until fresh strict-blind verdicts arrive |
| Deployment | `NOT DEPLOYED` |

`baseline-files.tsv` has exactly 300 data rows and records repository-relative path, per-file SHA-256, decoded dimensions, viewport, case/state registry IDs, flows, locale, candidate status, and provenance. All six widths contain exactly 50 rows.

## 3. Raw finding closure

- [`issues.md`](./issues.md) preserves all twelve raw findings: eleven S2 and one S3.
- [`fixes.md`](./fixes.md) maps every raw finding to product, targeted-test, independent-audit, and final harness commits.
- [`frozen-receipt.md`](./frozen-receipt.md) freezes the successor boundaries and census while explicitly withholding automated PASS and blind-review readiness.
- [`baseline-files.tsv`](./baseline-files.tsv) is the 300-row candidate pixel ledger.

The implementation covers the nine consolidated S2 causes and the one S3 pointer-polish cause. Exact nonpixel and visual receipts are GREEN, but that does not close the reviewer finding: only a fresh strict-blind review of the exact current tuple can do so. That round is now ready and has not yet contributed clean credit.

## 4. Independent post-fix audit corrections

The integration audit found and corrected ten secondary defects or harness drifts before this candidate was frozen:

1. `11de6e0e686284df8d741607f8567e5379f4bd73` removed an unsupported “payment progress” reset claim and stopped clearing a key outside the proven reset partition.
2. `93b0aeeb392559e86ca5940f3f9e799693b68686` sanitized stale discovery history after a new document load and supplied a connected focus fallback for the expired-proof recovery.
3. `da149addb233275c79c1abaa8d5d5649f26a6bb7` reserved list geometry for the expiry notice instead of allowing the notice to cover results.
4. `5c098465f8675fd0cc3a115a5651c9d401773e43` made onboarding use an opaque, full-canvas backdrop at tablet boundaries while retaining a centered 430px dialog.
5. `c09168ebdaabbadd8a613db916c1b5ffbafea881` updated two stale focus-return tests to the already canonical detail → peek → city → nation traversal without changing product source.
6. `985667b1a96018e06df9fef02fdf8da6f31dcf96` plus harness `bb67f31c0479c57e8bd538cbe41ccd49b1968f96` moved the offline provenance status into safe responsive slots and removed it from pointer hit-testing.
7. Product `8f8e29c04e2be00b421be59304fbe139c2010bf5`, `9a2c06df260c8415804d3cdda8700fb02310f093`, `d4d55ca9e4d79ddfe628a175384181d8637bb726`, and `18883f67594cc2a2d0ece5aab1880a41869ffd0e`, with harness `06d035a8010696fb71fbb719ef3c4377825be3fe`, `6e95cfe4f64be12bb8322b2eaa9495ff01d9e015`, and `377693b3d9a699e1c0860c9621e349ad1e223a7f`, keep owned discovery Back/Forward transitions inside the hydrated B document while offline and harden guard lifecycle, first-paint timing, and focus restoration.
8. Product `8d332a3e8b49a78f013bad0a49aa0a2e5992340c` with harness `d0ce19ffe8e46b5557f402fbb73816049e83d1f6`, `759cdcc605ae7404ad0d90866ffc4a39babdec5c`, and `225e1ecd7b4959e25d074b60288f74fa0a3f22a5` makes FL-011 close a mounted detail before My and return from the saved row through canonical, private, unwindable B history without changing A.
9. Harness `7f57ec7eccdc05367298f05050a8e7815e241189` exposes delayed Gate focus ownership; Product `5b519e60eb7825e2573ca6692683315cbf508401` invalidates that pending focus when traversal has already restored its canonical target. The predecessor first full run remains historical RED; the final current-tuple automated PASS is separately sealed.
10. Test-only Harness `b68fc18fe0fffd50ddb9bf0d5ba97e5c72b1b032` gives Age Gate success and its exact terminal session-state proof an explicit 20-second bound. The prior scheduling-contaminated RED remains historical, and final current-tuple PASS is still unclaimed.

Corresponding targeted harness commits are listed in [`fixes.md`](./fixes.md). Product corrections stop at Product `5b519e6…`; test-only adjustments stop at Harness/frozen candidate `b68fc18…`. None is retroactively attributed to the old reviewed tuple.

## 5. Immutable reviewer originals

Sorted repository-relative `shasum -a 256` lines produce these aggregate checksums:

| Original set | Aggregate checksum |
|---|---|
| `SLEEK-R4/reviews + coverage` | `10c68bebb3d90af971e5fc98f7e7d6884a47707266ac95e3a71c3a5067e453a0` |
| `SLEEK-R5/reviews + coverage` | `5a5699b3c1dfb14f9ed7c11be37839d324801774a833dc6e3a529963758265e0` |
| `SLEEK-R5-RETRY/reviews + coverage` | `7e6f990a00d08f84bca0aae8679c33568af3fd7d5a81621b5cb8f48ec04ae8c0` |

No file inside those reviewer/coverage sets is modified by this successor documentation.
