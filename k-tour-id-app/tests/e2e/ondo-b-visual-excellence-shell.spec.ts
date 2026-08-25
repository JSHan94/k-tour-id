import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seed(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      locale: "en",
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, DEVICE_KEY)
}

test.describe("ONDO B premium shell", () => {
  test("desktop product surfaces use an intentional wide composition", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await seed(page)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

    for (const navId of ["nav-my", "nav-tables", "nav-id", "nav-settings"]) {
      await page.getByTestId(navId).click()
      const surface = page.getByTestId("ondo-scroll-region").locator(":scope > *").first()
      const bounds = await surface.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.width).toBeGreaterThanOrEqual(920)
      expect(bounds!.width).toBeLessThanOrEqual(1060)
    }
  })

  test("mobile navigation uses shared premium motion without weakening touch geometry", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await seed(page)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

    const root = page.getByTestId("ondo-b-root")
    expect(await root.evaluate((element) => getComputedStyle(element).getPropertyValue("--ondo-motion-medium").trim())).toBe("240ms")
    const buttons = page.getByTestId("ondo-main-nav").getByRole("button")
    expect(Math.min(...await buttons.evaluateAll((items) => items.map((item) => Math.min(item.getBoundingClientRect().width, item.getBoundingClientRect().height))))).toBeGreaterThanOrEqual(44)

    await page.getByTestId("nav-tables").click()
    const active = page.getByTestId("nav-tables")
    await expect(active).toHaveAttribute("data-state", "selected")
    expect(await active.evaluate((element) => getComputedStyle(element).animationDuration)).toBe("0.24s")
  })

  test("reduced motion keeps the same selected hierarchy without animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("nav-id")).toHaveAttribute("data-state", "selected")
    expect(await page.getByTestId("nav-id").evaluate((element) => getComputedStyle(element).animationName)).toBe("none")
  })
})
