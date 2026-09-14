import { expect, test, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

async function openLanguageSheet(page: Page) {
  await page.getByTestId("nav-settings").click()
  const opener = page.getByTestId("settings-language-row")
  await opener.click()
  const layer = page.locator("[data-sheet-layer='true']")
  const dialog = page.getByRole("dialog", { name: "Language", exact: true })
  await expect(layer).toHaveAttribute("data-sheet-presence", "open")
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused()
  return { opener, layer, dialog }
}

test.describe("Shared Sheet · retained mobile exit", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await seedB(page, { local: { onboarding: "ONB-COMPLETE" } })
    await gotoB(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("SHEET-EXIT-BROWSER-001 keeps ownership through exit, then restores the exact opener", async ({ page }) => {
    const { opener, layer, dialog } = await openLanguageSheet(page)
    await dialog.getByRole("button", { name: "Close", exact: true }).click()

    await expect(layer).toHaveAttribute("data-sheet-presence", "closing")
    await expect(dialog).toBeVisible()
    await expect(page.getByTestId("ondo-canvas")).toHaveAttribute("data-ondo-modal-open", "true")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden")

    await page.keyboard.press("Escape")
    await expect(layer).toHaveAttribute("data-sheet-presence", "closing")

    await expect(layer).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect(page.getByTestId("ondo-canvas")).not.toHaveAttribute("data-ondo-modal-open", "true")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden")
  })

  test("SHEET-EXIT-BROWSER-002 reduced motion removes the sheet without a retained visual interval", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const { opener, layer, dialog } = await openLanguageSheet(page)
    await dialog.getByRole("button", { name: "Close", exact: true }).click()

    await expect(layer).toHaveCount(0)
    await expect(opener).toBeFocused()
  })
})
