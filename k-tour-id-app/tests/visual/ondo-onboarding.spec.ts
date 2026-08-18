import { expect, test } from "@playwright/test"

test("PX-010 · VIS-ONB-01 three persona choices", async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); sessionStorage.clear() })
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
  await page.goto("/ondo")
  await page.getByTestId("ondo-onboarding").getByRole("button", { name: "KO", exact: true }).click()
  await page.getByRole("button", { name: "시작하기" }).click()
  await expect(page.getByTestId("onboarding-step-intent")).toBeVisible()
  await expect(page).toHaveScreenshot("PX-010-onboarding-personas-ko.png", { animations: "disabled", fullPage: true })
})
