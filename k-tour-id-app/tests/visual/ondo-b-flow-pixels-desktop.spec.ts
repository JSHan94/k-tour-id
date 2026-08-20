import { expect, test } from "@playwright/test"
import {
  B_VISUAL_CASES,
  attachAndAssertBVisualRuntime,
  attachBCaseMetadata,
  bSnapshotName,
  closeBVisualCase,
  expectBVisualGuards,
  prepareBVisualPage,
  setupBVisualCase,
  stabilizeBVisualSnapshot,
} from "../helpers/ondo-b-visual-evidence"

test.afterEach(async ({ page }, testInfo) => {
  await attachAndAssertBVisualRuntime(page, testInfo)
})

test.describe("ONDO B complete desktop visual evidence · 1440×1000", () => {
  for (const item of B_VISUAL_CASES) {
    test(`${item.id} · ${item.description}`, async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      test.skip(testInfo.project.name !== "desktop-chromium", "desktop evidence belongs to desktop-chromium")
      await page.setViewportSize({ width: 1440, height: 1000 })
      await prepareBVisualPage(page, { mapFailure: item.state === "CITY-FALLBACK" })
      const scope = await setupBVisualCase(page, item)
      await expect(scope).toBeVisible()
      await attachBCaseMetadata(testInfo, item, "1440x1000")
      await expectBVisualGuards(page, page.getByTestId("ondo-b-root"), testInfo)
      await stabilizeBVisualSnapshot(page, item)

      await expect(page).toHaveScreenshot(bSnapshotName(item, "1440x1000"), {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixels: 32,
      })
      await closeBVisualCase(page)
    })
  }
})
