import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const PLACE_ID = "jeju-seongsan-ilchulbong"

const LOCALE_COPY = {
  en: { place: "Seongsan Ilchulbong Tuff Cone", close: "Close place" },
  ko: { place: "성산일출봉", close: "장소 닫기" },
  ja: { place: "城山日出峰", close: "スポットを閉じる" },
} as const

async function seed(page: Page, locale: keyof typeof LOCALE_COPY) {
  await page.addInitScript(({ key, language }) => {
    if (localStorage.getItem(key) !== null) return
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      discoveryPreferences: [],
      savedVenueIds: [],
      savedEditorialPlaceIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      recentEditorialPlaceIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: false,
      commerceReceipts: [],
    }))
  }, { key: DEVICE_KEY, language: locale })
}

test.describe("verified Jeju editorial loop", () => {
  test.describe.configure({ timeout: 120_000 })

  for (const locale of ["ko", "en", "ja"] as const) {
    test(`${locale.toUpperCase()} story focuses a point before internal detail, save, My Korea, and reload`, async ({ page }) => {
      await seed(page, locale)
      await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
      const atlas = page.getByTestId("ondo-b-korea-atlas")
      await expect(atlas).toBeVisible()
      await atlas.locator("[data-city='jeju']").click()
      await expect(page).toHaveURL(/city=jeju/)

      const city = page.getByTestId("ondo-b-map-entry")
      await expect(city).toHaveAttribute("data-editorial-point-count", "8")
      const stories = page.getByTestId("ondo-b-japan-first-discovery")
      await stories.locator(":scope > summary").click()
      await page.getByTestId("ondo-b-story-map-C18").click()

      await expect(page).toHaveURL(new RegExp(`editorialPlaceId=${PLACE_ID}(?!.*detail=1)`))
      await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.level)).toBe("peek")
      await expect(city).toHaveAttribute("data-selected-editorial-place-id", PLACE_ID)
      await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveCount(0)

      const placeList = page.getByTestId("ondo-b-editorial-place-list")
      await placeList.locator(":scope > summary").click()
      await placeList.getByRole("button", { name: LOCALE_COPY[locale].place, exact: true }).click()
      await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.level)).toBe("detail")
      await expect(page).toHaveURL(new RegExp(`editorialPlaceId=${PLACE_ID}.*detail=1`))

      const detail = page.getByTestId("ondo-b-editorial-place-overlay")
      await expect(detail).toBeVisible()
      await expect(detail).toHaveAttribute("data-editorial-place-id", PLACE_ID)
      await expect(detail).toHaveAttribute("data-official-record", "false")
      await expect(detail).toHaveAttribute("data-pulse-eligible", "false")
      await expect(detail).not.toContainText(/Pulse|Local Signal|Tables?|checkout/i)
      expect((await new AxeBuilder({ page }).include("[data-testid='ondo-b-editorial-place-overlay']").analyze()).violations).toEqual([])

      await page.getByTestId("ondo-b-editorial-place-save").click()
      await expect(detail).toHaveAttribute("data-save-state", "saved")
      await expect.poll(() => page.evaluate((key) => {
        const stored = JSON.parse(localStorage.getItem(key) ?? "{}")
        return { editorial: stored.savedEditorialPlaceIds, official: stored.savedVenueIds }
      }, DEVICE_KEY)).toEqual({ editorial: [PLACE_ID], official: [] })

      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveAttribute("data-editorial-place-id", PLACE_ID)
      await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveAttribute("data-save-state", "saved")
      await page.getByTestId("ondo-b-editorial-place-overlay").locator("header button").click()
      await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveCount(0)
      await expect(city).toHaveAttribute("data-selected-editorial-place-id", PLACE_ID)

      await page.getByTestId("nav-my").click()
      const saved = page.getByTestId(`saved-editorial-${PLACE_ID}`)
      await expect(saved).toBeVisible()
      await expect(saved).toContainText(LOCALE_COPY[locale].place)
      await saved.click()
      await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveAttribute("data-editorial-place-id", PLACE_ID)
      await expect(page).toHaveURL(new RegExp(`editorialPlaceId=${PLACE_ID}.*detail=1`))
      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveAttribute("data-save-state", "saved")
    })
  }
})
