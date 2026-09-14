import { expect, test, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

const VENUE = "mois-0021cd596bc5b2a922ad"
const KEY = "ondo-b.device.v1"
const NOTE = "Private final journey note: do not persist or publish."
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQ1sAAAAASUVORK5CYII=", "base64")

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

async function expectReadableSignal(page: Page) {
  const audit = await new AxeBuilder({ page })
    .include('[data-testid="ondo-b-local-signal"]')
    .withRules(["color-contrast"])
    .analyze()
  expect(audit.violations, "Local contribution text must remain readable in the selected theme").toEqual([])
}

async function approveSameDraft(page: Page) {
  await page.getByTestId("local-signal-person-check").click()
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toBeVisible()
  if (await gate.getAttribute("data-active-gate") === "account") {
    await gate.getByTestId("action-gate-confirm").click()
  }
  await expect(gate).toHaveAttribute("data-active-gate", "person")
  await expect(gate.getByTestId("action-gate-return-context")).toHaveAttribute("data-return-venue", VENUE)
  await gate.getByTestId("person-route-choice-mobile_id_cx").click()
  await gate.getByTestId("local-check-boundary-continue").click()
  await expect(gate).toBeHidden()
  await expect(page.getByTestId("local-signal-post")).toBeEnabled()
}

for (const scenario of [
  { width: 320, appearance: "dark", storageFault: true },
  { width: 390, appearance: "light", storageFault: false },
] as const) {
  test(`G03 public contribution saves only local evidence, deduplicates and restores history: ${scenario.width}px ${scenario.appearance}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: scenario.width, height: 844 })
    await page.emulateMedia({ colorScheme: scenario.appearance, reducedMotion: "reduce" })
    // Initial preferences only: no credential or action-result injection.
    await page.addInitScript(({ appearance }) => {
      if (!localStorage.getItem("ondo-b.device.v1")) localStorage.setItem("ondo-b.device.v1", JSON.stringify({
        locale: "en", appearancePreference: appearance, onboarding: "ONB-COMPLETE",
      }))
    }, scenario)
    await page.goto(`/?city=seoul&view=list&venueId=${VENUE}&detail=1`, { waitUntil: "domcontentloaded" })
    const place = page.getByTestId("canonical-place-overlay")
    await expect(place).toHaveAttribute("data-venue-id", VENUE)
    await place.getByTestId("canonical-local-signal-open").click()
    const signal = page.getByTestId("ondo-b-local-signal")
    await expect(signal).toHaveAttribute("data-venue-id", VENUE)
    await expectReadableSignal(page)
    await signal.getByTestId("local-signal-tag-calm_now").click()
    await signal.getByTestId("local-signal-note").fill(NOTE)
    const input = signal.getByTestId("local-signal-photo-input")
    await input.setInputFiles({ name: "private-pixel.png", mimeType: "image/png", buffer: PNG })
    const preview = signal.getByTestId("local-signal-photo-preview")
    await expect(preview).toBeVisible()
    await expect.poll(() => preview.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    const previewUrl = await preview.getAttribute("src")
    await input.setInputFiles({ name: "unsupported.txt", mimeType: "text/plain", buffer: Buffer.from("not a photo") })
    await expect(signal.getByTestId("local-signal-photo-error")).toHaveAttribute("data-error", "photoTypeError")
    await expect(preview).toHaveAttribute("src", previewUrl!)
    // While an error is shown, the visible recovery decision owns the photo
    // controls. Recover through its real picker before testing Remove.
    const [replacement] = await Promise.all([
      page.waitForEvent("filechooser"),
      signal.getByTestId("local-signal-photo-choose-another").click(),
    ])
    await replacement.setFiles({ name: "replacement.png", mimeType: "image/png", buffer: PNG })
    await expect(signal.getByTestId("local-signal-photo-error")).toHaveCount(0)
    await signal.getByTestId("local-signal-photo-remove").click()
    await expect(preview).toHaveCount(0)
    await input.setInputFiles({ name: "private-pixel.png", mimeType: "image/png", buffer: PNG })
    await expect(preview).toBeVisible()
    await approveSameDraft(page)
    if (scenario.storageFault) {
      // Controlled browser-storage fault, not a provider/result fixture.
      await page.evaluate(key => {
        const original = Storage.prototype.setItem
        let pending = true
        Storage.prototype.setItem = function (name, value) {
          if (this === localStorage && name === key && pending) {
            pending = false
            throw new DOMException("Prepared quota fault", "QuotaExceededError")
          }
          return original.call(this, name, value)
        }
      }, KEY)
      await signal.getByTestId("local-signal-post").click()
      await expect(signal.getByTestId("local-signal-post-error")).toBeVisible()
      await expect(signal.getByTestId("local-signal-note")).toHaveValue(NOTE)
      await expect(preview).toBeVisible()
      expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "{}").localSignalPostedVenueIds ?? [], KEY)).not.toContain(VENUE)
    }
    await signal.getByTestId("local-signal-post").click()
    await expect(signal.getByTestId("local-signal-result")).toHaveAttribute("data-result", "unique")
    await expectReadableSignal(page)
    await expect(signal.getByTestId("local-signal-return")).toBeInViewport()
    await page.screenshot({ path: testInfo.outputPath("local-contribution-saved.png") })
    const first = await page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "{}"), KEY)
    expect(first.localSignalPostedVenueIds.filter((id: string) => id === VENUE)).toHaveLength(1)
    expect(first.localPulseEvidenceByVenue[VENUE].tags).toEqual(["calm_now"])
    expect(JSON.stringify(first)).not.toContain(NOTE)
    expect(JSON.stringify(first)).not.toContain("blob:")
    expect(JSON.stringify(first)).not.toContain("private-pixel")
    await signal.getByTestId("local-signal-return").click()
    await expect(signal).toBeHidden()
    await expect(place).toHaveAttribute("data-venue-id", VENUE)

    await place.getByTestId("canonical-local-signal-open").click()
    await signal.getByTestId("local-signal-tag-calm_now").click()
    // The still-valid Person sample may satisfy the next request without
    // reopening consent. It must nevertheless bind a fresh action to this draft.
    await signal.getByTestId("local-signal-person-check").click()
    await expect(signal.getByTestId("local-signal-post")).toBeEnabled()
    await expect(page.getByTestId("ondo-b-action-gate")).toBeHidden()
    await signal.getByTestId("local-signal-post").click()
    await expect(signal.getByTestId("local-signal-result")).toHaveAttribute("data-result", "duplicate")
    await expectReadableSignal(page)
    expect(await page.evaluate(({ key, venue }) => JSON.parse(localStorage.getItem(key) ?? "{}").localPulseEvidenceByVenue[venue], { key: KEY, venue: VENUE })).toEqual(first.localPulseEvidenceByVenue[VENUE])
    await signal.getByTestId("local-signal-return").click()
    await place.getByRole("button", { name: "Close place", exact: true }).click()
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    const history = page.getByTestId(`contribution-venue-${VENUE}`)
    await expect(history).toBeVisible()
    await history.click()
    await expect(page.getByTestId("canonical-place-peek")).toHaveAttribute("data-venue-id", VENUE)
    expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  })
}
