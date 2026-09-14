import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

test("W1-MAP-FIRST-001 the first decision opens the Korea map before optional personalization", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const mapAction = onboarding.indexOf('data-testid="onboarding-guest-skip"')
  expect(mapAction).toBeGreaterThan(0)
  expect(onboarding).toContain('state.onboarding === "ONB-IN-PROGRESS" ? true : null')
  expect(onboarding).not.toContain('state.onboarding !== "ONB-COMPLETE" ? true : null')
  expect(onboarding).toContain("<SheetB")
  expect(onboarding).toContain('data-testid="onboarding-step-intent"')
  expect(onboarding).toContain('data-testid="onboarding-step-area"')
  expect(onboarding).toContain('data-testid="onboarding-step-preferences"')
  expect(onboarding).toContain("Check dietary needs with each place.")
})

test("W1-PERSONALIZATION-002 the map consumes saved choices as presentation context only", () => {
  const map = source("features/ondo/map/map-entry-b.tsx")

  expect(map).toContain("function PersonalizationLens")
  expect(map).toContain('data-testid="ondo-b-personalization-summary"')
  expect(map).toContain('data-testid="ondo-b-personalization-edit"')
  expect(map).toContain('data-discovery-preferences={state.discoveryPreferences.join(",") || "none"}')
  expect(map).toContain("if (document.activeElement instanceof HTMLElement) document.activeElement.blur()")
  expect(map).toContain('actions.setTab("settings")')

  const venueFilter = map.slice(map.indexOf("const venues = useMemo"), map.indexOf("const activePersonalization"))
  expect(venueFilter).not.toContain("discoveryPreferences")
  expect(venueFilter).not.toContain("persona")
  expect(map).toContain("personalizedCanonicalVenueRows(")
  expect(map).toContain("personalizedVenues")

  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  expect(onboarding).not.toContain("orderBCanonicalDiscoveryPlaces")
  expect(onboarding).toContain('personalization: { intent: intent ?? "short_trip", preferences: nextPreferences }')
  expect(onboarding).not.toContain("<CanonicalVenueCapsuleB")
  expect(onboarding).not.toContain('data-testid="onboarding-map-preview"')
  expect(onboarding).not.toContain("data-match-keyline={preferences.length}")
})

test("W1-TRUTH-003 personalization does not touch temperature, identity, wallet or After 19 actions", () => {
  const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
  const provider = source("features/ondo/shared/state/ondo-b-provider.tsx")

  expect(onboarding).not.toMatch(/setCommerce|dispatchCommerce|completeIdentity|After19|pulseForVenue|temperature/i)
  expect(provider).toContain("completeOnboarding: (draft) =>")
  expect(provider).toContain('surface: { kind: "map" }')
  const completionBlock = provider.slice(provider.indexOf("completeOnboarding: (draft) =>"), provider.indexOf("skipOnboarding: () =>"))
  expect(completionBlock).not.toMatch(/identityCredential|commerceWalletStatus|commerceSession|After19|after19/i)
})
