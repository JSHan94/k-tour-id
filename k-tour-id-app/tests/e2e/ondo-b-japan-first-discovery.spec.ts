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

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x)
    && Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y)
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

        const nation = page.getByTestId("ondo-b-nation")
        const discovery = page.getByTestId("ondo-b-japan-first-discovery")
        const summary = discovery.locator(":scope > summary")
        const seoul = nation.locator("[data-city='seoul']")
        const busan = nation.locator("[data-city='busan']")
        await expect(nation).toBeVisible()
        await expect(discovery).toBeVisible()
        await expect(discovery).not.toHaveAttribute("open", "")
        await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("data-nav-count", "5")

        expect(await discovery.evaluate((element) => {
          const seoulButton = element.parentElement?.querySelector("[data-city='seoul']")
          return Boolean(seoulButton && (seoulButton.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING))
        })).toBe(true)
        expect((await rect(summary)).height).toBeGreaterThanOrEqual(44)
        expect(await summary.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)?.closest("summary") === element
        })).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

        await summary.click()
        await expect(discovery).toHaveAttribute("open", "")
        await expect(discovery.locator("[data-content-id]")).toHaveCount(9)
        expect(await discovery.locator("[data-content-id]:visible").evaluateAll((items) => items.map((item) => item.getAttribute("data-content-id")))).toEqual(["C01", "C03", "C06"])
        const jeju = page.getByTestId("ondo-b-jeju-editorial-seeds")
        await expect(jeju).toHaveAttribute("data-seed-count", "10")
        await expect(jeju).toHaveAttribute("data-source-type", "editorial-research")
        await expect(jeju).toHaveAttribute("data-official-record-count", "none")
        await expect(jeju).not.toContainText(/200 official|공식 기록 200/)
        await discovery.getByTestId("ondo-b-japan-more-stories").locator(":scope > summary").click()
        await expect(discovery.locator("[data-content-id]:visible")).toHaveCount(9)
        for (const contentId of ["C01", "C06", "C12", "C22"]) {
          await discovery.getByTestId(`ondo-b-story-sources-${contentId}`).locator(":scope > summary").click()
        }
        await expect(discovery.locator("[data-content-id] a[target='_blank']:visible")).toHaveCount(14)
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

        for (const city of [seoul, busan]) {
          const [cityBox, discoveryBox] = await Promise.all([rect(city), rect(discovery)])
          expect(intersects(cityBox, discoveryBox)).toBe(false)
        }

        await jeju.locator(":scope > summary").click()
        await expect(jeju.locator("a[target='_blank']:visible")).toHaveCount(4)
        const jejuBoundary = jeju.locator(":scope > div > small")
        await jejuBoundary.scrollIntoViewIfNeeded()
        await expect(jejuBoundary).toBeInViewport()

        await summary.click()
        await expect(discovery).not.toHaveAttribute("open", "")
        await seoul.click()
        await expect(page).toHaveURL(/city=seoul/)
        await expect(page.getByTestId("ondo-b-map-entry").getByRole("heading", { level: 1 })).toHaveText(locale === "ko" ? "서울" : "Seoul")
      }
    })
  }
})
