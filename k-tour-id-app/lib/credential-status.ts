import type { CredentialStatus, KPassCapsule } from "@/lib/types"

export type EffectiveCredentialStatus = CredentialStatus | "missing"

/** One client-side policy for every screen that gates K-Tour ID access. */
export function effectiveCredentialStatus(capsule?: KPassCapsule | null, now = Date.now()): EffectiveCredentialStatus {
  if (!capsule) return "missing"
  if (capsule.status === "revoked" || capsule.status === "suspended") return capsule.status
  const expiry = Date.parse(capsule.expiresAt)
  if (capsule.status === "expired" || !Number.isFinite(expiry) || expiry <= now) return "expired"
  return capsule.status
}

export function isCredentialUsable(capsule?: KPassCapsule | null, now = Date.now()) {
  const status = effectiveCredentialStatus(capsule, now)
  return status === "active" || status === "expiring"
}

export function credentialDaysRemaining(capsule?: KPassCapsule | null, now = Date.now()) {
  if (!capsule) return 0
  const expiry = Date.parse(capsule.expiresAt)
  if (!Number.isFinite(expiry)) return 0
  return Math.max(0, Math.ceil((expiry - now) / 86_400_000))
}
