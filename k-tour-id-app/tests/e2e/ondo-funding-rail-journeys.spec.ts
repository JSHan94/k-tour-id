import { expect, test, type Page } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(async ({ page }) => {
  installBRuntimeGuard(page)
  await page.route("https://tiles.openfreemap.org/**", route => route.abort("blockedbyclient"))
  await page.emulateMedia({ reducedMotion: "reduce" })
})
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

async function enterWallet(page: Page, query = "") {
  await page.goto(`/${query}`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("onboarding-guest-skip").click()
  await page.getByTestId("nav-id").click()
  await page.getByTestId("wallet-funding-change").click()
}
async function startRail(page: Page, rail: string) {
  await page.locator(`input[value=${rail}]`).check()
  await page.getByTestId("funding-method-save").click()
  await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-phase", "quoted")
}
async function approve(page: Page, outcome?: "failed" | "unknown") {
  const stablecoin = page.getByTestId("stablecoin-funding")
  const isStablecoin = await stablecoin.count() > 0
  if (isStablecoin) {
    await expect(page.getByTestId("funding-quote-continue")).toBeDisabled()
    await stablecoin.getByTestId("stablecoin-connect").click()
    await expect(page.getByTestId("stablecoin-connection-preview")).toHaveAttribute("data-status", "waiting")
    await page.getByTestId("stablecoin-connection-approve").click()
    await expect(page.getByTestId("stablecoin-connection-preview")).toHaveCount(0)
  }
  await page.getByTestId("funding-quote-continue").click()
  await expect(page.getByTestId("funding-authorize")).toBeDisabled()
  if (outcome && !isStablecoin) {
    await page.getByTestId("funding-rail-journey").getByText("Sample outcome", { exact: true }).click()
    await page.getByTestId(`funding-outcome-${outcome}`).click()
  }
  await page.getByTestId("funding-consent").check()
  await page.getByTestId("funding-authorize").click()
  if (isStablecoin) {
    await expect(stablecoin).toHaveAttribute("data-stage", "source_pending")
    if (outcome) {
      const scenario = stablecoin.getByTestId(`stablecoin-status-${outcome}`)
      await scenario.locator("xpath=ancestor::details").locator(":scope > summary").click()
      await scenario.click()
    }
    await stablecoin.getByTestId("stablecoin-check-source").click()
    if (!outcome) {
      await expect(stablecoin).toHaveAttribute("data-stage", "destination_pending")
      await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-credit-committed", "false")
      await stablecoin.getByTestId("stablecoin-check-destination").click()
    }
  }
}

for (const [rail, cardMethod] of [["krw_bank", null], ["card_wallet", "card"], ["card_wallet", "apple_pay"], ["digital_dollar", null]] as const) {
  test(`${rail}/${cardMethod ?? "default"}: quote → authorization → one credit → same travel balance`, async ({ page }) => {
    await enterWallet(page)
    await startRail(page, rail)
    if (cardMethod) await page.getByTestId(`funding-card-${cardMethod}`).click()
    await approve(page)
    await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-phase", "settled")
    await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-credit-committed", "true")
    await expect(page.getByTestId("funding-receipt-balance")).toHaveText("₩90,000")
    await page.getByTestId("funding-sample-use").click()
    await expect(page.getByTestId("funding-source-sheet")).toHaveCount(0)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩90,000")
    await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "none")
    await page.getByTestId("wallet-funding-change").click()
    await expect(page.getByTestId("funding-receipt-balance")).toHaveText("₩90,000")
    await page.getByTestId("funding-sample-use").click()
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩90,000")
  })
}

test("a failure retries with a new quote and adds only one completed top-up", async ({ page }) => {
  await enterWallet(page)
  await startRail(page, "card_wallet")
  await approve(page, "failed")
  await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-phase", "failed")
  await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-credit-committed", "false")
  await page.getByTestId("funding-retry").click()
  await approve(page)
  await expect(page.getByTestId("funding-receipt-balance")).toHaveText("₩90,000")
})

test("unknown status survives closing and resolves the same operation without a second authorization", async ({ page }) => {
  await enterWallet(page)
  await startRail(page, "digital_dollar")
  await approve(page, "unknown")
  await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-phase", "unknown")
  const before = await page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo-b.funding-rail.v1")!).operationId)
  await page.getByTestId("funding-source-sheet").getByRole("button", { name: "Close", exact: true }).click()
  await expect(page.getByTestId("funding-source-sheet")).toHaveCount(0)
  await page.getByTestId("wallet-funding-change").click()
  await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-phase", "unknown")
  await expect(page.getByTestId("funding-authorize")).toHaveCount(0)
  await page.getByTestId("stablecoin-check-source").click()
  await expect(page.getByTestId("stablecoin-funding")).toHaveAttribute("data-stage", "destination_pending")
  await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-credit-committed", "false")
  await page.getByTestId("stablecoin-check-destination").click()
  await expect(page.getByTestId("funding-receipt-balance")).toHaveText("₩90,000")
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo-b.funding-rail.v1")!).operationId)).toBe(before)
})

test("provider inspection requires an explicit sample choice and reload does not invent a restored credit", async ({ page }) => {
  test.setTimeout(60_000)
  await enterWallet(page, "?review=0")
  await page.locator("input[value=krw_bank]").check()
  await expect(page.getByTestId("funding-method-save")).toBeDisabled()
  await expect(page.getByTestId("funding-provider-required")).toBeVisible()
  await page.getByTestId("funding-sample-open").click()
  await expect(page.getByTestId("funding-rail-journey")).toHaveAttribute("data-phase", "quoted")
  await approve(page)
  await expect(page.getByTestId("funding-receipt-balance")).toHaveText("₩90,000")
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-id").click()
  await page.getByTestId("wallet-funding-change").click()
  await expect(page.getByTestId("funding-rail-journey")).toHaveCount(0)
  await expect(page.getByTestId("funding-source-sheet").locator("input[value=krw_bank]")).toBeVisible()
})
