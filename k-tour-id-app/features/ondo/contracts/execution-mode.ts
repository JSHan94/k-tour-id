/**
 * Runtime truth boundary for the frontend demo.
 *
 * There is intentionally no shared `success` discriminator. A local mutation
 * and an explicit review fixture must be handled by different branches.
 * Provider-backed capabilities remain unavailable without a provider, while
 * clearly scoped on-device actions may still complete locally.
 */

export type ExternalCapability =
  | "person"
  | "age"
  | "payment_kyc"
  | "credential"
  | "funding"
  | "merchant_payment"
  | "chain_transaction"

export type LocalActualScope =
  | "account"
  | "preference"
  | "bookmark"
  | "draft"
  | "activity_record"
  | "travel_balance_record"
  | "age_declaration"
  | "travel_wallet_shell"

export type ReviewFixtureOutcome = "success" | "failure" | "cancel" | "expired" | "unavailable"
export type FixtureId = `FX-${string}`
export const REVIEW_PROVENANCE_TRUTH = "SIMULATED" as const

export type ProviderUnavailableExecution = Readonly<{
  mode: "normal"
  executionTruth: "PROVIDER_UNAVAILABLE"
  provenanceTruth: "NOT_CONFIGURED"
  result: "PROVIDER_UNAVAILABLE"
  capability: ExternalCapability
  externalEffect: "none"
}>

export type LocalActualExecution<T> = Readonly<{
  mode: "normal"
  executionTruth: "LOCAL_ACTUAL"
  result: "LOCAL_COMMITTED"
  scope: LocalActualScope
  value: T
  externalEffect: "none"
}>

export type NormalExecution<T> = ProviderUnavailableExecution | LocalActualExecution<T>

type ReviewFixtureBase = Readonly<{
  mode: "review"
  executionTruth: "FIXTURE_REVIEW"
  provenanceTruth: typeof REVIEW_PROVENANCE_TRUTH
  fixtureId: FixtureId
  externalProviderConnected: false
  externalEffect: "none"
  recordedAt: string
}>

export type ReviewFixtureExecution<T> =
  | (ReviewFixtureBase & { result: "FIXTURE_SUCCESS"; value: T })
  | (ReviewFixtureBase & { result: "FIXTURE_FAILURE" | "FIXTURE_CANCEL" | "FIXTURE_EXPIRED" | "FIXTURE_UNAVAILABLE"; value?: never })

const REVIEW_AUTHORITY = Symbol("review-fixture-authority")
const FIXTURE_ID = /^FX-[A-Z0-9][A-Z0-9-]{1,95}$/
const LIVE_REVIEW_FIXTURE_EXECUTIONS = new WeakSet<object>()

export type ReviewFixtureAuthority = Readonly<{
  fixtureId: FixtureId
  [REVIEW_AUTHORITY]: true
}>

export function providerUnavailable(capability: ExternalCapability): ProviderUnavailableExecution {
  return Object.freeze({
    mode: "normal",
    executionTruth: "PROVIDER_UNAVAILABLE",
    provenanceTruth: "NOT_CONFIGURED",
    result: "PROVIDER_UNAVAILABLE",
    capability,
    externalEffect: "none",
  })
}

export function localActual<T>(scope: LocalActualScope, value: T): LocalActualExecution<T> {
  return Object.freeze({
    mode: "normal",
    executionTruth: "LOCAL_ACTUAL",
    result: "LOCAL_COMMITTED",
    scope,
    value,
    externalEffect: "none",
  })
}

/**
 * Review authority is explicit, non-serializable and unavailable unless both
 * the build seam and the reviewer choice are true.
 */
export function createReviewFixtureAuthority(input: {
  qaRuntimeEnabled: boolean
  explicitlyRequested: boolean
  fixtureId: string
}): ReviewFixtureAuthority | null {
  if (input.qaRuntimeEnabled !== true || input.explicitlyRequested !== true || !FIXTURE_ID.test(input.fixtureId)) return null
  return Object.freeze({ fixtureId: input.fixtureId as FixtureId, [REVIEW_AUTHORITY]: true as const })
}

function hasReviewAuthority(value: unknown): value is ReviewFixtureAuthority {
  return Boolean(
    value
    && typeof value === "object"
    && (value as Partial<ReviewFixtureAuthority>)[REVIEW_AUTHORITY] === true
    && typeof (value as Partial<ReviewFixtureAuthority>).fixtureId === "string"
    && FIXTURE_ID.test((value as Partial<ReviewFixtureAuthority>).fixtureId!),
  )
}

export function reviewFixture<T>(
  authority: ReviewFixtureAuthority,
  input: { outcome: "success"; value: T; now?: Date } | { outcome: Exclude<ReviewFixtureOutcome, "success">; now?: Date },
): ReviewFixtureExecution<T> {
  if (!hasReviewAuthority(authority)) throw new Error("Explicit review authority required")
  const recordedAt = (input.now ?? new Date()).toISOString()
  const base: ReviewFixtureBase = {
    mode: "review",
    executionTruth: "FIXTURE_REVIEW",
    provenanceTruth: REVIEW_PROVENANCE_TRUTH,
    fixtureId: authority.fixtureId,
    externalProviderConnected: false,
    externalEffect: "none",
    recordedAt,
  }
  if (input.outcome === "success") {
    const execution = Object.freeze({ ...base, result: "FIXTURE_SUCCESS" as const, value: input.value })
    LIVE_REVIEW_FIXTURE_EXECUTIONS.add(execution)
    return execution
  }
  const result = `FIXTURE_${input.outcome.toUpperCase()}` as Exclude<ReviewFixtureExecution<T>["result"], "FIXTURE_SUCCESS">
  const execution = Object.freeze({ ...base, result })
  LIVE_REVIEW_FIXTURE_EXECUTIONS.add(execution)
  return execution
}

/** A serialized review-shaped object is never equivalent to a live fixture run. */
export function isLiveReviewFixtureExecution(value: unknown) {
  return Boolean(value && typeof value === "object" && LIVE_REVIEW_FIXTURE_EXECUTIONS.has(value))
}

/** Runtime backstop for untyped boundaries; review fixtures never become normal results. */
export function asNormalExecution<T>(value: NormalExecution<T> | ReviewFixtureExecution<T>): NormalExecution<T> | null {
  return value.mode === "normal" ? value : null
}

export function localActualValue<T>(value: NormalExecution<T>): T | null {
  return value.result === "LOCAL_COMMITTED" ? value.value : null
}
