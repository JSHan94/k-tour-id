/** Deterministic sample quotes only. No payment credentials, live exchange
 * rates, provider calls or chain-transfer claims belong to this model. */
export const FUNDING_RAIL_SESSION_KEY_B = "ondo-b.funding-rail.v1"
export const FUNDING_QUOTE_TTL_MS_B = 2 * 60_000
export const FUNDING_CREDIT_AMOUNTS_B = [15_000, 30_000, 60_000] as const
export type FundingRailB = "krw_bank" | "card_wallet" | "digital_dollar"
export type FundingCardMethodB = "card" | "apple_pay"
export type FundingSampleOutcomeB = "settled" | "failed" | "unknown"
export type StablecoinAssetB = "USDC" | "USDT"
export type StablecoinSignerMethodB = "zklogin" | "existing_wallet"
export const FUNDING_STABLECOIN_NETWORK_B = "sui:testnet" as const
export const FUNDING_STABLECOIN_DECIMALS_B = 6 as const
export const FUNDING_STABLECOIN_BALANCE_ATOMIC_B = 100_000_000 as const
export type FundingStablecoinB = Readonly<{
  asset: StablecoinAssetB
  network: typeof FUNDING_STABLECOIN_NETWORK_B
  decimals: typeof FUNDING_STABLECOIN_DECIMALS_B
  /** Deliberately not a Move type, native asset or wrapped asset claim. */
  coinType: string
  coinRepresentation: "sample-token-not-native-or-wrapped"
  sourceAmountAtomic: number
  feeAtomic: number
  sourceBalanceAtomic: number
  signerMethod: StablecoinSignerMethodB | null
  signerStatus: "disconnected" | "ready" | "failed" | "wrong_network"
  stage: "quote" | "authorization" | "source_pending" | "destination_pending" | "settled"
  authorizationQuoteId: string | null
  sourceStatus: "not_submitted" | "pending" | "confirmed" | "failed" | "unknown"
  destinationStatus: "not_started" | "pending" | "confirmed" | "failed" | "unknown"
  sourceReference: string | null
  destinationReference: string | null
  sourceConfirmedAt: number | null
  destinationConfirmedAt: number | null
}>
export type FundingRailPhaseB = "quoted" | "authorize" | "pending" | "unknown" | "settled" | "cancelled" | "failed" | "expired"
export type FundingRailQuoteB = Readonly<{
  quoteId: string
  rail: FundingRailB
  cardMethod: FundingCardMethodB | null
  creditKrw: number
  sourceCurrency: "KRW" | "USD"
  sourceAmountMinor: number
  feeMinor: number
  rateKrwPerUsd: 1_500 | null
  issuedAt: number
  expiresAt: number
  stablecoinAsset?: StablecoinAssetB
  stablecoinNetwork?: typeof FUNDING_STABLECOIN_NETWORK_B
}>
export type FundingRailReceiptB = Readonly<{
  schema: "ondo-funding-receipt.v1"
  operationId: string
  quoteId: string
  rail: FundingRailB
  cardMethod: FundingCardMethodB | null
  creditKrw: number
  sourceCurrency: "KRW" | "USD"
  sourceAmountMinor: number
  feeMinor: number
  settledAt: number
  executionTruth: "FIXTURE_REVIEW"
  externalEffect: "none"
  stablecoinAsset?: StablecoinAssetB
  stablecoinNetwork?: typeof FUNDING_STABLECOIN_NETWORK_B
  stablecoinDecimals?: typeof FUNDING_STABLECOIN_DECIMALS_B
  stablecoinCoinType?: string
  stablecoinRepresentation?: "sample-token-not-native-or-wrapped"
  stablecoinAmountAtomic?: number
  stablecoinFeeAtomic?: number
  stablecoinSignerMethod?: StablecoinSignerMethodB
  stablecoinSourceReference?: string
  stablecoinDestinationReference?: string
  stablecoinSourceConfirmedAt?: number
  stablecoinDestinationConfirmedAt?: number
}>
export type FundingRailOperationB = Readonly<{
  version: 1
  operationId: string
  phase: FundingRailPhaseB
  quote: FundingRailQuoteB
  attempt: number
  outcome: FundingSampleOutcomeB
  updatedAt: number
  receipt: FundingRailReceiptB | null
  stablecoin: FundingStablecoinB | null
}>
export type FundingRailActionB =
  | Readonly<{ type: "REVIEW"; now: number }>
  | Readonly<{ type: "AUTHORIZE"; quoteId: string; consent: boolean; outcome: FundingSampleOutcomeB; now: number }>
  | Readonly<{ type: "STATUS"; quoteId: string; operationId: string; result: FundingSampleOutcomeB; now: number }>
  | Readonly<{ type: "CONNECT_SIGNER"; method: StablecoinSignerMethodB; result: "ready" | "failed" | "wrong_network"; now: number }>
  | Readonly<{ type: "SELECT_ASSET"; asset: StablecoinAssetB; now: number }>
  | Readonly<{ type: "SAMPLE_SOURCE_BALANCE"; amountAtomic: 0 | typeof FUNDING_STABLECOIN_BALANCE_ATOMIC_B; now: number }>
  | Readonly<{ type: "SOURCE_STATUS" | "DESTINATION_STATUS"; quoteId: string; operationId: string; result: FundingSampleOutcomeB; now: number }>
  | Readonly<{ type: "CANCEL"; now: number }>
  | Readonly<{ type: "RETRY"; now: number }>

