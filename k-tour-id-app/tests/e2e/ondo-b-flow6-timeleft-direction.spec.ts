import { mkdirSync } from "node:fs"
import { expect, test, type Locator, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const TABLE_ID = "table-seoul-night-bites"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const ARTIFACT_DIR = "artifacts/qa/flow6-timeleft"

type Locale = "en" | "ko" | "ja"
type Viewport = { label: string; width: number; height: number }

const VIEWPORTS: readonly Viewport[] = [
  { label: "320x720", width: 320, height: 720 },
  { label: "390x844", width: 390, height: 844 },
  { label: "844x390", width: 844, height: 390 },
  { label: "1440x1000", width: 1440, height: 1000 },
]

const COPY = {
  en: { close: "Close Table", persistJoin: "Your seat opened, but My Korea could not save it on this device.", persistLeave: "You left the Table, but My Korea could not remove the plan." },
  ko: { close: "테이블 닫기", persistJoin: "좌석은 열렸지만 My Korea에 저장하지 못했어요.", persistLeave: "테이블에서는 나갔지만 My Korea 계획을 지우지 못했어요." },
  ja: { close: "Tableを閉じる", persistJoin: "席は確保されましたが、この端末のマイ韓国に保存できませんでした。", persistLeave: "Tableから退出しましたが、マイ韓国の予定を削除できませんでした。" },
} as const

test.describe.configure({ timeout: 120_000, mode: "serial" })

async function seed(page: Page, locale: Locale = "en", joined = false) {
  await page.addInitScript(({ key, language, active, tableId, venueId }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: language,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
      recentVenueIds: [],
      plannedTableRefs: active ? [{ tableId, venueId }] : [],
      localSignalPostedVenueIds: [],
      localPulseEvidenceByVenue: {},
      localInteractionBoundarySeen: true,
    }))
  }, { key: DEVICE_KEY, language: locale, active: joined, tableId: TABLE_ID, venueId: VENUE_ID })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
}

async function openTables(page: Page, locale: Locale = "en", joined = false) {
  await seed(page, locale, joined)
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  const scroll = page.getByTestId("ondo-scroll-region")
  await expect(scroll).toBeVisible()
  await expect.poll(() => scroll.evaluate((element) => element.style.getPropertyValue("--ondo-scroll-viewport"))).not.toBe("")
  await page.getByTestId("nav-tables").click()
  const entry = page.getByTestId("tables-entry")
  await expect(entry).toBeVisible()
  return entry
}

async function openDetail(page: Page) {
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  const detail = page.getByTestId("table-detail")
  await expect(detail).toBeVisible()
  return detail
}

async function enterReview(page: Page, draft = "Window seat; English is easiest.") {
  const detail = page.getByTestId("table-detail")
  await detail.getByTestId("table-join-draft").fill(draft)
  await detail.getByTestId("table-join").click()
  const gate = page.getByTestId("after19-walkthrough")
  await expect(gate).toBeVisible()
  await gate.getByTestId("after19-start").click()
  await expect(gate.getByTestId("gate-success")).toBeVisible()
  return gate
}

async function joinAndOpenChat(page: Page) {
  await page.getByTestId("gate-success").click()
  await page.getByTestId("table-join-confirm").click()
  await page.getByTestId("table-open-chat").click()
  const chat = page.getByTestId("table-chat")
  await expect(chat).toBeVisible()
  return chat
}

async function expectNoOverflow(locator: Locator) {
  const geometry = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    scrollLeft: element.scrollLeft,
  }))
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1)
  expect(geometry.scrollLeft).toBe(0)
}

async function installOneShotDeviceWriteFailure(page: Page) {
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem
    let pending = true
    Storage.prototype.setItem = function (name: string, value: string) {
      if (this === localStorage && name === key && pending) {
        pending = false
        throw new DOMException("Quota exceeded", "QuotaExceededError")
      }
      return original.call(this, name, value)
    }
  }, DEVICE_KEY)
}

async function quietCapture(page: Page, name: string) {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
  await page.screenshot({ path: `${ARTIFACT_DIR}/${name}.png`, animations: "disabled" })
}

test("FLOW6-VIS-001 Timeleft hierarchy is explicit and short-landscape never scrolls the social canvas sideways", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  const entry = await openTables(page)
  await expect(entry).toHaveAttribute("data-visual-direction", "timeleft-warm-atlas")
  const open = entry.getByTestId(`table-open-${TABLE_ID}`)
  const openBox = await open.boundingBox()
  expect(openBox!.height).toBeGreaterThanOrEqual(48)
  expect(openBox!.y + openBox!.height).toBeLessThanOrEqual(390)

  const detail = await openDetail(page)
  await expect(detail).toHaveAttribute("data-join-stage", "idle")
  await expectNoOverflow(detail.locator(":scope > article"))
  const gate = await enterReview(page)
  await expect(gate).toHaveAttribute("data-visual-direction", "timeleft-checkpoint")
  await expect(gate).toHaveAttribute("data-gate-view", "review")
  await expectNoOverflow(gate)

  const chat = await joinAndOpenChat(page)
  await expect(detail).toHaveAttribute("data-join-stage", "chat")
  await chat.scrollIntoViewIfNeeded()
  await expectNoOverflow(detail.locator(":scope > article"))
})

