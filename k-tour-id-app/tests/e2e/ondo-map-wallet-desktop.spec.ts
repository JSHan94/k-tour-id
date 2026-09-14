import { expect, test, type Locator, type Page } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, info) => { await expectBRuntimeClean(page, info) })
test.setTimeout(100_000)

async function rectangle(locator: Locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

async function separated(first: Locator, second: Locator, collectRemainingEvidence = false) {
  const [a, b] = await Promise.all([rectangle(first), rectangle(second)])
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  const assertion = collectRemainingEvidence ? expect.soft : expect
  assertion(width <= 0 || height <= 0, `Independent controls must not overlap: ${JSON.stringify({ first: a, second: b })}`).toBe(true)
  return { first: a, second: b }
}

async function reachableControl(page: Page, locator: Locator, minimumHeight = 44) {
  await locator.scrollIntoViewIfNeeded()
  const box = await rectangle(locator)
  const viewport = page.viewportSize()!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(minimumHeight)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
  expect(await locator.evaluate(node => {
    const bounds = node.getBoundingClientRect()
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    return !!hit && (node === hit || node.contains(hit))
  }), "The visible control must not be covered by another panel").toBe(true)
  return box
}

for (const scenario of [
  { width: 1440, height: 1000, locale: "en", appearance: "light" },
  { width: 768, height: 1024, locale: "ko", appearance: "dark" },
] as const) {
  test(`MW-DESKTOP-${scenario.width} ${scenario.locale} ${scenario.appearance}: map, exact place offer, cancel and shared wallet stay usable`, async ({ page }, info) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height })
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scenario.appearance })
    // Display/onboarding preferences only. No account, proof, balance, receipt,
    // backend response or private application event is injected.
    await page.addInitScript(({ locale, appearance }) => {
      if (location.protocol.startsWith("http")) localStorage.setItem("ondo-b.device.v1", JSON.stringify({
        locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE",
      }))
    }, scenario)
    await page.goto("/?city=jeju", { waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-state", "ready", { timeout: 30_000 })
    const shell = page.getByTestId("ondo-b-map-entry")
    const balance = page.getByTestId("map-wallet-balance")
    await expect(balance).toHaveAttribute("data-balance-krw", "60000")
    const geometry: Record<string, unknown> = {}
    geometry.search = await separated(page.getByTestId("ondo-b-search"), balance)
    // The compact search-row balance chip is intentionally 40px high; primary
    // place and checkout actions below retain their 44px minimum.
    geometry.balance = await reachableControl(page, balance, 40)
    const searchShell = await rectangle(page.getByTestId("ondo-b-search-shell"))
    const chip = await rectangle(balance)
    expect(chip.x + chip.width).toBeLessThanOrEqual(searchShell.x + searchShell.width + 1)
    await page.screenshot({ path: info.outputPath("map-search-balance.png") })

    if (await shell.getAttribute("data-effective-view") !== "list") await page.getByTestId("ondo-b-view-toggle").click()
    const placeId = "research-jeju-yaksuteo-olle-market"
    await page.getByTestId("researched-food-list").locator(`button[data-research-id="${placeId}"]`).click()
    await expect(page.getByTestId("researched-food-detail")).toHaveAttribute("data-research-id", placeId)
    const offer = page.getByTestId("place-offer-open")
    const reservation = page.getByTestId("place-reservation-open")
    geometry.placeActions = await separated(offer, reservation)
    geometry.offer = await reachableControl(page, offer)
    geometry.reservation = await reachableControl(page, reservation)
    await page.screenshot({ path: info.outputPath("research-service-actions.png") })
    await offer.click()
    const checkout = page.locator('[data-testid="ondo-b-id-wallet-commerce"][data-flow8-object="offer"]')
    await expect(checkout).toHaveAttribute("data-origin-venue-id", placeId)
    await expect(page.getByTestId("commerce-place-context")).toHaveAttribute("data-venue-id", placeId)
    await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
    await page.getByTestId("benefit-decline").click()
    const consent = page.getByTestId("payment-minimum-consent")
    await consent.getByRole("checkbox").check()
    const confirm = page.getByTestId("payment-confirm")
    const cancel = page.getByTestId("payment-cancel")
    // A soft geometry assertion keeps this case failed while still recording
    // the remaining cancellation, balance and supported-map evidence.
    geometry.checkoutConsent = await separated(consent, checkout.locator('[data-flow8-decision="payment"]'), true)
    geometry.consentLabel = await reachableControl(page, consent.locator("label"))
    geometry.checkoutActions = await separated(confirm, cancel)
    geometry.confirm = await reachableControl(page, confirm)
    geometry.cancel = await reachableControl(page, cancel)
    await page.screenshot({ path: info.outputPath("checkout-consent-actions.png") })
    // Explicit place return is the cancellation boundary: no payment is sent.
    await page.getByTestId("commerce-origin-return").click()
    await expect(checkout).toHaveCount(0)
    await expect(page.getByTestId("researched-food-detail")).toHaveAttribute("data-research-id", placeId)
    await expect(offer).toBeFocused()
    await expect(balance).toHaveAttribute("data-balance-krw", "60000")
    await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
    await page.getByTestId("ondo-sheet").filter({ has: page.getByTestId("researched-food-detail") }).locator(":scope > header button").click()

    await balance.click()
    await expect(page.getByTestId("wallet-balance")).toBeVisible()
    await expect(page.getByTestId("wallet-order-select")).toHaveCount(0)
    // Use the visible sample-wallet setup to reveal the existing shared balance;
    // setting up the wallet does not authorize a payment or add a receipt.
    await page.getByTestId("wallet-link-open").click()
    const setup = page.getByTestId("wallet-connect-sheet")
    await setup.getByTestId("wallet-setup-scroll").getByRole("button").first().click()
    await expect(setup).toHaveCount(0)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩60,000")
    await expect(page.getByTestId("wallet-order-select")).toHaveCount(0)
    await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
    await page.screenshot({ path: info.outputPath("wallet-shared-balance-no-payment.png") })
    await page.getByTestId("wallet-balance-places").click()
    await expect(shell).toHaveAttribute("data-city", "jeju")
    await expect(shell).toHaveAttribute("data-balance-places-filter", "on")
    await expect(balance).toHaveAttribute("data-balance-krw", "60000")
    geometry.supportedSearch = await separated(page.getByTestId("ondo-b-search"), balance)
    const supportedFilter = page.getByTestId("map-balance-places-filter")
    geometry.supportedControls = await separated(supportedFilter, page.getByTestId("ondo-b-personalization-edit"), true)
    geometry.supportedFilter = await reachableControl(page, supportedFilter, 40)
    geometry.preferences = await reachableControl(page, page.getByTestId("ondo-b-personalization-edit"))
    await page.screenshot({ path: info.outputPath("supported-places-map.png") })
    await info.attach("new-controls-geometry", { body: JSON.stringify(geometry, null, 2), contentType: "application/json" })
    await supportedFilter.click()
    await expect(shell).toHaveAttribute("data-balance-places-filter", "off")
    await expect(shell).toHaveAttribute("data-effective-view", "list")
  })
}
