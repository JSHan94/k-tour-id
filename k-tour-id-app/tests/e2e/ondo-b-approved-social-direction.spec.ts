import { mkdirSync } from "node:fs"
import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const TABLE_ID = "table-seoul-night-bites"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const ARTIFACT_DIR = "artifacts/qa/approved-social-direction"

type Locale = "en" | "ko" | "ja"
type Viewport = { label: string; width: number; height: number }

const VIEWPORTS: readonly Viewport[] = [
  { label: "320x720", width: 320, height: 720 },
  { label: "390x844", width: 390, height: 844 },
  { label: "844x390", width: 844, height: 390 },
  { label: "1440x1000", width: 1440, height: 1000 },
]

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

async function capture(page: Page, name: string) {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${ARTIFACT_DIR}/${name}.png` })
}

async function captureSurface(page: Page, surface: Locator, name: string) {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
  await page.waitForTimeout(450)
  await surface.screenshot({ path: `${ARTIFACT_DIR}/${name}.png` })
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

test("SOC-DIR-004 JA desktop photo composer remains above its own backdrop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await seed(page, "ja")
  const signal = await openLocalSignal(page)
  await signal.locator("fieldset button").first().click()
  await signal.getByTestId("local-signal-photo-input").setInputFiles("public/seoul-after-rain-hero.jpg")

  const photo = signal.locator("img")
  const replace = signal.getByTestId("local-signal-photo-replace")
  const remove = signal.getByTestId("local-signal-photo-remove")
  await replace.scrollIntoViewIfNeeded()
  await photo.evaluate((image) => (image as HTMLImageElement).decode())
  await expect(photo).toBeVisible()
  await expect(replace).toBeVisible()
  await expect(remove).toBeVisible()

  const geometry = await signal.evaluate((root) => {
    const rootBox = root.getBoundingClientRect()
    const body = root.querySelector<HTMLElement>(":scope > div")
    const bodyBox = body?.getBoundingClientRect()
    const draftBox = root.querySelector<HTMLElement>("[data-testid='local-signal-draft']")?.getBoundingClientRect()
    const figureBox = root.querySelector<HTMLElement>("figure")?.getBoundingClientRect()
    const photoBox = root.querySelector<HTMLElement>("img")?.getBoundingClientRect()
    const targets = [root.querySelector(":scope > header"), root.querySelector("img"), ...root.querySelectorAll("figcaption button")]
    const occluded = targets.flatMap((target) => {
      if (!(target instanceof HTMLElement)) return ["missing target"]
      const box = target.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return root.contains(hit) ? [] : [`${target.tagName}:${hit?.tagName ?? "none"}`]
    })
    return {
      root: { left: rootBox.left, top: rootBox.top, right: rootBox.right, bottom: rootBox.bottom },
      bodyOverflowY: body ? getComputedStyle(body).overflowY : "missing",
      bodyClientHeight: body?.clientHeight ?? 0,
      bodyScrollHeight: body?.scrollHeight ?? 0,
      bodyScrollTop: body?.scrollTop ?? 0,
      bodyBox: bodyBox ? { left: bodyBox.left, top: bodyBox.top, right: bodyBox.right, bottom: bodyBox.bottom } : null,
      draftBox: draftBox ? { left: draftBox.left, right: draftBox.right, width: draftBox.width } : null,
      figureBox: figureBox ? { left: figureBox.left, right: figureBox.right, width: figureBox.width } : null,
      photoBox: photoBox ? { left: photoBox.left, right: photoBox.right, width: photoBox.width, height: photoBox.height } : null,
      occluded,
    }
  })
  expect(geometry.root.left).toBeGreaterThanOrEqual(0)
  expect(geometry.root.top).toBeGreaterThanOrEqual(0)
  expect(geometry.root.right).toBeLessThanOrEqual(1440)
  expect(geometry.root.bottom).toBeLessThanOrEqual(1000)
  expect(geometry.root.bottom - geometry.root.top).toBeGreaterThan(750)
  expect(geometry.bodyOverflowY).toMatch(/auto|scroll/)
  expect(geometry.bodyClientHeight).toBeGreaterThan(650)
  expect(geometry.bodyScrollHeight).toBeGreaterThanOrEqual(geometry.bodyClientHeight)
  expect(geometry.draftBox).not.toBeNull()
  expect(geometry.figureBox).not.toBeNull()
  expect(geometry.photoBox).not.toBeNull()
  expect(geometry.draftBox!.right).toBeLessThanOrEqual(geometry.bodyBox!.right)
  expect(geometry.figureBox!.right).toBeLessThanOrEqual(geometry.draftBox!.right)
  expect(geometry.photoBox!.right).toBeLessThanOrEqual(geometry.figureBox!.right)
  expect(geometry.photoBox!.width).toBeLessThanOrEqual(600)
  expect(geometry.photoBox!.height).toBe(260)
  expect(geometry.occluded).toEqual([])
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

  for (const viewport of VIEWPORTS) {
    test(`SOC-DIR-CAPTURE ${locale} ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const entry = await openTables(page, locale)
      await expect(entry).toBeVisible()
      await capture(page, `${locale}-${viewport.label}-tables`)

      await openTableDetail(page)
      await capture(page, `${locale}-${viewport.label}-table-detail`)

      await openAfter19Review(page)
      await capture(page, `${locale}-${viewport.label}-after19`)

      const chat = await openChat(page)
      await chat.scrollIntoViewIfNeeded()
      await capture(page, `${locale}-${viewport.label}-table-chat`)

      const signal = await openLocalSignal(page)
      await signal.locator("fieldset button").first().click()
      await captureSurface(page, signal, `${locale}-${viewport.label}-local-signal`)

      await signal.getByTestId("local-signal-photo-input").setInputFiles("public/seoul-after-rain-hero.jpg")
      await expect(signal.locator("img")).toBeVisible()
      await signal.locator("img").evaluate((image) => (image as HTMLImageElement).decode())
      await signal.getByTestId("local-signal-photo-replace").scrollIntoViewIfNeeded()
      await captureSurface(page, signal, `${locale}-${viewport.label}-local-signal-photo`)
    })
  }
}
