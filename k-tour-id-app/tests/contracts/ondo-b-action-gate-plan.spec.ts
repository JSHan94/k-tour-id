import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  abandonPendingBAction,
  authorizeBActionPresentationDecision,
  B_ACTION_AXIS_TTL_MS,
  B_ACTION_GATE_SESSION_KEY,
  B_ACTION_GATE_TTL_MS,
  clearBActionGateSession,
  consumePendingBActionAtMutation,
  consumeBActionReturnTo,
  createBActionReviewAxis,
  createBBadgeActionReturn,
  createBCheckoutActionReturn,
  createBLocalSignalActionReturn,
  createBTableActionReturn,
  discardUnrequestedBActionPrivateContext,
  finalizeConsumedBAction,
  finalizeConsumedBActionWithMutation,
  forgetBActionGateRuntimeAuthorityAfterReset,
  gatePlanForBAction,
  hashBActionReturnTo,
  isBActionReturnPending,
  isBActionReturnStructurallyValid,
  privateContextForBAction,
  persistBActionGateSession,
  recordBActionPresentationApproval,
  registerBActionPresentationRequest,
  renewExpiredPendingBAction,
  requestBActionGate,
  restoreBActionGateSession,
  restoreConsumedBActionAfterMutationFailure,
  updateBActionAxisSession,
} from "../../features/ondo/identity-b/action-gate-contract-b"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import { createPresentationRequestB, resolvePresentationRequestB } from "../../features/ondo/identity-b/ktour-id-setup-model-b"
import {
  createStableCommerceBLockedQuoteFromMode,
} from "../../features/ondo/commerce-b/stable-commerce-model-b"

const NOW = new Date("2026-08-28T03:00:00.000Z")
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const NON_OFFER_VENUE_ID = "mois-18939eecb43c15ab4305"
const REVIEW_OPTIONS = { allowReviewFixture: true } as const

function successfulAxisReview<G extends "person" | "payment_kyc">(gate: G) {
  const authority = createReviewFixtureAuthority({
    qaRuntimeEnabled: true,
    explicitlyRequested: true,
    fixtureId: gate === "person" ? "FX-PER-CONTRACT-SUCCESS" : "FX-PKY-CONTRACT-SUCCESS",
  })
  if (!authority) throw new Error("Expected contract review authority")
  return reviewFixture(authority, { outcome: "success", value: { axis: gate }, now: NOW })
}

class MemoryStorage {
  constructor(protected readonly values: Record<string, string> = {}) {}
  getItem(key: string) { return this.values[key] ?? null }
  setItem(key: string, value: string) { this.values[key] = value }
  removeItem(key: string) { delete this.values[key] }
  raw(key: string) { return this.values[key] ?? null }
}

class FaultStorage extends MemoryStorage {
  private writeIndex = 0
  private faults = new Map<number, "throw" | "ignore" | "mismatch">()
  private removeFault: "throw" | "ignore" | "mismatch" | null = null

  armFaults(entries: ReadonlyArray<readonly [number, "throw" | "ignore" | "mismatch"]>) {
    this.writeIndex = 0
    this.faults = new Map(entries)
  }

  armRemoveFault(fault: "throw" | "ignore" | "mismatch" | null) {
    this.removeFault = fault
  }

  setItem(key: string, value: string) {
    this.writeIndex += 1
    const fault = this.faults.get(this.writeIndex)
    if (fault === "throw") throw new Error("contract storage failure")
    if (fault === "ignore") return
    if (fault === "mismatch") { super.setItem(key, JSON.stringify({ version: 9 })); return }
    super.setItem(key, value)
  }

  removeItem(key: string) {
    if (this.removeFault === "throw") throw new Error("contract remove failure")
    if (this.removeFault === "ignore") return
    if (this.removeFault === "mismatch") { super.setItem(key, JSON.stringify({ version: 9 })); return }
    super.removeItem(key)
  }
}

function prepareConsumedCheckout(storage: MemoryStorage, offsetMs: number, benefitMode: "standard" | "ktour" = "standard") {
  const now = new Date(NOW.getTime() + offsetMs)
  const quote = createStableCommerceBLockedQuoteFromMode(benefitMode, new Date(now.getTime() + B_ACTION_GATE_TTL_MS))
  const checkout = createBCheckoutActionReturn({ venueId: VENUE_ID, quote, now })
  const payment = createBActionReviewAxis("payment_kyc", successfulAxisReview("payment_kyc"), now)
  expect(payment).not.toBeNull()
  expect(persistBActionGateSession(storage as unknown as Storage, {
    version: 1,
    person: { status: "unverified", expiresAt: null },
    payment: payment!,
    pending: checkout,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }, now, REVIEW_OPTIONS)).toBe(true)
  let mutationNow = now
  if (benefitMode === "ktour") {
    const request = createPresentationRequestB(now.getTime(), `presentation:${checkout.tokenId}`)
    expect(registerBActionPresentationRequest(checkout, request)).toBe(true)
    const approved = resolvePresentationRequestB(request, "approve", now.getTime() + 1)
    const authority = authorizeBActionPresentationDecision(checkout, approved)
    expect(authority).not.toBeNull()
    mutationNow = new Date(now.getTime() + 1)
    expect(recordBActionPresentationApproval(storage as unknown as Storage, checkout, authority!, mutationNow, REVIEW_OPTIONS)).not.toBeNull()
  }
  const consumed = consumePendingBActionAtMutation(
    storage as unknown as Storage,
    checkout,
    new Set(["account", "payment_kyc"]),
    mutationNow,
    REVIEW_OPTIONS,
  )
  expect(consumed).not.toBeNull()
  return { checkout, consumed: consumed!, now: mutationNow }
}

function prepareConsumedBadge(storage: MemoryStorage, offsetMs: number) {
  const now = new Date(NOW.getTime() + offsetMs)
  const badge = createBBadgeActionReturn({ now })
  const person = createBActionReviewAxis("person", successfulAxisReview("person"), now)
  expect(person).not.toBeNull()
  expect(persistBActionGateSession(storage as unknown as Storage, {
    version: 1,
    person: person!,
    payment: { status: "unverified", expiresAt: null },
    pending: badge,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }, now, REVIEW_OPTIONS)).toBe(true)
  const consumed = consumePendingBActionAtMutation(storage as unknown as Storage, badge, new Set(["person"]), now, REVIEW_OPTIONS)
  expect(consumed).not.toBeNull()
  return { badge, consumed: consumed!, now }
}

function preparePendingSignal(storage: MemoryStorage, offsetMs: number) {
  const now = new Date(NOW.getTime() + offsetMs)
  const signal = createBLocalSignalActionReturn({
    venueId: VENUE_ID,
    draftNonce: `fault:${offsetMs}`,
    tags: ["calm_now"],
    note: "kept only in memory",
    now,
  })
  const person = createBActionReviewAxis("person", successfulAxisReview("person"), now)
  expect(person).not.toBeNull()
  expect(persistBActionGateSession(storage as unknown as Storage, {
    version: 1,
    person: person!,
    payment: { status: "unverified", expiresAt: null },
    pending: signal,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }, now, REVIEW_OPTIONS)).toBe(true)
  return { signal, now }
}

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
test.afterEach(() => { clearBActionGateSession({ getItem() { return null }, removeItem() {} } as unknown as Storage) })

