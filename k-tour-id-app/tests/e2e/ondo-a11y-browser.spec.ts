import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function expectNoSeriousViolations(page: Page, include?: string) {
  let audit = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  if (include) audit = audit.include(include)
  const result = await audit.analyze()
  const blocking = result.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([])
}

async function seedGuest(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: "ACC-GUEST",
      person: "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
      after19: "A19-OFF",
    }))
  })
}

test("@a11y onboarding and map have no critical or serious WCAG violations", async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "Get started" }).click()
  await expect(page.getByTestId("onboarding-step-intent")).toBeVisible()
  await expectNoSeriousViolations(page, "[data-testid='ondo-onboarding']")

  await page.getByRole("button", { name: "Skip and explore" }).click()
  await expect(page.getByTestId("ondo-map-entry")).toBeVisible()
  await expectNoSeriousViolations(page, "[data-testid='ondo-map-entry']")
})

test("@a11y place detail and account gate have no critical or serious WCAG violations", async ({ page }) => {
  await seedGuest(page)
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await page.getByTestId("place-details").click()
  await expectNoSeriousViolations(page, "[data-testid='place-overlay']")

  await page.getByTestId("venue-save").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
  await expectNoSeriousViolations(page, "[data-testid='ondo-gate-overlay']")
})

test("@a11y Tables and ID remain accessible at mobile width", async ({ page }) => {
  await seedGuest(page)
  await page.goto("/ondo")
  await page.getByRole("button", { name: "Tables", exact: true }).click()
  await expectNoSeriousViolations(page, "[data-testid='tables-entry']")

  await page.getByRole("button", { name: "ID", exact: true }).click()
  await expectNoSeriousViolations(page, "[data-testid='ondo-identity-entry']")
})

test("@a11y active public profile and four separate activity axes meet WCAG AA", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-20T20:00:00+09:00",
      paymentKyc: "PKY-VERIFIED",
      reputation: { identity: "complete", visit: "repeat", contribution: "helpful", meetup: "reliable" },
    }))
  })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "ID", exact: true }).click()
  await expect(page.getByTestId("ondo-profile-panel")).toBeVisible()
  await expect(page.getByTestId("ondo-trust-panel")).toBeVisible()
  await expectNoSeriousViolations(page, "[data-testid='ondo-identity-entry']")
})
