import { mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const EVIDENCE_DIR = resolve(process.cwd(), "artifacts/qa/warm-living-atlas")

type Locale = "en" | "ko" | "ja"

async function seed(page: Page, locale: Locale, active = false) {
  await page.addInitScript(({ key, nextLocale, venueId, activeState }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: "travelling",
      discoveryPreferences: [],
      savedVenueIds: activeState ? [venueId] : [],
      privateNotesByVenue: {},
      recentVenueIds: activeState ? [venueId] : [],
      plannedTableRefs: activeState ? [{ tableId: "table-seoul-night-bites", venueId }] : [],
      localSignalPostedVenueIds: activeState ? [venueId] : [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, nextLocale: locale, venueId: VENUE_ID, activeState: active })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function fresh(page: Page, locale: Locale) {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({ locale: nextLocale, onboarding: "ONB-NEW" }))
  }, { key: DEVICE_KEY, nextLocale: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: resolve(EVIDENCE_DIR, `${name}.png`), animations: "disabled" })
}

async function noHorizontalOverflow(page: Page) {
  expect(await page.locator("html").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
}

test.describe("Warm Living Atlas personal journey", () => {
  test.describe.configure({ timeout: 180_000 })
  test.beforeAll(() => mkdirSync(EVIDENCE_DIR, { recursive: true }))

  for (const locale of ["en", "ko", "ja"] as const) {
    test(`${locale} onboarding directly exposes all languages and a compact truth boundary`, async ({ page }) => {
      await page.setViewportSize({ width: locale === "ja" ? 390 : 320, height: locale === "ja" ? 844 : 800 })
      await fresh(page, locale)
      await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
      const control = page.getByTestId("onboarding-language-control")
      await expect(control).toBeVisible()
      await expect(control.locator("button")).toHaveCount(3)
      for (const button of await control.locator("button").all()) {
        expect((await button.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
      }
      await expect(page.getByTestId("onboarding-source-boundary")).not.toHaveAttribute("open", "")
      const value = page.getByTestId("onboarding-step-value")
      await expect(value.locator("button[data-onboarding-initial-focus]")).toBeInViewport()
      await noHorizontalOverflow(page)
      await shot(page, `${locale}-${locale === "ja" ? 390 : 320}-onboarding`)
    })
  }

  test("320px EN KO JA controls, truth disclosure, and localized nav stay inside the canvas", async ({ browser }) => {
    for (const locale of ["en", "ko", "ja"] as const) {
      const context = await browser.newContext({ viewport: { width: 320, height: 800 }, reducedMotion: "reduce" })
      const page = await context.newPage()
      await fresh(page, locale)
      await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
      const control = page.getByTestId("onboarding-language-control")
      const controlBox = await control.boundingBox()
      expect(controlBox?.x ?? -1).toBeGreaterThanOrEqual(0)
      expect((controlBox?.x ?? 321) + (controlBox?.width ?? 0)).toBeLessThanOrEqual(320)

      const source = page.getByTestId("onboarding-source-boundary")
      const summary = source.locator("summary")
      expect((await summary.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
      await summary.click()
      expect(await summary.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("none")
      await page.getByTestId("onboarding-guest-skip").click()
      await expect(page.getByTestId("ondo-main-nav")).toBeVisible()
      for (const item of await page.getByTestId("ondo-main-nav").locator("button").all()) {
        const box = await item.boundingBox()
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0)
        expect((box?.x ?? 321) + (box?.width ?? 0)).toBeLessThanOrEqual(320)
      }
      await noHorizontalOverflow(page)
      await context.close()
    }
  })

  test("JA mobile personal surfaces use a trip-first and native-group hierarchy", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, "ja", true)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-my").click()
    const my = page.getByTestId("ondo-b-my-korea-entry")
    await expect(my.locator(":scope > div > section").first()).toHaveAttribute("data-testid", "my-korea-planned")
    await shot(page, "ja-390-my-active")
    await page.getByTestId("nav-settings").click()
    await expect(page.getByTestId("settings-language-control").locator("button")).toHaveCount(3)
    await expect(page.getByTestId("ondo-b-discovery-settings")).not.toHaveAttribute("open", "")
    await expect(page.getByTestId("ondo-b-device-data-settings")).not.toHaveAttribute("open", "")
    await shot(page, "ja-390-settings")
    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("wallet-balance")).toContainText("OOKRW Test")
    await expect(page.getByTestId("travel-pass-status")).toBeAttached()
    await noHorizontalOverflow(page)
    await shot(page, "ja-390-id-wallet")
  })

  test("JA contextual benefit completes the honest test payment and refund journey", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, "ja")
    await page.goto(`/ondo-b?city=seoul&view=list&venueId=${VENUE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
    await page.getByTestId("canonical-meal-benefit-open").click()
    const offer = page.getByTestId("ondo-b-id-wallet-commerce")
    await expect(offer).toHaveAttribute("data-visual-direction", "apple-wallet-flow8")
    await shot(page, "ja-390-offer-recommended")
    await offer.getByTestId("benefit-accept").click()
    await offer.getByTestId("payment-confirm").click()
    const connect = page.getByTestId("wallet-connect-sheet")
    await connect.locator("button").nth(1).click()
    await expect(connect).toBeHidden()
    await offer.getByTestId("payment-minimum-consent").locator("input").check()
    await offer.getByTestId("payment-confirm").click()
    await expect(offer.getByTestId("payment-receipt")).toBeVisible()
    await shot(page, "ja-390-receipt")
    await offer.getByTestId("payment-receipt").locator("details summary").click()
    await offer.getByTestId("payment-refund").click()
    await expect(offer.getByTestId("payment-receipt")).toHaveAttribute("data-refunded", "true")
    await noHorizontalOverflow(page)
    await shot(page, "ja-390-refund")
  })

  test("JA 320 receipt and refund keep complete identifiers without horizontal overflow", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 320, height: 800 })
    await seed(page, "ja")
    await page.goto(`/ondo-b?city=seoul&view=list&venueId=${VENUE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
    await page.getByTestId("canonical-meal-benefit-open").click()
    const offer = page.getByTestId("ondo-b-id-wallet-commerce")
    await offer.getByTestId("benefit-accept").click()
    await offer.getByTestId("payment-confirm").click()
    await page.getByTestId("wallet-connect-sheet").locator("button").nth(1).click()
    await expect(page.getByTestId("wallet-connect-sheet")).toBeHidden()
    await offer.getByTestId("payment-minimum-consent").locator("input").check()
    await offer.getByTestId("payment-confirm").click()
    const receipt = offer.getByTestId("payment-receipt")
    await expect(receipt.getByText("ONDO-LOCAL-20260825-001", { exact: true })).toBeVisible()
    await noHorizontalOverflow(page)
    await receipt.locator("details summary").click()
    await receipt.getByTestId("payment-refund").click()
    await expect(receipt.getByText("ONDO-LOCAL-REFUND-20260825-001", { exact: true })).toBeVisible()
    for (const code of await receipt.locator("code").all()) {
      expect(await code.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
    }
    await noHorizontalOverflow(page)
    await shot(page, "ja-320-refund")
  })

  test("personal surfaces keep their composition at 320, short landscape, and desktop", async ({ browser }) => {
    for (const viewport of [
      { width: 320, height: 800, name: "en-320" },
      { width: 844, height: 390, name: "ja-844" },
      { width: 1440, height: 1000, name: "ja-1440" },
    ]) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" })
      const page = await context.newPage()
      await seed(page, viewport.name.startsWith("en") ? "en" : "ja", true)
      await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
      for (const [nav, name] of [["nav-my", "my"], ["nav-settings", "settings"], ["nav-id", "id-wallet"]] as const) {
        await page.getByTestId(nav).click()
        await noHorizontalOverflow(page)
        await shot(page, `${viewport.name}-${name}`)
      }
      await context.close()
    }
  })

  test("post-audit responsive priorities keep decisions ahead of editorial imagery", async ({ browser }) => {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" })
    const desktop = await desktopContext.newPage()
    await seed(desktop, "ja", true)
    await desktop.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await desktop.getByTestId("nav-tables").click()
    await desktop.mouse.move(900, 500)
    await expect(desktop.getByTestId("tables-editorial-image")).toBeInViewport()
    await expect(desktop.getByTestId("table-card-table-seoul-night-bites")).toBeInViewport()
    await expect(desktop.getByTestId("table-open-table-seoul-night-bites")).toBeInViewport()
    await desktop.getByTestId("nav-tables").blur()
    await expect.poll(() => desktop.getByTestId("nav-tables").locator("small").evaluate((node) => getComputedStyle(node).opacity)).toBe("0")
    await desktop.getByTestId("nav-my").hover()
    await expect.poll(() => desktop.getByTestId("nav-my").locator("small").evaluate((node) => getComputedStyle(node).opacity)).toBe("1")
    await desktop.mouse.move(900, 500)
    await expect.poll(() => desktop.getByTestId("nav-my").locator("small").evaluate((node) => getComputedStyle(node).opacity)).toBe("0")
    await noHorizontalOverflow(desktop)
    await shot(desktop, "ja-1440-tables-first-decision")
    await desktopContext.close()

    const landscapeContext = await browser.newContext({ viewport: { width: 844, height: 390 }, reducedMotion: "reduce" })
    const landscape = await landscapeContext.newPage()
    await seed(landscape, "ja")
    await landscape.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await landscape.getByTestId("nav-my").click()
    await expect(landscape.getByTestId("my-korea-empty-inspiration")).toBeHidden()
    await expect(landscape.getByTestId("my-korea-planned-empty")).toBeInViewport()
    const saved = landscape.getByTestId("ondo-b-saved-entry")
    await expect(saved).toBeInViewport()
    await expect(saved.locator("button")).toBeInViewport()
    await noHorizontalOverflow(landscape)
    await shot(landscape, "ja-844-my-empty-first-decision")
    await landscapeContext.close()

    const languageContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })
    const languagePage = await languageContext.newPage()
    await seed(languagePage, "ja")
    await languagePage.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    const switchToKorean = languagePage.getByRole("button", { name: "韓国語に切り替える" })
    await expect(switchToKorean).toHaveAttribute("data-language-target", "ko")
    await switchToKorean.click()
    await expect(languagePage.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", "ko")
    await languageContext.close()
  })
})
