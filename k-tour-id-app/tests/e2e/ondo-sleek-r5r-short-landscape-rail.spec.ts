import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectNoHorizontalOverflow,
  gotoB,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const MAP_VIEWPORTS = [
  { width: 667, height: 320, kind: "short-landscape" },
  { width: 740, height: 360, kind: "short-landscape" },
  { width: 844, height: 390, kind: "short-landscape" },
  { width: 926, height: 428, kind: "short-landscape" },
  { width: 360, height: 800, kind: "canonical" },
  { width: 390, height: 844, kind: "canonical" },
  { width: 430, height: 932, kind: "canonical" },
  { width: 768, height: 1024, kind: "canonical" },
  { width: 801, height: 1000, kind: "canonical" },
  { width: 1440, height: 1000, kind: "canonical" },
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

async function expectControlIntegrity(control: Locator, canvasBox: Box, label: string) {
  await expect(control, `${label} must be visible`).toBeVisible()
  const controlBox = await box(control)
  const measurement = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return {
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
      pointerCenterHit: hit === element || Boolean(hit && element.contains(hit)),
    }
  })
  expect(controlBox.width, `${label} width`).toBeGreaterThanOrEqual(44)
  expect(controlBox.height, `${label} height`).toBeGreaterThanOrEqual(44)
  expect(controlBox.x, `${label} left edge`).toBeGreaterThanOrEqual(canvasBox.x - .5)
  expect(controlBox.y, `${label} top edge`).toBeGreaterThanOrEqual(canvasBox.y - .5)
  expect(controlBox.x + controlBox.width, `${label} right edge`).toBeLessThanOrEqual(canvasBox.x + canvasBox.width + .5)
  expect(controlBox.y + controlBox.height, `${label} bottom edge`).toBeLessThanOrEqual(canvasBox.y + canvasBox.height + .5)
  expect(measurement.fontSize, `${label} label font size`).toBeGreaterThanOrEqual(12)
  expect(measurement.pointerCenterHit, `${label} pointer center`).toBe(true)
  return controlBox
}

async function expectRailIntegrity(page: Page, locale: "en" | "ko", viewport: typeof MAP_VIEWPORTS[number]) {
  const label = `${locale} ${viewport.width}x${viewport.height} ${viewport.kind}`
  const canvasBox = await box(page.getByTestId("ondo-canvas"))
  const rail = page.getByLabel(locale === "ko" ? "장소 신호 필터" : "Place signal filters")
  const preference = page.getByTestId("ondo-b-preference-summary")
  const preferenceBox = await expectControlIntegrity(preference, canvasBox, `${label} preference summary`)
  const filters = rail.getByRole("button")
  await expect(filters).toHaveCount(3)

  const railBox = await box(rail)
  expect.soft(await rail.evaluate((element) => ({
    horizontalOverflow: Math.max(0, element.scrollWidth - element.clientWidth),
    verticalOverflow: Math.max(0, element.scrollHeight - element.clientHeight),
  })), `${label} rail overflow`).toEqual({ horizontalOverflow: 0, verticalOverflow: 0 })

  for (let index = 0; index < 3; index += 1) {
    const filter = filters.nth(index)
    const name = (await filter.textContent())?.trim() || `filter ${index + 1}`
    const filterBox = await expectControlIntegrity(filter, canvasBox, `${label} ${name}`)
    expect.soft(filterBox.x, `${label} ${name} clipped at rail left`).toBeGreaterThanOrEqual(railBox.x - .5)
    expect.soft(filterBox.y, `${label} ${name} clipped at rail top`).toBeGreaterThanOrEqual(railBox.y - .5)
    expect.soft(filterBox.x + filterBox.width, `${label} ${name} clipped at rail right`).toBeLessThanOrEqual(railBox.x + railBox.width + .5)
    expect.soft(filterBox.y + filterBox.height, `${label} ${name} clipped at rail bottom`).toBeLessThanOrEqual(railBox.y + railBox.height + .5)
    expect.soft(
      intersectionArea(filterBox, preferenceBox),
      `${label} ${name} intersects preference summary`,
    ).toBeLessThanOrEqual(.5)
  }

  expect(await preference.locator("span").evaluate((element) => ({
    horizontalOverflow: Math.max(0, element.scrollWidth - element.clientWidth),
    verticalOverflow: Math.max(0, element.scrollHeight - element.clientHeight),
  })), `${label} preference label clipping`).toEqual({ horizontalOverflow: 0, verticalOverflow: 0 })
  await expectNoHorizontalOverflow(page)

  const axe = await new AxeBuilder({ page })
    .include("[data-testid='ondo-b-map-entry']")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical"), `${label} serious/critical axe violations`).toEqual([])
}

test.describe("CLEAN1 short-landscape map rail closure", () => {
  test.describe.configure({ timeout: 360_000 })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "One actual-Chromium project owns the explicit viewport matrix.")
    await prepareBPage(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} filter rail and preference summary stay independent`, async ({ page }) => {
      await seedB(page, { locale, local: { autoNight: false } })
      for (const viewport of MAP_VIEWPORTS) {
        await page.setViewportSize(viewport)
        await gotoB(page, "?city=seoul&view=map")
        await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
        await expectRailIntegrity(page, locale, viewport)
      }
    })
  }
})
