import type { ReviewFixtureExecution } from "../contracts/execution-mode"

export type LabsBridgeQuote = Readonly<{
  sourceAsset: "USDT"
  sourceNetwork: "Sui Testnet"
  targetAsset: "OOKRW"
  targetNetwork: "OmniOne"
  sourceAmount: 13.5
  targetAmount: 13_460
  expiresAt: number
}>

export type LabsBridgeReviewValue = Readonly<{ route: "sui-testnet-to-omnione"; quote: LabsBridgeQuote }>
export type LabsWalletReviewValue = Readonly<{ address: "0x8a71…4d2c" }>
export type LabsBadgeReviewValue = Readonly<{ badge: "travel-keepsake" }>
type SuccessfulReviewFixtureExecution<T> = Extract<ReviewFixtureExecution<T>, { result: "FIXTURE_SUCCESS" }>
export type LabsWalletReviewExecution = SuccessfulReviewFixtureExecution<LabsWalletReviewValue>
export type LabsBridgeReviewExecution = SuccessfulReviewFixtureExecution<LabsBridgeReviewValue>
export type LabsBadgeReviewExecution = SuccessfulReviewFixtureExecution<LabsBadgeReviewValue>

const LABS_REVIEW_KEYS = ["mode", "executionTruth", "provenanceTruth", "result", "fixtureId", "externalProviderConnected", "externalEffect", "recordedAt", "value"] as const
const LABS_BRIDGE_QUOTE_KEYS = ["sourceAsset", "sourceNetwork", "targetAsset", "targetNetwork", "sourceAmount", "targetAmount", "expiresAt"] as const

function hasExactLabsKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value)
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
}

export function createLabsBridgeQuote(expiresAt: number): LabsBridgeQuote {
  return Object.freeze({
    sourceAsset: "USDT",
    sourceNetwork: "Sui Testnet",
    targetAsset: "OOKRW",
    targetNetwork: "OmniOne",
    sourceAmount: 13.5,
    targetAmount: 13_460,
    expiresAt,
  })
}

export function isLabsBridgeQuote(value: unknown): value is LabsBridgeQuote {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false
  const quote = value as Partial<LabsBridgeQuote> & Record<string, unknown>
  return hasExactLabsKeys(quote, LABS_BRIDGE_QUOTE_KEYS)
    && quote.sourceAsset === "USDT"
    && quote.sourceNetwork === "Sui Testnet"
    && quote.targetAsset === "OOKRW"
    && quote.targetNetwork === "OmniOne"
    && quote.sourceAmount === 13.5
    && quote.targetAmount === 13_460
    && typeof quote.expiresAt === "number"
    && Number.isFinite(quote.expiresAt)
}

function successfulLabsReviewRecord(value: unknown, fixtureId: string): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const recordedAt = typeof record.recordedAt === "string" ? Date.parse(record.recordedAt) : Number.NaN
  if (!hasExactLabsKeys(record, LABS_REVIEW_KEYS)
    || record.mode !== "review"
    || record.executionTruth !== "FIXTURE_REVIEW"
    || record.provenanceTruth !== "SIMULATED"
    || record.result !== "FIXTURE_SUCCESS"
    || record.fixtureId !== fixtureId
    || record.externalProviderConnected !== false
    || record.externalEffect !== "none"
    || !Number.isFinite(recordedAt)
    || new Date(recordedAt).toISOString() !== record.recordedAt
    || recordedAt > Date.now() + 60_000) return null
  return record
}

export function readLabsWalletReview(value: unknown): LabsWalletReviewExecution | null {
  const record = successfulLabsReviewRecord(value, "FX-LABS-WALLET-SUCCESS")
  if (!record || record.value == null || typeof record.value !== "object" || Array.isArray(record.value)) return null
  const review = record.value as Record<string, unknown>
  return hasExactLabsKeys(review, ["address"]) && review.address === "0x8a71…4d2c"
    ? Object.freeze({ ...record, value: Object.freeze({ address: "0x8a71…4d2c" as const }) }) as LabsWalletReviewExecution
    : null
}

export function readLabsBridgeReview(value: unknown): LabsBridgeReviewExecution | null {
  const record = successfulLabsReviewRecord(value, "FX-LABS-BRIDGE-SUCCESS")
  if (!record || record.value == null || typeof record.value !== "object" || Array.isArray(record.value)) return null
  const review = record.value as Record<string, unknown>
  if (!hasExactLabsKeys(review, ["route", "quote"])
    || review.route !== "sui-testnet-to-omnione"
    || !isLabsBridgeQuote(review.quote)) return null
  return Object.freeze({
    ...record,
    value: Object.freeze({ route: "sui-testnet-to-omnione" as const, quote: Object.freeze({ ...review.quote }) }),
  }) as LabsBridgeReviewExecution
}

export function readLabsBadgeReview(value: unknown): LabsBadgeReviewExecution | null {
  const record = successfulLabsReviewRecord(value, "FX-BADGE-SUCCESS")
  if (!record || record.value == null || typeof record.value !== "object" || Array.isArray(record.value)) return null
  const review = record.value as Record<string, unknown>
  return hasExactLabsKeys(review, ["badge"]) && review.badge === "travel-keepsake"
    ? Object.freeze({ ...record, value: Object.freeze({ badge: "travel-keepsake" as const }) }) as LabsBadgeReviewExecution
    : null
}
