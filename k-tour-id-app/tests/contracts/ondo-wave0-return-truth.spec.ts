import { expect, test } from "@playwright/test"
import {
  asNormalExecution,
  createReviewFixtureAuthority,
  localActual,
  localActualValue,
  providerUnavailable,
  reviewFixture,
  type NormalExecution,
} from "../../features/ondo/contracts/execution-mode"
import {
  createDeterministicReturnToToken,
  hashReturnToSnapshot,
  serializeReturnToSnapshot,
} from "../../features/ondo/contracts/return-to-integrity"
import {
  B_ACTION_AXIS_TTL_MS,
  B_ACTION_GATE_SESSION_KEY,
  clearBActionGateSession,
  consumePendingBActionAtMutation,
  createBCheckoutActionReturn,
  hashBActionReturnTo,
  isBActionReturnPending,
  isBActionReturnStructurallyValid,
  privateContextForBAction,
} from "../../features/ondo/identity-b/action-gate-contract-b"

const NOW = new Date("2026-08-28T03:00:00.000Z")
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

class MemoryStorage {
  constructor(private readonly values: Record<string, string> = {}) {}
  getItem(key: string) { return this.values[key] ?? null }
  setItem(key: string, value: string) { this.values[key] = value }
}

test.afterEach(() => { clearBActionGateSession({ getItem() { return null }, removeItem() {} } as unknown as Storage) })

test("WAVE0-RETURN-001 canonical snapshot, hash, and token are deterministic", () => {
  const left = { z: [3, 2, 1], a: { y: true, x: "public" } } as const
  const right = { a: { x: "public", y: true }, z: [3, 2, 1] } as const

  expect(serializeReturnToSnapshot(left)).toBe(serializeReturnToSnapshot(right))
  expect(hashReturnToSnapshot(left)).toBe(hashReturnToSnapshot(right))
  expect(hashReturnToSnapshot(left)).toMatch(/^RT-HASH-[a-f0-9]{16}$/)
  expect(createDeterministicReturnToToken("START_CHECKOUT", NOW)).toBe(`RT-START_CHECKOUT-${NOW.getTime()}`)
})

test("WAVE0-TRUTH-002 normal unavailable, local actual, and explicit review fixtures cannot collapse into one success", () => {
  const unavailable: NormalExecution<never> = providerUnavailable("merchant_payment")
  const local: NormalExecution<{ saved: true }> = localActual("bookmark", { saved: true })
  expect(unavailable).toEqual({
    mode: "normal",
    executionTruth: "PROVIDER_UNAVAILABLE",
    provenanceTruth: "NOT_CONFIGURED",
    result: "PROVIDER_UNAVAILABLE",
    capability: "merchant_payment",
    externalEffect: "none",
  })
  expect(localActualValue(local)).toEqual({ saved: true })
  expect(createReviewFixtureAuthority({ qaRuntimeEnabled: false, explicitlyRequested: true, fixtureId: "FX-CHECKOUT-SUCCESS" })).toBeNull()
  expect(createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: false, fixtureId: "FX-CHECKOUT-SUCCESS" })).toBeNull()

  const authority = createReviewFixtureAuthority({ qaRuntimeEnabled: true, explicitlyRequested: true, fixtureId: "FX-CHECKOUT-SUCCESS" })!
  const fixture = reviewFixture(authority, { outcome: "success", value: { receipt: "review-only" }, now: NOW })
  expect(fixture).toMatchObject({
    mode: "review",
    executionTruth: "FIXTURE_REVIEW",
    provenanceTruth: "SIMULATED",
    result: "FIXTURE_SUCCESS",
    externalProviderConnected: false,
    externalEffect: "none",
  })
  expect(asNormalExecution(fixture)).toBeNull()
  expect(() => reviewFixture(JSON.parse(JSON.stringify(authority)), { outcome: "success", value: true })).toThrow("Explicit review authority required")
})

test("WAVE0-RETURN-003 B action restore rejects unknown/private fields, future envelopes, and same-token snapshot swaps", () => {
  const expected = createBCheckoutActionReturn({ venueId: VENUE_ID, now: NOW })
  const swapped = { ...expected, venueId: "mois-18939eecb43c15ab4305" }
  expect(hashBActionReturnTo(expected)).not.toBe(hashBActionReturnTo(swapped))
  expect(expected).not.toHaveProperty("offerId")
  expect(expected).not.toHaveProperty("benefitMode")
  expect(privateContextForBAction(expected)).toMatchObject({
    cta: "START_CHECKOUT",
    quote: { offerId: "meal-offer-gukbap", benefitMode: "standard" },
  })
  expect(isBActionReturnStructurallyValid({ ...expected, credential: "private" })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...expected, offerId: "meal-offer-gukbap" })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...expected, benefitMode: "ktour" })).toBe(false)
  const symbolInjected = { ...expected } as Record<PropertyKey, unknown>
  symbolInjected[Symbol("private")] = true
  expect(isBActionReturnStructurallyValid(symbolInjected)).toBe(false)
  expect(isBActionReturnPending(expected, new Date(NOW.getTime() - 1))).toBe(false)

  const storage = new MemoryStorage({
    [B_ACTION_GATE_SESSION_KEY]: JSON.stringify({
      version: 1,
      person: { status: "unverified", expiresAt: null },
      payment: { status: "eligible", expiresAt: new Date(NOW.getTime() + B_ACTION_AXIS_TTL_MS).toISOString() },
      pending: swapped,
      personRoute: null,
      presentation: null,
      lastConsumed: null,
      outcome: null,
    }),
  })
  expect(consumePendingBActionAtMutation(storage as unknown as Storage, expected, new Set(["account", "payment_kyc"]), NOW)).toBeNull()
})
