import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seedCompleted(page: Page, locale: "en" | "ko" | "ja") {
  await page.addInitScript(({ key, language }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
      commerceLocalBoundarySeen: true,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, language: locale })
}

for (const locale of ["ko", "ja"] as const) {
  test(`Warm Living Atlas keeps ${locale.toUpperCase()} mobile navigation naturally tracked`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await seedCompleted(page, locale)
    await page.goto("/", { waitUntil: "domcontentloaded" })

    const nav = page.getByTestId("ondo-main-nav")
    await expect(nav).toBeVisible()
    const labels = await nav.locator("small").evaluateAll((nodes) => nodes.map((node) => {
      const element = node as HTMLElement
      const box = element.getBoundingClientRect()
      const parent = element.closest("button")!.getBoundingClientRect()
      return {
        letterSpacing: getComputedStyle(element).letterSpacing,
        left: box.left,
        right: box.right,
        parentLeft: parent.left,
        parentRight: parent.right,
      }
    }))

    for (const label of labels) {
      expect(["0px", "normal"]).toContain(label.letterSpacing)
      expect(label.left).toBeGreaterThanOrEqual(label.parentLeft - .5)
      expect(label.right).toBeLessThanOrEqual(label.parentRight + .5)
    }
    expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  })
}

test("Warm Living Atlas retains five actions and desktop rail ownership", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await seedCompleted(page, "ja")
  await page.goto("/", { waitUntil: "domcontentloaded" })

  const nav = page.getByTestId("ondo-main-nav")
  await expect(nav.locator("button")).toHaveCount(5)
  const [navBox, contentBox] = await Promise.all([
    nav.boundingBox(),
    page.getByTestId("ondo-scroll-region").boundingBox(),
  ])
  expect(navBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  expect(navBox!.x + navBox!.width).toBeLessThanOrEqual(contentBox!.x + 1)
  expect(navBox!.height).toBeGreaterThan(700)
})
