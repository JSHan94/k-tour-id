// Shared Gemini (Generative Language API) caller. Prefers smarter models, falls
// back if a key lacks one (404), caches the first working model, supports
// multi-turn history, and passes the key in a header (not the URL). Server-only.

const CANDIDATES = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-pro", "gemini-1.5-flash"]
let cachedModel: string | null = null

export interface GeminiTurn {
  role: "user" | "model"
  text: string
}
export interface GeminiResult {
  reply?: string
  error?: string
}

export async function geminiGenerate(opts: {
  key: string
  system: string
  message: string
  history?: GeminiTurn[]
  maxOutputTokens?: number
  temperature?: number
}): Promise<GeminiResult> {
  const models = [process.env.GEMINI_MODEL, cachedModel, ...CANDIDATES].filter((m): m is string => !!m)
  const seen = new Set<string>()
  const contents = [
    ...(opts.history ?? []).map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: "user", parts: [{ text: opts.message }] },
  ]
  let lastErr = "no model tried"

  for (const model of models) {
    if (seen.has(model)) continue
    seen.add(model)
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": opts.key },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: opts.system }] },
          contents,
          generationConfig: {
            maxOutputTokens: opts.maxOutputTokens ?? 700,
            temperature: opts.temperature ?? 0.4,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const reply: string =
          data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ?? ""
        if (reply.trim()) {
          cachedModel = model // remember the working model → no repeat 404s
          return { reply }
        }
        lastErr = `empty reply from ${model}`
        continue
      }
      const body = await res.text().catch(() => "")
      lastErr = `${res.status} ${model}: ${body.slice(0, 180)}`
      if (res.status !== 404) break // 400/403/429/5xx won't be fixed by another model
    } catch (e) {
      lastErr = `${model}: ${e instanceof Error ? e.message : "fetch failed"}`
    }
  }
  return { error: lastErr }
}
