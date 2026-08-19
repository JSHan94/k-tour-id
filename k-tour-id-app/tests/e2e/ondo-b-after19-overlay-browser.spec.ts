import { expect, test } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
  finishAgeGate,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  sessionState,
} from "../helpers/ondo-b-qa"

test.describe("ONDO B selected-venue After19 coordination", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("B-E2E-FL-013 global prompt stays actionable above a venue and preserves its return context", async ({ page }) => {
    await seedB(page, {
      session: {
        account: "ACC-ACTIVE",
        person: "PER-VERIFIED",
        age: "AGE-UNVERIFIED",
        paymentKyc: "PKY-NOT-STARTED",
      },
    })
    await openCanonicalVenue(page, { expanded: false })

    const peek = page.getByTestId("canonical-place-peek")
    const after19 = page.getByRole("button", { name: "After 19", exact: true })

    await test.step("the global prompt is topmost and prompt cancel keeps the venue", async () => {
      await after19.click()
      const layer = page.getByTestId("ondo-after19-layer")
      const prompt = page.getByRole("dialog", { name: /Confirm 19\+/ })
      const confirm = prompt.getByRole("button", { name: "Confirm 19+", exact: true })

      await expect(layer).toHaveAttribute("data-prompt-open", "true")
      await expect(confirm).toBeVisible()
      await expect.poll(() => confirm.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
        return top === element || element.contains(top)
      })).toBe(true)
      await confirm.click({ trial: true })

      await prompt.getByRole("button", { name: "Stay on the main map" }).click()
      await expect(prompt).toBeHidden()
      await expect(layer).toHaveAttribute("data-prompt-open", "false")
      await expect(peek).toBeVisible()
    })

    await test.step("age-gate cancel keeps the same venue", async () => {
      await after19.click()
      await page.getByRole("dialog", { name: /Confirm 19\+/ }).getByRole("button", { name: "Confirm 19+", exact: true }).click()

      const gate = page.getByTestId("ondo-gate-overlay")
      await expect(gate).toBeVisible()
      expect(await sessionState(page)).toMatchObject({
        gate: { cta: "OPEN_AFTER19", venueId: CANONICAL_VENUE_ID },
      })

      await gate.getByRole("button", { name: "Return to previous screen" }).click()
      await expect(gate).toBeHidden()
      await expect(peek).toBeVisible()
    })

    await test.step("age completion returns to the exact unlocked venue", async () => {
      await after19.click()
      await page.getByRole("dialog", { name: /Confirm 19\+/ }).getByRole("button", { name: "Confirm 19+", exact: true }).click()
      await finishAgeGate(page)

      const detail = page.getByTestId("canonical-place-overlay")
      await expect(page.getByTestId("ondo-gate-overlay")).toBeHidden()
      await expect(detail).toBeVisible()
      await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
      await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")
      await expect(page.getByTestId("after19-auto-banner")).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
      await expect(page).not.toHaveURL(/after19Return=/)
      expect(await sessionState(page)).toMatchObject({ age: "AGE-VERIFIED", after19: "A19-ON" })
    })
  })
})
