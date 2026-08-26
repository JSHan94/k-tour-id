import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test } from "@playwright/test"

const APP_ROOT = process.cwd()

function source(path: string) {
  return readFileSync(resolve(APP_ROOT, path), "utf8")
}

const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
const onboardingStyles = source("features/ondo/onboarding/official-directory-onboarding.module.css")
const myKorea = source("features/ondo/my/saved-entry-b.tsx")
const settings = source("features/ondo/settings/settings-entry-b.tsx")
const personalStyles = source("features/ondo/shared/ui/production-local.module.css")
const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
const travelerStyles = source("features/ondo/identity-b/traveler-id-entry-b.module.css")
const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
const commerceStyles = source("features/ondo/commerce-b/id-wallet-commerce-b.module.css")

test("ATLAS-001 onboarding offers direct three-language choice and folds source truth", () => {
  expect(onboarding).toContain('data-testid="onboarding-language-control"')
  for (const locale of ["en", "ko", "ja"]) {
    expect(onboarding, `missing direct ${locale} locale choice`).toContain(`data-locale-choice="${locale}"`)
  }
  expect(onboarding).toContain('data-testid="onboarding-source-boundary"')
  expect(onboarding).toMatch(/<details[^>]+className=\{styles\.sourceIntro\}/)
  expect(onboardingStyles).toContain("--atlas-coral")
})

test("ATLAS-002 My Korea starts with the travel plan and carries the Living Atlas direction", () => {
  expect(myKorea).toContain('data-visual-direction="warm-living-atlas"')
  expect(myKorea.indexOf('data-testid="my-korea-planned"')).toBeGreaterThan(0)
  expect(myKorea.indexOf('data-testid="my-korea-planned"')).toBeLessThan(myKorea.indexOf('data-testid="ondo-b-saved-entry"'))
  expect(personalStyles).toContain("--atlas-route")
})

test("ATLAS-003 Settings uses a direct native three-language control without inline layout", () => {
  expect(settings).toContain('data-visual-direction="warm-living-atlas"')
  expect(settings).toContain('data-testid="settings-language-control"')
  expect(settings).not.toContain('style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}')
  expect(personalStyles).toContain("--settings-group-material")
})

test("ATLAS-004 Travel Pass and Wallet expose one honest warm wallet material system", () => {
  expect(traveler).toContain('data-visual-direction="warm-living-wallet"')
  expect(commerce).toContain('data-visual-direction="warm-living-wallet"')
  expect(commerce).toContain('data-visual-direction="warm-living-offer"')
  expect(travelerStyles).toContain("--pass-ceramic")
  expect(commerceStyles).toContain("--wallet-ceramic")
})

test("ATLAS-005 visual redesign preserves consumer truth and every money boundary", () => {
  const combined = `${traveler}\n${commerce}`
  for (const contract of [
    "travel-pass-status",
    "wallet-balance",
    "wallet-benefit",
    "wallet-activity",
    "payment-confirm",
    "payment-receipt",
    "payment-refund",
    "OOKRW Test",
  ]) expect(combined, `missing ${contract}`).toContain(contract)

  for (const forbidden of ["real credential", "real stablecoin", "on-chain payment"]) {
    expect(combined.toLowerCase()).not.toContain(forbidden)
  }
})
