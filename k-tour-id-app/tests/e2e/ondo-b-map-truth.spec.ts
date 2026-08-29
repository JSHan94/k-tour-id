import { expect, test, type Page } from "@playwright/test"
import { seedB } from "../helpers/ondo-b-qa"

const ALL_INTERESTS = ["Local classics", "Cafés and dessert", "Late-night food", "Lively", "A little calmer", "Vegetarian", "Vegan", "Halal", "Allergy-aware"]

const DETERMINISTIC_TILEJSON = {
  tilejson: "3.0.0",
  name: "ONDO map truth blank basemap",
  tiles: ["https://tiles.openfreemap.org/ondo-qa-empty/{z}/{x}/{y}.pbf"],
  minzoom: 0,
  maxzoom: 18,
  bounds: [124, 33, 132, 39],
}

async function stubDeterministicBasemap(page: Page) {
  await page.route("https://tiles.openfreemap.org/planet", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(DETERMINISTIC_TILEJSON) }),
  )
  await page.route("https://tiles.openfreemap.org/ondo-qa-empty/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/x-protobuf", body: Buffer.alloc(0) }),
  )
}

async function seed(page: Page, discoveryPreferences: string[] = [], session: Record<string, unknown> = {}) {
  await seedB(page, { locale: "en", session, local: { discoveryPreferences } })
}

