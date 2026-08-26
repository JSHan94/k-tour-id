import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const TABLE_ID = "table-seoul-night-bites"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

type Locale = "en" | "ko" | "ja"

test.describe.configure({ timeout: 120_000 })

const TRUTH = {
  en: {
    table: "Nothing is booked, sent to the venue, or charged.",
    local: "nothing is uploaded",
  },
  ko: {
    table: "예약·장소 전송·결제는 일어나지 않습니다.",
    local: "업로드하지 않습니다",
  },
  ja: {
    table: "予約、店舗への送信、決済は行われません。",
    local: "アップロードされません",
  },
} as const

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

async function waitForShell(page: Page) {
  const region = page.getByTestId("ondo-scroll-region")
  await expect(region).toBeVisible()
  await expect.poll(
    () => region.evaluate((element) => element.style.getPropertyValue("--ondo-scroll-viewport")),
    { timeout: 30_000 },
  ).not.toBe("")
}

async function openTables(page: Page, locale: Locale = "en") {
  await seed(page, locale)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await waitForShell(page)
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

async function openAfter19Review(page: Page) {
  await page.getByTestId("table-join").click()
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
  await waitForShell(page)
  await page.locator("[data-city='seoul']").click({ force: true })
  const toggle = page.getByTestId("ondo-b-view-toggle")
  if (await toggle.count()) await toggle.click({ force: true })
  await page.getByTestId("ondo-b-venue-list").locator(`[data-venue-id='${VENUE_ID}'] button`).click({ force: true })
  await page.getByTestId("canonical-place-details").click({ force: true })
  await page.getByTestId("canonical-local-signal-open").click({ force: true })
  const signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal).toBeVisible()
  return signal
}

async function pseudo(locator: Locator, selector: "::before" | "::after") {
  return locator.evaluate((element, pseudoSelector) => {
    const style = getComputedStyle(element, pseudoSelector)
    return {
      content: style.content,
      backgroundImage: style.backgroundImage,
      height: Number.parseFloat(style.height),
      width: Number.parseFloat(style.width),
    }
  }, selector)
}

test("SOC-DIR-001 Timeleft event card and chat expose a social timeline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const entry = await openTables(page)
  const card = entry.getByTestId(`table-card-${TABLE_ID}`)
  const itinerary = card.getByTestId("table-sample-time").locator("xpath=../..")
  const timeline = await pseudo(itinerary, "::before")
  expect(timeline.content).not.toBe("none")
  expect(timeline.height).toBeGreaterThan(100)

  await openTableDetail(page)
  await openAfter19Review(page)
  const chat = await openChat(page)
  const participantBeacon = await pseudo(chat.locator("div").filter({ has: page.locator("strong", { hasText: "Min" }) }).first(), "::before")
  expect(participantBeacon.content).not.toBe("none")
  expect(participantBeacon.width).toBeGreaterThanOrEqual(24)
})

test("SOC-DIR-002 After19 is a staged private checkpoint, not an outcome picker", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openTables(page)
  await openTableDetail(page)
  const gate = await openAfter19Review(page)
  const progress = await pseudo(gate.locator("header"), "::after")
  expect(progress.content).not.toBe("none")
  expect(progress.backgroundImage).toContain("linear-gradient")
  await expect(page.locator("[data-testid*='outcome']")).toHaveCount(0)
})

test("SOC-DIR-003 Local Signal reads as an observation activity with a photo checkpoint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seed(page)
  const signal = await openLocalSignal(page)
  const draft = signal.getByTestId("local-signal-draft")
  const activityRail = await pseudo(draft, "::before")
  expect(activityRail.content).not.toBe("none")
  expect(activityRail.height).toBeGreaterThan(120)
  await signal.locator("fieldset button").first().click()
  const selected = await signal.locator("fieldset button[aria-pressed='true']").evaluate((element) => getComputedStyle(element).transform)
  expect(selected).not.toBe("none")
})

for (const locale of ["en", "ko", "ja"] as const) {
  test(`SOC-DIR-TRUTH ${locale} preserves non-booking and non-upload boundaries`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    const entry = await openTables(page, locale)
    await expect(entry).toContainText(TRUTH[locale].table)
    const body = await entry.innerText()
    expect(body).not.toMatch(/booking confirmed|reservation confirmed|matched with|reputation increased/i)

    const signal = await openLocalSignal(page)
    await expect(signal).toContainText(TRUTH[locale].local)
    expect(await signal.innerText()).not.toMatch(/uploaded successfully|public reputation|matched with/i)
  })
}
