import { NextRequest, NextResponse } from "next/server"
import { assertSandboxRequest, NO_STORE_HEADERS, readSandboxConfig, readVerifiedSandboxStatus, SandboxError, SESSION_COOKIE, unsealSession } from "@/lib/kyc/sumsub-sandbox"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const config = readSandboxConfig()
  if (!config) return NextResponse.json({ status: "unavailable", configured: false, environment: "sandbox" }, { status: 503, headers: NO_STORE_HEADERS })
  try {
    const audience = assertSandboxRequest(request, config, false)
    const cookie = request.cookies.get(SESSION_COOKIE)?.value
    const session = unsealSession(cookie, config, audience)
    if (!session) return NextResponse.json({ status: cookie ? "expired" : "access_required", configured: true, environment: "sandbox" }, { headers: NO_STORE_HEADERS })
    const status = await readVerifiedSandboxStatus(config, session)
    return NextResponse.json({ status, configured: true, environment: "sandbox", checkedAt: Date.now(), expiresAt: session.expiresAt, retryAfterSeconds: 10 }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    const known = error instanceof SandboxError ? error : new SandboxError("provider_unavailable")
    return NextResponse.json({ status: "unavailable", configured: true, environment: "sandbox", error: known.code }, { status: known.status, headers: NO_STORE_HEADERS })
  }
}
