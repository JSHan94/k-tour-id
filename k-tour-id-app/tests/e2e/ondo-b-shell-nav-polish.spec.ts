import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test"
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

function channelSpread(color: string) {
  const channels = color.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/)
  if (!channels) return 0
  const values = channels.slice(1, 4).map(Number)
  return Math.max(...values) - Math.min(...values)
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

async function expectPolishedFiveTabDock(page: Page, screenshotName?: string, testInfo?: TestInfo, interactive = true) {
  const nav = page.getByTestId("ondo-main-nav")
  const canvasBox = await box(page.getByTestId("ondo-canvas"))
  const navBox = await box(nav)
  const buttons = nav.getByRole("button")
  await expect(buttons).toHaveCount(5)

  const buttonBoxes: Box[] = []
  const labelBoxes: Box[] = []
  for (let index = 0; index < 5; index += 1) {
    const button = buttons.nth(index)
    const label = button.locator("small")
    await expect(label).toBeVisible()
    const buttonBox = await box(button)
    const labelBox = await box(label)
    const labelFontSize = await label.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
    expect(buttonBox.width).toBeGreaterThanOrEqual(44)
    expect(buttonBox.height).toBeGreaterThanOrEqual(56)
    expect(labelFontSize).toBeGreaterThanOrEqual(12)
    expect(labelBox.x).toBeGreaterThanOrEqual(buttonBox.x - .5)
    expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(buttonBox.x + buttonBox.width + .5)
    expect(labelBox.y).toBeGreaterThanOrEqual(buttonBox.y - .5)
    expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(buttonBox.y + buttonBox.height + .5)
    buttonBoxes.push(buttonBox)
    labelBoxes.push(labelBox)
  }

  for (let index = 1; index < buttonBoxes.length; index += 1) {
    expect(intersectionArea(buttonBoxes[index - 1], buttonBoxes[index])).toBeLessThanOrEqual(.5)
    expect(intersectionArea(labelBoxes[index - 1], labelBoxes[index])).toBeLessThanOrEqual(.5)
  }

  expect(navBox.x).toBeGreaterThanOrEqual(canvasBox.x + 7)
  expect(navBox.x + navBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width - 7)
  const current = nav.locator("[aria-current='page']")
  await expect(current).toHaveCount(1)
  await expect(current).toHaveAttribute("data-state", "selected")
  expect(await current.evaluate((element) => {
    const style = getComputedStyle(element)
    return style.backgroundImage !== "none" || style.backgroundColor !== "rgba(0, 0, 0, 0)"
  })).toBe(true)

  if (interactive) {
    const pointerTarget = nav.getByTestId("nav-id")
    await pointerTarget.click()
    const activeVisual = await pointerTarget.evaluate((element) => {
      const style = getComputedStyle(element)
      const icon = getComputedStyle(element.querySelector("span")!)
      const indicator = getComputedStyle(element, "::after")
      return [style.color, style.borderColor, style.backgroundImage, icon.color, icon.backgroundColor, indicator.backgroundColor]
    })
    for (const value of activeVisual.flatMap((visual) => visual.match(/rgba?\([^)]*\)/g) ?? [])) {
      expect(channelSpread(value), `${value} must remain neutral, not Pulse heat red/clay`).toBeLessThanOrEqual(24)
    }
    const pointerFocus = await pointerTarget.evaluate((element) => getComputedStyle(element).outlineStyle)
    expect(pointerFocus).toBe("none")

    await page.keyboard.press("Tab")
    await expect(nav.getByTestId("nav-settings")).toBeFocused()
    const focus = await nav.getByTestId("nav-settings").evaluate((element) => {
      const style = getComputedStyle(element)
      return { outlineColor: style.outlineColor, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset }
    })
    expect(focus.outlineStyle).not.toBe("none")
    expect(focus.outlineColor).toBe("rgb(29, 102, 209)")
    expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2)
    expect(Number.parseFloat(focus.outlineOffset)).toBeLessThanOrEqual(0)
  }
  await expectNoHorizontalOverflow(page)
  if (process.env.ONDO_SHELL_SCREENSHOTS === "1" && screenshotName && testInfo) {
    await nav.screenshot({ path: testInfo.outputPath(`${screenshotName}.png`), animations: "disabled" })
  }
}

