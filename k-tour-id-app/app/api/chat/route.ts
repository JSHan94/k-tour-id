// AI Benefit Router chat — server-side so the API key never reaches the client.
// Gemini only (no SDK dependency). INERT until activated: DEMO_MODE keeps the
// mock chat live (see lib/services/index.ts). Setup: docs/AI_INTEGRATION.md

import { geminiGenerate } from "@/lib/gemini"

export const runtime = "nodejs"

const SYSTEM =
  "You are the K-Tour ID AI Benefit Router, a concise concierge for visitors to Korea using a KRW stablecoin wallet. Recommend transport/food/shopping/reservation options and suggest converting leftover KRW into coupons or experience NFTs. Reply in the user's language (Korean or English), in plain text, under 60 words."

export async function POST(req: Request) {
  const gemini = process.env.GEMINI_API_KEY
  if (!gemini) {
    return Response.json({ error: "No AI key configured (set GEMINI_API_KEY)" }, { status: 503 })
  }

  let message = ""
  try {
    message = ((await req.json()) as { message: string }).message ?? ""
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 })
  }

  const out = await geminiGenerate({ key: gemini, system: SYSTEM, message, maxOutputTokens: 256, temperature: 0.7 })
  if (out.error) return Response.json({ error: out.error }, { status: 502 })
  return Response.json({ reply: out.reply })
}
