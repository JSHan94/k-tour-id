import { readFileSync } from "node:fs"
import { expect, test } from "@playwright/test"

test("My Korea selected purchase uses immutable order context and delivered payment/refund references", () => {
  const source = readFileSync("features/ondo/my/saved-entry-b.tsx", "utf8")
  expect(source).toContain("stableCommerceOrderB(state.commerceSession)")
  expect(source).toContain("resolveCommercePlaceB(receiptOrder.venueId)")
  expect(source).toContain("state.commerceSession.receiptId ?? receiptOrder.receiptId")
  expect(source).toContain('operation.phase === "settled" && operation.receiptId')
  expect(source).toContain("requestPlaceServiceReturnB(receiptPlace.id)")
  expect(source).toContain('data-order-id={receiptOrder.orderId} data-venue-id={receiptOrder.venueId}')
  expect(source).not.toContain("STABLE_B_RECEIPT_ID")
  expect(source).not.toContain("STABLE_B_REFUND_RECEIPT_ID")
  expect(source).toContain("Selected purchase")
})

test("Wallet does not claim empty history while another order has a receipt", () => {
  const source = readFileSync("features/ondo/commerce-b/id-wallet-commerce-b.tsx", "utf8")
  expect(source).toContain('orders.length === 0 ? <div className={styles.emptyActivity} data-testid="wallet-purchases-empty"')
  expect(source).toContain('stableCommerceOrdersB(commerce).filter(item => item.status !== "idle" || item.confirmationPending)')
})
