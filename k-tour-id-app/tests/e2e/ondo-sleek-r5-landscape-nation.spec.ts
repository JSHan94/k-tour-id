import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, gotoB, prepareBPage, seedB, type BLocale } from "../helpers/ondo-b-qa"

const LANDSCAPE_VIEWPORTS = [
  { width: 740, height: 360 },
  { width: 844, height: 390 },
  { width: 926, height: 428 },
  { width: 1512, height: 801 },
] as const

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value as Box
}

function intersection(first: Box, second: Box) {
  return {
    width: Math.max(0, Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x)),
    height: Math.max(0, Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y)),
  }
}

async function expectNoIntersection(first: Locator, second: Locator) {
  const [firstBox, secondBox] = await Promise.all([box(first), box(second)])
  const overlap = intersection(firstBox, secondBox)
  expect(overlap.width * overlap.height, JSON.stringify({ first: firstBox, second: secondBox, overlap })).toBeLessThanOrEqual(0.5)
}

async function expectUnobscured44pxTarget(page: Page, control: Locator) {
  await expect(control).toBeVisible()
  const target = await box(control)
  expect(target.width).toBeGreaterThanOrEqual(44)
  expect(target.height).toBeGreaterThanOrEqual(44)

  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()
  expect(target.x).toBeGreaterThanOrEqual(0)
  expect(target.y).toBeGreaterThanOrEqual(0)
  expect(target.x + target.width).toBeLessThanOrEqual(viewport!.width + 0.5)
  expect(target.y + target.height).toBeLessThanOrEqual(viewport!.height + 0.5)

  const blockedSamples = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const centerX = rect.x + rect.width / 2
    const centerY = rect.y + rect.height / 2
    const cityId = element.getAttribute("data-city")
    return [-21.5, 0, 21.5].flatMap((offsetX) => [-21.5, 0, 21.5].flatMap((offsetY) => {
      const hit = document.elementFromPoint(centerX + offsetX, centerY + offsetY)
      const hitCity = hit?.closest("[data-city]")?.getAttribute("data-city")
      return hitCity === cityId ? [] : [{ x: centerX + offsetX, y: centerY + offsetY, hit: hit?.tagName ?? null, hitCity }]
    }))
  })
  expect(blockedSamples, "the central 44×44 CSS-pixel target must receive pointer hits").toEqual([])
}

async function expectNoSeriousAxe(page: Page, scope: Locator) {
  const selector = await scope.evaluate((element) => {
    if (!element.id) element.id = "sleek-r5-landscape-nation"
    return `#${CSS.escape(element.id)}`
  })
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

async function expectLandscapeNation(page: Page, locale: BLocale) {
  await seedB(page, { locale })
  for (const viewport of LANDSCAPE_VIEWPORTS) {
    await test.step(`${viewport.width}x${viewport.height}`, async () => {
      await page.setViewportSize(viewport)
      await gotoB(page)
      await expect(page.locator("[data-active-tab='ondo']")).not.toHaveAttribute("inert", "")

      const nation = page.getByTestId("ondo-b-nation")
      const nav = page.getByTestId("ondo-main-nav")
      const seoul = nation.locator("[data-city='seoul']")
      const busan = nation.locator("[data-city='busan']")
      await expectNoIntersection(seoul, busan)
      await expectNoIntersection(seoul, nav)
      await expectNoIntersection(busan, nav)
      await expectUnobscured44pxTarget(page, seoul)
      await expectUnobscured44pxTarget(page, busan)
      await expectNoHorizontalOverflow(page)
      await expectNoHorizontalOverflow(page, nation)
      await expectNoSeriousAxe(page, nation)

      await seoul.click()
      await expect(nation).toHaveCount(0)
      await expect(page.getByTestId("ondo-b-map-entry").getByRole("heading", { level: 1 })).toHaveText(locale === "ko" ? "서울" : "Seoul")

      await gotoB(page)
      await expect(page.locator("[data-active-tab='ondo']")).not.toHaveAttribute("inert", "")
      await nation.locator("[data-city='busan']").click()
      await expect(nation).toHaveCount(0)
      await expect(page.getByTestId("ondo-b-map-entry").getByRole("heading", { level: 1 })).toHaveText(locale === "ko" ? "부산" : "Busan")
    })
  }
}

test.describe("SLEEK R5 landscape nation navigation closure", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-chromium", "The mobile project drives the explicit landscape viewport matrix once.")
    await prepareBPage(page)
  })

  test("EN city controls remain independent, unobscured, and pointer-operable", async ({ page }) => {
    await expectLandscapeNation(page, "en")
  })

  test("KO city controls remain independent, unobscured, and pointer-operable", async ({ page }) => {
    await expectLandscapeNation(page, "ko")
  })
})
