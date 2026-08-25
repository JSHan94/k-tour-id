import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seed(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript(({ key, language }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
    }))
  }, { key: DEVICE_KEY, language: locale })
}

test("VIS-SYS-001 mobile dock never overlays content and tabs do not inherit another tab's scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

  const content = page.locator("[data-testid='ondo-canvas'] > div").first()
  const nav = page.getByTestId("ondo-main-nav")
  const geometry = await Promise.all([content.boundingBox(), nav.boundingBox()])
  expect(geometry[0]).not.toBeNull()
  expect(geometry[1]).not.toBeNull()
  expect(geometry[0]!.y + geometry[0]!.height).toBeLessThanOrEqual(geometry[1]!.y + 0.5)

  const buttons = nav.locator("button")
  await expect(buttons).toHaveCount(5)
  const boxes = await buttons.evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect()
    const label = node.querySelector("small")?.getBoundingClientRect()
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height, labelLeft: label?.left ?? 0, labelRight: label?.right ?? 0 }
  }))
  for (const [index, box] of boxes.entries()) {
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.labelLeft).toBeGreaterThanOrEqual(box.left)
    expect(box.labelRight).toBeLessThanOrEqual(box.right)
    if (index) expect(box.left).toBeGreaterThanOrEqual(boxes[index - 1].right - 0.5)
  }

  await page.getByTestId("nav-my").click()
  await content.evaluate((node) => { node.scrollTop = node.scrollHeight })
  await expect.poll(() => content.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
  await page.getByTestId("nav-tables").click()
  await expect.poll(() => content.evaluate((node) => node.scrollTop)).toBe(0)
})

test("VIS-SYS-002 compact mobile map preserves most of the canvas for the Pulse visualization", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.locator("[data-city='seoul']").click()
  const root = page.getByTestId("ondo-b-map-entry")
  await expect(root).toHaveAttribute("data-effective-view", "map")
  await expect(page.getByTestId("maplibre-map")).toBeVisible()

  const occupancy = await root.evaluate((node) => {
    const rootRect = node.getBoundingClientRect()
    const ids = ["ondo-b-location-message", "ondo-b-map-key", "ondo-b-result-bar", "ondo-b-attribution"]
    const area = ids.reduce((sum, id) => {
      const element = node.querySelector<HTMLElement>(`[data-testid='${id}']`)
      if (!element || element.offsetParent === null) return sum
      const rect = element.getBoundingClientRect()
      return sum + rect.width * rect.height
    }, 0)
    return area / (rootRect.width * rootRect.height)
  })
  expect(occupancy).toBeLessThanOrEqual(0.3)
})

test("VIS-SYS-003 every PRD tab remains scrollable and its last action clears the dock", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  const content = page.locator("[data-testid='ondo-canvas'] > div").first()
  const nav = page.getByTestId("ondo-main-nav")

  for (const tab of ["my", "tables", "id", "settings"] as const) {
    await page.getByTestId(`nav-${tab}`).click()
    const focusable = content.locator("button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled])")
    const last = focusable.last()
    await expect(last).toBeVisible()
    await last.focus()
    await expect(last).toBeFocused()
    const [lastBox, navBox] = await Promise.all([last.boundingBox(), nav.boundingBox()])
    expect(lastBox).not.toBeNull()
    expect(navBox).not.toBeNull()
    expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(navBox!.y + 0.5)
  }
})
