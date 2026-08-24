import { test } from "@playwright/test"
import { B_PRODUCTION_STRUCTURAL_VISUAL_CASES } from "../helpers/ondo-b-production-registry"
import {
  attachBProductionVisualMetadata,
  expectBProductionStructuralVisualGuards,
  expectBProductionVisualSnapshot,
  prepareBProductionStructuralVisualPage,
  setupBProductionStructuralVisualCase,
  stabilizeBProductionVisual,
} from "../helpers/ondo-b-production-visual-evidence"

test.describe("ONDO B current production visual evidence · structural", () => {
  for (const item of B_PRODUCTION_STRUCTURAL_VISUAL_CASES) {
    test(`${item.viewport.id} · ${item.id} · ${item.description}`, async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      test.skip(testInfo.project.name !== "production-desktop-chromium", "sparse structural owner")
      await page.setViewportSize({ width: item.viewport.width, height: item.viewport.height })
      await prepareBProductionStructuralVisualPage(page)
      await setupBProductionStructuralVisualCase(page, item)
      await stabilizeBProductionVisual(page, item)
      await attachBProductionVisualMetadata(testInfo, item, item.viewport)
      await expectBProductionStructuralVisualGuards(page, item)
      await expectBProductionVisualSnapshot(page, item, item.viewport)
    })
  }
})
