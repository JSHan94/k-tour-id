import { expect, test, type Page } from "@playwright/test"

test.describe.configure({ timeout: 90_000 })
const failures = new WeakMap<Page, string[]>()
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  failures.set(page, errors)
  page.on("pageerror", error => errors.push(error.message))
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: {
      getCurrentPosition(_success: PositionCallback, failure: PositionErrorCallback) {
        failure({ code: 1, message: "denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
      },
    } })
  })
  await page.route("**/*", async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())
      || /sumsub|onfido|omni.?one|opendid|fullnode|sui\.io|walletconnect|stripe/i.test(url.hostname)) {
      errors.push(`Forbidden request: ${request.method()} ${url.origin}`)
      await route.abort("blockedbyclient")
    } else await route.continue()
  })
})
test.afterEach(async ({ page }) => { expect(failures.get(page) ?? []).toEqual([]) })

async function openMap(page: Page, appearance: "light" | "dark", locale: "en" | "ja") {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
  await page.getByTestId("nav-settings").click()
  await page.getByTestId("settings-appearance-row").click()
  await page.getByTestId(`settings-appearance-${appearance}`).click()
  await page.getByRole("dialog", { name: "Appearance", exact: true }).getByRole("button", { name: "Close", exact: true }).click()
  await page.getByTestId("nav-ondo").click()
  await page.getByTestId("ondo-b-nation").locator('[data-city="seoul"]').click()
  const map = page.getByTestId("ondo-b-map-entry")
  await expect(map).toHaveAttribute("data-map-state", "ready", { timeout: 25_000 })
  await expect(map).toHaveAttribute("data-map-appearance", appearance)
  if (locale === "ja") {
    await expect(page.getByTestId("ondo-b-language")).toHaveAttribute("data-language-target", "ja")
    await page.getByTestId("ondo-b-language").click()
    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", "ja")
  }
  return map
}

async function deniedAndOff(page: Page) {
  await page.getByTestId("global-after19-toggle").click()
  // The normal public tab-only declaration, not an injected age receipt.
  await page.getByTestId("global-after19-confirm").click()
  await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
  await expect(page.getByTestId("global-after19-banner")).toHaveAttribute("data-review-result", "false")
  await page.getByTestId("ondo-b-locate").click()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-location-state", "denied")
  await page.getByTestId("ondo-b-location-message").locator(":scope > summary").click()
  await expect(page.getByTestId("ondo-b-location-details")).toBeVisible()
  await page.getByTestId("global-after19-banner").getByRole("button").click()
  await expect(page.getByTestId("global-after19-off-notice")).toBeVisible()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "false")
}

async function feedbackGeometry(page: Page) {
  return page.evaluate(() => {
    const element = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
    const rect = (node: Element) => {
      const { x, y, width, height, top, right, bottom, left } = node.getBoundingClientRect()
      return { x, y, width, height, top, right, bottom, left }
    }
    const card = element("ondo-b-location-message")
    const detail = element("ondo-b-location-details")
    const notice = element("global-after19-off-notice")
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const context = canvas.getContext("2d")!
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1)
      return Array.from(context.getImageData(0, 0, 1, 1).data)
    }
    const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
      const channel = value / 255
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    const contrast = (text: Element, surface: Element) => {
      const ink = rgba(getComputedStyle(text).color)
      const bg = rgba(getComputedStyle(surface).backgroundColor)
      return [0, 255].map(backdrop => {
        const composed = bg.slice(0, 3).map(value => value * bg[3] / 255 + backdrop * (1 - bg[3] / 255))
        const painted = ink.slice(0, 3).map((value, index) => value * ink[3] / 255 + composed[index] * (1 - ink[3] / 255))
        const values = [luminance(painted), luminance(composed)]
        return (Math.max(...values) + .05) / (Math.min(...values) + .05)
      })
    }
    return { map: rect(element("ondo-b-map-entry")), card: rect(card), detail: rect(detail), notice: rect(notice),
      summaryContrast: contrast(card.querySelector("summary span")!, card), detailContrast: contrast(detail, detail),
      noticeContrast: contrast(notice.querySelector("span")!, notice),
      colors: { card: getComputedStyle(card).backgroundColor, summary: getComputedStyle(card.querySelector("summary")!).color,
        detail: getComputedStyle(detail).backgroundColor, detailText: getComputedStyle(detail).color },
    }
  })
}

function expectGeometry(result: Awaited<ReturnType<typeof feedbackGeometry>>) {
  for (const ratio of [...result.summaryContrast, ...result.detailContrast, ...result.noticeContrast]) {
    expect(ratio, JSON.stringify(result.colors)).toBeGreaterThanOrEqual(4.5)
  }
  expect(result.detail.bottom, "explanation belongs inside its location card").toBeLessThanOrEqual(result.card.bottom + 1)
  expect(result.detail.top).toBeGreaterThanOrEqual(result.card.top)
  expect(result.notice.top, "mode notice follows the entire open location card").toBeGreaterThanOrEqual(result.card.bottom + 6)
  for (const rect of [result.card, result.notice]) {
    expect(rect.left).toBeGreaterThanOrEqual(result.map.left - 1)
    expect(rect.right).toBeLessThanOrEqual(result.map.right + 1)
  }
}

