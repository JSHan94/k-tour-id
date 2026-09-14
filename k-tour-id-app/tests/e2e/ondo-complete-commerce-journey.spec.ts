import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

type Scenario = { width: number; locale: "en" | "ko" | "ja"; appearance: "light" | "dark"; asset: "USDC" | "USDT"; signer: "zklogin" | "existing_wallet" }
const EN: Scenario = { width: 390, locale: "en", appearance: "light", asset: "USDC", signer: "zklogin" }
const KO: Scenario = { width: 320, locale: "ko", appearance: "light", asset: "USDC", signer: "existing_wallet" }
const JA: Scenario = { width: 430, locale: "ja", appearance: "dark", asset: "USDT", signer: "existing_wallet" }
const AXES = ["account", "person", "age", "credential", "payment"] as const

async function enterPass(page: Page, scenario: Scenario) {
  await page.setViewportSize({ width: scenario.width, height: 844 })
  await page.emulateMedia({ colorScheme: scenario.appearance, reducedMotion: "reduce" })
  // Device display preferences only. Every account, credential, signer,
  // funding receipt and payment result below comes from a visible action.
  await page.addInitScript(({ locale, appearance }) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance, onboarding: "ONB-COMPLETE" }))
  }, scenario)
  await page.goto("/?city=busan", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", scenario.appearance)
}

async function expand(details: Locator) {
  if (await details.getAttribute("open") === null) await details.locator(":scope > summary").click()
}

async function axes(page: Page) {
  return page.getByTestId("ondo-b-traveler-id").locator(AXES.map(axis => `[data-testid="traveler-id-${axis}"]`).join(",")).evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.getAttribute("data-testid")!.replace("traveler-id-", ""), {
    status: node.getAttribute("data-status"), review: node.getAttribute("data-review-result"),
  }])))
}

async function fundingSnapshot(page: Page) {
  // Read-only duplicate-delivery evidence. No test writes funding state.
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("ondo-b.funding-rail.v1") ?? "null") as {
    operationId: string; phase: string; quote: { quoteId: string }; stablecoin: { sourceStatus: string; destinationStatus: string; signerStatus: string }
  } | null)
}

async function capture(page: Page, info: TestInfo, label: string) {
  expect(await page.locator("html").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true)
  await page.screenshot({ path: info.outputPath(`${label}.png`) })
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const hex = color.match(/^#([a-f\d]{3}|[a-f\d]{6})$/i)?.[1]
    const rgb = hex
      ? (hex.length === 3 ? hex.split("").map(value => value.repeat(2)).join("") : hex).match(/.{2}/g)!.map(value => Number.parseInt(value, 16))
      : color.match(/^rgba?\(([^)]+)\)$/)?.[1].split(/[,\s]+/).map(Number)
    if (!rgb || rgb.length < 3 || rgb.some(value => !Number.isFinite(value)) || (rgb.length === 4 && rgb[3] !== 1)) throw new Error(`Expected an opaque computed color, got ${color}`)
    const linear = rgb.slice(0, 3).map(value => {
      const channel = value / 255
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
    })
    return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722
  }
  const values = [luminance(foreground), luminance(background)]
  return (Math.max(...values) + .05) / (Math.min(...values) + .05)
}

async function expectReadableReceipt(page: Page) {
  // The receipt's decorative pseudo-elements can make axe's color check
  // incomplete. Compare the actual text colors with the opaque theme surfaces.
  const colors = await page.getByTestId("payment-receipt").evaluate(receipt => {
    const card = receipt.querySelector(":scope > section")!
    const cardBackground = getComputedStyle(card).backgroundColor
    const consequence = receipt.querySelector('[data-testid="payment-receipt-consequence"]')!
    const canvas = getComputedStyle(receipt).getPropertyValue("--ondo-canvas").trim()
    return [
      ...[...card.querySelectorAll("div > span, div > strong")].map(node => ({
        kind: node.tagName === "STRONG" ? "amount" : "label",
        text: node.textContent, foreground: getComputedStyle(node).color, background: cardBackground,
      })),
      { kind: "consequence", text: consequence.textContent, foreground: getComputedStyle(consequence).color, background: canvas },
    ]
  })
  expect(colors.map(item => item.kind)).toEqual(expect.arrayContaining(["label", "amount", "consequence"]))
  for (const item of colors) {
    expect.soft(contrastRatio(item.foreground, item.background), `Receipt ${item.kind}: ${item.text}; ${item.foreground} on ${item.background}`).toBeGreaterThanOrEqual(4.5)
  }
}