const ID = /^demo-fund:[a-zA-Z0-9-]{8,80}$/
const RAILS: readonly string[] = ["krw_bank", "card_wallet", "digital_dollar"]
const PHASES: readonly string[] = ["quoted", "authorize", "pending", "unknown", "settled", "cancelled", "failed", "expired"]
const OUTCOMES: readonly string[] = ["settled", "failed", "unknown"]
const ASSETS: readonly string[] = ["USDC", "USDT"]
const SIGNERS: readonly string[] = ["zklogin", "existing_wallet"]
const BASE_RECEIPT_KEYS = "cardMethod,creditKrw,executionTruth,externalEffect,feeMinor,operationId,quoteId,rail,schema,settledAt,sourceAmountMinor,sourceCurrency".split(",")
const STABLECOIN_RECEIPT_KEYS = "stablecoinAsset,stablecoinNetwork,stablecoinDecimals,stablecoinCoinType,stablecoinRepresentation,stablecoinAmountAtomic,stablecoinFeeAtomic,stablecoinSignerMethod,stablecoinSourceReference,stablecoinDestinationReference,stablecoinSourceConfirmedAt,stablecoinDestinationConfirmedAt".split(",")

function coinType(asset: StablecoinAssetB) { return `sample:sui:testnet:${asset}` }
function sourceReference(quoteId: string) { return `demo-source:${quoteId}` }
function destinationReference(quoteId: string) { return `demo-destination:${quoteId}` }

function stablecoinAmounts(creditKrw: number) {
  const feeAtomic = 250_000
  return { sourceAmountAtomic: creditKrw / 1_500 * 1_000_000 + feeAtomic, feeAtomic }
}

function createStablecoin(asset: StablecoinAssetB, creditKrw: number): FundingStablecoinB {
  return {
    asset, network: FUNDING_STABLECOIN_NETWORK_B, decimals: FUNDING_STABLECOIN_DECIMALS_B,
    coinType: coinType(asset), coinRepresentation: "sample-token-not-native-or-wrapped", ...stablecoinAmounts(creditKrw),
    sourceBalanceAtomic: FUNDING_STABLECOIN_BALANCE_ATOMIC_B, signerMethod: null, signerStatus: "disconnected",
    stage: "quote", authorizationQuoteId: null, sourceStatus: "not_submitted", destinationStatus: "not_started",
    sourceReference: null, destinationReference: null, sourceConfirmedAt: null, destinationConfirmedAt: null,
  }
}

/** Connection is a sample wallet capability, not identity or payment approval. */
export function stablecoinCanAuthorizeB(operation: FundingRailOperationB): boolean {
  const coin = operation.stablecoin
  return operation.quote.rail === "digital_dollar" && !!coin && ["quoted", "authorize"].includes(operation.phase)
    && coin.signerStatus === "ready" && coin.signerMethod !== null && coin.network === FUNDING_STABLECOIN_NETWORK_B
    && coin.sourceBalanceAtomic >= coin.sourceAmountAtomic && coin.sourceStatus === "not_submitted"
}

export function stablecoinHasSubmittedB(operation: FundingRailOperationB): boolean {
  return operation.quote.rail === "digital_dollar" && !!operation.stablecoin && operation.stablecoin.sourceStatus !== "not_submitted"
}