test("B-ACTION-GATE-001 each product action carries its complete canonical gate plan and exact 15-minute return", () => {
  expect(gatePlanForBAction("JOIN_TABLE")).toEqual(["account", "person", "age"])
  expect(gatePlanForBAction("JOIN_TABLE").indexOf("account")).toBeLessThan(gatePlanForBAction("JOIN_TABLE").indexOf("age"))
  expect(gatePlanForBAction("SUBMIT_LOCAL_SIGNAL")).toEqual(["account", "person"])
  expect(gatePlanForBAction("START_CHECKOUT")).toEqual(["account", "payment_kyc"])
  expect(gatePlanForBAction("MINT_BADGE")).toEqual(["person"])

  const table = createBTableActionReturn({ tableId: "table-seoul-night-bites", venueId: VENUE_ID, draft: "Window seat", now: NOW })
  const signal = createBLocalSignalActionReturn({ venueId: VENUE_ID, draftNonce: "draft:1", tags: ["calm_now", "calm_now", "welcoming"], note: "  still calm  ", photoPreviewUrl: "blob:http://localhost/local-signal-photo", now: NOW })
  const quote = createStableCommerceBLockedQuoteFromMode("ktour", new Date(NOW.getTime() + B_ACTION_GATE_TTL_MS))
  const checkout = createBCheckoutActionReturn({ venueId: VENUE_ID, quote, now: NOW })
  const badge = createBBadgeActionReturn({ now: NOW })

  expect(() => createBCheckoutActionReturn({ venueId: NON_OFFER_VENUE_ID, now: NOW })).toThrow("Invalid checkout return context")

  expect(B_ACTION_GATE_TTL_MS).toBe(15 * 60 * 1000)
  expect(table.tokenId).toBe(`RT-JOIN_TABLE-${NOW.getTime()}`)
  expect(signal.tokenId).toBe(`RT-SUBMIT_LOCAL_SIGNAL-${NOW.getTime()}`)
  expect(checkout.tokenId).toBe(`RT-START_CHECKOUT-${NOW.getTime()}`)
  expect(signal).not.toHaveProperty("tags")
  expect(signal).not.toHaveProperty("photoPreviewUrl")
  expect(checkout).not.toHaveProperty("offerId")
  expect(checkout).not.toHaveProperty("benefitMode")
  expect(Object.keys(checkout).sort()).toEqual([
    "consumedAt", "createdAt", "cta", "expiresAt", "gatePlan", "tokenId", "venueId", "version",
  ].sort())
  expect(privateContextForBAction(signal)).toMatchObject({ tags: ["calm_now", "welcoming"], photoPreviewUrl: "blob:http://localhost/local-signal-photo" })
  const checkoutContext = privateContextForBAction(checkout)
  expect(checkoutContext).toEqual({ cta: "START_CHECKOUT", quote })
  if (checkoutContext?.cta === "START_CHECKOUT") {
    ;(checkoutContext.quote as unknown as { finalDebit: number }).finalDebit = 999
  }
  expect(privateContextForBAction(checkout)).toEqual({ cta: "START_CHECKOUT", quote })
  const swappedQuote = createStableCommerceBLockedQuoteFromMode("standard", new Date(NOW.getTime() + B_ACTION_GATE_TTL_MS))
  expect(() => createBCheckoutActionReturn({ venueId: VENUE_ID, quote: swappedQuote, now: NOW })).toThrow("Action token collision")
  expect(privateContextForBAction(checkout)).toEqual({ cta: "START_CHECKOUT", quote })
  expect(badge).not.toHaveProperty("venueId")
  for (const envelope of [table, signal, checkout, badge]) {
    expect(isBActionReturnPending(envelope, NOW)).toBe(true)
    expect(Date.parse(envelope.expiresAt) - Date.parse(envelope.createdAt)).toBe(B_ACTION_GATE_TTL_MS)
  }
})

test("B-ACTION-GATE-002 the full plan is rechecked and a return envelope can be consumed exactly once", () => {
  const envelope = createBCheckoutActionReturn({ venueId: VENUE_ID, now: NOW })
  expect(consumeBActionReturnTo(envelope, new Set(["account"]), NOW)).toBeNull()
  const consumed = consumeBActionReturnTo(envelope, new Set(["account", "payment_kyc"]), NOW)
  expect(consumed?.consumedAt).toBe(NOW.toISOString())
  expect(consumeBActionReturnTo(consumed!, new Set(["account", "payment_kyc"]), NOW)).toBeNull()

  const storage = new MemoryStorage({
    [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({
      version: 1,
      person: { status: "unverified", expiresAt: null },
      payment: { status: "eligible", expiresAt: new Date(NOW.getTime() + B_ACTION_AXIS_TTL_MS).toISOString() },
      pending: envelope,
      lastConsumed: null,
      outcome: null,
    }),
  })
  expect(consumePendingBActionAtMutation(storage as unknown as Storage, envelope, new Set(["account"]), NOW)).toBeNull()
  const atomic = consumePendingBActionAtMutation(storage as unknown as Storage, envelope, new Set(["account", "payment_kyc"]), NOW)
  if (!atomic || atomic.cta !== "START_CHECKOUT") throw new Error("Expected the exact consumed checkout action")
  expect(atomic?.consumedAt).toBe(NOW.toISOString())
  expect(restoreBActionGateSession(storage as unknown as Storage, NOW)).toMatchObject({ pending: null, lastConsumed: { tokenId: envelope.tokenId } })
  expect(consumePendingBActionAtMutation(storage as unknown as Storage, envelope, new Set(["account", "payment_kyc"]), NOW)).toBeNull()
  const swappedAtomic = { ...atomic!, venueId: NON_OFFER_VENUE_ID }
  expect(hashBActionReturnTo(swappedAtomic)).not.toBe(hashBActionReturnTo(atomic!))
  expect(restoreConsumedBActionAfterMutationFailure(storage as unknown as Storage, swappedAtomic, NOW)).toBe(false)
  expect(finalizeConsumedBAction(storage as unknown as Storage, swappedAtomic, NOW)).toBe(false)
  expect(restoreConsumedBActionAfterMutationFailure(storage as unknown as Storage, atomic!, NOW)).toBe(true)
  expect(restoreBActionGateSession(storage as unknown as Storage, NOW)).toMatchObject({ pending: { tokenId: envelope.tokenId, consumedAt: null }, lastConsumed: null })
  expect(consumePendingBActionAtMutation(storage as unknown as Storage, envelope, new Set(["account", "payment_kyc"]), NOW)?.consumedAt).toBe(NOW.toISOString())
  const unrelated = createBCheckoutActionReturn({ venueId: VENUE_ID, now: new Date(NOW.getTime() + 1) })
  expect(restoreConsumedBActionAfterMutationFailure(storage as unknown as Storage, { ...unrelated, consumedAt: NOW.toISOString() }, NOW)).toBe(false)

  const signal = createBLocalSignalActionReturn({ venueId: VENUE_ID, draftNonce: "private:1", tags: ["calm_now"], note: "discard this note", now: NOW })
  const signalStorage = new MemoryStorage({
    [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({
      version: 1,
      person: { status: "eligible", expiresAt: new Date(NOW.getTime() + B_ACTION_AXIS_TTL_MS).toISOString() },
      payment: { status: "unverified", expiresAt: null },
      pending: signal,
      lastConsumed: null,
      outcome: null,
    }),
  })
  const consumedSignal = consumePendingBActionAtMutation(signalStorage as unknown as Storage, signal, new Set(["account", "person"]), NOW)!
  const consumedSession = JSON.parse(signalStorage.raw(B_ACTION_GATE_SESSION_KEY)!)
  expect(consumedSession.lastConsumed).toEqual({
    tokenId: signal.tokenId,
    cta: signal.cta,
    consumedAt: NOW.toISOString(),
    snapshotHash: hashBActionReturnTo(consumedSignal),
  })
  expect(signalStorage.raw(B_ACTION_GATE_SESSION_KEY)).not.toContain("discard this note")
  expect(finalizeConsumedBAction(signalStorage as unknown as Storage, consumedSignal, NOW)).toBe(true)
  expect(restoreBActionGateSession(signalStorage as unknown as Storage, NOW).lastConsumed).toBeNull()

  const abandoned = createBLocalSignalActionReturn({ venueId: VENUE_ID, draftNonce: "private:2", tags: ["welcoming"], note: "close me", now: NOW })
  signalStorage.setItem(B_ACTION_GATE_SESSION_KEY, JSON.stringify({
    ...restoreBActionGateSession(signalStorage as unknown as Storage, NOW),
    pending: abandoned,
  }))
  expect(abandonPendingBAction(signalStorage as unknown as Storage, abandoned, NOW)).toBe(true)
  expect(signalStorage.raw(B_ACTION_GATE_SESSION_KEY)).not.toContain("close me")

  expect(isBActionReturnStructurallyValid({ ...envelope, gatePlan: ["payment_kyc"] })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, tableId: "table-injected" })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, tokenId: `RT-START_CHECKOUT-${NOW.getTime() + 1}` })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, consumedAt: "not-a-date" })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, venueId: NON_OFFER_VENUE_ID })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, venueId: "editorial-jeju-candidate" })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, offerId: "meal-offer-gukbap" })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, benefitMode: "ktour" })).toBe(false)

  const badge = createBBadgeActionReturn({ now: NOW })
  const badgeStorage = new MemoryStorage({
    [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({
      version: 1,
      person: { status: "eligible", expiresAt: new Date(NOW.getTime() + B_ACTION_AXIS_TTL_MS).toISOString() },
      payment: { status: "unverified", expiresAt: null },
      pending: badge,
      personRoute: null,
      presentation: null,
      lastConsumed: null,
      outcome: null,
    }),
  })
  const consumedBadge = consumePendingBActionAtMutation(badgeStorage as unknown as Storage, badge, new Set(["person"]), NOW)
  expect(consumedBadge?.cta).toBe("MINT_BADGE")
  expect(consumePendingBActionAtMutation(badgeStorage as unknown as Storage, badge, new Set(["person"]), NOW)).toBeNull()
  expect(finalizeConsumedBAction(badgeStorage as unknown as Storage, consumedBadge!, NOW)).toBe(true)
})

