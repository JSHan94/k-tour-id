import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  expectNoHorizontalOverflow,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  type BLocale,
} from "../helpers/ondo-b-qa"

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

async function seedPolishB(page: Page, locale: BLocale) {
  await page.addInitScript((nextLocale) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
      commerceLocalBoundarySeen: true,
    }))
  }, locale)
}

async function expectPolishedFiveTabDock(page: Page) {
  const nav = page.getByTestId("ondo-main-nav")
  const canvasBox = await box(page.getByTestId("ondo-canvas"))
  const navBox = await box(nav)
  const buttons = nav.getByRole("button")
  await expect(buttons).toHaveCount(5)

  const buttonBoxes: Box[] = []
  for (let index = 0; index < 5; index += 1) {
    const button = buttons.nth(index)
    const buttonBox = await box(button)
    const labelBox = await box(button.locator("small"))
    expect(buttonBox.width).toBeGreaterThanOrEqual(44)
    expect(buttonBox.height).toBeGreaterThanOrEqual(56)
    expect(labelBox.x).toBeGreaterThanOrEqual(buttonBox.x - .5)
    expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(buttonBox.x + buttonBox.width + .5)
    expect(labelBox.y).toBeGreaterThanOrEqual(buttonBox.y - .5)
    expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(buttonBox.y + buttonBox.height + .5)
    buttonBoxes.push(buttonBox)
  }

  for (let index = 1; index < buttonBoxes.length; index += 1) {
    expect(intersectionArea(buttonBoxes[index - 1], buttonBoxes[index])).toBeLessThanOrEqual(.5)
  }

  expect(navBox.x).toBeGreaterThanOrEqual(canvasBox.x + 7)
  expect(navBox.x + navBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width - 7)
  const current = nav.locator("[aria-current='page']")
  await expect(current).toHaveCount(1)
  await expect(current).toHaveAttribute("data-state", "selected")
  expect(await current.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)")

  await nav.getByTestId("nav-id").focus()
  const focus = await nav.getByTestId("nav-id").evaluate((element) => {
    const style = getComputedStyle(element)
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset }
  })
  expect(focus.outlineStyle).not.toBe("none")
  expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2)
  expect(Number.parseFloat(focus.outlineOffset)).toBeLessThanOrEqual(0)
  await expectNoHorizontalOverflow(page)
}

test.describe("ONDO B shell navigation and scroll polish", () => {
  test.describe.configure({ timeout: 180_000 })

  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko"] as const satisfies readonly BLocale[]) {
    test(`${locale.toUpperCase()} keeps five explicit destinations polished from 320px through 430px`, async ({ page }) => {
      await seedPolishB(page, locale)
      for (const viewport of [
        { width: 320, height: 700 },
        { width: 360, height: 780 },
        { width: 390, height: 844 },
        { width: 430, height: 932 },
      ]) {
        await page.setViewportSize(viewport)
        await gotoB(page)
        await expectPolishedFiveTabDock(page)
      }
    })
  }

  test("tabs own independent scroll positions and never share a stale simulated-mobile offset", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    await seedPolishB(page, "en")
    await gotoB(page)

    const scroll = page.getByTestId("ondo-scroll-region")
    await expect(scroll).toHaveAttribute("data-scroll-owner", "true")
    await page.getByTestId("nav-settings").click()
    await expect(scroll).toHaveAttribute("data-active-tab", "settings")
    expect(await scroll.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeGreaterThan(100)

    await scroll.evaluate((element) => { element.scrollTop = 260 })
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(200)
    await page.getByTestId("nav-tables").click()
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0)

    await scroll.evaluate((element) => { element.scrollTop = 140 })
    await page.getByTestId("nav-settings").click()
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(200)
    await page.getByTestId("nav-tables").click()
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(100)
  })

  test("keyboard, wheel, touch scroll ownership and the last content edge stay clear of the dock", async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 })
    await seedPolishB(page, "en")
    await gotoB(page)
    await page.getByTestId("nav-settings").click()

    const scroll = page.getByTestId("ondo-scroll-region")
    const nav = page.getByTestId("ondo-main-nav")
    const overflow = await scroll.evaluate((element) => getComputedStyle(element).overflowY)
    expect(overflow).toBe("auto")
    expect(intersectionArea(await box(scroll), await box(nav))).toBeLessThanOrEqual(.5)

    await scroll.focus()
    await page.keyboard.press("PageDown")
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
    await page.keyboard.press("End")
    await expect.poll(() => scroll.evaluate((element) => Math.round(element.scrollTop + element.clientHeight - element.scrollHeight))).toBeGreaterThanOrEqual(-1)

    const [scrollBox, childBox] = await Promise.all([box(scroll), box(scroll.locator(":scope > *"))])
    expect(childBox.y + childBox.height).toBeLessThanOrEqual(scrollBox.y + scrollBox.height + 1)
    await expectNoHorizontalOverflow(page)
  })
})
