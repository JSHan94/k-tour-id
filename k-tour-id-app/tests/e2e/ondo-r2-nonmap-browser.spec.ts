import { expect, test, type Page } from "@playwright/test"

const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"

async function seed(page: Page, options: { ready?: boolean; saved?: string[]; preferences?: string[] } = {}) {
  await page.addInitScript(({ ready, saved, preferences }) => {
    localStorage.setItem("ondo.preferences.v3", JSON.stringify({
      locale: "en",
      guideSeen: true,
      autoNight: true,
      savedVenueIds: saved,
      discoveryPreferences: preferences,
    }))
    sessionStorage.setItem("ondo.session.v3", JSON.stringify({
      onboarding: "ONB-COMPLETE",
      persona: "short_term",
      account: ready ? "ACC-ACTIVE" : "ACC-GUEST",
      person: ready ? "PER-VERIFIED" : "PER-UNVERIFIED",
      age: "AGE-UNVERIFIED",
      paymentKyc: "PKY-NOT-STARTED",
      after19: "A19-OFF",
      stamps: 0,
    }))
  }, {
    ready: options.ready ?? false,
    saved: options.saved ?? [],
    preferences: options.preferences ?? [],
  })
}

test("After 19 stays out of the B nation hero and appears after city selection", async ({ page }) => {
  await seed(page)
  await page.goto("/ondo-b")

  const after19 = page.getByRole("button", { name: "After 19", exact: true })
  await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
  await expect(after19).toBeHidden()

  await page.locator("[data-city='seoul']").click()
  await expect(after19).toBeVisible()
})

test("Local Signal requires a note or photo and states the simulated public-score boundary", async ({ page }) => {
  await seed(page, { ready: true })
  await page.goto("/ondo-b?city=seoul&view=list")
  await page.getByTestId("ondo-b-venue-list").locator("li button").first().click()
  await page.getByTestId("canonical-place-details").click()
  await page.getByTestId("canonical-venue-signal").click()

  const signal = page.getByTestId("local-signal-overlay")
  const submit = page.getByTestId("local-signal-submit")
  await expect(signal).toHaveAttribute("data-signal-evidence", "required")
  await expect(submit).toBeDisabled()
  await expect(signal).toContainText("simulated contribution only")
  await expect(signal).toContainText("public ONDO score does not change immediately")

  const note = page.getByLabel("Helpful note · Add a note or photo")
  await note.fill("Order at the counter.")
  await expect(submit).toBeEnabled()
  await note.fill("")
  await expect(submit).toBeDisabled()

  await page.locator("input[type='file']").setInputFiles({
    name: "meal.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  })
  await expect(signal).toHaveAttribute("data-signal-evidence", "ready")
  await submit.click()
  await expect(signal).toHaveAttribute("data-signal-status", "submitted")
  await expect(signal).toHaveAttribute("data-signal-invariants", "preserved")
  await expect(signal).toContainText("Only Visit and Contribution histories were updated")
  await expect(signal).toContainText("public ONDO score did not change immediately")
})

test("My Korea edits persona and preferences and labels an English canonical save bilingually", async ({ page }) => {
  await seed(page, { saved: [CANONICAL_VENUE_ID], preferences: ["classic"] })
  await page.goto("/ondo-b")
  await page.getByRole("button", { name: "My Korea", exact: true }).click()

  const saved = page.getByTestId(`saved-venue-${CANONICAL_VENUE_ID}`)
  await expect(saved).toContainText("Roba")
  await expect(saved).toContainText("로바 · Transliterated for navigation")

  await page.getByTestId("discovery-persona").selectOption("long_term_resident")
  await page.getByTestId("discovery-preference-cafe").click()
  await expect(page.getByTestId("discovery-preference-truth")).toContainText("used as discovery context")
  await expect(page.getByTestId("discovery-preference-truth")).toContainText("not used as hidden filters")
  await expect.poll(() => page.evaluate(() => {
    const session = JSON.parse(sessionStorage.getItem("ondo.session.v3") ?? "{}")
    const local = JSON.parse(localStorage.getItem("ondo.preferences.v3") ?? "{}")
    return [session.persona, local.discoveryPreferences]
  })).toEqual(["long_term_resident", ["classic", "cafe"]])
})