async function openFunding(page: Page, scenario: Scenario) {
  await page.getByTestId("wallet-funding-change").click()
  const sheet = page.getByTestId("funding-source-sheet")
  await sheet.locator("input[value='digital_dollar']").check()
  await sheet.getByTestId("funding-method-save").click()
  await expect(sheet.getByTestId("funding-rail-journey")).toHaveAttribute("data-phase", "quoted")
  await sheet.getByTestId(`stablecoin-asset-${scenario.asset}`).click()
  await sheet.getByTestId(`stablecoin-signer-${scenario.signer}`).click()
  return sheet
}

async function connect(sheet: Locator) {
  await sheet.getByTestId("stablecoin-connect").click()
  const preview = sheet.getByTestId("stablecoin-connection-preview")
  await expect(preview).toHaveAttribute("data-status", "waiting")
  await expect(preview).toContainText("Sui Testnet")
  await expect(sheet.getByTestId("funding-authorize")).toHaveCount(0)
  await preview.getByTestId("stablecoin-connection-approve").click()
  await expect(preview).toHaveCount(0)
  await expect(sheet.getByTestId("funding-quote-continue")).toBeEnabled()
}

async function issuePassThroughPublicHandoff(page: Page) {
  await page.getByTestId("kpass-start-setup").click()
  const setup = page.getByTestId("k-tour-id-setup")
  await setup.getByTestId("ktour-id-route-mobile-id").click()
  await setup.getByTestId("k-tour-id-consent-approve").click()
  const handoff = setup.getByTestId("k-tour-id-route-step")
  await expect(handoff).toHaveAttribute("data-handoff-state", "ready")
  await handoff.getByTestId("k-tour-id-continue").click()
  await handoff.getByTestId("identity-handoff-approve").click()
  await expect(handoff).toHaveAttribute("data-handoff-state", "approved")
  await handoff.getByTestId("k-tour-id-continue").click()
  const holder = setup.getByTestId("k-tour-id-holder-delivery")
  await expect(holder).toHaveAttribute("data-holder-state", "ready")
  await holder.getByTestId("k-tour-id-continue").click()
  await expect(holder).toHaveAttribute("data-holder-state", "receipt")
  await holder.getByTestId("k-tour-id-continue").click()
  await expect(setup.getByTestId("k-tour-id-credential")).toHaveAttribute("data-issuance-count", "1")
  await setup.getByTestId("k-tour-id-return").click()
  await expect(setup).toHaveCount(0)
  await expect(page.getByTestId("traveler-id-credential")).toHaveAttribute("data-status", "review-draft")
}

async function openTools(page: Page) {
  await page.getByTestId("ondo-b-traveler-id").getByTestId("review-sample-indicator").click()
  await page.getByTestId("integration-demo-open").click()
  const tools = page.getByTestId("integration-demo")
  await expect(tools).toHaveAttribute("data-provenance", "SIMULATED")
  return tools
}

async function closeTools(page: Page, tools: Locator) {
  await page.getByTestId("ondo-sheet").filter({ has: tools }).locator(":scope > header button").click()
  await expect(tools).toHaveCount(0)
}

async function returnToPass(page: Page) {
  await page.getByTestId("payment-receipt-return").click()
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
  const place = page.locator('[data-testid="canonical-place-peek"], [data-testid="canonical-place-overlay"]').filter({ visible: true })
  await expect(place).toBeVisible()
  await place.getByRole("button", { name: /^(Close place|장소 닫기|場所を閉じる)$/ }).click()
  await expect(place).toHaveCount(0)
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
}

