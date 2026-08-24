import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { CANONICAL_VENUE_ID } from "../helpers/ondo-b-qa"

const DEVICE_KEY = "ondo-b.device.v1"

async function seedProduction(page: Page, locale: "en" | "ko", savedVenueIds: string[] = []) {
  await page.addInitScript(({ key, language, saved }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: saved,
      privateNotesByVenue: {},
    }))
  }, { key: DEVICE_KEY, language: locale, saved: savedVenueIds })
}

async function seriousAxeViolations(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .exclude(".maplibregl-cooperative-gesture-screen")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  return result.violations.filter((item) => item.impact === "serious" || item.impact === "critical")
}

test.describe("ONDO B production inclusive surfaces", () => {
  test("B-PROD-INCLUSIVE-001 category controls meet the 44px target in EN and KO", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    for (const locale of ["en", "ko"] as const) {
      await seedProduction(page, locale)
      await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
      const controls = page.locator("[data-testid='ondo-b-category-rail'] button")
      await expect(controls).toHaveCount(8)
      const boxes = await controls.evaluateAll((buttons) => buttons.map((button) => {
        const rect = button.getBoundingClientRect()
        return { width: rect.width, height: rect.height, text: button.textContent?.trim() }
      }))
      expect(boxes.filter((box) => box.width < 44 || box.height < 44)).toEqual([])
    }
  })

  test("B-PROD-INCLUSIVE-002 empty directory results preserve list semantics and contrast", async ({ page }) => {
    await seedProduction(page, "en")
    await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
    await page.getByTestId("ondo-b-search").fill("no-record-can-match-this-query")
    const empty = page.getByTestId("ondo-b-empty-results")
    await expect(empty).toBeVisible()
    await expect(empty).toHaveRole("listitem")
    await expect(empty.getByRole("status")).toBeVisible()
    expect(await seriousAxeViolations(page, "[data-testid='ondo-b-venue-list']")).toEqual([])
  })

  test("B-PROD-INCLUSIVE-003 saved-place metadata stays at the 12px production floor", async ({ page }) => {
    await seedProduction(page, "en", [CANONICAL_VENUE_ID])
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    const card = page.getByTestId(`saved-card-${CANONICAL_VENUE_ID}`)
    await expect(card).toBeVisible()
    const undersized = await card.locator("small, p, [role='status'], [role='alert']").evaluateAll((nodes) => nodes
      .filter((node) => (node as HTMLElement).offsetParent !== null)
      .map((node) => ({ text: node.textContent?.trim(), size: Number.parseFloat(getComputedStyle(node).fontSize) }))
      .filter((entry) => entry.size < 12))
    expect(undersized).toEqual([])
    expect(await seriousAxeViolations(page, `[data-testid='saved-card-${CANONICAL_VENUE_ID}']`)).toEqual([])
  })
})
