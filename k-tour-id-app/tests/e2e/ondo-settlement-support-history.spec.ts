import { expect, test, type Locator, type Page } from "@playwright/test"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

const CASES = [
  { locale: "en", width: 390, appearance: "light", connect: "Set up travel wallet", consent: "Send sample request" },
  { locale: "ko", width: 320, appearance: "dark", connect: "여행 지갑 설정", consent: "샘플 문의 보내기" },
] as const

type Scenario = (typeof CASES)[number]

async function expand(details: Locator) {
  if (await details.getAttribute("open") === null) await details.locator(":scope > summary").click()
}

async function checkout(page: Page, scenario: Scenario) {
  await page.setViewportSize({ width: scenario.width, height: 844 })
  await page.emulateMedia({ colorScheme: scenario.appearance, reducedMotion: "reduce" })
  // Only ordinary display preferences are seeded. The sample credential,
  // wallet, payment, refund and support requests all require visible actions.
  await page.addInitScript(({ locale, appearance }) => {
    localStorage.setItem("ondo-b.device.v1", JSON.stringify({ locale, appearancePreference: appearance }))
  }, scenario)
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("onboarding-guest-skip").click()
  await expect(page.locator("html")).toHaveAttribute("data-ondo-theme", scenario.appearance)
  await page.getByTestId("nav-id").click()
  await page.getByTestId("kpass-sample-picker").click()
  await page.getByTestId("kpass-scenario-adult_visitor").click()
  await expand(page.getByTestId("kpass-service-disclosure"))
  await page.getByTestId("kpass-service-visitor_benefit").click()
  await page.getByTestId("benefit-accept").click()
  await page.getByTestId("payment-confirm").click()
  await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: scenario.connect, exact: true }).click()
  await page.getByTestId("payment-minimum-consent").getByRole("checkbox").check()
  await page.getByTestId("payment-confirm").click()
  for (const expected of ["account", "payment_kyc", "credential"]) {
    const gate = page.getByTestId("ondo-b-action-gate")
    await expect(gate).toHaveAttribute("data-active-gate", expected)
    await gate.getByTestId("action-gate-confirm").click()
  }
  await expect(page.getByTestId("payment-receipt")).toHaveAttribute("data-completion-kind", "receipt")
  await page.getByTestId("payment-receipt-return").click()
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
  const closePlace = page.getByRole("button", { name: /^(Close place|장소 닫기|場所を閉じる)$/, exact: true }).last()
  if (await closePlace.isVisible()) await closePlace.click()
  await page.getByTestId("nav-id").click()
  await expect(page.getByTestId("ondo-b-traveler-id")).toBeVisible()
}

async function openSupport(page: Page) {
  await page.getByTestId("ondo-b-traveler-id").getByTestId("review-sample-indicator").click()
  await page.getByTestId("integration-demo-open").click()
  const tools = page.getByTestId("integration-demo")
  await expect(tools).toHaveAttribute("data-provenance", "SIMULATED")
  await tools.getByTestId("integration-tab-settlements").click()
  await expand(tools.getByTestId("integration-support-panel"))
  return tools
}

async function closeTools(page: Page, tools: Locator) {
  await page.getByTestId("ondo-sheet").filter({ has: tools }).locator(":scope > header button").click()
  await expect(tools).toHaveCount(0)
}

async function supportHistory(tools: Locator) {
  // Read the rendered public record, not engine internals or persisted state.
  return tools.getByTestId("integration-support-history-item").evaluateAll(items => items.map(item => ({
    operationRef: item.getAttribute("data-operation-ref"),
    reason: item.getAttribute("data-reason"),
    ticket: item.querySelector('[data-testid="integration-support-history-ticket"]')?.textContent?.trim(),
    amounts: [...item.querySelectorAll("dl dd")].map(amount => amount.textContent?.trim()),
  })))
}

