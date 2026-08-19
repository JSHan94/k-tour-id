import { expect, test, type Page } from "@playwright/test"

async function seedGuest(page: Page, locale: "en" | "ko" = "en") {
  const runtimeErrors: string[] = []
  page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(message.text()) })
  page.on("pageerror", (error) => runtimeErrors.push(error.message))
  await page.addInitScript(({ locale }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale, guideSeen: true, autoNight: true, savedVenueIds: [] }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({ onboarding: "ONB-COMPLETE", account: "ACC-GUEST" }))
  }, { locale })
  return runtimeErrors
}

test.describe("ONDO B official place discovery", () => {
  for (const city of ["seoul", "busan"] as const) {
    test(`${city} exposes exactly 200 sourced F&B places without fabricated heat`, async ({ page }) => {
      const runtimeErrors = await seedGuest(page)
      await page.goto("/ondo-b")
      await page.locator(`[data-city='${city}']`).click()

      const root = page.getByTestId("ondo-b-map-entry")
      await expect(root).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
      await expect(page.getByText(/200 (sourced food places|개 공식 식음료 장소)/)).toBeVisible()
      await page.getByRole("button", { name: "List" }).click()
      await expect(page.getByTestId("ondo-b-venue-list").locator("li")).toHaveCount(31)
      await expect(page.getByText("Load 30 more")).toBeVisible()
      await page.getByText("Load 30 more").click()
      await expect(page.getByTestId("ondo-b-venue-list").locator("li")).toHaveCount(61)
      await page.getByRole("button", { name: "Signal pending", exact: true }).click()
      await expect(page.getByText(/^160 sourced food places$/)).toBeVisible()
      await expect(page.getByTestId("ondo-b-venue-list").locator("[data-level='limited']").first()).toContainText("—")
      await expect(page.getByTestId("ondo-b-venue-list")).toContainText("Place only · signal pending")
      expect(runtimeErrors).toEqual([])
    })
  }

  test("real place detail preserves official-source and unknown-field truth", async ({ page }) => {
    const runtimeErrors = await seedGuest(page)
    await page.goto("/ondo-b")
    await page.locator("[data-city='seoul']").click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await page.getByRole("button", { name: "List" }).click()
    await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()

    await expect(page.getByTestId("canonical-place-peek")).toBeVisible()
    await page.getByTestId("canonical-place-details").click()
    const detail = page.getByTestId("canonical-place-overlay")
    await expect(detail).toContainText("MOIS LOCALDATA")
    await expect(detail.getByText("Not confirmed by this source")).toHaveCount(4)
    await expect(detail).toContainText(/ONDO signal pending|Preview signal · Simulated/)
    await expect(detail).not.toContainText(/Open now|Foreign-issued cards accepted|English menu available/)
    expect(runtimeErrors).toEqual([])
  })

  test("save from a sourced place uses the existing one-shot account gate", async ({ page }) => {
    await seedGuest(page)
    await page.goto("/ondo-b")
    await page.locator("[data-city='busan']").click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-map-state", "ready", { timeout: 20_000 })
    await page.getByRole("button", { name: "List" }).click()
    await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
    await page.getByTestId("canonical-place-details").click()
    await page.getByTestId("canonical-venue-save").click()
    await expect(page.getByTestId("ondo-gate-overlay")).toBeVisible()
    await expect(page.getByTestId("ondo-gate-overlay")).toContainText("save this place")
  })
})
