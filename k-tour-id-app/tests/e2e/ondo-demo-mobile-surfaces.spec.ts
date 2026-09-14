import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"

async function frameIsUsable(page: Page, surface: Locator) {
  await expect(surface).toBeVisible()
  expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  expect(await surface.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  const nav = await page.getByTestId("ondo-main-nav").boundingBox()
  expect(nav).not.toBeNull()
  expect(nav!.y + nav!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1)
  for (const button of await page.getByTestId("ondo-main-nav").getByRole("button").all()) {
    const box = await button.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
}

const CASES = [
  { width: 320, height: 740, locale: "en", language: "English", appearance: "light" },
  { width: 360, height: 740, locale: "ko", language: "한국어", appearance: "dark" },
  { width: 390, height: 844, locale: "en", language: "English", appearance: "dark" },
  { width: 430, height: 932, locale: "ja", language: "日本語", appearance: "light" },
] as const

for (const item of CASES) {
  test(`public mobile surfaces: ${item.width}px ${item.locale} ${item.appearance}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: item.width, height: item.height })
    await page.emulateMedia({ reducedMotion: "reduce" })
    const errors: string[] = []
    page.on("pageerror", error => errors.push(error.message))
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByTestId("onboarding-guest-skip").click()
    await page.getByTestId("nav-settings").click()
    await page.getByTestId("settings-appearance-row").click()
    await page.getByTestId(`settings-appearance-${item.appearance}`).click()
    await page.keyboard.press("Escape")
    await expect(page.getByTestId("settings-appearance-control")).toHaveCount(0)
    await page.getByTestId("settings-language-row").click()
    await page.getByTestId("settings-language-control").getByRole("radio", { name: item.language, exact: true }).click()
    await page.keyboard.press("Escape")
    await expect(page.getByTestId("settings-language-control")).toHaveCount(0)
    await expect(page.locator("html")).toHaveAttribute("lang", item.locale)
    await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", item.appearance)

    for (const [tab, id] of [
      ["my", "ondo-b-my-korea-entry"],
      ["tables", "tables-entry"],
      ["id", "ondo-b-traveler-id"],
      ["settings", "ondo-b-settings-entry"],
    ]) {
      await page.getByTestId(`nav-${tab}`).click()
      const surface = page.getByTestId(id)
      await frameIsUsable(page, surface)
      if (tab === "tables") {
        const card = surface.locator("article[data-table-state]").first()
        await expect(card).toBeVisible()
        expect(await card.evaluate(node => getComputedStyle(node, "::before").display)).toBe("none")
      }
      if (tab === "id") {
        const pass = await page.getByTestId("travel-pass-card").boundingBox()
        const access = await page.getByTestId("kpass-service-card").boundingBox()
        expect(access!.y - (pass!.y + pass!.height)).toBeGreaterThanOrEqual(16)
      }
      await page.screenshot({ path: testInfo.outputPath(`${tab}-${item.width}-${item.locale}-${item.appearance}.png`) })
      const result = await new AxeBuilder({ page }).include(`[data-testid='${id}']`).analyze()
      expect(result.violations.filter(v => v.impact === "critical" || v.impact === "serious")).toEqual([])
    }
    await page.getByTestId("nav-ondo").click()
    await frameIsUsable(page, page.getByTestId("ondo-b-map-entry"))
    await page.screenshot({ path: testInfo.outputPath(`nation-${item.width}-${item.locale}-${item.appearance}.png`) })
    expect(errors).toEqual([])
    expect(await page.evaluate(() => (window as Window & { __ONDO_B_QA__?: unknown }).__ONDO_B_QA__)).toBeUndefined()
  })
}

test("public Labs signer and exchange sample finish without a provider or hidden QA injection", async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("onboarding-guest-skip").click()
  await page.getByTestId("nav-my").click()
  await page.getByTestId("open-labs").click()
  await page.getByTestId("labs-acknowledge").click()
  const labs = page.getByTestId("labs-overlay")
  await labs.getByTestId("labs-connect-wallet").click()
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-READY")
  await labs.getByTestId("labs-bridge-quote").click()
  await labs.getByTestId("labs-bridge-confirm").click()
  await labs.getByTestId("labs-bridge-submit").click()
  for (let step = 0; step < 3; step += 1) await labs.getByTestId("labs-bridge-advance").click()
  await expect(labs.getByTestId("labs-bridge-receipt")).toBeVisible()
  await expect(labs.getByTestId("labs-bridge-receipt")).toContainText("balances and transactions unchanged")
  await page.screenshot({ path: testInfo.outputPath("labs-exchange-sample.png") })
  await labs.getByTestId("labs-back").click()
  await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("kpass-start-setup")).toBeVisible()
})
