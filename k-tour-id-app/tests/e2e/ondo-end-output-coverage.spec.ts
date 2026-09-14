import { expect, test, type Page } from "@playwright/test"
import { clickTravelPassAction, openKPassServices } from "../helpers/ondo-demo-journey"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

// Only public controls and ordinary file selection. No seeded account, claims,
// storage, private events, hidden QA objects, or intercepted success responses.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

async function guest(page: Page, baseURL: string | undefined, width = 390) {
  await page.setViewportSize({ width, height: 844 })
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("onboarding-guest-skip").click()
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-hydrated", "true")
}

async function openSetup(page: Page, method: "passport" | "mobile-id" | "residence-card" = "passport", outcome = "success") {
  await clickTravelPassAction(page, "traveler-id-ktour-id-open")
  await page.getByTestId(`ktour-id-route-${method}`).click()
  await chooseOutcome(page, outcome)
}

async function chooseOutcome(page: Page, outcome: string) {
  const controls = page.getByTestId("identity-sample-controls")
  await controls.locator("summary").click()
  await page.getByTestId("identity-sample-outcome").selectOption(outcome)
  await page.getByTestId("k-tour-id-consent-approve").click()
  await expect(page.getByTestId("k-tour-id-setup")).not.toHaveAttribute("data-phase", "consent")
}

async function advanceUntilStopped(page: Page) {
  const setup = page.getByTestId("k-tour-id-setup")
  for (let step = 0; step < 20; step++) {
    const phase = await setup.getAttribute("data-phase")
    // Advance only visible sample substeps; stop at every failure/recovery
    // decision without changing the selected outcome or accepting a denial.
    if (phase === "document_preview") {
      const document = setup.getByTestId("k-tour-id-passport-document")
      const stage = await document.getAttribute("data-ocr-stage")
      const controls: Record<string, string> = { sample: "passport-ocr-start", permission: "passport-demo-permission-allow", capture: "passport-demo-capture", checking: "passport-demo-nfc-read", review: "k-tour-id-continue" }
      if (!stage || !controls[stage]) throw new Error(`Unexpected passport sample stage: ${stage}`)
      await document.getByTestId(controls[stage]).click()
    } else if (phase === "cx_handoff_preview") {
      const handoff = setup.getByTestId("k-tour-id-route-step")
      const stage = await handoff.getAttribute("data-handoff-state")
      if (stage === "waiting") await handoff.getByTestId("identity-handoff-approve").click()
      else if (stage === "ready" || stage === "approved") await handoff.getByTestId("k-tour-id-continue").click()
      else throw new Error(`Unexpected ID handoff stage: ${stage}`)
    } else if (phase === "face_liveness_preview" || phase === "holder_delivery_preview") {
      await setup.getByTestId("k-tour-id-continue").click()
    } else if (phase === "provider_processing_preview") {
      await expect(setup).not.toHaveAttribute("data-phase", "provider_processing_preview")
    } else return phase
  }
  throw new Error("Identity sample did not reach a terminal/decision step")
}

async function approveManual(page: Page) {
  await expect(page.getByTestId("identity-manual-review")).toHaveAttribute("data-review-status", "pending")
  await page.getByTestId("identity-manual-check").click()
  await expect(page.getByTestId("identity-manual-review")).toHaveAttribute("data-review-status", "approved")
  await page.getByTestId("identity-manual-continue").click()
}

async function expectNoProofPromotion(page: Page) {
  await page.getByTestId("k-tour-id-return").click()
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
  await expect(page.getByTestId("traveler-id-person")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("traveler-id-age")).toHaveAttribute("data-status", "none")
  await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "none")
}

const cases = [
  ["cancelled", "passport", "cancelled"],
  ["method_unavailable", "residence-card", "unavailable"],
  ["app_missing", "mobile-id", "failed"],
  ["session_expired", "mobile-id", "expired"],
  ["nfc_unsupported", "passport", "failed"],
  ["document_read_failed", "passport", "failed"],
  ["unsupported_document", "passport", "failed"],
  ["document_auth_failed", "passport", "failed"],
  ["face_mismatch", "passport", "failed"],
  ["liveness_failed", "passport", "failed"],
  ["manual_review", "passport", "manual_review"],
  ["provider_timeout", "passport", "failed"],
  ["callback_invalid", "mobile-id", "failed"],
  ["issuer_failed", "mobile-id", "failed"],
  ["holder_failed", "mobile-id", "failed"],
] as const

