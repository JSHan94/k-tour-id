import { expect, test } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

const VENUE = "mois-18939eecb43c15ab4305"
const cases = [
  { width: 1440, appearance: "dark", locale: "en" },
  { width: 1440, appearance: "light", locale: "en" },
  { width: 390, appearance: "dark", locale: "en" },
  { width: 390, appearance: "light", locale: "en" },
  { width: 320, appearance: "dark", locale: "ko" },
  { width: 320, appearance: "light", locale: "ko" },
  { width: 768, appearance: "dark", locale: "ja" },
  { width: 430, appearance: "light", locale: "ja" },
] as const

for (const scenario of cases) test(`pre-visit cards have clean borders and centered icons: ${scenario.width} ${scenario.appearance} ${scenario.locale}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: scenario.width, height: 900 })
  await page.emulateMedia({ colorScheme: scenario.appearance, reducedMotion: "reduce" })
  await page.addInitScript(({ appearance, locale }) => localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE" })), scenario)
  // Basemap transport is unrelated to these facts; retain the real venue API
  // and exercise the public List/detail route, including its offline fallback.
  await page.route("https://tiles.openfreemap.org/**", route => route.abort("blockedbyclient"))
  await page.goto(`/?city=seoul&view=list&venueId=${VENUE}&detail=1`, { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", scenario.appearance)
  const detail = page.getByTestId("canonical-place-overlay")
  const before = detail.getByTestId("canonical-place-details-to-check")
  const rows = before.locator("[data-fact-key]")
  await expect(rows).toHaveCount(4)
  for (const row of await rows.all()) await expect(row).toHaveAttribute("data-fact-state", "unknown")
  await before.scrollIntoViewIfNeeded()
  await before.screenshot({ path: testInfo.outputPath(`previsit-${scenario.width}-${scenario.appearance}-${scenario.locale}.png`) })
  const geometry = await before.evaluate(section => {
    const rect = (node: Element) => node.getBoundingClientRect()
    const centerDelta = (outer: Element, inner: Element) => {
      const a = rect(outer), b = rect(inner)
      return { x: Math.abs(a.x + a.width / 2 - b.x - b.width / 2), y: Math.abs(a.y + a.height / 2 - b.y - b.height / 2) }
    }
    const grid = section.querySelector(":scope > div")!
    return {
      border: getComputedStyle(section).borderTopWidth,
      gridBorder: getComputedStyle(grid).borderTopWidth,
      cards: [...grid.children].map(row => {
        const button = row.querySelector("button")!
        const glyph = button.querySelector(":scope > span")!
        const badge = glyph.querySelector(":scope > span")!
        return {
          rowBorder: getComputedStyle(row).borderTopWidth,
          cardBorder: getComputedStyle(button).borderTopWidth,
          width: rect(button).width, height: rect(button).height,
          overflow: button.scrollWidth > Math.ceil(rect(button).width),
          glyphDisplay: getComputedStyle(glyph).display,
          icon: centerDelta(glyph, glyph.querySelector(":scope > svg")!),
          badge: centerDelta(badge, badge.querySelector("svg")!),
        }
      }),
    }
  })
  expect(geometry.border).toBe("1px")
  expect(geometry.gridBorder).toBe("0px")
  for (const card of geometry.cards) {
    expect(card.rowBorder).toBe("0px")
    expect(card.cardBorder).toBe("1px")
    expect(card.glyphDisplay).toBe("grid")
    expect(card.width).toBeGreaterThanOrEqual(100)
    expect(card.height).toBeGreaterThanOrEqual(44)
    expect(card.overflow).toBe(false)
    for (const delta of [card.icon, card.badge]) {
      expect(delta.x).toBeLessThanOrEqual(1)
      expect(delta.y).toBeLessThanOrEqual(1)
    }
  }
  if (scenario.width <= 430) {
    const spacing = await before.evaluate(section => {
      const next = section.nextElementSibling!
      return next.getBoundingClientRect().top - section.getBoundingClientRect().bottom
    })
    expect(spacing).toBeGreaterThanOrEqual(8)
  }
  const first = rows.first().getByRole("button")
  const name = await first.getAttribute("aria-label")
  expect(name).toBeTruthy()
  await first.click()
  await expect(detail.getByTestId("canonical-evidence-sheet")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(detail.getByTestId("canonical-evidence-sheet")).toBeHidden()
  await expect(first).toBeFocused()
})
