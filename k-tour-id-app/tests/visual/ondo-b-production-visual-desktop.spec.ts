import { test } from "@playwright/test"
import { B_PRODUCTION_VISUAL_CASES } from "../helpers/ondo-b-production-registry"
import {
  PRODUCTION_VISUAL_VIEWPORTS,
  attachBProductionVisualMetadata,
  expectBProductionVisualGuards,
  expectBProductionVisualSnapshot,
  prepareBProductionVisualPage,
  setupBProductionVisualCase,
  stabilizeBProductionVisual,
} from "../helpers/ondo-b-production-visual-evidence"

const viewport = PRODUCTION_VISUAL_VIEWPORTS.find(({ id }) => id === "1440x1000")!

test.describe("ONDO B current production visual evidence · desktop", () => {
  for (const item of B_PRODUCTION_VISUAL_CASES) {
    test(`${item.id} · ${item.description}`, async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      test.skip(testInfo.project.name !== "production-desktop-chromium", "canonical desktop owner")
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await prepareBProductionVisualPage(page)
      await setupBProductionVisualCase(page, item)
      await stabilizeBProductionVisual(page, item)
      await attachBProductionVisualMetadata(testInfo, item, viewport)
      await expectBProductionVisualGuards(page, item)
      await expectBProductionVisualSnapshot(page, item, viewport)
    })
  }
})
