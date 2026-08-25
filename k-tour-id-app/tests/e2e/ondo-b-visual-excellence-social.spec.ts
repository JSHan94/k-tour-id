import { mkdirSync } from "node:fs"
import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const TABLE_ID = "table-seoul-night-bites"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const ARTIFACT_DIR = "artifacts/qa/visual-excellence-social"

type Locale = "en" | "ko"
type Viewport = { label: string; width: number; height: number }

const VIEWPORTS: readonly Viewport[] = [
  { label: "320x720", width: 320, height: 720 },
  { label: "390x844", width: 390, height: 844 },
  { label: "844x390", width: 844, height: 390 },
  { label: "1440x1000", width: 1440, height: 1000 },
]

async function seed(page: Page, locale: Locale = "en") {
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

async function waitForHydratedShell(page: Page) {
  const region = page.getByTestId("ondo-scroll-region")
  await expect(region).toBeVisible()
  await expect.poll(() => region.evaluate((element) => element.style.getPropertyValue("--ondo-scroll-viewport"))).not.toBe("")
}

async function openTables(page: Page, locale: Locale = "en") {
  await seed(page, locale)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await waitForHydratedShell(page)
  // The exact 1a9 shell has a desktop stacking defect that the shared-shell lane
  // fixes independently. Force the existing action without making this social
  // surface contract depend on that out-of-scope pointer layer.
  await page.getByTestId("nav-tables").click({ force: true })
  const entry = page.getByTestId("tables-entry")
  await expect(entry).toBeVisible()
  return entry
}

async function openTableDetail(page: Page) {
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  const detail = page.getByTestId("table-detail")
  await expect(detail).toBeVisible()
  return detail
}

async function openReview(page: Page) {
  const detail = page.getByTestId("table-detail")
  await detail.getByTestId("table-join").click()
  const gate = page.getByTestId("after19-walkthrough")
  await expect(gate).toBeVisible()
  await gate.getByTestId("after19-start").click()
  await expect(gate.getByTestId("gate-success")).toBeVisible()
  return gate
}

async function openChat(page: Page) {
  await page.getByTestId("gate-success").click()
  await page.getByTestId("table-join-confirm").click()
  await page.getByTestId("table-open-chat").click()
  const chat = page.getByTestId("table-chat")
  await expect(chat).toBeVisible()
  return chat
}

async function openLocalSignal(page: Page) {
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await waitForHydratedShell(page)
  await page.locator("[data-city='seoul']").click({ force: true })
  const viewToggle = page.getByTestId("ondo-b-view-toggle")
  if (await viewToggle.count()) await viewToggle.click({ force: true })
  else await expect(page.getByTestId("ondo-b-effective-view-label")).toBeVisible()
  const row = page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${VENUE_ID}'] button`)
  await row.click({ force: true })
  await page.getByTestId("canonical-place-details").click({ force: true })
  await page.getByTestId("canonical-local-signal-open").click({ force: true })
  const signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal).toBeVisible()
  return signal
}

async function noHorizontalOverflow(locator: Locator) {
  const geometry = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1)
}

async function quietScreenshot(page: Page, name: string) {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
  await page.screenshot({ path: `${ARTIFACT_DIR}/${name}.png`, animations: "disabled" })
}

test("VE-SOC-001 desktop Table is a wide social event object with a two-column itinerary", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const entry = await openTables(page)
  const card = entry.getByTestId(`table-card-${TABLE_ID}`)
  const official = card.locator("section").first()
  const itinerary = card.getByTestId("table-sample-time").locator("xpath=../..")
  const [cardBox, officialBox, itineraryBox] = await Promise.all([
    card.boundingBox(), official.boundingBox(), itinerary.boundingBox(),
  ])
  expect(cardBox).not.toBeNull()
  expect(officialBox).not.toBeNull()
  expect(itineraryBox).not.toBeNull()
  expect(cardBox!.width).toBeGreaterThanOrEqual(600)
  expect(itineraryBox!.x).toBeGreaterThanOrEqual(officialBox!.x + officialBox!.width + 20)

  const detail = await openTableDetail(page)
  const sheet = detail.locator("article")
  const plan = detail.getByTestId("table-sample-time").locator("xpath=../..")
  const join = detail.getByTestId("table-join").locator("xpath=..")
  const [sheetBox, planBox, joinBox] = await Promise.all([sheet.boundingBox(), plan.boundingBox(), join.boundingBox()])
  expect(sheetBox!.width).toBeGreaterThanOrEqual(840)
  expect(joinBox!.x).toBeGreaterThanOrEqual(planBox!.x + planBox!.width + 20)
})