function amounts(rail: FundingRailB, creditKrw: number) {
  const feeMinor = rail === "krw_bank" ? 0 : rail === "card_wallet" ? creditKrw / 100 : 25
  const principal = rail === "digital_dollar" ? creditKrw / 15 : creditKrw
  return { sourceCurrency: rail === "digital_dollar" ? "USD" as const : "KRW" as const, sourceAmountMinor: principal + feeMinor, feeMinor, rateKrwPerUsd: rail === "digital_dollar" ? 1_500 as const : null }
}

export function createFundingRailB(input: { operationId: string; rail: FundingRailB; cardMethod?: FundingCardMethodB; creditKrw: number; now: number; attempt?: number; asset?: StablecoinAssetB }): FundingRailOperationB {
  const attempt = input.attempt ?? 1
  if (!ID.test(input.operationId) || !RAILS.includes(input.rail) || !Number.isFinite(input.now) || input.now < 0
    || !(FUNDING_CREDIT_AMOUNTS_B as readonly number[]).includes(input.creditKrw)
    || !Number.isSafeInteger(attempt) || attempt < 1 || attempt > 100
    || (input.cardMethod !== undefined && input.cardMethod !== "card" && input.cardMethod !== "apple_pay")
    || (input.asset !== undefined && !ASSETS.includes(input.asset))) throw new Error("Invalid sample funding quote")
  const stablecoin = input.rail === "digital_dollar" ? createStablecoin(input.asset ?? "USDC", input.creditKrw) : null
  return {
    version: 1, operationId: input.operationId, phase: "quoted", attempt, outcome: "settled", updatedAt: input.now, receipt: null, stablecoin,
    quote: {
      quoteId: `${input.operationId}:q${attempt}`, rail: input.rail, cardMethod: input.rail === "card_wallet" ? input.cardMethod ?? "card" : null,
      creditKrw: input.creditKrw, ...amounts(input.rail, input.creditKrw), issuedAt: input.now, expiresAt: input.now + FUNDING_QUOTE_TTL_MS_B,
      ...(stablecoin ? { stablecoinAsset: stablecoin.asset, stablecoinNetwork: stablecoin.network } : {}),
    },
  }
}

export function isFundingRailReceiptB(value: unknown): value is FundingRailReceiptB {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const receipt = value as FundingRailReceiptB
  const expectedKeys = [...BASE_RECEIPT_KEYS, ...(receipt.rail === "digital_dollar" ? STABLECOIN_RECEIPT_KEYS : [])].sort().join(",")
  if (Object.keys(receipt).sort().join(",") !== expectedKeys) return false
  if (receipt.schema !== "ondo-funding-receipt.v1" || !ID.test(receipt.operationId)
    || typeof receipt.quoteId !== "string" || !new RegExp(`^${receipt.operationId}:q[1-9][0-9]{0,2}$`).test(receipt.quoteId)
    || !RAILS.includes(receipt.rail) || !(FUNDING_CREDIT_AMOUNTS_B as readonly number[]).includes(receipt.creditKrw)
    || !Number.isFinite(receipt.settledAt) || receipt.settledAt < 0 || receipt.executionTruth !== "FIXTURE_REVIEW" || receipt.externalEffect !== "none"
    || (receipt.rail === "card_wallet" ? receipt.cardMethod !== "card" && receipt.cardMethod !== "apple_pay" : receipt.cardMethod !== null)) return false
  const expected = amounts(receipt.rail, receipt.creditKrw)
  if (receipt.rail === "digital_dollar") {
    const coin = stablecoinAmounts(receipt.creditKrw)
    if (!ASSETS.includes(receipt.stablecoinAsset!) || receipt.stablecoinNetwork !== FUNDING_STABLECOIN_NETWORK_B
      || receipt.stablecoinDecimals !== FUNDING_STABLECOIN_DECIMALS_B || receipt.stablecoinCoinType !== coinType(receipt.stablecoinAsset!)
      || receipt.stablecoinRepresentation !== "sample-token-not-native-or-wrapped"
      || !Number.isSafeInteger(receipt.stablecoinAmountAtomic) || receipt.stablecoinAmountAtomic !== coin.sourceAmountAtomic
      || !Number.isSafeInteger(receipt.stablecoinFeeAtomic) || receipt.stablecoinFeeAtomic !== coin.feeAtomic
      || !SIGNERS.includes(receipt.stablecoinSignerMethod!)
      || receipt.stablecoinSourceReference !== sourceReference(receipt.quoteId) || receipt.stablecoinDestinationReference !== destinationReference(receipt.quoteId)
      || !Number.isFinite(receipt.stablecoinSourceConfirmedAt) || receipt.stablecoinSourceConfirmedAt! < 0
      || receipt.stablecoinSourceConfirmedAt! > receipt.settledAt || receipt.stablecoinDestinationConfirmedAt !== receipt.settledAt) return false
  }
  return receipt.sourceCurrency === expected.sourceCurrency && receipt.sourceAmountMinor === expected.sourceAmountMinor && receipt.feeMinor === expected.feeMinor
}

