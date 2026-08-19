import { expect, test } from "@playwright/test"
import {
  B_VISUAL_CASES,
  attachBCaseMetadata,
  bSnapshotName,
  closeBVisualCase,
  expectBVisualGuards,
  prepareBVisualPage,
  setupBVisualCase,
  stabilizeBVisualSnapshot,
} from "../helpers/ondo-b-visual-evidence"

test.describe("ONDO B complete mobile visual evidence · 390×844", () => {
  for (const item of B_VISUAL_CASES) {
    test(`${item.id} · ${item.description}`, async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      test.skip(testInfo.project.name !== "mobile-chromium", "mobile evidence belongs to mobile-chromium")
      await page.setViewportSize({ width: 390, height: 844 })
      await prepareBVisualPage(page, { mapFailure: item.state === "CITY-FALLBACK" })
      const scope = await setupBVisualCase(page, item)
      await expect(scope).toBeVisible()
      await attachBCaseMetadata(testInfo, item, "390x844")
      await expectBVisualGuards(page, page.getByTestId("ondo-b-root"), testInfo)
      await stabilizeBVisualSnapshot(page, item)

      // External vector tiles are replaced before MapLibre renders. The ONDO
      // marker, score, cluster, label, sheet, and navigation layers stay visible.
      await expect(page).toHaveScreenshot(bSnapshotName(item, "390x844"), {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixels: 32,
      })
      await closeBVisualCase(page)
    })
  }
})
