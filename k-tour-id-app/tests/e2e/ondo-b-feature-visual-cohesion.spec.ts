import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const TABLE_ID = "table-seoul-night-bites"

async function seed(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function expectNoHorizontalOverflow(locator: Locator) {
  const { clientWidth, scrollWidth } = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
}

test("Tables stays polished and closable at 360, 390, and 430 CSS pixels", async ({ page }) => {
  await seed(page)
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-tables").click()
    const entry = page.getByTestId("tables-entry")
    await expect(entry.getByRole("heading", { name: "Pulse Tables" })).toBeVisible()
    await expectNoHorizontalOverflow(entry)
    await page.locator("[data-table-state='TABLE-ENDED']").scrollIntoViewIfNeeded()
    await expect(page.locator("[data-table-state='TABLE-ENDED']")).toBeVisible()

    await page.getByTestId(`table-open-${TABLE_ID}`).click()
    const detail = page.getByTestId("table-detail")
    const close = detail.locator("header").getByRole("button", { name: "Close Table" }).first()
    await detail.evaluate((element) => { element.scrollTop = element.scrollHeight })
    await expect(close).toBeVisible()
    const closeBox = await close.boundingBox()
    expect(closeBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect(closeBox?.y ?? -1).toBeGreaterThanOrEqual(0)
    expect((closeBox?.y ?? 10_000) + (closeBox?.height ?? 0)).toBeLessThanOrEqual(800)
    await close.click()
  }
})

test("My Korea, ID · Wallet, and Settings share natural scrolling and premium touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await seed(page, "ko")
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

  for (const [nav, root] of [
    ["nav-my", "ondo-b-my-korea-entry"],
    ["nav-id", "ondo-b-traveler-id"],
    ["nav-settings", "ondo-b-settings-entry"],
  ] as const) {
    await page.getByTestId(nav).click()
    const surface = page.getByTestId(root)
    await expect(surface).toBeVisible()
    await expectNoHorizontalOverflow(surface)
  }

  await page.getByTestId("nav-id").click()
  const checks = page.locator("[data-testid='traveler-id-person'], [data-testid='traveler-id-age']")
  await expect(checks).toHaveCount(2)
  for (const button of await checks.getByRole("button").all()) {
    const box = await button.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }
})

