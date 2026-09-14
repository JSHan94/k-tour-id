import type { GateKind, ReturnToCta, ReturnToEnvelope } from "./domain"
import {
  createDeterministicReturnToToken,
  hasExactOwnKeys,
  hashReturnToSnapshot,
  type CanonicalSnapshotValue,
  type ReturnToSnapshotHash,
} from "./return-to-integrity"

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
const SENSITIVE_KEY = /(credential|birth|dob|nationality|passport|photo|blob|private|secret|access.?token|payment.?instrument|provider.?response)/i
const BASE_KEYS = ["tokenId", "cta", "gateQueue", "activeGate", "createdAt", "expiresAt"] as const

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

export type ReturnToSafeReason = "missing" | "invalid" | "private_field" | "expired" | "consumed" | "mismatch"
export type ReturnToSafeReturn = {
  kind: "safe_return"
  reason: ReturnToSafeReason
  discardToken: true
  surface: { kind: "map" }
}
export type ReturnToResume = {
  kind: "resume"
  envelope: ReturnToEnvelope
  snapshotHash: ReturnToSnapshotHash
}
export type ReturnToResolution = ReturnToSafeReturn | ReturnToResume
export type ReturnToConsumptionExpectation = Readonly<{ tokenId: string; snapshotHash: ReturnToSnapshotHash }>
export type ReturnToConsumptionResult = ReturnToSafeReturn | {
  kind: "consumed"
  envelope: ReturnToEnvelope & { consumedAt: string }
  previousSnapshotHash: ReturnToSnapshotHash
}

