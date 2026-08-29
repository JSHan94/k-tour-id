import { expect, test } from "@playwright/test"
import { seedB, seedFreshOnboarding } from "../helpers/ondo-b-qa"

test.describe("K-TOUR ID and ONDO deployment brand", () => {
  test("the public root enters ONDO while shared metadata leads with K-TOUR ID", async ({ page }) => {
    await seedB(page)
    await page.goto("/", { waitUntil: "domcontentloaded" })

    await expect(page).toHaveURL(/\/ondo-b$/)
    await expect(page).toHaveTitle("K-TOUR ID | ONDO 溫圖")
    await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", "K-TOUR ID")
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "K-TOUR ID")
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "K-TOUR ID | ONDO 溫圖")
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-map-first\.png$/)
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /\/og-map-first\.png$/)
    await expect(page.locator('link[rel="icon"][href*="ondo-mark-micro-16.svg"]')).toHaveCount(1)

    const lockup = page.locator('[data-ondo-brand-lockup="compact"]')
    await expect(lockup).toHaveAccessibleName("ONDO")
    await expect(lockup.locator('b[lang="ko-Hani"]')).toHaveText("溫圖")
    await expect(page.getByTestId("ondo-b-root")).toBeVisible()
  })

  test("first-run setup uses the full ONDO 溫圖 lockup without changing K-Tour ID feature naming", async ({ page }) => {
    await seedFreshOnboarding(page, "en")
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

    const onboarding = page.getByTestId("ondo-onboarding")
    const lockup = onboarding.locator('[data-ondo-brand-lockup="full"]')
    await expect(lockup).toHaveAccessibleName("ONDO")
    await expect(lockup.locator('b[lang="ko-Hani"]')).toHaveText("溫圖")
    await expect(onboarding.getByTestId("k-tour-id-setup-open")).toContainText("K-Tour ID")
  })
})
