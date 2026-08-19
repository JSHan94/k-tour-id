import { expect, test } from "@playwright/test"
import {
  B_CONTENT_CASES,
  expectBRuntimeClean,
  expectNoHorizontalOverflow,
  expectNoRawTruthLeaks,
  installBRuntimeGuard,
  prepareBPage,
  setupBSurface,
} from "../helpers/ondo-b-qa"

const PRODUCT_BOUNDARY = /Simulat|시뮬레이션|official|공식|source|출처|preview|미리보기|local|로컬|signal|신호|private|비공개|not confirmed|확인되지/

test.describe("ONDO B reachable KO/EN content surfaces", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const item of B_CONTENT_CASES) {
    test(item.id, async ({ page }) => {
      const surface = await setupBSurface(page, item.surface, item.locale)
      await expect(surface).toBeVisible()
      await expectNoRawTruthLeaks(page, surface)
      await expectNoHorizontalOverflow(page)
      const copy = (await surface.innerText()).trim()
      expect(copy.length, "surface must contain user-facing copy").toBeGreaterThan(20)
      if (["place", "account-gate", "age-gate", "table-chat", "local-signal", "checkout", "profile", "labs", "after19"].includes(item.surface)) {
        expect(copy, "sensitive/simulated surfaces must state a truth or privacy boundary").toMatch(PRODUCT_BOUNDARY)
      }
    })
  }
})