for (const [outcome, method, stopped] of cases) {
  test(`G05 public ${outcome} sample preserves consent and completes a safe recovery`, async ({ page, baseURL }) => {
    test.setTimeout(60_000)
    await guest(page, baseURL)
    await page.getByTestId("nav-id").click()
    await openSetup(page, method, outcome)
    expect(await advanceUntilStopped(page)).toBe(stopped)
    await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "none")

    if (outcome === "manual_review") await approveManual(page)
    else if (outcome === "cancelled") {
      await page.getByTestId("identity-cancelled-restart").click()
      await page.getByTestId("ktour-id-route-mobile-id").click()
      await page.getByTestId("k-tour-id-consent-approve").click()
    } else if (outcome === "method_unavailable") {
      await page.getByTestId("k-tour-id-alternate-passport").click()
      await page.getByTestId("k-tour-id-consent-approve").click()
    } else {
      await page.getByTestId("k-tour-id-retry").click()
      if (["app_missing", "unsupported_document", "document_auth_failed"].includes(outcome)) {
        await page.getByTestId("ktour-id-route-mobile-id").click()
        await page.getByTestId("k-tour-id-consent-approve").click()
      } else if (outcome === "nfc_unsupported") await approveManual(page)
      else if (outcome === "session_expired" || outcome === "callback_invalid") await page.getByTestId("k-tour-id-consent-approve").click()
    }
    expect(await advanceUntilStopped(page)).toBe("credential_ready")
    await expect(page.getByTestId("k-tour-id-credential")).toHaveAttribute("data-status", "review-draft")
    await expectNoProofPromotion(page)
  })
}

test("G05 manual review decline and additional information never issue a pass prematurely", async ({ page, baseURL }, testInfo) => {
  await guest(page, baseURL, 320)
  await page.getByTestId("nav-id").click()
  await openSetup(page, "passport", "manual_review")
  expect(await advanceUntilStopped(page)).toBe("manual_review")
  const select = page.getByTestId("identity-manual-outcome")
  await select.locator("../..").locator("summary").click()
  await select.selectOption("declined")
  await page.getByTestId("identity-manual-check").click()
  await expect(page.getByTestId("identity-manual-review")).toHaveAttribute("data-review-status", "declined")
  await expect(page.getByTestId("identity-manual-continue")).toHaveCount(0)
  await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "none")
  await page.getByTestId("identity-manual-new-request").click()
  await page.getByTestId("ktour-id-route-passport").click()
  await chooseOutcome(page, "manual_review")
  expect(await advanceUntilStopped(page)).toBe("manual_review")
  await select.locator("../..").locator("summary").click()
  await select.selectOption("needs_info")
  await page.getByTestId("identity-manual-check").click()
  await expect(page.getByTestId("identity-manual-review")).toHaveAttribute("data-review-status", "needs_info")
  await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "none")
  await page.screenshot({ path: testInfo.outputPath("manual-needs-info-320.png") })
  await page.getByTestId("identity-manual-add-info").click()
  expect(await advanceUntilStopped(page)).toBe("manual_review")
  await approveManual(page)
  expect(await advanceUntilStopped(page)).toBe("credential_ready")
  await expectNoProofPromotion(page)
})

test("G05 revoked pass remains denied through recovery cancellation and changes only after new holder completion", async ({ page, baseURL }, testInfo) => {
  await guest(page, baseURL)
  await page.getByTestId("nav-id").click()
  await page.getByTestId("kpass-sample-picker").click()
  await page.getByTestId("kpass-scenario-revoked").click()
  await expect(page.getByTestId("kpass-scenario-revoked")).toHaveCount(0)
  await clickTravelPassAction(page, "traveler-id-ktour-id-open")
  await page.getByTestId("identity-recovery-open").click()
  await page.getByTestId("identity-recovery-start").click()
  await expect(page.getByTestId("ktour-id-route-mobile-id")).toHaveCount(0)
  await page.getByTestId("ktour-id-route-passport").click()
  await chooseOutcome(page, "holder_failed")
  expect(await advanceUntilStopped(page)).toBe("failed")
  await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "revoked")
  await page.screenshot({ path: testInfo.outputPath("old-revoked-pass-during-recovery.png") })
  await page.getByTestId("k-tour-id-cancel").click()
  await expect(page.getByTestId("kpass-service-person")).toHaveAttribute("data-status", "denied")
  await clickTravelPassAction(page, "traveler-id-ktour-id-open")
  await page.getByTestId("identity-recovery-open").click()
  await page.getByTestId("identity-recovery-start").click()
  await page.getByTestId("ktour-id-route-passport").click()
  await page.getByTestId("k-tour-id-consent-approve").click()
  expect(await advanceUntilStopped(page)).toBe("credential_ready")
  await expectNoProofPromotion(page)
  await expect(page.getByTestId("kpass-service-person")).toHaveAttribute("data-status", "allowed")
  await clickTravelPassAction(page, "traveler-id-ktour-id-open")
  await page.getByTestId("identity-lifecycle-controls").locator("summary").click()
  await page.getByTestId("identity-device-recovery-open").click()
  await expect(page.getByTestId("identity-recovery-intro")).toHaveAttribute("data-recovery-kind", "device")
  await page.getByTestId("k-tour-id-cancel").click()
  await expect(page.getByTestId("kpass-service-person")).toHaveAttribute("data-status", "allowed")
})

