import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
const styles = source("features/ondo/onboarding/official-directory-onboarding.module.css")

test("B-ONBOARDING-ARC-001 the three-stage guest journey stays inside one shared map sheet", () => {
  expect(onboarding).toContain('type Step = "intent" | "area" | "preferences"')
  expect(onboarding).toContain("<SheetB")
  expect(onboarding).toContain('variant="decision"')
  expect(styles).toContain("background:rgb(16 16 16 / 20%)")
  expect(styles).toContain("prefers-reduced-motion:reduce")
})

test("B-ONBOARDING-ARC-002 truth and guest actions remain subordinate but reachable", () => {
  expect(onboarding).not.toContain('data-testid="onboarding-map-preview"')
  expect(onboarding).not.toContain("<CanonicalVenueCapsuleB")
  expect(onboarding).toContain("Check dietary needs with each place.")
  expect(onboarding).toContain('className={styles.primary}')
  expect(onboarding).toContain('className={styles.secondary}')
  expect(onboarding).toContain('"onboarding-finish"')
  expect(onboarding).toContain("actions.completeOnboarding({ intent, area, preferences })")
  expect(onboarding).toContain("actions.cancelOnboarding()")
  expect(onboarding).not.toContain("actions.setDiscoveryPreferences(preferences)")
})
