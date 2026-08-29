import { expect, test } from "@playwright/test"
import { seedB, seedFreshOnboarding } from "../helpers/ondo-b-qa"

test.describe("K-TOUR ID and ONDO deployment brand", () => {
  test("the public root enters ONDO while shared metadata leads with K-TOUR ID", async ({ page }) => {
    await seedB(page)
    await page.goto("/", { waitUntil: "domcontentloaded" })

    await expect(page).toHaveURL(/\/$/)
    await expect(page).toHaveTitle("K-TOUR ID | ONDO 溫圖")
    await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", "K-TOUR ID")
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "K-TOUR ID")
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "K-TOUR ID | ONDO 溫圖")
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-map-first\.png$/)
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /\/og-map-first\.png$/)
    await expect(page.locator('link[rel="icon"][href*="ktour-id-mark-32.png"]')).toHaveCount(1)
    await expect(page.locator('link[rel="apple-touch-icon"][href*="ktour-id-mark-180.png"]')).toHaveCount(1)

    const lockup = page.locator('[data-ondo-brand-lockup="compact"]')
    await expect(lockup).toHaveAccessibleName("ONDO")
    await expect(lockup.locator('b[lang="ko-Hani"]')).toHaveText("溫圖")
    await expect(page.getByTestId("ondo-b-root")).toBeVisible()
  })

  test("first-run setup uses the full ONDO 溫圖 lockup without changing K-Tour ID feature naming", async ({ page }) => {
    await seedFreshOnboarding(page, "en")
    await page.goto("/", { waitUntil: "domcontentloaded" })

    const onboarding = page.getByTestId("ondo-onboarding")
    const lockup = onboarding.locator('[data-ondo-brand-lockup="full"]')
    await expect(lockup).toHaveAccessibleName("ONDO")
    await expect(lockup.locator('b[lang="ko-Hani"]')).toHaveText("溫圖")
    await expect(onboarding.getByTestId("k-tour-id-setup-open")).toContainText("K-Tour ID")
  })

  test("an allowed deployment host owns its canonical and social image URLs", async ({ request }) => {
    const response = await request.get("/", {
      headers: { "x-forwarded-host": "k-tour-id.vercel.app" },
    })
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).toContain('property="og:image" content="https://k-tour-id.vercel.app/og-map-first.png"')
    expect(html).toContain('name="twitter:image" content="https://k-tour-id.vercel.app/og-map-first.png"')
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1]
    expect(canonical).toBeTruthy()
    expect(new URL(canonical!).origin).toBe("https://k-tour-id.vercel.app")
    expect(new URL(canonical!).pathname).toBe("/")
  })
})