test("G05 late manual status callback cannot issue after dismissal and provider inspection stays closed", async ({ page, baseURL }) => {
  await guest(page, baseURL)
  await page.getByTestId("nav-id").click()
  await openSetup(page, "passport", "manual_review")
  expect(await advanceUntilStopped(page)).toBe("manual_review")
  await page.getByTestId("identity-manual-check").click()
  await page.getByTestId("k-tour-id-cancel").click()
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
  await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "none")
  await clickTravelPassAction(page, "traveler-id-ktour-id-open")
  await expect(page.getByTestId("k-tour-id-setup")).toHaveAttribute("data-phase", "method_select")
  await page.goto(`${baseURL}/?review=0`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-id").click()
  await clickTravelPassAction(page, "traveler-id-ktour-id-open")
  await page.getByTestId("ktour-id-route-mobile-id").click()
  await expect(page.getByTestId("k-tour-id-unavailable")).toBeVisible()
  await expect(page.getByTestId("identity-sample-controls")).toHaveCount(0)
  await expect(page.getByTestId("identity-lifecycle-controls")).toHaveCount(0)
})

test("G08 public Table completes photo, arrival, feedback, report, block and leave", async ({ page, baseURL }, testInfo) => {
  test.setTimeout(65_000)
  await guest(page, baseURL)
  await page.getByTestId("nav-id").click()
  await page.getByTestId("kpass-sample-picker").click()
  await page.getByTestId("kpass-scenario-adult_visitor").click()
  await expect(page.getByTestId("kpass-scenario-adult_visitor")).toHaveCount(0)
  await page.getByTestId("nav-tables").click()
  await page.getByTestId("table-open-table-seoul-night-bites").click()
  await expect(page.getByTestId("table-chat")).toHaveCount(0)
  await page.getByTestId("table-join-draft").fill("Prepared sample meetup note")
  await page.getByTestId("table-join").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveAttribute("data-active-gate", "account")
  await page.getByTestId("action-gate-confirm").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveAttribute("data-active-gate", "age")
  await page.getByTestId("after19-start").click()
  await page.getByTestId("table-join-confirm").click()
  await page.getByTestId("table-open-chat").click()
  await page.getByTestId("table-chat-image").setInputFiles({ name: "sample-pixel.png", mimeType: "image/png", buffer: PNG })
  await page.getByTestId("table-chat-compose").fill("Meet at the sample entrance.")
  await page.getByTestId("table-message-send").click()
  await expect(page.getByTestId("table-message").last()).toHaveAttribute("data-state", "sent")
  await page.getByTestId("table-check-in").click()
  await expect(page.getByTestId("table-check-in")).toHaveAttribute("data-arrival-state", "completed")
  await page.getByTestId("table-detail").getByRole("button", { name: "Helpful table", exact: true }).click()
  await page.getByTestId("table-feedback-submit").click()
  await expect(page.getByTestId("table-reputation-receipt")).toBeVisible()
  await page.getByTestId("table-report").click()
  await page.getByTestId("table-report-reason-other").check()
  await page.getByTestId("table-report-confirm").click()
  await expect(page.getByTestId("table-report-receipt")).toContainText("Saved only on this device")
  await page.getByTestId("table-block").click()
  await page.getByTestId("table-block-confirm").click()
  await page.getByTestId("table-block-undo").click()
  await page.screenshot({ path: testInfo.outputPath("table-photo-feedback-safety-390.png") })
  await page.getByTestId("table-leave").click()
  await page.getByTestId("table-leave-confirm").click()
  await expect(page.getByTestId("table-chat")).toHaveCount(0)
  await expect(page.getByTestId("table-join")).toBeVisible()
})

