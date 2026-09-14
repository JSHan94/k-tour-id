import { expect, test, type Locator, type Page } from "@playwright/test"
import { gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

async function openReviewSetup(page: Page) {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
  await gotoB(page, "?qa=1")
  await page.getByTestId("nav-id").click()

  const opener = page.getByTestId("traveler-id-ktour-id-open")
  await expect(opener).toBeVisible()
  await opener.click()

  const layer = page.getByTestId("ondo-b-ktour-id-setup")
  const setup = page.getByTestId("k-tour-id-setup")
  await expect(layer).toHaveAttribute("data-identity-presence", "open")
  await expect(layer).toHaveAttribute("data-origin", "traveler_id")
  await expect(setup).toHaveAttribute("data-execution-mode", "review")
  await expect(setup).toHaveAttribute("data-phase", "method_select")
  await expect(setup.getByTestId("k-tour-id-review-scope")).toBeVisible()
  await expect(setup.getByTestId("ktour-id-route-passport")).toHaveAttribute("data-availability", "review")
  return { layer, opener, setup }
}

async function openPassportConsent(setup: Locator) {
  await setup.getByTestId("k-tour-id-method-passport-ekyc").click()
  await expect(setup).toHaveAttribute("data-phase", "consent")
  await expect(setup).toHaveAttribute("data-method", "passport_ekyc")
  const technicalDetails = setup.getByTestId("identity-consent-provider").locator("xpath=ancestor::details")
  await technicalDetails.locator(":scope > summary").click()
  await expect(technicalDetails).toHaveAttribute("open", "")
  return technicalDetails
}

async function setupSnapshot(setup: Locator) {
  return setup.evaluate((element) => ({
    phase: element.getAttribute("data-phase"),
    method: element.getAttribute("data-method"),
    text: (element.textContent ?? "").replace(/\s+/g, " ").trim(),
    openDisclosureCount: element.querySelectorAll("details[open]").length,
  }))
}

test.describe("K-Tour ID setup · retained mobile exit", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000)
    await prepareBPage(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { locale: "en" })
  })

  test("KTOUR-EXIT-BROWSER-001 freezes consent, blocks input and restores the exact Travel Pass opener", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    const { layer, opener, setup } = await openReviewSetup(page)
    await openPassportConsent(setup)
    const before = await setupSnapshot(setup)

    await setup.getByTestId("k-tour-id-cancel").click()
    await expect(layer).toHaveAttribute("data-identity-presence", "closing")
    await expect(layer).toHaveAttribute("aria-busy", "true")
    await expect(setup).toBeVisible()
    await expect(page.getByTestId("ondo-canvas")).toHaveAttribute("data-ondo-modal-open", "true")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden")
    await expect(opener).not.toBeFocused()

    // Programmatic activation reaches the same React event boundary without
    // relying on Playwright actionability through an intentionally inert tree.
    await setup.getByTestId("k-tour-id-consent-approve").dispatchEvent("click")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(140)
    expect(await setupSnapshot(setup)).toEqual(before)
    await expect(layer).toHaveAttribute("data-identity-presence", "closing")

    await expect(layer).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect(page.getByTestId("ondo-canvas")).not.toHaveAttribute("data-ondo-modal-open", "true")
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden")
  })

  test("KTOUR-EXIT-BROWSER-002 rapid reopen cancels stale removal and stale focus restoration", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    const { layer, opener, setup } = await openReviewSetup(page)
    await openPassportConsent(setup)

    await setup.getByTestId("k-tour-id-cancel").click()
    await expect(layer).toHaveAttribute("data-identity-presence", "closing")
    await opener.evaluate((element) => {
      element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }))
    })

    await expect(layer).toHaveAttribute("data-identity-presence", "open")
    await expect(setup).toHaveAttribute("data-phase", "method_select")
    await page.waitForTimeout(420)
    await expect(layer).toHaveCount(1)
    await expect(layer).toHaveAttribute("data-identity-presence", "open")
    await expect.poll(() => setup.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    await expect(opener).not.toBeFocused()

    await setup.getByTestId("k-tour-id-cancel").click()
    await expect(layer).toHaveCount(0)
    await expect(opener).toBeFocused()
  })

  test("KTOUR-EXIT-BROWSER-003 reduced motion removes immediately and restores the exact opener", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const { layer, opener, setup } = await openReviewSetup(page)

    await setup.getByTestId("k-tour-id-cancel").click()
    await expect(layer).toHaveCount(0)
    await expect(opener).toBeFocused()
  })
})
