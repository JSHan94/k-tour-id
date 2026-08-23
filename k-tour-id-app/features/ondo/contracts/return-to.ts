import type { GateKind, ReturnToCta, ReturnToEnvelope } from "./domain"

export const RETURN_TO_TTL_MS = 15 * 60 * 1000
export const RETURN_TO_CTAS = [
  "SAVE_VENUE",
  "JOIN_TABLE",
  "OPEN_CHAT",
  "SUBMIT_LOCAL_SIGNAL",
  "START_CHECKOUT",
  "OPEN_AFTER19",
  "MINT_BADGE",
] as const satisfies readonly ReturnToCta[]
export const RETURN_TO_GATES = ["account", "person", "age", "payment_kyc"] as const satisfies readonly GateKind[]

const RETURN_TO_CTA_ALLOWLIST = new Set<string>(RETURN_TO_CTAS)
const RETURN_TO_GATE_ALLOWLIST = new Set<string>(RETURN_TO_GATES)
const PUBLIC_CONTEXT_ID = /^[a-z0-9][a-z0-9-]{0,127}$/
type ContextRequirement = "required" | "optional" | "forbidden"
type ReturnToRule = {
  gateSequences: readonly (readonly GateKind[])[]
  venueId: ContextRequirement
  tableId: ContextRequirement
}

export const RETURN_TO_RULES = {
  SAVE_VENUE: { gateSequences: [["account"]], venueId: "required", tableId: "forbidden" },
  JOIN_TABLE: {
    gateSequences: [
      ["account"], ["person"], ["age"],
      ["account", "person"], ["account", "age"], ["person", "age"],
      ["account", "person", "age"],
    ],
    venueId: "required",
    tableId: "required",
  },
  OPEN_CHAT: { gateSequences: [["account"]], venueId: "forbidden", tableId: "required" },
  SUBMIT_LOCAL_SIGNAL: { gateSequences: [["account"], ["person"], ["account", "person"]], venueId: "required", tableId: "forbidden" },
  START_CHECKOUT: { gateSequences: [["account"], ["payment_kyc"], ["account", "payment_kyc"]], venueId: "required", tableId: "forbidden" },
  OPEN_AFTER19: { gateSequences: [["age"]], venueId: "optional", tableId: "forbidden" },
  MINT_BADGE: { gateSequences: [["person"]], venueId: "forbidden", tableId: "forbidden" },
} as const satisfies Record<ReturnToCta, ReturnToRule>

function hasAllowedContext(value: string | undefined, requirement: ContextRequirement) {
  if (requirement === "required") return typeof value === "string" && PUBLIC_CONTEXT_ID.test(value)
  if (requirement === "forbidden") return value === undefined
  return value === undefined || PUBLIC_CONTEXT_ID.test(value)
}

function matchesGateSequence(actual: readonly GateKind[], expected: readonly GateKind[]) {
  return actual.length === expected.length && actual.every((gate, index) => gate === expected[index])
}

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
  if (!envelope || typeof envelope !== "object") return false
  if (
    typeof envelope.tokenId !== "string"
    || typeof envelope.cta !== "string"
    || !Array.isArray(envelope.gateQueue)
    || typeof envelope.activeGate !== "string"
    || typeof envelope.createdAt !== "string"
    || typeof envelope.expiresAt !== "string"
    || envelope.venueId === null
    || envelope.tableId === null
    || (envelope.venueId !== undefined && typeof envelope.venueId !== "string")
    || (envelope.tableId !== undefined && typeof envelope.tableId !== "string")
  ) return false
  const createdAt = new Date(envelope.createdAt).getTime()
  const expiresAt = new Date(envelope.expiresAt).getTime()
  if (!RETURN_TO_CTA_ALLOWLIST.has(envelope.cta)) return false
  const rule = RETURN_TO_RULES[envelope.cta]
  return envelope.consumedAt == null
    && envelope.tokenId === `RT-${envelope.cta}-${createdAt}`
    && envelope.gateQueue.length > 0
    && envelope.gateQueue.every((gate) => RETURN_TO_GATE_ALLOWLIST.has(gate))
    && rule.gateSequences.some((expected) => matchesGateSequence(envelope.gateQueue, expected))
    && RETURN_TO_GATE_ALLOWLIST.has(envelope.activeGate)
    && envelope.gateQueue.includes(envelope.activeGate)
    && Number.isFinite(createdAt)
    && Number.isFinite(expiresAt)
    && createdAt <= now.getTime() + 60_000
    && expiresAt > now.getTime()
    && expiresAt - createdAt === RETURN_TO_TTL_MS
    && hasAllowedContext(envelope.venueId, rule.venueId)
    && hasAllowedContext(envelope.tableId, rule.tableId)
}

export function restoreReturnTo(value: unknown, now = new Date()): ReturnToEnvelope | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as ReturnToEnvelope
  if (!isReturnToUsable(candidate, now)) return null
  return {
    tokenId: candidate.tokenId,
    cta: candidate.cta,
    gateQueue: [...candidate.gateQueue],
    activeGate: candidate.activeGate,
    venueId: candidate.venueId,
    tableId: candidate.tableId,
    createdAt: candidate.createdAt,
    expiresAt: candidate.expiresAt,
  }
}

export function hasCoherentReturnToProgress(
  envelope: ReturnToEnvelope,
  isGateSatisfied: (gate: GateKind) => boolean,
) {
  const activeIndex = envelope.gateQueue.indexOf(envelope.activeGate)
  return activeIndex >= 0
    && envelope.gateQueue.slice(0, activeIndex).every(isGateSatisfied)
    && !isGateSatisfied(envelope.activeGate)
}

export function areReturnToGatesSatisfied(
  envelope: ReturnToEnvelope,
  isGateSatisfied: (gate: GateKind) => boolean,
) {
  return envelope.gateQueue.every(isGateSatisfied)
}

export function advanceReturnTo(envelope: ReturnToEnvelope, completedGate: GateKind): ReturnToEnvelope {
  if (envelope.activeGate !== completedGate) return envelope
  const index = envelope.gateQueue.indexOf(completedGate)
  const next = envelope.gateQueue[index + 1]
  return next ? { ...envelope, activeGate: next } : envelope
}
