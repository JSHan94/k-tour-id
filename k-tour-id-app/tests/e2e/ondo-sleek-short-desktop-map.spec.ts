import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const SHORT_DESKTOPS = [
  { width: 1440, height: 800 },
  { width: 1512, height: 801 },
] as const

async function expectNoIntersection(first: Locator, second: Locator) {
  const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()])
  expect(a).not.toBeNull()
  expect(b).not.toBeNull()
  const overlapWidth = Math.max(0, Math.min(a!.x + a!.width, b!.x + b!.width) - Math.max(a!.x, b!.x))
  const overlapHeight = Math.max(0, Math.min(a!.y + a!.height, b!.y + b!.height) - Math.max(a!.y, b!.y))
  expect(overlapWidth * overlapHeight).toBe(0)
}

async function openCityMap(page: Page, locale: "en" | "ko") {
  await seedB(page, { locale, local: { autoNight: false } })
  await gotoB(page, "?city=seoul&view=map")
  await expect(page.getByTestId("ondo-b-map-key")).toBeVisible()
}

test.describe("SLEEK-R3 short desktop map composition", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop shell geometry owns the short-height rail contract.")
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop-chromium") await expectBRuntimeClean(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} map key remains complete and clear of the navigation rail on short desktops`, async ({ page }) => {
      for (const viewport of SHORT_DESKTOPS) {
        await page.setViewportSize(viewport)
        await openCityMap(page, locale)
        const nav = page.getByTestId("ondo-main-nav")
        const key = page.getByTestId("ondo-b-map-key")
        await expectNoIntersection(nav, key)
        await expect(key).toContainText("12×")
        await expect(key).toContainText("82")
        await expect(key).toContainText(locale === "ko" ? "공식 장소" : "Places")
        await expect(key).toContainText(locale === "ko" ? "시뮬레이션 점수" : "Simulated score")
      }
    })
  }
})
