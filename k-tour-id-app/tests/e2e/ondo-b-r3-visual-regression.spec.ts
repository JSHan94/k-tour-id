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

async function expectNoOverlap(first: Locator, second: Locator) {
  const [firstBox, secondBox] = await Promise.all([box(first), box(second)])
  const overlapWidth = Math.max(0, Math.min(firstBox.x + firstBox.width, secondBox.x + secondBox.width) - Math.max(firstBox.x, secondBox.x))
  const overlapHeight = Math.max(0, Math.min(firstBox.y + firstBox.height, secondBox.y + secondBox.height) - Math.max(firstBox.y, secondBox.y))
  expect(overlapWidth * overlapHeight).toBe(0)
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

async function expectBackgroundIsolated(page: Page) {
  const content = page.locator("[data-active-tab]")
  const nav = page.getByTestId("ondo-main-nav")
  for (const background of [content, nav]) {
    await expect(background).toHaveAttribute("inert", "")
    await expect(background).toHaveAttribute("aria-hidden", "true")
  }
  await expect(page.locator("[aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
}

async function expectGlobalPromptBackgroundIsolated(page: Page) {
  await expect(page.locator("[data-active-tab]")).not.toHaveAttribute("inert", "")
  for (const background of [page.getByTestId("maplibre-map"), page.getByTestId("ondo-main-nav")]) {
    await expect(background).toHaveAttribute("inert", "")
    await expect(background).toHaveAttribute("aria-hidden", "true")
  }
  await expect(page.locator("[aria-modal='true']:not([aria-hidden='true']):not([inert])")).toHaveCount(1)
}

async function settleFocusFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
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
    if ((page.viewportSize()?.width ?? 0) >= 801) await expectNoOverlap(resultBar, nav)
    else await expectAbove(resultBar, nav, 7)
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

    for (const [tab, id] of [["nav-my", "my"], ["nav-tables", "tables"], ["nav-id", "id"]] as const) {
      await page.getByTestId(tab).click()
      const content = page.locator(`[data-active-tab='${id}']`)
      if ((page.viewportSize()?.width ?? 0) < 801) await expectAbove(content, nav, 7)
      await content.evaluate((element) => { element.scrollTop = element.scrollHeight })
      const lastControl = content.locator("button:visible, a[href]:visible").last()
      await expectFullyVisible(lastControl)
      if ((page.viewportSize()?.width ?? 0) >= 801) await expectNoOverlap(lastControl, nav)
      else await expectAbove(lastControl, nav, 7)
    }
  })

  test("Local Signal success returns once to Place inside 390×844", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-UNVERIFIED" } })
    await openCanonicalVenue(page)
    const place = page.getByTestId("canonical-place-overlay")
    await place.getByTestId("canonical-local-signal-open").click()
    const signal = page.getByTestId("ondo-b-local-signal")
    await signal.getByRole("button", { name: "Calm right now", exact: true }).click()
    await signal.getByRole("textbox", { name: "Optional local note" }).fill("Order at the counter beside the entrance.")
    await signal.getByTestId("local-signal-person-check").click()

    const gate = page.getByTestId("ondo-b-action-gate")
    await expect(gate).toBeVisible()
    await gate.getByTestId("person-route-choice-mobile_id_cx").click()
    await gate.getByTestId("local-check-boundary-continue").click()
    await expect(signal).toHaveAttribute("data-signal-stage", "ready")
    const post = signal.getByTestId("local-signal-post")
    await post.scrollIntoViewIfNeeded()
    await expectFullyVisible(post)
    await post.click()
    await expect(signal).toBeHidden()
    await expect(place).toBeVisible()
    await expect(place.getByTestId("canonical-local-signal-open")).toBeFocused()
  })

  test("declined checkout keeps retry and venue return inside 390×844", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", paymentKyc: "PKY-VERIFIED", stamps: 9 } })
    await openCanonicalVenue(page)
    await page.evaluate(() => {
      ;(window as typeof window & { __ONDO_B_QA__?: { payment?: "failure" } }).__ONDO_B_QA__ = { payment: "failure" }
    })
    const place = page.getByTestId("canonical-place-overlay")
    await place.getByTestId("canonical-meal-benefit-open").click()
    const checkout = page.getByTestId("ondo-b-id-wallet-commerce")
    await checkout.getByTestId("benefit-accept").click()
    await checkout.getByTestId("payment-confirm").click()
    const wallet = page.getByTestId("wallet-connect-sheet")
    await wallet.getByRole("button", { name: "Set up travel wallet", exact: true }).click()
    await expect(wallet).toBeHidden()
    await checkout.getByTestId("payment-minimum-consent").getByRole("checkbox").check()
    await checkout.getByTestId("payment-confirm").click()

    const recovery = checkout.getByTestId("payment-recovery")
    await expect(recovery).toHaveAttribute("data-recovery", "failure")
    await expect(page.getByTestId("ondo-b-action-gate")).toBeHidden()
    const retry = recovery.getByTestId("payment-retry")
    const returnToPlace = recovery.getByRole("button", { name: "Back to place", exact: true })
    await retry.scrollIntoViewIfNeeded()
    await expectFullyVisible(retry)
    await returnToPlace.scrollIntoViewIfNeeded()
    await expectFullyVisible(returnToPlace)
    await returnToPlace.click()
    await expect(place).toBeVisible()
    await expect(place.getByTestId("canonical-meal-benefit-open")).toBeFocused()
  })

  test("CX route, My stamp summary, and ID Labs entry meet serious/critical Axe gate", async ({ page }) => {
    await seedB(page, { session: { persona: "korean_local", account: "ACC-ACTIVE", person: "PER-UNVERIFIED", stamps: 10 } })
    await openCanonicalVenue(page)
    await page.getByTestId("canonical-local-signal-open").click()
    const signal = page.getByTestId("ondo-b-local-signal")
    await signal.getByRole("button", { name: "Calm right now", exact: true }).click()
    await signal.getByRole("textbox", { name: "Optional local note" }).fill("A local ordering tip.")
    await signal.getByTestId("local-signal-person-check").click()
    const gate = page.getByTestId("ondo-b-action-gate")
    await gate.getByTestId("person-route-choice-mobile_id_cx").click()
    await expectNoSeriousAxe(page, page.getByTestId("ondo-b-local-check-walkthrough"))

    await gate.getByTestId("action-gate-cancel").click()
    await expect(signal).toHaveAttribute("data-signal-stage", "cancel")
    await signal.getByRole("button", { name: "Close Local Signal" }).click()
    const place = page.getByTestId("canonical-place-overlay")
    await place.locator("header").getByRole("button", { name: "Back to place summary" }).click()
    await page.getByTestId("canonical-place-peek").getByRole("button", { name: "Close place" }).click()
    await page.getByTestId("nav-my").click()
    await expectNoSeriousAxe(page, page.getByTestId("ondo-b-my-korea-entry"))
    await page.getByTestId("nav-id").click()
    await expectNoSeriousAxe(page, page.getByTestId("ondo-b-traveler-id"))
  })

  test("failed chat image and media truth meet serious/critical Axe gate", async ({ page }) => {
    const chat = await setupBSurface(page, "table-chat", "en")
    await page.evaluate(() => {
      ;(window as typeof window & { __ONDO_B_QA__?: { tableMessage?: "failure" } }).__ONDO_B_QA__ = { tableMessage: "failure" }
    })
    await chat.getByTestId("table-chat-image").setInputFiles({ name: "table-photo.png", mimeType: "image/png", buffer: PNG })
    await chat.getByTestId("table-message-send").click()
    await expect(chat.locator("article[data-state='failed']")).toBeVisible()
    await expect(chat.getByTestId("table-message-retry")).toBeVisible()
    await expectNoSeriousAxe(page, chat)
  })

  test("locked After19 card stays concise while the gate carries the user boundary", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await openCanonicalVenue(page)
    const access = page.getByTestId("canonical-after19-access")
    await expect(access).not.toContainText("ONDO policy")
    const unlock = access.getByTestId("canonical-after19-unlock")
    await expect(unlock).toHaveText("Turn on After 19")
    await unlock.click()
    const prompt = page.getByTestId("global-after19-prompt-layer")
    await expect(prompt).toContainText("Narrows this map to official business types associated with bars and pubs.")
    await prompt.locator("summary").click()
    await expect(prompt).toContainText("simulated OpenDID age-predicate receipt")
    await expect(prompt).toContainText("Your date of birth is never requested or stored")
    await expect(page).toHaveURL(new RegExp(`venueId=${CANONICAL_VENUE_ID}`))
  })

  test("Place detail and the manual After19 prompt isolate their background and restore the opener", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED", age: "AGE-UNVERIFIED" } })
    await openCanonicalVenue(page)
    await expectBackgroundIsolated(page)
    await page.keyboard.press("Escape")
    await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)
    await expect(page.getByTestId("canonical-place-details")).toBeFocused()
    await expect(page.locator("[data-active-tab]")).toHaveAttribute("inert", "")
    await expect(page.getByTestId("ondo-main-nav")).toHaveAttribute("inert", "")

    await page.getByTestId("canonical-place-peek").getByRole("button", { name: "Close place" }).click()
    await expect(page.getByTestId("canonical-place-peek")).toHaveCount(0)
    await expect(page.locator("[data-active-tab]")).not.toHaveAttribute("inert", "")
    await expect(page.getByTestId("ondo-main-nav")).not.toHaveAttribute("inert", "")
    await page.getByTestId("global-after19-toggle").click()
    const prompt = page.getByTestId("global-after19-prompt-layer")
    await expect(prompt).toBeVisible()
    await expectGlobalPromptBackgroundIsolated(page)
    const confirm = prompt.getByTestId("global-after19-confirm")
    const stay = prompt.getByTestId("global-after19-cancel")
    const boundary = prompt.locator("summary")
    const autoOpen = prompt.getByRole("switch")
    await expect(confirm).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await settleFocusFrames(page)
    await expect(autoOpen).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(boundary).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(stay).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(boundary).toBeFocused()
    await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")
    await expect(confirm).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(prompt).toHaveCount(0)
    await expect(page.getByTestId("global-after19-toggle")).toBeFocused()
    await expect(page.locator("[data-active-tab]")).not.toHaveAttribute("inert", "")
    await expect(page.getByTestId("ondo-main-nav")).not.toHaveAttribute("inert", "")
  })

  test("nation actions stay concise and four-axis history keeps a readable two-column hierarchy", async ({ page }) => {
    await seedB(page, { session: { account: "ACC-ACTIVE", person: "PER-VERIFIED" } })
    await gotoB(page)

    const nation = page.getByTestId("ondo-b-nation")
    for (const city of ["seoul", "busan"]) {
      const action = nation.locator(`[data-city='${city}']`)
      await expect(action).toHaveAccessibleName(/Open map/)
      await expect(action.locator("[data-region-kind-label]")).toHaveCount(0)
      await expect(action).toHaveText(city === "seoul" ? "Seoul" : "Busan")
      await expect(action.locator("em")).toHaveCount(0)
      await expect(action.locator("strong")).toBeVisible()
    }
    await expectNoSeriousAxe(page, nation)

    await page.getByTestId("nav-id").click()
    const trust = page.getByTestId("ondo-trust-panel")
    const titleBox = await box(trust.locator("header > div").nth(1))
    expect(titleBox.width).toBeGreaterThan(120)

    const axes = trust.locator("[data-axis]")
    await expect(axes).toHaveCount(4)
    for (const axis of await axes.all()) {
      const [iconBox, bodyBox] = await Promise.all([box(axis.locator(":scope > svg")), box(axis.locator(":scope > div"))])
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
    await page.getByTestId("nav-my").click()
    await page.getByTestId("open-labs").click()
    await page.getByTestId("labs-acknowledge").click()
    await page.getByTestId("labs-connect-wallet").click()
    await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")

    const dialog = page.getByRole("dialog", { name: "Labs" })
    await dialog.evaluate((element) => { element.scrollTop = element.scrollHeight })
    const back = page.getByRole("button", { name: "Return to My Korea" })
    await expectFullyVisible(back)
    const backBox = await box(back)
    expect(backBox.width).toBeGreaterThanOrEqual(44)
    expect(backBox.height).toBeGreaterThanOrEqual(44)
    await back.click()
    await expect(page.getByTestId("ondo-b-my-korea-entry")).toBeVisible()

    const opener = page.getByTestId("open-labs")
    await opener.click()
    await expect(page.getByTestId("labs-acknowledge")).toHaveCount(0)
    await expect(page.getByTestId("labs-overlay")).toHaveAttribute("data-wallet-state", "WAL-READY")
    await expect(page.getByRole("button", { name: "Return to My Korea" })).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog", { name: "Labs" })).toHaveCount(0)
    await expect(opener).toBeFocused()
  })
})
