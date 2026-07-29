# Activating the real AI chat

The AI Benefit Router chat is **mocked** today (keyword-matched canned replies in
`lib/services/mock.ts`). The wiring for a real LLM chat is already in place and **inert** — turning it
on is a couple of env vars, no screen changes.

## What's already there
- `app/api/chat/route.ts` — server-side Route Handler. Supports **Google Gemini** (REST, no dependency)
  or **Anthropic Claude** (SDK). Returns `503` until a key is set; the key stays server-side.
- `lib/services/index.ts` → `realBenefitService.chat` — POSTs to `/api/chat`.
- `benefitService = DEMO_MODE ? mock : real` — flipping the flag swaps the whole chat path.
  `app/ai/page.tsx` needs **zero** changes (already awaits `chat()` with a "thinking…" state).

## Option A — Google Gemini (recommended, no install)
1. Get a key at <https://aistudio.google.com/apikey>.
2. Add to `.env.local` (git-ignored, server-only — **never** `NEXT_PUBLIC_*`):
   ```
   GEMINI_API_KEY=AIza...
   NEXT_PUBLIC_DEMO_MODE=false
   ```
   Optional: `GEMINI_MODEL=gemini-2.0-flash` (default).
3. Restart `pnpm dev` (or set the same vars in Vercel → Project → Settings → Environment Variables, then redeploy).

That's it — the route calls Gemini's `generateContent` REST endpoint directly; no package to install.

## Option B — Anthropic Claude
1. `pnpm add @anthropic-ai/sdk`
2. `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...` + `NEXT_PUBLIC_DEMO_MODE=false`
3. Restart / redeploy. (Model `claude-opus-4-8`.)

If both keys are set, **Gemini wins**.

## Notes
- `NEXT_PUBLIC_DEMO_MODE=false` makes ALL services use the `real*` adapters; only `chat` is implemented,
  so identity/wallet/etc. would throw. To keep everything else mocked while ONLY the chat goes live,
  add a dedicated flag (e.g. `NEXT_PUBLIC_AI_LIVE`) and gate just `benefitService.chat` in
  `lib/services/index.ts`.
- Non-streaming JSON is fine for the demo (short replies). For token streaming, switch the handler to
  the provider's streaming API and read it in `app/ai/page.tsx`.
- Still "no backend" in the product sense — one serverless function colocated in the app (standard
  Next.js), no DB or auth server.
