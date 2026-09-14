import { expect, test } from "@playwright/test"
import { createBRuntimeContext, expectBRuntimeContextsClean, seedBContextDevicePreferences } from "../helpers/ondo-b-runtime-context"

test.afterEach(async ({}, testInfo) => { await expectBRuntimeContextsClean(testInfo) })

for (const width of [390, 1280]) {
  test(`sample temperature stays geographic and usable at ${width}px`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000)
    const context = await createBRuntimeContext(browser, { viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "no-preference" }, test.info())
    await seedBContextDevicePreferences(context, baseURL, { locale: "en", onboarding: "ONB-COMPLETE", persona: "short_trip" })
    const errors: string[] = []
    for (const city of ["seoul", "busan", "jeju"] as const) {
      const page = await context.newPage()
      page.on("pageerror", (error) => errors.push(error.message))
      await page.goto(`${baseURL}/?city=${city}`, { waitUntil: "domcontentloaded" })
      const map = page.getByTestId("maplibre-map")
      await expect(map).toHaveAttribute("data-map-state", "ready", { timeout: 15_000 })
      const timeline = page.getByTestId("ondo-temperature-timeline")
      await expect(timeline).toBeVisible()
      // Phone chrome exposes Demo through Options; the desktop retains its
      // dedicated header control. Both public entry controls must be usable.
      const demo = page.getByTestId(width === 390 ? "ondo-b-map-options-open" : "review-sample-indicator")
      await expect(demo).toBeVisible()
      expect(await demo.evaluate((button) => !!button.closest("header"))).toBe(true)
      expect((await demo.boundingBox())?.height).toBeGreaterThanOrEqual(44)
      await expect(timeline).toHaveAttribute("data-origin", "PREPARED_ILLUSTRATION")
      const trace = await timeline.locator("summary > span[aria-hidden='true']").boundingBox()
      const time = await timeline.locator("time").boundingBox()
      expect(trace!.height).toBeLessThanOrEqual(2)
      expect(trace!.y).toBeGreaterThanOrEqual(time!.y + time!.height)
      await expect(timeline).toHaveAttribute("data-running", "true")
      await expect(timeline).toHaveAttribute("data-sample-dissolve", "native")
      await expect(timeline).toHaveAttribute("data-sample-dissolve-duration", "900")
      const firstWeights = await timeline.getAttribute("data-sample-weight-signature")
      await expect.poll(() => timeline.getAttribute("data-sample-weight-signature")).not.toBe(firstWeights)
      await timeline.getByRole("button", { name: "Pause sample evening" }).click()
      await expect(timeline).toHaveAttribute("data-running", "false")
      await expect(timeline).toHaveAttribute("data-sample-dissolve", "still")
      await expect(timeline).toHaveAttribute("data-sample-dissolve-duration", "0")
      const paused = await timeline.getAttribute("data-minute")
      await page.waitForTimeout(1200)
      await expect(timeline).toHaveAttribute("data-minute", paused!)
      for (const control of [timeline.locator("summary"), timeline.locator("button")]) {
        const box = await control.boundingBox()
        expect(box?.height).toBeGreaterThanOrEqual(44)
        expect(box?.x).toBeGreaterThanOrEqual(0)
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width)
      }
      if (city === "jeju") await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-editorial-temperature-score", "none")
      expect(await page.locator("html").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
      await page.screenshot({ path: test.info().outputPath(`${city}-${width}.png`) })
      await timeline.locator("summary").click()
      const slider = timeline.getByRole("slider")
      await expect(slider).toBeVisible()
      await slider.focus()
      await slider.press("Home")
      await slider.press("ArrowRight")
      await expect(timeline).toHaveAttribute("data-minute", "1030")
      await expect(timeline).toHaveAttribute("data-running", "false")
      const focusGeometry = await slider.evaluate(node => {
        const style = getComputedStyle(node)
        const outlineWidth = parseFloat(style.outlineWidth)
        const outlineOffset = parseFloat(style.outlineOffset)
        return {
          focusVisible: node.matches(":focus-visible"),
          outlineWidth,
          outlineBottom: node.getBoundingClientRect().bottom + Math.max(0, outlineWidth + outlineOffset),
          ticksTop: node.nextElementSibling!.getBoundingClientRect().top,
        }
      })
      expect(focusGeometry.focusVisible).toBe(true)
      expect(focusGeometry.outlineWidth).toBeGreaterThan(0)
      expect(focusGeometry.ticksTop - focusGeometry.outlineBottom, "keyboard focus must not cross the time labels").toBeGreaterThanOrEqual(1)
      await page.screenshot({ path: test.info().outputPath(`${city}-${width}-timeline.png`) })
      await page.close()
    }
    expect(errors).toEqual([])
    await context.close()
  })
}

