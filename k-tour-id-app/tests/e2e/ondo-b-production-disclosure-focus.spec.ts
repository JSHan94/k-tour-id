import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const COMPACT_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const
const FOCUS_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
] as const

async function seedProductionDirectory(page: Page, locale: "en" | "ko" = "en") {
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

test.describe("ONDO B production disclosure and focus boundaries", () => {
  for (const viewport of COMPACT_VIEWPORTS) {
    for (const locale of ["en", "ko"] as const) {
      test(`location message does not cover the map key at ${viewport.width}x${viewport.height} ${locale}`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await seedProductionDirectory(page, locale)
        await page.goto("/?city=seoul", { waitUntil: "domcontentloaded" })
        await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })

        const disclosure = page.getByTestId("ondo-b-location-message")
        const mapKey = page.getByTestId("ondo-b-map-key")
        const locate = page.getByTestId("ondo-b-locate")
        await expect(disclosure).toHaveCount(1)
        await expect(disclosure).toBeVisible()
        await expect(mapKey).toBeVisible()
        await expect(locate).toHaveAttribute("aria-describedby", "ondo-b-location-message")
        const area = await disclosure.evaluate((node, keyTestId) => {
          const key = document.querySelector<HTMLElement>(`[data-testid='${keyTestId}']`)
          if (!key) throw new Error("Map key is missing")
          const left = node.getBoundingClientRect()
          const right = key.getBoundingClientRect()
          return Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
            * Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top))
        }, "ondo-b-map-key")
        expect(area, "the visible privacy disclosure must not cover source-boundary map text").toBe(0)
      })
    }
  }

  for (const viewport of FOCUS_VIEWPORTS) {
    test(`closing a place restores its exact list opener at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await seedProductionDirectory(page)
      await page.goto("/?city=seoul&view=list", { waitUntil: "domcontentloaded" })
      const opener = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first()
      const openerId = await opener.getAttribute("data-venue-opener")
      await opener.click()
      const peek = page.getByTestId("canonical-place-peek")
      await expect(peek).toBeVisible()
      await peek.getByTestId("canonical-place-details").click()
      const detail = page.getByTestId("canonical-place-overlay")
      await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")

      await page.keyboard.press("Escape")
      await expect(detail).toBeHidden()
      await expect(peek.getByTestId("canonical-place-details")).toBeFocused()
      await page.keyboard.press("Escape")
      await expect(peek).toBeHidden()
      await expect.poll(() => page.evaluate(() => {
        const state = history.state as { __ondoBDiscovery?: { level?: string } } | null
        return state?.__ondoBDiscovery?.level
      })).toBe("city")
      await expect(opener, `focus must return to the exact ${openerId} list row after history settles`).toBeFocused()
    })
  }
})
