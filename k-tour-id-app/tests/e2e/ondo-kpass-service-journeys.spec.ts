import { expect, test, type Page } from "@playwright/test"
import { clickKPassService } from "../helpers/ondo-demo-journey"
import { expectBRuntimeClean, installBRuntimeGuard } from "../helpers/ondo-b-qa"

test.beforeEach(({ page }) => installBRuntimeGuard(page))
test.afterEach(async ({ page }, testInfo) => { await expectBRuntimeClean(page, testInfo) })

const TABLE_ID = "table-seoul-night-bites"

async function choosePass(page: Page, scenario: string) {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("onboarding-guest-skip").click()
  await page.getByTestId("nav-id").click()
  await page.getByTestId("kpass-sample-picker").click()
  await page.getByTestId(`kpass-scenario-${scenario}`).click()
  await expect(page.getByTestId(`kpass-scenario-${scenario}`)).toHaveCount(0)
}

async function joinNightTable(page: Page) {
  await page.getByTestId("nav-tables").click()
  await page.getByTestId(`table-open-${TABLE_ID}`).click()
  await page.getByTestId("table-join").click()
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-active-gate", "account")
  await gate.getByTestId("action-gate-confirm").click()
  await expect(gate).toHaveAttribute("data-active-gate", "age")
}

async function preparePayment(page: Page, benefit: boolean) {
  await clickKPassService(page, "visitor_benefit")
  await page.getByTestId(benefit ? "benefit-accept" : "benefit-decline").click()
  await page.getByTestId("payment-confirm").click()
  const wallet = page.getByTestId("wallet-connect-sheet")
  await wallet.getByRole("button", { name: "Set up travel wallet", exact: true }).click()
  await expect(wallet).toHaveCount(0)
  await page.getByTestId("payment-minimum-consent").getByRole("checkbox").check()
  await page.getByTestId("payment-confirm").click()
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-active-gate", "account")
  await gate.getByTestId("action-gate-confirm").click()
}

test("negative age blocks the real Table join and returns to the same Table", async ({ page }) => {
  await choosePass(page, "under_age")
  await joinNightTable(page)
  await expect(page.getByTestId("kpass-policy-decision")).toHaveAttribute("data-reason", "age_not_eligible")
  await expect(page.getByTestId("kpass-request-age-proof")).toHaveCount(0)
  await expect(page.getByTestId("table-join-confirmation")).toHaveCount(0)
  await page.getByTestId("kpass-policy-return").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
  await expect(page.getByTestId("table-detail")).toHaveAttribute("data-table-id", TABLE_ID)
  await expect(page.getByTestId("table-join")).toBeVisible()
  await expect(page.getByTestId("table-open-chat")).toHaveCount(0)
})

test("missing age is recovered in the original Table flow before one explicit join", async ({ page }, testInfo) => {
  await choosePass(page, "age_unknown")
  await joinNightTable(page)
  await expect(page.getByTestId("kpass-policy-decision")).toHaveAttribute("data-reason", "age_proof_required")
  await page.getByTestId("kpass-request-age-proof").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
  await expect(page.getByTestId("table-join-confirmation")).toBeVisible()
  await page.getByTestId("table-join-confirm").click()
  await expect(page.getByTestId("table-open-chat")).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("table-after-age-proof.png") })
})

test("an expired stay declines the benefit without discarding the checkout", async ({ page }, testInfo) => {
  await choosePass(page, "stay_expired")
  await preparePayment(page, true)
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-active-gate", "payment_kyc")
  await gate.getByTestId("action-gate-confirm").click()
  await expect(page.getByTestId("kpass-policy-decision")).toHaveAttribute("data-reason", "stay_expired")
  await page.getByTestId("kpass-policy-return").click()
  await expect(page.getByTestId("ondo-b-action-gate")).toHaveCount(0)
  await expect(page.getByTestId("payment-confirm")).toBeVisible()
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
  await expect(page.getByTestId("commerce-voucher")).toHaveAttribute("data-benefit-recommendation", "declined")
  await expect(page.getByTestId("payment-confirm")).toContainText("₩22,000")
  const consent = page.getByTestId("payment-minimum-consent").getByRole("checkbox")
  // Removing the optional benefit changes the amount; the earlier approval
  // must not authorize the repriced checkout or trigger an automatic payment.
  await expect(consent).not.toBeChecked()
  await page.getByTestId("payment-confirm").click()
  await expect(page.getByTestId("payment-minimum-consent")).toHaveAttribute("data-prompted", "true")
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
  await expect(page.getByTestId("payment-operation")).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath("expired-stay-repriced-fresh-consent.png") })
  await consent.check()
  await page.getByTestId("payment-confirm").click()
  await expect(page.getByTestId("payment-receipt")).toBeVisible()
})

test("a funded wallet and completed payment KYC do not override a spent K-Pass allowance", async ({ page }) => {
  await choosePass(page, "limit_reached")
  await preparePayment(page, false)
  const gate = page.getByTestId("ondo-b-action-gate")
  await expect(gate).toHaveAttribute("data-active-gate", "payment_kyc")
  await gate.getByTestId("action-gate-confirm").click()
  await expect(page.getByTestId("kpass-policy-decision")).toHaveAttribute("data-reason", "payment_limit_reached")
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
  await page.getByTestId("kpass-policy-return").click()
  await expect(page.getByTestId("payment-confirm")).toBeVisible()
  await expect(page.getByTestId("commerce-voucher")).toHaveAttribute("data-voucher-state", "available")
})