test("reduced motion remains still, offers manual stepping, and never autoplays", async ({ browser, baseURL }) => {
  const context = await createBRuntimeContext(browser, { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" }, test.info())
  await seedBContextDevicePreferences(context, baseURL, { locale: "en", onboarding: "ONB-COMPLETE" })
  const page = await context.newPage()
  await page.goto(`${baseURL}/?city=jeju`, { waitUntil: "domcontentloaded" })
  const timeline = page.getByTestId("ondo-temperature-timeline")
  await expect(timeline).toHaveAttribute("data-reduced-motion", "true")
  await expect(timeline).toHaveAttribute("data-running", "false")
  await page.waitForTimeout(1500)
  await expect(timeline).toHaveAttribute("data-minute", "1140")
  await timeline.getByRole("button", { name: "Next sample time" }).click()
  await expect(timeline).toHaveAttribute("data-minute", "1170")
  await expect(timeline).toHaveAttribute("data-running", "false")
  await timeline.locator("summary").click()
  const slider = timeline.getByRole("slider")
  await slider.focus()
  await slider.press("End")
  await slider.press("ArrowLeft")
  await expect(timeline).toHaveAttribute("data-minute", "1370")
  await timeline.getByRole("button", { name: "Next sample time" }).click()
  await expect(timeline).toHaveAttribute("data-minute", "1380")
  await timeline.getByRole("button", { name: "Next sample time" }).click()
  await expect(timeline).toHaveAttribute("data-minute", "1020")
  await context.close()
})

test("nation entry keeps its URL and one canvas through all three city flights", async ({ browser, baseURL }) => {
  test.setTimeout(60_000)
  const context = await createBRuntimeContext(browser, { viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" }, test.info())
  await seedBContextDevicePreferences(context, baseURL, { locale: "en", onboarding: "ONB-COMPLETE" })
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" })
  const map = page.getByTestId("maplibre-map")
  await expect(map).toHaveAttribute("data-map-state", "ready")
  await expect(map).toHaveAttribute("data-map-projection-settled", "true")
  await expect(page.getByTestId("ondo-b-korea-atlas")).toHaveAttribute("data-thermal-intro", "sample")
  expect(new URL(page.url()).search).toBe("")
  const canvas = await page.locator(".maplibregl-canvas").elementHandle()
  expect(canvas).not.toBeNull()
  await page.screenshot({ path: test.info().outputPath("nation-390.png") })
  const seoulAnchor = page.getByTestId("ondo-b-nation").locator("[data-city='seoul']")
  await seoulAnchor.focus()
  expect(await seoulAnchor.evaluate(node => getComputedStyle(node).outlineWidth)).toBe("2px")
  await page.screenshot({ path: test.info().outputPath("nation-390-keyboard-focus.png") })
  for (const city of ["seoul", "busan", "jeju"]) {
    await page.getByTestId("ondo-b-nation").locator(`[data-city='${city}']`).click()
    await expect(map).toHaveAttribute("data-city-focus-target", city)
    await expect(map).toHaveAttribute("data-city-focus-duration", "340")
    await expect(page.getByTestId("ondo-temperature-timeline")).toBeVisible()
    expect(await canvas!.evaluate((element) => element.isConnected && document.querySelector(".maplibregl-canvas") === element)).toBe(true)
    await page.getByTestId("ondo-b-city-back").click()
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect(map).toHaveAttribute("data-map-projection-settled", "true")
    expect(await canvas!.evaluate((element) => element.isConnected && document.querySelector(".maplibregl-canvas") === element)).toBe(true)
    expect(new URL(page.url()).search).toBe("")
  }
  expect(errors).toEqual([])
  await context.close()
})

test("explicit provider inspection hides prepared temperature without changing the city", async ({ browser, baseURL }) => {
  const context = await createBRuntimeContext(browser, { viewport: { width: 390, height: 844 } }, test.info())
  await seedBContextDevicePreferences(context, baseURL, { locale: "en", onboarding: "ONB-COMPLETE" })
  const page = await context.newPage()
  await page.goto(`${baseURL}/?review=0&city=seoul`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-hydrated", "true")
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-sample-temperature", "false")
  await expect(page.getByTestId("ondo-temperature-timeline")).toHaveCount(0)
  await expect(page.getByTestId("review-sample-indicator")).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get("review")).toBe("0")
  expect(new URL(page.url()).searchParams.get("city")).toBe("seoul")
  await context.close()
})

for (const scenario of [
  { width: 320, city: "seoul", locale: "ko", appearance: "light", label: "지도 기울기" },
  { width: 390, city: "busan", locale: "en", appearance: "dark", label: "Tilt map" },
  { width: 430, city: "jeju", locale: "ja", appearance: "light", label: "地図の傾き" },
] as const) {
  test(`shallow perspective preserves the real canvas and returns to a flat atlas: ${scenario.city} ${scenario.width}px`, async ({ browser, baseURL }) => {
    const context = await createBRuntimeContext(browser, { viewport: { width: scenario.width, height: 844 }, colorScheme: scenario.appearance, reducedMotion: "no-preference" }, test.info())
    await seedBContextDevicePreferences(context, baseURL, { locale: scenario.locale, appearancePreference: scenario.appearance, onboarding: "ONB-COMPLETE" })
    const page = await context.newPage()
    const errors: string[] = []
    page.on("pageerror", error => errors.push(error.message))
    await page.goto(`${baseURL}/?city=${scenario.city}`, { waitUntil: "domcontentloaded" })
    const map = page.getByTestId("maplibre-map")
    await expect(map).toHaveAttribute("data-map-state", "ready")
    const canvas = await page.locator(".maplibregl-canvas").elementHandle()
    await page.getByTestId("ondo-b-map-options-open").click()
    const perspective = page.getByTestId("ondo-b-map-options-perspective")
    await expect(perspective).toHaveAttribute("aria-pressed", "true")
    await expect(map).toHaveAttribute("data-map-pitch", "28.0")
    const utility = await page.getByTestId("ondo-b-map-options").boundingBox()
    const box = await perspective.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(utility!.x).toBeGreaterThanOrEqual(0)
    expect(utility!.x + utility!.width).toBeLessThanOrEqual(scenario.width)
    await perspective.click()
    await expect(perspective).toHaveAttribute("aria-pressed", "false")
    await expect(map).toHaveAttribute("data-map-pitch", "0.0")
    await perspective.click()
    await expect(perspective).toHaveAttribute("aria-pressed", "true")
    await expect(map).toHaveAttribute("data-map-pitch", "28.0")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-perspective", "tilted")
    expect(await canvas!.evaluate(element => element.isConnected && document.querySelector(".maplibregl-canvas") === element)).toBe(true)
    expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
    await page.getByTestId("ondo-b-map-options-done").click()
    await expect(page.getByTestId("ondo-b-map-options")).toBeHidden()
    await page.screenshot({ path: test.info().outputPath(`${scenario.city}-${scenario.width}-${scenario.locale}-perspective.png`) })
    // Both directions were exercised above; return directly from the tilted
    // state instead of repeating the same round trip before the atlas check.
    await page.getByTestId("ondo-b-city-back").click()
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    await expect(map).toHaveAttribute("data-map-projection-settled", "true")
    await expect(map).toHaveAttribute("data-map-pitch", "0.0")
    expect(await canvas!.evaluate(element => element.isConnected && document.querySelector(".maplibregl-canvas") === element)).toBe(true)
    if (scenario.locale === "ko") {
      const heading = page.getByTestId("ondo-b-korea-atlas").locator("h1")
      expect(await heading.evaluate(node => getComputedStyle(node).wordBreak)).toBe("keep-all")
      const wordLines = await heading.evaluate(node => {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
        const lines: number[] = []
        while (walker.nextNode()) for (const word of ["장소를", "찾아보세요"]) {
          const text = walker.currentNode.textContent ?? ""
          const index = text.indexOf(word)
          if (index < 0) continue
          const range = document.createRange()
          range.setStart(walker.currentNode, index)
          range.setEnd(walker.currentNode, index + word.length)
          lines.push(range.getClientRects().length)
        }
        return lines
      })
      expect(wordLines).toEqual([1, 1])
      await page.screenshot({ path: test.info().outputPath("nation-320-ko.png") })
    }
    expect(errors).toEqual([])
    await context.close()
  })
}
