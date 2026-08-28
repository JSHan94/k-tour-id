import { expect, test } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
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
    await openCanonicalVenue(page)

    const detail = page.getByTestId("canonical-place-overlay")
    const access = detail.getByTestId("canonical-after19-access")
    const unlock = access.getByTestId("canonical-after19-unlock")

    await test.step("the venue prompt is topmost and cancel restores the exact detail", async () => {
      await unlock.click()
      const promptLayer = page.getByTestId("global-after19-prompt-layer")
      const prompt = promptLayer.getByRole("dialog")
      const confirm = promptLayer.getByTestId("global-after19-confirm")
      const returnContext = promptLayer.getByTestId("global-after19-return-context")

      await expect(prompt).toBeVisible()
      await expect(returnContext).toHaveAttribute("data-return-venue", CANONICAL_VENUE_ID)
      await expect(returnContext).toHaveAttribute("data-return-level", "detail")
      await expect(returnContext).toHaveAttribute("data-return-focus", "canonical-after19-access")
      await expect(page.locator("[role='dialog'][aria-modal='true']")).toHaveCount(1)
      await expect(confirm).toBeVisible()
      await expect.poll(() => confirm.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
        return top === element || element.contains(top)
      })).toBe(true)
      await confirm.click({ trial: true })

      await promptLayer.getByTestId("global-after19-cancel").click()
      await expect(promptLayer).toHaveCount(0)
      await expect(detail).toBeVisible()
      await expect(access).toBeFocused()
      await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
    })

    await test.step("age completion returns to the exact unlocked venue", async () => {
      await unlock.click()
      const promptLayer = page.getByTestId("global-after19-prompt-layer")
      await promptLayer.getByTestId("global-after19-confirm").click()

      await expect(promptLayer).toHaveCount(0)
      await expect(detail).toBeVisible()
      await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
      await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "unlocked")
      await expect(page.getByTestId("global-after19-banner")).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}.*detail=1`))
      await expect(page).not.toHaveURL(/after19Return=/)
      expect(await sessionState(page)).toMatchObject({ age: "AGE-VERIFIED", after19: "A19-ON" })
    })
  })
})