function safe(reason: ReturnToSafeReason): ReturnToSafeReturn {
  return { kind: "safe_return", reason, discardToken: true, surface: { kind: "map" } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function matchesGateSequence(actual: readonly GateKind[], expected: readonly GateKind[]) {
  return actual.length === expected.length && actual.every((gate, index) => gate === expected[index])
}

function requiredContextKeys(rule: ReturnToRule) {
  return [
    ...(rule.venueId === "required" ? ["venueId"] : []),
    ...(rule.tableId === "required" ? ["tableId"] : []),
  ]
}

function optionalContextKeys(rule: ReturnToRule) {
  return [
    ...(rule.venueId === "optional" ? ["venueId"] : []),
    ...(rule.tableId === "optional" ? ["tableId"] : []),
    "consumedAt",
  ]
}

function canonicalIso(value: unknown) {
  if (typeof value !== "string") return null
  const milliseconds = Date.parse(value)
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value ? milliseconds : null
}

function hasPublicContext(value: unknown, requirement: ContextRequirement) {
  if (requirement === "required") return typeof value === "string" && PUBLIC_CONTEXT_ID.test(value)
  if (requirement === "forbidden") return value === undefined
  return value === undefined || (typeof value === "string" && PUBLIC_CONTEXT_ID.test(value))
}

type ParsedReturnTo = {
  envelope: ReturnToEnvelope
  createdAt: number
  expiresAt: number
  consumedAt: number | null
}

function parseReturnTo(value: unknown): ParsedReturnTo | null {
  if (!isRecord(value) || typeof value.cta !== "string" || !RETURN_TO_CTA_ALLOWLIST.has(value.cta)) return null
  const cta = value.cta as ReturnToCta
  const rule = RETURN_TO_RULES[cta]
  if (!hasExactOwnKeys(value, [...BASE_KEYS, ...requiredContextKeys(rule)], optionalContextKeys(rule))) return null
  if (
    typeof value.tokenId !== "string"
    || !Array.isArray(value.gateQueue)
    || typeof value.activeGate !== "string"
    || value.gateQueue.length === 0
    || !value.gateQueue.every((gate) => typeof gate === "string" && RETURN_TO_GATE_ALLOWLIST.has(gate))
  ) return null
  const gateQueue = value.gateQueue as GateKind[]
  if (!rule.gateSequences.some((expected) => matchesGateSequence(gateQueue, expected))) return null
  if (value.activeGate !== gateQueue[0]) return null
  if (!hasPublicContext(value.venueId, rule.venueId) || !hasPublicContext(value.tableId, rule.tableId)) return null

  const createdAt = canonicalIso(value.createdAt)
  const expiresAt = canonicalIso(value.expiresAt)
  if (createdAt === null || expiresAt === null || expiresAt - createdAt !== RETURN_TO_TTL_MS) return null
  if (value.tokenId !== createDeterministicReturnToToken(cta, createdAt)) return null
  const consumedAt = value.consumedAt === undefined ? null : canonicalIso(value.consumedAt)
  if (value.consumedAt !== undefined && consumedAt === null) return null
  if (consumedAt !== null && (consumedAt < createdAt || consumedAt > expiresAt)) return null

  return {
    envelope: {
      tokenId: value.tokenId,
      cta,
      gateQueue: [...gateQueue],
      activeGate: value.activeGate as GateKind,
      ...(typeof value.venueId === "string" ? { venueId: value.venueId } : {}),
      ...(typeof value.tableId === "string" ? { tableId: value.tableId } : {}),
      createdAt: value.createdAt as string,
      expiresAt: value.expiresAt as string,
      ...(typeof value.consumedAt === "string" ? { consumedAt: value.consumedAt } : {}),
    },
    createdAt,
    expiresAt,
    consumedAt,
  }
}

export function isReturnToStructurallyValid(value: unknown): value is ReturnToEnvelope {
  return parseReturnTo(value) !== null
}

export function createReturnTo(input: {
  cta: ReturnToCta
  gateQueue: [GateKind, ...GateKind[]]
  venueId?: string
  tableId?: string
  now?: Date
}): ReturnToEnvelope {
  const now = input.now ?? new Date()
  const createdAt = now.toISOString()
  const envelope: ReturnToEnvelope = {
    tokenId: createDeterministicReturnToToken(input.cta, now),
    cta: input.cta,
    gateQueue: [...input.gateQueue],
    activeGate: input.gateQueue[0],
    ...(input.venueId !== undefined ? { venueId: input.venueId } : {}),
    ...(input.tableId !== undefined ? { tableId: input.tableId } : {}),
    createdAt,
    expiresAt: new Date(now.getTime() + RETURN_TO_TTL_MS).toISOString(),
  }
  if (!isReturnToStructurallyValid(envelope)) throw new Error("Invalid return context")
  return envelope
}

export function snapshotReturnTo(envelope: ReturnToEnvelope): CanonicalSnapshotValue | null {
  const parsed = parseReturnTo(envelope)
  if (!parsed) return null
  const value = parsed.envelope
  return {
    activeGate: value.activeGate,
    createdAt: value.createdAt,
    cta: value.cta,
    expiresAt: value.expiresAt,
    gateQueue: [...value.gateQueue],
    ...(value.tableId !== undefined ? { tableId: value.tableId } : {}),
    tokenId: value.tokenId,
    ...(value.venueId !== undefined ? { venueId: value.venueId } : {}),
    ...(value.consumedAt !== undefined ? { consumedAt: value.consumedAt } : {}),
  }
}

export function hashReturnTo(envelope: ReturnToEnvelope): ReturnToSnapshotHash | null {
  const snapshot = snapshotReturnTo(envelope)
  return snapshot ? hashReturnToSnapshot(snapshot) : null
}

export function resolveReturnTo(value: unknown, now = new Date()): ReturnToResolution {
  if (value == null) return safe("missing")
  if (isRecord(value)) {
    const unknownKeys = Reflect.ownKeys(value).filter((key) => typeof key !== "string" || ![
      ...BASE_KEYS, "venueId", "tableId", "consumedAt",
    ].includes(key as string))
    if (unknownKeys.some((key) => typeof key === "string" && SENSITIVE_KEY.test(key))) return safe("private_field")
  }
  const parsed = parseReturnTo(value)
  if (!parsed) return safe("invalid")
  if (parsed.consumedAt !== null) return safe("consumed")
  if (parsed.createdAt > now.getTime()) return safe("invalid")
  if (parsed.expiresAt <= now.getTime()) return safe("expired")
  return { kind: "resume", envelope: parsed.envelope, snapshotHash: hashReturnTo(parsed.envelope)! }
}

export function isReturnToUsable(envelope: ReturnToEnvelope | null, now = new Date()): envelope is ReturnToEnvelope {
  return resolveReturnTo(envelope, now).kind === "resume"
}

export function restoreReturnTo(value: unknown, now = new Date()): ReturnToEnvelope | null {
  const resolution = resolveReturnTo(value, now)
  return resolution.kind === "resume" ? resolution.envelope : null
}

export function createReturnToConsumptionExpectation(envelope: ReturnToEnvelope): ReturnToConsumptionExpectation | null {
  const snapshotHash = hashReturnTo(envelope)
  return snapshotHash ? { tokenId: envelope.tokenId, snapshotHash } : null
}

/** Persist the returned consumed envelope before applying the protected mutation. */
export function consumeReturnToOnce(
  current: unknown,
  expected: ReturnToConsumptionExpectation,
  now = new Date(),
): ReturnToConsumptionResult {
  const resolution = resolveReturnTo(current, now)
  if (resolution.kind === "safe_return") return resolution
  if (resolution.envelope.tokenId !== expected.tokenId || resolution.snapshotHash !== expected.snapshotHash) return safe("mismatch")
  return {
    kind: "consumed",
    envelope: { ...resolution.envelope, consumedAt: now.toISOString() },
    previousSnapshotHash: resolution.snapshotHash,
  }
}

export function hasExactReturnToGatePlan(
  envelope: ReturnToEnvelope,
  requiredGatePlan: readonly GateKind[],
  isGateSatisfied: (gate: GateKind) => boolean,
) {
  const remainingGates = requiredGatePlan.filter((gate) => !isGateSatisfied(gate))
  return remainingGates.length > 0
    && matchesGateSequence(envelope.gateQueue, remainingGates)
    && envelope.activeGate === remainingGates[0]
}

export function areRequiredReturnToGatesSatisfied(
  requiredGatePlan: readonly GateKind[],
  isGateSatisfied: (gate: GateKind) => boolean,
) {
  return requiredGatePlan.every(isGateSatisfied)
}

export function advanceReturnTo(envelope: ReturnToEnvelope, completedGate: GateKind): ReturnToEnvelope {
  if (envelope.activeGate !== completedGate || envelope.gateQueue[0] !== completedGate) return envelope
  const remaining = envelope.gateQueue.slice(1)
  return remaining.length ? { ...envelope, gateQueue: remaining, activeGate: remaining[0] } : envelope
}
