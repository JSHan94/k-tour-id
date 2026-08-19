import { test } from "@playwright/test"
import {
  B_CHECKPOINTS,
  B_CONTENT_CASES,
  B_ROUTE_SEAM_READY,
  bCaseUrl,
  expectBRoot,
  expectBRuntimeClean,
  expectNoHorizontalOverflow,
  expectNoRawTruthLeaks,
  installBRuntimeGuard,
  prepareBPage,
} from "../helpers/ondo-b-qa"

test.describe("ONDO B KO/EN content and truth boundaries", () => {
  test.skip(!B_ROUTE_SEAM_READY, "PENDING_ROOT_ROUTE_SEAM: B copy is not rendered until /ondo-b exists")

  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const item of B_CONTENT_CASES) {
    test(item.id, async ({ page }) => {
      for (const checkpoint of B_CHECKPOINTS) {
        await page.goto(bCaseUrl(item.flow, checkpoint, item.locale))
        await expectBRoot(page, item.flow, checkpoint, item.locale)
        await expectNoRawTruthLeaks(page)
        await expectNoHorizontalOverflow(page)
      }
    })
  }
})
