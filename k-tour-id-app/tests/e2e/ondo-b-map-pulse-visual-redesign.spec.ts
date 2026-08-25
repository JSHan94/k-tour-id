import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const PORTRAITS = [
  { width: 320, height: 720 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

async function seedDirectory(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
}

async function area(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!.width * box!.height
}

test.describe("ONDO B polished Pulse map", () => {
  test.describe.configure({ timeout: 120_000 })

  for (const locale of ["en", "ko"] as const) {
    for (const viewport of PORTRAITS) {
      test(`${locale} ${viewport.width}x${viewport.height} keeps the Pulse map visible and progressive`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seedDirectory(page, locale)
        await page.goto("/ondo-b?city=seoul", { waitUntil: "domcontentloaded" })

        const root = page.getByTestId("ondo-b-map-entry")
        await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
        await expect(root).toHaveAttribute("data-pulse-map-grammar", "curated-level-score-over-official-groups")
        await expect(root).toHaveAttribute("data-curated-pulse-count", "6")
        const accessiblePulse = page.getByTestId("ondo-b-pulse-marker-accessible-detail")
        await expect(accessiblePulse.locator("li")).toHaveCount(6)
        await expect(accessiblePulse).toContainText(locale === "ko" ? "신뢰도" : "confidence")

        const legend = page.getByTestId("ondo-b-pulse-legend")
        const swatches = legend.locator("[data-level] i")
        await expect(swatches).toHaveCount(6)
        const colors = await swatches.evaluateAll((items) => items.map((item) => getComputedStyle(item).backgroundColor))
        expect(new Set(colors).size).toBe(6)
        expect(colors.every((color) => color !== "rgba(0, 0, 0, 0)")).toBe(true)
        if (viewport.width >= 390) {
          const legendWidth = await legend.evaluate((node) => ({ client: node.clientWidth, scroll: node.scrollWidth }))
          expect(legendWidth.scroll).toBeLessThanOrEqual(legendWidth.client)
        }

        const chrome = [
          page.getByTestId("ondo-b-location-message"),
          page.getByTestId("ondo-b-map-key"),
          page.getByTestId("ondo-b-result-bar"),
          page.getByTestId("ondo-b-attribution"),
        ]
        const rootBox = await root.boundingBox()
        expect(rootBox).not.toBeNull()
        const persistentChromeArea = (await Promise.all(chrome.map(area))).reduce((sum, value) => sum + value, 0)
        expect(persistentChromeArea / (rootBox!.width * rootBox!.height)).toBeLessThanOrEqual(.30)

        const keyDetails = page.getByTestId("ondo-b-map-key-details")
        const creditDetails = page.getByTestId("ondo-b-map-credit-details")
        await expect(keyDetails).not.toHaveAttribute("open", "")
        await expect(creditDetails).not.toHaveAttribute("open", "")
        await keyDetails.locator("summary").click()
        await expect(keyDetails).toHaveAttribute("open", "")
        await expect(keyDetails).toContainText(locale === "ko" ? "실시간 혼잡도" : "not live crowding")
        await creditDetails.locator("summary").click()
        await expect(creditDetails).toHaveAttribute("open", "")
        await expect(creditDetails.getByRole("link")).toHaveCount(3)
      })
    }
  }

  for (const locale of ["en", "ko"] as const) {
    test(`${locale} 844x390 compact composition and mobile List remain scrollable`, async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 })
      await seedDirectory(page, locale)
      await page.goto("/ondo-b?city=seoul", { waitUntil: "domcontentloaded" })
      const root = page.getByTestId("ondo-b-map-entry")
      await expect(root).toHaveAttribute("data-effective-view", "list")
      const landscapePanel = page.getByTestId("ondo-b-list-panel")
      await expect(landscapePanel).toBeVisible()
      await landscapePanel.evaluate((node) => { node.scrollTop = 120 })
      expect(await landscapePanel.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)

      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
      const mobilePanel = page.getByTestId("ondo-b-list-panel")
      await expect(mobilePanel).toBeVisible()
      expect(await mobilePanel.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true)
      const hottest = page.getByTestId("ondo-b-venue-list").locator("li[data-pulse-priority]").first()
      await expect(hottest).toHaveAttribute("data-pulse-priority", "peak")
      const hottestButton = hottest.getByRole("button")
      await hottestButton.focus()
      await page.keyboard.press("Enter")
      await expect(page.getByTestId("canonical-place-dialog")).toBeVisible()
    })
  }
})
