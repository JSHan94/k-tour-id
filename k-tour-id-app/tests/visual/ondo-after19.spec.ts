import { expect, test } from "@playwright/test"

test("PX-008 · VIS-HEAT-03 auto After 19 banner", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-19T19:30:00+09:00"))
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", autoNight: true, guideSeen: true }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T19:30:00+09:00", after19: "A19-OFF" }))
  })
  await page.goto("/ondo")
  await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
  await expect(page).toHaveScreenshot("PX-008-after19-auto-en.png", { animations: "disabled", fullPage: true })
})

test("manual off survives remount in the same session", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-19T19:30:00+09:00"))
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", autoNight: true, guideSeen: true }))
    if (!sessionStorage.getItem("ondo.session.v3")) sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T19:30:00+09:00", after19: "A19-OFF" }))
  })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "Return to the main map" }).click()
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").after19)).toBe("A19-MANUAL-OFF")
  await page.reload()
  await expect(page.getByTestId("after19-auto-banner")).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}").after19)).toBe("A19-MANUAL-OFF")
})
