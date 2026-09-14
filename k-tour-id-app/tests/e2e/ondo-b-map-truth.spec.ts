import { expect, test, type Page } from "@playwright/test"
import { seedB } from "../helpers/ondo-b-qa"

const EDITABLE_INTERESTS = ["Local classics", "Cafés and dessert", "Vegetarian", "Vegan", "Halal", "Allergy-aware"]
const LEGACY_INTERESTS = ["Late-night food", "Lively", "A little calmer"]

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

async function seed(
  page: Page,
  discoveryPreferences: string[] = [],
  session: Record<string, unknown> = {},
  after19ReviewFixture = false,
) {
  await seedB(page, {
    locale: "en",
    session,
    local: { discoveryPreferences },
    after19ReviewFixture,
    after19LocalDeclaration: after19ReviewFixture,
  })
}

test.describe("ONDO B map truth and failure boundary", () => {
  test.beforeEach(async ({ page }) => {
    // After19 is a KST-evening behavior. Pin the browser clock so this suite
    // proves the product contract instead of inheriting the runner's wall
    // clock and changing at midnight.
    await page.clock.setFixedTime(new Date("2026-08-19T20:30:00+09:00"))
  })

  test("source failure keeps local temperature context, exposes the limitation, and List remains available", async ({ page }) => {
    await seed(page)
    let blockTiles = true
    await page.route(/tiles\.openfreemap\.org/, async (route) => {
      if (blockTiles) await route.abort("failed")
      else await route.continue()
    })

    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.locator("[data-city='seoul']").click()
    const root = page.getByTestId("ondo-b-map-entry")
    await test.step("B-E2E-FL-001-RECOVERABLE", async () => {
      // Nation and city now share one live canvas, so a city transition must
      // not regress to the old loading/snapshot bridge even when remote tiles
      // fail. The existing local geography remains directly usable.
      await expect(page.getByTestId("ondo-b-map-loading-context")).toHaveCount(0)
      await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 12_000 })
      await expect(root).toHaveAttribute("data-map-partial-failure", "recoverable")
      await expect(page.getByTestId("ondo-b-map-transport-status")).toContainText("Map details unavailable")
      await page.getByTestId("ondo-b-view-toggle").click()
      await expect(root).toHaveAttribute("data-effective-view", "list")
      await expect(page.getByTestId("ondo-b-venue-list").locator("li")).toHaveCount(31)
    })

    await test.step("B-E2E-FL-001-FRESH-MAP", async () => {
      blockTiles = false
      await page.getByTestId("ondo-b-view-toggle").click()
      await expect(root).toHaveAttribute("data-effective-view", "map")
      await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
      await expect(root).toHaveAttribute("data-map-partial-failure", "none")
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
    await expect(seoul).toHaveAttribute("aria-label", /Seoul · ONDO temperature .* · Open map/)
    await expect(busan).toHaveAttribute("data-official-count", "200")
    await expect(busan).toHaveAttribute("data-region-role", "official-directory")
    await expect(busan).toHaveAttribute("data-directory-source", "MOIS_LOCALDATA_GENERAL_RESTAURANTS")
    await expect(page.getByTestId("ondo-b-city-truth-legend")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-korea-atlas").locator("[data-region-kind-label]")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-korea-atlas")).not.toContainText("Explore")

    const language = page.getByTestId("ondo-b-map-entry").locator("button[data-language-target]")
    await expect(language).toHaveAccessibleName("Switch to Japanese")
    await language.click()
    await expect(seoul).toHaveAttribute("aria-label", /ソウル · ONDO温度.*地図を開く/)
    await expect(language).toHaveAccessibleName("韓国語に切り替える")
    await language.click()
    await expect(seoul).toHaveAttribute("aria-label", /서울 · 온도 .* · 지도 열기/)
    await expect(language).toHaveAccessibleName("영어로 전환")
    await language.click()

    await seoul.click()
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await expect(root).toHaveAttribute("data-city-record-count", "200")
    await expect(root).toHaveAttribute("data-cluster-grammar", "official-record-count")
    await expect(root).toHaveAttribute("data-pulse-map-grammar", "temperature-field-over-map-context")
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

  test("supported interests stay editable while inert legacy choices remain off-screen and preserved", async ({ page }) => {
    await seed(page, ["classic", "cafe", "late", "lively", "calm", "vegetarian", "vegan", "halal", "allergy_aware"])
    await page.goto("/?city=busan&view=list", { waitUntil: "domcontentloaded" })
    const map = page.getByTestId("ondo-b-map-entry")
    await expect(map).toHaveAttribute("data-result-count", "200")

    await page.getByTestId("nav-settings").click()
    const settings = page.getByTestId("ondo-b-discovery-settings")
    await expect(settings).toContainText("+4")
    await settings.click()
    const preferences = page.getByRole("dialog", { name: "Discovery preferences", exact: true })
    await expect(preferences).toContainText("Dietary choices highlight context. They do not claim confirmed support or hide places.")
    for (const interest of EDITABLE_INTERESTS) await expect(preferences.getByRole("button", { name: interest, exact: true })).toHaveAttribute("aria-pressed", "true")
    for (const interest of LEGACY_INTERESTS) await expect(preferences.getByRole("button", { name: interest, exact: true })).toHaveCount(0)

    await preferences.getByRole("button", { name: "Allergy-aware", exact: true }).click()
    await preferences.getByTestId("settings-preferences-save").click()
    await expect(settings).toContainText("+3")
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ondo-b.device.v1") ?? "{}").discoveryPreferences)).toEqual([
      "classic", "cafe", "late", "lively", "calm", "vegetarian", "vegan", "halal",
    ])
    await page.getByTestId("nav-ondo").click()
    await expect(map).toHaveAttribute("data-result-count", "200")
    await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText("200 places")
  })

  test("After19 filters to approved night places without rewriting the saved category", async ({ page }) => {
    await seed(page, [], {
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-20T20:30:00+09:00",
      after19: "A19-ON",
    }, true)

    const expected = {
      seoul: { results: "25", curated: "5", anchors: "5" },
      busan: { results: "28", curated: "9", anchors: "8" },
    } as const
    for (const city of ["seoul", "busan"] as const) {
      await page.goto(`/?city=${city}&view=list`, { waitUntil: "domcontentloaded" })
      const root = page.getByTestId("ondo-b-map-entry")
      await expect(root).toHaveAttribute("data-after19-active", "true")
      await expect(root).toHaveAttribute("data-after19-lens-policy", "derived-night-filter-preserve-discovery-state")
      await expect(root).toHaveAttribute("data-after19-result-policy", "approved-night-subset")
      await expect(root).toHaveAttribute("data-city-record-count", "200")
      await expect(root).toHaveAttribute("data-result-count", expected[city].results)
      await expect(root).toHaveAttribute("data-curated-pulse-count", expected[city].curated)
      await expect(root).toHaveAttribute("data-pulse-map-anchor-count", expected[city].anchors)
      const nightCategory = page.getByRole("button", { name: "Bars & pubs", exact: true })
      await expect(nightCategory).toHaveAttribute("aria-pressed", "true")
      await expect(nightCategory).toHaveAttribute("aria-disabled", "true")
      await expect(nightCategory).toHaveAttribute("data-after19-category-locked", "true")
      await expect(page.getByRole("button", { name: "All", exact: true })).toHaveCount(0)
      const after19 = page.getByTestId("ondo-b-after19-global")
      await expect(after19).toHaveAttribute("data-after19-mode", "on")
      await expect(after19).toHaveAttribute("data-after19-age", "eligible")
      await expect(after19.getByTestId("global-after19-banner")).toBeVisible()
      await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText(`${expected[city].results} places`)
      await expect.poll(() => page.getByTestId("ondo-b-venue-list").locator("li").count()).toBeGreaterThan(0)
      await expect(page.getByTestId("ondo-b-pulse-marker-accessible-detail").locator("li")).toHaveCount(Number(expected[city].curated))
    }

    await page.getByTestId("global-after19-review-toggle").click()
    await page.getByTestId("global-after19-turn-off").click()
    await page.getByTestId("global-after19-toggle").click()
    const prompt = page.getByRole("dialog", { name: "Night view" })
    await expect(prompt).toContainText("See places that fit a night out on this map.")
    await prompt.getByText("Before you continue", { exact: true }).click()
    await expect(prompt).toContainText("opens night view in this tab")
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-result-count", "200")
  })

  test("After19 keeps the derived night subset when the user changes canonical city", async ({ page }) => {
    await seed(page, [], {
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2026-08-20T20:30:00+09:00",
      after19: "A19-ON",
    }, true)
    await stubDeterministicBasemap(page)
    await page.goto("/?city=seoul&view=map", { waitUntil: "domcontentloaded" })

    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-after19-active", "true")
    await expect(root).toHaveAttribute("data-after19-lens-policy", "derived-night-filter-preserve-discovery-state")
    await expect(root).toHaveAttribute("data-result-count", "25")
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
