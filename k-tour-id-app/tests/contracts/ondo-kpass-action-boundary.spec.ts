import { expect, test } from "@playwright/test"
import { createKPassPresentationBinding, type KPassDemoCredential } from "../../features/ondo/contracts/kpass-capabilities"
import { createPresentationRequestB, createSimulatedCredentialB, resolvePresentationRequestB } from "../../features/ondo/identity-b/ktour-id-setup-model-b"
import { authorizeBActionPresentationDecision, consumePendingBActionAtMutation, createBCheckoutActionReturn, createBTableActionReturn, DEFAULT_B_ACTION_GATE_SESSION, hasBActionPresentationApproval, persistBActionGateSession, recordBActionPresentationApproval, registerBActionPresentationRequest } from "../../features/ondo/identity-b/action-gate-contract-b"
import { createStableCommerceBLockedQuoteFromMode, STABLE_B_OFFER_VENUE_ID } from "../../features/ondo/commerce-b/stable-commerce-model-b"
import { ONDO_B_TABLE_POLICIES } from "../../features/ondo/connect/table-policy-b"
import { actionReturnFromBEvent, privateContextForBAction } from "../../features/ondo/identity-b/action-gate-contract-b"

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}
const NOW = Date.parse("2026-09-08T04:00:00Z")
const OPT = { allowReviewFixture: true }
let serial = 0

function checkout(benefit: "standard" | "ktour" = "ktour") {
  const now = NOW + ++serial * 1_000
  const storage = new MemoryStorage()
  const quote = createStableCommerceBLockedQuoteFromMode(benefit, new Date(now + 15 * 60_000))
  const pending = createBCheckoutActionReturn({ venueId: STABLE_B_OFFER_VENUE_ID, quote, now: new Date(now) })
  const credential = createSimulatedCredentialB("passport_ekyc", now)
  expect(persistBActionGateSession(storage, { ...DEFAULT_B_ACTION_GATE_SESSION, pending }, new Date(now), OPT)).toBe(true)
  return { now, storage, pending, credential }
}

function approvedBenefit() {
  const prepared = checkout()
  const { credential, pending, now, storage } = prepared
  const binding = createKPassPresentationBinding(credential.credentialId, "visitor_benefit", { audience: STABLE_B_OFFER_VENUE_ID, domain: "https://ondo.demo" })
  const request = createPresentationRequestB(now, `request:${pending.tokenId}`, binding)
  expect(registerBActionPresentationRequest(pending, request)).toBe(true)
  const resolution = resolvePresentationRequestB(request, "approve", now + 1, binding)
  const authority = authorizeBActionPresentationDecision(pending, resolution)
  expect(authority).not.toBeNull()
  const session = recordBActionPresentationApproval(storage, pending, authority!, new Date(now + 1), OPT)!
  expect(session).not.toBeNull()
  return { ...prepared, session }
}

test("bound benefit approval requires the same current credential at final consumption", () => {
  const { storage, pending, credential, now, session } = approvedBenefit()
  const consume = (live?: KPassDemoCredential | null) => consumePendingBActionAtMutation(storage, pending, new Set(["account", "payment_kyc"]), new Date(now + 2), { ...OPT, credential: live })
  expect(consume()).toBeNull()
  expect(consume({ ...credential, credentialId: `${credential.credentialId}:different` })).toBeNull()
  expect(consume({ ...credential, status: "revoked" })).toBeNull()
  expect(consume({ ...credential, status: "suspended" })).toBeNull()
  expect(consume({ ...credential, expiresAt: now + 2 })).toBeNull()
  expect(consume({ ...credential, claims: { ...credential.claims, visitorBenefit: { ...credential.claims.visitorBenefit, status: "used" } } })).toBeNull()
  expect(hasBActionPresentationApproval(session, pending, credential, now + 2)).toBe(true)
  expect(consume(credential)).not.toBeNull()
  expect(consume(credential)).toBeNull()
})

test("an unrelated relying party or requested purpose cannot be bound to a checkout", () => {
  const { pending, credential, now } = checkout()
  const wrongParty = createKPassPresentationBinding(credential.credentialId, "visitor_benefit", { audience: "different-venue" })
  expect(registerBActionPresentationRequest(pending, createPresentationRequestB(now, "wrong-party", wrongParty))).toBe(false)
  const wrongPurpose = createKPassPresentationBinding(credential.credentialId, "age", { audience: STABLE_B_OFFER_VENUE_ID })
  expect(registerBActionPresentationRequest(pending, createPresentationRequestB(now, "wrong-purpose", wrongPurpose))).toBe(false)
})

test("declining a benefit preserves its exact private quote without relaxing strict envelopes", () => {
  const { pending } = checkout()
  const decorated = { ...pending, gateOutcome: "denied" }
  expect(privateContextForBAction(decorated)).toBeNull()
  const returned = actionReturnFromBEvent(decorated)!
  expect(returned).toEqual(pending)
  expect(privateContextForBAction(returned)).toMatchObject({ cta: "START_CHECKOUT", quote: { benefitMode: "ktour" } })
  expect(actionReturnFromBEvent({ ...decorated, grant: true })).toBeNull()
  expect(actionReturnFromBEvent({ ...decorated, gateOutcome: "success" })).toBeNull()
  const forgedVenue = actionReturnFromBEvent({ ...decorated, venueId: "wrong-place" })
  expect(forgedVenue).toBeNull()
})

test("payment allowance is checked independently from both balance and age", () => {
  const { pending, storage, now } = checkout("standard")
  const spent = createSimulatedCredentialB("passport_ekyc", now, "limit_reached")
  expect(consumePendingBActionAtMutation(storage, pending, new Set(["account", "payment_kyc"]), new Date(now), { ...OPT, credential: spent })).toBeNull()
  const ageNotEligible = createSimulatedCredentialB("passport_ekyc", now, "under_age")
  expect(consumePendingBActionAtMutation(storage, pending, new Set(["account", "payment_kyc"]), new Date(now), { ...OPT, credential: ageNotEligible })).not.toBeNull()
})

test("a previous age receipt cannot authorize a Table under a negative or missing current predicate", () => {
  const table = ONDO_B_TABLE_POLICIES.find(item => item.alcohol)!
  const now = NOW + ++serial * 1_000
  const storage = new MemoryStorage()
  const pending = createBTableActionReturn({ tableId: table.id, venueId: table.venueId, draft: "unchanged meal plan", now: new Date(now) })
  expect(persistBActionGateSession(storage, { ...DEFAULT_B_ACTION_GATE_SESSION, pending }, new Date(now), OPT)).toBe(true)
  const satisfied = new Set(["account", "age"] as const)
  for (const scenario of ["under_age", "age_unknown", "revoked"] as const) expect(consumePendingBActionAtMutation(storage, pending, satisfied, new Date(now), { ...OPT, credential: createSimulatedCredentialB("passport_ekyc", now, scenario) })).toBeNull()
  expect(consumePendingBActionAtMutation(storage, pending, satisfied, new Date(now), { ...OPT, credential: createSimulatedCredentialB("passport_ekyc", now) })).not.toBeNull()
})
