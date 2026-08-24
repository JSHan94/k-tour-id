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

const responsiveViewports = PRODUCTION_VISUAL_VIEWPORTS.filter(({ owner }) => owner === "responsive")

test.describe("ONDO B current production visual evidence · responsive", () => {
  for (const viewport of responsiveViewports) {
    for (const item of B_PRODUCTION_VISUAL_CASES) {
      test(`${viewport.id} · ${item.id} · ${item.description}`, async ({ page }, testInfo) => {
        test.setTimeout(90_000)
        test.skip(testInfo.project.name !== "production-desktop-chromium", "responsive matrix owner")
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await prepareBProductionVisualPage(page)
        await setupBProductionVisualCase(page, item)
        await stabilizeBProductionVisual(page, item)
        await attachBProductionVisualMetadata(testInfo, item, viewport)
        await expectBProductionVisualGuards(page, item)
        await expectBProductionVisualSnapshot(page, item, viewport)
      })
    }
  }
})
