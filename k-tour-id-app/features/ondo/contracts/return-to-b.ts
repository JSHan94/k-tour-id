import { isCanonicalVenueId } from "@/lib/ondo/venues/canonical-allowlist"

export const B_RETURN_TO_TTL_MS = 10 * 60 * 1000

export type BReturnToEnvelope = {
  tokenId: string
  action: "JOIN_TABLE"
  activeGate: "age"
  tableId: string
  venueId: string
  draft: string
  createdAt: string
  expiresAt: string
  consumedAt: string | null
}

const TABLE_ID = /^table-[a-z0-9-]{1,80}$/

export function createBReturnTo(input: {
  tableId: string
  venueId: string
  draft: string
  now?: Date
}): BReturnToEnvelope {
  if (!TABLE_ID.test(input.tableId) || !isCanonicalVenueId(input.venueId)) throw new Error("Invalid public Table return context")
  const now = input.now ?? new Date()
  const createdAt = now.toISOString()
  return {
    tokenId: `RT-B-JOIN_TABLE-${now.getTime()}`,
    action: "JOIN_TABLE",
    activeGate: "age",
    tableId: input.tableId,
    venueId: input.venueId,
    draft: input.draft.trim().slice(0, 280),
    createdAt,
    expiresAt: new Date(now.getTime() + B_RETURN_TO_TTL_MS).toISOString(),
    consumedAt: null,
  }
}

export function isBReturnToUsable(returnTo: BReturnToEnvelope | null, now = new Date()) {
  if (!returnTo) return false
  const createdAt = new Date(returnTo.createdAt).getTime()
  const expiresAt = new Date(returnTo.expiresAt).getTime()
  return returnTo.action === "JOIN_TABLE"
    && returnTo.activeGate === "age"
    && returnTo.consumedAt === null
    && returnTo.tokenId === `RT-B-JOIN_TABLE-${createdAt}`
    && TABLE_ID.test(returnTo.tableId)
    && isCanonicalVenueId(returnTo.venueId)
    && returnTo.draft.length <= 280
    && Number.isFinite(createdAt)
    && Number.isFinite(expiresAt)
    && expiresAt - createdAt === B_RETURN_TO_TTL_MS
    && expiresAt > now.getTime()
}

export function consumeBReturnTo(returnTo: BReturnToEnvelope, now = new Date()): BReturnToEnvelope | null {
  if (!isBReturnToUsable(returnTo, now)) return null
  return { ...returnTo, consumedAt: now.toISOString() }
}
