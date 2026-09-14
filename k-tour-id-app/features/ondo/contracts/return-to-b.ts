import { isCanonicalVenueId } from "@/lib/ondo/venues/canonical-allowlist"
import { isEditorialPlaceId, type EditorialPlaceB } from "../pulse-b/japan-first-pulse-model-b"
import {
  hasExactOwnKeys,
  hashReturnToSnapshot,
  type CanonicalSnapshotValue,
  type ReturnToSnapshotHash,
} from "./return-to-integrity"

export const B_ACCOUNT_RETURN_TO_TTL_MS = 15 * 60 * 1000
export const B_RETURN_TO_TTL_MS = 10 * 60 * 1000

type BAccountReturnToBase = {
  tokenId: string
  action: "SAVE_VENUE"
  activeGate: "account"
  returnLevel: "detail"
  draft: null
  createdAt: string
  expiresAt: string
  consumedAt: string | null
}

export type BAccountReturnToEnvelope = BAccountReturnToBase & (
  | { targetKind: "canonical"; venueId: string; editorialPlaceId?: never }
  | { targetKind: "editorial"; venueId?: never; editorialPlaceId: EditorialPlaceB["id"] }
)

export type BAccountSaveTransactionMarker = Readonly<{
  tokenId: string
  snapshotHash: ReturnToSnapshotHash
  targetKind: "canonical" | "editorial"
  targetId: string
  targetWasSaved: boolean
  phase: "prepared" | "terminal"
}>

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
const ACCOUNT_RETURN_BASE_KEYS = [
  "tokenId",
  "action",
  "activeGate",
  "targetKind",
  "returnLevel",
  "draft",
  "createdAt",
  "expiresAt",
  "consumedAt",
] as const
const ACCOUNT_SAVE_TRANSACTION_KEYS = [
  "tokenId",
  "snapshotHash",
  "targetKind",
  "targetId",
  "targetWasSaved",
  "phase",
] as const

type BAccountReturnExpectation = Readonly<{
  tokenId: string
  snapshotHash: ReturnToSnapshotHash
  expiresAt: number
  state: "pending" | "consumed" | "terminal"
  consumedAt: string | null
}>

// The persisted envelope is only public context. The matching expectation is
// intentionally kept in this mounted JS module, so a copied/forged envelope or
// a reload without its staged origin can never activate Account or save data.
const accountReturnExpectationByToken = new Map<string, BAccountReturnExpectation>()

function pruneAccountReturnExpectations(now: number) {
  for (const [tokenId, expectation] of accountReturnExpectationByToken) {
    if (expectation.expiresAt <= now) accountReturnExpectationByToken.delete(tokenId)
  }
}

function accountReturnBindingHash(value: BAccountReturnToEnvelope) {
  return hashBAccountReturnTo(value.consumedAt === null ? value : { ...value, consumedAt: null })
}

function stageBAccountReturnExpectation(value: BAccountReturnToEnvelope) {
  const snapshotHash = accountReturnBindingHash(value)
  if (!snapshotHash) return false
  const expiresAt = Date.parse(value.expiresAt)
  pruneAccountReturnExpectations(Date.parse(value.createdAt))
  const existing = accountReturnExpectationByToken.get(value.tokenId)
  if (existing) return existing.state === "pending" && existing.snapshotHash === snapshotHash
  accountReturnExpectationByToken.set(value.tokenId, {
    tokenId: value.tokenId,
    snapshotHash,
    expiresAt,
    state: "pending",
    consumedAt: null,
  })
  return true
}

export function createBAccountReturnTo(venueId: string, now = new Date()): BAccountReturnToEnvelope {
  if (!isCanonicalVenueId(venueId)) throw new Error("Invalid canonical venue return context")
  const createdAt = now.toISOString()
  const returnTo: BAccountReturnToEnvelope = {
    tokenId: `RT-B-SAVE_VENUE-${now.getTime()}`,
    action: "SAVE_VENUE",
    activeGate: "account",
    targetKind: "canonical",
    venueId,
    returnLevel: "detail",
    draft: null,
    createdAt,
    expiresAt: new Date(now.getTime() + B_ACCOUNT_RETURN_TO_TTL_MS).toISOString(),
    consumedAt: null,
  }
  if (!stageBAccountReturnExpectation(returnTo)) throw new Error("Account return token collision")
  return returnTo
}

