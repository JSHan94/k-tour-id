import { expect, test, type Page } from "@playwright/test"

const ALL_INTERESTS = ["Local classics", "Cafés and dessert", "Late-night food", "Lively", "A little calmer", "Vegetarian", "Vegan", "Halal", "Allergy-aware"]

async function seed(page: Page, discoveryPreferences: string[] = [], session: Record<string, unknown> = {}) {
  await page.addInitScript(({ discoveryPreferences, session }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST", ...session }))
  }, { discoveryPreferences, session })
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

    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.locator("[data-city='seoul']").click()
    const root = page.getByTestId("ondo-b-map-entry")
    await test.step("B-E2E-FL-001-ERROR", async () => {
      await expect(root).toHaveAttribute("data-map-state", "error", { timeout: 12_000 })
      await expect(page.getByText("The map could not load. The same sourced place list remains available.")).toBeVisible()
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

  test("city cards and marker key separate official records from simulated ONDO inputs", async ({ page }) => {
    await seed(page)
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })

    const seoul = page.locator("[data-city='seoul']")
    const busan = page.locator("[data-city='busan']")
    await expect(seoul).toHaveAttribute("data-official-count", "200")
    await expect(seoul).toHaveAttribute("data-signal-venue-count", "40")
    await expect(seoul).toHaveAttribute("data-sample-count", "589")
    await expect(seoul).toHaveAttribute("data-signal-truth", "SIMULATED")
    await expect(seoul).toHaveAttribute("data-official-count", "200")
    await expect(seoul).toHaveAttribute("data-signal-venue-count", "40")
    await expect(seoul).toHaveAttribute("aria-label", /589 simulated inputs · Moderate illustrative score basis · Simulated snapshot · ONDO 71/)
    await expect(busan).toHaveAttribute("data-sample-count", "601")
    const truthLegend = page.getByTestId("ondo-b-city-truth-legend")
    await expect(truthLegend).toContainText("200 sourced · 40 scored previews")
    await expect(truthLegend).toContainText("589 simulated inputs · Moderate preview band")
    await expect(truthLegend).toContainText("601 simulated inputs · Moderate preview band")
    await expect(truthLegend).toContainText("Fixed Aug 19 snapshot · Not live · Simulated")

    await page.getByTestId("ondo-b-map-entry").getByRole("button", { name: "KO", exact: true }).click()
    await expect(seoul).toHaveAttribute("aria-label", /200곳의 공식 장소 기록 · 40곳의 시뮬레이션 프리뷰/)
    await page.getByTestId("ondo-b-map-entry").getByRole("button", { name: "EN", exact: true }).click()

    await seoul.click()
    const root = page.getByTestId("ondo-b-map-entry")
    await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await expect(root).toHaveAttribute("data-cluster-grammar", "outlined-count")
    await expect(root).toHaveAttribute("data-score-grammar", "solid-heat")
    await expect(root).toHaveAttribute("data-neutral-source-count", "160")
    await expect(root).toHaveAttribute("data-signal-source-count", "40")
    await expect(root).toHaveAttribute("data-signal-zoom-tier", "top")
    await expect.poll(async () => Number(await root.getAttribute("data-rendered-signal-count"))).toBeGreaterThan(0)
    await expect.poll(async () => Number(await root.getAttribute("data-rendered-signal-count"))).toBeLessThanOrEqual(10)
    await expect.poll(async () => Number(await root.getAttribute("data-min-signal-distance-px"))).toBeGreaterThanOrEqual(28)
    const key = page.getByTestId("ondo-b-map-key")
    await expect(key).toContainText("Places")
    await expect(key).toContainText("Simulated score")
    await expect(key).toContainText("Highest simulated scores at this zoom")
    await expect(key).toHaveAttribute("aria-label", "Outlined count means a sourced place group. Solid color means a simulated ONDO score. Highest simulated scores at this zoom.")

    await page.getByTitle("Zoom in").click()
    await page.waitForTimeout(550)
    await page.getByTitle("Zoom in").click()
    await page.waitForTimeout(550)
    await expect(root).toHaveAttribute("data-signal-zoom-tier", "more")

    await page.getByTitle("Zoom in").click()
    await page.waitForTimeout(550)
    await page.getByTitle("Zoom in").click()
    await page.waitForTimeout(550)
    await expect(root).toHaveAttribute("data-signal-zoom-tier", "all")
  })

  test("all onboarding interests remain visible and editable without unsupported filtering", async ({ page }) => {
    await seed(page, ["classic", "cafe", "late", "lively", "calm", "vegetarian", "vegan", "halal", "allergy_aware"])
    await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
    await page.locator("[data-city='busan']").click()

    const summary = page.getByTestId("ondo-b-preference-summary")
    await expect(summary).toContainText("9 starting interests")
    await summary.click()
    const panel = page.getByTestId("ondo-b-preference-panel")
    await expect(panel).toContainText("results are not silently filtered")
    for (const interest of ALL_INTERESTS) await expect(panel.getByRole("button", { name: interest })).toHaveAttribute("aria-pressed", "true")

    await panel.getByRole("button", { name: "Reset interests" }).click()
    await expect(summary).toContainText("Tune interests")
    await expect(page.getByText(/^200 sourced food places$/)).toBeVisible()
  })

  test("After19 map shows actual eligible night-preview counts and simulated policy truth", async ({ page }) => {
    await seed(page, [], {
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      ageExpiresAt: "2099-08-20T20:30:00+09:00",
      after19: "A19-ON",
    })

    for (const [city, count] of [["seoul", 7], ["busan", 10]] as const) {
      await page.goto(`/ondo-b?city=${city}&view=list`, { waitUntil: "domcontentloaded" })
      const root = page.getByTestId("ondo-b-map-entry")
      await expect(root).toHaveAttribute("data-signal-source-count", String(count))
      await expect(root).toContainText(`${count} ONDO simulated 19+ night-preview places`)
      await expect(page.getByTestId("ondo-b-venue-list").locator("li")).toHaveCount(count)
    }

    await page.getByTestId("ondo-b-map-entry").getByRole("button", { name: "KO", exact: true }).click()
    await expect(page.getByTestId("ondo-b-map-entry")).toContainText("10곳의 ONDO 시뮬레이션 19+ 야간 프리뷰 장소")
  })
})
