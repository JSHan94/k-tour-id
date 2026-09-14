import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const EMPTY_TABLE_VENUE_ID = "mois-18939eecb43c15ab4305"
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
  await page.goto(`/?venueId=${VENUE_ID}${query ? `&${query}` : ""}`, { waitUntil: "domcontentloaded" })
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
  await table.evaluate(async (node) => {
    await Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)))
  })
  const detailAxe = await new AxeBuilder({ page }).include("[data-testid='table-detail']").analyze()
  expect(detailAxe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
  await hideDevelopmentChrome(page)
  await page.screenshot({ path: "artifacts/qa/product/table-detail-mobile.png", fullPage: true })
  await table.getByTestId("table-join").scrollIntoViewIfNeeded()
  await page.screenshot({ path: "artifacts/qa/product/table-join-mobile.png", fullPage: true })

  await table.getByTestId("table-join").click()
  const gate = page.getByTestId("ondo-b-action-gate")
  await gate.getByTestId("action-gate-confirm").click()
  await gate.getByTestId("after19-start").click()
  await hideDevelopmentChrome(page)
  await page.screenshot({ path: "artifacts/qa/product/after19-mobile.png", fullPage: true })
  await expect(gate).toHaveCount(0)
  await expect(table.getByTestId("table-join-confirmation")).toBeVisible()
})

test("ordinary Place keeps secondary actions compact while unknown and source truth remain inspectable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  await page.goto(`/?city=seoul&view=list&venueId=${EMPTY_TABLE_VENUE_ID}&detail=1`, { waitUntil: "domcontentloaded" })
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toHaveAttribute("data-venue-id", EMPTY_TABLE_VENUE_ID)
  await expect(place.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")

  const utilities = place.getByTestId("canonical-place-utilities")
  await expect(utilities).toBeVisible()
  await expect(utilities.getByTestId("canonical-venue-tables")).toHaveAccessibleName("Browse all Tables")
  await expect(utilities.getByTestId("canonical-local-signal-open")).toHaveAccessibleName("Add a place note")
  await expect(place.getByTestId("canonical-place-table")).toHaveCount(0)
  await expect(place).not.toContainText("No open Table here yet")
  for (const control of await utilities.getByRole("button").all()) {
    const box = await control.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }

  const detailsToCheck = place.getByTestId("canonical-place-details-to-check")
  await expect(detailsToCheck).toContainText("Before you go")
  await expect(detailsToCheck.locator("[data-fact-key]")).toHaveCount(4)
  for (const label of ["Current opening hours", "Foreign-issued card support", "Menu and prices", "English-language support"]) {
    await expect(detailsToCheck.getByRole("button", { name: new RegExp(`^${label}:`) })).toBeVisible()
  }

  const source = place.getByTestId("canonical-source-evidence")
  await expect(source).toHaveCount(1)
  await source.locator("summary").click()
  await expect(source).toContainText("Source snapshot")
  await expect(source).toContainText("LOCALDATA management ID")
  await expect(source).toContainText("MOIS LOCALDATA")

  const axe = await new AxeBuilder({ page }).include("[data-testid='canonical-place-overlay']").analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})

test("QA injection drives an After19 failure without authoring controls", async ({ page }) => {
  await seed(page)
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { after19: "failure" } })
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("action-gate-confirm").click()
  await page.getByTestId("after19-start").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveAttribute("data-gate-view", "failure")
  await expect(page.getByTestId("ondo-b-action-gate").getByRole("button")).toHaveCount(3)
})