export function createBEditorialAccountReturnTo(editorialPlaceId: EditorialPlaceB["id"], now = new Date()): BAccountReturnToEnvelope {
  if (!isEditorialPlaceId(editorialPlaceId)) throw new Error("Invalid editorial place return context")
  const createdAt = now.toISOString()
  const returnTo: BAccountReturnToEnvelope = {
    tokenId: `RT-B-SAVE_EDITORIAL_PLACE-${now.getTime()}`,
    action: "SAVE_VENUE",
    activeGate: "account",
    targetKind: "editorial",
    editorialPlaceId,
    returnLevel: "detail",
    draft: null,
    createdAt,
    expiresAt: new Date(now.getTime() + B_ACCOUNT_RETURN_TO_TTL_MS).toISOString(),
    consumedAt: null,
  }
  if (!stageBAccountReturnExpectation(returnTo)) throw new Error("Account return token collision")
  return returnTo
}

export function isBAccountReturnToStructurallyValid(value: unknown): value is BAccountReturnToEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  if (candidate.action !== "SAVE_VENUE" || candidate.activeGate !== "account"
    || candidate.returnLevel !== "detail" || candidate.draft !== null
    || (candidate.targetKind !== "canonical" && candidate.targetKind !== "editorial")) return false
  const specificKeys = candidate.targetKind === "editorial" ? ["editorialPlaceId"] : ["venueId"]
  if (!hasExactOwnKeys(candidate, [...ACCOUNT_RETURN_BASE_KEYS, ...specificKeys])) return false
  const createdAt = typeof candidate.createdAt === "string" ? Date.parse(candidate.createdAt) : Number.NaN
  const expiresAt = typeof candidate.expiresAt === "string" ? Date.parse(candidate.expiresAt) : Number.NaN
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt)
    || candidate.createdAt !== new Date(createdAt).toISOString()
    || candidate.expiresAt !== new Date(expiresAt).toISOString()
    || expiresAt - createdAt !== B_ACCOUNT_RETURN_TO_TTL_MS) return false
  if (candidate.consumedAt !== null) {
    const consumedAt = typeof candidate.consumedAt === "string" ? Date.parse(candidate.consumedAt) : Number.NaN
    if (!Number.isFinite(consumedAt) || candidate.consumedAt !== new Date(consumedAt).toISOString()
      || consumedAt < createdAt || consumedAt >= expiresAt) return false
  }
  if (candidate.targetKind === "editorial") {
    return candidate.tokenId === `RT-B-SAVE_EDITORIAL_PLACE-${createdAt}`
      && typeof candidate.editorialPlaceId === "string"
      && isEditorialPlaceId(candidate.editorialPlaceId)
  }
  return candidate.tokenId === `RT-B-SAVE_VENUE-${createdAt}`
    && typeof candidate.venueId === "string"
    && isCanonicalVenueId(candidate.venueId)
}

export function snapshotBAccountReturnTo(value: unknown): CanonicalSnapshotValue | null {
  if (!isBAccountReturnToStructurallyValid(value)) return null
  return {
    action: value.action,
    activeGate: value.activeGate,
    consumedAt: value.consumedAt,
    createdAt: value.createdAt,
    draft: value.draft,
    editorialPlaceId: value.targetKind === "editorial" ? value.editorialPlaceId : null,
    expiresAt: value.expiresAt,
    returnLevel: value.returnLevel,
    targetKind: value.targetKind,
    tokenId: value.tokenId,
    venueId: value.targetKind === "canonical" ? value.venueId : null,
  }
}

export function hashBAccountReturnTo(value: unknown): ReturnToSnapshotHash | null {
  const snapshot = snapshotBAccountReturnTo(value)
  return snapshot ? hashReturnToSnapshot(snapshot) : null
}

function snapshotBAccountSaveTransaction(
  value: Omit<BAccountSaveTransactionMarker, "snapshotHash">,
): CanonicalSnapshotValue {
  return {
    phase: value.phase,
    targetId: value.targetId,
    targetKind: value.targetKind,
    targetWasSaved: value.targetWasSaved,
    tokenId: value.tokenId,
  }
}

export function createBAccountSaveTransactionMarker(
  returnTo: BAccountReturnToEnvelope,
  targetWasSaved: boolean,
  phase: BAccountSaveTransactionMarker["phase"],
): BAccountSaveTransactionMarker {
  if (!isBAccountReturnToStructurallyValid(returnTo)) throw new Error("Invalid Account save transaction return")
  const targetKind = returnTo.targetKind
  const targetId = targetKind === "canonical" ? returnTo.venueId : returnTo.editorialPlaceId
  const snapshot = { tokenId: returnTo.tokenId, targetKind, targetId, targetWasSaved, phase } as const
  return { ...snapshot, snapshotHash: hashReturnToSnapshot(snapshotBAccountSaveTransaction(snapshot)) }
}

