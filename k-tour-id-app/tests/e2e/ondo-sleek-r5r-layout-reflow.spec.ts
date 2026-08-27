import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  expectNoHorizontalOverflow,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const REFLOW_VIEWPORTS = [
  { width: 320, height: 800 },
  { width: 740, height: 360 },
  { width: 844, height: 390 },
  { width: 926, height: 428 },
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

async function expectIndependentControls(page: Page, controls: Locator[]) {
  const canvasBox = await box(page.getByTestId("ondo-canvas"))
  const entries: Array<{ locator: Locator; box: Box }> = []

  for (const control of controls) {
    await expect(control).toBeVisible()
    const controlBox = await box(control)
    expect(controlBox.width).toBeGreaterThanOrEqual(44)
    expect(controlBox.height).toBeGreaterThanOrEqual(44)
    expect(controlBox.x).toBeGreaterThanOrEqual(canvasBox.x - .5)
    expect(controlBox.y).toBeGreaterThanOrEqual(canvasBox.y - .5)
    expect(controlBox.x + controlBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width + .5)
    expect(controlBox.y + controlBox.height).toBeLessThanOrEqual(canvasBox.y + canvasBox.height + .5)
    expect(await control.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return hit === element || element.contains(hit)
    }), `pointer center must hit ${await control.getAttribute("data-testid") ?? await control.getAttribute("aria-label") ?? await control.textContent()}`).toBe(true)
    entries.push({ locator: control, box: controlBox })
  }

  for (let first = 0; first < entries.length; first += 1) {
    for (let second = first + 1; second < entries.length; second += 1) {
      expect(
        intersectionArea(entries[first].box, entries[second].box),
        `${await entries[first].locator.getAttribute("data-testid") ?? await entries[first].locator.textContent()} intersects ${await entries[second].locator.getAttribute("data-testid") ?? await entries[second].locator.textContent()}`,
      ).toBeLessThanOrEqual(.5)
    }
  }
}

async function cityControls(page: Page, view: "map" | "list") {
  const rail = page.getByTestId("ondo-b-category-rail")
  const nav = page.getByTestId("ondo-main-nav")
  const navButtons = await nav.getByRole("button").all()
  const controls = [
    page.getByTestId("ondo-b-search"),
    rail.getByRole("button").nth(0),
    rail.getByRole("button").nth(1),
    rail.getByRole("button").nth(2),
    page.getByTestId("ondo-b-view-toggle"),
    ...navButtons,
  ]

  if (view === "map") {
    const mapControls = page.locator(".maplibregl-ctrl-group button")
    await expect(mapControls).toHaveCount(2)
    await expect(mapControls.nth(0)).toBeHidden()
    await expect(mapControls.nth(1)).toBeHidden()
    controls.push(
      page.getByTestId("ondo-b-locate"),
      page.getByTestId("ondo-b-attribution").locator("summary"),
    )
  } else {
    controls.push(page.getByTestId("ondo-b-venue-list").getByRole("button").first())
  }

  return controls
}

async function expectNoMapChromeCollision(page: Page, controls: Locator[]) {
  const key = page.getByTestId("ondo-b-map-key")
  const keyBox = await box(key)
  for (const control of controls) {
    expect(intersectionArea(keyBox, await box(control))).toBeLessThanOrEqual(.5)
  }
}

