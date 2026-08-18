import { expect, test, type Page } from "@playwright/test"

async function openAs(page: Page, options: { account?: "ACC-GUEST" | "ACC-ACTIVE"; person?: "PER-UNVERIFIED" | "PER-VERIFIED"; paymentKyc?: "PKY-NOT-STARTED" | "PKY-VERIFIED" } = {}) {
  await page.addInitScript((seed) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: seed.account ?? "ACC-GUEST",
      person: seed.person ?? "PER-UNVERIFIED",
      paymentKyc: seed.paymentKyc ?? "PKY-NOT-STARTED",
    }))
  }, options)
}

async function openExpandedVenue(page: Page, venueId = "seoul-seongsu-gukbap") {
  await page.goto(`/ondo?venueId=${venueId}`)
  await expect(page.getByTestId("place-peek")).toBeVisible()
  await page.getByTestId("place-details").click()
  await expect(page.getByTestId("place-overlay")).toBeVisible()
}

async function expectFullyInViewport(page: Page, testId: string) {
  const target = page.getByTestId(testId)
  await expect(target).toBeVisible()
  await expect.poll(async () => {
    const box = await target.boundingBox()
    const viewport = page.viewportSize()
    if (!box || !viewport) return false
    return box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height
  }).toBe(true)
}

test.describe("Place detail browser journeys", () => {
  test("visit signal entry reaches its surface, then asks for Account and Person just in time", async ({ page }) => {
    await openAs(page)
    await openExpandedVenue(page)

    await expect(page.getByTestId("venue-directions")).toBeVisible()
    await expect(page.getByTestId("venue-tables")).toBeVisible()
    await expectFullyInViewport(page, "venue-directions")
    await expectFullyInViewport(page, "venue-tables")
    await expect(page.getByTestId("venue-local-signal")).toHaveText(/Share a visit signal/)
    await expectFullyInViewport(page, "venue-local-signal")
    await expectFullyInViewport(page, "venue-checkout")
    await page.getByTestId("venue-local-signal").click()

    await expect(page.getByRole("dialog", { name: "Share a visit signal" })).toBeVisible()
    await expect(page.locator("[data-signal-status='draft']")).toContainText("Seongsu Dwaeji Gukbap")
    await page.getByRole("button", { name: "Submit signal" }).click()

    const gate = page.getByTestId("ondo-gate-overlay")
    await expect(gate).toBeVisible()
    await expect(gate).toContainText("Create an account to continue")
    await expect(gate).toContainText("Account")
    await expect(gate).toContainText("Person")
    await expect(gate).not.toContainText("Payment KYC")
  })

  test("checkout entry reaches its surface, then asks an existing account only for Payment KYC", async ({ page }) => {
    await openAs(page, { account: "ACC-ACTIVE" })
    await openExpandedVenue(page, "seoul-euljiro-nogari")

    await expect(page.getByTestId("venue-checkout")).toHaveText(/Checkout simulation/)
    await page.getByTestId("venue-checkout").click()

    await expect(page.getByRole("dialog", { name: "Checkout simulation" })).toBeVisible()
    await expect(page.locator("[data-payment-state='PAY-IDLE']")).toHaveAttribute("data-payment-kyc", "PKY-NOT-STARTED")
    await page.getByRole("button", { name: "Continue with Payment KYC" }).click()

    const gate = page.getByTestId("ondo-gate-overlay")
    await expect(gate).toBeVisible()
    await expect(gate).toContainText("Complete Payment KYC")
    await expect(gate).toContainText("Payment KYC")
    await expect(gate).not.toContainText("Complete a person check")
  })
})