test("G13 public theme, language and delete cancellation preserve guest access", async ({ page, baseURL }, testInfo) => {
  await guest(page, baseURL, 320)
  await page.getByTestId("nav-settings").click()
  await page.getByTestId("settings-appearance-row").click()
  await page.getByTestId("settings-appearance-dark").click()
  await page.getByRole("dialog", { name: "Appearance", exact: true }).getByRole("button", { name: "Close", exact: true }).click()
  await page.getByTestId("settings-language-row").click()
  await page.getByTestId("settings-language-control").getByRole("radio", { name: "한국어", exact: true }).click()
  await page.getByRole("dialog", { name: "언어", exact: true }).getByRole("button", { name: "닫기", exact: true }).click()
  await page.getByTestId("ondo-b-device-data-settings").click()
  await page.getByTestId("ondo-b-clear-device-open").click()
  await expect(page.getByTestId("ondo-b-clear-device-confirm")).toBeVisible()
  await page.getByRole("button", { name: "유지", exact: true }).click()
  await expect(page.getByTestId("ondo-b-clear-device-confirm")).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath("settings-dark-ko-320.png") })
  await page.getByRole("dialog", { name: "개인정보·데이터", exact: true }).getByRole("button", { name: "닫기", exact: true }).click()
  await page.getByTestId("nav-ondo").click()
  await expect(page.getByTestId("ondo-b-map-entry")).toBeVisible()
  await expect(page.getByTestId("k-tour-id-setup")).toHaveCount(0)
})

test("G05 renewal cannot reset a sample's age, stay, allowance or used benefit", async ({ page, baseURL }) => {
  test.setTimeout(90_000)
  await guest(page, baseURL)
  await page.getByTestId("nav-id").click()
  for (const [scenario, service, decision] of [
    ["under_age", "age", "denied"], ["age_unknown", "age", "needs_proof"],
    ["stay_expired", "visitor_benefit", "expired"], ["limit_reached", "payment", "needs_proof"],
    ["benefit_used", "visitor_benefit", "denied"],
  ] as const) {
    await page.getByTestId("kpass-sample-picker").click()
    await page.getByTestId(`kpass-scenario-${scenario}`).click()
    await expect(page.getByTestId(`kpass-scenario-${scenario}`)).toHaveCount(0)
    await openKPassServices(page)
    const card = page.getByTestId("kpass-service-card")
    const before = await card.innerText()
    if (scenario === "limit_reached") expect(before).toContain("₩0")
    await expect(page.getByTestId(`kpass-service-${service}`)).toHaveAttribute("data-status", decision)
    await clickTravelPassAction(page, "traveler-id-ktour-id-open")
    await page.getByTestId("identity-lifecycle-controls").locator("summary").click()
    await page.getByTestId("identity-renew-open").click()
    await page.getByTestId("identity-recovery-start").click()
    await expect(page.getByTestId("ktour-id-route-mobile-id")).toHaveCount(0)
    await page.getByTestId("ktour-id-route-passport").click()
    await page.getByTestId("k-tour-id-consent-approve").click()
    expect(await advanceUntilStopped(page)).toBe("credential_ready")
    await expectNoProofPromotion(page)
    await expect(page.getByTestId(`kpass-service-${service}`)).toHaveAttribute("data-status", decision)
    expect(await card.innerText()).toBe(before)
  }
})

test("G04 public connection error keeps the exact saved-place action through retry", async ({ page, baseURL }) => {
  test.setTimeout(60_000)
  await guest(page, baseURL)
  await page.goto(`${baseURL}/?city=seoul&view=list`, { waitUntil: "domcontentloaded" })
  const row = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] > button").first()
  await row.click()
  await page.getByTestId("canonical-place-details").click()
  const detail = page.getByTestId("canonical-place-overlay")
  await expect(detail).toBeVisible()
  const venue = await detail.getAttribute("data-venue-id")
  const location = page.url()
  await page.getByTestId("canonical-venue-save").click()
  const gate = page.getByTestId("account-save-gate")
  const fail = page.getByTestId("account-sample-connection-failure")
  await fail.locator("..").locator("summary").click()
  await fail.click()
  await expect(gate).toHaveAttribute("data-gate-view", "failure")
  await expect(gate).toHaveAttribute("data-account-return-venue", venue!)
  await page.getByTestId("gate-retry").click()
  await page.getByTestId("account-start").click()
  await expect(gate).toHaveCount(0)
  await expect(detail).toHaveAttribute("data-venue-id", venue!)
  await expect(page).toHaveURL(location)
  await expect(page.getByTestId("canonical-venue-save")).toContainText("Remove from Saved")
})

async function openAccountServices(page: Page) {
  await page.getByTestId("nav-settings").click()
  await page.getByTestId("ondo-b-device-data-settings").click()
  await page.getByTestId("account-services-open").click()
  await expect(page.getByTestId("account-services-sample")).toBeVisible()
}