test.describe("SLEEK-R5 retry compact layout and reflow closure", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "One actual-Chromium project owns the explicit viewport matrix.")
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop-chromium") await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} uses the responsive desktop canvas and centered bottom navigation`, async ({ page }) => {
      await seedB(page, { locale, local: { autoNight: false } })
      for (const viewport of [{ width: 801, height: 1000, canvasWidth: 769 }, { width: 1440, height: 1000, canvasWidth: 1180 }]) {
        await page.setViewportSize(viewport)
        await gotoB(page, "?city=seoul&view=map")
        const canvasBox = await box(page.getByTestId("ondo-canvas"))
        const navBox = await box(page.getByTestId("ondo-main-nav"))
        const navButtons = await Promise.all(Array.from({ length: 4 }, (_, index) => box(page.getByTestId("ondo-main-nav").getByRole("button").nth(index))))
        expect(Math.round(canvasBox.width)).toBe(viewport.canvasWidth)
        expect(canvasBox.width / viewport.width).toBeGreaterThanOrEqual(.8)
        expect(navBox.width).toBeGreaterThan(navBox.height)
        expect(navBox.width).toBeLessThanOrEqual(700.5)
        expect(Math.abs((navBox.x + navBox.width / 2) - (canvasBox.x + canvasBox.width / 2))).toBeLessThanOrEqual(1)
        expect(Math.abs(canvasBox.y + canvasBox.height - navBox.y - navBox.height - 10)).toBeLessThanOrEqual(1)
        expect(new Set(navButtons.map(({ y }) => Math.round(y))).size).toBe(1)
        expect(navButtons.map(({ x }) => x)).toEqual([...navButtons.map(({ x }) => x)].sort((a, b) => a - b))
        await expectNoHorizontalOverflow(page)
      }
    })

    test(`${locale.toUpperCase()} caps onboarding and document sheets at 768px`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.addInitScript(() => {
        if (sessionStorage.getItem("ondo.qa.r5r-fresh-onboarding") === "1") return
        localStorage.removeItem("ondo.preferences.v3")
        sessionStorage.clear()
        sessionStorage.setItem("ondo.qa.r5r-fresh-onboarding", "1")
      })
      await gotoB(page)
      if (locale === "ko") await page.getByRole("button", { name: "KO", exact: true }).click()

      const canvasBox = await box(page.getByTestId("ondo-canvas"))
      const onboardingBox = await box(page.getByTestId("ondo-onboarding"))
      expect(onboardingBox.width).toBeLessThanOrEqual(430.5)
      expect(Math.abs((onboardingBox.x + onboardingBox.width / 2) - (canvasBox.x + canvasBox.width / 2))).toBeLessThanOrEqual(1)
      await page.getByRole("button", { name: locale === "ko" ? "설정 없이 탐색" : "Explore without setup" }).click()

      await gotoB(page, "?city=seoul&view=list")
      await page.getByTestId("ondo-b-venue-list").getByRole("button").first().click()
      await page.getByTestId("canonical-place-details").click()
      const canonicalDocument = page.getByTestId("canonical-place-overlay").locator(":scope > article")
      expect((await box(canonicalDocument)).width).toBeLessThanOrEqual(700.5)

      await page.getByTestId("canonical-place-overlay").getByRole("button", { name: locale === "ko" ? "장소 닫기" : "Close place" }).click()
      await page.getByTestId("nav-id").click()
      await page.getByTestId("open-labs-id").click()
      expect((await box(page.getByTestId("ondo-sheet"))).width).toBeLessThanOrEqual(700.5)
      await expectNoHorizontalOverflow(page)
    })

    test(`${locale.toUpperCase()} map and list controls reflow without collisions`, async ({ page }) => {
      await seedB(page, { locale, local: { autoNight: false } })
      for (const viewport of REFLOW_VIEWPORTS) {
        await page.setViewportSize(viewport)
        await gotoB(page, "?city=seoul&view=map")
        await expect(page.getByTestId("ondo-b-map-key")).toBeVisible()
        const mapControls = await cityControls(page, "map")
        await expectIndependentControls(page, mapControls)
        await expectNoMapChromeCollision(page, mapControls)
        await expectNoHorizontalOverflow(page)

        await gotoB(page, "?city=seoul&view=list")
        await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
        await expectIndependentControls(page, await cityControls(page, "list"))
        await expectNoHorizontalOverflow(page)

        const axe = await new AxeBuilder({ page })
          .include("[data-testid='ondo-b-map-entry']")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
        expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
      }
    })
  }

  test("primary CTA exposes idle, hover, pressed, focus, disabled, and reduced-motion states", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      localStorage.removeItem("ondo.preferences.v3")
      sessionStorage.removeItem("ondo.session.v3")
    })
    await gotoB(page)
    const primary = page.getByRole("button", { name: "Set guest preferences" })

    const idle = await primary.evaluate((element) => ({ filter: getComputedStyle(element).filter, transform: getComputedStyle(element).transform }))
    await primary.hover()
    const hover = await primary.evaluate((element) => ({ filter: getComputedStyle(element).filter, transform: getComputedStyle(element).transform }))
    expect(hover).not.toEqual(idle)

    const primaryBox = await box(primary)
    await page.mouse.move(primaryBox.x + primaryBox.width / 2, primaryBox.y + primaryBox.height / 2)
    await page.mouse.down()
    const pressed = await primary.evaluate((element) => ({ filter: getComputedStyle(element).filter, transform: getComputedStyle(element).transform }))
    expect(pressed).not.toEqual(hover)
    await page.mouse.move(1, 1)
    await page.mouse.up()

    await primary.focus()
    await expect.poll(() => primary.evaluate((element) => {
      const style = getComputedStyle(element)
      return [style.outlineWidth, style.outlineStyle, style.outlineColor, style.outlineOffset]
    })).toEqual(["2px", "solid", "rgb(29, 102, 209)", "2px"])

    await primary.click()
    const disabled = page.getByRole("button", { name: "Choose meal preferences" })
    await expect(disabled).toBeDisabled()
    const disabledIdle = await disabled.evaluate((element) => ({ filter: getComputedStyle(element).filter, transform: getComputedStyle(element).transform, opacity: getComputedStyle(element).opacity }))
    await disabled.hover({ force: true })
    const disabledHover = await disabled.evaluate((element) => ({ filter: getComputedStyle(element).filter, transform: getComputedStyle(element).transform, opacity: getComputedStyle(element).opacity }))
    expect(disabledHover).toEqual(disabledIdle)
    expect(Number(disabledIdle.opacity)).toBeLessThan(1)

    await page.emulateMedia({ reducedMotion: "reduce" })
    const persona = page.getByTestId("persona-short_term")
    await persona.hover()
    const reduced = await persona.evaluate((element) => {
      const style = getComputedStyle(element)
      return { duration: style.transitionDuration, transform: style.transform, filter: style.filter }
    })
    expect(reduced.duration.split(",").every((value) => Number.parseFloat(value) === 0)).toBe(true)
    expect(reduced.transform).toBe("none")
    expect(reduced.filter).not.toBe("none")
  })

  test("variant A retains its wide desktop canvas and navigation rail", async ({ page }) => {
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto("/ondo", { waitUntil: "domcontentloaded" })
    const canvasBox = await box(page.getByTestId("ondo-canvas"))
    const navBox = await box(page.getByTestId("ondo-main-nav"))
    expect(canvasBox.width).toBeGreaterThanOrEqual(1179)
    expect(canvasBox.width).toBeLessThanOrEqual(1181)
    expect(navBox.height).toBeGreaterThan(navBox.width)
  })
})
