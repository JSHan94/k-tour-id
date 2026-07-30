import type { DemoClaimKey, DemoJourney, KPassCapsule, UserType, Voucher } from "@/lib/types"

export const DEMO_REQUIRED_CLAIMS: DemoClaimKey[] = [
  "credentialActive",
  "visitorEligibility",
  "tripActive",
  "couponUnused",
]

export const DEFAULT_DEMO_JOURNEY: DemoJourney = {
  stage: "request-ready",
  merchant: "Bukchon Craft House · demo merchant",
  merchantDisplay: "Bukchon Craft House",
  product: "Mother-of-pearl workshop",
  purpose: "Apply the Bukchon foreign-visitor workshop benefit",
  requestId: "REQ-BUK-0730-7A31",
  presentationId: "VP-BUK-0730-B8F2",
  voucherId: "voucher-bukchon-10",
  paymentId: "PAY-BUK-0730-6231",
  settlementId: "STL-BUK-0730-0088",
  receiptId: "RCT-BUK-0730-1842",
  campaignId: "CAM-BUKCHON-2026-07",
  requestedClaims: DEMO_REQUIRED_CLAIMS,
  presentedClaims: [],
  grossKRW: 50_000,
  voucherKRW: 5_000,
  paidKRW: 45_000,
  platformFeeKRW: 675,
  campaignReimbursementKRW: 5_000,
  merchantDueKRW: 49_325,
  createdAt: "2026-07-30T14:32:00+09:00",
}

export function demoClaimValue(key: DemoClaimKey, userType: UserType | null, voucher?: Voucher, capsule?: KPassCapsule | null): boolean {
  if (key === "credentialActive") return capsule?.status === "active"
  if (key === "tripActive") return !!capsule && new Date(capsule.expiresAt).getTime() > Date.now()
  if (key === "ageOver19") return true
  if (key === "visitorEligibility") return userType === "foreigner"
  return voucher?.status === "available"
}

export function voucherMatchesPurchase(
  voucher: Voucher,
  purchase: { merchant: string; service: string; grossKRW: number },
): boolean {
  if (voucher.status !== "available") return false
  if (voucher.redemption !== "single-use") return false
  if (voucher.applicableMerchant && voucher.applicableMerchant !== purchase.merchant) return false
  if (voucher.applicableService && voucher.applicableService !== purchase.service) return false
  if (voucher.minimumSpendKRW && purchase.grossKRW < voucher.minimumSpendKRW) return false
  return true
}
