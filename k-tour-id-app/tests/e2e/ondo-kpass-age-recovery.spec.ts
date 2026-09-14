import { expect, test, type Page } from "@playwright/test"
import { clickTravelPassAction, openTravelPassReadiness } from "../helpers/ondo-demo-journey"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

async function enterPass(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("onboarding-guest-skip").click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("kpass-service-card")).toBeVisible()
  await openTravelPassReadiness(page)
}

async function sample(page: Page, scenario: string) {
  await page.getByTestId("kpass-sample-picker").click()
  await page.getByTestId(`kpass-scenario-${scenario}`).click()
}

test("missing age proof has a consented recovery and does not grant Person or payment readiness", async ({ page }) => {
  await enterPass(page)
  await sample(page, "age_unknown")
  await expect(page.getByTestId("kpass-service-age")).toHaveAttribute("data-status", "needs_proof")
  await clickTravelPassAction(page, "traveler-id-age-check")
  await expect(page.getByTestId("ondo-b-local-check-walkthrough")).toHaveAttribute("data-check-kind", "age")
  await page.getByTestId("local-check-boundary-continue").click()
  await expect(page.getByTestId("ondo-b-local-check-walkthrough")).toHaveCount(0)
  await expect(page.getByTestId("kpass-service-age")).toHaveAttribute("data-status", "allowed")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-status", "success")
  await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("kpass-service-payment")).toHaveAttribute("data-status", "needs_proof")
})

test("a negative issuer age answer cannot enter the missing-proof recovery", async ({ page }) => {
  await enterPass(page)
  await sample(page, "under_age")
  await clickTravelPassAction(page, "traveler-id-age-check")
  await expect(page.getByTestId("ondo-b-local-check-walkthrough")).toHaveCount(0)
  await expect(page.getByTestId("kpass-service-age")).toHaveAttribute("data-status", "denied")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-status", "none")
})

test("revoked and held passes agree across readiness and the credential detail", async ({ page }) => {
  await enterPass(page)
  for (const scenario of ["revoked", "suspended"] as const) {
    await sample(page, scenario)
    await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", scenario)
    await clickTravelPassAction(page, "traveler-id-ktour-id-open")
    await expect(page.getByTestId("k-tour-id-credential")).toHaveAttribute("data-status", scenario)
    await expect(page.getByTestId("k-tour-id-credential")).toHaveAttribute("data-code", `CREDENTIAL_${scenario.toUpperCase()}`)
    await expect(page.getByTestId("k-tour-id-credential").getByRole("heading")).toContainText(scenario)
    await expect(page.getByTestId("k-tour-id-credential")).not.toContainText("expired")
    await page.getByTestId("k-tour-id-return").click()
    await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
  }
})
