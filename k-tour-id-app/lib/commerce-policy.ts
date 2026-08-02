import type { CommerceOrder } from "@/lib/types"

const DAY_MS = 86_400_000

/** Shared mock clock policy used by checkout, order creation, fulfilment and refunds. */
export function timingForOrder(itemId: string, fulfilment: CommerceOrder["fulfilment"], optionId: string, paidKRW: number, now = new Date()) {
  const activationAt = new Date(now)
  if (optionId === "today-1830") {
    activationAt.setHours(18, 30, 0, 0)
    if (activationAt <= now) activationAt.setTime(activationAt.getTime() + DAY_MS)
  } else if (optionId.includes("tomorrow")) {
    activationAt.setTime(activationAt.getTime() + DAY_MS)
    activationAt.setHours(optionId.includes("1700") ? 17 : 14, 0, 0, 0)
  } else if (optionId.includes("monday")) {
    activationAt.setDate(activationAt.getDate() + ((8 - activationAt.getDay()) % 7 || 7))
    activationAt.setHours(5, 0, 0, 0)
  } else if (optionId.includes("sat") || optionId.includes("sun")) {
    const targetDay = optionId.includes("sat") ? 6 : 0
    activationAt.setDate(activationAt.getDate() + ((targetDay - activationAt.getDay() + 7) % 7 || 7))
    activationAt.setHours(optionId.includes("1500") ? 15 : 11, 0, 0, 0)
  } else if (fulfilment === "delivery") {
    activationAt.setMinutes(activationAt.getMinutes() + 35)
  } else if (fulfilment === "pickup") {
    activationAt.setHours(20, 0, 0, 0)
    if (activationAt <= now) activationAt.setTime(activationAt.getTime() + DAY_MS)
  }
  const cancellationHours = itemId === "regional-craft-day" ? 48
    : itemId === "insadong-tea" ? 24
      : fulfilment === "delivery" ? 0.5
        : fulfilment === "pickup" ? 1
          : 0
  const cancelDeadline = new Date(activationAt.getTime() - cancellationHours * 3_600_000)
  const alreadyActive = fulfilment === "instant" && optionId === "start-today"
  return {
    activationAt: activationAt.toISOString(),
    cancelDeadline: cancelDeadline.toISOString(),
    refundableKRW: alreadyActive ? Math.floor((paidKRW * 29) / 30) : paidKRW,
    status: alreadyActive ? "used" as const : "paid" as const,
  }
}

export function instantPassState(order: Pick<CommerceOrder, "fulfilment" | "activationAt" | "status">, now = Date.now()) {
  if (order.status === "refunded" || order.fulfilment !== "instant") return order.status
  const activation = new Date(order.activationAt).getTime()
  if (now >= activation + 30 * DAY_MS) return "expired" as const
  if (now >= activation) return "active" as const
  return "scheduled" as const
}
