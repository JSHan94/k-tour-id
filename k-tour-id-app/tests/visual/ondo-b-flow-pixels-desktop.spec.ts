import { expect, test } from "@playwright/test"
import {
  B_PIXEL_CASES,
  expectBRuntimeClean,
  installBRuntimeGuard,
  prepareBPage,
  setupBSurface,
} from "../helpers/ondo-b-qa"

const cases = B_PIXEL_CASES.filter((item) => item.project === "desktop-chromium")

test.describe("ONDO B reachable desktop pixel surfaces", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })
  test.afterEach(async ({ page }) => expectBRuntimeClean(page))

  for (const item of cases) {
    test(item.id, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== item.project, `belongs to ${item.project}`)
      await page.setViewportSize({ width: item.width, height: item.height })
      const surface = await setupBSurface(page, item.surface, item.locale)
      await expect(surface).toBeVisible()
      await expect(page.locator(item.selector)).toHaveScreenshot(`${item.id}.png`, {
        animations: "disabled",
        caret: "hide",
        mask: [page.locator("[data-testid='maplibre-map'] canvas")],
        maskColor: "#EAE6DD",
      })
    })
  }
})
