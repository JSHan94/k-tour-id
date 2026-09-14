import { expect, test } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

for (const intent of ["none", "search", "options"] as const) {
  const useList = intent !== "none"
  test(`late basemap success recovers without replacing explicit List intent: ${intent}`, async ({ page }) => {
    test.setTimeout(45_000)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.addInitScript(() => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale: "en", onboarding: "ONB-COMPLETE" })))
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    await page.route("https://tiles.openfreemap.org/planet", async route => {
      await held
      await route.continue()
    })
    try {
      await page.goto("/?city=busan", { waitUntil: "domcontentloaded" })
      const root = page.getByTestId("ondo-b-map-entry")
      const map = page.getByTestId("maplibre-map")
      const canvas = await page.locator(".maplibregl-canvas").elementHandle()
      await expect(root).toHaveAttribute("data-map-state", "error", { timeout: 15_000 })
      await expect(root).toHaveAttribute("data-effective-view", "list")
      await expect(map).toHaveAttribute("data-basemap-metadata", "pending")
      await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
      if (useList) {
        if (intent === "options") {
          await page.getByTestId("ondo-b-map-options-open").click()
          await page.getByTestId("ondo-b-map-options-categories").locator('button[data-category]:not([data-category="all"])').first().click()
        } else await page.getByTestId("ondo-b-search").click()
        await expect(root).toHaveAttribute("data-requested-view", "list")
      }
      release()
      await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
      await expect(map).toHaveAttribute("data-basemap-metadata", "ready")
      await expect(map).toHaveAttribute("data-basemap-tile", "ready")
      await expect(root).toHaveAttribute("data-map-attempt", "1")
      await expect(root).toHaveAttribute("data-effective-view", useList ? "list" : "map")
      expect(await canvas!.evaluate(node => node.isConnected && node === document.querySelector(".maplibregl-canvas"))).toBe(true)
      expect(new URL(page.url()).searchParams.get("city")).toBe("busan")
      if (useList) {
        if (intent === "options") {
          await expect(page.getByTestId("ondo-b-map-options")).toBeVisible()
          await page.getByTestId("ondo-b-map-options-done").click()
        }
        await page.getByTestId("ondo-b-view-toggle").click()
        await expect(root).toHaveAttribute("data-effective-view", "map")
      }
    } finally {
      release()
    }
  })
}

test("failed remote tiles never masquerade as a recovered basemap", async ({ page }) => {
  test.setTimeout(30_000)
  await page.addInitScript(() => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale: "en", onboarding: "ONB-COMPLETE" })))
  await page.route("https://tiles.openfreemap.org/**/*.pbf", route => route.abort("failed"))
  await page.goto("/?city=busan", { waitUntil: "domcontentloaded" })
  const root = page.getByTestId("ondo-b-map-entry")
  const map = page.getByTestId("maplibre-map")
  await expect(root).toHaveAttribute("data-map-state", "error", { timeout: 15_000 })
  await expect(map).toHaveAttribute("data-basemap-metadata", "ready")
  await expect(map).toHaveAttribute("data-basemap-tile", "pending")
  await page.waitForTimeout(1500)
  await expect(root).toHaveAttribute("data-map-state", "error")
  await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
})