async function inflateAndScrollRegion(page: Page, top: number) {
  const scroll = page.getByTestId("ondo-scroll-region")
  await scroll.evaluate((element, nextTop) => {
    const child = element.firstElementChild as HTMLElement | null
    if (child) child.style.minHeight = `${element.clientHeight + 720}px`
    element.scrollTop = nextTop
  }, top)
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThanOrEqual(top - 1)
  return scroll
}

async function expectSiblingModalLocksShell(page: Page, modal: Locator, expectedRestore: number) {
  const scroll = page.getByTestId("ondo-scroll-region")
  const nav = page.getByTestId("ondo-main-nav")
  await expect(modal).toBeVisible()
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0)
  await expect(scroll).toHaveAttribute("inert", "")
  await expect(nav).toHaveAttribute("inert", "")
  expect(await modal.evaluate((element) => {
    let branch: Element | null = element
    let highest = 0
    while (branch) {
      const zIndex = Number(getComputedStyle(branch).zIndex)
      if (Number.isFinite(zIndex)) highest = Math.max(highest, zIndex)
      if (branch.matches("[data-testid='ondo-canvas']")) break
      branch = branch.parentElement
    }
    return highest
  })).toBeGreaterThan(
    await nav.evaluate((element) => Number(getComputedStyle(element).zIndex)),
  )
  const overflow = await scroll.evaluate((element) => getComputedStyle(element).overflowY)
  expect(overflow).toBe("hidden")
  const scrollBox = await box(scroll)
  await page.mouse.move(scrollBox.x + scrollBox.width / 2, scrollBox.y + scrollBox.height / 2)
  await page.mouse.wheel(0, 500)
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0)
  return async () => {
    await expect(modal).toBeHidden()
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThanOrEqual(expectedRestore - 1)
    await expect(scroll).not.toHaveAttribute("inert", "")
    await expect(nav).not.toHaveAttribute("inert", "")
  }
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
    test(`${locale.toUpperCase()} keeps five explicit destinations polished from 320px through 430px`, async ({ page }, testInfo) => {
      await seedPolishB(page, locale)
      for (const viewport of [
        { width: 320, height: 700 },
        { width: 360, height: 780 },
        { width: 390, height: 844 },
        { width: 430, height: 932 },
      ]) {
        await page.setViewportSize(viewport)
        await gotoB(page)
        await expectPolishedFiveTabDock(page, `${locale}-${viewport.width}-dock`, testInfo)
      }
    })
  }

  for (const locale of ["en", "ko"] as const satisfies readonly BLocale[]) {
    test(`${locale.toUpperCase()} reaches every 12px dock label by keyboard in a 200 percent layout equivalent`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 215, height: 700 })
      await seedPolishB(page, locale)
      await gotoB(page)
      const nav = page.getByTestId("ondo-main-nav")
      const buttons = nav.getByRole("button")
      await expect(buttons).toHaveCount(5)
      await buttons.first().focus()

      let furthestScroll = 0
      for (let index = 0; index < 5; index += 1) {
        const button = buttons.nth(index)
        await expect(button).toBeFocused()
        await button.press("Enter")
        await expect(button).toHaveAttribute("aria-current", "page")
        const [buttonBox, navBox] = await Promise.all([box(button), box(nav)])
        expect(buttonBox.x).toBeGreaterThanOrEqual(navBox.x - .5)
        expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(navBox.x + navBox.width + .5)
        expect(await button.locator("small").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(12)
        furthestScroll = Math.max(furthestScroll, await nav.evaluate((element) => element.scrollLeft))
        if (index < 4) await page.keyboard.press("Tab")
      }

      expect(furthestScroll).toBeGreaterThan(0)
      await expectNoHorizontalOverflow(page)
      if (process.env.ONDO_SHELL_SCREENSHOTS === "1") {
        await nav.screenshot({ path: testInfo.outputPath(`${locale}-215-keyboard-dock.png`), animations: "disabled" })
      }
    })
  }

  for (const locale of ["en", "ko"] as const satisfies readonly BLocale[]) {
    test(`${locale.toUpperCase()} keeps all visible dock labels at 200 percent zoom`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 430, height: 932 })
      await seedPolishB(page, locale)
      await gotoB(page)
      const cdp = await page.context().newCDPSession(page)
      await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 })
      await expect.poll(() => page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(2)
      await expectPolishedFiveTabDock(page, `${locale}-430-200pct-dock`, testInfo, false)
      await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 })
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

  test("a modal opened from a scrolled tab pins to the visible region and restores its parent position", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    await seedPolishB(page, "en")
    await gotoB(page)
    await page.getByTestId("nav-tables").click()

    const scroll = page.getByTestId("ondo-scroll-region")
    const opener = page.locator("[data-testid^='table-open-']").first()
    await opener.scrollIntoViewIfNeeded()
    const before = await scroll.evaluate((element) => element.scrollTop)
    expect(before).toBeGreaterThan(0)
    await opener.click()

    const detail = page.getByTestId("table-detail")
    const close = detail.locator("header").getByRole("button", { name: "Close Table" }).first()
    await expect(detail).toBeVisible()
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0)
    await expect.poll(() => detail.locator(":scope > article").evaluate((element) => element.scrollTop)).toBe(0)
    expect((await box(detail)).y).toBeGreaterThanOrEqual((await box(scroll)).y - .5)
    await expect(close).toBeInViewport()
    await close.click()
    await expect(detail).toBeHidden()
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThanOrEqual(before - 1)
  })

  test("sibling place and nested Local Signal overlays lock the Explore scroll owner until the final close", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    await seedPolishB(page, "en")
    await gotoB(page, "?city=seoul&view=list")
    const scroll = await inflateAndScrollRegion(page, 260)
    const before = await scroll.evaluate((element) => element.scrollTop)

    await page.getByTestId("ondo-b-venue-list").locator("li button").first().evaluate((element: HTMLButtonElement) => element.click())
    const peek = page.getByTestId("canonical-place-peek")
    const assertRestored = await expectSiblingModalLocksShell(page, peek, before)
    await peek.getByTestId("canonical-place-details").click()
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail).toBeVisible()
    await detail.getByTestId("canonical-local-signal-open").click()
    const localSignal = page.getByTestId("ondo-b-local-signal")
    await expect(localSignal).toBeVisible()
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0)
    await localSignal.getByRole("button", { name: "Close Local Signal" }).click()
    await expect(localSignal).toBeHidden()
    await expect(detail).toBeVisible()
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0)
    await detail.getByRole("button", { name: "Close place" }).click()
    await assertRestored()
  })

  test("reset onboarding is a sibling modal with a locked background and deliberate Explore-top return", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 })
    await seedPolishB(page, "en")
    await gotoB(page)
    await page.getByTestId("nav-settings").click()
    const scroll = page.getByTestId("ondo-scroll-region")
    const reset = page.getByTestId("ondo-b-onboarding-reset")
    await reset.scrollIntoViewIfNeeded()
    expect(await scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
    await reset.click()

    const onboarding = page.getByTestId("ondo-onboarding")
    const assertReturned = await expectSiblingModalLocksShell(page, onboarding, 0)
    await onboarding.getByRole("button", { name: "Explore as a guest" }).click()
    await assertReturned()
    await expect(scroll).toHaveAttribute("data-active-tab", "ondo")
    await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0)
  })
})
