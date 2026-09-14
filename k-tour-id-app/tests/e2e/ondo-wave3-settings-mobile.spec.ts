import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  B_ACCOUNT_KEY,
  B_DEVICE_KEY,
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const PORTRAIT = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
] as const
const LANDSCAPE = { width: 844, height: 390 } as const

async function openSettings(page: Page) {
  await page.getByTestId("nav-settings").click()
  const settings = page.getByTestId("ondo-b-settings-entry")
  await expect(settings).toBeVisible()
  return settings
}

async function expectNoHorizontalOverflow(page: Page, target: Locator) {
  expect(await page.locator("html").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  expect(await target.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
}

test.describe("Wave 3 · Settings · mobile acceptance", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    await expectBRuntimeClean(page, testInfo)
  })

  test("W3-SET-MOBILE-001 root is one compact title and four whole-row decisions", async ({ page }) => {
    await seedB(page, {
      local: { discoveryPreferences: ["classic", "late", "halal"] },
    })
    await gotoB(page)
    const settings = await openSettings(page)

    for (const viewport of [...PORTRAIT, LANDSCAPE]) {
      await page.setViewportSize(viewport)
      await expect(settings.getByRole("heading", { level: 1, name: "Settings", exact: true })).toBeVisible()
      await expect(settings.locator(":scope > div").getByRole("button")).toHaveCount(4)
      await expect(settings.getByTestId("settings-language-row")).toContainText("English")
      await expect(settings.getByTestId("settings-appearance-row")).toContainText("System")
      await expect(settings.getByTestId("ondo-b-discovery-settings")).toContainText("Local classics")
      await expect(settings.getByTestId("ondo-b-discovery-settings")).toContainText("Halal")
      await expect(settings.getByTestId("ondo-b-discovery-settings")).not.toContainText("Late-night food")
      await expect(settings.getByTestId("ondo-b-device-data-settings")).toContainText(/\d+ categories?/)
      await expectNoHorizontalOverflow(page, settings)
    }

    await expect(page.getByTestId("settings-language-control")).toHaveCount(0)
  })

  test("W3-SET-MOBILE-002 language switches atomically, keeps its sheet open, and persists", async ({ page }) => {
    await seedB(page, { locale: "en" })
    await gotoB(page)
    await openSettings(page)
    await page.getByTestId("settings-language-row").click()

    let languageSheet = page.getByRole("dialog", { name: "Language", exact: true })
    await expect(languageSheet).toBeVisible()
    await expect(languageSheet.getByRole("radio", { name: "English", exact: true })).toHaveAttribute("aria-checked", "true")
    const originalSheet = await languageSheet.elementHandle()
    if (!originalSheet) throw new Error("The language sheet must be mounted before switching locales")
    // Updating copy must preserve the existing modal, not close and reopen it.
    for (const choice of [
      { locale: "ja", label: "言語", option: "日本語" },
      { locale: "ko", label: "언어", option: "한국어" },
      { locale: "en", label: "Language", option: "English" },
      { locale: "ja", label: "言語", option: "日本語" },
    ]) {
      await languageSheet.getByRole("radio", { name: choice.option, exact: true }).click()
      languageSheet = page.getByRole("dialog", { name: choice.label, exact: true })
      await expect(languageSheet).toBeVisible()
      expect(await languageSheet.evaluate((node, original) => node === original, originalSheet)).toBe(true)
      await expect(languageSheet.getByRole("radio", { name: choice.option, exact: true })).toHaveAttribute("aria-checked", "true")
      await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", choice.locale)
    }

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", "ja")
    await openSettings(page)
    await expect(page.getByTestId("settings-language-row")).toContainText("日本語")
  })

  test("W3-SET-MOBILE-002A appearance persists independently from After 19", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { local: { appearancePreference: "system" } })
    await gotoB(page)
    await openSettings(page)
    await page.getByTestId("settings-appearance-row").click()

    const appearanceSheet = page.getByRole("dialog", { name: "Appearance", exact: true })
    await expect(appearanceSheet).toBeVisible()
    await appearanceSheet.getByRole("radio", { name: "Dark", exact: true }).click()
    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-appearance", "dark")
    await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", "dark")
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").appearancePreference, B_DEVICE_KEY)).toBe("dark")

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-appearance", "dark")
    await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", "dark")
    await openSettings(page)
    await expect(page.getByTestId("settings-appearance-row")).toContainText("Dark")
  })

  test("W3-SET-MOBILE-003 preference edits stay draft-only until Save", async ({ page }) => {
    await seedB(page, { local: { discoveryPreferences: ["classic", "late"] } })
    await gotoB(page)
    await openSettings(page)

    await page.getByTestId("ondo-b-discovery-settings").click()
    let sheet = page.getByRole("dialog", { name: "Discovery preferences", exact: true })
    await expect(sheet.getByTestId("settings-preference-late")).toHaveCount(0)
    await expect(sheet.getByTestId("settings-preference-lively")).toHaveCount(0)
    await expect(sheet.getByTestId("settings-preference-calm")).toHaveCount(0)
    await sheet.getByTestId("settings-preference-cafe").click()
    await expect(sheet.getByTestId("settings-preferences-save")).toBeEnabled()
    await sheet.getByRole("button", { name: "Close", exact: true }).click()
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").discoveryPreferences, B_DEVICE_KEY)).toEqual(["classic", "late"])

    await page.getByTestId("ondo-b-discovery-settings").click()
    sheet = page.getByRole("dialog", { name: "Discovery preferences", exact: true })
    await expect(sheet.getByTestId("settings-preference-cafe")).toHaveAttribute("aria-pressed", "false")
    await sheet.getByTestId("settings-preference-cafe").click()
    await sheet.getByTestId("settings-preference-halal").click()
    await sheet.getByTestId("settings-preferences-save").click()

    await expect(page.getByRole("dialog", { name: "Discovery preferences", exact: true })).toHaveCount(0)
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").discoveryPreferences, B_DEVICE_KEY)).toEqual(["classic", "cafe", "late", "halal"])
    const summary = page.getByTestId("ondo-b-discovery-settings")
    await expect(summary).toContainText("Local classics")
    await expect(summary).toContainText("Cafés and dessert")
    await expect(summary).toContainText("+1")
    await expect(summary).not.toContainText("Late-night food")

    await summary.click()
    sheet = page.getByRole("dialog", { name: "Discovery preferences", exact: true })
    await sheet.getByTestId("settings-preferences-clear").click()
    await sheet.getByTestId("settings-preferences-save").click()
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").discoveryPreferences, B_DEVICE_KEY)).toEqual(["late"])
    await expect(page.getByTestId("ondo-b-discovery-settings")).toContainText("All places")
  })

  test("W3-SET-MOBILE-003A a guest taste changes Map presentation without an identity intent", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, {
      local: {
        onboarding: "ONB-COMPLETE",
        persona: null,
        discoveryArea: "seoul",
        discoveryPreferences: ["classic"],
      },
    })
    await gotoB(page)
    const map = page.getByTestId("ondo-b-map-entry")
    await expect(map).toHaveAttribute("data-city", "seoul")
    await expect(map).toHaveAttribute("data-persona", "none")
    await expect(map).toHaveAttribute("data-personalized-match-count", /[1-9]\d*/)
  })

  test("W3-SET-MOBILE-004 privacy is sanitized and keeps readiness axes independent", async ({ page }) => {
    await seedB(page, {
      session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED" },
      local: { savedVenueIds: ["mois-0021cd596bc5b2a922ad"], discoveryPreferences: ["classic"] },
    })
    await gotoB(page, "?qa=1")
    await openSettings(page)
    await page.getByTestId("ondo-b-device-data-settings").click()
    const sheet = page.getByRole("dialog", { name: "Privacy & data", exact: true })
    await expect(sheet).toContainText("Saved only on this device")
    for (const axis of ["Account", "Person", "19+", "Payment", "K-Tour ID"]) {
      await expect(sheet.getByText(axis, { exact: true })).toHaveCount(1)
    }
    await expect(sheet).toContainText("Ready")
    await expect(sheet).toContainText("Not set")
    await expect(sheet).not.toContainText(/provider|fixture|storage key|credential payload/i)
    await expectNoHorizontalOverflow(page, sheet)
  })

  test("W3-SET-MOBILE-005 failed deletion restores the full snapshot and reports unchanged truth", async ({ page }) => {
    await seedB(page, {
      session: { account: "ACC-ACTIVE" },
      local: { savedVenueIds: ["mois-0021cd596bc5b2a922ad"], discoveryPreferences: ["classic"] },
    })
    await gotoB(page)
    await page.evaluate(() => {
      sessionStorage.setItem("ondo-b.labs.v1", "preserve-me")
      const originalRemove = Storage.prototype.removeItem
      Object.defineProperty(window.sessionStorage, "removeItem", {
        configurable: true,
        value(key: string) {
          if (key === "ondo-b.labs.v1") throw new DOMException("blocked", "SecurityError")
          return originalRemove.call(this, key)
        },
      })
    })
    await openSettings(page)
    await page.getByTestId("ondo-b-device-data-settings").click()
    await page.getByTestId("ondo-b-clear-device-open").click()
    const confirmation = page.getByTestId("ondo-b-clear-device-confirm")
    const confirmationSheet = page.getByRole("dialog", { name: "Delete saved data?", exact: true })
    await expect(confirmationSheet.getByRole("button", { name: "Keep data", exact: true })).toBeFocused()
    await confirmationSheet.getByRole("button", { name: "Delete saved data", exact: true }).click()
    await expect(confirmation.getByTestId("ondo-b-clear-device-error")).toContainText("Nothing changed")
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").savedVenueIds, B_DEVICE_KEY)).toEqual(["mois-0021cd596bc5b2a922ad"])
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo-b.labs.v1"))).toBe("preserve-me")
    await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").account, B_ACCOUNT_KEY)).toBe("ACC-ACTIVE")
  })

  test("W3-SET-MOBILE-006 successful deletion preserves language and travel intent only", async ({ page }) => {
    await seedB(page, {
      locale: "ja",
      session: { account: "ACC-ACTIVE", persona: "preparing" },
      local: {
        appearancePreference: "dark",
        persona: "preparing",
        discoveryPreferences: ["classic", "late"],
        savedVenueIds: ["mois-0021cd596bc5b2a922ad"],
        accountSaveTransaction: { venueId: "mois-0021cd596bc5b2a922ad" },
        accountSaveRecoveryBlocked: true,
      },
    })
    await gotoB(page)
    await openSettings(page)
    await page.getByTestId("ondo-b-device-data-settings").click()
    await page.getByTestId("ondo-b-clear-device-open").click()
    await page.getByRole("dialog", { name: "保存データを削除しますか？", exact: true }).getByRole("button", { name: "保存データを削除", exact: true }).click()

    await expect(page.getByTestId("ondo-b-clear-device-confirm")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-device-data-settings")).toBeFocused()
    await expect.poll(() => page.evaluate((key) => {
      const device = JSON.parse(localStorage.getItem(key) ?? "{}")
      return {
        locale: device.locale,
        appearance: device.appearancePreference,
        persona: device.persona,
        preferences: device.discoveryPreferences,
        saved: device.savedVenueIds,
        transaction: device.accountSaveTransaction ?? null,
        recoveryBlocked: device.accountSaveRecoveryBlocked ?? false,
      }
    }, B_DEVICE_KEY)).toEqual({ locale: "ja", appearance: "dark", persona: "short_trip", preferences: [], saved: [], transaction: null, recoveryBlocked: false })
  })
})
