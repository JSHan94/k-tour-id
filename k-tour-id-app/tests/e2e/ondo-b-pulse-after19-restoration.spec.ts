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

test("Pulse Table shows canonical place provenance, organizer sample fields, and recovery states", async ({ page }) => {
  await openTables(page)
  const active = page.getByTestId(`table-card-${TABLE_ID}`)
  await expect(active).toContainText("Official LOCALDATA venue")
  await expect(active).toContainText("Organizer sample · not official venue data")
  for (const id of ["table-sample-time", "table-sample-menu", "table-sample-language", "table-sample-cost", "table-sample-participants"]) {
    await expect(active.getByTestId(id)).toBeVisible()
  }
  for (const state of ["TABLE-FULL", "TABLE-CANCELLED", "TABLE-ENDED"]) await expect(page.locator(`[data-table-state='${state}']`)).toBeVisible()
  await expect(page.getByTestId("table-view-alternative").first()).toBeVisible()
})

test("After19 success returns to the exact Table/draft, then confirms join and opens a safe group preview", async ({ page }) => {
  await openTables(page)
  const detail = await openActiveTable(page)
  const draft = "Window seat if available; I speak English and Korean."
  await detail.getByTestId("table-join-draft").fill(draft)
  await detail.getByTestId("table-join").click()

  const gate = page.getByTestId("after19-walkthrough")
  await expect(gate).toContainText("Local interactive example")
  await expect(gate).toContainText("No request is sent to an external provider")
  await gate.getByTestId("after19-start").click()
  await gate.getByTestId("gate-success").click()

  const confirmation = detail.getByTestId("table-join-confirmation")
  await expect(confirmation).toHaveAttribute("data-return-table", TABLE_ID)
  await expect(confirmation).toHaveAttribute("data-return-venue", VENUE_ID)
  await expect(confirmation.getByTestId("after19-return")).toContainText(draft)
  await confirmation.getByTestId("table-join-confirm").click()
  await detail.getByTestId("table-open-chat").click()

  const conversation = detail.getByTestId("table-chat")
  await expect(conversation).toContainText("Read-only group conversation example")
  await conversation.getByTestId("table-report").click()
  await conversation.getByTestId("table-report-confirm").click()
  await expect(conversation.getByRole("status")).toContainText("Report saved only in this example")
  await conversation.getByTestId("table-block").click()
  await expect(conversation).toContainText("Participant hidden in this example")
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
  await page.getByTestId("gate-cancel").click()
  await expect(detail).toBeVisible()
  await expect(detail.getByTestId("table-join-draft")).toHaveValue(draft)
  await expect(detail.getByTestId("table-join")).toBeFocused()
})

test("After19 failure retries while unsupported and expired outcomes return without context loss", async ({ page }) => {
  await openTables(page)
  const detail = await openActiveTable(page)
  await detail.getByTestId("table-join-draft").fill("Context stays here.")
  await detail.getByTestId("table-join").click()
  await page.getByTestId("after19-start").click()
  await page.getByTestId("gate-failure-choice").click()
  await expect(page.getByTestId("gate-failure")).toBeVisible()
  await page.getByTestId("gate-retry").click()
  await page.getByTestId("gate-unsupported-choice").click()
  await expect(page.getByTestId("gate-unsupported")).toBeVisible()
  await page.getByTestId("after19-return").click()
  await expect(detail.getByTestId("table-join-draft")).toHaveValue("Context stays here.")

  await detail.getByTestId("table-join").click()
  await page.getByTestId("after19-start").click()
  await page.getByTestId("gate-expired-choice").click()
  await expect(page.getByTestId("after19-expiry-notice")).toBeVisible()
  await page.getByTestId("gate-retry").click()
  await page.getByTestId("gate-cancel").click()
  await expect(detail.getByTestId("table-join-draft")).toHaveValue("Context stays here.")
})

test("Korean short-landscape Table and After19 remain keyboard-contained and accessible", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await openTables(page, "ko")
  await expect(page.getByRole("heading", { name: "펄스 테이블" })).toBeVisible()
  const detail = await openActiveTable(page)
  await detail.getByTestId("table-join").click()
  const gate = page.getByTestId("after19-walkthrough")
  await expect(gate).toContainText("외부 제공기관으로 요청을 보내지 않습니다")
  await expect(gate.getByTestId("after19-start")).toBeFocused()
  await gate.getByTestId("gate-cancel").focus()
  await page.keyboard.press("Tab")
  await expect(gate.getByTestId("after19-start")).toBeFocused()
  const axe = await new AxeBuilder({ page }).include("[data-testid='after19-walkthrough']").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  expect(axe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
})
