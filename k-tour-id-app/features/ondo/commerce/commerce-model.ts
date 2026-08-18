export type PaymentState = "PAY-IDLE" | "PAY-CONFIRMING" | "PAY-PROCESSING" | "PAY-SIMULATED-SUCCESS" | "PAY-FAILED" | "PAY-CANCELLED"

export type CheckoutSnapshot = {
  venueId: string
  displayPriceKRW: number
  settlementToken: "OOKRW"
  settlementTruth: "SIMULATED"
  payment: PaymentState
  stampCount: number
  receiptId?: string
}

export function beginCheckout(current: CheckoutSnapshot): CheckoutSnapshot {
  if (!["PAY-IDLE", "PAY-FAILED", "PAY-CANCELLED"].includes(current.payment)) return current
  return { ...current, payment: "PAY-CONFIRMING", receiptId: undefined }
}

export function processCheckout(current: CheckoutSnapshot): CheckoutSnapshot {
  if (current.payment !== "PAY-CONFIRMING") return current
  return { ...current, payment: "PAY-PROCESSING" }
}

export function finishCheckout(current: CheckoutSnapshot, outcome: "success" | "failure" | "cancel"): CheckoutSnapshot {
  if (!["PAY-PROCESSING", "PAY-CONFIRMING"].includes(current.payment)) return current
  if (outcome === "success") {
    return { ...current, payment: "PAY-SIMULATED-SUCCESS", receiptId: `receipt:${current.venueId}`, stampCount: current.stampCount }
  }
  return { ...current, payment: outcome === "failure" ? "PAY-FAILED" : "PAY-CANCELLED", receiptId: undefined, stampCount: current.stampCount }
}

export function isReadOnlySettlement(snapshot: CheckoutSnapshot) {
  return snapshot.settlementToken === "OOKRW" && snapshot.settlementTruth === "SIMULATED"
}
