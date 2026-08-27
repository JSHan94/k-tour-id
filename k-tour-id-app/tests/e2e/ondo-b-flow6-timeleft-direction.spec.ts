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
  en: {
    close: "Close Table",
    persistJoin: "My Korea could not save the plan, so you have not joined. Try again.",
    persistLeave: "My Korea could not remove the plan, so you are still in this Table. Try again.",
    photoType: "Choose a JPEG, PNG, or WebP photo.",
    photoSize: "Choose a photo that is 10 MB or smaller.",
    feedbackReceipt: "Saved in this tab only. No public rating or reputation was created.",
  },
  ko: {
    close: "테이블 닫기",
    persistJoin: "My Korea에 계획을 저장하지 못해 아직 참여하지 않았어요. 다시 시도해 주세요.",
    persistLeave: "My Korea에서 계획을 삭제하지 못해 아직 이 테이블에 참여 중이에요. 다시 시도해 주세요.",
    photoType: "JPEG, PNG 또는 WebP 사진을 선택해 주세요.",
    photoSize: "10 MB 이하의 사진을 선택해 주세요.",
    feedbackReceipt: "이 탭에만 저장했어요. 공개 평점이나 평판은 생성되지 않았습니다.",
  },
  ja: {
    close: "Tableを閉じる",
    persistJoin: "マイ韓国に予定を保存できなかったため、まだ参加していません。もう一度お試しください。",
    persistLeave: "マイ韓国から予定を削除できなかったため、まだこのTableに参加中です。もう一度お試しください。",
    photoType: "JPEG、PNG、WebPの写真を選んでください。",
    photoSize: "10 MB以下の写真を選んでください。",
    feedbackReceipt: "このタブ内だけに保存しました。公開評価や評判は作成されていません。",
  },
} as const

test.describe.configure({ timeout: 120_000, mode: "serial" })

async function seed(page: Page, locale: Locale = "en", joined = false) {
  await page.addInitScript(({ key, language, active, tableId, venueId }) => {
    if (localStorage.getItem(key) !== null) return
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
  await page.getByTestId("nav-tables").click({ force: true })
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
  const accountGate = page.getByTestId("ondo-b-action-gate")
  await expect(accountGate).toHaveAttribute("data-active-gate", "account")
  await accountGate.getByTestId("action-gate-confirm").click()
  const gate = page.getByTestId("after19-walkthrough")
  await expect(gate).toBeVisible()
  await gate.getByTestId("after19-start").click()
  await expect(detail.getByTestId("table-join-confirmation")).toBeVisible()
}

async function joinAndOpenChat(page: Page) {
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
  expect(Math.abs(geometry.scrollLeft)).toBeLessThanOrEqual(1)
}

async function expectDecisionInsideViewport(dialog: Locator, viewportHeight: number) {
  const decisionParts = dialog.locator(":scope > strong, :scope > p, :scope > div > button")
  expect(await decisionParts.count()).toBeGreaterThanOrEqual(4)
  for (const part of await decisionParts.all()) {
    const box = await part.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight)
  }
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
  await detail.getByTestId("table-join-draft").fill("Window seat; English is easiest.")
  await detail.getByTestId("table-join").click()
  const accountGate = page.getByTestId("ondo-b-action-gate")
  await expect(accountGate).toHaveAttribute("data-active-gate", "account")
  await accountGate.getByTestId("action-gate-confirm").click()
  const gate = page.getByTestId("after19-walkthrough")
  await expect(gate).toBeVisible()
  for (const button of await gate.getByRole("button").all()) {
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(390)
  }
  await gate.getByTestId("after19-start").click()
  await expect(gate).toHaveCount(0)
  await expect(detail.getByTestId("table-join-confirmation")).toBeVisible()
  await expectNoOverflow(detail.locator(":scope > article"))

  const chat = await joinAndOpenChat(page)
  await expect(detail).toHaveAttribute("data-join-stage", "chat")
  await expect.poll(async () => {
    const [headerBox, chatBox] = await Promise.all([
      detail.locator(":scope > article > header").boundingBox(),
      chat.boundingBox(),
    ])
    if (!headerBox || !chatBox) return -999
    return Math.floor(chatBox.y - (headerBox.y + headerBox.height))
  }).toBeGreaterThanOrEqual(0)
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
  const actionGate = page.getByTestId("ondo-b-action-gate")
  await page.clock.fastForward(15 * 60 * 1000 + 1000)
  await expect(actionGate).toHaveAttribute("data-gate-view", "expired")
  await actionGate.getByTestId("action-gate-retry").click()
  await actionGate.getByTestId("action-gate-confirm").click()
  await actionGate.getByTestId("after19-start").click()

  const confirmation = detail.getByTestId("table-join-confirmation")
  await expect(confirmation).toHaveAttribute("data-return-table", TABLE_ID)
  await expect(confirmation).toHaveAttribute("data-return-venue", VENUE_ID)
  await expect(confirmation.getByTestId("after19-return")).toContainText(draft)
})

