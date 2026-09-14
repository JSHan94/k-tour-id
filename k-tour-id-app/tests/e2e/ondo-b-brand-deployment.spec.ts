import { expect, test } from "@playwright/test"
import { seedB, seedFreshOnboarding } from "../helpers/ondo-b-qa"

const description = "Find your next food stop in Korea with K-TOUR ID by ONDO—discover restaurants, cafés and bars on the map, and keep your travel pass close."

test.describe("K-TOUR ID and ONDO deployment brand", () => {
  test("the public root enters ONDO while shared metadata leads with K-TOUR ID", async ({ page }) => {
    await seedB(page)
    await page.goto("/", { waitUntil: "domcontentloaded" })

    await expect(page).toHaveURL(/\/$/)
    await expect(page).toHaveTitle("K-TOUR ID | ONDO 溫圖")
    await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", "K-TOUR ID")
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "K-TOUR ID")
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "K-TOUR ID | ONDO 溫圖")
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", description)
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-ktour-food-v1\.png$/)
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /\/og-ktour-food-v1\.png$/)
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200")
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630")
    await expect(page.locator('link[rel="icon"][href="/brand/ktour-id-mono-v1.svg"]')).toHaveAttribute("type", "image/svg+xml")
    await expect(page.locator('link[rel="icon"][href="/brand/ktour-id-mono-v1-32.png"]')).toHaveAttribute("sizes", "32x32")
    await expect(page.locator('link[rel="apple-touch-icon"][href="/brand/ktour-id-mono-v1-180.png"]')).toHaveAttribute("sizes", "180x180")
    await expect(page.locator('link[rel="icon"][href*="ktour-id-mark-"]')).toHaveCount(0)

    const lockup = page.locator('[data-ondo-brand-lockup="compact"]')
    await expect(lockup).toHaveAccessibleName("ONDO")
    await expect(lockup.locator('b[lang="ko-Hani"]')).toHaveText("溫圖")
    await expect(page.getByTestId("ondo-b-root")).toBeVisible()
  })

  test("fresh entry stays map-first while K-TOUR ID owns browser branding", async ({ page }) => {
    await seedFreshOnboarding(page, "en")
    await page.goto("/", { waitUntil: "domcontentloaded" })

    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
    await expect(page.getByTestId("researched-food-detail")).toHaveCount(0)
    const lockup = page.locator('[data-ondo-brand-lockup="compact"]')
    await expect(lockup).toHaveAccessibleName("ONDO")
    await expect(lockup.locator('b[lang="ko-Hani"]')).toHaveText("溫圖")
    await expect(page).toHaveTitle("K-TOUR ID | ONDO 溫圖")
  })

  test("an allowed deployment host owns its canonical and social image URLs", async ({ request }) => {
    const response = await request.get("/", {
      headers: { "x-forwarded-host": "k-tour-id.vercel.app" },
    })
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).toContain('property="og:image" content="https://k-tour-id.vercel.app/og-ktour-food-v1.png"')
    expect(html).toContain('name="twitter:image" content="https://k-tour-id.vercel.app/og-ktour-food-v1.png"')
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1]
    expect(canonical).toBeTruthy()
    expect(new URL(canonical!).origin).toBe("https://k-tour-id.vercel.app")
    expect(new URL(canonical!).pathname).toBe("/")
  })
})
