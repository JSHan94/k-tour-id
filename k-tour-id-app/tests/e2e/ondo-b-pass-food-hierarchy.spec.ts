import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

type Locale = "en" | "ko" | "ja"
async function seed(page: Page, locale: Locale, appearance: "light" | "dark") {
  await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" })
  await page.addInitScript(({ locale, appearance }) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE" }))
  }, { locale, appearance })
}

for (const scenario of [
  { width: 320, height: 844, locale: "en", appearance: "light" },
  { width: 390, height: 844, locale: "ko", appearance: "light" },
  { width: 390, height: 844, locale: "ja", appearance: "dark" },
  { width: 844, height: 390, locale: "ja", appearance: "dark" },
  { width: 1440, height: 1000, locale: "en", appearance: "light" },
] as const) {
  test(`PASS-FOOD first view and keyboard disclosures: ${scenario.width}px ${scenario.locale} ${scenario.appearance}`, async ({ page }, testInfo) => {
    await page.setViewportSize(scenario)
    await seed(page, scenario.locale, scenario.appearance)
    await page.goto("/?city=busan", { waitUntil: "domcontentloaded" })
    await page.getByTestId("nav-id").click()
    const pass = page.getByTestId("ondo-b-traveler-id")
    const primary = pass.getByTestId("kpass-start-setup")
    const balance = pass.getByTestId("wallet-balance")
    const services = pass.getByTestId("kpass-service-disclosure")
    const readiness = pass.getByTestId("travel-pass-status")
    await expect(primary).toBeVisible()
    await expect(balance).toBeVisible()
    await expect(services).not.toHaveAttribute("open", "")
    await expect(readiness).not.toHaveAttribute("open", "")
    await expect(pass.getByTestId("kpass-service-person")).toBeHidden()
    await expect(pass.getByTestId("traveler-id-person-check")).toBeHidden()
    expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
    if (scenario.height >= 844 && scenario.width <= 430) {
      const nav = await page.getByTestId("ondo-main-nav").boundingBox()
      const walletBox = await balance.boundingBox()
      expect(walletBox!.y + walletBox!.height, "the complete wallet balance is above bottom navigation").toBeLessThanOrEqual(nav!.y + 1)
    }
    await page.screenshot({ path: testInfo.outputPath(`pass-${scenario.width}-${scenario.locale}-${scenario.appearance}.png`) })

    await primary.click()
    const setup = page.getByTestId("k-tour-id-setup")
    await expect(setup).toBeVisible()
    await setup.getByTestId("k-tour-id-cancel").click()
    await expect(setup).toBeHidden()
    await expect(primary).toBeFocused()

    const serviceToggle = pass.getByTestId("kpass-service-toggle")
    await serviceToggle.focus()
    await serviceToggle.press("Enter")
    await expect(services).toHaveAttribute("open", "")
    for (const id of ["person", "age", "visitor_benefit", "payment"])
      await expect(pass.getByTestId(`kpass-service-${id}`)).toBeVisible()
    await serviceToggle.press("Enter")
    await expect(services).not.toHaveAttribute("open", "")

    const readinessToggle = pass.getByTestId("travel-pass-readiness-toggle")
    await readinessToggle.scrollIntoViewIfNeeded()
    await readinessToggle.focus()
    await readinessToggle.press("Enter")
    await expect(readiness).toHaveAttribute("open", "")
    for (const axis of ["account", "person", "age", "credential", "payment"]) {
      await expect(pass.getByTestId(`traveler-id-${axis}`)).toBeVisible()
      await expect(pass.getByTestId(`traveler-id-${axis}`)).toHaveAttribute("data-status", axis === "account" ? "guest" : "none")
    }
    for (const id of ["traveler-id-person-check", "traveler-id-age-check", "traveler-id-ktour-id-open"]) {
      const button = pass.getByTestId(id)
      await button.scrollIntoViewIfNeeded()
      await button.focus()
      await expect(button).toBeFocused()
      const box = await button.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    expect(await pass.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
    const scan = await new AxeBuilder({ page }).include('[data-testid="ondo-b-traveler-id"]').analyze()
    expect(scan.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
  })
}

for (const appearance of ["light", "dark"] as const) {
  test(`PASS-FOOD Busan first picks show noodles and tteokgalbi, with truthful image labels: ${appearance}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seed(page, "en", appearance)
    await page.goto("/?city=busan&view=list", { waitUntil: "domcontentloaded" })
    const list = page.getByTestId("researched-food-list")
    for (const [id, subject, filename] of [
      ["research-busan-moemiljip", "noodles", "perilla-noodles-illustration-v1.jpg"],
      ["research-busan-songheonjip", "grill", "tteokgalbi-illustration-v1.jpg"],
    ]) {
      const card = list.locator(`[data-research-id="${id}"]`)
      await card.scrollIntoViewIfNeeded()
      const media = card.locator("[data-food-photo]")
      await expect(media).toHaveAttribute("data-food-subject", subject)
      await expect(media).toHaveAttribute("data-photo-state", "loaded")
      await expect(media.locator("figcaption")).toHaveText("Food illustration")
      await expect(media.locator("img")).toHaveAttribute("src", `/editorial/food/${filename}`)
      await expect(media.locator("img")).toHaveAccessibleName("Illustrative food image, not a photo of this venue or its menu")
      await card.click()
      const detail = page.getByTestId("researched-food-detail")
      await expect(detail).toHaveAttribute("data-research-id", id)
      await expect(detail.locator("img")).toHaveAttribute("src", `/editorial/food/${filename}`)
      await page.getByTestId("ondo-sheet").filter({ has: detail }).getByRole("button", { name: "Close", exact: true }).click()
      await expect(detail).toBeHidden()
      await expect(card).toBeFocused()
    }
    await page.screenshot({ path: testInfo.outputPath(`food-busan-${appearance}.png`) })
  })
}
