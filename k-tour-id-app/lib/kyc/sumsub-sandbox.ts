// Server-only Sandbox adapter. Never import this module from a client component.
// Upstream Sumsub owns durable applicant state; this limited preview does not
// issue credentials, grant entitlements, or represent production KYC.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto"

export type SandboxConfig = { appToken: string; secretKey: string; sessionSecret: string; accessCode: string; levelName: string; origins: string[] }
export type SandboxSession = { version: 1; environment: "sandbox"; externalUserId: string; levelName: string; audience: string; issuedAt: number; expiresAt: number }
export type SandboxStatus = "access_required" | "not_started" | "in_progress" | "pending" | "approved" | "retry" | "rejected" | "expired" | "unavailable"
export const SESSION_TTL_MS = 30 * 60 * 1000
export const SESSION_COOKIE = "ktour_sumsub_sandbox"

export class SandboxError extends Error {
  constructor(public code: string, public status = 503) { super(code) }
}

export function readSandboxConfig(env: Record<string, string | undefined> = process.env): SandboxConfig | null {
  if (env.SUMSUB_MODE !== "sandbox" || env.NEXT_PUBLIC_ONDO_SUMSUB_SANDBOX !== "1" || env.VERCEL_ENV === "production") return null
  const { SUMSUB_APP_TOKEN: appToken, SUMSUB_SECRET_KEY: secretKey, SUMSUB_SESSION_SECRET: sessionSecret, SUMSUB_PREVIEW_ACCESS_CODE: accessCode } = env
  const levelName = env.SUMSUB_LEVEL_NAME
  if (!appToken?.startsWith("sbx:") || !secretKey || !sessionSecret || sessionSecret.length < 32 || !accessCode || accessCode.length < 16 || !levelName || !/^[a-zA-Z0-9_-]{1,100}$/.test(levelName)) return null
  const origins = (env.SUMSUB_ALLOWED_ORIGINS ?? "").split(",").filter(Boolean).flatMap((value) => {
    try {
      const u = new URL(value.trim())
      return u.origin === value.trim() && !u.hostname.includes("*") && (u.protocol === "https:" || (env.NODE_ENV !== "production" && u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname))) ? [u.origin] : []
    } catch { return [] }
  })
  // Vercel supplies this for this deployment, not a client-selected Host value.
  if (env.VERCEL_ENV === "preview" && env.VERCEL_URL && /^[a-zA-Z0-9.-]+\.vercel\.app$/.test(env.VERCEL_URL)) origins.push(`https://${env.VERCEL_URL}`)
  if (!origins.length) return null
  return { appToken, secretKey, sessionSecret, accessCode, levelName, origins }
}

function sessionKey(secret: string) { return createHash("sha256").update(`ktour-sumsub-sandbox-v1:${secret}`).digest() }
export function sealSession(session: SandboxSession, secret: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", sessionKey(secret), iv)
  cipher.setAAD(Buffer.from("ktour-sumsub-sandbox:v1"))
  const data = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url")
}

export function unsealSession(value: string | undefined, config: SandboxConfig, audience: string, now = Date.now()): SandboxSession | null {
  if (!value || value.length > 2048 || !/^[a-zA-Z0-9_-]+$/.test(value)) return null
  try {
    const bytes = Buffer.from(value, "base64url")
    if (bytes.length < 29) return null
    const decipher = createDecipheriv("aes-256-gcm", sessionKey(config.sessionSecret), bytes.subarray(0, 12))
    decipher.setAAD(Buffer.from("ktour-sumsub-sandbox:v1"))
    decipher.setAuthTag(bytes.subarray(12, 28))
    const s = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8")) as SandboxSession
    return s.version === 1 && s.environment === "sandbox" && s.levelName === config.levelName && s.audience === audience
      && /^ktour-sbx-[0-9a-f-]{36}$/.test(s.externalUserId) && Number.isSafeInteger(s.issuedAt) && Number.isSafeInteger(s.expiresAt)
      && s.issuedAt <= now && s.expiresAt > now && s.expiresAt - s.issuedAt === SESSION_TTL_MS ? s : null
  } catch { return null }
}

export function createSession(config: SandboxConfig, audience: string, now = Date.now()): SandboxSession {
  return { version: 1, environment: "sandbox", externalUserId: `ktour-sbx-${randomUUID()}`, levelName: config.levelName, audience, issuedAt: now, expiresAt: now + SESSION_TTL_MS }
}

export function matchesAccessCode(candidate: unknown, expected: string): boolean {
  if (typeof candidate !== "string" || candidate.length > 256) return false
  return timingSafeEqual(createHash("sha256").update(candidate).digest(), createHash("sha256").update(expected).digest())
}