export function restoreBAccountSaveTransactionMarker(value: unknown): BAccountSaveTransactionMarker | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  if (!hasExactOwnKeys(candidate, ACCOUNT_SAVE_TRANSACTION_KEYS)
    || (candidate.targetKind !== "canonical" && candidate.targetKind !== "editorial")
    || typeof candidate.targetId !== "string"
    || typeof candidate.targetWasSaved !== "boolean"
    || (candidate.phase !== "prepared" && candidate.phase !== "terminal")
    || typeof candidate.tokenId !== "string"
    || typeof candidate.snapshotHash !== "string") return null
  if (candidate.targetKind === "canonical") {
    if (!isCanonicalVenueId(candidate.targetId) || !/^RT-B-SAVE_VENUE-\d+$/.test(candidate.tokenId)) return null
  } else if (!isEditorialPlaceId(candidate.targetId) || !/^RT-B-SAVE_EDITORIAL_PLACE-\d+$/.test(candidate.tokenId)) return null
  const snapshot = {
    tokenId: candidate.tokenId,
    targetKind: candidate.targetKind,
    targetId: candidate.targetId,
    targetWasSaved: candidate.targetWasSaved,
    phase: candidate.phase,
  } as const
  const snapshotHash = hashReturnToSnapshot(snapshotBAccountSaveTransaction(snapshot))
  return candidate.snapshotHash === snapshotHash ? { ...snapshot, snapshotHash } : null
}

export function isBAccountReturnToUsable(returnTo: unknown, now = new Date()): returnTo is BAccountReturnToEnvelope {
  if (!isBAccountReturnToStructurallyValid(returnTo) || returnTo.consumedAt !== null) return false
  const createdAt = Date.parse(returnTo.createdAt)
  const expiresAt = Date.parse(returnTo.expiresAt)
  if (createdAt > now.getTime() || expiresAt <= now.getTime()) return false
  const snapshotHash = accountReturnBindingHash(returnTo)
  const expectation = accountReturnExpectationByToken.get(returnTo.tokenId)
  return Boolean(snapshotHash && expectation
    && expectation.tokenId === returnTo.tokenId
    && expectation.snapshotHash === snapshotHash
    && expectation.state === "pending"
    && expectation.consumedAt === null)
}

export function consumeBAccountReturnTo(returnTo: unknown, now = new Date()): BAccountReturnToEnvelope | null {
  if (!isBAccountReturnToUsable(returnTo, now)) return null
  const consumed = { ...returnTo, consumedAt: now.toISOString() }
  if (!isBAccountReturnToStructurallyValid(consumed)) return null
  const expectation = accountReturnExpectationByToken.get(returnTo.tokenId)
  if (!expectation) return null
  accountReturnExpectationByToken.set(returnTo.tokenId, { ...expectation, state: "consumed", consumedAt: consumed.consumedAt })
  return consumed
}

export function restoreConsumedBAccountReturnTo(consumed: unknown, now = new Date()) {
  if (!isBAccountReturnToStructurallyValid(consumed) || consumed.consumedAt === null) return false
  const expectation = accountReturnExpectationByToken.get(consumed.tokenId)
  const snapshotHash = accountReturnBindingHash(consumed)
  if (!expectation || !snapshotHash || expectation.snapshotHash !== snapshotHash
    || expectation.state !== "consumed" || expectation.consumedAt !== consumed.consumedAt) return false
  const pending = { ...consumed, consumedAt: null }
  if (!isBAccountReturnToStructurallyValid(pending)
    || Date.parse(pending.createdAt) > now.getTime() || Date.parse(pending.expiresAt) <= now.getTime()) return false
  accountReturnExpectationByToken.set(consumed.tokenId, { ...expectation, state: "pending", consumedAt: null })
  return true
}

export function finalizeConsumedBAccountReturnTo(consumed: unknown) {
  if (!isBAccountReturnToStructurallyValid(consumed) || consumed.consumedAt === null) return false
  const expectation = accountReturnExpectationByToken.get(consumed.tokenId)
  const snapshotHash = accountReturnBindingHash(consumed)
  if (!expectation || !snapshotHash || expectation.snapshotHash !== snapshotHash
    || expectation.state !== "consumed" || expectation.consumedAt !== consumed.consumedAt) return false
  accountReturnExpectationByToken.set(consumed.tokenId, { ...expectation, state: "terminal" })
  return true
}

export function discardBAccountReturnTo(returnTo: unknown) {
  if (!isBAccountReturnToStructurallyValid(returnTo) || returnTo.consumedAt !== null) return false
  const expectation = accountReturnExpectationByToken.get(returnTo.tokenId)
  const snapshotHash = accountReturnBindingHash(returnTo)
  if (!expectation || !snapshotHash || expectation.snapshotHash !== snapshotHash || expectation.state !== "pending") return false
  accountReturnExpectationByToken.set(returnTo.tokenId, { ...expectation, state: "terminal" })
  return true
}

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
