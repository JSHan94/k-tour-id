import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { isCanonicalVenueId } from "../../lib/ondo/venues/canonical-allowlist"
import {
  STABLE_B_OFFER_ID,
  STABLE_B_OFFER_VENUE_ID,
} from "../../features/ondo/commerce-b/stable-commerce-model-b"
import {
  clearBActionGateSession,
  createBCheckoutActionReturn,
  isBActionReturnStructurallyValid,
  privateContextForBAction,
} from "../../features/ondo/identity-b/action-gate-contract-b"
import { supportedCommercePlacesB, resolveCommercePlaceB } from "../../features/ondo/commerce-b/place-service-registry-b"

const NON_OFFER_CANONICAL_VENUE_ID = "mois-18939eecb43c15ab4305"
const NOW = new Date("2026-08-28T03:00:00.000Z")
const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")
test.afterEach(() => { clearBActionGateSession({ getItem() { return null }, removeItem() {} } as unknown as Storage) })

test("registered sample offers stay bound to their own place; directory membership alone grants no checkout", () => {
  expect(STABLE_B_OFFER_ID).toBe("meal-offer-gukbap")
  expect(STABLE_B_OFFER_VENUE_ID).toBe("mois-0021cd596bc5b2a922ad")
  expect(isCanonicalVenueId(NON_OFFER_CANONICAL_VENUE_ID)).toBe(true)

  const allowed = createBCheckoutActionReturn({ venueId: STABLE_B_OFFER_VENUE_ID, now: NOW })
  expect(allowed).toMatchObject({ cta: "START_CHECKOUT", venueId: STABLE_B_OFFER_VENUE_ID })
  expect(allowed).not.toHaveProperty("offerId")
  expect(privateContextForBAction(allowed)).toMatchObject({ quote: { offerId: STABLE_B_OFFER_ID } })
  expect(() => createBCheckoutActionReturn({ venueId: NON_OFFER_CANONICAL_VENUE_ID, now: NOW })).toThrow()
  expect(isBActionReturnStructurallyValid({ ...allowed, venueId: NON_OFFER_CANONICAL_VENUE_ID })).toBe(false)

  const place = source("features/ondo/place/canonical-place-overlay.tsx")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")
  const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
  const actions = source("features/ondo/place/place-service-actions-b.tsx")
  expect(place).toContain('<PlaceServiceActionsB placeId={currentVenueId}')
  expect(actions).toContain("resolveCommercePlaceB(placeId)")
  expect(actions).toContain("if (!sampleMode || !place || (!place.commerce && !place.reservation)) return null")
  expect(provider).toContain("const place = resolveCommercePlaceB(venueId)")
  expect(provider).toContain("if (!place?.commerce) return false")
  // Historical receipt parsing remains strict; dynamic orders are validated
  // separately against the explicit offer registry and their unique IDs.
  expect(provider).toContain("receipt.venueId !== STABLE_B_OFFER_VENUE_ID")
  expect(provider).toContain("receipt.offerId !== place.commerce.offerId")
  expect(commerce).toContain("resolveCommercePlaceB(state.commerceOrigin.venueId)?.commerce")
  expect(commerce).toContain("venueEligible: order.venueId === venueId")
  expect(resolveCommercePlaceB(NON_OFFER_CANONICAL_VENUE_ID)).toBeNull()

  const registered = supportedCommercePlacesB()
  for (const [index, entry] of registered.entries()) {
    expect(entry.commerce?.sampleOnly).toBe(true)
    const request = createBCheckoutActionReturn({ venueId: entry.id, now: new Date(NOW.getTime() + index + 1) })
    expect(privateContextForBAction(request)?.cta).toBe("START_CHECKOUT")
    expect(privateContextForBAction(request)).toMatchObject({ quote: { offerId: entry.commerce!.offerId } })
    if (entry.id !== STABLE_B_OFFER_VENUE_ID) {
      const legacy = privateContextForBAction(allowed)
      expect(legacy?.cta).toBe("START_CHECKOUT")
      if (legacy?.cta !== "START_CHECKOUT") throw new Error("Missing legacy context")
      expect(() => createBCheckoutActionReturn({ venueId: entry.id, quote: legacy.quote, now: new Date(NOW.getTime() + 1000 + index) })).toThrow("Invalid checkout quote")
      expect(privateContextForBAction({ ...allowed, venueId: entry.id })).toBeNull()
    }
  }
})
