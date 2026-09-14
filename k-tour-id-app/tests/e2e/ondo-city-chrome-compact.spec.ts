import { expect, test, type Locator } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

const scenarios = [
  { width: 320, locale: "ko", appearance: "dark", city: "jeju" },
  { width: 390, locale: "en", appearance: "light", city: "busan" },
  { width: 430, locale: "ja", appearance: "dark", city: "seoul" },
] as const
const NEXT_LOCALE = { en: "ja", ja: "ko", ko: "en" } as const
const LANGUAGE_NAME = { en: "English", ko: "한국어", ja: "日本語" } as const

async function expectUsableControl(control: Locator, width: number) {
  await expect(control).toBeVisible()
  const rect = (await control.boundingBox())!
  expect(rect.width).toBeGreaterThanOrEqual(44)
  expect(rect.height).toBeGreaterThanOrEqual(44)
  expect(rect.x).toBeGreaterThanOrEqual(0)
  expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1)
  expect(await control.evaluate(element => {
    const r = element.getBoundingClientRect()
    return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
  })).toBe(true)
}

for (const scenario of scenarios) test(`phone map separates navigation, full-width search and options: ${scenario.width} ${scenario.locale} ${scenario.appearance}`, async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: scenario.width, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scenario.appearance })
  await page.addInitScript(({ locale, appearance }) => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE" })), scenario)
  // Keep actual MapLibre readiness: these checks must not pass on an error/list
  // fallback or a fixture that merely pretends the map has loaded.
  await page.goto(`/?review=1&city=${scenario.city}`, { waitUntil: "domcontentloaded" })
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 30_000 })
  await expect(root).toHaveAttribute("data-compact-chrome", "true")
  await expect(root).toHaveAttribute("data-entry-transition", "settled")
  await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", scenario.appearance)
  const header = root.getByTestId("ondo-b-city-header")
  const searchShell = root.getByTestId("ondo-b-search-shell")
  const search = root.getByTestId("ondo-b-search")
  const opener = root.getByTestId("ondo-b-map-options-open")
  const after19 = root.getByTestId("global-after19-toggle")
  const options = page.getByTestId("ondo-b-map-options")
  const optionsDialog = page.getByRole("dialog").filter({ has: options })

  await expect(page.getByTestId("global-after19-toggle")).toHaveCount(1)
  await expect(options).toHaveCount(0)
  for (const oldChrome of ["ondo-b-category-rail", "ondo-b-personalization-edit", "ondo-b-language", "ondo-b-map-perspective", "ondo-b-locate", "ondo-b-location-message", "ondo-b-after19-context"]) {
    await expect(root.getByTestId(oldChrome)).toHaveCount(0)
  }
  await expect(header.locator("h1")).toHaveCSS("font-size", "18px")
  const sampleLabel = header.locator("small[class*='compactDemo']")
  await expect(sampleLabel).toHaveCSS("font-size", "10px")
  const sampleContrast = await sampleLabel.evaluate(element => {
    const luminance = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
      .reduce((sum, value, index) => {
        const s = value / 255
        return sum + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][index]
      }, 0)
    const foreground = luminance(getComputedStyle(element).color)
    const background = luminance(getComputedStyle(element.parentElement!.parentElement!).backgroundColor)
    return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05)
  })
  expect(sampleContrast).toBeGreaterThanOrEqual(4.5)
  await expect(search).toHaveCSS("font-size", "16px")
  const geometry = await header.evaluate(element => {
    const rect = element.getBoundingClientRect()
    const title = element.querySelector("h1")!
    const titleBox = title.getBoundingClientRect()
    const input = element.querySelector("input")!
    const inputBox = input.getBoundingClientRect()
    const searchBox = input.parentElement!.getBoundingClientRect()
    const top = element.firstElementChild!.getBoundingClientRect()
    const root = element.parentElement!.getBoundingClientRect()
    return {
      headerHeight: rect.height, rootWidth: root.width,
      insetStart: rect.left - root.left, insetEnd: root.right - rect.right,
      navHeight: top.height, searchHeight: searchBox.height, searchWidth: searchBox.width,
      rowGap: searchBox.top - top.bottom, inputWidth: inputBox.width, inputHeight: inputBox.height,
      titleBottom: titleBox.bottom, searchTop: searchBox.top,
      titleOverflow: title.scrollWidth > title.clientWidth,
    }
  })
  expect(Math.abs(geometry.headerHeight - 104)).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.navHeight - 44)).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.searchHeight - 52)).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.rowGap - 8)).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.insetStart - 12)).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.insetEnd - 12)).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.searchWidth - (geometry.rootWidth - 24))).toBeLessThanOrEqual(2)
  expect(geometry.inputHeight).toBeGreaterThanOrEqual(44)
  expect(geometry.inputWidth).toBeGreaterThanOrEqual(geometry.rootWidth - 90)
  expect(geometry.titleOverflow).toBe(false)
  expect(geometry.titleBottom).toBeLessThan(geometry.searchTop)

  const controls = [root.getByTestId("ondo-b-city-back"), after19, opener]
  for (const control of controls) await expectUsableControl(control, scenario.width)
  const boxes = await Promise.all(controls.map(control => control.boundingBox()))
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i - 1]!.x + boxes[i - 1]!.width + 2).toBeLessThanOrEqual(boxes[i]!.x)
    expect(Math.abs(boxes[i]!.y - boxes[0]!.y)).toBeLessThanOrEqual(1)
  }
  const titleBox = (await header.locator("h1").boundingBox())!
  expect(titleBox.x).toBeGreaterThanOrEqual(boxes[0]!.x + boxes[0]!.width)
  expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(boxes[1]!.x)
  const after19Label = after19.locator(":scope > span")
  await expect(after19Label).toHaveText("19+")
  await expect(after19Label).toHaveCSS("clip-path", "none")
  await page.screenshot({ path: testInfo.outputPath(`${scenario.city}-${scenario.width}-phone-chrome.png`) })

  const allResults = Number(await root.getAttribute("data-result-count"))
  expect(allResults).toBeGreaterThan(0)
  await search.fill("no-match-compact-chrome")
  await expect(root).toHaveAttribute("data-result-count", "0")
  await expectUsableControl(searchShell.getByRole("button"), scenario.width)
  await searchShell.getByRole("button").click()
  await expect(search).toHaveValue("")
  await expect(root).toHaveAttribute("data-result-count", String(allResults))

  await opener.click()
  await expect(optionsDialog).toBeVisible()
  await expect(opener).toHaveAttribute("aria-expanded", "true")
  await expect(options).toHaveAttribute("data-category-locked", "false")
  // The options sheet must not duplicate or own a second After 19 gate.
  await expect(page.getByTestId("global-after19-toggle")).toHaveCount(1)
  await expect(options.getByTestId("global-after19-toggle")).toHaveCount(0)
  const categories = options.getByTestId("ondo-b-map-options-categories")
  const selected = categories.getByRole("button").last()
  const selectedId = (await selected.getAttribute("data-category"))!
  expect(selectedId).not.toBe("all")
  await selected.click()
  await expect(selected).toHaveAttribute("aria-pressed", "true")
  await expect.poll(async () => Number(await root.getAttribute("data-result-count"))).toBeLessThan(allResults)
  const filteredResults = Number(await root.getAttribute("data-result-count"))
  const done = page.getByTestId("ondo-b-map-options-done")
  expect(Number((await done.locator("small").innerText()).replace(/[^\d]/g, ""))).toBe(filteredResults)
  await done.click()
  await expect(options).toHaveCount(0)
  await expect(opener).toBeFocused()
  await expect(root).toHaveAttribute("data-result-count", String(filteredResults))

  await opener.click()
  await expect(categories.locator(`[data-category="${selectedId}"]`)).toHaveAttribute("aria-pressed", "true")
  const privacy = options.getByTestId("ondo-b-map-options-location-privacy")
  await privacy.locator("summary").click()
  await expect(privacy).toHaveJSProperty("open", true)
  await expect(privacy.locator("p")).toBeVisible()
  expect((await privacy.locator("p").innerText()).trim().length).toBeGreaterThan(10)
  await privacy.locator("summary").click()
  await expect(privacy).toHaveJSProperty("open", false)
  await expect(options.getByTestId("ondo-b-map-options-locate")).toBeVisible()

  const perspective = options.getByTestId("ondo-b-map-options-perspective")
  await expect(perspective).toBeVisible()
  const wasTilted = await perspective.getAttribute("aria-pressed") === "true"
  await perspective.click()
  await expect(perspective).toHaveAttribute("aria-pressed", String(!wasTilted))
  await expect(root).toHaveAttribute("data-map-perspective", wasTilted ? "flat" : "tilted")
  await perspective.click()
  await expect(perspective).toHaveAttribute("aria-pressed", String(wasTilted))
  await expect(root).toHaveAttribute("data-map-perspective", wasTilted ? "tilted" : "flat")

  let expectedLocale: "en" | "ko" | "ja" = scenario.locale
  for (let i = 0; i < 3; i++) {
    expectedLocale = NEXT_LOCALE[expectedLocale]
    await options.getByTestId("ondo-b-map-options-language").click()
    await expect(page.locator("html")).toHaveAttribute("lang", expectedLocale)
    await expect(options.getByTestId("ondo-b-map-options-language")).toContainText(LANGUAGE_NAME[expectedLocale])
    await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", scenario.appearance)
    await expect(categories.locator(`[data-category="${selectedId}"]`)).toHaveAttribute("aria-pressed", "true")
    await expect(root).toHaveAttribute("data-result-count", String(filteredResults))
  }
  await categories.locator('[data-category="all"]').click()
  await expect(root).toHaveAttribute("data-result-count", String(allResults))
  await page.keyboard.press("Escape")
  await expect(options).toHaveCount(0)
  await expect(opener).toBeFocused()

  if (scenario.city !== "busan") {
    const stories = root.getByTestId("ondo-b-japan-first-discovery")
    for (const closeWith of ["button", "escape"] as const) {
      await opener.click()
      await options.getByTestId("ondo-b-map-options-stories").click()
      await expect(options).toHaveCount(0)
      await expect(stories).toHaveJSProperty("open", true)
      await expect(stories.getByTestId("ondo-b-editorial-guide-grid")).toBeVisible()
      const closeStories = stories.locator("[data-story-close]")
      await expect(closeStories).toBeFocused()
      // The departing SheetB used to restore its opener at 80ms, stealing
      // focus after Stories had correctly focused Close on its first frame.
      await page.waitForTimeout(220)
      await expect(closeStories).toBeFocused()
      const rootBox = (await root.boundingBox())!
      const storiesBox = (await stories.boundingBox())!
      expect(storiesBox.y).toBeGreaterThanOrEqual(rootBox.y)
      expect(storiesBox.y).toBeLessThanOrEqual(rootBox.y + 110)
      expect(storiesBox.y + storiesBox.height).toBeLessThanOrEqual(rootBox.y + rootBox.height + 1)
      expect(storiesBox.height).toBeGreaterThan(rootBox.height * .55)
      expect(storiesBox.width).toBeGreaterThanOrEqual(rootBox.width - 28)
      await expectUsableControl(closeStories, scenario.width)

      const moreStories = stories.getByTestId("ondo-b-japan-more-stories")
      if (await moreStories.count() && !await moreStories.evaluate(element => (element as HTMLDetailsElement).open)) {
        await moreStories.locator(":scope > summary").click()
        await expect(moreStories).toHaveJSProperty("open", true)
      }
      const finalCard = stories.locator("article").last()
      await expect(finalCard).toBeVisible()
      const finalControl = finalCard.locator(":scope > nav > a, :scope > details > summary, :scope > button").last()
      await finalControl.scrollIntoViewIfNeeded()
      await expect(finalControl).toBeVisible()
      const finalBox = (await finalControl.boundingBox())!
      const visiblePanel = (await stories.boundingBox())!
      expect(finalBox.y).toBeGreaterThanOrEqual(visiblePanel.y)
      expect(finalBox.y + finalBox.height).toBeLessThanOrEqual(visiblePanel.y + visiblePanel.height + 1)
      await expectUsableControl(finalControl, scenario.width)
      expect(await stories.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`${scenario.city}-${scenario.width}-stories-end-${closeWith}.png`) })

      if (closeWith === "button") await closeStories.click()
      else await page.keyboard.press("Escape")
      await expect(stories).toHaveJSProperty("open", false)
      await expect(opener).toBeFocused()
    }
    // Switching the visible header back to Options must transfer close
    // ownership rather than leave two document Escape listeners active.
    await opener.click()
    await options.getByTestId("ondo-b-map-options-stories").click()
    await expect(stories).toHaveJSProperty("open", true)
    await opener.click()
    await expect(stories).toHaveJSProperty("open", false)
    await expect(options).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(options).toHaveCount(0)
    await expect(opener).toBeFocused()
  } else {
    await opener.click()
    await options.getByTestId("ondo-b-map-options-demo").click()
    await expect(options).toHaveCount(0)
    const sample = page.getByRole("dialog", { name: "Sample", exact: true })
    await expect(sample).toBeVisible()
    await expect(sample).toContainText("No real verification or charges occur.")
    await page.keyboard.press("Escape")
    await expect(sample).toHaveCount(0)
    await opener.click()
    await options.getByTestId("ondo-b-map-options-preferences").click()
    await expect(options).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
    await page.getByTestId("nav-ondo").click()
    await expect(root).toHaveAttribute("data-city", scenario.city)
    await expect(root).toHaveAttribute("data-result-count", String(allResults))
  }
  expect(await page.locator("html").evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath(`${scenario.city}-${scenario.width}-options-return.png`) })
})
