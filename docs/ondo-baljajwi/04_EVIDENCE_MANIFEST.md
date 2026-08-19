# ONDO B Evidence Manifest

상태: `QA CODE READY · RESULTS PENDING`

Fixed B product SHA: `70b5b7b130de0fa3102bbcc6239f334c1226e8fb`

RUN ID: `PENDING_EXECUTION`

## Evidence rule

결과는 `docs/ondo-baljajwi/evidence/<RUN_ID>/`에 product SHA, command, exit, project, viewport, locale, scenario, artifact checksum과 함께 저장한다. PII, secret, 사진 blob, 정확한 현재 위치는 남기지 않는다. 외부 OpenFreeMap 장애와 product runtime failure는 서로 다른 배열로 기록한다.

## Command manifest

| ID | Expected tests | Command | Status |
|---|---:|---|---|
| `B-CMD-REGISTRY-001` | 2 desktop | `playwright test tests/e2e/ondo-b-registry.spec.ts --project=desktop-chromium --workers=1` | `NOT RUN` |
| `B-CMD-FLOW-001` | 18 × 2 projects | `playwright test tests/e2e/ondo-b-flow-coverage.spec.ts --project=mobile-chromium --project=desktop-chromium --workers=1` | `NOT RUN` |
| `B-CMD-PRODUCT-001` | 4 × 2 projects | `playwright test tests/e2e/ondo-b-product-browser.spec.ts --project=mobile-chromium --project=desktop-chromium --workers=1` | `NOT RUN` |
| `B-CMD-COPY-001` | 28 mobile | `playwright test tests/e2e/ondo-b-content.spec.ts --project=mobile-chromium --workers=1` | `NOT RUN` |
| `B-CMD-A11Y-001` | 14 mobile | `playwright test tests/e2e/ondo-b-a11y-interaction.spec.ts --project=mobile-chromium --workers=1` | `NOT RUN` |
| `B-CMD-PIXEL-M-001` | 9 mobile | `playwright test tests/visual/ondo-b-flow-pixels-mobile.spec.ts --project=mobile-chromium --workers=1` | `NOT RUN` |
| `B-CMD-PIXEL-D-001` | 4 desktop | `playwright test tests/visual/ondo-b-flow-pixels-desktop.spec.ts --project=desktop-chromium --workers=1` | `NOT RUN` |

## Honest checkpoint summary

| Disposition | Count | Release meaning |
|---|---:|---|
| `ACTUAL` | 115 | real `/ondo-b` proof code exists; execution still required |
| `GAP` | 5 | clean/promotion blocker |
| `N/A` | 6 | reasoned fallback/re-evaluation contract; no fake UI |

Gaps: `B-E2E-FL-001-ERROR`, `B-E2E-FL-001-RETRY`, `B-E2E-FL-002-RETURN`, `B-E2E-FL-011-ERROR`, `B-E2E-FL-011-RETRY`.

## Result table

| Family | Expected | Passed | Failed | Unexpected skipped | Evidence/checksum |
|---|---:|---:|---:|---:|---|
| Registry | 2 | 0 | 0 | 0 | `PENDING` |
| Flow browser | 36 | 0 | 0 | 0 | `PENDING` |
| Product/data/map | 8 | 0 | 0 | 0 | `PENDING` |
| Content | 28 | 0 | 0 | 0 | `PENDING` |
| A11y | 14 | 0 | 0 | 0 | `PENDING` |
| Pixel mobile | 9 | 0 | 0 | 0 | `PENDING` |
| Pixel desktop | 4 | 0 | 0 | 0 | `PENDING` |

## External blocker record

| Evidence ID | Resource | Product fallback | Product errors | Verdict |
|---|---|---|---|---|
| `B-MAP-FALLBACK` | `tiles.openfreemap.org` intentionally aborted | list + 200 count + enabled place + Retry map required | must remain 0 | `NOT RUN` |

## Release status

`BLOCKED`: automated results are not attached and five product gaps remain. A screenshot file or slot count alone is not release evidence.
