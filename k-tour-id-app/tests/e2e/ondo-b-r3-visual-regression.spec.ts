import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  CANONICAL_VENUE_ID,
  TABLE_ID,
  expectBRuntimeClean,
  gotoB,
  installBRuntimeGuard,
  openCanonicalVenue,
  prepareBPage,
  seedB,
  setupBSurface,
} from "../helpers/ondo-b-qa"

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")

async function box(locator: Locator) {
  const value = await locator.boundingBox()
  expect(value, `missing geometry for ${await locator.getAttribute("data-testid") ?? await locator.getAttribute("aria-label") ?? "surface"}`).not.toBeNull()
  return value!
}

async function expectAbove(upper: Locator, lower: Locator, gap = 0) {
  const [upperBox, lowerBox] = await Promise.all([box(upper), box(lower)])
  expect(upperBox.y + upperBox.height).toBeLessThanOrEqual(lowerBox.y - gap + 1)
}

async function expectFullyVisible(locator: Locator) {
  await expect(locator).toBeVisible()
  const rect = await box(locator)
  const viewport = locator.page().viewportSize()
  expect(viewport).not.toBeNull()
  expect(rect.x).toBeGreaterThanOrEqual(0)
  expect(rect.y).toBeGreaterThanOrEqual(0)
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport!.width)
  expect(rect.y + rect.height).toBeLessThanOrEqual(viewport!.height)
}

async function expectNoSeriousAxe(page: Page, scope: Locator) {
  const selector = await scope.evaluate((node) => {
    if (!node.id) node.id = `ondo-b-r3-${Math.random().toString(36).slice(2)}`
    return `#${CSS.escape(node.id)}`
  })
  const result = await new AxeBuilder({ page }).include(selector).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  const blocking = result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")
  expect(blocking, blocking.flatMap((violation) => violation.nodes.map((node) => `${violation.id}: ${node.target.join(" > ")}`)).join("\n")).toEqual([])
}

