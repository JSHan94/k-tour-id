import { expect, test, type Page } from "@playwright/test"
import { gotoB, prepareBPage, seedB, TABLE_ID } from "../helpers/ondo-b-qa"

const VENUE_ID = "mois-0021cd596bc5b2a922ad"
const TABLE_IMAGE = "**/editorial/people/ondo-tables-dinner-v2-landscape.jpg"

async function openTables(page: Page, query = "") {
  await gotoB(page, query)
  await page.getByTestId("nav-tables").click()
  await expect(page.getByTestId("tables-entry")).toBeVisible()
}

async function openDetail(page: Page) {
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  const detail = page.getByTestId("table-detail")
  await expect(detail).toHaveAttribute("data-table-id", TABLE_ID)
  return detail
}

test.beforeEach(async ({ page }) => {
  test.setTimeout(90_000)
  await prepareBPage(page)
})

test("FL003 320px list/detail expose exactly the promised facts and stable image fallbacks", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.route(TABLE_IMAGE, (route) => route.abort("blockedbyclient"))
  await seedB(page)
  await openTables(page)

  const card = page.getByTestId(`table-card-${TABLE_ID}`)
  await expect(card.getByTestId("table-card-image-fallback")).toBeVisible()
  await expect(card.locator("[data-card-teaser='true']")).toHaveCount(3)
  await expect(card.locator("[data-card-teaser='true']").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-fact-kind")))).resolves.toEqual(["time", "seats", "cost"])

  const detail = await openDetail(page)
  await expect(detail.getByTestId("table-detail-image-fallback")).toBeVisible()
  await expect(detail.locator("[data-plan-context='detail'] [data-fact-kind]")).toHaveCount(6)
  await expect(detail.locator("[data-plan-context='detail'] [data-fact-kind]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-fact-kind")))).resolves.toEqual(["time", "seats", "format", "menu", "language", "cost"])

  await page.evaluate(() => {
    document.documentElement.style.setProperty("-webkit-text-size-adjust", "200%")
    document.documentElement.style.setProperty("text-size-adjust", "200%")
  })
  await expect.poll(() => detail.locator("[data-plan-context='detail'] [data-fact-kind]").evaluateAll((facts) => facts.every((fact) => fact.scrollWidth <= fact.clientWidth + 1))).toBe(true)
  expect(await detail.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1)
  const note = detail.getByTestId("table-join-draft")
  const join = detail.getByTestId("table-join")
  await note.scrollIntoViewIfNeeded()
  const noteBox = await note.boundingBox()
  const joinBeforeScroll = await join.boundingBox()
  expect(noteBox).not.toBeNull()
  expect(joinBeforeScroll).not.toBeNull()
  expect(Math.min(noteBox!.x + noteBox!.width, joinBeforeScroll!.x + joinBeforeScroll!.width) - Math.max(noteBox!.x, joinBeforeScroll!.x) > 0
    && Math.min(noteBox!.y + noteBox!.height, joinBeforeScroll!.y + joinBeforeScroll!.height) - Math.max(noteBox!.y, joinBeforeScroll!.y) > 0).toBe(false)
  await join.scrollIntoViewIfNeeded()
  const joinBox = await join.boundingBox()
  expect(joinBox).not.toBeNull()
  expect(joinBox!.x).toBeGreaterThanOrEqual(0)
  expect(joinBox!.x + joinBox!.width).toBeLessThanOrEqual(320)
  expect(joinBox!.y + joinBox!.height).toBeLessThanOrEqual(568)
})

