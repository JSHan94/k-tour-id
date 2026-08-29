import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const TABLE_ID = "table-seoul-night-bites"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

async function seedDevice(page: Page, locale: "en" | "ko" = "en", extra: Record<string, unknown> = {}) {
  await page.addInitScript(({ key, nextLocale, state }) => {
    if (localStorage.getItem(key) !== null) return
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      ...state,
    }))
  }, { key: DEVICE_KEY, nextLocale: locale, state: extra })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function gotoB(page: Page, search = "") {
  await page.goto(`/ondo-b${search}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toBeVisible()
}

async function openMy(page: Page) {
  const nav = page.getByTestId("ondo-main-nav")
  await expect(nav).toBeVisible()
  await expect.poll(() => nav.evaluate((node) => !node.hasAttribute("inert"))).toBe(true)
  await activate(page, "nav-my")
  return page.getByTestId("ondo-b-my-korea-entry")
}

async function activate(page: Page, testId: string) {
  await page.getByTestId(testId).focus()
  await page.keyboard.press("Enter")
}

async function expectNoSeriousAxe(page: Page) {
  const result = await new AxeBuilder({ page }).include("[data-testid='ondo-b-my-korea-entry']").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

test("My Korea starts honestly empty, records an explicit official place open, reloads, and resets", async ({ page }) => {
  await seedDevice(page)
  await gotoB(page, "?city=seoul&view=list")
  await page.evaluate(() => {
    sessionStorage.setItem("ondo.labs.v2", "legacy-a-session")
    sessionStorage.setItem("ondo-b.labs.v1", "b-session")
  })
  let my = await openMy(page)
  await expect(my.getByTestId("my-korea-recent-empty")).toBeVisible()
  await expect(my.getByTestId("my-korea-planned-empty")).toBeVisible()
  await expect(my.getByTestId("my-korea-contributions-empty")).toBeVisible()
  await expectNoSeriousAxe(page)

  await activate(page, "nav-ondo")
  const venueOpener = page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first()
  await venueOpener.click()
  const viewedVenueId = await page.getByTestId("canonical-place-peek").getAttribute("data-venue-id")
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").recentVenueIds ?? [], DEVICE_KEY)).toContain(viewedVenueId)
  await page.getByRole("button", { name: "Close place" }).click()
  await expect(page.getByTestId("canonical-place-peek")).toBeHidden()
  await expect(venueOpener).toBeFocused()
  my = await openMy(page)
  await expect(my.getByTestId(`recent-venue-${viewedVenueId}`)).toBeVisible()
  await expect(my).toContainText("Viewed on this device")

  await page.reload({ waitUntil: "domcontentloaded" })
  my = await openMy(page)
  await expect(my.getByTestId(`recent-venue-${viewedVenueId}`)).toBeVisible()

  await activate(page, "nav-settings")
  await page.getByTestId("ondo-b-device-data-settings").locator(":scope > summary").click()
  await page.getByTestId("ondo-b-clear-device-open").click()
  await page.getByRole("button", { name: "Clear saved content" }).click()
  await expect(page.getByTestId("ondo-b-clear-device-confirm")).toBeHidden()
  await expect(page.getByTestId("ondo-b-clear-device-open")).toBeFocused()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo-b.labs.v1"))).toBeNull()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.labs.v2"))).toBe("legacy-a-session")
  my = await openMy(page)
  await expect(my.getByTestId("my-korea-recent-empty")).toBeVisible()
})

test("device clear leaves saved content and both Labs sessions intact when B session storage cannot be cleared", async ({ page }) => {
  await seedDevice(page, "en", { savedVenueIds: [VENUE_ID] })
  await gotoB(page)
  await page.evaluate(() => {
    sessionStorage.setItem("ondo.labs.v2", "legacy-a-session")
    sessionStorage.setItem("ondo-b.labs.v1", "b-session")
    const originalRemove = Storage.prototype.removeItem
    Object.defineProperty(window.sessionStorage, "removeItem", {
      configurable: true,
      value(key: string) {
        if (key === "ondo-b.labs.v1") throw new DOMException("blocked", "SecurityError")
        return originalRemove.call(this, key)
      },
    })
  })
  await activate(page, "nav-settings")
  await page.getByTestId("ondo-b-device-data-settings").locator(":scope > summary").click()
  await page.getByTestId("ondo-b-clear-device-open").click()
  const confirm = page.getByTestId("ondo-b-clear-device-confirm")
  await confirm.getByRole("button", { name: "Clear saved content" }).click()
  await expect(confirm.getByTestId("ondo-b-clear-device-error")).toBeVisible()
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").savedVenueIds ?? [], DEVICE_KEY)).toEqual([VENUE_ID])
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo-b.labs.v1"))).toBe("b-session")
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ondo.labs.v2"))).toBe("legacy-a-session")
})

test("planned meals appear only after the explicit local join confirmation and survive reload", async ({ page }) => {
  await seedDevice(page)
  await gotoB(page)
  await activate(page, "nav-tables")
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("action-gate-confirm").click()
  await page.getByTestId("after19-start").click()

  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").plannedTableRefs ?? [], DEVICE_KEY)).toEqual([])
  await page.getByTestId("table-join-confirm").click()
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").plannedTableRefs ?? [], DEVICE_KEY)).toEqual([{ tableId: TABLE_ID, venueId: VENUE_ID }])

  await page.getByTestId("table-detail").locator("header").getByRole("button", { name: "Close Table" }).first().click()
  await expect(page.getByTestId("table-detail")).toBeHidden()
  await expect(page.getByTestId(`table-open-${TABLE_ID}`)).toBeFocused()
  let my = await openMy(page)
  await expect(my.getByTestId(`planned-table-${TABLE_ID}`)).toContainText("Saved on this device · no reservation")
  await expectNoSeriousAxe(page)
  await page.reload({ waitUntil: "domcontentloaded" })
  my = await openMy(page)
  const planned = my.getByTestId(`planned-table-${TABLE_ID}`)
  await expect(planned).toBeVisible()
  await planned.getByRole("button", { name: "Open Table" }).click()
  await expect(page.getByTestId("table-detail")).toBeVisible()
  await expect(page.getByTestId("table-open-chat")).toBeVisible()
  await expect(page.getByTestId("table-join")).toHaveCount(0)
})

test("cancel creates no plan while the Local Signal merge contract can render honest device history in Korean", async ({ page }) => {
  await seedDevice(page, "ko", {
    localSignalPostedVenueIds: [VENUE_ID],
    localPulseEvidenceByVenue: {
      [VENUE_ID]: { tags: ["calm_now"], postedAt: "2026-08-27T00:00:00.000Z" },
    },
  })
  await gotoB(page)
  await activate(page, "nav-tables")
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("action-gate-cancel").click()
  await page.getByTestId("table-detail").locator("header").getByRole("button", { name: "테이블 닫기" }).first().click()
  await expect(page.getByTestId("table-detail")).toBeHidden()
  await expect(page.getByTestId(`table-open-${TABLE_ID}`)).toBeFocused()

  const my = await openMy(page)
  await expect(my.getByTestId("my-korea-planned-empty")).toBeVisible()
  await expect(my.getByTestId(`contribution-venue-${VENUE_ID}`)).toContainText("이 기기에서 남긴 로컬 시그널")
  await expect(page.getByTestId("nav-my")).toContainText("저장")
  await expect(page.getByTestId("nav-my")).toHaveAccessibleName("저장 · 내 한국")
})
