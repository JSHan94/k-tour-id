import { expect, test, type Locator, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

async function openSetup(page: Page, method: "mobile-id" | "residence-card" | "passport" = "mobile-id", locale = "en", outcome = "success", appearance = "light") {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.addInitScript(({ locale, appearance }) => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE" })), { locale, appearance })
  await page.route("https://tiles.openfreemap.org/**", route => route.abort("blockedbyclient"))
  await page.goto("/?review=1", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
  await page.getByTestId("nav-id").click()
  await page.getByTestId("kpass-start-setup").click()
  const setup = page.getByTestId("k-tour-id-setup")
  await setup.getByTestId(`ktour-id-route-${method}`).click()
  if (outcome !== "success") {
    await setup.getByTestId("identity-sample-controls").locator("summary").click()
    await setup.getByTestId("identity-sample-outcome").selectOption(outcome)
  }
  await setup.getByTestId("k-tour-id-consent-approve").click()
  return setup
}

async function noPass(page: Page) {
  await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "none")
}

async function approveHandoff(setup: Locator) {
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("k-tour-id-route-step")).toHaveAttribute("data-handoff-state", "waiting")
  await setup.getByTestId("identity-handoff-approve").click()
  await expect(setup.getByTestId("k-tour-id-route-step")).toHaveAttribute("data-handoff-state", "approved")
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup).toHaveAttribute("data-phase", "holder_delivery_preview")
}

async function saveOnce(setup: Locator) {
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("identity-holder-receipt")).toBeVisible()
  await setup.getByTestId("k-tour-id-continue").evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click() })
  await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-issuance-count", "1")
  await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-status", "review-draft")
}

for (const [locale, method] of [["en", "mobile-id"], ["ko", "residence-card"], ["ja", "mobile-id"]] as const) test(`explicit ${locale} ${method} sample approval needs return and holder acknowledgement`, async ({ page }) => {
  const setup = await openSetup(page, method, locale)
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("identity-demo-app")).toHaveAttribute("data-provider-connected", "false")
  await noPass(page)
  await setup.getByTestId("identity-handoff-approve").click()
  await noPass(page)
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup).toHaveAttribute("data-phase", "holder_delivery_preview")
  await noPass(page)
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("identity-holder-receipt")).toBeVisible()
  await noPass(page)
  await setup.getByTestId("k-tour-id-continue").evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click() })
  await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-issuance-count", "1")
  await setup.getByTestId("k-tour-id-return").click()
  await expect(setup).toHaveCount(0)
  for (const id of ["person", "age", "payment"]) await expect(page.getByTestId(`traveler-id-${id}`)).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("kpass-manage-setup")).toBeFocused()
})

test("Back from a saved or reopened pass returns to ID without another issuance path", async ({ page }) => {
  const setup = await openSetup(page)
  await approveHandoff(setup)
  await saveOnce(setup)

  for (const entry of ["newly saved", "reopened"]) {
    await expect(setup, entry).toHaveAttribute("data-phase", "credential_ready")
    await setup.getByRole("button", { name: "Previous step", exact: true }).click()
    await expect(setup, entry).toHaveCount(0)
    await expect(page.getByTestId("k-tour-id-methods")).toHaveCount(0)
    await expect(page.getByTestId("kpass-manage-setup")).toBeFocused()

    await page.getByTestId("kpass-manage-setup").click()
    await expect(setup).toHaveAttribute("data-phase", "credential_ready")
    await expect(setup).toHaveAttribute("data-method", "mobile_id")
    await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-issuance-count", "1")
    await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-status", "review-draft")
    await expect(setup.getByTestId("k-tour-id-methods")).toHaveCount(0)
  }
})

for (const action of ["decline", "cancel"] as const) test(`handoff ${action} restores the same method without a credential`, async ({ page }) => {
  const setup = await openSetup(page, "residence-card")
  await setup.getByTestId("k-tour-id-continue").click()
  await setup.getByTestId(`identity-handoff-${action}`).click()
  await noPass(page)
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup).toHaveAttribute("data-phase", "cancelled")
  await setup.getByTestId("identity-cancelled-restart").click()
  await expect(setup).toHaveAttribute("data-method", "mobile_residence_card")
  await expect(setup).toHaveAttribute("data-origin", "traveler_id")
  await expect(setup.getByTestId("k-tour-id-route-step")).toHaveAttribute("data-handoff-state", "ready")
  await approveHandoff(setup)
  await saveOnce(setup)
})

test("real sample timeout and a late approval cannot bypass retry", async ({ page }) => {
  const setup = await openSetup(page)
  await page.clock.install()
  await setup.getByTestId("k-tour-id-continue").click()
  await page.clock.fastForward(45_100)
  await expect(setup.getByTestId("k-tour-id-route-step")).toHaveAttribute("data-handoff-state", "timed_out")
  await expect(setup.getByTestId("identity-handoff-approve")).toHaveCount(0)
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("k-tour-id-failure")).toHaveAttribute("data-code", "PROVIDER_TIMEOUT")
  await noPass(page)
  await setup.getByTestId("k-tour-id-retry").click()
  await expect(setup).toHaveAttribute("data-method", "mobile_id")
  await approveHandoff(setup)
  await saveOnce(setup)
})

