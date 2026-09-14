import { expect, test } from "@playwright/test"
import {
  B_ACTION_GATE_SESSION_KEY,
  clearBActionGateSession,
  consumePendingBActionAtMutation,
  createBActionReviewAxis,
  createBBadgeActionReturn,
  createBCheckoutActionReturn,
  finalizeConsumedBAction,
  finalizeConsumedBActionWithMutation,
  persistBActionGateSession,
  restoreBActionGateSession,
} from "../../features/ondo/identity-b/action-gate-contract-b"
import { createReviewFixtureAuthority, reviewFixture } from "../../features/ondo/contracts/execution-mode"
import {
  createLabsBridgeQuote,
  isLabsBridgeQuote,
  readLabsBadgeReview,
  readLabsBridgeReview,
  readLabsWalletReview,
} from "../../features/ondo/labs/labs-review-truth-b"

const REVIEW_OPTIONS = { allowReviewFixture: true } as const
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

class FaultStorage {
  private values = new Map<string, string>()
  private writeIndex = 0
  private faults = new Map<number, "ignore" | "throw">()

  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) {
    this.writeIndex += 1
    const fault = this.faults.get(this.writeIndex)
    if (fault === "throw") throw new Error("atomic storage failure")
    if (fault === "ignore") return
    this.values.set(key, value)
  }
  removeItem(key: string) { this.values.delete(key) }
  armFaults(entries: ReadonlyArray<readonly [number, "ignore" | "throw"]>) {
    this.writeIndex = 0
    this.faults = new Map(entries)
  }
}

function reviewAxis(gate: "person" | "payment_kyc", now: Date) {
  const authority = createReviewFixtureAuthority({
    qaRuntimeEnabled: true,
    explicitlyRequested: true,
    fixtureId: gate === "person" ? "FX-PER-NON-AUTHOR" : "FX-PKY-NON-AUTHOR",
  })
  if (!authority) throw new Error("review authority unavailable")
  const execution = reviewFixture(authority, { outcome: "success", value: { axis: gate }, now })
  const axis = createBActionReviewAxis(gate, execution, now)
  if (!axis) throw new Error("review axis unavailable")
  return axis
}

function consumedBadge(storage: FaultStorage, now: Date) {
  const badge = createBBadgeActionReturn({ now })
  expect(persistBActionGateSession(storage as unknown as Storage, {
    version: 1,
    person: reviewAxis("person", now),
    payment: { status: "unverified", expiresAt: null },
    pending: badge,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }, now, REVIEW_OPTIONS)).toBe(true)
  const consumed = consumePendingBActionAtMutation(storage as unknown as Storage, badge, new Set(["person"]), now, REVIEW_OPTIONS)
  expect(consumed).not.toBeNull()
  return { badge, consumed: consumed! }
}

function consumedCheckout(storage: FaultStorage, now: Date) {
  const checkout = createBCheckoutActionReturn({ venueId: VENUE_ID, now })
  expect(persistBActionGateSession(storage as unknown as Storage, {
    version: 1,
    person: { status: "unverified", expiresAt: null },
    payment: reviewAxis("payment_kyc", now),
    pending: checkout,
    personRoute: null,
    presentation: null,
    lastConsumed: null,
    outcome: null,
  }, now, REVIEW_OPTIONS)).toBe(true)
  const consumed = consumePendingBActionAtMutation(storage as unknown as Storage, checkout, new Set(["account", "payment_kyc"]), now, REVIEW_OPTIONS)
  expect(consumed).not.toBeNull()
  return { checkout, consumed: consumed! }
}

test.afterEach(() => clearBActionGateSession({ getItem() { return null }, removeItem() {} } as unknown as Storage))

