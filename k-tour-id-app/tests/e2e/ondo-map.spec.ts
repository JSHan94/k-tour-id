import { expect, test, type Page } from "@playwright/test"
import { MAP_NEIGHBORHOODS, MAP_REGIONS } from "../../lib/ondo/map/fixtures"

async function seedGuest(page: Page, locale: "en" | "ko" = "en", account = false) {
  await page.addInitScript(({ locale, account }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale, guideSeen: true, autoNight: true, savedVenueIds: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: account ? "ACC-ACTIVE" : "ACC-GUEST" }))
  }, { locale, account })
}

test.describe("ONDO map discovery", () => {
  test("E2E-MAP-01 @core completes Guest discovery from Korea to venue detail", async ({ page }) => {
    await seedGuest(page)
    await page.goto("/ondo")

    const surface = page.getByTestId("ondo-map-entry")
    await expect(surface).toBeVisible()
    await expect(page.getByTestId("leaflet-map")).toBeVisible()
    await expect(page.getByRole("link", { name: "© OpenStreetMap" })).toBeVisible()
    await expect(surface).toHaveAttribute("data-map-level", "nation")

    const seoul = page.getByTestId("region-marker-region-seoul")
    await expect(seoul).toHaveAttribute("data-latitude", "37.5665")
    await expect(seoul).toHaveAttribute("data-longitude", "126.978")
    await seoul.click()
    await expect(surface).toHaveAttribute("data-map-level", /city|neighborhood/)
    await expect(page).toHaveURL(/city=seoul/)

    await page.getByTestId("neighborhood-marker-seongsu").click()
    await expect(surface).toHaveAttribute("data-map-level", "venue")
    await page.getByTestId("venue-marker-seoul-seongsu-gukbap").click()
    await expect(page.getByTestId("place-peek")).toContainText("Seongsu Dwaeji Gukbap")
    await page.getByTestId("place-details").click()
    await expect(page.getByTestId("place-overlay")).toContainText("Before you go")
    await expect(page.getByTestId("venue-directions")).toHaveAttribute("href", /google\.com\/maps\/dir/)
    await page.getByTestId("place-overlay").getByRole("button", { name: "Back to place summary" }).click()
    await expect(page.getByTestId("place-peek")).toBeVisible()
  })

  test("E2E-MAP-02 search and filters change the synchronized result list", async ({ page }) => {
    await seedGuest(page)
    await page.goto("/ondo?city=seoul&view=list")

    await expect(page.getByTestId("venue-list")).toBeVisible()
    const listBox = await page.getByTestId("map-list-panel").boundingBox()
    const autoBox = await page.getByLabel("Open automatically when eligible").boundingBox()
    expect(listBox).not.toBeNull()
    expect(autoBox).not.toBeNull()
    expect(listBox!.y + listBox!.height).toBeLessThanOrEqual(autoBox!.y)
    await page.getByTestId("map-search").fill("gukbap")
    await expect(page.getByTestId("venue-card-seoul-seongsu-gukbap")).toBeVisible()
    await expect(page.getByTestId("venue-card-seoul-euljiro-nogari")).toHaveCount(0)

    await page.getByTestId("map-search").fill("")
    await page.getByRole("button", { name: "Late night" }).click()
    await expect(page.getByTestId("venue-card-seoul-euljiro-nogari")).toBeVisible()
    await expect(page.getByTestId("venue-card-seoul-seongsu-gukbap")).toHaveCount(0)
  })

  test("E2E-MAP-03 selection keeps map, list, and URL on the same stable venue", async ({ page }) => {
    await seedGuest(page)
    await page.goto("/ondo?city=seoul&view=list")

    await page.getByTestId("venue-card-seoul-mangwon-kalguksu").click()
    await expect(page.getByTestId("place-peek")).toContainText("Mangwon Market Kalguksu")
    await expect(page).toHaveURL(/venueId=seoul-mangwon-kalguksu/)
    await expect(page.getByTestId("venue-marker-seoul-mangwon-kalguksu")).toHaveAttribute("data-latitude", "37.55612")
    await page.reload()
    await expect(page.getByTestId("place-peek")).toContainText("Mangwon Market Kalguksu")
    await expect(page.getByTestId("venue-marker-seoul-mangwon-kalguksu")).toHaveAttribute("data-longitude", "126.90552")
  })

  test("saved discovery preferences initialize filters while explicit URL values win", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale: "en", guideSeen: true, discoveryPreferences: ["lively", "late"] }))
      sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST" }))
    })
    await page.goto("/ondo?calm=1&time=dinner&view=list")
    await expect(page.getByRole("button", { name: "A little calmer" })).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByRole("button", { name: "Dinner" })).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByRole("button", { name: "Hot now" })).toHaveAttribute("aria-pressed", "false")
  })

  test("E2E-MAP-05 @core tile failure preserves the same browsable venue list", async ({ page }) => {
    await seedGuest(page, "ko")
    await page.goto("/ondo?scenario=tile-error&view=list")

    await expect(page.getByTestId("tile-error-notice")).toContainText("같은 장소 목록은 계속 볼 수 있어요")
    await expect(page.getByTestId("venue-list").getByRole("button")).toHaveCount(4)
    await expect(page.getByTestId("leaflet-map")).toBeVisible()
  })

  test("location denial leaves discovery intact", async ({ page }) => {
    await seedGuest(page)
    await page.goto("/ondo?scenario=location-denied")

    await page.getByRole("button", { name: "Near me" }).click()
    await expect(page.getByTestId("location-denied-notice")).toContainText("Search a city or neighborhood")
    await expect(page.getByTestId("leaflet-map")).toBeVisible()
    await expect(page.getByTestId("ondo-map-entry")).toHaveAttribute("data-map-level", "nation")
  })

  test("E2E-MAP-06 distinguishes Busan early coverage from scoreless Growing regions", async ({ page }) => {
    await seedGuest(page)
    await page.goto("/ondo")

    await expect(page.getByTestId("region-marker-region-busan")).toHaveAttribute("aria-label", /ONDO 84.*12 recent signals.*Limited sample/)
    await expect(page.getByTestId("region-marker-region-jeju")).toHaveAttribute("aria-label", /no ONDO score.*more signals needed/)
  })

  test("expired fixture signals are shown as older instead of updated today", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-08-22T12:00:00+09:00"))
    await seedGuest(page)
    await page.goto("/ondo?city=seoul&view=list")

    await expect(page.getByTestId("venue-card-seoul-seongsu-gukbap")).toContainText("Older signals")
    await page.getByTestId("venue-card-seoul-seongsu-gukbap").click()
    await expect(page.getByTestId("place-peek")).toContainText("Older signals")
    await expect(page.getByTestId("place-peek")).not.toContainText("Updated today")
  })
})

test("aggregate heat fixtures keep sample, reason and provenance evidence separate from the score", () => {
  for (const aggregate of [...MAP_REGIONS, ...MAP_NEIGHBORHOODS]) {
    expect(typeof aggregate.minSampleMet).toBe("boolean")
    expect(aggregate.reasonCodes.length).toBeGreaterThan(0)
    expect(Number.isNaN(Date.parse(aggregate.computedAt))).toBeFalsy()
    expect(aggregate.provenance.fixtureId).toMatch(/^FX-MAP-/)
    expect(aggregate.provenance.truth).toBe("SIMULATED")
    if (!aggregate.minSampleMet) expect(aggregate.ondoScore).toBeNull()
  }
})
