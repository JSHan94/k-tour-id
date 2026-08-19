import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import {
  expectBRuntimeClean,
  expectMinimumControlTargets,
  expectNoHorizontalOverflow,
  installBRuntimeGuard,
  prepareBPage,
  setupBSurface,
  type BSurfaceId,
} from "../helpers/ondo-b-qa"

const SURFACES: readonly BSurfaceId[] = [
  "onboarding", "nation", "city-list", "place", "account-gate", "age-gate", "tables",
  "table-chat", "local-signal", "checkout", "identity", "profile", "labs", "after19",
]

test.describe("ONDO B actual-surface accessibility and interaction", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const surfaceId of SURFACES) {
    test(`B-A11Y-${surfaceId.toUpperCase()}`, async ({ page }) => {
      const surface = await setupBSurface(page, surfaceId, "en")
      await expect(surface).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await expectMinimumControlTargets(surface)
      const result = await new AxeBuilder({ page }).include(await surface.evaluate((node) => {
        if (!node.id) node.id = `b-a11y-${Math.random().toString(36).slice(2)}`
        return `#${CSS.escape(node.id)}`
      })).analyze()
      const actionable = result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      expect(actionable).toEqual([])

      if (surfaceId === "tables") {
        await expect(surface.getByTestId("tables-truth-notice")).toContainText("No live host or reservation")
        await surface.locator("[data-table-id]").first().click()
        const detail = page.locator("[data-table-membership]")
        await expect(detail).toContainText("Simulated fixture")
        await expectMinimumControlTargets(detail)
        const detailResult = await new AxeBuilder({ page }).include(await detail.evaluate((node) => {
          if (!node.id) node.id = `b-a11y-table-detail-${Math.random().toString(36).slice(2)}`
          return `#${CSS.escape(node.id)}`
        })).analyze()
        const detailActionable = detailResult.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")
        expect(detailActionable).toEqual([])
      }
    })
  }
})
