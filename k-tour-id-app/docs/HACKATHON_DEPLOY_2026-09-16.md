# Hackathon demo deployment record (2026-09-16)

Production: https://ktourid.vercel.app (ondo-hackathon-demo.vercel.app 308-redirects here)  
Branding: `main` (K-Tour ID logo/name, TG request from @woogieboogie_jl) merged into the hackathon branch on 2026-09-16 (PR #1 on the fork); the demo perk copy is "K-Tour ID 체험 혜택".  
Autopilot: `/?hk=auto` (runs to 사용 확정 + OmniOne 기록), `/?hk=auto-execute` (stops after Sui 실행), or the floating "전체 플로우 자동 실행" button.

## Hosting
| Item | Value |
| --- | --- |
| Vercel account / project | jshan94 (Hobby) / `ondo-hackathon-demo` (prj_5WoZ9asTIeP3aIpSAqTEXDWkuC1n) |
| Git source | fork `JSHan94/k-tour-id`, production branch `feat/hackathon-integration-harvey`, root `k-tour-id-app` |
| Build | `vercel.json` → `pnpm build:vercel:hackathon` (= `next build`, full app). `"type": "module"` removed from package.json (Vercel launcher ERR_REQUIRE_ESM). |
| Store | Upstash Redis `ondo-hackathon-redis` (Vercel Marketplace, free, iad1) via `KV_REST_API_URL/TOKEN`; single JSON blob key `ondo:hackathon:journey:v1` with NX lock. File store remains the local fallback. |
| Deploy hook | see Project → Settings → Git → Deploy Hooks (`hackathon-redeploy`) |

## Keys and accounts (demo-only, leak-tolerant)
| Service | Mode | Where it lives | Notes |
| --- | --- | --- | --- |
| Sui Testnet | live | issuer/sponsor `0x8d88…4c45`, agent `0xad93…1a05` | package `0xc5d2…975d`, campaign `0xe3fc…cf16`. Sponsor held ~0.95 SUI; ~0.01 SUI per run. Top up at faucet.sui.io when low. |
| OmniOne Chain | stage (201210) | registry `0x696b…0e4c` | audit anchor per redemption; confirmed in every test run |
| Google OAuth (zkLogin) | live | GCP project `ondo-hackathon-demo` (allround.llm.6@gmail.com), client `ondo-zklogin-web` = `282567116445-lfm88bl1n90jklcne6lev5i88flv1mv7.apps.googleusercontent.com` | Consent screen in Testing mode: only test users allround.llm.6 / harveyhazel0704 / saw151515 can sign in. Redirects: localhost:3000 and ondo-hackathon-demo.vercel.app `/hackathon/zklogin/callback`. |
| Enoki (zkLogin salt + prover) | live | portal app "ondo hackathon demo" (allround.llm.6), public key `ENOKI_API_KEY` | Required on Testnet: prover-dev proves against the Devnet VK (validators reject with "Groth16 proof verify failed"). Adapter falls back to dev prover only when the key is unset. |
| CX Mobile ID / OpenDID | mock | – | one synthetic person per operation (`sample-<operationId>`) so the demo can be replayed |
| Gemini | not set (rule fallback) | – | Google blocked key creation for the automated session ("request is suspicious"); the Cloud-Console key on the demo project is denied by Gemini. Create one manually in AI Studio and set `GEMINI_API_KEY` + `GEMINI_MODEL=gemini-3.6-flash` if wanted. |

## Behaviour changes in this branch
- Autopilot effect in `hackathon-layer-b.tsx` drives every phase; pauses on error/real-provider handoff; auto-reconciles the OmniOne outbox.
- `lib/hackathon/store.ts`: Redis (Upstash REST) or file backend; `readStore` is async; 3-day pruning.
- `lib/hackathon/session.ts`: adopts a well-formed but unknown session cookie instead of minting a new one (fixes parallel first-request cookie races). Client calls `POST /sessions` before parallel bootstrap calls.
- `adapters/sui.ts`: waits for fullnode indexing after each execute and retries `getObject` (fixes "Object … not found" right after issuing the Entitlement).
- `adapters/zklogin.ts`: Enoki path (salt + zkp) when `ENOKI_API_KEY` is set.
- `service.ts` delegationPrepare: zkLogin wallet-proof verification cross-checks via Sui GraphQL before rejecting (gRPC verifier mismatch on Testnet is a known issue).
- `demo-entitlements` only resumes pending operations; finished ones are no longer re-shown.
- `next.config.mjs`: `HK_BUILD_IGNORE_TS=1` escape hatch for type-only build breaks.