for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
  test(`FL003 Table sheet remains viewport-fixed after panel scroll at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await seedB(page)
    await openTables(page)
    const opener = page.getByTestId(`table-open-${TABLE_ID}`)
    await opener.scrollIntoViewIfNeeded()
    await opener.click()
    const detail = page.getByTestId("table-detail")
    await expect(detail).toBeVisible()
    const box = await detail.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(Math.abs(box!.y)).toBeLessThanOrEqual(1)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
    expect(box!.width).toBeGreaterThanOrEqual(viewport.width - 16)
    expect(Math.abs(box!.height - viewport.height)).toBeLessThanOrEqual(1)
    const join = detail.getByTestId("table-join")
    await join.scrollIntoViewIfNeeded()
    const joinBox = await join.boundingBox()
    expect(joinBox).not.toBeNull()
    expect(joinBox!.x).toBeGreaterThanOrEqual(0)
    expect(joinBox!.x + joinBox!.width).toBeLessThanOrEqual(viewport.width)
    expect(joinBox!.y).toBeGreaterThanOrEqual(0)
    expect(joinBox!.y + joinBox!.height).toBeLessThanOrEqual(viewport.height)
    await detail.locator("header button").first().click()
    await expect(detail).toHaveCount(0)
  })
}

test("FL003 outer close retains one frozen Table through removal and restores its exact opener", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.setViewportSize({ width: 390, height: 844 })
  await seedB(page)
  await openTables(page)
  const opener = page.getByTestId(`table-open-${TABLE_ID}`)
  const detail = await openDetail(page)
  const title = detail.getByRole("heading").first()
  const titleText = await title.textContent()

  await detail.locator("header button").first().click()
  await expect(detail).toHaveAttribute("data-table-presence", "closing")
  await expect(title).toHaveText(titleText ?? "")
  await expect(detail.getByTestId("table-detail-image")).toBeVisible()
  await expect(opener).not.toBeFocused()
  await page.waitForTimeout(140)
  await expect(detail).toBeVisible()
  await expect(title).toHaveText(titleText ?? "")

  await expect(detail).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test("FL003 chat close never morphs back to detail during the retained exit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.setViewportSize({ width: 320, height: 568 })
  await seedB(page, { session: { account: "ACC-ACTIVE", tableMembershipById: { [TABLE_ID]: "confirmed" } } })
  await openTables(page)
  const detail = await openDetail(page)
  await detail.getByTestId("table-open-chat").click()
  const chat = detail.getByTestId("table-chat")
  const compose = chat.getByTestId("table-chat-compose")
  await compose.fill("Keep this exact chat draft")

  await detail.locator("header button").first().click()
  await expect(detail).toHaveAttribute("data-table-presence", "closing")
  await expect(chat).toBeVisible()
  await expect(compose).toHaveValue("Keep this exact chat draft")
  await page.waitForTimeout(140)
  await expect(chat).toBeVisible()
  await expect(detail).toHaveCount(0)
})

test("FL003 dirty hosted profile explicitly guards the outer Table close", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.setViewportSize({ width: 390, height: 844 })
  await seedB(page, { session: { account: "ACC-ACTIVE" } })
  await openTables(page)
  const opener = page.getByTestId(`table-open-${TABLE_ID}`)
  const detail = await openDetail(page)
  const profileOpener = detail.getByTestId("table-host-profile-open")
  await profileOpener.scrollIntoViewIfNeeded()
  await profileOpener.click()
  const profile = detail.getByTestId("profile-entry-panel-table_host")
  const displayName = profile.getByRole("textbox", { name: "Display name", exact: true })
  await displayName.fill("Keep this private draft")

  await detail.locator("header button").first().click()
  await expect(detail).toHaveAttribute("data-table-presence", "open")
  await expect(profile.getByTestId("profile-discard-prompt")).toBeVisible()
  await profile.getByTestId("profile-discard-keep").click()
  await expect(displayName).toHaveValue("Keep this private draft")
  await expect(profile.getByTestId("profile-discard-prompt")).toHaveCount(0)

  await detail.locator("header button").first().click()
  await profile.getByTestId("profile-discard-confirm").click()
  await expect(detail).toHaveAttribute("data-table-presence", "closing")
  await expect(profile.getByTestId("profile-discard-prompt")).toBeVisible()
  await expect(opener).not.toBeFocused()
  await expect(detail).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test("FL003 nonmember direct chat intent remains locked on the same Table detail", async ({ page }) => {
  await seedB(page)
  await openTables(page)
  await page.evaluate(({ tableId, venueId }) => window.dispatchEvent(new CustomEvent("ondo:b:open-table", { detail: { tableId, venueId, mode: "chat" } })), { tableId: TABLE_ID, venueId: VENUE_ID })
  const detail = page.getByTestId("table-detail")
  await expect(detail).toHaveAttribute("data-table-membership", "TMB-NONE")
  await expect(detail).toHaveAttribute("data-chat-access", "CHA-LOCKED")
  await expect(detail.getByTestId("table-chat")).toHaveCount(0)
  await expect(detail.getByTestId("table-chat-locked")).toBeVisible()
})

test("FL003 join network failure retries the same pending Table without opening chat early", async ({ page }) => {
  await seedB(page, {
    session: {
      account: "ACC-ACTIVE",
      person: "PER-VERIFIED",
      age: "AGE-VERIFIED",
      after19: "A19-ON",
    },
  })
  await page.addInitScript(() => { window.__ONDO_B_QA__ = { tableJoin: "network" } })
  await openTables(page, "?qa=1")
  const detail = await openDetail(page)
  await detail.getByTestId("table-join").click()
  const gate = page.getByTestId("ondo-b-action-gate")
  if (await gate.isVisible().catch(() => false)) await gate.getByTestId("after19-start").click()
  await expect(detail.getByTestId("table-join-confirmation")).toBeVisible()
  await detail.getByTestId("table-join-confirm").click()
  await expect(detail).toHaveAttribute("data-table-membership", "TMB-FAILED")
  await expect(detail).toHaveAttribute("data-table-failure", "TFR-NETWORK")
  await expect(detail).toHaveAttribute("data-chat-access", "CHA-LOCKED")
  await expect(detail.getByTestId("table-chat")).toHaveCount(0)
  await detail.getByTestId("table-join").click()
  await expect(detail).toHaveAttribute("data-table-membership", "TMB-CONFIRMED")
  await expect(detail).toHaveAttribute("data-table-failure", "TFR-NONE")
  await expect(detail).toHaveAttribute("data-chat-access", "CHA-OPEN")
})

test("FL003 member composer and safety actions stay reachable on a short keyboard viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await seedB(page, { session: { account: "ACC-ACTIVE", tableMembershipById: { [TABLE_ID]: "confirmed" } } })
  await openTables(page)
  const detail = await openDetail(page)
  await detail.getByTestId("table-open-chat").click()
  const chat = detail.getByTestId("table-chat")
  const composer = chat.getByTestId("table-chat-compose")
  await composer.fill("안녕하세요")
  await page.setViewportSize({ width: 320, height: 390 })
  await composer.focus()
  await chat.getByTestId("table-message-send").scrollIntoViewIfNeeded()
  for (const control of [composer, chat.getByTestId("table-message-send"), chat.getByTestId("table-report"), chat.getByTestId("table-leave")]) {
    await control.scrollIntoViewIfNeeded()
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(390)
  }
  await chat.getByTestId("table-message-send").click()
  await expect(chat.getByText("안녕하세요", { exact: true })).toBeVisible()
})

test("FL003 Leave stays confirmed when its related durable device write is ignored", async ({ page }) => {
  await seedB(page, { session: { account: "ACC-ACTIVE", tableMembershipById: { [TABLE_ID]: "confirmed" } } })
  await openTables(page)
  const detail = await openDetail(page)
  await detail.getByTestId("table-open-chat").click()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && key === "ondo-b.device.v1") return
      return original.call(this, key, value)
    }
  })
  await detail.getByTestId("table-leave").click()
  await detail.getByTestId("table-leave-confirm").click()
  await expect(detail.getByTestId("table-leave-save-error")).toBeVisible()
  await expect(detail).toHaveAttribute("data-table-membership", "TMB-CONFIRMED")
  await expect(detail).toHaveAttribute("data-chat-access", "CHA-OPEN")
})
