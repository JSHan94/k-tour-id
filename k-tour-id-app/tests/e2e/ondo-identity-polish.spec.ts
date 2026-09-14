import { mkdirSync } from "node:fs"
import { resolve } from "node:path"
import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator } from "@playwright/test"

const EVIDENCE = resolve("artifacts/qa/identity-polish-20260909")
const scenarios = [
  { width: 390, appearance: "dark", locale: "en", method: "mobile-id" },
  { width: 320, appearance: "light", locale: "ko", method: "mobile-id" },
  { width: 430, appearance: "dark", locale: "ja", method: "residence-card" },
  { width: 1440, appearance: "light", locale: "en", method: "residence-card" },
] as const

async function expectReadableText(locator: Locator) {
  const contrast = await locator.evaluate(element => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
    const luminance = (value: string) => rgb(value).reduce((sum, channel, index) => {
      const s = channel / 255
      return sum + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][index]
    }, 0)
    let surface: Element | null = element
    while (surface && ["rgba(0, 0, 0, 0)", "transparent"].includes(getComputedStyle(surface).backgroundColor)) surface = surface.parentElement
    const fg = luminance(getComputedStyle(element).color)
    const bg = luminance(getComputedStyle(surface ?? document.documentElement).backgroundColor)
    return (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05)
  })
  expect(contrast).toBeGreaterThanOrEqual(4.5)
}

async function expectBalancedProgress(setup: Locator, currentStep: number) {
  const progress = setup.locator(":scope > [role='list']")
  await expect(progress).toBeVisible()
  const items = progress.getByRole("listitem")
  await expect(items).toHaveCount(3)
  await expect(items.nth(currentStep - 1)).toHaveAttribute("aria-current", "step")
  await expect(progress.locator(":scope > [role='listitem'] > span")).toHaveCount(3)
  const geometry = await progress.evaluate(element => {
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    const left = rect.left + parseFloat(style.paddingLeft)
    const right = rect.right - parseFloat(style.paddingRight)
    const items = [...element.children] as HTMLElement[]
    const marks = items.map(item => item.querySelector("span")!.getBoundingClientRect())
    return {
      width: right - left,
      centers: marks.map(mark => mark.left + mark.width / 2 - left),
      y: marks.map(mark => mark.top + mark.height / 2),
      leftInset: marks[0].left - left,
      rightInset: right - marks[2].right,
      connectorWidths: items.slice(0, 2).map(item => parseFloat(getComputedStyle(item, "::after").width)),
      lastConnector: getComputedStyle(items[2], "::after").display,
      overflow: element.scrollWidth > element.clientWidth + 1,
    }
  })
  // This fails the former 0%, 33%, 67% leading-aligned layout, even though
  // that layout has equal step spacing and does not horizontally overflow.
  for (let index = 0; index < 3; index++) {
    expect(Math.abs(geometry.centers[index] - geometry.width * (index + .5) / 3)).toBeLessThanOrEqual(1)
    expect(Math.abs(geometry.y[index] - geometry.y[0])).toBeLessThanOrEqual(1)
  }
  expect(Math.abs(geometry.leftInset - geometry.rightInset)).toBeLessThanOrEqual(1)
  expect(geometry.connectorWidths[0]).toBeGreaterThan(0)
  expect(Math.abs(geometry.connectorWidths[0] - geometry.connectorWidths[1])).toBeLessThanOrEqual(1)
  expect(geometry.lastConnector).toBe("none")
  expect(geometry.overflow).toBe(false)
  expect(await setup.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
}

for (const scenario of scenarios) test(`identity preview is legible and complete: ${scenario.width} ${scenario.appearance} ${scenario.locale}`, async ({ page }) => {
  await page.setViewportSize({ width: scenario.width, height: 900 })
  await page.emulateMedia({ colorScheme: scenario.appearance, reducedMotion: "reduce" })
  await page.addInitScript(({ appearance, locale }) => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE" })), scenario)
  await page.route("https://tiles.openfreemap.org/**", route => route.abort("blockedbyclient"))
  await page.goto("/?review=1", { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", scenario.appearance)
  await page.getByTestId("nav-id").click()
  await page.getByTestId("traveler-id-ktour-id-open").click()
  const setup = page.getByTestId("k-tour-id-setup")
  await expect(setup).toHaveAttribute("data-execution-mode", "review")
  await expect(setup.locator("[data-ktour-mark='monochrome']")).toHaveCount(1)
  await expect(setup.locator("img[src*='ktour-id-mark']")).toHaveCount(0)
  await expectReadableText(setup.getByTestId("k-tour-id-review-scope"))
  await expectBalancedProgress(setup, 1)
  mkdirSync(EVIDENCE, { recursive: true })
  await setup.screenshot({ path: resolve(EVIDENCE, `${scenario.width}-${scenario.appearance}-${scenario.locale}-choose.png`) })

  await setup.getByTestId(`ktour-id-route-${scenario.method}`).click()
  await expect(setup).toHaveAttribute("data-phase", "consent")
  await expectBalancedProgress(setup, 2)
  await setup.screenshot({ path: resolve(EVIDENCE, `${scenario.width}-${scenario.appearance}-${scenario.locale}-consent.png`) })
  await setup.getByTestId("k-tour-id-consent-approve").click()
  await expect(setup).toHaveAttribute("data-phase", "cx_handoff_preview")
  await expectBalancedProgress(setup, 2)
  const route = setup.getByTestId("k-tour-id-route-step")
  const stages = route.getByTestId("identity-handoff-stages")
  await expect(stages.getByRole("listitem")).toHaveCount(3)
  await expect(stages.locator("[aria-current='step']")).toHaveCount(1)
  await expectReadableText(route.locator("[class*='eyebrow']"))
  await expectReadableText(stages.locator("p").nth(1))
  await expect(setup.locator("input[type='file']")).toHaveCount(0)
  expect(await setup.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  await setup.screenshot({ path: resolve(EVIDENCE, `${scenario.width}-${scenario.appearance}-${scenario.locale}-handoff.png`) })
  const axe = await new AxeBuilder({ page }).include("[data-testid='k-tour-id-setup']").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])

  await route.getByTestId("k-tour-id-continue").click()
  await expect(setup).toHaveAttribute("data-phase", "holder_delivery_preview")
  await expectBalancedProgress(setup, 3)
  await setup.screenshot({ path: resolve(EVIDENCE, `${scenario.width}-${scenario.appearance}-${scenario.locale}-holder.png`) })
  await setup.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-status", "review-draft")
  await expectBalancedProgress(setup, 3)
  await expect(setup.getByTestId("ktour-id-result").locator("[data-ktour-mark='monochrome']")).toHaveCount(1)
  await setup.screenshot({ path: resolve(EVIDENCE, `${scenario.width}-${scenario.appearance}-${scenario.locale}-result.png`) })
  await setup.getByTestId("k-tour-id-return").click()
  await expect(setup).toHaveCount(0)
  for (const id of ["person", "age", "payment"]) await expect(page.getByTestId(`traveler-id-${id}`)).toHaveAttribute("data-status", "none")
})
