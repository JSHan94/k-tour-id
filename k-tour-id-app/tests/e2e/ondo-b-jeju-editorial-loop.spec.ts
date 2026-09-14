import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const ACCOUNT_KEY = "ondo-b.account.v1"
const PLACE_ID = "jeju-seongsan-ilchulbong"

const LOCALE_COPY = {
  en: { place: "Seongsan Ilchulbong Tuff Cone", close: "Close place", sourceDetails: "Source details", checked: "Place page and embedded map checked Aug 28, 2026", temperature: "ONDO temperature · Editorial place coverage: Grouped · No popularity score" },
  ko: { place: "성산일출봉", close: "장소 닫기", sourceDetails: "출처 정보", checked: "장소 페이지와 내장 지도를 2026년 8월 28일 확인", temperature: "온도 · 편집 장소 분포: 모임 · 인기 점수 없음" },
  ja: { place: "城山日出峰", close: "スポットを閉じる", sourceDetails: "情報源の詳細", checked: "スポットページと埋め込み地図を2026年8月28日に確認", temperature: "ONDO温度 · 編集スポットの分布: まとまり · 人気スコアなし" },
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
      await page.goto("/", { waitUntil: "domcontentloaded" })
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

      await page.getByTestId("ondo-b-view-toggle").click()
      await expect(city).toHaveAttribute("data-effective-view", "list")
      const placeList = page.getByTestId("ondo-b-editorial-place-list")
      await expect(placeList).toHaveAttribute("data-list-grammar", "shared-place-cards")
      await placeList.locator(`[data-editorial-place-id='${PLACE_ID}'] button`).click()
      const peek = page.getByTestId("ondo-b-editorial-place-peek")
      await expect(peek).toBeVisible()
      const peekTemperature = peek.locator("[data-pulse-level]")
      await expect(peekTemperature).toHaveAttribute("data-pulse-level", "limited")
      await expect(peekTemperature).toHaveAttribute("data-coverage-intensity", "clustered")
      await expect(peekTemperature).toHaveAttribute("data-temperature-model", "editorial-unscored")
      await expect(peekTemperature).toHaveAccessibleName(LOCALE_COPY[locale].temperature)
      await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.level)).toBe("peek")
      await page.getByTestId("ondo-b-editorial-place-details").click()
      await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery?.level)).toBe("detail")
      await expect(page).toHaveURL(new RegExp(`editorialPlaceId=${PLACE_ID}.*detail=1`))

      const detail = page.getByTestId("ondo-b-editorial-place-overlay")
      await expect(detail).toBeVisible()
      await expect(detail).toHaveAttribute("data-editorial-place-id", PLACE_ID)
      await expect(detail).toHaveAttribute("data-official-record", "false")
      await expect(detail).toHaveAttribute("data-pulse-eligible", "false")
      const detailTemperature = detail.locator("[data-pulse-level]")
      await expect(detailTemperature).toHaveAttribute("data-pulse-level", "limited")
      await expect(detailTemperature).toHaveAttribute("data-coverage-intensity", "clustered")
      await expect(detailTemperature).toHaveAttribute("data-editorial-temperature-mode", "editorial-coverage")
      await expect(detailTemperature).toHaveAccessibleName(LOCALE_COPY[locale].temperature)
      await expect(detail).not.toContainText(/Pulse|Local Signal|Tables?|checkout/i)
      await expect(detail.getByText(LOCALE_COPY[locale].checked, { exact: true })).toBeHidden()
      await detail.locator("details summary").click({ force: true })
      await expect(detail.getByText(LOCALE_COPY[locale].checked, { exact: true })).toBeVisible()
      expect((await new AxeBuilder({ page }).include("[data-testid='ondo-b-editorial-place-overlay']").analyze()).violations).toEqual([])

      await page.getByTestId("ondo-b-editorial-place-save").click()
      const accountGate = page.getByTestId("account-save-gate")
      await expect(accountGate).toBeVisible()
      await expect(accountGate).toHaveAttribute("data-account-return-kind", "editorial")
      await expect(accountGate).toHaveAttribute("data-account-return-editorial-place", PLACE_ID)
      expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}"), ACCOUNT_KEY)).toMatchObject({
        account: "ACC-GUEST",
        returnTo: { action: "SAVE_VENUE", targetKind: "editorial", editorialPlaceId: PLACE_ID, returnLevel: "detail", draft: null },
      })
      await accountGate.getByTestId("gate-cancel").click()
      await expect(detail).toBeVisible()
      await expect(page.getByTestId("ondo-b-editorial-place-save")).toBeFocused()
      await expect(detail).toHaveAttribute("data-save-state", "idle")

      await page.getByTestId("ondo-b-editorial-place-save").click()
      await page.getByTestId("account-start").click()
      await expect(page.getByTestId("account-save-gate")).toHaveCount(0)
      await expect(detail).toBeVisible()
      await expect(detail).toHaveAttribute("data-save-state", "saved")
      await expect.poll(() => page.evaluate((key) => {
        const stored = JSON.parse(localStorage.getItem(key) ?? "{}")
        return { editorial: stored.savedEditorialPlaceIds, official: stored.savedVenueIds }
      }, DEVICE_KEY)).toEqual({ editorial: [PLACE_ID], official: [] })

      await page.reload({ waitUntil: "domcontentloaded" })
      await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveAttribute("data-editorial-place-id", PLACE_ID)
      await expect(page.getByTestId("ondo-b-editorial-place-overlay")).toHaveAttribute("data-save-state", "saved")
      await page.getByTestId("ondo-b-editorial-place-overlay").getByRole("button", { name: LOCALE_COPY[locale].close }).click()
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
