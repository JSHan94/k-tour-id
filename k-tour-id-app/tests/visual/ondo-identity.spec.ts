import { expect, test } from "@playwright/test"

test("PX-011 · VIS-FLOW-01 age gate truth", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "ko", guideSeen: true }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", persona: "korean_local", account: "ACC-GUEST", person: "PER-UNVERIFIED" }))
  })
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
  await page.goto("/ondo")
  await page.getByRole("button", { name: "After 19", exact: true }).click()
  await page.getByRole("button", { name: "19+ 확인하기" }).click()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
  await expect(page).toHaveScreenshot("PX-011-age-gate-simulation-ko.png", { animations: "disabled", fullPage: true })
})
