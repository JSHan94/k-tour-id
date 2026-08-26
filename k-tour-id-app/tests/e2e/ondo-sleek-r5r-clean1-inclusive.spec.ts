import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectNoHorizontalOverflow,
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

const MAP_GEOMETRY_VIEWPORTS = [
  { width: 667, height: 320 },
  { width: 740, height: 360 },
  { width: 844, height: 390 },
  { width: 926, height: 428 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
] as const

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value as Box
}

function intersectionArea(first: Box, second: Box) {
  const width = Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x))
  const height = Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y))
  return width * height
}

async function expectIndependentMapControls(page: Page, locale: "en" | "ko", viewport: string) {
  const zoomControls = page.locator(".maplibregl-ctrl-group button")
  await expect(zoomControls).toHaveCount(2)

  const controls: Array<{ name: string; locator: Locator }> = [
    { name: "search", locator: page.getByTestId("ondo-b-search") },
    { name: "preferences", locator: page.getByTestId("ondo-b-preference-summary") },
    { name: "after19", locator: page.getByTestId("after19-toggle") },
    { name: "map-key", locator: page.getByTestId("ondo-b-map-key") },
    { name: "locate", locator: page.getByTestId("ondo-b-locate") },
    { name: "view-toggle", locator: page.getByTestId("ondo-b-view-toggle") },
    { name: "attribution", locator: page.getByRole("link", { name: /OpenFreeMap/ }) },
    ...Array.from({ length: 4 }, (_, index) => ({
      name: `nav-${index}`,
      locator: page.getByTestId("ondo-main-nav").getByRole("button").nth(index),
    })),
    { name: "zoom-0", locator: zoomControls.nth(0) },
    { name: "zoom-1", locator: zoomControls.nth(1) },
  ]

  const canvasBox = await box(page.getByTestId("ondo-canvas"))
  const measured: Array<{ name: string; locator: Locator; box: Box }> = []
  for (const control of controls) {
    await expect(control.locator).toBeVisible()
    const controlBox = await box(control.locator)
    expect(controlBox.width, `${control.name} width`).toBeGreaterThanOrEqual(44)
    expect(controlBox.height, `${control.name} height`).toBeGreaterThanOrEqual(44)
    expect(controlBox.x, `${control.name} left edge`).toBeGreaterThanOrEqual(canvasBox.x - .5)
    expect(controlBox.y, `${control.name} top edge`).toBeGreaterThanOrEqual(canvasBox.y - .5)
    expect(controlBox.x + controlBox.width, `${control.name} right edge`).toBeLessThanOrEqual(canvasBox.x + canvasBox.width + .5)
    expect(controlBox.y + controlBox.height, `${control.name} bottom edge`).toBeLessThanOrEqual(canvasBox.y + canvasBox.height + .5)
    expect(await control.locator.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return hit === element || Boolean(hit && element.contains(hit))
    }), `${control.name} center must remain pointer-reachable`).toBe(true)
    measured.push({ ...control, box: controlBox })
  }

  for (let first = 0; first < measured.length; first += 1) {
    for (let second = first + 1; second < measured.length; second += 1) {
      expect(
        intersectionArea(measured[first].box, measured[second].box),
        `${locale} ${viewport} ${measured[first].name} intersects ${measured[second].name}`,
      ).toBeLessThanOrEqual(.5)
    }
  }

}

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
  test.describe.configure({ timeout: 360_000 })

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
      await expect(page.getByRole("button", { name: locale === "ko" ? "취향 설정 후 게스트 탐색" : "Personalize guest Explore", exact: true })).toBeFocused()
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

    test(`${locale.toUpperCase()} exact map controls stay independent across canonical and short landscapes`, async ({ page }) => {
      await seedB(page, { locale, local: { autoNight: false } })
      for (const viewport of MAP_GEOMETRY_VIEWPORTS) {
        await page.setViewportSize(viewport)
        await gotoB(page, "?city=seoul&view=map")
        await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
        await expectIndependentMapControls(page, locale, `${viewport.width}x${viewport.height}`)
        await expectNoHorizontalOverflow(page)
        const axe = await new AxeBuilder({ page })
          .include("[data-testid='ondo-b-map-entry']")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
        expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
      }
    })
  }

  test("canonical focus treatment remains the specified 2px outline plus 2px offset", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedFreshOnboarding(page, "en")
    await gotoB(page)
    const target = page.getByRole("button", { name: "Personalize guest Explore", exact: true })
    await expect(target).toBeFocused()
    await expect.poll(() => target.evaluate((element) => {
      const style = getComputedStyle(element)
      return [style.outlineWidth, style.outlineStyle, style.outlineColor, style.outlineOffset]
    })).toEqual(["2px", "solid", "rgb(29, 102, 209)", "2px"])
  })
})