test("cancel at holder receipt preserves context; configured holder failure cannot create a receipt", async ({ page }) => {
  const setup = await openSetup(page, "mobile-id", "en", "holder_failed")
  await approveHandoff(setup)
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup).toHaveAttribute("data-phase", "failed")
  await expect(setup.getByTestId("identity-holder-receipt")).toHaveCount(0)
  await noPass(page)
  await setup.getByTestId("k-tour-id-retry").click()
  await setup.getByTestId("k-tour-id-continue").click()
  await setup.getByTestId("identity-holder-cancel").click()
  await noPass(page)
  await setup.getByTestId("identity-cancelled-restart").click()
  await expect(setup.getByTestId("k-tour-id-holder-delivery")).toHaveAttribute("data-holder-state", "ready")
  await saveOnce(setup)
})

test("passport permission, capture, NFC and face steps only advance by explicit sample choices", async ({ page }) => {
  const setup = await openSetup(page, "passport")
  await page.clock.install()
  const document = setup.getByTestId("k-tour-id-passport-document")
  await document.getByTestId("passport-ocr-start").click()
  await document.getByTestId("passport-demo-permission-deny").click()
  await expect(document).toHaveAttribute("data-ocr-stage", "denied")
  await noPass(page)
  await document.getByTestId("passport-demo-retry").click()
  await document.getByTestId("passport-demo-permission-allow").click()
  await page.clock.fastForward(2_000)
  await expect(document).toHaveAttribute("data-ocr-stage", "capture")
  await document.getByTestId("passport-demo-capture").click()
  await document.getByTestId("passport-demo-retake").click()
  await document.getByTestId("passport-demo-capture").click()
  await page.clock.fastForward(2_000)
  await expect(document).toHaveAttribute("data-ocr-stage", "checking")
  await document.getByTestId("passport-demo-nfc-read").click()
  await document.getByTestId("k-tour-id-continue").click()
  const face = setup.getByTestId("k-tour-id-passport-face")
  await face.getByTestId("passport-face-deny").click()
  await face.getByTestId("k-tour-id-continue").click()
  await face.getByTestId("k-tour-id-continue").click()
  await page.clock.fastForward(2_000)
  await expect(face).toHaveAttribute("data-face-stage", "capture")
  await face.getByTestId("k-tour-id-continue").click()
  await face.getByTestId("passport-face-retry").click()
  await face.getByTestId("k-tour-id-continue").click()
  await face.getByTestId("k-tour-id-continue").click()
  await expect(setup).toHaveAttribute("data-phase", "holder_delivery_preview")
  await noPass(page)
  await expect(setup.locator("input[type='file'], video")).toHaveCount(0)
  await saveOnce(setup)
})

test("identity demo visual and accessibility review at 320px", async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 320, height: 740 })
  const setup = await openSetup(page, "residence-card", "ko")
  const capture = async (name: string) => {
    expect(await setup.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await setup.screenshot({ path: testInfo.outputPath(`${name}.png`) })
  }
  const audit = async () => {
    const result = await new AxeBuilder({ page }).include("[data-testid='k-tour-id-setup']").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
  }
  const marks = await setup.locator("[role='list'] > [role='listitem'] > span").evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return rect.left + rect.width / 2 }))
  expect(Math.abs((marks[1] - marks[0]) - (marks[2] - marks[1]))).toBeLessThanOrEqual(1)
  await capture("handoff-ready-ko-320")
  await setup.getByTestId("k-tour-id-continue").click()
  await capture("handoff-demo-waiting-ko-320")
  await audit()
  await setup.getByTestId("identity-handoff-approve").click()
  await capture("handoff-approved-ko-320")
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup).toHaveAttribute("data-phase", "holder_delivery_preview")
  await setup.getByTestId("k-tour-id-continue").click()
  await capture("holder-receipt-ko-320")
  await audit()
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup).toHaveAttribute("data-phase", "credential_ready")
  await capture("sample-saved-ko-320")
})

test("passport demo visual and accessibility review at 430px", async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 430, height: 900 })
  const setup = await openSetup(page, "passport", "ja", "success", "dark")
  await setup.getByTestId("passport-ocr-start").click()
  await setup.screenshot({ path: testInfo.outputPath("passport-permission-ja-430.png") })
  await setup.getByTestId("passport-demo-permission-allow").click()
  await setup.screenshot({ path: testInfo.outputPath("passport-capture-ja-430.png") })
  await setup.getByTestId("passport-demo-capture").click()
  await setup.screenshot({ path: testInfo.outputPath("passport-nfc-ja-430.png") })
  const result = await new AxeBuilder({ page }).include("[data-testid='k-tour-id-setup']").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
  await setup.getByTestId("passport-demo-nfc-read").click()
  await setup.getByTestId("k-tour-id-continue").click()
  await setup.getByTestId("k-tour-id-continue").click()
  await setup.screenshot({ path: testInfo.outputPath("passport-face-ja-430.png") })
  expect(await setup.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
})
