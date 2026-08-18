import { expect, test, type Page } from "@playwright/test"

const runtimeFailures = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const failures: string[] = []
  runtimeFailures.set(page, failures)
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`) })
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`))
})

test.afterEach(async ({ page }) => {
  expect(runtimeFailures.get(page) ?? []).toEqual([])
})

async function seedCheckout(page: Page, stamps = 9) {
  await page.addInitScript((count) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-20T20:00:00+09:00",
      paymentKyc: "PKY-VERIFIED",
      stamps: count,
    }))
    sessionStorage.removeItem("ondo.accepted-visits.v2")
  }, stamps)
}

async function openCheckout(page: Page, query = "") {
  await page.goto(`/ondo?venueId=seoul-seongsu-gukbap${query}`)
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.getByTestId("place-details").click()
  await page.getByTestId("venue-checkout").click()
  await expect(page.getByTestId("checkout-overlay")).toBeVisible()
}

test("@core FL-004 checkout success does not create a stamp; a separate unique visit creates the tenth", async ({ page }) => {
  await seedCheckout(page)
  await openCheckout(page)
  await page.getByTestId("checkout-start").click()
  await page.getByTestId("checkout-confirm").click()
  await expect(page.getByTestId("checkout-receipt")).toBeVisible()
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "9")
  await page.getByTestId("visit-proof-check").click()
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "10")
  await expect(page.getByTestId("checkout-overlay")).toContainText("A unique proof from this on-site visit recorded your tenth stamp.")
})

test("FL-004 checkout cancel and decline keep receipts and stamps unchanged", async ({ page }) => {
  await seedCheckout(page)
  await openCheckout(page)
  await page.getByTestId("checkout-start").click()
  await page.getByTestId("checkout-cancel").click()
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-payment-state", "PAY-CANCELLED")
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "9")
  await expect(page.getByTestId("checkout-receipt")).toHaveCount(0)

  await page.goto("/ondo?venueId=seoul-seongsu-gukbap&scenario=payment-declined")
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.getByTestId("place-details").click()
  await page.getByTestId("venue-checkout").click()
  await page.getByTestId("checkout-start").click()
  await page.getByTestId("checkout-confirm").click()
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-payment-state", "PAY-FAILED")
  await expect(page.getByTestId("checkout-receipt")).toHaveCount(0)
  await expect(page.getByTestId("checkout-overlay")).toHaveAttribute("data-stamp-count", "9")
})

test("FL-004 an existing tenth stamp is not attributed to the current checkout", async ({ page }) => {
  await seedCheckout(page, 10)
  await openCheckout(page)
  await page.getByTestId("checkout-start").click()
  await page.getByTestId("checkout-confirm").click()
  await expect(page.getByTestId("checkout-overlay")).toContainText("The tenth visit was confirmed separately before this checkout.")
  await expect(page.getByTestId("checkout-overlay")).not.toContainText("A unique proof from this on-site visit")
})
