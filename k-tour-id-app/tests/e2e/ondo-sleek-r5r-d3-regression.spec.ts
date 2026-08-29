import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  expectNoHorizontalOverflow,
  gotoB,
  openCanonicalVenue,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const SHORT_LANDSCAPES = [
  { width: 667, height: 320 },
  { width: 740, height: 360 },
  { width: 844, height: 390 },
  { width: 926, height: 428 },
] as const

const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-21T20:00:00+09:00",
  paymentKyc: "PKY-NOT-STARTED",
  stamps: 10,
}

async function expectMinimumMetadataSize(locator: Locator, label: string) {
  await expect(locator, `${label} must be visible`).toBeVisible()
  const measurement = await locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      fontSize: Number.parseFloat(style.fontSize),
      horizontallyClipped: element.scrollWidth > element.clientWidth + 1,
      verticallyClipped: element.scrollHeight > element.clientHeight + 1,
    }
  })
  expect(measurement.fontSize, `${label} font size`).toBeGreaterThanOrEqual(12)
  expect(measurement.horizontallyClipped, `${label} horizontal clipping`).toBe(false)
  expect(measurement.verticallyClipped, `${label} vertical clipping`).toBe(false)
}

async function activateMy(page: Page) {
  const myTab = page.getByRole("button", { name: "My Korea", exact: true })
  await expect.poll(async () => {
    await myTab.click({ force: true, timeout: 1_000 }).catch(() => undefined)
    return page.getByTestId("ondo-my-entry").isVisible().catch(() => false)
  }, { timeout: 30_000 }).toBe(true)
}

test.describe("D3 CLEAN1 regressions", () => {
  test.describe.configure({ timeout: 240_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} short-landscape truth metadata stays at least 12px without clipping or overlap`, async ({ page }) => {
      await seedB(page, { locale, local: { autoNight: false } })

      for (const viewport of SHORT_LANDSCAPES) {
        const label = `${locale} ${viewport.width}x${viewport.height}`
        await page.setViewportSize(viewport)
        await gotoB(page)

        const nation = page.getByTestId("ondo-b-nation")
        await expect(nation.locator("details, footer")).toHaveCount(0)
        const anchors = nation.locator("[data-city]")
        await expect(anchors).toHaveCount(3)
        for (let index = 0; index < 3; index += 1) {
          await expectMinimumMetadataSize(anchors.nth(index).locator("strong"), `${label} city anchor ${index + 1}`)
          await expect(anchors.nth(index).locator("[data-region-kind-label]")).toHaveCount(0)
          await expect(anchors.nth(index).locator("em")).toHaveCount(0)
        }
        await expectNoHorizontalOverflow(page)

        await gotoB(page, "?city=seoul&view=map")
        const filters = page.getByTestId("ondo-b-category-rail")
        const filterButtons = filters.getByRole("button")
        await expect(filterButtons).toHaveCount(8)
        for (let index = 0; index < 8; index += 1) {
          await expectMinimumMetadataSize(filterButtons.nth(index), `${label} map filter ${index + 1}`)
        }
        expect(await filters.evaluate((rail) => {
          const buttons = [...rail.querySelectorAll("button")].map((button) => button.getBoundingClientRect())
          return buttons.every((button, index) => index === buttons.length - 1 || button.right <= buttons[index + 1].left + .5)
        }), `${label} map filters must not overlap`).toBe(true)
        await expectNoHorizontalOverflow(page)
      }
    })
  }

  const gateCases = [
    {
      name: "Account",
      seed: {},
      open: async (page: Page) => {
        await openCanonicalVenue(page, { query: "qa=1" })
        await page.getByTestId("canonical-venue-save").click()
      },
    },
    {
      name: "Age",
      seed: { account: "ACC-ACTIVE", person: "PER-VERIFIED" },
      open: async (page: Page) => {
        await openCanonicalVenue(page, { query: "qa=1" })
        await page.getByTestId("canonical-after19-unlock").click()
      },
    },
    {
      name: "Payment",
      seed: READY_SESSION,
      open: async (page: Page) => {
        await openCanonicalVenue(page, { query: "qa=1" })
        await page.getByTestId("canonical-venue-checkout").click()
        await page.getByTestId("checkout-start").click()
      },
    },
  ] as const

  for (const gateCase of gateCases) {
    test(`${gateCase.name} Gate failure transition inserts an atomic alert`, async ({ page }) => {
      await seedB(page, { local: { autoNight: false }, session: gateCase.seed })
      await gateCase.open(page)
      const gate = page.getByTestId("ondo-gate-overlay")
      await expect(gate).toBeVisible()
      await expect(gate.getByRole("alert")).toHaveCount(0)
      await gate.getByRole("button", { name: "Simulate failure" }).click()
      const failure = page.getByTestId("gate-failure")
      await expect(failure).toHaveAttribute("role", "alert")
      await expect(failure).toHaveAttribute("aria-atomic", "true")
      await expect(gate.getByRole("alert")).toHaveCount(1)
    })
  }

  test("unacknowledged Labs Escape restores the exact My 10-stamp opener and never BODY", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedB(page, { session: READY_SESSION })
    await gotoB(page)
    await activateMy(page)

    const opener = page.getByTestId("open-labs-milestone")
    await expect(opener).toBeVisible()
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY")
    await opener.evaluate((element) => (element as HTMLButtonElement).click())
    const labsDialog = page.getByRole("dialog", { name: "Labs" })
    await expect(labsDialog).toBeVisible()
    await page.keyboard.press("Escape")

    await expect(labsDialog).toHaveCount(0)
    await expect(page.getByTestId("ondo-my-entry")).toBeVisible()
    await expect(opener).toBeFocused()
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY")
  })
})
