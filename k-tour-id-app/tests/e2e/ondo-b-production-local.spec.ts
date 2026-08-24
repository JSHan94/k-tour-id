import { expect, test } from "@playwright/test"
import { CANONICAL_VENUE_ID, expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

const DEVICE_KEY = "ondo-b.device.v1"

async function seedProductionB(page: import("@playwright/test").Page, savedVenueIds: string[] = []) {
  await page.addInitScript(({ key, venueIds }) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({
        locale: "en",
        onboarding: "ONB-COMPLETE",
        discoveryPreferences: [],
        savedVenueIds: venueIds,
        privateNotesByVenue: {},
      }))
    }
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      paymentKyc: "PKY-VERIFIED",
      gate: { cta: "START_CHECKOUT" },
      tableMembershipById: { "table-seongsu-dinner": "confirmed" },
      reputation: { identity: "verified", visit: "repeat", contribution: "established", meetup: "established" },
      stamps: 10,
      profile: { displayName: "Daniel Kim" },
    }))
  }, { key: DEVICE_KEY, venueIds: savedVenueIds })
}

test.describe("ONDO B production local-device shell", () => {
  test.beforeEach(async ({ page }) => installBRuntimeGuard(page))
  test.afterEach(async ({ page }) => expectBRuntimeClean(page))

  test("B-PROD-E2E-001 synthetic session and QA query cannot expose external-product surfaces", async ({ page }) => {
    await seedProductionB(page)
    await page.goto("/ondo-b?qa=1&scenario=bridge-failed&profile=failure", { waitUntil: "domcontentloaded" })

    const nav = page.getByTestId("ondo-main-nav")
    await expect(nav.getByTestId("nav-ondo")).toContainText("Explore")
    await expect(nav.getByTestId("nav-my")).toContainText("Saved")
    await expect(nav.getByTestId("nav-id")).toContainText("Settings")
    await expect(nav.getByTestId("nav-tables")).toHaveCount(0)
    for (const testId of ["ondo-gate-overlay", "ondo-after19-layer", "tables-entry", "checkout-overlay", "labs-overlay", "ondo-identity-entry", "ondo-trust-panel"]) {
      await expect(page.getByTestId(testId)).toHaveCount(0)
    }

    await nav.getByTestId("nav-my").click()
    await expect(page.getByTestId("ondo-b-saved-entry")).toBeVisible()
    await expect(page.getByText(/stamp|trust|identity|KYC|Labs/i)).toHaveCount(0)
    await nav.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-b-settings-entry")).toBeVisible()
    await expect(page.getByText("Daniel Kim")).toHaveCount(0)
  })

  test("B-PROD-E2E-002 a private note persists locally and never creates activity state", async ({ page }) => {
    await seedProductionB(page, [CANONICAL_VENUE_ID])
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()

    const note = page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`)
    await note.getByRole("textbox").fill("Order at the counter before taking a seat.")
    await note.getByRole("button", { name: "Save private note" }).click()
    await expect(note.getByRole("status")).toContainText("Saved on this device")

    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`).getByRole("textbox"))
      .toHaveValue("Order at the counter before taking a seat.")
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DEVICE_KEY)
    expect(stored).not.toHaveProperty("account")
    expect(stored).not.toHaveProperty("reputation")
    expect(stored).not.toHaveProperty("stamps")
  })

  test("B-PROD-E2E-003 a real storage exception reports failure and keeps the draft", async ({ page }) => {
    await seedProductionB(page, [CANONICAL_VENUE_ID])
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    const note = page.getByTestId(`private-note-${CANONICAL_VENUE_ID}`)
    await note.getByRole("textbox").fill("Keep this draft")
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (name: string, value: string) {
        if (name === key) throw new DOMException("Quota exceeded", "QuotaExceededError")
        return original.call(this, name, value)
      }
    }, DEVICE_KEY)
    await note.getByRole("button", { name: "Save private note" }).click()
    await expect(note.getByRole("alert")).toContainText("could not be saved")
    await expect(note.getByRole("textbox")).toHaveValue("Keep this draft")
  })
})