test.describe("ONDO B R3 visual and traveler regression", () => {
  test.beforeEach(async ({ page }) => {
    installBRuntimeGuard(page)
    await prepareBPage(page)
  })

  test.afterEach(async ({ page }) => {
    await expectBRuntimeClean(page)
  })

  test("city list has a non-interactive safe zone above result bar and navigation", async ({ page }) => {
    await seedB(page)
    await gotoB(page)
    await page.locator("[data-city='seoul']").click()
    await page.getByRole("button", { name: "List", exact: true }).click()

    const listPanel = page.getByTestId("ondo-b-venue-list").locator("..")
    const resultBar = page.getByRole("button", { name: "Map", exact: true }).locator("..")
    const nav = page.getByRole("navigation", { name: "Main navigation" })
    await expectAbove(listPanel, resultBar, 7)
    await expectAbove(resultBar, nav, 7)
  })

  test("map fallback keeps its list bounded and removes unavailable map controls", async ({ page }) => {
    await page.route("https://tiles.openfreemap.org/planet", (route) => route.abort("internetdisconnected"))
    await seedB(page)
    await gotoB(page)
    await page.locator("[data-city='seoul']").click()
    const map = page.getByTestId("ondo-b-map-entry")
    await expect(map).toHaveAttribute("data-map-state", "error", { timeout: 20_000 })
    await expect(page.getByRole("button", { name: "My location" })).toHaveCount(0)
    await expect(page.getByRole("link", { name: /OpenFreeMap/ })).toHaveCount(0)
    await expectAbove(page.getByTestId("ondo-b-venue-list").locator(".."), page.getByRole("button", { name: "List", exact: true }).locator(".."), 7)
  })

  test("My Korea, Tables, and ID scroll above the persistent navigation", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", stamps: 10, tableMembershipById: { [TABLE_ID]: "confirmed" } } })
    await gotoB(page)
    const nav = page.getByRole("navigation", { name: "Main navigation" })

    for (const [tab, id] of [["My Korea", "my"], ["Tables", "tables"], ["ID", "id"]] as const) {
      await page.getByRole("button", { name: tab, exact: true }).click()
      const content = page.locator(`[data-active-tab='${id}']`)
      await expectAbove(content, nav, 7)
      await content.evaluate((element) => { element.scrollTop = element.scrollHeight })
      const lastControl = content.locator("button:visible, a[href]:visible").last()
      await expectFullyVisible(lastControl)
      await expectAbove(lastControl, nav, 7)
    }
  })

  test("Local Signal success keeps both return actions inside 390×844", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-signal").click()
    const signal = page.getByTestId("local-signal-overlay")
    await signal.locator("textarea").fill("Order at the counter beside the entrance.")
    await page.getByTestId("local-signal-submit").click()
    await expect(signal).toHaveAttribute("data-signal-status", "submitted")
    await expectFullyVisible(signal.getByRole("button", { name: "Return to venue" }))
    await expectFullyVisible(signal.getByRole("button", { name: "Cancel draft" }))
  })

  test("declined checkout keeps retry and venue return inside 390×844", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 9 } })
    await openCanonicalVenue(page, { query: "scenario=payment-declined" })
    await page.getByTestId("canonical-venue-checkout").click()
    await page.getByTestId("checkout-start").click()
    await page.getByTestId("checkout-confirm").click()
    const checkout = page.getByTestId("checkout-overlay")
    await expect(checkout).toHaveAttribute("data-payment-state", "PAY-FAILED")
    await expectFullyVisible(checkout.getByRole("button", { name: "Try again" }))
    await expectFullyVisible(checkout.getByRole("button", { name: "Return to venue" }))
  })

  test("CX route, My stamp summary, and ID Labs entry meet serious/critical Axe gate", async ({ page }) => {
    await seedB(page, { session: { persona: "korean_local", account: "ACC-ACTIVE", person: "PER-UNVERIFIED", stamps: 10 } })
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-venue-signal").click()
    await page.getByTestId("local-signal-overlay").locator("textarea").fill("A local ordering tip.")
    await page.getByTestId("local-signal-submit").click()
    await expectNoSeriousAxe(page, page.getByTestId("ondo-gate-overlay"))

    await page.getByTestId("ondo-gate-overlay").getByRole("button", { name: "Return to previous screen" }).click()
    await page.getByTestId("local-signal-overlay").getByRole("button", { name: "Cancel draft" }).click()
    await page.getByRole("button", { name: "My Korea", exact: true }).click()
    await expectNoSeriousAxe(page, page.getByTestId("ondo-my-entry"))
    await page.getByRole("button", { name: "ID", exact: true }).click()
    await expectNoSeriousAxe(page, page.getByTestId("ondo-identity-entry"))
  })

  test("failed chat image and media truth meet serious/critical Axe gate", async ({ page }) => {
    const chat = await setupBSurface(page, "table-chat", "en")
    await page.evaluate(() => window.history.replaceState({}, "", `${window.location.pathname}?scenario=media-failed`))
    await chat.locator("input[type='file']").setInputFiles({ name: "table-photo.png", mimeType: "image/png", buffer: PNG })
    await chat.getByRole("button", { name: "Send photo" }).click()
    await expect(chat.locator("[data-message-status='MSG-FAILED']")).toBeVisible()
    await expectNoSeriousAxe(page, chat)
  })

  test("locked After19 copy separates ONDO policy from official place truth", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openCanonicalVenue(page)
    const access = page.getByTestId("canonical-after19-access")
    await expect(access).toContainText("ONDO locks this simulated night preview behind its own 19+ policy.")
    await expect(access).toContainText("This is not an official age restriction")
    await expect(access).toContainText("does not confirm opening hours, alcohol service, admission, or an age restriction")
    await expect(access).toContainText("The official place record stays visible")
    await expect(access).toContainText("identity details never appear on the map")
    await expect(access.getByTestId("canonical-after19-unlock")).toHaveText(/Confirm 19\+ for this preview/)
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
  })

  test("nation actions stay concise and four-axis history keeps a readable two-column hierarchy", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await gotoB(page)

    const nation = page.getByTestId("ondo-b-nation")
    for (const city of ["seoul", "busan"]) {
      const action = nation.locator(`[data-city='${city}']`)
      await expect(action.locator("small")).toHaveText("Open food map")
      const clips = await action.locator("small").evaluate((element) => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
      expect(clips).toBe(false)
    }
    await expectNoSeriousAxe(page, nation)

    await page.getByRole("button", { name: "ID", exact: true }).click()
    const trust = page.getByTestId("ondo-trust-panel")
    const [titleBox, countBox] = await Promise.all([box(trust.locator("header > div")), box(trust.locator("header > span"))])
    expect(titleBox.width).toBeGreaterThan(120)
    expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(countBox.x - 8)

    for (const axis of await trust.locator("article").all()) {
      const [iconBox, bodyBox] = await Promise.all([box(axis.locator("span").first()), box(axis.locator("div").first())])
      expect(iconBox.x + iconBox.width).toBeLessThanOrEqual(bodyBox.x - 8)
      const label = axis.locator("strong")
      const value = axis.locator("small")
      await expect(label).toBeVisible()
      await expect(value).toBeVisible()
      expect((await label.textContent())?.trim().length).toBeGreaterThan(0)
      expect((await value.textContent())?.trim().length).toBeGreaterThan(0)
    }
    await expectNoSeriousAxe(page, trust)
  })

  test("Labs keeps a 44px exit available at the deepest scroll and restores the opener", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", stamps: 10 } })
    await gotoB(page)
    await page.getByRole("button", { name: "My Korea", exact: true }).click()
    await page.getByTestId("open-labs-milestone").click()
    await page.getByTestId("labs-acknowledge").click()
    await page.getByTestId("labs-connect-wallet").click()
    await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")

    const dialog = page.getByRole("dialog", { name: "Labs" })
    await dialog.evaluate((element) => { element.scrollTop = element.scrollHeight })
    const back = page.getByRole("button", { name: "Back to My Korea" })
    await expectFullyVisible(back)
    const backBox = await box(back)
    expect(backBox.width).toBeGreaterThanOrEqual(44)
    expect(backBox.height).toBeGreaterThanOrEqual(44)
    await back.click()
    await expect(page.getByTestId("ondo-my-entry")).toBeVisible()

    const opener = page.getByTestId("open-labs-milestone")
    await opener.click()
    await expect(page.getByTestId("labs-acknowledge")).toHaveCount(0)
    await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")
    await expect(page.getByRole("button", { name: "Back to My Korea" })).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog", { name: "Labs" })).toHaveCount(0)
    await expect(opener).toBeFocused()
  })
})
