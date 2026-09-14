import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard, sessionState } from "../helpers/ondo-b-qa"

const VENUE_ID = "mois-0344e946ef62e4a3434e"
const PLACE_URL = `/?city=busan&venueId=${VENUE_ID}&detail=1`
const RETURN_KEY = "ondo-b.current-action.after19.v2"
const AGE_SESSION_KEY = "ondo-b.after19.session.v1"

// These are public-route tests: no seeded storage, QA globals, frozen clock,
// mocked responses or forced clicks. The same file can run against production.
async function openPlace(page: Page) {
  await page.goto(PLACE_URL, { waitUntil: "domcontentloaded" })
  const place = page.getByTestId("canonical-place-overlay")
  await expect(place).toBeVisible()
  await expect(place).toHaveAttribute("data-venue-id", VENUE_ID)
  await expect(place.locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
  await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "locked")
  return place
}

async function expectTopmost(target: Locator) {
  await target.scrollIntoViewIfNeeded()
  await expect(target).toBeVisible()
  await expect(target).toBeInViewport()
  await expect.poll(() => target.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return !element.closest("[inert],[aria-hidden='true']") && (hit === element || element.contains(hit))
  }), { message: "The action must receive pointer input above the retained place sheet" }).toBe(true)
  await target.click({ trial: true })
}

async function expectGate(page: Page, testInfo: TestInfo, name: string, venueId: string | null = VENUE_ID) {
  const gate = page.getByTestId("global-after19-prompt-layer")
  await expect(gate.getByRole("dialog")).toBeVisible()
  await expect.poll(() => gate.evaluate((element) => element.parentElement?.getAttribute("data-testid"))).toBe("ondo-canvas")
  await expect(gate).toHaveAttribute("data-modal-layer-priority", "140")
  await expect(gate.getByTestId("global-after19-return-context")).toHaveAttribute("data-return-venue", venueId ?? "none")
  await expect(page.locator("[role='dialog'][aria-modal='true']")).toHaveCount(1)
  await expectTopmost(gate.getByTestId("global-after19-confirm"))
  await expectTopmost(gate.getByTestId("global-after19-cancel"))
  const screenshot = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })
  await testInfo.attach(name, { path: screenshot, contentType: "image/png" })
  return gate
}

async function pendingReturn(page: Page) {
  return page.evaluate((key) => {
    const journal = JSON.parse(sessionStorage.getItem(key) ?? "{}") as {
      publicEnvelope?: { tokenId?: string; venueId?: string } | null
      privateUiSnapshot?: { detail?: { scrollTop?: number } } | null
      lastConsumed?: { tokenId?: string; outcome?: string } | null
    }
    return journal
  }, RETURN_KEY)
}

async function expectLocalNightOnly(page: Page) {
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "true")
  await expect(page.getByTestId("global-after19-banner")).toHaveAttribute("data-review-result", "false")
  await expect(page.getByTestId("global-after19-review-toggle")).toHaveCount(0)
  // A Guest's explicit night-view declaration is memory-only. It must not
  // become persisted verified identity, payment eligibility or an age proof.
  await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), AGE_SESSION_KEY)).toBeNull()
  expect(await sessionState(page)).toMatchObject({
    account: "ACC-GUEST", person: "PER-UNVERIFIED", age: "AGE-UNVERIFIED", paymentKyc: "PKY-NOT-STARTED",
  })
}

