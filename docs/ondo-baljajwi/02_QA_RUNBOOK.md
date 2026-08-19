# ONDO B · Real Journey QA Runbook

상태: `EXECUTABLE · PRODUCT GAP BLOCKED`

## 1. Fixed-SHA rule

1. B product를 `70b5b7b130de0fa3102bbcc6239f334c1226e8fb`로 고정한다.
2. QA branch는 제품 source/package/config를 수정하지 않는다.
3. `PLAYWRIGHT_BASE_URL`은 같은 product SHA를 serving하는 URL만 허용한다.
4. 제품 SHA가 바뀌면 결과·pixel baseline·clean streak를 모두 무효화한다.

## 2. Gate 순서

```text
G0 registry: 19 REQ, 18 FL, 126 exact checkpoint dispositions
G1 typecheck/build (product owner evidence)
G2 real browser: 18 composite journeys + 4 data/map boundaries
G3 content: 14 reachable surfaces × KO/EN
G4 a11y: 14 reachable surfaces, focus/name/44px/overflow
G5 pixel: 9 mobile + 4 desktop layout-distinct surfaces
G6 runtime: product pageerror/console 0; external map failure separately recorded
G7 5-role blind review
```

`GAP`은 skip이나 N/A가 아니다. 현재 `FL-001 ERROR/RETRY`, `FL-002 RETURN`, `FL-011 ERROR/RETRY`가 해결되기 전에는 clean이 될 수 없다.

## 3. Commands

`k-tour-id-app`에서 실행한다.

```bash
pnpm exec playwright test tests/e2e/ondo-b-registry.spec.ts --project=desktop-chromium --workers=1
pnpm exec playwright test tests/e2e/ondo-b-flow-coverage.spec.ts tests/e2e/ondo-b-product-browser.spec.ts --project=mobile-chromium --project=desktop-chromium --workers=1
pnpm exec playwright test tests/e2e/ondo-b-content.spec.ts --project=mobile-chromium --workers=1
pnpm exec playwright test tests/e2e/ondo-b-a11y-interaction.spec.ts --project=mobile-chromium --workers=1
pnpm exec playwright test tests/visual/ondo-b-flow-pixels-mobile.spec.ts --project=mobile-chromium --workers=1
pnpm exec playwright test tests/visual/ondo-b-flow-pixels-desktop.spec.ts --project=desktop-chromium --workers=1
```

## 4. Journey proof 규칙

- test title은 `B-E2E-FL-NNN`; checkpoint는 named `test.step`과 assertion으로 연결한다.
- seed는 출발 전제만 만든다. 성공/실패/취소/재시도/복귀 결과는 실제 CTA로 만든다.
- persistence 증거는 reload 뒤 같은 venue/Table/My/Labs state를 다시 찾아 확인한다.
- shared non-map은 반드시 `/ondo-b`의 nav/CTA로 진입한다.
- 외부 지도 준비를 기다리지 않아도 되는 flow는 `domcontentloaded`와 direct public venue deep-link를 쓴다.
- visible CTA를 전수 count하는 가짜 inventory 대신, 각 canonical journey가 실제 state transition을 assertion한다.

## 5. Runtime와 map fallback

- `pageerror`와 unhandled rejection은 항상 failure다.
- product document/script/fetch/xhr failure는 failure다.
- `tiles.openfreemap.org` failure는 `externalMap`, Google Fonts CDN failure는 `externalAsset` 목록에 별도 기록한다.
- 18-flow canonical suite는 OpenFreeMap tile을 의도적으로 abort해 외부 SLA를 제거한다. live tile 및 fallback/retry 동작은 `ondo-b-product-browser.spec.ts`가 별도로 소유한다.
- 외부 resource failure가 있어도 `data-map-state=error`, venue list, count, enabled item, `Retry map`이 보여야 한다.
- external failure가 있었다는 이유만으로 product runtime error를 allowlist하지 않는다.

## 6. Pixel baseline

- viewport: 390×844, 430×932, 1440×1000.
- fixed time: `2026-08-19 20:30 KST`; animation/caret off.
- OpenFreeMap canvas만 `#EAE6DD`로 mask 가능하다.
- marker/legend/list/place sheet/nav/error/retry/focus는 mask 금지다.
- 첫 baseline은 Visual reviewer가 실제 screen과 대조 후 issue ID와 함께 승인한다.
- 전체 `--update-snapshots` 일괄 승인은 금지한다.

## 7. 5인 blind review

| 역할 | 질문 |
|---|---|
| UX/IA | 실제 entry→decision→recovery→return이 맥락을 보존하는가 |
| Visual | 발자취형 절제, hierarchy, heat encoding이 모든 surface에 일관적인가 |
| Data/Content | sourced/simulated/unknown/stale/browser-local 경계와 KO/EN이 정직한가 |
| Traveler | 한국 지명 없이 식음료를 찾고 JIT gate를 회복할 수 있는가 |
| Business/PO | 외국인-first F&B pulse와 DID의 JIT 역할이 제안서와 맞는가 |

각 역할은 다른 reviewer 결과를 보기 전에 독립 제출한다. S0/S1은 단일 재현으로 block, 객관적 S2도 단일 재현으로 actionable, 주관적 S2는 2인, S3는 token 위반 또는 3/5 합의부터 actionable이다.

## 8. 종료 조건

Clean round는 같은 product SHA에서 다음을 모두 만족한다.

- registry/browser/content/a11y/pixel 명령 실패·unexpected skip 0
- exact disposition이 `ACTUAL` 또는 정당한 `N/A`; `GAP` 0
- product runtime error 0; external map failure 시 fallback assertion PASS
- unresolved actionable S0/S1/S2 0
- truth/privacy/a11y regression 0
- 5/5 blind submission 완료, 새 actionable 0
- 증거 checksum과 product SHA 기록

동일 product SHA에서 위 조건을 **두 번 연속** 만족해야 종료한다. 목표는 literal 의견 0이 아니라 `zero unresolved actionable issues`다.
