import { expect, test, type Locator } from "@playwright/test"
import { createBRuntimeContext, expectBRuntimeContextsClean } from "../helpers/ondo-b-runtime-context"

test.afterEach(async ({}, testInfo) => { await expectBRuntimeContextsClean(testInfo) })

async function expectAttributionContrast(attribution: Locator) {
  const result = await attribution.evaluate(footer => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const context = canvas.getContext("2d")!
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      return Array.from(context.getImageData(0, 0, 1, 1).data)
    }
    const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
      const channel = value / 255
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    const background = rgba(getComputedStyle(footer).backgroundColor)
    const summary = footer.querySelector("summary")!
    const colors = [summary, summary.querySelector("svg")!].map(node => getComputedStyle(node).color)
    return {
      backgroundAlpha: background[3],
      colors,
      // The footer is translucent over a map. Require contrast even over both
      // extreme backdrops instead of assuming an unmeasured map-pixel color.
      ratios: colors.flatMap(color => [0, 255].map(backdrop => {
        const surface = background.slice(0, 3).map(value => value * background[3] / 255 + backdrop * (1 - background[3] / 255))
        const ink = rgba(color)
        const foreground = ink.slice(0, 3).map((value, index) => value * ink[3] / 255 + surface[index] * (1 - ink[3] / 255))
        const values = [luminance(foreground), luminance(surface)]
        return (Math.max(...values) + .05) / (Math.min(...values) + .05)
      })),
    }
  })
  expect(result.backgroundAlpha, "attribution has a measurable map-backed surface").toBeGreaterThan(0)
  for (const ratio of result.ratios) {
    expect(ratio, `attribution summary and copyright icon contrast: ${result.colors.join(", ")}`).toBeGreaterThanOrEqual(4.5)
  }
}

test("public sample journey keeps temperature usable at 320/390 in both appearances and After 19", async ({ browser, baseURL }) => {
  test.setTimeout(120_000)
  const context = await createBRuntimeContext(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: "light" }, test.info())
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("onboarding-guest-skip").click()
  await page.getByTestId("nav-id").click()
  await page.getByTestId("kpass-sample-picker").click()
  await page.getByTestId("kpass-scenario-adult_visitor").click()
  await page.getByTestId("nav-ondo").click()
  await page.getByTestId("ondo-b-nation").locator("[data-city='jeju']").click()
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toHaveAttribute("data-map-state", "ready")
  for (const appearance of ["light", "dark"] as const) {
    await page.getByTestId("nav-settings").click()
    await page.getByTestId("settings-appearance-row").click()
    await page.getByTestId(`settings-appearance-${appearance}`).click()
    await page.getByRole("dialog", { name: "Appearance", exact: true }).getByRole("button", { name: "Close", exact: true }).click()
    await page.getByTestId("nav-ondo").click()
    await expect(root).toHaveAttribute("data-map-appearance", appearance)
    for (const after19 of [false, true]) {
      if (after19) {
        await page.getByTestId("global-after19-toggle").click()
        await page.getByTestId("global-after19-confirm").click()
        await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
      }
      await expect(root).toHaveAttribute("data-after19-active", String(after19))
      await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", appearance)
      const timeline = page.getByTestId("ondo-temperature-timeline")
      const pause = timeline.getByRole("button", { name: "Pause sample evening" })
      if (await pause.count()) await pause.click()
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: width === 320 ? 720 : 844 })
        await expect(timeline).toBeVisible()
        const demo = page.getByTestId("ondo-b-map-options-open")
        const timelineBox = await timeline.boundingBox()
        const demoBox = await demo.boundingBox()
        expect(timelineBox!.x).toBeGreaterThanOrEqual(0)
        expect(timelineBox!.x + timelineBox!.width).toBeLessThanOrEqual(width)
        expect(demoBox!.x + demoBox!.width).toBeLessThanOrEqual(width)
        const keyBox = await timeline.locator("..").boundingBox()
        const listBox = await page.getByTestId("ondo-b-view-toggle").boundingBox()
        expect(keyBox!.x + keyBox!.width + 4).toBeLessThanOrEqual(listBox!.x)
        expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
        if (appearance === "dark" && !after19) {
          const attribution = page.getByTestId("ondo-b-attribution")
          await expect(attribution.locator("summary")).toBeVisible()
          await expectAttributionContrast(attribution)
        }
        await page.screenshot({ path: test.info().outputPath(`jeju-${width}-${appearance}-${after19 ? "after19" : "standard"}.png`) })
        await timeline.locator("summary").click()
        const slider = timeline.getByRole("slider")
        await expect(slider).toBeVisible()
        const panelBox = await slider.locator("..").boundingBox()
        expect(panelBox!.x).toBeGreaterThanOrEqual(0)
        expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(width)
        await page.screenshot({ path: test.info().outputPath(`jeju-${width}-${appearance}-${after19 ? "after19" : "standard"}-expanded.png`) })
        await timeline.locator("summary").click()
      }
    }
    await page.getByRole("button", { name: "Turn off After 19 now", exact: true }).click()
    await expect(root).toHaveAttribute("data-after19-active", "false")
    const notice = page.getByTestId("global-after19-off-notice")
    await expect(notice).toBeVisible()
    await expect(notice).toContainText("After 19 is off for this tab and will not reopen automatically.")
    await expect(notice.getByRole("button")).toHaveCount(2)
    for (const width of [320, 390]) {
      const height = width === 320 ? 720 : 844
      await page.setViewportSize({ width, height })
      for (const target of [notice, notice.locator("span"), ...await notice.getByRole("button").all()]) {
        await expect(target).toBeVisible()
        const bounds = await target.boundingBox()
        expect(bounds!.x, "After 19 notice and its actions stay inside the left edge").toBeGreaterThanOrEqual(0)
        expect(bounds!.y).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width, "After 19 notice and its actions stay inside the right edge").toBeLessThanOrEqual(width)
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height)
      }
      expect(await notice.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
      await page.screenshot({ path: test.info().outputPath(`jeju-${width}-${appearance}-after19-off-notice.png`) })
    }
  }
  expect(errors).toEqual([])
  await context.close()
})
