import { expect, test, type Page } from "@playwright/test"
import { seedB, seedFreshOnboarding } from "../helpers/ondo-b-qa"

const description = "Find your next food stop in Korea with K-Tour ID—discover restaurants, cafés and bars on the map, and keep your travel pass close."
const pageErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  pageErrors.set(page, errors)
  page.on("pageerror", error => errors.push(error.message))
})

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), "Brand surfaces must not cause application errors").toEqual([])
})

async function expectUnifiedHeader(page: Page) {
  const lockup = page.locator('[data-ondo-brand-lockup="compact"]')
  await expect(lockup).toBeVisible()
  await expect(lockup).toHaveAccessibleName("K-Tour ID")
  await expect(lockup.locator("b")).toHaveText("K-Tour ID")
  await expect(lockup.locator('[lang="ko-Hani"], img')).toHaveCount(0)
  const mark = lockup.locator('svg[data-ktour-mark="monochrome"]')
  await expect(mark).toHaveCount(1)
  await expect(mark).toHaveAttribute("aria-hidden", "true")
  await expect(mark.locator(":scope > path")).toHaveAttribute("fill", "currentColor")
  expect(await mark.locator(":scope > path").evaluate(path => getComputedStyle(path).fill))
    .toBe(await lockup.evaluate(element => getComputedStyle(element).color))
  expect(await page.locator("body").innerText()).not.toMatch(/\bONDO\b|溫圖/i)
  await expect(page.locator('img:is([src*="/brand/ondo-"], [src*="/brand/ktour-id-mark"], [src*="/brand/ktour-id-logo"], [src*="/brand/ktour-id-lockup"]):visible')).toHaveCount(0)
  return lockup
}

test.describe("K-Tour ID unified deployment brand", () => {
  test("the public root and shared metadata use the same K-Tour ID brand", async ({ page }) => {
    await seedB(page)
    await page.goto("/", { waitUntil: "domcontentloaded" })

    await expect(page).toHaveURL(/\/$/)
    await expect(page).toHaveTitle("K-Tour ID")
    await expect(page.locator('meta[name="application-name"]')).toHaveAttribute("content", "K-Tour ID")
    await expect(page.locator('meta[name="generator"]')).toHaveAttribute("content", "K-Tour ID")
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "K-Tour ID")
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "K-Tour ID")
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", "K-Tour ID")
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", description)
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-ktour-food-v2\.png$/)
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /\/og-ktour-food-v2\.png$/)
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200")
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630")
    await expect(page.locator('link[rel="icon"][href="/brand/ktour-id-mono-v1.svg"]')).toHaveAttribute("type", "image/svg+xml")
    await expect(page.locator('link[rel="icon"][href="/brand/ktour-id-mono-v1-32.png"]')).toHaveAttribute("sizes", "32x32")
    await expect(page.locator('link[rel="apple-touch-icon"][href="/brand/ktour-id-mono-v1-180.png"]')).toHaveAttribute("sizes", "180x180")
    await expect(page.locator('link[rel="icon"][href*="ktour-id-mark-"]')).toHaveCount(0)

    await expectUnifiedHeader(page)
    await expect(page.getByTestId("ondo-b-root")).toBeVisible()
  })

  test("fresh entry stays map-first with K-Tour ID browser and header branding", async ({ page }) => {
    await seedFreshOnboarding(page, "en")
    await page.goto("/", { waitUntil: "domcontentloaded" })

    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
    await expect(page.getByTestId("researched-food-detail")).toHaveCount(0)
    await expectUnifiedHeader(page)
    await expect(page).toHaveTitle("K-Tour ID")
  })

  for (const appearance of ["light", "dark"] as const) {
    test(`the ${appearance} header stays monochrome and clear of adjacent controls`, async ({ page, isMobile }, testInfo) => {
      test.setTimeout(60_000)
      await seedB(page, { locale: appearance === "dark" ? "ko" : "en", local: { appearancePreference: appearance } })
      await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" })
      await page.goto("/", { waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
      await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", appearance)
      for (const width of isMobile ? [320, 390] : [1440]) {
        await page.setViewportSize({ width, height: isMobile ? 844 : 1000 })
        // Hydration precedes map projection. Do not record the intentional
        // loading frame while the hero, city labels and preferences are hidden.
        await expect(page.getByTestId("ondo-b-nation").getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 })
        for (const city of ["seoul", "busan", "jeju"]) {
          const cityButton = page.getByTestId("ondo-b-korea-atlas").locator(`button[data-city="${city}"]`)
          await expect(cityButton).toBeVisible()
          await expect(cityButton.locator("strong")).toBeVisible()
        }
        await expect(page.getByTestId("ondo-b-personalization-edit")).toBeVisible()
        const lockup = await expectUnifiedHeader(page)
        const header = lockup.locator("xpath=ancestor::header[1]")
        const brandBox = await lockup.locator("..").boundingBox()
        const headerBox = await header.boundingBox()
        expect(brandBox).not.toBeNull()
        expect(headerBox).not.toBeNull()
        expect(brandBox!.x).toBeGreaterThanOrEqual(headerBox!.x - 1)
        expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(headerBox!.x + headerBox!.width + 1)
        for (const button of await header.locator("button:visible").all()) {
          const controlBox = await button.boundingBox()
          expect(controlBox).not.toBeNull()
          const overlapX = Math.min(brandBox!.x + brandBox!.width, controlBox!.x + controlBox!.width) - Math.max(brandBox!.x, controlBox!.x)
          const overlapY = Math.min(brandBox!.y + brandBox!.height, controlBox!.y + controlBox!.height) - Math.max(brandBox!.y, controlBox!.y)
          expect(overlapX > 1 && overlapY > 1, "Brand must not overlap header controls").toBe(false)
          expect(controlBox!.x + controlBox!.width).toBeLessThanOrEqual(width + 1)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1)
        await page.screenshot({ path: testInfo.outputPath(`brand-header-${appearance}-${width}.png`) })
      }
    })
  }

  test("an allowed deployment host owns its canonical and social image URLs", async ({ request }) => {
    const response = await request.get("/", {
      headers: { "x-forwarded-host": "k-tour-id.vercel.app" },
    })
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).toContain('property="og:image" content="https://k-tour-id.vercel.app/og-ktour-food-v2.png"')
    expect(html).toContain('name="twitter:image" content="https://k-tour-id.vercel.app/og-ktour-food-v2.png"')
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1]
    expect(canonical).toBeTruthy()
    expect(new URL(canonical!).origin).toBe("https://k-tour-id.vercel.app")
    expect(new URL(canonical!).pathname).toBe("/")
  })
})