async function expectSupportReflow(page: Page, tools: Locator) {
  const surfaces = tools.locator('[data-testid="integration-support-request"], [data-testid="integration-support-history"], [data-testid="integration-support-history-item"]')
  const overflowing = await surfaces.evaluateAll(elements => elements
    .filter(element => element.scrollWidth > element.clientWidth + 1)
    .map(element => element.getAttribute("data-testid")))
  expect(overflowing, "Current and historical support summaries must fit the viewport").toEqual([])
  expect(await page.locator("html").evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
}

function krw(text: string) {
  const amount = Number(text.replace(/[^\d.-]/g, ""))
  expect(Number.isFinite(amount) && /\d/.test(text), `Expected a visible KRW balance: ${text}`).toBe(true)
  return amount
}

for (const scenario of CASES) {
  test(`SUPPORT-HISTORY payment then refund keeps both tickets and requires fresh consent · ${scenario.width}px ${scenario.locale} ${scenario.appearance}`, async ({ page }, info) => {
    test.setTimeout(120_000)
    const errors: string[] = []
    page.on("pageerror", error => errors.push(error.message))
    await checkout(page, scenario)
    const balance = page.getByTestId("wallet-display-equivalent")
    const paidBalance = (await balance.textContent())!
    expect(krw(paidBalance)).toBeGreaterThanOrEqual(0)

    let tools = await openSupport(page)
    let request = tools.getByTestId("integration-support-request")
    await tools.getByTestId("integration-support-reason").selectOption("payment")
    await tools.getByTestId("integration-support-start").click()
    await expect(request).toHaveAttribute("data-phase", "review")
    await expect(request).toHaveAttribute("data-reason", "payment")
    await expect(request.locator("dl dd")).toHaveText(["₩19,000", "₩0", "₩19,000"])
    await expect(tools.getByTestId("integration-support-ticket")).toHaveCount(0)
    await expect(tools.getByTestId("integration-support-history-item")).toHaveCount(0)
    await expect(tools.getByTestId("integration-support-new")).toHaveCount(0)
    const paymentOperationRef = (await request.getAttribute("data-operation-ref"))!
    expect(paymentOperationRef).toBeTruthy()
    await expect(tools.getByTestId("integration-support-submit")).toHaveText(scenario.consent)
    await tools.getByTestId("integration-support-submit").click()
    await expect(request).toHaveAttribute("data-phase", "submitted")
    await expect(request).toHaveAttribute("data-operation-ref", paymentOperationRef)
    const paymentTicket = (await tools.getByTestId("integration-support-ticket").textContent())!
    expect(paymentTicket).toMatch(/^sample-ticket:/)
    await expand(tools.getByTestId("integration-support-history"))
    await expect(tools.getByTestId("integration-support-history-item")).toHaveCount(1)
    const paymentHistory = await supportHistory(tools)
    expect(paymentHistory).toEqual([{
      operationRef: paymentOperationRef, reason: "payment", ticket: paymentTicket,
      amounts: ["₩19,000", "₩0", "₩19,000"],
    }])
    await expect(tools.getByTestId("integration-support-new")).toBeEnabled()
    await expect(tools.getByTestId("integration-support-check")).toHaveCount(0)
    await expect(balance).toHaveText(paidBalance)
    await expectSupportReflow(page, tools)
    await tools.getByTestId("integration-support-history").scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`support-payment-ticket-${scenario.width}-${scenario.locale}-${scenario.appearance}.png`) })
    await closeTools(page, tools)

    // The one explicit financial action in this support journey is the refund.
    // It must not rewrite the already-submitted payment inquiry's summary.
    const activity = page.getByTestId("wallet-activity-receipt")
    await expand(activity)
    const receiptRef = (await activity.locator("code").first().textContent())!
    await activity.getByTestId("wallet-activity-refund").click()
    await expect(activity.getByTestId("wallet-activity-refund")).toHaveCount(0)
    await expect.poll(async () => krw((await balance.textContent())!)).toBe(krw(paidBalance) + 19_000)
    const refundedBalance = (await balance.textContent())!
    await expect(activity.locator("code").first()).toHaveText(receiptRef)

    tools = await openSupport(page)
    request = tools.getByTestId("integration-support-request")
    await expect(request).toHaveAttribute("data-phase", "submitted")
    await expect(request).toHaveAttribute("data-operation-ref", paymentOperationRef)
    await expect(request.locator("dl dd")).toHaveText(["₩19,000", "₩0", "₩19,000"])
    await expect(tools.getByTestId("integration-support-ticket")).toHaveText(paymentTicket)
    await expand(tools.getByTestId("integration-support-history"))
    expect(await supportHistory(tools)).toEqual(paymentHistory)

    await tools.getByTestId("integration-support-new").click()
    await expect(tools.getByTestId("integration-support-reason")).toBeFocused()
    await expect(request).toHaveCount(0)
    await expect(tools.getByTestId("integration-support-ticket")).toHaveCount(0)
    expect(await supportHistory(tools)).toEqual(paymentHistory)
    await tools.getByTestId("integration-support-reason").selectOption("refund")
    await tools.getByTestId("integration-support-start").click()
    await expect(request).toHaveAttribute("data-phase", "review")
    await expect(request).toHaveAttribute("data-reason", "refund")
    await expect(request.locator("dl dd")).toHaveText(["₩19,000", "₩19,000", "₩0"])
    const cancelledOperationRef = (await request.getAttribute("data-operation-ref"))!
    expect(cancelledOperationRef).not.toBe(paymentOperationRef)
    await expect(tools.getByTestId("integration-support-submit")).toHaveText(scenario.consent)
    await expect(tools.getByTestId("integration-support-ticket")).toHaveCount(0)
    await tools.getByTestId("integration-support-cancel").click()
    await expect(request).toHaveCount(0)
    expect(await supportHistory(tools)).toEqual(paymentHistory)
    await expect(balance).toHaveText(refundedBalance)

    await tools.getByTestId("integration-support-reason").selectOption("refund")
    await tools.getByTestId("integration-support-start").click()
    await expect(request).toHaveAttribute("data-phase", "review")
    await expect(request).toHaveAttribute("data-reason", "refund")
    await expect(request.locator("dl dd")).toHaveText(["₩19,000", "₩19,000", "₩0"])
    const refundOperationRef = (await request.getAttribute("data-operation-ref"))!
    expect(refundOperationRef).toBeTruthy()
    expect(refundOperationRef).not.toBe(paymentOperationRef)
    expect(refundOperationRef).not.toBe(cancelledOperationRef)
    const sample = tools.getByTestId("integration-support-case")
    await expand(sample.locator(".."))
    await sample.selectOption("unknown")
    // Starting another inquiry cannot reuse the earlier consent or ticket.
    await expect(tools.getByTestId("integration-support-submit")).toHaveText(scenario.consent)
    await expect(tools.getByTestId("integration-support-ticket")).toHaveCount(0)
    expect(await supportHistory(tools)).toEqual(paymentHistory)
    await expect(balance).toHaveText(refundedBalance)
    await tools.getByTestId("integration-support-submit").click()
    await expect(request).toHaveAttribute("data-phase", "unknown")
    await expect(request).toHaveAttribute("data-operation-ref", refundOperationRef)
    await expect(tools.getByTestId("integration-support-submit")).toHaveCount(0)
    await expect(tools.getByTestId("integration-support-start")).toHaveCount(0)
    await expect(tools.getByTestId("integration-support-new")).toHaveCount(0)
    expect(await supportHistory(tools)).toEqual(paymentHistory)
    await expect(balance).toHaveText(refundedBalance)

    // Reopening an unknown result must resume the same request, not submit again.
    await closeTools(page, tools)
    tools = await openSupport(page)
    request = tools.getByTestId("integration-support-request")
    await expect(request).toHaveAttribute("data-phase", "unknown")
    await expect(request).toHaveAttribute("data-operation-ref", refundOperationRef)
    await expect(tools.getByTestId("integration-support-new")).toHaveCount(0)
    await expect(tools.getByTestId("integration-support-submit")).toHaveCount(0)
    await tools.getByTestId("integration-support-check").click()
    await expect(request).toHaveAttribute("data-phase", "submitted")
    await expect(request).toHaveAttribute("data-operation-ref", refundOperationRef)
    await expect(request.locator("dl dd")).toHaveText(["₩19,000", "₩19,000", "₩0"])
    const refundTicket = (await tools.getByTestId("integration-support-ticket").textContent())!
    expect(refundTicket).toMatch(/^sample-ticket:/)
    expect(refundTicket).not.toBe(paymentTicket)
    await expect(tools.getByTestId("integration-support-check")).toHaveCount(0)
    await expect(tools.getByTestId("integration-support-submit")).toHaveCount(0)
    await expand(tools.getByTestId("integration-support-history"))
    const expectedHistory = [...paymentHistory, {
      operationRef: refundOperationRef, reason: "refund", ticket: refundTicket,
      amounts: ["₩19,000", "₩19,000", "₩0"],
    }]
    expect(await supportHistory(tools)).toEqual(expectedHistory)
    await expect(tools.getByTestId("integration-support-history").getByRole("listitem")).toHaveCount(2)
    await expect(balance).toHaveText(refundedBalance)

    // Repeated public status visits cannot create duplicate tickets or credits.
    for (let visit = 0; visit < 2; visit += 1) {
      await closeTools(page, tools)
      await expect(balance).toHaveText(refundedBalance)
      tools = await openSupport(page)
      request = tools.getByTestId("integration-support-request")
      await expect(request).toHaveAttribute("data-phase", "submitted")
      await expect(request).toHaveAttribute("data-operation-ref", refundOperationRef)
      await expect(tools.getByTestId("integration-support-ticket")).toHaveText(refundTicket)
      await expect(tools.getByTestId("integration-support-check")).toHaveCount(0)
      await expand(tools.getByTestId("integration-support-history"))
      expect(await supportHistory(tools)).toEqual(expectedHistory)
    }

    const history = tools.getByTestId("integration-support-history")
    await history.scrollIntoViewIfNeeded()
    await expectSupportReflow(page, tools)
    await page.screenshot({ path: info.outputPath(`support-history-${scenario.width}-${scenario.locale}-${scenario.appearance}.png`) })
    await tools.getByTestId("integration-tab-events").click()
    await expect(tools.locator('[data-testid="integration-event"][data-event-type="PaymentAuthorized"]')).toHaveCount(1)
    await expect(tools.locator('[data-testid="integration-event"][data-event-type="PartnerSettlementLogged"]')).toHaveCount(0)
    await closeTools(page, tools)
    await expect(balance).toHaveText(refundedBalance)
    await expect(activity.locator("code").first()).toHaveText(receiptRef)
    expect(errors).toEqual([])
  })
}
