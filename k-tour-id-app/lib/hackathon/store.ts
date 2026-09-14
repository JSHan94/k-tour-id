// Durable JSON store for the hackathon journey (single-process, local demo).
// - Atomic file writes (tmp + rename), serialized through one async mutex.
// - Unique constraints: one redemption per subjectRef+campaignId, one intent
//   per operation, idempotency keys per (operation, action).
// Swap for PostgreSQL for a multi-instance deployment; the service layer only
// depends on this module's API.
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { hkConfig } from "./config"
import type { OperationResult } from "./types"

export type OperationRecord = OperationResult & {
  sessionId: string
  secrets: {
    vcDocument?: unknown            // mock/opendid issued VC (issuer-signed); never returned to evidence
    holderPublicKeyPem?: string     // holder binding (mock holder)
    holderKeyAlg?: "Ed25519" | "ECDSA-P256"
    presentationChallenge?: string
    lastTxBytesB64?: string         // sponsored user PTB bytes awaiting user signature
    cxToken?: string
    cxTxId?: string
    proposalPromptDigest?: string
  }
  audit: Array<{ at: string; event: string; detail?: Record<string, unknown> }>
}

export type SessionRecord = { sessionId: string; createdAt: string; lastSeenAt: string; subjectRef: string | null }
export type RedemptionRecord = { redemptionRef: string; subjectRef: string; campaignId: string; operationId: string; redeemedAt: string }
export type OutboxRecord = {
  outboxId: string; operationId: string; eventKey: string; payloadCommitment: string; payload: Record<string, unknown>
  status: "pending" | "submitted" | "confirmed" | "failed" | "unknown"; txHash: string | null; blockNumber: number | null
  attempts: number; lastError: string | null; createdAt: string; updatedAt: string; confirmedAt: string | null
}
export type IdempotencyRecord = { key: string; bodyDigest: string; responseDigest: string; createdAt: string }

type Db = {
  version: 1
  sessions: Record<string, SessionRecord>
  operations: Record<string, OperationRecord>
  redemptions: Record<string, RedemptionRecord>   // key = `${subjectRef}::${campaignId}`
  outbox: Record<string, OutboxRecord>
  idempotency: Record<string, IdempotencyRecord>
  nonces: Record<string, { operationId: string; consumedAt: string | null; createdAt: string }>
}

const EMPTY: Db = { version: 1, sessions: {}, operations: {}, redemptions: {}, outbox: {}, idempotency: {}, nonces: {} }

let cache: Db | null = null
let queue: Promise<unknown> = Promise.resolve()

function filePath() {
  const dir = resolve(process.cwd(), hkConfig().dataDir)
  mkdirSync(dir, { recursive: true })
  return resolve(dir, "journey.json")
}

function load(): Db {
  if (cache) return cache
  const p = filePath()
  if (!existsSync(p)) { cache = structuredClone(EMPTY); return cache }
  try {
    const parsed = JSON.parse(readFileSync(p, "utf8")) as Db
    cache = { ...structuredClone(EMPTY), ...parsed }
  } catch {
    cache = structuredClone(EMPTY)
  }
  return cache
}

function persist(db: Db) {
  const p = filePath()
  const tmp = `${p}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(tmp, JSON.stringify(db), "utf8")
  renameSync(tmp, p)
}

/** Run a read-modify-write transaction; serialized so concurrent requests cannot interleave. */
export function withStore<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const db = load()
    const result = await fn(db)
    persist(db)
    return result
  }
  const next = queue.then(run, run)
  queue = next.catch(() => undefined)
  return next
}

export function readStore<T>(fn: (db: Db) => T): T {
  return fn(load())
}

export function redemptionKey(subjectRef: string, campaignId: string) { return `${subjectRef}::${campaignId}` }
