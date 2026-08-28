import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import {
  B_DEVICE_KEY,
  CANONICAL_VENUE_ID,
  TABLE_ID,
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
} from "../helpers/ondo-b-qa"

const EMPTY_TABLE_VENUE_ID = "mois-18939eecb43c15ab4305"
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
const READY_SESSION = {
  account: "ACC-ACTIVE",
  person: "PER-VERIFIED",
  age: "AGE-VERIFIED",
  ageExpiresAt: "2026-08-20T20:30:00+09:00",
  paymentKyc: "PKY-VERIFIED",
} as const

test.beforeEach(async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000)
  installBRuntimeGuard(page)
  await prepareBPage(page)
})

test.afterEach(async ({ page }) => {
  await expectBRuntimeClean(page)
})

async function seed(page: Page, options: { locale?: "en" | "ko"; membership?: "confirmed" | "checked_in" | "completed" } = {}) {
  await seedB(page, {
    locale: options.locale ?? "en",
    session: {
      ...READY_SESSION,
      ...(options.membership ? { tableMembershipById: { [TABLE_ID]: options.membership } } : {}),
    },
  })
}

async function openJoinedChat(page: Page, query = "") {
  await gotoB(page, query)
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  const detail = page.getByTestId("table-detail")
  await expect(detail).toHaveAttribute("data-table-id", TABLE_ID)
  const openChat = detail.getByTestId("table-open-chat")
  const chat = detail.getByTestId("table-chat")
  if (!await chat.isVisible()) {
    await expect(openChat).toBeVisible()
    await openChat.click()
  }
  await expect(chat).toBeVisible()
  return { detail, chat }
}

async function expectNoSeriousAxe(page: Page, include: string) {
  const result = await new AxeBuilder({ page }).include(include).analyze()
  expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([])
}