function settledOperation(current: FundingRailOperationB, now: number): FundingRailOperationB {
  const { rail, cardMethod, creditKrw, sourceCurrency, sourceAmountMinor, feeMinor, quoteId } = current.quote
  const coin = current.stablecoin
  return {
    ...current, phase: "settled", updatedAt: now,
    stablecoin: coin ? { ...coin, stage: "settled", destinationStatus: "confirmed", destinationConfirmedAt: now } : null,
    receipt: {
      schema: "ondo-funding-receipt.v1", operationId: current.operationId, quoteId, rail, cardMethod, creditKrw, sourceCurrency,
      sourceAmountMinor, feeMinor, settledAt: now, executionTruth: "FIXTURE_REVIEW", externalEffect: "none",
      ...(coin ? {
        stablecoinAsset: coin.asset, stablecoinNetwork: coin.network, stablecoinDecimals: coin.decimals,
        stablecoinCoinType: coin.coinType, stablecoinRepresentation: coin.coinRepresentation,
        stablecoinAmountAtomic: coin.sourceAmountAtomic, stablecoinFeeAtomic: coin.feeAtomic, stablecoinSignerMethod: coin.signerMethod!,
        stablecoinSourceReference: coin.sourceReference!, stablecoinDestinationReference: coin.destinationReference!,
        stablecoinSourceConfirmedAt: coin.sourceConfirmedAt!, stablecoinDestinationConfirmedAt: now,
      } : {}),
    },
  }
}

