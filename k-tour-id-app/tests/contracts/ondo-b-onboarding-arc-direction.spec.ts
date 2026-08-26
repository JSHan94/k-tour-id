import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8")

const onboarding = source("features/ondo/onboarding/official-directory-onboarding.tsx")
const styles = source("features/ondo/onboarding/official-directory-onboarding.module.css")

test("B-ONBOARDING-ARC-001 the three-step guest journey declares one Arc narrative system", () => {
  expect(onboarding).toContain('data-visual-direction="arc-narrative"')
  expect(onboarding).toContain("data-onboarding-step={step}")
  expect(onboarding).toContain('data-stage="value"')
  expect(onboarding).toContain('data-stage="intent"')
  expect(onboarding).toContain('data-stage="preferences"')

  for (const token of [
    "--arc-ink",
    "--arc-paper",
    "--arc-coral",
    "--arc-plum",
    "--arc-apricot",
    "--arc-motion-enter",
  ]) expect(styles).toContain(token)

  expect(styles).toContain("onboardingStageIn")
  expect(styles).toContain("prefers-reduced-motion: reduce")
})

test("B-ONBOARDING-ARC-002 source truth and guest actions remain subordinate but reachable", () => {
  expect(onboarding).toContain('data-testid="onboarding-source-boundary"')
  expect(onboarding).toContain('className={styles.primary}')
  expect(onboarding).toContain('className={styles.secondary}')
  expect(onboarding).toContain('data-testid="onboarding-finish"')
  expect(onboarding).toContain("actions.completeOnboarding(preferences)")
  expect(onboarding).toContain("actions.skipOnboarding()")
  expect(onboarding).not.toContain("actions.setDiscoveryPreferences(preferences)")
})