test("non-author: ignored badge terminal write cannot publish success or replay", () => {
  const now = new Date("2026-09-04T09:00:00.000Z")
  const retryableStorage = new FaultStorage()
  const retryable = consumedBadge(retryableStorage, now)
  retryableStorage.armFaults([[1, "ignore"]])
  let successMutations = 0
  if (finalizeConsumedBAction(retryableStorage as unknown as Storage, retryable.consumed, now, REVIEW_OPTIONS)) successMutations += 1
  expect(successMutations).toBe(0)
  expect(restoreBActionGateSession(retryableStorage as unknown as Storage, now, REVIEW_OPTIONS)).toMatchObject({
    pending: { tokenId: retryable.badge.tokenId, consumedAt: null },
    lastConsumed: null,
  })

  const quarantinedStorage = new FaultStorage()
  const quarantined = consumedBadge(quarantinedStorage, new Date(now.getTime() + 1))
  quarantinedStorage.armFaults([[1, "ignore"], [2, "ignore"], [3, "ignore"]])
  if (finalizeConsumedBAction(quarantinedStorage as unknown as Storage, quarantined.consumed, now, REVIEW_OPTIONS)) successMutations += 1
  if (finalizeConsumedBAction(quarantinedStorage as unknown as Storage, quarantined.consumed, now, REVIEW_OPTIONS)) successMutations += 1
  expect(successMutations).toBe(0)
})

test("non-author: rejected product commit plus ignored pending restore cannot invoke the same consume twice", () => {
  const now = new Date("2026-09-04T09:10:00.000Z")
  const storage = new FaultStorage()
  const prepared = consumedCheckout(storage, now)
  // terminal write succeeds, then the exact pending recovery is ignored.
  storage.armFaults([[2, "ignore"]])
  let firstCalls = 0
  expect(finalizeConsumedBActionWithMutation(
    storage as unknown as Storage,
    prepared.consumed,
    () => { firstCalls += 1; return false },
    now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(firstCalls).toBe(1)
  expect(restoreBActionGateSession(storage as unknown as Storage, now, REVIEW_OPTIONS)).toMatchObject({ pending: null, lastConsumed: null })

  let replayCalls = 0
  expect(finalizeConsumedBActionWithMutation(
    storage as unknown as Storage,
    prepared.consumed,
    () => { replayCalls += 1; return true },
    now,
    REVIEW_OPTIONS,
  )).toBe(false)
  expect(replayCalls).toBe(0)
})

test("non-author: Labs review truth rejects and strips no extra execution, value, or quote fields", () => {
  const common = {
    mode: "review",
    executionTruth: "FIXTURE_REVIEW",
    provenanceTruth: "SIMULATED",
    result: "FIXTURE_SUCCESS",
    externalProviderConnected: false,
    externalEffect: "none",
    recordedAt: new Date().toISOString(),
  } as const
  const wallet = { ...common, fixtureId: "FX-LABS-WALLET-SUCCESS", value: { address: "0x8a71…4d2c" } }
  expect(readLabsWalletReview(wallet)).not.toBeNull()
  expect(readLabsWalletReview({ ...wallet, providerReceipt: "private" })).toBeNull()
  expect(readLabsWalletReview({ ...wallet, value: { ...wallet.value, holder: "private" } })).toBeNull()

  const quote = createLabsBridgeQuote(Date.now() + 60_000)
  const bridge = { ...common, fixtureId: "FX-LABS-BRIDGE-SUCCESS", value: { route: "sui-testnet-to-omnione", quote } }
  expect(readLabsBridgeReview(bridge)).not.toBeNull()
  expect(readLabsBridgeReview({ ...bridge, value: { ...bridge.value, providerReceipt: "private" } })).toBeNull()
  expect(isLabsBridgeQuote({ ...quote, providerRoute: "private" })).toBe(false)

  const badge = { ...common, fixtureId: "FX-BADGE-SUCCESS", value: { badge: "travel-keepsake" } }
  expect(readLabsBadgeReview(badge)).not.toBeNull()
  expect(readLabsBadgeReview({ ...badge, value: { ...badge.value, holder: "private" } })).toBeNull()
})
