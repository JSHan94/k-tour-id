import { expect, test } from "@playwright/test"
import {
  B_PIXEL_CASES,
  B_ROUTE_SEAM_READY,
  bCaseUrl,
  expectBRoot,
  expectBRuntimeClean,
  installBRuntimeGuard,
  prepareBPage,
} from "../helpers/ondo-b-qa"

const mobileCases = B_PIXEL_CASES.filter((item) => item.project === "mobile-chromium")

test.describe("ONDO B mobile pixel checkpoints", () => {
  test.skip(!B_ROUTE_SEAM_READY, "PENDING_ROOT_ROUTE_SEAM: B pixels require /ondo-b")

  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const item of mobileCases) {
    test(item.id, async ({ page }) => {
      await page.setViewportSize({ width: item.width, height: item.height })
      await page.goto(bCaseUrl(item.flow, item.checkpoint, item.locale))
      const root = await expectBRoot(page, item.flow, item.checkpoint, item.locale)
      await expect(root).toHaveScreenshot(`${item.id}.png`, {
        animations: "disabled",
        mask: [page.locator(".leaflet-tile-pane"), page.locator("[data-qa-mask='dynamic']")],
      })
    })
  }
})