test("FLOW6-PERSIST-003 join and leave only advance after durable device state succeeds", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await openTables(page)
  const detail = await openDetail(page)
  await enterReview(page)

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
  for (const button of await leaveDialog.getByRole("button").all()) {
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(720)
  }
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
    await expect(alert).toHaveCount(1)
    for (const sibling of ["report", "block", "leave"] as const) {
      await expect(chat.getByTestId(`table-${sibling}`)).toBeDisabled()
    }
    await expect(alert.locator(":focus")).toHaveCount(1)
    if (action === "report") {
      const composer = chat.getByTestId("table-chat-compose")
      await composer.evaluate((element) => element.focus())
      await expect(composer).not.toBeFocused()
      await expect(detail.locator(":scope > button")).toBeDisabled()
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur() })
    }
    await page.keyboard.press("Escape")
    await expect(alert).toBeHidden()
    await expect(opener).toBeFocused()
  }

  await chat.getByTestId("table-block").click()
  await chat.getByTestId("table-block-confirm").click()
  await expect(chat).toContainText("Jae is hidden only in this tab.")
  await expect(chat.locator(":scope > header small")).toHaveText("3")
})

test("FLOW6-FAILURE-005 message retry, check-in receipt, exact return, and reload stay legible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { tableMessage: "failure" } })
  await openTables(page)
  const detail = await openDetail(page)
  const joinBox = await detail.getByTestId("table-join").boundingBox()
  expect(joinBox).not.toBeNull()
  expect(joinBox!.y).toBeGreaterThanOrEqual(0)
  expect(joinBox!.y + joinBox!.height).toBeLessThanOrEqual(720 - 12)
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
  await expect(chat.getByTestId("table-reputation-receipt")).toContainText("Saved in this tab only. No public rating or reputation was created.")

  await detail.locator(":scope > article > header").getByRole("button", { name: COPY.en.close }).first().click()
  await page.getByTestId("nav-my").click({ force: true })
  const planned = page.getByTestId(`planned-table-${TABLE_ID}`)
  await expect(planned).toBeVisible()
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-my").click({ force: true })
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
      await page.evaluate(() => { window.__ONDO_B_QA__ = { ...(window.__ONDO_B_QA__ ?? {}), after19: "failure", tableMessage: "failure" } })
      await detail.getByTestId("table-join").click()
      await page.getByTestId("action-gate-confirm").click()
      await quietCapture(page, `${locale}-${viewport.label}-after19-intro`)
      await page.getByTestId("after19-start").click()
      await quietCapture(page, `${locale}-${viewport.label}-after19-failure`)
      await page.evaluate(() => { if (window.__ONDO_B_QA__) delete window.__ONDO_B_QA__.after19 })
      await page.getByTestId("action-gate-retry").click()
      await quietCapture(page, `${locale}-${viewport.label}-after19-review`)
      await page.getByTestId("after19-start").click()
      await installOneShotDeviceWriteFailure(page)
      await page.getByTestId("table-join-confirm").click()
      await quietCapture(page, `${locale}-${viewport.label}-join-save-failure`)
      await page.getByTestId("table-join-confirm").click()
      await quietCapture(page, `${locale}-${viewport.label}-joined`)
      await page.getByTestId("table-open-chat").click()
      const chat = page.getByTestId("table-chat")
      await expect(chat).toBeVisible()
      await expect.poll(async () => {
        const [headerBox, chatBox] = await Promise.all([
          detail.locator(":scope > article > header").boundingBox(),
          chat.boundingBox(),
        ])
        if (!headerBox || !chatBox) return -999
        return Math.floor(chatBox.y - (headerBox.y + headerBox.height))
      }).toBeGreaterThanOrEqual(0)
      await quietCapture(page, `${locale}-${viewport.label}-chat`)
      await chat.getByTestId("table-report").click()
      await expectDecisionInsideViewport(chat.getByRole("alertdialog"), viewport.height)
      await quietCapture(page, `${locale}-${viewport.label}-report-confirm`)
      await chat.getByRole("alertdialog").getByRole("button").last().click()
      await chat.getByTestId("table-block").click()
      await quietCapture(page, `${locale}-${viewport.label}-block-confirm`)
      await chat.getByTestId("table-block-confirm").click()
      await quietCapture(page, `${locale}-${viewport.label}-block-hidden-undo`)
      await chat.getByTestId("table-block-undo").click()

      const imageInput = chat.getByTestId("table-chat-image")
      const composer = imageInput.locator("..")
      await imageInput.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") })
      const imageError = chat.getByTestId("table-chat-image-error")
      await expect(imageError).toHaveText(COPY[locale].photoType)
      await composer.scrollIntoViewIfNeeded()
      await expectNoOverflow(composer)
      await quietCapture(page, `${locale}-${viewport.label}-photo-mime-error`)

      await imageInput.setInputFiles({ name: "too-large.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc((10 * 1024 * 1024) + 1) })
      await expect(imageError).toHaveText(COPY[locale].photoSize)
      await expectNoOverflow(composer)
      await quietCapture(page, `${locale}-${viewport.label}-photo-size-error`)

      await imageInput.setInputFiles("public/seoul-after-rain-hero.jpg")
      await expect(imageError).toHaveCount(0)
      await expect(composer.locator("img")).toBeVisible()
      await expectNoOverflow(composer)
      await quietCapture(page, `${locale}-${viewport.label}-photo-ready`)
      await composer.getByRole("button").first().click()

      await chat.getByTestId("table-chat-compose").fill("Same-tab arrival note.")
      await chat.getByTestId("table-message-send").click()
      await quietCapture(page, `${locale}-${viewport.label}-chat-send-failure`)
      await chat.getByTestId("table-message-retry").click()
      await chat.getByTestId("table-check-in").click()
      await quietCapture(page, `${locale}-${viewport.label}-feedback`)
      await chat.locator("button[aria-pressed]").first().click()
      await chat.getByTestId("table-feedback-submit").click()
      const feedbackReceipt = chat.getByTestId("table-reputation-receipt")
      await expect(feedbackReceipt).toContainText(COPY[locale].feedbackReceipt)
      await feedbackReceipt.scrollIntoViewIfNeeded()
      await expectNoOverflow(feedbackReceipt)
      await quietCapture(page, `${locale}-${viewport.label}-feedback-receipt`)

      await detail.locator(":scope > article > header").getByRole("button", { name: COPY[locale].close }).first().click()
      await page.getByTestId("nav-my").click({ force: true })
      await quietCapture(page, `${locale}-${viewport.label}-my-history`)
      await page.reload({ waitUntil: "domcontentloaded" })
      const scroll = page.getByTestId("ondo-scroll-region")
      await expect.poll(() => scroll.evaluate((element) => element.style.getPropertyValue("--ondo-scroll-viewport"))).not.toBe("")
      await page.getByTestId("nav-my").click({ force: true })
      await quietCapture(page, `${locale}-${viewport.label}-my-history-reload`)
      await page.getByTestId(`planned-table-${TABLE_ID}`).getByRole("button").click()
      await quietCapture(page, `${locale}-${viewport.label}-exact-table-return`)
      await page.getByTestId("table-open-chat").click()
      await detail.getByTestId("table-leave").click()
      await quietCapture(page, `${locale}-${viewport.label}-leave-confirm`)
      await installOneShotDeviceWriteFailure(page)
      await detail.getByTestId("table-leave-confirm").click()
      await quietCapture(page, `${locale}-${viewport.label}-leave-save-failure`)
    })
  }
}
