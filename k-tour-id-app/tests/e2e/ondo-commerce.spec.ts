import { expect, test } from "@playwright/test"
import { beginCheckout, finishCheckout, isReadOnlySettlement, processCheckout, type CheckoutSnapshot } from "../../features/ondo/commerce/commerce-model"

function idle(): CheckoutSnapshot {
  return { venueId: "seoul-seongsu-gukbap", displayPriceKRW: 12_000, settlementToken: "OOKRW", settlementTruth: "SIMULATED", payment: "PAY-IDLE", stampCount: 9 }
}

test("E2E-FL-004 checkout has an ordered state machine and preserves stamps", () => {
  const confirming = beginCheckout(idle())
  const processing = processCheckout(confirming)
  const success = finishCheckout(processing, "success")
  expect([confirming.payment, processing.payment, success.payment]).toEqual(["PAY-CONFIRMING", "PAY-PROCESSING", "PAY-SIMULATED-SUCCESS"])
  expect(success.stampCount).toBe(9)
  expect(success.receiptId).toBe("receipt:seoul-seongsu-gukbap")
})

test("E2E-FL-004 failed and cancelled checkout preserve balances and stamps", () => {
  const processing = processCheckout(beginCheckout(idle()))
  expect(finishCheckout(processing, "failure")).toMatchObject({ payment: "PAY-FAILED", stampCount: 9, settlementToken: "OOKRW" })
  expect(finishCheckout(beginCheckout(idle()), "cancel")).toMatchObject({ payment: "PAY-CANCELLED", stampCount: 9, settlementToken: "OOKRW" })
  expect(isReadOnlySettlement(idle())).toBeTruthy()
})