for (const scenario of [EN, JA]) {
  test(`COMPLETE-COMMERCE ${scenario.asset} signer to checkout, refund, settlement and recorded events · ${scenario.width}px ${scenario.locale}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000)
    const errors: string[] = []
    page.on("pageerror", error => errors.push(error.message))
    await enterPass(page, scenario)
    const initialAxes = await axes(page)
    const originalBalance = await page.getByTestId("wallet-display-equivalent").textContent()
    const sheet = await openFunding(page, scenario)
    const journey = sheet.getByTestId("funding-rail-journey")
    await connect(sheet)
    expect(await axes(page)).toEqual(initialAxes)
    await sheet.getByTestId("funding-quote-continue").click()
    await expect(sheet.getByTestId("funding-authorize")).toBeDisabled()
    await sheet.getByTestId("funding-consent").check()
    await sheet.getByTestId("funding-authorize").click()
    const operation = await fundingSnapshot(page)
    expect(operation?.operationId).toBeTruthy()
    const route = sheet.getByTestId("stablecoin-funding")
    await expect(route).toHaveAttribute("data-stage", "source_pending")
    await expect(journey).toHaveAttribute("data-credit-committed", "false")
    await sheet.getByTestId("stablecoin-check-source").click()
    await expect(route).toHaveAttribute("data-source-status", "confirmed")
    await expect(route).toHaveAttribute("data-stage", "destination_pending")
    await expect(journey).toHaveAttribute("data-credit-committed", "false")
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText(originalBalance ?? "")
    expect(await axes(page)).toEqual(initialAxes)
    await capture(page, testInfo, "01-source-confirmed-not-credited")
    await sheet.getByTestId("stablecoin-check-destination").click()
    await expect(route).toHaveAttribute("data-destination-status", "confirmed")
    await expect(journey).toHaveAttribute("data-credit-committed", "true")
    await expect(sheet.getByTestId("stablecoin-receipt")).toContainText(scenario.asset)
    await expect(sheet.getByTestId("funding-receipt-balance")).toHaveText("₩90,000")
    await sheet.getByTestId("funding-sample-use").click()
    await expect(sheet).toHaveCount(0)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩90,000")
    expect(await axes(page)).toEqual(initialAxes)
    // Reopening the same confirmed receipt is a normal public action, not a
    // second deposit or a fresh funding operation.
    await page.getByTestId("wallet-funding-change").click()
    await expect(journey).toHaveAttribute("data-credit-committed", "true")
    expect((await fundingSnapshot(page))?.operationId).toBe(operation!.operationId)
    await sheet.getByTestId("funding-sample-use").click()
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩90,000")

    await issuePassThroughPublicHandoff(page)
    for (const axis of ["person", "age", "payment"]) await expect(page.getByTestId(`traveler-id-${axis}`)).toHaveAttribute("data-status", "none")
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩90,000")
    await expand(page.getByTestId("travel-pass-status"))
    await expand(page.getByTestId("kpass-service-disclosure"))
    await expect(page.getByTestId("kpass-service-payment")).toHaveAttribute("data-status", "needs_proof")
    let tools = await openTools(page)
    await tools.getByTestId("integration-tab-events").click()
    await tools.getByTestId("integration-voucher-issue").click()
    await expect(tools.getByTestId("integration-event")).toHaveCount(3)
    await closeTools(page, tools)

    await page.getByTestId("kpass-service-visitor_benefit").click()
    await page.getByTestId("benefit-accept").click()
    await page.getByTestId("payment-minimum-consent").getByRole("checkbox").check()
    await page.getByTestId("payment-confirm").click()
    const gate = page.getByTestId("ondo-b-action-gate")
    await expect(gate).toHaveAttribute("data-active-gate", "account")
    await gate.getByTestId("action-gate-confirm").click()
    await expect(gate).toHaveAttribute("data-active-gate", "payment_kyc")
    await expect(gate.getByTestId("payment-review-scope")).toBeVisible()
    // The funded signer and K-Tour ID cannot silently satisfy payment KYC.
    await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "none")
    await gate.getByTestId("action-gate-cancel").click()
    await expect(gate).toHaveCount(0)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩90,000")
    await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "none")
    await page.getByTestId("payment-confirm").click()
    await expect(gate).toHaveAttribute("data-active-gate", "payment_kyc")
    await capture(page, testInfo, "02-separate-payment-check")
    await gate.getByTestId("action-gate-confirm").click()
    await expect(gate).toHaveAttribute("data-active-gate", "credential")
    await gate.getByTestId("action-gate-confirm").click()
    await expect(page.getByTestId("payment-receipt")).toHaveAttribute("data-completion-kind", "receipt")
    await capture(page, testInfo, "03-payment-receipt")
    await expectReadableReceipt(page)
    const receiptAudit = await new AxeBuilder({ page }).include('[data-testid="payment-receipt"]').analyze()
    await testInfo.attach("receipt-accessibility", { body: JSON.stringify({ violations: receiptAudit.violations, incomplete: receiptAudit.incomplete }, null, 2), contentType: "application/json" })
    expect.soft(receiptAudit.violations.filter(({ impact }) => impact === "serious" || impact === "critical"), "The completed receipt must remain readable in both themes").toEqual([])
    await returnToPass(page)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩71,000")
    await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-status", "success")
    await expect(page.getByTestId("traveler-id-payment")).toHaveAttribute("data-review-result", "current")
    for (const axis of ["person", "age"]) await expect(page.getByTestId(`traveler-id-${axis}`)).toHaveAttribute("data-status", "none")
    const paidAxes = await axes(page)

    tools = await openTools(page)
    await tools.getByTestId("integration-tab-settlements").click()
    await tools.getByTestId("integration-settlement-start").click()
    await expect(tools.getByTestId("integration-settlement-state")).toHaveAttribute("data-status", "settled")
    await tools.getByTestId("integration-tab-events").click()
    await expect(tools.getByTestId("integration-event")).toHaveCount(6)
    for (const type of ["KPassIssued", "WalletLinked", "PaymentAuthorized", "VoucherIssued", "VoucherRedeemed", "PartnerSettlementLogged"]) {
      const event = tools.locator(`[data-testid="integration-event"][data-event-type="${type}"]`)
      await expect(event).toHaveCount(1)
      await event.getByTestId(`integration-event-${type}`).click()
      await expect(event).toHaveAttribute("data-event-state", "recorded")
    }
    await capture(page, testInfo, "04-six-recorded-events")
    await closeTools(page, tools)

    const activity = page.getByTestId("wallet-activity-receipt")
    await expand(activity)
    const paymentReference = await activity.locator("code").first().textContent()
    await activity.getByTestId("wallet-activity-refund").click()
    await expect(activity.getByTestId("wallet-activity-refund")).toHaveCount(0)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩90,000")
    await expect(activity.locator("code").first()).toHaveText(paymentReference!)
    expect(await axes(page)).toEqual(paidAxes)
    expect((await fundingSnapshot(page))?.operationId).toBe(operation!.operationId)
    tools = await openTools(page)
    await tools.getByTestId("integration-tab-settlements").click()
    await expect(tools.getByTestId("integration-settlement-state")).toHaveAttribute("data-status", "mismatched")
    await expect(tools.getByText("₩0", { exact: true })).toBeVisible()
    await tools.getByTestId("integration-settlement-start").click()
    await expect(tools.getByTestId("integration-settlement-state")).toHaveAttribute("data-status", "settled")
    await capture(page, testInfo, "05-refund-reconciled")
    await tools.getByTestId("integration-tab-events").click()
    await expect(tools.getByTestId("integration-event")).toHaveCount(7)
    const settlementEvents = tools.locator('[data-testid="integration-event"][data-event-type="PartnerSettlementLogged"]')
    await expect(settlementEvents).toHaveCount(2)
    await tools.getByTestId("integration-event-PartnerSettlementLogged").click()
    await expect(settlementEvents.nth(1)).toHaveAttribute("data-event-state", "recorded")
    await expect(tools.locator('[data-testid="integration-event"][data-event-state="recorded"]')).toHaveCount(7)
    await expect(tools.locator('[data-event-type="PaymentAuthorized"]')).toHaveCount(1)
    await expect(tools.locator('[data-event-type="VoucherRedeemed"]')).toHaveCount(1)
    await closeTools(page, tools)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText("₩90,000")
    expect(await axes(page)).toEqual(paidAxes)
    expect(errors).toEqual([])
  })
}

for (const [scenario, outcome] of [[KO, "declined"], [JA, "timed_out"]] as const) {
  test(`COMPLETE-COMMERCE wallet ${outcome} and transfer cancel keep balance and every identity axis unchanged · ${scenario.width}px ${scenario.locale}`, async ({ page }, testInfo) => {
    await enterPass(page, scenario)
    const beforeAxes = await axes(page)
    const beforeBalance = await page.getByTestId("wallet-display-equivalent").textContent()
    const sheet = await openFunding(page, scenario)
    const original = await fundingSnapshot(page)
    await sheet.getByTestId("stablecoin-connect").click()
    const preview = sheet.getByTestId("stablecoin-connection-preview")
    if (outcome === "declined") await preview.getByTestId("stablecoin-connection-decline").click()
    else {
      await expand(preview.locator("details"))
      await preview.getByTestId("stablecoin-connection-timeout").click()
    }
    await expect(preview).toHaveAttribute("data-status", outcome)
    await expect(sheet.getByTestId("funding-receipt-balance")).toHaveCount(0)
    expect(await fundingSnapshot(page)).toEqual(original)
    expect(await axes(page)).toEqual(beforeAxes)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText(beforeBalance ?? "")
    await capture(page, testInfo, `wallet-${outcome}`)
    const scan = await new AxeBuilder({ page }).include('[data-testid="funding-source-sheet"]').analyze()
    expect(scan.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([])
    await preview.getByTestId("stablecoin-connection-retry").click()
    await expect(preview).toHaveAttribute("data-status", "waiting")
    await preview.getByTestId("stablecoin-connection-return").click()
    await expect(sheet.getByTestId("funding-quote-continue")).toBeDisabled()
    await expect(sheet.getByTestId("stablecoin-connect")).toBeFocused()
    await connect(sheet)
    await sheet.getByTestId("funding-quote-continue").click()
    await sheet.getByTestId("funding-consent").check()
    await sheet.getByTestId("funding-cancel").click()
    await expect(sheet.getByTestId("funding-rail-journey")).toHaveAttribute("data-phase", "cancelled")
    await expect(sheet.getByTestId("funding-rail-journey")).toHaveAttribute("data-credit-committed", "false")
    await expect(sheet.getByTestId("funding-receipt-balance")).toHaveCount(0)
    expect(await axes(page)).toEqual(beforeAxes)
    await expect(page.getByTestId("wallet-display-equivalent")).toHaveText(beforeBalance ?? "")
  })
}

test("COMPLETE-COMMERCE Labs route completion is read-only for consumer funding, balance and identity", async ({ page }, testInfo) => {
  await enterPass(page, EN)
  const beforeAxes = await axes(page)
  const beforeBalance = await page.getByTestId("wallet-display-equivalent").textContent()
  const beforeFunding = await fundingSnapshot(page)
  await page.getByTestId("nav-my").click()
  await page.getByTestId("open-labs").click()
  const acknowledge = page.getByTestId("labs-acknowledge")
  if (await acknowledge.isVisible()) await acknowledge.click()
  const labs = page.getByTestId("labs-overlay")
  await expect(labs).toBeVisible()
  const assetAmounts = await labs.getByTestId("labs-consumer-balances").locator("strong").allTextContents()
  await labs.getByTestId("labs-connect-wallet").click()
  await expect(labs).toHaveAttribute("data-wallet-state", "WAL-READY")
  await labs.getByTestId("labs-bridge-quote").click()
  await labs.getByTestId("labs-bridge-confirm").click()
  await labs.getByTestId("labs-bridge-submit").click()
  for (let step = 0; step < 5 && await labs.getAttribute("data-bridge-state") === "BRG-PENDING"; step++) await labs.getByTestId("labs-bridge-advance").click()
  await expect(labs).toHaveAttribute("data-bridge-state", "BRG-SIMULATED-SUCCESS")
  await expect(labs.getByTestId("labs-bridge-receipt")).toContainText("balances and transactions unchanged")
  expect(await labs.getByTestId("labs-consumer-balances").locator("strong").allTextContents()).toEqual(assetAmounts)
  expect(await fundingSnapshot(page)).toEqual(beforeFunding)
  await capture(page, testInfo, "labs-read-only-route")
  await labs.getByTestId("labs-back").click()
  await expect(labs).toHaveCount(0)
  await page.getByTestId("nav-id").click()
  expect(await axes(page)).toEqual(beforeAxes)
  await expect(page.getByTestId("wallet-display-equivalent")).toHaveText(beforeBalance ?? "")
  await expect(page.getByTestId("wallet-activity-receipt")).toHaveCount(0)
})
