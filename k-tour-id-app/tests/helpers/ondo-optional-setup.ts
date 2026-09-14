import { expect, type Page } from "@playwright/test"

/** Enter the optional wizard through its public Settings action, never a seed. */
export async function openOptionalMapSetup(page: Page) {
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
  await page.getByTestId("nav-settings").click()
  await page.getByTestId("ondo-b-discovery-settings").click()
  await page.getByTestId("ondo-b-onboarding-reset").click()
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveAttribute("data-onboarding-step", "intent")
  await expect(page.getByTestId("onboarding-step-intent")).toBeVisible()
  await expectNoSetupPlacePreview(page)
}

export async function expectNoSetupPlacePreview(page: Page) {
  await expect(page.getByTestId("onboarding-map-preview")).toHaveCount(0)
  await expect(page.getByTestId("onboarding-map-preview-capsule")).toHaveCount(0)
  await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
  await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)
}
