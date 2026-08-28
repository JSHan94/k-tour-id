import { expect, test } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  TABLE_ID,
  expectBRuntimeClean,
  getBRuntimeEvidence,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

test.describe("ONDO B official-record discovery and external-map boundary", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
    await seedB(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  for (const city of ["seoul", "busan"] as const) {
    test(`B-DATA-${city.toUpperCase()} exposes exactly 200 official records without fabricated heat`, async ({ page }) => {
      await gotoB(page)
      await page.locator(`[data-city='${city}']`).click()
      await page.getByRole("button", { name: "List" }).click()
      const root = page.getByTestId("ondo-b-map-entry")
      const curatedCount = 40
      await expect(root).toHaveAttribute("data-directory-source", "MOIS_LOCALDATA_GENERAL_RESTAURANTS")
      await expect(root).toHaveAttribute("data-city-record-count", "200")
      await expect(root).toHaveAttribute("data-result-count", "200")
      await expect(root).toHaveAttribute("data-curated-pulse-count", String(curatedCount))
      await expect(root).toHaveAttribute("data-pulse-map-anchor-count", "8")
      await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText("200 official records")
      const list = page.getByTestId("ondo-b-venue-list")
      await expect(list.locator("li")).toHaveCount(31)
      await page.getByText("Load 30 more").click()
      await expect(list.locator("li")).toHaveCount(61)
      const pulses = list.locator("[data-testid='ondo-b-list-pulse']")
      await expect(pulses).toHaveCount(60)
      await expect(list.locator("[data-testid='ondo-b-list-pulse'][data-pulse-level='limited']")).toHaveCount(60 - curatedCount)
      await expect(list.locator("[data-testid='ondo-b-list-pulse'][data-pulse-numeric='hidden']")).toHaveCount(60)
      await expect(page.getByTestId("ondo-b-pulse-disclosure")).toHaveText("Curated visit signals, not live crowding or official LOCALDATA facts.")
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
        facts: {
          openingHours: { value: null, truth: "UNKNOWN" },
          foreignCardAccepted: { value: null, truth: "UNKNOWN" },
          menu: { value: null, truth: "UNKNOWN" },
          englishSupport: { value: null, truth: "UNKNOWN" },
        },
      },
    })
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail.locator("[data-detail-state='ready']")).toHaveAttribute("data-address-truth", "OFFICIAL_SOURCE")
    await expect(detail).toContainText("MOIS LOCALDATA")
    const unknowns = detail.getByRole("heading", { name: "Information not provided by this source" }).locator("..")
    await expect(unknowns.locator(":scope > div")).toHaveCount(4)
    for (const label of ["Current opening hours", "Foreign-issued card support", "Menu and prices", "English-language support"]) {
      await expect(unknowns.getByText(label, { exact: true }).locator("..").locator("small")).toHaveText("Not provided by this source")
    }
    const pulse = detail.getByTestId("canonical-place-pulse")
    await expect(pulse).toHaveAttribute("data-pulse-level", "peak")
    await expect(pulse).toHaveAttribute("data-pulse-numeric", "hidden")
    await expect(pulse.locator("summary")).toHaveAccessibleName("ONDO temperature 91 · PEAK")
    await pulse.locator("summary").click()
    await expect(pulse).toContainText("Curated visit signals · not live crowding or official venue facts.")
    await expect(detail).not.toContainText(/Open now|Foreign-issued cards accepted|English menu available/)
  })

  test("B-TRUTH-TABLES keeps local-only boundaries and canonical table scope explicit before joining", async ({ page }) => {
    await gotoB(page)
    await page.getByRole("button", { name: "Tables", exact: true }).click()
    const tables = page.getByTestId("tables-entry")
    const truth = tables.getByTestId("tables-truth-notice")
    await expect(truth).toContainText("Messages and photos stay in this tab.")
    await expect(truth).toContainText("A confirmed plan is saved to My Korea on this device.")
    await expect(truth).toContainText("Nothing is booked, sent to the venue, or charged.")

    await tables.getByTestId(`table-open-${TABLE_ID}`).click()
    const tableDetail = page.getByTestId("table-detail")
    await expect(tableDetail).toHaveAttribute("data-table-id", TABLE_ID)
    await expect(tableDetail).toContainText("An official Korean restaurant licence record confirms the place.")
    await expect(tableDetail).toContainText("19+ Table · eligibility is checked only when you choose to join.")
    await expect(tableDetail.getByTestId("table-join")).toHaveText("Join this Table")
    await tableDetail.getByRole("button", { name: "Close Table" }).last().click()

    await openCanonicalVenue(page)
    const placeTable = page.getByTestId("canonical-place-table")
    await expect(placeTable).toContainText("View Table")
    await expect(placeTable).toContainText("Fri, Aug 28 · 20:30 KST · Korean + English · 1 seat left")
    await expect(page.getByTestId("canonical-after19-required")).toContainText("You’ll verify after choosing Join.")
    await placeTable.click()
    await expect(page.getByTestId("table-detail")).toHaveAttribute("data-table-id", TABLE_ID)
    await expect(page.getByTestId("tables-truth-notice")).toContainText("Nothing is booked, sent to the venue, or charged.")
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
    await expect(root).toHaveAttribute("data-directory-source", "MOIS_LOCALDATA_GENERAL_RESTAURANTS")
    await expect(root).toHaveAttribute("data-city-record-count", "200")
    await expect(root).toHaveAttribute("data-result-count", "200")
    await expect(page.getByTestId("ondo-b-result-bar").locator("b")).toHaveText("200 official records")
    if (state === "error") await expect(page.getByRole("button", { name: "Retry map" })).toBeVisible()
    await expect(page.getByTestId("ondo-b-venue-list").locator("li button").first()).toBeEnabled()
    expect(getBRuntimeEvidence(page).externalMap.length).toBeGreaterThan(0)
  })
})
