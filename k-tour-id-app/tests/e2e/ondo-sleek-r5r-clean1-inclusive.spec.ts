import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  gotoB,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
} from "../helpers/ondo-b-qa"

const LANDSCAPE_VIEWPORTS = [
  { width: 667, height: 320 },
  { width: 844, height: 390 },
] as const

async function expectNotEllipsized(locator: Locator) {
  await expect(locator).toBeVisible()
  expect(await locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return style.textOverflow !== "ellipsis" && element.scrollWidth <= element.clientWidth + 1
  })).toBe(true)
}

async function openAccountGate(page: Page, locale: "en" | "ko") {
  await seedB(page, { locale })
  await openCanonicalVenue(page)
  await page.getByTestId("canonical-venue-save").click()
  await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
}

test.describe("CLEAN1 inclusive and responsive corrections", () => {
  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} onboarding Escape takes the existing guest path and restores a stable destination`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await seedFreshOnboarding(page, locale)
      await gotoB(page)
      const dialog = page.getByTestId("ondo-onboarding")
      await expect(dialog).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(dialog).toHaveCount(0)
      await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
      await expect(page.getByTestId("ondo-b-nation").locator("[data-city='seoul']")).toBeFocused()
    })

    test(`${locale.toUpperCase()} gate progress exposes supported list semantics without prohibited ARIA`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await openAccountGate(page, locale)
      const progress = page.getByTestId("ondo-gate-progress")
      await expect(progress).toHaveAttribute("role", "list")
      await expect(progress.getByRole("listitem")).toHaveCount(1)
      const axe = await new AxeBuilder({ page })
        .include("[data-testid='ondo-gate-overlay']")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
      expect(axe.violations.filter(({ id }) => id === "aria-prohibited-attr")).toEqual([])
    })

    test(`${locale.toUpperCase()} short landscape keeps preference and map truth labels whole`, async ({ page }) => {
      await seedB(page, { locale, local: { autoNight: false } })
      for (const viewport of LANDSCAPE_VIEWPORTS) {
        await page.setViewportSize(viewport)
        await gotoB(page, "?city=seoul&view=map")
        await expectNotEllipsized(page.getByTestId("ondo-b-preference-summary").locator("span"))
        await expectNotEllipsized(page.getByTestId("ondo-b-map-key").locator("small").locator("span:visible"))
      }
    })
  }

  test("canonical focus treatment remains the specified 2px outline plus 2px offset", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedFreshOnboarding(page, "en")
    await gotoB(page)
    const target = page.getByRole("button", { name: "Get started", exact: true })
    await expect(target).toBeFocused()
    await expect.poll(() => target.evaluate((element) => {
      const style = getComputedStyle(element)
      return [style.outlineWidth, style.outlineStyle, style.outlineColor, style.outlineOffset]
    })).toEqual(["2px", "solid", "rgb(29, 102, 209)", "2px"])
  })
})