test("SLK-005 canonical Place opens a venue-first Table scope with explicit global browse and exact venue return", async ({ page }) => {
  await seed(page)
  await gotoB(page, `?venueId=${EMPTY_TABLE_VENUE_ID}`)
  await page.getByTestId("canonical-place-details").click()
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toHaveAttribute("data-venue-id", EMPTY_TABLE_VENUE_ID)
  await expect(place.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
  await place.getByTestId("canonical-venue-tables").click()

  const scope = place.getByTestId("venue-table-scope")
  await expect(scope).toHaveAttribute("data-empty-state", "open")
  await expect(place.getByTestId("venue-tables-empty")).toContainText("No open Table here yet")
  await expect(page.getByTestId("tables-entry")).toHaveCount(0)

  await place.getByTestId("tables-back-to-venue").click()
  await expect(scope).toHaveAttribute("data-empty-state", "closed")
  await expect(place).toHaveAttribute("data-venue-id", EMPTY_TABLE_VENUE_ID)
  await place.getByTestId("canonical-venue-tables").click()
  await place.getByTestId("tables-browse-all").click()

  const tables = page.getByTestId("tables-entry")
  await expect(tables).toBeVisible()
  await expect(tables.getByTestId(`table-card-${TABLE_ID}`)).toHaveCount(1)
  await expect(page.getByTestId("nav-tables")).toHaveAttribute("aria-current", "page")

  await page.getByTestId("nav-ondo").click()
  const returnedPlace = page.getByTestId("canonical-place-overlay")
  await expect(returnedPlace).toHaveAttribute("data-venue-id", EMPTY_TABLE_VENUE_ID)
  await expect(returnedPlace.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
  await expect(page).toHaveURL(new RegExp(`venueId=${EMPTY_TABLE_VENUE_ID}.*detail=1`))
  await expect.poll(() => page.evaluate(() => history.state?.__ondoBDiscovery)).toMatchObject({
    level: "detail",
    city: "seoul",
    venueId: EMPTY_TABLE_VENUE_ID,
  })
})

test("SLK-006/007 nested Table report owns focus, Tab, Escape, exact return, and tab-only reload truth", async ({ page }) => {
  await seed(page, { membership: "confirmed" })
  let { detail, chat } = await openJoinedChat(page)
  await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("inert", "")

  const invoker = chat.getByTestId("table-report")
  await invoker.click()
  const dialog = chat.getByRole("alertdialog", { name: "Report this message?" })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText("Recorded in this tab only; nothing is sent to ONDO or the host.")
  await expect(page.locator("[role='dialog'][aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
  const cancel = dialog.getByRole("button", { name: "Cancel", exact: true })
  const confirm = dialog.getByTestId("table-report-confirm")
  await expect(cancel).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(confirm).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(cancel).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(detail.getByTestId("table-chat")).toBeVisible()
  await expect(invoker).toBeFocused()

  await invoker.click()
  await dialog.getByTestId("table-report-confirm").click()
  await expect(chat.getByRole("status").filter({ hasText: "Report recorded in this tab." })).toBeVisible()
  await expect(invoker).toBeFocused()

  await chat.getByTestId("table-block").click()
  const blockDialog = chat.getByRole("alertdialog", { name: "Hide Jae in this tab?" })
  await expect(blockDialog).toContainText("Jae · participant in this Table")
  await blockDialog.getByTestId("table-block-confirm").click()
  await expect(chat.getByRole("status").filter({ hasText: "Jae is hidden only in this tab." })).toBeVisible()
  await expect(chat.getByText("English or Korean both work for me.")).toHaveCount(0)

  await page.reload({ waitUntil: "domcontentloaded" })
  ;({ detail, chat } = await openJoinedChat(page))
  await expect(chat.getByText("Report recorded in this tab.")).toHaveCount(0)
  await expect(chat.getByText("Jae is hidden only in this tab.")).toHaveCount(0)
  await expect(chat.getByText("English or Korean both work for me.")).toBeVisible()
  await expect(detail).toHaveAttribute("data-join-stage", "chat")
  await expectNoSeriousAxe(page, "[data-testid='table-chat']")
})

test("SLK-008 failed image has one retry authority and an alternate-photo action without duplication", async ({ page }) => {
  await seed(page, { membership: "confirmed" })
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { tableMessage: "failure" } })
  const { chat } = await openJoinedChat(page)
  await chat.getByTestId("table-chat-image").setInputFiles({ name: "meal.png", mimeType: "image/png", buffer: PNG })
  await chat.getByTestId("table-message-send").click()

  const failed = chat.locator("article[data-state='failed']")
  await expect(failed).toHaveCount(1)
  await expect(failed.getByTestId("table-message-retry")).toHaveCount(1)
  await expect(chat.getByRole("button", { name: "Retry photo" })).toHaveCount(0)
  await expect(chat.getByText("Add photo", { exact: true })).toBeVisible()
  await failed.getByTestId("table-message-retry").click()
  await expect(chat.locator("article[data-state='ready']")).toHaveCount(1)
  await expect(chat.locator("article[data-state]")).toHaveCount(1)
})

test("SLK-015/020 Korean Local Signal is task-first, localized, invariant-safe, and terminal-only", async ({ page }) => {
  await seed(page, { locale: "ko" })
  await openCanonicalVenue(page)
  const place = page.getByTestId("canonical-place-overlay")
  const opener = place.getByTestId("canonical-local-signal-open")
  await opener.click()
  const signal = page.getByTestId("ondo-b-local-signal")
  await expect(signal).toContainText("로컬 시그널 남기기")
  await expect(signal).toContainText("태그와 게시 시각만 기기에 남아요")
  await expect(signal).toContainText("계정·ID·자격증명을 만들지 않습니다")
  await expect(signal).not.toContainText(/Visit|Contribution|Meetup|KYC/)
  await signal.locator("fieldset button").first().click()
  const note = "입구 옆 키오스크에서 먼저 주문해요."
  await signal.locator("textarea").fill(note)
  await signal.getByTestId("local-signal-person-check").click()
  const post = signal.getByTestId("local-signal-post")
  await expect(post).toHaveText("이 기기에 로컬 시그널 저장")
  await post.click()

  await expect(signal).toBeHidden()
  await expect(place).toBeVisible()
  await expect(place).toHaveAttribute("data-venue-id", CANONICAL_VENUE_ID)
  await expect(opener).toBeFocused()
  const stored = await page.evaluate((key) => localStorage.getItem(key) ?? "", B_DEVICE_KEY)
  expect(stored).not.toContain(note)
  const device = JSON.parse(stored) as {
    localSignalPostedVenueIds: string[]
    localPulseEvidenceByVenue: Record<string, { tags: string[]; postedAt: string }>
  }
  expect(device.localSignalPostedVenueIds).toContain(CANONICAL_VENUE_ID)
  expect(device.localPulseEvidenceByVenue[CANONICAL_VENUE_ID].tags).toEqual(["calm_now"])
  expect(Date.parse(device.localPulseEvidenceByVenue[CANONICAL_VENUE_ID].postedAt)).not.toBeNaN()
})

test("D2 polish feedback is progressively disclosed and records no combined reputation score", async ({ page }) => {
  await seed(page, { membership: "confirmed" })
  const { chat } = await openJoinedChat(page)
  await expect(chat.getByTestId("table-feedback-submit")).toHaveCount(0)
  await chat.getByTestId("table-check-in").click()
  await expect(chat.getByRole("heading", { name: "How was the Table?" })).toBeVisible()
  await expect(chat.getByTestId("table-chat-compose")).toBeVisible()
  await expect(chat.getByText("Add photo", { exact: true })).toBeVisible()
  await expect(chat.getByTestId("table-report")).toBeVisible()

  await chat.getByRole("button", { name: "Helpful table", exact: true }).click()
  await chat.getByTestId("table-feedback-submit").click()
  const receipt = chat.getByTestId("table-reputation-receipt")
  await expect(receipt).toContainText("Saved in this tab only. No public rating or reputation was created.")
  await expect(receipt).toContainText("Meetup")
  await expect(receipt).toContainText("Feedback")
  await expect(receipt).not.toContainText(/(?:public )?(?:score|rating):?\s*\d/i)
  await expect(chat.getByTestId("table-chat-compose")).toBeVisible()
  await expect(chat.getByTestId("table-report")).toBeVisible()
})
