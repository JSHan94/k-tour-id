import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { gotoB, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const PREFERENCE_KEY = "ondo-b.after19.preferences.v1"
const SESSION_KEY = "ondo-b.after19.session.v1"
const SESSION_EVENT = "ondo-b-after19-session-change"
const BROWSE_SNAPSHOT_KEY = "ondo-b.after19.browse-snapshot.v1"

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
    session: {
      version: 1,
      age,
      ageExpiresAt,
      eligibilityReceipt: age === "eligible" && ageExpiresAt ? {
        schema: "review-age-predicate.v1",
        predicate: "AGE_GTE_19",
        outcome: "eligible",
        issuerType: "REVIEW_FIXTURE",
        provenanceTruth: "SIMULATED",
        fixtureId: "FX-AGE-GLOBAL-001",
        issuedAt: new Date(Date.parse(ageExpiresAt) - 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: ageExpiresAt,
        disclosure: "predicate_only",
      } : null,
      mode,
      activation,
      expiryNotice: false,
    },
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
    await expect(gate).toContainText("See places that fit a night out on this map.")
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
    await expect(gate).toContainText("place and map are still here")
    await page.getByTestId("global-after19-retry").click()
    await expect(gate.locator("[data-gate-view='failure']")).toBeVisible()
    await page.evaluate(() => {
      ;(window as Window & { __ONDO_B_QA__?: Record<string, string> }).__ONDO_B_QA__ = { after19Global: "success" }
    })
    await page.getByTestId("global-after19-retry").click()

    const banner = page.getByTestId("global-after19-banner")
    await expect(banner).toBeVisible()
    const reviewToggle = banner.getByTestId("global-after19-review-toggle")
    await expect(reviewToggle).toBeFocused()
    await expect(map).toHaveAttribute("data-after19-active", "true")
    await expect(search).toHaveValue("barbecue")
    await expect(banner).toHaveAttribute("data-review-result", "true")
    await expect(page.getByTestId("global-after19-review-provenance")).toHaveCount(0)
    await expect(page.getByText("SIMULATED", { exact: true })).toHaveCount(0)
    await reviewToggle.click()
    const reviewDetails = page.getByTestId("global-after19-review-provenance")
    await expect(reviewDetails).toBeVisible()
    await expect(reviewDetails).toContainText("SIMULATED")
    await expect(reviewDetails).toContainText("FX-AGE-GLOBAL-001")
    await expect(reviewDetails.locator("time")).toBeVisible()
    await expect(reviewDetails.getByTestId("global-after19-review-close")).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(reviewDetails).toHaveCount(0)
    await expect(reviewToggle).toBeFocused()
    await reviewToggle.click()
    await page.getByTestId("global-after19-review-close").click()
    await expect(page.getByTestId("global-after19-review-provenance")).toHaveCount(0)
    await expect(reviewToggle).toBeFocused()
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY)).toBeNull()

    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
    await page.getByTestId("nav-ondo").click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "true")

    await reviewToggle.click()
    await page.getByTestId("global-after19-turn-off").click()
    await expect(map).toHaveAttribute("data-after19-active", "false")
    await expect(search).toHaveValue("barbecue")
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), BROWSE_SNAPSHOT_KEY)).toBeNull()
    await expect(page.getByTestId("global-after19-off-notice")).toBeVisible()
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY)).toBeNull()
  })

  test("FL-013 normal route uses an explicit tab-only declaration and opens night view", async ({ page }) => {
    await seedGlobalAfter19(page)
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await openSeoul(page)
    await page.getByTestId("global-after19-toggle").click()
    const gate = page.getByTestId("global-after19-prompt-layer")
    await expect(gate.getByRole("heading", { name: "Night view" })).toBeVisible()
    await expect(gate.getByTestId("global-after19-confirm")).toHaveAccessibleName("I’m 19 or older")
    await page.getByTestId("global-after19-confirm").click()
    await expect(gate).toHaveCount(0)
    const banner = page.getByTestId("global-after19-banner")
    await expect(banner).toBeVisible()
    await expect(banner).toHaveAttribute("data-review-result", "false")
    await expect(page.getByTestId("global-after19-review-toggle")).toHaveCount(0)
    await expect(page.getByText("SIMULATED", { exact: true })).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "true")
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY)).toBeNull()
    await banner.getByRole("button", { name: "Turn off After 19 now" }).click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "false")
  })

  test("FL-013 closing releases the gate even when animation frames are throttled", async ({ page }) => {
    await seedGlobalAfter19(page)
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await openSeoul(page)
    await page.getByTestId("global-after19-toggle").click()
    const gate = page.getByTestId("global-after19-prompt-layer")
    await expect(gate.getByRole("heading", { name: "Night view" })).toBeVisible()
    await gate.getByTestId("global-after19-confirm").click()
    await page.evaluate(() => {
      let frameId = 1_000_000
      window.requestAnimationFrame = () => frameId++
      window.cancelAnimationFrame = () => undefined
    })

    await expect(gate).toHaveCount(0, { timeout: 3_000 })
    await expect(page.getByTestId("global-after19-banner")).toBeVisible()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "true")
  })

  test("FL-013 Guest review stays in this document but returns locked after reload", async ({ page }) => {
    await seedGlobalAfter19(page)
    await seedB(page, { locale: "en", local: { autoNight: false } })
    await openSeoul(page)
    await page.evaluate(() => {
      ;(window as Window & { __ONDO_B_QA__?: Record<string, string> }).__ONDO_B_QA__ = { after19Global: "success" }
    })
    await page.getByTestId("global-after19-toggle").click()
    await page.getByTestId("global-after19-confirm").click()
    await expect(page.getByTestId("global-after19-banner")).toBeVisible()
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY)).toBeNull()

    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "false")
  })

  test("FL-014 auto guard opens a compact banner and manual-off survives reload in the same tab", async ({ page }) => {
    await seedGlobalAfter19(page, {
      autoOpen: true,
      age: "eligible",
      ageExpiresAt: "2026-08-20T20:30:00+09:00",
    })
    await seedB(page, { locale: "en", session: { account: "ACC-ACTIVE" }, local: { autoNight: true } })
    await openSeoul(page)
    const map = page.getByTestId("ondo-b-map-entry")
    const banner = page.getByTestId("global-after19-banner")
    await expect(banner).toBeVisible()
    await expect(banner).toHaveAttribute("data-activation", "auto")
    await expect(banner).toHaveAttribute("data-review-result", "true")
    await expect(page.getByTestId("global-after19-review-provenance")).toHaveCount(0)
    await expect(map).toHaveAttribute("data-after19-active", "true")
    await expect(page.getByTestId("ondo-b-after19-global")).toHaveAttribute("data-after19-activation", "auto")

    await banner.getByTestId("global-after19-review-toggle").click()
    await page.getByTestId("global-after19-turn-off").click()
    await expect(page.getByTestId("global-after19-off-notice")).toBeVisible()
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect.poll(() => page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}").mode, SESSION_KEY)).toBe("manual-off")
    await gotoB(page, "?city=seoul")
    await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
    await expect(page.getByTestId("global-after19-toggle")).toBeVisible()
    await expect(page.getByTestId("ondo-b-after19-global")).toHaveAttribute("data-after19-mode", "manual-off")
  })

  for (const [locale, city, title, visibleTruth, foldedTruth] of [
    ["en", "Seoul", "Night view", "places that fit a night out", "opens night view in this tab"],
    ["ko", "서울", "밤 지도", "밤에 어울리는 장소", "이 탭에서만 밤 지도를"],
    ["ja", "ソウル", "夜の地図", "夜のお出かけに合う場所", "このタブで夜の地図を"],
  ] as const) {
    test(`FL-013 ${locale.toUpperCase()} prompt keeps its copy and 44px mobile controls`, async ({ page }) => {
      await seedGlobalAfter19(page)
      await seedB(page, { locale, local: { autoNight: false } })
      await openSeoul(page)
      await page.getByTestId("global-after19-toggle").click()
      const gate = page.getByTestId("global-after19-prompt-layer")
      await expect(gate.getByRole("heading", { name: title })).toBeVisible()
      await expect(gate).toContainText(visibleTruth)
      const boundary = gate.locator("details")
      await boundary.locator("summary").click()
      await expect(boundary).toContainText(foldedTruth)
      await expect(gate.getByTestId("global-after19-return-context")).toContainText(city)
      for (const control of await gate.locator("button:visible, summary:visible").all()) {
        const box = await control.boundingBox()
        expect(box?.height ?? 0, await control.evaluate((element) => element.outerHTML)).toBeGreaterThanOrEqual(44)
      }
    })
  }

  for (const [locale, detailsTitle, openLabel, closeLabel, expiresLabel] of [
    ["en", "Review details", "Open review details", "Close review details", "Expires"],
    ["ko", "검토 정보", "검토 정보 열기", "검토 정보 닫기", "만료"],
    ["ja", "レビュー情報", "レビュー情報を開く", "レビュー情報を閉じる", "有効期限"],
  ] as const) {
    test(`FL-013 ${locale.toUpperCase()} review provenance is disclosed on demand and returns focus exactly`, async ({ page }) => {
      const expiresAt = "2026-08-20T20:30:00+09:00"
      await seedGlobalAfter19(page, {
        age: "eligible",
        ageExpiresAt: expiresAt,
        mode: "on",
        activation: "manual",
      })
      await seedB(page, { locale, session: { account: "ACC-ACTIVE" }, local: { autoNight: false } })
      await openSeoul(page)

      const toggle = page.getByTestId("global-after19-review-toggle")
      await expect(toggle).toHaveAccessibleName(openLabel)
      await expect(toggle).toHaveAttribute("aria-expanded", "false")
      await expect(toggle).not.toHaveAttribute("aria-controls", /.+/)
      await expect(page.getByTestId("global-after19-review-provenance")).toHaveCount(0)
      await expect(page.getByText("SIMULATED", { exact: true })).toHaveCount(0)
      expect((await toggle.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)

      await toggle.click()
      const details = page.getByTestId("global-after19-review-provenance")
      await expect(details).toBeVisible()
      await expect(details.getByText(detailsTitle, { exact: true })).toBeVisible()
      await expect(details.getByText(expiresLabel, { exact: true })).toBeVisible()
      await expect.poll(async () => Date.parse(await details.locator("time").getAttribute("datetime") ?? "")).toBe(Date.parse(expiresAt))
      const close = details.getByTestId("global-after19-review-close")
      await expect(close).toHaveAccessibleName(closeLabel)
      await expect(close).toBeFocused()
      await expect(toggle).toHaveAttribute("aria-expanded", "true")
      await expect(toggle).toHaveAttribute("aria-controls", "global-after19-review-details")
      await expectNoBlockingAxe(page, details)

      await page.keyboard.press("Escape")
      await expect(details).toHaveCount(0)
      await expect(toggle).toBeFocused()
      await expect(toggle).toHaveAccessibleName(openLabel)
      await expect(toggle).toHaveAttribute("aria-expanded", "false")
    })
  }

  test("legacy unproven age fails closed without writing age to device storage", async ({ page }) => {
    await seedB(page, {
      locale: "en",
      local: { autoNight: true },
      session: { age: "AGE-VERIFIED", ageExpiresAt: "2026-08-20T20:30:00+09:00", after19: "A19-ON" },
    })
    await openSeoul(page)
    await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
    const stored = await page.evaluate(({ preferenceKey, sessionKey }) => ({
      preference: JSON.parse(localStorage.getItem(preferenceKey) ?? "{}"),
      session: JSON.parse(sessionStorage.getItem(sessionKey) ?? "{}"),
      deviceAfter19: JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}").after19,
      deviceAge: JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}").age,
    }), { preferenceKey: PREFERENCE_KEY, sessionKey: SESSION_KEY })
    expect(stored.preference).toEqual({ version: 1, autoOpen: true })
    expect(stored.session).toEqual({})
    expect(await page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY)).toBeNull()
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
        eligibilityReceipt: {
          schema: "review-age-predicate.v1",
          predicate: "AGE_GTE_19",
          outcome: "eligible",
          issuerType: "REVIEW_FIXTURE",
          provenanceTruth: "SIMULATED",
          fixtureId: "FX-AGE-GLOBAL-001",
          issuedAt: "2026-08-19T20:30:00+09:00",
          expiresAt: "2026-08-20T20:30:00+09:00",
          disclosure: "predicate_only",
        },
        mode: "off",
        activation: null,
        expiryNotice: false,
      }))
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: JSON.parse(sessionStorage.getItem(key) ?? "{}"),
      }))
      sessionStorage.removeItem(key)
    }, { key: SESSION_KEY, eventName: SESSION_EVENT })
    const global = page.getByTestId("ondo-b-after19-global")
    await expect(global).toHaveAttribute("data-after19-age", "eligible")
    await expect(global).toHaveAttribute("data-after19-mode", "off")
    await expect(page.getByTestId("global-after19-banner")).toHaveCount(0)
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY)).toBeNull()
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