test("joined Table supports message retry, check-in, and feedback without a combined reputation score", async ({ page }) => {
  await seed(page)
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { tableMessage: "failure" } })
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("action-gate-confirm").click()
  await page.getByTestId("after19-start").click()
  await page.getByTestId("table-join-confirm").click()
  const joinedTable = page.getByTestId("table-detail")
  const joinedAxe = await new AxeBuilder({ page }).include("[data-testid='table-detail']").analyze()
  expect(joinedAxe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
  await page.getByTestId("table-open-chat").click()

  const chat = page.getByTestId("table-chat")
  const imageInput = chat.getByTestId("table-chat-image")
  await expect(imageInput).toHaveAttribute("tabindex", "-1")
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
  await expect(receipt).toContainText("Feedback")
  await expect(receipt).not.toContainText(/(?:is|are) safe|safety guaranteed|(?:public )?(?:score|rating):?\s*\d/i)
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
  await expect(photo).toHaveAttribute("tabindex", "-1")
  await photo.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
  await expect(signal.getByTestId("local-signal-photo-error")).toContainText("JPEG, PNG, or WebP")
  await expect(signal.getByTestId("local-signal-photo-choose-another")).toBeVisible()
  await photo.setInputFiles({ name: "too-large.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc((10 * 1024 * 1024) + 1) })
  await expect(signal.getByTestId("local-signal-photo-error")).toContainText("10 MB or smaller")
  await expect(signal.getByTestId("local-signal-photo-choose-another")).toBeVisible()
  await photo.setInputFiles("public/seoul-after-rain-hero.jpg")
  await expect(signal.getByTestId("local-signal-photo-retry")).toBeVisible()
  await signal.getByTestId("local-signal-photo-retry").click()
  await expect(signal.getByTestId("local-signal-photo-preview")).toBeVisible()
  await signal.getByTestId("local-signal-photo-replace").scrollIntoViewIfNeeded()
  await hideDevelopmentChrome(page)
  await page.screenshot({ path: "artifacts/qa/product/local-signal-photo-mobile.png", fullPage: true })
  await expect(signal.getByTestId("local-signal-photo-replace")).toBeVisible()
  await signal.getByTestId("local-signal-photo-remove").click()
  await expect(signal.getByTestId("local-signal-photo-preview")).toHaveCount(0)

  const axe = await new AxeBuilder({ page }).include("[data-testid='ondo-b-local-signal']").analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})

test("restored Table Account to 19+ gate stays topmost and operable after reload", async ({ page }) => {
  await seed(page)
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  await page.getByTestId("action-gate-confirm").click()
  const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}").pending?.tokenId)

  await page.reload({ waitUntil: "domcontentloaded" })
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-active-gate", "age")
  await expect.poll(() => gate.evaluate((node) => !node.hasAttribute("inert") && node.getAttribute("aria-hidden") !== "true")).toBe(true)
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}").pending?.tokenId)).toBe(token)
  await gate.getByTestId("after19-start").click()
  await expect(gate).toHaveCount(0)
  await expect(page.getByTestId("table-join-confirmation")).toBeVisible()
})

test("restored Local Signal keeps its exact ready draft until one real post", async ({ page }) => {
  await seed(page)
  const place = await openPlace(page)
  await place.getByTestId("canonical-local-signal-open").click()
  let signal = page.getByTestId("ondo-b-local-signal")
  await signal.getByRole("button", { name: "Calm right now", exact: true }).click()
  await signal.getByLabel("Optional local note").fill("Discard after this successful post")
  await signal.getByTestId("local-signal-person-check").click()
  await page.getByTestId("action-gate-confirm").click()
  await page.getByTestId("person-route-choice-mobile_id_cx").click()
  await page.getByTestId("local-check-boundary-continue").click()
  await expect(signal).toHaveAttribute("data-signal-stage", "ready")
  const pendingBefore = await page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}").pending)

  await page.reload({ waitUntil: "domcontentloaded" })
  signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal).toBeVisible()
  await expect(signal).toHaveAttribute("data-signal-stage", "ready")
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}").pending?.tokenId)).toBe(pendingBefore.tokenId)
  await signal.getByTestId("local-signal-post").click()
  await expect(signal).toHaveCount(0)
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").localSignalPostedVenueIds ?? [], DEVICE_KEY)).toEqual([VENUE_ID])
  const actionSession = await page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo-b.action-gates.v1") ?? "{}"))
  expect(actionSession.pending).toBeNull()
  expect(actionSession.lastConsumed).toBeNull()
  expect(JSON.stringify(actionSession)).not.toContain(pendingBefore.note)
})

test("closing a ready Local Signal discards its exact note and releases the next action", async ({ page }) => {
  await seed(page)
  const place = await openPlace(page)
  await place.getByTestId("canonical-local-signal-open").click()
  const signal = page.getByTestId("ondo-b-local-signal")
  await signal.getByRole("button", { name: "Calm right now", exact: true }).click()
  await signal.getByLabel("Optional local note").fill("Discard this exact private note")
  await signal.getByTestId("local-signal-person-check").click()
  await page.getByTestId("action-gate-confirm").click()
  await page.getByTestId("person-route-choice-mobile_id_cx").click()
  await page.getByTestId("local-check-boundary-continue").click()
  await expect(signal).toHaveAttribute("data-signal-stage", "ready")
  await signal.getByRole("button", { name: "Close Local Signal" }).click()
  await expect(signal).toHaveCount(0)
  const raw = await page.evaluate(() => sessionStorage.getItem("ondo-b.action-gates.v1") ?? "")
  expect(raw).not.toContain("Discard this exact private note")
  expect(JSON.parse(raw).pending).toBeNull()

  await page.getByTestId("canonical-local-signal-open").click()
  await expect(page.getByTestId("ondo-b-local-signal")).toBeVisible()
})
