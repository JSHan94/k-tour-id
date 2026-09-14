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
const settingsStyles = source("features/ondo/settings/settings-entry-b.module.css")
const personalStyles = source("features/ondo/shared/ui/production-local.module.css")
const traveler = source("features/ondo/identity-b/traveler-id-entry-b.tsx")
const travelerStyles = source("features/ondo/identity-b/traveler-id-entry-b.module.css")
const commerce = source("features/ondo/commerce-b/id-wallet-commerce-b.tsx")
const commerceStyles = source("features/ondo/commerce-b/id-wallet-commerce-b.module.css")

test("ATLAS-001 optional setup offers direct three-language choice without an unsolicited place", () => {
  expect(onboarding).toContain('(["en", "ko", "ja"] as const).map((locale)')
  expect(onboarding).toContain("aria-pressed={state.locale === locale}")
  expect(onboarding).toContain("actions.setLocale(locale)")
  expect(onboarding).not.toContain("<CanonicalVenueCapsuleB")
  expect(onboarding).not.toContain('data-testid="onboarding-map-preview"')
  expect(onboardingStyles).toContain(".locales")
})

test("ATLAS-002 My Korea starts with its map and uses one shared visual-memory system", () => {
  expect(myKorea).toContain('data-visual-direction="warm-living-atlas"')
  expect(myKorea.indexOf("<KoreaMemoryMapB")).toBeGreaterThan(0)
  expect(myKorea.indexOf('data-testid="my-korea-planned"')).toBeGreaterThan(0)
  expect(myKorea).toContain('<div className={styles.memoryStage}>')
  expect(myKorea).toContain('!isEmptyJourney ? <div className={styles.activitySections}>')
  expect(myKorea).toContain("<MyKoreaMemoryVenueCardB")
  expect(myKorea).toContain('data-testid="my-korea-empty-explore"')
  expect(personalStyles).toContain(".memoryStage")
})

test("ATLAS-003 Settings uses a shared-sheet native three-language control without inline layout", () => {
  expect(settings).toContain('data-visual-direction="quiet-mobile-settings"')
  expect(settings).toContain('data-testid="settings-language-row"')
  expect(settings).toContain('data-testid="settings-language-control"')
  expect(settings).toContain('sheetPresence.value === "language" ? <SheetB')
  expect(settings).not.toContain('style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}')
  expect(settingsStyles).toContain(".languageList")
})

test("ATLAS-004 Travel Pass and Wallet expose one honest warm wallet material system", () => {
  expect(traveler).toContain('data-visual-direction="apple-wallet-flow8"')
  expect(commerce).toContain('data-visual-direction="apple-wallet-flow8"')
  expect(commerce).toContain('data-flow8-object="wallet"')
  expect(commerce).toContain('data-flow8-object="offer"')
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
    "OOKRW",
  ]) expect(combined, `missing ${contract}`).toContain(contract)

  for (const forbidden of ["real credential", "real stablecoin", "on-chain payment"]) {
    expect(combined.toLowerCase()).not.toContain(forbidden)
  }
})