test("G13 account query survives both sheet unmount and page reload without creating another request", async ({ page, baseURL }) => {
  await guest(page, baseURL)
  await openAccountServices(page)
  const select = page.getByTestId("account-services-outcome")
  await select.locator("..").locator("summary").click()
  await select.selectOption("unknown")
  await page.getByTestId("account-services-submit").click()
  const panel = page.getByTestId("account-services-sample")
  await expect(panel).toHaveAttribute("data-phase", "unknown")
  const id = await panel.getAttribute("data-operation-id")
  await page.keyboard.press("Escape")
  await expect(panel).toHaveCount(0)
  await expect(page.getByTestId("account-services-open")).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Privacy & data", exact: true })).toHaveCount(0)
  await openAccountServices(page)
  await expect(panel).toHaveAttribute("data-phase", "unknown")
  await expect(panel).toHaveAttribute("data-operation-id", id!)
  await expect(page.getByTestId("account-services-export")).toHaveCount(0)
  await page.reload({ waitUntil: "domcontentloaded" })
  await openAccountServices(page)
  await expect(panel).toHaveAttribute("data-phase", "unknown")
  await expect(panel).toHaveAttribute("data-operation-id", id!)
  await expect(page.getByTestId("account-services-submit")).toHaveText("Check request")
  await page.getByTestId("account-services-submit").click()
  await expect(panel).toHaveAttribute("data-phase", "done")
  await expect(panel).toHaveAttribute("data-operation-id", id!)
})

// Fault injection below only denies a browser write. It never creates a success
// response, seeds business state, or bypasses a public verification step.
async function failOneTerminalJournalWrite(page: Page, key: string, terminal: string) {
  await page.evaluate(({ key, terminal }) => {
    const original = Storage.prototype.setItem
    let armed = true
    Storage.prototype.setItem = function (name, value) {
      if (armed && this === window.sessionStorage && name === key && JSON.parse(value).phase === terminal) {
        armed = false
        throw new DOMException("Prepared storage fault", "QuotaExceededError")
      }
      return original.call(this, name, value)
    }
  }, { key, terminal })
}

test("G13 storage fault after a public account result keeps the same request and offers a working save retry", async ({ page, baseURL }) => {
  await guest(page, baseURL, 320)
  await openAccountServices(page)
  await page.getByTestId("account-services-revoke").click()
  await failOneTerminalJournalWrite(page, "ondo-b.account-services-sample.v1", "done")
  await page.getByTestId("account-services-submit").click()
  const panel = page.getByTestId("account-services-sample")
  await expect(page.getByTestId("account-services-storage-error")).toBeVisible()
  await expect(panel).toHaveAttribute("data-phase", "pending")
  const id = await panel.getAttribute("data-operation-id")
  await expect(page.getByTestId("account-services-storage-retry")).toBeEnabled()
  await page.getByTestId("account-services-storage-retry").click()
  await expect(panel).toHaveAttribute("data-phase", "done")
  await expect(panel).toHaveAttribute("data-operation-id", id!)
  await expect(panel).toContainText("Signed out")
  await expect(page.getByTestId("account-services-storage-error")).toHaveCount(0)
})

test("G08 reservation and cancellation result-save faults never leave an unrecoverable pending CTA", async ({ page, baseURL }) => {
  await guest(page, baseURL, 320)
  await page.getByTestId("nav-tables").click()
  await page.getByTestId("tables-reservation-open").click()
  await failOneTerminalJournalWrite(page, "ondo-b.reservation-sample.v1", "confirmed")
  await page.getByTestId("reservation-submit").click()
  const panel = page.getByTestId("reservation-sample")
  await expect(page.getByTestId("reservation-storage-error")).toBeVisible()
  await expect(panel).toHaveAttribute("data-phase", "requesting")
  const id = await panel.getAttribute("data-operation-id")
  await expect(page.getByTestId("reservation-storage-retry")).toBeEnabled()
  await page.getByTestId("reservation-storage-retry").click()
  await expect(panel).toHaveAttribute("data-phase", "confirmed")
  await expect(panel).toHaveAttribute("data-operation-id", id!)
  await failOneTerminalJournalWrite(page, "ondo-b.reservation-sample.v1", "cancelled")
  await page.getByTestId("reservation-cancel").click()
  await page.getByTestId("reservation-confirm-cancel").click()
  await expect(page.getByTestId("reservation-storage-error")).toBeVisible()
  await expect(panel).toHaveAttribute("data-phase", "cancelling")
  await page.getByTestId("reservation-storage-retry").click()
  await expect(panel).toHaveAttribute("data-phase", "cancelled")
  await expect(panel).toHaveAttribute("data-operation-id", id!)
})
