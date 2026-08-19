# ONDO B Evidence Manifest

상태: `GAP CLOSURE 6/6 PASS · FULL RESULTS PENDING`

Fixed B product SHA: `7e36de257304dc057675566e7f3ef0c271528ffb`

RUN ID: `GAP_CLOSURE_20260819`

## Evidence rule

결과는 `docs/ondo-baljajwi/evidence/<RUN_ID>/`에 product SHA, command, exit, project, viewport, locale, scenario, artifact checksum과 함께 저장한다. PII, secret, 사진 blob, 정확한 현재 위치는 남기지 않는다. 외부 OpenFreeMap 장애와 product runtime failure는 서로 다른 배열로 기록한다.

## Command manifest

| ID | Expected tests | Command | Status |
|---|---:|---|---|
| `B-CMD-REGISTRY-001` | 2 desktop | `playwright test tests/e2e/ondo-b-registry.spec.ts --project=desktop-chromium --workers=1` | `2/2 PASS` |
| `B-CMD-GAP-FLOW-001` | 2 × 2 projects | `playwright test tests/e2e/ondo-b-flow-coverage.spec.ts --grep 'FL-002\|FL-011' --project=mobile-chromium --project=desktop-chromium --workers=1` | `4/4 PASS` |
| `B-CMD-GAP-MAP-001` | 1 × 2 projects | `playwright test tests/e2e/ondo-b-map-truth.spec.ts --grep 'source failure is latched' --project=mobile-chromium --project=desktop-chromium --workers=1` | `2/2 PASS` |
| `B-CMD-FLOW-001` | 18 × 2 projects | `playwright test tests/e2e/ondo-b-flow-coverage.spec.ts --project=mobile-chromium --project=desktop-chromium --workers=1` | `36/36 unique PASS; FL-018 desktop rerun after removing a redundant locator race` |
| `B-CMD-PRODUCT-001` | 4 × 2 projects | `playwright test tests/e2e/ondo-b-product-browser.spec.ts --project=mobile-chromium --project=desktop-chromium --workers=1` | `NOT RUN` |
| `B-CMD-COPY-001` | 28 mobile | `playwright test tests/e2e/ondo-b-content.spec.ts --project=mobile-chromium --workers=1` | `28/28 PASS` |
| `B-CMD-A11Y-001` | 14 mobile | `playwright test tests/e2e/ondo-b-a11y-interaction.spec.ts --project=mobile-chromium --workers=1` | `NOT RUN` |
| `B-CMD-PIXEL-M-001` | 9 mobile | `playwright test tests/visual/ondo-b-flow-pixels-mobile.spec.ts --project=mobile-chromium --workers=1` | `NOT RUN` |
| `B-CMD-PIXEL-D-001` | 4 desktop | `playwright test tests/visual/ondo-b-flow-pixels-desktop.spec.ts --project=desktop-chromium --workers=1` | `NOT RUN` |

## Honest checkpoint summary

| Disposition | Count | Release meaning |
|---|---:|---|
| `ACTUAL` | 120 | real `/ondo-b` proof code exists; gap closure subset executed |
| `GAP` | 0 | no known product-flow checkpoint gap |
| `N/A` | 6 | reasoned fallback/re-evaluation contract; no fake UI |

Closed in targeted browser evidence: `B-E2E-FL-001-ERROR`, `B-E2E-FL-001-RETRY`, `B-E2E-FL-002-RETURN`, `B-E2E-FL-011-ERROR`, `B-E2E-FL-011-RETRY`.

## Result table

| Family | Expected | Passed | Failed | Unexpected skipped | Evidence/checksum |
|---|---:|---:|---:|---:|---|
| Registry | 2 | 2 | 0 | 0 | `terminal output · GAP_CLOSURE_20260819` |
| Flow browser | 36 | 36 | 0 | 0 | `35 initial + FL-018 desktop rerun on same product SHA after test-only race fix` |
| Product/data/map | 8 | 2 | 0 | 0 | `dedicated fallback/retry subset; remaining 6 pending` |
| Content | 28 | 28 | 0 | 0 | `KO/EN 14 surfaces` |
| A11y | 14 | 0 | 0 | 0 | `PENDING` |
| Pixel mobile | 9 | 0 | 0 | 0 | `PENDING` |
| Pixel desktop | 4 | 0 | 0 | 0 | `PENDING` |

## External blocker record

| Evidence ID | Resource | Product fallback | Product errors | Verdict |
|---|---|---|---|---|
| `B-MAP-FALLBACK` | `tiles.openfreemap.org` intentionally aborted | error latch + usable list + Retry starts attempt 2 | 0 | `PASS mobile + desktop` |

## Release status

`BLOCKED`: five product gaps are closed, but the full automated matrix and two same-SHA clean review rounds are not attached. A targeted pass or screenshot alone is not release evidence.
