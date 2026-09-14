import { expect, test, type Page } from "@playwright/test"
import { expectNoSetupPlacePreview, openOptionalMapSetup } from "../helpers/ondo-optional-setup"

const CASES = [
  { width: 320, height: 568, locale: "en", appearance: "light" },
  { width: 390, height: 844, locale: "ko", appearance: "dark" },
  { width: 405, height: 761, locale: "en", appearance: "light" },
  { width: 430, height: 932, locale: "ja", appearance: "dark" },
  { width: 844, height: 390, locale: "en", appearance: "light" },
] as const

async function expectActualBackdropGeometry(page: Page, portrait: boolean) {
  const root = page.getByTestId("ondo-onboarding-backdrop")
  const layer = root.locator(':scope > [data-sheet-layer="true"]')
  const backdrop = layer.locator(':scope > button[aria-hidden="true"]')
  const sheet = layer.locator(':scope > section[data-sheet-variant="decision"]')
  await expect(sheet).toBeVisible()
  // The wrapper stayed full-height during the regression. Measure the actual
  // painted scrim and layout owner, not just its misleadingly named wrapper.
  await expect.poll(async () => {
    const [rootBox, layerBox, maskBox] = await Promise.all([
      root.boundingBox(), layer.boundingBox(), backdrop.boundingBox(),
    ])
    if (!rootBox || !layerBox || !maskBox) return Infinity
    return Math.max(
      Math.abs(rootBox.y - layerBox.y),
      Math.abs(rootBox.height - layerBox.height),
      Math.abs(layerBox.y - maskBox.y),
      Math.abs(layerBox.height - maskBox.height),
      Math.abs(layerBox.width - maskBox.width),
    )
  }).toBeLessThanOrEqual(1)
  await expect(layer).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
  await expect(layer).toHaveCSS("max-height", "none")
  await expect(backdrop).toHaveCSS("background-color", "rgba(16, 16, 16, 0.2)")

  const [layerBox, sheetBox] = await Promise.all([layer.boundingBox(), sheet.boundingBox()])
  expect(layerBox).not.toBeNull()
  expect(sheetBox).not.toBeNull()
  if (portrait) {
    const bottomPadding = await layer.evaluate(node => parseFloat(getComputedStyle(node).paddingBottom))
    expect(Math.abs(layerBox!.y + layerBox!.height - bottomPadding - sheetBox!.y - sheetBox!.height)).toBeLessThanOrEqual(1)
  } else {
    // The existing short-landscape shell is a right-hand task panel. It must
    // retain usable height instead of inheriting the portrait 56dvh cap.
    expect(sheetBox!.height).toBeGreaterThan(page.viewportSize()!.height * .8)
    expect(sheetBox!.x + sheetBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
  }
  expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  expect(await sheet.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  for (const control of [page.getByTestId("onboarding-continue"), page.getByTestId("onboarding-guest-skip")]) {
    if (!await control.count()) continue
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1)
  }
}

for (const scenario of CASES) {
  test(`explicit optional setup paints one complete scrim: ${scenario.width}x${scenario.height} ${scenario.locale} ${scenario.appearance}`, async ({ browser, baseURL }, testInfo) => {
    test.setTimeout(60_000)
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
      colorScheme: scenario.appearance,
      reducedMotion: "reduce",
      isMobile: true,
      hasTouch: true,
    })
    if (scenario.locale !== "en" || scenario.appearance !== "light") {
      await context.addInitScript(({ locale, appearance }) => {
        // Preference only: no onboarding completion, provider or QA state.
        localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance }))
      }, scenario)
    }
    const page = await context.newPage()
    const errors: string[] = []
    page.on("pageerror", error => errors.push(error.message))
    try {
      await page.goto(baseURL ?? "http://127.0.0.1:3112", { waitUntil: "domcontentloaded" })
      await openOptionalMapSetup(page)
      await expect(page.getByTestId("onboarding-step-intent")).toBeVisible()
      await expect(page.locator("html")).toHaveAttribute("lang", scenario.locale)
      await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", scenario.appearance)
      await expectActualBackdropGeometry(page, scenario.width < 700)
      await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
      if (scenario.width >= 700) {
        const labels = await page.getByTestId("onboarding-step-intent").getByRole("radio").locator("span").evaluateAll(nodes => nodes.map(node => {
          const range = document.createRange()
          range.selectNodeContents(node)
          return [...range.getClientRects()].length
        }))
        expect(labels).toEqual([1, 1, 1])
      }
      await page.screenshot({ path: testInfo.outputPath("intent.png") })

      await page.getByTestId("persona-short_trip").click()
      await page.getByTestId("onboarding-continue").click()
      await expect(page.getByTestId("onboarding-step-area")).toBeVisible()
      await expectActualBackdropGeometry(page, scenario.width < 700)
      await page.screenshot({ path: testInfo.outputPath("area.png") })

      await page.getByTestId("onboarding-area-busan").click()
      await page.getByTestId("onboarding-continue").click()
      await expect(page.getByTestId("onboarding-step-preferences")).toBeVisible()
      await expectNoSetupPlacePreview(page)
      await expectActualBackdropGeometry(page, scenario.width < 700)
      const finish = await page.getByTestId("onboarding-finish").boundingBox()
      expect(finish!.height).toBeGreaterThanOrEqual(44)
      expect(finish!.y + finish!.height).toBeLessThanOrEqual(scenario.height + 1)
      await page.screenshot({ path: testInfo.outputPath("preferences.png") })
      await page.getByTestId("onboarding-guest-skip").click()
      await expect(page.getByTestId("ondo-onboarding-backdrop")).toHaveCount(0)
      await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
      expect(errors).toEqual([])
    } finally {
      await context.close()
    }
  })
}