test("B-ACTION-GATE-002A terminal action journal and product mutation fail closed as one publication boundary", () => {
  const terminalWriteThrows = new FaultStorage()
  const thrownWrite = prepareConsumedCheckout(terminalWriteThrows, 10)
  terminalWriteThrows.armFaults([[1, "throw"]])
  let commitCalls = 0
  expect(finalizeConsumedBActionWithMutation(
    terminalWriteThrows as unknown as Storage,
    thrownWrite.consumed,
    () => { commitCalls += 1; return true },
    thrownWrite.now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(commitCalls).toBe(0)
  expect(restoreBActionGateSession(terminalWriteThrows as unknown as Storage, thrownWrite.now, REVIEW_OPTIONS)).toMatchObject({
    pending: { tokenId: thrownWrite.checkout.tokenId, consumedAt: null },
    lastConsumed: null,
  })

  const terminalWriteIgnored = new FaultStorage()
  const ignoredWrite = prepareConsumedCheckout(terminalWriteIgnored, 20)
  terminalWriteIgnored.armFaults([[1, "ignore"]])
  commitCalls = 0
  expect(finalizeConsumedBActionWithMutation(
    terminalWriteIgnored as unknown as Storage,
    ignoredWrite.consumed,
    () => { commitCalls += 1; return true },
    ignoredWrite.now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(commitCalls).toBe(0)
  expect(restoreBActionGateSession(terminalWriteIgnored as unknown as Storage, ignoredWrite.now, REVIEW_OPTIONS)).toMatchObject({
    pending: { tokenId: ignoredWrite.checkout.tokenId, consumedAt: null },
    lastConsumed: null,
  })

  const commitRejected = new FaultStorage()
  const rejected = prepareConsumedCheckout(commitRejected, 30)
  let receiptMutations = 0
  let balanceMutations = 0
  let viewMutations = 0
  let completionEvents = 0
  expect(finalizeConsumedBActionWithMutation(
    commitRejected as unknown as Storage,
    rejected.consumed,
    () => false,
    rejected.now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect({ receiptMutations, balanceMutations, viewMutations, completionEvents }).toEqual({
    receiptMutations: 0,
    balanceMutations: 0,
    viewMutations: 0,
    completionEvents: 0,
  })
  expect(privateContextForBAction(rejected.checkout)).not.toBeNull()
  expect(restoreBActionGateSession(commitRejected as unknown as Storage, rejected.now, REVIEW_OPTIONS)).toMatchObject({
    pending: { tokenId: rejected.checkout.tokenId, consumedAt: null },
    lastConsumed: null,
  })

  const commitThrows = new FaultStorage()
  const throwing = prepareConsumedCheckout(commitThrows, 40)
  expect(finalizeConsumedBActionWithMutation(
    commitThrows as unknown as Storage,
    throwing.consumed,
    () => { throw new Error("product commit failed before mutation") },
    throwing.now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(restoreBActionGateSession(commitThrows as unknown as Storage, throwing.now, REVIEW_OPTIONS)).toMatchObject({
    pending: { tokenId: throwing.checkout.tokenId, consumedAt: null },
    lastConsumed: null,
  })

  const presentationRetry = new FaultStorage()
  const presented = prepareConsumedCheckout(presentationRetry, 45, "ktour")
  expect(finalizeConsumedBActionWithMutation(
    presentationRetry as unknown as Storage,
    presented.consumed,
    () => false,
    presented.now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(restoreBActionGateSession(presentationRetry as unknown as Storage, presented.now, REVIEW_OPTIONS)).toMatchObject({
    pending: { tokenId: presented.checkout.tokenId, consumedAt: null },
    presentation: { tokenId: presented.checkout.tokenId, approvedAt: presented.now.toISOString() },
    lastConsumed: null,
  })
  const reconsumedPresentation = consumePendingBActionAtMutation(
    presentationRetry as unknown as Storage,
    presented.checkout,
    new Set(["account", "payment_kyc"]),
    new Date(presented.now.getTime() + 1),
    REVIEW_OPTIONS,
  )
  expect(reconsumedPresentation).not.toBeNull()
  expect(finalizeConsumedBActionWithMutation(
    presentationRetry as unknown as Storage,
    reconsumedPresentation!,
    () => true,
    new Date(presented.now.getTime() + 1),
    REVIEW_OPTIONS,
  )).toBe(true)

  const rollbackWriteFails = new FaultStorage()
  const blockedRollback = prepareConsumedCheckout(rollbackWriteFails, 50)
  // The product callback rejects after the terminal journal is durable. The
  // single exact pending restore is ignored, leaving the terminal tombstone.
  rollbackWriteFails.armFaults([[2, "ignore"]])
  let blockedCommitCalls = 0
  expect(finalizeConsumedBActionWithMutation(
    rollbackWriteFails as unknown as Storage,
    blockedRollback.consumed,
    () => { blockedCommitCalls += 1; return false },
    blockedRollback.now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(blockedCommitCalls).toBe(1)
  expect(restoreBActionGateSession(rollbackWriteFails as unknown as Storage, blockedRollback.now, REVIEW_OPTIONS)).toMatchObject({
    pending: null,
    lastConsumed: null,
  })
  let blockedReplayCalls = 0
  expect(finalizeConsumedBActionWithMutation(
    rollbackWriteFails as unknown as Storage,
    blockedRollback.consumed,
    () => { blockedReplayCalls += 1; return true },
    blockedRollback.now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(blockedReplayCalls).toBe(0)
  expect({ receiptMutations, balanceMutations, viewMutations, completionEvents }).toEqual({
    receiptMutations: 0,
    balanceMutations: 0,
    viewMutations: 0,
    completionEvents: 0,
  })

  const succeeds = new FaultStorage()
  const success = prepareConsumedCheckout(succeeds, 60)
  expect(finalizeConsumedBActionWithMutation(
    succeeds as unknown as Storage,
    success.consumed,
    () => { receiptMutations += 1; balanceMutations += 1; return true },
    success.now,
    REVIEW_OPTIONS,
  )).toBe(true)
  viewMutations += 1
  completionEvents += 1
  expect({ receiptMutations, balanceMutations, viewMutations, completionEvents }).toEqual({
    receiptMutations: 1,
    balanceMutations: 1,
    viewMutations: 1,
    completionEvents: 1,
  })
  expect(privateContextForBAction(success.checkout)).toBeNull()
  expect(restoreBActionGateSession(succeeds as unknown as Storage, success.now, REVIEW_OPTIONS)).toMatchObject({
    pending: null,
    lastConsumed: null,
  })
  let replayCommitCalls = 0
  expect(finalizeConsumedBActionWithMutation(
    succeeds as unknown as Storage,
    success.consumed,
    () => { replayCommitCalls += 1; return true },
    success.now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(replayCommitCalls).toBe(0)
})

test("B-ACTION-GATE-002B ignored terminal writes never publish badge success or replay a quarantined consume", () => {
  const retryable = new FaultStorage()
  const first = prepareConsumedBadge(retryable, 70)
  retryable.armFaults([[1, "ignore"]])
  expect(finalizeConsumedBAction(retryable as unknown as Storage, first.consumed, first.now, REVIEW_OPTIONS)).toBe(false)
  expect(restoreBActionGateSession(retryable as unknown as Storage, first.now, REVIEW_OPTIONS)).toMatchObject({
    pending: { tokenId: first.badge.tokenId, consumedAt: null },
    lastConsumed: null,
  })

  const quarantined = new FaultStorage()
  const blocked = prepareConsumedBadge(quarantined, 80)
  // terminal, exact-pending recovery, and tombstone writes are all ignored.
  // Storage remains on the consumed marker, so the in-memory attempt guard is
  // the final fail-closed boundary for this broken-storage runtime.
  quarantined.armFaults([[1, "ignore"], [2, "ignore"], [3, "ignore"]])
  expect(finalizeConsumedBAction(quarantined as unknown as Storage, blocked.consumed, blocked.now, REVIEW_OPTIONS)).toBe(false)
  expect(restoreBActionGateSession(quarantined as unknown as Storage, blocked.now, REVIEW_OPTIONS)).toMatchObject({
    pending: null,
    lastConsumed: { tokenId: blocked.badge.tokenId },
  })
  expect(finalizeConsumedBAction(quarantined as unknown as Storage, blocked.consumed, blocked.now, REVIEW_OPTIONS)).toBe(false)
  expect(restoreBActionGateSession(quarantined as unknown as Storage, blocked.now, REVIEW_OPTIONS)).toMatchObject({
    pending: null,
    lastConsumed: { tokenId: blocked.badge.tokenId },
  })
})

test("B-ACTION-GATE-002C ignored, mismatched, or throwing consume writes cannot reach a product mutation", () => {
  for (const [index, fault] of ([["ignored", "ignore"], ["mismatched", "mismatch"], ["throwing", "throw"]] as const).entries()) {
    const storage = new FaultStorage()
    const prepared = preparePendingSignal(storage, 100 + index * 10)
    storage.armFaults([[1, fault[1]]])
    let productMutations = 0
    let completionEvents = 0
    const first = consumePendingBActionAtMutation(
      storage as unknown as Storage,
      prepared.signal,
      new Set(["account", "person"]),
      prepared.now,
      REVIEW_OPTIONS,
    )
    if (first) {
      finalizeConsumedBActionWithMutation(
        storage as unknown as Storage,
        first,
        () => { productMutations += 1; return true },
        prepared.now,
        REVIEW_OPTIONS,
      )
      completionEvents += 1
    }
    expect(first, fault[0]).toBeNull()
    expect({ productMutations, completionEvents }, fault[0]).toEqual({ productMutations: 0, completionEvents: 0 })

    const second = consumePendingBActionAtMutation(
      storage as unknown as Storage,
      prepared.signal,
      new Set(["account", "person"]),
      new Date(prepared.now.getTime() + 1),
      REVIEW_OPTIONS,
    )
    if (fault[1] === "mismatch") {
      expect(second).toBeNull()
      continue
    }
    expect(second).not.toBeNull()
    expect(finalizeConsumedBActionWithMutation(
      storage as unknown as Storage,
      second!,
      () => { productMutations += 1; return true },
      new Date(prepared.now.getTime() + 1),
      REVIEW_OPTIONS,
    )).toBe(true)
    completionEvents += 1
    expect({ productMutations, completionEvents }).toEqual({ productMutations: 1, completionEvents: 1 })
  }
})

test("B-ACTION-GATE-003 current session wins; provenance-free legacy axes stay unverified and untouched", () => {
  const legacyRaw = JSON.stringify({ account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", profile: { displayName: "kept" } })
  const legacyOnly = new MemoryStorage({ "ondo.session.v3": legacyRaw })
  const migrated = restoreBActionGateSession(legacyOnly as unknown as Storage, NOW)
  expect(migrated.person).toEqual({ status: "unverified", expiresAt: null })
  expect(migrated.payment).toEqual({ status: "unverified", expiresAt: null })
  expect(legacyOnly.raw("ondo.session.v3")).toBe(legacyRaw)
  expect(legacyOnly.raw(B_ACTION_GATE_SESSION_KEY)).toBeNull()

  const currentWins = new MemoryStorage({
    "ondo.session.v3": legacyRaw,
    [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({ version: 9, person: { status: "eligible" }, payment: { status: "eligible" } }),
  })
  expect(restoreBActionGateSession(currentWins as unknown as Storage, NOW)).toMatchObject({
    person: { status: "unverified", expiresAt: null },
    payment: { status: "unverified", expiresAt: null },
    pending: null,
  })

  for (const injected of [
    { person: "PER-VERIFIED" },
    { paymentKyc: "PKY-VERIFIED" },
    { person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", provider: "connected" },
  ]) {
    const storage = new MemoryStorage({ "ondo.session.v3": JSON.stringify(injected) })
    expect(restoreBActionGateSession(storage as unknown as Storage, NOW, REVIEW_OPTIONS)).toMatchObject({
      person: { status: "unverified", expiresAt: null },
      payment: { status: "unverified", expiresAt: null },
      pending: null,
    })
    expect(storage.raw(B_ACTION_GATE_SESSION_KEY)).toBeNull()
  }
})

test("B-ACTION-GATE-003A serialized or legacy eligibility cannot bypass Person or Payment authority", () => {
  const personExecution = successfulAxisReview("person")
  const paymentExecution = successfulAxisReview("payment_kyc")
  expect(createBActionReviewAxis("person", JSON.parse(JSON.stringify(personExecution)), NOW)).toBeNull()
  expect(createBActionReviewAxis("payment_kyc", JSON.parse(JSON.stringify(paymentExecution)), NOW)).toBeNull()
  const person = createBActionReviewAxis("person", personExecution, NOW)
  const payment = createBActionReviewAxis("payment_kyc", paymentExecution, NOW)
  expect(person).toMatchObject({
    status: "eligible",
    reviewReceipt: { issuer: "ONDO_REVIEW_FIXTURE", provenanceTruth: "SIMULATED", fixtureId: "FX-PER-CONTRACT-SUCCESS" },
  })
  expect(payment).toMatchObject({
    status: "eligible",
    reviewReceipt: { issuer: "ONDO_REVIEW_FIXTURE", provenanceTruth: "SIMULATED", fixtureId: "FX-PKY-CONTRACT-SUCCESS" },
  })

  const legitimate = new MemoryStorage({
    [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({
      version: 1,
      person,
      payment,
      pending: null,
      personRoute: null,
      presentation: null,
      lastConsumed: null,
      outcome: null,
    }),
  })
  // A production/default restore quarantines review-only evidence even when
  // the serialized receipt is otherwise internally consistent.
  expect(restoreBActionGateSession(legitimate as unknown as Storage, NOW)).toMatchObject({
    person: { status: "unverified", expiresAt: null },
    payment: { status: "unverified", expiresAt: null },
  })
  expect(restoreBActionGateSession(legitimate as unknown as Storage, NOW, REVIEW_OPTIONS)).toMatchObject({
    person: { status: "unverified", expiresAt: null },
    payment: { status: "unverified", expiresAt: null },
  })

  const explicitCurrentSession = new MemoryStorage()
  expect(persistBActionGateSession(explicitCurrentSession as unknown as Storage, {
    version: 1,
    person: person!,
    payment: payment!,
    pending: null,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }, NOW, REVIEW_OPTIONS)).toBe(true)
  expect(restoreBActionGateSession(explicitCurrentSession as unknown as Storage, NOW, REVIEW_OPTIONS)).toMatchObject({
    person: { status: "eligible", reviewReceipt: { fixtureId: "FX-PER-CONTRACT-SUCCESS" } },
    payment: { status: "eligible", reviewReceipt: { fixtureId: "FX-PKY-CONTRACT-SUCCESS" } },
  })
  expect(restoreBActionGateSession(explicitCurrentSession as unknown as Storage, new Date(NOW.getTime() + B_ACTION_AXIS_TTL_MS + 1), REVIEW_OPTIONS)).toMatchObject({
    person: { status: "expired", expiresAt: person!.expiresAt, reviewReceipt: { fixtureId: "FX-PER-CONTRACT-SUCCESS", provenanceTruth: "SIMULATED" } },
    payment: { status: "expired", expiresAt: payment!.expiresAt, reviewReceipt: { fixtureId: "FX-PKY-CONTRACT-SUCCESS", provenanceTruth: "SIMULATED" } },
  })

  // Expired provenance remains displayable only while the mounted storage has
  // the live expectation. The same serialized bytes in another storage are
  // not authority and collapse to generic unverified axes.
  const forgedExpiredReplay = new MemoryStorage({
    [B_ACTION_GATE_SESSION_KEY]: explicitCurrentSession.raw(B_ACTION_GATE_SESSION_KEY)!,
  })
  expect(restoreBActionGateSession(
    forgedExpiredReplay as unknown as Storage,
    new Date(NOW.getTime() + B_ACTION_AXIS_TTL_MS + 1),
    REVIEW_OPTIONS,
  )).toMatchObject({
    person: { status: "unverified", expiresAt: null },
    payment: { status: "unverified", expiresAt: null },
  })

  const forgedAxes = [
    {
      person: { status: "eligible", expiresAt: person!.expiresAt },
      payment: { status: "eligible", expiresAt: payment!.expiresAt },
    },
    {
      person: { ...person, reviewReceipt: { ...person!.reviewReceipt, issuer: "FORGED" } },
      payment: { ...payment, reviewReceipt: { ...payment!.reviewReceipt, provenanceTruth: "LIVE" } },
    },
    {
      person: { ...person, reviewReceipt: payment!.reviewReceipt },
      payment: { ...payment, reviewReceipt: person!.reviewReceipt },
    },
  ]
  for (const axes of forgedAxes) {
    const storage = new MemoryStorage({
      [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({
        version: 1,
        ...axes,
        pending: null,
        personRoute: null,
        presentation: null,
        lastConsumed: null,
        outcome: null,
      }),
    })
    expect(restoreBActionGateSession(storage as unknown as Storage, NOW, REVIEW_OPTIONS)).toMatchObject({
      person: { status: "unverified", expiresAt: null },
      payment: { status: "unverified", expiresAt: null },
    })
  }

  const directStorage = new MemoryStorage()
  expect(updateBActionAxisSession(directStorage as unknown as Storage, "person", "eligible", NOW)).toBeNull()
  expect(updateBActionAxisSession(directStorage as unknown as Storage, "person", "eligible", NOW, {
    allowReviewFixture: false,
    reviewExecution: personExecution,
  })).toBeNull()
  const updatedPerson = updateBActionAxisSession(directStorage as unknown as Storage, "person", "eligible", NOW, {
    ...REVIEW_OPTIONS,
    reviewExecution: personExecution,
  })
  expect(updatedPerson?.person).toMatchObject({ status: "eligible", reviewReceipt: { fixtureId: "FX-PER-CONTRACT-SUCCESS" } })

  const failureAuthority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-PKY-CONTRACT-FAIL" })!
  const failedPayment = reviewFixture<{ axis: "payment_kyc" }>(failureAuthority, { outcome: "failure", now: NOW })
  expect(updateBActionAxisSession(directStorage as unknown as Storage, "payment_kyc", "eligible", NOW, {
    ...REVIEW_OPTIONS,
    reviewExecution: failedPayment,
  })).toBeNull()
})

test("B-ACTION-GATE-003C abandon, clear, and expired renewal publish only after exact durable storage", () => {
  const abandonStorage = new FaultStorage()
  const abandoned = preparePendingSignal(abandonStorage, 200)
  abandonStorage.armFaults([[1, "ignore"]])
  abandonStorage.armRemoveFault("ignore")
  let cancelPublications = 0
  expect(abandonPendingBAction(abandonStorage as unknown as Storage, abandoned.signal, abandoned.now, REVIEW_OPTIONS, () => { cancelPublications += 1 })).toBe(false)
  expect(cancelPublications).toBe(0)
  expect(privateContextForBAction(abandoned.signal)).not.toBeNull()
  expect(restoreBActionGateSession(abandonStorage as unknown as Storage, abandoned.now, REVIEW_OPTIONS).pending?.tokenId).toBe(abandoned.signal.tokenId)

  abandonStorage.armFaults([])
  abandonStorage.armRemoveFault(null)
  expect(abandonPendingBAction(abandonStorage as unknown as Storage, abandoned.signal, abandoned.now, REVIEW_OPTIONS, (pending) => {
    expect(pending.tokenId).toBe(abandoned.signal.tokenId)
    expect(privateContextForBAction(abandoned.signal)).not.toBeNull()
    cancelPublications += 1
  })).toBe(true)
  expect(cancelPublications).toBe(1)
  expect(privateContextForBAction(abandoned.signal)).toBeNull()

  for (const removeFault of ["ignore", "mismatch", "throw"] as const) {
    const storage = new FaultStorage()
    const prepared = preparePendingSignal(storage, 210 + (removeFault === "ignore" ? 0 : removeFault === "mismatch" ? 1 : 2))
    storage.armRemoveFault(removeFault)
    expect(clearBActionGateSession(storage as unknown as Storage), removeFault).toBe(false)
    expect(privateContextForBAction(prepared.signal), removeFault).not.toBeNull()
    expect(storage.raw(B_ACTION_GATE_SESSION_KEY), removeFault).not.toBeNull()
    storage.armRemoveFault(null)
    expect(clearBActionGateSession(storage as unknown as Storage)).toBe(true)
    expect(privateContextForBAction(prepared.signal)).toBeNull()
    expect(storage.raw(B_ACTION_GATE_SESSION_KEY)).toBeNull()
  }

  const renewalStorage = new FaultStorage()
  const original = preparePendingSignal(renewalStorage, 220)
  const renewalNow = new Date(original.now.getTime() + B_ACTION_GATE_TTL_MS + 1)
  renewalStorage.armFaults([[1, "ignore"]])
  expect(renewExpiredPendingBAction(renewalStorage as unknown as Storage, original.signal, renewalNow, REVIEW_OPTIONS)).toBeNull()
  expect(privateContextForBAction(original.signal)).not.toBeNull()
  expect(restoreBActionGateSession(renewalStorage as unknown as Storage, renewalNow, REVIEW_OPTIONS).pending?.tokenId).toBe(original.signal.tokenId)

  renewalStorage.armFaults([])
  const renewed = renewExpiredPendingBAction(renewalStorage as unknown as Storage, original.signal, renewalNow, REVIEW_OPTIONS)
  expect(renewed?.pending.tokenId).not.toBe(original.signal.tokenId)
  expect(renewed?.pending.consumedAt).toBeNull()
  expect(privateContextForBAction(original.signal)).toBeNull()
  expect(renewed && privateContextForBAction(renewed.pending)).not.toBeNull()

  const failedAxisPersist = new FaultStorage()
  const person = createBActionReviewAxis("person", successfulAxisReview("person"), NOW)!
  const injectedSession = {
    version: 1 as const,
    person,
    payment: { status: "unverified" as const, expiresAt: null },
    pending: null,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }
  failedAxisPersist.armFaults([[1, "ignore"]])
  expect(persistBActionGateSession(failedAxisPersist as unknown as Storage, injectedSession, NOW, REVIEW_OPTIONS)).toBe(false)
  failedAxisPersist.armFaults([])
  failedAxisPersist.setItem(B_ACTION_GATE_SESSION_KEY, JSON.stringify(injectedSession))
  expect(restoreBActionGateSession(failedAxisPersist as unknown as Storage, NOW, REVIEW_OPTIONS).person).toEqual({ status: "unverified", expiresAt: null })

  const clearedAxisStorage = new FaultStorage()
  expect(persistBActionGateSession(clearedAxisStorage as unknown as Storage, injectedSession, NOW, REVIEW_OPTIONS)).toBe(true)
  const serializedLiveAxis = clearedAxisStorage.raw(B_ACTION_GATE_SESSION_KEY)!
  expect(clearBActionGateSession(clearedAxisStorage as unknown as Storage)).toBe(true)
  clearedAxisStorage.setItem(B_ACTION_GATE_SESSION_KEY, serializedLiveAxis)
  expect(restoreBActionGateSession(clearedAxisStorage as unknown as Storage, NOW, REVIEW_OPTIONS).person).toEqual({ status: "unverified", expiresAt: null })

  const resetTransactionStorage = new FaultStorage()
  expect(persistBActionGateSession(resetTransactionStorage as unknown as Storage, injectedSession, NOW, REVIEW_OPTIONS)).toBe(true)
  const beforeRuntimeForget = resetTransactionStorage.raw(B_ACTION_GATE_SESSION_KEY)
  forgetBActionGateRuntimeAuthorityAfterReset(resetTransactionStorage)
  expect(resetTransactionStorage.raw(B_ACTION_GATE_SESSION_KEY)).toBe(beforeRuntimeForget)
  expect(restoreBActionGateSession(resetTransactionStorage as unknown as Storage, NOW, REVIEW_OPTIONS).person).toEqual({ status: "unverified", expiresAt: null })
})

test("B-ACTION-GATE-003D rejected requests retire only their exact process-memory authority", () => {
  const requestNow = new Date(Date.now() - 1_000)
  const existing = createBLocalSignalActionReturn({
    venueId: VENUE_ID,
    draftNonce: "request:existing",
    tags: ["calm_now"],
    note: "existing private draft",
    now: requestNow,
  })
  const conflictStorage = new MemoryStorage()
  expect(persistBActionGateSession(conflictStorage as unknown as Storage, {
    version: 1,
    person: { status: "unverified", expiresAt: null },
    payment: { status: "unverified", expiresAt: null },
    pending: existing,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }, requestNow)).toBe(true)
  const rejected = createBLocalSignalActionReturn({
    venueId: NON_OFFER_VENUE_ID,
    draftNonce: "request:conflict",
    tags: ["welcoming"],
    note: "must be retired",
    now: new Date(requestNow.getTime() + 1),
  })
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const installWindow = (storage: MemoryStorage) => Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: storage, dispatchEvent: () => true },
  })
  try {
    installWindow(conflictStorage)
    expect(requestBActionGate(rejected)).toBe(false)
    expect(privateContextForBAction(rejected)).toBeNull()
    expect(privateContextForBAction(existing)).toMatchObject({ note: "existing private draft" })

    const writeFailureStorage = new FaultStorage()
    writeFailureStorage.armFaults([[1, "ignore"]])
    const writeRejected = createBLocalSignalActionReturn({
      venueId: VENUE_ID,
      draftNonce: "request:write-failure",
      tags: ["quick_stop"],
      note: "must also be retired",
      now: new Date(requestNow.getTime() + 2),
    })
    installWindow(writeFailureStorage)
    expect(requestBActionGate(writeRejected)).toBe(false)
    expect(privateContextForBAction(writeRejected)).toBeNull()

    const exact = createBLocalSignalActionReturn({
      venueId: VENUE_ID,
      draftNonce: "request:exact-cleanup",
      tags: ["lively_now"],
      note: "exact only",
      now: new Date(requestNow.getTime() + 3),
    })
    const forged = { ...exact, venueId: NON_OFFER_VENUE_ID }
    expect(discardUnrequestedBActionPrivateContext(forged)).toBe(false)
    expect(privateContextForBAction(exact)).toMatchObject({ note: "exact only" })
    expect(discardUnrequestedBActionPrivateContext(exact)).toBe(true)
    expect(privateContextForBAction(exact)).toBeNull()
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")
  }
})

test("B-ACTION-GATE-003B private drafts and K-Tour approval are bound to one exact envelope and one in-memory decision", () => {
  const localSignal = createBLocalSignalActionReturn({
    venueId: VENUE_ID,
    draftNonce: "binding:1",
    tags: ["calm_now"],
    note: "bound draft",
    now: NOW,
  })
  const sameTokenFieldSwap = { ...localSignal, venueId: NON_OFFER_VENUE_ID }
  expect(isBActionReturnStructurallyValid(sameTokenFieldSwap)).toBe(true)
  expect(privateContextForBAction(sameTokenFieldSwap)).toBeNull()
  const swappedStorage = new MemoryStorage({
    [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({
      version: 1,
      person: { status: "unverified", expiresAt: null },
      payment: { status: "unverified", expiresAt: null },
      pending: sameTokenFieldSwap,
      personRoute: null,
      presentation: null,
      lastConsumed: null,
      outcome: null,
    }),
  })
  expect(restoreBActionGateSession(swappedStorage as unknown as Storage, NOW, REVIEW_OPTIONS).pending).toBeNull()

  const quote = createStableCommerceBLockedQuoteFromMode("ktour", new Date(NOW.getTime() + B_ACTION_GATE_TTL_MS))
  const checkout = createBCheckoutActionReturn({ venueId: VENUE_ID, quote, now: NOW })
  const storage = new MemoryStorage({
    [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({
      version: 1,
      person: { status: "unverified", expiresAt: null },
      payment: { status: "unverified", expiresAt: null },
      pending: checkout,
      personRoute: null,
      presentation: { tokenId: checkout.tokenId, approvedAt: new Date(NOW.getTime() + 1_000).toISOString() },
      lastConsumed: null,
      outcome: null,
    }),
  })
  // A persisted marker alone has no decision authority.
  expect(restoreBActionGateSession(storage as unknown as Storage, NOW, REVIEW_OPTIONS).presentation).toBeNull()

  const request = createPresentationRequestB(NOW.getTime(), `presentation:${checkout.tokenId}`)
  expect(registerBActionPresentationRequest(checkout, { ...request, injected: true } as typeof request)).toBe(false)
  expect(registerBActionPresentationRequest(checkout, request)).toBe(true)
  const approved = resolvePresentationRequestB(request, "approve", NOW.getTime() + 1_000)
  const authority = authorizeBActionPresentationDecision(checkout, approved)
  expect(authority).not.toBeNull()

  const swappedCheckout = { ...checkout, gatePlan: ["account", "payment_kyc"] as const, venueId: NON_OFFER_VENUE_ID }
  expect(recordBActionPresentationApproval(storage as unknown as Storage, swappedCheckout as typeof checkout, authority!, NOW, REVIEW_OPTIONS)).toBeNull()
  const recorded = recordBActionPresentationApproval(storage as unknown as Storage, checkout, authority!, new Date(NOW.getTime() + 1_000), REVIEW_OPTIONS)
  expect(recorded?.presentation).toEqual({ tokenId: checkout.tokenId, approvedAt: new Date(NOW.getTime() + 1_000).toISOString() })
  expect(recordBActionPresentationApproval(storage as unknown as Storage, checkout, authority!, new Date(NOW.getTime() + 1_001), REVIEW_OPTIONS)).toBeNull()
  expect(restoreBActionGateSession(storage as unknown as Storage, new Date(NOW.getTime() + 1_001), REVIEW_OPTIONS).presentation).toEqual(recorded?.presentation)

  storage.setItem(B_ACTION_GATE_SESSION_KEY, JSON.stringify({ ...recorded, presentation: { ...recorded!.presentation, injected: true } }))
  expect(restoreBActionGateSession(storage as unknown as Storage, new Date(NOW.getTime() + 1_001), REVIEW_OPTIONS).presentation).toBeNull()
})

test("B-ACTION-GATE-004 B-native consumers, reset, localization and provider boundaries stay explicit", () => {
  const coordinator = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const table = source("features/ondo/connect/tables-entry-b.tsx")
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const checkout = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")

  for (const locale of ["en", "ko", "ja"]) expect(coordinator).toContain(`${locale}: {`)
  expect(coordinator).toContain("actions.activateAccount()")
  expect(coordinator).toContain("const requestedAt = new Date()")
  expect(coordinator).toContain("const readyAt = new Date()")
  expect(coordinator).toContain("restoreBActionGateSession(window.sessionStorage, readyAt, actionGateSessionOptions())")
  expect(coordinator).toContain("const actionAt = new Date()")
  expect(coordinator).toContain("const cancelAt = new Date()")
  expect(coordinator).toContain("const retryAt = new Date()")
  expect(coordinator).toContain("restoreBActionGateSession(window.sessionStorage, requestedAt")
  expect(coordinator).toContain("setClock(requestedAt)")
  const accountProcessing = coordinator.indexOf('activeGate !== "account" || view !== "processing"')
  const accountGateCommit = coordinator.indexOf('if (!commit({ ...latest, outcome: null }))', accountProcessing)
  const accountActivation = coordinator.indexOf("if (!actions.activateAccount())", accountProcessing)
  expect(accountProcessing).toBeGreaterThan(-1)
  expect(accountGateCommit).toBeGreaterThan(accountProcessing)
  expect(accountActivation).toBeGreaterThan(accountGateCommit)
  expect(coordinator.slice(accountGateCommit, accountActivation)).toContain("actions.cancelAccountActivation()")
  expect(coordinator).toContain("recordGlobalAfter19ReviewEligibilityB")
  expect(coordinator).toContain("function writeAccountGlobalAge")
  expect(coordinator).toContain("if (!accountActive) return false")
  expect(coordinator).toContain("persistGlobalAfter19SessionB(")
  expect(coordinator.indexOf("persistGlobalAfter19SessionB(")).toBeLessThan(coordinator.indexOf("window.dispatchEvent(new CustomEvent(GLOBAL_AFTER19_SESSION_EVENT"))
  const ageDecision = coordinator.indexOf('if (activeGate === "age")')
  const ageProcessing = coordinator.indexOf('activeGate !== "age" || view !== "processing"')
  const ageResult = coordinator.indexOf('activeGate !== "age" || view !== "success"')
  const agePersist = coordinator.indexOf("writeAccountGlobalAge", ageResult)
  expect(ageDecision).toBeGreaterThan(-1)
  expect(coordinator.slice(ageDecision, ageDecision + 1_800)).toContain('state.account !== "ACC-ACTIVE"')
  expect(coordinator.slice(ageDecision, ageDecision + 1_800)).toContain('setView("processing")')
  expect(coordinator.slice(ageDecision, ageDecision + 1_800)).not.toContain("writeAccountGlobalAge")
  expect(ageProcessing).toBeGreaterThan(-1)
  expect(ageResult).toBeGreaterThan(ageProcessing)
  expect(agePersist).toBeGreaterThan(ageResult)
  expect(coordinator.slice(ageResult, agePersist)).toContain('state.account !== "ACC-ACTIVE"')
  expect(coordinator).toContain('data-testid={gate === "person" ? "ondo-b-local-check-walkthrough" : gate === "age" ? "after19-walkthrough" : gate === "payment_kyc" ? "payment-check-walkthrough" : undefined}')
  expect(coordinator).toContain('gate === "age" || gate === "payment_kyc" ? resolvedView === "intro" ? "decision" : resolvedView === "success" ? "result" : resolvedView')
  expect(coordinator).toContain('data-testid="age-review-scope"')
  expect(coordinator).toContain("createReviewFixtureAuthority")
  expect(coordinator).toContain("providerUnavailable")
  expect(coordinator).not.toContain("recordGlobalAfter19AgeEligibilityB")
  expect(coordinator).not.toMatch(/OndoProvider|GateOverlay|fetch\(|XMLHttpRequest|WebSocket/)
  expect(table).toContain("createBTableActionReturn")
  expect(table).toContain("consumePendingBActionAtMutation")
  expect(table).toContain("finalizeConsumedBActionWithMutation")
  expect(table).not.toContain("restoreConsumedBActionAfterMutationFailure")
  expect(signal).toContain("createBLocalSignalActionReturn")
  expect(signal).toContain("consumePendingBActionAtMutation")
  expect(signal).toContain("abandonPendingBAction")
  expect(signal).toContain("finalizeConsumedBActionWithMutation")
  expect(signal).not.toContain("restoreConsumedBActionAfterMutationFailure")
  expect(checkout).toContain("createBCheckoutActionReturn")
  expect(checkout).toContain("consumePendingBActionAtMutation")
  expect(checkout).toContain("restoreConsumedBActionAfterMutationFailure")
  expect(checkout).toContain("finalizeConsumedBActionWithMutation")
  expect(coordinator).toContain("function paymentExecution()")
  expect(coordinator).toContain('providerUnavailable("payment_kyc")')
  const cancelStart = coordinator.indexOf("function cancel(")
  const cancelAbandon = coordinator.indexOf("if (!abandonPendingBAction", cancelStart)
  const cancelRestore = coordinator.indexOf("restoreContext(returning)", cancelStart)
  const cancelEvent = coordinator.indexOf("B_ACTION_GATE_CANCEL_EVENT", cancelStart)
  expect(cancelStart).toBeGreaterThan(-1)
  expect(cancelAbandon).toBeGreaterThan(cancelStart)
  expect(cancelRestore).toBeGreaterThan(cancelAbandon)
  expect(cancelEvent).toBeGreaterThan(cancelRestore)
  const retryStart = coordinator.indexOf("function retry()")
  const retryEnd = coordinator.indexOf("function handleKeyDown", retryStart)
  const retryBody = coordinator.slice(retryStart, retryEnd)
  expect(retryBody).toContain("renewExpiredPendingBAction")
  expect(retryBody).toContain('if (!renewed) { setView("failure"); return }')
  expect(retryBody).toContain('if (!commit({ ...session, outcome: null })) { setView("failure"); return }')
  expect(retryBody.indexOf('setView("intro")')).toBeGreaterThan(retryBody.indexOf("renewExpiredPendingBAction"))
  const checkoutConfirm = checkout.indexOf('actions.dispatchCommerce({ type: "CONFIRM", quote: checkoutContext.quote })')
  const checkoutAtomicBoundary = checkout.indexOf("const finalized = finalizeConsumedBActionWithMutation(")
  const checkoutDurableReturn = checkout.indexOf('() => actions.dispatchCommerce({ type: "PAYMENT_RETURN", outcome })', checkoutAtomicBoundary)
  const checkoutReadyListener = checkout.indexOf("const complete =", checkoutConfirm)
  const checkoutTerminalConsume = checkout.lastIndexOf("consumePendingBActionAtMutation", checkoutAtomicBoundary)
  expect(checkoutConfirm).toBeGreaterThan(-1)
  expect(checkoutAtomicBoundary).toBeGreaterThan(checkoutConfirm)
  expect(checkoutDurableReturn).toBeGreaterThan(checkoutAtomicBoundary)
  expect(checkoutReadyListener).toBeGreaterThan(checkoutConfirm)
  expect(checkout.slice(checkoutConfirm, checkoutReadyListener)).not.toContain("finalizeConsumedBAction")
  expect(checkoutTerminalConsume).toBeGreaterThan(checkoutReadyListener)
  expect(checkoutTerminalConsume).toBeLessThan(checkoutAtomicBoundary)
  expect(checkout.indexOf("restoreConsumedBActionAfterMutationFailure", checkoutDurableReturn)).toBeGreaterThan(checkoutDurableReturn)
  expect(checkout.indexOf('if (!finalized)', checkoutDurableReturn)).toBeGreaterThan(checkoutDurableReturn)
  expect(checkout.indexOf("B_ACTION_GATE_COMPLETE_EVENT", checkoutDurableReturn)).toBeGreaterThan(checkout.indexOf('if (!finalized)', checkoutDurableReturn))
  for (const [consumer, mutation] of [
    [table, "actions.recordPlannedTable(targetTable.id, targetTable.venueId)"],
    [signal, "actions.markLocalSignalPosted(activeVenue.id)"],
  ] as const) {
    const consume = consumer.indexOf("consumePendingBActionAtMutation")
    const finalize = consumer.indexOf("const finalized = finalizeConsumedBActionWithMutation(", consume)
    const product = consumer.indexOf(mutation, finalize)
    const failure = consumer.indexOf("if (!finalized)", product)
    const event = consumer.indexOf("B_ACTION_GATE_COMPLETE_EVENT", failure)
    expect(finalize).toBeGreaterThan(consume)
    expect(product).toBeGreaterThan(finalize)
    expect(failure).toBeGreaterThan(product)
    expect(event).toBeGreaterThan(failure)
  }
  expect(provider).toContain("actionGate: window.sessionStorage.getItem(B_ACTION_GATE_SESSION_KEY)")
  expect(provider).toContain("restoreValue(window.sessionStorage, B_ACTION_GATE_SESSION_KEY, previous.actionGate)")
  expect(provider).toContain("writeStorageValueWithReadback(window.sessionStorage, B_ACTION_GATE_SESSION_KEY, JSON.stringify(DEFAULT_B_ACTION_GATE_SESSION))")
  expect(provider).toContain("forgetBActionGateRuntimeAuthorityAfterReset(window.sessionStorage)")
  expect(provider).toContain("placeAfter19Return: window.sessionStorage.getItem(PLACE_AFTER19_RETURN_SESSION_KEY)")
  expect(provider).toContain("writeStorageValueWithReadback(window.sessionStorage, PLACE_AFTER19_RETURN_SESSION_KEY, JSON.stringify(DEFAULT_PLACE_AFTER19_RETURN_SESSION))")
  expect(provider).toContain("restoreValue(window.sessionStorage, PLACE_AFTER19_RETURN_SESSION_KEY, previous.placeAfter19Return)")
  expect(provider).toContain("clearGuestAfter19MemoryB()")
  const clearDeviceStart = provider.indexOf("clearBDeviceContent: () =>")
  const clearDeviceFailure = provider.indexOf("if (!cleared)", clearDeviceStart)
  const clearGuestMemory = provider.indexOf("clearGuestAfter19MemoryB()", clearDeviceStart)
  expect(clearDeviceStart).toBeGreaterThan(-1)
  expect(clearGuestMemory).toBeGreaterThan(clearDeviceFailure)
  expect(updateBActionAxisSession(new MemoryStorage() as unknown as Storage, "person", "eligible", NOW)).toBeNull()
})
