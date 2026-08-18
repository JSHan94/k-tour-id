import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", autoNight: true, guideSeen: true }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST", person: "PER-UNVERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" }))
  })
})

test("manual After 19 entry uses an age-only JIT gate and can cancel", async ({ page }) => {
  await page.goto("/ondo")
  await page.getByRole("button", { name: "After 19", exact: true }).click()
  await expect(page.getByRole("dialog", { name: /Confirm 19\+/ })).toBeVisible()
  await page.getByRole("button", { name: "Confirm 19+", exact: true }).click()
  const gate = page.getByTestId("ondo-gate-overlay")
  await expect(gate).toBeVisible()
  await expect(gate).toContainText("19+")
  await expect(gate).not.toContainText("Payment KYC")
  await page.getByRole("button", { name: "Return without changes" }).click()
  await expect(gate).toBeHidden()
})

test("age failure preserves the gate for retry", async ({ page }) => {
  await page.goto("/ondo")
  await page.getByRole("button", { name: "After 19", exact: true }).click()
  await page.getByRole("button", { name: "Confirm 19+", exact: true }).click()
  await page.getByRole("button", { name: "Simulate failure" }).click()
  await expect(page.getByTestId("gate-failure")).toBeVisible()
  await page.getByRole("button", { name: "Try again", exact: true }).click()
  await expect(page.getByRole("button", { name: "Start 19+ check simulation" })).toBeVisible()
})
