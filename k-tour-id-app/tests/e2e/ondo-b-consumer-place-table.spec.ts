import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const TABLE_ID = "table-seoul-night-bites"

async function seed(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript(({ key, language }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
    }))
  }, { key: DEVICE_KEY, language: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function openPlace(page: Page, query = "") {
  await page.goto(`/ondo-b?venueId=${VENUE_ID}${query ? `&${query}` : ""}`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("canonical-place-details").click()
  return page.getByTestId("canonical-place-overlay")
}

test("normal Place reaches the exact Table and keeps internal outcome controls out of the journey", async ({ page }) => {
  await seed(page)
  const place = await openPlace(page)
  await expect(place.getByTestId("canonical-table-open")).toBeVisible()
  await expect(place.getByTestId("canonical-after19-open")).toBeVisible()
  await expect(place.getByTestId("canonical-local-signal-open")).toBeVisible()

  await place.getByTestId("canonical-table-open").click()
  await expect(page.getByTestId("nav-tables")).toHaveAttribute("aria-current", "page")
  const table = page.getByTestId("table-detail")
  await expect(table).toHaveAttribute("data-table-id", TABLE_ID)
  await expect(table).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect(table).not.toContainText(/sample|example|preview|walkthrough/i)

  await table.getByTestId("table-join").click()
  const gate = page.getByTestId("after19-walkthrough")
  await gate.getByTestId("after19-start").click()
  await expect(gate.getByTestId("gate-success")).toBeVisible()
  await expect(gate.getByTestId("gate-failure-choice")).toHaveCount(0)
  await expect(gate.getByTestId("gate-unsupported-choice")).toHaveCount(0)
  await expect(gate.getByTestId("gate-expired-choice")).toHaveCount(0)
  await gate.getByTestId("gate-success").click()
  await expect(table.getByTestId("table-join-confirmation")).toBeVisible()
})

test("QA injection retains After19 failure, provider-unavailable, and expiry recovery", async ({ page }) => {
  await seed(page)
  await page.goto("/ondo-b?qa=1", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("after19-start").click()
  await expect(page.getByTestId("gate-failure-choice")).toBeVisible()
  await expect(page.getByTestId("gate-unsupported-choice")).toBeVisible()
  await expect(page.getByTestId("gate-expired-choice")).toBeVisible()
})

test("joined Table supports message retry, check-in, and feedback without a combined reputation score", async ({ page }) => {
  await seed(page)
  await page.goto("/ondo-b?qa=1&scenario=table-message-fail", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("after19-start").click()
  await page.getByTestId("gate-success").click()
  await page.getByTestId("table-join-confirm").click()
  await page.getByTestId("table-open-chat").click()

  const chat = page.getByTestId("table-chat")
  await chat.getByTestId("table-chat-compose").fill("I am by the entrance.")
  await chat.getByTestId("table-message-send").click()
  await expect(chat.getByTestId("table-message-retry")).toBeVisible()
  await chat.getByTestId("table-message-retry").click()
  await expect(chat).toContainText("I am by the entrance.")
  await chat.getByTestId("table-check-in").click()
  await chat.getByRole("button", { name: "Helpful table" }).click()
  await chat.getByTestId("table-feedback-submit").click()
  const receipt = chat.getByTestId("table-reputation-receipt")
  await expect(receipt).toContainText("Meetup")
  await expect(receipt).toContainText("Contribution")
  await expect(receipt).not.toContainText(/score|safe|rating/i)
})

test("Local Signal supports photo select, replace, remove, and QA retry", async ({ page }) => {
  await seed(page)
  const place = await openPlace(page, "qa=1&scenario=local-signal-photo-fail")
  await place.getByTestId("canonical-local-signal-open").click()
  const signal = page.getByTestId("ondo-b-local-signal")
  const photo = signal.getByTestId("local-signal-photo")
  await photo.setInputFiles({ name: "signal.jpg", mimeType: "image/jpeg", buffer: Buffer.from("signal") })
  await expect(signal.getByTestId("local-signal-photo-retry")).toBeVisible()
  await signal.getByTestId("local-signal-photo-retry").click()
  await expect(signal.locator("img")).toBeVisible()
  await expect(signal.getByTestId("local-signal-photo-replace")).toBeVisible()
  await signal.getByTestId("local-signal-photo-remove").click()
  await expect(signal.locator("img")).toHaveCount(0)

  const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-local-signal']").analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})
