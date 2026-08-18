import { expect, test, type Page } from "@playwright/test"

async function seedReady(page: Page, stamps = 9) {
  await page.addInitScript((stampCount) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-20T20:00:00+09:00",
      paymentKyc: "PKY-VERIFIED",
      tableMembershipById: {},
      stamps: stampCount,
    }))
    sessionStorage.removeItem("ondo.chat.v2")
    sessionStorage.removeItem("ondo.labs.v2")
    sessionStorage.removeItem("ondo.accepted-visits.v2")
  }, stamps)
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
}

test("PX-023 · VIS-CONNECT-01 confirmed Table chat", async ({ page }) => {
  await seedReady(page)
  await page.goto("/ondo")
  await page.getByRole("button", { name: "Tables", exact: true }).click()
  await page.locator("[data-table-id='table-seongsu-dinner']").first().click()
  await page.getByTestId("table-join").click()
  await expect(page.getByTestId("table-requesting")).toBeVisible()
  await page.getByRole("button", { name: "Open chat" }).click()
  await expect(page.getByTestId("table-chat")).toBeVisible()
  await expect(page.getByText("Your Table seat is confirmed.", { exact: true })).toHaveCount(0, { timeout: 4_000 })
  await expect(page).toHaveScreenshot("PX-023-table-chat.png", { animations: "disabled", fullPage: true })
})

test("PX-024 · VIS-COMMERCE-01 simulated checkout receipt", async ({ page }) => {
  await seedReady(page)
  await page.goto("/ondo?venueId=seoul-seongsu-gukbap")
  await page.getByTestId("place-details").click()
  await page.getByTestId("venue-checkout").click()
  await page.getByTestId("checkout-start").click()
  await page.getByTestId("checkout-confirm").click()
  await expect(page.getByTestId("checkout-receipt")).toBeVisible()
  await expect(page).toHaveScreenshot("PX-024-checkout-receipt.png", { animations: "disabled", fullPage: true })
})

test("PX-025 · VIS-LABS-01 explicit simulation boundary", async ({ page }) => {
  await seedReady(page, 10)
  await page.goto("/ondo")
  await page.getByRole("button", { name: "My Korea", exact: true }).click()
  await page.getByTestId("open-labs-milestone").click()
  await page.getByTestId("labs-acknowledge").click()
  await page.getByTestId("labs-connect-wallet").click()
  await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")
  await expect(page).toHaveScreenshot("PX-025-labs-simulation.png", { animations: "disabled", fullPage: true })
})
