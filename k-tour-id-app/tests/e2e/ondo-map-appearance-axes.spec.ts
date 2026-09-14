import { expect, test, type Locator } from "@playwright/test"

async function colors(element: Locator) {
  return element.evaluate(node => {
    const style = getComputedStyle(node)
    function luminance(color: string) {
      const numbers = color.match(/[\d.]+/g)!.map(Number)
      const rgb = numbers.slice(0, 3).map(value => color.startsWith("color(") ? value : value / 255)
        .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
      return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
    }
    const background = luminance(style.backgroundColor)
    const foreground = luminance(style.color)
    return { background, foreground, contrast: (Math.max(background, foreground) + .05) / (Math.min(background, foreground) + .05), backgroundImage: style.backgroundImage }
  })
}

for (const appearance of ["light", "dark"] as const) {
  test(`public ${appearance} × standard/After19 keeps every control on the selected appearance`, async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    const errors: string[] = []
    page.on("pageerror", error => errors.push(error.message))
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("onboarding-guest-skip").click()
    await page.getByTestId("nav-settings").click()
    await page.getByTestId("settings-appearance-row").click()
    await page.getByTestId(`settings-appearance-${appearance}`).click()
    await page.getByRole("dialog", { name: "Appearance", exact: true }).getByRole("button", { name: "Close", exact: true }).click()
    await page.getByTestId("nav-id").click()
    await page.getByTestId("kpass-sample-picker").click()
    await page.getByTestId("kpass-scenario-adult_visitor").click()
    await page.getByTestId("nav-ondo").click()
    await page.getByTestId("ondo-b-nation").locator("[data-city='busan']").click()
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    for (const after19 of [false, true]) {
      if (after19) {
        await page.getByTestId("global-after19-toggle").click()
        await page.getByTestId("global-after19-confirm").click()
        await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
      }
      await expect(root).toHaveAttribute("data-after19-active", String(after19))
      await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", appearance)
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: width === 320 ? 740 : 844 })
        for (const control of [
          page.getByTestId("ondo-b-search-shell"), page.getByTestId("ondo-b-city-header").locator(":scope > div").first(),
          page.getByTestId("ondo-b-map-key"), page.getByTestId("ondo-b-attribution"), page.getByTestId("ondo-main-nav"),
        ]) {
          await expect(control).toBeVisible()
          const tone = await colors(control)
          if (appearance === "light") expect(tone.background).toBeGreaterThan(.8)
          else expect(tone.background).toBeLessThan(.08)
          expect(tone.backgroundImage).toBe("none")
        }
        const key = await page.getByTestId("ondo-b-map-key").boundingBox()
        const list = await page.getByTestId("ondo-b-view-toggle").boundingBox()
        expect(key!.x + key!.width + 4).toBeLessThanOrEqual(list!.x)
        const listColors = await page.getByTestId("ondo-b-view-toggle").evaluate(node => ({
          button: getComputedStyle(node).color,
          icon: getComputedStyle(node.querySelector("svg")!).color,
        }))
        expect(listColors.icon).toBe(listColors.button)
        expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
        await expect(root).toHaveAttribute("data-compact-chrome", "true")
        await expect(page.getByTestId("ondo-b-category-rail")).toHaveCount(0)
        await expect(page.getByTestId("ondo-b-after19-context")).toHaveCount(0)
        if (after19) {
          const toggle = page.getByTestId("global-after19-banner").locator(":scope > button")
          expect((await colors(toggle)).contrast).toBeGreaterThanOrEqual(4.5)
          expect(await toggle.evaluate(node => getComputedStyle(node, "::after").content)).toBe("none")
        }
        const opener = page.getByTestId("ondo-b-map-options-open")
        await opener.click()
        const options = page.getByTestId("ondo-b-map-options")
        await expect(options).toHaveAttribute("data-category-locked", String(after19))
        const optionsDialog = page.getByRole("dialog").filter({ has: options })
        const sheetTone = await colors(optionsDialog)
        if (appearance === "light") expect(sheetTone.background).toBeGreaterThan(.8)
        else expect(sheetTone.background).toBeLessThan(.08)
        await expect(options.getByTestId("global-after19-toggle")).toHaveCount(0)
        await expect(options.getByTestId("global-after19-banner")).toHaveCount(0)
        if (after19) {
          await expect(options.getByTestId("ondo-b-map-options-categories")).toHaveCount(0)
          await expect(options.getByTestId("ondo-b-map-options-after19")).toBeVisible()
          await expect(options.getByTestId("ondo-b-map-options-after19")).toContainText("After 19")
        } else {
          await expect(options.getByTestId("ondo-b-map-options-categories")).toBeVisible()
          await expect(options.getByTestId("ondo-b-map-options-after19")).toHaveCount(0)
        }
        await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", appearance)
        await page.getByTestId("ondo-b-map-options-done").click()
        await expect(options).toHaveCount(0)
        await expect(opener).toBeFocused()
        await page.screenshot({ path: testInfo.outputPath(`busan-${width}-${appearance}-${after19 ? "after19" : "standard"}.png`) })
      }
    }
    expect(errors).toEqual([])
  })
}
