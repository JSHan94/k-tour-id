import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const CANONICAL_VENUE_ID = "mois-0021cd596bc5b2a922ad"
const TABLE_ID = "table-seongsu-dinner"
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
const runtimeFailures = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const failures: string[] = []
  runtimeFailures.set(page, failures)
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`) })
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`))
})

test.afterEach(async ({ page }) => {
  expect(runtimeFailures.get(page) ?? []).toEqual([])
})

async function seed(page: Page, options: { locale?: "en" | "ko"; membership?: "confirmed" | "checked_in" | "completed" } = {}) {
  await page.addInitScript(({ locale, membership }) => {
    if (!localStorage.getItem("ondo.preferences.v3")) {
      localStorage.setItem("ondo.preferences.v3", JSON.stringify({ locale, guideSeen: true, autoNight: true, savedVenueIds: [], discoveryPreferences: [] }))
    }
    if (!sessionStorage.getItem("ondo.session.v3")) {
      sessionStorage.setItem("ondo.session.v3", JSON.stringify({
        onboarding: "ONB-COMPLETE",
        persona: "short_term",
        account: "ACC-ACTIVE",
        person: "PER-VERIFIED",
        age: "AGE-VERIFIED",
        ageExpiresAt: "2026-08-21T20:00:00+09:00",
        paymentKyc: "PKY-VERIFIED",
        tableMembershipById: membership ? { ["table-seongsu-dinner"]: membership } : {},
        stamps: 9,
      }))
      sessionStorage.removeItem("ondo.chat.v2")
      sessionStorage.removeItem("ondo.table-outcomes.v2")
    }
  }, { locale: options.locale ?? "en", membership: options.membership })
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "nextjs-portal { display: none !important; }"
      document.head.append(style)
    }, { once: true })
  })
}

async function openJoinedChat(page: Page, query = "") {
  await page.goto(`/ondo-b${query}`)
  await page.getByRole("button", { name: "Tables", exact: true }).click()
  await page.getByRole("region", { name: "Joined" }).locator(`[data-table-id='${TABLE_ID}']`).click()
  await expect(page.getByTestId("table-chat")).toBeVisible()
}

async function expectNoSeriousAxe(page: Page, include: string) {
  const result = await new AxeBuilder({ page }).include(include).analyze()
  expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([])
}

test("SLK-005 canonical Place opens a venue-first Table scope with explicit global browse and exact return", async ({ page }) => {
  await seed(page)
  await page.goto(`/ondo-b?venueId=${CANONICAL_VENUE_ID}`)
  await page.getByTestId("canonical-place-details").click()
  await page.getByTestId("canonical-venue-tables").click()

  const scope = page.getByTestId("venue-table-scope")
  await expect(scope).toBeVisible()
  await expect(page.getByTestId("tables-canonical-context")).toContainText("has no live Table attached")
  await expect(page.getByTestId("venue-tables-empty")).toContainText("No Tables are open at this place yet")
  await expect(page.getByTestId("tables-entry").locator("[data-table-id]")).toHaveCount(0)

  await page.getByTestId("tables-browse-all").click()
  await expect(page.getByTestId("tables-entry").locator("[data-table-id]")).not.toHaveCount(0)
  await page.getByTestId("tables-back-to-place-scope").click()
  await page.getByTestId("tables-back-to-venue").click()
  await expect(page.getByTestId("canonical-place-overlay")).toContainText("Roba")
})

