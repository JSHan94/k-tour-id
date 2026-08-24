import { expect, test, type Locator } from "@playwright/test"
import {
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

async function requiredBox(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value!
}

function expectCentered(child: Awaited<ReturnType<typeof requiredBox>>, parent: Awaited<ReturnType<typeof requiredBox>>) {
  expect(Math.abs((child.x + child.width / 2) - (parent.x + parent.width / 2))).toBeLessThanOrEqual(1)
  expect(child.x).toBeGreaterThanOrEqual(parent.x - .5)
  expect(child.x + child.width).toBeLessThanOrEqual(parent.x + parent.width + .5)
}

test.describe("CLEAN1 S2 production regressions", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("ONDO B metadata describes licensed-place discovery without local-popularity claims", async ({ page }) => {
    await seedB(page, { locale: "en" })
    await gotoB(page)

    await expect(page).toHaveTitle("ONDO — Licensed food-place discovery in Seoul and Busan")
    await expect(page.locator("meta[name='description']")).toHaveAttribute("content", "Discover licensed food-place records for Seoul and Busan with clear source and preview labels.")
    await expect(page.locator("meta[property='og:title']")).toHaveAttribute("content", "ONDO — Licensed food-place discovery in Seoul and Busan")
    await expect(page.locator("meta[name='twitter:title']")).toHaveAttribute("content", "ONDO — Licensed food-place discovery in Seoul and Busan")

    const metadataText = await page.locator("head title, head meta[content]").evaluateAll((elements) => elements.map((element) => element.textContent ?? element.getAttribute("content") ?? "").join(" "))
    expect(metadataText).not.toMatch(/where locals eat|what locals eat|locals are eating/i)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} desktop map, navigation, modal, and Sheet stay centered inside the useful canvas`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
      await gotoB(page, "?city=seoul&view=map")

      const canvas = await requiredBox(page.getByTestId("ondo-canvas"))
      const map = await requiredBox(page.getByTestId("maplibre-map"))
      const nav = await requiredBox(page.getByTestId("ondo-main-nav"))
      expect(canvas.width).toBe(1180)
      expect(map.width).toBeGreaterThanOrEqual(canvas.width - 2)
      expect(nav.width).toBeLessThanOrEqual(700.5)
      expectCentered(map, canvas)
      expectCentered(nav, canvas)

      await openCanonicalVenue(page)
      const detail = await requiredBox(page.getByTestId("canonical-place-overlay").locator(":scope > article"))
      expect(detail.width).toBeLessThanOrEqual(700.5)
      expectCentered(detail, canvas)

      await page.getByTestId("canonical-venue-signal").click()
      const sheet = await requiredBox(page.getByTestId("ondo-sheet"))
      expect(sheet.width).toBeLessThanOrEqual(640.5)
      expectCentered(sheet, canvas)
    })
  }
})
