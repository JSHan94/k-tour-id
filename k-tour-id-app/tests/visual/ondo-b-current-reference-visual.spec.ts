import { expect, test } from "@playwright/test"
import {
  CURRENT_REFERENCE_VISUAL_CASES,
  currentReferenceSnapshotName,
  expectCurrentReferenceVisualGuards,
  prepareCurrentReferenceVisualPage,
  setupCurrentReferenceVisualCase,
  stabilizeCurrentReferenceVisual,
} from "../helpers/ondo-b-current-reference-visual"

test.describe("ONDO B current reference visual namespace", () => {
  test.describe.configure({ mode: "default", timeout: 90_000 })

  for (const item of CURRENT_REFERENCE_VISUAL_CASES) {
    test(`${item.id} · ${item.locale} · ${item.viewport.width}x${item.viewport.height}`, async ({ page }) => {
      await page.setViewportSize(item.viewport)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await prepareCurrentReferenceVisualPage(page, item)
      await setupCurrentReferenceVisualCase(page, item)
      await stabilizeCurrentReferenceVisual(page)
      await expectCurrentReferenceVisualGuards(page, item)

      if (process.env.ONDO_CURRENT_REFERENCE_PREFLIGHT !== "1") {
        await expect(page).toHaveScreenshot(currentReferenceSnapshotName(item), {
          animations: "disabled",
          caret: "hide",
          scale: "css",
          timeout: 15_000,
        })
      }
    })
  }
})
