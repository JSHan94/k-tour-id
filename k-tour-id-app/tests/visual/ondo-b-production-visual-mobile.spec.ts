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

const viewport = PRODUCTION_VISUAL_VIEWPORTS.find(({ id }) => id === "390x844")!

test.describe("ONDO B current production visual evidence · mobile", () => {
  for (const item of B_PRODUCTION_VISUAL_CASES) {
    test(`${item.id} · ${item.description}`, async ({ page }, testInfo) => {
      test.setTimeout(90_000)
      test.skip(testInfo.project.name !== "production-mobile-chromium", "canonical mobile owner")
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
