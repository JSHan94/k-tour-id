import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const PREFERENCE_KEY = "ondo-b.after19.preferences.v1"
const SESSION_KEY = "ondo-b.after19.session.v1"
const SESSION_EVENT = "ondo-b-after19-session-change"

async function seedGlobalAfter19(page: Page, {
  autoOpen = false,
  age = "unverified",
  ageExpiresAt = null,
  mode = "off",
  activation = null,
}: {
  autoOpen?: boolean
  age?: "unverified" | "eligible"
  ageExpiresAt?: string | null
  mode?: "off" | "on" | "manual-off"
  activation?: "manual" | "auto" | null
} = {}) {
  await page.addInitScript(({ preferenceKey, sessionKey, preference, session }) => {
    if (localStorage.getItem(preferenceKey) === null) localStorage.setItem(preferenceKey, JSON.stringify(preference))
    if (sessionStorage.getItem(sessionKey) === null) sessionStorage.setItem(sessionKey, JSON.stringify(session))
  }, {
    preferenceKey: PREFERENCE_KEY,
    sessionKey: SESSION_KEY,
    preference: { version: 1, autoOpen },
    session: { version: 1, age, ageExpiresAt, mode, activation, expiryNotice: false },
  })
}

async function openSeoul(page: Page) {
  await gotoB(page, "?city=seoul")
  await expect(page.getByTestId("ondo-b-city-header").getByRole("heading", { level: 1 })).toBeVisible()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-selected-venue-id", "none")
}

async function expectNoBlockingAxe(page: Page, scope: Locator) {
  const selector = await scope.evaluate((element) => {
    if (!element.id) element.id = `after19-${Math.random().toString(36).slice(2)}`
    return `#${CSS.escape(element.id)}`
  })
  const result = await new AxeBuilder({ page }).include(selector).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([])
}

