# ONDO B · Real Journey QA Runbook

상태: `R5 COMPLETE NOT CLEAN · 3/3 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS · R5 RETRY READY TO START · CLEAN STREAK 0/2 · NOT DEPLOYED`

## 1. Fixed-tuple rule

1. R5가 검토한 historical tuple은 evidence `39687c33…`, Product `9ec3d192…`, Harness `12354bcf…`, digest `4cfbed3b…`다. Verdict는 `5/5 COMPLETE · NOT CLEAN · objective S2 3`이다.
2. Frozen retry candidate는 Product `30dcb136c697e3f57d8e3beab6ee31ea37bd1acc`, Harness/HEAD `ee19adb2a5fce5bea7e0aeb6a8caac80ca65bd2f`, digest `f1ec9b0c6a3f10f77495bda996a4eb09a30f30743eb037f4c65ad39c3c1dfe91`다. G0~G6 final receipts는 `FULL AUTOMATED GATE PASS`, R5 retry는 `READY TO START`다.
3. 제품 fix commit 뒤의 QA evidence commit은 제품 source를 수정하지 않는다.
4. `PLAYWRIGHT_BASE_URL`은 고정 product SHA를 serving하는 URL만 허용한다.
5. product, harness, 승인 baseline 중 하나라도 바뀌면 진행 중 verdict와 clean streak를 `0/2`로 되돌린다.

## 2. Gate 순서

```text
G0 registry: 19 REQ, 18 FL, 126 checkpoint dispositions
             121 ACTUAL, 5 reasoned N/A, 0 GAP
             checkpoint visual mapping = pixel | functional_only
G1 typecheck + webpack production build
G2 contracts + real browser: 18 composite journeys and data/map boundaries
G3 content/localization: reachable KO/EN surfaces
G4 a11y/interaction: focus, modal isolation, name, 44px, contrast, overflow
G5 pixel: 47 cases × 6 exact viewports = 282 committed baselines
G6 runtime: pageerror/console/requestfailed/first-party HTTP 4xx·5xx = 0
G7 historical five-role blind SLEEK R5 review = COMPLETE · NOT CLEAN
G8 retry frozen tuple five-role blind R5 closure review, only after G0~G6 PASS
G9 same retry tuple five-role blind confirmation round
```

`GAP`은 skip이나 N/A가 아니다. 현재 registry는 `0 GAP`이지만, 실제 여정 증거가 깨지면 즉시 GAP으로 되돌린다.

## 3. Commands

`k-tour-id-app`에서 같은 production server를 띄운 뒤 실행한다.

```bash
pnpm typecheck
pnpm exec next build --webpack
pnpm test:contracts
PLAYWRIGHT_BASE_URL=http://127.0.0.1:<PORT> pnpm test:e2e:b
PLAYWRIGHT_BASE_URL=http://127.0.0.1:<PORT> pnpm test:visual:b
```

통합 명령은 `PLAYWRIGHT_BASE_URL`을 같은 server로 지정한 `pnpm qa:b`다. 최종 receipt에는 실제 URL/port, product SHA, harness SHA, baseline digest, 각 명령 exit code와 결과 수를 남긴다.

## 4. Journey proof 규칙

- test title은 `B-E2E-FL-NNN`인 18개 composite journey다.
- checkpoint 126개는 machine registry의 exact ID/disposition과 proof assertion에 연결한다.
- composite journey의 grouped `test.step`이 모든 checkpoint ID와 1:1 exact 이름이라고 과장하지 않는다.
- seed는 출발 전제만 만든다. 성공/실패/취소/재시도/복귀 결과는 실제 CTA와 state transition으로 만든다.
- persistence 증거는 reload 뒤 같은 venue/Table/My/Labs state를 다시 찾아 확인한다.
- shared non-map은 반드시 `/ondo-b`의 nav/CTA로 진입한다.
- visible CTA를 전수 count하는 inventory만으로 flow proof를 대체하지 않는다.

## 5. Runtime와 map fallback

