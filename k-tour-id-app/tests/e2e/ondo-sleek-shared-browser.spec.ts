import { expect, test } from "@playwright/test"
import {
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

test.describe("ONDO B sleek shared shell", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("the responsive canvas never collapses at the 800 to 801 breakpoint", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await seedB(page)
    const widths = [360, 430, 768, 800, 801, 1024, 1440]
    const measured: number[] = []
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 })
      await gotoB(page)
      const canvas = page.getByTestId("ondo-canvas")
      const box = await canvas.boundingBox()
      expect(box).not.toBeNull()
      measured.push(Math.round(box!.width))
      await expect(canvas).toBeVisible()
    }
    expect(measured).toEqual([360, 430, 768, 800, 769, 968, 1180])
    expect(measured[3] - measured[4]).toBeLessThanOrEqual(32)
  })

  test("wide screens use a rail while documents retain a readable measure", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await page.setViewportSize({ width: 1440, height: 1000 })
    await seedB(page)
    await gotoB(page)
    const canvas = page.getByTestId("ondo-canvas")
    await expect(canvas).toHaveCSS("width", "1180px")
    const navBox = await page.getByTestId("ondo-main-nav").boundingBox()
    expect(navBox).not.toBeNull()
    expect(navBox!.width).toBe(64)
    expect(navBox!.height).toBeGreaterThan(300)

    await page.getByTestId("nav-id").click()
    const identityBox = await page.getByTestId("ondo-identity-entry").boundingBox()
    expect(identityBox).not.toBeNull()
    expect(identityBox!.width).toBeLessThanOrEqual(700)
    expect(identityBox!.x).toBeGreaterThan(navBox!.x + navBox!.width)
  })

  test("Korean navigation is localized and has exactly one current destination", async ({ page }) => {
    await seedB(page, { locale: "ko" })
    await gotoB(page)
    const nav = page.getByTestId("ondo-main-nav")
    await expect(nav.getByText("나의 한국", { exact: true })).toBeVisible()
    await expect(nav.getByText("모임", { exact: true })).toBeVisible()
    await expect(nav.getByText("신원", { exact: true })).toBeVisible()
    await expect(nav.locator("[aria-current='page']")).toHaveCount(1)
  })

  test("reputation axes render three individually meaningful units", async ({ page }) => {
    await seedB(page, {
      session: {
        person: "PER-VERIFIED",
        reputation: { identity: "verified", visit: "repeat", contribution: "helpful", meetup: "reliable" },
      },
    })
    await gotoB(page)
    await page.getByTestId("nav-id").click()
    const axes = page.getByTestId("ondo-trust-panel").locator("[role='img']")
    await expect(axes).toHaveCount(4)
    await expect(axes.nth(0).locator("i")).toHaveCount(3)
    await expect(axes.nth(0).locator("i[class]")).toHaveCount(3)
    await expect(axes.nth(1).locator("i[class]")).toHaveCount(3)
    await expect(axes.nth(2).locator("i[class]")).toHaveCount(2)
    await expect(axes.nth(3).locator("i[class]")).toHaveCount(2)
  })

  test("onboarding labels its example score as simulated at the decision point", async ({ page }) => {
    await gotoB(page)
    const truth = page.getByTestId("onboarding-signal-truth")
    await expect(truth).toContainText("Simulated preview")
    await expect(truth).toContainText("not weather")
  })

  test("desktop onboarding uses the editorial canvas instead of a phone-width column", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium")
    await page.setViewportSize({ width: 1440, height: 1000 })
    await gotoB(page)
    const onboarding = page.getByTestId("ondo-onboarding")
    const title = onboarding.getByRole("heading", { level: 1 })
    const truth = page.getByTestId("onboarding-signal-truth")
    const [titleBox, truthBox] = await Promise.all([title.boundingBox(), truth.boundingBox()])
    expect(titleBox).not.toBeNull()
    expect(truthBox).not.toBeNull()
    expect(titleBox!.x + titleBox!.width).toBeLessThan(truthBox!.x)
    expect(truthBox!.width).toBeGreaterThanOrEqual(300)
  })
})