export function fundingRailTransitionB(current: FundingRailOperationB, action: FundingRailActionB): FundingRailOperationB {
  if (!Number.isFinite(action.now) || action.now < current.updatedAt) return current
  if (action.type === "RETRY") {
    if (!["failed", "cancelled", "expired"].includes(current.phase) || current.attempt >= 100) return current
    return createFundingRailB({ operationId: current.operationId, rail: current.quote.rail, cardMethod: current.quote.cardMethod ?? undefined, creditKrw: current.quote.creditKrw, now: action.now, attempt: current.attempt + 1, asset: current.stablecoin?.asset })
  }
  if (current.phase === "settled" || ["failed", "cancelled", "expired"].includes(current.phase)) return current
  if ((current.phase === "quoted" || current.phase === "authorize") && action.now >= current.quote.expiresAt) return { ...current, phase: "expired", updatedAt: action.now }
  if (action.type === "CANCEL") {
    // Once submitted, closing is not proof of cancellation. Keep the same
    // operation unresolved until a status check establishes its outcome.
    const unresolved = current.phase === "pending" || current.phase === "unknown"
    const coin = current.stablecoin
    return {
      ...current, phase: unresolved ? "unknown" : "cancelled", updatedAt: action.now,
      stablecoin: coin && unresolved ? {
        ...coin, sourceStatus: coin.sourceStatus === "pending" ? "unknown" : coin.sourceStatus,
        destinationStatus: coin.destinationStatus === "pending" ? "unknown" : coin.destinationStatus,
      } : coin,
    }
  }
  if (action.type === "SELECT_ASSET") {
    if (!current.stablecoin || !["quoted", "authorize"].includes(current.phase) || !ASSETS.includes(action.asset)
      || current.attempt >= 100 || action.asset === current.stablecoin.asset) return current
    const next = createFundingRailB({ operationId: current.operationId, rail: "digital_dollar", creditKrw: current.quote.creditKrw, now: action.now, attempt: current.attempt + 1, asset: action.asset })
    return { ...next, stablecoin: { ...next.stablecoin!, signerMethod: current.stablecoin.signerMethod, signerStatus: current.stablecoin.signerStatus, sourceBalanceAtomic: current.stablecoin.sourceBalanceAtomic } }
  }
  if (action.type === "CONNECT_SIGNER") {
    if (!current.stablecoin || !["quoted", "authorize"].includes(current.phase) || !SIGNERS.includes(action.method)
      || !["ready", "failed", "wrong_network"].includes(action.result)) return current
    return { ...current, phase: "quoted", updatedAt: action.now, stablecoin: { ...current.stablecoin, signerMethod: action.method, signerStatus: action.result, stage: "quote", authorizationQuoteId: null } }
  }
  if (action.type === "SAMPLE_SOURCE_BALANCE") {
    if (!current.stablecoin || current.phase !== "quoted" || ![0, FUNDING_STABLECOIN_BALANCE_ATOMIC_B].includes(action.amountAtomic)) return current
    return { ...current, updatedAt: action.now, stablecoin: { ...current.stablecoin, sourceBalanceAtomic: action.amountAtomic } }
  }
  if (action.type === "REVIEW") {
    if (current.phase !== "quoted" || (current.quote.rail === "digital_dollar" && !stablecoinCanAuthorizeB(current))) return current
    return { ...current, phase: "authorize", updatedAt: action.now, stablecoin: current.stablecoin ? { ...current.stablecoin, stage: "authorization" } : null }
  }
  if (action.type === "AUTHORIZE") {
    if (current.phase !== "authorize" || !action.consent || action.quoteId !== current.quote.quoteId || !OUTCOMES.includes(action.outcome)) return current
    if (current.quote.rail === "digital_dollar" && !stablecoinCanAuthorizeB(current)) return current
    return {
      ...current, phase: "pending", outcome: action.outcome, updatedAt: action.now,
      stablecoin: current.stablecoin ? {
        ...current.stablecoin, stage: "source_pending", authorizationQuoteId: current.quote.quoteId,
        sourceStatus: "pending", sourceReference: sourceReference(current.quote.quoteId),
      } : null,
    }
  }
  if (action.type === "SOURCE_STATUS" || action.type === "DESTINATION_STATUS") {
    const coin = current.stablecoin
    if (!coin || current.quote.rail !== "digital_dollar" || !["pending", "unknown"].includes(current.phase)
      || action.operationId !== current.operationId || action.quoteId !== current.quote.quoteId || !OUTCOMES.includes(action.result)) return current
    if (action.type === "SOURCE_STATUS") {
      if (coin.stage !== "source_pending" || !["pending", "unknown"].includes(coin.sourceStatus)) return current
      if (action.result === "settled") return {
        ...current, phase: "pending", updatedAt: action.now, stablecoin: {
          ...coin, stage: "destination_pending", sourceStatus: "confirmed", sourceConfirmedAt: action.now,
          destinationStatus: "pending", destinationReference: destinationReference(current.quote.quoteId),
        },
      }
      return { ...current, phase: action.result, updatedAt: action.now, stablecoin: { ...coin, sourceStatus: action.result } }
    }
    if (coin.stage !== "destination_pending" || coin.sourceStatus !== "confirmed"
      || !["pending", "failed", "unknown"].includes(coin.destinationStatus)) return current
    // A source debit is not a destination credit. A delayed/failed destination
    // remains the SAME unresolved operation; never replay the source transfer.
    if (action.result !== "settled") return { ...current, phase: "unknown", updatedAt: action.now, stablecoin: { ...coin, destinationStatus: action.result } }
    return settledOperation(current, action.now)
  }
  if (action.type !== "STATUS" || !["pending", "unknown"].includes(current.phase)
    || current.quote.rail === "digital_dollar"
    || action.operationId !== current.operationId || action.quoteId !== current.quote.quoteId || !OUTCOMES.includes(action.result)) return current
  if (action.result !== "settled") return { ...current, phase: action.result, updatedAt: action.now }
  return settledOperation(current, action.now)
}

