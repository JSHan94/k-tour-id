# ONDO B · Final Evidence Index

상태: `AUTOMATED GATES PASS · REVIEW ROUNDS IN PROGRESS`

| Field | Value |
|---|---|
| Product SHA | `0cc65f2793ca7a17f59397b1e9e0391f281f9649` |
| Harness SHA | `8b0060ff6f371402eb2c9d8766461b50f57e4742` |
| Baseline digest | `f37ac108b1a7814f747e9e5c89b804ad15b258df29d1958b59da7656ea8725fc` |
| Route | `/ondo-b` |
| Base URL | `http://127.0.0.1:3130` production build |
| Browser projects | `mobile-chromium 390×844`, `desktop-chromium 1440×1000` |

## Final automated result

| Evidence family | Result | What it proves |
|---|---:|---|
| TypeScript | `PASS` | compile contract |
| Next production build | `PASS` | `/ondo-b`, venue API and all existing routes build |
| Contracts | `26/26 PASS` | identity/returnTo/truth/asset/visit/bridge + venue 200/200/provenance/After19 night-only set |
| Canonical Flows | `36/36 PASS` | FL-001~018 × mobile/desktop |
| Pixel | `88/88 PASS` | 44 states × mobile/desktop; `88` opposite-project intentional skips |
| Accessibility | `28/28 PASS` | 14 actual surfaces × mobile/desktop |
| Content/map/product/regression/registry | `102/102 PASS` | KO/EN 14 surfaces, map truth, 400 data, R3 geometry, exact registry |
| Product gaps | `0` | `121 ACTUAL · 0 GAP · 5 reasoned N/A` |

## Command ledger

| ID | Command scope | Result |
|---|---|---|
| `B-FINAL-BUILD` | `next build --webpack`, then `pnpm typecheck` | `PASS` |
| `B-FINAL-CONTRACT` | `pnpm test:contracts` | `26/26 PASS` |
| `B-FINAL-FLOW` | `ondo-b-flow-coverage.spec.ts --workers=1` | `36/36 PASS` |
| `B-FINAL-PIXEL` | mobile+desktop complete pixel specs, `--workers=1` | `88/88 PASS · 88 intentional skip` |
| `B-FINAL-A11Y` | `ondo-b-a11y-interaction.spec.ts --workers=1` | `28/28 PASS` |
| `B-FINAL-SUPPORT` | content, map truth, product, R3 regression, registry specs | `102/102 PASS` |

모든 browser run은 console/pageerror guard를 제품 오류와 외부 지도 오류로 구분한다. map failure case에서는 OpenFreeMap을 의도적으로 중단하고 같은 200개 목록, Retry, usable card가 유지되는지 확인한다.

## Pixel evidence contract

- Baseline 수: mobile `44`, desktop `44`.
- Capture는 font·animation·caret·scroll을 고정한다.
- 허용치는 platform antialias noise용 `maxDiffPixels=32`; 제품 layout/copy 변화는 이 범위를 크게 초과한다.
- third-party vector tile만 deterministic blank source로 교체한다.
- ONDO marker, neutral cluster, label, sheet, navigation, truth copy, focus/geometry는 mask하지 않는다.
- 각 case는 horizontal overflow, clipping, nav collision, viewport exit CTA, 44px control, 12px metadata, accessible name, serious/critical Axe issue를 검사한다.

## Data evidence

| Item | Exact result |
|---|---:|
| Canonical official venues | `400` |
| Seoul / Busan | `200 / 200` |
| Unique stable IDs | `400` |
| Simulated ONDO signal places | `80` (`40 / 40`) |
| After19 simulated subset | `17` (`서울 7 / 부산 10`), signal category=`night` only |
| Official source promoted to heat/open-now | `0` |
| Unknown fact fabricated as confirmed | `0` |

## Truth boundary

- 공식 장소 400과 simulated signal 80은 별도 provenance다.
- confidence는 pseudo-precise percentage가 아니라 `Limited/Moderate/Strong · Simulated` band다.
- Residence credential 경로의 문서화와 데모 provider 미구성을 구분한다.
- visit/stamp는 deterministic simulated record이며 GPS·QR·merchant proof가 아니다.
- OpenDID/EAS, merchant trait는 `CONTRACT_ONLY`; live EAS, AMM, real bridge/payment/NFT는 `DEFERRED`다.

## Durable round manifests

- R3: [`evidence/RUN-20260819-R3-FINAL/manifest.md`](./evidence/RUN-20260819-R3-FINAL/manifest.md)
- R4: [`evidence/RUN-20260819-R4-FINAL/manifest.md`](./evidence/RUN-20260819-R4-FINAL/manifest.md)

두 파일은 각 5인 독립 review가 끝난 뒤 reviewer verdict와 evidence digest를 고정한다. 제품 또는 harness가 바뀌면 두 round를 모두 무효화하고 clean streak를 0으로 되돌린다.
