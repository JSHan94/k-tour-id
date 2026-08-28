import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const DEVICE_KEY = "ondo-b.device.v1"
const TABLE_ID = "table-seoul-night-bites"
const VENUE_ID = "mois-0021cd596bc5b2a922ad"

async function openTables(page: Page, locale: "en" | "ko" = "en") {
  await page.addInitScript(({ key, nextLocale }) => {
    localStorage.setItem(key, JSON.stringify({
      locale: nextLocale,
      onboarding: "ONB-COMPLETE",
      persona: null,
      discoveryPreferences: [],
      savedVenueIds: [],
      privateNotesByVenue: {},
    }))
  }, { key: DEVICE_KEY, nextLocale: locale })
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort("blockedbyclient"))
  await page.goto("/ondo-b", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-tables").click()
  await expect(page.getByTestId("tables-entry")).toBeVisible()
}

async function openActiveTable(page: Page) {
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  const detail = page.getByTestId("table-detail")
  await expect(detail).toHaveAttribute("data-table-id", TABLE_ID)
  await expect(detail).toHaveAttribute("data-venue-id", VENUE_ID)
  return detail
}

async function advanceAccountToAge(page: Page) {
  const coordinator = page.getByTestId("ondo-b-action-gate")
  await expect(coordinator).toHaveAttribute("data-active-gate", "account")
  const returnContext = coordinator.getByTestId("action-gate-return-context")
  await expect(returnContext).toHaveAttribute("data-return-table", TABLE_ID)
  await expect(returnContext).toHaveAttribute("data-return-venue", VENUE_ID)
  await coordinator.getByTestId("action-gate-confirm").click()
  await expect(coordinator).toHaveAttribute("data-active-gate", "age")
  const gate = page.getByTestId("after19-walkthrough")
  await expect(gate).toBeVisible()
  await expect(gate).toHaveAttribute("data-check-kind", "age")
  return gate
}

async function expectExactConfirmation(page: Page, draft: string) {
  const confirmation = page.getByTestId("table-detail").getByTestId("table-join-confirmation")
  await expect(confirmation).toHaveAttribute("data-return-table", TABLE_ID)
  await expect(confirmation).toHaveAttribute("data-return-venue", VENUE_ID)
  await expect(confirmation.getByTestId("after19-return")).toContainText(draft)
  return confirmation
}

test("Pulse Table shows canonical place provenance and host-provided gathering fields", async ({ page }) => {
  await openTables(page)
  const active = page.getByTestId(`table-card-${TABLE_ID}`)
  await expect(active).toContainText("Place record")
  await expect(active).toContainText("The host provides the gathering details")
  const gatheringFields = ["table-sample-time", "table-sample-menu", "table-sample-language", "table-sample-cost", "table-sample-participants"]
  let visibleFields = 0
  for (const id of gatheringFields) {
    const field = active.getByTestId(id)
    await expect(field).toHaveCount(1)
    expect((await field.innerText()).trim().length).toBeGreaterThan(0)
    if (await field.isVisible()) visibleFields += 1
  }
  expect(visibleFields).toBeGreaterThanOrEqual(3)
  await expect(page.getByTestId("table-qa-fixtures")).toHaveCount(0)
})

test("After19 success returns to the exact Table/draft, then confirms join and opens Table chat", async ({ page }) => {
  await openTables(page)
  const detail = await openActiveTable(page)
  const draft = "Window seat if available; I speak English and Korean."
  await detail.getByTestId("table-join-draft").fill(draft)
  await detail.getByTestId("table-join").click()

  const gate = await advanceAccountToAge(page)
  await expect(gate).toContainText("Only an eligibility result and expiry are kept in this tab")
  await expect(gate).toContainText("no external provider")
  const cancelBox = await gate.getByTestId("action-gate-cancel").boundingBox()
  expect(cancelBox?.height ?? 0).toBeGreaterThanOrEqual(44)
  await gate.getByTestId("after19-start").click()
  await expect(gate).toBeHidden()

  const confirmation = await expectExactConfirmation(page, draft)
  await confirmation.getByTestId("table-join-confirm").click()
  await detail.getByTestId("table-open-chat").click()

  const conversation = detail.getByTestId("table-chat")
  await expect(conversation).toContainText("Messages and photos remain in this tab")
  await conversation.getByTestId("table-report").click()
  await conversation.getByTestId("table-report-confirm").click()
  await expect(conversation.getByRole("status")).toContainText("Report recorded in this tab")
  await conversation.getByTestId("table-block").click()
  await conversation.getByTestId("table-block-confirm").click()
  await expect(conversation.getByRole("status").filter({ hasText: "Jae is hidden only in this tab" })).toBeVisible()
  await conversation.getByTestId("table-leave").click()
  await conversation.getByTestId("table-leave-confirm").click()
  await expect(detail.getByTestId("table-join")).toBeFocused()
})

test("After19 cancel preserves exact Table/place/draft and returns focus", async ({ page }) => {
  await openTables(page)
  const detail = await openActiveTable(page)
  const draft = "Keep this draft through cancel."
  await detail.getByTestId("table-join-draft").fill(draft)
  await detail.getByTestId("table-join").click()
  const gate = await advanceAccountToAge(page)
  await gate.getByTestId("action-gate-cancel").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toBeHidden()
  await expect(detail).toBeVisible()
  await expect(detail).toHaveAttribute("data-table-id", TABLE_ID)
  await expect(detail).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect(detail.getByTestId("table-join-draft")).toHaveValue(draft)
  await expect(detail.getByTestId("table-join")).toBeFocused()
})

test("After19 fixture-driven failure retries without exposing outcome authoring controls", async ({ page }) => {
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { after19: "failure" } })
  await openTables(page)
  const detail = await openActiveTable(page)
  const draft = "Context stays here."
  await detail.getByTestId("table-join-draft").fill(draft)
  await detail.getByTestId("table-join").click()
  const gate = await advanceAccountToAge(page)
  const coordinator = page.getByTestId("ondo-b-action-gate")
  await gate.getByTestId("after19-start").click()
  await expect(coordinator).toHaveAttribute("data-gate-view", "failure")
  await coordinator.getByTestId("action-gate-retry").click()
  await expect(coordinator).toHaveAttribute("data-gate-view", "intro")
  await expect(page.locator("[data-testid*='outcome']")).toHaveCount(0)
  await gate.getByTestId("after19-start").click()
  await expect(coordinator).toBeHidden()
  await expectExactConfirmation(page, draft)
})

test("Korean short-landscape Table and After19 remain keyboard-contained and accessible", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await openTables(page, "ko")
  await expect(page.getByRole("heading", { name: "펄스 테이블" })).toBeVisible()
  const detail = await openActiveTable(page)
  await detail.getByTestId("table-join").click()
  const gate = await advanceAccountToAge(page)
  await expect(gate).toContainText("외부 공급자·자격증명·문서·원본 신원 정보 없음")
  await expect(gate).toBeFocused()
  const first = gate.getByRole("button").first()
  const last = gate.getByRole("button").last()
  await last.focus()
  await page.keyboard.press("Tab")
  await expect(first).toBeFocused()
  const axe = await new AxeBuilder({ page }).include("[data-testid='after19-walkthrough']").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})