test("VE-SOC-002 mobile Table keeps source truth complete and chat visibly participatory", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const entry = await openTables(page)
  const card = entry.getByTestId(`table-card-${TABLE_ID}`)
  const sourceBoundary = card.locator("section").first().locator("span")
  const sourceGeometry = await sourceBoundary.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    lineClamp: getComputedStyle(element).webkitLineClamp,
  }))
  expect(sourceGeometry.lineClamp).not.toBe("1")
  expect(sourceGeometry.scrollHeight).toBeLessThanOrEqual(sourceGeometry.clientHeight + 1)

  await openTableDetail(page)
  await openReview(page)
  const chat = await openChat(page)
  const chatTexture = await chat.evaluate((element) => {
    const style = getComputedStyle(element)
    const presence = getComputedStyle(element.querySelector("header small")!)
    return { backgroundImage: style.backgroundImage, boxShadow: presence.boxShadow }
  })
  expect(chatTexture.backgroundImage).not.toBe("none")
  expect(chatTexture.boxShadow).not.toBe("none")
  await noHorizontalOverflow(page.getByTestId("table-detail"))
})

test("VE-SOC-003 After19 reads as a distinctive secure checkpoint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openTables(page)
  await openTableDetail(page)
  const gate = await openReview(page)
  const motif = await gate.evaluate((element) => {
    const before = getComputedStyle(element, "::before")
    const badge = element.querySelectorAll("svg")[1]
    const badgeStyle = getComputedStyle(badge)
    return {
      content: before.content,
      opacity: before.opacity,
      animationName: badgeStyle.animationName,
      animationDuration: badgeStyle.animationDuration,
    }
  })
  expect(motif.content).not.toBe("none")
  expect(Number.parseFloat(motif.opacity)).toBeGreaterThan(0)
  expect(motif.animationName).toContain("secure")
  expect(motif.animationDuration).toBe("2.4s")
})

test("VE-SOC-004 Local Signal is a Pulse sensory composer with a premium photo object", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  const signal = await openLocalSignal(page)
  const photo = signal.getByTestId("local-signal-photo-input").locator("xpath=..")
  const mark = signal.locator("header + div > div").first()
  const primary = signal.getByTestId("local-signal-person-check")
  const [photoStyle, markStyle, primaryBox, primaryRadius] = await Promise.all([
    photo.evaluate((element) => getComputedStyle(element).backgroundImage),
    mark.evaluate((element) => ({ content: getComputedStyle(element, "::after").content, boxShadow: getComputedStyle(element).boxShadow })),
    primary.boundingBox(),
    primary.evaluate((element) => getComputedStyle(element).borderRadius),
  ])
  expect(photoStyle).toContain("radial-gradient")
  expect(markStyle.content).not.toBe("none")
  expect(markStyle.boxShadow).not.toBe("none")
  expect(primaryBox!.height).toBeGreaterThanOrEqual(54)
  expect(Number.parseFloat(primaryRadius)).toBeGreaterThanOrEqual(14)
})

for (const locale of ["en", "ko"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`VE-SOC-CAPTURE ${locale} ${viewport.label} social journey`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const entry = await openTables(page, locale)
      await noHorizontalOverflow(entry)
      await quietScreenshot(page, `${locale}-${viewport.label}-tables`)

      const detail = await openTableDetail(page)
      await quietScreenshot(page, `${locale}-${viewport.label}-table-detail`)

      const gate = await openReview(page)
      await quietScreenshot(page, `${locale}-${viewport.label}-after19`)

      const chat = await openChat(page)
      await chat.scrollIntoViewIfNeeded()
      await quietScreenshot(page, `${locale}-${viewport.label}-table-chat`)

      const signal = await openLocalSignal(page)
      const tag = signal.locator("fieldset button").first()
      await tag.click()
      await signal.getByTestId("local-signal-photo-input").setInputFiles("public/seoul-after-rain-hero.jpg")
      await expect(signal.locator("img")).toBeVisible()
      await signal.getByTestId("local-signal-photo-replace").scrollIntoViewIfNeeded()
      await quietScreenshot(page, `${locale}-${viewport.label}-local-signal`)
      await noHorizontalOverflow(signal)
      await expect(detail).toBeHidden()
      await expect(gate).toBeHidden()
    })
  }
}
