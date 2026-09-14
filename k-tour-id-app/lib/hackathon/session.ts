// Cookie session for the hackathon journey. HttpOnly + SameSite=Lax; same-origin
// enforced on mutating requests (Origin/Sec-Fetch-Site) as a CSRF guard.
import { cookies, headers } from "next/headers"
import { nowIso, randomId, HkError } from "./util"
import { withStore, readStore, type SessionRecord } from "./store"

export const HK_SESSION_COOKIE = "ondo_hk_session"

export async function assertSameOrigin() {
  const h = await headers()
  const site = h.get("sec-fetch-site")
  if (site && site !== "same-origin" && site !== "none") throw new HkError("csrf", "cross-site request rejected", 403)
  const origin = h.get("origin")
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) throw new HkError("csrf", "origin mismatch", 403)
    } catch (e) {
      if (e instanceof HkError) throw e
      throw new HkError("csrf", "bad origin", 403)
    }
  }
}

export async function getSession(): Promise<SessionRecord | null> {
  const jar = await cookies()
  const id = jar.get(HK_SESSION_COOKIE)?.value
  if (!id) return null
  return readStore((db) => db.sessions[id] ?? null)
}

export async function ensureSession(): Promise<SessionRecord> {
  const existing = await getSession()
  if (existing) {
    await withStore((db) => { db.sessions[existing.sessionId].lastSeenAt = nowIso() })
    return existing
  }
  const session: SessionRecord = { sessionId: randomId("ses", 18), createdAt: nowIso(), lastSeenAt: nowIso(), subjectRef: null }
  await withStore((db) => { db.sessions[session.sessionId] = session })
  const jar = await cookies()
  jar.set(HK_SESSION_COOKIE, session.sessionId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 })
  return session
}

export async function requireSession(): Promise<SessionRecord> {
  const s = await getSession()
  if (!s) throw new HkError("no_session", "session required", 401)
  return s
}
