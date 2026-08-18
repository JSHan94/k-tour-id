import { expect, test } from "@playwright/test"

async function openPrepared(page: import("@playwright/test").Page, overrides: Record<string, unknown> = {}) {
  await page.addInitScript((next) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", autoNight: true, guideSeen: true }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      account: "ACC-GUEST",
      person: "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
      ...next,
    }))
  }, overrides)
  await page.goto("/ondo")
}

test("ID defaults to Guest and unverified checks", async ({ page }) => {
  await openPrepared(page)
  await page.getByRole("button", { name: "ID", exact: true }).click()
  const identity = page.getByTestId("ondo-identity-entry")
  await expect(identity).toBeVisible()
  await expect(identity).toContainText("Exploring without an account")
  await expect(identity).toContainText("Person check not completed")
  await expect(identity).not.toContainText("Person check complete · Simulated")
})

test("simulated person proof never implies age or payment KYC", async ({ page }) => {
  await openPrepared(page, { account: "ACC-ACTIVE", person: "PER-VERIFIED" })
  await page.getByRole("button", { name: "ID", exact: true }).click()
  const identity = page.getByTestId("ondo-identity-entry")
  await expect(identity).toContainText("Person check complete · Simulated")
  await expect(identity).toContainText("19+ not checked")
  await expect(identity).toContainText("Payment KYC not completed")
})
