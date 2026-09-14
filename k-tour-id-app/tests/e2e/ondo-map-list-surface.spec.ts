import { expect, test, type Locator } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

const scenarios = [
  { width: 320, height: 740, city: "jeju", locale: "ko", appearance: "dark" },
  { width: 390, height: 844, city: "busan", locale: "en", appearance: "light" },
  { width: 430, height: 932, city: "seoul", locale: "ja", appearance: "dark" },
  { width: 844, height: 390, city: "busan", locale: "en", appearance: "light" },
  { width: 1440, height: 1000, city: "jeju", locale: "en", appearance: "dark" },
] as const

async function expectUsableCentre(control: Locator) {
  await expect(control).toBeVisible()
  const rect = await control.boundingBox()
  expect(rect).not.toBeNull()
  expect(rect!.height).toBeGreaterThanOrEqual(44)
  expect(await control.evaluate(element => {
    const box = element.getBoundingClientRect()
    return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
  })).toBe(true)
}

for (const scenario of scenarios) test(`list is one bounded scroll surface: ${scenario.city} ${scenario.width} ${scenario.appearance}`, async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: scenario.width, height: scenario.height })
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scenario.appearance })
  await page.addInitScript(({ locale, appearance }) => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE" })), scenario)
  await page.goto(`/?city=${scenario.city}&view=list`, { waitUntil: "domcontentloaded" })
  const root = page.getByTestId("ondo-b-map-entry")
  const panel = page.getByTestId("ondo-b-list-panel")
  const footer = page.getByTestId("ondo-b-map-chrome")
  const toggle = page.getByTestId("ondo-b-view-toggle")
  await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 30_000 })
  await expect(root).toHaveAttribute("data-effective-view", "list")
  await expect(panel).toBeVisible()

  const layout = await panel.evaluate(element => {
    const root = element.parentElement!
    const header = root.querySelector('[data-testid="ondo-b-city-header"]')!
    const footer = root.querySelector('[data-testid="ondo-b-map-chrome"]')!
    const box = element.getBoundingClientRect(), rootBox = root.getBoundingClientRect()
    const footerBox = footer.getBoundingClientRect(), headerBox = header.getBoundingClientRect()
    const style = getComputedStyle(element)
    const blankEdge = document.elementFromPoint(rootBox.left + 2, Math.min(rootBox.bottom - 2, box.bottom + 2))
    return {
      panel: { x: box.x, y: box.y, right: box.right, bottom: box.bottom, height: box.height },
      root: { x: rootBox.x, right: rootBox.right, bottom: rootBox.bottom, width: rootBox.width, height: rootBox.height },
      footer: { top: footerBox.top, bottom: footerBox.bottom },
      headerBottom: headerBox.bottom,
      opaqueRoot: getComputedStyle(root).backgroundColor !== "rgba(0, 0, 0, 0)",
      scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
      touchAction: style.touchAction,
      edgeOwnedByList: root.contains(blankEdge),
    }
  })
  expect(layout.opaqueRoot).toBe(true)
  expect(layout.edgeOwnedByList).toBe(true)
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1)
  expect(layout.scrollHeight).toBeGreaterThan(layout.clientHeight)
  expect(layout.panel.x).toBeGreaterThanOrEqual(layout.root.x)
  expect(layout.panel.right).toBeLessThanOrEqual(layout.root.right + 1)
  expect(layout.panel.y).toBeGreaterThanOrEqual(layout.headerBottom)
  expect(layout.touchAction).toBe("pan-x pan-y")
  if (layout.root.width >= 600 && layout.root.height <= 500) {
    // The compact landscape composition deliberately keeps Map in its top
    // utility lane, so the list owns all remaining height.
    expect(layout.footer.bottom).toBeLessThanOrEqual(layout.panel.y)
    expect(Math.abs(layout.panel.bottom - layout.root.bottom)).toBeLessThanOrEqual(1)
  } else {
    expect(Math.abs(layout.panel.bottom - layout.footer.top)).toBeLessThanOrEqual(1)
    expect(Math.abs(layout.footer.bottom - layout.root.bottom)).toBeLessThanOrEqual(1)
  }
  await expectUsableCentre(toggle)
  await expect(panel.getByTestId("researched-food-list").getByRole("heading")).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: testInfo.outputPath(`list-top-${scenario.city}-${scenario.width}.png`) })

  // Horizontal editorial cards and vertical venue rows must share neither a
  // clipped focus ring nor an inaccessible bottom strip with the app dock.
  const researchCard = panel.locator("button[data-research-id]").last()
  expect(await researchCard.locator(":scope > span > strong").evaluate(element => getComputedStyle(element).webkitLineClamp)).toBe("2")
  await researchCard.scrollIntoViewIfNeeded()
  await expectUsableCentre(researchCard)
  const venue = panel.locator("li[data-venue-id] > button, li[data-editorial-place-id] > button").first()
  if (scenario.city === "jeju") {
    const secondary = venue.locator(":scope > span:nth-child(2) > small").last()
    const mutedColor = await panel.getByTestId("researched-food-list").locator("header p").evaluate(element => getComputedStyle(element).color)
    await expect(secondary).toHaveCSS("color", mutedColor)
  }
  await venue.scrollIntoViewIfNeeded()
  await expectUsableCentre(venue)
  const lastAction = panel.getByRole("button").last()
  await lastAction.scrollIntoViewIfNeeded()
  await lastAction.focus()
  await expectUsableCentre(lastAction)
  const finalBoxes = { panel: (await panel.boundingBox())!, action: (await lastAction.boundingBox())! }
  expect(finalBoxes.action.y).toBeGreaterThanOrEqual(finalBoxes.panel.y)
  expect(finalBoxes.action.y + finalBoxes.action.height).toBeLessThanOrEqual(finalBoxes.panel.y + finalBoxes.panel.height + 1)
  await page.screenshot({ path: testInfo.outputPath(`list-bottom-${scenario.city}-${scenario.width}.png`) })

  await toggle.click()
  await expect(root).toHaveAttribute("data-effective-view", "map")
  await expect(panel).toHaveCount(0)
  await toggle.click()
  await expect(panel).toBeVisible()
  await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  await venue.scrollIntoViewIfNeeded()
  await venue.click()
  await expect(page.getByRole("dialog").first()).toBeVisible()
  expect(await page.locator("html").evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
})

test("an empty list keeps its recovery action above the attached footer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale: "en", appearancePreference: "light", onboarding: "ONB-COMPLETE" })))
  await page.goto("/?city=busan&view=list", { waitUntil: "domcontentloaded" })
  await page.getByTestId("ondo-b-search").fill("no-matching-list-surface-place")
  const empty = page.getByTestId("ondo-b-empty-results")
  await expect(empty).toBeVisible()
  const clear = empty.getByRole("button")
  await expectUsableCentre(clear)
  await clear.click()
  await expect(page.getByTestId("ondo-b-search")).toHaveValue("")
  await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]").first()).toBeVisible()
})