async function expectZoomLane(page: Page) {
  for (const selector of [".maplibregl-ctrl-zoom-in", ".maplibregl-ctrl-zoom-out"]) {
    const control = page.locator(selector).filter({ visible: true })
    await expect(control).toHaveCount(1)
    const result = await control.evaluate(node => {
      const bounds = node.getBoundingClientRect()
      const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      const overlapAreas = ["ondo-b-location-message", "global-after19-off-notice"].map(id => {
        const other = document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect()
        return Math.max(0, Math.min(bounds.right, other.right) - Math.max(bounds.left, other.left))
          * Math.max(0, Math.min(bounds.bottom, other.bottom) - Math.max(bounds.top, other.top))
      })
      return { reachable: hit === node || Boolean(hit && node.contains(hit)), overlapAreas }
    })
    expect(result.reachable, `${selector} center must receive pointer input`).toBe(true)
    expect(result.overlapAreas, `${selector} must keep its own control lane`).toEqual([0, 0])
  }
}

for (const appearance of ["dark", "light"] as const) {
  test(`${appearance}-full: denied explanation and After 19 off share readable nonoverlapping feedback; compact undo/dismiss survive`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    const map = await openMap(page, appearance, "en")
    await deniedAndOff(page)
    const result = await feedbackGeometry(page)
    await testInfo.attach("feedback-geometry.json", { body: JSON.stringify(result, null, 2), contentType: "application/json" })
    await page.screenshot({ path: testInfo.outputPath(`${appearance}-denied-off-expanded.png`) })
    expectGeometry(result)
    await expectZoomLane(page)
    const notice = page.getByTestId("global-after19-off-notice")
    await notice.getByRole("button", { name: "Turn back on", exact: true }).click()
    await expect(map).toHaveAttribute("data-after19-active", "true")
    await expect(notice).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-location-details")).toBeVisible()
    await page.getByTestId("global-after19-banner").getByRole("button").click()
    await expect(notice).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(map).toHaveAttribute("data-compact-chrome", "true")
    await expect(notice).toBeInViewport()
    const [noticeBox, headerBox] = await Promise.all([notice.boundingBox(), page.getByTestId("ondo-b-city-header").boundingBox()])
    expect(noticeBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height + 6)
    await page.getByTestId("ondo-b-map-options-open").click()
    await expect(page.getByTestId("ondo-b-map-options-locate")).toContainText("Location off")
    await page.getByTestId("ondo-b-map-options-locate").click()
    await expect(page.getByTestId("ondo-b-map-options")).toHaveCount(0)
    await page.getByTestId("ondo-b-map-options-open").click()
    await page.getByTestId("ondo-b-map-options-location-privacy").locator("summary").click()
    await expect(page.getByTestId("ondo-b-map-options-location-privacy").locator("p")).toContainText("Enable location in browser settings")
    await page.getByTestId("ondo-b-map-options-done").click()
    await expect(notice).toBeVisible()
    // The location card remounts after compact Options; its permanent slot
    // must still precede the existing portaled notice, not append after it.
    await page.setViewportSize({ width: 1024, height: 900 })
    await expect(page.getByTestId("ondo-b-location-details")).toBeVisible()
    expectGeometry(await feedbackGeometry(page))
    await expectZoomLane(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(map).toHaveAttribute("data-compact-chrome", "true")
    await notice.getByRole("button", { name: "Dismiss", exact: true }).click()
    await expect(notice).toHaveCount(0)
    await expect(map).toHaveAttribute("data-after19-active", "false")
    await expect(map).toHaveAttribute("data-location-state", "denied")
    await expect(page.getByTestId("global-after19-toggle")).toBeFocused()
    await page.setViewportSize({ width: 1024, height: 900 })
    await expect(page.getByTestId("ondo-b-location-details")).toBeVisible()
    await page.getByTestId("ondo-b-locate").click()
    await expect(map).toHaveAttribute("data-location-state", "denied")
  })
}

test("JA landscape: long feedback stays in its map region with reachable undo and dismiss", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 800, height: 480 })
  const map = await openMap(page, "dark", "ja")
  await deniedAndOff(page)
  const result = await feedbackGeometry(page)
  expectGeometry(result)
  const stack = page.getByTestId("ondo-b-map-feedback")
  const stackBox = await stack.boundingBox()
  expect(stackBox!.y + stackBox!.height).toBeLessThanOrEqual(result.map.bottom)
  const notice = page.getByTestId("global-after19-off-notice")
  const undo = notice.getByRole("button", { name: "もう一度オンにする", exact: true })
  await undo.scrollIntoViewIfNeeded()
  await expect(undo).toBeInViewport()
  await page.screenshot({ path: testInfo.outputPath("ja-landscape-feedback.png") })
  await undo.click()
  await expect(map).toHaveAttribute("data-after19-active", "true")
  await page.getByTestId("global-after19-banner").getByRole("button").click()
  const dismiss = notice.getByRole("button", { name: "閉じる", exact: true })
  await dismiss.scrollIntoViewIfNeeded()
  await dismiss.click()
  await expect(notice).toHaveCount(0)
  await expect(map).toHaveAttribute("data-after19-active", "false")
  await expect(map).toHaveAttribute("data-location-state", "denied")
})
