import { expect, test } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  expectBRuntimeClean,
  getBRuntimeEvidence,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

test.describe("ONDO B sourced discovery and external-map boundary", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
    await seedB(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const city of ["seoul", "busan"] as const) {
    test(`B-DATA-${city.toUpperCase()} exposes exactly 200 sourced F&B places without fabricated heat`, async ({ page }) => {
      await gotoB(page)
      await page.locator(`[data-city='${city}']`).click()
      await page.getByRole("button", { name: "List" }).click()
      await expect(page.getByText(/^200 sourced food places$/)).toBeVisible()
      const list = page.getByTestId("ondo-b-venue-list")
      await expect(list.locator("li")).toHaveCount(31)
      await page.getByText("Load 30 more").click()
      await expect(list.locator("li")).toHaveCount(61)
      await page.getByRole("button", { name: "Signal pending", exact: true }).click()
      await expect(page.getByText(/^160 sourced food places$/)).toBeVisible()
      await expect(list.locator("[data-level='limited']").first()).toContainText("—")
      await expect(list).toContainText("Place only · signal pending")
    })
  }

  test("B-TRUTH-PLACE official-source place detail leaves unsupported fields unknown", async ({ page }) => {
    const detailResponsePromise = page.waitForResponse((response) => response.url().includes(`/api/ondo/venues/${CANONICAL_VENUE_ID}`))
    await openCanonicalVenue(page)
    const detailResponse = await detailResponsePromise
    expect(detailResponse.ok()).toBeTruthy()
    expect(await detailResponse.json()).toMatchObject({
      venue: {
        id: CANONICAL_VENUE_ID,
        address: { road: { truth: "OFFICIAL_SOURCE", sourceRefId: "MOIS_LOCALDATA_GENERAL_RESTAURANTS" } },
        facts: { openingHours: { value: null, truth: "UNKNOWN" } },
      },
    })
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail.locator("[data-detail-state='ready']")).toHaveAttribute("data-address-truth", "OFFICIAL_SOURCE")
    await expect(detail).toContainText("MOIS LOCALDATA")
    await expect(detail.getByText("Not confirmed by this source")).toHaveCount(4)
    await expect(detail).toContainText(/ONDO signal pending|Preview signal · Simulated/)
    await expect(detail).not.toContainText(/Open now|Foreign-issued cards accepted|English menu available/)
  })

  test("B-MAP-FALLBACK classifies OpenFreeMap failure and keeps the manual list usable", async ({ page }) => {
    await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("internetdisconnected"))
    await gotoB(page)
    await page.locator("[data-city='seoul']").click()

    const root = page.getByTestId("ondo-b-map-entry")
    await expect.poll(async () => root.getAttribute("data-map-state"), { timeout: 20_000 }).toMatch(/ready|error/)
    const state = await root.getAttribute("data-map-state")
    if (state === "ready") await page.getByRole("button", { name: "List" }).click()
    await expect(page.getByTestId("ondo-b-venue-list")).toBeVisible()
    await expect(page.getByText(/^200 sourced food places$/)).toBeVisible()
    if (state === "error") await expect(page.getByRole("button", { name: "Retry map" })).toBeVisible()
    await expect(page.getByTestId("ondo-b-venue-list").locator("li button").first()).toBeEnabled()
    expect(getBRuntimeEvidence(page).externalMap.length).toBeGreaterThan(0)
  })
})