function validStablecoinOperation(op: FundingRailOperationB): boolean {
  const coin = op.stablecoin
  if (!coin || typeof coin !== "object" || Array.isArray(coin)) return false
  const expected = createStablecoin(op.quote.stablecoinAsset!, op.quote.creditKrw)
  if (Object.keys(coin).sort().join(",") !== Object.keys(expected).sort().join(",")) return false
  for (const key of ["asset", "network", "decimals", "coinType", "coinRepresentation", "sourceAmountAtomic", "feeAtomic"] as const) {
    if (coin[key] !== expected[key]) return false
  }
  if (![0, FUNDING_STABLECOIN_BALANCE_ATOMIC_B].includes(coin.sourceBalanceAtomic)
    || !["disconnected", "ready", "failed", "wrong_network"].includes(coin.signerStatus)
    || (coin.signerStatus === "disconnected" ? coin.signerMethod !== null : !SIGNERS.includes(coin.signerMethod!))) return false
  const submitted = ["pending", "unknown", "settled", "failed"].includes(op.phase)
  if (!submitted) {
    return ["quote", "authorization"].includes(coin.stage)
      && (op.phase !== "quoted" || coin.stage === "quote") && (op.phase !== "authorize" || coin.stage === "authorization")
      && (coin.stage !== "authorization" || (coin.signerStatus === "ready" && coin.sourceBalanceAtomic >= coin.sourceAmountAtomic))
      && coin.authorizationQuoteId === null && coin.sourceStatus === "not_submitted" && coin.destinationStatus === "not_started"
      && coin.sourceReference === null && coin.destinationReference === null && coin.sourceConfirmedAt === null && coin.destinationConfirmedAt === null
  }
  if (coin.signerStatus !== "ready" || coin.sourceBalanceAtomic < coin.sourceAmountAtomic
    || coin.authorizationQuoteId !== op.quote.quoteId || coin.sourceReference !== sourceReference(op.quote.quoteId)) return false
  if (coin.stage === "source_pending") {
    return coin.destinationStatus === "not_started" && coin.destinationReference === null && coin.sourceConfirmedAt === null && coin.destinationConfirmedAt === null
      && ((op.phase === "pending" && coin.sourceStatus === "pending") || (op.phase === "unknown" && coin.sourceStatus === "unknown") || (op.phase === "failed" && coin.sourceStatus === "failed"))
  }
  if (coin.sourceStatus !== "confirmed" || !Number.isFinite(coin.sourceConfirmedAt) || coin.sourceConfirmedAt! < op.quote.issuedAt
    || coin.sourceConfirmedAt! > op.updatedAt || coin.destinationReference !== destinationReference(op.quote.quoteId)) return false
  if (coin.stage === "destination_pending") return coin.destinationConfirmedAt === null
    && ((op.phase === "pending" && coin.destinationStatus === "pending") || (op.phase === "unknown" && ["unknown", "failed"].includes(coin.destinationStatus)))
  return coin.stage === "settled" && op.phase === "settled" && coin.destinationStatus === "confirmed" && coin.destinationConfirmedAt === op.updatedAt
}

/** Restoring an unresolved operation never starts another payment. This is
 * sample-only state; callers must still hold live sample execution authority. */
export function readFundingRailB(raw: string | null, now = Date.now()): FundingRailOperationB | null {
  if (!raw || !Number.isFinite(now)) return null
  try {
    const op = JSON.parse(raw) as FundingRailOperationB
    if (!op || op.version !== 1 || !PHASES.includes(op.phase) || !OUTCOMES.includes(op.outcome)
      || !op.quote || !Number.isFinite(op.updatedAt) || op.updatedAt > now || op.updatedAt < op.quote.issuedAt) return null
    const expected = createFundingRailB({ operationId: op.operationId, rail: op.quote.rail, cardMethod: op.quote.cardMethod ?? undefined, creditKrw: op.quote.creditKrw, now: op.quote.issuedAt, attempt: op.attempt, asset: op.quote.stablecoinAsset })
    if (JSON.stringify(op.quote) !== JSON.stringify(expected.quote)) return null
    // Legacy digital-dollar receipts never proved distinct source/destination
    // stages. Reject them rather than upgrading an old generic success.
    if (op.quote.rail === "digital_dollar" ? !validStablecoinOperation(op) : op.stablecoin != null) return null
    if (op.phase === "settled") {
      if (!isFundingRailReceiptB(op.receipt) || op.receipt.operationId !== op.operationId || op.receipt.quoteId !== op.quote.quoteId
        || op.receipt.rail !== op.quote.rail || op.receipt.cardMethod !== op.quote.cardMethod || op.receipt.creditKrw !== op.quote.creditKrw
        || op.receipt.settledAt !== op.updatedAt) return null
      if (op.stablecoin) {
        const canonicalReceipt = settledOperation(op, op.updatedAt).receipt!
        if ((Object.keys(canonicalReceipt) as (keyof FundingRailReceiptB)[]).some(key => op.receipt![key] !== canonicalReceipt[key])) return null
      }
    } else if (op.receipt !== null) return null
    const normalized = { ...op, stablecoin: op.stablecoin ?? null }
    return (op.phase === "quoted" || op.phase === "authorize") && now >= op.quote.expiresAt ? { ...normalized, phase: "expired", updatedAt: now } : normalized
  } catch { return null }
}