- runtime guard가 설치되지 않은 테스트는 clean으로 판정하지 않는다.
- `pageerror`, unhandled rejection, first-party request failure와 HTTP `4xx/5xx`는 failure다.
- `tiles.openfreemap.org`와 허용된 외부 asset failure는 별도 evidence로 분류하되 product failure를 숨기는 allowlist로 쓰지 않는다.
- canonical flow는 외부 basemap SLA를 격리하고, dedicated map test가 live/failure 경계를 소유한다.
- 지도 장애 때 `data-map-state=error`, 동일 venue list/count, enabled item, Retry가 실제로 보여야 한다.

## 6. Pixel baseline

- exact viewport: `360×800`, `390×844`, `430×932`, `768×1024`, `801×1000`, `1440×1000`.
- registry: `47 cases`, `45 distinct state IDs`, `282 PNG target`.
- fixed time: `2026-08-19 20:30 KST`; local fonts ready; animation/transition/caret/smooth scroll off.
- 외부 vector basemap만 deterministic empty source로 대체한다.
- ONDO marker/cluster/label, legend, list, sheet, nav, error/retry, focus, truth copy는 mask하지 않는다.
- 모든 126 checkpoint는 `pixel` 또는 사유 있는 `functional_only` disposition을 가진다.
- baseline 변경은 issue 단위로 승인하며 blanket `--update-snapshots`를 release evidence로 인정하지 않는다.
- 282 PNG가 모두 git tracked이고 정확한 viewport dimension을 가질 때만 baseline을 freeze한다.
- Retry digest는 `f1ec9b0c…`, `18 R5-FIX + 264 R5-CARRY`, `47×6` inventory다. Exact uninterrupted workers-1 no-update `282/282`, high-risk `216/216`, landscape `2/2`, nonpixel B `420+84/504`, A `22/22`가 통과했다.

## 7. Five-role blind review

| 역할 | 질문 |
|---|---|
| D1 Visual Art Director | 발자취 원리의 번역, 위계, 여백, typography, cartography, heat focal point가 일관적인가 |
| D2 Interaction & IA | entry→decision→cancel/error/retry/terminal/return이 맥락을 보존하는가 |
| D3 Inclusive & Responsive | 여섯 viewport, touch, keyboard, focus, contrast, KO/EN wrapping이 안전한가 |
| D4 Content & Truth | sourced/simulated/unknown/stale/browser-local 경계가 읽히고 정직한가 |
| D5 Traveler Service | 첫 방문자가 F&B를 발견하고 필요한 JIT gate 뒤 원 작업으로 복귀하는가 |

각 역할은 다른 reviewer 결과를 보기 전에 동일 frozen pack을 독립 검토한다. `S0/S1`과 측정 가능한 `S2`는 단일 재현으로 actionable이다. 주관적 aesthetic `S2`는 동일 fingerprint 2/5, `S3`는 token 위반 또는 3/5 합의부터 actionable이다. Truth/privacy/a11y finding은 다수결로 폐기하지 않는다.

## 8. 종료 조건

Clean round는 같은 product+harness+baseline tuple에서 다음을 모두 만족한다.

- registry/browser/content/a11y/runtime/pixel 명령 실패와 unexpected skip 0
- `121 ACTUAL · 5 N/A · 0 GAP`, checkpoint mapping 126/126
- 282/282 no-update pixel PASS와 committed baseline census PASS
- product runtime error 0; 외부 map failure의 usable fallback PASS
- unresolved actionable `S0/S1/S2=0`
- truth/privacy/a11y regression 0
- reviewer coverage receipt `5/5 COMPLETE`
- reviewer 원문, issue closure, 명령 log, checksum과 frozen tuple 기록

동일 tuple에서 위 조건을 **두 번 연속** 만족해야 종료한다. R5 reviewed tuple은 `5/5 COMPLETE · NOT CLEAN`, objective S2 세 건이다. Retry candidate는 `3/3 FIXED AND AUTOMATED · FULL AUTOMATED GATE PASS`; R5 retry는 `READY TO START`, clean streak는 `0/2`, 배포 상태는 `NOT DEPLOYED`다.
