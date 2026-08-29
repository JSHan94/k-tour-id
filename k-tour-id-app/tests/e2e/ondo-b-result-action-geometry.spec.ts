import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

const CASES = [
  { locale: "ko", width: 320, height: 720, view: "map", action: "목록" },
  { locale: "ja", width: 390, height: 844, view: "list", action: "地図" },
  { locale: "en", width: 844, height: 390, view: "list", action: "Map" },
  { locale: "en", width: 1440, height: 1000, view: "list", action: "Map" },
] as const

async function seed(page: Page, locale: (typeof CASES)[number]["locale"]) {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
}

for (const scenario of CASES) {
  test(`${scenario.locale} ${scenario.width}x${scenario.height} keeps one unclipped result action`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height })
    await seed(page, scenario.locale)
    await page.goto(`/?city=seoul&view=${scenario.view}`)

    const bar = page.getByTestId("ondo-b-result-bar")
    const truth = page.getByTestId("ondo-b-result-truth")
    const action = page.getByTestId("ondo-b-view-toggle")

    await expect(bar).toBeVisible()
    await expect(action).toBeVisible()
    await expect(action).toContainText(scenario.action)
    await expect(action).toHaveAttribute("aria-describedby", "ondo-b-result-truth")

    const geometry = await bar.evaluate((node) => {
      const barElement = node as HTMLElement
      const truthElement = barElement.querySelector<HTMLElement>("[data-testid='ondo-b-result-truth']")!
      const actionElement = barElement.querySelector<HTMLElement>("[data-testid='ondo-b-view-toggle']")!
      const barRect = barElement.getBoundingClientRect()
      const truthRect = truthElement.getBoundingClientRect()
      const actionRect = actionElement.getBoundingClientRect()
      const truthStyle = getComputedStyle(truthElement)
      return {
        bar: { left: barRect.left, top: barRect.top, right: barRect.right, bottom: barRect.bottom, width: barRect.width, height: barRect.height },
        truth: { width: truthRect.width, height: truthRect.height, position: truthStyle.position, clip: truthStyle.clip },
        action: { left: actionRect.left, top: actionRect.top, right: actionRect.right, bottom: actionRect.bottom, width: actionRect.width, height: actionRect.height, scrollWidth: actionElement.scrollWidth, clientWidth: actionElement.clientWidth },
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })

    expect(geometry.truth.position).toBe("absolute")
    expect(geometry.truth.width).toBeLessThanOrEqual(1)
    expect(geometry.truth.height).toBeLessThanOrEqual(1)
    expect(geometry.truth.clip).not.toBe("auto")
    expect(geometry.action.width).toBeGreaterThanOrEqual(44)
    expect(geometry.action.height).toBeGreaterThanOrEqual(44)
    expect(geometry.action.scrollWidth).toBeLessThanOrEqual(geometry.action.clientWidth + 1)
    expect(geometry.action.left).toBeGreaterThanOrEqual(geometry.bar.left - 0.5)
    expect(geometry.action.top).toBeGreaterThanOrEqual(geometry.bar.top - 0.5)
    expect(geometry.action.right).toBeLessThanOrEqual(geometry.bar.right + 0.5)
    expect(geometry.action.bottom).toBeLessThanOrEqual(geometry.bar.bottom + 0.5)
    expect(geometry.documentOverflow).toBeLessThanOrEqual(1)
  })
}