test("SLK-006/007 nested preview report owns focus, Tab, Escape, focus return, receipt and reload truth", async ({ page }) => {
  await seed(page, { membership: "confirmed" })
  await openJoinedChat(page)
  await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("inert", "")
  await expect(page.locator("[data-active-tab='tables']")).toHaveAttribute("aria-hidden", "true")

  const invoker = page.getByTestId("table-report")
  await invoker.click()
  const dialog = page.getByTestId("chat-confirm-dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute("aria-modal", "true")
  await expect(page.getByTestId("ondo-sheet")).not.toHaveAttribute("role")
  await expect(page.locator("[role='dialog'][aria-modal='true']:not([aria-hidden='true']):not([inert]), [role='alertdialog'][aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
  await expect(page.getByTestId("report-reason")).toBeFocused()
  await expect(dialog).toContainText("only in this device’s simulated preview")
  await page.keyboard.press("Shift+Tab")
  await expect(page.getByTestId("confirm-cancel")).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId("table-chat")).toBeVisible()
  await expect(invoker).toBeFocused()

  await invoker.click()
  await page.getByTestId("report-reason").selectOption("harassment")
  await page.getByTestId("report-block").check()
  await page.getByTestId("confirm-submit").click()
  await expect(page.getByTestId("table-report-receipt")).toContainText("Local simulated preview report recorded")
  await page.getByRole("button", { name: "Open chat" }).click()
  await expect(page.getByTestId("table-chat")).toContainText("Report receipt · Local simulated preview only")
  await expect(page.getByTestId("table-chat")).toContainText("only in this local simulated preview")

  await page.reload()
  await page.getByRole("button", { name: "Tables", exact: true }).click()
  await page.getByRole("region", { name: "Joined" }).locator(`[data-table-id='${TABLE_ID}']`).click()
  await expect(page.getByTestId("table-chat")).toContainText("Report receipt · Local simulated preview only")
  await expectNoSeriousAxe(page, "[data-testid='table-chat']")
})

test("SLK-008 failed image has one retry authority and an alternate-photo action without duplication", async ({ page }) => {
  await seed(page, { membership: "confirmed" })
  await openJoinedChat(page, "?scenario=media-failed")
  const chat = page.getByTestId("table-chat")
  await chat.locator("input[type='file']").setInputFiles({ name: "meal.png", mimeType: "image/png", buffer: PNG })
  await chat.getByRole("button", { name: "Send photo" }).click()

  const failed = chat.locator("[data-message-status='MSG-FAILED']")
  await expect(failed).toHaveCount(1)
  await expect(failed.getByRole("button", { name: "Try again" })).toHaveCount(1)
  await expect(chat.getByRole("button", { name: "Retry photo" })).toHaveCount(0)
  await expect(chat.getByText("Add a photo", { exact: true })).toBeVisible()
  await failed.getByRole("button", { name: "Try again" }).click()
  await expect(chat.locator("[data-message-status='MSG-SENT']")).toHaveCount(1)
  await expect(chat.locator("[data-message-status]")).toHaveCount(1)
})

test("SLK-015/020 Korean Local Signal is task-first, localized, invariant-safe, and terminal-only", async ({ page }) => {
  await seed(page, { locale: "ko" })
  await page.goto(`/ondo-b?venueId=${CANONICAL_VENUE_ID}`)
  await page.getByTestId("canonical-place-details").click()
  await page.getByTestId("canonical-venue-signal").click()
  const signal = page.getByTestId("local-signal-overlay")
  await expect(signal).toContainText("다음 여행자에게 도움 주기")
  await expect(signal).toContainText("방문과 기여 이력만 바뀝니다")
  await expect(signal).toContainText("모임 이력")
  await expect(signal).not.toContainText(/Visit|Contribution|Meetup|KYC/)
  await signal.locator("textarea").fill("입구 옆 키오스크에서 먼저 주문해요.")
  await page.getByTestId("local-signal-submit").click()

  await expect(signal).toHaveAttribute("data-signal-status", "submitted")
  await expect(signal).toHaveAttribute("data-signal-invariants", "preserved")
  await expect(signal.getByText("방문과 기여 이력만 바뀝니다", { exact: false })).toHaveCount(1)
  await expect(signal.locator("textarea")).toHaveCount(0)
  await expect(signal.getByRole("button", { name: "작성 취소" })).toHaveCount(0)
  await expect(page.getByTestId("local-signal-return")).toHaveText("장소로 돌아가기")
})

test("D2 polish feedback mode hides unrelated chat tools until feedback is complete", async ({ page }) => {
  await seed(page, { membership: "confirmed" })
  await openJoinedChat(page)
  const chat = page.getByTestId("table-chat")
  await page.getByTestId("table-check-in").click()
  await page.getByTestId("table-finish-meal").click()
  await expect(page.getByTestId("table-feedback")).toBeVisible()
  await expect(chat.getByRole("textbox", { name: "Message the Table" })).toHaveCount(0)
  await expect(chat.getByText("Add a photo", { exact: true })).toHaveCount(0)
  await expect(page.getByTestId("table-report")).toHaveCount(0)
  await page.getByTestId("feedback-helpful-yes").click()
  await page.getByTestId("feedback-respectful-yes").click()
  await page.getByTestId("feedback-submit").click()
  await expect(page.getByTestId("feedback-result")).toContainText("Feedback recorded once. No overall score was created.")
  await expect(chat.getByRole("textbox", { name: "Message the Table" })).toHaveCount(0)
  await expect(page.getByTestId("table-report")).toHaveCount(0)
  await page.getByTestId("feedback-back-to-chat").click()
  await expect(chat.getByRole("textbox", { name: "Message the Table" })).toBeVisible()
  await expect(page.getByTestId("table-report")).toBeVisible()
})