test("FLOW6-RETURN-002 an actually expired envelope retries into a fresh exact Table/place/draft return", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.install({ time: new Date("2026-08-27T00:00:00.000Z") })
  await openTables(page)
  const detail = await openDetail(page)
  const draft = "Keep this exact note through a real TTL retry."
  await detail.getByTestId("table-join-draft").fill(draft)
  await detail.getByTestId("table-join").click()
  await page.clock.setFixedTime(new Date("2026-08-27T00:10:01.000Z"))
  await page.getByTestId("after19-start").click()
  await page.getByTestId("gate-success").click()
  await expect(page.getByTestId("after19-expiry-notice")).toBeVisible()
  await page.getByTestId("gate-retry").click()
  await page.getByTestId("gate-success").click()

  const confirmation = detail.getByTestId("table-join-confirmation")
  await expect(confirmation).toHaveAttribute("data-return-table", TABLE_ID)
  await expect(confirmation).toHaveAttribute("data-return-venue", VENUE_ID)
  await expect(confirmation.getByTestId("after19-return")).toContainText(draft)
})

test("FLOW6-PERSIST-003 join and leave only advance after durable device state succeeds", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openTables(page)
  const detail = await openDetail(page)
  await enterReview(page)
  await page.getByTestId("gate-success").click()

  await installOneShotDeviceWriteFailure(page)
  await detail.getByTestId("table-join-confirm").click()
  await expect(detail.getByTestId("table-join-save-error")).toContainText(COPY.en.persistJoin)
  await expect(detail.getByTestId("table-join-confirmation")).toBeVisible()
  await expect(detail.getByTestId("table-open-chat")).toHaveCount(0)
  await detail.getByTestId("table-join-confirm").click()
  await expect(detail.getByTestId("table-open-chat")).toBeVisible()

  await detail.getByTestId("table-open-chat").click()
  await detail.getByTestId("table-leave").click()
  await installOneShotDeviceWriteFailure(page)
  const leaveDialog = detail.getByRole("alertdialog")
  await leaveDialog.getByTestId("table-leave-confirm").click()
  await expect(leaveDialog.getByTestId("table-leave-save-error")).toContainText(COPY.en.persistLeave)
  await expect(detail.getByTestId("table-chat")).toBeVisible()
  await leaveDialog.getByTestId("table-leave-confirm").click()
  await expect(detail.getByTestId("table-join")).toBeVisible()
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").plannedTableRefs ?? [], DEVICE_KEY)).toEqual([])
})

test("FLOW6-SAFE-004 Report, Block, and Leave own focus, Escape, and confirmation before changing state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openTables(page, "en", true)
  const detail = await openDetail(page)
  await detail.getByTestId("table-open-chat").click()
  const chat = detail.getByTestId("table-chat")

  for (const action of ["report", "block", "leave"] as const) {
    const opener = chat.getByTestId(`table-${action}`)
    await opener.click()
    const alert = chat.getByRole("alertdialog")
    await expect(alert).toBeVisible()
    await expect(alert.locator(":focus")).toHaveCount(1)
    await page.keyboard.press("Escape")
    await expect(alert).toBeHidden()
    await expect(opener).toBeFocused()
  }

  await chat.getByTestId("table-block").click()
  await chat.getByTestId("table-block-confirm").click()
  await expect(chat).toContainText("Participant hidden in this tab.")
  await expect(chat.locator(":scope > header small")).toHaveText("3")
})

test("FLOW6-FAILURE-005 message retry, check-in receipt, exact return, and reload stay legible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { tableMessage: "failure" } })
  await openTables(page)
  const detail = await openDetail(page)
  await enterReview(page)
  const chat = await joinAndOpenChat(page)
  const tabOnlyMessage = "I will have a blue scarf by the door."
  await chat.getByTestId("table-chat-compose").fill(tabOnlyMessage)
  await chat.getByTestId("table-message-send").click()
  await expect(chat.getByTestId("table-message-retry")).toBeVisible()
  await chat.getByTestId("table-message-retry").click()
  await chat.getByTestId("table-check-in").click()
  await chat.getByRole("button", { name: "Helpful table" }).click()
  await chat.getByTestId("table-feedback-submit").click()
  await expect(chat.getByTestId("table-reputation-receipt")).toBeVisible()

  await detail.getByRole("button", { name: COPY.en.close }).first().click()
  await page.getByTestId("nav-my").click()
  const planned = page.getByTestId(`planned-table-${TABLE_ID}`)
  await expect(planned).toBeVisible()
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-my").click()
  await page.getByTestId(`planned-table-${TABLE_ID}`).getByRole("button").click()
  await expect(page.getByTestId("table-detail")).toHaveAttribute("data-join-stage", "joined")
  await expect(page.getByTestId("table-chat")).toHaveCount(0)
  await page.getByTestId("table-open-chat").click()
  await expect(page.getByTestId("table-chat")).not.toContainText(tabOnlyMessage)
})

for (const locale of ["en", "ko", "ja"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`FLOW6-CAPTURE ${locale} ${viewport.label} core, recovery, history`, async ({ page }) => {
      test.skip(process.env.ONDO_FLOW6_CAPTURE !== "1", "Run after PRODUCT seal with ONDO_FLOW6_CAPTURE=1")
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const entry = await openTables(page, locale)
      await quietCapture(page, `${locale}-${viewport.label}-tables`)
      const detail = await openDetail(page)
      await quietCapture(page, `${locale}-${viewport.label}-detail`)
      await detail.getByTestId("table-join-draft").fill("Same Table, same place, same note.")
      await detail.getByTestId("table-join").click()
      await quietCapture(page, `${locale}-${viewport.label}-after19-intro`)
      await page.getByTestId("after19-start").click()
      await quietCapture(page, `${locale}-${viewport.label}-after19-review`)
      const chat = await joinAndOpenChat(page)
      await chat.scrollIntoViewIfNeeded()
      await quietCapture(page, `${locale}-${viewport.label}-chat`)
      await chat.getByTestId("table-check-in").click()
      await quietCapture(page, `${locale}-${viewport.label}-feedback`)
      await detail.getByTestId("table-leave").click()
      await quietCapture(page, `${locale}-${viewport.label}-leave-confirm`)
    })
  }
}
