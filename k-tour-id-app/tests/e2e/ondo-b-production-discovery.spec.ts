import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const SOURCE_ID = "MOIS_LOCALDATA_GENERAL_RESTAURANTS"
const EMPTY_TABLE_VENUE_ID = "mois-18939eecb43c15ab4305"

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
    await expect(onboarding).toContainText("Find a meal that feels right for your Korea")
    await expect(onboarding).toContainText("Explore food in Seoul and Busan, plus travel ideas across Jeju")
    const identityEntry = onboarding.getByTestId("k-tour-id-setup-open")
    await expect(identityEntry).toContainText(/Optional.*guest Explore stays open/i)
    await expect(identityEntry).not.toContainText(/simulat/i)
    const discoveryCopy = await onboarding.evaluate((element) => {
      const copy = element.cloneNode(true) as HTMLElement
      copy.querySelector("[data-testid='k-tour-id-setup-open']")?.remove()
      return copy.innerText
    })
    expect(discoveryCopy).not.toMatch(/demo|simulat|score|persona/i)
    await onboarding.getByRole("button", { name: "한국어로 보기" }).click()
    await expect(onboarding).toContainText("나에게 맞는 한국의 한 끼")
    await expect(onboarding).toContainText("서울·부산의 먹거리와 제주 여행 아이디어")
    await expect(identityEntry).toContainText(/선택 사항.*게스트 탐색/)
    await expect(identityEntry).not.toContainText(/시뮬레이션/)
    await expectNoSeriousAxe(page, "[data-testid='ondo-onboarding']")
    for (const locale of ["ja", "en", "ko"] as const) {
      const choice = onboarding.locator(`[data-locale-choice='${locale}']`)
      await choice.click()
      await expect(choice).toHaveAttribute("aria-pressed", "true")
      await expect(onboarding.locator("[data-locale-choice][aria-pressed='true']")).toHaveCount(1)
      await expectNoSeriousAxe(page, "[data-testid='ondo-onboarding']")
    }
    await onboarding.getByRole("button", { name: "설정 없이 탐색", exact: true }).click()
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
    await expect(page.getByTestId("ondo-b-result-truth")).toContainText("200 places")
    await expect(page.getByTestId("ondo-b-view-toggle")).toContainText("Map")

    const koreanCategory = page.getByRole("button", { name: "Korean", exact: true })
    await koreanCategory.click()
    await expect(koreanCategory).toHaveAttribute("aria-pressed", "true")
    await expect(root).toHaveAttribute("data-result-count", "50")
    await expect(page.getByTestId("ondo-b-result-truth")).toContainText("50 places")
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
    await expect(page.getByTestId("ondo-b-map-fallback-status")).toContainText("All 200 places remain available")
    await expect(page.getByTestId("ondo-b-venue-list").locator("li[data-venue-id]")).toHaveCount(30)
    failTiles = false
    await page.getByRole("button", { name: "Retry map" }).click()
    await expect(root).toHaveAttribute("data-map-attempt", "2")
  })

  test("place detail shows sourced facts, unknowns, directions and no unsupported actions", async ({ page }) => {
    await seedDirectory(page)
    await page.goto("/ondo-b?city=seoul&view=list", { waitUntil: "domcontentloaded" })
    await page.getByTestId("ondo-b-venue-list").locator(`li[data-venue-id='${EMPTY_TABLE_VENUE_ID}'] button`).click()
    const peek = page.getByTestId("canonical-place-peek")
    await expect(peek).toContainText("LOCALDATA place information")
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
    const exactDetailUrl = page.url()
    await save.click()
    const accountGate = page.getByTestId("account-save-gate")
    await expect(accountGate).toBeVisible()
    await expect(accountGate).toHaveAttribute("data-account-return-level", "detail")
    await expect(accountGate).toHaveAttribute("data-account-return-venue", EMPTY_TABLE_VENUE_ID)
    await expect(accountGate).toHaveAttribute("data-account-return-draft", "none")
    await expect(save).toHaveAttribute("aria-pressed", "false")
    await page.keyboard.press("Escape")
    await expect(accountGate).toHaveCount(0)
    await expect(detail).toBeVisible()
    await expect(detail).toHaveAttribute("data-venue-id", EMPTY_TABLE_VENUE_ID)
    await expect(page).toHaveURL(exactDetailUrl)
    await expect(save).toBeFocused()
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}").savedVenueIds)).toEqual([])

    const after19 = detail.getByTestId("canonical-after19-access")
    await expect(after19).toHaveAttribute("data-after19-venue-status", "locked")
    await expect(after19).toHaveAttribute("data-after19-venue-id", EMPTY_TABLE_VENUE_ID)
    await expect(after19).not.toContainText("ONDO policy")

    const tableScope = detail.getByTestId("venue-table-scope")
    const tables = detail.getByTestId("canonical-venue-tables")
    await expect(detail.getByTestId("canonical-place-table")).toHaveCount(0)
    await expect(tableScope).toHaveAttribute("data-empty-state", "closed")
    await expect(tables).toContainText("Tables at this place")
    await expect(tables).toContainText("No open Table here yet")
    await tables.click()
    await expect(tableScope).toHaveAttribute("data-empty-state", "open")
    await expect(detail.getByTestId("venue-tables-empty")).toContainText("Keep this exact place open, or browse all local Tables.")
    await detail.getByTestId("tables-back-to-venue").click()
    await expect(tables).toHaveAttribute("aria-expanded", "false")
    await expect(tables).toBeFocused()

    await expect(detail.getByTestId("canonical-meal-benefit-open")).toContainText("See an ONDO meal benefit for this place.")
    await expect(detail.getByTestId("canonical-local-signal-open")).toContainText("device-local flow")
    await expect(detail.getByTestId("canonical-venue-checkout")).toHaveCount(0)
    await expect(page.getByTestId("checkout-overlay")).toHaveCount(0)

    await page.keyboard.press("Escape")
    await expect(detail).toBeHidden()
    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await expect(page.getByTestId("canonical-place-details")).toBeFocused()
    await page.getByTestId("canonical-place-details").click()
    await expectNoSeriousAxe(page, "[data-testid='canonical-place-overlay']")
  })
})