export function assertSandboxRequest(request: Request, config: SandboxConfig, mutation: boolean): string {
  const audience = new URL(request.url).origin
  if (!config.origins.includes(audience) || request.headers.get("x-ktour-kyc") !== "1") throw new SandboxError("request_not_allowed", 403)
  const origin = request.headers.get("origin")
  if ((mutation && origin !== audience) || (origin !== null && origin !== audience)) throw new SandboxError("request_not_allowed", 403)
  const site = request.headers.get("sec-fetch-site")
  if (site && site !== "same-origin" && site !== "none") throw new SandboxError("request_not_allowed", 403)
  if (request.method === "POST" && request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new SandboxError("invalid_request", 415)
  return audience
}

export function signSumsubRequest(secret: string, timestamp: string, method: string, path: string, body = ""): string {
  return createHmac("sha256", secret).update(timestamp + method.toUpperCase() + path + body).digest("hex")
}

export async function sumsubRequest(config: SandboxConfig, path: string, method: "GET" | "POST" = "GET", body?: unknown, fetcher: typeof fetch = fetch): Promise<Record<string, unknown>> {
  // Fixed upstream origin; paths are composed exclusively in this server adapter.
  if (!path.startsWith("/resources/") || /[\r\n#]/.test(path)) throw new SandboxError("invalid_provider_path")
  const payload = body === undefined ? "" : JSON.stringify(body)
  const timestamp = String(Math.floor(Date.now() / 1000))
  let response: Response
  try {
    response = await fetcher(`https://api.sumsub.com${path}`, {
      method, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000),
      headers: { "X-App-Token": config.appToken, "X-App-Access-Ts": timestamp, "X-App-Access-Sig": signSumsubRequest(config.secretKey, timestamp, method, path, payload), ...(payload ? { "Content-Type": "application/json" } : {}) },
      ...(payload ? { body: payload } : {}),
    })
  } catch { throw new SandboxError("provider_unavailable") }
  if (!response.ok) throw new SandboxError(response.status === 404 ? "applicant_not_found" : "provider_unavailable", response.status === 404 ? 404 : 503)
  try {
    const value = await response.json()
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error()
    return value as Record<string, unknown>
  } catch { throw new SandboxError("invalid_provider_response") }
}

export function normalizeReview(value: Record<string, unknown>): SandboxStatus {
  const result = value.reviewResult as Record<string, unknown> | undefined
  if (value.reviewStatus === "completed") {
    if (result?.reviewAnswer === "GREEN") return "approved"
    if (result?.reviewAnswer === "RED" && result.reviewRejectType === "RETRY") return "retry"
    if (result?.reviewAnswer === "RED" && result.reviewRejectType === "FINAL") return "rejected"
    return "unavailable"
  }
  if (["pending", "queued", "onHold", "awaitingService"].includes(String(value.reviewStatus))) return "pending"
  // Sumsub's prechecked stage is an unfinished initial document check, not an
  // unavailable service or an approval. The SDK may still request corrections.
  // https://docs.sumsub.com/reference/get-applicant-review-status
  if (["init", "prechecked", "awaitingUser"].includes(String(value.reviewStatus))) return "in_progress"
  return "unavailable"
}

export async function readVerifiedSandboxStatus(config: SandboxConfig, session: SandboxSession, fetcher: typeof fetch = fetch): Promise<SandboxStatus> {
  if (!config.appToken.startsWith("sbx:") || session.environment !== "sandbox") throw new SandboxError("provider_binding_mismatch")
  let applicant: Record<string, unknown>
  try { applicant = await sumsubRequest(config, `/resources/applicants/-;externalUserId=${encodeURIComponent(session.externalUserId)}/one`, "GET", undefined, fetcher) }
  catch (error) { if (error instanceof SandboxError && error.code === "applicant_not_found") return "in_progress"; throw error }
  // Actual applicant responses can omit sandboxMode. Environment separation is
  // enforced by the Sandbox-only app credential, not by inventing a response
  // field. Still reject any explicitly contradictory environment marker.
  if (applicant.externalUserId !== session.externalUserId || (applicant.sandboxMode !== undefined && applicant.sandboxMode !== true) || typeof applicant.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(applicant.id)) throw new SandboxError("provider_binding_mismatch")
  // Read only the minimal review result. Never forward applicant data/images.
  const review = await sumsubRequest(config, `/resources/applicants/${encodeURIComponent(applicant.id)}/status`, "GET", undefined, fetcher)
  if (review.levelName !== session.levelName) throw new SandboxError("provider_binding_mismatch")
  return normalizeReview(review)
}

export async function readSessionBody(request: Request): Promise<Record<string, unknown>> {
  // Stream cap also applies when Content-Length is absent or falsified.
  const reader = request.body?.getReader()
  if (!reader) throw new SandboxError("invalid_request", 400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      size += next.value.length
      if (size > 1024) { await reader.cancel(); throw new SandboxError("invalid_request", 413) }
      chunks.push(next.value)
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["consent", "accessCode", "locale"].includes(key))) throw new Error()
    if (body.consent !== true || (body.locale !== undefined && !["en", "ko", "ja"].includes(body.locale))) throw new Error()
    return body
  } catch (error) { if (error instanceof SandboxError) throw error; throw new SandboxError("invalid_request", 400) }
}

export const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "X-Content-Type-Options": "nosniff", "Vary": "Cookie, Origin" }
