import { expect, test, type Page } from "@playwright/test"
import { installBRuntimeGuard, expectBRuntimeClean } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, info) => { await expectBRuntimeClean(page, info) })
test.setTimeout(90_000)

async function enterBusan(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" })
  // Display/onboarding preferences only: no account, proof, wallet, receipt,
  // application event or private action state is injected by these tests.
  await page.addInitScript(() => {
    if (location.protocol.startsWith("http")) localStorage.setItem("ondo-b.device.v1", JSON.stringify({
      locale: "en", appearancePreference: "dark", onboarding: "ONB-COMPLETE",
    }))
  })
  await page.goto("/?city=busan", { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("maplibre-map")).toHaveAttribute("data-map-state", "ready", { timeout: 30_000 })
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-city", "busan")
}

async function listForQuery(page: Page, query: string) {
  await page.getByTestId("ondo-b-search").fill(query)
  if (await page.getByTestId("ondo-b-map-entry").getAttribute("data-effective-view") !== "list") await page.getByTestId("ondo-b-view-toggle").click()
  await expect(page.getByTestId("ondo-b-list-panel")).toBeVisible()
}

async function mapContext(page: Page) {
  // Observe the painted map and scroll owner, not internal authority objects.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  const map = page.getByTestId("maplibre-map")
  const shell = page.getByTestId("ondo-b-map-entry")
  return {
    city: await shell.getAttribute("data-city"),
    view: await shell.getAttribute("data-effective-view"),
    query: await page.getByTestId("ondo-b-search").inputValue(),
    center: await map.getAttribute("data-map-center"),
    zoom: await map.getAttribute("data-map-zoom"),
    pitch: await map.getAttribute("data-map-pitch"),
    listScroll: await page.getByTestId("ondo-b-list-panel").evaluate(node => node.scrollTop),
  }
}

async function openResearch(page: Page, id: string) {
  await page.getByTestId("researched-food-list").locator(`button[data-research-id='${id}']`).click()
  await expect(page.getByTestId("researched-food-detail")).toHaveAttribute("data-research-id", id)
}

async function expectContext(page: Page, previous: Awaited<ReturnType<typeof mapContext>>) {
  await expect.poll(() => mapContext(page)).toEqual(previous)
  expect(previous.center).toMatch(/^-?\d+\.\d+,-?\d+\.\d+$/)
  expect(Number(previous.zoom)).toBeGreaterThan(0)
}

function researchSheet(page: Page) {
  return page.getByTestId("ondo-sheet").filter({ has: page.getByTestId("researched-food-detail") })
}

test("MAP-RETURN-PUBLIC-001 cancelling an offer restores exact researched place, query, list and camera without creating identity or money state", async ({ page }, info) => {
  await enterBusan(page)
  await listForQuery(page, "해운대")
  const id = "research-busan-living-room-bar"
  await openResearch(page, id)
  const before = await mapContext(page)
  await page.getByTestId("place-offer-open").click()
  await expect(page.locator('[data-testid="ondo-b-id-wallet-commerce"][data-flow8-object="offer"]')).toHaveAttribute("data-origin-venue-id", id)
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
  await page.getByTestId("commerce-origin-return").click()
  await expect(page.getByTestId("researched-food-detail")).toHaveAttribute("data-research-id", id)
  await expect(page.getByTestId("place-offer-open")).toBeFocused()
  await expectContext(page, before)
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
  await expect(page.getByTestId("map-wallet-balance")).toHaveAttribute("data-balance-krw", "60000")
  await page.screenshot({ path: info.outputPath("offer-cancel-exact-research-return.png") })
  await researchSheet(page).locator(":scope > header button").click()
  await expectContext(page, before)
})

test("MAP-RETURN-PUBLIC-002 leaving a reservation draft restores exact place and map while keeping its chosen time and party", async ({ page }, info) => {
  await enterBusan(page)
  await listForQuery(page, "해운대")
  const id = "research-busan-living-room-bar"
  await openResearch(page, id)
  const before = await mapContext(page)
  await page.getByTestId("place-reservation-open").click()
  const reservation = page.getByTestId("reservation-sample")
  await expect(reservation).toHaveAttribute("data-venue-id", id)
  await reservation.getByRole("combobox", { name: "Time · KST" }).selectOption("19:00")
  await reservation.getByRole("combobox", { name: "People" }).selectOption("4")
  await page.getByTestId("reservation-return-place").click()
  await expect(reservation).toHaveCount(0)
  await expect(page.getByTestId("researched-food-detail")).toHaveAttribute("data-research-id", id)
  await expect(page.getByTestId("place-reservation-open")).toBeFocused()
  await expectContext(page, before)
  await page.screenshot({ path: info.outputPath("reservation-draft-exact-research-return.png") })
  await page.getByTestId("place-reservation-open").click()
  await expect(reservation).toHaveAttribute("data-phase", "draft")
  await expect(reservation).toHaveAttribute("data-operation-id", "")
  await expect(reservation.getByRole("combobox", { name: "Time · KST" })).toHaveValue("19:00")
  await expect(reservation.getByRole("combobox", { name: "People" })).toHaveValue("4")
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
  await page.getByTestId("reservation-return-place").click()
  await researchSheet(page).locator(":scope > header button").click()
  await expectContext(page, before)
})

test("MAP-RETURN-PUBLIC-003 supported places stay in the originating city and clearing the filter restores the existing night lens and query", async ({ page }, info) => {
  await enterBusan(page)
  await page.getByTestId("global-after19-toggle").click()
  await page.getByTestId("global-after19-confirm").click()
  await expect(page.getByTestId("ondo-b-map-entry")).toHaveAttribute("data-after19-active", "true")
  await expect(page.getByTestId("global-after19-prompt-layer")).toHaveCount(0)
  await listForQuery(page, "Yeongdo")
  await expect(page.getByTestId("researched-food-list").locator("button[data-research-id='research-busan-sour-yeongdo']")).toBeVisible()
  const before = await mapContext(page)
  await page.getByTestId("map-wallet-balance").click()
  await page.getByTestId("wallet-balance-places").click()
  const shell = page.getByTestId("ondo-b-map-entry")
  await expect(shell).toHaveAttribute("data-city", "busan")
  await expect(shell).toHaveAttribute("data-balance-places-filter", "on")
  await expect(shell).toHaveAttribute("data-after19-active", "true")
  await expect(page.getByTestId("ondo-b-search")).toHaveValue("")
  await page.getByTestId("ondo-b-view-toggle").click()
  const cards = page.getByTestId("researched-food-list").locator("button[data-research-id]")
  await expect(cards).toHaveCount(8)
  expect(await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-research-id")))).toEqual(expect.arrayContaining(["research-busan-momos-yeongdo", "research-busan-sour-yeongdo"]))
  expect(await cards.evaluateAll(nodes => nodes.every(node => node.getAttribute("data-research-id")?.startsWith("research-busan-")))).toBe(true)
  await page.screenshot({ path: info.outputPath("supported-busan-with-preserved-night-lens.png") })
  await page.getByTestId("map-balance-places-filter").click()
  await expect(shell).toHaveAttribute("data-balance-places-filter", "off")
  await expect(shell).toHaveAttribute("data-after19-active", "true")
  await expectContext(page, before)
  await expect(page.getByTestId("researched-food-list").locator("button[data-research-id='research-busan-momos-yeongdo']")).toHaveCount(0)
  await expect(page.getByTestId("researched-food-list").locator("button[data-research-id='research-busan-sour-yeongdo']")).toBeVisible()
})