test.describe("ONDO B map truth and failure boundary", () => {
  test.beforeEach(async ({ page }) => {
    // After19 is a KST-evening behavior. Pin the browser clock so this suite
    // proves the product contract instead of inheriting the runner's wall
    // clock and changing at midnight.
    await page.clock.setFixedTime(new Date("2026-08-19T20:30:00+09:00"))
  })

  test("source failure is latched into the list fallback and retry starts a fresh attempt", async ({ page }) => {
    await seed(page)
    let blockTiles = true
    await page.route(/tiles\.openfreemap\.org/, async (route) => {
      if (blockTiles) await route.abort("failed")
      else await route.continue()
    })

    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.locator("[data-city='seoul']").click()
    const root = page.getByTestId("ondo-b-map-entry")
    await test.step("B-E2E-FL-001-ERROR", async () => {
      await expect(root).toHaveAttribute("data-map-state", "error", { timeout: 12_000 })
      await expect(page.getByText("The map could not load. All 200 places remain available in the list.")).toBeVisible()
      await expect(page.getByTestId("ondo-b-venue-list").locator("li")).toHaveCount(31)
      await page.waitForTimeout(900)
      await expect(root).toHaveAttribute("data-map-state", "error")
    })

    await test.step("B-E2E-FL-001-RETRY", async () => {
      blockTiles = false
      await page.getByRole("button", { name: "Retry map" }).click()
      await expect(root).toHaveAttribute("data-map-attempt", "2")
    })
  })

  test("city cards and the compact ONDO temperature key keep official records separate from curated signals", async ({ page }) => {
    await seed(page)
    await stubDeterministicBasemap(page)
    await page.goto("/", { waitUntil: "domcontentloaded" })

    const seoul = page.locator("[data-city='seoul']")
    const busan = page.locator("[data-city='busan']")
    await expect(seoul).toHaveAttribute("data-official-count", "200")
    await expect(seoul).toHaveAttribute("data-region-role", "official-directory")
    await expect(seoul).toHaveAttribute("data-directory-source", "MOIS_LOCALDATA_GENERAL_RESTAURANTS")
    await expect(seoul).toHaveAttribute("aria-label", "Seoul · 200 places · Open map")
    await expect(busan).toHaveAttribute("data-official-count", "200")
    await expect(busan).toHaveAttribute("data-region-role", "official-directory")
    await expect(busan).toHaveAttribute("data-directory-source", "MOIS_LOCALDATA_GENERAL_RESTAURANTS")
    await expect(page.getByTestId("ondo-b-city-truth-legend")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-korea-atlas").locator("[data-region-kind-label]")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-korea-atlas")).not.toContainText("Explore")

    const language = page.getByTestId("ondo-b-map-entry").locator("button[data-language-target]")
    await expect(language).toHaveAccessibleName("Switch to Japanese")
    await language.click()
    await expect(seoul).toHaveAttribute("aria-label", "ソウル · 200か所 · 地図を開く")
    await expect(language).toHaveAccessibleName("韓国語に切り替える")
    await language.click()
    await expect(seoul).toHaveAttribute("aria-label", "서울 · 장소 200곳 · 지도 열기")
    await expect(language).toHaveAccessibleName("영어로 전환")
    await language.click()

    await seoul.click()
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await expect(root).toHaveAttribute("data-city-record-count", "200")
    await expect(root).toHaveAttribute("data-cluster-grammar", "official-record-count")
    await expect(root).toHaveAttribute("data-pulse-map-grammar", "aura-over-official-groups")
    await expect(root).toHaveAttribute("data-curated-pulse-count", "40")
    await expect(root).toHaveAttribute("data-pulse-map-anchor-count", "8")
    await expect(page.getByTestId("ondo-b-pulse-marker-accessible-detail").locator("li")).toHaveCount(40)
    const key = page.getByTestId("ondo-b-map-key")
    await expect(key).toHaveAttribute("data-pulse-key-presentation", "compact-gradient")
    await expect(key).toHaveAttribute("aria-label", "ONDO temperature · place groups. Outlined numbers group nearby places. Small dots are individual places. Curated visit signals, not live crowding or official LOCALDATA facts.")
    await key.getByTestId("ondo-b-map-key-details").locator(":scope > summary").click()
    await expect(key.getByTestId("ondo-b-pulse-legend").locator("[data-level]")).toHaveCount(6)
    await expect(key.getByTestId("ondo-b-pulse-composition-disclosure")).toContainText("Fixed walkthrough snapshots — not weather, live crowding or official LOCALDATA facts")
  })

  test("all onboarding interests remain visible and editable without unsupported filtering", async ({ page }) => {
    await seed(page, ["classic", "cafe", "late", "lively", "calm", "vegetarian", "vegan", "halal", "allergy_aware"])
    await page.goto("/?city=busan&view=list", { waitUntil: "domcontentloaded" })
    const map = page.getByTestId("ondo-b-map-entry")
    await expect(map).toHaveAttribute("data-result-count", "200")

    await page.getByTestId("nav-settings").click()
    const settings = page.getByTestId("ondo-b-discovery-settings")
    await expect(settings.locator("summary")).toContainText("9 selected")
    await settings.locator("summary").click()
    await expect(settings).toContainText("These choices shape discovery context only. They never hide places or claim dietary support that has not been confirmed.")
    for (const interest of ALL_INTERESTS) await expect(settings.getByRole("button", { name: interest, exact: true })).toHaveAttribute("aria-pressed", "true")

    await settings.getByRole("button", { name: "Allergy-aware", exact: true }).click()
    await expect(settings.locator("summary")).toContainText("8 selected")
    await page.getByTestId("nav-ondo").click()
    await expect(map).toHaveAttribute("data-result-count", "200")
    await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText("200 places")
  })

  test("After19 highlights official bar-like source types without changing directory truth", async ({ page }) => {
    await seed(page, [], {
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2099-08-20T20:30:00+09:00",
      after19: "A19-ON",
    })

    for (const [city, label] of [["seoul", "Seoul"], ["busan", "Busan"]] as const) {
      await page.goto(`/?city=${city}&view=list`, { waitUntil: "domcontentloaded" })
      const root = page.getByTestId("ondo-b-map-entry")
      await expect(root).toHaveAttribute("data-after19-active", "true")
      await expect(root).toHaveAttribute("data-city-record-count", "200")
      await expect(root).toHaveAttribute("data-result-count", city === "seoul" ? "25" : "28")
      await expect(root).toHaveAttribute("data-curated-pulse-count", city === "seoul" ? "5" : "9")
      await expect(root).toHaveAttribute("data-pulse-map-anchor-count", city === "seoul" ? "5" : "8")
      await expect(page.getByRole("button", { name: "Bars & pubs", exact: true })).toHaveAttribute("aria-pressed", "true")
      const after19 = page.getByTestId("ondo-b-after19-global")
      await expect(after19).toHaveAttribute("data-after19-mode", "on")
      await expect(after19).toHaveAttribute("data-after19-age", "eligible")
      const after19Status = after19.getByRole("status")
      await expect(after19Status).toContainText("After 19 on")
      await expect(after19Status).toContainText(`Opened for this tab · ${label}`)
      await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText(`${city === "seoul" ? 25 : 28} places`)
      await expect(page.getByTestId("ondo-b-venue-list").locator("li")).toHaveCount(city === "seoul" ? 25 : 28)
      await expect(page.getByTestId("ondo-b-pulse-marker-accessible-detail").locator("li")).toHaveCount(city === "seoul" ? 5 : 9)
    }

    await page.getByRole("button", { name: "Turn off After 19 now" }).click()
    await page.getByTestId("global-after19-toggle").click()
    const prompt = page.getByRole("dialog", { name: "Turn on After 19?" })
    await expect(prompt).toContainText("Narrows this map to official business types associated with bars and pubs.")
    await prompt.getByText("What this changes", { exact: true }).click()
    await expect(prompt).toContainText("simulated OpenDID age-predicate receipt")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-result-count", "200")
  })

  test("After19 keeps its bar-and-pub scope when the user changes city through the Korea map", async ({ page }) => {
    await seed(page, [], {
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2099-08-20T20:30:00+09:00",
      after19: "A19-ON",
    })
    await stubDeterministicBasemap(page)
    await page.goto("/?city=seoul&view=map", { waitUntil: "domcontentloaded" })

    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-after19-active", "true")
    await expect(page.getByRole("button", { name: "Bars & pubs", exact: true })).toHaveAttribute("aria-pressed", "true")

    await page.getByTestId("ondo-b-city-back").click()
    await expect(page.getByTestId("ondo-b-korea-atlas")).toBeVisible()
    await page.locator("[data-city='busan']").click()

    await expect(root).toHaveAttribute("data-city", "busan")
    await expect(root).toHaveAttribute("data-after19-active", "true")
    await expect(root).toHaveAttribute("data-result-count", "28")
    await expect(page.getByRole("button", { name: "Bars & pubs", exact: true })).toHaveAttribute("aria-pressed", "true")
  })
})
