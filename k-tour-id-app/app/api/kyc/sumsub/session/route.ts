import { NextRequest, NextResponse } from "next/server"
import { assertSandboxRequest, createSession, matchesAccessCode, NO_STORE_HEADERS, readSandboxConfig, readSessionBody, SandboxError, sealSession, SESSION_COOKIE, sumsubRequest, unsealSession } from "@/lib/kyc/sumsub-sandbox"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const config = readSandboxConfig()
  if (!config) return NextResponse.json({ status: "unavailable", configured: false, environment: "sandbox" }, { status: 503, headers: NO_STORE_HEADERS })
  let cookie: { value: string; expires: Date } | undefined
  let secure = true
  try {
    const audience = assertSandboxRequest(request, config, true)
    secure = new URL(audience).protocol === "https:"
    const body = await readSessionBody(request)
    let session = unsealSession(request.cookies.get(SESSION_COOKIE)?.value, config, audience)
    if (!session) {
      if (!matchesAccessCode(body.accessCode, config.accessCode)) throw new SandboxError("access_required", 401)
      session = createSession(config, audience)
    }
    // Also return the sealed binding on upstream errors, so retry reuses it.
    cookie = { value: sealSession(session, config.sessionSecret), expires: new Date(session.expiresAt) }
    const ttlInSecs = Math.min(600, Math.floor((session.expiresAt - Date.now()) / 1000))
    if (ttlInSecs < 10) throw new SandboxError("session_expired", 401)
    const result = await sumsubRequest(config, "/resources/accessTokens/sdk", "POST", { userId: session.externalUserId, levelName: session.levelName, ttlInSecs })
    if (typeof result.token !== "string" || result.token.length < 8 || result.token.length > 8192 || result.userId !== session.externalUserId) throw new SandboxError("invalid_provider_response")
    const response = NextResponse.json({ accessToken: result.token, environment: "sandbox", expiresAt: session.expiresAt }, { headers: NO_STORE_HEADERS })
    response.cookies.set(SESSION_COOKIE, cookie.value, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: cookie.expires })
    return response
  } catch (error) {
    const known = error instanceof SandboxError ? error : new SandboxError("provider_unavailable")
    const response = NextResponse.json({ status: known.code === "access_required" ? "access_required" : known.code === "session_expired" ? "expired" : "unavailable", error: known.code, configured: true, environment: "sandbox" }, { status: known.status, headers: NO_STORE_HEADERS })
    if (cookie) response.cookies.set(SESSION_COOKIE, cookie.value, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: cookie.expires })
    return response
  }
}

export async function DELETE(request: NextRequest) {
  const config = readSandboxConfig()
  if (!config) return NextResponse.json({ status: "unavailable", configured: false, environment: "sandbox" }, { status: 503, headers: NO_STORE_HEADERS })
  try { assertSandboxRequest(request, config, true) }
  catch { return NextResponse.json({ error: "request_not_allowed" }, { status: 403, headers: NO_STORE_HEADERS }) }
  const response = new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS })
  // End this browser session only. This is not deletion/revocation at Sumsub.
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "lax", path: "/", maxAge: 0 })
  return response
}
