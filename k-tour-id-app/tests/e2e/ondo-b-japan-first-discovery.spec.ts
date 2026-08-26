import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seed(page: Page, locale: "en" | "ko") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
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
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
}

async function rect(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value!
}

test.describe("Japan-first discovery reuses the existing Explore skeleton", () => {
  test.describe.configure({ timeout: 120_000 })

  for (const locale of ["en", "ko"] as const) {
    test(`${locale.toUpperCase()} stays compact, truthful, and reachable across the product matrix`, async ({ page }) => {
      for (const viewport of [
        { width: 320, height: 720 },
        { width: 360, height: 800 },
        { width: 390, height: 844 },
        { width: 430, height: 932 },
        { width: 844, height: 390 },
        { width: 1440, height: 1000 },
      ]) {
        await page.setViewportSize(viewport)
        await seed(page, locale)
        await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

        const atlas = page.getByTestId("ondo-b-korea-atlas")
        const seoul = atlas.locator("[data-city='seoul']")
        const jeju = atlas.locator("[data-city='jeju']")
        await expect(atlas).toBeVisible()
        await expect(page.getByTestId("ondo-b-japan-first-discovery")).toHaveCount(0)
        await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("data-nav-count", "5")
        expect((await rect(jeju)).height).toBeGreaterThanOrEqual(44)
        await expect(jeju).toHaveAttribute("data-truth-kind", "editorial-region")
        await expect(jeju).not.toHaveAttribute("data-official-count", /.+/)
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

        await seoul.click()
        await expect(page).toHaveURL(/city=seoul/)
        await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-effective-view", "map")
        let discovery = page.getByTestId("ondo-b-japan-first-discovery")
        await expect(discovery).toHaveAttribute("data-city-context", "seoul")
        let summary = discovery.locator(":scope > summary")
        expect((await rect(summary)).height).toBeGreaterThanOrEqual(44)
        await summary.click()
        await expect(discovery).toHaveAttribute("open", "")
        await expect(discovery.locator("[data-content-id]")).toHaveCount(7)
        expect(await discovery.locator("[data-content-id]:visible").evaluateAll((items) => items.map((item) => item.getAttribute("data-content-id")))).toEqual(["C01", "C03", "C06"])
        await discovery.getByTestId("ondo-b-japan-more-stories").locator(":scope > summary").click()
        await expect(discovery.locator("[data-content-id]:visible")).toHaveCount(7)
        for (const contentId of ["C01", "C06", "C12", "C22"]) {
          await discovery.getByTestId(`ondo-b-story-sources-${contentId}`).locator(":scope > summary").click()
        }
        await expect(discovery.locator("[data-content-id] a[target='_blank']:visible")).toHaveCount(12)
        await expect(discovery).not.toContainText(/\bC0?\d\b|\bP[01]\b/)
        const firstSource = discovery.locator("[data-content-id='C02'] a")
        expect((await rect(firstSource)).height).toBeGreaterThanOrEqual(44)
        const visibleTextBelowFloor = await discovery.evaluate((root) => Array.from(root.querySelectorAll<HTMLElement>("*"))
          .filter((element) => {
            const style = getComputedStyle(element)
            return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0
              && Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
              && Number.parseFloat(style.fontSize) < 12
          }).map((element) => ({ tag: element.tagName, text: element.textContent?.trim(), size: getComputedStyle(element).fontSize })))
        expect(visibleTextBelowFloor).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

        await page.getByTestId("ondo-b-city-back").click()
        await expect(atlas).toBeVisible()
        await jeju.click()
        await expect(page).toHaveURL(/city=jeju/)
        await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-effective-view", "map")
        discovery = page.getByTestId("ondo-b-japan-first-discovery")
        await expect(discovery).toHaveAttribute("data-city-context", "jeju")
        summary = discovery.locator(":scope > summary")
        await summary.click()
        await expect(discovery.locator("[data-content-id]")).toHaveCount(2)
        await expect(discovery.locator("[data-content-id] a[target='_blank']:visible")).toHaveCount(2)
        const jejuSeeds = page.getByTestId("ondo-b-jeju-editorial-seeds")
        await expect(jejuSeeds).toHaveAttribute("data-seed-count", "10")
        await expect(jejuSeeds).toHaveAttribute("data-source-type", "editorial-research")
        await expect(jejuSeeds).toHaveAttribute("data-official-record-count", "none")
        await expect(jejuSeeds).not.toContainText(/200 official|공식 기록 200/)
        await jejuSeeds.locator(":scope > summary").click()
        await expect(jejuSeeds.locator("a[target='_blank']:visible")).toHaveCount(4)
        const jejuBoundary = jejuSeeds.locator(":scope > div > small")
        await jejuBoundary.scrollIntoViewIfNeeded()
        await expect(jejuBoundary).toBeInViewport()
        await expect(discovery).not.toContainText(/Directions|길찾기|Table|테이블|Payment|결제/)
      }
    })
  }
})