test.describe("ONDO B global Manual and Auto After19", () => {
  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  test("FL-013 manual prompt preserves city/filter context through cancel, failure, retry, success and immediate off", async ({ page }) => {
    await seedGlobalAfter19(page)
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await openSeoul(page)
    const map = page.getByTestId("ondo-b-map-entry")
    const search = page.getByTestId("ondo-b-search")
    await search.fill("barbecue")

    const opener = page.getByTestId("global-after19-toggle")
    await opener.click()
    const gate = page.getByTestId("global-after19-prompt-layer")
    await expect(gate).toBeVisible()
    await expect(gate.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-city", "seoul")
    await expect(gate.getByTestId("global-after19-return-context")).toContainText("Seoul")
    await expect(gate).toContainText("Narrows this map to pubs and cafés. Actual entry, age and alcohol-service rules are not confirmed.")
    await expect(gate.getByTestId("global-after19-confirm")).toBeFocused()
    await expect(page.getByTestId("maplibre-map")).toHaveAttribute("inert", "")
    await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("inert", "")
    await expectNoBlockingAxe(page, gate)

    await page.keyboard.press("Escape")
    await expect(gate).toHaveCount(0)
    await expect(opener).toBeFocused()
    await expect(search).toHaveValue("barbecue")
    await expect(map).toHaveAttribute("data-after19-active", "false")

    await opener.click()
    await page.evaluate(() => {
      ;(window as Window & { __ONDO_B_QA__?: Record<string, string> }).__ONDO_B_QA__ = { after19Global: "failure" }
    })
    await page.getByTestId("global-after19-confirm").click()
    await expect(gate.locator("[data-gate-view='failure']")).toBeVisible()
    await expect(gate).toContainText("filters, and map position are unchanged")
    await page.evaluate(() => {
      delete (window as Window & { __ONDO_B_QA__?: Record<string, string> }).__ONDO_B_QA__?.after19Global
    })
    await page.getByTestId("global-after19-retry").click()

    const banner = page.getByTestId("global-after19-banner")
    await expect(banner).toBeVisible()
    await expect(banner.getByRole("button", { name: "Turn off After 19 now" })).toBeFocused()
    await expect(map).toHaveAttribute("data-after19-active", "true")
    await expect(search).toHaveValue("barbecue")
    await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}"), SESSION_KEY)).toMatchObject({
      age: "eligible",
      mode: "on",
      activation: "manual",
    })

    await banner.getByRole("button", { name: "Turn off After 19 now" }).click()
    await expect(map).toHaveAttribute("data-after19-active", "false")
    await expect(page.getByTestId("global-after19-off-notice")).toBeVisible()
    await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").mode, SESSION_KEY)).toBe("manual-off")
  })

  test("FL-014 auto guard opens a compact banner and manual-off survives reload in the same tab", async ({ page }) => {
    await seedGlobalAfter19(page, {
      autoOpen: true,
      age: "eligible",
      ageExpiresAt: "2026-08-20T20:30:00+09:00",
    })
    await seedB(page, { locale: "en", local: { autoNight: true } })
    await openSeoul(page)
    const map = page.getByTestId("ondo-b-map-entry")
    const banner = page.getByTestId("global-after19-banner")
    await expect(banner).toBeVisible()
    await expect(banner).toContainText("Opened after 19:00 KST")
    await expect(map).toHaveAttribute("data-after19-active", "true")
    await expect(page.getByTestId("ondo-b-after19-global")).toHaveAttribute("data-after19-activation", "auto")

    await banner.getByRole("button", { name: "Turn off After 19 now" }).click()
    await expect(page.getByTestId("global-after19-off-notice")).toBeVisible()
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").mode, SESSION_KEY)).toBe("manual-off")
    await gotoB(page, "?city=seoul")
    await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
    await expect(page.getByTestId("global-after19-toggle")).toBeVisible()
    await expect(page.getByTestId("ondo-b-after19-global")).toHaveAttribute("data-after19-mode", "manual-off")
  })

  for (const [locale, city, title] of [
    ["en", "Seoul", "Turn on After 19?"],
    ["ko", "서울", "After 19을 켤까요?"],
    ["ja", "ソウル", "After 19をオンにしますか？"],
  ] as const) {
    test(`FL-013 ${locale.toUpperCase()} prompt keeps its copy and 44px mobile controls`, async ({ page }) => {
      await seedGlobalAfter19(page)
      await seedB(page, { locale, local: { autoNight: false } })
      await openSeoul(page)
      await page.getByTestId("global-after19-toggle").click()
      const gate = page.getByTestId("global-after19-prompt-layer")
      await expect(gate.getByRole("heading", { name: title })).toBeVisible()
      await expect(gate.getByTestId("global-after19-return-context")).toContainText(city)
      for (const control of await gate.locator("button:visible, summary:visible").all()) {
        const box = await control.boundingBox()
        expect(box?.height ?? 0, await control.evaluate((element) => element.outerHTML)).toBeGreaterThanOrEqual(44)
      }
    })
  }

  test("legacy state migrates once into strict B keys without writing age to device storage", async ({ page }) => {
    await seedB(page, {
      locale: "en",
      local: { autoNight: true },
      session: { age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00", after19: "A19-ON" },
    })
    await openSeoul(page)
    await expect(page.getByTestId("global-after19-banner")).toBeVisible()
    const stored = await page.evaluate(({ preferenceKey, sessionKey }) => ({
      preference: JSON.parse(localStorage.getItem(preferenceKey) ?? "{}"),
      session: JSON.parse(sessionStorage.getItem(sessionKey) ?? "{}"),
      deviceAfter19: JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}").after19,
      deviceAge: JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}").age,
    }), { preferenceKey: PREFERENCE_KEY, sessionKey: SESSION_KEY })
    expect(stored.preference).toEqual({ version: 1, autoOpen: true })
    expect(stored.session).toMatchObject({ version: 1, age: "eligible", mode: "on" })
    expect(stored.deviceAge).toBeUndefined()
    expect(stored.deviceAfter19).toBeUndefined()
  })

  test("a same-document age result synchronizes without coupling Tables JIT to global activation", async ({ page }) => {
    await seedGlobalAfter19(page)
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await openSeoul(page)
    await page.evaluate(({ key, eventName }) => {
      sessionStorage.setItem(key, JSON.stringify({
        version: 1,
        age: "eligible",
        ageExpiresAt: "2026-08-20T20:30:00+09:00",
        mode: "off",
        activation: null,
        expiryNotice: false,
      }))
      window.dispatchEvent(new Event(eventName))
    }, { key: SESSION_KEY, eventName: SESSION_EVENT })
    const global = page.getByTestId("ondo-b-after19-global")
    await expect(global).toHaveAttribute("data-after19-age", "eligible")
    await expect(global).toHaveAttribute("data-after19-mode", "off")
    await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
  })

  test("the first useful prompt frame stays inside compact portrait, tablet, and landscape viewports", async ({ page }) => {
    await seedGlobalAfter19(page)
    await seedB(page, { locale: "ja", local: { autoNight: false } })
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport)
      await openSeoul(page)
      await page.getByTestId("global-after19-toggle").click()
      const gate = page.getByTestId("global-after19-prompt-layer")
      const dialog = gate.getByRole("dialog")
      const actions = gate.getByTestId("global-after19-confirm").locator("..")
      await expect(dialog).toBeVisible()
      await expect(gate.getByTestId("global-after19-confirm")).toBeInViewport()
      await expect(gate.getByTestId("global-after19-cancel")).toBeInViewport()
      const [dialogBox, confirmBox, cancelBox, overflow] = await Promise.all([
        dialog.boundingBox(),
        gate.getByTestId("global-after19-confirm").boundingBox(),
        gate.getByTestId("global-after19-cancel").boundingBox(),
        page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      ])
      expect(dialogBox).not.toBeNull()
      expect(dialogBox!.x).toBeGreaterThanOrEqual(-1)
      expect(dialogBox!.y).toBeGreaterThanOrEqual(-1)
      expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport.width + 1)
      expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport.height + 1)
      expect(confirmBox?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(cancelBox?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(overflow).toBeLessThanOrEqual(1)
      if (viewport.width > viewport.height) {
        const titleBox = await gate.getByRole("heading", { level: 2 }).boundingBox()
        const actionsBox = await actions.boundingBox()
        expect(actionsBox?.x ?? 0).toBeGreaterThan(titleBox?.x ?? Number.POSITIVE_INFINITY)
      }
      await gate.getByTestId("global-after19-cancel").click()
    }
  })
})
