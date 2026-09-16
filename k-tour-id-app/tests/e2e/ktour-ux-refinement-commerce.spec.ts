import { expect, test, type Page } from "@playwright/test"

test.describe.configure({ timeout: 90_000 })
const pageErrors = new WeakMap<Page, string[]>()
test.afterEach(async ({ page }) => { expect(pageErrors.get(page) ?? []).toEqual([]) })

// No injected account/financial state: exercise the same visible mock actions
// as a new visitor. These tests never authorize a real external transaction.
async function openWallet(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await page.getByTestId("nav-id").click()
  await page.getByTestId("wallet-link-open").click()
  await page.getByTestId("wallet-connect-sheet").getByRole("button", { name: "Set up travel wallet", exact: true }).click()
  await expect(page.getByTestId("wallet-balance")).toContainText("60,000")
}

async function completeBankFunding(page: Page) {
  await page.getByRole("radio", { name: /Bank account/ }).check()
  await page.getByTestId("funding-method-save").click()
  await page.getByTestId("funding-quote-continue").click()
  await page.getByTestId("funding-consent").check()
  await page.getByTestId("funding-authorize").click()
  await expect(page.getByTestId("funding-sample-use")).toBeVisible()
}

async function openZestFromWallet(page: Page) {
  await page.getByTestId("wallet-balance-places").click()
  await page.getByTestId("ondo-b-view-toggle").click()
  await page.getByRole("button", { name: "Zest · Korean-ingredient cocktails", exact: true }).click()
  await page.getByTestId("place-offer-open").click()
  await expect(page.getByRole("dialog")).toContainText("Zest")
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  pageErrors.set(page, errors)
  page.on("pageerror", error => errors.push(error.message))
  await page.route("**/*", async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() !== "GET" && request.method() !== "HEAD" && !["127.0.0.1", "localhost"].includes(url.hostname)) {
      await route.abort("blockedbyclient")
      throw new Error(`Unexpected external mutation: ${request.method()} ${url.origin}`)
    }
    await route.continue()
  })
})

test("UX-01/09 Wallet top-up has funding purpose and a completed receipt cannot hijack a new method choice", async ({ page }) => {
  await openWallet(page)
  await expect(page.getByTestId("wallet-add-funds")).not.toContainText("first")
  await page.getByTestId("wallet-add-funds").click()
  await expect(page.getByRole("dialog")).not.toContainText("How would you like to pay?")
  await expect(page.getByRole("radio", { name: /Travel balance/ })).toHaveCount(0)
  await completeBankFunding(page)
  await expect(page.getByTestId("funding-sample-use")).toHaveText("Back to balance")
  await page.getByTestId("funding-sample-use").click()
  await expect(page.getByTestId("wallet-balance")).toContainText("90,000")

  await openZestFromWallet(page)
  await page.getByRole("dialog").getByRole("button", { name: "Change", exact: true }).click()
  await expect(page.getByTestId("funding-method-save")).toBeVisible()
  await expect(page.getByTestId("funding-sample-use")).toHaveCount(0)
  await expect(page.getByRole("radio", { name: /Travel balance/ })).toBeVisible()
  await completeBankFunding(page)
  await expect(page.getByTestId("funding-sample-use")).not.toHaveText("Back to balance")
  await page.getByTestId("funding-sample-use").click()
  const order = page.getByRole("dialog")
  await expect(order).toContainText("Zest")
  await expect(order).toContainText("28,000")
  await expect(order.getByRole("checkbox", { name: /I agree to use my travel balance/ })).not.toBeChecked()
  await expect(page.getByTestId("payment-receipt")).toHaveCount(0)
})

test("UX-02 one refund workflow supports partial then remaining amount and returns to the same place", async ({ page }) => {
  await openWallet(page)
  await openZestFromWallet(page)
  await page.getByRole("checkbox", { name: /I agree to use my travel balance/ }).check()
  await page.getByTestId("payment-confirm").click()
  await page.getByTestId("action-gate-confirm").click()
  await page.getByTestId("action-gate-confirm").click()
  const receipt = page.getByTestId("payment-receipt")
  await expect(receipt).toBeVisible()
  await expect(receipt).toContainText("Zest")
  const paymentReference = await page.getByTestId("commerce-receipt-reference").locator("code").textContent()
  expect(paymentReference).toMatch(/^sample-order:.*:receipt$/)
  await expect(receipt.getByText("Restore this record", { exact: true })).toHaveCount(0)
  const refunds = page.getByTestId("checkout-refund-panel")
  await refunds.locator(":scope > summary").click()
  await page.getByTestId("checkout-refund-amount").fill("5000")
  await page.getByTestId("checkout-refund-submit").click()
  await expect(page.getByTestId("checkout-refund-remaining")).toHaveText("₩23,000")
  await expect(page.getByTestId("checkout-refund-total")).toHaveText("₩5,000")
  await refunds.getByRole("button", { name: "Remaining amount", exact: true }).click()
  await expect(page.getByTestId("checkout-refund-amount")).toHaveValue("23000")
  await page.getByTestId("checkout-refund-submit").click()
  await expect(page.getByTestId("checkout-refund-total")).toHaveText("₩28,000")
  await expect(page.getByTestId("checkout-refund-remaining")).toHaveText("₩0")
  await expect(page.locator('[data-testid="checkout-refund-operation"][data-phase="settled"]')).toHaveCount(2)
  await expect(page.getByTestId("checkout-refund-submit")).toHaveCount(0)
  const refundIds = await page.getByTestId("checkout-refund-operation").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-operation-id")))
  await page.getByTestId("payment-receipt-return").click()
  const detail = page.getByTestId("researched-food-detail")
  await expect(detail).toHaveAttribute("data-research-id", "research-seoul-zest")
  await page.getByTestId("ondo-sheet").filter({ has: detail }).locator(":scope > header button").click()
  await page.getByTestId("nav-my").click()
  const savedReceipt = page.getByTestId("my-korea-selected-purchase")
  await expect(savedReceipt).toHaveAttribute("data-venue-id", "research-seoul-zest")
  await expect(savedReceipt.getByRole("heading", { name: "Zest", exact: true })).toBeVisible()
  await savedReceipt.getByTestId("my-korea-receipt-details").locator(":scope > summary").click()
  await expect(savedReceipt.getByTestId("my-korea-payment-reference")).toContainText(paymentReference!)
  await expect(savedReceipt.getByTestId("my-korea-refund-reference")).toHaveCount(2)
  for (const id of refundIds) await expect(savedReceipt).toContainText(`${id}:receipt`)
  await savedReceipt.getByTestId("my-korea-receipt-place").click()
  await expect(detail).toHaveAttribute("data-research-id", "research-seoul-zest")
})
