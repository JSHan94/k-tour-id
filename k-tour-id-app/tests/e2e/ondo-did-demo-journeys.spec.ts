import { expect, test, type Page } from "@playwright/test"
import { advanceIdentityJourney } from "../helpers/ondo-demo-journey"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

async function enterPass(page: Page, query = "") {
  await page.goto(`/${query}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
  await page.getByTestId("onboarding-guest-skip").click()
  await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("kpass-service-card")).toBeVisible()
}

async function chooseSample(page: Page, scenario: string) {
  await page.getByTestId("kpass-sample-picker").click()
  await page.getByTestId(`kpass-scenario-${scenario}`).click()
  await expect(page.getByTestId(`kpass-scenario-${scenario}`)).toHaveCount(0)
}

test("a shared link completes the CX sample without a QA query or fake payment readiness", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  await enterPass(page)
  await expect(page.getByTestId("ondo-b-traveler-id").getByTestId("review-sample-indicator")).toBeVisible()
  await page.getByTestId("kpass-start-setup").click()
  await expect(page.getByTestId("ktour-id-route-mobile-id")).toHaveAttribute("data-availability", "review")
  await advanceIdentityJourney(page, "mobile_id")
  await page.getByTestId("k-tour-id-return").click()
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
  await expect(page.getByTestId("kpass-service-person")).toHaveAttribute("data-status", "allowed")
  await expect(page.getByTestId("kpass-service-age")).toHaveAttribute("data-status", "allowed")
  await expect(page.getByTestId("kpass-service-payment")).toHaveAttribute("data-status", "needs_proof")
  expect(errors).toEqual([])
})

test("all eight sample claim profiles keep independent service decisions", async ({ page }, testInfo) => {
  // Eight public sample-picker transitions plus visual capture share this budget;
  // individual readiness/denial assertions keep their normal short timeout.
  test.setTimeout(60_000)
  await enterPass(page)
  const services = ["person", "age", "visitor_benefit", "payment"] as const
  // Literal public-policy expectations, not values computed by the app's
  // evaluator. Payment KYC remains missing even when the allowance is spent;
  // the actual checkout suite verifies the later limit denial independently.
  for (const [scenario, ...decisions] of [
    ["age_unknown", "allowed", "needs_proof", "allowed", "needs_proof"],
    ["under_age", "allowed", "denied", "allowed", "needs_proof"],
    ["stay_expired", "allowed", "allowed", "expired", "needs_proof"],
    ["revoked", "denied", "denied", "denied", "denied"],
    ["suspended", "denied", "denied", "denied", "denied"],
    ["limit_reached", "allowed", "allowed", "allowed", "needs_proof"],
    ["benefit_used", "allowed", "allowed", "denied", "needs_proof"],
    ["adult_visitor", "allowed", "allowed", "allowed", "needs_proof"],
  ] as const) {
    await chooseSample(page, scenario)
    for (const [index, service] of services.entries()) {
      await expect(page.getByTestId(`kpass-service-${service}`), `${scenario}: ${service}`).toHaveAttribute("data-status", decisions[index])
    }
    if (scenario === "limit_reached") await expect(page.getByTestId("kpass-service-card")).toContainText("₩0")
  }
  await page.getByTestId("kpass-service-card").scrollIntoViewIfNeeded()
  const bounds = await page.getByTestId("kpass-service-card").boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: testInfo.outputPath("pass-mobile-light.png") })
  await chooseSample(page, "guest")
  await expect(page.getByTestId("kpass-start-setup")).toBeVisible()
})

test("provider inspection mode never inherits the default sample authority", async ({ page }) => {
  await enterPass(page, "?review=0")
  await expect(page.getByTestId("review-sample-indicator")).toHaveCount(0)
  await expect(page.getByTestId("kpass-sample-picker")).toHaveCount(0)
  await page.getByTestId("kpass-start-setup").click()
  await expect(page.getByTestId("ktour-id-route-mobile-id")).toHaveAttribute("data-availability", "unavailable")
  await page.getByTestId("k-tour-id-cancel").click()
  await expect(page.getByTestId("kpass-service-person")).toHaveAttribute("data-status", "needs_proof")
})
