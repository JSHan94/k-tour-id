import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import {
  B_CHECKPOINTS,
  B_FLOW_IDS,
  B_ROUTE_SEAM_READY,
  bCaseUrl,
  expectActionInventory,
  expectBRoot,
  expectBRuntimeClean,
  expectMinimumControlTargets,
  expectNoHorizontalOverflow,
  installBRuntimeGuard,
  prepareBPage,
} from "../helpers/ondo-b-qa"

test.describe("ONDO B accessibility and dead-CTA inventory", () => {
  test.skip(!B_ROUTE_SEAM_READY, "PENDING_ROOT_ROUTE_SEAM: B accessibility surfaces are not mounted yet")

  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const flow of B_FLOW_IDS) {
    test(`B-A11Y-${flow}`, async ({ page }) => {
      for (const checkpoint of B_CHECKPOINTS) {
        await page.goto(bCaseUrl(flow, checkpoint, "en"))
        await expectBRoot(page, flow, checkpoint, "en")
        await expectNoHorizontalOverflow(page)
        await expectMinimumControlTargets(page)
        await expectActionInventory(page)
        const results = await new AxeBuilder({ page }).include("[data-testid='ondo-b-root']").analyze()
        const serious = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")
        expect(serious).toEqual([])
      }
    })
  }
})
