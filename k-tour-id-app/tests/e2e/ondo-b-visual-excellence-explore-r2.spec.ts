import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  gotoB,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  seedFreshOnboarding,
} from "../helpers/ondo-b-qa"

async function expectTruthUnclipped(locator: Locator) {
  expect(await locator.evaluateAll((nodes) => nodes.map((node) => ({
    horizontal: node.scrollWidth > node.clientWidth + 1,
    vertical: node.scrollHeight > node.clientHeight + 1,
  })))).toEqual(await locator.evaluateAll((nodes) => nodes.map(() => ({ horizontal: false, vertical: false }))))
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
}

async function seedCompletedBDevice(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ deviceLocale }) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: deviceLocale,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { deviceLocale: locale })
}

async function seedFreshBDevice(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ deviceLocale }) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: deviceLocale,
      onboarding: "ONB-NEW",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceLocalBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { deviceLocale: locale })
}

test.describe("ONDO Explore visual-excellence R2 composition", () => {
  test.describe.configure({ timeout: 180_000 })

  test.beforeEach(async ({ page }) => {
    await prepareBPage(page)
  })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} 390 onboarding makes the decision in the first frame and lets full truth continue below`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await seedFreshOnboarding(page, locale)
      await seedFreshBDevice(page, locale)
      await gotoB(page)

      const value = page.getByTestId("onboarding-step-value")
      const primary = value.getByRole("button", { name: locale === "ko" ? "시작하기" : "Get started", exact: true })
      const secondary = value.getByRole("button", { name: locale === "ko" ? "게스트로 탐색" : "Explore as a guest", exact: true })
      const source = value.locator("section")
      const metrics = await value.evaluate((element) => {
        const actionGroup = element.querySelector("button[data-onboarding-initial-focus]")!.parentElement!
        const truth = element.querySelector("section")!
        const title = element.querySelector("h1")!
        const actionRect = actionGroup.getBoundingClientRect()
        const truthRect = truth.getBoundingClientRect()
        const titleRect = title.getBoundingClientRect()
        return {
          actionTop: actionRect.top,
          actionBottom: actionRect.bottom,
          truthTop: truthRect.top,
          titleHeight: titleRect.height,
          viewport: window.innerHeight,
        }
      })

      await expect(primary).toBeInViewport()
      await expect(secondary).toBeInViewport()
      expect(metrics.actionBottom).toBeLessThan(metrics.viewport * .76)
      expect(metrics.truthTop).toBeGreaterThan(metrics.actionBottom)
      expect(metrics.titleHeight).toBeLessThanOrEqual(124)
      await expectTruthUnclipped(source.locator("span"))
      await expectNoHorizontalOverflow(page)
    })

    test(`${locale.toUpperCase()} desktop Nation owns the full canvas with a Seoul-to-Busan atlas`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await seedB(page, { locale })
      await seedCompletedBDevice(page, locale)
      await gotoB(page)

      const nation = page.getByTestId("ondo-b-nation")
      const metrics = await nation.evaluate((element) => {
        const atlas = element.querySelector("svg")!.parentElement!
        const seoul = element.querySelector<HTMLElement>("[data-city='seoul']")!
        const busan = element.querySelector<HTMLElement>("[data-city='busan']")!
        const footer = element.querySelector("footer")!
        const root = element.getBoundingClientRect()
        const atlasRect = atlas.getBoundingClientRect()
        const seoulRect = seoul.getBoundingClientRect()
        const busanRect = busan.getBoundingClientRect()
        const footerRect = footer.getBoundingClientRect()
        return {
          atlasRatio: atlasRect.height / root.height,
          citySpreadRatio: Math.abs((busanRect.top + busanRect.height / 2) - (seoulRect.top + seoulRect.height / 2)) / root.height,
          footerDepthRatio: (footerRect.bottom - root.top) / root.height,
          atlasScene: getComputedStyle(atlas, "::before").backgroundImage,
        }
      })

      expect(metrics.atlasRatio).toBeGreaterThanOrEqual(.7)
      expect(metrics.citySpreadRatio).toBeGreaterThanOrEqual(.34)
      expect(metrics.footerDepthRatio).toBeGreaterThanOrEqual(.82)
      expect(metrics.atlasScene).not.toBe("none")
      await expectNoHorizontalOverflow(page)
    })

    test(`${locale.toUpperCase()} mobile peek keeps a luxury action frame without a sticky dialog-root focus perimeter`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await seedB(page, { locale })
      await seedCompletedBDevice(page, locale)
      await openCanonicalVenue(page, { expanded: false })

      const peek = page.getByTestId("canonical-place-peek")
      const metrics = await peek.evaluate((element) => {
        const pulse = element.querySelector<HTMLElement>("[data-testid='canonical-place-pulse']")!
        const actions = element.querySelector<HTMLElement>("[data-visual-priority='primary']")!.parentElement!
        const style = getComputedStyle(element)
        return {
          height: element.getBoundingClientRect().height,
          pulseHeight: pulse.getBoundingClientRect().height,
          actionBottom: actions.getBoundingClientRect().bottom,
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
          viewport: window.innerHeight,
        }
      })

      expect(metrics.height).toBeLessThanOrEqual(352)
      expect(metrics.pulseHeight).toBeLessThanOrEqual(116)
      expect(metrics.actionBottom).toBeLessThanOrEqual(metrics.viewport - 8)
      expect(metrics.outlineStyle === "none" || metrics.outlineWidth === 0).toBe(true)
      await expectNoHorizontalOverflow(page)
    })

    test(`${locale.toUpperCase()} desktop place detail uses named two-column workspace areas with continuous lower content`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await seedB(page, { locale, session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
      await seedCompletedBDevice(page, locale)
      await openCanonicalVenue(page)

      const overlay = page.getByTestId("canonical-place-overlay")
      const metrics = await overlay.evaluate((element) => {
        const body = element.querySelector<HTMLElement>("article > div")!
        const style = getComputedStyle(body)
        const rows = [...body.children]
          .filter((child) => getComputedStyle(child).display !== "none")
          .map((child) => ({ top: (child as HTMLElement).offsetTop, bottom: (child as HTMLElement).offsetTop + (child as HTMLElement).offsetHeight }))
          .sort((left, right) => left.top - right.top)
        const largestGap = rows.reduce((gap, row, index) => index === 0 ? gap : Math.max(gap, row.top - rows[index - 1].bottom), 0)
        return {
          display: style.display,
          areas: style.gridTemplateAreas,
          autoFlow: style.gridAutoFlow,
          largestGapRatio: largestGap / body.clientHeight,
          scrollable: body.scrollHeight > body.clientHeight + 8,
        }
      })

      expect(metrics.display).toBe("grid")
      expect(metrics.areas).toContain("pulse")
      expect(metrics.areas).toContain("source")
      expect(metrics.autoFlow).toContain("dense")
      expect(metrics.largestGapRatio).toBeLessThan(.3)
      expect(metrics.scrollable).toBe(true)
      await expectNoHorizontalOverflow(page)
    })
  }
})
