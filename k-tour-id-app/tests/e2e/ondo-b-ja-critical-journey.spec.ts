import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"

async function seedJapaneseDevice(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      locale: "ja",
      onboarding: "ONB-COMPLETE",
      persona: "travelling",
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
  }, DEVICE_KEY)
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function gotoJapaneseB(page: Page, search = "") {
  await seedJapaneseDevice(page)
  await page.goto(`/ondo-b${search}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", "ja")
  await expect(page.locator("html")).toHaveAttribute("lang", "ja")
}

test.describe("ONDO B Japanese critical journey", () => {
  test("Japanese is a persisted first-class language across the shell and compact settings", async ({ page }) => {
    await gotoJapaneseB(page)
    await expect(page.getByTestId("nav-ondo")).toHaveAccessibleName("探す")
    await expect(page.getByTestId("nav-my")).toHaveAccessibleName("マイ韓国")
    await expect(page.getByTestId("nav-tables")).toHaveAccessibleName("テーブル")
    await expect(page.getByTestId("nav-id")).toHaveAccessibleName("ID・ウォレット")
    await expect(page.getByTestId("nav-settings")).toHaveAccessibleName("設定")

    await page.getByTestId("nav-settings").click()
    const settings = page.getByTestId("ondo-b-settings-entry")
    await expect(settings.getByRole("heading", { name: "設定", exact: true })).toBeVisible()
    await expect(settings.getByRole("button", { name: "日本語", exact: true })).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByTestId("ondo-b-discovery-settings")).not.toHaveAttribute("open", "")
    await expect(page.getByTestId("ondo-b-device-data-settings")).not.toHaveAttribute("open", "")

    await settings.getByRole("button", { name: "English", exact: true }).click()
    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", "en")
    await settings.getByRole("button", { name: "日本語", exact: true }).click()
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-locale", "ja")
    await expect(page.locator("html")).toHaveAttribute("lang", "ja")
  })

  test("Explore, Place, Tables, My Korea, and ID Wallet remain one Japanese journey", async ({ page }) => {
    await gotoJapaneseB(page, "?city=seoul&view=list")
    await expect(page.getByTestId("ondo-b-search")).toHaveAttribute("placeholder", "場所・エリア・業種を検索")
    await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
    await page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id] button").first().click()
    const place = page.getByTestId("canonical-place-peek")
    await expect(place.getByRole("link", { name: "経路を見る" })).toBeVisible()
    await expect(place.getByRole("button", { name: /公式記録の詳細/ })).toBeVisible()
    await place.getByRole("button", { name: "場所を閉じる" }).click()

    await page.getByTestId("nav-tables").click()
    await expect(page.getByRole("heading", { name: "Pulse Tables" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Tableを見る" })).toBeVisible()

    await page.getByTestId("nav-id").click()
    await expect(page.getByTestId("ondo-b-traveler-id").getByRole("heading", { name: "トラベルパス" })).toBeVisible()
    await expect(page.getByTestId("wallet-balance")).toContainText("テスト残高")

    await page.getByTestId("nav-my").click()
    await expect(page.getByTestId("ondo-b-my-korea-entry").getByRole("heading", { name: "マイ韓国" })).toBeVisible()
    await expect(page.getByTestId("ondo-b-my-korea-entry")).toContainText("まだ保存した場所はありません")
  })

  test("Jeju stays a truthful Japanese editorial collection inside Explore", async ({ page }) => {
    await gotoJapaneseB(page)
    const atlas = page.getByTestId("ondo-b-korea-atlas")
    const jeju = atlas.locator("[data-city='jeju']")
    await expect(jeju).toContainText("旅行アイデア10件")
    await jeju.click()
    await expect(page).toHaveURL(/city=jeju/)
    const discovery = page.getByTestId("ondo-b-japan-first-discovery")
    await expect(discovery).toHaveAttribute("data-city-context", "jeju")
    await discovery.locator(":scope > summary").click()
    await expect(discovery).toContainText("確認済み8か所・確認中2か所")
    await expect(discovery).toContainText("8か所の公式ページと地図座標")
    await expect(discovery).toContainText("2件は情報源リンクのみ")
    const seeds = page.getByTestId("ondo-b-jeju-editorial-seeds")
    await expect(seeds).toHaveAttribute("data-official-record-count", "none")
    await expect(seeds).not.toContainText(/公式記録200|200 official/)
  })
})
