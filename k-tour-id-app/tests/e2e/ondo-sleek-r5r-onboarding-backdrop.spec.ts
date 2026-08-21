import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  expectNoHorizontalOverflow,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedFreshOnboarding,
  type BLocale,
} from "../helpers/ondo-b-qa"

const CANONICAL_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 801, height: 1000 },
  { width: 1440, height: 1000 },
] as const

const TABLET_BOUNDARIES = [
  { width: 700, height: 900 },
  { width: 768, height: 1024 },
  { width: 800, height: 1000 },
] as const

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value as Box
}

async function expectBackdropIsolation(page: Page) {
  const canvas = page.getByTestId("ondo-canvas")
  const backdrop = page.getByTestId("ondo-onboarding-backdrop")
  const dialog = page.getByTestId("ondo-onboarding")
  const navigation = page.getByTestId("ondo-main-nav")
  const content = canvas.locator("[data-active-tab]")
  await expect(backdrop).toHaveCount(1, { timeout: 1_000 })
  const [canvasBox, backdropBox, dialogBox, navigationBox] = await Promise.all([
    box(canvas),
    box(backdrop),
    box(dialog),
    box(navigation),
  ])

  expect(Math.abs(backdropBox.x + backdropBox.width / 2 - (canvasBox.x + canvasBox.width / 2))).toBeLessThanOrEqual(.5)
  expect(Math.abs(backdropBox.y - canvasBox.y)).toBeLessThanOrEqual(.5)
  expect(Math.abs(backdropBox.height - canvasBox.height)).toBeLessThanOrEqual(.5)
  expect(canvasBox.width - backdropBox.width).toBeGreaterThanOrEqual(0)
  expect(canvasBox.width - backdropBox.width).toBeLessThanOrEqual(2.1)
  expect(dialogBox.width).toBeLessThanOrEqual(430.5)
  expect(Math.abs(dialogBox.x + dialogBox.width / 2 - (canvasBox.x + canvasBox.width / 2))).toBeLessThanOrEqual(.5)
  await expect(backdrop).toHaveCSS("background-color", "rgb(251, 250, 247)")
  await expect(navigation).toHaveAttribute("aria-hidden", "true")
  await expect(content).toHaveAttribute("aria-hidden", "true")
  expect(await navigation.evaluate((element) => element instanceof HTMLElement && element.inert)).toBe(true)
  expect(await content.evaluate((element) => element instanceof HTMLElement && element.inert)).toBe(true)

  const hitEvidence = await page.evaluate(({ canvasBox: currentCanvas, navigationBox: currentNavigation }) => {
    const backdropElement = document.querySelector<HTMLElement>("[data-testid='ondo-onboarding-backdrop']")
    const navigationElement = document.querySelector<HTMLElement>("[data-testid='ondo-main-nav']")
    const points = [
      { x: currentCanvas.x + 4, y: currentCanvas.y + currentCanvas.height / 2 },
      { x: currentCanvas.x + currentCanvas.width - 4, y: currentCanvas.y + currentCanvas.height / 2 },
      { x: currentNavigation.x + currentNavigation.width / 8, y: currentNavigation.y + currentNavigation.height / 2 },
    ]
    return points.map((point) => {
      const hit = document.elementFromPoint(point.x, point.y)
      return {
        coveredByBackdrop: Boolean(hit && backdropElement?.contains(hit)),
        exposedNavigation: Boolean(hit && navigationElement?.contains(hit)),
      }
    })
  }, { canvasBox, navigationBox })
  expect(hitEvidence.every(({ coveredByBackdrop }) => coveredByBackdrop)).toBe(true)
  expect(hitEvidence.every(({ exposedNavigation }) => !exposedNavigation)).toBe(true)

  const targets = dialog.locator("button:visible")
  for (let index = 0; index < await targets.count(); index += 1) {
    const targetBox = await box(targets.nth(index))
    expect(Math.round(targetBox.width)).toBeGreaterThanOrEqual(44)
    expect(Math.round(targetBox.height)).toBeGreaterThanOrEqual(44)
  }
  await expectNoHorizontalOverflow(page, backdrop)
}

async function openFreshOnboarding(page: Page, locale: BLocale, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport)
  await seedFreshOnboarding(page, locale)
  await gotoB(page)
  await expect(page.getByTestId("onboarding-step-value")).toBeVisible()
}

test.describe("R5R onboarding tablet backdrop isolation", () => {
  test.describe.configure({ timeout: 180_000 })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "One actual-Chromium project owns the explicit viewport matrix.")
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop-chromium") await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko"] as const) {
    for (const viewport of TABLET_BOUNDARIES) {
      test(`${locale.toUpperCase()} ${viewport.width}px isolates every onboarding step from the tablet canvas`, async ({ page }) => {
        await openFreshOnboarding(page, locale, viewport)
        await expectBackdropIsolation(page)

        await page.getByRole("button", { name: locale === "ko" ? "시작하기" : "Get started", exact: true }).click()
        await expect(page.getByTestId("onboarding-step-intent")).toBeVisible()
        await expectBackdropIsolation(page)

        await page.getByTestId("persona-short_term").click()
        await page.getByRole("button", { name: locale === "ko" ? "한 끼 취향 고르기" : "Choose meal preferences", exact: true }).click()
        await expect(page.getByTestId("onboarding-step-preferences")).toBeVisible()
        await expectBackdropIsolation(page)

        const axe = await new AxeBuilder({ page })
          .include("[data-testid='ondo-onboarding-backdrop']")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
        expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
      })
    }

    test(`${locale.toUpperCase()} preserves the intended onboarding surface at all six canonical viewports`, async ({ page }) => {
      for (const viewport of CANONICAL_VIEWPORTS) {
        await openFreshOnboarding(page, locale, viewport)
        await expectBackdropIsolation(page)
      }
    })
  }

  test("focus remains trapped after Escape and reduced motion removes persona transitions", async ({ page }) => {
    await openFreshOnboarding(page, "en", { width: 768, height: 1024 })
    const dialog = page.getByTestId("ondo-onboarding")
    const exit = dialog.getByRole("button", { name: "Explore as a guest", exact: true })
    await expect(dialog.getByRole("button", { name: "Get started", exact: true })).toBeFocused()
    await exit.focus()
    await page.keyboard.press("Tab")
    await expect(dialog.getByRole("button", { name: "KO", exact: true })).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)

    await dialog.getByRole("button", { name: "Get started", exact: true }).click()
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect(page.getByTestId("persona-short_term")).toHaveCSS("transition-duration", "0s")
  })
})
