# ONDO B production-final manifest

Status: AUTOMATED EVIDENCE PASS · EVIDENCE SEALED · NOT DEPLOYED

## Candidate identity

| Component | Exact identity | Result |
|---|---|---|
| Product | `4ec64b3de02fdd8f5298a38dde0c84f47eaa3dc6` | SEALED |
| Product tree | `0ccf400f61d264e5084862510cee140e3d9786d1` | SEALED |
| Visual Harness | `697fdd4dc4af13e35b68c78bbcbd127b306a4291` | SEALED |
| Visual Harness tree | `7b9944afe0e0608e766bb5ce5162bfab9e6ddb0e` | SEALED |
| Central Harness+PNG | `eb74454b527445f52322eff0af48e6b703681e16` | SEALED |
| Central Harness+PNG tree | `47f1a618fa725aad20d84b52b0e8786e2c273989` | SEALED |
| Visual no-update | 124 passed; 0 skipped/unexpected/flaky | PASS |
| Visual manifest | [124-row TSV](./evidence/visual/inspection/manifest.tsv) | VERIFIED |
| Visual ledger | [ledger](./evidence/visual/inspection/ledger.json) | SEALED SOURCE COPY |
| Nonpixel evidence | [authoritative manifest](./evidence/nonpixel/00-MANIFEST.json) | PASS |
| Hosting/deployment | none | OUT OF SCOPE |

## Automated gate census

| Gate | Result |
|---|---|
| Frozen install | pass, one attempt |
| Typecheck | pass, one attempt |
| Optimized webpack build | pass, one attempt, 30 routes |
| Contracts | 65 passed, 0 skipped, 0 failed |
| Production B | 75 passed, 11 intentional skips, 0 failed; workers 1, retries 0 |
| Protected A | 22 passed, 0 skipped, 0 failed; workers 1, retries 0 |
| Production visual | 124 passed, 0 skipped/unexpected/flaky; no update |
| Standalone build/scan/probe | pass; 29 files, 7,133,962 bytes |
| Teardown | owned processes stopped; ports free; source worktree clean |

The production-B 11 skips are reported, not converted into passes. The health
monitor's three pre-readiness connection failures are classified separately
from the 225 successful post-ready HTTP 200 samples; there were zero failures
after first success. The standalone raw-substring scan's seven infrastructure
fragments are also preserved and classified rather than suppressed.

## Integrity anchors

- Visual TSV SHA-256:
  `20f67da63ec79f6030197271b9b41e5a5b57f082b4bb08076225f53ec9764924`.
- PNG tree-listing SHA-256 recorded by the final visual ledger:
  `64cf6dc604c0bd79d38d1957ae23808870d174b305f32e40368d213fee0fa21e`.
- Nonpixel manifest SHA-256:
  `d6d307f91f2184db007af6d501f6fc7bb34b739cb875d138e6e4518af2037fe6`.
- Nonpixel source `SHA256SUMS` SHA-256:
  `71d02218d47c0f04e8483fa460729ebaa38b7b3afda9ad6174e8542052697e4b`.

The copied nonpixel `SHA256SUMS` deliberately retains its original absolute
capture paths so its sealed bytes and supplied digest remain unchanged. Local
verification maps each line's basename to the adjacent copied file and confirms
all 32 entries.

## Verdict boundary

This is a PASS for the sealed automated visual and nonpixel gates on the exact
tuple above. It is not a deployment, production URL, Sites version, push,
human visual-review label, or business release authorization.
