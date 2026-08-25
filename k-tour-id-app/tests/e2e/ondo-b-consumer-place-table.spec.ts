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

async function hideDevelopmentChrome(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
}

test("normal Place reaches the exact Table and keeps internal outcome controls out of the journey", async ({ page }) => {
  await seed(page)
  const place = await openPlace(page)
  await expect(place.getByTestId("canonical-place-table")).toBeVisible()
  await expect(place.getByTestId("canonical-after19-required")).toBeVisible()
  await expect(place.getByTestId("canonical-local-signal-open")).toBeVisible()
  await expect(place.locator("[data-detail-state='ready']")).toBeVisible()
  await hideDevelopmentChrome(page)
  await page.screenshot({ path: "artifacts/qa/product/place-mobile.png", fullPage: true })

  await place.getByTestId("canonical-place-table").click()
  await expect(page.getByTestId("nav-tables")).toHaveAttribute("aria-current", "page")
  const table = page.getByTestId("table-detail")
  await expect(table).toHaveAttribute("data-table-id", TABLE_ID)
  await expect(table).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect(table).not.toContainText(/sample|example|preview|walkthrough/i)
  await hideDevelopmentChrome(page)
  await page.screenshot({ path: "artifacts/qa/product/table-detail-mobile.png", fullPage: true })
  await table.getByTestId("table-join").scrollIntoViewIfNeeded()
  await page.screenshot({ path: "artifacts/qa/product/table-join-mobile.png", fullPage: true })

  await table.getByTestId("table-join").click()
  const gate = page.getByTestId("after19-walkthrough")
  await gate.getByTestId("after19-start").click()
  await hideDevelopmentChrome(page)
  await page.screenshot({ path: "artifacts/qa/product/after19-mobile.png", fullPage: true })
  await expect(gate.getByTestId("gate-success")).toBeVisible()
  await expect(gate.getByTestId("gate-failure-choice")).toHaveCount(0)
  await expect(gate.getByTestId("gate-unsupported-choice")).toHaveCount(0)
  await expect(gate.getByTestId("gate-expired-choice")).toHaveCount(0)
  await gate.getByTestId("gate-success").click()
  await expect(table.getByTestId("table-join-confirmation")).toBeVisible()
})

test("QA injection drives an After19 failure without authoring controls", async ({ page }) => {
  await seed(page)
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { after19: "failure" } })
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("after19-start").click()
  await expect(page.getByTestId("gate-failure")).toBeVisible()
  await expect(page.getByTestId("after19-walkthrough").getByRole("button")).toHaveCount(2)
})

test("joined Table supports message retry, check-in, and feedback without a combined reputation score", async ({ page }) => {
  await seed(page)
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { tableMessage: "failure" } })
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("after19-start").click()
  await page.getByTestId("gate-success").click()
  await page.getByTestId("table-join-confirm").click()
  await page.getByTestId("table-open-chat").click()

  const chat = page.getByTestId("table-chat")
  const imageInput = chat.getByTestId("table-chat-image")
  await imageInput.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
  await expect(chat.getByTestId("table-chat-image-error")).toContainText("JPEG, PNG, or WebP")
  await imageInput.setInputFiles({ name: "too-large.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc((10 * 1024 * 1024) + 1) })
  await expect(chat.getByTestId("table-chat-image-error")).toContainText("10 MB or smaller")
  await imageInput.setInputFiles("public/seoul-after-rain-hero.jpg")
  await expect(chat.getByTestId("table-chat-image-error")).toHaveCount(0)
  await chat.getByRole("button", { name: "Remove attached photo" }).click()
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
  await hideDevelopmentChrome(page)
  await page.screenshot({ path: "artifacts/qa/product/table-chat-feedback-mobile.png", fullPage: true })
})

test("Local Signal supports photo select, replace, remove, and QA retry", async ({ page }) => {
  await seed(page)
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { localSignalPhoto: "failure" } })
  const place = await openPlace(page)
  await place.getByTestId("canonical-local-signal-open").click()
  const signal = page.getByTestId("ondo-b-local-signal")
  const photo = signal.getByTestId("local-signal-photo-input")
  await photo.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
  await expect(signal.getByTestId("local-signal-photo-error")).toContainText("JPEG, PNG, or WebP")
  await expect(signal.getByTestId("local-signal-photo-choose-another")).toBeVisible()
  await photo.setInputFiles({ name: "too-large.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc((10 * 1024 * 1024) + 1) })
  await expect(signal.getByTestId("local-signal-photo-error")).toContainText("10 MB or smaller")
  await expect(signal.getByTestId("local-signal-photo-choose-another")).toBeVisible()
  await photo.setInputFiles("public/seoul-after-rain-hero.jpg")
  await expect(signal.getByTestId("local-signal-photo-retry")).toBeVisible()
  await signal.getByTestId("local-signal-photo-retry").click()
  await expect(signal.locator("img")).toBeVisible()
  await signal.getByTestId("local-signal-photo-replace").scrollIntoViewIfNeeded()
  await hideDevelopmentChrome(page)
  await page.screenshot({ path: "artifacts/qa/product/local-signal-photo-mobile.png", fullPage: true })
  await expect(signal.getByTestId("local-signal-photo-replace")).toBeVisible()
  await signal.getByTestId("local-signal-photo-remove").click()
  await expect(signal.locator("img")).toHaveCount(0)

  const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-local-signal']").analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})
