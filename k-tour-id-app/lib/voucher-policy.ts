import type { Voucher, VoucherStatus } from "@/lib/types"

export function effectiveVoucherStatus(voucher: Voucher, now = Date.now()): VoucherStatus {
  if (voucher.status === "available" && new Date(voucher.expiresAt).getTime() <= now) return "expired"
  return voucher.status
}

export function isVoucherAvailable(voucher?: Voucher, now = Date.now()): voucher is Voucher {
  return !!voucher && effectiveVoucherStatus(voucher, now) === "available"
}
