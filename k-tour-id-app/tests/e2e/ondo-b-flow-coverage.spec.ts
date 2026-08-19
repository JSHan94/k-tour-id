import { expect, test } from "@playwright/test"
import {
  actionSelector,
  B_BROWSER_CASES,
  B_ROUTE_SEAM_READY,
  bCaseUrl,
  expectBRoot,
  expectBRuntimeClean,
  expectNoHorizontalOverflow,
  expectNoRawTruthLeaks,
  expectedNextCheckpoint,
  installBRuntimeGuard,
  prepareBPage,
} from "../helpers/ondo-b-qa"

test.describe("ONDO B functional non-inferiority checkpoints", () => {
  test.skip(!B_ROUTE_SEAM_READY, "PENDING_ROOT_ROUTE_SEAM: /ondo-b and deterministic qaCase adapter are not mounted yet")

  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const item of B_BROWSER_CASES) {
    test(item.id, async ({ page }) => {
      await page.goto(bCaseUrl(item.flow, item.checkpoint, item.locale))
      await expectBRoot(page, item.flow, item.checkpoint, item.locale)
      await expectNoHorizontalOverflow(page)
      await expectNoRawTruthLeaks(page)

      const next = expectedNextCheckpoint(item.checkpoint)
      const selector = actionSelector(item.checkpoint)
      if (next && selector) {
        const action = page.getByTestId("ondo-b-root").locator(selector)
        await expect(action).toBeVisible()
        await expect(action).toBeEnabled()
        await action.click()
        await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-b-checkpoint", next.toLowerCase())
      } else {
        await expect(page.getByTestId("ondo-b-root").locator("[data-b-return-anchor]")).toBeVisible()
      }
    })
  }
})
