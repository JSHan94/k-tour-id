import type { OndoBIdentitySetupSession } from "./ktour-id-setup-model-b"

export const IDENTITY_DEMO_HANDOFF_TTL_MS = 45_000
export type IdentityDemoHandoffStatus = "waiting" | "approved" | "declined" | "cancelled" | "timed_out" | "returned"
export type IdentityDemoHandoff = Readonly<{
  sessionNonce: string
  method: OndoBIdentitySetupSession["method"]
  origin: OndoBIdentitySetupSession["origin"]
  startedAt: number
  expiresAt: number
  resolvedAt: number | null
  status: IdentityDemoHandoffStatus
  sampleOnly: true
  externalProviderConnected: false
}>

/** A UI rehearsal only. No provider payload, credential or issuance authority. */
export function startIdentityDemoHandoff(session: OndoBIdentitySetupSession, reviewMode: boolean, now = Date.now()): IdentityDemoHandoff | null {
  if (!reviewMode || !Number.isFinite(now) || now < session.issuedAt || now >= session.expiresAt) return null
  return Object.freeze({ sessionNonce: session.nonce, method: session.method, origin: session.origin,
    startedAt: now, expiresAt: Math.min(session.expiresAt, now + IDENTITY_DEMO_HANDOFF_TTL_MS),
    resolvedAt: null, status: "waiting", sampleOnly: true, externalProviderConnected: false })
}

export function resolveIdentityDemoHandoff(request: IdentityDemoHandoff, decision: "approve" | "decline" | "cancel" | "timeout", sessionNonce: string, now = Date.now()): IdentityDemoHandoff {
  if (request.status !== "waiting" || request.sessionNonce !== sessionNonce) return request
  const status = !Number.isFinite(now) || now < request.startedAt || now >= request.expiresAt || decision === "timeout"
    ? "timed_out" : decision === "approve" ? "approved" : decision === "decline" ? "declined" : "cancelled"
  return Object.freeze({ ...request, resolvedAt: Number.isFinite(now) ? now : null, status })
}

/** Returning is one-shot and still does not authorize issuance. Parent consent,
 * sample checkpoints and explicit holder acknowledgement remain mandatory. */
export function returnIdentityDemoHandoff(request: IdentityDemoHandoff, sessionNonce: string, now = Date.now()): IdentityDemoHandoff {
  if (request.sessionNonce !== sessionNonce || request.status !== "approved") return request
  return Object.freeze({ ...request, status: !Number.isFinite(now) || request.resolvedAt === null || now < request.resolvedAt || now >= request.expiresAt ? "timed_out" : "returned" })
}
