import type { GateKind, ReturnToCta, ReturnToEnvelope } from "./domain"

export const RETURN_TO_TTL_MS = 15 * 60 * 1000

export function createReturnTo(input: {
  cta: ReturnToCta
  gateQueue: [GateKind, ...GateKind[]]
  venueId?: string
  tableId?: string
  now?: Date
}): ReturnToEnvelope {
  const now = input.now ?? new Date()
  return {
    tokenId: `RT-${input.cta}-${now.getTime()}`,
    cta: input.cta,
    gateQueue: input.gateQueue,
    activeGate: input.gateQueue[0],
    venueId: input.venueId,
    tableId: input.tableId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RETURN_TO_TTL_MS).toISOString(),
  }
}

export function isReturnToUsable(envelope: ReturnToEnvelope | null, now = new Date()): envelope is ReturnToEnvelope {
  return Boolean(
    envelope
      && envelope.consumedAt == null
      && new Date(envelope.expiresAt).getTime() > now.getTime()
      && envelope.gateQueue.includes(envelope.activeGate),
  )
}

export function advanceReturnTo(envelope: ReturnToEnvelope, completedGate: GateKind): ReturnToEnvelope {
  if (envelope.activeGate !== completedGate) return envelope
  const index = envelope.gateQueue.indexOf(completedGate)
  const next = envelope.gateQueue[index + 1]
  return next ? { ...envelope, activeGate: next } : envelope
}
