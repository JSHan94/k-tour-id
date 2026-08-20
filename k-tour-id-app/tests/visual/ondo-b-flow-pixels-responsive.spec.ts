import { expect, test } from "@playwright/test"
import {
  B_SLEEK_VIEWPORTS,
  B_VISUAL_CASES,
  attachBCaseMetadata,
  bSnapshotName,
  closeBVisualCase,
  expectBVisualGuards,
  prepareBVisualPage,
  setupBVisualCase,
  stabilizeBVisualSnapshot,
} from "../helpers/ondo-b-visual-evidence"

const RESPONSIVE_VIEWPORTS = B_SLEEK_VIEWPORTS.filter(({ id }) => !["390x844", "1440x1000"].includes(id))

test.describe("ONDO B sleek responsive pixel evidence", () => {
  for (const viewport of RESPONSIVE_VIEWPORTS) {
    for (const item of B_VISUAL_CASES) {
      test(`${viewport.id} · ${item.id} · ${item.description}`, async ({ page }, testInfo) => {
        test.setTimeout(90_000)
        test.skip(testInfo.project.name !== "desktop-chromium", "responsive matrix has one canonical owner")
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await prepareBVisualPage(page, { mapFailure: item.state === "CITY-FALLBACK" })
        const scope = await setupBVisualCase(page, item)
        await expect(scope).toBeVisible()
        await attachBCaseMetadata(testInfo, item, viewport.id)
        await expectBVisualGuards(page, page.getByTestId("ondo-b-root"), testInfo)
        await stabilizeBVisualSnapshot(page, item)

        await expect(page).toHaveScreenshot(bSnapshotName(item, viewport.id), {
          animations: "disabled",
          caret: "hide",
          fullPage: false,
          maxDiffPixels: 32,
        })
        await closeBVisualCase(page)
      })
    }
  }
})
