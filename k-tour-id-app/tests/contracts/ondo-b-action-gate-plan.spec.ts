import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  B_ACTION_AXIS_TTL_MS,
  B_ACTION_GATE_SESSION_KEY,
  B_ACTION_GATE_TTL_MS,
  consumePendingBActionAtMutation,
  consumeBActionReturnTo,
  createBCheckoutActionReturn,
  createBLocalSignalActionReturn,
  createBTableActionReturn,
  gatePlanForBAction,
  isBActionReturnPending,
  isBActionReturnStructurallyValid,
  restoreBActionGateSession,
  restoreConsumedBActionAfterMutationFailure,
  updateBActionAxisSession,
} from "../../features/ondo/identity-b/action-gate-contract-b"

const NOW = new Date("2026-08-28T03:00:00.000Z")
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

class MemoryStorage {
  constructor(private readonly values: Record<string, string> = {}) {}
  getItem(key: string) { return this.values[key] ?? null }
  setItem(key: string, value: string) { this.values[key] = value }
  removeItem(key: string) { delete this.values[key] }
  raw(key: string) { return this.values[key] ?? null }
}

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("B-ACTION-GATE-001 each product action carries its complete canonical gate plan and exact 15-minute return", () => {
  expect(gatePlanForBAction("JOIN_TABLE")).toEqual(["account", "age"])
  expect(gatePlanForBAction("SUBMIT_LOCAL_SIGNAL")).toEqual(["account", "person"])
  expect(gatePlanForBAction("START_CHECKOUT")).toEqual(["account", "payment_kyc"])

  const table = createBTableActionReturn({ tableId: "table-seoul-night-bites", venueId: VENUE_ID, draft: "Window seat", now: NOW })
  const signal = createBLocalSignalActionReturn({ venueId: VENUE_ID, draftNonce: "draft:1", tags: ["calm_now", "calm_now", "welcoming"], note: "  still calm  ", now: NOW })
  const checkout = createBCheckoutActionReturn({ venueId: VENUE_ID, now: NOW })

  expect(B_ACTION_GATE_TTL_MS).toBe(15 * 60 * 1000)
  expect(table.tokenId).toBe(`RT-JOIN_TABLE-${NOW.getTime()}`)
  expect(signal.tokenId).toBe(`RT-SUBMIT_LOCAL_SIGNAL-${NOW.getTime()}`)
  expect(checkout.tokenId).toBe(`RT-START_CHECKOUT-${NOW.getTime()}`)
  expect(signal.tags).toEqual(["calm_now", "welcoming"])
  for (const envelope of [table, signal, checkout]) {
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
  expect(atomic?.consumedAt).toBe(NOW.toISOString())
  expect(restoreBActionGateSession(storage as unknown as Storage, NOW)).toMatchObject({ pending: null, lastConsumed: { tokenId: envelope.tokenId } })
  expect(consumePendingBActionAtMutation(storage as unknown as Storage, envelope, new Set(["account", "payment_kyc"]), NOW)).toBeNull()
  expect(restoreConsumedBActionAfterMutationFailure(storage as unknown as Storage, atomic!, NOW)).toBe(true)
  expect(restoreBActionGateSession(storage as unknown as Storage, NOW)).toMatchObject({ pending: { tokenId: envelope.tokenId, consumedAt: null }, lastConsumed: null })
  expect(consumePendingBActionAtMutation(storage as unknown as Storage, envelope, new Set(["account", "payment_kyc"]), NOW)?.consumedAt).toBe(NOW.toISOString())
  const unrelated = createBCheckoutActionReturn({ venueId: VENUE_ID, now: new Date(NOW.getTime() + 1) })
  expect(restoreConsumedBActionAfterMutationFailure(storage as unknown as Storage, { ...unrelated, consumedAt: NOW.toISOString() }, NOW)).toBe(false)

  expect(isBActionReturnStructurallyValid({ ...envelope, gatePlan: ["payment_kyc"] })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, tableId: "table-injected" })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, tokenId: `RT-START_CHECKOUT-${NOW.getTime() + 1}` })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, consumedAt: "not-a-date" })).toBe(false)
  expect(isBActionReturnStructurallyValid({ ...envelope, venueId: "editorial-jeju-candidate" })).toBe(false)
})

test("B-ACTION-GATE-003 current session wins; legacy verified axes migrate once with bounded TTL and no legacy mutation", () => {
  const legacyRaw = JSON.stringify({ account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", profile: { displayName: "kept" } })
  const legacyOnly = new MemoryStorage({ "ondo.session.v3": legacyRaw })
  const migrated = restoreBActionGateSession(legacyOnly as unknown as Storage, NOW)
  expect(migrated.person).toEqual({ status: "eligible", expiresAt: new Date(NOW.getTime() + B_ACTION_AXIS_TTL_MS).toISOString() })
  expect(migrated.payment).toEqual({ status: "eligible", expiresAt: new Date(NOW.getTime() + B_ACTION_AXIS_TTL_MS).toISOString() })
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
})

test("B-ACTION-GATE-004 B-native consumers, reset, localization and provider boundaries stay explicit", () => {
  const coordinator = source("features/ondo/identity-b/action-gate-coordinator-b.tsx")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const table = source("features/ondo/connect/tables-entry-b.tsx")
  const signal = source("features/ondo/local-signal-b/local-signal-layer-b.tsx")
  const checkout = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")

  for (const locale of ["en", "ko", "ja"]) expect(coordinator).toContain(`${locale}: {`)
  expect(coordinator).toContain("actions.activateAccount()")
  expect(coordinator).toContain("recordGlobalAfter19AgeEligibilityB")
  expect(coordinator).not.toMatch(/OndoProvider|GateOverlay|fetch\(|XMLHttpRequest|WebSocket/)
  expect(table).toContain("createBTableActionReturn")
  expect(table).toContain("consumePendingBActionAtMutation")
  expect(signal).toContain("createBLocalSignalActionReturn")
  expect(signal).toContain("consumePendingBActionAtMutation")
  expect(checkout).toContain("createBCheckoutActionReturn")
  expect(checkout).toContain("consumePendingBActionAtMutation")
  expect(provider).toContain("previousActionGateSession")
  expect(provider).toContain("window.sessionStorage.setItem(B_ACTION_GATE_SESSION_KEY, JSON.stringify(DEFAULT_B_ACTION_GATE_SESSION))")
  expect(updateBActionAxisSession(new MemoryStorage() as unknown as Storage, "person", "eligible", NOW)?.person.status).toBe("eligible")
})
