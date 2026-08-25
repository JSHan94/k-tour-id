import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const SOURCE_ID = "MOIS_LOCALDATA_GENERAL_RESTAURANTS"

async function seedDirectory(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript((nextLocale) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, locale)
}

async function expectNoSeriousAxe(page: Page, selector: string) {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .exclude(".maplibregl-cooperative-gesture-screen")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])
}

test.describe("production official-source discovery", () => {
  test("first run is a short bilingual source introduction", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

    const onboarding = page.getByTestId("ondo-onboarding")
    await expect(onboarding).toBeVisible()
    await expect(onboarding).toContainText("400 licensed food-service records")
    await expect(onboarding).toContainText("Seoul and Busan")
    await expect(onboarding).not.toContainText(/demo|simulat|score|persona/i)
    await onboarding.getByRole("button", { name: "한국어로 보기" }).click()
    await expect(onboarding).toContainText("일반음식점 인허가 기록 400개")
    await expect(onboarding).toContainText("서울과 부산")
    await expectNoSeriousAxe(page, "[data-testid='ondo-onboarding']")
    await onboarding.getByRole("button", { name: "게스트로 탐색", exact: true }).click()
    await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  })

  test("city, official category, search, list and legacy URL cleanup remain usable", async ({ page }) => {
    await seedDirectory(page)
    await page.goto("/ondo-b?city=seoul&view=list&heat=signal&hot=1&after19Return=legacy", { waitUntil: "domcontentloaded" })

    await expect(page).toHaveURL(/city=seoul/)
    await expect(page).toHaveURL(/view=list/)
    await expect(page).not.toHaveURL(/heat=|hot=|after19Return=/)
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-directory-source", SOURCE_ID)
    await expect(root).toHaveAttribute("data-city-record-count", "200")
    await expect(page.getByText("200 official records", { exact: true })).toBeVisible()

    const koreanCategory = page.getByRole("button", { name: "Korean", exact: true })
    await koreanCategory.click()
    await expect(koreanCategory).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByText("50 official records", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "All", exact: true }).click()
    await page.getByLabel("Place, district or category").fill("로바")
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(1)
    await expect(page.getByTestId("ondo-b-venue-list")).toContainText("Official Korean source name")
    await expectNoSeriousAxe(page, "[data-testid='ondo-b-map-entry']")
  })

  test("map failure keeps the same official directory and retry is real", async ({ page }) => {
    await seedDirectory(page)
    let failTiles = true
    await page.route("https://tiles.openfreemap.org/**", async (route) => {
      if (failTiles) await route.abort("failed")
      else await route.continue()
    })
    await page.goto("/ondo-b?city=busan", { waitUntil: "domcontentloaded" })
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "error", { timeout: 15_000 })
    await expect(page.getByTestId("ondo-b-map-fallback-status")).toContainText("200 official records remain available")
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(30)
    failTiles = false
    await page.getByRole("button", { name: "Retry map" }).click()
    await expect(root).toHaveAttribute("data-map-attempt", "2")
  })

  test("place detail shows sourced facts, unknowns, directions and no unsupported actions", async ({ page }) => {
    await seedDirectory(page)
    await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
    await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
    const peek = page.getByTestId("canonical-place-peek")
    await expect(peek).toContainText("Official LOCALDATA record")
    await expect(peek.getByTestId("canonical-venue-directions")).toHaveAttribute("href", /google\.com\/maps\/dir/)
    await peek.getByTestId("canonical-place-details").click()

    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await expect(detail.locator(`[data-detail-source='${SOURCE_ID}']`)).toBeVisible()
    await expect(detail).toContainText("Not provided by this source")
    await expect(detail.getByTestId("canonical-venue-primary-directions")).toBeVisible()
    const save = detail.getByTestId("canonical-venue-save")
    await expect(save).toBeVisible()
    await save.focus()
    await save.click()
    await expect(save).toHaveAttribute("aria-pressed", "true")
    await expect(save).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(detail).toBeHidden()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(detail.locator("[data-testid='canonical-venue-signal'], [data-testid='canonical-venue-tables'], [data-testid='canonical-venue-checkout'], [data-testid='canonical-after19-access']")).toHaveCount(0)
    await page.getByTestId("canonical-place-details").click()
    await expectNoSeriousAxe(page, "[data-testid='canonical-place-overlay']")
  })
})
