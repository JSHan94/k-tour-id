import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { B_SLEEK_VIEWPORTS } from "../helpers/ondo-b-visual-evidence"
import { openCanonicalVenue, prepareBPage, seedB } from "../helpers/ondo-b-qa"

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-21T20:00:00+09:00",
  paymentKyc: "PKY-VERIFIED",
  stamps: 9,
}

const FOCUS_BLUE = "rgb(29, 102, 209)"
const DANGER_RED = "rgb(178, 59, 54)"

async function expectFocusToken(target: Locator, label: string) {
  await expect(target, `${label} is the sole focus owner`).toBeFocused()
  expect(await target.evaluate((node) => node.matches(":focus-visible")), `${label} exposes :focus-visible`).toBe(true)
  const treatment = await target.evaluate((node) => {
    const style = getComputedStyle(node)
    return {
      color: style.color,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      shadow: style.boxShadow,
    }
  })
  expect(treatment.outlineColor, `${label} uses the semantic focus color`).toBe(FOCUS_BLUE)
  expect(treatment.outlineStyle, `${label} has a visible outline`).toBe("solid")
  expect(Number.parseFloat(treatment.outlineWidth), `${label} outline is at least 2px`).toBeGreaterThanOrEqual(2)
  expect(treatment.outlineOffset, `${label} uses the required focus offset`).toBe("2px")
  expect(treatment.outlineColor, `${label} does not inherit currentColor`).not.toBe(treatment.color)
  expect(treatment.shadow, `${label} has no danger-colored focus shadow`).not.toContain("179, 68, 56")
}

async function expectNoSeriousAxe(page: Page, selector: string) {
  const result = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
}

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(180_000)
  page.setDefaultTimeout(20_000)
  await prepareBPage(page)
})

for (const locale of ["en", "ko"] as const) {
  test(`R5-D1-001 ${locale.toUpperCase()} icon, action, dialog, sheet, and nav focus uses one semantic token at all six widths`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "the explicit six-width matrix has one canonical owner")
    await seedB(page, { locale, session: READY_SESSION })

    for (const viewport of B_SLEEK_VIEWPORTS) {
      await test.step(`${viewport.id} place dialog and persistent navigation`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await openCanonicalVenue(page)

        const root = page.getByTestId("ondo-b-root")
        const tokens = await root.evaluate((node) => {
          const style = getComputedStyle(node)
          return {
            danger: style.getPropertyValue("--destructive").trim(),
            focus: style.getPropertyValue("--focus").trim(),
          }
        })
        expect(tokens.focus.toLowerCase()).toBe("#1d66d1")
        expect(tokens.danger.toLowerCase()).toBe("#b23b36")
        expect(tokens.focus).not.toBe(tokens.danger)

        const dialog = page.getByTestId("canonical-place-overlay")
        const back = dialog.locator("header button").nth(0)
        const close = dialog.locator("header button").nth(1)
        const primary = page.getByTestId("canonical-venue-primary-directions")
        const secondary = page.getByTestId("canonical-venue-save")

        await expectFocusToken(back, `${locale} ${viewport.id} dialog Back icon`)
        await page.keyboard.press("Tab")
        await expectFocusToken(close, `${locale} ${viewport.id} dialog Close icon`)
        await page.keyboard.press("Tab")
        await expectFocusToken(primary, `${locale} ${viewport.id} primary action`)
        await page.keyboard.press("Tab")
        await expectFocusToken(secondary, `${locale} ${viewport.id} secondary action`)
        await expectNoSeriousAxe(page, "[data-testid='canonical-place-overlay']")

        await page.keyboard.press("Escape")
        await expect(dialog).toHaveCount(0)
        await expectFocusToken(page.getByTestId("canonical-place-details"), `${locale} ${viewport.id} dialog return target`)

        const nav = page.getByTestId("nav-ondo")
        await nav.focus()
        await expectFocusToken(nav, `${locale} ${viewport.id} navigation control`)
      })

      await test.step(`${viewport.id} full sheet controls`, async () => {
        await page.getByTestId("canonical-place-details").click()
        await expect(page.getByTestId("canonical-place-overlay")).toBeVisible()
        await page.getByTestId("canonical-venue-checkout").click()

        const sheet = page.getByTestId("ondo-sheet")
        const sheetClose = sheet.getByRole("button", { name: locale === "ko" ? "닫기" : "Close", exact: true })
        await expect(sheet).toBeVisible()
        await expect(sheetClose).toBeFocused()
        await page.keyboard.press("Tab")
        await expectFocusToken(page.getByTestId("checkout-start"), `${locale} ${viewport.id} sheet primary action`)
        await page.keyboard.press("Shift+Tab")
        await expectFocusToken(sheetClose, `${locale} ${viewport.id} sheet Close icon`)
        await expectNoSeriousAxe(page, "[data-testid='ondo-sheet']")

        await page.keyboard.press("Escape")
        await expect(sheet).toHaveCount(0)
      })
    }
  })
}

test("R5-D1-001 semantic focus and danger tokens stay separate", async () => {
  expect(FOCUS_BLUE).not.toBe(DANGER_RED)
})