test.describe("Public place After 19 foreground and exact return", () => {
  test.setTimeout(90_000)
  test.beforeEach(async ({ page }) => { installBRuntimeGuard(page) })
  test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

  for (const presentation of [
    { label: "320 light", project: "mobile-chromium", viewport: { width: 320, height: 640 }, colorScheme: "light" as const },
    { label: "390 dark", project: "mobile-chromium", viewport: { width: 390, height: 844 }, colorScheme: "dark" as const },
    { label: "1440 desktop", project: "desktop-chromium", viewport: { width: 1440, height: 1000 }, colorScheme: "light" as const },
  ]) {
    test(`${presentation.label}: Dongnae place → topmost After 19 → cancel/confirm → same place`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== presentation.project, "Run each presentation only in its intended browser project")
      await page.setViewportSize(presentation.viewport)
      await page.emulateMedia({ colorScheme: presentation.colorScheme })
      const place = await openPlace(page)
      await expect(page.getByTestId("ondo-b-root")).toHaveAttribute("data-appearance", presentation.colorScheme)
      const access = page.getByTestId("canonical-after19-access")
      const unlock = access.getByTestId("canonical-after19-unlock")
      const scrollport = place.locator("[data-place-return-scroll='detail']")

      await unlock.click()
      let gate = await expectGate(page, testInfo, "place-after19-open")
      const beforeCancel = await pendingReturn(page)
      expect(beforeCancel.publicEnvelope?.venueId).toBe(VENUE_ID)
      expect(beforeCancel.privateUiSnapshot?.detail?.scrollTop).toEqual(expect.any(Number))
      await gate.getByTestId("global-after19-cancel").click()
      await expect(gate).toHaveCount(0)
      await expect(place).toBeVisible()
      await expect(unlock).toBeFocused()
      await expect.poll(() => scrollport.evaluate((element) => element.scrollTop)).toBe(beforeCancel.privateUiSnapshot?.detail?.scrollTop)
      await expect(access).toHaveAttribute("data-after19-venue-status", "locked")
      await expect(page).toHaveURL(new RegExp(`venueId=${VENUE_ID}.*detail=1`))
      expect(await pendingReturn(page)).toMatchObject({ publicEnvelope: null, lastConsumed: { tokenId: beforeCancel.publicEnvelope?.tokenId, outcome: "cancel" } })

      await unlock.click()
      gate = await expectGate(page, testInfo, "place-after19-reopened")
      await gate.getByTestId("global-after19-confirm").click()
      await expect(gate).toHaveCount(0)
      await expect(place).toBeVisible()
      await expect(access).toHaveAttribute("data-after19-venue-status", "unlocked")
      await expect(access).toBeFocused()
      await expect(page).toHaveURL(new RegExp(`venueId=${VENUE_ID}.*detail=1`))
      await expectLocalNightOnly(page)

      await place.getByRole("button", { name: "Close place", exact: true }).click()
      await expect(place).toHaveCount(0)
      await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "busan")
      await expectTopmost(page.getByTestId("ondo-b-city-back"))
      await page.getByTestId("ondo-b-city-back").click()
      await expect(page.getByTestId("ondo-b-nation")).toBeVisible()
    })
  }

  test("mobile: pending place return survives reload and cancel restores its exact scroll", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile reload regression")
    await page.setViewportSize({ width: 390, height: 844 })
    await openPlace(page)
    await page.getByTestId("canonical-after19-unlock").click()
    await expectGate(page, testInfo, "before-pending-reload")
    const pending = await pendingReturn(page)
    await page.reload({ waitUntil: "domcontentloaded" })
    const gate = await expectGate(page, testInfo, "after-pending-reload")
    expect((await pendingReturn(page)).publicEnvelope).toEqual(pending.publicEnvelope)
    await expect(page.getByTestId("canonical-place-overlay").locator("[data-detail-state]")).toHaveAttribute("data-detail-state", "ready")
    await gate.getByTestId("global-after19-cancel").click()
    await expect(gate).toHaveCount(0)
    await expect(page.getByTestId("canonical-after19-unlock")).toBeFocused()
    await expect(page.getByTestId("canonical-after19-access")).toHaveAttribute("data-after19-venue-status", "locked")
    await expect.poll(() => page.getByTestId("canonical-place-overlay").locator("[data-place-return-scroll='detail']").evaluate((element) => element.scrollTop)).toBe(pending.privateUiSnapshot?.detail?.scrollTop)
    await expect(page).toHaveURL(new RegExp(`venueId=${VENUE_ID}.*detail=1`))
    expect(await pendingReturn(page)).toMatchObject({ publicEnvelope: null, lastConsumed: { tokenId: pending.publicEnvelope?.tokenId, outcome: "cancel" } })
  })

  test("mobile: map-direct After 19 still cancels to its chip and opens local night view", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Map-direct sibling regression")
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/?city=busan", { waitUntil: "domcontentloaded" })
    const trigger = page.getByTestId("global-after19-toggle")
    await trigger.click()
    let gate = await expectGate(page, testInfo, "map-direct-after19", null)
    await gate.getByTestId("global-after19-cancel").click()
    await expect(gate).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(page.getByTestId("canonical-place-overlay")).toHaveCount(0)
    await trigger.click()
    gate = page.getByTestId("global-after19-prompt-layer")
    await expectTopmost(gate.getByTestId("global-after19-confirm"))
    await gate.getByTestId("global-after19-confirm").click()
    await expect(gate).toHaveCount(0)
    await expectLocalNightOnly(page)
    await page.getByTestId("global-after19-banner").getByRole("button", { name: "Turn off After 19 now" }).click()
    await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "false")
    await expectTopmost(trigger)
  })
})
